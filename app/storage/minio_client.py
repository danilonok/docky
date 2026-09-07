import os
import io
import boto3
from botocore.exceptions import ClientError
from fastapi.responses import StreamingResponse



s3 = boto3.client(
    "s3",
    endpoint_url=f"http://{os.environ.get('AWS_HOST')}:9000",
    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    region_name="us-east-1"
)
def create_bucket(bucket_name):
    """Create the bucket unless it already exists. Idempotent.

    Only a missing bucket is created. Any other error — bad credentials, an
    unreachable endpoint, a bucket owned by someone else — is re-raised rather
    than misread as "not there yet", so startup fails with the real cause.
    """
    try:
        s3.head_bucket(Bucket=bucket_name)
        return
    except ClientError as error:
        code = error.response.get("Error", {}).get("Code", "")
        if code not in ("404", "NoSuchBucket", "NotFound"):
            raise
    s3.create_bucket(Bucket=bucket_name)
def upload_to_minio(file_content, file_name, bucket_name):
    try:
        s3.upload_fileobj(file_content, bucket_name, file_name)
        return True
    except ClientError as e:
        print(e)
        return False
def download_from_minio(filename, bucket_name):
    try:
        fileobj = io.BytesIO()
        s3.download_fileobj(bucket_name, filename, fileobj)
        fileobj.seek(0)
        return fileobj
    except ClientError as e:
        print(e)
        return None