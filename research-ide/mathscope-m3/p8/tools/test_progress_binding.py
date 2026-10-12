import copy
import unittest
from build_browser import p8_criteria


class ProgressBindingTests(unittest.TestCase):
    def setUp(self):
        self.original={'criteria':[{'id':'P8-01','title':'original','text':'original acceptance','page':36,'source':'blueprint.pdf'}]}
        row=dict(self.original['criteria'][0],status='PARTIAL',originalCriterionComplete=False,evidence=['actual local evidence'])
        self.progress={'schema':'MathScope.M3.P8.Progress/1','criteria':[row]}

    def test_assessed_state_is_not_replaced_with_hardcoded_in_progress(self):
        result=p8_criteria(self.original,self.progress)
        self.assertEqual(result[0]['status'],'PARTIAL')
        self.assertEqual(result[0]['evidence'],['actual local evidence'])

    def test_original_text_and_completion_evidence_are_required(self):
        for mutate in [lambda x:x['criteria'][0].update(text='weaker'),lambda x:x['criteria'].append(copy.deepcopy(x['criteria'][0])),lambda x:x['criteria'][0].update(originalCriterionComplete=True),lambda x:x['criteria'][0].update(originalCriterionComplete=True,status='PASS',evidence=[])]:
            altered=copy.deepcopy(self.progress);mutate(altered)
            with self.assertRaises(ValueError):p8_criteria(self.original,altered)


if __name__=='__main__':unittest.main()
