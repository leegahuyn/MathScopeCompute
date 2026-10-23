import unittest
from finite_cycle_all_order_gate import validate_finite_cycles,finite_bounds,IncompleteCycle
def fixture():
    x=[];prev=None
    for i,lab in enumerate('ABCD'):
        sha=str(i)*64
        x.append(dict(cycle=lab,stage_index=i,source_graph_sha256=sha,
          inherited_source_graph_sha256=prev,velocity_roots=[1,2,3],
          pde_residual_roots=[4,5,6],pressure_root=7,cutoff_before_curl=True,
          actual_nonzero_fourier_tail_retained=True,**{
          key:'ACTUAL_SOURCE_AST_VERIFIED' for key in
          ('forced','signed','temporal','five_map','updated_full_pressure','full_3d_pde')}))
        prev=sha
    return x
class FiniteCycleControls(unittest.TestCase):
    def test_four_source_ast_still_not_global_proof(self):
        out=validate_finite_cycles(fixture())
        self.assertFalse(out['all_m_analytic_bounds_proved'])
        self.assertFalse(out['actual_source_chain_math_proved'])
    def test_missing_actual_cycle(self):
        with self.assertRaises(IncompleteCycle):validate_finite_cycles(fixture()[:3])
    def test_wrong_inherited_graph(self):
        f=fixture();f[2]['inherited_source_graph_sha256']='wrong'
        with self.assertRaises(IncompleteCycle):validate_finite_cycles(f)
    def test_missing_complete_pressure(self):
        f=fixture();f[1].pop('pressure_root')
        with self.assertRaises(IncompleteCycle):validate_finite_cycles(f)
    def test_missing_fourier_tail(self):
        f=fixture();f[0]['actual_nonzero_fourier_tail_retained']=False
        with self.assertRaises(IncompleteCycle):validate_finite_cycles(f)
    def test_finite_bound_remains_finite(self):
        a=finite_bounds([dict(j=0,m=0,domain_min_radius='1/4',domain_max_radius='1/2',
            derivative_bound='2',derivative_loss='1/3',source_field_norm_sha256='f'*64)])
        self.assertFalse(a['uniform_all_m_proved'])
    def test_nonpositive_domain(self):
        with self.assertRaises(IncompleteCycle):finite_bounds([dict(j=0,m=0,domain_min_radius='0',
             domain_max_radius='1',derivative_bound='2',derivative_loss='1',source_field_norm_sha256='f'*64)])
if __name__=='__main__':unittest.main()
