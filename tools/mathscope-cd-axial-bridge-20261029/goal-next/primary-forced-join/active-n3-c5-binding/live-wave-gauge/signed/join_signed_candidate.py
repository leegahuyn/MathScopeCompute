"""Bind actual appended Signed harmonic subseries and reference power factors."""
from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json,sys
if not __debug__:raise RuntimeError('Exact assertions must remain enabled.')
def main():
 p=ArgumentParser(description=__doc__)
 for name in ('goal','work','cache','signed','phase','out'):p.add_argument('--'+name,type=Path,required=True)
 a=p.parse_args();base=a.goal/'primary-forced-join/active-n3-c5-binding/spatial-readback'
 for path,pin in [(base/'source_stream.py','2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb'),(a.goal/'first-gauge/bind_first_cycle_gauge.py','c2987779c065ac09e48e0317e7727498fcea9dd93191e00ec53087a4675e0920'),(a.goal/'first-force-repair/verify_repaired_first_force.py','260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75')]:
  assert sha256(path.read_bytes()).hexdigest()==pin,path
 sys.path[:0]=[str(Path(__file__).parent),str(base),str(a.goal/'first-gauge'),str(a.goal/'first-force-repair')]
 import source_stream as reader
 import bind_first_cycle_gauge as old
 from source_cache import prepare
 sb=a.signed.read_bytes();pb=a.phase.read_bytes()
 assert sha256(sb).hexdigest()=='7e494388cecfb1cdfa8c22732491063135af4947ee9b667f37f0ce25d4604aec'
 assert sha256(pb).hexdigest()=='5fe1bb69eda9e5932ac57ba69814a51b26c1cfac4b4449937ead85e9e5ea19c0'
 signed,phase=json.loads(sb),json.loads(pb)
 assert phase['status']=='PASS_ACTUAL_SIGNED_LEADING_IS_CURL_OF_SAME_LITERAL_PHASE'
 assert phase['signedReceiptSHA256']==sha256(sb).hexdigest() and phase['phaseLeadingComparisons']==30
 artifact=a.work/'continuation70/hosted-44582875351';directory=artifact/'first-correction-spatial-source'
 ib=(artifact/'first-correction-spatial-ingress.json').read_bytes()
 assert sha256(ib).hexdigest()=='20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f'
 ingress=json.loads(ib);manifest,_=reader.read(directory/reader.MANIFEST);native=reader.Native(directory,manifest)
 assert native.pin==signed['registrySHA256'] and manifest['node_stream_sha256']==signed['sourceStream']['sha256']
 nativeById={r['id']:r for r in native.expressions};names={r['name']:r for r in native.expressions}
 class Legacy:
  expressions=names
  fields={r['name']:r for r in native.fields}
  coupled_by_id=nativeById
 legacy=Legacy()
 stream=prepare(reader,directory,manifest,22153782,a.cache)
 class View:
  def __init__(self):self.backing=stream.backing;self.offsets=stream.offsets
  def node(self,i):
   r=stream.record(i);return r['op'],r['args']
  def args(self,i,op):return stream.args(i,op)
  def reach(self,roots):
   todo=list(roots);seen=set()
   while todo:
    i=todo.pop()
    if i in seen:continue
    seen.add(i);todo.extend(old.Graph.children(*self.node(i)))
   return seen
 g=View();alg=old.Exact(g)
 def harmonic(root,scale=Fraction(1)):
  op,args=g.node(root)
  if root==0:return
  if op=='add':
   for j in args:yield from harmonic(j,scale)
   return
  assert op=='multiply',('candidate harmonic envelope',root,op)
  rational=[i for i in args if g.node(i)[0]=='rational']
  for i in rational:scale*=old.q(g,i)
  rest=[i for i in args if i not in rational]
  if not scale:return
  if len(rest)==1:
   yield from harmonic(rest[0],scale);return
  trig=[i for i in rest if g.node(i)[0] in ('sine','cosine')]
  assert len(trig)==1 and len(rest)==2,('candidate real harmonic product',root,rest)
  trig=trig[0];kind,[angle]=g.node(trig);coefficient=next(i for i in rest if i!=trig)
  yield kind,angle,coefficient,scale
 try:
  old.ORIGINAL_SIGNS=[1,-1]
  saved=old.FORCED_FIELDS;old.FORCED_FIELDS=[]
  try:reference=old.reference_scaling(g,legacy)
  finally:old.FORCED_FIELDS=saved
  assert len(reference)==8
  checked=[];missingHalf=False;wrongPhase=False;missingConnection=False;missingEpsilon=False
  for row in signed['cases']:
   key=row['key'];delta,sign=map(int,key.split(':'));owner=0 if sign==1 else 1
   potential=row['actualNativeSignedPotential'];rows=[]
   for j in range(3):
    body,guards=old.select_chart(g,names[f'SpatialStage1Gauge_own_{owner}_{j}'],delta)
    assert guards==row['guards']
    extracted={}
    for kind,angle,coefficient,scale in harmonic(body):
     polynomial=alg.of(coefficient)
     for monomial,value in polynomial.items():
      found=[]
      for atom,power in monomial:
       if atom<0:continue
       op,args=g.node(atom)
       if op=='m3_coupled_expression_partial' and args[0] in nativeById and nativeById[args[0]]['name'].startswith('GenericSignedAfterForced_'):
        found.append((atom,power,args))
      if not found:continue
      assert len(found)==1 and found[0][0]==potential[j] and found[0][1]==1
      assert monomial==((potential[j],1),),'Signed candidate contains an unexpected multiplier'
      atom,power,app=found[0]
      assert not any(app[2]) and nativeById[app[0]]['name']==f'GenericSignedAfterForced_{owner}_{j}'
      assert alg.of(angle)==alg.mul(alg.of(17732747),alg.of(row['phase']))
      term={(monomial):scale*value}
      extracted[kind]=alg.add(extracted.get(kind,alg.zero),term)
    assert set(extracted)=={'sine'}
    assert extracted['sine']==alg.neg(alg.of(potential[j]))
    # The original candidate i*C/2 plus its conjugate is exactly -C*sin(k*phi).
    if j==0 and not missingHalf:
     assert extracted['sine']!=alg.neg(alg.mul(alg.scalar(2),alg.of(potential[j])))
     missingHalf=True
     assert extracted['sine']!=alg.of(potential[j]);wrongPhase=True
    if j==2 and not missingConnection:
     # Removing the source theta/R remainder changes an exact native coefficient.
     Ptheta=potential[1];R=17732748
     altered=alg.sub(alg.of(row['actualVelocityCoefficients'][2]['imaginary']),
       alg.mul(alg.scalar(Fraction(1,2)),alg.of(Ptheta),alg.inv(alg.of(R))))
     assert altered!=alg.of(row['actualVelocityCoefficients'][2]['imaginary']);missingConnection=True
    if j==0 and not missingEpsilon:
     source=row['actualVelocityCoefficients'][0]['imaginary']
     order=[0]*12;order[1]=1
     derivative=next(r['root'] for r in row['nativeJetInventory'] if r['component']==1 and r['orders']==order)
     assert alg.of(source)!=alg.neg(alg.mul(alg.scalar(Fraction(1,2)),alg.of(derivative)));missingEpsilon=True
    rows.append({'component':j,'actualCandidateBody':body,'sameSevenGuards':True,
     'sameNativePotentialRoot':potential[j],'SignedRealSeries':'-C_j*sin(k*phi)',
     'actualCandidateSignedSineCoefficient':{'scalar':'-1','root':potential[j]},
     'matchedOriginalPositiveFourierPotential':{'real':0,'imaginary':{'scalar':'1/2','root':potential[j]}}})
   checked.append({'key':key,'phase':row['phase'],'carrier':17732747,'components':rows})
  assert len(checked)==10 and all((missingHalf,wrongPhase,missingConnection,missingEpsilon))
  result={'schema':'MathScope.C80.SameLiveSignedWaveCurlReduction/1',
   'status':'VERIFIED_SAME_LIVE_SIGNED_OWN_CHART_CURL_AND_ACTUAL_APPENDED_GAUGE_SUBSERIES',
   'hostedRun':44582875351,'sourceStreamSHA256':manifest['node_stream_sha256'],'sourceNodes':manifest['node_count'],'registrySHA256':native.pin,
   'signedLocalReceiptSHA256':sha256(sb).hexdigest(),'literalPhaseReceiptSHA256':sha256(pb).hexdigest(),'ingressSHA256':sha256(ib).hexdigest(),
   'actualOperands':signed['actualOperands'],'cases':checked,
   'counts':{'templates':10,'localLeadingPhaseComparisons':30,'localImaginaryCylindricalCurlComparisons':30,
    'actualSignedConjugateCoefficientIdentities':120,'appendedSignedPotentialSubseriesComparisons':30,'sameOriginalIndexedRows':162,
    'actualSignedReferenceVelocityAndPressureScales':8},
   'sourceReferenceScales':reference,
   'physicalScaleMeaning':'Actual source reference arguments are(sqrt(rho)R,rho^D Z,rho T), actual Signed velocity/pressure factors are rho^A/rho^(2A), and C77 verifies candidate potential factor rho^(A-1/2). Full derivative transport requires the separate actual local-lift/outer radialFast join, not inferred from the local remainder.',
   'negativeControls':{'omittedSignedHalfRejectedByExactCoefficients':missingHalf,'reversedFundamentalPhaseSignRejected':wrongPhase,
    'omittedCylindricalThetaOverRRejected':missingConnection,'omittedAxialEpsilonRejected':missingEpsilon,
    'meaning':'Exact coefficient/construction controls with native functions kept formal; not numerical fixed-profile counterexamples.'},
   'sourceSupportAndDifferentiation':'Each of the10 exact own-chart branches retains all seven original lazy guards and the same frozen actual native arguments. Every positive/negative fundamental and source pressure row is retained by the pinned Signed parser. No nearest-copy, band label or representative is differentiated.',
   'outerRadialFastBoundary':{'localRawOwnOperand':17735155,'sharedCommonBaseOperand':17745446,
    'requiredSourceLift':'exactOriginalAngularLift uses aOwnRaw/Lambda^Delta with frozen palette difference Delta, whose L(xi)=Lambda^Delta. Its complete actual reference composition is a separate parent join.',
    'outerNumericOperandIdentityClaimedHere':False},
   'scope':{'actualSignedLocalCurlReduced':True,'actualAppendedSignedSubseriesBound':True,'literalActualPhaseGradientVerified':True,
    'referenceCoordinateAndPowerFactorsVerified':True,'outerOwnReferenceFastDerivativeJoin':'SEPARATE',
    'ForcedPartReducedHere':False,'wholeThreeGaugeRootsDeclaredZero':False,'uniformStageCapsClosed':False,
    'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}}
  a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
  print('PASS actual appended Signed subseries30, source Fourier identities120, phase30, remainder30; same162 rows; outer link separate',flush=True)
 finally:stream.__exit__(None,None,None)
if __name__=='__main__':main()
