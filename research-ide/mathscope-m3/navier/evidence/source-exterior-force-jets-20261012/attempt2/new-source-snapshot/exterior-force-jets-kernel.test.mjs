import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {exteriorTerminalPolynomials,exactExteriorTerminalJetKernel,prepareActualExteriorForceJets,assertActualExteriorForceJets} from '../source-exterior-force-jets.mjs';

const factorial=n=>{let x=1n;for(let j=2;j<=n;j++)x*=BigInt(j);return x;};
const polynomial=(row,h)=>row.reduceRight((value,coefficient)=>value*h+BigInt(coefficient),0n);
const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes:[G.parameter('h')],maxTerms:180000}).pass;
function fixture(){
  const G=new ActualConvergentExpressions(),r=G.fresh('positive_radius'),s=G.fresh('cutoff_argument'),
    q=(n,d=1)=>G.q(n,d),u=G.sub(G.mul(q(2),s),G.one),a=G.exp(G.neg(G.inv(u))),b=G.exp(G.neg(G.inv(G.sub(G.one,u)))),
    chi=G.choose(s,q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero),
    cutoff=G.substitute(chi,s,G.mul(q(2),G.pow(r,2))),h=G.parameter('h'),cInfinity=q(7,3);
  return {G,q,r,s,chi,cutoff,h,cInfinity};
}

test('finite heat coefficients agree with independent Gamma ratios at positive integer parameters',()=>{
  assert.deepEqual(exteriorTerminalPolynomials(0).velocityPolynomial,['1']);
  assert.deepEqual(exteriorTerminalPolynomials(1).velocityPolynomial,['0','1','1']);
  assert.deepEqual(exteriorTerminalPolynomials(2).velocityPolynomial,['0','2','5','4','1']);
  for(let j=0;j<=12;j++)for(const h of [1,2,3,7]){
    const row=exteriorTerminalPolynomials(j),gammaRatio=factorial(h+j-1)/factorial(h-1)*factorial(h+j)/factorial(h);
    assert.equal(polynomial(row.velocityPolynomial,BigInt(h)),gammaRatio);
    let independentSquare=0n;
    for(let k=0;k<=j;k++)independentSquare+=factorial(j)/(factorial(k)*factorial(j-k))*
      (factorial(h+k-1)/factorial(h-1)*factorial(h+k)/factorial(h))*
      (factorial(h+j-k-1)/factorial(h-1)*factorial(h+j-k)/factorial(h));
    assert.equal(polynomial(row.squarePolynomial,BigInt(h)),independentSquare);
  }
  assert.throws(()=>exteriorTerminalPolynomials(13),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>exteriorTerminalPolynomials(-1),{code:'RESOURCE_LIMIT'});
});

test('the actual cutoff definition has exact transition jets and constant flat branches',()=>{
  const {G,q,s,chi}=fixture();let derivative=chi;
  for(let j=0;j<=4;j++){
    for(const [point,value] of [[q(0),j?G.zero:G.one],[q(1,2),j?G.zero:G.one],[q(1),G.zero],[q(2),G.zero]])
      assert.equal(G.substitute(derivative,s,point),value);
    if(j<=2){const expected=[q(1,2),q(-4),G.zero][j],mid=G.substitute(derivative,s,q(3,4));
      assert.equal(equal(G,mid,expected),true);
      assert.equal(equal(G,mid,j===1?q(-2):G.add(expected,G.one)),false);
    }
    derivative=G.derivative(derivative,s);
  }
});

test('source-shaped exterior kernels retain the full radial pressure derivative and Poisson identity',()=>{
  const f=fixture(),{G,r,h,cInfinity,cutoff}=f;
  for(const order of [0,1,2,4]){
    const out=exactExteriorTerminalJetKernel(G,{h,cInfinity,radius:r,cutoff,order});
    assert.ok(Object.values(out.checks).every(row=>row.pass));assert.equal(out.sourceAuthenticated,false);
    assert.equal(out.expressions.forceAxial,G.zero);
    assert.equal(equal(G,G.add(out.expressions.lapPressure,out.expressions.divDivVelocitySquare),out.expressions.divForce),true);
    assert.equal(equal(G,out.expressions.divForce,G.zero),false);
  }
});

test('wrong pressure sign, pressure gauge after cutoff, and deleted cutoff pressure term are detected',()=>{
  const f=fixture(),{G,q,r,h,cInfinity,cutoff}=f,{expressions:x}=exactExteriorTerminalJetKernel(G,{h,cInfinity,radius:r,cutoff,order:2}),
    dr=p=>G.derivative(p,r),lap=p=>G.add(dr(dr(p)),G.div(dr(p),r)),
    wrongSign=G.neg(x.localizedPressure),wrongGauge=G.mul(cutoff,G.add(x.pressure,q(5))),
    droppedRadial=G.div(G.mul(cutoff,G.sub(G.one,cutoff),x.square),r),
    droppedDivergence=G.div(dr(G.mul(r,droppedRadial)),r);
  assert.equal(equal(G,G.add(lap(wrongSign),x.divDivVelocitySquare),x.divForce),false);
  assert.equal(equal(G,G.add(lap(wrongGauge),x.divDivVelocitySquare),x.divForce),false);
  assert.equal(equal(G,G.add(x.lapPressure,x.divDivVelocitySquare),droppedDivergence),false);
  assert.equal(equal(G,dr(G.neg(x.pressure)),G.div(x.square,r)),false);
});

test('dropping radial cutoff differentiation or the cylindrical Laplacian term changes the actual force',()=>{
  const f=fixture(),{G,q,r,h,cInfinity,cutoff}=f,{expressions:x}=exactExteriorTerminalJetKernel(G,{h,cInfinity,radius:r,cutoff,order:0}),
    omittedProduct=G.neg(G.mul(x.lapC,x.K)),omittedCylindrical=G.neg(G.add(G.mul(q(2),x.cr,x.Kr),G.mul(x.crr,x.K)));
  assert.equal(equal(G,x.forceTheta,omittedProduct),false);assert.equal(equal(G,x.forceTheta,omittedCylindrical),false);
  assert.equal(equal(G,x.thetaNormalized,G.zero),false);
  assert.equal(G.substitute(x.thetaNormalized,h,G.zero),G.zero);
  assert.equal(equal(G,G.add(x.lapPressureNormalized,x.divDivNormalized),x.divergenceNormalized),true);
});

test('untrusted parameters and kernel records cannot acquire original-source authority',async()=>{
  for(const input of [{h:0},{cInfinity:1},{orders:[]},{force:[]},{proof:true}])
    await assert.rejects(prepareActualExteriorForceJets(input),{code:'INVALID_INPUT'});
  await assert.rejects(prepareActualExteriorForceJets({}, {localization:{}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const f=fixture(),out=exactExteriorTerminalJetKernel(f.G,{h:f.h,cInfinity:f.cInfinity,radius:f.r,cutoff:f.cutoff,order:0});
  assert.throws(()=>assertActualExteriorForceJets(out),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
