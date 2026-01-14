"""
Celery worker configuration
Run this with: celery -A celery_worker.celery worker --loglevel=info
"""
from app import celery, app

if __name__ == '__main__':
    with app.app_context():
        celery.start()