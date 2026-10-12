import test from 'node:test';
import assert from 'node:assert/strict';
import {originalCommonYAffineClassRecipe,attachGlobalCommonYCovarianceClass,assertGlobalCommonYCovarianceClass}
  from '../source-common-y-class-majorants.mjs';

test('all five original integer covering powers retain both columns with an exact norm bound',()=>{
  const p=originalCommonYAffineClassRecipe({order:6}),J=[[3n,1n],[1n,5n]];
  let M=[[1n,0n],[0n,1n]];
  for(const row of p.matrixRows){
    assert.deepEqual(row.matrix,M.map(r=>r.map(String)));assert.equal(row.pass,true);
    for(let j=0;j<2;j++)assert.ok(M[0][j]+M[1][j]<=6n**BigInt(row.delta));
    assert.equal(M[0][0]*M[1][1]-M[0][1]*M[1][0],14n**BigInt(row.delta));
    M=M.map(r=>[0,1].map(j=>r[0]*J[0][j]+r[1]*J[1][j]));
  }
  assert.equal(p.maximumColumnNorm,1296);assert.equal(p.sourceAuthenticated,false);
  assert.deepEqual(p.rectangle.pulseJacobian,'vt^T*Jg^delta/(Dgeom*ci_label)');
});

test('the complete mixed affine chain coefficient norm is the product of the actual two-branch sums',()=>{
  // This exact integer algebra is independent of the source attachment:
  // choose one of two fast-coordinate derivatives at every Y step.
  const columns=[[2n,-3n],[-5n,7n]];
  for(let m=0;m<=9;m++){
    for(const split of [0,Math.floor(m/2),m]){
      const steps=Array.from({length:m},(_,i)=>columns[i<split?0:1]);
      let expansion=new Map([['0,0',1n]]);
      for(const col of steps){const next=new Map();for(const [key,v]of expansion){
        const a=key.split(',').map(Number);for(let j=0;j<2;j++){const b=[...a];b[j]++;
          const k=b.join(',');next.set(k,(next.get(k)||0n)+v*col[j]);}}
        expansion=next;
      }
      const abs=x=>x<0n?-x:x,l1=[...expansion.values()].reduce((s,x)=>s+abs(x),0n),
        upper=steps.reduce((v,c)=>v*(abs(c[0])+abs(c[1])),1n);
      assert.ok(l1<=upper);assert.ok(l1>0n);
      if(m>0)assert.ok(l1>steps.reduce((v,c)=>v*abs(c[0]),1n));
    }
  }
});

test('neighboring S conversion and the inverse pulse length must both be retained',()=>{
  for(const ell of [8n,17n,100n])for(const d of [-2n,-1n,0n,1n,2n]){
    const S=ell*ell,Sl=(ell+d)*(ell+d);assert.ok(Sl<=4n*S);
    // A positive lower inverse-time estimate grows with S even on delta0.
    assert.ok(Sl>1n);
  }
  const p=originalCommonYAffineClassRecipe({order:7});
  assert.deepEqual(p.chain.exactBranchCounts.map(r=>r.additionalSPower),[0,1,2,3,4,5,6,7]);
  assert.deepEqual(p.chain.exactBranchCounts.map(r=>r.allTorusBranchCount),['1','2','4','8','16','32','64','128']);
  assert.match(p.originalPalette.proof,/floor\(x\)/);assert.match(p.chain.constant,/4\*Tg/);
});

test('norm roots and source completion cannot be supplied in place of private same-current objects',()=>{
  for(const fake of [{},{scope:{actualPreHaarCommonYCovarianceClassCertified:true}},{sourceAuthenticated:true}]){
    assert.throws(()=>attachGlobalCommonYCovarianceClass(fake,{}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertGlobalCommonYCovarianceClass(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
  for(const input of [{order:-1},{order:1.5},{order:9,maxWork:2}])
    assert.throws(()=>originalCommonYAffineClassRecipe(input),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>originalCommonYAffineClassRecipe({complete:true}),{code:'INVALID_INPUT'});
});
