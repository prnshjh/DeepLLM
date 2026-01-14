# DeepLLM - AI Chatbot Backend

A Flask-based backend server that acts as middleware between your frontend and Ollama LLM server, using Celery for asynchronous task processing.

## Architecture

```
Frontend → Flask API → Celery Task Queue → Ollama LLM → Response
                ↓
            Redis (Broker & Backend)
```

## Features

- ✅ Asynchronous LLM processing with Celery
- ✅ Real-time task status tracking
- ✅ Support for multiple Ollama models
- ✅ CORS-enabled for frontend integration
- ✅ Health check endpoint
- ✅ Error handling and logging
- ✅ Configurable via environment variables

## Prerequisites

- Python 3.8+
- Redis server
- Ollama running locally (http://localhost:11434)

## Installation

1. **Clone and setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Redis** (if not already running)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
# macOS: brew install redis && brew services start redis
# Ubuntu: sudo apt install redis-server && sudo service redis-server start
```

4. **Start Ollama** (if not already running)
```bash
ollama serve
# Pull a model if needed
ollama pull llama2
```

## Running the Application

You need to run **three processes**:

### Terminal 1: Flask Server
```bash
python app.py
```

### Terminal 2: Celery Worker
```bash
celery -A celery_worker.celery worker --loglevel=info
```

### Terminal 3: (Optional) Celery Flower - Task Monitoring
```bash
pip install flower
celery -A celery_worker.celery flower
# Access at http://localhost:5555
```

## API Endpoints

### 1. Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "running",
  "ollama_connection": "healthy",
  "model": "llama2"
}
```

### 2. Send Chat Message
```bash
POST /chat
Content-Type: application/json

{
  "message": "Hello, what is AI?",
  "model": "llama2"  // optional
}
```

**Response:**
```json
{
  "task_id": "abc123-def456-ghi789",
  "status": "PENDING",
  "message": "Task created successfully"
}
```

### 3. Get Task Result
```bash
GET /api/result/<task_id>
```

**Response (Pending):**
```json
{
  "status": "PENDING",
  "result": null,
  "message": "Task is waiting to be processed"
}
```

**Response (Success):**
```json
{
  "status": "SUCCESS",
  "result": "AI stands for Artificial Intelligence...",
  "model": "llama2"
}
```

**Response (Failure):**
```json
{
  "status": "FAILURE",
  "error": "Failed to connect to Ollama: Connection refused",
  "result": null
}
```

### 4. List Available Models
```bash
GET /models
```

**Response:**
```json
{
  "models": [
    {
      "name": "llama2",
      "modified_at": "2024-01-15T10:30:00Z",
      "size": 3826793677
    }
  ],
  "current_model": "llama2"
}
```

## Frontend Integration Example

```javascript
// Send chat message
async function sendMessage(message) {
  const response = await fetch('http://localhost:5000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  
  const data = await response.json();
  return data.task_id;
}

// Poll for result
async function pollResult(taskId) {
  const response = await fetch(`http://localhost:5000/api/result/${taskId}`);
  const data = await response.json();
  
  if (data.status === 'PENDING' || data.status === 'PROCESSING') {
    // Keep polling
    setTimeout(() => pollResult(taskId), 1000);
  } else if (data.status === 'SUCCESS') {
    console.log('Result:', data.result);
  } else {
    console.error('Error:', data.error);
  }
}

// Usage
const taskId = await sendMessage('What is machine learning?');
pollResult(taskId);
```

## Configuration

Edit `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `MODEL_NAME` | `llama2` | Default model name |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `PORT` | `5000` | Flask server port |
| `DEBUG` | `False` | Enable debug mode |

## Troubleshooting

### Issue: Celery worker not connecting to Redis
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### Issue: Cannot connect to Ollama
```bash
# Test Ollama connection
curl http://localhost:11434/api/tags

# Check if Ollama is running
ollama list
```

### Issue: Task stuck in PENDING
- Ensure Celery worker is running
- Check Redis connection
- Check Celery worker logs for errors

## Production Deployment

For production, use **Gunicorn** and process managers:

```bash
# Install supervisor or systemd for process management

# Flask with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Celery worker
celery -A celery_worker.celery worker --loglevel=info --concurrency=4
```

## Project Structure

```
backend/
├── app.py                 # Main Flask application
├── celery_worker.py       # Celery worker configuration
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (create from .env.example)
└── .env.example          # Example environment configuration
```

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.