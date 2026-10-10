import {ArithmeticError,canonical,hash,meter,small,fail} from '../../mathscope-m1/arithmetic/exact.mjs';
import {projective,elliptic,reconstruct} from './projective.mjs';
import {qDeRham,breuilKisin,etaFixture} from './q-bk.mjs';
import {perfectoidTower,witt} from './perfectoid.mjs';
import {CHECKLIST} from './checklist.mjs';

export const VERSION='0.1.0-m2';
const HANDLERS=Object.freeze({'arithmetic.projective':projective,'arithmetic.elliptic':elliptic,'arithmetic.frobeniusReconstruct':reconstruct,'arithmetic.qDeRham':qDeRham,'arithmetic.breuilKisin':breuilKisin,'arithmetic.perfectoidTower':perfectoidTower,'arithmetic.witt':witt,'arithmetic.comparison':etaFixture});
const SOURCES=[
  {id:'BLUEPRINT_P4_P6',kind:'USER_SUPPLIED_SPECIFICATION',pages:[27,28,29,30,31,32,69,70,71,72],sha256:'f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac'},
  {id:'S01',title:'Prisms and Prismatic Cohomology',url:'https://people.mpim-bonn.mpg.de/scholze/prisms.pdf',grade:'THEOREM_REFERENCE',localKernelCheck:false},
  {id:'S03',title:'Integral p-adic Hodge Theory',url:'https://people.mpim-bonn.mpg.de/scholze/integralpadicHodge.pdf',grade:'THEOREM_REFERENCE',localKernelCheck:false},
  {id:'S04',title:'Perfectoid Spaces',url:'https://www.math.uni-bonn.de/people/scholze/PerfectoidSpaces.pdf',grade:'THEOREM_REFERENCE',localKernelCheck:false},
  {id:'S07',title:'La conjecture de Weil I',url:'https://www.numdam.org/item/PMIHES_1974__43__273_0.pdf',grade:'THEOREM_REFERENCE',localKernelCheck:false},
  {id:'C01',title:'Lectures on Etale Cohomology',url:'https://www.jmilne.org/math/CourseNotes/LEC.pdf',grade:'THEOREM_REFERENCE',localKernelCheck:false}
];

export function getCapabilities(){return{schema:'MathScope.M2.ArithmeticCapabilities/1',version:VERSION,kinds:Object.keys(HANDLERS),execution:'BOUNDED_EXACT_BROWSER_OR_NODE',limits:{projectiveDimension:8,prime:257,extensionDegree:4,fieldOrder:4096,padicDigits:64,formalQPrime:17,formalMonomialExponent:8,BKPolynomialDegree:6,WittPrime:97,WittLength:32,perfectoidRootDepth:8,displayPoints:4096},supported:['P^n even cohomology/Frobenius comparison data and exact finite local-factor products','Exact elliptic point enumeration over explicit finite fields; recurrence, Newton slopes and typed local zeta','Bounded integer reconstruction from residues with explicit coefficient-bound provenance','Formal q-integer polynomials and a two-variable q-Koszul block; distinct specializations','Eisenstein BK point baseline with exact delta(E) and typed base maps','W_N(F_p) exact arithmetic through Teichmuller expansion, with noncomponentwise carries','Standard compatible uniformizer root prefixes, exact exponent identities and a reference-backed theta witness','A finite eta-complex diagnostic showing why raw Koszul is not automatically A-omega'],unsupported:['Kedlaya/Monsky-Washnitzer Frobenius backend and certified precision-loss reduction','General semilinear extension-ring Frobenius matrix iteration','q-framing homotopy comparison and coherent multi-affine derived descent','General Witt arithmetic over O_K^flat, general sharp evaluation and effective perfectoid descent','Certified A-omega construction or arbitrary perfectoid presentations','Complete global L-function, RH/BSD proof, cup-product or E-infinity certificate'],statusPolicy:{UNSUPPORTED:'No implemented adapter for the requested input.',MODEL_DEVELOPMENT:'The comparison or effective algorithm is not complete.',RESEARCH_OPEN:'A genuinely new mathematical statement is required.'},formalComplete:false,checklist:getChecklist()};}
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
  const payload={schema:'MathScope.M2.ArithmeticResult/1',version:VERSION,kind:request.kind,status:data.status??'COMPLETED',object:data.object,request:normalized,scope:data.scope,results:data,checks:data.checks??[],blockers:data.blockers??[],tables:data.tables??[],precisionLedger:{requested:normalized.precision,finiteScope:data.scope,roundingError:'0 for exact integer, polynomial, finite-field and finite Witt operations; explicitly tagged complex roots are Float64 display only.',precisionAxesIndependent:true},evidence:{calculation:'EXACT_FINITE_SCOPE',geometricComparison:'THEOREM_REFERENCE_OR_MODEL_DEVELOPMENT_AS_DECLARED',lean:'NO_NEW_KERNEL_EXECUTION',formalComplete:false,universalConjectureSolved:false},provenance:{sources:SOURCES,algorithmVersion:VERSION,inputHash:await hash(input),sourceHash,operations:tracker.operations},visualization};
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
  {id:'m2-eta-complex',label:'Lη diagnostic · raw torsion and corrected complex',request:{kind:'arithmetic.comparison',input:{p:'3',d:'3'},precision:{},budget:{}}}
];}

export {ArithmeticError};
