"""Directed near-exterior kinetic-energy balance with the original viscous flux."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from itertools import product
from pathlib import Path
import importlib.util
import json
import sys


OLD = 'c109/n8-exterior-seam'
SOURCE = {
    'seamChecker': (OLD+'/verify_nonzero_seam.py','00b428bd263ffde7d7f31b8cab8526bd6cf33cd69c40180c38f396d344b1efc1'),
    'seam': (OLD+'/nonzero-exterior-seam.json','5d15adc58c06706c5c2add8e4241e674cc1181f6ec54604a9335c2695516e948'),
    'farEnergy': ('whole-k-exterior/exterior-energy-refinement.json','54b1d16542837fa9e165ed8051c928da6f1c4f942f420460c8a5b32dad22ff66'),
}
YRANGE=(Q(4),Q(8))
TRANGE=(Q(1,2),Q(17,32))
PLATEAU=(Q(15,32),Q(1,2))
H_ARITHMETIC_MAX=Q(1,1<<192)
BETA_MAX=Q(1,110)


def pin(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return raw


def points(bounds,size):
    left,right=bounds
    return [left+(right-left)*i/size for i in range(size+1)]


def cells(bounds,size):
    ps=points(bounds,size)
    return list(zip(ps,ps[1:]))


def width(value):
    return value.hi-value.lo


def absolute(value):
    return max(abs(value.lo),abs(value.hi))


def enc(v):
    return v.encoded()


def proof_polynomial():
    # M=A*H+Z*H', exact heat ODE gives Z*M'=H/4-H'-A*M.
    # Encode sparse monomials in (A,H,H',Z).
    def summation(*polys):
        out={}
        for poly in polys:
            for powers,c in poly.items():
                out[powers]=out.get(powers,Q())+c
        return {p:c for p,c in out.items() if c}
    def mul(a,b):
        out={}
        for p,c in a.items():
            for q,d in b.items():
                r=tuple(x+y for x,y in zip(p,q))
                out[r]=out.get(r,Q())+c*d
        return {p:c for p,c in out.items() if c}
    def scale(a,n):
        return {p:c*n for p,c in a.items()}
    A,H,HZ,Z=({tuple(int(i==j) for i in range(4)):Q(1)} for j in range(4))
    M=summation(mul(A,H),mul(Z,HZ))
    ZMp=summation(scale(H,Q(1,4)),scale(HZ,-1),scale(mul(A,M),-1))
    lhs=scale(summation(scale(mul(mul(A,H),M),2),mul(mul(Z,HZ),M),mul(H,ZMp)),4)
    rhs=summation(scale(mul(M,M),4),mul(H,H),scale(mul(H,HZ),-4))
    assert lhs==rhs
    return {'verifiedReducedFluxPolynomialTerms':len(lhs),
            'exactIdentity':"-4*d_y(y^(-2A) H M)=y^(-2A-1)*(4M^2+H^2-4H H')",
            'heatODE':"A*M+Z*M'=H/4-H'"}


@cache
def log_small(x,bits):
    assert 1<=x<=2
    t=(x-1)/(x+1)
    partial=Q()
    k=0
    while True:
        partial+=2*t**(2*k+1)/(2*k+1)
        k+=1
        error=2*t**(2*k+1)/((2*k+1)*(1-t*t))
        if error<=Q(1,1<<(bits+8)):
            return rounded(I(partial,partial+error),bits)


@cache
def log_y(y,bits):
    return 2*log_small(Q(2),bits)+log_small(y/4,bits)


@cache
def heat_quotients(zmax,bits):
    # Integral Taylor with derivative alternating signs on Z>=0. Evaluate
    # H=1+h*a and H'=h*b separately, without subtracting endpoints near 1.
    assert zmax<Q(1,200)
    order=8
    cap=C109.H_COEFFICIENT_MAX
    a=I.point(0)
    d=I.point(0)
    for n in range(1,order+1):
        a+=(-1)**n*I(C109.magnitude(n,Q(0)),C109.magnitude(n,cap))*I(0,zmax**n)
    for n in range(order+1):
        d+=(-1)**n*(n+1)*I(C109.magnitude(n+1,Q(0)),C109.magnitude(n+1,cap))*(I.point(1) if not n else I(0,zmax**n))
    # d = -b = (-H')/h. At even order both remainders are nonpositive.
    a-=I(0,C109.magnitude(order+1,cap)*zmax**(order+1))
    d-=I(0,(order+2)*C109.magnitude(order+2,cap)*zmax**(order+1))
    a=I(a.lo,min(a.hi,0))
    assert d.lo>Q(9,10) and d.hi<2
    return rounded(a,bits),rounded(-d,bits)


@cache
def box(yb,tb,bits):
    y0,y1=yb
    t0,t1=tb
    zmax=4*t1*BETA_MAX/y0
    z=I(0,zmax)
    h=I(0,H_ARITHMETIC_MAX)
    a,b=heat_quotients(zmax,bits)
    log=I(log_y(y0,bits).lo,log_y(y1,bits).hi)
    # (exp(-2h log y)-1)/h is safely evaluated at h>0 and
    # continued at h=0 by the same one-sided enclosure.
    power_quotient=-2*log+I(0,2*H_ARITHMETIC_MAX*log.hi**2)
    power=I.point(1)+h*power_quotient
    heat=I.point(1)+h*a
    Mq=I.point(1)+(Q(1,2)+h)*a+z*b
    M=I.point(Q(1,2))+h*Mq
    assert M.lo>Q(49,100) and heat.lo>Q(99,100)
    yinv=I(1/y1,1/y0)
    C,_,minus_Cprime=C109.transition(t0,t1,bits)
    C2=C.square()
    integral_energy=rounded(yinv*power*heat.square(),bits)
    endpoint_energy=rounded(C2*integral_energy/2,bits)
    work=rounded(C*minus_Cprime*integral_energy,bits)
    diss=rounded(C2*yinv.square()*power*(4*M.square()+heat.square()),bits)
    h_transfer=rounded(-4*C2*yinv.square()*power*heat*b,bits)
    flux=rounded(-4*C2*yinv*power*heat*M,bits)
    dq=4*Mq+2*a+h*(4*Mq.square()+a.square())
    d_excess=rounded(C2*yinv.square()*(2*power_quotient+power*dq),bits)
    v_excess=rounded(-4*C2*yinv*(power_quotient/2+power*(Mq+a/2+h*a*Mq)),bits)
    return {'energy':endpoint_energy,'work':work,'dissipation':diss,'heatTransferOverH':h_transfer,
            'fluxFace':flux,'dissipationExcessOverH':d_excess,'fluxFaceExcessOverH':v_excess}


def spatial(key,t,rad,bits):
    return sum(((b-a)*box((a,b),(t,t),bits)[key] for a,b in rad),I.point(0))


def cell_cost(key,rad,times,bits):
    return sum(((b-a)*(d-c)*box((a,b),(c,d),bits)[key]
                for (a,b),(c,d) in product(rad,times)),I.point(0))


def faces(key,times,bits):
    def step(y,t):
        return box((y,y),t,bits)[key]
    return sum(((d-c)*(step(Q(8),(c,d))-step(Q(4),(c,d))) for c,d in times),I.point(0))


def metro(t_interval,nr,nt,bits):
    rds,tds=cells(YRANGE,nr),cells(t_interval,nt)
    first,last=t_interval
    e_final=spatial('energy',first,rds,bits)
    e_initial=spatial('energy',last,rds,bits)
    work=cell_cost('work',rds,tds,bits)
    d=cell_cost('dissipation',rds,tds,bits)
    f=faces('fluxFace',tds,bits)
    he=cell_cost('heatTransferOverH',rds,tds,bits)
    h=I(0,H_ARITHMETIC_MAX)
    qheat=h*he
    ordinary=qheat+d-f
    # Exact common leading term 2*∫ y^-2 dy*C² = C²/4;
    # at the boundary -2*C²*[1/y]_4^8 is the same quantity.
    drem=cell_cost('dissipationExcessOverH',rds,tds,bits)
    frem=faces('fluxFaceExcessOverH',tds,bits)
    factored=he+drem-frem
    allowed_no_flux=qheat+d
    reverse_flux=qheat+d+f
    assert ordinary.lo<=0<=ordinary.hi and factored.lo<=0<=factored.hi
    assert e_final.lo>Q(1,4) and e_initial.lo>Q(1,4)
    assert he.lo>Q(1,100)
    assert f.lo>Q(1,200) and allowed_no_flux.lo>Q(1,200)
    assert reverse_flux.lo>Q(1,100)
    assert work.lo>0 if t_interval==TRANGE else work==I.point(0)
    return {'initialEnergy':e_initial,'finalEnergy':e_final,'forceWork':work,
            'dissipationTimesXb':d,'radialFluxTimesXb':f,'heatTransferTimesXbOverH':he,
            'defectTimesXb':ordinary,'defectTimesXbOverHAfterExactLeadingCancellation':factored,
            'omittedFluxDefectTimesXb':allowed_no_flux,'reversedFluxDefectTimesXb':reverse_flux,
            'relativeEnergyDefectBoundTimesXb':absolute(ordinary)/e_final.lo,
            'relativeEnergyDefectBoundTimesXbOverH':absolute(factored)/e_final.lo}


def encode(layout):
    return {name: enc(v) if isinstance(v,I) else str(v) for name,v in layout.items()}


def compare(t_interval,bits):
    layouts=[('base',8,4),('radialOnly',16,4),('timeOnly',8,8),('both',16,8)]
    base,rad,time,both=[metro(t_interval,nr,nt,bits) for _,nr,nt in layouts]
    for name,coarse in base.items():
        if isinstance(coarse,I):
            for improved in (rad,time,both):
                assert coarse.lo<=improved[name].lo<=improved[name].hi<=coarse.hi,name
    ordinary='defectTimesXb'
    stronger='defectTimesXbOverHAfterExactLeadingCancellation'
    assert all(width(base[k])>width(rad[k])>width(both[k]) for k in (ordinary,stronger))
    if t_interval==TRANGE:
        assert all(width(base[k])>width(time[k])>width(both[k]) for k in (ordinary,stronger))
        assert width(base['forceWork'])>width(time['forceWork'])
    assert all(base['relativeEnergyDefectBoundTimesXb']>one['relativeEnergyDefectBoundTimesXb']
               for one in (rad,both))
    assert both['relativeEnergyDefectBoundTimesXb']<Q(1,200)
    assert both['relativeEnergyDefectBoundTimesXbOverH']<Q(63,10000)
    return {label:{'radialCells':nr,'timeCells':nt,**encode(v)}
            for (label,nr,nt),v in zip(layouts,(base,rad,time,both))}


def main():
    parser=ArgumentParser(description=__doc__)
    for k in ('workspace','goal','out'):
        parser.add_argument('--'+k,type=Path,required=True)
    args=parser.parse_args()
    for _,(path,digest) in SOURCE.items():
        pin(args.goal/path,digest)
    seam=json.loads((args.goal/SOURCE['seam'][0]).read_bytes())
    shape=seam['geometry']
    assert shape['y']==['4','8'] and shape['rho']==['15/32','1/2','17/32']
    assert shape['zeta']==['1/4','3/8'] and shape['physicalExterior']=='X/Xb>2'
    assert shape['sourceRadialPlateau']=='8*tau0*Xb<1/4'
    assert shape['sourceAxialPlateau']=='2*zeta^2<=9/32<1/2'
    spec=importlib.util.spec_from_file_location('c109_exterior_seam',args.goal/SOURCE['seamChecker'][0])
    global C109,I,rounded
    C109=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(C109)
    C109.verify_sources(args.workspace)
    sys.path.insert(0,str((args.workspace/C109.OUTER).parent))
    from outer_cutoff import I,rounded,exp_negative
    C109.I,C109.rounded,C109.exp_negative=I,rounded,exp_negative
    assert C109.SMALL_H<H_ARITHMETIC_MAX and C109.MAX_ARG==Q(17,3520)
    assert Q(1,4)==2*(1/Q(4)-1/Q(8))==-2*(1/Q(8)-1/Q(4))
    out={'schema':'MathScope.C111.NearExteriorLocalEnergyFluxRefinement/1',
         'status':'VERIFIED_SAME_ORIGINAL_NEAR_EXTERIOR_PATCH_ENERGY_AND_RADIAL_FLUX',
         'pins':{k:v[1] for k,v in SOURCE.items()},
         'normalization':'pi*(z0/8)*B_h^2*(tau0*Xb)^(1-2*A)',
         'shape':shape,
         'physicalTime':'Initial physical endpoint is rho=17/32, final is rho=1/2. Integrate positive d_rho after reversing limits.',
         'proof':proof_polynomial(),
         'retainedCutoffDifference':"Xb*(E_final-E_initial-W)=-4*integral C^2*y^(-2*A-1)*H*H' dy d_rho",
         'exactLeadingFluxCancellation':"At h=0, both Xb*D and Xb*Phi contribute C(rho)^2/4 under time integration. Subtract this before the h-factored interval comparison.",
         'transitionOnOriginalK':compare(TRANGE,112),
         'adjoiningPlateauOutsideOriginalK':compare(PLATEAU,112),
         'negativeControls':'Strict positive defect with missing and reversed radial viscous flux, both on the original time subset and on the plateau extension.',
         'scope':'Restricted nonzero near-exterior patch only. No annular integral, global force threshold, same full final field comparison, or whole-K convergence endpoint.',
         'N7_06':'OPEN','N8_05':'OPEN','finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf-8',newline='\n') as out_file:
        out_file.write(json.dumps(out,indent=2)+'\n')
    print('PASS near exterior independent radial and time balance refinements, retained flux, two rejected flux controls')


if __name__=='__main__':
    assert __debug__
    main()
