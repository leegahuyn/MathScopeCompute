import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {terminalGaussianPrimitiveRules,terminalResidualFactorization,assertActualOrderOneWeightedStress} from '../actual-order-one-weighted-stress.mjs';

const polynomial=(G,rows,x)=>G.add(...rows.map(([p,c])=>G.mul(G.q(BigInt(c)),G.pow(x,p))));

test('every terminal Laurent row is independently the derivative of the Gaussian integrand',()=>{
  const G=new ActualConvergentExpressions(),delta=G.fresh('generic_terminal_delta'),E=G.exp(G.mul(G.q(-4),G.pow(delta,-2))),rules=terminalGaussianPrimitiveRules({derivativeOrder:7});
  assert.equal(rules.pass,true);assert.equal(rules.sourceAuthenticated,false);
  for(let j=0;j<7;j++){
    const old=polynomial(G,rules.laurent[j].coefficients,delta),next=polynomial(G,rules.laurent[j+1].coefficients,delta);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(G.derivative(G.mul(E,old),delta),G.mul(E,next)),{atomicNodes:[E]}).pass,true);
    const omittedGaussianDerivative=G.mul(E,G.derivative(old,delta));
    assert.equal(sourceGraphRationalIdentity(G,G.sub(omittedGaussianDerivative,G.mul(E,next)),{atomicNodes:[E]}).pass,false);
  }
});

test('the exact integrating factor gives the 16/125 bound and a three-power gain',()=>{
  const G=new ActualConvergentExpressions(),delta=G.fresh('generic_gain_delta'),E=G.exp(G.mul(G.q(-4),G.pow(delta,-2))),
    direct=G.derivative(G.mul(E,G.pow(delta,-3)),delta),factored=G.mul(E,G.pow(delta,-6),G.sub(G.q(8),G.mul(G.q(3),G.pow(delta,2))));
  assert.equal(sourceGraphRationalIdentity(G,G.sub(direct,factored),{atomicNodes:[E]}).pass,true);
  assert.equal(8n*16n-3n,125n);
  const rules=terminalGaussianPrimitiveRules();
  assert.equal(rules.integration.integralUpperFactor,'16/125');
  assert.equal(rules.integration.positiveFactorLower,'125/16');
  assert.match(rules.integration.inequality,/delta\^-3/);
});

test('nonconstant smooth terminal factors retain both fo derivatives and the full bz term',()=>{
  const G=new ActualConvergentExpressions(),delta=G.fresh('generic_factor_delta'),eta=G.fresh('generic_factor_eta');
  const factorBody=G.add(G.q(2),G.mul(G.q(3),delta),G.pow(delta,3)),
    factorSystem=G.defineExpressionFunction({name:'generic_nonconstant_factor',parameters:[delta],body:factorBody,derivativeLimits:[8]}),
    factor=G.expressionValue(factorSystem,[delta]),
    heat=G.add(G.one,G.pow(eta,2)),az=G.add(G.q(2),eta),bz=G.sub(G.q(3),eta),r=terminalResidualFactorization(G,{delta,factor,heat,az,bz});
  assert.equal(r.pass,true);assert.equal(r.check.pass,true);assert.equal(r.negativeControl.check.pass,false);
  assert.notEqual(r.factorFirst,G.zero);assert.notEqual(r.factorSecond,G.zero);
  const noFactorJets=G.mul(heat,G.sub(G.mul(G.pow(az,2),G.sub(G.q(64),G.mul(G.q(24),G.pow(delta,2))),factor),G.mul(bz,G.q(8),G.pow(delta,3),factor)));
  assert.equal(sourceGraphRationalIdentity(G,G.sub(r.coefficient,noFactorJets),{atomicNodes:[factor,r.factorFirst,r.factorSecond,heat,az,bz]}).pass,false);
});

test('the physical z-product coefficient follows from the source Z operator, with no constant-L approximation',()=>{
  const G=new ActualConvergentExpressions(),{eta,L,d,D}=G.core,X=G.fresh('generic_z_X'),delta=G.fresh('generic_z_delta'),
    b=G.neg(G.add(G.core.A,G.q(1,2))),az=G.div(G.mul(G.q(-2),eta),L),bz=G.div(G.add(G.mul(G.q(-2),D,eta,az),G.mul(d,G.derivative(az,eta))),L),
    H=G.fresh('generic_heat_value'),Hy=G.fresh('generic_fo_y'),Hyy=G.fresh('generic_fo_yy');
  // Z_(b-D)(Fheat*az*fo_y), after the proved Z_b(Fheat)=0:
  const product=G.div(G.add(G.mul(G.q(-2),D,eta,H,az,Hy),G.mul(G.q(-2),eta,H,az,Hyy),G.mul(d,H,G.derivative(az,eta),Hy)),L),
    claimed=G.mul(H,G.add(G.mul(G.pow(az,2),Hyy),G.mul(bz,Hy)));
  assert.equal(sourceGraphRationalIdentity(G,G.sub(product,claimed),{atomicNodes:[H,Hy,Hyy]}).pass,true);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(claimed,G.mul(H,G.pow(az,2),Hyy)),{atomicNodes:[H,Hy,Hyy]}).pass,false);
  assert(G.nodes[X]&&G.nodes[delta]&&G.nodes[b]);
});

test('all ordinary radial derivatives include the lower log-derivative terms',()=>{
  const G=new ActualConvergentExpressions(),X=G.fresh('generic_radial_X'),delta=G.neg(G.log(X)),body=G.add(G.pow(delta,5),G.mul(G.q(7),G.pow(delta,2)),G.q(11)),rules=terminalGaussianPrimitiveRules({derivativeOrder:5});
  let direct=body;
  for(let r=0;r<=5;r++){
    if(r)direct=G.derivative(direct,X);
    const d=G.fresh('generic_radial_independent_'+r),f=G.add(G.pow(d,5),G.mul(G.q(7),G.pow(d,2)),G.q(11)),jets=[f];
    for(let j=1;j<=r;j++)jets.push(G.derivative(jets[j-1],d));
    const sum=G.add(...rules.ordinaryXConversion.unsignedStirlingFirst[r].map((c,j)=>G.mul(G.q(BigInt(c)),G.substitute(jets[j],d,delta)))),converted=G.mul(G.q(r%2?-1:1),G.pow(X,-r),sum);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(direct,converted)).pass,true);
    if(r===2)assert.equal(sourceGraphRationalIdentity(G,G.sub(direct,G.mul(G.pow(X,-2),G.substitute(jets[2],d,delta)))).pass,false);
  }
});

test('literal terminal step reflection and smooth-factor decomposition agree with independent scalar evaluation',()=>{
  const step=x=>x<=0?0:x>=1?1:Math.exp(-1/x**2)/(Math.exp(-1/x**2)+Math.exp(-1/(1-x)**2));
  const rho=1/512;
  for(const delta of [1/4,1/5,1/8]){
    const E=Math.exp(-4/delta**2),factor=rho/(E+Math.exp(-4/(2-delta)**2)),deficit=rho*step(delta/2);
    assert(Math.abs(E*factor/deficit-1)<3e-14);
    assert(factor>0&&factor<=rho*Math.exp(64/49));
  }
});

test('the flat endpoint guard gives the exact terminal Taylor coefficients without dividing by zero',()=>{
  const G=new ActualConvergentExpressions(),delta=G.fresh('generic_endpoint_delta'),rho=G.q(1,512),
    Eraw=G.exp(G.mul(G.q(-4),G.pow(delta,-2))),Eflat=G.choose(delta,G.zero,G.zero,G.zero,Eraw,Eraw),
    otherSeed=G.exp(G.mul(G.q(-4),G.pow(G.sub(G.q(2),delta),-2))),factor=G.div(rho,G.add(Eflat,otherSeed)),
    endpoint=G.div(rho,G.exp(G.q(-1))),jets=[factor];
  for(let j=1;j<=2;j++)jets.push(G.derivative(jets[j-1],delta));
  const expected=[endpoint,endpoint,G.mul(G.q(5,2),endpoint)];
  for(let j=0;j<=2;j++)assert.equal(sourceGraphRationalIdentity(G,G.sub(G.substitute(jets[j],delta,G.zero),expected[j])).pass,true);
  assert.equal(G.substitute(Eflat,delta,G.zero),G.zero);
  assert.throws(()=>G.substitute(Eraw,delta,G.zero));
});

test('generic factorization and supplied derivative shortcuts cannot authorize a source weighted theorem',()=>{
  const G=new ActualConvergentExpressions(),delta=G.fresh('generic_guard_delta'),input={delta,factor:G.one,heat:G.one,az:G.one,bz:G.one};
  assert.throws(()=>terminalResidualFactorization(G,{...input,factorFirst:G.zero}),{code:'INVALID_INPUT'});
  assert.throws(()=>terminalResidualFactorization(G,{...input,delta:G.one}),{code:'INVALID_INPUT'});
  assert.throws(()=>terminalGaussianPrimitiveRules({derivativeOrder:17}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>assertActualOrderOneWeightedStress({...terminalResidualFactorization(G,input),G,scope:{wholeGN4Complete:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
