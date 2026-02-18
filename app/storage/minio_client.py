import os
import io
import boto3
from botocore.exceptions import ClientError
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
load_dotenv()



s3 = boto3.client(
    "s3",
    endpoint_url=f"http://127.0.0.1:9000",
    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    region_name="us-east-1"
)
def create_bucket(bucket_name):
    try:
        s3.head_bucket(Bucket=bucket_name)
    except ClientError:
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