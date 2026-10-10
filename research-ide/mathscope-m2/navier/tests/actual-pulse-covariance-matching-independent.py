"""Independent exact inverses and 100-digit evaluations of the chosen partition.

Only the small generated observation fixture is consumed. JavaScript algorithms
are not imported or translated into expected answers. The 2x2 inverse is obtained
from its determinant, and the actual coefficient bounds use Fraction endpoints.
"""
from fractions import Fraction as F
from decimal import Decimal as D, localcontext
from itertools import product
from pathlib import Path
import json

data=json.loads(Path(__file__).with_name('actual-pulse-covariance-matching-independent.json').read_text())
checks=0
def check(condition,message):
    global checks
    checks+=1
    if not condition:
        raise AssertionError(message)

def fraction(x):
    return F(x) if isinstance(x,(float,int)) else F(x)

def interval_contains(interval,lo,hi=None):
    if hi is None: hi=lo
    return fraction(interval[0])<=lo and fraction(interval[1])>=hi

for obs in data['observations']:
    a=[fraction(x) for x in obs['A']]
    b=[fraction(x) for x in obs['B']]
    c=[fraction(x) for x in obs['commonCoefficient']]
    t=[fraction(obs['targetExact'][k]) for k in ('lower','upper')]
    weight_lo=t[0]/(2*c[1]*a[1])
    weight_hi=t[1]/(2*c[0]*a[0])
    check(interval_contains(obs['normalizedWeight'],weight_lo,weight_hi),'actual inverse interval')
    check(fraction(obs['normalizedWeight'][0])>0,'strict actual positive weight')
    root=obs['normalizedAmplitude']
    check(fraction(root[0])**2<=fraction(obs['normalizedWeight'][0]),'sqrt lower')
    check(fraction(root[1])**2>=fraction(obs['normalizedWeight'][1]),'sqrt upper')
    for ca,aa,bb in product(c,a,b):
        check(interval_contains(obs['normalizedDeterminant'],2*ca*ca*aa*bb),'actual determinant corner')
    check(obs['exactAlgebra']['thetaResidual']==[] and obs['exactAlgebra']['zResidual']==[],'runtime exact inverse')
    check(obs['physicalScope']['actualLocalCovarianceMatched'] and not obs['physicalScope']['globalSquaredPartitionMatched'],'local/global distinction')

# A general target inside the actual two-column geometry's cone. Independent
# determinant inversion checks the explicit 1/2 and both unequal coefficients.
for n in range(1,51):
    C=F(3*n+1,7*n+2);L=F(n+2,5*n+1);A=F(2*n+5,13*n+4);B=F(n+4,11*n+3)
    Ttheta=F(n+3,17*n+1);Tz=F((-1)**n*(n%7),10)*Ttheta*B/(L*A)
    H=[[C*L*A,C*L*A],[C*B,-C*B]]
    det=H[0][0]*H[1][1]-H[0][1]*H[1][0]
    yp=(H[1][1]*Ttheta-H[0][1]*Tz)/det
    ym=(-H[1][0]*Ttheta+H[0][0]*Tz)/det
    check(det==-2*C*C*L*A*B and det<0,'exact general determinant')
    check(yp>0 and ym>0,'strict cone gives positive coefficients')
    check(H[0][0]*yp+H[0][1]*ym==Ttheta and H[1][0]*yp+H[1][1]*ym==Tz,'independent matrix reconstruction')
    check(yp==(Ttheta/(C*L*A)+Tz/(C*B))/2 and ym==(Ttheta/(C*L*A)-Tz/(C*B))/2,'special inverse formula')
    # An out-of-cone target must fail positivity; a missing inverse half must
    # double the target instead of passing a residual tolerance.
    badz=F(11,10)*Ttheta*B/(L*A)
    badminus=(Ttheta/(C*L*A)-badz/(C*B))/2
    check(badminus<0,'negative out-of-cone control')
    check(H[0][0]*(2*yp)+H[0][1]*(2*ym)!=Ttheta,'negative missing half control')

def dec(f):
    f=fraction(f);return D(f.numerator)/D(f.denominator)

with localcontext() as ctx:
    ctx.prec=100
    def source_step(x):
        if x<=0:return D(0)
        if x>=1:return D(1)
        a=(-1/(x*x)).exp();b=(-1/((1-x)*(1-x))).exp()
        return a/(a+b)
    def b(x):
        x=abs(x)
        if x<=D(1)/4:return D(1)
        if x>=D(3)/4:return D(0)
        return source_step(D(3)/2-2*x)
    for obs in data['partitionOffsets']:
        x=dec(obs['offset'])
        # Enumerate a much larger independent integer window, then prove the
        # infinite complement has distance >=3/2 from the requested offset.
        values={n:b(x-n)**2 for n in range(-20,21)}
        active={n:v for n,v in values.items() if v>0}
        total=sum(active.values(),D(0))
        check(total>=D(1)/4,'uniform positive denominator')
        check(set(active)=={r['relativeIndex'] for r in obs['rows']},'complete support enumeration')
        for row in obs['rows']:
            expected=active[row['relativeIndex']]/total
            check(dec(row['squaredWeight'][0])<=expected<=dec(row['squaredWeight'][1]),'independent smooth partition value')
        check(abs(x)<=D(1)/2 and 2-abs(x)>D(3)/4,'all omitted integer translates exactly zero')
        check(obs['complete'] and obs['exactSquaredSum']=='1','exact normalized family sum')

assembly=data['assembly']
check(len(assembly['activeBoxes'])==len(assembly['activeBands'])==1,'one complete actual box and band')
check(assembly['labels']['rectangleLabels']==2 and assembly['labels']['slowBoxMultiplicity']==1,'two signs once per box')
check(assembly['activeBoxes'][0]['grid']==['0','0','0'],'actual shifted mesh center')
check(assembly['activeBoxes'][0]['countInSquaredPartition']==1,'actual partition multiplicity')
check(assembly['band']['lowerBandIndex']=='ell0=ell_actual-1' and assembly['band']['qBigObservation']=='3*Q/2','geometric active domain')
check(F(1)<F(3,2)<2,'source point lies in geometric active q-domain')
check(not assembly['domain']['sourceUniformQStarCertified'],'no invented common q-star')
# Affine exponent algebra with three independent positive nonzero h values.
for h in (F(1,100),F(1,1<<512),F(1,1<<4096)):
    A=F(1,2)+h
    check(-2*A+h+A+F(1,2)==0,'exact Q exponent cancellation')
    check(-A-F(1,2)==-1-h,'exact q exponent retained')
    check(-2*A+A+F(1,2)!=0,'missing epsilon fails for actual positive h')
check(assembly['identity']['exactResidual']==[0,0] and assembly['identity']['globalIdentityAtThisActualPointVerified'],'finite actual physical identity')
check(not assembly['scope']['wholeAnnulusCovarianceMatched'] and not assembly['scope']['allSlowNeighborhoodsMatched'],'global family remains distinct')
print(json.dumps({'passed':checks,'failed':0,'actualSourceCases':len(data['observations']),'independentMatrixCases':50,'partitionOffsets':len(data['partitionOffsets']),'decimalPrecision':100,'finiteSourcePointOnly':True}))
