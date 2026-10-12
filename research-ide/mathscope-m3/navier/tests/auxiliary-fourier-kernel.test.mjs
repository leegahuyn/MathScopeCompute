import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {exactAuxiliaryPi,exactAuxiliaryDivisor,actualFourierCoefficient,sourceTorusDerivativeBound,
  auxiliaryInverseTail,finiteAuxiliaryInverse} from '../source-auxiliary-fourier.mjs';

function setup(){const G=new ActualConvergentExpressions(),Y=[G.fresh('test_y0'),G.fresh('test_y1')],slow=G.fresh('test_slow');return {G,Y,slow};}
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
const Q=(a,b=1n)=>{a=BigInt(a);b=BigInt(b);if(b<0n){a=-a;b=-b;}const d=gcd(a,b);return [a/d,b/d];};
const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),neg=a=>[-a[0],a[1]],
  div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]);
function quadratic(G,root){
  const cache=new Map(),plus=(a,b)=>[add(a[0],b[0]),add(a[1],b[1])],
    times=(a,b)=>[add(mul(a[0],b[0]),mul(Q(2),mul(a[1],b[1]))),add(mul(a[0],b[1]),mul(a[1],b[0]))];
  function at(id){if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let out;
    if(op==='rational')out=[Q(...args),Q(0)];
    else if(op==='sqrt_positive'){assert.deepEqual(G.nodes[args[0]],{op:'rational',args:['2','1']});out=[Q(0),Q(1)];}
    else if(op==='add')out=args.map(at).reduce(plus,[Q(0),Q(0)]);
    else if(op==='multiply')out=args.map(at).reduce(times,[Q(1),Q(0)]);
    else if(op==='inverse'){const a=at(args[0]),norm=add(mul(a[0],a[0]),neg(mul(Q(2),mul(a[1],a[1]))));out=[div(a[0],norm),div(neg(a[1]),norm)];}
    else if(op==='integer_power'){out=[Q(1),Q(0)];for(let j=0;j<args[1];j++)out=times(out,at(args[0]));}
    else throw Error('Unexpected non-quadratic node '+op);
    cache.set(id,out);return out;
  }
  return at(root);
}

test('every tested original divisor and large Pell near-resonance is inverted exactly in Q(sqrt2)',()=>{
  const {G}=setup(),modes=[];
  for(let k0=-8;k0<=8;k0++)for(let k1=-8;k1<=8;k1++)if(k0||k1)modes.push([k0,k1]);
  let p=1n,q=1n;for(let j=0;j<80;j++){[p,q]=[p+2n*q,p+q];if(j%10===0)modes.push([String(q),String(q-p)]);}
  for(const k of modes){const d=exactAuxiliaryDivisor(G,k),k0=BigInt(k[0]),k1=BigInt(k[1]);
    assert.deepEqual(quadratic(G,d.value),[Q(k1-k0),Q(k0)]);
    assert.deepEqual(quadratic(G,G.mul(d.value,d.reciprocal)),[Q(1),Q(0)]);
    assert.equal(BigInt(d.quadratic.integerNorm),(k1-k0)**2n-2n*k0*k0);
    assert.equal(d.proof.integerNormAbsAtLeastOne,true);assert.equal(d.proof.mBoundChecked,true);assert.equal(d.proof.nBoundChecked,true);
    assert.equal(d.proof.binary64UsedForNonzeroDecision,false);assert.equal(d.sourceAuthenticated,false);}
  assert.throws(()=>exactAuxiliaryDivisor(G,[0,0]),{code:'ZERO_MODE_NOT_INVERTIBLE'});
  for(const bad of [[1.1,0],[Infinity,1],['01',1],[1],{k:[1,0]}])assert.throws(()=>exactAuxiliaryDivisor(G,bad));
});

test('pi and every Fourier coefficient retain explicit integrals while all slow parameters remain free',()=>{
  const {G,Y,slow}=setup(),pi=exactAuxiliaryPi(G),body=G.mul(slow,G.cosine(G.mul(G.q(2),pi.value,Y[0]))),
    count=G.nodes.length,prefix=JSON.stringify(G.nodes),coefficient=actualFourierCoefficient(G,{body,Y,k:[1,0]});
  assert.equal(pi.binary64,null);assert.equal(G.nodes[pi.integral].op,'definite_integral');
  assert.equal(G.nodes[pi.integral].args[1],pi.variable);assert.equal(G.nodes[pi.integral].args[2],G.zero);assert.equal(G.nodes[pi.integral].args[3],G.one);
  for(const value of [coefficient.C,coefficient.S]){assert.ok(G.freeCoordinates(value).has(slow));assert.ok(Y.every(y=>!G.freeCoordinates(value).has(y)));}
  assert.equal(coefficient.numericalQuadratureValueSupplied,false);assert.equal(coefficient.sourceAuthenticated,false);
  assert.equal(JSON.stringify(G.nodes.slice(0,count)),prefix);
  pi.value=G.zero;assert.notEqual(exactAuxiliaryPi(G).value,G.zero,'a caller cannot mutate cached pi');
});

test('the two-dimensional FTC bound retains its mixed face and cannot accept caller norm substitutions',()=>{
  const {G,Y,slow}=setup(),body=G.mul(slow,Y[0],Y[1]),bound=sourceTorusDerivativeBound(G,{body,Y,derivativeOrder:0});
  for(const face of bound.faces){assert.equal(face.mixed,slow);assert.equal(face.anchor,G.one);assert.equal(face.xFace,G.one);assert.equal(face.yFace,G.one);
    assert.equal(face.mixedFace,G.sqrt(G.add(G.one,G.pow(slow,2))));}
  assert.deepEqual([...G.freeCoordinates(bound.upper)],[slow]);assert.equal(bound.highestGeneratedTorusDerivativeTotalOrder,2);
  bound.upper=G.zero;assert.notEqual(sourceTorusDerivativeBound(G,{body,Y,derivativeOrder:0}).upper,G.zero,'cached derivative bounds are not mutable source authorities');
  for(const input of [{body,Y,derivativeOrder:0,upper:0},{body,Y,derivativeOrder:0,periodic:true},{body,Y:[Y[0],Y[0]],derivativeOrder:0}])
    assert.throws(()=>sourceTorusDerivativeBound(G,input),{code:'INVALID_INPUT'});
});

test('finite real pairs satisfy the original N identity with exact divisors and retain the Haar zero mode',()=>{
  const {G,Y,slow}=setup(),pi=exactAuxiliaryPi(G),body=G.add(G.q(5),G.mul(slow,G.sine(G.mul(G.q(2),pi.value,G.add(Y[0],Y[1]))))),
    result=finiteAuxiliaryInverse(G,{body,Y,cutoff:1,derivativeOrders:[0]});
  assert.equal(result.pairCount,4);assert.equal(result.fullLatticeModeCount,8);
  assert.equal(result.zeroMode.value,result.haarMean.C);assert.equal(result.zeroMode.inverted,false);
  assert.equal(result.centeredBody,G.sub(body,result.haarMean.C));assert.equal(result.finiteSumClaimedWholeInverse,false);
  assert.equal(result.omittedTailRetained,true);assert.equal(result.sourceAuthenticated,false);
  for(const row of result.rows){const d=row.divisor,c=row.coefficient,
    direct=G.add(G.mul(G.sub(d.sqrtTwo,G.one),G.derivative(row.value,Y[0])),G.derivative(row.value,Y[1])),
    exact=G.mul(row.sourceProjection,d.value,d.reciprocal),
    check=sourceGraphRationalIdentity(G,G.sub(direct,exact),{atomicNodes:[c.C,c.S,c.sine,c.cosine,c.twoPi,d.sqrtTwo],maxTerms:100000});
    assert.equal(check.pass,true);assert.deepEqual(quadratic(G,G.mul(d.value,d.reciprocal)),[Q(1),Q(0)]);
    assert.equal(row.bothConjugateModesIncluded,true);assert.ok(row.mode.some(k=>k!==0));}
  for(const input of [{body,Y,cutoff:0},{body,Y,cutoff:9},{body,Y,cutoff:1,bound:0},{body,Y,cutoff:1,direction:[1,0]}])
    assert.throws(()=>finiteAuxiliaryInverse(G,input));
});

test('the omitted-square derivative tail keeps the m+4 source derivatives, shell count and exact 1/K decay',()=>{
  const {G,Y,slow}=setup(),pi=exactAuxiliaryPi(G),body=G.mul(slow,G.sine(G.mul(G.q(2),pi.value,G.add(Y[0],Y[1]))));
  for(const derivativeOrder of [0,1,2]){
    const first=auxiliaryInverseTail(G,{body,Y,cutoff:2,derivativeOrder}),next=auxiliaryInverseTail(G,{body,Y,cutoff:4,derivativeOrder});
    assert.equal(first.sourceDerivativeOrder,derivativeOrder+4);assert.equal(first.sourceBound.faces.length,2);
    assert.equal(first.sourceBound.highestGeneratedTorusDerivativeTotalOrder,derivativeOrder+6);
    assert.equal(first.shellCount,'8*n');assert.equal(first.omittedModesSetToZero,false);assert.equal(first.tailTendsToZero,true);
    assert.notEqual(first.upper,G.zero);assert.equal(first.sourceBound.upper,next.sourceBound.upper);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(first.upper,G.mul(G.q(2),next.upper)),{atomicNodes:[first.sourceBound.upper,pi.value]}).pass,true);
    assert.equal(first.sourceAuthenticated,false);assert.ok(G.freeCoordinates(first.upper).has(slow));}
  assert.throws(()=>auxiliaryInverseTail(G,{body,Y,cutoff:1,derivativeOrder:0,sourceNorm:0}),{code:'INVALID_INPUT'});
});
