# Dockerfile (frontend)
FROM node:20.9.0

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Serve production build with a simple static server
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
