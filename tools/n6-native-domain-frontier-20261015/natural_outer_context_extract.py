#!/usr/bin/env python3
"""Extend natural-call contexts beyond integral binders using the fresh cache.

Every original operand is retained. Native body-to-call maps are recorded as
maps, never silently applied. The result is diagnostic, not a domain proof.
"""
from __future__ import annotations
import argparse
from collections import defaultdict, deque
import hashlib
import importlib.util
import json
import os
from pathlib import Path

from native_domain_extract import (STAGE3_PIN, G_ROOT, G_PARAMETERS, NATIVE, CALLS,
                                  argument_children, argument_graph, conservative_capture,
                                  native_definition, require, sha, write)


def body_uses(get_node, registries, seen):
    result = defaultdict(list)
    for ident in sorted(seen):
        node = get_node(ident)
        if node['op'] not in NATIVE:
            continue
        key, definition = native_definition(node, registries)
        body = definition.get('body')
        if type(body) is not int:
            continue
        record = {'nativeCallID': ident, 'nativeCall': node, 'registry': key,
                  'definitionSHA256': sha(definition), 'definingBody': body,
                  'formalParameterMapProved': False, 'domainApplicationProved': False}
        parameters = definition.get('parameters')
        if node['op'] in CALLS and isinstance(parameters, list):
            require(len(parameters) == len(node['args'][1]), 'Native function arity changed')
            record['formalParameterMap'] = list(zip(parameters, node['args'][1]))
            record['derivativeOrders'] = node['args'][2]
            record['formalParameterMapProved'] = True
            record['mapScope'] = 'Exact source function-call parameter tuple only; derivative, capture and domain validity remain separate.'
        elif node['op'] == 'actual_monotone_root' and isinstance(parameters, list):
            require(len(parameters) == len(node['args']) - 1, 'Implicit native arity changed')
            record['formalParameterMap'] = list(zip(parameters, node['args'][1:]))
            record['internalRootVariable'] = definition.get('variable')
            record['formalParameterMapProved'] = True
            record['mapScope'] = 'Only explicit root parameters; existence and internal root variable remain unresolved.'
        else:
            record['mapScope'] = 'Native semantics not an ordinary explicit function substitution; exact call tuple retained without inventing a parameter map.'
        result[body].append(record)
    return result


def extend_contexts(get_node, parents, uses, start, *, max_nodes=200000):
    """Cross all intermediate integrals, stop at the next guard/native use.

    All nearest surface edges are retained, with one path per edge. Existing
    function bodies can have several source call sites; all those tuples are
    emitted at a body boundary. No path-condition or parameter-map composition
    is asserted merely from those records.
    """
    seen, paths, results, unattached = {start}, {start: [start]}, [], []
    todo = deque([start])
    while todo:
        child = todo.popleft()
        if child in uses:
            results.append({'kind': 'NATIVE_DEFINING_BODY_USE', 'body': child,
                            'path': paths[child], 'nativeUses': uses[child],
                            'domainApplicationProved': False})
        outgoing = parents.get(child, set())
        if not outgoing and child not in uses:
            unattached.append({'source': child, 'path': paths[child],
                               'reason': 'No ordinary parent or reviewed explicit defining-body use in the conservative g closure.'})
        for parent in sorted(outgoing):
            node = get_node(parent)
            op, args = node['op'], node['args']
            if op == 'smooth_piecewise' or op in NATIVE:
                positions = [i for i, value in enumerate(args) if type(value) is int and value == child]
                record = {'kind': 'LAZY_GUARD' if op == 'smooth_piecewise' else 'NATIVE_ARGUMENT_USE',
                          'surface': parent, 'node': node, 'path': paths[child] + [parent],
                          'directArgumentPositions': positions, 'domainApplicationProved': False}
                if op == 'smooth_piecewise':
                    roles = ('selector', 'leftEndpoint', 'rightEndpoint', 'outsideLeft', 'inside', 'outsideRight')
                    record['piecewiseRoles'] = [roles[i] for i in positions]
                else:
                    record['nativeActualArgumentIndices'] = [i for i, value in enumerate(argument_children(node)) if value == child]
                results.append(record)
            elif parent not in seen:
                require(len(seen) < max_nodes, 'Outer context walk budget exhausted')
                seen.add(parent)
                paths[parent] = paths[child] + [parent]
                todo.append(parent)
    encountered_integrals = sorted(ident for ident in seen if get_node(ident)['op'] == 'definite_integral')
    return {'start': start, 'nextContexts': results, 'unattachedBoundaries': unattached,
            'crossedIntegrals': [{'id': ident, 'node': get_node(ident)} for ident in encountered_integrals],
            'walkNodes': len(seen), 'allOriginalDomainPremisesProved': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-db', type=Path, required=True)
    parser.add_argument('--stage3', type=Path, required=True)
    parser.add_argument('--header', type=Path, required=True)
    parser.add_argument('--domains', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    require(hashlib.sha256(args.stage3.read_bytes()).hexdigest() == STAGE3_PIN, 'Changed inherited Stage 3 module')
    spec = importlib.util.spec_from_file_location('natural_outer_context_pinned_v3', args.stage3)
    v3 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(v3)
    from header_binding import bind_header_to_gzip
    header, binding = bind_header_to_gzip(args.header.parent / 'original-parent.ndjson.gz', args.header)
    domains_raw = args.domains.read_bytes()
    domains = json.loads(domains_raw)
    require(domains['headerBinding'] == binding, 'Changed authenticated domain-extract header binding')
    registries = v3.registries(header)
    target = registries['expressionDefinitions'][21]
    require(target['body'] == G_ROOT and target['parameters'] == G_PARAMETERS, 'Changed original complete_gr definition')
    get_node = v3.Source(args.source_db)
    seen, definitions, operations = conservative_capture(get_node, registries, G_ROOT)
    require(len(seen) == 136186 and len(definitions) == 84, 'Changed original conservative capture')
    require(sha(sorted(seen)) == domains['conservativeCapture']['sourceIdSetSHA256'], 'Capture ID set differs from fresh authenticated domain extraction')
    uses = body_uses(get_node, registries, seen)
    parents = defaultdict(set)
    for ident in sorted(seen):
        for child in argument_children(get_node(ident)):
            parents[child].add(ident)
    starts, members = set(), defaultdict(set)
    for call in domains['naturalCalls']:
        require(sha(get_node(call['id'])) == call['nodeSHA256'], 'Changed original natural call')
        for context in call['nearestSyntacticContexts']:
            if context['operation'] == 'definite_integral':
                starts.add(context['surface'])
                members[context['surface']].add(call['id'])
    extended, relevant_nodes, argument_roots = [], set(), set()
    for start in sorted(starts):
        record = extend_contexts(get_node, parents, uses, start)
        record['naturalCallIDs'] = sorted(members[start])
        for context in record['nextContexts']:
            relevant_nodes.update(context['path'])
            if context['kind'] == 'LAZY_GUARD':
                argument_roots.update(context['node']['args'][:3])
            for native_use in context.get('nativeUses', []):
                relevant_nodes.add(native_use['nativeCallID'])
                argument_roots.update(value for _, value in native_use.get('formalParameterMap', []))
        for boundary in record['unattachedBoundaries']:
            relevant_nodes.update(boundary['path'])
        for integral in record['crossedIntegrals']:
            relevant_nodes.add(integral['id'])
            argument_roots.update(integral['node']['args'][1:4])
        extended.append(record)
    graph, boundaries, primitive_domains = argument_graph(get_node, registries, argument_roots)
    for ident in relevant_nodes:
        graph.setdefault(ident, get_node(ident))
    result = {'schema': 'MathScope.N6.NaturalOuterIntegralContexts/1',
              'sourceExecutionRun': os.environ.get('GITHUB_RUN_ID'),
              'domainsInputSHA256': hashlib.sha256(domains_raw).hexdigest(),
              'sourceAuthentication': domains['sourceAuthentication'], 'headerBinding': binding,
              'stage3ModuleSHA256': STAGE3_PIN, 'sourceProducerExecuted': False,
              'freshCacheAuthority': 'Same-workflow fresh native-source-cache.sqlite; this diagnostic does not independently authenticate arbitrary supplied SQLite files.',
              'conservativeCapture': {'nodes': len(seen), 'registryDefinitions': len(definitions),
                                      'sourceIdSetSHA256': sha(sorted(seen)), 'operationCounts': operations},
              'outerIntegralContexts': extended,
              'ordinaryArgumentAndContextNodes': {str(ident): node for ident, node in sorted(graph.items())},
              'nativeArgumentBoundaries': {str(ident): row for ident, row in sorted(boundaries.items())},
              'primitiveDefinednessPrerequisites': primitive_domains,
              'nativeBodyUseScope': 'Exact explicit parameter tuples for ordinary registered expression functions and monotone root parameters; no omitted substitution is declared valid.',
              'scope': 'Conservative g-closure contexts beyond first integrals. All next ordinary guard edges and reviewed native defining-body call tuples are preserved; execution reachability, branch conditions, native capture and domain proofs remain obligations.',
              'all533NaturalDomainsProved': False, 'newDischarged': 0}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    write(args.out, result)
    print(json.dumps({'output': str(args.out), 'bytes': args.out.stat().st_size, 'firstIntegrals': len(starts),
                      'extendedNodes': len(graph), 'nextContexts': sum(len(x['nextContexts']) for x in extended),
                      'newDischarged': 0}))


if __name__ == '__main__':
    main()
