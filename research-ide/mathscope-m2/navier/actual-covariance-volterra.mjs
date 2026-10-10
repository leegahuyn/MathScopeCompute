/** Explicit Volterra limits for the actual two-component pulse.
 * Each operation retains its matrix, independent parameters, norm bound and
 * finite ordered-integral producer. A displayed finite sum is never the
 * exact solution. Authentication of the coefficient bound belongs to the
 * actual-source caller, not this general integration kernel.
 */
import {ActualInductionExpressions} from './actual-residual-order-induction-expressions.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

export class ActualCovarianceExpressions extends ActualInductionExpressions {
  constructor(base,options={}){super(base,options);this.covarianceSystems=structuredClone(base.covarianceSystems??[]);this.covariancePartialSums=new Map();}
  defineCovarianceVolterra({name,variable,parameters,matrix,normUpper,length}){
    if(this.nodes[variable]?.op!=='coordinate'||!Array.isArray(parameters)||new Set(parameters).size!==parameters.length||parameters.includes(variable)||parameters.some(x=>this.nodes[x]?.op!=='coordinate')||matrix?.length!==2||matrix.some(r=>r.length!==2||r.some(x=>!this.nodes[x]))||!this.nodes[normUpper]||!this.nodes[length])fail('INVALID_INPUT','A pulse Volterra operation needs its explicit 2x2 matrix, coordinates and finite interval/norm.');
    const declared=new Set([variable,...parameters]),constants=new Set(parameters);
    if(matrix.flat().some(root=>[...this.freeCoordinates(root)].some(c=>!declared.has(c))))fail('INVALID_INPUT','A Volterra coefficient has an undeclared free coordinate.');
    if([normUpper,length].some(root=>[...this.freeCoordinates(root)].some(c=>!constants.has(c))))fail('INVALID_INPUT','The uniform norm and interval length must depend only on the explicit parameters, never on pulse time or a hidden coordinate.');
    const id=this.covarianceSystems.length;
    this.covarianceSystems.push({name,variable,parameters:[...parameters],matrix:structuredClone(matrix),normUpper,length,initial:[this.one,this.zero],
      implementation:'actual-covariance-volterra.mjs:covariancePartialSum',
      derivativeImplementation:'actual-covariance-volterra.mjs:covarianceRhs',
      solution:'w(v)=e1+sum_(n>=1) integral_(0<s_n<...<s_1<v) M(s_1)...M(s_n)e1 ds',
      normConvention:'Induced infinity matrix norm, uniform over the declared interval and parameters.',
      coefficientNormMustBeBoundBySource:true,displayedPartialSumIsExactSolution:false});return id;
  }
  covarianceValue(system,component,v,values){
    const s=this.covarianceSystems[system];
    if(!s||![0,1].includes(component)||!this.nodes[v]||!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!this.nodes[x]))fail('INVALID_INPUT','Unknown explicit covariance Volterra component or parameter list.');
    if(v===this.zero)return s.initial[component];
    return this.node('actual_covariance_volterra',[system,component,v,[...values]]);
  }
  covarianceRhs(system,component,v,values){
    const s=this.covarianceSystems[system];if(!s)fail('INVALID_INPUT','Unknown actual pulse system.');
    return this.add(...s.matrix[component].map((a,j)=>this.mul(this.simultaneousSubstitute(a,[s.variable,...s.parameters],[v,...values]),this.covarianceValue(system,j,v,values))));
  }
  covariancePartialSum(system,{terms=1,v,values}={}){
    const s=this.covarianceSystems[system];if(!s||!Number.isSafeInteger(terms)||terms<0||terms>32)fail('RESOURCE_LIMIT','Choose zero through32 displayed exact Volterra terms. A missing tail is never reported as zero.');
    v??=s.variable;values??=s.parameters;
    if(!this.nodes[v]||!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!this.nodes[x]))fail('INVALID_INPUT','A finite Volterra term needs its declared time and all explicit parameter values.');
    const key=JSON.stringify([system,terms,v,values]);if(this.covariancePartialSums.has(key))return this.covariancePartialSums.get(key);
    let term=[...s.initial],sum=[...term];const rows=[];
    for(let n=1;n<=terms;n++){
      this.checkCancelled?.();const t=this.fresh('actual_covariance_ordered_time'),at=x=>this.substitute(x,s.variable,t);
      term=s.matrix.map(row=>this.integral(this.add(...row.map((a,j)=>this.mul(at(a),at(term[j])))),t,this.zero,s.variable));
      sum=sum.map((a,j)=>this.add(a,term[j]));rows.push({order:n,term:[...term]});
    }
    const replace=x=>this.simultaneousSubstitute(x,[s.variable,...s.parameters],[v,...values]),K=replace(s.normUpper),length=replace(s.length),z=this.mul(K,length),tail=this.mul(this.exp(z),this.pow(z,terms+1),this.q(1,factorial(terms+1)));
    const result={system,terms,values:sum.map(replace),rows:rows.map(r=>({...r,term:r.term.map(replace)})),tail,
      tailFormula:'exp(K*L)*(K*L)^(N+1)/(N+1)!',tailValidOnWholeInterval:true,
      tailTendsToZero:true,coefficientNormPremise:s.normUpper,exactLimitUsedByFunctionOperation:true,
      finiteSumClaimedExact:false};this.covariancePartialSums.set(key,result);return result;
  }
  freeCoordinates(id){const n=this.nodes[id];if(n?.op==='actual_covariance_volterra'){const out=new Set();for(const x of [n.args[2],...n.args[3]])for(const y of this.freeCoordinates(x))out.add(y);return out;}return super.freeCoordinates(id);}
  dependsOn(id,variable){if(this.nodes[id]?.op==='actual_covariance_volterra')return this.freeCoordinates(id).has(variable);return super.dependsOn(id,variable);}
  substitute(id,variable,value){const n=this.nodes[id];if(n?.op==='actual_covariance_volterra')return this.covarianceValue(n.args[0],n.args[1],this.substitute(n.args[2],variable,value),n.args[3].map(x=>this.substitute(x,variable,value)));return super.substitute(id,variable,value);}
  derivative(id,variable){
    const n=this.nodes[id];if(n?.op!=='actual_covariance_volterra')return super.derivative(id,variable);
    const [system,component,v,values]=n.args,dp=values.map(x=>this.derivative(x,variable));
    if(dp.some(x=>x!==this.zero))fail('UNSUPPORTED','Use a differentiated variational Volterra system for a slow-parameter derivative; it is not set to zero.');
    const dv=this.derivative(v,variable);return dv===this.zero?this.zero:this.mul(dv,this.covarianceRhs(system,component,v,values));
  }
  pack(roots,extra={}){return super.pack(roots,{covarianceSystems:structuredClone(this.covarianceSystems),covarianceKernel:{schema:'MathScope.ActualCovarianceVolterraKernel/1',partialSumImplementation:'actual-covariance-volterra.mjs:covariancePartialSum',rhsImplementation:'actual-covariance-volterra.mjs:covarianceRhs',factorialTail:'exp(KL)*(KL)^(N+1)/(N+1)!',sourceNormAuthenticationInCaller:true,exactLimitNotFiniteSum:true,slowDerivativeMaterializationSupported:false},...extra});}
}
