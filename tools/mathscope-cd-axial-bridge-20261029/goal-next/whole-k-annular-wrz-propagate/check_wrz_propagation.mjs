import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [directory,receiptPath,out]=process.argv.slice(2);
assert.ok(directory&&receiptPath&&out,'Supply GOAL_NEXT, PROPAGATION_RECEIPT, and OUTPUT.');
const hash=raw=>createHash('sha256').update(raw).digest('hex');
const receiptBytes=await readFile(receiptPath),receipt=JSON.parse(receiptBytes);
const expectedGraph='3af2f24781816d3d619c7974dd21f683a1eb6431618e37602cc31628eb079e02';
const inputBytes={};
for(const [key,[name,checksum]] of Object.entries(receipt.priorReceipts)){
  inputBytes[key]=await readFile(resolve(directory,name));
  assert.equal(hash(inputBytes[key]),checksum,key);
}
const prior=Object.fromEntries(Object.entries(inputBytes).map(([k,v])=>[k,JSON.parse(v)]));
const sigma=receipt.intermediate.partitionSeedSigma.map(BigInt);
assert.deepEqual(sigma.slice(0,4),[1n,768n,793344n,1229571072n]);
const r0=BigInt(receipt.nativeSourceRecords[300171].args[1]);
assert.equal(r0,2n**34n);
const slope=2n*r0;
const c1=sigma[1]*slope,c2=sigma[2]*slope**2n,c3=sigma[3]*slope**3n;
const exactCutoffs={localChiChiPrimeSup:c1,localChiSquareSecondSup:2n*c1*c1+2n*c2,localChiChiPrimeSecondSup:3n*c1*c2+c3};
const cutoffKeys=Object.keys(exactCutoffs);
function checkCutoffs(record,raw){
  for(const key of cutoffKeys){
    const field=raw.match(new RegExp('"'+key+'"\\s*:\\s*(\\d+)'));
    assert.ok(field);
    assert.equal(BigInt(field[1]),exactCutoffs[key]);
    assert.equal(BigInt(record[key]),exactCutoffs[key]);
  }
}
const cutoffText=inputBytes.transverse.toString('utf8');
checkCutoffs(receipt.intermediate.exactLocalCutoffBounds,cutoffText);
const mutatedCutoff=cutoffText.replace(String(exactCutoffs.localChiChiPrimeSecondSup),String(exactCutoffs.localChiChiPrimeSecondSup+1n));
assert.notEqual(mutatedCutoff,cutoffText);
assert.throws(()=>checkCutoffs(receipt.intermediate.exactLocalCutoffBounds,mutatedCutoff));

const nodes=receipt.nodes;
assert.equal(nodes.length,6481);
const positive=[];
const dependencies=({op,args})=>op==='rational'||op==='authenticated_source_norm_root'?[]:op==='integer_power'?[args[0]]:args;
const gcd=(a,b)=>b===0n?a:gcd(b,a%b);
const sourceKeys=new Set(Object.keys(receipt.nativeSourceRecords).map(Number));
const targetKeys=new Set(prior.target.bounds.flatMap(x=>x.component));
const backgroundKeys=new Set(prior.background.bounds.flatMap(x=>[x.F,x.G]));
function validateNode(node,i){
  const {op,args}=node;
  assert.ok(dependencies(node).every(k=>Number.isInteger(k)&&k>=0&&k<i));
  switch(op){
    case 'rational': {
      const [a,b]=args.map(BigInt);
      assert.ok(a>=0n&&b>0n&&gcd(a,b)===1n);
      return a>0n;
    }
    case 'authenticated_source_norm_root': {
      const [ns,k]=args;
      assert.ok(ns==='hosted-original'?sourceKeys.has(k):ns==='target-c7'?targetKeys.has(k):
        ns==='background-c8'?backgroundKeys.has(k):ns==='fixed-radial'&&k===7414);
      return true;
    }
    case 'add': case 'maximum': return args.some(k=>positive[k]);
    case 'multiply': return args.every(k=>positive[k]);
    case 'inverse': assert.equal(positive[args[0]],true,'inverse requires strict positive operand'); return true;
    case 'sqrt_positive': return positive[args[0]];
    case 'integer_power': assert.ok(Number.isSafeInteger(args[1])&&args[1]>0); return positive[args[0]];
    case 'exp': return true;
    default: assert.fail('unexpected bound operator: '+op);
  }
}
for(const [i,node] of nodes.entries())positive.push(validateNode(node,i));
assert.throws(()=>validateNode({op:'inverse',args:[0]},nodes.length));
const frac=(id,n,d=1)=>assert.deepEqual(nodes[id],{op:'rational',args:[String(n),String(d)]});
const byFraction=(list,n,d=1)=>list.find(id=>nodes[id].op==='rational'&&nodes[id].args.join('/')===n+'/'+d);
const leaf=(id,ns,k)=>assert.deepEqual(nodes[id],{op:'authenticated_source_norm_root',args:[ns,k]});
const {roots,intermediate}=receipt;
const reachable=new Set();
const work=[roots.physicalPressureHighTerm];
while(work.length){
  const id=work.pop();
  if(reachable.has(id))continue;
  reachable.add(id);
  work.push(...dependencies(nodes[id]));
}
assert.ok(Object.values(roots).every(x=>reachable.has(x)&&positive[x]));
const imported={};
for(const id of reachable){
  if(nodes[id].op!=='authenticated_source_norm_root')continue;
  const [key,value]=nodes[id].args;
  (imported[key]??=[]).push(value);
}
for(const v of Object.values(imported))v.sort((a,b)=>a-b);
assert.deepEqual(imported['target-c7'],[...targetKeys].sort((a,b)=>a-b));
// The frame uses F itself and only differentiated G.
const usedBackground=[...backgroundKeys].filter(k=>k!==prior.background.bounds[0].G).sort((a,b)=>a-b);
assert.deepEqual(imported['background-c8'],usedBackground);
assert.deepEqual(imported['fixed-radial'],[7414]);
assert.deepEqual(receipt.factorialNormalizedOrders.map(([r,z])=>r+z===0?12:24*(r+z)),intermediate.sqrtWeightPoles);
assert.equal(intermediate.poleAbsorbed,168);

const arity=(id,op,n)=>{
  assert.equal(nodes[id].op,op);
  assert.equal(nodes[id].args.length,n);
  return nodes[id].args;
};
const normalized=arity(roots.normalizedPressureHighTerm,'multiply',5);
assert.ok(normalized.includes(roots.transverseInverse)&&normalized.includes(intermediate.originalCi0InverseUpper));
const T0=normalized.find(id=>nodes[id].op==='integer_power');
const [rT,power]=arity(T0,'integer_power',2);
assert.equal(power,2);
leaf(rT,'fixed-radial',7414);
assert.ok(normalized.includes(rT));
const e=normalized.find(id=>nodes[id].op==='inverse');
const exp=arity(e,'inverse',1)[0];
const [epsilonExponent]=arity(exp,'exp',1);
const epsProduct=arity(epsilonExponent,'multiply',4);
frac(byFraction(epsProduct,6),6);
const physical=arity(roots.physicalPressureHighTerm,'multiply',2);
assert.ok(physical.includes(roots.normalizedPressureHighTerm));
arity(physical.find(id=>id!==roots.normalizedPressureHighTerm),'exp',1);
const summands=arity(roots.transverseInverse,'add',2);
const i0=summands.map(id=>arity(id,'multiply',2)).find(factors=>factors.includes(roots.globalWrzZ6));
const i2=summands.map(id=>arity(id,'multiply',2)).find(factors=>factors.includes(roots.globalL2WrzZ6));
frac(i0.find(id=>id!==roots.globalWrzZ6),85,6);
frac(i2.find(id=>id!==roots.globalL2WrzZ6),85,216);
assert.equal(hash(JSON.stringify(nodes)),expectedGraph);
assert.equal(receipt.graphSHA256,expectedGraph);

const readback={schema:'MathScope.N7.WrzPositivePropagationReadback/1',receiptSHA256:hash(receiptBytes),graphSHA256:expectedGraph,
  arithmeticNodes:nodes.length,reachableFromPhysicalPressure:reachable.size,imported,exactCutoffLiterals:cutoffKeys,
  controls:{rejectOneUnitCutoffMutation:true,rejectZeroInverse:true},
  limits:'Structural, arithmetic and root connectivity readback. The source analytic inequalities remain the premises documented in README.'};
await writeFile(out,JSON.stringify(readback,null,2)+'\n');
console.log('PASS exact BigInt cutoff literals, authenticated root reachability, positive graph and both rejection controls.');
console.log('Readback SHA256 '+hash(await readFile(out)));
