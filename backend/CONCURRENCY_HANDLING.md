# Concurrency Handling Architecture

## Overview
CodeRank now supports **non-blocking, concurrent code execution** with intelligent queue management and resource allocation.

## Key Improvements

### 1. **Asynchronous Execution** ✅
- **Before**: Used `execSync` (blocking) - one request at a time
- **After**: Uses `exec` with Promises (non-blocking) - multiple requests simultaneously

```javascript
// Old way (blocking)
output = execSync(command, { timeout: 30000 });

// New way (async/await)
const result = await execPromise(command, { timeout: this.maxExecutionTime });
```

### 2. **Queue Management** ✅
- **Queue System**: Requests are queued when max concurrent executions reached
- **Max Concurrent**: Default 10 (configurable via `MAX_CONCURRENT_EXECUTIONS`)
- **FIFO Processing**: First-in-first-out queue processing

```javascript
// Constructor
this.maxConcurrentExecutions = parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '10', 10);
this.executionQueue = [];
this.activeExecutions = 0;
this.executionMap = new Map();
```

### 3. **Non-Blocking API Response** ✅
- API now returns **202 Accepted** instead of waiting for execution
- Returns submission ID immediately
- Execution happens in background
- Client polls `/submission/:id` to check status

```javascript
// Returns immediately with 202 Accepted
res.status(202).json({
  submissionId: submission._id,
  status: 'queued',
  message: 'Code execution queued'
});

// Execution continues in background
(async () => {
  const result = await codeExecutor.execute(code, language, input);
  // Update submission with results
})();
```

### 4. **Resource Management** ✅
- **Memory Limit**: 256 MB per execution (configurable)
- **Timeout**: 30 seconds per execution (configurable)
- **Max Buffer**: 10 MB output
- **Automatic Cleanup**: Temp files deleted after execution

```javascript
this.maxMemoryPerExecution = parseInt(process.env.MAX_MEMORY_PER_EXECUTION || '256', 10);
this.maxExecutionTime = parseInt(process.env.EXECUTOR_MAX_EXECUTION_TIME || '30000', 10);
```

### 5. **Execution Tracking** ✅
- Execution Map stores status and timing
- Unique ID for each execution
- Stats available via `/stats` endpoint

```javascript
this.executionMap.set(executionId, { 
  status: 'executing', 
  startTime: Date.now() 
});
```

## API Changes

### Execute Code
```bash
# Request
POST /execute
{
  "code": "print('hello')",
  "language": "python",
  "input": "",
  "title": "My Script"
}

# Response (202 Accepted)
{
  "success": true,
  "data": {
    "submissionId": "123abc",
    "status": "queued",
    "message": "Code execution queued"
  }
}
```

### Check Submission Status
```bash
GET /submission/:submissionId

# Response (when queued)
{
  "status": "queued",
  ...
}

# Response (when completed)
{
  "status": "completed",
  "output": "hello\n",
  "executionTime": 245,
  ...
}
```

### Get Execution Stats
```bash
GET /stats

# Response
{
  "success": true,
  "data": {
    "activeExecutions": 5,
    "queuedExecutions": 3,
    "totalInProgress": 8
  }
}
```

## Environment Variables

Add to `.env` file:

```env
# Concurrency Settings
MAX_CONCURRENT_EXECUTIONS=10          # Max concurrent executions
EXECUTOR_MAX_EXECUTION_TIME=30000     # Timeout in ms (30 seconds)
MAX_MEMORY_PER_EXECUTION=256          # Memory limit per execution (MB)
RATE_LIMIT_MAX_REQUESTS=100           # Rate limit requests
RATE_LIMIT_WINDOW_MS=900000           # Rate limit window (15 min)
```

## Performance Benefits

| Metric | Before | After |
|--------|--------|-------|
| Blocking | Yes (Sequential) | No (Concurrent) |
| Max Concurrent | 1 | 10+ |
| API Response Time | Slow (30s+) | Fast (50-100ms) |
| Throughput | Low | High |
| Resource Utilization | Poor | Efficient |

## Example Flow

```
Client 1 → POST /execute ─→ Returns 202 (Queued) ─┐
                                                    ├→ Queue Manager
Client 2 → POST /execute ─→ Returns 202 (Queued) ─┤
                                                    ├→ Executes up to 10 in parallel
Client 3 → POST /execute ─→ Returns 202 (Queued) ─┤
                                                    └→ Manages Queue

Client 1 → GET /submission/123 ─→ Returns execution result (when ready)
```

## Error Handling

- **Timeout**: If execution exceeds time limit, returns "Execution timeout"
- **Invalid Language**: Returns error message
- **Execution Failure**: Stderr captured and returned
- **Queue Full**: Request queued, waits for slot

## Future Enhancements

1. **Worker Threads**: Use Node.js worker threads instead of child_process
2. **Docker Integration**: Execute in isolated containers
3. **Distributed Queue**: Use Redis for multi-server setup
4. **Load Balancing**: Distribute execution across servers
5. **WebSocket Updates**: Real-time status updates instead of polling

## Testing Concurrency

```bash
# Test with multiple simultaneous requests
for i in {1..20}; do
  curl -X POST http://localhost:5000/execute \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"code":"print(123)","language":"python"}' &
done

# Check stats
curl http://localhost:5000/stats \
  -H "Authorization: Bearer TOKEN"
```
