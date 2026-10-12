import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualGlobalPositivePrimitives,assertActualGlobalPositivePrimitives,actualGlobalPositivePrimitivesCertificateFromProgram} from '../actual-global-positive-primitives.mjs';

let prepared,failure,constructions=0;
const progress=e=>console.log('# SOURCE_PROGRESS '+JSON.stringify({...e,at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
const source=()=>{
  if(failure)throw failure;if(prepared)return prepared;constructions++;
  try{progress({phase:'original-constructor-start'});return prepared=prepareActualGlobalPositivePrimitives({order:2,maxNodes:2000000},{onProgress:progress});}
  catch(e){failure=e;throw e;}
};

test('original completed M1/M2 each bind their literal core, cutoff, two bump primitives and actual zero moment',()=>{
  const r=source();assert.equal(constructions,1);assert.equal(r.rows.length,2);
  for(const row of r.rows){assert.equal(row.mass.pass,true);assert.equal(row.mass.massBodyCheck.pass,true);
    assert.equal(row.mass.localMassFTC.check.pass,true);assert.equal(row.mass.massJoin.pass,true);
    assert.equal(row.mass.bumpMassRows.length,2);assert.ok(row.mass.bumpMassRows.every(b=>b.jacobian.pass));
    assert.equal(row.coreUCheck.pass,true);assert.equal(row.coreFCheck.pass,true);}
  assert.equal(r.rows[0].mass.coreMass.kind,'literal-average-change-of-variable');
  assert.equal(r.rows[1].mass.coreMass.kind,'original-Picard-U-K-row');
});

test('original n2 pressure binds every lower-support primitive and all three real-exponent radial bump derivatives',()=>{
  const p=source().rows[1].pressure;assert.equal(p.pass,true);assert.equal(p.bodyCheck.pass,true);
  assert.equal(p.localFTC.check.pass,true);assert.equal(p.lowerFTC.check.pass,true);assert.equal(p.bumpRows.length,3);
  assert.ok(p.bumpRows.every(b=>b.jacobian.pass&&b.positivePowerIdentity.finiteExponentSubstitution===false));
  assert.equal(p.coreLowerCheck.pass,true);assert.equal(p.incomingCheck.pass,true);assert.equal(p.joinCheck.pass,true);
  assert.equal(p.derivativeCheck.pass,true);assert.equal(p.fullGlobalRadialEquationIdentified,false);
});

test('full radial pressure differences remain explicit; n1 Omega binding is not inferred from n2',()=>{
  const r=source(),G=r.G;
  assert.equal(r.rows[0].pressure.pass,false);assert.equal(r.rows[0].pressure.status,'ACTUAL_LEADING_OMEGA_PRIMITIVE_BINDING_REQUIRED');
  for(const row of r.rows){assert.equal(row.fullPressureComparison.pairs.length,row.order+1);
    assert.equal(row.fullPressureComparison.identified,false);assert.equal(row.fullPressureComparison.differenceSetToZero,false);
    assert.ok(G.nodes[row.fullPressureComparison.remainingDifference]);}
  assert.equal(r.sourceLeadingExterior.pass,true);
  assert.equal(r.scope.wholeGN4Complete,false);assert.equal(r.scope.m3MayStart,false);
});

test('the actual primitive result rejects copied or edited mathematical receipts',()=>{
  const r=source();assert.throws(()=>assertActualGlobalPositivePrimitives({...r}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const x=r.rows[1].pressure.sourcePressureDerivative;r.rows[1].pressure.sourcePressureDerivative=r.G.zero;
  assert.throws(()=>assertActualGlobalPositivePrimitives(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.rows[1].pressure.sourcePressureDerivative=x;
  const p=r.scope.actualGlobalFullPressureConvolutionIdentity;r.scope.actualGlobalFullPressureConvolutionIdentity=true;
  assert.throws(()=>assertActualGlobalPositivePrimitives(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.scope.actualGlobalFullPressureConvolutionIdentity=p;
  assert.equal(assertActualGlobalPositivePrimitives(r),true);
});

test('the fixed original primitive graph receipt survives later graph appends',async()=>{
  const r=source(),before=await actualGlobalPositivePrimitivesCertificateFromProgram(r);r.G.fresh('after_primitive_receipt');
  assert.equal((await actualGlobalPositivePrimitivesCertificateFromProgram(r)).graph.sha256,before.graph.sha256);
  if(process.env.M2_POSITIVE_PRIMITIVES_EVIDENCE)await writeFile(process.env.M2_POSITIVE_PRIMITIVES_EVIDENCE,JSON.stringify({
    schema:'MathScope.ActualGlobalPositivePrimitivesSourceRun/1',sourceConstructions:constructions,certificate:before,
    actualRequest:{order:2,maxNodes:2000000},rssBytes:process.memoryUsage().rss},null,2)+'\n');
});
