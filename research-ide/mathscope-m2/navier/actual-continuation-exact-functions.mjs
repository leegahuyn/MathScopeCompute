/** A functional program whose natural-series operation has an implemented
 * coefficient producer and a genuine source convergence modulus.
 *
 * An unevaluated infinite series is distinct from its finite coefficient
 * graph and from a numerical enclosure. The operation below is never sent
 * to the finite diagnostic interpreter as though it were a machine number.
 */
import {ActualSourceExpressions} from './actual-global-source-expressions.mjs';
import {prepareActualNaturalCoreProgram} from './actual-continuation-exact-core.mjs';
import {actualNaturalScaledTail,actualNaturalRefinementModulus} from './actual-continuation-exact-tail.mjs';
import {SOURCE_PROFILE_ID} from './source-profile.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export class ActualConvergentExpressions extends ActualSourceExpressions {
  constructor(profileId=SOURCE_PROFILE_ID){
    super(profileId);
    const prepared=prepareActualNaturalCoreProgram({sourceProfile:profileId,degree:0});
    this.nodes=structuredClone(prepared.G.nodes);this.lookup=new Map(this.nodes.map((n,i)=>[JSON.stringify([n.op,n.args]),i]));
    this.serial=prepared.G.serial;this.core=prepared.rootFields;this.outer=prepared.outer;this.pressure=prepared.pressure;
    this.quadraticSystems=[];this.quadraticDerivativeCache=new Map();this.monotoneSystems=[];this.monotoneDerivativeCache=new Map();this.picardSystems=[];this.picardDerivativeCache=new Map();this.naturalAxisCache=new Map();this.expressionSystems=[];this.expressionMaterializations=new Map();
    this.naturalKernel={implementation:'actual-continuation-exact-functions.mjs:materializeActualNaturalSeries',coefficientImplementation:'actual-continuation-exact-core.mjs:prepareActualNaturalCoreProgram',tailImplementation:'actual-continuation-exact-tail.mjs:actualNaturalScaledTail',modulusImplementation:'actual-continuation-exact-tail.mjs:actualNaturalRefinementModulus',sourceEquations:['B.14','B.15','SAME_DATUM_ANALYTIC_AXIS.md (18)–(20)'],actualPressureRoot:this.core.P0,actualPositiveGRoot:this.core.g,coefficientNormUpper:'Q',coefficientSpace:'B_rho, radial base 20',fixedComparisonFloor:false,meaning:'Limit of the exact generated radial coefficient partial sums. Each finite partial sum is a complete A.21/g expression graph. The explicit B_rho tail tends to zero.',numericWholeSeriesEvaluated:false};
  }
  natural(component,Y,eta=this.core.eta,radialOrder=0,etaOrder=0){
    if(!['Phi','u','average'].includes(component))fail('INVALID_INPUT','Unknown actual natural component.');
    if(!Number.isSafeInteger(radialOrder)||radialOrder<0||radialOrder>12||!Number.isSafeInteger(etaOrder)||etaOrder<0||etaOrder>12)fail('RESOURCE_LIMIT','Natural functional derivatives are generated through order twelve; no top derivative is set to zero.');
    if(Y===this.zero)return this.naturalAxisDerivative(component,eta,radialOrder,etaOrder);
    return this.node('actual_natural_series',[component,Y,eta,radialOrder,etaOrder]);
  }
  naturalAxisDerivative(component,eta,k,m){
    if(k===0)return component==='Phi'&&m===0?this.one:this.zero;
    const key=[component,eta,k,m].join(':');if(this.naturalAxisCache.has(key))return this.naturalAxisCache.get(key);
    const prepared=prepareActualNaturalCoreProgram({sourceProfile:this.source.id??SOURCE_PROFILE_ID,degree:k}),map=new Map();
    const copy=id=>{if(map.has(id))return map.get(id);const n=prepared.G.nodes[id];let args=n.args;
      if(!['rational','coordinate','source_parameter'].includes(n.op))args=['integer_power','source_step_derivative'].includes(n.op)?[copy(args[0]),args[1]]:args.map(copy);
      const out=this.node(n.op,args);map.set(id,out);return out;};
    let value=copy(prepared.coefficients[component][k]),factorial=1n;for(let j=2;j<=k;j++)factorial*=BigInt(j);
    for(let j=0;j<m;j++)value=this.derivative(value,this.core.eta);
    value=this.mul(this.q(factorial),this.substitute(value,this.core.eta,eta));this.naturalAxisCache.set(key,value);return value;
  }
  sine(x){return x===this.zero?this.zero:this.node('sine',[x]);}
  cosine(x){return x===this.zero?this.one:this.node('cosine',[x]);}
  sqrt(x){return x===this.zero||x===this.one?x:super.sqrt(x);}
  captureFunctionDefinitions(){
    return {quadraticCount:this.quadraticSystems.length,monotoneCount:this.monotoneSystems.length,picardCount:this.picardSystems.length,expressionCount:this.expressionSystems.length,
      quadratic:JSON.stringify(this.quadraticSystems),monotone:JSON.stringify(this.monotoneSystems),picard:JSON.stringify(this.picardSystems),
      expression:JSON.stringify(this.expressionSystems),
      fixed:JSON.stringify({source:this.source,core:this.core,pressure:this.pressure,outer:this.outer,naturalKernel:this.naturalKernel})};
  }
  functionDefinitionsUnchanged(snapshot){
    return JSON.stringify(this.quadraticSystems.slice(0,snapshot.quadraticCount))===snapshot.quadratic&&JSON.stringify(this.monotoneSystems.slice(0,snapshot.monotoneCount))===snapshot.monotone&&JSON.stringify(this.picardSystems.slice(0,snapshot.picardCount))===snapshot.picard&&JSON.stringify(this.expressionSystems.slice(0,snapshot.expressionCount))===snapshot.expression&&JSON.stringify({source:this.source,core:this.core,pressure:this.pressure,outer:this.outer,naturalKernel:this.naturalKernel})===snapshot.fixed;
  }
  dependsOn(id,variable){
    if(id===variable)return true;
    this.dependencyCache??=new Map();const key=id+':'+variable;if(this.dependencyCache.has(key))return this.dependencyCache.get(key);
    const {op,args}=this.nodes[id];let children=[];
    if(['rational','source_parameter','coordinate'].includes(op))children=[];
    else if(['integer_power','source_step_derivative'].includes(op))children=[args[0]];
    else if(op==='actual_natural_series')children=[args[1],args[2]];
    else if(op==='actual_quadratic_root')children=[args[2]];
    else if(op==='actual_monotone_root')children=args.slice(1);
    else if(op==='actual_expression_partial')children=args[1];
    else if(op==='actual_background_picard'||op==='actual_background_even_profile')children=[args[2],args[3]];
    else if(op==='definite_integral')children=args[1]===variable?[args[2],args[3]]:[args[0],args[2],args[3]];
    else children=args;
    const result=children.some(id=>this.dependsOn(id,variable));this.dependencyCache.set(key,result);return result;
  }
  integral(body,variable,left,right){
    if(this.nodes[variable]?.op!=='coordinate')fail('INVALID_INPUT','An integration variable must be a coordinate.');
    if(body===this.zero||left===right)return this.zero;
    // This exact reduction is especially important for even-profile jets
    // at the axis. A constant in the bound variable has no quadrature tail.
    if(!this.dependsOn(body,variable))return this.mul(body,this.sub(right,left));
    const polynomial=this.polynomialIn(body,variable);
    if(polynomial)return this.add(...[...polynomial].map(([degree,coefficient])=>this.mul(this.div(coefficient,this.q(degree+1)),this.sub(this.pow(right,degree+1),this.pow(left,degree+1)))));
    return super.integral(body,variable,left,right);
  }
  polynomialIn(id,variable){
    this.polynomialCache??=new Map();const key=id+':'+variable;if(this.polynomialCache.has(key))return this.polynomialCache.get(key);
    const {op,args}=this.nodes[id];let out=null;
    if(!this.dependsOn(id,variable))out=new Map([[0,id]]);
    else if(id===variable)out=new Map([[1,this.one]]);
    else if(op==='add'){
      const a=this.polynomialIn(args[0],variable),b=this.polynomialIn(args[1],variable);
      if(a&&b){out=new Map(a);for(const[k,v]of b)out.set(k,this.add(out.get(k)??this.zero,v));}
    }else if(op==='multiply'){
      const a=this.polynomialIn(args[0],variable),b=this.polynomialIn(args[1],variable);
      if(a&&b&&Math.max(...a.keys())+Math.max(...b.keys())<=16){out=new Map();for(const[i,u]of a)for(const[j,v]of b)out.set(i+j,this.add(out.get(i+j)??this.zero,this.mul(u,v)));}
    }else if(op==='integer_power'&&args[1]>=0&&args[1]<=16){
      const a=this.polynomialIn(args[0],variable);
      if(a&&Math.max(...a.keys())*args[1]<=16){out=new Map([[0,this.one]]);for(let k=0;k<args[1];k++){const b=new Map();for(const[i,u]of out)for(const[j,v]of a)b.set(i+j,this.add(b.get(i+j)??this.zero,this.mul(u,v)));out=b;}}
    }
    this.polynomialCache.set(key,out);return out;
  }
  /** A shared, completely specified expression with explicit AD. This keeps
   * a large actual nested integral from being duplicated at every eta jet.
   * The body is mandatory; materialization uses the same derivative rules.
   */
  defineExpressionFunction({name,parameters,body,derivativeLimits}){
    if(!Array.isArray(parameters)||!parameters.length||parameters.some(id=>this.nodes[id]?.op!=='coordinate')||new Set(parameters).size!==parameters.length||!this.nodes[body]||!Array.isArray(derivativeLimits)||derivativeLimits.length!==parameters.length||derivativeLimits.some(n=>!Number.isSafeInteger(n)||n<0||n>12))fail('INVALID_INPUT','A shared expression function requires its explicit body, distinct coordinates and finite derivative limits.');
    const free=this.freeCoordinates(body);if([...free].some(id=>!parameters.includes(id)))fail('INVALID_INPUT','Every free coordinate of a shared expression body must be an explicit parameter. Bound integral coordinates are local.');
    const id=this.expressionSystems.length;this.expressionSystems.push({name,parameters:[...parameters],body,derivativeLimits:[...derivativeLimits],implementation:'actual-continuation-exact-functions.mjs:materializeExpressionFunction',unspecifiedOracle:false});return id;
  }
  freeCoordinates(id){
    this.freeCoordinateCache??=new Map();if(this.freeCoordinateCache.has(id))return this.freeCoordinateCache.get(id);
    const {op,args}=this.nodes[id];let children=[],out=new Set();
    if(op==='coordinate')out.add(id);
    else if(['rational','source_parameter'].includes(op)){}
    else if(op==='definite_integral'){
      for(const c of this.freeCoordinates(args[0]))if(c!==args[1])out.add(c);
      for(const k of [2,3])for(const c of this.freeCoordinates(args[k]))out.add(c);
    }else{
      if(['integer_power','source_step_derivative'].includes(op))children=[args[0]];
      else if(op==='actual_natural_series')children=[args[1],args[2]];
      else if(op==='actual_quadratic_root')children=[args[2]];
      else if(op==='actual_monotone_root')children=args.slice(1);
      else if(op==='actual_expression_partial')children=args[1];
      else if(op==='actual_background_picard'||op==='actual_background_even_profile')children=[args[2],args[3]];
      else children=args;
      for(const child of children)for(const c of this.freeCoordinates(child))out.add(c);
    }
    this.freeCoordinateCache.set(id,out);return out;
  }
  expressionValue(system,values,orders=null){
    const s=this.expressionSystems[system];orders??=s?.parameters.map(()=>0);
    if(!s||!Array.isArray(values)||values.length!==s.parameters.length||values.some(id=>!this.nodes[id])||!Array.isArray(orders)||orders.length!==values.length||orders.some((n,j)=>!Number.isSafeInteger(n)||n<0||n>s.derivativeLimits[j]))fail('RESOURCE_LIMIT','Unknown shared expression function or unsupported mixed derivative.');
    return this.node('actual_expression_partial',[system,[...values],[...orders]]);
  }
  materializeExpressionFunction(system,values,orders=null){
    const node=this.expressionValue(system,values,orders),s=this.expressionSystems[system];if(this.expressionMaterializations.has(node))return this.expressionMaterializations.get(node);
    let body=s.body;for(let j=0;j<s.parameters.length;j++)for(let k=0;k<this.nodes[node].args[2][j];k++)body=this.derivative(body,s.parameters[j]);
    const out=this.simultaneousSubstitute(body,s.parameters,values);this.expressionMaterializations.set(node,out);return out;
  }
  sourcePositiveGeometry(id){
    const n=this.nodes[id];
    if(n.op==='rational')return BigInt(n.args[0])>0n;
    if(n.op==='exp')return true;
    if(n.op==='source_parameter')return ['Xa','XR','Xsep','loopILeft','loopIRight','X0I1','I1Right','X0Ipos','IposRight','Lambda','t1'].includes(n.args[0]);
    if(n.op==='multiply')return n.args.every(v=>this.sourcePositiveGeometry(v));
    if(n.op==='sqrt_positive'||n.op==='inverse')return this.sourcePositiveGeometry(n.args[0]);
    return false;
  }
  ceiling(x){if(this.isq(x)){const[n,d]=this.fraction(x);return this.q(n/d+(n>0n&&n%d?1n:0n));}return this.node('ceiling',[x]);}
  maximum(...xs){if(!xs.length)fail('INVALID_INPUT','A maximum needs operands.');return this.node('maximum',xs);}
  definePicardSystem(system){
    if(system.diagonal?.length!==6||system.A0?.length!==6||system.A1?.length!==6||system.forcing?.length!==6||system.A0.some(r=>r.length!==6)||system.A1.some(r=>r.length!==6)||this.nodes[system.xi]?.op!=='coordinate'||system.eta!==this.core.eta)fail('INVALID_INPUT','An explicit six-component source Picard system is required.');
    if(system.diagonal.some((v,i)=>v!==[0,0,2,0,3,1][i]))fail('INVALID_INPUT','Use the original singular diagonal.');
    for(let i=0;i<6;i++)for(let j=0;j<6;j++)if(system.A1[i][j]!==this.zero&&(i<4||j>=4))fail('INVALID_INPUT','The source A1 block mask, including its nilpotent products, must be retained.');
    const id=this.picardSystems.length;this.picardSystems.push(system);return id;
  }
  picardRoot(system,component,xi,eta=this.core.eta,etaOrder=0){
    if(!this.picardSystems[system]||!Number.isInteger(component)||component<0||component>5||!Number.isSafeInteger(etaOrder)||etaOrder<0||etaOrder>12)fail('RESOURCE_LIMIT','Unknown Picard component or unsupported eta derivative order.');
    if(xi===this.zero)return this.zero; // the original zero axis datum, for every eta
    return this.node('actual_background_picard',[system,component,xi,eta,etaOrder]);
  }
  picardEven(system,component,X,eta=this.core.eta,radialOrder=0,etaOrder=0){
    if(!this.picardSystems[system]||!Number.isInteger(component)||component<0||component>3||!Number.isSafeInteger(radialOrder)||radialOrder<0||radialOrder>4||!Number.isSafeInteger(etaOrder)||etaOrder<0||etaOrder>8)fail('RESOURCE_LIMIT','The even X profile kernel supports first-four Picard coordinates, radial order zero through four and eta order zero through eight.');
    if(X===this.zero){if(radialOrder===0)return this.zero;return this.materializePicardEvenDerivative(system,component,X,eta,radialOrder,etaOrder);}
    return this.node('actual_background_even_profile',[system,component,X,eta,radialOrder,etaOrder]);
  }
  materializePicardEvenDerivative(system,component,X,eta=this.core.eta,radialOrder=0,etaOrder=0){
    const s=this.picardSystems[system];if(!s||component<0||component>3||radialOrder<0||radialOrder>4)fail('INVALID_INPUT','Use the source even-profile kernel within its stated derivative range.');
    if(radialOrder===0)return this.picardRoot(system,component,this.sqrt(X),eta,etaOrder);
    if(X===this.zero&&radialOrder===1){
      // Write W=sum w_j xi^j. Since w_0=0, the original singular
      // ODE gives w_1=f(0)/(1+c), then
      // (2+c_i)w_2i=f_i'(0)+(A0(0)w_1+A1(0)d_eta w_1)_i.
      // The even profile's first X derivative is exactly w_2. Evaluate
      // these coefficients before expanding irrelevant high derivatives.
      const first=s.forcing.map((f,i)=>this.div(this.substitute(f,s.xi,this.zero),this.q(1+s.diagonal[i])));
      const known=this.derivativeAt(s.forcing[component],s.xi,this.zero);
      let coefficient=this.div(this.add(known,...s.A0[component].map((a,j)=>this.mul(this.substitute(a,s.xi,this.zero),first[j])),...s.A1[component].map((a,j)=>a===this.zero?this.zero:this.mul(this.substitute(a,s.xi,this.zero),this.derivative(first[j],s.eta)))),this.q(2+s.diagonal[component]));
      for(let j=0;j<etaOrder;j++)coefficient=this.derivative(coefficient,s.eta);
      return this.substitute(coefficient,s.eta,eta);
    }
    let body=this.picardRoot(system,component,s.xi,s.eta,etaOrder);
    for(let j=0;j<2*radialOrder;j++)body=this.derivative(body,s.xi);
    // If f is even, d_X^k f(sqrt(X)) equals 2^-k times a k-fold
    // integral of f^(2k)(sqrt(X)*product(t_j)), with factors
    // t_j^(2*(k-1-j)). This is regular even at X=0.
    const variables=Array.from({length:radialOrder},()=>this.fresh('actual_even_X_derivative'));
    body=this.simultaneousSubstitute(body,[s.xi,s.eta],[this.mul(this.sqrt(X),...variables),eta]);
    body=this.mul(body,...variables.map((t,j)=>this.pow(t,2*(radialOrder-1-j))));
    for(const t of variables)body=this.integral(body,t,this.zero,this.one);
    return this.mul(this.q(1,1n<<BigInt(radialOrder)),body);
  }
  picardRhs(system,component,xi,eta,etaOrder=0){
    const key=['rhs',system,component,xi,eta,etaOrder].join(':');if(this.picardDerivativeCache.has(key))return this.picardDerivativeCache.get(key);
    const s=this.picardSystems[system],at=(id,m=0)=>{for(let k=0;k<m;k++)id=this.derivative(id,s.eta);return this.simultaneousSubstitute(id,[s.xi,s.eta],[xi,eta]);};
    let out=at(s.forcing[component],etaOrder),binomial=1n;
    for(let k=0;k<=etaOrder;k++){
      if(k)binomial=binomial*BigInt(etaOrder-k+1)/BigInt(k);
      for(let j=0;j<6;j++){
        if(s.A0[component][j]!==this.zero)out=this.add(out,this.mul(this.q(binomial),at(s.A0[component][j],k),this.picardRoot(system,j,xi,eta,etaOrder-k)));
        if(s.A1[component][j]!==this.zero)out=this.add(out,this.mul(this.q(binomial),at(s.A1[component][j],k),this.picardRoot(system,j,xi,eta,etaOrder-k+1)));
      }
    }
    this.picardDerivativeCache.set(key,out);return out;
  }
  picardRadialDerivative(system,component,xi,eta,etaOrder=0){
    const key=['radial',system,component,xi,eta,etaOrder].join(':');if(this.picardDerivativeCache.has(key))return this.picardDerivativeCache.get(key);
    const s=this.picardSystems[system],rhs=this.picardRhs(system,component,xi,eta,etaOrder),c=s.diagonal[component];
    // W_i/xi = integral_0^1 t^c_i rhs_i(t xi)dt is regular at xi=0.
    // Using this identity avoids a spurious singular division at the axis.
    let out=rhs;
    if(c){const t=this.fresh('actual_Picard_radial_average');out=this.sub(rhs,this.mul(this.q(c),this.integral(this.mul(this.pow(t,c),this.picardRhs(system,component,this.mul(t,xi),eta,etaOrder)),t,this.zero,this.one)));}
    this.picardDerivativeCache.set(key,out);return out;
  }
  picardPartialSum(system,count=1){
    const s=this.picardSystems[system];if(!s||!Number.isSafeInteger(count)||count<0||count>8)fail('RESOURCE_LIMIT','A displayed Picard partial sum contains zero through eight exact terms; this is not the enormous certified source truncation index.');
    const diagonalInverse=rows=>rows.map((f,i)=>{if(f===this.zero)return this.zero;const t=this.fresh('actual_Picard_G');return this.mul(s.xi,this.integral(this.mul(this.pow(t,s.diagonal[i]),this.substitute(f,s.xi,this.mul(t,s.xi))),t,this.zero,this.one));});
    let term=diagonalInverse(s.forcing),sum=Array(6).fill(this.zero);const terms=[];
    for(let k=0;k<count;k++){
      terms.push(term);sum=sum.map((v,i)=>this.add(v,term[i]));
      if(k+1<count)term=diagonalInverse(s.A0.map((row,i)=>this.add(...row.map((v,j)=>this.mul(v,term[j])),...s.A1[i].map((v,j)=>v===this.zero?this.zero:this.mul(v,this.derivative(term[j],s.eta))))));
    }
    return {sum,terms,count,finiteTermsAreExactExpressions:true,finitePartialSumIsExactSolution:false,errorBoundForTheseDisplayedTerms:null,sourceCertifiedTail:s.tail};
  }
  simultaneousSubstitute(id,variables,values){
    const pairs=variables.map((v,i)=>[v,values[i]]).filter(([v,w])=>v!==w);
    if(!pairs.length)return id;if(pairs.length===1)return this.substitute(id,...pairs[0]);
    const temporary=pairs.map(()=>this.fresh('capture_free_argument'));
    pairs.forEach(([v],i)=>{id=this.substitute(id,v,temporary[i]);});
    pairs.forEach(([,w],i)=>{id=this.substitute(id,temporary[i],w);});return id;
  }
  /** Chain rule at a point, with exact zero factors evaluated first. This
   * avoids expanding a derivative which is multiplied by the exact axis
   * factor xi=0. It does not replace a nonzero source derivative by zero. */
  derivativeAt(id,variable,point){
    this.pointDerivativeCache??=new Map();const key=id+':'+variable+':'+point;if(this.pointDerivativeCache.has(key))return this.pointDerivativeCache.get(key);
    const {op,args}=this.nodes[id],at=v=>this.substitute(v,variable,point),da=v=>this.derivativeAt(v,variable,point);let out;
    if(!this.dependsOn(id,variable))out=this.zero;
    else if(op==='coordinate')out=id===variable?this.one:this.zero;
    else if(op==='add')out=this.add(da(args[0]),da(args[1]));
    else if(op==='multiply'){
      const a=at(args[0]),b=at(args[1]);out=this.add(b===this.zero?this.zero:this.mul(da(args[0]),b),a===this.zero?this.zero:this.mul(a,da(args[1])));
    }else if(op==='integer_power')out=args[1]===0?this.zero:this.mul(this.q(args[1]),this.pow(at(args[0]),args[1]-1),da(args[0]));
    else if(op==='smooth_piecewise'){
      const coordinate=at(args[0]),left=at(args[1]),right=at(args[2]);
      if(coordinate===left||coordinate===this.zero&&this.sourcePositiveGeometry(left))out=da(args[3]);
      else if(coordinate===right)out=da(args[5]);
      else out=at(this.derivative(id,variable));
    }else out=at(this.derivative(id,variable));
    this.pointDerivativeCache.set(key,out);return out;
  }
  defineMonotoneSystem(system){
    if(!Array.isArray(system.parameters)||!system.parameters.length||new Set(system.parameters).size!==system.parameters.length||system.parameters.includes(system.variable)||this.nodes[system.variable]?.op!=='coordinate'||system.parameters.some(v=>this.nodes[v]?.op!=='coordinate'))fail('INVALID_INPUT','A monotone root needs a bound coordinate and distinct explicit parameter coordinates.');
    for(const name of ['body','left','right','derivativeLower','derivativeUpper'])if(!this.nodes[system[name]])fail('INVALID_INPUT','Missing monotone-root operand '+name);
    const id=this.monotoneSystems.length;this.monotoneSystems.push(system);return id;
  }
  monotoneRoot(system,values){
    if(!this.monotoneSystems[system]||values.length!==this.monotoneSystems[system].parameters.length)fail('INVALID_INPUT','Unknown actual monotone root or wrong argument count.');
    return this.node('actual_monotone_root',[system,...values]);
  }
  monotoneRootPartial(system,index,values){
    const key=system+':'+index+':'+values.join(',');if(this.monotoneDerivativeCache.has(key))return this.monotoneDerivativeCache.get(key);
    const s=this.monotoneSystems[system],root=this.monotoneRoot(system,values),variables=[...s.parameters,s.variable],args=[...values,root];
    const numerator=this.simultaneousSubstitute(this.derivative(s.body,s.parameters[index]),variables,args),denominator=this.simultaneousSubstitute(this.derivative(s.body,s.variable),variables,args),out=this.neg(this.div(numerator,denominator));
    this.monotoneDerivativeCache.set(key,out);return out;
  }
  monotoneIterate(system,values,count=1){
    const s=this.monotoneSystems[system];if(!s||!Number.isSafeInteger(count)||count<0||count>12)fail('RESOURCE_LIMIT','A monotone exact approximant supports zero through twelve iterations.');
    const at=id=>this.simultaneousSubstitute(id,s.parameters,values),left=at(s.left),right=at(s.right),upper=at(s.derivativeUpper),lower=at(s.derivativeLower),ratio=this.sub(this.one,this.div(lower,upper));
    let value=this.mul(this.q(1,2),this.add(left,right));
    for(let k=0;k<count;k++)value=this.sub(value,this.div(this.simultaneousSubstitute(s.body,[...s.parameters,s.variable],[...values,value]),upper));
    return {value,error:this.mul(this.sub(right,left),this.pow(ratio,count)),ratio,count,meaning:'T(z)=z-F(z)/M, with 0<m<=F_z<=M and opposite endpoint signs; ||T^n z0-z*|| <= (right-left)(1-m/M)^n.',numericRootEvaluated:false};
  }
  defineQuadraticSystem(system){
    const n=system.rhs?.length;
    if(!Number.isSafeInteger(n)||n<1||n>5||system.linear?.length!==n||system.quadraticDiagonal?.length!==n||system.linear.some(r=>r.length!==n)||system.quadraticDiagonal.some(r=>r.length!==n))fail('INVALID_INPUT','An explicit square quadratic system of size one through five is required.');
    if([...system.linear.flat(),...system.quadraticDiagonal.flat(),system.scale].some(id=>this.derivative(id,this.core.eta)!==this.zero))fail('UNSUPPORTED','This implicit kernel requires eta-independent matrix, quadratic coefficients and scale; no derivative of a coefficient may be omitted.');
    const id=this.quadraticSystems.length;this.quadraticSystems.push(system);return id;
  }
  quadraticRoot(system,component,eta=this.core.eta){
    if(!this.quadraticSystems[system]||!Number.isInteger(component)||component<0||component>=this.quadraticSystems[system].rhs.length)fail('INVALID_INPUT','Unknown actual contractive root component.');
    return this.node('actual_quadratic_root',[system,component,eta]);
  }
  determinant(matrix){
    if(matrix.length===0)return this.one;if(matrix.length===1)return matrix[0][0];
    return this.add(...matrix[0].map((v,j)=>v===this.zero?this.zero:this.mul(this.q(j%2?-1:1),v,this.determinant(matrix.slice(1).map(r=>r.filter((_,k)=>k!==j))))));
  }
  quadraticRootEtaDerivative(system,component,eta){
    const key=system+':'+component+':'+eta;if(this.quadraticDerivativeCache.has(key))return this.quadraticDerivativeCache.get(key);
    const s=this.quadraticSystems[system],n=s.rhs.length,values=Array.from({length:n},(_,j)=>this.quadraticRoot(system,j,eta));
    const at=id=>this.substitute(id,this.core.eta,eta),jacobian=s.linear.map((row,i)=>row.map((v,j)=>this.add(at(v),this.mul(this.q(2),at(s.scale),at(s.quadraticDiagonal[i][j]),values[j]))));
    const rhs=s.rhs.map(v=>at(this.derivative(v,this.core.eta))),det=this.determinant(jacobian);
    // Cramer's rule keeps the actual continuous Jacobian. Its nonvanishing
    // follows from the same contractive branch, not from a sampled inverse.
    const out=this.div(this.determinant(jacobian.map((r,i)=>r.map((v,j)=>j===component?rhs[i]:v))),det);
    this.quadraticDerivativeCache.set(key,out);return out;
  }
  substitute(id,variable,value){
    if(id===variable)return value;
    const {op,args}=this.nodes[id];
    if(op==='multiply'){
      const key=id+':'+variable+':'+value;if(this.substitutions.has(key))return this.substitutions.get(key);
      const a=this.substitute(args[0],variable,value),out=a===this.zero?this.zero:this.mul(a,this.substitute(args[1],variable,value));
      this.substitutions.set(key,out);return out;
    }
    if(op==='definite_integral'){
      // Substitution must not capture a coordinate that is free in the new
      // argument. In particular f(eta)=int exp(t*eta)dt evaluated at eta=t
      // remains a function of the caller's t, not int exp(t*t)dt.
      const key=id+':'+variable+':'+value;if(this.substitutions.has(key))return this.substitutions.get(key);
      let [body,bound,left,right]=args;
      left=this.substitute(left,variable,value);right=this.substitute(right,variable,value);
      if(bound!==variable){
        if(this.dependsOn(value,bound)&&this.dependsOn(body,variable)){
          const renamed=this.fresh('alpha_renamed_integral');body=this.substitute(body,bound,renamed);bound=renamed;
        }
        body=this.substitute(body,variable,value);
      }
      const out=this.integral(body,bound,left,right);this.substitutions.set(key,out);return out;
    }
    if(op==='smooth_piecewise'){
      const x=this.substitute(args[0],variable,value),a=this.substitute(args[1],variable,value),b=this.substitute(args[2],variable,value);
      // Source joins are smooth. On the actual axis every geometrical left
      // endpoint here is strictly positive, so the inactive 1/X branch must
      // not be evaluated while substituting the zero axis datum.
      if(x===a||x===this.zero&&this.sourcePositiveGeometry(a))return this.substitute(args[3],variable,value);
      if(x===b)return this.substitute(args[5],variable,value);
      if(this.isq(x)&&this.isq(a)&&this.isq(b)){
        const [xn,xd]=this.fraction(x),[an,ad]=this.fraction(a),[bn,bd]=this.fraction(b);
        return this.substitute(xn*ad<=an*xd?args[3]:xn*bd>=bn*xd?args[5]:args[4],variable,value);
      }
      return this.choose(x,a,b,...args.slice(3).map(v=>this.substitute(v,variable,value)));
    }
    if(op==='actual_natural_series')return this.natural(args[0],this.substitute(args[1],variable,value),this.substitute(args[2],variable,value),args[3],args[4]);
    if(op==='actual_quadratic_root')return this.quadraticRoot(args[0],args[1],this.substitute(args[2],variable,value));
    if(op==='actual_monotone_root')return this.monotoneRoot(args[0],args.slice(1).map(id=>this.substitute(id,variable,value)));
    if(op==='actual_expression_partial')return this.expressionValue(args[0],args[1].map(id=>this.substitute(id,variable,value)),args[2]);
    if(op==='actual_background_picard')return this.picardRoot(args[0],args[1],this.substitute(args[2],variable,value),this.substitute(args[3],variable,value),args[4]);
    if(op==='actual_background_even_profile')return this.picardEven(args[0],args[1],this.substitute(args[2],variable,value),this.substitute(args[3],variable,value),args[4],args[5]);
    if(op==='sine')return this.sine(this.substitute(args[0],variable,value));
    if(op==='cosine')return this.cosine(this.substitute(args[0],variable,value));
    if(op==='ceiling')return this.ceiling(this.substitute(args[0],variable,value));
    if(op==='maximum')return this.maximum(...args.map(id=>this.substitute(id,variable,value)));
    return super.substitute(id,variable,value);
  }
  derivative(id,variable){
    const key=id+':'+variable;if(this.derivatives.has(key))return this.derivatives.get(key);
    const {op,args}=this.nodes[id];let out;
    if(op==='actual_natural_series'){
      const dy=this.derivative(args[1],variable),de=this.derivative(args[2],variable);
      out=this.add(dy===this.zero?this.zero:this.mul(dy,this.natural(args[0],args[1],args[2],args[3]+1,args[4])),de===this.zero?this.zero:this.mul(de,this.natural(args[0],args[1],args[2],args[3],args[4]+1)));
    }else if(op==='actual_quadratic_root'){
      const de=this.derivative(args[2],variable);
      out=de===this.zero?this.zero:this.mul(de,this.quadraticRootEtaDerivative(args[0],args[1],args[2]));
    }else if(op==='actual_monotone_root'){
      const values=args.slice(1);out=this.add(...values.map((id,i)=>{const d=this.derivative(id,variable);return d===this.zero?this.zero:this.mul(d,this.monotoneRootPartial(args[0],i,values));}));
    }else if(op==='actual_expression_partial'){
      out=this.add(...args[1].map((v,j)=>{const dv=this.derivative(v,variable);if(dv===this.zero)return this.zero;const orders=[...args[2]];orders[j]++;return this.mul(dv,this.expressionValue(args[0],args[1],orders));}));
    }else if(op==='actual_background_picard'){
      const dx=this.derivative(args[2],variable),de=this.derivative(args[3],variable);
      out=this.add(dx===this.zero?this.zero:this.mul(dx,this.picardRadialDerivative(args[0],args[1],args[2],args[3],args[4])),de===this.zero?this.zero:this.mul(de,this.picardRoot(args[0],args[1],args[2],args[3],args[4]+1)));
    }else if(op==='actual_background_even_profile'){
      const dx=this.derivative(args[2],variable),de=this.derivative(args[3],variable);
      out=this.add(dx===this.zero?this.zero:this.mul(dx,this.picardEven(args[0],args[1],args[2],args[3],args[4]+1,args[5])),de===this.zero?this.zero:this.mul(de,this.picardEven(args[0],args[1],args[2],args[3],args[4],args[5]+1)));
    }else if(op==='sine')out=this.mul(this.cosine(args[0]),this.derivative(args[0],variable));
    else if(op==='cosine')out=this.neg(this.mul(this.sine(args[0]),this.derivative(args[0],variable)));
    else if(op==='ceiling'||op==='maximum'){
      if(args.some(id=>this.derivative(id,variable)!==this.zero))fail('UNSUPPORTED','A truncation-index ceiling/maximum may only be differentiated in an independent coordinate.');out=this.zero;
    }else if(op==='definite_integral'){
      // First inspect endpoint velocities. A fixed endpoint creates no
      // evaluation of an inactive or removable singular branch at that point.
      const [f,t,a,b]=args,da=this.derivative(a,variable),db=this.derivative(b,variable);
      const inside=t===variable?this.zero:this.integral(this.derivative(f,variable),t,a,b);
      out=this.add(inside,db===this.zero?this.zero:this.mul(this.substitute(f,t,b),db),da===this.zero?this.zero:this.neg(this.mul(this.substitute(f,t,a),da)));
    }else return super.derivative(id,variable);
    this.derivatives.set(key,out);return out;
  }
  pack(roots,extra={}){return super.pack(roots,{naturalSeriesKernel:this.naturalKernel,quadraticSystems:this.quadraticSystems,monotoneSystems:this.monotoneSystems,picardSystems:this.picardSystems,expressionSystems:this.expressionSystems,expressionKernel:{implementation:'actual-continuation-exact-functions.mjs:materializeExpressionFunction',meaning:'Shared explicit expression bodies with mixed automatic differentiation. Every requested jet is a derivative of the retained actual body, never a caller-supplied coefficient.',numericValueOracle:false},monotoneRootKernel:{valueImplementation:'actual-continuation-exact-functions.mjs:monotoneIterate',derivativeImplementation:'actual-continuation-exact-functions.mjs:monotoneRootPartial',iteration:'z <- z-F(z)/M',tail:'(right-left)*(1-m/M)^n',endpointAndDerivativePremisesRequired:true,finiteIterationIsExactRoot:false},picardKernel:{partialSumImplementation:'actual-continuation-exact-functions.mjs:picardPartialSum',etaDerivativeImplementation:'actual_background_picard with the exact derivative partial sums and Cauchy tail',radialDerivativeImplementation:'actual-continuation-exact-functions.mjs:picardRadialDerivative',evenXDerivativeImplementation:'actual-continuation-exact-functions.mjs:materializePicardEvenDerivative',evenXDerivativeIdentity:'d_X^k f(sqrt X)=2^-k integral_[0,1]^k product_j t_j^(2*(k-1-j))*f^(2k)(sqrt X*product_j t_j) dt',axisSingularDivisionAvoided:true,displayedPartialSumDeclaredSolution:false},...extra});}
}

/** Produce the exact N-th approximant of a natural functional operation.
 * This performs the coefficient recursion and all requested eta derivatives.
 * The error is an exact positive expression, not a guessed finite number.
 */
export function materializeActualNaturalSeries(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','component','degree','radialOrder','etaOrder','Y'].includes(key))fail('INVALID_INPUT','Unknown actual natural-series materialization input '+key);
  const degree=input.degree??4,component=input.component??'Phi',k=input.radialOrder??0,m=input.etaOrder??0,Y=input.Y??'41/10';
  if(!['Phi','u','average'].includes(component))fail('INVALID_INPUT','Unknown actual natural series.');
  if(!Number.isSafeInteger(k)||k<0||k>4||!Number.isSafeInteger(m)||m<0||m>4)fail('RESOURCE_LIMIT','Finite actual series materialization currently supports radial/eta derivatives 0..4.');
  const tail=actualNaturalScaledTail({sourceProfile:input.sourceProfile,degree,Y,radialOrder:k,etaOrder:m});
  const {G,program,coefficients,rootFields}=prepareActualNaturalCoreProgram({sourceProfile:input.sourceProfile,degree},context),eta=rootFields.eta,y=rootFields.Y;
  const rows=coefficients[component].map(c=>{for(let j=0;j<m;j++)c=G.derivative(c,eta);return c;});
  let partial=G.zero;
  for(let n=k;n<=degree;n++){let f=1n;for(let j=0;j<k;j++)f*=BigInt(n-j);partial=G.add(partial,G.mul(G.q(f),rows[n],G.pow(y,n-k)));}
  const [a,b='1']=tail.scaledTailUpper.split('/'),error=G.mul(G.parameter('Q'),G.pow(G.parameter('rho'),-m),G.q(a,b));
  const {roots:oldRoots,nodes:oldNodes,operations:oldOperations,...metadata}=program;
  return G.pack({...oldRoots,actualPartial:partial,actualUniformError:error,actualLower:G.sub(partial,error),actualUpper:G.add(partial,error)},
    {...metadata,component,degree,radialOrder:k,etaOrder:m,scaledTail:tail,
      approximation:{exactFiniteCoefficientGraphGenerated:true,wholeActualTranscendentalGraphNumericallyEnclosed:false,finiteCoefficientRoundingError:'0 for expression representation only',actualSourceErrorRoot:error,sourceErrorHasNoFixedPositiveFloor:true,finiteNumericAccuracyClaimed:false}});
}

export {actualNaturalScaledTail,actualNaturalRefinementModulus};
