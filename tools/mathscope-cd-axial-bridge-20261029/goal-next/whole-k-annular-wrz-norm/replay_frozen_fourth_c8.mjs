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
const {rectangularSourceFTC}=await load('actual-background-physical-seminorms.mjs');

const m=8;
const prepared=prepareActualOrderInduction({order:4,maxNodes:1000000});
assert.equal(assertActualOrderInduction(prepared),true);
const G=new ActualInnerCovarianceExpressions(prepared.G,{maxNodes:1000000,maxDerivativeOrder:128});
const {X,eta}=prepared.bootstrap.constants,h=G.parameter('h'),R=G.parameter('C12EnvelopeR'),
  q=(n,d=1)=>G.q(n,d),Xa=G.parameter('Xa'),Xb=prepared.bootstrap.orderOne.Xb;
const box={lower:[G.div(Xa,q(2)),q(-1)],upper:[G.mul(q(2),Xb),G.one]};
const fac=n=>{let v=1n;for(let j=2;j<=n;j++)v*=BigInt(j);return v;};
const bounds=new Map(),groups=[];
const key=(n,field,r,e)=>[n,field,r,e].join(':');
for(const record of prepared.records.slice(4)){
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
assert.equal(groups.length,2);
assert.equal(groups.reduce((sum,g)=>sum+g.rows.length,0),90);
const choose=(n,j)=>fac(n)/(fac(j)*fac(n-j));
let series=new Map([[0,1n]]);
const g=[],numerator=[];
for(let j=0;j<=8;j++){
  const absolute=x=>x<0n?-x:x;
  g.push([...series].reduce((s,[p,c])=>s+absolute(c)*fac(p),0n));
  numerator.push((2n**BigInt(j))*[...series.values()].reduce((s,c)=>s+absolute(c),0n));
  const next=new Map();
  for(const [p,c]of series){
    next.set(p+1,(next.get(p+1)??0n)-BigInt(p)*c);
    next.set(p+2,(next.get(p+2)??0n)+c);
  }
  series=next;
}
const denominator=g.map((b,j)=>2n**BigInt(j+1)*b);
const reciprocal=[9n];
for(let j=1;j<=8;j++)reciprocal.push(9n*Array.from({length:j},(_,k)=>{
  const l=k+1;return choose(j,l)*denominator[l]*reciprocal[j-l];
}).reduce((a,b)=>a+b,0n));
const ordinary=reciprocal.map((_,j)=>Array.from({length:j+1},(_,l)=>choose(j,l)*numerator[l]*reciprocal[j-l])
  .reduce((a,b)=>a+b,0n));
const stirling=[[1n]];
for(let j=1;j<=8;j++)stirling.push(Array.from({length:j+1},(_,k)=>
  (stirling[j-1][k-1]??0n)+BigInt(k)*(stirling[j-1][k]??0n)));
const euler=stirling.map(row=>row.reduce((sum,c,j)=>sum+c*ordinary[j],0n));
const normalized=euler.map((_,j)=>Array.from({length:j+1},(_,p)=>choose(j,p)*euler[j-p]).reduce((a,b)=>a+b,0n));
const flatBounds=normalized.map((c,j)=>({order:j,constant:String(c),pole:2*j,
  factor:'q^(8*h) exp(-1/(2*w)) w^(-2*j)'}));
const normalizedRoot=normalized.map(v=>q(v));
const header={schema:'MathScope.N7.ActualBackgroundDirectionalNormGraph/1',
  nodeCount:G.nodes.length,definitions:G.captureFunctionDefinitions()};
const digest=createHash('sha256');
function* lines(){
  const a=JSON.stringify(header)+'\n';digest.update(a);yield a;
  for(const item of G.nodes){const s=JSON.stringify(item)+'\n';digest.update(s);yield s;}
}
await pipeline(Readable.from(lines()),createGzip({level:4}),createWriteStream(graphPath));
const result={schema:'MathScope.N7.ActualFrozenFourthBackgroundProfileC8/1',
  sourceParameterSHA256:prepared.program.parameterExpressionSHA256,
  fieldScope:'actual F4,U4 profiles on the original enlarged annulus, with a separate fourth cutoff bound near its flat positive edge',
  frozenScalePremise:'q_cut=1/b4, w=1-b4*q_frozen in (0,1/4]; if w<=0 every original cutoff jet is zero',
  groups,box,flatBounds,normalizedRoot,
  graph:{nodeCount:G.nodes.length,uncompressedSHA256:digest.digest('hex')},
  scope:{nativeFourthProfileNormsThrough8:true,exactFourFacesEach:true,numericalFTCQuadratureExecuted:false,
    actualB4ScaleComparisonClaimed:false,frozenFourthContributionDeclaredZero:false,completeWholeKJets:false}};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS 90 actual F4/U4 source FTC norms and relative flat cutoff Euler constants through eight.');
console.log(JSON.stringify({flatBounds,graph:result.graph}));
