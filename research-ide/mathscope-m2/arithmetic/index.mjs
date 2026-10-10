import {ArithmeticError,canonical,hash,meter,small,fail} from '../../mathscope-m1/arithmetic/exact.mjs';
import {projective,elliptic,reconstruct} from './projective.mjs';
import {qDeRham,breuilKisin,etaFixture} from './q-bk.mjs';
import {perfectoidTower,witt} from './perfectoid.mjs';
import {CHECKLIST} from './checklist.mjs';

export const VERSION='0.2.0-m2';
const HANDLERS=Object.freeze({'arithmetic.projective':projective,'arithmetic.elliptic':elliptic,'arithmetic.frobeniusReconstruct':reconstruct,'arithmetic.qDeRham':qDeRham,'arithmetic.breuilKisin':breuilKisin,'arithmetic.perfectoidTower':perfectoidTower,'arithmetic.witt':witt,'arithmetic.comparison':etaFixture});
const SOURCES=[
  {id:'BLUEPRINT_P4_P6',kind:'USER_SUPPLIED_SPECIFICATION',pages:[27,28,29,30,31,32,69,70,71,72],sha256:'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac'},
  {id:'S01',title:'Prisms and Prismatic Cohomology',url:'https://people.mpim-bonn.mpg.de/scholze/prisms.pdf',grade:'THEOREM_REFERENCE',localKernelCheck:false},
  {id:'S06',title:'Counting Points on Hyperelliptic Curves Using Monsky–Washnitzer Cohomology',url:'https://arxiv.org/abs/math/0105031',grade:'THEOREM_REFERENCE',localKernelCheck:false},
  {id:'STACKS_PROJECTIVE',title:'Derived projective bundle formula',url:'https://stacks.math.columbia.edu/tag/0FUN',grade:'THEOREM_REFERENCE',localKernelCheck:false},
  {id:'S03',title:'Integral p-adic Hodge Theory',url:'https://people.mpim-bonn.mpg.de/scholze/integralpadicHodge.pdf',grade:'THEOREM_REFERENCE',localKernelCheck:false},
  {id:'S04',title:'Perfectoid Spaces',url:'https://www.math.uni-bonn.de/people/scholze/PerfectoidSpaces.pdf',grade:'THEOREM_REFERENCE',localKernelCheck:false},
  {id:'S07',title:'La conjecture de Weil I',url:'https://www.numdam.org/item/PMIHES_1974__43__273_0.pdf',grade:'THEOREM_REFERENCE',localKernelCheck:false},
  {id:'C01',title:'Lectures on Etale Cohomology',url:'https://www.jmilne.org/math/CourseNotes/LEC.pdf',grade:'THEOREM_REFERENCE',localKernelCheck:false}
];

export function getCapabilities(){return{schema:'MathScope.M2.ArithmeticCapabilities/2',version:VERSION,kinds:Object.keys(HANDLERS),execution:'BOUNDED_EXACT_BROWSER_OR_NODE',limits:{projectiveDimension:8,prime:257,extensionDegree:4,fieldOrder:4096,padicDigits:64,MWPrime:43,MWOutputDigits:12,MWTerms:32,semilinearRank:4,semilinearBaseDegree:4,formalQPrime:17,qPDDiagonalPrime:5,qPDDeltaDepth:1,qPDNerveDegree:3,framingDisplayDegree:32,BKPolynomialDegree:6,WittPrime:97,WittLength:32,universalTiltWittLength:4,tiltPrime:7,sharpValuationDigits:8,perfectoidRootDepth:8,displayPoints:4096},supported:[
  'P^n finite-perfect derived comparison via the projective bundle theorem, exact Frobenius and all-n formula',
  'Direct rational Monsky–Washnitzer elliptic Frobenius with reduction identities, conservative tail/loss bounds and independent point-count cross-checks',
  'Hensel-lifted unramified coefficient Frobenius, true semilinear matrix products and bounded integer reconstruction',
  'Exact place-indexed Euler identities with rational absolute-convergence tail bounds for projective space and a smooth good elliptic model',
  'Smooth q-crystalline/prismatic theorem application with R/R^(1) and all base homomorphisms; explicit integral T versus T+1 chain isomorphism',
  'Actual completed q-PD diagonal envelopes, free delta relations, small Cech–Alexander nerve, face/degeneracy and two-affine inversion maps with canonical descent theorem application',
  'Eisenstein BK point, exact delta(E), distinct evaluated coefficient maps and computed derived free-point base changes',
  'Standard completed perfectoid base, exact dense tilt Laurent arithmetic, compatible roots and lift-independent sharp error bounds',
  'Universal Witt polynomial addition, multiplication and Frobenius over dense standard-tilt coefficients, plus the larger prime-field subring backend',
  'Actual theta on dense Witt coordinates, a computed distinguished xi and its kernel theorem application tied to the untilt base hash',
  'Completed standard torus A-omega via its actual torsionfree group model, L eta, fractional-character contraction and the BMS comparison theorem',
  'Perfect-prism correspondence and typed etale/de Rham/crystalline routes with derived operations and rejection of missing steps'
],unsupported:[
  'MW at p=2 or p=3, a ramified coefficient backend, and extension-field MW Frobenius',
  'Arbitrary ramified/global q-PD inputs beyond the admitted smooth P1 cover, and normal forms for arbitrary completed envelope elements',
  'Arbitrary perfectoid presentations, arbitrary completed coefficient oracles, finite presentations of general A_inf modules and general effective descent',
  'Uniformizer-change certificate, arbitrary BK Tate multiplier, cup-product or E-infinity certification',
  'Complete numerical global L-function, RH/BSD proof, or new Lean kernel certification'
],statusPolicy:{UNSUPPORTED:'No implemented adapter for the requested input.',PARTIAL:'A usable exact construction remains short of an explicit original criterion; blockers name the missing comparison.',MODEL_DEVELOPMENT:'The comparison or effective algorithm is not complete.',RESEARCH_OPEN:'A genuinely new mathematical statement is required.'},formalComplete:false,checklist:getChecklist()};}
export function getChecklist(){return CHECKLIST.map(x=>({...x}));}
export function validate(kind,input={}){
  const errors=[];try{if(!Object.hasOwn(HANDLERS,kind))fail('UNSUPPORTED_KIND','Unknown M2 arithmetic operation.');if(!input||typeof input!=='object'||Array.isArray(input))fail('INVALID_REQUEST','M2 arithmetic input must be an object.');canonical(input);if(new TextEncoder().encode(canonical(input)).length>262144)fail('BUDGET_LIMIT','Input exceeds 256 KiB.');for(const key of ['formalComplete','allPrimesComputed','AomegaCertified'])if(input[key]===true)fail('INVALID_CLAIM','A request cannot grant itself an infinite-object or formal-completeness certificate.');if(input.N!==undefined)small(input.N,'N',1,kind==='arithmetic.witt'?32:64);}catch(error){errors.push({code:error.code??'INVALID_REQUEST',message:error.message,details:error.details??{}});}return{ok:errors.length===0,valid:errors.length===0,errors};
}
export function validateRequest(request){
  if(!request||typeof request!=='object'||Array.isArray(request))return{ok:false,valid:false,errors:[{code:'INVALID_REQUEST',message:'A request object is required.'}]};
  if(Object.keys(request).some(key=>!['kind','input','precision','budget'].includes(key)))return{ok:false,valid:false,errors:[{code:'UNKNOWN_REQUEST_FIELD',message:'Unknown request envelope field.'}]};
  try{for(const key of ['input','precision','budget'])if(request[key]!==undefined&&(!request[key]||typeof request[key]!=='object'||Array.isArray(request[key])))fail('INVALID_REQUEST',key+' must be an object.');canonical(request);if(request.budget)meter(request.budget);return validate(request.kind,{...request.input,...request.precision});}catch(error){return{ok:false,valid:false,errors:[{code:error.code??'INVALID_REQUEST',message:error.message}]};}
}
export async function run(kind,input={},context={}){return runJob({kind,input,budget:context.budget??{}},context);}
export async function runJob(request,context={}){
  const report=validateRequest(request);if(!report.ok)throw new ArithmeticError(report.errors[0].code,report.errors[0].message,report.errors[0].details);
  const normalized=JSON.parse(canonical({kind:request.kind,input:request.input??{},precision:request.precision??{},budget:request.budget??{}})),input={...normalized.input,...normalized.precision},tracker=meter(normalized.budget,context);tracker.tick(0);
  const data=await HANDLERS[request.kind](input,tracker);tracker.tick(0);
  const sourceHash=await hash({kind:request.kind,input,version:VERSION,object:data.object,scope:data.scope,results:Object.fromEntries(Object.entries(data).filter(([key])=>!['visualization','tables'].includes(key)))});
  const visualization={...data.visualization,sourceHash,sourceRevision:sourceHash,grade:'EXACT_FINITE_ATTRIBUTES_WITH_DECLARED_REFERENCE_BOUNDARIES',sampling:{displayPoints:data.visualization?.points?.length??0,originalSourceHash:sourceHash},inference:'No geometric, p-adic or formal conclusion is inferred from the 3D layout.'};
  const payload={schema:'MathScope.M2.ArithmeticResult/1',version:VERSION,kind:request.kind,status:data.status??'COMPLETED',object:data.object,request:normalized,scope:data.scope,results:data,checks:data.checks??[],blockers:data.blockers??[],tables:data.tables??[],precisionLedger:{requested:normalized.precision,finiteScope:data.scope,roundingError:'0 for exact integer, polynomial, finite-field and finite Witt operations; explicitly tagged complex roots are Float64 display only.',precisionAxesIndependent:true},evidence:{calculation:'EXACT_FINITE_SCOPE',geometricComparison:'EXPLICIT_MODEL_PLUS_APPLIED_EXTERNAL_THEOREM_OR_MODEL_DEVELOPMENT_AS_DECLARED',lean:'NO_NEW_KERNEL_EXECUTION',formalComplete:false,universalConjectureSolved:false},provenance:{sources:SOURCES,algorithmVersion:VERSION,inputHash:await hash(input),sourceHash,operations:tracker.operations},visualization};
  payload.resultHash=await hash(payload);return payload;
}

export function getExamples(){return[
  {id:'m2-projective-p3-n2',label:'P² · exact cohomology, Frobenius and local zeta',request:{kind:'arithmetic.projective',input:{p:'3',n:2,m:1},precision:{N:4},budget:{}}},
  {id:'m2-projective-p5-n8',label:'P⁸ · all 17 cohomological degrees',request:{kind:'arithmetic.projective',input:{p:'5',n:8,m:1},precision:{N:8},budget:{}}},
  {id:'m2-elliptic-p5',label:'E / F₅ · ordinary slopes (0,1)',request:{kind:'arithmetic.elliptic',input:{p:'5',m:1},precision:{N:4},budget:{}}},
  {id:'m2-elliptic-p7',label:'E / F₇ · supersingular slopes (½,½)',request:{kind:'arithmetic.elliptic',input:{p:'7',m:1},precision:{N:4},budget:{}}},
  {id:'m2-elliptic-f9',label:'E / F₉ · explicit extension field, 16 points',request:{kind:'arithmetic.elliptic',input:{p:'3',m:2,polynomial:[1,0,1]},precision:{N:4},budget:{}}},
  {id:'m2-residue-reconstruction',label:'Frobenius polynomial · unique integer residue lift',request:{kind:'arithmetic.frobeniusReconstruct',input:{p:'5',residues:['5','2','1'],bounds:['5','4','1'],boundProvenance:'DECLARED_COEFFICIENT_BOUNDS_FOR_THE_P5_FIXTURE'},precision:{N:4},budget:{}}},
  {id:'m2-q-koszul',label:'Formal q · two-variable Koszul and specializations',request:{kind:'arithmetic.qDeRham',input:{p:'3',a:2,b:3},precision:{N:4,U:8},budget:{}}},
  {id:'m2-bk-point',label:'BK point · δ(u−3)=3u²−9u+8',request:{kind:'arithmetic.breuilKisin',input:{p:'3',E:['-3','1']},precision:{N:4,U:4},budget:{}}},
  {id:'m2-perfectoid-tower',label:'Perfectoid standard tower · finite prefix and θ',request:{kind:'arithmetic.perfectoidTower',input:{p:'3',M:4,V:8},precision:{N:2},budget:{}}},
  {id:'m2-witt-carry',label:'W₂(F₃) · Witt addition carries into the second coordinate',request:{kind:'arithmetic.witt',input:{p:'3',a:['1','0'],b:['1','0']},precision:{N:2},budget:{}}},
  {id:'m2-eta-complex',label:'Lη diagnostic · raw torsion and corrected complex',request:{kind:'arithmetic.comparison',input:{p:'3',d:'3'},precision:{},budget:{}}},
  {id:'m2-mw-p5',label:'MW Frobenius · p=5 rational reduction and precision certificate',request:{kind:'arithmetic.elliptic',input:{p:'5',backend:'mw'},precision:{N:3},budget:{}}},
  {id:'m2-mw-p7',label:'MW Frobenius · p=7 matrix from differential reduction',request:{kind:'arithmetic.elliptic',input:{p:'7',backend:'mw'},precision:{N:3},budget:{}}},
  {id:'m2-semilinear-f9',label:'F₉ coefficients · M σ(M), not M²',request:{kind:'arithmetic.frobeniusReconstruct',input:{p:'3',extensionBaseDegree:2,coefficientPolynomial:[1,0,1],matrix:[[[0,1],1],[3,1]],bounds:[10,8,1],boundProvenance:'EXACT_MANUAL_F9_MATRIX_ORACLE'},precision:{N:4},budget:{}}},
  {id:'m2-elliptic-global',label:'Good elliptic model · exact Euler identity and convergence bound',request:{kind:'arithmetic.elliptic',input:{operation:'globalIdentity',p:'5',excludedPrimes:[2],primes:[3,5,7]},precision:{},budget:{}}},
  {id:'m2-q-framing',label:'T ↔ T+1 · explicit integral chain isomorphism',request:{kind:'arithmetic.qDeRham',input:{operation:'framingComparison',p:'3',degree:8},precision:{},budget:{}}},
  {id:'m2-q-cech-p1',label:'P¹ · actual q-PD diagonal envelopes and canonical two-affine descent',request:{kind:'arithmetic.qDeRham',input:{operation:'cechP1',p:'3',nerveDegree:3,deltaDepth:1},precision:{},budget:{}}},
  {id:'m2-tilt-arithmetic',label:'Standard tilt · actual Laurent addition and Frobenius inverse',request:{kind:'arithmetic.perfectoidTower',input:{operation:'tilt',p:'3',M:1,dimensions:1},precision:{},budget:{}}},
  {id:'m2-sharp-precision',label:'Sharp(1+t) · lift-independent p-adic error bound',request:{kind:'arithmetic.perfectoidTower',input:{operation:'sharp',p:'3',M:0,V:3,dimensions:0},precision:{},budget:{}}},
  {id:'m2-witt-tilt',label:'Universal Witt · nonconstant tilt coefficients and carries',request:{kind:'arithmetic.witt',input:{p:'3',coefficientRing:'standard-tilt',M:0,dimensions:0,a:[[{coefficient:'1',exponents:[1]}],0],b:[1,0]},precision:{N:2},budget:{}}},
  {id:'m2-theta-kernel',label:'Theta · computed xi, distinguished carry and untilt base hash',request:{kind:'arithmetic.perfectoidTower',input:{operation:'theta',p:'3',M:0,dimensions:0},precision:{N:3},budget:{}}},
  {id:'m2-aomega-torus',label:'AΩ · complete torus, actual group model, Lη and BMS comparison',request:{kind:'arithmetic.comparison',input:{operation:'aomega',p:'3',dimensions:2,weight:[3,-2]},precision:{N:4,U:12},budget:{}}},
  {id:'m2-prism-etale',label:'Perfect prism · reduction, inversion and derived fixed points',request:{kind:'arithmetic.comparison',input:{operation:'perfectPrism',p:'3',target:'etale'},precision:{N:3},budget:{}}},
  {id:'m2-prism-de-rham',label:'Perfect prism · Frobenius-twisted derived de Rham base change',request:{kind:'arithmetic.comparison',input:{operation:'perfectPrism',p:'3',target:'deRham'},precision:{N:3},budget:{}}},
  {id:'m2-prism-crystalline',label:'Perfect prism · reduction to W(k) and crystalline comparison',request:{kind:'arithmetic.comparison',input:{operation:'perfectPrism',p:'3',target:'crystalline'},precision:{N:3},budget:{}}}
];}

export {ArithmeticError};
