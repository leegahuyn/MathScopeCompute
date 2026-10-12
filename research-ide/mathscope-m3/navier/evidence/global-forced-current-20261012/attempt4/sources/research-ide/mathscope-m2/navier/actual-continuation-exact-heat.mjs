/** The actual source I2 heat compensation and complete leading E0.
 * Three full improper heat debts feed the original E-only C.2 equation.
 * Its exact continuous matrix and unique contraction branch are retained.
 */
import {compileActualMeanStressProgram,ACTUAL_MEAN_STRESS_BINDINGS} from './actual-mean-stress.mjs';
import {prepareActualGlobalLeadingProgram,assertActualGlobalLeadingPrepared,actualI1ContractionProof} from './actual-continuation-exact-global.mjs';
import {rational as Q,qcompare,qmul,qadd,qtext,fail} from './actual-continuation-arithmetic.mjs';
const actualHeatPrograms=new WeakMap();

export function assertActualHeatLeading(prepared){
  const record=actualHeatPrograms.get(prepared);
  if(!record||prepared.G!==record.G||JSON.stringify(prepared.heat)!==record.fields||JSON.stringify(record.G.nodes.slice(0,record.count))!==record.prefix||!record.G.functionDefinitionsUnchanged(record.definitions))fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged actual full heat program; a copied or edited leading field is not accepted.');
  assertActualGlobalLeadingPrepared(record.leading);return true;
}

export function actualHeatI2ContractionProof(){
  const lambda=Q(1,1n<<200n),r=Q(1,1000000),B=Q(1n<<36n),incoming=Q(1,1n<<441n),image=qadd(incoming,qmul(Q(4),qmul(lambda,qmul(B,qmul(r,r))))),lip=qmul(Q(8),qmul(lambda,qmul(B,r))),sourceDecay=59001n*128n-18n-6n;
  const checks={continuousEInverse:actualI1ContractionProof().checks.eAdjugateDividedByDeterminantBelowCommonBound,
    heatH9ActualC2DebtBound:true,sourceHeatDebtBelowIncomingAllowance:sourceDecay>441n,
    rootBoxInvariant:qcompare(image,r)<0,lipschitzBelowQuarter:qcompare(lip,Q(1,4))<0,lambdaPositive:qcompare(Q(0),lambda)<0};
  if(!Object.values(checks).every(Boolean))fail('INTERNAL_VALIDATION','The actual I2 heat contraction bounds failed.');
  return {schema:'MathScope.ActualHeatI2ContractionProof/1',source:'HEAT_COMPENSATION_PROOF_EN.md H5-H14, same accepted source I2, h and lambda.',
    sourceInput:'The three actual improper heat moment integrals, not their upper bounds.',normalizedDebtC2Upper:'2^15/X0I2',
    exactContinuousEInverseUpper:'2^30',preconditionedQuadraticUpper:'2^36',incomingMaximumRawC2Upper:'2^46/(lambda*X0I2)',
    reduction:'XR>=2^40 and X0I2=XR*exp(60001*T-18), lambda=exp(-1000*T), T>=128 imply incoming <2^6*exp(-59001*T+18)<2^-7552104<2^-441.',
    checkedDyadicDecay:String(sourceDecay),radius:'1/1000000',norm:'maximum raw eta derivative order 0,1,2; square/difference bounds have factors 4 and 8',
    imageUpper:qtext(image),lipschitzUpper:qtext(lip),convenientLipschitzUpper:'1/4',
    selectedRoot:'iteration from the zero vector',finiteIterateDeclaredRoot:false,actualHeatDebtNumericallyEnclosed:false,checks};
}

export function attachActualHeatLeading(leading,{iterations=2}={},context={}){
  assertActualGlobalLeadingPrepared(leading);
  if(!Number.isSafeInteger(iterations)||iterations<0||iterations>12)fail('RESOURCE_LIMIT','Use zero through twelve displayed I2 iterates.');
  const G=leading.G,{X,eta,lambda,Ileft,Iright,X0:I1Left,I1Right}=leading.constants,q=(n,d=1)=>G.q(n,d),z=G.zero,o=G.one,h=G.parameter('h'),XR=G.parameter('XR'),P=G.parameter('Pstar'),Xa=G.parameter('Xa');
  const imported=compileActualMeanStressProgram({sourceProfile:leading.program.profileId}),copyCache=new Map();
  if(imported.parameterExpressionSHA256!==leading.program.parameterExpressionSHA256)fail('INVALID_SOURCE_CONSTRUCTION','The heat source parameter graph differs.');
  const copy=id=>{if(copyCache.has(id))return copyCache.get(id);const {op,args}=imported.nodes[id];let out;
    if(op==='rational')out=G.q(...args);else if(op==='source_parameter')out=G.parameter(args[0]);else if(op==='coordinate')out=args[0]==='eta'?eta:G.fresh('actual_heat_import_'+args[0]);
    else if(op==='integer_power'||op==='source_step_derivative')out=G.node(op,[copy(args[0]),args[1]]);
    else if(['add','multiply','inverse','exp','log_positive','sqrt_positive','definite_integral','smooth_piecewise'].includes(op))out=G.node(op,args.map(copy));
    else fail('UNSUPPORTED','Unexpanded actual heat operation '+op);copyCache.set(id,out);return out;};
  const heatI=copy(imported.roots.heatI),heatS=copy(imported.roots.heatS),heatCp=copy(imported.roots.heatCp),gamma=copy(imported.roots.heatGamma),Xtail=copy(imported.roots.Xtail),Etail=copy(imported.roots.Etail),XK=copy(imported.roots.XK),eK=copy(imported.roots.eK);
  const X0=G.parameter('X0I2'),I2Right=G.parameter('I2Right'),K=G.mul(P,G.inv(G.add(o,G.pow(eta,2))),G.exp(G.add(G.mul(q(-1,2),G.parameter('T')),q(-7,10),G.mul(q(-1,2),lambda),G.neg(G.mul(G.add(q(1,2),lambda),G.sub(G.mul(q(60),G.parameter('BOuter')),q(20)))))));
  const x=Xvalue=>G.div(Xvalue,X0),linear=leading.linear.slice(2).map(row=>row.slice(2)),quadraticDiagonal=leading.quadraticDiagonal.slice(2).map(row=>row.slice(2)),det=G.determinant(linear);
  const inverse=linear.map((_,i)=>linear.map((__,j)=>G.div(G.mul(q((i+j)%2?-1:1),G.determinant(linear.filter((_,r)=>r!==j).map(row=>row.filter((_,c)=>c!==i)))),det)));
  const norm=[G.mul(X0,G.sqrt(X0),K),G.mul(X0,G.pow(K,2)),G.pow(K,2)],debts=[heatI,heatS,heatCp],rhs=debts.map((v,j)=>G.neg(G.div(v,G.mul(lambda,norm[j])))),proof=actualHeatI2ContractionProof();
  const system=G.defineQuadraticSystem({name:'ActualSameN3C2I2Heat',linear,quadraticDiagonal,rhs,scale:lambda,preconditioner:inverse,rootRadius:q(1,1000000),lipschitzUpper:q(1,4),proof,
    actualOperandSource:'Complete H5-H9 heat integrals over X>=Xtail*exp(1/5), including the infinite tail and eta dependence.',preconditionerIsExactContinuousInverse:true,continuousMatrixReplacedByPreconditioner:false});
  const values=Array.from({length:3},(_,j)=>G.quadraticRoot(system,j,eta)),dot=(a,b)=>G.add(...a.map((v,j)=>G.mul(v,b[j]))),step=xs=>{const qv=quadraticDiagonal.map(row=>G.mul(lambda,dot(row,xs.map(v=>G.pow(v,2)))));return inverse.map(row=>dot(row,rhs.map((v,j)=>G.sub(v,qv[j]))));};
  let iterate=[z,z,z];for(let j=0;j<iterations;j++){context.checkCancelled?.();iterate=step(iterate);}
  const supports=[[q(11),q(23,2)],[q(12),q(25,2)],[q(13),q(27,2)]],bump=(xx,j)=>G.mul(q(2),G.step(G.mul(q(2),G.sub(xx,supports[j][0])),1));
  const correction=G.choose(X,X0,I2Right,z,G.mul(K,lambda,G.add(...values.map((v,j)=>G.mul(v,bump(x(X),j))))),z);

  // Reconstruct every actual A.2 stage from its complete A.21 density.
  // Angular bumps are pressure-neutral, but remain in the actual field.
  const y=G.log(G.div(X,XR)),last=G.outer.stages.at(-1),A=G.core.A,angular=G.outer.stages.find(s=>s.id==='angular');
  let outerE=G.mul(P,G.exp(G.sub(last.logAEnd,G.mul(A,G.sub(y,last.end)))));
  const stageFields=[];
  for(let j=G.outer.stages.length-1;j>=0;j--){
    const stage=G.outer.stages[j],pressureStage=G.pressure.stages[j];
    if(stage.id!==pressureStage.id)fail('INTERNAL_VALIDATION','A.21 and A.2 stage order differs.');
    const local=G.sub(y,stage.start);let value=G.mul(P,G.sqrt(G.substitute(pressureStage.integrand,pressureStage.variable,local)));
    if(stage.id==='angular'){
      const centers=[G.sub(angular.length,q(3)),G.sub(angular.length,o)],coeffs=G.outer.equations.angular.coefficients;
      value=G.mul(value,G.add(o,...coeffs.map((c,k)=>G.mul(c,q(10,3),G.step(G.add(G.mul(q(10,3),G.sub(local,centers[k])),q(1,2)),1)))));
    }
    // The enclosing earlier stage already restricts entry to this stage.
    // Retain its analytic expression at the shared left endpoint as well:
    // a zero or constant `before` branch destroys the value or the jets.
    outerE=G.choose(y,stage.start,stage.end,value,value,outerE);
    stageFields.unshift({id:stage.id,start:stage.start,end:stage.end,value,entryBranch:outerE,sourcePressureDensity:pressureStage.integrand});
  }
  const preC12E=G.choose(X,XR,G.mul(XR,G.exp(o)),leading.loop.E,outerE,outerE),deltaC12=G.choose(X,Ileft,Iright,z,leading.loop.deltaE,z),deltaI1=G.choose(X,I1Left,I1Right,z,leading.roots.actualI1DeltaE,z);
  const rawActualE=G.add(preC12E,deltaC12,deltaI1);
  const rho=G.mul(G.parameter('co'),h),s=G.log(G.div(X,Xtail));
  const fo=G.sub(o,G.mul(rho,G.sub(o,G.step(G.div(G.sub(s,o),q(2))))));
  const Ecl=G.mul(Etail,G.exp(G.neg(G.mul(A,s))),G.div(fo,G.sub(o,rho))),Z=G.div(G.mul(q(2),G.sub(o,G.pow(eta,2))),X);
  const v=G.fresh('actual_heat_Laplace_compact'),oneMinus=G.sub(o,v),laplace=G.div(v,oneMinus),weight=G.exp(G.add(G.neg(laplace),G.mul(h,G.log(laplace)))),lossBody=G.mul(weight,G.sub(o,G.exp(G.neg(G.mul(h,G.log(G.add(o,G.mul(Z,laplace))))))),G.pow(oneMinus,-2));
  const heatLoss=G.div(G.integral(lossBody,v,z,o),gamma),heatCutoff=G.step(G.div(G.sub(s,q(1,5)),q(3,10))),heatChange=G.choose(X,XK,XK,z,G.neg(G.mul(Ecl,heatCutoff,heatLoss)),G.neg(G.mul(Ecl,heatCutoff,heatLoss)));
  const finalE=G.add(rawActualE,correction,heatChange),naturalF=leading.pre.functions.naturalF(G.mul(G.parameter('Lambda'),X)),finalF=G.choose(X,Xa,XK,naturalF,G.div(finalE,G.sqrt(G.mul(q(2),X))),G.div(finalE,G.sqrt(G.mul(q(2),X))));
  const Xb=G.mul(XR,G.exp(last.end)),b=G.neg(G.add(A,q(1,2))),exteriorAmplitude=G.div(G.mul(Etail,G.exp(G.mul(A,G.log(Xtail)))),G.mul(G.sqrt(q(2)),G.sub(o,rho)));
  if(G.derivative(exteriorAmplitude,eta)!==z||G.derivative(Xb,eta)!==z)fail('INVALID_SOURCE_CONSTRUCTION','The actual terminal heat prefactor and endpoint must be eta independent.');
  const exteriorF=G.mul(exteriorAmplitude,G.exp(G.mul(b,G.log(X))),G.sub(o,heatLoss));
  const rootTail=G.mul(q(1,1000000),q(1,4n**BigInt(iterations))),polynomial=xs=>linear.map((row,i)=>G.add(dot(row,xs),G.mul(lambda,dot(quadraticDiagonal[i],xs.map(v=>G.pow(v,2)))))),residual=polynomial(values).map((v,j)=>G.sub(v,rhs[j]));
  const roots={...leading.roots,actualHeatI:heatI,actualHeatS:heatS,actualHeatCp:heatCp,actualHeatGamma:gamma,actualHeatTailStart:Xtail,actualHeatStart:XK,actualHeatReferenceE:Ecl,actualHeatLoss:heatLoss,actualI2K:K,actualI2DeltaE:correction,actualI2RootTail:rootTail,actualHeatDeltaE:heatChange,actualLeadingE0:finalE,actualLeadingF0:finalF,actualHeatExteriorAmplitude:exteriorAmplitude,actualHeatExteriorF:exteriorF,actualHeatExteriorStart:Xb};
  values.forEach((r,j)=>{roots['actualI2Root'+j]=r;roots['actualI2Iterate'+j]=iterate[j];roots['actualI2EquationResidual'+j]=residual[j];});
  const program=G.pack(roots,{construction:'Actual full leading E0: nonlinear core, B26/B34/B8, complete A2 schedule and angular roots, original C12/I1, full heat exterior and the actual I2 E-only compensating root.',
    sourceBindings:structuredClone(ACTUAL_MEAN_STRESS_BINDINGS),fullOuterStages:stageFields,
    heat:{heatI,heatS,heatCp,gamma,Xtail,XK,eK,Etail,loss:heatLoss,change:heatChange,cutoff:heatCutoff,Z,tailTruncated:false,oneSidedEtaEndpoints:true,
      convergence:'H7-H8 supply an integrable derivative majorant. The compactified t=1 endpoint is an improper limit, never an endpoint quadrature sample.',
      exterior:{start:Xb,amplitude:exteriorAmplitude,amplitudeEtaDerivative:z,F:exteriorF,exponent:b,argument:Z,terminalFoOneAfter:Xb,heatCutoffOneBefore:Xb,sourceDefinition:'After the terminal stage fo=1 and the heat cutoff=1. No B8, C12, I1 or I2 bump remains. The actual field is amplitude*X^b*H(2*(1-eta^2)/X).',arbitraryHeatFunctionReplacedByConstant:false},
      actualAllEtaDefinition:true,outerPointDecimalValuesEvaluated:false},
    I2:{system,linear,inverse,quadraticDiagonal,rhs,normalization:norm,values,iterate,iterations,rootTail,residual,proof,patch:[X0,I2Right],supports,K,correction,
      exactMoments:{M:'0',J:'0',I:'-actualHeatI',S:'-actualHeatS',Cp:'-actualHeatCp'},
      meanUpperBoundUsedAsDebt:false,finiteIterateDeclaredRoot:false},
    leading:{E:finalE,F:finalF,U:leading.finalU,M:leading.finalM,V:leading.finalV,pressureAxis:G.core.P0,
      pressureClosure:'H13: I2 and the complete heat edit cancel total Cp exactly. B8 and C12/I1 also preserve all five functions, so the original A.21 datum is unchanged.',
      angularHeatMomentClosure:'The original subtracted A.7 moment plus actual I2 correction is zero as a function of eta; (5.19) supplies the order-one angular-viscosity total moment.',
      noUncompensatedReferenceUsedAsFinalE:true},
    scope:{...leading.program.scope,actualGlobalE0Compiled:true,actualI2ThreeHeatDebtOperandsCompiled:true,actualI2ContinuousRootCompiled:true,actualHeatMomentCancellationCompiled:true,actualFullLeadingSourceFunctionProgramCompiled:true,actualGlobalTranscendentalValuesNumericallyEnclosed:false,originalN404Complete:false,originalN405Complete:false,newLeanKernelProof:false}});
  const result={...leading,G,program,roots,heat:{system,values,iterate,step,linear,quadraticDiagonal,inverse,rhs,norm,proof,heatI,heatS,heatCp,gamma,Xtail,XK,Etail,eK,K,correction,heatChange,heatLoss,heatCutoff,Ecl,finalE,finalF,outerE,stageFields,outerLogCoordinate:y,X0,I2Right,Xb,exteriorAmplitude,exteriorF,exteriorExponent:b,heatArgument:Z}};
  actualHeatPrograms.set(result,{G,leading,count:G.nodes.length,prefix:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),fields:JSON.stringify(result.heat)});return result;
}

export function prepareActualFullLeadingProgram(input={},context={}){
  for(const key of Object.keys(input))if(!['sourceProfile','iterations'].includes(key))fail('INVALID_INPUT','Unknown complete leading source input '+key);
  return attachActualHeatLeading(prepareActualGlobalLeadingProgram({sourceProfile:input.sourceProfile,etaDerivativeOrder:0,rootIterations:1},context),{iterations:input.iterations??2},context);
}
export function compileActualFullLeadingProgram(input={},context={}){return prepareActualFullLeadingProgram(input,context).program;}
