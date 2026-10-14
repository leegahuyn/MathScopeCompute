"""Independent rejection controls for inherited artifact authenticity."""
import hashlib, importlib.util, json, tempfile, unittest, zipfile
from pathlib import Path
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('continuation_runner',Path(__file__).with_name('run_job.py'))
runner=importlib.util.module_from_spec(spec);spec.loader.exec_module(runner)

class ArchiveIntegrity(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.folder=Path(self.temp.name);self.archive=self.folder/'test.zip'
        self.patch1=patch.object(runner,'HERE',self.folder);self.patch1.start();self.addCleanup(self.patch1.stop)
        self.patch2=patch.object(runner,'ARCHIVES',self.folder);self.patch2.start();self.addCleanup(self.patch2.stop)

    def make(self,commit=runner.BASE,extra=None,bad_member=False):
        data=b'fixed original mathematical evidence; not a proof flag'
        receipt={'sourceCommit':commit,'executionStatus':'SUCCESS','members':[{'path':'data.txt','bytes':len(data),'sha256':'0'*64 if bad_member else hashlib.sha256(data).hexdigest()}]}
        with zipfile.ZipFile(self.archive,'w') as z:
            z.writestr('data.txt',data);z.writestr('receipt.json',json.dumps(receipt))
            if extra:z.writestr(extra,b'unexpected')
        lock={'archives':[{'path':'test.zip','name':'mean-proof-mean-38500114302','kind':'mean','bytes':self.archive.stat().st_size,'sha256':runner.sha(self.archive)}]}
        (self.folder/'ARCHIVE_LOCK.json').write_text(json.dumps(lock),encoding='utf8')

    def test_exact_receipted_archive_is_reusable(self):
        self.make();dest=self.folder/'unpacked'
        result=runner.verify_archives(dest,['mean'])
        self.assertEqual(result[0]['membersVerified'],2)
        self.assertTrue((dest/'mean-proof-mean-38500114302/data.txt').exists())

    def test_archive_byte_change_is_rejected(self):
        self.make();self.archive.write_bytes(self.archive.read_bytes()+b'changed')
        with self.assertRaisesRegex(ValueError,'Changed original'):runner.verify_archives()

    def test_valid_zip_with_forged_member_receipt_is_rejected(self):
        self.make(bad_member=True)
        with self.assertRaisesRegex(ValueError,'Changed inherited receipt'):runner.verify_archives()

    def test_receipt_from_other_source_commit_is_rejected(self):
        self.make(commit='0'*40)
        with self.assertRaisesRegex(ValueError,'Wrong inherited'):runner.verify_archives()

    def test_unreceipted_member_is_rejected(self):
        self.make(extra='extra.txt')
        with self.assertRaisesRegex(ValueError,'Incomplete or extra'):runner.verify_archives()

    def test_zip_traversal_is_rejected_before_extraction(self):
        self.make(extra='../outside.txt')
        with self.assertRaisesRegex(ValueError,'Unsafe ZIP'):runner.verify_archives(self.folder/'dest')
        self.assertFalse((self.folder/'outside.txt').exists())

    def test_absolute_and_windows_zip_paths_are_rejected(self):
        for name in ['/outside.txt','C:/outside.txt','folder\\outside.txt']:
            with self.subTest(name=name):
                with self.assertRaises(ValueError):runner.safe_member(name)

if __name__=='__main__':unittest.main()
