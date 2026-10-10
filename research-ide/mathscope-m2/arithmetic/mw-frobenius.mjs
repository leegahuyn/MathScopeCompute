// S06 §§3–4: direct Monsky–Washnitzer reduction for good short Weierstrass cubics.
// Finite terms are rational exactly; omitted terms use the negative-pole Lemma 2.
// The positive-power contribution is bounded by the actual horizontal denominators,
// avoiding reliance on the uncorrected 2001 Lemma 3 estimate.
import {bigint,small,fail,mod,valuation,isqrt,canonical} from '../../mathscope-m1/arithmetic/exact.mjs';
import {primeBase} from '../../mathscope-m1/arithmetic/padic.mjs';
import {integerModel,classifyReduction} from '../../mathscope-m1/arithmetic/local-factors.mjs';
import {finiteField,ellipticPointCount} from './finite-fields.mjs';
import {rat,radd,rsub,rmul,rdiv,rjson,rresidue,rval,ptrim,padd,psub,pscale,pshift,pmul,ppow,pderivative,peq,pdiv,pbezout} from './rational.mjs';

const logFloor=(p,n)=>{let e=0;while(n>=p){n/=p;e++;}return e;};
const check=(name,pass,details={})=>({name,pass,...details});
export function mwTailBound(p,k){p=bigint(p);return k-logFloor(p,2n*BigInt(k)+1n);}

export function reduceMWDifferential(numerator,pole,f,tracker=null){
  if(pole<1||pole%2!==1)fail('INVALID_DIFFERENTIAL','MW reduction requires an odd positive y pole.');
  const fp=pderivative(f),bez=pbezout(f,fp,tracker);let B=ptrim(numerator);const ledger=[];
  for(let s=pole;s>1;s-=2){
    const S=pdiv(pmul(B,bez.t,tracker),f,tracker).r;
    const divided=pdiv(psub(B,pmul(S,fp,tracker)),f,tracker);
    if(!peq(divided.r,[rat()]))fail('INTERNAL_CERTIFICATE','MW Bezout division was not exact.');
    const R=divided.q,next=padd(R,pscale(pderivative(S),rat(2n,BigInt(s-2))));
    const identity=peq(B,padd(pmul(R,f,tracker),pmul(S,fp,tracker)));
    if(!identity)fail('INTERNAL_CERTIFICATE','MW vertical cohomology identity failed.');
    ledger.push({direction:'vertical',fromPole:s,toPole:s-2,divisor:String(s-2),identity});B=next;
  }
  while(B.length>2){
    const degree=B.length-1,j=degree-2;
    // d(2*x^j*y) = (2*j*x^(j-1)*f+x^j*f') dx/y.
    const exact=padd(pshift(fp,j),j?pscale(pshift(f,j-1),BigInt(2*j)):[rat()]);
    const c=rdiv(B.at(-1),exact.at(-1));B=psub(B,pscale(exact,c));
    ledger.push({direction:'horizontal',degree,divisor:String(2*degree-1),identity:true});tracker?.tick();
  }
  return{coefficients:[B[0]??rat(),B[1]??rat()],ledger,bezout:bez};
}

export function mwFrobenius(input={},tracker=null){
  const p=primeBase(input.p??5),a=bigint(input.a??-1,'a',32),b=bigint(input.b??0,'b',32);
  if(p<5n||p>43n)fail('UNSUPPORTED','The MW backend supports prime-field good elliptic cubics for 5 <= p <= 43.');
  if(Number(input.m??1)!==1||Number(input.extensionBaseDegree??1)!==1)fail('UNSUPPORTED','MW over extension coefficient fields is a separate adapter; no ordinary matrix power is substituted.');
  const model=integerModel({model:'elliptic',a:String(a),b:String(b)}),reduction=classifyReduction(model,p);
  if(reduction.status!=='GOOD')fail('UNSUPPORTED','MW requires good reduction of the admitted model.',{reduction});
  const N=small(input.N??4,'MW output digits',1,12);let requiredTerms=1;
  while(mwTailBound(p,requiredTerms)<N)requiredTerms++;
  const terms=small(input.terms??requiredTerms,'MW binomial terms',1,32),tailBound=mwTailBound(p,terms);
  const maxPole=Number(p)*(2*terms-1),reductionLossBound=logFloor(p,BigInt(maxPole));
  const requiredWorkingDigits=N+reductionLossBound;
  const workingDigits=small(input.workingPrecision??requiredWorkingDigits,'MW working precision',1,64);
  if(tailBound<N||workingDigits<requiredWorkingDigits)return{
    status:'PRECISION_REQUIRED',object:{kind:'MW_PRECISION_GATE',p:String(p)},scope:{finite:true,N,terms,workingDigits},checks:[check('truncation and working precision meet the reduction bound',false)],blockers:[`Need at least ${requiredTerms} binomial terms and ${requiredWorkingDigits} working digits for output modulo p^${N}.`],
    precisionCertificate:{requestedOutputDigits:N,omittedTermValuationLowerBound:tailBound,requiredTerms,requiredWorkingDigits,workingDigits},
    tables:[],visualization:{points:[{pos:[terms,tailBound,N],label:'MW precision gate',value:{terms,tailBound,N}}],lines:[],axes:[{label:'Binomial terms',type:'TRUNCATION_INDEX'},{label:'Certified tail valuation',type:'PADIC_VALUATION'},{label:'Requested digits',type:'PRECISION'}],description:'MW output withheld until its precision bound is satisfied',coordinateMeaning:'Exact truncation admission states.',lostInformation:[]}
  };
  const f=[rat(b),rat(a),rat(),rat(1n)],fxp=Array.from({length:3*Number(p)+1},()=>rat());fxp[0]=rat(b);fxp[Number(p)]=rat(a);fxp[3*Number(p)]=rat(1n);
  const delta=psub(fxp,ppow(f,Number(p),tracker));
  if(delta.some(c=>c.d!==1n||c.n%p!==0n))fail('INTERNAL_CERTIFICATE','Frobenius discrepancy is not coefficientwise divisible by p.');
  let deltaPower=[rat(1n)],binomial=rat(1n);const columns=[[rat(),rat()],[rat(),rat()]],termRecords=[];
  let verticalSteps=0,horizontalSteps=0,maximumObservedDenominatorValuation=0;
  for(let k=0;k<terms;k++){
    if(k){deltaPower=pmul(deltaPower,delta,tracker);binomial=rmul(binomial,rat(-BigInt(2*k-1),BigInt(2*k)));}
    const pole=Number(p)*(2*k+1),perColumn=[];
    for(let i=0;i<2;i++){
      const numerator=pscale(pshift(deltaPower,Number(p)*(i+1)-1),rmul(p,binomial));
      const reduced=reduceMWDifferential(numerator,pole,f,tracker);
      reduced.coefficients.forEach((c,j)=>{columns[i][j]=radd(columns[i][j],c);maximumObservedDenominatorValuation=Math.max(maximumObservedDenominatorValuation,valuation(c.d,p));});
      verticalSteps+=reduced.ledger.filter(x=>x.direction==='vertical').length;horizontalSteps+=reduced.ledger.filter(x=>x.direction==='horizontal').length;
      perColumn.push({basis:i,coefficients:reduced.coefficients.map(rjson),minimumValuation:Math.min(...reduced.coefficients.map(c=>rval(c,p)??100000)),divisions:reduced.ledger.map(x=>({direction:x.direction,divisor:x.divisor,pValuation:valuation(BigInt(x.divisor),p)}))});
    }
    termRecords.push({term:k,pole,binomial:rjson(binomial),guaranteedValuationAtLeast:mwTailBound(p,k),columns:perColumn});
  }
  const matrix=Array.from({length:2},(_,i)=>columns.map(c=>c[i])),residues=matrix.map(row=>row.map(c=>String(rresidue(c,p,N)))),modulus=p**BigInt(N);
  const trace=radd(matrix[0][0],matrix[1][1]),det=rsub(rmul(matrix[0][0],matrix[1][1]),rmul(matrix[0][1],matrix[1][0]));
  const polynomialResidues=[rresidue(det,p,N),mod(-rresidue(trace,p,N),modulus),1n];
  const bounds=[p,isqrt(4n*p),1n],unique=bounds.every(B=>modulus>2n*B),integerPolynomial=unique?polynomialResidues.map(c=>String(c>modulus/2n?c-modulus:c)):null;
  const oracle=ellipticPointCount(finiteField(p,1,null,tracker),a,b,{fullPairs:true,tracker}),ap=p+1n-BigInt(oracle.count),oraclePolynomial=[String(p),String(-ap),'1'];
  const agrees=unique&&canonical(integerPolynomial)===canonical(oraclePolynomial);
  if(unique&&!agrees)fail('INTERNAL_CERTIFICATE','Computed MW Frobenius disagrees with the independent all-pairs point oracle.',{integerPolynomial,oraclePolynomial});
  const rows=residues.flatMap((row,i)=>row.map((coefficient,j)=>({row:i,column:j,coefficient,exactFiniteSum:rjson(matrix[i][j]),modulus:String(modulus)})));
  return{
    status:unique?'COMPLETED':'PRECISION_REQUIRED',object:{kind:'MONSKY_WASHNITZER_FROBENIUS_MATRIX',model,p:String(p)},reduction,
    scope:{finite:true,p:String(p),genus:1,basis:['dx/y','x dx/y'],coefficientField:'Q_p',outputDigits:N,computedMWMatrix:true,computedIntegralPrismaticComplex:false,arithmetic:'EXACT_RATIONAL_FINITE_TERMS_WITH_PROVEN_PADIC_TAIL'},
    frobenius:{convention:'Column j contains F(x^j dx/y); x -> x^p; coefficient Frobenius is identity.',matrix:residues,exactFiniteSum:matrix.map(row=>row.map(rjson)),modulus:String(modulus)},
    precisionCertificate:{source:'S06 §3 Lemma 2 and §4, plus directly bounded horizontal reduction',sourceURL:'https://arxiv.org/pdf/math/0105031',outputDigits:N,workingDigits,requiredWorkingDigits,reductionLossBound,finiteArithmeticRoundingLoss:0,maximumObservedDenominatorValuation,terms,omittedTermValuationLowerBound:tailBound,
      tailArgument:['The kth binomial term has coefficient valuation at least k+1; powers of 2 are units for p>=5.','Monic f-adic division preserves integrality and gives numerators of degree <=2.','Negative y-poles lose at most floor(log_p(p(2k+1))) by S06 Lemma 2.','The remaining polynomial dx/y part has degree <=(p+1)/2. Its explicit horizontal divisors 2d-1 lose at most one digit.','Thus each omitted term has valuation >= k-floor(log_p(2k+1)); this bound is nondecreasing for p>=5.'],
      horizontalBoundMethod:'ACTUAL_DIVISORS_2D_MINUS_1; NOT_UNCORRECTED_2001_LEMMA_3',verticalSteps,horizontalSteps,termRecords},
    characteristicPolynomial:{residues:polynomialResidues.map(String),coefficients:integerPolynomial,bounds:bounds.map(String),coefficientOrder:'ascending in X',source:'Computed MW matrix; bounds from the elliptic Weil polynomial.'},oracle:{method:'INDEPENDENT_ALL_PAIRS_ENUMERATION',pointCount:oracle.count,aP:String(ap),polynomial:oraclePolynomial},
    checks:[check('Frobenius discrepancy is divisible by p',true),check('exact rational reduction identities',true),check('omitted terms vanish modulo requested p-power',tailBound>=N),check('working precision covers reduction loss',workingDigits>=requiredWorkingDigits),check('MW polynomial matches independent point enumeration',agrees,{uniqueByBound:unique})],
    blockers:unique?[]:['Increase N so that every coefficient has a unique bounded integer lift.'],tables:[{title:'Computed MW Frobenius matrix',columns:['row','column','coefficient','exactFiniteSum','modulus'],rows}],
    visualization:{points:rows.map(r=>({pos:[r.column,r.row,Number(BigInt(r.coefficient)%p)],label:`F[${r.row},${r.column}] mod p^${N} = ${r.coefficient}`,value:r})),lines:[],axes:[{label:'Source basis column',type:'BASIS_INDEX'},{label:'Target basis row',type:'BASIS_INDEX'},{label:'Residue modulo p',type:'FINITE_FIELD_RESIDUE'}],description:'Actual MW Frobenius matrix with a precision-loss and tail certificate',coordinateMeaning:'Entries of a rational cohomology Frobenius matrix, with full p-adic residues in the exact table; no integral prismatic promotion.',lostInformation:['The plot shows only the residue modulo p; the table retains all certified digits.'],sourceFields:['frobenius.matrix','precisionCertificate','characteristicPolynomial']}
  };
}

export function verifyMWResult(input,result,tracker=null){
  try{const expected=mwFrobenius(input,tracker);for(const key of ['object','scope','frobenius','precisionCertificate','characteristicPolynomial','oracle'])if(canonical(expected[key]??null)!==canonical(result[key]??null))return{pass:false,reason:'MW evidence differs from recomputation: '+key};return{pass:expected.status==='COMPLETED',scope:'Exact finite terms, analytic tail bound and independently counted polynomial; no formal theorem import.'};}catch(e){return{pass:false,reason:e.message};}
}
