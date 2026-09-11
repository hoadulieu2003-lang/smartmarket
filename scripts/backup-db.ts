/**
 * Backup database ra file dump nén (pg_dump -Fc).
 *
 *   npm run db:backup
 *
 * Không cần cài PostgreSQL client trên máy: pg_dump chạy trong container
 * postgres:16 (khớp version server để không dính lỗi "server version mismatch").
 * Dump được ghi ra stdout rồi pipe thẳng vào file — không mount volume, tránh
 * hẳn chuyện đường dẫn Windows (E:\...) khi map vào Docker.
 *
 * Env tuỳ chọn:
 *   BACKUP_DIR   thư mục lưu (mặc định: backend/backups)
 *   BACKUP_KEEP  giữ lại N bản gần nhất, 0 = không dọn (mặc định: 10)
 *   PG_IMAGE     image dùng để chạy pg_dump (mặc định: postgres:16)
 */
import 'dotenv/config';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import dayjs from 'dayjs';

const PG_IMAGE = process.env.PG_IMAGE ?? 'postgres:16';
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.resolve(__dirname, '..', 'backups');
const KEEP = Number(process.env.BACKUP_KEEP ?? 10);

function fail(message: string): never {
  console.error(`⛔ ${message}`);
  process.exit(1);
}

/** Tách DATABASE_URL thành các tham số rời cho pg_dump (bỏ query connection_limit/schema...). */
function parseDbUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return fail('DATABASE_URL không phải URL hợp lệ.');
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!database) return fail('DATABASE_URL thiếu tên database.');

  // Container không tự thấy localhost của máy host — phải đi qua host.docker.internal.
  const rawHost = url.hostname;
  const host = /^(localhost|127\.0\.0\.1|::1)$/.test(rawHost) ? 'host.docker.internal' : rawHost;

  return {
    host,
    rawHost,
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

function requireDocker() {
  const probe = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], {
    encoding: 'utf8',
  });
  if (probe.error)
    fail(
      'Không tìm thấy lệnh docker. Cài Docker Desktop rồi thử lại,\n' +
        '   hoặc cài PostgreSQL 16 client và dùng pg_dump trực tiếp.',
    );
  if (probe.status !== 0)
    // CLI có nhưng daemon chưa lên — lỗi hay gặp nhất, tách riêng cho dễ xử lý.
    fail('Docker daemon chưa chạy. Mở Docker Desktop, đợi khởi động xong rồi chạy lại lệnh này.');

  // Image chưa có thì pull trước, để thanh tiến trình của docker hiện ra thay vì treo im lặng.
  const hasImage = spawnSync('docker', ['image', 'inspect', PG_IMAGE], { stdio: 'ignore' });
  if (hasImage.status !== 0) {
    console.log(`— Chưa có image ${PG_IMAGE}, đang tải về (chỉ lần đầu)...`);
    const pull = spawnSync('docker', ['pull', PG_IMAGE], { stdio: 'inherit' });
    if (pull.status !== 0) fail(`Tải image ${PG_IMAGE} thất bại.`);
  }
}

/** Xoá các bản dump cũ, chỉ giữ KEEP bản mới nhất (tên file có timestamp nên sort được theo tên). */
function pruneOldBackups(prefix: string) {
  if (!Number.isFinite(KEEP) || KEEP <= 0) return;
  const olds = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith(`${prefix}_`) && f.endsWith('.dump'))
    .sort()
    .reverse()
    .slice(KEEP);
  for (const f of olds) fs.rmSync(path.join(BACKUP_DIR, f), { force: true });
  if (olds.length) console.log(`— Đã dọn ${olds.length} bản cũ (giữ lại ${KEEP} bản gần nhất).`);
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) fail('Thiếu DATABASE_URL trong .env');

  const db = parseDbUrl(dbUrl);
  requireDocker();

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const prefix = db.database.replace(/[^a-zA-Z0-9._-]/g, '-');
  const outFile = path.join(BACKUP_DIR, `${prefix}_${dayjs().format('YYYY-MM-DD_HHmmss')}.dump`);

  console.log(`— Backup ${db.rawHost}:${db.port}/${db.database} → ${outFile}`);
  const startedAt = Date.now();

  const args = [
    'run', '--rm',
    '-e', 'PGPASSWORD', // truyền theo env, KHÔNG để mật khẩu lộ trên dòng lệnh
    PG_IMAGE,
    'pg_dump',
    '-h', db.host,
    '-p', db.port,
    '-U', db.user,
    '-d', db.database,
    '-Fc', // custom format: nén sẵn, restore chọn lọc được bằng pg_restore
    '--no-owner',
    '--no-privileges',
  ];

  const out = fs.createWriteStream(outFile);
  const code = await new Promise<number>((resolve, reject) => {
    const child = spawn('docker', args, {
      env: { ...process.env, PGPASSWORD: db.password },
      stdio: ['ignore', 'pipe', 'inherit'], // stderr của pg_dump hiện thẳng ra terminal
    });
    child.stdout.pipe(out);
    child.on('error', reject);
    child.on('close', (c) => out.end(() => resolve(c ?? 1)));
  }).catch((e: Error) => fail(`Không chạy được docker: ${e.message}`));

  if (code !== 0) {
    fs.rmSync(outFile, { force: true }); // đừng để lại file dump dở dang
    fail(`pg_dump thất bại (exit code ${code}). File dở dang đã được xoá.`);
  }

  const bytes = fs.statSync(outFile).size;
  if (bytes === 0) {
    fs.rmSync(outFile, { force: true });
    fail('File dump rỗng — backup không hợp lệ, đã xoá.');
  }

  const mb = (bytes / 1024 / 1024).toFixed(2);
  const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`✅ Xong: ${mb} MB trong ${secs}s`);

  pruneOldBackups(prefix);

  console.log(
    '\nPhục hồi khi cần (⚠️ --clean sẽ ghi đè dữ liệu hiện có):\n' +
      `  docker run --rm -i -e PGPASSWORD="<mật khẩu trong DATABASE_URL>" ${PG_IMAGE} \\\n` +
      `    pg_restore -h ${db.rawHost} -p ${db.port} -U ${db.user} -d ${db.database} \\\n` +
      `    --clean --if-exists --no-owner < "${outFile}"`,
  );
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
