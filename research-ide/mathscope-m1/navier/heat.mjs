import {ComputeError,point,interval,iadd,isub,imul,idiv,iscale,ipow,iexp,ilog,ipower,ball,midpoint,maxabs,nextUp,nextDown,jvar,jconst,jadd,jsub,jmul,jscale,jexp,jlog,certifiedSimpson,integrate,makeBudget,positive,finiteNumber} from './numerics.mjs';

const validateH=h=>{h=finiteNumber(h,'h');if(!(h>0&&h<.01))throw new ComputeError('INVALID_INPUT','0 < h < .01 required');return h;};
const rising=(h,m)=>{let v=1;for(let i=0;i<m;i++)v*=h+i;return v;};
const risingI=(h,m)=>{let v=point(1);for(let i=0;i<m;i++)v=imul(v,iadd(point(h),point(i)));return v;};
function integrandJet(y,Z,h,m){
  const yj=jvar(y),v=jexp(yj),a=iadd(point(h),point(m)),ap1=iadd(a,point(1));
  return jexp(jsub(jsub(jscale(yj,ap1),v),jscale(jlog(jadd(jconst(1),jscale(v,Z))),a)));
}
function integrandBall(y,Z,h,m){const v=iexp(y),a=iadd(point(h),point(m)),ap1=iadd(a,point(1));return iexp(isub(isub(iscale(y,ap1),v),iscale(ilog(iadd(point(1),iscale(v,Z))),a)));}
function derivativeFourth(y,Z,h,m){return iscale(integrandJet(y,Z,h,m)[4],24);}
export function heatIntegralCertificate({Z=1,h=.005,derivativeOrder=2,tolerance=1e-8}={},budget=makeBudget()){
  Z=finiteNumber(Z,'Z');if(Z<0)throw new ComputeError('INVALID_INPUT','Z >= 0 required');h=validateH(h);
  if(!Number.isInteger(derivativeOrder)||derivativeOrder<0||derivativeOrder>4)throw new ComputeError('UNSUPPORTED','Derivative orders 0..4 are supported');
  const L=-40,R=6,vLow=iexp(point(L)),V=iexp(point(R));
  const integrateMoment=(z,m)=>{
    const a=iadd(point(h),point(m)),ap1=iadd(a,point(1)),quad=certifiedSimpson(y=>integrandBall(y,z,h,m),y=>derivativeFourth(y,z,h,m),L,R,tolerance/48,budget);
    const left=idiv(ipower(vLow,ap1),ap1);
    const upper=idiv(imul(ipower(V,a),iexp([-V[1],-V[0]])),isub(point(1),idiv(a,V)));
    const tail=nextUp(left[1]+upper[1]);
    return {...quad,box:[Math.max(0,quad.box[0]),nextUp(quad.box[1]+tail)],leftTail:left[1],upperTail:upper[1],tail};
  };
  const denominator=integrateMoment(0,0);const derivatives=[],errors=[];
  for(let m=0;m<=derivativeOrder;m++){
    const numerator=Z===0&&m===0?denominator:integrateMoment(Z,m),factor=risingI(h,m),ratio=idiv(numerator.box,denominator.box);
    let value=imul(factor,ratio);if(m%2)value=[-value[1],-value[0]];
    derivatives.push(ball(value));errors.push({order:m,quadratureNumerator:numerator.quadrature,tailNumerator:numerator.tail,quadratureDenominator:denominator.quadrature,tailDenominator:denominator.tail,cells:numerator.cells,roundingAndPropagationIncluded:true});
  }
  if(Z===0)derivatives[0]=ball(point(1));
  const H=derivatives[0],dH=derivatives[1],ddH=derivatives[2];let odeEnclosure=null;
  if(ddH){const a=x=>[x.lower,x.upper],hi=point(h),zi=point(Z);odeEnclosure=ball(iadd(iadd(imul(a(ddH),imul(zi,zi)),imul(a(dH),iadd(point(1),imul(iadd(point(2),iscale(hi,2)),zi)))),imul(a(H),imul(hi,iadd(point(1),hi)))));}
  const complete=derivatives.every(x=>x.radius<=tolerance);
  return {status:complete?'VERIFIED_NUMERICAL_ENCLOSURE':'PRECISION_REQUIRED',model:'paper-heat-factor',Z,h,derivatives,H:H.midpoint,dH:dH?.midpoint,ddH:ddH?.midpoint,odeEnclosure,
    certificate:{kind:'REAL_INTERVAL_QUADRATURE',method:'log-variable integral; outward arithmetic; bounded exp/log series; Simpson fourth derivative enclosure',domain:'Z>=0, 0<h<.01; finite input parameters',tolerance,logIntegrationDomain:[L,R],vIntegrationDomain:[vLow[0],V[1]],gammaNormalization:ball(denominator.box),errors,notClaimed:'No full PDE solution error or global profile theorem is inferred.'},
    sources:[{source:'N00',pages:[138],equations:['A.32','A.35','A.38']}],budget:budget.snapshot()};
}
const cache=new Map();
export function heatFast(Z,h=.005,tolerance=2e-11,budget=makeBudget()){
  Z=finiteNumber(Z,'Z');if(Z<0)throw new ComputeError('INVALID_INPUT','Z >= 0');h=validateH(h);const key=`${Z}:${h}:${tolerance}`;
  if(cache.has(key))return {...cache.get(key)};
  const moments=[];let maxError=0;
  const den=integrate(y=>Math.exp((h+1)*y-Math.exp(y)),-40,6,tolerance,budget);
  for(let m=0;m<=2;m++){const a=h+m,r=integrate(y=>{const v=Math.exp(y);return Math.exp((a+1)*y-v-a*Math.log1p(Z*v));},-40,6,tolerance,budget);moments.push((m%2?-1:1)*rising(h,m)*r.value/den.value);maxError=Math.max(maxError,r.errorEstimate);}
  if(Z===0)moments[0]=1;
  const r={H:moments[0],dH:moments[1],ddH:moments[2],estimatedQuadratureError:maxError,certified:false,method:'independent adaptive Simpson value path in log coordinate'};
  if(cache.size>2048)cache.clear();cache.set(key,r);return {...r};
}
export function exteriorJet(r,{tau=.1,h=.005,viscosity=1,cInfinity=1,tolerance=2e-11}={},budget=makeBudget()){
  r=positive(r,'r');tau=positive(tau,'tau');viscosity=positive(viscosity,'viscosity');cInfinity=positive(cInfinity,'cInfinity');h=validateH(h);
  const rootNu=Math.sqrt(viscosity),rn=r/rootNu,m=1+2*h,C=cInfinity*2**(.5+h),Z=4*tau/(rn*rn),P=heatFast(Z,h,tolerance,budget);
  const K0=C*rn**(-m)*P.H,dr0=C*rn**(-m-1)*(-m*P.H-2*Z*P.dH),drr0=C*rn**(-m-2)*(m*(m+1)*P.H+(4*m+6)*Z*P.dH+4*Z*Z*P.ddH),dt0=-4*C*rn**(-m-2)*P.dH;
  if(![rootNu*K0,dr0,drr0/rootNu,rootNu*dt0,(rootNu*K0)**2/r].every(Number.isFinite))throw new ComputeError('PRECISION_REQUIRED','Exterior velocity or derivative exceeds the finite binary64 range; use logarithmic coordinates or higher precision');
  return {K:rootNu*K0,dr:dr0,drr:drr0/rootNu,dt:rootNu*dt0,pressureRadial:(rootNu*K0)**2/r,Z,heat:P,domain:{excludeAxis:true,finiteEnergyR3:false},normalization:{cInfinity,proofSelected:false}};
}
export function exteriorPoint(position,options={},budget=makeBudget()){
  const [x,y,z]=position,r=Math.hypot(x,y);if(!(r>0))throw new ComputeError('EXCLUDED_DOMAIN','The exterior component excludes the cylindrical axis',{position});
  const j=exteriorJet(r,options,budget);return {position:[x,y,z],velocity:[-j.K*y/r,j.K*x/r,0],pressureGradient:[j.pressureRadial*x/r,j.pressureRadial*y/r,0],vorticity:[0,0,j.dr+j.K/r],speed:Math.abs(j.K),jet:j,scope:'Actual paper exterior formula; standalone component; no core/global gluing or compact force.'};
}
export function taylorGreenPoint([x,y,z],{time=0,viscosity=1,amplitude=1,waveNumber=1,pressureSign=1}={}){
  viscosity=positive(viscosity,'viscosity');time=finiteNumber(time,'time');const k=positive(waveNumber,'waveNumber'),a=amplitude*Math.exp(-2*viscosity*k*k*time),sx=Math.sin(k*x),cx=Math.cos(k*x),sy=Math.sin(k*y),cy=Math.cos(k*y);
  return {position:[x,y,z],velocity:[a*sx*cy,-a*cx*sy,0],pressure:pressureSign*a*a/4*(Math.cos(2*k*x)+Math.cos(2*k*y)),pressureGradient:pressureSign===0?[0,0,0]:[-pressureSign*a*a*k/2*Math.sin(2*k*x),-pressureSign*a*a*k/2*Math.sin(2*k*y),0],vorticity:[0,0,2*a*k*sx*sy],speed:Math.hypot(a*sx*cy,a*cx*sy),meanEnergy:a*a/4,meanEnstrophy:a*a*k*k/2,meanDissipation:viscosity*a*a*k*k,scope:'Separate exact periodic fixture; not the source blowup construction.'};
}
export function heatTaylorFinite(Z,h=.005,N=8){
  validateH(h);if(!(Z>=0)||!Number.isInteger(N)||N<0||N>100)throw new ComputeError('INVALID_INPUT','Taylor inputs outside bounds');
  let term=point(1),sum=point(1);
  for(let n=0;n<N;n++){const a=iadd(point(h),point(n));term=iscale(idiv(imul(imul(term,a),iadd(point(1),a)),point(n+1)),-Z);sum=iadd(sum,term);}
  const a=iadd(point(h),point(N)),first=idiv(imul(imul(term,a),iadd(point(1),a)),point(N+1));const error=imul(point(maxabs(first)),point(Z))[1];
  return {sum:ball(sum),remainderBound:error,enclosure:ball([nextDown(sum[0]-error),nextUp(sum[1]+error)]),N,Z,h,convergentInfiniteSeries:false,radiusOfConvergence:0,reason:'Absolute coefficient ratio (h+n)(1+h+n)/(n+1) tends to infinity for h>0.',source:{source:'N00',page:138,equation:'A.35'}};
}
