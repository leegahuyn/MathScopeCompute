/** Source-bound external weighted target N7/N8. Native norm roots stay open. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [goalPath,runtimeTree,historicalFile,outDir]=process.argv.slice(2);
assert.ok(goalPath&&runtimeTree&&historicalFile&&outDir);
const goal=resolve(goalPath), sha=x=>createHash('sha256').update(x).digest('hex');
const pins={
 'whole-k-annular-initial/numerical/source_arithmetic.mjs':'4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47',
 'whole-k-selector-scales/historical-scale-arithmetic-result.json':'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
 'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json':'9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
 'whole-k-annular-wrz-norm/target-c7.json':'3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770',
 'whole-k-annular-wrz-norm/numerical/background-c8-complete.json':'4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966',
 'whole-k-annular-wrz-norm/target-numerical/target-inner-numerical.json':'724daf0118dd8dc9b2d4af0597411bdee0995c99e68a25950a80749517737e4d',
 'whole-k-annular-wrz-norm/target-numerical/target-outer-numerical.json':'363d484e7699ce86af70a6d7ff23bd0c0a10366a64a86e3379e60852cbe56d84',
 'whole-k-annular-wrz-norm/target-numerical/target-middle-numerical.json':'07cbe3e4cda7f95d289fffea64472a5fac45387f72a4414603fec663613458e9',
 'whole-k-annular-wrz-norm/target-numerical/evaluate_target_inner.mjs':'97dfb4d4d34295879c0a9b0c935b034101aa8f5f3f66873e79b1fd9bf618f7aa',
 'whole-k-annular-wrz-norm/target-numerical/evaluate_target_outer.mjs':'3135320a19ba8d720c99939ee7fa9a67a8a03f9fce61d8b73b3757d422d59e58',
 'whole-k-annular-wrz-norm/target-numerical/evaluate_target_middle.mjs':'ec4f3703f3bd40bf91cc6369ab0451868c74d56be249f21acb8cf477358f7606',
 'primary-forced-join/active-n3-c5-binding/norm-leading/slow-chart-directed.json':'81f5a9ad2d0141a495d0e6a99e07e453fd754aaa6473d006a6426423a9352ddd',
 'primary-forced-join/active-n3-c5-binding/norm-leading/slow-chart-majorant.json':'f15c6f354276be183238c3d829c335b71e33d3d08f28a0fae49ca17e46d35eb5',
};
const loaded=new Map();
for(const [name,pin] of Object.entries(pins)){const b=await readFile(resolve(goal,name));assert.equal(sha(b),pin,name);loaded.set(name,name.endsWith('.json')?JSON.parse(b):b.toString());}
const get=suffix=>[...loaded].find(([p])=>p.endsWith(suffix))[1];
const hbytes=await readFile(historicalFile);assert.equal(sha(hbytes),'03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
const historical=JSON.parse(hbytes),thresholds=get('historical-scale-arithmetic-result.json');
const {sourceArithmetic}=await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const {N,evaluateClosedArithmeticDefinitions}=await sourceArithmetic(runtimeTree,thresholds.sourcePins,'coarse-upper');
const {values}=evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:['Xa','CSelected']});
const fixed=get('stage-zero-fixed-numerical.json'), target=get('target-c7.json'),background=get('background-c8-complete.json');
const inner=get('target-inner-numerical.json'),outer=get('target-outer-numerical.json'),middle=get('target-middle-numerical.json');
const chart=get('slow-chart-directed.json'),proof=get('slow-chart-majorant.json');
assert.equal(inner.outputDerivativeOrder,9);assert.equal(inner.kernelDerivativeOrder,10);
assert.deepEqual(inner.maxComponentPower,[327,608]);assert.equal(outer.derivativeOrder,9);
assert.equal(middle.actualTargetThroughOrdinaryOrder,9);assert.equal(middle.originalLeadingThroughOrdinaryOrder,10);
assert.equal(chart.status,'DIRECTED_COMMON_FTC_UPPER');assert.equal(proof.status,'PASS');
assert.equal(chart.coefficientProofSHA256,pins['primary-forced-join/active-n3-c5-binding/norm-leading/slow-chart-majorant.json']);
assert.equal(proof.coefficientRecurrenceBound.at(-1).order,8);
assert.equal(target.sourceParameterSHA256,chart.parameterExpressionSHA256);
assert.deepEqual(target.regions.inner.bodies,inner.actualInnerBodies);assert.deepEqual(target.regions.outer.bodies,outer.actualOuterBodies);
assert.deepEqual(target.regions.middle.bodies,middle.actualTargetBodies);
const Xa=values.get('Xa'),C=values.get('CSelected'),R=N.fromClosed(fixed.hostedOriginal[216823]);
assert.equal(N.compareEndpoints(N.toClosed(Xa).upper,{rational:'1'}),-1);
assert.equal(N.compareEndpoints(background.Xb.lower,{exp:{rational:'2'}}),1);
assert.equal(N.compareEndpoints(fixed.hostedOriginal[3612].upper,{rational:'1/128'}),-1);
assert.equal(N.compareEndpoints(N.toClosed(C).lower,{rational:'1'}),1);
// log(Xb/Xa)>2, t1<1. Thus inner complementary exp <=exp(64/49)<8,
// outer complementary exp <=exp(4/9)<2. Positive at eta endpoints, one-sided in T.
const l2num=2n*(405n+15n+1n),l2den=1215n;
assert(3n*l2num>2n*l2den&&9n*l2num>4n*l2den);
const fac=[1n];for(let k=1;k<=10;k++)fac.push(BigInt(k)*fac[k-1]);
const stirling=[[1n]];
for(let r=1;r<=8;r++){const row=Array(r+1).fill(0n);for(let j=1;j<=r;j++)row[j]=(stirling[r-1][j-1]??0n)+BigInt(r-1)*(stirling[r-1][j]??0n);stirling.push(row);}
let gaussian=new Map([[-3,1n]]);const gaussianSums=[];
for(let k=0;k<=8;k++){gaussianSums.push([...gaussian.values()].reduce((s,v)=>s+v,0n));const next=new Map(),put=(p,c)=>next.set(p,(next.get(p)??0n)+c);for(const [p,c]of gaussian){if(p)put(p-1,BigInt(Math.abs(p))*c);put(p-3,8n*c);}gaussian=next;}
const collarSum=stirling.map((row,r)=>row.reduce((s,sj,j)=>s+sj*Array.from({length:j+1},(_,a)=>fac[j]/fac[a]/fac[j-a]*gaussianSums[a]).reduce((v,x)=>v+x,0n),0n));
assert(collarSum.every((v,i)=>i===0||v>=collarSum[i-1]));
// Explicit positive DAG; boundary values are authenticated source analytic receipt endpoints.
const nodes=[], val=[],boundary=(name,value)=>{const id=nodes.length;nodes.push({op:'source_analytic_boundary',args:[name],enclosure:N.toClosed(value)});val.push(value);return id;};
const q=v=>{const id=nodes.length;nodes.push({op:'rational',args:[String(v),'1']});val.push(N.point(String(v)));return id;};
const op=(kind,args,extra)=>{const id=nodes.length;nodes.push({op:kind,args:extra===undefined?args:[...args,extra]});val.push(kind==='multiply'?args.reduce((p,j)=>N.mul(p,val[j]),N.one()):kind==='maximum'?N.max(args.map(j=>val[j])):N.pow(val[args[0]],extra));return id;};
const mul=(...args)=>op('multiply',args),max=(...args)=>op('maximum',args),pow=(a,n)=>op('integer_power',[a],n);
const root={Xa:boundary('actual-Xa',Xa),CSelected:boundary('actual-CSelected',C),Rstar:boundary('actual-C12EnvelopeR',R),slowCoefficient:boundary('actual-full-RZT-coefficient-FTC-through-8',N.fromClosed(chart.enclosure))};
const one=q(1),rows=[];
for(const m of [7,8]){
 const innerPower=608+120*m;
 const innerRoot=mul(q(8),pow(root.CSelected,innerPower));
 const outerCoefficients=outer.integerTaylor.map(series=>series.slice(0,m+1).map((v,k)=>BigInt(v)*fac[k]).reduce((a,b)=>a>b?a:b));
 const outerInteger=outerCoefficients.reduce((a,b)=>a>b?a:b);
 const outerRoot=mul(q(2),root.Rstar,q(outerInteger));
 const raw=max(...middle.componentBounds.map((series,c)=>boundary('actual-middle-raw-target-component-'+c+'-through-'+m,N.fromClosed({lower:{rational:'0'},upper:series[m-2]}))));
 const middleRoot=mul(q(1n<<185n),raw),regular=max(one,innerRoot,outerRoot,middleRoot);
 const invXa=boundary('actual-Xa-inverse-power-'+m,N.inverse(N.pow(Xa,m)));
 const profile=mul(max(one,invXa),q(collarSum[m]),regular);
 const profileTerms=(m+1)*(m+2)/2;
 const external=mul(q(profileTerms),root.slowCoefficient,profile);
 rows.push({order:m,pole:3+3*m,profileTerms,innerDerivativePower:innerPower,outerInteger:String(outerInteger),gaussianStirlingInteger:String(collarSum[m]),roots:{inner:innerRoot,outer:outerRoot,middle:middleRoot,profile,external},enclosure:N.toClosed(val[external])});
}
const program={schema:'MathScope.ExternalOriginalWeightedTargetN7N8PositiveProgram/1',nodes,roots:Object.fromEntries(rows.map(r=>['N'+r.order+'_external',r.roots.external]))};
const pbytes=JSON.stringify(program,null,2)+'\n';await writeFile(resolve(outDir,'weighted-target-high-program.json'),pbytes);
const receipt={schema:'MathScope.ExternalOriginalWeightedTargetN7N8/1',status:'DIRECTED_SOURCE_BOUND_EXTERNAL_TARGET_N7_N8_CONDITIONAL_ANALYTIC_PRIMITIVES',
 rows,programSHA256:sha(pbytes),programNodes:nodes.length,sourcePins:pins,historicalSHA256:sha(hbytes),
 sourceParameterSHA256:target.sourceParameterSHA256,originalTarget:target.originalTarget,actualRegions:{inner:inner.actualInnerBodies,outer:outer.actualOuterBodies,middle:middle.actualTargetBodies},
 exactBookkeeping:{stirling:stirling.map(a=>a.map(String)),outerGaussianSums:gaussianSums.map(String),collarSums:collarSum.map(String)},
 geometryChecks:{XaLessThan1:true,XbGreaterThanExp2:true,t1LessThanOneOver128:true,innerComplementUpper:8,outerComplementUpper:2,middleInverseZetaUpper:'2^185'},
 statement:'For m=7,8 and |alpha|<=m, the same original target Tbar=s^(-A-1/2)*T0(X,eta) obeys |D_RZT^alpha Tbar| <= N_m_external*zeta*delta_*^(-(3+3m)) for Xa<X<Xb, s in [1/2,2], eta in [-1,1], assuming the authenticated analytic source primitive ledgers and source-family identification. At Xa/Xb use the source flat continuous extension and one-sided limits, never a numerical zero divided by zero.',
 proofRoute:'Direct regular-factor derivatives through8, Gaussian/Laurent recurrence and unsigned first Stirling conversion; middle raw derivatives divided by zeta pointwise; exact full R/Z/T chart expansion with all coefficient derivatives and at most (m+1)(m+2)/2 nonzero profile jets. Original target is independent of the profile s variable, so terms with positive profile-s order vanish.',
 scope:{externalAnalyticTargetBound:true,nativeN7N8NormRootsEvaluated:false,oldRZAggregateRelabeledRZT:false,fullPrimaryOrForcedClassCertified:false,HOrYHighDerivativesEnclosed:false,actualStageCapsClosed:false,finalJets:'0/67',release:'HOLD'},
 remaining:['Original analytic ledgers are authenticated written real-analysis premises, not new Lean proofs or numeric evaluations of their nonarithmetic kernel semantics.','Transport these external target constants into the actual selected Primary/Forced induction theorem; native positive norm roots may be larger and are not enclosed.','Independent actual H/H-inverse, pulse y, and required selected coefficient/pressure/mean leaves through their source derivative orders remain.'],
 arithmetic:N.report()};
await writeFile(resolve(outDir,'weighted-target-high.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,programNodes:nodes.length,rows:rows.map(r=>({order:r.order,pole:r.pole,root:r.roots.external,enclosure:r.enclosure})),nativeNormRootsEvaluated:false}));
