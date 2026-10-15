import unittest
from actual_picard0_local_transport import transport,Bound

class LocalTransport(unittest.TestCase):
    def fixture(self):
        n={0:{'op':'rational','args':['0','1']},1:{'op':'rational','args':['1','1']},
           2:{'op':'coordinate','args':['eta']},4756:{'op':'coordinate','args':['X']},
           10:{'op':'coordinate','args':['t']},20:{'op':'multiply','args':[10,4756]},
           30:{'op':'actual_background_even_profile','args':[0,1,20,2,0,0]},
           40:{'op':'definite_integral','args':[30,10,0,1]},
           50:{'op':'smooth_piecewise','args':[4756,11,12,40,0,0]},
           11:{'op':'rational','args':['1','100']},12:{'op':'rational','args':['1','50']}}
        return n,{11:Bound(True,1),12:Bound(True,2)}
    def test_guard_and_rescaled_binder_fit_original_collar(self):
        n,cb=self.fixture();out=transport(n.__getitem__,[50],cb)
        self.assertTrue(out['allDirectLocalPicard0ArgumentStatesWithinOriginalCollar'])
        self.assertEqual(out['actualPicard0CallIDs'],[30]);self.assertEqual(out['actualPicard0CallStates'][0]['radialUpperRank'],1)
    def test_unguarded_average_not_accepted_for_arbitrary_X(self):
        n,cb=self.fixture()
        with self.assertRaisesRegex(ValueError,'radial argument'):transport(n.__getitem__,[40],cb)
    def test_wrong_eta_not_accepted(self):
        n,cb=self.fixture();n[30]['args'][3]=10
        with self.assertRaisesRegex(ValueError,'eta argument'):transport(n.__getitem__,[50],cb)
    def test_signed_binder_not_accepted(self):
        n,cb=self.fixture();n[3]={'op':'rational','args':['-1','1']};n[40]['args'][2]=3
        with self.assertRaisesRegex(ValueError,'radial argument'):transport(n.__getitem__,[50],cb)
    def test_five_times_collar_not_accepted(self):
        n,cb=self.fixture();n[4]={'op':'rational','args':['5','1']};n[20]['args'].append(4)
        with self.assertRaisesRegex(ValueError,'radial argument'):transport(n.__getitem__,[50],cb)

if __name__=='__main__':unittest.main()
