import hashlib,json,unittest
from unittest.mock import patch
import verify_sparse_release as sparse

class ReviewedSourceSelectionTests(unittest.TestCase):
    def test_windows_checkout_newlines_do_not_change_linux_release_binding(self):
        linux=b'{\n  "included": ["unchanged-original"],\n  "omitted": []\n}\n'
        windows=linux.replace(b'\n',b'\r\n')
        expected={'sourceSelection':{'path':'provenance/source-selection.json','sha256':hashlib.sha256(windows).hexdigest(),'includedOriginalFiles':693,'omittedRenderedImages':242},
                  'evidenceBoundary':'Original source and mathematical acceptance remain unchanged.'}
        class Reader:
            def read(self,name):
                self.last=name
                return linux
        reader=Reader()
        with patch.object(sparse.validator,'read_json',return_value=json.loads(windows)):
            result=sparse.bind_index_source_selection(expected,reader)
        self.assertEqual(reader.last,'provenance/source-selection.json')
        self.assertEqual(result['sourceSelection']['sha256'],hashlib.sha256(linux).hexdigest())
        self.assertEqual(expected['sourceSelection']['sha256'],hashlib.sha256(windows).hexdigest())
        self.assertEqual({**result['sourceSelection'],'sha256':expected['sourceSelection']['sha256']},expected['sourceSelection'])
        self.assertEqual(result['evidenceBoundary'],expected['evidenceBoundary'])

    def test_unstaged_source_selection_semantics_are_rejected(self):
        class Reader:
            def read(self,name):return b'{"included": ["original"]}'
        with patch.object(sparse.validator,'read_json',return_value={'included':['replacement']}):
            with self.assertRaisesRegex(ValueError,'differs from the reviewed Git index'):
                sparse.bind_index_source_selection({'sourceSelection':{'path':'provenance/source-selection.json'}},Reader())

if __name__=='__main__':unittest.main()
