/** Complete angular-mean differential polynomials from original (8.3).
 * All auxiliary modes, time terms, base components, covariance entries,
 * quadratic products and cylindrical/viscous connections are retained.
 * This algebra grants no source authority to its supplied operands.
 */
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_INPUT'});},
  names=['rr','rtheta','rz','thetatheta','thetaz','zz'];

export function originalFullMeanOperators(G,geometry){
  const {R,Z,T,Y,vr,vt,epsilon,ci,radialFast:a}=geometry??{};
  if(!Array.isArray(Y)||Y.length!==2||!Array.isArray(vr)||vr.length!==2||!Array.isArray(vt)||vt.length!==2||
    ![R,Z,T,...Y,...vr,...vt,epsilon,ci,a].every(x=>Number.isSafeInteger(x)&&G.nodes[x]))
    fail('Use the original complete slow/two-torus coordinate tuple and every fixed physical derivative factor.');
  const L=x=>G.add(...Y.map((y,j)=>G.mul(vr[j],G.derivative(x,y)))),N=x=>G.add(...Y.map((y,j)=>G.mul(vt[j],G.derivative(x,y)))),
    Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x))),Dz=x=>G.mul(epsilon,G.derivative(x,Z)),
    time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x))),
    De=(x,e)=>G.add(Dr(x),G.div(G.mul(G.q(e),x),R)),
    lap=x=>G.add(Dr(Dr(x)),G.div(Dr(x),R),Dz(Dz(x))),lapVector=x=>G.sub(lap(x),G.div(x,G.pow(R,2)));
  return {R,Z,T,Y,L,N,Dr,Dz,time,De,lap,lapVector};
}

export function exactFullAuxiliaryMeanPDE(G,{geometry,background,velocity,covariance:W,stress,pressure=G.zero}={}){
  const b=background?.b,V=background?.V,G0=background?.G,beta=velocity?.beta,v=velocity?.v,gamma=velocity?.gamma;
  if(!W||!Array.isArray(stress)||stress.length!==2||![b,V,G0,beta,v,gamma,...names.map(n=>W[n]),...stress,pressure]
    .every(x=>Number.isSafeInteger(x)&&G.nodes[x]))fail('Keep all original base, mean, six covariance, stress and pressure operands.');
  const {R,Dr,Dz,time,De,lap,lapVector}=originalFullMeanOperators(G,geometry),q=(n,d=1)=>G.q(n,d),epsilon=geometry.epsilon,
    gr=G.add(G.neg(time(beta)),G.neg(De(G.add(G.mul(q(2),b,beta),G.pow(beta,2),W.rr),1)),
      G.neg(Dz(G.add(G.mul(b,gamma),G.mul(G0,beta),G.mul(beta,gamma),W.rz))),
      G.div(G.add(G.mul(q(2),V,v),G.pow(v,2),W.thetatheta),R),G.mul(epsilon,lapVector(beta))),
    Etheta=G.add(time(v),De(G.add(G.mul(b,v),G.mul(beta,V),G.mul(beta,v),W.rtheta),2),
      Dz(G.add(G.mul(G0,v),G.mul(V,gamma),G.mul(gamma,v),W.thetaz)),G.neg(G.mul(epsilon,lapVector(v))),G.neg(De(stress[0],2))),
    Ez=G.add(time(gamma),De(G.add(G.mul(b,gamma),G.mul(beta,G0),G.mul(beta,gamma),W.rz),1),
      Dz(G.add(G.mul(q(2),G0,gamma),G.pow(gamma,2),W.zz,pressure)),G.neg(G.mul(epsilon,lap(gamma))),G.neg(De(stress[1],1))),
    fluxTheta=G.mul(G.pow(R,2),G.add(G.mul(G0,v),G.mul(V,gamma),G.mul(gamma,v),W.thetaz)),
    fluxZ=G.mul(R,G.add(G.mul(q(2),G0,gamma),G.pow(gamma,2),W.zz)),divergence=G.add(De(beta,1),Dz(gamma));
  return {gr,Etheta,Ez,fluxTheta,fluxZ,divergence,equations:['8.3','8.15'],
    allBackgroundAndSixCovarianceTermsRetained:true,allAuxiliaryModesRetained:true,
    slowAndFastTimeTermsRetained:true,sourceAuthenticated:false,fullNonzeroAngularPDEConstructed:false};
}

export function exactFullMeanMomentRemainders(G,{geometry,background,previous,increment}={}){
  const b=background?.b,V=background?.V,G0=background?.G,beta=previous?.beta,v=previous?.v,gamma=previous?.gamma,
    db=increment?.beta,dv=increment?.v,dg=increment?.gamma;
  if(![b,V,G0,beta,v,gamma,db,dv,dg].every(x=>Number.isSafeInteger(x)&&G.nodes[x]))fail('Use every old, increment and base component.');
  const {R,Dz,time,De,lapVector}=originalFullMeanOperators(G,geometry),q=n=>G.q(n),
    terms={time:G.neg(time(db)),radial:G.neg(De(G.add(G.mul(q(2),b,db),G.mul(q(2),beta,db),G.pow(db,2)),1)),
      axial:G.neg(Dz(G.add(G.mul(b,dg),G.mul(G0,db),G.mul(beta,dg),G.mul(gamma,db),G.mul(db,dg)))),
      angular:G.div(G.add(G.mul(q(2),v,dv),G.pow(dv,2)),R),viscous:G.mul(geometry.epsilon,lapVector(db))},
    Rg=G.add(...Object.values(terms)),JthetaIntegrand=G.mul(G.pow(R,2),G.add(G.mul(gamma,dv),G.mul(v,dg),G.mul(dg,dv))),
    JzVelocityIntegrand=G.mul(R,G.add(G.mul(q(2),gamma,dg),G.pow(dg,2))),
    linear={PIntegrand:G.div(G.mul(q(2),V,dv),R),JthetaIntegrand:G.mul(G.pow(R,2),G.add(G.mul(G0,dv),G.mul(V,dg))),
      JzIntegrand:G.sub(G.mul(q(2),R,G0,dg),G.mul(R,V,dv))};
  return {Rg,terms,JthetaIntegrand,JzVelocityIntegrand,linear,allAuxiliaryModesRetained:true,
    allOldNewAndQuadraticTermsRetained:true,nonlinearRemaindersDeclaredZero:false,sourceAuthenticated:false};
}
