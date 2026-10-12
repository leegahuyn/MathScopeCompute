/** Independent algebra and literal branch reduction for the global
 * pressure audit. None of these generic operations has source authority.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function originalPressurePairConvolutionIdentity(order=4){
  if(!Number.isSafeInteger(order)||order<1||order>128)fail('RESOURCE_LIMIT','Choose a finite positive convolution audit through128.');
  const G=new ActualConvergentExpressions(),F=Array.from({length:order+1},(_,j)=>G.fresh('pressure_pair_F_'+j)),
    pairs=Array.from({length:order+1},(_,i)=>[i,order-i]),full=G.add(...pairs.map(([i,j])=>G.mul(F[i],F[j]))),
    middle=pairs.slice(1,-1),split=G.add(G.mul(G.q(2),F[0],F[order]),...middle.map(([i,j])=>G.mul(F[i],F[j]))),
    check=sourceGraphRationalIdentity(G,G.sub(full,split)),
    omittedLeadingPair=sourceGraphRationalIdentity(G,G.sub(full,G.sub(split,G.mul(F[0],F[order])))),
    omittedInterior=order>1?sourceGraphRationalIdentity(G,G.sub(full,G.sub(split,G.mul(F[1],F[order-1])))):null;
  if(!check.pass||omittedLeadingPair.pass||omittedInterior?.pass)fail('INTERNAL_VALIDATION','The ordered-pair convolution identity failed.');
  return {schema:'MathScope.OriginalPressurePairConvolutionIdentity/1',order,pairs,middle,check,
    identity:'sum_(i+j=n,0<=i,j<=n) F_i*F_j=2*F0*Fn+sum_(i+j=n,1<=i,j<n) F_i*F_j',
    negativeControls:{omittedLeadingPair,omittedInterior},sourceAuthenticated:false,pass:true};
}

export function originalReservedPowerLogIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),lambda=G.parameter('lambda'),
    names=['logP','logf','stageLogAmplitude','stageStart','y','y0','logXR','log2'],
    v=Object.fromEntries(names.map(name=>[name,G.fresh('reserved_power_'+name)])),
    alpha=G.neg(G.add(q(1,2),lambda)),p=G.sub(q(-2),G.mul(q(2),lambda)),
    logR=G.mul(q(1,2),G.add(v.log2,v.logXR,v.y)),logRbase=G.mul(q(1,2),G.add(v.log2,v.logXR,v.y0)),
    logK=G.add(v.logP,v.logf,v.stageLogAmplitude,G.mul(alpha,G.sub(v.y0,v.stageStart))),
    actualLogF=G.sub(G.add(v.logP,v.logf,v.stageLogAmplitude,G.mul(alpha,G.sub(v.y,v.stageStart))),logR),
    reservedLogF=G.add(logK,G.mul(G.add(G.one,G.mul(q(2),lambda)),logRbase),G.mul(p,logR)),
    check=sourceGraphRationalIdentity(G,G.sub(actualLogF,reservedLogF)),
    omittedRadiusDivision=sourceGraphRationalIdentity(G,G.sub(G.add(actualLogF,logR),reservedLogF)),
    omittedLambda=sourceGraphRationalIdentity(G,G.sub(actualLogF,G.add(logK,logRbase,G.mul(q(-2),logR))));
  if(!check.pass||omittedRadiusDivision.pass||omittedLambda.pass)fail('INTERNAL_VALIDATION','The original reserved-power exponent identity failed.');
  return {schema:'MathScope.OriginalReservedPowerLogIdentity/1',check,
    identity:'P*f*exp(stageLogAmplitude-(1/2+lambda)*(y-stageStart))/R = Kpos*Rbase^(1+2lambda)*R^(-2-2lambda)',
    Kpos:'P*f*exp(stageLogAmplitude-(1/2+lambda)*(y0-stageStart))',
    positiveRealRules:['sqrt(exp(2*t))=exp(t) for real t','log sqrt(2X)=(log2+logX)/2 for X>0','exp(a+b)=exp(a)exp(b)'],
    negativeControls:{omittedRadiusDivision,omittedLambda},sourceAuthenticated:false,pass:true};
}

/** Reduce only explicitly selected branches. Literal integral bodies are
 * opaque: a compact integrand NEVER makes an accumulated prefix zero.
 * The adapter must establish every supplied branch/support selection from
 * its private original source before using this generic algebra.
 */
export function reduceExpressionOnDeclaredBranches(G,root,{coordinate,selectPiecewise,stepValues=new Map(),atomicNodes=[],maxVisits=300000}={}){
  if(!G.nodes[root]||G.nodes[coordinate]?.op!=='coordinate'||typeof selectPiecewise!=='function'||!Number.isSafeInteger(maxVisits)||maxVisits<1)
    fail('INVALID_INPUT','Use a retained expression and explicit finite branch-reduction budget.');
  const atoms=new Set(atomicNodes),cache=new Map(),trace=[];let visits=0;
  const visit=id=>{
    if(atoms.has(id)||!G.dependsOn(id,coordinate))return id;if(cache.has(id))return cache.get(id);
    if(++visits>maxVisits)fail('RESOURCE_LIMIT','The source branch reduction exceeded its declared graph budget.');
    const {op,args}=G.nodes[id];let value=id;
    if(op==='actual_expression_partial')value=visit(G.materializeExpressionFunction(args[0],args[1],args[2]));
    else if(op==='smooth_piecewise'){
      const selection=selectPiecewise({id,coordinate:args[0],left:args[1],right:args[2],branches:args.slice(3)});
      if(selection!==null&&selection!==undefined){
        if(![3,4,5].includes(selection))fail('INVALID_INPUT','A branch selection must be before, between or after.');
        value=visit(args[selection]);trace.push({node:id,selectedBranch:selection,sourceBranch:args[selection],value});
      }
    }else if(op==='source_step_derivative'&&stepValues.has(id)){
      value=stepValues.get(id);if(![G.zero,G.one].includes(value))fail('INVALID_INPUT','The flat support value must be0 or1.');
      trace.push({node:id,selectedFlatStepValue:value});
    }else if(op==='add')value=G.add(...args.map(visit));
    else if(op==='multiply'){
      const children=[];for(const arg of args){const child=visit(arg);children.push(child);if(child===G.zero)break;}
      value=G.mul(...children);
    }else if(op==='inverse')value=G.inv(visit(args[0]));
    else if(op==='integer_power')value=G.pow(visit(args[0]),args[1]);
    else if(op==='sqrt_positive')value=G.sqrt(visit(args[0]));
    else if(op==='exp')value=G.exp(visit(args[0]));
    else if(op==='log_positive')value=G.log(visit(args[0]));
    // No descent into a definite_integral or a natural/Picard function.
    cache.set(id,value);return value;
  };
  return {source:root,value:visit(root),trace,visits,literalIntegralBodiesPreserved:true,
    branchInequalitiesAuthenticated:false,sourceAuthenticated:false};
}
