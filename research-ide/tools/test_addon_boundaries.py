#!/usr/bin/env python3
"""Regression checks for the explicit post-v54 addition boundary."""
import unittest

from verify_english_release import validate_addon_root


class AddonBoundaryTests(unittest.TestCase):
    def test_existing_named_followup(self):
        validate_addon_root('mathscope-m1/navier/followup-next/uniform-gluing')

    def test_dated_result_and_nested_review(self):
        validate_addon_root('mathscope-m1/navier/followup-20261010-outer-reselection')
        validate_addon_root('mathscope-m1/navier/followup-20261010-outer-reselection/independent-axial')

    def test_original_roots_and_broad_parents_are_rejected(self):
        for root in ('mathscope-m1', 'mathscope-m1/navier',
                     'mathscope-m1/navier/followup-next',
                     'mathscope-m1/navier/official-validation',
                     'mathscope-m1/navier/followup-20261010',
                     'mathscope-m1/navier/followup-current-result',
                     'mathscope-m0/navier/followup-20261010-result'):
            with self.subTest(root=root), self.assertRaises(ValueError):
                validate_addon_root(root)

    def test_noncanonical_and_escaping_roots_are_rejected(self):
        for root in ('/mathscope-m1/navier/followup-20261010-result',
                     'mathscope-m1/navier/followup-20261010-result/../official-validation',
                     'mathscope-m1//navier/followup-20261010-result',
                     './mathscope-m1/navier/followup-20261010-result',
                     'mathscope-m1/navier/followup-20261010-result/',
                     '', None):
            with self.subTest(root=root), self.assertRaises(ValueError):
                validate_addon_root(root)


if __name__ == '__main__':
    unittest.main()
