"""Discover the bundled GP executable without installing anything at request time."""
from pathlib import Path

PARI_VERSION = "2.19.0"
SOURCE_URL = "https://pari.math.u-bordeaux.fr/pub/pari/unix/pari-2.19.0.tar.gz"
SOURCE_SHA256 = "f317b9722eb5d9094a60303774f066f3a83e3ec1f170be8546c44d7583f30b6d"
SOURCE_BYTES = 5_508_075
PROVENANCE_NAME = "mathscope-pari-build.json"


def binary_path():
    """Return an installed executable, or fail explicitly; no network fallback."""
    path = Path(__file__).resolve().parent / "bin" / "gp"
    if not path.is_file():
        raise FileNotFoundError("The pinned MathScope PARI runtime has not been built")
    return str(path)


def provenance_path():
    return str(Path(binary_path()).with_name(PROVENANCE_NAME))
