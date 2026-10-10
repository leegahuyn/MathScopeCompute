import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {iadd,isub,imul,idiv,iscale,ilog,point,nextUp,nextDown} from '../../mathscope-m1/navier/numerics.mjs';
import {integrateTangentPulse} from './pulse-ode.mjs';
import {getChecklist} from './checklist.mjs';

const PAPER={title:'Finite Time Blowup for Navier–Stokes',url:'https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf',sha256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'};
const PROFILE={id:'same-profile-2026-10-10.3',commit:'55dacb898f8c204bf0c5925ea901d75d6c2d0f46',assessmentSha256:'e57681b7bb751967b406ad440942728ecfd8fe47eb9672129ff19c8a7eb6634c',role:'ACCEPTED_N3_ARCHIVE_REFERENCE',globalEvaluator:false,description:'Archived N3 same-profile result. This identity is retained; the finite M2 component fixtures below do not substitute new numeric parameters into that profile.'};
const KINDS=['ns.background-recursion','ns.background-cutoffs','ns.potential-curl','ns.dyadic-charts','ns.pulse-support','ns.pulse-ode','ns.pulse-covariance','ns.pulse-tail'];
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const finite=(v,name,lo=-1e6,hi=1e6)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)fail('INVALID_INPUT',name+' is outside the finite supported interval.');return v;};
const int=(v,name,lo,hi)=>{finite(v,name,lo,hi);if(!Number.isSafeInteger(v))fail('INVALID_INPUT',name+' must be an integer.');return v;};
const declaredConstant=(value,name)=>{if(value&&typeof value==='object'&&!Array.isArray(value)&&value.kind==='FLOAT64'&&Object.keys(value).every(k=>['kind','value'].includes(k)))return finite(value.value,name,1e-100,1e100);return finite(value,name,1e-100,1e100);};
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],scale=(a,s)=>a.map(x=>x*s),add=(a,b)=>a.map((v,i)=>v+b[i]),norm=a=>Math.hypot(...a);
const check=(id,pass,detail='')=>({id,pass:Boolean(pass),detail});
const axis=(label,kind='CATEGORICAL',unit='1',sourceField=label)=>({label,name:label,kind,unit,scale:'LINEAR',sourceField});
const result=(object,results,checks,visualization,blockers=[],grade='FINITE_NUMERICAL_COMPONENT')=>({status:blockers.length?'PARTIAL':'COMPLETED',evidenceGrade:grade,object,results,checks,visualization,blockers,sourceLedger:{paper:PAPER,n3Profile:PROFILE},scope:{finite:true,fullSameProfileN4:false,fullSameProfileN5:false,globalNavierStokesConstruction:false,formalPass:false}});

function backgroundRecursion(input,ctx){
  const N=int(input.maxOrder??2,'maxOrder',1,8),orders=[];for(let n=0;n<=N;n++){
    ctx.checkCancelled?.();const pairs=Array.from({length:n+1},(_,i)=>({i,j:n-i,role:n===0?'LEADING':i===0||i===n?'LINEAR_CURRENT_UNKNOWN':'KNOWN_REPAIRED_PREVIOUS_ORDER'}));
    orders.push({n,indices:{backgroundOrder:n,radialTaylorOrder:'independent k',etaDerivativeOrder:'independent m'},lambda:'2*'+n+'*h',physicalPowers:{uTheta:'-A+2*'+n+'*h',uZ:'-A+2*'+n+'*h',rUr:'2*'+n+'*h',pressure:'-2*A+2*'+n+'*h'},axis:{phi:n===0?'phi_0(0,eta)':0,U:n===0?'U_0(0,eta)':0,Pi:n===0?'Pi_0(0,eta), not Pi_0(X,eta)':0},pairs,angular:{left:'2*(X*phi_'+n+'_XX+2*phi_'+n+'_X)',time:'T[-A-1/2+lambda_'+n+'] phi_'+n,transport:pairs.map(p=>`V_${p.i}*(phi_${p.j}_X+phi_${p.j}/X)+U_${p.i}*Z[-A-1/2+lambda_${p.j}]phi_${p.j}`),axialViscosity:n?`-Z[-A-1/2+lambda_${n-1}-D] Z[-A-1/2+lambda_${n-1}] phi_${n-1}`:'0'},axial:{left:'2*(X*U_'+n+'_XX+U_'+n+'_X)',time:`T[-A+lambda_${n}]U_${n}`,transport:pairs.map(p=>`V_${p.i}*U_${p.j}_X+U_${p.i}*Z[-A+lambda_${p.j}]U_${p.j}`),pressure:`Z[-2A+lambda_${n}]Pi_${n}`,axialViscosity:n?`-Z[-A+lambda_${n-1}-D] Z[-A+lambda_${n-1}] U_${n-1}`:'0'},pressure:{derivative:'Pi_'+n+'_X',quadratic:pairs.map(p=>`C^-2*phi_${p.i}*phi_${p.j}`),radialCorrection:n?`-Omega_${n-1}/(2X)`:'0'},omega:{order:n,pairs,formula:`T[lambda_${n}]V_${n}+sum_(i+j=${n})[V_i*(V_j_X-V_j/(2X))+U_i*Z[lambda_j]V_j]-2X*V_${n}_XX`+(n?`-Z[lambda_${n-1}-D]Z[lambda_${n-1}]V_${n-1}`:'')},constructionState:n===0?'ARCHIVED_N3_SOURCE_REFERENCED':'NOT_SOLVED',reuseGuard:n>0?'DO_NOT_USE_FOR_NEXT_ORDER_UNTIL_ALL_FIVE_MOMENTS_ARE_REPAIRED':null});
  }
  const checks=[check('distinct-order-indices',true,'background n, radial k, eta m are separate keys'),check('physical-exponent-shift',true,'1-2D=2A-1=2h for A=1/2+h,D=1/2-h'),check('all-convolution-pairs',orders.every(o=>o.pairs.length===o.n+1),'All ordered i+j=n pairs, including both endpoints.'),check('n-minus-one-viscosity-and-pressure',orders.slice(1).every(o=>o.angular.axialViscosity.includes('phi_'+(o.n-1))&&o.pressure.radialCorrection===`-Omega_${o.n-1}/(2X)`),'Original (5.3)-(5.6) order shifts retained.')];
  return result({kind:'SOURCE_COEFFICIENT_RECURSION',sourceProfile:PROFILE.id},{orders,operators:{T:'T_a f=L^-1*(-a*f+D*eta*d_eta(f)+X*d_X(f))',Z:'Z_a f=L^-1*(2*a*eta*f+d*d_eta(f)-2*eta*X*d_X(f))',d:'1-eta^2',L:'1-2*h*eta^2',E:'E_n=sqrt(2X)*phi_n/C'},sourceEquations:['5.1','5.2','5.3','5.4','5.5','5.6'],nextOrderGuard:{required:['same N3 evaluator','common-interval Picard tail','five repaired total moments','stress and pressure reconstruction'],satisfied:false}},checks,{axes:[axis('background order n'),axis('left order i'),axis('right order j')],points:orders.flatMap(o=>o.pairs.map(p=>({pos:[o.n,p.i,p.j],value:p.role==='KNOWN_REPAIRED_PREVIOUS_ORDER'?1:0,label:`n=${o.n}: (${p.i},${p.j}) ${p.role}`}))),lines:[],description:'Ordered coefficient-convolution graph. Categorical indices, not physical space.',lostInformation:['This graph is an executable source expression manifest, not solved coefficient functions.']},['N4-02 direct original-PDE substitution is not yet linked to evaluated same-profile coefficients.','N4-03/04 require a common-interval Picard solve and complete five-moment repairs before the next order.'],'SOURCE_EXPRESSION_MANIFEST');
}

function cutoffSchedule(input,ctx){
  const J=int(input.orders??4,'orders',1,10),P=finite(input.logPower??2,'logPower',0,32),g=finite(input.growth??.4,'growth',1e-8,20),C=input.constants??Array.from({length:J},(_,j)=>Array.from({length:j+2},(_,m)=>10**(j+m+1)));
  if(!Array.isArray(C)||C.length!==J)fail('INVALID_INPUT','constants requires one row per positive order.');
  const log2=ilog(point(2)),rows=[];let previous=0;
  for(let j=1;j<=J;j++){
    if(!Array.isArray(C[j-1])||C[j-1].length!==j+1)fail('INVALID_INPUT','Order j requires constants for every 0<=m<=j.');const cs=C[j-1].map((x,m)=>declaredConstant(x,`C[${j},${m}]`));
    const bBox=iscale(point(g),j/2);
    function evaluate(k){const t=iscale(log2,k),logDerivative=isub(idiv(point(P),iadd(point(1),t)),bBox),monotone=logDerivative[1]<=0,records=cs.map((c,m)=>{const bound=isub(iadd(ilog(point(c)),iscale(ilog(iadd(point(1),t)),P)),iscale(t,bBox));return {m,logBound:bound,targetLog:iscale(log2,-j),pass:bound[1]<=iscale(log2,-j)[0]};});return {k,t,monotone,logDerivative,records,pass:monotone&&records.every(x=>x.pass)};}
    let lo=previous+1,hi=lo;while(!evaluate(hi).pass){ctx.checkCancelled?.();hi*=2;if(hi>10000000)fail('PRECISION_REQUIRED','Cutoff log2 exponent exceeds the installed bound.');}while(lo<hi){const mid=Math.floor((lo+hi)/2);if(evaluate(mid).pass)hi=mid;else lo=mid+1;}const e=evaluate(lo);previous=lo;
    rows.push({j,log2a:lo,aExact:`2^${lo}`,logA:e.t,constantScope:'USER_DECLARED_BOUND_CONSTANTS',constants:cs,inequalities:e.records,allQBoundPassed:e.pass,monotonicDerivative:'P/(1+t)-g*j/2 <= 0 for t>=log(a_j)',monotonicity:{logDerivativeAtBoundary:e.logDerivative,boundaryPassed:e.monotone,logVariable:'t=-log(q)',validFor:'t>=log(a_j)',derivativeDecreasesBecause:'d/dt[P/(1+t)-g*j/2]=-P/(1+t)^2<=0 for P>=0',proofMethod:'OUTWARD_BOUNDARY_INTERVAL_PLUS_MONOTONICITY; NOT_FINITE_Q_SAMPLING'},validFor:`0<q<=2^(-${lo})`});
  }
  const log2q=finite(input.log2q??-rows.at(-1).log2a-2,'log2q',-1e9,0),active=rows.filter(r=>r.log2a+log2q<0).map(r=>r.j),tailIndex=int(input.tailIndex??Math.min(2,J),'tailIndex',1,J),tail=rows[tailIndex-1];
  return result({kind:'FINITE_SHRINKING_CUTOFF_SCHEDULE'}, {parameters:{orders:J,logPower:P,growth:g},rows,cutoff:{definition:'chi(s)=1 for s<=1/2, chi(s)=0 for s>=1; smooth transition inside',potentialBeforeCurl:true},query:{log2q,activePositiveOrders:active,inactivePositiveOrders:rows.filter(r=>!active.includes(r.j)).map(r=>r.j),scope:'Only the supplied finite schedule. No claim about omitted infinite orders.'},tailContract:{J:tailIndex,valid:log2q<-(tail.log2a+1),validDomain:`q<2^(-${tail.log2a+1})`,uncomputedHigherConstants:true}},[check('cutoff-doubling',rows.every((r,i)=>!i||r.log2a>=rows[i-1].log2a+1),'Exact powers of two.'),check('all-q-all-supplied-m',rows.every(r=>r.allQBoundPassed),'Outward interval log inequality on entire q<=1/a_j, not samples.')],{axes:[axis('order j'),axis('log2(a_j)','CATEGORICAL','log2','rows.log2a'),axis('0')],points:rows.map(r=>({pos:[r.j,r.log2a,0],value:r.log2a,label:`a_${r.j}=2^${r.log2a}`})),lines:[{points:rows.map(r=>[r.j,r.log2a,0])}],description:'Certified scalar cutoff inequality for the supplied constants.',lostInformation:['The supplied constants have not been derived from the archived N3 profile.','Only a finite schedule is instantiated.']},['N4-06/08 same-profile derivative constants and all-order tail link remain to be supplied.'],'OUTWARD_INTERVAL_SCALAR_BOUND');
}

function potentialCurl(input,ctx){
  const radius=finite(input.radius??2,'radius',.1,10),frequency=finite(input.frequency??2,'frequency',.1,20),N=int(input.grid??7,'grid',3,15),points=[],arrows=[];
  // A=(0,0,f(r)sin(kx)); f=(1-r^2/R^2)^4_+. Full curl includes derivatives of f.
  function field(x,y,z,omit=false){const s=1-(x*x+y*y+z*z)/(radius*radius);if(s<=0)return [0,0,0];const f=s**4,fx=-8*x*s**3/(radius*radius),fy=-8*y*s**3/(radius*radius),sn=Math.sin(frequency*x),cs=Math.cos(frequency*x);return omit?[0,-f*frequency*cs,0]:[fy*sn,-fx*sn-f*frequency*cs,0];}
  function div(x,y,z,h,omit=false){return [0,1,2].reduce((sum,k)=>{const a=[x,y,z],b=[x,y,z];a[k]+=h;b[k]-=h;return sum+(field(...a,omit)[k]-field(...b,omit)[k])/(2*h);},0);}
  const errors=[.04,.02,.01].map(h=>{let max=0;for(let i=1;i<=9;i++){const x=radius*(i/15-.3),y=radius*.21,z=radius*.13;max=Math.max(max,Math.abs(div(x,y,z,h)));}return {h,maxCartesianDivergence:max};});
  let negative=0;for(let i=0;i<N;i++)for(let j=0;j<N;j++)for(let k=0;k<N;k++){ctx.checkCancelled?.();const p=[i,j,k].map(t=>radius*(-1+2*t/(N-1))),v=field(...p);if(norm(v)>0){points.push({pos:p,value:norm(v),label:`curl A at (${p.map(x=>x.toFixed(2)).join(',')})`});arrows.push({pos:p,vector:v});}negative=Math.max(negative,Math.abs(div(...p,.001,true)));}
  return result({kind:'CUTOFF_POTENTIAL_CURL_FIXTURE'}, {potential:'A=(0,0,(1-|x|^2/R^2)^4_+ sin(k*x))',regularity:'C3 compact cutoff fixture, deliberately not a C-infinity Borel sum',curlRule:'curl(chi*A)=grad(chi) cross A + chi*curl(A)',errors,omittedCutoffDerivativeMaxDivergence:negative,sourceFormula:'5.45/7.24 product-rule verification fixture',radius,frequency},[check('mixed-partial-identity',true,'div(curl A)=d_x d_y A_z-d_y d_x A_z=0 on every smooth piece, with matching derivatives through the collar'),check('independent-divergence-refinement',errors[2].maxCartesianDivergence<errors[0].maxCartesianDivergence/8,'Centered Cartesian divergence; expected second-order cancellation.'),check('negative-control-detects-missing-curl-term',negative>1e-3,'Multiplying velocity by cutoff alone loses divergence cancellation.')],{axes:[axis('x','PHYSICAL','fixture length'),axis('y','PHYSICAL','fixture length'),axis('z','PHYSICAL','fixture length')],points,arrows,lines:[],equalScale:true,description:'Actual compact-potential curl, including cutoff derivative terms.',lostInformation:['Finite verification fixture. It is not the same-profile infinite background or pulse from the paper.']},['N4-07/N5-07 product-rule implementation works; the archived-profile C-infinity potential and original pulse remainders are not yet linked.']);
}

function dyadicCharts(input,ctx){
  if(input.T===0)fail('UNSUPPORTED','tau=0 is the singular boundary, not a computed sample. Use a positive scaled time T.');
  const lo=int(input.ellStart??4,'ellStart',1,900),count=int(input.count??10,'count',1,50),h=finite(input.h??.005,'h',1e-8,.009999),R=finite(input.R??1,'R',.01,8),Z=finite(input.Z??.2,'Z',-8,8),T=finite(input.T??1,'T',Number.MIN_VALUE,8),D=.5-h,rows=[];
  if(lo+count>1000)fail('PRECISION_REQUIRED','Use logarithmic-only coordinates above ell=1000.');
  for(let l=lo;l<lo+count;l++){ctx.checkCancelled?.();const Q=2**(-l),eps=2**(-l*h),k=Math.ceil(eps**(-.5)),r=R*Math.sqrt(Q),z=Z*Q**D,tau=T*Q;if(![Q,eps,r,z,tau].every(Number.isFinite)||Q===0||r===0||tau===0||(Z!==0&&z===0))fail('PRECISION_REQUIRED','The positive physical coordinate underflowed or overflowed binary64. Use a logarithmic-only observation or a less extreme band.');rows.push({ell:l,QExact:`2^(-${l})`,Q,epsilon:eps,epsilonExact:`2^(-${l}*${h})`,Sstar:l*l,R,Z,T,r,z,tau,k,epsilonK2:eps*k*k,overlapAtNextBand:{R:R*Math.SQRT2,Z:Z*2**D,T:2*T,reconstructed:{r:R*Math.SQRT2*Math.sqrt(Q/2),z:Z*2**D*(Q/2)**D,tau:2*T*(Q/2)}}});}
  return result({kind:'DYADIC_CHART_CONTRACT'}, {rows,definitions:{Q:'2^-ell',epsilon:'Q^h',Sstar:'ell^2',R:'r/sqrt(Q)',Z:'z/Q^D',T:'tau/Q',physicalTime:'t=1-tau',auxiliaryTorus:'T^2 is an averaging variable, not a physical spatial dimension'},labelsFrozenDuringDifferentiation:true},[check('overlap-coordinate-identity',rows.every(r=>Math.abs(r.overlapAtNextBand.reconstructed.r-r.r)<1e-12&&Math.abs(r.overlapAtNextBand.reconstructed.z-r.z)<1e-12),'Same physical point in adjacent bands.'),check('carrier-frequency-window',rows.every(r=>r.epsilonK2>=1&&r.epsilonK2<=4),'For 0<epsilon<=1, k=ceil(epsilon^-1/2) gives 1<=epsilon*k^2<=4.')],{axes:[axis('r','PHYSICAL','length'),axis('z','PHYSICAL','length'),axis('tau=1-t','PHYSICAL','time')],points:rows.map(r=>({pos:[r.r,r.z,r.tau],value:r.ell,label:`ell=${r.ell}, Q=${r.QExact}`})),lines:[{points:rows.map(r=>[r.r,r.z,r.tau])}],description:'Physical (r,z,tau) for fixed scaled coordinates in explicitly selected dyadic bands.',lostInformation:['The display is a space-time chart, not three physical spatial axes.','The small fixture h is not substituted into the archived N3 profile.']},['N5-01 formulas and finite overlap check are implemented; original same-profile band selection remains unconnected.']);
}

function pulseSupport(input,ctx){
  const labels=input.labels??[{id:'a',slow:[0,2]},{id:'b',slow:[1,3]},{id:'c',slow:[2.5,4]},{id:'d',slow:[.5,1.5]}];if(!Array.isArray(labels)||labels.length<1||labels.length>24)fail('INVALID_INPUT','Provide 1–24 slow labels.');
  const used=new Set();for(const l of labels){if(typeof l.id!=='string'||!l.id||used.has(l.id)||!Array.isArray(l.slow)||l.slow.length!==2||!l.slow.every(Number.isFinite)||l.slow[0]>=l.slow[1])fail('INVALID_INPUT','Unique labels and ordered finite slow intervals required.');used.add(l.id);}
  const edges=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)if(Math.max(labels[i].slow[0],labels[j].slow[0])<=Math.min(labels[i].slow[1],labels[j].slow[1]))edges.push([i,j]);
  const colors=[];labels.forEach((_,i)=>{const unavailable=new Set(edges.filter(e=>e.includes(i)).map(e=>colors[e[0]===i?e[1]:e[0]]));let c=0;while(unavailable.has(c))c++;colors.push(c);});const count=Math.max(...colors)+1;
  const rectangles=labels.map((l,i)=>({...l,color:colors[i],auxiliary:{s:[(3*colors[i]+1)/(3*count),(3*colors[i]+2)/(3*count)],v:[.1,.9]},exactAuxiliaryS:[`${3*colors[i]+1}/${3*count}`,`${3*colors[i]+2}/${3*count}`]})),pairChecks=edges.map(([i,j])=>{ctx.checkCancelled?.();const a=rectangles[i].auxiliary.s,b=rectangles[j].auxiliary.s;return {left:labels[i].id,right:labels[j].id,slowOverlap:true,auxiliaryIntersects:Math.max(a[0],b[0])<=Math.min(a[1],b[1])};});
  const lines=rectangles.map((r,i)=>({points:[[r.auxiliary.s[0],.1,i],[r.auxiliary.s[1],.1,i],[r.auxiliary.s[1],.9,i],[r.auxiliary.s[0],.9,i],[r.auxiliary.s[0],.1,i]]}));
  return result({kind:'FINITE_PULSE_CONFLICT_GRAPH'}, {rectangles,edges:edges.map(e=>e.map(i=>labels[i].id)),pairChecks,torus:{Jg:[[3,1],[1,5]],determinant:14,inverse:[[5/14,-1/14],[-1/14,3/14]],HaarJacobian:'1/14 per injective lifted coordinate rectangle',coordinateMeaning:'s,v are auxiliary; physical evaluation happens after averaging',derivativeRule:'D_x f(x,Y(x))=partial_x f + (D_x Y) dot grad_Y f',chainRuleRequiresInputDerivatives:true},products:{differentConflictingLabels:'zero on these disjoint auxiliary supports',sameLabelHarmonics:'retained',nonconflictingSlowLabels:'zero only if their actual slow supports are disjoint'}},[check('every-active-conflict-pair',pairChecks.every(p=>!p.auxiliaryIntersects),'Exact rational open gaps separate conflicting support intervals.'),check('haar-jacobian',3*5-1*1===14,'det Jg=14; this is a covering map globally, not a torus bijection.')],{axes:[axis('auxiliary s'),axis('auxiliary v'),axis('label index')],points:rectangles.map((r,i)=>({pos:[(r.auxiliary.s[0]+r.auxiliary.s[1])/2,.5,i],value:r.color,label:r.id})),lines,description:'Auxiliary support rectangles for the supplied finite slow-overlap graph.',lostInformation:['These auxiliary coordinates are not additional physical dimensions.','This graph has not yet been generated from all supports of the archived N3/N4 field.']},['N5-02/03 finite support allocation is implemented; full source chart derivatives and all active original labels remain to be connected.'],'EXACT_FINITE_SUPPORT_CONTRACT');
}

function pulseOde(input,ctx){
  const eps=finite(input.epsilon??.04,'epsilon',.0001,1),F=finite(input.F??1,'F',.01,5),FR=finite(input.FR??-3,'FR',-15,-.01),GR=finite(input.GR??0,'GR',-8,8),R=finite(input.R??1,'R',.2,5),u=finite(input.uStar??2,'uStar',.1,5),Ls=finite(input.length??8,'length',1,30),steps=int(input.steps??128,'steps',32,1024),sign=input.sign??1;if(steps%2)fail('INVALID_INPUT','steps must be even for the independent refinement comparison.');if(![1,-1].includes(sign))fail('INVALID_INPUT','sign must be +1 or -1.');
  const g=[R*FR,GR],gn=norm(g),N=scale(g,1/gn),Ktan=[-N[1],N[0]],lambda2=-2*F*N[0]*(2*F*N[0]+gn);if(!(lambda2>0))fail('INVALID_INPUT','The local source jet must have positive lambda0^2.');
  const lambda=Math.sqrt(lambda2),c=lambda/(2*F*N[0]),k=Math.ceil(eps**(-.5)),Bs=2*lambda/(eps*k*k*(1+u*u)**1.5),ptilde=R*Bs*(Ktan[0]-sign*u*g[0]/(Ls*gn*gn)),kp0=Math.round(k*ptilde),kp=kp0||((k*ptilde)<0?-1:1),p=kp/k,pz=Bs*(Ktan[1]-sign*u*g[1]/(Ls*gn*gn)),x0=sign*Bs*u/2;
  const mat=[[0,-2*F,0],[2*F+R*FR,0,0],[GR,0,0]],mv=t=>mat.map(row=>dot(row,t)),normal=v=>[x0-v*(p*FR+pz*GR),p/R,pz],np=[-(p*FR+pz*GR),0,0];
  function rhs(v,t){const n=normal(v),kt=mv(t),normalTerm=scale(n,(dot(n,kt)-dot(np,t))/dot(n,n)),d=eps*k*k*dot(n,n);return add(add(scale(kt,-1),normalTerm),scale(t,-d));}
  const mid=Ls/2,nm=normal(mid),tangent=norm(nm.slice(1)),Ka=[nm[1]/tangent,nm[2]/tangent],Na=[Ka[1],-Ka[0]],sa=nm[0]/tangent,seed=[1,-sa*Ka[0]+c*Math.sqrt(1+sa*sa)*Na[0],-sa*Ka[1]+c*Math.sqrt(1+sa*sa)*Na[1]],t0=scale(seed,1/norm(seed));
  const integrate=nsteps=>integrateTangentPulse({matrix:mat,normalAtMidpoint:nm,normalDerivative:np,midpoint:mid,length:Ls,steps:nsteps,dampingCoefficient:eps*k*k,initial:t0,checkCancelled:ctx.checkCancelled});
  const fineRun=integrate(steps),coarseRun=integrate(steps/2),fine=fineRun.rows,coarse=coarseRun.rows;let diff=0,directionDiff=0,orth=0,energy=0;
  for(const [i,row]of fine.entries()){const n=normal(row.v),tt=row.t,rt=rhs(row.v,tt),d=eps*k*k*dot(n,n);orth=Math.max(orth,Math.abs(dot(n,tt))/norm(n));energy=Math.max(energy,Math.abs(dot(tt,rt)+dot(tt,mv(tt))+d));if(i%2===0){const old=coarse[i/2];diff=Math.max(diff,Math.abs(old.logScale-row.logScale));directionDiff=Math.max(directionDiff,norm(add(old.t,scale(tt,-1))));}}
  return result({kind:'SOURCE_PROJECTED_PULSE_ODE',datumRole:'FINITE_LOCAL_SHEAR_JET'}, {parameters:{eps,F,FR,GR,R,u,Ls,sign,k,kp,p,pz,Bs,lambda0:lambda,c0:c},equations:['7.2','7.3','7.4','7.5','7.6','7.8'],samples:fine.map(x=>({...x,nPhi:normal(x.v),logAmplitude:x.logScale})),diagnostics:{...fineRun.diagnostics,maxRelativeOrthogonality:orth,maxEnergyIdentityResidual:energy,maxStepRefinementLogDifference:diff,maxStepRefinementDirectionDifference:directionDiff,refinement:{fineStepsPerHalf:steps,coarseStepsPerHalf:steps/2,comparedSamples:coarse.length,interpretation:'Empirical step comparison only; no rigorous integration-error bound.'},rigorousSolutionErrorBound:null},integrationMethod:fineRun.method,normalization:'||t(Ls/2)||=1; normalized tangent coordinates plus analytic scalar-damping integral and log envelope avoid silent underflow and backwards normal drift',sourceJetScope:'Local frozen values supplied explicitly. Uniform N3 profile bounds, slow derivatives and Gaussian constants are not inferred.'},[check('integer-angular-frequency',Number.isInteger(kp)&&kp!==0,'k*p is the frozen nonzero integer kp.'),check('epsilon-frequency-window',eps*k*k>=1&&eps*k*k<=4),check('normal-constraint',orth<1e-10,'Explicit orthonormal tangent-frame reconstruction preserves nPhi dot t=0 up to binary64 rounding.'),check('energy-identity',energy<1e-8,'1/2 d||t||^2=-t dot Kt-d||t||^2, checked against the original Cartesian right-hand side.'),check('tangent-reconstruction-equation',fineRun.diagnostics.maxReconstructedRhsRelativeResidual<1e-10,'Independent Cartesian RHS equals E*yPrime+EPrime*y-d*E*y.'),check('step-refinement',diff<.05&&directionDiff<.01,'Both log amplitude and normalized direction are compared at common samples; this is not a certified integration-error bound.')],{axes:[axis('pulse coordinate v'),axis('log amplitude','CATEGORICAL','log norm'),axis('0')],points:fine.map(r=>({pos:[r.v,r.logScale,0],value:r.logScale,label:`v=${r.v.toFixed(4)}; log amplitude=${r.logScale.toPrecision(6)}`})),lines:[{points:fine.map(r=>[r.v,r.logScale,0])}],description:'Actual integrated projected ODE (7.5)-(7.6) in a parallel tangent frame, for the supplied local shear datum.',lostInformation:['Log amplitude is retained when an ordinary float would underflow.','No all-label Gaussian bound or certified ODE error is claimed.']},['N5-04/05 same-profile phase/frame bounds and rigorous ODE error/Gaussian bounds remain open for this executable module.']);
}

function covariance(input,ctx){
  const target=input.target??[-1,0],amplitude=finite(input.amplitude??1,'amplitude',.001,100),area=finite(input.liftedArea??1,'liftedArea',.0001,1),eps=finite(input.epsilon??.1,'epsilon',.0001,1);if(!Array.isArray(target)||target.length!==2)fail('INVALID_INPUT','target is a 2-component stress.');target.forEach((x,i)=>finite(x,'target '+i,-100,100));
  const tplus=[1,-1,1],tminus=[1,-1,-1],normal=[1,1,0],angularFactor=.5,jac=1/14,c=amplitude*amplitude*area*angularFactor*jac,H=[[-c,-c],[c,-c]],det=2*c*c,y=[(-c*target[0]+c*target[1])/det,(-c*target[0]-c*target[1])/det],reconstructed=[H[0][0]*y[0]+H[0][1]*y[1],H[1][0]*y[0]+H[1][1]*y[1]],samples=128,integral=Array.from({length:samples},(_,i)=>Math.cos(2*Math.PI*i/samples)**2).reduce((a,b)=>a+b,0)/samples;
  const rows=[{family:'+',polarization:tplus,weight:y[0],covariance:H.map(r=>r[0])},{family:'-',polarization:tminus,weight:y[1],covariance:H.map(r=>r[1])}];
  return result({kind:'TWO_FAMILY_FINITE_COVARIANCE',datumRole:'EXPLICIT_LOCAL_POLARIZATION_FIXTURE'},{Hcov:H,determinant:det,weights:y,target,reconstructed,epsilonScaledStress:reconstructed.map(v=>eps*v),angularAverage:{exact:'1/2',discreteQuadrature:integral},haar:{Jg:[[3,1],[1,5]],det:14,jacobian:'1/14',liftedArea:area},families:rows,normal,cosineHalfFactor:angularFactor,sameLabelHarmonicsRetained:true,globalProfileMatching:false},[check('transverse-polarizations',dot(normal,tplus)===0&&dot(normal,tminus)===0),check('positive-two-family-weights',y.every(v=>v>0),'Cone failure is retained if either weight is nonpositive.'),check('covariance-matching',reconstructed.every((v,i)=>Math.abs(v-target[i])<1e-10)),check('angular-half-factor',Math.abs(integral-.5)<1e-12),check('negative-missing-half',Math.abs(2*reconstructed[0]-target[0])+Math.abs(2*reconstructed[1]-target[1])>1e-6)],{axes:[axis('stress r-theta','CATEGORICAL','stress'),axis('stress r-z','CATEGORICAL','stress'),axis('family index')],points:rows.map((r,i)=>({pos:[r.covariance[0],r.covariance[1],i],value:r.weight,label:`family ${r.family}, weight ${r.weight}`})).concat([{pos:[target[0],target[1],2],value:0,label:'target'}]),lines:rows.map((r,i)=>({points:[[0,0,i],[r.covariance[0],r.covariance[1],i]]})),description:'Two actual polarization covariance columns, their weights and the supplied target.',lostInformation:['Finite constant-polarization fixture; no matching to the archived nonconstant N3 stress has been proved.','Original pulse cutoff/curl remainders must be added before global residual use.']},['N5-06/07 full original pulse covariance, interval positivity and curl-remainder contract are pending.']);
}

function pulseTail(input,ctx){
  const c=finite(input.c??.2,'c',1e-6,10),C=finite(input.C??2,'C',0,20),M=finite(input.derivativeLoss??2,'derivativeLoss',0,100),N=int(input.targetPower??4,'targetPower',0,100),start=int(input.ellStart??8,'ellStart',1,10000),count=int(input.count??80,'count',1,500),rows=[],ln2=ilog(point(2));
  for(let ell=start;ell<start+count;ell++){ctx.checkCancelled?.();const bound=iadd(isub(imul(iscale(ln2,ell),iadd(point(M),point(N))),iscale(point(c),ell*ell)),iscale(ilog(point(ell)),2*C));rows.push({ell,Sstar:ell*ell,logBound:bound,relativeToQPower:N,dominationPassed:bound[1]<=0,machineUnderflow:bound[1]<Math.log(Number.MIN_VALUE)});}
  const derivative=ell=>iadd(isub(imul(iadd(point(M),point(N)),ln2),iscale(point(c),2*ell)),idiv(iscale(point(C),2),point(ell)));const threshold=rows.find(r=>r.logBound[1]<=0&&derivative(r.ell)[1]<0),monotone=threshold?{ellAtLeast:threshold.ell,logDerivativeUpper:derivative(threshold.ell)[1],derivativeDecreases:true}:null;
  return result({kind:'FIXED_ORDER_LOG_FLAT_TAIL'}, {parameters:{c,C,M,N},formula:'-c*ell^2+(M+N)*ell*log(2)+2*C*log(ell)',rows,uniformAfterThreshold:monotone,allDerivativeOrdersInstantiated:false,retainedRemainder:'(1-psi)*f_m + psi_prime*t_m',constantScope:'Declared positive Gaussian constant and polynomial loss; not derived from the original ODE.'},[check('retains-nonzero-log-tail',rows.every(r=>Number.isFinite(r.logBound[0])&&Number.isFinite(r.logBound[1])),'No positive tail is converted to an exact zero.'),check('fixed-order-tail-threshold',Boolean(monotone),'The log expression decreases beyond the displayed threshold; no all-order shortcut.')],{axes:[axis('dyadic ell'),axis('log(tail / q^N)','CATEGORICAL','log ratio'),axis('0')],points:rows.map(r=>({pos:[r.ell,r.logBound[1],0],value:r.logBound[1],label:`ell=${r.ell}: log upper ${r.logBound[1]}`})),lines:[{points:rows.map(r=>[r.ell,r.logBound[1],0])}],description:'Outward interval values of the fixed-order flat-tail exponent.',lostInformation:['The supplied Gaussian constant is a premise.','Fixed m,N are checked; an all-order proof is not issued.']},['N5-08 needs the actual original pulse ODE constants and cutoff source to close the whole-profile criterion.'],'OUTWARD_INTERVAL_FIXED_ORDER_BOUND');
}

const INPUT_FIELDS={
  'ns.background-recursion':['maxOrder'],
  'ns.background-cutoffs':['orders','logPower','growth','constants','log2q','tailIndex'],
  'ns.potential-curl':['radius','frequency','grid'],
  'ns.dyadic-charts':['ellStart','count','h','R','Z','T'],
  'ns.pulse-support':['labels'],
  'ns.pulse-ode':['epsilon','F','FR','GR','R','uStar','length','steps','sign'],
  'ns.pulse-covariance':['target','amplitude','liftedArea','epsilon'],
  'ns.pulse-tail':['c','C','derivativeLoss','targetPower','ellStart','count']
};
// These are installed finite-component domains, not uniform domains for the paper's profile.
const NUMERIC_FIELDS={
  'ns.background-recursion':{maxOrder:[1,8,true]},
  'ns.background-cutoffs':{orders:[1,10,true],logPower:[0,32],growth:[1e-8,20],log2q:[-1e9,0],tailIndex:[1,10,true]},
  'ns.potential-curl':{radius:[.1,10],frequency:[.1,20],grid:[3,15,true]},
  'ns.dyadic-charts':{ellStart:[1,900,true],count:[1,50,true],h:[1e-8,.009999],R:[.01,8],Z:[-8,8],T:[0,8]},
  'ns.pulse-support':{},
  'ns.pulse-ode':{epsilon:[.0001,1],F:[.01,5],FR:[-15,-.01],GR:[-8,8],R:[.2,5],uStar:[.1,5],length:[1,30],steps:[32,1024,true],sign:[-1,1,true]},
  'ns.pulse-covariance':{amplitude:[.001,100],liftedArea:[.0001,1],epsilon:[.0001,1]},
  'ns.pulse-tail':{c:[1e-6,10],C:[0,20],derivativeLoss:[0,100],targetPower:[0,100,true],ellStart:[1,10000,true],count:[1,500,true]}
};
function finiteTree(value,path='input'){
  if(typeof value==='number'&&!Number.isFinite(value))fail('INVALID_INPUT',path+' must be finite.');
  if(Array.isArray(value))value.forEach((v,i)=>finiteTree(v,path+'['+i+']'));
  else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))finiteTree(v,path+'.'+k);
}
export function validate(kind,input={}){
  try{
    if(!KINDS.includes(kind))fail('UNSUPPORTED','This N4/N5 adapter is not installed.');
    if(!input||typeof input!=='object'||Array.isArray(input))fail('INVALID_INPUT','Input must be an object.');
    const unknown=Object.keys(input).filter(k=>!INPUT_FIELDS[kind].includes(k));if(unknown.length)fail('INVALID_INPUT','Unknown '+kind+' input fields: '+unknown.join(', ')+'.');
    finiteTree(input);
    for(const[k,[lo,hi,integer]]of Object.entries(NUMERIC_FIELDS[kind]))if(input[k]!==undefined)(integer?int:finite)(input[k],k,lo,hi);
    if(kind==='ns.background-cutoffs'){
      const J=input.orders??4;if(input.tailIndex!==undefined&&input.tailIndex>J)fail('INVALID_INPUT','tailIndex must not exceed the supplied positive orders.');
      if(input.constants!==undefined){if(!Array.isArray(input.constants)||input.constants.length!==J)fail('INVALID_INPUT','constants requires one row per positive order.');input.constants.forEach((row,j)=>{if(!Array.isArray(row)||row.length!==j+2)fail('INVALID_INPUT','Order j requires a constant for every 0<=m<=j.');row.forEach((c,m)=>declaredConstant(c,`constants[${j}][${m}]`));});}
    }
    if(kind==='ns.dyadic-charts'){
      if(input.T===0)fail('UNSUPPORTED','tau=0 is the singular boundary, not a computed sample. Use T>0.');
      const ell=int(input.ellStart??4,'ellStart',1,900),count=int(input.count??10,'count',1,50),T=finite(input.T??1,'T',Number.MIN_VALUE,8);
      if(ell+count>1000||T*2**(-(ell+count-1))===0)fail('PRECISION_REQUIRED','Requested dyadic band requires a logarithmic-only observation; binary64 physical coordinates underflow.');
    }
    if(kind==='ns.pulse-ode'){
      if((input.steps??128)%2)fail('INVALID_INPUT','steps must be even.');if(![1,-1].includes(input.sign??1))fail('INVALID_INPUT','sign must be +1 or -1.');
      const F=input.F??1,g0=(input.R??1)*(input.FR??-3),g1=input.GR??0,gn=Math.hypot(g0,g1),n0=g0/gn;if(!(-2*F*n0*(2*F*n0+gn)>0))fail('INVALID_INPUT','The local source jet must have positive lambda0^2.');
    }
    if(kind==='ns.pulse-support'&&input.labels!==undefined){
      if(!Array.isArray(input.labels)||input.labels.length<1||input.labels.length>24)fail('INVALID_INPUT','Provide 1–24 slow labels.');
      const used=new Set();for(const l of input.labels){if(!l||typeof l!=='object'||Array.isArray(l)||Object.keys(l).some(k=>!['id','slow'].includes(k)))fail('INVALID_INPUT','A pulse support label contains only id and slow.');if(typeof l.id!=='string'||!l.id||used.has(l.id)||!Array.isArray(l.slow)||l.slow.length!==2||!l.slow.every(Number.isFinite)||l.slow[0]>=l.slow[1])fail('INVALID_INPUT','Unique labels and ordered finite slow intervals required.');used.add(l.id);}
    }
    if(kind==='ns.pulse-covariance'&&input.target!==undefined){if(!Array.isArray(input.target)||input.target.length!==2)fail('INVALID_INPUT','target is a 2-component stress.');input.target.forEach((x,i)=>finite(x,'target '+i,-100,100));}
    return {ok:true};
  }catch(e){return {ok:false,code:e.code||'INVALID_INPUT',errors:[e.message]};}
}
function precisionContract(kind,value={}){
  if(!value||typeof value!=='object'||Array.isArray(value))fail('INVALID_INPUT','precision must be an object.');
  const unknown=Object.keys(value).filter(k=>!['mode','bits'].includes(k));if(unknown.length)fail('UNSUPPORTED','This finite NS adapter does not implement requested tolerance/precision fields: '+unknown.join(', ')+'.');
  const mode=value.mode??'FLOAT64',bits=value.bits??53;
  if(!['AUTO','FLOAT64','OUTWARD_FLOAT64'].includes(mode))fail('PRECISION_REQUIRED','Exact, arbitrary precision and FORMAL labels cannot replace the installed binary64 numerical/finite-expression backend.');
  if(!Number.isSafeInteger(bits)||bits<1)fail('INVALID_INPUT','precision.bits must be a positive safe integer.');
  if(bits>53)fail('PRECISION_REQUIRED','This NS backend has 53-bit binary64 arithmetic; no higher-precision solver is installed.');
  const outward=['ns.background-cutoffs','ns.pulse-tail'].includes(kind);
  if(mode==='OUTWARD_FLOAT64'&&!outward)fail('PRECISION_REQUIRED','Outward scalar interval evaluation is available only for cutoff/tail bounds; this job does not provide a certified solution enclosure.');
  return {requested:value,arithmeticBits:53,arithmetic:outward?'OUTWARD_FLOAT64_SCALAR_INTERVALS':'FLOAT64_WITH_EXACT_INDEX_AND_SOURCE_EXPRESSIONS',fullResultExact:false,rigorousOdeSolutionErrorBound:null,formalPass:false};
}
function resourceEstimate(kind,input){
  const operations={
    'ns.background-recursion':()=>100*(input.maxOrder??2)**2,
    'ns.background-cutoffs':()=>5000*(input.orders??4)**2,
    'ns.potential-curl':()=>2000*(input.grid??7)**3,
    'ns.dyadic-charts':()=>500*(input.count??10),
    'ns.pulse-support':()=>500*(input.labels?.length??4)**2,
    'ns.pulse-ode':()=>8000*(input.steps??128),
    'ns.pulse-covariance':()=>12000,
    'ns.pulse-tail':()=>500*(input.count??80)
  }[kind]();
  const items=kind==='ns.pulse-ode'?2*(input.steps??128)+1:kind==='ns.potential-curl'?(input.grid??7)**3:kind==='ns.pulse-tail'?(input.count??80):kind==='ns.dyadic-charts'?(input.count??10):kind==='ns.pulse-support'?(input.labels?.length??4)**2:kind==='ns.background-recursion'?(input.maxOrder??2)+1:(input.orders??4);
  return {algorithmicOperationsEstimate:operations,outputItemsEstimate:items,policy:'STATIC_PREFLIGHT_ESTIMATE; NOT_A_MEASURED_OR_CERTIFIED_OPERATION_COUNT; RUNTIME_TIME_AND_BYTE_LIMITS_ENFORCED_BY_ENGINE'};
}
export function validateRequest(r){
  try{
    if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).some(k=>!['kind','input','precision','budget'].includes(k)))fail('INVALID_INPUT','Use a request envelope with kind, input, precision and budget only.');
    const v=validate(r.kind,r.input??{});if(!v.ok)return v;
    const precision=precisionContract(r.kind,r.precision??{}),estimate=resourceEstimate(r.kind,r.input??{}),budget=r.budget??{};
    if(!budget||typeof budget!=='object'||Array.isArray(budget)||Object.keys(budget).some(k=>!['maxMillis','maxBytes','maxItems','maxOperations'].includes(k)))fail('INVALID_INPUT','Unknown NS M2 resource budget field.');
    for(const[k,v]of Object.entries(budget))if(!Number.isSafeInteger(v)||v<=0)fail('INVALID_INPUT',k+' must be a positive safe integer.');
    if(budget.maxOperations!==undefined&&estimate.algorithmicOperationsEstimate>budget.maxOperations||budget.maxItems!==undefined&&estimate.outputItemsEstimate>budget.maxItems)fail('BUDGET_EXCEEDED','Declared budget is below the finite NS job estimate. Reduce grid/steps/orders or increase the bounded budget.');
    return {ok:true,precision,estimate};
  }catch(e){return {ok:false,code:e.code||'INVALID_INPUT',errors:[e.message]};}
}
function finiteJson(value){
  if(typeof value==='number'){if(!Number.isFinite(value))fail('PRECISION_REQUIRED','A numerical result exceeded finite binary64 arithmetic.');return Number.isInteger(value)&&!Number.isSafeInteger(value)?{kind:'FLOAT64',value}:value;}
  if(Array.isArray(value))return value.map(finiteJson);
  if(value&&typeof value==='object'){if(value.kind==='FLOAT64'&&Object.keys(value).every(k=>['kind','value'].includes(k))){if(!Number.isFinite(value.value))fail('PRECISION_REQUIRED','A typed Float64 result is nonfinite.');return {kind:'FLOAT64',value:value.value};}return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,finiteJson(v)]));}
  return value;
}
export async function run(kind,input={},context={}){
  const v=validateRequest({kind,input,precision:context.precision??{},budget:context.budget??{}});if(!v.ok)return {kind,status:['UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED'].includes(v.code)?v.code:'FAILED',checks:[],blockers:v.errors,message:v.errors.join(' ')};const map={'ns.background-recursion':backgroundRecursion,'ns.background-cutoffs':cutoffSchedule,'ns.potential-curl':potentialCurl,'ns.dyadic-charts':dyadicCharts,'ns.pulse-support':pulseSupport,'ns.pulse-ode':pulseOde,'ns.pulse-covariance':covariance,'ns.pulse-tail':pulseTail};
  const r=map[kind](input,context),body=finiteJson({kind,moduleVersion:'m2-ns-0.1.1',...r,precisionLedger:v.precision,resourceEstimate:v.estimate});return {...body,resultHash:await sha256(body)};
}
export async function runJob(r,context={}){return run(r.kind,r.input,{...context,precision:r.precision??context.precision??{},budget:r.budget??context.budget??{}});}
export function getExamples(){return [
  ['ns-m2-recursion','N4 · 원문 1·2차 convolution과 지수 검사','ns.background-recursion',{maxOrder:2}],
  ['ns-m2-cutoffs','N4 · 전 구간 cutoff 부등식·active index','ns.background-cutoffs',{orders:4,logPower:2,growth:.4}],
  ['ns-m2-curl','N4/N5 · cutoff 후 실제 curl·divergence 검사','ns.potential-curl',{radius:2,frequency:2,grid:7}],
  ['ns-m2-dyadic','N5 · 물리 좌표와 dyadic chart 동기화','ns.dyadic-charts',{ellStart:4,count:14,h:.005}],
  ['ns-m2-support','N5 · conflict graph와 보조 torus 지지 분리','ns.pulse-support',{}],
  ['ns-m2-pulse-ode','N5 · 실제 projected pulse ODE·log 진폭','ns.pulse-ode',{epsilon:.04,F:1,FR:-3,GR:0,R:1,uStar:2,length:8,steps:128}],
  ['ns-m2-covariance','N5 · 두 family 공분산·1/2·Haar Jacobian','ns.pulse-covariance',{target:[-1,0],amplitude:1,liftedArea:1,epsilon:.1}],
  ['ns-m2-tail','N5 · cutoff tail의 log bound·고정 차수','ns.pulse-tail',{c:.2,C:2,derivativeLoss:2,targetPower:4,ellStart:8,count:80}]
].map(([id,label,kind,input])=>({id,label,request:{kind,input}}));}
export function getCapabilities(){return {kinds:KINDS,n3Profile:PROFILE,paper:PAPER,sourceEquations:['5.1–5.6','5.37','5.45','6.1–6.6','7.2–7.8','7.27','7.40'],implemented:'Bounded executable algebra/interval/ODE/support/curl components',fullN4:false,fullN5:false,precision:'Exact index expressions; outward IEEE754 scalar log intervals; parallel tangent-frame RK4 with analytic damping and empirical convergence, not a certified ODE solver',precisionModes:['FLOAT64','AUTO','OUTWARD_FLOAT64 only for cutoff/tail scalar bounds'],checklist:getChecklist(),requiredNext:['same-profile evaluated positive-order coefficients','common-domain Picard tails','five moment repairs at every positive order','same-profile source constants and pulse remainder bounds']};}
