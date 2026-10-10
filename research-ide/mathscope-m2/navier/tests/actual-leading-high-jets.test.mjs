import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {actualLeadingHighJetBounds,ACTUAL_LEADING_HIGH_JET_BINDINGS} from '../actual-leading-high-jets.mjs';
import {implicitTotalJetMajorant,fixedQuadraticJetMajorant,variableQuadraticJetMajorant,actualStepHighDerivativeAudit,actualNaturalMixedCoefficientAudit,polynomialAbsorption,finitePowerBelowInputExponential,exponentialJetAbsorption,finiteLoopJetStageAudit,evaluatePositiveJetPolynomial} from '../actual-leading-high-jets-arithmetic.mjs';

const receipt=actualLeadingHighJetBounds(),fact=n=>{let s=1n;for(let k=2;k<=n;k++)s*=BigInt(k);return s;},choose=(n,k)=>fact(n)/(fact(k)*fact(n-k)),catalan=n=>choose(2*n,n)/BigInt(n+1);

test('all fixed source bytes and selected parameter identity are retained',()=>{
  for(const b of ACTUAL_LEADING_HIGH_JET_BINDINGS){const bytes=readFileSync(fileURLToPath(new URL('../../../'+b.path,import.meta.url)));assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
  assert.equal(receipt.pass,true);assert.ok(receipt.hierarchy.checks.every(x=>x.pass));assert.equal(receipt.hierarchy.oldHigherJetAssumptionUsed,false);
});

test('source constant and function overrides are rejected',()=>{
  for(const input of [null,[],{R:8192},{N:1},{sourceProfile:'other'},{etaOrder:7},{U0:'4eta'},{norm:1},{sourceBounds:true},{sourceProfile:receipt.profileId,lambda:0}])assert.throws(()=>actualLeadingHighJetBounds(input));
  assert.throws(()=>actualLeadingHighJetBounds({}, {checkCancelled(){throw Error('cancelled-high-jets');}}),/cancelled-high-jets/);
});

test('the actual smooth step is differentiated beyond the ninth derivative needed by B8',()=>{
  const s=actualStepHighDerivativeAudit(12);assert.equal(s.pass,true);
  assert.deepEqual(s.polynomials[2].terms,[{power:4,coefficient:'-6'},{power:6,coefficient:'4'}]);
  assert.equal(s.polynomials[12].degree,36);assert.equal(s.sigma.length,13);assert.ok(s.sigma.every(r=>r.upperBits<4096));
  assert.throws(()=>actualStepHighDerivativeAudit(13));
});

test('the natural mixed derivative table contains eta12 and radial12 and uses the real whole interval',()=>{
  const a=actualNaturalMixedCoefficientAudit(12);assert.equal(a.rows.length,91);assert.equal(a.pass,true);
  assert.equal(a.rows.find(r=>r.radialLogOrder===1&&r.etaOrder===0).coefficient,'8200/25281');
  assert.ok(a.rows.some(r=>r.radialLogOrder===0&&r.etaOrder===12));assert.ok(a.rows.some(r=>r.radialLogOrder===12&&r.etaOrder===0));
  assert.equal(a.realDomain,'0<=Y<=41/10, eta in [-1,1]');
});

test('implicit six-jet extraction agrees with an independent Catalan generating function',()=>{
  const a=implicitTotalJetMajorant(6);
  // Multiplying its infinite majorant equation gives
  // w-(1+H^2)w^2=H^2*t/(1-t). Lagrange/Catalan coefficients are independent
  // of the implementation's two-variable monomial extraction.
  for(const H of [1n,2n,5n,17n])for(let n=1;n<=6;n++){
    let expected=0n;for(let k=1;k<=n;k++)expected+=catalan(k-1)*choose(n-1,k-1)*(1n+H*H)**BigInt(k-1)*H**BigInt(2*k);
    assert.equal(evaluatePositiveJetPolynomial(a.rows[n-1],H),expected);
  }
  assert.equal(a.rows[5].degree,22);assert.notEqual(evaluatePositiveJetPolynomial(a.rows[1],2n),4n+16n,'omitting the nonlinear root term must not pass');
});

test('fixed quadratic ordinary derivatives include all binomial terms',()=>{
  const a=fixedQuadraticJetMajorant({order:8,rhsPower:3});
  assert.equal(evaluatePositiveJetPolynomial(a.rows[1],2n),2n*8n+16n*64n);
  assert.notEqual(evaluatePositiveJetPolynomial(a.rows[1],2n),2n*8n+8n*64n);
  assert.equal(a.rows[7].degree,24);assert.equal(receipt.premodulation.B8.rootAbsorptions[7].strictPower,33049);
});

test('varying outer quadratic retains coefficient derivatives rather than a constant Amp',()=>{
  const a=variableQuadraticJetMajorant({order:8,coefficientPower:1});
  // Independent generating equation:
  // w = sum Catalan(k-1)*(3A)^(k-1)*(21A)^k*t^k /
  //                 (1-(1+15A)t)^(2k-1).
  for(const A of [1n,2n,7n])for(let n=1;n<=8;n++){
    let expected=0n;for(let k=1;k<=n;k++)expected+=catalan(k-1)*(3n*A)**BigInt(k-1)*(21n*A)**BigInt(k)*choose(n+k-2,n-k)*(1n+15n*A)**BigInt(n-k);
    assert.equal(evaluatePositiveJetPolynomial(a.rows[n-1],A),expected);
  }
  assert.equal(receipt.outer.absorptions[7].strictPower,751);assert.equal(receipt.outer.amplitudeIsOnlyRealRootOnOriginalBracket,true);
});

test('ordinary factorial restoration changes the enclosing power when needed',()=>{
  const row={degree:2,coefficientSum:String((1n<<260n)-1n)};
  assert.equal(polynomialAbsorption(row).strictPower,3);
  assert.equal(polynomialAbsorption(row,{ordinaryOrder:2}).strictPower,4);
});

test('all finite high-jet powers fit the original input exponential and selected R',()=>{
  const a=finitePowerBelowInputExponential(receipt.premodulation.inputAbsorption.power);assert.equal(a.pass,true);assert.equal(a.expSeriesTerm,21);
  const stage=finiteLoopJetStageAudit();assert.equal(stage.degree,17576);assert.equal(stage.coefficientBits,14793);assert.equal(stage.logMultiplier,32370);assert.equal(stage.pass,true);
  assert.ok(receipt.loop.muAbsorption.every(a=>a.pass));assert.ok(receipt.loop.circleAbsorption.every(a=>a.pass));assert.equal(receipt.loop.oldThreeJetBoundRelabelled,false);
  const negative=exponentialJetAbsorption({degree:100,coefficientBits:100},{from:22,to:23,Smin:2n});assert.equal(negative.pass,false);
});

test('fast radial phase and the entire eta-dependent M restoration are retained',()=>{
  assert.equal(receipt.restoration.fastRadialDerivative,'B_y/N+B_phase');assert.equal(receipt.restoration.parameterOrder,6);assert.equal(receipt.restoration.rawSixthDerivativeFactorial,720);
  assert.ok(receipt.premodulation.inputPowerLedger.some(x=>x.id==='XWU'));
  assert.equal(receipt.bounds.M0.upper,'R^3');assert.equal(receipt.bounds.physicalXDerivative.V0OverX.etaOrder,5);
});

test('the six regular integrands give continuous quadrature bounds with the actual axis term',()=>{
  assert.deepEqual(receipt.regularIntegrands.map(r=>r.name),['Jm','J0','Hm','H0','Km2','Km1']);
  assert.ok(receipt.regularIntegrands.every(r=>r.etaNormPower<12&&r.xDerivativePower<12));
  assert.equal(receipt.weightedOmega.axisBoundaryDropped,false);assert.equal(receipt.weightedOmega.etaOrder,4);assert.equal(receipt.weightedOmega.quadrature.factorialEtaErrorUpper,'R^14/(2n)');
  assert.equal(receipt.scope.signedMomentValuesNumericallyEnclosed,false);
});

test('a leading high-jet receipt cannot claim the completed N5-06 gate',()=>{
  for(const k of ['n1CompletedCoefficientNormDerived','allPositiveOrdersCompleted','stressFlatEdgeDirectionModulusDerived','actualUniformHColumnsCertified','sourceUniformQStarCertified','originalN506Complete','formalKernelProof'])assert.equal(receipt.scope[k],false,k);
  assert.deepEqual(receipt.bounds.domain.eta,[-1,1]);assert.equal(receipt.scope.oldC2ContractPromotedWithoutNewProof,false);
});
