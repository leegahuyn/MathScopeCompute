/** Exact finite angular harmonic algebra for the original cylindrical PDE.
 *
 * A row is the full complex coefficient of exp(i*k*m*Phi), including the
 * curl remainder and its own pressure. Every m+n product is retained.
 * These generic operators confer no original-source authority on operands.
 */
const fail=(message,code='INVALID_INPUT')=>{throw Object.assign(new Error(message),{code});};
const MAX_MODES=257;
const node=(G,x)=>Number.isSafeInteger(x)&&!!G.nodes[x];
const keys=(input,allowed)=>input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).every(k=>allowed.includes(k));
const degree=m=>Number.isSafeInteger(m);
const sorted=M=>[...M].sort(([a],[b])=>a-b);

export function exactHarmonicComplexAlgebra(G){
  const value=(real=G.zero,imaginary=G.zero)=>({real,imaginary}),zero=value(),
    check=x=>keys(x,['real','imaginary'])&&node(G,x.real)&&node(G,x.imaginary),
    add=(...xs)=>value(G.add(...xs.map(x=>x.real)),G.add(...xs.map(x=>x.imaginary))),
    scale=(a,x)=>value(G.mul(a,x.real),G.mul(a,x.imaginary)),neg=x=>scale(G.q(-1),x),
    sub=(a,b)=>add(a,neg(b)),conjugate=x=>value(x.real,G.neg(x.imaginary)),
    mul=(a,b)=>value(G.sub(G.mul(a.real,b.real),G.mul(a.imaginary,b.imaginary)),G.add(G.mul(a.real,b.imaginary),G.mul(a.imaginary,b.real))),
    imaginary=(a,x)=>value(G.neg(G.mul(a,x.imaginary)),G.mul(a,x.real)),
    derivative=(x,D)=>value(D(x.real),D(x.imaginary));
  return {value,zero,check,add,scale,neg,sub,conjugate,mul,imaginary,derivative};
}

function scalarSeries(G,rows,theta){
  const C=exactHarmonicComplexAlgebra(G),out=new Map();
  if(!Array.isArray(rows)||rows.length>MAX_MODES)fail('Use a complete finite angular inventory of at most257 modes; exceeding the budget is an error, never a truncation.','RESOURCE_LIMIT');
  for(const row of rows){
    if(!keys(row,['m','value'])||!degree(row.m)||out.has(row.m)||!C.check(row.value)||
      theta!==undefined&&[row.value.real,row.value.imaginary].some(x=>G.freeCoordinates(x).has(theta)))
      fail('Every angular row needs a distinct exact integer m and an angular-independent full complex coefficient.');
    out.set(row.m,row.value);
  }
  return out;
}

function seriesAlgebra(G){
  const C=exactHarmonicComplexAlgebra(G),zero=new Map(),get=(M,m)=>M.get(m)??C.zero,
    map=(M,fn)=>new Map(sorted(M).map(([m,x])=>[m,fn(x,m)])),
    add=(...Ms)=>{
      const modes=new Set(Ms.flatMap(M=>[...M.keys()]));if(modes.size>MAX_MODES)fail('The complete angular sum exceeds the finite resource budget.','RESOURCE_LIMIT');
      return new Map([...modes].sort((a,b)=>a-b).map(m=>[m,C.add(...Ms.map(M=>get(M,m)))]));
    },scale=(a,M)=>map(M,x=>C.scale(a,x)),neg=M=>scale(G.q(-1),M),sub=(a,b)=>add(a,neg(b)),
    mul=(a,b)=>{
      const out=new Map();for(const [m,x]of a)for(const [n,y]of b){const next=m+n;
        if(!degree(next))fail('The exact output harmonic exceeds the safe integer inventory; no generated mode is dropped.','RESOURCE_LIMIT');
        out.set(next,C.add(get(out,next),C.mul(x,y)));
        if(out.size>MAX_MODES)fail('Every convolution product is required; the full output exceeds the finite mode budget.','RESOURCE_LIMIT');
      }return new Map(sorted(out));
    },rows=M=>sorted(M).map(([m,value])=>({m,value}));
  return {C,zero,get,map,add,scale,neg,sub,mul,rows};
}

export function completeAngularHarmonicConvolution(G,input={}){
  if(!keys(input,['left','right']))fail('Supply the complete left and right finite mode lists without a discard threshold.');
  const left=scalarSeries(G,input.left),right=scalarSeries(G,input.right),S=seriesAlgebra(G),out=S.mul(left,right),
    expected=[...new Set([...left.keys()].flatMap(m=>[...right.keys()].map(n=>m+n)))].sort((a,b)=>a-b);
  return {rows:S.rows(out),inputModes:[...left.keys()],otherInputModes:[...right.keys()],generatedModes:expected,
    productsComputed:left.size*right.size,maximumHarmonic:Math.max(0,...expected.map(Math.abs)),
    discardedModes:[],discardedModeBound:G.zero,discardedModeBoundReason:'The entire finite convolution is present; this says nothing about an infinite input tail.',
    infiniteInputTailCertified:false,sourceAuthenticated:false};
}

/** Fixed-label physical derivatives. Both source chart representations use
 * exactly the normalized time/space factors in (6.6). The caller of this
 * generic kernel remains responsible for source binding and flat joins.
 */
export function originalCylindricalDifferentialOperators(G,geometry){
  const {R,Z,T,theta,epsilon,radialFast:a}=geometry??{},common=Array.isArray(geometry?.Y),
    coordinates=common?[R,Z,T,theta,...geometry.Y]:[R,Z,T,theta,geometry?.xi,geometry?.v];
  if(new Set(coordinates).size!==coordinates.length||coordinates.some(x=>G.nodes[x]?.op!=='coordinate')||![epsilon,a].every(x=>node(G,x)))
    fail('Use all independent slow, angular and fast coordinates with the exact original epsilon and radial fast coefficient.');
  let Dr,Dz,time,L=null,N=null;
  if(common){
    const {Y,vr,vt,ci}=geometry;
    if(Y.length!==2||!Array.isArray(vr)||vr.length!==2||!Array.isArray(vt)||vt.length!==2||![...vr,...vt,ci].every(x=>node(G,x)))
      fail('The common-torus derivative requires both original directions and its exact time coefficient.');
    L=x=>G.add(...Y.map((y,j)=>G.mul(vr[j],G.derivative(x,y))));
    N=x=>G.add(...Y.map((y,j)=>G.mul(vt[j],G.derivative(x,y))));
    Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)));
    time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)));
  }else{
    Dr=x=>G.add(G.derivative(x,R),G.mul(a,G.derivative(x,geometry.xi)));
    time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.derivative(x,geometry.v));
  }
  Dz=x=>G.mul(epsilon,G.derivative(x,Z));
  const thetaDerivative=x=>G.derivative(x,theta),angular=x=>G.div(thetaDerivative(x),R),
    lap=x=>G.add(Dr(Dr(x)),G.div(Dr(x),R),Dz(Dz(x)),G.div(thetaDerivative(thetaDerivative(x)),G.pow(R,2)));
  return {R,Z,T,theta,epsilon,Dr,Dz,time,thetaDerivative,angular,lap,L,N,coordinates};
}

function vectorInput(G,rows,theta){
  if(!Array.isArray(rows)||!rows.length||rows.length>MAX_MODES)fail('A complete finite velocity-pressure inventory is required.','RESOURCE_LIMIT');
  const C=exactHarmonicComplexAlgebra(G),seen=new Set();
  for(const row of rows){
    if(!keys(row,['m','velocity','pressure'])||!degree(row.m)||seen.has(row.m)||!Array.isArray(row.velocity)||row.velocity.length!==3||
      ![...row.velocity,row.pressure].every(C.check)||[...row.velocity,row.pressure].some(x=>[x.real,x.imaginary].some(id=>G.freeCoordinates(id).has(theta))))
      fail('Retain all three complete angular-independent velocity coefficients and explicit physical pressure at every distinct m.');
    seen.add(row.m);
  }
  return {velocity:[0,1,2].map(j=>new Map(rows.map(row=>[row.m,row.velocity[j]]))),pressure:new Map(rows.map(row=>[row.m,row.pressure]))};
}

function harmonicCalculus(G,geometry,phase,k){
  if(!node(G,phase)||!node(G,k))fail('Supply the complete original real phase and its fixed angular multiplier.');
  const D=originalCylindricalDifferentialOperators(G,geometry),S=seriesAlgebra(G),{C}=S;
  if(D.coordinates.some(x=>G.derivative(k,x)!==G.zero))fail('Freeze the actual integer carrier before taking physical derivatives.');
  const phaseGradient=[D.Dr(phase),D.angular(phase),D.Dz(phase)],phaseTime=D.time(phase),phaseAngular=D.thetaDerivative(phase),
    derivatives=[...phaseGradient,phaseTime,phaseAngular];
  if(derivatives.some(x=>G.freeCoordinates(x).has(D.theta)))fail('A finite harmonic carrier must have an angular-affine phase with angular-independent physical derivatives.');
  const apply=(M,derivative,phaseDerivative)=>S.map(M,(x,m)=>C.add(C.derivative(x,derivative),C.imaginary(G.mul(k,G.q(m),phaseDerivative),x))),
    Dr=M=>apply(M,D.Dr,phaseGradient[0]),Dz=M=>apply(M,D.Dz,phaseGradient[2]),
    angular=M=>S.map(M,(x,m)=>C.imaginary(G.mul(k,G.q(m),phaseGradient[1]),x)),
    thetaDerivative=M=>S.map(M,(x,m)=>C.imaginary(G.mul(k,G.q(m),phaseAngular),x)),time=M=>apply(M,D.time,phaseTime),
    lap=M=>S.add(Dr(Dr(M)),S.scale(G.inv(D.R),Dr(M)),Dz(Dz(M)),S.scale(G.inv(G.pow(D.R,2)),thetaDerivative(thetaDerivative(M))));
  return {D,S,C,Dr,Dz,angular,thetaDerivative,time,lap,phaseGradient,phaseTime,phaseAngular};
}

function vectorRows(S,V){
  const modes=[...new Set(V.flatMap(M=>[...M.keys()]))].sort((a,b)=>a-b);
  return modes.map(m=>({m,value:V.map(M=>S.get(M,m))}));
}

function harmonicComponents(G,H,U,P){
  const {S,D,Dr,Dz,angular,thetaDerivative,time,lap}=H,{R,epsilon}=D,invR=G.inv(R),invR2=G.pow(invR,2),q=n=>G.q(n),
    divergence=U=>S.add(Dr(U[0]),S.scale(invR,U[0]),angular(U[1]),Dz(U[2])),
    gradient=P=>[Dr(P),angular(P),Dz(P)],
    vectorLaplacian=U=>[
      S.sub(S.sub(lap(U[0]),S.scale(invR2,U[0])),S.scale(G.mul(q(2),invR2),thetaDerivative(U[1]))),
      S.add(S.sub(lap(U[1]),S.scale(invR2,U[1])),S.scale(G.mul(q(2),invR2),thetaDerivative(U[0]))),lap(U[2])],
    linear=(U,P)=>{const L=vectorLaplacian(U),grad=gradient(P);return U.map((x,j)=>S.add(time(x),S.neg(S.scale(epsilon,L[j])),grad[j]));},
    // div(a tensor b), with a as the transported vector and b as the
    // advecting vector. The nonsymmetric theta connection keeps both
    // a_theta*b_r and a_r*b_theta until the two factors coincide.
    tensorDivergence=(a,b)=>{
      const T=a.map(x=>b.map(y=>S.mul(x,y))),out=T.map(row=>S.add(Dr(row[0]),S.scale(invR,row[0]),angular(row[1]),Dz(row[2])));
      out[0]=S.sub(out[0],S.scale(invR,T[1][1]));
      out[1]=S.add(out[1],S.scale(invR,T[0][1]));return out;
    },
    advection=(a,b)=>{
      const out=a.map(x=>S.add(S.mul(b[0],Dr(x)),S.mul(b[1],angular(x)),S.mul(b[2],Dz(x))));
      out[0]=S.sub(out[0],S.scale(invR,S.mul(a[1],b[1])));
      out[1]=S.add(out[1],S.scale(invR,S.mul(a[0],b[1])));return out;
    },base=linear(U,P),quadratic=tensorDivergence(U,U),advective=advection(U,U);
  return {linear,gradient,divergence,tensorDivergence,advection,
    result:{linear:base,quadratic,conservative:base.map((x,j)=>S.add(x,quadratic[j])),
      advective:base.map((x,j)=>S.add(x,advective[j])),divergence:divergence(U),vectorLaplacian:vectorLaplacian(U),pressureGradient:gradient(P)}};
}

export function exactAngularHarmonicPDE(G,input={}){
  if(!keys(input,['geometry','phase','k','rows']))fail('Supply only the exact geometry, phase, fixed k and every velocity-pressure row.');
  const H=harmonicCalculus(G,input.geometry,input.phase,input.k),state=vectorInput(G,input.rows,H.D.theta),K=harmonicComponents(G,H,state.velocity,state.pressure),r=K.result,S=H.S,
    modes=[...new Set(r.conservative.flatMap(M=>[...M.keys()]))].sort((a,b)=>a-b);
  return {schema:'MathScope.N6.ExactFiniteAngularPDE/1',inputModes:input.rows.map(r=>r.m),generatedModes:modes,
    maximumHarmonic:Math.max(0,...modes.map(Math.abs)),conservativeResidual:vectorRows(S,r.conservative),advectiveResidual:vectorRows(S,r.advective),
    divergence:S.rows(r.divergence),linear:vectorRows(S,r.linear),quadratic:vectorRows(S,r.quadratic),
    vectorLaplacian:vectorRows(S,r.vectorLaplacian),pressureGradient:vectorRows(S,r.pressureGradient),
    phase:{value:input.phase,k:input.k,gradient:H.phaseGradient,time:H.phaseTime,angular:H.phaseAngular},
    discardedModes:[],finiteConvolutionComplete:true,incompressibilityAssumed:false,
    conservativeEqualsAdvectivePreciselyWhen:'div(u)=0; their full difference is u*div(u).',
    physicalResidualScale:'Q^(-2*A-1/2)',viscosity:input.geometry.epsilon,
    originalSourceAuthenticated:false,allCorrectionStagesConstructed:false,infiniteSeriesTailCertified:false};
}

/** N6-02 exact finite update. The old flat residual has a named retained
 * slot; subtracting it from the computed old residual only defines the
 * regular part, and the same exact roots are then added back. No flatness
 * bound or numerical zero is inferred from a user-supplied expression.
 */
export function exactAngularResidualUpdate(G,input={}){
  if(!keys(input,['geometry','phase','k','previous','increment','oldFlatResidual'])||!Array.isArray(input.oldFlatResidual))fail('An update needs the complete previous state, increment pressure and explicit retained old flat residual.');
  const H=harmonicCalculus(G,input.geometry,input.phase,input.k),{S,C}=H,old=vectorInput(G,input.previous,H.D.theta),inc=vectorInput(G,input.increment,H.D.theta),
    updated={velocity:old.velocity.map((M,j)=>S.add(M,inc.velocity[j])),pressure:S.add(old.pressure,inc.pressure)},
    kernel=harmonicComponents(G,H,old.velocity,old.pressure),next=harmonicComponents(G,H,updated.velocity,updated.pressure),
    linear=kernel.linear(inc.velocity,inc.pressure),left=kernel.tensorDivergence(inc.velocity,old.velocity),right=kernel.tensorDivergence(old.velocity,inc.velocity),
    quadratic=kernel.tensorDivergence(inc.velocity,inc.velocity),flat=[0,1,2].map(j=>scalarSeries(G,(input.oldFlatResidual??[]).map(row=>{
      if(!keys(row,['m','value'])||!Array.isArray(row.value)||row.value.length!==3||!row.value.every(C.check))fail('The old flat residual needs all three exact components.');
      return {m:row.m,value:row.value[j]};
    }),H.D.theta)),
    oldRegular=kernel.result.conservative.map((M,j)=>S.sub(M,flat[j])),
    linearized=linear.map((M,j)=>S.add(M,left[j],right[j])),
    decomposed=oldRegular.map((M,j)=>S.add(M,flat[j],linearized[j],quadratic[j])),
    defect=next.result.conservative.map((M,j)=>S.sub(M,decomposed[j]));
  return {schema:'MathScope.N6.ExactFiniteAngularUpdate/1',
    updated:vectorRows(S,updated.velocity).map(row=>({m:row.m,velocity:row.value,pressure:S.get(updated.pressure,row.m)})),
    direct:vectorRows(S,next.result.conservative),decomposed:vectorRows(S,decomposed),defect:vectorRows(S,defect),
    oldResidual:vectorRows(S,kernel.result.conservative),oldRegularResidual:vectorRows(S,oldRegular),oldFlatResidual:vectorRows(S,flat),
    linearized:vectorRows(S,linearized),newQuadraticRemainder:vectorRows(S,quadratic),
    previousDivergence:S.rows(kernel.result.divergence),incrementDivergence:S.rows(kernel.divergence(inc.velocity)),
    updatedPressure:S.rows(updated.pressure),pressureRefreshedFromIncrement:true,oldFlatResidualRetained:true,
    newQuadraticRemainderRetained:true,discardedModes:[],sourceAuthenticated:false,
    exactEqualityRequires:'Execute the emitted exact coefficient identity; no floating-point tolerance or omitted field is substituted.',
    flatResidualClassBoundCertified:false,allCorrectionStagesConstructed:false};
}

/** Independent real-space construction: reconstruct first, then apply the
 * physical PDE without harmonic convolution or a diagonal Fourier rule.
 */
export function reconstructAngularHarmonics(G,input={}){
  if(!keys(input,['geometry','phase','k','rows']))fail('Supply the complete finite complex field to reconstruct.');
  const D=originalCylindricalDifferentialOperators(G,input.geometry),state=vectorInput(G,input.rows,D.theta),S=seriesAlgebra(G),
    argumentsByMode=input.rows.map(({m})=>({m,argument:G.mul(input.k,G.q(m),input.phase)})),
    reconstruct=M=>G.add(...argumentsByMode.map(({m,argument})=>{const x=S.get(M,m);return G.sub(G.mul(x.real,G.cosine(argument)),G.mul(x.imaginary,G.sine(argument)));}));
  return {velocity:state.velocity.map(reconstruct),pressure:reconstruct(state.pressure),argumentsByMode,
    convention:'Real part of the full sum of complex coefficients; a physical real field uses conjugate pairs including the1/2 factors.',sourceAuthenticated:false};
}

export function exactRealCylindricalPDE(G,input={}){
  if(!keys(input,['geometry','velocity','pressure'])||!Array.isArray(input.velocity)||input.velocity.length!==3||![...input.velocity,input.pressure].every(x=>node(G,x)))
    fail('Retain all three real cylindrical velocity components and the physical pressure.');
  const D=originalCylindricalDifferentialOperators(G,input.geometry),{Dr,Dz,time,angular,thetaDerivative,lap,R,epsilon}=D,
    [r,t,z]=input.velocity,q=n=>G.q(n),divergence=G.add(Dr(r),G.div(r,R),angular(t),Dz(z)),
    vectorLaplacian=[G.sub(G.sub(lap(r),G.div(r,G.pow(R,2))),G.div(G.mul(q(2),thetaDerivative(t)),G.pow(R,2))),
      G.add(G.sub(lap(t),G.div(t,G.pow(R,2))),G.div(G.mul(q(2),thetaDerivative(r)),G.pow(R,2))),lap(z)],
    pressureGradient=[Dr(input.pressure),angular(input.pressure),Dz(input.pressure)],
    advection=input.velocity.map(x=>G.add(G.mul(r,Dr(x)),G.mul(t,angular(x)),G.mul(z,Dz(x))));
  advection[0]=G.sub(advection[0],G.div(G.pow(t,2),R));advection[1]=G.add(advection[1],G.div(G.mul(r,t),R));
  const advectiveResidual=input.velocity.map((x,j)=>G.add(time(x),advection[j],G.neg(G.mul(epsilon,vectorLaplacian[j])),pressureGradient[j])),
    conservativeResidual=advectiveResidual.map((x,j)=>G.add(x,G.mul(input.velocity[j],divergence)));
  return {advectiveResidual,conservativeResidual,divergence,vectorLaplacian,pressureGradient,
    sourceAuthenticated:false,angularConvolutionUsed:false,allCylindricalConnectionsRetained:true};
}
