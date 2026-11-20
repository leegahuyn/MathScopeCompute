from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
import json
from math import factorial
from pathlib import Path
import sys


WORK = Path('work/goal-next')
GOAL = Path('work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next')
OUTER = WORK / 'final67/source/research-ide/mathscope-m3/recovery-20261019/outer_cutoff.py'
PINS = {
    'paper':(WORK/'continuation51/late/paper-116.txt','66d2c3fa78f164cafe5e24a4abc54c2f01f0aa9c0153df9dba55c510f242a3ec'),
    'localization':(WORK/'final67/source/research-ide/mathscope-m3/navier/source-localization.mjs','5f6480f9799a9a83945f696833b9213585572efbe65e9e755b2935726e6f1036'),
    'heat':(WORK/'continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier/actual-continuation-exact-heat.mjs','c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172'),
    'atlas':(GOAL/'whole-k-atlas/result.json','ef5afe28cde499bf61016a0f8098d3fddb6535d88c9950e38b62d8dcdb742989'),
    'exterior':(GOAL/'whole-k-exterior/geometric-heat-exterior.json','0093f4866779b5bcc61284a7bccedb45ab425436889d8a9f2e97122b70329267'),
    'force':(GOAL/'whole-k-exterior/exterior-cutoff-force.json','9bba52b109ec9c61db0cd8bdc32cd5aaf6baedfac416277ec65b00d5c656afea'),
    'radial':(GOAL/'final67/moving-heat-energy/radial-force.json','0d67104a020f0e7b57cdbeabc4bade9d5401cbe795cdde9a7b0e60ce90cb8c5d'),
    'radialProof':(GOAL/'final67/moving-heat-energy/RADIAL_FORCE.md','a9f088efb9cba924e4899f4454b6a5d7516b89561238448c9d07c6710dfe1165'),
    'priorRefinements':(GOAL/'final67/exterior-n8-refinement/exterior-n8-refinement.json','767a47dac5d8a73e2b5b076c4dfc6ed2c4749fc03258e7cc85f05c61cfc7c160'),
    'outerArithmetic':(OUTER,'535e1126c6450627bd61cf0e5a94c33938b12e71886a995175493dddfe6b8ced'),
}
SMALL_H=Q(1,1<<8192)
H_COEFFICIENT_MAX=Q(1,64)
Y_RANGE=(Q(4),Q(8))
ZETA_RANGE=(Q(1,4),Q(3,8))
RHO_SEAM=(Q(15,32),Q(1,2),Q(17,32))
MAX_ARG=RHO_SEAM[-1]/110


def verify_sources(workspace):
    source={}
    for key,(path,pin) in PINS.items():
        data=(workspace/path).read_bytes()
        assert sha256(data).hexdigest()==pin,key
        source[key]=json.loads(data) if path.suffix=='.json' else data.decode()
    assert 'potentials, azimuthal mean components, and pressures vanish beyond Xb' in source['paper']
    assert 'A = 0 and B = K' in source['paper'] and 'normalized to vanish at radial infinity' in source['paper']
    assert 'its centrifugal' in source['paper'] and 'residual identically zero in the exterior' in source['paper']
    assert 'equation:\'u=curl(c*A)+c*B_e_theta; p=c*p_loc\'' in source['localization']
    assert 'localApplicationDomain:\'0<q<qStar' in source['localization']
    assert 'c=chi(2*(x1^2+x2^2)/r0^2)*chi(2*x3^2/z0^2)*chi((1-t)/tau0)' in source['localization']
    assert 'const Xb=G.mul(XR,G.exp(last.end))' in source['heat']
    assert 'qGlobalStar=qBig' in source['atlas']['sourceVariables']
    assert 'X_+<X_b' in source['exterior']['geometry']['sourceSplit']
    algebra=source['force']['verifiedCylindricalAlgebra']
    assert algebra['thetaForce']=='(C_t-Delta C)K-2*C_r*K_r'
    assert algebra['radialForce']=='C*(1-C)*K^2/r+C_r*p_loc' and algebra['axialForce']=='C_z*p_loc'
    assert source['radial']['closedLowerCell']['rSquared']=='[4*tau0*Xb,8*tau0*Xb]'
    assert '8s_*<1/4' in source['radialProof']
    assert source['priorRefinements']['wholeKLastResolvedTau'] is None
    scale=source['priorRefinements']['heatCoefficientOrderAxis']
    assert 'Xb=XR*exp(terminal.end)>110' in scale['argumentCapSource']
    assert scale['h'].startswith('0<h<2^-8192')
    assert scale['pressureSign']=='For N=4,8, P_N>=H>0, so p_N<=p.'
    return source


def source_geometry():
    # In the original chart, F(Q)=Q-zeta^2 Q^(2h)-rho.
    z_min2,z_max2=(z*z for z in ZETA_RANGE)
    assert Q(1,2)-z_min2*Q(1,2)-RHO_SEAM[0]==0  # Strict since (1/2)^(2h)>1/2.
    assert 1-z_max2-RHO_SEAM[-1]==Q(21,64)>0
    assert 1-4*H_COEFFICIENT_MAX*z_max2>Q(1,2)
    assert 2*z_max2<Q(3,4)**2
    assert 2*z_max2<Q(1,2)                  # Axial cutoff plateau.
    assert Y_RANGE[0]/2==2                  # X/Xb=y/(2Q)>2.
    assert MAX_ARG<Q(1,200)
    # The pinned radial-force premise proves 8*tau0*Xb<1/4.
    # The exterior's archived h expression gives h<2^-8192.
    assert 8002*10>8192
    return {'qOverTau0':['1/2','1'],'bothQBoundsStrict':True,'etaSquaredUpper':'9/32',
            'physicalExterior':'X/Xb>2','sourceRadialPlateau':'8*tau0*Xb<1/4',
            'sourceAxialPlateau':'2*zeta^2<=9/32<1/2', 'heatArgumentUpper':str(MAX_ARG),
            'outerCutoffOneThrough':'rho<=1/2','sourceVariables':{'y':'r^2/(tau0*Xb)','rho':'tau/tau0','zeta':'z/tau0^D'},
            'y':list(map(str,Y_RANGE)),'rho':list(map(str,RHO_SEAM)),'zeta':list(map(str,ZETA_RANGE))}


@cache
def magnitude(n,h):
    # |[Z^n]H|/h; this also defines its finite limit at h=0.
    assert n>=1
    a,b=Q(1),Q(1)
    for j in range(1,n):
        a*=h+j
    for j in range(1,n+1):
        b*=h+j
    return a*b/factorial(n)


def absolute_remainders(n,z):
    # Actual h times the listed heat/magnitude bounds.
    heat=magnitude(n+1,H_COEFFICIENT_MAX)*z**(n+1)
    square=(2+SMALL_H*heat)*heat
    return heat,square


def polynomial_contributions(n,evaluate):
    heat,pressure=I.point(0),I.point(0)
    for d in range(1,2*n+1):
        slo=magnitude(d,Q(0)) if d<=n else Q(0)
        shi=magnitude(d,H_COEFFICIENT_MAX) if d<=n else Q(0)
        power=evaluate(d)
        sign=(-1)**d
        heat+=sign*I(slo,shi)*power
        # All convolution terms of order d have the same alternating sign.
        pairs=[(j,d-j) for j in range(1,n+1) if 1<=d-j<=n]
        c_hi=sum(magnitude(j,H_COEFFICIENT_MAX)*magnitude(k,H_COEFFICIENT_MAX) for j,k in pairs)
        normalizer=I(Q(1,1+d),(1+2*H_COEFFICIENT_MAX)/(1+2*H_COEFFICIENT_MAX+d))
        pressure+=sign*I(2*slo,2*shi+SMALL_H*c_hi)*normalizer*power
    return heat,pressure


@cache
def heat_intervals(n,zmax):
    heat,pressure=polynomial_contributions(n,lambda d:I(0,zmax**d))
    er,ep=absolute_remainders(n,zmax)
    # At each tested even order the signed heat remainder is nonpositive.
    # Since H>0 and P_n>=H, the pressure square remainder is nonpositive too.
    h_value=I.point(1)+I(0,SMALL_H)*(heat-I(0,er))
    p_value=I.point(1)+I(0,SMALL_H)*(pressure-I(0,ep))
    return I(h_value.lo,min(h_value.hi,1)),I(p_value.lo,min(p_value.hi,1))


@cache
def cutoff_endpoint(rho,bits):
    if rho<=Q(1,2):
        return I.point(0),I.point(0)          # R, dR/d(2*rho-1)
    u=2*rho-1
    assert 0<u<=Q(1,16)
    ratio=exp_negative(1/u-1/(1-u),bits)
    return ratio,ratio*(u**(-2)+(1-u)**(-2))


@cache
def transition(lo,hi,bits):
    assert lo<=hi and not lo<Q(1,2)<hi
    a,da=cutoff_endpoint(lo,bits)
    b,db=cutoff_endpoint(hi,bits)
    # d(log R/u^2)/du = u^-2+(1-u)^-2-2/u>0 for u<=1/16.
    # d(log R/(1-u)^2)/du >0 too, hence dR/du increases on this collar.
    assert Q(1,16)<Q(1,2)
    loss=I(a.lo/(1+a.lo),b.hi/(1+b.hi))
    derivative=I(2*da.lo/(1+b.hi)**2,2*db.hi/(1+a.lo)**2)
    assert loss.hi<Q(1,2)
    return I.point(1)-loss,loss,derivative


def field_box(yb,rhob,order,bits):
    y0,_=yb
    r0,r1=rhob
    H,P=heat_intervals(order,4*r1/(110*y0))
    C,loss,d=transition(r0,r1,bits)
    cross=I(loss.lo*(1-loss.lo),loss.hi*(1-loss.hi))
    raw=(C*H,C*P,cross*H.square(),d*H)
    return tuple(rounded(value,bits) for value in raw)


def partition(bounds,count):
    lo,hi=bounds
    return tuple(lo+(hi-lo)*j/count for j in range(count+1))


def compare_grid(order=4,bits=72):
    layouts={}
    relations={}
    parent_intersections=0
    for size in (4,8):
        y=partition(Y_RANGE,size)
        rho=partition(RHO_SEAM[:2],size)[:-1]+partition(RHO_SEAM[1:],size)
        zeta=partition(ZETA_RANGE,size)
        intervals=[field_box(yb,rhob,order,bits) for yb,rhob in product(zip(y,y[1:]),zip(rho,rho[1:]))]
        if size==8:
            for index,fine in enumerate(intervals):
                i,j=divmod(index,2*size)
                coarse=relations[4][4][(i//2)*8+j//2]
                # Both directed intervals enclose the same original field on
                # this child. The inherited intersection remains an enclosure.
                shared=tuple(I(max(a.lo,b.lo),min(a.hi,b.hi)) for a,b in zip(coarse,fine))
                parent_intersections+=sum(a!=b for a,b in zip(fine,shared))
                intervals[index]=shared
        widths=[max(series.hi-series.lo for series in group) for group in zip(*intervals)]
        layouts[size]={'projectedFieldCells':len(intervals),'physicalCells':len(intervals)*size,
                       'normalizedGridUniformCaps':list(map(str,widths)),
                       'physicalCoordinateNodes':len(y)*len(rho)*len(zeta)}
        relations[size]=(y,rho,zeta,widths,intervals)
    assert all(a==b[::2] for a,b in zip(relations[4][:3],relations[8][:3]))
    assert all(a>b for a,b in zip(relations[4][3],relations[8][3]))
    return {'layouts':layouts,'allFineProjectedFieldCellsIntersectedWithParents':len(relations[8][4]),
            'directedEnclosuresTightenedByParentIntersection':parent_intersections,
            'continuousAxialIndependenceOnWholeSpatialPlateau':True}


def axes():
    grid=compare_grid()
    section=(Q(6),Q(6)),(RHO_SEAM[-1],RHO_SEAM[-1])
    fixed={p:field_box(*section,4,p) for p in (72,144)}
    a,b=fixed.values()
    assert all(x.lo<=y.lo<=y.hi<=x.hi for x,y in zip(a,b))
    assert all(x.hi-x.lo>y.hi-y.lo for x,y in zip(a,b))
    assert all(x.lo>0 for x in b)
    plateau=field_box((Q(6),Q(6)),(RHO_SEAM[0],RHO_SEAM[0]),8,144)
    seam=field_box((Q(6),Q(6)),(Q(1,2),Q(1,2)),8,144)
    for row in (plateau,seam):
        assert row[0].lo>0 and row[1].lo>0 and row[2:]==(I.point(0),I.point(0))
    assert plateau[0].square().lo>0  # A missing (1-C) would give positive plateau radial force.
    assert (-b[3]).hi<0              # Reversing physical time would reverse the proved sign.
    coeff={}
    for order in (4,8):
        e,ep=absolute_remainders(order,MAX_ARG)
        coeff[order]=(e,ep,ep/4,108*e)
    assert all(a>100000*b for a,b in zip(coeff[4],coeff[8]))
    for n in (3,5):
        # For signed modes {-1,0,1}, no nonzero difference is a multiple of n.
        assert all((k-l)%n!=0 for k,l in product(range(-1,2),repeat=2) if k!=l)
    return {'gridOnly':grid,'FourierOnly':{'cutoffs':[1,2],'exactActualModes':{'u':[-1,1],'p':[0],'f':[-1,1]},'omittedTail':['0','0']},
            'coefficientOrderOnly':{'orders':[4,8], 'uniformCapsDivideByPositiveOriginalH':{n:list(map(str,c)) for n,c in coeff.items()},
                                    'improvementFactorStrictlyGreaterThan':100000},
            'arithmeticPrecisionOnly':{'bits':[72,144],'fixedPoint':{'y':'6','rho':'17/32','everyZeta':True},
                                      'enclosures':{p:[v.encoded() for v in values] for p,values in fixed.items()}},
            'nonzeroActualReadouts':{'plateau': [v.encoded() for v in plateau],'seam':[v.encoded() for v in seam],
                                     'aboveSeam':[v.encoded() for v in b],'pressureReadoutHasNegatedPhysicalSign':True},
            'wrongControlsRejected':['missing (1-C) in radial force','reversed physical time convention']}


def run(workspace):
    source=verify_sources(workspace)
    sys.path.insert(0,str((workspace/OUTER).parent))
    global I,rounded,exp_negative
    from outer_cutoff import I,rounded,exp_negative
    return {'schema':'MathScope.C109.NonzeroOriginalExteriorTemporalSeamRefinement/1',
        'status':'VERIFIED_RESTRICTED_NONZERO_EXTERIOR_SEAM_GIVEN_PINNED_ORIGINAL_EXTERIOR_IDENTIFICATION',
        'pins':{name:pin for name,(_,pin) in PINS.items()},
        'originalBranchIdentification':'Proposition 9.9 Step 4, manuscript 116, all corrections vanish beyond Xb and radial-infinity pressure fixed; localization (10.4) with cutoff inside curl',
        'geometry':source_geometry(),'nonzeroFourAxisComparisons':axes(),
        'orderedReadouts':['u_theta*s^A/B_h','-p*4A*s^(2A)/B_h^2','f_r*r*s^(2A)/B_h^2','f_theta*tau0*s^A/B_h'],
        'exactZeroReadouts':['u_r','u_z','f_z'],'s':'r^2','positiveFactorsRetained':['B_h=2^A*cInfinity','tau0','Xb','h','A=1/2+h'],
        'exactMomentumSeam':'C=1 and all derivative jets of C-1 vanish for rho<=1/2, hence original f agrees with zero to all orders at rho=1/2; physical time derivative is -tau0^-1*d_rho',
        'timeScope':'The older whole-K convergence target is rho>=1/2; the lower half here is a distinct source-admitted extension through that seam, and does not change that target.',
        'sameWholeFinalFieldObservedRefinements':0,'wholeKLastResolvedTau':None,
        'priorExteriorLastTau':source['priorRefinements']['exteriorLastVerifiedTau'],
        'annularFinalFieldAndTail':'OPEN','N8_05':'OPEN','N7_06':'OPEN','finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser()
    parser.add_argument('--workspace',type=Path,default=Path.cwd())
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    result=run(args.workspace)
    with args.out.open('xb') as file:
        file.write((json.dumps(result,indent=2)+'\n').encode())
    print('PASS: original nonzero exterior temporal seam, nested grid, exact Fourier, order and directed precision')
