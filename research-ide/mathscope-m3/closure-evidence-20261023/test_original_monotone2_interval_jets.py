import unittest
from fractions import Fraction as Q
from rigorous_rational_intervals import Interval as I, UncertifiedExpression
from original_monotone2_interval_jets import inverse_jets, point, round_out, H, authenticate_source

class NativeSlowInverseJets(unittest.TestCase):
    def contains(self,pair,x):
        self.assertLessEqual(Q(pair[0]),x)
        self.assertGreaterEqual(Q(pair[1]),x)

    def test_exact_image_s_one_all_h_and_both_signs(self):
        for z in (Q(-1),Q(-3,5),Q(0),Q(3,5),Q(1)):
            result=inverse_jets(point(z),point(1-z*z),4)
            self.assertEqual(result['root'],['1','1'])
            self.assertEqual(result['inverse_two_s'],['1/2','1/2'])
            self.contains(result['derivatives']['1,0'],2*z)
            self.contains(result['derivatives']['0,1'],Q(1))

    def test_axis_independent_analytic_derivative_values(self):
        r=inverse_jets(point(0),point(1),4)
        for key,expected in {'1,0':0,'0,1':1,'2,0':2,'1,1':0,'0,2':0,'0,3':0,'3,0':0,'0,4':0}.items():
            self.contains(r['derivatives'][key],Q(expected))
        # At (Z,T)=(0,1), s_ZZT=4h and s_ZZZZ=48h.
        for key,upper in [('2,1',4*H),('4,0',48*H)]:
            self.contains(r['derivatives'][key],Q(0))
            self.contains(r['derivatives'][key],upper)

    def test_non_image_and_crossing_nonconvex_image_rejected(self):
        for z,t in [(point(0),point(0)),(I(Q(-1),Q(1)),point(0)),(point(2),point(1))]:
            with self.assertRaises(ValueError):inverse_jets(z,t)

    def test_entire_closed_box_and_independent_h_zero_limit(self):
        r=inverse_jets(I(Q(1,4),Q(1,2)),I(Q(1),Q(5,4)),3)
        for z in (Q(1,4),Q(3,8),Q(1,2)):
            for t in (Q(1),Q(9,8),Q(5,4)):
                self.contains(r['root'],t+z*z)
                self.contains(r['derivatives']['1,0'],2*z)
                self.contains(r['derivatives']['0,1'],Q(1))
                self.contains(r['derivatives']['2,0'],Q(2))

    def test_precision_refines_enclosures_without_underflowing_h(self):
        runs=[inverse_jets(point(Q(1,2)),point(Q(1)),3,b) for b in (32,64,128)]
        for a,b in zip(runs,runs[1:]):
            for key in ('root','implicit_J','inverse_two_s'):
                self.assertGreaterEqual(Q(b[key][0]),Q(a[key][0]))
                self.assertLessEqual(Q(b[key][1]),Q(a[key][1]))
        self.assertGreater(Q(runs[-1]['root'][1]),Q(5,4))

    def test_signed_outward_rounding(self):
        for q in (Q(-1,3),Q(1,3),Q(-3),Q(0)):
            x=round_out(point(q),32)
            self.assertLessEqual(x.lo,q);self.assertGreaterEqual(x.hi,q)
            self.assertLessEqual(x.hi-x.lo,Q(1,2**32))

    def test_missing_physical_premises_are_never_promoted(self):
        r=inverse_jets(point(0),point(1))
        self.assertFalse(r['actual_physical_call_support_verified'])
        self.assertFalse(r['final_A_D_field_certified'])
        self.assertEqual(r['final_67_jets_certified'],0)
        self.assertEqual(r['natural_Y_OPEN'],490)
        self.assertEqual(r['release'],'HOLD')

    def test_invalid_options_and_float_endpoints(self):
        for opts in ({'order':5},{'order':True},{'bits':31},{'bits':8193}):
            with self.assertRaises(UncertifiedExpression):inverse_jets(point(0),point(1),**opts)
        with self.assertRaises(UncertifiedExpression):inverse_jets(I(0.0,0.0),point(1))

    def test_independent_decimal_implicit_derivatives_resolve_nonzero_h(self):
        # Independent Newton solve and explicit implicit-differentiation
        # formulas, at >4096-bit precision. This is a numerical cross-check,
        # not the rational enclosure proof or a physical runtime input.
        from decimal import Decimal as D, localcontext
        with localcontext() as ctx:
            ctx.prec=1450
            h=D(2)**(-4097);a=2*h;z=D('0.5');t=D(1);s=t+z*z
            for _ in range(4):
                p=(a*s.ln()).exp();j=1-z*z*a*p/s
                s-=(s-z*z*p-t)/j
            p=(a*s.ln()).exp();j=1-z*z*a*p/s
            sz=2*z*p/j;st=1/j
            B=z*z*a*(a-1)*p/s**2
            C=2*z*a*p/s
            stt=B*st*st/j
            szt=(C*st+B*sz*st)/j
            szz=(2*p+2*C*sz+B*sz*sz)/j
            E=z*z*a*(a-1)*(a-2)*p/s**3
            sttt=(E*st**3+3*B*stt*st)/j
            r=inverse_jets(point(Q(1,2)),point(1),3,4096)
            expected={'0,0':s,'1,0':sz,'0,1':st,'2,0':szz,'1,1':szt,'0,2':stt,'0,3':sttt}
            for key,value in expected.items():
                lo,hi=map(Q,r['derivatives'][key])
                lod=D(lo.numerator)/D(lo.denominator)
                hid=D(hi.numerator)/D(hi.denominator)
                self.assertLessEqual(lod,value,key)
                self.assertGreaterEqual(hid,value,key)

    def test_wrong_native_registry_rejected_before_any_output(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as name:
            (Path(name)/'original-source-functions.json').write_text('{}',encoding='utf-8')
            with self.assertRaisesRegex(UncertifiedExpression,'registry SHA'):
                authenticate_source(name)

    def test_actual_full_source_formula_authentication(self):
        import os
        from pathlib import Path
        graph=os.environ.get('MATHSCOPE_ORIGINAL_GRAPH_FILE')
        if not graph:self.skipTest('Set original graph environment variable for full source authentication')
        result=authenticate_source(Path(graph).parent)
        self.assertEqual(result['source_nodes'],4420257)
        self.assertEqual(result['native_call_ids'],[622820,623935])
        self.assertFalse(result['actual_runtime_arguments_or_support_bound'])

if __name__=='__main__':unittest.main()
