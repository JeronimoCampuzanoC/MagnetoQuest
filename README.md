# MagnetoQuest

MagnetoQuest is a web platform for job seekers, designed to encourage continuous engagement through gamification. Unlike services that focus solely on resumes, MagnetoQuest helps users improve their skills, strengthen their CV, and build connections, creating a more interactive and engaging experience.

## Create .env
```bash
touch .env
```
DATABASE_URL=postgres://poc_user:poc_pass@localhost:5432/poc_db

## Dependencies

node.js (npm)
react
express
cors
TypeORM
docker
Posgress
lucide-react
bootstrap
reactstrap
react-router-dom

## Setup client

```bash
cd client
npm install
npm start
```

## Setup server
```bash
cd server
npm install
npm run dev
```


## Setup database

Using a docker container with the image of postgre

```bash
cd db
docker compose up -d
docker ps
```

As we have restart: unless-stopped in the compose, the container is going to star automatically each time

To get into the container and run some commands in the shell

```bash
docker exec -it poc-postgres bash
psql -U poc_user -d poc_db
```
