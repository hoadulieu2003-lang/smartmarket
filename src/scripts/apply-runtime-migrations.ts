import fs from 'fs';
import path from 'path';
import { prisma } from '../shared/prisma';

const migrationDirectory = path.resolve(__dirname, '..', '..', 'prisma', 'migrations');

function statementsFrom(sql: string): string[] {
  const withoutLineComments = sql
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');

  return withoutLineComments
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  const files = fs
    .readdirSync(migrationDirectory)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDirectory, file), 'utf8');
    const statements = statementsFrom(sql);
    console.log(`Applying ${file} (${statements.length} statements)...`);
    for (const statement of statements) await prisma.$executeRawUnsafe(statement);
  }

  console.log(`Applied ${files.length} runtime migration files.`);
}

main()
  .catch((error) => {
    console.error('Runtime migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
