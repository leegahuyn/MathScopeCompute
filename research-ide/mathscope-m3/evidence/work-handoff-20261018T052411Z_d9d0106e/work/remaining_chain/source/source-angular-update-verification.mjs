/** Complete finite angular update checks in the ORIGINAL coefficient field.
 *
 * The fixed torus lift uses powers of 4 +/- sqrt(2). Expanding these over
 * Q with sqrt(2) treated as an unrelated variable needlessly grows the
 * physical second-derivative identities. This helper uses only the literal
 * positive sqrt(2)^2=2 relation already supplied by the original graph.
 * Source functions and their derivative bodies keep their exact meanings.
 */
import {createQuadraticSourceVerifier} from './source-quadratic-identity.mjs';

const parts=['real','imaginary'],fail=(message,code='INVALID_INPUT')=>{
  throw Object.assign(new Error(message),{code});
};

export function verifyCompleteAngularResidualUpdate(G,update,{prefix='complete-angular-update',maxTerms=180000,maxProducts=3000000}={}){
  if(!update||update.schema!=='MathScope.N6.ExactFiniteAngularUpdate/1')
    fail('Use the complete direct, decomposed and retained-defect coefficient rows.');
  const list=name=>{
    const rows=update[name];
    if(!Array.isArray(rows)||!rows.length||new Set(rows.map(r=>r.m)).size!==rows.length||
      rows.some(r=>!Number.isSafeInteger(r.m)||!Array.isArray(r.value)||r.value.length!==3||
        r.value.some(z=>!z||parts.some(p=>!Number.isSafeInteger(z[p])||!G.nodes[z[p]]))))
      fail('Every angular mode needs all three complete complex coefficients: '+name);
    return new Map(rows.map(row=>[row.m,row.value]));
  },direct=list('direct'),decomposed=list('decomposed'),declared=list('defect'),
    modes=[...direct.keys()].sort((a,b)=>a-b),sameModes=map=>map.size===modes.length&&modes.every(m=>map.has(m));
  if(!sameModes(decomposed)||!sameModes(declared))
    fail('The complete angular comparison may not discard a mode from either path.');
  const verify=createQuadraticSourceVerifier(G,{maxTerms,maxProducts}),checks=[];
  for(const m of modes)for(let component=0;component<3;component++)for(const part of parts){
    const expression=G.sub(direct.get(m)[component][part],decomposed.get(m)[component][part]),
      declaredExpression=declared.get(m)[component][part],
      declaredDifference=G.sub(expression,declaredExpression),declaredCheck=verify(declaredDifference),
      equality=verify(expression);
    checks.push({id:prefix+'-'+m+'-'+component+'-'+part,m,component,part,...equality,
      declaredDefect:declaredExpression,declaredDefectDifference:declaredDifference,
      declaredDefectMatches:declaredCheck.pass,pass:equality.pass&&declaredCheck.pass});
  }
  return {schema:'MathScope.N6.CompleteAngularUpdateCoefficientVerification/1',modes,checks,
    pass:checks.every(check=>check.pass),maxProducts,maxTerms,
    actualDirectMinusDecomposedRecomputed:true,declaredZeroDefectNeverTrusted:true,
    arithmetic:'Exact BigInt Q(sqrt(2)), with every actual source rational body retained.',
    extraSourceRelationsAssumed:false,sourceAuthenticated:false,numericalFieldEnclosure:false,
    algebraicErrorIfPassing:'0',finiteAngularModesDiscarded:[]};
}
