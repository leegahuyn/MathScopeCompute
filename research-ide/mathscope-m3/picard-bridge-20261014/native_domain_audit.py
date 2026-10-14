#!/usr/bin/env python3
"""Audit the authenticated original n=1 eta-Picard coefficient DAG.

Original source IDs/AST are preserved. We may certify just the actual
denominator L=1-2h*eta^2, if found, on a common complex eta stadium. This is
not a proof of holomorphy or boundedness for A0,A1,forcing as a whole.
"""
from __future__ import annotations
import argparse
from collections import Counter
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
from functools import lru_cache

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
sys.path.insert(0,str(REPO/'research-ide/mathscope-m3/certification-20261014'))
sys.path.insert(0,str(REPO/'research-ide/mathscope-m3/n6-unconditional-20261014'))
from source_dag import definitions,primitive_children,verify_capture
from analytic_prerequisites import SourceAudit, HEADER_SHA,DB_SHA,PAPER_SHA,PROTOTYPE_SHA,file_sha
from complex_polynomial_bounds import certify_inverse
from natural_series_audit import run as audit_natural_series

PARENT_SHA='7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
POLY_L={(0,0):F(1),(1,2):F(-2)}
ETA_RADIUS=F(1,4)
H_ABS_MAX=F(1,100)
ETA_ABS_MAX=F(1)+ETA_RADIUS
L_MAX_CORRECTION=2*H_ABS_MAX*ETA_ABS_MAX**2
L_LOWER=F(1)-L_MAX_CORRECTION
assert L_MAX_CORRECTION==F(1,32) and L_LOWER==F(31,32)

def require(c,msg):
    if not c:raise ValueError(msg)
def digest(obj):
    return hashlib.sha256(json.dumps(obj,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def add(a,b):
    out=dict(a)
    for k,v in b.items():out[k]=out.get(k,F(0))+v
    return {k:v for k,v in out.items() if v}
def mul(a,b):
    out={}
    for (h,e),x in a.items():
        for (i,j),y in b.items():
            if h+i>8 or e+j>12:raise ValueError('unsupported high-degree polynomial probe')
            k=(h+i,e+j);out[k]=out.get(k,F(0))+x*y
            if len(out)>100:raise ValueError('symbolic polynomial probe budget exceeded')
    return {k:v for k,v in out.items() if v}
def power(a,n):
    if not isinstance(n,int) or not (0<=n<=8):raise ValueError('unsupported polynomial power')
    out={(0,0):F(1)}
    for _ in range(n):out=mul(out,a)
    return out
def coeff_dict(poly):
    return {f"h^{a} eta^{b}":str(v) for (a,b),v in sorted(poly.items())}

def analyze(inputs, output):
    base=Path(inputs)/'mean-proof-inputs-38500114302/dag'
    head=base/'header.json';dbp=base/'source-dag-checkpoint.sqlite'
    require(file_sha(head)==HEADER_SHA and file_sha(dbp)==DB_SHA,'Pinned original native SQLite/header hash changed')
    prototype=REPO/'research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs'
    paper=REPO/'research-ide/reference-documents/ns-primary-20261013/navier-stokes.pdf'
    require(file_sha(prototype)==PROTOTYPE_SHA and file_sha(paper)==PAPER_SHA,'Pinned source or paper changed')
    capture=verify_capture(REPO)
    registries=definitions(json.loads(head.read_text(encoding='utf8')))
    system=registries['picard'][0]
    require(system['name']=='ActualSameN3OrderOneInner' and system['xi']==25516 and system['eta']==2,
            'Different original eta Picard system')
    db=sqlite3.connect(dbp.resolve().as_uri()+'?mode=ro',uri=True)
    @lru_cache(maxsize=100000)
    def node(i):
        require(type(i) is int and 0<=i<3892594,'Invalid scalar node index')
        row=db.execute('SELECT raw FROM nodes WHERE id=?',(i,)).fetchone()
        require(row is not None,'Incomplete source checkpoint at node '+str(i))
        return json.loads(row[0])
    audit=SourceAudit(node,system['xi'],system['eta'])
    groups={name:audit.closure(sum(system[name],[]) if name!='forcing' else system[name]) for name in ('A0','A1','forcing')}
    all_ids=set.union(*groups.values())
    calls=[]
    for i in sorted(all_ids):
        n=node(i)
        if n['op'] not in ('inverse','log_positive','sqrt_positive','actual_natural_series','actual_quadratic_root','actual_monotone_root'):continue
        a=n['args'];arg=a[0] if n['op'] not in ('actual_natural_series','actual_quadratic_root','actual_monotone_root') else a[1] if len(a)>1 and isinstance(a[1],int) else None
        calls.append({'sourceNode':i,'sourceNodeSHA256':digest(n),'operator':n['op'],'arguments':a,
                      'argumentSourceNode':arg,'etaDependent':2 in audit.free(i),
                      'inGroups':[name for name,ids in groups.items() if i in ids],
                      'nativeComplexDomainProvedByThisAudit':False})
    @lru_cache(maxsize=10000)
    def poly(i):
        n=node(i);op=n['op'];a=n['args']
        if op=='rational':
            if len(a)!=2:return None
            return {(0,0):F(int(a[0]),int(a[1]))}
        if op=='coordinate':
            return {(0,1):F(1)} if i==system['eta'] else None
        if op=='source_parameter':
            return {(1,0):F(1)} if a==['h'] else None
        if op=='add':
            p={}
            for j in a:
                q=poly(j)
                if q is None:return None
                p=add(p,q)
            return p
        if op=='multiply':
            p={(0,0):F(1)}
            for j in a:
                q=poly(j)
                if q is None:return None
                try:p=mul(p,q)
                except ValueError:return None
            return p
        if op=='integer_power':
            if len(a)!=2:return None
            q=poly(a[0])
            if q is None:return None
            try:return power(q,a[1])
            except ValueError:return None
        return None
    proven=[];other=[];inverse_leaves=[]
    for call in calls:
        if call['operator'] not in ('inverse','log_positive','sqrt_positive'):continue
        k=call['argumentSourceNode'];p=poly(k) if k is not None else None
        call['argumentExactPolynomialInHEta']=coeff_dict(p) if p is not None else None
        leaf=certify_inverse(p) if call['operator']=='inverse' else None
        if leaf is not None:
            call['nativeComplexDomainProvedByThisAudit']=True
            call['proofID']=leaf['proofID']
            inverse_leaves.append({'sourceNode':call['sourceNode'],
                                   'argumentSourceNode':k,
                                   'argumentExactPolynomialInHEta':coeff_dict(p), **leaf})
            if p==POLY_L:proven.append(call['sourceNode'])
        else:other.append(call['sourceNode'])
    require(len(all_ids)==3679 and len(calls)==216 and
            Counter(c['operator'] for c in calls)==Counter({'actual_natural_series':157,'inverse':33,'log_positive':21,'sqrt_positive':5}),
            'Authenticated Picard call inventory differs from the inherited frontier')
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    result={
       'schema':'MathScope.N6.PicardActualNativeDomainInventory/1',
       'source':{'sourceParentSHA256':PARENT_SHA,'headerSHA256':HEADER_SHA,'databaseSHA256':DB_SHA,
                 'paperSHA256':PAPER_SHA,'originalSourceFilesVerified':capture['count'],'picard':system['name'],
                 'xi':system['xi'],'eta':system['eta']},
       'actualRootCoefficientClosure':{'uniqueNodeCount':len(all_ids),'perGroupNodeCount':{k:len(v) for k,v in groups.items()},
                 'operatorCounts':dict(Counter(node(i)['op'] for i in all_ids))},
       'actualNativeCalls':calls,
       'nativeLRoot':{'formula':'1-2*h*eta^2','allFoundOriginalInverseNodes':proven,
            'domain':'complex eta with dist(eta,[-1,1])<1/4; real 0<h<1/100',
            'exactProof':'|eta|<5/4, |2 h eta^2|<1/32; hence |1-2 h eta^2|>31/32 and |(1-2h eta^2)^-1|<32/31',
            'sourceParameterHBoundIsHypothesis':True,
            'analyticallyValidForNativeInverseCalls':bool(proven)},
       'allOtherDenominatorOrLogCallsNeedingProof':other,
       'nativeComplexInverseLeaves':inverse_leaves,
       'candidateCommonComplexDomain':{
          'shape':'stadium', 'distanceToRealSegmentStrictUpper':'1/4',
          'realSegment':['-1','1'], 'allCoefficientCallsAdmitted':False,
          'enclosingDiskIsOnlyAnEnvelope':True,
          'enclosingDiskCannotBeUsedAsFullDomain':{
             'operand':'1+eta^2', 'poles':['i','-i'], 'poleAbs':'1',
             'diskRadius':'5/4', 'exactCounterexample':'eta=i gives 1+eta^2=0'}},
       'nativeA0A1ForcingCommonHolomorphicStripProved':False,
       'nativeA0A1ForcingUniformComplexSupNormProved':False,
       'sameProfileM2PicardNormTransferredToAllOriginalN6':False,
       'N6TotalGlobalGuardCountUnchanged':38,
       'N6RemainingJetsUnchanged':230,
       'N6ResidualPDETermsUnchanged':1020,
       'originalN601Complete':False,
       'originalN602Complete':False,
       'originalM3Status':'56/64'
    }
    natural=audit_natural_series(node,system,groups,all_ids,audit,result['source'],registries,repo=REPO)
    result['naturalSeriesFamilyInventory']=natural
    result['picardConvergence']=natural['picardConvergence']
    db.close()
    (output/'natural-series-inventory.json').write_text(json.dumps(natural,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    (output/'native-domain-inventory.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    concise={'coefficientClosureNodes':len(all_ids),'nativeOperatorCalls':len(calls),
             'nativePrimitiveInverseNodesCertifiedForL':len(proven),
             'nativeComplexInverseLeavesCertified':len(inverse_leaves),
             'naturalArgumentFamilies':natural['summary']['argumentFamilyCount'],
             'naturalProvedArgumentRanges':natural['summary']['exactArgumentDomainProvedCalls'],
             'naturalKernelHolomorphyProved':natural['summary']['actualKernelHolomorphyProvedCalls'],
             'otherInverseLogSqrtCalls':len(other),
             'etaDependentOpaqueCalls':sum(c['etaDependent'] for c in calls),
             'newGlobalGuardTotalOfficiallyClosed':0,'actualFullPicardNormCertified':False}
    print(json.dumps(concise))
    print(json.dumps({'L_inverse_nodes':proven,'L_bound':str(L_LOWER),'operatorSummary':dict(Counter(x['operator'] for x in calls))}))
    return result

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--inputs',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    a=p.parse_args()
    analyze(a.inputs,a.output)
if __name__=='__main__':main()
