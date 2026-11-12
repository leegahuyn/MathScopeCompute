"""Propagate an active N3 mode-two input through the exact stable pulse recurrence."""

import argparse
from dataclasses import asdict, replace
from hashlib import sha256
import importlib.util
import json
from math import comb
from pathlib import Path
import subprocess
import sys


INPUT_SHA = 'adcabe6055fed4483e3052101e3f8fa4cf8422f9a603a44809b33c9bb923c0d1'
PREVIOUS_CODE = '302f275499654116a9d98d4a01fa475100e8d2b7a98bcd218be58ca87f1ee168'
DEGREE_CODE = 'bbceb25f42575e3cb0ce9c998c0da25d168c384eb7d405f25ce933d1538e0609'
DEGREE_MODULE = '40b3f1220b7ad1b9b05a11ae1378c864351e77e8efe7134ae1b78921fbab47ea'
PINS = {
    'mathscope-m3/navier/source-forced-pulse.mjs': '129423c917b3b8b1aae72b242f802e9f9934f17569fa895c669708785dbff924',
    'mathscope-m2/navier/actual-covariance-matrix.mjs': '7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26',
    'mathscope-m2/navier/actual-pulse-gaussian-power-kernel.mjs': '534976d0dfd4c02fa8e7e4f6e5ea46c7152e33d793c489d7450f320a536abbc7',
    'mathscope-m2/navier/actual-all-order-gaussian-jet-kernel.mjs': '5de9d043e77bc511e2e117bc825c42d60375193f617a78724ae535f0127415f6',
}
M = 4


def pinned(path, expected):
    raw = path.read_bytes()
    if sha256(raw).hexdigest() != expected:
        raise ValueError(f'Unexpected original SHA256 for {path}')
    return raw


def load_base(root):
    path = root / 'check_n3_mode_two_degrees.py'
    pinned(path, PREVIOUS_CODE)
    name = 'n3_mode_two_bound_calculus'
    spec = importlib.util.spec_from_file_location(name, path)
    base = importlib.util.module_from_spec(spec)
    sys.modules[name] = base
    spec.loader.exec_module(base)
    return base


def evaluate(base, source, prior, *, omit_parameter=False, omit_endpoint=False):
    B, prod, add, scale = base.Bound, base.product, base.total, base.scale
    product = lambda a, b: base.leibniz(a, b, M)
    atom = lambda name: [B(power) for power in source[name]]
    basis, left, rho, P = [atom(x) for x in ('B', 'Bleft', 'rho', 'P')]
    normal = [B(max(row['powers'][j] for row in source['normal'])) for j in range(M + 1)]
    inverse_n2 = [B(**row) for row in source['invNormal'][:M + 1]]
    pressure_numerator = [B(**row) for row in source['pressureNumerator']]
    d = [scale(12, x) for x in product(normal, normal)]  # 3 normal squares; epsilon*k^2<=4.
    matrix = [add(a, scale(3, b)) for a, b in zip(atom('wMatrix'), d, strict=True)]

    # (1/P)' = -rho/P. Only the exact absolute derivative polynomial is majorized.
    inverse_P = [B(gaussian=-1)]
    for j in range(M):
        inverse_P.append(add(*(scale(comb(j, a), prod(rho[a], inverse_P[j - a])) for a in range(j + 1))))
    P = [replace(x, gaussian=1) for x in P]
    projected = [B(**x) for x in prior['projectedAfterHw']]
    normalized_source = [scale(3, x) for x in product(left, product(inverse_P, projected))]
    uniform = [replace(x, gaussian=0) for x in normalized_source]  # P(w)<=1 on the actual pulse.
    assert all(x.gaussian == 1 for x in normalized_source)
    z, operations = {}, []
    for s in range(M + 1):
        terms = [(a, 0, comb(s, a), (s - a, 0)) for a in range(1, s + 1)] if not omit_parameter else []
        value = add(uniform[s], *(scale(c, prod(matrix[a], z[target])) for a, _, c, target in terms))
        z[s, 0] = prod(B(2), value)  # Ls*W <= (K*S)^2; no absolute-matrix exponent.
        operations.append({'index': [s, 0], 'sourceOrder': s, 'terms': terms, 'factor': '(K*S)^2'})
    for j in range(1, M + 1):
        for s in range(M - j + 1):
            terms = [(a, b, comb(s, a) * comb(j - 1, b), (s - a, j - 1 - b))
                     for a in range(s + 1) for b in range(j)]
            if omit_endpoint:
                terms = [term for term in terms if term[:2] != (0, 0)]
            z[s, j] = add(uniform[s + j - 1], *(scale(c, prod(matrix[a + b], z[target])) for a, b, c, target in terms))
            operations.append({'index': [s, j], 'sourceOrder': s + j - 1, 'terms': terms, 'factor': '1'})
    max_order = [add(*(z[s, j - s] for s in range(j + 1))) for j in range(M + 1)]
    pulse = [scale(2, x) for x in product(basis, product(P, max_order))]
    psi = [B(1) for _ in range(M + 1)]  # K dominates the exact longitudinal cutoff coefficients; Ls>=1.
    cutoff_pulse = product(psi, pulse)
    # The two terms of a cross product and the 1/k <= sqrt(eps) gain.
    gain = B(epsilon_units=50_000)
    gauge = [scale(2, prod(gain, x)) for x in product(normal, product(inverse_n2, cutoff_pulse))]

    raw = [scale(6 ** j, B(**x)) for j, x in enumerate(prior['raw'])]
    n_dot_source = [replace(scale(3, x), gaussian=1) for x in product(normal, raw)]  # P(w)^2<=P(w).
    matrix_dot_solution = [scale(3, x) for x in product(pressure_numerator, pulse)]
    pressure = [prod(gain, x) for x in product(psi, product(inverse_n2,
                  [add(x, y) for x, y in zip(n_dot_source, matrix_dot_solution, strict=True)]))]
    return {'M2': matrix, 'inverseP': inverse_P, 'forcingNormalized': normalized_source, 'z': z,
            'operations': operations, 'nativeVelocity': pulse, 'cutoffGauge': gauge, 'cutoffPressure': pressure}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('previous_directory', type=Path)
    p.add_argument('degree_runtime', type=Path)
    p.add_argument('forced_runtime', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    previous = args.previous_directory
    prior = json.loads(pinned(previous / 'n3-mode-two-degrees-pulled.json', INPUT_SHA))
    assert prior['pullbackCoordinates'] == ['R', 'Z', 'T', 'Y_0', 'Y_1', 'w']
    assert prior['normGraph']['K'] == 18310069 and prior['selectedDeltaCases'] == [0, 1]
    assert prior['projectedAfterHw'][-1]['power'] == 3055
    script = previous / 'read_degree.mjs'
    pinned(script, DEGREE_CODE)
    source = json.loads(subprocess.check_output(['node', str(script), str(args.degree_runtime)]))
    assert source['sourceSHA256'] == DEGREE_MODULE
    for name, expected in PINS.items():
        root = args.forced_runtime if name.endswith(('source-forced-pulse.mjs', 'actual-covariance-matrix.mjs')) else args.degree_runtime
        pinned(root / name, expected)
    base = load_base(previous)
    result = evaluate(base, source, prior)
    no_parameter = evaluate(base, source, prior, omit_parameter=True)
    no_endpoint = evaluate(base, source, prior, omit_endpoint=True)
    assert result['z'][4, 0] != no_parameter['z'][4, 0] and result['z'][0, 4] != no_endpoint['z'][0, 4]
    assert len(result['z']) == len(result['operations']) == 15
    for key, eps in (('nativeVelocity', 99999), ('cutoffGauge', 149999), ('cutoffPressure', 149999)):
        assert all((b.epsilon_units, b.zeta_half_units, b.gaussian) == (eps, 2, 1) for b in result[key])
    data = {k: list(map(asdict, v)) for k, v in result.items() if k not in ('z', 'operations')}
    receipt = {'schema': 'MathScope.ActiveN3ModeTwoStableVolterraDegreeReplay/1',
               'status': 'VERIFIED_STABLE_DEGREE_RECURRENCE_CONDITIONAL_ON_ACTIVE_FRAME_IDENTITY',
               'inputSHA256': INPUT_SHA, 'sourcePins': PINS, 'sourceK': prior['normGraph']['K'],
               'forwardBound': 'W=exp(3*Bnorm^256*Lmax), W<=K; M2=M1-3d*I, d=epsilon*k^2*|n|^2>=0.',
               'formula': '(K*S)^power * delta_*^(-pole) * epsilon^(epsilon_units/100000) * zeta^(zeta_half_units/2) * P(w)^gaussian',
               'scope': {'pulse': '0<=w<=Ls on admitted fixed-label interior with delta_*>0, fixed representative, copy and chart.',
                         'parameters': prior['pullbackCoordinates'][:-1], 'allDerivativeWordsThrough': M,
                         'weightedBoundaryFlatJoinSeparate': True, 'endpointMapWtoVVerifiedInThisRun': False,
                         'liveFrameBoundChecked': False, 'numericUpperEndpoint': False, 'completeForcedSeal': False},
               'recurrences': [{**row, 'bound': asdict(result['z'][tuple(row['index'])])} for row in result['operations']],
               'bounds': data, 'negativeControls': ['omitting parameter Leibniz terms changes C4', 'omitting the endpoint matrix term changes C4'],
               'finalJets': '0/67', 'release': 'HOLD'}
    with args.output.open('x', encoding='utf8', newline='\n') as output:
        output.write(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'status': receipt['status'], 'C4': {k: data[k][-1] for k in ('nativeVelocity', 'cutoffGauge', 'cutoffPressure')},
                      'sha256': sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
