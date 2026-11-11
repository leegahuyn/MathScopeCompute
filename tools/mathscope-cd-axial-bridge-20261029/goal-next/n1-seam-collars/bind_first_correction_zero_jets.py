"""Certify the first correction jets on two actual N1 radial collar cells."""
from argparse import ArgumentParser
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

DELTA = ('first-gauge/first-gauge-native-delta.json', '039e655f25d7992bfb56702dcb0b072be05f93bf56661af7ed5a7580ed8c69f8')
COLLAR = ('n1-seam-collars/n1-seam-collars.json', '707ea90297e318aa7be02494d6485a8d083eb6481830fae1a2fdfed1d15ec37e')


def pinned(relative, digest):
    blob = (HERE.parent / relative).read_bytes()
    assert sha256(blob).hexdigest() == digest
    return json.loads(blob)


def composition(delta, collar):
    base = delta['baseNodeCount']
    nodes = delta['nodeDelta']
    _, fields, *_ = delta['nativeRegistryDelta']
    assert len(fields) == 3
    guard = collar['actualSource']['intrinsicXGuard']
    assert guard == [622824, 3617, 28826]
    assert all(len(field['rows']) == 162 for field in fields)
    assert all(row['guards'][0] == guard for field in fields for row in field['rows'])
    wave_roots = {}
    for index, row in enumerate(nodes, base):
        if row['op'] == 'm3_coupled_indexed_partial':
            system, params, orders = row['args']
            wave_roots[system] = index
            [field] = [record for record in fields if record['id'] == system]
            assert params == field['parameters'] and not any(orders)
    assert len(wave_roots) == 3
    roots = delta['unrestrictedReferenceChart']
    pressure_scale = nodes[roots['pressure_increment'] - base]
    assert pressure_scale['op'] == 'multiply'
    _, difference = pressure_scale['args']
    difference_node = nodes[difference - base]
    assert difference_node['op'] == 'add'
    positive, negative = difference_node['args']
    assert positive == 4456439 and nodes[negative - base] == {'op': 'multiply', 'args': [20, 3859821]}
    vanishing = {0, difference, 4454155, 4455164, 4454009, 4455153, *wave_roots.values()}

    @cache
    def zero(index):
        if index in vanishing:
            return True
        if index < base:
            return False
        row = nodes[index - base]
        if row['op'] == 'add':
            return all(map(zero, row['args']))
        if row['op'] == 'multiply':
            return any(map(zero, row['args']))
        return False

    assert all(zero(root) for root in roots.values())
    return list(wave_roots.values())


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    delta, collar = pinned(*DELTA), pinned(*COLLAR)
    pressure_path = 'pressure-exterior/corrected-pressure-exterior.json'
    pressure = pinned(pressure_path, delta['evidenceSHA256'][pressure_path])
    five_path = 'first-gauge/corrected-five-whole.json'
    five = pinned(five_path, delta['evidenceSHA256'][five_path])
    assert delta['baseGraphSHA256'] == collar['graphSHA256'] == pressure['graphSHA256'] == five['graphSHA256']
    assert delta['baseRegistrySHA256'] == collar['registrySHA256'] == pressure['registrySHA256']
    assert delta['scope']['explicitOriginalN1Image'] and collar['allLocalJetsZeroByIdenticalOpenNeighborhood']
    geometry = collar['strictCollars']
    assert Fraction(geometry['XOverXaUpperOpenEnlargement']) < 1
    assert Fraction(geometry['XOverXbLowerOpenEnlargement']) > 1
    assert collar['vanishingActualNormalizedMeanPressureDifference'] == [4455781, 3615361]
    assert {4454155, 4454009} <= set(collar['vanishingActualTemporalRoots'])
    assert [pressure['finalFullPressure'], pressure['initialFullPressure']] == [4456439, 3859821]
    assert five['actualWhole'] == pressure['actualFiveMapSupport']['rawPsi']['whole'] == 4455163
    assert five['actualPsi'] == pressure['actualFiveMapSupport']['rawPsi']['usedPsi'] == 4455164
    assert pressure['actualFiveMapSupport']['directSwirl'] == 4455153
    waves = composition(delta, collar)
    targets = delta['firstCorrectionRequestedJetExpressions']['interiorRoots']
    assert len(targets) == 67
    box = {**geometry['originalClosedZT'], 'theta': 'all physical angles',
           'radialRatio': geometry['closedRadialRatiosToEachArtificialSeam']}
    result = {
        'schema': 'MathScope.M3.FirstCorrectionTwoRadialCollarJetEnclosures/1',
        'inputSHA256': dict([DELTA, COLLAR, (pressure_path, delta['evidenceSHA256'][pressure_path]),
                            (five_path, delta['evidenceSHA256'][five_path])]),
        'physicalRoots': delta['physicalChartRoots'], 'waveRoots': waves,
        'twoClosedCells': {'inner': {**box, 'radialReference': 'sqrt(Xa)'},
                           'outer': {**box, 'radialReference': '2 sqrt(Xb)'}},
        'closedCellJetEnclosures': {target: {'inner': ['0', '0'], 'outer': ['0', '0']} for target in targets},
        'justification': 'All five first-correction values are identically zero on open neighborhoods of both cells.',
        'cellTargetPairs': 2 * len(targets), 'finalClosedCellJetIntervals': 0, 'release': 'HOLD',
    }
    args.out.write_bytes((json.dumps(result, indent=2) + '\n').encode())
    print('PASS 134 exact first-correction jet intervals on two admitted N1 collars')


if __name__ == '__main__':
    main()
