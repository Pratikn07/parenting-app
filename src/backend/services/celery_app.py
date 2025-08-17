from celery import Celery
from config.settings import settings

# Create Celery app
celery_app = Celery(
    "parenting_app",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "services.notification_service",
        "services.analytics_service"
    ]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Configure periodic tasks
celery_app.conf.beat_schedule = {
    "send-daily-tips": {
        "task": "services.notification_service.send_daily_tips",
        "schedule": 60.0 * 60.0 * 24.0,  # Daily
    },
    "cleanup-old-analytics": {
        "task": "services.analytics_service.cleanup_old_events",
        "schedule": 60.0 * 60.0 * 24.0 * 7.0,  # Weekly
    },
    "generate-weekly-insights": {
        "task": "services.analytics_service.generate_weekly_insights",
        "schedule": 60.0 * 60.0 * 24.0 * 7.0,  # Weekly
    },
}
