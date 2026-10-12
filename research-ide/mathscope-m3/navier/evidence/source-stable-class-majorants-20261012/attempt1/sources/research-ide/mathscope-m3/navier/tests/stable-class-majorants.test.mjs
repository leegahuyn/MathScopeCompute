import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {ForcedPulseExpressions,forcedAngularInverse} from '../source-forced-pulse.mjs';
import {originalStableForcedClassPowers,attachGlobalForcedClassOperator,assertGlobalForcedClassOperator}
  from '../source-forced-class-majorants.mjs';
import {originalPrimaryClassDegreeProgram,attachGlobalPrimaryClassOperator,prepareGlobalPrimaryClassOperator,
  assertGlobalPrimaryClassOperator,attachOriginalPrimaryCovarianceIdentity} from '../source-primary-class-majorants.mjs';

const choose=(n,k)=>{let c=1n;for(let j=1;j<=k;j++)c=c*BigInt(n-j+1)/BigInt(j);return c;},
  two=p=>1n<<BigInt(p),forced=Array.from({length:7},(_,order)=>originalStableForcedClassPowers({order})),
  primary=Array.from({length:7},(_,order)=>originalPrimaryClassDegreeProgram({order})),independent=[];
function multiindices(total,dimension){
  if(dimension===1)return [[total]];
  return Array.from({length:total+1},(_,j)=>multiindices(total-j,dimension-1).map(t=>[j,...t])).flat();
}
const derivative=(G,x,v,m)=>{for(let j=0;j<m;j++)x=G.derivative(x,v);return x;};

test('order-zero retains the negative zero-data source, every pressure term and the original class exponents',()=>{
  const f=forced[0],p=primary[0];
  assert.equal(f.recurrence[0].identity,'w(v)=-integral_0^v V_m(v,u)*(B_left*projection*f/P)(u)du.');
  assert.equal(f.w.length,1);assert.equal(f.recurrence[0].integrationLengthPower,1);
  assert.match(f.fullComplexPressureFormula,/n\.K\.t-n_prime\.t\+n\.f/);
  assert.deepEqual(p.exponents,{primary:'1/2',potential:'1',homogeneousPressure:'1',curlRemainder:'1-kappa_s',
    fullCovariance:'1',exactInitialCovarianceRemainder:'2-2*kappa_s',conservativeInitialCovarianceRemainder:'3/2-kappa_s'});
  assert.equal(f.sourceAuthenticated,false);assert.equal(p.sourceAuthenticated,false);
  assert.equal(f.completeN6,false);assert.equal(p.completeN6,false);
});

test('every finite higher request keeps exactly the same lower-order algebra without substituting missing background orders',()=>{
  for(let m=0;m<forced.length;m++){
    const f=forced[m],p=primary[m];
    assert.equal(f.backgroundPrefix.requiredBackgroundDerivativeOrder,m+2);
    assert.equal(f.backgroundPrefix.normalDerivativeOrder,m+1);
    assert.equal(p.derivativeOrders.background,m+3);
    assert.equal(p.derivativeOrders.amplitudeAndTarget,m+1);
    assert.deepEqual(f.w,forced.at(-1).w.slice(0,m+1));
    assert.deepEqual(f.amplitude,forced.at(-1).amplitude.slice(0,m+1));
    assert.deepEqual(f.pressure,forced.at(-1).pressure.slice(0,m+1));
    assert.deepEqual(p.pressure,primary.at(-1).pressure.slice(0,m+1));
    assert.deepEqual(p.weighted.curl,primary.at(-1).weighted.curl.slice(0,m+1));
  }
});

test('all mixed multi-index Leibniz counts equal the full binomial shell and lower solution requests strictly decrease',()=>{
  const f=forced.at(-1);
  for(let m=1;m<=6;m++)for(const alpha of multiindices(m,4)){
    const counts=Array(m+1).fill(0n);
    const visit=(j,beta,weight)=>{
      if(j===alpha.length){counts[beta.reduce((a,b)=>a+b,0)]+=weight;return;}
      for(let k=0;k<=alpha[j];k++)visit(j+1,[...beta,k],weight*choose(alpha[j],k));
    };visit(0,[],1n);
    for(let j=0;j<=m;j++)assert.equal(counts[j],choose(m,j));
    independent.push({kind:'multiindex',alpha,counts:counts.map(String)});
  }
  for(const row of f.recurrence.slice(1)){
    assert.equal(row.slowTerms.length,row.order);assert.equal(row.fastTerms.length,row.order);
    for(const t of row.slowTerms){assert.ok(t.matrixOrder>0);assert.ok(t.solutionOrder<row.order);assert.equal(BigInt(t.binomial),choose(row.order,t.matrixOrder));}
    for(const t of row.fastTerms){assert.ok(t.solutionOrder<row.order);assert.equal(BigInt(t.binomial),choose(row.order-1,t.matrixOrder));}
  }
});

test('independent integer Duhamel and ODE majorants fit the retained W powers without an exponential in S',()=>{
  const f=forced.at(-1),W=3n,L=2n,source=f.forcing.map(two),matrix=f.matrix.map(two),computed=[W*L*source[0]],rows=[];
  assert.ok(computed[0]<=W*two(f.w[0]));
  for(let m=1;m<f.w.length;m++){
    let slow=source[m],fast=source[m-1];
    for(let j=1;j<=m;j++)slow+=choose(m,j)*matrix[j]*computed[m-j];
    slow*=W*L;
    for(let j=0;j<m;j++)fast+=choose(m-1,j)*matrix[j]*computed[m-1-j];
    const actual=slow>fast?slow:fast,bound=W**BigInt(m+1)*two(f.w[m]);
    assert.ok(actual<=bound);computed.push(actual);
    rows.push({order:m,slow:String(slow),fast:String(fast),bound:String(bound),pass:actual<=bound});
  }
  assert.equal(f.polynomialSNotAbsoluteMatrixGronwall,true);
  assert.equal(f.propagatorIndependentOfMaximumHarmonic,true);
  independent.push({kind:'integer-majorant',W:String(W),L:String(L),rows});
});

let propagatorControl;
test('the exact dissipative propagator retains m squared and the original nonpositive diagonal for all tested harmonics',()=>{
  const G=new ActualConvergentExpressions(),v=G.fresh('class_pulse_v'),u=G.fresh('class_pulse_u'),
    lambda=G.q(7,5),d=G.add(G.q(2),G.mul(G.q(3),v)),
    integral=G.add(G.mul(G.q(2),G.sub(v,u)),G.mul(G.q(3,2),G.sub(G.pow(v,2),G.pow(u,2)))),
    base=[G.one,G.exp(G.mul(G.q(-2),lambda,G.sub(v,u)))],rows=[];
  for(const m of [1,2,3,7]){
    const attenuation=G.exp(G.neg(G.mul(G.q(m*m-1),integral))),values=base.map(x=>G.mul(attenuation,x)),
      matrix=[G.neg(G.mul(G.q(m*m-1),d)),G.sub(G.mul(G.q(-2),lambda),G.mul(G.q(m*m-1),d))],
      eq=createFactoredRationalVerifier(G,{maxTerms:40000}),checks=values.map((x,j)=>eq(G.sub(G.derivative(x,v),G.mul(matrix[j],x))));
    assert.ok(checks.every(x=>x.pass));
    const wrong=values.map((x,j)=>eq(G.sub(G.derivative(x,v),G.mul(G.add(matrix[j],d),x))));
    assert.ok(wrong.every(x=>!x.pass));
    rows.push({m,attenuation,values,matrix,checks,wrong});
  }
  propagatorControl={coordinates:{v,u},lambda,d,integral,base,rows,nodes:G.nodes,
    positiveDomain:'0<=u<=v<=L; d=2+3v>=0',sourceAuthenticated:false};
});

test('a pure normal source still has nonzero algebraic pressure when its projected forced velocity vanishes',()=>{
  const G=new ForcedPulseExpressions(new ActualConvergentExpressions()),v=G.fresh('pressure_class_v'),a=G.fresh('pressure_class_a'),
    f=[{real:G.zero,imaginary:G.zero},{real:G.add(a,v),imaginary:G.one},{real:G.zero,imaginary:G.zero}],
    inverse=forcedAngularInverse(G,{variable:v,parameters:[a],directions:[a],length:G.one,n:[G.zero,G.one,G.zero],
      K:Array.from({length:3},()=>[G.zero,G.zero,G.zero]),k:G.q(2),epsilon:G.q(1,7),forcing:f,m:3}),
    equal=createFactoredRationalVerifier(G,{maxTerms:10000});
  assert.ok(inverse.velocity.every(x=>x.real===G.zero&&x.imaginary===G.zero));
  assert.equal(equal(G.sub(inverse.pressure.real,G.q(-1,6))).pass,true);
  assert.equal(equal(G.sub(inverse.pressure.imaginary,G.div(G.add(a,v),G.q(6)))).pass,true);
  assert.notEqual(inverse.pressure.imaginary,G.zero);
  assert.equal(inverse.scope.sourceAuthenticated,false);
});

test('the common-reference input includes the actual chart pullback and never loses a local S to the b factor',()=>{
  for(const f of forced){
    assert.equal(f.inputNormalization.referenceS,'S_ref=ell_ref^2');
    assert.equal(f.inputNormalization.completePullbackIncludedInInput,true);
    assert.equal(f.inputNormalization.localInputNormAutomaticallyConverted,false);
    assert.match(f.inputNormalization.neighboringInputConstant,/4\^b/);
    for(const r of f.mapped)assert.equal(r.amplitudePower,Math.max(...f.amplitude.slice(0,r.order+1))+3*r.order);
  }
  for(const ell of [8n,9n,17n,101n])for(const delta of [-2n,-1n,0n,1n,2n])for(const b of [0n,1n,2n,7n]){
    const actual=(ell+delta)**(2n*b),converted=4n**b*ell**(2n*b);
    assert.ok(actual<=converted);
    if(delta>0n&&b>0n)assert.ok(actual>ell**(2n*b),'Omitting the source-neighbor input factor must fail.');
  }
});

test('the exact angular covariance keeps every remainder square and its half; a nonzero omitted square is detected',()=>{
  const G=new ActualConvergentExpressions(),a=[G.q(2,3),G.q(-5,7),G.q(11,13)],b=[G.q(3,5),G.q(7,11),G.q(-2,9)],
    C={mul:(x,y)=>({real:G.sub(G.mul(x.real,y.real),G.mul(x.imaginary,y.imaginary)),
      imaginary:G.add(G.mul(x.real,y.imaginary),G.mul(x.imaginary,y.real))})},
    positive=a.map((x,j)=>({real:G.mul(G.q(1,2),x),imaginary:G.mul(G.q(1,2),b[j])})),
    negative=positive.map(x=>({real:x.real,imaginary:G.neg(x.imaginary)})),eq=createFactoredRationalVerifier(G,{maxTerms:10000}),rows=[];
  for(let j=0;j<3;j++)for(let k=j;k<3;k++){
    const first=C.mul(positive[j],negative[k]),second=C.mul(negative[j],positive[k]),
      zeroMode=G.add(first.real,second.real),expected=G.mul(G.q(1,2),G.add(G.mul(a[j],a[k]),G.mul(b[j],b[k]))),
      omission=G.sub(zeroMode,G.mul(G.q(1,2),a[j],a[k]));
    assert.equal(eq(G.sub(zeroMode,expected)).pass,true);assert.equal(eq(omission).pass,false);
    assert.equal(eq(G.sub(G.add(first.imaginary,second.imaginary),G.zero)).pass,true);
    rows.push({j,k,zeroMode,expected,omission});
  }
  independent.push({kind:'angular-covariance',a,b,rows,nodes:G.nodes});
});

test('private source attachments reject fake norm, current, forced and caller-completion inputs',()=>{
  for(const call of [()=>attachGlobalPrimaryClassOperator({},{}),()=>prepareGlobalPrimaryClassOperator({}),
    ()=>attachOriginalPrimaryCovarianceIdentity({}),()=>assertGlobalPrimaryClassOperator({}),
    ()=>attachGlobalForcedClassOperator({}),()=>assertGlobalForcedClassOperator({})])
    assert.throws(call,{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const input of [{complete:true},{sourceAuthenticated:true},{norm:1},{qBig:0.01}]){
    assert.throws(()=>originalStableForcedClassPowers(input),{code:'INVALID_INPUT'});
    assert.throws(()=>originalPrimaryClassDegreeProgram(input),{code:'INVALID_INPUT'});
  }
  assert.throws(()=>originalStableForcedClassPowers({order:100,maxWork:10}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>originalPrimaryClassDegreeProgram({order:100,maxWork:10}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>originalPrimaryClassDegreeProgram({order:2,targetPoles:[0]}),{code:'INVALID_INPUT'});
});

test('the retained finite recurrence artifact distinguishes generic algebra from unexecuted actual class attachments',()=>{
  const artifact={schema:'MathScope.N6.ObservedStableClassMajorantAlgebra/1',forced,primary,independent,propagatorControl,
    actualPrivatePrimaryNormAttachmentExecuted:false,actualPrivateForcedClassAttachmentExecuted:false,
    actualCompleteInitialClassCertified:false,allFiniteStagesConstructed:false,completeN6:false};
  assert.equal(artifact.forced.length,7);assert.equal(artifact.primary.length,7);
  assert.equal(artifact.propagatorControl.rows.length,4);
  if(process.env.MATHSCOPE_STABLE_CLASS_ARTIFACT)
    writeFileSync(process.env.MATHSCOPE_STABLE_CLASS_ARTIFACT,JSON.stringify(artifact,null,2)+'\n');
});
