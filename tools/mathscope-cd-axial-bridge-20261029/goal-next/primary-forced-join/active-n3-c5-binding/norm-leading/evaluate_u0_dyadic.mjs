import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [runtime,helper,thresholdPath,normPath,out]=process.argv.slice(2);assert.ok(runtime&&helper&&thresholdPath&&normPath&&out);
const sha=b=>createHash('sha256').update(b).digest('hex');
const [h,t,b]=await Promise.all([readFile(helper),readFile(thresholdPath),readFile(normPath)]);
assert.equal(sha(h),'4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47');
assert.equal(sha(t),'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const threshold=JSON.parse(t),norm=JSON.parse(b);
const isF0=norm.schema==='MathScope.N7.OriginalLeadingF0C10FTCUpper/1';
assert.equal(sha(b),isF0?'ba937ba0fa45592c3bb2e3049fddfadb57ba91a17a4fcc7264f5d1d18a20b5f6':'77f072391c9e2e925e11a28837921f203599b2242f207f77780a2140da8cc13b');
const {sourceArithmetic}=await import(pathToFileURL(resolve(helper)).href);
const {N,evaluateClosedArithmeticDefinitions,tracedArithmeticEvaluator}=await sourceArithmetic(runtime,threshold.sourcePins,'coarse-upper');
const {getPinnedSourceProfile}=await import(pathToFileURL(resolve(runtime,'research-ide/mathscope-m2/navier/source-profile.mjs')).href);
const profile=getPinnedSourceProfile();assert.equal(profile.parameterExpressionSHA256,norm.sourceParameterSHA256);
const nodes=Object.entries(norm.normGraph.closure).map(([i,node])=>({id:Number(i),node})).sort((a,b)=>a.id-b.id);
const names=[...new Set(nodes.filter(x=>x.node.op==='source_parameter').map(x=>x.node.args[0]))];names.push('C12EnvelopeR');
const p=evaluateClosedArithmeticDefinitions(profile.parametersExactExpressions,N,{names:[...new Set(names)]});
console.log(JSON.stringify({phase:'closed-parameters',count:p.requested.length,operations:N.report().operations}));
const interpreter=tracedArithmeticEvaluator({nodes,nonArithmeticBoundaries:[]},N,{parameters:p.values,maxNodeVisits:100000});
const H=interpreter.value(isF0?norm.activeRoot:norm.leadingU0Root),R=p.values.get('C12EnvelopeR');
const upper=N.mul(N.point('3'),N.mul(N.add(N.one(),N.div(N.pow(R,2),N.point('2'))),N.add(N.point(isF0?'2':'1'),H)));
const directed=N.toClosed(upper);let inner=directed.upper,depth=0;
while(inner&&Object.keys(inner).length===1&&Object.hasOwn(inner,'exp')){depth++;inner=inner.exp;}
assert.equal(depth,5);assert.ok(inner?.rational);
const [num,den='1']=inner.rational.split('/').map(BigInt);assert(num>0n&&den>0n&&(den&(den-1n))===0n);
assert(num<(1n<<21n)*den);
let fourExp=inner;for(let i=0;i<4;i++)fourExp={exp:fourExp};
const dyadic={base:2,exponent:{ceil:{product:[{integer:2},fourExp]}},
 proof:'exp(v) <= 2^(2 v) for v>=0 because e<4; ceiling rounds exponent upward',integerExponentNumericallyMaterialized:false};
const output={schema:isF0?'MathScope.N7.ActualLeadingF0C8FTCArith/1':'MathScope.N7.ActualLeadingU0C8FTCArith/1',status:isF0?'DIRECTED_F0_FTC_UPPER_ONLY':'DIRECTED_U0_FTC_UPPER_ONLY',sourceNormSHA256:sha(b),
  actualSourceParameterSHA256:profile.parameterExpressionSHA256,sourceParameterNames:[...new Set(names)],
  H:N.toClosed(H),positiveMajorant:directed,FTCInterval:{lower:{rational:'0'},upper:directed.upper},dyadicUpper:dyadic,
  fixedDyadicTowerUpper:{definition:'T_1=2; T_(j+1)=2^(T_j)',index:15,
    proof:'c<2^21<2^65536=T5; e^x<2^(2x) for x>=0, and 2Tj<=2^Tj for integer Tj>=2, so exp(Tj)<T_(j+2); apply five times',
    fullIntegerNumericallyMaterialized:false},
  graphStats:{sourceNodes:nodes.length,trace:interpreter.report()},arithmetic:N.report(),
  scope:`Noncircular source ${isF0?'F0 active plus pinned exterior':'U0'} C8 FTC upper expression only; no private-seal live join, target/positive-order leaves, full K, numerical quadrature, or release promotion.`};
await writeFile(out,JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({status:output.status,H:output.H,FTC:output.FTCInterval,dyadicUpper:dyadic,arithmetic:output.arithmetic}));
