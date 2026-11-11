"""Exact typed comparison of all ten higher FTC source clauses."""

from argparse import ArgumentParser
from contextlib import ExitStack
from functools import lru_cache
from hashlib import sha256
from pathlib import Path
import gzip
import json
import sys

from bind_higher_normalized_pressure_ftc import verify_prefix
from compare_selector_exports import Compare, Difference, Export, SOURCE


class Rebuilt:
    def __init__(self,path,prefix):
        raw=path.read_bytes()
        self.digest=sha256(raw).hexdigest()
        payload=json.loads(gzip.decompress(raw))
        assert payload['schema']=='MathScope.N7.ExactHigherFTCReconstruction/1' and payload['sourceCommit']==SOURCE
        self.nodes=payload['nodes'];self.rows=payload['rows']
        self.base={k:json.loads(v) for k,v in payload['registry'].items() if isinstance(v,str)}
        assert payload['baseCount']==prefix['nodeCount']
        digest=sha256()
        for node in self.nodes[:payload['baseCount']]:
            digest.update((json.dumps(node,separators=(',',':'),ensure_ascii=False)+'\n').encode())
        assert digest.hexdigest()==prefix['nodePrefixSHA256']
        for kind in ('expression','picard','monotone','quadratic'):
            count=prefix['registry'][kind+'Count']
            assert self.base[kind][:count]==json.loads(prefix['registry'][kind]),kind
        assert self.base['fixed']==json.loads(prefix['registry']['fixed'])

    @lru_cache(maxsize=180_000)
    def node(self,i):
        assert type(i) is int and 0<=i<len(self.nodes)
        row=self.nodes[i]
        return row['op'],row['args']


def main():
    parser=ArgumentParser(description=__doc__)
    for name in ('original','rebuilt','prefix','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    sys.setrecursionlimit(6000)
    raw=args.prefix.read_bytes();prefix=json.loads(raw)
    assert prefix['sourceCommit']==SOURCE
    with ExitStack() as stack:
        original=Export(args.original,stack)
        literal=verify_prefix(original,prefix)
        rebuilt=Rebuilt(args.rebuilt,prefix)
        compare=Compare(original,rebuilt,prefix['nodeCount'])
        matched=[]
        for row in rebuilt.rows:
            n=row['n']
            for kind in row['bounds']:
                [clause]=[c for c in original.selector['rows'][n-1]['constraints'] if (c['kind'],c['derivativeOrder'])==(kind,n)]
                targets={'bound':[clause['bound'],row['bounds'][kind]],'requiredLog':[clause['requiredLog'],row['required'][kind]]}
                for target,pair in targets.items():
                    compare.context=(n,kind,target)
                    try:
                        compare.compare(*pair)
                    except Difference as exc:
                        args.out.write_text(json.dumps({'failed':compare.context,'reason':exc.reason,'frames':exc.frames,
                            'firstOrderedMismatch':compare.first_ordered_difference,'matched':matched},indent=2)+'\n',encoding='utf-8')
                        raise SystemExit(f'FAIL {compare.context}: {exc.reason}')
                matched.append({'order':n,'kind':kind,**targets})
                print('PASS',n,kind,flush=True)
        assert len(matched)==10
        negative=[]
        for left,right in [(matched[0]['bound'][0],1),(matched[3]['bound'][0],matched[4]['bound'][1])]:
            try:
                compare.compare(left,right)
            except Difference as exc:
                negative.append({'pair':[left,right],'rejected':exc.reason})
            else:
                raise AssertionError('wrong actual root accepted')
        result={'schema':'MathScope.N7.ActualAllHigherFTCOriginalSourceBinding/1','sourceCommit':SOURCE,
                'originalGraphSHA256':original.manifest['node_stream_sha256'],'reconstructedASTSHA256':rebuilt.digest,
                'prefixCaptureSHA256':sha256(raw).hexdigest(),'literalSourcePrefix':literal,
                'matched':matched,'negativeControls':negative,'normalizations':dict(compare.normalizations),
                'firstAcceptedNormalization':compare.first_normalized_pair,
                'scope':'Exact identity of actual FTC and required-log expression bodies with reconstructed original operands. Analytic upper operands and numerical comparisons use separate receipts.'}
    raw=(json.dumps(result,indent=2)+'\n').encode();args.out.write_bytes(raw)
    print(sha256(raw).hexdigest(),args.out.name)


if __name__=='__main__':
    main()
