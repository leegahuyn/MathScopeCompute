import * as M from './matrix.mjs';
import {requireCondition,inner,fromCoordinates,groupElementResidual,selectEmbedding,coordinates} from './groups.mjs';
const vec4=(x,name)=>requireCondition(Array.isArray(x)&&x.length===4&&x.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e4),'FOUR_DIMENSIONAL_VECTOR_REQUIRED',`${name} must contain four finite real coordinates.`,name);
const finitePositive=(x,name)=>requireCondition(Number.isFinite(x)&&x>=1e-4&&x<=1e4,'POSITIVE_PARAMETER_REQUIRED',`${name} must lie in [1e-4,1e4] for the bounded Float64 field engine.`,name);
const near=(a,b)=>Math.abs(a-b)<1e-13;
export function seedGenerator(seed){let h=2166136261;for(let i=0;i<seed.length;i++)h=Math.imul(h^seed.charCodeAt(i),16777619);if(h===0)h=0x9e3779b9;return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return (h>>>0)/4294967296;};}
function normalizeDomain(d){
 requireCondition(d&&typeof d==='object','DOMAIN_REQUIRED','A 4D domain and actual boundary condition are required.','input.field.domain');
 if(d.kind==='R4_WINDOW'){
  requireCondition(d.boundary==='OPEN_RESTRICTION','BPST_BOUNDARY_CONVENTION','R4_WINDOW is a finite observation window of an R4 field, with no periodic identification.','input.field.domain.boundary');
  requireCondition(Array.isArray(d.bounds)&&d.bounds.length===4&&d.bounds.every(b=>Array.isArray(b)&&b.length===2&&b.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e4)&&b[0]<b[1]),'FOUR_DIMENSIONAL_BOUNDS','Four ordered finite coordinate intervals are required.','input.field.domain.bounds');
  return {kind:d.kind,bounds:d.bounds.map(x=>x.slice()),boundary:d.boundary};
 }
 requireCondition(d.kind==='PERIODIC_TORUS'&&d.boundary==='PERIODIC','DOMAIN_NOT_IMPLEMENTED','Only R4_WINDOW/open restriction and a periodic trivial-bundle torus are implemented.','input.field.domain');
 vec4(d.periods,'domain.periods');requireCondition(d.periods.every(x=>x>0),'PERIODS_POSITIVE','All torus periods must be positive.');vec4(d.origin,'domain.origin');
 return {kind:d.kind,periods:d.periods.slice(),origin:d.origin.slice(),boundary:d.boundary,bundle:'TRIVIAL'};
}
export function normalizeFieldSpec(g,s){
 requireCondition(s&&typeof s==='object','FIELD_SPEC_REQUIRED','Group and Delta alone do not specify a field. Supply construction, coefficients, scales, domain, coupling and units.','input.field');
 requireCondition(['EMBEDDED_BPST','FULL_BASIS_TRIAL','BPST_PLUS_PERTURBATION'].includes(s.kind),'FIELD_CONSTRUCTION_NOT_IMPLEMENTED','Only the three explicit classical field constructions are implemented in M1.','input.field.kind');
 requireCondition(s.gaugeConvention==='D=d+A','GAUGE_CONVENTION_REQUIRED','The implemented anti-Hermitian convention is D=d+A and F=dA+A wedge A.','input.field.gaugeConvention');
 vec4(s.center,'field.center');const domain=normalizeDomain(s.domain);
 requireCondition(s.coupling&&s.coupling.normalization==='BASIC_FORM','COUPLING_NORMALIZATION_REQUIRED','Coupling must specify BASIC_FORM and g.','input.field.coupling');finitePositive(s.coupling.g,'field.coupling.g');
 requireCondition(s.units&&typeof s.units.length==='string'&&s.units.length.length>0,'UNITS_REQUIRED','An explicit length unit label is required.','input.field.units');finitePositive(s.units.hbarC,'field.units.hbarC');
 const bpst=s.kind!=='FULL_BASIS_TRIAL';
 if(bpst){finitePositive(s.rho,'field.rho');requireCondition(g.data.embeddings.some(e=>e.id===s.embedding),'EMBEDDING_NOT_IMPLEMENTED','Select an exact supported matrix embedding ID (canonical-su2, or short-root-su2 for G2).','input.field.embedding');requireCondition(domain.kind==='R4_WINDOW','BPST_CANNOT_BE_NAIVELY_PERIODIC','A single regular-gauge BPST field cannot be naively periodically copied; use an R4 window or implement bundle transition data.','input.field.domain');}
 else requireCondition(s.embedding===null&&s.rho===null,'UNUSED_BPST_PARAMETERS','A pure full-basis field must declare embedding:null and rho:null.','input.field');
 let perturbation=null;
 if(s.kind!=='EMBEDDED_BPST'){
  const p=s.perturbation;requireCondition(p&&typeof p==='object','COEFFICIENT_RULE_REQUIRED','Full-basis construction requires its finite coefficient rule.','input.field.perturbation');
  requireCondition(Number.isFinite(p.amplitude)&&Math.abs(p.amplitude)<=3,'PERTURBATION_AMPLITUDE_BOUNDS','Signed dimensionless amplitude must be in [-3,3].');finitePositive(p.length,'perturbation.length');
  requireCondition(typeof p.seed==='string'&&p.seed.length>0&&p.seed.length<=256,'SEED_REQUIRED','A deterministic seed must be recorded.','input.field.perturbation.seed');
  requireCondition(['GAUSSIAN_POLYNOMIAL','FOURIER'].includes(p.kind),'TRIAL_FUNCTION_NOT_IMPLEMENTED','Choose explicit Gaussian polynomial or finite Fourier basis.');
  if(domain.kind==='PERIODIC_TORUS')requireCondition(p.kind==='FOURIER','PERIODICITY_MISMATCH','Periodic fields require finite integer Fourier modes.');
  requireCondition(Array.isArray(p.modes)&&p.modes.length>0&&p.modes.length<=12,'MODE_BUDGET','Between 1 and 12 explicitly listed modes are required.');
  const modes=p.modes.map((m,index)=>{
   if(p.kind==='GAUSSIAN_POLYNOMIAL'){requireCondition(Array.isArray(m)&&m.length===4&&m.every(v=>Number.isInteger(v)&&v>=0&&v<=3)&&m.reduce((a,b)=>a+b,0)<=4,'POLYNOMIAL_MODE_BOUNDS',`Invalid polynomial mode ${index}.`);return m.slice();}
   requireCondition(m&&['SIN','COS'].includes(m.parity)&&Number.isFinite(m.phase),'FOURIER_MODE_REQUIRED','A Fourier mode requires parity, phase and four integer wave numbers.');vec4(m.wave,'Fourier.wave');requireCondition(m.wave.every(v=>Number.isInteger(v)&&Math.abs(v)<=5),'FOURIER_MODE_BOUNDS','Integer Fourier wave numbers must be in [-5,5].');return {wave:m.wave.slice(),phase:m.phase,parity:m.parity};
  });
  let coefficients;
  if(p.coefficients!==undefined){requireCondition(Array.isArray(p.coefficients)&&p.coefficients.length===4&&p.coefficients.every(v=>Array.isArray(v)&&v.length===g.dimension&&v.every(w=>Array.isArray(w)&&w.length===modes.length&&w.every(c=>Number.isFinite(c)&&Math.abs(c)<=10))),'COEFFICIENT_SHAPE','Coefficients must have shape [4][dim(g)][modeCount], entries in [-10,10].');coefficients=p.coefficients.map(x=>x.map(y=>y.slice()));}
  else {const rng=seedGenerator(p.seed);coefficients=Array.from({length:4},()=>Array.from({length:g.dimension},()=>Array.from({length:modes.length},()=> (2*rng()-1)/Math.sqrt(g.dimension*modes.length))));}
  perturbation={kind:p.kind,length:p.length,amplitude:p.amplitude,seed:p.seed,modes,coefficients,coefficientRule:p.coefficients===undefined?'xorshift32(FNV-1a UTF-16 seed, zero state -> 0x9e3779b9), full basis, explicit coefficients persisted':'explicit persisted coefficients'};
 }
 else requireCondition(s.perturbation===null,'UNUSED_PERTURBATION','EMBEDDED_BPST requires perturbation:null.');
 return {kind:s.kind,embedding:bpst?s.embedding:null,rho:bpst?s.rho:null,center:s.center.slice(),gaugeConvention:s.gaugeConvention,coupling:{g:s.coupling.g,normalization:'BASIC_FORM'},domain,units:{length:s.units.length,hbarC:s.units.hbarC},perturbation,scope:s.kind==='EMBEDDED_BPST'?'CLASSICAL_SELF_DUAL_R4_FIELD':'CLASSICAL_OFF_SHELL_TEST_FIELD',quantumState:false};
}
export function createField(g,s){const spec=normalizeFieldSpec(g,s);return {group:spec.embedding?selectEmbedding(g,spec.embedding):g,spec};}
function eps3(a,b,c){if(a===b||b===c||a===c)return 0;return (a-b)*(b-c)*(a-c)<0?1:-1;}
export function eta(a,mu,nu){if(mu===nu)return 0;if(mu<3&&nu<3)return eps3(a,mu,nu);if(nu===3)return +(a===mu);return -(a===nu);}
function polynomial(y,p){return p.reduce((v,n,i)=>v*y[i]**n,1);}
function polyDerivative(y,p,j,k=null){let f=p[j];if(k===j)f*=p[j]-1;else if(k!==null)f*=p[k];if(!f)return 0;const ex=p.slice();ex[j]--;if(k!==null)ex[k]--;return f*polynomial(y,ex);}
function scalarMode(field,x,m,order){const s=field.spec,p=s.perturbation,ell=p.length,y=x.map((v,j)=>(v-s.center[j])/ell);let v,d=Array(4).fill(0),dd=Array.from({length:4},()=>Array(4).fill(0));
 if(p.kind==='GAUSSIAN_POLYNOMIAL'){
  const gauss=Math.exp(-y.reduce((a,b)=>a+b*b,0)/2),poly=polynomial(y,m);v=gauss*poly;
  if(order>0)for(let j=0;j<4;j++)d[j]=gauss*(polyDerivative(y,m,j)-y[j]*poly)/ell;
  if(order>1)for(let j=0;j<4;j++)for(let k=0;k<4;k++)dd[j][k]=gauss*(polyDerivative(y,m,j,k)-(j===k?poly:0)-y[j]*polyDerivative(y,m,k)-y[k]*polyDerivative(y,m,j)+y[j]*y[k]*poly)/(ell*ell);
 }else{
  const periods=s.domain.kind==='PERIODIC_TORUS'?s.domain.periods:Array(4).fill(2*Math.PI*ell),wave=m.wave.map((w,j)=>2*Math.PI*w/periods[j]),phase=m.phase+wave.reduce((a,w,j)=>a+w*(x[j]-s.center[j]),0),sin=Math.sin(phase),cos=Math.cos(phase);v=m.parity==='SIN'?sin:cos;
  if(order>0)for(let j=0;j<4;j++)d[j]=wave[j]*(m.parity==='SIN'?cos:-sin);
  if(order>1)for(let j=0;j<4;j++)for(let k=0;k<4;k++)dd[j][k]=-wave[j]*wave[k]*v;
 }
 return {v,d,dd};
}
export function evaluateJet(field,x,{order=2}={}){
 requireCondition(Array.isArray(x)&&x.length===4&&x.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e8),'FOUR_DIMENSIONAL_VECTOR_REQUIRED','Internal field evaluation requires four finite coordinates in [-1e8,1e8].');requireCondition([0,1,2].includes(order),'DERIVATIVE_ORDER','Order must be 0, 1 or 2.');const {group:g,spec:s}=field,n=g.matrixDimension;
 const A=Array.from({length:4},()=>M.matrix(n)),dA=order>0?Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(n))):null,ddA=order>1?Array.from({length:4},()=>Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(n)))):null;
 if(s.kind!=='FULL_BASIS_TRIAL'){
  const z=x.map((v,i)=>v-s.center[i]),D=z.reduce((a,b)=>a+b*b,s.rho*s.rho);
  for(let a=0;a<3;a++)for(let mu=0;mu<4;mu++){
   let N=0;for(let nu=0;nu<4;nu++)N+=2*eta(a,mu,nu)*z[nu];M.addTo(A[mu],g.embedding[a],N/D);
   if(order>0)for(let j=0;j<4;j++)M.addTo(dA[j][mu],g.embedding[a],2*eta(a,mu,j)/D-2*z[j]*N/(D*D));
   if(order>1)for(let j=0;j<4;j++)for(let k=0;k<4;k++){const nj=2*eta(a,mu,j),nk=2*eta(a,mu,k);M.addTo(ddA[k][j][mu],g.embedding[a],(-2*nj*z[k]-2*(j===k?N:0)-2*z[j]*nk)/(D*D)+8*z[j]*z[k]*N/(D*D*D));}
  }
 }
 if(s.perturbation){const p=s.perturbation,modes=p.modes.map(m=>scalarMode(field,x,m,order)),amp=p.amplitude/p.length;
  for(let mu=0;mu<4;mu++)for(let a=0;a<g.dimension;a++){
   let value=0;for(let k=0;k<modes.length;k++)value+=p.coefficients[mu][a][k]*modes[k].v;M.addTo(A[mu],g.basis[a],amp*value);
   if(order>0)for(let j=0;j<4;j++){let value=0;for(let k=0;k<modes.length;k++)value+=p.coefficients[mu][a][k]*modes[k].d[j];M.addTo(dA[j][mu],g.basis[a],amp*value);}
   if(order>1)for(let j=0;j<4;j++)for(let l=0;l<4;l++){let value=0;for(let k=0;k<modes.length;k++)value+=p.coefficients[mu][a][k]*modes[k].dd[j][l];M.addTo(ddA[j][l][mu],g.basis[a],amp*value);}
  }
 }
 return {x:x.slice(),A,dA,ddA,order};
}
export function curvatureFromJet(jet){requireCondition(jet.dA,'DERIVATIVES_REQUIRED','Curvature needs first derivatives.');const n=jet.A[0].n,F=Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(n)));for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){F[mu][nu]=M.addTo(M.addTo(M.clone(jet.dA[mu][nu]),jet.dA[nu][mu],-1),M.commutator(jet.A[mu],jet.A[nu]));F[nu][mu]=M.scale(F[mu][nu],-1);}return F;}
export function dualCurvature(F){const dual=Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(F[0][0].n)));for(const [a,b,c,d,sign] of [[0,1,2,3,1],[0,2,1,3,-1],[0,3,1,2,1]]){dual[a][b]=M.scale(F[c][d],sign);dual[c][d]=M.scale(F[a][b],sign);dual[b][a]=M.scale(dual[a][b],-1);dual[d][c]=M.scale(dual[c][d],-1);}return dual;}
export function densities(field,F){const star=dualCurvature(F);let sum=0,q=0,self=0,anti=0;for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){sum+=inner(field.group,F[mu][nu],F[mu][nu]);q+=inner(field.group,F[mu][nu],star[mu][nu]);self+=M.distance(F[mu][nu],star[mu][nu])**2;anti+=M.distance(F[mu][nu],M.scale(star[mu][nu],-1))**2;}return {actionDensity:sum/field.spec.coupling.g**2,topologicalDensity:q/(8*Math.PI**2),curvatureNormSquared:sum,selfDualResidual:Math.sqrt(self),antiSelfDualResidual:Math.sqrt(anti),units:{actionDensity:`${field.spec.units.length}^-4`,topologicalDensity:`${field.spec.units.length}^-4`},normalization:'S=integral(sum_{mu<nu} B(F_mu_nu,F_mu_nu)/g^2); q4=sum B(F,*F)/(8 pi^2)'};}
export function referenceBPST(field,x){const s=field.spec;requireCondition(s.kind==='EMBEDDED_BPST','NOT_PURE_BPST','Closed BPST reference density is valid only for the unperturbed embedded BPST field.');const r2=x.reduce((v,y,i)=>v+(y-s.center[i])**2,0),D=r2+s.rho**2,q4=field.group.index*6*s.rho**4/(Math.PI**2*D**4),F=Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(field.group.matrixDimension)));for(let mu=0;mu<4;mu++)for(let nu=0;nu<4;nu++)for(let a=0;a<3;a++)M.addTo(F[mu][nu],field.group.embedding[a],-4*s.rho*s.rho*eta(a,mu,nu)/(D*D));return {F,q4,actionDensity:8*Math.PI**2*q4/s.coupling.g**2};}
export function evaluateField(field,x,{residuals=false,includeMatrices=false}={}){
 const jet=evaluateJet(field,x,{order:residuals?2:1}),F=curvatureFromJet(jet),density=densities(field,F);let equations=null;
 if(residuals){const g=field.group,n=g.matrixDimension,D=Array.from({length:4},()=>Array.from({length:4},()=>Array.from({length:4},()=>M.matrix(n))));for(let j=0;j<4;j++)for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){
   let df=M.addTo(M.clone(jet.ddA[j][mu][nu]),jet.ddA[j][nu][mu],-1);M.addTo(df,M.commutator(jet.dA[j][mu],jet.A[nu]));M.addTo(df,M.commutator(jet.A[mu],jet.dA[j][nu]));M.addTo(df,M.commutator(jet.A[j],F[mu][nu]));D[j][mu][nu]=df;D[j][nu][mu]=M.scale(df,-1);
  }
  let ym2=0,bianchi2=0;for(let nu=0;nu<4;nu++){const v=M.matrix(n);for(let mu=0;mu<4;mu++)M.addTo(v,D[mu][mu][nu]);ym2+=M.frobenius(v)**2;}
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)for(let c=b+1;c<4;c++){const v=M.addTo(M.add(D[a][b][c],D[b][c][a]),D[c][a][b]);bianchi2+=M.frobenius(v)**2;}
  const denom=Math.max(1,Math.sqrt(density.curvatureNormSquared)/(field.spec.rho||field.spec.perturbation.length));equations={yangMillsFrobenius:Math.sqrt(ym2),bianchiFrobenius:Math.sqrt(bianchi2),relativeYangMills:Math.sqrt(ym2)/denom,relativeBianchi:Math.sqrt(bianchi2)/denom,expectedYangMillsZero:field.spec.kind==='EMBEDDED_BPST',interpretation:field.spec.kind==='EMBEDDED_BPST'?'Classical self-dual solution residual':'No Yang-Mills equation is imposed on this trial field; its residual is reported whether zero or nonzero. Bianchi remains an identity.'};
 }
 const result={x:x.slice(),density,equations};if(includeMatrices){result.A=jet.A.map(M.jsonMatrix);result.F=F.map(row=>row.map(M.jsonMatrix));}return result;
}
export function normalizeGauge(g,s){requireCondition(s&&Number.isInteger(s.generator)&&s.generator>=0&&s.generator<g.dimension,'GAUGE_GENERATOR_REQUIRED','A compact-basis generator index is required.');requireCondition(Array.isArray(s.wave)&&s.wave.length===4&&s.wave.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6),'GAUGE_WAVE_VECTOR','Four finite gauge wave numbers in [-1e6,1e6] are required.');requireCondition(Number.isFinite(s.amplitude)&&Math.abs(s.amplitude)<=3&&Number.isFinite(s.phase),'GAUGE_FUNCTION_BOUNDS','Gauge amplitude in [-3,3] and finite phase required.');return {generator:s.generator,wave:s.wave.slice(),amplitude:s.amplitude,phase:s.phase};}
export function gaugeAt(field,x,gauge){const s=normalizeFieldGauge(field.group,field.spec,gauge),phase=s.phase+s.wave.reduce((v,k,j)=>v+k*x[j],0),theta=s.amplitude*Math.sin(phase),d=s.wave.map(k=>s.amplitude*k*Math.cos(phase)),dd=s.wave.map(k=>s.wave.map(l=>-s.amplitude*k*l*Math.sin(phase))),T=field.group.basis[s.generator],u=M.exponential(M.scale(T,theta));return {u,T,theta,d,dd,spec:s};}
export function transformedJet(field,x,gauge,{order=1}={}){const jet=evaluateJet(field,x,{order:Math.max(1,order)}),a=gaugeAt(field,x,gauge);const A=jet.A.map((v,mu)=>M.addTo(M.conjugate(a.u,v),a.T,-a.d[mu]));const dA=Array.from({length:4},(_,j)=>jet.A.map((v,mu)=>M.addTo(M.conjugate(a.u,M.addTo(M.clone(jet.dA[j][mu]),M.commutator(a.T,v),a.d[j])),a.T,-a.dd[j][mu])));return {x:x.slice(),A,dA,ddA:null,order:1,u:a.u};}
export function finiteDifferenceCurvature(field,x,h,{gauge=null}={}){requireCondition(Number.isFinite(h)&&h>0&&h<=1e4,'FINITE_DIFFERENCE_STEP','Difference step must be finite and positive.');const evaluate=y=>gauge?transformedJet(field,y,gauge,{order:0}).A:evaluateJet(field,y,{order:0}).A;const A=evaluate(x),dA=Array.from({length:4},()=>null);for(let j=0;j<4;j++){const xp=x.slice(),xm=x.slice();xp[j]+=h;xm[j]-=h;const ap=evaluate(xp),am=evaluate(xm);dA[j]=ap.map((v,mu)=>M.scale(M.addTo(M.clone(v),am[mu],-1),1/(2*h)));}return curvatureFromJet({A,dA});}
export function verifyFieldAt(field,x,{h=1e-3,gauge=null}={}){
 gauge=gauge??{generator:0,wave:field.spec.domain.kind==='PERIODIC_TORUS'?field.spec.domain.periods.map((L,j)=>2*Math.PI*[1,-1,0,1][j]/L):[0.3,-0.2,0.1,0.4],amplitude:0.4,phase:0.2};
 const jet=evaluateJet(field,x),F=curvatureFromJet(jet),Fh=finiteDifferenceCurvature(field,x,h),Fhalf=finiteDifferenceCurvature(field,x,h/2);let errorH=0,errorHalf=0,reference=0;
 const ref=field.spec.kind==='EMBEDDED_BPST'?referenceBPST(field,x):null;
 for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){errorH+=M.distance(F[mu][nu],Fh[mu][nu])**2;errorHalf+=M.distance(F[mu][nu],Fhalf[mu][nu])**2;if(ref)reference+=M.distance(F[mu][nu],ref.F[mu][nu])**2;}
 const trans=transformedJet(field,x,gauge),Ft=curvatureFromJet(trans),Ftf=finiteDifferenceCurvature(field,x,h/2,{gauge});let covariance=0,covarianceFD=0;
 for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){const target=M.conjugate(trans.u,F[mu][nu]);covariance+=M.distance(Ft[mu][nu],target)**2;covarianceFD+=M.distance(Ftf[mu][nu],target)**2;}
 const before=densities(field,F),after=densities(field,Ft),equations=evaluateField(field,x,{residuals:true}).equations;
 return {point:x.slice(),finiteDifference:{h,error:Math.sqrt(errorH),halfStepError:Math.sqrt(errorHalf),observedErrorRatio:Math.sqrt(errorHalf)>1e-30?Math.sqrt(errorH/errorHalf):null,method:'independent central differences of evaluated A; analytic jet is not used in this curvature'},bpstReference:ref?{curvatureResidual:Math.sqrt(reference),q4Residual:Math.abs(before.topologicalDensity-ref.q4)}:null,gauge:{spec:normalizeGauge(field.group,gauge),membership:groupElementResidual(field.group,trans.u),curvatureCovariance:Math.sqrt(covariance),independentDifferenceCovariance:Math.sqrt(covarianceFD),actionDensityDifference:Math.abs(before.actionDensity-after.actionDensity),topologicalDensityDifference:Math.abs(before.topologicalDensity-after.topologicalDensity),openConnectionComponentsAreNotInvariant:true},equations};
}
export function bpstMarginal(group,rho,x3,center3=[0,0,0]){const r2=x3.reduce((s,x,i)=>s+(x-center3[i])**2,0);return group.index*15*rho**4/(8*Math.PI*(r2+rho*rho)**3.5);}
export function bpstBallMass(group,rho,R){const u=R*R,v=rho*rho;return group.index*u*u*(u+3*v)/(u+v)**3;}
export function simpson(f,a,b,n=512){requireCondition(Number.isInteger(n)&&n>=2&&n<=16384&&n%2===0,'QUADRATURE_BUDGET','Simpson panels must be even, 2..16384.');const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;}
export function verifyDensityQuadrature(field,{x3=[0.4,-0.2,0.3],panels=512}={}){requireCondition(field.spec.kind==='EMBEDDED_BPST','PURE_BPST_QUADRATURE','Closed marginal certificate is for pure embedded BPST.');const s=field.spec,rho=s.rho,r2=x3.reduce((v,x,i)=>v+(x-s.center[i])**2,0),scale=Math.sqrt(r2+rho*rho);const transformed=u=>{if(Math.abs(u)===Math.PI/2)return 0;const t=scale*Math.tan(u),jac=scale/Math.cos(u)**2;const x=[...x3,s.center[3]+t];return evaluateField(field,x).density.topologicalDensity*jac;};const q3=simpson(transformed,-Math.PI/2,Math.PI/2,panels),q3fine=simpson(transformed,-Math.PI/2,Math.PI/2,panels*2),analytic=bpstMarginal(field.group,rho,x3,s.center.slice(0,3));const radial=u=>{if(u===Math.PI/2||u===0)return 0;const r=rho*Math.tan(u),jac=rho/Math.cos(u)**2;return 2*Math.PI**2*r**3*evaluateField(field,[s.center[0]+r,...s.center.slice(1)]).density.topologicalDensity*jac;};const mass=simpson(radial,0,Math.PI/2,panels),massFine=simpson(radial,0,Math.PI/2,panels*2);return {method:'Independent Simpson integration of dA+[A,A] matrix density, tangent compactification of R and radial R4 measure',panels,refinedPanels:panels*2,marginal:{numeric:q3,refined:q3fine,analytic,absoluteError:Math.abs(q3fine-analytic),refinementDifference:Math.abs(q3fine-q3),units:`${s.units.length}^-3`},totalCharge:{numeric:mass,refined:massFine,expected:field.group.index,absoluteError:Math.abs(massFine-field.group.index)},exactInfiniteIntegralIs:'THEOREM_REFERENCE; numerical quadrature is not an exact integration proof'};}

/** Independent Lie-coordinate evaluation uses the sparse structure table, not matrix commutators. */
export function coefficientCurvature(field,x){
 const {group:g,spec:s}=field,d=g.dimension,A=Array.from({length:4},()=>Array(d).fill(0)),dA=Array.from({length:4},()=>Array.from({length:4},()=>Array(d).fill(0)));
 if(s.kind!=='FULL_BASIS_TRIAL'){
  const z=x.map((v,i)=>v-s.center[i]),D=z.reduce((v,w)=>v+w*w,s.rho*s.rho),ec=g.selectedEmbedding.compactCoordinates.map(row=>row.map(M.rationalNumber));
  for(let a=0;a<3;a++)for(let mu=0;mu<4;mu++){
   const N=z.reduce((v,w,j)=>v+2*eta(a,mu,j)*w,0);
   for(let b=0;b<d;b++){A[mu][b]+=ec[a][b]*N/D;for(let j=0;j<4;j++)dA[j][mu][b]+=ec[a][b]*(2*eta(a,mu,j)/D-2*z[j]*N/(D*D));}
  }
 }
 if(s.perturbation){const p=s.perturbation,modes=p.modes.map(m=>scalarMode(field,x,m,1)),amp=p.amplitude/p.length;for(let mu=0;mu<4;mu++)for(let a=0;a<d;a++)for(let k=0;k<modes.length;k++){const c=amp*p.coefficients[mu][a][k];A[mu][a]+=c*modes[k].v;for(let j=0;j<4;j++)dA[j][mu][a]+=c*modes[k].d[j];}}
 const F=Array.from({length:4},()=>Array.from({length:4},()=>Array(d).fill(0)));
 for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){
  for(let a=0;a<d;a++)F[mu][nu][a]=dA[mu][nu][a]-dA[nu][mu][a];
  for(const [a,b,c,v] of g.data.structureConstants)F[mu][nu][c]+=M.rationalNumber(v)*(A[mu][a]*A[nu][b]-A[mu][b]*A[nu][a]);
  F[nu][mu]=F[mu][nu].map(v=>-v);
 }
 return {A,dA,F};
}
export function verifyCoordinateCurvature(field,x){const cc=coefficientCurvature(field,x),jet=evaluateJet(field,x,{order:1}),F=curvatureFromJet(jet);let connection=0,curvature=0;for(let mu=0;mu<4;mu++){connection=Math.max(connection,M.distance(jet.A[mu],fromCoordinates(field.group,cc.A[mu])));for(let nu=mu+1;nu<4;nu++)curvature=Math.max(curvature,M.distance(F[mu][nu],fromCoordinates(field.group,cc.F[mu][nu])));}return {connectionResidual:connection,curvatureResidual:curvature,method:'direct scalar coefficients + exact sparse f_ab^c, independently compared to matrix products',fullBasisDimension:field.group.dimension,activeCoefficientDirections:cc.A[0].map((v,i)=>cc.A.some(row=>Math.abs(row[i])>1e-14)?i:null).filter(v=>v!==null)};}
export function verifyPeriodicSeam(field,x){requireCondition(field.spec.domain.kind==='PERIODIC_TORUS','NOT_PERIODIC','Seam verification requires a periodic Fourier source.');const base=evaluateJet(field,x,{order:1}),F=curvatureFromJet(base);let Ares=0,Fres=0;for(let j=0;j<4;j++){const xp=x.slice();xp[j]+=field.spec.domain.periods[j];const jet=evaluateJet(field,xp,{order:1}),Fp=curvatureFromJet(jet);for(let mu=0;mu<4;mu++){Ares=Math.max(Ares,M.distance(base.A[mu],jet.A[mu]));for(let nu=mu+1;nu<4;nu++)Fres=Math.max(Fres,M.distance(F[mu][nu],Fp[mu][nu]));}}return {point:x.slice(),connectionResidual:Ares,curvatureResidual:Fres,periods:field.spec.domain.periods,scope:'Finite integer Fourier modes define a smooth periodic connection on the trivial bundle; no nontrivial bundle transition is claimed.'};}

export function normalizeFieldGauge(g,fieldSpec,s){const out=normalizeGauge(g,s);if(fieldSpec.domain.kind==='PERIODIC_TORUS'&&out.amplitude!==0)requireCondition(out.wave.every((k,j)=>Math.abs(k*fieldSpec.domain.periods[j]/(2*Math.PI)-Math.round(k*fieldSpec.domain.periods[j]/(2*Math.PI)))<1e-10),'GAUGE_NOT_PERIODIC','The gauge transformation must descend to the torus: every k_j L_j/(2pi) is an integer. A nonperiodic gauge function cannot be silently used as a global torus gauge transformation.');return out;}
