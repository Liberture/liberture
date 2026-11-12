#!/usr/bin/python3
import hashlib
import os
import pathlib
import re
import subprocess
import tempfile

from backup import BUCKET, PREFIX, storage


def main():
    os.umask(0o077)
    s3 = storage()
    entries = (
        o
        for page in s3.get_paginator("list_objects_v2").paginate(
            Bucket=BUCKET, Prefix=PREFIX
        )
        for o in page.get("Contents", [])
        if o["Key"].endswith(".dump")
    )
    key = max(entries, key=lambda o: o["LastModified"])["Key"]
    bindir = subprocess.check_output(["pg_config", "--bindir"], text=True).strip()

    def pg(cmd, *args, **kw):
        return subprocess.run(
            [bindir + "/" + cmd, *args],
            cwd=work,
            env={"PATH": "/usr/bin:/bin", "LC_ALL": "C"},
            check=True,
            **kw,
        )

    with tempfile.TemporaryDirectory(prefix="liberture-restore-") as work:
        root = pathlib.Path(work)
        dump = root / "backup.dump"
        s3.download_file(BUCKET, key, str(dump))
        metadata = s3.head_object(Bucket=BUCKET, Key=key)
        with dump.open("rb") as f:
            if (
                hashlib.file_digest(f, "sha256").hexdigest()
                != metadata["Metadata"]["sha256"]
            ):
                raise RuntimeError("Downloaded archive checksum mismatch")
        cluster = str(root / "cluster")
        pg(
            "initdb",
            "-D",
            cluster,
            "--auth-local=peer",
            "--auth-host=reject",
            "--no-locale",
            "--encoding=UTF8",
            stdout=subprocess.DEVNULL,
        )
        pg(
            "pg_ctl",
            "-D",
            cluster,
            "-l",
            str(root / "postgres.log"),
            "-o",
            f"-c listen_addresses='' -c unix_socket_directories='{work}'",
            "-w",
            "start",
            stdout=subprocess.DEVNULL,
        )
        try:
            pg("createdb", "-h", work, "restore_test")
            pg(
                "pg_restore",
                "--exit-on-error",
                "--no-owner",
                "--no-privileges",
                "-h",
                work,
                "-d",
                "restore_test",
                str(dump),
            )
            toc = pg(
                "pg_restore", "--list", str(dump), capture_output=True, text=True
            ).stdout
            expected = len(re.findall(r"(?m)^\d+; \d+ \d+ TABLE public ", toc))
            counts = pg(
                "psql",
                "-XAt",
                "-v",
                "ON_ERROR_STOP=1",
                "-h",
                work,
                "-d",
                "restore_test",
                "-c",
                "SELECT count(*) FROM pg_tables WHERE schemaname='public'",
                "-c",
                'SELECT count(*) FROM "Book"',
                capture_output=True,
                text=True,
            ).stdout.splitlines()
            if int(counts[0]) != expected or expected == 0:
                raise RuntimeError("Restored table count differs from archive")
            print(
                "Restored",
                key,
                "in isolated cluster;",
                counts[0],
                "public tables;",
                counts[1],
                "book rows; SHA-256 matched.",
            )
        finally:
            pg(
                "pg_ctl",
                "-D",
                cluster,
                "-m",
                "immediate",
                "-w",
                "stop",
                stdout=subprocess.DEVNULL,
            )


if __name__ == "__main__":
    main()
