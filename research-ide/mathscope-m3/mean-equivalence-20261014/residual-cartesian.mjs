/** Independent primitive scalar calculus and actual-field Cartesian rotation.
 * Unknown source operators produce explicitly unresolved TOTAL source jets;
 * their values or derivatives are never fabricated, truncated or zeroed.
 * No original derivative, cylindrical PDE or field assembly helper is called.
 */
import {hashJSON} from './residual-source.mjs';
export function createResidualCartesianCalculus({node,maxNodes=250000,maxWork=1000000}={}){
  const nodes=[],intern=new Map(),source=new Map(),imports=new Map(),derivatives=new Map(),substitutions=new Map(),hypotheses=new Map(),opaque=new Map(),requests=[];
  let work=0,serial=0;
  const tick=()=>{if(++work>maxWork)throw Object.assign(new Error('Independent Cartesian primitive calculus work limit.'),{code:'RESOURCE_LIMIT',workUsed:work,scalarNodes:nodes.length});};
  const put=(op,args)=>{tick();const key=JSON.stringify([op,args]);if(intern.has(key))return intern.get(key);if(nodes.length>=maxNodes)throw Object.assign(new Error('Independent Cartesian primitive calculus node limit.'),{code:'RESOURCE_LIMIT',workUsed:work,scalarNodes:nodes.length});const id=nodes.length;nodes.push({op,args});intern.set(key,id);return id;};
  const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
  const q=(a,b=1n)=>{a=BigInt(a);b=BigInt(b);if(!b)throw new Error('Zero rational denominator in independent Cartesian calculus.');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return put('rational',[String(a/g),String(b/g)]);};
  const zero=q(0),one=q(1),isQ=id=>nodes[id].op==='rational',fraction=id=>nodes[id].args.map(BigInt);
  const add=(...xs)=>xs.reduce((a,b)=>{if(a===zero)return b;if(b===zero)return a;if(isQ(a)&&isQ(b)){const [n,d]=fraction(a),[m,e]=fraction(b);return q(n*e+m*d,d*e);}return put('add',[a,b].sort((a,b)=>a-b));},zero);
  const mul=(...xs)=>xs.reduce((a,b)=>{if(a===zero||b===zero)return zero;if(a===one)return b;if(b===one)return a;if(isQ(a)&&isQ(b)){const [n,d]=fraction(a),[m,e]=fraction(b);return q(n*m,d*e);}return put('multiply',[a,b].sort((a,b)=>a-b));},one);
  const neg=a=>mul(q(-1),a),sub=(a,b)=>a===b?zero:add(a,neg(b));
  const hypothesis=record=>hypotheses.set(hashJSON(record),{...record,provedByThisAudit:false});
  const inv=a=>{if(isQ(a)){const [n,d]=fraction(a);return q(d,n);}hypothesis({kind:'NONZERO_ACTUAL_ARGUMENT',operand:a});return put('inverse',[a]);};
  const div=(a,b)=>a===zero?zero:mul(a,inv(b));
  const pow=(a,n)=>n===0?one:n===1?a:n<0?pow(inv(a),-n):put('integer_power',[a,n]);
  const unary=(op,a)=>{if(op==='exp'&&a===zero)return one;if(op==='log_positive'&&a===one)return zero;if(op==='sine'&&a===zero)return zero;if(op==='cosine'&&a===zero)return one;if(['sqrt_positive','log_positive'].includes(op))hypothesis({kind:'POSITIVE_ACTUAL_ARGUMENT_ON_ACTIVE_DOMAIN',operation:op,operand:a,branchGuardRequired:true});return put(op,[a]);};
  const integral=(body,binder,left,right)=>body===zero||left===right?zero:put('definite_integral',[body,binder,left,right]);
  const make=(op,a)=>op==='add'?add(...a):op==='multiply'?mul(...a):op==='inverse'?inv(a[0]):op==='integer_power'?pow(...a):op==='definite_integral'?integral(...a):['exp','log_positive','sqrt_positive','sine','cosine'].includes(op)?unary(op,a[0]):put(op,a);
  function importSource(id){if(imports.has(id))return imports.get(id);tick();const n=node(id),a=n.args;source.set(id,{sourceNode:id,node:structuredClone(n),nodeSHA256:hashJSON(n)});let out;
    if(n.op==='rational')out=q(...a);else if(['coordinate','source_parameter'].includes(n.op))out=put(n.op,[a[0],id]);
    else if(['add','multiply','maximum','smooth_piecewise'].includes(n.op))out=make(n.op,a.map(importSource));
    else if(['inverse','exp','log_positive','sqrt_positive','sine','cosine','ceiling'].includes(n.op))out=make(n.op,[importSource(a[0])]);
    else if(['integer_power','source_step_derivative'].includes(n.op))out=make(n.op,[importSource(a[0]),a[1]]);
    else if(n.op==='definite_integral')out=integral(...a.map(importSource));
    else{out=put('actual_opaque_value',[id,n.op]);opaque.set(id,{sourceNode:id,node:structuredClone(n),nodeSHA256:hashJSON(n),actualDerivativeIndependentlyKnown:false});}
    imports.set(id,out);return out;
  }
  function substitute(id,bound,value){if(id===bound)return value;if(bound===value)return id;const key=id+':'+bound+':'+value;if(substitutions.has(key))return substitutions.get(key);tick();const n=nodes[id],a=n.args;let out;
    if(['rational','coordinate','source_parameter'].includes(n.op))out=id;
    else if(['actual_opaque_value','unresolved_total_source_jet','unresolved_opaque_substitution'].includes(n.op)){
      // Keep the actual unresolved substitution. It cannot be silently assumed
      // independent of a coordinate hidden in an indexed/limit definition.
      out=put('unresolved_opaque_substitution',[id,bound,value]);hypothesis({kind:'ACTUAL_OPAQUE_SUBSTITUTION',root:id,bound,value,allSourceOperandsRetained:true});
    }else if(n.op==='definite_integral'){
      let [body,binder,left,right]=a;
      if(binder!==bound){let name;do{name='residual-cartesian-alpha:'+ ++serial+':'+nodes.length;}while(nodes.some(n=>n.op==='coordinate'&&n.args[0]===name));
        const fresh=put('coordinate',[name]);body=substitute(body,binder,fresh);binder=fresh;body=substitute(body,bound,value);}
      out=integral(body,binder,substitute(left,bound,value),substitute(right,bound,value));
    }else if(['integer_power','source_step_derivative'].includes(n.op))out=make(n.op,[substitute(a[0],bound,value),a[1]]);
    else out=make(n.op,a.map(x=>substitute(x,bound,value)));
    substitutions.set(key,out);return out;
  }
  function derivative(id,variable){const key=id+':'+variable;if(derivatives.has(key))return derivatives.get(key);tick();const {op,args:a}=nodes[id],d=x=>derivative(x,variable);let out;
    if(['rational','source_parameter'].includes(op))out=zero;else if(op==='coordinate')out=id===variable?one:zero;
    else if(op==='add')out=add(...a.map(d));else if(op==='multiply')out=add(...a.map((x,j)=>mul(d(x),...a.filter((_,k)=>k!==j))));
    else if(op==='inverse')out=neg(mul(d(a[0]),pow(id,2)));
    else if(op==='integer_power')out=mul(q(a[1]),pow(a[0],a[1]-1),d(a[0]));
    else if(op==='exp')out=mul(id,d(a[0]));else if(op==='log_positive')out=div(d(a[0]),a[0]);else if(op==='sqrt_positive')out=div(d(a[0]),mul(q(2),id));
    else if(op==='sine')out=mul(unary('cosine',a[0]),d(a[0]));else if(op==='cosine')out=neg(mul(unary('sine',a[0]),d(a[0])));
    else if(op==='source_step_derivative'){hypothesis({kind:'ORIGINAL_STEP_JET',operand:id,requestedOrder:a[1]+1});out=mul(put(op,[a[0],a[1]+1]),d(a[0]));}
    else if(op==='smooth_piecewise'){hypothesis({kind:'ACTUAL_MATCHING_FLAT_JOIN',operand:id,guards:a.slice(0,3),inactiveBranchesMustRemainGuarded:true});out=put(op,[...a.slice(0,3),...a.slice(3).map(d)]);}
    else if(op==='definite_integral'){const [body,binder,left,right]=a,dl=d(left),dr=d(right);hypothesis({kind:'ACTUAL_FINITE_INTEGRAL_LEIBNIZ',operand:id,body,binder,left,right,variable,movingEndpointTermsRetained:true});out=add(binder===variable?zero:integral(d(body),binder,left,right),dr===zero?zero:mul(substitute(body,binder,right),dr),dl===zero?zero:neg(mul(substitute(body,binder,left),dl)));}
    else{
      // This is a recorded STOP at this actual leaf, not a derivative oracle
      // or a claim that the derivative has been computed.
      const base=op==='unresolved_total_source_jet'?a[0]:id,orders=op==='unresolved_total_source_jet'?[...a[1],variable]:[variable];out=put('unresolved_total_source_jet',[base,orders]);
      requests.push({actualOrDerivedOperand:id,operation:op,base,orderedDifferentiationCoordinates:orders,result:out,status:'UNRESOLVED_ACTUAL_LEAF_JET',derivativeComputed:false});
    }
    derivatives.set(key,out);return out;
  }
  return {nodes,zero,one,q,put,add,mul,neg,sub,inv,div,pow,unary,integral,importSource,derivative,substitute,
    diagnostics:()=>({workUsed:work,maxWork,scalarNodes:nodes.length,maxNodes,sourceBindings:[...source.values()],opaqueActualOperands:[...opaque.values()],unresolvedActualJetRequests:requests,conditionalDomainHypotheses:[...hypotheses.values()],originalSourceDerivativeHelperCalled:false,unresolvedJetReplacedByZero:false})};
}

/** Derive normalized Cartesian PDE from rotated complete original fields.
 * The common physical multiplier is Q^(-A-1-h), A=1/2+h. All fixed-label
 * fast directions and theta frame derivatives remain in the formula.
 */
export function deriveActualCartesianResidual(G,{geometry,velocity,pressure}){
  const at=x=>G.importSource(x),R=at(geometry.R),Z=at(geometry.Z),T=at(geometry.T),theta=at(geometry.theta),Y=geometry.Y.map(at),vr=geometry.vr.map(at),vt=geometry.vt.map(at),epsilon=at(geometry.epsilon),ci=at(geometry.ci),a=at(geometry.radialFast);
  const c=G.unary('cosine',theta),s=G.unary('sine',theta),U=velocity.map(at),P=at(pressure),V=[G.sub(G.mul(c,U[0]),G.mul(s,U[1])),G.add(G.mul(s,U[0]),G.mul(c,U[1])),U[2]];
  const slowRadial=x=>G.add(G.derivative(x,R),G.mul(a,...[G.add(...Y.map((y,j)=>G.mul(vr[j],G.derivative(x,y))))]));
  const angle=x=>G.div(G.derivative(x,theta),R),axial=x=>G.mul(epsilon,G.derivative(x,Z));
  const spatial=[x=>G.sub(G.mul(c,slowRadial(x)),G.mul(s,angle(x))),x=>G.add(G.mul(s,slowRadial(x)),G.mul(c,angle(x))),axial];
  const time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,G.add(...Y.map((y,j)=>G.mul(vt[j],G.derivative(x,y))))));
  const divergence=G.add(...V.map((x,j)=>spatial[j](x))),jets=V.map((x,i)=>({component:i,sourceCylindricalComponent:velocity[i],cartesianVelocity:x,time:time(x),spatial:spatial.map(D=>D(x)),laplacian:G.add(...spatial.map(D=>D(D(x)))),pressureGradient:spatial[i](P)}));
  const advective=jets.map(j=>G.add(j.time,G.neg(G.mul(epsilon,j.laplacian)),j.pressureGradient,G.add(...V.map((v,k)=>G.mul(v,j.spatial[k])))));
  const conservative=advective.map((x,i)=>G.add(x,G.mul(V[i],divergence))),backToCylindrical=[G.add(G.mul(c,conservative[0]),G.mul(s,conservative[1])),G.sub(G.mul(c,conservative[1]),G.mul(s,conservative[0])),conservative[2]];
  const d=G.diagnostics();return {schema:'MathScope.N6.IndependentActualCartesianJetAttempt/1',sourceVelocity:[...velocity],sourcePressure:pressure,sourceGeometry:geometry,
    cartesianVelocity:V,divergence,jets,advectiveResidual:advective,conservativeResidual:conservative,backToCylindrical,
    physicalScaling:{velocity:'Q^-A',pressure:'Q^-2A',commonResidual:'Q^(-A-1-h)',relation:'A=1/2+h; normalized viscosity=epsilon=Q^h'},
    status:d.unresolvedActualJetRequests.length?'ACTUAL_PRIMITIVE_CARTESIAN_EXPANSION_WITH_EXPLICIT_OPAQUE_JET_STOPS':'PRIMITIVE_CARTESIAN_DERIVATIVE_ALGEBRA_CONDITIONAL_ON_DOMAINS',
    actualOpaqueJetsIndependentlyEvaluated:false,actualCartesianPDEVerified:false,originalN601Complete:false,originalN602Complete:false,diagnostics:d};
}
