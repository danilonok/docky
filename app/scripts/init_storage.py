
from app.config import get_settings
from app.storage.minio_client import create_bucket


def main() -> None:
    bucket = get_settings().s3_bucket
    create_bucket(bucket)
    print(f"Object storage ready: bucket {bucket!r}")


if __name__ == "__main__":
    main()
