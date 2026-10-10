"""Meaningful transport checks; no systemd service or original kernel is run."""
from __future__ import annotations

import json
import os
from pathlib import Path
import signal
import sys
import tempfile
import time
import unittest

from transport import run_transport


class TransportTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="mathscope-transport-test-")
        self.root = Path(self.directory.name)

    def tearDown(self):
        self.directory.cleanup()

    def run_python(self, program, *, mode="pipe", timeout=3, on_timeout=None):
        log = self.root / "capture.log"
        record = run_transport([sys.executable, "-u", "-c", program],
            cwd=self.root, env=os.environ.copy(), transport=mode,
            timeout_seconds=timeout, log_path=log, on_timeout=on_timeout)
        return record, log.read_bytes()

    def test_pipe_captures_both_streams_and_no_final_newline(self):
        record, data = self.run_python(
            "import os; os.write(1, b'first\\n'); os.write(2, b'error\\n'); os.write(1, b'last')")
        self.assertEqual(data, b"first\nerror\nlast")
        self.assertEqual(record["exitCodeBeforeCleanup"], 0)
        self.assertEqual(record["finalClientExitCode"], 0)
        self.assertTrue(record["eofObservedBeforeCleanup"])
        self.assertFalse(record["timedOut"])
        self.assertIsNone(record["captureError"])

    def test_outer_pty_has_three_tty_fds_and_controlling_terminal(self):
        record, data = self.run_python(
            "import os,json; print(json.dumps({'tty':[os.isatty(i) for i in range(3)],"
            "'foreground':os.tcgetpgrp(0),'group':os.getpgrp(),'sid':os.getsid(0),'pid':os.getpid()}))",
            mode="outer-pty")
        actual = json.loads(data.decode().strip())
        self.assertEqual(actual["tty"], [True, True, True])
        self.assertEqual(actual["foreground"], actual["group"])
        self.assertEqual(actual["sid"], actual["pid"])
        self.assertEqual(record["finalClientExitCode"], 0)
        self.assertTrue(record["eofObservedBeforeCleanup"])
        self.assertFalse(record["timedOut"])

    def test_outer_pty_eof_does_not_turn_nonzero_exit_into_success(self):
        record, data = self.run_python(
            "import os,sys; os.write(1,'실제 출력\\n'.encode()); os.write(2,b'stderr'); sys.exit(7)",
            mode="outer-pty")
        self.assertIn("실제 출력".encode(), data)
        self.assertIn(b"stderr", data)
        self.assertEqual(record["exitCodeBeforeCleanup"], 7)
        self.assertEqual(record["finalClientExitCode"], 7)
        self.assertTrue(record["eofObservedBeforeCleanup"])
        self.assertFalse(record["timedOut"])

    def test_timeout_retains_partial_output_and_real_cleanup_exit(self):
        calls = []
        record, data = self.run_python(
            "import os,time; os.write(1,b'partial-without-newline'); time.sleep(10)",
            timeout=0.3, on_timeout=lambda pid: calls.append(pid) or {"ownedUnitCleanup": "test callback"})
        self.assertEqual(data, b"partial-without-newline")
        self.assertTrue(record["timedOut"])
        self.assertIsNone(record["exitCodeBeforeCleanup"])
        self.assertFalse(record["eofObservedBeforeCleanup"])
        self.assertEqual(record["finalClientExitCode"], -signal.SIGTERM)
        self.assertEqual(calls, [record["pid"]])
        self.assertLess(record["elapsedSeconds"], 4)
        self.assertNotIn("cleanupIncomplete", record)

    def test_timeout_remains_failure_when_sigterm_handler_exits_zero(self):
        record, data = self.run_python(
            "import signal,sys,time; signal.signal(signal.SIGTERM,lambda *_:sys.exit(0));"
            "print('ready',flush=True); time.sleep(10)", mode="outer-pty", timeout=0.3)
        self.assertIn(b"ready", data)
        self.assertTrue(record["timedOut"])
        self.assertIsNone(record["exitCodeBeforeCleanup"])
        self.assertEqual(record["finalClientExitCode"], 0)

    def test_exit_before_eof_is_preserved_when_descendant_holds_pipe(self):
        child_pid_file = self.root / "descendant-pid"
        try:
            record, data = self.run_python(
                "import os,time; pid=os.fork(); "
                "\nif pid == 0:\n time.sleep(1); os._exit(0)"
                "\nelse:\n open('descendant-pid','w').write(str(pid)); os.write(1,b'parent-exited'); os._exit(0)",
                timeout=0.2)
            self.assertIn(b"parent-exited", data)
            self.assertTrue(record["timedOut"])
            self.assertEqual(record["exitCodeBeforeCleanup"], 0)
            self.assertFalse(record["eofObservedBeforeCleanup"])
            self.assertEqual(record["finalClientExitCode"], 0)
        finally:
            if child_pid_file.exists():
                try:
                    os.kill(int(child_pid_file.read_text()), signal.SIGKILL)
                except ProcessLookupError:
                    pass

    def test_refuses_unbounded_diagnostic_timeout(self):
        for timeout in (0, -1, 31):
            with self.assertRaises(ValueError):
                self.run_python("pass", timeout=timeout)


if __name__ == "__main__":
    unittest.main()
