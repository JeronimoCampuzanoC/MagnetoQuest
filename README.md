# MagnetoQuest

MagnetoQuest is a web platform for job seekers, designed to encourage continuous engagement through gamification. Unlike services that focus solely on resumes, MagnetoQuest helps users improve their skills, strengthen their CV, and build connections, creating a more interactive and engaging experience.

## Features

- 🎮 **Gamified Experience**: Earn points, badges, and achievements while improving your professional profile
- 📝 **CV Enhancement**: Upload and optimize your resume
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

Each service requires its own `.env` file for proper configuration. Follow these steps to set up the environment variables:

#### Root Directory Configuration

Create a `.env` file in the project root:

```bash
touch .env
```

Add the following variables:

```env
DATABASE_URL=postgres://poc_user:poc_pass@localhost:5432/poc_db
NODE_ENV=development
```

#### Server Configuration

Create a `.env` file in the `server` directory:

```bash
cd server
touch .env
```

Add the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=poc_user
DB_PASS=poc_pass
DB_NAME=poc_db
PORT=4000

# Email Configuration (SMTP Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com
```

**Note:** For Gmail SMTP:

- You need to generate an [App Password](https://support.google.com/accounts/answer/185833) instead of using your regular Gmail password
- Make sure 2-Factor Authentication is enabled on your Google account
- Replace `your_email@gmail.com` and `your_app_password` with your actual credentials

#### Trivia Service Configuration

Create a `.env` file in the `trivia-service` directory:

```bash
cd trivia-service
touch .env
```

Add the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Service Configuration
PORT=4001
NODE_ENV=development
```

**Note:** Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

#### Environment Variables Summary

| Service            | File Location         | Purpose                                             |
| ------------------ | --------------------- | --------------------------------------------------- |
| **Root**           | `.env`                | Global database URL and environment                 |
| **Server**         | `server/.env`         | Backend API, database connection, and email service |
| **Trivia Service** | `trivia-service/.env` | AI-powered trivia generation with OpenAI            |

#### Security Notes

⚠️ **Important:**

- Never commit `.env` files to version control
- Keep your API keys and passwords secure
- Use different credentials for development and production environments
- Add `.env` to your `.gitignore` file (already configured)

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
