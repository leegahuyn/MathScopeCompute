"""Bind archived or live stage-one initialized metadata and velocity baselines."""

import argparse
from collections import Counter
from copy import deepcopy
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys


ARCHIVE_GAUGE_SHA = 'c61446ae5c0928c9c5b4a342dffc9403d7aa5b9138209d1edf8bc21623816a6a'
ARCHIVE_MANIFEST_SHA = 'c7adae44498f9705aa7cec4c3b99092c054bd23469701afebbd86470a3adcecc'


def require(test, detail):
    if not test:
        raise ValueError(detail)


def only(items, detail):
    values = list(items)
    require(len(values) == 1, detail)
    return values[0]


def find_field(group, name):
    return only((field for field in group if field['name'] == name), name)


def negative(graph, root):
    args = graph.args(root, 'multiply')
    require(len(args) == 2, 'literal source negation')
    multiplier = only((arg for arg in args if graph.record(arg)['op'] == 'rational'
                       and graph.rational(arg) == -1), 'exact factor -1')
    return other(args, multiplier)


def other(args, term):
    args = list(args)
    require(len(args) == 2 and term in args, 'literal binary source operand')
    args.remove(term)
    return args[0]


def subtract(graph, root):
    args = graph.args(root, 'add')
    choices = []
    for arg in args:
        try:
            choices.append((other(args, arg), negative(graph, arg)))
        except ValueError:
            pass
    return only(choices, 'unique original decrease term')


def field_root(graph, native, root, name):
    node = graph.record(root)
    require(node['op'] in ('m3_aux_indexed_partial', 'm3_coupled_indexed_partial'),
            'actual complete indexed field')
    field, values, orders = native.application(graph, root, name)
    require(values == field['parameters'] and orders == [0] * 6, 'same physical field arguments')
    return field


def coordinate_cover(graph, initial, forced, signed):
    from verify_spatial_structure import arithmetic_terms

    require(initial['parameters'] == forced['parameters'] == signed['parameters']
            and initial['directions'] == forced['directions'] == signed['directions'],
            'same global physical/torus arguments')
    R, Z, T, ell, Y0, Y1, theta = initial['parameters']
    require(initial['directions'] == [R, Z, T, Y0, Y1, theta], 'complete frozen differential chart')
    rows = []
    for old, new, extra in zip(initial['rows'], forced['rows'], signed['rows'], strict=True):
        require(len(old['guards']) == 5, 'five original label guards')
        new_tag, old_tag = new['label'], old['label']
        label = {key: old_tag[key] for key in ('key', 'ell', 'grid', 'sign', 'countBoxOnce')}
        require(old_tag['signIsInsideBox'] is True and label['countBoxOnce'] is True,
                'unique original sign inside the box')
        require(all(new_tag[k] == v for k, v in label.items()) and old['guards'] == new['guards'],
                'same initial/Forced actual label and guard rows')
        require(all(new[k] == extra[k] for k in ('values', 'coefficient', 'derivativeMaps', 'guards', 'label')),
                'same Forced/Signed chart and signs')
        own, *grid = [label['ell'], *label['grid']]
        expected_new = [R, Z, T, own, *grid, ell, Y0, Y1, *new['values'][10:14],
                        theta, new_tag['fixedDifference']]
        require(len(new['values']) == 16 and new['values'] == expected_new
                and graph.rational(new['coefficient']) == 1, 'frozen coupled chart slots')
        require(len(old['values']) == 10 and old['values'][3:7] == [own, *grid]
                and old['values'][-1] == theta, 'frozen original auxiliary chart slots')

        # Read old multipliers from the literal shifted slow arguments.
        sr, sz, st = (other(graph.args(arg, 'multiply'), x)
                      for x, arg in zip((R, Z, T), old['values'][:3], strict=True))
        require(graph.args(sr, 'sqrt_positive') == [st], 'original radial scale sqrt(rho)')
        factors = list(graph.args(st, 'multiply'))
        exp = only((x for x in factors if graph.record(x)['op'] == 'exp'), 'positive reference Q')
        [den] = graph.args(other(factors, exp), 'inverse')
        [ref_exp], [own_exp] = graph.args(exp, 'exp'), graph.args(den, 'exp')
        ref_terms = arithmetic_terms(graph, ref_exp, opaque=[ell])
        own_terms = arithmetic_terms(graph, own_exp, opaque=[own])
        [term] = ref_terms
        ln2 = only((x for x in term if x != ell), 'fixed log 2')
        [two] = graph.args(ln2, 'log_positive')
        require(graph.rational(two) == 2 and ref_terms[term] == -1
                and own_terms == {tuple(sorted((ln2, own))): -1}, 'row Qref/Qown original dyadic labels')

        for value, sign in ((sz, -1), (old['coefficient'], 1)):
            [power] = graph.args(value, 'exp')
            terms = arithmetic_terms(graph, power, limit=30)
            la = only({x for term in terms for x in term
                       if graph.record(x)['op'] == 'log_positive'
                       and graph.record(x)['args'] == [st]}, 'same source log(rho)')
            h = only({x for term in terms for x in term
                      if graph.record(x) == {'op': 'source_parameter', 'args': ['h']}}, 'source h')
            require(terms == {(la,): Fraction(1, 2), tuple(sorted((la, h))): sign},
                    'exact original axial or velocity exponent')
        maps = old['derivativeMaps']
        require(maps[:3] == [[{'parameter': j, 'coefficient': q}] for j, q in enumerate((sr, sz, st))]
                and all([x['parameter'] for x in row] == [7, 8] for row in maps[3:5])
                and len(maps[5]) == 1 and maps[5][0]['parameter'] == 9
                and graph.rational(maps[5][0]['coefficient']) == 1,
                'old chain rule uses all six actual derivative columns')
        expected_map = [[{'parameter': j, 'coefficient': new['coefficient']}] for j in (0, 1, 2, 8, 9, 14)]
        require(new['derivativeMaps'] == expected_map, 'source assigns derivatives only to continuous coupled slots')
        rows.append({'label': label, 'guards': old['guards'], 'oldXiV': old['values'][7:9],
                     'coupledCenterAndCopy': new['values'][10:14], 'paletteDifference': new_tag['fixedDifference'],
                     'oldXivDerivativeColumns': maps[3:5]})
    require(len(rows) == 162 and Counter(x['label']['sign'] for x in rows) == {-1: 81, 1: 81}
            and len({(x['label']['key'], x['label']['sign']) for x in rows}) == 162,
            'all initialized 162 distinct rows')
    return rows


def bind(graph, native, initialized, latest, supplied_signed=None):
    rows = None
    wave_lineage = []
    for j, (initial, final) in enumerate(zip(initialized, latest, strict=True)):
        prefix = (f'OriginalAll81InitialAngular_velocity_{j}', f'ActualForcedCurrent_velocity_{j}',
                  f'GenericSigned162_velocity_{j}')
        root = only((x for x in graph.args(initial, 'add')
                     if graph.record(x)['op'] == 'm3_aux_indexed_partial'), 'original initialized wave root')
        base = other(graph.args(initial, 'add'), root)
        initial_field = field_root(graph, native, root, prefix[0])
        mean_change, forced_and_signed = None, None
        for x in graph.args(final, 'add'):
            if supplied_signed is not None and x != supplied_signed[j]:
                continue
            if graph.record(x)['op'] == 'add' and any(
                    graph.record(a)['op'] == 'm3_coupled_indexed_partial'
                    for a in graph.args(x, 'add')):
                require(forced_and_signed is None, 'unique original Signed full field')
                forced_and_signed = x
                mean_change = other(graph.args(final, 'add'), x)
        require(forced_and_signed is not None, 'actual post-Five source predecessor')
        signed_root = only((a for a in graph.args(forced_and_signed, 'add')
                            if graph.record(a)['op'] == 'm3_coupled_indexed_partial'),
                           'actual Signed indexed increment')
        signed_field = field_root(graph, native, signed_root, prefix[2])
        forced_full = other(graph.args(forced_and_signed, 'add'), signed_root)
        forced_root = other(graph.args(forced_full, 'add'), base)
        forced_field = field_root(graph, native, forced_root, prefix[1])
        newest_mean, baseline = subtract(graph, mean_change)
        before_five, temporal, five = None, None, None
        for candidate in graph.args(newest_mean, 'add'):
            if graph.record(candidate)['op'] == 'add' and baseline in graph.args(candidate, 'add'):
                require(before_five is None, 'unique post-Temporal field')
                before_five = candidate
                temporal = other(graph.args(candidate, 'add'), baseline)
                five = other(graph.args(newest_mean, 'add'), candidate)
        require(before_five is not None, 'same mean source baseline cancels exactly')
        component_rows = coordinate_cover(graph, initial_field, forced_field, signed_field)
        require(rows is None or component_rows == rows, 'all three source components use identical charts')
        rows = component_rows
        wave_lineage.append({'initializedWave': root, 'forcedFullWave': forced_root, 'signedWave': signed_root,
                             'temporalIncrement': temporal, 'fiveMapIncrement': five,
                             'sameInitializedFullMean': base, 'cancelledUpdateBaseline': baseline})
    require(len(wave_lineage) == 3, 'all three physical components')
    return {'rows': rows, 'lineage': wave_lineage,
            'checkedRows': 162, 'checkedComponentRows': 486, 'exactMeanCancellations': 6,
            'fixedXiAndVFunctionIdentity': 'OPEN', 'liveGaugeZero': 'OPEN'}


def archive_controls(graph, native, initialized, latest):
    initial = find_field(native.aux_fields, 'OriginalAll81InitialAngular_velocity_0')
    forced = find_field(native.fields, 'ActualForcedCurrent_velocity_0')
    signed = find_field(native.fields, 'GenericSigned162_velocity_0')
    controls = []

    def rejected(name, call):
        try:
            call()
        except ValueError:
            controls.append(name)
        else:
            raise ValueError('negative control passed: ' + name)

    wrong = deepcopy(initial)
    wrong['rows'][0]['label']['sign'] *= -1
    rejected('wrongInitialSign', lambda: coordinate_cover(graph, wrong, forced, signed))
    wrong = deepcopy(initial)
    wrong['rows'][0]['guards'][0][1] = wrong['rows'][0]['guards'][0][2]
    rejected('wrongGuardEndpoint', lambda: coordinate_cover(graph, wrong, forced, signed))
    wrong = deepcopy(initial)
    wrong['rows'][0]['derivativeMaps'][0] = wrong['rows'][0]['derivativeMaps'][1]
    rejected('wrongReferenceChainColumn', lambda: coordinate_cover(graph, wrong, forced, signed))
    rejected('wrongVelocityBaseline', lambda: bind(graph, native, initialized[::-1], latest))
    return controls


def load_metadata(path, expected=None):
    raw = path.read_bytes()
    pin = sha256(raw).hexdigest()
    require(expected is None or pin == expected, str(path) + ' archive digest')
    return json.loads(raw), pin


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--reader', type=Path, required=True)
    p.add_argument('--source', type=Path, required=True)
    p.add_argument('--archive-gauge', type=Path)
    p.add_argument('--ingress', type=Path)
    p.add_argument('--independent-readback', type=Path)
    p.add_argument('--scratch', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    args = p.parse_args()
    sys.path.insert(0, str(args.reader))
    from source_stream import SourceStream, Native, MANIFEST
    manifest, manifest_pin = load_metadata(args.source / MANIFEST)
    host = None
    if args.archive_gauge:
        require(args.ingress is None and args.independent_readback is None, 'archive mode')
        data, pin = load_metadata(args.archive_gauge, ARCHIVE_GAUGE_SHA)
        require(manifest_pin == ARCHIVE_MANIFEST_SHA and manifest['node_count'] == 4_456_994
                and data['graphSHA256'] == manifest['node_stream_sha256']
                and data['registrySHA256'] == manifest['definitions_sha256']
                and data['sourceCommit'] == manifest['executing_commit'],
                'same genuine N1 graph and gauge provenance')
        initialized, latest = data['authenticatedJ0VelocityRoots'], data['actualPostFiveVelocityRoots']
        prefix = manifest['node_count']
        mode = 'ARCHIVED_N1'
    else:
        require(args.ingress is not None and args.independent_readback is not None, 'complete live metadata')
        data, pin = load_metadata(args.ingress)
        host, _ = load_metadata(args.independent_readback)
        require(host['status'] == 'VERIFIED_ACTIVE_N3_SPATIAL_SOURCE_STREAM_AND_OPERAND_BINDINGS'
                and host['ingressSHA256'] == pin and host['graphManifestSHA256'] == manifest_pin
                and host['nativeSHA256'] == manifest['definitions_sha256']
                and host['sourceStream']['sha256'] == manifest['node_stream_sha256'],
                'successful independent live source readback')
        initialized, latest = data['input']['initialized'], data['input']['latest']
        prefix = data['originalPrefix']
        mode = 'LIVE_N3'
    native = Native(args.source, manifest)
    with SourceStream(args.source, manifest, prefix, args.scratch) as graph:
        result = bind(graph, native, initialized, latest)
        if mode == 'ARCHIVED_N1':
            result['negativeControls'] = archive_controls(graph, native, initialized, latest)
    proof = {'schema': 'MathScope.N7.InitializedIndexedBaselineBinding/1', 'mode': mode,
             'sourceManifestSHA256': manifest_pin, 'operandReceiptSHA256': pin,
             'sourceStreamSHA256': graph.verify['sha256'], 'sourceNodes': graph.count, **result}
    with args.out.open('xb') as stream:
        stream.write((json.dumps(proof, indent=2) + '\n').encode())
    print(f'PASS {mode} {proof["checkedComponentRows"]} native metadata rows; {proof["exactMeanCancellations"]} exact source baseline cancellations')


if __name__ == '__main__':
    main()
