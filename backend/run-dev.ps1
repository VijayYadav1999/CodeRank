$env:NODE_ENV="development"
$env:MONGODB_URI="mongodb+srv://vijay:yadav@backend-engineering.wu696s1.mongodb.net/quick-commerce?appName=Backend-Engineering"
$env:JWT_SECRET="your-super-secret-jwt-key-change-in-production"
$env:JWT_EXPIRY="7d"
$env:API_GATEWAY_PORT="5000"
$env:RATE_LIMIT_WINDOW_MS="900000"
$env:RATE_LIMIT_MAX_REQUESTS="100"

npm run dev
