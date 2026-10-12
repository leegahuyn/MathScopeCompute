import test from 'node:test';
import assert from 'node:assert/strict';
import {createPulseJetAlgebra,evaluateSourcePulseCurl,exactSourcePulseCurlIdentities,evaluateSourcePulseCurlProbe,evaluateSourcePulseCurlProbeCartesian,sourcePulseCurlAudit} from '../source-pulse-curl.mjs';

const error=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const near=(a,b,tolerance=1e-10)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} is not within ${tolerance} of ${b}`);

// Independent value-only implementation of the prescribed smooth coefficient
// function and its PHYSICAL vector potential. It does not use the jet algebra,
// its curl, its remainder formula, or its cylindrical differentiation.
function referencePotential(point,{ell=8,Rref=1.44,xiRef=.13,v=.88,wrongScale=false,omitFastMap=false}={}){
  const h=1/128,Q=2**(-ell),A=.5+h,D=.5-h,eps=Q**h,k=Math.ceil(eps**(-.5)),p=1/k,pz=.37,x0=.28,Mi=.31,dr=1.07;
  const R=Math.hypot(point[0],point[1])/Math.sqrt(Q),Z=point[2]/Q**D,theta=Math.atan2(point[1],point[0]),xi=xiRef+(omitFastMap?0:Mi*(R**dr-Rref**dr));
  const F=.6+.12*R+.05*Z+.03*R*Z,G=-.3-.5*R+.04*Z+.02*R*R,FR=.12+.03*Z,FZ=.05+.03*R,GR=-.5+.04*R,GZ=.04;
  const n=[x0-v*(p*FR+pz*GR),p/R,pz-eps*v*(p*FZ+pz*GZ)];
  const bump=(x,center,width)=>{const s=(x-center)/width;return Math.abs(s)>=1?0:Math.exp(1-1/(1-s*s));};
  const cutoff=bump(R,1.3,.65)*bump(Z,.2,.9)*bump(xi,.05,.45)*bump(v,1,.95);
  const seed=[[1+.15*Z,.07+.02*R],[-.3+.2*R+.08*xi,.03+.01*Z],[.7+.1*R*Z,-.04+.02*xi]];
  const cross=(n,s)=>[0,1,2].map(i=>{const j=(i+1)%3,l=(i+2)%3;return [n[j]*s[l][0]-n[l]*s[j][0],n[j]*s[l][1]-n[l]*s[j][1]];});
  const t=cross(n,seed).map(z=>z.map(x=>cutoff*x)),nn=n.reduce((s,x)=>s+x*x,0),C=cross(n,t).map(z=>[-z[1]/(k*nn),z[0]/(k*nn)]),phase=k*(p*theta+pz*Z/eps+x0*R-v*(p*F+pz*G)),scale=wrongScale?Q**(-A):Q**(.5-A),cyl=C.map(z=>scale*(z[0]*Math.cos(phase)-z[1]*Math.sin(phase)));
  return [cyl[0]*Math.cos(theta)-cyl[1]*Math.sin(theta),cyl[0]*Math.sin(theta)+cyl[1]*Math.cos(theta),cyl[2]];
}
function cartesianCurl(p,step,options={}){
  const d=Array.from({length:3},(_,axis)=>{const left=p.slice(),right=p.slice();left[axis]-=step;right[axis]+=step;const a=referencePotential(left,options),b=referencePotential(right,options);return a.map((x,i)=>(b[i]-x)/(2*step));});
  return [d[1][2]-d[2][1],d[2][0]-d[0][2],d[0][1]-d[1][0]];
}
function pointFor(ell=8){const Q=2**(-ell),D=.5-1/128,R=1.44,Z=.31,theta=.43;return [Math.sqrt(Q)*R*Math.cos(theta),Math.sqrt(Q)*R*Math.sin(theta),Q**D*Z];}

test('source 7.37–7.39 cancel as exact differential polynomials, with frame negative control',()=>{
  const good=exactSourcePulseCurlIdentities(),bad=exactSourcePulseCurlIdentities({omitRadialFrame:true});
  assert.equal(good.pass,true);assert.deepEqual(good.divergenceResidual,[]);assert.deepEqual(good.tripleProductResidual,[[],[],[]]);
  assert.equal(bad.divergenceZero,false);assert.ok(bad.divergenceResidual.some(x=>x.monomial.includes('ir')));
  const e=good.physicalExponentIdentity;assert.deepEqual(e.potential.map((x,i)=>x+e.curlDerivative[i]),e.velocity);
});

test('third-order mixed jets preserve derivative factorials and reject unknown derivative order',()=>{
  const J=createPulseJetAlgebra({R:2,Z:3,Y1:.5,Y2:.25}),{R,Z,Y1}=J.variables;
  const f=J.add(J.mul(J.mul(R,R),Z),J.mul(R,J.mul(Y1,Y1)));
  near(J.value(f),12.5);near(J.value(J.derivative(J.derivative(f,'R'),'Z')),4);
  near(J.value(J.derivative(J.derivative(J.derivative(f,'R'),'R'),'Z')),2);
  near(J.value(J.derivative(J.derivative(J.derivative(f,'Y1'),'Y1'),'R')),2);
  assert.throws(()=>J.derivative(J.derivative(J.derivative(J.derivative(f,'R'),'R'),'Z'),'R'),/exceeds/);
  const imported=J.fromDerivatives(2,{'2,0,1,0':12});
  near(J.value(J.derivative(J.derivative(J.derivative(imported,'R'),'R'),'Y1')),12);
});

test('jet source normal retains every original 7.4 radial and axial phase term',()=>{
  const r=evaluateSourcePulseCurlProbe(),R=1.44,Z=.31,v=.88,{p,pz,x0,epsilon}=r.parameters;
  const expected=[x0-v*(p*(.12+.03*Z)+pz*(-.5+.04*R)),p/R,pz-epsilon*v*(p*(.05+.03*R)+pz*.04)];
  assert.ok(error(r.value.normal,expected)<1e-14);
  assert.ok(Math.abs(expected[2]-pz)>.02,'the omitted axial derivative is a nontrivial negative');
  assert.equal(r.jet.potentialOrder,2);assert.equal(r.jet.remainderOrder,1);
  assert.ok(Math.hypot(...r.diagnostics.fullDivergence)<1e-12);
  assert.ok(Math.hypot(...r.diagnostics.omittedRemainderDivergence)>.1);
});

test('independent physical Cartesian curl of source C_m converges to complete jet velocity',()=>{
  for(const ell of [6,8,10]){
    const p=pointFor(ell),r=evaluateSourcePulseCurlProbeCartesian(p,{ell}),Q=2**(-ell),steps=[.02,.01,.005].map(x=>x*Math.sqrt(Q)),errors=steps.map(step=>error(cartesianCurl(p,step,{ell}),r.physical.realVelocity)*Q**r.physical.A);
    assert.ok(errors[1]<errors[0]/3.8,JSON.stringify(errors));assert.ok(errors[2]<errors[1]/3.8,JSON.stringify(errors));
    assert.ok(error(referencePotential(p,{ell}),r.physical.realPotential)<1e-12);
    const wrong=cartesianCurl(p,steps[2],{ell,wrongScale:true});
    assert.ok(error(wrong,r.physical.realVelocity)>10,'missing Q^(1/2) changes the physical field');
  }
});

test('independent physical phase evaluation detects omission of the fast auxiliary radial map',()=>{
  const p=pointFor(),r=evaluateSourcePulseCurlProbeCartesian(p),step=Math.sqrt(2**(-8))*.0005;
  const right=cartesianCurl(p,step),wrong=cartesianCurl(p,step,{omitFastMap:true});
  assert.ok(error(right,r.physical.realVelocity)<.001);
  assert.ok(error(wrong,r.physical.realVelocity)>.1);
});

test('full physical divergence has second-order refinement while omitted r_m stays nonzero',()=>{
  const audit=sourcePulseCurlAudit();assert.equal(audit.pass,true);
  const rows=audit.convergence;
  assert.ok(Math.abs(rows[1].normalizedFullDivergence)<Math.abs(rows[0].normalizedFullDivergence)/3.8);
  assert.ok(Math.abs(rows[2].normalizedFullDivergence)<Math.abs(rows[1].normalizedFullDivergence)/3.8);
  assert.ok(Math.abs(rows[2].normalizedOmittedDivergence)>.06);
});

test('complex conjugate modes reconstruct the same real potential and velocity, with angular half',()=>{
  const a=evaluateSourcePulseCurlProbe({m:3}),b=evaluateSourcePulseCurlProbe({m:-3});
  for(const key of ['t','Cm','remainder','full'])for(let i=0;i<3;i++){near(a.value[key][i][0],b.value[key][i][0]);near(a.value[key][i][1],-b.value[key][i][1]);}
  assert.ok(error(a.physical.realVelocity,b.physical.realVelocity)<1e-12);
  const avg=[0,0];for(let j=0;j<256;j++){const phase=2*Math.PI*j/256,u=a.value.full.map(z=>z[0]*Math.cos(phase)-z[1]*Math.sin(phase));avg[0]+=u[0]*u[1]/256;avg[1]+=u[0]*u[2]/256;}
  assert.ok(error(avg,a.covariance.full)<1e-14);
  assert.ok(error(a.covariance.full,a.covariance.withoutRemainder)>1e-4);
});

function simpleOptions(overrides={}){
  return {coordinates:{R:1.4,Z:.2,Y1:.1,Y2:.3,theta:.2},operators:{epsilon:1,Mi:.25,dr:1.2,vr:[1,0]},phase:{k:2,m:1,p:.5,pz:.2,x0:.3},physicalScale:{Q:1,h:0},slowFields:({R,Z},J)=>({F:J.add(R,Z),G:J.scale(R,.3)}),pulseCoordinate:({Y2})=>Y2,seed:(_,J)=>[J.constant(1),J.constant(0),J.constant(0)],...overrides};
}

test('generic supplied amplitude is rejected rather than projected, and source scale/label guards fail',()=>{
  const prescribed=simpleOptions({seed:undefined,amplitude:(_,J)=>[J.constant(1),J.constant(0),J.constant(0)]});
  assert.throws(()=>evaluateSourcePulseCurl(prescribed),/not projected or repaired/);
  assert.throws(()=>evaluateSourcePulseCurl(simpleOptions({pulseCoordinate:({R})=>R})),/D_r v/);
  assert.throws(()=>evaluateSourcePulseCurl(simpleOptions({physicalScale:{Q:.5,h:.2}})),/epsilon=Q/);
  assert.throws(()=>evaluateSourcePulseCurl(simpleOptions({phase:{k:2,m:0,p:.5,pz:.2,x0:.3}})),/m nonzero/);
  assert.throws(()=>evaluateSourcePulseCurl(simpleOptions({phase:{k:2,m:1,p:.3,pz:.2,x0:.3}})),/k\*p/);
  assert.throws(()=>sourcePulseCurlAudit({h:0}),/accepts only/);
});

test('smooth source coefficient cutoffs have zero extension and actual N3 scope remains explicit',()=>{
  for(const R of [.6,.65,1.95,2.1]){const r=evaluateSourcePulseCurlProbe({R});assert.ok(r.value.Cm.flat().every(x=>x===0));assert.ok(r.value.full.flat().every(x=>x===0));}
  assert.deepEqual(evaluateSourcePulseCurlProbeCartesian([0,0,0]).physical.realVelocity,[0,0,0]);
  const r=sourcePulseCurlAudit();assert.equal(r.scope.globalN3PulseEvaluated,false);assert.equal(r.scope.pulseClassBoundsCertified,false);assert.equal(r.scope.formalComplete,false);
  assert.match(r.probe.parameters.role,/NOT_N3/);assert.equal(r.scope.exactH.positive,true);
});
