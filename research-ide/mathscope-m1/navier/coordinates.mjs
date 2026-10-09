import {ComputeError,positive,finiteNumber} from './numerics.mjs';
export function parameters(input={}){
  const tau=positive(input.tau??.1,'tau'),h=finiteNumber(input.h??.005,'h'),viscosity=positive(input.viscosity??1,'viscosity');
  if(!(h>0&&h<.01))throw new ComputeError('INVALID_INPUT','h must lie in (0,.01)');
  return {tau,h,viscosity,A:.5+h,D:.5-h};
}
export function fromSimilarity({X,eta,theta=0},input={}){
  const o=parameters(input);X=finiteNumber(X,'X');eta=finiteNumber(eta,'eta');theta=finiteNumber(theta,'theta');
  if(X<0||Math.abs(eta)>=1)throw new ComputeError('INVALID_INPUT','X>=0 and |eta|<1 required');
  const q=o.tau/(1-eta*eta),r=Math.sqrt(2*o.viscosity*q*X),z=Math.sqrt(o.viscosity)*q**o.D*eta;
  if(![q,r,z].every(Number.isFinite))throw new ComputeError('PRECISION_REQUIRED','Forward similarity coordinates overflow binary64');
  return {position:[r*Math.cos(theta),r*Math.sin(theta),z],q,X,eta,theta,L:1-2*o.h*eta*eta,lowerUniquenessBound:1-2*o.h};
}
export function toSimilarity(position,input={}){
  const o=parameters(input);if(!Array.isArray(position)||position.length!==3)throw new ComputeError('INVALID_INPUT','Three coordinates required');position.forEach((v,i)=>finiteNumber(v,`coordinate ${i}`));
  const rootNu=Math.sqrt(o.viscosity),z=position[2]/rootNu,D=o.D;
  let lo=Math.max(o.tau,Math.abs(z)**(1/D)),hi=2*lo;
  const f=q=>q-z*z*q**(2*o.h)-o.tau;
  if(!Number.isFinite(hi))throw new ComputeError('PRECISION_REQUIRED','Coordinate scale overflows binary64');
  let it=0;while(f(hi)<0){hi*=2;if(++it>1024||!Number.isFinite(hi))throw new ComputeError('PRECISION_REQUIRED','Could not bracket coordinate root');}
  for(let i=0;i<90;i++){const mid=lo+(hi-lo)/2;if(mid===lo||mid===hi)break;if(f(mid)>0)hi=mid;else lo=mid;}
  const q=lo+(hi-lo)/2,eta=z/q**D,X=(position[0]**2+position[1]**2)/(2*o.viscosity*q),L=1-2*o.h*eta*eta;
  return {q,eta,X,theta:Math.atan2(position[1],position[0]),L,rootBracket:[lo,hi],rootResidual:f(q),rootErrorBound:Math.abs(f(q))/(1-2*o.h),lowerUniquenessBound:1-2*o.h,bracketGrade:'monotone bisection with floating-point endpoints; cross-checked by high-precision fixtures'};
}
export function transformedDerivative({q,X,eta}, {b,value,dX,dEta},input={}){
  const o=parameters(input),L=1-2*o.h*eta*eta,d=1-eta*eta;
  return {dt:q**(b-1)*(-b*value+o.D*eta*dEta+X*dX)/L,dz:q**(b-o.D)*(2*b*eta*value+d*dEta-2*eta*X*dX)/(L*Math.sqrt(o.viscosity))};
}
export function monomialJet(position,{b=.3,radialPower=2,axialPower=3,...input}={}){
  const p=toSimilarity(position,input),a=radialPower,c=axialPower,value=p.X**a*p.eta**c,dX=a===0?0:a*p.X**(a-1)*p.eta**c,dEta=c===0?0:c*p.X**a*p.eta**(c-1);
  return {...p,value:p.q**b*value,...transformedDerivative(p,{b,value,dX,dEta},input)};
}
export function coordinateFieldSample(input={},budget){
  const X=input.X??.6,eta=input.eta??-.35,theta=input.theta??.4,p=fromSimilarity({X,eta,theta},input),inverse=toSimilarity(p.position,input),j=monomialJet(p.position,input);
  return {model:'paper-similarity-coordinates',input:parameters(input),forward:p,inverse,monomial:j,roundtrip:{X:Math.abs(inverse.X-X),eta:Math.abs(inverse.eta-eta)},sources:[{source:'N00',pages:[24,25],equations:['4.1','4.2']}],budget:budget?.snapshot()};
}
