"""Match original terminal norm source to the live B definition across graph numbering."""

from argparse import ArgumentParser
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys


STREAM='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
PARAMETERS='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
ACTIVE='primary-forced-join/active-n3-c5-binding'
LIVE_B=17717057
LIVE_DELTA=17716930
LIVE_ETA=2
LIVE_B0=17717108
LIVE_BOX=[0,20,1010,1]
ARITHMETIC={'add','multiply','inverse','exp','log_positive','sqrt_positive','maximum',
            'minimum','smooth_piecewise','sine','cosine','ceiling','floor'}


def sha(raw):
    return sha256(raw).hexdigest()


class Digest:
    def __init__(self,record,definitions):
        self.record=record
        self.defs=definitions
        self.nodes=set()
        self.calls=set()

    @cache
    def node(self,i,bound):
        row=self.record(i)
        op,a=row['op'],row['args']
        self.nodes.add(i)
        if op=='coordinate':
            assert i in bound, (i,a,'unexpected free coordinate',bound)
            return 'bound',bound[::-1].index(i)
        if op in ('rational','source_parameter'):
            return op,tuple(a)
        visit=lambda root:self.node(root,bound)
        if op in ARITHMETIC:
            children=tuple(visit(x) for x in a)
            if op in ('add','multiply','maximum','minimum'):
                children=tuple(sorted(children))
        elif op in ('source_step_derivative','integer_power'):
            children=(visit(a[0]),a[1])
        elif op=='definite_integral':
            body,variable,lo,hi=a
            assert self.record(variable)['op']=='coordinate'
            children=(self.node(body,bound+(variable,)),visit(lo),visit(hi))
        elif op=='actual_expression_partial':
            idx,actual,orders=a
            decl=self.defs[idx]
            assert len(actual)==len(orders)==len(decl['parameters'])
            assert not decl.get('unspecifiedOracle',False)
            self.calls.add(decl['name'])
            children=(decl['name'],self.node(decl['body'],tuple(decl['parameters'])),
                      tuple(visit(arg) for arg in actual),tuple(orders))
        else:
            raise AssertionError((i,op,'unsupported operation',a))
        return op,sha(json.dumps(children,sort_keys=True,separators=(',',':')).encode())


def main():
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled.')
    cli=ArgumentParser(description=__doc__)
    for key in ('goal','artifact','cache','norm','private-graph','out'):
        cli.add_argument('--'+key,type=Path,required=True)
    a=cli.parse_args()
    raw=a.private_graph.read_bytes()
    private=json.loads(raw)
    norm_raw=a.norm.read_bytes()
    norm=json.loads(norm_raw)
    assert norm['status']=='VERIFIED_ORIGINAL_ORDER_TWO_TERMINAL_NORM_CONSTRUCTION'
    assert norm['closurePrivateSHA256']==sha(raw)
    assert [r['order'] for r in norm['finiteTerminalOrders']]==[0,1,2]
    assert private['sourceBinding']==norm['originalSource']
    assert norm['originalSource']['parameterExpressionSHA256']==PARAMETERS
    assert norm['allMixedTerminalNorms']==6
    assert all(r['pass'] is True for r in norm['checks'])
    new_defs=json.loads(private['snapshot']['expression'])
    new=Digest(private['nodes'].__getitem__,new_defs)
    eta=next(i for i,r in enumerate(private['nodes']) if r=={'op':'coordinate','args':['eta']})
    new_b=new.node(private['bBody'],(private['delta'],eta))
    new_b0=new.node(private['terminalNorms'][0]['bound'],())

    goal=a.goal/ACTIVE
    sys.path[:0]=[str(goal/'spatial-readback'),str(goal/'live-wave-gauge/signed')]
    import source_stream,source_cache
    folder=a.artifact/'first-correction-spatial-source'
    manifest=json.loads((folder/source_stream.MANIFEST).read_bytes())
    n=source_stream.Native(folder,manifest)
    old_defs=json.loads(n.base_snapshot['base']['expression'])
    assert old_defs[32006]['body']==LIVE_B and old_defs[32006]['parameters']==[LIVE_DELTA,LIVE_ETA]
    assert old_defs[32006]['name']=='ActualOrderOneTerminalPrimitiveSmoothCoefficient'
    stream=source_cache.load(source_stream,folder,manifest,22153782,a.cache)
    try:
        assert stream.verify['sha256']==STREAM
        old=Digest(stream.record,old_defs)
        live_b=old.node(LIVE_B,(LIVE_DELTA,LIVE_ETA))
        live_b0=old.node(LIVE_B0,())
    finally:
        stream.__exit__()
    assert live_b==new_b,(live_b,new_b,'actual complete B expression')
    assert live_b0==new_b0,(live_b0,new_b0,'actual terminal rectangular FTC constant B0')
    pur=[]
    [system]=[i for i,row in enumerate(new_defs)
              if row['name']=='ActualOrderOneTerminalPrimitiveSmoothCoefficient']
    assert new_defs[system]['body']==private['bBody']
    parse=private['nodes'].__getitem__
    def sum_of_faces(i,faces):
        if i in faces:
            return [i]
        node=parse(i)
        assert node['op']=='add'
        return [q for child in node['args'] for q in sum_of_faces(child,faces)]

    for order,row in enumerate(private['terminalNorms']):
        assert (row['deltaOrder'],row['etaOrder'])==(order,0)
        arguments=[private['delta'],eta]
        assert row['coordinates']==arguments
        assert parse(row['body'])=={'op':'actual_expression_partial','args':[system,arguments,[order,0]]}
        assert len(row['faces'])==4 and row['finiteExactIntegral'] is True
        assert [parse(i) for i in row['lower']+row['upper']]==[
            {'op':'rational','args':args} for args in (['0','1'],['-1','1'],['1','4'],['1','1'])]
        orders=[]
        for mask,face in enumerate(row['faces']):
            assert face['mask']==mask
            assert face['selectedCoordinates']==[v for j,v in enumerate(arguments) if mask&(1<<j)]
            desired=[order+(mask&1),(mask>>1)&1]
            assert parse(face['derivative'])=={'op':'actual_expression_partial',
                                               'args':[system,arguments,desired]}
            orders.append(desired)
        face_ids=[face['upperBound'] for face in row['faces']]
        assert sorted(sum_of_faces(row['bound'],set(face_ids)))==sorted(face_ids)
        pur.append({'order':order,'bound':row['bound'],'faceCount':len(row['faces']),
                    'actualDerivativeOrdersAcrossFaces':orders,'faceMajorants':face_ids,
                    'closedBox':[row['lower'],row['upper']],
                    'boundTypedDigest':new.node(row['bound'],())[1]})
    assert [x['bound'] for x in pur]==[r['bound'] for r in norm['finiteTerminalOrders']]
    result={'status':'VERIFIED_ORIGINAL_TERMINAL_B_AND_B0_CROSS_GRAPH_BINDING',
            'sourceStreamSHA256':STREAM,'parameterExpressionSHA256':PARAMETERS,
            'normMetadataSHA256':sha(norm_raw),'newPrivateGraphSHA256':sha(raw),
            'typedAlphaBinding':{'actualB':LIVE_B,'actualB0':LIVE_B0,'rebuiltB':private['bBody'],
                                   'rebuiltB0':pur[0]['bound'],'commonBDigest':new_b[1],
                                   'commonB0Digest':new_b0[1],
                                   'visitedLiveNodes':len(old.nodes),'visitedRebuiltNodes':len(new.nodes),
                                   'rootedNativeDefinitions':sorted(new.calls)},
            'pureTerminalRectangularNorms':pur,
            'conditional':'The separately constructed B1 and B2 are exact finite positive FTC functionals for the same original B. Ordinary derivatives, positive terminal denominators and integral interpretation remain mathematical premises. They have not been evaluated numerically.',
            'open':['Original whole angular moment, remaining Haar covariances, full N7/N8 and final jets.'],
            'finalJets':0,'release':'HOLD'}
    with a.out.open('x',encoding='utf-8',newline='\n') as f:
        f.write(json.dumps(result,indent=2)+'\n')
    print(result['status'],flush=True)


if __name__=='__main__':
    main()
