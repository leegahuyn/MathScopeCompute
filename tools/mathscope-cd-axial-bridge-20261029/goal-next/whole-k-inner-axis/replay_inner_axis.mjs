import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [sourceRoot,outPath]=process.argv.slice(2);
assert.ok(sourceRoot&&outPath);
const navier=resolve(sourceRoot,'research-ide/mathscope-m2/navier');
const src=name=>import(pathToFileURL(resolve(navier,name)).href);
const {prepareActualOrderInduction,assertActualOrderInduction}=await src('actual-residual-order-induction-source.mjs');
const {sourceNormalizedCutoffWeights}=await src('actual-residual-order-induction-kernels.mjs');
const {sourceGraphRationalIdentity}=await src('actual-continuation-exact-identities.mjs');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const factorial=n=>{let x=1;for(let j=2;j<=n;j++)x*=j;return x;};

const prepared=prepareActualOrderInduction({order:3,maxNodes:2200000});
assert.equal(assertActualOrderInduction(prepared),true);
const {G,records,bootstrap}=prepared;
const originalNodeCount=G.nodes.length;
assert.equal(originalNodeCount,123870);
const originalNodes=hash(G.nodes), n2Prefix=hash(G.nodes.slice(0,120820));
const {X,eta}=bootstrap.constants, {Xkeep,Xcut,X0,IposRight,Xplus}=bootstrap.orderOne;
const q=(n,d=1)=>G.q(n,d), Xa=G.parameter('Xa'),Lambda=G.parameter('Lambda'),h=G.parameter('h');
const strictGuards=new Set([Xkeep,Xcut,X0,IposRight,Xplus]);
const readback=new Map();
function strict(root){
  if(readback.has(root))return readback.get(root);
  const {op,args}=G.nodes[root];
  let result=root;
  if(op==='actual_expression_partial'&&args[1][0]===X&&args[1][1]===eta&&
     args[1].length===2&&args[2].every(x=>x===0)){
    const sys=G.expressionSystems[args[0]];
    assert.deepEqual(sys.parameters,[X,eta]);
    result=strict(sys.body);
  } else if(op==='smooth_piecewise'&&args[0]===X&&strictGuards.has(args[1])){
    result=strict(args[3]);
  } else if(op==='add'){
    result=G.add(...args.map(strict));
  } else if(op==='multiply'){
    result=G.mul(...args.map(strict));
  }
  readback.set(root,result);
  return result;
}

function parityAudit(sys,earlier){
  const {xi}=sys;
  const cache=new Map(), operations={};
  function parity(root){
    if(cache.has(root))return cache.get(root);
    const {op,args}=G.nodes[root];
    operations[op]=(operations[op]??0)+1;
    let value;
    if(root===G.zero)value=null;
    else if(root===xi)value=1;
    else if(!G.freeCoordinates(root).has(xi))value=0;
    else if(op==='multiply'){
      value=args.map(parity).reduce((a,b)=>a===null||b===null?null:(a+b)%2,0);
    }else if(op==='add'){
      const active=[...new Set(args.map(parity).filter(x=>x!==null))];
      assert.ok(active.length<=1,'homogeneous parity of every sum');
      value=active[0]??null;
    }else if(op==='integer_power'){
      assert.ok(args[1]>=0,'no radial inverse power in analytic auxiliary body');
      const p=parity(args[0]);
      value=p===null?null:(p*args[1])%2;
    }else if(op==='actual_natural_series'){
      assert.ok(parity(args[1])!==1&&parity(args[2])!==1);
      value=0;
    }else if(op==='actual_background_even_profile'){
      assert.ok(earlier.includes(args[0])&&args[1]<4&&parity(args[2])!==1&&parity(args[3])!==1);
      value=0;
    }else{
      throw Error('Unexpected radial auxiliary operator '+root+' '+op);
    }
    cache.set(root,value);
    return value;
  }
  const w=[0,0,0,0,1,1];
  const expected=(i,j)=>(1+w[i]+w[j])%2;
  for(const matrix of [sys.A0,sys.A1])for(let i=0;i<6;i++)for(let j=0;j<6;j++){
    const p=parity(matrix[i][j]);
    assert.ok(p===null||p===expected(i,j),'matrix term preserves parity of derivative');
  }
  for(let i=0;i<6;i++){
    const p=parity(sys.forcing[i]);
    assert.ok(p===null||p===(1+w[i])%2,'forcing parity');
  }
  return {entries:78,visited:cache.size,operations,radialDenominators:0};
}

const rows=[];
const nodeIds=new Set();
for(let n=1;n<=3;n++){
  const r=records[n],a=r.norm.auxiliary;
  const raw=G.picardSystems[r.raw.system],aux=G.picardSystems[r.auxiliary.system];
  assert.deepEqual(r.coreAgreement.domain,[G.zero,Xa]);
  assert.equal(r.coreAgreement.actualCutoffStarts,Xkeep);
  assert.equal(r.coreAgreement.auxiliaryReplacesActivationCollar,false);
  assert.deepEqual(raw.zeroAxisDatum,Array(6).fill(G.zero));
  assert.deepEqual(aux.zeroAxisDatum,Array(6).fill(G.zero));
  for(const sys of [raw,aux]){
    assert.deepEqual(sys.diagonal,[0,0,2,0,3,1]);
    assert.deepEqual(sys.A0[2],[0,0,0,0,0,G.neg(G.one)]);
    assert.deepEqual(sys.A1[2],Array(6).fill(G.zero));
    assert.equal(sys.forcing[2],G.zero);
  }
  assert.deepEqual(aux.lowerOrders.map(row=>row.order),Array.from({length:n},(_,i)=>i));
  assert.ok(aux.actualNaturalAuxiliaryEquations);
  assert.equal(a.radius,G.add(q(6),q(1,1n<<BigInt(n-1))));
  assert.equal(a.loss,a.strip);
  assert.equal(a.sourceStrip,G.mul(q(4),a.strip));
  assert.equal(aux.solutionNorm,a.solutionNorm);
  assert.equal(aux.tail.sourceBound,a.C);
  assert.equal(a.solutionNorm,G.exp(G.div(G.mul(q(9),G.pow(a.C,2),a.radialDomain),G.mul(q(2),a.strip))));
  assert.ok(sourceGraphRationalIdentity(G,G.sub(G.mul(a.radialDomain,Lambda),a.radius)).pass);
  assert.deepEqual(aux.radialDomain,[G.zero,G.sqrt(a.radialDomain)]);
  const selected=Object.fromEntries(['F','U','M','Pi'].map(k=>[k,strict(r.global[k])]));
  assert.equal(selected.F,r.raw.F);
  assert.equal(selected.U,r.raw.U);
  let streamAverage=r.raw.average;
  let streamKind='actual Picard U plus average-minus-U';
  if(n===1){
    const mm=G.nodes[selected.M];
    assert.equal(mm.op,'multiply');
    assert.ok(mm.args.includes(X));
    streamAverage=mm.args.find(x=>x!==X);
    const d=G.nodes[streamAverage];
    assert.equal(d.op,'definite_integral');
    const [body,t,lo,hi]=d.args;
    assert.deepEqual([lo,hi],[G.zero,G.one]);
    assert.equal(body,G.substitute(r.raw.U,X,G.mul(t,X)));
    streamKind='explicit original integral of actual U(tX,eta) on [0,1]';
  }else assert.equal(selected.M,G.mul(X,streamAverage));
  assert.equal(selected.Pi,r.raw.Pi);
  for(const [k,j] of [['F',0],['U',1],['Pi',3]]){
    assert.deepEqual(G.nodes[selected[k]],{op:'actual_background_even_profile',args:[r.raw.system,j,X,eta,0,0]});
    assert.equal(G.picardEven(r.raw.system,j,G.zero,eta),G.zero);
    assert.equal(G.picardEven(r.raw.system,j,G.zero,eta,0,1),G.zero);
  }
  const earlier=records.slice(1,n).map(k=>k.auxiliary.system);
  const parity=parityAudit(aux,earlier);
  const weights=sourceNormalizedCutoffWeights({order:n,derivativeOrder:3});
  assert.equal(weights.sourceCutoff,'chi(s)=1-sigma_1(2s-1)');
  const W=weights.weights.map(e=>G.add(...e.polynomialInSourceH.map((v,k)=>G.mul(q(BigInt(v)),G.pow(h,k)))));
  assert.equal(W[0],G.one);
  const cauchy=[];
  for(let e=0;e<=3;e++)for(let r=0;r+e<=3;r++)for(let t=0;t+r+e<=3;t++){
    const C=G.mul(W[e],q(factorial(r)*factorial(t)),G.pow(G.div(q(2),a.strip),t),a.solutionNorm);
    cauchy.push({e,r,t,bound:C,W:W[e]});
    nodeIds.add(C);nodeIds.add(W[e]);
  }
  for(const root of [a.radius,a.radialDomain,a.solutionNorm,a.strip,a.sourceStrip,a.C,streamAverage,...Object.values(selected)])nodeIds.add(root);
  rows.push({n,actualSystem:r.raw.system,auxiliarySystem:r.auxiliary.system,actualRoots:Object.fromEntries(['F','U','M','Pi'].map(k=>[k,r.global[k]])),selected,streamAverage,streamKind,
             axisZero:[0,1,3].map(component=>({component,value:G.zero,etaDerivative:G.zero})),
             coreAgreement:r.coreAgreement,parity,analytic:{radius:a.radius,radialDomain:a.radialDomain,
             C:a.C,strip:a.strip,sourceStrip:a.sourceStrip,solutionNorm:a.solutionNorm},cauchy});
  console.log('PASS original core restriction, axis datum and auxiliary parity at order '+n);
}
assert.equal(hash(G.nodes.slice(0,originalNodeCount)),originalNodes);
const sourceNodeRecords=Object.fromEntries([...nodeIds].sort((a,b)=>a-b).map(i=>[i,G.nodes[i]]));
const data={schema:'MathScope.N7.ActualInnerAxisNativeBounds/1',
  originalNodeCount,originalNodes,n2Prefix,extendedNodeCount:G.nodes.length,
  X,eta,Xa,Lambda,Xkeep,Xcut,X0,IposRight,Xplus,rows,sourceNodeRecords,
  scope:{actualOrders:[1,2,3],orderFourAllocated:false,nativeAxisDatumExecuted:true,
         auxiliaryDoesNotReplaceActualCoreBody:true,finitePicardApproximationEvaluated:false}};
await writeFile(outPath,JSON.stringify(data,null,2)+'\n');
console.log('PASS exact original axis/Picard/stream/pressure and 60 finite mixed norm factors.');
