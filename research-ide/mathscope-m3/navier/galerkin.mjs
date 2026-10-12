/** N8: finite Fourier-Galerkin Navier-Stokes on (R/2pi Z)^3.
 * Normalization: u(x)=sum_k uhat[k] exp(i k.x); E=mean |u|^2/2.
 * Complex vectors use [u0.re,u0.im,u1.re,u1.im,u2.re,u2.im].
 * The retained cube excludes every Nyquist frequency of the padded grid.
 * No finite-mode calculation grants a continuum PDE or blowup certificate.
 */
const bad=(code,message)=>{throw Object.assign(new Error(message),{code});};
const finite=(v,name)=>{if(!Number.isFinite(v))bad('INVALID_INPUT',`${name} must be finite.`);return v;};
const key=k=>k.join(',');
const norm=a=>Math.sqrt(a.reduce((s,x)=>s+x*x,0));
const diff=(a,b)=>a.map((x,i)=>x-b[i]);
const scale=(a,s)=>a.map(x=>x*s);
const sum=(...xs)=>xs[0].map((_,i)=>xs.reduce((s,x)=>s+x[i],0));
const maxAbs=a=>a.reduce((m,x)=>Math.max(m,Math.abs(x)),0);

export function fourierSpace(cutoff=2){
  if(!Number.isSafeInteger(cutoff)||cutoff<1||cutoff>5)bad('UNSUPPORTED','Fourier cutoff must be an integer from 1 through 5.');
  const modes=[];for(let x=-cutoff;x<=cutoff;x++)for(let y=-cutoff;y<=cutoff;y++)for(let z=-cutoff;z<=cutoff;z++)modes.push([x,y,z]);
  const index=new Map(modes.map((k,i)=>[key(k),i])),squares=modes.map(k=>k.reduce((a,b)=>a+b*b,0));
  const zero=()=>new Float64Array(modes.length*6);
  return {cutoff,modes,index,squares,zero,meanIndex:index.get('0,0,0'),domain:{kind:'PERIODIC_3_TORUS',lengths:[2*Math.PI,2*Math.PI,2*Math.PI],basis:'exp(i k dot x)',retainedModes:'|k_j| <= K',meanEnergy:true}};
}

export function validateVelocity(S,u,{tolerance=1e-11}={}){
  if(!u||u.length!==S.modes.length*6||Array.from(u).some(v=>!Number.isFinite(v)))bad('INVALID_INPUT','A finite complete retained velocity is required.');
  let divergence=0,conjugacy=0;
  S.modes.forEach((k,i)=>{
    const j=S.index.get(key(k.map(v=>-v)));
    for(let c=0;c<2;c++)divergence=Math.max(divergence,Math.abs(k.reduce((a,b,d)=>a+b*u[6*i+2*d+c],0)));
    for(let d=0;d<3;d++){
      conjugacy=Math.max(conjugacy,Math.abs(u[6*i+2*d]-u[6*j+2*d]));
      conjugacy=Math.max(conjugacy,Math.abs(u[6*i+2*d+1]+u[6*j+2*d+1]));
    }
  });
  const denominator=Math.max(1,norm(u)),pass=divergence/denominator<=tolerance&&conjugacy/denominator<=tolerance;
  return {pass,divergence,conjugacy,normalizedDivergence:divergence/denominator,normalizedConjugacy:conjugacy/denominator,tolerance,mean:[...u.slice(6*S.meanIndex,6*S.meanIndex+6)]};
}

export function project(S,v){
  const out=Float64Array.from(v);
  S.modes.forEach((k,i)=>{const q=S.squares[i];if(!q)return;
    for(let c=0;c<2;c++){const dot=k.reduce((a,b,d)=>a+b*v[6*i+2*d+c],0)/q;for(let d=0;d<3;d++)out[6*i+2*d+c]-=k[d]*dot;}
  });return out;
}

export function advectDirect(S,u,v=u){
  const out=S.zero(),activeU=[],activeV=[];
  for(let i=0;i<S.modes.length;i++){
    if(u.slice(6*i,6*i+6).some(x=>x!==0))activeU.push(i);
    if(v.slice(6*i,6*i+6).some(x=>x!==0))activeV.push(i);
  }
  for(const i of activeU)for(const j of activeV){
    const p=S.modes[i],q=S.modes[j],target=S.index.get(key(p.map((x,d)=>x+q[d])));if(target===undefined)continue;
    let ar=0,ai=0;for(let d=0;d<3;d++){ar+=q[d]*u[6*i+2*d];ai+=q[d]*u[6*i+2*d+1];}
    for(let d=0;d<3;d++){const br=v[6*j+2*d],bi=v[6*j+2*d+1];out[6*target+2*d]-=ar*bi+ai*br;out[6*target+2*d+1]+=ar*br-ai*bi;}
  }return out;
}

/** Iterative radix-two transform. Inverse scales by 1/n at each axis. */
function fftLine(re,im,inverse){
  const n=re.length;for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}
  for(let len=2;len<=n;len<<=1){const angle=(inverse?2:-2)*Math.PI/len,wr0=Math.cos(angle),wi0=Math.sin(angle);
    for(let i=0;i<n;i+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){
      const a=i+j,b=a+len/2,tr=wr*re[b]-wi*im[b],ti=wr*im[b]+wi*re[b];
      re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;const nr=wr*wr0-wi*wi0;wi=wr*wi0+wi*wr0;wr=nr;
    }}
  }if(inverse)for(let i=0;i<n;i++){re[i]/=n;im[i]/=n;}
}

function fft3(re,im,n,inverse){
  const rr=new Float64Array(n),ii=new Float64Array(n),at=(x,y,z)=>(x*n+y)*n+z;
  for(let axis=0;axis<3;axis++)for(let a=0;a<n;a++)for(let b=0;b<n;b++){
    for(let s=0;s<n;s++){const coords=axis===0?[s,a,b]:axis===1?[a,s,b]:[a,b,s],q=at(...coords);rr[s]=re[q];ii[s]=im[q];}
    fftLine(rr,ii,inverse);
    for(let s=0;s<n;s++){const coords=axis===0?[s,a,b]:axis===1?[a,s,b]:[a,b,s],q=at(...coords);re[q]=rr[s];im[q]=ii[s];}
  }
}

function gridFor(S,requested,unsafeAliasing){
  let n=requested??1;while(!requested&&n<=3*S.cutoff)n*=2;
  if(!Number.isSafeInteger(n)||n<2||(n&(n-1)))bad('INVALID_GRID','FFT grid must be a power of two.');
  if(n<=2*S.cutoff)bad('NYQUIST_CONFLICT','Retained modes must exclude the grid Nyquist frequency.');
  if(n<=3*S.cutoff&&!unsafeAliasing)bad('ALIASING_RISK','Quadratic retained-mode products require grid size > 3K.');
  return n;
}

export function advectFFT(S,u,v=u,{gridSize,unsafeAliasing=false}={}){
  const n=gridFor(S,gridSize,unsafeAliasing),N=n**3,at=k=>((k[0]+n)%n*n+(k[1]+n)%n)*n+(k[2]+n)%n;
  const physical=(values,component,derivative=-1)=>{
    const re=new Float64Array(N),im=new Float64Array(N);
    S.modes.forEach((k,i)=>{const q=at(k),a=values[6*i+2*component],b=values[6*i+2*component+1];
      re[q]=derivative<0?a*N:-k[derivative]*b*N;im[q]=derivative<0?b*N:k[derivative]*a*N;
    });fft3(re,im,n,true);return {re,im};
  };
  const ux=[0,1,2].map(d=>physical(u,d)),out=S.zero();
  for(let component=0;component<3;component++){
    const re=new Float64Array(N),im=new Float64Array(N);
    for(let d=0;d<3;d++){const g=physical(v,component,d);for(let q=0;q<N;q++){re[q]+=ux[d].re[q]*g.re[q]-ux[d].im[q]*g.im[q];im[q]+=ux[d].re[q]*g.im[q]+ux[d].im[q]*g.re[q];}}
    fft3(re,im,n,false);S.modes.forEach((k,i)=>{const q=at(k);out[6*i+2*component]=re[q]/N;out[6*i+2*component+1]=im[q]/N;});
  }
  return {value:out,gridSize:n,dealiasing:{gridGreaterThan3K:n>3*S.cutoff,nyquistExcluded:n>2*S.cutoff,retainedCutoff:S.cutoff,normalization:'ifft scales by n^-3, physical coefficients pre-multiplied by n^3; fft product divided by n^3',unsafeAliasing}};
}

export function pressureRecovery(S,u,force=S.zero(),advection=advectDirect(S,u)){
  const pressure=new Float64Array(S.modes.length*2),gradient=S.zero();
  S.modes.forEach((k,i)=>{const q=S.squares[i];if(!q)return;let re=0,im=0;
    for(let d=0;d<3;d++){re+=k[d]*(advection[6*i+2*d]-force[6*i+2*d]);im+=k[d]*(advection[6*i+2*d+1]-force[6*i+2*d+1]);}
    pressure[2*i]=-im/q;pressure[2*i+1]=re/q;
    for(let d=0;d<3;d++){gradient[6*i+2*d]=-k[d]*pressure[2*i+1];gradient[6*i+2*d+1]=k[d]*pressure[2*i];}
  });
  return {pressure,gradient,meanGauge:0,forceDivergenceRetained:true,equation:'|k|^2 p_hat = i k dot (N_hat - f_hat)'};
}

export function invariants(S,u,force=S.zero()){
  let energy=0,gradientSquared=0,work=0;for(let i=0;i<S.modes.length;i++)for(let d=0;d<6;d++){const a=u[6*i+d];energy+=a*a/2;gradientSquared+=S.squares[i]*a*a;work+=a*force[6*i+d];}
  return {energy,gradientSquared,forceWork:work,domain:S.domain.kind,integralNormalization:'spatial mean; multiply by (2pi)^3 for full periodic integral',...validateVelocity(S,u)};
}

export function taylorGreen(S,time=0,viscosity=1){
  if(!(finite(viscosity,'viscosity')>0)||finite(time,'time')<0)bad('INVALID_INPUT','Require viscosity > 0 and time >= 0.');
  const u=S.zero(),amplitude=Math.exp(-2*viscosity*time);
  for(const x of [-1,1])for(const y of [-1,1]){const i=S.index.get(key([x,y,0]));u[6*i+1]=-amplitude*x/4;u[6*i+3]=amplitude*y/4;}
  return u;
}

export function randomSolenoidal(S,seed=5489,{amplitude=.1}={}){
  let state=seed>>>0;const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296-.5;};
  const u=S.zero();S.modes.forEach((k,i)=>{const j=S.index.get(key(k.map(x=>-x)));if(i>=j)return;
    for(let d=0;d<3;d++){u[6*i+2*d]=amplitude*random();u[6*i+2*d+1]=amplitude*random();u[6*j+2*d]=u[6*i+2*d];u[6*j+2*d+1]=-u[6*i+2*d+1];}
  });return project(S,u);
}

function imexStep(S,u,dt,nu,forceAt,t){
  const force0=forceAt(t),g0=project(S,diff(force0,advectDirect(S,u))),predictor=S.zero();
  for(let i=0;i<S.modes.length;i++)for(let d=0;d<6;d++){const j=6*i+d,z=.5*dt*nu*S.squares[i];predictor[j]=((1-z)*u[j]+dt*g0[j])/(1+z);}
  const force1=forceAt(t+dt),g1=project(S,diff(force1,advectDirect(S,predictor))),out=S.zero();
  for(let i=0;i<S.modes.length;i++)for(let d=0;d<6;d++){const j=6*i+d,z=.5*dt*nu*S.squares[i];out[j]=((1-z)*u[j]+.5*dt*(g0[j]+g1[j]))/(1+z);}
  return out;
}

export function integrateGalerkin(input={}){
  const allowed=['cutoff','viscosity','endTime','initialStep','rtol','atol','energyTolerance','cfl','maxSteps','initial','seed','forceAt','fixedStep'];
  if(Object.keys(input).some(k=>!allowed.includes(k)))bad('INVALID_INPUT','Unknown Galerkin input field.');
  const S=fourierSpace(input.cutoff??2),nu=input.viscosity??1,T=input.endTime??.5,rtol=input.rtol??1e-6,atol=input.atol??1e-9,
    energyTolerance=input.energyTolerance??2e-5,cfl=input.cfl??.5,maxSteps=input.maxSteps??2000,forceAt=input.forceAt??(()=>S.zero());
  for(const [k,v]of Object.entries({nu,T,rtol,atol,energyTolerance,cfl}))if(!(finite(v,k)>0))bad('INVALID_INPUT',`${k} must be positive.`);
  if(!Number.isSafeInteger(maxSteps)||maxSteps<1||maxSteps>20000)bad('RESOURCE_LIMIT','maxSteps must be between 1 and 20000.');
  if(T>20||nu>1e4)bad('UNSUPPORTED','The interactive solver supports endTime <= 20 and viscosity <= 10000.');
  let u=input.initial?Float64Array.from(input.initial):input.seed===undefined?taylorGreen(S,0,nu):randomSolenoidal(S,input.seed),t=0,dt=input.initialStep??.05,rejected=0,attempts=0;
  if(!(finite(dt,'initialStep')>0))bad('INVALID_INPUT','initialStep must be positive.');
  if(!validateVelocity(S,u).pass)bad('INVALID_INITIAL_CONSTRAINTS','Initial data must be divergence-free and Hermitian.');
  const initial=Float64Array.from(u),history=[{time:0,...invariants(S,u,forceAt(0))}],steps=[];
  while(t<T&&attempts++<maxSteps){
    if(T-t<=32*Number.EPSILON*Math.max(1,T)){t=T;history[history.length-1].time=T;break;}
    // The Fourier l1 bound is conservative and avoids using a sampled vmax.
    let velocityBound=0;for(let i=0;i<S.modes.length;i++)velocityBound+=norm(u.slice(6*i,6*i+6));
    const cflStep=velocityBound===0?Infinity:cfl/(Math.sqrt(3)*S.cutoff*velocityBound);
    dt=Math.min(dt,T-t,cflStep);if(dt<1e-13)bad('STEP_UNDERFLOW','Time-step budget exhausted; no continuum singularity is inferred.');
    const coarse=imexStep(S,u,dt,nu,forceAt,t),middle=imexStep(S,u,dt/2,nu,forceAt,t),fine=imexStep(S,middle,dt/2,nu,forceAt,t+dt/2),candidate=input.fixedStep?coarse:fine;
    const localError=norm(diff(fine,coarse))/3,errorScale=atol+rtol*Math.max(norm(u),norm(candidate));
    const before=invariants(S,u,forceAt(t)),after=invariants(S,candidate,forceAt(t+dt)),mid=invariants(S,middle,forceAt(t+dt/2));
    const diss=input.fixedStep?dt*nu*(before.gradientSquared+after.gradientSquared)/2:dt*nu*(before.gradientSquared+2*mid.gradientSquared+after.gradientSquared)/4;
    const work=input.fixedStep?dt*(before.forceWork+after.forceWork)/2:dt*(before.forceWork+2*mid.forceWork+after.forceWork)/4;
    const energyDefect=after.energy-before.energy+diss-work,normalizedEnergyDefect=Math.abs(energyDefect)/Math.max(1e-14,before.energy,after.energy,Math.abs(work),diss);
    const accepted=after.pass&&(input.fixedStep||localError<=errorScale&&normalizedEnergyDefect<=energyTolerance);
    steps.push({time:t,dt,cflStep:Number.isFinite(cflStep)?cflStep:null,localError,errorScale,energyDefect,normalizedEnergyDefect,accepted,divergence:after.normalizedDivergence,conjugacy:after.normalizedConjugacy});
    if(accepted){t+=dt;u=candidate;history.push({time:t,...after});}else rejected++;
    if(!input.fixedStep){const errRatio=Math.max(localError/errorScale,normalizedEnergyDefect/energyTolerance,1e-8);dt*=Math.min(2,Math.max(.2,.9*errRatio**(-1/3)));}
  }
  const done=t>=T;
  return {schema:'MathScope.N8.GalerkinRun/1',branch:'GENERIC_FOURIER_GALERKIN',status:done?'FINITE_RUN_COMPLETE':'RESOURCE_LIMIT',
    input:{cutoff:S.cutoff,viscosity:nu,endTime:T,initialStep:input.initialStep??.05,rtol,atol,energyTolerance,cfl,maxSteps,fixture:input.initial?'custom':input.seed===undefined?'Taylor-Green':`random-solenoidal-${input.seed}`,fixedStep:!!input.fixedStep},
    domain:S.domain,method:'IMEX Crank-Nicolson diffusion / explicit Heun convection; adaptive step doubling',designOrder:2,
    initial:[...initial],final:[...u],modes:S.modes,history,steps,acceptedSteps:history.length-1,rejectedSteps:rejected,lastResolvedTime:t,
    precision:{arithmetic:'IEEE-754 binary64',errorControl:'embedded local error and observed energy defect',rigorousErrorEnclosure:false},
    evidence:{finiteDimensionalModel:true,numericalRun:true,analyticCertificate:null,leanTheorem:null,paperReconstruction:false,continuumBlowupProof:false}};
}

export function residualSplitFixture({cutoff=2,seed=3007}={}){
  const S=fourierSpace(cutoff),u=randomSolenoidal(S,seed),w=randomSolenoidal(S,seed+1),ut=randomSolenoidal(S,seed+2),wt=randomSolenoidal(S,seed+3),force=randomSolenoidal(S,seed+4),nu=.7;
  const total=sum(u,w),oldN=advectDirect(S,u),newN=advectDirect(S,total),p0=pressureRecovery(S,u,force,oldN),p1=pressureRecovery(S,total,force,newN),dp=diff(p1.gradient,p0.gradient),square=advectDirect(S,w);
  const diffusion=x=>x.map((v,j)=>nu*S.squares[Math.floor(j/6)]*v),direct=sum(ut,wt,diffusion(total),newN,p1.gradient,scale(force,-1)),old=sum(ut,diffusion(u),oldN,p0.gradient,scale(force,-1));
  const split=sum(old,wt,diffusion(w),advectDirect(S,u,w),advectDirect(S,w,u),square,dp),omitted=sum(old,wt,diffusion(w),advectDirect(S,u,w),advectDirect(S,w,u),dp),denom=Math.max(1,norm(direct));
  return {schema:'MathScope.N6.FiniteResidualIdentityFixture/1',scope:'independent periodic finite-mode numerical algebra fixture',sourceReconstruction:false,
    normalizedIdentityError:norm(diff(direct,split))/denom,omittedQuadraticError:norm(diff(direct,omitted))/denom,pressureRecomputed:true,allCrossTermsRetained:true,
    pass:norm(diff(direct,split))/denom<1e-12&&norm(diff(direct,omitted))/denom>1e-5,fullPaperN6Complete:false};
}

export function galerkinAcceptance(){
  const S=fourierSpace(2),u=randomSolenoidal(S,5489),direct=advectDirect(S,u),fft=advectFFT(S,u),error=norm(diff(direct,fft.value))/Math.max(1,norm(direct));
  const A=fourierSpace(3),high=randomSolenoidal(A,1964),adirect=advectDirect(A,high),alias=advectFFT(A,high,high,{gridSize:8,unsafeAliasing:true}),aliasError=norm(diff(adirect,alias.value))/Math.max(1,norm(adirect));
  let aliasRejected=false;try{advectFFT(A,high,high,{gridSize:8});}catch(e){aliasRejected=e.code==='ALIASING_RISK';}
  const force=S.zero(),idx=S.index.get('1,0,0'),neg=S.index.get('-1,0,0');force[6*idx]=.5;force[6*neg]=.5;
  const pressure=pressureRecovery(S,S.zero(),force),forcePressureError=norm(diff(pressure.gradient,force));
  const convergence=[.1,.05,.025].map(dt=>{
    const run=integrateGalerkin({cutoff:2,endTime:.5,initialStep:dt,fixedStep:true}),exact=taylorGreen(S,.5,1);
    return {dt,error:norm(diff(run.final,exact)),amplitudeError:Math.abs(run.final[6*S.index.get('1,1,0')+1]/(-.25)-Math.exp(-1)),acceptedSteps:run.acceptedSteps,energyDefectMax:Math.max(...run.steps.map(x=>x.normalizedEnergyDefect))};
  });
  const observedOrder=convergence.slice(1).map((r,i)=>Math.log2(convergence[i].error/r.error)),tg=invariants(S,taylorGreen(S)),adaptive=integrateGalerkin({cutoff:2,endTime:.5,initialStep:.1}),randomRun=integrateGalerkin({cutoff:1,seed:103,endTime:.08,initialStep:.025,rtol:1e-5});
  const cancellation=Math.abs(u.reduce((s,v,j)=>s+v*direct[j],0)),split=residualSplitFixture();
  const checks=[{id:'N8-01-solenoidal-Hermitian',pass:validateVelocity(S,u).pass&&adaptive.history.every(x=>x.pass)&&randomRun.history.every(x=>x.pass)},
    {id:'N8-01-pressure-includes-div-f',pass:forcePressureError<1e-12},
    {id:'N8-02-direct-versus-padded-FFT',pass:error<1e-11},
    {id:'N8-02-high-mode-alias-mutation',pass:aliasError>1e-5&&aliasRejected},
    {id:'N8-03-Taylor-Green-order-two',pass:observedOrder.every(x=>x>1.8&&x<2.2)},
    {id:'N8-03-exact-Taylor-Green-energy',pass:Math.abs(tg.energy-.25)<1e-12&&Math.abs(tg.gradientSquared-1)<1e-12},
    {id:'N8-03-finite-convection-energy-cancellation',pass:cancellation<1e-12},
    {id:'N8-03-adaptive-step-gates',pass:adaptive.status==='FINITE_RUN_COMPLETE'&&randomRun.status==='FINITE_RUN_COMPLETE'&&adaptive.steps.filter(x=>x.accepted).every(x=>x.localError<=x.errorScale&&x.normalizedEnergyDefect<=adaptive.input.energyTolerance)},
    {id:'N6-02-quadratic-residual-negative-control',pass:split.pass}];
  return {schema:'MathScope.N8.GalerkinAcceptance/1',checks,pass:checks.every(x=>x.pass),convolution:{normalizedError:error,grid:fft.gridSize,aliasNormalizedError:aliasError,aliasRejected},
    pressure:{nonDivergenceFreeForceAccepted:true,error:forcePressureError},convergence,observedOrder,energyCancellation:cancellation,residualSplit:split,selectedRun:adaptive,nonlinearRun:randomRun,
    scope:'Actual finite Fourier-Galerkin implementation and observed binary64 verification; no continuum certification and no N6/N7 paper reconstruction.'};
}

export function sampleVelocity(S,u,positions){
  if(!Array.isArray(positions)||positions.length>2000)bad('RESOURCE_LIMIT','Use at most 2000 observation points.');
  return positions.map(x=>{if(!Array.isArray(x)||x.length!==3||x.some(y=>!Number.isFinite(y)))bad('INVALID_INPUT','Use finite Cartesian positions.');
    const velocity=[0,0,0];S.modes.forEach((k,i)=>{const phase=k.reduce((s,v,d)=>s+v*x[d],0),c=Math.cos(phase),s=Math.sin(phase);for(let d=0;d<3;d++)velocity[d]+=u[6*i+2*d]*c-u[6*i+2*d+1]*s;});
    return {position:[...x],velocity,speed:norm(velocity)};
  });
}

export const galerkinInternals={norm,diff,maxAbs};
