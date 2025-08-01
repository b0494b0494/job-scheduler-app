# 古いバージョンを削除し、以下を使用
FROM node:18.18.0

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]