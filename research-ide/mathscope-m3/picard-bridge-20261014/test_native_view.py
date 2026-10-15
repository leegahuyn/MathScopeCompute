"""Fail-closed checks for the M3 Picard evidence view, not proof checks."""
import copy
import json
import unittest

from render_native_view import DB_SHA, HEADER_SHA, OPERATORS, embedded_json, render, validate


def fixture():
    """Synthetic test input: source IDs do not represent real source evidence."""
    calls = []
    for operator, count in OPERATORS.items():
        calls += [{"sourceNode": len(calls) + i, "operator": operator}
                  for i in range(count)]
    calls[157]["sourceNode"] = 1953
    return {
        "schema": "MathScope.N6.PicardActualNativeDomainInventory/1",
        "source": {"headerSHA256": HEADER_SHA, "databaseSHA256": DB_SHA,
                   "picard": "ActualSameN3OrderOneInner", "eta": 2, "xi": 25516},
        "actualNativeCalls": calls,
        "nativeLRoot": {"formula": "1-2*h*eta^2", "allFoundOriginalInverseNodes": [1953],
                        "analyticallyValidForNativeInverseCalls": True},
        "actualRootCoefficientClosure": {"uniqueNodeCount": 3679},
        "N6RemainingJetsUnchanged": 230, "N6TotalGlobalGuardCountUnchanged": 38,
        "N6ResidualPDETermsUnchanged": 1020, "originalM3Status": "56/64",
        "originalN601Complete": False, "originalN602Complete": False,
        "nativeA0A1ForcingCommonHolomorphicStripProved": False,
        "nativeA0A1ForcingUniformComplexSupNormProved": False,
        "sameProfileM2PicardNormTransferredToAllOriginalN6": False,
        "naturalSeriesFamilyInventory": {
            "schema": "MathScope.N6.PicardNaturalSeriesFamilyInventory/1",
            "summary": {"callCount": 157, "argumentFamilyCount": 2,
                        "fullCoefficientNormProved": False,
                        "exactArgumentDomainProvedCalls": 83,
                        "argumentDomainUnresolvedCalls": 74,
                        "actualKernelHolomorphyProvedCalls": 0},
            "families": [
                {"id": "family-a", "sourceNodes": list(range(83)), "callCount": 83,
                 "YSourceNode": 1, "etaSourceNode": 2,
                 "componentCounts": {"Phi": 83}, "derivativeOrders": [[0, 0]],
                 "radialDomain": {"status": "PROVED_ARGUMENT_RANGE_ONLY", "absoluteBound": "5"},
                 "etaDomain": {"quarterStadiumCovered": False}},
                {"id": "family-b", "sourceNodes": list(range(83, 157)), "callCount": 74,
                 "YSourceNode": 3, "etaSourceNode": 2,
                 "componentCounts": {"u": 51, "average": 23}, "derivativeOrders": [[0, 0]],
                 "radialDomain": {"status": "UNRESOLVED"},
                 "etaDomain": {"quarterStadiumCovered": False}},
            ],
            "convergenceLemma": {"status": "PROVED_CONDITIONAL"},
            "blockers": ["Synthetic input for renderer tests only"],
        },
    }


class NativeViewTests(unittest.TestCase):
    def test_complete_call_partition_embedded(self):
        data = fixture()
        self.assertIs(validate(data), data)
        html = render(data)
        self.assertIn("N6-01 OPEN · N6-02 PARTIAL · M3 56/64", html)
        self.assertIn("Cartesian Jet 230", html)
        self.assertNotIn("__AUDIT_JSON__", html)
        start = html.index('type="application/json">') + len('type="application/json">')
        self.assertEqual(json.loads(html[start:html.index("</script>", start)]), data)

    def test_duplicate_family_membership_rejected(self):
        data = fixture()
        data["naturalSeriesFamilyInventory"]["families"][1]["sourceNodes"][0] = 0
        with self.assertRaisesRegex(ValueError, "exactly once"):
            render(data)

    def test_missing_native_call_rejected(self):
        data = fixture()
        data["actualNativeCalls"].pop()
        with self.assertRaisesRegex(ValueError, "216"):
            render(data)

    def test_unpinned_source_rejected(self):
        data = fixture()
        data["source"]["databaseSHA256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "pinned Picard"):
            render(data)

    def test_unbound_L_claim_rejected(self):
        data = fixture()
        data["nativeLRoot"]["allFoundOriginalInverseNodes"] = []
        with self.assertRaisesRegex(ValueError, "original inverse"):
            render(data)

    def test_summary_mismatch_rejected(self):
        data = fixture()
        data["naturalSeriesFamilyInventory"]["summary"]["callCount"] = 156
        with self.assertRaisesRegex(ValueError, "summary"):
            render(data)

    def test_frontier_promotion_rejected(self):
        for key, value in {"N6RemainingJetsUnchanged": 0,
                           "originalN601Complete": True,
                           "originalM3Status": "64/64"}.items():
            with self.subTest(key=key):
                data = fixture()
                data[key] = value
                with self.assertRaisesRegex(ValueError, "promote"):
                    render(data)

    def test_unreviewed_full_norm_promotion_rejected(self):
        data = fixture()
        data["nativeA0A1ForcingUniformComplexSupNormProved"] = True
        with self.assertRaisesRegex(ValueError, "proof scope"):
            render(data)

    def test_script_payload_is_safe_and_lossless(self):
        value = {"description": '</script><script>alert("x")</script>&\u2028'}
        encoded = embedded_json(value)
        self.assertNotIn("</script>", encoded)
        self.assertNotIn("<", encoded)
        self.assertEqual(json.loads(encoded), value)


if __name__ == "__main__":
    unittest.main()
