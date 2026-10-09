import {exteriorPoint,exteriorJet,heatFast,taylorGreenPoint} from './heat.mjs';
import {fromSimilarity,toSimilarity,monomialJet,parameters} from './coordinates.mjs';
import {ComputeError,makeBudget} from './numerics.mjs';
import {parameterOrder,buildOuterSchedule} from './radial.mjs';
import {solveAxisCoefficients,evaluateAxis} from './axis-series.mjs';
const offsets=[-3,-2,-1,0,1,2,3],D1=[-1/60,3/20,-3/4,0,3/4,-3/20,1/60],D2=[1/90,-3/20,3/2,-49/18,3/2,-3/20,1/90];
const norm=a=>Math.hypot(...a),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function derivative(f,x,h,order=1){const w=order===1?D1:D2;return offsets.reduce((s,k,i)=>s+w[i]*f(x+k*h),0)/h**order;}
export function coordinateChecks(input={}){
  const o=parameters(input),positions=[fromSimilarity({X:.37,eta:-.48,theta:.7},o).position,fromSimilarity({X:1.3,eta:.62,theta:1.2},o).position],checks=[];
  for(const [i,position] of positions.entries())for(const powers of [{b:.3,radialPower:2,axialPower:3},{b:-.8,radialPower:1,axialPower:0},{b:1.2,radialPower:0,axialPower:2}]){
    const p={...o,...powers},v=monomialJet(position,p),ht=Math.min(.0008,o.tau/10),hz=.0008*Math.sqrt(o.viscosity),dt=derivative(tau=>monomialJet(position,{...p,tau}).value,o.tau,ht)*(-1),dz=derivative(z=>monomialJet([position[0],position[1],z],p).value,position[2],hz),err=Math.max(Math.abs(dt-v.dt)/(1+Math.abs(v.dt)),Math.abs(dz-v.dz)/(1+Math.abs(v.dz)));
    checks.push({name:`coordinate_chain_${i}_${powers.radialPower}_${powers.axialPower}`,pass:err<1e-10,error:err,tolerance:1e-10,independentPaths:['paper T_b/Z_b analytic operator','seven-point physical-coordinate finite difference through inverse root solve']});
  }return checks;
}
export function pdeFD(field,position,input={},options={}){
  const h=options.step??.002,ht=Math.min(h,(input.tau??.3)/10),value=field(position,input),u=value.velocity,grad=Array.from({length:3},()=>Array(3).fill(0)),lap=[0,0,0],dt=[0,0,0],pg=[0,0,0];
  for(let c=0;c<3;c++){
    dt[c]=derivative(t=>field(position,{...input,[options.timeKey??'time']:t}).velocity[c],input[options.timeKey??'time']??0,ht)*(options.timeKey==='tau'?-1:1);
    for(let j=0;j<3;j++){
      const f=s=>{const p=[...position];p[j]=s;return field(p,input).velocity[c];};
      grad[c][j]=derivative(f,position[j],h);lap[c]+=derivative(f,position[j],h,2);
    }
  }
  if(value.pressure!==undefined&&value.pressure!==null){for(let j=0;j<3;j++)pg[j]=derivative(s=>{const p=[...position];p[j]=s;return field(p,input).pressure;},position[j],h);}else pg.splice(0,3,...value.pressureGradient);
  const advection=grad.map(g=>dot(u,g)),residual=dt.map((x,i)=>x+advection[i]-(input.viscosity??1)*lap[i]+pg[i]),denominator=1+norm(dt)+norm(advection)+(input.viscosity??1)*norm(lap)+norm(pg);
  return {residual,normalizedResidual:norm(residual)/denominator,normalization:'1+||dt u||2+||(u·grad)u||2+nu||lap u||2+||grad p||2',divergence:grad[0][0]+grad[1][1]+grad[2][2],terms:{dt,advection,laplacian:lap,pressureGradient:pg},derivativeMethod:'seven-point centered physical finite differences; not copied analytic jets',step:h,solutionErrorBound:null};
}
export function exactPDEChecks(input={},budget=makeBudget()){
  const checks=[],point=[.71,.43,.27],time=.19;
  for(const viscosity of [.1,1,3]){
    budget.tick();const p={time,viscosity},r=pdeFD(taylorGreenPoint,point,p),fine=pdeFD(taylorGreenPoint,point,p,{step:.003});
    checks.push({name:`taylor_green_fd_nu_${viscosity}`,pass:r.normalizedResidual<1e-9&&fine.normalizedResidual<1e-9,value:r,refinedValue:fine,tolerance:1e-9});
    const bad=pdeFD(taylorGreenPoint,point,{...p,pressureSign:-1});checks.push({name:`negative_pressure_sign_nu_${viscosity}`,pass:bad.normalizedResidual>1e-3,negativeControl:true,observedResidual:bad.normalizedResidual});
  }
  const o={tau:.3,h:.005,viscosity:1,cInfinity:1},r=1.2,j=exteriorJet(r,o,budget),hm=heatFast(j.Z,o.h),ode=j.Z*j.Z*hm.ddH+(1+(2+2*o.h)*j.Z)*hm.dH+o.h*(1+o.h)*hm.H;
  checks.push({name:'heat_ode_independent_integrals',pass:Math.abs(ode)<1e-10,residual:ode,tolerance:1e-10});
  const fdDt=-derivative(tau=>exteriorJet(r,{...o,tau},budget).K,o.tau,.002),fdDr=derivative(x=>exteriorJet(x,o,budget).K,r,.004),fdDrr=derivative(x=>exteriorJet(x,o,budget).K,r,.004,2),correct=fdDt-(fdDrr+fdDr/r-j.K/(r*r)),wrongSign=fdDt-(fdDrr+fdDr/r+j.K/(r*r));
  checks.push({name:'heat_cylindrical_fd',pass:Math.abs(correct)/(1+Math.abs(fdDt)+Math.abs(fdDrr)+Math.abs(fdDr/r)+Math.abs(j.K/(r*r)))<1e-9,residual:correct,tolerance:1e-9});
  checks.push({name:'negative_heat_angular_laplacian_sign',pass:Math.abs(wrongSign)>.1,negativeControl:true,residual:wrongSign});
  const ext=(p,o)=>exteriorPoint(p,o,budget),e=pdeFD(ext,[1.1,.5,.2],o,{timeKey:'tau',step:.004});checks.push({name:'exterior_full_momentum_with_pressure',pass:e.normalizedResidual<1e-9,value:e,tolerance:1e-9});
  const noPressure=(p,o)=>({...ext(p,o),pressureGradient:[0,0,0]}),np=pdeFD(noPressure,[1.1,.5,.2],o,{timeKey:'tau',step:.004});checks.push({name:'negative_missing_exterior_pressure',pass:np.normalizedResidual>1e-3,negativeControl:true,value:np});
  const wrongNu=(p,o)=>ext(p,{...o,viscosity:1}),wn=pdeFD(wrongNu,[1.1,.5,.2],{...o,viscosity:3},{timeKey:'tau',step:.004});checks.push({name:'negative_inconsistent_viscosity',pass:wn.normalizedResidual>1e-4,negativeControl:true,value:wn});
  return checks;
}
export function coreReconstructionChecks(input={},budget=makeBudget()){
  const o={...parameterOrder({logC:0}),...parameters({tau:.3}),axisOrder:8},outer=buildOuterSchedule(o,budget),cache=new Map();
  const coeff=eta=>{if(!cache.has(eta))cache.set(eta,solveAxisCoefficients(eta,o,outer.pressureJet,budget));return cache.get(eta);};
  const field=(position,options)=>{const c=toSimilarity(position,options),p=evaluateAxis(coeff(c.eta),c.X),q=c.q,nu=options.viscosity,[x,y]=position;return {velocity:[p.VoverX*x/(2*q)-q**(-1-options.h)*p.F*y,p.VoverX*y/(2*q)+q**(-1-options.h)*p.F*x,Math.sqrt(nu)*q**(-.5-options.h)*p.U],pressure:nu*q**(-1-2*options.h)*p.Pi,position};};
  const position=fromSimilarity({X:.1/o.Lambda,eta:0,theta:.7},o).position,r=pdeFD(field,position,o,{timeKey:'tau',step:.00025}),p=evaluateAxis(coeff(0),.1/o.Lambda),axis=field([0,0,0],o),denominator=1+Math.hypot(...r.terms.advection)+Math.hypot(...r.terms.dt),divErr=Math.abs(r.divergence)/denominator;
  const base=solveAxisCoefficients(.2,{...o,axisOrder:4},outer.pressureJet,budget),fine=solveAxisCoefficients(.2,{...o,axisOrder:8},outer.pressureJet,budget),a=evaluateAxis(base,.4/o.Lambda),b=evaluateAxis(fine,.4/o.Lambda);
  return [{name:'actual_core_Cartesian_divergence_FD',pass:divErr<1e-8,normalizedDivergence:divErr,divergence:r.divergence,tolerance:1e-8,point:position,independentPaths:['source radial integral average reconstruction','seven-point Cartesian finite difference with separate inverse coordinate solves'],fullNSResidual:r.normalizedResidual,fullNSResidualMustVanish:false,reason:'The source leading profile omits axial viscosity from its leading tangential system; this finite truncation is not a full NS solution.'},{name:'actual_core_axis_regular_representation',pass:[...axis.velocity,axis.pressure,p.F,p.VoverX].every(Number.isFinite),axisValue:axis,representation:'u_xy=VoverX*(x,y)/(2q)+q^(-1-h)F*(-y,x); no division by r on the axis.'},{name:'nonlinear_axis_recurrence_order_refinement',pass:Math.abs(b.leadingResidual.angular)<Math.abs(a.leadingResidual.angular)&&Math.abs(b.Phi-b.comparison)>1e-4,coarse:a.leadingResidual,refined:b.leadingResidual,nonlinearPhi:b.Phi,scalarComparison:b.comparison,certifiedNonlinearTail:false}];
}
const cadd=(a,b)=>[a[0]+b[0],a[1]+b[1]],cmul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],cscale=(a,s)=>[a[0]*s,a[1]*s];
function fft(a,inverse=false){
  const n=a.length;if(n===1)return [a[0]];let p=2;while(p<n&&n%p)p++;const m=n/p;
  const subs=Array.from({length:p},(_,j)=>fft(Array.from({length:m},(_,r)=>a[j+p*r]),inverse));
  return Array.from({length:n},(_,k)=>{let s=[0,0];for(let j=0;j<p;j++){const angle=(inverse?1:-1)*2*Math.PI*j*k/n;s=cadd(s,cmul(subs[j][k%m],[Math.cos(angle),Math.sin(angle)]));}return s;});
}
function transform3(a,n,inverse){let data=a.map(x=>[...x]);for(let axis=0;axis<3;axis++)for(let i=0;i<n;i++)for(let j=0;j<n;j++){
  const ids=Array.from({length:n},(_,k)=>axis===0?(k*n+i)*n+j:axis===1?(i*n+k)*n+j:(i*n+j)*n+k),v=fft(ids.map(id=>data[id]),inverse);ids.forEach((id,k)=>data[id]=v[k]);
}if(inverse)data=data.map(x=>cscale(x,1/n**3));return data;}
const idx=(k,n)=>((k[0]%n+n)%n*n+(k[1]%n+n)%n)*n+(k[2]%n+n)%n;
export function spectralConvolutionCheck(input={},budget=makeBudget()){
  const baseN=6,paddedN=9,retained=2,seeds=[{k:[2,0,0],v:[0,.3,.2],phase:.2},{k:[2,1,0],v:[.2,-.4,.1],phase:.8},{k:[0,2,0],v:[.1,0,.3],phase:-.3},{k:[0,0,1],v:[.2,.1,0],phase:.5}],modes=[];
  for(const s of seeds){const z=[Math.cos(s.phase)/2,Math.sin(s.phase)/2],u=s.v.map(x=>cscale(z,x));modes.push({k:s.k,u},{k:s.k.map(x=>-x),u:u.map(([a,b])=>[a,-b])});}
  const direct=new Map();
  for(const p of modes)for(const q of modes){budget.tick();const k=p.k.map((x,i)=>x+q.k[i]);if(k.some(x=>Math.abs(x)>retained))continue;let qp=[0,0];for(let j=0;j<3;j++)qp=cadd(qp,cscale(p.u[j],q.k[j]));const v=q.u.map(x=>cmul([0,1],cmul(qp,x))),key=k.join(',');if(!direct.has(key))direct.set(key,[[0,0],[0,0],[0,0]]);direct.set(key,direct.get(key).map((x,i)=>cadd(x,v[i])));}
  function pseudo(n){budget.tick(15*n**3);const grids=[],grads=[];for(let c=0;c<3;c++){const coeff=Array.from({length:n**3},()=>[0,0]);for(const m of modes)coeff[idx(m.k,n)]=cscale(m.u[c],n**3);grids[c]=transform3(coeff,n,true).map(x=>x[0]);grads[c]=[];for(let j=0;j<3;j++){const d=Array.from({length:n**3},()=>[0,0]);for(const m of modes)d[idx(m.k,n)]=cscale(cmul([0,m.k[j]],m.u[c]),n**3);grads[c][j]=transform3(d,n,true).map(x=>x[0]);}}
    const nonlinear=Array.from({length:3},(_,c)=>Array.from({length:n**3},(_,i)=>grids.reduce((s,g,j)=>s+g[i]*grads[c][j][i],0))),hat=nonlinear.map(a=>transform3(a.map(x=>[x,0]),n,false).map(x=>cscale(x,1/n**3)));let defect=0;for(let i=0;i<n**3;i++)for(let c=0;c<3;c++)defect+=grids[c][i]*nonlinear[c][i]/n**3;return {hat,energyCancellation:defect};}
  const padded=pseudo(paddedN),aliased=pseudo(baseN);let error=0,badError=0,scale=0;
  for(let x=-retained;x<=retained;x++)for(let y=-retained;y<=retained;y++)for(let z=-retained;z<=retained;z++){const k=[x,y,z],d=direct.get(k.join(','))??[[0,0],[0,0],[0,0]];for(let c=0;c<3;c++){error=Math.max(error,Math.hypot(...padded.hat[c][idx(k,paddedN)].map((v,j)=>v-d[c][j])));badError=Math.max(badError,Math.hypot(...aliased.hat[c][idx(k,baseN)].map((v,j)=>v-d[c][j])));scale=Math.max(scale,Math.hypot(...d[c]));}}
  return {model:'independent-Fourier-convolution-fixture',pass:error/(1+scale)<1e-11&&Math.abs(padded.energyCancellation)<1e-11&&badError>1e-3,checks:[{name:'FFT_vs_direct_convolution',pass:error/(1+scale)<1e-11,error,normalizedError:error/(1+scale),tolerance:1e-11},{name:'dealiased_energy_cancellation',pass:Math.abs(padded.energyCancellation)<1e-11,value:padded.energyCancellation},{name:'negative_aliasing_without_padding',pass:badError>1e-3,negativeControl:true,error:badError}],grid:{baseN,paddedN,paddingFactor:1.5,retainedModes:'each k_j in [-2,2]; all base Nyquist modes excluded',complexSymmetry:'u(-k)=conj(u(k))'},independentPaths:['nested finite mode convolution in coefficient space','mixed-radix 3D FFT, 3/2 zero padding, physical product'],solutionErrorBound:null,budget:budget.snapshot()};
}
