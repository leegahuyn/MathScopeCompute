import unittest
import natural_metadata_origin as m

class MetadataOrigins(unittest.TestCase):
    def origins(self):return [{'definitionKey':key,'path':list(path)} for key,path in m.EXPECTED]
    def test_exact_literal_exponents_classified(self):self.assertTrue(m.classify(self.origins(),[],[],[]))
    def test_numeric_tokens_do_not_include_boolean_or_plain_string(self):
        self.assertEqual(list(m.occurrences({'a':True,'b':'100000','c':100000})),[('c',)])
    def test_encoded_json_is_scanned_as_in_inherited_capture(self):
        self.assertEqual(list(m.occurrences('{"power":["C",100000]}')),[('<decodedJSON>','power',1)])
    def test_actual_requested_root_not_classified_as_metadata(self):
        with self.assertRaises(ValueError):m.classify(self.origins(),[],[],[],root=100000)
    def test_actual_operands_bodies_or_unknown_paths_rejected(self):
        self.assertTrue(all(row['rejected'] for row in m.controls()))

if __name__=='__main__':unittest.main()
