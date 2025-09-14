# MagnetoQuest

MagnetoQuest es una plataforma web para candidatos que buscan empleo, diseñada para fomentar el uso continuo mediante gamificación. A diferencia de los servicios centrados solo en el currículum, MagnetoQuest ayuda a mejorar habilidades, fortalecer la hoja de vida y crear conexiones, promoviendo así una experiencia más interactiva y fidelizadora.

## Dependencias

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
