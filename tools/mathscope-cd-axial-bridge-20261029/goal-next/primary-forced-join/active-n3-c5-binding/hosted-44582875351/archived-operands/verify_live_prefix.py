"""Stream the completed hosted N3 graph and bind the original C73/C74 operands."""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import gzip
import json

PINS = {
    'terminal':'190d0d3445c61321dbe465cdc07c7615277d1d91837a9a2de983c3839317b552',
    'oldRegistry':'364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111',
    'c73Slab':'8152230d5531fd00bb0685fbcb380ad1b7a116d8833ee871d92803663aee19e9',
    'c74Slab':'b63588358fd2ee676ffdbba6104d5f0c644828cdecff4215e0d87f09037f6f2c',
    'c73':'a749056e325accfb2582b6814c1e335cfbcdd46ec1bc8fb911c24e4741ae8ccc',
    'c74':'7172068a3e3a86bb40c04516eaa452d8cf668650b826ddfd7a64b5ee40971af4',
}
LIVE_SHA='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
LIVE_DEFS='e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03'
OLD_SHA='831120617913e89c5bb60976fb26f58c6714decc301097a08f72ee23233e0a6a'
LIVE_HEAD='059df9db3a188ce18f3c43a0dca3a92f2e02a4b2'
OLD_COUNT=21681493
LIVE_COUNT=22155584


def canonical(obj):
    # JSON value type is material, for example false, 0, 0.0, and "0".
    return json.dumps(obj,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False)


def check_registry(old,new):
    x,y=old['base'],new['base']
    f0,f1=(json.loads(p['fieldDefinitions']) for p in (x,y))
    d0,d1=(json.loads(p['expressionDefinitions']) for p in (x,y))
    i0,i1=(json.loads(p['inverseDefinitions']) for p in (x,y))
    a0,a1=(json.loads(p['base']['expression']) for p in (x,y))
    assert len(new['counts'])==5 and isinstance(new['definitions'],str)
    entries={
        'covarianceFields':[0,1,2,3,4,5],
        'angularAndPressureDefinitions':[-3,-9,-13,-14,-15,-16,-17,-18],
        'initialTemporalInverseSystems':[0,1],
        'activeWrzPotentialSystems':[32033,32034,32035,32042,32043,32044],
    }
    results={}
    for key,before,after,lookup in [
        ('covarianceFields',f0,f1,lambda n:n),
        ('angularAndPressureDefinitions',d0,d1,lambda n:-1-n),
        ('initialTemporalInverseSystems',i0,i1,lambda n:n),
        ('activeWrzPotentialSystems',a0,a1,lambda n:n),
    ]:
        results[key]=[]
        for index in entries[key]:
            j=lookup(index)
            assert canonical(before[j])==canonical(after[j]), (key,index)
            row=after[j]
            brief={'id':index,'name':row['name']}
            if 'body' in row:
                brief['body']=row['body']
            if 'rows' in row:
                brief['allSignedRowsExactlyEqual']=len(row['rows'])
            results[key].append(brief)
    assert f1[2]['name']=='GlobalCompleteCommonTorus_rz' and len(f1[2]['rows'])==162
    assert i1[1]['zeroMode']=='The exact normalized Haar mean is projected out.'
    return results


def read_stream(path, selected, manifest):
    live, old_header_trial=sha256(),sha256()
    old_header_trial.update(f'{{"schema":"MathScope.M3.FullNodesJSONL/1","node_count":{OLD_COUNT}}}\n'.encode())
    matches, failures, checked, total=0,[],set(),0
    with gzip.open(path,'rb') as stream:
        header=stream.readline()
        assert json.loads(header)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':LIVE_COUNT}
        live.update(header)
        total+=len(header)
        for i,line in enumerate(stream):
            live.update(line)
            total+=len(line)
            if i<OLD_COUNT:
                old_header_trial.update(line)
            if i not in selected:
                continue
            record=json.loads(line)
            if not isinstance(record,dict) or set(record)!={'op','args'}:
                raise ValueError(f'Unexpected typed source shape at node {i}')
            actual=canonical([record['op'],record['args']])
            checked.add(i)
            if actual==selected[i]:
                matches+=1
            elif len(failures)<16:
                failures.append({'id':i,'expected':selected[i],'actual':actual})
    assert i+1==LIVE_COUNT==manifest['node_count']
    assert total==1024352367==manifest['node_stream_uncompressed_bytes']
    assert live.hexdigest()==LIVE_SHA==manifest['node_stream_sha256']
    assert checked==set(selected) and matches+len(failures)>=min(len(selected),matches+16)
    return {'verifiedLiveNodeStreamSHA256':live.hexdigest(),'nodeCount':i+1,'streamBytes':total,
            'comparedUniqueTypedRecords':len(checked),'matches':matches,'mismatches':len(checked)-matches,
            'firstMismatches':failures,'oldCountHeaderNormalizedDigest':old_header_trial.hexdigest(),
            'entireOldNodeStreamEqualsLivePrefix':old_header_trial.hexdigest()==OLD_SHA}


def main():
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('workspace',type=Path)
    parser.add_argument('output',type=Path)
    parser.add_argument('--host',type=Path)
    args=parser.parse_args()
    local=args.workspace/'work/goal-next'
    old=local/'continuation34/hosted-43296617887-n3/witness'
    c73=local/'continuation73/prehaar-wrz'
    c74=local/'continuation74/time-inverse'
    host=args.host or local/'continuation70/hosted-44582875351/first-correction-spatial-source'
    inputs={
        'terminal':local/'continuation70/terminal-run-44582875351.json',
        'oldRegistry':old/'original-source-functions.json',
        'c73Slab':c73/'source-slab.json','c74Slab':c74/'source-native-final.json',
        'c73':c73/'prehaar-wrz-final.json','c74':c74/'temporal-projection.json',
    }
    raw={name:p.read_bytes() for name,p in inputs.items()}
    for k,data in raw.items():
        assert sha256(data).hexdigest()==PINS[k],k
    terminal=json.loads(raw['terminal'])
    assert terminal['databaseId']==44582875351 and terminal['headSha']==LIVE_HEAD
    assert terminal['status']=='completed' and terminal['conclusion']=='success'
    export=(host/'original-source-export-manifest.json').read_bytes()
    manifest=json.loads(export)
    proof=(host.parent/'first-correction-spatial-export.json').read_bytes()
    assert canonical(json.loads(proof)['snapshot'])==canonical(manifest)
    assert manifest['schema']=='MathScope.M3.SourceGraphReplayManifest/1'
    assert manifest['executing_commit']==LIVE_HEAD and manifest['extended_coupled_registry_included'] is True
    assert manifest['scope']=='ACTIVE_N3_FIRST_CORRECTION_SPATIAL_INGRESS_NOT_NUMERICAL'
    assert manifest['exact_source_node_stream_preserved'] is True
    assert manifest['final_all_cycle_A_b_p'] is False and manifest['actual_final_67_jets_certified']==0
    registry=(host/'original-source-functions.json').read_bytes()
    assert sha256(registry).hexdigest()==LIVE_DEFS==manifest['definitions_sha256']
    declarations=check_registry(json.loads(raw['oldRegistry']),json.loads(registry))
    slabs=[json.loads(raw[k])['nodes'] for k in ('c73Slab','c74Slab')]
    selected={}
    for slab in slabs:
        for index,record in slab.items():
            i=int(index)
            item=canonical(record)
            assert i not in selected or selected[i]==item, i
            selected[i]=item
    old_c73=json.loads(raw['c73'])['actualInitialMap']
    old_c74=json.loads(raw['c74'])['sourceIDs']
    def ids(obj):
        if type(obj) is int:
            yield obj
        elif isinstance(obj,dict):
            for value in obj.values():
                yield from ids(value)
        elif isinstance(obj,list):
            for value in obj:
                yield from ids(value)
    assert old_c73['application']==old_c74['Wrz']==17753400
    assert set(ids(old_c74))<=set(selected)
    matched=read_stream(host/'original-source-nodes.jsonl.gz',selected,manifest)
    assert matched['mismatches']==0, matched['firstMismatches']
    result={
        'status':'VERIFIED_SAME_LIVE_ACTIVE_N3_ORIGINAL_C73_C74_NATIVE_OPERANDS',
        'archivedInputPins':PINS,
        'liveRun':{'id':44582875351,'headSha':LIVE_HEAD,'originalPr30Commit':manifest['original_pr30_commit'],
                   'conclusion':'success','scope':manifest['scope']},
        'liveManifestSHA256':sha256(export).hexdigest(),'liveExportReceiptSHA256':sha256(proof).hexdigest(),
        'liveRegistrySHA256':LIVE_DEFS,'nativeDefinitionsExactlyEqual':declarations,
        'nativeTypedSourceReadback':matched,
        'c73Field':old_c73['application'],'c74SourceIDs':old_c74,
        'scope':'Actual original C73 pre-Haar Wrz and C74 initial P0/Jz0 operand identity on the same live exported N3 graph. Later Signed, FiveMap, endpoint, gauge, and final scopes stay separate.',
        'conditionalAnalyticBoundsRemainConditional':True,'finalJets':0,'release':'HOLD',
    }
    with args.output.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'],len(selected),matched['entireOldNodeStreamEqualsLivePrefix'])


if __name__=='__main__':
    main()
