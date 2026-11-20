import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,registry,c99dir,c100dir,output]=process.argv.slice(2);
assert(output,'ORIGINAL_RUNTIME ORIGINAL_REGISTRY C99_Y C100_Y NEW_JSON');
const sha=value=>createHash('sha256').update(value).digest('hex');
const load=async(path,pin)=>{
  const bytes=await readFile(path);
  assert.equal(sha(bytes),pin,path);
  return JSON.parse(bytes);
};
const C99Ops='d52bfc8ddd4a9987cd25d3d4a2161cc10e19d8d2ee7975f87ae2e7b68f8e27be';
const C100='17664f981265e2373a5c16d0bf3c9dc233af48605974de1e072520b9932b71de';
const C100Ops='afa75d0bba159592b4ce217dc06c9b871fb7137f9617291240370a53b1aad35f';
const prev=await load(resolve(c100dir,'n1-radial-seams.json'),C100);
const priorSource=await load(resolve(c100dir,'n1-radial-seams-operands.json'),C100Ops);
const original=await load(resolve(c99dir,'n1-ipos-transfer-operands.json'),C99Ops);
assert.equal(prev.operandsSHA256,C100Ops);
const archived=await load(registry,original.registrySHA);
for(const [name,pin] of Object.entries(priorSource.sourcePins))
  assert.equal(sha(await readFile(resolve(runtime,name))),pin,name);
const stepBody=await readFile(resolve(runtime,'actual-global-source-expressions.mjs'),'utf8');
assert.ok(stepBody.includes('z=mul(ia,ia).map((v,k)=>-v+mul(ib,ib)[k])'));
const imports=name=>import(pathToFileURL(resolve(runtime,name)));
const src=await imports('actual-residual-order-induction-source.mjs');
const {sourceGraphRationalIdentity}=await imports('actual-continuation-exact-identities.mjs');
const live=src.prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,bootstrap,records}=live,{inner,orderOne:r,constants:{X,eta}}=bootstrap;
assert.equal(sha(JSON.stringify(G.nodes)),original.originalPrefixSHA256);
assert.deepEqual(G.picardSystems,JSON.parse(archived.base.picard).slice(0,2));
const {D,d,L,A}=G.core,q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one;
const {F1,U1,v1,Pi1}=r,raw=records[1].raw;
const F0=bootstrap.actualHeat.heat.finalF,U0=bootstrap.finalU,v0=bootstrap.finalv;
const stress=bootstrap.program.orderOneStress;
const {angularTerms:theta,axialTerms:axial}=stress;
const t1=G.parameter('t1'),Xa=G.parameter('Xa'),oneStep=G.div(t1,q(64));
const normalized=G.div(G.sub(G.log(G.div(X,Xa)),oneStep),oneStep);
const sigmaPrime=G.step(normalized,1),kappa=G.sub(o,G.step(normalized));
const kappaX=G.derivative(kappa,X);
const expectedKappaX=G.div(G.mul(q(-64),sigmaPrime),G.mul(X,t1));
const cutoffFor=(field)=>G.choose(X,r.Xkeep,r.Xcut,field,G.mul(kappa,field),z);
assert.equal(cutoffFor(raw.F),original.sourceRoots.localF);
assert.equal(cutoffFor(raw.U),original.sourceRoots.localU);
assert.equal(G.derivative(kappa,eta),z);
assert.deepEqual([r.Xminus,r.Xkeep,r.Xcut,inner.aSquared],[28814,28819,28823,24805]);
assert.equal(r.Xkeep,G.mul(Xa,G.exp(oneStep)));
assert.equal(r.Xcut,G.mul(Xa,G.exp(G.div(t1,q(32)))));
assert.equal(stress.axialSupported,117047);
assert.deepEqual(stress.totalResidualIntegrals,[117072,117075]);
const support=stress.supportOrder;
assert.ok(support.pass);
assert.ok(support.expressionChecks.allEndpointsIndependentOfEta);

const dX=id=>G.derivative(id,X),dEta=id=>G.derivative(id,eta);
const beta=G.add(G.neg(G.add(A,q(1,2))),inner.lambda1);
const gamma=G.add(G.neg(A),inner.lambda1);
const powers={X2:G.pow(X,2)};
const drift=G.add(G.inv(L),v0,G.neg(G.div(G.mul(q(2),eta,U0),L)));
const baseTerm=(w,a)=>G.div(G.add(G.neg(G.mul(a,w)),G.mul(D,eta,dEta(w))),L);
const advect=(w,a)=>G.div(G.add(G.mul(q(2),eta,a,w),G.mul(d,dEta(w))),L);
const angularRest=G.add(baseTerm(F1,beta),G.mul(v0,F1),G.mul(U0,advect(F1,beta)));
const axialRest=G.add(baseTerm(U1,gamma),G.mul(U0,advect(U1,gamma)));
const identities=[];
function check(name,actual,expected,atoms){
  const value=sourceGraphRationalIdentity(G,G.sub(actual,expected),{atomicNodes:atoms});
  assert.ok(value.pass,name);
  identities.push({name,actual,expected,numeratorMonomials:value.numeratorMonomials});
}
const atoms=[F1,U1,Pi1,F0,U0,v0,v1,dX(F1),dX(U1),dX(dX(F1)),dX(dX(U1)),
  dEta(F1),dEta(U1),dX(v0),dX(U0),sigmaPrime];
check('original-taper-derivative',kappaX,expectedKappaX,atoms);
check('axial-radial-drift',G.add(...axial.slice(0,3)),
  G.add(G.mul(X,drift,dX(U1)),axialRest),atoms);
check('angular-radial-drift',G.add(...theta.slice(0,3)),
  G.add(G.mul(X,drift,dX(F1)),angularRest),atoms);
check('axial-weighted-diffusion',axial[6],G.mul(q(-2),dX(G.mul(X,dX(U1)))),atoms);
check('angular-weighted-diffusion',G.mul(q(2),X,theta[5]),
  G.mul(q(-4),dX(G.mul(powers.X2,dX(F1)))),atoms);
const zWeight=G.mul(X,drift),thetaWeight=G.mul(q(2),powers.X2,drift);
check('axial-transport-boundary',G.mul(zWeight,dX(U1)),
  G.sub(dX(G.mul(zWeight,U1)),G.mul(dX(zWeight),U1)),atoms);
check('angular-transport-boundary',G.mul(thetaWeight,dX(F1)),
  G.sub(dX(G.mul(thetaWeight,F1)),G.mul(dX(thetaWeight),F1)),atoms);

const fError=G.fresh('C101_untapered_velocity_error_formal_xi');
const fX=G.fresh('C101_untapered_velocity_error_first_X_partial');
const tapedX=G.add(G.mul(kappa,fX),G.mul(kappaX,fError));
check('axial-boundary-taper-trace',G.mul(q(2),X,tapedX),
  G.add(G.mul(q(2),X,kappa,fX),G.div(G.mul(q(-128),sigmaPrime,fError),t1)),[...atoms,fError,fX]);
check('angular-boundary-taper-trace',G.mul(q(4),powers.X2,tapedX),
  G.add(G.mul(q(4),powers.X2,kappa,fX),G.div(G.mul(q(-256),X,sigmaPrime,fError),t1)),[...atoms,fError,fX]);
const data={schema:'MathScope.C101.OriginalN1TaperFluxOperands/1',
  prior:{C99Ops,C100,C100Ops},originalPrefixSHA256:original.originalPrefixSHA256,registrySHA:original.registrySHA,
  sourceRoots:{X,eta,Xminus:r.Xminus,Xkeep:r.Xkeep,Xcut:r.Xcut,commonEnd:inner.aSquared,
    originalAxialDensity:117047,actualAxialForward:stress.forward[1],actualAngularForward:stress.forward[0],
    originalTaperArg:normalized,originalSigmaPrime:sigmaPrime,originalKappa:kappa,originalKappaX:kappaX,
    F0,U0,v0,F1,U1,v1,Pi1,Ft:original.sourceRoots.localF,Ut:original.sourceRoots.localU},
  identities,originalTaperUsesFixedEta:true,originalStepSquaredExponents:true};
await writeFile(output,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({identities:identities.length,originalAxialDensity:117047,keep:r.Xkeep,cut:r.Xcut}));
