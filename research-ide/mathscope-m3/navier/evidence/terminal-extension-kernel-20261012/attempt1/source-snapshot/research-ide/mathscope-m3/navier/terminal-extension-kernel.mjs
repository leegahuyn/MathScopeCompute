/** Exact differentiated-cutoff calculus for (10.11)-(10.12).
 *
 * The fixed cutoff is built from the original flat exponential recipe.
 * Supplied F_j norms remain premises: this kernel cannot authenticate a
 * global terminal force, replace its norms by exterior restrictions, or
 * extend velocity through its singular terminal time.
 */
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){const r=a%b;a=b;b=r;}return a;};
const rat=(n,d=1n)=>{if(d===0n)fail('ZERO_DENOMINATOR','A rational denominator must be nonzero.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};};
const add=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d);
const mul=(a,b)=>rat(a.n*b.n,a.d*b.d);
const str=a=>a.d===1n?String(a.n):a.n+'/'+a.d;
const parse=value=>{
  if(typeof value!=='string'||value.length>4096||!/^\d+(?:\/[1-9]\d*)?$/.test(value))
    fail('INVALID_EXACT_NORM','A nonnegative exact integer or rational norm bound is required.');
  const [n,d='1']=value.split('/');return rat(BigInt(n),BigInt(d));
};
const fact=n=>{let r=1n;for(let k=2;k<=n;k++)r*=BigInt(k);return r;};
const choose=(n,k)=>fact(n)/(fact(k)*fact(n-k));
const order=(n,label='order',maximum=64)=>{if(!Number.isSafeInteger(n)||n<0||n>maximum)fail('RESOURCE_LIMIT',label+' must be an integer between 0 and '+maximum+'.');return n;};
const zero=()=>rat(0n),one=()=>rat(1n);

/** phi^(n)(u)=P_n(1/u) exp(-1/u) for u>0.
 * v^k exp(-v)<=k! follows from the positive exponential series, so
 * sum |[v^k]P_n| k! bounds every derivative on the complete half-line.
 * A finite resource budget does not truncate the displayed recurrence.
 */
export function originalTerminalCutoffMajorants(maxOrder=8){
  order(maxOrder);let polynomial=[1n];const phi=[],polynomials=[];
  for(let n=0;n<=maxOrder;n++){
    polynomials.push(polynomial.map(String));
    phi.push(polynomial.reduce((s,a,k)=>s+(a<0n?-a:a)*fact(k),0n));
    const next=Array(polynomial.length+2).fill(0n);
    polynomial.forEach((a,k)=>{next[k+2]+=a;if(k)next[k+1]-=BigInt(k)*a;});
    polynomial=next;
  }
  // On 0<u<1 at least one of u,1-u is >=1/2. Hence the denominator
  // phi(u)+phi(1-u) >=exp(-2)>1/9; e<3 is sufficient.
  const inverse=[9n],step=[1n],chi=[1n];
  for(let n=1;n<=maxOrder;n++){
    let inv=0n;for(let k=1;k<=n;k++)inv+=choose(n,k)*2n*phi[k]*inverse[n-k];
    inverse.push(9n*inv);
    let quotient=0n;for(let k=0;k<=n;k++)quotient+=choose(n,k)*phi[k]*inverse[n-k];
    step.push(quotient);chi.push((1n<<BigInt(n))*quotient);
  }
  // chi0(s)=chi(s)*chi(-s) is compact on R, equals one for |s|<=1/2,
  // and on sigma>=0 is exactly the original chi(sigma).
  const chi0=[];
  for(let n=0;n<=maxOrder;n++){
    let value=0n;for(let k=0;k<=n;k++)value+=choose(n,k)*chi[k]*chi[n-k];
    chi0.push(value);
  }
  return {schema:'MathScope.N7.OriginalTerminalCutoffMajorants/1',maxOrder,
    recipe:{phi:'exp(-1/u) if u>0, 0 otherwise',step:'phi(u)/(phi(u)+phi(1-u)) on 0<u<1, with the exact constant extensions',
      chi:'1-step(2*s-1)',chi0:'chi(s)*chi(-s)',support:'[-1,1]',plateau:'[-1/2,1/2]'},
    rows:chi0.map((bound,n)=>({order:n,phiPolynomial:polynomials[n],phiDerivativeUpper:String(phi[n]),
      denominatorInverseDerivativeUpper:String(inverse[n]),stepDerivativeUpper:String(step[n]),
      chiDerivativeUpper:String(chi[n]),chi0DerivativeUpper:String(bound)})),
    induction:{phi:'P_(n+1)(v)=v^2(P_n(v)-P_n_prime(v))',
      polynomialMajorant:'sum_k |P_n[k]| k!, using exp(v)>=v^k/k!',
      denominatorLower:'exp(-2)>1/9 because e<3',
      inverse:'Q_0=9; Q_n=9 sum_(k=1)^n binom(n,k) (2 B_k) Q_(n-k)',
      quotientAndComposition:'The full Leibniz sum and the exact factor 2^n are retained.',
      seams:'Every derivative of phi vanishes at zero; the complementary denominator stays positive.'},
    arithmetic:'Exact BigInt integer upper bounds, with no floating logarithms.',
    sourceFieldNormsConstructed:false,globalTerminalJetsConstructed:false,wholeM3Complete:false};
}

/** All surviving terms of d_sigma^m(chi0(b*sigma)*sigma^j/j!). */
export function terminalCutoffProductRule(j,m){
  order(j,'jet order');order(m,'time derivative order');const terms=[];
  for(let k=Math.max(0,m-j);k<=m;k++)terms.push({cutoffDerivative:k,
    coefficient:str(rat(choose(m,k),fact(j-m+k))),bPower:k,sigmaPower:j-m+k});
  return {j,m,terms,supportPower:m-j,
    identity:'Every term has b^k sigma^(j-m+k), bounded by b^(m-j) on 0<=sigma<=1/b.',
    monomialsDifferentiatedToZeroOmitted:true};
}

export function differentiatedTerminalCutoffConstant(j,m){
  const product=terminalCutoffProductRule(j,m),bounds=originalTerminalCutoffMajorants(m);
  const value=product.terms.reduce((s,t)=>add(s,mul(parse(t.coefficient),parse(bounds.rows[t.cutoffDerivative].chi0DerivativeUpper))),zero());
  return {j,m,value:str(value),productRule:product,cutoffMajorants:bounds,
    meaning:'C_(j,m)=sum_k binom(m,k)||chi0^(k)||_infinity/(j-m+k)! over the surviving terms.'};
}

const requiredPairs=j=>{const rows=[];for(let a=0;a<=Math.floor(j/2);a++)for(let m=0;m<=Math.floor(j/2)-a;m++)rows.push({a,m});return rows;};
const holds=(constraint,b)=>constraint.threshold.d*b**BigInt(constraint.j-constraint.m)>=constraint.threshold.n;

function minimumInteger(previous,constraints){
  const lower=previous+1n;if(constraints.every(c=>holds(c,lower)))return lower;
  let high=lower;
  for(const c of constraints){
    if(c.threshold.n===0n)continue;
    const bits=Math.max(0,c.threshold.n.toString(2).length-c.threshold.d.toString(2).length+1),
      needed=Math.ceil(bits/(c.j-c.m));
    if(needed>16384)fail('RESOURCE_LIMIT','The exact integer cutoff exceeds the 16,384-bit evaluation budget.');
    const upper=1n<<BigInt(needed);if(upper>high)high=upper;
  }
  if(!constraints.every(c=>holds(c,high)))fail('INTEGER_BOUND_FAILURE','The exact rational power upper bound failed.');
  let low=lower;
  while(low<high){const middle=(low+high)/2n;if(constraints.every(c=>holds(c,middle)))high=middle;else low=middle+1n;}
  return low;
}

/** Each F_j C^a bound is an explicit input premise, never an inferred fact.
 * The exact integer search uses every a+m<=floor(j/2) clause separately.
 */
export function exactTerminalExtensionSchedule(input={}){
  const sequence=input.norms;
  if(!Array.isArray(sequence)||sequence.length<1||sequence.length>65)fail('INVALID_JET_SEQUENCE','Supply 1..65 consecutive jet norm records.');
  const rows=[];let previous=0n;
  for(let j=0;j<sequence.length;j++){
    const supplied=sequence[j];
    if(supplied?.j!==j||!Array.isArray(supplied.norms))fail('INVALID_JET_SEQUENCE','Jet orders must be consecutive from zero.');
    const required=Array.from({length:Math.floor(j/2)+1},(_,a)=>a),map=new Map();
    for(const item of supplied.norms){
      if(!Number.isSafeInteger(item?.a)||item.a<0||map.has(item.a))fail('INVALID_JET_NORM','Derivative norm orders must be unique nonnegative integers.');
      map.set(item.a,parse(item.bound));
    }
    if(map.size!==required.length||required.some(a=>!map.has(a)))fail('JET_BOUND_MISSING','Every separate C^a norm up to floor(j/2) is required, including zero-order.');
    const clauses=j===0?[]:requiredPairs(j).map(({a,m})=>{
      const constant=differentiatedTerminalCutoffConstant(j,m),norm=map.get(a),Cjm=parse(constant.value);
      return {j,a,m,Cjm,norm,threshold:mul(rat(1n<<BigInt(j)),mul(Cjm,norm))};
    });
    const b=j===0?1n:minimumInteger(previous,clauses),checks=clauses.map(c=>({a:c.a,m:c.m,Cjm:str(c.Cjm),
      jetNormUpper:str(c.norm),coefficientUpper:str(mul(c.Cjm,c.norm)),
      actualBound:str(mul(mul(c.Cjm,c.norm),rat(1n,b**BigInt(j-c.m)))),requiredUpper:str(rat(1n,1n<<BigInt(j))),pass:holds(c,b)}));
    const strictIncrease=j===0?b===1n:b>previous,previousCandidate=b-1n,
      minimality=j===0?{kind:'FIXED_ORIGINAL_B0',pass:b===1n}:previousCandidate<=previous?
        {kind:'STRICT_INTEGER_INCREASE',pass:true}:{kind:'FAILED_PREDECESSOR_CONSTRAINT',
          failedPairs:clauses.filter(c=>!holds(c,previousCandidate)).map(c=>({a:c.a,m:c.m})),pass:clauses.some(c=>!holds(c,previousCandidate))};
    if(!strictIncrease||!minimality.pass||checks.some(c=>!c.pass))fail('CUTOFF_SCHEDULE_FAILED','The exact original differentiated cutoff constraints failed.');
    rows.push({j,b:String(b),sigmaSupportUpper:'1/'+b,requiredPairCount:clauses.length,
      jetNorms:[...map].map(([a,x])=>({a,bound:str(x)})),checks,minimality,strictIncrease});previous=b;
  }
  return {schema:'MathScope.N7.ExactTerminalExtensionSchedule/1',reference:'(10.11)-(10.12)',
    status:'CONDITIONAL_EXACT_DIFFERENTIATED_JET_SCHEDULE',rows,finiteJetOrder:rows.length-1,
    suppliedNormsAreExplicitPremises:true,globalTerminalJetsAuthenticated:false,sourceNormsAuthenticated:false,
    allListedConstraintsVerified:true,increasingIntegersAreMinimal:true,
    extension:'sum_j chi0(b_j*sigma)*sigma^j*F_j/j!, sigma=t-1>=0',
    support:'Each summand has sigma<=1/b_j<=1 and retains the spatial support of F_j.',
    infiniteDependence:'The same verified construction needs an authenticated norm generator for every order. A finite list does not certify the infinite extension.',
    allOrderCompletion:false,velocityExtendedPastOne:false,originalCriterionComplete:false,wholeM3Complete:false};
}

/** Uniform all-future tail consequence; its premises are deliberately visible. */
export function differentiatedTerminalExtensionTail({spatialOrder=0,timeOrder=0,firstOmittedOrder=0}={}){
  order(spatialOrder,'spatial order');order(timeOrder,'time order');order(firstOmittedOrder,'first omitted order',1024);
  const d=spatialOrder+timeOrder,N=Math.max(firstOmittedOrder,2*d,1);
  return {schema:'MathScope.N7.ConditionalDifferentiatedTerminalTail/1',spatialOrder,timeOrder,
    requestedFirstOmittedOrder:firstOmittedOrder,geometricTailStarts:N,
    finiteExceptionalOrders:Array.from({length:Math.max(0,N-firstOmittedOrder)},(_,i)=>firstOmittedOrder+i),
    geometricTailUpper:str(rat(2n,1n<<BigInt(N))),
    identity:'sum_(j=N)^infinity 2^(-j)=2^(1-N)',
    everyFutureSourceNormAndCutoffConstraintRequired:true,finiteExceptionsNeedTheirOwnBounds:true,
    infiniteConvergenceEstablishedByFiniteData:false,sourceAuthenticated:false,wholeM3Complete:false};
}

/** Exact Taylor matching at sigma=0, conditional on differentiated convergence. */
export function terminalExtensionJoiningIdentity(m=0){
  order(m);const rows=[];
  for(let j=0;j<=m+2;j++){
    let coefficient=zero();
    if(j<=m)for(const term of terminalCutoffProductRule(j,m).terms)
      if(term.cutoffDerivative===0&&term.sigmaPower===0)coefficient=add(coefficient,parse(term.coefficient));
    rows.push({j,coefficient:str(coefficient),expected:j===m?'1':'0',pass:str(coefficient)===(j===m?'1':'0')});
  }
  return {schema:'MathScope.N7.TerminalExtensionJoiningIdentity/1',timeOrder:m,rows,
    everyFixedTermBeyondTimeOrderHasZeroJet:true,cutoffPlateauUsed:true,
    result:'partial_sigma^m f(x,1+sigma)|_(sigma=0)=F_m(x), after the justified uniform differentiated limit.',
    leftHandDependency:'The same actual F_m and all spatial derivatives must be the limits in (10.6)-(10.10).',
    allOrderSourceCompatibilityConstructed:false,velocityExtendedPastOne:false,sourceAuthenticated:false};
}
