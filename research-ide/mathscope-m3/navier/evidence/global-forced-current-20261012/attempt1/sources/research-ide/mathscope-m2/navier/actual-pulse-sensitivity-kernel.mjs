/** First slow-parameter variations of an explicitly retained Volterra ODE.
 * This additive kernel leaves the sealed covariance kernel untouched.
 * Bounds supplied to this generic algebra kernel are explicit premises;
 * only the actual-source adapter may authenticate them as source bounds.
 */
import {ActualCovarianceExpressions} from './actual-covariance-volterra.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap();
const keys=['name','variable','parameters','parameter','matrix','initial','left','length','matrixNorm','matrixDerivativeNorm','initialNorm','initialDerivativeNorm','leftDerivativeNorm'];
const snapshot=s=>JSON.stringify(s);

export class ActualPulseSensitivityExpressions extends ActualCovarianceExpressions {
  constructor(base,options={}){
    super(base,options);
    this.pulseSensitivitySystems=structuredClone(base.pulseSensitivitySystems??[]);
    this.pulseSensitivityPartials=new Map();
    this.pulseSensitivityAliases=new Map();
    seals.set(this,new Map());
  }
  definePulseFirstVariation(input){
    if(!input||Object.keys(input).some(k=>!keys.includes(k)))fail('INVALID_INPUT','A first variation needs its explicit coefficient, initial condition, endpoints and norm premises.');
    const {name,variable,parameters,parameter,matrix,initial,left,length,matrixNorm,initialNorm,initialDerivativeNorm,leftDerivativeNorm,matrixDerivativeNorm}=input;
    if(this.nodes[variable]?.op!=='coordinate'||!Array.isArray(parameters)||new Set(parameters).size!==parameters.length||parameters.includes(variable)||parameters.some(x=>this.nodes[x]?.op!=='coordinate')||!parameters.includes(parameter)||matrix?.length!==2||matrix.some(r=>r.length!==2||r.some(x=>!this.nodes[x]))||!Array.isArray(initial)||initial.length!==2||initial.some(x=>!this.nodes[x]))fail('INVALID_INPUT','Use a two-component explicit ODE and one declared independent parameter.');
    const normRoots=[matrixNorm,matrixDerivativeNorm,initialNorm,initialDerivativeNorm,leftDerivativeNorm];
    if([left,length,...normRoots].some(x=>!this.nodes[x]))fail('INVALID_INPUT','A first variation cannot omit a length or a norm premise.');
    for(const root of normRoots)if(this.isq(root)&&this.fraction(root)[0]<0n)fail('INVALID_INPUT','Norm bounds must be nonnegative.');
    if(this.isq(length)&&this.fraction(length)[0]<0n)fail('INVALID_INPUT','The declared interval length is nonnegative.');
    const all=new Set([variable,...parameters]),constants=new Set(parameters);
    if(matrix.flat().some(x=>[...this.freeCoordinates(x)].some(c=>!all.has(c))))fail('INVALID_INPUT','A matrix coefficient has an undeclared free coordinate.');
    if([...initial,left,length,...normRoots].some(x=>[...this.freeCoordinates(x)].some(c=>!constants.has(c))))fail('INVALID_INPUT','Initial data, endpoints and uniform bounds may only depend on the declared parameters.');
    // These are differentiated from the actual bodies; no derivative matrix,
    // zero-datum claim or endpoint derivative is accepted from the caller.
    const matrixDerivative=matrix.map(r=>r.map(x=>this.derivative(x,parameter)));
    const initialDerivative=initial.map(x=>this.derivative(x,parameter));
    const leftDerivative=this.derivative(left,parameter),lengthDerivative=this.derivative(length,parameter);
    const initialRhs=matrix.map(row=>this.add(...row.map((x,j)=>this.mul(this.substitute(x,variable,left),initial[j]))));
    const variationInitial=initialDerivative.map((x,j)=>this.sub(x,this.mul(initialRhs[j],leftDerivative)));
    const augmentedMatrix=[...matrix.map(row=>[...row,this.zero,this.zero]),...matrixDerivative.map((row,j)=>[...row,...matrix[j]])];
    const augmentedInitial=[...initial,...variationInitial],augmentedMatrixNorm=this.add(matrixNorm,matrixDerivativeNorm);
    const augmentedInitialNorm=this.maximum(initialNorm,this.add(initialDerivativeNorm,this.mul(matrixNorm,initialNorm,leftDerivativeNorm)));
    const s={name,variable,parameters:[...parameters],parameter,parameterIndex:parameters.indexOf(parameter),matrix:structuredClone(matrix),matrixDerivative,initial:[...initial],initialDerivative,left,length,leftDerivative,lengthDerivative,
      initialRhs,variationInitial,augmentedMatrix,augmentedInitial,
      bounds:{matrixNorm,matrixDerivativeNorm,initialNorm,initialDerivativeNorm,leftDerivativeNorm,augmentedMatrixNorm,augmentedInitialNorm},
      equations:{original:'w_v=M w, w(left(a),a)=g(a)',variation:'s_v=M s+(partial_a M) w',initial:'s(left(a),a)=g_a-M(left(a),a)g(a)*left_a',endpoint:'d_a w(b(a),a)=s(b(a),a)+M(b(a),a)w(b(a),a)*b_a'},
      derivativeOrder:1,independentParameterHeldFixedDuringTimeDerivative:true,sourceNormAuthenticated:false,secondSlowDerivativeSupported:false};
    const id=this.pulseSensitivitySystems.length;this.pulseSensitivitySystems.push(s);seals.get(this).set(id,snapshot(s));return id;
  }
  assertPulseFirstVariation(system){
    if(!seals.get(this)?.has(system)||snapshot(this.pulseSensitivitySystems[system])!==seals.get(this).get(system))fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally differentiated first-variation system.');
    return true;
  }
  bindOriginalCovarianceVariation(covarianceSystem,variationSystem){
    this.assertPulseFirstVariation(variationSystem);const c=this.covarianceSystems[covarianceSystem],s=this.pulseSensitivitySystems[variationSystem];
    if(!c||c.variable!==s.variable||snapshot(c.parameters)!==snapshot(s.parameters)||snapshot(c.matrix)!==snapshot(s.matrix)||snapshot(c.initial)!==snapshot(s.initial)||s.left!==this.zero||c.length!==s.length)fail('INVALID_SOURCE_CONSTRUCTION','The variation must preserve the genuine source covariance ODE, datum and interval.');
    const key=covarianceSystem+':'+s.parameterIndex;
    if(this.pulseSensitivityAliases.has(key))fail('INVALID_INPUT','This covariance parameter already has a first-variation system.');
    this.pulseSensitivityAliases.set(key,variationSystem);return true;
  }
  pulseSensitivityValue(system,component,time,values){
    const s=this.pulseSensitivitySystems[system];
    if(!s||!Number.isInteger(component)||component<0||component>3||!this.nodes[time]||!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!this.nodes[x]))fail('INVALID_INPUT','Unknown first-variation component or incomplete explicit arguments.');
    const at=x=>this.simultaneousSubstitute(x,s.parameters,values);
    if(time===at(s.left))return at(s.augmentedInitial[component]);
    return this.node('actual_pulse_sensitivity_volterra',[system,component,time,[...values]]);
  }
  pulseSensitivityRhs(system,component,time,values){
    const s=this.pulseSensitivitySystems[system];if(!s)fail('INVALID_INPUT','Unknown first-variation system.');
    return this.add(...s.augmentedMatrix[component].map((x,j)=>this.mul(this.simultaneousSubstitute(x,[s.variable,...s.parameters],[time,...values]),this.pulseSensitivityValue(system,j,time,values))));
  }
  pulseSensitivityPartialSum(system,{terms=1,time,values}={}){
    this.assertPulseFirstVariation(system);const s=this.pulseSensitivitySystems[system];
    if(!Number.isSafeInteger(terms)||terms<0||terms>32)fail('RESOURCE_LIMIT','Display zero through 32 finite ordered-integral terms; the nonzero factorial tail remains separate.');
    time??=s.variable;values??=s.parameters;
    if(!this.nodes[time]||!Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!this.nodes[x]))fail('INVALID_INPUT','Supply the time and all declared parameters.');
    const key=snapshot([system,terms,time,values]);if(this.pulseSensitivityPartials.has(key))return this.pulseSensitivityPartials.get(key);
    let term=[...s.augmentedInitial],sum=[...term];const rows=[];
    for(let n=1;n<=terms;n++){
      this.checkCancelled?.();const t=this.fresh('pulse_sensitivity_ordered_time'),at=x=>this.substitute(x,s.variable,t);
      term=s.augmentedMatrix.map(row=>this.integral(this.add(...row.map((x,j)=>this.mul(at(x),at(term[j])))),t,s.left,s.variable));
      sum=sum.map((x,j)=>this.add(x,term[j]));rows.push({order:n,term:[...term]});
    }
    const replace=x=>this.simultaneousSubstitute(x,[s.variable,...s.parameters],[time,...values]),K=replace(s.bounds.augmentedMatrixNorm),L=replace(s.length),I=replace(s.bounds.augmentedInitialNorm),z=this.mul(K,L);
    const tail=this.mul(I,this.exp(z),this.pow(z,terms+1),this.q(1,factorial(terms+1)));
    const result={system,terms,values:sum.map(replace),rows:rows.map(r=>({...r,term:r.term.map(replace)})),tail,
      tailFormula:'I*exp((K+Ka)*L)*((K+Ka)*L)^(N+1)/(N+1)!',tailTendsToZero:true,validInterval:'left<=time<=left+L',
      boundPremises:structuredClone(s.bounds),finiteSumIsExactSolution:false,derivativeOrder:1};
    this.pulseSensitivityPartials.set(key,result);return result;
  }
  freeCoordinates(id){const n=this.nodes[id];if(n?.op==='actual_pulse_sensitivity_volterra'){const out=new Set();for(const x of [n.args[2],...n.args[3]])for(const c of this.freeCoordinates(x))out.add(c);return out;}return super.freeCoordinates(id);}
  dependsOn(id,variable){if(this.nodes[id]?.op==='actual_pulse_sensitivity_volterra')return this.freeCoordinates(id).has(variable);return super.dependsOn(id,variable);}
  substitute(id,variable,value){const n=this.nodes[id];if(n?.op==='actual_pulse_sensitivity_volterra')return this.pulseSensitivityValue(n.args[0],n.args[1],this.substitute(n.args[2],variable,value),n.args[3].map(x=>this.substitute(x,variable,value)));return super.substitute(id,variable,value);}
  derivative(id,variable){
    const n=this.nodes[id];
    if(!this.dependsOn(id,variable))return this.zero;
    if(n?.op==='actual_covariance_volterra'){
      const [system,component,time,values]=n.args,dp=values.map(x=>this.derivative(x,variable)),dt=this.derivative(time,variable),terms=[];
      if(dt!==this.zero)terms.push(this.mul(dt,this.covarianceRhs(system,component,time,values)));
      for(let j=0;j<dp.length;j++)if(dp[j]!==this.zero){
        const variation=this.pulseSensitivityAliases.get(system+':'+j);
        if(variation===undefined)fail('UNSUPPORTED','Only the explicitly constructed first slow parameter variation is supported; no missing parameter derivative is zero.');
        this.assertPulseFirstVariation(variation);terms.push(this.mul(dp[j],this.pulseSensitivityValue(variation,component+2,time,values)));
      }
      return this.add(...terms);
    }
    if(n?.op!=='actual_pulse_sensitivity_volterra')return super.derivative(id,variable);
    const [system,component,time,values]=n.args,s=this.pulseSensitivitySystems[system],dp=values.map(x=>this.derivative(x,variable)),dt=this.derivative(time,variable),terms=[];
    if(dt!==this.zero)terms.push(this.mul(dt,this.pulseSensitivityRhs(system,component,time,values)));
    for(let j=0;j<dp.length;j++)if(dp[j]!==this.zero){
      if(component>=2||j!==s.parameterIndex)fail('UNSUPPORTED','Second or unconstructed mixed slow derivatives need another variational system.');
      terms.push(this.mul(dp[j],this.pulseSensitivityValue(system,component+2,time,values)));
    }
    return this.add(...terms);
  }
  pack(roots,extra={}){return super.pack(roots,{pulseSensitivitySystems:structuredClone(this.pulseSensitivitySystems),pulseSensitivityKernel:{schema:'MathScope.ActualPulseSensitivityKernel/1',firstSlowDerivativeSupported:true,secondSlowDerivativeSupported:false,
    originalCovarianceKernelUnchanged:true,initialDerivativeAndMovingLeftEndpointRetained:true,movingEvaluationEndpointChainRuleRetained:true,sourceNormAuthenticationInAdapter:true,finitePartialSumIsExactSolution:false},...extra});}
}
