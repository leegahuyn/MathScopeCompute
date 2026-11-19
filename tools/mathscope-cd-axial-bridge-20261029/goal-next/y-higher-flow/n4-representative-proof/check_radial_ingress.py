"""Original lexical radial binders and exact selected representative slice.

No numeric inverse is evaluated. Each scope fact is intersected over all paths.
"""
import argparse
from collections import defaultdict, deque
import hashlib
import json
from pathlib import Path
import sys

p = argparse.ArgumentParser()
for name in ('reached', 'registry', 'helper', 'outer', 'closure', 'output', 'slice'):
    p.add_argument(name, type=Path)
p.add_argument('--drop-binders', action='store_true')
a = p.parse_args()


def pinned(path, digest):
    b = path.read_bytes()
    assert hashlib.sha256(b).hexdigest() == digest, path
    return json.loads(b)


d = pinned(a.reached, '1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc')
r = pinned(a.registry, '049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad')
assert hashlib.sha256(a.helper.read_bytes()).hexdigest() == '37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758'
sys.path.insert(0, str(a.helper.parent))
from native_reference_scopes import actual_children, native_scope_checks
outer = pinned(a.outer, 'c27b0f662c8404be98c7e2427fb1809fcdc06c6cd67a09f19adb603629a4c7fd')
closure = pinned(a.closure, 'ffb665bd31b95354179440012e36d31fdf9a4c31870e99ca3de498a50174782f')
n, bodies = dict(d['nodes']), dict(d['sourceBodies'])
gates = set(closure['physicalGates'] + closure['selectorGates'] + closure['pressureGates'])
R, Z, T = 4587636, 4587637, 4587638
scope = native_scope_checks(d, {'base': r, 'definitions': '[[],[],[],[],[]]'}, gates,
                            extra_reference_ids=(R, Z, T, 4587641, 4587642, 4587643,
                                                 4587625, 4588772, 4588773, 4588774))
frames = [v for v in scope['reboundNativeFrames'] if set(v['mapping']) == {R}]
assert sorted(v['call'] for v in frames) == sorted(outer['frameClasses']['radialOnly'])
assert len(frames) == 24
targets = {v['call']: v['mapping'][R] for v in frames}
coords = sorted(set(targets.values()))
assert coords == [4598626, 4607616, 4607813, 4608101]
expr = json.loads(r['base']['expression'])
auxexpr = json.loads(r['expressionDefinitions'])
fields = json.loads(r['fieldDefinitions'])
globalfields = json.loads(r['base']['m3GlobalFields'])
globalpulses = json.loads(r['base']['m3GlobalPulses'])
covariance = {v['covariance']: json.loads(v['originalDefinition']) for v in globalpulses}


def definition(i):
    op, av = n[i]['op'], n[i]['args']
    if op == 'actual_expression_partial':
        return expr[av[0]] if av[0] >= 0 else auxexpr[-1-av[0]]
    if op == 'm3_global_indexed_partial':
        return globalfields[av[0]]
    if op == 'm3_aux_indexed_partial':
        return fields[av[0]]
    if op == 'actual_covariance_volterra':
        return covariance[av[0]]
    if op == 'm3_global_pulse_jet':
        return globalpulses[av[0]]
    raise AssertionError((i, op))


# The fresh integration coordinates must not be shadowed by native formals.
formal_lists = []
def census(value):
    if isinstance(value, str) and value[:1] in ('[', '{'):
        try:
            census(json.loads(value))
        except json.JSONDecodeError:
            pass
    elif isinstance(value, dict):
        for key, item in value.items():
            if key in ('parameters', 'localParameters') and isinstance(item, list):
                assert not set(coords).intersection(item), (key, item)
                formal_lists.append(item)
            census(item)
    elif isinstance(value, list):
        for item in value:
            census(item)
census(r)

integrals = {}
for i, node in n.items():
    if node['op'] == 'definite_integral' and node['args'][1] in coords:
        body, var, lower, upper = node['args']
        assert lower == 4598627 and upper in (4598629, R), (i, node)
        integrals[i] = dict(body=body, coordinate=var, lower=lower, upper=upper)
assert len(integrals) == 9
assert n[4598627] == {'op': 'sqrt_positive', 'args': [3617]}
assert n[3617] == {'op': 'source_parameter', 'args': ['Xa']}
assert n[4598629] == {'op': 'multiply', 'args': [24, 4598628]}
assert n[24] == {'op': 'rational', 'args': ['2', '1']}
assert n[4598628] == {'op': 'sqrt_positive', 'args': [28826]}

edges = {i: [(j, False) for j in actual_children(node) if j in n] +
         [(j, True) for j in bodies.get(i, []) if j in n] for i, node in n.items()}
parents = defaultdict(list)
for i, es in edges.items():
    for child, _ in es:
        parents[child].append(i)
ancestors = set(targets)
q = deque(ancestors)
while q:
    for par in parents[q.popleft()]:
        if par not in ancestors:
            ancestors.add(par)
            q.append(par)
bits = {v: 1 << j for j, v in enumerate(coords)}
known = {i: 0 for i in d['roots'] if i in ancestors}
q = deque(known)
while q:
    i = q.popleft()
    for child, native in edges[i]:
        if child not in ancestors:
            continue
        fact = known[i]
        # Facts are lexical binder memberships, not assumptions about R.
        # The above all-native-formal census prevents binder shadowing.
        if i in integrals and child == integrals[i]['body'] and not a.drop_binders:
            av = n[i]['args']
            assert child not in av[2:]
            fact |= bits[integrals[i]['coordinate']]
        old = known.get(child)
        merged = fact if old is None else old & fact
        if old != merged:
            known[child] = merged
            q.append(child)
rows = []
for i, coord in sorted(targets.items()):
    av = n[i]['args']
    assert n[i]['op'] in ('actual_expression_partial', 'm3_aux_indexed_partial')
    defn = definition(i)
    mapping = dict(zip(defn['parameters'], av[1]))
    assert mapping[R] == coord and mapping[Z] == Z and mapping[T] == T
    assert all(mapping.get(v, v) == v for v in (4587625, 4588772, 4588773, 4588774))
    rows.append(dict(call=i, coordinate=coord, operation=n[i]['op'],
                     positiveIntervalBinderDominates=bool(known.get(i, 0) & bits[coord])))
assert all(v['positiveIntervalBinderDominates'] for v in rows) == (not a.drop_binders)

# Preserve enough original nodes to re-run the PURE original construction,
# including its unused positiveWidth, with the actual arithmetic methods.
inverse_definition = json.loads(r['base']['monotone'])[2]
assert inverse_definition['name'] == 'ActualCommonBandSlowInverse'
assert inverse_definition['parameters'] == [Z, T]
assert [inverse_definition[k] for k in ('body', 'left', 'right')] == [4587653, 19, 24]
assert n[19] == {'op': 'rational', 'args': ['1', '2']}
slice_ids = {i for i in range(4588775, 4588873) if i in n} | {4587653}
q = deque(slice_ids)
while q:
    for j in actual_children(n[q.popleft()]):
        if j not in slice_ids:
            slice_ids.add(j)
            q.append(j)
slice_out = dict(schema='MathScope.OriginalRepresentativeExactSlice/1',
                 sourceReachedSHA256=hashlib.sha256(a.reached.read_bytes()).hexdigest(),
                 nodes=[[i, n[i]] for i in sorted(slice_ids)],
                 boxes=[[4588782, 4588783], [4588784, 4588785], [4588786, 4588787]],
                 constants=dict(Xa=3617, Xb=28826, h=9), inverse=4588852,
                 inverseDefinition=inverse_definition,
                 expectedRoots=dict(R=4588863, Z=4588838, T=4588851,
                                    s=4588852, X=4588867, eta=4588872))
a.slice.write_text(json.dumps(slice_out, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
out = dict(schema='MathScope.Y.OriginalRepresentativeRadialLexicalIngress/1',
           status='NEGATIVE_CONTROL_ALL_24_BINDERS_LOST' if a.drop_binders else 'PASS_24_ORIGINAL_RADIAL_NATIVE_FRAMES',
           targetCount=len(rows), coordinateCount=len(coords), binderCount=len(integrals),
           ancestorCount=len(ancestors), nativeFormalsChecked=len(formal_lists),
           originalRoots=[i for i in d['roots'] if i in ancestors], frames=rows,
           integrals={str(i): v for i, v in sorted(integrals.items())},
           positiveLower='sqrt(Xa)>0 under original Xa>0',
           positiveUpper='2*sqrt(Xb)>0 or admitted physical R>0; orientation irrelevant',
           minimalAlternative='Nonnegative R plus active Xa<X=R^2/(2s), s>0, Xa>0 implies R>0.',
           nativeSwitch='At each call, R maps to the lexically bound radial coordinate; Z,T and fixed labels map identically. Native formals never bind any of the four fresh integral coordinates.',
           theoremStatus='Exact finite source audit, conditional on ordinary real integral/native semantics and original positive parameter/physical premises; not an integral value or all-order theorem.',
           sliceNodeCount=len(slice_ids), release='HOLD')
a.output.write_text(json.dumps(out, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
print(json.dumps({k: out[k] for k in ('status','targetCount','coordinateCount','binderCount','ancestorCount','nativeFormalsChecked','sliceNodeCount')}))
