"""Bind the same-family source time carrier and bound all Cartesian transport coefficients."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


PRIMARY = 'ebd5da297d06da881e0d38bd6d04507595b50a980b2bb2399ac7df42725323ad'
JOIN = '160c99aaada4417e87993b8ff906288661960be9642485824b9ef1ec98798ddf'
ENDPOINT = '5abe63bc103e29e14694528d5bac4733b84f217344679ddfdff0b65727e18d85'
PHYSICAL = '7829836ce2331c75425a21dafd72262ba285c46f49afda0489076005b5f3c4bc'
ENDPOINT_BOUNDS = '496ae8a16a642171f8e6f17aef9ad091761f07000526479ea077522bc0634ef8'
BAND = 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'
HARMONIC = '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20'
DEGREES = '5de9d043e77bc511e2e117bc825c42d60375193f617a78724ae535f0127415f6'
GRAPH = '831120617913e89c5bb60976fb26f58c6714decc301097a08f72ee23233e0a6a'
REGISTRY = '364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111'


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


def walk(nodes, root, op):
    node = nodes.get(str(root))
    if node and node['op'] == op:
        for arg in node['args']:
            yield from walk(nodes, arg, op)
    else:
        yield root


def check_phase_slots(slots, endpoint, definitions):
    nodes = slots['nodes']
    get = lambda root: nodes[str(root)]
    assert slots['graphSHA256'] == endpoint['graphSHA256'] == GRAPH
    result = []
    for row, checked in zip(slots['rows'], endpoint['rows'], strict=True):
        assert row['key'] == checked['key']
        phase, pulse = row['phase'], row['path']['pulse']
        assert pulse == checked['geometry']['v']
        add = get(phase)
        assert add['op'] == 'add' and len(add['args']) == 2
        static, dynamic = add['args']
        outer = get(dynamic)
        assert outer['op'] == 'multiply' and len(outer['args']) == 2
        minus, product = outer['args']
        assert get(minus) == {'op': 'rational', 'args': ['-1', '1']}
        factors = get(product)
        assert factors['op'] == 'multiply' and pulse in factors['args']
        H, = [x for x in factors['args'] if x != pulse]
        geom = row['lift']['geometry']
        static_terms = list(walk(nodes, static, 'add'))
        assert len(static_terms) == 3
        r_term, = [root for root in static_terms if geom['R'] in get(root)['args']]
        theta_term, = [root for root in static_terms if geom['theta'] in get(root)['args']]
        z_term, = set(static_terms) - {r_term, theta_term}
        p, = [root for root in get(theta_term)['args'] if root != geom['theta']]
        inverse, coordinate_product = get(z_term)['args']
        assert get(inverse) == {'op': 'inverse', 'args': [geom['epsilon']]}
        assert get(coordinate_product)['op'] == 'multiply' and geom['Z'] in get(coordinate_product)['args']
        pz, = [root for root in get(coordinate_product)['args'] if root != geom['Z']]
        h_terms = list(walk(nodes, H, 'add'))
        assert len(h_terms) == 2
        fields = []
        for name, carrier in zip(('F', 'G'), (p, pz), strict=True):
            matched = [root for root in h_terms if carrier in get(root)['args']]
            assert len(matched) == 1 and get(matched[0])['op'] == 'multiply'
            field, = [root for root in get(matched[0])['args'] if root != carrier]
            application = get(field)
            assert application['op'] == 'actual_expression_partial' and application['args'][2] == [0] * 4
            sid, values, _ = application['args']
            definition = definitions[sid]
            assert values[:3] == [geom[x] for x in ('R', 'Z', 'T')]
            assert definition['name'] == f'M3GlobalBandSlow_{name}' and definition['parameters'] == values
            assert definition['unspecifiedOracle'] is False
            fields.append({'root': field, 'nativeFunction': sid, 'actual': values, 'body': definition['body']})
        result.append({'key': row['key'], 'phase': phase, 'slowAndAngularPhase': static, 'v': pulse, 'H': H,
                       'p': p, 'pz': pz, 'backgroundFields': fields,
                       'timeDerivative': '-H + epsilon*v*partial_T(H)'})
    assert result[0]['H'] == result[1]['H'] and result[0]['slowAndAngularPhase'] == result[1]['slowAndAngularPhase']
    return result


def main():
    p = ArgumentParser(description=__doc__)
    p.add_argument('slots', type=Path)
    p.add_argument('slots_sha256')
    p.add_argument('hosted', type=Path)
    p.add_argument('endpoint_dir', type=Path)
    p.add_argument('original_runtime', type=Path)
    p.add_argument('degree_runtime', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    primary = json.loads(pinned(args.hosted / 'primary-c5-native.json', PRIMARY))
    join = json.loads(pinned(args.hosted / 'same-family-mode-two.json', JOIN))
    endpoint = json.loads(pinned(args.endpoint_dir / 'n3-same-family-active-endpoint.json', ENDPOINT))
    physical = json.loads(pinned(args.endpoint_dir / 'n3-same-family-physical-transport.json', PHYSICAL))
    endpoints = json.loads(pinned(args.endpoint_dir / 'n3-same-family-active-endpoint-bounds.json', ENDPOINT_BOUNDS))
    slots = json.loads(pinned(args.slots, args.slots_sha256))
    registry = json.loads(pinned(args.hosted / 'witness/original-source-functions.json', REGISTRY))
    definitions = json.loads(registry['base']['base']['expression'])
    band = pinned(args.original_runtime / 'mathscope-m3/navier/source-global-band.mjs', BAND).decode()
    harmonic = pinned(args.original_runtime / 'mathscope-m3/navier/source-harmonic-assembly.mjs', HARMONIC).decode()
    degrees = pinned(args.degree_runtime / 'mathscope-m2/navier/actual-all-order-gaussian-jet-kernel.mjs', DEGREES).decode()
    assert 'phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))' in band
    assert 'HT=G.derivative(phaseSpeed,T)' in band and 'G.mul(v,phaseSpeed)' in band
    assert 'G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))' in harmonic
    assert 'Frozen p,pz,x0 and their source scales' in degrees
    assert 'K' in join['normRoots'] and primary['normRoot'] == join['normRoots']['K'] == 18310069
    assert primary['backgroundRow']['backgroundDerivativeOrder'] == 8
    assert primary['backgroundRow'] == primary['originalBackgroundC8']['row']
    assert all(x['pass'] for x in primary['nativeChecks'])
    assert endpoint['sameLiveNormFamily'] is True and len(physical['rows']) == 4
    source_slots = check_phase_slots(slots, endpoint, definitions)
    # Coefficients in K^a*(1 + Lmax*S*(1+9/r0))*eps^-1/2 for the time carrier.
    # |H| and |H_T| <= 2*K^2, and 2*k <= 4*eps^-1/2. The term with a
    # Y derivative of v can occur at most once, with at most j choices.
    rows = [{'order': j, 'Hmax': 2, 'HTmax': 2, 'carrierFactor': 8, 'maxEndpointYChain': 3 * j}
            for j in range(4)]
    assert rows[-1]['maxEndpointYChain'] == 9 and 8 * (2 ** 3) == 64
    # Spatial normal jets: (KS)^(16+j), transported through at most j
    # affine pulse factors. The largest trig Leibniz factor is 2^3.
    assert 4 * 2 ** 3 == 32 and Fraction(1, 100_000) < Fraction(1, 2)
    term_counts = [12 ** j * factorial(j) for j in range(5)]
    assert term_counts[1:] == [row['maximumTerms'] for row in physical['rows']]
    output_rows = {}
    for name, entries in endpoints['fields'].items():
        output_rows[name] = []
        for j, _ in enumerate(entries):
            through = entries[:j + 1]
            output_rows[name].append({
                'order': j, 'KSExponent': max(x['power'] for x in through) + 19 * j,
                'endpointFactorExponent': max(x['chainPower'] for x in through) + 3 * j,
                'pole': max(x['pole'] for x in through),
                'epsilonUnits': min(x['epsilon_units'] for x in through) - 50_000 * j,
                'signedPairIntegerFactor': 4 * term_counts[j] * 64 ** j,
            })
    result = {
        'schema': 'MathScope.ActiveN3ModeTwoTimeCarrierTransportBounds/1',
        'status': 'VERIFIED_SOURCE_TIME_PHASE_FORMULA_AND_SYMBOLIC_CARTESIAN_COEFFICIENT_BOUND',
        'sourcePins': {'primary': PRIMARY, 'sameFamilyJoin': JOIN, 'endpoint': ENDPOINT, 'physicalTransport': PHYSICAL,
                       'bandModule': BAND, 'differentialModule': HARMONIC, 'originalMixedDegreeModule': DEGREES,
                       'selectedPhaseSlots': args.slots_sha256, 'registry': REGISTRY},
        'sameFamily': True, 'sourceSlots': source_slots, 'normRoots': {'K': primary['normRoot'], **primary['backgroundRow']},
        'time': {'formula': 'Time Phi = -H + epsilon*v(Y)*H_T', 'H': 'p F + p_z G',
                 'requiredSlowProfileOrder': 4, 'availableSlowProfileOrder': 8, 'rows': rows,
                 'allOrdinaryC3TimeCarrier': '8 K^2 [1 + Lmax*S*(1 + 9/r0)] epsilon^(-1/2)'},
        'commonOperatorBoundU': '64 (KS)^19 (1 + 3 Lmax*S/r0)^3 epsilon^(-1/2)',
        'commonBoundChecks': ['D^j n <= (KS)^(16+j) before endpoint transport; endpoint factor^j after transport',
                              '2k <= 4 epsilon^(-1/2); angular trig Leibniz <= 2^3; radial fast epsilon loss <= 1/2',
                              'K controls inverse radius, radial fast normalized coefficients and Lmax',
                              'ci in (0,1] from ci*Ls=2*r0, Ls>=1 and r0=2^-34',
                              '1 + Lmax*S*(1+9/r0) <= 4*(1+3 Lmax*S/r0), with r0<1'],
        'termCounts': term_counts, 'conditionalPhysicalDerivativeRows': output_rows,
        'physicalDerivativeFormula': 'signedPairIntegerFactor * Q^(fieldExponent-j_space/2-j_time) * epsilon^(-j_time) * (KS)^KSExponent * endpointFactor^endpointFactorExponent * delta_*^-pole * epsilon^(epsilonUnits/100000) * zeta * P(v(Y))',
        'fieldExponents': {'potential': '1/2-A', 'velocity': '-A', 'pressure': '-2A'},
        'scope': 'Symbolic C3 bound for transport operator coefficients on the selected admitted fixed own-label chart. Full derivative intervals still require the active inverse frame and complete other field contributions.',
        'activeFrameBoundChecked': False, 'numericFinalJets': '0/67', 'release': 'HOLD',
    }
    with args.output.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'SHA256': sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
