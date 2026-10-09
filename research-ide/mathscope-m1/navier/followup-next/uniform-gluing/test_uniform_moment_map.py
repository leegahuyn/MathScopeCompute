"""Regression and rejection tests for actual enclosure/inclusion risks."""
import copy
import hashlib
import json
import random
import unittest
from math import isqrt
from fractions import Fraction as F
from pathlib import Path

from dyadic_interval import I, BITS, SCALE, power, exp_negative, sigma, sigma_prime_box, sigma_second_box
from certify_uniform_moment_map import coefficients, profile_specs
from verify_uniform_certificate import finite_check
from verify_uniform_certificate import q,box
from logarithmic_interval import log_interval,power_general
from ideal_reference_bounds import check_ideal_identity

HERE=Path(__file__).resolve().parent


class ExactArithmeticTests(unittest.TestCase):
    def test_signed_arithmetic_contains_exact_rationals(self):
        rng=random.Random(2977054)
        for _ in range(1000):
            a,b,c,d=sorted(F(rng.randint(-100000,100000),rng.randint(1,100000)) for _ in range(4))
            x,y=I(a,b),I(c,d)
            for p in (a,b,(a+b)/2):
                for q in (c,d,(c+d)/2):
                    self.assertTrue((x+y).contains(p+q))
                    self.assertTrue((x-y).contains(p-q))
                    self.assertTrue((x*y).contains(p*q))
                    if c>0 or d<0:
                        self.assertTrue((x/y).contains(p/q))
            self.assertTrue((x**2).contains(a*a))
            self.assertTrue((x**2).contains(b*b))

    def test_exact_rational_root_order(self):
        for x in [F(1,100000),F(1,7),F(1,2),F(3,2),F(12345,17)]:
            for p,q in [(1,2),(1,10),(3,5),(9,10),(7,10)]:
                b=power(I(x),F(p,q))
                self.assertLessEqual(b.lower()**q,x**p)
                self.assertGreaterEqual(b.upper()**q,x**p)
                n=power(I(x),F(-p,q))
                self.assertLessEqual(n.lower()**q,x**(-p))
                self.assertGreaterEqual(n.upper()**q,x**(-p))

    def test_exp_order_independent_fraction_series(self):
        # Direct unreduced positive Taylor bounds are independent of the
        # implementation's dyadic range-reduction and multiplication routine.
        for x in [F(1,100),F(1,8),F(1,2),F(1),F(6),F(20)]:
            term,total=F(1),F(1)
            for n in range(1,260):
                term*=x/n
                total+=term
            next_term=term*x/260
            upper=total+next_term/(1-x/261)
            actual_lo,actual_hi=1/upper,1/total
            enclosure=exp_negative(I(x))
            self.assertLessEqual(enclosure.lower(),actual_lo)
            self.assertGreaterEqual(enclosure.upper(),actual_hi)
        self.assertEqual(exp_negative(I(0)).lower(),1)
        self.assertEqual(exp_negative(I(1000)).lower(),0)

    def test_invalid_arithmetic_is_rejected(self):
        with self.assertRaises(ValueError): I(1)/I(-1,1)
        with self.assertRaises(ValueError): power(I(-1,1),F(1,2))
        with self.assertRaises(ValueError): exp_negative(I(-1))
        with self.assertRaises(ValueError): I(2,1)

    def test_step_exact_symmetries_and_endpoints(self):
        self.assertTrue(sigma(F(1,2)).contains(F(1,2)))
        self.assertTrue(sigma_prime_box(F(1,2),F(1,2)).contains(8))
        self.assertTrue(sigma_second_box(F(1,2),F(1,2)).contains(0))
        self.assertEqual(sigma(0).lower(),0)
        self.assertEqual(sigma(1).upper(),1)
        for t in [F(1,16),F(1,8),F(1,4),F(3,8)]:
            self.assertTrue((sigma(t)+sigma(1-t)).contains(1))
            a,b=sigma_second_box(t,t),sigma_second_box(1-t,1-t)
            self.assertTrue((a+b).contains(0))


class MomentCertificateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.certificate=json.loads((HERE/'uniform-moment-certificate.json').read_text())

    def test_two_actual_continuous_map_certificates_pass(self):
        self.assertEqual(len(self.certificate['results']),2)
        for record in self.certificate['results']:
            self.assertTrue(all(finite_check(record).values()))
            self.assertTrue(record['quadrature']['continuousIntegralsEnclosed'])

    def test_all_measured_source_debts_are_in_neighborhood_without_promotion(self):
        count=0
        for record in self.certificate['results']:
            for debt in record['sourceDebtMembershipDiagnostics']:
                count+=1
                self.assertTrue(debt['lies_in_uniform_debt_neighborhood'])
                self.assertFalse(debt['originalContinuousDebtEnclosed'])
                self.assertFalse(debt['wholeEtaMembershipCertified'])
        self.assertEqual(count,4)

    def test_overlap_is_rejected_before_polynomial_disjointness_is_used(self):
        spec=profile_specs()[0]
        spec['supports'][1]=spec['supports'][0]
        with self.assertRaisesRegex(ValueError,'disjoint'):coefficients(spec,64)

    def test_coalescing_weights_are_rejected(self):
        for alpha in [F(-1,2),F(1,2),F(3,2)]:
            spec=profile_specs()[0]
            spec['alpha']=alpha
            with self.assertRaisesRegex(ValueError,'coalesce'):coefficients(spec,64)

    def test_zero_matrix_mutation_is_rejected(self):
        record=copy.deepcopy(self.certificate['results'][0])
        for row in record['linearMap']:
            for value in row:
                value['lowerNumerator']=value['upperNumerator']='0'
        self.assertFalse(all(finite_check(record).values()))

    def test_large_radius_mutation_is_rejected(self):
        record=copy.deepcopy(self.certificate['results'][0])
        record['nonlinearBounds']['eRadius']={'numerator':'1','denominator':'1'}
        checks=finite_check(record)
        self.assertFalse(checks['E contraction strict'])
        self.assertFalse(checks['E ball strict inclusion'])

    def test_large_debt_mutation_is_rejected(self):
        record=copy.deepcopy(self.certificate['results'][0])
        record['nonlinearBounds']['allowedPreconditionedDebtU']={'numerator':'1','denominator':'1'}
        self.assertFalse(finite_check(record)['U ball strict inclusion'])

    def test_unearned_global_or_kernel_promotion_is_rejected(self):
        for field in ['wholeSourceEtaDebtCertified','finalProfileConeCertified','newLeanKernelProof']:
            record=copy.deepcopy(self.certificate['results'][0])
            record['scope'][field]=True
            self.assertFalse(all(finite_check(record).values()))

    def test_independent_integral_receipt_binds_current_certificate(self):
        receipt=json.loads((HERE/'uniform-moment-independent.json').read_text())
        self.assertEqual(receipt['passed'],receipt['total'])
        self.assertEqual(receipt['certificateSHA256'],hashlib.sha256((HERE/'uniform-moment-certificate.json').read_bytes()).hexdigest())

    def test_omitted_quadratic_terms_disagree_with_independent_integral(self):
        receipt=json.loads((HERE/'uniform-moment-independent.json').read_text())
        for record in receipt['results']:
            for col in record['independentValues']:
                self.assertNotEqual(F(col['quadratic'][3]),0)


class SourceBindingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.binding=json.loads((HERE/'source-bound-moment-inclusion.json').read_text())
        cls.rectangle=json.loads((HERE/'source-joining-rectangle-certificate.json').read_text())
        cls.map=json.loads((HERE/'uniform-moment-certificate.json').read_text())['results'][0]

    def test_same_actual_source_hashes_are_bound(self):
        source=HERE.parent/'source-coherence/uniform-source-debt-small-j.json'
        digest=hashlib.sha256(source.read_bytes()).hexdigest()
        self.assertEqual(digest,self.binding['sourceSHA256'])
        self.assertEqual(digest,self.rectangle['sourceSHA256'])
        self.assertEqual(self.rectangle['momentBindingSHA256'],hashlib.sha256((HERE/'source-bound-moment-inclusion.json').read_bytes()).hexdigest())

    def test_old_j0_tolerance_failure_is_preserved(self):
        failed=json.loads((HERE/'source-bound-j0-original.json').read_text())
        self.assertTrue(failed['checks']['UBallStrictInclusion'])
        self.assertTrue(failed['checks']['EBallStrictInclusion'])
        self.assertFalse(failed['checks']['B36AxialShearTolerance'])

    def test_current_small_j0_passes_radial_tolerances(self):
        self.assertTrue(all(self.binding['checks'].values()))
        self.assertTrue(all(self.rectangle['checks'].values()))
        b=self.rectangle['bounds']
        self.assertLess(q(b['vUpper']),1)
        self.assertGreater(q(b['PcLower']),2)
        self.assertGreater(q(b['GPositiveLower']),1)

    def test_relaxed_cone_is_not_promoted_to_admissible_cone(self):
        scope=self.rectangle['scope']
        self.assertFalse(scope['admissibleConeVsGreaterThanTwo'])
        self.assertFalse(scope['C12AppliedToSameProfile'])
        self.assertFalse(scope['oldFiniteArraysCertified'])
        self.assertFalse(scope['newLeanAnalyticPremiseProof'])
        self.assertFalse(scope['originalN305Promoted'])
        self.assertFalse(scope['originalN306Promoted'])

    def test_B35_ideal_identity_exact_controls(self):
        result=check_ideal_identity()
        self.assertEqual(result['passed'],180)
        self.assertEqual(result['total'],180)

    def test_pinned_small_lambda_C2_has_its_own_certificate(self):
        record=json.loads((HERE/'source-c2-moment-certificate.json').read_text())['results'][0]
        independent=json.loads((HERE/'source-c2-moment-independent.json').read_text())
        self.assertTrue(all(finite_check(record).values()))
        self.assertEqual(independent['passed'],independent['total'])
        self.assertEqual(independent['certificateSHA256'],hashlib.sha256((HERE/'source-c2-moment-certificate.json').read_bytes()).hexdigest())
        self.assertLess(q(record['sourceParameterLambda']),F(1,1000))
        self.assertFalse(record['source']['actualModulationDebtProvided'])

    def test_arbitrary_rational_exponent_encloses_exact_root_values(self):
        for x in [F(1,2),F(3,2),F(3),F(15)]:
            for exponent in [F(-7,10),F(1,10),F(1,2),F(-1,5000)]:
                general=power_general(I(x),exponent)
                # For small root orders the independently implemented integer
                # root arithmetic supplies a second exact enclosure.
                if exponent.denominator<=10:
                    root=power(I(x),exponent)
                    self.assertLessEqual(general.lo,root.hi)
                    self.assertGreaterEqual(general.hi,root.lo)
        self.assertTrue(log_interval(I(1)).contains(0))

    def test_prefix_error_propagation_on_exact_rational_controls(self):
        rng=random.Random(2977055)
        g=[q(x) for x in self.rectangle['positivePrefixIntegration']['normalizedPrefixMomentErrors']]
        g1=[q(x) for x in self.rectangle['positivePrefixIntegration']['normalizedPrefixMomentEtaErrors']]
        b=self.rectangle['bounds']
        h=F(self.binding['sourceProfile']['h'])
        for _ in range(60):
            eta=F(rng.randint(-10,10),10);z=F(rng.choice([46,50,55,60]),100);x=z**10
            P=F(1202604);K=P/(1+eta*eta);k=-2*eta/(1+eta*eta)
            A=F(1,2)+h;D=F(1,2)-h;d=1-eta*eta;c=4*eta
            dv=[v*rng.choice([-1,1]) for v in g];dv1=[v*rng.choice([-1,1]) for v in g1]
            de=q(b['EError'])*rng.choice([-1,1]);du=q(b['UError'])*rng.choice([-1,1])
            M=c*x;Me=4*x;Ib=F(5,8)*K*z**16;Ibe=k*Ib;Jb=c*Ib;Jbe=4*Ib+c*Ibe
            S=c*c*x-F(5,12)*K*K*z**12;Se=8*c*x-F(5,6)*k*K*K*z**12
            Cp=F(5,2)*K*K*z*z;Cpe=5*k*K*K*z*z
            # The exact quadratic irrational is enclosed by integer-square
            # comparisons, independently of the production dyadic arithmetic.
            sqrt2lo=F(isqrt(2*(1<<256)),1<<128)
            sqrt2hi=sqrt2lo+F(1,1<<128)
            dm=K*dv[0];dm1=K*(k*dv[0]+dv1[0])
            di=K*dv[2];di1=K*(k*dv[2]+dv1[2])
            dj=c*di+K*K*dv[1];dj1=4*di+c*di1+K*K*(2*k*dv[1]+dv1[1])
            ds=2*c*dm+K*K*dv[3];ds1=8*dm+2*c*dm1+K*K*(2*k*dv[3]+dv1[3])
            dp=K*K*dv[4];dp1=K*K*(2*k*dv[4]+dv1[4])
            W0=1-2*D*eta*M/x-d*Me/x
            W=1-2*D*eta*(M+dm)/x-d*(Me+dm1)/x
            B0=(1-h)*Ib-D*eta*Ibe-d*Jbe+2*(h-D)*eta*Jb
            dbraw=(1-h)*di-D*eta*di1-d*dj1+2*(h-D)*eta*dj
            dbends=[dbraw/sqrt2lo,dbraw/sqrt2hi]
            Q0=-W0+B0/(x*K*z**6)
            Qends=[-W+(B0+db)/(x*z**5*(K*z+de)) for db in dbends]
            p0=F(-4000000000000);p0e=F(15000000000000)*eta
            N0=-W0*c+(D*(M-eta*Me)+4*h*eta*S-d*Se)/x+4*A*eta*(p0+Cp)-d*(p0e+Cpe)
            N=-W*(c+du)+(D*(M+dm-eta*(Me+dm1))+4*h*eta*(S+ds)-d*(Se+ds1))/x+4*A*eta*(p0+Cp+dp)-d*(p0e+Cpe+dp1)
            self.assertLessEqual(max(abs(Q-Q0) for Q in Qends),q(b['QsError']))
            self.assertLessEqual(abs(N-N0),q(b['NsError']))


if __name__=='__main__':
    unittest.main(verbosity=2)
