"""Actual flat-step prototype: global real existence and every fixed derivative.

The proof is classical induction, not finite tests promoted to an all-order
claim. Exact recurrence replay and actual source signatures authenticate its
binding. Finiteness/smoothness of each composed argument is still separate.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
SOURCE='research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs'
SOURCE_SHA='cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3'

def next_laurent(poly):
    # d_x[P(1/x) exp(-1/x^2)] = [2 y^3 P(y)-y^2 P'(y)] exp(-y^2).
    out={}
    for degree,coefficient in poly.items():
        out[degree+3]=out.get(degree+3,0)+2*coefficient
        if degree:out[degree+1]=out.get(degree+1,0)-degree*coefficient
    return {k:v for k,v in out.items() if v}

def step_calls(rows):
    for row in rows:
        node=row['node']
        if node['op']!='source_step_derivative' or len(node['args'])!=2:
            raise ValueError('Actual step signature changed')
        arg,order=node['args']
        if not isinstance(arg,int) or arg<0 or not isinstance(order,int) or not 0<=order<=12:
            raise ValueError('Actual step argument or finite source order changed')
    return [{'sourceNode':r['sourceNode'],'argumentSourceNode':r['node']['args'][0],'ordinaryDerivativeOrder':r['node']['args'][1],
             'primitiveGlobalRealDomainProved':True,'composedArgumentGloballyFiniteAndSmoothProved':False} for r in rows]

def run(mean_output,output):
    raw=(REPO/SOURCE).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=SOURCE_SHA:raise ValueError('Actual source step body changed')
    mean_path=mean_output/'mean-capture-result.json';mean_raw=mean_path.read_bytes();mean=json.loads(mean_raw)
    if not mean['scope']['freshBinderCaptureAbsenceProved'] or mean['source']['completeParentSnapshotNodeSHA256']!='7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f':
        raise ValueError('Wrong actual mean domain inventory')
    inventory=mean['domainInventory']['source_step_derivative'];calls=step_calls(inventory['rows'])
    if len(calls)!=inventory['count'] or len(calls)!=529:raise ValueError('Incomplete actual step inventory')
    polys=[{0:1}]
    for n in range(1,13):
        polys.append(next_laurent(polys[-1]))
        if max(polys[-1])!=3*n or polys[-1][3*n]!=2**n:raise ValueError('Flat exponential derivative recurrence failed')
    result={'schema':'MathScope.N6.GlobalFlatStepAnalyticLemma/1','source':{'path':SOURCE,'sha256':SOURCE_SHA,'meanInventorySHA256':hashlib.sha256(mean_raw).hexdigest()},
      'actualStepCalls':calls,'ordinaryOrdersPresent':sorted({x['ordinaryDerivativeOrder'] for x in calls}),
      'function':'sigma(t)=f(t)/(f(t)+f(1-t)), f(t)=exp(-1/t^2) for t>0 and f(t)=0 for t<=0',
      'globalDomain':'All finite real t',
      'classicalProof':{
        'allFixedOrders':'P_0(y)=1; P_(n+1)(y)=2y^3 P_n(y)-y^2 P_nprime(y). Induction gives f^(n)(t)=P_n(1/t) exp(-1/t^2) for every n and t>0.',
        'flatExtension':'Every P_n is a finite polynomial. For each term y^k choose integer N>k/2; exp(y^2)>=y^(2N)/N! implies y^k exp(-y^2)<=N! y^(k-2N)->0. Every right derivative tends to zero at t=0. Inductively gluing the zero left branch gives f in C-infinity(R).',
        'denominator':'For 0<=t<=1, either t>=1/2 or 1-t>=1/2, so f(t)+f(1-t)>=exp(-4)>0. For t<0, f(1-t)>0; for t>1, f(t)>0. Thus the quotient exists and is C-infinity everywhere.',
        'support':'sigma=0 for t<=0 and sigma=1 for t>=1. Every positive-order derivative vanishes outside [0,1] and at both endpoints.',
        'fixedOrderBounds':'Each sigma^(n) is continuous on compact [0,1] and zero outside it for n>=1, hence a finite global supremum B_n exists. B_0=1. All orders use the same entire real domain.',
        'actualOperator':'The pinned source step(a,n) emits the nth ordinary derivative of this same flat step; its diagnostic implementation uses the equivalent logistic exp((1-t)^(-2)-t^(-2)) and exact constant extensions.',
        'composition':'For any C-infinity finite-real source argument a on an open domain, sigma^(n)(a) is C-infinity there by ordinary chain rule. This theorem adds no new pole or endpoint condition.'},
      'finiteExactRecurrenceReplay':[{str(k):str(v) for k,v in sorted(p.items())} for p in polys],
      'scope':{'prototypeGlobalExistenceProved':True,'prototypeAllOrderSmoothnessProved':True,'prototypeUniformInRealArgumentForEachFixedOrderProved':True,
        'all529ComposedArgumentsGloballyWellDefinedProved':False,'all2540ArbitraryPiecewiseJoinsProved':False,'sourceClassScalingBoundsProved':False,
        'originalN601Complete':False,'originalN602Complete':False},
      'remaining':'Actual source arguments, affine widths, inherited implicit/background domains, and non-step piecewise joins still require source-bound proofs. Compiler order limits remain resource limits and are not top derivatives set to zero.'}
    output.mkdir(parents=True,exist_ok=True)
    (output/'analytic-primitives.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'primitiveGlobalRealDomainProved':True,'prototypeAllFixedDerivativeOrdersProved':True,'boundActualStepCalls':len(calls),'allSourceArgumentsProved':False}))
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--mean-output',required=True,type=Path);p.add_argument('--output',required=True,type=Path);a=p.parse_args();run(a.mean_output,a.output)
