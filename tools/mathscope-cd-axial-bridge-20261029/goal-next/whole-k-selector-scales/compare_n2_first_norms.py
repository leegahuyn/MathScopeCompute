"""Compare the remapped first-row norm expressions on the actual N0/N2 exports."""

from argparse import ArgumentParser
from functools import cache
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import gzip
import json
import sys

from check_common_b_scales import N0_SHA, N2_REG, N2_SHA, graph_file, stream


N0_REG='132edc7a71fe43ea25fe79f914ffd2cf3d3c40bd510149d9bf197e52e9470b13'


def main():
    parser=ArgumentParser(description=__doc__)
    for name in ('n0','n2','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    sys.setrecursionlimit(6000)
    sources=[graph_file(args.n0),graph_file(args.n2)]
    early_expr={}
    early_monotone=set()
    with gzip.open(sources[0],'rb') as left,gzip.open(sources[1],'rb') as right:
        left.readline();right.readline()
        for shared,(a,b) in enumerate(zip(left,right)):
            if a!=b:
                break
            if a.startswith(b'{"op":"actual_expression_partial"'):
                early_expr.setdefault(json.loads(a)['args'][0],shared)
            elif a.startswith(b'{"op":"actual_monotone_root"'):
                early_monotone.add(json.loads(a)['args'][0])
    assert shared==354117
    raw=[(p.parent/'original-source-functions.json').read_bytes() for p in sources]
    assert [sha256(x).hexdigest() for x in raw]==[N0_REG,N2_REG]
    base=[json.loads(x)['base'] for x in raw]
    regs=[json.loads(x['expression']) for x in base]
    for key in ('quadratic','picard'):
        a,b=(json.loads(x[key]) for x in base)
        assert a==b[:len(a)]
    monotone=[json.loads(x['monotone']) for x in base]
    assert all(monotone[0][j]==monotone[1][j] for j in early_monotone)
    for j,first_call in early_expr.items():
        assert regs[0][j]==regs[1][j] and regs[0][j]['body']<first_call
    left_meta=json.loads((args.n0/'original-whole-k-prefix.json').read_bytes())['selector']
    right_meta=json.loads((args.n2/'original-n2-prefix.json').read_bytes())['selector']
    with TemporaryFile() as ls,TemporaryFile() as rs:
        _,_,lo=stream(sources[0],N0_SHA,spool=ls)
        _,_,ro=stream(sources[1],N2_SHA,spool=rs)

        @cache
        def node(side,i):
            backing,offsets=(ls,lo) if side==0 else (rs,ro)
            backing.seek(offsets[i]);d=json.loads(backing.readline());return d['op'],d['args']

        @cache
        def compare(i,j,bindings=()):
            if i==j and i<shared and all(x==y or i<min(x,y) for x,y in bindings):
                return
            p,a=node(0,i);q,b=node(1,j)
            assert p==q and len(a)==len(b),(i,j,p,q,a,b)

            def children(xs,ys,env=bindings):
                for x,y in zip(xs,ys,strict=True):
                    compare(x,y,env)

            if p=='coordinate':
                for x,y in reversed(bindings):
                    if i==x or j==y:
                        assert (i,j)==(x,y),(i,j,'lexical',bindings)
                        return
                assert a==b,(i,j,'free coordinate names',a,b)
            elif p in ('rational','source_parameter'):
                assert a==b,(i,j,p,a,b)
            elif p=='definite_integral':
                children(a[2:],b[2:]);compare(a[0],b[0],(*bindings,(a[1],b[1])))
            elif p=='actual_expression_partial':
                assert a[2]==b[2]
                l,r=regs[0][a[0]],regs[1][b[0]]
                assert l['name']==r['name'] and len(l['parameters'])==len(r['parameters']),(i,j,l['name'],r['name'])
                children(a[1],b[1]);compare(l['body'],r['body'],(*bindings,*zip(l['parameters'],r['parameters'],strict=True)))
            elif p in ('integer_power','source_step_derivative'):
                assert a[1]==b[1];compare(a[0],b[0],bindings)
            elif p in ('actual_background_even_profile','actual_background_picard'):
                assert a[:2]==b[:2] and a[4:]==b[4:];children(a[2:4],b[2:4])
            elif p=='actual_natural_series':
                assert a[0]==b[0] and a[3:]==b[3:];children(a[1:3],b[1:3])
            elif p in ('actual_monotone_root','actual_quadratic_root'):
                cut=1 if p=='actual_monotone_root' else 2
                assert a[:cut]==b[:cut];children(a[cut:],b[cut:])
            elif p in ('add','multiply','maximum','inverse','exp','log_positive','sqrt_positive','ceiling','sine','cosine','smooth_piecewise'):
                children(a,b)
            else:
                raise ValueError((i,j,p))

        pairs=[(left_meta['commonEll0'],right_meta['commonEll0'])]
        lrow,rrow=left_meta['rows'][0],right_meta['rows'][0]
        for l,r in zip(lrow['constraints'],rrow['constraints'],strict=True):
            assert (l['kind'],l['derivativeOrder'])==(r['kind'],r['derivativeOrder'])
            pairs.append((l['requiredLog'],r['requiredLog']))
        pairs.append((lrow['logScale'],rrow['logScale']))
        for a,b in pairs:
            compare(a,b)
            print('PASS',a,b,flush=True)
    out={'schema':'MathScope.N7.RemappedFirstSelectorIdentity/1','literalSharedRecordCount':shared,
         'identicalEarlyRegisteredExpressionCount':len(early_expr),
         'pairedRoots':pairs,'exactLexicalComparisons':compare.cache_info().currsize,
         'graphSHA256':[N0_SHA,N2_SHA]}
    raw=(json.dumps(out,indent=2)+'\n').encode();args.out.write_bytes(raw)
    print(sha256(raw).hexdigest(),args.out.name)


if __name__=='__main__':
    main()
