#!/bin/bash
set -euo pipefail
umask 077
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
runuser -u postgres -- pg_dump -Fc nostrwotmint > "$work/mint.dump"
pg_restore --list "$work/mint.dump" >/dev/null
archive="mint-$(date -u +%Y%m%dT%H%M%SZ).cms"
tar -c -C "$work" mint.dump -C /etc nostrwot-mint |
  openssl cms -encrypt -binary -aes-256-cbc -stream -outform DER -out "$work/$archive" /etc/nostrwot-mint/recovery.crt
/usr/bin/python3 - "$work/$archive" <<'PY'
import sys, hashlib, pathlib, boto3
from botocore.config import Config
p=pathlib.Path(sys.argv[1])
s=boto3.client("s3",region_name="nbg1",endpoint_url="https://nbg1.your-objectstorage.com",config=Config(signature_version="s3v4"))
key="backups/nostrwot-mint/"+p.name
with p.open("rb") as f: digest=hashlib.file_digest(f,"sha256").hexdigest()
s.upload_file(str(p),"liberture",key,ExtraArgs={"Metadata":{"sha256":digest}})
h=s.head_object(Bucket="liberture",Key=key)
if h["ContentLength"]!=p.stat().st_size or h["Metadata"].get("sha256")!=digest: raise RuntimeError("Backup verification failed")
print("Verified encrypted archive",key)
PY
