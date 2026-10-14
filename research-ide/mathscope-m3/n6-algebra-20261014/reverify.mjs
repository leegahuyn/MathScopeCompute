/** Exact re-verification of immutable hosted PDE circuits.
 * Keep EVERY normalized denominator factor as a negative integer power.
 * Expanding the common-denominator product before cancellation is unnecessary
 * and caused a real product-budget stop in hosted run38523108728.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const arg=name=>{const i=process.argv.indexOf(name);if(i<0||!process.argv[i+1])throw Error('Missing '+name);return process.argv[i+1];};
const input=JSON.parse(await readFile(arg('--input'),'utf8')),output=arg('--output'),repo=arg('--repo');
const {createCompleteResidualVerifier}=await import(pathToFileURL(resolve(repo,'research-ide/mathscope-m3/mean-equivalence-20261014/residual-rational-verifier.mjs')));
const G={nodes:structuredClone(input.nodes)},put=(op,args)=>{const id=G.nodes.length;G.nodes.push({op,args});return id;},
  q=text=>{const [n,d='1']=text.split('/');return put('rational',[n,d]);},
  add=xs=>xs.length===1?xs[0]:put('add',xs),mul=xs=>xs.length===1?xs[0]:put('multiply',xs),
  neg=x=>mul([q('-1'),x]),pow=(x,p)=>p===1?x:put('integer_power',[x,p]);
// The pinned verifier reduces one add node left-to-right.  A flat exported
// polynomial would repeatedly multiply an ever larger numerator by the unit
// denominator, costing O(n^2) exact products even though no new terms arise.
// Binary balancing changes only exact addition associativity, retaining every
// coefficient/monomial and the original rational verifier unchanged.
function balancedAdd(xs){
  if(!xs.length)return q('0');
  let level=xs;
  while(level.length>1){
    const next=[];
    for(let i=0;i<level.length;i+=2)next.push(i+1<level.length?add([level[i],level[i+1]]):level[i]);
    level=next;
  }
  return level[0];
}
/** Source IDs remain fixed.  Only add associativity is changed, AFTER original
 * coefficient/factor coverage.  Every appended tree replays the exact ordered
 * original child list, including repeats.  This avoids the pinned reduce()
 * factor registry retaining every large prefix numerator of a flat source sum.
 */
function balanceOriginalAdds(){
  const cutoff=G.nodes.length,receipts=[];
  const leaves=id=>{
    if(id<cutoff)return [id];
    const node=G.nodes[id];
    if(node?.op!=='add')throw Error('Reassociated source sum used a non-add transformation');
    return node.args.flatMap(leaves);
  };
  let omittedChildRejected=true;
  for(let id=0;id<cutoff;id++){
    const node=G.nodes[id];
    if(node.op!=='add'||node.args.length<=2)continue;
    const originalChildren=[...node.args],root=balancedAdd(originalChildren),replayed=leaves(root);
    if(JSON.stringify(originalChildren)!==JSON.stringify(replayed))throw Error('Source addition reassociation omitted/reordered a child');
    const restoredArgs=G.nodes[root].args;
    G.nodes[root].args=restoredArgs.slice(1); // Actual transformation mutation.
    const mutationRejected=JSON.stringify(originalChildren)!==JSON.stringify(leaves(root));
    G.nodes[root].args=restoredArgs;
    omittedChildRejected&&=mutationRejected;
    if(!mutationRejected)throw Error('Omitted source addition child mutation survived exact leaf replay');
    node.args=[root];
    receipts.push({originalNode:id,originalChildren,replacementRoot:root,
      exactOriginalOrderAndMultiplicityPreserved:true});
  }
  return {rule:'FINITE_ADDITION_ASSOCIATIVITY_ONLY',originalNodeCount:cutoff,
    transformedAdds:receipts.length,receipts,omittedChildNegativeControlRejected:omittedChildRejected};
}
const execute=(root,limits={maxTerms:50000,maxProducts:5000000})=>createCompleteResidualVerifier(G,limits)(root);
/** Exact AC/rational circuit reconstruction, without polynomial expansion.
 * Canonical IDs are interned by complete descriptors, never hash equality.
 * Only ring-sound associativity/commutativity and exact rational folding are
 * used; inverses/functions remain the same bound original circuit operands.
 */
function checkOriginalCircuit(){
  const canonical=[],intern=new Map(),memo=new Map();
  const put=(op,args)=>{const key=JSON.stringify([op,args]);if(!intern.has(key)){intern.set(key,canonical.length);canonical.push({op,args});}return intern.get(key);};
  const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
  const rational=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(!d)throw Error('Zero rational denominator in independent coefficient reconstruction');
    if(d<0n){n=-n;d=-d;}const divisor=gcd(n,d);return put('rational',[(n/divisor).toString(),(d/divisor).toString()]);};
  const scalar=id=>canonical[id].op==='rational'?canonical[id].args.map(BigInt):null;
  const operation=(op,ids)=>{const terms=[];let n=op==='add'?0n:1n,d=1n;
    for(const id of ids)for(const child of canonical[id].op===op?canonical[id].args:[id]){
      const q=scalar(child);if(!q){terms.push(child);continue;}
      if(op==='add'){n=n*q[1]+q[0]*d;d*=q[1];}else{n*=q[0];d*=q[1];}
      const divisor=gcd(n,d);n/=divisor;d/=divisor;
    }
    if(op==='multiply'&&n===0n)return rational(0n);
    if((op==='add'?n!==0n:n!==d)||!terms.length)terms.push(rational(n,d));
    terms.sort((a,b)=>a-b);return terms.length===1?terms[0]:put(op,terms);
  };
  const power=(base,order)=>{if(!Number.isSafeInteger(order))throw Error('Invalid original source factor power');
    if(order===0)return rational(1n);if(order===1)return base;
    const value=scalar(base);if(value&&(value[0]!==0n||order>=0)){
      const degree=BigInt(Math.abs(order)),a=value[0]**degree,b=value[1]**degree;
      return order>=0?rational(a,b):rational(b,a);
    }return put('integer_power',[base,order]);
  };
  function visit(id){if(memo.has(id))return memo.get(id);const node=G.nodes[id];if(!node)throw Error('Missing immutable circuit operand');
    let out;if(node.op==='rational')out=rational(...node.args);
    else if(node.op==='add'||node.op==='multiply')out=operation(node.op,node.args.map(visit));
    else if(node.op==='integer_power')out=power(visit(node.args[0]),node.args[1]);
    else out=put('same_bound_source_operand',[id]);
    memo.set(id,out);return out;
  }
  const roots=[];
  for(const row of input.allOriginalTerms){
    const [n,d='1']=row.original.coefficient.split('/');
    const expected=operation('multiply',[rational(n,d),...row.sourceFactorBindings.map(f=>power(visit(f.primaryRoot),f.power))]);
    if(expected!==visit(row.primaryTermRoot))throw Error('Original term-by-term coefficient/factor circuit reconstruction failed at input '+row.inputTermIndex);
    roots.push(expected);
  }
  if(operation('add',roots)!==visit(input.primaryResidualRoot))throw Error('Original complete residual omitted or changed an exact input term');
  return {pass:true,originalTermsChecked:roots.length,canonicalDescriptors:canonical.length,
    arithmetic:'Exact BigInt rational constants + factored AC circuit normalization; full descriptors interned, no probabilistic hashes',
    polynomialDenominatorExpansionUsed:false};
}
const result={schema:'MathScope.N6.FactoredExportPDEReverification/1',status:'RUNNING',verificationPhase:'INPUT',
  originalTerms:input.allOriginalTerms.length,calculusAtomComparisons:[],negativeControls:[],
  allRemainingNumeratorMonomials:[],originalAnalyticEqualityProved:false,
  analyticSourceDomainAndDenominatorsDischarged:false,
  immutableSourceRoots:input.originalRoots??null,originalComponent:input.originalComponent??null,
  reconstructionMethod:'residual - exportedNumerator * product(each EXACT denominator factor to its NEGATIVE integer power)',
  exportedPolynomialAddition:'BALANCED_BINARY_EXACT_ASSOCIATIVITY',
  expandedCommonDenominatorProductBuilt:false};
const save=()=>writeFile(output,JSON.stringify(result,null,2)+'\n');
await save();
try{
  result.verificationPhase='ORIGINAL_TERM_CIRCUIT_RECONSTRUCTION';
  await save();
  result.originalTermCircuitReconstruction=checkOriginalCircuit();
  result.independentOriginalTermCircuitReconstructionPass=true;
  result.verificationPhase='EXACT_SOURCE_ADD_REASSOCIATION';
  await save();
  result.exactSourceAdditionReassociation=balanceOriginalAdds();
  if(result.exactSourceAdditionReassociation.transformedAdds){
    result.negativeControls.push({mutation:'reassociated_source_add_child_omitted',
      rejected:result.exactSourceAdditionReassociation.omittedChildNegativeControlRejected});
  }
  result.verificationPhase='INDEPENDENT_SOURCE_CALCULUS_COMPARISONS';
  await save();
  for(const atom of input.atomAttempts){
    if(atom.reason)continue;
    const equal=atom.primaryRoot===atom.independentTaylorRoot,
      check=equal?{pass:true,numerator:[],numeratorMonomials:0,identicalCircuits:true}:
        execute(add([atom.primaryRoot,neg(atom.independentTaylorRoot)]),{maxTerms:12000,maxProducts:1000000});
    result.calculusAtomComparisons.push({sourceNode:atom.sourceNode,pass:check.pass,
      numeratorMonomials:check.numeratorMonomials,identicalCircuits:equal});
    if(!check.pass)throw Error('Ordinary and independent Taylor source derivative disagree at '+atom.sourceNode);
  }
  await save();
  result.verificationPhase='EXACT_CONDITIONAL_NUMERATOR';
  await save();
  const full=execute(input.primaryResidualRoot);
  result.normalizedNumeratorTerms=full.numeratorMonomials;
  result.allRemainingNumeratorMonomials=full.numerator;
  result.denominatorFactorPolynomials=full.denominatorFactorPolynomials;
  result.normalizedActualAtomicNodes=full.actualAtomicNodes.map(id=>({node:id,value:G.nodes[id]}));
  result.originalInputTermZeroOnLeafDomain=input.allOriginalTerms.filter(r=>r.originalTermZeroOnLeafDefinedDomain).map(r=>r.inputTermIndex);
  result.expandedConditionalZeroInputTerms=input.allOriginalTerms.filter(r=>r.expandedConditionalZero).map(r=>r.inputTermIndex);
  result.factorizedAlgebraRequiresLiftedInactiveRowOperandsDefined=input.allOriginalTerms.some(r=>r.expandedAlgebraRequiresLiftedInactiveRowOperandsDefined);
  result.conditionalFunctionalResidualZero=full.pass;
  result.productsUsed=full.productsUsed;
  result.originalNormalizationLimits={maxTerms:full.maxTerms,maxProducts:full.maxProducts};
  await save();
  const polynomial=rows=>balancedAdd(rows.map(row=>mul([q(row.coefficient),...(!row.monomial?[]:row.monomial.split(',').map(s=>{const [id,p]=s.split(':').map(Number);return pow(id,p);} ))])));
  const numerator=full.numerator.length?polynomial(full.numerator):q('0'),
    inverseFactors=full.denominatorFactorPolynomials.map(f=>pow(polynomial(f.polynomial),-f.power)),
    exportedFraction=mul([numerator,...inverseFactors]);
  result.verificationPhase='FACTORED_EXPORTED_FRACTION_RECONSTRUCTION';
  await save();
  const reconstruction=execute(add([input.primaryResidualRoot,neg(exportedFraction)]));
  if(!reconstruction.pass)throw Error('Independent exported numerator/denominator reconstruction failed');
  result.exactExportReconstructionPass=true;
  result.reconstructionProductsUsed=reconstruction.productsUsed;
  result.verificationPhase='EXACT_NEGATIVE_CONTROLS';
  await save();
  const mutatedFraction=mul([add([numerator,q('1')]),...inverseFactors]),
    mutated=execute(add([input.primaryResidualRoot,neg(mutatedFraction)]));
  result.negativeControls.push({mutation:'exported_exact_numerator_coefficient_plus_one',rejected:!mutated.pass,
    survivingNumeratorMonomials:mutated.numeratorMonomials});
  const first=input.atomAttempts.find(a=>!a.reason);
  if(first){const changed=execute(add([add([first.primaryRoot,neg(first.independentTaylorRoot)]),q('1')]),{maxTerms:12000,maxProducts:1000000});
    result.negativeControls.push({mutation:'source_derivative_formula_plus_one',sourceNode:first.sourceNode,rejected:!changed.pass});}
  if(result.negativeControls.some(x=>!x.rejected))throw Error('A negative algebra mutation survived');
  result.status='TWO_CALCULI_AND_EXACT_CONDITIONAL_NUMERATOR_VERIFIED';result.verified=true;result.verificationPhase='COMPLETE';
}catch(error){result.status='PRECISE_SOURCE_ALGEBRA_STOP_OR_FAILURE_ORIGINAL_EVIDENCE_RETAINED';
  result.verified=false;result.stop={type:error.name,message:error.message,code:error.code??null,phase:result.verificationPhase};
  if(result.normalizedNumeratorTerms===undefined)result.normalizedNumeratorTerms=null;
}
await save();
console.log(JSON.stringify({status:result.status,originalTerms:result.originalTerms,
 normalizedNumeratorTerms:result.normalizedNumeratorTerms,calculusAtomComparisons:result.calculusAtomComparisons.length,
 verified:result.verified,verificationPhase:result.verificationPhase,productsUsed:result.productsUsed??null,
 reconstructionProductsUsed:result.reconstructionProductsUsed??null,stop:result.stop??null}));
