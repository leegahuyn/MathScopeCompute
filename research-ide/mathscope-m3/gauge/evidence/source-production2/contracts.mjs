/** M3 gauge contracts. No browser or node-only dependencies. */
import {canonical,sha256} from '../../mathscope-m1/gauge/family.mjs';
export {canonical,sha256};
export const VERSION='m3-gauge-1.0.0';
export const MODES=['DECLARED_LOWER_BOUND','UNITS_RESCALING','EXPLICIT_EFFECTIVE_MODEL','EMPIRICAL_ENSEMBLE_ESTIMATE'];
export function check(ok,code,message){if(!ok)throw Object.assign(new Error(message),{code});}
export function number(x,name,{min=-1e6,max=1e6}={}){check(typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max,'INVALID_PARAMETER',`${name} must be finite in [${min},${max}].`);return x;}
export function positive(x,name){return number(x,name,{min:1e-4,max:1e4});}
export function integer(x,name,min,max){check(Number.isInteger(x)&&x>=min&&x<=max,'INVALID_PARAMETER',`${name} must be an integer in [${min},${max}].`);return x;}
export function text(x,name,max=200){check(typeof x==='string'&&x.trim().length>0&&x.length<=max,'MISSING_PROVENANCE',`${name} must be a nonempty string of at most ${max} characters.`);return x;}
export function known(o,keys,name){check(o&&typeof o==='object'&&!Array.isArray(o),'INVALID_PARAMETER',`${name} must be an object.`);check(Object.keys(o).every(k=>keys.includes(k)),'UNKNOWN_PARAMETER',`${name} contains an unsupported parameter; ignored inputs cannot change the mathematical contract.`);}
export function jsonSafe(x){if(x===null||typeof x==='string'||typeof x==='boolean')return x;if(typeof x==='number'){check(Number.isFinite(x),'NONFINITE_RESULT','A nonfinite number cannot be sealed as evidence.');return x;}if(typeof x==='bigint')return x.toString();if(ArrayBuffer.isView(x))return Array.from(x,jsonSafe);if(Array.isArray(x))return x.map(jsonSafe);if(typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([,v])=>v!==undefined).map(([k,v])=>[k,jsonSafe(v)]));throw new Error('UNSERIALIZABLE_EVIDENCE');}
export function runtimeContext(context={}){const started=Date.now(),maxMillis=context.maxMillis??60000;integer(maxMillis,'maxMillis',100,180000);return {started,checkCancelled(){context.checkCancelled?.();check(Date.now()-started<=maxMillis,'TIME_BUDGET','M3 gauge computation reached the declared time budget.');},async yield(progress){context.checkCancelled?.();context.onProgress?.(progress);await new Promise(resolve=>setTimeout(resolve,0));}};}
export const CONTINUUM_OBLIGATIONS=Object.freeze([
 {id:'YM-OS-OBSERVABLES',title:'Schwinger functions and gauge-invariant observable algebra',status:'OPEN_CONTINUUM',requires:['Defined distributions and common observable domains'],scope:'R4 continuum gauge-invariant observables, not gauge-potential positivity'},
 {id:'YM-OS-REGULARITY',title:'Regularity and Euclidean symmetry',status:'OPEN_CONTINUUM',requires:['Distribution growth/regularity bounds','Euclidean covariance'],scope:'Uniform control after regulator removal'},
 {id:'YM-OS-POSITIVITY',title:'Reflection positivity and reconstruction',status:'OPEN_CONTINUUM',requires:['Reflection-positive full observable algebra','All reconstruction theorem hypotheses'],scope:'A finite positive matrix or lattice theorem is insufficient'},
 {id:'YM-VACUUM',title:'Clustering and full vacuum space',status:'OPEN_CONTINUUM',requires:['Clustering or explicit vacuum decomposition'],scope:'Mean subtraction projects off the vacuum only under an appropriate unique-vacuum hypothesis'},
 {id:'YM-CONTINUUM-LIMIT',title:'Continuum limit at fixed physical quantities',status:'OPEN_CONTINUUM',requires:['Scale setting independent of target mass','Existence and model identification as a tends to zero'],scope:'A cutoff or fitted curve does not establish limit existence'},
 {id:'YM-INFINITE-VOLUME',title:'Infinite spatial and temporal volume',status:'OPEN_CONTINUUM',requires:['L and T limit existence','A declared order of limits'],scope:'Finite periodic wraparound and boundary errors remain independent'},
 {id:'YM-NONTRIVIALITY',title:'Nontrivial quantum Yang–Mills model and QFT axioms',status:'OPEN_CONTINUUM',requires:['Model identification','Nontriviality','Required QFT axioms'],scope:'No declared spectrum or effective Hamiltonian is silently identified with QFT'},
 {id:'YM-UNIFORM-GAP',title:'Uniform positive gap on the complete nonvacuum spectrum',status:'OPEN_CONTINUUM',requires:['Uniform regulator and volume bounds','Control of the full nonvacuum space'],scope:'A positive channel mass gives no global positive lower bound'}
]);
export const REFERENCES=[
 {id:'YM-R06',url:'https://arxiv.org/abs/0802.1862',title:'Vandoren and van Nieuwenhuizen, Lectures on instantons',use:'BPST connection and curvature conventions; marginal integrals are derived from the displayed density'},
 {id:'YM-R07',url:'https://davidtong.org/pdfs/teaching/gauge-theory/gauge4.pdf',title:'David Tong, Lattice Gauge Theory',use:'Finite Wilson model, Haar links and path conventions inherited from M2'},
 {id:'YM-R08',url:'https://doi.org/10.1007/BF01614090',title:'Lüscher, Construction of a selfadjoint, strictly positive transfer matrix for Euclidean lattice gauge theories',use:'Model-specific external hypotheses remain in the inherited M2 reflection audit'},
 {id:'YM-R10',url:'https://arxiv.org/abs/hep-lat/0306017',title:'Wolff, Monte Carlo errors with less errors',use:'Autocorrelation-aware statistical analysis; no rigorous confidence claim for a finite PRNG chain'},
 {id:'YM-R11',url:'https://arxiv.org/abs/0902.1265',title:'Blossier et al., On the generalized eigenvalue method for energies and matrix elements in lattice field theory',use:'Observable-basis GEVP and excited-state contamination'},
 {id:'YM-R12',url:'https://arxiv.org/abs/1006.4518',title:'Lüscher, Properties and uses of the Wilson flow in lattice QCD',use:'Flow time is an independent observation parameter; exact stationary BPST flow is distinguished from a general flow solver'},
 {id:'BLUEPRINT',title:'MathScope Research IDE Blueprint v1, pages 45–50 and 74–76',use:'The original 24 Y5/Y6/Y7 criteria, without weakening the acceptance conditions'}
];
