from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path


def check_third(report):
    assert report['eta'] == 2
    assert report['protected']['nodes'] == 135015
    assert report['protected']['originalGraphUnchanged']
    assert report['protected']['originalDefinitionsUnchanged']
    assert report['protected']['privateSealRechecked']
    assert not report['protected']['operatingSourceTouched']
    data = report['thirdEta']
    assert (data['requested'], data['count'], data['fixedEndpointIntegralCount'], data['originalSubtractedAngularCount']) == (3,12,11,1)
    rows = data['rows']
    assert [r['originalSystem'] for r in rows] == list(range(51,63))
    assert [r['materialized'] for r in rows] == [135021,135236,135243,135250,135257,135264,135271,135278,135285,135292,135299,135306]
    for row in rows:
        assert row['materialized'] == row['direct'] and row['state'] == 'EXACT_MATERIALIZED_SAME_BODY'
        assert set(row['freeCoordinates']) <= {report['eta']}
        assert row['attemptedAliasDegree'] == 4 and row['originalDenial'] == row['aliasDenial']
    compact = [r for r in rows if 'domain' in r['endpoint']]
    assert len(compact) == 11 and len({r['endpoint']['binder'] for r in compact}) == 11
    assert compact[0]['endpoint']['domain'] == [0,report['Xv']]
    assert all(r['endpoint']['domain'] == [0,report['Xplus']] for r in compact[1:])
    for row in compact:
        assert row['endpoint']['expected'] == row['materialized']
        assert row['endpoint']['binder'] not in (report['X'],report['eta'])
    angular = rows[1]
    assert angular['originalBody'] == 133539
    assert angular['endpoint']['originalConstantOfIntegrationRetained']
    assert not angular['endpoint']['originalImproperUnrenormalizedIntegralUsed']
    assert angular['endpoint']['terminalSourceGuard'] == report['Xb']
    assert report['Xb'] != report['Xplus'] and report['Xplus'] != report['Xv']


def receipt(paths):
    reports = []
    pins = {}
    for path in paths:
        body = path.read_bytes()
        report = json.loads(body)
        checks = report['callerChosen']
        assert checks['topWrapperOnly'] and checks['originalNestedDefinitionsUnchanged']
        assert not checks['arbitraryCallerDepthAlwaysSucceeds']
        check_third(report)
        reports.append(report)
        pins[str(checks['degree'])] = sha256(body).hexdigest()
    reports.sort(key=lambda r:r['callerChosen']['degree'])
    assert [r['callerChosen']['degree'] for r in reports] == [7,16,17]
    assert all(r['thirdEta'] == reports[0]['thirdEta'] for r in reports[1:])
    assert all(r['protected'] == reports[0]['protected'] for r in reports[1:])
    probe_receipts=[]
    for report in reports:
        probe = report['callerChosen']
        degree, row = probe['degree'], probe['row']
        nested = row['originalNestedIntegralOperand']
        assert row['originalBody'] == 133486 and row['originalSystem'] == 62
        assert nested['limits'] == [16,16] and nested['requestedOrders'] == [0,degree]
        assert nested['arguments'] == [133483,2] and nested['domain'] == [0,28824]
        assert row['attemptedAliasDegree'] == degree + 1
        if degree <= 16:
            assert row['state'] == 'EXACT_MATERIALIZED_SAME_BODY'
            assert row['materialized'] == row['direct'] == row['endpoint']['expected']
            assert nested['directMaterializationCall'] == row['endpoint']['bodyDerivative']
        else:
            assert row['state'] == 'RESOURCE_LIMIT_DURING_ORIGINAL_BODY_MATERIALIZATION'
            assert row['graphWideLimit'] > degree and row['acceptedOuterAliasDerivativeOrder'] == degree
            assert row['message'] == nested['directMaterializationDenial']
        probe_receipts.append({'degree':degree,'state':row['state'],'originalNestedSystem':nested['system'],
                               'originalNestedOrderLimit':nested['limits'][1],
                               'materialized':row.get('materialized'),'nestedDenial':row.get('message')})
    return {
        'schema':'MathScope.C118.OriginalActualMomentEtaMaterializationReceipt/1',
        'operandsSHA256':pins,'originalProtectedGraph':reports[0]['protected'],
        'thirdEta':{'actualFamilies':12,'independentFixedEndpointComparisons':11,'subtractedLeadingAngularBody':133539,
                    'noProtectedGraphMutation':True,'identicalAcrossThreeSeparateRequests':True,
                    'ordinaryMeaning':'compact fixed-domain differentiation under actual ordinary uniform mixed regularity, plus separately authenticated complete (5.19) for leading angular'},
        'callerChosen':probe_receipts,'numericValuesEvaluated':False,'generalY':'OPEN','finalJets':0,'release':'HOLD',
    }


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('operands', type=Path, nargs=3)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    with args.out.open('xb') as output:
        output.write((json.dumps(receipt(args.operands), indent=2) + '\n').encode())
    print('PASS: all twelve exact original eta3 DAGs, eleven independent fixed-endpoint formulas and the inherited 16-to-17 nested budget boundary')
