"""Exact modal residual and angular work on the original physical chart."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import sys


LOCALIZATION_SHA = 'fa2acf400bb1fe8705bdb716d171882a3343562be3c5167e0fcb153d96cbf24e'
ENERGY = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/active-n3-angular-gram'
Z = (Q(0), Q(0))
VZ = (Z,Z,Z)
VELOCITY_JETS = ('u','r','rr','z','zz','tau')


def scale(a, v):
    return tuple(zmul(a,x) for x in v)


def add(*vectors):
    return tuple((sum(z[0] for z in col),sum(z[1] for z in col)) for col in zip(*vectors,strict=True))


def theta_covariant(n, v):
    r,t,z = v
    return add(scale((Q(0),Q(n)),v),((-t[0],-t[1]),r,Z))


def residual(u,p,r):
    """Coefficients of -u_tau - Δu + grad(p) + (u·grad)u."""
    assert r>0
    ir = (1/r,Q(0))
    ir2 = zmul(ir,ir)
    neg = (Q(-1),Q(0))
    linear = {}
    for n in u.keys() | p.keys():
        v = u.get(n,dict.fromkeys(VELOCITY_JETS,VZ))
        pressure,pr,pz = p.get(n,(Z,Z,Z))
        angular = theta_covariant(n,theta_covariant(n,v['u']))
        laplace = add(v['rr'],scale(ir,v['r']),v['zz'],scale(ir2,angular))
        gradient = (pr,zmul((Q(0),n/r),pressure),pz)
        linear[n]=add(scale(neg,v['tau']),scale(neg,laplace),gradient)
    advective = {}
    columns = {n:(v['r'],scale(ir,theta_covariant(n,v['u'])),v['z']) for n,v in u.items()}
    for (a,va),(b,gb) in product(u.items(),columns.items()):
        n = a+b
        advective[n] = add(advective.get(n,VZ),*(scale(x,g) for x,g in zip(va['u'],gb,strict=True)))
    result = {n:add(linear.get(n,VZ),advective.get(n,VZ)) for n in linear.keys()|advective.keys()}
    return result,linear,advective


def exact_controls():
    z = lambda re=0,im=0:(Q(re),Q(im))
    r = Q(2)
    v0 = dict.fromkeys(VELOCITY_JETS,VZ) | {'u':(z(),z(3),z()),'tau':(z(2),z(),z())}
    force,linear,advective = residual({0:v0},{0:(z(),z(7),z())},r)
    assert linear[0]==(z(5),z(Q(3,4)),z())
    assert advective[0]==(z(Q(-9,2)),z(),z())
    assert force[0]==(z(Q(1,2)),z(Q(3,4)),z())

    # Generate a real field with frequencies ±1,±2 and a nonzero pressure
    # mode outside the velocity support. All checkpoints preserve exact signs.
    u = {0:v0}
    for n in (1,2):
        jets = {key:(z(i+n,n-2*i),z(n+2*i,1-i),z(1-i,2*n+i))
                for i,key in enumerate(VELOCITY_JETS)}
        u[n] = jets
        u[-n] = {key:tuple(map(conj,value)) for key,value in jets.items()}
    p = {3:(z(4,3),z(3,-2),z(5,7))}
    p[-3] = tuple(map(conj,p[3]))
    f,linear,adv = residual(u,p,r)
    assert set(f)==set(range(-4,5))
    assert all(f[n]==tuple(map(conj,f[-n])) for n in f)
    assert f[4]!=VZ and f[-4]!=VZ and linear[3]!=VZ
    for t in range(4):
        phase = z(0,1)
        def at(seq):
            # exp(i*n*(pi/2)*t) for exact quarter turns.
            powers = (z(1),phase,z(-1),z(0,-1))
            return add(*(scale(powers[(n*t)%4],value) for n,value in seq.items()))

        by_order = lambda key:at({n:v[key] for n,v in u.items()})
        value = by_order('u')
        angular = at({n:scale(z(1/r),theta_covariant(n,v['u'])) for n,v in u.items()})
        direct_adv = add(scale(value[0],by_order('r')),scale(value[1],angular),scale(value[2],by_order('z')))
        assert at(adv)==direct_adv
        angular2 = at({n:scale(z(1/(r*r)),theta_covariant(n,theta_covariant(n,v['u']))) for n,v in u.items()})
        laplacian = add(by_order('rr'),scale(z(1/r),by_order('r')),by_order('zz'),angular2)
        dp = at({n:(pr,zmul(z(0,n/r),v),pz) for n,(v,pr,pz) in p.items()})
        assert at(f)==add(scale(z(-1),by_order('tau')),scale(z(-1),laplacian),dp,direct_adv)
    u_value = {n:v['u'] for n,v in u.items()}
    work = gram(u_value,f)
    assert work==sum((zmul(conj(x),y)[0] for n,v in u_value.items() for x,y in zip(v,f[n],strict=True)),Q(0))
    force_squared = gram(f,f)
    assert force_squared>0
    return {'checkedQuarterTurns':4,'testVelocityFrequencies':sorted(u),'testPressureFrequencies':sorted(p),
            'testResidualFrequencies':sorted(f),'axisymmetricConnectionTestForce':['1/2','3/4','0'],
            'controlAngularWork':str(work),'controlForceSquared':str(force_squared)}


def main():
    global conj,gram,zmul
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled.')
    cli = ArgumentParser(description=__doc__)
    for name in ('goal','localization','out'):
        cli.add_argument('--'+name,type=Path,required=True)
    args = cli.parse_args()
    raw = args.localization.read_bytes()
    assert sha256(raw).hexdigest()==LOCALIZATION_SHA
    actual = json.loads(raw)
    op = actual['operator']
    assert op['schema']=='MathScope.N7.OriginalLocalizedFieldOperator/1'
    assert op['pressure']==[{'field':'p_loc','derivative':None,'coefficient':622958}]
    assert op['multiplicationBeforeCurl'] and op['allSpatialCutoffProductTermsRetained']
    assert not op['undefinedLocalFieldsMultipliedByZero']
    reference = args.goal/'whole-k-core-force/annular-slow-force-energy.json'
    assert sha256(reference.read_bytes()).hexdigest()=='c4f86049b4f20a63443bd610b76313926717576abca9288ae1f9277b3ae4aa37'
    assert 'reversed physical time sign' in json.loads(reference.read_bytes())['originalOperators']['negativeControls']
    sys.path.insert(0,str(args.goal/ENERGY))
    from check_first_correction_gram import conj,gram,zmul
    result = {'status':'VERIFIED_MODAL_RESIDUAL_OPERATOR_CONDITIONAL_ON_ACTUAL_COEFFICIENT_JETS',
              'localizationSHA256':LOCALIZATION_SHA,'cutoffRootOriginalPacking':622958,
              'operator':{'coordinates':'Original physical r>0,z,tau and normalized physical-angle Haar.',
                          'time':'-partial_tau v_n',
                          'laplace':'partial_rr v_n+(partial_r v_n)/r+partial_zz v_n+((i*n+J)^2 v_n)/r^2',
                          'pressureGradient':'(partial_r p_n,i*n*p_n/r,partial_z p_n), with actual localized pressure.',
                          'advection':'For each a+b=n, sum v_{a,r} partial_r v_b+v_{a,theta}(i*b+J)v_b/r+v_{a,z}partial_z v_b.',
                          'frequencySupport':'Supp(v) ∪ Supp(p) ∪ (Supp(v)+Supp(v)). Include zero, both signs and collisions.',
                          'work':'Re sum_n conjugate(v_n) dot f_n, and force square sum_n |f_n|^2.',
                          'fullField':'Apply to the total localized velocity and pressure. A residual of the first correction alone omits nonlinear crosses with initialized and later fields.'},
              'controls':exact_controls(),
              'inputsStillOpen':['Actual localized pressure coefficients for first and later corrections.',
                                 'Actual total velocity jets through two spatial orders and one physical time order.',
                                 'Radial, axial and time integrations and original spatial boundary terms.'],
              'finalN8Comparisons':0,'finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf-8',newline='\n') as f:
        f.write(json.dumps(result,indent=2)+'\n')
    print(result['status'],result['controls'],flush=True)


if __name__=='__main__':
    main()
