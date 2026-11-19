"""Exact same-live Signed-only own-chart curl and candidate-potential binding."""
from argparse import ArgumentParser
from collections import defaultdict,Counter
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json,sys
if not __debug__:raise RuntimeError('Exact assertions must remain enabled.')
PINS={'old':'c2987779c065ac09e48e0317e7727498fcea9dd93191e00ec53087a4675e0920',
 'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
 'reader':'2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb'}
def check(path,pin):
 b=path.read_bytes();assert sha256(b).hexdigest()==pin,path;return b
def main():
 cli=ArgumentParser(description=__doc__)
 for name in ('goal','work','cache','out'):cli.add_argument('--'+name,type=Path,required=True)
 a=cli.parse_args()
 read_dir=a.goal/'primary-forced-join/active-n3-c5-binding/spatial-readback'
 check(read_dir/'source_stream.py',PINS['reader'])
 check(read_dir/'verify_spatial_structure.py','1493328510177182ae760be95ee832e3a670f0b3227b12bd5714405cb7763ef9')
 check(a.goal/'first-gauge/bind_first_cycle_gauge.py',PINS['old'])
 check(a.goal/'first-force-repair/verify_repaired_first_force.py',PINS['exact'])
 sys.path[:0]=[str(Path(__file__).parent),str(read_dir),str(a.goal/'first-gauge'),str(a.goal/'first-force-repair')]
 import source_stream as reader
 import verify_spatial_structure as typed
 import bind_first_cycle_gauge as old
 from source_cache import prepare
 spatial=json.loads(check(a.work/'continuation70/spatial-readback-44582875351.json','364debba33e15d7db387b9a67c4deb5cc43e59a96744ad046ac8b4ba146991b2'))
 assert spatial['hostedRun']['id']==44582875351
 artifact=a.work/'continuation70/hosted-44582875351'
 ingress=json.loads(check(artifact/'first-correction-spatial-ingress.json',spatial['ingressSHA256']))
 directory=artifact/'first-correction-spatial-source'
 manifest=json.loads(check(directory/reader.MANIFEST,spatial['graphManifestSHA256']))
 native=reader.Native(directory,manifest)
 class Legacy:
  expressions={r['name']:r for r in native.expressions}
  fields={r['name']:r for r in native.fields}
  coupled_by_id={r['id']:r for r in native.expressions}
 legacy=Legacy()
 class View:
  def __init__(self,stream):self.stream=stream;self.backing=stream.backing;self.offsets=stream.offsets
  def record(self,i):return self.stream.record(i)
  def node(self,i):
   rec=self.record(i);return rec['op'],rec['args']
  def args(self,i,op):return self.stream.args(i,op)
  op=args
  def rational(self,i):return self.stream.rational(i)
  def reach(self,roots):
   seen=set();todo=list(roots)
   while todo:
    i=todo.pop()
    if i in seen:continue
    seen.add(i);todo.extend(old.Graph.children(*self.node(i)))
   return seen
 stream=prepare(reader,directory,manifest,ingress['originalPrefix'],a.cache)
 try:
  g=View(stream)
  geometry,owners=typed.verify_registered_wave(stream,native,ingress)
  signs=[next(s for s,o in owners.items() if o==j) for j in (0,1)]
  old.K=17732747;old.EPSILON=17732744;old.ORIGINAL_SIGNS=signs
  for i,value in [(0,0),(1,1),(19,Fraction(1,2)),(20,-1)]:assert g.rational(i)==value
  candidateBy={r['key']:r for r in ingress['wave']['perTemplate']}
  first=ingress['wave']['perTemplate'][0]
  signed=first['potential'][-1];assert signed['m']==1 and signed['real']==[0]*3
  def stripHalf(root):
   factors=g.args(root,'multiply');half=[i for i in factors if g.node(i)[0]=='rational' and g.rational(i)==Fraction(1,2)]
   assert len(half)==1 and len(factors)==2
   return next(i for i in factors if i!=half[0])
  value=stripHalf(signed['imaginary'][1])
  defn,args,orders=native.application(stream,value)
  old.REPRESENTATIVE=args[5:8]
  saved=old.signed_curl;captured=[]
  old.signed_curl=lambda graph,alg,coeff,pot,seen:captured.append((coeff,pot,seen))
  try:rows=old.signed_modes(g,legacy)
  finally:old.signed_curl=saved
  assert len(rows)==len(captured)==10
  # Derive the actual local radial-fast operand from its literal theta-xi term.
  rf=[]
  for row,(coeff,pot,seen) in zip(rows,captured,strict=True):
   direction=tuple(int(i==3) for i in range(12))
   jet=old.unique(seen[1,direction],'actual Signed theta-xi jet')
   hits=[]
   for i in g.reach([coeff[2]['imaginary']]):
    op,aa=g.node(i)
    if op=='multiply' and jet in aa:
     remain=[x for x in aa if x!=jet]
     remain=[x for x in remain if not(g.node(x)[0]=='rational' and g.rational(x)==Fraction(1,2))]
     if len(remain)==1:hits.append(remain[0])
   rf.append(old.unique(set(hits),'literal local Signed radial-fast operand'))
  assert len(set(rf))==1
  old.LOCAL_RADIAL_FAST=rf[0]
  print('actual Signed constants',{'K':old.K,'epsilon':old.EPSILON,'localRadialFast':rf[0],'representative':old.REPRESENTATIVE},flush=True)
  for coeff,pot,seen in captured:saved(g,old.Exact(g),coeff,pot,seen)
  # Same indexed labels/guards and same local candidate half-potential for every template.
  cover=old.cover(legacy)
  sig=lambda f:[{key:r[key] for key in ('values','guards','derivativeMaps','coefficient','label')} for r in f['rows']]
  for j in range(3):assert sig(legacy.fields['SpatialStage1Gauge_'+str(j)])==cover
  result=[]
  for row,(coeff,pot,seen) in zip(rows,captured,strict=True):
   key=row['key'];item=candidateBy[key];delta,sign=map(int,key.split(':'));owner=owners[sign]
   assert item['phase']==row['phase'] and item['k']==row['waveNumber']==old.K
   for j in range(3):
    candidate,guards=old.select_chart(g,legacy.expressions[f'SpatialStage1Gauge_own_{owner}_{j}'],delta)
    assert guards==row['fixedGuards']
    call=stripHalf(item['potential'][-1]['imaginary'][j])
    assert call==pot[j]
   result.append({'key':key,'phase':row['phase'],'carrier':row['waveNumber'],'guards':row['fixedGuards'],
    'actualNativeSignedPotential':pot,'nativeJetInventory':row['nativePotentialJetInventory'],
    'actualVelocityCoefficients':coeff[:3],'candidateSignedHalfPotential':item['potential'][-1],
    'localRadialFast':rf[0],'epsilon':old.EPSILON,'sameCandidatePhaseAndGuards':True,
    'localImaginaryCurlVerified':True,'leadingCrossArmSkewVerified':True})
  receipt={'schema':'MathScope.C80.SameLiveSignedOwnChartCurl/1','status':'PASS_SIGNED_LOCAL_REMAINDER_AND_CANDIDATE_BINDINGS_PHASE_GRADIENT_NEXT',
   'hostedRun':44582875351,'sourceStream':stream.verify,'registrySHA256':native.pin,'readerPins':PINS,
   'actualOperands':{'k':old.K,'epsilon':old.EPSILON,'localRadialFast':rf[0],'commonReferenceRadialFast':17745446,'representative':old.REPRESENTATIVE},
   'cases':result,'rows':len(cover),'phaseGradientNormalComparison':'NEXT','outerCrossChartJoin':'SEPARATE',
   'scope':{'noForcedReductionHere':True,'noWholeGaugeZeroClaim':True,'noNativeOpaqueValueEvaluated':True,'release':'HOLD'}}
  a.out.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8',newline='\n')
  print('PASS Signed own-chart exact remainder/candidate phase/guards',len(result),flush=True)
 finally:stream.__exit__(None,None,None)
if __name__=='__main__':main()
