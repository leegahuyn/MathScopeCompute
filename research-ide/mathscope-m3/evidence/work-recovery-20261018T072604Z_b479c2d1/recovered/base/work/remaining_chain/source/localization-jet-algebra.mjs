/** Exact differential-polynomial calculus for the localization operator.
 *
 * C(s,z,tau), b(s,z,tau), s=x^2+y^2, are independent smooth functions.
 * A and p have independent Cartesian jets. No PDE, source value, residual
 * cancellation, or equality of distinct jets is assumed. Differentiation
 * expands the product/chain rules with BigInt integer coefficients.
 */
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const MAX_TERMS=30000,MAX_FACTORS=12;
const clean=p=>{for(const [k,v] of p)if(v===0n)p.delete(k);if(p.size>MAX_TERMS)fail('RESOURCE_LIMIT','Exact localization algebra exceeded its monomial cap.');return p;};
const unit=n=>BigInt(n)?new Map([['',BigInt(n)]]):new Map();
const atom=name=>new Map([[name,1n]]);
const add=(...values)=>{const result=new Map();for(const p of values)for(const [k,v] of p)result.set(k,(result.get(k)??0n)+v);return clean(result);};
const scale=(p,n)=>{n=BigInt(n);return n?new Map([...p].map(([k,v])=>[k,v*n])):new Map();};
const sub=(a,b)=>add(a,scale(b,-1));
const multiply=(...values)=>values.reduce((a,b)=>{const out=new Map();for(const [ka,va] of a)for(const [kb,vb] of b){
  const factors=[...(ka?ka.split('*'):[]),...(kb?kb.split('*'):[])].sort();
  if(factors.length>MAX_FACTORS)fail('RESOURCE_LIMIT','Exact localization algebra exceeded its product degree cap.');
  const key=factors.join('*');out.set(key,(out.get(key)??0n)+va*vb);
}return clean(out);},unit(1));
const jet=(name,orders)=>atom(name+'@'+orders.join(','));
const increase=(orders,i)=>orders.map((n,k)=>n+(i===k?1:0));
const X=Array.from({length:4},(_,i)=>atom('x'+i));

function derivativeAtom(name,coordinate){
  if(/^x[0-3]$/.test(name))return unit(Number(name.slice(1))===coordinate?1:0);
  const [field,encoded]=name.split('@'),orders=encoded?.split(',').map(Number);
  if(!orders||orders.some(n=>!Number.isSafeInteger(n)||n<0||n>8))fail('INVALID_JET','Malformed differential atom.');
  if(field==='C'||field==='b'){
    if(orders.length!==3)fail('INVALID_JET','Axisymmetric scalar jets need (s,z,tau) orders.');
    if(coordinate<2)return multiply(unit(2),X[coordinate],jet(field,increase(orders,0)));
    return jet(field,increase(orders,coordinate-1));
  }
  if(!['A0','A1','A2','p','Q'].includes(field)||orders.length!==4)fail('INVALID_JET','Unknown Cartesian field jet.');
  return jet(field,increase(orders,coordinate));
}

const derivative=(p,coordinate)=>{
  const result=new Map();
  for(const [key,value] of p){
    const factors=key?key.split('*'):[];
    for(let i=0;i<factors.length;i++){
      const rest=factors.filter((_,j)=>i!==j).join('*');
      for(const [dk,dv] of derivativeAtom(factors[i],coordinate)){
        const term=[...(rest?rest.split('*'):[]),...(dk?dk.split('*'):[])].sort().join('*');
        result.set(term,(result.get(term)??0n)+value*dv);
      }
    }
  }
  return clean(result);
};
const gradient=p=>[0,1,2].map(i=>derivative(p,i));
const laplacian=p=>add(...[0,1,2].map(i=>derivative(derivative(p,i),i)));
const timeDerivative=p=>scale(derivative(p,3),-1); // tau=1-t, exactly.
const dot=(a,b)=>add(...a.map((x,i)=>multiply(x,b[i])));
const vectorAdd=(...vectors)=>[0,1,2].map(i=>add(...vectors.map(v=>v[i])));
const vectorScale=(v,s)=>v.map(p=>multiply(s,p));
const vectorSub=(a,b)=>a.map((p,i)=>sub(p,b[i]));
const divergence=v=>add(...v.map((p,i)=>derivative(p,i)));
const curl=v=>[[1,2],[2,0],[0,1]].map(([j,k])=>sub(derivative(v[k],j),derivative(v[j],k)));
const cross=(a,b)=>[[1,2],[2,0],[0,1]].map(([j,k])=>sub(multiply(a[j],b[k]),multiply(a[k],b[j])));
const advect=(a,b)=>b.map(p=>dot(a,gradient(p)));
const linear=p=>sub(timeDerivative(p),laplacian(p));
const residual=(v,p)=>vectorAdd(v.map(linear),advect(v,v),gradient(p));
const pack=p=>[...p].sort(([a],[b])=>a.localeCompare(b)).map(([monomial,coefficient])=>({monomial,coefficient:String(coefficient)}));
const packVector=v=>v.map(pack);
const count=v=>v.reduce((n,p)=>n+p.size,0);

function sourceFields(nonAxisymmetricCutoff=false){
  const c=nonAxisymmetricCutoff?jet('Q',[0,0,0,0]):jet('C',[0,0,0]),b=jet('b',[0,0,0]);
  return {c,b,A:[0,1,2].map(i=>jet('A'+i,[0,0,0,0])),p:jet('p',[0,0,0,0]),
    B:[scale(multiply(X[1],b),-1),multiply(X[0],b),unit(0)]};
}

function applyRows(rows,{A,B,c}){
  if(!Array.isArray(rows)||rows.length!==3)fail('INVALID_OPERATOR','Three source velocity rows are required.');
  const dc=gradient(c),coefficient=term=>{
    if(term.coefficient.kind==='cutoff')return scale(c,term.coefficient.sign);
    if(term.coefficient.kind==='gradient'&&Number.isInteger(term.coefficient.coordinate)&&term.coefficient.coordinate>=0&&term.coefficient.coordinate<3)
      return scale(dc[term.coefficient.coordinate],term.coefficient.sign);
    fail('INVALID_OPERATOR','Unknown source cutoff coefficient.');
  };
  return rows.map((row,i)=>{
    if(row.component!==i||!Array.isArray(row.terms))fail('INVALID_OPERATOR','Malformed source component.');
    return add(...row.terms.map(term=>{
      if(!['A','B_e_theta'].includes(term.field)||!Number.isInteger(term.component)||term.component<0||term.component>2
          ||![1,-1].includes(term.coefficient?.sign))fail('INVALID_OPERATOR','Malformed source field operand.');
      let value=(term.field==='A'?A:B)[term.component];
      if(term.derivative!==null){if(!Number.isInteger(term.derivative)||term.derivative<0||term.derivative>2)fail('INVALID_OPERATOR','Malformed spatial derivative.');value=derivative(value,term.derivative);}
      return multiply(coefficient(term),value);
    }));
  });
}

/** The returned proof is generic exact algebra. Only the separate source
 * wrapper may authenticate the recorded original operator rows and cutoff.
 */
export function executeLocalizationJetAlgebra(operatorRows){
  const fields=sourceFields(),{A,B,p,c}=fields,dc=gradient(c),v=vectorAdd(curl(A),B),g=cross(dc,A),
    u=applyRows(operatorRows,fields),pLocalized=multiply(c,p),uDirect=vectorAdd(curl(vectorScale(A,c)),vectorScale(B,c)),
    R=residual(v,p),F=residual(u,pLocalized),
    commutators=[
      {id:'linear-cutoff',formula:'(partial_t c-Delta c)*v',value:vectorScale(v,linear(c))},
      {id:'diffusion-product',formula:'-2 sum_k (partial_k c)*(partial_k v)',value:v.map(a=>scale(dot(dc,gradient(a)),-2))},
      {id:'curl-commutator-linear',formula:'(partial_t-Delta)g',value:g.map(linear)},
      {id:'nonlinear-scaling',formula:'(c^2-c)*(v dot grad)v',value:vectorScale(advect(v,v),sub(multiply(c,c),c))},
      {id:'velocity-cutoff-advection',formula:'c*(v dot grad c)*v',value:vectorScale(v,multiply(c,dot(v,dc)))},
      {id:'local-advects-curl-commutator',formula:'c*(v dot grad)g',value:vectorScale(advect(v,g),c)},
      {id:'curl-commutator-advects-local',formula:'c*(g dot grad)v',value:vectorScale(advect(g,v),c)},
      {id:'curl-commutator-cutoff-advection',formula:'(g dot grad c)*v',value:vectorScale(v,dot(g,dc))},
      {id:'curl-commutator-quadratic',formula:'(g dot grad)g',value:advect(g,g)},
      {id:'pressure-product',formula:'p_loc*grad c',value:vectorScale(dc,p)}
    ],
    expanded=vectorAdd(vectorScale(R,c),...commutators.map(r=>r.value)),
    doubleDivergence=add(...u.flatMap((ui,i)=>u.map((uj,j)=>derivative(derivative(multiply(ui,uj),j),i)))),
    divF=divergence(F),pressureResidual=add(scale(laplacian(pLocalized),-1),scale(doubleDivergence,-1),divF),
    checks=[];
  const check=(id,value)=>{const components=Array.isArray(value)?value:[value];checks.push({id,pass:components.every(p=>p.size===0),remainingMonomials:components.map(p=>p.size)});};
  check('source-rows-equal-full-curl-product',vectorSub(u,uDirect));
  check('localized-velocity-product-rule',vectorSub(u,vectorAdd(vectorScale(v,c),g)));
  check('axisymmetric-direct-field-divergence',divergence(B));
  check('axisymmetric-cutoff-orthogonal-to-direct-field',dot(dc,B));
  check('full-localized-velocity-divergence',divergence(u));
  check('curl-commutator-orthogonal-to-cutoff-gradient',dot(g,dc));
  check('direct-residual-equals-all-commutators',vectorSub(F,expanded));
  check('force-divergence-pressure-poisson',pressureResidual);

  const wrongNoCurl=vectorScale(v,c),wrongPressure=residual(u,p),
    badAxis=sourceFields(true),nonAxisymmetricVelocity=vectorAdd(curl(vectorScale(badAxis.A,badAxis.c)),vectorScale(badAxis.B,badAxis.c)),
    negativeControls=[
      {id:'omitted-gradient-cross-A-changes-velocity',residual:packVector(vectorSub(u,wrongNoCurl)),nonzero:count(vectorSub(u,wrongNoCurl))>0},
      {id:'omitted-gradient-cross-A-breaks-divergence',residual:[pack(divergence(wrongNoCurl))],nonzero:divergence(wrongNoCurl).size>0},
      {id:'omitted-pressure-cutoff-changes-force',residual:packVector(vectorSub(F,wrongPressure)),nonzero:count(vectorSub(F,wrongPressure))>0},
      {id:'omitted-force-divergence-breaks-pressure-poisson',residual:[pack(sub(scale(laplacian(pLocalized),-1),doubleDivergence))],nonzero:divF.size>0},
      {id:'theta-dependent-cutoff-breaks-direct-field-solenoidality',residual:[pack(divergence(nonAxisymmetricVelocity))],nonzero:divergence(nonAxisymmetricVelocity).size>0},
      ...commutators.filter(r=>r.value.some(p=>p.size)).map(row=>({id:'omitted-'+row.id,nonzero:count(row.value)>0,residual:packVector(row.value)}))
    ];
  if(checks.some(r=>!r.pass)||negativeControls.some(r=>!r.nonzero))fail('LOCALIZATION_ALGEBRA_FAILED','An exact source operator identity or its omitted-term control failed.');
  return {schema:'MathScope.N7.LocalizationDifferentialAlgebra/1',sourceAuthenticated:false,
    coordinateConvention:{cartesian:['x','y','z'],tau:'1-t',physicalTimeDerivative:'-partial_tau',viscosity:'1',orientation:'right-handed Cartesian curl',
      axisymmetricCoordinate:'s=x^2+y^2',directField:'B_e_theta=b(s,z,tau)*(-y,x,0)',cutoff:'C(s,z,tau)'},
    method:'Exact integer differential polynomials with distinct mixed jets, commuting Cartesian partials, and the explicit axisymmetric chain rule.',
    premises:['A and p_loc are smooth Cartesian source operands on t<1.','B_e_theta has the original smooth axisymmetric azimuthal form.','The original cutoff is smooth and independent of theta.'],
    checks,negativeControls,commutators:commutators.map(row=>({id:row.id,formula:row.formula,expanded:packVector(row.value),monomialCount:count(row.value)})),
    exactPolynomials:{velocity:packVector(u),localVelocity:packVector(v),curlCommutator:packVector(g),localResidual:packVector(R),
      pressure:pack(pLocalized),directForce:packVector(F),expandedForce:packVector(expanded),forceDivergence:pack(divF),
      doubleDivergence:pack(doubleDivergence),pressureLaplacian:pack(laplacian(pLocalized))},
    statistics:{velocityMonomials:count(u),forceMonomials:count(F),forceDivergenceMonomials:divF.size,
      maximumTerms:MAX_TERMS,maximumFactors:MAX_FACTORS,zeroResidualDecision:'EXACT_EMPTY_POLYNOMIAL',floatingPointDecisions:false},
    arbitraryJetValuesAssumedToSatisfyPDE:false,localResidualAssumedZero:false,
    fullN6FieldNumericallyEnumerated:false,allSpaceForceValuesComputed:false,newLeanExecuted:false};
}
