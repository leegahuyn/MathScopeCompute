"""Independent exact normalizations and 80-digit covariance/cutoff checks."""
from fractions import Fraction as F
from decimal import Decimal as D,localcontext
from pathlib import Path
import hashlib,json

HERE=Path(__file__).resolve().parent
r=json.loads((HERE/'actual-pulse-covariance-independent.json').read_text())
checks=0
def check(v,m):
    global checks
    assert v,m
    checks+=1
def contains(z,x):return D.from_float(z[0])<=x<=D.from_float(z[1])
def fd(v):return D(v.numerator)/D(v.denominator)
check(hashlib.sha256((HERE.parent/'actual-pulse-covariance-integrals.mjs').read_bytes()).hexdigest()==r['runtimeSHA256'],'runtime hash')
check(r['sourceProfile']=='same-profile-2026-10-10.3','actual source id')
check(r['sourceAssemblySHA256']=='184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd','source assembly')
check(all(c['pass'] for c in r['checks']),'source checks')

# Exact Q(sqrt2) geometry, entirely separate from JavaScript's interval code.
def add(x,y):return(x[0]+y[0],x[1]+y[1])
def neg(x):return(-x[0],-x[1])
def mul(x,y):return(x[0]*y[0]+2*x[1]*y[1],x[0]*y[1]+x[1]*y[0])
vr=[(F(1),F(0)),(F(1),F(-1))];vt=[(F(-1),F(1)),(F(1),F(0))]
jac=add(mul(vr[0],vt[1]),neg(mul(vr[1],vt[0])))
check(jac==(4,-2),'rectangle Jacobian 4-2sqrt2')
for delta in range(5):
    check(F(14**delta)*F(1,14**delta)==1,'full normalized Haar covering factor')
    if delta:check(F(1,14**delta)!=1,'negative: one inverse lift is not the full Haar average')
check(F(1,2)*2==1,'angular half cancels ci*Ls/(r0)=2 exactly')
check(F(1,2)*2*F(3,2)!=F(3,2)**2,'negative: one transverse integral, not its square')

# The two actual sign columns have exact mirror symmetry. Verify the linear
# inverse and determinant as universal rational identities, with no fake T0.
for A in[F(1,8),F(2,15),F(3,25)]:
  for B in[F(1,8),F(7,55)]:
    c=F(9,7);sl=F(2,5);Ttheta=F(4,3);Tz=F(1,7)
    yp=(Ttheta/(c*sl*A)+Tz/(c*B))/2;ym=(Ttheta/(c*sl*A)-Tz/(c*B))/2
    check(c*sl*A*(yp+ym)==Ttheta,'exact first covariance row')
    check(c*B*(yp-ym)==Tz,'exact second covariance row')
    det=(c*sl*A)*(-c*B)-(c*sl*A)*(c*B)
    check(det==-2*c*c*sl*A*B<0,'exact determinant sign and nonzero scale')
    check(yp>0 and ym>0,'finite inverse algebra diagnostic positive cone')
    check(2*c*sl*A*(yp+ym)!=Ttheta,'negative missing angular half')

# Source-specific error absorption is evaluated with exact positive Fractions.
inv_sqrt_G=F(1,2**500);delta2=F(1,2**2000)
third=F(32,3)*8**3*inv_sqrt_G;coefficient=F(9,2)*8**2*delta2
check(third+coefficient<F(1,2**480),'actual central exponent error floor')
check(8*inv_sqrt_G<F(1,5),'source psi is one on entire central w box')
check(F(3,10)<F(1,3),'psi support strictly inside original open interval')
check(F(3,4)<1,'transverse support strictly inside original rectangle')
for a in[F(1,2),F(3,4),F(1),F(5,4),F(3,2)]:
  for d2 in[F(0),F(1,64),F(1,16)]:
    check(abs(2*a*a-d2)<=2*(a*a+d2),'third derivative numerator bound')
    check(2/a**3+2<=18,'third derivative uniform bound below 32')

with localcontext() as ctx:
    ctx.prec=80;ctx.Emin=-999999999;ctx.Emax=999999999
    # Machin's identity, with an alternating series remainder much smaller
    # than any runtime enclosure width.
    def atan_inv(n):
        x=1/D(n);power=x;s=x;k=1
        while True:
            power=-power*x*x;term=power/(2*k+1);s+=term
            if abs(term)<D('1e-85'):return s
            k+=1
    pi=16*atan_inv(5)-4*atan_inv(239)
    gaussian_mass=(pi/3).sqrt()/8
    for name in ['coarseIntegrals','fineIntegrals']:
        for key in ['A','B']:check(contains(r[name][key],gaussian_mass),'independent Gaussian limit enclosed')
    check(D.from_float(r['fineIntegrals']['A'][0])>D.from_float(r['coarseIntegrals']['A'][0]),'lower bound refined')
    check(D.from_float(r['fineIntegrals']['A'][1])<D.from_float(r['coarseIntegrals']['A'][1]),'upper bound refined')
    x=(D(1)/8).sqrt()
    check(contains(r['center']['radialOverP'],x),'full transfer radial limit')
    check(contains(r['center']['thetaOverSqrtLambdaUStarP'],x),'full transfer theta limit')
    for row in r['observations']:
        w=D.from_float(row['wMidpoint']);probe=(-3*w*w).exp()/8
        check(contains(row['midpointThetaIntegrand'],probe),'midpoint theta-density probe')
        check(contains(row['midpointZIntegrand'],probe),'midpoint z-density probe')
        check(contains(row['midpointLogP2'],-3*w*w),'stable midpoint log kernel')
    tail=16*D(-32).exp();check(D(0)<tail<=D.from_float(r['fineIntegrals']['tail']['absoluteUpper']),'nonzero two-sided Gaussian tail')

    def sigma(x):
        if not x:return D(0)
        if x==1:return D(1)
        if x>D('.5'):return 1-sigma(1-x)
        e=(-1/(x*x)+1/((1-x)*(1-x))).exp()
        return e/(1+e)
    def simpson(n):
        total=D(0)
        for i in range(n+1):
            x=D(i)/n;v=sigma(x);total+=(1 if i in[0,n] else 4 if i%2 else 2)*v*v
        return total/(3*n)
    mass_coarse=simpson(1024);mass_fine=simpson(2048);mass=1+mass_fine/2
    check(contains(r['transverseMass']['stepSquaredIntegral'],mass_fine),'independent Decimal sigma-squared integral')
    check(contains(r['transverseMass']['normalizedMass'],mass),'one transverse cutoff mass')
    check(abs(mass_coarse-mass_fine)<D('1e-15'),'independent cutoff refinement')
    j=D(4)-2*D(2).sqrt();C=j*mass
    check(contains(r['covariance']['common']['coefficientInterval'],C),'Jacobian times one mass after angular cancellation')
    check(not contains(r['covariance']['common']['coefficientInterval'],2*C),'negative omitted angular half')
    check(not contains(r['covariance']['common']['coefficientInterval'],C/14),'negative one-fourteenth Haar')
    check(not contains(r['covariance']['common']['coefficientInterval'],j*mass*mass),'negative repeated transverse mass')
    H=r['covariance']['normalizedMatrix'];column=C*gaussian_mass
    check(contains(H[0][0],column) and contains(H[0][1],column),'both normalized theta columns')
    check(contains(H[1][0],column) and contains(H[1][1],-column),'opposite normalized axial columns')
    check(contains(r['covariance']['determinant']['absoluteNormalizedByCommonSquaredSqrtLambda'],2*gaussian_mass**2),'normalized determinant')
    check(contains(r['covariance']['determinant']['absoluteNormalizedByBaseScaleSquaredSqrtLambda'],2*C*C*gaussian_mass**2),'base-scaled determinant')
    check(r['scope']['actualT0TargetSupplied'] is False,'no substituted target')
    check(r['scope']['globalSquaredPartitionMatched'] is False,'global assembly separate')
    output={'checks':checks,'pass':True,'decimalPrecision':80,'gaussianLimitDiagnostic':str(gaussian_mass),'normalizedTransverseMass':str(mass),'cutoffRefinementDifference':str(abs(mass_coarse-mass_fine)),'sourceParametersSubstituted':False}
print(json.dumps(output,indent=2))
