"""Adversarial tests for the lexical checker, not substitute function proofs."""
import unittest
import radius_monotone as audit

class CaptureTests(unittest.TestCase):
    def setUp(self):
        self.nodes={0:{"op":"rational","args":["0","1"]},1:{"op":"rational","args":["1","1"]},
          2:{"op":"coordinate","args":["eta"]},3:{"op":"coordinate","args":["xi"]},
          4:{"op":"coordinate","args":["hidden"]}}
        core={"eta":2,**{k:0 for k in ("h","Lambda","A","D","d","L","Ustar","Hstar","Wstar","Zstar","chi","zeta","gSquared")}}
        self.tables={"fixed":{"core":core},"expression":[],"monotone":[],"quadratic":[],"picard":[]}

    def test_named_function_hidden_capture_is_retained(self):
        self.nodes[5]={"op":"add","args":[3,4]}
        self.nodes[6]={"op":"actual_expression_partial","args":[0,[1],[0]]}
        self.tables["expression"]=[{"body":5,"parameters":[3]}]
        result=audit.source_closure(self.nodes,self.tables,6)
        self.assertTrue(result["coordinateCaptureClosureProved"])
        self.assertEqual(result["freeCoordinateNodes"],[4])
        self.assertFalse(result["closedConstantProved"])
        self.assertFalse(result["actualInfiniteLimitExistenceProved"])

    def test_picard_hidden_capture_does_not_hide_behind_signature(self):
        self.nodes[5]={"op":"add","args":[3,4]}
        self.nodes[6]={"op":"actual_background_even_profile","args":[0,0,1,1,2,3]}
        self.tables["picard"]=[{"xi":3,"eta":2,"A0":[[0]],"A1":[[0]],"forcing":[5],
          "zeroAxisDatum":[0],"radialDomain":[0,1],"tail":{},"solutionNorm":{}}]
        result=audit.source_closure(self.nodes,self.tables,6)
        self.assertEqual(result["freeCoordinateNodes"],[4])
        self.assertFalse(result["closedConstantProved"])

    def test_picard_arguments_are_bound_by_actual_integral(self):
        self.nodes[5]={"op":"add","args":[3,2]}
        self.nodes[6]={"op":"actual_background_even_profile","args":[0,0,3,2,2,3]}
        self.nodes[7]={"op":"definite_integral","args":[6,3,0,1]}
        self.nodes[8]={"op":"definite_integral","args":[7,2,0,1]}
        self.tables["picard"]=[{"xi":3,"eta":2,"A0":[[0]],"A1":[[0]],"forcing":[5],
          "zeroAxisDatum":[0],"radialDomain":[0,1],"tail":{},"solutionNorm":{}}]
        result=audit.source_closure(self.nodes,self.tables,8)
        self.assertTrue(result["closedConstantProved"])
        self.assertEqual(result["freeCoordinateNodes"],[])
        self.assertFalse(result["actualInfiniteLimitExistenceProved"])

    def test_unknown_or_missing_body_cannot_prove_constant(self):
        self.nodes[5]={"op":"unreviewed_limit","args":[4]}
        result=audit.source_closure(self.nodes,self.tables,5)
        self.assertFalse(result["coordinateCaptureClosureProved"])
        self.assertFalse(result["closedConstantProved"])
        missing=audit.source_closure(self.nodes,self.tables,99)
        self.assertFalse(missing["coordinateCaptureClosureProved"])

    def test_exact_scalar_checks_and_scope_flags(self):
        result=audit.exact_side_conditions()
        self.assertTrue(result["allPassed"])
        self.assertEqual(result["Q_at_zero"],"1/2")
        self.assertTrue(result["noFiniteSampleAcceptedAsProof"])
        lemma=audit.universal_lemmas()[2]
        self.assertEqual(lemma["status"],"PROVED")
        self.assertEqual(lemma["sourceApplicationStatus"],"UNRESOLVED_ACTUAL_PRELOOP_ENVELOPE")

if __name__=="__main__":unittest.main()
