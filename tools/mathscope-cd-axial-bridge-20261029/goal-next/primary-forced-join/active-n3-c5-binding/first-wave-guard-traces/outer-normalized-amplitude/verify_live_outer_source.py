"""Match the regular outer target and masses to the same active band."""

from argparse import ArgumentParser
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys

ACTIVE = 'primary-forced-join/active-n3-c5-binding'
BAND = ACTIVE + '/first-wave-guard-traces'
PINS = {
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'stream':'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96',
    'gaussian':'16906cc8b40c719d9c2de416490499c632df9a59376378b313831ef93868144e',
    'angular':'0e9c0536e8ebeff64e8465e8267b8507378d574d7932f24cd1826509b54bd8f7',
    'forced':'bd1974a286e1bb99f07c780b8a3ca29dc2ff65347231cfa36a31bb744133eb3d',
}


def encode(value):
    return json.dumps(value,separators=(',',':'),ensure_ascii=False).encode()


def digest(value):
    return sha256(encode(value)).hexdigest()


def pinned(path, name):
    data = path.read_bytes()
    assert sha256(data).hexdigest()==PINS[name], path
    return json.loads(data)


class SourceDigest:
    """Typed lexical digest. Native orders and formal substitution are retained."""

    def __init__(self, records, definitions):
        self.record = records
        self.defs = definitions
        self.visited = set()
        self.native = set()

    @cache
    def of(self, i, env):
        self.visited.add(i)
        node = self.record(i)
        op,args = node['op'],node['args']
        visit = lambda x: self.of(x,env)
        if op=='coordinate':
            assert i in env, (i,args,env)
            structure = ('bound',env[::-1].index(i))
        elif op in ('source_parameter','rational'):
            structure = (op,args)
        elif op in ('add','multiply','maximum','minimum'):
            expand = []
            def gather(j):
                node = self.record(j)
                if node['op']==op:
                    for p in node['args']:
                        gather(p)
                else:
                    expand.append(visit(j))
            for j in args:
                gather(j)
            structure = (op,sorted(expand))
        elif op in ('inverse','sqrt_positive','exp','log_positive','smooth_piecewise','sine','cosine','ceiling','ceiling_nonnegative'):
            structure = (op,[visit(j) for j in args])
        elif op in ('integer_power','source_step_derivative'):
            structure = (op,visit(args[0]),args[1])
        elif op=='definite_integral':
            body,bound,low,high=args
            assert self.record(bound)['op']=='coordinate'
            structure = (op,self.of(body,env+(bound,)),visit(low),visit(high))
        elif op=='actual_expression_partial':
            key,actual,orders=args
            decl=self.defs[key]
            formals=tuple(decl['parameters'])
            assert not decl.get('unspecifiedOracle',False)
            assert len(formals)==len(actual)==len(orders) and len(set(formals))==len(formals)
            assert all(0<=k<=n for k,n in zip(orders,decl['derivativeLimits'],strict=True))
            self.native.add(key)
            structure = (op,self.of(decl['body'],formals),[visit(j) for j in actual],orders)
        elif op=='actual_natural_series':
            structure = (op,args[0],visit(args[1]),visit(args[2]),args[3:])
        elif op=='actual_quadratic_root':
            structure = (op,args[:2],visit(args[2]),args[3:])
        elif op in ('actual_background_picard','actual_background_even_profile'):
            structure = (op,args[:2],visit(args[2]),visit(args[3]),args[4:])
        elif op=='actual_monotone_root':
            structure = (op,args[0],[visit(j) for j in args[1:]])
        else:
            raise AssertionError((i,op,args))
        return digest(structure)


def bind_active_target(g, native, E, rebuilt):
    defs = json.loads(native.base_snapshot['base']['expression'])
    a = SourceDigest(g.stream.record,defs)
    b = SourceDigest(rebuilt['targetNodes'].__getitem__,rebuilt['targetDefinitions'])
    result = []
    for slot,new,target_id in zip((32017,32018),rebuilt['raw'],(17733782,17733789),strict=True):
        old = defs[slot]
        assert old['name']==new['name'] and old['parameters']==new['parameters']==[4756,2]
        assert g.args(target_id,'actual_expression_partial')==[slot,[17732770,17732775],[0,0]]
        ha=a.of(old['body'],tuple(old['parameters']))
        hb=b.of(new['body'],tuple(new['parameters']))
        assert ha==hb, (old['name'],ha,hb)
        assert b.of(new['body'],tuple(reversed(new['parameters'])))!=hb
        result.append({'slot':slot,'liveRawBody':old['body'],'rebuiltRawBody':new['body'],'commonIDIndependentSHA256':ha,
                       'outerFormalArgs':[4756,2],'actualArgs':[17732770,17732775],
                       'swapFormalArgsRejected':True})
    assert len(a.visited)>50 and len(b.visited)>50
    return {'typedTargetBindings':result,'visitedLive':len(a.visited),'visitedRebuilt':len(b.visited),
            'nativesLive':len(a.native),'nativesRebuilt':len(b.native)}


def bind_masses(g,E):
    ci,ls,haar,dgeom,r0,chi_mass = 17733027,17733029,17733060,17732699,14220486,17733048
    assert g.args(chi_mass,'definite_integral')==[17733046,17733037,17733047,r0]
    assert g.args(17733046,'integer_power')==[17733045,2]
    assert E.of(17733047)==E.neg(E.of(r0))
    assert E.of(r0)==E.scalar(Fraction(1,2**34))
    assert E.of(ls)==E.mul(E.scalar(2),E.of(r0),E.inv(E.of(ci)))
    assert E.of(haar)==E.mul(E.scalar(Fraction(1,2)),E.of(dgeom),E.of(ci),E.of(chi_mass))
    assert E.mul(E.of(haar),E.of(ls))==E.mul(E.of(dgeom),E.of(r0),E.of(chi_mass))
    assert g.args(17733021,'ceiling')==[17733020]
    assert E.of(17733022)==E.neg(E.of(17733021))
    assert E.of(17733020)==E.neg(E.of(17733019))
    assert g.args(17733024,'exp')==[17733023] and g.args(17733026,'exp')==[17733025]
    assert E.of(ci)==E.mul(E.of(17733024),E.of(17733026))
    assert E.of(17733023)==E.mul(E.of(17733017),E.of(17733022))
    assert E.of(17733025)==E.mul(E.add(E.one,E.of(9)),E.of(17732742))
    assert g.args(17733017,'log_positive')==[14220487]
    ell=17732737
    [S]=[i for i in range(ell+1,ell+15) if g.node(i)==('integer_power',[ell,2])]
    assert E.of(S)==E.pow(E.of(ell),2)
    assert g.args(127,'log_positive')==[24]
    [log_ell]=[i for i in range(17733010,17733017) if g.node(i)==('log_positive',[ell])]
    assert g.args(17732742,'log_positive')==[17732740]
    assert g.args(17732740,'exp')==[17732739]
    assert E.of(17732739)==E.neg(E.mul(E.of(ell),E.of(127)))
    log_palette=E.sub(E.mul(E.add(E.one,E.of(9)),E.of(ell),E.of(127)),
                      E.mul(E.scalar(2),E.of(log_ell)))
    assert E.of(17733019)==E.mul(log_palette,E.inv(E.of(17733017)))
    rows=[]
    for sign,tr,tt,tz,primitive,power,psi,solution in (
        (1,17733396,17733399,17733402,17733413,17733391,17733403,[17733392,17733393]),
        (-1,17733729,17733732,17733735,17733745,17733724,17733403,[17733725,17733726]),
    ):
        mass_row,coordinate,lo,hi=g.args(primitive,'definite_integral')
        assert (coordinate,lo,hi)==(17732751,0,ls)
        assert E.of(mass_row)==E.mul(E.of(psi),E.pow(E.of(tr),2))
        assert g.args(psi,'integer_power')==[17733057,2]
        assert E.of(tr)==E.mul(E.of(power),E.add(*map(E.of,solution)))
        assert all(g.args(j,'actual_covariance_volterra')[2]==17732751 for j in solution)
        assert g.args(solution[0],'actual_covariance_volterra')[3]==g.args(solution[1],'actual_covariance_volterra')[3]
        for j,expected in zip(([17733406,17733409] if sign==1 else [17733738,17733741]),(tt,tz),strict=True):
            density,p,a,b=g.args(j,'definite_integral')
            assert (p,a,b)==(17732751,0,ls)
            assert E.of(density)==E.mul(E.of(psi),E.of(tr),E.of(expected))
        rows.append({'sign':sign,'mass':primitive+1,'integral':primitive,'density':mass_row,
                     'ordinaryPulse':[lo,hi],'commonGaussian':power,'positiveTangentR':tr,
                     'tangentialFrame':[tt,tz],'normalizedVolterraComponents':solution})
        assert E.of(primitive+1)==E.mul(E.of(haar),E.of(primitive))
    return {'S':S,'ci':ci,'Ls':ls,'haar':haar,'transverseMass':chi_mass,'Dgeom':dgeom,'r0':r0,
            'paletteExponent':17733022,'paletteTg':14220487,
            'exactPaletteBounds':'1/(Tg*ell^2)<ci<=1/ell^2 on admitted positive integer ell',
            'sameMassAsColumns':rows,'exactProduct':'haar*Ls=Dgeom*r0*Ichi'}


def verify(goal,artifact,cache_dir,original,private_graph):
    sys.path[:0]=[str(goal/ACTIVE/'spatial-readback'),str(goal/ACTIVE/'live-wave-gauge/signed'),
                 str(goal/'first-force-repair'),str(goal/BAND/'weighted-haar-shell/gaussian')]
    import source_stream
    import source_cache
    from check_gaussian_shell import Graph,check_target
    from verify_repaired_first_force import Exact
    norm=original.read_bytes()
    output=json.loads(norm)
    private=private_graph.read_bytes()
    assert sha256(private).hexdigest()==output['privateGraphSHA256']
    fresh=json.loads(private)
    old_outer=pinned(goal/BAND/'weighted-haar-shell/gaussian/gaussian-shell.json','gaussian')
    angular=pinned(goal/BAND/'signed-polynomial-shell/original-angular-eta.json','angular')
    forced=pinned(goal/BAND/'temporal-weighted-inverse/first-forced-covariance/outer-covariance-final.json','forced')
    assert angular['sameLiveOriginalPrefix']['nodes']==117100 and old_outer['parameterExpressionSHA256']==output['parameters']
    assert forced['maximumIndividualSourceInputOrders']['u']==6
    factor=output['originalOuterFactor']
    assert factor['sameOriginalTerminalEndpointAndHeight'] and factor['endpointSeparation']['Xb']==28826
    assert factor['thetaCoefficientLower']=='C^-10' and factor['sourceProjectionProof']['pass']
    assert len(factor['kernelInventory'])==4
    assert all(factor['preservedTerms'][key] for key in ('outerThreeAngularTerms','outerPressureHeatSquare','outerNestedAxialIntegral','heatGammaIsActualLaplaceIntegral'))
    assert all(row['pass'] for row in output['exactCone']['rows'])
    roots=fresh['factorRoots']
    fn=fresh['factorNodes']
    scaled=fn[roots['outerScaledZ']]
    assert scaled['op']=='multiply' and roots['outerZ'] in scaled['args']
    [power]=[j for j in scaled['args'] if j!=roots['outerZ']]
    assert fn[power]=={'op':'integer_power','args':[roots['outerLogDistance'],6]}

    folder=artifact/'first-correction-spatial-source'
    manifest=pinned(folder/source_stream.MANIFEST,'manifest')
    native=source_stream.Native(folder,manifest)
    assert native.pin==PINS['registry']
    stream=source_cache.load(source_stream,folder,manifest,22153782,cache_dir)
    try:
        assert stream.count==22155584 and stream.verify['sha256']==PINS['stream']
        g=Graph(stream)
        E=Exact(g)
        actual=check_target(g,native,E)
        assert actual==old_outer['targetBindings']
        lexical=bind_active_target(g,native,E,fresh)
        masses=bind_masses(g,E)
    finally:
        stream.__exit__()
    return {
        'status':'VERIFIED_SAME_LIVE_OUTER_TARGET_AND_COVARIANCE_MASSES',
        'pins':PINS,'originalOuterReplaySHA256':sha256(norm).hexdigest(),
        'sourceNodes':22155584,'target':actual,'lexicalRebuild':lexical,'positiveMasses':masses,
        'conditionalAnalyticIdentity':'Tbar=exp(-4/delta^2)*delta^-3*bbar, bbar=s^(-A-1/2)*(b_theta,delta^6*b_z). Uses the original complete leading moment restoration and ordinary backward heat integrals. Their exact operand definitions and profile endpoints are bound here.',
        'fixedClosedEtaEndpoints':'inward nonnegative heat derivatives',
        'domain':'fixed original dyadic label, original same box representative and admitted slow interval, 0<=delta<=1/2; use raw forward expression on interior and regular coefficient at delta=0',
        'finalJets':0,'release':'HOLD',
    }


if __name__=='__main__':
    parser=ArgumentParser(description=__doc__)
    for flag in ('goal','artifact','cache','original','private-graph','out'):
        parser.add_argument('--'+flag,type=Path,required=True)
    args=parser.parse_args()
    if not __debug__:
        parser.error('Python assertions must stay enabled')
    result=verify(args.goal,args.artifact,args.cache,args.original,args.private_graph)
    with args.out.open('x',encoding='utf-8',newline='\n') as file:
        json.dump(result,file,indent=2)
        file.write('\n')
    print(result['status'])
