import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {exactCylindricalHarmonicCurl,normalizeEqualPiecewiseBranches} from '../actual-full-curl.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

function fixture(){
  const G=new ActualConvergentExpressions(),R=G.fresh('curl_R'),Z=G.fresh('curl_Z'),xi=G.fresh('curl_xi');
  const epsilon=G.q(1,3),radialFast=G.pow(R,2),k=G.q(3),v=G.q(1,4),p=G.q(2),pz=G.q(1,5),x0=G.q(2,3);
  const H=G.add(G.mul(G.pow(R,2),Z),G.pow(Z,2));
  const normal=[G.sub(x0,G.mul(v,G.derivative(H,R))),G.div(p,R),G.sub(pz,G.mul(epsilon,v,G.derivative(H,Z)))];
  const potential=[G.add(G.mul(R,Z),G.pow(xi,2)),G.add(G.mul(G.pow(R,2),Z),G.mul(xi,Z),G.one),G.add(G.mul(R,G.pow(Z,2)),G.mul(R,xi))];
  const input={R,Z,xi,epsilon,radialFast,k,normal,potential};
  return {G,input,R,Z,xi,p,pz,x0,H,v};
}
const identity=(G,r)=>sourceGraphRationalIdentity(G,r,{maxTerms:40000}).pass;
function evaluate(G,root,coordinates){
  const cache=new Map();const ev=id=>{if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let value;
    if(op==='rational')value=Number(args[0])/Number(args[1]);else if(op==='coordinate')value=coordinates[args[0]];
    else if(op==='add')value=ev(args[0])+ev(args[1]);else if(op==='multiply')value=ev(args[0])*ev(args[1]);
    else if(op==='inverse')value=1/ev(args[0]);else if(op==='integer_power')value=ev(args[0])**args[1];else throw Error(op);
    assert.ok(Number.isFinite(value));cache.set(id,value);return value;};return ev(root);
}

test('literal full cylindrical curl has exact zero complex divergence with all spatial chains',()=>{
  const {G,input}=fixture(),r=exactCylindricalHarmonicCurl(G,input);
  assert.ok(r.divergence.checks.every(x=>x.pass));
  assert.ok(identity(G,r.divergence.real));assert.ok(identity(G,r.divergence.imaginary));
  assert.equal(r.sourceAuthenticated,false);assert.equal(r.globalPhysicalResidualProved,false);
  assert.notEqual(G.derivative(input.potential[1],input.xi),G.zero);
});

test('deleting the cylindrical C_theta/R term is rejected by independent divergence',()=>{
  const {G,input}=fixture(),r=exactCylindricalHarmonicCurl(G,input);
  const omitted=G.div(input.potential[1],input.R),divergenceWithoutConnection=G.sub(r.divergence.imaginary,G.mul(input.epsilon,G.derivative(omitted,input.Z)));
  assert.equal(identity(G,divergenceWithoutConnection),false);
});

test('transverse chain changes the actual curl; it cannot be discarded as a frozen cutoff',()=>{
  const {G,input}=fixture(),full=exactCylindricalHarmonicCurl(G,input),omitted=exactCylindricalHarmonicCurl(G,{...input,radialFast:G.zero});
  assert.equal(identity(G,G.sub(full.remainder[1],omitted.remainder[1])),false);
  assert.equal(identity(G,G.sub(full.remainder[2],omitted.remainder[2])),false);
});

test('real full harmonic curl agrees with an independent Cartesian finite difference',()=>{
  const {G,input,R,Z,xi}=fixture(),r=exactCylindricalHarmonicCurl(G,input);
  const position=[1.13,.47,.83],baseXi=-.21;
  const coord=point=>{const radius=Math.hypot(point[0],point[1]),z=point[2]/3;return {[G.nodes[R].args[0]]:radius,[G.nodes[Z].args[0]]:z,[G.nodes[xi].args[0]]:baseXi+radius**3/3};};
  const phase=point=>{const radius=Math.hypot(point[0],point[1]),z=point[2]/3;return 3*(2*Math.atan2(point[1],point[0])+point[2]/5+2*radius/3-(radius**2*z+z*z)/4);};
  const cartesian=(c,point)=>{const theta=Math.atan2(point[1],point[0]),co=Math.cos(theta),si=Math.sin(theta);return [c[0]*co-c[1]*si,c[0]*si+c[1]*co,c[2]];};
  const potential=point=>cartesian(input.potential.map(x=>-evaluate(G,x,coord(point))*Math.sin(phase(point))),point);
  const expected=cartesian(r.fullCoefficient.map(x=>evaluate(G,x.real,coord(position))*Math.cos(phase(position))-evaluate(G,x.imaginary,coord(position))*Math.sin(phase(position))),position);
  const errors=[];
  for(const h of [1e-4,3e-5]){
    const derivatives=[0,1,2].map(axis=>{const plus=[...position],minus=[...position];plus[axis]+=h;minus[axis]-=h;const p=potential(plus),m=potential(minus);return p.map((x,j)=>(x-m[j])/(2*h));});
    const observed=[derivatives[1][2]-derivatives[2][1],derivatives[2][0]-derivatives[0][2],derivatives[0][1]-derivatives[1][0]];
    errors.push(Math.max(...observed.map((x,j)=>Math.abs(x-expected[j]))));
  }
  assert.ok(errors[1]<2e-6,JSON.stringify(errors));assert.ok(errors[1]<errors[0]/3,JSON.stringify(errors));
});

test('non-gradient normal and supplied derivative shortcuts fail explicitly',()=>{
  const {G,input}=fixture();
  assert.throws(()=>exactCylindricalHarmonicCurl(G,{...input,normal:[...input.normal.slice(0,2),G.add(input.normal[2],input.R)]}),{code:'INTERNAL_VALIDATION'});
  assert.throws(()=>exactCylindricalHarmonicCurl(G,{...input,radialDerivatives:[0,0,0]}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactCylindricalHarmonicCurl(G,{...input,epsilon:input.R}),{code:'INVALID_INPUT'});
});

test('inherited all-zero carrier branches normalize by exact equality, while an active branch is retained',()=>{
  const {G,input}=fixture(),label=G.fresh('frozen_rounding_label');
  const zero=G.choose(label,G.zero,G.one,G.zero,G.zero,G.zero),active=G.choose(label,G.zero,G.one,G.zero,G.one,G.zero);
  assert.notEqual(zero,G.zero);
  const before=JSON.stringify(G.nodes),normalized=normalizeEqualPiecewiseBranches(G,zero);
  assert.equal(normalized.normalized,G.zero);assert.equal(normalized.identities.length,1);
  assert.equal(JSON.stringify(G.nodes),before);
  assert.equal(normalizeEqualPiecewiseBranches(G,active).normalized,active);
  const equivalent={...input,normal:[...input.normal.slice(0,2),G.add(input.normal[2],G.mul(zero,input.R))]};
  const curl=exactCylindricalHarmonicCurl(G,equivalent);
  assert.ok(curl.divergence.checks.every(x=>x.pass));
  assert.ok(curl.divergence.checks.some(x=>x.equalBranchNormalization.length>0));
  assert.throws(()=>exactCylindricalHarmonicCurl(G,{...input,normal:[...input.normal.slice(0,2),G.add(input.normal[2],G.mul(active,input.R))]}),{code:'INTERNAL_VALIDATION'});
});
