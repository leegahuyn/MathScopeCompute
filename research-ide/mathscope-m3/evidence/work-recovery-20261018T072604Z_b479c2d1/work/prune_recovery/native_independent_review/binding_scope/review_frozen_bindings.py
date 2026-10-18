#!/usr/bin/env python3
"""Independent frozen-source arity/recipe review; no native producer is run."""
from collections import Counter, defaultdict
from hashlib import sha256
from itertools import product
from math import factorial
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
NATIVE = ROOT / 'work/prune_recovery/native'
HEADER = ROOT / 'work/recovery_git/recovered/runtime/source/header.json'
EXPORT = ROOT / 'work/prune_recovery/scalar/evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json'
HEADER_PIN = 'f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'


def file_pin(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': sha256(path.read_bytes()).hexdigest(),
            'bytes': path.stat().st_size}


def digest(value):
    return sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()


def check(condition, message):
    if not condition:
        raise ValueError(message)


def natural(value):
    check(type(value) is int and value >= 0, 'Expected nonnegative source metadata integer')


def source_id(value):
    natural(value)
    check(value < 3892594, 'Source node ID out of original graph range')


def suffix(value, prefix):
    check(type(value) is str and value.startswith(prefix), 'Wrong source registry namespace')
    text = value[len(prefix):]
    check(text.isdigit() and str(int(text)) == text, 'Noncanonical source registry index')
    return int(text)


def compositions(total, length):
    if length == 0:
        if total == 0:
            yield ()
    elif length == 1:
        yield (total,)
    else:
        for first in range(total + 1):
            for rest in compositions(total - first, length - 1):
                yield (first,) + rest


def multinomial_recipe(maps, orders, length):
    """Closed multinomial coefficients, not repeated derivative construction."""
    factors = []
    for mapping, order in zip(maps, orders):
        terms = []
        for counts in compositions(order, len(mapping)):
            alpha = [0] * length
            nodes = []
            multiplicity = factorial(order)
            zero = False
            for count, term in zip(counts, mapping):
                multiplicity //= factorial(count)
                alpha[term['parameter']] += count
                if count and term['coefficient'] == 0:
                    zero = True
                elif term['coefficient'] != 1:
                    nodes.extend([term['coefficient']] * count)
            if not zero:
                terms.append((tuple(alpha), tuple(sorted(nodes)), multiplicity))
        factors.append(terms)
    expected = defaultdict(int)
    for combination in product(*factors):
        alpha = tuple(sum(part[0][j] for part in combination) for j in range(length))
        nodes = tuple(sorted(node for part in combination for node in part[1]))
        coefficient = 1
        for part in combination:
            coefficient *= part[2]
        expected[alpha, nodes] += coefficient
    return dict(expected)


def main():
    check(file_pin(HEADER)['sha256'] == HEADER_PIN, 'Changed exact original header')
    header = json.loads(HEADER.read_bytes())
    export = json.loads(EXPORT.read_bytes())
    inventory_path = NATIVE / 'evidence/NATIVE_BINDING_INVENTORY.json'
    recipe_path = NATIVE / 'evidence/FINITE_INDEXED_RECIPES.json'
    inventory, packet = json.loads(inventory_path.read_bytes()), json.loads(recipe_path.read_bytes())
    check(export['source_header_sha256'] == HEADER_PIN, 'Export/header mismatch')
    check(inventory['inputs'][1]['sha256'] == file_pin(EXPORT)['sha256'], 'Inventory/export mismatch')
    check(packet['header']['sha256'] == HEADER_PIN, 'Indexed recipe/header mismatch')
    nodes = {int(key): value for key, value in export['records'].items()}
    check(nodes[0] == {'op': 'rational', 'args': ['0', '1']}, 'Source zero ID changed')
    check(nodes[1] == {'op': 'rational', 'args': ['1', '1']}, 'Source one ID changed')
    registry = {}

    def unpack(definitions):
        for key, value in definitions.items():
            if key == 'base':
                unpack(value)
            elif type(value) is str:
                try:
                    registry[key] = json.loads(value)
                except ValueError:
                    pass

    unpack(header['definitions'])
    simple = {'actual_expression_partial': 'expression', 'm3_aux_expression_partial': 'expressionDefinitions',
              'actual_quadratic_root': 'quadratic', 'actual_monotone_root': 'monotone',
              'actual_background_even_profile': 'picard', 'm3_global_indexed_partial': 'm3GlobalFields',
              'm3_aux_indexed_partial': 'fieldDefinitions', 'm3_aux_inverse_partial': 'inverseDefinitions'}
    expressions = {'actual_expression_partial', 'm3_aux_expression_partial', 'm3_coupled_expression_partial'}
    category = {'actual_natural_series': 'natural', 'actual_quadratic_root': 'quadratic',
                'actual_monotone_root': 'monotone', 'actual_background_even_profile': 'Picard',
                'actual_covariance_volterra': 'covariance', 'm3_global_indexed_partial': 'indexed',
                'm3_aux_indexed_partial': 'indexed', 'm3_aux_inverse_partial': 'auxiliary_inverse'}

    def definition(op, args):
        if op == 'actual_natural_series':
            return 'fixed', registry['fixed']
        if op == 'actual_covariance_volterra':
            matches = [item for item in registry['m3GlobalPulses'] if item['covariance'] == args[0]]
            check(len(matches) == 1, 'Covariance definition is not unique')
            return 'covariance:' + str(args[0]), matches[0]
        if op == 'm3_coupled_expression_partial':
            index = suffix(args[0], 'coupled-expression:')
            return f'definitions:0:{index}', registry['definitions'][0][index]
        group = simple[op]
        index = args[0]
        if op == 'm3_aux_expression_partial':
            check(type(index) is int and index < 0, 'Wrong auxiliary expression ID')
            index = -1 - index
        natural(index)
        check(index < len(registry[group]), 'Registry index exceeds exact source table')
        return group + ':' + str(index), registry[group][index]

    def explicit_formals(parameters):
        check(type(parameters) is list and len(set(parameters)) == len(parameters), 'Duplicate/nonlist formals')
        for parameter in parameters:
            source_id(parameter)
            check(nodes[parameter]['op'] == 'coordinate', 'Formal is not a coordinate')

    expected_semantic, expected_expressions = {}, {}
    arities, orders = Counter(), defaultdict(list)
    all_native = [(root, node) for root, node in nodes.items() if node['op'] in category or node['op'] in expressions]
    check(len(all_native) == len(export['native_calls']), 'An exported native operation is unclassified')
    for root, node in all_native:
        op, args = node['op'], node['args']
        key, row = definition(op, args)
        operands = []
        if op in expressions:
            check(len(args) == 3 and len(args[1]) == len(args[2]) == len(row['parameters']), 'Expression arity')
            explicit_formals(row['parameters'])
            check(len(row['derivativeLimits']) == len(args[2]), 'Derivative limit arity')
            for value, limit in zip(args[2], row['derivativeLimits']):
                natural(value); natural(limit); check(value <= limit, 'Formal derivative budget')
            if op != 'actual_expression_partial':
                maximum = header['definitions']['base']['maximumOrder'] if op == 'm3_aux_expression_partial' else header['definitions']['maximumOrder']
                check(sum(args[2]) <= maximum, 'Facade total-order budget')
            operands = args[1]
            expected_expressions[root] = (key, row)
            orders[op].append(sum(args[2]))
        elif op == 'actual_natural_series':
            check(len(args) == 5 and args[0] in {'Phi', 'u', 'average'}, 'Natural call tuple')
            for value in args[3:]: natural(value)
            operands = args[1:3]
        elif op == 'actual_background_even_profile':
            check(len(args) == 6 and type(args[1]) is int and 0 <= args[1] <= 3, 'Even profile tuple')
            for value in args[4:]: natural(value)
            operands = args[2:4]
        elif op == 'actual_quadratic_root':
            check(len(args) == 3 and type(args[1]) is int and 0 <= args[1] < len(row['rhs']), 'Quadratic tuple')
            operands = args[2:3]
        elif op == 'actual_monotone_root':
            explicit_formals(row['parameters'])
            check(len(args) == 1 + len(row['parameters']) and row['variable'] not in row['parameters'], 'Monotone binder/arity')
            operands = args[1:]
        elif op == 'actual_covariance_volterra':
            explicit_formals(row['parameters'])
            check(len(args) == 4 and len(args[3]) == len(row['parameters']) and type(args[1]) is int and 0 <= args[1] < len(row['initial']), 'Covariance tuple')
            operands = [args[2], *args[3]]
        else:
            explicit_formals(row['parameters'])
            check(len(args) == 3 and len(args[1]) == len(row['parameters']) and len(args[2]) == len(row['directions']), 'Indexed/inverse tuple')
            check(len(set(row['directions'])) == len(row['directions']) and all(value in row['parameters'] for value in row['directions']), 'Directions not distinct explicit formals')
            check(row['directionParameterIndices'] == [row['parameters'].index(value) for value in row['directions']], 'Direction index map mismatch')
            for value in args[2]: natural(value)
            if op != 'm3_global_indexed_partial':
                check(sum(args[2]) <= header['definitions']['base']['maximumOrder'], 'Auxiliary total-order budget')
            else:
                # The source constructor allows budgets 2..32; all actual
                # calls have degree <=1, hence fit every permitted budget.
                check(sum(args[2]) <= 2, 'Global order exceeds source constructor minimum')
            operands = args[1]
            orders[op].append(sum(args[2]))
        for operand in operands:
            source_id(operand); check(operand in nodes, 'Actual argument missing from exact export')
        arities[op] += 1
        if op in category:
            expected_semantic[root] = (key, row, category[op])
    reported = {row['node']: row for row in inventory['semanticCalls']}
    check(len(reported) == len(inventory['semanticCalls']) == len(expected_semantic) == 589, 'Semantic coverage/duplicates')
    for root, (key, row, kind) in expected_semantic.items():
        actual = reported[root]
        check(actual['operation'] == nodes[root]['op'] and actual['args'] == nodes[root]['args'], 'Semantic tuple changed')
        check(actual['definition'] == key and actual['definitionSHA256'] == digest(row) and actual['category'] == kind, 'Semantic definition/classification changed')
        expected_role = 'implicit_residual' if kind == 'monotone' else 'inverse_forcing' if kind == 'auxiliary_inverse' else 'no_direct_evaluation_body'
        check(actual['bodyRole'] == expected_role and actual['body'] == row.get('body'), 'Semantic body role mismatch')
    expression_rows = {row['node']: row for row in inventory['expressionCalls']}
    check(len(expression_rows) == len(inventory['expressionCalls']) == len(expected_expressions) == 1013, 'Expression coverage')
    for root, (key, row) in expected_expressions.items():
        actual = expression_rows[root]
        check(actual['definition'] == key and actual['definitionSHA256'] == digest(row), 'Expression definition mismatch')
        check(actual['body'] == row['body'] and actual['parameters'] == row['parameters'] and actual['argumentNodes'] == nodes[root]['args'][1] and actual['orders'] == nodes[root]['args'][2], 'Expression tuple changed')
    nonzero = {root for root in expression_rows if any(nodes[root]['args'][2])}
    check(nonzero == {row['node'] for row in inventory['nonzeroExpressionDerivativeCalls']} and len(nonzero) == 811, 'Derivative request coverage')

    row_roots, map_roots, row_count, derivative_count = set(), set(), 0, 0
    recipe_nodes = {row['node'] for row in packet['recipes']}
    check(recipe_nodes == {root for root, (_, _, kind) in expected_semantic.items() if kind == 'indexed'} and len(recipe_nodes) == len(packet['recipes']) == 34, 'Indexed coverage')
    for recipe in packet['recipes']:
        root = recipe['node']; op = nodes[root]['op']; args = nodes[root]['args']
        _, source = definition(op, args)
        check(recipe['sourceDefinitionSHA256'] == digest(source), 'Indexed definition mismatch')
        check(recipe['outerParameters'] == source['parameters'] and recipe['outerArgumentNodes'] == args[1] and recipe['orders'] == args[2], 'Indexed outer binding changed')
        check(len(recipe['rows']) == recipe['rowCount'] == len(source['rows']), 'Indexed row count changed')
        for index, (actual, source_row) in enumerate(zip(recipe['rows'], source['rows'])):
            system = source_row['localSystem']
            local = registry['expression'][system] if type(system) is int and system >= 0 else registry['expressionDefinitions'][-1-system]
            check(source_row['localBody'] == local['body'] and source_row['localParameters'] == local['parameters'], 'Header local body/formal mismatch')
            check(len(source_row['values']) == len(local['parameters']), 'Local argument arity')
            check(actual['index'] == index and actual['localSystem'] == system and actual['localBody'] == local['body'] and actual['localParameters'] == local['parameters'], 'Recipe local binding mismatch')
            for target, key in [('argumentNodes','values'),('rowCoefficientNode','coefficient'),('guards','guards'),('label','label')]:
                check(actual[target] == source_row.get(key, [] if key == 'guards' else None), 'Recipe row metadata changed')
            mapping = source_row.get('derivativeMaps')
            if mapping is None:
                check(len(set(source_row['localDirectionIndices'])) == 3, 'Non-distinct local global directions')
                mapping = [[{'parameter': j, 'coefficient': c}] for j,c in zip(source_row['localDirectionIndices'],source_row['derivativeScales'])]
            check(len(mapping) == len(args[2]), 'Map direction arity')
            for entries in mapping:
                for entry in entries:
                    natural(entry['parameter']); check(entry['parameter'] < len(local['parameters']), 'Local map parameter index')
                    source_id(entry['coefficient']); map_roots.add(entry['coefficient'])
            for guard in actual['guards']:
                check(type(guard) is list and len(guard) == 3, 'Malformed source guard')
            refs = [local['body'], *local['parameters'], *source_row['values'], source_row['coefficient'], *[v for g in actual['guards'] for v in g]]
            for ref in refs: source_id(ref)
            row_roots.update(refs)
            expected = multinomial_recipe(mapping, args[2], len(local['parameters']))
            reported_derivatives = {}
            for term in actual['derivatives']:
                alpha = term['localOrders']
                check(len(alpha) == len(local['parameters']), 'Local derivative arity')
                check(all(type(n) is int and 0 <= n <= limit for n,limit in zip(alpha,local['derivativeLimits'])), 'Local formal derivative limit')
                if system < 0:
                    check(sum(alpha) <= header['definitions']['base']['maximumOrder'], 'Local facade total derivative limit')
                key = tuple(alpha), tuple(term['coefficientNodeFactors'])
                check(key not in reported_derivatives, 'Duplicate symbolic derivative term')
                reported_derivatives[key] = term['integerMultiplier']
            check(reported_derivatives == expected, 'Multinomial derivative polynomial mismatch')
            row_count += 1; derivative_count += len(reported_derivatives)
    check(row_count == packet['retainedRowCount'] == 5184, 'Declared row total mismatch')
    check(derivative_count == packet['finiteLocalDerivativeRequestCount'] == 6804, 'Declared derivative term count mismatch')
    sources = [HEADER, EXPORT, NATIVE/'code/native_binding.py', inventory_path, recipe_path, Path(__file__)]
    for name in ['source-global-expressions.mjs','source-auxiliary-expressions.mjs','source-coupled-expressions.mjs']:
        sources.append(ROOT/'recovered/base/work/n602_continuation/source/research-ide/mathscope-m3/navier'/name)
    report = {'schema':'MathScope.IndependentFrozenNativeBindingReview/1',
              'status':'PASS_FOR_FROZEN_SOURCE_BINDINGS_AND_SYMBOLIC_RECIPES',
              'input_pins':[file_pin(path) for path in sources],
              'native_source_producer_executed':False,'native_implementation_executed':False,'existing_tests_repeated':False,
              'native_call_count':len(all_native),'semantic_call_count':len(expected_semantic),
              'semantic_categories':dict(Counter(kind for _,_,kind in expected_semantic.values())),
              'body_roles':dict(Counter(row['bodyRole'] for row in inventory['semanticCalls'])),
              'actual_call_arities_checked':dict(arities),
              'maximum_actual_total_derivative_orders':{op:max(values) for op,values in orders.items()},
              'expression_call_count':1013,'nonzero_expression_derivative_calls':811,
              'indexed_recipes':34,'retained_rows':row_count,'symbolic_derivative_terms':derivative_count,
              'independent_derivative_comparison':'Closed multinomial coefficient expansion of each direction map; exact source-node monomials and integer multiplicities compared.',
              'all_source_row_labels_arguments_coefficients_guards_preserved':True,
              'distinct_row_operand_roots':len(row_roots),'row_operand_roots_outside_raw_export':len(row_roots-set(nodes)),
              'distinct_map_coefficient_roots':len(map_roots),'map_coefficient_roots_outside_raw_export':len(map_roots-set(nodes)),
              'missing_row_operand_ids':sorted(row_roots-set(nodes)),
              'scope_limits':['Source authentication is inherited from the pinned scalar recovery; this review checks exact header/export joins.',
                              'Native registry row references are preserved; missing row operands are not evaluated or replaced.',
                              'No local derivatives, active branch domains, affine-chart Jacobians, coefficient constancy, flat joins, PDE/energy values or numeric tails are newly established.',
                              'Global actual derivative degrees are <=1, below every permitted source-constructor minimum budget of 2; no reconstructed generic global maximum is asserted.',
                              'Generic malformed-input API guard gaps are reviewed separately from the valid frozen records.'],
              'scalar_numeric_evaluation_complete':False,'N706_closed':False,'N805_closed':False}
    (OUT/'FROZEN_BINDINGS_REVIEW.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({key:report[key] for key in ['status','native_call_count','semantic_call_count','retained_rows','symbolic_derivative_terms','row_operand_roots_outside_raw_export']}))


if __name__ == '__main__':
    main()
