/** Exact flat-factor functions for the ONE accepted order-zero stress.
 *
 * Inner differences are divided analytically by the common activation
 * factor, through an explicit Laplace integral. The outer backward stress
 * is factored by the same change of variables. Neither code path divides
 * a numerical zero stress by its zero norm at an edge.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

function request(input){
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','Use the actual source stress-factor request.');
  for(const k of Object.keys(input))if(!['sourceProfile','derivativeOrder'].includes(k))fail('INVALID_INPUT','No stress function, endpoint, width or bound override is accepted: '+k);
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID,derivativeOrder=input.derivativeOrder??1;
  assertSourceProfile(sourceProfile);
  if(!Number.isSafeInteger(derivativeOrder)||derivativeOrder<0||derivativeOrder>1)fail('RESOURCE_LIMIT','This factor producer materializes values and first ordinary profile derivatives.');
  return {sourceProfile,derivativeOrder};
}

/** Ring identities, shared by the exact compiler and independent tests.
 * These helpers make no source or analytic certification for caller data.
 */
export function innerMomentDifferenceAlgebra(G,b){
  const q=(n,d=1)=>G.q(n,d),du=b.uOver,de=b.EOver;
  const energy=G.add(G.mul(q(2),b.E,de),G.mul(b.a,G.pow(de,2)));
  const mixed=G.add(G.mul(b.E,du),G.mul(b.U,de),G.mul(b.a,de,du));
  return [G.mul(b.X,du),G.mul(b.r,b.X,de),G.mul(b.r,b.X,mixed),G.mul(b.X,G.sub(G.add(G.mul(q(2),b.U,du),G.mul(b.a,G.pow(du,2))),G.mul(q(1,2),energy))),G.mul(q(1,2),energy)];
}

export function innerStressDifferenceAlgebra(G,b,m,c){
  const q=(n,d=1)=>G.q(n,d),{eta,A,D,d,L,h}=c;
  const WOver=G.neg(G.div(G.add(G.mul(q(2),D,eta,m.M),G.mul(d,m.Meta)),b.X));
  const FWOver=G.add(G.mul(b.F,WOver),G.mul(b.W,b.FOver),G.mul(b.a,b.FOver,WOver));
  const WUOver=G.add(G.mul(b.W,b.uOver),G.mul(b.U,WOver),G.mul(b.a,WOver,b.uOver));
  const angOver=G.add(G.mul(G.sub(G.one,h),m.I),G.neg(G.mul(D,eta,m.Ieta)),G.neg(G.mul(d,m.Jeta)),G.mul(q(2),G.sub(h,D),eta,m.J));
  const axialOver=G.add(G.neg(G.mul(b.X,WUOver)),G.mul(D,G.sub(m.M,G.mul(eta,m.Meta))),G.mul(q(4),h,eta,m.S),G.neg(G.mul(d,m.Seta)),G.mul(b.X,G.sub(G.mul(q(4),A,eta,m.Cp),G.mul(d,m.Cpeta))));
  const theta=G.add(G.neg(G.div(G.mul(b.X,FWOver),L)),G.div(angOver,G.mul(q(2),b.X,L)),G.mul(b.p1,G.sub(b.F,G.mul(b.kappa,b.FOver))));
  const axial=G.sub(G.div(axialOver,G.mul(L,b.r)),G.div(G.mul(q(2),b.Uy),b.r));
  return {WOver,FWOver,WUOver,angOver,axialOver,theta,axial};
}

export function outerStressFactorAlgebra(G,b){
  const q=(n,d=1)=>G.q(n,d);
  return {theta:G.add(G.div(G.mul(q(2),b.K,b.c),b.r),G.div(G.mul(G.pow(b.delta,3),b.viscous),G.mul(q(2),G.pow(b.r,2))),G.div(G.mul(G.pow(b.delta,3),b.inviscid),G.mul(q(4),b.L,G.pow(b.r,2)))),axial:G.div(b.axialIntegral,G.mul(q(4),b.r))};
}

export function compileActualStressDirectionProgram(input={},context={}){
  const selected=request(input),G=new ActualConvergentExpressions(selected.sourceProfile),q=(n,d=1)=>G.q(n,d),p=n=>G.parameter(n),z=G.zero,o=G.one;
  const {eta,A,D,d,L,Ustar,g}=G.core,h=p('h'),Lambda=p('Lambda'),Xa=p('Xa'),t1=p('t1'),kap0=p('kappa0');
  const y=G.var('inner_log_distance'),delta=G.var('outer_log_distance'),Xat=s=>G.mul(Xa,G.exp(s)),rat=s=>G.sqrt(G.mul(q(2),Xat(s)));
  const integral=(name,fn,a,b)=>{const t=G.fresh(name);return G.integral(fn(t),t,a,b);};
  const improper=[];
  function laplace(name,fn){
    const t=G.fresh(name+'_compact'),den=G.sub(o,t),u=G.div(t,den),body=G.mul(G.exp(G.neg(u)),fn(u),G.pow(den,-2)),root=G.integral(body,t,z,o);
    improper.push({name,root,variable:t,substitution:'u=t/(1-t)',weight:'exp(-u)',endpoints:'One-sided improper limits; no singular endpoint sample is evaluated.'});return root;
  }
  function flat(t){
    const positive=G.exp(G.neg(G.pow(t,-2)));
    return G.choose(t,z,o,z,positive,positive);
  }
  const ga=s=>G.div(G.sub(o,kap0),G.add(flat(G.div(s,t1)),flat(G.sub(o,G.div(s,t1)))));
  const ea=s=>G.mul(G.sub(o,kap0),G.step(G.div(s,t1)));
  const innerKernels=[];
  // K_a f(y)=e_a(y)^-1 integral_0^y e_a(s)f(s)ds.
  // The expression below has no e_a^-1 and is defined at y=0.
  function Ka(name,end,fn){
    const radius=G.div(end,t1),root=G.mul(G.div(G.pow(end,3),G.mul(q(2),G.pow(t1,2),ga(end))),laplace(name,u=>{
      const v=G.add(o,G.mul(G.pow(radius,2),u)),s=G.div(end,G.sqrt(v));
      return G.div(G.mul(ga(s),fn(s)),G.mul(v,G.sqrt(v)));
    }));
    innerKernels.push({name,root,upper:end,identity:'e_a(y)^-1 integral_0^y e_a(s) f(s) ds',valueUpper:'(y^3/t1^2)*sup|f|',radialDerivativeUpper:'5*sup|f|+(y^3/t1^2)*sup|partial_y f|',etaDerivativeRule:'Differentiate only the displayed f, since e_a is eta-independent.'});return root;
  }
  const stateCache=new Map();
  function natural(s){
    const Y=G.mul(q(4),G.exp(s)),F=G.mul(g,G.natural('Phi',Y)),U=G.add(Ustar,G.div(G.natural('u',Y),Lambda)),X=Xat(s),r=rat(s);
    const Uy=G.div(G.mul(Y,G.natural('u',Y,eta,1,0)),Lambda),p1=G.neg(G.div(G.mul(q(2),Y,G.natural('Phi',Y,eta,1,0)),G.natural('Phi',Y)));
    const avg=G.add(Ustar,G.div(G.natural('average',Y),Lambda)),W=G.sub(o,G.add(G.mul(q(2),D,eta,avg),G.mul(d,G.derivative(avg,eta))));
    return {Y,F,U,X,r,E:G.mul(r,F),Uy,p1,W};
  }
  function actualDifferenceAt(s){
    if(stateCache.has(s))return stateCache.get(s);
    const ref=natural(s),a=ea(s),kappa=G.sub(o,a),vOver=G.mul(q(1,2),Ka('inner_log_ratio',s,t=>natural(t).p1)),uOver=G.neg(Ka('inner_U_difference',s,t=>natural(t).Uy)),v=G.mul(a,vOver);
    // (exp(v)-1)/v = integral_0^1 exp(t v)dt, including v=0.
    const expDiv=integral('inner_exponential_divided_difference',t=>G.exp(G.mul(t,v)),z,o),FOver=G.mul(ref.F,vOver,expDiv),EOver=G.mul(ref.r,FOver);
    const F=G.mul(ref.F,G.exp(v)),E=G.mul(ref.r,F),U=G.add(ref.U,G.mul(a,uOver));
    const out={...ref,a,kappa,vOver,uOver,FOver,EOver,actualF:F,actualE:E,actualU:U,v};stateCache.set(s,out);return out;
  }
  const source=actualDifferenceAt(y),momentNames=['M','I','J','S','Cp'];
  const deltaMoments=momentNames.map((name,j)=>Ka('inner_delta_'+name,y,s=>innerMomentDifferenceAlgebra(G,actualDifferenceAt(s))[j]));
  const [mI,iI,jI,sI,cpI]=deltaMoments,meta=G.derivative(mI,eta),ieta=G.derivative(iI,eta),jeta=G.derivative(jI,eta),seta=G.derivative(sI,eta),cpeta=G.derivative(cpI,eta);
  const inner=innerStressDifferenceAlgebra(G,source,{M:mI,Meta:meta,I:iI,Ieta:ieta,J:jI,Jeta:jeta,S:sI,Seta:seta,Cp:cpI,Cpeta:cpeta},{eta,A,D,d,L,h});
  const {FWOver,WUOver,theta:innerTheta,axial:innerZ}=inner;

  context.checkCancelled?.();
  // The terminal original stage is eta-independent. Its exact height and
  // endpoint already include the actual scalar waiting integral.
  const terminal=G.outer.stages.find(v=>v.id==='terminal');
  if(!terminal)fail('INTERNAL_VALIDATION','The actual terminal source stage is missing.');
  const Xb=G.mul(p('XR'),G.exp(terminal.end)),EpowB=G.mul(p('Pstar'),G.exp(terminal.logAEnd)),rho=G.mul(p('co'),h);
  const gamma=laplace('actual_Euler_Gamma',v=>G.exp(G.mul(h,G.log(v))));
  const outerCache=new Map();
  function outerAt(s){
    if(outerCache.has(s))return outerCache.get(s);
    const X=G.mul(Xb,G.exp(G.neg(s))),r=G.sqrt(G.mul(q(2),X)),Z=G.div(G.mul(q(2),d),X),pow=G.mul(EpowB,G.exp(G.mul(A,s)));
    const heatWeight=v=>G.exp(G.mul(h,G.sub(G.log(v),G.log(G.add(o,G.mul(Z,v))))));
    const heatNumerator=laplace('actual_outer_heat',heatWeight),heat=G.div(heatNumerator,gamma),K=G.mul(pow,heat);
    // Differentiation supplies one extra v, outside the gamma density v^h.
    const heatZIntegral=laplace('actual_outer_heat_Z',v=>G.div(G.mul(v,heatWeight(v)),G.add(o,G.mul(Z,v))));
    const exactHeatZ=G.neg(G.div(G.mul(h,heatZIntegral),gamma));
    const Kdelta=G.mul(pow,G.add(G.mul(A,heat),G.mul(Z,exactHeatZ)));
    const half=G.mul(q(1,2),s),den=G.add(flat(half),flat(G.sub(o,half))),go=G.inv(den);
    // s is sometimes a compound expression. Use a fresh coordinate for
    // the ordinary derivative of the smooth prefactor in that case.
    const a=G.fresh('outer_prefactor_distance'),ga=G.inv(G.add(flat(G.mul(q(1,2),a)),flat(G.sub(o,G.mul(q(1,2),a))))),gp=G.substitute(G.derivative(ga,a),a,s);
    const exponential=flat(half),f=G.sub(o,G.mul(rho,exponential,go)),c=G.mul(rho,G.add(G.mul(q(8),go),G.mul(G.pow(s,3),gp)));
    const out={X,r,Z,pow,heat,K,Kdelta,go,f,c};outerCache.set(s,out);return out;
  }
  const outerKernels=[];
  function J(name,end,m,fn){
    if(!Number.isSafeInteger(m)||m< -3)fail('INTERNAL_VALIDATION','The outer regularized kernel requires m>=-3.');
    // a=4 is scaled to the fixed weight exp(-u), so each exact prefactor
    // 1/4 and transformed radius is retained.
    const root=G.mul(q(1,4),laplace(name,u=>{
      const z1=G.add(o,G.mul(q(1,4),G.pow(end,2),u)),s=G.div(end,G.sqrt(z1));
      return G.div(fn(s),G.mul(G.pow(z1,Math.floor((m+3)/2)),(m+3)%2?G.sqrt(z1):o));
    }));
    outerKernels.push({name,root,m,identity:'J_(4,m)G(delta)=integral_0^infinity exp(-4t)*(1+delta^2*t)^(-(m+3)/2)*G(delta/sqrt(1+delta^2*t))dt',valueUpper:'sup|G|/4',deltaDerivativeUpper:'sup|G_delta|/4+(m+3)*sup|G|/32',etaDerivativeRule:'Differentiate the displayed G; the kernel is eta-independent.'});return root;
  }
  const b=outerAt(delta),viscous=J('outer_viscous_stress',delta,-3,s=>{const a=outerAt(s);return G.mul(a.r,G.add(a.K,G.mul(q(2),a.Kdelta)),a.c);}),inviscid=J('outer_inviscid_stress',delta,-3,s=>{const a=outerAt(s);return G.mul(G.pow(a.r,3),a.K,a.c);});
  const pressureCoefficient=s=>G.div(G.mul(eta,J('outer_pressure',s,-3,t=>{const a=outerAt(t);return G.mul(G.pow(a.K,2),a.f,a.c);})),L);
  const outer=outerStressFactorAlgebra(G,{K:b.K,c:b.c,r:b.r,delta,L,viscous,inviscid,axialIntegral:J('outer_axial_stress',delta,0,s=>G.mul(G.pow(outerAt(s).r,2),pressureCoefficient(s)))});
  const {theta:outerTheta,axial:outerZ}=outer;
  const norm=(a,b)=>G.sqrt(G.add(G.pow(a,2),G.pow(b,2))),innerNorm=norm(innerTheta,innerZ),outerScaledZ=G.mul(G.pow(delta,6),outerZ),outerNorm=norm(outerTheta,outerScaledZ);
  const roots={innerLogDistance:y,outerLogDistance:delta,eta,Xa,Xb,t1,EpowB,rho,
    innerFactor:source.a,innerTheta,innerZ,innerDirectionTheta:G.div(innerTheta,innerNorm),innerDirectionZ:G.div(innerZ,innerNorm),
    outerTheta,outerZ,outerScaledZ,outerDirectionTheta:G.div(outerTheta,outerNorm),outerDirectionZ:G.div(outerScaledZ,outerNorm),
    actualInnerF:source.actualF,actualInnerU:source.actualU,innerVOverFactor:source.vOver,innerUOverFactor:source.uOver,innerFOverFactor:source.FOver,
    innerFWOverFactor:FWOver,innerWUOverFactor:WUOver};
  momentNames.forEach((name,j)=>{roots['inner'+name+'DifferenceOverFactor']=deltaMoments[j];});
  if(selected.derivativeOrder)for(const [name,coordinate]of [['innerTheta',y],['innerZ',y],['innerDirectionTheta',y],['innerDirectionZ',y],['outerTheta',delta],['outerZ',delta],['outerDirectionTheta',delta],['outerDirectionZ',delta]]){
    context.checkCancelled?.();roots[name+'_radial']=G.derivative(roots[name],coordinate);roots[name+'_eta']=G.derivative(roots[name],eta);
  }
  return G.pack(roots,{schema:'MathScope.ActualStressDirectionProgram/1',request:selected,
    domains:{inner:{coordinate:'y=log(X/Xa)',range:['0','t1/4'],eta:[-1,1]},outer:{coordinate:'delta=log(Xb/X)',range:['0','1/2'],eta:[-1,1]}},
    exactFactorization:{inner:'T0=e_a*(innerTheta,innerZ)',outer:'T0=exp(-4/delta^2)*delta^-3*(outerTheta,delta^6*outerZ)',normalizationsArePhysicalStress:false,actualPhysicalFactor:'Tphysical=q^(-A-1/2)*T0; it cancels only from the direction.',commonZeroStressFactorDividedNumerically:false},
    sourceEquations:['4.11','4.15','4.16','B.26','B.27','B.30','A.53','A.54','A.48','A.49'],
    innerKernels,outerKernels,improper,
    exactSupport:{inner:'C12 primitives vanish on y<=t1/4 by the strict shear cutoff; B8/I1/I2 are farther right.',outer:'Backward stress uses the exact heat exterior after all five actual moment functions are restored; no old forward-prefix approximation is substituted.'},
    preservedTerms:{innerNonlinearMomentDifferences:true,innerAxialStockMinusXWU:true,outerThreeAngularTerms:true,outerPressureHeatSquare:true,outerNestedAxialIntegral:true,heatGammaIsActualLaplaceIntegral:true},
    scope:{actualSameSourceFlatFactorFunctionsCompiled:true,firstProfileDerivativesExpanded:!!selected.derivativeOrder,underlyingNaturalSeriesHasConvergentSourceTail:true,entireFunctionNumericallyEnclosed:false,uniformDirectionNormBoundIncluded:false,completedPositiveOrderBackgroundIncluded:false,actualUniformHColumnsCertified:false,sourceUniformQStarCertified:false,originalN506Complete:false,newLeanKernelProof:false}});
}
