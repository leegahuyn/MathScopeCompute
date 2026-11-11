"""Match live repeat wave operands to complete corrected post-Five own fields."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


PARTS = ('real', 'imaginary')
FIRST_SHA = '1ab376e369484c63e17b0d891eebcc18ddedf53f8e6acb907bc9ec8c05d51fc3'
FIELD_COMPONENTS = ('radialVelocity', 'angularVelocity', 'axialVelocity', 'angularPressure')


def product_parts(graph, root, application_op):
    args = graph.args(root, 'multiply')
    assert len(args) == 2
    [application] = [r for r in args if graph.node(r)[0] == application_op]
    [scale] = [r for r in args if r != application]
    return scale, application


def check_power(graph, algebra, root, ratio, exponent):
    [body] = graph.args(root, 'exp')
    log_args = [i for i in graph.reach([body]) if graph.node(i) == ('log_positive', [ratio])]
    [log_ratio] = log_args
    assert algebra.of(body) == algebra.mul(exponent, algebra.of(log_ratio))


def field_references(graph, source, algebra, candidate, by_id, chart, names, A):
    reference_fields = {}
    for j, ref in enumerate(candidate['fields']):
        field = by_id[ref['field']]
        assert field['name'] == names[j]
        assert graph.args(ref['root'], 'm3_coupled_indexed_partial') == [
            field['id'], field['parameters'], [0] * len(field['directions'])]
        by_sign = {}
        for row in field['rows']:
            reference = source.expressions[row['localSystem']]
            sign = row['label']['sign']
            suffix = 0 if sign == 1 else 1
            assert reference['name'] == f"{field['name']}_reference_{suffix}"
            scale, application = product_parts(graph, reference['body'], 'm3_coupled_expression_partial')
            degree = 2 if j % 4 == 3 else 1
            check_power(graph, algebra, scale, chart['ratio'], algebra.mul(algebra.scalar(degree), algebra.of(A)))
            own_id, actual, orders = graph.args(application, 'm3_coupled_expression_partial')
            own = source.expressions[own_id]
            assert own['name'] == f"{field['name']}_own_{suffix}"
            assert own['parameters'] == reference['parameters'] == row['localParameters']
            assert actual == chart['ownCoordinates'] + own['parameters'][3:] and orders == [0] * len(actual)
            assert row['values'][-1] == row['label']['fixedDifference']
            receipt = {'field': field['id'], 'globalRoot': ref['root'], 'referenceSystem': reference['id'],
                       'referenceBody': reference['body'], 'referenceScale': scale,
                       'referenceApplication': application, 'ownSystem': own_id,
                       'ownFormals': own['parameters'], 'referenceActuals': actual}
            assert by_sign.setdefault(sign, receipt) == receipt
        assert set(by_sign) == {-1, 1}
        reference_fields[j] = by_sign
    return reference_fields


def mean_decomposition(graph, source, algebra, additive, full, candidate, defs, chart, A, D, angle):
    means = [*candidate['mean']['velocity'], candidate['mean']['pressure']]
    assert candidate['mean']['m'] == 0 and all(z['imaginary'] == 0 for z in means)
    controls = []
    results = []
    for j, (z, full_root) in enumerate(zip(means, full['original_root_ids'][:4], strict=True)):
        waves = [candidate['fields'][k + j]['root'] for k in (0, 4)]
        value = additive(graph, full_root)
        assert all(value[((root, 1),)] == 1 for root in waves)
        leftover = algebra.sub(value, algebra.add(*(additive(graph, x) for x in waves)))
        for powers in leftover:
            assert all(angle not in source.free(root) for root, _ in powers)
        scale, application = product_parts(graph, z['real'], 'm3_coupled_expression_partial')
        system, actual, orders = graph.args(application, 'm3_coupled_expression_partial')
        definition = defs[system]
        wanted = f'PostFiveRepeatMeanVelocity_{j}' if j < 3 else 'PostFiveRepeatMeanPressure'
        assert definition['name'] == wanted and orders == [0] * len(actual)
        ell = definition['parameters'][3]
        ref_ell = actual[3]
        assert actual[4:] == definition['parameters'][4:] and angle not in definition['parameters']
        ref_name, = graph.args(ref_ell, 'coordinate')
        assert ref_name.startswith('initialized_angular_reference_band$')
        [ratio_exponent] = graph.args(chart['ratio'], 'exp')
        [log_two] = [i for i in graph.reach([ratio_exponent]) if graph.node(i)[0] == 'log_positive']
        [two] = graph.args(log_two, 'log_positive')
        assert algebra.of(two) == algebra.scalar(2)
        assert algebra.of(ratio_exponent) == algebra.mul(algebra.of(log_two),
                                                       algebra.sub(algebra.of(ell), algebra.of(ref_ell)))
        assert definition['parameters'][:3] == chart['referenceCoordinates']
        assert set(source.free(definition['body'])) <= set(definition['parameters'])
        assert additive(graph, definition['body']) == leftover
        degree = 2 if j == 3 else 1
        check_power(graph, algebra, scale, chart['ratio'], algebra.mul(algebra.scalar(-degree), algebra.of(A)))
        r, zz, t = definition['parameters'][:3]
        radial, axial, temporal = chart['ownToReferenceDivisors']
        assert graph.args(radial, 'sqrt_positive') == [chart['ratio']] and temporal == chart['ratio']
        check_power(graph, algebra, axial, chart['ratio'], algebra.of(D))
        for root, coordinate, forward in zip(actual[:3], (r, zz, t), chart['ownToReferenceDivisors'], strict=True):
            assert algebra.of(root) == algebra.mul(algebra.of(coordinate), algebra.inv(algebra.of(forward)))
        assert additive(graph, definition['body']) != algebra.sub(value, additive(graph, waves[0]))
        controls.append({'omittedSignedIndexedFieldRejected': waves[1]})
        results.append({'component': j, 'fullPhysicalRoot': full_root, 'forcedAndSignedIndexedRoots': waves,
                        'liveOwnMean': z['real'], 'meanSystem': system, 'meanReferenceBody': definition['body'],
                        'meanApplication': application, 'meanReferenceFormals': definition['parameters'],
                        'meanOwnToReferenceActuals': actual, 'inverseScale': scale})
    return results, controls


def read_own_case(graph, source, refs, template, case_body, real_series):
    sign, d = template['sign'], template['difference']
    phase = template['phase']
    assert template['key'] == f'{d}:{sign}'
    output = []
    for j in range(8):
        definition = source.expressions[refs[j][sign]['ownSystem']]
        root, guards = case_body(graph, definition['body'], d)
        assert len(guards) == 7
        if j > 0:
            assert guards == output[0]['guards']
        coeffs = real_series(graph, root, phase)
        modes = {-2, -1, 1, 2} if j < 4 else {-1, 1}
        assert {m for m, _ in coeffs} == modes
        output.append({'ownSystem': definition['id'], 'selectedBody': root, 'guards': guards, 'terms': coeffs})
    return output


def signed_coefficient_trace(series, mode, part):
    trig, direction = ('cosine', 1) if part == 'real' else ('sine', -1)
    trace = {}
    for label, m in (('positive', mode), ('negative', -mode)):
        if (m, trig) not in series:
            trace[label] = {'root': 0, 'multiplier': 0, 'literalZero': True}
        else:
            sign, root = series[m, trig]
            trace[label] = {'root': root, 'multiplier': direction * sign, 'literalZero': False}
    return trace


def native_wave_calls(graph, template, defs, prefix, children):
    owners = set(template['rawSupport']['waveSystems'])
    reached = {}
    seen = set()
    roots = [z[p] for row in template['rows'] for z in row['raw'] for p in PARTS]
    while roots:
        root = roots.pop()
        if root < prefix or root in seen:
            continue
        seen.add(root)
        op, args = graph.node(root)
        if op == 'm3_coupled_expression_partial':
            system, actual, orders = args
            if system in owners:
                assert actual == defs[system]['parameters']
                component = int(defs[system]['name'].split('_')[-2])
                assert len(actual) == len(orders) and sum(orders) <= (1 if component == 3 else 2)
                by_order = reached.setdefault(system, {})
                assert by_order.setdefault(tuple(orders), root) == root
        roots.extend(children({'op': op, 'args': args}))
    assert reached.keys() == owners
    return reached


def wave_rows(graph, source, algebra, templates, reference_fields, defs, prefix, children,
              case_body, real_series, additive, assert_rational_identity, chart, angle):
    def formula(trace, lift):
        return algebra.mul(algebra.scalar(trace['multiplier']), lift(trace['root']))

    def exact_sum_equality(lhs, rhs, label):
        def evaluate(terms, lift):
            return algebra.add(*(formula(t, lift) for t in terms))
        local_additive = lambda root: additive(graph, root)
        if evaluate(lhs, local_additive) == evaluate(rhs, local_additive):
            return 'identical sum of exact native operands'
        assert_rational_identity(algebra, evaluate(lhs, algebra.of), evaluate(rhs, algebra.of), label)
        return 'exact rational reduction'

    names = {row['name']: row for row in defs.values()}
    phases = {(row['difference'], row['sign']): row['ownPhase'] for row in chart['phaseCases']}
    result = []
    controls = []
    for t in templates:
        key, d, sign = t['key'], t['difference'], t['sign']
        assert t['phase'] == phases[d, sign]
        own = read_own_case(graph, source, reference_fields, t, case_body, real_series)
        reached = native_wave_calls(graph, t, defs, prefix, children)
        for m in (1, 2):
            fields = []
            for j, component in enumerate(FIELD_COMPONENTS):
                forced, signed = own[j], own[j + 4]
                proof = {'component': component}
                for part in PARTS:
                    name = f'PostFiveRepeatWave_{key}_{m}_{j}_{part}'
                    wrapper = names[name]
                    body = wrapper['body']
                    assert body < prefix and wrapper['parameters'] == sorted(source.free(body))
                    assert angle not in wrapper['parameters']
                    applications = reached[wrapper['id']]
                    zero = (0,) * len(wrapper['parameters'])
                    assert zero in applications
                    forced_trace = signed_coefficient_trace(forced['terms'], m, part)
                    signed_trace = signed_coefficient_trace(signed['terms'], m, part)
                    for trace in (forced_trace, signed_trace):
                        conjugate = dict(trace['positive'])
                        conjugate['multiplier'] *= 1 if part == 'real' else -1
                        exact_sum_equality([trace['negative']], [conjugate],
                                           (key, m, component, part, 'conjugate'))
                    method = exact_sum_equality([{'root': body, 'multiplier': 1}],
                                                [forced_trace['positive'], signed_trace['positive']],
                                                (key, m, component, part))
                    if not signed_trace['positive']['literalZero']:
                        assert formula(signed_trace['positive'], lambda root: additive(graph, root))
                        controls.append((key, m, j, part))
                    if m == 2:
                        assert signed_trace['positive']['literalZero'] and signed_trace['negative']['literalZero']
                    proof[part] = {'system': wrapper['id'], 'body': body, 'formals': wrapper['parameters'],
                                   'application': applications[zero],
                                   'nativeApplications': [{'orders': list(orders), 'root': root}
                                                          for orders, root in sorted(applications.items())],
                                   'forcedOwnSystem': forced['ownSystem'], 'signedOwnSystem': signed['ownSystem'],
                                   'forcedCoefficient': forced_trace['positive']['root'],
                                   'signedCoefficient': signed_trace['positive']['root'],
                                   'forcedCoefficientTrace': forced_trace,
                                   'signedCoefficientTrace': signed_trace, 'equalityMethod': method}
                fields.append(proof)
            result.append({'key': key, 'mode': m, 'phase': t['phase'], 'guards': own[0]['guards'],
                           'eachGuardExteriorBranches': [0, 0], 'fields': fields})
    assert len(result) == 20 and len(controls) == 70
    return result, controls


def main():
    parser = ArgumentParser(description=__doc__)
    for arg in ('repo', 'first-dir', 'full-dir', 'candidate-dir', 'official-receipt', 'out'):
        parser.add_argument('--' + arg, type=Path, required=True)
    args = parser.parse_args()
    branch = args.repo.resolve() / 'tools/mathscope-cd-axial-bridge-20261029/goal-next'
    sys.path[:0] = [str(branch / n) for n in ('first-force-repair', 'y')]
    from check_repeat_forced_candidates import CANDIDATE_FILE, CANDIDATE_SCOPE, Exact, Graph, STREAM
    from bind_corrected_flat import (Archive, BASE, FIRST_SCOPE, FULL_SCOPE, OLD_CURRENT_PATH, OLD_CURRENT_SHA,
                                     assert_rational_identity, case_body, check_corrected_first_fields, compare_prefix,
                                     git_blob, real_series, same_registry_prefix, signed_pressure,
                                     verify_manifest)
    from group_replayed_postfive import ANGLE, FIELD_NAMES, ReplayedSource
    from native_reference_scopes import actual_children
    from verify_repaired_first_force import additive

    official = args.official_receipt.read_bytes()
    checked = json.loads(official)
    full, full_reg = verify_manifest(args.full_dir, FULL_SCOPE)
    final, final_reg = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, checked['commit'])
    assert final['node_stream_sha256'] == checked['graphSHA256'] and final['definitions_sha256'] == checked['registrySHA256']
    matched = compare_prefix(args.full_dir, args.candidate_dir, full)
    assert matched == checked['matchedCorrectedFirstCyclePrefix']
    assert same_registry_prefix(full_reg, final_reg) == checked['matchedNativeDefinitionPrefix']
    previous = json.loads((args.first_dir / 'corrected-first-force.json').read_bytes())
    first, first_reg = verify_manifest(args.first_dir, FIRST_SCOPE, previous['commit'])
    assert previous['snapshot'] == first and first['node_stream_sha256'] == FIRST_SHA
    compare_prefix(args.first_dir, args.full_dir, first)
    same_registry_prefix(first_reg, full_reg)
    candidate = json.loads((args.candidate_dir / CANDIDATE_FILE).read_bytes())
    assert candidate['snapshot'] == final and candidate['precedingConservativeResidual'] == full['original_root_ids'][5:8]
    defs, indexed, *_ = json.loads(final_reg['definitions'])
    defs = {r['id']: r for r in defs}
    indexed = {r['id']: r for r in indexed}
    current_raw = git_blob(args.repo, BASE, OLD_CURRENT_PATH)
    assert sha256(current_raw).hexdigest() == OLD_CURRENT_SHA
    band = json.loads(current_raw)['source']['sourceBand']
    A, D = (band['constants'][k] for k in ('A', 'D'))
    cases = []
    by_template = {t['key']: t for t in candidate['templates']}
    for r in previous['rows']:
        t = by_template[r['key']]
        cases.append({'key': t['key'], 'mode': r['m'], 'difference': t['difference'], 'sign': t['sign'],
                      'phase': t['phase'], 'pulseValue': r['path']['pulse'], 'cutoff': r['mappedCutoff']['psi'],
                      'system': r['system'], 'raw': r})

    class WaveGraph(Graph):
        op = Graph.args
        factors = Archive.factors
        explicit_reach = Archive.explicit_reach

    with TemporaryFile() as backing:
        graph = WaveGraph(args.candidate_dir / STREAM, backing, final)
        source = ReplayedSource(graph, full_reg)
        algebra = Exact(graph)
        row_maps, _ = source.row_programs()
        chart = source.replayed_chart(row_maps)
        references = field_references(graph, source, algebra, candidate, indexed, chart, FIELD_NAMES, A)
        means, mean_controls = mean_decomposition(graph, source, algebra, additive, full, candidate, defs, chart, A, D, ANGLE)
        waves, controls = wave_rows(graph, source, algebra, candidate['templates'], references, defs, matched['matchedNodes'],
                                   actual_children, case_body, real_series, additive, assert_rational_identity,
                                   chart, ANGLE)
        forced = check_corrected_first_fields(graph, full_reg, cases)
        signed = signed_pressure(graph, full_reg, cases)
    assert len(forced) == len(signed) == 10
    report = {'schema': 'MathScope.N6.LiveRepeatOwnWaveOperandBinding/1', 'run': checked['run'],
              'graphSHA256': final['node_stream_sha256'], 'registrySHA256': final['definitions_sha256'],
              'officialAuditSHA256': sha256(official).hexdigest(), 'correctedFullPrefix': matched,
              'indexedFieldReferences': references, 'indexedRowCount': len(row_maps),
              'meanDecomposition': means, 'meanControls': mean_controls,
              'waves': waves, 'omittedSignedNonzeroCoefficientControls': controls,
              'originalFirstForcedFullCurlAndPressure': forced, 'originalSignedHomogeneousPressure': signed,
              'scope': 'Finite equality on each fixed original own chart on the common ordinary derivative domain.',
              'crossRowVanishingAndAnalyticJoins': 'OPEN'}
    out = (json.dumps(report, indent=2) + '\n').encode()
    args.out.write_bytes(out)
    print('PASS 160 live complete wave coefficients, 162 original row maps, and all four physical mean splits')
    print(f'{sha256(out).hexdigest()}  {args.out.name}')


if __name__ == '__main__':
    main()
