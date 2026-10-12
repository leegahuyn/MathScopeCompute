import test from 'node:test';
import assert from 'node:assert/strict';
import {getExamples,getCapabilities,getChecklist,run,runJob,validate} from '../index.mjs';
import {finiteField,isIrreducible,ellipticPointCount} from '../finite-fields.mjs';
import {projective,elliptic,newtonPolygon,reconstruct} from '../projective.mjs';
import {qDeRham,breuilKisin,etaFixture} from '../q-bk.mjs';
import {witt,wittEncode,wittDecode,teichmuller,perfectoidTower,validateRootPrefix} from '../perfectoid.mjs';
import {hash,canonical,meter} from '../../../mathscope-m1/arithmetic/exact.mjs';

test('P4-01: n=0,1,2,4,8 have exactly the declared degrees, ranks and Frobenius',()=>{
  for(const n of [0,1,2,4,8]){const r=projective({p:3,n,m:2});assert.equal(r.cohomology.length,2*n+1);for(const H of r.cohomology){assert.equal(H.rank,H.degree%2?0:1);if(H.rank)assert.equal(H.frobeniusEigenvalue,String(3n**BigInt(H.degree/2)));}assert(r.checks.every(c=>c.pass));assert.equal(r.scope.nativePrismaticComplexComputed,false);}
});

test('P4-01: a separate projective vector orbit enumeration agrees for small dimensions',()=>{
  for(const [p,n] of [[2,0],[3,1],[3,2],[2,4],[2,8]]){
    const normalized=new Set();for(let code=1;code<p**(n+1);code++){let k=code;const v=Array.from({length:n+1},()=>{const a=k%p;k=Math.floor(k/p);return a;});const lead=v.find(x=>x!==0);let inv=1;while(inv*lead%p!==1)inv++;normalized.add(v.map(x=>x*inv%p).join(','));}
    assert.equal(projective({p,n}).pointCount,String(normalized.size));
  }
});

test('P4-02: bad p=2, nonminimal a=-81 at p=3 and singular curves are not smooth fibres',()=>{
  assert.equal(elliptic({p:2}).status,'UNSUPPORTED');assert.equal(elliptic({p:2}).reduction.status,'BAD_REDUCTION');
  assert.equal(elliptic({p:3,a:-81,b:0}).reduction.status,'MINIMIZATION_REQUIRED');
  assert.throws(()=>elliptic({p:5,a:0,b:0}),e=>e.code==='SINGULAR_CURVE');
  for(const p of [5,7])assert.equal(elliptic({p}).reduction.status,'GOOD');
});

test('P4-03: all six original prime-count fixtures and infinity are correct',()=>{
  for(const [p,n,a] of [[3,4,0],[5,8,-2],[7,8,0],[11,12,0],[13,8,6],[17,16,2]]){
    const r=elliptic({p});assert.equal(r.primeField.count,String(n));assert.equal(r.aP,String(a));assert.equal(r.primeField.independentFullPairCount,String(n));assert.equal(r.primeField.affinePoints.length,n-1);assert.equal(r.primeField.pointAtInfinity.includedOnce,true);
  }
});

test('P4-03: F9 uses an explicit irreducible polynomial; reducible fields fail',()=>{
  assert.equal(isIrreducible([1,0,1],3),true);assert.equal(isIrreducible([2,0,1],3),false);
  assert.throws(()=>finiteField(3,2,[2,0,1]),e=>e.code==='INVALID_FIELD');
  const r=elliptic({p:3,m:2,polynomial:[1,0,1]});assert.equal(r.extensionField.count,'16');assert.equal(r.extensionField.independentFullPairCount,'16');assert.deepEqual(r.extensionField.field.definingPolynomial,['1','0','1']);
});

test('P4-07: explicit F_(p^m) enumeration matches trace recurrence for p=3,5,7 and m=1..4',()=>{
  for(const p of [3,5,7])for(let m=1;m<=4;m++){
    const r=elliptic({p,m,fullPairs:true},meter({maxOperations:50000000,maxMillis:60000}));assert.equal(r.extensionField.count,r.traceSequence[m-1].count);assert.equal(r.extensionField.independentFullPairCount,r.extensionField.count);assert(r.checks.every(c=>c.pass));
  }
});

test('P4-03: finite-field operations satisfy distributivity and Frobenius on every F9 element',()=>{
  const F=finiteField(3,2,[1,0,1]);for(let x=0;x<F.q;x++){assert.equal(F.pow(x,F.q),x);for(let y=0;y<F.q;y++)for(let z=0;z<F.q;z++)assert.equal(F.mul(x,F.add(y,z)),F.add(F.mul(x,y),F.mul(x,z)));}
});

test('P4-04/05: actual MW is available; extension MW and missing semilinear inputs remain rejected',()=>{
  const r=elliptic({p:5,N:3,backend:'mw'});assert.equal(r.status,'COMPLETED');assert.deepEqual(r.characteristicPolynomial.coefficients,['5','2','1']);
  assert.throws(()=>elliptic({p:5,N:3,m:2,backend:'mw'}),e=>e.code==='UNSUPPORTED');
  assert.throws(()=>reconstruct({extensionBaseDegree:2}),e=>e.code==='INVALID_RECONSTRUCTION');
});

test('P4-05: exact residue reconstruction rejects insufficient precision and inconsistent bounds',()=>{
  assert.deepEqual(reconstruct({p:5,N:4,residues:[5,2,1],bounds:[5,4,1]}).coefficients,['5','2','1']);
  assert.deepEqual(reconstruct({p:7,N:2,residues:[7,0,1],bounds:[7,5,1]}).coefficients,['7','0','1']);
  assert.equal(reconstruct({p:5,N:1,residues:[5,2,1],bounds:[5,4,1]}).status,'PRECISION_REQUIRED');
  assert.equal(reconstruct({p:5,N:4,residues:[20],bounds:[4]}).status,'FAILED');
  assert.deepEqual(reconstruct({p:5,N:4,residues:[623],bounds:[4]}).coefficients,['-2']);
});

test('P4-06: ordinary/supersingular Newton slopes are rational and not complex angles',()=>{
  assert.deepEqual(elliptic({p:5}).newton.rootValuations,[{numerator:0,denominator:1},{numerator:1,denominator:1}]);
  assert.deepEqual(elliptic({p:7}).newton.rootValuations,[{numerator:1,denominator:2},{numerator:1,denominator:2}]);
  assert.equal(elliptic({p:5}).hodge.H1Dimension,2);assert.equal(elliptic({p:7}).hodge.H1Dimension,2);assert.equal(elliptic({p:7}).complexRoots.status,'FLOAT64_DISPLAY_ONLY');
  assert.throws(()=>newtonPolygon([0,1],3),e=>e.code==='UNSUPPORTED');
});

test('P4-08: local scheme zeta is distinct from elliptic L, with incomplete global scope',()=>{
  const r=elliptic({p:5});assert.deepEqual(r.localZeta.scheme.numerator,['1','2','5']);assert.deepEqual(r.localZeta.scheme.denominator,['1','-6','5']);assert.deepEqual(r.localZeta.ellipticL.numerator,['1']);assert.equal(r.localZeta.completeGlobalLFunction,false);
  const pn=projective({p:3,n:4});assert.deepEqual(pn.globalIdentity.finiteProduct.left,pn.globalIdentity.finiteProduct.right);assert.equal(pn.globalIdentity.convergenceDomain,'Re(s) > 5');assert.equal(pn.globalIdentity.isCompleteNumericalGlobalFunction,false);
});

test('P5-01/02/05: exact q polynomials, Koszul d-squared-zero and typed specializations',()=>{
  for(let a=1;a<=8;a++)for(let b=1;b<=8;b++){const r=qDeRham({p:3,a,b});assert(r.checks.every(c=>c.pass));assert(r.complex.dSquared.every(x=>x==='0'));}
  const r=qDeRham({p:3});assert.deepEqual(r.bases.qPrism.idealGeneratorInH,['3','3','1']);assert.notEqual(r.bases.qPrism.I,r.bases.qPDPair.ideal);
  for(const row of r.qIntegers){assert.equal(row.atQ1,String(row.m));assert.equal(row.coefficientsInH.reduce((s,x)=>s+BigInt(x),0n),2n**BigInt(row.m)-1n);}
  assert.equal(r.comparisonMaps.find(x=>x.id==='cyclotomic').ordinaryDeRham,false);
  assert.throws(()=>qDeRham({q:1.05}),e=>e.code==='INVALID_SPECIALIZATION');assert.throws(()=>qDeRham({singular:true}),e=>e.code==='UNSUPPORTED');
});

test('P5-03/04/08: local d-squared-zero cannot authorize framing or derived descent',()=>{
  const r=qDeRham();assert.equal(r.framing.difference,'h=q-1');assert.equal(r.framing.comparisonStatus,'EXPLICIT_CHAIN_ISOMORPHISM_AVAILABLE');assert.equal(r.scope.globalDerivedDescent,false);
  for(const flag of ['certifyFramingIndependence','certifyDescent','certifyEInfinity'])assert.throws(()=>qDeRham({[flag]:true}),e=>e.code==='UNSUPPORTED');
});

test('P5-06: BK delta(u-3) is exact; independently evaluate phi(E)-E^p=p*delta(E)',()=>{
  const r=breuilKisin({p:3,E:[-3,1]});assert.deepEqual(r.delta.coefficients,['8','-9','3']);assert.equal(r.delta.constantResidueModP,'2');
  const evaluate=(coeff,x)=>coeff.reduceRight((sum,c)=>sum*x+BigInt(c),0n);
  for(const E of [[-3,1],[-3,0,1],[3,3,1]]){const r=breuilKisin({p:3,E});for(let u=-5n;u<=5n;u++)assert.equal(evaluate(E,u**3n)-evaluate(E,u)**3n,3n*evaluate(r.delta.coefficients,u));}
  for(const E of [[-9,1],[1,1],[-3,1,1],[-3,2]])assert.throws(()=>breuilKisin({p:3,E}),e=>e.code==='INVALID_EISENSTEIN');
});

test('P5-07: BK maps retain the Frobenius twist and refuse an invented Tate multiplier',()=>{
  const r=breuilKisin({p:3});assert.deepEqual(r.baseChangeMaps.map(x=>x.uImage),['0','3','27']);
  assert.throws(()=>breuilKisin({projectiveTateMultiplier:3}),e=>e.code==='UNSUPPORTED');assert.throws(()=>breuilKisin({uniformizerChange:'6'}),e=>e.code==='UNSUPPORTED');
});

test('P6-04: W2(F3) has a nonzero characteristic-9 carry and Teichmuller fixed points',()=>{
  const r=witt({p:3,N:2,a:[1,0],b:[1,0]});assert.deepEqual(r.rows[2].coordinates,['2','1']);assert.equal(r.rows[2].integerResidue,'2');assert.deepEqual(r.rows.find(x=>x.operation==='p*1').coordinates,['0','1']);assert.equal(r.rows.find(x=>x.operation==='p*1').integerResidue,'3');
  for(const p of [2,3,5])for(let n=1;n<=4;n++)for(let a=0;a<p;a++){const t=teichmuller(a,p,n),modulus=BigInt(p)**BigInt(n);assert.equal(t**BigInt(p)%modulus,t);}
  assert.throws(()=>witt({coefficientRing:'O_K^flat'}),e=>e.code==='UNSUPPORTED');
});

test('P6-04: every small Witt coordinate tuple round trips; ring operations agree with Z/p^N',()=>{
  for(const [p,N] of [[2,3],[3,2],[5,2]]){const modulus=p**N;for(let x=0;x<modulus;x++){const coords=wittDecode(x,p,N);assert.equal(wittEncode(coords,p),BigInt(x));for(let y=0;y<modulus;y++){const r=witt({p,N,a:coords,b:wittDecode(y,p,N)});assert.equal(r.rows[2].integerResidue,String((x+y)%modulus));assert.equal(r.rows[3].integerResidue,String(x*y%modulus));}}}
});

test('P6-01/02/03: tower prefixes refine compatibly, with no invented reverse ring map',async()=>{
  const towers=await Promise.all([2,3,4].map(M=>perfectoidTower({p:3,M})));
  for(const t of towers){assert.equal(validateRootPrefix(t.levels,3).pass,true);assert.equal(t.scope.finiteLevelIsPerfectoid,false);assert.equal(t.scope.finiteObservationIsInverseLimit,false);}
  for(let i=0;i<2;i++)assert.deepEqual(towers[i].levels.map(x=>x.exponentDenominator),towers[i+1].levels.slice(0,towers[i].levels.length).map(x=>x.exponentDenominator));
  const broken=towers[2].levels.filter(x=>x.level!==2);assert.equal(validateRootPrefix(broken,3).pass,false);
  await assert.rejects(perfectoidTower({p:3,M:4,levels:broken}),e=>e.code==='INVALID_ROOT_PREFIX');
  await assert.rejects(perfectoidTower({complete:false}),e=>e.code==='INVALID_PERFECTOID_BASE');await assert.rejects(perfectoidTower({operation:'tiltAdd'}),e=>e.code==='UNSUPPORTED');
});

test('P6-05/06: theta is tied to its untilt, and eta changes the torsion diagnostic',async()=>{
  const t=await perfectoidTower({p:3});assert.equal(t.theta.untiltBaseHash,await hash(t.base));assert.equal(t.theta.thetaXi,'0');assert.equal(t.theta.thetaAfterFrobeniusXi,'24');assert.equal(t.theta.kernelQuotient.grade,'THEOREM_REFERENCE');assert.equal(t.theta.kernelQuotient.localKernelCheck,false);
  const eta=etaFixture({p:3,d:3});assert.equal(eta.raw.H1,'Z/3Z');assert.equal(eta.eta.H1,'Z/1Z');assert.equal(eta.scope.AomegaCertified,false);
});

test('API: every shipped example is deterministic, source-bound and has actual plotted data',async()=>{
  for(const example of getExamples()){
    const r=await runJob(example.request);assert.equal(r.status,'COMPLETED',example.id);assert(r.checks.every(c=>c.pass),example.id);assert(r.visualization.points.length>0,example.id);assert(r.visualization.axes.length>0);assert.equal(r.visualization.sourceHash,r.provenance.sourceHash);assert.equal(r.evidence.formalComplete,false);assert.equal(r.evidence.lean,'NO_NEW_KERNEL_EXECUTION');
    const {resultHash,...payload}=r;assert.equal(resultHash,await hash(payload));assert.equal(canonical(r),canonical(await runJob(example.request)),example.id);
  }
});

test('API: unsafe numbers, false badges, unsupported inputs and tight budgets are rejected',async()=>{
  assert.equal(validate('arithmetic.projective',{formalComplete:true}).ok,false);assert.equal(validate('arithmetic.projective',{p:9007199254740993}).ok,false);assert.equal(validate('arithmetic.fake',{}).ok,false);
  await assert.rejects(run('arithmetic.projective',{p:4}),e=>e.code==='INVALID_PRIME');await assert.rejects(run('arithmetic.projective',{n:9}),e=>e.code==='INPUT_RANGE');
  await assert.rejects(runJob({kind:'arithmetic.elliptic',input:{p:7,m:4,fullPairs:true},budget:{maxOperations:1}}),e=>e.code==='RESOURCE_LIMIT');
  assert.equal(getCapabilities().formalComplete,false);assert.equal(getChecklist().length,24);assert.equal(new Set(getChecklist().map(x=>x.id)).size,24);assert(getChecklist().every(x=>x.status==='PASS'&&x.formalComplete===false));
});
