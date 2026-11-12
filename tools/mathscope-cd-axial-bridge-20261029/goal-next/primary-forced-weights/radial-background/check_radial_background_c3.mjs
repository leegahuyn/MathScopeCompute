import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {createGunzip} from 'node:zlib';

assert.equal(process.argv.length,7,'Use GOAL_NEXT ARCHIVED_GRAPH ORIGINAL_RESEARCH_IDE ARITHMETIC_RUNTIME OUT_JSON');
const [, ,goal,archive,source,arithmeticRuntime,out]=process.argv;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function pinned(path,expected){
  assert.notEqual(resolve(path),resolve(out));
  const bytes=await readFile(path);
  assert.equal(sha(bytes),expected,path);
  return bytes.toString('utf8');
}
const sourceSHA='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf';
const registrySHA='657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333';
const sources={
  band:['mathscope-m3/navier/source-global-band.mjs','babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'],
  coefficient:['mathscope-m2/navier/actual-residual-order-induction-source.mjs','30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047'],
  stokes:['mathscope-m2/navier/actual-residual-order-induction-background.mjs','e04a02a8878168d673fd7deed45de6bbfb2591ec58f3abc9eb8f08e1d2770879'],
  norm:['mathscope-m2/navier/actual-residual-order-induction-norms.mjs','0387335a081650c4a6ffed6e213215d32a363350c2a156a7163e82f4c0234634'],
  leading:['mathscope-m2/navier/actual-leading-stream-primitive.mjs','4a9a1d28d9ee7cea2d776fe73bdeed3a95dbe62fdb50a51fa536d3ccc55667de'],
  first:['mathscope-m2/navier/actual-continuation-exact-order-one.mjs','bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72'],
  graph:['mathscope-m2/navier/actual-global-source-expressions.mjs','cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3'],
  rational:['mathscope-m2/navier/actual-continuation-exact-identities.mjs','bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712']
};
const files={
  c9:['primary-forced-weights/slow-nine/pointwise-norms.json','1c7b4fdef5a1757f94e4f46b24a4dc1bf6c202c15b22528e1e820ff851dba39c'],
  majorants:['whole-k-annular-wrz-norm/numerical/background-majorants.json','b3a14675ddad1bdad7913a184f23b27161ba852994898a9c801b315ae6da27da'],
  numeric:['whole-k-annular-wrz-norm/numerical/background-numerical.json','4d2fa5753568e00bacbb47126909b7b3219f55f7b9cb8a0f45599ce2b0d3d19f'],
  fixed:['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json','9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  threshold:['whole-k-selector-scales/historical-scale-arithmetic-result.json','af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
  previousWave:['first-forced-mode-two-c1/mode-two-weighted-c1.json','e2bf09b924c42fa444029ac6ef41cb1fc86094bb65130c522c30e19e457f6be4'],
};
const load=async (root,table,parse)=>Object.fromEntries(await Promise.all(Object.entries(table).map(async ([name,[p,d]])=>{
  const text=await pinned(resolve(root,p),d);
  return [name,parse?JSON.parse(text):text];
})));
const [code,prior,registry]=await Promise.all([
  load(source,sources,false),load(goal,files,true),
  pinned(resolve(archive,'original-source-functions.json'),registrySHA).then(JSON.parse)
]);
const {c9,majorants,numeric,fixed,threshold,previousWave}=prior;
const requires={
  band:['radialTerms=[G.mul(X0,src.records[0].global.v)]','G.mul(useChi,X0,sourceRoots.v)',
    'G.mul(q(2),eta0,useExtra,sourceRoots.M)','b:G.mul(epsilon,power(s,q(-1,2)))'],
  coefficient:['Mbody=G.choose(X,Xkeep,lastU,G.mul(X,raw.average)','G.mul(q(2),eta,G.add(D,raw.lambda),average)'],
  first:['G.mul(q(2),eta,G.add(D,inner.lambda1),M1overX)'],
  stokes:['originalSourceCoordinateDerivatives','missingExtraCutoffRejected:!negative.pass','partial_X M_n=U_n'],
  leading:['original-global-v-is-the-same-stream-reconstruction','actualGlobalLeadingMassPrimitiveIdentity:true'],
  norm:[
    "function globalField(n,field)",
    "add(localField(n,field),field==='F'?correction(n).F:correction(n).U)",
    'const core=G.mul(q(factorial(r)*factorial(m))',
    'avg=fn((r,m)=>G.div(U.get(r,m),q(r+1)))',
    'leadingNormalized.U.push({radialOrder:r,etaOrder:m,upper:leadU.get(r,m)})',
    "const profiles={E:mul(sqrtEnlarged,F),U,Pi"
  ]
};
for(const [name,lines] of Object.entries(requires))
  for(const line of lines)assert.ok(code[name].includes(line),line);
assert.equal(fixed.sourceSHA256,sourceSHA);
assert.equal(previousWave.source.cycleSHA256,sourceSHA);
assert.equal(previousWave.source.sharedOriginalNodePrefix.count,3860185);
assert.equal(majorants.ordinaryDerivativeOrder,10);
assert.equal(numeric.majorantsSHA256,files.majorants[1]);
assert.deepEqual(c9.activeBackgroundPrefix,[0,1,2,3]);
const profileRows=c9.profileBounds.map(([,u])=>u);
assert.deepEqual(profileRows.map(u=>u.sourceRoot),[117101,117671,120455,123546]);
for(const n of [1,2,3]){
  const u=profileRows[n],name=n+':U',root=majorants.trace.roots['ftc_'+name];
  assert.equal(u.ordinaryThrough,10);
  assert.equal(u.enclosingFtcMajorantRoot,root);
  assert.equal(numeric.evaluatedProfiles['ftc_'+name].root,root);
  assert.deepEqual(u.upper,numeric.evaluatedProfiles['ftc_'+name].interval.upper);
  assert.equal(majorants.bindings.filter(row=>row.profile===name&&row.sourceRoot===u.sourceRoot).length,45);
}
const decode=x=>typeof x==='string'?JSON.parse(x):x;
const systems=decode(decode(decode(registry.base).base).expression);
for(const [id,name,body,parameters] of [
  [3,'ActualFinalLeadingU',9236,[4756,2]],[4,'ActualFinalLeadingVOverX',18778,[4756,2]],
  [6,'ActualFinalOrderOneU',29289,[4756,2]],[7,'ActualFinalOrderOneVOverX',29440,[4756,2]],
  [8,'ActualFinalOrderOneStream',29334,[4756,2]],[680,'CommonOriginalTimeCutoff',622845,[622831]],
  [682,'ActualCommonBandNormalized_G',622869,[617438,4756,2]],[683,'ActualCommonBandNormalized_M',622870,[617438,4756,2]],
  [685,'ActualCommonBandNormalized_b',622873,[617438,4756,2]],[689,'M3GlobalBandSlow_G',622911,[622802,622803,622804,622791]],
  [690,'M3GlobalBandSlow_b',622921,[622802,622803,622804,622791]]
])assert.deepEqual([systems[id].name,systems[id].body,systems[id].parameters],[name,body,parameters]);
const checks=[
  [117101,'actual_expression_partial',[3,[4756,2],[0,0]]],[117102,'actual_expression_partial',[4,[4756,2],[0,0]]],
  [117671,'actual_expression_partial',[6,[4756,2],[0,0]]],[117672,'actual_expression_partial',[7,[4756,2],[0,0]]],
  [117673,'actual_expression_partial',[8,[4756,2],[0,0]]],[120625,'multiply',[4756,117102]],
  [622820,'actual_monotone_root',[2,622803,622804]],[622824,'multiply',[622821,622823]],
  [622829,'multiply',[622803,622828]],[622830,'multiply',[622794,622820]],
  [622845,'smooth_piecewise',[622831,19,1,1,622844,0]],[622846,'multiply',[617438,617466]],
  [622847,'actual_expression_partial',[680,[622846],[0]]],[622848,'actual_expression_partial',[680,[622846],[1]]],
  [622849,'multiply',[622846,622848]],[622851,'multiply',[25,622850]],[622852,'exp',[622851]],
  [622855,'multiply',[117671,622853]],[622856,'multiply',[117673,622853]],[622859,'multiply',[117672,622858]],
  [622860,'multiply',[1192,622849]],[622861,'multiply',[117673,622860]],[622862,'multiply',[1953,622861]],
  [622863,'multiply',[20,622862]],[622864,'add',[622859,622863]],[622865,'multiply',[622852,622864]],
  [622869,'add',[117101,622855]],[622870,'add',[9239,622856]],[622872,'add',[120625,622865]],
  [622873,'multiply',[4781,622872]],[622887,'multiply',[50,622825]],[622888,'exp',[622887]],
  [622889,'multiply',[622798,622888]],[622920,'actual_expression_partial',[685,[622830,622824,622829],[0,0,0]]],
  [622921,'multiply',[622889,622920]],[622934,'actual_expression_partial',[690,[622802,622803,622804,622791],[0,0,0,0]]]
];
const expected=new Map(checks.map(([id,op,args])=>[id,{op,args}]));
const hasher=createHash('sha256');
const file=resolve(archive,'original-source-nodes.jsonl.gz');
assert.notEqual(file,resolve(out));
const stream=createReadStream(file).pipe(createGunzip());
stream.on('data',bytes=>hasher.update(bytes));
let count=-1,checked=0;
for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
  if(expected.has(count)){assert.deepEqual(JSON.parse(line),expected.get(count),'source #'+count);checked++;}
  count++;
}
assert.equal(checked,checks.length);
assert.equal(count,4456994);
assert.equal(hasher.digest('hex'),sourceSHA);

const use=name=>import(pathToFileURL(resolve(source,sources[name][0])).href);
const [{ActualSourceExpressions},{sourceGraphRationalIdentity}]=await Promise.all([use('graph'),use('rational')]);
const G=new ActualSourceExpressions(),q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),one=G.one;
const [X,eta,M,U,Meta,chi,extra]=['X','eta','M','U','Meta','chi','extra'].map(name=>G.fresh('radial_proof_'+name));
const [A,D]=[G.add(q(1,2),h),G.sub(q(1,2),h)],d=G.sub(one,G.pow(eta,2));
const same=(x,y)=>sourceGraphRationalIdentity(G,G.sub(x,y),{atomicNodes:[M,U,Meta,chi,extra]});
assert.equal(same(G.sub(G.sub(one,A),D),G.zero).pass,true);
const algebra=[0,1,2,3].map(n=>{
  const nu=G.mul(q(2*n),h),cut=n===0?one:chi,tail=n===0?G.zero:extra;
  const chartDerivative=G.neg(G.add(G.mul(q(2),eta,G.add(G.sub(one,A),nu),cut,M),
    G.mul(q(-2),eta,X,cut,U),G.mul(d,cut,Meta),G.mul(q(2),eta,tail,M)));
  const sourceV=G.sub(G.mul(q(2),eta,X,U),G.add(G.mul(q(2),eta,G.add(D,nu),M),G.mul(d,Meta)));
  const sourceWithCutoff=G.sub(G.mul(cut,sourceV),G.mul(q(2),eta,tail,M));
  assert.equal(same(chartDerivative,sourceWithCutoff).pass,true);
  if(n>0)assert.equal(same(chartDerivative,G.mul(cut,sourceV)).pass,false);
  return {order:n,exact:true,missingCutoffRejected:n>0};
});

const helper=resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
await pinned(helper,'4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47');
const {sourceArithmetic}=await import(pathToFileURL(helper).href);
const {N}=await sourceArithmetic(arithmeticRuntime,threshold.sourcePins,'coarse-upper');
const Rstar=N.fromClosed(fixed.hostedOriginal[216823]),axialC9=N.fromClosed(c9.backgroundC9.G);
const upperByRadialDegree=[0,1,2,3].map(r=>N.toClosed(
  N.mul(N.div(N.add(Rstar,N.point(String(r))),N.point('2')),axialC9)).upper);
for(const upper of upperByRadialDegree)assert.equal(N.compareEndpoints(upper,{rational:'0'}),1);
const rows=[];
for(let r=0;r<=3;r++)for(let z=0;r+z<=3;z++)for(let t=0;r+z+t<=3;t++)rows.push({orders:[r,z,t],bound:upperByRadialDegree[r]});
assert.equal(rows.length,20);
const receipt={
  schema:'MathScope.ArchivedRadialBackgroundC3/1',status:'VERIFIED_ARCHIVED_RADIAL_B_OVER_EPSILON_C3_DIRECTED_UPPER',
  source:{graphSHA256:sourceSHA,nodeCount:count,registrySHA256:registrySHA,actualRadial:622934,epsilon:622798,
    normalizedRadialSystem:685,normalizedStreamSystem:683,nativeCalls:[117101,117102,117671,117672,117673],
    sourceChecks:checked,modules:sources,prior:files,commonFirstForcedPrefix:previousWave.source.sharedOriginalNodePrefix,
    originalFirstForced:previousWave.source.forcedSHA256},
  exactAlgebra:algebra,domain:c9.domain,ordinaryAxes:['R','Z','T'],
  finiteActiveOrders:[0,1,2,3],profileRows:profileRows.map(row=>({sourceRoot:row.sourceRoot,ordinaryThrough:row.ordinaryThrough})),
  identity:'b/epsilon=-partial_Z[R s^(-A) sum_n chi_n q^(2nh) int_0^1 U_n(tX,eta)dt / 2]',
  bound:'The original positive C9 axial G majorant dominates the averaged axial profile with each ordinary X derivative gaining 1/(r+1). Product R/2 then gives (Rstar+alpha_R)*C_G/2.',
  uniformC3:upperByRadialDegree[3],rows,fastDerivativesIdenticallyZero:true,arithmetic:N.report(),
  scope:'Archived own fixed-label whole-K annulus and original smooth joins, including actual cutoff derivative. Uses original global U support/ordinary jet estimates. No newer live seal or full Forced estimate.'
};
await writeFile(out,JSON.stringify(receipt)+'\n');
console.log(JSON.stringify({status:receipt.status,sourceChecks:checked,mixedDerivatives:rows.length,sha256:sha(await readFile(out))}));
