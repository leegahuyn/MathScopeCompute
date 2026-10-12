"""Build the official pinned GP executable as part of the local pip requirement."""
from pathlib import Path
import sys

from setuptools import Distribution, setup
from setuptools.command.build_py import build_py

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))
from mathscope_p7_pari.build import build_runtime


class BuildRuntime(build_py):
    def run(self):
        super().run()
        build_runtime(Path(self.build_lib) / "mathscope_p7_pari" / "bin")


class BinaryDistribution(Distribution):
    # The contained GP executable is platform-specific even though the Python
    # discovery wrapper is pure Python. Never publish this as an any-platform wheel.
    def has_ext_modules(self):
        return True


setup(cmdclass={"build_py": BuildRuntime}, distclass=BinaryDistribution)
