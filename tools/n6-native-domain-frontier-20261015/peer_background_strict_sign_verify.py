"""Independent exact checks for the source617375 constant reciprocal gate.

Checks the actual20-node fresh frontier and exercises the interval/sign
calculus on independently enumerated exact rational values. No row closure.
"""
import argparse,hashlib,itertools,json
from fractions import Fraction as F
from pathlib import Path
import actual_background_jet_regularity as b
from native_domain_extract import require,sha
from natural_domain_proof import source_parameter_proof,FIXED_PIN

HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'

def contains(box,value):
 return ((box.lo is None or box.lo<=value) and (box.hi is None or value<=box.hi)
         and (not box.strict_positive or value>0) and (not box.strict_negative or value<0))

def rational_enclosure_controls():
 values=list(map(F,[-8,-2,-1,0,1,2,8]))+[F(-1,2),F(1,2)]
 bounds=[None,F(-2),F(-1),F(0),F(1),F(2)]
 cases=[]
 for lo,hi,pos,neg in itertools.product(bounds,bounds,[False,True],[False,True]):
  try:box=b.Bound(lo,hi,pos,neg)
  except b.Gap:continue
  vv=[v for v in values if contains(box,v)]
  if vv:cases.append((box,vv))
 engine=b.ConstantDomains(lambda _:None,{})
 checks=0
 for (a,av),(c,cv) in itertools.product(cases,repeat=2):
  for op in ['add','multiply','maximum']:
   try:out=engine.operation(op,[a,c])
   except b.Gap:continue # conservative rejection cannot prove a false sign
   for x,y in itertools.product(av,cv):
    value=x+y if op=='add' else x*y if op=='multiply' else max(x,y)
    require(contains(out,value),'False exact enclosure/sign '+str((op,a,c,out,x,y)))
    checks+=1
 for a,av in cases:
  for op,n in [('inverse',None),('integer_power',2),('integer_power',3),('integer_power',-2)]:
   try:out=engine.operation(op,[a],n)
   except b.Gap:continue
   for x in av:
    if not x and (op=='inverse' or n<0):raise ValueError('Accepted exact zero reciprocal')
    value=1/x if op=='inverse' else x**n
    require(contains(out,value),'False unary exact enclosure/sign '+str((op,n,a,out,x)))
    checks+=1
 return {'exactRationalAssertions':checks,'distinctEnclosureCases':len(cases)}

def main():
 p=argparse.ArgumentParser(description=__doc__)
 for n in ['background','payload','out']:p.add_argument('--'+n,type=Path,required=True)
 a=p.parse_args();D=json.loads(a.background.read_text(encoding='utf8'));P=json.loads(a.payload.read_text(encoding='utf8'))
 require(D['sourceHeaderBinding']['sourceHeaderRecordSHA256']==HEADER and D['fixedDefinitionSHA256']==FIXED_PIN,'Different original source')
 fixed=P['fullNativePayloads']['fixed'];require(sha(fixed)==FIXED_PIN,'Different original full fixed payload')
 source_parameter_proof(fixed);params=fixed['source']['parametersExactExpressions']
 require(params['directionalMarginKappa']=={'power':[{'ref':'C12EnvelopeR'},-10]},'Changed original kappa')
 require(params['C12EnvelopeR']=={'exp':{'power':[{'ref':'sourceEnvelopeS'},256]}},'Changed original R')
 frontier=D['unprovedPrimitiveFrontier'];require(frontier['coneComplete'] and frontier['unexpandedFrontier']==[],'Incomplete actual frontier')
 nodes={int(i):n for i,n in frontier['smallOriginalPrimitiveCone'].items()}
 def n(op,*aa):return {'op':op,'args':list(aa)}
 expected={617375:n('inverse',617372),617372:n('multiply',20,617371),
  617371:n('maximum',617369,617369,617370,617370),617370:n('multiply',20,617368),
  617368:n('multiply',617299,617366),617366:n('integer_power',216823,10),
  216823:n('source_parameter','C12EnvelopeR'),617299:n('sqrt_positive',617298),
  617298:n('add',1,617297),617297:n('integer_power',617291,2),
  617291:n('multiply',24,617290),617290:n('inverse',617289),
  617289:n('source_parameter','directionalMarginKappa'),24:n('rational','2','1'),
  1:n('rational','1','1'),20:n('rational','-1','1'),617369:n('multiply',20,617367),
  617367:n('multiply',617299,617365),617365:n('integer_power',617294,6),617294:n('inverse',216823)}
 require(nodes==expected,'Changed exact original20-node reciprocal cone')
 engine=b.ConstantDomains(nodes.__getitem__,params)
 denominator=engine.at(617372);reciprocal=engine.at(617375)
 require(denominator.strict_positive and reciprocal.strict_positive,'Actual constant positive reciprocal not established')
 require(engine.at(617371).strict_negative,'Actual maximum negative sign was lost')
 # Explicitly keeping an exact zero as a possible maximizing operand must
 # block the reciprocal: -max(-positive,0)=0.
 bad=dict(nodes);bad[617371]=n('maximum',617369,617370,9000000);bad[9000000]=n('rational','0','1')
 try:b.ConstantDomains(bad.__getitem__,params).at(617375)
 except b.Gap:zero_rejected=True
 else:zero_rejected=False
 require(zero_rejected,'A true zero maximum was promoted to a reciprocal')
 report={'schema':'MathScope.N6.BackgroundStrictSignIndependentVerification/1',
  'inputSHA256':{k:hashlib.sha256(getattr(a,k).read_bytes()).hexdigest() for k in ['background','payload']},
  'reviewedImplementationSHA256':hashlib.sha256(Path(b.__file__).read_bytes()).hexdigest(),
  'exactActualSourceNode':617375,'exactActualSourceConeNodes':20,'actualDenominatorStrictlyPositive':True,
  'actualReciprocalStrictlyPositive':True,'zeroOperandMutationRejected':zero_rejected,
  'sourceFormula':'B=sqrt(1+(2/kappa)^2)>1, R=exp(S^256)>1, kappa=R^-10>0; -max(-B/R^6,-B*R^10)=B/R^6>0; reciprocal=R^6/B.',
  **rational_enclosure_controls(),'wholeBackgroundFreshReplayPerformedHere':False,'newOriginalRowsDischargedHere':0}
 a.out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':main()
