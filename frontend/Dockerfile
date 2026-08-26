# --- build stage ---
# Node 22: Vite 8 requires Node >= 20.19 (22 is comfortably above that).
FROM node:22-alpine AS build
WORKDIR /app

# API base is baked into the client bundle at build time. Default "/api/v1" is
# SAME-ORIGIN: the browser calls the frontend's nginx, which reverse-proxies to
# the backend (no CORS needed). Override at build with:
#   docker build --build-arg VITE_API_BASE_URL=https://host/api/v1 .
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- serve stage ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
