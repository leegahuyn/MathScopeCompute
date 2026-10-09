"""Independent 160-digit Bessel/angle-integral audit of the C.1 interval engine.

This does not import the JS recurrence into the reference computation. The binary64
input values and interval endpoints are converted exactly to mpmath. The source
mean/variance are evaluated via mpmath's special function and separate quadrature.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

HERE=Path(__file__).resolve().parent
try:
    import mpmath as mp
except ModuleNotFoundError:
    # Reuse the already pinned independent arithmetic reference dependency.
    sys.path.insert(0,str(HERE.parents[1]/'arithmetic'/'vendor'))
    import mpmath as mp
mp.mp.dps=160
zs=[0,1e-16,1e-8,.01,.5,1,5,20,100,300,-100]
vs=[(0,.2,.75),(2,0,.75),(2,1e-16,.75),(2,-1e-16,.75),(2,1e-9,.75),
    (2,-1e-9,.75),(2,.2,.75),(4,-.2,.75),(5,4,.5),(6,49,.1)]
payload=json.dumps({'zs':zs,'vs':vs})
script="""
import {meanExponentialCertificate,varianceCertificate} from './admissible-loop.mjs';
const p=JSON.parse(process.argv[1]);
console.log(JSON.stringify({I0:p.zs.map(z=>({z,result:meanExponentialCertificate(z)})),
 V:p.vs.map(([mu,p,d0])=>({mu,p,d0,result:varianceCertificate(mu,p,d0)}))}));
"""
r=subprocess.run(['node','--input-type=module','-e',script,payload],cwd=HERE,capture_output=True,text=True,check=True)
values=json.loads(r.stdout)
checks=[]
def add(name,passed,**detail):checks.append({'name':name,'pass':bool(passed),'detail':detail})
def mf(x):return mp.mpf(float(x))
def show(x):return mp.nstr(x,75)
for item in values['I0']:
    z=mf(item['z']);ref=mp.besseli(0,z);lo,hi=map(mf,item['result']['value'])
    add(f'I0 enclosure z={item["z"]}',lo<=ref<=hi,reference=show(ref),lower=show(lo),upper=show(hi))
for item in values['V']:
    mu,p,d0=map(mf,[item['mu'],item['p'],item['d0']]);z=mu*p
    ref=d0*d0*mu*mu/2 if p==0 else d0*d0*mp.expm1(mp.log(mp.besseli(0,2*z))-2*mp.log(mp.besseli(0,z)))/(p*p)
    lo,hi=map(mf,item['result']['value'])
    add(f'variance enclosure mu={item["mu"]}, p={item["p"]}',lo<=ref<=hi,reference=show(ref),lower=show(lo),upper=show(hi))
    if abs(z)<=20:
        t=lambda th: d0*mu*mp.sin(th) if p==0 else d0*mp.expm1(z*mp.sin(th)-mp.log(mp.besseli(0,z)))/p
        q=mp.quad(lambda th:t(th)**2,[0,mp.pi/2,mp.pi,3*mp.pi/2,2*mp.pi])/(2*mp.pi)
        add(f'independent angle variance mu={item["mu"]}, p={item["p"]}',abs(q-ref)<mp.mpf('1e-90')*max(1,abs(ref)),absoluteDifference=show(abs(q-ref)))
        mean=mp.quad(t,[0,mp.pi/2,mp.pi,3*mp.pi/2,2*mp.pi])/(2*mp.pi)
        add(f'independent angle mean mu={item["mu"]}, p={item["p"]}',abs(mean)<mp.mpf('1e-90'),absoluteMean=show(abs(mean)))
report={'schema':'MathScope.NavierC1IndependentReference/1','precisionDecimalDigits':160,
        'referenceEngine':f'mpmath {mp.__version__}',
        'method':'Bessel special function plus independent adaptive angle quadrature; exact conversion of binary64 endpoints',
        'sourceHashes':{n:hashlib.sha256((HERE/n).read_bytes()).hexdigest() for n in ['admissible-loop.mjs','independent-loop-reference.py']},
        'passed':sum(x['pass'] for x in checks),'total':len(checks),'checks':checks,
        'fullProfileCertified':False,'newLeanKernelRun':False}
(HERE/'independent-loop-reference.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':report['passed'],'total':report['total'],'failures':[x for x in checks if not x['pass']]},indent=2))
raise SystemExit(0 if report['passed']==report['total'] else 1)
