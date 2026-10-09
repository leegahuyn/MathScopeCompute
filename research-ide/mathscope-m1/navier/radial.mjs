import {ComputeError,integrate,makeBudget,solveLinear,positive,boundedInteger,point,interval,iadd,isub,imul,idiv,ipow,ipower,ball} from './numerics.mjs';
import {heatFast} from './heat.mjs';
import {jetC,jetVar,jetAdd,jetScale,jetMul,jetInv,jetLog,jetExp} from './axis-series.mjs';
export function smoothStep(y){if(y<=0)return 0;if(y>=1)return 1;const z=-1/(y*y)+1/((1-y)**2);return z>0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));}
export function smoothStepDerivative(y){if(y<=0||y>=1)return 0;const s=smoothStep(y);return s*(1-s)*(2/y**3+2/(1-y)**3);}
export function compactBump(x,a,b){if(!(a<b))throw new ComputeError('INVALID_SUPPORT','Bump support must have positive width');if(x<=a||x>=b)return 0;return smoothStepDerivative((x-a)/(b-a))/(b-a);}
const sigmaIntegral=y=>y<=0?0:y>=1?y-.5:integrate(smoothStep,0,y,1e-11).value;
export function parameterOrder(input={}){
  const Md=positive(input.Md??.2,'Md'),Td=Math.exp(Md)+10,logP=Number(input.logP??Math.log(input.PStar??2)),lambda=positive(input.lambda??.08,'lambda'),h=positive(input.h??.005,'h'),Lambda=positive(input.Lambda??48,'Lambda'),j0=positive(input.j0??.03,'j0'),sigmaStar=positive(input.sigmaStar??.2,'sigmaStar'),XR=positive(input.XR??1e5,'XR'),logC=Number(input.logC??16),frequency=boundedInteger(input.frequency??32,'frequency',2,512);
  if(!(h<.01&&lambda<.5&&j0<=.05))throw new ComputeError('INVALID_INPUT','Require h<.01, lambda<.5, j0<=.05');
  const ordered=[{name:'Md',value:Md},{name:'Td',value:Td,depends:['Md']},{name:'PStar',logValue:logP,depends:['Td']},{name:'lambda',value:lambda,depends:['PStar']},{name:'h',value:h,depends:['lambda','Td']},{name:'matchingTolerance,j0',value:j0,depends:['outerDatum']},{name:'deltaStar,sigmaStar,Lambda',value:Lambda,depends:['j0','outerDatum']},{name:'Tsh',value:null,depends:['Lambda']},{name:'C,XR',logC,XR,depends:['Tsh']},{name:'activationWidths',value:null,depends:['XR']},{name:'N',value:frequency,depends:['allPreviousFiniteParameters']}];
  const checks=[{name:'PStar_gt_exp_Td',pass:logP>Td,actual:logP,required:`log(PStar)>${Td}`},{name:'h_lt_lambda',pass:h<lambda},{name:'h_lt_exp_minus_Td',pass:Math.log(h)<-Td},{name:'j0_range',pass:j0>0&&j0<=.05},{name:'four_reserved_patches_fit',pass:60*Math.log(1/lambda)>25}];
  return {Md,Td,logP,PStar:Math.exp(logP),lambda,h,Lambda,j0,sigmaStar,XR,logC,frequency,ordered,checks,fullyCertified:false,
    blockers:[{id:'OUTER_QUANTITATIVE_THRESHOLDS',criterion:'N3-01',reason:'A.6 requires sufficiently large Md and sufficiently small lambda/h after earlier choices. Necessary displayed inequalities are executable; the unstated proof constants and all derivative smallness thresholds remain uninstantiated.'},{id:'B40_CONTINUATION_CONSTANTS',criterion:'N3-01',reason:'B_k, T_sh, activation widths, complex-domain normalization, and uniform moment tolerance have not been quantitatively extracted.'}],source:{source:'N00',pages:[18,129,157],equations:['A.6','B.40']}};
}
/** Literal unedited E schedule from A.2, on logarithmic radius y=log(X/XR).
 * A.11 angular moment bumps and A.7 heat compensation are separately pending.
 */
export function buildOuterSchedule(o,budget=makeBudget()){
  const stages=[];let y=0,logA=o.logP;
  function add(name,length,delta,theta=1,extra={}){const s={name,start:y,end:y+length,logAStart:logA,theta,...extra};stages.push(s);y+=length;logA+=delta(length);s.logAEnd=logA;s.delta=delta;return s;}
  add('initial-slope',1,t=>.1*t-.6*sigmaIntegral(t));
  add('axial-decay',o.Td,t=>-.5*t);
  add('intermediate-entry',1,t=>-.5*t-o.lambda*sigmaIntegral(t));
  const Tw=60*Math.log(1/o.lambda),power=add('reserved-power',Tw,t=>-(.5+o.lambda)*t);
  const reserved=[[Tw-25,Tw-20],[Tw-20,Tw-15],[Tw-14,Tw-9],[Tw-8,Tw-3]].map((v,i)=>({id:['cone-repair','heat-repair','Ipos','Imean'][i],logRelativeStart:power.start+v[0],logRelativeEnd:power.start+v[1],purpose:['C.2 moment restoration','A.7 heat moment compensation','higher background moments','phase mean moments'][i]}));
  const pulse=add('axial-pulse',13/o.lambda,t=>-(.5+o.lambda)*t);
  const Tf=64,interp=add('parameter-interpolation',Tf,t=>-(.5+o.lambda)*t,1,{Tf});
  logA-=Math.log(2);interp.logAEnd=logA;
  add('angular-moment-patch',30*Math.log(1/o.lambda),t=>-(.5+o.lambda)*t,0);
  const transitionStart=y;
  add('exterior-steepen',1,t=>-(.5+o.lambda)*t-(1-o.lambda)*sigmaIntegral(t),0);
  add('steep-power',4*Math.log(1/o.h),t=>-1.5*t,0);
  add('exterior-flatten',1,t=>-1.5*t+(1-o.h)*sigmaIntegral(t),0);
  const co=.005,rho=co*o.h,fo=t=>1-rho*(1-smoothStep((t-1)/2)),foPrime=t=>rho*smoothStepDerivative((t-1)/2)/2;
  const Qp=integrate(t=>Math.exp((1-o.h)*t)*foPrime(t)/fo(0),0,3,1e-12,budget).value;
  let Q=(o.lambda-o.h)/(1-o.lambda);const end=y,steps=2000,dy=(end-transitionStart)/steps;
  const ellAt=yy=>{const s=stages.find(s=>yy>=s.start&&yy<=s.end);if(!s)return -.5;const t=yy-s.start;if(s.name==='exterior-steepen')return -o.lambda-(1-o.lambda)*smoothStep(t);if(s.name==='steep-power')return -1;if(s.name==='exterior-flatten')return -1+(1-o.h)*smoothStep(t);return -o.lambda;};
  const ode=(yy,q)=>{const l=ellAt(yy);return -(1+l)*q-l-o.h;};
  for(let i=0;i<steps;i++){const yy=transitionStart+i*dy,k1=ode(yy,Q),k2=ode(yy+dy/2,Q+dy*k1/2),k3=ode(yy+dy/2,Q+dy*k2/2),k4=ode(yy+dy,Q+dy*k3);Q+=dy*(k1+2*k2+2*k3+k4)/6;}
  const wait=Q>Qp&&Qp>0?Math.log(Q/Qp)/(1-o.h):0;
  add('terminal-wait',wait,t=>-(.5+o.h)*t,0);
  add('terminal-flat-collar',3,t=>-(.5+o.h)*t+Math.log(fo(t)/fo(0)),0);
  const logCInfinity=logA+(.5+o.h)*(y+Math.log(o.XR));
  function component(yValue,eta,{heat=true}={}){
    const f=1/(1+eta*eta);let logE,theta=1,stage,U;
    if(yValue<=0){logE=o.logP+Math.log(f)+.1*yValue;stage='reference-inner';U=4*eta;}
    else if(yValue>=y){const logX=yValue+Math.log(o.XR),Z=logX>700?0:2*(1-eta*eta)*Math.exp(-logX),H=heat?heatFast(Math.max(0,Z),o.h).H:1;logE=logCInfinity-(.5+o.h)*logX+Math.log(H);stage='heat-exterior';theta=0;U=0;}
    else {const s=stages.find(s=>yValue>=s.start&&yValue<=s.end),t=yValue-s.start;stage=s.name;theta=s.theta;
      if(stage==='parameter-interpolation'){theta=1-smoothStep(t/Tf);logE=s.logAStart-(.5+o.lambda)*t+theta*Math.log(f)-(1-theta)*Math.log(2);}
      else logE=s.logAStart+s.delta(t)+theta*Math.log(f);
      if(stage==='initial-slope')U=4*eta;
      else if(stage==='axial-decay')U=4*(1-smoothStep(Math.log1p(t)/o.Md))*eta;
      else if(stage==='axial-pulse'){const xi=o.lambda*t,phiB=xi<=.02?.02*sigmaIntegral(xi/.02):xi-.01,R0=phiB*(1-smoothStep(xi-10));U=Math.exp(logE)*(1.05*R0);}
      else U=0;
    }
    return {y:yValue,logX:yValue+Math.log(o.XR),eta,logE,E:logE<-700?0:logE>700?null:Math.exp(logE),U:Number.isFinite(U)?U:null,theta,stage,underflow:logE<-700,scope:'A.2 unedited radial E schedule; axial pulse Amp=1.05 is an explicit uncalibrated candidate; A.8/A.11/A.7 repairs pending'};
  }
  let pressureScalar=null,pressureAudit=null;
  function pressureJet(eta,n){
    const e=jetVar(eta,n),f=jetInv(jetAdd(jetC(1,n),jetMul(e,e)));
    if(pressureScalar===null){const cut=Math.min(40,interp.start),N=800,integral=n=>{const dy=cut/n;let sum=0;for(let i=0;i<=n;i++){const yy=i*dy,v=component(yy,0,{heat:false}),w=i===0||i===n?1:i%2?4:2;sum+=w*Math.exp(2*v.logE);}return dy*sum/6;},coarse=integral(N),fine=integral(2*N);pressureScalar=-2.5*o.PStar**2-fine;const endE=component(cut,0,{heat:false});pressureAudit={reference:'A.21 reference pressure datum before all required moment restorations',logRadiusIntegral:[0,cut],innerAnalyticContribution:-2.5*o.PStar**2,outerFiniteIntegral:-fine,quadratureDifferenceEstimate:Math.abs(fine-coarse)/15,tailScaleEstimate:Math.exp(2*endE.logE)/(4*.49),tailHypothesis:'The omitted E log-slope is at most -0.49; this hypothesis and all eta derivatives are not interval certified.',heatAndMomentRepairsApplied:false,certified:false};}
    return jetScale(jetMul(f,f),pressureScalar);
  }
  return {stages:stages.map(({delta,...s})=>s),reserved,terminalLogRadius:y,logCInfinity,logNormalization:'CInfinity stored as log because outer radii may exceed binary64',QAtWaitStart:Q,Qp,wait,component,pressureJet,pressureAudit:()=>{pressureJet(0,0);return pressureAudit;},
    checks:[{name:'reserved_patches_disjoint',pass:reserved.every((r,i)=>i===0||reserved[i-1].logRelativeEnd<r.logRelativeStart||reserved[i-1].logRelativeEnd===r.logRelativeStart)},{name:'terminal_wait_positive',pass:Q>=Qp&&Qp>0}],
    blockers:[{id:'A8_AXIAL_AMPLITUDE',criterion:'N3-02',reason:'The source Amp(eta), two end corrections imposing M=J=0, and S=0 have not been calibrated on the entire exponentially long schedule.'},{id:'A11_ANGULAR_PRESSURE_MOMENTS',criterion:'N3-02',reason:'Two relative E bumps imposing angular moment and pressure increment preservation are not yet applied.'},{id:'A7_HEAT_COMPENSATION',criterion:'N3-02',reason:'Heat replacement is evaluated exactly in the far branch; its five-moment compensation and exact common pressure datum require the completed A.7 solve.'}],source:{source:'N00',pages:[129,130,133,138,139],equations:['A.5','A.7','A.9','A.10','A.12','A.13','A.21','A.32']}};
}
export function fiveMoments(profile,a,b,N=600){
  N=2*Math.ceil(N/2);const h=(b-a)/N,s=[0,0,0,0,0];for(let i=0;i<=N;i++){const x=a+i*h,{E,U}=profile(x),H=Math.sqrt(2*x)*E,w=(i===0||i===N?1:i%2?4:2)*h/3;const v=[U,H,U*H,U*U-E*E/2,E*E/(2*x)];v.forEach((v,k)=>s[k]+=w*v);}return s;
}
export function solveFiveMomentRepair({eta=.2,PStar=2,lambda=.08,patch=[Math.exp(-6),Math.exp(-5)],discrepancy=null,base='inner-reference',omitQuadratic=false,overlap=false,iterations=20}={},budget=makeBudget()){
  iterations=boundedInteger(iterations,'iterations',1,40);PStar=positive(PStar,'PStar');lambda=positive(lambda,'lambda');if(!(Math.abs(eta)<=1))throw new ComputeError('INVALID_INPUT','Moment eta requires |eta|<=1');if(discrepancy!==null&&(!Array.isArray(discrepancy)||discrepancy.length!==5||!discrepancy.every(Number.isFinite)))throw new ComputeError('INVALID_INPUT','Five finite moment discrepancies are required');
  const [a,b]=patch;if(!(a>0&&b>a))throw new ComputeError('INVALID_SUPPORT','Require positive radial patch a<b');
  const width=(b-a)/16,centers=Array.from({length:5},(_,j)=>a+(j+1)*(b-a)/6),supports=centers.map(c=>[c-width/2,c+width/2]);if(overlap)supports[1]=[...supports[0]];
  if(supports.some((s,i)=>i>0&&s[0]<=supports[i-1][1]))throw new ComputeError('INVALID_SUPPORT','Ordered bump supports overlap',{supports});
  const ideal=x=>({E:PStar/(1+eta*eta)*x**(base==='inner-reference'?.1:-.5-lambda),U:base==='inner-reference'?4*eta:0});
  const bumps=x=>supports.map(([l,r])=>compactBump(x,l,r)*width),scale=fiveMoments(ideal,a,b,800).map(x=>Math.max(Math.abs(x),1e-8));
  const N=800,dx=(b-a)/N,rows=[];for(let i=0;i<=N;i++){const x=a+i*dx,w=(i===0||i===N?1:i%2?4:2)*dx/3;rows.push({x,w,...ideal(x),b:bumps(x)});}
  const plantedCoefficients=[.001,-.0008,.0004,-.0005,.0003];
  if(discrepancy===null){const ref=fiveMoments(ideal,a,b,3200),planted=x=>{const p=ideal(x),v=bumps(x),c=plantedCoefficients;return {E:p.E+c[2]*v[2]+c[3]*v[3]+c[4]*v[4],U:p.U+c[0]*v[0]+c[1]*v[1]};},target=fiveMoments(planted,a,b,3200);discrepancy=target.map((x,k)=>ref[k]-x);}
  const evalMap=c=>{const F=Array(5).fill(0),J=Array.from({length:5},()=>Array(5).fill(0));for(const r of rows){const dU=c[0]*r.b[0]+c[1]*r.b[1],dE=c[2]*r.b[2]+c[3]*r.b[3]+c[4]*r.b[4],U=r.U+dU,E=r.E+dE,sqrt=Math.sqrt(2*r.x),quad=omitQuadratic?0:1;
    const delta=[dU,sqrt*dE,(r.U*dE+r.E*dU+quad*dU*dE)*sqrt,2*r.U*dU-r.E*dE+quad*(dU*dU-dE*dE/2),(2*r.E*dE+quad*dE*dE)/(2*r.x)];
    for(let k=0;k<5;k++)F[k]+=r.w*delta[k];
    for(let j=0;j<5;j++){const du=j<2?r.b[j]:0,de=j>=2?r.b[j]:0,v=[du,sqrt*de,sqrt*(E*du+U*de),2*U*du-E*de,E*de/r.x];for(let k=0;k<5;k++)J[k][j]+=r.w*v[k];}}
    return {F:F.map((v,k)=>(v+discrepancy[k])/scale[k]),J:J.map((row,k)=>row.map(x=>x/scale[k]))};};
  let c=Array(5).fill(0),history=[],last;
  for(let it=0;it<iterations;it++){budget.tick(rows.length*25);last=evalMap(c);const residual=Math.max(...last.F.map(Math.abs));history.push(residual);if(residual<2e-12)break;const solve=solveLinear(last.J,last.F.map(x=>-x));let fac=1;for(let j=0;j<28;j++){const trial=c.map((x,k)=>x+fac*solve.solution[k]);if(Math.max(...evalMap(trial).F.map(Math.abs))<residual){c=trial;break;}fac/=2;}}
  const corrected=x=>{const v=ideal(x),bs=bumps(x);return {E:v.E+c[2]*bs[2]+c[3]*bs[3]+c[4]*bs[4],U:v.U+c[0]*bs[0]+c[1]*bs[1]};};
  const m0=fiveMoments(ideal,a,b,3200),m1=fiveMoments(corrected,a,b,3200),physicalResidual=m1.map((x,k)=>x-m0[k]+discrepancy[k]),scaled=Math.max(...physicalResidual.map((x,k)=>Math.abs(x)/scale[k])),positiveE=rows.every(r=>corrected(r.x).E>0),J=evalMap(c).J,invColumns=Array.from({length:5},(_,j)=>solveLinear(J,Array.from({length:5},(_,k)=>j===k?1:0)).solution),inverseNorm=Math.max(...Array.from({length:5},(_,i)=>invColumns.reduce((s,col)=>s+Math.abs(col[i]),0))),newtonStep=solveLinear(J,evalMap(c).F.map(x=>-x)).solution;
  return {status:scaled<1e-8&&positiveE&&!omitQuadratic?'NUMERICAL_MOMENT_MATCH':'REJECTED_MOMENT_MATCH',eta,patch,supports,coefficients:c,momentOrder:['M','I','J','S','Cp'],targetDiscrepancy:discrepancy,residual:physicalResidual,normalizedResidual:scaled,quadratureNodes:{solve:801,independentCheck:3201},jacobian:J,inverseInfinityNorm:inverseNorm,lastNewtonStep:Math.max(...newtonStep.map(Math.abs)),history,positive:positiveE,intervalNewtonCertified:false,
    acceptance:{finiteNumericalMatch:scaled<1e-8&&positiveE,continuousFiveMomentsCertified:false,uniformEtaDerivativesCertified:false},blockers:[{id:'CONTINUOUS_MOMENT_NEWTON_BOUND',criterion:'N3-05',reason:'The finite nonlinear system is solved and independently reintegrated. A continuous quadrature enclosure, an interval-Newton inclusion, and uniform eta-derivative control are still required.'}],profileSamples:Array.from({length:81},(_,i)=>{const x=a+(b-a)*i/80;return {x,...corrected(x)};}),source:{source:'N00',pages:[155,156,157,162],equations:['B.35','B.36','C.17']}};
}
export function coneMargins({a,bs,ps}){
  if(!(a>0))return {pass:false,reason:'a must be positive',a,bs,ps};const ts=-bs/a,vs=a+bs*bs/a,Pc=ps[0]+ts*ps[1],Jc=ps[1]-ts*ps[0],T=[ps[0]-a,ps[1]+bs],norm=Math.hypot(...T);
  if(!(norm>0))return {pass:false,reason:'stress vanishes; do not divide by zero; endpoint factorization required',a,bs,ps,vs,Pc,Jc,T};
  const n=T.map(x=>x/norm),projection=n[0]+ts*n[1],cross=n[1]-ts*n[0],quadratic=projection>0?2-(vs-2)*cross*cross/(projection*projection):-Infinity;
  return {a,bs,ps,ts,vs,Pc,Jc,T,n,projection,quadratic,pass:vs>2&&projection>0&&quadratic>0,sampledKappa:Math.min(1.999,projection,quadratic),fullIntervalCertified:false};
}
/** A true whole-box arithmetic enclosure, independent of the incomplete profile.
 * It certifies every input tuple in this finite box, not C.1's loop existence.
 */
export function certifiedConeBox(input={}){
  const box=input.box??{a:[2.9,3.1],bs:[-.05,.05],p1:[4.9,5.1],p2:[-.05,.05]},b={};
  for(const k of ['a','bs','p1','p2']){if(!Array.isArray(box[k])||box[k].length!==2)throw new ComputeError('INVALID_INPUT',`Cone box ${k} requires [lower,upper]`);b[k]=interval(...box[k]);}
  if(b.a[0]<=0)return {status:'REJECTED_CONE_BOX',pass:false,box,reason:'The a enclosure must be strictly positive.'};
  const ts=idiv([-b.bs[1],-b.bs[0]],b.a),vs=iadd(b.a,idiv(ipow(b.bs,2),b.a)),Pc=iadd(b.p1,imul(ts,b.p2)),Jc=isub(b.p2,imul(ts,b.p1)),gap=isub(Pc,vs),vsGap=isub(vs,point(2));
  if(gap[0]<=0||vsGap[0]<=0)return {status:'REJECTED_CONE_BOX',pass:false,box,reason:'vs>2 and Pc>vs are not certified throughout the box.',vs:ball(vs),gap:ball(gap)};
  const T1=isub(b.p1,b.a),T2=iadd(b.p2,b.bs),normSq=iadd(ipow(T1,2),ipow(T2,2));
  if(normSq[0]<=0)return {status:'REJECTED_CONE_BOX',pass:false,box,reason:'Stress norm enclosure touches zero.'};
  const projection=idiv(gap,ipower(normSq,.5)),quadratic=isub(point(2),idiv(imul(vsGap,ipow(Jc,2)),ipow(gap,2))),kappaLower=Math.min(projection[0],quadratic[0],1.999),pass=kappaLower>0;
  return {status:pass?'VERIFIED_WHOLE_PARAMETER_BOX':'REJECTED_CONE_BOX',pass,box,vs:ball(vs),Pc:ball(Pc),Jc:ball(Jc),projection:ball(projection),quadraticMargin:ball(quadratic),kappaLower,quantifier:'For every real (a,bs,p1,p2) in the stated Cartesian box, inequalities (4.26) hold with any 0<kappa<=kappaLower.',method:'Outward binary64 interval arithmetic, including bounded-series square root via exp(log/2).',fullProfileConeCertified:false,source:{source:'N00',pages:[32,33],equations:['4.20','4.25','4.26']}};
}
export function coneModulationFixture({N=32,amplitude=.12,Xa=1,Xb=4}={}){
  N=boundedInteger(N,'N',2,512);if(!(0<Xa&&Xa<Xb))throw new ComputeError('INVALID_SUPPORT','0<Xa<Xb required');
  const f=(X,n)=>{const y=Math.log(X/Xa)/Math.log(Xb/Xa),cut=smoothStep(4*y)*smoothStep(4*(1-y)),A=amplitude*cut*Math.sin(n*Math.log(X)),B=amplitude*cut*Math.cos(n*Math.log(X)),E=X**(-.6);return {E:E*Math.exp(A/n),U:B/n,baseE:E,A,B};};
  const samples=Array.from({length:201},(_,i)=>{const X=Xa+(Xb-Xa)*i/200,p=f(X,N),q=f(X,2*N),dx=1e-5*X,d=(f(X+dx,N).E-f(X-dx,N).E)/(2*dx),baseD=-.6*X**(-1.6);return {X,EN:p.E,UN:p.U,valueChange:p.E-p.baseE,twiceNValueChange:q.E-q.baseE,radialDerivativeChange:X*(d-baseD)};});
  const maxValue=Math.max(...samples.map(p=>Math.abs(p.valueChange))),maxDerivative=Math.max(...samples.map(p=>Math.abs(p.radialDerivativeChange)));
  const weight=X=>X<=Xa||X>=Xb?0:Math.exp(-(.1**2)/Math.log(X/Xa)**2-4/Math.log(Xb/X)**2);
  return {status:'MODULATION_OPERATOR_FIXTURE',formula:'E_N=E exp(A(X,eta,N log X)/N); U_N=U+B(X,eta,N log X)/N',N,amplitude,samples,maxValueChange:maxValue,maxLogRadialDerivativeChange:maxDerivative,edgeValues:{Xa:weight(Xa),Xb:weight(Xb),inside:weight(Math.sqrt(Xa*Xb))},fullConeRealization:false,scope:'The C.12 operator is executed on explicit smooth compact periodic primitives. These arbitrary primitives are not the admissible shear loop required by Lemma C.1.',source:{source:'N00',pages:[161,163],equations:['C.12','C.13','C.18']}};
}
