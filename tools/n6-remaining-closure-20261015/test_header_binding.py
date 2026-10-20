"""Mutation controls for header equality only; fixtures are not source proofs."""
import copy
import gzip
import json
from pathlib import Path
import tempfile
import unittest

from header_binding import HeaderBindingError, bind_header_to_gzip


class HeaderBindingTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.compressed = self.root / "fixture.ndjson.gz"
        self.detached = self.root / "header.json"
        self.header = {
            "firstNode": 0,
            "nodeCount": 1,
            "definitions": {
                "base": {"expression": '[{"body":0,"parameters":[]}]'},
                "nested": {"row": {"enabled": True, "values": [1, 2]}},
            },
        }
        self.write_source(self.header)
        self.write_detached(self.header)

    def write_source(self, value):
        raw = json.dumps(value, ensure_ascii=False).encode() + b"\n[0,{\"op\":\"rational\",\"args\":[\"0\",\"1\"]}]\n"
        self.compressed.write_bytes(gzip.compress(raw))

    def write_detached(self, value):
        self.detached.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")

    def bind(self):
        return bind_header_to_gzip(self.compressed, self.detached)

    def mutate(self, mutation):
        changed = copy.deepcopy(self.header)
        mutation(changed)
        self.write_detached(changed)
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_accept_identical_header_without_claiming_graph_proof(self):
        header, evidence = self.bind()
        self.assertEqual(header, self.header)
        self.assertEqual(evidence["registryConsumedFrom"], "source gzip first record")
        self.assertFalse(evidence["fullGraphAuthenticatedByThisGate"])
        self.assertEqual(evidence["mathematicalObligationsDischarged"], 0)

    def test_accept_object_key_order_and_whitespace(self):
        self.detached.write_text(json.dumps(self.header, indent=4, sort_keys=True), encoding="utf-8")
        self.bind()

    def test_returned_header_is_not_detached_mutable_alias(self):
        header, _ = self.bind()
        self.header["definitions"]["nested"]["row"]["values"].append(3)
        self.assertEqual(header["definitions"]["nested"]["row"]["values"], [1, 2])

    def test_reject_missing_nested_registry_field(self):
        self.mutate(lambda h: h["definitions"]["nested"]["row"].pop("enabled"))

    def test_reject_extra_nested_registry_field(self):
        self.mutate(lambda h: h["definitions"]["nested"]["row"].update({"hidden": 3615151}))

    def test_reject_changed_encoded_registry_body(self):
        self.mutate(lambda h: h["definitions"]["base"].update({"expression": '[{"body":1,"parameters":[]} ]'}))

    def test_reject_bool_to_integer_even_though_python_equality_accepts(self):
        self.assertEqual(True, 1)
        self.mutate(lambda h: h["definitions"]["nested"]["row"].update({"enabled": 1}))

    def test_reject_integer_to_float(self):
        self.assertEqual(1, 1.0)
        self.mutate(lambda h: h.update({"nodeCount": 1.0}))

    def test_reject_array_reordering(self):
        self.mutate(lambda h: h["definitions"]["nested"]["row"].update({"values": [2, 1]}))

    def test_reject_null_instead_of_false(self):
        self.mutate(lambda h: h["definitions"]["nested"]["row"].update({"enabled": None}))

    def test_reject_duplicate_detached_json_key(self):
        self.detached.write_bytes(b'{"definitions":{},"definitions":{}}')
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_reject_duplicate_source_json_key(self):
        self.compressed.write_bytes(gzip.compress(b'{"definitions":{},"definitions":{}}\n'))
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_reject_nonfinite_json(self):
        self.detached.write_bytes(b'{"definitions":{},"bad":NaN}')
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_reject_overflowed_json_number(self):
        self.detached.write_bytes(b'{"definitions":{},"bad":1e9999}')
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_reject_distinct_decimals_that_binary_float_rounds_equal(self):
        left = b'{"definitions":{},"value":0.123456789012345678901}'
        right = b'{"definitions":{},"value":0.123456789012345678902}'
        self.assertEqual(json.loads(left), json.loads(right))
        self.compressed.write_bytes(gzip.compress(left + b"\n"))
        self.detached.write_bytes(right)
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_return_standard_float_after_exact_decimal_comparison(self):
        raw = b'{"definitions":{},"value":0.5}'
        self.compressed.write_bytes(gzip.compress(raw + b"\n"))
        self.detached.write_bytes(raw)
        header, _ = self.bind()
        self.assertIs(type(header["value"]), float)

    def test_reject_invalid_utf8(self):
        self.detached.write_bytes(b'{"definitions":{},"bad":"\xff"}')
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_reject_nonobject_header(self):
        self.detached.write_text("[]", encoding="utf-8")
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_reject_absent_definitions(self):
        self.write_source({"firstNode": 0, "nodeCount": 1})
        self.write_detached({"firstNode": 0, "nodeCount": 1})
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_reject_wrong_definitions_type(self):
        self.write_source({"definitions": []})
        self.write_detached({"definitions": []})
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_reject_missing_source_header_newline(self):
        self.compressed.write_bytes(gzip.compress(json.dumps(self.header).encode()))
        with self.assertRaises(HeaderBindingError):
            self.bind()

    def test_reject_header_read_limit(self):
        with self.assertRaises(HeaderBindingError):
            bind_header_to_gzip(self.compressed, self.detached, max_header_bytes=10)

    def test_reject_invalid_size_limit(self):
        for value in (0, -1, True, 1.0):
            with self.subTest(value=value), self.assertRaises(HeaderBindingError):
                bind_header_to_gzip(self.compressed, self.detached, max_header_bytes=value)


if __name__ == "__main__":
    unittest.main(verbosity=2)
