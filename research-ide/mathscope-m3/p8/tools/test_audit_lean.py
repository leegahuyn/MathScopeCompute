"""Parser controls are not substitutes for the CI kernel execution."""
import unittest
from audit_lean import parse_targets, imports, strip_comments, target_manifest

def report(name, axioms="does not depend on any axioms", statement=None):
    return f"P8_AUDIT_BEGIN {name}\n{statement or (name+' : 2 + 2 = 4')}\n'{name}' {axioms}\nP8_AUDIT_END {name}\n"

class AuditParserTests(unittest.TestCase):
    def test_complete_exact_manifest(self):
        names=[row['name'] for row in target_manifest()]
        rows=parse_targets(''.join(report(n) for n in names))
        self.assertEqual(len(rows),12)
        self.assertTrue(all(row['axioms']['custom']==[] for row in rows))

    def test_missing_duplicate_reordered_or_trailing_rejected(self):
        names=['A','B']; good=report('A')+report('B')
        for log in [report('A'),report('A')+report('A'),report('B')+report('A'),good+'warning: spoof',good.replace('P8_AUDIT_END B','')]:
            with self.subTest(log=log), self.assertRaises(ValueError):parse_targets(log,names)

    def test_wrong_type_or_custom_axiom_rejected(self):
        for log in [report('A',statement='B : True'),report('A',"depends on axioms: [sorryAx]"),report('A',"depends on axioms: [MyAssumedTarget]"),report('A',"depends on axioms: [propext, propext]"),report('A').replace("'A' does", "'B' does")]:
            with self.subTest(log=log), self.assertRaises(ValueError):parse_targets(log,['A'])

    def test_multiline_type_and_standard_axioms_kept_verbatim(self):
        statement='A.{u_1} (x : Nat) :\n  x = x'
        rows=parse_targets(report('A',"depends on axioms: [propext,\n Classical.choice, Quot.sound]",statement),['A'])
        self.assertEqual(rows[0]['type'],statement)
        self.assertEqual(rows[0]['axioms']['standard'],['Classical.choice','Quot.sound','propext'])

    def test_import_header_handles_lean_module_syntax(self):
        self.assertEqual(imports('/- /- nested -/ -/\nmodule\nprelude\npublic import Init.Prelude\nimport all Lean.Elab.Tactic.Omega\npublic section\n'),['Init.Prelude','Lean.Elab.Tactic.Omega'])
        self.assertEqual(imports('import Mathlib.Tactic.Ring\n#eval "import False"'),['Init','Mathlib.Tactic.Ring'])
        with self.assertRaises(ValueError):strip_comments('/- unclosed')

if __name__=='__main__':unittest.main()
