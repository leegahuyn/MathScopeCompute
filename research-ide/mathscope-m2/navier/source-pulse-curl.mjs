/**
 * Source equation (7.38) as a local harmonic differential operator.
 *
 * The numerical probe is a smooth, explicitly supplied coefficient function,
 * not the unevaluated N3/N4 background or the Lemma 7.4 growing solution.
 * Exact polynomial identities below establish the operator identities; floating
 * jets and Cartesian differences are independent numerical diagnostics.
 */
import {sourceExponentContract,SOURCE_PROFILE_ID} from './source-profile.mjs';

const VARIABLES=['R','Z','Y1','Y2'];
const MAX_ORDER=3;
const POWERS=[];
for(let total=0;total<=MAX_ORDER;total++)for(let a=0;a<=total;a++)for(let b=0;b<=total-a;b++)for(let c=0;c<=total-a-b;c++)POWERS.push([a,b,c,total-a-b-c]);
const KEY=new Map(POWERS.map((p,i)=>[p.join(','),i]));
const DEGREE=POWERS.map(p=>p.reduce((a,b)=>a+b,0));
const finite=(x,name)=>{if(typeof x!=='number'||!Number.isFinite(x))throw Object.assign(Error(name+' must be finite.'),{code:'INVALID_INPUT'});return x;};
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const scalarValue=x=>typeof x==='number'?x:x.coefficients[0];

/** Normalized Taylor coefficients, not raw derivatives. Every operation keeps
 * its known order, so differentiating an unknown high-order coefficient cannot
 * silently turn it into a purported zero derivative. */
export function createPulseJetAlgebra(coordinates){
  for(const v of VARIABLES)finite(coordinates[v],v);
  const make=(coefficients,order=MAX_ORDER)=>({coefficients,order});
  const constant=(x,order=MAX_ORDER)=>{const c=Array(POWERS.length).fill(0);c[0]=finite(x,'jet constant');return make(c,order);};
  const cast=x=>typeof x==='number'?constant(x):x;
  const add=(x,y)=>{x=cast(x);y=cast(y);const order=Math.min(x.order,y.order);return make(POWERS.map((p,i)=>DEGREE[i]<=order?x.coefficients[i]+y.coefficients[i]:0),order);};
  const scale=(x,s)=>{x=cast(x);finite(s,'jet multiplier');return make(x.coefficients.map(c=>c*s),x.order);};
  const sub=(x,y)=>add(x,scale(y,-1));
  const mul=(x,y)=>{x=cast(x);y=cast(y);const order=Math.min(x.order,y.order),out=Array(POWERS.length).fill(0);for(let i=0;i<POWERS.length;i++)if(DEGREE[i]<=order&&x.coefficients[i]!==0)for(let j=0;j<POWERS.length;j++)if(DEGREE[i]+DEGREE[j]<=order&&y.coefficients[j]!==0){const key=POWERS[i].map((v,k)=>v+POWERS[j][k]).join(',');out[KEY.get(key)]+=x.coefficients[i]*y.coefficients[j];}return make(out,order);};
  const compose=(x,derivatives)=>{x=cast(x);const dx=sub(x,scalarValue(x));let term=constant(1,x.order),out=constant(derivatives[0],x.order),factorial=1;for(let k=1;k<=x.order;k++){term=mul(term,dx);factorial*=k;out=add(out,scale(term,derivatives[k]/factorial));}return out;};
  const inv=x=>{x=cast(x);const a=scalarValue(x);if(a===0)fail('A jet denominator is zero.');return compose(x,[1/a,-1/a**2,2/a**3,-6/a**4]);};
  const div=(x,y)=>mul(x,inv(y));
  const pow=(x,p)=>{x=cast(x);finite(p,'power');const a=scalarValue(x);if(!(a>0))fail('A real jet power requires a strictly positive base.');return compose(x,[a**p,p*a**(p-1),p*(p-1)*a**(p-2),p*(p-1)*(p-2)*a**(p-3)]);};
  const exp=x=>{x=cast(x);const a=Math.exp(scalarValue(x));if(!Number.isFinite(a))fail('Jet exponential overflow.');return compose(x,[a,a,a,a]);};
  const sin=x=>{x=cast(x);const a=scalarValue(x);return compose(x,[Math.sin(a),Math.cos(a),-Math.sin(a),-Math.cos(a)]);};
  const cos=x=>{x=cast(x);const a=scalarValue(x);return compose(x,[Math.cos(a),-Math.sin(a),-Math.cos(a),Math.sin(a)]);};
  const derivative=(x,variable)=>{x=cast(x);if(x.order<1)fail('A requested derivative exceeds the supplied jet order.');const axis=typeof variable==='number'?variable:VARIABLES.indexOf(variable);if(axis<0||axis>=4)fail('Unknown jet derivative variable.');const out=Array(POWERS.length).fill(0);for(let i=0;i<POWERS.length;i++)if(DEGREE[i]<x.order){const p=POWERS[i].slice();p[axis]++;out[i]=p[axis]*x.coefficients[KEY.get(p.join(','))];}return make(out,x.order-1);};
  const variable=name=>{const x=constant(coordinates[name]),p=[0,0,0,0];p[VARIABLES.indexOf(name)]=1;x.coefficients[KEY.get(p.join(','))]=1;return x;};
  const fromDerivatives=(value,entries={})=>{const x=constant(value);for(const[key,v]of Object.entries(entries)){const p=key.split(',').map(Number),i=KEY.get(p.join(','));if(i===undefined)fail('Unknown derivative multi-index.');let factorial=1;for(const a of p)for(let j=2;j<=a;j++)factorial*=j;x.coefficients[i]=finite(v,'derivative')/factorial;}return x;};
  const bump=(x,center,width)=>{if(!(width>0))fail('A smooth cutoff width must be positive.');const y=scale(sub(x,center),1/width);if(Math.abs(scalarValue(y))>=1)return constant(0,cast(x).order);return exp(sub(1,inv(sub(1,mul(y,y)))));};
  return {variables:Object.fromEntries(VARIABLES.map(v=>[v,variable(v)])),constant,cast,add,sub,scale,mul,div,inv,pow,exp,sin,cos,derivative,fromDerivatives,bump,value:scalarValue,coefficients:x=>cast(x).coefficients.slice(),powers:POWERS.map(p=>p.slice())};
}

function complexAlgebra(J){
  const cast=x=>Array.isArray(x)?[J.cast(x[0]),J.cast(x[1])]:[J.cast(x),J.constant(0)];
  const add=(x,y)=>{x=cast(x);y=cast(y);return [J.add(x[0],y[0]),J.add(x[1],y[1])];};
  const sub=(x,y)=>{x=cast(x);y=cast(y);return [J.sub(x[0],y[0]),J.sub(x[1],y[1])];};
  const scale=(x,s)=>{x=cast(x);return [J.mul(x[0],s),J.mul(x[1],s)];};
  const mul=(x,y)=>{x=cast(x);y=cast(y);return [J.sub(J.mul(x[0],y[0]),J.mul(x[1],y[1])),J.add(J.mul(x[0],y[1]),J.mul(x[1],y[0]))];};
  const timesI=x=>{x=cast(x);return [J.scale(x[1],-1),x[0]];};
  const conjugate=x=>{x=cast(x);return [x[0],J.scale(x[1],-1)];};
  const value=x=>{x=cast(x);return x.map(J.value);};
  const derivative=(x,D)=>cast(x).map(D);
  const dot=(n,t)=>n.reduce((s,x,i)=>add(s,scale(t[i],x)),cast(0));
  const cross=(n,t)=>[sub(scale(t[2],n[1]),scale(t[1],n[2])),sub(scale(t[0],n[2]),scale(t[2],n[0])),sub(scale(t[1],n[0]),scale(t[0],n[1]))];
  return {cast,add,sub,scale,mul,timesI,conjugate,value,derivative,dot,cross};
}

const magnitude=z=>Math.hypot(z[0],z[1]);
const cartesian=(v,theta)=>[v[0]*Math.cos(theta)-v[1]*Math.sin(theta),v[0]*Math.sin(theta)+v[1]*Math.cos(theta),v[2]];
const phaseReal=(a,phase)=>a[0]*Math.cos(phase)-a[1]*Math.sin(phase);

/**
 * Generic source harmonic jet -> C_m -> full normalized curl.
 *
 * callbacks return jets in R,Z,Y1,Y2; slowFields must be auxiliary independent.
 * amplitude receives nPhi and may return any supplied tangent complex jet.
 * A seed is an alternative *definition* t=nPhi cross seed, never a projection
 * that silently changes a prescribed non-tangent amplitude.
 */
export function evaluateSourcePulseCurl(options){
  const {coordinates,operators,phase,slowFields,pulseCoordinate,amplitude,seed,cutoff,physicalScale}=options;
  if(!coordinates||!operators||!phase||typeof slowFields!=='function'||typeof pulseCoordinate!=='function')fail('Coordinate, operator, phase, slow-field and pulse-coordinate providers are required.');
  const R=finite(coordinates.R,'R'),epsilon=finite(operators.epsilon,'epsilon'),Mi=finite(operators.Mi,'Mi'),dr=finite(operators.dr,'dr'),vr=operators.vr;
  if(!(R>0&&epsilon>0&&epsilon<=1&&Array.isArray(vr)&&vr.length===2&&vr.every(Number.isFinite)))fail('The source curl chart needs R>0, 0<epsilon<=1, and a two-vector v_r.');
  const k=finite(phase.k,'k'),m=finite(phase.m??1,'m'),p=finite(phase.p,'p'),pz=finite(phase.pz,'pz'),x0=finite(phase.x0,'x0');
  if(!Number.isSafeInteger(k)||k<1||!Number.isSafeInteger(m)||m===0||!Number.isSafeInteger(k*p)||k*p===0)fail('k must be positive integer, m nonzero integer, and k*p a nonzero integer.');
  if((typeof amplitude==='function')===(typeof seed==='function'))fail('Supply exactly one prescribed tangent amplitude or a seed defining the amplitude.');
  const J=createPulseJetAlgebra(coordinates),C=complexAlgebra(J),v=J.cast(pulseCoordinate(J.variables,J)),{F:inputF,G:inputG}=slowFields(J.variables,J),F=J.cast(inputF),G=J.cast(inputG),a=J.scale(J.pow(J.variables.R,dr-1),Mi*dr);
  const Dr=x=>J.add(J.derivative(x,'R'),J.mul(a,J.add(J.scale(J.derivative(x,'Y1'),vr[0]),J.scale(J.derivative(x,'Y2'),vr[1]))));
  const Dz=x=>J.scale(J.derivative(x,'Z'),epsilon);
  const maxCoefficients=x=>Math.max(...J.coefficients(x).map(Math.abs));
  for(const field of [F,G])if(maxCoefficients(J.derivative(field,'Y1'))>1e-12||maxCoefficients(J.derivative(field,'Y2'))>1e-12)fail('The source base F,G must be auxiliary independent.');
  const pulseRadial=Dr(v),pulseAxial=Dz(v);
  if(maxCoefficients(pulseRadial)>1e-10||maxCoefficients(pulseAxial)>1e-10)fail('The prescribed source pulse coordinate must satisfy D_r v=D_z v=0.');
  const phaseBase=J.sub(J.add(J.scale(J.variables.Z,pz/epsilon),J.scale(J.variables.R,x0)),J.mul(v,J.add(J.scale(F,p),J.scale(G,pz))));
  const normal=[Dr(phaseBase),J.div(p,J.variables.R),Dz(phaseBase)],normalSquare=normal.reduce((sum,x)=>J.add(sum,J.mul(x,x)),J.constant(0));
  if(!(J.value(normalSquare)>1e-20))fail('The phase normal requires a positive nonzero denominator.');
  const data={...J.variables,F,G,v,nPhi:normal,complex:C,Dr,Dz};
  let t;
  if(seed)t=C.cross(normal,seed(data,J).map(C.cast));
  else t=amplitude(data,J).map(C.cast);
  if(t.length!==3)fail('The harmonic amplitude must have three components.');
  if(cutoff){const chi=J.cast(cutoff(data,J));t=t.map(x=>C.scale(x,chi));}
  const tangent=C.dot(normal,t),tangentValue=magnitude(C.value(tangent)),tangentJetNorm=Math.max(...tangent.flatMap(J.coefficients).map(Math.abs)),amplitudeJetNorm=1+Math.max(...t.flatMap(x=>x.flatMap(J.coefficients)).map(Math.abs));
  if(tangentJetNorm>1e-9*amplitudeJetNorm)fail('The prescribed amplitude jet does not satisfy nPhi dot t_m=0; it is not projected or repaired.');
  const omega=k*m,Cm=C.cross(normal,t).map(x=>C.scale(C.timesI(x),J.div(1,J.scale(normalSquare,omega))));
  const CDr=Cm.map(x=>C.derivative(x,Dr)),CDz=Cm.map(x=>C.derivative(x,Dz));
  const remainder=[C.scale(CDz[1],-1),C.sub(CDz[0],CDr[2]),C.add(CDr[1],C.scale(Cm[1],J.inv(J.variables.R)))];
  const full=t.map((x,i)=>C.add(x,remainder[i]));
  const divergence=u=>C.add(C.add(C.derivative(u[0],Dr),C.scale(u[0],J.inv(J.variables.R))),C.add(C.derivative(u[2],Dz),C.scale(C.timesI(C.dot(normal,u)),omega)));
  const fullDivergence=C.value(divergence(full)),omittedRemainderDivergence=C.value(divergence(t));
  const leadingFromPotential=C.cross(normal,Cm).map(x=>C.scale(C.timesI(x),omega));
  const Q=finite(physicalScale?.Q??1,'Q'),h=finite(physicalScale?.h??0,'numerical h');if(!(Q>0&&Q<=1&&h>=0&&h<.5))fail('The finite physical scale must satisfy 0<Q<=1 and 0<=h<1/2.');
  if(Math.abs(Q**h-epsilon)>1e-12*Math.max(1,epsilon))fail('The numerical physical scale must satisfy epsilon=Q^h; a different axial scale is not the source curl.');
  const A=.5+h,D=.5-h,scalePotential=Q**(.5-A),scaleVelocity=Q**(-A),theta=finite(coordinates.theta??0,'theta'),thetaPhase=omega*(J.value(phaseBase)+p*theta);
  if(!Number.isFinite(scalePotential)||!Number.isFinite(scaleVelocity))fail('Physical scale overflow; use a symbolic scale domain instead.');
  const value={t:t.map(C.value),Cm:Cm.map(C.value),remainder:remainder.map(C.value),full:full.map(C.value),normal:normal.map(J.value)};
  const realPotential=cartesian(value.Cm.map(x=>scalePotential*phaseReal(x,thetaPhase)),theta),realVelocity=cartesian(value.full.map(x=>scaleVelocity*phaseReal(x,thetaPhase)),theta),realLeadingVelocity=cartesian(value.t.map(x=>scaleVelocity*phaseReal(x,thetaPhase)),theta);
  const covariance=u=>[.5*(u[0][0]*u[1][0]+u[0][1]*u[1][1]),.5*(u[0][0]*u[2][0]+u[0][1]*u[2][1])];
  return {schema:'mathscope.source-pulse-curl-jet/1',value,phase:{k,m,p,pz,x0,epsilon,phaseBase:J.value(phaseBase),thetaPhase,angularFrequency:omega*p,labelsFrozen:true},operators:{Dr:'partial_R+Mi*d_r*R^(d_r-1)*(v_r dot grad_Y)',Dz:'epsilon*partial_Z',Mi,dr,vr:vr.slice(),epsilon,pulseCoordinate:{Dr:J.value(pulseRadial),Dz:J.value(pulseAxial)}},jet:{variables:VARIABLES.slice(),inputOrder:3,normalOrder:normal[0].order,potentialOrder:Cm[0][0].order,remainderOrder:remainder[0][0].order,divergenceOrder:0,retainsAllMixedAuxiliaryDerivatives:true},diagnostics:{normalSquare:J.value(normalSquare),tangentValue,tangentJetNorm,fullDivergence,omittedRemainderDivergence,leadingReconstructionError:Math.max(...t.map((x,i)=>magnitude(C.value(C.sub(x,leadingFromPotential[i])))))},covariance:{angularConvention:'Re(a*exp(i*k*m*Phi)); normalized angular average is 1/2 Re(a_r conjugate(a_tan)).',full:covariance(value.full),withoutRemainder:covariance(value.t)},physical:{Q,hNumericalProbe:h,A,D,scalePotential,scaleVelocity,scaleIdentity:'Q^(1/2-A) * Q^(-1/2) = Q^(-A)',realPotential,realVelocity,realLeadingVelocity},scope:{kind:'GENERIC_SOURCE_HARMONIC_OPERATOR_ON_SUPPLIED_JETS',numericalArithmetic:'BINARY64_DIAGNOSTIC',transversalityPremise:seed?'EXACT_CROSS_PRODUCT_DEFINITION':'SUPPLIED_AMPLITUDE_NUMERIC_JET_CHECK; exact transversality remains the caller premise',globalN3PulseEvaluated:false,newLeanKernelExecution:false}};
}

/* Exact commutative polynomial calculation of the cylindrical source curl.
 * w is the formal scalar i*k*m. Coefficients can be complex; no analytic or
 * floating-point assumption is used by this cancellation. */
function exactPolynomialAlgebra(){
  const make=(name,c=1n)=>new Map(c===0n?[]:[[name,c]]),constant=n=>make('',BigInt(n));
  const add=(a,b)=>{const r=new Map(a);for(const[k,v]of b){const s=(r.get(k)??0n)+v;if(s===0n)r.delete(k);else r.set(k,s);}return r;};
  const scale=(a,c)=>new Map([...a].map(([k,v])=>[k,v*BigInt(c)]).filter(([,v])=>v!==0n));
  const sub=(a,b)=>add(a,scale(b,-1));
  const mul=(a,b)=>{let r=new Map();for(const[ka,va]of a)for(const[kb,vb]of b){const k=[...ka.split('*').filter(Boolean),...kb.split('*').filter(Boolean)].sort().join('*');r=add(r,make(k,va*vb));}return r;};
  const variable=name=>make(name);
  const sum=xs=>xs.reduce(add,constant(0));
  const derivative=(a,axis)=>{const out=[];for(const[key,c]of a){const factors=key.split('*').filter(Boolean);for(let i=0;i<factors.length;i++){const x=factors[i];let dx=constant(0);if(x==='ir'&&axis==='r')dx=scale(mul(variable('ir'),variable('ir')),-1);else if(x==='nt'&&axis==='r')dx=scale(mul(variable('nt'),variable('ir')),-1);else if(x==='nr')dx=variable(axis==='r'?'nrr':'nrz');else if(x==='nz')dx=variable(axis==='r'?'nrz':'nzz');else if(/^C[rtz]$/.test(x))dx=variable(x+'_'+axis);else if(/^C[rtz]_[rz]$/.test(x))dx=variable(x.slice(0,3)+(x.slice(3)+axis).split('').sort().join(''));else if(x!=='w'&&x!=='nt'&&x!=='ir')throw Error('Unexpected exact derivative generator '+x);const rest=make(factors.filter((_,j)=>j!==i).join('*'),c);out.push(mul(rest,dx));}}return sum(out);};
  return {variable,constant,add,sub,mul,scale,sum,derivative};
}

export function exactSourcePulseCurlIdentities({omitRadialFrame=false}={}){
  const P=exactPolynomialAlgebra(),v=P.variable,n=['nr','nt','nz'].map(v),c=['Cr','Ct','Cz'].map(v),w=v('w'),ir=v('ir'),Dr=x=>P.derivative(x,'r'),Dz=x=>P.derivative(x,'z');
  const cross=(a,b)=>[P.sub(P.mul(a[1],b[2]),P.mul(a[2],b[1])),P.sub(P.mul(a[2],b[0]),P.mul(a[0],b[2])),P.sub(P.mul(a[0],b[1]),P.mul(a[1],b[0]))];
  const principal=cross(n,c).map(x=>P.mul(w,x)),remainder=[P.scale(Dz(c[1]),-1),P.sub(Dz(c[0]),Dr(c[2])),P.add(Dr(c[1]),omitRadialFrame?P.constant(0):P.mul(ir,c[1]))],a=principal.map((x,i)=>P.add(x,remainder[i]));
  const div=P.sum([Dr(a[0]),P.mul(ir,a[0]),Dz(a[2]),P.mul(w,P.sum(n.map((x,i)=>P.mul(x,a[i]))))]);
  const t=['tr','tt','tz'].map(v),nnt=cross(n,cross(n,t)),triple=nnt.map((x,i)=>P.sub(x,P.sub(P.mul(n[i],P.sum(n.map((y,j)=>P.mul(y,t[j])))),P.mul(P.sum(n.map(y=>P.mul(y,y))),t[i]))));
  const serialize=x=>[...x].map(([monomial,coefficient])=>({monomial,coefficient:coefficient.toString()}));
  const potential=[0,-1],curlDerivative=[-1/2,0],velocity=[-1/2,-1],scalePass=potential.every((x,i)=>x+curlDerivative[i]===velocity[i]);
  return {method:'EXACT_BIGINT_DIFFERENTIAL_POLYNOMIAL',divergenceResidual:serialize(div),divergenceZero:div.size===0,tripleProductResidual:triple.map(serialize),tripleProductIdentity:triple.every(x=>x.size===0),relations:['D_r D_z C=D_z D_r C','D_r n_z=D_z n_r','D_r n_theta=-n_theta/R','D_z n_theta=0','D_r(1/R)=-1/R^2'],sourceEquations:['6.6','7.37','7.38','7.39'],physicalExponentIdentity:{potential,curlDerivative,velocity,basis:['constant','h'],pass:scalePass},pass:div.size===0&&triple.every(x=>x.size===0)&&scalePass};
}

const SQRT2=Math.SQRT2,VR=[1,1-SQRT2],VT=[SQRT2-1,1],TORUS_JAC=4-2*SQRT2;
export function getSourcePulseCurlProbeParameters(input={}){
  const ell=finite(input.ell??8,'ell'),h=1/128;
  if(!Number.isSafeInteger(ell)||ell<4||ell>20)fail('The numerical verification probe uses ell=4..20.');
  const Q=2**(-ell),epsilon=Q**h,k=Math.ceil(epsilon**(-.5));
  return {ell,Q,h,A:.5+h,D:.5-h,epsilon,k,p:1/k,pz:.37,x0:.28,Mi:.31,dr:1.07,ci:.4,vr:VR.slice(),vt:VT.slice(),torusJacobian:TORUS_JAC,center:{R:1.3,Z:.2,xi:.05,v:1},role:'EXPLICIT_SMOOTH_VERIFICATION_COEFFICIENTS; NOT_N3_PROFILE_VALUES',sourceH:sourceExponentContract(),sourceProfile:SOURCE_PROFILE_ID};
}

function probeOptions(parameters,coordinates,m=1){
  const P=parameters;
  return {coordinates,operators:P,phase:{k:P.k,m,p:P.p,pz:P.pz,x0:P.x0},physicalScale:{Q:P.Q,h:P.h},slowFields:({R,Z},J)=>({F:J.add(.6,J.add(J.scale(R,.12),J.add(J.scale(Z,.05),J.scale(J.mul(R,Z),.03)))),G:J.add(-.3,J.add(J.scale(R,-.5),J.add(J.scale(Z,.04),J.scale(J.mul(R,R),.02))))}),pulseCoordinate:({Y1,Y2},J)=>J.scale(J.add(J.scale(Y1,VT[0]),J.scale(Y2,VT[1])),1/(TORUS_JAC*P.ci)),seed:({R,Z,Y1,Y2},J)=>{const xi=J.scale(J.add(J.scale(Y1,VR[0]),J.scale(Y2,VR[1])),1/TORUS_JAC),sign=m<0?-1:1;return [[J.add(1,J.scale(Z,.15)),J.scale(J.add(.07,J.scale(R,.02)),sign)],[J.add(-.3,J.add(J.scale(R,.2),J.scale(xi,.08))),J.scale(J.add(.03,J.scale(Z,.01)),sign)],[J.add(.7,J.scale(J.mul(R,Z),.1)),J.scale(J.add(-.04,J.scale(xi,.02)),sign)]];},cutoff:({R,Z,Y1,Y2,v},J)=>{const xi=J.scale(J.add(J.scale(Y1,VR[0]),J.scale(Y2,VR[1])),1/TORUS_JAC);return [J.bump(R,P.center.R,.65),J.bump(Z,P.center.Z,.9),J.bump(xi,P.center.xi,.45),J.bump(v,1,.95)].reduce(J.mul,J.constant(1));}};
}

export function evaluateSourcePulseCurlProbe(input={}){
  const P=getSourcePulseCurlProbeParameters(input),R=finite(input.R??1.44,'R'),Z=finite(input.Z??.31,'Z'),xi=finite(input.xi??.13,'xi'),v=finite(input.v??.88,'v'),theta=finite(input.theta??.43,'theta'),m=input.m??1,Y=[0,1].map(i=>xi*VR[i]+P.ci*v*VT[i]);
  return {parameters:P,coordinates:{R,Z,Y1:Y[0],Y2:Y[1],theta},...evaluateSourcePulseCurl(probeOptions(P,{R,Z,Y1:Y[0],Y2:Y[1],theta},m))};
}

/** Physical evaluation follows the full source radial auxiliary map, so finite
 * differences include the fast D_r contribution as well as frame derivatives. */
export function evaluateSourcePulseCurlProbeCartesian(point,input={}){
  if(!Array.isArray(point)||point.length!==3||!point.every(Number.isFinite))fail('A finite physical Cartesian point is required.');
  const P=getSourcePulseCurlProbeParameters(input),R=Math.hypot(point[0],point[1])/Math.sqrt(P.Q),Z=point[2]/P.Q**P.D,theta=Math.atan2(point[1],point[0]),Rref=input.Rref??1.44,xiRef=input.xiRef??.13,xi=xiRef+P.Mi*(R**P.dr-Rref**P.dr),pulse=input.v??.88,Y=[0,1].map(i=>xi*VR[i]+P.ci*pulse*VT[i]);
  if(R===0){const zeros=()=>[[0,0],[0,0],[0,0]];return {schema:'mathscope.source-pulse-curl-jet/1',value:{t:zeros(),Cm:zeros(),remainder:zeros(),full:zeros(),normal:null},physical:{Q:P.Q,A:P.A,D:P.D,scalePotential:P.Q**(.5-P.A),scaleVelocity:P.Q**(-P.A),realPotential:[0,0,0],realVelocity:[0,0,0],realLeadingVelocity:[0,0,0]},diagnostics:{fullDivergence:[0,0],omittedRemainderDivergence:[0,0]},scope:{kind:'SMOOTH_ZERO_EXTENSION_AT_THE_AXIS',reason:'The verification coefficient cutoff vanishes identically on R<=0.65, so no cylindrical 0/0 is evaluated.',globalN3PulseEvaluated:false}};}
  return evaluateSourcePulseCurl(probeOptions(P,{R,Z,Y1:Y[0],Y2:Y[1],theta},input.m??1));
}

export function sourcePulseCurlAudit(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>key!=='ell'))fail('The standalone verification audit accepts only the optional ell parameter. Use the generic supplied-jet API for other coefficient functions.');
  const P=getSourcePulseCurlProbeParameters(input),positive=evaluateSourcePulseCurlProbe(input),negative=evaluateSourcePulseCurlProbe({...input,m:-1}),exact=exactSourcePulseCurlIdentities(),missingFrame=exactSourcePulseCurlIdentities({omitRadialFrame:true}),R=positive.coordinates.R,Z=positive.coordinates.Z,theta=positive.coordinates.theta,point=[Math.sqrt(P.Q)*R*Math.cos(theta),Math.sqrt(P.Q)*R*Math.sin(theta),P.Q**P.D*Z],query={...input,Rref:R,xiRef:input.xi??.13};
  const convergence=[];
  for(const normalizedStep of [.024,.012,.006]){context.checkCancelled?.();const step=Math.sqrt(P.Q)*normalizedStep;let full=0,withoutRemainder=0;for(let axis=0;axis<3;axis++){const left=point.slice(),right=point.slice();left[axis]-=step;right[axis]+=step;const l=evaluateSourcePulseCurlProbeCartesian(left,query),r=evaluateSourcePulseCurlProbeCartesian(right,query);full+=(r.physical.realVelocity[axis]-l.physical.realVelocity[axis])/(2*step);withoutRemainder+=(r.physical.realLeadingVelocity[axis]-l.physical.realLeadingVelocity[axis])/(2*step);}convergence.push({normalizedStep,physicalStep:step,fullDivergence:full,omittedRemainderDivergence:withoutRemainder,normalizedFullDivergence:full*P.Q**(P.A+.5),normalizedOmittedDivergence:withoutRemainder*P.Q**(P.A+.5)});}
  const conjugacyError=Math.max(...['t','Cm','remainder','full'].flatMap(key=>positive.value[key].flatMap((z,i)=>[Math.abs(z[0]-negative.value[key][i][0]),Math.abs(z[1]+negative.value[key][i][1])]))),covarianceDifference=positive.covariance.full.map((v,i)=>v-positive.covariance.withoutRemainder[i]);
  const zero=evaluateSourcePulseCurlProbe({...input,R:2.1}),samples=[];for(let i=0;i<=16;i++){context.checkCancelled?.();const sample=evaluateSourcePulseCurlProbe({...input,R:1.05+i*.035});samples.push({R:sample.coordinates.R,tNorm:Math.hypot(...sample.value.t.flat()),remainderNorm:Math.hypot(...sample.value.remainder.flat()),fullNorm:Math.hypot(...sample.value.full.flat()),fullCovariance:sample.covariance.full,withoutRemainderCovariance:sample.covariance.withoutRemainder});}
  const checks=[{id:'exact-source-curl-divergence',pass:exact.pass},{id:'radial-frame-negative',pass:!missingFrame.divergenceZero},{id:'all-coefficient-and-fast-derivatives',pass:positive.jet.retainsAllMixedAuxiliaryDerivatives&&positive.jet.potentialOrder>=2&&magnitude(positive.diagnostics.fullDivergence)<1e-8},{id:'source-principal-amplitude',pass:positive.diagnostics.leadingReconstructionError<1e-10},{id:'physical-cartesian-refinement',pass:Math.abs(convergence[2].normalizedFullDivergence)<Math.abs(convergence[0].normalizedFullDivergence)/10},{id:'omitted-remainder-divergence-negative',pass:Math.abs(convergence[2].normalizedOmittedDivergence)>.01},{id:'omitted-remainder-covariance-negative',pass:Math.hypot(...covarianceDifference)>1e-5},{id:'conjugate-harmonics',pass:conjugacyError<1e-10},{id:'smooth-cutoff-zero-extension',pass:zero.value.full.flat().every(x=>x===0)&&zero.value.Cm.flat().every(x=>x===0)},{id:'physical-potential-scale',pass:exact.physicalExponentIdentity.pass}];
  return {schema:'mathscope.source-pulse-curl-audit/1',sourceEquations:['6.6','7.37','7.38','7.39'],contract:{potential:'C_m=i*(nPhi cross t_m)/(k*m*|nPhi|^2)',remainder:['-D_z(C_m)_theta','D_z(C_m)_r-D_r(C_m)_z','(D_r+R^-1)(C_m)_theta'],physicalPotentialScale:'Q^(1/2-A)',fullVelocity:'(t_m+r_m)*exp(i*k*m*Phi)',amplitudeCondition:'nPhi dot t_m=0; independent of theta; prescribed smooth support and zero extensions',discreteLabelsFrozen:true,conjugateConvention:'t_-m=conjugate(t_m), C_-m=conjugate(C_m), r_-m=conjugate(r_m); a real wave uses 1/2 of each conjugate coefficient'},exact,negativeRadialFrame:missingFrame,probe:{parameters:P,point:positive.coordinates,values:positive.value,diagnostics:positive.diagnostics,physical:positive.physical},convergence,conjugacyError,covariance:{...positive.covariance,omittedRemainderDifference:covarianceDifference},samples,checks,pass:checks.every(c=>c.pass),scope:{criterion:'N5-07 generic source harmonic operator',sourceProfile:SOURCE_PROFILE_ID,exactH:sourceExponentContract(),numericalProbe:'Explicit smooth coefficients verify the operator. They are not the actual N3/N4 background or a Lemma 7.4 homogeneous solution.',globalN3PulseEvaluated:false,pulseClassBoundsCertified:false,formalComplete:false,newLeanKernelExecution:false}};
}
