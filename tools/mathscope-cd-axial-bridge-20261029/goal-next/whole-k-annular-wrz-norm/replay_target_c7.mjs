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
const {compileActualStressDirectionProgram}=await load('actual-stress-direction-program.mjs');
const {actualLeadingTargetOnSensitivityGraph}=await load('actual-covariance-sensitivity.mjs');
const {copyInnerFactorProgram}=await load('actual-inner-flat-kernel.mjs');
const {copyOuterFactorProgram}=await load('actual-outer-covariance-flat-extension.mjs');
const {rectangularSourceFTC}=await load('actual-background-physical-seminorms.mjs');
const {weightedGaussianDerivativeRules}=await load('actual-common-target-weighted-norms.mjs');
const {ellOneSourceScalarIdentity}=await load('actual-covariance-ell-one-obstruction.mjs');

const m=7;
const context={onProgress:r=>{if(r.stage?.includes('complete'))console.log(r.stage,r.nodeCount??'');}};
const prepared=prepareActualOrderInduction({order:1,maxNodes:1000000},context);
assert.equal(assertActualOrderInduction(prepared),true);
const G=new ActualInnerCovarianceExpressions(prepared.G,{maxNodes:1000000,maxDerivativeOrder:128});
const {X,eta}=prepared.bootstrap.constants,{A,D}=G.core,h=G.parameter('h');
const y=G.fresh('directional_target_inner_y'),d=G.fresh('directional_target_outer_delta'),
  s=G.fresh('directional_target_s'),q=(n,k=1)=>G.q(n,k),Xa=G.parameter('Xa'),t1=G.parameter('t1'),
  kappa0=G.parameter('kappa0'),R=G.parameter('C12EnvelopeR');
const target=actualLeadingTargetOnSensitivityGraph(G,{background:{prepared},chart:{X,eta,s},constants:{h,A,D}});
const factors=compileActualStressDirectionProgram({derivativeOrder:0});
assert.equal(factors.parameterExpressionSHA256,prepared.bootstrap.program.parameterExpressionSHA256);
const inner=copyInnerFactorProgram(G,factors,y,eta),outer=copyOuterFactorProgram(G,factors,d,eta);
const Xb=prepared.bootstrap.orderOne.Xb;
const XbIdentity=ellOneSourceScalarIdentity(G,outer.roots.Xb,Xb);
assert.equal(XbIdentity.pass,true);
const widthInner=G.div(t1,q(4)),widthOuter=q(1,2),innerExp=G.pow(t1,2),outerExp=q(4);
const flat=t=>G.choose(t,G.zero,G.one,G.zero,G.exp(G.neg(G.pow(t,-2))),G.exp(G.neg(G.pow(t,-2))));
const ratio=G.div(y,t1),ga=G.div(G.sub(G.one,kappa0),G.add(flat(ratio),flat(G.sub(G.one,ratio))));
const innerBodies=[inner.roots.innerTheta,inner.roots.innerZ].map(b=>G.mul(ga,b));
const outerBodies=[outer.roots.outerTheta,outer.roots.outerScaledZ];
const zeta=(Xc)=>{
  const a=G.log(G.div(Xc,Xa)),b=G.log(G.div(Xb,Xc));
  return G.exp(G.neg(G.add(G.div(innerExp,G.pow(a,2)),G.div(outerExp,G.pow(b,2)))));
};
const indices=[];
for(let r=0;r<=m;r++)for(let e=0;e+r<=m;e++)indices.push([r,e]);
const anchored=(tag,coord,bodies,width,divide=false)=>{
  const reverse=divide?coord:G.fresh('directional_target_'+tag+'_reverse');
  const lower=divide?[G.mul(Xa,G.exp(G.div(t1,q(8)))),q(-1)]:[G.zero,q(-1)];
  const upper=divide?[G.mul(Xb,G.exp(q(-1,4))),G.one]:[width,G.one];
  const systems=bodies.map((body,j)=>{
    const id=G.defineExpressionFunction({name:'DirectionalActualTarget_'+tag+'_'+j,parameters:[coord,eta],
      body,derivativeLimits:[m+2,m+2]});
    assert.equal(G.materializeExpressionFunction(id,[coord,eta]),body);
    return id;
  });
  const rows=systems.flatMap((id,j)=>indices.map(([r,e])=>{
    const native=G.expressionValue(id,[divide?coord:G.sub(width,reverse),eta],[r,e]);
    const body=divide?G.div(native,zeta(coord)):native;
    const f=rectangularSourceFTC(G,{body,coordinates:[reverse,eta],lower,upper});
    assert.equal(f.faces.length,4);
    assert.equal(G.freeCoordinates(f.bound).size,0);
    return {component:j,orders:[r,e],native,root:f.bound,faces:f.faces.map(x=>x.upperBound)};
  }));
  console.log(tag+' '+rows.length+' actual four-face target norm rows, '+G.nodes.length+' graph nodes');
  return {systems,bodies,coordinates:[coord,eta],lower,upper,rows};
};
const regions={
  inner:anchored('inner',y,innerBodies,widthInner),
  outer:anchored('outer',d,outerBodies,widthOuter),
  middle:anchored('middle',X,target.raw,null,true)
};
const rules={inner:weightedGaussianDerivativeRules(G,{a:innerExp,initialPole:0,order:m}),
  outer:weightedGaussianDerivativeRules(G,{a:outerExp,initialPole:3,order:m})};
const length=G.log(G.div(Xb,Xa));
const complements={inner:G.exp(G.div(outerExp,G.pow(G.sub(length,widthInner),2))),
  outer:G.exp(G.div(innerExp,G.pow(G.sub(length,widthOuter),2)))};
const fac=n=>{let v=1n;for(let j=2;j<=n;j++)v*=BigInt(j);return v;};
const choose=(n,j)=>fac(n)/(fac(j)*fac(n-j));
const profileRows=indices.map(([r,e])=>{
  const norm=(tag,j,k,l)=>regions[tag].rows.find(v=>v.component===j&&v.orders[0]===k&&v.orders[1]===l).root;
  const component=[0,1].map(j=>{
    const collar=tag=>{
      const g=rules[tag];
      return G.mul(complements[tag],G.pow(Xa,-r),G.add(...Array.from({length:r+1},(_,k)=>{
        const stirling=BigInt(g.unsignedFirstStirling[r][k]??0);
        if(!stirling)return G.zero;
        const terms=Array.from({length:k+1},(_,a)=>G.mul(q(choose(k,a)),g.rows[a].upperCoefficient,norm(tag,j,k-a,e)));
        return G.mul(q(stirling),G.add(...terms));
      })));
    };
    return G.maximum(G.one,collar('inner'),collar('outer'),norm('middle',j,r,e));
  });
  return {orders:[r,e],pole:3+3*r,component};
});
// Positive multivariate Taylor composition. For a complex polydisc with
// radius delta, sum of coefficient magnitudes in a two-variable degree j
// is at most (j+1)*C*delta^-j. Real profile derivatives are the FTC inputs.
const deltaInverse=G.mul(q(128),R);
const coefficient=(bound,j)=>G.mul(q(j+1),bound,G.pow(deltaInverse,j));
const x=[G.zero,...Array.from({length:m},(_,i)=>coefficient(G.mul(q(6),G.pow(R,2)),i+1))];
const e=[G.zero,...Array.from({length:m},(_,i)=>coefficient(q(4),i+1))];
const multiplier=Array.from({length:m+1},(_,j)=>coefficient(q(8),j));
const conv=(a,b)=>Array.from({length:m+1},(_,j)=>G.add(...Array.from({length:j+1},(_,i)=>G.mul(a[i],b[j-i]))));
const powers=seq=>{
  const out=[[G.one,...Array(m).fill(G.zero)]];
  for(let j=1;j<=m;j++)out.push(conv(out[j-1],seq));
  return out;
};
const xx=powers(x),ee=powers(e);
const sums=[0,1].map(component=>Array(m+1).fill(G.zero).map((_,j)=>{
  const terms=profileRows.filter(r=>r.orders[0]+r.orders[1]<=j).map(r=>{
    const [a,b]=r.orders;
    const co=conv(multiplier,conv(xx[a],ee[b]))[j];
    return G.mul(q(fac(j),fac(a)*fac(b)),r.component[component],co);
  });
  return G.add(...terms);
}));
const bounds=Array.from({length:m+1},(_,j)=>({order:j,pole:3+3*j,
  component:[0,1].map(c=>G.maximum(G.one,...sums[c].slice(0,j+1)))}));
assert.equal(profileRows.length,36);
assert.equal(Object.values(regions).reduce((a,b)=>a+b.rows.length,0),216);
assert.equal(bounds.at(-1).pole,24);
assert.ok(bounds.every(row=>row.component.every(id=>G.freeCoordinates(id).size===0)));
const definitions=G.captureFunctionDefinitions(),graph=G.nodes;
const header={schema:'MathScope.N7.ActualTargetDirectionalNormGraph/1',nodeCount:graph.length,definitions};
const hsh=createHash('sha256');
function* lines(){
  for(const item of [header,...graph]){
    const line=JSON.stringify(item)+'\n';
    hsh.update(line);
    yield line;
  }
}
await pipeline(Readable.from(lines()),createGzip({level:4}),createWriteStream(graphPath));
const result={schema:'MathScope.N7.ActualSparseTargetC7/1',
  sourceParameterSHA256:factors.parameterExpressionSHA256,originalTarget:{roots:target.raw,stockAndMomentAndShear:target.terms,F:target.F,U:target.U,M:target.M},
  regionFactoring:{inner:inner.roots,outer:outer.roots,Xa,Xb,t1,complements,XbIdentity},
  regions,profileRows,bounds,graph:{nodeCount:graph.length,uncompressedSHA256:hsh.digest('hex')},
  fixedSlowComplexChart:{radius:'1/(128 Rstar)',multiplierSup:'8',XSup:'6 Rstar^2',etaSup:'4'},
  scope:{actualOriginalTargetBodyAndFlatFactorsRetained:true,actualExactSourceFTCNormExpressionsConstructed:true,
    exactFourFacesEach:true,numericalFTCQuadratureExecuted:false,oldPrivateAllBandFamilySealHydrated:false,
    actualPositiveOrderBackgroundC8Constructed:false,completeWholeKJets:false}};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS all three actual weighted target C7 regions, 216 source FTC constants and exact slow chart transfer.');
console.log(JSON.stringify({bounds,graph:result.graph}));
