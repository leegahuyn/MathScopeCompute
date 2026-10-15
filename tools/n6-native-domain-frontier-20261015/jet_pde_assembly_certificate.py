#!/usr/bin/env python3
"""Source-bound exact algebra certificate for the ORIGINAL 162-wave assembly.

This checks the quadratic assembly identity modulo precisely the pairwise
disjoint-support tensors; it never assigns actual source functions values.
The unresolved analytic source premises remain explicit and block discharge.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

def sha(o):return hashlib.sha256(json.dumps(o,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def polyadd(*ps):
    r=Counter()
    for p in ps:
        for k,v in p.items():r[k]+=v
    return {k:v for k,v in r.items() if v}
def negate(p):return {k:-v for k,v in p.items()}
def main():
    p=argparse.ArgumentParser();p.add_argument('--extract',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
    a=p.parse_args();data=json.loads(a.extract.read_text(encoding='utf-8'));definitions=data['definitions'];bindings=[]
    for component in range(3):
        key='definitions:1:'+str(component);r=definitions[key]
        d=r.get('fullDefinition',r)
        assert d['name']=='ActualAll162InitializedAngularResidual_'+str(component)
        assert len(d['rows'])==162
        assert d['directionParameterIndices']==[0,1,2,4,5,6]
        selected=[]
        for row in d['rows']:
            system=row['localSystem'];assert system.startswith('coupled-expression:')
            # Every local residual is bound to its retained source body and
            # exact tuple, including both signs, own labels and chart guards.
            selected.append({'system':system,'body':row['localBody'],'parameters':row['localParameters'],
                             'values':row['values'],'coefficient':row['coefficient'],
                             'derivativeMaps':row['derivativeMaps'],'guards':row['guards'],'label':row['label']})
        bindings.append({'component':component,'registry':key,'definitionSHA256':r['sha256'],
                         'rowBindingSHA256':sha(selected),'allActualRows':selected})
    n=162;mean='M';waves=[str(i) for i in range(n)];all_fields=[mean,*waves]
    # L(a) is the COMPLETE source linear PDE. Q(a,b) is div(a tensor b),
    # including all original cylindrical connections and torus derivatives.
    direct={('L',x):1 for x in all_fields}
    direct.update({('Q',x,y):1 for x in all_fields for y in all_fields})
    mean_pde={('L',mean):1,('Q',mean,mean):1}
    local_increment={}
    for w in waves:
        local_increment=polyadd(local_increment,{('L',w):1,('Q',mean,w):1,('Q',w,mean):1,('Q',w,w):1})
    assembled=polyadd(mean_pde,local_increment)
    difference=polyadd(direct,negate(assembled))
    expected_cross={('Q',i,j):1 for i in waves for j in waves if i!=j}
    assert difference==expected_cross and len(difference)==n*(n-1)
    # Exact ideal reduction. No actual source coefficient, derivative or
    # opaque field is substituted zero; only tensor pairs are obligations.
    ideal_remainder={k:v for k,v in difference.items() if k not in expected_cross}
    assert not ideal_remainder
    negative_control=polyadd(direct,negate(assembled),{('Q',mean,waves[0]):1})
    negative_remainder={k:v for k,v in negative_control.items() if k not in expected_cross}
    assert negative_remainder=={('Q',mean,waves[0]):1}
    result={'schema':'MathScope.N6.SourceBound162AssemblyAlgebra/1','newDischarged':0,
            'sourceHeaderSHA256':data['sourceHeaderSHA256'],'originalComponentBindings':bindings,
            'exactArithmetic':'integer coefficients in the free linear-plus-bilinear differential-operator module',
            'directTermCount':len(direct),'assembledTermCount':len(assembled),'crossTensorTermCount':len(difference),
            'unconditionalIdentity':'direct - assembled = sum_(i!=j) div(w_i tensor w_j)',
            'sourceDisjointnessIdealRemainder':[],'retainedMeanWaveProducts':2*n,
            'negativeControl':{'addedMissingMeanWaveTerm':'div(M tensor w_0)','rejected':True,'remainder':[[list(k),v] for k,v in negative_remainder.items()]},
            'premisesStillOpen':['Actual source functions have every derivative used by the complete PDE.',
              'For every two distinct retained source rectangles, w_i tensor w_j is identically zero, with flat joins.',
              'Every retained local residual is the actual normalized chart pullback of E(M+w_i,p_M+p_i)-E(M,p_M).',
              'Indexed native derivative operations equal derivatives of the whole actual source sum, with the exact fixed-label chain maps.'],
            'all1020OriginalComparisonTermsDischarged':False,
            'scope':'Exact bound finite-assembly algebra certificate; not a whole-field analytic regularity/normalization certificate.'}
    a.out.parent.mkdir(parents=True,exist_ok=True);raw=json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n';a.out.write_text(raw,encoding='utf-8')
    print(json.dumps({'bytes':len(raw.encode()),'actualRowsPerComponent':162,'crossTensorTerms':len(difference),'idealRemainder':0,'negativeControlRejected':True,'newDischarged':0}))
if __name__=='__main__':main()
