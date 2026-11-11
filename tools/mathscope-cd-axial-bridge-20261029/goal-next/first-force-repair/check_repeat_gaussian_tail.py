"""Bind the four live cutoff families to the original Gaussian tail geometry."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
from tempfile import TemporaryFile

from bind_primary_amplitude import FixedLift
from check_repeat_forced_candidates import CANDIDATE_FILE, CANDIDATE_SCOPE, Graph, STREAM, verify_manifest
from replay_repeat_conservative import FIRST_PRODUCER, LIVE_RECEIPT, REPEAT_PRODUCER, pinned
from verify_repaired_first_force import BASE, git_blob

REV = '89c8235f277725cf0fd8400be6661c3d72cf1167'
BAND = 'research-ide/mathscope-m3/navier/evidence/global-source-20261012/attempt2/global-band.json'
BAND_SHA = '8d3ebef2bd36d96fed3857ef25477ca7e0f976a25f01f6eaa96b31d04f6be002'
M2 = 'research-ide/mathscope-m2/navier/'
SOURCE_FILES = {
    'actual-common-admissible-family.mjs': (
        b'lambdaLower:G.pow(Renv,-31)', b'lengthRatioLower:G.mul(q(2),r0)'),
    'actual-covariance-concentration.mjs': (
        b'gaussianLower=G.div(lambdaLower,G.mul(q(4),u))',
        b'P(v) <= exp(-gaussianLower*(v-Ls/2)^2/Ls)'),
    'actual-pulse-gaussian-tail.mjs': (
        b'lambdaLower=G.pow(Renv,-31)', b'a=G.div(G.mul(gaussianLower,Lmin),q(16))'),
}
FAMILIES = [
    'first-forced-remaining-source', 'first-forced-cutoff-derivative',
    'primary-cutoff-derivative', 'signed-cutoff-derivative',
]
ELL, V, L, U, LAMBDA0, S = 622791, 622805, 623027, 617291, 623006, 622795


def source_blobs(repo):
    band = git_blob(repo, REV, BAND)
    assert sha256(band).hexdigest() == BAND_SHA
    pins = {BAND: BAND_SHA}
    for name, markers in SOURCE_FILES.items():
        path = M2 + name
        source = git_blob(repo, BASE, path)
        assert all(marker in source for marker in markers), path
        pins[path] = sha256(source).hexdigest()
    return json.loads(band)['band'], pins


def envelope_bindings(graph, band):
    constants, geom = band['constants'], band['geometry']
    assert [constants['u'], constants['Lmin'], constants['Renv']] == [U, 300173, 216823]
    assert [geom['Ls'], geom['ci'], geom['S'], band['frozen']['lambda0']] == [L, 623025, S, LAMBDA0]
    assert graph.node(S) == ('integer_power', [ELL, 2])
    assert graph.node(U) == ('multiply', [24, 617290])
    assert graph.node(617290) == ('inverse', [617289])
    assert graph.node(216823) == ('source_parameter', ['C12EnvelopeR'])
    assert graph.node(300171) == ('rational', ['1', '17179869184'])
    assert graph.node(300173) == ('rational', ['1', '8589934592'])
    assert graph.node(L) == ('multiply', [300173, 623026])
    assert graph.node(623026) == ('inverse', [623025])
    assert V not in graph.reach([LAMBDA0, U, L])
    assert graph.node(623025) == ('multiply', [623022, 623024])
    # i is the floor of the source rate. Together with log Q=-ell log 2
    # this gives c_i <= ell^-2 at every original admitted band.
    assert graph.node(623020) == ('multiply', [20, 623019])
    assert graph.node(623019) == ('ceiling', [623018])
    assert graph.node(623018) == ('multiply', [20, 623017])
    assert graph.node(623017) == ('multiply', [623014, 623016])
    assert graph.node(623016) == ('inverse', [623015])
    assert graph.node(623022) == ('exp', [623021])
    assert graph.node(623021) == ('multiply', [623015, 623020])
    assert graph.node(623024) == ('exp', [623023])
    assert graph.node(623023) == ('multiply', [135988, 622796])
    assert graph.node(135988) == ('add', [1, 9])
    assert graph.node(622796) == ('log_positive', [622794])
    assert graph.node(622794) == ('exp', [622793])
    assert graph.node(622793) == ('multiply', [20, 622792])
    assert graph.node(622792) == ('multiply', [127, ELL])
    lift = FixedLift(graph)
    a = lift.algebra
    ell = lift.form(ELL)
    expected_index_numerator = a.sub(
        a.mul(lift.form(135988), ell, lift.form(127)),
        a.mul(a.scalar(2), lift.atom('log_positive', (), [ell])))
    assert lift.form(623014) == expected_index_numerator
    assert graph.node(623015) == ('log_positive', [300172])
    assert graph.node(300172) == ('add', [474, 3622])
    assert graph.node(474) == ('rational', ['4', '1'])
    assert graph.node(3622) == ('sqrt_positive', [24])
    assert graph.node(24) == ('rational', ['2', '1'])

    v, length, u, lam0 = (lift.form(i) for i in (V, L, U, LAMBDA0))
    rows = []
    for family in band['families']:
        sign, frame = family['sign'], family['frame']
        s, derivative = (lift.form(frame[k]) for k in ('s', 'sPrime'))
        assert s == a.mul(a.scalar(sign), u, a.add(a.scalar('1/2'), a.mul(v, a.inv(length))))
        assert derivative == a.mul(a.scalar(sign), u, a.inv(length))
        radius = a.add(a.one, a.pow(s, 2))
        middle = a.add(a.one, a.pow(u, 2))
        lambda_v, dref = (frame['reference'][k] for k in ('lambda', 'dref'))
        assert lift.form(lambda_v) == a.mul(lam0, a.inv(lift.atom('sqrt_positive', (), [radius])))
        expected_dref = a.mul(lam0, radius, a.inv(a.pow(lift.atom('sqrt_positive', (), [middle]), 3)))
        assert lift.form(dref) == expected_dref
        assert graph.args(family['P'], 'exp') == [family['logP']]
        body, binder, left, right = graph.args(family['logP'], 'definite_integral')
        assert right == V and lift.form(left) == a.mul(a.scalar('1/2'), length)
        substitution = ((V, binder),)
        assert lift.form(body) == a.sub(lift.form(lambda_v, substitution), lift.form(dref, substitution))
        rows.append({'sign': sign, 'slope': frame['s'], 'lambda': lambda_v, 'referenceDamping': dref,
                     'envelope': family['P'], 'integral': family['logP'], 'binder': binder})
    assert {row['sign'] for row in rows} == {1, -1}
    FixedLift.form.cache_clear()
    return rows


def live_terms(candidate, first):
    rows = []
    prior = {(row['key'], row['m']): row for row in first['rows']}
    for case in candidate['templates']:
        key = case['key']
        for row in case['rows']:
            m, terms = row['m'], row['terms']
            expected = FAMILIES if m == 1 else FAMILIES[:2] if m == 2 else []
            assert [term['family'] for term in terms] == expected
            if not terms:
                continue
            first_row = prior[key, m]
            assert first_row['length'] == L and first_row['path']['ci'] == 623025
            assert terms[0]['value'] == first_row['mappedCutoff']['remainingSource']
            assert terms[1]['value'] == first_row['mappedCutoff']['derivativeSource']
            assert all(len(term['value']) == 3 for term in terms)
            rows.append({'key': key, 'mode': m, 'actualPulse': first_row['path']['pulse'], 'length': L,
                         'families': terms})
    assert len(rows) == 20 and sum(6 * len(row['families']) for row in rows) == 360
    return rows


def scalar_checks():
    # For u>=2, sqrt(1+u^2) <= (5/4)u and (1+u^2)^(3/2) <= (25/16)u^3 < 2u^3.
    assert 1 + Fraction(1, 4) <= Fraction(5, 4) ** 2 and Fraction(25, 16) < 2
    r0 = Fraction(1, 2**34)
    assert 2 * r0 / (4 * 16) == r0 / 32
    assert Fraction(1, 2) - Fraction(1, 4) == Fraction(3, 4) - Fraction(1, 2) == Fraction(1, 4)
    return {'sourceGaussianCoefficient': 'lambda0/(4u)',
            'uniformGaussianCoefficient': 'C12EnvelopeR^(-31)/(4u)',
            'fixedPulseLowerLength': '2*r0*ell^2',
            'commonGaussianExponent': 'r0*C12EnvelopeR^(-31)/(32u)',
            'finiteBandConstantWithPhysicalQ': '2^N * exp((((M+N) log 2)+2P)^2/(2a))'}


def main():
    parser = ArgumentParser(description=__doc__)
    for key in ('repo', 'candidate-dir', 'first-dir', 'official-receipt', 'out'):
        parser.add_argument('--' + key, required=True, type=Path)
    args = parser.parse_args()
    official = pinned(args.official_receipt, LIVE_RECEIPT)
    snapshot, _ = verify_manifest(args.candidate_dir, CANDIDATE_SCOPE, official['commit'])
    assert snapshot['node_stream_sha256'] == official['graphSHA256']
    candidate = pinned(args.candidate_dir / CANDIDATE_FILE, REPEAT_PRODUCER)
    assert candidate['snapshot'] == snapshot
    first = pinned(args.first_dir / 'corrected-first-force.json', FIRST_PRODUCER)
    band, pins = source_blobs(args.repo)
    with TemporaryFile() as backing:
        graph = Graph(args.candidate_dir / STREAM, backing, snapshot)
        envelopes = envelope_bindings(graph, band)
    result = {'schema': 'MathScope.M3.LiveRepeatGaussianCutoffEnvelope/1',
              'graphSHA256': official['graphSHA256'], 'registrySHA256': official['registrySHA256'],
              'sourcePins': pins, 'actualEnvelopes': envelopes, 'scalarProof': scalar_checks(),
              'liveSubtractionTerms': live_terms(candidate, first), 'realAndImaginarySlots': 360,
              'inputAmplitudeAndForcingUniformClass': 'OPEN', 'physicalMeanFlatRemainder': 'OPEN',
              'finalClosedCellJets': 0, 'release': 'HOLD'}
    args.out.write_bytes((json.dumps(result, indent=2) + '\n').encode())
    print('PASS two actual pulse envelopes and 360 live cutoff-family component slots')


if __name__ == '__main__':
    main()
