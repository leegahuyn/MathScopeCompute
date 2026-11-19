/** Exact source handoff for the same-live N3 direct/split denominators. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {pathToFileURL} from "node:url";

const [artifact,runtime,output]=process.argv.slice(2);
assert(artifact&&runtime&&output&&!fs.existsSync(output));
const sha=x=>crypto.createHash("sha256").update(x).digest("hex");
const json=(name,pin)=>{
  const bytes=fs.readFileSync(path.join(artifact,name));
  assert.equal(sha(bytes),pin,name);
  return JSON.parse(bytes);
};
const artifactPins={
  "direct-split-arithmetic-closure.json":"51057fc92e13cd7fc9a875e71c2926c6769cc3536ee1a13f2bea7ddd630cd94a",
  "primary-K-arithmetic-frontier.json":"fbaea5bd2475e54919cef4099479c1c6ad6ad48dc68225190ea9f6c127f07aaa",
  "primary-c5-native.json":"8de412533abe7b94bbb13118ed191f4edaf708002b578ab2a34c41b944430dcd",
  "first-cycle.json":"37e8670816ddd5a209cd79670200b75808e504a35c9d9a76d872d2d2de371776",
  "pr30-source-pins.json":"3f57354aca3da79d475e0bd0605ece51c36cf2633e7744cee35d59efe874b3f7"
};
const closure=json("direct-split-arithmetic-closure.json",artifactPins["direct-split-arithmetic-closure.json"]);
const frontier=json("primary-K-arithmetic-frontier.json",artifactPins["primary-K-arithmetic-frontier.json"]);
const primary=json("primary-c5-native.json",artifactPins["primary-c5-native.json"]);
const cycle=json("first-cycle.json",artifactPins["first-cycle.json"]);
const pr30=json("pr30-source-pins.json",artifactPins["pr30-source-pins.json"]);
const sourcePins={
  "mathscope-m3/navier/source-global-current.mjs":"93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760",
  "mathscope-m3/navier/source-global-band.mjs":"babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60",
  "mathscope-m3/navier/source-global-updated-mean-stress.mjs":"4e91089ebd54aff4b2b1cd8479aef94dc255f14320ccf08f2cb60cf15c4b0ff4",
  "mathscope-m3/navier/global-source-index.mjs":"a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f",
  "mathscope-m3/navier/source-global-expressions.mjs":"89904bd7441a57cf634ff7b4c579e9ee7688868d14eafd999e44f41f74f0c2d1",
  "mathscope-m2/navier/actual-continuation-exact-functions.mjs":"326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311",
  "mathscope-m2/navier/source-profile-data.mjs":"df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
  "mathscope-m2/navier/actual-common-physical-jet-kernel.mjs":"4ffa1f1608b12b54efa36b2f7e185c48fe1522c943206f2223b2c60299b70a00"
};
const verifiedGitBlobs={};
for(const [f,pin] of Object.entries(sourcePins)){
  const bytes=fs.readFileSync(path.join(runtime,f));
  assert.equal(sha(bytes),pin,f);
  const recorded=pr30.verifiedFiles.find(r=>r.path==="research-ide/"+f);
  if(recorded){
    const blob=crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0")).update(bytes).digest("hex");
    assert.equal(blob,recorded.gitBlobSHA,f);
    assert.equal(bytes.length,recorded.byteLength,f);
    verifiedGitBlobs[f]=blob;
  }
}
assert.equal(Object.keys(verifiedGitBlobs).length,4);
const load=f=>import(pathToFileURL(path.resolve(runtime,f)).href);
const {assertSourceProfile,SOURCE_PROFILE_ID}=await load("mathscope-m2/navier/source-profile.mjs");
const {GlobalSourceExpressions}=await load("mathscope-m3/navier/source-global-expressions.mjs");
const {globalMeanGeometry}=await load("mathscope-m3/navier/source-global-current.mjs");

const expected=[17732748,17732766,17732767,17733017,17734051,17743697,17743725,17744103,17744107,17745449];
assert.deepEqual(closure.denominatorOriginalIds,expected);
const C=new Map(closure.records.map(x=>[x.originalId,x.record]));
const F=new Map(frontier.nodes.map(x=>[x.id,x.node]));
const direct=(i,op,args)=>assert.deepEqual(C.get(i)??F.get(i),{op,args},String(i));
const R=17732748,Z=17732749,T=17732750,s=17732766,Q=17732740,Xa=3617,Xb=28826;
direct(R,"coordinate",["m3_global_band_slow_R$1207473"]);
direct(Z,"coordinate",["m3_global_band_slow_Z$1207474"]);
direct(s,"actual_monotone_root",[2,Z,T]);
direct(17732767,"integer_power",[R,2]);
direct(17733017,"log_positive",[14220487]);
direct(14220487,"add",[474,3622]);
direct(474,"rational",["4","1"]);
direct(3622,"sqrt_positive",[24]);
direct(24,"rational",["2","1"]);
direct(17734051,"multiply",[R,17734050]);
direct(17734050,"sqrt_positive",[Q]);
assert.equal(primary.domain.actualWindow.Q,Q);
assert.equal(primary.domain.actualWindow.ell,17732737);
assert.equal(primary.domain.exactPrefixProof.includes("original"),true);
direct(17744107,"multiply",[24,17743688]);
direct(17745449,"multiply",[17733026,17745448]);
direct(17733026,"exp",[17733025]);
direct(17745448,"exp",[17745447]);
direct(Xa,"source_parameter",["Xa"]);
direct(Xb,"multiply",[12,28825]);

const before=17743683,retained=new Map([...F].filter(([i])=>i<before));
for(const [i,n] of C)if(i<before){if(retained.has(i))assert.deepEqual(n,retained.get(i));retained.set(i,n);}
// T is an opaque positive-chart coordinate in the retained root. It is
// represented by a distinct coordinate only to run the radial constructor.
if(!retained.has(T))retained.set(T,{op:"coordinate",args:["replay_declared_slow_T"]});
const G=Object.create(GlobalSourceExpressions.prototype);
Object.assign(G,{source:assertSourceProfile(SOURCE_PROFILE_ID),nodes:[],lookup:new Map(),
  derivatives:new Map(),substitutions:new Map(),serial:99999999,zero:0,one:1,
  maxNodes:18000000,maxDerivativeOrder:128,freeCoordinateCache:new Map([[Xb,new Set()]])});
for(const [i,n] of retained){G.nodes[i]=n;G.lookup.set(JSON.stringify([n.op,n.args]),i);}
G.nodes.length=before;
const g=globalMeanGeometry(G,{coordinates:{R,Z,T},chart:{s,Xb}});
const generated=G.nodes.slice(before).map((record,i)=>({id:before+i,record}));
const overlap=generated.filter(x=>C.has(x.id)||F.has(x.id));
assert(overlap.length>=11);
for(const x of overlap)assert.deepEqual(x.record,C.get(x.id)??F.get(x.id),String(x.id));
assert.deepEqual([g.X0,g.radialVariable,g.innerRadius,g.outerRadius,g.unnormalized,g.rhoMass,g.rho,g.cRho,g.chi],
  [17743683,17743710,17743711,17743713,17743709,17743725,17743727,17743733,17743734]);
assert.equal(g.checks.every(x=>x.pass),true);
const newest=cycle.stages.find(x=>x.name==="original-latest-corollary-8-5-stress");
assert(newest.checks.find(x=>x.id==="latest-stress-original-positive-bump-mass").pass);
assert(newest.checks.find(x=>x.id==="latest-stress-original-full-radial-envelope").pass);
assert.equal(newest.rawSourceRoots[5],g.cRho);
const integral=C.get(g.rhoMass);
assert.deepEqual(integral,G.nodes[g.rhoMass]);
const [body,binder,left,right]=integral.args;
assert.deepEqual([binder,left,right],[g.radialVariable,g.innerRadius,g.outerRadius]);
assert.deepEqual(G.nodes[body],{op:"multiply",args:[17743698,17743723]});
assert.deepEqual(G.nodes[g.X0],{op:"source_parameter",args:["X0Imean"]});
const pp=G.source.parametersExactExpressions;
assert.deepEqual(pp.X0Imean,{product:[{ref:"XR"},{exp:{sum:[{ref:"T"},{integer:2},
  {product:[{integer:60},{ref:"BOuter"}]},{integer:-8}]}}]});
assert.deepEqual(pp.ImeanRight,{product:[{ref:"X0Imean"},{exp:{integer:5}}]});
assert.deepEqual(pp.Xa,{quotient:[{integer:4},{ref:"Lambda"}]});
assert.deepEqual(pp.BOuter,{product:[{integer:1000},{ref:"T"}]});
assert.deepEqual(pp.h,{exp:{product:[{integer:-8002},{ref:"T"}]}});
const opposite={op:"definite_integral",args:[body,binder,right,left]};
assert.notDeepEqual(opposite,integral);
assert(20n*3n**6n<2n**14n);

// Literal shell of the actual implicit derivative, leaving the omitted
// exponent operand separate. The pinned constructor gives its real form.
direct(9,"source_parameter",["h"]);
direct(25,"multiply",[9,24]);
direct(20,"rational",["-1","1"]);
direct(17732757,"integer_power",[Z,2]);
direct(17744089,"exp",[17744088]);
direct(17744098,"inverse",[s]);
direct(17744099,"multiply",[25,17744098]);
direct(17744100,"multiply",[17744089,17744099]);
direct(17744101,"multiply",[17732757,17744100]);
direct(17744102,"multiply",[20,17744101]);
direct(17744103,"add",[1,17744102]);
direct(17744106,"multiply",[20,17744105]);
direct(17744108,"inverse",[17744107]);
direct(17744109,"multiply",[17744106,17744108]);
assert(!C.has(17744088)&&!F.has(17744088));

const rows=[
  [17732748,"R","R>0 on the admitted regular annulus"],
  [17732766,"s","1/2<=s<=2 on the original inverse image"],
  [17732767,"R^2","square of positive R"],
  [17733017,"log(4+sqrt(2))","positive argument strictly greater than 1"],
  [17734051,"R sqrt(Q)","Q=exp(-ell log(2))>0 and R>0"],
  [17743697,"sqrt(2 X0Imean) exp(1/2) sqrt(s)","original source patch and chart factors are strictly positive"],
  [17743725,"whole mean bump mass","ordinary positive integral >= exp(-16/3)/20 > 2^-14 on the original envelope"],
  [17744103,"derivative of original inverse residual in s","1-2h Z^2 s^(2h-1)=1-2h eta^2>7/8 on the chart; raw exponent child omitted"],
  [17744107,"2 sqrt(s)","positive original bracket"],
  [17745449,"exp(a) exp(b)","positive when the two retained opaque exponent inputs denote finite reals"]
].map(([id,role,reason])=>({id,role,reason}));
const out={schema:"MathScope.SameLiveN3DirectSplitDenominatorDomains/1",
  status:"CONDITIONAL_POSITIVITY_OF_SAME_LIVE_DENOMINATORS_ON_ADMITTED_SOURCE_CHART",
  artifactPins,sourcePins,verifiedGitBlobs,rows,
  meanMass:{root:g.rhoMass,originalRecord:integral,reconstructedOperandIds:[body,binder,left,right],
    alignedOriginalRecords:overlap.map(x=>x.id),sealedActualSecondMoment:g.cRho,allocationStart:before,
    proof:"On support u=10(R/(x0 sqrt(s))-1), dR=(x0 sqrt(s))/10 du; rhoMass=(1/10) integral_0^1 exp(-1/(u(1-u)))du >= exp(-16/3)/20 > 2^-14 using u in[1/4,3/4].",
    supportParameters:["X0Imean=Xp exp(-8)","ImeanRight=Xp exp(-3)","Xa=4/Lambda","BOuter=1000 T","h=exp(-8002 T)"],
    reconstruction:generated,sparseSourceReconstruction:true,missingRawChildBytesClaimedExported:false,
    coordinateSerialsAreLocal:true,fixedXbLeafDenotation:"Xb=XR exp(last.end) is independent of slow coordinates, as in the sealed envelope proof.",
    reversedOrientationRejected:true},
  remainingSourceObligations:{originalNativeContinuityAndDerivativesStillRequired:true,
    implicitOriginalRawExponentNodeUnexported:17744088,opaqueExponentsRequireFiniteRealDenotation:[17733025,17745447]},
  exactValuesNumericallyEvaluated:false,wholeFieldOrJetsPromoted:false,release:"HOLD"};
fs.writeFileSync(output,JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({status:out.status,denominators:rows.length,matchingAnchors:overlap.length,positiveBump:g.rhoMass}));
