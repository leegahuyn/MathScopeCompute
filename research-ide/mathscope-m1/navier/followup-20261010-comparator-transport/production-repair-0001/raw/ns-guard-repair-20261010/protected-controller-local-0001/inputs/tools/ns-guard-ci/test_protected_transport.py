"""Actual PTY/stream tests plus simulated-client failure/cleanup checks.

No original kernel, Comparator, or real systemd service is run by these tests.
The deployed diagnostic provides the separate, actual guard evidence.
"""
from __future__ import annotations

import io
import json
import os
from pathlib import Path
import signal
import sys
from unittest import mock

import protected_transport
import test_transport as diagnostic_tests


class ProtectedTransportTests(diagnostic_tests.TransportTests):
    def run_python(self, program, *, mode="pipe", timeout=3, on_timeout=None):
        log = self.root / "capture.log"
        streamed = io.BytesIO()
        record = protected_transport.run_transport([sys.executable, "-u", "-c", program],
            cwd=self.root, env=os.environ.copy(), transport=mode,
            timeout_seconds=timeout, log_path=log, on_timeout=on_timeout,
            on_chunk=streamed.write)
        content = log.read_bytes()
        self.assertEqual(streamed.getvalue(), content)
        self.assertEqual(record["streamedBytes"], len(content))
        return record, content

    def test_refuses_unbounded_diagnostic_timeout(self):
        # Overrides the diagnostic-only 30-second cap for this separate module.
        for timeout in (0, -1, 330 * 60 + 1):
            with self.assertRaises(ValueError):
                self.run_python("pass", timeout=timeout)

    def test_explicit_330_minute_budget_is_accepted_without_waiting_for_it(self):
        record, content = self.run_python("print('finished immediately')", mode="outer-pty", timeout=330 * 60)
        self.assertFalse(record["timedOut"])
        self.assertEqual(record["timeoutSeconds"], 19800)
        self.assertEqual(record["exitCodeBeforeCleanup"], 0)
        self.assertIn(b"finished immediately", content)

    def test_large_binary_chunks_stream_exactly_as_captured(self):
        record, content = self.run_python(
            "import os; os.write(1,b'\\x00\\xffBEGIN\\n'); os.write(2,b'Z'*200000); os.write(1,b'END')",
            mode="outer-pty")
        self.assertIn(b"\x00\xffBEGIN", content)
        self.assertEqual(content.count(b"Z"), 200000)
        self.assertTrue(content.endswith(b"END"))
        self.assertEqual(record["exitCodeBeforeCleanup"], 0)

    def simulated_guard(self, *, fail_stream=False):
        # This executable is deliberately a fake systemd client. Only local
        # transport/error behavior is under test, never guard effectiveness.
        binary = self.root / "systemd-run"
        binary.write_text("#!" + sys.executable + "\n" +
            "import json,os,signal,sys,time\n"
            "signal.signal(signal.SIGTERM,lambda *_:sys.exit(0))\n"
            "open('fake-client-pid','w').write(str(os.getpid()))\n"
            "print(json.dumps({'fakeClientPID':os.getpid()}),flush=True)\n"
            "time.sleep(10)\n")
        binary.chmod(0o755)
        env = os.environ.copy()
        env["PATH"] = str(self.root) + os.pathsep + env["PATH"]
        command = ["systemd-run", "--user", "--pty", "--wait", "--collect",
            "--property=RestrictAddressFamilies=~AF_UNIX", "-E", "PATH=" + env["PATH"],
            "--working-directory=" + str(self.root), "--", "/bin/false"]
        queries = []

        def fake_query(argv, passed_env):
            queries.append(list(argv))
            return {"command": list(argv), "exitCode": 4, "timedOut": False,
                    "timeoutSeconds": 3, "stdout": "", "stderr": "simulated missing unit"}

        stream = io.BytesIO()

        def on_chunk(chunk):
            if fail_stream:
                raise OSError("simulated CI stream failure")
            stream.write(chunk)

        handlers = {sig: signal.getsignal(sig) for sig in (signal.SIGTERM, signal.SIGINT)}
        with mock.patch.object(protected_transport, "bounded_query", side_effect=fake_query):
            record = protected_transport.run_guarded("test-stage", command, cwd=self.root, env=env,
                timeout_seconds=0.6, log_path=self.root / "guard.log", on_chunk=on_chunk)
        for sig, old in handlers.items():
            self.assertEqual(signal.getsignal(sig), old)
        cleanup = [argv for argv in queries if "stop" in argv or "kill" in argv]
        self.assertTrue(cleanup)
        for argv in cleanup:
            self.assertEqual(argv[-1], record["unit"])
        self.assertEqual([arg for arg in record["command"] if not arg.startswith("--unit=")], command)
        self.assertFalse(record["passed"])
        if (self.root / "fake-client-pid").exists():
            pid = int((self.root / "fake-client-pid").read_text())
            with self.assertRaises(ProcessLookupError):
                os.kill(pid, 0)
        return record

    def test_simulated_client_cleanup_exit0_does_not_pass_guard(self):
        record = self.simulated_guard()
        self.assertTrue(record["timedOut"])
        self.assertIsNone(record["exitCodeBeforeCleanup"])
        self.assertEqual(record["finalClientExitCode"], 0)

    def test_stream_exception_records_failure_and_cleans_only_own_unit(self):
        record = self.simulated_guard(fail_stream=True)
        self.assertIn("simulated CI stream failure", record["transportException"])
        self.assertIn("exceptionOrTimeoutCleanup", record)

    def test_guard_prefix_cannot_drop_AF_UNIX_or_PTY(self):
        env = os.environ.copy()
        prefix = ["systemd-run", "--user", "--pty", "--wait", "--collect",
            "--property=RestrictAddressFamilies=~AF_UNIX", "-E", "PATH=" + env["PATH"],
            "--working-directory=" + str(self.root), "--", "/bin/true"]
        for option in ("--pty", "--property=RestrictAddressFamilies=~AF_UNIX"):
            changed = [part for part in prefix if part != option]
            with self.assertRaises(ValueError):
                protected_transport.run_guarded("invalid-prefix", changed, cwd=self.root, env=env,
                    timeout_seconds=1, log_path=self.root / "must-not-exist.log", on_chunk=lambda chunk: None)
        self.assertFalse((self.root / "must-not-exist.log").exists())
