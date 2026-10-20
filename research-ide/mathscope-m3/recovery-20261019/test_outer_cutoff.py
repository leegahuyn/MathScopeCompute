"""Independent analytic/sample checks of the real archived cutoff, not toy fields."""
import copy
import json
import unittest
from fractions import Fraction as Q
import mpmath as mp

from outer_cutoff import ActualOuterCutoff,I,chi_jets,exp_negative,flat_polynomial
from run_outer_cutoff import partition


class OriginalCutoffTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.evaluator=ActualOuterCutoff()
        mp.mp.dps=110

    def encloses(self, interval, value):
        self.assertLessEqual(mp.mpf(interval.lo.numerator)/interval.lo.denominator,value)
        self.assertGreaterEqual(mp.mpf(interval.hi.numerator)/interval.hi.denominator,value)

    def test_rational_exp_remainders(self):
        for x in [Q(0),Q(1,100),Q(2),Q(9),Q(79),Q(80),Q(10000)]:
            self.encloses(exp_negative(x,80),mp.exp(-mp.mpf(x.numerator)/x.denominator))
        self.assertGreater(exp_negative(Q(10000),80).hi,0)

    def test_archived_polynomial_recurrence(self):
        self.assertEqual(flat_polynomial(1),[0,0,1])
        self.assertEqual(flat_polynomial(2),[0,0,0,-2,1])
        self.assertEqual(flat_polynomial(3),[0,0,0,0,6,-6,1])

    def test_exact_original_center_and_flat_branches(self):
        self.assertEqual(chi_jets(Q(3,4),Q(3,4)),tuple(I.point(v) for v in [Q(1,2),-4,0,128]))
        self.assertEqual(chi_jets(Q(-2),Q(1,2)),(I.point(1),I.point(0),I.point(0),I.point(0)))
        self.assertEqual(chi_jets(Q(1),Q(2)),(I.point(0),)*4)

    def test_independent_quotient_derivatives_in_closed_cells(self):
        def exact(s):
            u=2*s-1
            a=mp.exp(-1/u);b=mp.exp(-1/(1-u))
            return b/(a+b)
        intervals=[(Q(1,2),Q(5,8)),(Q(9,16),Q(13,16)),(Q(3,4),Q(7,8)),(Q(7,8),Q(1))]
        for lo,hi in intervals:
            jets=chi_jets(lo,hi,80)
            for numerator in [1,2,3]:
                s=lo+(hi-lo)*Q(numerator,4)
                value=mp.mpf(s.numerator)/s.denominator
                for order in range(4):
                    self.encloses(jets[order],mp.diff(exact,value,order))

    def test_zero_extension_before_missing_fields(self):
        result=self.evaluator.evaluate(I(Q(3,4),1),I(0,Q(1,4)),I(0,Q(1,4)),I(Q(1,2),1))
        self.assertEqual(result['status'],'EXACT_ZERO')
        self.assertTrue(all(v['coefficient_interval']==['0','0'] for v in result['cutoff_jets'].values()))
        self.assertEqual(result['global_field']['force'],[['0','0']]*3)
        self.assertIsNone(result['whole_K_energy'])

    def test_active_cell_keeps_all_missing_native_values(self):
        result=self.evaluator.evaluate(I(0,Q(1,4)),I(0,Q(1,4)),I(0,Q(1,4)),I(Q(1,2),Q(3,4)))
        self.assertEqual(result['status'],'MISSING_ACTUAL_FIELD_JETS')
        self.assertIsNone(result['global_field'])
        self.assertEqual(result['cutoff_jets']['C@0,1,1']['z0_power'],-1)
        self.assertEqual(result['cutoff_jets']['C@0,1,1']['tau0_power'],-1)

    def test_complete_partition_and_geometric_counts(self):
        data=partition(self.evaluator,8,I(Q(1,2),1),80)
        self.assertEqual(data['cell_count'],512)
        self.assertEqual(data['exact_zero_cells'],320)
        self.assertEqual(data['missing_field_cells'],192)
        self.assertEqual(len({tuple(c['index']) for c in data['cells']}),512)
        self.assertEqual(Q(data['normalized_zero_volume'])+Q(data['normalized_unresolved_volume']),8)
        # An independently calculated distance of the CLOSED box to the axis.
        for cell in data['cells']:
            endpoints=[(Q(-1)+Q(k,4),Q(-1)+Q(k+1,4)) for k in cell['index']]
            distance=[0 if lo<=0<=hi else min(abs(lo),abs(hi)) for lo,hi in endpoints]
            zero=distance[0]**2+distance[1]**2>=Q(1,2) or distance[2]**2>=Q(1,2)
            self.assertEqual(cell['status']=='EXACT_ZERO',zero)

    def test_terminal_and_invalid_domain_rejected(self):
        for rho in [I(0,1),I(-1,0),I(1,2)]:
            with self.assertRaisesRegex(ValueError,'POSITIVE_TIME_DOMAIN'):
                self.evaluator.evaluate(I(0,1),I(0,1),I(0,1),rho)
        with self.assertRaisesRegex(ValueError,'DIVISION_THROUGH_ZERO'):
            I(-1,1).reciprocal()

    def test_public_maximum_precision_on_active_transition(self):
        # This traverses the real exp/quotient path, not a plateau or center shortcut.
        coarse=chi_jets(Q(7,10),Q(7,10),80)
        fine=chi_jets(Q(7,10),Q(7,10),4096)
        for low,high in zip(coarse,fine):
            self.assertLessEqual(low.lo,high.lo)
            self.assertGreaterEqual(low.hi,high.hi)
        active=self.evaluator.evaluate(I.point(0),I.point(0),I.point(0),I.point(Q(7,10)),4096)
        self.assertEqual(active['status'],'MISSING_ACTUAL_FIELD_JETS')
        self.assertIsNone(active['whole_K_energy'])
        for bits in [15,4097,True,80.0]:
            with self.assertRaisesRegex(ValueError,'INVALID_ARITHMETIC_PRECISION'):
                self.evaluator.evaluate(I.point(0),I.point(0),I.point(0),I.point(Q(7,10)),bits)


if __name__=='__main__':
    unittest.main(verbosity=2)
