#!/usr/bin/env python3
"""Audit binder shape and explicit formal tuples in the recovered raw closure.

Uses the parent's fresh full-stream recovery receipt; does not independently
re-authenticate the full gzip. No source producer or numeric kernel is run.
"""
import collections
import hashlib
import importlib.util
import json
from pathlib import Path

from scoped_bindings import BindingAdapter, EXPRESSION_OPS, Scope, ScopedRef

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
HEADER = ROOT / 'work/recovery_git/recovered/runtime/source/header.json'
EXPORT = OUT.parent / 'evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json'
HELPER = ROOT / 'recovered/base/analysis/base/PR30-recovery-handoff/MathScopeCompute/tools/n6-native-domain-frontier-20261015/native_domain_extract.py'
HEADER_PIN = 'f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'
HELPER_PIN = '566e1a18b5417cafecf9fe7a4cd2e38d1e270c0cc29c1d984448a579a2a92f9d'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    assert sha(HEADER) == HEADER_PIN
    assert sha(HELPER) == HELPER_PIN
    header, export = json.loads(HEADER.read_bytes()), json.loads(EXPORT.read_bytes())
    assert export['source_header_sha256'] == HEADER_PIN
    spec = importlib.util.spec_from_file_location('reviewed_native_helper', HELPER)
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    registries = {}

    def collect(definitions):
        for key, value in definitions.items():
            if key == 'base':
                collect(value)
            elif type(value) is str:
                try:
                    registries[key] = json.loads(value)
                except ValueError:
                    pass

    collect(header['definitions'])
    records = export['records']

    def get_node(root):
        # The exact export is the complete replay input. A missing node is an
        # error, never a request for an external cache or substitute record.
        return records[str(root)]

    adapter = BindingAdapter(get_node)
    free_memo = {}

    def free_coordinates(root):
        stack = [(root, False)]
        visiting = set()
        while stack:
            ident, ready = stack.pop()
            if ident in free_memo:
                continue
            node = get_node(ident)
            op, args = node['op'], node['args']
            children = [args[0], args[2], args[3]] if op == 'definite_integral' else helper.argument_children(node)
            if ready:
                if op == 'coordinate':
                    result = {ident}
                elif op == 'definite_integral':
                    result = (free_memo[args[0]] - {args[1]}) | free_memo[args[2]] | free_memo[args[3]]
                else:
                    result = set().union(*(free_memo[child] for child in children))
                free_memo[ident] = frozenset(result)
                visiting.remove(ident)
            else:
                if ident in visiting:
                    raise ValueError('Cyclic source argument graph')
                visiting.add(ident)
                stack.append((ident, True))
                stack.extend((child, False) for child in children if child not in free_memo)
        return free_memo[root]

    integrals, expression_calls, definitions, operations = [], [], {}, collections.Counter()
    caller = Scope()
    for text_id, node in records.items():
        root, op = int(text_id), node['op']
        if op == 'definite_integral':
            plan = adapter.integral(ScopedRef(root, caller))
            integrals.append({'root': root, 'body': plan.body_root, 'binder': plan.binder,
                              'left': plan.left.root, 'right': plan.right.root})
        elif op in EXPRESSION_OPS:
            key, definition = helper.native_definition(node, registries)
            maximum = None
            if op == 'm3_aux_expression_partial':
                maximum = header['definitions']['base']['maximumOrder']
            elif op in {'m3_coupled_expression_partial', 'm3_forced_expression_partial'}:
                maximum = header['definitions']['maximumOrder']
            plan = adapter.expression(ScopedRef(root, caller), key, definition, maximum_total_order=maximum)
            assert export['native_calls'][text_id]['definition_sha256'] == plan.definition_sha256
            operations[op] += 1
            expression_calls.append({'root': root, 'registry': key, 'orders': list(plan.orders),
                                     'formal_body': plan.formal_body,
                                     'derivative_materializer_required': plan.materialization_required})
            if key not in definitions:
                free = free_coordinates(plan.formal_body)
                undeclared = sorted(free - set(plan.parameters))
                assert not undeclared, f'Undeclared formal body capture {key}: {undeclared}'
                definitions[key] = {'definition_sha256': plan.definition_sha256,
                                    'formal_body': plan.formal_body, 'parameters': list(plan.parameters),
                                    'syntactic_free_coordinates': sorted(free),
                                    'undeclared_syntactic_coordinates': undeclared,
                                    'derivative_limits': list(plan.derivative_limits),
                                    'maximum_total_order': maximum}

    source_dir = ROOT / 'recovered/base/work/n602_continuation/source/research-ide'
    source_paths = [
        source_dir / 'mathscope-m2/navier/actual-continuation-exact-functions.mjs',
        source_dir / 'mathscope-m2/navier/actual-residual-order-induction-expressions.mjs',
        source_dir / 'mathscope-m3/navier/source-auxiliary-expressions.mjs',
        source_dir / 'mathscope-m3/navier/source-coupled-expressions.mjs',
        source_dir / 'mathscope-m3/navier/source-forced-pulse.mjs',
    ]
    report = {'schema': 'MathScope.ScalarLexicalBindingReview/1',
              'input_export': str(EXPORT.relative_to(ROOT)), 'input_export_sha256': sha(EXPORT),
              'source_header_sha256': HEADER_PIN, 'native_resolver_sha256': HELPER_PIN,
              'source_authentication_inherited_from_recovery': True,
              'original_source_producer_executed': False,
              'review_source_pins': {str(path.relative_to(ROOT)): sha(path) for path in source_paths},
              'raw_closure_records': len(records), 'integral_count': len(integrals),
              'distinct_integral_binders': len({row['binder'] for row in integrals}),
              'integral_binders_are_coordinates': True,
              'expression_call_count': len(expression_calls), 'expression_operations': dict(operations),
              'expression_definitions_checked': len(definitions),
              'zero_order_expression_calls': sum(not row['derivative_materializer_required'] for row in expression_calls),
              'nonzero_order_expression_calls': sum(row['derivative_materializer_required'] for row in expression_calls),
              'complete_argument_order_tuples_checked': True,
              'declared_formal_derivative_limits_checked': True,
              'facade_total_derivative_limits_checked': True,
              'undeclared_syntactic_body_coordinates': [],
              'source_lookup': 'exact_export_only; missing source record fails closed',
              'sqlite_cache_required': False,
              'extra_source_records_loaded_for_formals': 0,
              'free_coordinate_audit_scope': 'Syntactic operands with integral lexical scope; native kernels remain opaque boundaries. This is not native definedness, active branch, or numerical closure evidence.',
              'source_semantics': {'integral_tuple': ['body', 'binder', 'left', 'right'],
                                   'binder_scopes': 'body only; both endpoints keep incoming environment',
                                   'expression_order': 'differentiate retained formal body, then complete simultaneous substitution',
                                   'formal_environment': 'only explicit formals; actual argument closures retain caller environment'},
              'definitions': definitions, 'integrals': integrals, 'expression_calls': expression_calls,
              'adapter_code_sha256': sha(OUT / 'scoped_bindings.py'),
              'audit_code_sha256': sha(Path(__file__)),
              'scalar_numeric_evaluation_complete': False, 'final_field_evaluator_complete': False,
              'N706_closed': False, 'N805_closed': False}
    (OUT / 'ACTUAL_BINDING_REVIEW.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in [
        'integral_count', 'distinct_integral_binders', 'expression_call_count', 'expression_definitions_checked',
        'zero_order_expression_calls', 'nonzero_order_expression_calls', 'extra_source_records_loaded_for_formals',
        'scalar_numeric_evaluation_complete']}))


if __name__ == '__main__':
    main()
