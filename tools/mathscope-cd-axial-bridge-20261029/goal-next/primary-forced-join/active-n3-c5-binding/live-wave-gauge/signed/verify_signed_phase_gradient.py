"""Compare actual Signed leading coefficients with the same literal phase gradient."""
from argparse import ArgumentParser
from functools import lru_cache
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json,sys
if not __debug__:raise RuntimeError('Exact assertions must remain enabled.')
def main():
 cli=ArgumentParser(description=__doc__)
 for name in ('goal','work','cache','signed','out'):cli.add_argument('--'+name,type=Path,required=True)
 a=cli.parse_args();base=a.goal/'primary-forced-join/active-n3-c5-binding/spatial-readback'
 assert sha256((base/'source_stream.py').read_bytes()).hexdigest()=='2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb'
 assert sha256((a.goal/'first-force-repair/verify_repaired_first_force.py').read_bytes()).hexdigest()=='260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75'
 sys.path[:0]=[str(Path(__file__).parent),str(base),str(a.goal/'first-force-repair')]
 import source_stream as reader
 import verify_repaired_first_force as exact
 from source_cache import prepare
 packetBytes=a.signed.read_bytes();packet=json.loads(packetBytes)
 assert sha256(packetBytes).hexdigest()=='7e494388cecfb1cdfa8c22732491063135af4947ee9b667f37f0ce25d4604aec'
 assert packet['hostedRun']==44582875351 and len(packet['cases'])==10 and packet['rows']==162
 assert packet['actualOperands']=={'k':17732747,'epsilon':17732744,'localRadialFast':17735155,'commonReferenceRadialFast':17745446,'representative':[17733951,17733956,17733936]}
 directory=a.work/'continuation70/hosted-44582875351/first-correction-spatial-source'
 manifest,_=reader.read(directory/reader.MANIFEST);native=reader.Native(directory,manifest)
 assert native.pin==packet['registrySHA256']
 assert manifest['node_stream_sha256']==packet['sourceStream']['sha256']
 stream=prepare(reader,directory,manifest,22153782,a.cache)
 class View:
  def record(self,i):return stream.record(i)
  def node(self,i):
   r=self.record(i);return r['op'],r['args']
  def args(self,i,op):return stream.args(i,op)
 g=View();alg=exact.Exact(g)
 core=json.loads(native.base_snapshot['base']['expression'])
 aux=json.loads(native.base_snapshot['expressionDefinitions'])
 coupled={r['id']:r for r in native.expressions}
 print('phase native catalogues',len(core),len(aux),len(coupled),flush=True)
 def definition(op,key):
  if op=='actual_expression_partial':return core[key]
  if op=='m3_aux_expression_partial':return aux[key]
  if op=='m3_coupled_expression_partial':return coupled[key]
  raise ValueError('Unsupported phase native definition '+op)
 def cross(x,y):
  return [alg.sub(alg.mul(x[1],y[2]),alg.mul(x[2],y[1])),
   alg.sub(alg.mul(x[2],y[0]),alg.mul(x[0],y[2])),
   alg.sub(alg.mul(x[0],y[1]),alg.mul(x[1],y[0]))]
 reports=[]
 try:
  for row in packet['cases']:
   phase=row['phase'];coeff=row['actualVelocityCoefficients'];pot=row['actualNativeSignedPotential']
   owner=next(x for x in native.expressions if x['name']=='GenericSigned162_velocity_0_own_'+('0' if row['key'].endswith(':1') else '1'))
   R,Z,T=owner['parameters'][:3];theta=owner['parameters'][-2]
   assert R==17732748 and Z==17732749 and theta==17732752
   xi,v=row['guards'][-2][0],row['guards'][-1][0]
   frozen=(set(owner['parameters'])-{R,Z,T,theta})|set(packet['actualOperands']['representative'])|{xi,v}
   frozen-={R,Z,T,theta}
   # Only the arithmetic envelope of phase and leading coefficients is needed.
   # Analytic native calls are kept opaque with their registered actual arguments.
   todo=[phase,*[c['real'] for c in coeff]];seen=set();lookup={};counts={}
   while todo:
    i=todo.pop()
    if i in seen:continue
    seen.add(i);assert len(seen)<=250000,'phase arithmetic envelope budget'
    op,args=g.node(i);counts[op]=counts.get(op,0)+1
    if op.endswith('_partial') and len(args)==3 and isinstance(args[2],list):
     key=(op,args[0],tuple(args[1]),tuple(args[2]))
     assert lookup.setdefault(key,i)==i,('duplicate exact native app',i,key)
     continue
    if i in frozen:continue
    if op in ('add','multiply','inverse','integer_power'):todo.extend(args[:1] if op in ('inverse','integer_power') else args)
    # Other analytic atoms are handled lazily only if differentiated.
   requested=[]
   @lru_cache(maxsize=200000)
   def D(i,axis):
    if i==axis:return alg.one
    if i in frozen:return alg.zero
    op,args=g.node(i)
    if op in ('rational','source_parameter','coordinate'):return alg.zero
    if op=='add':return alg.add(*(D(j,axis) for j in args))
    if op=='multiply':
     return alg.add(*(alg.mul(D(j,axis),*(alg.of(k) for p,k in enumerate(args) if p!=q)) for q,j in enumerate(args)))
    if op=='inverse':return alg.neg(alg.mul(D(args[0],axis),alg.pow(alg.of(args[0]),-2)))
    if op=='integer_power':return alg.mul(alg.scalar(args[1]),alg.pow(alg.of(args[0]),args[1]-1),D(args[0],axis))
    if op in ('exp','log_positive','sqrt_positive'):
     d=D(args[0],axis)
     if not d:return d
     if op=='exp':return alg.mul(alg.of(i),d)
     if op=='log_positive':return alg.mul(d,alg.inv(alg.of(args[0])))
     return alg.mul(alg.scalar(Fraction(1,2)),d,alg.inv(alg.of(i)))
    if op.endswith('_partial') and len(args)==3:
     system,actual,orders=args;defn=definition(op,system)
     parameters=defn['parameters'];directions=defn.get('directions',parameters)
     assert len(parameters)==len(actual) and len(directions)==len(orders)
     terms=[]
     for j,operand in enumerate(actual):
      d=D(operand,axis)
      if not d:continue
      assert parameters[j] in directions,('nonfrozen excluded native direction',i,j)
      raised=list(orders);raised[directions.index(parameters[j])]+=1
      key=(op,system,tuple(actual),tuple(raised))
      assert key in lookup,('missing actual native phase jet',i,axis,key)
      target=lookup[key];requested.append({'source':i,'axis':axis,'actualJet':target,'orders':raised})
      terms.append(alg.mul(d,alg.of(target)))
     return alg.add(*terms)
    # Discrete labels and other opaque closed atoms may only be constant.
    children=list(exact.Graph.children(op,args))
    ds=[D(j,axis) for j in children]
    if not any(ds):return alg.zero
    raise ValueError(('unsupported nonconstant phase operand',i,op,axis))
   n=[alg.add(D(phase,R),alg.mul(alg.of(17735155),D(phase,xi))),
      alg.mul(alg.inv(alg.of(R)),D(phase,theta)),alg.mul(alg.of(17732744),D(phase,Z))]
   expected=[alg.neg(alg.mul(alg.scalar(Fraction(1,2)),alg.of(17732747),t)) for t in cross(n,[alg.of(i) for i in pot])]
   for j,(c,want) in enumerate(zip(coeff,expected,strict=True)):
    actual=alg.of(c['real']);delta=alg.sub(actual,want)
    assert not delta,(row['key'],j,'literal phase-gradient leading mismatch',delta)
   assert not D(phase,xi),'Signed actual own phase must have no independent xi dependence'
   reports.append({'key':row['key'],'phase':phase,'sameLiteralPhaseGradientLeadingComponents':3,
    'phaseEnvelopeNodes':len(seen),'sourceOperandHistogram':counts,'actualPhaseNativeJets':requested,
    'localPhysicalOperators':{'Dr':'partial_R+node17735155*partial_xi','Dz':'node17732744*partial_Z','Dtheta':'partial_theta/R'},
    'frozenActualRepresentative':packet['actualOperands']['representative'],'actualPulseAndXi':[xi,v]})
   print('phase leading PASS',row['key'],len(seen),len(requested),flush=True)
   exact.Exact.of.cache_clear()
  result={'schema':'MathScope.C80.SameLiveSignedLiteralPhaseGradient/1','status':'PASS_ACTUAL_SIGNED_LEADING_IS_CURL_OF_SAME_LITERAL_PHASE',
   'hostedRun':44582875351,'signedReceiptSHA256':sha256(packetBytes).hexdigest(),'sourceStreamSHA256':manifest['node_stream_sha256'],
   'cases':reports,'phaseLeadingComparisons':30,'noNearestLabelOrRepresentativeDerivative':True,
   'outerOwnReferenceRadialFastJoin':'SEPARATE','release':'HOLD'}
  a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
 finally:stream.__exit__(None,None,None)
if __name__=='__main__':main()
