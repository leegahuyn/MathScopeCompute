/** Complete primary-wave remainder algebra before any class estimate.
 *
 * The moving-normal principal equation, eikonal cancellation, tangency
 * and full-curl divergence are retained as separate exact expressions.
 * None is set to zero by this generic operator. An original-source
 * adapter must bind and prove them before removing them from a norm.
 */
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {exactHarmonicComplexAlgebra,exactAngularResidualUpdate,
  originalCylindricalDifferentialOperators} from './source-harmonic-assembly.mjs';
import {createQuadraticSourceVerifier} from './source-quadratic-identity.mjs';

const fail=(message,code='INVALID_INPUT')=>{throw Object.assign(new Error(message),{code});},
  parts=['real','imaginary'],seals=new WeakMap(),node=(G,x)=>Number.isSafeInteger(x)&&!!G.nodes[x],
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  record=s=>({schema:s.schema,input:s.input,geometry:s.geometry,principal:s.principal,waves:s.waves,
    previous:s.previous,update:s.update,terms:s.terms,divergence:s.divergence,scope:s.scope}),
  graphChunks=(G,count)=>Array.from({length:Math.ceil(count/4096)},(_,j)=>canonicalStringify(G.nodes.slice(j*4096,Math.min(count,(j+1)*4096))));

function rowAlgebra(G){
  const C=exactHarmonicComplexAlgebra(G),zero=()=>[C.zero,C.zero,C.zero],
    addVectors=(...rows)=>[0,1,2].map(j=>C.add(...rows.map(r=>r[j]))),
    sum=rows=>{const out=new Map();for(const {m,value}of rows)out.set(m,addVectors(out.get(m)??zero(),value));
      return [...out].sort(([a],[b])=>a-b).map(([m,value])=>({m,value}));},
    at=(rows,m)=>rows.find(r=>r.m===m)?.value??zero(),
    difference=(a,b)=>[...new Set([...a,...b].map(r=>r.m))].sort((x,y)=>x-y)
      .map(m=>({m,value:at(a,m).map((z,j)=>C.sub(z,at(b,m)[j]))}));
  return {C,zero,addVectors,sum,at,difference};
}

/** Retain every term in R(U+w,p+pi)-R(U,p), with
 * w=Re[(weight*psi*t+i*curlRemainder)*exp(i*k*Phi)].
 * All geometry and background fields are exact expression roots.
 */
export function exactPrimaryResidualDecomposition(G,input={}){
  const allowed=['geometry','phase','k','axialCarrier','background','amplitude','curlRemainder','meanVelocity','meanPressure','oldFlatResidual'];
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))
    fail('Supply only the complete original primary-wave operands.');
  const {geometry,phase,k,axialCarrier:pz,background,amplitude,curlRemainder,meanVelocity,meanPressure,oldFlatResidual}=input,
    D=originalCylindricalDifferentialOperators(G,geometry),{C,zero,addVectors,sum}=rowAlgebra(G),
    {R,Z,T,theta,epsilon}=D,q=(n,d=1)=>G.q(n,d),invR=G.inv(R),invR2=G.pow(invR,2),
    vectorOK=a=>Array.isArray(a)&&a.length===3&&a.every(x=>node(G,x)),
    physicalCoordinates=D.coordinates,
    fast=x=>geometry.Y?G.mul(geometry.ci,D.N(x)):G.derivative(x,geometry.v),
    coefficient=x=>node(G,x)&&!G.freeCoordinates(x).has(theta);
  if(!background||Object.keys(background).some(k=>!['b','F','G','pressure'].includes(k))||
    !['b','F','G','pressure'].every(k=>coefficient(background[k]))||
    !amplitude||Object.keys(amplitude).some(k=>!['t','weight','psi'].includes(k))||!vectorOK(amplitude.t)||
    ![amplitude.weight,amplitude.psi].every(coefficient)||!vectorOK(curlRemainder)||!vectorOK(meanVelocity)||
    !coefficient(meanPressure)||![phase,k,pz].every(x=>node(G,x))||!Array.isArray(oldFlatResidual))
    fail('Retain the real background, all three primary and curl-remainder components, the complete mean and explicit pressures.');
  if([...amplitude.t,...curlRemainder,...meanVelocity].some(x=>!coefficient(x))||
    [epsilon,k,pz].some(x=>physicalCoordinates.some(y=>G.derivative(x,y)!==G.zero)))
    fail('Freeze epsilon and both carriers before differentiation; coefficient bodies must be angular independent.');
  const fastCoordinates=geometry.Y??[geometry.xi,geometry.v];
  if(['b','F','G'].some(name=>fastCoordinates.some(y=>G.freeCoordinates(background[name]).has(y))))
    fail('The original principal background is slow; a fast mean belongs in the explicit complete mean field.');
  const b=background.b,F=background.F,V=G.mul(R,F),Bz=background.G,U0=[b,V,Bz],
    n=[D.Dr(phase),D.angular(phase),D.Dz(phase)],nPrime=n.map(fast),p=D.thetaDerivative(phase),
    phaseTime=D.time(phase),phaseFast=fast(phase),phaseLap=G.add(D.Dr(n[0]),G.mul(invR,n[0]),D.Dz(n[2])),
    n2=G.add(...n.map(x=>G.pow(x,2))),d=G.mul(epsilon,G.pow(k,2),n2),
    K=[[G.zero,G.mul(q(-2),F),G.zero],[G.add(G.mul(q(2),F),G.mul(R,G.derivative(F,R))),G.zero,G.zero],
      [G.derivative(Bz,R),G.zero,G.zero]],
    pressureRow=[0,1,2].map(j=>G.div(G.sub(G.add(...n.map((x,i)=>G.mul(x,K[i][j]))),nPrime[j]),G.mul(k,n2))),
    piImaginary=G.add(...pressureRow.map((x,j)=>G.mul(x,amplitude.t[j]))),
    weight=amplitude.weight,psi=amplitude.psi,t=amplitude.t,scalar=G.mul(weight,psi),
    leading=t.map(x=>G.mul(scalar,x)),fullPressureImaginary=G.mul(scalar,piImaginary),
    principalDefect=t.map((x,j)=>G.add(fast(x),G.add(...K[j].map((a,l)=>G.mul(a,t[l]))),G.mul(d,x),G.neg(G.mul(k,n[j],piImaginary)))),
    principalPhase=G.add(phaseFast,G.mul(p,F),G.mul(pz,Bz)),
    phaseRemainder=G.add(G.neg(G.mul(epsilon,G.derivative(phase,T))),G.mul(b,n[0]),G.mul(Bz,G.sub(n[2],pz)),
      G.mul(F,G.sub(G.mul(R,n[1]),p))),
    actualPhaseSpeed=G.add(phaseTime,G.mul(b,n[0]),G.mul(V,n[1]),G.mul(Bz,n[2]));
  const derivative=(z,fn)=>C.derivative(z,fn),dot=(a,v)=>C.add(...a.map((x,j)=>C.scale(x,v[j]))),
    scaleVector=(a,v)=>v.map(z=>C.scale(a,z)),
    advect=(a,m,advecting)=>{
      const directional=dot(n,advecting),out=a.map(z=>C.add(C.mul(advecting[0],derivative(z,D.Dr)),
        C.mul(advecting[2],derivative(z,D.Dz)),C.imaginary(G.mul(k,q(m)),C.mul(directional,z))));
      out[0]=C.sub(out[0],C.scale(invR,C.mul(a[1],advecting[1])));
      out[1]=C.add(out[1],C.scale(invR,C.mul(a[0],advecting[1])));return out;
    },slowAdvect=(a,advecting)=>{
      const out=a.map(z=>C.add(C.mul(advecting[0],derivative(z,D.Dr)),C.mul(advecting[2],derivative(z,D.Dz))));
      out[0]=C.sub(out[0],C.scale(invR,C.mul(a[1],advecting[1])));
      out[1]=C.add(out[1],C.scale(invR,C.mul(a[0],advecting[1])));return out;
    },divergence=(v,m)=>C.add(derivative(v[0],D.Dr),C.scale(invR,v[0]),derivative(v[2],D.Dz),
      C.imaginary(G.mul(k,q(m)),dot(n,v))),
    laplacian=(v,m)=>{
      const mk=G.mul(k,q(m)),out=v.map(z=>C.add(derivative(derivative(z,D.Dr),D.Dr),C.scale(invR,derivative(z,D.Dr)),
        derivative(derivative(z,D.Dz),D.Dz),
        C.imaginary(mk,C.add(C.scale(G.mul(q(2),n[0]),derivative(z,D.Dr)),C.scale(G.mul(q(2),n[2]),derivative(z,D.Dz)),C.scale(phaseLap,z))),
        C.scale(G.neg(G.mul(G.pow(mk,2),n2)),z)));
      out[0]=C.sub(C.sub(out[0],C.scale(invR2,v[0])),C.imaginary(G.mul(q(2),mk,n[1],invR),v[1]));
      out[1]=C.add(C.sub(out[1],C.scale(invR2,v[1])),C.imaginary(G.mul(q(2),mk,n[1],invR),v[0]));return out;
    },linear=(v,m,pressure)=>{
      const lap=laplacian(v,m),gradient=[derivative(pressure,D.Dr),C.zero,derivative(pressure,D.Dz)];
      return v.map((z,j)=>C.add(derivative(z,D.time),C.imaginary(G.mul(k,q(m),phaseTime),z),
        C.scale(G.neg(epsilon),lap[j]),gradient[j],C.imaginary(G.mul(k,q(m),n[j]),pressure)));
    },backgroundComplex=U0.map(x=>C.value(x)),meanComplex=meanVelocity.map(x=>C.value(x)),
    oldVelocity=U0.map((x,j)=>G.add(x,meanVelocity[j])),oldComplex=oldVelocity.map(x=>C.value(x)),
    previous=[{m:0,velocity:oldComplex,pressure:C.value(G.add(background.pressure,meanPressure))}],
    waves=[-1,1].map(m=>({m,leading:leading.map(x=>C.value(G.mul(q(1,2),x))),
      remainder:curlRemainder.map(x=>C.value(G.zero,G.mul(q(m,2),x))),
      pressure:C.value(G.zero,G.mul(q(m,2),fullPressureImaginary))}));
  waves.forEach(r=>{r.velocity=addVectors(r.leading,r.remainder);});
  const terms=[],put=(id,formula,rows,extra={})=>terms.push({id,formula,rows:sum(rows),...extra}),
    perWave=fn=>waves.map(r=>({m:r.m,value:fn(r)}));
  put('homogeneous-principal-defect','weight*psi*(t_fast+K*t+d*t+i*k*n*pi_h)/2',
    perWave(()=>principalDefect.map(x=>C.value(G.mul(q(1,2),scalar,x)))),{mayBeRemovedOnlyAfter:'Actual source moving-frame and homogeneous Volterra equation are bound and checked.'});
  put('pulse-cutoff-derivative','weight*(fast psi)*t/2',
    perWave(()=>t.map(x=>C.value(G.mul(q(1,2),weight,fast(psi),x)))),{gaussianEndpointTailMustBeBounded:true});
  put('weight-fast-derivative','(fast weight)*psi*t/2',
    perWave(()=>t.map(x=>C.value(G.mul(q(1,2),fast(weight),psi,x)))),{zeroRequiresActualFastIndependence:true});
  put('principal-eikonal-defect','i*k*m*(fast Phi+p F+p_z G)*leading_m',
    perWave(r=>r.leading.map(z=>C.imaginary(G.mul(k,q(r.m),principalPhase),z))),{mayBeRemovedOnlyAfter:'The actual complete phase definition and frozen integer carriers are checked.'});
  put('remaining-eikonal-transport','i*k*m*(-epsilon Phi_T+b n_r+G(n_z-p_z)+F(R n_theta-p))*leading_m',
    perWave(r=>r.leading.map(z=>C.imaginary(G.mul(k,q(r.m),phaseRemainder),z))));
  put('background-radial-transport','b*D_r leading_m',perWave(r=>r.leading.map(z=>C.scale(b,derivative(z,D.Dr)))));
  put('slow-time-and-axial-transport','epsilon*(G*partial_Z-partial_T) leading_m',perWave(r=>r.leading.map(z=>
    C.scale(epsilon,C.sub(C.scale(Bz,derivative(z,x=>G.derivative(x,Z))),derivative(z,x=>G.derivative(x,T)))))));
  put('background-small-gradient-and-connection','(D_r b L_r+D_z b L_z, b L_theta/R+D_z(R F)L_z, D_z G L_z)',perWave(r=>[
    C.add(C.scale(D.Dr(b),r.leading[0]),C.scale(D.Dz(b),r.leading[2])),
    C.add(C.scale(G.mul(b,invR),r.leading[1]),C.scale(D.Dz(V),r.leading[2])),C.scale(D.Dz(Bz),r.leading[2])]));
  put('viscous-coefficient-laplacian','-epsilon*(D_r^2+R^-1 D_r+D_z^2) leading_m',perWave(r=>r.leading.map(z=>
    C.scale(G.neg(epsilon),C.add(derivative(derivative(z,D.Dr),D.Dr),C.scale(invR,derivative(z,D.Dr)),derivative(derivative(z,D.Dz),D.Dz))))));
  put('viscous-phase-commutators','-i*epsilon*k*m*(2 n_r D_r+2 n_z D_z+Delta Phi) leading_m',perWave(r=>r.leading.map(z=>
    C.imaginary(G.neg(G.mul(epsilon,k,q(r.m))),C.add(C.scale(G.mul(q(2),n[0]),derivative(z,D.Dr)),
      C.scale(G.mul(q(2),n[2]),derivative(z,D.Dz)),C.scale(phaseLap,z))))));
  put('viscous-cylindrical-connections','epsilon*(L_r/R^2+2 i*k*m*n_theta L_theta/R, L_theta/R^2-2 i*k*m*n_theta L_r/R,0)',perWave(r=>[
    C.scale(epsilon,C.add(C.scale(invR2,r.leading[0]),C.imaginary(G.mul(q(2),k,q(r.m),n[1],invR),r.leading[1]))),
    C.scale(epsilon,C.sub(C.scale(invR2,r.leading[1]),C.imaginary(G.mul(q(2),k,q(r.m),n[1],invR),r.leading[0]))),C.zero]));
  put('complete-primary-pressure-coefficient-gradient','(D_r pi_m,0,D_z pi_m)',perWave(r=>[
    derivative(r.pressure,D.Dr),C.zero,derivative(r.pressure,D.Dz)]),{fullCutoffAndNormalPressureInsideDerivatives:true});
  put('full-curl-remainder-linear-background','(partial_t-epsilon Delta) E_m+(U0 dot grad)E_m+(E_m dot grad)U0',
    perWave(r=>addVectors(linear(r.remainder,r.m,C.zero),advect(r.remainder,r.m,backgroundComplex),advect(backgroundComplex,0,r.remainder))),
    {allSlowFastAndCylindricalDerivativesRetained:true});
  put('complete-mean-wave-advection','(mean dot grad)w+(w dot grad)mean',
    perWave(r=>addVectors(advect(r.velocity,r.m,meanComplex),advect(meanComplex,0,r.velocity))),
    {fullFastMeanRetained:true});
  const quadratic={leadingSlow:[],leadingPhase:[],leadingRemainder:[],remainderLeading:[],remainderRemainder:[]};
  for(const a of waves)for(const v of waves){
    const m=a.m+v.m;
    quadratic.leadingSlow.push({m,value:slowAdvect(a.leading,v.leading)});
    quadratic.leadingPhase.push({m,value:a.leading.map(z=>C.imaginary(G.mul(k,q(a.m)),C.mul(dot(n,v.leading),z)))});
    quadratic.leadingRemainder.push({m,value:advect(a.leading,a.m,v.remainder)});
    quadratic.remainderLeading.push({m,value:advect(a.remainder,a.m,v.leading)});
    quadratic.remainderRemainder.push({m,value:advect(a.remainder,a.m,v.remainder)});
  }
  put('quadratic-leading-slow-and-connection','sum_(m,n) (L_n dot grad_coeff)L_m plus every cylindrical connection',quadratic.leadingSlow);
  put('quadratic-leading-phase-tangency','sum_(m,n) i*k*m*(n_phase dot L_n)*L_m',quadratic.leadingPhase,
    {mayBeRemovedOnlyAfter:'The actual weighted primary is tangent to its same full phase normal.'});
  put('quadratic-leading-remainder','sum_(m,n) (E_n dot grad)L_m',quadratic.leadingRemainder);
  put('quadratic-remainder-leading','sum_(m,n) (L_n dot grad)E_m',quadratic.remainderLeading);
  put('quadratic-remainder-remainder','sum_(m,n) (E_n dot grad)E_m',quadratic.remainderRemainder);
  const divOld=divergence(oldComplex,0),divWaves=waves.map(r=>({m:r.m,value:divergence(r.velocity,r.m)})),
    conservativeCorrections=[];
  for(const r of waves){
    const div=divWaves.find(x=>x.m===r.m).value;
    conservativeCorrections.push({m:r.m,value:r.velocity.map((z,j)=>C.add(C.mul(z,divOld),C.mul(oldComplex[j],div)))});
    for(const s of waves)conservativeCorrections.push({m:r.m+s.m,value:r.velocity.map(z=>C.mul(z,divWaves.find(x=>x.m===s.m).value))});
  }
  put('complete-conservative-divergence-correction','w div(U_old)+U_old div(w)+w div(w)',conservativeCorrections,
    {wholeCurlDivergenceMustBeProvedBeforeLeadingRemainderSplit:true,zeroDivergenceAssumed:false});
  const increment=waves.map(({m,velocity,pressure})=>({m,velocity,pressure})),
    update=exactAngularResidualUpdate(G,{geometry,phase,k,previous,increment,oldFlatResidual}),
    s={schema:'MathScope.N6.ExactPrimaryResidualTermDecomposition/1',input:structuredClone(input),geometry:structuredClone(geometry),
      principal:{normal:n,normalPrime:nPrime,normalSquared:n2,K,damping:d,pressureRow,unweightedPressureImaginary:piImaginary,
        unweightedDefect:principalDefect,phase:principalPhase,phaseRemainder,actualPhaseSpeed,phaseLaplacian:phaseLap,
        leadingTangency:G.add(...n.map((x,j)=>G.mul(x,leading[j]))),fastWeightDerivative:fast(weight)},
      waves,previous,update,terms,divergence:{previous:divOld,waves:divWaves},
      scope:{completeFiniteWaveResidualRetained:true,allPrimaryQuadraticPairsRetained:true,finiteAngularDiscardedModes:[],
        oldFlatResidualRetained:true,fullPrimaryPressureRetained:true,conservativeDivergenceCorrectionsRetained:true,
        homogeneousDefectRemoved:false,eikonalDefectRemoved:false,tangencyDefectRemoved:false,
        fullCurlDivergenceDeclaredZero:false,sourceAuthenticated:false,sourceCancellationBridgeExecuted:false,
        inputClassSeminormsProduced:false,allOrderSourceClassCertified:false,originalN602Complete:false,originalN603Complete:false}};
  if(typeof G.captureFunctionDefinitions!=='function'||typeof G.functionDefinitionsUnchanged!=='function')
    fail('Retain the complete scalar function definitions before sealing a primary remainder record.');
  const count=G.nodes.length;
  seals.set(s,{G,record:canonicalStringify(record(s)),count,chunks:graphChunks(G,count),definitions:G.captureFunctionDefinitions()});return s;
}

export function assertExactPrimaryResidualDecomposition(G,s){
  const seal=seals.get(s);
  if(!seal||seal.G!==G||seal.record!==canonicalStringify(record(s))||G.nodes.length<seal.count||
    !G.functionDefinitionsUnchanged(seal.definitions)||!same(seal.chunks,graphChunks(G,seal.count)))
    fail('Use the unchanged complete primary-wave expression record.','INVALID_SOURCE_CONSTRUCTION');
  return true;
}

/** Recompute direct minus old and the sum of all supplied remainder rows.
 * The stored zero defect is never used as evidence. This verifier can
 * also be used on an intentionally changed record as a negative control.
 */
export function verifyExactPrimaryResidualDecomposition(G,s,{maxTerms=180000,maxProducts=3000000}={}){
  if(s?.schema!=='MathScope.N6.ExactPrimaryResidualTermDecomposition/1'||!Array.isArray(s.terms)||
    new Set(s.terms.map(r=>r.id)).size!==s.terms.length)fail('Retain a distinct complete primary term inventory.');
  const {C,sum,at,difference}=rowAlgebra(G),validRows=rows=>Array.isArray(rows)&&rows.every(r=>
    Number.isSafeInteger(r.m)&&Array.isArray(r.value)&&r.value.length===3&&r.value.every(C.check));
  if(s.terms.some(t=>!validRows(t.rows))||!validRows(s.update?.direct)||!validRows(s.update?.oldResidual))
    fail('Every retained term requires all three exact complex components.');
  const increment=s.waves.map(({m,velocity,pressure})=>({m,velocity,pressure})),
    fresh=exactAngularResidualUpdate(G,{geometry:s.geometry,phase:s.input.phase,k:s.input.k,previous:s.previous,
      increment,oldFlatResidual:s.input.oldFlatResidual}),direct=difference(fresh.direct,fresh.oldResidual),
    retained=sum(s.terms.flatMap(r=>r.rows)),modes=[...new Set([...direct,...retained].map(r=>r.m))].sort((a,b)=>a-b),
    verify=createQuadraticSourceVerifier(G,{maxTerms,maxProducts}),checks=[];
  for(const m of modes)for(let component=0;component<3;component++)for(const part of parts){
    const left=at(direct,m)[component][part],right=at(retained,m)[component][part],expression=G.sub(left,right);
    checks.push({id:'primary-complete-remainder-'+m+'-'+component+'-'+part,m,component,part,left,right,...verify(expression)});
  }
  return {schema:'MathScope.N6.ExactPrimaryResidualTermVerification/1',modes,terms:s.terms.map(t=>t.id),checks,
    pass:checks.every(x=>x.pass),completeDirectResidualRecomputed:true,storedDefectTrusted:false,
    wholeSourceScalarBodiesRetained:true,sourceAuthenticated:false,allOrderClassCertified:false,
    maximumProducts:checks.at(-1)?.productsUsed??0,maxProducts,maxTerms};
}
