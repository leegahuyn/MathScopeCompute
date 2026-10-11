/** Closed numerical bounds for a fixed positive original band.
 * Source authentication belongs to the caller. Integer palette correlation
 * is retained before enclosing ci; no independent floor interval is multiplied
 * by a reciprocal astronomical exponential.
 */
import {fail} from './actual-continuation-arithmetic.mjs';

export function encloseFirstSelectorFromUpperComparisons(N,{ellMinimum,historicalLogScale,upperRequiredLogs}){
  if(!Array.isArray(upperRequiredLogs)||upperRequiredLogs.length!==8)
    fail('INVALID_INPUT','The original first selector has all eight required-log clauses.');
  const log2=N.log(N.point(2)),smallBand=N.mul(N.add(ellMinimum,N.point(10)),log2),
    upperMaximum=N.max([historicalLogScale,smallBand,...upperRequiredLogs]),
    lower=N.add(ellMinimum,N.point(12)),upper=N.ceil(N.div(N.add(N.log(N.point(4)),upperMaximum),log2));
  return {ell:{lower:lower.lower,upper:upper.upper},smallBand,upperMaximum,
    proof:'Each original first requiredLog is at most its independently proved upperRequiredLog. The historical and small-band clauses are retained in the same maximum. Since ellMinimum is an integer, the small-band clause implies ellA>=ellMinimum+12.',sourceAuthenticated:false};
}

export function positiveBandGeometricIntervals(N,{ell,h,u,F,gamma,g,tau,Ac,profileRadius,sigmaIntegral}){
  const q=x=>N.point(x),mul=(...xs)=>xs.reduce((a,b)=>N.mul(a,b),N.one()),
    bracket=(a,b)=>({lower:a.lower,upper:b.upper}),r0=q('1/17179869184'),Tg=N.add(q(4),N.sqrt(q(2))),Dgeom=N.sub(q(4),mul(q(2),N.sqrt(q(2)))),
    S=N.pow(ell,2),Q=N.exp(N.neg(mul(ell,N.log(q(2))))),epsilon=N.exp(mul(h,N.log(Q))),k=N.ceil(N.inverse(N.sqrt(epsilon))),
    ci=bracket(N.inverse(mul(Tg,S)),N.inverse(S)),Ls=bracket(mul(q(2),r0,S),mul(q(2),r0,Tg,S)),
    transverseMass=mul(r0,N.add(q('1/2'),sigmaIntegral)),J=mul(q('1/2'),Dgeom,ci,transverseMass),
    massScale=N.div(N.pow(r0,2),N.sqrt(mul(g,Ls))),A0=N.sqrt(N.div(tau,massScale)),
    lambda0=mul(q(2),F,gamma),gabs=mul(q(2),F,N.add(N.one(),N.pow(gamma,2))),
    norm3=N.pow(N.sqrt(N.add(N.one(),N.pow(u,2))),3),
    Bs=bracket(N.sqrt(N.div(lambda0,mul(q(4),norm3))),N.sqrt(N.div(lambda0,norm3))),
    T=N.fromClosed({lower:{rational:'15/16'},upper:{rational:'17/16'}}),R=mul(N.sqrt(T),profileRadius),
    etaBeta=N.fromClosed({lower:{rational:'1/1073741824'},upper:{rational:'1'}}),
    radialBs=bracket(N.sqrt(N.div(lambda0,mul(q(12),u))),N.sqrt(N.div(lambda0,u))),
    pTilde=N.div(mul(R,radialBs),mul(Ls,gabs)),A=N.add(q('1/2'),h),physicalQScale=N.exp(mul(N.neg(A),N.log(Q))),
    coordinateScales={r:N.inverse(N.sqrt(Q)),z:N.inverse(N.sqrt(Q)),t:N.exp(mul(N.neg(N.add(N.one(),h)),N.log(Q))),theta:N.inverse(N.sqrt(Q))},
    Omega={r:radialBs,z:Bs,t:mul(pTilde,F),theta:N.div(pTilde,R)},
    V0=mul(N.exp(mul(N.neg(N.div(N.add(N.one(),h),q(2))),N.log(Q))),etaBeta,A0),V=[V0,mul(Ac,V0),mul(u,V0)];
  return {ell,S,Q,epsilon,k,ci,Ls,r0,Tg,Dgeom,u,h,F,gamma,g,tau,Ac,profileRadius,transverseMass,J,massScale,A0,lambda0,gabs,Bs,T,R,etaBeta,pTilde,A,physicalQScale,coordinateScales,Omega,V,
    sourceAuthenticated:false,proof:{palette:'If i=floor(((1+h)*ell*log2-2logell)/logTg), then 1/(Tg*S)<ci<=1/S and 2r0*S<=Ls<2r0*Tg*S. This exact cancellation is proved before interval evaluation.',
      frequency:'k=ceil(epsilon^-1/2), 0<epsilon<1 imply 1<=epsilon*k^2<(1+sqrt(epsilon))^2<4. The original k is enclosed separately and remains in every physical derivative scale.',
      cutoff:'At this proved point every mesh offset has absolute value<9/16. The original bump is at least sigma(3/8)>exp(-5)/2>1/512. The complete three-translate square-root denominator is below2, so each factor>2^-10. The band factor is1. Thus2^-30<eta_beta<=1; this is a coarse positive enclosure, not a requested relative-accuracy claim.',
      point:'The original inverse-map proof places T in(15/16,17/16), and R=sqrt(T)*sqrt(2X). No old point-specific field or carrier value is transplanted.'}};
}

/** Simplify repeated positive factors BEFORE enclosing them. In particular
 * A0=tau^(1/2)*g^(1/4)*Ls^(1/4)/r0 and m=r0^2/(gLs)^(1/2).
 * For physical rows k^n cancels the n factors (k sqrt epsilon)^-1 in Bs.
 * This is an exact positive monomial identity followed by broad positive
 * bounds on1+u^-2,1+gamma^2 and eta_beta; no original k is assigned1.
 */
export function finiteJetClosedNumericalScale(N,s,row){
  const mul=(...x)=>x.reduce((a,b)=>N.mul(a,b),N.one()),q=x=>N.point(x),
    quarter=(x,n)=>n===0?N.one():n%4===0?N.pow(x,n/4):N.pow(N.sqrt(N.sqrt(x)),n),
    powers=(tg,gg,ll)=>mul(quarter(s.tau,tg),quarter(s.g,gg),quarter(s.Ls,ll)),D=[N.one(),s.Ac,s.u],n=row.order;
  if(row.quantity==='weightedPulse'){
    let gg,ll;const d=row.derivative;
    if(d==='v'){gg=3;ll=-1;}else if(d==='vv'){gg=5;ll=-3;}
    else if(['Rv','Zv','Tv'].includes(d)){gg=5;ll=1;}else{gg=n===1?3:5;ll=gg;}
    return N.div(mul(D[row.component],powers(2,gg,ll)),s.r0);
  }
  if(row.quantity==='pulse')return mul(D[row.component],powers(0,4*n,4*n));
  if(row.quantity==='a'||row.quantity==='wMinus')return powers(0,4*n,4*n);
  if(row.quantity==='H')return mul(D[row.component+1],N.pow(s.r0,2),powers(0,4*n-2,4*n-2));
  if(row.quantity==='y')return N.div(powers(4,4*n+2,4*n+2),N.pow(s.r0,2));
  if(row.quantity!=='physicalCurl')fail('INVALID_INPUT','Unknown finite numerical scale.');
  const ds=row.directions??[row.derivative];if(ds.length!==n||ds.some(d=>!['r','z','t','theta'].includes(d)))fail('INVALID_INPUT','Invalid physical scale directions.');
  const nt=ds.filter(x=>x==='t').length,na=ds.filter(x=>x==='theta').length,nz=ds.filter(x=>x==='z').length,ns=n-nt,
    qExponent=N.add(q(String(1+ns+2*nt)+'/2'),mul(s.h,q(String(1+n+2*nt)+'/2'))),
    Qfactor=N.exp(mul(N.neg(qExponent),N.log(s.Q))),
    uPower=-2*n-4*nz+(row.component===1||row.component===2?4:0),gammaPower=2*n+(row.component===1?4:0),
    FPower=2*n-4*na,RPower=4*nt,
    scalar=N.fromClosed({lower:{rational:'1/'+String(2n**BigInt(n+2*(nt+na)))},upper:{rational:String(2n**BigInt(n+(row.component===1?1:0)-(nt+na)))}});
  return N.div(mul(Qfactor,s.etaBeta,powers(2,1,1-4*(nt+na)),quarter(s.u,uPower),quarter(s.gamma,gammaPower),
    quarter(s.F,FPower),quarter(s.R,RPower),scalar),s.r0);
}

/** One implementation-independent scale recipe, interpreted either in an
 * exact source graph or directed numerical intervals. */
export function finiteJetPositiveScaleRecipe(O,s,row){
  const D=[O.one(),s.Ac,s.u],gL=O.mul(s.g,s.Ls),n=row.order;
  if(row.quantity==='physicalCurl'){
    const ds=row.directions??[row.derivative];
    if(ds.length!==n||ds.some(d=>!Object.hasOwn(s.Omega,d)))fail('INVALID_INPUT','Physical scale directions must be the actual one- or two-direction tuple.');
    return O.mul(s.V[row.component],O.pow(s.k,n),...ds.map(d=>s.Omega[d]),...ds.map(d=>s.coordinateScales[d]));
  }
  if(row.quantity==='weightedPulse'){
    const base=O.mul(D[row.component],s.A0),fast=row.derivative;
    return O.mul(base,fast==='v'?O.sqrt(O.div(s.g,s.Ls)):fast==='vv'?O.div(s.g,s.Ls):['Rv','Zv','Tv'].includes(fast)?s.g:n===1?O.sqrt(gL):gL);
  }
  if(row.quantity==='pulse')return O.mul(D[row.component],O.pow(gL,n));
  if(row.quantity==='a'||row.quantity==='wMinus')return O.mul(O.one(),O.pow(gL,n));
  if(row.quantity==='H')return O.mul(O.mul(D[row.component+1],s.massScale),O.pow(gL,n));
  if(row.quantity==='y')return O.mul(O.div(s.tau,s.massScale),O.pow(gL,n));
  fail('INVALID_INPUT','No source-scale recipe is defined for this quantity.');
}
