/** Verify the retained shared inner kernel and higher-order caller scope. */
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

const [runtime, output] = process.argv.slice(2);
assert(runtime && output, "Provide the original navier source directory and an output JSON path.");
const files = {
  induction: ["actual-residual-order-induction-source.mjs", "30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047"],
  omega: ["actual-continuation-exact-order-two-source.mjs", "1ebf8b2b6f1df054a06309c5dc8695f2f3a867733544ab012f206bfed2969dd0"],
  functions: ["actual-continuation-exact-functions.mjs", "326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311"],
  inner: ["actual-continuation-exact-inner.mjs", "3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8"],
  orderOne: ["actual-continuation-exact-order-one.mjs", "bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72"],
  pre: ["actual-continuation-exact-pregluing.mjs", "7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3"],
  b8: ["actual-continuation-exact-b8.mjs", "1e0d6586a60ee5aa3d5315c40f624ebb9e8a4925a00117818d41d6697fc67baf"],
  loop: ["actual-continuation-exact-loop.mjs", "07ee5caa8ce45a9d8a910cab7243ae3e351965a8602a38030917f69114d8902d"],
  global: ["actual-continuation-exact-global.mjs", "497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f"],
  stress: ["actual-continuation-exact-stress.mjs", "22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2"],
  identities: ["actual-continuation-exact-identities.mjs", "bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712"]
};
const text = {};
for (const [key, [file, pin]] of Object.entries(files)) {
  const bytes = readFileSync(resolve(runtime, file));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), pin, file);
  text[key] = bytes.toString("utf8");
}
const load = key => import(pathToFileURL(resolve(runtime, files[key][0])).href);
const cut = (source, start, end) => {
  const lo = source.indexOf(start);
  const hi = source.indexOf(end, lo + start.length);
  assert(lo >= 0 && hi > lo, start);
  return source.slice(lo, hi);
};
const system = cut(text.induction, "function sourceSystem(", "function actualCutoffRestriction(");
const local = cut(text.induction, "function actualCutoffRestriction(", "function completeOrder(");
const whole = cut(text.induction, "function completeOrder(", "function attachStress(");
const prepare = cut(text.induction, "export function prepareActualOrderInduction(", "export function assertActualOrderInduction(");
const partial = cut(text.functions, "  picardPartialSum(", "  simultaneousSubstitute(");
const scopes = [
  ["ode reads lower local or auxiliary fields only", system, s => s.includes("(_,i)=>i===0?records[0][kind]:records[i][kind]") && !s.includes(".global")],
  ["omega receives order n-1", system, s => s.includes("{order:n-1,X,eta,U,v}")],
  ["theta and z use n-1 viscosity", system, s => s.includes("const prev=G.mul(q(2*(n-1)),h)") && s.includes("Z(G.add(b,prev),F[n-1])") && s.includes("Z(G.add(c,prev),U[n-1])")],
  ["omega receives n-2 axial viscosity", text.omega, s => s.includes("if(order>0)terms.push(G.neg(Z(G.sub(G.sub(lambda(order-1),D),G.one),Z(G.sub(lambda(order-1),G.one),v[order-1]))))")],
  ["X is replaced by xi squared with the same eta", system, s => s.includes("atXi=id=>G.substitute(id,X,G.pow(xi,2))") && s.includes("kind,linearKernel:kernel,xi,eta")],
  ["component two is K and the regular raw average is U+K", system, s => s.includes("'Avg(U_n)-U_n'") && s.includes("average=G.add(Un,G.picardEven(system,2,X,eta))")],
  ["actual local cutoff and fresh averaging argument", local, s => s.includes("G.choose(X,r.Xkeep,r.Xcut,raw.U,G.mul(kappa,raw.U),G.zero)") && s.includes("G.integral(G.substitute(U,X,G.mul(t,X)),t,G.zero,G.one)")],
  ["whole moments have fresh radial binders and preserve eta", whole, s => s.includes("G.share(body,[X,eta],name+'_body')") && s.includes("G.integral(G.substitute(shared,X,t),t,a,b)")],
  ["whole omega right operand reads completed global lower history", whole, s => s.includes("records.slice(0,n).map(r=>r.global)") && s.includes("U:lower.map(r=>r.U),v:lower.map(r=>r.v)")],
  ["whole omega starts its right branch at a squared", whole, s => s.includes("G.choose(X,bootstrap.inner.aSquared,Xplus,raw.omegaOverX,omegaRaw,z)")],
  ["whole lower moment operators integrate to Xplus", whole, s => ["integrate(lowerPressure,z,Xplus", "integrate(lowerBodies[1],z,Xplus", "G.mul(q(1,2),X,omega)),z,Xplus"].every(v => s.includes(v))],
  ["completed lower histories required before generation", prepare, s => s.indexOf("!r.global.completed") < s.indexOf("auxiliary=sourceSystem") && s.includes("!r.global.completed")],
  ["new global fields generated after new local fields", prepare, s => s.indexOf("raw=sourceSystem") < s.indexOf("global=completeOrder") && s.indexOf("global=completeOrder") < s.indexOf("records.push")],
  ["raw core leading F/U are natural up to Xa", text.inner, s => s.includes("G.choose(X,Xa,aSquared,naturalF,collarF,collarF)") && s.includes("G.choose(X,Xa,aSquared,naturalU,collarU,collarU)")],
  ["B.26 leading actual and pre-C.12 prefixes use one U and one core primitive", text.b8, s => s.includes("pre.functions.B26UAt(X),Gi)") && s.includes("coreMa=pre.functions.coreMoments(q(4))[0]") && s.includes("pre.functions.B26UAt(vB),vB,Xa,X")],
  ["C.12 selects its old v on the left of Ileft", text.global, s => s.includes("G.choose(X,Ileft,I1Right,loop.b8.actualPreC12v,modifiedVoverX,loop.b8.actualPreC12v)")],
  ["partial sums preserve the ray and the Volterra diagonal", partial, s => s.includes("this.pow(t,s.diagonal[i]),this.substitute(f,s.xi,this.mul(t,s.xi))") && s.includes("t,this.zero,this.one")],
  ["partial sums use the same eta derivative in A1 only", partial, s => s.includes("s.A0.map") && s.includes("this.mul(v,this.derivative(term[j],s.eta))")],
  ["loop base axial field is the original pre-C.12 U", text.loop, s => s.includes("U=b8.actualPreC12U")],
  ["B.26 early leading U and v remain below repairs", text.global, s => s.includes("const finalU=G.add(U,du,repairU)") && s.includes("const finalv=G.choose(X,Ileft,I1Right,loop.b8.actualPreC12v")],
];
for (const [label, src, test] of scopes) assert(test(src), label);
const changed = [
  [scopes[0], system.replace("records[i][kind]", "records[i].global")],
  [scopes[3], text.omega.replace("v[order-1]))))", "v[order]))))")],
  [scopes[6], local.replace("X,G.mul(t,X))", "X,X)")],
  [scopes[9], whole.replace("X,bootstrap.inner.aSquared,Xplus", "X,Xcut,Xplus")],
  [scopes[16], partial.replace("this.mul(t,s.xi)", "s.xi")],
];
for (const [[label, , test], src] of changed) assert(!test(src), "negative: " + label);

const {prepareActualOrderOneStressProgram} = await load("stress");
const {actualInductionLinearKernel} = await load("induction");
const {buildActualOmegaCoefficientOverX, sourceScaledOperators} = await load("omega");
const {sourceGraphRationalIdentity} = await load("identities");
const native = prepareActualOrderOneStressProgram({terms:0,bits:128,heatIterations:0});
const {G, inner, constants:{X,eta}} = native;
const {F0,U0,v0,lambda1,omegaOverX} = inner;
const s = G.picardSystems[inner.system], q = (n,d=1) => G.q(n,d), {A,D,d,L,Ustar,g} = G.core;
assert.deepEqual(s.diagonal, [0,0,2,0,3,1]);
assert.deepEqual(s.zeroAxisDatum, [0,0,0,0,0,0]);
assert(!s.A1.some((row,i)=>row.some((v,j)=>v!==G.zero&&(i<4||j>=4))));
const atXi = v => G.substitute(v,X,G.pow(s.xi,2));
const {Z} = sourceScaledOperators(G,X,eta);
const match = (x,y,atomicNodes=[]) => sourceGraphRationalIdentity(G,G.sub(x,y),{atomicNodes,maxTerms:20000}).pass;
const Lambda=G.parameter("Lambda"), Xa=G.parameter("Xa"), Y=G.mul(Lambda,X);
const naturalF=G.mul(g,G.natural("Phi",Y)), naturalU=G.add(Ustar,G.div(G.natural("u",Y),Lambda));
const average=G.add(Ustar,G.div(G.natural("average",Y),Lambda));
const naturalV=G.div(G.sub(G.sub(G.mul(q(2),eta,naturalU),G.mul(q(2),D,eta,average)),G.mul(d,G.derivative(average,eta))),L);
const leadingCore=[["F0",F0,naturalF],["U0",U0,naturalU],["v0",v0,naturalV]].map(([label,field,expected])=>{
  const {op,args}=G.nodes[field];
  assert.equal(op,"smooth_piecewise",label);
  assert.deepEqual(args.slice(0,4),[X,Xa,inner.aSquared,expected],label);
  return {label,field,leftGuard:Xa,sharedNaturalBody:expected};
});
const omega0 = buildActualOmegaCoefficientOverX(G,{order:0,X,eta,U:[U0],v:[v0]}).value;
const vX=G.derivative(v0,X), vXX=G.derivative(vX,X), vEta=G.derivative(v0,eta);
assert(match(omegaOverX,omega0,[U0,v0,vX,vXX,vEta]),"order-one standalone omega");
const b=G.neg(G.add(A,q(1,2))), c=G.neg(A);
const Htheta=G.neg(Z(G.sub(b,D),Z(b,F0))), Hz=G.neg(Z(G.sub(c,D),Z(c,U0)));
const pKnown=G.mul(q(-1,2),omegaOverX);
const k=actualInductionLinearKernel(G,{X,eta,xi:s.xi,lambda:lambda1,F0,U0,v0,pKnown,Htheta,Hz});
const atomBase=[v0,pKnown,...[F0,U0].flatMap(f=>{
  const fx=G.derivative(f,X), fe=G.derivative(f,eta);
  return [f,fx,fe,G.derivative(fx,X),G.derivative(fx,eta),G.derivative(fe,X),G.derivative(fe,eta)];
})].map(atXi);
const matched=[];
for (const [name, actual, retained] of [["A0",k.matrix0,s.A0],["A1",k.matrix1,s.A1],["forcing",[k.rawForcing],[s.forcing]]]) {
  actual.forEach((row,i)=>row.forEach((v,j)=>{
    const label=name+"["+i+"]["+j+"]";
    assert(match(atXi(v),retained[i][j],atomBase),label);
    matched.push(label);
  }));
}
assert(!match(G.one,s.A0[2][5]),"negative K transport sign");
// The first nested Omega viscosity is formed directly on the original operator.
const U1=G.fresh("scope_U1"),v1=G.fresh("scope_v1");
const omega1=buildActualOmegaCoefficientOverX(G,{order:1,X,eta,U:[U0,U1],v:[v0,v1]});
const z0=G.sub(G.neg(D),G.one), firstViscosity=G.neg(Z(z0,Z(q(-1),v0)));
assert(match(omega1.terms.at(-1),firstViscosity,[v0,vX,vXX,vEta,G.derivative(vEta,X),G.derivative(vEta,eta)]));
assert.equal(omega1.axialViscosityShift,0);
assert(!match(omega1.terms.at(-1),G.neg(Z(z0,Z(q(-1),v1))),[omega1.terms.at(-1)]));
const result={
  schema:"MathScope.SourcePicardScope/1",
  sourceSHA256:Object.fromEntries(Object.values(files)),
  exactNativeOrderOne:{nodes:{system:inner.system,omegaStandalone:omegaOverX,omegaGeneric:omega0},matched,
    diagonal:s.diagonal,zeroAxisDatum:s.zeroAxisDatum,omega0:true,firstNestedOmegaViscosityUsesLeadingV:true},
  exactSharedLeadingCoreBodies:leadingCore,
  lexicalScopeChecks:scopes.map(([label])=>label),
  negativeControls:[...changed.map(([[label]])=>label),"K transport sign","first nested omega viscosity on positive-order v1"],
  noNumericSampling:true, realOrdinarySemanticProof:"SOURCE_PICARD_SCOPE.md"
};
writeFileSync(output,JSON.stringify(result,null,2)+"\n",{flag:"wx"});
console.log(`PASS ${matched.length} inner entries, ${leadingCore.length} common leading bodies, ${scopes.length} scope bindings, ${result.negativeControls.length} negative controls`);
