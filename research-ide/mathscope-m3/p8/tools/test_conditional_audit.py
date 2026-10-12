import unittest
from audit_conditional_lean import AXIOM,TARGET,AXIOM_LINE,remove_assumption,parse_conditional,expected_removal_rejection,imports

def block(name,custom=AXIOM,proposition='2 + 2 = 4'):
    return f"P8_CONDITIONAL_BEGIN {name}\n{name} : {proposition}\n'{name}' depends on axioms: [{custom}]\nP8_CONDITIONAL_END {name}\n"

class ConditionalAuditTests(unittest.TestCase):
    def test_conditional_closure_uses_header_only_parser(self):
        self.assertEqual(imports('module\nprelude\npublic import Init.Prelude\npublic section\ndef commentMarker := "/-"'),['Init.Prelude'])
        with self.assertRaises(ValueError):imports('import /- broken header')

    def test_literal_target_axiom_set(self):
        targets=parse_conditional(block(AXIOM)+block(TARGET))
        self.assertEqual(targets[1]['axioms']['custom'],[AXIOM])
        self.assertEqual(targets[1]['axioms']['standard'],[])

    def test_hidden_axiom_wrong_goal_or_missing_report_fails(self):
        for value in [block(AXIOM)+block(TARGET,'sorryAx'),block(AXIOM)+block(TARGET,proposition='False'),block(TARGET),block(AXIOM)+block(TARGET)+'extra',block(AXIOM)+block(TARGET)+block(TARGET)]:
            with self.subTest(value=value),self.assertRaises(ValueError):parse_conditional(value)

    def test_removal_deletes_exact_declaration_only(self):
        source=AXIOM_LINE+'theorem conditional_target : (2 : Nat) + 2 = 4 := assumedTarget\n'
        removed=remove_assumption(source)
        self.assertEqual(removed,'theorem conditional_target : (2 : Nat) + 2 = 4 := assumedTarget\n')
        for bad in [source+AXIOM_LINE,source.replace('assumedTarget\n','by decide\n')]:
            with self.assertRaises(ValueError):remove_assumption(bad)

    def test_missing_import_or_generic_crash_is_not_removal_evidence(self):
        good='RemovedAssumption.lean:8:60: error: Unknown identifier `assumedTarget`\n'
        self.assertTrue(expected_removal_rejection(good,1))
        for log,code in [(good,0),('RemovedAssumption.lean:1:0: error: object file missing',1),('segmentation fault',-11),(good+'RemovedAssumption.lean:9:0: error: other\n',1),('Other.lean:1:0: error: Unknown identifier `assumedTarget`',1)]:self.assertFalse(expected_removal_rejection(log,code))

    def test_pinned_lean_coded_diagnostic_and_other_error_categories(self):
        # Observed in the actual pinned Lean 4.34.1 CI artifact 11728501909.
        good='/home/runner/work/MathScopeCompute/MathScopeCompute/research-ide/mathscope-m3/p8/evidence/conditional-lean-audit/RemovedAssumption.lean:9:50: error(lean.unknownIdentifier): Unknown identifier `assumedTarget`\n'
        self.assertTrue(expected_removal_rejection(good,1))
        for log in [good+'Other.lean:1:0: error(lean.parser): bad syntax\n',good.replace('lean.unknownIdentifier','lean.parser'),good.replace('assumedTarget','otherTarget'),good.replace('RemovedAssumption.lean','WrongFile.lean'),good+'RemovedAssumption.lean:10:0: error: missing import\n']:
            with self.subTest(log=log):self.assertFalse(expected_removal_rejection(log,1))

if __name__=='__main__':unittest.main()
