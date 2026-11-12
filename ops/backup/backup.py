#!/usr/bin/python3
import datetime
import hashlib
import os
import pathlib
import subprocess
import tempfile

import boto3
from botocore.config import Config

BUCKET = "liberture"
PREFIX = "backups/liberture/"


def storage():
    return boto3.client(
        "s3",
        region_name="nbg1",
        endpoint_url="https://nbg1.your-objectstorage.com",
        config=Config(signature_version="s3v4"),
    )


def main():
    os.umask(0o077)
    key = (
        PREFIX
        + "liberture_"
        + datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        + ".dump"
    )
    with tempfile.TemporaryDirectory() as work:
        dump = pathlib.Path(work) / "backup.dump"
        subprocess.run(
            [
                "pg_dump",
                "--host=/var/run/postgresql",
                "--dbname=liberture",
                "--format=custom",
                "--file",
                str(dump),
            ],
            check=True,
        )
        subprocess.run(
            ["pg_restore", "--list", str(dump)], stdout=subprocess.DEVNULL, check=True
        )
        with dump.open("rb") as f:
            sha = hashlib.file_digest(f, "sha256").hexdigest()
        s3 = storage()
        s3.upload_file(str(dump), BUCKET, key, ExtraArgs={"Metadata": {"sha256": sha}})
        info = s3.head_object(Bucket=BUCKET, Key=key)
        if (
            info["Metadata"].get("sha256") != sha
            or info["ContentLength"] != dump.stat().st_size
        ):
            raise RuntimeError("Uploaded backup did not match the local archive")
        print("Verified", key, info["ContentLength"], "bytes", flush=True)


if __name__ == "__main__":
    main()
