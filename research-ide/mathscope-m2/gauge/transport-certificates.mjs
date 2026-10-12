/** Source-specific classical transport enclosures for all three M1 field rules. */
import * as M from '../../mathscope-m1/gauge/matrix.mjs';
import {evaluateJet,eta} from '../../mathscope-m1/gauge/fields.mjs';
import {coordinates,fromCoordinates} from '../../mathscope-m1/gauge/groups.mjs';
import {check} from './contracts.mjs';
import * as I from './enclosures.mjs';

const zero=()=>I.point(0),one=()=>I.point(1),upper=a=>Math.max(Math.abs(a.lower),Math.abs(a.upper));
const upAdd=(a,b)=>I.nextUp(a+b),upMul=(a,b)=>I.nextUp(a*b),upDiv=(a,b)=>I.nextUp(a/b);
function rational(v){if(typeof v==='number')return I.point(v);const [p,q=1]=String(v).split('/').map(Number);check(Number.isSafeInteger(p)&&Number.isSafeInteger(q)&&q!==0,'UNSUPPORTED','Exact source matrix coefficients must have safe integer numerator and denominator.');return I.div(I.point(p),I.point(q));}
function atanSmall(x){let term=x,sum=x;for(let k=1;k<32;k++){term=I.mul(term,I.mul(x,x));const t=I.div(term,I.point(2*k+1));sum=k%2?I.sub(sum,t):I.add(sum,t);}const tail=upDiv(upMul(upper(term),upper(I.mul(x,x))),65);return {lower:I.nextDown(sum.lower-tail),upper:I.nextUp(sum.upper+tail)};}
let piCache;
export function piEnclosure(){return piCache??=I.sub(I.mul(I.point(16),atanSmall(I.div(one(),I.point(5)))),I.mul(I.point(4),atanSmall(I.div(one(),I.point(239)))));}
function trig(x,parity){
  const pi=piEnclosure(),mid=I.midpoint(x);
  if(!Number.isFinite(mid)||x.upper-x.lower>6||Math.abs(mid)>1e12)return {lower:-1,upper:1};
  const k=Math.round(mid/(2*Math.PI)),r=I.sub(x,I.mul(I.point(2*k),pi)),sq=I.mul(r,r);let term=parity==='SIN'?r:one(),sum=term;
  for(let n=1;n<=32;n++){term=I.div(I.mul(term,sq),I.point(parity==='SIN'?(2*n)*(2*n+1):(2*n-1)*(2*n)));sum=n%2?I.sub(sum,term):I.add(sum,term);}
  const power=parity==='SIN'?67:66;let tail=1;for(let n=1;n<=power;n++)tail=upDiv(upMul(tail,upper(r)),n);
  return {lower:Math.max(-1,I.nextDown(sum.lower-tail)),upper:Math.min(1,I.nextUp(sum.upper+tail))};
}
function intervalExp(x){return {lower:x.lower< -100?0:I.expEnclosure(x.lower).lower,upper:I.expEnclosure(Math.max(-100,x.upper)).upper};}
function intervalMatrix(n){return {n,re:Array.from({length:n*n},zero),im:Array.from({length:n*n},zero)};}
function addSparse(out,sparse,coefficient){for(const [i,j,re,im] of sparse.entries){const k=i*out.n+j;out.re[k]=I.add(out.re[k],I.mul(coefficient,rational(re)));out.im[k]=I.add(out.im[k],I.mul(coefficient,rational(im)));}}
export function matrixNormUpper(a){let n=0;for(let k=0;k<a.re.length;k++)n=upAdd(n,upAdd(Math.abs(a.re[k]),Math.abs(a.im[k])));return n;}
function sparseNormUpper(a){let n=0;for(const [, ,re,im] of a.entries)n=upAdd(n,upAdd(upper(rational(re)),upper(rational(im))));return n;}
function distanceToEnclosure(a,b){let n=0;for(let k=0;k<a.re.length;k++)n=upAdd(n,upAdd(Math.max(I.nextUp(Math.abs(a.re[k]-b.re[k].lower)),I.nextUp(Math.abs(a.re[k]-b.re[k].upper))),Math.max(I.nextUp(Math.abs(a.im[k]-b.im[k].lower)),I.nextUp(Math.abs(a.im[k]-b.im[k].upper)))));return n;}
export function storedMatrixDistanceUpper(a,b){return distanceToEnclosure(a,{re:Array.from(b.re,I.point),im:Array.from(b.im,I.point)});}

export function connectionEnclosure(field,x,mu){
  const s=field.spec,g=field.group,out=intervalMatrix(g.matrixDimension),z=x.map((v,i)=>I.sub(v,I.point(s.center[i])));
  if(s.kind!=='FULL_BASIS_TRIAL'){
    let D=I.mul(I.point(s.rho),I.point(s.rho));for(const v of z){const square=I.mul(v,v);square.lower=Math.max(0,square.lower);D=I.add(D,square);}
    const embedding=(g.selectedEmbedding??g.data.embedding).matrixGenerators;
    for(let a=0;a<3;a++){let N=zero();for(let nu=0;nu<4;nu++)if(eta(a,mu,nu))N=I.add(N,I.mul(I.point(2*eta(a,mu,nu)),z[nu]));addSparse(out,embedding[a],I.div(N,D));}
  }
  if(s.perturbation){
    const p=s.perturbation,ell=I.point(p.length),y=z.map(v=>I.div(v,ell)),values=p.modes.map(mode=>{
      if(p.kind==='GAUSSIAN_POLYNOMIAL'){let polynomial=one(),norm=zero();for(let j=0;j<4;j++){polynomial=I.mul(polynomial,I.pow(y[j],mode[j]));const square=I.mul(y[j],y[j]);square.lower=Math.max(0,square.lower);norm=I.add(norm,square);}return I.mul(polynomial,intervalExp(I.mul(I.point(-.5),norm)));}
      let phase=I.point(mode.phase);for(let j=0;j<4;j++){const wave=s.domain.kind==='PERIODIC_TORUS'?I.div(I.mul(I.mul(I.point(2*mode.wave[j]),piEnclosure()),one()),I.point(s.domain.periods[j])):I.div(I.point(mode.wave[j]),ell);phase=I.add(phase,I.mul(wave,z[j]));}return trig(phase,mode.parity);
    });
    const amplitude=I.div(I.point(p.amplitude),ell);
    for(let a=0;a<g.dimension;a++){let c=zero();for(let k=0;k<values.length;k++)c=I.add(c,I.mul(I.point(p.coefficients[mu][a][k]),values[k]));addSparse(out,g.data.basis.matrices[a],I.mul(amplitude,c));}
  }
  return out;
}

/** Entrywise l1 majorants dominate every matrix spectral norm used below. */
export function smoothnessBounds(field,box){
  const s=field.spec,g=field.group,R=box.map((b,j)=>Math.max(upper(I.sub(I.point(b[0]),I.point(s.center[j]))),upper(I.sub(I.point(b[1]),I.point(s.center[j]))))),bounds=Array.from({length:4},()=>({A:0,first:0,second:0}));
  if(s.kind!=='FULL_BASIS_TRIAL'){
    const rho2=I.mul(I.point(s.rho),I.point(s.rho)).lower,rho4=I.mul(I.point(rho2),I.point(rho2)).lower,rho6=I.mul(I.point(rho4),I.point(rho2)).lower,embedding=(g.selectedEmbedding??g.data.embedding).matrixGenerators;
    for(let mu=0;mu<4;mu++)for(let a=0;a<3;a++){
      const norm=sparseNormUpper(embedding[a]);let N=0;for(let j=0;j<4;j++)N=upAdd(N,upMul(2*Math.abs(eta(a,mu,j)),R[j]));
      let first=0,second=0;
      for(let j=0;j<4;j++){
        const nj=2*Math.abs(eta(a,mu,j));first=Math.max(first,upAdd(upDiv(nj,rho2),upDiv(upMul(upMul(2,R[j]),N),rho4)));
        for(let k=0;k<4;k++){const nk=2*Math.abs(eta(a,mu,k)),numerator=upAdd(upAdd(upMul(2*nj,R[k]),j===k?2*N:0),upMul(2*nk,R[j])),term1=upDiv(numerator,rho4),term2=upDiv(upMul(upMul(upMul(8,R[j]),R[k]),N),rho6);second=Math.max(second,upAdd(term1,term2));}
      }
      bounds[mu].A=upAdd(bounds[mu].A,upMul(norm,upDiv(N,rho2)));bounds[mu].first=upAdd(bounds[mu].first,upMul(norm,first));bounds[mu].second=upAdd(bounds[mu].second,upMul(norm,second));
    }
  }
  if(s.perturbation){
    const p=s.perturbation,r=R.map(v=>upDiv(v,p.length));
    const polyBound=(mode,derivatives=[])=>{const powers=mode.slice();let factor=1;for(const j of derivatives){factor*=powers[j];powers[j]--;if(factor===0)return 0;}let v=factor;for(let j=0;j<4;j++)for(let k=0;k<powers[j];k++)v=upMul(v,r[j]);return v;};
    const modeBounds=p.modes.map(m=>{
      if(p.kind==='FOURIER'){const k=m.wave.map((w,j)=>s.domain.kind==='PERIODIC_TORUS'?upDiv(upMul(2*Math.abs(w),piEnclosure().upper),s.domain.periods[j]):upDiv(Math.abs(w),p.length)),v=Math.max(...k);return [1,v,upMul(v,v)];}
      const P=polyBound(m);let first=0,second=0;
      for(let j=0;j<4;j++){
        const pj=polyBound(m,[j]);first=Math.max(first,upDiv(upAdd(pj,upMul(r[j],P)),p.length));
        for(let k=0;k<4;k++){const pk=polyBound(m,[k]),numerator=upAdd(upAdd(upAdd(polyBound(m,[j,k]),j===k?P:0),upAdd(upMul(r[j],pk),upMul(r[k],pj))),upMul(upMul(r[j],r[k]),P));second=Math.max(second,upDiv(numerator,I.nextDown(p.length*p.length)));}
      }
      return [P,first,second];
    });
    for(let mu=0;mu<4;mu++)for(let a=0;a<g.dimension;a++)for(let k=0;k<modeBounds.length;k++){
      const factor=upMul(upMul(upDiv(Math.abs(p.amplitude),p.length),Math.abs(p.coefficients[mu][a][k])),sparseNormUpper(g.data.basis.matrices[a]));
      for(const [d,name] of ['A','first','second'].entries())bounds[mu][name]=upAdd(bounds[mu][name],upMul(factor,modeBounds[k][d]));
    }
  }
  const maximum={A:Math.max(...bounds.map(x=>x.A)),first:Math.max(...bounds.map(x=>x.first)),second:Math.max(...bounds.map(x=>x.second))};
  check(Object.values(maximum).every(Number.isFinite),'BUDGET_EXCEEDED','Source-specific derivative bounds overflow; rescale the explicitly declared field/window.');
  return {box:box.map(b=>b.slice()),directionBounds:bounds,maximum,group:groupIdentity(field),method:'Analytic differentiation of the persisted BPST rational/Fourier/Gaussian-polynomial coefficient rules, with source-specific exact matrix coefficients and outward norm majorants.',orders:[0,1,2]};
}
function groupIdentity(field){return {id:field.group.id,matrixDimension:field.group.matrixDimension,exactDataHash:field.group.data.dataSha256,embedding:field.spec.embedding};}
const u=Number.EPSILON/2;
function gamma(n){return upDiv(upMul(n,u),I.nextDown(1-upMul(n,u)));}
export function additionRoundoff(a,b){return upMul(gamma(1),upAdd(matrixNormUpper(a),matrixNormUpper(b)));}
export function multiplicationRoundoff(a,b){return upAdd(upMul(gamma(8*a.n+2),upMul(matrixNormUpper(a),matrixNormUpper(b))),a.n**3*8*Number.MIN_VALUE);}
export function auditedExponential(h){
  const norm=matrixNormUpper(h);check(norm<=100,'BUDGET_EXCEEDED','Certified matrix exponential norm exceeds its explicit bound 100.');
  let squarings=0;while(norm*2**(-squarings)>1)squarings++;
  const b=M.scale(h,2**(-squarings));check(h.re.every((v,k)=>v===0||(b.re[k]!==0&&(squarings===0||Math.abs(b.re[k])>=2**-1022)))&&h.im.every((v,k)=>v===0||(b.im[k]!==0&&(squarings===0||Math.abs(b.im[k])>=2**-1022))),'PRECISION_REQUIRED','Certified exponential scaling would underflow a nonzero component.');const bNorm=matrixNormUpper(b);let term=M.identity(h.n),sum=M.identity(h.n),termError=0,sumError=0;
  for(let n=1;n<=28;n++){
    const product=M.multiply(term,b),productError=upAdd(upMul(termError,bNorm),multiplicationRoundoff(term,b));
    term=M.scale(product,1/n);termError=upAdd(upDiv(productError,n),upMul(gamma(2),upDiv(matrixNormUpper(product),n)));
    const additionError=upMul(gamma(1),upAdd(matrixNormUpper(sum),matrixNormUpper(term)));sumError=upAdd(sumError,upAdd(termError,additionError));M.addTo(sum,term);
  }
  let truncation=I.taylorExponentialTail(bNorm,28),roundoff=sumError;
  for(let k=0;k<squarings;k++){
    const size=matrixNormUpper(sum),total=upAdd(truncation,roundoff),growth=upAdd(upMul(2,size),total),local=multiplicationRoundoff(sum,sum);
    truncation=upMul(growth,truncation);roundoff=upAdd(upMul(growth,roundoff),local);sum=M.multiply(sum,sum);
  }
  return {matrix:sum,truncationUpper:truncation,roundoffUpper:roundoff,errorUpper:upAdd(truncation,roundoff),terms:28,squarings,normUpper:norm};
}

export function auditedTransport(field,x,y,steps,{method='MIDPOINT',bounds=null,exactStart=x.map(I.point),exactEnd=y.map(I.point)}={}){
  check(Number.isInteger(steps)&&steps>=1&&steps<=256,'INVALID_INPUT','Certified transport steps must be in [1,256].');
  const directions=x.map((v,j)=>v!==y[j]?j:null).filter(j=>j!==null);check(directions.length===1,'UNSUPPORTED','Certified transport currently follows one straight coordinate-aligned link.');
  const mu=directions[0],dx=(y[mu]-x[mu])/steps,dxI=I.div(I.sub(exactEnd[mu],exactStart[mu]),I.point(steps)),box=x.map((v,j)=>[Math.min(v,y[j],exactStart[j].lower,exactEnd[j].lower),Math.max(v,y[j],exactStart[j].upper,exactEnd[j].upper)]);
  bounds??=smoothnessBounds(field,box);const d=bounds.directionBounds[mu],length=upper(I.sub(exactEnd[mu],exactStart[mu]));
  if(field.spec.domain.kind==='R4_WINDOW')check(box.every((b,j)=>b[0]>=field.spec.domain.bounds[j][0]&&b[1]<=field.spec.domain.bounds[j][1]),'INVALID_INPUT','Every certified transport path must remain in the declared source window.');
  check(['MIDPOINT','TRAPEZOID'].includes(method),'INVALID_INPUT','A certified generator rule must be MIDPOINT or TRAPEZOID.');
  const cubic=upDiv(upMul(upMul(length,length),length),steps*steps),constant=upAdd(upDiv(upMul(d.A,d.first),6),upDiv(d.second,method==='MIDPOINT'?24:6)),discretization=upMul(cubic,constant);
  let U=M.identity(field.group.matrixDimension),channels={sourceEvaluation:0,exponentialTruncation:0,exponentialRoundoff:0,productRoundoff:0};
  for(let k=0;k<steps;k++){
    const positions=method==='MIDPOINT'?[k+.5]:[k,k+1],h=M.matrix(U.n),target=intervalMatrix(U.n);
    for(const at of positions){
      const node=x.slice();node[mu]+=at*dx;const nodeI=exactStart.map(v=>({...v}));nodeI[mu]=I.add(exactStart[mu],I.mul(I.point(at),dxI));
      const A=evaluateJet(field,node,{order:0}).A[mu],AI=connectionEnclosure(field,nodeI,mu),factor=1/positions.length;
      M.addTo(h,A,dx*factor);
      for(let j=0;j<h.re.length;j++){target.re[j]=I.add(target.re[j],I.mul(AI.re[j],I.mul(dxI,I.point(factor))));target.im[j]=I.add(target.im[j],I.mul(AI.im[j],I.mul(dxI,I.point(factor))));}
    }
    check(M.distance(h,M.scale(M.dagger(h),-1))===0,'PRECISION_REQUIRED','The computed transport generator must be exactly anti-Hermitian in its stored Float64 entries for this unitary Duhamel bound.');
    const sourceError=distanceToEnclosure(h,target),exponential=auditedExponential(h),e=upAdd(sourceError,exponential.errorUpper),local=multiplicationRoundoff(U,exponential.matrix),growth=upAdd(1,e);
    for(const key of Object.keys(channels))channels[key]=upMul(channels[key],growth);
    channels.sourceEvaluation=upAdd(channels.sourceEvaluation,sourceError);channels.exponentialTruncation=upAdd(channels.exponentialTruncation,exponential.truncationUpper);channels.exponentialRoundoff=upAdd(channels.exponentialRoundoff,exponential.roundoffUpper);channels.productRoundoff=upAdd(channels.productRoundoff,local);
    U=M.multiply(U,exponential.matrix);
  }
  let errorUpper=discretization;for(const v of Object.values(channels))errorUpper=upAdd(errorUpper,v);
  return {matrix:U,certificate:{status:'DIRECTED_FLOAT64_ERROR_ENCLOSURE',method,steps,coordinateDirection:mu,lengthUpper:length,discretizationUpper:discretization,...channels,errorUpper,sourceSpecificGroup:groupIdentity(field),sourceBounds:bounds,proof:'Duhamel expansion about the segment midpoint gives L³/N² (M2/24+M0 M1/6). Trapezoidal generators add L³ M2/(8N²). Anti-Hermitian exact source transports are unitary. Source interval evaluation, 28-term Taylor remainder, every matrix arithmetic roundoff, and product propagation are bounded separately.',boundary:'The target is the declared finite straight path. The certificate is invalid for a path outside the source domain; no infinite-window tail is included.'}};
}

export function localCurvatureBound(bounds,a,b,linkError,{areaLower=null}={}){
  const {A:M0,first:M1,second:M2}=bounds.maximum,p=upMul(2,upAdd(a,b)),area=areaLower??I.nextDown(a*b),z=upMul(p,M0);
  check(z<=100,'BUDGET_EXCEEDED','Local Wilson-loop Dyson majorant exceeds 100; refine the physical spacing.');
  const first=upMul(M2,upAdd(a,b)),second=upDiv(upMul(upMul(p,p),upMul(upMul(M0,M1),upAdd(a,b))),area),third=upDiv(upMul(I.expEnclosure(z).upper,upDiv(upMul(upMul(z,z),z),6)),area);
  return {upper:upAdd(upAdd(first,second),upAdd(third,upDiv(linkError,area))),terms:{derivativeVariation:first,secondDysonVariation:second,thirdAndHigherDyson:third,linkAndFloatErrors:upDiv(linkError,area)},order:'O(max(as,at)) for bounded anisotropy and bounded source derivatives',proof:'Stokes bounds the first Dyson term; replacing the two factors in the second term by their basepoint values gives p² M0 M1(a+b); the remaining ordered series is bounded by (p M0)³ exp(p M0)/6. Anti-Hermitian extraction and orthogonal Lie projection are contractions.'};
}

const inverseGrams=new Map();
function gramInverseEnclosure(group){
  if(inverseGrams.has(group.id))return inverseGrams.get(group.id);
  const n=group.dimension,a=group.data.gram.map((r,i)=>[...r.map(rational),...Array.from({length:n},(_,j)=>I.point(+(i===j)))]);
  for(let j=0;j<n;j++){
    let pivot=j;for(let k=j+1;k<n;k++)if(Math.abs(I.midpoint(a[k][j]))>Math.abs(I.midpoint(a[pivot][j])))pivot=k;
    [a[j],a[pivot]]=[a[pivot],a[j]];const d=a[j][j];check(d.lower>0||d.upper<0,'PRECISION_REQUIRED','The exact Gram inverse could not be enclosed by this directed-precision elimination.');
    for(let k=0;k<2*n;k++)a[j][k]=I.div(a[j][k],d);
    for(let i=0;i<n;i++)if(i!==j){const factor=a[i][j];for(let k=0;k<2*n;k++)a[i][k]=I.sub(a[i][k],I.mul(factor,a[j][k]));}
  }
  const inverse=a.map(r=>r.slice(n));inverseGrams.set(group.id,inverse);return inverse;
}
export function projectedCurvatureWithError(group,U,area,{loops=1,exactArea=I.point(area)}={}){
  const anti=M.scale(M.addTo(M.clone(U),M.dagger(U),-1),1/(2*loops*area)),F=fromCoordinates(group,coordinates(group,anti)),target=intervalMatrix(U.n),den=I.mul(I.point(2*loops),exactArea);
  for(let i=0;i<U.n;i++)for(let j=0;j<U.n;j++){const k=i*U.n+j,t=j*U.n+i;target.re[k]=I.div(I.sub(I.point(U.re[k]),I.point(U.re[t])),den);target.im[k]=I.div(I.add(I.point(U.im[k]),I.point(U.im[t])),den);}
  const metric=rational(group.data.metricTraceFactor),rhs=group.data.basis.matrices.map(b=>{
    let trace=zero();for(const [i,j,re,im] of b.entries){const k=j*U.n+i;trace=I.add(trace,I.sub(I.mul(rational(re),target.re[k]),I.mul(rational(im),target.im[k])));}return I.mul(I.mul(I.point(-1),metric),trace);
  }),inverse=gramInverseEnclosure(group),coefficients=inverse.map(row=>row.reduce((s,v,j)=>I.add(s,I.mul(v,rhs[j])),zero())),projected=intervalMatrix(U.n);
  coefficients.forEach((c,i)=>addSparse(projected,group.data.basis.matrices[i],c));
  return {matrix:F,projectionRoundoffUpper:distanceToEnclosure(F,projected),exactProjection:'The exact rational compact basis, exact Gram inverse enclosed by interval elimination, and B=-c ReTr are used; this is not an assumption that anti(U) lies in the Lie algebra.'};
}
export function invariantInnerEnclosure(group,A,B){
  let trace=zero();for(let i=0;i<A.n;i++)for(let j=0;j<A.n;j++){const k=i*A.n+j,t=j*A.n+i;trace=I.add(trace,I.sub(I.mul(I.point(A.re[k]),I.point(B.re[t])),I.mul(I.point(A.im[k]),I.point(B.im[t]))));}
  return I.mul(I.mul(I.point(-1),rational(group.data.metricTraceFactor)),trace);
}
export function metricFactorEnclosure(group){return rational(group.data.metricTraceFactor);}
