import copy
from fractions import Fraction as Q
import unittest
from global_bounds import (mixed_heat_rows, heat_tail_certificate, gaussian_tail_certificate,
                           independent_verify, negative_controls, direct_taylor_coefficient, read_rows)


def small_certificate():
    return {'computedTotalOrder': 5, 'mixedHeatNorms': mixed_heat_rows(5),
            'heatImproperTails': [heat_tail_certificate(m) for m in range(6)],
            'gaussianSeriesControls': [gaussian_tail_certificate(p) for p in [0, 4, 64]]}


class GlobalHeatBoundsTests(unittest.TestCase):
    def test_mixed_chain_rule_matches_independent_taylor_and_loss_sign(self):
        certificate = small_certificate()
        result = independent_verify(certificate)
        self.assertEqual(result['mixedDerivativeRowsChecked'], 21)
        self.assertEqual(result['independentTaylorCoefficientRowsChecked'], 21)
        rows = {(r['XOrder'], r['etaOrder']): r for r in certificate['mixedHeatNorms']}
        self.assertEqual(read_rows(rows[0, 1]['polynomial']), {(1, 1, 1): -4})
        self.assertEqual(read_rows(rows[1, 0]['polynomial']), {(1, 2, 0): -2, (1, 2, 2): 2})
        self.assertEqual(rows[0, 0]['actualNormalizedHeatLoss71948']['constantTerm'], '1')
        self.assertEqual(rows[0, 0]['actualNormalizedHeatLoss71948']['heatDerivativePolynomial'][0]['coefficient'], '-1')

    def test_arbitrary_order_integer_tail_margin_and_exact_tail_target(self):
        for m in [0, 1, 12, 24]:
            tail = heat_tail_certificate(m)
            self.assertLessEqual(Q(tail['exactRationalUpper']), Q(1, 2 ** 256))
            self.assertGreater(tail['allOrderExponentMargin'], 0)

    def test_gaussian_envelope_cannot_lose_positive_rate_or_threshold(self):
        self.assertGreaterEqual(gaussian_tail_certificate(64)['exactExponent'], 256)
        with self.assertRaises(ValueError):
            gaussian_tail_certificate(0, a=-1)
        with self.assertRaises(ValueError):
            gaussian_tail_certificate(2000)

    def test_all_five_negative_controls_rejected(self):
        self.assertTrue(all(row['rejected'] for row in negative_controls(small_certificate())))

    def test_original_heat_loss_constant_and_sign_mutations_rejected(self):
        cert = small_certificate()
        cert['mixedHeatNorms'][0]['actualNormalizedHeatLoss71948']['constantTerm'] = '0'
        with self.assertRaises(ValueError):
            independent_verify(cert)
        cert = small_certificate()
        cert['mixedHeatNorms'][1]['actualNormalizedHeatLoss71948']['heatDerivativePolynomial'][0]['coefficient'] = '-4'
        with self.assertRaises(ValueError):
            independent_verify(cert)


if __name__ == '__main__':
    unittest.main()
