FROM node:14.16.0
WORKDIR /app
COPY . .
RUN npm run start
EXPOSE 80