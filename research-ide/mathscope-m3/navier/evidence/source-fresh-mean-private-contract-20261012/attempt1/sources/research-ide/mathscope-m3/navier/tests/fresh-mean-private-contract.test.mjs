import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {prepareOriginalMeanMapOperatorSeminorms,assertOriginalMeanMapOperatorSeminorms,originalMeanMapOperatorCertificate}
  from '../source-fixed-mean-majorants.mjs';
import {copyClosedOriginalSourceConstants} from '../source-pressure-class-kernel.mjs';
import {composeOriginalFiveMapClassRows} from '../source-fresh-mean-class-kernel.mjs';
import {originalFreshMeanClassCompositionRecipe,attachGlobalPostTemporalDefectClass,assertGlobalPostTemporalDefectClass,
  attachGlobalInitializedMeanInputClasses,assertGlobalInitializedMeanInputClasses}
  from '../source-global-fresh-mean-class-majorants.mjs';

const fixtures={};let fixed,G,copied;

test('closed fresh-mean recipe keeps every same-current operator dependency and true finite-row scope',()=>{
  const recipe=originalFreshMeanClassCompositionRecipe();fixtures.recipe=recipe;
  assert.equal(recipe.exactInitialExponents.freshGr,'1-kappa_s');
  assert.equal(recipe.exactInitialExponents.freshNewDefects,'2-2*kappa_s');
  assert.equal(recipe.exactLowerBounds.newDefectsAboveC0Star,'39999/50000');
  assert.equal(recipe.unmaterializedDerivativeRowsDeclaredExecuted,false);
  assert.equal(recipe.actualSourceClassAuthoritySupplied,false);assert.equal(recipe.completeN6,false);
  assert.equal(Object.keys(recipe.producers).length,8);
  assert.ok(recipe.sourceRelations.some(x=>x.includes('fresh P/J')));
  assert.ok(recipe.derivativeRecurrence.initializedDefects.includes('m+5'));
});

test('private current source classes cannot be hydrated from an archived shape or a caller completion flag',()=>{
  const fakes=[{},structuredClone(fixtures.recipe),{scope:{actualFreshPostTemporalPJClassesCertified:true}},
    {sourceAuthenticated:true,G:new ActualConvergentExpressions(),rows:[{order:100}]}];
  for(const fake of fakes){
    assert.throws(()=>attachGlobalPostTemporalDefectClass(fake,{},{}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertGlobalPostTemporalDefectClass(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>attachGlobalInitializedMeanInputClasses(fake,{},{}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertGlobalInitializedMeanInputClasses(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
});

test('the actual original fixed five-map constants copy losslessly into the current norm namespace',async()=>{
  fixed=await prepareOriginalMeanMapOperatorSeminorms({order:1,maxNodes:300000,maxWork:10000});
  assert.equal(assertOriginalMeanMapOperatorSeminorms(fixed),true);G=new ActualConvergentExpressions();
  const roots=fixed.byOrder.flatMap(row=>[row.maximum,...Object.values(row.componentBounds)]);
  copied=copyClosedOriginalSourceConstants(fixed.G,G,roots,{maxWork:200000,name:'five_private_contract_norm'});
  assert.equal(copied.roots.length,10);assert.equal(copied.allCopiedRootsClosed,true);
  assert.equal(copied.allDefiningIntegrandsAndEndpointsRetained,true);
  assert.ok(copied.identities.some(row=>row.operation==='definite_integral'));
  assert.ok(copied.identities.some(row=>row.operation==='maximum'));
  assert.ok(copied.identities.some(row=>row.operation==='smooth_piecewise'));
  fixtures.fixedCopy={roots:copied.roots,identities:copied.identities,work:copied.work,
    sourceParameterSHA256:fixed.source.parameterExpressionSHA256,
    sourceOnlyFixedOperatorGenerated:true,actualCurrentNormAuthority:false};
});

test('copied actual fixed coefficients multiply all three retained target bounds without changing h or lambda',()=>{
  const q=(n,d=1)=>G.q(n,d),operatorRows=fixed.byOrder.map(row=>({...structuredClone(row),
    maximum:copied.mapping.get(row.maximum),componentBounds:Object.fromEntries(Object.entries(row.componentBounds)
      .map(([name,id])=>[name,copied.mapping.get(id)]))})),
    defectRows=Array.from({length:3},(_,order)=>({order,defects:Object.fromEntries(['P','Jtheta','Jz'].map((name,j)=>[name,{
      constant:q(3+2*j+order),power:order+1,pole:0,epsilonExponent:'1-kappa_s',weight:'1',gaussian:'1'}]))})),
    product=composeOriginalFiveMapClassRows(G,{order:1,defectRows,operatorRows,maxWork:10000});
  for(const [m,row]of product.rows.entries()){
    assert.equal(row.inputOrder,m+1);assert.equal(row.fields.v.epsilonExponent,'1-kappa_s');
    assert.equal(row.fields.beta.epsilonExponent,'2-kappa_s');
    assert.equal(row.fields.beta.constant,G.mul(row.combinedInput.constant,operatorRows[m].componentBounds.betaOverEpsilon));
    assert.equal(row.fields.psi.weight,'zeta');
  }
  assert.deepEqual(G.source.parametersExactExpressions.h,{exp:{product:[{integer:-8002},{ref:'T'}]}});
  assert.deepEqual(G.source.parametersExactExpressions.lambda,{exp:{product:[{integer:-1000},{ref:'T'}]}});
  assert.equal(product.actualCurrentInputClassCertified,false);assert.equal(product.completeN6,false);
  fixtures.actualFixedProducts={operatorRows,defectRows,product};
});

test('changing one new Jz bound changes the real fixed-source five velocity constant',()=>{
  const {operatorRows,defectRows,product}=fixtures.actualFixedProducts,changed=structuredClone(defectRows);
  changed[1].defects.Jz.constant=G.mul(G.q(1000),changed[1].defects.Jz.constant);
  const result=composeOriginalFiveMapClassRows(G,{order:1,defectRows:changed,operatorRows,maxWork:10000});
  assert.notEqual(result.rows[0].fields.v.constant,product.rows[0].fields.v.constant);
  assert.notEqual(result.rows[0].fields.beta.constant,product.rows[0].fields.beta.constant);
  fixtures.changedJz={input:changed,result};
});

after(async()=>{
  if(process.env.MATHSCOPE_FRESH_MEAN_PRIVATE_DIRECTORY){
    const original=await originalMeanMapOperatorCertificate(fixed),payload={
      schema:'MathScope.N6.FreshMeanPrivateContractFixtures/1',fixtures,
      originalFixedOperator:original,program:G.pack({}),
      actualPrivateCurrentAttachmentExecuted:false,actualCurrentInputSourceClassCertified:false,
      originalProp9_5Certified:false,completeN6:false};
    await writeFile(process.env.MATHSCOPE_FRESH_MEAN_PRIVATE_DIRECTORY+'/fresh-mean-private-contract.json',JSON.stringify(payload,null,2)+'\n');
  }
});
