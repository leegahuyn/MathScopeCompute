"""Bind all 20 original first-Forced inputs to the raw initialized harmonics."""
from argparse import ArgumentParser
from collections import defaultdict
from copy import deepcopy
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

adjacent = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(adjacent / 'flat'), str(adjacent / 'flat-homogeneous')]
from bind_forced_cutoffs import Archive, GRAPH_SHA, REGISTRY_SHA, PRODUCER_COMMIT, git_blob, pinned_json
from bind_homogeneous_cutoffs import case_body

FORCED_SHA = '719318e74afc94b7f6c45e6cf36d05362cffa8cf1f4567d0d5b61ed852e0b76d'
K = 622801
Y = [635044, 635045]
MINUS = 20
NAVIER = 'research-ide/mathscope-m3/navier/'


def pins(repo):
    proof = {
        'source-global-angular.mjs': (
            "oldFlat=[{m:0,value:base.conservativeResidual.map",
            "pulseEndpointRemaindersKept:'All psi/chi/slow-cutoff derivatives remain",
        ),
        'source-initialized-angular.mjs': (
            'waveResidual=subtractVectorRows(G,update.direct,update.oldResidual)',
            'nonzeroAngularForcing:waveResidual.filter(r=>r.m!==0)',
            'G.sub(G.mul(value[j].real,G.cosine(a)),G.mul(value[j].imaginary,G.sine(a)))',
            't.waveResidual,k,t.phase',
        ),
        'source-global-forced-current.mjs': (
            'const positive=old.nonzeroAngularForcing.find(r=>r.m===m)',
            'positive.value.map((z,j)=>Object.fromEntries(parts.map(part=>[part,sourcePullbackComponent',
            'mapped=G.simultaneousSubstitute(value,path.Y,path.Hw)',
            'wholeDefiningBodyRetained:G.expressionSystem(system).body===body',
            'forcing=pullback.map(z=>C.value(z.real.mapped,z.imaginary.mapped))',
        ),
        'source-coupled-expressions.mjs': (
            "const parameters=[input.variable,...input.parameters]",
            "wrap(z.real,'source_'+j+'_real')",
        ),
        'source-forced-pulse.mjs': (
            'projectedRaw=projection.map(row=>cscale(G,G.q(-1),cdot(G,row,forcing)))',
            'pressureNumerator=cadd(G,cdot(G,normalRow,velocity),cdot(G,n,forcing))',
            'source:structuredClone(forcing),projectedSource,system,velocity,pressure',
            "formula:'principal(psi*t,psi*pi)+f=(1-psi)*f+psi_prime*t'",
        ),
    }
    out = {}
    for name, needles in proof.items():
        path = NAVIER + name
        data = git_blob(repo, PRODUCER_COMMIT, path)
        assert all(text.encode() in data for text in needles), path
        out[path] = sha256(data).hexdigest()
    return out


def harmonic_roots(graph, i, phase):
    """Recover the exact signed cosine and sine coefficient roots."""
    result = defaultdict(list)

    def visit(root, sign):
        op, args = graph.node(root)
        if op == 'add':
            for child in args:
                visit(child, sign)
            return
        if op != 'multiply':
            return
        if MINUS in args:
            assert len(args) == 2
            visit(next(v for v in args if v != MINUS), -sign)
            return
        trig = [child for child in args if graph.node(child)[0] in ('cosine', 'sine')]
        if not trig:
            return
        assert len(trig) == 1 and len(args) == 2
        kind, [angle] = graph.node(trig[0])
        mode, factors = graph.factors((angle, 1), (phase, -1), (K, -1))
        assert not factors and mode.denominator == 1 and abs(mode) in (1, 2)
        coefficient = next(child for child in args if child != trig[0])
        result[(kind, int(mode))].append((sign, coefficient))

    visit(i, 1)
    assert set(result) == {(kind, mode) for kind in ('cosine', 'sine') for mode in (-2, -1, 1, 2)}
    assert all(len(terms) == 1 for terms in result.values())
    return {key: terms[0] for key, terms in result.items()}


def bind(graph, registry, forced):
    exprs, _, _, pulses, _ = json.loads(registry['definitions'])
    by_name = {record['name']:record for record in exprs}
    rows = []
    paths = set()
    for entry in forced['bindings']:
        key, m, s, d, phase = [entry[field] for field in ('key', 'mode', 'sign', 'difference', 'phase')]
        system = pulses[entry['system']]
        assert system['name'] == f'ActualOriginalForced_{key}_m{m}'
        assert system['initial'] == [{'real':0,'imaginary':0}]*3
        path_map = {}
        for j, component in enumerate(entry['components']):
            suffix = 0 if s == 1 else 1
            own = by_name[f'ActualInitializedAngularOwnLabel_{suffix}_{j}']
            body, guards = case_body(graph, own['body'], d)
            assert guards[-1] == [entry['pulseValue'],0,entry['length']]
            terms = harmonic_roots(graph, body, phase)
            for part, trig, sign in [('real','cosine',1),('imaginary','sine',-1)]:
                source = component[part]
                source_system = source['sourceSystem']
                wrapper = exprs[int(source_system.split(':')[1])]
                assert wrapper['id'] == source_system and wrapper['body'] == source['sourceBody']
                assert wrapper['name'] == f'CoupledForced_source_{j}_{part}'
                assert wrapper['parameters'] == [system['variable'],*system['parameters']]
                outer_name, actual, orders = graph.op(source['sourceBody'], 'm3_coupled_expression_partial')
                original = exprs[int(outer_name.split(':')[1])]
                assert outer_name == original['id']
                assert original['name'] == f'ActualWholeNonzeroSource_{key}_{m}_{j}_{part}'
                assert terms[trig,m] == (sign,original['body'])
                assert not any(orders) and len(actual) == len(original['parameters'])
                map_ = {formal:value for formal, value in zip(original['parameters'], actual, strict=True)
                        if formal != value}
                assert set(map_) == set(Y)
                assert path_map in ({},map_)
                path_map = map_
                assert all(system['variable'] in graph.explicit_reach([mapped]) for mapped in map_.values())
                roots = graph.explicit_reach(v for pair in system['forcing'] for v in pair.values())
                assert source['formalPathSource'] in roots
                assert graph.op(source['formalPathSource'],'m3_coupled_expression_partial') == [
                    source_system, wrapper['parameters'], [0]*len(wrapper['parameters'])]
                rows.append({'key':key,'mode':m,'component':j,'part':part,'system':system['id'],
                             'initializedOwnBody':own['body'],'selectedRawBody':body,
                             'rawInitializedHarmonic':original['body'],'rawFunction':original['id'],
                             'mappedRawWrapperBody':wrapper['body'],'mappedActualArguments':actual,
                             'pathArgumentChanges':map_,'formalPathSource':source['formalPathSource']})
        paths.add((key, tuple(path_map.items())))
    assert len(rows) == 120 and len(paths) == 10
    assert {row['system'] for row in rows} == set(range(20))
    return rows


def arithmetic_control():
    # Independent exact rational countermodel to the unjustified extra P.
    psi, primary, supported, forced_derivative = map(Fraction, ('1/2','1','0','0'))
    raw = supported + primary
    actual = raw - psi * raw + forced_derivative
    retained = (1-psi) * supported + (1-psi) * primary + forced_derivative
    prior_candidate = (1-psi) * raw + forced_derivative + primary
    assert actual == retained and actual - prior_candidate == -primary
    return {'psi':str(psi),'primary':str(primary),'actual':str(actual),
            'withExtraPrimary':str(prior_candidate),'difference':str(actual-prior_candidate),
            'scope':'Exact algebra countermodel, independent of source numerical evaluation.'}


def main():
    p = ArgumentParser(description=__doc__)
    for a in ('repo','graph','registry','forced','out'):
        p.add_argument('--'+a,type=Path,required=True)
    a = p.parse_args()
    assert __debug__
    registry = pinned_json(a.registry,REGISTRY_SHA)
    forced = pinned_json(a.forced,FORCED_SHA)
    with TemporaryFile() as store:
        graph = Archive(a.graph,store)
        rows = bind(graph,registry,forced)
        altered = deepcopy(forced)
        altered['bindings'][0]['components'][0]['real']['sourceBody'] = altered['bindings'][0]['components'][0]['imaginary']['sourceBody']
        try:
            bind(graph,registry,altered)
        except AssertionError:
            rejected = True
        else:
            raise AssertionError('Wrong raw harmonic survived')
    result = {'schema':'MathScope.N6.ArchivedFirstForcedRawSource/1',
              'verdict':'VERIFIED_FIRST_FORCED_CONSUMES_RAW_INITIALIZED_NONZERO_RESIDUAL',
              'sourceCommit':PRODUCER_COMMIT,'graphSHA256':GRAPH_SHA,'registrySHA256':REGISTRY_SHA,
              'forcedReceiptSHA256':FORCED_SHA,'producerSourceSHA256':pins(a.repo),
              'checkedPositiveSystems':20,'realAndImaginaryComponents':len(rows),
              'exactRawSourceBindings':rows,'sourceRule':'The original difference direct - old is filtered only by m != 0.',
              'inverseRule':'The complete principal operator on (t,pi) gives -f, including the source normal component via pressure.',
              'cutoffRule':'f + principal(psi*t,psi*pi) = (1-psi)*f + (dpsi)*t.',
              'primaryOverlap':'For raw f = supported + P, the retained inherited primary piece is (1-psi)*P inside the archived (1-psi)*f. Adding a standalone P to that ledger changes it by P.',
              'arithmeticCountermodel':arithmetic_control(),'wrongComponentRejected':rejected,
              'sourceGenerationImplementsPreForcedPrimaryTailExclusion':False,
              'completeFirstCycleFlatResidualProved':False,'completeSecondForcingInput':False}
    a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'systems':20,'components':len(rows),'sha256':sha256(a.out.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
