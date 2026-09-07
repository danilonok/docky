from celery import Celery
import os

app = Celery('proj',
             broker=f'amqp://{os.environ.get("RABBIT_MQ_HOST")}:5672/',
             backend="rpc://",
             include=['app.tasks.tasks'])

# Optional configuration, see the application user guide.
app.conf.update(
    result_expires=86400,
    # Without this a task being worked on is indistinguishable from one still
    # queued — both report PENDING.
    task_track_started=True,
    # Keep the task name and arguments next to the result, so a status response
    # can say which document it is reporting on.
    result_extended=True,
    # Celery's remote-control mailbox (used by mingle at worker startup) declares
    # its reply queue non-durable AND non-exclusive by default — the exact
    # `transient_nonexcl_queues` combination RabbitMQ 4.x denies, which crash-looped
    # the worker before it ever consumed a task.
    #
    # Exclusive is also the honest lifetime for a per-connection control mailbox:
    # the queue dies with the connection that owns it. Note kombu rejects
    # exclusive and durable together, so control_queue_durable stays False.
    control_queue_exclusive=True,
)

if __name__ == '__main__':
    app.start()