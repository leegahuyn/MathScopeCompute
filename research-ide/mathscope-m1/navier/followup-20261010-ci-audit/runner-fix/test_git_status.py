"""Integration tests for audit-runner classification, not NS proof receipts.

Each fixture uses a temporary real Git repository. A test-only executable
adds a warning to stderr and then execs the installed Git without changing
its arguments, stdout or exit status. No proof repository or CI job is run.
"""
from __future__ import annotations

import hashlib
import importlib.util
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


SPEC = importlib.util.spec_from_file_location("ns_original_ci_run", Path(__file__).with_name("run.py"))
RUNNER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RUNNER)

TEST_WARNING = b"TEST FIXTURE ONLY: injected Git configuration warning: Permission denied\n"


class GitStatusIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.git = shutil.which("git")
        if self.git is None:
            self.skipTest("The integration tests require an installed Git executable")
        temporary = tempfile.TemporaryDirectory(prefix="mathscope-git-status-test-")
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.repo = self.base / "repo"
        self.repo.mkdir()
        self.evidence = self.base / "test-only-logs"
        self.evidence.mkdir()
        # Isolate only the test child processes from ambient Git configuration.
        self.env = {key: value for key, value in os.environ.items() if not key.startswith("GIT_")}
        self.env.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull,
                        GIT_TERMINAL_PROMPT="0", LC_ALL="C")
        self.real_git("init", "--quiet")
        (self.repo / "tracked.txt").write_text("original test fixture\n")
        self.real_git("add", "tracked.txt")
        self.real_git("-c", "user.name=Audit runner test", "-c",
                      "user.email=audit-test@example.invalid", "commit", "--quiet",
                      "-m", "Test-only initial tracked source")

        shim_dir = self.base / "test-shim"
        shim_dir.mkdir()
        shim = shim_dir / "git"
        shim.write_text(
            f"#!{sys.executable}\n"
            "# TEST ONLY: preserve the real Git operation and its actual exit code.\n"
            "import os, sys\n"
            f"sys.stderr.buffer.write({TEST_WARNING!r})\n"
            "sys.stderr.buffer.flush()\n"
            f"os.execv({self.git!r}, [{self.git!r}, *sys.argv[1:]])\n"
        )
        shim.chmod(0o755)
        self.env["PATH"] = str(shim_dir) + os.pathsep + self.env.get("PATH", os.defpath)

    def real_git(self, *arguments):
        return subprocess.run([self.git, *arguments], cwd=self.repo, env=self.env,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    def capture(self, cwd=None):
        record = RUNNER.capture_git_status(cwd or self.repo, self.evidence, self.env)
        stdout = (self.evidence / record["stdoutLog"]).read_bytes()
        stderr = (self.evidence / record["stderrLog"]).read_bytes()
        full_log = (self.evidence / "source-status-after.log").read_bytes()
        self.assertEqual(record["stdoutBytes"], len(stdout))
        self.assertEqual(record["stderrBytes"], len(stderr))
        self.assertEqual(record["stdoutSHA256"], hashlib.sha256(stdout).hexdigest())
        self.assertEqual(record["stderrSHA256"], hashlib.sha256(stderr).hexdigest())
        self.assertEqual(record["logSHA256"], hashlib.sha256(full_log).hexdigest())
        self.assertIn(TEST_WARNING, stderr)
        self.assertNotIn(TEST_WARNING, stdout)
        self.assertIn(b"--- stdout ---\n" + stdout, full_log)
        self.assertIn(b"--- stderr ---\n" + stderr, full_log)
        self.assertIn("completedUTC", record)
        return record, stdout, stderr

    def test_clean_repository_with_stderr_warning_passes(self):
        record, stdout, _ = self.capture()
        self.assertEqual(record["exitCode"], 0)
        self.assertEqual(stdout, b"")
        RUNNER.require_clean_git_status(record)

    def test_dirty_repository_with_same_warning_fails(self):
        (self.repo / "tracked.txt").write_text("actual modified test fixture\n")
        record, stdout, _ = self.capture()
        self.assertEqual(record["exitCode"], 0)
        self.assertEqual(stdout, b" M tracked.txt\n")
        with self.assertRaisesRegex(RuntimeError, "tracked source status is not clean"):
            RUNNER.require_clean_git_status(record)

    def test_non_repository_actual_git_failure_fails(self):
        not_repo = self.base / "not-a-repository"
        not_repo.mkdir()
        record, stdout, stderr = self.capture(not_repo)
        self.assertEqual(record["exitCode"], 128)
        self.assertEqual(stdout, b"")
        self.assertIn(b"not a git repository", stderr)
        with self.assertRaisesRegex(RuntimeError, "source-status-after exited with 128"):
            RUNNER.require_clean_git_status(record)


if __name__ == "__main__":
    unittest.main()
