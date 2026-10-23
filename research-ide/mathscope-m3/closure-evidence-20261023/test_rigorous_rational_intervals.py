import unittest
from rigorous_rational_intervals import Interval as I,UncertifiedExpression as E,evaluate_graph
class ExactIntervalNegativeControls(unittest.TestCase):
    def test_exact_add(self):self.assertEqual((I.parse(['-1/3','1/2'])+I.parse(['1/5','2/5'])).json(),['-2/15','9/10'])
    def test_four_corner_mul(self):self.assertEqual((I.parse(['-2','3'])*I.parse(['4','5'])).json(),['-10','15'])
    def test_even_power_contains_zero(self):self.assertEqual(I.parse(['-3','2']).power(2).json(),['0','9'])
    def test_inverse_positive(self):self.assertEqual(I.parse(['2','4']).reciprocal().json(),['1/4','1/2'])
    def test_inverse_negative(self):self.assertEqual(I.parse(['-4','-2']).reciprocal().json(),['-1/2','-1/4'])
    def test_inverse_spans_zero(self):
        with self.assertRaises(E):I.parse(['-1','2']).reciprocal()
    def test_float_not_allowed(self):
        with self.assertRaises(E):I.parse([0.,1.])
    def test_exact_DAG_no_source_authority(self):
        n=[{'op':'var','name':'x','args':[]},{'op':'const','q':'1/2','args':[]},
           {'op':'pow_int','args':[0],'n':2},{'op':'add','args':[2,1]}]
        self.assertEqual(evaluate_graph(n,3,{'x':I.parse(['-1','2'])}).json(),['1/2','9/2'])
    def test_no_invented_transcendental_enclosure(self):
        with self.assertRaises(E):evaluate_graph([{'op':'const','q':1,'args':[]},{'op':'exp','args':[0]}],1,{})
    def test_graph_forward_reference_rejected(self):
        with self.assertRaises(E):evaluate_graph([{'op':'add','args':[0,1]}],0,{})
    def test_graph_budget_must_not_drop_nodes(self):
        with self.assertRaises(E):evaluate_graph([{'op':'const','q':0,'args':[]}]*3,2,{},max_work=2)
    def test_reversed_interval(self):
        with self.assertRaises(E):I.parse(['2','1'])
if __name__=='__main__':unittest.main()
