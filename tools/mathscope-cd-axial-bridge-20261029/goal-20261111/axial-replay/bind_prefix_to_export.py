"""Bind the freshly replayed axial producer to the original first-FiveMap export."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path


GRAPH_SHA = 'a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REGISTRY_SHA = 'bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
PREFIX_SHA = 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116'
PICARD_SHA = 'c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60'
FIXED_SHA = 'c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
STRESS_PROGRAM_SHA = '85d3c0daccc7a296208bf8501fb861d4c9a2265ec4d15947671904a79d927c3c'


def require(condition, explanation):
    if not condition:
        raise ValueError(explanation)


def canonical_sha(obj):
    raw = json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode()
    return hashlib.sha256(raw).hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--graph', required=True, type=Path)
    p.add_argument('--replay', required=True, type=Path)
    p.add_argument('--out', required=True, type=Path)
    args = p.parse_args()
    replay_raw = args.replay.read_bytes()
    replay = json.loads(replay_raw)
    require(replay['prefixLength'] == 117100 and replay['prefixSHA256'] == PREFIX_SHA,
            'Missing exact current producer prefix identity')
    cert = replay['cert']
    require(cert['graph']['sha256'] == STRESS_PROGRAM_SHA and cert['graph']['nodeCount'] == 135015,
            'Fresh producer differs from independently reviewed positive-stress execution')

    nodes = []
    h = hashlib.sha256()
    with gzip.open(args.graph / 'original-source-nodes.jsonl.gz', 'rb') as f:
        header = f.readline()
        h.update(header)
        count = 0
        for i, raw in enumerate(f):
            h.update(raw)
            if i < replay['prefixLength']:
                nodes.append(json.loads(raw))
            count += 1
    require(count == json.loads(header)['node_count'] == 4420257 and h.hexdigest() == GRAPH_SHA,
            'Original graph authentication failed')
    require(canonical_sha(nodes) == replay['prefixSHA256'], 'Producer and exported prefix differ')
    for label, node in replay['selectedNodes'].items():
        require(nodes[int(label)] == node, f'Producer node #{label} differs')
    require(nodes[117047] == {'op':'smooth_piecewise','args':[4756,28814,28824,0,117045,0]},
            'Actual density cutoff changed')

    registry_bytes = (args.graph / 'original-source-functions.json').read_bytes()
    require(hashlib.sha256(registry_bytes).hexdigest() == REGISTRY_SHA, 'Original registry hash mismatch')
    base = json.loads(registry_bytes)['base']['base']
    defs = json.loads(base['expression'])
    require(defs[1]['body'] == 117047 and defs[1]['parameters'] == [4756, 2],
            'Expression 1 is not the authenticated density')
    require(defs[672]['body'] == 117069 and defs[672]['parameters'] == [4756, 2]
            and defs[672]['name'] == 'ActualAllFiniteOrderOneStress_z',
            'Native expression 672 changed')
    require(canonical_sha(json.loads(base['picard'])[0]) == PICARD_SHA, 'Original Picard 0 definition changed')
    require(hashlib.sha256(base['fixed'].encode()).hexdigest() == FIXED_SHA, 'Original fixed native data changed')

    ftc = next(row for row in cert['sourceFTC']['rows'] if row['order'] == 1 and row['component'] == 'z')
    stress = next(row for row in cert['stressRows'] if row['order'] == 1 and row['component'] == 'z')
    require([ftc[k] for k in ('root','raw','materializedDensity','integral','openDomain')]
            == [117069,117045,117047,117057,[28814,28824]], 'Wrong axial FTC or cutoff source')
    require([stress[k] for k in ('sourceForwardIntegral','sourceBackwardIntegral','originalTotal')]
            == [117057,117066,117075], 'Wrong axial integral roots')
    require(all(stress[k]['pass'] is True for k in ('originalTotalCheck','wholeDensityCheck',
            'rawDensityCheck','backwardSign','originalSignedFTC','interiorCoefficientCheck')),
            'A required producer check did not pass')
    require(stress['actualConservativeTotalReduced'] == 0 and stress['allFixedDerivativeJetsMatch'] is True
            and stress['defectDefinedAsZero'] is False, 'Producer did not prove signed stress gluing')
    require([r['order'] for r in cert['totals']['rows']] == [1,2]
            and all(r['axialReduced'] == 0 and r['allFixedEtaDerivatives'] is True
                    for r in cert['totals']['rows']), 'Generated positive-order total or eta rule failed')
    require(cert['scope']['allOrderPhysicalResidualFlatness'] is False,
            'Finite execution must preserve its scope')

    result = {
        'status': 'MATCHED_ACTUAL_ORDER_ONE_AXIAL_PRODUCER',
        'export_graph_sha256': GRAPH_SHA, 'export_registry_sha256': REGISTRY_SHA,
        'matching_node_prefix': 117100, 'matching_prefix_sha256': PREFIX_SHA,
        'fresh_positive_stress_program_sha256': STRESS_PROGRAM_SHA,
        'fresh_replay_sha256': hashlib.sha256(replay_raw).hexdigest(),
        'export_picard_0_sha256': PICARD_SHA, 'export_fixed_registry_sha256': FIXED_SHA,
        'formal_arguments': [4756,2], 'function': 672, 'body': 117069, 'raw': 117045,
        'supported_density': 117047, 'cutoffs': [28814,28824], 'integrals': [117057,117066,117075],
        'producer_generated_orders': [1,2],
        'original_total_binding': stress['originalTotalCheck'],
        'actual_conservative_total_reduced_to_literal_zero': stress['actualConservativeTotalReduced'] == 0,
        'scope': ('The original producer checks the normalized coefficient identity on the real admissible '
                  'profile domain with inward eta endpoint derivatives. This binder authenticates the exact '
                  'exported nodes and definitions to that producer run. It does not construct the terminal field.'),
    }
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf8')
    print('PASS: original #672/#117047 and signed integrals bound to same producer-proved total')


if __name__ == '__main__':
    main()
