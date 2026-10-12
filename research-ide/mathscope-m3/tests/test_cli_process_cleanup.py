"""Input serialization must not spawn or orphan a bounded CLI worker."""

from copy import deepcopy
import math
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import cli


REQUEST = {"kind": "p7.elliptic_local", "input": {"model": "11a1"}}


class CLIProcessCleanupTests(unittest.TestCase):
    def test_parser_rejects_float_overflow_including_nested_values(self):
        for raw in ('{"n":1e309}', '{"n":-1e309}', '{"n":[{"v":1e9999}]}', '{"n":NaN}'):
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                cli.parse_json(raw)
        self.assertTrue(math.isfinite(cli.parse_json('{"n":1e308}')["n"]))

    def test_parser_rejects_isolated_surrogates_but_accepts_valid_pairs(self):
        for raw in (b'{"n":"\\ud800"}', b'{"\\udfff":1}', b'{"n":"\\udfff"}'):
            with self.subTest(raw=raw), self.assertRaises(UnicodeEncodeError):
                cli.parse_json(raw)
        self.assertEqual(cli.parse_json(b'{"n":"\\ud83d\\ude00"}')["n"], "\U0001f600")

    def test_noncanonical_python_requests_are_rejected_before_any_child(self):
        for value in (float("inf"), float("-inf"), float("nan"), "\ud800", "\udfff", object()):
            request = deepcopy(REQUEST)
            request["input"]["model"] = value
            with self.subTest(value=repr(value)), patch.object(cli.subprocess, "Popen") as popen, \
                    patch.object(cli, "source_binding") as source:
                with self.assertRaises((ValueError, TypeError)):
                    cli.execute(request)
                popen.assert_not_called()
                source.assert_not_called()

    def test_oversized_direct_request_is_rejected_before_child(self):
        request = deepcopy(REQUEST)
        request["input"]["model"] = "x"*100
        with patch.object(cli, "MAX_JSON_BYTES", 64), patch.object(cli.subprocess, "Popen") as popen:
            with self.assertRaisesRegex(ValueError, "input limit"):
                cli.execute(request)
            popen.assert_not_called()

    def _mock_child(self):
        child = MagicMock()
        child.returncode = None
        child.poll.side_effect = lambda: child.returncode
        child.kill.side_effect = lambda: setattr(child, "returncode", -9)
        child.wait.side_effect = lambda: child.returncode
        return child

    def _execute_mock(self, child):
        with patch.object(cli.subprocess, "Popen", return_value=child), \
                patch.object(cli, "source_binding", return_value={}), \
                patch.object(cli, "environment", return_value={}), \
                patch.object(cli, "predecessor", return_value={}):
            return cli.execute(deepcopy(REQUEST), max_seconds=1, memory_mib=128)

    def test_communication_errors_and_base_exceptions_kill_and_reap(self):
        for error in (OSError("injected pipe failure"), ValueError("injected transport error"), KeyboardInterrupt()):
            child = self._mock_child()
            child.communicate.side_effect = error
            with self.subTest(error=type(error).__name__), self.assertRaises(type(error)):
                self._execute_mock(child)
            child.kill.assert_called_once()
            child.wait.assert_called_once()
            for stream in (child.stdin, child.stdout, child.stderr):
                stream.close.assert_called_once()

    def test_error_while_draining_timed_out_child_still_reaps_and_closes(self):
        child = self._mock_child()
        child.communicate.side_effect = [subprocess.TimeoutExpired("worker", 1), OSError("drain failed")]
        with self.assertRaisesRegex(OSError, "drain failed"):
            self._execute_mock(child)
        child.kill.assert_called_once()
        child.wait.assert_called_once()
        for stream in (child.stdin, child.stdout, child.stderr):
            stream.close.assert_called_once()

    def test_timeout_returns_unresolved_only_after_child_is_reaped(self):
        child = self._mock_child()
        child.communicate.side_effect = [subprocess.TimeoutExpired("worker", 1), (b"", b"")]
        record = self._execute_mock(child)
        self.assertEqual(record["execution"]["status"], "UNRESOLVED")
        self.assertTrue(record["execution"]["timedOut"])
        self.assertEqual(record["execution"]["observedExitCode"], -9)
        child.kill.assert_called_once()
        child.wait.assert_called_once()

    def test_success_also_reaps_and_closes_without_killing(self):
        child = self._mock_child()
        reply = cli.canonical({"ok": True, "value": {}, "environmentSHA256": cli.digest({})})
        def communicate(payload, timeout):
            self.assertEqual(payload, cli.canonical(REQUEST))
            child.returncode = 0
            return reply, b""
        child.communicate.side_effect = communicate
        record = self._execute_mock(child)
        self.assertEqual(record["execution"]["status"], "COMPLETED")
        child.kill.assert_not_called()
        child.wait.assert_called_once()
        for stream in (child.stdin, child.stdout, child.stderr):
            stream.close.assert_called_once()

    def test_actual_child_waiting_on_stdin_is_killed_after_injected_pipe_failure(self):
        # An actual disposable process demonstrates that the finally block
        # reaps the worker, rather than only setting a bookkeeping flag.
        real_popen = subprocess.Popen
        observed = []
        def factory(*args, **kwargs):
            child = real_popen([sys.executable, "-c", "import sys; sys.stdin.buffer.read()"],
                               stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            observed.append(child)
            def fail(*args, **kwargs):
                raise OSError("injected after actual spawn")
            child.communicate = fail
            return child
        try:
            with patch.object(cli.subprocess, "Popen", side_effect=factory), \
                    patch.object(cli, "source_binding", return_value={}), \
                    patch.object(cli, "environment", return_value={}), \
                    patch.object(cli, "predecessor", return_value={}):
                with self.assertRaisesRegex(OSError, "after actual spawn"):
                    cli.execute(deepcopy(REQUEST), max_seconds=1, memory_mib=128)
            self.assertEqual(len(observed), 1)
            self.assertIsNotNone(observed[0].poll())
            self.assertTrue(all(stream.closed for stream in (observed[0].stdin, observed[0].stdout, observed[0].stderr)))
        finally:
            for child in observed:
                if child.poll() is None:
                    child.kill()
                child.wait()


if __name__ == "__main__":
    unittest.main()
