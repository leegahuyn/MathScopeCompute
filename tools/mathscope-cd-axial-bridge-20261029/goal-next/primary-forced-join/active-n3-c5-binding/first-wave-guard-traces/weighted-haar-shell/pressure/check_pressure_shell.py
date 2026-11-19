"""Exact source join for the Signed-shell axial pressure feedback."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys


BASE = 'primary-forced-join/active-n3-c5-binding'
PINS = {
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'pressure':'6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07',
    'equations':'2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76',
    'shell':'5fe379bdc734b5f1c17248bd4ad5b879afa19206e15d74a6f29204846cec8308',
}
R,Z,T,ELL,EPS = 17732748,17732749,17732750,17732737,17732744
Y0,Y1,VR1 = 17745430,17745431,17733068
RB,ALPHA,BETA = 17743710,17743711,17743713
PRIMITIVE_W,PRIMITIVE_Z_W = 21728660,21728771
GR = 21728512
GR_N = 'coupled-expression:500'


def read(path,key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key], key
    return raw


class Graph:
    def __init__(self,stream):
        self.stream = stream

    def node(self,i):
        data = self.stream.record(i)
        return data['op'],data['args']

    def args(self,i,op):
        return self.stream.args(i,op)


def check_live(g, native, E):
    a=E.of
    exact=lambda pid, rhs: a(pid)==rhs
    assert g.args(22000444,'multiply')==[EPS,22000443]
    left,subWholeZ=g.args(22000443,'add')
    assert [left,subWholeZ]==[22000439,22000442]
    LZ,subCutZ=g.args(left,'add')
    assert g.args(LZ,'definite_integral')==[22000435,PRIMITIVE_Z_W,ALPHA,RB]
    assert exact(subCutZ,E.neg(E.mul(a(17744392),a(21999414))))
    assert g.args(17744391,'source_step_derivative')==[17743716,1]
    assert exact(17744392,E.mul(a(17744116),a(17744391)))
    chi=17744394
    assert g.args(chi,'source_step_derivative')==[17743716,0]
    assert exact(subWholeZ,E.neg(E.mul(a(chi),a(22000440))))
    assert g.args(22000440,'definite_integral')==[22000435,PRIMITIVE_Z_W,ALPHA,BETA]
    assert g.args(21999414,'definite_integral')==[21999412,PRIMITIVE_W,ALPHA,BETA]
    grZ,rhoPZ=22000434,21728856
    assert exact(22000435,E.sub(a(grZ),a(rhoPZ)))
    assert g.args(grZ,'m3_coupled_expression_partial')==[
        GR_N,[ELL,PRIMITIVE_Z_W,Z,T,22000431,22000433],[0,0,1,0,0,0]]
    assert g.args(21999411,'m3_coupled_expression_partial')==[
        GR_N,[ELL,PRIMITIVE_W,Z,T,21999408,21999410],[0,0,0,0,0,0]]
    original=native.expressions[500]
    assert original['id']==GR_N and original['body']==GR
    assert original['parameters']==[ELL,R,Z,T,Y0,Y1]
    assert original['name']=='ActualAfterCompleteForcedAngularSubstep_complete_gr'

    @cache
    def coordinates(i):
        op,args=g.node(i)
        if op=='coordinate':
            return {i}
        if op in ('rational','source_parameter'):
            return set()
        if op in ('add','multiply','inverse','sqrt_positive','exp','log_positive','ceiling','floor'):
            return set().union(*(coordinates(v) for v in args))
        if op in ('source_step_derivative','integer_power'):
            return coordinates(args[0])
        raise AssertionError((i,op,'unsupported original translation operand'))

    for x,y in [(22000431,22000433),(21999408,21999410)]:
        base,shift=g.args(x,'add')
        assert base==Y0 and exact(y,E.add(a(Y1),E.mul(a(VR1),a(shift))))
        assert coordinates(shift).isdisjoint({Z,T,Y0,Y1})
    # Differentiate the same rho P product before using its actual
    # source bump support. Verify the two registered P derivatives.
    terms=g.args(rhoPZ,'add')
    pressure_ids={}
    for term,pid,orders in zip(terms,(21728564,21728766),([0,0,0],[0,1,0]),strict=True):
        assert pid in g.args(term,'multiply')
        assert g.args(pid,'m3_coupled_expression_partial')==[
               'coupled-expression:502',[ELL,Z,T],orders]
        pressure_ids[str(orders)]=pid
    root_argument=lambda r:E.mul(E.scalar(10),E.sub(E.mul(a(17743698),a(r)),E.one))
    assert exact(21728695,root_argument(PRIMITIVE_W))
    assert exact(21728826,root_argument(PRIMITIVE_Z_W))
    assert exact(17743716,root_argument(RB))
    for i,test in ((21728833,21728826),(21728846,21728826),(21728702,21728695)):
        x,lo,hi,left,_,right=g.args(i,'smooth_piecewise')
        assert (x,lo,hi,left,right)==(test,0,1,0,0)
    rho_atoms = {21728833,21728846}
    assert all(any(i in rho_atoms and power>0 for i,power in monomial)
               for monomial in a(rhoPZ))
    active={f['id']:f['name'].removeprefix('ActualForcedCurrent_W_') for f in native.fields
            if f['name'].startswith('ActualForcedCurrent_W_')}
    discovered={}
    for term in a(GR):
        for k,p in term:
            if k<0:
                continue
            op,args=g.node(k)
            if op=='m3_coupled_indexed_partial' and args[0] in active:
                assert p==1 and args[1]==[R,Z,T,ELL,Y0,Y1]
                discovered[k]=(active[args[0]],tuple(args[2]))
    observed={}
    for term,val in a(GR).items():
        leaves=[k for k,_ in term if k in discovered]
        assert len(leaves)<=1
        if leaves:
            k=leaves[0]
            path=discovered[k]
            poly=observed.setdefault(path,{})
            stripped=tuple(z for z in term if z[0]!=k)
            poly[stripped]=poly.get(stripped,Q(0))+val
    expected={
        ('rr',(1,0,0,0,0)):E.scalar(-1),
        ('rr',(0,0,0,0,0)):E.neg(E.inv(a(R))),
        ('rz',(0,1,0,0,0)):E.neg(a(EPS)),
        ('thetatheta',(0,0,0,0,0)):E.inv(a(R)),
    }
    y0=('rr',(0,0,0,1,0))
    y1=('rr',(0,0,0,0,1))
    assert set(observed)==set(expected)|{y0,y1}
    assert all(observed[k]==v for k,v in expected.items())
    assert observed[y0] and observed[y1]==E.mul(a(VR1),observed[y0])
    assert all(not coordinates(i)&{Y0,Y1} for term in observed[y0] for i,_ in term if i>=0)
    return {'axialResidualPressureArm':22000444,'pZAtBoundRadius':22000443,'epsilon':EPS,
            'leftAndWholeZ':[LZ,22000440],'sameZIntegrand':22000435,
            'wholePressureBeforeZ':21999414,'chi':chi,'chiZ':17744392,
            'fixedLimits':[ALPHA,BETA],'boundEvaluationRadius':RB,
            'rhoPZ':rhoPZ,'PAndPZApplications':pressure_ids,
            'rhoAndDerivativeSupportAtoms':sorted(rho_atoms),
            'rawGrNative':GR_N,'rawGrBody':GR,'grZAtShiftedPulse':grZ,
            'covarianceArms':[{'root':i,'field':k[0],'orders':list(k[1])} for i,k in sorted(discovered.items())],
            'translationIndependence':'Both actual torus shifts are translations independent of slow Z and T and torus Y.',
            'exteriorEndpointValues':'Unauthenticated until the original zero extension is proved.'}


def covariance_slot_orders():
    # For a product family f_i conjugate(g_j), an order-k derivative
    # uses every split k=m+(k-m) between the two ordinary coefficient jets.
    def slots(products):
        roles=set()
        for i,j,axis,order in products:
            for k in range(order+1):
                roles.add((i,axis if k else 'value',k))
                roles.add((j,axis if order-k else 'value',order-k))
        return roles
    direct=slots([('r','theta','R',1),('r','z','R',1),
                  ('theta','z','Z',1),('z','z','Z',1)])
    pressure=slots([('r','r','Z',1),('theta','theta','Z',1),('r','z','Z',2)])
    assert pressure-direct=={('r','Z',1),('r','Z',2),('z','Z',2)}
    assert len(direct)==8 and len(direct|pressure)==11
    return {'originalFirstForcedIncrementCoefficientFamilies':['a1','f1','f2'],
            'directRolesPerFamily':sorted(direct),
            'additionalPressureRolesPerFamily':sorted(pressure-direct),
            'directAndPressureLabelledRolesAcrossTenCharts':11*3*10}


def main():
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled.')
    cli=ArgumentParser(description=__doc__)
    for field in ('goal','artifact','cache','runtime','out'):
        cli.add_argument('--'+field,type=Path,required=True)
    args=cli.parse_args()
    runtime=args.runtime/'research-ide/mathscope-m3/navier'
    pressure=read(runtime/'source-updated-mean-pressure.mjs','pressure')
    eq=read(runtime/'source-full-mean-equations.mjs','equations')
    for expr in (b'slowZIntegrals=shiftedRadialIntegrals',b'G.derivative(chi,Z),integrals.whole',
                 b'[R,...Y].some',b'[Z,T,...Y].some',b'G.sub(leftZ,G.mul'):
        assert expr in pressure
    for expr in (b'W.rr),1)',b'W.rz)))',b'W.thetatheta),R)',b'Dz=x=>G.mul(epsilon,G.derivative(x,Z))'):
        assert expr in eq
    shell=json.loads(read(args.goal/BASE/'first-wave-guard-traces/signed-shell/signed-shell.json','shell'))
    assert shell['sourceBoundCollars']['outer'].endswith('chi=1 and rho=0')
    assert shell['sourceBoundCollars']['inner'].endswith('chi=0 and rho=0')
    assert shell['actualSigmaRows'][1]['haarRawEAtBoundRadius']==22000445
    root=args.goal/BASE
    sys.path[:0]=[str(root/'live-wave-gauge/signed'),str(root/'spatial-readback'),str(args.goal/'first-force-repair')]
    import source_cache,source_stream
    from verify_repaired_first_force import Exact
    folder=args.artifact/'first-correction-spatial-source'
    manifest=json.loads(read(folder/source_stream.MANIFEST,'manifest'))
    n=source_stream.Native(folder,manifest)
    stream=source_cache.load(source_stream,folder,manifest,22153782,args.cache)
    try:
        g=Graph(stream)
        actual=check_live(g,n,Exact(g))
    finally:
        stream.__exit__()
    result={'status':'VERIFIED_ACTUAL_AXIAL_PRESSURE_OPERANDS_CONDITIONAL_COMPACT_COVARIANCE_PULLBACK',
            'pins':PINS,'actual':actual,
            'firstForcedCovarianceCoefficientOrders':covariance_slot_orders(),
            'reduction':{'collar':'chi is locally constant and chi_Z=0. On the retained short collar, rho and rho_Z are zero. The two exact pressure integrals use identical inner gr_Z-rhoP_Z and fixed outer limits.',
                         'translation':'Normalized torus Haar commutes with the actual shift, which is independent of Z. Ordinary integration under Z and compact exterior hypotheses remain explicit.',
                         'products':'g=Haar(gr) has covariance arm -dR Wrr + (Wthetatheta-Wrr)/R - epsilon*dZ Wrz, where each W is the same auxiliary mean.',
                         'bothSigns':'Inner pZ contribution is integral from the fixed lower end to R; outer pZ is minus integral from R to fixed upper end. The radial derivative Wrr_RZ yields -Wrr_Z(R) for either side if exterior endpoint value is zero.',
                         'remainingCovarianceDerivativeRoles':['Wrr_Z','Wthetatheta_Z','Wrz_ZZ'],
                         'transfer':'The short integral retains original zeta if these actual roles admit their weighted estimates, using zero extension on the fixed envelope and the original Gaussian endpoint lemma.',
                         'separate':'Complete gr also has initialized mean, background and viscous terms. They retain independent weight obligations. No numerical pressure value is evaluated.'},
            'finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf-8',newline='\n') as f:
        f.write(json.dumps(result,indent=2)+'\n')
    print(result['status'])


if __name__=='__main__':
    main()
