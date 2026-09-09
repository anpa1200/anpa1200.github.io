"""Build and inspect a benign deterministic ZIP; never extract or execute entries."""
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import sys
import zipfile

CONTENTS = b"1200km benign triage fixture v1\nURL string: https://example.invalid/report\nCommand word: powershell (plain text, never executed)\n"


def fixture(name="notes.txt"):
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_STORED) as archive:
        entry = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        entry.create_system = 3
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, CONTENTS)
    return output.getvalue()


def inspect(data):
    if len(data) > 10000:
        raise ValueError("Fixture size budget exceeded")
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        if len(entries) != 1:
            raise ValueError("Expected exactly one fixture entry")
        entry = entries[0]
        path = PurePosixPath(entry.filename)
        if path.is_absolute() or ".." in path.parts or "\\" in entry.filename or entry.filename != "notes.txt":
            raise ValueError("Unexpected archive path")
        if entry.file_size > 1000 or entry.compress_type != zipfile.ZIP_STORED:
            raise ValueError("Unexpected compression or size")
        text = archive.read(entry)  # ZIP reader also checks CRC; no filesystem extraction.
        if text != CONTENTS:
            raise ValueError("Fixture content mismatch")
        return {"sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data), "format": "ZIP (stored)", "entries": [entry.filename], "text_bytes": len(text), "strings": ["example.invalid", "powershell"], "execution_observed": False}


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--generate":
        # Exclusive creation avoids overwriting an existing learner artifact.
        with open(sys.argv[2], "xb") as output:
            output.write(fixture())
    elif len(sys.argv) == 2 and sys.argv[1] == "--self-test":
        inspect(fixture())
        failures = 0
        for bad in [fixture("../notes.txt"), fixture().replace(b"benign", b"BENIGN"), b"not a zip"]:
            try:
                inspect(bad)
            except (ValueError, zipfile.BadZipFile):
                failures += 1
            else:
                raise AssertionError("Negative fixture accepted")
        print(json.dumps({"negative_controls_rejected": failures, "positive_fixture_passed": True}, sort_keys=True))
    elif len(sys.argv) == 2:
        with Path(sys.argv[1]).open("rb") as artifact:
            print(json.dumps(inspect(artifact.read(10001)), sort_keys=True))
    else:
        raise SystemExit("Use triage.py --generate fixture.zip | fixture.zip | --self-test")
