/** Absolute same-source inner force-square perturbation, normalized before evaluation. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {innerNormContext} from './inner_norm_context.mjs';
const [goal,runtime,historicalPath,innerPath,ledgerPath,output]=process.argv.slice(2);
assert.equal(process.argv.length,8);
const {N,q,closed,load,pins,sharpPin,native,axis,H,leadingCaps,hLogTau,Lambda,Xb,
 traceReport,leadingReport,sourceModuleSHA256,originalNodePrefix}=await innerNormContext(goal,runtime,historicalPath);
const inner=await load(innerPath,'86a17bafa5f65b311ee94fe789babeb866d185b33146c26128a86d59950fa601');
const ledgerBytes=await readFile(ledgerPath),ledger=JSON.parse(ledgerBytes);
assert.equal(ledger.status,'VERIFIED_EXACT_INNER_FORCE_SR_NORMALIZATION_LEDGER');
const sum=xs=>xs.reduce((a,b)=>N.add(a,b),N.zero());
const product=xs=>xs.reduce((a,b)=>N.mul(a,b),N.one());
const gainCache=new Map(),termCache=new Map();
function gain(power){
 if(!gainCache.has(power))gainCache.set(power,N.exp(N.mul(q(power),hLogTau)));
 return gainCache.get(power);
}
function sourceTerm(id,coefficient){
 const key=id+'/'+coefficient;
 if(termCache.has(key))return termCache.get(key);
 const match=/^H_(\d+)\*tau0\^\((\d+)\*h\)$/.exec(id);assert.ok(match,id);
 const root=Number(match[1]),power=Number(match[2]);assert.ok(H.has(root));
 const expected=native.rows.find(row=>row.cauchy.some(item=>item.bound===root));
 assert.equal(power,2*expected.n);
 const result=product([q(coefficient),H.get(root),gain(power)]);termCache.set(key,result);return result;
}
const radius=new Map(),error={4:new Map(),8:new Map()};
for(const [index,name] of ledger.variables.entries()){
 const row=axis.fieldAtomIntervals[name];if(!row||row.exactInterval)continue;
 const leading=Object.entries(row.leadingTerms).map(([id,c])=>{
  assert.ok(leadingCaps[id],id);return N.mul(q(c),leadingCaps[id]);
 });
 const positive=Object.entries(row.positiveTerms).map(([id,c])=>sourceTerm(id,c));
 radius.set(index,sum([...leading,...positive]));
 for(const degree of [4,8])error[degree].set(index,sum(Object.entries(
  inner.fieldAtomErrorEnclosures[name][`degree${degree}ErrorRadiusTerms`]).map(([id,c])=>sourceTerm(id,c))));
}
const sqrtLambda=N.sqrt(Lambda);
function evaluate(term,degree){
 const factors=[q(term.coefficient),N.pow(sqrtLambda,term.lambdaHalfPower),gain(term.remainingTauHPower)];
 for(const [i,k] of term.radiusPowers){assert.ok(radius.has(i));factors.push(N.pow(radius.get(i),k));}
 for(const [i,k] of term.errorPowers){assert.ok(error[degree].has(i));factors.push(N.pow(error[degree].get(i),k));}
 return product(factors);
}
const base=ledger.rows.map(row=>sum(row.baseProgram.map(term=>evaluate(term,4))));
const geometry=N.div(N.mul(q('1056/7'),N.pow(Xb,3)),Lambda);
const baseForceSquare=N.mul(geometry,sum(base.map(v=>N.pow(v,2))));
const rows=[];
for(const degree of [4,8]){
 const errors=ledger.rows.map(row=>sum(row.errorProgram.map(term=>evaluate(term,degree))));
 const errorSquare=N.mul(geometry,sum(errors.map(v=>N.pow(v,2))));
 const squareDifference=N.mul(geometry,sum(errors.map((v,i)=>N.add(N.mul(q(2),N.mul(base[i],v)),N.pow(v,2)))));
 const below={},squaredBelow={};
 assert.equal(N.compareEndpoints(closed(squareDifference).upper,{rational:'0'}),1);
 assert.equal(N.compareEndpoints(closed(errorSquare).upper,{rational:'0'}),1);
 for(const bits of [32,64,128,256]){
  const bound={rational:'1/'+String(1n<<BigInt(bits))};
  below[bits]=N.compareEndpoints(closed(squareDifference).upper,bound);
  squaredBelow[bits]=N.compareEndpoints(closed(errorSquare).upper,bound);
 }
 rows.push({degree,normalizedForceErrorComponents:errors.map(closed),
  squaredForceErrorIntegralOverSR:{lower:{rational:'0'},upper:closed(errorSquare).upper},
  forceSquareIntegralDifferenceOverSR:{lower:{rational:'0'},upper:closed(squareDifference).upper},
  forceSquareDifferenceComparedWithDyadic:below,squaredForceErrorComparedWithDyadic:squaredBelow});
}
const refinementComparison=N.compareEndpoints(rows[1].forceSquareIntegralDifferenceOverSR.upper,
 rows[0].forceSquareIntegralDifferenceOverSR.upper);
const passed=rows.every(row=>row.forceSquareDifferenceComparedWithDyadic[256]===-1&&row.squaredForceErrorComparedWithDyadic[256]===-1);
const result={status:passed?'CONDITIONAL_ABSOLUTE_ORIGINAL_INNER_FORCE_SQUARE_PERTURBATION_BELOW_2_POW_NEG_256_SR':'DIRECTED_ORIGINAL_INNER_FORCE_SQUARE_PERTURBATION_INTERVALS',
 sourcePins:{...pins,sharpCenter:sharpPin,innerRefinement:'86a17bafa5f65b311ee94fe789babeb866d185b33146c26128a86d59950fa601',
  physicalLedger:createHash('sha256').update(ledgerBytes).digest('hex')},
 originalNodePrefix,sourceModuleSHA256,
 geometryUpper:closed(geometry),geometryFormula:'(1056/7)*Xb^3/Lambda',
 normalization:'tau0^(A+1+h) on each force/base-error monomial before numeric arithmetic',
 rebasedLeading:'Same valid sharp-center local720 natural F0/U0 bounds; all positive H factors and actual source remain unchanged.',
 baseRawStencilForceSquareMajorantOverSR:closed(baseForceSquare),
 originalForceSquareIntegralOverSR:{lower:{rational:'0'},upper:closed(baseForceSquare).upper},rows,refinementComparison,
 symbolicRefinement:{squaredErrorMajorantRatioUpper:'25/256',forceSquareDifferenceMajorantRatioUpper:'5/16',
  note:'Exact positive-polynomial contraction from the frozen error program; stored coarse numeric upper endpoints may round identically.'},
 quantity:'Original normalized force-square spacetime integral on the actual whole-K inner domain. Squared error and absolute difference of force-square integrals are separate fields.',
 premises:['original analytic actual inner profiles, final inner source identification and n>=4 selector exclusion',
  'same-field original sharp-center leading/core norm proof and positive geometric measure bound',
  'B_h^4>1 from original exterior amplitude;0<h<1/64,Xb>1,Lambda>1',
  'the frozen Cauchy Taylor error and exact original67+13 nonlinear error program'],
 noCollectedForceMajorantReused:true,actualIntegralNumericallyEvaluated:false,
 normReports:{positive:traceReport,leading:leadingReport},arithmetic:N.report(),
 N706:'OPEN',N805:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,refinementComparison,
 rows:rows.map(row=>({degree:row.degree,dyadicComparisons:row.forceSquareDifferenceComparedWithDyadic}))}));
