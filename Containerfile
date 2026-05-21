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
