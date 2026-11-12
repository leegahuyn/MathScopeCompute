import assert from 'node:assert/strict';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const [dir,hosted,priorFile,coreFile,out]=process.argv.slice(2);
assert.ok(dir&&hosted&&priorFile&&coreFile&&out);
const digest=v=>createHash('sha256').update(v).digest('hex'),json=v=>JSON.stringify(v);
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const params='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152';
const priorRaw=await readFile(priorFile);
assert.equal(digest(priorRaw),'71b89943209473ed542739fe1c14c81e515c72b6f65be00bcd6fc19241351836');
const prior=JSON.parse(priorRaw);
async function load(path,expected,count,retain=count){
  const hash=createHash('sha256'),z=createReadStream(path).pipe(createGunzip());
  z.on('data',chunk=>hash.update(chunk));
  const lines=createInterface({input:z,crlfDelay:Infinity});
  let n=-1,header;
  const nodes=[];
  for await(const line of lines){
    if(n<0) header=JSON.parse(line);
    else if(n<retain) nodes.push(JSON.parse(line));
    n++;
  }
  assert.equal(hash.digest('hex'),expected);
  assert.equal(n,count);
  return {header,nodes};
}
const names=['target-c7','background-c8','frozen-fourth-c8'];
const receipts={};
for(const name of names){
  const cert=await read(resolve(dir,name+'.json'));
  assert.equal(cert.sourceParameterSHA256,params);
  const graph=await load(resolve(dir,name+'-graph.jsonl.gz'),cert.graph.uncompressedSHA256,cert.graph.nodeCount);
  assert.equal(graph.header.nodeCount,cert.graph.nodeCount);
  const definitions=JSON.parse(graph.header.definitions.expression);
  receipts[name]={cert,nodes:graph.nodes,definitions};
}
const target=receipts['target-c7'],bg=receipts['background-c8'],frozen=receipts['frozen-fourth-c8'];
const canonicalCheck=(x,n,sha)=>assert.equal(digest(json(x.nodes.slice(0,n))),sha);
for(const x of [target,bg,frozen])canonicalCheck(x,117100,prior.graph.prefixSHA256);
for(const x of [bg,frozen])canonicalCheck(x,120820,prior.graph.orderTwoPrefixSHA256);
assert.deepEqual(frozen.nodes.slice(0,123870),bg.nodes.slice(0,123870));
assert.deepEqual(frozen.definitions.slice(0,50),bg.definitions.slice(0,50));

const historical=await load(resolve(hosted,'original-source-nodes.jsonl.gz'),
  'ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf',4456994,623789);
const rawReg=await readFile(resolve(hosted,'original-source-functions.json'));
assert.equal(digest(rawReg),'657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333');
historical.definitions=JSON.parse(JSON.parse(rawReg).base.base.expression);
assert.deepEqual(historical.nodes.slice(0,117100),target.nodes.slice(0,117100));
for(const j of [2,3]){
  const a=target.definitions[j],b=historical.definitions[j];
  assert.deepEqual([a.name,a.parameters,a.body],[b.name,b.parameters,b.body]);
}
// Compare only this exact raw target closure. Earlier canonical nodes
// are shared. Fresh integral binders and native system IDs can differ.
const shared=117100;
const commutative=new Set(['add','multiply','maximum']);
function lexicalKey(graph,root,env=new Map(),level=0){
  if(env.has(root))return env.get(root);
  if(root<shared&&[...env.keys()].every(k=>k>=shared))return 'P'+root;
  const n=graph.nodes[root];
  const {op,args:a}=n;
  const next=(i)=>lexicalKey(graph,i,env,level);
  if(op==='coordinate')return 'free:'+a[0];
  if(op==='rational'||op==='source_parameter')return op+json(a);
  if(op==='definite_integral'){
    const inner=new Map(env);
    inner.set(a[1],'integral'+level);
    return digest(json([op,lexicalKey(graph,a[0],inner,level+1),next(a[2]),next(a[3])]));
  }
  if(op==='actual_expression_partial'){
    const fn=graph.definitions[a[0]];
    const formal=new Map(fn.parameters.map((k,j)=>[k,'param'+j]));
    // The canonical F0/U0 function bodies and formals were checked.
    const body=[2,3].includes(a[0])?'leading'+a[0]:lexicalKey(graph,fn.body,formal,0);
    return digest(json([op,body,a[1].map(next),a[2]]));
  }
  if(op==='integer_power'||op==='source_step_derivative')
    return digest(json([op,next(a[0]),a[1]]));
  if(op==='actual_natural_series')
    return digest(json([op,a[0],next(a[1]),next(a[2]),a[3],a[4]]));
  const terms=a.map(next);
  if(commutative.has(op))terms.sort();
  return digest(json([op,...terms]));
}
const rawTargetKeys=[];
for(const [j,k] of [623780,623787].entries()){
  const oldNode=historical.nodes[k];
  assert.equal(oldNode.op,'actual_expression_partial');
  assert.deepEqual(oldNode.args.slice(1),[[622824,622829],[0,0]]);
  const old=historical.definitions[oldNode.args[0]];
  const here=target.nodes[target.cert.originalTarget.roots[j]];
  assert.equal(here.op,'actual_expression_partial');
  const now=target.definitions[here.args[0]];
  assert.equal(old.name,now.name);
  assert.deepEqual(old.parameters,now.parameters);
  const empty=new Map();
  const a=lexicalKey(target,now.body,empty),b=lexicalKey(historical,old.body,empty);
  assert.equal(a,b,'actual original raw target component '+j);
  rawTargetKeys.push(a);
}

const checkFaces=(graph,group,box,expectedCount)=>{
  assert.equal(group.rows.length,expectedCount);
  const {nodes}=graph;
  for(const r of group.rows){
    assert.equal(r.faces.length,4);
    const leaf=nodes[r.native??r.jet];
    assert.equal(leaf.op,'actual_expression_partial');
    assert.deepEqual(leaf.args[2],r.orders);
    const bound=nodes[r.root];
    assert.equal(bound.op,'add');
    for(let mask=0;mask<4;mask++){
      let i=r.faces[mask];
      for(let ax=0;ax<2;ax++)if(mask&(1<<ax)){
        const {op,args}=nodes[i];
        assert.equal(op,'definite_integral');
        assert.deepEqual(args.slice(2),[box.lower[ax],box.upper[ax]]);
        assert.equal(nodes[args[1]].op,'coordinate');
        i=args[0];
      }
      assert.equal(nodes[i].op,'sqrt_positive');
    }
  }
};
for(const r of Object.values(target.cert.regions))checkFaces(target,r,r,72);
for(const r of bg.cert.groups)checkFaces(bg,r,bg.cert.box,45);
for(const r of frozen.cert.groups)checkFaces(frozen,r,frozen.cert.box,45);
assert.deepEqual(target.cert.bounds.at(-1),{order:7,pole:24,component:[153453,153454]});
assert.deepEqual(bg.cert.bounds.at(-1),{order:8,F:152306,G:152307});
assert.equal(frozen.cert.flatBounds.at(-1).constant,'1719897836738458818267');
assert.equal(frozen.cert.flatBounds.at(-1).pole,16);
const coreRaw=await readFile(coreFile);
assert.equal(digest(coreRaw),'091007ee09d78be9405c5b8c62dc994aa5b6dd1e6cbcbc57a0f2fb89ff06db7b');
const oldPositive=new Map(JSON.parse(coreRaw).positive.map(r=>[r.order,r.roots]));
for(const row of bg.cert.groups){
  if(row.order)assert.equal(row.sourceRoot,oldPositive.get(row.order)[row.field]);
  else assert.equal(row.body,historical.definitions[row.system].body);
  const n=bg.nodes[row.sourceRoot];
  assert.equal(n.op,'actual_expression_partial');
  assert.equal(n.args[0],row.system);
  assert.equal(bg.definitions[row.system].body,row.body);
}
const result={schema:'MathScope.N7.ActualDirectionalNormIndependentReadback/1',
  inputs:Object.fromEntries(Object.entries(receipts).map(([k,v])=>[k,v.cert.graph])),
  actualRawTargetRoots:[623780,623787],rawTargetLexicalSHA256:rawTargetKeys,
  originalThirdPrefixSHA256:prior.graph.prefixSHA256,
  originalThroughOrderTwoPrefixSHA256:prior.graph.orderTwoPrefixSHA256,
  matchingN3PrefixToFrozenFourth:123870,
  actualRectangularTargetFTC:216,actualRectangularBackgroundFTC:360,actualRectangularFrozenFourthFTC:90,
  originalParameterSHA256:params,sourceFTCValuesNumericallyIntegrated:false,
  fullCovarianceNormProgramInstantiated:false,finalJetCoverage:'0/67',release:'HOLD'};
await writeFile(out,json(result)+'\n');
console.log('PASS original raw target lexical identity, original N3 prefix, 666 independent four-face FTC source checks.');
console.log('Receipt SHA256 '+digest(await readFile(out)));
