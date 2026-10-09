"""80-digit independent integration of the actual C.2 first-patch map.

The discrepancy is the one actually produced by C.12, not a planted bump vector.
The reference uses mpmath adaptive integration in each bump's local coordinate;
the browser implementation uses a Gauss rule in physical X.
"""
import hashlib
import json
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
try:
    import mpmath as mp
except ModuleNotFoundError:
    sys.path.insert(0,str(HERE.parents[1]/'arithmetic'/'vendor'))
    import mpmath as mp
mp.mp.dps=80
fixture=json.loads((HERE/'source-radial-modulation-fixtures.json').read_text())
mf=lambda x:mp.mpf(float(x))
checks=[]
def check(name,passed,**detail):checks.append({'name':name,'pass':bool(passed),'detail':detail})
def text(x):return mp.nstr(x,65)
def sp(t):
    if t<=0 or t>=1:return mp.mpf(0)
    z=-1/t**2+1/(1-t)**2;v=mp.exp(-abs(z))
    return v/(1+v)**2*(2/t**3+2/(1-t)**3)
def integral(f):return mp.quad(f,[0,mp.mpf('.1'),mp.mpf('.3'),mp.mpf('.5'),mp.mpf('.7'),mp.mpf('.9'),1])
r0=fixture['small'];beta=mf(r0['inputContract']['beta']);jump=mf(r0['inputContract']['jump'])
K=mf(r0['parameters']['powerAmplitude'])*mp.exp(jump)
supports=r0['slices'][0]['repair']['supports']
A=mp.matrix(5,5);Q=[[mp.mpf(0) for _ in range(5)] for _ in range(5)]
for j,support in enumerate(supports):
    a,b=map(mf,support);width=b-a
    X=lambda t:a+width*t
    if j<2:
        A[0,j]=integral(sp)
        A[2,j]=integral(lambda t:mp.sqrt(2*X(t))*K*X(t)**beta*sp(t))
        Q[3][j]=integral(lambda t:sp(t)**2/width)
    else:
        A[1,j]=integral(lambda t:mp.sqrt(2*X(t))*sp(t))
        A[3,j]=-integral(lambda t:K*X(t)**beta*sp(t))
        A[4,j]=integral(lambda t:K*X(t)**(beta-1)*sp(t))
        Q[3][j]=-integral(lambda t:sp(t)**2/width)/2
        Q[4][j]=integral(lambda t:sp(t)**2/(width*X(t)))/2
def apply(c):return A*c+mp.matrix([sum(Q[k][j]*c[j]**2 for j in range(5)) for k in range(5)])
def jac(c):return mp.matrix([[A[k,j]+2*Q[k][j]*c[j] for j in range(5)] for k in range(5)])
for name in ['small','large']:
    r=fixture[name];s=r['slices'][0];reported=s['repair']['linearMap'];c=mp.matrix(list(map(mf,s['repair']['coefficients'])))
    debt=mp.matrix(list(map(mf,s['momentDebt']['moments'])));ce=mp.matrix(list(map(mf,s['repair']['coefficientEta'])));de=mp.matrix(list(map(mf,s['momentDebt']['eta'])))
    for k in range(5):
        for j in range(5):
            err=abs(A[k,j]-mf(reported[k][j]));check(f'{name}: independent matrix row={k}, col={j}',err<mp.mpf('3e-12')*max(1,abs(A[k,j])),absoluteDifference=text(err))
    residual=apply(c)+debt;etaResidual=jac(c)*ce+de
    for k in range(5):
        check(f'{name}: actual nonlinear correction row={k}',abs(residual[k])<mp.mpf('3e-11'),residual=text(residual[k]))
        check(f'{name}: implicit eta derivative row={k}',abs(etaResidual[k])<mp.mpf('3e-11'),residual=text(etaResidual[k]))
detU=mp.det(mp.matrix([[A[0,0],A[0,1]],[A[2,0],A[2,1]]]))
detE=mp.det(mp.matrix([[A[k,j] for j in range(2,5)] for k in [1,3,4]]))
check('fixed positive lambda two-U block is nonsingular',abs(detU)>mp.mpf('1e-4'),determinant=text(detU))
check('three-E block is nonsingular',abs(detE)>mp.mpf('1e-6'),determinant=text(detE))
smallDebt=mp.matrix(list(map(mf,fixture['small']['slices'][0]['momentDebt']['moments'])))
linearOnly=mp.lu_solve(A,-smallDebt);omittedQuadratic=apply(linearOnly)+smallDebt
check('negative control: dropping nonlinear terms fails actual small-N debt',max(map(abs,omittedQuadratic))>mp.mpf('1e-6'),residual=[text(x) for x in omittedQuadratic])
degenerate=mp.matrix(2,2)
for j,support in enumerate(supports[:2]):
    a,b=map(mf,support)
    degenerate[0,j]=integral(sp)
    degenerate[1,j]=integral(lambda t:mp.sqrt(2*(a+(b-a)*t))*K*(a+(b-a)*t)**(-mp.mpf(1)/2)*sp(t))
degenerateDet=mp.det(degenerate)
check('negative control: lambda=0 makes the two source U weights dependent',abs(degenerateDet)<mp.mpf('1e-70'),determinant=text(degenerateDet),matrix=[[text(degenerate[k,j]) for j in range(2)] for k in range(2)],reason='The independently integrated rows use 1 and sqrt(2X) K X^(-1/2); their exact algebraic proportionality predicts a singular block. The 80-digit integration checks this prediction, not an interval rank certificate.')
report={'schema':'MathScope.C2IndependentContinuousMapReference/1','precisionDecimalDigits':80,'referenceEngine':f'mpmath {mp.__version__}',
        'sourceHashes':{n:hashlib.sha256((HERE/n).read_bytes()).hexdigest() for n in ['source-radial-modulation.mjs','source-radial-modulation-fixtures.json','independent-source-correction.py']},
        'source':'PDF 162: first-patch two-U/three-E moment map, actual linear plus quadratic changes',
        'scope':'Independent correction-map quadrature at the actual computed discrepancy and coefficients. The original modulated infinite-profile witness and a uniform interval-Newton proof are not certified.',
        'matrix':[[text(A[k,j]) for j in range(5)] for k in range(5)],'quadraticDiagonal':[[text(x) for x in row] for row in Q],
        'checks':checks,'passed':sum(c['pass'] for c in checks),'total':len(checks),'fullProfileCertified':False,'continuousIntervalNewtonCertified':False}
(HERE/'source-correction-independent.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':report['passed'],'total':report['total'],'failures':[c for c in checks if not c['pass']]},indent=2))
raise SystemExit(0 if report['passed']==report['total'] else 1)
