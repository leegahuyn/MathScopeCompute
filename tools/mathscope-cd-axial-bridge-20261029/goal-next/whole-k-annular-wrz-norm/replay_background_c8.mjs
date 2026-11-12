import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {createGzip} from 'node:zlib';

const [source,out,graphPath]=process.argv.slice(2);
assert.ok(source&&out&&graphPath);
const load=file=>import(pathToFileURL(resolve(source,'research-ide/mathscope-m2/navier',file)).href);
const {prepareActualOrderInduction,assertActualOrderInduction}=await load('actual-residual-order-induction-source.mjs');
const {ActualInnerCovarianceExpressions}=await load('actual-inner-covariance-flat-extension.mjs');
const {sourceNormalizedCutoffWeights}=await load('actual-residual-order-induction-kernels.mjs');
const {rectangularSourceFTC}=await load('actual-background-physical-seminorms.mjs');

const m=8;
const prepared=prepareActualOrderInduction({order:3,maxNodes:1000000});
assert.equal(assertActualOrderInduction(prepared),true);
const G=new ActualInnerCovarianceExpressions(prepared.G,{maxNodes:1000000,maxDerivativeOrder:128});
const {X,eta}=prepared.bootstrap.constants,h=G.parameter('h'),R=G.parameter('C12EnvelopeR'),
  q=(n,d=1)=>G.q(n,d),Xa=G.parameter('Xa'),Xb=prepared.bootstrap.orderOne.Xb;
const box={lower:[G.div(Xa,q(2)),q(-1)],upper:[G.mul(q(2),Xb),G.one]};
const fac=n=>{let v=1n;for(let j=2;j<=n;j++)v*=BigInt(j);return v;};
const bounds=new Map(),groups=[];
const key=(n,field,r,e)=>[n,field,r,e].join(':');
for(const record of prepared.records){
  const n=record.order;
  assert.equal(record.global.completed,true);
  for(const field of ['F','U']){
    const sourceRoot=record.global[field];
    const {op,args:[system,parameters,orders]}=G.nodes[sourceRoot];
    assert.equal(op,'actual_expression_partial');
    assert.deepEqual(parameters,[X,eta]);
    assert.deepEqual(orders,[0,0]);
    const body=G.expressionSystems[system].body;
    assert.equal(G.materializeExpressionFunction(system,[X,eta]),body);
    if(n===0)assert.equal(body,field==='F'?prepared.bootstrap.actualHeat.heat.finalF:prepared.bootstrap.finalU);
    const rows=[];
    for(let r=0;r<=m;r++)for(let e=0;e+r<=m;e++){
      const jet=G.expressionValue(system,[X,eta],[r,e]);
      const f=rectangularSourceFTC(G,{body:jet,coordinates:[X,eta],...box});
      assert.equal(f.faces.length,4);
      assert.equal(G.freeCoordinates(f.bound).size,0);
      rows.push({orders:[r,e],jet,root:f.bound,faces:f.faces.map(x=>x.upperBound)});
      bounds.set(key(n,field,r,e),f.bound);
    }
    groups.push({order:n,field,sourceRoot,system,body,rows});
  }
  console.log('original coefficient '+n+', '+G.nodes.length+' exact source graph nodes');
}
// Taylor coefficient bounds on a polydisc in (R,Z) of radius 1/(128 Rstar)
// at a fixed source T. The constant value log(Q) never contributes to
// the perturbation of log(q)=log(Q)+log(s).
const deltaInv=G.mul(q(128),R);
const coefficient=(bound,j)=>G.mul(q(j+1),bound,G.pow(deltaInv,j));
const positive=(bound)=>[G.zero,...Array.from({length:m},(_,i)=>coefficient(bound,i+1))];
const x=positive(G.mul(q(6),G.pow(R,2))),e=positive(q(4)),l=positive(q(4));
const pref=Array.from({length:m+1},(_,j)=>coefficient(q(8),j));
const conv=(a,b)=>Array.from({length:m+1},(_,j)=>G.add(...Array.from({length:j+1},(_,i)=>G.mul(a[i],b[j-i]))));
const powers=seq=>{
  const out=[[G.one,...Array(m).fill(G.zero)]];
  for(let j=1;j<=m;j++)out.push(conv(out[j-1],seq));
  return out;
};
const xx=powers(x),ee=powers(e),ll=powers(l);
const euler=Object.fromEntries([1,2,3].map(n=>{
  const data=sourceNormalizedCutoffWeights({order:n,derivativeOrder:m});
  assert.equal(data.pass,true);
  return [n,data.weights.map(row=>G.add(...row.polynomialInSourceH.map((c,k)=>G.mul(q(BigInt(c)),G.pow(h,k)))))];
}));
const all=[];
for(let j=0;j<=m;j++){
  const fieldRoots=['F','U'].map(field=>{
    const add=[];
    for(let n=0;n<=3;n++)for(let a=0;a<=j;a++)for(let b=0;a+b<=j;b++)for(let c=0;a+b+c<=j;c++){
      if(n===0&&c!==0)continue;
      const coefficientRoot=conv(pref,conv(xx[a],conv(ee[b],ll[c])))[j];
      const norm=bounds.get(key(n,field,a,b)),weight=n===0?G.one:euler[n][c];
      add.push(G.mul(q(fac(j),fac(a)*fac(b)*fac(c)),coefficientRoot,norm,weight));
    }
    return G.add(...add);
  });
  all.push({order:j,F:G.maximum(G.one,...all.map(r=>r.F),fieldRoots[0]),
    G:G.maximum(G.one,...all.map(r=>r.G),fieldRoots[1])});
}
assert.equal(groups.length,8);
assert.equal(groups.reduce((sum,g)=>sum+g.rows.length,0),360);
assert.ok(all.every(r=>[r.F,r.G].every(root=>G.freeCoordinates(root).size===0)));
const header={schema:'MathScope.N7.ActualBackgroundDirectionalNormGraph/1',
  nodeCount:G.nodes.length,definitions:G.captureFunctionDefinitions()};
const digest=createHash('sha256');
function* lines(){
  const a=JSON.stringify(header)+'\n';digest.update(a);yield a;
  for(const item of G.nodes){const s=JSON.stringify(item)+'\n';digest.update(s);yield s;}
}
await pipeline(Readable.from(lines()),createGzip({level:4}),createWriteStream(graphPath));
const result={schema:'MathScope.N7.ActualSparseBackgroundC8/1',
  sourceParameterSHA256:prepared.program.parameterExpressionSHA256,activePrefix:[0,1,2,3],
  scopeDomain:'original whole-K slab, Xa<=X<=Xb, |eta|<=3/4, fixed original band s in [1/2,2]',
  groups,box,originalEulerNormRoots:euler,bounds:all,
  graph:{nodeCount:G.nodes.length,uncompressedSHA256:digest.digest('hex')},
  fixedSlowComplexChart:{radius:'1/(128 Rstar)',fieldMultiplierSup:'8',XSup:'6 Rstar^2',etaSup:'4',logSSup:'4'},
  scope:{actualOriginalWholeKActiveCoefficientsRetained:true,actualCompleteF0HeatAndI2Retained:true,
    exactFourFacesEach:true,numericalFTCQuadratureExecuted:false,genericWholeBandOutsideWholeKClaimed:false,
    coefficientOrderAbove3NeededHere:false,completeWholeKJets:false}};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS 360 exact actual F0/F1/F2/F3 and U0/U1/U2/U3 profile FTC norms through C8 and sparse R,Z transfer.');
console.log(JSON.stringify({bounds:all,graph:result.graph}));
