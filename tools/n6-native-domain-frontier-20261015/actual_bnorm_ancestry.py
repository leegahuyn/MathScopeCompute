"""Identify the actual Bnorm used in both original covariance normUpper ASTs.

This is a complete source-ancestry inventory, not approval of quantitative
norm metadata. It never replaces Bnorm by a newly chosen finite constant.
"""
import argparse,hashlib,importlib.util,json,collections,os
from pathlib import Path
def canonical(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def need(v,m):
 if not v:raise ValueError(m)
def main():
 p=argparse.ArgumentParser(description=__doc__)
 for k in ('source-db','stage3','header','compact','out'):p.add_argument('--'+k,type=Path,required=True)
 a=p.parse_args();need(hashlib.sha256(a.stage3.read_bytes()).hexdigest()=='388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f','Original cache reader')
 spec=importlib.util.spec_from_file_location('actual_bnorm_original_v3',a.stage3);v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
 g=v3.Source(a.source_db);raw=a.header.read_bytes();H=json.loads(raw);C=json.loads(a.compact.read_text(encoding='utf8'))
 need(hashlib.sha256(raw).hexdigest()==C['sourceHeaderSHA256'],'Same original header');reg=v3.registries(H)
 def flatten(i,op):
  n=g(i)
  return sum((flatten(j,op) for j in n['args']),[]) if n['op']==op else [i]
 bindings=[];roots=[]
 for covariance in (0,1):
  s=next(x for x in reg['m3GlobalPulses'] if x['covariance']==covariance)
  need(s==C['definitions']['covariance:'+str(covariance)]['fullDefinition'],'Same actual covariance')
  d=json.loads(s['originalDefinition']);factors=flatten(d['normUpper'],'multiply')
  candidates=[i for i in factors if g(i)['op']=='integer_power' and g(i)['args'][1]==256]
  need(len(factors)==3 and len(candidates)==1,'Original normUpper Bnorm^256*(1+k)^8*(1+Ls)^8')
  Bnorm=g(candidates[0])['args'][0];roots.append(Bnorm)
  other=[i for i in factors if i!=candidates[0]]
  need(all(g(i)['op']=='integer_power' and g(i)['args'][1]==8 for i in other),'Original remaining eighth powers')
  length_factor=[i for i in other if any(j==s['length'] for j in flatten(g(i)['args'][0],'add'))]
  need(len(length_factor)==1,'Original actual Ls factor')
  bindings.append({'covariance':covariance,'definitionSHA256':hashlib.sha256(canonical(s)).hexdigest(),'normUpper':d['normUpper'],
   'normUpperNode':g(d['normUpper']),'Bnorm':Bnorm,'BnormPower':candidates[0],'otherNormFactors':[{str(i):g(i)} for i in other]})
 need(len(set(roots))==1,'Both actual pulses must use the SAME original Bnorm')
 root=roots[0];seen=set();todo=[root];ops=collections.Counter();parameters=set();coordinates=[];native=[];integrals=[];sample={};digest=hashlib.sha256()
 unary={'inverse','sqrt_positive','log_positive','exp','integer_power','source_step_derivative','sine','cosine','ceiling'}
 while todo:
  i=todo.pop()
  if i in seen:continue
  seen.add(i);need(len(seen)<=250000,'Explicit remote Bnorm ancestry budget exceeded')
  n=g(i);op=n['op'];aa=n['args'];ops[op]+=1;digest.update(canonical([i,n]));digest.update(b'\n')
  if len(sample)<80:sample[str(i)]=n
  if op=='source_parameter':parameters.add(aa[0])
  elif op=='coordinate':coordinates.append(i)
  elif op=='rational':pass
  elif op in unary:todo.extend(aa[:1])
  elif op in ('add','multiply','maximum','smooth_piecewise'):todo.extend(aa)
  elif op=='definite_integral':integrals.append({'root':i,'node':n});todo.extend(aa)
  else:native.append({'root':i,'node':n})
 need(not coordinates or integrals,'Unexpected unbound coordinate in a primitive-only original Bnorm cone')
 result={'schema':'MathScope.N6.ActualBnormAncestry/1','executionRun':os.environ.get('GITHUB_RUN_ID'),'sourceHeaderSHA256':C['sourceHeaderSHA256'],
  'actualPulseBindings':bindings,'originalBnormRoot':root,'originalBnormNode':g(root),'sourceAncestorNodes':len(seen),'completeTraversalSHA256':digest.hexdigest(),
  'operationCounts':dict(ops),'sourceParameters':sorted(parameters),'observedCoordinateNodes':coordinates,'explicitIntegralAncestors':integrals,'nativeFrontiers':native,'topSourceNodes':sample,
  'purePrimitiveSourceArithmetic':not native and not integrals and not coordinates,'ancestryInventoryOnly':True,'actualBnormBoundsBackgroundJetsProvedHere':False,
  'headerTopLevelKeys':list(H),'thresholdDefinitionScope':'Original threshold/window formulas are in actual-common-admissible-family.mjs and global-source-index.mjs. A source-only finite Bnorm value is not by itself a proof that its quantitative bound holds.',
  'requiredNextMinimumProof':['Original Picard0 B/C1/solutionNorm and finite ordinary-X recurrence used in the n1 coefficient norm.','Actual global leading finite-jet majorants feeding that recurrence, with true root derivative floors.','Original window membership ell>=ell0 and actual target/matrix-error estimates.'],
  'wholeGOnJProved':False,'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps({'actualBnormRoot':root,'sourceAncestors':len(seen),'primitiveArithmeticOnly':result['purePrimitiveSourceArithmetic'],'actualBnormBoundPromoted':False,'newOriginalDischarged':0}))
if __name__=='__main__':main()
