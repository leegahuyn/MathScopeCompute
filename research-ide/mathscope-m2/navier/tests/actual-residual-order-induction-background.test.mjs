import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';
import {prepareActualOrderInduction} from '../actual-residual-order-induction-source.mjs';
import {attachActualCanonicalCutoffs,assertActualNormalizedCutoffs,actualNormalizedFiniteBlock} from '../actual-residual-order-induction-cutoffs.mjs';
import {prepareActualCompletedBackgroundC2,assertActualCompletedBackgroundC2,actualBackgroundFiniteQuery,actualBackgroundSymbolicPrefix,actualBackgroundDyadicPrefix} from '../actual-residual-order-induction-background.mjs';

let value;
const actual=()=>value??=prepareActualCompletedBackgroundC2({order:4});

// Canonical expression fingerprints remove incidental graph node IDs. The
// Source constants retain their actual integral bodies (for example the
// terminal wait defining Xb). Commutative operands are canonicalized too.
function expressionFingerprint(G,root){
  const memo=new Map();function hash(id){if(memo.has(id))return memo.get(id);const {op,args}=G.nodes[id];let a;
    if(op==='rational'||op==='source_parameter'||op==='coordinate')a=args;
    else if(op==='add'||op==='multiply'||op==='maximum'||op==='minimum')a=args.map(hash).sort();
    else if(op==='integer_power')a=[hash(args[0]),args[1]];
    else if(op==='definite_integral'||op==='smooth_piecewise')a=args.map(hash);
    else if(op==='source_step_derivative')a=[hash(args[0]),args[1]];
    else if(['inverse','sqrt_positive','exp','log_positive','ceiling'].includes(op))a=[hash(args[0])];
    else throw Error('Unexpected non-elementary cutoff norm '+op);
    const v=createHash('sha256').update(JSON.stringify([op,a])).digest('hex');memo.set(id,v);return v;
  }return hash(root);
}

test('actual universal order kernel and every finite witness retain their source identities',()=>{
  const r=actual();assert(r.pass);assert(r.parametricPDE.pass);assert(r.parametricPDE.producerUsesThisKernel);
  assert.equal(r.parametricPDE.finiteOrderSamplesUsedForUniversalIdentity,false);assert.equal(r.parametricPDE.negative.pass,false);
  assert.equal(r.systems.length,8);assert(r.systems.every(s=>Object.values(s.checks).every(c=>c.numeratorMonomials===0)));
  assert(r.moments.every(m=>m.pass));assert.equal(r.induction.normStep.callerBound,false);
});

test('canonical cutoff prefix does not change when a later actual order is requested',()=>{
  const a=actual(),p2=prepareActualOrderInduction({order:2}),b=attachActualCanonicalCutoffs(p2);
  for(let n=0;n<2;n++){
    assert.deepEqual(a.cutoffs.rows[n].canonicalNormRequest,{throughOrder:n+1,derivativeOrder:n+1});
    assert.equal(expressionFingerprint(a.G,a.cutoffs.rows[n].logScale),expressionFingerprint(b.G,b.rows[n].logScale));
    assert.equal(expressionFingerprint(a.G,a.cutoffs.rows[n].coefficientBounds.at(-1).bound),expressionFingerprint(b.G,b.rows[n].coefficientBounds.at(-1).bound));
  }
});

test('source norm recurrences include actual radial derivatives and all m=2 finite initial terms',()=>{
  const r=actual(),b=actualNormalizedFiniteBlock(r.cutoffs,{derivativeOrder:2});assert.deepEqual(b.finite.map(r=>r.order),[1,2]);assert.equal(b.tailStarts,3);
  assert(r.cutoffs.norms.radialAudit.length>0);assert(r.cutoffs.norms.radialAudit.every(r=>r.collarAnalyticityAssumed===false));
  assert(r.cutoffs.norms.leading.scope.arbitraryFiniteRecurrence);assert.equal(r.cutoffs.norms.leading.scope.fixedSixOrTwelveJetExtrapolation,false);
  assert.equal(r.chart.bounds.FGDifference.power,'epsilon^2');assert.equal(r.chart.bounds.radialDifference.power,'epsilon^3');
});

test('slow chart keeps every Jacobian coefficient derivative and distinguishes raw F0 from slow F0',()=>{
  const r=actual();assert.equal(r.chart.operatorRows.length,3);for(const row of r.chart.operatorRows)assert.equal(row.firstDerivatives.length,3);
  assert.notEqual(r.chart.operatorB,r.G.zero);assert.notEqual(r.chart.operatorC2,r.chart.operatorA);
  assert.equal(r.chart.chart.coordinateFrame,'BAND_CHART_Q_FIXED');
  const f=r.chart.bounds.leadingFOnPositiveOrderSupport;assert.notEqual(f.rawProfileJetConstant,f.slowChartC2Constant);assert(f.rawProfileConvention.includes('physical X/eta'));assert(f.slowChartConvention.includes('R,Z,T'));
  assert.equal(r.chart.bounds.leadingFOnEnlargedAnnulusSupplied,true);
  const full=r.chart.bounds.leadingFOnEnlargedAnnulus;assert.deepEqual(full.sourceDomain.X,['Xa/2','2*Xb']);assert.equal(full.regions.length,3);
  assert.notEqual(full.rawProfileJetConstant,full.slowChartC2Constant);assert.equal(full.slowChartC2Constant,r.roots.FLeadingConstant);
  assert.equal(r.program.scope.fullLeadingFAbsoluteBoundPending,false);
});

test('actual coefficient supports and original extra potential derivative are proved, not sampled',()=>{
  const r=actual();assert(r.support.rows.every(r=>Object.values(r.fields).every(Boolean)));assert.equal(r.support.bareLocalizedIntegralProvedZero,false);
  assert(r.potential.rows.every(r=>r.check.pass&&r.missingExtraCutoffRejected));
  assert.equal(r.potential.actualCoefficientSlotsConnected,true);assert.equal(r.program.scope.actualPotentialCurlAndExtraTerm,true);
});

test('canonical fixed-q query includes the actual transition term and proves every omitted term off',()=>{
  const r=actual(),v=actualBackgroundFiniteQuery(r,{anchorOrder:1});assert.equal(v.rows.length,2);assert.equal(v.rows[0].chi,r.G.one);assert.equal(v.rows[0].extraCutoff,r.G.zero);
  assert.equal(r.G.nodes[v.rows[1].chi].op,'actual_expression_partial');assert.notEqual(v.rows[1].extraCutoff,r.G.zero);
  assert.equal(v.allLaterInactiveFrom,3);assert.equal(v.completeActiveFamily,true);assert.equal(v.numericalValuesEnclosed,false);assert.equal(v.sourceUnderflowReplacedByZero,false);
});

test('positive rational q guard cannot hide missing active source orders',()=>{
  const r=actual(),v=actualBackgroundFiniteQuery(r,{qExact:'1/8'});assert.equal(v.potentiallyActiveLastOrder,2);assert.equal(v.allLaterInactiveFrom,3);
  assert.throws(()=>actualBackgroundFiniteQuery(r,{qExact:'1/1024'}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>actualBackgroundFiniteQuery(r,{qExact:'0'}),{code:'INVALID_INPUT'});
  assert.throws(()=>actualBackgroundFiniteQuery(r,{qExact:'-1/8'}),{code:'INVALID_INPUT'});
  assert.throws(()=>actualBackgroundFiniteQuery(r,{qExact:'1/8',anchorOrder:1}),{code:'INVALID_INPUT'});
});

test('symbolic compact band retains actual q derivatives, rather than freezing q before differentiation',()=>{
  const r=actual(),b=actualBackgroundSymbolicPrefix(r,{anchorOrder:1,derivativeOrder:2});assert.equal(b.rows.length,3);assert.equal(b.exactInactiveTail.from,4);assert.equal(b.exactPlateau.through,1);
  assert.equal(b.qDerivativePreserved,true);assert.equal(b.thisFiniteBandEqualsAllBands,false);assert.equal(b.completeBackgroundOnDeclaredBand,true);
  for(const [field,jets]of Object.entries(b.jets)){assert.equal(jets.length,10);assert(jets.some(j=>j.eulerOrder===1&&j.radialOrder===0&&j.etaOrder===0&&j.value!==r.G.zero),field);}
  assert.throws(()=>actualBackgroundSymbolicPrefix(r,{anchorOrder:3}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>actualBackgroundSymbolicPrefix(r,{anchorOrder:1,qNode:r.G.one}),{code:'INVALID_INPUT'});
});

test('the original dyadic band keeps the extra possible source order and its exact positive scale',()=>{
  const r=actual(),b=actualBackgroundSymbolicPrefix(r,{anchorOrder:1,dyadicBand:true});
  assert.equal(b.bandSelection.kind,'ORIGINAL_DYADIC_BAND');assert.equal(b.rows.length,4);assert.equal(b.exactInactiveTail.from,5);assert.equal(b.exactPlateau.through,1);
  assert.equal(r.G.nodes[b.ell].op,'ceiling');assert.equal(r.G.nodes[b.Q].op,'exp');assert.equal(b.bandSelection.ellPositiveInteger,true);
  assert.equal(b.qDerivativePreserved,true);assert.equal(b.thisFiniteBandEqualsAllBands,false);
  assert(b.rows.slice(1).every(row=>r.G.nodes[row.chi].op==='actual_expression_partial'&&row.extraCutoff!==r.G.zero));
  assert.throws(()=>actualBackgroundSymbolicPrefix(r,{anchorOrder:2,dyadicBand:true}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>actualBackgroundSymbolicPrefix(r,{dyadicBand:'true'}),{code:'INVALID_INPUT'});
});

test('the actual time cutoff materializes its flat endpoint jets without evaluating inactive singular branches',()=>{
  const r=actual(),b=actualBackgroundSymbolicPrefix(r,{anchorOrder:1,derivativeOrder:0}),G=r.G;
  for(const [n,d]of [[0,1],[1,2],[1,1],[3,2]])for(let k=0;k<=8;k++){
    const v=G.materializeExpressionFunction(b.cutoffSystem,[G.q(n,d)],[k]);
    assert.equal(v,k===0&&2*n<=d?G.one:G.zero,JSON.stringify({n,d,k}));
  }
});

test('every exact integer ell has the same constructive dyadic definition and honest prefix exhaustion',()=>{
  const r=actual(),b=actualBackgroundDyadicPrefix(r,{ellExact:'4',derivativeOrder:2});assert.equal(b.rows.length,4);assert.equal(b.exactInactiveTail.from,'5');
  assert.equal(b.ellExact,'4');assert.equal(b.algorithmDefinedForEveryFiniteIntegerEll,true);assert.equal(b.sameCanonicalSequenceAsAnchorFamily,true);
  assert.equal(b.qDerivativePreserved,true);assert(b.rows.every(row=>r.G.nodes[row.chi].op==='actual_expression_partial'));
  assert.throws(()=>actualBackgroundDyadicPrefix(r,{ellExact:'100000000000000000000000000000000000000000000000000'}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>actualBackgroundDyadicPrefix(r,{ellExact:0}),{code:'INVALID_INPUT'});
  assert.throws(()=>actualBackgroundDyadicPrefix(r,{ellExact:'3.5'}),{code:'INVALID_INPUT'});
  assert.throws(()=>actualBackgroundDyadicPrefix(r,{ellExact:4,Q:1}),{code:'INVALID_INPUT'});
});

test('caller flags, copied receipts and replaced canonical data do not authorize a background',()=>{
  const r=actual();assert.throws(()=>prepareActualCompletedBackgroundC2({order:3,bound:1}),{code:'INVALID_INPUT'});
  assert.throws(()=>assertActualCompletedBackgroundC2({...r}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const old=r.cutoffs;r.cutoffs={...old};assert.throws(()=>assertActualCompletedBackgroundC2(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.cutoffs=old;
  const norms=old.norms;old.norms={...norms};assert.throws(()=>assertActualNormalizedCutoffs(old),{code:'INVALID_SOURCE_CONSTRUCTION'});old.norms=norms;
  assert.equal(assertActualCompletedBackgroundC2(r),true);
});

test('normalized C2 proof does not claim the unproved residual/stress or whole covariance package',()=>{
  const r=actual();assert.equal(r.program.scope.actualSlowC2FGProximity,true);assert.equal(r.program.scope.weightedStressSelectorComputed,false);
  assert.equal(r.program.scope.physicalResidualSelectorComputed,false);assert.equal(r.program.scope.fullOriginalProposition55Certified,false);
  assert.equal(r.program.scope.sourceUniformQStarCertified,false);assert.equal(r.program.scope.originalN506Complete,false);assert.equal(r.program.scope.newLeanKernelProof,false);
});

test('the complete replayable program is valid canonical JSON without hidden undefined metadata',()=>{
  const r=actual(),encoded=canonicalStringify(r.program);assert(encoded.length>0);assert.equal(JSON.parse(encoded).parameterExpressionSHA256,r.program.parameterExpressionSHA256);
});
