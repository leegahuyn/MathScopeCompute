#!/usr/bin/env python3
"""Observe N7's exact operator proof and independently verify its output.

The first interpreter uses ordinary Cartesian polynomial coefficients over
Fraction, not formal field jets. The second specializes the emitted field
jets to the actual original exterior heat germ with h still indeterminate.
It retains the positive physical amplitude as an independent factor B and
r^2=3/8 exactly; only homogeneous ratios remove these physical factors.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
from pathlib import Path
import hashlib
import json
import math
import os
import re
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'

def sha(raw):return hashlib.sha256(raw).hexdigest()
def pin(path):return {'path':str(path.relative_to(ROOT)),'bytes':path.stat().st_size,'sha256':sha(path.read_bytes())}
def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def clean(p):return {k:v for k,v in p.items() if v}
def plus(a,b):
    out=dict(a)
    for k,v in b.items():out[k]=out.get(k,Q(0))+v
    return clean(out)
def scale(p,v):return clean({k:a*v for k,a in p.items()})
def minus(a,b):return plus(a,scale(b,-1))

# Independent ordinary Cartesian polynomials in x,y,z,tau.
ZERO=(0,0,0,0)
def constant(v):return {ZERO:Q(v)} if v else {}
def variable(i):return {tuple(int(i==j) for j in range(4)):Q(1)}
def times(a,b):
    out={}
    for ka,va in a.items():
        for kb,vb in b.items():
            k=tuple(x+y for x,y in zip(ka,kb));out[k]=out.get(k,Q(0))+va*vb
    return clean(out)
def power(a,n):
    out=constant(1)
    for _ in range(n):out=times(out,a)
    return out
def deriv(p,i):
    out={}
    for k,v in p.items():
        if k[i]:
            a=list(k);a[i]-=1;out[tuple(a)]=v*k[i]
    return clean(out)
def d_order(p,orders):
    for i,n in enumerate(orders):
        for _ in range(n):p=deriv(p,i)
    return p
def sum_poly(values):
    out={}
    for v in values:out=plus(out,v)
    return out
def vadd(*rows):return [sum_poly(row[i] for row in rows) for i in range(3)]
def vscale(v,c):return [times(c,p) for p in v]
def grad(p):return [deriv(p,i) for i in range(3)]
def lap(p):return sum_poly(deriv(deriv(p,i),i) for i in range(3))
def div(v):return sum_poly(deriv(p,i) for i,p in enumerate(v))
def cross(a,b):return [minus(times(a[j],b[k]),times(a[k],b[j])) for j,k in [(1,2),(2,0),(0,1)]]
def curl(v):return [minus(deriv(v[k],j),deriv(v[j],k)) for j,k in [(1,2),(2,0),(0,1)]]
def adv(a,b):return [sum_poly(times(a[i],deriv(p,i)) for i in range(3)) for p in b]
def pde(v,p):return vadd([minus(scale(deriv(a,3),-1),lap(a)) for a in v],adv(v,v),grad(p))

class CartesianFixture:
    def __init__(self):
        self.x,self.y,self.z,self.tau=[variable(i) for i in range(4)]
        x,y,z,t=self.x,self.y,self.z,self.tau
        self.s=plus(power(x,2),power(y,2))
        # C,b are specified independently as polynomials in (s,z,tau).
        self.axis={
            'C':{(0,0,0):Q(1,2),(1,0,0):Q(2,7),(0,1,0):Q(3,11),(0,0,1):Q(5,13),
                 (1,1,0):Q(1,17),(0,1,1):Q(1,19),(1,0,1):Q(1,23),(2,0,0):Q(1,29)},
            'b':{(0,0,0):Q(1),(1,0,0):Q(1,3),(0,1,0):Q(1,5),(0,0,1):Q(1,7),
                 (1,1,0):Q(1,11),(0,1,1):Q(1,13),(2,0,0):Q(1,31)}}
        self.fields={
            'A0':sum_poly([times(x,power(y,2)),times(z,t),times(power(x,2),t)]),
            'A1':sum_poly([times(power(z,2),x),times(y,power(t,2)),times(times(x,y),z)]),
            'A2':sum_poly([times(power(x,2),y),times(times(y,z),t),power(z,3)]),
            'p':sum_poly([power(x,2),power(y,2),power(z,2),times(times(t,x),z),times(times(x,power(y,2)),z),times(power(t,2),y)])}
        self.cache={}
    def axis_derivative(self,name,orders):
        out={}
        for exponents,coefficient in self.axis[name].items():
            if any(k<n for k,n in zip(exponents,orders)):continue
            value=constant(coefficient)
            for p,k,n in zip([self.s,self.z,self.tau],exponents,orders):
                value=times(value,scale(power(p,k-n),math.factorial(k)//math.factorial(k-n)))
            out=plus(out,value)
        return out
    def atom(self,name):
        if name in self.cache:return self.cache[name]
        if re.fullmatch(r'x[0-3]',name):result=variable(int(name[1]))
        else:
            field,encoded=name.split('@');orders=list(map(int,encoded.split(',')))
            result=self.axis_derivative(field,orders) if field in self.axis else d_order(self.fields[field],orders)
        self.cache[name]=result;return result
    def polynomial(self,rows):
        result={}
        for row in rows:
            term=constant(Q(row['coefficient']))
            for atom in row['monomial'].split('*') if row['monomial'] else []:term=times(term,self.atom(atom))
            result=plus(result,term)
        return result

# A sparse exact localized polynomial ring in h,r,B,n. r^2=3/8,
# n=1+2h is imposed after clearing the explicitly retained n denominators.
# B is the actual positive exterior value K/r; it is never set to a number.
R2=Q(3,8)
def sy(v=0):return {(0,0,0,0):Q(v)} if v else {}
def sx(i):return {tuple(int(i==j) for j in range(4)):Q(1)}
def smul(a,b):
    out={}
    for ka,va in a.items():
        for kb,vb in b.items():
            h,r,B,n=(x+y for x,y in zip(ka,kb));factor=R2**(r//2);key=(h,r%2,B,n)
            out[key]=out.get(key,Q(0))+va*vb*factor
    return clean(out)
def spow(a,n):
    out=sy(1)
    for _ in range(n):out=smul(out,a)
    return out
def rising(a,n):
    out=sy(1)
    for k in range(n):out=smul(out,plus(a,sy(k)))
    return out
H,RR,BB,NN=[sx(i) for i in range(4)]
NINV={(0,0,0,-1):Q(1)}
def source_zero(p):
    # Multiply by n^d first; n>1 for the original strictly positive h.
    d=max([0]+[-key[3] for key in p]);p=smul(p,spow(NN,d));out={}
    for (h,r,B,n),value in p.items():
        assert n>=0
        for j in range(n+1):
            key=(h+j,r,B);out[key]=out.get(key,Q(0))+value*math.comb(n,j)*2**j
    return not clean(out)

def t_mul(a,b):return [sum((a[j]*b[k-j] for j in range(k+1)),Q(0)) for k in range(len(a))]
def t_inv(a):
    out=[1/a[0]]+[Q(0)]*(len(a)-1)
    for k in range(1,len(a)):out[k]=-sum((a[j]*out[k-j] for j in range(1,k+1)),Q(0))/a[0]
    return out
def t_exp_relative(a):
    # exp(a-a(0)); both source exponentials have the same a(0)=-2.
    out=[Q(1)]+[Q(0)]*(len(a)-1)
    for k in range(1,len(a)):out[k]=sum((j*a[j]*out[k-j] for j in range(1,k+1)),Q(0))/k
    return out
def actual_cutoff_jets():
    u=[Q(1,2),Q(2),Q(0),Q(0),Q(0)] # u=2*(3/4+delta)-1
    one_minus=[Q(1)-u[0]]+[-v for v in u[1:]]
    a=[-v for v in t_inv(one_minus)];b=[-v for v in t_inv(u)]
    assert a[0]==b[0]==-2
    ea,eb=t_exp_relative(a),t_exp_relative(b)
    chi=t_mul(ea,t_inv([x+y for x,y in zip(ea,eb)]))
    return [v*math.factorial(i) for i,v in enumerate(chi)]

class OriginalExteriorGerm:
    def __init__(self):self.chi=actual_cutoff_jets();self.cache={}
    def atom(self,name):
        if name in self.cache:return self.cache[name]
        if name=='x0':out=RR
        elif name in ('x1','x2','x3'):out={}
        else:
            field,encoded=name.split('@');orders=list(map(int,encoded.split(',')))
            if field.startswith('A'):out={}
            elif field=='C':
                a,z,t=orders;assert a<=4
                out=sy(2**a*self.chi[a]) if not z and not t else {}
            elif field=='b':
                a,z,j=orders
                if z:out={}
                else:
                    assert j<=1
                    product=smul(rising(H,j),rising(plus(H,sy(1)),j))
                    out=scale(smul(smul(BB,product),rising(plus(H,sy(1+j)),a)),(-1)**(a+j)*4**j/R2**(a+j))
            elif field=='p':
                x,y,z,t=orders;assert x+y+z+t<=2 and t==0
                if z:out={}
                elif (x,y)==(0,0):out=scale(smul(spow(BB,2),NINV),-R2/2)
                elif (x,y)==(1,0):out=smul(RR,spow(BB,2))
                elif (x,y)==(2,0):out=scale(smul(plus(scale(NN,2),sy(1)),spow(BB,2)),-1)
                elif (x,y)==(0,2):out=spow(BB,2)
                else:out={}
            else:raise AssertionError('Unexpected actual-source field '+field)
        self.cache[name]=out;return out
    def polynomial(self,rows):
        out={}
        for row in rows:
            term=sy(Q(row['coefficient']))
            for atom in row['monomial'].split('*') if row['monomial'] else []:term=smul(term,self.atom(atom))
            out=plus(out,term)
        return out

def independent(proof):
    checks=[]
    def check(name,value,details=None):
        if not value:raise AssertionError(name)
        checks.append({'id':name,'pass':True,**({'details':details} if details is not None else {})})
    fixture=CartesianFixture();c=fixture.axis_derivative('C',[0,0,0]);b=fixture.axis_derivative('b',[0,0,0])
    A=[fixture.fields['A'+str(i)] for i in range(3)];p=fixture.fields['p']
    B=[scale(times(fixture.y,b),-1),times(fixture.x,b),{}]
    v=vadd(curl(A),B);u=vadd(curl(vscale(A,c)),vscale(B,c));g=cross(grad(c),A);pressure=times(c,p)
    force=pde(u,pressure);local=pde(v,p)
    dd=sum_poly(deriv(deriv(times(u[i],u[j]),j),i) for i in range(3) for j in range(3))
    expected={'velocity':u,'localVelocity':v,'curlCommutator':g,'localResidual':local,'directForce':force,'expandedForce':force}
    for name,values in expected.items():
        for i,value in enumerate(values):
            observed=fixture.polynomial(proof['algebra']['exactPolynomials'][name][i])
            check('independent-cartesian-'+name+'-'+str(i),observed==value,{'coefficientCount':len(value)})
    for name,value in [('pressure',pressure),('forceDivergence',div(force)),('doubleDivergence',dd),('pressureLaplacian',lap(pressure))]:
        check('independent-cartesian-'+name,fixture.polynomial(proof['algebra']['exactPolynomials'][name])==value,{'coefficientCount':len(value)})
    check('independent-cartesian-solenoidal',not div(u))
    check('independent-cartesian-nonzero-curl-commutator',any(g))
    check('independent-cartesian-nonzero-force-divergence',bool(div(force)))
    check('independent-cartesian-pressure-with-force-divergence',not plus(minus(scale(lap(pressure),-1),dd),div(force)))
    check('independent-cartesian-pressure-without-force-divergence-fails',bool(minus(scale(lap(pressure),-1),dd)))
    for control in proof['algebra']['negativeControls']:
        if control['id']=='theta-dependent-cutoff-breaks-direct-field-solenoidality':continue
        check('independent-nonzero-'+control['id'],any(fixture.polynomial(row) for row in control['residual']))

    germ=OriginalExteriorGerm();polys=proof['algebra']['exactPolynomials']
    force=[germ.polynomial(row) for row in polys['directForce']];divergence=germ.polynomial(polys['forceDivergence'])
    dd=germ.polynomial(polys['doubleDivergence']);lp=germ.polynomial(polys['pressureLaplacian'])
    check('actual-cutoff-midpoint-chi',germ.chi[0]==Q(1,2))
    check('actual-cutoff-midpoint-first',germ.chi[1]==-4)
    check('actual-cutoff-midpoint-second',germ.chi[2]==0)
    check('actual-cutoff-cartesian-radial-laplacian',4*germ.chi[1]+4*germ.chi[1]==-32)
    # S0=K0^2=r^2*B^2 and K0=r*B. No source amplitude is replaced.
    radial_expected=smul(smul(RR,spow(BB,2)),plus(sy(Q(1,4)),scale(NINV,3)))
    theta_expected=scale(smul(smul(RR,BB),H),-64)
    divergence_expected=scale(smul(spow(BB,2),minus(minus(scale(NINV,16),sy(16)),scale(NN,Q(4,3)))),R2)
    check('actual-source-radial-force-ratio',source_zero(minus(force[0],radial_expected)),{'ratio':'1/4+3/n','scale':'S_0/r','n':'1+2h'})
    check('actual-source-azimuthal-force-ratio',source_zero(minus(force[1],theta_expected)),{'ratio':'-64*h','scale':'K_0'})
    check('actual-source-axial-force-zero',source_zero(force[2]))
    check('actual-source-force-divergence-ratio',source_zero(minus(divergence,divergence_expected)),{'ratio':'16/n-16-4*n/3','scale':'S_0','n':'1+2h'})
    check('actual-source-pressure-poisson-retains-div-f',source_zero(plus(minus(scale(lp,-1),dd),divergence)))
    check('actual-source-div-f-is-a-nonzero-expression',not source_zero(divergence))
    check('actual-source-div-f-omission-rejected',not source_zero(minus(scale(lp,-1),dd)))
    pressure_omission=next(r for r in proof['algebra']['negativeControls'] if r['id']=='omitted-pressure-cutoff-changes-force')
    check('actual-source-pressure-cutoff-omission-nonzero',any(not source_zero(germ.polynomial(row)) for row in pressure_omission['residual']))
    check('original-h-expression-not-substituted',proof['sourceBinding']['parameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152')
    check('source-domain-bound-to-localization-qBig',proof['sourceDomain']['qBig']==622791)
    check('operator-proof-does-not-enumerate-final-field',proof['proofScope']['fullFinalN6FieldNumericallyConstructed'] is False and proof['proofScope']['wholeLocalizedForceValuesComputed'] is False)
    return {'schema':'MathScope.N7.LocalizationOperatorIndependentExact/1','status':'PASS','checks':checks,
            'cartesianFixture':'Independent rational polynomial A,p,C(s,z,tau),b(s,z,tau); every emitted coefficient is compared, not just samples.',
            'actualSourceControl':{'region':'original exterior heat germ, z=0, r^2=3/8, tau decreases to zero','h':'original exact positive source parameter, retained as indeterminate',
                'physicalAmplitude':'B=K/r retained as an independent positive factor; S_0=r^2 B^2','cutoffJets':[str(v) for v in germ.chi],
                'cutoffExponentialCancellation':'Both midpoint exponentials have exp(-2); their common positive factor cancels exactly before Taylor division.',
                'radialSign':'1/4+3/n>0 since n=1+2h>1','thetaSign':'-64h<0 since h>0','forceDivergenceSign':'16/n-16-4n/3<0 since n>1',
                'wholeGlobalTerminalJetComputed':False},'arithmetic':'Python standard-library Fraction and sparse exact polynomial coefficient maps',
            'newLeanExecuted':False,'fullFinalN6FieldNumericallyConstructed':False}

def source_rows():
    seen=set()
    def visit(path):
        path=path.resolve()
        if not path.is_relative_to(ROOT):raise ValueError('Source import escaped repository')
        if path in seen:return
        seen.add(path)
        if path.suffix in ('.mjs','.js'):
            for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/spec)
    for path in [BASE/'source-localization-operator.mjs',BASE/'tests/source-localization-operator.test.mjs',Path(__file__)]:visit(path)
    return [pin(path) for path in sorted(seen)]

def main():
    if len(sys.argv)!=2 or not sys.argv[1].isdigit():raise SystemExit('Use a new integer attempt identifier.')
    attempt=int(sys.argv[1]);out=BASE/'evidence/source-localization-operator-20261012'/('attempt'+str(attempt));out.mkdir(parents=True,exist_ok=False)
    before=source_rows();write(out/'source-bytes-before.json',{'files':before,'fileCount':len(before)})
    for row in before:
        target=out/'source-snapshot'/row['path'];target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((ROOT/row['path']).read_bytes())
    started=datetime.now(timezone.utc).isoformat();t0=time.monotonic();error=None;verification=None
    command=['node','--max-old-space-size=768','--test','--test-reporter=tap',str((BASE/'tests/source-localization-operator.test.mjs').relative_to(ROOT))]
    env={**os.environ,'MATHSCOPE_N7_OPERATOR_OUTPUT':str(out/'localization-operator.json')}
    result=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True,timeout=45)
    (out/'node.log').write_text(result.stdout);(out/'node.stderr').write_text(result.stderr)
    try:
        if result.returncode:raise AssertionError('Node source operator tests failed')
        proof=json.loads((out/'localization-operator.json').read_text());verification=independent(proof);write(out/'independent-exact.json',verification)
        # Recheck both complete inherited source archives, without rebuilding
        # them and without rerunning the multi-gigabyte constructors.
        for script,name in [('build-near-terminal-evidence.py','near-terminal-package'),('build-exterior-force-evidence.py','domain-exterior-package')]:
            package=subprocess.run([sys.executable,'-B',str(BASE/'tests'/script),'--check'],cwd=ROOT,capture_output=True,text=True,timeout=45)
            (out/(name+'.log')).write_text(package.stdout+package.stderr)
            if package.returncode:raise AssertionError('Inherited package verification failed: '+name)
    except Exception as exc:error=repr(exc)
    after=source_rows();unchanged=before==after;write(out/'source-bytes.json',{'before':before,'after':after,'unchanged':unchanged})
    passed=len(re.findall(r'^ok \d+ - ',result.stdout,re.M));failed=len(re.findall(r'^not ok \d+ - ',result.stdout,re.M));skipped=int(re.search(r'^# skipped (\d+)',result.stdout,re.M).group(1))
    good=result.returncode==0 and passed==10 and not failed and not skipped and error is None and unchanged and verification is not None
    artifacts=[pin(path) for path in sorted(out.iterdir()) if path.is_file()]
    receipt={'schema':'MathScope.N7.LocalizationOperatorObservedGate/1','attempt':attempt,'startedAt':started,'finishedAt':datetime.now(timezone.utc).isoformat(),
             'elapsedSeconds':time.monotonic()-t0,'command':command,'exitCode':result.returncode,'nodeTests':{'passed':passed,'failed':failed,'skipped':skipped},
             'independentStatus':verification['status'] if verification else 'FAIL','independentCheckCount':len(verification['checks']) if verification else 0,
             'sourceFilesUnchanged':unchanged,'sourceFileCount':len(before),'inheritedNearTerminalAndDomainArchivesReverified':error is None,
             'artifacts':artifacts,'error':error,'pass':good,'freshFullSourceConstructorExecuted':False,'newLeanExecuted':False,
             'scope':'Exact source localization operator, all commutators, solenoidality and force pressure relation; final N6 values/global jets/whole-K energy are not computed.'}
    write(out/'receipt.json',receipt);print(json.dumps(receipt,indent=2));return 0 if good else 1

if __name__=='__main__':raise SystemExit(main())
