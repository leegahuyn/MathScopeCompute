"""Bind each higher normalized pressure FTC face to original native jets."""

from argparse import ArgumentParser
from collections import Counter
from contextlib import ExitStack
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import gzip
import json
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "whole-k-atlas" / "diagonal-n2"))
from compare_selector_exports import Export, Compare, SOURCE


def polynomial(node, root):
    op,a=node(root)
    if op=='rational':
        return {0:Fraction(*map(int,a))}
    if op=='source_parameter':
        assert a==['h']
        return {1:Fraction(1)}
    if op=='integer_power':
        assert node(a[0])==('source_parameter',['h']) and a[1]>=0
        return {a[1]:Fraction(1)}
    assert op in {'add','multiply'},(root,op,a)
    total={0:Fraction(op=='multiply')}
    for k in a:
        child=polynomial(node,k)
        if op=='add':
            total={d:total.get(d,0)+child.get(d,0) for d in total.keys()|child.keys()}
        else:
            out=Counter()
            for i,x in total.items():
                for j,y in child.items():
                    out[i+j]+=x*y
            total=dict(out)
    return {d:x for d,x in total.items() if x}


def verify_prefix(graph, prefix):
    digest=sha256()
    with gzip.open(graph.graph,'rb') as stream:
        stream.readline()
        for _ in range(prefix['nodeCount']):
            line=stream.readline()
            assert line
            digest.update(line)
    assert digest.hexdigest()==prefix['nodePrefixSHA256']
    annotations=0
    for kind in ('expression','picard','monotone','quadratic'):
        old=json.loads(prefix['registry'][kind]);count=prefix['registry'][kind+'Count']
        assert len(old)==count and len(graph.base[kind])>=count
        for a,b in zip(old,graph.base[kind][:count],strict=True):
            if a!=b:
                assert kind=='expression' and b=={**a,'historicalBodyPreserved':True},(kind,a,b)
                annotations+=1
    assert graph.base['fixed']==json.loads(prefix['registry']['fixed'])
    return {'nodes':prefix['nodeCount'],'SHA256':digest.hexdigest(),'historicalBodyPreservedFlags':annotations,
            **{k:prefix['registry'][k+'Count'] for k in ('expression','picard','monotone','quadratic')}}


def pressure_face(graph, root, native, Xplus):
    binders={}
    limits={(0,Xplus):0,(20,1):1}
    op,a=graph.node(root)
    while op=='definite_integral':
        body,var,lo,hi=a
        d=limits[(lo,hi)]
        assert d not in binders and graph.node(var)[0]=='coordinate'
        binders[d]=var
        op,a=graph.node(body)
    assert list(binders)==sorted(binders)
    assert op=='sqrt_positive' and len(a)==1
    op,a=graph.node(a[0]);assert op=='add' and len(a)==2 and 1 in a
    op,a=graph.node(next(i for i in a if i!=1));assert op=='integer_power' and a[1]==2
    op,a=graph.node(a[0]);assert op=='actual_expression_partial' and a[0]==native
    assert a[1]==[binders.get(0,0),binders.get(1,20)]
    assert len(a[2])==2 and all(type(x) is int and x>=0 for x in a[2])
    mask=sum(1<<d for d in binders)
    base=tuple(x-(d in binders) for d,x in enumerate(a[2]))
    assert all(x>=0 for x in base)
    return mask,base


def bind_order(graph, row, new_node, prefix):
    n=row['n']
    selector=graph.selector['rows'][n-1]
    target=[c for c in selector['constraints'] if c['kind']=='normalized-pressure']
    assert len(target)==n+1
    root=target[-1]['bound']
    assert target[-1]['derivativeOrder']==n
    required=target[-1]['requiredLog']
    op,a=graph.node(required);assert op=='multiply' and len(a)==2
    inverse,numerator=sorted(a,key=lambda x:graph.node(x)[0],reverse=True)
    op,a=graph.node(inverse);assert op=='inverse' and len(a)==1
    assert polynomial(graph.node,a[0])=={1:Fraction(n)}
    op,a=graph.node(numerator);assert op=='add' and len(a)==2
    [log_bound]=[i for i in a if graph.node(i)==('log_positive',[root])]
    [log_term]=[i for i in a if i!=log_bound]
    op,a=graph.node(log_term);assert op=='multiply' and len(a)==2
    assert {tuple(graph.node(i)[1]) for i in a}=={(24,),(str(n),'1')}
    assert ('log_positive',[24]) in [graph.node(i) for i in a] and graph.node(24)==('rational',['2','1'])
    assert selector['sourceCoefficientRoots']['Pi']==row['original']==prefix['sourceCoefficientRoots'][n-1]
    op,a=graph.node(row['original']);assert op=='actual_expression_partial' and a[2]==[0,0]
    native=a[0]
    assert graph.base['expression'][native]['name']==f'ActualOrder{n}Pressure'
    compare=Compare(graph,graph,0)
    terms=compare.flatten(0,root,'maximum')
    assert len(terms)==len(set(terms)) and terms.count(1)==1
    expected={(r,e,k) for r in range(n+1) for e in range(n-r+1) for k in range(n-r-e+1)}
    seen=set()
    face_roots=set()
    weighted_terms=[]
    for i in terms:
        if i==1:
            continue
        op,a=graph.node(i)
        if op=='multiply':
            assert len(a)==2
            candidates=[x for x in a if len(compare.flatten(0,x,'add'))==4]
            # A weight can also have four additive leaves. Only the FTC
            # has definite-integral and square-root direct terms.
            candidates=[x for x in candidates if {graph.node(k)[0] for k in compare.flatten(0,x,'add')}=={'definite_integral','sqrt_positive'}]
            [ftc]=candidates
            [weight]=[x for x in a if x!=ftc]
        else:
            assert op=='add'
            ftc,weight=i,1
        faces=compare.flatten(0,ftc,'add')
        assert len(faces)==4
        parts=[pressure_face(graph,x,native,prefix['originalEndpoints']['Xplus']) for x in faces]
        assert {mask for mask,_ in parts}==set(range(4))
        [base]=set(b for _,b in parts)
        p=polynomial(graph.node,weight)
        [k]=[j for j,w in enumerate(row['weights']) if p==polynomial(new_node,w)]
        key=(*base,k)
        assert key in expected and key not in seen,key
        seen.add(key)
        face_roots.update(faces)
        weighted_terms.append({'baseOrders':base,'eulerOrder':k,'sourceFTC':ftc,'sourceWeight':weight,'sourceWeightedTerm':i})
    assert seen==expected
    assert len(face_roots)==4*len(row['table'])
    for item in row['table']:
        assert len(item['faces'])==4 and len(item['upperTerms'])==n-item['r']-item['e']+1
    for c in target[:-1]:
        assert set(compare.flatten(0,c['bound'],'maximum'))<=set(terms)
    return {'n':n,'originalNativeSystem':native,'originalNativeBody':graph.base['expression'][native]['body'],
            'originalBound':root,'originalRequiredLog':required,'actualUniqueFaces':len(face_roots),
            'exactWeightedTermMatches':len(seen),'matchedTerms':weighted_terms,'upperBound':row['upper'],
            'upperRequiredLog':row['requiredLog'],'allLowerDerivativeMaximaSubsets':True}


def main():
    parser=ArgumentParser(description=__doc__)
    for name in ('original','norm-packet','prefix','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    raw=args.norm_packet.read_bytes();packet=json.loads(raw)
    prefix_raw=args.prefix.read_bytes();prefix=json.loads(prefix_raw)
    assert packet['sourceCommit']==prefix['sourceCommit']==SOURCE
    nodes={x['id']:(x['node']['op'],x['node']['args']) for x in packet['trace']['nodes']}
    with ExitStack() as stack:
        graph=Export(args.original,stack)
        literal=verify_prefix(graph,prefix)
        assert packet['originalDefinitions']==graph.base['fixed']['source']['parametersExactExpressions']
        rows=[bind_order(graph,row,nodes.__getitem__,prefix) for row in packet['pressure']]
        assert [x['n'] for x in rows]==[2,3]
        result={'schema':'MathScope.N7.ActualHigherNormalizedPressureFTCFaces/1','sourceCommit':SOURCE,
                'actualGraphSHA256':graph.manifest['node_stream_sha256'],'literalProducerPrefix':literal,
                'sourceNormPacketSHA256':sha256(raw).hexdigest(),'sourcePrefixCaptureSHA256':sha256(prefix_raw).hexdigest(),
                'rows':rows,'proof':'Each original face integrates sqrt(1+native mixed jet squared) over the same side lengths. Its source-bound mixed-jet envelope gives upper integrand 1+M. All Euler weights match as exact nonnegative polynomials in h.'}
    data=(json.dumps(result,indent=2)+'\n').encode()
    args.out.write_bytes(data)
    print('PASS',[(r['n'],r['actualUniqueFaces'],r['exactWeightedTermMatches']) for r in rows])
    print(sha256(data).hexdigest(),args.out.name)


if __name__=='__main__':
    main()
