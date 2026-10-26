import unittest
from decimal import Decimal as D,localcontext
from fractions import Fraction as F
from rigorous_rational_intervals import Interval as I,UncertifiedExpression
from original_monotone2_interval_jets import point,inverse_jets,H
from original_physical_slow_chart import physical_core_chart,physical_core_jets,_floor_log2


class PhysicalSlowChart(unittest.TestCase):
    def enclosed(self,pair,x):
        if isinstance(x,D):
            def decimal_fraction(s):
                parts=s.split('/')
                return D(parts[0])/(D(parts[1]) if len(parts)==2 else D(1))
            lo,hi=map(decimal_fraction,pair)
        else:lo,hi=map(F,pair)
        self.assertLessEqual(lo,x)
        self.assertGreaterEqual(hi,x)

    def test_axis_exact_root_and_all_native_jet_orders(self):
        for tau in (F(1),F(3,4),F(1,8),F(1,1<<8000)):
            c=physical_core_chart(point(tau),point(0),64)
            self.assertEqual(c['q'],point(tau))
            self.assertEqual(c['s'],point(tau/c['Q']))
            self.assertGreater(c['Q_power_D'].lo,0)
            r=physical_core_jets(point(tau),point(0),4,64)
            self.enclosed(r['root'],tau/c['Q'])
            self.assertEqual(len(r['taylor_coefficients']),15)
            self.enclosed(r['derivatives']['0,1'],F(1))
            self.enclosed(r['derivatives']['1,0'],F(0))

    def test_exact_dyadic_selection_and_tiny_relative_sqrt(self):
        for k in (-8001,-4000,-3,-1,0):
            x=F(1,1<<(-k)) if k<0 else F(1)
            self.assertEqual(_floor_log2(x),k)
            self.assertEqual(_floor_log2(x*F(3,4)),k-1)
        for ell in (0,1,2,3,8001):
            tau=F(1,1<<ell)
            c=physical_core_chart(point(tau),point(0),32)
            self.assertGreater(c['Q_power_D'].lo,0)
            self.assertLess(c['Q_power_D'].hi/c['Q_power_D'].lo,F(1000001,1000000))

    def test_general_core_points_and_signed_axial_symmetry(self):
        for tau in (F(1,16),F(1,4),F(1,2)):
            for z in (F(0),F(1,4),F(1,2)):
                plus=physical_core_chart(point(tau),point(z))
                minus=physical_core_chart(point(tau),point(-z))
                self.assertEqual(plus['q'],minus['q'])
                self.assertEqual(plus['Z'],-minus['Z'])
                self.assertGreaterEqual(plus['s'].lo,F(1,2))
                self.assertLessEqual(plus['s'].hi,2)
                self.assertGreater(plus['s'].lo**4,F(1,8))
                self.assertLess(plus['s'].hi**4,8)
                self.assertLess(plus['eta_squared'].hi,1)

    def test_nonzero_h_resolved_by_independent_decimal_root_and_derivatives(self):
        with localcontext() as ctx:
            ctx.prec=1460
            h=D(2)**(-4097);d=D('0.5')-h
            for tau,z in ((F(1,8),F(1,2)),(F(1,4),F(-1,4))):
                td=D(tau.numerator)/D(tau.denominator)
                zd=D(z.numerator)/D(z.denominator)
                q=td+zd*zd
                for _ in range(5):
                    p=(2*h*q.ln()).exp()
                    q-=(q-zd*zd*p-td)/(1-zd*zd*2*h*p/q)
                r=physical_core_jets(point(tau),point(z),3,4096)
                c=r['physical_chart'];Q=F(c['Q']);qd=D(Q.numerator)/D(Q.denominator)
                s=q/qd;Z=zd/(d*qd.ln()).exp();T=td/qd
                p=(2*h*s.ln()).exp();j=1-2*h*Z*Z*p/s
                sz=2*Z*p/j;st=1/j
                b=Z*Z*2*h*(2*h-1)*p/s**2
                cross=2*Z*2*h*p/s
                szz=(2*p+2*cross*sz+b*sz*sz)/j
                szt=(cross*st+b*sz*st)/j;stt=b*st*st/j
                for name,value in [('q',q),('s',s),('Z',Z),('T',T),('Q_power_D',(d*qd.ln()).exp())]:
                    self.enclosed(c[name],value)
                for name,value in [('0,0',s),('1,0',sz),('0,1',st),('2,0',szz),('1,1',szt),('0,2',stt)]:
                    self.enclosed(r['derivatives'][name],value)
                # Independently differentiate q-z^2*q^(2h)-tau=0 in PHYSICAL coordinates.
                qp=(2*h*q.ln()).exp();qj=1-zd*zd*2*h*qp/q
                qz=2*zd*qp/qj;qt=1/qj
                qb=zd*zd*2*h*(2*h-1)*qp/q**2
                qc=2*zd*2*h*qp/q
                qzz=(2*qp+2*qc*qz+qb*qz*qz)/qj
                qzt=(qc*qt+qb*qz*qt)/qj;qtt=qb*qt*qt/qj
                for key,value in [('0,0',q),('1,0',qz),('0,1',qt),('2,0',qzz),('1,1',qzt),('0,2',qtt)]:
                    self.enclosed(r['physical_q_derivatives_z_tau'][key],value)
                    a,b=map(int,key.split(','))
                    self.enclosed(r['physical_q_derivatives_z_t'][key],(-1)**b*value)
                # q is strictly below its h=0 upper endpoint, at resolvable precision.
                self.assertLess(q,td+zd*zd)

    def test_closed_input_box_all_sample_points_without_corner_promotion(self):
        tau=I(F(1,4),F(5,16));z=I(F(1,4),F(5,16))
        r=physical_core_jets(tau,z,2,128)
        for t in (tau.lo,(tau.lo+tau.hi)/2,tau.hi):
            for zval in (z.lo,(z.lo+z.hi)/2,z.hi):
                # h=0 limit must be enclosed; nonzero-h checked independently above.
                q=t+zval*zval;Q=F(r['physical_chart']['Q'])
                self.enclosed(r['root'],q/Q)
        self.assertTrue(r['native_input_image_proved'])
        self.assertFalse(r['independent_Z_T_cartesian_product_certified'])
        self.assertTrue(r['source_band_offset_strict_support_proved'])

    def test_upper_dyadic_band_selected_before_native_or_source_guard_failure(self):
        for tau in (F(7,16),F(13,16)):
            c=physical_core_chart(point(tau),point(0))
            self.assertEqual(c['Q'],F(1,2) if tau< F(1,2) else F(1))
            self.assertGreater(c['s'].lo**4,F(1,8))
            self.assertLess(c['s'].hi**4,8)
        # This broad box fits [1/2,2] for Q=1/2 but not the source band guard.
        with self.assertRaisesRegex(UncertifiedExpression,'source band supports'):
            physical_core_chart(I(F(1,4),F(7,16)),point(0))

    def test_independent_fourth_order_axis_physical_formulas_at_tiny_scale(self):
        with localcontext() as ctx:
            ctx.prec=1460
            a=D(2)**(-4096) # 2*h for the strictly positive test h=2^-4097.
            for tau in (F(3,8),F(1,1<<8000)):
                td=D(tau.numerator)/D(tau.denominator)
                p=(a*td.ln()).exp()
                r=physical_core_jets(point(tau),point(0),4,4096)
                for key,value in [('0,0',td),('0,1',D(1)),('1,0',D(0)),
                                  ('2,0',2*p),('2,1',2*a*p/td),
                                  ('2,2',2*a*(a-1)*p/td**2),('4,0',24*a*p*p/td)]:
                    self.enclosed(r['physical_q_derivatives_z_tau'][key],value)

    def test_reject_time_zero_outside_core_wide_boxes_and_float_input(self):
        for tau,z in [(point(0),point(0)),(point(F(-1)),point(0)),
                      (point(1),point(F(1,2))),(I(F(1,1024),F(1)),point(0)),
                      (I(0.5,0.5),point(0))]:
            with self.assertRaises(UncertifiedExpression):physical_core_chart(tau,z)
        for order,bits in ((5,128),(True,128),(2,31),(2,8193)):
            with self.assertRaises(UncertifiedExpression):physical_core_jets(point(1),point(0),order,bits)

    def test_source_h_never_replaced_or_final_support_promoted(self):
        r=physical_core_jets(point(F(1,4)),point(F(1,2)),3)
        c=r['physical_chart'];self.assertTrue(c['source']['h_strictly_positive'])
        self.assertIn('exp(-8002',c['source']['h'])
        self.assertLess(F(c['q'][0]),F(c['q'][1]))
        self.assertLess(F(r['implicit_J'][0]),1)
        for flag in ('actual_physical_call_support_verified','final_A_D_field_certified',
                     'original_active_band_window_membership_proved',
                     'original_mesh_and_representative_support_proved','final_field_samples_generated'):
            self.assertFalse(r[flag])
        self.assertEqual(r['final_67_jets_certified'],0)
        self.assertEqual(r['natural_Y_OPEN'],490)
        self.assertEqual(r['release'],'HOLD')

    def test_common_recurrence_preserves_independent_box_contract(self):
        for z,t in ((point(0),point(0)),(I(F(-1),F(1)),point(0))):
            with self.assertRaises(ValueError):inverse_jets(z,t)
        result=inverse_jets(point(0),point(1),4)
        self.assertEqual(result['root'],['1','1'])

    def test_large_integer_serialization_without_process_wide_mutation(self):
        import sys
        from original_physical_slow_chart import _integer_text,_fraction_text
        before=sys.get_int_max_str_digits()
        value=10**5000+123
        text=_integer_text(value)
        self.assertEqual(text,'1'+'0'*4997+'123')
        self.assertEqual(_fraction_text(F(-value,2)),'-'+_integer_text(value)+'/2')
        self.assertEqual(sys.get_int_max_str_digits(),before)


if __name__=='__main__':unittest.main()
