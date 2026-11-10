import {canonicalProofJSON,proofSha256} from '../mathscope-m0/proof.mjs';

export const DEFAULT_M4_PROOF_INPUT=Object.freeze({G:'INTEGER_SHEAR',delta:'D1_CECH_DE_RHAM',p:2,precision:16,coefficientField:'Int',coefficientFormula:'[2,-3,5,7]',coefficients:Object.freeze(['2','-3','5','7']),assumptions:Object.freeze([])});
const clone=x=>JSON.parse(JSON.stringify(x));
function validate(input){
 canonicalProofJSON(input);
 for(const key of ['G','delta','coefficientField','coefficientFormula'])if(typeof input[key]!=='string'||!input[key]||input[key].length>500||/[\r\n\u2028\u2029]/.test(input[key]))throw new TypeError('Invalid input '+key);
 if(!Number.isSafeInteger(input.p)||input.p<2||input.p>997||!Number.isSafeInteger(input.precision)||input.precision<1||input.precision>4096)throw new TypeError('p/precision out of budget.');
 if(!Array.isArray(input.coefficients)||input.coefficients.length!==4||input.coefficients.some(x=>typeof x!=='string'||!/^[-]?\d{1,100}$/.test(x)))throw new TypeError('Four exact integer strings are required.');
 if(!Array.isArray(input.assumptions)||input.assumptions.length>64)throw new TypeError('Bounded assumptions required.');
}
/** Generate a new deterministic source binding whenever any mathematical input
 * changes. Generation has no kernel authority; supported target scopes are exact. */
export async function createM4ProofJob(input=DEFAULT_M4_PROOF_INPUT){
 const parameters=clone(input);validate(parameters);
 const parameterDigest=await proofSha256(parameters);
 const ns='MathScope.M4.Generated.J'+parameterDigest.slice(0,20);
 const [a,b,c,d]=parameters.coefficients.map(x=>'('+x+' : Int)');
 const content='import MathScope.M4.Finite\n'+
  '-- Canonical input: '+canonicalProofJSON(parameters)+'\n'+
  'namespace '+ns+'\n'+
  'theorem selected_finite_fixture : MathScope.M0.d1 (MathScope.M0.d0 ⟨'+[a,b,c,d].join(', ')+
  '⟩) = MathScope.M0.zeroC2 := MathScope.M4.Finite.differential_squared_zero _\n'+
  'set_option pp.fullNames true\n#check selected_finite_fixture\n#print axioms selected_finite_fixture\nend '+ns+'\n';
 const sources=[{path:'Generated.lean',content,sha256:await proofSha256(content)}];
 const binding={schemaVersion:'mathscope.m4.generated-proof-binding/1',parameters,sources,parameterDigest,target:ns+'.selected_finite_fixture',requestedGrade:'EXACT_FINITE'};
 const bindingDigest=await proofSha256(binding);
 return {schemaVersion:'mathscope.m4.generated-proof-job/1',jobId:'M4-'+bindingDigest,bindingDigest,...binding,status:'SOURCE_GENERATED_KERNEL_PENDING',kernelPass:false,scope:'One exact Int⁴ vector for the inherited fixed D=1 differential. G,p,delta,precision and formula are bound inputs, but the target asserts only this integer fixture; it is not a gauge/prime/delta theorem.',limitations:['A generated source requires a new actual kernel audit before PASS.','Changing any supplied parameter or assumption invalidates an older binding.']};
}

/** Binding validation only. Even a matching serialized PASS grants no authority. */
export async function classifyM4ProofReuse(current,previous){
 const expected=await createM4ProofJob(current.parameters);
 if(expected.bindingDigest!==current.bindingDigest||canonicalProofJSON(expected.sources)!==canonicalProofJSON(current.sources))return {state:'INVALID_CURRENT_JOB',kernelPass:false};
 if(!previous||previous.bindingDigest!==expected.bindingDigest||canonicalProofJSON(previous.sources)!==canonicalProofJSON(expected.sources))return {state:'STALE_SOURCE_OR_PARAMETERS',kernelPass:false};
 return {state:'BINDING_MATCH_KERNEL_RECHECK_REQUIRED',kernelPass:false};
}
