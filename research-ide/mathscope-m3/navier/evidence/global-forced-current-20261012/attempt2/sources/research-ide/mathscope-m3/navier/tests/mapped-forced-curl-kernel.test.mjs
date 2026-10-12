import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {SourceCoupledExpressions,coupledForcedAngularInverse} from '../source-coupled-expressions.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {realizeMappedForcedAngularCurl,assertMappedForcedAngularCurl,mappedForcedAngularCurlRoots} from '../source-mapped-forced-curl.mjs';
import {originalCylindricalDifferentialOperators,exactHarmonicComplexAlgebra} from '../source-harmonic-assembly.mjs';
import {exactOriginalAngularLift,originalFixedLiftPulsePath} from '../source-initialized-angular.mjs';
import {createQuadraticSourceVerifier} from '../source-quadratic-identity.mjs';

export function mappedForcedFixture(){
  const base=new ActualConvergentExpressions(),A=new AuxiliarySourceExpressions(base),G=new SourceCoupledExpressions(A),
    [R,Z,T,theta,y0,y1,w]=['R','Z','T','theta','Y0','Y1','w'].map(name=>G.fresh(name)),Y=[y0,y1],
    epsilon=G.q(2,5),k=G.q(3),vr=[G.one,G.q(-2)],vt=[G.q(2),G.one],ci=G.q(3),
    geometry={R,Z,T,theta,Y,vr,vt,ci,epsilon,radialFast:G.pow(R,2)},
    pulseValue=G.div(G.add(G.mul(G.q(2),y0),y1),G.q(15)),
    transverse=G.div(G.sub(y0,G.mul(G.q(2),y1)),G.q(5)),
    phase=G.add(G.mul(G.q(2),theta),G.mul(R,Z),G.mul(pulseValue,Z),G.mul(G.q(7),transverse)),
    n=[G.add(Z,G.mul(G.q(7),G.pow(R,2))),G.div(G.q(2),R),G.mul(epsilon,G.add(R,w))],
    F=G.add(G.one,T),K=[[G.zero,G.neg(G.mul(G.q(2),F)),G.zero],[G.mul(G.q(2),F),G.zero,G.zero],[G.one,G.zero,G.zero]],
    forcing=[{real:G.add(R,w),imaginary:G.mul(transverse,T)},{real:G.zero,imaginary:T},{real:G.mul(transverse,Z),imaginary:G.one}],
    inverse=coupledForcedAngularInverse(G,{variable:w,parameters:[R,Z,T,...Y],directions:[R,Z,T,...Y],length:G.one,n,K,k,epsilon,forcing,m:2}).inverse,
    psiPath=G.mul(w,G.sub(G.one,w));
  return {G,inverse,geometry,phase,pulseValue,psiPath};
}

test('mapping precedes every common-Y spatial derivative and preserves both complex pressure parts',()=>{
  const f=mappedForcedFixture(),s=realizeMappedForcedAngularCurl(f),{G}=s;
  assert.equal(assertMappedForcedAngularCurl(s),true);assert.equal(s.inverse.G,G.forcedGraph);
  assert.ok(s.identities.checks.every(x=>x.pass));assert.equal(s.mapping.pathValueSubstitutedBeforeSpatialDerivative,true);
  assert.ok(s.pressure.real!==G.zero&&s.pressure.imaginary!==G.zero);
  for(const root of mappedForcedAngularCurlRoots(s))assert.equal(G.freeCoordinates(root).has(s.mapping.variable),false);
  assert.ok(s.curlRemainder.some(z=>z.real!==G.zero||z.imaginary!==G.zero));
  assert.equal(s.scope.sourceAuthenticated,false);assert.equal(s.scope.principalCutoffFlatnessClassCertified,false);
  assert.equal(s.mapping.sourcePathInvarianceCertified,false);
});

test('independent common-cylindrical curl and direct divergence retain every connection and chain term',()=>{
  const f=mappedForcedFixture(),s=realizeMappedForcedAngularCurl(f),{G,geometry:g}=s,D=originalCylindricalDifferentialOperators(G,g),
    C=exactHarmonicComplexAlgebra(G),verify=createFactoredRationalVerifier(G,{maxTerms:120000}),
    X=[0,1,2].map(j=>C.value(G.neg(s.potential.shared.imaginary[j]),s.potential.shared.real[j])),
    n=s.normal.value,km=G.mul(s.k,G.q(s.m)),
    dr=z=>C.add(C.derivative(z,D.Dr),C.imaginary(G.mul(km,n[0]),z)),
    dz=z=>C.add(C.derivative(z,D.Dz),C.imaginary(G.mul(km,n[2]),z)),
    angular=z=>C.imaginary(G.mul(km,n[1]),z),
    direct=[C.sub(angular(X[2]),dz(X[1])),C.sub(dz(X[0]),dr(X[2])),
      C.sub(C.add(dr(X[1]),C.scale(G.inv(g.R),X[1])),angular(X[0]))];
  for(let j=0;j<3;j++)for(const part of ['real','imaginary'])assert.equal(verify(G.sub(direct[j][part],s.velocity[j][part])).pass,true);
  const div=C.add(dr(direct[0]),C.scale(G.inv(g.R),direct[0]),angular(direct[1]),dz(direct[2]));
  assert.equal(verify(div.real).pass,true);assert.equal(verify(div.imaginary).pass,true);
  const missingConnection=C.sub(direct[2],C.scale(G.inv(g.R),X[1]));
  assert.equal(verify(G.sub(missingConnection.real,direct[2].real)).pass,false);
  const missedY=G.derivative(s.potential.shared.real[1],g.R),completeR=D.Dr(s.potential.shared.real[1]);
  assert.equal(verify(G.sub(missedY,completeR)).pass,false);
});

test('mapped cutoff retains the normal source pressure and both principal error terms',()=>{
  const f=mappedForcedFixture(),s=realizeMappedForcedAngularCurl(f),{G}=s,verify=createFactoredRationalVerifier(G,{maxTerms:120000});
  assert.ok(s.cutoff.path.checks.every(x=>x.pass));
  for(let j=0;j<3;j++)for(const part of ['real','imaginary']){
    const actual=s.cutoff.mapped.expected[j][part],remaining=s.cutoff.mapped.remainingSource[j][part],derivative=s.cutoff.mapped.derivativeSource[j][part];
    assert.equal(verify(G.sub(actual,G.add(remaining,derivative))).pass,true);
  }
  assert.ok(s.cutoff.mapped.derivativeSource.some(z=>!verify(z.real).pass||!verify(z.imaginary).pass));
  assert.ok(s.cutoff.mapped.remainingSource.some(z=>!verify(z.real).pass||!verify(z.imaginary).pass));
  assert.equal(s.cutoff.path.principalCutoffResidualDeclaredZero,false);
});

test('wrong phase, missing path substitution, foreign owner and mutated output have no mapped authority',()=>{
  const f=mappedForcedFixture(),{G}=f;
  assert.throws(()=>realizeMappedForcedAngularCurl({...f,phase:G.mul(G.q(2),f.phase)}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>realizeMappedForcedAngularCurl({...f,pulseValue:f.inverse.input.variable}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>realizeMappedForcedAngularCurl({...f,G:f.G.baseGraph}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const s=realizeMappedForcedAngularCurl(f);assert.throws(()=>assertMappedForcedAngularCurl({...s}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const saved=s.pressure;s.pressure={real:G.zero,imaginary:G.zero};
  try{assert.throws(()=>assertMappedForcedAngularCurl(s),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{s.pressure=saved;}
  assert.equal(assertMappedForcedAngularCurl(s),true);
});

test('the actual delta3 integer lift retains sqrt2 geometry before the complete forced curl is mapped',()=>{
  const base=new ActualConvergentExpressions(),G=new SourceCoupledExpressions(new AuxiliarySourceExpressions(base)),
    [R,Z,T,theta,y0,y1,c0,c1,d0,d1,w]=['R','Z','T','theta','y0','y1','c0','c1','d0','d1','w'].map(x=>G.fresh(x)),
    sqrt2=G.sqrt(G.q(2)),Y=[y0,y1],center=[c0,c1],copy=[d0,d1],epsilon=G.q(2,5),radialFast=G.add(G.one,R),
    lift=exactOriginalAngularLift(G,{R,Z,T,theta,Y,center,copy,levelDifference:3,
      vr:[G.one,G.sub(G.one,sqrt2)],vt:[G.sub(sqrt2,G.one),G.one],Dgeom:G.sub(G.q(4),G.mul(G.q(2),sqrt2)),
      Lambda:G.sub(G.q(4),sqrt2),Tg:G.add(G.q(4),sqrt2),ci:G.q(3,2),r0:G.q(1,10),epsilon,radialFast}),
    path=originalFixedLiftPulsePath(G,{lift,w}),phase=G.add(G.mul(G.q(2),theta),G.mul(R,Z),G.mul(lift.v,Z),G.mul(G.q(7),lift.xi)),
    n=[G.add(Z,G.mul(G.q(7),radialFast)),G.div(G.q(2),R),G.mul(epsilon,G.add(R,w))],
    K=[[G.zero,G.q(-2),G.zero],[G.q(2),G.zero,G.zero],[G.one,G.zero,G.zero]],
    forcing=[{real:G.add(R,w),imaginary:T},{real:lift.xi,imaginary:G.one},{real:Z,imaginary:G.zero}],
    inverse=coupledForcedAngularInverse(G,{variable:w,parameters:[R,Z,T,...Y,...center,...copy],directions:[R,Z,T,...Y],length:G.one,n,K,k:G.q(3),epsilon,forcing,m:2}).inverse,
    s=realizeMappedForcedAngularCurl({G,inverse,geometry:lift.geometry,phase,pulseValue:lift.v,psiPath:G.mul(w,G.sub(G.one,w))}),
    verify=createQuadraticSourceVerifier(G,{maxTerms:120000});
  assert.ok(path.checks.every(x=>x.pass));assert.ok(s.identities.checks.every(x=>x.pass));
  assert.equal(verify(s.divergence.real).pass,true);assert.equal(verify(s.divergence.imaginary).pass,true);
  assert.equal(s.identities.scalarCoefficientField.includes('Q(sqrt(2))'),true);
  assert.throws(()=>realizeMappedForcedAngularCurl({G,inverse,geometry:{...lift.geometry,radialFast},phase,pulseValue:lift.v,
    psiPath:G.mul(w,G.sub(G.one,w))}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.equal(s.scope.sourceAuthenticated,false);
});
