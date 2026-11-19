"""Authenticate the saved genuine N1 row-map and physical scale control."""
from argparse import ArgumentParser
from collections import Counter
from hashlib import sha256
from pathlib import Path
import gzip
import json


PINS = {
    'forced': ('final67/first-forced-gauge.json',
               '95e5f4cce485e95414a0b6574513ea462d50a4e0cc1e98675c6d54a216e21c80'),
    'signed': ('first-gauge/corrected-gauge-replay.json',
               'c61446ae5c0928c9c5b4a342dffc9403d7aa5b9138209d1edf8bc21623816a6a'),
    'delta': ('first-gauge/first-gauge-native-delta.json',
              '039e655f25d7992bfb56702dcb0b072be05f93bf56661af7ed5a7580ed8c69f8'),
}
SOURCE = 'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'


def node(op, *args):
    return {'op': op, 'args': list(args)}


def check(goal, archive):
    files = {}
    for key, (name, pin) in PINS.items():
        data = (goal / name).read_bytes()
        assert sha256(data).hexdigest() == pin, name
        files[key] = json.loads(data)
    forced, signed, delta = (files[key] for key in PINS)
    rows = forced['sameIndexedRowMaps']
    assert rows == signed['same162NativeRowMaps'] and len(rows) == 162
    assert Counter(row['label']['sign'] for row in rows) == {1:81, -1:81}
    assert len({(row['label']['key'], row['label']['sign']) for row in rows}) == 162
    assert delta['baseGraphSHA256'] == signed['graphSHA256'] == SOURCE
    ordinary = signed['exactNativeOwnReferenceScaling']
    assert len(ordinary) == 16 and {record['rho'] for record in ordinary} == {3675262}
    prefixes = {tuple(record['actualOwnArguments'][:3]) for record in ordinary}
    assert prefixes == {(3859343, 3859344, 3859345)}
    native_scales = {(record['nativeVelocityOrPressureFactor'], record['powerOfA']) for record in ordinary}
    assert native_scales == {(4196446,1), (3926682,2)}

    # Semantically authenticate scalar source records rather than recompute from prose.
    expected = {
        9: node('source_parameter','h'), 19: node('rational','1','2'),
        20: node('rational','-1','1'), 21: node('multiply',9,20),
        22: node('add',19,21), 23: node('add',9,19), 24: node('rational','2','1'),
        127: node('log_positive',24), 5294: node('multiply',23,24),
        622792: node('multiply',127,622791), 622793: node('multiply',20,622792),
        622794: node('exp',622793), 622796: node('log_positive',622794),
        622797: node('multiply',9,622796), 622798: node('exp',622797),
        3675259: node('multiply',20,3675253), 3675260: node('add',622791,3675259),
        3675261: node('multiply',127,3675260), 3675262: node('exp',3675261),
        3675263: node('sqrt_positive',3675262), 3675266: node('log_positive',3675262),
        3675267: node('multiply',22,3675266), 3675268: node('exp',3675267),
        3859343: node('multiply',622802,3675263), 3859344: node('multiply',622803,3675268),
        3859345: node('multiply',622804,3675262), 3926681: node('multiply',5294,3675266),
        3926682: node('exp',3926681), 4196445: node('multiply',23,3675266),
        4196446: node('exp',4196445),
    }
    digest = sha256()
    with gzip.open(archive / 'original-source-nodes.jsonl.gz', 'rb') as stream:
        header = next(stream)
        digest.update(header)
        assert json.loads(header)['node_count'] == 4456994
        for index, raw in enumerate(stream):
            digest.update(raw)
            if index not in expected:
                continue
            actual = json.loads(raw)
            wanted = expected[index]
            # Commutativity of the individually typed binary arithmetic.
            if actual['op'] in ('multiply','add'):
                assert actual['op'] == wanted['op'] and sorted(actual['args']) == sorted(wanted['args']), (index,actual,wanted)
            else:
                assert actual == wanted, (index,actual,wanted)
    assert index + 1 == 4456994 and digest.hexdigest() == SOURCE
    def added(index):
        return delta['nodeDelta'][index - delta['baseNodeCount']]

    assert added(4456994) == node('log_positive', 3675262)
    assert added(4456995) == node('multiply', 9, 4456994)
    assert added(4456996) == node('exp', 4456995)
    expressions, indexed, *_ = delta['nativeRegistryDelta']
    lookup = {expr['name']:expr for expr in expressions}
    references = []
    for sign in [1,-1]:
        systems = {}
        for j in range(3):
            name = f'FirstCorrectionGauge_{sign}_{j}'
            own, reference = (lookup[name + '_' + suffix] for suffix in ('own','reference'))
            assert own['parameters'] == reference['parameters']
            body = added(reference['body'])
            assert body['op'] == 'multiply' and body['args'][0] == 4456996
            assert added(body['args'][1]) == node('m3_coupled_expression_partial',
                own['id'], list(next(iter(prefixes))) + own['parameters'][3:], [0] * 16)
            systems[j] = reference['id']
            references.append({'sign':sign,'component':j,'referenceBody':reference['body']})
        for j, field in enumerate(indexed):
            field_rows = [{k:row[k] for k in ('values','guards','derivativeMaps','coefficient','label')}
                          for row in field['rows']]
            assert field_rows == rows
            assert all(row['localSystem'] == systems[j] for row in field['rows'] if row['label']['sign'] == sign)
    assert len(indexed)==3
    atoms = delta['firstCorrectionRequestedJetExpressions']['interiorRoots']
    spatial = []
    for label in atoms:
        field, raw_orders = label.split('@')
        orders = tuple(map(int, raw_orders.split(',')))
        if field.startswith('A') and orders[-1] == 0 and sum(orders) <= 2:
            spatial.append(label)
        elif field == 'b' and label in ('b@0,0,0', 'b@1,0,0', 'b@0,1,0'):
            spatial.append(label)
    assert len(spatial) == 33
    return {'schema':'MathScope.N7.ArchivedFirstGaugeMixedPhysicalScaleControl/1',
            'status':'VERIFIED_ARCHIVED_N1_TYPED_OWN_REFERENCE_SCALE_AND_ROW_MAPS',
            'graphSHA256':SOURCE,'nodes':4456994,'scalarOperationChecks':len(expected),
            'referenceDefinitions':references,'rowMaps':162,'gaugeFields':3,
            'originalSpatialJetLabels': sorted(spatial),
            'ownReferenceCoordinatePowers':['sqrt(rho)','rho^D','rho'],
            'rho':'2^(ellOwn-ellReference)=QReference/QOwn',
            'potentialReferenceMultiplication':'rho^h = rho^(A-1/2)',
            'velocityReferenceMultiplication':'rho^A',
            'physicalSpatialOperators':'Q^(-1/2)*(Dr, R^-1*partial_theta with basis connection, epsilon*partial_Z); epsilon=Q^h',
            'scope':'Positive saved structural control on archived N1 gauge and its genuine original source rows. No live N3 authority or analytic endpoint is claimed.',
            'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}


if __name__ == '__main__':
    assert __debug__
    parser = ArgumentParser(description=__doc__)
    for name in ('goal','archive','output'):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    result = check(args.goal,args.archive)
    with args.output.open('x',encoding='utf-8',newline='\n') as file:
        json.dump(result,file,indent=2)
        file.write('\n')
    print('PASS genuine archived N1 4,456,994 nodes, six potential scale definitions and 162 row maps')
