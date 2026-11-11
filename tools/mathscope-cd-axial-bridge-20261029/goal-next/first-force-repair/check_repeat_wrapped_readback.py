"""Supplement the branch second-Forced checker with the actual native source wrapper."""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import json
import sys
from tempfile import TemporaryFile

HERE = Path(__file__).resolve().parent
LEDGER_SHA = '2570a6b98bf365e44629c40c4f406a4192b42f63acda67e08e1cd0e101b87181'
ORIGINAL_CURRENT = 'research-ide/mathscope-m3/navier/evidence/global-current-20261012/attempt1/global-current.json'
ORIGINAL_CURRENT_SHA = '8d64f045a4fc87167c8444b11c4e6cb2b8ea89a5eb53f846d31c90c15e8a7f1e'


class NativeRegistry:
    def __init__(self, definitions):
        self.definitions = definitions
        self.lookup = {}
        for d in definitions.values():
            key = d['name'],d['body'],tuple(d['parameters'])
            self.lookup.setdefault(key,[]).append(d['id'])

    def expression(self,graph,root):
        system,actual,orders = graph.args(root,'m3_coupled_expression_partial')
        assert not any(orders)
        return self.definitions[system],actual


def explicit_reach(graph, roots):
    from verify_repaired_first_force import Graph
    pending, seen = list(roots), set()
    while pending:
        root = pending.pop()
        if root in seen:
            continue
        seen.add(root)
        pending.extend(Graph.children(*graph.node(root)))
    return seen


def recover_wrapped_source(graph, registry, source, system, parts):
    """Retain actual registered original body, full native arguments and zero order."""
    formal = [system['variable'],*system['parameters']]
    roots = [z[part] for z in system['forcing'] for part in parts]
    reached = explicit_reach(graph,roots)
    calls = {root:graph.node(root)[1] for root in reached if graph.node(root)[0]=='m3_coupled_expression_partial'}
    wrapped = []
    for j,z in enumerate(source):
        output = {}
        for part in parts:
            body = z[part]
            if body==0:
                output[part]=0
                continue
            name = f'CoupledForced_source_{j}_{part}'
            ids = registry.lookup[name,body,tuple(formal)]
            matches = [root for root,(key,actual,orders) in calls.items()
                       if key in ids and actual==formal and not any(orders)]
            assert len(matches)==1,(system['name'],j,part,ids,matches)
            output[part]=matches[0]
        wrapped.append(output)
    return wrapped


def verify_mapped_pressure(graph, algebra, registry, candidate, previous, system, wrapped, parts):
    """Verify the actual nontransverse input contribution survives in mapped pressure."""
    cut = candidate['mappedCutoff']
    pulse = previous['path']['pulse']
    parameters = system['parameters']
    mapped_args = [pulse,*parameters]
    s = {system['variable']:algebra.of(pulse)}
    n = [algebra.affine_at(algebra.of(x),s) for x in previous['normal']['value']]
    nprime = [algebra.affine_at(algebra.of(x),s) for x in previous['normal']['derivative']]
    K = [[algebra.of(x) for x in row] for row in previous['K']]
    nK = [algebra.sub(algebra.dot(n,col),nprime[j]) for j,col in enumerate(zip(*K))]
    n2 = algebra.dot(n,n)
    km = algebra.mul(algebra.scalar(candidate['m']),algebra.of(previous['k']))
    common = algebra.mul(algebra.of(cut['psi']),algebra.inv(algebra.mul(km,n2)))
    actual = {}
    normal_forcing = {}
    normal_velocity = {}
    for part in parts:
        amplitude = []
        source = []
        for j in range(3):
            native = [system['id'],part,j,pulse,parameters,[0]*len(system['directions'])]
            root, = [i for i in explicit_reach(graph,[cut['velocity'][j][part]])
                     if graph.node(i)==('m3_forced_pulse_partial',native)]
            amplitude.append(algebra.of(root))
            operand = wrapped[j][part]
            if operand==0:
                source.append(algebra.zero)
                continue
            definition,_ = registry.expression(graph,operand)
            descriptor = [definition['id'],mapped_args,[0]*len(mapped_args)]
            f, = [i for i in explicit_reach(graph,[cut['remainingSource'][j][part]])
                  if graph.node(i)==('m3_coupled_expression_partial',descriptor)]
            source.append(algebra.of(f))
        normal_forcing[part] = algebra.dot(n,source)
        normal_velocity[part] = algebra.dot(nK,amplitude)
        actual[part] = algebra.add(normal_velocity[part],normal_forcing[part])
    rejected = []
    def reduce_difference(left,right):
        difference = algebra.sub(left,right)
        if difference:
            difference = algebra.reduce_sqrt_two(algebra.clear_compound_denominators(difference),3622)
        return difference

    for out,inp,sign in (('real','imaginary',-1),('imaginary','real',1)):
        expected = algebra.mul(algebra.scalar(sign),common,actual[inp])
        difference = reduce_difference(algebra.of(cut['pressure'][out]),expected)
        assert not difference,(candidate['key'],candidate['m'],out,'actual mapped pressure')
        missing = algebra.mul(algebra.scalar(sign),common,normal_velocity[inp])
        rejected.append(bool(reduce_difference(algebra.of(cut['pressure'][out]),missing)))
    return {part:len(normal_forcing[part]) for part in parts},rejected


def verify_unexpanded_product(lift, root, factors):
    """Authenticate each complete multiplicative operand without expanding their product."""
    remaining = list(factors)
    operands = []

    def visit(node):
        try:
            value = lift.form(node)
        except ValueError as error:
            if str(error) != 'exact expansion budget':
                raise
        else:
            for index, factor in enumerate(remaining):
                if value == factor:
                    remaining.pop(index)
                    operands.append(node)
                    return
        op, args = lift.graph.node(node)
        assert op == 'multiply', (node, 'unmatched Signed tail operand')
        for child in args:
            visit(child)

    visit(root)
    assert not remaining, (root, 'missing Signed tail operand')
    return operands


def verify_signed_tail(graph,template,defs,ledger_rows,current,weights):
    """Check direct candidate Signed cutoff tails against the verified full first cycle."""
    from bind_primary_amplitude import FixedLift
    band = current['sourceBand']
    representative = current['sourceRepresentative']['roots']
    key = template['key']
    sign = template['sign']
    index = 0 if sign==1 else 1
    family = band['families'][index]
    assert family['sign']==sign
    parts = template['rows'][0]['terms'][3]['value']
    matching = [r for r in ledger_rows if r['key']==key]
    assert len(matching)==3
    chart = band['coordinates']
    lift = FixedLift(graph)
    out = []
    for j,z in enumerate(parts):
        row, = [r for r in matching if r['component']==j]
        assert z['imaginary']==0
        native,actual,orders = graph.args(z['real'],'m3_coupled_expression_partial')
        defn = defs[native]
        assert defn['name']==f'PostFiveSignedPrincipalTail_{key}_{j}'
        assert defn['parameters']==actual and not any(orders)
        tail = row['mappedPulseDerivative']
        assignments = ((chart['Xrep'],representative['X']),(chart['etaRep'],representative['eta']),
                       (chart['sRep'],representative['s']),(band['cutoffs']['xi'],row['sourceGuards'][-2][0]),
                       (chart['v'],row['pulseValue']))
        scalar = next(r for r in row['signed']['mappedPotentialCalls'])
        assert scalar['actualArguments'][5:8]==[representative['X'],representative['eta'],representative['s']]
        eps = lift.form(band['geometry']['epsilon'],assignments)
        sqrt_eps = lift.atom('sqrt_positive',(),[eps])
        expected_roots = [current['local']['slowCutoff']['body'],weights[index],band['cutoffs']['chi'],family['t'][j]]
        factors = [lift.algebra.scalar('1/2'),sqrt_eps,lift.form(tail),
                   *(lift.form(r,assignments) for r in expected_roots)]
        observed = verify_unexpanded_product(lift,defn['body'],factors)
        out.append({'key':key,'component':j,'root':z['real'],'actualBody':defn['body'],
                    'mappedCutoffDerivative':tail,'actualSignedWeight':weights[index],
                    'readBackMultiplicativeOperands':observed})
    FixedLift.form.cache_clear()
    return out


def main():
    p = ArgumentParser(description=__doc__)
    for option in ('repo','first-dir','out'):
        p.add_argument('--'+option,type=Path,required=True)
    p.add_argument('--candidate-dir',type=Path)
    p.add_argument('--official-receipt',type=Path)
    args = p.parse_args()
    assert bool(args.candidate_dir)==bool(args.official_receipt)
    branch = args.repo.resolve()/'tools/mathscope-cd-axial-bridge-20261029/goal-next'
    sys.path.insert(0,str(branch/'first-force-repair'))
    import check_repeat_forced_candidates as official
    from verify_repaired_first_force import BASE, cutoff
    from bind_corrected_flat import STREAM, verify_manifest, FIRST_SCOPE
    ledger = (branch/'corrected-flat/corrected-cycle-ledger.json').read_bytes()
    assert sha256(ledger).hexdigest()==LEDGER_SHA
    full = json.loads(ledger)['correctedFullCycle']
    current = official.git_blob(args.repo,BASE,ORIGINAL_CURRENT)
    assert sha256(current).hexdigest()==ORIGINAL_CURRENT_SHA
    current = json.loads(current)['source']
    official.Graph.reach = explicit_reach
    prior = official.read(args.first_dir/'corrected-first-force.json')
    old = {(r['key'],r['m']):r for r in prior['rows']}
    wrapper_proofs,signed_proofs = [], []
    if args.candidate_dir:
        checked_raw = args.official_receipt.read_bytes()
        checked = json.loads(checked_raw)
        graph_dir = args.candidate_dir
        manifest,registry = verify_manifest(graph_dir,official.CANDIDATE_SCOPE,checked['commit'])
        candidate = official.read(graph_dir/official.CANDIDATE_FILE)
        assert checked['graphSHA256']==manifest['node_stream_sha256']
        assert checked['registrySHA256']==manifest['definitions_sha256']
        assert candidate['registeredPositiveSystems']==40 and candidate['snapshot']==manifest
        candidates = candidate['systems']
        templates = candidate['templates']
    else:
        checked_raw = None
        graph_dir = args.first_dir
        manifest,registry = verify_manifest(graph_dir,FIRST_SCOPE,prior['commit'])
        assert manifest==prior['snapshot']
        candidates = old.values()
        templates = []
    definitions,_,_,systems,_ = json.loads(registry['definitions'])
    defs = {r['id']:r for r in definitions}
    native = NativeRegistry(defs)
    with TemporaryFile() as backing:
        graph = official.Graph(graph_dir/STREAM,backing,manifest)
        algebra = official.Exact(graph)
        for template in templates:
            signed_proofs.extend(verify_signed_tail(graph,template,defs,full['boundHomogeneous'],current,
                                                    full['signedCovarianceWeights']['signedWeights']))
        for candidate in candidates:
            if args.candidate_dir:
                previous = old[candidate['key'],1]
                raw = [{part:z[part]['mapped'] for part in official.PARTS} for z in candidate['pullback']]
            else:
                previous = candidate
                raw = [{part:next(z['mapped'] for z in candidate['components'] if z['j']==j and z['part']==part)
                        for part in official.PARTS} for j in range(3)]
            system = systems[candidate['system']]
            wrapped = recover_wrapped_source(graph,native,raw,system,official.PARTS)
            bound = {'path':previous['path'],'length':system['length'],'mappedCutoff':candidate['mappedCutoff']}
            cutoff(graph,algebra,native,bound,system,wrapped)
            normal,rejected = verify_mapped_pressure(graph,algebra,native,candidate,previous,system,wrapped,official.PARTS)
            wrapper_proofs.append({'key':candidate['key'],'mode':candidate['m'],'system':system['id'],
                                   'pulledSourceRoots':raw,'nativeWrappedRoots':wrapped,
                                   'mappedNormalForcingMonomialCounts':normal,
                                   'omittedNormalSourceAlgebraRejected':dict(zip(official.PARTS,rejected))})

    assert len(wrapper_proofs)==(40 if args.candidate_dir else 20)
    assert len(signed_proofs)==(30 if args.candidate_dir else 0)
    assert any(v for row in wrapper_proofs for v in row['omittedNormalSourceAlgebraRejected'].values())
    receipt = {'schema':'MathScope.N6.SupplementalWrappedPressureAndSignedTailReadback/1',
               'scope':manifest['scope'],'graphSHA256':manifest['node_stream_sha256'],
               'officialAuditSHA256':sha256(checked_raw).hexdigest() if checked_raw else None,
               'nativeWrapperAndPressureProofs':wrapper_proofs,'independentSignedHalfAmplitudeProofs':signed_proofs,
               'correctedFullFirstCycleLedgerSHA256':LEDGER_SHA}
    blob = (json.dumps(receipt,indent=2)+'\n').encode()
    args.out.write_bytes(blob)
    print(f'PASS {len(wrapper_proofs)} wrapped-source and full-pressure checks, {len(signed_proofs)} Signed half-amplitudes')
    print(f'{sha256(blob).hexdigest()}  {args.out.name}')


if __name__=='__main__':
    main()
