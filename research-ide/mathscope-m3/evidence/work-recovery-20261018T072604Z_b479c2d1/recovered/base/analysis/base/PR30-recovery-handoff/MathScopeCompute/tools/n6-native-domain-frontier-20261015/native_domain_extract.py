#!/usr/bin/env python3
"""Read-only natural/Picard domain diagnostics from the pinned original graph.

Replays the inherited full-source authentication into a fresh SQLite cache.
No source producer is executed.  Conservative dependencies and syntactic
contexts are diagnostic evidence, never actual-domain or regularity proofs.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict, deque
import hashlib
import importlib.util
import json
from pathlib import Path

STAGE3_PIN = '388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f'
SOURCE_NODES = 3892594
G_ROOT = 3614891
G_PARAMETERS = [622791, 622802, 622803, 622804, 635044, 635045]
LEAVES = {'coordinate', 'rational', 'source_parameter'}
UNARY = {'inverse', 'sqrt_positive', 'log_positive', 'exp', 'sine', 'cosine', 'ceiling', 'integer_power', 'source_step_derivative'}
ORDINARY = LEAVES | UNARY | {'add', 'multiply', 'maximum', 'smooth_piecewise', 'definite_integral'}
CALLS = {'actual_expression_partial', 'm3_aux_expression_partial', 'm3_aux_indexed_partial', 'm3_aux_inverse_partial',
         'm3_global_indexed_partial', 'm3_coupled_expression_partial', 'm3_coupled_indexed_partial',
         'm3_coupled_inverse_partial', 'm3_forced_expression_partial'}
NATIVE = CALLS | {'actual_monotone_root', 'actual_quadratic_root', 'actual_natural_series',
                 'actual_background_even_profile', 'actual_background_picard', 'actual_covariance_volterra',
                 'm3_global_pulse_jet', 'm3_forced_pulse_partial'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def canonical(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode('utf-8')


def sha(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def write(path, value):
    Path(path).write_bytes(canonical(value) + b'\n')


def integer_superset(value, node_count=SOURCE_NODES):
    if type(value) is int:
        if 0 <= value < node_count:
            yield value
    elif isinstance(value, (tuple, list)):
        for child in value:
            yield from integer_superset(child, node_count)
    elif isinstance(value, dict):
        for child in value.values():
            yield from integer_superset(child, node_count)
    elif isinstance(value, str) and value.lstrip().startswith(('{', '[')):
        try:
            decoded = json.loads(value)
        except ValueError:
            return
        yield from integer_superset(decoded, node_count)


def native_definition(node, registries):
    """Resolve every reviewed native opcode, failing closed on missing data."""
    op, args = node['op'], node['args']
    require(op in NATIVE, 'Unknown native operation ' + op)
    try:
        if op == 'actual_natural_series':
            return 'fixed', registries['fixed']
        if op == 'actual_covariance_volterra':
            matches = [d for d in registries['m3GlobalPulses'] if d['covariance'] == args[0]]
            require(len(matches) == 1, 'Missing or ambiguous covariance registry')
            return 'covariance:' + str(args[0]), matches[0]
        group = {
            'actual_expression_partial': 'expression', 'm3_aux_expression_partial': 'expressionDefinitions',
            'm3_aux_indexed_partial': 'fieldDefinitions', 'm3_aux_inverse_partial': 'inverseDefinitions',
            'm3_global_indexed_partial': 'm3GlobalFields', 'actual_monotone_root': 'monotone',
            'actual_quadratic_root': 'quadratic', 'actual_background_even_profile': 'picard',
            'actual_background_picard': 'picard', 'm3_global_pulse_jet': 'm3GlobalPulses',
        }.get(op)
        if group:
            index = -1 - args[0] if op == 'm3_aux_expression_partial' else args[0]
            require(type(index) is int and index >= 0, 'Invalid registry index')
            return group + ':' + str(index), registries[group][index]
        group_number = {'m3_coupled_expression_partial': 0, 'm3_coupled_indexed_partial': 1,
                        'm3_coupled_inverse_partial': 2, 'm3_forced_pulse_partial': 3,
                        'm3_forced_expression_partial': 4}[op]
        index = args[0] if op == 'm3_forced_pulse_partial' else int(args[0].split(':')[-1])
        require(type(index) is int and index >= 0, 'Invalid extended registry index')
        return f'definitions:{group_number}:{index}', registries['definitions'][group_number][index]
    except (KeyError, IndexError, TypeError) as error:
        raise ValueError('Missing native registry for ' + op) from error


def argument_children(node):
    """Actual syntactic operands only; native bodies remain explicit boundaries."""
    op, args = node['op'], node['args']
    if op in LEAVES:
        return []
    if op in UNARY:
        return args[:1]
    if op in {'add', 'multiply', 'maximum', 'smooth_piecewise', 'definite_integral'}:
        return args
    if op in CALLS:
        return args[1]
    if op == 'actual_natural_series':
        return args[1:3]
    if op == 'actual_quadratic_root':
        return args[2:3]
    if op == 'actual_monotone_root':
        return args[1:]
    if op in {'actual_background_even_profile', 'actual_background_picard'}:
        return args[2:4]
    if op == 'actual_covariance_volterra':
        return [args[2], *args[3]]
    if op == 'm3_global_pulse_jet':
        return [args[2], *args[3]]
    if op == 'm3_forced_pulse_partial':
        return [args[3], *args[4]]
    raise ValueError('Unknown source operation ' + op)


def conservative_capture(get_node, registries, root, *, node_count=SOURCE_NODES, max_nodes=2000000):
    seen, definitions, operations = set(), {}, Counter()
    stack = [root]
    while stack:
        ident = stack.pop()
        if ident in seen:
            continue
        require(type(ident) is int and 0 <= ident < node_count, 'Invalid source node reference')
        require(len(seen) < max_nodes, 'Conservative capture budget exhausted')
        seen.add(ident)
        node = get_node(ident)
        op = node['op']
        operations[op] += 1
        require(op in ORDINARY | NATIVE, 'Unknown source operation ' + op)
        if op in NATIVE:
            key, definition = native_definition(node, registries)
            if key not in definitions:
                definitions[key] = definition
                stack.extend(integer_superset(definition, node_count))
            # Deliberately retain metadata integers, as in the original audit.
            stack.extend(integer_superset(node['args'], node_count))
        else:
            stack.extend(argument_children(node))
    return seen, definitions, dict(sorted(operations.items()))


def argument_graph(get_node, registries, roots, *, max_nodes=200000):
    nodes, boundaries, domains = {}, {}, []
    stack = list(roots)
    while stack:
        ident = stack.pop()
        if ident in nodes:
            continue
        require(len(nodes) < max_nodes, 'Argument graph budget exhausted')
        node = get_node(ident)
        nodes[ident] = node
        if node['op'] in NATIVE:
            key, definition = native_definition(node, registries)
            boundaries[ident] = {'registry': key, 'definitionSHA256': sha(definition),
                                 'nativeDefinednessProved': False}
        if node['op'] in {'inverse', 'sqrt_positive', 'log_positive'}:
            domains.append({'source': ident, 'operation': node['op'], 'argument': node['args'][0],
                            'domainProved': False})
        if node['op'] == 'integer_power' and node['args'][1] < 0:
            domains.append({'source': ident, 'operation': 'negative_integer_power',
                            'argument': node['args'][0], 'domainProved': False})
        stack.extend(argument_children(node))
    return nodes, boundaries, domains


def syntactic_coordinates(get_node, root):
    """Free syntactic argument coordinates; native hidden captures are not erased."""
    memo, visiting = {}, set()
    def at(ident):
        if ident in memo:
            return memo[ident]
        require(ident not in visiting, 'Cyclic source argument graph')
        visiting.add(ident)
        node = get_node(ident)
        if node['op'] == 'coordinate':
            result = {ident}
        elif node['op'] == 'definite_integral':
            body, binder, left, right = node['args']
            result = (at(body) - {binder}) | at(left) | at(right)
        else:
            result = set()
            for child in argument_children(node):
                result.update(at(child))
        visiting.remove(ident)
        memo[ident] = result
        return result
    return sorted(at(root))


def nearest_contexts(get_node, parents, root, *, max_nodes=100000):
    """All nearest syntactic context surfaces; one exact path per surface edge.

    Does not inline native parameter substitutions or infer branch activity.
    A native call argument is an explicit stopping surface with its tuple.
    """
    seen, results, paths = {root}, [], {root: [root]}
    todo = deque([root])
    while todo:
        child = todo.popleft()
        for parent in sorted(parents.get(child, ())):
            node = get_node(parent)
            op, args = node['op'], node['args']
            if op in NATIVE or op in {'smooth_piecewise', 'definite_integral'}:
                positions = [i for i, value in enumerate(args) if type(value) is int and value == child]
                record = {'surface': parent, 'operation': op, 'path': paths[child] + [parent],
                          'directArgumentPositions': positions, 'activeContextProved': False}
                if op == 'smooth_piecewise':
                    record['piecewiseRoles'] = [
                        ('selector', 'leftEndpoint', 'rightEndpoint', 'outsideLeft', 'inside', 'outsideRight')[i]
                        for i in positions
                    ]
                if op == 'definite_integral':
                    record['binder'] = args[1]
                    record['endpoints'] = args[2:4]
                results.append(record)
            elif parent not in seen:
                require(len(seen) < max_nodes, 'Context walk budget exhausted')
                seen.add(parent)
                paths[parent] = paths[child] + [parent]
                todo.append(parent)
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--stage3', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    require(hashlib.sha256(args.stage3.read_bytes()).hexdigest() == STAGE3_PIN,
            'Changed pinned inherited Stage 3 verifier')
    spec = importlib.util.spec_from_file_location('pinned_native_domain_stage3', args.stage3)
    v3 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(v3)
    from header_binding import bind_header_to_gzip
    _, binding_before = bind_header_to_gzip(args.source / 'original-parent.ndjson.gz', args.source / 'header.json')
    args.out.mkdir(parents=True, exist_ok=True)
    header, authentication = v3.prepare_source(args.source / 'original-parent.ndjson.gz', args.out / 'native-source-cache.sqlite')
    _, binding_after = bind_header_to_gzip(args.source / 'original-parent.ndjson.gz', args.source / 'header.json')
    require(binding_before == binding_after, 'Header changed during whole-source authentication')
    registries = v3.registries(header)
    get_node = v3.Source(args.out / 'native-source-cache.sqlite')
    target = registries['expressionDefinitions'][21]
    require(target['body'] == G_ROOT and target['parameters'] == G_PARAMETERS, 'Changed complete_gr target')
    seen, definitions, operations = conservative_capture(get_node, registries, G_ROOT)
    require(len(seen) == 136186 and len(definitions) == 84, 'Original conservative complete_gr closure changed')
    natural_ids = sorted(ident for ident in seen if get_node(ident)['op'] == 'actual_natural_series')
    require(len(natural_ids) == 533, 'Original natural call inventory changed')
    parents = defaultdict(set)
    definition_calls = defaultdict(list)
    for ident in sorted(seen):
        node = get_node(ident)
        for child in argument_children(node):
            parents[child].add(ident)
        if node['op'] in NATIVE:
            key, _ = native_definition(node, registries)
            definition_calls[key].append(ident)
    argument_roots = set()
    calls, context_paths, context_surfaces = [], set(), set()
    for ident in natural_ids:
        node = get_node(ident)
        component, y, eta, radial_order, eta_order = node['args']
        require(component in {'Phi', 'u', 'average'} and type(radial_order) is int and type(eta_order) is int,
                'Malformed original natural call tuple')
        argument_roots.update((y, eta))
        contexts = nearest_contexts(get_node, parents, ident)
        for context in contexts:
            context_paths.update(context['path'])
            context_surfaces.add(context['surface'])
            # Include exact selector/binder/endpoints as diagnostic roots too.
            surface = get_node(context['surface'])
            if surface['op'] == 'smooth_piecewise':
                argument_roots.update(surface['args'][:3])
            elif surface['op'] == 'definite_integral':
                argument_roots.update(surface['args'][1:4])
        calls.append({'id': ident, 'node': node, 'nodeSHA256': sha(node), 'component': component,
                      'Y': y, 'eta': eta, 'radialOrder': radial_order, 'etaOrder': eta_order,
                      'YArgumentCoordinates': syntactic_coordinates(get_node, y),
                      'etaArgumentCoordinates': syntactic_coordinates(get_node, eta),
                      'coordinateScope': 'Syntactic arguments only; native hidden captures require their registry domain proof.',
                      'nearestSyntacticContexts': contexts, 'actualEvaluationDomainProved': False})
    picard = {key: definition for key, definition in definitions.items() if key.startswith('picard:')}
    picard_roots = {key: sorted(set(integer_superset(definition))) for key, definition in picard.items()}
    for roots in picard_roots.values():
        argument_roots.update(roots)
    graph, boundaries, domains = argument_graph(get_node, registries, argument_roots)
    for ident in context_paths:
        graph.setdefault(ident, get_node(ident))
    full_payloads = {'fixed': registries['fixed'], **picard}
    result = {
        'schema': 'MathScope.N6.NaturalNativeDomainDiagnostics/1',
        'sourceAuthentication': authentication, 'headerBinding': binding_after, 'stage3ModuleSHA256': STAGE3_PIN,
        'sourceProducerExecuted': False, 'target': {'registry': 'expressionDefinitions:21', 'definition': target, 'sha256': sha(target)},
        'conservativeCapture': {'sourceNodes': len(seen), 'sourceIdSetSHA256': sha(sorted(seen)),
                                'registryDefinitions': len(definitions), 'operationCounts': operations,
                                'includesMetadataOverreads': True, 'isMinimalSemanticDependencyGraph': False},
        'naturalCalls': calls,
        'fullNativePayloads': full_payloads,
        'fullNativePayloadSHA256': {key: sha(value) for key, value in full_payloads.items()},
        'allReachedRegistryInventory': [{'key': key, 'sha256': sha(definition),
                                         'nativeCallIDs': definition_calls[key]}
                                        for key, definition in sorted(definitions.items())],
        'picardPayloadOperandRootSupersets': picard_roots,
        'argumentRoots': sorted(argument_roots),
        'argumentAndContextGraph': {str(ident): node for ident, node in sorted(graph.items())},
        'nativeArgumentBoundaries': {str(ident): row for ident, row in sorted(boundaries.items())},
        'primitiveDefinednessPrerequisites': domains,
        'contextScope': 'Nearest syntactic lazy-piecewise/integral/native-call surfaces; no native parameter substitution, branch activation, actual Y/eta bound, or integrability proof is inferred.',
        'argumentGraphScope': 'Complete ordinary and actual-argument subgraphs for listed roots; native defining bodies are explicit unresolved boundaries, not truncated ordinary graphs.',
        'newDischarged': 0, 'allOriginalDomainPremisesProved': False,
    }
    path = args.out / 'NATIVE_DOMAIN_DIAGNOSTICS.json'
    write(path, result)
    summary = {'schema': 'MathScope.N6.NaturalDomainExtractReceipt/1', 'output': path.name,
               'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
               'sourceCaptureNodes': len(seen), 'naturalCalls': len(calls), 'argumentAndContextNodes': len(graph),
               'contextSurfaces': len(context_surfaces), 'fullFixedBytes': len(canonical(registries['fixed'])),
               'fullPicardDefinitions': len(picard), 'newDischarged': 0}
    write(args.out / 'NATIVE_DOMAIN_EXTRACT_RECEIPT.json', summary)
    print(json.dumps(summary))


if __name__ == '__main__':
    main()
