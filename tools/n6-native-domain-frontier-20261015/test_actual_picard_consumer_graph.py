"""Adverse controls for semantic Picard0 paths; no metadata-ID inference."""
import copy,json,os,unittest
from pathlib import Path
from actual_picard_consumer_graph import semantic_roots,extract

class ConsumerGraphTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        compact=Path(os.environ.get('N6_COMPACT',Path(__file__).parent/'cloud-result/COMPACT_JET_PDE_SOURCE.json'))
        cls.compact=json.loads(compact.read_text(encoding='utf8'))
        cls.picard=cls.compact['definitions']['picard:0']['fullDefinition']
    def fixture(self):
        nodes={100:{'op':'actual_expression_partial','args':[0,[0,2],[0,0]]},
               12:{'op':'actual_background_even_profile','args':[0,0,0,2,0,0]},
               2:{'op':'coordinate','args':['eta']}}
        def get(i):return nodes.get(i,{'op':'rational','args':['0','1']})
        reg={'picard':[copy.deepcopy(self.picard)],'expression':[{'name':'toy','parameters':[0,2],
             'body':12,'derivativeLimits':[99,99],'implementation':'metadata mentions 99','unspecifiedOracle':False}]}
        return nodes,get,reg
    def test_all_locally_available_reviewed_schemas(self):
        for key,r in self.compact['definitions'].items():
            if key=='fixed':continue
            d=r.get('fullDefinition')
            if d is None:d={k:r[k] for k in r['keys'] if k in r}
            semantic_roots(key,d)
    def test_real_body_path_and_metadata_is_not_a_node(self):
        nodes,get,reg=self.fixture();graph,read,defs,calls,domains,path=extract(get,reg,[100])
        self.assertIsNotNone(path(100,True));self.assertNotIn(99,read)
        self.assertEqual(path(100,True)[1]['field'],'body')
    def test_native_pulse_jet_uses_same_original_covariance_fields(self):
        d=self.compact['definitions']['covariance:0']['fullDefinition']
        self.assertEqual(semantic_roots('covariance:0',d),semantic_roots('m3GlobalPulses:0',d))
    def test_change_only_metadata_cannot_create_a_path(self):
        nodes,get,reg=self.fixture();reg['expression'][0]['body']=0
        self.assertIsNone(extract(get,reg,[100])[-1](100))
    def test_unreviewed_definition_field_rejected(self):
        d=copy.deepcopy(self.picard);d['newHiddenSemanticOperand']=12
        with self.assertRaisesRegex(ValueError,'Unreviewed registry fields'):semantic_roots('picard:0',d)
    def test_component_and_derivative_orders_not_operands(self):
        nodes,get,reg=self.fixture();nodes[12]['args']=[0,99,0,2,99,99]
        self.assertNotIn(99,extract(get,reg,[100])[1])
    def test_contract_only_path_is_not_a_value_body_path(self):
        nodes,get,reg=self.fixture();nodes[100]={'op':'actual_monotone_root','args':[0,2]}
        reg['monotone']=[{'name':'toyroot','parameters':[2],'variable':3,'body':0,'left':0,
                          'right':1,'derivativeLower':12,'derivativeUpper':1}]
        result=extract(get,reg,[100]);self.assertIsNone(result[-1](100,True))
        self.assertIsNotNone(result[-1](100))
    def test_wrong_native_root_registry_does_not_match_target(self):
        nodes,get,reg=self.fixture();reg['picard'].append(copy.deepcopy(self.picard));nodes[12]['args'][0]=1
        self.assertIsNone(extract(get,reg,[100])[-1](100))

if __name__=='__main__':unittest.main()
