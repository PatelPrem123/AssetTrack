# AssetTrack — Production Deployment & Operations Guide

This guide describes how to deploy AssetTrack in production using Docker, Docker Compose, Nginx Reverse Proxy, and PM2 process management.

---

## 1. Docker Production Architecture

AssetTrack can be orchestrated using Docker Compose with an API gateway service, frontend static bundle container, and a secure MongoDB replica set.

### 1.1 `server/Dockerfile`
```dockerfile
FROM node:24-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
EXPOSE 5000

ENV NODE_ENV=production
USER node
CMD ["node", "src/server.js"]
```

### 1.2 `client/Dockerfile`
```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 1.3 `docker-compose.yml`
```yaml
version: '3.8'

services:
  database:
    image: mongo:7.0
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: assettrack_admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongo_data:/data/db
    networks:
      - assettrack_net

  api:
    build: ./server
    restart: always
    environment:
      PORT: 5000
      NODE_ENV: production
      MONGODB_URI: mongodb://assettrack_admin:${MONGO_ROOT_PASSWORD}@database:27017/assettrack?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      COOKIE_SECRET: ${COOKIE_SECRET}
      CLIENT_URL: https://assets.yourcompany.com
    depends_on:
      - database
    networks:
      - assettrack_net

  frontend:
    build: ./client
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    networks:
      - assettrack_net

volumes:
  mongo_data:

networks:
  assettrack_net:
    driver: bridge
```

---

## 2. Nginx Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name assets.yourcompany.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name assets.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/assets.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/assets.yourcompany.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend Single Page App
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # API Ingress
    location /api/v1/ {
        proxy_pass http://api:5000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;

        # Streaming buffer config for Excel & PDF exports
        proxy_buffering off;
        client_max_body_size 25M;
    }
}
```

---

## 3. PM2 Process Management (Bare Metal / VM Deployment)

If deploying directly to Ubuntu / Debian VM:
```bash
# Install PM2 globally
npm install -g pm2

# Start Backend API
cd server
pm2 start src/server.js --name "assettrack-api" -i max --env production

# Ensure startup on server reboot
pm2 startup
pm2 save
```

---

## 4. Production Security Checklist

- [x] Run with `NODE_ENV=production`.
- [x] Rotate `JWT_SECRET` and `COOKIE_SECRET` to cryptographically random strings (min 64 chars).
- [x] Enforce TLS 1.3 across all client and API traffic.
- [x] Ensure MongoDB port `27017` is bound exclusively to `127.0.0.1` or internal Docker network.
- [x] Enable automated daily MongoDB backups with retention policy.
- [x] Verify rate limiters are actively throttling abnormal traffic spikes.
