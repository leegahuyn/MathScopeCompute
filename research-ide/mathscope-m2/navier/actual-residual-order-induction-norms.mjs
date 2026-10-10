/** Source-bound ordinary mixed-jet norms of the completed coefficient
 * prefix.  The recurrences are well founded in (order, radial derivative).
 * A finite source norm is never accepted as a request parameter.
 */
import {assertActualOrderInduction} from './actual-residual-order-induction-source.mjs';
import {sourceAllOrderCutoffJets} from './actual-residual-order-induction-kernels.mjs';
import {actualLeadingAllOrderJets} from './actual-leading-all-order-jets.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const sealedNorms=new WeakMap();

/** Positive ordinary-derivative calculus. Multiplication executes every
 * binomial Leibniz term; differentiation shifts the requested derivative.
 * The underlying functions are bounds of actual operands, not formal
 * replacements for those operands in the coefficient equation.
 */
export function actualNormCalculus(G){
  const q=(n,d=1)=>G.q(n,d),cacheFunction=(body,label='')=>{const cache=new Map();return {label,get(r=0,m=0){if(!Number.isSafeInteger(r)||r<0||!Number.isSafeInteger(m)||m<0)fail('INVALID_INPUT','Use ordinary nonnegative derivative orders.');const k=r+':'+m;if(!cache.has(k))cache.set(k,body(r,m));return cache.get(k);}};};
  const constant=v=>cacheFunction((r,m)=>r||m?G.zero:v,'constant');
  const add=(...fs)=>cacheFunction((r,m)=>G.add(...fs.map(f=>f.get(r,m))),'sum');
  const multiply2=(f,g)=>cacheFunction((r,m)=>{
    const terms=[];for(let a=0;a<=r;a++)for(let b=0;b<=m;b++)terms.push(G.mul(q(choose(r,a)*choose(m,b)),f.get(a,b),g.get(r-a,m-b)));
    return G.add(...terms);
  },'Leibniz product');
  const mul=(...fs)=>fs.reduce(multiply2,constant(G.one));
  const scale=(s,f)=>mul(constant(s),f),dx=(f,k=1)=>cacheFunction((r,m)=>f.get(r+k,m),'X derivative'),de=(f,k=1)=>cacheFunction((r,m)=>f.get(r,m+k),'eta derivative');
  return {fn:cacheFunction,constant,add,mul,scale,dx,de};
}

function importPositiveProgram(G,program,root){
  if(!program||!Array.isArray(program.nodes)||!program.nodes[root])fail('INVALID_SOURCE_CONSTRUCTION','The actual leading producer did not supply its norm body.');
  const map=new Map(),copy=id=>{if(map.has(id))return map.get(id);const n=program.nodes[id];let out;
    if(n.op==='rational')out=G.q(...n.args.map(BigInt));else if(n.op==='source_parameter')out=G.parameter(n.args[0]);
    else if(n.op==='add')out=G.add(...n.args.map(copy));else if(n.op==='multiply')out=G.mul(...n.args.map(copy));else if(n.op==='inverse')out=G.inv(copy(n.args[0]));
    else if(n.op==='integer_power')out=G.pow(copy(n.args[0]),n.args[1]);else if(n.op==='exp')out=G.exp(copy(n.args[0]));else if(n.op==='log_positive')out=G.log(copy(n.args[0]));else if(n.op==='sqrt_positive')out=G.sqrt(copy(n.args[0]));
    else if(n.op==='maximum')out=G.maximum(...n.args.map(copy));else fail('INVALID_SOURCE_CONSTRUCTION','Unknown leading norm operation '+n.op);
    map.set(id,out);return out;
  };return copy(root);
}

export function attachActualInductionNorms(prepared,{derivativeOrder=2,throughOrder=prepared?.order}={},context={}){
  assertActualOrderInduction(prepared);
  if(!Number.isSafeInteger(derivativeOrder)||derivativeOrder<0)fail('INVALID_INPUT','Use a finite mixed derivative order.');
  if(!Number.isSafeInteger(throughOrder)||throughOrder<1||throughOrder>prepared.order)fail('INVALID_INPUT','The requested norm prefix must already have its actual coefficient tuples.');
  const G=prepared.G,{bootstrap,records}=prepared,order=throughOrder,{X,eta}=bootstrap.constants,q=(n,d=1)=>G.q(n,d),a=actualNormCalculus(G),{fn,constant:C,add,mul,scale,dx,de}=a;
  const requestedRadial=derivativeOrder+2*order+4,requestedEta=2*derivativeOrder+6*order+8;
  const leading=actualLeadingAllOrderJets({radialOrder:requestedRadial,etaOrder:requestedEta},context);
  if(!leading.pass||leading.profileId!==prepared.program.profileId||leading.parameterExpressionSHA256!==prepared.program.parameterExpressionSHA256||leading.derivativeConvention!=='ordinary physical X and ordinary eta')fail('INVALID_SOURCE_CONSTRUCTION','The actual leading mixed-jet producer differs from the completed source.');
  const leadingURoot=importPositiveProgram(G,leading.normProgram,leading.bounds.U0.root),leadingFRoot=importPositiveProgram(G,leading.normProgram,leading.bounds.F0inner.root),leadingFActiveRoot=leading.bounds.F0active?importPositiveProgram(G,leading.normProgram,leading.bounds.F0active.root):null;
  const leadingBound=root=>fn((r,m)=>{if(r>requestedRadial||m>requestedEta)fail('RESOURCE_LIMIT','The leading ordinary-jet demand exceeded the generated rectangle; no top derivative is set to zero.');return root;});
  const leadU=leadingBound(leadingURoot),leadF=leadingBound(leadingFRoot),leadFActive=leadingFActiveRoot===null?null:leadingBound(leadingFActiveRoot),Lambda=G.parameter('Lambda'),h=G.parameter('h'),Xa=G.parameter('Xa'),t1=G.parameter('t1'),{Xplus,Xb,X0,Rbase,ef}=bootstrap.orderOne;
  const Xlo=G.div(Xa,q(2)),Xhi=G.mul(q(2),Xb),xInner=fn((r,m)=>m?G.zero:r===0?G.one:r===1?G.one:G.zero),xGlobal=fn((r,m)=>m?G.zero:r===0?Xplus:r===1?G.one:G.zero);
  const etaF=fn((r,m)=>r?G.zero:m===0?q(33,32):m===1?G.one:G.zero),dF=fn((r,m)=>r?G.zero:m===0?q(3):m===1?q(3):m===2?q(2):G.zero);
  const invL=fn((r,m)=>r?G.zero:G.mul(q(2n*factorial(m)*8n**BigInt(m)),G.one)),D=C(G.one),A=C(G.one),exponent=n=>C(G.add(q(2),G.mul(q(2*n),h)));
  const Z=(f,n,x)=>mul(invL,add(scale(q(2),mul(etaF,exponent(n),f)),scale(q(2),mul(etaF,x,dx(f))),mul(dF,de(f))));
  const T=(f,n,x)=>mul(invL,add(mul(exponent(n),f),mul(D,etaF,de(f)),mul(x,dx(f))));
  const regularV=(U,n)=>{
    const avg=fn((r,m)=>G.div(U.get(r,m),q(r+1)));
    return mul(invL,add(scale(q(2),mul(etaF,U)),scale(q(2),mul(etaF,C(G.add(G.one,G.mul(q(2*n),h))),avg)),mul(dF,de(avg))));
  };
  const cutoffMemo=new Map(),sourceStepMemo=new Map(),stepBound=m=>{
    if(!sourceStepMemo.has(m))sourceStepMemo.set(m,sourceAllOrderCutoffJets({order:m},context).activation.ordinaryDerivativeBounds.map(BigInt));return sourceStepMemo.get(m);
  };
  const bell=(n,derivatives)=>{
    const rows=Array.from({length:n+1},()=>Array(n+1).fill(G.zero));rows[0][0]=G.one;
    for(let r=1;r<=n;r++)for(let k=1;k<=r;k++)rows[r][k]=G.add(...Array.from({length:r-k+1},(_,i)=>G.mul(q(choose(r-1,i)),derivatives[i+1],rows[r-i-1][k-1])));
    return rows[n];
  };
  const kappa=fn((r,m)=>{
    if(m)return G.zero;if(r===0)return G.one;if(cutoffMemo.has(r))return cutoffMemo.get(r);
    const width=G.div(t1,q(64)),derivatives=Array.from({length:r+1},(_,k)=>k?G.div(q(factorial(k-1)),G.mul(width,G.pow(Xa,k))):G.zero),B=bell(r,derivatives),S=stepBound(r);
    const out=G.add(...Array.from({length:r},(_,j)=>G.mul(q(S[j+1]),B[j+1])));cutoffMemo.set(r,out);return out;
  });
  const raw={},local={},global={},average={},vel={},pi={},incoming={},alpha={},beta={},correctionF={},correctionU={};
  const fieldCache=new Map(),remember=(key,build)=>{if(!fieldCache.has(key))fieldCache.set(key,build());return fieldCache.get(key);};
  function rawField(n,field){return remember('raw'+n+field,()=>fn((r,m)=>rawBound(n,field,r,m),'actual inner '+field+n));}
  function localField(n,field){if(n===0)return field==='F'?leadF:leadU;return remember('local'+n+field,()=>mul(kappa,rawField(n,field)));}
  function globalField(n,field){if(n===0){if(field==='U')return leadU;if(leadFActive)return leadFActive;fail('INVALID_SOURCE_CONSTRUCTION','A full leading F norm must not be inferred from its inner restriction.');}return remember('global'+n+field,()=>add(localField(n,field),field==='F'?correction(n).F:correction(n).U));}
  function velocity(n,domain){return remember('v'+domain+n,()=>regularV(domain==='inner'?localField(n,'U'):globalField(n,'U'),n));}
  function omega(k,domain){return remember('omega'+domain+k,()=>{
    const x=domain==='inner'?xInner:xGlobal,getU=i=>domain==='inner'?localField(i,'U'):globalField(i,'U'),v=i=>velocity(i,domain),terms=[T(v(k),k,x),scale(q(2),add(scale(q(2),dx(v(k))),mul(x,dx(v(k),2))))];
    for(let i=0;i<=k;i++){const j=k-i;terms.push(mul(v(i),add(scale(q(1,2),v(j)),mul(x,dx(v(j))))),mul(getU(i),Z(v(j),j,x)));}
    if(k>0)terms.push(Z(Z(v(k-1),k-1,x),k-1,x));return add(...terms);
  });}
  function innerPressure(n){return remember('innerPi'+n,()=>fn((r,m)=>{
    if(r===0)return baseInner(n,0,m);
    const products=[scale(q(2),mul(leadF,rawField(n,'F'))),scale(q(1,2),omega(n-1,'inner'))];
    for(let i=1;i<n;i++)products.push(mul(localField(i,'F'),localField(n-i,'F')));
    return add(...products).get(r-1,m);
  }));}
  function baseInner(n,r,m){
    const rec=records[n],actual=rec.norm.actual,aux=rec.norm.auxiliary;
    // Cauchy in eta is used ONLY for the actual/natural Picard solution,
    // whose analytic strip and exact source norm were constructed above.
    const etaFactor=G.mul(q(factorial(m)),G.pow(G.div(q(2),actual.strip),m));
    const collar=G.mul(actual.solutionNorm,etaFactor,r?G.sqrt(Lambda):G.one);
    const core=G.mul(q(factorial(r)*factorial(m)),G.pow(Lambda,r),G.pow(G.div(q(2),aux.strip),m),aux.solutionNorm);
    return G.maximum(collar,core);
  }
  const inverseTwoX=fn((r,m)=>m?G.zero:G.mul(q(factorial(r),2),G.pow(Lambda,r+1)));
  const radialAudit=[];
  function rawBound(n,field,r,m){
    context.checkCancelled?.();if(n===0)return (field==='F'?leadF:leadU).get(r,m);
    if(r<2)return baseInner(n,r,m);
    const x=xInner,F=i=>i===n?rawField(n,'F'):localField(i,'F'),U=i=>i===n?rawField(n,'U'):localField(i,'U'),v=i=>i===n?regularV(U(n),n):velocity(i,'inner'),terms=[T(field==='F'?F(n):U(n),n,x)];
    for(let i=0;i<=n;i++){const j=n-i;if(field==='F')terms.push(mul(v(i),add(mul(x,dx(F(j))),F(j))),mul(U(i),Z(F(j),j,x)));else terms.push(mul(x,v(i),dx(U(j))),mul(U(i),Z(U(j),j,x)));}
    if(field==='F')terms.push(scale(q(4),dx(F(n))),Z(Z(F(n-1),n-1,x),n-1,x));
    else terms.push(Z(innerPressure(n),n,x),scale(q(2),dx(U(n))),Z(Z(U(n-1),n-1,x),n-1,x));
    const collar=mul(inverseTwoX,add(...terms)).get(r-2,m),aux=records[n].norm.auxiliary;
    const core=G.mul(q(factorial(r)*factorial(m)),G.pow(Lambda,r),G.pow(G.div(q(2),aux.strip),m),aux.solutionNorm),bound=G.maximum(core,collar);
    radialAudit.push({order:n,field,radialOrder:r,etaOrder:m,core,collar,bound,recurrence:'Solve the original equation for 2X*dX^2, then differentiate r-2 times; every same-order field derivative has smaller radial order.',collarAnalyticityAssumed:false});return bound;
  }
  const ef0=G.substitute(ef,eta,G.zero),inverseEf=fn((r,m)=>r||m>2?G.zero:G.div(q(2),ef0));
  const power=(v,p)=>G.exp(G.mul(p,G.log(v))),lambda=G.parameter('lambda'),R1=power(Rbase,G.sub(G.one,G.mul(q(2),lambda))),Rp=power(Rbase,G.sub(q(-2),G.mul(q(2),lambda))),Rz=power(Rbase,G.mul(q(-2),lambda));
  function momentFunctions(n){return remember('moments'+n,()=>{
    const F=localField(n,'F'),U=localField(n,'U'),x=xInner,localBodies=[U,scale(q(2),mul(x,F)),scale(q(2),mul(leadF,F)),scale(q(2),mul(x,add(mul(leadU,F),mul(U,leadF)))),scale(q(2),add(mul(leadU,U),mul(x,leadF,F)))];
    const localMom=localBodies.map(f=>fn((r,m)=>r?G.zero:f.get(0,m)));
    const lowP=[],lowI=[],lowS=[];
    for(let i=1;i<n;i++){const j=n-i;lowP.push(mul(globalField(i,'F'),globalField(j,'F')));lowI.push(scale(q(2),mul(xGlobal,globalField(i,'U'),globalField(j,'F'))));lowS.push(mul(globalField(i,'U'),globalField(j,'U')),mul(xGlobal,globalField(i,'F'),globalField(j,'F')));}
    const integrate=f=>fn((r,m)=>r?G.zero:G.mul(Xplus,f.get(0,m))),O=omega(n-1,'global');
    return [localMom[0],localMom[1],add(localMom[2],integrate(add(...lowP,scale(q(1,2),O)))),add(localMom[3],integrate(add(...lowI))),add(localMom[4],integrate(add(...lowS,scale(q(1,2),mul(xGlobal,O)))))];
  });}
  const bumpMemo=new Map(),bumpNorm=fn((r,m)=>{
    if(m)return G.zero;if(bumpMemo.has(r))return bumpMemo.get(r);const width=q(1,2048),S=stepBound(r+1);
    if(r===0){const b=G.div(q(S[1]),width);bumpMemo.set(r,b);return b;}
    const derivatives=Array.from({length:r+1},(_,k)=>k?G.div(q(4n*factorial(k)),G.mul(width,G.pow(X0,k))):G.zero),B=bell(r,derivatives),bound=G.div(G.add(...Array.from({length:r},(_,j)=>G.mul(q(S[j+2]),B[j+1]))),width);bumpMemo.set(r,bound);return bound;
  });
  const inverseIposR=fn((r,m)=>m?G.zero:G.div(q(factorial(r)),G.mul(Rbase,G.pow(X0,r))));
  function correction(n){return remember('correction'+n,()=>{
    const M=momentFunctions(n),a0=scale(G.inv(Rbase),M[0]),a1=scale(G.inv(G.mul(q(2),lambda)),add(a0,scale(G.inv(R1),mul(inverseEf,M[3]))));
    const A=scale(q(1024),add(a0,a1)),B=scale(q(1n<<24n),add(scale(G.inv(G.pow(Rbase,2)),M[1]),scale(G.inv(G.mul(q(2),Rp)),mul(inverseEf,M[2])),scale(G.inv(Rz),mul(inverseEf,M[4]))));
    const U=scale(G.div(q(2),Rbase),mul(A,bumpNorm)),F=scale(G.div(q(3),Rbase),mul(B,bumpNorm,inverseIposR));
    return {alpha:A,beta:B,U,F,moments:M,continuousInverseBounds:{U:q(1024),E:q(1n<<24n)},actualRhsSignsBoundedInAbsoluteValue:true};
  });}
  const F0pos=fn((r,m)=>{
    const exponent=G.add(q(2),G.mul(q(2),lambda));
    // F0pos=ef*R^(-2-2lambda). On Ipos R>=Rbase and
    // dX^r has factor (1+lambda)_r/X^r, <=(r+2)^r/X0^r.
    const fEta=G.mul(q(2n*factorial(m)*4n**BigInt(m)),ef0),radial=G.div(q(BigInt(r+2)**BigInt(r)),G.pow(X0,r));
    return G.mul(fEta,power(Rbase,G.neg(exponent)),radial);
  });
  function globalPressure(n){return remember('globalPi'+n,()=>fn((r,m)=>{
    const p=[scale(q(2),add(mul(leadF,localField(n,'F')),mul(F0pos,correction(n).F))),scale(q(1,2),omega(n-1,'global'))];
    for(let i=1;i<n;i++)p.push(mul(globalField(i,'F'),globalField(n-i,'F')));const f=add(...p);
    return r===0?G.mul(Xplus,f.get(0,m)):f.get(r-1,m);
  }));}
  const sqrtEnlarged=fn((r,m)=>m?G.zero:G.mul(q(factorial(r)),G.sqrt(G.mul(q(2),Xhi)),G.pow(Xlo,-r))),inverseSqrtEnlarged=fn((r,m)=>m?G.zero:G.div(q(factorial(r)),G.mul(G.sqrt(G.mul(q(2),Xlo)),G.pow(Xlo,r))));
  const normalized=[],globalRoots=[],leadingNormalized={U:[],radialBracket:[],FActive:[],FActiveDomain:{X:[G.zero,Xplus],eta:['-1','1']}};
  const leadingRadial=mul(inverseSqrtEnlarged,xGlobal,regularV(leadU,0));
  for(let r=0;r<=derivativeOrder;r++)for(let m=0;r+m<=derivativeOrder;m++){
    leadingNormalized.U.push({radialOrder:r,etaOrder:m,upper:leadU.get(r,m)});
    leadingNormalized.radialBracket.push({radialOrder:r,etaOrder:m,upper:leadingRadial.get(r,m)});
    if(leadFActive)leadingNormalized.FActive.push({radialOrder:r,etaOrder:m,upper:leadFActive.get(r,m)});
  }
  for(let n=1;n<=order;n++){
    const F=globalField(n,'F'),U=globalField(n,'U'),avg=fn((r,m)=>G.div(U.get(r,m),q(r+1))),M=mul(xGlobal,avg),v=regularV(U,n),V=mul(xGlobal,v),Pi=globalPressure(n);
    const profiles={E:mul(sqrtEnlarged,F),U,Pi,VOverR:mul(inverseSqrtEnlarged,V),StreamOverR:mul(inverseSqrtEnlarged,M),ExtraStream:scale(q(2),mul(etaF,invL,inverseSqrtEnlarged,M))},jets={};
    for(const[name,f]of Object.entries(profiles)){jets[name]=[];for(let r=0;r<=derivativeOrder;r++)for(let m=0;m+r<=derivativeOrder;m++)jets[name].push({radialOrder:r,etaOrder:m,upper:f.get(r,m)});}
    normalized.push({order:n,jets,actualSourceRoots:{F:records[n].global.F,U:records[n].global.U,Pi:records[n].global.Pi,Stream:records[n].global.M,VOverX:records[n].global.v},
      domain:{X:[Xlo,Xhi],eta:['-1','1']},derivativeConvention:'ordinary physical X and ordinary eta',sourceCoefficientReplacedByBound:false});
    const c=correction(n);globalRoots.push({order:n,U0:U.get(0,0),F0:F.get(0,0),alpha0:c.alpha.get(0,0),beta0:c.beta.get(0,0),incoming0:c.moments.map(f=>f.get(0,0))});
  }
  const roots={};for(const row of normalized)for(const[field,jets]of Object.entries(row.jets))for(const j of jets)roots['n'+row.order+'_'+field+'_X'+j.radialOrder+'_eta'+j.etaOrder]=j.upper;
  const checks={actualLeadingProducer:leading.pass,sameOriginalProfile:leading.profileId===prepared.program.profileId,allPreviousTuplesCompleted:records.every(r=>r.global.completed),
    separateActualAndAuxiliarySystems:records.slice(1).every(r=>r.raw.system!==r.auxiliary.system),actualIposInverse:bootstrap.orderOne.proof.actualContinuousEntriesRetained,
    everyNormalizedMixedJet:normalized.every(r=>Object.values(r.jets).every(j=>j.length===(derivativeOrder+1)*(derivativeOrder+2)/2)),noUserNormInput:true};
  const result={prepared,G,order,derivativeOrder,normalized,globalRoots,radialAudit,leading,leadingNormalized,roots,checks};
  result.program=G.pack(roots,{schema:'MathScope.ActualInductionNormProgram/1',order,derivativeOrder,normalized,globalRoots,radialAudit,leadingNormalized,
    leadingSource:{profileId:leading.profileId,parameterExpressionSHA256:leading.parameterExpressionSHA256,requestedRadial,requestedEta,sourceBindings:leading.sourceBindings},
    sourceNormRules:{ordinaryLeibniz:'Every binomial term is included.',rawHigherRadial:'Core Cauchy from the separately constructed auxiliary solution; collar second-order PDE recurrence in X.',
      globalMoments:'Differentiate the actual eta-dependent whole-support integrands; endpoints are eta-independent. The factor Xplus is the actual positive support length upper bound.',
      localIpos:'The actual continuous inverse is bounded by1024 and2^24. Actual tiny lambda and ef are preserved in the physical row scaling.',
      cutoff:'Every ordinary cutoff derivative comes from the original square seed and exact Bell/Leibniz recurrences. Flat endpoints share all derivatives.'},
    checks,pass:Object.values(checks).every(Boolean),scope:{actualCompletedCoefficientMixedNormsDerived:true,allRequestedNormalizedVelocityAndPressureJets:true,
      fullLeadingFOutsideInnerNotAssumed:true,actualActiveLeadingFSeparatelyBounded:leadFActive!==null,weightedStressNormsDerived:false,actualCutoffSequenceSelected:false,backgroundC2TailCertified:false,originalN506Complete:false,formalKernelProof:false}});
  sealedNorms.set(result,{prepared,G,nodeCount:G.nodes.length,prefix:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),normalized:JSON.stringify(normalized),leadingNormalized:JSON.stringify(leadingNormalized),order,derivativeOrder});return result;
}
export function assertActualInductionNorms(result){const r=sealedNorms.get(result);if(!r||r.G!==result.G||JSON.stringify(r.G.nodes.slice(0,r.nodeCount))!==r.prefix||!r.G.functionDefinitionsUnchanged(r.definitions)||JSON.stringify(result.normalized)!==r.normalized||JSON.stringify(result.leadingNormalized)!==r.leadingNormalized||result.order!==r.order||result.derivativeOrder!==r.derivativeOrder)fail('INVALID_SOURCE_CONSTRUCTION','Use unchanged source-bound coefficient norms.');assertActualOrderInduction(r.prepared);return true;}
