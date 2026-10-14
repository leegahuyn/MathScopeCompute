/** Independent coordinate-dependence and fixed-label chart calculus.
 * A source limit/function remains an opaque atom. Only a syntactically
 * coordinate-independent primitive selector has its derivatives set to zero.
 * Frozen label IDs are retained as values and are allowed ONLY in an explicitly
 * conditional row-interior Jacobian check, never in the global PDE verifier.
 */
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCompleteResidualVerifier} from '../mean-equivalence-20261014/residual-rational-verifier.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const check=(x,message)=>{if(!x)throw new Error(message);};
const primitive=new Set(['rational','coordinate','source_parameter']);
const unary=new Set(['inverse','exp','log_positive','sqrt_positive','sine','cosine','ceiling','integer_power','source_step_derivative']);

export function coordinateSupport({node}){
  const cache=new Map(),active=new Set();
  function visit(id){
    if(cache.has(id))return cache.get(id);
    if(active.has(id))return {coordinates:[],unreviewed:[id],cycle:true};
    const n=node(id);if(!n)return {coordinates:[],unreviewed:[id],missing:true};
    active.add(id);let result;
    if(n.op==='coordinate')result={coordinates:[id],unreviewed:[]};
    else if(['rational','source_parameter'].includes(n.op))result={coordinates:[],unreviewed:[]};
    else{
      let children;
      if(unary.has(n.op))children=[n.args[0]];
      else if(['add','multiply','maximum','smooth_piecewise'].includes(n.op))children=n.args;
      else if(n.op==='definite_integral')children=[n.args[0],n.args[2],n.args[3]];
      if(children){const rows=children.map(visit),coords=new Set(rows.flatMap(r=>r.coordinates));
        if(n.op==='definite_integral'){
          coords.clear();for(const x of rows[0].coordinates)if(x!==n.args[1])coords.add(x);
          rows.slice(1).forEach(r=>r.coordinates.forEach(x=>coords.add(x)));
        }
        result={coordinates:[...coords].sort((a,b)=>a-b),unreviewed:[...new Set(rows.flatMap(r=>r.unreviewed))].sort((a,b)=>a-b)};
      }else result={coordinates:[],unreviewed:[id]};
    }
    active.delete(id);cache.set(id,result);return result;
  }
  return visit;
}

export function closePrimitiveSelectorJets(program,requests){
  const support=coordinateSupport({node:id=>program[id]}),closed=[],open=[];
  for(const request of requests){const n=program[request.base],s=support(request.base);
    const proved=['ceiling','maximum'].includes(n?.op)&&s.unreviewed.length===0&&
      request.orderedDifferentiationCoordinates.every(id=>!s.coordinates.includes(id));
    const row={...request,baseNode:n,syntacticSupport:s,
      status:proved?'PROVED_ZERO_FIXED_PARAMETER_SELECTOR_JET':'UNRESOLVED_ACTUAL_LEAF_JET',
      derivativeComputed:proved,exactValue:proved?'0':null,
      proof:proved?'The complete primitive argument depends only on the retained frozen parameters. With those parameters fixed, this selector is a constant in every requested Cartesian coordinate. Its ordered first/second derivatives therefore equal zero, including at integer selector values. No derivative of ceiling with respect to its varying argument was used.':null,
      inputDefinednessRequired:true,globalParameterDomainDischarged:false};
    (proved?closed:open).push(row);
  }
  return {closed,open,coordinatesAreSourceIndependentVariables:true,
    unknownFunctionsReplacedByZero:false,allSourceExistenceProved:false};
}

/** Consume ONLY the proved primitive-selector and exact slow-chart leaf rules.
 * The Cartesian expressions keep every other unknown source jet. The resulting
 * expressions remain conditional on the 94 original domain obligations and on
 * application of the chart function inside its proved collar.
 */
export function applyCartesianLeafClosure(cartesian,slowProof){
  const old=cartesian.scalarProgram,selectors=closePrimitiveSelectorJets(old,cartesian.diagnostics.unresolvedActualJetRequests),
    zeroResults=new Set(selectors.closed.map(r=>r.result)),slowResults=new Map((slowProof?.rows??[]).map(r=>[r.result,r])),
    nodes=[],intern=new Map(),memo=new Map();
  const put=(op,args)=>{const key=JSON.stringify([op,args]);if(intern.has(key))return intern.get(key);
    const id=nodes.length;nodes.push({op,args});intern.set(key,id);return id;};
  const q=(n,d=1)=>put('rational',[String(n),String(d)]),zero=q(0),one=q(1),
    add=(...xs)=>{xs=xs.filter(x=>x!==zero);return xs.length===0?zero:xs.length===1?xs[0]:xs.reduce((a,b)=>put('add',[a,b]));},
    mul=(...xs)=>xs.includes(zero)?zero:xs.filter(x=>x!==one).reduce((a,b)=>a===one?b:put('multiply',[a,b]),one),
    neg=x=>mul(q(-1),x),exp=x=>put('exp',[x]),log=x=>put('log_positive',[x]),inv=x=>put('inverse',[x]),
    pow=(x,n)=>n===0?one:n===1?x:put('integer_power',[x,n]);
  const sourceCoordinate=sourceID=>{const id=old.findIndex(n=>n.op==='coordinate'&&n.args[1]===sourceID);check(id>=0,'Missing original Cartesian source coordinate.');return visit(id);};
  function visit(id){if(memo.has(id))return memo.get(id);let out;
    if(zeroResults.has(id))out=zero;
    else if(slowResults.has(id)){
      const row=slowResults.get(id);check(row.baseSourceNode===622820&&row.status==='PROVED_EXACT_SLOW_CHART_JET_ON_ORIGINAL_IMAGE','Invalid slow-chart leaf closure.');
      const base=old[row.base];check(base.op==='actual_opaque_value'&&base.args[0]===622820,'The actual slow source root changed.');
      const requested=row.requestedSourceCoordinates;check(requested.length===1,'Unreviewed higher-order slow-chart closure.');
      if(row.exactExpression==='0'){
        check(![622803,622804].includes(requested[0]),'A varying Z/T slow-chart jet cannot be replaced by zero.');out=zero;
      }
      else{
        const s=visit(row.base),z=sourceCoordinate(622803),hId=old.findIndex(n=>n.op==='source_parameter'&&n.args[0]==='h'&&n.args[1]===9);
        check(hId>=0,'Missing actual h parameter.');const h=visit(hId),a=mul(q(2),h),sPower=exp(mul(a,log(s))),
          Fs=add(one,neg(mul(a,pow(z,2),exp(mul(add(a,q(-1)),log(s))))));
        if(requested[0]===622803&&row.exactExpression==='2*Z*s^(2h)/Fs')out=mul(q(2),z,sPower,inv(Fs));
        else if(requested[0]===622804&&row.exactExpression==='1/Fs')out=inv(Fs);
        else throw new Error('An unreviewed slow-chart derivative formula was supplied.');
      }
    }else{
      const n=old[id];check(n,'Missing original independent scalar node.');const a=n.args;
      if(primitive.has(n.op)||n.op==='actual_opaque_value')out=put(n.op,a);
      else if(n.op==='unresolved_total_source_jet')out=put(n.op,[visit(a[0]),a[1].map(visit)]);
      else if(n.op==='integer_power'||n.op==='source_step_derivative')out=put(n.op,[visit(a[0]),a[1]]);
      else if(n.op==='add')out=add(...a.map(visit));
      else if(n.op==='multiply')out=mul(...a.map(visit));
      else out=put(n.op,a.map(visit));
    }
    memo.set(id,out);return out;
  }
  const list=xs=>xs?.map(visit),jetRows=(cartesian.jets??[]).map(j=>({...j,cartesianVelocity:visit(j.cartesianVelocity),
    time:visit(j.time),spatial:list(j.spatial),laplacian:visit(j.laplacian),pressureGradient:visit(j.pressureGradient)})),
    roots={cartesianVelocity:list(cartesian.cartesianVelocity),divergence:cartesian.divergence===undefined?undefined:visit(cartesian.divergence),
      jets:jetRows,advectiveResidual:list(cartesian.advectiveResidual),conservativeResidual:list(cartesian.conservativeResidual),
      backToCylindrical:list(cartesian.backToCylindrical)};
  // Keep every prior node, including unreached failure evidence, so its source
  // provenance is available. No nonzero residual is asserted to vanish.
  old.forEach((_,id)=>visit(id));
  return {schema:'MathScope.N6.AppliedActualCartesianLeafClosure/1',sourceVelocity:cartesian.sourceVelocity,
    sourcePressure:cartesian.sourcePressure,sourceGeometry:cartesian.sourceGeometry,scalarProgram:nodes,
    originalScalarNodeToClosedScalarNode:old.map((_,id)=>memo.get(id)),...roots,
    closedSelectorResults:selectors.closed.map(r=>r.result),closedSourceChartResults:[...slowResults.keys()],
    domainHypotheses:cartesian.diagnostics.conditionalDomainHypotheses,
    sourceChartArgumentsInsideProvedCollarRequired:true,allGlobalDomainGuardsDischarged:false,
    remainingOriginalRequests:cartesian.diagnostics.unresolvedActualJetRequests.filter(r=>!zeroResults.has(r.result)&&!slowResults.has(r.result)),
    opaqueUnknownJetsReplacedByZero:false,originalSourceDerivativeHelperCalled:false,
    independentlyRewrittenCartesianPDEExpressionsRetained:true,actualCartesianPDEVerified:false,
    originalN601Complete:false,originalN602Complete:false};
}

/** Scalar derivative grammar, independently implemented from source producers.
 * A frozen label is constant only within this exact fixed-label interior.
 */
export function createFixedLabelDerivative({sourceNodes,frozenLabels=[],maxNodes=100000,maxWork=500000}){
  const rows=new Map(sourceNodes.map(w=>[w.sourceNode,w.node])),initial=[...rows.keys()].reduce((a,b)=>Math.max(a,b),-1)+1,
    extra=[],intern=new Map(),cache=new Map(),stops=[],frozen=new Set(frozenLabels);
  let work=0;
  for(const [id,n]of rows)intern.set(JSON.stringify([n.op,n.args]),id);
  const node=id=>id<initial?rows.get(id):extra[id-initial];
  const put=(op,args)=>{if(++work>maxWork||extra.length>=maxNodes)throw new Error('Fixed-label derivative resource limit.');
    const key=JSON.stringify([op,args]);if(intern.has(key))return intern.get(key);const id=initial+extra.length;
    extra.push({op,args});intern.set(key,id);return id;};
  const q=(a,b='1')=>put('rational',[String(a),String(b)]),zero=q(0),one=q(1);
  const add=(...xs)=>{xs=xs.filter(x=>x!==zero);return xs.length===0?zero:xs.length===1?xs[0]:xs.reduce((a,b)=>put('add',[a,b]));};
  const mul=(...xs)=>xs.includes(zero)?zero:xs.filter(x=>x!==one).reduce((a,b)=>a===one?b:put('multiply',[a,b]),one);
  const neg=x=>mul(q(-1),x),pow=(x,p)=>p===0?one:p===1?x:put('integer_power',[x,p]),inv=x=>put('inverse',[x]);
  const support=coordinateSupport({node});
  function d(id,variable){const key=id+':'+variable;if(cache.has(key))return cache.get(key);const n=node(id);
    check(n,'A requested actual source node is absent.');let out;
    if(frozen.has(id))out=zero;
    else if(n.op==='coordinate')out=id===variable?one:zero;
    else if(['rational','source_parameter'].includes(n.op))out=zero;
    else{
      const s=support(id),a=n.args,der=x=>d(x,variable);
      if(s.unreviewed.length===0&&!s.coordinates.includes(variable))out=zero;
      else if(n.op==='add')out=add(...a.map(der));
      else if(n.op==='multiply')out=add(...a.map((x,j)=>mul(der(x),...a.filter((_,k)=>j!==k))));
      else if(n.op==='inverse')out=neg(mul(der(a[0]),pow(id,2)));
      else if(n.op==='integer_power')out=mul(q(a[1]),pow(a[0],a[1]-1),der(a[0]));
      else if(n.op==='exp')out=mul(id,der(a[0]));
      else if(n.op==='log_positive')out=mul(der(a[0]),inv(a[0]));
      else if(n.op==='sqrt_positive')out=mul(der(a[0]),inv(mul(q(2),id)));
      else if(n.op==='sine')out=mul(put('cosine',[a[0]]),der(a[0]));
      else if(n.op==='cosine')out=neg(mul(put('sine',[a[0]]),der(a[0])));
      else if(n.op==='maximum'&&a.every(x=>der(x)===zero))out=zero;
      else if(n.op==='smooth_piecewise'&&a.slice(0,3).every(x=>der(x)===zero)){
        const branches=a.slice(3).map(der);
        out=branches.every(x=>x===branches[0])?branches[0]:put('smooth_piecewise',[...a.slice(0,3),...branches]);
      }
      else {out=put('independent_uncomputed_source_derivative',[id,variable]);stops.push({sourceNode:id,variable,operation:n.op,result:out});}
    }
    cache.set(key,out);return out;
  }
  function compareDerivative(value,variable,declared){const derivative=d(value,variable),difference=add(derivative,neg(declared)),
    array=new Proxy({},{get(_target,key){return typeof key==='string'&&/^\d+$/.test(key)?node(Number(key)):undefined;}});
    const verify=createCompleteResidualVerifier({nodes:array},{maxTerms:3000,maxProducts:200000});
    const result=verify(difference);return {value,variable,derivative,declared,pass:result.pass,
      numerator:result.numerator,denominatorFactorPolynomials:result.denominatorFactorPolynomials,
      independentUncomputedDerivativeAtoms:result.actualAtomicNodes.filter(id=>node(id)?.op==='independent_uncomputed_source_derivative')};
  }
  return {node,q,add,mul,zero,one,d,compareDerivative,diagnostics:()=>({frozenLabels:[...frozen],work,scalarNodes:extra.length,stops,extraNodes:extra})};
}

export function expandFixedLabelDerivativeWord(row,word,localDimension,{sourceNodes,directions,frozenLabels=[]}={}){
  check(Array.isArray(sourceNodes)&&Array.isArray(directions),'An actual coefficient-constancy check is required before a constant-chart word expansion.');
  const calc=createFixedLabelDerivative({sourceNodes,frozenLabels}),requested=[...new Set(word)];
  for(const direction of requested){check(row.derivativeMaps?.[direction]&&directions[direction]!==undefined,'Missing actual derivative direction.');
    for(const map of row.derivativeMaps[direction])for(const other of requested)
      check(calc.compareDerivative(map.coefficient,directions[other],calc.zero).pass,
        'A varying chart coefficient requires its Leibniz terms; constant-chart expansion rejected.');
  }
  let expansion=new Map([[Array(localDimension).fill(0).join(','),new Map([['','1']])]]);
  // Coefficients are formal products of the ACTUAL source IDs. Integer
  // multiplicities are exact; no different coefficient bodies are identified.
  for(const direction of word){check(row.derivativeMaps?.[direction],'Missing actual derivative direction.');const next=new Map();
    for(const [alphaText,poly]of expansion)for(const map of row.derivativeMaps[direction]){
      const alpha=alphaText.split(',').map(Number);check(map.parameter>=0&&map.parameter<localDimension,'Invalid actual local parameter.');alpha[map.parameter]++;
      const key=alpha.join(',');if(!next.has(key))next.set(key,new Map());
      for(const [factorText,multiplicity]of poly){const factors=factorText?factorText.split(',').map(Number):[];factors.push(map.coefficient);factors.sort((a,b)=>a-b);
        const monomial=factors.join(','),target=next.get(key);target.set(monomial,String(BigInt(target.get(monomial)??'0')+BigInt(multiplicity)));}
    }expansion=next;
  }
  return [...expansion].map(([orders,poly])=>({localDerivativeOrders:orders.split(',').map(Number),coefficientProducts:[...poly].map(([ids,multiplicity])=>({sourceCoefficientIDs:ids?ids.split(',').map(Number):[],exactMultiplicity:multiplicity}))}));
}

export function auditActualIndexedMaps(sourceWitnesses,bindings){
  const nodeMap=new Map(sourceWitnesses.map(w=>[w.sourceNode,w.node])),support=coordinateSupport({node:id=>nodeMap.get(id)}),
    defs=new Map(bindings.map(d=>[d.key,d])),fields=bindings.filter(d=>['fieldDefinitions:6','fieldDefinitions:7','fieldDefinitions:8','fieldDefinitions:9','definitions:1:0','definitions:1:1','definitions:1:2'].includes(d.key));
  const results=[],jacobianCache=new Map(),witnessIDs=new Set();
  const nearestSelectors=roots=>{const seen=new Set(),selectors=new Set(),stack=[...roots];
    while(stack.length){const id=stack.pop();if(seen.has(id))continue;seen.add(id);const n=nodeMap.get(id);if(!n)continue;
      if(n.op==='ceiling'){selectors.add(id);continue;}
      if(unary.has(n.op))stack.push(n.args[0]);else if(['add','multiply','maximum','smooth_piecewise'].includes(n.op))stack.push(...n.args);
      else if(n.op==='definite_integral')stack.push(n.args[0],n.args[2],n.args[3]);
    }return [...selectors].sort((a,b)=>a-b);};
  for(const field of fields){const d=field.definition;check(d.rows.length===162,'The complete original 162-row source cover changed.');
    const rows=[];
    for(const [rowIndex,row]of d.rows.entries()){
      const op=typeof row.localSystem==='string'?'m3_coupled_expression_partial':row.localSystem<0?'m3_aux_expression_partial':'actual_expression_partial',
        key=op==='m3_coupled_expression_partial'?'definitions:0:'+Number(row.localSystem.split(':')[1]):op==='m3_aux_expression_partial'?'expressionDefinitions:'+(-1-row.localSystem):'expression:'+row.localSystem,
        local=defs.get(key);check(local,'Actual row local definition is missing: '+key);
      check(local.definition.body===row.localBody&&JSON.stringify(local.definition.parameters)===JSON.stringify(row.localParameters),'Actual indexed local body/parameters differ.');
      const factors=[row.coefficient,...row.derivativeMaps.flat().map(m=>m.coefficient)],factorRows=factors.map(id=>{
        witnessIDs.add(id);const s=support(id);return {sourceNode:id,primitiveSupport:s,
          constantInAllDeclaredDirections:s.unreviewed.length===0&&d.directions.every(v=>!s.coordinates.includes(v))};});
      // These labels are exactly the source row's labels, never a caller list.
      const frozen=[row.label.ell,...row.label.grid],nearest=nearestSelectors([...row.values,...factors]),
        signature=JSON.stringify([row.values,row.derivativeMaps,d.directions,frozen,nearest]);
      if(!jacobianCache.has(signature)){
        const calc=createFixedLabelDerivative({sourceNodes:sourceWitnesses,frozenLabels:[...frozen,...nearest],maxWork:500000}),checks=[],factorChecks=[];
        for(const [direction,variable]of d.directions.entries())for(const [parameter,value]of row.values.entries()){
          const coefficients=row.derivativeMaps[direction].filter(m=>m.parameter===parameter).map(m=>m.coefficient),declared=calc.add(...coefficients);
          try{checks.push({...calc.compareDerivative(value,variable,declared),direction,parameter});}
          catch(error){checks.push({value,variable,direction,parameter,pass:false,stop:{type:error.name,message:error.message}});}
        }
        for(const factor of factors)for(const variable of d.directions){
          try{factorChecks.push(calc.compareDerivative(factor,variable,calc.zero));}
          catch(error){factorChecks.push({factor,variable,pass:false,stop:{type:error.name,message:error.message}});}
        }
        jacobianCache.set(signature,{checks,factorChecks,diagnostics:calc.diagnostics()});
      }
      const jacobian=jacobianCache.get(signature);
      rows.push({row:rowIndex,label:row.label,localDefinitionKey:key,localBody:row.localBody,localBodyBindingMatches:true,
        factors:factorRows,allCoefficientsConstantInDeclaredDirections:factorRows.every(r=>r.constantInAllDeclaredDirections),
        conditionalFixedLabelJacobianSignature:hash(signature),conditionalFixedLabelJacobianChecks:jacobian.checks.length,
        conditionalFixedLabelJacobianPassed:jacobian.checks.every(c=>c.pass),
        conditionalFixedLabelJacobianFailures:jacobian.checks.filter(c=>!c.pass).length,
        frozenNearestCopySourceSelectors:nearest,requiresAllFrozenSelectorsLocallyConstant:true,
        conditionalFixedLabelCoefficientConstancyPassed:jacobian.factorChecks.every(c=>c.pass),
        guards:row.guards,guardsDischarged:false,allRequestedLocalBodyJetsComputed:false});
    }
    results.push({definitionKey:field.key,name:field.name,definitionSHA256:field.definitionSHA256,directions:d.directions,rows,
      actualRows:rows.length,allRowsRetained:true,coefficientConstancyPasses:rows.filter(r=>r.allCoefficientsConstantInDeclaredDirections).length,
      conditionalFixedLabelJacobianPasses:rows.filter(r=>r.conditionalFixedLabelJacobianPassed).length,
      conditionalFixedLabelCoefficientConstancyPasses:rows.filter(r=>r.conditionalFixedLabelCoefficientConstancyPassed).length,
      requiredSourcePremises:d.requiredSourcePremises??d.analyticPremises??[],flatJoinsProved:false,globalIndexedDerivativeRuleProved:false});
  }
  return {fields:results,uniqueConditionalJacobianChecks:[...jacobianCache].map(([signature,r])=>({signatureSHA256:hash(signature),...r})),
    allSourceRowsRetained:true,sourceLabelsFrozenOnlyInsideConditionalRowCalculus:true,originalSourceChanged:false,
    unknownAnalyticJetsComputed:false,allCoverJoinsAndCrossLabelProductsProved:false};
}

async function main(){const args=process.argv.slice(2),arg=name=>{const at=args.indexOf(name);check(at>=0&&args[at+1],'Missing '+name);return resolve(args[at+1]);},
  input=JSON.parse(await readFile(arg('--input'),'utf8')),output=arg('--output');await mkdir(output,{recursive:true});
  const selectors=closePrimitiveSelectorJets(input.cartesian.scalarProgram,input.cartesian.diagnostics.unresolvedActualJetRequests),
    maps=auditActualIndexedMaps(input.sourceWitnesses,input.definitionBindings);
  await writeFile(resolve(output,'cartesian-closure-core.json'),JSON.stringify({selectors,maps},null,2)+'\n',{flag:'wx'});
  await writeFile(resolve(output,'cartesian-applied-pde-checkpoint.json'),JSON.stringify(applyCartesianLeafClosure(input.cartesian,input.slowChartProof),null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({selectorJetsClosed:selectors.closed.length,unresolvedCartesianJets:selectors.open.length,
    indexedFields:maps.fields.map(f=>({key:f.definitionKey,rows:f.actualRows,constancy:f.coefficientConstancyPasses,jacobian:f.conditionalFixedLabelJacobianPasses})),actualCartesianPDEVerified:false}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
