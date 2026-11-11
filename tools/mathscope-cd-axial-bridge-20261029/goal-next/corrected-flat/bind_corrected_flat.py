"""Bind cutoff recipes to a corrected first Forced and its actual Signed successor."""
from argparse import ArgumentParser
from fractions import Fraction as F
from hashlib import sha256
from itertools import islice
from pathlib import Path
from tempfile import TemporaryFile
import gzip
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE.parent / n) for n in
                ('flat','flat-palette','flat-homogeneous','cycle','f1-mean','first-force-repair','f1-regularity')]
from bind_forced_cutoffs import Archive, GRAPH_SHA, PROJECTION_SHA, REGISTRY_SHA, check_cutoff, pinned_json
from bind_homogeneous_cutoffs import bind as homogeneous_bind
from bind_homogeneous_cutoffs import Recipes, case_body
from bind_mean_angle_scope import Scope, compact, pins as mean_pins
from bind_primary_amplitude import PREFIX_COUNT, PREFIX_HASH
from check_fixed_path import Nodes
from check_palette import (Source as Algebra, R,Z,T,Y0,Y1,ELL,THETA, check_local_lifts,
                           check_rows, finite_palette, matrices, add, atom, exp, log,
                           mul, num, sqrt, sub)
from group_postfive_residual import Source as Harmonics, combine, merge
from verify_repaired_first_force import (BASE, PR30, REPAIR, Graph, Exact,
                                          git_blob, read, cutoff as verify_cutoff)

FULL_COMMIT = '132a7804c5b7b8f579b816cf12de0e2a686ab8b0'
FULL_SCOPE = 'CORRECTED_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT'
OLD_SCOPE = 'ORIGINAL_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT_NOT_FINAL_A_b_p'
FIRST_SCOPE = 'REPAIRED_FIRST_FORCED_ONLY'
FIRST_RECEIPT = 'e0e466e8bdf8d65f06e82da38631ad5f4c5c7f12f3d073ac1bbe104a0ddf4b38'
PRIMARY_RECEIPT = 'f1f6454d74fb6423361802fddad6ac0be70f8824c7f4e1107f5d3afc1b7d8b46'
OLD_RUN = '615cdb54c6a7645e0664396557fb83fc9b76b8b6d8e9005e220fb1834f4aeed7'
OLD_FORCED = '719318e74afc94b7f6c45e6cf36d05362cffa8cf1f4567d0d5b61ed852e0b76d'
OLD_HOM = '71decc3be7133087fd05268b1c1ae58758fc3c5d26593cbe9deccd038ed08642'
OLD_PALETTE = '74a853c3a9e11e1a967f5d54fbe1730c01d3463af5d23b78c53823a085b5a0b4'
OLD_CURRENT_PATH = 'research-ide/mathscope-m3/navier/evidence/global-current-20261012/attempt1/global-current.json'
OLD_CURRENT_SHA = '8d64f045a4fc87167c8444b11c4e6cb2b8ea89a5eb53f846d31c90c15e8a7f1e'
K, LS, PSI, FORMAL_V, LEVEL, REF = 622801,623027,623055,622805,3675258,3675253
RADIAL_FAST, COVER_RADIAL, VR1 = 625154,624040,623066
SIGNED_H, PRIMARY_A = [[623405,623737],[623408,623740]],[623824,623825]
PARTS = ('real','imaginary')
STREAM = 'original-source-nodes.jsonl.gz'
MANIFEST = 'original-source-export-manifest.json'
REGISTRY = 'original-source-functions.json'
GEOMETRY_FIELDS = ('label','values','guards','derivativeMaps','coefficient')
MEAN_COORDS = {R,Z,T,ELL,Y0,Y1}


class ReplayGraph(Graph):
    op = Graph.args
    factors = Archive.factors
    explicit_reach = Archive.explicit_reach


class FinalHarmonics(Harmonics):
    def __init__(self,graph,registry):
        from group_postfive_residual import Recipes as Coefficients
        self.graph = graph
        expr, self.fields, _, self.forced, _ = json.loads(registry['definitions'])
        self.expressions = {x['id']:x for x in expr}
        self.recipe = Coefficients()
        self.phases, self.reference_calls, self.atoms = {}, {}, {}

    def node(self,root):
        return self.graph.node(root)

    def corrected_groups(self,roots):
        result = []
        for root in roots:
            polynomial = self.polynomial(root)
            assert () in polynomial and max(map(len,polynomial))==2
            contributions = []
            for word, coefficient in sorted(polynomial.items()):
                if not word:
                    continue
                term = {0:coefficient}
                for item in word:
                    modes = {m:self.recipe.intern('indexedCoefficient',item,m) for m in self.atoms[item]['modes']}
                    term = combine(term,modes,self.recipe.add,self.recipe.mul,int.__add__)
                contributions.append(term)
            diagonal = merge(contributions,self.recipe.add)
            assert set(diagonal)==set(range(-4,5))
            assert all(self.recipe.conjugate(v)==diagonal[-m] for m,v in diagonal.items())
            own = {m:self.recipe.mul(self.recipe.intern('inverseResidualChart',v),
                                     self.recipe.intern('ownPhaseInverse',m))
                   for m,v in diagonal.items() if m}
            result.append({'root':root,'modeZeroBackgroundRecipe':polynomial[()],
                           'sameRowZeroModeRecipe':diagonal[0],'sameRowOwnNonzeroRecipes':own,
                           'indexedWavePolynomial':[[list(k),v] for k,v in sorted(polynomial.items()) if k],
                           'crossRowIndexedQuadraticsRetained':[
                               [list(k),v] for k,v in sorted(polynomial.items()) if len(k)==2]})
        return result


def verify_manifest(directory,scope,commit=None):
    meta = read(directory/MANIFEST)
    assert meta['scope']==scope and meta['original_pr30_commit']==PR30
    if commit is not None:
        assert meta['executing_commit']==commit
    raw = (directory/REGISTRY).read_bytes()
    assert sha256(raw).hexdigest()==meta['definitions_sha256']
    assert meta['function_registry_capture_kind']=='EXTENDED_COUPLED_FACADE'
    assert meta['extended_coupled_registry_included'] and not meta['final_all_cycle_A_b_p']
    assert meta['actual_final_67_jets_certified']==0
    reg = json.loads(raw)
    assert reg['counts']==meta['extended_coupled_function_counts']
    return meta,reg


def compare_prefix(short_dir,long_dir,short_meta,known_early=False):
    count = PREFIX_COUNT if known_early else short_meta['node_count']
    h = sha256()
    with gzip.open(short_dir/STREAM,'rb') as short, gzip.open(long_dir/STREAM,'rb') as long:
        sh,lh = next(short),next(long)
        assert json.loads(sh)['node_count']==short_meta['node_count']
        assert json.loads(lh)['schema']=='MathScope.M3.FullNodesJSONL/1'
        if not known_early:
            h.update(sh)
        matched = 0
        for line in islice(short,count):
            assert line == next(long),f'prefix diverges at source node #{matched}'
            h.update(line)
            matched += 1
        assert matched == count
    expected = PREFIX_HASH if known_early else short_meta['node_stream_sha256']
    assert h.hexdigest()==expected
    return {'matchedNodes':matched,'firstStreamSHA256':h.hexdigest(),'hashIncludesHeader':not known_early}


def same_registry_prefix(short,long):
    defs = [json.loads(r['definitions']) for r in (short,long)]
    assert len(defs[0])==len(defs[1])==5
    for first,final in zip(*defs):
        assert first==final[:len(first)],'native definition changed or moved after first Forced'
    # The first-run base retains the original charts and native operators.
    # A later auxiliary definition may append, without rewriting the original.
    for field in ('expressionDefinitions','fieldDefinitions','inverseDefinitions'):
        first,final = [json.loads(r['base'][field]) for r in (short,long)]
        assert first==final[:len(first)],field
    assert short['base']['base']==long['base']['base']
    return [len(group) for group in defs[0]]


def source_pins(repo):
    from bind_homogeneous_cutoffs import sources as hom_pins
    out = {**hom_pins(repo),**mean_pins(repo)}
    current_blob = git_blob(repo,BASE,OLD_CURRENT_PATH)
    assert sha256(current_blob).hexdigest()==OLD_CURRENT_SHA
    original_current = json.loads(current_blob)['source']
    original_band = original_current['sourceBand']
    assert original_band['target']['H']==SIGNED_H and original_band['target']['squareRootWeights']==PRIMARY_A
    assert original_band['geometry']['epsilon']==622798
    out[OLD_CURRENT_PATH] = OLD_CURRENT_SHA
    for name,markers in {
        'source-initialized-angular.mjs':(b'nonzeroAngularForcing=subtractVectorRows(G,waveResidual,primaryFlatResidual)',
                                          b'G.q(1,2),dpsi,x'),
        'source-global-forced-current.mjs':(b'rawInitializedWaveResidual:old.waveResidual,primaryFlatResidual:old.primaryFlatResidual',
                                          b'positive=old.nonzeroAngularForcing.find'),
    }.items():
        path = f'research-ide/mathscope-m3/navier/{name}'
        blob = git_blob(repo,FULL_COMMIT,path)
        assert blob==git_blob(repo,REPAIR,path)
        assert all(m in blob for m in markers)
        out[f'{FULL_COMMIT}:{path}']=sha256(blob).hexdigest()
    return out


def verify_runtime(run,meta,corrected):
    schema = 'SourceBoundCorrectedFirstCyclePipeline' if corrected else 'SourceBoundOriginalPipeline'
    assert run['schema']==f'MathScope.M3.{schema}/1' and run['status']=='PARTIAL_SOURCE_AUTHENTICATED'
    assert run['executing_commit']==meta['executing_commit'] and run['expected_base_commit']==PR30
    assert run['first_fivemap_graph_replay_manifest']==meta
    assert all(run[k] for k in ('real_original_forced_seal_issued','real_original_latest_cor85_stress_seal_issued',
        'real_original_signed162_seal_issued','post_signed_exact_inverse_AST_private_source_checked',
        'post_signed_five_map_mean_source_AST_checked','post_five_full_three_dimensional_PDE_AST_checked',
        'post_five_direct_vs_split_AST_constructed','first_fivemap_graph_exported'))
    assert run['actual_signed162_indexed_rows']==1620 and run['actual_final67_jets_evaluated']==0
    assert not run['post_five_full_three_dimensional_PDE_residual_proved_zero']
    assert not run['post_five_direct_vs_split_proved_zero']
    roots = [*run['post_five_full_three_dimensional_velocity_roots'],
             run['post_five_full_three_dimensional_pressure_root'],
             run['post_five_full_three_dimensional_divergence_root'],
             *run['post_five_full_three_dimensional_PDE_residual_roots'],
             *run['post_five_direct_vs_split_difference_roots']]
    assert roots==meta['original_root_ids'] and len(set(roots))==11
    if corrected:
        pins = run['corrected_first_cycle_source_byte_pins']
        assert pins['verifiedPinnedRepairFiles']==2 and pins['verifiedUnchangedPR30Files']==27
    return roots


def signed_cases(graph,registry,repair,raw):
    definitions = json.loads(registry['definitions'])
    rows = {(r['key'],r['mode']):r for r in repair['rows']}
    raw_rows = {(r['key'],r['m']):r for r in raw['rows']}
    assert len(rows)==len(raw_rows)==20 and set(rows)==set(raw_rows)
    result = []
    for (key,m),r in sorted(rows.items()):
        d,sign = map(int,key.split(':'))
        a = raw_rows[key,m]
        system = definitions[3][r['system']]
        assert a['system']==system['id'] and system['name']==f'ActualOriginalForced_{key}_m{m}'
        assert a['path']==r['path'] and a['k']==K and a['length']==system['length']==LS
        assert a['mappedCutoff']['psi']==r['mappedCutoff']['psi'] and a['mappedCutoff']['dpsi']==r['mappedCutoff']['dpsi']
        psi,dpsi = (a['mappedCutoff'][k] for k in ('psi','dpsi'))
        phase_nodes = {x['positiveFundamentalAngle'] for x in r['rawOwnHarmonics']}
        assert len(phase_nodes)==1
        factors = graph.op(phase_nodes.pop(),'multiply')
        assert len(factors)==2 and K in factors
        phase = next(x for x in factors if x!=K)
        pulse = r['path']['pulse']
        check_cutoff(graph,psi,dpsi,LS,pulse)
        for component in a['components']:
            j,part = component['j'],component['part']
            other = next(x for x in r['components'] if x['j']==j and x['part']==part)
            assert all(component[k]==other[k] for k in ('raw','primary','supported','mapped','formalPathSource'))
        result.append({'key':key,'difference':d,'sign':sign,'mode':m,'phase':phase,'waveNumber':K,
                       'length':LS,'pulseValue':pulse,'cutoff':psi,'cutoffDerivative':dpsi,
                       'system':system['id'],'raw':a,'independent':r})
    assert len({(c['difference'],c['sign'],c['phase']) for c in result})==10
    return result


def real_series(graph,root,phase):
    """The actual real representation preserves signed sine/cosine terms."""
    terms = {}

    def walk(i,sign=1):
        op,args = graph.node(i)
        if op=='add':
            for j in args:
                walk(j,sign)
            return
        if op=='multiply' and 20 in args:
            walk(next(j for j in args if j!=20),-sign)
            return
        assert op=='multiply' and len(args)==2
        trig, = [j for j in args if graph.node(j)[0] in ('sine','cosine')]
        name,(angle,) = graph.node(trig)
        m,rem = graph.factors((angle,1),(K,-1),(phase,-1))
        assert not rem and m.denominator==1 and 0<abs(m)<=2
        assert (int(m),name) not in terms
        terms[int(m),name] = (sign,next(j for j in args if j!=trig))

    walk(root)
    return terms


def cross(algebra,left,right):
    return [algebra.sub(algebra.mul(left[a],right[b]),algebra.mul(left[b],right[a]))
            for a,b in ((1,2),(2,0),(0,1))]


def assert_rational_identity(algebra,left,right,label):
    delta = algebra.sub(left,right)
    if delta:
        numerator = algebra.reduce_sqrt_two(algebra.clear_compound_denominators(delta),3622)
        assert not numerator,(label,len(delta),len(numerator),list(numerator.items())[:3])


def positive_coefficients(graph,algebra,terms,m):
    out = {}
    for fn,part,direction in (('cosine','real',1),('sine','imaginary',-1)):
        if (m,fn) not in terms:
            assert (-m,fn) not in terms
            out[part] = (None,algebra.zero)
            continue
        sg,root = terms[m,fn]
        negsg,neg = terms[-m,fn]
        observed = algebra.mul(algebra.scalar(sg*direction),algebra.of(root))
        want_neg = observed if fn=='cosine' else algebra.neg(observed)
        assert algebra.mul(algebra.scalar(negsg*direction),algebra.of(neg))==want_neg
        out[part] = root,observed
    return out


def forced_curl(graph,algebra,recipes,case,body_roots):
    raw = case['raw']
    prefix = f"ActualMappedOriginalForced_{case['key']}_m{case['mode']}_"
    names = {(part,j):recipes.names[f'{prefix}{part}_{j}'] for part in PARTS for j in range(3)}
    definitions = {x['id']:x for x in names.values()}
    applications = {}
    for root in graph.reach(body_roots):
        op,args = graph.node(root)
        if op=='m3_coupled_expression_partial' and args[0] in definitions:
            name,actual,orders = args
            d = definitions[name]
            assert actual==d['parameters'] and len(orders)==len(actual)
            assert sum(orders)<=1
            assert applications.setdefault((name,tuple(orders)),root)==root
    pulse = case['pulseValue']
    substitution = {raw['path']['w']:algebra.of(pulse)}
    n = [algebra.affine_at(algebra.of(i),substitution) for i in raw['normal']['value']]
    n2 = algebra.dot(n,n)
    km = algebra.mul(algebra.scalar(case['mode']),algebra.of(K))
    denom = algebra.inv(algebra.mul(km,n2))
    eps = algebra.of(raw['epsilon'])
    radial = algebra.mul(algebra.of(RADIAL_FAST),algebra.pow(algebra.of(COVER_RADIAL),-case['difference']))
    vr1 = algebra.of(VR1)
    invR = algebra.inv(algebra.of(R))
    outputs = {}
    for part in PARTS:
        amplitude = [algebra.of(z[part]) for z in raw['mappedCutoff']['velocity']]
        expect_potential = [algebra.mul(x,denom) for x in cross(algebra,n,amplitude)]
        for j in range(3):
            assert_rational_identity(algebra,algebra.of(names[part,j]['body']),expect_potential[j],
                                     (case['key'],case['mode'],part,j,'potential'))

        def app(j,axis=None):
            definition = names[part,j]
            orders = tuple(int(a==axis) for a in definition['parameters'])
            return algebra.of(applications[definition['id'],orders])

        def Dr(j):
            return algebra.add(app(j,R),algebra.mul(radial,algebra.add(app(j,Y0),algebra.mul(vr1,app(j,Y1)))))

        def Dz(j):
            return algebra.mul(eps,app(j,Z))

        leading = [algebra.neg(algebra.mul(km,x)) for x in cross(algebra,n,[app(j) for j in range(3)])]
        remainder = [algebra.neg(Dz(1)),algebra.sub(Dz(0),Dr(2)),algebra.add(Dr(1),algebra.mul(app(1),invR))]
        outputs[part] = leading,remainder
    real,ri = outputs['real']
    imag,ii = outputs['imaginary']
    return ({'real':[algebra.sub(x,y) for x,y in zip(real,ii)],
             'imaginary':[algebra.add(x,y) for x,y in zip(imag,ri)]},
            [x['id'] for x in names.values()])


def check_corrected_first_fields(graph,registry,cases):
    recipes = Recipes(graph,registry)
    algebra = Exact(graph)
    by = {(r['key'],r['mode']):r for r in cases}
    native = RegistryProxy(registry)
    results = []
    for case in (c for c in cases if c['mode']==1):
        d,sign,phase = (case[k] for k in ('difference','sign','phase'))
        suffix = 0 if sign==1 else 1
        owners = []
        series = []
        for j in range(3):
            owner = recipes.names[f'ActualForcedCurrent_velocity_{j}_own_{suffix}']
            assert owner['parameters'][-1]==LEVEL
            root,guards = case_body(graph,owner['body'],d)
            assert len(guards)==7 and guards[-1]==[case['pulseValue'],0,LS]
            series.append(real_series(graph,root,phase))
            owners.append({'ownSystem':owner['id'],'body':root,'guards':guards})
        p_owner = recipes.names[f'ActualForcedCurrent_angular_pressure_own_{suffix}']
        p_root,p_guards = case_body(graph,p_owner['body'],d)
        assert all(p_guards==owner['guards'] for owner in owners)
        p_terms = real_series(graph,p_root,phase)
        mode_checks = []
        for m in (1,2):
            row = by[case['key'],m]
            velocity = [positive_coefficients(graph,algebra,t,m) for t in series]
            pressure = positive_coefficients(graph,algebra,p_terms,m)
            roots = [i for z in velocity for i,_ in z.values() if i is not None]
            expected,systems = forced_curl(graph,algebra,recipes,row,roots)
            for j,observed in enumerate(velocity):
                for part,(root,coeff) in observed.items():
                    want = expected[part][j]
                    primary = recipes.names.get(f'InitializedOriginalWave_{d}_{sign}_{j}_{part}')
                    if m==1 and primary:
                        call = recipes.primary_term(root,primary)
                        want = algebra.add(want,algebra.of(call))
                    assert_rational_identity(algebra,coeff,want,(case['key'],j,m,part,'full curl'))
            for part,(root,coeff) in pressure.items():
                want = algebra.of(row['raw']['mappedCutoff']['pressure'][part])
                primary = recipes.names.get(f'InitializedOriginalPrimaryPressure_{d}_{sign}_{part}')
                if m==1 and primary:
                    call = recipes.primary_term(root,primary)
                    want = algebra.add(want,algebra.of(call))
                assert_rational_identity(algebra,coeff,want,(case['key'],m,part,'pressure'))
            mode_checks.append({'mode':m,'potentialSystems':systems,
                                'positiveVelocityCoefficients':[{p:v[0] for p,v in row.items()} for row in velocity],
                                'positivePressureCoefficients':{p:v[0] for p,v in pressure.items()}})
        results.append({'key':case['key'],'owners':owners,'pressureOwnSystem':p_owner['id'],
                        'pressureBody':p_root,'fullMappedCurlAndPressure':mode_checks})
    for c in cases:
        raw = c['raw']
        formal = [{part: next(x['formalPathSource'] for x in raw['components'] if x['j']==j and x['part']==part)
                   for part in PARTS} for j in range(3)]
        verify_cutoff(graph,algebra,native,raw,native.pulses[c['system']],formal)
        for item in raw['components']:
            j,part = item['j'],item['part']
            assert algebra.of(item['raw'])==algebra.add(algebra.of(item['supported']),algebra.of(item['primary']))
            assert algebra.of(raw['mappedCutoff']['expected'][j][part])==algebra.add(
                algebra.of(raw['mappedCutoff']['remainingSource'][j][part]),algebra.of(raw['mappedCutoff']['derivativeSource'][j][part]))
    return results


def strip_scalar_factor(graph,root,factor):
    if root==factor:
        return 1,['constant',1]
    op,args = graph.node(root)
    if op not in ('add','multiply'):
        return 0,['source',root]
    children = [strip_scalar_factor(graph,i,factor) for i in args]
    powers = [p for p,_ in children]
    if op=='add':
        assert len(set(powers))==1
        power = powers[0]
    else:
        power = sum(powers)
    return (power,[op,*(x for _,x in children)]) if power else (0,['source',root])


def signed_pressure(graph,registry,cases):
    recipes = Recipes(graph,registry)
    algebra = Exact(graph)
    rows = []
    for c in cases:
        if c['mode']!=1:
            continue
        sign,difference,phase = (c[k] for k in ('sign','difference','phase'))
        suffix = 0 if sign==1 else 1
        definition = recipes.names[f'GenericSigned162_angular_pressure_own_{suffix}']
        body,guards = case_body(graph,definition['body'],difference)
        assert len(guards)==7 and guards[-1]==[c['pulseValue'],0,LS]
        terms = real_series(graph,body,phase)
        assert set(terms)=={(1,'sine'),(-1,'sine')}
        a,positive = terms[1,'sine']
        b,negative = terms[-1,'sine']
        assert algebra.mul(algebra.scalar(a),algebra.of(positive))==algebra.mul(algebra.scalar(-b),algebra.of(negative))
        power,recipe = strip_scalar_factor(graph,positive,c['cutoff'])
        assert power==1 and 19 in graph.op(positive,'multiply')
        rows.append({'key':c['key'],'ownSystem':definition['id'],'phase':phase,'pressurePositiveSine':positive,
                     'positiveImaginarySign':-a,'mappedCutoff':c['cutoff'],'uncutPressureRecipe':recipe})
    assert len(rows)==10
    return rows


def signed_covariance_weights(graph,registry,potentials):
    """Tie the two Signed scalars to the actual latest Forced Sigma."""
    recipes = Recipes(graph,registry)
    names = [recipes.names[f'ActualLatestMeanSigma_after-forced_{j}'] for j in range(2)]
    exact = Exact(graph)
    weights = []
    sigma = {}
    for j in range(2):
        found = {p['scalarFactors']['fixedWeight'] for name,p in potentials.items()
                 if name.startswith(f'GenericSignedAfterForced_{j}_')}
        weight, = found
        weights.append(weight)
        for r in graph.reach([weight]):
            op,args = graph.node(r)
            if op=='m3_coupled_expression_partial':
                system,values,orders = args
                for index,d in enumerate(names):
                    if d['id']==system:
                        assert values==d['parameters']==[ELL,R,Z,T] and not any(orders)
                        assert sigma.setdefault(index,r)==r
    assert set(sigma)=={0,1}
    # Stable original band matrix and positive primary weights are in the
    # pre-insertion prefix, unlike the updated Sigma and signed amplitudes.
    eps = exact.of(622798)
    response = [exact.mul(exact.scalar(2),exact.of(x),exact.of(y)) for x,y in zip(PRIMARY_A,weights)]
    for j in range(2):
        fitted = exact.mul(eps,exact.dot([exact.of(x) for x in SIGNED_H[j]],response))
        assert_rational_identity(exact,fitted,exact.of(sigma[j]),('signed covariance',j))
    return {'fixedH':SIGNED_H,'fixedPrimaryWeights':PRIMARY_A,'actualSigma':[sigma[j] for j in range(2)],
            'signedWeights':weights,'formula':'epsilon * H * (2*a*deltaAmplitude) = Sigma_latest_forced'}


class RegistryProxy:
    """Small in-memory registry adapter for the cutoff replay."""
    def __init__(self,snapshot):
        definitions = json.loads(snapshot['definitions'])
        self.expr = {r['id']:r for r in definitions[0]}
        self.names = {r['name']:r for r in definitions[0]}
        self.pulses = definitions[3]

    def expression(self,graph,root):
        system,actual,orders = graph.op(root,'m3_coupled_expression_partial')
        assert not any(orders)
        return self.expr[system],actual


def link_primary_receipt(graph,registry,cases,fields,meta):
    receipt = pinned_json(HERE.parent/'first-force-repair'/'independent-primary-half-amplitude.json',PRIMARY_RECEIPT)
    assert receipt['graphSHA256']==meta['node_stream_sha256'] and receipt['producerCommit']==REPAIR
    assert receipt['archivedPrefixRecords']==PREFIX_COUNT and receipt['oldAndRepairedPrefixSHA256']==PREFIX_HASH
    assert receipt['priorUncutLeadingRecipeSHA256']==OLD_HOM
    native = RegistryProxy(registry)
    expected = {(row['key'],row['component']):row for row in receipt['actualHalfAmplitudeBindings']}
    charts = {r['key']:r for r in fields}
    assert len(expected)==30
    for case in (r for r in cases if r['mode']==1):
        for component in case['raw']['components']:
            if component['part']!='real':
                continue
            j = component['j']
            row = expected[case['key'],j]
            root = component['primary']
            definition,arguments = native.expression(graph,root)
            guards = charts[case['key']]['owners'][j]['guards']
            assert row['exactHalfAmplitude'] and row['primaryCall']==root
            assert definition['body']==row['primaryBody'] and arguments==row['nativeParameters']
            assert [row['fixedXi'],row['fixedV']]==[guards[-2][0],case['pulseValue']]
            assert row['removedActualDPsi']==case['cutoffDerivative'] and row['removedFormalPsi']==PSI
    return receipt


def chart_scale(graph,registry,harm):
    chart = Algebra(Nodes(graph))
    coord = lambda i:atom('coordinate',i)
    h = atom('parameter','h')
    ratio = exp(mul(sub(coord(ELL),coord(REF)),log(num(2))))
    scale = exp(mul(add(num(F(3,2)),mul(num(2),h)),log(ratio)))
    coordinates = [mul(coord(R),sqrt(ratio)),mul(coord(Z),exp(mul(sub(num(F(1,2)),h),log(ratio)))),
                   mul(coord(T),ratio)]
    wrappers = [x for x in harm.expressions.values() if x['name'].startswith('ActualForcedCurrent_angular_residual_')
                and '_reference_' in x['name']]
    assert len(wrappers)==6
    roots = []
    for d in wrappers:
        factors = graph.op(d['body'],'multiply')
        call, = [i for i in factors if graph.node(i)[0]=='m3_coupled_expression_partial']
        multiplier, = set(factors)-{call}
        chart.exact(multiplier,scale)
        system,values,orders = graph.op(call,'m3_coupled_expression_partial')
        assert harm.expressions[system]['name'].startswith('ActualForcedCurrent_angular_residual_')
        assert values[3:]==d['parameters'][3:] and not any(orders)
        for observed,expected in zip(values[:3],coordinates):
            chart.exact(observed,expected)
        roots.append(multiplier)
    assert len(set(roots))==1
    return roots[0]


def exact_mean_cutoffs(graph,wholes):
    """Recover actual derivative-of-cutoff products without archived late IDs."""
    dchi = 633761
    pending, found = {}, {}
    def key(a,b):
        return (json.dumps({'op':'multiply','args':sorted((a,b))},separators=(',',':'))+'\n').encode()

    def register(a,b,name,scale):
        form = key(a,b)
        assert form not in pending
        pending[form] = name,scale

    for name,(whole,scale) in wholes.items():
        register(dchi,whole,name,scale)
    first = min(whole for whole,_ in wholes.values())
    graph.backing.seek(graph.offsets[first])
    for node,line in enumerate(graph.backing,first):
        entry = pending.pop(line,None)
        if entry:
            name,scale = entry
            if scale is None:
                found[name] = node
            else:
                register(scale,node,name,None)
            if not pending:
                break
    assert set(found)==set(wholes),sorted(set(wholes)-set(found))
    return found


def mean_parts(graph,registry,run,harm):
    scope = Scope(graph,registry)
    recipes = Recipes(graph,registry)
    signed = run['signed162_root_inventory']
    actual = run['post_five_full_three_dimensional_velocity_roots']
    result = {}
    cutoff_wholes = {}
    for j,name in enumerate(('beta','v','gamma')):
        old,increment = graph.op(actual[j],'add')
        assert old==signed['velocity'][j]
        latest,negative = graph.op(increment,'add')
        minus,baseline = graph.op(negative,'multiply')
        assert minus==20
        pre_five,bump = graph.op(latest,'add')
        assert graph.op(pre_five,'add')[0]==baseline
        temporal = graph.op(pre_five,'add')[1]
        definition,values,orders = recipes.resolve(bump)
        assert definition['name']==f'PostSignedFiveBump_{name}' and values==[ELL,R,Z,T] and not any(orders)
        result.update({f'netMean_{name}':increment,f'temporal_{name}':temporal,f'five_{name}':bump})
        poly = harm.polynomial(actual[j])
        wave = [w[0] for w in poly if w and len(w)==1]
        assert len(poly)==3 and len(wave)==2
        fields = {harm.atoms[i]['field'] for i in wave}
        assert fields=={f'coupled-field:{9+j}',f'coupled-field:{16+j}'}
    pressure = run['post_five_full_three_dimensional_pressure_root']
    old,delta = graph.op(pressure,'add')
    assert old==signed['pressure']
    newest,negative = graph.op(delta,'add')
    minus,old_mean = graph.op(negative,'multiply')
    assert minus==20
    for name,root in (('signedMeanPressure',old_mean),('fiveMeanPressure',newest)):
        _,whole,_ = compact(graph,root)
        result[name] = root
        result[name+'Whole'] = whole
        cutoff_wholes[name+'A0'] = whole,None
    result['meanPressureDelta'] = delta
    ppoly = harm.polynomial(pressure)
    assert len(ppoly)==3
    assert {harm.atoms[w[0]]['field'] for w in ppoly if w}=={'coupled-field:12','coupled-field:19'}
    t1 = recipes.names['afterActualSigned162_actual_meridional_potential']
    _,whole,_ = compact(graph,t1['body'],1)
    result.update({'temporalT1PotentialBody':t1['body'],'temporalT1Whole':whole})
    cutoff_wholes['temporalT1A1'] = whole,623135
    for j,weight in enumerate((2,1)):
        sig = recipes.names[f'ActualLatestMeanSigma_after-forced_{j}']
        sign,pot = graph.op(sig['body'],'multiply')
        assert sign==20
        _,whole,_ = compact(graph,pot,weight)
        result.update({f'cor85SigmaBody_{j}':sig['body'],f'cor85SigmaWhole_{j}':whole})
        cutoff_wholes[f'cor85SigmaCutoff_{j}'] = whole,{1:623135,2:634023}[weight]
    for root in run['post_signed_exact_inverse_roots']:
        def_id,args,orders = graph.op(root,'m3_coupled_inverse_partial')
        assert args==[R,Z,T,ELL,Y0,Y1] and not any(orders)
        assert scope.definition(def_id,2)['operator']=='(sqrt(2)-1)*partial_y0+partial_y1'
        result[f'actualTemporalInverse_{def_id}']=root
    result.update(exact_mean_cutoffs(graph,cutoff_wholes))
    assert all(scope.free(root)<=MEAN_COORDS for root in result.values())
    return {k:{'node':i,'freeCoordinatesUpperSet':sorted(scope.free(i))} for k,i in result.items()}


def full_audit(graph,registry,run,cases,old_projection):
    harm = FinalHarmonics(graph,registry)
    labels,fields = harm.row_programs()
    # Geometric row anchors are checked independently of all old late IDs.
    assert labels==old_projection['rows']
    chart = chart_scale(graph,registry,harm)
    phases = [{'difference':r['difference'],'sign':r['sign'],'ownPhase':r['phase']}
              for r in cases if r['mode']==1]
    forced = {'bindings':cases}
    bindings,potentials = homogeneous_bind(graph,registry,{'forcingChart':{'phaseCases':phases}},forced)
    pressure_rows = signed_pressure(graph,registry,cases)
    signed_weights = signed_covariance_weights(graph,registry,potentials)
    scope = Scope(graph,registry)
    for p in potentials.values():
        factors = p['scalarFactors']
        for name in ('chi','sqrtEpsilon','fixedWeight','slowCutoff'):
            assert FORMAL_V not in scope.free(factors[name]),(p['name'],name)
    groups = harm.corrected_groups(run['post_five_full_three_dimensional_PDE_residual_roots'])
    residual_atoms = dict(harm.atoms)
    means = mean_parts(graph,registry,run,harm)
    def source_leaves(index):
        op,*parts = harm.recipe.nodes[index]
        if op=='source':
            return {parts[0]}
        if op in ('add','multiply'):
            return set().union(*(source_leaves(x) for x in parts))
        if op=='rational':
            return set()
        raise AssertionError((index,op))
    angular_independent = set().union(*(source_leaves(i) for g in groups for i in
                                    [g['modeZeroBackgroundRecipe'],*(v for k,v in g['indexedWavePolynomial'])]))
    assert all(THETA not in scope.free(root) for root in angular_independent)
    projection = {'rows':labels,
                  'fields':{key:{**data,'templatesBySign':{str(s):row for s,row in data['templatesBySign'].items()}}
                            for key,data in sorted(fields.items())},
                  'referenceCalls':{str(k):v for k,v in harm.reference_calls.items()},
                  'indexedAtoms':{str(k):v for k,v in residual_atoms.items()}}
    algebra = Algebra(Nodes(graph))
    powers = matrices()
    row_checks,pairs = check_rows(algebra,projection,powers)
    lifts = check_local_lifts(algebra,projection,registry,powers)
    return {'referenceResidualMultiplier':chart,'boundHomogeneous':bindings,'uncutPotentialDefinitions':potentials,
            'signedHomogeneousPressureRows':pressure_rows,
            'signedCovarianceWeights':signed_weights,
            'sourceWindingPhases':harm.phases,'sameRowGroups':groups,'coefficientRecipes':harm.recipe.nodes,
            'indexedAtoms':residual_atoms,'boundRows':row_checks,'boundLocalLifts':lifts,'palette':finite_palette(powers),
            'pairCount':sum(pairs.values()),'angleZeroSources':means,
            'typedAngleIndependentCoefficientLeaves':len(angular_independent)}


def corrected_ledger(cases,homogeneous,first_fields):
    signed = {} if homogeneous is None else {(r['key'],r['component']):r for r in homogeneous}
    guards_by_key = {r['key']:r['owners'][0]['guards'] for r in first_fields}
    rows = []
    for c in cases:
        raw = c['raw']
        guards = guards_by_key[c['key']]
        pieces = []
        for a in raw['components']:
            j,part = a['j'],a['part']
            if signed:
                assert signed[c['key'],j]['sourceGuards']==guards
            signed_recipe = (signed[c['key'],j]['signed']['uncutHalfLeading']
                             if signed and c['mode']==1 and part=='real' else None)
            pieces.append({'component':j,'part':part,'primary':a['primary'],'raw':a['raw'],'supported':a['supported'],
                           'forcedRemainingSource':raw['mappedCutoff']['remainingSource'][j][part],
                           'forcedDerivativeSource':raw['mappedCutoff']['derivativeSource'][j][part],
                           'forcedTotal':raw['mappedCutoff']['expected'][j][part],
                           'signedUncutHalfLeading':signed_recipe,
                           'signedDerivative':c['cutoffDerivative'] if signed_recipe is not None else None})
        rows.append({'key':c['key'],'mode':c['mode'],'phase':c['phase'],'cutoff':c['cutoff'],
                     'pulse':c['pulseValue'],'length':c['length'],'sourceGuards':guards,
                     'sourceGuardZeroBranchesRetained':True,'components':pieces})
    return rows


def subtraction_plan(audit,ledger):
    """Expose all supported-candidate inputs without discarding cross-row terms."""
    by = {(r['key'],r['mode']):j for j,r in enumerate(ledger)}
    keys = sorted({r['key'] for r in ledger})
    groups = audit['sameRowGroups']
    return [
        {'key':key,'mode':mode,'rawOwnPhaseRecipes':[g['sameRowOwnNonzeroRecipes'][mode] for g in groups],
         'principalFlatLedgerIndex':by[key,abs(mode)] if abs(mode)<=2 else None,
         'conjugatePrincipalFlat':mode<0 and abs(mode)<=2,
         'referenceResidualMultiplier':audit['referenceResidualMultiplier'],
         'ownPhaseResolvedByFixedCase':True,'subtractBeforeNextPulsePath':True,
         'requiresActualDerivativeSupportToRemoveCrossRows':True,'completeFlatLedgerCertified':False}
        for key in keys for mode in (-4,-3,-2,-1,1,2,3,4)
    ]


def main():
    p = ArgumentParser(description=__doc__)
    for name in ('repo','old-dir','out'):
        p.add_argument('--'+name,type=Path,required=True)
    p.add_argument('--first-dir',type=Path)
    p.add_argument('--full-dir',type=Path)
    p.add_argument('--full-run',type=Path)
    p.add_argument('--github-run-metadata',type=Path)
    p.add_argument('--calibrate',action='store_true')
    a = p.parse_args()
    assert __debug__ and (a.calibrate or a.first_dir)
    pins = source_pins(a.repo)
    old_projection = pinned_json(HERE.parent/'cycle'/'group-postfive-residual.json',PROJECTION_SHA)
    old_meta,old_reg = verify_manifest(a.old_dir,OLD_SCOPE,BASE)
    assert old_meta['node_stream_sha256']==GRAPH_SHA and old_meta['definitions_sha256']==REGISTRY_SHA
    result = {'schema':'MathScope.N6.CorrectionAwareSignedTailReplay/1','sourcePins':pins,
              'archivedCalibration':None,'correctedFirstForce':None,'correctedFullCycle':None,
              'completeAdditiveFlatResidual':False,'completeSecondForcing':False,'release':'HOLD'}
    if a.calibrate:
        old_run = pinned_json(next((HERE.parent/'flat'/'hosted-39988632325').glob('*.json')),OLD_RUN)
        verify_runtime(old_run,old_meta,False)
        forced = pinned_json(HERE.parent/'flat'/'forced-principal-cutoffs.json',OLD_FORCED)['bindings']
        expected = pinned_json(HERE.parent/'flat-homogeneous'/'homogeneous-principal-cutoffs.json',OLD_HOM)
        palette = pinned_json(HERE.parent/'flat-palette'/'palette-receipt.json',OLD_PALETTE)
        with TemporaryFile() as backing:
            g = ReplayGraph(a.old_dir/STREAM,backing,old_meta)
            calibration = full_audit(g,old_reg,old_run,forced,old_projection)
            assert calibration['boundHomogeneous']==expected['bindings']
            assert calibration['uncutPotentialDefinitions']==expected['uncutPotentialDefinitions']
            assert calibration['referenceResidualMultiplier']==expected['residualReferenceChartScale']
            assert calibration['boundRows']==palette['rows']
            key=lambda row:(row['field'],row['sign'])
            assert sorted(calibration['boundLocalLifts'],key=key)==sorted(palette['localLifts'],key=key)
        result['archivedCalibration'] = {'graphSHA256':GRAPH_SHA,'matchedHomogeneousRows':30,'exactPaletteRows':162,
                                         'modeZeroSources':calibration['angleZeroSources'],
                                         'matchedActualOwnSystems':16,'signedPressureRows':len(calibration['signedHomogeneousPressureRows']),
                                         'signedCovarianceWeights':calibration['signedCovarianceWeights'],
                                         'sameRowModeInventory':list(range(-4,5))}
        print('Archived calibration passed for 30 homogeneous rows, 162 palette rows and 16 own systems.',flush=True)
    if a.first_dir:
        first_meta,first_reg = verify_manifest(a.first_dir,FIRST_SCOPE,REPAIR)
        early = compare_prefix(a.old_dir,a.first_dir,old_meta,known_early=True)
        first_runtime = read(a.first_dir/'corrected-first-force.json')
        assert first_runtime['snapshot']==first_meta and first_runtime['commit']==REPAIR
        independent = pinned_json(HERE.parent/'first-force-repair'/'independent-repaired-first-force.json',FIRST_RECEIPT)
        assert independent['snapshot']==first_meta and independent['producerCommit']==REPAIR
        with TemporaryFile() as backing:
            g = ReplayGraph(a.first_dir/STREAM,backing,first_meta)
            cases = signed_cases(g,first_reg,independent,first_runtime)
            fields = check_corrected_first_fields(g,first_reg,cases)
            primary = link_primary_receipt(g,first_reg,cases,fields,first_meta)
        result['correctedFirstForce'] = {'graphSHA256':first_meta['node_stream_sha256'],'earlyPrefix':early,
                                         'independentFirstForceReceiptSHA256':FIRST_RECEIPT,
                                         'independentPrimaryHalfAmplitudeReceiptSHA256':PRIMARY_RECEIPT,
                                         'exactPrimaryHalfAmplitudes':primary['actualHalfAmplitudeBindings'],
                                         'primaryTangencyBridgeSHA256':primary['originalTangencyBridgeSourceSHA256'],
                                         'rejectedPrimaryControls':primary['rejectedControls'],
                                         'actualFirstForcedVelocityCharts':fields,'ledger':corrected_ledger(cases,None,fields)}
        print('Repaired first Forced prefix and actual velocity charts passed.',flush=True)
        if a.full_dir or a.full_run or a.github_run_metadata:
            assert all((a.full_dir,a.full_run,a.github_run_metadata))
            gitrun = read(a.github_run_metadata)
            assert int(gitrun['databaseId'])==43010593847 and gitrun['headSha']==FULL_COMMIT
            assert gitrun['conclusion']=='success' and gitrun['status']=='completed'
            full_meta,full_reg = verify_manifest(a.full_dir,FULL_SCOPE,FULL_COMMIT)
            run = read(a.full_run)
            verify_runtime(run,full_meta,True)
            link = compare_prefix(a.first_dir,a.full_dir,first_meta)
            counts = same_registry_prefix(first_reg,full_reg)
            with TemporaryFile() as backing:
                g = ReplayGraph(a.full_dir/STREAM,backing,full_meta)
                audit = full_audit(g,full_reg,run,cases,old_projection)
            ledger = corrected_ledger(cases,audit['boundHomogeneous'],fields)
            result['correctedFullCycle']={'graphSHA256':full_meta['node_stream_sha256'],'verifiedHostedRun':gitrun,
                                         'forcedToCyclePrefix':link,'sameRegistryPrefixCounts':counts,**audit,
                                         'ledger':ledger,'nextOwnChartCandidateInputs':subtraction_plan(audit,ledger)}
    raw = (json.dumps(result,indent=2)+'\n').encode()
    a.out.write_bytes(raw)
    print(json.dumps({'calibrated':bool(result['archivedCalibration']),
                      'correctedFirstForce':bool(result['correctedFirstForce']),
                      'correctedSigned':bool(result['correctedFullCycle']),'sha256':sha256(raw).hexdigest()}))


if __name__=='__main__':
    main()
