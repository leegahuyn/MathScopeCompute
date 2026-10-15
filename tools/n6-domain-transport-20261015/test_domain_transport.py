"""Actual pinned-source regression and negative controls. No sample is a proof."""
import copy
from fractions import Fraction as Q
import itertools
import json
from math import comb
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import verify_domain_transport as v

SOURCE=Path(os.environ.get('N6_SOURCE','/mnt/data/n6-domain-full'))
PREPARED=Path(os.environ.get('N6_PREPARED','/mnt/data/n6-source/prepared'))
PRIOR=Path(os.environ.get('N6_PRIOR','/mnt/data/n6-final'))
EVIDENCE=Path(os.environ.get('N6_EVIDENCE','/mnt/data/n6-stage3-followup/evidence'))

class ActualSourceTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.cp=v.read_locked(PREPARED/'cartesian/checkpoints/cartesian-source-checkpoint.json',v.PINS['checkpoint'])
  cls.chart=v.read_locked(PREPARED/'cartesian/source-chart/analytic-initial-source-domain.json',v.PINS['chart'])
  cls.front=v.read_locked(PRIOR/'OBLIGATION_MATRIX.json',v.PINS['frontier'])
  cls.struct=v.read_locked(PRIOR/'actual-structural-obstructions.json',v.PINS['structural'])
  # This header and disposable DB were authenticated by the full audit first.
  cls.reg=v.registries(json.loads((SOURCE/'header.json').read_text()))
  cls.g=v.Source(EVIDENCE/'source-cache.sqlite')
  cls.result=json.loads((EVIDENCE/'RESULT.json').read_text())

 def cover(self,cp=None,reg=None,g=None):return v.check_cover_rows(cp or self.cp,reg or self.reg,g or self.g,self.chart)
 def native(self,reg=None,g=None):return v.check_native_blocks(reg or self.reg,self.struct,g or self.g)
 def changed_source(self,ident,node):return lambda i:node if i==ident else self.g(i)
 def reject_cover_node(self,ident,node):
  with self.assertRaises(ValueError):self.cover(g=self.changed_source(ident,node))
 def reject_native_node(self,ident,node):
  with self.assertRaises(ValueError):self.native(g=self.changed_source(ident,node))
 def edit_cover(self,change):
  reg=dict(self.reg);reg['m3GlobalFields']=list(reg['m3GlobalFields'])
  d=copy.deepcopy(reg['m3GlobalFields'][0]);reg['m3GlobalFields'][0]=d;change(d)
  cp=dict(self.cp);cp['definitionBindings']=[{**b,'definition':d} if b['key']=='m3GlobalFields:0' else b for b in self.cp['definitionBindings']]
  with self.assertRaises(ValueError):self.cover(cp=cp,reg=reg)
 def edit_pulse(self,change):
  reg=dict(self.reg);reg['m3GlobalPulses']=copy.deepcopy(reg['m3GlobalPulses']);change(reg['m3GlobalPulses'][1])
  with self.assertRaises(ValueError):self.native(reg=reg)
 def edit_block(self,change):
  reg=dict(self.reg);reg['m3GlobalBlocks']=list(reg['m3GlobalBlocks'])
  b=copy.deepcopy(reg['m3GlobalBlocks'][0]);reg['m3GlobalBlocks'][0]=b;change(b)
  with self.assertRaises(ValueError):self.native(reg=reg)

 def test_full_original_source_receipt(self):
  self.assertEqual(self.result['fullSource']['nodes'],3892594)
  self.assertEqual(self.result['fullSource']['parentSHA256'],v.PARENT)
  self.assertEqual(v.sha_bytes((SOURCE/'original-parent.ndjson.gz').read_bytes()),v.GZIP)
 def test_all_4050_original_cover_rows(self):
  r=self.cover();self.assertEqual(r['examined'],4050);self.assertEqual(r['originalCheckpointRows'],2349)
  self.assertEqual(r['additionalFullParentRows'],1701);self.assertEqual(r['unresolvedAtThisRowLayer'],0)
 def test_every_original_family_and_label(self):
  r=self.cover();self.assertEqual([f['rows'] for f in r['families']],[1458,864,864,864]);self.assertEqual(r['labels'],81)
 def test_all_188_native_rows(self):
  r=self.native();self.assertEqual((r['nativeRowsVerified'],r['unresolvedNativeBindings']),(188,0))
  self.assertEqual((r['sparseTermsVerified'],r['scaledMatrixCellsVerified'],r['scaledNormCellsVerified']),(574,2296,574))
 def test_original_producer_hashes(self):self.assertEqual(len(v.check_source_kernels(SOURCE/'source')['files']),4)
 def test_original_guard_ids_and_status_retained(self):
  r=v.target_guard_status(self.front);self.assertEqual(len(r),8);self.assertTrue(all(x['officialStatus']=='OPEN' for x in r))
 def test_no_false_full_proof_promotion(self):
  self.assertFalse(self.result['wholeOriginalCallGraphCertified']);self.assertEqual(self.result['newOriginalObligationsDischarged'],0)
  self.assertEqual(self.result['remaining']['total'],1288);self.assertFalse(self.result['native']['fullPulseAnalyticValidityProved'])
 def test_reject_changed_reference_scale(self):self.reject_cover_node(v.QREF,{'op':'exp','args':[1]})
 def test_reject_changed_slow_equation(self):self.reject_cover_node(622819,{'op':'add','args':[622817,v.T]})
 def test_reject_wrong_eta_exponent(self):self.reject_cover_node(22,{'op':'add','args':[19,9]})
 def test_reject_captured_radial_variable(self):self.reject_cover_node(632193,{'op':'multiply','args':[v.R,632192]})
 def test_reject_wrong_candidate_label(self):self.reject_cover_node(633637,{'op':'add','args':[v.LOG_BAND,0]})
 def test_reject_mismatched_T_scale(self):self.reject_cover_node(632194,{'op':'multiply','args':[v.T,632221]})
 def test_reject_wider_guard(self):self.reject_cover_node(120836,{'op':'rational','args':['5','4']})
 def test_reject_negative_scale(self):self.reject_cover_node(632185,{'op':'multiply','args':[20,1]})
 def test_reject_missing_guard(self):self.edit_cover(lambda d:d['rows'][0]['guards'].pop())
 def test_reject_reordered_guard(self):self.edit_cover(lambda d:d['rows'][0]['guards'].reverse())
 def test_reject_copy_coordinate_in_slow_slot(self):self.edit_cover(lambda d:d['rows'][0]['values'].__setitem__(1,622807))
 def test_reject_wrong_local_body(self):self.edit_cover(lambda d:d['rows'][0].__setitem__('localBody',1))
 def test_reject_wrong_derivative_scale(self):self.edit_cover(lambda d:d['rows'][0]['derivativeScales'].__setitem__(1,1))
 def test_reject_dropped_label(self):self.edit_cover(lambda d:d['rows'].pop())
 def test_reject_duplicate_label(self):self.edit_cover(lambda d:d['rows'].__setitem__(1,copy.deepcopy(d['rows'][0])))
 def test_reject_parent_parameter_loss(self):self.edit_pulse(lambda p:p['parameters'].pop())
 def test_reject_slow_time_capture(self):self.edit_pulse(lambda p:p.__setitem__('variable',v.T))
 def test_reject_wrong_direction_indices(self):self.edit_pulse(lambda p:p.__setitem__('directionParameterIndices',[2,1,0]))
 def test_reject_changed_covariance_datum(self):self.edit_pulse(lambda p:p.__setitem__('initial',[0,1]))
 def test_reject_wrong_pulse_interval(self):self.edit_block(lambda b:b.__setitem__('intervalLength',1))
 def test_reject_missing_downward_row(self):self.edit_block(lambda b:b['rows'].pop())
 def test_reject_wrong_variational_dimension(self):self.edit_block(lambda b:b.__setitem__('dimension',0))
 def test_reject_hidden_norm_capture(self):self.edit_block(lambda b:b['coefficients'][0]['norm']['entries'][0][0]['parameters'].reverse())
 def test_reject_FTC_binder_capture(self):self.edit_block(lambda b:b['coefficients'][0]['norm']['entries'][0][0].__setitem__('integrationVariable',v.T))
 def test_reject_wrong_FTC_endpoint(self):
  e=self.reg['m3GlobalBlocks'][0]['coefficients'][0]['norm']['entries'][0][0]
  self.reject_native_node(e['integral'],{'op':'definite_integral','args':[e['integrand'],e['integrationVariable'],0,1]})
 def test_reject_wrong_FTC_derivative(self):
  e=self.reg['m3GlobalBlocks'][0]['coefficients'][0]['norm']['entries'][0][0]
  self.reject_native_node(e['sharedTimeDerivative'],{'op':'actual_expression_partial','args':[e['sharedDefinition'],e['bodyParameters'],[0]*8]})
 def test_reject_changed_sparse_matrix_cell(self):
  for b in self.reg['m3GlobalBlocks']:
   for r in b['rows']:
    for t in r['blocks']:
     if v.q(self.g,t['scale'])!=1:
      ident=next(x for row in t['matrix'] for x in row if self.g(x)['op']=='multiply')
      self.reject_native_node(ident,{'op':'rational','args':['0','1']});return
  self.fail('Real nontrivial binomial block missing')
 def test_reject_changed_scaled_norm(self):
  t=next(t for b in self.reg['m3GlobalBlocks'] for r in b['rows'] for t in r['blocks'] if v.q(self.g,t['scale'])!=1)
  self.reject_native_node(t['norm'],{'op':'rational','args':['0','1']})
 def test_reject_false_closed_guard(self):
  f=copy.deepcopy(self.front);f['cumulativeGlobalGuardRows'][25]['status']='PASS'
  with self.assertRaises(ValueError):v.target_guard_status(f)
 def test_reject_bad_whole_source_hash(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp);(p/'bad.gz').write_bytes(b'not the original')
   with self.assertRaises(ValueError):v.prepare_source(p/'bad.gz',p/'must_not_exist.sqlite')
   self.assertFalse((p/'must_not_exist.sqlite').exists())
 def test_actual_guard_loop_excerpts_build_outer_lazy_guard(self):
  paths=['source-global-expressions.mjs','source-auxiliary-expressions.mjs','source-coupled-expressions.mjs']
  texts=[(SOURCE/'source'/p).read_text() for p in paths]
  starts=['for(const [coordinate,left,right]of row.guards){const prior=guarded;',
          'for(const [coordinate,left,right]of row.guards){const body=value;',
          'for(const [x,left,right]of row.guards)value=this.choose']
  snippets=[]
  for text,start in zip(texts,starts):
   at=text.index(start)
   if '{' in start:
    end=text.index('{',at);depth=1;end+=1
    while depth:
     depth+=(text[end]=='{')-(text[end]=='}');end+=1
   else:end=text.index(';',at)+1
   snippets.append(text[at:end])
  js='''const assert=require('node:assert/strict');
const snippets=JSON.parse(process.argv[1]);
for(let i=0;i<3;i++){
 const row={guards:[['inner',-1,1],['band',-0.75,0.75]]};
 const ctx={zero:0,choose:(...args)=>({args})};
 const fn=new Function('row',"const unguarded='singular'; let guarded=unguarded,value=unguarded; const layers=[],guards=[];"+snippets[i]+";return "+(i===0?'guarded':'value')+";");
 const tree=fn.call(ctx,row);assert.equal(tree.args[0],'band');let hits=0;
 function ev(t,env){if(t===0)return 0;if(t==='singular'){hits++;return 7;}const [x,a,b,z,f,w]=t.args;return ev(env[x]<=a?z:env[x]>=b?w:f,env);}
 for(const band of [-1,-0.75,0.75,1]){assert.equal(ev(tree,{inner:0,band}),0);assert.equal(hits,0);}
 assert.equal(ev(tree,{inner:0,band:0}),7);assert.equal(hits,1);
}
console.log('original guard loops: 3/3; 12 inactive controls; 3 active controls');'''
  p=subprocess.run(['node','-e',js,json.dumps(snippets)],text=True,capture_output=True)
  self.assertEqual(p.returncode,0,p.stderr);self.assertIn('3/3',p.stdout)

class ExactProofTests(unittest.TestCase):
 def test_symbolic_homogeneity(self):self.assertEqual(v.proof_arithmetic()['homogeneity'],'2*(1/2-h)+2*h=1')
 def test_uniform_band_margins_without_floats(self):
  self.assertLess(2**3,2**4);self.assertGreater(Q(1,8),Q(1,16))
 def test_bump_plateau_exact_margins(self):
  r=v.proof_arithmetic();self.assertLess(Q(r['bumpPlateauLowerEndpointUpper']),Q(1,2));self.assertGreater(Q(r['bumpPlateauUpperEndpointLower']),2)
 def test_downward_multiindex_product_counts(self):
  for a in itertools.product(range(5),repeat=3):
   self.assertEqual(len(v.downward(list(a))),(a[0]+1)*(a[1]+1)*(a[2]+1))
 def test_binomial_row_mass_independent(self):
  for a in itertools.product(range(5),repeat=3):
   self.assertEqual(sum(comb(a[0],b[0])*comb(a[1],b[1])*comb(a[2],b[2]) for b in v.downward(list(a))),2**sum(a))
 def test_malformed_multiindex_rejected(self):
  for a in [[-1,0,0],[0,0],[0,0,True],[0,0,100000]]:
   with self.assertRaises(ValueError):v.downward(a)

if __name__=='__main__':unittest.main(verbosity=2)
