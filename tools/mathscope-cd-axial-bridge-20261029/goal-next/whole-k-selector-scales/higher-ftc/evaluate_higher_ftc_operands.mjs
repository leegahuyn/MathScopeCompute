import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [repo,tree,packetPath,historicalPath,output]=process.argv.slice(2,7).map(s=>resolve(s));
const order=process.argv[7]===undefined?undefined:Number(process.argv[7]);
const coarse=process.argv[8]==='coarse-upper';
const fast=process.argv[8]==='monotone-products'||coarse;
const revision='f8cb4034e86d7b669d52a6f2248aebba156b51b5';
const m2='research-ide/mathscope-m2/navier/';
const pins={};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function pin(file){
  const name=relative(tree,file).replaceAll('\\','/');
  assert(!name.startsWith('..'));
  if(pins[name])return;
  const bytes=readFileSync(file);
  assert.deepEqual(bytes,execFileSync('git',['-c','core.longpaths=true','-C',repo,'show',`${revision}:${name}`],{maxBuffer:20*1024*1024}),name);
  pins[name]=digest(bytes);
  for(const [,dep] of bytes.toString('utf8').matchAll(/\b(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g))pin(resolve(dirname(file),dep));
}
const files=['actual-numerical-exponential-arithmetic.mjs','actual-closed-parameter-arithmetic.mjs',
  'actual-selection-arithmetic-enclosure-kernel.mjs'].map(s=>join(tree,m2,s));
files.forEach(pin);
function optimizedArithmetic(file){
  let source=readFileSync(file,'utf8');
  const old='  function multiply(a,b){';
  assert.equal(source.split(old).length,2);
  source=source.replace('precisionBits<256','precisionBits<96').replace('Use 256..512','Use 96..512');
  // If both input intervals are nonnegative, ordinary multiplication is
  // increasing in both variables. The two directed corner bounds suffice.
  source=source.replace(old,`${old}
    if(sign(a.lower)>=0&&sign(b.lower)>=0){
      return {lower:mulPoints(a.lower,b.lower).lower,upper:mulPoints(a.upper,b.upper).upper};
    }`);
  if(coarse){
    const marker='    const sa=sign(a),sb=sign(b),aa=absolute(a),bb=absolute(b);let cmp=compare(aa,bb,depth+1);';
    assert.equal(source.split(marker).length,2);
    source=source.replace(marker,`${marker}
    if(sa>0&&sb>0&&cmp!==null){
      const big=cmp>=0?a:b;
      // The exact elementary enclosure max(a,b) <= a+b <= e*max(a,b)
      // avoids a tiny-ratio evaluation at large positive levels.
      if(big.kind==='exp'&&compare(big.argument,qpoint(Q(32)),depth+1)>0){
        const upper=addPoints(big.argument,one,depth+1).upper;
        return {lower:big,upper:expPoint(upper,depth+1)};
      }
    }`);
  }
  source=source.replace(/from\s+(['"])(\.[^'"]+)\1/g,(_,q,dep)=>`from ${q}${pathToFileURL(resolve(dirname(file),dep)).href}${q}`);
  return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const [{numericalExponentialArithmetic},{evaluateClosedArithmeticDefinitions},{tracedArithmeticEvaluator}]=
  await Promise.all(files.map((f,j)=>fast&&j===0?optimizedArithmetic(f):import(pathToFileURL(f).href)));
const packetBytes=readFileSync(packetPath),historicalBytes=readFileSync(historicalPath);
const packet=JSON.parse(packetBytes),historical=JSON.parse(historicalBytes);
assert.equal(packet.sourceCommit,revision);
assert.equal(packet.sourceProfile,'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152');
assert.equal(digest(historicalBytes),'03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
assert.deepEqual(packet.originalDefinitions,historical.definitions);
const N=numericalExponentialArithmetic({precisionBits:fast?96:256,maxOperations:200_000_000,
  maxMemoEntries:order===undefined?80_000:500_000});
const parameters=evaluateClosedArithmeticDefinitions(packet.originalDefinitions,N,{names:packet.trace.sourceParameters}).values;
const boundaryIds=new Set(packet.trace.nonArithmeticBoundaries.map(x=>x.id));
assert([...boundaryIds].every(x=>[239,257,275].includes(x)));
const boundaries=new Map([...boundaryIds].map(id=>[id,N.fromClosed(historical.boundaryIntervals[id])]));
const evaluator=tracedArithmeticEvaluator(packet.trace,N,{parameters,boundaries,maxNodeVisits:250_000});
const C=N.fromClosed(historical.archivedEllMinimumInterval);
const thresholds=Object.fromEntries([10,14,15,16].map(k=>[k,N.toClosed(N.mul(N.add(C,N.point(String(k))),N.log(N.point('2'))))]));
const rows=[];
const roots=Object.entries(packet.trace.roots).filter(([name])=>order===undefined?name.startsWith('normalizedPressureN'):name.endsWith(`N${order}`));
assert(roots.length===(order===undefined?2:5));
function save(complete){
  const receipt={schema:'MathScope.N7.HigherFTCArithmeticComparisons/1',sourceCommit:revision,sourcePins:pins,
    sourceNormPacketSHA256:digest(packetBytes),historicalInputSHA256:digest(historicalBytes),thresholds,rows,complete,
    arithmeticMode:coarse?'96 directed bits, monotone nonnegative products and coarse large positive sum intervals':
      fast?'96 directed bits and monotone nonnegative product corners':'original 256 directed bits',
    arithmetic:N.report(),trace:evaluator.report(),
    scope:'Numerical bounds for the explicit source analytic upper operands. The exact original FTC-to-upper comparison is proved separately.'};
  const raw=JSON.stringify(receipt,null,2)+'\n';
  writeFileSync(output,raw);
  if(complete)console.log('arithmetic receipt',digest(raw));
}
for(const [name,root] of roots){
  const interval=N.toClosed(evaluator.value(root));
  const comparison=Object.fromEntries(Object.entries(thresholds).map(([k,v])=>[k,
    N.compareEndpoints(interval.upper,v.lower)<0?'STRICTLY_BELOW':
    N.compareEndpoints(interval.lower,v.upper)>0?'STRICTLY_ABOVE':'INTERVALS_OVERLAP']));
  rows.push({name,root,interval,againstCPlusKLog2:comparison});
  save(false);
  console.log(name,comparison);
}
save(true);
