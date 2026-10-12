import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {compileActualStressDirectionProgram} from '../actual-stress-direction-program.mjs';
import {ellOneSourceScalarIdentity} from '../actual-covariance-ell-one-obstruction.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {readRational} from '../actual-continuation-arithmetic.mjs';
import {outerFlatSquareRootJets,positiveCoefficientSquareRootJetBounds,outerCovarianceJetDegreeAudit,logarithmicPulseNormAudit,
  prepareActualOuterCovarianceFlatExtension,attachActualOuterCovarianceFlatExtension,assertActualOuterCovarianceFlatExtension,copyOuterFactorProgram} from '../actual-outer-covariance-flat-extension.mjs';

test('the exact flat derivative polynomials retain half powers and all first three derivatives',()=>{
  const p=outerFlatSquareRootJets({order:3,vanishingOrder:4});
  assert.deepEqual(p.rows.map(x=>x.polynomial),[['1'],['4','-3/2'],['16','-24','15/4'],['64','-216','147','-105/8']]);
  assert.deepEqual(p.rows.map(x=>x.singularPower),['3/2','9/2','15/2','21/2']);
  assert.deepEqual(p.rows.map(x=>x.coefficient),['6','525','64035/4','20545875/4']);
  assert.ok(p.rows.every(x=>x.exponentCheck));assert.equal(p.pass,true);assert.equal(p.actualSourceAuthenticated,false);
});

test('expanded ordinary derivatives agree with the scalar recurrence and reject a missing power term',()=>{
  const G=new ActualSourceExpressions(),d=G.fresh('delta'),q=(n,e=1)=>G.q(n,e),
    exponential=G.exp(G.neg(G.mul(q(2),G.pow(d,-2)))),half=G.exp(G.mul(q(-3,2),G.log(d))),f=G.mul(exponential,half),p=outerFlatSquareRootJets({order:5,vanishingOrder:1});
  let derivative=f;
  for(const row of p.rows){
    if(row.order)derivative=G.derivative(derivative,d);
    const poly=G.add(...row.polynomial.map((c,k)=>G.mul(G.q(...readRational(c)),G.pow(d,2*k)))),expected=G.mul(f,G.pow(d,-3*row.order),poly);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(derivative,expected),{atomicNodes:[exponential,half],maxTerms:100000}).pass,true);
    if(row.order===1){const wrong=G.mul(q(4),f,G.pow(d,-3));assert.equal(sourceGraphRationalIdentity(G,G.sub(derivative,wrong),{atomicNodes:[exponential,half]}).pass,false);}
  }
});

test('the recurrence generates new orders beyond twelve without turning omitted jets into zero',()=>{
  const p=outerFlatSquareRootJets({order:16,vanishingOrder:20});
  assert.equal(p.rows.length,17);assert.equal(p.rows[16].polynomial.length,17);assert.equal(p.rows[16].polynomial[0],String(4n**16n));
  assert.ok(p.rows.every(x=>x.exponentCheck));assert.equal(p.finiteOrderSamplesUsedAsAllOrderProof,false);
  assert.throws(()=>outerFlatSquareRootJets({order:129}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>outerFlatSquareRootJets({order:-1}),{code:'INVALID_INPUT'});
});

test('positive sqrt derivative bounds include cross terms of a nonconstant linear coefficient',()=>{
  // W=1+2x on [0,1] has sigma'(0)=1, sigma''(0)=-1,
  // sigma'''(0)=3. Dropping product terms would give zero at orders2,3.
  const p=positiveCoefficientSquareRootJetBounds({lower:'1',upper:'3',derivativeBounds:['3','2','0','0']});
  assert.deepEqual(p.ordinaryDerivativeBounds,['4','1','1','3']);
  assert.equal(p.conditionalNormPremises,true);assert.equal(p.actualSourceAuthenticated,false);
  assert.notEqual(p.ordinaryDerivativeBounds[2],'0');assert.notEqual(p.ordinaryDerivativeBounds[3],'0');
});

test('a zero or absent coefficient lower bound cannot certify a smooth positive sqrt coefficient',()=>{
  for(const input of [{lower:'0',upper:'1',derivativeBounds:['1']},{lower:'-1',upper:'1',derivativeBounds:['1']},
    {lower:'2',upper:'1',derivativeBounds:['1']},{lower:'1',upper:'2',derivativeBounds:['1']},{lower:'1',upper:'2',derivativeBounds:['2','-1']}])
    assert.throws(()=>positiveCoefficientSquareRootJetBounds(input),{code:'INVALID_INPUT'});
});

test('the pulse logarithmic norm preserves the negative reference eigenvalue and actual damping error',()=>{
  const p=logarithmicPulseNormAudit();assert.equal(p.pass,true);assert.equal(p.muInfinity,'3/2');assert.equal(p.upper,'3/2');
  const stable={operatorError:'0',dampingError:'0',lambda:'1',scale:'1',errorEntries:['0','0','0','0'],dampingDifference:'0'};
  assert.equal(logarithmicPulseNormAudit(stable).muInfinity,'0');
  const wrong=logarithmicPulseNormAudit({...stable,referenceSecondSign:1});assert.equal(wrong.muInfinity,'2');assert.equal(wrong.pass,false);
  assert.equal(logarithmicPulseNormAudit({...stable,dampingDifference:'-1/2'}).pass,false);
  assert.equal(p.absoluteMatrixNormSubstitutedForLogarithmicNorm,false);
});

test('every finite exponent induction retains the extra interval and inverse factors',()=>{
  const p=outerCovarianceJetDegreeAudit({order:32});assert.equal(p.pass,true);assert.equal(p.rows.length,33);
  assert.equal(p.rows[3].normalizedPulseJetExponent,6);assert.equal(p.rows[3].inverseCoefficientJetExponent,10);assert.equal(p.rows[3].squareRootCoefficientJetExponent,12);
  assert.ok(p.rows.every(r=>r.forcing.every(x=>x.wExponent<=x.wUpper&&x.coefficientExponent<=x.coefficientUpper)));
  assert.equal(p.normConstantsComputedHere,false);assert.equal(p.actualSourceAuthenticated,false);
});

test('generic algebra receipts and serialized positivity flags cannot authenticate an actual outer source',()=>{
  assert.throws(()=>attachActualOuterCovarianceFlatExtension({pass:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualOuterCovarianceFlatExtension({decision:{actualSquareRootZeroExtensionAtOuterEdge:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const request of [{ell:'100'},{WLower:1},{sourceNorm:1},{field:1},{qbig:'1e-100'},{wholeGPOSComplete:true},[]])
    assert.throws(()=>prepareActualOuterCovarianceFlatExtension(request),{code:'INVALID_INPUT'});
});

test('the small original outer scalar fixture keeps endpoint and height under bound-integral renaming',()=>{
  const G=new ActualConvergentExpressions(),program=compileActualStressDirectionProgram({derivativeOrder:0}),delta=G.fresh('fixture_delta'),eta=G.fresh('fixture_eta'),
    imported=copyOuterFactorProgram(G,program,delta,eta),last=G.outer.stages.at(-1),Xb=G.mul(G.parameter('XR'),G.exp(last.end)),height=G.mul(G.parameter('Pstar'),G.exp(last.logAEnd));
  assert.notEqual(imported.roots.Xb,Xb);assert.equal(ellOneSourceScalarIdentity(G,imported.roots.Xb,Xb).pass,true);
  assert.equal(ellOneSourceScalarIdentity(G,imported.roots.EpowB,height).pass,true);
  assert.equal(ellOneSourceScalarIdentity(G,imported.roots.Xb,G.mul(G.q(2),Xb)).pass,false);
  const x=G.fresh('fixture_integral_x'),y=G.fresh('fixture_integral_y'),left=G.integral(G.exp(x),x,G.zero,G.one),right=G.integral(G.exp(y),y,G.zero,G.one);
  assert.equal(ellOneSourceScalarIdentity(G,left,right).pass,true);
  assert.equal(ellOneSourceScalarIdentity(G,left,G.integral(G.exp(y),y,G.zero,G.q(2))).pass,false);
  assert.equal(ellOneSourceScalarIdentity(G,left,G.neg(right)).pass,false);
});
