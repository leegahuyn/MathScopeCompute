/** Independent Cartesian/cylindrical and profile coefficient identities.
 * All field jets below are independent formal variables. This universal
 * calculation is instantiated only by the privately authenticated source
 * adapter; no value or PDE is assigned to a source function here.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {retainedCommonDenominatorIdentity} from './actual-third-jet-algebra.mjs';
import {directCartesianMomentum} from './actual-strengthened-background-kernels.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

function independentJets(G,directions,prefix){
  const labels=new Map(),cache=new Map(),derivativeCache=new Map(),q=(n,d=1)=>G.q(n,d);
  const jet=(name,orders=Array(directions.length).fill(0))=>{
    const key=name+':'+orders.join(':');if(cache.has(key))return cache.get(key);
    const id=G.fresh(prefix+'_'+key);labels.set(id,{name,orders});cache.set(key,id);return id;
  };
  const derivative=(id,j,rules=new Map())=>{
    if(rules.has(id))return rules.get(id);const key=id+':'+j;if(derivativeCache.has(key))return derivativeCache.get(key);
    let out;if(labels.has(id)){const{name,orders}=labels.get(id),o=orders.slice();o[j]++;out=jet(name,o);}
    else{const{op,args}=G.nodes[id];
      if(op==='add')out=G.add(...args.map(a=>derivative(a,j,rules)));
      else if(op==='multiply')out=G.add(...args.map((a,k)=>G.mul(derivative(a,j,rules),...args.filter((_,i)=>i!==k))));
      else if(op==='integer_power')out=G.mul(q(args[1]),G.pow(args[0],args[1]-1),derivative(args[0],j,rules));
      else if(op==='inverse')out=G.neg(G.mul(G.pow(args[0],-2),derivative(args[0],j,rules)));
      else if(['coordinate','rational','source_parameter'].includes(op))out=G.zero;
      else fail('UNSUPPORTED','The independent physical coefficient proof uses rational jets only.');
    }
    derivativeCache.set(key,out);return out;
  };
  return {jet,derivative,labels};
}

/** A rational chart on the unit circle avoids assuming a trigonometric
 * cancellation in an opaque expression checker. C=(1-w²)/(1+w²),
 * S=2w/(1+w²), d_theta w=(1+w²)/2. The omitted circle point is obtained
 * by continuity (or a rotated chart), so all Cartesian directions apply.
 */
export function originalCartesianCylindricalMomentumIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),r=G.fresh('cylinder_r'),w=G.fresh('cylinder_half_angle'),
    circleDenominator=G.add(G.one,G.pow(w,2)),C=G.div(G.sub(G.one,G.pow(w,2)),circleDenominator),S=G.div(G.mul(q(2),w),circleDenominator),
    J=independentJets(G,['r','z','t'],'cylinder_field'),f=Object.fromEntries(['V','K','U','P','S_theta','S_z'].map(n=>[n,J.jet(n)])),
    dr=id=>J.derivative(id,0,new Map([[r,G.one]])),dz=id=>J.derivative(id,1),dt=id=>J.derivative(id,2),
    dtheta=id=>G.mul(G.div(circleDenominator,q(2)),G.derivative(id,w)),
    dx=id=>G.sub(G.mul(C,dr(id)),G.div(G.mul(S,dtheta(id)),r)),dy=id=>G.add(G.mul(S,dr(id)),G.div(G.mul(C,dtheta(id)),r)),
    operators={x1:dx,x2:dy,z:dz,t:dt},velocity=[G.sub(G.mul(C,f.V),G.mul(S,f.K)),G.add(G.mul(S,f.V),G.mul(C,f.K)),f.U],
    stressTheta=G.add(dr(f.S_theta),G.div(G.mul(q(2),f.S_theta),r)),stressZ=G.add(dr(f.S_z),G.div(f.S_z,r)),
    stressDivergence=[G.neg(G.mul(S,stressTheta)),G.mul(C,stressTheta),stressZ],
    direct=directCartesianMomentum(G,{velocity,pressure:f.P,operators,stressDivergence}),
    radial=G.add(dt(f.V),G.mul(f.V,dr(f.V)),G.mul(f.U,dz(f.V)),G.neg(G.div(G.pow(f.K,2),r)),dr(f.P),
      G.neg(dr(dr(f.V))),G.neg(G.div(dr(f.V),r)),G.div(f.V,G.pow(r,2)),G.neg(dz(dz(f.V)))),
    angular=G.add(dt(f.K),G.mul(f.V,dr(f.K)),G.mul(f.U,dz(f.K)),G.div(G.mul(f.V,f.K),r),
      G.neg(dr(dr(f.K))),G.neg(G.div(dr(f.K),r)),G.div(f.K,G.pow(r,2)),G.neg(dz(dz(f.K))),stressTheta),
    axial=G.add(dt(f.U),G.mul(f.V,dr(f.U)),G.mul(f.U,dz(f.U)),dz(f.P),
      G.neg(dr(dr(f.U))),G.neg(G.div(dr(f.U),r)),G.neg(dz(dz(f.U))),stressZ),
    expected=[G.sub(G.mul(C,radial),G.mul(S,angular)),G.add(G.mul(S,radial),G.mul(C,angular)),axial],
    check=(a,b)=>retainedCommonDenominatorIdentity(G,a,b,{denominators:[r,circleDenominator],maxTerms:200000}),
    checks=expected.map((value,j)=>check(direct.values[j],value)),
    circle=check(G.add(G.pow(C,2),G.pow(S,2)),G.one),connections=[check(dtheta(C),G.neg(S)),check(dtheta(S),C)],
    negative={omittedCentrifugal:check(direct.values[0],G.add(expected[0],G.div(G.mul(C,G.pow(f.K,2)),r))),
      omittedAngularConnection:check(direct.values[1],G.sub(expected[1],G.div(G.mul(C,f.V,f.K),r))),
      omittedStressRadiusFactor:check(direct.values[1],G.sub(expected[1],G.div(G.mul(C,f.S_theta),r)))};
  if(!circle.pass||connections.some(c=>!c.pass)||checks.some(c=>!c.pass)||Object.values(negative).some(c=>c.pass))
    fail('INTERNAL_VALIDATION','Cartesian momentum lost a cylindrical connection, stress factor or centrifugal term.');
  return {schema:'MathScope.OriginalCartesianCylindricalMomentumIdentity/1',checks,circle,connections,negativeControls:negative,pass:true,
    sourceAuthenticated:false,independentFieldJets:J.labels.size,allFieldsIndependent:true,
    equations:{radial:'V_t+V*V_r+U*V_z-K²/r+P_r-(V_rr+V_r/r-V/r²+V_zz)',
      angular:'K_t+V*K_r+U*K_z+V*K/r-(K_rr+K_r/r-K/r²+K_zz)+(S_theta,r+2*S_theta/r)',
      axial:'U_t+V*U_r+U*U_z+P_z-(U_rr+U_r/r+U_zz)+(S_z,r+S_z/r)'},
    geometry:'r>0; rational unit-circle chart and its continuous rotation. Coordinate factors are differentiated before any cancellation.',
    omittedAxisEvaluation:'The authentic smooth source gives the axis limits; no r=0 division is used.',newLeanKernelProof:false};
}

/** The radial monomial calculation and exact affine exponent comparison
 * bridge the preceding physical equations to (5.6)/(5.9). ν_i and ν_j
 * remain arbitrary indeterminates. The source subsequently substitutes
 * ν_n=2*n*h, including the original two viscosity shifts.
 */
export function originalProfileMomentumScalingIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),r=G.fresh('scaling_r'),Q=G.fresh('scaling_q'),X=G.fresh('scaling_X'),
    ni=G.fresh('scaling_nu_i'),nj=G.fresh('scaling_nu_j'),h=G.parameter('h'),{A,D}=G.core,
    J=independentJets(G,['X','eta'],'scaling_field'),F=J.jet('F'),U=J.jet('U'),v=J.jet('v'),vi=J.jet('v_i'),St=J.jet('S_theta'),Sz=J.jet('S_z'),
    dX=id=>J.derivative(id,0),radialCache=new Map(),
    dr=id=>{if(radialCache.has(id))return radialCache.get(id);let out;
      if(id===r)out=G.one;else if(id===X)out=G.div(r,Q);else if(J.labels.has(id))out=G.mul(G.div(r,Q),dX(id));
      else{const{op,args}=G.nodes[id];
        if(op==='add')out=G.add(...args.map(dr));
        else if(op==='multiply')out=G.add(...args.map((a,k)=>G.mul(dr(a),...args.filter((_,j)=>j!==k))));
        else if(op==='integer_power')out=G.mul(q(args[1]),G.pow(args[0],args[1]-1),dr(args[0]));
        else if(op==='inverse')out=G.neg(G.mul(G.pow(args[0],-2),dr(args[0])));
        else if(['coordinate','rational','source_parameter'].includes(op))out=G.zero;
        else fail('UNSUPPORTED','The source radial scaling identity uses rational differential polynomials.');}
      radialCache.set(id,out);return out;},
    atRadius=id=>G.substitute(id,X,G.div(G.pow(r,2),G.mul(q(2),Q))),
    check=(a,b)=>sourceGraphRationalIdentity(G,atRadius(G.sub(a,b)),{maxTerms:100000}),
    vectorLaplace=f=>G.add(dr(dr(f)),G.div(dr(f),r),G.neg(G.div(f,G.pow(r,2)))),
    scalarLaplace=f=>G.add(dr(dr(f)),G.div(dr(f),r)),K=G.mul(r,F),V=G.div(G.mul(r,v),q(2)),Vi=G.div(G.mul(r,vi),q(2)),
    checks={angularRadialViscosity:check(vectorLaplace(K),G.div(G.mul(q(2),r,G.add(G.mul(X,dX(dX(F))),G.mul(q(2),dX(F)))),Q)),
      axialRadialViscosity:check(scalarLaplace(U),G.div(G.mul(q(2),G.add(G.mul(X,dX(dX(U))),dX(U))),Q)),
      radialVectorViscosity:check(vectorLaplace(V),G.div(G.mul(r,G.add(G.mul(X,dX(dX(v))),G.mul(q(2),dX(v)))),Q)),
      angularTransport:check(G.add(G.mul(Vi,dr(K)),G.div(G.mul(Vi,K),r)),G.mul(r,vi,G.add(F,G.mul(X,dX(F))))),
      axialTransport:check(G.mul(Vi,dr(U)),G.mul(X,vi,dX(U))),
      radialTransport:check(G.mul(Vi,dr(V)),G.div(G.mul(r,vi,G.add(G.div(v,q(2)),G.mul(X,dX(v)))),q(2))),
      angularStress:check(G.add(dr(St),G.div(G.mul(q(2),St),r)),G.div(G.mul(r,G.add(dX(St),G.div(St,X))),Q)),
      axialStressWeighted:check(G.add(dr(Sz),G.div(Sz,r)),G.div(G.add(G.mul(q(2),X,dX(Sz)),Sz),r))},
    b=G.neg(G.add(A,q(1,2))),c=G.neg(A),sum=G.add(ni,nj),
    exponentChecks={originalAplusD:check(G.add(A,D),G.one),originalShift:check(G.sub(G.one,G.mul(q(2),D)),G.mul(q(2),h)),
      angularTransport:check(G.add(b,ni,nj,G.neg(A),G.neg(D)),G.add(b,sum,q(-1))),
      axialTransport:check(G.add(c,ni,nj,G.neg(A),G.neg(D)),G.add(c,sum,q(-1))),
      centrifugal:check(G.mul(q(2),b),G.sub(G.mul(q(-2),A),G.one)),
      shiftedRadialOmega:check(G.add(G.mul(q(-2),A),q(-1),ni,G.mul(q(2),h)),G.add(q(-2),ni)),
      shiftedAngularAxialViscosity:check(G.add(b,ni,G.mul(q(-2),D)),G.add(b,q(-1),ni,G.mul(q(2),h))),
      shiftedRadialAxialViscosity:check(G.add(q(-1),ni,G.mul(q(-2),D)),G.add(q(-2),ni,G.mul(q(2),h)))},
    a=G.fresh('scaling_indeterminate_exponent'),P=G.fresh('scaling_q_power_D'),eta=G.core.eta,d=G.core.d,L=G.core.L,
    qt=G.neg(G.inv(L)),etat=G.div(G.mul(D,eta),G.mul(Q,L)),qz=G.div(G.mul(q(2),Q,eta),G.mul(P,L)),etaz=G.div(d,G.mul(P,L)),
    dqMonomial=G.div(G.sub(G.mul(a,F),G.mul(X,dX(F))),Q),deMonomial=J.derivative(F,1),
    chartChecks={timeInverse:check(G.add(G.neg(G.mul(d,qt)),G.mul(q(2),Q,eta,etat)),G.one),
      timeOnZ:check(G.add(G.div(G.mul(D,P,eta,qt),Q),G.mul(P,etat)),G.zero),
      axialOnTime:check(G.add(G.neg(G.mul(d,qz)),G.mul(q(2),Q,eta,etaz)),G.zero),
      axialInverse:check(G.add(G.div(G.mul(D,P,eta,qz),Q),G.mul(P,etaz)),G.one),
      timeMonomial:check(G.mul(Q,G.add(G.mul(qt,dqMonomial),G.mul(etat,deMonomial))),
        G.div(G.add(G.neg(G.mul(a,F)),G.mul(X,dX(F)),G.mul(D,eta,deMonomial)),L)),
      axialMonomial:check(G.mul(P,G.add(G.mul(qz,dqMonomial),G.mul(etaz,deMonomial))),
        G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(a,F),G.mul(X,dX(F)))),G.mul(d,deMonomial)),L))},
    negative={omittedAngularTransportConnection:check(G.mul(Vi,dr(K)),G.mul(r,vi,G.add(F,G.mul(X,dX(F))))),
      omittedRadialHalf:check(G.mul(Vi,dr(V)),G.mul(r,vi,G.add(G.div(v,q(2)),G.mul(X,dX(v)))))};
  if([...Object.values(checks),...Object.values(exponentChecks),...Object.values(chartChecks)].some(c=>!c.pass)||Object.values(negative).some(c=>c.pass))
    fail('INTERNAL_VALIDATION','An original radial coefficient or homogeneity shift failed.');
  return {schema:'MathScope.OriginalProfileMomentumScalingIdentity/1',checks,exponentChecks,chartChecks,negativeControls:negative,pass:true,
    fields:{K_n:'r*q^(-A-1/2+nu_n)*F_n',V_n:'(r/2)*q^(-1+nu_n)*v_n',U_n:'q^(-A+nu_n)*U_n',P_n:'q^(-2A+nu_n)*Pi_n',stress_n:'q^(-A-1/2+nu_n)*T_n'},
    chart:{X:'r²/(2q)',time:'partial_t(q^a f)=q^(a-1)*T_a(f)',axial:'partial_z(q^a f)=q^(a-D)*Z_a(f)',radial:'partial_r f=(r/q)*partial_X f'},
    physicalResidualWeights:{theta:'r*q^(-A-3/2+2nh)*theta_n',axial:'q^(-A-1+2nh)*z_n',radial:'r*q^(-2A-1+2nh)*radial_n'},
    arbitraryOrders:'All ν_i,ν_j are independent, so the same calculation applies to every ordered pair. Linear T/Z act on the corresponding actual exponent; axial viscosity shifts by one original 2h step and Omega shifts by one additional step.',
    sourceAuthenticated:false,allOriginalHalfAndConnectionFactorsRetained:true,newLeanKernelProof:false};
}
