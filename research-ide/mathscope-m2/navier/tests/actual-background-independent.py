#!/usr/bin/env python3
"""Independent Fraction Taylor solver for (5.2)--(5.6), including order zero.

The production leading generator uses normalized B.14/B.15.  This oracle
instead solves the unnormalized physical coefficient PDE directly.  The
rational test datum checks the algorithm and is never called the pinned N3
profile.  Actual source observations are independently checked separately.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import subprocess
from fractions import Fraction as F
from pathlib import Path

ROOT=Path(__file__).resolve().parents[4]
HERE=Path(__file__).resolve().parent
M=16
checks=[]
def check(name,value):
    checks.append({'id':name,'pass':bool(value)})
    if not value: raise AssertionError(name)

def p(x=0):return [F(x)]+[F(0)]*M
def add(*a):return [sum((v[k] for v in a),F(0)) for k in range(M+1)]
def sc(a,s):return [x*s for x in a]
def mul(a,b):return [sum((a[k]*b[n-k] for k in range(n+1)),F(0)) for n in range(M+1)]
def inv(a):
    out=p(1/a[0])
    for n in range(1,M+1):out[n]=-sum((a[k]*out[n-k] for k in range(1,n+1)),F(0))/a[0]
    return out
def de(a):return [(k+1)*a[k+1] for k in range(M)]+[F(0)]
def cv(a,b,n):return add(*(mul(a[k] if k<len(a) else p(),b[n-k] if n-k<len(b) else p()) for k in range(n+1)))

h,j,lam,sigma,amp=F(1,20),F(1,5),F(9),F(1,50),F(1,5)
eta=p();eta[1]=F(1)
A=F(1,2)+h;D=F(1,2)-h
dd=add(p(1),sc(mul(eta,eta),-1));L=add(p(1),sc(mul(eta,eta),-2*h));iL=inv(L)
Us=add(sc(eta,4),p(j));H=add(sc(eta,D),mul(dd,Us));den=add(mul(H,H),p(sigma*sigma))
zeta=sc(mul(mul(L,H),inv(den)),-1)
g=p(amp)
for n in range(M):g[n+1]=lam*sum((zeta[k]*g[n-k] for k in range(n+1)),F(0))/(n+1)
pressureDerivatives=[F(-3),F(0),F(5),F(0),F(2),F(0),F(3),F(0),F(1),F(0),F(1)]+[F(0)]*20
P=[pressureDerivatives[k]/math.factorial(k) for k in range(M+1)]
b0=-A-F(1,2);c0=-A

def T(a,rows):return [mul(iL,add(sc(x,-a+k),sc(mul(eta,de(x)),D))) for k,x in enumerate(rows)]
def Z(a,rows):return [mul(iL,add(sc(mul(eta,x),2*(a-k)),mul(dd,de(x)))) for k,x in enumerate(rows)]
def VV(U,c):return [p()]+[sc(x,-F(1,k+1)) for k,x in enumerate(Z(c,U))]
def at(rows,k):return rows[k] if k<len(rows) else p()
def dot(rows):return [sc(x,k) for k,x in enumerate(rows)]
def plus(a,b):return [add(at(a,k),at(b,k)) for k in range(max(len(a),len(b)))]

DEGREE=3
lead={'F':[g],'U':[Us],'Pi':[P]}
for k in range(DEGREE+2):
    ff,uu,pp=(lead[n] for n in ('F','U','Pi'));v=VV(uu,c0)[1:]
    ra=add(at(T(b0,ff),k),cv(v,plus(dot(ff),ff),k),cv(uu,Z(b0,ff),k))
    rz=add(at(T(c0,uu),k),cv(v,dot(uu),k),cv(uu,Z(c0,uu),k),at(Z(-2*A,pp),k))
    pn=sc(cv(ff,ff,k),F(1,k+1));fn=sc(ra,F(1,2*(k+1)*(k+2)));un=sc(rz,F(1,2*(k+1)**2))
    lead['Pi'].append(pn);lead['F'].append(fn);lead['U'].append(un)
lead['V']=VV(lead['U'],c0)

V=lead['V'];v=V[1:];vx=[sc(x,k+1) for k,x in enumerate(V[1:])]
omega=[]
for k in range(DEGREE+2):
    lap=sc(at(V,k+1),-2*k*(k+1)) if k else p()
    omega.append(add(at(T(0,V),k),cv(V,plus(vx,[sc(x,F(-1,2)) for x in v]),k),cv(lead['U'],Z(0,V),k),lap))

def solve_one(omit_viscosity=False,omit_omega=False):
    out={'F':[p()],'U':[p()],'Pi':[p()]}
    b1=b0+2*h;c1=c0+2*h
    for k in range(DEGREE):
        ff,uu,pp=(out[n] for n in ('F','U','Pi'));v1=VV(uu,c1)[1:]
        vf=p() if omit_viscosity else at(Z(b0-D,Z(b0,lead['F'])),k)
        vu=p() if omit_viscosity else at(Z(c0-D,Z(c0,lead['U'])),k)
        ra=add(at(T(b1,ff),k),cv(v,plus(dot(ff),ff),k),cv(v1,plus(dot(lead['F']),lead['F']),k),cv(lead['U'],Z(b1,ff),k),cv(uu,Z(b0,lead['F']),k),sc(vf,-1))
        rz=add(at(T(c1,uu),k),cv(v,dot(uu),k),cv(v1,dot(lead['U']),k),cv(lead['U'],Z(c1,uu),k),cv(uu,Z(c0,lead['U']),k),at(Z(-2*A+2*h,pp),k),sc(vu,-1))
        pn=sc(add(sc(cv(lead['F'],ff,k),2),p() if omit_omega else sc(omega[k+1],F(-1,2))),F(1,k+1))
        fn=sc(ra,F(1,2*(k+1)*(k+2)));un=sc(rz,F(1,2*(k+1)**2))
        out['Pi'].append(pn);out['F'].append(fn);out['U'].append(un)
    out['K']=[sc(x,F(-k,k+1)) for k,x in enumerate(out['U'])];out['V']=VV(out['U'],c1)
    return out

positive=solve_one()
code="""
import fs from 'node:fs';
import {buildActualBackgroundJets,evaluateBackgroundJetOracle} from './research-ide/mathscope-m2/navier/actual-background-jets.mjs';
import {actualBackgroundAxisObservations} from './research-ide/mathscope-m2/navier/actual-background-observations.mjs';
import {actualBackgroundMomentFunctionals} from './research-ide/mathscope-m2/navier/actual-background-moments.mjs';
import {actualBackgroundPointEnclosures} from './research-ide/mathscope-m2/navier/actual-background-points.mjs';
const p=JSON.parse(fs.readFileSync(0,'utf8')),g=buildActualBackgroundJets({radialDegree:p.degree}),o=evaluateBackgroundJetOracle(g,p.oracle);
const out={actual:actualBackgroundAxisObservations(),moments:actualBackgroundMomentFunctionals(),points:actualBackgroundPointEnclosures({locationScaleBits:96})};
for(const group of ['leading','positive'])out[group]=Object.fromEntries(Object.entries(g[group]).filter(([k,v])=>['F','U','K','Pi','V'].includes(k)).map(([k,v])=>[k,v.map(id=>[0,1,2].map(m=>o.value(id,m)))]));
process.stdout.write(JSON.stringify(out));
"""
payload={'degree':DEGREE,'oracle':{'eta':0,'parameters':{'h':float(h),'j0':float(j),'Lambda':float(lam),'sigmaStar':float(sigma)},'pressureDerivatives':[float(x) for x in pressureDerivatives],'amplitudeAtEta':float(amp)}}
result=json.loads(subprocess.run(['node','--input-type=module','-e',code],input=json.dumps(payload),cwd=ROOT,text=True,check=True,capture_output=True).stdout)
for group,expected in [('leading',lead),('positive',positive)]:
    for field,rows in expected.items():
        for k,row in enumerate(rows):
            if k>=len(result[group][field]):continue
            # The eta jet reserves enough unused high coefficients for every
            # derivative that reaches these independent lower coefficients.
            for m in range(3):
                exact=row[m]*math.factorial(m);actual=result[group][field][k][m]
                check(f'direct-physical-coefficients-{group}-{field}-X{k}-eta{m}',abs(actual-float(exact))<=2e-9*max(1,abs(float(exact))))

for variant,name in [(solve_one(omit_viscosity=True),'omit-axial-viscosity'),(solve_one(omit_omega=True),'omit-radial-pressure-shift')]:
    check('negative-'+name,any(variant[field][k][0]!=positive[field][k][0] for field in ['F','U','Pi'] for k in range(DEGREE+1)))

# Actual source intervals: independent Fraction arithmetic, not the rational
# algorithm test datum above.  This retains the full pressure uncertainty.
src=json.loads((ROOT/'research-ide/mathscope-m1/navier/followup-20261010-symbolic-gluing/attempts/pressure-datum-0001/receipt.json').read_text())
tiny=F(1,2**2048)
def ia(a,b):return (a[0]+b[0],a[1]+b[1])
def im(a,b):
    c=[x*y for x in a for y in b];return min(c),max(c)
def sca(a,s):return im(a,(F(s),F(s)))
pt=lambda x:(F(x),F(x))
small=(F(0),tiny);AA=ia(pt(F(1,2)),small);bb=sca(ia(pt(1),small),-1)
chi=F(4000000,4000001);zp=F(4000000*3999999,4000001**2)
angular=ia(ia(pt(chi*chi),im(im(ia(pt(F(9,2)),sca(small,-1)),pt(zp)),small)),sca(im(im(bb,small),im(small,small)),2))
pr=[tuple(F(src['normalizedPressureTaylorCoefficients'][m]['derivativeInterval'][end]) for end in ['lower','upper']) for m in [0,2]]
pressureActual=ia(ia(sca(small,-12),sca(im(AA,pr[0]),2)),sca(pr[1],F(-1,2)))
for row,expected in zip(result['actual']['samples'],[angular,AA,pressureActual]):
    got=tuple(F(row['normalizedInterval'][k]) for k in ['lower','upper'])
    check('actual-interval-'+row['id'],got==expected)
    display=row['displayEnclosure'];check('actual-directed-display-'+row['id'],F(display[0])<=got[0]<=got[1]<=F(display[1]))
    check('positive-actual-uncertainty-'+row['id'],got[0]<got[1])

# Actual Imean source identity: M=eta*mConst, U0=0 implies V0=-mConst
# for every h,eta, not just an eta-zero observation.  All fixed sample
# substitutions below are exact rational checks of this polynomial identity.
for hv,ev in [(F(1,1000),F(-1)),(F(1,5000),F(2,3)),(F(1,2000),F(0)),(F(1,10000),F(1))]:
    ddv=1-ev*ev;Dv=F(1,2)-hv;Lv=1-2*hv*ev*ev
    check('Imean-V-identity-'+str(hv)+'-'+str(ev),(2*Dv*ev*ev+ddv)/Lv==1)
# Independently enclose exp(-5) using the alternating exponential series.
# For the tail after n=200 every term decreases in absolute value.
v=F(0);term=F(1)
for k in range(201):
    if k:term*=F(-5,k)
    v+=term
nextterm=term*F(-5,201)
emin,emax=sorted([v,v+nextterm])
imean=result['moments']['imeanOmissionControl']['normalizedContributions']
pressureBox=tuple(F(imean[0]['normalizedInterval'][x]) for x in ['lower','upper'])
check('Imean-pressure-vs-independent-alternating-series',pressureBox[0]<=1-emax<=1-emin<=pressureBox[1])
check('Imean-exact-flux-integral',F(imean[1]['normalizedInterval']['lower'])==F(-5,4)==F(imean[1]['normalizedInterval']['upper']))
check('Imean-actual-nonzero-control',pressureBox[0]>0 and F(imean[1]['normalizedInterval']['upper'])<0)
check('full-moment-debts-not-falsely-closed',result['moments']['scope']['actualTotalMomentDebtsClosed'] is False)

# Independently verify the interval widening and the universal positive-point
# Cauchy inequality.  The huge actual coordinate stays an exact expression.
for row in result['points']['samples']:
    axis=next(x for x in result['actual']['samples'] if x['id']==row['sourceAxisDerivativeId'])
    expected=(F(axis['normalizedInterval']['lower'])-F(1,2**96),F(axis['normalizedInterval']['upper'])+F(1,2**96))
    got=tuple(F(row['normalizedInterval'][x]) for x in ['lower','upper'])
    check('actual-point-widening-'+row['id'],got==expected)
    check('actual-point-display-'+row['id'],F(row['displayEnclosure'][0])<=got[0]<=got[1]<=F(row['displayEnclosure'][1]))
for i in range(1,6):
    check('Cauchy-relative-remainder-'+str(i),F(i,32)/(1-F(5,32))<1)
check('positive-point-not-fixed-point-refinement',result['points']['scope']['precisionChangesObservationPoint'] and not result['points']['scope']['fixedPointRefinement'])

summary={'schema':'MathScope.ActualBackgroundIndependentAudit/1','pass':all(c['pass'] for c in checks),'passed':sum(c['pass'] for c in checks),'total':len(checks),'checks':checks,'algorithmOracleScope':'EXACT_FRACTION_DIRECT_ORIGINAL_COEFFICIENT_PDE_WITH_A_DECLARED_RATIONAL_DATUM; not the selected N3 values','actualSourceScope':'The three newly derived positive-order axis slopes use the retained same-datum A.21 pressure intervals and strictly positive source parameter enclosures.','independentLeadingMethod':'Unnormalized order-zero equations (5.2)-(5.5), not the production normalized B.14/B.15 implementation.','negativeControls':['omitted axial viscosity','omitted radial pressure order shift'],'producerSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path);args=ap.parse_args()
if args.output:args.output.write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:summary[k] for k in ['schema','pass','passed','total']}))
