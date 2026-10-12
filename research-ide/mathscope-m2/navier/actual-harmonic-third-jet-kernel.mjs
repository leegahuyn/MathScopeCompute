/** Exact third slow jets of i*C*exp(i*k*Phi), with a frozen real k.
 * Both real trigonometric bodies and their factored complex coefficients
 * are retained. The generic layer has no actual-source authority.
 */
import {thirdJetIndices,thirdJetBinomial,thirdJetSubindices,differentiatedThirdScalarJet} from './actual-pulse-third-jet-kernel.mjs';
import {retainedThirdBodyBinding,retainedCommonDenominatorIdentity} from './actual-third-jet-algebra.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const key=a=>a.join(','),degree=a=>a.reduce((s,n)=>s+n,0),validRoot=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x];
const plus=(a,b)=>a.map((n,j)=>n+b[j]),minus=(a,b)=>a.map((n,j)=>n-b[j]);

/** Expand only these fully specified local shares. Sine and cosine are
 * original graph operations, so the returned root is a retained exact
 * real expression, not a evaluated decimal or a new complex oracle.
 */
function instantiateHarmonicBodies(G,body,bindings){
  const local=new Set(bindings.map(b=>b.system).filter(x=>x!==null)),memo=new Map();
  function visit(id){
    if(memo.has(id))return memo.get(id);const {op,args}=G.nodes[id];let value=id;
    if(op==='actual_expression_partial'&&local.has(args[0]))value=G.materializeExpressionFunction(...args);
    else if(op==='add')value=G.add(...args.map(visit));
    else if(op==='multiply')value=G.mul(...args.map(visit));
    else if(op==='inverse')value=G.inv(visit(args[0]));
    else if(op==='integer_power')value=G.pow(visit(args[0]),args[1]);
    else if(op==='sine')value=G.sine(visit(args[0]));
    else if(op==='cosine')value=G.cosine(visit(args[0]));
    memo.set(id,value);return value;
  }
  return visit(body);
}

/** Original C and Phi bodies are the only analytic inputs. All derivatives
 * are generated internally, and each share derivative must materialize
 * literally to the corresponding direct derivative of its original body.
 */
export function exactThirdHarmonicPotentialJets(G,input){
  const allowed=['coefficient','phase','k','directions'];
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k)))
    fail('INVALID_INPUT','Supply only retained C/Phi bodies, a frozen k and coordinate directions. Supplied derivative arrays are not accepted.');
  const {coefficient:C,phase,k,directions}=input;
  if(!Array.isArray(C)||C.length!==3||[...C,phase,k].some(x=>!validRoot(G,x))||!Array.isArray(directions)||directions.length<1||directions.length>3||
    new Set(directions).size!==directions.length||directions.some(x=>G.nodes[x]?.op!=='coordinate'))
    fail('INVALID_INPUT','Use three retained real coefficient bodies, one phase and one through three distinct slow coordinates.');
  if(directions.some(x=>G.freeCoordinates(k).has(x)||G.derivative(k,x)!==G.zero))
    fail('INVALID_INPUT','This exact harmonic recurrence requires k to be actually independent of every selected slow coordinate.');
  const indices=thirdJetIndices(directions.length),lookup=new Map(indices.map((a,i)=>[key(a),i])),units=directions.map((_,j)=>directions.map((_,l)=>j===l?1:0));
  const phaseBinding=retainedThirdBodyBinding(G,phase,directions),coefficientBindings=C.map(x=>retainedThirdBodyBinding(G,x,directions)),bindings=[phaseBinding,...coefficientBindings];
  const phi=orders=>phaseBinding.roots[lookup.get(key(orders))],phiFirst=units.map(phi),q=(n,d=1)=>G.q(n,d);
  const exponentialJets=indices.map(orders=>{
    const d=degree(orders),axes=orders.flatMap((n,j)=>Array(n).fill(j));let real=G.zero,imaginary=G.zero;
    if(d===0)real=G.one;
    else if(d===1)imaginary=G.mul(k,phi(orders));
    else if(d===2){const[i,j]=axes;real=G.neg(G.mul(G.pow(k,2),phiFirst[i],phiFirst[j]));imaginary=G.mul(k,phi(orders));}
    else{
      const[i,j,l]=axes,pair=(a,b)=>phi(plus(units[a],units[b]));
      real=G.neg(G.mul(G.pow(k,2),G.add(G.mul(pair(i,j),phiFirst[l]),G.mul(pair(i,l),phiFirst[j]),G.mul(pair(j,l),phiFirst[i]))));
      imaginary=G.sub(G.mul(k,phi(orders)),G.mul(G.pow(k,3),phiFirst[i],phiFirst[j],phiFirst[l]));
    }
    return {orders,degree:d,real,imaginary};
  });
  // i * sum_beta binomial(alpha,beta) C_beta E_(alpha-beta).
  const formalCoefficients=indices.map(orders=>coefficientBindings.map(binding=>{
    const terms=thirdJetSubindices(orders,indices).map(beta=>({c:G.mul(q(thirdJetBinomial(orders,beta)),binding.roots[lookup.get(key(beta))]),e:exponentialJets[lookup.get(key(minus(orders,beta)))]}));
    return {real:G.neg(G.add(...terms.map(({c,e})=>G.mul(c,e.imaginary)))),imaginary:G.add(...terms.map(({c,e})=>G.mul(c,e.real)))};
  }));
  const recurrenceChecks=[],phaseRecurrenceChecks=[];
  for(const[at,alpha]of indices.entries())if(degree(alpha)<3)for(const[axis,direction]of directions.entries()){
    const next=lookup.get(key(plus(alpha,units[axis]))),lambda=G.mul(k,phiFirst[axis]);
    const nextPair=(real,imaginary)=>({real:G.sub(G.derivative(real,direction),G.mul(lambda,imaginary)),imaginary:G.add(G.derivative(imaginary,direction),G.mul(lambda,real))});
    const phaseNext=nextPair(exponentialJets[at].real,exponentialJets[at].imaginary);
    phaseRecurrenceChecks.push({from:alpha,direction,orders:indices[next],real:retainedCommonDenominatorIdentity(G,phaseNext.real,exponentialJets[next].real),imaginary:retainedCommonDenominatorIdentity(G,phaseNext.imaginary,exponentialJets[next].imaginary)});
    for(let component=0;component<3;component++){
      const z=nextPair(formalCoefficients[at][component].real,formalCoefficients[at][component].imaginary),want=formalCoefficients[next][component];
      recurrenceChecks.push({from:alpha,direction,orders:indices[next],component,real:retainedCommonDenominatorIdentity(G,z.real,want.real),imaginary:retainedCommonDenominatorIdentity(G,z.imaginary,want.imaginary)});
    }
  }
  const formalAngle=G.mul(k,phaseBinding.value),formalSine=G.sine(formalAngle),formalCosine=G.cosine(formalAngle),angle=G.mul(k,phase),sine=G.sine(angle),cosine=G.cosine(angle);
  const formalBodies=coefficientBindings.map(b=>({real:G.neg(G.mul(b.value,formalSine)),imaginary:G.mul(b.value,formalCosine)}));
  const originalBodies=C.map(body=>({real:G.neg(G.mul(body,sine)),imaginary:G.mul(body,cosine)}));
  const formalDirect=formalBodies.map(b=>({real:differentiatedThirdScalarJet(G,b.real,directions),imaginary:differentiatedThirdScalarJet(G,b.imaginary,directions)}));
  const actualDirect=originalBodies.map(b=>({real:differentiatedThirdScalarJet(G,b.real,directions),imaginary:differentiatedThirdScalarJet(G,b.imaginary,directions)}));
  const jets=indices.map((orders,at)=>({orders,degree:degree(orders),coefficients:formalCoefficients[at].map(pair=>({real:instantiateHarmonicBodies(G,pair.real,bindings),imaginary:instantiateHarmonicBodies(G,pair.imaginary,bindings)})),
    roots:actualDirect.map(b=>({real:b.real.roots[at],imaginary:b.imaginary.roots[at]})),checks:formalCoefficients[at].map((pair,component)=>{
      const factored={real:G.sub(G.mul(pair.real,formalCosine),G.mul(pair.imaginary,formalSine)),imaginary:G.add(G.mul(pair.real,formalSine),G.mul(pair.imaginary,formalCosine))};
      const fields={};for(const part of ['real','imaginary']){
        const formal=formalDirect[component][part].roots[at],materialized=instantiateHarmonicBodies(G,formal,bindings),retained=actualDirect[component][part].roots[at],algebra=retainedCommonDenominatorIdentity(G,formal,factored[part]);
        fields[part]={algebra,materialized,retained,bodyDerivativeBinding:materialized===retained,pass:algebra.pass&&materialized===retained};
      }
      return {component,...fields,pass:fields.real.pass&&fields.imaginary.pass};
    })}));
  const allRecurrences=[...phaseRecurrenceChecks,...recurrenceChecks];
  if(allRecurrences.some(c=>!c.real.pass||!c.imaginary.pass)||jets.some(j=>j.checks.some(c=>!c.pass)))
    fail('INTERNAL_VALIDATION','The complete harmonic third jet lost a phase, repeated/mixed product term, or original trigonometric-body binding.');
  return {schema:'MathScope.ExactThirdHarmonicPotentialJets/1',coefficient:[...C],phase,k,directions:[...directions],indices,
    phaseBinding,coefficientBindings,exponentialJets:exponentialJets.map(p=>({...p,real:instantiateHarmonicBodies(G,p.real,bindings),imaginary:instantiateHarmonicBodies(G,p.imaginary,bindings)})),
    originalBodies,angle,sine,cosine,jets,phaseRecurrenceChecks,recurrenceChecks,pass:true,
    formulas:{complex:'partial^alpha(i*C*exp(i*k*Phi))=(A_alpha+i*B_alpha)*exp(i*k*Phi)',real:'A_alpha*cos(k*Phi)-B_alpha*sin(k*Phi)',imaginary:'A_alpha*sin(k*Phi)+B_alpha*cos(k*Phi)',
      recurrence:'(A_(alpha+e_i),B_(alpha+e_i))=(partial_i A_alpha-k*Phi_i*B_alpha,partial_i B_alpha+k*Phi_i*A_alpha)'},
    bodyBindingResponsibility:'Every C/Phi share derivative is materialized and checked by the caller here; the common-denominator helper only checks exact polynomial identities of those bound symbols.',
    regularity:'Real C and Phi are C3 on the declared common open slow chart and k is frozen. These are derivatives in the independent slow coordinates of the coefficient components in their retained cylindrical frame; physical basis differentiation is separate.',
    sourceAuthenticated:false,actualPhysicalSecondVelocityDerivativesConstructed:false,numericalEnclosureEvaluated:false,finiteApproximationSubstitutedForExactBody:false};
}
