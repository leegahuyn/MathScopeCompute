/** Separate exact BigInt algebra verifier for the two Python calculus circuits. */
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
const execute=(root,limits={maxTerms:50000,maxProducts:5000000})=>createCompleteResidualVerifier(G,limits)(root);
const result={schema:'MathScope.N6.TwoCalculiIndependentBigIntPDEVerifier/1',status:'RUNNING',
  originalTerms:input.allOriginalTerms.length,calculusAtomComparisons:[],negativeControls:[],
  allRemainingNumeratorMonomials:[],originalAnalyticEqualityProved:false,
  analyticSourceDomainAndDenominatorsDischarged:false};
const save=()=>writeFile(output,JSON.stringify(result,null,2)+'\n');
await save();
try{
  const independentlyAssembled=add(input.allOriginalTerms.map(row=>mul([q(row.original.coefficient),
    ...row.sourceFactorBindings.map(f=>pow(f.primaryRoot,f.power))])));
  const coefficientCoverage=execute(add([input.primaryResidualRoot,neg(independentlyAssembled)]));
  if(!coefficientCoverage.pass)throw Error('Original term-by-term coefficient/factor circuit reconstruction failed');
  result.independentOriginalTermCircuitReconstructionPass=true;
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
  const full=execute(input.primaryResidualRoot);
  result.normalizedNumeratorTerms=full.numeratorMonomials;
  result.allRemainingNumeratorMonomials=full.numerator;
  result.denominatorFactorPolynomials=full.denominatorFactorPolynomials;
  result.normalizedActualAtomicNodes=full.actualAtomicNodes.map(id=>({node:id,value:G.nodes[id]}));
  result.originalInputTermZeroOnLeafDomain=input.allOriginalTerms.filter(r=>r.originalTermZeroOnLeafDefinedDomain).map(r=>r.inputTermIndex);
  result.conditionalFunctionalResidualZero=full.pass;
  result.productsUsed=full.productsUsed;
  await save();
  const polynomial=rows=>add(rows.map(row=>mul([q(row.coefficient),...(!row.monomial?[]:row.monomial.split(',').map(s=>{const [id,p]=s.split(':').map(Number);return pow(id,p);} ))])));
  const numerator=full.numerator.length?polynomial(full.numerator):q('0'),
    denominator=mul([q('1'),...full.denominatorFactorPolynomials.map(f=>pow(polynomial(f.polynomial),f.power))]);
  const reconstruction=execute(add([mul([input.primaryResidualRoot,denominator]),neg(numerator)]));
  if(!reconstruction.pass)throw Error('Independent exported numerator/denominator reconstruction failed');
  result.exactExportReconstructionPass=true;
  const mutated=execute(add([mul([input.primaryResidualRoot,denominator]),neg(add([numerator,q('1')]))]));
  result.negativeControls.push({mutation:'exported_exact_numerator_coefficient_plus_one',rejected:!mutated.pass,
    survivingNumeratorMonomials:mutated.numeratorMonomials});
  const first=input.atomAttempts.find(a=>!a.reason);
  if(first){const changed=execute(add([first.primaryRoot,q('1'),neg(first.independentTaylorRoot)]),{maxTerms:12000,maxProducts:1000000});
    result.negativeControls.push({mutation:'source_derivative_formula_plus_one',sourceNode:first.sourceNode,rejected:!changed.pass});}
  if(result.negativeControls.some(x=>!x.rejected))throw Error('A negative algebra mutation survived');
  result.status='TWO_CALCULI_AND_EXACT_CONDITIONAL_NUMERATOR_VERIFIED';result.verified=true;
}catch(error){result.status='PRECISE_SOURCE_ALGEBRA_STOP_OR_FAILURE_ORIGINAL_EVIDENCE_RETAINED';
  result.verified=false;result.stop={type:error.name,message:error.message,code:error.code??null};
  if(result.normalizedNumeratorTerms===undefined)result.normalizedNumeratorTerms=null;
}
await save();
console.log(JSON.stringify({status:result.status,originalTerms:result.originalTerms,
 normalizedNumeratorTerms:result.normalizedNumeratorTerms,calculusAtomComparisons:result.calculusAtomComparisons.length,
 verified:result.verified,stop:result.stop??null}));
