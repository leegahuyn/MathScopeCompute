"""Read the exact official source export without loading all source nodes in RAM."""
from array import array
from collections import Counter
from functools import lru_cache
from hashlib import sha256
import gzip
import json
import re
from tempfile import TemporaryFile


NODE = re.compile(rb'^\{"op":"([A-Za-z_0-9]+)","args":\[')
STREAM = 'original-source-nodes.jsonl.gz'
REGISTRY = 'original-source-functions.json'
MANIFEST = 'original-source-export-manifest.json'


def need(test, detail):
    if not test:
        raise ValueError(detail)


def read(path, expected=None):
    raw = path.read_bytes()
    pin = sha256(raw).hexdigest()
    need(expected is None or pin == expected, f'{path.name}: SHA-256 mismatch')
    return json.loads(raw), pin


def node_id(value, count):
    return type(value) is int and 0 <= value < count


def histogram(manifest):
    actual = manifest['operation_histogram']
    need(isinstance(actual,dict) and all(type(n) is int and n > 0 for n in actual.values()),
         'invalid source operation histogram')
    need(sum(actual.values()) == manifest['node_count'], 'manifest operation total')
    return actual


class SourceStream:
    def __init__(self, directory, manifest, prefix, scratch, remember=True):
        self.count = manifest['node_count']
        self.offsets = array('Q')
        self.scratch = scratch
        self.remember = remember
        self.directory = directory
        self.manifest = manifest
        self.prefix = prefix
        self.backing = None

    def __enter__(self):
        count, total, digest = 0, 0, sha256()
        prefix_hash, histogram_seen, prefix_size = sha256(), Counter(), 0
        limit = self.manifest['node_stream_uncompressed_bytes']
        need(type(self.count) is int and 0 < self.count <= 35_000_000, 'source node count cap')
        need(type(limit) is int and 0 < limit <= 12_000_000_000, 'source stream size cap')
        need(type(self.prefix) is int and 0 <= self.prefix <= self.count, 'original prefix bound')
        expected_histogram = histogram(self.manifest)
        if self.remember:
            self.backing = TemporaryFile(dir=self.scratch)
        try:
            with gzip.open(self.directory / STREAM, 'rb') as source:
                raw = source.readline()
                expected = {'schema': 'MathScope.M3.FullNodesJSONL/1', 'node_count': self.count}
                need(json.loads(raw) == expected, 'source node stream header')
                digest.update(raw)
                total += len(raw)
                for raw in source:
                    match = NODE.match(raw)
                    need(match is not None and raw.endswith(b']}\n'), f'node record framing at {count}')
                    histogram_seen[match[1].decode('ascii')] += 1
                    if count < self.prefix:
                        prefix_hash.update(raw)
                        prefix_size += len(raw)
                    if self.backing is not None:
                        self.offsets.append(self.backing.tell())
                        self.backing.write(raw)
                    count += 1
                    total += len(raw)
                    need(count <= self.count and total <= limit, 'stream exceeds manifest')
                    digest.update(raw)
            need(count == self.count and total == limit, 'node stream count and size')
            need(digest.hexdigest() == self.manifest['node_stream_sha256'], 'source node stream SHA-256')
            need(dict(histogram_seen) == expected_histogram, 'source full operation counts')
            self.verify = {'nodes': count, 'bytes': total, 'sha256': digest.hexdigest(),
                           'originalPrefixRecords': self.prefix, 'originalPrefixRecordBytes': prefix_size,
                           'originalPrefixRecordsSHA256': prefix_hash.hexdigest(),
                           'originalPrefixHashCoverage': 'node records only, without the new export header'}
            return self
        except BaseException:
            if self.backing is not None:
                self.backing.close()
            raise

    def __exit__(self, *_):
        if self.backing is not None:
            self.backing.close()
        self.record.cache_clear()

    @lru_cache(maxsize=65_536)
    def record(self, index):
        need(node_id(index, self.count) and self.backing is not None, f'missing source node {index}')
        self.backing.seek(self.offsets[index])
        return json.loads(self.backing.readline())

    def args(self, index, operation):
        row = self.record(index)
        need(row['op'] == operation, f'node {index}: expected {operation}, got {row["op"]}')
        return row['args']

    def rational(self, index):
        from fractions import Fraction
        n, d = self.args(index, 'rational')
        return Fraction(int(n), int(d))


class Native:
    def __init__(self, directory, manifest):
        need(manifest['function_registry_capture_kind'] == 'EXTENDED_COUPLED_FACADE'
             and manifest['extended_coupled_registry_included'] is True, 'extended native facade absent')
        raw, self.pin = read(directory / REGISTRY, manifest['definitions_sha256'])
        raw_groups = json.loads(raw['definitions'])
        need(len(raw_groups) == 5, 'five native groups')
        self.expressions, self.fields, self.inverses, self.pulses, self.forced_expressions = raw_groups
        self.counts = [len(group) for group in raw_groups]
        need(self.counts == raw['counts'] == manifest['extended_coupled_function_counts'],
             'extended native group lengths')
        auxiliary, base = raw['base'], raw['base']['base']
        self.base_snapshot = auxiliary
        self.coupled_groups = raw_groups
        need(isinstance(base,dict), 'original nested base native registry')
        self.aux_fields = json.loads(auxiliary['fieldDefinitions'])
        self.global_fields = json.loads(base['m3GlobalFields'])
        self.apps = {
            'm3_coupled_expression_partial': self.expressions,
            'm3_coupled_indexed_partial': self.fields,
            'm3_coupled_inverse_partial': self.inverses,
            'm3_aux_indexed_partial': self.aux_fields,
            'm3_global_indexed_partial': self.global_fields,
        }
        for label, group in (('coupled-expression',self.expressions),
                             ('coupled-field',self.fields),('coupled-inverse',self.inverses)):
            need([row['id'] for row in group] == [f'{label}:{index}' for index in range(len(group))],
                 label + ' append-only registry IDs')

    def application(self, graph, root, expected=None, zero_order=True):
        row = graph.record(root)
        operation, args = row['op'], row['args']
        need(operation in self.apps and len(args) == 3, f'unsupported native application {root}')
        key, actual, orders = args
        if isinstance(key, str):
            index = int(key.split(':',1)[1])
        else:
            need(type(key) is int, f'native index at {root}')
            index = key
        group = self.apps[operation]
        need(0 <= index < len(group), f'native group index at {root}')
        definition = group[index]
        need(definition.get('id',key) == key and (expected is None or expected == definition['name']),
             f'native registration at {root}')
        directions = definition.get('directions',definition['parameters'])
        need(len(definition['parameters']) == len(actual) and len(directions) == len(orders),
             f'native argument and derivative arity at {root}')
        need(all(type(x) is int and 0 <= x <= 16 for x in orders), f'native derivative order at {root}')
        if zero_order:
            need(not any(orders), f'native zero order required at {root}')
        for pid in definition['parameters']:
            graph.args(pid,'coordinate')
        return definition, actual, orders
