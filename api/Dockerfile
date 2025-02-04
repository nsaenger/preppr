FROM ubuntu:24.04
RUN apt update -y
RUN mkdir /app
WORKDIR /app
RUN npm install -g nodemon
RUN npm install -g typescript
RUN npm install -g gulp
COPY . .
RUN rm -rf ./node_modules/*
RUN rm -rf ./dist/*
RUN npm ci
ENTRYPOINT ["node", "src/index.ts"]
