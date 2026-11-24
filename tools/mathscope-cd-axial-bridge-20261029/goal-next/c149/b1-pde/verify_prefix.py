"""Authenticate the sparse records used by the two independent readbacks."""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import gzip
import json

SOURCE_COUNT = 22_380_596
SOURCE_SHA256 = "7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2"


def verify(archive: Path, operator: Path, waveform: Path) -> None:
    a = json.loads(operator.read_bytes())
    b = json.loads(waveform.read_bytes())["records"]
    for shared in a.keys() & b.keys():
        assert a[shared] == b[shared], shared
    remaining = {int(key): value for key, value in (a | b).items()}
    count = len(remaining)
    rolling = sha256()
    stream_path = archive / "active-n3-repeat-forced-source" / "original-source-nodes.jsonl.gz"
    with gzip.open(stream_path, "rb") as source:
        rolling.update(next(source))
        for i, record in enumerate(source):
            rolling.update(record)
            if i in remaining:
                assert json.loads(record) == remaining.pop(i), f"wrong original node #{i}"
    assert i + 1 == SOURCE_COUNT and not remaining
    assert rolling.hexdigest() == SOURCE_SHA256
    print(f"PASS {count} sparse records in {SOURCE_COUNT} original records")
    print(f"original decompressed SHA256 {SOURCE_SHA256}")


if __name__ == "__main__":
    cli = ArgumentParser(description=__doc__)
    for name in ("archive", "operator", "waveform"):
        cli.add_argument(name, type=Path)
    args = cli.parse_args()
    verify(args.archive, args.operator, args.waveform)
