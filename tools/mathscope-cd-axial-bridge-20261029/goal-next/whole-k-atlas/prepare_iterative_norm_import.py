"""Replace only recursive traversal in the pinned leading-norm importer."""
from hashlib import sha1, sha256
import json
from pathlib import Path
import sys


NAME = "research-ide/mathscope-m2/navier/actual-residual-order-induction-norms.mjs"
BLOB = "0a67015df8828294d0431d43cc48e34cadc20156"
OLD = b"""  const map=new Map(),copy=id=>{if(map.has(id))return map.get(id);const n=program.nodes[id];let out;
    if(n.op==='rational')out=G.q(...n.args.map(BigInt));else if(n.op==='source_parameter')out=G.parameter(n.args[0]);
    else if(n.op==='add')out=G.add(...n.args.map(copy));else if(n.op==='multiply')out=G.mul(...n.args.map(copy));else if(n.op==='inverse')out=G.inv(copy(n.args[0]));
    else if(n.op==='integer_power')out=G.pow(copy(n.args[0]),n.args[1]);else if(n.op==='exp')out=G.exp(copy(n.args[0]));else if(n.op==='log_positive')out=G.log(copy(n.args[0]));else if(n.op==='sqrt_positive')out=G.sqrt(copy(n.args[0]));
    else if(n.op==='maximum')out=G.maximum(...n.args.map(copy));else fail('INVALID_SOURCE_CONSTRUCTION','Unknown leading norm operation '+n.op);
    map.set(id,out);return out;
  };return copy(root);"""
NEW = b"""  const map=new Map(),stack=[];
  function push(id){
    const node=program.nodes[id];
    const children=['add','multiply','maximum'].includes(node.op)?node.args:
      ['inverse','integer_power','exp','log_positive','sqrt_positive'].includes(node.op)?node.args.slice(0,1):[];
    if(children.some(child=>!Number.isSafeInteger(child)||child<0||child>=id||!program.nodes[child]))
      fail('INVALID_SOURCE_CONSTRUCTION','Invalid leading norm DAG operand.');
    stack.push({id,node,children,next:0});
  }
  push(root);
  while(stack.length){
    const frame=stack.at(-1),{id,node:n,children}=frame;
    if(frame.next<children.length){
      const child=children[frame.next++];
      if(!map.has(child))push(child);
      continue;
    }
    const copy=child=>map.get(child);
    let out;
    if(n.op==='rational')out=G.q(...n.args.map(BigInt));else if(n.op==='source_parameter')out=G.parameter(n.args[0]);
    else if(n.op==='add')out=G.add(...n.args.map(copy));else if(n.op==='multiply')out=G.mul(...n.args.map(copy));else if(n.op==='inverse')out=G.inv(copy(n.args[0]));
    else if(n.op==='integer_power')out=G.pow(copy(n.args[0]),n.args[1]);else if(n.op==='exp')out=G.exp(copy(n.args[0]));else if(n.op==='log_positive')out=G.log(copy(n.args[0]));else if(n.op==='sqrt_positive')out=G.sqrt(copy(n.args[0]));
    else if(n.op==='maximum')out=G.maximum(...n.args.map(copy));else fail('INVALID_SOURCE_CONSTRUCTION','Unknown leading norm operation '+n.op);
    map.set(id,out);
    stack.pop();
  }
  return map.get(root);"""


def overlay(repo, output):
    source = repo / NAME
    original = source.read_bytes()
    assert sha1(f"blob {len(original)}\0".encode()+original).hexdigest() == BLOB
    assert original.count(OLD) == 1 and NEW not in original
    patched = original.replace(OLD, NEW)
    assert patched.replace(NEW, OLD) == original
    source.write_bytes(patched)
    result = {
        "schema": "MathScope.N7.IterativeOriginalNormImportOverlay/1",
        "source": NAME,
        "originalGitBlob": BLOB,
        "oldSHA256": sha256(original).hexdigest(),
        "newSHA256": sha256(patched).hexdigest(),
        "scope": "Same per-root memoized left-to-right depth-first traversal, emitted operations and operands. Active frames are held in an explicit stack.",
        "reversible": True,
    }
    output.write_bytes((json.dumps(result, indent=2)+"\n").encode())


if __name__ == "__main__":
    overlay(Path(sys.argv[1]), Path(sys.argv[2]))
