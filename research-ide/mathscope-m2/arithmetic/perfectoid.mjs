import {bigint,small,fail,mod,powmod,hash} from '../../mathscope-m1/arithmetic/exact.mjs';
import {primeBase} from '../../mathscope-m1/arithmetic/padic.mjs';

const axis=(label,type)=>({label,type,unit:'dimensionless'});
const check=(name,pass,details={})=>({name,pass,...details});

export function teichmuller(residue,p,N){p=primeBase(p);N=small(N,'Witt length',1,32);return powmod(mod(bigint(residue),p),p**BigInt(N-1),p**BigInt(N));}
export function wittEncode(coordinates,p){
  p=primeBase(p);if(!Array.isArray(coordinates)||coordinates.length<1||coordinates.length>32)fail('INVALID_WITT','Provide 1 to 32 coordinates in the prime field.');
  const N=coordinates.length,modulus=p**BigInt(N);let value=0n;
  for(let i=0;i<N;i++){const a=bigint(coordinates[i]);if(a<0n||a>=p)fail('INVALID_WITT','Each Witt coordinate must be a canonical residue in F_p.');value+=p**BigInt(i)*teichmuller(a,p,N-i);}
  return mod(value,modulus);
}
export function wittDecode(value,p,N){
  p=primeBase(p);N=small(N,'Witt length',1,32);let current=mod(bigint(value),p**BigInt(N));const coordinates=[];
  for(let i=0;i<N;i++){const a=mod(current,p);coordinates.push(String(a));current=mod((current-teichmuller(a,p,N-i))/p,p**BigInt(Math.max(0,N-i-1)));}
  return coordinates;
}

export function witt(input={},tracker=null){
  const p=primeBase(input.p??3);if(p>97n)fail('UNSUPPORTED','The finite Witt subring supports p <= 97.');
  if(input.coefficientRing&&input.coefficientRing!==`F_${p}`&&input.coefficientRing!=='Fp')fail('UNSUPPORTED','Only W_N(F_p) is implemented. General Witt vectors over the tilt are not replaced with componentwise arithmetic.');
  const N=small(input.N??2,'Witt length N',1,32),a=input.a??Array.from({length:N},(_,i)=>i?'0':'1'),b=input.b??Array.from({length:N},(_,i)=>i?'0':'1');
  if(!Array.isArray(a)||!Array.isArray(b)||a.length!==N||b.length!==N)fail('INVALID_WITT','Both coordinate lists must have exactly N entries.');
  const av=wittEncode(a,p),bv=wittEncode(b,p),modulus=p**BigInt(N),sum=mod(av+bv,modulus),product=av*bv%modulus,one=Array.from({length:N},(_,i)=>i?'0':'1'),pTimesOne=wittDecode(mod(p,modulus),p,N),rows=[{operation:'a',coordinates:a.map(String),integerResidue:String(av)},{operation:'b',coordinates:b.map(String),integerResidue:String(bv)},{operation:'a+b',coordinates:wittDecode(sum,p,N),integerResidue:String(sum)},{operation:'a*b',coordinates:wittDecode(product,p,N),integerResidue:String(product)},{operation:'p*1',coordinates:pTimesOne,integerResidue:String(mod(p,modulus))}];
  tracker?.tick(N*5);
  return{
    object:{kind:'PRIME_FIELD_TRUNCATED_WITT_RING',coefficientRing:`F_${p}`,length:N},scope:{finite:true,p:String(p),N,ringIsomorphism:`W_${N}(F_${p}) ~= Z/${p}^${N}`,generalTiltCoefficientRing:false},
    arithmetic:{method:'Teichmuller expansion under the canonical W_N(F_p)=Z/p^N identification',teichmullerRule:'[a] = a^(p^(N-1)) modulo p^N for the canonical integer lift a in [0,p)',encoding:'sum_i p^i [a_i]',modulus:String(modulus),componentwiseAddition:false},rows,
    frobenius:{coordinates:a.map(String),integerResidue:String(av),reason:'On the prime field a^p=a, so Witt Frobenius is identity; this does not generalize to every tilt coefficient ring.'},counterexample:{pTimesOne:pTimesOne,naiveComponentwise:Array(N).fill('0'),equal:N===1,one},
    checks:[check('Teichmuller lifts are Frobenius fixed modulo p^N',a.every(x=>{const t=teichmuller(x,p,N);return powmod(t,p,modulus)===t;})),check('addition decodes to the exact sum modulo p^N',wittEncode(rows[2].coordinates,p)===sum),check('multiplication decodes to the exact product modulo p^N',wittEncode(rows[3].coordinates,p)===product),check('p copies of 1 retain the Witt carry when N>1',N===1||wittEncode(pTimesOne,p)===p)],
    tables:[{title:'Witt coordinates and canonical integer residues',columns:['operation','coordinates','integerResidue'],rows}],
    visualization:{points:rows.flatMap((row,i)=>row.coordinates.map((value,j)=>({pos:[i,j,Number(value)],label:`${row.operation}, Witt coordinate ${j}: ${value}`,value:{operation:row.operation,index:j,coordinate:value,integerResidue:row.integerResidue}}))),lines:rows.map((row,i)=>({points:row.coordinates.map((v,j)=>[i,j,Number(v)]),label:row.operation})),axes:[axis('Operation','CATEGORICAL'),axis('Witt coordinate index','WITT_LENGTH_INDEX'),axis('Residue in F_p','FINITE_FIELD_RESIDUE')],description:`W_${N}(F_${p}): exact carries, addition and multiplication`,coordinateMeaning:'Coordinates are Witt components, not independent digits with componentwise ring operations. The exact integer residue accompanies every point.',lostInformation:['Only the stated Witt length and prime-field coefficient subring are computed.'],sourceFields:['rows.coordinates','rows.integerResidue']}
  };
}

export function validateRootPrefix(levels,p){
  p=primeBase(p);if(!Array.isArray(levels)||levels.length<1)return{pass:false,reason:'A nonempty compatible prefix is required.'};
  for(let i=0;i<levels.length;i++){const row=levels[i];if(row.level!==i||row.exponentNumerator!=='1'||row.exponentDenominator!==String(p**BigInt(i)))return{pass:false,reason:'A root level is missing, reordered or changed.'};if(i&&BigInt(row.exponentDenominator)!==p*BigInt(levels[i-1].exponentDenominator))return{pass:false,reason:'Frobenius compatibility fails.'};}
  return{pass:true,method:'Exact rational exponent identities for the selected compatible roots; a finite prefix is not the completed inverse limit.'};
}

export async function perfectoidTower(input={},tracker=null){
  const p=primeBase(input.p??3);if(p>7n)fail('UNSUPPORTED','The standard tower view currently supports p=2,3,5,7.');
  const M=small(input.M??4,'root depth M',1,8),V=small(input.V??8,'valuation cutoff V',1,64),N=small(input.N??2,'Witt length N',1,32);
  if(input.base&&input.base!=='standard-p-roots')fail('UNSUPPORTED','Only the completed standard p-power root tower is described by this adapter. Arbitrary perfectoid algebras require their own presentation and comparison.');
  if(input.operation&&input.operation!=='tower'&&input.operation!=='thetaFixture')fail('UNSUPPORTED','General tilt addition, sharp evaluation and effective descent are not implemented; only the compatible uniformizer tower and its theta fixture are available.');
  if(input.complete===false||input.pseudoUniformizer===null||input.valuation===null)fail('INVALID_PERFECTOID_BASE','Completion, valuation and a pseudo-uniformizer are mandatory for the symbolic base.');
  const base={id:'standard-p-roots',p:String(p),K:'completion of union_m Q_p(p^(1/p^m))',valuation:'v_p(p)=1',pseudoUniformizer:'p^(1/p)',completion:'p-adic valuation completion',torus:'completed O_K<T^(+/-1/p^infinity)>',perfectoidEvidence:{grade:'THEOREM_REFERENCE',source:'S04 Perfectoid Spaces, standard perfectoid field and toric tower construction',localKernelCheck:false}},baseHash=await hash(base);
  const levels=Array.from({length:M+1},(_,i)=>({level:i,symbol:i===0?'p':`p^(1/${p}^${i})`,exponentNumerator:'1',exponentDenominator:String(p**BigInt(i)),valuationNumerator:'1',valuationDenominator:String(p**BigInt(i)),modPRingMonomial:i===0?'0':`pi_${M}^${p**BigInt(M-i)}`,sharpPower:String(p**BigInt(i)),sharpResult:String(p)}));
  if(input.levels){const report=validateRootPrefix(input.levels,p);if(!report.pass)fail('INVALID_ROOT_PREFIX',report.reason);if(input.levels.length!==M+1)fail('INVALID_ROOT_PREFIX','The prefix length must equal M+1.');}
  const checks=validateRootPrefix(levels,p),xiReduction=p**(p-1n)-1n;
  tracker?.tick(M+1);
  return{
    object:{kind:'STANDARD_PERFECTOID_SYMBOLIC_TOWER',baseHash},base,scope:{finite:true,rootDepth:M,valuationCutoff:V,wittLength:N,finiteLevelIsPerfectoid:false,finiteObservationIsInverseLimit:false,computedGeneralTiltArithmetic:false},levels,
    finiteObservation:{coefficientRing:`F_${p}[pi_${M}]/(pi_${M}^${p**BigInt(M)})`,meaning:'O_(Q_p(p^(1/p^M)))/(p), a finite nonreduced coefficient-ring view; the complete tower is a separate symbolic object.',refinement:`pi_${M} -> pi_${M+1}^${p}`,prefixReduction:'Forget the last compatible-sequence component; this is not a claimed reverse ring homomorphism between finite field extensions.',torusCoordinates:'T^(1/p^m) are tracked as formal invertible root symbols, not computed general torus coefficients.'},
    sharp:{input:'selected p-flat uniformizer sequence',formula:'sharp((p,p^(1/p),p^(1/p^2),...)) = p',exactCompatibility:'(p^(1/p^m))^(p^m)=p for every m in the selected symbolic system',generalSharpEvaluator:false},
    theta:{untiltBaseHash:baseHash,Ainf:'W(O_K^flat)',xi:'[p^flat]-p',thetaXi:'0',thetaTeichmullerUniformizer:String(p),thetaAfterFrobeniusXi:String(p**p-p),distinguishedWitness:{deltaXiModuloXi:String(xiReduction),residueModuloP:String(mod(xiReduction,p)),isUnitResidue:mod(xiReduction,p)!==0n},kernelQuotient:{statement:'ker(theta)=(xi), A_inf/(xi) ~= O_K',grade:'THEOREM_REFERENCE',source:'S03 integral p-adic Hodge theory §3.2, perfectoid untilt theta; S01 perfect-prism correspondence',localKernelCheck:false},commutation:'theta(phi(xi)) is not zero in this fixture; an untilt Frobenius endomorphism and a commuting diagram are not assumed.'},
    checks:[check('every displayed root level satisfies the exact p-power compatibility',checks.pass),check('sharp of the selected uniformizer is consistent at every level',levels.every(x=>BigInt(x.sharpPower)===BigInt(x.exponentDenominator))),check('distinguished-generator witness has nonzero residue modulo p',mod(xiReduction,p)!==0n)],
    tables:[{title:'Compatible root prefix',columns:['level','symbol','exponentDenominator','modPRingMonomial','sharpResult'],rows:levels}],
    visualization:{points:levels.map(row=>({pos:[row.level,0,-row.level],label:`${row.symbol}; v_p=1/${row.valuationDenominator}`,value:row})),lines:levels.slice(1).map((row,i)=>({points:[[i,0,-i],[i+1,0,-i-1]],label:`Frobenius power p=${p}`,value:{sourceLevel:i+1,targetLevel:i}})),axes:[axis('Root level','ROOT_DEPTH'),axis('Selected compatible sequence','CATEGORICAL'),{...axis('log_p(v_p(root))','LOG_VALUATION'),transform:'Exact value -m because v_p(p^(1/p^m))=p^(-m).'}],description:`Standard perfectoid tower: depth ${M}, theta and a selected kernel-generator witness`,coordinateMeaning:'The diagram shows a finite compatible prefix and a declared logarithmic valuation coordinate. Its last point is not the end of the infinite tower; Euclidean proximity is not a convergence proof.',lostInformation:['Completion, arbitrary tilt arithmetic and effective descent are not computed by this diagram.','Valuation cutoff, root depth and Witt length are separate precision axes.'],sourceFields:['levels','theta'],infiniteContinuation:{afterLevel:M,status:'SYMBOLIC_NOT_COMPUTED'}}
  };
}
