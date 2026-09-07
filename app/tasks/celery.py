import os

from celery import Celery

from app.dependencies.database import db_url

# Results live in Postgres.
#
# The previous `rpc://` backend shipped results over AMQP by declaring a
# transient non-exclusive queue, which RabbitMQ 4.x denies by default — every
# .delay() raised (541) INTERNAL_ERROR before the task was even queued.
# Postgres already runs here, costs no extra service, and unlike rpc:// the
# result survives a restart of either process.
#
# The URL is reused from the database module rather than rebuilt, so the
# database name lives in one place.
app = Celery(
    'proj',
    broker=f'amqp://{os.environ.get("RABBIT_MQ_HOST")}:5672/',
    backend=f'db+{db_url}',
    include=['app.tasks.tasks'],
)

app.conf.update(
    result_expires=86400,
    # Without this a task being worked on is indistinguishable from one still
    # queued — both report PENDING.
    task_track_started=True,
    # Keep the task name and arguments next to the result, so a status response
    # can say which document it is reporting on.
    result_extended=True,
)

if __name__ == '__main__':
    app.start()
