"""Authenticate and enclose the original #275 terminal integral divided by its tiny factor."""
import argparse
import gzip
import hashlib
import json
from math import factorial
from pathlib import Path

from source_square_step import Q, Interval, bounded_exp, point, round_out, square_step_jet


GRAPH_SHA = 'a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
PROFILE_SHA = 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
SUPPORT_BLOB = '21a4dffe89f77056588fb00f0bac20e6881b8343'
H_MAX = Q(1, 2**64)
NODE_COUNT = 4420257


def require(condition, message):
    if not condition:
        raise ValueError(message)


def authenticate(graph, profile, support):
    h = hashlib.sha256()
    prefix = []
    with gzip.open(graph, 'rb') as source:
        header = source.readline()
        h.update(header)
        count = 0
        for i, line in enumerate(source):
            h.update(line)
            if i <= 275:
                prefix.append(json.loads(line))
            count += 1
    require(count == NODE_COUNT == json.loads(header)['node_count'] and h.hexdigest() == GRAPH_SHA,
            'Wrong original node stream')
    profile_bytes = profile.read_bytes()
    require(hashlib.sha256(profile_bytes).hexdigest() == PROFILE_SHA, 'Wrong pinned parameter source')
    p = json.JSONDecoder().raw_decode(profile_bytes.decode().split('export const PINNED_N3 = ', 1)[1])[0]
    p = p['parametersExactExpressions']
    require(p['h'] == {'exp': {'product': [{'integer': -8002}, {'ref': 'T'}]}}
            and p['T'] == {'sum': [{'exp': {'ref': 'Md'}}, {'integer': 10}]}
            and p['Md'] == {'integer': 1048576} and p['co'] == {'rational': '1/256'},
            'Changed h/co definitions')
    raw = support.read_bytes()
    blob = hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
    require(blob == SUPPORT_BLOB and b'sigma=exp(-1/s^2)/(exp(-1/s^2)+exp(-1/(1-s)^2))' in raw,
            'Changed square-seed source contract')
    expected = {
        1: ('rational', ['1', '1']), 9: ('source_parameter', ['h']),
        14: ('source_parameter', ['co']), 19: ('rational', ['1', '2']),
        20: ('rational', ['-1', '1']), 21: ('multiply', [9, 20]),
        24: ('rational', ['2', '1']), 207: ('add', [1, 21]),
        260: ('multiply', [9, 14]), 261: ('rational', ['3', '1']),
        262: ('coordinate', ['Qterminal$19']), 263: ('multiply', [207, 262]),
        264: ('exp', [263]), 265: ('add', [20, 262]),
        266: ('multiply', [19, 265]), 267: ('source_step_derivative', [266, 1]),
        268: ('multiply', [260, 264]), 269: ('multiply', [267, 268]),
        270: ('multiply', [20, 260]), 271: ('add', [1, 270]),
        272: ('multiply', [24, 271]), 273: ('inverse', [272]),
        274: ('multiply', [269, 273]), 275: ('definite_integral', [274, 262, 1, 261]),
    }
    for i, (op, args) in expected.items():
        require(prefix[i] == {'op': op, 'args': args}, f'Unexpected operand at #{i}')
    return len(expected)


def midpoint_derivatives(order):
    # Independent rational Taylor expansion of logistic(z), z=-(1/2+t)^-2+(1/2-t)^-2.
    z = [Q(4 * 2**n * (n + 1) * (1 - (-1)**n)) for n in range(order + 1)]
    exp_z = [Q(1)]
    for n in range(1, order + 1):
        exp_z.append(sum(k * z[k] * exp_z[n-k] for k in range(1, n+1)) / n)
    sigma = [Q(1, 2)]
    for n in range(1, order + 1):
        sigma.append((exp_z[n] - sum(exp_z[k] * sigma[n-k] for k in range(1, n+1))) / 2)
    return [factorial(n) * sigma[n] for n in range(order + 1)]


def quadrature(cells):
    total = point(0)
    last_t, last_s = Q(0), point(0)
    for i in range(1, cells + 1):
        t = Q(i, cells)
        step = square_step_jet(point(t), 0)
        mass = step - last_s
        mass = Interval(max(Q(0), mass.lo), min(Q(1), mass.hi))
        weight_lo = bounded_exp((1 - H_MAX) * (1 + 2*last_t)).lo
        weight_hi = bounded_exp(1 + 2*t).hi
        total += mass * Interval(weight_lo, weight_hi)
        last_t, last_s = t, step
    return round_out(total)


def outward_decimal(interval, digits=9):
    scale = 10**digits
    lo = (interval.lo * scale).__floor__()
    hi = (interval.hi * scale).__ceil__()
    return [f'{n // scale}.{n % scale:0{digits}d}' for n in (lo, hi)]


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--graph', type=Path, required=True)
    p.add_argument('--profile', type=Path, required=True)
    p.add_argument('--support', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    args = p.parse_args()
    checked = authenticate(args.graph, args.profile, args.support)

    jet_rows = []
    for n, exact in enumerate(midpoint_derivatives(12)):
        box = square_step_jet(point(Q(1, 2)), n)
        require(box.lo <= exact <= box.hi, f'Midpoint derivative {n} outside enclosure')
        for endpoint in (Q(0), Q(1)):
            flat = point(int(n == 0 and endpoint == 1))
            require(square_step_jet(point(endpoint), n) == flat, 'Incorrect flat endpoint')
            edge = Interval(endpoint-Q(1, 32), endpoint+Q(1, 32))
            enclosing = square_step_jet(edge, n)
            require(enclosing.lo <= flat.lo <= enclosing.hi, 'Boundary-straddling interval lost the flat jet')
        jet_rows.append({'order': n, 'independent_midpoint_exact': str(exact), 'midpoint_enclosure': box.json()})
    require(jet_rows[1]['independent_midpoint_exact'] == '8', 'Wrong seed power or sign')

    rows = []
    prev = None
    for cells in (32, 64, 128, 256):
        current = quadrature(cells)
        require(current.lo > 0, 'Missing positive normalized lower bound')
        if prev is not None:
            require(prev.lo <= current.lo <= current.hi <= prev.hi, 'Unexpected loss of nested refinement')
        prev = current
        rows.append({'cells': cells, 'normalized_interval': current.json(),
                     'normalized_decimal_outward': outward_decimal(current),
                     'relative_width_bound': str((current.hi-current.lo)/current.lo)})
    require((prev.hi-prev.lo)*100 < prev.lo, 'Expected normalized relative width below 1%')
    qp_over_h = Interval(prev.lo / 256, prev.hi / (256 - H_MAX))
    require(Q(1, 35) < qp_over_h.lo <= qp_over_h.hi < Q(1, 34),
            'Original terminal Qp must lie between h/35 and h/34')
    result = {
        'scope': 'Original terminal wait integral #275, factored into its exact positive source scale and a rational normalized enclosure',
        'graph_sha256': GRAPH_SHA, 'node_count': NODE_COUNT, 'profile_sha256': PROFILE_SHA,
        'support_blob': SUPPORT_BLOB, 'typed_source_nodes_checked': checked,
        'root': 275, 'integrand': 274, 'bound_coordinate': 262, 'step_derivative_node': 267,
        'rho': 'h/256', 'scale': 'rho/(1-rho)', 'h': 'exp(-8002*T)', 'h_upper_bound': str(H_MAX),
        'h_bound_reason': 'T>10, e>2 and 80020>64 imply 0<h<2^-64',
        'qp_over_h_interval': qp_over_h.json(), 'strict_qp_bounds': 'h/35 < Qp < h/34',
        'seed': 'exp(-1/x^2) for x>0, zero otherwise', 'closed_interval_step_orders': [0, 12],
        'midpoint_control_rejects_linear_exponent_seed': 'Linear exponent derivative is 2 at x=1/2, actual square exponent derivative is 8',
        'point_and_flat_controls': jet_rows, 'refinements': rows,
        'final_field_jet_count_certified_by_this_run': 0,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf8')
    print('PASS source #275:', checked, 'typed nodes, normalized interval', rows[-1]['normalized_decimal_outward'])


if __name__ == '__main__':
    main()
