"""Check active N3 mean operands and the exact mode-one C3 stencil demand."""
from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
import gzip
import json
from pathlib import Path

PINS = {
    'readback': '7de4981e0adcfb418f5fde3fa272c772a1f9a3f804584b0e84280fde5cd90bfa',
    'functions': '42e1f37bb5f6d41edcd5f5ce422501af1a3cad08ba92bcd7878033e3bda2581b',
    'nodes': 'b205983e82922718f0871b95e355cee9e8b38fd6fa5a042445e0419f47e2f308',
    'longitudinal': '778a1058ffff15e9f80c3066645218b51b4ce52aa75514172008e05150ec94b9',
    'transverse': '121c25bb1dc783bec4004184e829db082d3cf074a6698a2004a011c6ea6863c8',
    'ledger': '62d2ba143b1257af8d80e2b184851ae4441d30bf197491fe00fd946473b8652c',
}

def pinned(path, key):
    data = path.read_bytes()
    if sha256(data).hexdigest() != PINS[key]:
        raise ValueError(f'{key} pin mismatch')
    return data

def main():
    p = ArgumentParser(description=__doc__)
    for key in (*PINS, 'out'):
        p.add_argument('--' + key, type=Path, required=True)
    a = p.parse_args()
    raw = {k: pinned(getattr(a,k), k) for k in PINS}
    readback, registry, old, transverse, ledger = (json.loads(raw[k]) for k in
        ('readback','functions','longitudinal','transverse','ledger'))
    assert readback['status'] == 'VERIFIED_ACTIVE_N3_MODE_ONE_SOURCE_AND_NATIVE_INVERSE_OPERANDS'
    assert readback['nodeCount'] == 6019418 and [r['key'] for r in readback['rows']] == ['0:1','1:1']
    assert readback['modeOneDerivativeClass'] == 'OPEN' and not readback['wholeCoverSeal']
    inverse = json.loads(registry['base']['inverseDefinitions'])
    formals = [2086981,2086982,2086983,2086970,2099548,2099549]
    for entry,name,body in zip(inverse,['GlobalActualTemporal_theta','GlobalActualTemporal_z'],[2108372,2108387]):
        assert entry['name'] == name and entry['body'] == body and entry['parameters'] == formals
        assert entry['directions'] == [*formals[:3],*formals[4:]] and entry['finiteSumDeclaredEqualToLimit'] is False
        assert entry['zeroMode'] == 'The exact normalized Haar mean is projected out.'
    groups = json.loads(registry['definitions'])
    means = [e for group in groups for e in group if e['name'].startswith('ActualInitializedMeanVelocity_')]
    assert [m['name'] for m in means] == [f'ActualInitializedMeanVelocity_{j}' for j in range(3)]
    assert [m['body'] for m in means] == [5814780,5814781,5814782]
    assert all(m['parameters'] == formals for m in means)
    expected = {
      5814780: ['add',[2087169,5754375]], 5814781: ['add',[2099092,5754376]],
      5814782: ['add',[2087168,5754377]], 5754375:['add',[3925184,5754374]],
      5754376:['add',[3925035,5754352]], 5754377:['add',[3925193,5754356]],
      3915210:['m3_aux_inverse_partial',[0,formals,[0]*5]],
      3917356:['m3_aux_inverse_partial',[1,formals,[0]*5]],
      2108372:['add',[2098310,2108371]], 2108387:['add',[2098428,2108386]],
    }
    found = {}
    with gzip.open(a.nodes, 'rt', encoding='utf8') as stream:
        head = json.loads(next(stream))
        assert head['node_count'] == readback['nodeCount']
        for i,line in enumerate(stream):
            if i in expected:
                node=json.loads(line);found[i]=[node['op'],node['args']]
    assert found == expected
    assert ledger['axes'] == ['R','Z','T','xi','v']
    assert ledger['degreeSummary'][3]['meanWave']['maxLeafOrders']['M'] == 4
    indices=set()
    for alpha in product(range(4), repeat=5):
        if sum(alpha) <= 3:
            for base in (-1,0,1,3):
                indices.add(tuple(x+(j==base) for j,x in enumerate(alpha)))
    pos={x for x in indices if x[4]>0}; zero=indices-pos
    assert (len(indices),len(pos),len(zero)) == (121,52,69)
    available={(r['N'],r['L']):r['slowThrough'] for r in old['positive']['rows']}
    for r,z,t,l,n in pos:
        assert (n,l) in available and r+z+t <= available[n,l]
    zero_rows=[]
    for l in range(5):
        values=[x for x in zero if x[3]==l]
        zero_rows.append({'L':l,'requiredSlow':max(sum(x[:3]) for x in values)})
    assert [x['requiredSlow'] for x in zero_rows] == [4,3,2,1,0]
    assert [r['L'] for r in transverse['positive']['transverseRows']] == [1,2,3]
    receipt={
      'status':'ACTIVE_N3_SOURCE_READBACK_AND_EXACT_C3_MEAN_STENCIL',
      'inputPins':PINS,'nodeCount':readback['nodeCount'],'activeMeanBodies':[5814780,5814781,5814782],
      'activeMeanCorrections':[5754375,5754376,5754377],
      'temporalInverseBodies':[2108372,2108387], 'inverseApplications':[3915210,3917356],
      'sourceAuthenticatedFlags':[m.get('sourceAuthenticated') for m in means],
      'keys': ['0:1','1:1'],'commonFormals':formals,'meanIndicesPerComponent':121,
      'positiveLongitudinalIndices':52,'zeroLongitudinalIndices':69,'zeroNHighest':zero_rows,
      'archivedPositiveNCombinatorialCoverage':True,'activeSameFamilyNumericalTransfer':False,
      'fullC3ModeOneBound':False,'numericalFinalJets':'0/67','release':'HOLD',
    }
    with a.out.open('x',encoding='utf8',newline='\n') as out: json.dump(receipt,out,indent=2);out.write('\n')
    print(receipt['status'])

if __name__=='__main__': main()
