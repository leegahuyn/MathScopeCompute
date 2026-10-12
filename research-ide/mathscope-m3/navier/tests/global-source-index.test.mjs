import test from 'node:test';
import assert from 'node:assert/strict';
import {exactActiveTranslates,exactPointLabelInventory,exactRadialLabelInventory,dyadicRepresentativeOffsets,searchFixedRepresentative} from '../global-source-index.mjs';
import {rational,qsub,qcompare,readRational,qtext} from '../../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';

test('all strict-support translates agree with an independent wide exact inventory, including negative cells and flat endpoints',()=>{
  for(let numerator=-64;numerator<=64;numerator++){
    const x=rational(numerator,16),expected=[];
    for(let j=-10;j<=10;j++){
      const d=qsub(x,rational(j));
      if(qcompare(d,rational(-3,4))>0&&qcompare(d,rational(3,4))<0)expected.push(String(j));
    }
    const actual=exactActiveTranslates(qtext(x));
    assert.deepEqual(actual.rows.map(r=>r.label),expected);
    assert.ok(actual.positiveCount>=1&&actual.positiveCount<=2);
    assert.equal(actual.sourceAuthenticated,false);
  }
  assert.deepEqual(exactActiveTranslates('3/4').rows.map(r=>r.label),['1']);
  assert.deepEqual(exactActiveTranslates('-3/4').rows.map(r=>r.label),['-1']);
});

test('the source point inventory has distinct band meshes and counts each box once despite the two signs',()=>{
  const r=exactPointLabelInventory({log2InverseQ:'17/2',meshCoordinatesByBand:{8:['1/2','1/2','1/2'],9:['-1/2','3/2','5/2']}});
  assert.equal(r.positiveBoxCount,16);assert.equal(r.signedWaveCount,32);
  assert.ok(r.rows.every(x=>x.countInSquaredPartition===1&&x.signs.length===2));
  assert.ok(r.rows.filter(x=>x.ell==='8').every(x=>['0','1'].includes(x.mesh[2])));
  assert.ok(r.rows.filter(x=>x.ell==='9').every(x=>['2','3'].includes(x.mesh[2])));
  assert.throws(()=>exactPointLabelInventory({log2InverseQ:'17/2',meshCoordinatesByBand:{8:['0','0','0']}}),/Missing original mesh coordinates/);
});

test('radial integration retains every crossed mesh interval, rather than using the pointwise overlap bound',()=>{
  const r=exactRadialLabelInventory({ell:'2',radiusInterval:['1','2'],z:'1/128',t:'1/128',maxEnumerated:1000});
  const rows=[...r.enumerate()];
  assert.equal(r.radialCount,'65');assert.equal(r.boxCount,'260');assert.equal(r.signedWaveCount,'520');
  assert.equal(rows.length,260);assert.equal(rows[0].mesh[0],'64');assert.equal(rows.at(-1).mesh[0],'128');
  assert.equal(r.pointwiseCountUsedForRadialIntegral,false);
  for(let j=64;j<=128;j++)assert.equal(rows.filter(x=>x.mesh[0]===String(j)).length,4);
});

test('enormous original-style integer inventories stay exact and fail before returning a misleading prefix',()=>{
  const r=exactRadialLabelInventory({ell:'1000000000000000000000000',radiusInterval:['1','2'],z:'0',t:'0',maxEnumerated:32});
  assert.equal(r.radialCount,String(10n**144n+1n));
  assert.throws(()=>[...r.enumerate()],/Complete radial inventory/);
  assert.equal(r.sourceAuthenticated,false);
  assert.throws(()=>exactRadialLabelInventory({ell:'3/2',radiusInterval:['1','2'],z:'0',t:'0'}),/exact integer/);
});

test('representative offsets form a duplicate-free exact interior prefix',()=>{
  const a=dyadicRepresentativeOffsets({maxDepth:3,maxCandidates:1000}),seen=new Set();
  for(let k=0;k<200;k++){
    const x=a.next();assert.equal(x.done,false);
    const key=x.value.offsets.join(',');assert.ok(!seen.has(key));seen.add(key);
    for(const t of x.value.offsets){const q=readRational(t);assert.ok(qcompare(q,rational(-3,4))>0&&qcompare(q,rational(3,4))<0);}
  }
});

test('fixed representative search revisits unresolved candidates and is invariant under a larger budget',async()=>{
  const predicate=async x=>({status:x.ordinal===0&&x.bits>=160?'PROVED_INSIDE':'UNRESOLVED',retainedCoordinates:x.coordinates});
  const input={ell:'2',mesh:['64','0','0'],certifyCandidate:predicate,maxDepth:3};
  const a=await searchFixedRepresentative({...input,maxCandidates:64,maxRounds:4}),b=await searchFixedRepresentative({...input,maxCandidates:256,maxRounds:8});
  assert.deepEqual(a,b);assert.equal(a.ordinal,0);assert.equal(a.bits,160);assert.deepEqual(a.coordinates,['1','0','0']);
  assert.equal(a.sourceAuthenticated,false);
  await assert.rejects(searchFixedRepresentative({...input,maxRounds:1}),/finite search budget/);
});
