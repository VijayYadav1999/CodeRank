# CodeRank

**An Online Code Execution Platform**

> A full-stack web application that allows users to write, execute, and test code in multiple programming languages with real-time output. Built with Node.js, Angular, MongoDB, and Docker.

---

## Key Features

- ** User Authentication** - Secure registration and login with JWT tokens
- ** Multi-Language Support** - Execute code in Python, JavaScript, and C++
- ** Real-time Code Execution** - Write code and get instant results
- ** Code Submission Tracking** - Save and view your submission history
- ** Secure API Gateway** - Rate limiting, CORS, and helmet security
- ** Production Ready** - Docker support and environment-based configuration
- ** Concurrency Management** - Handle multiple code executions efficiently

---

## Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting
- **Code Execution**: Child Process with timeout management

### Frontend
- **Framework**: Angular 16+ (Standalone Components)
- **Language**: TypeScript
- **Styling**: CSS
- **HTTP Client**: Axios
- **State Management**: RxJS/Services

### DevOps
- **Containerization**: Docker & Docker Compose
- **Development**: Nodemon, Cross-env
- **Package Manager**: npm

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: v5.0+ (or Docker for container setup)
- **Git**: For version control

### Optional (for containerized deployment):
- **Docker**: v20.10+
- **Docker Compose**: v2.0+

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/VijayYadav1999/CodeRank.git
cd CodeRank
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with configuration
cat > .env << 'EOF'
# Environment
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/coderank

# JWT
JWT_SECRET=your-secret-key-here-min-32-chars

# API Gateway
API_GATEWAY_PORT=5000

# CORS
CORS_ORIGIN=http://localhost:4200

# Code Execution
MAX_CONCURRENT_EXECUTIONS=10
MAX_MEMORY_PER_EXECUTION=256
EXECUTOR_MAX_EXECUTION_TIME=30000
EOF

# Start development server
npm run dev
```

The backend will be running on `http://localhost:5000`

### Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Update environment configuration (if needed)
# src/environments/environment.ts is already configured for localhost

# Start development server
npm start
```

The frontend will be running on `http://localhost:4200`

---

## Docker Setup (Recommended for Production)

### Run Everything with Docker Compose

```bash
# From root directory
docker-compose up --build

# For production environment
docker-compose -f docker-compose.yml -f docker/docker-compose.prod.yml up --build
```

Services will be available at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

### Stop Services

```bash
docker-compose down
```

---

## API Documentation

### Base URL
- **Development**: `http://localhost:5000/api/v1`
- **Production**: `https://api.example.com/api/v1`

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "username": "username123",
  "password": "StrongPassword123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response (201):
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "username": "username123",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully",
  "timestamp": "2024-01-23T10:30:00Z"
}

Error (400):
{
  "success": false,
  "error": "Email or username already exists",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}

Response (200):
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful",
  "timestamp": "2024-01-23T10:30:00Z"
}

Error (401):
{
  "success": false,
  "error": "Invalid credentials",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

### Code Execution Endpoints

#### Execute Code
```http
POST /code-executor/execute
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

Request:
{
  "language": "python",
  "code": "print('Hello, World!')",
  "input": ""
}

Response (200):
{
  "success": true,
  "data": {
    "id": "exec-123456",
    "output": "Hello, World!\n",
    "error": null,
    "executionTime": 125,
    "memory": 12,
    "status": "success"
  },
  "message": "Code executed successfully",
  "timestamp": "2024-01-23T10:30:00Z"
}

Error (400):
{
  "success": false,
  "error": "Invalid language or code",
  "timestamp": "2024-01-23T10:30:00Z"
}

Error (429):
{
  "success": false,
  "error": "Too many requests. Please wait before executing again",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

#### Get Submissions
```http
GET /code-executor/submissions
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "sub-123456",
      "userId": "507f1f77bcf86cd799439011",
      "language": "python",
      "code": "print('Hello')",
      "output": "Hello\n",
      "status": "success",
      "createdAt": "2024-01-23T10:30:00Z"
    }
  ],
  "message": "Submissions retrieved successfully",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

### Supported Languages

| Language   | Extension | Example                          |
|-----------|-----------|----------------------------------|
| Python    | .py       | `print("Hello")`                 |
| JavaScript| .js       | `console.log("Hello")`          |
| C++       | .cpp      | `#include <iostream>`           |

---

## System Architecture & Design Decisions

### Architecture Pattern: API Gateway with Microservices

```
┌─────────────────┐
│   Frontend      │
│   (Angular)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      API Gateway (Express)          │
│  - Rate Limiting                    │
│  - CORS & Security (Helmet)         │
│  - Request Logging                  │
└────┬─────────────────────────────┬──┘
     │                             │
     ▼                             ▼
┌──────────────────┐      ┌──────────────────┐
│  Auth Service    │      │  Code Executor   │
│  - Register      │      │  - Execute Code  │
│  - Login         │      │  - Queue Mgmt    │
│  - JWT Auth      │      │  - Concurrency   │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         └──────────┬──────────────┘
                    ▼
           ┌──────────────────┐
           │    MongoDB       │
           │   (Database)     │
           └──────────────────┘
```

### Key Design Decisions

#### 1. **API Gateway Pattern**
- **Why**: Single entry point for all requests
- **Benefits**: 
  - Centralized security (rate limiting, CORS)
  - Easy monitoring and logging
  - Load balancing capability
  - Version control

#### 2. **Modular Service Architecture**
- **Why**: Separation of concerns
- **Benefits**:
  - Auth service handles authentication only
  - Code executor handles execution only
  - Easy to scale individual services
  - Better testability

#### 3. **JWT Authentication**
- **Why**: Stateless authentication
- **Benefits**:
  - No session storage needed
  - Scalable across servers
  - Mobile-friendly
  - Can include user metadata

#### 4. **Concurrency Management**
- **Why**: Prevent server overload
- **Benefits**:
  - Queue system for executions
  - Max concurrent limit (configurable)
  - Prevents memory exhaustion
  - Better UX with clear error messages

#### 5. **Docker Containerization**
- **Why**: Consistent environment across machines
- **Benefits**:
  - Easy deployment
  - Production-ready setup
  - Database isolation
  - One-command startup

#### 6. **MongoDB for Database**
- **Why**: Flexible schema, easy scaling
- **Benefits**:
  - No rigid schema needed
  - JSON-like documents match JS objects
  - Built-in indexing
  - Good for startup projects

---

## Project Structure

```
CodeRank/
├── backend/
│   ├── src/
│   │   ├── index.js                    # Entry point
│   │   ├── api-gateway/
│   │   │   └── api-gateway.js          # Main gateway with security
│   │   ├── auth-service/
│   │   │   ├── auth.controller.js      # Request handlers
│   │   │   ├── auth.service.js         # Business logic
│   │   │   └── auth.routes.js          # Route definitions
│   │   ├── code-executor/
│   │   │   ├── code-executor.controller.js
│   │   │   ├── code-executor.service.js    # Core execution logic
│   │   │   └── code-executor.routes.js
│   │   ├── db/
│   │   │   ├── connection.js           # MongoDB connection
│   │   │   └── models/
│   │   │       ├── user.model.js
│   │   │       └── submission.model.js
│   │   └── shared/
│   │       ├── errors.js               # Custom error classes
│   │       ├── logger.js               # Logging utility
│   │       ├── response.js             # Response formatter
│   │       └── middleware/
│   │           ├── auth.middleware.js
│   │           ├── error.middleware.js
│   │           └── rate-limiter.middleware.js
│   ├── config/
│   │   └── config.js                   # Configuration loader
│   ├── docker/
│   │   ├── Dockerfile.dev              # Development image
│   │   └── Dockerfile.prod             # Production image
│   ├── package.json
│   └── .env                            # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── index.html
│   │   ├── main.ts
│   │   ├── app/
│   │   │   ├── app.component.ts        # Root component
│   │   │   ├── app.routes.ts           # Route definitions
│   │   │   ├── core/
│   │   │   │   ├── guards/
│   │   │   │   │   └── auth.guard.ts   # Route protection
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── api.interceptor.ts
│   │   │   │   │   └── auth.interceptor.ts
│   │   │   │   └── services/
│   │   │   │       ├── auth.service.ts
│   │   │   │       └── code-execution.service.ts
│   │   │   └── features/
│   │   │       ├── auth/
│   │   │       │   ├── login/
│   │   │       │   └── register/
│   │   │       └── editor/
│   │   │           └── code-editor/
│   │   └── environments/
│   │       ├── environment.ts
│   │       └── environment.prod.ts
│   ├── docker/
│   ├── package.json
│   └── angular.json
│
├── docker-compose.yml                  # Multi-service orchestration
├── docker-compose.prod.yml
├── setup.bat                           # Windows setup script
└── README.md
```

---

## Environment Variables

### Backend (.env file)

```env
# Application
NODE_ENV=development
API_GATEWAY_PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/coderank

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters-long

# CORS
CORS_ORIGIN=http://localhost:4200

# Code Execution
MAX_CONCURRENT_EXECUTIONS=10
MAX_MEMORY_PER_EXECUTION=256
EXECUTOR_MAX_EXECUTION_TIME=30000

# Logging
LOG_LEVEL=info
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1',
  wsUrl: 'ws://localhost:5000',
};
```

---

## Testing the Application

### Manual Testing Workflow

1. **Register a New User**
   - Go to http://localhost:4200/register
   - Enter email, username, password
   - Click "Register"

2. **Login**
   - Go to http://localhost:4200/login
   - Enter credentials
   - Should redirect to code editor

3. **Execute Code**
   - Select language (Python/JavaScript/C++)
   - Write code in editor
   - Click "Execute"
   - See output in real-time

4. **View Submissions**
   - After execution, submission appears in history
   - Click on any submission to view details

---

## Deployment

### Deploy to Render (Backend)

1. Create account on [render.com](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service
4. Set environment variables
5. Deploy!

### Deploy to Vercel (Frontend)

1. Create account on [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Set environment variables (API_URL)
4. Deploy!

### Docker Deployment

```bash
# Build images
docker build -t coderank-backend:1.0 ./backend
docker build -t coderank-frontend:1.0 ./frontend

# Push to registry
docker tag coderank-backend:1.0 yourregistry/coderank-backend:1.0
docker push yourregistry/coderank-backend:1.0

# Deploy using docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## Performance & Scalability

### Current Limits
- Max concurrent executions: 10
- Max memory per execution: 256 MB
- Max execution time: 30 seconds
- Rate limit: 100 requests/15 minutes per IP

### Optimization Tips
- Increase `MAX_CONCURRENT_EXECUTIONS` for more parallel executions
- Use caching for frequently executed code
- Implement job queue (Bull.js) for better task management
- Use CDN for static assets
- Enable gzip compression
