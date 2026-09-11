# ---------- builder ----------
# Debian slim (không Alpine/musl) để tránh rắc rối binary target của Prisma.
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Prisma engine cần libssl.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Cài deps trước (tận dụng cache). Không có lockfile riêng cho backend => npm install.
COPY package.json ./
RUN npm install

# Generate Prisma client NGAY TRONG image => binary target khớp OS runner.
COPY prisma ./prisma
RUN npx prisma generate

# Build TS -> dist, rồi loại devDependencies (giữ @prisma/client + client đã generate).
COPY . .
RUN npm run build \
  && npm prune --omit=dev

# ---------- runner ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Chỉ mang theo thứ cần chạy.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/openapi.yaml ./openapi.yaml
COPY --from=builder /app/package.json ./package.json

RUN chown -R node:node /app
USER node

EXPOSE 3000
# LƯU Ý: image KHÔNG tự chạy migration (theo quy tắc dự án). Áp migration ngoài image.
CMD ["node", "dist/server.js"]
