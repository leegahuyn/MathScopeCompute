/** RECOVERY IMPLEMENTATION, not recovered original bytes.
 * Bind the retained original (10.4) rows, execute its unchanged differential
 * algebra, and expose the exact jets a whole-field energy backend needs.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(process.argv[2] ?? 'recovered/base');
const output = path.resolve(process.argv[3] ?? 'work/prune_recovery/energy/evidence');
const source = path.join(root, 'work/remaining_chain/source');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = p => fs.readFileSync(p);
const require = (v,m) => { if (!v) throw new Error(m); };
const {SOURCE_NEAR_TERMINAL_ARCHIVE: archive} = await import(pathToFileURL(path.join(source,'source-near-terminal-evidence-data.mjs')));
const {executeLocalizationJetAlgebra} = await import(pathToFileURL(path.join(source,'localization-jet-algebra.mjs')));
const certificate = archive.certificate, program = certificate.formulaProgram;
const operator = certificate.localizationBinding.operator;
const roots = program.sourceLocalizationProgramRoots;
const ids = program.sourceNodeIds, index = new Map(ids.map((id,i)=>[id,i]));
const cutoff = ids[roots.cutoff], gradient = [0,1,2].map(i=>ids[roots['gradient_'+i]]);
require(operator.sharedFieldInstance === 'ORIGINAL_PROP9_9_FINAL_FIELDS_ON_SAME_COMMON_DOMAIN', 'Wrong original final field target');
require(JSON.stringify(operator.sourceFields) === JSON.stringify(['A','B_e_theta','p_loc']), 'Wrong source fields');
function signed(id,expected,sign) {
  if (sign === 1) return id === expected;
  const n=program.nodes[index.get(id)];
  return n?.op === 'multiply' && n.args.length === 2 && n.args.some(i=>ids[i]===expected)
    && n.args.some(i=>program.nodes[i]?.op==='rational' && JSON.stringify(program.nodes[i].args)===JSON.stringify(['-1','1']));
}
const rows = [[1,2],[2,0],[0,1]].map(([j,k],i)=>({component:i,terms:[
  {field:'A',component:k,derivative:j,coefficient:{kind:'cutoff',sign:1}},
  {field:'A',component:j,derivative:k,coefficient:{kind:'cutoff',sign:-1}},
  {field:'A',component:k,derivative:null,coefficient:{kind:'gradient',coordinate:j,sign:1}},
  {field:'A',component:j,derivative:null,coefficient:{kind:'gradient',coordinate:k,sign:-1}},
  {field:'B_e_theta',component:i,derivative:null,coefficient:{kind:'cutoff',sign:1}}
]}));
for (const row of rows) {
  const actual=operator.velocity[row.component];
  require(actual.component===row.component && actual.terms.length===row.terms.length,'Changed row');
  row.terms.forEach((term,i)=>{
    const a=actual.terms[i],expected=term.coefficient.kind==='cutoff'?cutoff:gradient[term.coefficient.coordinate];
    require(a.field===term.field && a.component===term.component && a.derivative===term.derivative
      && signed(a.coefficient,expected,term.coefficient.sign),'Original product/curl row mismatch');
  });
}
require(operator.pressure.length===1 && operator.pressure[0].field==='p_loc'
  && operator.pressure[0].derivative===null && operator.pressure[0].coefficient===cutoff,'Pressure cutoff missing');
const algebra=executeLocalizationJetAlgebra(rows);

// Differentiate emitted velocity once for the full Cartesian gradient. This
// retains all metric/frame effects without using an incomplete theta derivative.
function derivativeAtom(name,axis) {
  if (/^x[0-3]$/.test(name)) return Number(name.slice(1))===axis ? [['',1n]] : [];
  const [field,encoded]=name.split('@'), orders=encoded.split(',').map(Number);
  const k=['C','b'].includes(field)?(axis<2?0:axis-1):axis;
  orders[k]++;
  const jet=field+'@'+orders.join(',');
  return [['C','b'].includes(field)&&axis<2 ? ['x'+axis,jet].sort().join('*'):jet,
    ['C','b'].includes(field)&&axis<2?2n:1n];
}
function differentiate(polynomial,axis) {
  const terms=new Map();
  for(const {monomial,coefficient} of polynomial) {
    const factors=monomial?monomial.split('*'):[];
    factors.forEach((atom,i)=>{
      const derivative=derivativeAtom(atom,axis);
      const replacements=Array.isArray(derivative[0])?derivative:(derivative.length?[derivative]:[]);
      for(const [d,c] of replacements) {
        const key=[...factors.filter((_,j)=>j!==i),...(d?d.split('*'):[])].sort().join('*');
        terms.set(key,(terms.get(key)??0n)+BigInt(coefficient)*c);
      }
    });
  }
  return [...terms].filter(([,v])=>v!==0n).sort(([a],[b])=>a.localeCompare(b)).map(([monomial,v])=>({monomial,coefficient:String(v)}));
}
const polynomials = {
  velocity:algebra.exactPolynomials.velocity,
  velocityGradient:algebra.exactPolynomials.velocity.map(p=>[0,1,2].map(i=>differentiate(p,i))),
  pressure:algebra.exactPolynomials.pressure,
  directForce:algebra.exactPolynomials.directForce
};
const allPolynomials=[...polynomials.velocity,...polynomials.velocityGradient.flat(),polynomials.pressure,...polynomials.directForce];
const atoms=[...new Set(allPolynomials.flatMap(p=>p.flatMap(t=>t.monomial?t.monomial.split('*'):[])))].sort();
const familyPath=path.join(root,'work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json');
const familyBytes=read(familyPath),family=JSON.parse(familyBytes);
require(sha(familyBytes)==='b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78','Frozen family hash mismatch');
const sourceFiles=['source-near-terminal-evidence-data.mjs','source-localization.mjs','localization-jet-algebra.mjs','final-summation/source-final-summation.mjs'];
const result={
  schema:'MathScope.RecoveryActualEnergyOperatorBinding/1',implementation:'NEW_RECOVERY_IMPLEMENTATION_NOT_LOST_BYTES',
  actualFamily:{sha256:sha(familyBytes),fixedSource:family.fixed_source,stages:family.actual_stages,
    correctionPotentials:family.nodes.filter(n=>n.operation==='ActualCorrectionPotentials'),
    cutoffScales:family.nodes.filter(n=>n.operation==='ActualShrinkingScale'),
    numericalFieldEvaluator:family.numerical_field_evaluator,numericalSupremumEvaluator:family.numerical_supremum_evaluator},
  sourceBinding:certificate.sourceBinding,originalOperator:operator,
  operatorRowsBoundToCapturedOriginal:true,operatorBindingDoesNotIdentifyFinalNumericOperands:true,
  coordinateConvention:algebra.coordinateConvention,requiredAtoms:atoms,
  exactPolynomials:polynomials,originalAlgebraChecks:algebra.checks,
  originalNegativeControls:algebra.negativeControls.map(({id,nonzero})=>({id,nonzero})),
  sourcePins:[...sourceFiles.map(p=>({path:'work/remaining_chain/source/'+p,sha256:sha(read(path.join(source,p)))})),
    {path:'work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json',sha256:sha(familyBytes)}],
  scope:'Original operator rows and exact generic differential polynomials bound to frozen actual family. Actual field jet values, active selectors, and whole-K integrals remain unavailable.',
  N706Closed:false,N805Closed:false,actualLastResolvedTau:null
};
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'ACTUAL_ENERGY_OPERATOR_BINDING.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({originalAlgebraChecks:algebra.checks.length,requiredAtoms:atoms.length,
  polynomialTerms:allPolynomials.reduce((n,p)=>n+p.length,0),N706Closed:false}));
