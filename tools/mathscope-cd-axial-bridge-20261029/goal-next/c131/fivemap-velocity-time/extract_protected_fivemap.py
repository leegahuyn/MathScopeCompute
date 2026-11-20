"""Stream the protected C70 source and inspect exact FiveMap moment/velocity nodes."""
from argparse import ArgumentParser
import gzip
from hashlib import sha256
import json
from pathlib import Path

p=ArgumentParser(description=__doc__)
p.add_argument("--artifact",required=True,type=Path)
p.add_argument("--out",required=True,type=Path)
a=p.parse_args()
manifest=(a.artifact/"original-source-export-manifest.json").read_bytes()
assert sha256(manifest).hexdigest()=="8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a"
native=(a.artifact/"original-source-functions.json").read_bytes()
assert sha256(native).hexdigest()=="e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03"
raw=json.loads(native)
registry=json.loads(raw["definitions"])
names=[r for r in registry[0] if 1329<=int(r["id"].split(":")[-1])<=1337]
need={17732737,17732744,17732748,17732749,17732750,17733137,17743711,17743713,17743734,
      17745430,17745431,17745445,17745446,17745449,19570770,22150943,22150942,22150838,22150839,22151940,22151944,22151962}
need|=set(range(0,32))|set(range(3605,3629))|{28826,669,71672}
need|=set(range(17732730,17732811))|set(range(17732874,17732892))
need|=set(range(17743688,17743737))|set(range(17744648,17744906))
lo,hi=22151018,22151967
s=sha256()
records={}
with gzip.open(a.artifact/"original-source-nodes.jsonl.gz","rb") as f:
    hdr=f.readline()
    assert json.loads(hdr)=={"schema":"MathScope.M3.FullNodesJSONL/1","node_count":22155584}
    s.update(hdr)
    for i,b in enumerate(f):
        s.update(b)
        if lo<=i<=hi or i in need:
            records[i]=json.loads(b)
assert s.hexdigest()=="faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
assert i+1==22155584
a.out.write_bytes((json.dumps({"protectedStream":s.hexdigest(),"protectedRegistry":sha256(native).hexdigest(),"records":records,"nativeMomentsAndFields":names},indent=2)+"\n").encode())
print("PASS authenticated original stream",i+1,"stored record slice",len(records))
