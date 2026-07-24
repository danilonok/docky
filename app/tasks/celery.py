from celery import Celery
import os

app = Celery('proj',
             broker=f'amqp://{os.environ.get('RABBIT_MQ_HOST')}:5672/',
             backend="rpc://",
             include=['app.tasks.tasks'])

# Optional configuration, see the application user guide.
app.conf.update(
    result_expires=3600,
)

if __name__ == '__main__':
    app.start()