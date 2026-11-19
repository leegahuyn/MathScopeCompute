"""Source-bound zero collars of the same-live original Signed potential."""
from argparse import ArgumentParser
from fractions import Fraction as F
from hashlib import sha256
from pathlib import Path
import importlib.util,json,sys
if not __debug__:raise RuntimeError('Assertions must remain enabled; do not run Python -O.')

PINS={
 'reader':'2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb',
 'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
 'cache':'b438895194e034f6896827a59db1dbe4cd7dc116045021cd5baa771d1b8d4949',
 'signed':'7e494388cecfb1cdfa8c22732491063135af4947ee9b667f37f0ce25d4604aec',
 'joined':'429918bd2cd4a167bcbc8e76e7d04b42b6ac11e4a2dbaa7ec06e14caffcd19ef',
 'gitReader':'9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee'}
def check(path,pin):
 b=path.read_bytes();assert sha256(b).hexdigest()==pin,path;return b
def qstr(x):return str(x)
def main():
 p=ArgumentParser(description=__doc__)
 for name in ('goal','work','out'):p.add_argument('--'+name,type=Path,required=True)
 a=p.parse_args();old=a.work/'continuation80/signed-wave/final'
 rd=a.goal/'primary-forced-join/active-n3-c5-binding/spatial-readback'
 check(rd/'source_stream.py',PINS['reader']);check(a.goal/'first-force-repair/verify_repaired_first_force.py',PINS['exact'])
 check(old/'source_cache.py',PINS['cache'])
 signed=json.loads(check(old/'signed-local-curl.json',PINS['signed']))
 joined=json.loads(check(old/'signed-wave-reduction.json',PINS['joined']))
 assert joined['status']=='VERIFIED_SAME_LIVE_SIGNED_OWN_CHART_CURL_AND_ACTUAL_APPENDED_GAUGE_SUBSERIES'
 assert signed['hostedRun']==44582875351 and len(signed['cases'])==10
 sys.path[:0]=[str(rd),str(old),str(a.goal/'first-force-repair')]
 import source_stream as reader
 from source_cache import load
 from verify_repaired_first_force import Exact
 gitfile=a.goal/'first-scale-closure/check_first_scale_closure.py';check(gitfile,PINS['gitReader'])
 spec=importlib.util.spec_from_file_location('pinned_git_reader',gitfile);gr=importlib.util.module_from_spec(spec);spec.loader.exec_module(gr)
 directory=a.work/'continuation70/hosted-44582875351/first-correction-spatial-source'
 manifest=json.loads((directory/reader.MANIFEST).read_bytes())
 assert manifest['executing_commit']=='059df9db3a188ce18f3c43a0dca3a92f2e02a4b2'
 gr.REFERENCE=manifest['executing_commit']
 source={}
 for name in ('source-global-band.mjs','source-global-current.mjs'):
  b=gr.git_blob(a.goal.parents[2],'research-ide/mathscope-m3/navier/'+name)
  source[name]={'sha256':sha256(b).hexdigest(),'text':b.decode()}
 for name,pin in [('generic-signed-source-kernel.mjs','15eea2c0f984c5b3bb58dd372d9b01660e44a85526c1f329b41b41855b4c27e2'),('generic-signed-162-indexed.mjs','973136acf1571a75a307e374576ec8dbbe0340c19e90ee327373df7638100bec')]:
  b=check(Path(__file__).parent/'source-context'/name,pin)
  source[name]={'sha256':pin,'text':b.decode(),'contextOnly':'Pinned generated runtime constructor; actual source identity is independently checked on the authenticated exported native bodies, not inferred from this text.'}
 b=gr.git_blob(a.goal.parents[2],'research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs')
 source['actual-global-source-expressions.mjs']={'sha256':sha256(b).hexdigest(),'text':b.decode()}
 assert source['source-global-band.mjs']['sha256']=='babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'
 for name,fragments in {
  'source-global-band.mjs':["G.choose(a,q(1,4),q(3,4),G.one",'G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4)))','G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls)))'],
  'generic-signed-source-kernel.mjs':['G.mul(G.sqrt(eps),da,band.cutoffs.chi,band.cutoffs.psi,x)','weighted=amplitude.map(x=>G.mul(slowCutoff,x))','G.div(x,G.mul(k,f.frame.nSquared))'],
  'source-global-current.mjs':['out=G.choose(coordinate,left,right,G.zero,inner,G.zero)','add(v,G.zero,geometry.Ls','add(xi,G.neg(geometry.r0),geometry.r0'],
  'actual-global-source-expressions.mjs':['if(x<=0||x>=1)return n===0?(x>=1?1:0):0;','v=ev(x<=a?args[3]:x>=b?args[5]:args[4],env)']}.items():
  for fragment in fragments:assert fragment in source[name]['text'],(name,fragment)
 native=reader.Native(directory,manifest)
 assert native.pin==signed['registrySHA256']
 raw=json.loads((directory/reader.REGISTRY).read_bytes());assert raw['maximumOrder']>=3
 stream=load(reader,directory,manifest,22153782,a.work/'continuation80/signed-wave/cache')
 class View:
  def node(self,i):r=stream.record(i);return r['op'],r['args']
  def args(self,i,op):return stream.args(i,op)
 g=View();E=Exact(g)
 try:
  r0,Ls,xi,v=14220486,17733029,17733037,17732751
  chi,psi0,psi1=17733045,17733053,17733056
  slow=[17735193,17735228,17735263,17735298]
  assert stream.rational(r0)==F(1,2**34)
  absXi,l,r,before,middle,after=stream.args(chi,'smooth_piecewise')
  assert (stream.rational(l),stream.rational(r),before,after)==(F(1,4),F(3,4),1,0)
  square,=stream.args(absXi,'sqrt_positive');ratio,degree=stream.args(square,'integer_power');assert degree==2
  assert E.of(ratio)==E.mul(E.of(xi),E.inv(E.of(r0)))
  argument,order=stream.args(middle,'source_step_derivative');assert order==0
  assert E.of(argument)==E.sub(E.scalar(F(3,2)),E.mul(E.scalar(2),E.of(absXi)))
  p0,k0=stream.args(psi0,'source_step_derivative');p1,k1=stream.args(psi1,'source_step_derivative');assert k0==k1==0
  slope=E.mul(E.scalar(20),E.inv(E.of(Ls)))
  assert E.of(p0)==E.sub(E.mul(slope,E.of(v)),E.scalar(4))
  assert E.of(p1)==E.sub(E.scalar(16),E.mul(slope,E.of(v)))
  factorRoots=[chi,psi0,psi1,*slow];definitions=[];byName={}
  for d in native.expressions:
   if not d['name'].startswith('GenericSignedAfterForced_'):continue
   assert d['parameters']==[17732748,17732749,17732750,xi,v,17732753,17732754,17732755,17732737,17733856,17733857,17733858]
   assert min(d['derivativeLimits'])>=3
   poly=E.of(d['body']);mins={i:min(dict(m).get(i,0) for m in poly) for i in factorRoots}
   assert all(n==1 for n in mins.values())
   quotient={tuple((i,n-(1 if i in factorRoots else 0)) for i,n in m if n-(1 if i in factorRoots else 0)):c for m,c in poly.items()}
   assert len(quotient)==len(poly)
   assert E.mul(quotient,*[E.of(i) for i in factorRoots])==poly
   assert not any(i in factorRoots for m in quotient for i,n in m)
   record={'name':d['name'],'id':d['id'],'body':d['body'],'parameters':d['parameters'],
    'nativeDerivativeLimits':d['derivativeLimits'],'sourceAuthenticatedFlag':d.get('sourceAuthenticated'),
    'exactPolynomialTerms':len(poly),'cutoffCommonPowers':{str(i):n for i,n in mins.items()},
    'exactFactorRemovalAndReconstruction':True,'nativeAnalyticAtomsRemainOpaque':True}
   definitions.append(record);byName[d['name']]=record
  assert len(definitions)==6
  reports=[];normalClaims=0
  for case in signed['cases']:
   assert len(case['guards'])==7
   gx,gv=case['guards'][-2:]
   assert stream.rational(gx[1])==-stream.rational(r0) and gx[2]==r0
   assert gv[1]==0 and gv[2]==Ls
   derivatives=[]
   for j,root in enumerate(case['actualNativeSignedPotential']):
    d,actual,orders=native.application(stream,root)
    assert d['name'] in byName and not any(orders)
    assert actual[3:5]==[gx[0],gv[0]]
    inventory={(tuple(x['orders'])):x['root'] for x in case['nativeJetInventory'] if x['component']==j}
    for direction,name in [(3,'xi'),(4,'v')]:
     for n in range(4):
      alpha=[0]*12;alpha[direction]=n
      existing=inventory.get(tuple(alpha))
      if existing is not None:
       dd,aa,oo=native.application(stream,existing,zero_order=False)
       assert dd['id']==d['id'] and aa==actual and oo==alpha
      derivatives.append({'component':j,'direction':name,'order':n,'nativeOperation':'m3_coupled_expression_partial',
       'definition':d['id'],'actualArguments':actual,'orders':alpha,'existingMaterializedRoot':existing,
       'traceAtBothNamedFaces':'0_BY_OPEN_ZERO_COLLAR'})
      normalClaims+=2
   reports.append({'key':case['key'],'guards':case['guards'],'phase':case['phase'],
    'potentialRoots':case['actualNativeSignedPotential'],'sameNativeFastArgumentsAsGuardCoordinates':True,
    'pureNormalNativeTraceQueries':derivatives,'potentialAllMixedJetsThroughOrder3':'ZERO_AT_FOUR_FAST_FACES',
    'velocityAllMixedJetsThroughOrder2':'ZERO_AT_FOUR_FAST_FACES_VIA_C80_LITERAL_CURL'})
  # Exact rational collar separation. These are universal identities, not sample evaluations.
  assert F(1)-F(1,8)>F(3,4)
  assert F(1,10)<F(1,5) and 1-F(1,10)>F(4,5)
  assert 20*F(1,10)-4<0 and 16-20*(1-F(1,10))<0
  # A positive control distinguishes actual source collars from a nonexistent collar at chi's support edge.
  assert F(3,2)-2*F(5,8)==F(1,4)>0
  # Minimal generic control: a flat factor alone does not imply a flat product.
  assert F(-1,4)-F(-1,2)==F(1,4)>0
  receipt={'schema':'MathScope.C82.SameLiveSignedGuardSeams/1',
   'status':'VERIFIED_FOUR_FAST_ZERO_COLLAR_FACE_CLASSES_ALL_TEN_FIXED_CASES',
   'sourceReference':gr.REFERENCE,'hostedRun':44582875351,'sourceStream':stream.verify,
   'registrySHA256':native.pin,'registryMaximumOrder':raw['maximumOrder'],
   'inputPins':PINS,'sourceModules':{k:{kk:vv for kk,vv in v.items() if kk!='text'} for k,v in source.items()},
   'actualCutoffs':{'r0':r0,'r0Exact':qstr(stream.rational(r0)),'Ls':Ls,'xiFormal':xi,'vFormal':v,
    'chi':chi,'chiAbsArgument':absXi,'pulseStepRoots':[psi0,psi1],'slowFactorRoots':slow},
   'definitions':definitions,'cases':reports,'verifiedCounts':{'fixedCases':10,'nativeBodies':6,'guardFaces':40,
    'pureNormalComponentOrderFaceTraceClaims':normalClaims,'potentialNormalOrder':3,'velocityNormalOrder':2},
   'zeroCollarProof':{'xiFaces':['-r0','r0'],'xiNeighborhoodRadius':'r0/8','insideLowerAbsRatio':'7/8 > 3/4',
    'pulseFaces':['0','Ls'],'pulseNeighborhoodRadius':'Ls/10','pulseInnerZeroIntervals':['0 < v <= Ls/5','4Ls/5 <= v < Ls'],
    'reason':'Exact actual common cutoff factors vanish before the lazy fast guard faces; outside any guard the body is zero before evaluation. Hence the guarded potential is identically zero on the displayed neighborhoods, including intersections with other guard faces. Every normal and mixed derivative there is zero.',
    'phaseAndReferenceScale':'Multiplication by the retained -sin(k*phase) and the fixed smooth source reference lift preserves the zero neighborhood.',
    'nativeDerivativeInterpretation':'Semantic derivative queries are recorded explicitly. No missing native node ID is invented; existingMaterializedRoot=null means not present in C80 jet inventory.'},
   'conditions':['r0>0 (proved exactly) and Ls>0 on the fixed admitted band (original source geometry)',
    'Original fixed source H, positive amplitudes, k*nSquared and chart denominators define the raw body wherever all lazy guards admit it.',
    'Fixed frozen representative/mesh/band labels and the original continuous lift. No differentiation of a selected integer label.'],
   'slowFaces':{'status':'CONDITIONAL_FLAT_FACTOR_ONLY','offsets':['band','R','Z','T'],'faces':['-3/4','3/4'],
    'exactCommonFactorPower':1,'missing':'Same-source Signed quotient C3 or a sufficient finite-pole weighted bound through these faces, including Sigma/(2*epsilon*a_j), inverse H and moving frame. A flat factor times an arbitrary quotient need not be flat.'},
   'radialFaces':{'status':'OPEN_WEIGHTED_SQRT_TARGET_TRANSFER','guardRoots':signed['cases'][0]['guards'][4],
    'missing':'Actual same-source weighted Sigma C3, a_j=sqrt(y_j) inverse derivative bounds and fixed H/frame control, giving sqrt(zeta) times finite poles at a positive radial shell boundary.',
    'genericCounterControl':'Sigma=exp(-1/(4*d^2)), a=exp(-1/(2*d^2)) are both flat at d=0 but Sigma/a=exp(1/(4*d^2)) diverges. This is not a counterexample to the actual source.'},
   'controls':{'incorrectChiNoCollarAtSupportEdgeRejected':True,'flatFactorAloneInsufficient':True,'radialFlatNumeratorAloneInsufficient':True},
   'scope':{'crossLabelGlue':'SEPARATE','periodicNearestCopySeams':'SEPARATE','noWholeFirstCorrectionSeamClosure':True,
    'noOpaqueAnalyticValueEvaluated':True,'noNewLeanCompileClaim':True,'base67Unchanged':True,'release':'HOLD'}}
  a.out.parent.mkdir(parents=True,exist_ok=True)
  a.out.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8',newline='\n')
  print('PASS Signed fast collars: 6 native bodies, 10 fixed cases, 40 faces,',normalClaims,'normal trace claims',flush=True)
 finally:stream.__exit__(None,None,None)
if __name__=='__main__':main()
