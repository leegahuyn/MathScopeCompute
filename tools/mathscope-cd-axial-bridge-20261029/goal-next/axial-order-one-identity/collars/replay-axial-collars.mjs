/** Exact order-one stress branch audit; source integrals are preserved. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {pathToFileURL} from "node:url";

const [navier,registryFile,output]=process.argv.slice(2);
assert(navier && registryFile && output && !fs.existsSync(output));
const sha=x=>crypto.createHash("sha256").update(x).digest("hex");
const pins={
  "actual-continuation-exact-stress.mjs":"22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2",
  "actual-continuation-exact-order-one.mjs":"bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72",
  "actual-continuation-exact-support.mjs":"0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98",
  "actual-global-pressure-kernels.mjs":"43896a8d8a3156fbe6736092263f5cb95372bcd8742292af5e40322563c02c42",
  "actual-continuation-exact-identities.mjs":"bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712",
  "actual-global-source-expressions.mjs":"cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3",
  "actual-continuation-exact-functions.mjs":"326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311"
};
for(const [f,digest] of Object.entries(pins))assert.equal(sha(fs.readFileSync(path.join(navier,f))),digest,f);
const moduleURL=f=>pathToFileURL(path.resolve(navier,f)).href;
const {prepareActualOrderOneStressProgram}=await import(moduleURL("actual-continuation-exact-stress.mjs"));
const {reduceExpressionOnDeclaredBranches}=await import(moduleURL("actual-global-pressure-kernels.mjs"));
const {sourceGraphRationalIdentity}=await import(moduleURL("actual-continuation-exact-identities.mjs"));
const registryBytes=fs.readFileSync(registryFile),registrySHA256=sha(registryBytes);
assert.equal(registrySHA256,"bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e");
const legacy=JSON.parse(JSON.parse(registryBytes).base.base.expression);
assert.equal(legacy[672].name,"ActualAllFiniteOrderOneStress_z");
assert.equal(legacy[672].body,117069);
assert.equal(legacy[1].body,117047);
assert.deepEqual(legacy[1].parameters,[4756,2]);

const p=prepareActualOrderOneStressProgram({terms:0,bits:128,heatIterations:0});
const {G,orderOne:r,roots}=p,{X,eta,Xv}=p.constants,{zero:z,one:o}=G;
const n=id=>G.nodes[id],q=(a,b=1)=>G.q(a,b);
const prefixSHA256=sha(JSON.stringify(G.nodes.slice(0,117100)));
assert.equal(prefixSHA256,"d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116");
const support=p.stress.supportOrder;
assert.equal(support.pass,true);
assert.equal(support.expressionChecks.allEndpointsIndependentOfEta,true);
assert(support.inequalities.includes("Xminus<Xkeep<Xcut<a^2<IposLeft<IposRight<Xv<Xplus<Xb"));
assert(support.inequalities.includes("all five radial bump endpoints<IposRight"));
assert.equal(support.arithmeticChecks.allIposBumpsBeforeRight,true);
const {Xminus,Xkeep,Xcut,IposRight,lastU,Xplus,aSquared}=support.endpoints;
assert.deepEqual([X,eta,Xminus,Xkeep,Xcut,IposRight,lastU,Xv,Xplus,aSquared],[4756,2,28814,28819,28823,28988,29328,3293,28824,24805]);
assert([Xminus,Xkeep,Xcut,IposRight,lastU,Xv,Xplus].every(x=>G.derivative(x,eta)===z));
assert.equal(p.stress.axial,117045);
assert.deepEqual(n(117047),{op:"smooth_piecewise",args:[X,Xminus,Xplus,z,117045,z]});
assert.deepEqual(n(117069),{op:"smooth_piecewise",args:[X,Xminus,Xplus,z,117059,z]});
assert.deepEqual([[117057,117055,117056,Xminus,X],[117066,117064,117065,X,Xplus],[117075,117073,117074,Xminus,Xplus]].map(([i,b,d,l,u])=>[
  n(i).op,n(i).args.join(","),n(d).op,n(d).args[0],n(d).args[1].join(","),n(d).args[2].join(","),n(b).op
]),[[117057,117055,117056,Xminus,X],[117066,117064,117065,X,Xplus],[117075,117073,117074,Xminus,Xplus]].map(([i,b,d,l,u])=>[
  "definite_integral",[d,b,l,u].join(","),"actual_expression_partial",1,[b,eta].join(","),"0,0","coordinate"
]));

const fixedLeft=b=>b.coordinate===X&&b.left===Xkeep?3:b.coordinate===X&&b.left===r.X0?3:null;
const rewrite=(id,choice,steps)=>reduceExpressionOnDeclaredBranches(G,id,{coordinate:X,selectPiecewise:choice,stepValues:steps});
const leftU=rewrite(r.U1,fixedLeft),leftPi=rewrite(r.Pi1,fixedLeft);
const leftM=rewrite(r.M1overX,fixedLeft);
assert.equal(leftU.value,p.inner.U1at(X));
assert.equal(leftPi.value,G.picardEven(p.inner.system,3,X,eta));
const avg=n(leftM.value);
assert.deepEqual(avg.args.slice(2),[z,o]);
assert.equal(avg.op,"definite_integral");
assert.equal(avg.args[0],p.inner.U1at(G.mul(avg.args[1],X)));

// An explicitly normalised bump selector inherits the certified order of
// the corresponding physical upper support X0*rj^2. No integrals are erased.
const knownRadialRight=new Set([Xcut,IposRight,lastU,Xv,...support.leadingExterior.physicalRightEnds]);
const bumpRight=new Set(r.supports.map(row=>row[1]));
const leadingTail=support.leadingExterior;
const right=(b)=>{
  if(b.id===r.Pi1)return 4;
  if(b.coordinate===X && knownRadialRight.has(b.right))return 5;
  if(b.coordinate===r.normalizedR && bumpRight.has(b.right))return 5;
  if(b.coordinate===leadingTail.tailLogCoordinate && b.right===leadingTail.tailLogRight)return 5;
  return null;
};
const stepValues=new Map();
for(let j=0;j<5;j++)for(const t of [
  G.div(G.sub(G.div(X,G.parameter("XR")),q(j+6,2048)),q(1,4096)),
  G.div(G.sub(G.div(X,G.parameter("X0I1")),q(j+9)),q(1,2))
])for(let k=0;k<=3;k++)stepValues.set(G.step(t,k),k?z:o);
const rightRows=Object.fromEntries(Object.entries({
  U0:p.finalU,v0:p.finalv,U1:r.U1,v1:r.v1,M1:r.M1,M1overX:r.M1overX,Pi1:r.Pi1
}).map(([name,id])=>[name,rewrite(id,right,stepValues)]));
for(const [name,row] of Object.entries(rightRows)){
  if(name!=="Pi1")assert.equal(row.value,z,name);
}
const moment3=roots.actualOrderOneMomentResidual2;
const correction3=roots.actualOrderOneCorrectionMoment2;
const incoming3=roots.actualOrderOneIncomingMoment2;
assert.equal(moment3,71416);
assert.deepEqual(n(moment3),{op:"add",args:[incoming3,correction3]});
const pressureRight=rightRows.Pi1.value;
assert(!G.dependsOn(pressureRight,X));
const saturated=sourceGraphRationalIdentity(G,G.sub(pressureRight,moment3),{atomicNodes:[...r.localMoments,p.pressureOmega,...r.beta,...r.Emat[1]]});
assert.equal(saturated.pass,true);
assert.notEqual(pressureRight,z,"the source AST may not replace an accumulated prefix by zero");
const c0=sourceGraphRationalIdentity(G,G.sub(pressureRight,incoming3),{atomicNodes:[...r.localMoments,p.pressureOmega,...r.beta,...r.Emat[1]]});
assert.equal(c0.pass,false,"dropping the correction must change the saturated pressure");
const actualMoments=p.program.momentRepair.residualExpressions;
assert.equal(actualMoments.length,5);
assert.equal(actualMoments[2],moment3);
const allFiveRepairs=actualMoments.map((id,j)=>{
  const incoming=roots[`actualOrderOneIncomingMoment${j}`];
  const correction=roots[`actualOrderOneCorrectionMoment${j}`];
  assert.deepEqual(n(id),{op:"add",args:[incoming,correction]});
  const rationalIdentity=sourceGraphRationalIdentity(G,id,{atomicNodes:r.moments});
  assert.equal(rationalIdentity.pass,true);
  assert.equal(rationalIdentity.numeratorMonomials,0);
  const omitted=sourceGraphRationalIdentity(G,incoming,{atomicNodes:r.moments});
  assert.equal(omitted.pass,false);
  return {row:j+1,residual:id,incoming,correction,rationalIdentity,omittedCorrectionRejected:true};
});
const actualRepair=allFiveRepairs[2].rationalIdentity;
const affineControl=sourceGraphRationalIdentity(G,incoming3,{atomicNodes:r.moments});
assert.equal(affineControl.pass,false);
assert.deepEqual(actualRepair.denominatorOperands,[16,29171,29200,29162,29167]);
const lam=G.parameter("lambda"),expR=e=>G.exp(G.mul(e,G.log(r.Rbase)));
const denominatorBindings={
  onePlusEtaSquared:G.add(o,G.pow(eta,2)),
  positiveFluxScale:G.mul(r.ef,expR(G.mul(q(-2),lam))),
  pressureRepairDeterminant:G.determinant(r.Emat),
  radialBaseSquared:G.pow(r.Rbase,2),
  positivePressureScale:G.mul(q(2),r.ef,expR(G.sub(q(-2),G.mul(q(2),lam))))
};
assert.deepEqual(Object.values(denominatorBindings),actualRepair.denominatorOperands);
const originalMomentInverseProof=p.program.momentRepair.proof;
assert.equal(p.program.momentRepair.universalLinearIdentity.pass,true);
assert(Object.values(originalMomentInverseProof.checks).every(Boolean));

const integrals=[117057,117066,117075];
const fixedEtaCopies=integrals.map(id=>{
  const original=n(id),derived=G.derivative(id,eta),node=n(derived),binder=original.args[1];
  assert.equal(node.op,"definite_integral");
  assert.deepEqual(node.args.slice(1),original.args.slice(1));
  assert.deepEqual(n(node.args[0]),{op:"actual_expression_partial",args:[1,[binder,eta],[0,1]]});
  return {source:id,localDerivative:derived,body:node.args[0],binder,
    endpoints:node.args.slice(2),formalOrders:[0,1],noEndpointTerm:true};
});
const actualEndpoint=G.expressionValue(1,[X,eta]);
const radialCopies=integrals.map(id=>G.derivative(id,X));
assert.deepEqual(radialCopies,[actualEndpoint,G.neg(actualEndpoint),z]);

const brief=a=>({source:a.source,value:a.value,trace:a.trace});
const receipt={schema:"MathScope.OrderOneAxialStrictZeroCollars/1",status:"CONDITIONAL_ORDER_ONE_STRICT_ZERO_COLLARS_BOUND_TO_ACTUAL_SOURCE",
  pins,registrySHA256,originalPrefix:{count:117100,sha256:prefixSHA256},
  endpoints:{Xminus,Xkeep,Xcut,IposRight,lastU,Xv,Xplus,aSquared},
  roots:{raw:117045,density:117047,stress:117069,forwards:117057,backwards:117066,whole:117075},
  left:{interval:"0<X<Xkeep across Xminus",U1:brief(leftU),Pi1:brief(leftPi),M1overX:brief(leftM),
    averageBinder:{id:leftM.value,variable:avg.args[1],body:avg.args[0],interval:[z,o],actualRadialOperand:G.mul(avg.args[1],X)},
    necessary:"Actual ordinary core Picard ODE/PDE and same-source leading fields, regular tX average, pressure and jet identities hold for 0<X<Xkeep."},
  right:{interval:"Xv<X<Xplus; at and above Xplus the pressure uses literal zero",
    rows:Object.fromEntries(Object.entries(rightRows).map(([role,row])=>[role,brief(row)])),
    actualPressureIdentity:{sourcePi:r.Pi1,saturated:pressureRight,moment3,incoming3,correction3,exactRationalDifferenceZero:saturated.pass,
      rationalRepair:actualRepair,denominatorBindings,originalDeterminantProof:originalMomentInverseProof.normalizedE,
      denominatorPremise:"Positive source amplitude / radius factors, real eta and the original nonzero Emat determinant."},
    radialV1UsesLiteralZeroAverage:true,needsMoment1ForGlobalStreamIdentityButNotForV1ExteriorBranch:true,
    necessary:"The exact original pressure repair equation moment 3 holds pointwise in eta; Picard/ordinary derivatives of literally zero fields vanish on the strict collar."},
  negativeControls:{withoutPressureCorrection:saturated.pass&&!c0.pass,uncancelledPressureNotLiteralZero:pressureRight!==z,uncorrectedMomentFail:!affineControl.pass},
  allFiveActualMomentRepairs:{zeroNumerators:allFiveRepairs.length,rows:allFiveRepairs,
    matrixDenominatorBindings:{axial:G.determinant(r.Umat),angularPressure:G.determinant(r.Emat)},
    determinantBounds:{axial:originalMomentInverseProof.normalizedU,angularPressure:originalMomentInverseProof.normalizedE},
    scope:"Exact algebra with the original five incoming integral operands retained. Whole-integral denotation of the physical moments and positivity/nonzero analytic denominators are separate."},
  conditionalNativeCalculus:{fixedEtaCopies,radialCopies,actualEndpoint,
    language:"These are literal, exact AD source replays. Ordinary FTC and differentiation under the integral follow for the corresponding real denotation under the stated integrability and domination."},
  conclusions:{fixedIntegrationSupport:"[Xkeep,Xv] lies strictly inside original [Xminus,Xplus]",
    endpointJetMatching:"Conditional strict zero neighborhoods remove separate matching jets at Xminus and Xplus.",
    valuePrimitiveMatching:"Interior forward/backward difference is whole/sqrt(2X). At Xplus the implemented forward primitive matches zero iff the whole integral vanishes.",
    etaUnderIntegral:"Ordinary eta jets need continuous supported derivative under a compact uniform integrable bound; all jumps in radial branch selection are fixed. No moving-limit term. Literal calculus is conditional on the native integral denotation.",
    allN:false},release:"HOLD"};
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+"\n");
console.log(JSON.stringify({status:receipt.status,pressureRight,moment3,
  actualMomentRows:allFiveRepairs.map(row=>[row.residual,row.rationalIdentity.numeratorMonomials]),
  negative:!c0.pass}));
