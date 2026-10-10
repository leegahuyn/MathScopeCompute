#!/usr/bin/env python3
"""Independent exact polynomial integration of the ORIGINAL Omega equation.

Only the resulting integrals/jets are sent to the JS reduction. The Python
side does not integrate the reduced expression to manufacture its reference.
Actual pulse enclosures are separately recomputed using Fraction intervals.
"""
import argparse
import hashlib
import json
import subprocess
from fractions import Fraction as F
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
ORDER=2

def jc(x): return [F(x),F(0),F(0)]
def ja(*xs): return [sum((x[k] for x in xs),F(0)) for k in range(3)]
def jn(a): return [-x for x in a]
def js(a,b): return ja(a,jn(b))
def jm(*xs):
    r=jc(1)
    for a in xs: r=[sum((r[j]*a[k-j] for j in range(k+1)),F(0)) for k in range(3)]
    return r
def ji(a):
    r=[1/a[0],F(0),F(0)]
    for k in range(1,3): r[k]=-sum((a[j]*r[k-j] for j in range(1,k+1)),F(0))/a[0]
    return r
def je(a): return [a[1],2*a[2],F(0)]
def pc(x): return [jc(x)]
def trim(a):
    while len(a)>1 and all(x==0 for x in a[-1]): a.pop()
    return a
def pa(*xs): return trim([ja(*(a[k] if k<len(a) else jc(0) for a in xs)) for k in range(max(map(len,xs)))])
def pn(a): return [jn(x) for x in a]
def ps(a,b): return pa(a,pn(b))
def pm(*xs):
    r=pc(1)
    for a in xs:
        s=[jc(0) for _ in range(len(r)+len(a)-1)]
        for i,x in enumerate(r):
            for j,y in enumerate(a): s[i+j]=ja(s[i+j],jm(x,y))
        r=trim(s)
    return r
def pd(a): return trim([jm(jc(k),a[k]) for k in range(1,len(a))] or [jc(0)])
def pe(a): return trim([je(x) for x in a])
def pxdiv(a):
    assert all(x==0 for x in a[0]),'The purported regular radial quotient has an axis singularity.'
    return a[1:] or [jc(0)]
def pv(a,x):
    out=jc(0)
    for c in a[::-1]: out=ja(jm(out,jc(x)),c)
    return out
def pint(a,left=F(0),right=F(1)):
    return [sum((c[j]*(right**(k+1)-left**(k+1))/F(k+1) for k,c in enumerate(a)),F(0)) for j in range(3)]
def power(a,k): return pm(*([a]*k)) if k else pc(1)
def st(x): return str(F(x))

def original_field(h,eta):
    x=[jc(0),jc(1)];e=[F(eta),F(1),F(0)];ej=[e]
    A=ja(jc(F(1,2)),jc(h));D=js(jc(F(1,2)),jc(h));dd=js(jc(1),jm(e,e));L=js(jc(1),jm(jc(2),jc(h),e,e));iL=[ji(L)]
    # C^4 compact endpoint profile; all boundary terms used below exist.
    M=pm(x,power(ps(pc(1),x),5),pa(pc(1),ej,pm(ej,x),pm([jm(e,e)],x,x)))
    U=pd(M)
    V=pm(iL,ps(ps(pm(pc(2),ej,x,U),pm(pc(2),[D],ej,M)),pm([dd],pe(M))))
    T=pm(iL,pa(pm([D],ej,pe(V)),pm(x,pd(V))))
    Z=pm(iL,ps(pm([dd],pe(V)),pm(pc(2),ej,x,pd(V))))
    # Literal (5.6), BEFORE the integration-by-parts reduction.
    omega=pa(T,pm(V,ps(pd(V),pm(pc(F(1,2)),pxdiv(V)))),pm(U,Z),pn(pm(pc(2),x,pd(pd(V)))))
    return dict(x=x,e=e,D=D,A=A,dd=dd,L=L,U=U,M=M,V=V,omega=omega)

def reduction_inputs(f,left=F(0),right=F(1),axis=True):
    U,V=f['U'],f['V'];v=pxdiv(V);UV=pm(U,V)
    jminus=pint(v,left,right);jzero=pint(V,left,right);hminus=pint(pxdiv(UV),left,right);hzero=pint(UV,left,right)
    km2=pint(pm(v,v),left,right)[0];km1=pint(pm(f['x'],v,v),left,right)[0]
    return {'Jminus1Eta':st(jminus[1]),'Jzero':st(jzero[0]),'JzeroEta':st(jzero[1]),'Hminus1':st(hminus[0]),'Hminus1Eta':st(hminus[1]),'Hzero':st(hzero[0]),'HzeroEta':st(hzero[1]),'Kminus2':st(km2),'Kminus1':st(km1),'axisVX':st(pv(pd(V),0)[0] if axis else 0)}

def boundaries(f,x):
    U,V,VX=pv(f['U'],x)[0],pv(f['V'],x)[0],pv(pd(f['V']),x)[0];e=f['e'][0];L=f['L'][0]
    return V/(2*L)-e*U*V/L+V*V/(2*x)-VX, x*V/(2*L)-e*x*U*V/L+V*V/2-x*VX+V

def ia(a,b): return (a[0]+b[0],a[1]+b[1])
def inn(a): return (-a[1],-a[0])
def im(a,b):
    p=[x*y for x in a for y in b];return (min(p),max(p))
def ii(a):
    assert a[0]>0 or a[1]<0
    return (1/a[1],1/a[0])
def iv(x): return (F(x),F(x))
def isc(a,x): return im(a,iv(x))
def idv(a,b): return im(a,ii(b))

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,default=HERE/'actual-global-source-independent.json');args=ap.parse_args()
    integral_cases=[];jet_cases=[];references=[];jetrefs=[];negative=[]
    for h in [F(1,10),F(1,20),F(1,50)]:
        for eta in [F(1,3),F(0),F(-2,5)]:
            f=original_field(h,eta)
            for left,right,full in [(F(0),F(1),True),(F(1,4),F(3,4),False)]:
                row=reduction_inputs(f,left,right,axis=full);row.update(h=st(h),eta=st(eta));integral_cases.append(row)
                directP=pint(pxdiv(f['omega']),left,right)[0]/2;directF=pint(f['omega'],left,right)[0]/2
                bp=bf=F(0)
                if not full:
                    lo=boundaries(f,left);hi=boundaries(f,right);bp=hi[0]-lo[0];bf=hi[1]-lo[1]
                references.append((directP,directF,bp,bf))
                negative.append(bp!=0 or bf!=0 if not full else F(row['axisVX'])!=0)
            for X in [F(0),F(1,5),F(4,5)]:
                u=pv(f['U'],X);avg=pv(pxdiv(f['M']),X);v=pv(pxdiv(f['V']),X);uv=jm(u,v)
                jet_cases.append(dict(X=st(X),h=st(h),eta=st(eta),U=st(u[0]),Ueta=st(u[1]),average=st(avg[0]),averageEta=st(avg[1]),averageEtaEta=st(2*avg[2])))
                jetrefs.append(dict(v=v[0],vEta=v[1],Jminus1=v[0],Jminus1Eta=v[1],Jzero=X*v[0],JzeroEta=X*v[1],Hminus1=uv[0],Hminus1Eta=uv[1],Hzero=X*uv[0],HzeroEta=X*uv[1],Kminus2=v[0]*v[0],Kminus1=X*v[0]*v[0]))
    script="""
      import fs from 'node:fs';
      import {evaluateExactOmegaReducedMoments,evaluateExactRegularOmegaJet,actualOuterPulseObservations,actualGlobalSourceConstruction} from './research-ide/mathscope-m2/navier/actual-global-source.mjs';
      const input=JSON.parse(fs.readFileSync(0,'utf8'));
      console.log(JSON.stringify({integrals:input.integrals.map(evaluateExactOmegaReducedMoments),jets:input.jets.map(evaluateExactRegularOmegaJet),observations:[-1,-.25,0,.25,1].map(eta=>actualOuterPulseObservations({eta,xi:[.02,.5,1,5,10]})),construction:actualGlobalSourceConstruction()}));
    """
    proc=subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,input=json.dumps({'integrals':integral_cases,'jets':jet_cases}),text=True,capture_output=True,check=True)
    out=json.loads(proc.stdout);checks=[]
    def check(name,okay): checks.append({'name':name,'pass':bool(okay)})
    for i,(r,ref) in enumerate(zip(out['integrals'],references)):
        P,Fv,bp,bf=ref
        check(f'original_Omega_weighted_integrals_case_{i}',F(r['P'])+bp==P and F(r['F'])+bf==Fv)
        check(f'original_m3_m5_sign_case_{i}',F(r['globalPressureDebt'])==-F(r['P']) and F(r['globalFluxDebt'])==F(r['F']))
        check(f'boundary_omission_negative_case_{i}',negative[i])
    for i,(r,ref) in enumerate(zip(out['jets'],jetrefs)):
        check(f'exact_regular_integrands_and_eta_derivatives_{i}',all(F(r[k])==v for k,v in ref.items()))
    receipt_path=ROOT/'research-ide/mathscope-m1/navier/followup-20261010-outer-reselection/actual-main-pulse-integral.json';receipt=json.loads(receipt_path.read_text())
    q=receipt['uniformAmplitude']['bracket'];amp=(F(int(q['lowerNumerator']),2**88),F(int(q['upperNumerator']),2**88));tiny=F(1,2**1000);h=(F(0),tiny);lam=h;beta=ia(iv(F(1,2)),inn(lam));D=ia(iv(F(1,2)),inn(h))
    for obs in out['observations']:
        eta=F(obs['input']['eta']);e=iv(eta);e2=iv(eta*eta);L=ia(iv(1),inn(isc(im(h,e2),2)));dd=iv(1-eta*eta);jp=iv(2*eta/(1+eta*eta))
        for row in obs['rows']:
            xi=F.from_float(row['xi']);r0=iv(xi-F(1,100));R=im(amp,r0);m=ia(ia(idv(R,beta),inn(idv(im(lam,amp),im(beta,beta)))),(-tiny,tiny))
            v=idv(ia(ia(isc(im(e,R),2),inn(isc(im(im(D,e),m),2))),ia(im(im(dd,jp),m),inn(im(dd,(-tiny,tiny))))),L)
            for actual,ref in zip(row['values'],[R,m,v]):
                bounds=tuple(F.from_float(x) for x in actual['interval'])
                check(f'actual_pulse_interval_eta_{eta}_xi_{xi}_{actual["id"]}',bounds[0]<=ref[0]<=ref[1]<=bounds[1])
            check(f'actual_positive_coordinate_exact_{eta}_{xi}',F(row['xiExact'])==xi and row['XBinary64'] is None)
    c=out['construction'];check('whole_profile_not_fabricated',c['status']=='PARTIAL' and not c['scope']['actualFullMomentDebtsClosed'] and not c['scope']['N4_04_Complete'])
    check('C12_value_bound_not_eta_derivative_family',c['modulationRemainder']['uniformFinalBound']['etaDerivativeOrders']==[0] and not c['modulationRemainder']['scope']['functionalEtaDerivativeFamilyCertified'])
    check('all_huge_root_integrands_explicit',not any('oracle' in n['op'].lower() or 'unknown' in n['op'].lower() for n in c['outerProgram']['nodes']))
    failures=[x for x in checks if not x['pass']]
    sources=list((HERE.parent).glob('actual-global-source*.mjs'))+[Path(__file__),receipt_path]
    result={'schema':'MathScope.ActualGlobalSourceIndependentAudit/1','status':'PASS' if not failures else 'FAIL','pass':not failures,'passed':len(checks)-len(failures),'total':len(checks),'method':'Independent Fraction eta-Taylor polynomial algebra constructs literal original Omega, then integrates it exactly; separate Fraction interval recomputation of actual source pulse observations.','originalFullIntervalCases':9,'originalFixedSubintervalCases':9,'regularJetCases':27,'actualPulseObservationCoordinates':25,'negativeBoundaryCases':18,'sourceFiles':[{'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(sources)],'checks':checks,'failures':failures,'scope':{'sourceGlobalMomentValuesEvaluated':False,'originalCriterionPromoted':False,'newLeanProof':False}}
    args.output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['status','passed','total','originalFullIntervalCases','originalFixedSubintervalCases','regularJetCases','actualPulseObservationCoordinates','negativeBoundaryCases']}))
    if failures: raise SystemExit(1)

if __name__=='__main__': main()
