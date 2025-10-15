# MagnetoQuest

MagnetoQuest is a web platform for job seekers, designed to encourage continuous engagement through gamification. Unlike services that focus solely on resumes, MagnetoQuest helps users improve their skills, strengthen their CV, and build connections, creating a more interactive and engaging experience.

## Features

- 🎮 **Gamified Experience**: Earn points, badges, and achievements while improving your professional profile
- 📝 **CV Enhancement**: Upload and optimize your resume with AI-powered suggestions
- 🎯 **Skill Development**: Complete missions and trivia to demonstrate and improve your skills
- 🏆 **Progress Tracking**: Monitor your professional development journey
- 🔔 **Smart Notifications**: Stay engaged with personalized updates and reminders

## Quick Start

To get the entire application running quickly:

```bash
./start.sh all
```

## Prerequisites

Before setting up the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) and Docker Compose
- [Git](https://git-scm.com/)

## Project Setup

### 1. Environment Configuration

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following environment variables:

```env
DATABASE_URL=postgres://poc_user:poc_pass@localhost:5432/poc_db
```

### 2. Technologies Used

**Frontend:**

- React with TypeScript
- Bootstrap & Reactstrap for UI components
- Lucide React for icons
- React Router DOM for navigation

**Backend:**

- Node.js with Express.js
- TypeScript
- TypeORM for database management
- CORS for cross-origin requests

**Database:**

- PostgreSQL (via Docker container)

**DevOps:**

- Docker & Docker Compose

### 3. Setup Client (Frontend)

Navigate to the client directory and install dependencies:

```bash
cd client
npm install
npm start
```

The client will start on `http://localhost:3000`

### 4. Setup Server (Backend)

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
npm run dev
```

The server will start on `http://localhost:8000` (or your configured port)

### 5. Setup Database

The database runs in a Docker container using PostgreSQL. To start the database:

```bash
cd db
docker-compose up -d
```

As we have `restart: unless-stopped` in the compose, the container will start automatically each time.

**Database Access:**

To connect to the database container and run SQL commands:

```bash
docker exec -it poc-postgres bash
psql -U poc_user -d poc_db
```

## Project Architecture

```
MagnetoQuest/
├── client/          # React TypeScript frontend
├── server/          # Express.js backend API
├── trivia-service/  # Microservice for trivia functionality
├── db/             # Database configuration and schemas
└── docs/           # Project documentation
```

## Development

### Running Individual Services

- **Frontend only**: `cd client && npm start`
- **Backend only**: `cd server && npm run dev`
- **Database only**: `cd db && docker-compose up -d`
- **Trivia Service**: `cd trivia-service && npm run dev`

### Available Scripts

Each service has its own `package.json` with specific scripts. Check individual directories for service-specific commands.


