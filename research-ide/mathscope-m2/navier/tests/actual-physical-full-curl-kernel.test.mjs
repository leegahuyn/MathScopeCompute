import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {exactScalarCutoffHarmonicCurl,actualPhysicalWaveExponentAudit,assertActualPhysicalFullCurlProgram,fixedLabelSourcePartitionFactor} from '../actual-physical-full-curl.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

function fixture(){
  const G=new ActualConvergentExpressions(),R=G.fresh('physical_R'),Z=G.fresh('physical_Z'),xi=G.fresh('physical_xi');
  const epsilon=G.q(1,3),radialFast=G.pow(R,2),k=G.q(3),H=G.add(G.mul(G.pow(R,2),Z),G.pow(Z,2));
  const normal=[G.sub(G.q(2,3),G.mul(G.q(1,4),G.derivative(H,R))),G.div(G.q(2),R),G.sub(G.q(1,5),G.mul(epsilon,G.q(1,4),G.derivative(H,Z)))];
  const potential=[G.add(G.mul(R,Z),G.pow(xi,2)),G.add(G.mul(G.pow(R,2),Z),G.mul(xi,Z),G.one),G.add(G.mul(R,G.pow(Z,2)),G.mul(R,xi))];
  const cutoff=G.add(G.one,G.mul(R,Z),G.pow(R,2),G.mul(xi,Z));
  return {G,R,Z,xi,input:{R,Z,xi,epsilon,radialFast,k,normal,potential,cutoff}};
}
const zero=(G,x)=>sourceGraphRationalIdentity(G,x,{maxTerms:40000}).pass;

test('fixed-label source cutoff equals the whole integer family and differentiates without integer reselection',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('fixed_source_offset'),f=fixedLabelSourcePartitionFactor(G,x);
  const first=G.derivative(f.value,x),second=G.derivative(first,x);
  const sigma=t=>t<=0?0:t>=1?1:1/(1+Math.exp(1/t**2-1/(1-t)**2));
  const sigmaPrime=t=>t<=0||t>=1?0:sigma(t)*(1-sigma(t))*(2/t**3+2/(1-t)**3);
  const sigmaSecond=t=>t<=0||t>=1?0:sigma(t)*(1-sigma(t))*((1-2*sigma(t))*(2/t**3+2/(1-t)**3)**2-6/t**4+6/(1-t)**4);
  const bump=t=>Math.abs(t)<=.25?1:Math.abs(t)>=.75?0:sigma(1.5-2*Math.abs(t));
  const original=t=>bump(t)/Math.sqrt(Array.from({length:13},(_,j)=>bump(t-(j-6))**2).reduce((a,b)=>a+b,0));
  const evaluate=(root,value)=>{const cache=new Map(),ev=id=>{if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let result;
    if(op==='rational')result=Number(args[0])/Number(args[1]);else if(op==='coordinate')result=value;
    else if(op==='add')result=ev(args[0])+ev(args[1]);else if(op==='multiply')result=ev(args[0])*ev(args[1]);
    else if(op==='integer_power')result=ev(args[0])**args[1];else if(op==='inverse')result=1/ev(args[0]);
    else if(op==='sqrt_positive')result=Math.sqrt(ev(args[0]));
    else if(op==='source_step_derivative')result=[sigma,sigmaPrime,sigmaSecond][args[1]](ev(args[0]));
    else if(op==='smooth_piecewise'){const at=ev(args[0]);result=ev(at<=ev(args[1])?args[3]:at>=ev(args[2])?args[5]:args[4]);}
    else throw Error('Unexpected fixed-label operation '+op);cache.set(id,result);return result;};return ev(root);};
  for(const value of [-3,-.75,-.51,-.5,-.49,-.25,0,.25,.49,.5,.51,.75,3]){
    assert.ok(Math.abs(evaluate(f.value,value)-original(value))<2e-14,String(value));
    assert.ok(Number.isFinite(evaluate(first,value)));assert.ok(Number.isFinite(evaluate(second,value)));
  }
  for(const value of [-.51,-.5,-.49,.49,.5,.51]){
    const step=1e-6,reference=(original(value+step)-original(value-step))/(2*step);
    assert.ok(Math.abs(evaluate(first,value)-reference)<5e-6,String(value));
  }
  assert.ok(Math.abs(evaluate(f.value,.5)-1/Math.sqrt(2))<1e-14);
  assert.equal(f.derivativesOfIntegerReselectionUsed,false);assert.equal(f.zeroGuardBeforeDenominatorEvaluation,true);
});

test('product is differentiated before the complete harmonic curl, with every cutoff derivative',()=>{
  const {G,input}=fixture(),r=exactScalarCutoffHarmonicCurl(G,input);
  assert.ok(r.checks.every(c=>c.pass));assert.ok(r.full.divergence.checks.every(c=>c.pass));
  assert.ok(zero(G,r.full.divergence.real));assert.ok(zero(G,r.full.divergence.imaginary));
  assert.ok(r.commutator.every(x=>!zero(G,x)));
  assert.notEqual(r.cutoffR,G.derivative(input.cutoff,input.R),'the auxiliary radial derivative is retained');
  assert.equal(r.sourceAuthenticated,false);assert.equal(r.globalPhysicalResidualProved,false);
});

test('multiplying an already curled velocity omits nonzero terms and destroys divergence',()=>{
  const {G,input}=fixture(),r=exactScalarCutoffHarmonicCurl(G,input),{R,Z,xi,epsilon,radialFast}=input;
  const Dr=x=>G.add(G.derivative(x,R),G.mul(radialFast,G.derivative(x,xi))),Dz=x=>G.mul(epsilon,G.derivative(x,Z));
  const omitted=r.base.remainder.map(x=>G.mul(input.cutoff,x));
  assert.ok(omitted.some((x,j)=>!zero(G,G.sub(r.full.remainder[j],x))));
  const divergenceImag=G.add(Dr(omitted[0]),G.div(omitted[0],R),Dz(omitted[2]),
    G.mul(input.k,G.add(...input.normal.map((x,j)=>G.mul(x,r.full.leading[j])))));
  assert.equal(zero(G,divergenceImag),false);
});

test('a retained constant cutoff has zero commutator; a radial or axial one does not',()=>{
  const {G,input}=fixture(),constant=exactScalarCutoffHarmonicCurl(G,{...input,cutoff:G.q(7,5)});
  assert.ok(constant.commutator.every(x=>zero(G,x)));
  for(const cutoff of [input.R,input.Z]){
    const value=exactScalarCutoffHarmonicCurl(G,{...input,cutoff});
    assert.ok(value.commutator.some(x=>!zero(G,x)));
  }
});

test('actual physical power identities keep h, viscosity epsilon and pressure scaling',()=>{
  const r=actualPhysicalWaveExponentAudit();assert.equal(r.pass,true);assert.equal(r.rows.length,7);
  assert.ok(r.rows.every(x=>x.difference.every(v=>v==='0')));
  assert.deepEqual(r.rows.find(x=>x.id==='viscosity-normalization').right,['0','1']);
  assert.equal(r.hReplacedByZero,false);
});

test('independent Cartesian curl of the product potential agrees with the full coefficient',()=>{
  const {G,input}=fixture(),result=exactScalarCutoffHarmonicCurl(G,input),point=[1.13,.47,.83],baseXi=-.21;
  const scalar=(id,values)=>{const seen=new Map();const ev=n=>{if(seen.has(n))return seen.get(n);const a=G.nodes[n];let x;
    if(a.op==='rational')x=Number(a.args[0])/Number(a.args[1]);else if(a.op==='coordinate')x=values[a.args[0]];
    else if(a.op==='add')x=ev(a.args[0])+ev(a.args[1]);else if(a.op==='multiply')x=ev(a.args[0])*ev(a.args[1]);
    else if(a.op==='inverse')x=1/ev(a.args[0]);else if(a.op==='integer_power')x=ev(a.args[0])**a.args[1];else throw Error(a.op);
    seen.set(n,x);return x;};return ev(id);};
  const data=x=>{const R=Math.hypot(x[0],x[1]),Z=x[2]/3,xi=baseXi+R**3/3,theta=Math.atan2(x[1],x[0]);
    return {R,Z,xi,theta,phase:3*(2*theta+x[2]/5+2*R/3-(R*R*Z+Z*Z)/4)};};
  const cart=(c,theta)=>[c[0]*Math.cos(theta)-c[1]*Math.sin(theta),c[0]*Math.sin(theta)+c[1]*Math.cos(theta),c[2]];
  // This value-only expression does not use the graph cutoff, derivatives,
  // remainder or cylindrical curl formula.
  const referencePotential=x=>{const {R,Z,xi,theta,phase}=data(x),eta=1+R*Z+R*R+xi*Z;
    return cart([R*Z+xi*xi,R*R*Z+xi*Z+1,R*Z*Z+R*xi].map(v=>-eta*v*Math.sin(phase)),theta);};
  const d=data(point),coords={[G.nodes[input.R].args[0]]:d.R,[G.nodes[input.Z].args[0]]:d.Z,[G.nodes[input.xi].args[0]]:d.xi};
  const expected=cart(result.full.fullCoefficient.map(x=>scalar(x.real,coords)*Math.cos(d.phase)-scalar(x.imaginary,coords)*Math.sin(d.phase)),d.theta),errors=[];
  for(const h of [1e-4,3e-5]){
    const gradients=[0,1,2].map(k=>{const a=[...point],b=[...point];a[k]+=h;b[k]-=h;const pa=referencePotential(a),pb=referencePotential(b);return pa.map((x,j)=>(x-pb[j])/(2*h));});
    const observed=[gradients[1][2]-gradients[2][1],gradients[2][0]-gradients[0][2],gradients[0][1]-gradients[1][0]];
    errors.push(Math.max(...observed.map((x,j)=>Math.abs(x-expected[j]))));
  }
  assert.ok(errors[1]<1e-5,JSON.stringify(errors));assert.ok(errors[1]<errors[0]/3,JSON.stringify(errors));
});

test('supplied derivative shortcuts and copied source receipts are rejected',()=>{
  const {G,input}=fixture();
  assert.throws(()=>exactScalarCutoffHarmonicCurl(G,{...input,cutoffR:G.zero}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactScalarCutoffHarmonicCurl(G,{...input,cutoff:-1}),{code:'INVALID_INPUT'});
  assert.throws(()=>assertActualPhysicalFullCurlProgram({G,scope:{actualFixedLabelPhysicalCurlConstructed:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
