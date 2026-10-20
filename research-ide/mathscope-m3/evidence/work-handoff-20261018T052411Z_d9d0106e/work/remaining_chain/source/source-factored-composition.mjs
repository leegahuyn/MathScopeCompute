/** Exact mixed derivatives with shared composition recurrences.
 *
 * The unchanged source graph and function definitions remain the inputs.
 * Unlike repeatedly differentiating an already expanded first derivative,
 * these recurrences refer back to D^alpha of each original operand. Every
 * integer Leibniz coefficient and every complete function argument remains.
 * All recursions decrease total requested derivative order. Unsupported
 * original operations still use their actual derivative and propagate its
 * resource/unsupported exceptions. This generic algebra grants no source
 * authority, uniform class bound or numerical enclosure.
 */

const fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  total=a=>a.reduce((s,n)=>s+n,0),key=a=>a.join(','),same=(a,b)=>a.every((n,j)=>n===b[j]),
  expressions=new Set(['actual_expression_partial','m3_aux_expression_partial']);
const choose=(n,k)=>{let c=1n;for(let j=1;j<=k;j++)c=c*BigInt(n-j+1)/BigInt(j);return c;};

export function exactMultiIndexComposition(G,{maximumOrder=16}={}){
  if(!Number.isSafeInteger(maximumOrder)||maximumOrder<1||maximumOrder>32)
    fail('Declare an exact finite mixed derivative order from1 through32.','RESOURCE_LIMIT');
  const scratchByVariables=new Map(),retainedByVariables=new Map(),splits=new Map(),
    statistics={newDerivativeBodies:0,productSummands:0,compositionSummands:0,retainedBodies:0,
      firstDerivativeFallbacks:0,scratchReleases:0,releasedScratchEntries:0,operations:{}};
  const split=alpha=>{
    const k=key(alpha);if(splits.has(k))return splits.get(k);
    let rows=[{beta:[],coefficient:1n}];
    for(const n of alpha)rows=rows.flatMap(row=>Array.from({length:n+1},(_,j)=>({
      beta:[...row.beta,j],coefficient:row.coefficient*choose(n,j)})));
    splits.set(k,rows);return rows;
  };
  const cacheFor=variables=>{
    const k=key(variables);if(!scratchByVariables.has(k))scratchByVariables.set(k,new Map());
    return scratchByVariables.get(k);
  };
  const validate=(body,variables,alpha)=>{
    if(!G.nodes[body]||!Array.isArray(variables)||!variables.length||new Set(variables).size!==variables.length||
      variables.some(x=>G.nodes[x]?.op!=='coordinate')||!Array.isArray(alpha)||alpha.length!==variables.length||
      alpha.some(n=>!Number.isSafeInteger(n)||n<0)||total(alpha)>maximumOrder)
      fail('Use an existing actual body and distinct original coordinates within the declared finite mixed order.','RESOURCE_LIMIT');
  };
  const derivative=(body,variables,alpha)=>{
    validate(body,variables,alpha);const cache=cacheFor(variables),retained=retainedByVariables.get(key(variables));
    const D=(id,a)=>{
      if(total(a)===0)return id;const k=id+':'+key(a);
      if(retained?.has(k))return retained.get(k);if(cache.has(k))return cache.get(k);
      if(a.some((n,j)=>n&&!G.dependsOn(id,variables[j]))){cache.set(k,G.zero);return G.zero;}
      if(statistics.newDerivativeBodies%1024===0)G.checkCancelled?.();
      const {op,args}=G.nodes[id],j=a.findIndex(n=>n>0),rest=[...a];rest[j]--;
      const difference=(u,v)=>u.map((n,i)=>n-v[i]),weighted=(coefficient,left,right)=>
        G.mul(G.q(coefficient),left,right),chain=(outer,inner,scale=G.one)=>{
          const terms=[];for(const {beta,coefficient}of split(rest)){
            const right=D(inner,difference(a,beta));if(right===G.zero)continue;
            const left=D(outer,beta);if(left===G.zero)continue;
            terms.push(weighted(coefficient,left,right));statistics.compositionSummands++;
          }return G.mul(scale,G.add(...terms));
        };
      let out;
      if(op==='add')out=G.add(...args.map(x=>D(x,a)));
      else if(op==='multiply'){
        if(args.length!==2)fail('An original product must keep both exact operands.');
        const terms=[];for(const {beta,coefficient}of split(a)){
          const left=D(args[0],beta);if(left===G.zero)continue;
          const right=D(args[1],difference(a,beta));if(right===G.zero)continue;
          terms.push(weighted(coefficient,left,right));statistics.productSummands++;
        }out=G.add(...terms);
      }else if(op==='inverse'){
        // D^alpha(u*f)=0, f=1/u. The isolated term is u*D^alpha f.
        // Every remaining self request has strictly smaller total order.
        const terms=[];for(const {beta,coefficient}of split(a)){
          if(total(beta)===0)continue;const left=D(args[0],beta);if(left===G.zero)continue;
          const right=D(id,difference(a,beta));if(right===G.zero)continue;
          terms.push(weighted(coefficient,left,right));statistics.compositionSummands++;
        }out=G.neg(G.mul(id,G.add(...terms)));
      }else if(op==='sqrt_positive'){
        // D^alpha(f*f)=D^alpha u. Positivity of this retained source sqrt
        // justifies the same factor1/(2*f) as its original first derivative.
        const terms=[];for(const {beta,coefficient}of split(a)){
          if(total(beta)===0||same(beta,a))continue;
          const left=D(id,beta);if(left===G.zero)continue;
          const right=D(id,difference(a,beta));if(right===G.zero)continue;
          terms.push(weighted(coefficient,left,right));statistics.compositionSummands++;
        }out=G.div(G.sub(D(args[0],a),G.add(...terms)),G.mul(G.q(2),id));
      }else if(op==='exp')out=chain(id,args[0]);
      else if(op==='log_positive')out=chain(G.inv(args[0]),args[0]);
      else if(op==='sine')out=chain(G.cosine(args[0]),args[0]);
      else if(op==='cosine')out=G.neg(chain(G.sine(args[0]),args[0]));
      else if(op==='integer_power'){
        if(!Number.isSafeInteger(args[1])||args[1]<2)
          fail('The retained graph represents only positive integer powers here.');
        // Polynomial rule also holds where u=0: it introduces no division
        // by u or any new nonvanishing premise.
        out=chain(G.pow(args[0],args[1]-1),args[0],G.q(args[1]));
      }else if(op==='source_step_derivative')out=chain(G.step(args[0],args[1]+1),args[0]);
      else if(expressions.has(op)){
        const [system,values,orders]=args,definition=G.expressionSystem(system),terms=[];
        if(definition.parameters.length!==values.length||orders.length!==values.length||
          G.expressionValue(system,values,orders)!==id)
          fail('An original shared function lost its defining system or complete arguments.');
        // D^alpha F(g)=sum_i sum_(beta<=alpha-e_j) binomial(alpha-e_j,beta)
        // D^beta((partial_i F)(g))*D^(alpha-beta)g_i.
        for(let i=0;i<values.length;i++){
          let next=null;for(const {beta,coefficient}of split(rest)){
            const right=D(values[i],difference(a,beta));if(right===G.zero)continue;
            if(next===null){const higher=[...orders];higher[i]++;next=G.expressionValue(system,values,higher);}
            const left=D(next,beta);if(left===G.zero)continue;
            terms.push(weighted(coefficient,left,right));statistics.compositionSummands++;
          }
        }out=G.add(...terms);
      }else if(op==='definite_integral'&&
          [args[2],args[3]].every(x=>variables.every((v,i)=>!a[i]||!G.dependsOn(x,v)))){
        // The original body remains inside its actual fixed-endpoint
        // integral. Moving endpoints deliberately take the full FTC path.
        out=G.integral(D(args[0],a),args[1],args[2],args[3]);
      }else if(op==='smooth_piecewise')out=G.choose(args[0],args[1],args[2],...args.slice(3).map(x=>D(x,a)));
      else{
        const first=G.derivative(id,variables[j]);statistics.firstDerivativeFallbacks++;
        out=D(first,rest);
      }
      cache.set(k,out);statistics.newDerivativeBodies++;
      statistics.operations[op]=(statistics.operations[op]??0)+1;return out;
    };return D(body,alpha);
  };
  const retain=(body,variables,alpha,value)=>{
    validate(body,variables,alpha);if(!G.nodes[value])fail('A retained exact derivative body is missing.');
    const v=key(variables),k=body+':'+key(alpha),cache=cacheFor(variables);
    if(!retainedByVariables.has(v))retainedByVariables.set(v,new Map());const retained=retainedByVariables.get(v);
    if(cache.has(k)&&cache.get(k)!==value||retained.has(k)&&retained.get(k)!==value)
      fail('Completed actual derivative closures disagree on the same body and mixed order.');
    if(!retained.has(k)){retained.set(k,value);statistics.retainedBodies++;}cache.delete(k);
  };
  const releaseScratch=()=>{
    let entries=0;for(const cache of scratchByVariables.values()){entries+=cache.size;cache.clear();}
    statistics.scratchReleases++;statistics.releasedScratchEntries+=entries;
    return {releasedScratchEntries:entries,retainedDerivativeBodies:statistics.retainedBodies,
      sourceNodesAndDefinitionsRetained:true,derivativeOrdersChanged:false};
  };
  return {derivative,retain,releaseScratch,statistics,maximumOrder,sourceAuthenticated:false,
    identity:'Full multi-index Leibniz plus exact mixed composition recurrences at unchanged source operands.',
    everyIntegerLeibnizCoefficientRetained:true,everyFunctionArgumentRetained:true,
    mixedCompositionRecurrencesRetainExactSourceOperations:true,positivePolynomialPowersRequireNoNonzeroPremise:true,
    omittedDerivativesSetToZero:false,sourceGraphMethodsChanged:false};
}
