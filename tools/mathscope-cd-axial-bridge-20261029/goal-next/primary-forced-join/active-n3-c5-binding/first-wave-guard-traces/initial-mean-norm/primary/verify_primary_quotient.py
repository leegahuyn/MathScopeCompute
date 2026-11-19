"""Bind the original Primary quotients and propagate their outer weights."""

from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from math import comb, factorial
from pathlib import Path
import json
import sys


R, Z, T, V, ELL, XI = 17732748, 17732749, 17732750, 17732751, 17732737, 17733037
Y0, Y1, SQRT2 = 17745430, 17745431, 3622
S, EPS, SQEPS, K, LS = 17732741, 17732744, 17732745, 17732747, 17733029
R0, CHI, PSI, SLOW, RADIAL = 14220486, 17733045, 17733057, 17735301, 17735155
PARTS = ('real', 'imaginary')
FIFTH = (0,0,0,0,1)
PINS = {
    'live':'23d3577bc75eb2a6587eb5839a7c6b9f834814e46c335c136fb165757f03aa39',
    'scale':'71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa',
    'frame':'56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d',
    'frameCheck':'38fdd2226e02fd4868f3c0eb48617bdf714fb80971a7001888daacf74d3d6fb9',
    'matrix':'e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36',
    'band':'4e334a10ed93839437baa8b2caefe36d32291bfc6c3d67d3b8b04c41fa797ba0',
    'forced':'dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d',
    'radial':'bd1974a286e1bb99f07c780b8a3ca29dc2ff65347231cfa36a31bb744133eb3d',
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'cache':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'reader':'6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
    'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
}
STREAM = 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'


def load(path, name):
    data=path.read_bytes()
    if path.suffix=='.py':
        data=data.replace(b'\r\n',b'\n')
    assert sha256(data).hexdigest()==PINS[name], name
    return data


def alle(g, i, op):
    record=g.record(i)
    if record['op']==op:
        return [j for child in record['args'] for j in alle(g,child,op)]
    return [i]


def cross(e, left, right):
    return [e.sub(e.mul(left[i],right[j]),e.mul(left[j],right[i])) for i,j in ((1,2),(2,0),(0,1))]


def geometry(g, e):
    assert g.args(S,'integer_power')==[ELL,2]
    assert g.args(SQEPS,'sqrt_positive')==[EPS]
    factors=alle(g,SLOW,'multiply')
    assert set(factors)=={17735193,17735228,17735263,17735298}
    def check_bump(root, expected):
        magnitude,lo,hi,left,active,right=g.args(root,'smooth_piecewise')
        assert [g.rational(i) for i in (lo,hi,left,right)]==[Q(1,4),Q(3,4),Q(1),Q(0)]
        [squared]=g.args(magnitude,'sqrt_positive')
        shifted,power=g.args(squared,'integer_power')
        assert power==2 and e.of(shifted)==expected
        step,j=g.args(active,'source_step_derivative')
        assert j==0 and e.of(step)==e.sub(e.scalar(Q(3,2)),e.mul(e.scalar(2),e.of(magnitude)))

    def check_partition(root, offset):
        actual, lo, hi, before, body, after=g.args(root,'smooth_piecewise')
        assert actual==offset and g.rational(lo)==Q(-3,4) and g.rational(hi)==Q(3,4)
        assert before==after==0
        numerator, inverse=g.args(body,'multiply')
        [sqrt_denominator]=g.args(inverse,'inverse')
        [denominator]=g.args(sqrt_denominator,'sqrt_positive')
        bumps=[g.args(leaf,'integer_power') for leaf in alle(g,denominator,'add')]
        assert len(bumps)==3 and all(power==2 for _,power in bumps) and numerator in [b for b,_ in bumps]
        for relative in (-1,0,1):
            expected=e.sub(e.of(offset),e.scalar(relative))
            candidates=[]
            for b,_ in bumps:
                [magn,*_]=g.args(b,'smooth_piecewise')
                [square]=g.args(magn,'sqrt_positive')
                arg,power=g.args(square,'integer_power')
                assert power==2
                if e.of(arg)==expected:
                    candidates.append(b)
            [bump]=candidates
            check_bump(bump,expected)
            assert (bump==numerator)==(relative==0)
        return denominator

    partition={}
    for axis,root,offset,grid in ((R,17735228,17735196,17733856),
                                  (Z,17735263,17735231,17733857),
                                  (T,17735298,17735266,17733858)):
        assert g.args(17733859,'integer_power')==[ELL,6]
        assert e.of(offset)==e.sub(e.mul(e.of(17733859),e.of(axis)),e.of(grid))
        denominator=check_partition(root,offset)
        partition[str(axis)]={'cutoff':root,'offset':offset,'meshLabel':grid,'denominator':denominator}
    band_offset,*guards=g.args(17735193,'smooth_piecewise')
    assert band_offset==17735160 and guards[2]==guards[-1]==0
    assert g.args(17735156,'log_positive')==[17732776]
    assert e.of(band_offset)==e.sub(e.neg(e.mul(e.of(17735156),e.inv(e.of(127)))),e.of(ELL))
    band_denominator=check_partition(17735193,band_offset)
    magnitude,*bounds=g.args(CHI,'smooth_piecewise')
    assert bounds[2]==1 and bounds[4]==0 and [g.rational(i) for i in bounds[:2]]==[Q(1,4),Q(3,4)]
    [square]=g.args(magnitude,'sqrt_positive')
    ratio,power=g.args(square,'integer_power')
    assert power==2 and e.of(ratio)==e.mul(e.of(XI),e.inv(e.of(R0)))
    check_bump(CHI,e.of(ratio))
    first,second=g.args(PSI,'multiply')
    x,j=g.args(first,'source_step_derivative')
    y,k=g.args(second,'source_step_derivative')
    z=e.mul(e.scalar(20),e.of(V),e.inv(e.of(LS)))
    assert j==k==0 and e.of(x)==e.sub(z,e.scalar(4)) and e.of(y)==e.sub(e.scalar(16),z)

    q, exponent_floor=17732740,17733022
    [p_exp]=g.args(17734059,'exp')
    assert g.args(17734042,'log_positive')==[17734041]
    assert e.of(p_exp)==e.mul(e.of(exponent_floor),e.of(17734042))
    assert e.of(17734041)==e.sub(e.scalar(4),e.of(SQRT2))
    assert e.of(14220487)==e.add(e.scalar(4),e.of(SQRT2))
    assert g.args(17733017,'log_positive')==[14220487]
    assert e.of(17734043)==e.mul(e.of(17734042),e.inv(e.of(17733017)))
    assert g.rational(17734044)==Q(1,100000)
    assert e.of(17734049)==e.mul(e.scalar(2),e.sub(e.mul(e.add(e.one,e.of(9)),e.of(17734043)),
                                               e.mul(e.of(9),e.of(17734044))))
    [i_time]=g.args(17733024,'exp')
    [q_time]=g.args(17733026,'exp')
    assert e.of(i_time)==e.mul(e.of(exponent_floor),e.of(17733017))
    assert g.args(17732742,'log_positive')==[q]
    assert e.of(q_time)==e.mul(e.add(e.one,e.of(9)),e.of(17732742))
    assert e.of(17733027)==e.mul(e.of(17733024),e.of(17733026))
    [epsilon_exp]=g.args(EPS,'exp')
    assert e.of(epsilon_exp)==e.mul(e.of(9),e.of(17732742))
    assert g.args(17734050,'sqrt_positive')==[q]
    assert e.of(17734051)==e.mul(e.of(17734050),e.of(R))
    [power_of_radius]=g.args(17734062,'exp')
    assert g.args(17734060,'log_positive')==[17734051]
    assert e.of(power_of_radius)==e.mul(e.of(17734049),e.of(17734060))
    assert e.of(RADIAL)==e.mul(e.of(17734059),e.of(17734062),e.of(17734049),e.inv(e.of(R)))
    return {'partition':partition,'slowBandFactor':17735193,'slowBandOffset':band_offset,'slowBandDenominator':band_denominator,
            'transverseXiCutoff':CHI,'fastTimeCutoff':PSI,'stepArguments':[x,y],
            'radialFast':RADIAL,'radialExponent':17734049,'rho':17734043,'kappaRadial':17734044,
            'radialSourcePowerIdentity':'Lambda^i*Q^(d_r/2)=ci^rho_g*epsilon^(-1/100000)',
            'radialPalette':exponent_floor,'sqrtQ':17734050,'physicalNormalizedR':17734051}


def verify_primary(g, Exact, source, frame, live, bound, registry):
    base=json.loads(registry['base']['base']['expression'])
    definitions=json.loads(registry['definitions'])[0]
    bodies={d['id']:d for d in definitions}
    e0=Exact(SimpleView(g))
    meta=geometry(g,e0)

    class Forms(frame.Forms):
        @cache
        def val(self, root, substitute, bound=()):
            if root in bound or (substitute and root in self.replacements):
                return super().val(root,substitute,bound)
            op,a=self.node(root)
            at=lambda i:self.freeze(self.val(i,substitute,bound))
            if op=='source_step_derivative':
                return self.atom((op,at(a[0]),a[1]))
            if op=='actual_covariance_volterra':
                return self.atom((op,a[0],a[1],at(a[2]),tuple(map(at,a[3]))))
            return super().val(root,substitute,bound)

    roots_by_sign={}
    mass={row['sign']:row for row in live['positiveMasses']['sameMassAsColumns']}
    weights=dict(zip((1,-1),live['target']['actualSquareRoots'],strict=True))
    for sign in (1,-1):
        j=str(sign)
        f=bound['verifiedOriginalFrames'][j]
        t=[mass[sign]['positiveTangentR'],*mass[sign]['tangentialFrame']]
        original=Forms(g,Exact,{})
        e=original.a
        at=lambda i:original.val(i,False)
        a=[e.mul(at(SQEPS),at(weights[sign]),at(CHI),at(PSI),at(SLOW),at(x)) for x in t]
        normal=list(map(at,f['n']))
        c=e.inv(e.mul(at(K),at(f['q'])))
        reference=[e.mul(c,x) for x in cross(e,normal,a)]
        dot_square=e.dot(normal,normal)
        assert original.eq(dot_square,at(f['q']))
        normalized=mass[sign]['normalizedVolterraComponents']
        same_frame=[e.mul(at(f['P']),e.dot(list(map(at,row)),list(map(at,normalized)))) for row in f['B']]
        assert all(original.eq(at(root),value) for root,value in zip(t,same_frame,strict=True))
        [tangent_squared]=g.args(f['tau'],'sqrt_positive')
        assert original.eq(at(tangent_squared),e.dot(normal[1:],normal[1:]))
        vanishing=e.mul(at(f['P']),e.add(*map(at,normalized)),normal[0],
                       e.sub(e.one,e.mul(at(tangent_squared),e.pow(at(f['tau']),-2))))
        assert original.eq(e.dot(normal,list(map(at,t))),vanishing)
        matched={}
        for index, (slot, previous) in enumerate(source['originalPotentialQuotients'][j].items()):
            slot=int(slot)
            d=base[slot]
            assert d['name']==f'GlobalOriginalPotential_{sign}_{index}' and d['body']==previous['body']
            assert min(d['derivativeLimits'])>=9 and not d['unspecifiedOracle']
            assert original.eq(at(d['body']),reference[index]), (sign,slot)
            matched[str(slot)]=d['body']
        roots_by_sign[j]={'squareRootOfActualCramerWeight':weights[sign],
                          'tangentComponents':t,'normal':f['n'],'normalPrime':f['np'],
                          'potentialSlots':matched,'exactPotentialIsCrossNormalOfSameAmplitude':True,
                          'realCurlReducesToHalfAmplitudeOnPositiveFrameDomain':True}

    chart_rows=[]
    for key,row in source['normalizedPrimaryByChart'].items():
        sign=row['sign']
        sign_key=str(sign)
        level=int(key.split(':')[0])
        f=bound['verifiedOriginalFrames'][sign_key]
        previous=row['slowAndTransversePartialFactorLeaves']
        v,xi=row['unpulledPulseEndpoint'],row['xi']
        mapping=dict(zip((*frame.FORMALS,V,XI),(*frame.ACTUALS,v,xi),strict=True))
        form=Forms(g,Exact,mapping)
        e=form.a
        b=lambda i:form.val(i,True)
        a=lambda i:form.val(i,False)
        n=list(map(b,f['n']))
        t=roots_by_sign[sign_key]['tangentComponents']
        amp0=[e.mul(b(SQEPS),b(weights[sign]),b(CHI),b(SLOW),b(x)) for x in t]
        amp=[e.mul(b(PSI),x) for x in amp0]
        real_pressure=e.zero
        pressure_row=[e.sub(e.dot(n,col),b(np))
                      for col,np in zip(zip(*[list(map(b,r)) for r in frame.KBASE],strict=True),f['np'],strict=True)]
        im_pressure=e.mul(e.scalar(Q(1,2)),e.inv(e.mul(b(K),b(f['q']))),e.dot(pressure_row,amp))
        x,y=map(b,meta['stepArguments'])
        step=lambda z,k:form.atom(('source_step_derivative',form.freeze(z),k))
        psi_v=e.mul(e.scalar(20),e.inv(b(LS)),e.sub(e.mul(step(x,1),step(y,0)),
                                                   e.mul(step(x,0),step(y,1))))
        calls={}
        for item in previous.values():
            for leaf in item['factorAtoms']:
                if leaf['kind']=='formalDerivativeOfNormalizedPotential':
                    info=base[leaf['definition']]
                    params=info['parameters']
                    args,orders=leaf['arguments'],leaf['orders']
                    assert all(form.eq(a(arg),b(param)) for arg,param in zip(args,params,strict=True))
                    active=[p for p,j in zip(params,orders,strict=True) for _ in range(j)]
                    assert len(active)<=1 and all(p in (R,Z,XI) for p in active)
                    k=leaf['definition'],active[0] if active else 0
                    if k in calls:
                        assert form.eq(a(calls[k]),a(leaf['root']))
                    calls[k]=leaf['root']
        slots=list(map(int,roots_by_sign[sign_key]['potentialSlots']))
        order_vector=lambda direction:[a(calls[i,direction]) if (i,direction) in calls else None for i in slots]
        c=order_vector(0)
        dr=[e.add(cr,e.mul(b(RADIAL),cx)) if cr is not None and cx is not None else None
            for cr,cx in zip(order_vector(R),order_vector(XI),strict=True)]
        dz=[e.mul(b(EPS),cz) if cz is not None else None for cz in order_vector(Z)]
        assert all(c) and all(x is not None for x in (dz[1],dz[0],dr[2],dr[1]))
        real=[e.mul(e.scalar(Q(-1,2)),b(K),x) for x in cross(e,n,c)]
        imag=[e.mul(e.scalar(Q(1,2)),x) for x in (
            e.neg(dz[1]),e.sub(dz[0],dr[2]),e.add(dr[1],e.mul(e.inv(b(R)),c[1])))]
        normalized_names={}
        for slot,item in previous.items():
            d=bodies[slot]
            name=d['name']
            if 'Wave_' in name:
                idx,part=name.rsplit('_',2)[1:]
                expected=(real if part=='real' else imag)[int(idx)]
                # Independently verify the leading triple product via the
                # original tangent amplitude; real potential calls themselves
                # have already been attached to the corresponding originals.
                assert form.eq(a(d['body']),expected), (key,name)
            elif 'Pressure_' in name:
                expected=im_pressure
                assert name.endswith('_imaginary') and real_pressure==e.zero
                assert form.eq(a(d['body']),expected), (key,name)
            else:
                idx=int(name.rsplit('_',1)[1])
                expected=e.mul(e.scalar(Q(1,2)),psi_v,amp0[idx])
                assert form.eq(a(d['body']),expected), (key,name)
            normalized_names[name]=d['body']
        chart_rows.append({'key':key,'level':level,'sign':sign,'xi':xi,'v':v,
                           'completeSameBodyBindings':normalized_names,
                           'physicalCurlPotentialPartialRoots':[[i,p,root] for (i,p),root in sorted(calls.items())]})
    return {'fixedGeometry':meta,'families':roots_by_sign,'tenCharts':chart_rows}


class SimpleView:
    def __init__(self,g):
        self.g=g

    def node(self,i):
        r=self.g.record(i)
        return r['op'],r['args']


def affine_partial(e, poly, index):
    out=[]
    for monomial, scalar in poly.items():
        powers=dict(monomial)
        present=powers.pop(index,0)
        assert present in (0,1)
        if present:
            out.append({tuple(powers.items()):scalar})
    return e.add(*out)


def along_fixed_pulse(g, Exact, source, demand):
    """Isolate all normalized source terms that differentiate the pulse variable."""
    e=Exact(SimpleView(g))
    needed={1:defaultdict(set),2:defaultdict(set)}
    request=[tuple(x) for x in demand['radialJetDemand']['forcingAndMatrixDirections']]
    assert len(request)==23 and max(map(sum,request))==4
    records=[]
    for case in source['cases']:
        key,mode=case['chart'],case['mode']
        chart=source['normalizedPrimaryByChart'][key]
        gradients={axis:[affine_partial(e,e.of(chart[root]),axis) for root in ('xi','unpulledPulseEndpoint')]
                   for axis in (Y0,Y1)}
        atoms={x['root']:x for x in case['rawJetAtoms']}
        native={x['definition']:x for x in chart['slowAndTransversePartialFactorLeaves'].values()}
        next_symbol=g.count+1
        symbols={}
        pulse_symbols=set()

        def jet_atom(definition, index):
            sym=symbols.setdefault((definition,index),next_symbol+len(symbols))
            if index[-1]:
                pulse_symbols.add(sym)
            return {((sym,1),):Q(1)}

        @cache
        def lift(i):
            if i not in atoms:
                return e.of(i)
            atom=atoms[i]
            if not atom['factorDegree']:
                return {((i,1),):Q(1)}
            seed=atom['nativeDefinition']
            params=native[seed]['formalParameters']
            orders=dict(zip(params,atom['orders'],strict=True))
            assert all(not n or j in (R,Z,T,Y0,Y1) for j,n in orders.items())
            y0,y1=orders.get(Y0,0),orders.get(Y1,0)
            r,z,t=(orders.get(axis,0) for axis in (R,Z,T))
            base_index=(r,z,t,y0+y1,0)
            for dr,dz,dl in request:
                needed[mode][atom['role']].add((r+dr,z+dz,t,y0+y1+dl,0))
            if not (y0+y1):
                return jet_atom(seed,base_index)
            result=[]
            for j in range(y0+1):
                for k in range(y1+1):
                    v=j+k
                    x=y0+y1-v
                    scalar=e.scalar(comb(y0,j)*comb(y1,k))
                    coefficient=e.mul(scalar,e.pow(gradients[Y0][0],y0-j),e.pow(gradients[Y0][1],j),
                                       e.pow(gradients[Y1][0],y1-k),e.pow(gradients[Y1][1],k))
                    result.append(e.mul(coefficient,jet_atom(seed,(r,z,t,x,v))))
            return e.add(*result)

        for component in case['scalars']:
            active=[]
            for coefficient, monomial in component['termsAfterFactoringPToMode']:
                if not any(i in atoms and atoms[i]['factorDegree'] and
                           any(a and axis in (Y0,Y1) for axis,a in
                               zip(native[atoms[i]['nativeDefinition']]['formalParameters'],
                                   atoms[i]['orders'],strict=True)) for i,_ in monomial):
                    # Populate the complete independent non-v derivative inventory.
                    for i,_ in monomial:
                        if i in atoms and atoms[i]['factorDegree']:
                            lift(i)
                    continue
                term=e.mul(e.scalar(Q(coefficient)),*(e.pow(lift(i),n) for i,n in monomial))
                active.append({key:value for key,value in term.items() if any(i in pulse_symbols for i,_ in key)})
            found=e.add(*active)
            if mode==1:
                slot=component['gaussianRatePartBeforeProjection']['normalizedPrimaryVelocity']
                expected=jet_atom(slot,FIFTH)
                for dr,dz,dl in request:
                    needed[mode]['u'].add((dr,dz,0,dl,1))
            else:
                expected=e.zero
            difference=e.sub(found,expected)
            assert not e.reduce_sqrt_two(difference,SQRT2) or not e.reduce_sqrt_two(
                e.clear_compound_denominators(difference),SQRT2), (key,mode,component['coordinate'],component['part'])
        records.append({'key':key,'mode':mode,'independentPulseDerivativesOfNormalizedFields':
                        'first derivative of matching u, coefficient +1' if mode==1 else 'identically zero'})
    assert len(records)==20
    assert set(needed[1])=={'u','p','tail'} and set(needed[2])=={'u'}
    demand_table={str(m):{role:sorted(orders) for role,orders in sorted(roles.items())}
                  for m,roles in sorted(needed.items())}
    maxima={str(m):{role:{'maxSlow':max(sum(x[:3]) for x in orders),
                          'maxXi':max(x[3] for x in orders),
                          'maxPulse':max(x[4] for x in orders),
                          'maxTotal':max(map(sum,orders))}
                    for role,orders in sorted(roles.items())} for m,roles in sorted(needed.items())}
    assert set(needed[1]['u']) >= {FIFTH} and max(x[4] for x in needed[1]['u'])==1
    assert maxima['1']['u']['maxTotal']==6
    assert maxima['1']['p']['maxTotal']==5
    assert maxima['1']['tail']['maxTotal']==4
    assert maxima['2']['u']['maxTotal']==5
    return {'independentAxes':['R','Z','T','xi','v'],'nativeRawScalarsChecked':120,
            'pulseDerivativeCancellations':records,'sufficientThroughC87SpatialLowerSet':demand_table,
            'componentRoleBounds':maxima}


def caps(blocks):
    """Exact max-exponent ledger using only separated source factors."""
    old=blocks['matrix']['sharpBandDegreeAudit']['exactDerivativeLedgers']
    for key in ('n','nPrime','inverseNormalSquared','movingBasisInfinityNorm',
                'normalizedMode1And2MatrixInfinityNorm','BPrime','cylindricalK'):
        values=[row[-1] for row in old[key]]
        assert len(values)==9 and all(k<=j for j,k in enumerate(values)), key
    sqrt_weight=[Q(row['sqrtW']) for row in blocks['scale']['scaleRows']]
    tangent=[Q(row['tangentOverP']) for row in blocks['scale']['scaleRows']]
    state=[Q(row['normalizedPulseDerivatives']) for row in blocks['scale']['scaleRows']]
    assert sqrt_weight==[2*j+Q(1,4) for j in range(9)]
    assert tangent==state==[2*j for j in range(9)]
    assert blocks['band']['scaleTransfer'][-1]['boundFieldOrderAvailable']==10

    def combine(a,b,top=8):
        return [max(a[k]+b[j-k] for k in range(j+1)) for j in range(top+1)]

    n=[Q(r[-1]) for r in old['n']]
    n_prime=[Q(r[-1]) for r in old['nPrime']]
    qinv=[Q(r[-1]) for r in old['inverseNormalSquared']]
    basis=[Q(r[-1]) for r in old['movingBasisInfinityNorm']]
    basis_prime=[Q(r[-1]) for r in old['BPrime']]
    M=[Q(r[-1]) for r in old['normalizedMode1And2MatrixInfinityNorm']]
    Kgrad=[Q(r[-1]) for r in old['cylindricalK']]
    g=[Q(0)]*9
    partition=[Q(3*j) for j in range(9)]
    # Differentiating T=B w with respect to v uses B_v w + B M w.
    tangent_prime=[max(a,b) for a,b in zip(combine(basis_prime,state),
                                          combine(combine(basis,M),state),strict=True)]
    assert tangent_prime==tangent
    amplitude=combine(combine(combine(g,partition),sqrt_weight),tangent)
    amp_prime=combine(combine(combine(g,partition),sqrt_weight),tangent_prime)
    # The second contribution from psi_v has one inverse Ls, hence one less S.
    amp_prime=[max(x,y-1) for x,y in zip(amp_prime,amplitude,strict=True)]
    assert amplitude==amp_prime==[3*j+Q(1,4) for j in range(9)]
    potential=combine(combine(n,qinv),amplitude)
    q_inv_prime=combine(combine(n,n_prime),combine(qinv,qinv))
    potential_prime=[max(i,j,k) for i,j,k in zip(combine(combine(n_prime,qinv),amplitude),
                    combine(combine(n,q_inv_prime),amplitude),combine(combine(n,qinv),amp_prime),strict=True)]
    assert potential==potential_prime==amplitude
    pressure=combine(combine([max(a,b) for a,b in zip(combine(n,Kgrad),n_prime,strict=True)],qinv),amplitude)
    assert pressure==amplitude
    assert Q(14)**2>Q(9)**2*2  # Lambda^2 > Tg implies rho_g>1/2.
    assert Q(1,100000)<Q(1,2)

    # Exact, normalized d-derivative polynomials for g. Each table uses
    # the same d^(-3j), so taking an additional slow differentiation adds
    # at most three Laurent powers after the ordinary composite chain rule.
    poly=[Q(1)]
    gauss=[]
    for j in range(9):
        absolute_poly_cap=sum(abs(c)*Q(1,16)**k for k,c in enumerate(poly))
        gauss.append({'order':j,'afterBaseLogPole':3*j,
                      'polynomialInD2':[str(p) for p in poly],
                      'absolutePolynomialCapOnDAtMostQuarter':str(absolute_poly_cap)})
        next_poly=[Q(0)]*(len(poly)+1)
        for k,coefficient in enumerate(poly):
            next_poly[k]+=4*coefficient
            next_poly[k+1]+=(2*k-Q(3,2)-3*j)*coefficient
        poly=next_poly

    terms=[]
    def row(role, component, j, exponent, eps, inverse_k, extra_pole=0, rho_multiplicity=0):
        terms.append({'role':role,'components':component,'slowOrder':j,
                      'constantSPower':str(exponent),'additionalMinusRhoSPower':rho_multiplicity,
                      'epsilonPower':str(eps),'inverseCarrierPower':inverse_k,
                      'totalLogPoleAfterG':3*j+extra_pole})

    for j in range(9):
        h=amplitude[j]
        row('weightedAmplitudeOverP','all',j,h,Q(1,2),0)
        row('potentialOverP','all',j,h,Q(1,2),1)
        if j<=7:
            row('velocityRealOverP','all',j,h,Q(1,2),0)
            row('velocityImaginarySlowZOverP','r,theta',j,potential[j+1],Q(3,2),1,3)
            row('velocityImaginarySlowROverP','theta,z',j,potential[j+1],Q(1,2),1,3)
            row('velocityImaginaryTransverseOverP','theta,z',j,h,Q(1,2)-Q(1,100000),1,0,1)
            row('velocityImaginaryCylindricalConnectionOverP','z',j,h,Q(1,2),1)
            row('pressureOverP','imaginary',j,pressure[j],Q(1,2),1)
            row('principalTailOverP','real',j,h-1,Q(1,2),0)
    assert sum(1 for i in terms if i['role']=='velocityRealOverP')==8
    return {'slowAxes':['R','Z','T'],'fixedBand':'S=ell^2',
            'squareRootGeometricTarget':'A_sigma=g(d)*sqrt(W_sigma) on 0<d<=1/4',
            'physicalWeightsTableInterpretation':'Multiply the source-only constant by g(d), d^(-totalLogPoleAfterG), epsilon^epsilonPower, k^(-inverseCarrierPower), S^(constantSPower-additionalMinusRhoSPower*rho_g).',
            'bounds':terms,'flatRadialGaussianDerivativeChecks':gauss,
            'transverseDerivativeCoverage':{'normalizedVelocityL':8,'normalizedPotentialXi':9,
                                            'costInSAndLaurent':0,'cover':'L=Lambda^delta*partial_xi'},
            'firstPulseDerivativeCoverage':{'normalizedAmplitudePotentialVelocity':True,
                                             'addsBandOrLogLoss':False,
                                             'rule':'partial_v(Bw)=B_v w+B M_1 w; (q^-1)_v=-2(n dot n_v)/q^2; psi_v costs S^-1'},
            'matrixAndWeightClosure':'original F/G C10 provides the needed frame and matrix order eight; C89 supplies sqrt(W) and tangent/B closure through slow order eight on the admitted family',
            'meshCutoffChain':'Each of R,Z,T mesh offsets is ell^6 times the corresponding coordinate minus a fixed grid integer, so each mesh derivative costs S^3. The band factor is controlled by slow chart derivatives and the source cutoff derivative caps.',
            'alternativeEpsilonSlack':'For the pinned source label threshold, the C89 band inequality absorbs an additional S^j for 0<=j<=8 into epsilon^(-2^-20). This changes the indicated epsilon exponent.',
            'cutoffDerivativeConstants':cutoff_constants(),
            'sourceConstantsStillRequired':['fixed source radius bounds and slow-chart derivative constants for the band offset',
                                           'ordinary slow derivatives of d over the admitted chart',
                                           'positive target / same-box covariance and C89 propagation constants',
                                           'uniform weight constants after assembling native initialized mean and ambient geometry'] }


def cutoff_constants():
    """Integer bounds for original sigma_2, bump and normalized partition."""
    maximum=9
    assert sum(Q(1,factorial(k)) for k in range(11))+Q(12,11*factorial(11)) < Q(11,4)
    assert Q(11,4)**4<64
    seed_bound=[]
    seed_poly={0:1}
    for j in range(maximum+1):
        seed_bound.append(sum(abs(coef)*max(1,(m+1)//2)**max(1,(m+1)//2) for m,coef in seed_poly.items()))
        following=defaultdict(int)
        for exponent,coefficient in seed_poly.items():
            following[exponent+3]+=2*coefficient
            if exponent:
                following[exponent+1]-=exponent*coefficient
        seed_poly=dict(following)
    reciprocal=[64]
    sigma=[1]
    for j in range(1,maximum+1):
        reciprocal.append(128*sum(comb(j,i)*seed_bound[i]*reciprocal[j-i] for i in range(1,j+1)))
        sigma.append(sum(comb(j,i)*seed_bound[i]*reciprocal[j-i] for i in range(j+1)))
    bump=[2**j*sigma[j] for j in range(maximum+1)]

    def ordinary(a,b,j):
        return sum(comb(j,k)*a[k]*b[j-k] for k in range(j+1))

    # One of the three translates is within 1/2. Its transition argument
    # is at least 1/2, so its value is at least sigma_2(1/2)=1/2.
    squared_sum=[3*ordinary(bump,bump,j) for j in range(maximum+1)]
    inverse_root=[Q(2)]
    for j in range(1,maximum+1):
        squared=[ordinary(inverse_root,inverse_root,k) for k in range(j)]
        cubed=[ordinary(squared,inverse_root,k) for k in range(j)]
        inverse_root.append(Q(1,2)*sum(comb(j-1,k)*squared_sum[k+1]*cubed[j-1-k] for k in range(j)))
    partition=[Q(1)]+[ordinary(bump,inverse_root,j) for j in range(1,maximum+1)]
    psi=[20**j*ordinary(sigma,sigma,j) for j in range(maximum+1)]
    assert psi[1]==40*sigma[1] and all(x.denominator==1 for x in partition)
    return {'maximumOrdinaryOrder':maximum,'sigma2DerivativeBounds':[str(x) for x in sigma],
            'bumpInDimensionlessOffset':[str(x) for x in bump],
            'normalizedFixedLabelPartitionInDimensionlessOffset':[str(x) for x in partition],
            'chiXiDerivativeCap':'Multiply bumpInDimensionlessOffset[j] by r0^(-j).',
            'psiDerivativeCapBeforeLengthScale':[str(x) for x in psi],
            'psiLengthFactor':'Multiply by Ls^(-j) <= (Lmin*S)^(-j).',
            'actualPrimitiveAndEndpointPremise':'Original source_step_derivative denotes the square-seed activation and its matching constant endpoint jets.',
            'derivativeRecurrence':'Use the ordinary reciprocal for the activation denominator and y_prime=-D_prime*y^3/2 for the positive partition inverse square root.'}


def main():
    if not __debug__:
        raise RuntimeError('Python assertions are required')
    cli=ArgumentParser(description=__doc__)
    for name in ('goal','artifact','cache','out'):
        cli.add_argument('--'+name,type=Path,required=True)
    a=cli.parse_args()
    active=a.goal/'primary-forced-join/active-n3-c5-binding'
    shell=active/'first-wave-guard-traces'
    outer=shell/'outer-normalized-amplitude'
    host=a.artifact/'first-correction-spatial-source'
    paths={
        'live':outer/'outer-live.json','scale':outer/'outer-scale.json',
        'frame':outer/'pulse-frame/pulse-frame-caps-final.json',
        'frameCheck':outer/'pulse-frame/verify_all_label_pulse.py',
        'matrix':shell/'outer-fixed-label-norm/matrix/matrix-s-j.json',
        'band':shell/'outer-fixed-label-norm/band-weight.json',
        'forced':shell/'forced-normalized-variation/source/normalized-first-forced.json',
        'radial':shell/'temporal-weighted-inverse/first-forced-covariance/outer-covariance-final.json',
        'manifest':host/'original-source-export-manifest.json',
        'registry':host/'original-source-functions.json',
        'cache':active/'live-wave-gauge/signed/source_cache.py',
        'reader':active/'spatial-readback/verify_spatial_artifact.py',
        'exact':a.goal/'first-force-repair/verify_repaired_first_force.py',
    }
    data={k:load(path,k) for k,path in paths.items()}
    sys.path[:0]=[str(paths[k].parent) for k in ('cache','reader','exact','frameCheck')]
    import source_cache
    import verify_spatial_artifact
    import verify_all_label_pulse as frame
    from verify_repaired_first_force import Exact
    blocks={k:json.loads(data[k]) for k,path in paths.items() if path.suffix=='.json'}
    g=source_cache.load(verify_spatial_artifact,host,blocks['manifest'],22153782,a.cache)
    try:
        assert g.verify['sha256']==STREAM and g.count==22155584
        actual=verify_primary(g,Exact,blocks['forced'],frame,blocks['live'],blocks['frame'],blocks['registry'])
        demands=along_fixed_pulse(g,Exact,blocks['forced'],blocks['radial'])
    finally:
        g.__exit__(None,None,None)
    result={'status':'VERIFIED_ACTUAL_PRIMARY_QUOTIENT_BODIES_AND_CONDITIONAL_WEIGHT_DEGREES',
            'inputPins':PINS,'sourceStream':g.verify,'exactSameBody':actual,'firstForcedDemand':demands,
            'weightedQuotientLedger':caps(blocks),'finalJets':0,'release':'HOLD'}
    with a.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])


if __name__=='__main__':
    main()
