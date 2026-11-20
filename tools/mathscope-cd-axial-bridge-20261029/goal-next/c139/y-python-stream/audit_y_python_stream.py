"""Independent Python integer-only audit of actual live Y AST ingress."""
import argparse
from collections import Counter
from functools import lru_cache
import gzip
import hashlib
import json
from pathlib import Path


STREAM = '7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2'
MANIFEST = '04351d6619a0d782ac108f231efc67ffbd35c2f88e7951f2b1b14445a8ca59a2'
REGISTRY = '62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce'
EXPANDED = '797b0331d34b8e1011c7e5c0e993e3cd2e0fdc864b410085c69c126e14b971b7'
COUNT = 22380596


def pinned(file, expected):
    raw = file.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == expected, file
    return json.loads(raw)


def roots(*values):
    for value in values:
        if isinstance(value, list):
            yield from roots(*value)
        else:
            assert type(value) is int and 0 <= value < COUNT, value
            yield value


def direct(op, args):
    if op in {'rational','coordinate','source_parameter'}:
        return []
    if op in {'add','multiply','smooth_piecewise','maximum'}:
        return args
    if op in {'inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling',
              'integer_power','source_step_derivative'}:
        return args[:1]
    if op == 'definite_integral':
        return [args[0],args[2],args[3]]
    if op == 'actual_natural_series':
        return args[1:3]
    if op == 'actual_background_even_profile':
        return args[2:4]
    if op == 'actual_quadratic_root':
        return args[2:3]
    if op == 'actual_monotone_root':
        return args[1:]
    if op == 'actual_covariance_volterra':
        return [args[2],*args[3]]
    if op == 'm3_forced_pulse_partial':
        return [args[3],*args[4]]
    if op.endswith('_partial'):
        assert len(args) == 3
        return args[1]
    raise AssertionError((op,args))


def native_reader(snapshot):
    aux = snapshot['base']
    base = aux['base']
    cx = json.loads(snapshot['definitions'])
    assert [len(a) for a in cx] == snapshot['counts'] == [2269,29,2,60,0]
    base_expr = json.loads(base['expression'])
    base_fields = json.loads(base['m3GlobalFields'])
    auxiliary_expr = json.loads(aux['expressionDefinitions'])
    auxiliary_fields = json.loads(aux['fieldDefinitions'])
    auxiliary_inv = json.loads(aux['inverseDefinitions'])
    monotones = json.loads(base['monotone'])
    quadratic = json.loads(base['quadratic'])
    picard = json.loads(base['picard'])
    covariance = {}
    for pulse in json.loads(base['m3GlobalPulses']):
        original = json.loads(pulse['originalDefinition'])
        for key in ('variable','parameters','matrix','initial','length'):
            assert pulse[key] == original[key]
        assert pulse['covariance'] not in covariance
        covariance[pulse['covariance']] = original

    def owner(rows, ident, prefix):
        name, index = ident.split(':')
        assert name == prefix
        row = rows[int(index)]
        assert row['id'] == ident
        return row

    def expr(ident):
        if type(ident) is str:
            return owner(cx[0],ident,'coupled-expression')
        return base_expr[ident] if ident>=0 else auxiliary_expr[-1-ident]

    def field(kind,ident):
        if kind == 'm3_global_indexed_partial':
            return base_fields[ident]
        if kind == 'm3_aux_indexed_partial':
            return auxiliary_fields[ident]
        return owner(cx[1],ident,'coupled-field')

    @lru_cache(None)
    def entry(kind, ident):
        if kind in {'actual_expression_partial','m3_coupled_expression_partial','m3_aux_expression_partial'}:
            values = [expr(ident)['body']]
        elif kind.endswith('_indexed_partial'):
            d = field(kind,ident)
            values = [d['parameters'],d['directions']]
            for row in d['rows']:
                if 'localSystem' in row:
                    assert expr(row['localSystem'])['body']==row['localBody']
                values.extend([row['localBody'],row['coefficient'],row['values'],
                               row.get('localParameters',[]),row.get('guards',[]),row.get('derivativeScales',[])])
                values.extend(q['coefficient'] for terms in row.get('derivativeMaps',[]) for q in terms)
                values.extend(row['label'][key] for key in ('Q','ell','grid') if key in row.get('label',{}))
        elif kind == 'm3_aux_inverse_partial':
            values = [auxiliary_inv[ident]['body']]
        elif kind == 'm3_coupled_inverse_partial':
            values = [owner(cx[2],ident,'coupled-inverse')['body']]
        elif kind == 'm3_forced_pulse_partial':
            d = cx[3][ident]
            assert d['id']==ident
            values = [d['variable'],d['parameters'],d['length'],d['matrix']]
            values.extend([z['real'],z['imaginary']] for z in d['forcing'])
        elif kind == 'actual_covariance_volterra':
            d = covariance[ident]
            values = [d[k] for k in ('variable','parameters','matrix','normUpper','length','initial')]
        elif kind == 'actual_monotone_root':
            d = monotones[ident]
            values = [d[k] for k in ('variable','parameters','body','left','right','derivativeLower','derivativeUpper')]
        elif kind == 'actual_quadratic_root':
            d = quadratic[ident]
            values = [d[k] for k in ('rhs','linear','quadraticDiagonal','scale')]
        elif kind == 'actual_background_even_profile':
            d = picard[ident]
            values = [d[k] for k in ('xi','eta','A0','A1','forcing')]
        else:
            raise AssertionError((kind,ident))
        return tuple(dict.fromkeys(roots(*values)))

    return entry


def audit(graph, expanded):
    manifest = pinned(graph/'original-source-export-manifest.json',MANIFEST)
    data = pinned(expanded, EXPANDED)
    registry = pinned(graph/'original-source-functions.json',REGISTRY)
    assert manifest['original_root_ids'] == data['roots'] and len(data['roots']) == 1444
    assert manifest['node_count'] == COUNT and manifest['node_stream_sha256'] == STREAM
    assert manifest['definitions_sha256'] == REGISTRY
    nodes = dict(data['nodes'])
    assert len(nodes)==len(data['nodes'])==379603
    native = dict(data['sourceBodies'])
    entry = native_reader(registry)

    h = hashlib.sha256()
    natural_count = byte_count = selected = 0
    with gzip.open(graph/'original-source-nodes.jsonl.gz','rb') as f:
        header = f.readline()
        assert json.loads(header)['node_count'] == COUNT
        h.update(header)
        byte_count += len(header)
        for i, line in enumerate(f):
            h.update(line)
            byte_count += len(line)
            if b'"op":"actual_natural_series"' in line:
                natural_count += 1
            if i in nodes:
                assert json.loads(line) == nodes[i], i
                selected += 1
    assert i+1 == COUNT and byte_count == manifest['node_stream_uncompressed_bytes']
    assert h.hexdigest() == STREAM and natural_count == 3268
    assert selected == len(nodes)

    seen = set(data['roots'])
    queue = list(seen)
    calls, op_counts = set(), Counter()
    for i in queue:
        node = nodes[i]
        op,args = node['op'],node['args']
        ch = direct(op,args)
        assert all(type(j) is int and 0 <= j < i for j in ch)
        if op == 'actual_natural_series':
            calls.add(i)
        elif op.startswith(('m3_','actual_')):
            body = entry(op,args[0])
            assert set(body) == set(native[i]), (i,op)
            op_counts[op] += 1
            ch = [*ch,*body]
        for j in ch:
            if j not in seen:
                seen.add(j)
                queue.append(j)
    assert len(seen) == len(nodes) and len(op_counts) == 13
    assert calls == {x['id'] for x in data['calls']} and len(calls)==567
    assert sum(op_counts.values()) == len(native)
    return {
        'schema':'MathScope.Y.IndependentPythonActiveRepeatSourceReplay/1',
        'status':'VERIFIED_PYTHON_INTEGER_STREAM_AND_TYPED_INGRESS',
        'streamSHA256':STREAM,'registrySHA256':REGISTRY,'expandedInputSHA256':EXPANDED,
        'allOriginalNodes':COUNT,'allRawLiteralYNodes':natural_count,
        'verifiedReachableRecords':selected,'rootCount':len(data['roots']),
        'reachedLiteralCalls':len(calls),'typedNativeOperations':dict(sorted(op_counts.items())),
        'scope':'Original C132 live active Repeat graph and exact inputs of separate conditional Y obligation transport.',
        'finalJets':0,'release':'HOLD'
    }


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('graph','expanded','out'):
        p.add_argument(name,type=Path)
    a=p.parse_args()
    result=audit(a.graph,a.expanded)
    a.out.write_bytes((json.dumps(result,indent=2,sort_keys=True)+'\n').encode())
