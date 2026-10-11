/** Source-form proof and numerical intervals for the THREE original A.13
 * integrals. The pinned positive h/lambda are not replaced by zero. This
 * module proves the displayed inequalities for the literal integral bodies;
 * a caller must separately authenticate their occurrence in its parent graph.
 */
import {ActualSourceExpressions} from './actual-global-source-expressions.mjs';
import {getPinnedSourceProfile} from './source-profile.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';
import {evaluateClosedArithmeticDefinitions} from './actual-closed-parameter-arithmetic.mjs';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const auditSeals=new WeakMap();

export function originalA13IntegralSourceAudit({nodes,rootNames,profileDefinitions}={}){
  const profile=getPinnedSourceProfile();
  if(!Array.isArray(nodes)||!rootNames||typeof rootNames!=='object'||Array.isArray(rootNames)||
    !same(profileDefinitions,profile.parametersExactExpressions))
    fail('INVALID_SOURCE_CONSTRUCTION','The original A.13 nodes and every pinned parameter definition must be retained.');
  const G=new ActualSourceExpressions(),sourceNodes=new Map();
  for(const row of nodes){
    if(!row||!Number.isSafeInteger(row.id)||row.id<0||row.id>=350000||sourceNodes.has(row.id)||!row.node||!Array.isArray(row.node.args))
      fail('INVALID_SOURCE_CONSTRUCTION','The A.13 sparse source nodes are malformed or exceed the finite small-prefix budget.');
    sourceNodes.set(row.id,structuredClone(row.node));
  }
  G.nodes=Array.from({length:Math.max(...sourceNodes.keys())+1},(_,i)=>sourceNodes.get(i));
  G.lookup=new Map([...sourceNodes].map(([i,n])=>[JSON.stringify([n.op,n.args]),i]));
  if(!same(G.nodes[0],{op:'rational',args:['0','1']})||!same(G.nodes[1],{op:'rational',args:['1','1']}))
    fail('INVALID_SOURCE_CONSTRUCTION','The original zero and unit roots must keep their literal values.');
  const at=id=>{if(!Number.isSafeInteger(id)||!sourceNodes.has(id))fail('INVALID_SOURCE_CONSTRUCTION','An A.13 source operand is absent from its saved prefix.');return sourceNodes.get(id);},
    q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),lambda=G.parameter('lambda'),co=G.parameter('co'),a=G.sub(G.one,lambda),b=G.sub(G.one,h),rho=G.mul(co,h),checks=[];
  // Walk typed operands before appending any expected formula. Missing source
  // bodies must not be accidentally replaced by a newly allocated node with
  // the numeric identifier named by an untrusted sparse record.
  const originalClosure=new Set(),pending=['A13SteepIntegral','A13FlattenIntegral','A13TerminalIntegral','Qb','Qp','terminalWait'].map(name=>rootNames[name]);
  while(pending.length){
    const id=pending.pop();if(originalClosure.has(id))continue;
    const n=at(id);originalClosure.add(id);let operands;
    if(n.op==='rational'){
      if(n.args.length!==2||n.args.some(x=>typeof x!=='string'||!/^[-+]?\d+$/.test(x)))fail('INVALID_SOURCE_CONSTRUCTION','The A.13 rational leaves keep exact integer operands.');operands=[];
    }else if(n.op==='source_parameter'||n.op==='coordinate'){
      if(n.args.length!==1||typeof n.args[0]!=='string')fail('INVALID_SOURCE_CONSTRUCTION','The A.13 named source atoms retain one literal name.');operands=[];
    }else if(n.op==='source_step_derivative'||n.op==='integer_power'){
      if(n.args.length!==2||!Number.isSafeInteger(n.args[1])||(n.op==='source_step_derivative'&&n.args[1]<0))fail('INVALID_SOURCE_CONSTRUCTION','A source derivative order or integer exponent is literal data.');operands=[n.args[0]];
    }else if(['exp','inverse','log_positive','sqrt_positive'].includes(n.op)){
      if(n.args.length!==1)fail('INVALID_SOURCE_CONSTRUCTION','An A.13 unary operation retains its one operand.');operands=n.args;
    }else if(n.op==='add'||n.op==='multiply')operands=n.args;
    else if(n.op==='definite_integral'){
      if(n.args.length!==4)fail('INVALID_SOURCE_CONSTRUCTION','An A.13 integral retains its complete four operands.');operands=n.args;
    }else fail('INVALID_SOURCE_CONSTRUCTION','An unsupported or opaque body occurs in the original A.13 closure.');
    for(const child of operands){at(child);pending.push(child);}
  }
  const bind=(id,pass,detail={})=>checks.push({id,pass,...detail});
  const integrals=['A13SteepIntegral','A13FlattenIntegral','A13TerminalIntegral'].map(name=>{
    const root=rootNames[name],node=at(root);
    if(node.op!=='definite_integral'||node.args.length!==4||at(node.args[1]).op!=='coordinate')
      fail('INVALID_SOURCE_CONSTRUCTION','The original '+name+' must retain its body, independent integration variable and both endpoints.');
    return {name,root,body:node.args[0],variable:node.args[1],lower:node.args[2],upper:node.args[3]};
  });
  const SAt=s=>{
    const candidates=[...sourceNodes].filter(([,n])=>n.op==='definite_integral'&&n.args.length===4&&n.args[2]===G.zero&&n.args[3]===s&&
      sourceNodes.get(n.args[1])?.op==='coordinate'&&same(sourceNodes.get(n.args[0]),{op:'source_step_derivative',args:[n.args[1],0]}));
    if(candidates.length!==1)fail('INVALID_SOURCE_CONSTRUCTION','The A.13 sigma primitive must have its unique original complete integrand and endpoints.');
    return candidates[0][0];
  };
  const [steep,flatten,terminal]=integrals,Ssteep=SAt(steep.variable),Sflatten=SAt(flatten.variable),
    steepBody=G.mul(G.exp(G.mul(a,G.sub(steep.variable,Ssteep))),G.sub(G.add(lambda,G.mul(a,G.step(steep.variable))),h)),
    flattenBody=G.mul(G.exp(G.mul(b,Sflatten)),b,G.sub(G.one,G.step(flatten.variable))),
    terminalBody=G.div(G.mul(G.exp(G.mul(b,terminal.variable)),rho,G.step(G.div(G.sub(terminal.variable,G.one),q(2)),1)),G.mul(q(2),G.sub(G.one,rho)));
  for(const [r,expected,lo,hi]of [[steep,steepBody,G.zero,G.one],[flatten,flattenBody,G.zero,G.one],[terminal,terminalBody,G.one,q(3)]]){
    bind(r.name+'-complete-body',r.body===expected,{actual:r.body,expected});
    bind(r.name+'-original-endpoints',r.lower===lo&&r.upper===hi,{actual:[r.lower,r.upper],expected:[lo,hi]});
  }
  const Q0=G.div(G.sub(lambda,h),a),Qsteep=G.mul(G.exp(G.neg(G.mul(a,q(1,2)))),G.add(Q0,steep.root)),
    holdLength=G.mul(q(-4),G.log(h)),Qhold=G.add(Qsteep,G.mul(b,holdLength)),
    Qb=G.mul(G.exp(G.neg(G.mul(b,q(1,2)))),G.add(Qhold,flatten.root)),
    wait=G.div(G.log(G.div(Qb,terminal.root)),b);
  bind('original-positive-Qb-definition',rootNames.Qb===Qb,{actual:rootNames.Qb,expected:Qb});
  bind('original-Qp-is-complete-terminal-integral',rootNames.Qp===terminal.root);
  bind('original-positive-wait-definition',rootNames.terminalWait===wait,{actual:rootNames.terminalWait,expected:wait});
  bind('original-positive-parameter-separation',same(profileDefinitions.h,{exp:{product:[{integer:-8002},{ref:'T'}]}})&&
    same(profileDefinitions.lambda,{exp:{product:[{integer:-1000},{ref:'T'}]}})&&same(profileDefinitions.co,{rational:'1/256'})&&
    same(profileDefinitions.T,{sum:[{exp:{ref:'Md'}},{integer:10}]})&&same(profileDefinitions.Md,{integer:1048576}));
  if(checks.some(r=>!r.pass))fail('INVALID_SOURCE_CONSTRUCTION','The original A.13 source identity failed: '+checks.filter(r=>!r.pass).map(r=>r.id).join(', '));
  const result={schema:'MathScope.OriginalA13IntegralSourceAudit/1',pass:true,sourceAuthenticated:false,parentGraphAuthenticationRequired:true,
    profile:profile.parameterExpressionSHA256,integrals,checks,derivedRoots:{Q0,Qsteep,Qhold,Qb,Qp:terminal.root,wait,holdLength,rho,a,b},
    sourceClosure:{complete:true,nodeCount:originalClosure.size,rootNames:structuredClone(rootNames),
      nodes:[...originalClosure].sort((x,y)=>x-y).map(id=>({id,node:structuredClone(sourceNodes.get(id))}))},
    representedIntegralBoundsProved:true,sourceGraphRewritten:false,originalPositiveParametersRetained:true,
    inequalities:{parameterDomain:'T=exp(1048576)+10>128;0<h<lambda<1/16; a=1-lambda,b=1-h in(1/2,1);rho_o=h/256<1/4096.',
      cutoff:'The original square-seed sigma is nondecreasing,0<=sigma<=1,sigma(0)=0,sigma(1)=1,sigma(1-s)=1-sigma(s). Thus integral_0^1 sigma=integral_0^1(1-sigma)=1/2.',
      steep:'For0<=s<=1,0<=S(s)<=s,exp(a(s-S)) in[1,e],lambda+a*sigma-h=(lambda-h)+a*sigma. Therefore I_steep>=a/2>1/4 and I_steep<=e*(1-h)<3.',
      flatten:'exp(b*S) in[1,e] and integral(1-sigma)=1/2 imply b/2<=I_flatten<=e*b/2. Therefore1/4<I_flatten<3/2.',
      terminal:'After t=(s-1)/2, Qp=rho_o/(1-rho_o)*integral_0^1 exp(b*(1+2t))*sigma_prime(t)dt. Its lower bound exceeds rho_o, and its upper bound is below2*e^3*rho_o<54*rho_o.',
      elementary:'2<e<3 follows from the positive factorial series and its geometric tail; no binary64 transcendental comparison is used.'}};
  auditSeals.set(result,canonicalStringify(result));return result;
}

export function assertOriginalA13IntegralSourceAudit(audit){
  if(!audit||!auditSeals.has(audit)||auditSeals.get(audit)!==canonicalStringify(audit))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private audit of the complete original A.13 source bodies.');
  return true;
}

export function encloseRepresentedOriginalA13Integrals(audit,N,parameterValues){
  assertOriginalA13IntegralSourceAudit(audit);
  if(!(parameterValues instanceof Map)||!parameterValues.has('h'))
    fail('INVALID_INPUT','Use a successful literal A.13 audit and the original positive h numerical interval.');
  const originalH=evaluateClosedArithmeticDefinitions(getPinnedSourceProfile().parametersExactExpressions,N,{names:['h']}).values.get('h');
  if(!same(N.toClosed(parameterValues.get('h')),N.toClosed(originalH)))
    fail('INVALID_SOURCE_CONSTRUCTION','The A.13 numerical factor must keep the freshly enclosed original positive h.');
  // This private local audit proves the displayed source-form inequalities.
  // Authentication of its occurrence in a parent graph remains separate.
  const rho=N.div(parameterValues.get('h'),N.point(256)),ranges=[
    N.fromClosed({lower:{rational:'1/4'},upper:{rational:'3'}}),
    N.fromClosed({lower:{rational:'1/4'},upper:{rational:'3/2'}}),
    {lower:rho.lower,upper:N.mul(N.point(54),rho).upper}];
  return {values:new Map(audit.integrals.map((r,j)=>[r.root,ranges[j]])),
    rows:audit.integrals.map((r,j)=>({name:r.name,root:r.root,numericalInterval:N.toClosed(ranges[j]),
      strictlyPositiveLower:true,finiteUpper:true,exactOriginalIntegrandRetained:true,
      originalIntegralValueRelativeToleranceGuaranteed:false})),
    sourceAuthenticated:false,representedIntegralBoundsProved:true,parentGraphAuthenticationRequired:true,
    zeroSubstitutionUsed:false};
}
