/** Bind real ordinary leading-axial hypotheses and strict support to original roots. */
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

const [runtime, archives, output] = process.argv.slice(2);
assert(runtime && archives && output, "Supply the original navier runtime, pinned source evidence and a fresh output JSON path.");
const runtimePins = {
  "actual-leading-all-order-jets.mjs":"d3af156118671a3e582c19a82064aab884a09d6ce81f51a6b2d64d35444cd29d",
  "actual-leading-stream-primitive.mjs":"4a9a1d28d9ee7cea2d776fe73bdeed3a95dbe62fdb50a51fa536d3ccc55667de",
  "actual-global-source-outer.mjs":"5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9",
  "actual-continuation-exact-loop.mjs":"07ee5caa8ce45a9d8a910cab7243ae3e351965a8602a38030917f69114d8902d",
  "actual-continuation-exact-global.mjs":"497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f",
  "actual-continuation-exact-core.mjs":"d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815",
  "actual-global-pressure-kernels.mjs":"43896a8d8a3156fbe6736092263f5cb95372bcd8742292af5e40322563c02c42",
  "actual-continuation-exact-identities.mjs":"bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712",
  "actual-continuation-exact-order-two-source.mjs":"1ebf8b2b6f1df054a06309c5dc8695f2f3a867733544ab012f206bfed2969dd0",
  "source-profile-data.mjs":"df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a"
};
const sourcePins = {
  "ACTIVATION_COLLAR_BOUNDS_EN.md":"2035fa202134d7ca0affcad7ad7aafbb05e3508fde3a5f34a3f2cea6fd003750",
  "B8_AND_PRELOOP_GAPS_EN.md":"e7a8b814e5e3c0489779a460323dd0744e79f9da9454d0be7a5d5b29de73d1a5",
  "GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md":"f27e8d640e9b8e49805c0128c987f043d5667c298b2029dd061b820ae9e3117b",
  "LOOP_DERIVATIVE_ENVELOPE.md":"531e5addbe900564c22e0b44406c9c024e7d279c03a7188ea17431a567fe1250",
  "OUTER_DERIVATION.md":"ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81",
  "QUANTITATIVE_LOOP_SELECTION.md":"937cfaace88466009c5f47a763e0f983d983c350fd754cd4cc57ad148d5897e6",
  "one-profile-0002.json":"184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd",
  "c12-loop-review-001.json":"3dca0c88dff605d5db1e962f0bf5140d0e520e17cf690cd02ba68e1f3122c099",
  "preloop-gap-0001.json":"76a7d327840e8825fe4bd6fec90bc6caee1d0800ad26e9788bafb741151a9d1f",
  "outer-envelope-certificate.json":"7da0ae60395cd3a8d2d428546271485daacbb570dd4757e284d7318c25b1a18d"
};
const sha = (algorithm, data) => createHash(algorithm).update(data).digest("hex");
const pinnedText = (base, pins) => Object.fromEntries(Object.entries(pins).map(([f,pin])=>{
  const b=readFileSync(resolve(base,f));
  assert.equal(sha("sha256",b),pin,f);
  return [f,b.toString("utf8")];
}));
const bodies=pinnedText(runtime,runtimePins), notes=pinnedText(archives,sourcePins);
const mod=f=>import(pathToFileURL(resolve(runtime,f)).href);
const {PINNED_N3}=await mod("source-profile-data.mjs");
const receipt=JSON.parse(notes["one-profile-0002.json"]), loopReview=JSON.parse(notes["c12-loop-review-001.json"]);
const preloopGap=JSON.parse(notes["preloop-gap-0001.json"]);
assert.equal(receipt.parameterExpressionSHA256,PINNED_N3.parameterExpressionSHA256);
assert.equal(receipt.sourcePaperSHA256,PINNED_N3.sourcePaperSHA256);
for (const [receiptKey,f] of [["loopReview","c12-loop-review-001.json"],["relaxedGaps","preloop-gap-0001.json"],["outer","outer-envelope-certificate.json"]])
  assert.equal(receipt.acceptedEvidence[receiptKey].sha256,sourcePins[f],receiptKey);
const pinnedPremises=["actual_both_boundary_collars_attached","actual_relaxed_gap_ledger_attached","actual_unchanged_J_outside_I_attached",
  "loopReview_executed_checks_pass","b8_same_outer_tree","b8Review_executed_checks_pass","outer_executed_checks_pass",
  "c2_same_outer_tree","c2Review_executed_checks_pass","frequency_source_operator"];
assert(pinnedPremises.every(k=>receipt.checks[k]===true));
assert.equal(loopReview.passed,75);
assert.equal(loopReview.total,75);
assert(preloopGap.allPassed);
assert.equal(preloopGap.sourceBinding.paperSHA256,PINNED_N3.sourcePaperSHA256);
assert.equal(preloopGap.sourceBinding.proofSHA256,sourcePins["B8_AND_PRELOOP_GAPS_EN.md"]);
for (const f of ["LOOP_DERIVATIVE_ENVELOPE.md","QUANTITATIVE_LOOP_SELECTION.md"]) assert.equal(loopReview.sourceSHA256[f],sourcePins[f]);
const {attachActualLeadingStreamPrimitive}=await mod("actual-leading-stream-primitive.mjs");
const {prepareActualGlobalLeadingProgram}=await mod("actual-continuation-exact-global.mjs");
const {actualLeadingAllOrderJets,ACTUAL_LEADING_ALL_ORDER_BINDINGS}=await mod("actual-leading-all-order-jets.mjs");
const {reduceExpressionOnDeclaredBranches}=await mod("actual-global-pressure-kernels.mjs");
const {sourceGraphRationalIdentity}=await mod("actual-continuation-exact-identities.mjs");
const {buildActualOmegaCoefficientOverX,sourceScaledOperators}=await mod("actual-continuation-exact-order-two-source.mjs");
for (const f of ["GLOBAL_SOURCE_DERIVATIVE_BOUNDS.md","LOOP_DERIVATIVE_ENVELOPE.md","OUTER_DERIVATION.md"])
  assert.equal(ACTUAL_LEADING_ALL_ORDER_BINDINGS.find(r=>r.path.endsWith("/"+f)).sha256,sourcePins[f]);
const source=attachActualLeadingStreamPrimitive(prepareActualGlobalLeadingProgram({etaDerivativeOrder:0,rootIterations:1}),{});
const {G,leading,parts,roots}=source, {X,eta,Xv,Iright,I1Right}=leading.constants;
const {D,d,L}=G.core, U=roots.actualGlobalU0, M=roots.actualGlobalM0, v=roots.actualGlobalv0;
const z=G.zero,o=G.one,q=(n,b=1)=>G.q(n,b);
const leadingNorm=actualLeadingAllOrderJets({radialOrder:3,etaOrder:4});
assert(leadingNorm.pass && leadingNorm.scope.arbitraryFiniteRecurrence);
assert.equal(leadingNorm.parameterExpressionSHA256,source.source.parameterExpressionSHA256);
assert.equal(leadingNorm.sourceFunctionIdentity.U0Root,U);
assert.deepEqual(leadingNorm.bounds.U0.domain,{X:["0","infinity"],eta:["-1","1"],exactZeroAfter:"Xv"});
assert(source.checks.every(r=>r.pass));
assert(parts.outer.affineRows.every(r=>r.pass));
const p=PINNED_N3.parametersExactExpressions, ref=name=>({ref:name}), integer=value=>({integer:value});
const expSum=(...summands)=>({exp:{sum:summands}});
const pulse=G.outer.stages.find(s=>s.id==="pulse"), {Xp,mConst}=G.outer.roots;
const expectedIpos={product:[ref("XR"),expSum(ref("T"),integer(2),{product:[integer(60),ref("BOuter")]},integer(-14))]};
assert.deepEqual(p.X0Ipos,expectedIpos);
assert.deepEqual(p.IposRight,{product:[ref("X0Ipos"),{exp:integer(5)}]});
assert.deepEqual(p.X0I1,{product:[ref("XR"),expSum(ref("T"),integer(2),{product:[integer(60),ref("BOuter")]},integer(-25))]});
assert.deepEqual(p.I1Right,{product:[ref("X0I1"),{exp:integer(5)}]});
assert.deepEqual(p.loopIRight,{product:[ref("XR"),expSum(ref("T"),integer(3))]});
assert.equal(Xv,G.mul(Xp,G.exp(pulse.length)));
assert(!G.dependsOn(Xv,eta) && !G.dependsOn(mConst,eta));
const tailLog=G.log(G.div(X,Xp)), {pre}=leading.loop.b8, iq=pre.constants;
const stepValues=new Map();
for(let j=0;j<5;j++)for(const y of [
  G.div(G.sub(G.div(X,G.parameter("XR")),q(j+6,2048)),q(1,4096)),
  G.div(G.sub(G.div(X,G.parameter("X0I1")),q(j+9)),q(1,2))
])for(let k=0;k<=3;k++)stepValues.set(G.step(y,k),k?z:o);
const afterEarly=new Set([iq.Xa,iq.Xi,iq.restLeft,iq.restRight,iq.XR,Iright,I1Right,leading.loop.b8.roots.B8patchRight,
  G.mul(iq.XR,G.exp(o)),G.mul(G.mul(iq.XR,G.exp(o)),G.exp(G.parameter("T")))]);
const read=(id,region)=>reduceExpressionOnDeclaredBranches(G,id,{coordinate:X,stepValues,atomicNodes:[mConst],
  selectPiecewise: b=>{
    if (b.coordinate===X&&afterEarly.has(b.right)) return 5;
    if (b.coordinate===tailLog&&b.left===z&&b.right===pulse.length) return region==="Ipos"?3:5;
    return null;
  }});
const check=(actual,expected,atoms=[mConst])=>sourceGraphRationalIdentity(G,G.sub(actual,expected),{atomicNodes:atoms}).pass;
const wait={U:read(U,"Ipos"),M:read(M,"Ipos"),v:read(v,"Ipos")};
const etaM=G.mul(eta,mConst), waitV=G.neg(G.div(mConst,X));
assert.equal(wait.U.value,z);
assert(check(wait.M.value,etaM));
assert(check(wait.v.value,waitV));
assert(check(G.add(G.mul(q(2),D,G.pow(eta,2)),d),L));
assert.equal(G.derivative(waitV,eta),z);
const {Z}=sourceScaledOperators(G,X,eta);
assert(check(Z(q(-1),waitV),z));
const waitOmega=buildActualOmegaCoefficientOverX(G,{order:0,X,eta,U:[z],v:[waitV]}).value;
const nonlinearWaitOmega=G.neg(G.div(G.pow(mConst,2),G.mul(q(2),G.pow(X,2))));
assert(check(waitOmega,nonlinearWaitOmega));
assert(!check(waitOmega,z),"Ipos leading nonlinear Omega must not be discarded");
const momentPrimitiveP=G.div(G.pow(mConst,2),G.mul(q(4),X));
const momentPrimitiveZ=G.mul(q(-1,4),G.pow(mConst,2),G.log(X));
assert(check(G.derivative(momentPrimitiveP,X),G.mul(q(1,2),waitOmega)));
assert(check(G.derivative(momentPrimitiveZ,X),G.mul(q(1,2),X,waitOmega)));
assert(!check(wait.v.value,z),"Ipos leading v must not be discarded");
const exterior=[U,M,v].map(id=>read(id,"right exterior"));
assert(exterior.every(a=>a.value===z));
const outerText=bodies["actual-global-source-outer.mjs"];
assert(outerText.includes("centers=[sub(pulse.length,q(3)),sub(pulse.length,o)]"));
assert(outerText.includes("sub(c,q(3,20)),sum(c,q(3,20)),t,'MbumpPrefix'"));
assert(outerText.includes("[q(10),q(11)]]"));
assert(outerText.includes("d.sqrt(sub(sq(amp1),mul(q(4),amp2,amp0)))"));
const amplitude=G.outer.equations.pulse;
assert.deepEqual(amplitude.selectedRootBracket,["9/10","6/5"]);
assert.equal(amplitude.sourceDerivativeFloor,"7/20");
const [a0,a1,a2]=amplitude.amplitudePolynomial;
const discriminant=G.sub(G.pow(a1,2),G.mul(q(4),a2,a0));
assert(check(G.add(a1,G.mul(q(2),a2,amplitude.amplitude)),G.sqrt(discriminant),[a0,a1,a2,discriminant,G.sqrt(discriminant)]));
assert(!check(G.sub(a1,G.mul(q(2),a2,amplitude.amplitude)),G.sqrt(discriminant),[a0,a1,a2,discriminant,G.sqrt(discriminant)]));
assert.equal(20-3,17);
const outputData={
  schema:"MathScope.LeadingAxialWholeSupport/1",sourceParameterSHA256:source.source.parameterExpressionSHA256,
  runtimePins,sourcePins,pinnedPremises,priorSourceChecks:source.checks.map(r=>r.id),
  actualRoots:{U,M,v,Xv,mConst,Xp,pulseLength:pulse.length,t:tailLog},
  currentUniformBound:{request:[3,4],sourceU0Root:leadingNorm.sourceFunctionIdentity.U0Root,boundRoot:leadingNorm.bounds.U0.root,
    ledgerRows:leadingNorm.normProgram.ledger.length,fixedOrderRecurrence:leadingNorm.scope.arbitraryFiniteRecurrence},
  Ipos:{logDomain:["-14","-9"],rightI1Log:"-20",waitFieldIds:Object.fromEntries(Object.entries(wait).map(([k,r])=>[k,r.value])),
    U:"0",M:"eta*mConst",v:"-mConst/X",etaJetsZeroForV:true,zMinusOneVZero:true,
    omegaOverX:"-mConst^2/(2 X^2)",vNonzeroControl:true,omegaNonzeroControl:true,
    pressureAndAxialPrimitives:[momentPrimitiveP,momentPrimitiveZ]},
  Xv:{leftCollarLogWidth:"17/20",rightGuardRoots:exterior.map(r=>r.value),zeroMassUsesOuterFirstAffineEquation:true,
    pulseLatestSupport:"13/lambda-1+3/20",fixedEtaIndependentSupport:true},
  exactAmplitudePositiveBranch:true,formalAllOrdersOrReleaseClaim:false
};
writeFileSync(output,JSON.stringify(outputData,null,2)+"\n",{flag:"wx"});
console.log("PASS same-source ordinary U0 ledger, mass/velocity transfer operands, Ipos wait and strict Xv collar");
