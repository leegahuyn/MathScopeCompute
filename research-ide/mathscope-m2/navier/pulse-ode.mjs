/**
 * Frozen-jet projected pulse ODE in a parallel orthonormal tangent frame.
 *
 * n(v)=(a(v),b,c), a affine, q=sqrt(b²+c²)>0, r=|n|.
 * E1=(q/r,-ab/(qr),-ac/(qr)), E2=(0,c/q,-b/q).
 * EᵀE=I, Eᵀn=0, EᵀE'=0 and E1'=-q*a'*n/r³.
 * Thus t'= -K t + n(n·Kt-n'·t)/|n|² - d(v)t is exactly
 * y'= -(EᵀKE)y after t=exp(-∫d) E y. The large scalar damping is
 * integrated as an affine-normal polynomial, not stepped backwards by RK4.
 * No a-posteriori rigorous solution-error bound is asserted.
 */
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>Math.hypot(...a);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const scale=(a,s)=>a.map(v=>v*s);
const matvec=(M,x)=>M.map(r=>dot(r,x));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

/** Orthogonal change of coordinates handles the full affine normal in (7.4). */
export function integrateAffineTangentPulse(options){
  const {normalAtMidpoint:n,normalDerivative:nd,matrix,initial}=options;
  if(!Array.isArray(nd)||nd.length!==3||!nd.every(Number.isFinite))throw Error('A finite three-component affine normal derivative is required.');
  if(nd[1]===0&&nd[2]===0)return integrateTangentPulse(options);
  if(!Array.isArray(n)||n.length!==3||!n.every(Number.isFinite)||!Array.isArray(initial)||initial.length!==3||!initial.every(Number.isFinite))throw Error('Finite three-component normal and polarization are required.');
  const ndNorm=norm(nd),e0=scale(nd,1/ndNorm),longitudinal=dot(n,e0),transverse=add(n,scale(e0,-longitudinal)),q=norm(transverse);
  if(!(q>1e-14*norm(n)))throw Error('The affine normal line approaches zero; the installed frame needs a positive transverse gap.');
  const e1=scale(transverse,1/q),e2=cross(e0,e1),basis=[e0,e1,e2],to=x=>basis.map(e=>dot(e,x)),from=x=>basis.reduce((s,e,i)=>add(s,scale(e,x[i])),[0,0,0]);
  const transformedMatrix=basis.map(e=>basis.map(f=>dot(e,matvec(matrix,f))));
  const output=integrateTangentPulse({...options,matrix:transformedMatrix,normalAtMidpoint:[longitudinal,q,0],normalDerivative:[ndNorm,0,0],initial:to(initial)});
  return {...output,rows:output.rows.map(row=>({...row,t:from(row.t)})),method:{...output.method,name:'AFFINE_NORMAL_ORTHOGONAL_ROTATION_AND_PARALLEL_TANGENT_RK4',originalNormal:'n(midpoint)+(v-midpoint)*nPrime with all three source components retained',fixedOrthogonalBasis:basis,retainsAxialNormalDerivative:true,rotationIsParameterFree:true}};
}

export function integrateTangentPulse({matrix,normalAtMidpoint,normalDerivative,midpoint,length,steps,dampingCoefficient,initial,checkCancelled}){
  const vector3=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
  if(!Array.isArray(matrix)||matrix.length!==3||!matrix.every(vector3))throw Error('A finite 3 by 3 shear matrix is required.');
  if(!vector3(normalAtMidpoint)||!vector3(normalDerivative)||normalDerivative[1]!==0||normalDerivative[2]!==0)throw Error('This tangent-frame solver requires an affine first normal component and fixed transverse components.');
  if(!vector3(initial))throw Error('A finite three-component initial polarization is required.');
  const[a0,b,c]=normalAtMidpoint,ap=normalDerivative[0],q=Math.hypot(b,c);
  if(!(q>0&&Number.isFinite(q)))throw Error('The transverse normal magnitude must be positive.');
  if(!Number.isSafeInteger(steps)||steps<1||!Number.isFinite(length)||length<=0||!Number.isFinite(midpoint)||!(dampingCoefficient>=0&&Number.isFinite(dampingCoefficient)))throw Error('Invalid bounded tangent-frame integration parameters.');
  const normal=v=>[a0+ap*(v-midpoint),b,c];
  function frame(v){const n=normal(v),r=norm(n);return {n,r,E:[[q/r,-n[0]*b/(q*r),-n[0]*c/(q*r)],[0,c/q,-b/q]],derivatives:[scale(n,-q*ap/(r*r*r)),[0,0,0]]};}
  const reconstruct=(E,y)=>add(scale(E[0],y[0]),scale(E[1],y[1]));
  const f0=frame(midpoint),initialNorm=norm(initial),initialNormalError=Math.abs(dot(f0.n,initial))/(f0.r*initialNorm);
  if(!(initialNorm>0&&Number.isFinite(initialNorm))||initialNormalError>1e-10)throw Error('Initial pulse polarization must already lie in the specified tangent plane.');
  const first=[dot(f0.E[0],initial)/initialNorm,dot(f0.E[1],initial)/initialNorm],firstNorm=norm(first),y0=scale(first,1/firstNorm);
  function derivative(v,y){const E=frame(v).E,Ky=matvec(matrix,reconstruct(E,y));return E.map(e=>-dot(e,Ky));}
  function dampingPrimitive(v){const s=v-midpoint;return dampingCoefficient*((a0*a0+q*q)*s+a0*ap*s*s+ap*ap*s*s*s/3);}
  const rows=[];
  function save(v,y,logUndampedNorm){const f=frame(v),t=reconstruct(f.E,y),dampingIntegral=dampingPrimitive(v),logScale=Math.log(initialNorm)+logUndampedNorm-dampingIntegral;if(!Number.isFinite(logScale))throw Error('Pulse logarithmic amplitude exceeded binary64.');rows.push({v,t,logScale,tangentCoordinates:y.slice(),logUndampedNorm,dampingIntegral});}
  save(midpoint,y0,0);
  for(const direction of[-1,1]){
    const h=direction*length/(2*steps);let v=midpoint,y=y0.slice(),logUndampedNorm=0;
    for(let j=1;j<=steps;j++){
      checkCancelled?.();
      const k1=derivative(v,y),k2=derivative(v+h/2,add(y,scale(k1,h/2))),k3=derivative(v+h/2,add(y,scale(k2,h/2))),k4=derivative(v+h,add(y,scale(k3,h)));
      const next=add(y,scale(add(add(k1,scale(add(k2,k3),2)),k4),h/6)),magnitude=norm(next);
      if(!(magnitude>0&&Number.isFinite(magnitude)))throw Error('Tangent RK4 step exceeded finite normalized arithmetic; refine the step count.');
      y=scale(next,1/magnitude);logUndampedNorm+=Math.log(magnitude);v=midpoint+j*h;save(v,y,logUndampedNorm);
    }
  }
  rows.sort((a,b)=>a.v-b.v);
  let normalResidual=0,reconstructionResidual=0,unitResidual=0;
  for(const row of rows){
    const f=frame(row.v),t=row.t,kt=matvec(matrix,t),damping=dampingCoefficient*f.r*f.r;
    normalResidual=Math.max(normalResidual,Math.abs(dot(f.n,t))/f.r);unitResidual=Math.max(unitResidual,Math.abs(dot(t,t)-1));
    const cartesian=add(add(scale(kt,-1),scale(f.n,(dot(f.n,kt)-dot(normalDerivative,t))/(f.r*f.r))),scale(t,-damping));
    const reconstructed=add(add(reconstruct(f.E,derivative(row.v,row.tangentCoordinates)),reconstruct(f.derivatives,row.tangentCoordinates)),scale(t,-damping));
    reconstructionResidual=Math.max(reconstructionResidual,norm(add(cartesian,scale(reconstructed,-1)))/(1+norm(cartesian)));
  }
  return {rows,diagnostics:{maxRelativeOrthogonality:normalResidual,maxUnitNormResidual:unitResidual,maxReconstructedRhsRelativeResidual:reconstructionResidual,initialNormalError},method:{name:'PARALLEL_TANGENT_FRAME_RK4_WITH_EXACT_SCALAR_DAMPING',n:'(a0+aPrime*(v-midpoint),b,c)',frame:'E1=(q/r,-a*b/(q*r),-a*c/(q*r)); E2=(0,c/q,-b/q)',tangentEquation:'yPrime=-(transpose(E)*K*E)*y',scalarDamping:'d(v)=epsilon*k^2*|n(v)|^2',dampingIntegral:'epsilon*k^2*((a0^2+q^2)*s+a0*aPrime*s^2+aPrime^2*s^3/3)',dampingIntegration:'Polynomial antiderivative evaluated in binary64; no RK stepping of scalar damping',normalConstraint:'Reconstruction from an orthonormal tangent frame, not an after-the-fact modification of the prescribed initial datum',stepsPerHalf:steps,fullSteps:2*steps,rigorousSolutionErrorBound:null}};
}
