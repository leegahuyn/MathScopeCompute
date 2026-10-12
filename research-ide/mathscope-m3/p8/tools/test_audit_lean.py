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

    def test_import_header_does_not_lex_extensible_body_or_string_comment_markers(self):
        header='module\nprelude\npublic import Lean.Parser.Types\npublic section\n'
        # Lean parser implementations contain these delimiter strings. The old
        # whole-file comment pass treated "/-" as an unterminated real comment.
        for body in ['def marker := "/-"', 'def marker := r##"/- -- \\""##',
                     'def marker := "\\\"/-"', 'syntax "body /-" : term',
                     '#eval "\nprelude\nimport Forged.Dependency\n"']:
            self.assertEqual(imports(header+body),['Lean.Parser.Types'])
        self.assertEqual(imports('import Actual.Module\ndef s := "\nprelude\n"'),['Actual.Module','Init'])

    def test_imports_support_whitespace_comments_and_multiple_header_commands(self):
        source='\ufeff/- license /- nested -/ -/\nmodule prelude\npublic /- a -/ meta\nimport\nLean.Parser.Types\nimport all Init.Data.Nat\nmeta import Init.Core -- note\nnamespace X'
        self.assertEqual(imports(source),['Init.Core','Init.Data.Nat','Lean.Parser.Types'])
        self.assertEqual(imports('import/- separator -/Actual.Module\n'),['Actual.Module','Init'])

    def test_malformed_header_cannot_silently_drop_a_dependency(self):
        for source in ['/- unclosed','module\nimport /- unclosed','import','import all',
                       'import import Actual.Module','import «Quoted.Module»','import Actual..Module','import ActualΩ']:
            with self.subTest(source=source),self.assertRaises(ValueError):imports(source)

    def test_static_comment_scanner_preserves_regular_and_raw_string_literals(self):
        for literal in ['"/-"', '"--"', '"escaped \\\" /-"', 'r#"/- -- \\\""#', 'r##"/- \" text"##']:
            source='def x := '+literal+' /- removed /- nested -/ -/\ndef y := 1 -- removed\n'
            clean=strip_comments(source)
            self.assertIn(literal,clean);self.assertIn('def y := 1',clean);self.assertNotIn('removed',clean)
        self.assertEqual(strip_comments("def quote := '\"' /- removed -/\n").strip(),"def quote := '\"'")

if __name__=='__main__':unittest.main()
