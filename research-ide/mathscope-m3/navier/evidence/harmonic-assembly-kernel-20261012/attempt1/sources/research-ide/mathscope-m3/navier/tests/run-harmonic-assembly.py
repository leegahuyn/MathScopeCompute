#!/usr/bin/env python3
"""Observe the finite harmonic kernel and check every emitted polynomial.

The independent interpreter expands the direct real-space derivatives in
Q(i)[R,R^-1,Z,T,xi,v,E,E^-1]. E=exp(i*k*Phi) is a formal phase, so complete
coefficient maps are compared, with no angular sampling or binary64 values.
The executed control is deliberately not described as an original field.
"""
from datetime import datetime, timezone
from fractions import Fraction as Q
from pathlib import Path
import hashlib
import json
import os
import re
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
ZERO=(0,0,0,0,0,0,0)  # harmonic, R,Z,T,xi,v, imaginary exponent mod2

def sha(raw):return hashlib.sha256(raw).hexdigest()
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def clean(p):return {k:v for k,v in p.items() if v}
def scalar(x):return {ZERO:Q(x)} if x else {}
def plus(a,b):
    out=dict(a)
    for k,v in b.items():out[k]=out.get(k,Q(0))+v
    return clean(out)
def scale(a,x):return clean({k:v*x for k,v in a.items()})
def times(a,b):
    out={}
    for ka,va in a.items():
        for kb,vb in b.items():
            i=ka[-1]+kb[-1]
            k=tuple(x+y for x,y in zip(ka[:-1],kb[:-1]))+(i%2,)
            out[k]=out.get(k,Q(0))+va*vb*(-1)**(i//2)
    return clean(out)
def inverse(a):
    if len(a)!=1:raise ValueError('The control only inverts exact Laurent monomials')
    k,v=next(iter(a.items()))
    return {tuple(-x for x in k[:-1])+(k[-1],):Q((-1)**k[-1],1)/v}
def power(a,n):
    if n<0:return power(inverse(a),-n)
    out=scalar(1)
    while n:
        if n%2:out=times(out,a)
        n//=2
        if n:a=times(a,a)
    return out
def phase(m):return {(m,0,0,0,0,0,0):Q(1)}
IMAG={(0,0,0,0,0,0,1):Q(1)}
def conjugate(a):
    return clean({(-k[0],)+k[1:]:v*(-1)**k[-1] for k,v in a.items()})

class Interpreter:
    def __init__(self,artifact):
        self.a=artifact;self.nodes=artifact['nodes'];self.cache={}
        self.coords={artifact['coordinates'][name]:j+1 for j,name in enumerate(['R','Z','T','xi','v'])}
        self.phases={row['argument']:row['m'] for row in artifact['argumentsByMode']}
    def at(self,id):
        if id in self.cache:return self.cache[id]
        op,args=self.nodes[id]['op'],self.nodes[id]['args']
        if op=='rational':out=scalar(Q(int(args[0]),int(args[1])))
        elif op=='coordinate':
            if id not in self.coords:raise ValueError('An unfrozen angle or unexpected coordinate leaked into a coefficient')
            k=list(ZERO);k[self.coords[id]]=1;out={tuple(k):Q(1)}
        elif op=='add':
            out={}
            for x in args:out=plus(out,self.at(x))
        elif op=='multiply':
            out=scalar(1)
            for x in args:out=times(out,self.at(x))
        elif op=='inverse':out=inverse(self.at(args[0]))
        elif op=='integer_power':out=power(self.at(args[0]),args[1])
        elif op in ['sine','cosine']:
            if args[0] not in self.phases:raise ValueError('A trigonometric phase is absent from the exact harmonic inventory')
            m=self.phases[args[0]]
            out=scale(plus(phase(m),phase(-m)),Q(1,2)) if op=='cosine' else times(IMAG,scale(plus(phase(-m),scale(phase(m),-1)),Q(1,2)))
        else:raise ValueError('Unexpected operation in the independent Laurent control: '+op)
        self.cache[id]=out;return out
    def coefficient(self,c):return plus(self.at(c['real']),times(IMAG,self.at(c['imaginary'])))
    def vector(self,rows):
        result=[{}, {}, {}]
        for row in rows:
            for j,value in enumerate(row['value']):result[j]=plus(result[j],times(phase(row['m']),self.coefficient(value)))
        return result
    def scalar_rows(self,rows):
        out={}
        for row in rows:out=plus(out,times(phase(row['m']),self.coefficient(row['value'])))
        return out

def independent(artifact):
    I=Interpreter(artifact);checks=[]
    def check(name,value,**details):
        checks.append({'id':name,'pass':bool(value),**details})
        if not value:raise ValueError(name)
    actual=artifact['harmonic'];direct=artifact['real'];update=artifact['update']
    for name in ['conservativeResidual','advectiveResidual','pressureGradient','vectorLaplacian']:
        expected=I.vector(actual[name])
        for j,root in enumerate(direct[name]):
            got=I.at(root)
            check('real-space-vs-complete-angular-'+name+'-'+str(j),got==expected[j],monomials=len(got),
                  minimumHarmonic=min((k[0] for k in got),default=0),maximumHarmonic=max((k[0] for k in got),default=0))
            check('conjugate-reality-'+name+'-'+str(j),conjugate(got)==got)
    check('real-space-divergence',I.at(direct['divergence'])==I.scalar_rows(actual['divergence']))
    for j,defect in enumerate(I.vector(update['defect'])):check('complete-coefficient-update-defect-'+str(j),not defect)
    for j,(left,right) in enumerate(zip(I.vector(update['direct']),I.vector(update['decomposed']))):check('whole-direct-decomposed-'+str(j),left==right)
    for part in ['oldFlatResidual','newQuadraticRemainder']:
        rows=I.vector(update[part]);check(part+'-is-not-zero',any(rows))
        omission=[plus(a,scale(b,-1)) for a,b in zip(I.vector(update['decomposed']),rows)]
        check(part+'-omission-fails',omission!=I.vector(update['direct']))
    quadratic=I.vector(update['newQuadraticRemainder'])
    for m in [-4,4]:check('generated-nonzero-harmonic-'+str(m),any(any(k[0]==m for k in row) for row in quadratic))
    pressure=I.vector(actual['pressureGradient']);check('updated-physical-pressure-gradient-nonzero',any(pressure))
    check('pressure-omission-fails',[plus(a,scale(b,-1)) for a,b in zip(I.vector(actual['conservativeResidual']),pressure)]!=I.vector(actual['conservativeResidual']))
    check('no-source-or-final-field-promotion',not artifact['scope']['actualSourceField'] and not artifact['scope']['originalFinalN6'] and not artifact['scope']['allCorrectionStages'])
    return {'schema':'MathScope.N6.IndependentFiniteHarmonicCheck/1','status':'PASS','checks':checks,
            'passed':len(checks),'arithmetic':'Python Fraction; complete Laurent/Fourier coefficient maps in Q(i), no sample grid.',
            'sourceFieldAttached':False,'newLeanExecuted':False,'distinctInterpretedNodes':len(I.cache)}

def source_rows():
    seen=set()
    def visit(path):
        path=path.resolve()
        if path in seen:return
        if not path.is_relative_to(ROOT):raise ValueError('Source escaped the repository')
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/spec)
    for path in [BASE/'source-harmonic-assembly.mjs',BASE/'tests/harmonic-assembly-kernel.test.mjs',Path(__file__)]:visit(path)
    return [{'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in sorted(seen)]

def main():
    attempt=sys.argv[1] if len(sys.argv)>1 else '1'
    if not re.fullmatch(r'[1-9][0-9]*',attempt):raise ValueError('Use a new positive attempt number')
    dest=BASE/'evidence/harmonic-assembly-kernel-20261012'/('attempt'+attempt);dest.mkdir(parents=True,exist_ok=False)
    start=time.monotonic();started=datetime.now(timezone.utc).isoformat();before=source_rows()
    write(dest/'source-before.json',before)
    for row in before:
        path=dest/'sources'/row['path'];path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes((ROOT/row['path']).read_bytes())
    artifact=dest/'finite-harmonic-control.json';env=dict(os.environ,MATHSCOPE_HARMONIC_ARTIFACT=str(artifact))
    command=['node','--test',str(BASE/'tests/harmonic-assembly-kernel.test.mjs')]
    run=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True)
    (dest/'stdout.log').write_text(run.stdout);(dest/'stderr.log').write_text(run.stderr)
    receipt={'schema':'MathScope.N6.ObservedFiniteHarmonicGate/1','attempt':int(attempt),'startedUTC':started,'command':command,
             'exitCode':run.returncode,'sourceFiles':len(before),'status':'FAIL','sourceAuthenticated':False,'allCorrectionStagesConstructed':False}
    try:
        if run.returncode:raise ValueError('Node kernel tests failed')
        result=independent(json.loads(artifact.read_text()));write(dest/'independent-check.json',result)
        after=source_rows();write(dest/'source-after.json',after)
        if before!=after:raise ValueError('Captured source changed during this observed gate')
        receipt.update(status='PASS',nodeTestsPassed=5,independentExactChecks=result['passed'],sourceBytesUnchanged=True,
                       artifact={'path':str(artifact.relative_to(ROOT)),'bytes':artifact.stat().st_size,'sha256':sha(artifact.read_bytes())},
                       independent={'path':str((dest/'independent-check.json').relative_to(ROOT)),'sha256':sha((dest/'independent-check.json').read_bytes())})
    except Exception as error:
        receipt['error']=type(error).__name__+': '+str(error)
    receipt['elapsedSeconds']=time.monotonic()-start;receipt['finishedUTC']=datetime.now(timezone.utc).isoformat();write(dest/'receipt.json',receipt)
    print(json.dumps(receipt,ensure_ascii=False,indent=2))
    if receipt['status']!='PASS':sys.exit(1)

if __name__=='__main__':main()
