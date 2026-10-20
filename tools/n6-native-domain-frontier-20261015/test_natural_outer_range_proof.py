import unittest
from fractions import Fraction as Q
import natural_outer_range_proof as n


class OuterContracts(unittest.TestCase):
    def test_common_log_terms_are_cancelled_before_order(self):
        base=n.p.plus(n.p.multiply(n.p.rat(-1),n.p.lg(('parameter','Lambda'))),n.p.multiply(n.p.rat(2),n.p.lg(n.p.rat(2))))
        self.assertEqual(n.order(n.p.plus(base,n.p.multiply(n.p.rat(2),('parameter','t1'))),n.p.plus(base,('parameter','t1'))),1)

    def test_source_lambda_dominates_log_110(self):
        xa=n.p.multiply(n.p.rat(4),n.p.pw(('parameter','Lambda'),-1))
        self.assertEqual(n.order(n.p.lg(n.p.rat(110)),n.p.lg(xa)),1)

    def test_unknown_parameter_is_not_given_a_positive_value(self):
        with self.assertRaises(ValueError):n.order(('parameter','unreviewed'),n.p.rat(0))

    def test_unknown_coordinate_order_stays_unproved(self):
        with self.assertRaises(ValueError):n.order(('coordinate',100),('coordinate',101))

    def test_missing_upper_bound_is_not_a_finite_estimate(self):
        self.assertIsNone(n.finite_max([n.p.rat(4),None]))

    def test_binder_body_gets_scoped_variable_endpoint(self):
        graph={0:{'op':'rational','args':['0','1']},1:{'op':'rational','args':['1','1']},
          2:{'op':'rational','args':['4','1']},3:{'op':'coordinate','args':['X']},
          4:{'op':'coordinate','args':['s']},5:{'op':'actual_natural_series','args':[0,4,3,0,0]},
          6:{'op':'definite_integral','args':[5,4,0,3]}}
        row={'id':5,'node':graph[5],'nodeSHA256':n.sha(graph[5]),'Y':4}
        result=n.call_scopes(graph.__getitem__,n.p.RadialNormal(graph),6,[row],{('coordinate',3):(n.p.rat(0),n.p.rat(4))})
        self.assertEqual(result[0]['YInterval'],(n.p.rat(0),n.p.rat(4)))
        self.assertEqual(result[0]['integralOccurrenceRole'],'body')

    def test_natural_in_endpoint_does_not_capture_new_binder(self):
        # Its Y is the *outer* value of s=5. The body binder s ranges0..call;
        # applying that new scope to the endpoint would hide the invalid Y.
        graph={0:{'op':'rational','args':['0','1']},1:{'op':'coordinate','args':['s']},
          2:{'op':'actual_natural_series','args':[0,1,1,0,0]},
          3:{'op':'definite_integral','args':[0,1,0,2]}}
        row={'id':2,'node':graph[2],'nodeSHA256':n.sha(graph[2]),'Y':1}
        # Native endpoint itself has no ordinary normalization; fail closed.
        with self.assertRaises(ValueError):
            n.call_scopes(graph.__getitem__,n.p.RadialNormal(graph),3,[row],{('coordinate',1):(n.p.rat(5),n.p.rat(5))})

    def test_shadowed_binder_forgets_old_composite_constraint(self):
        graph={0:{'op':'rational','args':['0','1']},1:{'op':'rational','args':['4','1']},
          2:{'op':'coordinate','args':['s']},3:{'op':'integer_power','args':[2,2]},
          4:{'op':'actual_natural_series','args':[0,2,2,0,0]},
          5:{'op':'definite_integral','args':[4,2,0,1]}}
        row={'id':4,'node':graph[4],'nodeSHA256':n.sha(graph[4]),'Y':2}
        env={('coordinate',2):(n.p.rat(100),n.p.rat(100)),n.p.pw(('coordinate',2),2):(n.p.rat(10000),n.p.rat(10000))}
        result=n.call_scopes(graph.__getitem__,n.p.RadialNormal(graph),5,[row],env)
        self.assertEqual(result[0]['YInterval'],(n.p.rat(0),n.p.rat(4)))

    def test_negative_actual_Y_rejected(self):
        b=n.Bounds(None)
        self.assertLess(n.order(b.at(n.p.rat(-1),{})[0],n.p.rat(0)),0)

    def test_interval_touching_upper_limit_rejected(self):
        self.assertEqual(n.order(n.p.rat(Q(41,10)),n.p.rat(n.LIMIT)),0)

    def test_zero_lower_log_keeps_unbounded_lower(self):
        b=n.Bounds(None)
        v=('coordinate',10)
        result=b.at(('log',v),{v:(n.p.rat(0),n.p.rat(4))})
        self.assertIsNone(result[0])

    def test_same_integral_dag_under_two_guard_scopes_not_globally_memoized(self):
        graph={0:{'op':'rational','args':['0','1']},1:{'op':'rational','args':['4','1']},
          2:{'op':'rational','args':['8','1']},3:{'op':'coordinate','args':['X']},
          4:{'op':'coordinate','args':['s']},5:{'op':'actual_natural_series','args':[0,4,3,0,0]},
          6:{'op':'definite_integral','args':[5,4,0,3]},
          7:{'op':'smooth_piecewise','args':[3,0,1,0,6,0]},
          8:{'op':'smooth_piecewise','args':[3,0,2,0,6,0]}}
        row={'id':5,'node':graph[5],'nodeSHA256':n.sha(graph[5]),'Y':4}
        normal=n.p.RadialNormal(graph)
        first={'surface':7,'node':graph[7],'directArgumentPositions':[4]}
        second={'surface':8,'node':graph[8],'directArgumentPositions':[4]}
        self.assertTrue(n.prove_context(graph.__getitem__,normal,6,[row],first))
        with self.assertRaises(ValueError):n.prove_context(graph.__getitem__,normal,6,[row],second)


if __name__=='__main__':unittest.main()
