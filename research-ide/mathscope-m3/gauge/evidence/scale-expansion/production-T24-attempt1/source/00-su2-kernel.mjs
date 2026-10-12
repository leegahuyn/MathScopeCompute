/** Packed, full continuous SU(2) Wilson arithmetic for independent M3 scale studies.
 * q=(w,x,y,z) maps to [[w+iz,x+iy],[-x+iy,w-iz]]. This is Hamilton multiplication.
 * This is an additive M3 adapter; the protected M2 volume/work guards are unchanged. */
import {rngFromSeed} from '../../mathscope-m2/gauge/contracts.mjs';
import {check,integer,number,sha256} from './contracts.mjs';

export const SU2_STUDY_KERNEL='m3-su2-full-group-heatbath-standard-flow-1';
export const SCALE_FLOW_CONVENTION=Object.freeze({
 group:'SU(2), defining representation; full continuous normalized Haar measure',
 quaternion:'q=(w,x,y,z) -> [[w+iz,x+iy],[-x+iy,w-iz]]',
 action:'S_W=beta sum_p(1-Re Tr U_p/2), beta=4/g0^2, isotropic a_s=a_t',
 standardFlow:'dV/d(t/a^2)=-(g0^2/2) grad_B(S_W)(V) V, B(X,Y)=-Tr(XY)',
 standardForce:'For staple S_e, Z_e=-Im_quaternion(U_e S_e); Vdot_e=Z_e V_e',
 existingY6Conversion:'t_standard=2*t_existing_Y6 for identical initial links; Y6 keeps its explicitly declared dV/dtau=-g0^2 grad_B S_W convention.',
 energy:'E_clover=sum_mu<nu -Tr(F_mu_nu^2), F=(Q-Qdagger)/8 in lattice units; no beta or g0 factor',
 alternateEnergy:'E_plaquette=4 sum_mu<nu(1-Re Tr U_mu_nu/2) per site',
 threshold:0.1, thresholdSource:'https://arxiv.org/abs/1811.02800, equation (3.1)',
 integrator:'Third-order group Runge-Kutta, Luscher 1006.4518 Appendix C; full simultaneous link force'
});

export function qMultiply(a,b){return [a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]];}
export const qConjugate=q=>[q[0],-q[1],-q[2],-q[3]];
export function qToMatrix(q){return {n:2,re:[q[0],q[1],-q[1],q[0]],im:[q[3],q[2],q[2],-q[3]]};}
export function packMatrices(links){const packed=new Float64Array(links.length*4);links.forEach((u,id)=>{check(u?.n===2,'SU2_PACK','Every positive periodic link must be a 2x2 SU2 matrix.');packed.set([u.re[0],u.re[1],u.im[1],u.im[0]],id*4);});return packed;}
export function unpackMatrices(links){const out=[];for(let i=0;i<links.length;i+=4)out.push(qToMatrix(links.subarray(i,i+4)));return out;}

export function su2Geometry(Ns,Nt){
 integer(Ns,'Ns',2,12);integer(Nt,'Nt',4,32);const V=Ns**3*Nt;check(V<=16384,'STUDY_VOLUME_BUDGET','M3 packed SU2 studies are limited to 16384 actual sites; no lattice is downsampled.');
 const sizes=[Ns,Ns,Ns,Nt],strides=[1,Ns,Ns*Ns,Ns**3],neighbors=new Int32Array(V*8),coordinates=Array.from({length:V},(_,s)=>sizes.map((n,j)=>Math.floor(s/strides[j])%n));
 for(let s=0;s<V;s++)for(let mu=0;mu<4;mu++){const n=coordinates[s][mu],d=strides[mu];neighbors[s*8+mu*2]=s+(n+1<sizes[mu]?d:-(sizes[mu]-1)*d);neighbors[s*8+mu*2+1]=s+(n>0?-d:(sizes[mu]-1)*d);}
 const neighbor=(s,mu,sign=1)=>neighbors[s*8+mu*2+(sign<0?1:0)];
 function path(site,dirs){const edges=[];for(const signed of dirs){const mu=Math.abs(signed)-1,end=neighbor(site,mu,Math.sign(signed));edges.push(signed>0?site*4+mu+1:-(end*4+mu+1));site=end;}return edges;}
 const plaquettes=new Int32Array(V*6*4),clovers=new Int32Array(V*6*4*4),staples=new Int32Array(V*4*6*3),spatialStaples=new Int32Array(V*3*4*3);let p=0,c=0;
 for(let site=0;site<V;site++)for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++){
  const a=mu+1,b=nu+1;plaquettes.set(path(site,[a,b,-a,-b]),p);p+=4;
  for(const dirs of [[a,b,-a,-b],[b,-a,-b,a],[-a,-b,a,b],[-b,a,b,-a]]){clovers.set(path(site,dirs),c);c+=4;}
 }
 for(let site=0;site<V;site++)for(let mu=0;mu<4;mu++){
  const end=neighbor(site,mu);let k=0,sp=0;
  for(let nu=0;nu<4;nu++)if(nu!==mu)for(const sign of [1,-1]){
   const dirs=[sign*(nu+1),-(mu+1),-sign*(nu+1)],edges=path(end,dirs);staples.set(edges,(site*4+mu)*18+k*3);k++;
   if(mu<3&&nu<3){spatialStaples.set(edges,(site*3+mu)*12+sp*3);sp++;}
  }
 }
 return {Ns,Nt,V,linkCount:4*V,sizes,neighbors,coordinates,neighbor,path,plaquettes,clovers,staples,spatialStaples};
}

/** Signed edge id: +(id+1) is U; -(id+1) is Udagger. Allocation-free inner loop. */
export function pathProduct(links,edges,offset,count,out){
 let w=1,x=0,y=0,z=0;
 for(let k=0;k<count;k++){
  const e=edges[offset+k],i=(Math.abs(e)-1)*4,sign=e>0?1:-1,a=links[i],b=sign*links[i+1],c=sign*links[i+2],d=sign*links[i+3];
  const nw=w*a-x*b-y*c-z*d,nx=w*b+x*a+y*d-z*c,ny=w*c-x*d+y*a+z*b,nz=w*d+x*c-y*b+z*a;w=nw;x=nx;y=ny;z=nz;
 }
 out[0]=w;out[1]=x;out[2]=y;out[3]=z;return out;
}
export function stapleAt(links,g,id,out,scratch=new Float64Array(4)){
 out.fill(0);const offset=id*18;for(let k=0;k<6;k++){pathProduct(links,g.staples,offset+k*3,3,scratch);for(let j=0;j<4;j++)out[j]+=scratch[j];}return out;
}
function haar(rng,out){let n=0;for(let j=0;j<4;j++){out[j]=rng.normal();n+=out[j]**2;}n=Math.sqrt(n);for(let j=0;j<4;j++)out[j]/=n;return out;}
export function su2Initial(g,seed,start='HOT_HAAR'){
 check(['COLD','HOT_HAAR'].includes(start),'STUDY_START','Initial condition is COLD or full HOT_HAAR.');const links=new Float64Array(g.linkCount*4),rng=rngFromSeed(seed),q=new Float64Array(4);
 for(let id=0;id<g.linkCount;id++){if(start==='COLD')links[id*4]=1;else links.set(haar(rng,q),id*4);}return links;
}

/** Exact conditional density with respect to full SU2 Haar, up to Float64/PRNG arithmetic.
 * q0 ~ sqrt(1-q0^2) exp(alpha*q0), direction uniform on S2; no discrete subgroup. */
export function su2Conditional(alpha,rng,out=new Float64Array(4)){
 if(alpha<0.1){do{haar(rng,out);}while(rng.uniform()>Math.exp(alpha*(out[0]-1)));return out;}
 const em1=Math.expm1(-2*alpha);let w,r;
 do{w=1+Math.log1p(rng.uniform()*em1)/alpha;r=Math.sqrt(Math.max(0,1-w*w));}while(rng.uniform()>r);
 const z=2*rng.uniform()-1,theta=2*Math.PI*rng.uniform(),s=Math.sqrt(Math.max(0,1-z*z));out[0]=w;out[1]=r*s*Math.cos(theta);out[2]=r*s*Math.sin(theta);out[3]=r*z;return out;
}
export function heatbathSweep(links,g,beta,rng,{overrelaxation=false}={}){
 number(beta,'beta',{min:0,max:12});const s=new Float64Array(4),tmp=new Float64Array(4),q=new Float64Array(4);let residual=0;
 for(let id=0;id<g.linkCount;id++){
  stapleAt(links,g,id,s,tmp);const k=Math.hypot(...s),i=id*4;if(k<1e-14){if(!overrelaxation)links.set(haar(rng,q),i);continue;}
  const a=s[0]/k,b=-s[1]/k,c=-s[2]/k,d=-s[3]/k; // Vdagger, S=kV.
  if(overrelaxation){
   const old=[links[i],-links[i+1],-links[i+2],-links[i+3]],v=[a,b,c,d],n=qMultiply(qMultiply(v,old),v);q.set(n);
  }else{
   su2Conditional(beta*k,rng,q);const w=q[0],x=q[1],y=q[2],z=q[3];q[0]=w*a-x*b-y*c-z*d;q[1]=w*b+x*a+y*d-z*c;q[2]=w*c-x*d+y*a+z*b;q[3]=w*d+x*c-y*b+z*a;
  }
  const norm=Math.hypot(...q);residual=Math.max(residual,Math.abs(norm-1));for(let j=0;j<4;j++)links[i+j]=q[j]/norm;
 }
 return {updatedLinks:g.linkCount,kind:overrelaxation?'MICROCANONICAL_OVERRELAXATION':'FULL_SU2_HEATBATH',maxPreNormalizationNormResidual:residual};
}
export function wilsonSummary(links,g,beta=1){
 const q=new Float64Array(4),byTime=Array.from({length:g.Nt},()=>Array(3).fill(0));let action=0,trace=0;
 for(let p=0;p<g.V*6;p++){pathProduct(links,g.plaquettes,p*4,4,q);trace+=q[0];action+=beta*(1-q[0]);const pair=p%6;if(pair===0||pair===1||pair===3){const site=Math.floor(p/6),t=g.coordinates[site][3],j=pair===0?0:pair===1?1:2;byTime[t][j]+=q[0]/g.Ns**3;}}
 return {action,meanPlaquette:trace/(6*g.V),spatialPlaquettesByTime:byTime,plaquetteEnergy:4*(6*g.V-trace)/g.V};
}
export function cloverSummary(links,g){
 const q=new Float64Array(4),f=new Float64Array(18);let energy=0,charge=0;
 for(let site=0;site<g.V;site++){
  for(let pair=0;pair<6;pair++){let x=0,y=0,z=0;for(let k=0;k<4;k++){pathProduct(links,g.clovers,(site*24+pair*4+k)*4,4,q);x+=q[1]/4;y+=q[2]/4;z+=q[3]/4;}f[pair*3]=x;f[pair*3+1]=y;f[pair*3+2]=z;energy+=2*(x*x+y*y+z*z);}
  let dot=0;for(let j=0;j<3;j++)dot+=f[j]*f[15+j]-f[3+j]*f[12+j]+f[6+j]*f[9+j];charge+=dot/(2*Math.PI**2);
 }
 return {cloverEnergy:energy/g.V,unroundedCloverCharge:charge,integerTopologicalCharge:null};
}

export function standardWilsonForce(links,g,out=new Float64Array(g.linkCount*3)){
 const s=new Float64Array(4),q=new Float64Array(4);
 for(let id=0;id<g.linkCount;id++){
  stapleAt(links,g,id,s,q);const i=id*4,w=links[i],x=links[i+1],y=links[i+2],z=links[i+3],a=s[0],b=s[1],c=s[2],d=s[3];
  out[id*3]=-(w*b+x*a+y*d-z*c);out[id*3+1]=-(w*c-x*d+y*a+z*b);out[id*3+2]=-(w*d+x*c-y*b+z*a);
 }
 return out;
}
function applyForce(links,out,h,forces,weights){
 for(let id=0;id<links.length/4;id++){
  let x=0,y=0,z=0;for(let k=0;k<forces.length;k++){x+=h*weights[k]*forces[k][id*3];y+=h*weights[k]*forces[k][id*3+1];z+=h*weights[k]*forces[k][id*3+2];}
  const r=Math.hypot(x,y,z),s=r>1e-14?Math.sin(r)/r:1-r*r/6,w=Math.cos(r);x*=s;y*=s;z*=s;
  const i=id*4,a=links[i],b=links[i+1],c=links[i+2],d=links[i+3],nw=w*a-x*b-y*c-z*d,nx=w*b+x*a+y*d-z*c,ny=w*c-x*d+y*a+z*b,nz=w*d+x*c-y*b+z*a,n=Math.hypot(nw,nx,ny,nz);
  out[i]=nw/n;out[i+1]=nx/n;out[i+2]=ny/n;out[i+3]=nz/n;
 }
 return out;
}
export function standardFlowStep(links,g,h,workspace={}){
 number(h,'flow step',{min:1e-6,max:.1});const w1=workspace.w1??new Float64Array(links.length),w2=workspace.w2??new Float64Array(links.length),out=workspace.out??new Float64Array(links.length),z0=standardWilsonForce(links,g,workspace.z0),z1=workspace.z1??new Float64Array(g.linkCount*3),z2=workspace.z2??new Float64Array(g.linkCount*3);
 applyForce(links,w1,h,[z0],[1/4]);standardWilsonForce(w1,g,z1);applyForce(w1,w2,h,[z1,z0],[8/9,-17/36]);standardWilsonForce(w2,g,z2);applyForce(w2,out,h,[z2,z1,z0],[3/4,-8/9,17/36]);return out;
}
export async function standardFlowCurve(original,g,{maxTime=1,step=.04,measureEvery=2}={},context={}){
 number(maxTime,'maxTime',{min:.04,max:16});number(step,'flow step',{min:.001,max:.08});integer(measureEvery,'measureEvery',1,16);
 const steps=Math.ceil(maxTime/step),h=maxTime/steps;check(steps<=4096,'FLOW_STUDY_BUDGET','A standard flow trajectory has at most 4096 integration steps.');
 let links=original.slice(),scratch=new Float64Array(links.length);const workspace={w1:new Float64Array(links.length),w2:new Float64Array(links.length),z0:new Float64Array(g.linkCount*3),z1:new Float64Array(g.linkCount*3),z2:new Float64Array(g.linkCount*3)},curve=[];
 const add=(k)=>{const {meanPlaquette,action}=wilsonSummary(links,g,1),{cloverEnergy,unroundedCloverCharge}=cloverSummary(links,g),t=k*h;curve.push({step:k,t,cloverEnergy,plaquetteEnergy:4*action/g.V,t2E:t*t*cloverEnergy,t2EPlaquette:t*t*4*action/g.V,meanPlaquette,unroundedCloverCharge});};add(0);
 for(let k=1;k<=steps;k++){
  context.checkCancelled?.();workspace.out=scratch;standardFlowStep(links,g,h,workspace);const old=links;links=scratch;scratch=old;
  if(k%measureEvery===0||k===steps)add(k);if(k%16===0)await context.yield?.({phase:'standard-su2-flow',completed:k,total:steps});
 }
 const monotone=curve.slice(1).every((p,i)=>p.meanPlaquette+1e-11>=curve[i].meanPlaquette);check(monotone,'FLOW_ACTION_INCREASE','Standard RK flow increased the actual Wilson action at a measured step; refine the integration step.');
 return {curve,links,steps,step:h,actionMonotone:monotone,normalization:SCALE_FLOW_CONVENTION};
}

/** Spatial APE projection: all inputs stay on one Euclidean time slice. */
export function spatialSmear(original,g,steps=2,alpha=.5){
 integer(steps,'spatial smear steps',0,12);number(alpha,'spatial smear alpha',{min:0,max:.75});let links=original.slice(),next=new Float64Array(links.length);const q=new Float64Array(4);
 for(let step=0;step<steps;step++){
  next.set(links);for(let site=0;site<g.V;site++)for(let mu=0;mu<3;mu++){
   const i=(site*4+mu)*4,off=(site*3+mu)*12,s=[0,0,0,0];for(let k=0;k<4;k++){pathProduct(links,g.spatialStaples,off+k*3,3,q);for(let j=0;j<4;j++)s[j]+=q[j];}
   const v=[(1-alpha)*links[i]+alpha*s[0]/4,(1-alpha)*links[i+1]-alpha*s[1]/4,(1-alpha)*links[i+2]-alpha*s[2]/4,(1-alpha)*links[i+3]-alpha*s[3]/4],n=Math.hypot(...v);check(n>1e-12,'SMEAR_PROJECTION_SINGULAR','The spatial APE projection is singular; the operator is undefined, not silently replaced.');for(let j=0;j<4;j++)next[i+j]=v[j]/n;
  }
  const old=links;links=next;next=old;
 }
 return links;
}
export function spatialOperatorBasis(links,g,{smearSteps=[0,2,4],alpha=.5}={}){
 check(Array.isArray(smearSteps)&&smearSteps.length>=1&&smearSteps.length<=4&&smearSteps.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=12&&(i===0||n>smearSteps[i-1])),'OPERATOR_BASIS','Choose up to four distinct increasing spatial-smearing levels.');
 const values=Array.from({length:g.Nt},()=>[]);let current=links,previous=0;
 for(const n of smearSteps){current=spatialSmear(current,g,n-previous,alpha);const {spatialPlaquettesByTime:byTime}=wilsonSummary(current,g,1);byTime.forEach((p,t)=>values[t].push(p.reduce((s,x)=>s+x,0)/3));previous=n;}
 return {values,operators:smearSteps.map(n=>({name:`A1++ spatial plaquette, APE ${n}`,smearSteps:n,alpha,timeSupport:'ONE_TIME_SLICE',gaugeInvariant:true,fullVacuumRemoval:'SEPARATE_VACUUM_AUDIT_REQUIRED'}))};
}
export function transformPacked(links,g,frames){
 check(frames.length===g.V*4,'GAUGE_FRAMES','One full SU2 frame is required at every site.');const result=new Float64Array(links.length);
 for(let id=0;id<g.linkCount;id++){const site=Math.floor(id/4),mu=id%4,end=g.neighbor(site,mu),a=Array.from(frames.subarray(site*4,site*4+4)),u=Array.from(links.subarray(id*4,id*4+4)),b=qConjugate(Array.from(frames.subarray(end*4,end*4+4)));result.set(qMultiply(qMultiply(a,u),b),id*4);}return result;
}
export async function packedSourceHash(links,model){return sha256({schema:'MathScope.M3.FullSU2Source/1',kernel:SU2_STUDY_KERNEL,model,quaternionConvention:SCALE_FLOW_CONVENTION.quaternion,links:Array.from(links)});}
export async function packedFastSourceHash(links,model){
 // Explicit little-endian serialization makes the source independent of host endianness.
 const bytes=new Uint8Array(links.length*8),view=new DataView(bytes.buffer);for(let i=0;i<links.length;i++){check(Number.isFinite(links[i]),'NONFINITE_LINK','A nonfinite link cannot be sealed.');view.setFloat64(i*8,links[i],true);}
 const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes),linksSha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return sha256({schema:'MathScope.M3.FullSU2Source/2',kernel:SU2_STUDY_KERNEL,model,quaternionConvention:SCALE_FLOW_CONVENTION.quaternion,encoding:'ALL_LINKS_FLOAT64_IEEE754_LITTLE_ENDIAN',numberOfFloat64:links.length,linksSha256});
}
