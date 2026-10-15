"""Independent negative controls for the pinned M2-to-N6 Picard bridge."""
from __future__ import annotations
import copy
import json
import os
from pathlib import Path
import sys
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parent))
from verify_majorant import inspect

class PicardBridgeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads(Path(os.environ["PICARD_BRIDGE_INPUT"]).read_text(encoding="utf8"))

    def test_original_bound_verifies(self):
        result=inspect(self.data)
        self.assertEqual(result["derivedExactMonomial"]["factor"],str(9*2**140))
        self.assertFalse(result["sourceNativeFullN6AnalyticDomainsProvedByThisAudit"])

    def test_missing_open_conditions_rejected(self):
        broken=copy.deepcopy(self.data)
        broken["requiredBridgeClaims"][0]["status"]="PROVED"
        with self.assertRaises(AssertionError):
            inspect(broken)

    def test_wrong_picard_derivative_block_rejected(self):
        broken=copy.deepcopy(self.data)
        broken["exactM2OriginalSystem"]["A1"][0][4]="1"
        with self.assertRaises(AssertionError):
            inspect(broken)

    def test_weakening_materialized_K_is_rejected(self):
        broken=copy.deepcopy(self.data)
        broken["majorantConstants"]["truncationIndex"]["max"][1]["ceil"]["quotient"][0]["product"][0]["integer"]="7"
        with self.assertRaises(AssertionError):
            inspect(broken)

    def test_order_two_as_order_one_is_rejected(self):
        broken=copy.deepcopy(self.data)
        broken["verifiedM2FixedOrder"]=2
        with self.assertRaises(AssertionError):
            inspect(broken)

    def test_global_claim_promotion_is_rejected(self):
        broken=copy.deepcopy(self.data)
        broken["allOriginalSourceEtaComplexInverseDomainsVerified"]=True
        with self.assertRaises(AssertionError):
            inspect(broken)

if __name__=='__main__':
    unittest.main()
