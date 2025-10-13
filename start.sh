#!/bin/bash

# MagnetoQuest Start Script
# This script helps you start different components of the MagnetoQuest application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready on $host:$port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Function to start the database
start_database() {
    print_status "Starting PostgreSQL database..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    cd db
    if docker compose ps | grep -q "poc-postgres.*Up"; then
        print_warning "Database is already running"
    else
        docker compose up -d
        wait_for_service localhost 5432 "PostgreSQL Database"
    fi
    cd ..
}

# Function to start the trivia service
start_trivia_service() {
    print_status "Starting Trivia Service..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    cd trivia-service
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found in trivia-service directory"
        print_status "Creating a template .env file..."
        cat > .env << EOF
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Service Configuration
PORT=4001
NODE_ENV=development
EOF
        print_warning "Please edit trivia-service/.env with your actual OpenAI API key"
    fi
    
    if docker compose ps | grep -q "trivia-service.*Up"; then
        print_warning "Trivia service is already running"
    else
        docker compose up -d --build
        wait_for_service localhost 4001 "Trivia Service"
    fi
    cd ..
}

# Function to start the backend server
start_backend() {
    print_status "Starting Backend Server..."
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    cd server
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    # Check if the backend is already running
    if port_in_use 4000; then
        print_warning "Backend server appears to be already running on port 4000"
    else
        print_status "Starting backend in development mode..."
        npm run dev &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../backend.pid
        print_success "Backend server started on port 4000"
    fi
    cd ..
}

# Function to start the frontend
start_frontend() {
    print_status "Starting Frontend Client..."
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    cd client
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Check if the frontend is already running
    if port_in_use 3000; then
        print_warning "Frontend client appears to be already running on port 3000"
    else
        print_status "Starting frontend development server..."
        npm start &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../frontend.pid
        wait_for_service localhost 3000 "Frontend Client"
    fi
    cd ..
}

# Function to stop all services
stop_all() {
    print_status "Stopping all services..."
    
    # Stop frontend
    if [ -f frontend.pid ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_status "Stopping frontend..."
            kill $FRONTEND_PID
            rm frontend.pid
        fi
    fi
    
    # Stop backend
    if [ -f backend.pid ]; then
        BACKEND_PID=$(cat backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_status "Stopping backend..."
            kill $BACKEND_PID
            rm backend.pid
        fi
    fi
    
    # Stop Docker services
    print_status "Stopping Docker services..."
    cd trivia-service && docker compose down 2>/dev/null || true && cd ..
    cd db && docker compose down 2>/dev/null || true && cd ..
    
    print_success "All services stopped"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    echo ""
    
    # Database
    cd db
    if docker compose ps | grep -q "poc-postgres.*Up"; then
        print_success "✓ Database (PostgreSQL) - Running on port 5432"
    else
        print_error "✗ Database (PostgreSQL) - Not running"
    fi
    cd ..
    
    # Trivia Service
    cd trivia-service
    if docker compose ps | grep -q "trivia-service.*Up"; then
        print_success "✓ Trivia Service - Running on port 4001"
    else
        print_error "✗ Trivia Service - Not running"
    fi
    cd ..
    
    # Backend
    if port_in_use 4000; then
        print_success "✓ Backend Server - Running on port 4000"
    else
        print_error "✗ Backend Server - Not running"
    fi
    
    # Frontend
    if port_in_use 3000; then
        print_success "✓ Frontend Client - Running on port 3000"
    else
        print_error "✗ Frontend Client - Not running"
    fi
    
    echo ""
    print_status "Access URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:4000"
    echo "  Trivia Service: http://localhost:4001"
    echo "  Database: localhost:5432"
}

# Function to show usage
show_usage() {
    echo "MagnetoQuest Start Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  all        Start all services (database, trivia-service, backend, frontend)"
    echo "  db         Start only the database"
    echo "  trivia     Start only the trivia service"
    echo "  backend    Start only the backend server"
    echo "  frontend   Start only the frontend client"
    echo "  stop       Stop all running services"
    echo "  status     Show status of all services"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all       # Start everything"
    echo "  $0 db        # Start only database"
    echo "  $0 status    # Check what's running"
    echo "  $0 stop      # Stop everything"
}

# Main script logic
case "${1:-help}" in
    "all")
        print_status "Starting all MagnetoQuest services..."
        start_database
        start_trivia_service
        start_backend
        start_frontend
        echo ""
        show_status
        print_success "All services started successfully!"
        print_status "Press Ctrl+C to stop all services"
        
        # Keep script running and handle Ctrl+C
        trap 'echo ""; print_status "Shutting down..."; stop_all; exit 0' INT
        while true; do
            sleep 1
        done
        ;;
    "db"|"database")
        start_database
        ;;
    "trivia"|"trivia-service")
        start_trivia_service
        ;;
    "backend"|"server")
        start_backend
        print_status "Backend started. Press Ctrl+C to stop."
        trap 'echo ""; print_status "Stopping backend..."; if [ -f backend.pid ]; then kill $(cat backend.pid); rm backend.pid; fi; exit 0' INT
        while true; do
            sleep 1
        done
        ;;
    "frontend"|"client")
        start_frontend
        print_status "Frontend started. Press Ctrl+C to stop."
        trap 'echo ""; print_status "Stopping frontend..."; if [ -f frontend.pid ]; then kill $(cat frontend.pid); rm frontend.pid; fi; exit 0' INT
        while true; do
            sleep 1
        done
        ;;
    "stop")
        stop_all
        ;;
    "status")
        show_status
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac