/** Exact first and symmetric second slow variations of a retained pulse ODE.
 *
 * For m selected slow coordinates this is one 2*(1+m+m*(m+1)/2) component
 * linear, nonautonomous system. Its ordered Volterra series is a definition
 * of the convergent solution, not a numerical value oracle. No derivative
 * matrix, derivative datum, or endpoint velocity can be supplied by a caller.
 *
 * All supplied norms are explicit mathematical premises of this GENERIC
 * kernel. An actual-source adapter must independently establish their domain,
 * regularity, nonnegative values, and bounds, and authenticate the source
 * graph. This file does not confer source authentication or a Lean proof.
 */
import {ActualCovarianceExpressions} from './actual-covariance-volterra.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const state=new WeakMap();
const snapshot=x=>JSON.stringify(x);
const freeze=x=>{
  if(x&&typeof x==='object'&&!Object.isFrozen(x)){
    for(const value of Object.values(x))freeze(value);
    Object.freeze(x);
  }
  return x;
};
const inputKeys=new Set(['name','variable','parameters','directions','matrix','initial','left','length',
  'matrixNorm','matrixFirstNorms','matrixSecondNorms','matrixTimeNorm','initialNorm',
  'initialFirstNorms','initialSecondNorms','leftFirstNorms','leftSecondNorms']);

export class ActualPulseJetExpressions extends ActualCovarianceExpressions {
  constructor(base,options={}){
    super(base,options);
    // A serialized/copied descriptor cannot copy the private binding. New
    // systems may be appended, but inherited jet receipts are not certified.
    this.pulseJetSystems=structuredClone(base.pulseJetSystems??[]);
    const covarianceOrigins=new Map();
    this.covarianceSystems.forEach((s,id)=>covarianceOrigins.set(id,freeze(s)));
    state.set(this,{systems:new Map(),partials:new Map(),aliases:new Map(),reverseAliases:new Map(),covarianceOrigins});
  }

  /** Inspection receives a copy; editing it cannot redirect differentiation. */
  get pulseJetAliases(){return new Map(state.get(this)?.aliases??[]);}

  defineCovarianceVolterra(input){
    const id=super.defineCovarianceVolterra(input);
    state.get(this).covarianceOrigins.set(id,freeze(this.covarianceSystems[id]));
    return id;
  }

  assertPulseJetCovariance(system){
    const s=state.get(this)?.covarianceOrigins.get(system);
    if(!s||this.covarianceSystems[system]!==s)fail('INVALID_SOURCE_CONSTRUCTION','The unchanged covariance definition must belong to this graph; a copied descriptor cannot replace it.');
    return s;
  }

  covarianceValue(system,component,time,values){
    this.assertPulseJetCovariance(system);
    return super.covarianceValue(system,component,time,values);
  }

  definePulseSecondVariation(input){
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!inputKeys.has(k)))
      fail('INVALID_INPUT','A pulse jet needs its explicit original ODE, initial datum, endpoints and norm premises; derivative bodies are never caller inputs.');
    const {name,variable,parameters,directions,matrix,initial,left,length,matrixNorm,matrixFirstNorms,
      matrixSecondNorms,matrixTimeNorm,initialNorm,initialFirstNorms,initialSecondNorms,leftFirstNorms,leftSecondNorms}=input;
    const root=x=>Number.isSafeInteger(x)&&x>=0&&!!this.nodes[x];
    if(typeof name!=='string'||!name||this.nodes[variable]?.op!=='coordinate'||!Array.isArray(parameters)||
       new Set(parameters).size!==parameters.length||parameters.includes(variable)||parameters.some(x=>this.nodes[x]?.op!=='coordinate')||
       !Array.isArray(directions)||directions.length<1||directions.length>3||new Set(directions).size!==directions.length||directions.some(x=>!parameters.includes(x))||
       !Array.isArray(matrix)||matrix.length!==2||matrix.some(r=>!Array.isArray(r)||r.length!==2||r.some(x=>!root(x)))||
       !Array.isArray(initial)||initial.length!==2||initial.some(x=>!root(x)))
      fail('INVALID_INPUT','Use a two-component explicit ODE and one through three distinct declared slow directions.');
    const count=directions.length;
    const vector=x=>Array.isArray(x)&&x.length===count&&x.every(root);
    const symmetric=x=>Array.isArray(x)&&x.length===count&&x.every(vector)&&x.every((r,i)=>r.every((v,j)=>v===x[j][i]));
    if(![left,length,matrixNorm,matrixTimeNorm,initialNorm].every(root)||
       ![matrixFirstNorms,initialFirstNorms,leftFirstNorms].every(vector)||
       ![matrixSecondNorms,initialSecondNorms,leftSecondNorms].every(symmetric))
      fail('INVALID_INPUT','Every first, symmetric second, time-matrix and moving-initial norm premise must be explicit; a missing bound is not zero.');
    const normRoots=[matrixNorm,matrixTimeNorm,initialNorm,...matrixFirstNorms,...matrixSecondNorms.flat(),
      ...initialFirstNorms,...initialSecondNorms.flat(),...leftFirstNorms,...leftSecondNorms.flat()];
    if([length,...normRoots].some(x=>this.isq(x)&&this.fraction(x)[0]<0n))
      fail('INVALID_INPUT','Interval lengths and norm upper bounds must be nonnegative.');
    const all=new Set([variable,...parameters]),constants=new Set(parameters);
    if(matrix.flat().some(x=>[...this.freeCoordinates(x)].some(c=>!all.has(c))))
      fail('INVALID_INPUT','A coefficient has an undeclared free coordinate.');
    if([...initial,left,length,...normRoots].some(x=>[...this.freeCoordinates(x)].some(c=>!constants.has(c))))
      fail('INVALID_INPUT','The initial data, endpoints and uniform norm bounds can depend only on declared parameters, never on pulse time.');

    const first=body=>directions.map(x=>this.derivative(body,x));
    // A mixed jet is represented once, in canonical i<=j order. Equality of
    // mixed orders uses the stated C2 regularity premise, not numeric samples.
    const second=rows=>{
      const result=Array.from({length:count},()=>Array(count));
      for(let i=0;i<count;i++)for(let j=i;j<count;j++)result[j][i]=result[i][j]=this.derivative(rows[i],directions[j]);
      return result;
    };
    const matrixFirst=directions.map(a=>matrix.map(r=>r.map(x=>this.derivative(x,a))));
    const matrixSecond=Array.from({length:count},()=>Array(count));
    for(let i=0;i<count;i++)for(let j=i;j<count;j++)
      matrixSecond[j][i]=matrixSecond[i][j]=matrixFirst[i].map(r=>r.map(x=>this.derivative(x,directions[j])));
    const matrixTime=matrix.map(r=>r.map(x=>this.derivative(x,variable)));
    const initialFirst=directions.map(a=>initial.map(x=>this.derivative(x,a)));
    const initialSecond=Array.from({length:count},()=>Array(count));
    for(let i=0;i<count;i++)for(let j=i;j<count;j++)
      initialSecond[j][i]=initialSecond[i][j]=initialFirst[i].map(x=>this.derivative(x,directions[j]));
    const leftFirst=first(left),leftSecond=second(leftFirst),lengthFirst=first(length),lengthSecond=second(lengthFirst);
    const atLeft=x=>this.substitute(x,variable,left),matvec=(A,u)=>A.map(r=>this.add(...r.map((x,j)=>this.mul(x,u[j]))));
    const matrixAtLeft=matrix.map(r=>r.map(atLeft)),initialRhs=matvec(matrixAtLeft,initial);
    const variationFirstInitial=initialFirst.map((g,i)=>g.map((x,k)=>this.sub(x,this.mul(initialRhs[k],leftFirst[i]))));
    const initialMixedTimeRhs=matrixFirst.map((A,i)=>{
      const x=matvec(A.map(r=>r.map(atLeft)),initial),y=matvec(matrixAtLeft,variationFirstInitial[i]);
      return x.map((v,k)=>this.add(v,y[k]));
    });
    const initialSquaredMatrixRhs=matvec(matrixAtLeft,initialRhs);
    const initialTimeSecondRhs=matvec(matrixTime.map(r=>r.map(atLeft)),initial)
      .map((x,k)=>this.add(x,initialSquaredMatrixRhs[k]));
    const variationSecondInitial=Array.from({length:count},()=>Array(count));
    for(let i=0;i<count;i++)for(let j=i;j<count;j++)variationSecondInitial[j][i]=variationSecondInitial[i][j]=initialSecond[i][j].map((x,k)=>
      this.sub(x,this.add(this.mul(initialMixedTimeRhs[i][k],leftFirst[j]),this.mul(initialMixedTimeRhs[j][k],leftFirst[i]),
        this.mul(initialTimeSecondRhs[k],leftFirst[i],leftFirst[j]),this.mul(initialRhs[k],leftSecond[i][j]))));

    const blocks=[],firstBlocks=[],secondBlocks=Array.from({length:count},()=>Array(count));
    const addBlock=(orders,label)=>{
      const block={orders,degree:orders.reduce((a,b)=>a+b,0),offset:2*blocks.length,label};blocks.push(block);return block.offset;
    };
    addBlock(Array(count).fill(0),'value');
    for(let i=0;i<count;i++){
      const orders=Array(count).fill(0);orders[i]=1;firstBlocks[i]=addBlock(orders,'first_'+i);
    }
    for(let i=0;i<count;i++)for(let j=i;j<count;j++){
      const orders=Array(count).fill(0);orders[i]++;orders[j]++;
      secondBlocks[j][i]=secondBlocks[i][j]=addBlock(orders,'second_'+i+'_'+j);
    }
    const dimension=2*blocks.length,augmentedMatrix=Array.from({length:dimension},()=>Array(dimension).fill(this.zero));
    const addMatrix=(row,column,A)=>A.forEach((r,i)=>r.forEach((x,j)=>{augmentedMatrix[row+i][column+j]=this.add(augmentedMatrix[row+i][column+j],x);}));
    for(const b of blocks)addMatrix(b.offset,b.offset,matrix);
    for(let i=0;i<count;i++)addMatrix(firstBlocks[i],0,matrixFirst[i]);
    for(let i=0;i<count;i++)for(let j=i;j<count;j++){
      addMatrix(secondBlocks[i][j],0,matrixSecond[i][j]);
      addMatrix(secondBlocks[i][j],firstBlocks[j],matrixFirst[i]);
      addMatrix(secondBlocks[i][j],firstBlocks[i],matrixFirst[j]);
    }
    const augmentedInitial=[...initial,...variationFirstInitial.flat()];
    for(let i=0;i<count;i++)for(let j=i;j<count;j++)augmentedInitial.push(...variationSecondInitial[i][j]);

    const firstInitialNorms=initialFirstNorms.map((x,i)=>this.add(x,this.mul(matrixNorm,initialNorm,leftFirstNorms[i])));
    const secondInitialNorms=Array.from({length:count},()=>Array(count));
    const timeSecondInitialNorm=this.mul(this.add(matrixTimeNorm,this.pow(matrixNorm,2)),initialNorm);
    for(let i=0;i<count;i++)for(let j=i;j<count;j++)secondInitialNorms[j][i]=secondInitialNorms[i][j]=this.add(initialSecondNorms[i][j],
      this.mul(this.add(this.mul(matrixFirstNorms[i],initialNorm),this.mul(matrixNorm,firstInitialNorms[i])),leftFirstNorms[j]),
      this.mul(this.add(this.mul(matrixFirstNorms[j],initialNorm),this.mul(matrixNorm,firstInitialNorms[j])),leftFirstNorms[i]),
      this.mul(timeSecondInitialNorm,leftFirstNorms[i],leftFirstNorms[j]),this.mul(matrixNorm,initialNorm,leftSecondNorms[i][j]));
    const blockRowNorms=[matrixNorm,...matrixFirstNorms.map(x=>this.add(matrixNorm,x))];
    const blockInitialNorms=[initialNorm,...firstInitialNorms];
    for(let i=0;i<count;i++)for(let j=i;j<count;j++){
      blockRowNorms.push(this.add(matrixNorm,matrixFirstNorms[i],matrixFirstNorms[j],matrixSecondNorms[i][j]));
      blockInitialNorms.push(secondInitialNorms[i][j]);
    }
    const augmentedMatrixNorm=this.maximum(...blockRowNorms),augmentedInitialNorm=this.maximum(...blockInitialNorms);
    const s=freeze({name,variable,parameters:[...parameters],directions:[...directions],directionParameterIndices:directions.map(x=>parameters.indexOf(x)),
      matrix:structuredClone(matrix),matrixFirst,matrixSecond,matrixTime,initial:[...initial],initialFirst,initialSecond,
      left,length,leftFirst,leftSecond,lengthFirst,lengthSecond,matrixAtLeft,initialRhs,initialMixedTimeRhs,initialTimeSecondRhs,
      variationFirstInitial,variationSecondInitial,blocks,firstBlocks,secondBlocks,dimension,augmentedMatrix,augmentedInitial,
      bounds:{matrixNorm,matrixFirstNorms:[...matrixFirstNorms],matrixSecondNorms:structuredClone(matrixSecondNorms),matrixTimeNorm,
        initialNorm,initialFirstNorms:[...initialFirstNorms],initialSecondNorms:structuredClone(initialSecondNorms),
        leftFirstNorms:[...leftFirstNorms],leftSecondNorms:structuredClone(leftSecondNorms),firstInitialNorms,secondInitialNorms,
        blockRowNorms,blockInitialNorms,augmentedMatrixNorm,augmentedInitialNorm},
      equations:{original:'w_v=M w; w(ell(a),a)=g(a)',first:'s_i,v=M s_i+M_i w',
        second:'s_ij,v=M s_ij+M_i s_j+M_j s_i+M_ij w (the repeated direction has 2*M_i*s_i)',
        firstInitial:'s_i(ell)=g_i-M(ell)g*ell_i',
        secondInitial:'s_ij(ell)=g_ij-(M_i*g+M*s_i)*ell_j-(M_j*g+M*s_j)*ell_i-(M_v+M*M)*g*ell_i*ell_j-M*g*ell_ij',
        endpointFirst:'d_i w(b(a),a)=s_i(b,a)+w_v(b,a)*b_i',
        endpointSecond:'d_ij w(b(a),a)=s_ij+s_i,v*b_j+s_j,v*b_i+w_vv*b_i*b_j+w_v*b_ij',
        timeSecond:'w_vv=(M_v+M*M)w'},
      normConvention:'Induced infinity norm of the actual augmented block matrix: max(K, K+Ki, K+Ki+Kj+Kij).',
      regularityPremises:['M is C2 in the selected parameters on a neighborhood of the swept interval.',
        'M is C1 in pulse time where moving-endpoint second derivatives are evaluated; g and ell are C2.',
        'Each supplied matrix and datum norm is pointwise in parameters and uniform in pulse time; local uniform derivative convergence requires locally bounded parameter envelopes.',
        'Lengths and all supplied norm upper bounds are nonnegative.'],
      derivativeOrder:2,canonicalSymmetricSecondDerivatives:true,sourceNormAuthenticated:false,sourceGraphAuthenticationInAdapter:true,
      thirdSlowDerivativeSupported:false,finitePartialSumIsExactSolution:false});
    const id=this.pulseJetSystems.length;this.pulseJetSystems.push(s);state.get(this).systems.set(id,s);return id;
  }

  assertPulseSecondVariation(system){
    const s=state.get(this)?.systems.get(system);
    if(!s||this.pulseJetSystems[system]!==s)fail('INVALID_SOURCE_CONSTRUCTION','Use the immutable internally differentiated jet system in its originating graph; copied receipts cannot authorize an operation.');
    return true;
  }

  bindOriginalCovarianceJet(covarianceSystem,jetSystem){
    this.assertPulseSecondVariation(jetSystem);
    const c=this.assertPulseJetCovariance(covarianceSystem),s=this.pulseJetSystems[jetSystem],privateState=state.get(this);
    if(c.variable!==s.variable||snapshot(c.parameters)!==snapshot(s.parameters)||snapshot(c.matrix)!==snapshot(s.matrix)||
       snapshot(c.initial)!==snapshot(s.initial)||s.left!==this.zero||c.length!==s.length)
      fail('INVALID_SOURCE_CONSTRUCTION','The jet must retain the exact original covariance ODE, initial datum, interval and parameter list.');
    if(privateState.aliases.has(covarianceSystem)||privateState.reverseAliases.has(jetSystem))
      fail('INVALID_INPUT','A covariance ODE and its jet have one immutable local binding.');
    privateState.aliases.set(covarianceSystem,jetSystem);privateState.reverseAliases.set(jetSystem,covarianceSystem);
    return true;
  }

  pulseJetComponent(system,component,orders){
    this.assertPulseSecondVariation(system);const s=this.pulseJetSystems[system];
    if(![0,1].includes(component)||!Array.isArray(orders)||orders.length!==s.directions.length||
       orders.some(x=>!Number.isSafeInteger(x)||x<0)||orders.reduce((a,b)=>a+b,0)>2)
      fail('UNSUPPORTED','Select a two-component value, first derivative, or symmetric second slow derivative.');
    const b=s.blocks.find(x=>x.orders.every((v,j)=>v===orders[j]));
    if(!b)fail('UNSUPPORTED','This slow derivative is not constructed.');
    return b.offset+component;
  }

  pulseJetEvaluation(system,component,time,values){
    this.assertPulseSecondVariation(system);const s=this.pulseJetSystems[system];
    if(!Number.isSafeInteger(component)||component<0||component>=s.dimension||!this.nodes[time]||
       !Array.isArray(values)||values.length!==s.parameters.length||values.some(x=>!this.nodes[x]))
      fail('INVALID_INPUT','Supply a constructed jet component, pulse time and all explicit parameter arguments.');
    return s;
  }

  pulseJetValue(system,component,time,values){
    const s=this.pulseJetEvaluation(system,component,time,values),privateState=state.get(this);
    const original=privateState.reverseAliases.get(system);
    // Once bound, the value block is literally the genuine original root,
    // avoiding a duplicate source pulse masquerading as the original.
    if(component<2&&original!==undefined)return this.covarianceValue(original,component,time,values);
    const at=x=>this.simultaneousSubstitute(x,s.parameters,values);
    if(time===at(s.left))return at(s.augmentedInitial[component]);
    return this.node('actual_pulse_jet_volterra',[system,component,time,[...values]]);
  }

  pulseJetRhs(system,component,time,values){
    const s=this.pulseJetEvaluation(system,component,time,values);
    return this.add(...s.augmentedMatrix[component].map((x,j)=>x===this.zero?this.zero:
      this.mul(this.simultaneousSubstitute(x,[s.variable,...s.parameters],[time,...values]),this.pulseJetValue(system,j,time,values))));
  }

  pulseJetPartialSum(system,{terms=1,time,values}={}){
    this.assertPulseSecondVariation(system);const s=this.pulseJetSystems[system],privateState=state.get(this);
    if(!Number.isSafeInteger(terms)||terms<0||terms>32)
      fail('RESOURCE_LIMIT','Display zero through 32 finite ordered-integral terms; the convergent tail remains explicit.');
    time??=s.variable;values??=s.parameters;this.pulseJetEvaluation(system,0,time,values);
    const key=snapshot([system,terms,time,values]);if(privateState.partials.has(key))return privateState.partials.get(key);
    let term=[...s.augmentedInitial],sum=[...term];const rows=[];
    for(let n=1;n<=terms;n++){
      this.checkCancelled?.();const t=this.fresh('pulse_jet_ordered_time'),at=x=>this.substitute(x,s.variable,t);
      term=s.augmentedMatrix.map(row=>this.integral(this.add(...row.map((x,j)=>x===this.zero?this.zero:this.mul(at(x),at(term[j])))),t,s.left,s.variable));
      sum=sum.map((x,j)=>this.add(x,term[j]));rows.push({order:n,term:[...term]});
    }
    const replace=x=>this.simultaneousSubstitute(x,[s.variable,...s.parameters],[time,...values]);
    const K=replace(s.bounds.augmentedMatrixNorm),L=replace(s.length),I=replace(s.bounds.augmentedInitialNorm),z=this.mul(K,L);
    const tail=this.mul(I,this.exp(z),this.pow(z,terms+1),this.q(1,factorial(terms+1)));
    const result=freeze({system,terms,values:sum.map(replace),rows:rows.map(r=>({...r,term:r.term.map(replace)})),tail,
      tailFormula:'I_aug*exp(K_aug*L)*(K_aug*L)^(N+1)/(N+1)!',tailNorm:'Infinity norm; the bound applies to every augmented component.',
      augmentedMatrixNorm:K,augmentedInitialNorm:I,intervalLength:L,tailTendsToZero:true,validInterval:'ell(a)<=time<=ell(a)+L(a)',
      boundPremises:structuredClone(s.bounds),derivativeOrder:2,finiteSumIsExactSolution:false,finiteTermsAreExactExpressions:true,
      finiteJetSumEqualsDerivativeOfFiniteValueSum:s.leftFirst.every(x=>x===this.zero)&&s.leftSecond.flat().every(x=>x===this.zero),
      sourceNormAuthenticated:false,numericalWholeSourceEvaluation:false});
    privateState.partials.set(key,result);return result;
  }

  freeCoordinates(id){
    const n=this.nodes[id];if(n?.op==='actual_pulse_jet_volterra'){
      const out=new Set();for(const x of [n.args[2],...n.args[3]])for(const c of this.freeCoordinates(x))out.add(c);return out;
    }
    return super.freeCoordinates(id);
  }
  dependsOn(id,variable){return this.nodes[id]?.op==='actual_pulse_jet_volterra'?this.freeCoordinates(id).has(variable):super.dependsOn(id,variable);}
  substitute(id,variable,value){
    const n=this.nodes[id];if(n?.op==='actual_pulse_jet_volterra')
      return this.pulseJetValue(n.args[0],n.args[1],this.substitute(n.args[2],variable,value),n.args[3].map(x=>this.substitute(x,variable,value)));
    return super.substitute(id,variable,value);
  }
  derivative(id,variable){
    const n=this.nodes[id];
    // Inherited source AD can retain a piecewise node whose three branches
    // are zero when a frozen rounded carrier is differentiated. Structural
    // independence gives the exact zero before that unused branch algebra.
    if(n?.op!=='actual_pulse_jet_volterra'&&n?.op!=='actual_covariance_volterra')
      return this.dependsOn(id,variable)?super.derivative(id,variable):this.zero;
    const [original,component,time,values]=n.args,privateState=state.get(this),isCovariance=n.op==='actual_covariance_volterra';
    if(isCovariance)this.assertPulseJetCovariance(original);else this.assertPulseSecondVariation(original);
    if(!this.dependsOn(id,variable))return this.zero;
    const system=isCovariance?privateState.aliases.get(original):original;
    const dp=values.map(x=>this.derivative(x,variable)),dt=this.derivative(time,variable),terms=[];
    if(isCovariance&&system===undefined)return super.derivative(id,variable);
    this.assertPulseSecondVariation(system);const s=this.pulseJetSystems[system];
    if(dt!==this.zero)terms.push(this.mul(dt,isCovariance?this.covarianceRhs(original,component,time,values):this.pulseJetRhs(system,component,time,values)));
    const orders=isCovariance?Array(s.directions.length).fill(0):s.blocks[Math.floor(component/2)].orders;
    for(let j=0;j<dp.length;j++)if(dp[j]!==this.zero){
      const direction=s.directionParameterIndices.indexOf(j);
      if(direction<0)fail('UNSUPPORTED','This parameter is not among the retained slow directions; no missing derivative is assumed zero.');
      const next=[...orders];next[direction]++;
      terms.push(this.mul(dp[j],this.pulseJetValue(system,this.pulseJetComponent(system,component%2,next),time,values)));
    }
    return this.add(...terms);
  }

  pack(roots,extra={}){
    for(let id=0;id<this.pulseJetSystems.length;id++)this.assertPulseSecondVariation(id);
    for(const [c,j]of state.get(this).aliases){this.assertPulseJetCovariance(c);this.assertPulseSecondVariation(j);}
    return super.pack(roots,{...extra,pulseJetSystems:structuredClone(this.pulseJetSystems),pulseJetAliases:[...state.get(this).aliases],
      pulseJetKernel:{schema:'MathScope.ActualPulseJetKernel/1',firstSlowDerivativeSupported:true,secondSlowDerivativeSupported:true,
        mixedSlowDerivativeSupported:true,thirdSlowDerivativeSupported:false,sourceNormAuthenticationInAdapter:true,sourceNormAuthenticated:false,
        originalCovarianceKernelUnchanged:true,internallyBoundOriginalValueRoots:true,immutableSystemDefinitions:true,
        initialDatumAndBothMovingEndpointChainsRetained:true,matrixTimeDerivativeInSecondEndpointChain:true,
        repeatedDirectionFactorTwo:true,orderedNoncommutativeVolterraSeries:true,augmentedInducedInfinityNormTail:true,
        finitePartialSumIsExactSolution:false,numericalWholeSourceEvaluation:false,newLeanKernelProof:false}});
  }
}
