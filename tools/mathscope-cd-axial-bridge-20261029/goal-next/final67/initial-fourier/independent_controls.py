"""Independent exact finite physical-Fourier checks; not a source-field evaluation."""
from fractions import Fraction as Q
from pathlib import Path
import json,hashlib

def norm2(z):return z[0]*z[0]+z[1]*z[1]
def add(a,b):return (a[0]+b[0],a[1]+b[1])
# Two 2*pi-periodic real Cartesian-component examples: u_n conjugate-symmetric.
c={1:(Q(1,3),Q(1,2)),2:(Q(-2,7),Q(3,5)),5:(Q(4,9),Q(1,7))}
coeff={0:(Q(7),Q(0))}
for n,z in c.items():coeff[n]=z;coeff[-n]=(z[0],-z[1])
full=sum((n*n*norm2(v) for n,v in coeff.items()),Q(0))
rows=[]
for K in (0,1,3,7):
 tail=sum((norm2(v) for n,v in coeff.items() if abs(n)>K),Q(0));bound=full/(K+1)**2
 assert tail<=bound
 rows.append({'N':K,'tailEnergy':str(tail),'derivativeEnergy':str(full),'bound':str(bound)})
# The constant u=e_r is constant in the cylindrical frame but Cartesian u_x=cos(theta).
# Omitting the rotating-frame shift therefore wrongly predicts no positive Cartesian mode.
assert norm2((Q(1,2),Q(0)))+norm2((Q(1,2),Q(0)))==Q(1,2)
# Equal-frequency coefficients must be added before the squared modulus.
a,b=(Q(1),Q(0)),(Q(1),Q(0));assert norm2(add(a,b))==4 and norm2(a)+norm2(b)==2
# A single mode K+1 saturates the normalized H1 Fourier-tail estimate.
for K in range(8):
 single={K+1:(Q(1,2),Q(0)),-(K+1):(Q(1,2),Q(0))}
 tail=sum((norm2(v) for n,v in single.items() if abs(n)>K),Q(0))
 gradient=sum((n*n*norm2(v) for n,v in single.items()),Q(0))
 assert tail==gradient/(K+1)**2==Q(1,2)
# Modes at arbitrarily large k share sup |f|=1, so an L-infinity bound alone
# cannot certify a vanishing fixed-cutoff Fourier tail for f.
K=7;k=K+1;cosine_tail=norm2((Q(1,2),Q(0)))+norm2((Q(1,2),Q(0)));assert k>K and cosine_tail==Q(1,2)
payload={'schema':'MathScope.N8.InitialAngularTailIndependentRationalControls/1','finitePhysicalFourierCases':rows,'singleModeSharp':True,'equalFrequencyAmplitudeAggregation':{'correct':4,'wrongSeparateEnergies':2},'cartesianFrameRotationCounterexample':True,'forceSupremumOnlyCounterexample':{'mode':k,'fixedCutoff':K,'tailEnergy':str(cosine_tail)},'actualFieldOrNewLeanProved':False}
p=Path(__file__).with_name('independent-controls.json');p.write_text(json.dumps(payload,indent=2)+'\n');print('PASS rational Fourier controls and frame/alias/force counterexamples; synthetic only')
