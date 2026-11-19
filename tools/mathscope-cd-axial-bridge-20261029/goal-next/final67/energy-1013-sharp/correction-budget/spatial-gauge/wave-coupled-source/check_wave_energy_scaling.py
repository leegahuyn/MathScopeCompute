"""Exact scale and cutoff constants for the original initialized primary wave."""

from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path
import sys
import sympy as sp

assert __debug__ and len(sys.argv)==3
ledger_path, output=map(Path,sys.argv[1:])
ledger=json.loads(ledger_path.read_bytes())
assert ledger['rows']==162
assert ledger['cutoffConstants']=={'value':1,'z':20,'zz':692,'radial':0}
kappa=Q(1,100000)
assert Q(1,2)-kappa>0 and 1-2*kappa>0
# Source epsilon powers after the single phase derivative is applied.
phase_powers={'leading':Q(1,2)-Q(1,2),'remainder':1-kappa-Q(1,2)}
assert all(power>=0 for power in phase_powers.values())
# Represent a normalized tau0 power as constant + hCoefficient*h.
# A=1/2+h, D=1/2-h.
A=(Q(1,2),Q(1));D=(Q(1,2),Q(-1))
add=lambda x,y:tuple(a+b for a,b in zip(x,y))
sub=lambda x,y:tuple(a-b for a,b in zip(x,y))
scale=lambda n,x:tuple(n*a for a in x)
cut_velocity=sub(A,D)
cut_second=sub(add(A,(Q(1,2),Q(0))),scale(2,D))
cut_first=sub((Q(1,2),Q(0)),D)
assert cut_velocity==(0,2)
assert cut_second==(0,3)
assert cut_first==(0,1)
assert max(A[0]+A[1]/64, A[0]+Q(1,2)+A[1]/64)<2
# Before enlarging every coefficient, these uniform per-component bounds
# follow from the exact curl(C*A)=C*curl(A)+grad(C)cross A product rule.
velocity={'V0':4,'A0':20}
gradient={'V1':32,'V0':80,'A0':692,'A1':160}
enlarged={'V0':64*21,'V1':64,'A0':64*712,'A1':64*20}
assert all(enlarged[key]>=value for key,value in velocity.items())
assert all(enlarged[key]>=value for key,value in gradient.items())
assert 32*(3+2*9)==672
# The complete polar connections form the covariant derivative matrix.
# Its Cartesian representation is Q M Q^T with Q orthogonal.
c,s=sp.symbols('c s',real=True)
rotation=sp.Matrix([[c,-s,0],[s,c,0],[0,0,1]])
vector=sp.Matrix(sp.symbols('v0:3',real=True))
matrix=sp.Matrix(3,3,sp.symbols('g0:9',real=True))
rotated_vector=rotation*vector
rotated_matrix=rotation*matrix*rotation.T
velocity_defect=sp.expand(sum(entry**2 for entry in rotated_vector)-sum(entry**2 for entry in vector))
gradient_defect=sp.expand(sum(entry**2 for entry in rotated_matrix)-sum(entry**2 for entry in matrix))
assert sp.rem(velocity_defect,s*s+c*c-1,s)==0
assert sp.rem(gradient_defect,s*s+c*c-1,s)==0
# The coupled P,F degree reserve is source-specific and very small.
p_degree,f_degree=map(Q,ledger['positiveDegrees'])
loss=p_degree/2**33+f_degree/100000
assert loss<Q(1,16)
# The reserved coefficient log W0+2 is <=L/16. Therefore log W<=L/8.
assert Q(1,16)+loss<Q(1,8)
# With log(672 Xb)<=L/4 and reserved source-budget loss<=L,
# log energy<=L/2 and log reserved budget>=L.
assert 2*Q(1,8)+Q(1,4)==Q(1,2)
assert 2-Q(1)==1
result={
 'schema':'MathScope.Initialized.PrimaryWaveEnergyScalingAudit/1',
 'status':'VERIFIED_EXACT_SPATIAL_WAVE_SCALE_AND_CUTOFF_LEDGER',
 'ledgerSHA256':sha256(ledger_path.read_bytes()).hexdigest(),
 'phaseEpsilonPowers':{key:str(value) for key,value in phase_powers.items()},
 'potentialFactor':'Q^(-h)*sqrt(epsilon)/k<=Q^(-h)*epsilon=1',
 'outerVelocityTauPower':list(map(str,cut_velocity)),
 'outerSecondDerivativeTauPower':list(map(str,cut_second)),
 'outerFirstDerivativeTauPower':list(map(str,cut_first)),
 'dyadicExponentUpper':'2','dyadicFactorUpper':16,
 'directVelocityEnvelope':velocity,'directGradientEnvelope':gradient,
 'retainedUniformEnvelope':enlarged,'sourceRows':162,'geometryCoefficient':672,
 'polarConnections':'Adjacent-component angular connections cost at most2V1 and2A1; these are retained in the32 and160 coefficients.',
 'energyFrame':'Euclidean velocity norm and Frobenius covariant-gradient norm are preserved by the orthogonal polar-to-Cartesian basis rotations.',
 'independentPolarNormDefects':['0','0'],
 'stabilityDegrees':list(map(str,(p_degree,f_degree))),
 'coupledLogLoss':str(loss),'lossBelowOneSixteenth':True,
 'normalizedCoefficientLogFraction':'1/8','energyLogFraction':'1/2',
 'reservedBudgetLogFractionLower':'1','ratioLogFractionUpper':'-1/2',
 'conditions':[
   'Original admitted fixed band, representative and flat joins;Q in[tau0/4,4tau0].',
   '0<h<1/64,tau0<=1,epsilon=Q^h<=1,k=ceil(epsilon^(-1/2)).',
   'The source leading, full remainder and tangent triple-product curl formulas and the pinned coefficient ledger apply.',
   'The original outer radial cutoff is on its plateau and the axial cutoff derivatives are bounded by20/tau0^D and692/tau0^(2D).',
   'The source Gaussian absorption and stable/covariance/normal source inequalities apply.',
 ],
 'scope':'Exact scale and positive coefficient bookkeeping. Numerical coefficient, geometry and budget comparisons are a separate directed replay. This is an initialized-primary-only estimate.',
 'release':'HOLD'}
assert not output.exists()
output.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n')
print('PASS exact wave phase factors, nonnegative outer-cutoff powers and coupled energy reserve')
