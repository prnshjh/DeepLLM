from flask import Flask, request, jsonify
from flask_cors import CORS
from celery import Celery
import requests
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration from environment
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
MODEL_NAME = os.getenv('MODEL_NAME', 'llama2')

# Initialize Celery
celery = Celery(
    app.name,
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True
)


@celery.task(bind=True)
def process_ollama_request(self, message, model_name):
    """
    Celery task to process Ollama API request
    """
    try:
        logger.info(f"Processing request with model: {model_name}")
        
        # Update task state to processing
        self.update_state(state='PROCESSING', meta={'status': 'Generating response...'})
        
        # Prepare request to Ollama
        ollama_endpoint = f"{OLLAMA_URL}/api/generate"
        payload = {
            "model": model_name,
            "prompt": message,
            "stream": False
        }
        
        # Make request to Ollama
        response = requests.post(
            ollama_endpoint,
            json=payload,
            timeout=300  # 5 minutes timeout
        )
        
        response.raise_for_status()
        result = response.json()
        
        # Extract response text
        response_text = result.get('response', '')
        
        logger.info(f"Successfully generated response for task: {self.request.id}")
        
        return {
            'status': 'SUCCESS',
            'result': response_text,
            'model': model_name
        }
        
    except requests.exceptions.Timeout:
        logger.error(f"Timeout error for task: {self.request.id}")
        return {
            'status': 'FAILURE',
            'error': 'Request timeout. The model took too long to respond.'
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error for task {self.request.id}: {str(e)}")
        return {
            'status': 'FAILURE',
            'error': f'Failed to connect to Ollama: {str(e)}'
        }
    except Exception as e:
        logger.error(f"Unexpected error for task {self.request.id}: {str(e)}")
        return {
            'status': 'FAILURE',
            'error': f'An unexpected error occurred: {str(e)}'
        }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check Ollama connection
        ollama_health = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        ollama_status = "healthy" if ollama_health.status_code == 200 else "unhealthy"
    except:
        ollama_status = "unhealthy"
    
    return jsonify({
        'status': 'running',
        'ollama_connection': ollama_status,
        'model': MODEL_NAME
    })


@app.route('/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint
    Accepts user message and creates async task
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                'error': 'Missing required field: message'
            }), 400
        
        message = data.get('message', '').strip()
        model = data.get('model', MODEL_NAME)
        
        if not message:
            return jsonify({
                'error': 'Message cannot be empty'
            }), 400
        
        # Create Celery task
        task = process_ollama_request.apply_async(args=[message, model])
        
        logger.info(f"Created task {task.id} for message: {message[:50]}...")
        
        return jsonify({
            'task_id': task.id,
            'status': 'PENDING',
            'message': 'Task created successfully'
        }), 202
        
    except Exception as e:
        logger.error(f"Error in /chat endpoint: {str(e)}")
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500


@app.route('/api/result/<task_id>', methods=['GET'])
def get_result(task_id):
    """
    Get task result by task_id
    """
    try:
        task = process_ollama_request.AsyncResult(task_id)
        
        if task.state == 'PENDING':
            response = {
                'status': 'PENDING',
                'result': None,
                'message': 'Task is waiting to be processed'
            }
        elif task.state == 'PROCESSING':
            response = {
                'status': 'PROCESSING',
                'result': None,
                'message': 'Task is currently being processed'
            }
        elif task.state == 'SUCCESS':
            result = task.result
            response = {
                'status': 'SUCCESS',
                'result': result.get('result', ''),
                'model': result.get('model', MODEL_NAME)
            }
        elif task.state == 'FAILURE':
            result = task.result if task.result else {}
            response = {
                'status': 'FAILURE',
                'error': result.get('error', 'Task failed'),
                'result': None
            }
        else:
            response = {
                'status': task.state,
                'result': None,
                'message': f'Task state: {task.state}'
            }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in /api/result endpoint: {str(e)}")
        return jsonify({
            'status': 'ERROR',
            'error': f'Server error: {str(e)}'
        }), 500


@app.route('/models', methods=['GET'])
def list_models():
    """
    List available models from Ollama
    """
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=10)
        response.raise_for_status()
        models = response.json()
        
        return jsonify({
            'models': models.get('models', []),
            'current_model': MODEL_NAME
        })
        
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        return jsonify({
            'error': f'Failed to fetch models: {str(e)}'
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )