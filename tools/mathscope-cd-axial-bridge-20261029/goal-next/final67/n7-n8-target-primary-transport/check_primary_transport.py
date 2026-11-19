"""Check original-target monotone transfer and its exact native seal boundary."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from importlib.util import spec_from_file_location,module_from_spec
from pathlib import Path
import json
if not __debug__:raise RuntimeError('Assertions must remain enabled.')
PINS={
 'mathscope-m3/navier/source-primary-class-majorants.mjs':'40b3f1220b7ad1b9b05a11ae1378c864351e77e8efe7134ae1b78921fbab47ea',
 'mathscope-m2/navier/actual-global-wave-bound-kernel.mjs':'aed60d154195d07b38e2b7fa3005a1b792cc6e8c8867a91008fecec2d33ca6b9',
 'mathscope-m2/navier/actual-all-order-gaussian-jet-kernel.mjs':'5de9d043e77bc511e2e117bc825c42d60375193f617a78724ae535f0127415f6',
 'mathscope-m2/navier/actual-common-admissible-family.mjs':'7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75',
 'mathscope-m3/navier/source-global-class.mjs':'f07341f299b2b9cd24844c4d738b5c6605816bdaf4eeca317b80618b27ed7095',
 'mathscope-m2/navier/actual-common-target-weighted-norms.mjs':'6fca53620e45a839868d094a1425ee0071ec4ca21c16bff77476d8be2f32e38a'}
def top(e):
 for _ in range(5):assert set(e)=={'exp'};e=e['exp']
 assert set(e)=={'rational'}
 return Q(e['rational'])
def main():
 p=ArgumentParser(description=__doc__);p.add_argument('goal',type=Path);p.add_argument('directory',type=Path);a=p.parse_args()
 readerfile=a.goal/'first-scale-closure/check_first_scale_closure.py'
 assert sha256(readerfile.read_bytes()).hexdigest()=='9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee'
 s=spec_from_file_location('reader',readerfile);reader=module_from_spec(s);s.loader.exec_module(reader)
 src={}
 for path,pin in PINS.items():
  b=reader.git_blob(a.goal.parents[2],'research-ide/'+path);assert sha256(b).hexdigest()==pin,path;src[path]=b.decode()
 def clauses(path,*items):
  for item in items:assert item in src[path],(path,item)
 clauses('mathscope-m2/navier/actual-global-wave-bound-kernel.mjs',
  "targetPoles=input.targetPoles??Array.from({length:order+2},(_,j)=>3+3*j)",
  '|D^j Tbar|<=K_m*zeta*delta^(-targetPoles[j])',
  'all target jet constants through m+1',
  'inverse.push(degree(H[0].power+2))','degree(1,targetPoles[m-j])',
  'since y>=c_y*zeta','allMixedSubsetsAndMatrixDimensionsRetained:true')
 clauses('mathscope-m3/navier/source-primary-class-majorants.mjs',
  'assertGlobalCurrentState(current);assertActualCommonTargetWeightedNorms(target)',
  "if(target.family!==family)fail(",
  'backgroundRow.backgroundDerivativeOrder!==m+3||target.request.derivativeOrder<m+1',
  '...targetRows.map(r=>r.N_m)','G.pow(W,m+3)',
  'assertGlobalCurrentState(p.current);assertActualCommonTargetWeightedNorms(p.target)')
 clauses('mathscope-m2/navier/actual-common-target-weighted-norms.mjs',
  'const s=seals.get(p);if(!s||p.G!==s.G||p.family!==s.family||data(p)!==s.data',
  'assertActualCommonAdmissibleFamily(s.family)')
 clauses('mathscope-m3/navier/source-global-class.mjs',
  'n=order+2','partitionRows=Array.from({length:n+1}',
  'G.pow(partitionMax,n+4)','G.pow(logChartMax,n+4)')
 clauses('mathscope-m2/navier/actual-common-admissible-family.mjs',
  'determinantScaleLower=G.div(','weightOverZetaLower=G.div(')
 b=(a.directory/'primary-transport.json').read_bytes();r=json.loads(b)
 assert r['scope']['newActualClassCertified'] is False
 assert r['scope']['nativeKOrNReplaced'] is False
 assert r['scope']['finalJets']=='0/67'
 expected={3:{'W':18310065,'dstar':17732714,'cy':17732725},4:{'W':24120468,'dstar':23543117,'cy':23543128}}
 for row in r['primitiveDirectedAlready']:
  assert {name:x['id'] for name,x in row['rows'].items()}==expected[row['prefix']]
  assert row['originalIntegralBoundaryIds']==[239,257,275]
 hybrid=[]
 for row in r['transfers']:
  m=row['outputOrder'];h=row['sharperHybridTransfer'];u=h['targetMaximum']['upper']
  assert row['targetOrder']==m+1 and row['requiredBackgroundOrder']==m+3 and row['requiredCutoffMapOrder']==m+2
  assert h['targetPoles']==list(range(3,3*(m+2)+1,3))
  assert h['exactOriginalDegreeProgramUnchanged'] is True
  constants=h['targetConstants'];assert [x['order'] for x in constants]==list(range(m+2))
  assert max(top(x['enclosure']['upper']) for x in constants)==top(u)
  winner=max(constants,key=lambda x:top(x['enclosure']['upper']))
  assert winner['order']==6 and winner['source']=='archived-actual-native-target-constant'
  # Exact positive-degree monotonicity: for Khat>=Kbase>=2,S>=1, all
  # (K*S)^p and positive product/binomial recurrences increase with K.
  for field,d in h['finalDegrees'].items():
   assert isinstance(d['power'],int) and isinstance(d['pole'],int)
   assert d['power']>=0 and d['pole']>=0
   assert d['power']==row['finalDegrees'][field]['power']
   assert d['pole']<=row['finalDegrees'][field]['pole']
  hybrid.append({'outputOrder':m,'targetOrder':m+1,'backgroundOrder':m+3,'cutoffMapOrder':m+2,
   'targetMaximumUnchangedNativeN6':True,'unchangedOriginalPoleInventory':h['targetPoles'],
   'targetMaximumExp5Top':str(top(u)),'finalDegrees':h['finalDegrees']})
 out={'schema':'MathScope.OriginalPrimaryExternalTargetSourceAudit/1',
  'status':'PASS_EXACT_ORIGINAL_PURE_RECURRENCE_AND_TARGET_CONSTANT_DOMINANCE',
  'sourceSHA256':PINS,'fixedOriginalCommit':'f8cb4034e86d7b669d52a6f2248aebba156b51b5','receiptSHA256':sha256(b).hexdigest(),
  'hybrid':hybrid,'alreadyDirectedOriginalRoots':expected,
  'minimalNativeBoundary':'The native attachment requires a private unchanged target object and reads its original N_m integer roots. External analytic pointwise upper bounds are valid premises of the original pure recurrence, but cannot replace these sealed roots or bound the native maximum in reverse. A new external-target adapter/proof must bind the same target identity and retain the private family association.',
  'semanticTransferProof':'The only target premise of the pure kernel is |D^j Tbar|<=K*zeta*delta^(-d_j). The archived native constants give j0..6, and the new external constants give j7/8 with d_j=3+3j. Their directed common maximum is already bounded by the existing N6 endpoint. Every remaining recurrence uses nonnegative finite sum/product/binomial or the positive inverse/determinant/weight floors. Choosing Khat to dominate these SAME remaining premises yields precisely the unchanged original degree/pole program; native norm values need not be compared.',
  'scope':'Conditional semantic transfer of the same original source field. No native target seal, H/y primitive rebind, selected class or final-jet promotion.'}
 (a.directory/'transport-audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8',newline='\n')
 print('PASS unchanged original degrees/poles; external target7/8 below existing N6; exact native-seal boundary retained')
if __name__=='__main__':main()
