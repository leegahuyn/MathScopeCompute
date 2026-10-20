"""Independent small source-formula numerical audit, not a global proof.

Uses high-precision differentiation of the literal original exp quotient rather
than the reviewed module's polynomial/range/quotient-recursion implementation.
"""
from fractions import Fraction as Q
from pathlib import Path
import hashlib
import importlib.util
import json
import sys
import time
import mpmath as mp

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT/'MathScopeCompute/research-ide/mathscope-m3/recovery-20261019/outer_cutoff.py'
spec = importlib.util.spec_from_file_location('reviewed_outer_cutoff', MODULE)
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)
mp.mp.dps = 160
code_sha_before = hashlib.sha256(MODULE.read_bytes()).hexdigest()
start = time.monotonic()

def mq(value):
    value = Q(value)
    return mp.mpf(value.numerator)/value.denominator

def chi(s):
    if s <= mp.mpf('0.5'):
        return mp.mpf(1)
    if s >= 1:
        return mp.mpf(0)
    u = 2*s-1
    return mp.exp(-1/(1-u))/(mp.exp(-1/u)+mp.exp(-1/(1-u)))

checks = []
def contained(label, value, interval, **context):
    lo, hi = mq(interval.lo), mq(interval.hi)
    # Only zero-width analytical identities receive a numerical roundoff
    # allowance; the exact identity is separately checked in the code review.
    if interval.lo == interval.hi:
        passed = abs(value-lo) < mp.mpf('1e-120')
        method = 'exact identity cross-check, 1e-120 numerical tolerance'
    else:
        passed = lo <= value <= hi
        method = 'strict containment in rational interval'
    checks.append({'label':label, 'status':'PASS' if passed else 'FAIL',
                   'reference':mp.nstr(value,100),
                   'interval':[str(interval.lo),str(interval.hi)],
                   'check_method':method, **context})

point_strings = ['0.49','0.5','0.5001','0.51','0.55','0.625',
                 '0.7','0.7499','0.75','0.7501','0.8','0.875',
                 '0.95','0.99','0.9999','1','1.1']
for text in point_strings:
    point = Q(text)
    jets = m.chi_jets(point,point,80)
    for order in range(4):
        reference = mp.diff(chi,mq(point),order)
        contained('chi_point',reference,jets[order],s=str(point),order=order)

intervals = [('0.49','0.51'),('0.5','0.6'),('0.6','0.8'),
             ('0.7','0.9'),('0.95','1.01'),('0.5','1')]
for lower,upper in intervals:
    low, high = Q(lower),Q(upper)
    jets = m.chi_jets(low,high,80)
    for fraction in [Q(0),Q(1,4),Q(1,2),Q(3,4),Q(1)]:
        sample = low+(high-low)*fraction
        for order in range(4):
            contained('chi_interval_sample',mp.diff(chi,mq(sample),order),
                      jets[order],s=str(sample),domain=[str(low),str(high)],order=order)

cutoff = m.ActualOuterCutoff(repo=ROOT/'MathScopeCompute')
def normalized_c(s,zeta,rho):
    # s is the physical radial squared variable: pinned r0=1.
    # zeta=z/z0, rho=tau/tau0; the tested values are coefficients
    # multiplying z0**(-b) tau0**(-c), not substituted physical scales.
    return chi(2*s)*chi(2*zeta*zeta)*chi(rho)

domains = [
    ('active_point',[('1/2','1/2'),('1/4','1/4'),('3/5','3/5'),('7/10','7/10')]),
    ('active_box',[('12/25','13/25'),('23/100','27/100'),('57/100','63/100'),('17/25','73/100')]),
    ('plateau',[('1/4','1/4'),('0','0'),('1/4','1/4'),('1/4','1/4')]),
    ('zero_radial',[('3/4','3/4'),('0','0'),('0','0'),('7/10','7/10')]),
    ('zero_time_seam',[('1/2','1/2'),('1/4','1/4'),('3/5','3/5'),('1','1')]),
]
for domain_name,raw_intervals in domains:
    inputs = [m.I(Q(lo),Q(hi)) for lo,hi in raw_intervals]
    output = cutoff.evaluate(*inputs,bits=80)
    for position in [Q(0),Q(1,2),Q(1)]:
        x,y,zeta,rho = [v.lo+position*(v.hi-v.lo) for v in inputs]
        radial = x*x+y*y
        for atom,record in output['cutoff_jets'].items():
            orders = tuple(map(int,atom.split('@')[1].split(',')))
            actual = mp.diff(normalized_c,tuple(map(mq,(radial,zeta,rho))),orders)
            contained('cutoff_atom',actual,m.I(*map(Q,record['coefficient_interval'])),
                      atom=atom,domain=domain_name,sample=[str(x),str(y),str(zeta),str(rho)],
                      physical_scale={'z0_power':record['z0_power'],'tau0_power':record['tau0_power']})

precision_boundary = []
for bits in (4064,4065,4096):
    try:
        m.chi_jets(Q(7,10),Q(7,10),bits)
        precision_boundary.append({'bits':bits,'outcome':'RETURNED'})
    except Exception as exc:
        precision_boundary.append({'bits':bits,'outcome':'RAISED',
                                   'exception':type(exc).__name__,'message':str(exc)})

report = {
    'reviewer':'ChatGPT delegated independent source/math reviewer',
    'reviewed_file':str(MODULE),
    'reviewed_sha256_before':code_sha_before,
    'reviewed_sha256_after':hashlib.sha256(MODULE.read_bytes()).hexdigest(),
    'source_pins_verified_by_constructor':m.PINS,
    'method':'mpmath 160 decimal digits; independently differentiate literal source quotient; inspect enclosure membership',
    'mpmath_version':mp.__version__,
    'scope':'cutoff ordinary derivatives orders 0..3 and all 13 normalized C jet coefficients; selected rational points/boxes only',
    'limitations':['finite independent numerical audit does not prove every interval enclosure',
                   'does not compute any missing nonzero global potential, pressure, force, energy, or tail bound',
                   'does not complete N7-06, N8-05, M3, or M4; actual last-resolved tau remains null'],
    'manual_review':[
        'exp Taylor remainder bounds all remaining positive terms by a geometric majorant; reciprocal and repeated squaring are outward',
        'flat derivative recurrence P_next=v^2(P-Pprime) and monomial extrema at v=power/endpoints are correct through order 3',
        'denominator lower bound exp(-2), quotient ordinary derivative recursion, and chain factors 2^order are valid',
        'closed cutoff seams include all exact zero derivative values and source zero extension is handled before missing local fields',
        'C@ radial variable is x^2+y^2 and pinned r0=1; axial and tau scaling metadata and physical time sign convention are consistent'
    ],
    'precision_boundary_observations':precision_boundary,
    'checks':checks,
    'summary':{'passed':sum(r['status']=='PASS' for r in checks),
               'failed':sum(r['status']=='FAIL' for r in checks),
               'elapsed_seconds':time.monotonic()-start}
}
destination=Path(__file__).with_name('CUTOFF_INDEPENDENT_REVIEW.json')
destination.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'output':str(destination),'sha256':hashlib.sha256(destination.read_bytes()).hexdigest(),
                  'summary':report['summary'],'precision_boundary':precision_boundary},indent=2))
if report['summary']['failed'] or report['reviewed_sha256_before']!=report['reviewed_sha256_after']:
    raise SystemExit(1)
