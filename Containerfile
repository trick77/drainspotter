# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
ARG DRAINSPOTTER_VERSION=dev
ENV DRAINSPOTTER_VERSION=${DRAINSPOTTER_VERSION}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
