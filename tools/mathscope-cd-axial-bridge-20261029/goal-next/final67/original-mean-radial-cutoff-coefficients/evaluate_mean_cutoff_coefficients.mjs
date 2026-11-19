import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goal,work,out]=process.argv.slice(2);
assert.ok(goal && work && out);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function read(root,path,pin) {
  const raw=readFileSync(resolve(root,path));
  assert.equal(sha(raw),pin,path);
  return raw;
}
const original='mathscope-m3/navier/source-global-current.mjs';
const originalPin='93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760';
const hostedPin='b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36';
const raw=read(resolve(work,'continuation27/original-primary-degree-runtime/research-ide'),original,originalPin).toString();
const hosted=read(resolve(work,'continuation66/stage2/runtime-exact/research-ide'),original,hostedPin).toString();
const select=text=>text.slice(text.indexOf('export function globalMeanGeometry'),text.indexOf('/** Equations (8.3)'));
const mean=select(raw);
assert.equal(mean,select(hosted));
for (const term of [
  "X0=G.parameter('X0Imean'),x0=G.mul(G.sqrt(G.mul(q(2),X0)),G.exp(q(1,2))),radialScale=G.sqrt(s)",
  "argument=G.mul(q(10),G.sub(G.div(R,G.mul(radialScale,x0)),G.one))",
  "chi=G.step(argument)",
]) assert.ok(mean.includes(term),term);
const cutoffPin='d3dab84d038b542253e76a27b5eb84d4730fd5660f8db9fc26774a09bb5d43d9';
const chartPin='2b9940ae5719759972393013922cfa47ffecf7fe395ab703606417f74f59ac78';
const cutoff=JSON.parse(read(goal,'final67/n7-n8-primary-cutoff-orders/primary-cutoff-orders.json',cutoffPin));
const chart=JSON.parse(read(goal,'final67/n7-n8-primary-cutoff-orders/cutoff-orders-audit.json',chartPin));
assert.equal(chart.receiptSHA256,cutoffPin);
assert.equal(chart.contraction.physicalRadius,'1/64');
assert.equal(chart.contraction.xRadius,'1/4');

const factorial=n=>[1n,1n,2n,6n][n];
const chartJets=Array.from({length:4},(_,j)=>2n*factorial(j)*128n**BigInt(j));
const [d1,d2,d3]=chartJets.slice(1).map(value=>20n*value);
const [,m1,m2,m3,m4]=cutoff.originalStepOrdinaryBounds.slice(0,5).map(BigInt);
const F=[m1,m2*d1,m3*d1*d1+m2*d2,m4*d1**3n+3n*m3*d1*d2+m2*d3];
const rows=[[1n],[1n,1n],[1n,2n,1n],[1n,3n,3n,1n]].map((binomial,n)=>
  10n*binomial.reduce((sum,c,j)=>sum+c*chartJets[j]*F[n-j],0n));
const max=rows.reduce((a,b)=>a>b?a:b);
const power=(max-1n).toString(2).length;

const histPin='03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0';
const normPin='af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf';
const radialGeometryPin='4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966';
const radialGeometry=JSON.parse(read(goal,'whole-k-annular-wrz-norm/numerical/background-c8-complete.json',radialGeometryPin));
const history=JSON.parse(read(work,'whole-k-prefix/historical-scale-arithmetic-input.json',histPin));
const norm=JSON.parse(read(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json',normPin));
const {sourceArithmetic}=await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const {N,evaluateClosedArithmeticDefinitions}=await sourceArithmetic(resolve(work,'annular-numeric-24/pinned-original-runtime'),norm.sourcePins,'coarse-upper');
const {values}=evaluateClosedArithmeticDefinitions(history.definitions,N,{names:['h','X0Imean']});
const ln2=N.log(N.point('2'));
const H=N.mul(values.get('h'),N.mul(N.add(N.fromClosed(history.archivedEllMinimumInterval),N.point('15')),ln2));
const logCap=N.sub(N.mul(N.point(String(power)),ln2),N.log(values.get('X0Imean')));
const gate=N.mul(H,N.point('1/'+String(2n**120n)));
const comparison=N.compareEndpoints(N.toClosed(logCap).upper,N.toClosed(gate).lower);
assert.equal(comparison,-1);
const logB2=N.add(N.log(N.point("4")),N.log(N.fromClosed(radialGeometry.Xb)));
const b2Compar=N.compareEndpoints(N.toClosed(logB2).upper,N.toClosed(N.mul(H,N.point("3/"+String(2n**128n)))).lower);
assert.equal(b2Compar,-1);
const report={schema:'MathScope.N7.ActualMeanRadialCutoffSlowCoefficients/1',
 status:'VERIFIED_ORIGINAL_MEAN_CUTOFF_DIRECTIONAL_COEFFICIENT_ARITHMETIC',
 sourcePins:{originalPin,hostedPin,cutoffPin,chartPin,histPin,normPin},
 sameMeanConstructorSHA256:sha(mean),
 basis:'chi_R/R = 10/(R*x0) * s^(-1/2) * sigma\'(10*(R/(x0 sqrt(s))-1))',
 support:'on active support 1<R/(x0 sqrt(s))<11/10; derivatives vanish on both flat faces and outside',
 physicalChartCauchyRadius:'1/128',samplesOfStepDerivativeBounds:[m1,m2,m3,m4].map(String),
 chartJets:chartJets.map(String),innerArgumentDerivatives:[d1,d2,d3].map(String),
 mixedOrderBoundsTimesX0:rows.map(String),commonPowerOfTwo:power,
 logCap:N.toClosed(logCap),logGate:N.toClosed(gate),comparison,
 radialGeometryPin,logOriginalOuterRadiusSquared:N.toClosed(logB2),radialLengthCompare3HOver2Pow128:b2Compar,
 scope:'Pointwise partial_Z^a partial_T^b of the actual coefficient chi_R/R for a+b<=3. Original real step regularity and geometric chart admission required. No analytic continuation of fluid or heat.',
 finalJets:0,release:'HOLD'};
writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({power,rows:rows.map(String),comparison}));
