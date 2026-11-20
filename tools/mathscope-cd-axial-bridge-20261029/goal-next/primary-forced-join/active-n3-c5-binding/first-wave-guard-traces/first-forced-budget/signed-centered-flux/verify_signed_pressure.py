"""Reassemble the original post-Forced Haar pressure and centered Signed flux."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import inspect
import json
from math import comb, factorial
from pathlib import Path
import runpy
import sys


BASE = Path('primary-forced-join/active-n3-c5-binding')
BAND = BASE / 'first-wave-guard-traces'
PINS = {
    'manifest': '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry': 'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'stream': 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96',
    'reader': '2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb',
    'exact': '260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
    'cache': '909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'pressureChecker': '4c6207b96db4fd87c6d6835c9e19f1c04fd1f67efd58b2c35a56b8994ab6e2bb',
    'pressureReceipt': '22ff14cbd3c6df110159eb33d1cd6c938ecfdc08242d917a22a200bfb2075797',
    'meanGroups': '168d59a2b935ca6b21da8e830c02a10f172231349d8d9a89cc6d38e73762a90f',
    'wholeN1Cancellation': '4f26dab68019dedd61a5cf39a7b2e20ea6fc6213d738a2ff1ec9241fd6207117',
    'signedShell': '5fe379bdc734b5f1c17248bd4ad5b879afa19206e15d74a6f29204846cec8308',
    'c98Mean': '3212a321563d65e5d7972cb7ab0c97f03f1ee0917276542a7a45074912fe34ff',
    'premeanCode': '0be927c8d13c2ed10bda7b430ac300547c2875c6543e331a2cfeaf536c16805f',
    'c98MeanCode': 'f0fffd5c57aec9344487524e27ecefeef53ea91237269ad30b45d97109729650',
    'c98C7': '05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e',
    'c98C8': 'c4c57f2e2531d04da6b8c795c73c8e8322cd8fc118550a3f2165f10bfa55a9df',
    'outerN1': '4135a53d40c87b97307771265f0ce86a277a3151c94d82e8cda8190be792b827',
    'outerC10': 'a2937d2c2066946f3dbe0a1be2a883766266a0b984914b67780ab81e55eadcbb',
    'sourceConservativeFlux': 'bbe4e3d87e79a770590a94bc75a8ac0f36f69f4338cab5739340a637a42bfbf5',
    'sourceMeanEquations': '2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76',
}
R, Z, T, ELL, EPS = 17732748, 17732749, 17732750, 17732737, 17732744
RB, LOWER, UPPER = 17743710, 17743711, 17743713
Y = (17745430, 17745431)


def pinned(path, name):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == PINS[name], (name, path)
    return data


def digest_polynomial(poly):
    return sha256(json.dumps([(mon,str(c)) for mon,c in sorted(poly.items())],
                            separators=(',',':')).encode()).hexdigest()


def current_stage(stream, registry, E):
    p = E.of
    N = registry.expressions
    params_scalar = [ELL, Z, T]

    def call(i, index, actual, orders=None):
        if orders is None:
            orders = [0]*len(actual)
        assert stream.args(i,'m3_coupled_expression_partial') == [f'coupled-expression:{index}',actual,orders]

    def haar(i):
        inside, v, lo, hi = stream.args(i,'definite_integral')
        assert (v,lo,hi)==(Y[1],0,1)
        raw, v, lo, hi = stream.args(inside,'definite_integral')
        assert (v,lo,hi)==(Y[0],0,1)
        return raw

    def whole(i):
        body,var,lo,hi=stream.args(i,'definite_integral')
        assert lo==LOWER and hi==UPPER and stream.record(var)['op']=='coordinate'
        return body,var

    def body_pair(i):
        entries = [q for mon in p(i) for q,k in mon if q>=0 and stream.record(q)['op']=='definite_integral' and k==1]
        assert len(entries)==len(set(entries))==2
        only_positive = {mon:c for mon,c in p(i).items() if c==1}
        positive = [q for q in entries if p(q)==only_positive]
        assert len(positive)==1
        return positive[0],next(q for q in entries if q!=positive[0])

    roots = [21728512,21728559,21728563,21728609,21728655]
    for ix,name,body in zip(range(500,505),('complete_gr','haar_gr','P','Jtheta','Jz'),roots,strict=True):
        assert N[ix]['name']=='ActualAfterCompleteForcedAngularSubstep_'+name and N[ix]['body']==body
    assert N[500]['parameters']==[ELL,R,Z,T,*Y]
    assert N[501]['parameters']==[ELL,R,Z,T]
    assert all(N[i]['parameters']==params_scalar for i in (502,503,504))
    call(haar(roots[1]),500,[ELL,R,Z,T,*Y])
    hp,vp=whole(roots[2])
    call(hp,501,[ELL,vp,Z,T])
    ht,vt=whole(roots[3])
    assert stream.record(haar(ht))['op']=='multiply'
    jz_flux,jz_pressure=body_pair(roots[4])
    assert p(roots[4])==E.sub(p(jz_flux),E.mul(E.scalar(Q(1,2)),p(jz_pressure)))
    jz_flux_haar,vz=whole(jz_flux)
    assert stream.record(haar(jz_flux_haar))['op']=='multiply'
    wp,wp_r=whole(jz_pressure)
    wr,wg=stream.args(wp,'multiply')
    assert p(wr)==E.pow(p(wp_r),2)
    call(wg,501,[ELL,wp_r,Z,T])
    assert len({vp,vt,vz,wp_r,R,RB})==6
    # Apply the actual compact corrections at the already bound radius.
    rho = p(17743730)
    assert rho == E.mul(p(17743724), E.pow(p(17743725),-1))
    crho = p(17743733)
    assert crho==E.mul(E.scalar(Q(1,2)),p(17743732))
    crho_body,_=whole(17743732)
    assert p(crho_body)==E.mul(E.pow(p(RB),2),rho)
    crho_z = E.mul(E.scalar(Q(1,2)),p(17744221))
    crho_z_body,_=whole(17744221)
    rz_weight, rho_z = stream.args(crho_z_body,'multiply')
    assert p(rz_weight)==E.pow(p(RB),2), (rz_weight,rho_z)
    for root,i,ders in [(21728564,502,[0,0,0]),(21728766,502,[0,1,0]),(21999238,503,[0,1,0]),(21999242,504,[0,1,0])]:
        call(root,i,params_scalar,ders)
    target_t=E.mul(p(EPS),p(21999238))
    target_z=E.mul(p(EPS),E.add(p(21999242),E.mul(crho,p(21728766)),E.mul(crho_z,p(21728564))))
    bound_roots=[21999624,22000447]
    raw=[haar(root) for root in bound_roots]
    assert raw==[21999622,22000445]
    for i,degree,raw_mean,input_,left,full,sigma,target in [
        (1276,2,bound_roots[0],21999634,21999635,21999636,21999641,target_t),
        (1277,1,bound_roots[1],22000457,22000458,22000459,22000464,target_z),
    ]:
        assert N[i]['body']==sigma and N[i]['parameters']==[ELL,R,Z,T]
        assert p(input_)==E.sub(E.mul(E.pow(p(RB),degree),p(raw_mean)),E.mul(rho,target))
        assert stream.args(left,'definite_integral')==[input_,RB,LOWER,R]
        assert stream.args(full,'definite_integral')==[input_,RB,LOWER,UPPER]
        assert p(sigma)==E.neg(E.mul(E.pow(p(R),-degree),E.sub(p(left),E.mul(p(17743734),p(full)))))
    call(22001223,1276,[ELL,R,Z,T])
    call(22001224,1277,[ELL,R,Z,T])
    pressure=N[505]
    assert pressure['name']=='ActualAfterForcedRefreshedFullMeanPressure' and pressure['body']==21728910
    assert p(pressure['body'])==E.add(p(17732937),E.sub(p(21728713),E.mul(p(17743734),p(21728714))))
    return {'nativeMomentRoots':dict(zip(('gr','haarGr','P','Jtheta','Jz'),roots,strict=True)),
            'wholeJzRadialRoots':[jz_flux,jz_pressure],'rawSignedResidualRoots':raw,
            'centeredSigmaRoots':[21999641,22000464],'centeredSigmaApplications':[22001223,22001224],
            'weightedTargetSourceRoots':[21999634,22000457],'cRho':17743733,'cRhoZIntegral':17744221,
            'latestRefreshedPressure':21728910,'refreshedPressureHasBackgroundSummand':17732937,
            'actualResidualUsesIncrementalPressureZ':22000443}


def group_actual_haar(stream, registry, E):
    p = E.of
    aux = json.loads(registry.base_snapshot['expressionDefinitions'])
    inverses = json.loads(registry.base_snapshot['inverseDefinitions'])
    assert [d['name'] for d in inverses]==['GlobalActualTemporal_theta','GlobalActualTemporal_z']
    assert all(d['Y']==list(Y) and d['zeroMode']=='The exact normalized Haar mean is projected out.'
               and not d['finiteSumDeclaredEqualToLimit'] for d in inverses)
    assert [aux[i]['name'] for i in (12,18,19,20)]==[
        'global_actual_temporal_actual_meridional_potential',
        'GlobalInitializationFiveBump_v','GlobalInitializationFiveBump_gamma','GlobalInitializationFiveBump_beta']
    actual_fields = {d['id']:d['name'].removeprefix('ActualForcedCurrent_W_') for d in registry.fields
                     if d['name'].startswith('ActualForcedCurrent_W_')}
    assert set(actual_fields.values())=={'rr','rtheta','rz','thetatheta','thetaz','zz'}

    @cache
    def depends(i,wanted):
        if i<0:
            definition=next(m for m,atom in E.inverse_atoms.items() if atom==i)
            return any(depends(j,wanted) for mon,_ in definition for j,k in mon)
        if i<min(wanted):
            return False
        if i in wanted:
            return True
        d=stream.record(i)
        op,args=d['op'],d['args']
        if op in ('coordinate','source_parameter','rational'):
            return False
        if op=='definite_integral':
            body,bound,lo,hi=args
            free=tuple(a for a in wanted if a!=bound)
            return depends(lo,wanted) or depends(hi,wanted) or bool(free and depends(body,free))
        if op in ('integer_power','source_step_derivative'):
            children=args[:1]
        elif op.endswith('_partial') and len(args)==3 and isinstance(args[1],list):
            children=args[1]
        elif op in ('add','multiply','inverse','sqrt_positive','log_positive','exp','sine','cosine',
                    'maximum','ceiling','floor','smooth_piecewise'):
            children=args
        elif op=='actual_covariance_volterra':
            children=[args[2],*args[3]]
        elif op in ('actual_background_picard','actual_background_even_profile'):
            children=args[2:4]
        elif op=='actual_quadratic_root':
            children=args[2:3]
        elif op in ('actual_monotone_root','actual_natural_series'):
            children=args[1:3]
        elif op=='m3_forced_pulse_partial':
            children=[args[3],*args[4]]
        else:
            raise ValueError((i,op))
        assert all(type(a) is int and a<i for a in children), (i,op)
        return any(depends(child,wanted) for child in children)

    result=[]
    for raw,radius in [(21728512,R),(21999622,RB),(22000445,RB)]:
        all_terms=p(raw)
        pressure=p(22000444) if raw==22000445 else E.zero
        remainder=E.sub(all_terms,pressure)
        tags=('linearTemporalZero','temporalQuadratic','periodicCovarianceDerivativeZero',
              'compactFiveMap','ordinaryCovarianceOrStress')
        groups={tag:{} for tag in tags}
        compact_calls=set()
        for mon,c in remainder.items():
            temporal,compact,covs=[],[],[]
            for i,power in mon:
                if i<0:
                    continue
                d=stream.record(i)
                op,args=d['op'],d['args']
                if op=='m3_aux_inverse_partial':
                    key,act,jets=args
                    assert key in (0,1) and act==[radius,Z,T,ELL,*Y] and power>0
                    temporal.extend([i]*power)
                elif op=='m3_aux_expression_partial':
                    key,act,jets=args
                    if key==-13:
                        assert act==[ELL,radius,Z,T,*Y] and power>0
                        temporal.extend([i]*power)
                    elif key in (-19,-20,-21):
                        assert act==[ELL,radius,Z,T] and power>0
                        compact.extend([i]*power)
                        compact_calls.add((key,tuple(jets)))
                elif op=='m3_coupled_indexed_partial' and args[0] in actual_fields:
                    key,act,jets=args
                    assert act==[radius,Z,T,ELL,*Y] and power==1 and len(jets)==5
                    covs.append((i,any(jets[3:])))
            assert len(temporal)<=2 and len(covs)<=1
            if len(temporal)==1:
                assert not covs
                tag='linearTemporalZero'
            elif len(temporal)==2:
                assert not covs and not compact
                tag='temporalQuadratic'
            elif covs and covs[0][1]:
                assert not compact
                tag='periodicCovarianceDerivativeZero'
            elif compact:
                assert not covs
                tag='compactFiveMap'
            else:
                tag='ordinaryCovarianceOrStress'
            outside={*temporal,*(i for i,_ in covs)}
            assert all(i in outside or not depends(i,Y) for i,k in mon), (raw,tag,mon)
            groups[tag][mon]=c
        assert E.add(pressure,*groups.values())==all_terms
        assert all(groups[tag] for tag in tags)
        result.append({'body':raw,'terms':len(all_terms),'pressureTerms':len(pressure),
                       'compactNativeApplications':sorted(compact_calls),
                       'groups':{tag:{'terms':len(pol),'sha256':digest_polynomial(pol)} for tag,pol in groups.items()}})
    return result


def pressure_algebra(E):
    # The atoms represent exact averaging/integration operations on
    # independently named functions. The native readback above fixes their values.
    atoms=[{((i,1),):Q(1)} for i in range(1,24)]
    chi,chi_z,p,pz,ig,ig_z,irho,irho_z,jg,jg_z,jrho,jrho_z,*_=atoms
    ordinary_total=E.sub(jg,E.mul(p,jrho))
    ordinary_total_z=E.sub(jg_z,E.add(E.mul(pz,jrho),E.mul(p,jrho_z)))
    full_E_z=E.sub(E.sub(ig_z,E.add(E.mul(pz,irho),E.mul(p,irho_z))),
                   E.add(E.mul(chi_z,ordinary_total),E.mul(chi,ordinary_total_z)))

    def substitute(poly, pairs):
        targets={next(iter(key))[0][0]:value for key,value in pairs}
        return E.add(*(E.mul(E.scalar(c),*(E.pow(targets.get(i,{((i,1),):Q(1)}),power)
                                           for i,power in mon)) for mon,c in poly.items()))

    assert substitute(ordinary_total,[(jg,p),(jrho,E.one)])==E.zero
    substitutions=[(jg,p),(jg_z,pz),(jrho,E.one),(jrho_z,E.zero)]
    assert substitute(full_E_z,substitutions)==E.sub(ig_z,E.add(E.mul(pz,irho),E.mul(p,irho_z)))
    broken=E.sub(substitute(full_E_z,substitutions),E.sub(ig_z,E.mul(pz,irho)))
    assert broken==E.neg(E.mul(p,irho_z)) and broken
    return {'afterHaarPressure':'pbar=I(gbar)-P*I(rho)',
            'completeZDerivative':'I(gbar_Z)-P_Z*I(rho)-P*I(rho_Z)',
            'wholeTerm':'J(gbar)-P*J(rho)=0 once the two native whole integrals are interpreted',
            'negativeControl':'Dropping the source I(rho_Z) gives error -P*I(rho_Z).',
            'axialTarget':'D_z=J_z+c_rho*P; its derivative has both c_rho P_Z and c_rho,Z P.'}


def norm_frontier():
    spatial={(r,z,0) for r in range(3) for z in range(3-r)}

    def shifted(orders, axis, step=1):
        out = set()
        for index in orders:
            result=list(index)
            result[axis]+=step
            out.add(tuple(result))
        return out

    def lowered_by_integral(orders):
        return {(max(0,r-1),z,t) for r,z,t in orders}

    # Each request also bounds all its Leibniz subrequests.
    def closure(*sets):
        return {(i,j,k) for s in sets for r,z,t in s
                for i in range(r+1) for j in range(z+1) for k in range(t+1)}

    axial=shifted(lowered_by_integral(spatial),1)
    time=shifted(lowered_by_integral(spatial),2)
    assert sorted(axial)==[(0,1,0),(0,2,0),(0,3,0),(1,1,0)]
    assert sorted(time)==[(0,0,1),(0,1,1),(0,2,1),(1,0,1)]
    # A weighted pressure derivative applies to the local radial boundary
    # term F(R) as well as a primitive of f.  All whole moments use fixed R.
    pressure_f = closure(lowered_by_integral(closure(axial)))
    pressure_F = closure(axial)
    forced_cov = {
        'rr':closure(pressure_F,pressure_f),
        'rz':closure(spatial,shifted(pressure_f,1)),
        'rtheta':spatial,
        'thetatheta':pressure_f,
        'thetaz':closure(axial),
        'zz':closure(axial),
    }
    # f retains epsilon^3 Z^2 beta_F and epsilon T beta_F, which
    # cannot be dropped in the compact patch. The Z^5 beta term uses Z^6 Jtheta.
    beta_pressure_components = {
        'localViscous':closure(shifted(pressure_F,0),pressure_F),
        'slowTime':closure(shifted(pressure_f,2)),
        'axialViscous':closure(shifted(pressure_f,1,2)),
    }
    beta=closure(spatial,pressure_F,shifted(pressure_f,1),*beta_pressure_components.values())
    v=closure(spatial,shifted(spatial,0),axial,shifted(axial,1),time,pressure_f)
    gamma=closure(spatial,shifted(spatial,0),axial,shifted(axial,1),time,shifted(pressure_f,1))
    # For beta's fixed lower primitive, each nontrivial R derivative
    # uses gamma at the current endpoint and consumes one R derivative.
    gamma_from_beta = shifted(lowered_by_integral(beta),1)
    assert max(z for r,z,t in beta)==5
    assert (0,6,0) in gamma_from_beta
    assert (0,4,0) in forced_cov['rz']
    assert max(r+z+t for f in forced_cov.values() for r,z,t in f)==4
    return {
        'weightedSigmaSpatialOrders':sorted(spatial),'localWeightedRadialFlux':sorted(spatial),
        'axialFluxIncludingPressure':sorted(axial),'compactMeanTime':sorted(time),
        'projectedPressureLocalFluxFOrders':sorted(pressure_F),'projectedPressureIntegralDensityOrders':sorted(pressure_f),
        'forcedCovarianceSupremumOrders':{f:sorted(rows) for f,rows in forced_cov.items()},
        'compactFiveMapOrders':{'beta':sorted(beta),'v':sorted(v),'gamma':sorted(gamma|gamma_from_beta)},
        'compactBetaPressureRoles':{name:sorted(x) for name,x in beta_pressure_components.items()},
        'independentCompactHighOrder':{'betaRZT':[0,5,0],'origin':'epsilon^3 * beta_F,ZZ in the ordinary radial pressure density',
                                      'requiresBeforeFiveMapJthetaRZT':[0,6,0],'vanishesOnBothCollars':True},
    }


def gaussian_transfer():
    d=Q(1,32)
    t1=Q(1,128)
    width=Q(2)
    p=512
    inner=p*d*d+8*t1*(d/(width-t1*d))**3
    outer=p*d*d+2*t1**2*(d/(width-d))**3
    assert inner<1 and outer<4
    assert Q(2,3)*7680==5*32**2
    # log(2)=2 arctanh(1/3)>2/3; the original two factors together
    # therefore cost strictly less than 2^7680 on the complement.
    return {'collarWidths':'inner y/t1<=1/32; outer d<=1/32',
            'maximumInputPole':p,'innerRationalLogSlopeDebit':str(inner),'outerRationalLogSlopeDebit':str(outer),
            'finiteCubicGainAtEachIntegral':'p -> max(0,p-3), with original positive radial Jacobian and weights',
            'pressureAndSigmaMaximumNumberOfNestedPrimitives':2,
            'complementInverseWeight':'< 2^7680',
            'flatSupportAndFixedLimitsRequired':True}


def specialized(fn, original, replacement):
    source=inspect.getsource(fn)
    assert source.count(original)==1
    scope={}
    exec(compile(source.replace(original,replacement),inspect.getfile(fn),'exec'),fn.__globals__,scope)
    return scope[fn.__name__]


def compact_five_map(goal, frontier):
    budget=BAND/'first-forced-budget'
    premean=goal/budget/'middle-premean-whole-path/verify_premean_whole_path.py'
    mean=goal/budget/'native-mean-pressure/verify_mean_pressure_enclosure.py'
    pinned(premean,'premeanCode')
    pinned(mean,'c98MeanCode')
    low=json.loads(pinned(goal/budget/'global-covariance-join/global-primary-covariance.json','c98C7'))
    high=json.loads(pinned(goal/budget/'global-covariance-join/selective-z8/selective-z8-covariance.json','c98C8'))
    assert low['coefficientBudget']['wholePathCovarianceLogCap']=='H/2^113'
    assert high['selectiveCovariance']['wholePathCovarianceLogCap']=='H/2^112'
    record=specialized(runpy.run_path(str(premean))['record'],'for order in demands:',
                       'for order in demands[name]:')
    mixed_chart=specialized(runpy.run_path(str(mean))['implicit_and_cutoff'],
                             'ds[n] = 2 * sum(c * compose_bound(series, ds, n-j) for j,c in enumerate([4,4,1]) if j<=n)',
                             'ds[n] = 2 * (int(n==1) + sum(c * compose_bound(series, ds, n-j) for j,c in enumerate([4,4,1]) if j<=n))')
    # T was an independent displacement in the implicit equation. Its
    # coefficient is included in the total Taylor majorant at degree one.
    chart=mixed_chart(7)
    assert max(chart['coefficientLog2Ceilings'].values())<256
    orders=frontier['compactFiveMapOrders']
    ang={(z,t) for _,z,t in orders['v']}
    ax={(z,t) for _,z,t in orders['gamma']}
    assert max(z+t for z,t in ax)==6 and (4,1) in ax
    assert max(z+t for z,t in ang)==4 and (2,1) in ang
    lifted_p={(z+1,t) for z,t in ang}
    # For the early, pre-FiveMap target, the pressure defect and the axial
    # defect use beta*gamma once with an extra Z derivative.
    typed={'beta':ang|lifted_p,'v':ang|ax,'gamma':ang|ax|lifted_p}
    assert max(z+t for z,t in typed['beta'])==5
    assert (6,0) in typed['v'] and (6,0) in typed['gamma'] and (6,0) not in typed['beta']
    for z in range(7):
        for t in range(7-z):
            for i in range(z+t+1):
                assert sum(comb(z,j)*comb(t,i-j) for j in range(z+1) if 0<=i-j<=t)==comb(z+t,i)
    collapsed={name:sorted({(0,z+t,0) for z,t in jets}) for name,jets in typed.items()}
    rows,W,integrals,cutoffs,inverse=record(collapsed)
    temporal_only_with_T={name:sorted({(0,z+t,0) for z,t in jets if t}) for name,jets in typed.items()}
    _,time_W,_,_,_=record(temporal_only_with_T)
    assert max(r+z for _,(r,z,l) in time_W)<=7
    c8=sorted((name,list(k)) for name,k in W if sum(k[:2])>7)
    required=sorted(('W_'+row['component'],[r,z,l]) for row in high['selectiveCovariance']['actualDemandRows']
                    if row['requiredByC98FiveMap'] and row['epsilonPower']=='1' and Q(row['bandPower'])==Q(49,2)
                    for r,z,t,l in [row['RZTL']] if not t)
    assert c8==required==[('W_rz',[0,8,0]),('W_rz',[0,8,2])]
    assert max(l for _,(r,z,l) in W)<=8
    assert max(sum(k) for k in cutoffs)<=7
    assert max(Q(row['coefficientMass']) for values in rows.values() for row in values)<2**32
    gpower=max(row['geometryPower'] for values in rows.values() for row in values)
    assert gpower<=16
    mapping={name:{row['RZL'][1]:row for row in values} for name,values in rows.items()}
    # Keep each coefficient of the product differentiated at its true order,
    # then absorb surplus epsilon rather than multiplying the larger C8 cap
    # into the common middle mean estimate.
    quad_log = Q(2,2**112) + Q(100+2*gpower,2**128)
    shifts={'P/Jz':[('beta','beta',0),('v','v',0),('gamma','gamma',0),('beta','gamma',1)],
            'Jtheta':[('v','gamma',0)]}
    debit=[]
    for key,requests in [('P/Jz',ang),('Jtheta',ax)]:
        for z,t in requests:
            n=z+t
            for a,b,dz in shifts[key]:
                m=n+dz
                for k in range(m+1):
                    first,second=mapping[a][k],mapping[b][m-k]
                    surplus=Q(first['minEpsilon'])+Q(second['minEpsilon'])+dz-1
                    band=Q(first['bandIntercept'])+Q(second['bandIntercept'])+3*m
                    charge=max(Q(0),band-(Q(1,2)+3*n))
                    assert surplus/2 > quad_log+charge/2**32636
                    debit.append((surplus,charge))
    assert min(d for d,_ in debit)>Q(9,10)
    # Support of the original FiveMap profiles lies between e X0 and e^2 X0.
    # The exact vanishing full axial moment keeps beta in the same interval.
    # Xa<X0 and exp(5)X0<Xb then give y>1, d>3 there.
    compact_log_weight_loss=Q(1,128)**2+Q(4,9)
    assert compact_log_weight_loss<1
    return {
        'axialTargetZ6AndZ4T1Attached':True,'preFiveMapDefectZTuples':{'P/Jz':sorted(ang),'Jtheta':sorted(ax)},
        'actualTemporalDerivativeOrdersZT':{key:sorted(value) for key,value in typed.items()},
        'scopeOfTimeMajorant':'Reference epsilon, pulse and torus translation are T-independent. Coefficients of chi retain all mixed derivatives. Collapse Z,T via binomial convolution only for the positive upper bound.',
        'maxMixedTimeCovarianceSlowOrder':max(r+z for _,(r,z,l) in time_W),
        'sameSelectiveC8':c8,'covarianceRoles':len(W),'shiftedPrimitiveRoles':len(integrals),
        'inverseForcingRoles':len(inverse),'quadraticGradeTests':len(debit),
        'leastQuadraticEpsilonSurplus':str(min(s for s,b in debit)),
        'mixedRZTChartAndCutoffCoefficientBitsThrough7':chart['coefficientLog2Ceilings'],
        'compactZetaRestorationCost':'<3','compactWeightLogLossUpper':str(compact_log_weight_loss),
        'gradeOnOriginalCompactSupport':{'v':'epsilon*S^(1/2+3(z+t))',
                                         'gamma':'epsilon*S^(1/2+3(z+t))',
                                         'beta':'epsilon^2*S^(7/2+3(z+t))'},
        'ordinaryStatus':'CONDITIONAL_ON_THE_SAME_C98_ORIGINAL_CHART_PULSE_COVARIANCE_AND_FLAT_REALIZATION',
    }


def angular_terminal_bound(goal, cancellation):
    outer=json.loads(pinned(goal/BAND/'angular-order-one-shell/terminal/theta-outer.json','outerN1'))
    exterior=json.loads(pinned(goal/'whole-k-annular-wrz-norm/numerical/leading-outer-c10/leading-outer-c10.json','outerC10'))
    assert outer['terminalRawDensity']['BBody']==17717057
    assert outer['actualPrimitive']['wholeAngularMoment']==117072
    assert cancellation['actualOriginalOrderOne']['exactParameterTreeSHA256']==exterior['source']['parameterExpressionSHA256']
    assert exterior['normalizedMaximum']=='2^(-65343)' and len(exterior['physicalRows'])==462

    # Normalize Taylor increments to total order n. An array majorizes
    # the sum of absolute normalized coefficients of each total degree.
    def mul(a,b,n=2):
        return [sum(a[k]*b[j-k] for k in range(j+1)) for j in range(n+1)]

    def plus(a,b):
        return [x+y for x,y in zip(a,b,strict=True)]

    def times(c,a):
        return [c*x for x in a]

    def recip(a,inv0):
        out=[inv0]
        for j in range(1,len(a)):
            out.append(inv0*sum(a[k]*out[j-k] for k in range(1,j+1)))
        return out

    # The two exact square seeds are at delta and 2-delta. For q=1/x,
    # each q^k exp(-4q^2) is bounded by ceil(k/2)! for q>=0.
    seed={0:1}
    seed_caps=[]
    for j in range(5):
        seed_caps.append(sum(abs(c)*factorial((k+1)//2) for k,c in seed.items()))
        next_seed=Counter()
        for k,c in seed.items():
            next_seed[k+3]+=8*c
            if k:
                next_seed[k+1]-=k*c
        seed=dict(next_seed)
    assert Q(64,49)<2 and 3**2==9
    factor=recip([Q(2*c,factorial(j)) for j,c in enumerate(seed_caps)],9)
    # rho <= 1. Convert the derivatives of A=A(delta) by
    # A^(m) Taylor coefficient at n = (n+m)!/n! times A's coefficient at n+m.
    factor_jets=[[factor[j+k]*Q(factorial(j+k),factorial(j)) for j in range(3)] for k in range(3)]
    assert Q(1,2)-Q(1,16)>0
    L=recip([2,1,1,0],2)
    eta=[1,1,0,0]
    az=times(2,mul(eta,L,3))
    az1=[(j+1)*az[j+1] for j in range(3)]
    bz=mul(plus(mul(eta,az),mul([1,2,1],az1)),L)
    g=times(2,mul([1,2,1],[2,2,1]))
    h_composition=plus([1,2*g[1],2*g[2]],[0,0,6*g[1]**2])
    fheat=mul([2,4,4],h_composition)
    # At eta=1 the heat argument is zero and H(0)=1 at Xb.
    # The authenticated exterior therefore bounds the actual factor
    # amplitude*Xb^(-1-h) by 2^-65343. The rest of fheat is calculated above.
    def delta_pow(k):
        return [comb(k,j)*Q(1,4)**(k-j) if j<=k else 0 for j in range(3)]

    A0,A1,A2=factor_jets
    # Keep all five terms of the original B, including the b_z term.
    even=plus(plus(mul(delta_pow(6),A2),times(16,mul(delta_pow(3),A1))),
              mul(plus([64,0,0],times(24,delta_pow(2))),A0))
    odd=plus(mul(delta_pow(6),A1),times(8,mul(delta_pow(3),A0)))
    B=mul(mul([1,2,2],fheat),plus(mul(mul(az,az),even),mul(bz,odd)))
    B_ordinary=[factorial(j)*B[j] for j in range(3)]
    assert max(B_ordinary)<2**343
    # Original backward T_theta,1 uses Xb exp(delta) times that integral.
    # Its two normal derivatives use 1 and derivative 1 of
    # exp(-4/u^2)u^-6 B, bounded by 15 times the same B cap at pole 9.
    assert Q(16,125)<1
    assert 2*2*(1+2+15) < 2**7
    return {
        'actualB':17717057,'literalOriginalIntegrand':117048,'originalWholeMoment':117072,
        'scope':'Actual terminal outer interval 0<delta<=1/4, with the original n=1 conservative moment, tail factorization and inward eta traces.',
        'sourceHeatAmplitudeBound':'2^-65343 from its actual exterior value at (Xb,eta=1), H(0)=1',
        'unscaledBDerivativeMajorantsBeforeHeatAmplitude':[str(x) for x in B_ordinary],
        'uniformMixedBDerivativeCapThrough2':'2^-65000',
        'weightedStressRemainderPoleByDeltaOrder':[3,6,9],
        'terminalTthetaOneCoefficient':'2^-64993 * Xb times zeta*delta^(-3-3r) for partial_delta^r partial_eta^k, r+k<=2',
        'normalizationStages':'The original whole moment and backward representation are retained. The two-end zeta is restored using y>7/4 and t1<1/128.',
        'excludes':'The interior n=1 stress and other original stress arms are separately required.'
    }


def main():
    assert __debug__
    parser=ArgumentParser(description=__doc__)
    for name in ('goal','artifact','cache','runtime','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    a=parser.parse_args()
    paths={
        'reader':BASE/'spatial-readback/source_stream.py','cache':BASE/'live-wave-gauge/signed/source_cache.py',
        'exact':Path('first-force-repair/verify_repaired_first_force.py'),
        'pressureChecker':BAND/'weighted-haar-shell/pressure/check_pressure_shell.py',
        'pressureReceipt':BAND/'weighted-haar-shell/pressure/pressure-shell.json',
        'meanGroups':BAND/'weighted-haar-shell/mean/mean-shell.json',
        'wholeN1Cancellation':BAND/'signed-polynomial-shell/original-angular-cancellation.json',
        'signedShell':BAND/'signed-shell/signed-shell.json',
        'c98Mean':BAND/'first-forced-budget/native-mean-pressure/mean-pressure-enclosure.json',
    }
    reads={key:pinned(a.goal/path,key) for key,path in paths.items()}
    flux=pinned(a.runtime/'mathscope-m3/navier/source-updated-mean-stress.mjs','sourceConservativeFlux')
    equations=pinned(a.runtime/'mathscope-m3/navier/source-full-mean-equations.mjs','sourceMeanEquations')
    assert b'G.add(time(w),Dr(radialFluxes[j]),Dz(axialFluxes[j]))' in flux
    assert b'G.mul(q(1,2),whole(G.mul(G.pow(R,2),stage.mean.haarGr)))' in flux
    assert b'G.derivative(G.add(Jz,G.mul(cRho,P)),Z)' in flux
    assert b'G.mul(epsilon,lapVector(beta))' in equations
    stress=json.loads(reads['meanGroups'])['actualFullStressArms']
    assert len(stress)==2 and all(row['matchedMonomials']==8 for row in stress)
    cancellation=json.loads(reads['wholeN1Cancellation'])
    n1=cancellation['tangentialWhole']
    assert [n1[key]['originalTotal'] for key in ('theta','axial')]==[117072,117075]
    assert all(val['totalIdentity'] and val['sameForwardBackwardDensity'] and val['reducedConservativeTotal']==0
               for val in n1.values())
    assert cancellation['leadingAngular']['preHeatConstant'] and cancellation['leadingAngular']['checkedFullAlgebra']
    assert json.loads(reads['c98Mean'])['conditionalEnergyAttachment']['threeDisjointTwoModeEnergyRatioStrictUpper']=='2^-30'
    sys.path[:0]=[str((a.goal/paths[key]).parent) for key in ('reader','cache','exact')]
    import source_stream
    import source_cache
    from verify_repaired_first_force import Exact

    folder=a.artifact/'first-correction-spatial-source'
    manifest=json.loads(pinned(folder/source_stream.MANIFEST,'manifest'))
    registry=source_stream.Native(folder,manifest)
    assert registry.pin==PINS['registry']
    stream=source_cache.load(source_stream,folder,manifest,22153782,a.cache)
    try:
        assert stream.verify['nodes']==22155584 and stream.verify['sha256']==PINS['stream']
        old=runpy.run_path(str(a.goal/paths['pressureChecker']))
        view=old['Graph'](stream)
        E=Exact(view)
        actual=current_stage(stream,registry,E)
        live_pressure=old['check_live'](view,registry,E)
        groups=group_actual_haar(stream,registry,E)
        frontier=norm_frontier()
        may_use_compact=compact_five_map(a.goal,frontier)
        terminal=angular_terminal_bound(a.goal,cancellation)
        result={
            'schema':'MathScope.C99.SignedCenteredFluxAndHaarPressure/1',
            'status':'VERIFIED_NATIVE_SIGNED_FLUX_PRESSURE_AND_COMPACT_TARGETS_CONDITIONAL_WEIGHTED_DONORS',
            'pins':PINS,'sourceStream':stream.verify,'native':actual,
            'originalShiftedPressure':live_pressure,'fullHaarGroups':groups,
            'pressureCentering':pressure_algebra(E),
            'angularAndAxialCompatibility':{
                'pressureMoment':'J(R*pbar)=-J(R^2*gbar)/2+c_rho*P; both endpoint pressure values are zero by the whole normalization.',
                'weightedConservation':'J(Haar(R^2*v))=J(Haar(R*gamma))=0 as functions, by the initial FiveMap and Temporal rows and unchanged mean velocities during Forced.',
                'targetIdentity':'D_theta=Jtheta=J(Gtheta) and D_z=Jz+c_rho*P=J(Gz) once the original viscous total and pressure moment are supplied.',
                'centeredSigma':'-R^-e*(F-F(alpha)-chi*(F(beta)-F(alpha))-epsilon*T0(W_T)+epsilon*T0(G_Z)-epsilon*D_Z*T0(rho))',
                'timeCorrection':'T0(W_T)=partial_T(T0 W)+chi_T*J(W), and the latter product vanishes only under fixed-envelope conservation.',
                'normalizationScope':'Haar is over the original two-torus, fixed radial limits and original flat support. The native equations retain the whole terms and uncollapsed product rule.',
            },
            'numericalFrontier':frontier,'compactInitializedFiveMapAttachment':may_use_compact,
            'finiteGaussianTransfer':gaussian_transfer(),'actualAngularN1TerminalBound':terminal,
            'n1OriginalStressEvidence':{'angularTotal':117072,'axialTotal':117075,'originalPrefixSHA256':cancellation['originalPrefix']['sha256'],
                                       'originalWholeIntegrandsInOrder':[117048,117047],
                                       'conditionalOuterRegularCoefficientAttached':17717057},
            'open':['Actual uniform phase-free Forced pure Z^5 donor and retained physical weighted coefficients',
                    'Retained uncut stress norms in the interior and leading and remaining higher stress arms',
                    'Whole K1, later Temporal/FiveMap, all-stage energy and convergence'],
            'finalJets':0,'release':'HOLD',
        }
    finally:
        stream.__exit__()
    a.out.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n',encoding='utf8',newline='\n')
    print('PASS actual Signed centered fluxes, latest pressure normalization and complete Haar grouping')
    print('Source monomial counts:',[x['terms'] for x in result['fullHaarGroups']])
    print('Receipt SHA256:',sha256(a.out.read_bytes()).hexdigest())


if __name__=='__main__':
    main()
