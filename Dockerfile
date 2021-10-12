FROM node:14.16.0
WORKDIR /app
COPY . .
RUN npm run build
EXPOSE 8080
CMD [ "node", "dist/app.js" ]