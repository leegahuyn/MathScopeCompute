import test from 'node:test';
import assert from 'node:assert/strict';
import {mwFrobenius,mwTailBound,verifyMWResult} from '../mw-frobenius.mjs';
import {unramifiedRing,semilinearReconstruct,matrixMultiply,verifySemilinearResult} from '../unramified-frobenius.mjs';
import {qFramingComparison,qCechP1,qPrismaticApplication,verifyQComparison} from '../q-comparisons.mjs';
import {qdecode,qmul,qeq,qc,qsub} from '../q-polynomial.mjs';
import {projectiveComparison,verifyProjectiveComparison,eulerTailCertificate,ellipticGlobalIdentity} from '../geometric-comparisons.mjs';
import {breuilKisin} from '../q-bk.mjs';
import {sparseTorusRing,refineTorus,standardTiltOperation,sharpApproximation,sharpOperation,universalWittBinary,standardTiltWitt,thetaOperation,verifyThetaOperation} from '../tilt-arithmetic.mjs';
import {wittEncode,wittDecode,perfectoidTower} from '../perfectoid.mjs';
import {standardPerfectoidBase,fractionalEtaWitness,aomegaTorus,perfectPrismComparison,verifyPerfectoidComparison} from '../perfectoid-comparisons.mjs';
import {canonical,hash} from '../../../mathscope-m1/arithmetic/exact.mjs';
import {getExamples,runJob,validate} from '../index.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
function pairCount(p,a,b){let n=1;const mod=x=>((x%p)+p)%p;for(let x=0;x<p;x++)for(let y=0;y<p;y++)if(mod(y*y)===mod(x*x*x+a*x+b))n++;return n;}
function qeval(encoded,q){return encoded.reduce((s,t)=>s+Number(t.coefficient)*q**t.qPower,0);}
const scalarEval=(coeff,x)=>coeff.reduceRight((s,c)=>s*x+BigInt(c),0n);

test('P4-01: the finite-perfect model has an actual projective-bundle derived comparison and cannot be relabelled',()=>{
  for(const n of [0,1,2,4,8]){const c=projectiveComparison(3,n,4);assert(verifyProjectiveComparison(c).pass);assert.equal(c.comparisonMap.generatorImages.length,n+1);assert.equal(c.finitePerfectComplex.terms.length,2*n+1);assert.match(c.comparisonMap.quasiIsomorphismSource.url,/0FUN/);assert.equal(c.formalComplete,false);const wrong=clone(c);wrong.finitePerfectComplex.terms[0].frobenius=[['3']];assert.equal(verifyProjectiveComparison(wrong).pass,false);}
});

test('P4-04/05: actual MW matrices at two precisions agree and independently recover each good-curve point polynomial',()=>{
  for(const [p,a,b] of [[5,-1,0],[7,-1,0],[11,-1,0],[13,-1,0],[5,1,1],[7,2,1]]){
    const input={p,a,b,N:2},r=mwFrobenius(input),s=mwFrobenius({...input,N:3}),count=pairCount(p,a,b);
    assert.equal(r.status,'COMPLETED');assert.equal(s.status,'COMPLETED');assert.deepEqual(r.characteristicPolynomial.coefficients,[String(p),String(count-p-1),'1']);
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)assert.equal(BigInt(s.frobenius.matrix[i][j])%BigInt(p*p),BigInt(r.frobenius.matrix[i][j]));
    assert.equal(r.scope.computedIntegralPrismaticComplex,false);assert(r.precisionCertificate.omittedTermValuationLowerBound>=2);
  }
});

test('P4-04: insufficient working or tail precision produces no matrix; corrupt evidence fails recomputation',()=>{
  const input={p:5,N:3},good=mwFrobenius(input);assert(verifyMWResult(input,good).pass);
  for(const override of [{terms:1},{workingPrecision:3}]){const r=mwFrobenius({...input,...override});assert.equal(r.status,'PRECISION_REQUIRED');assert.equal(r.frobenius,undefined);}
  for(const mutate of [r=>{r.frobenius.matrix[0][0]='0';},r=>{r.precisionCertificate.omittedTermValuationLowerBound=99;},r=>{r.characteristicPolynomial.coefficients[0]='0';}]){const bad=clone(good);mutate(bad);assert.equal(verifyMWResult(input,bad).pass,false);}
  for(const p of [2,3])assert.throws(()=>mwFrobenius({p,N:3}),e=>e.code==='UNSUPPORTED');
  assert.throws(()=>mwFrobenius({p:5,N:3,m:2}),e=>e.code==='UNSUPPORTED');
  for(const p of [5,7,13])for(let k=1;k<100;k++)assert(mwTailBound(p,k)>=mwTailBound(p,k-1));
});

test('P4-05: sigma is a Hensel ring endomorphism, distinct from mixed-characteristic pth powering',()=>{
  const A=unramifiedRing({p:3,N:4,degree:2,polynomial:[1,0,1]});
  for(let i=0;i<9;i++){const x=A.element([i%3,Math.floor(i/3)]);assert(A.equal(A.sigma(A.sigma(x)),x));for(let j=0;j<9;j++){const y=A.element([j%3,Math.floor(j/3)]);assert(A.equal(A.sigma(A.add(x,y)),A.add(A.sigma(x),A.sigma(y))));assert(A.equal(A.sigma(A.mul(x,y)),A.mul(A.sigma(x),A.sigma(y))));}}
  assert.equal(A.equal(A.sigma(A.element([1,1])),A.pow(A.element([1,1]),3)),false);
  assert.throws(()=>unramifiedRing({p:3,N:4,degree:2,polynomial:[2,0,1]}),e=>e.code==='INVALID_FIELD');
});

test('P4-05: hand-derived F9 matrix gives trace 8 and determinant 10, while plain square gives trace 6',()=>{
  const input={p:3,N:4,extensionBaseDegree:2,coefficientPolynomial:[1,0,1],matrix:[[[0,1],1],[3,1]],bounds:[10,8,1]},r=semilinearReconstruct(input),A=unramifiedRing({p:3,N:4,degree:2,polynomial:[1,0,1]});
  assert.deepEqual(r.coefficients,['10','-8','1']);assert.deepEqual(r.qLinearMatrix,[[['4','0'],['1','1']],[['3','78'],['4','0']]]);
  const M=input.matrix.map(row=>row.map(A.element)),square=matrixMultiply(M,M,A);assert.equal(A.add(square[0][0],square[1][1])[0],6n);
  assert(verifySemilinearResult(input,r).pass);const bad=clone(r);bad.semilinearFactors[1]=bad.semilinearFactors[0];assert.equal(verifySemilinearResult(input,bad).pass,false);
  assert.equal(semilinearReconstruct({...input,N:2}).status,'PRECISION_REQUIRED');assert.equal(semilinearReconstruct({...input,bounds:[1,1,1]}).status,'FAILED');
});

test('P4-08: independent finite logarithmic tails lie below exact rational majorants and decrease with cutoff',()=>{
  for(const n of [0,2,8])for(const sigma of [n+1.5,n+2]){const b=eulerTailCertificate({n,realPartNumerator:sigma*2,realPartDenominator:2,cutoff:10}),q=b.logTailAbsoluteUpperBound,bound=Number(q.numerator)/Number(q.denominator);let tail=0;for(let m=11;m<=20000;m++)for(let i=0;i<=n;i++)tail-=Math.log1p(-(m**(i-sigma)));assert(tail<bound);const c=eulerTailCertificate({n,realPartNumerator:sigma*2,realPartDenominator:2,cutoff:100}).logTailAbsoluteUpperBound;assert(Number(c.numerator)/Number(c.denominator)<bound);}
  for(const n of [0,2])assert.throws(()=>eulerTailCertificate({n,realPartNumerator:n+1}),e=>e.code==='DIVERGENT_EULER_DOMAIN');
  const E=ellipticGlobalIdentity();assert(E.model.smoothProperOutsideS);assert.equal(E.convergence.domain,'Re(s)>2');assert.equal(E.convergence.RHOrBSDClaim,false);for(const f of E.localFactors)assert.equal(f.pointCount,String(pairCount(Number(f.p),-1,0)));
  assert.throws(()=>ellipticGlobalIdentity({excludedPrimes:[]}),e=>e.code==='UNVERIFIED_GOOD_MODEL');assert.throws(()=>ellipticGlobalIdentity({primes:[2]}),e=>e.code==='BAD_PRIME_IN_GOOD_PRODUCT');
});

test('P5-03/04: q-binomial maps satisfy an independently evaluated Jackson derivative and are the same elements at q=1',()=>{
  for(const shift of [-2,1,3]){const r=qFramingComparison({degree:8,shift});assert(verifyQComparison({degree:8,shift},r).pass);const F=r.matrices.forward[0];for(const q of [1,2,3])for(let n=1;n<=8;n++){const coefficients=F.map(row=>qeval(row[n],q)),previous=F.map(row=>qeval(row[n-1],q));for(const S of [-2,0,2]){const f=x=>coefficients.reduceRight((a,c)=>a*x+c,0),derivative=coefficients.reduce((a,c,k)=>a+(k?c*(q===1?k:(q**k-1)/(q-1))*S**(k-1):0),0),expected=(q===1?n:(q**n-1)/(q-1))*previous.reduceRight((a,c)=>a*S+c,0);assert.equal(derivative,expected);if(q===1)assert.equal(f(S),(S-shift)**n);}}assert(r.homotopyEquivalence.coneAcyclic);assert.equal(r.scope.multiplicativeComparison,false);const bad=clone(r);bad.matrices.forward[0][0][2][0].coefficient='99';assert.equal(verifyQComparison({degree:8,shift},bad).pass,false);}
  const a=qPrismaticApplication();assert.notEqual(a.base.qPDIdeal,a.base.prismIdeal);assert.equal(a.R1.isSameBaseAsR,false);assert(a.baseHomomorphisms.some(m=>m.qImage==='zeta_p^p=1'));assert.throws(()=>qPrismaticApplication({singular:true}),e=>e.code==='UNSUPPORTED');
});

test('P5-07: BK coefficient maps evaluate differently; the free derived tensor has no invented Tor terms',()=>{
  const r=breuilKisin({p:3,baseMapPolynomial:[5,2,1]}),b=r.pointBaseChanges;assert.deepEqual(b.crystalline.coefficientImage,['5']);assert.deepEqual(b.hodgeTate.coefficientImage,['20']);assert.deepEqual(b.deRham.coefficientImage,['788']);assert.match(b.derivedTensor.higherTor,/free/);
  const s=breuilKisin({p:3,E:[-3,0,1],baseMapPolynomial:[0,1]});assert.deepEqual(s.pointBaseChanges.hodgeTate.coefficientImage,['0','1']);assert.deepEqual(s.pointBaseChanges.deRham.coefficientImage,['0','3']);
});

test('P5-08: the older two-chart module diagnostic is not used as the actual q-PD nerve certificate',()=>{
  const r=qCechP1({degree:8});assert.equal(r.status,'PARTIAL');assert.equal(r.scope.canonicalQPDDescent,false);assert(r.blocks.filter(b=>b.weight).every(b=>b.dSquaredZero&&b.contraction&&!b.divisionByQInteger));assert(r.cechAlexander.tripleChecks.every(c=>c.pass));assert.match(r.blockers[0],/diagonal q-PD envelopes/);assert.equal(r.scope.multiplicativeEInfinityCertified,false);assert(verifyQComparison({degree:8},r).pass);const bad=clone(r);bad.blocks[0].d0[0][0]=[{qPower:0,coefficient:'5'}];assert.equal(verifyQComparison({degree:8},bad).pass,false);
});

test('P6-01/03: exact tilt Frobenius inverse refines and base omissions are refused',async()=>{
  for(const p of [2,3,5,7]){const r=standardTiltOperation({p,M:1,dimensions:1});assert(r.checks.every(x=>x.pass));assert(r.frobeniusInverse.compatible);}
  const base=standardPerfectoidBase({p:3,dimensions:2});assert.match(base.K,/completion/);assert.equal(base.theoremApplication.finiteLevelIsPerfectoid,false);assert.equal(base.hypotheses.length,3);
  for(const input of [{complete:false},{valuation:null},{pseudoUniformizer:null},{finiteLevelPerfectoid:true}])await assert.rejects(perfectoidTower(input),e=>e.code==='INVALID_PERFECTOID_BASE');
});

test('P6-03: sharp is stable under changing lifts by p and refining depth, but is not additive',()=>{
  for(const p of [2,3,5])for(const V of [2,3]){
    const input={p,M:0,V,dimensions:0},a=sharpApproximation(input),b=sharpApproximation({...input,liftPerturbation:[{coefficient:'2',exponents:[1]}]});assert(a.target.equal(a.value,b.value));
    const finer=sharpApproximation({...input,sharpSteps:V}),refined=refineTorus(a.value,a.target.depth,finer.target);assert(finer.target.equal(refined,finer.value));
  }
  const x=sharpApproximation({p:3,M:0,V:2,dimensions:0});assert.equal(x.target.equal(x.value,x.target.constant(4)),false);assert(x.target.encode(x.value).some(t=>t.exponents[0]>0));
  assert.equal(sharpOperation({p:3,V:3,sharpSteps:0}).status,'PRECISION_REQUIRED');
});

test('P6-04: universal Witt polynomials agree with the independent integer Teichmuller model on every small prime-field input',()=>{
  for(const p of [2,3,5]){const ring=sparseTorusRing({p,depth:0,dimensions:0}),N=2,decode=x=>wittDecode(x,p,N).map(c=>ring.constant(c));for(let a=0;a<p*p;a++)for(let b=0;b<p*p;b++)for(const operation of ['add','multiply']){const out=universalWittBinary(decode(a),decode(b),operation,ring,N),coordinates=out.coordinates.map(x=>String([...x.values()][0]??0));assert.equal(wittEncode(coordinates,p),BigInt(operation==='add'?(a+b)%(p*p):(a*b)%(p*p)));assert(out.ghostChecks.every(c=>c.exactCoefficientDivision));}}
});

test('P6-04: actual nonconstant Witt polynomials satisfy associativity, distributivity and Teichmuller multiplication',()=>{
  const r=sparseTorusRing({p:3,depth:1,dimensions:1}),N=3,z=r.zero(),one=r.constant(1),t=r.element([{coefficient:1,exponents:[1,0]}]),u=r.element([{coefficient:1,exponents:[0,1]}]);
  const A=[r.add(one,t),u,z],B=[u,t,one],C=[t,one,z],op=(a,b,k)=>universalWittBinary(a,b,k,r,N).coordinates,eq=(a,b)=>a.every((x,i)=>r.equal(x,b[i]));
  assert(eq(op(op(A,B,'add'),C,'add'),op(A,op(B,C,'add'),'add')));assert(eq(op(A,op(B,C,'add'),'multiply'),op(op(A,B,'multiply'),op(A,C,'multiply'),'add')));
  const teich=x=>[x,z,z];assert(eq(op(teich(t),teich(u),'multiply'),teich(r.mul(t,u))));assert(eq(op(A,B,'add').map(x=>r.pow(x,3)),op(A.map(x=>r.pow(x,3)),B.map(x=>r.pow(x,3)),'add')));
  const carry=standardTiltWitt({p:3,N:2,dimensions:0});assert.deepEqual(carry.rows.find(r=>r.operation==='p*1').coordinates,[[],[{coefficient:'1',exponents:[0]}]]);
});

test('P6-05: theta is a ring map on dense Witt observations, computes xi, and rejects a changed untilt hash',async()=>{
  const input={p:3,N:3,M:0,dimensions:0},r=sparseTorusRing({p:3,depth:0,dimensions:0}),N=3,one=r.constant(1),t=r.element([{coefficient:1,exponents:[1]}]),z=r.zero(),A=[r.add(one,t),t,z],B=[t,one,z],encode=x=>x.map(r.encode);
  const theta=async x=>thetaOperation({...input,coordinates:encode(x)}),a=await theta(A),b=await theta(B),T=sparseTorusRing({p:3,depth:2,dimensions:0,untilt:true,digits:3}),image=x=>T.element(x.rows[0].terms);
  for(const operation of ['add','multiply']){const C=universalWittBinary(A,B,operation,r,N).coordinates,c=await theta(C);assert(T.equal(image(c),operation==='add'?T.add(image(a),image(b)):T.mul(image(a),image(b))));}
  const x=await thetaOperation(input);assert(x.xi.distinguished);assert.deepEqual(x.rows.find(x=>x.operation==='theta(xi)').terms,[]);assert.deepEqual(x.rows.find(x=>x.operation==='theta(phi(xi))').terms,[{coefficient:'24',exponents:[0]}]);assert.equal(x.kernelComparison.formalComplete,false);assert((await verifyThetaOperation(input,x)).pass);const bad=clone(x);bad.object.baseHash='wrong';assert.equal((await verifyThetaOperation(input,bad)).pass,false);
});

test('P6-06: torus group model applies L eta and contracts fractional characters after the required base extension',async()=>{
  for(const [p,r,m] of [[2,1,1],[3,1,2],[3,2,4],[5,1,2]]){const x=fractionalEtaWitness({p,r,m,N:4,U:12});assert(x.pass);assert.equal(x.eta.differentialInChosenBases,'1');}
  const input={p:3,dimensions:3,weight:[0,-2,3]},a=await aomegaTorus(input);assert(a.checks.every(c=>c.pass));assert.match(a.base.C,/completion.*algebraic closure/);assert.equal(a.etaConstruction.rawComplexIsAomega,false);assert.equal(a.comparison.almostStep.rawGrade,'ALMOST_QUASI_ISOMORPHISM');assert(a.comparison.sources[0].locators.includes('Theorem 9.4(iii)'));
  for(const omit of ['omitBaseExtension','rawKoszulAsAomega','omitEta','omitCompletion'])await assert.rejects(aomegaTorus({[omit]:true}),e=>e.code==='INVALID_COMPARISON_ROUTE');
  assert((await verifyPerfectoidComparison(input,a)).pass);const bad=clone(a);bad.etaConstruction.integralCharacters.eta.d[0][0][0]=[{qPower:0,coefficient:'9'}];assert.equal((await verifyPerfectoidComparison(input,bad)).pass,false);
});

test('P6-07: comparison targets retain their actual ordered derived maps and block omitted or reordered steps',async()=>{
  for(const target of ['etale','etaleZp','deRham','crystalline']){const r=await perfectPrismComparison({target});assert((await verifyPerfectoidComparison({target},r)).pass);assert.equal(r.scope.finiteModPObservationIsZpCertificate,false);assert.equal(r.perfectPrism.localKernelCheck,false);const steps=r.route.orderedOperations;await assert.rejects(perfectPrismComparison({target,operations:steps.slice(1)}),e=>e.code==='INVALID_COMPARISON_ROUTE');await assert.rejects(perfectPrismComparison({target,operations:steps.slice().reverse()}),e=>e.code==='INVALID_COMPARISON_ROUTE');}
  for(const input of [{perfect:false},{omitInversion:true},{omitDerivedFixedPoints:true},{ordinaryFixedPoints:true},{modPOnlyAsZp:true}])await assert.rejects(perfectPrismComparison(input),e=>e.code==='INVALID_COMPARISON_ROUTE');
});

test('API: all new algorithm examples remain source-bound, deterministic and truthfully graded',async()=>{
  for(const ex of getExamples().slice(11)){const a=await runJob(ex.request),b=await runJob(ex.request);assert.equal(canonical(a),canonical(b));assert.equal(a.evidence.formalComplete,false);assert.equal(a.visualization.sourceHash,a.provenance.sourceHash);assert(a.visualization.points.length>0);const changed=clone(a);changed.results.object.kind+='FORGED';const{resultHash,...rest}=changed;assert.notEqual(await hash(rest),resultHash);}
  assert.equal(validate('arithmetic.comparison',{AomegaCertified:true}).ok,false);
});
