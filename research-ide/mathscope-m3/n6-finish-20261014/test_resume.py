"""Linux controller checks: byte integrity and source compatibility before reuse."""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

@unittest.skipIf(os.name=='nt','Hosted Linux controller uses native resource limits')
class ResumeReceiptTests(unittest.TestCase):
    def setUp(self):
        path=Path(__file__).with_name('run_job.py')
        spec=importlib.util.spec_from_file_location('finish_resume_test_controller',path)
        self.c=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.c)
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        root=Path(self.tmp.name);self.old=root/'old';self.out=root/'new'
        self.old.mkdir();self.out.mkdir()
        self.context={'checkpointSHA256':'test-exact-checkpoint'}
        self.meta={'sourceCommit':'a'*40,'runId':'123','executionStatus':'SUCCESS','kind':'jet','shard':0,
            'checkpointSHA256':self.context['checkpointSHA256'],'implementation':self.c.implementation()}
        self.c.write(self.old/'sample-proof.json',{'originalSource':622820,'claimedUnconditionalProof':False})
        self.c.cloud.receipt(self.old,self.meta)
    def test_authenticated_identical_success_can_resume_with_original_provenance(self):
        meta={}
        self.assertTrue(self.c.resume_worker(self.old,'jet',0,self.context,self.out,meta))
        self.assertEqual((self.out/'sample-proof.json').read_bytes(),(self.old/'sample-proof.json').read_bytes())
        self.assertEqual(meta['resumedFrom']['sourceCommit'],'a'*40)
        self.assertTrue((self.out/'resume-source-receipt.json').is_file())
    def test_mutated_proof_bytes_rejected(self):
        (self.old/'sample-proof.json').write_text('{}',encoding='utf8')
        with self.assertRaises(ValueError):self.c.resume_worker(self.old,'jet',0,self.context,self.out,{})
    def test_different_source_checkpoint_is_not_reused(self):
        self.assertFalse(self.c.resume_worker(self.old,'jet',0,{'checkpointSHA256':'different'},self.out,{}))
        self.assertFalse((self.out/'sample-proof.json').exists())
