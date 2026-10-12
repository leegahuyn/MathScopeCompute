import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceAllOrderCutoffJets,sourceAllOrderNaturalJetBound,sourceNormalizedCutoffWeights,positiveOrderInductionRecipe} from '../actual-residual-order-induction-kernels.mjs';
import {prepareActualOrderInduction,assertActualOrderInduction,actualOrderInductionTail} from '../actual-residual-order-induction-source.mjs';
import {verifyActualInductionInnerEquations,verifyActualInductionMoments} from '../actual-residual-order-induction-proof.mjs';

let prepared;
const actual=()=>prepared??=prepareActualOrderInduction({order:4});
test('original square and linear seeds compute arbitrary finite jets beyond twelve',()=>{
  const r=sourceAllOrderCutoffJets({order:24});assert.equal(r.pass,true);assert.equal(r.activation.seedDerivatives.length,25);assert.equal(r.timeCutoff.eulerDerivativeBounds.length,26);
  assert.equal(r.activation.seedPower,2);assert.equal(r.timeStep.seedPower,1);assert.equal(r.scope.fixedTwelveJetExtrapolation,false);
  for(let m=1;m<=24;m++)assert(BigInt(r.activation.ordinaryDerivativeBounds[m])>0n);
});
test('source seed polynomial recurrence preserves every signed coefficient',()=>{
  const r=sourceAllOrderCutoffJets({order:18});
  for(const source of [r.activation,r.timeStep])for(let m=0;m<18;m++){
    const next=new Map(),put=(k,c)=>next.set(k,(next.get(k)??0n)+c);
    for(const term of source.seedDerivatives[m].polynomial){const k=term.power,c=BigInt(term.coefficient);put(k+source.seedPower+1,BigInt(source.seedPower)*c);put(k+1,-BigInt(k)*c);}
    for(const[k,c]of [...next])if(c===0n)next.delete(k);
    assert.deepEqual([...next].sort(([a],[b])=>a-b),source.seedDerivatives[m+1].polynomial.map(x=>[x.power,BigInt(x.coefficient)]));
  }
});
test('actual B_rho natural derivative bound retains source Q and positive rho',()=>{
  const r=sourceAllOrderNaturalJetBound({radialLogOrder:16,etaOrder:20});assert.equal(r.pass,true);assert.equal(r.scope.comparisonProfileSubstituted,false);
  assert.equal(r.domain.complexYAbsoluteUpper,'5');assert.equal(r.exactBound.product[1].sourceParameter,'Q');assert.equal(r.exactBound.product[2].integerPower[1],-20);
});
test('normalization has all h-polynomial Euler terms and the extra cutoff derivative',()=>{
  const r=sourceNormalizedCutoffWeights({order:17,derivativeOrder:15});assert.equal(r.weights.length,16);
  const p=sourceAllOrderCutoffJets({order:15});
  for(const row of r.weights){assert.equal(row.polynomialInSourceH.length,row.eulerOrder+1);assert.equal(row.polynomialInSourceH[0],p.timeCutoff.eulerDerivativeBounds[row.eulerOrder]);assert.equal(row.extraPotentialCutoffPolynomialInSourceH[0],p.timeCutoff.eulerDerivativeBounds[row.eulerOrder+1]);}
  assert.equal(r.scope.actualCoefficientNormMissing,true);
});
test('input substitution and resource exhaustion cannot become a source certificate',()=>{
  assert.throws(()=>sourceAllOrderCutoffJets({order:16,bound:1}),{code:'INVALID_INPUT'});
  assert.throws(()=>sourceAllOrderCutoffJets({order:1000000}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>prepareActualOrderInduction({order:3,sourceNorm:1}),{code:'INVALID_INPUT'});
});
test('actual four-order prefix generates a distinct auxiliary system at every order',()=>{
  const p=actual();assert.equal(p.order,4);assert.equal(p.program.sourceProvenance.sameN3Profile,true);
  for(const r of p.records.slice(1)){assert.notEqual(r.raw.system,r.auxiliary.system);assert.equal(r.global.completed,true);assert.equal(r.global.actualMomentChecks.length,5);assert(r.global.actualMomentChecks.every(c=>c.pass));
    const radius=p.G.fraction(r.norm.auxiliary.radius);assert(radius[0]>6n*radius[1]);assert(radius[0]<=8n*radius[1]);assert.equal(r.coreAgreement.auxiliaryReplacesActivationCollar,false);}
});
test('every actual and auxiliary generated matrix satisfies all six original equations',()=>{
  const p=actual();for(let order=1;order<=4;order++)for(const kind of ['actual','auxiliary']){
    const r=verifyActualInductionInnerEquations(p,{order,kind});assert.equal(r.pass,true);assert.equal(Object.keys(r.checks).length,6);assert.equal(r.negative.pass,false);
  }
});
test('actual five-moment bodies cancel before subsequent sources and omission is rejected',()=>{
  const p=actual();for(let order=2;order<=4;order++){
    const r=verifyActualInductionMoments(p,{order});assert.equal(r.pass,true);assert(r.checks.every(c=>c.pass));assert.equal(r.negative.pass,false);
    assert.equal(p.records[order].global.knownNonlinearMomentsRestrictedToCore,false);
  }
});
test('every nonlinear forcing pair is ordered and strictly lower; viscosity index shifts',()=>{
  const p=actual();for(let n=2;n<=4;n++){
    const recipe=positiveOrderInductionRecipe(n);assert.deepEqual(recipe.forcingPairs,Array.from({length:n-1},(_,i)=>[i+1,n-i-1]));
    assert.equal(recipe.omega.axialViscosityOrder,n-2);assert.equal(p.G.picardSystems[p.records[n].raw.system].lowerOrders.length,n);
    assert.equal(p.records[n].stress.lowerViscosityOrder,n-1);
  }
});
test('actual regular stream and pressure profiles use exact source fields and global reconstruction',()=>{
  const p=actual();for(const r of p.records.slice(2)){
    assert.equal(p.G.nodes[r.global.M].op,'actual_expression_partial');assert.equal(p.G.nodes[r.global.Pi].op,'actual_expression_partial');
    assert.equal(r.global.callerSuppliedDebt,false);assert.equal(r.global.continuousMatrixInverse,true);
    assert.equal(r.actual.cutoffPreserved,true);assert.equal(r.global.actualFullLowerSupportConsumed,true);
  }
});
test('source tail supports eta16 and retains its nonzero remainder and exact index',()=>{
  const p=actual(),r=actualOrderInductionTail(p,{order:4,etaOrder:16,bits:256});
  assert.equal(p.G.nodes[r.K].op,'maximum');assert.notEqual(r.tail,p.G.zero);assert.equal(r.positiveRemainderRetained,true);assert.equal(r.finiteDisplayedTermsCertified,false);
  assert.equal(p.G.nodes[p.G.picardEven(p.records[4].raw.system,0,p.bootstrap.constants.X,p.bootstrap.constants.eta,5,16)].op,'actual_background_even_profile');
});
test('copied or mutated actual coefficient graph does not pass the induction gate',()=>{
  const p=actual();assert.throws(()=>assertActualOrderInduction({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const old=p.records[3].global.completed;p.records[3].global.completed=false;assert.throws(()=>assertActualOrderInduction(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.records[3].global.completed=old;
  assert.equal(assertActualOrderInduction(p),true);
});
