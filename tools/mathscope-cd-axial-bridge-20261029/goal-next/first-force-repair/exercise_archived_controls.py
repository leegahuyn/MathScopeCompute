"""Exercise the exact independent checks against the uncorrected prior archive."""
from pathlib import Path
import sys
import json
from array import array
from functools import cache
import gzip
from tempfile import TemporaryFile

from verify_repaired_first_force import (Graph, Registry, Exact, bind_raw_harmonics, need,
                                         bind_path, bind_inverse, cutoff, read, reject)


base = Path(sys.argv[1])
flat = base / 'flat'
forced = read(flat / 'forced-principal-cutoffs.json')['bindings']
raw = read(base / 'f1-mean' / 'raw-first-forced-binding.json')['exactRawSourceBindings']
manifest = next((flat / 'hosted-39988632325').rglob('original-source-export-manifest.json'))
registry = Registry(manifest.with_name('original-source-functions.json'), read(manifest))
g = Graph.__new__(Graph)
g.backing = (flat / 'final-source.ndjson').open('rb')
g.offsets = array('Q')
with (flat / 'final-source-offsets.bin').open('rb') as source:
    g.offsets.fromfile(source, read(manifest)['node_count'])

rows = {}
for f in forced:
    key, m = f['key'], f['mode']
    system = registry.pulses[f['system']]
    rows[key, m] = {
        'key': key, 'm': m, 'length': f['length'], 'k': f['waveNumber'],
        'path': {'pulse': f['pulseValue']}, 'system': system['id'],
        'components': [
            {'j': r['component'], 'part': r['part'], 'raw': r['rawInitializedHarmonic']}
            for r in raw if (r['key'], r['mode']) == (key, m)],
    }

checked = 0
for key in sorted({key for key, _ in rows}):
    case = [rows[key, m] for m in (1, 2)]
    algebra = Exact(g)
    receipts = bind_raw_harmonics(g, algebra, registry, case)
    need(len(receipts) == 3, 'three archived original coefficients')
    checked += 12
    Exact.of.cache_clear()
print(json.dumps({'archivedRawHarmonicControls': checked, 'olderRawArchiveOnly': True}))


class Checkpoint(Graph):
    """Read the older checkpoint format, with its separate original IDs."""
    def __init__(self, path, backing):
        self.backing = backing
        self.offsets = array('Q')
        with gzip.open(path, 'rb') as stream:
            self.header = json.loads(next(stream))
            for line in stream:
                self.offsets.append(backing.tell())
                backing.write(line)
        need(len(self.offsets) == self.header['nodeCount'], 'old checkpoint control node count')

    @cache
    def node(self, index):
        self.backing.seek(self.offsets[self.root(index)])
        identifier, record = json.loads(self.backing.readline())
        need(identifier == index, 'old checkpoint control record')
        return record['op'], record['args']


with TemporaryFile() as backing:
    g = Checkpoint(flat / 'forced-checkpoint.gz', backing)
    registry = Registry.__new__(Registry)
    registry.expressions, _, _, registry.pulses, _ = json.loads(g.header['definitions']['definitions'])
    count, rejected = 0, []
    for template in g.header['record']['templates']:
        for forced_row in template['forced']:
            inverse = forced_row['inverse']
            system = registry.pulses[inverse['system']]
            row = {**inverse, 'key': template['key'], 'm': forced_row['m'],
                   'path': forced_row['path'], 'output': inverse['velocity'], 'length': inverse['input']['length'],
                   'mappedCutoff': forced_row['mapped']['cutoff']['mapped']}
            algebra = Exact(g)
            bind_path(g, algebra, row['path'], system, row['key'])
            bind_inverse(g, algebra, row, system, inverse['source'])
            cutoff(g, algebra, registry, row, system, inverse['source'])
            count += 1
            if count == 1:
                wrong = {**row, 'pressure': {**row['pressure'], 'real': row['pressure']['imaginary']}}
                rejected.append(reject(lambda: bind_inverse(g, algebra, wrong, system, inverse['source']),
                                       'crossedArchivedPressure'))
                wrong = {**row['path'], 'Hw': row['path']['Hw'][::-1]}
                rejected.append(reject(lambda: bind_path(g, algebra, wrong, system, row['key']),
                                       'crossedArchivedPath'))
            Exact.of.cache_clear()
    print(json.dumps({'archivedInverseControls': count, 'rejected': rejected, 'olderRawArchiveOnly': True}))
