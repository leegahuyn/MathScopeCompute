"""Propagate symbolic source bounds through the original affine endpoint and curl."""

from argparse import ArgumentParser
from dataclasses import asdict
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import sys


INVERSE = '09b98add880b6a7dbc13a6854f1234f79c7a26f38ce89b6080219b7d446d90fa'
BASE = '302f275499654116a9d98d4a01fa475100e8d2b7a98bcd218be58ca87f1ee168'


def read(path, expected):
    data = path.read_bytes()
    if sha256(data).hexdigest() != expected:
        raise ValueError(f'Unexpected SHA256 for {path}')
    return data


def load(path):
    read(path, BASE)
    name = 'n3_endpoint_bound_arithmetic'
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def main():
    p = ArgumentParser(description=__doc__)
    p.add_argument('endpoint_receipt', type=Path)
    p.add_argument('endpoint_sha256')
    p.add_argument('inverse_receipt', type=Path)
    p.add_argument('arithmetic', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    geometry = json.loads(read(args.endpoint_receipt, args.endpoint_sha256))
    inverse = json.loads(read(args.inverse_receipt, INVERSE))
    assert geometry['status'] == 'VERIFIED_ACTIVE_ORIGINAL_ENDPOINT_AND_CYLINDRICAL_CURL'
    assert geometry['conditionalInverseSHA256'] == INVERSE
    assert geometry.get('sameFamily', {}).get('activeFrameBoundChecked', False) is False
    assert [x['key'] for x in geometry['rows']] == ['0:1', '1:1']
    direction = {'DrV': '0', 'DzXi': '0', 'DzV': '0', 'TimeXi': '0', 'TimeV': '1'}
    for row in geometry['rows']:
        assert all(row['geometry']['normalizedDirections'][k] == v for k, v in direction.items())
        assert len(row['pressureEndpointApplications']) == 12
        assert len(row['mappedCurlPartials']) == 16
    base = load(args.arithmetic)
    B, add, mul, scale = base.Bound, base.total, base.product, base.scale
    gauge, pressure = [[B(**x) for x in inverse['bounds'][key]] for key in ('cutoffGauge', 'cutoffPressure')]
    assert [(x.power, x.pole, x.epsilon_units) for x in (gauge[4], pressure[4])] == [(3165, 42, 149999), (3172, 42, 149999)]
    a_fast = [B(1, epsilon_units=-1)] * 4
    inv_radius = [B(1)] * 4
    normal = [B(16 + j) for j in range(4)]
    dr_fast = base.leibniz(a_fast, gauge[1:], 3)
    inv_radius_gauge = base.leibniz(inv_radius, gauge, 3)
    leading = [scale(8, mul(B(epsilon_units=-50_000), row)) for row in base.leibniz(normal, gauge, 3)]
    velocity = []
    for j in range(4):
        # The endpoint pulse is constant under both spatial operators, so
        # the full physical curl uses independent-pulse C(j+1) just once.
        dr = add(gauge[j + 1], scale(2, dr_fast[j]))
        dz = mul(B(epsilon_units=100_000), gauge[j + 1])
        velocity.append(add(leading[j], dr, dz, inv_radius_gauge[j]))
    assert all(x.epsilon_units == 99999 and x.gaussian == 1 and x.zeta_half_units == 2 for x in velocity)
    fields = {'potential': gauge, 'velocity': velocity, 'pressure': pressure}
    result = {
        'schema': 'MathScope.ActiveN3ModeTwoEndpointDegreeReplay/1',
        'status': 'VERIFIED_AFFINE_ENDPOINT_DEGREE_PROPAGATION_CONDITIONAL_SOURCE_NORM_JOIN',
        'exactEndpointSHA256': args.endpoint_sha256, 'independentPulseInverseSHA256': INVERSE,
        'formula': '(K*S)^power * (1+3*Lmax*S/r0)^chainPower * delta_*^-pole * epsilon^(epsilon_units/100000) * zeta * P(v(Y))',
        'K': inverse['sourceK'], 'fields': {key: [{**asdict(row), 'chainPower': j} for j, row in enumerate(rows)]
                                          for key, rows in fields.items()},
        'physicalCoefficientScaling': {'potential': 'Q^(1/2-A)', 'velocity': 'Q^(-A)', 'pressure': 'Q^(-2A)'},
        'fixedLabelPhysicalOperatorScaling': {'radial': 'Q^(-1/2) Dr', 'axial': 'Q^(-1/2) Dz',
                                              'azimuthal': 'Q^(-1/2) (1/R) partial_theta',
                                              'time': 'Q^(-1) epsilon^(-1) Time'},
        'C4Composition': 'v(Y) is affine with fixed nearest copy; |partial_Yi v|<=3*Lmax*S/r0, all higher derivatives vanish.',
        'curl': 'Dr v = Dz v = 0. Keep both explicit Y partials, the cylindrical A_theta/R connection and the mode-two carrier.',
        'boundary': 'Interior delta_*>0 and admitted fixed-label pulse; flat continuation and box/palette join separate.',
        'sameLiveNormFamily': geometry['sameLiveNormFamily'], 'activeFrameBoundChecked': False,
        'finalCartesianJetIntervals': 0, 'finalJets': '0/67', 'release': 'HOLD',
    }
    with args.output.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'C4Potential': result['fields']['potential'][4], 'C3Velocity': result['fields']['velocity'][3],
                      'C4Pressure': result['fields']['pressure'][4], 'sha256': sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
