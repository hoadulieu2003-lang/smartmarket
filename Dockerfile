FROM node:22 AS build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Sử dụng một image nginx chính thức để phục vụ các file đã build
FROM nginx:stable-alpine AS production-stage

# Copy các file build từ stage trước vào nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf


EXPOSE 80

# Start nginx khi container chạy
CMD ["nginx", "-g", "daemon off;"]
