# CodeRank API Documentation

**Complete API Reference for CodeRank Backend**

---

## API Overview

### Base URLs
- **Development**: `http://localhost:5000/api/v1`
- **Production**: `https://api.coderank.com/api/v1`

### Response Format
All responses follow a consistent JSON structure:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2024-01-23T10:30:00Z"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Authentication Endpoints

### 1. Register User
Creates a new user account.

**Endpoint**: `POST /auth/register`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "SecurePass123!@#",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation Rules**:
- `email`: Valid email format, must be unique
- `username`: 3-20 characters, alphanumeric, must be unique
- `password`: Minimum 8 characters, at least 1 uppercase, 1 number
- `firstName`: 2-50 characters, alphabetic only
- `lastName`: 2-50 characters, alphabetic only

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "createdAt": "2024-01-23T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDU5OTMwMDB9.signature"
  },
  "message": "User registered successfully",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**Error Response** (400 Bad Request - Validation):
```json
{
  "success": false,
  "error": "Email or username already exists",
  "statusCode": 409,
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "SecurePass123!@#",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

### 2. Login User
Authenticates user and returns JWT token.

**Endpoint**: `POST /auth/login`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!@#"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Invalid credentials",
  "statusCode": 401,
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!@#"
  }'
```

---

## Code Execution Endpoints

### 3. Execute Code
Executes code and returns output.

**Endpoint**: `POST /code-executor/execute`

**Authentication**: Required (Bearer Token)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Request Body**:
```json
{
  "language": "python",
  "code": "print('Hello, World!')\nx = 5 + 10\nprint(f'Sum: {x}')",
  "input": ""
}
```

**Parameters**:
- `language` (required): `python` | `javascript` | `cpp`
- `code` (required): String containing source code
- `input` (optional): String with input data for the program

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "exec-550e8400-e29b-41d4-a716-446655440000",
    "language": "python",
    "code": "print('Hello, World!')\nx = 5 + 10\nprint(f'Sum: {x}')",
    "output": "Hello, World!\nSum: 15\n",
    "error": null,
    "executionTime": 145,
    "memory": 8,
    "status": "success"
  },
  "message": "Code executed successfully",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**Error Response - Execution Error** (200 with error details):
```json
{
  "success": true,
  "data": {
    "id": "exec-550e8400-e29b-41d4-a716-446655440000",
    "language": "python",
    "output": "",
    "error": "Traceback (most recent call last):\n  File \"temp_file.py\", line 1, in <module>\n    print(undefined_variable)\nNameError: name 'undefined_variable' is not defined",
    "status": "error"
  },
  "message": "Code executed with errors",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**Error Response - Timeout** (200):
```json
{
  "success": true,
  "data": {
    "error": "Execution timeout - code took too long to run",
    "status": "timeout"
  },
  "message": "Code execution exceeded time limit",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**Error Response - Rate Limited** (429):
```json
{
  "success": false,
  "error": "Too many requests. Please wait 5 seconds before executing again",
  "statusCode": 429,
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**Error Response - Invalid Language** (400):
```json
{
  "success": false,
  "error": "Invalid language. Supported: python, javascript, cpp",
  "statusCode": 400,
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/v1/code-executor/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "language": "python",
    "code": "print(\"Hello, World!\")\nprint(2 + 2)",
    "input": ""
  }'
```

**JavaScript/Node.js Example**:
```javascript
const executeCode = async (language, code, input, token) => {
  const response = await fetch('http://localhost:5000/api/v1/code-executor/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ language, code, input })
  });
  return response.json();
};

// Usage
const result = await executeCode('python', 'print("test")', '', token);
console.log(result);
```

---

### 4. Get User Submissions
Retrieves all code submissions for authenticated user.

**Endpoint**: `GET /code-executor/submissions`

**Authentication**: Required (Bearer Token)

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters** (optional):
- `limit`: Number of submissions to return (default: 20, max: 100)
- `page`: Page number for pagination (default: 1)
- `language`: Filter by language (`python`, `javascript`, `cpp`)
- `status`: Filter by status (`success`, `error`, `timeout`)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "sub-550e8400-e29b-41d4-a716-446655440000",
      "userId": "507f1f77bcf86cd799439011",
      "language": "python",
      "code": "print('Hello, World!')",
      "output": "Hello, World!\n",
      "error": null,
      "executionTime": 125,
      "memory": 8,
      "status": "success",
      "createdAt": "2024-01-23T10:30:00Z",
      "updatedAt": "2024-01-23T10:30:00Z"
    },
    {
      "id": "sub-550e8400-e29b-41d4-a716-446655440001",
      "userId": "507f1f77bcf86cd799439011",
      "language": "javascript",
      "code": "console.log('JS test');",
      "output": "JS test\n",
      "error": null,
      "executionTime": 98,
      "memory": 10,
      "status": "success",
      "createdAt": "2024-01-23T10:25:00Z",
      "updatedAt": "2024-01-23T10:25:00Z"
    }
  ],
  "message": "Submissions retrieved successfully",
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2
  },
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Unauthorized - Invalid or missing token",
  "statusCode": 401,
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**cURL Example**:
```bash
# Get all submissions
curl -X GET http://localhost:5000/api/v1/code-executor/submissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get with filters
curl -X GET "http://localhost:5000/api/v1/code-executor/submissions?language=python&status=success&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 5. Get Submission by ID
Retrieves a specific submission.

**Endpoint**: `GET /code-executor/submissions/:id`

**Authentication**: Required (Bearer Token)

**Path Parameters**:
- `id`: Submission ID (UUID)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "sub-550e8400-e29b-41d4-a716-446655440000",
    "userId": "507f1f77bcf86cd799439011",
    "language": "python",
    "code": "print('Hello, World!')",
    "output": "Hello, World!\n",
    "error": null,
    "executionTime": 125,
    "memory": 8,
    "status": "success",
    "createdAt": "2024-01-23T10:30:00Z",
    "updatedAt": "2024-01-23T10:30:00Z"
  },
  "message": "Submission retrieved successfully",
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Submission not found",
  "statusCode": 404,
  "timestamp": "2024-01-23T10:30:00Z"
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/v1/code-executor/submissions/sub-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Authentication Details

### JWT Token Structure
All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDU5OTMwMDB9.signature
```

**Token Payload**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "role": "user",
  "iat": 1705993000,
  "exp": 1706079400
}
```

**Token Expiration**: 24 hours from creation

### How to Use Token

1. **After Login/Register**, you'll receive a token in the response
2. **Store the token** (localStorage, sessionStorage, or secure cookie)
3. **Include in all authenticated requests**:
   ```
   Authorization: Bearer <token>
   ```

---

## Code Examples by Language

### Python Example
```python
# Code that can be executed
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

result = fibonacci(6)
print(f"Fibonacci(6) = {result}")

# With input
name = input("Enter your name: ")
print(f"Hello, {name}!")
```

### JavaScript Example
```javascript
// Code that can be executed
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(`Fibonacci(6) = ${fibonacci(6)}`);

// With input (using stdin)
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Enter your name: ", (name) => {
    console.log(`Hello, ${name}!`);
    rl.close();
});
```

### C++ Example
```cpp
#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << "Fibonacci(6) = " << fibonacci(6) << endl;
    
    string name;
    cout << "Enter your name: ";
    cin >> name;
    cout << "Hello, " << name << "!" << endl;
    
    return 0;
}
```

---

## Error Codes Reference

| Error Code | Description | Solution |
|-----------|-------------|----------|
| VALIDATION_ERROR | Input validation failed | Check request body matches schema |
| AUTH_ERROR | Authentication failed | Verify email/password are correct |
| CONFLICT_ERROR | Resource already exists | User email/username taken |
| NOT_FOUND | Resource not found | Check submission/user ID |
| RATE_LIMIT | Too many requests | Wait before retrying |
| EXECUTION_ERROR | Code execution failed | Check code syntax |
| TIMEOUT_ERROR | Execution took too long | Optimize code or increase timeout |
| INTERNAL_ERROR | Server error | Retry or contact support |

---

## Security Features

### Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Per User**: 20 executions per minute
- **Response**: HTTP 429 with retry-after header

### Input Validation
- Email format validation
- Password strength requirements
- Code size limits (max 50KB)
- Input size limits (max 10KB)

### Authentication
- JWT tokens with 24-hour expiration
- Password hashing with bcrypt (10 rounds)
- CORS enabled for frontend only

### Execution Safety
- Timeout protection (30 seconds default)
- Memory limits (256 MB default)
- Process isolation
- Temp file cleanup

---

## Performance Tips

1. **Batch Requests**: Submit multiple codes in quick succession
2. **Cache Results**: Store successful execution results
3. **Optimize Code**: Avoid infinite loops and large loops
4. **Use Async**: Frontend can queue requests while waiting
5. **Monitor Rate Limit**: Check headers for rate limit info

---

## Useful Links


- **GitHub**: https://github.com/VijayYadav1999/CodeRank
- **Live API**: https://coderank-mdwd.onrender.com
- **Frontend**: https://code-rank.vercel.app

---

**Last Updated**: January 23, 2024  
**API Version**: 1.0.0
