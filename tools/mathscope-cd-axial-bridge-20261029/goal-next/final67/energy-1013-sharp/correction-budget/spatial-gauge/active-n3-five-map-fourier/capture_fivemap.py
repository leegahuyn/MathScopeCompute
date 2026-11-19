"""Verify the same-live exported graph and retain the first FiveMap source window."""
from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import gzip
import json

SOURCE='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
WINDOWS=((17732734,17732757),(17745429,17745432),(22150780,22151000),
         (22151534,22151630),(22151880,22152005),(22153210,22153227))


def main():
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('host',type=Path)
    parser.add_argument('out',type=Path)
    args=parser.parse_args()
    manifest=json.loads((args.host/'original-source-export-manifest.json').read_bytes())
    assert manifest['node_stream_sha256']==SOURCE and manifest['node_count']==22155584
    assert manifest['scope']=='ACTIVE_N3_FIRST_CORRECTION_SPATIAL_INGRESS_NOT_NUMERICAL'
    capture=set().union(*(set(range(lo,hi+1)) for lo,hi in WINDOWS))
    nodes={}
    size=0
    digest=sha256()
    with gzip.open(args.host/'original-source-nodes.jsonl.gz','rb') as src:
        header=src.readline()
        assert json.loads(header)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':22155584}
        digest.update(header)
        size+=len(header)
        for i,line in enumerate(src):
            digest.update(line)
            size+=len(line)
            if i in capture:
                nodes[i]=json.loads(line)
    assert i+1==22155584 and size==1024352367 and digest.hexdigest()==SOURCE
    assert nodes.keys()==capture
    with args.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump({'sha256':SOURCE,'bytes':size,'nodeCount':i+1,'nodes':nodes},out,indent=2)
        out.write('\n')
    print(f'Authenticated {i+1} nodes and retained {len(nodes)} FiveMap occurrence records')


if __name__=='__main__':
    main()
