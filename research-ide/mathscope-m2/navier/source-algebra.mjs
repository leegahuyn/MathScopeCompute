/** Exact differential-polynomial verification of source equations (5.1)-(5.6).
 * Indeterminates are arbitrary smooth profile jets, not fitted profile samples.
 * Coefficients use BigInt rationals. X and L may have negative powers; the only
 * differentiation rule for L is L_eta=-4*h*eta. r^2=2*q*X is normalized exactly.
 */
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b];}return a;};
const rational=(a,b=1n)=>{a=BigInt(a);b=BigInt(b);if(!b)throw Error('zero denominator');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return [a/g,b/g];};
const rq=x=>Array.isArray(x)?x:Number.isInteger(x)?rational(x):Number.isInteger(2*x)?rational(2*x,2):(()=>{throw Error('Only exact integers and halves are accepted by the source algebra.');})();
const ra=(a,b)=>rational(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const rm=(a,b)=>rational(a[0]*b[0],a[1]*b[1]);
const key=p=>Object.entries(p).filter(([,v])=>v).sort(([a],[b])=>a.localeCompare(b)).map(([a,b])=>a+'^'+b).join(';');
const powers=k=>Object.fromEntries(k?k.split(';').map(x=>{const i=x.lastIndexOf('^');return [x.slice(0,i),Number(x.slice(i+1))];}):[]);
const atom=(name,exponent=1)=>new Map([[key({[name]:exponent}),rational(1)]]);
const scalar=x=>{const q=rq(x);return q[0]?new Map([['',q]]):new Map();};
function add(...values){const out=new Map();for(const p of values)for(const[k,v]of p){const s=ra(out.get(k)||rational(0),v);if(s[0])out.set(k,s);else out.delete(k);}return out;}
function multiply(a,b){const out=new Map();for(const[ka,va]of a)for(const[kb,vb]of b){const p=powers(ka);for(const[k,v]of Object.entries(powers(kb)))p[k]=(p[k]||0)+v;const k=key(p),v=ra(out.get(k)||rational(0),rm(va,vb));if(v[0])out.set(k,v);else out.delete(k);}return out;}
const product=(...ps)=>ps.reduce(multiply,scalar(1));
const scale=(p,x)=>multiply(p,scalar(x));
function derivative(p,coordinate){
  const out=[];
  for(const[k,c]of p)for(const[v,e]of Object.entries(powers(k))){
    let dv=new Map();const jet=/^(phi|U|V|Pi|F)_(\d+)_(\d+)_(\d+)$/.exec(v);
    if(jet)dv=atom(`${jet[1]}_${jet[2]}_${Number(jet[3])+(coordinate==='X'?1:0)}_${Number(jet[4])+(coordinate==='eta'?1:0)}`);
    else if(v===coordinate)dv=scalar(1);
    else if(v==='L'&&coordinate==='eta')dv=scale(product(atom('h'),atom('eta')),-4);
    if(dv.size){const base=powers(k);base[v]--;out.push(multiply(new Map([[key(base),rm(c,rq(e))]]),dv));}
  }
  return add(...out);
}
const x=atom('X'),e=atom('eta'),h=atom('h'),Linv=atom('L',-1),Xinv=atom('X',-1),Cinv=atom('Cinv');
const d=add(scalar(1),scale(atom('eta',2),-1)),D=add(scalar(.5),scale(h,-1));
const exponentPolynomial=a=>add(scalar(a[0]),scale(h,a[1]));
const exAdd=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const exNeg=a=>[-a[0],-a[1]];
const exSub=(a,b)=>exAdd(a,exNeg(b));
function logarithmicCutoffDerivative(p){const terms=[];for(const[k,c]of p)for(const[v,e]of Object.entries(powers(k))){const chi=/^chi_(\d+)$/.exec(v);if(chi){const base=powers(k);base[v]--;terms.push(product(new Map([[key(base),rm(c,rq(e))]]),atom('sigma'),atom('chi_'+(Number(chi[1])+1))));}else if(v==='sigma')terms.push(new Map([[k,rm(c,rq(e))]]));}return add(...terms);}
const T=(a,p)=>product(Linv,add(scale(multiply(exponentPolynomial(a),p),-1),scale(logarithmicCutoffDerivative(p),-1),product(D,e,derivative(p,'eta')),multiply(x,derivative(p,'X'))));
const Z=(a,p)=>product(Linv,add(scale(product(exponentPolynomial(a),e,p),2),scale(multiply(e,logarithmicCutoffDerivative(p)),2),multiply(d,derivative(p,'eta')),scale(product(e,x,derivative(p,'X')),-2)));
const jet=(name,n)=>n<0?scalar(0):atom(name+'_'+n+'_0_0');
const lambda=n=>[0,2*n],b=n=>[-1,2*n-1],c=n=>[-.5,2*n-1],pressure=n=>[-1,2*n-2];

// Physical fields are sums r^s q^(a+b*h) P(X,eta,profile jets); s is reduced to 0/1.
function term(rPower,qPower,p){const k=Math.floor(rPower/2),r=rPower-2*k,coeff=product(p,atom('X',k),scalar(k>=0?rational(2n**BigInt(k)):rational(1n,2n**BigInt(-k)))),q=exAdd(qPower,[k,0]);return new Map([[r+','+q[0]+','+q[1],coeff]]);}
function fieldAdd(...fs){const out=new Map();for(const f of fs)for(const[k,v]of f){const p=add(out.get(k)||scalar(0),v);if(p.size)out.set(k,p);else out.delete(k);}return out;}
function fieldProduct(a,b){const values=[];for(const[ka,pa]of a)for(const[kb,pb]of b){const [ra,qa,ha]=ka.split(',').map(Number),[rb,qb,hb]=kb.split(',').map(Number);values.push(term(ra+rb,[qa+qb,ha+hb],multiply(pa,pb)));}return fieldAdd(...values);}
const fieldScale=(f,v)=>new Map([...f].map(([k,p])=>[k,scale(p,v)]));
function physicalDerivative(f,coordinate){const out=[];for(const[k,p]of f){const [r,q,hc]=k.split(',').map(Number),a=[q,hc];
  if(coordinate==='r'){if(r)out.push(term(r-1,a,scale(p,r)));out.push(term(r+1,exSub(a,[1,0]),derivative(p,'X')));}
  else if(coordinate==='t')out.push(term(r,exSub(a,[1,0]),T(a,p)));
  else if(coordinate==='z')out.push(term(r,exSub(a,[.5,-1]),Z(a,p)));
  else throw Error('Unknown physical derivative');
}return fieldAdd(...out);}
const divideR=f=>fieldProduct(f,term(-1,[0,0],scalar(1)));
const laplacian=(f,vector)=>fieldAdd(physicalDerivative(physicalDerivative(f,'r'),'r'),divideR(physicalDerivative(f,'r')),physicalDerivative(physicalDerivative(f,'z'),'z'),...(vector?[fieldScale(divideR(divideR(f)),-1)]:[]));
const extract=(f,r,a)=>f.get(r+','+a[0]+','+a[1])||scalar(0);
function physicalResidual(maxOrder){
  const ur=fieldAdd(...Array.from({length:maxOrder+1},(_,n)=>term(-1,lambda(n),jet('V',n)))),ut=fieldAdd(...Array.from({length:maxOrder+1},(_,n)=>term(1,b(n),multiply(Cinv,jet('phi',n))))),uz=fieldAdd(...Array.from({length:maxOrder+1},(_,n)=>term(0,c(n),jet('U',n)))),p=fieldAdd(...Array.from({length:maxOrder+1},(_,n)=>term(0,pressure(n),jet('Pi',n))));
  const advect=f=>fieldAdd(fieldProduct(ur,physicalDerivative(f,'r')),fieldProduct(uz,physicalDerivative(f,'z')));
  const angular=fieldAdd(physicalDerivative(ut,'t'),advect(ut),divideR(fieldProduct(ur,ut)),fieldScale(laplacian(ut,true),-1));
  const axial=fieldAdd(physicalDerivative(uz,'t'),advect(uz),fieldScale(laplacian(uz,false),-1),physicalDerivative(p,'z'));
  const radial=fieldProduct(term(1,[0,0],scalar(1)),fieldAdd(physicalDerivative(ur,'t'),advect(ur),fieldScale(divideR(fieldProduct(ut,ut)),-1),fieldScale(laplacian(ur,true),-1),physicalDerivative(p,'r')));
  return {angular,axial,radial,divergence:fieldAdd(physicalDerivative(ur,'r'),divideR(ur),physicalDerivative(uz,'z'))};
}
function omega(k){if(k<0)return scalar(0);const V=jet('V',k),sum=[];for(let i=0;i<=k;i++){const j=k-i;sum.push(multiply(jet('V',i),add(derivative(jet('V',j),'X'),scale(multiply(Xinv,jet('V',j)),-.5))),multiply(jet('U',i),Z(lambda(j),jet('V',j))));}return add(T(lambda(k),V),...sum,scale(multiply(x,derivative(derivative(V,'X'),'X')),-2),...(k?[scale(Z(exSub(lambda(k-1),[.5,-1]),Z(lambda(k-1),jet('V',k-1))),-1)]:[]));}
function sourceResidual(n){
  const phi=jet('phi',n),U=jet('U',n),angular=[],axial=[],quadratic=[];
  for(let i=0;i<=n;i++){const j=n-i;angular.push(multiply(jet('V',i),add(derivative(jet('phi',j),'X'),multiply(Xinv,jet('phi',j)))),multiply(jet('U',i),Z(b(j),jet('phi',j))));axial.push(multiply(jet('V',i),derivative(jet('U',j),'X')),multiply(jet('U',i),Z(c(j),jet('U',j))));quadratic.push(multiply(jet('phi',i),jet('phi',j)));}
  return {angular:add(T(b(n),phi),...angular,scale(multiply(x,derivative(derivative(phi,'X'),'X')),-2),scale(derivative(phi,'X'),-4),...(n?[scale(Z(exSub(b(n-1),[.5,-1]),Z(b(n-1),jet('phi',n-1))),-1)]:[])),axial:add(T(c(n),U),...axial,Z(pressure(n),jet('Pi',n)),scale(multiply(x,derivative(derivative(U,'X'),'X')),-2),scale(derivative(U,'X'),-2),...(n?[scale(Z(exSub(c(n-1),[.5,-1]),Z(c(n-1),jet('U',n-1))),-1)]:[])),radial:add(scale(multiply(x,derivative(jet('Pi',n),'X')),2),scale(product(x,atom('Cinv',2),add(...quadratic)),-2),omega(n-1)),divergence:add(derivative(jet('V',n),'X'),Z(c(n),jet('U',n)))};
}
const serial=p=>[...p].sort(([a],[b])=>a.localeCompare(b)).map(([monomial,q])=>({coefficient:q[1]===1n?String(q[0]):q[0]+'/'+q[1],monomial:monomial||'1'}));

export function coefficientIdentityAudit(maxOrder=2,{negativeControl=null}={}){
  if(!Number.isSafeInteger(maxOrder)||maxOrder<1||maxOrder>8)throw Error('Exact coefficient audit supports orders 1–8.');
  const physical=physicalResidual(maxOrder),orders=[];
  for(let n=1;n<=maxOrder;n++){
    const expected=sourceResidual(n),direct={angular:multiply(atom('Cinv',-1),extract(physical.angular,1,exSub(b(n),[1,0]))),axial:extract(physical.axial,0,exSub(c(n),[1,0])),radial:extract(physical.radial,0,pressure(n)),divergence:extract(physical.divergence,0,exSub(lambda(n),[1,0]))};
    if(negativeControl==='omit-axial-viscosity')expected.angular=add(expected.angular,Z(exSub(b(n-1),[.5,-1]),Z(b(n-1),jet('phi',n-1))));
    if(negativeControl==='omit-pressure-shift')expected.radial=add(expected.radial,scale(omega(n-1),-1));
    if(negativeControl==='omit-cylindrical-connection')direct.angular=add(direct.angular,scale(multiply(Xinv,multiply(jet('V',0),jet('phi',n))),-.5));
    const equations=Object.fromEntries(Object.keys(expected).map(name=>{const difference=add(direct[name],scale(expected[name],-1));return [name,{equal:difference.size===0,directTerms:direct[name].size,sourceTerms:expected[name].size,difference:serial(difference)}];}));
    orders.push({n,equations,pass:Object.values(equations).every(v=>v.equal),orderedConvolutionPairs:Array.from({length:n+1},(_,i)=>[i,n-i]),axisData:{phi:0,U:0,Pi:0},pressureRole:'Pi_0(X,eta) is the complete leading pressure; Pi_0(0,eta) is only its trace'});
  }
  return {schema:'MathScope.SourceCoefficientIdentity/1',arithmetic:'EXACT_BIGINT_RATIONAL_DIFFERENTIAL_POLYNOMIALS',profileScope:'UNIVERSAL_IDENTITY_FOR_SMOOTH_PROFILE_JETS; applies to the pinned N3 profile without replacing its h or coefficients',maxOrder,pass:orders.every(r=>r.pass),orders,sourceEquations:['5.1','5.2','5.3','5.4','5.5','5.6'],relations:{A:'1/2+h',D:'1/2-h',lambda_n:'2*n*h',rSquared:'2*q*X',L:'1-2*h*eta^2',d:'1-eta^2',physicalTimeDerivative:'q_t=-1/L; eta_t=D*eta/(q*L); X_t=X/(q*L)',physicalAxialDerivative:'q_z=2*eta*q^(1-D)/L; eta_z=d*q^(-D)/L; X_z=-2*eta*X*q^(-D)/L'},negativeControl,coefficientsSolved:false,newLeanKernelExecution:false};
}

export function sourceDimensionAudit({pressureKind='FULL_LEADING_PRESSURE',parameterBinding='PINNED_N3_EXACT_EXPRESSIONS'}={}){
  if(pressureKind!=='FULL_LEADING_PRESSURE')return {pass:false,reason:'The axis pressure trace cannot replace Pi_0(X,eta) in the coefficient PDE.'};
  if(parameterBinding!=='PINNED_N3_EXACT_EXPRESSIONS')return {pass:false,reason:'A supplied illustrative h cannot replace the selected N3 exponent.'};
  const A=[.5,1],Dexp=[.5,-1],twice=a=>exAdd(a,a),n=2;
  const checks=[{id:'axial-viscosity-order-shift',left:exSub([1,0],twice(Dexp)),right:lambda(1),identity:'1-2D=2A-1=2h'},{id:'angular-physical-power',left:exAdd(exAdd(exNeg(A),lambda(n)),[-.5,0]),right:b(n),identity:'q^(-A+lambda_n)*sqrt(2X)*phi_n/C = r*q^(-A-1/2+lambda_n)*phi_n/C'},{id:'transport-power',left:exAdd(A,Dexp),right:[1,0],identity:'A+D=1'},{id:'radial-pressure-shift',left:exAdd([-1,0],lambda(n-1)),right:exAdd(exNeg(twice(A)),lambda(n)),identity:'-1+lambda_(n-1) = -2A+lambda_n'}];
  return {pass:checks.every(x=>x.left.every((v,i)=>v===x.right[i])),checks,pressureKind,parameterBinding,orderIndices:{background:'n',radial:'k',etaDerivative:'m'},scalarAzimuthal:'phi_n',physicalAzimuthal:'E_n=sqrt(2X)*phi_n/C',allH:'Identities in the indeterminate h, not a numerical h fixture'};
}

export function sourceCutoffCurlAudit(n=1,{omitCutoffDerivative=false}={}){
  if(!Number.isSafeInteger(n)||n<1||n>8)throw Error('Select a positive source order between one and eight.');
  const F=jet('F',n),chi=atom('chi_0'),a=exAdd([.5,-1],lambda(n)),S=term(0,a,F),cutS=term(0,a,multiply(chi,F));
  const curl=s=>({radial:fieldScale(divideR(physicalDerivative(s,'z')),-1),axial:divideR(physicalDerivative(s,'r'))});
  const bare=curl(S),actual=omitCutoffDerivative?{radial:fieldProduct(term(0,[0,0],chi),bare.radial),axial:fieldProduct(term(0,[0,0],chi),bare.axial)}:curl(cutS);
  const div=fieldAdd(physicalDerivative(actual.radial,'r'),divideR(actual.radial),physicalDerivative(actual.axial,'z'));
  const radialBracket=extract(fieldProduct(term(1,[0,0],scalar(1)),actual.radial),0,lambda(n)),V=scale(Z(a,F),-1),expected=add(multiply(chi,V),scale(product(e,atom('sigma'),atom('chi_1'),F,Linv),-2)),radialDifference=add(radialBracket,scale(expected,-1));
  const axial=extract(actual.axial,0,c(n)),axialDifference=add(axial,scale(multiply(chi,derivative(F,'X')),-1));
  return {schema:'MathScope.SourceCutoffCurlIdentity/1',n,sourceEquations:['5.27','5.34','5.45'],arithmetic:'EXACT_BIGINT_RATIONAL_DIFFERENTIAL_POLYNOMIALS',sigma:'c_n*q',streamfunction:'S_n=q^(1-A+lambda_n)*F_n',potentialCartesian:'A_n=(S_n/r^2)*(-x2,x1,0)',radialFormula:'r*u_r,n^cut=q^(2*n*h)*(chi(sigma)*V_n-2*eta*sigma*chiPrime(sigma)*F_n/L)',axialFormula:'u_z,n^cut=q^(-A+2*n*h)*chi(sigma)*U_n',reconstruction:'F_n,X=U_n; V_n=-Z_(1-A+lambda_n)F_n',radialFormulaMatches:radialDifference.size===0,axialFormulaMatches:axialDifference.size===0,divergenceZero:div.size===0,divergenceTerms:[...div].map(([power,p])=>({physicalPower:power,terms:serial(p)})),axisRegularity:'F_n/X is smooth by its exact radial-average reconstruction, so the Cartesian potential is smooth at r=0.',directSwirlDivergence:'r^-1*d_theta(chi(c_n*q)*u_theta,n)=0 because all factors are axisymmetric.',angularCutoffPreservesDivergence:true,omitCutoffDerivative,pass:radialDifference.size===0&&axialDifference.size===0&&div.size===0,sourceProfileValuesSubstituted:false,scope:'Universal exact operator identity for the actual source construction; it does not assert that positive-order profiles or Borel coefficients have already been solved.'};
}

/** Extracts the complete original finite physical PDE; no coefficients are set to zero. */
export function finiteBackgroundResidual(maxOrder=2){
  if(!Number.isSafeInteger(maxOrder)||maxOrder<1||maxOrder>4)throw Error('Finite residual export supports positive orders 1–4.');
  const physical=physicalResidual(maxOrder),components=Object.fromEntries(Object.entries(physical).map(([name,field])=>[name,[...field].map(([power,p])=>{const[r,a,b]=power.split(',').map(Number);return {rPower:r,qExponent:{constant:a,hCoefficient:b,exact:`${a}${b<0?'':'+'}${b}*h`},termCount:p.size,terms:serial(p)};})]));
  return {schema:'MathScope.FiniteOriginalNSResidual/1',maxOrder,sourceEquations:['5.1','5.3','5.4','5.5','5.6','5.9','5.25'],arithmetic:'EXACT_BIGINT_RATIONAL_DIFFERENTIAL_POLYNOMIALS',components,radialConvention:'The radial equation is multiplied by r, exactly as in (5.5)-(5.6).',tangentialStressReconstruction:{theta:'T_n,theta(R)=-R^-2*integral_0^R rho^2*r_theta,n(rho) d rho',z:'T_n,z(R)=-R^-1*integral_0^R rho*r_z,n(rho) d rho',divergenceIdentity:'R^-2*d_R(R^2*T_n,theta)=-r_theta,n; R^-1*d_R(R*T_n,z)=-r_z,n',exteriorSupportRequires:'The total weighted residual integrals vanish only after the original five-moment repairs.'},unsubstitutedProfileJets:true,actualProfileCoefficientsEvaluated:false,actualStressAssembled:false,CNm:null,Km:null,verifiedTailBound:false,orderRefinementIsNumericalResidualDecay:false,coefficientIdentityAudit:coefficientIdentityAudit(Math.min(2,maxOrder)),scope:'This complete finite differential polynomial is executable symbolic progress. It is not an evaluated same-profile Fslow norm or a certified (5.25) estimate.'};
}
