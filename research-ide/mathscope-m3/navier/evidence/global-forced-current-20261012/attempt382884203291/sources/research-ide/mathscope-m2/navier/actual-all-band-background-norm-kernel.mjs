/** Exact finite slow-coordinate calculus. Source authentication and the
 * regularity of a particular background are supplied by the adapter.
 * Every shared profile jet retains its actual expression body.
 */
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const key=a=>a.join(':'),total=a=>a.reduce((x,y)=>x+y,0);
export function slowMultiIndices(order){
  if(!Number.isSafeInteger(order)||order<0)fail('INVALID_INPUT','Use a nonnegative finite derivative order.');
  const out=[];
  for(let n=0;n<=order;n++)for(let r=0;r<=n;r++)for(let z=0;z<=n-r;z++)out.push([r,z,n-r-z]);
  return out;
}

/** Profile basis (s partial_s, partial_X, partial_eta). Q is constant.
 * R=sqrt(2sX), Z=s^D eta, T=s(1-eta^2), D=1/2-h.
 */
export function exactSlowChartOperators(G,{s,X,eta,h}={}){
  if(!G||[s,X,eta].some(x=>G.nodes[x]?.op!=='coordinate')||new Set([s,X,eta]).size!==3||!G.nodes[h])
    fail('INVALID_INPUT','Use the three explicit source chart coordinates and the original fixed exponent.');
  const q=(n,d=1)=>G.q(n,d),D=G.sub(q(1,2),h),A=G.add(q(1,2),h),d=G.sub(G.one,G.pow(eta,2)),
    L=G.sub(G.one,G.mul(q(2),h,G.pow(eta,2))),sD=G.exp(G.mul(D,G.log(s))),R=G.sqrt(G.mul(q(2),s,X)),
    inverseD=G.inv(sD),inverseL=G.inv(L),
    coefficients=[
      [G.zero,G.div(R,s),G.zero],
      [G.mul(q(2),eta,inverseD,inverseL),G.neg(G.mul(q(2),eta,X,inverseD,inverseL)),G.mul(d,inverseD,inverseL)],
      [G.div(inverseL,s),G.neg(G.div(G.mul(X,inverseL),s)),G.neg(G.div(G.mul(D,eta,inverseL),s))]
    ],coordinates=[s,X,eta],physicalCoordinates=[R,G.mul(sD,eta),G.mul(s,d)];
  const profileDerivative=(root,j)=>j===0?G.mul(s,G.derivative(root,s)):G.derivative(root,coordinates[j]);
  const derivative=(root,axis)=>{
    if(!Number.isSafeInteger(axis)||axis<0||axis>2)fail('INVALID_INPUT','Use one of R, Z, T.');
    return G.add(...coefficients[axis].map((a,j)=>a===G.zero?G.zero:G.mul(a,profileDerivative(root,j))));
  };
  return {s,X,eta,h,A,D,d,L,sD,R,coordinates,physicalCoordinates,coefficients,profileDerivative,derivative,
    basis:['s*partial_s','partial_X','partial_eta'],slowAxes:['R','Z','T'],
    domain:'s>0, X>0, -1<=eta<=1, 0<h<1/2; T=0 is interpreted from T>=0.',sourceAuthenticated:false};
}

export function exactSlowChartIdentityAudit(G,input){
  const chart=exactSlowChartOperators(G,input),rows=[];
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    const actual=chart.derivative(chart.physicalCoordinates[j],i),expected=i===j?G.one:G.zero,
      check=sourceGraphRationalIdentity(G,G.sub(actual,expected),{atomicNodes:[chart.sD,chart.R],maxTerms:50000});
    rows.push({slowAxis:chart.slowAxes[i],physicalCoordinate:chart.slowAxes[j],actual,expected,check});
  }
  const commutators=[];
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)for(let k=0;k<3;k++){
    const expression=G.sub(chart.derivative(chart.coefficients[j][k],i),chart.derivative(chart.coefficients[i][k],j));
    const check=sourceGraphRationalIdentity(G,expression,{atomicNodes:[chart.sD,chart.R],maxTerms:50000});
    commutators.push({first:chart.slowAxes[i],second:chart.slowAxes[j],profileComponent:k,expression,check});
  }
  return {schema:'MathScope.ExactSlowChartIdentityAudit/1',coordinates:chart.coordinates,physicalCoordinates:chart.physicalCoordinates,
    coefficients:chart.coefficients,rows,commutators,pass:rows.every(r=>r.check.pass)&&commutators.every(r=>r.check.pass),
    proof:'The inverse Jacobian acts as the three ordinary coordinate derivatives. The profile basis commutes, so the displayed coefficient commutators prove every mixed ordering agrees.',
    positiveDenominatorPremises:['s>0','X>0','1-2*h*eta^2>0'],sourceAuthenticated:false};
}

/** D_slow^alpha(multiplier*P)=sum_beta coefficient[alpha,beta]
 * E_s^beta0 partial_X^beta1 partial_eta^beta2 P. Every derivative of
 * every nonconstant coefficient is retained by the recurrence.
 */
export function exactSlowProfileExpansion(G,{s,X,eta,h,multiplier,order=2,maxJetRequests=20000}={}){
  if(!G?.nodes?.[multiplier]||!Number.isSafeInteger(order)||order<0||!Number.isSafeInteger(maxJetRequests)||maxJetRequests<1)
    fail('INVALID_INPUT','Use a source multiplier, finite order and positive finite work budget.');
  const count=(order+1)*(order+2)*(order+3)/6;
  if(count>maxJetRequests)fail('RESOURCE_LIMIT','The requested finite jet index set exceeds the explicit work budget.');
  const chart=exactSlowChartOperators(G,{s,X,eta,h}),rows=[],memo=new Map();let work=0;
  const charge=()=>{if(++work>maxJetRequests)fail('RESOURCE_LIMIT','The exact coefficient recurrence exceeded its work budget; no derivative was omitted.');};
  for(const alpha of slowMultiIndices(order)){
    if(total(alpha)===0){const row={slowOrders:alpha,terms:[{profileOrders:[0,0,0],coefficient:multiplier}]};rows.push(row);memo.set(key(alpha),row);continue;}
    const axis=alpha.findLastIndex(x=>x>0),parent=[...alpha];parent[axis]--;
    const prior=memo.get(key(parent));if(!prior)fail('INTERNAL_VALIDATION','The well-founded slow derivative predecessor is missing.');
    const terms=new Map(),put=(beta,c)=>{
      if(c===G.zero)return;const k=key(beta),old=terms.get(k);terms.set(k,{profileOrders:beta,coefficient:old?G.add(old.coefficient,c):c});
    };
    for(const term of prior.terms){
      charge();put([...term.profileOrders],chart.derivative(term.coefficient,axis));
      for(let j=0;j<3;j++)if(chart.coefficients[axis][j]!==G.zero){
        charge();const beta=[...term.profileOrders];beta[j]++;
        put(beta,G.mul(term.coefficient,chart.coefficients[axis][j]));
      }
    }
    const row={slowOrders:alpha,parent,derivativeAxis:axis,terms:[...terms.values()].sort((a,b)=>key(a.profileOrders).localeCompare(key(b.profileOrders)))};
    rows.push(row);memo.set(key(alpha),row);
  }
  return {schema:'MathScope.ExactSlowProfileExpansion/1',coordinates:chart.coordinates,h,multiplier,order,rows,work,
    basis:chart.basis,coefficients:chart.coefficients,slowAxes:chart.slowAxes,
    recurrence:'D_i(c_beta P_beta)=(D_i c_beta)P_beta+sum_j c_beta a_ij P_(beta+e_j).',
    includesCoefficientDerivatives:true,mathematicalOrderCap:null,sourceAuthenticated:false};
}

export function materializeSlowProfileExpansion(G,expansion,{profileRoot,s,X,eta}={}){
  if(!G?.nodes?.[profileRoot]||!expansion?.includesCoefficientDerivatives||key(expansion.coordinates)!==key([s,X,eta]))
    fail('INVALID_INPUT','Use the matching exact chart and an actual profile expression.');
  const memo=new Map(),profileJet=orders=>{
    const k=key(orders);if(memo.has(k))return memo.get(k);
    let value=profileRoot;
    for(let i=0;i<orders[0];i++)value=G.mul(s,G.derivative(value,s));
    for(let i=0;i<orders[1];i++)value=G.derivative(value,X);
    for(let i=0;i<orders[2];i++)value=G.derivative(value,eta);
    memo.set(k,value);return value;
  };
  return expansion.rows.map(row=>({slowOrders:row.slowOrders,value:G.add(...row.terms.map(t=>G.mul(t.coefficient,profileJet(t.profileOrders))))}));
}
