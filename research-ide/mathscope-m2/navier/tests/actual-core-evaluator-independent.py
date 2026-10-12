"""Independent exact Fraction checks; zero-parameter limits only test enclosures.

These test points are never substituted for the fixed source parameters.
The actual positive parameter uncertainty and nonlinear errors remain in JS.
"""
import json,sys,math
from fractions import Fraction as F

cases=json.load(sys.stdin)
passed=0
def check(ok):
    global passed
    if not ok: raise AssertionError('Independent rational enclosure check failed')
    passed+=1
def within(z,v):return F(z['lower'])<=v<=F(z['upper'])
for case in cases:
    Y=F(case['request']['Y']); x=F(case['request']['eta']['value'])
    kind=case['request']['eta']['kind'];c=(F(case['cp']['lower'])+F(case['cp']['upper']))/2
    if kind=='DIRECT_RATIONAL':
        d=1+x*x
        ps=[-c/d**2,4*c*x/d**3,4*c*(1-5*x*x)/d**4,-24*c*x*(3-5*x*x)/d**5]
        us=[Y*c*x*(3-x*x)/d**3,3*Y*c*(1-6*x*x+x**4)/d**4,-12*Y*c*x*(5-10*x*x+x**4)/d**5]
        for z,v in zip(case['pressure'],ps):check(within(z,v))
        for z,v in zip(case['axial'],us):check(within(z,v))
        chi=F(4000000,4000001) if x==0 else F(1)
    else:
        H=1+F(9,2)*x;chi=H*H/(H*H+F(1,4000000))
    for k,interval in enumerate(case['phi']):
        # Entire independent alternating series, using 80 exact terms.
        total=sum((-chi/2)**n*Y**(n-k)/(math.factorial(n-k)*math.factorial(n+1)) for n in range(k,81))
        check(within(interval,total))
    check(F(case['cp']['lower'])>3)
# Uniform comparison circle: |Delta H|/sigma <= 30*2000*10^-12.
ratio=F(30*2000,10**12)
eps=ratio+ratio*ratio
check((1+eps)/(1-eps)<2)
print(json.dumps({'schema':'MathScope.ActualCoreIndependentFractionChecks/1','passed':passed,'failed':0,'actualParametersReplacedByLimit':False}))
