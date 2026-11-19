/** Source-positive cutoff/map bounds at original orders8 and9. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [goalPath,sourceRuntime,numericRuntime,outDir]=process.argv.slice(2);
assert(goalPath&&sourceRuntime&&numericRuntime&&outDir);
const goal=resolve(goalPath),sha=b=>createHash('sha256').update(b).digest('hex');
const sourcePins={
 'research-ide/mathscope-m3/navier/source-global-class.mjs':'f07341f299b2b9cd24844c4d738b5c6605816bdaf4eeca317b80618b27ed7095',
 'research-ide/mathscope-m2/navier/actual-residual-order-induction-kernels.mjs':'97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef',
 'research-ide/mathscope-m2/navier/actual-gaussian-flat-tail-kernel.mjs':'aa100d47e54442be8c24f167a160816d31c883ddfdc4f0a3274b496c9b3c7a53',
 'research-ide/mathscope-m2/navier/source-radial-phase-exponent.mjs':'09ffa7aca344391d39de50f38a9a4c67f175d6d500e4514ac6a86e591768ab7c'};
for(const [file,pin]of Object.entries(sourcePins))assert.equal(sha(await readFile(resolve(sourceRuntime,file))),pin,file);
const {sourceAllOrderCutoffJets}=await import(pathToFileURL(resolve(sourceRuntime,'research-ide/mathscope-m2/navier/actual-residual-order-induction-kernels.mjs')).href);
const source=sourceAllOrderCutoffJets({order:11});assert(source.pass);
const allStepBounds=source.timeStep.ordinaryDerivativeBounds.map(BigInt);assert(allStepBounds.length>=12);
const S=allStepBounds.slice(0,12);
const factorial=n=>{let f=1n;for(let k=1;k<=n;k++)f*=BigInt(k);return f;};
const choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const conv=(a,b,n)=>Array.from({length:n+1},(_,j)=>choose(n,j)*a[j]*b[n-j]).reduce((s,v)=>s+v,0n);
const b=S.map((v,j)=>v<<BigInt(j)),D=Array.from({length:11},(_,j)=>3n*conv(b,b,j));
const bell=Array.from({length:11},()=>Array(11).fill(0n));bell[0][0]=1n;
for(let n=1;n<=10;n++)for(let k=1;k<=n;k++)for(let j=1;j<=n-k+1;j++)bell[n][k]+=choose(n-1,j-1)*D[j]*bell[n-j][k-1];
const inverseRoot=bell.map((row,n)=>row.slice(0,n+1).reduce((s,B,k)=>s+2n*4n**BigInt(k)*factorial(k)*B,0n));
const quotient=inverseRoot.map((_,j)=>conv(b,inverseRoot,j));
const partitionFTC=Array.from({length:10},(_,j)=>3n*(1n+(quotient[j]>quotient[j+1]?quotient[j]:quotient[j+1])));
const max=a=>a.reduce((a,b)=>a>b?a:b);
const step=[1n,...Array.from({length:10},(_,j)=>1n+S[j+2]**2n)];
const arithmetic=resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
assert.equal(sha(await readFile(arithmetic)),'4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47');
async function pinned(path,hash){const b=await readFile(resolve(goal,path));assert.equal(sha(b),hash);return JSON.parse(b);}
const thresholds=await pinned('whole-k-selector-scales/historical-scale-arithmetic-result.json','af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const fixed=await pinned('whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json','9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c');
const lowerTarget=await pinned('primary-forced-join/active-n3-c5-binding/norm-leading/weighted-target/n3-weighted-target-directed.json','6d35cadb59f7b24b18948608d958a0d4e9e244da48546a7acd5308694c06a759');
const {sourceArithmetic}=await import(pathToFileURL(arithmetic).href);
const {N}=await sourceArithmetic(numericRuntime,thresholds.sourcePins,'coarse-upper');
assert.equal(N.compareEndpoints(fixed.hostedOriginal[9].upper,{rational:'1/64'}),-1);
assert.deepEqual(fixed.hostedOriginal[300171],{lower:{rational:'1/17179869184'},upper:{rational:'1/17179869184'}});
const R=N.fromClosed(fixed.hostedOriginal[216823]);assert.equal(N.compareEndpoints(N.toClosed(R).lower,{rational:'1'}),1);
const n6=lowerTarget.rows.find(r=>r.order===6);assert(n6);
const simpleCommon=N.toClosed(N.mul(N.point(String(1n<<4096n)),N.pow(R,26)));
assert.equal(N.compareEndpoints(simpleCommon.upper,n6.enclosure.upper),-1);
const rows=[];
for(const n of [8,9]){
 const P=max(partitionFTC.slice(0,n+1));
 const logPoint=4n*factorial(n)*256n**BigInt(n)*4096n**2n;
 const logFTCCoefficient=24n*(1n+logPoint);
 const slowInteger=4n**BigInt(n)*factorial(n)*P**BigInt(n+4)*logFTCCoefficient**BigInt(n+4);
 const stepMax=max(step.slice(0,n+2));
 const transverse=Array.from({length:n+1},(_,j)=>(1n<<BigInt(35*j))*step[j]);
 const time=Array.from({length:n+2},(_,j)=>20n**BigInt(j)*conv(step,step,j));
 const radius=Array.from({length:n+1},(_,j)=>({order:j,inverse:factorial(j)*7n**BigInt(j+1),fast:BigInt(j+5)**BigInt(j+1)*7n**BigInt(j+5)}));
 const finite=[2n,stepMax,slowInteger,...transverse,...time,...radius.flatMap(r=>[r.inverse,r.fast]),factorial(n)*2n**BigInt(n+4)];
 const C=max(finite),power=2*n+8;
 const enclosure=N.toClosed(N.mul(N.point(String(C)),N.pow(R,power)));
 assert.equal(N.compareEndpoints(enclosure.upper,n6.enclosure.upper),-1);
 rows.push({sourceCoefficientOrder:n,primaryOutputOrder:n-2,sourceStepDerivativeRequired:n+2,partitionDerivativeRequired:n+1,
  partitionFTC:partitionFTC.slice(0,n+1).map(String),stepSquareIntegralUpper:Array.from({length:n+1},(_,j)=>({derivativeOrder:j+2,upper:String(S[j+2]**2n)})),
  logChartDerivativeBoundInteger:String(logPoint),logChartFTCUpper:'24*(1+Q_n)*Rstar^2',
  slowCutoffInteger:String(slowInteger),stepBounds:step.slice(0,n+2).map(String),timeCoefficients:time.map(String),transverse:transverse.map(String),
  radius:radius.map(r=>({order:r.order,inverseInteger:String(r.inverse),inverseRPower:r.order+1,fastInteger:String(r.fast),fastRPower:r.order+5})),
  commonInteger:String(C),commonIntegerBits:C.toString(2).length,RstarPower:power,enclosure,
  belowExistingN6DirectedUpper:true});
}
const result={schema:'MathScope.ExternalOriginalPrimaryCutoffMapOrders8And9/1',
 status:'DIRECTED_SOURCE_POSITIVE_CUTOFF_MAP_8_9_CONDITIONAL_CHART_ADMISSION',
 sourcePins,parameterExpressionSHA256:source.parameterExpressionSHA256,
 originalStepOrdinaryBounds:S.map(String),partitionQuotientOrdinaryBounds:quotient.map(String),rows,
 sourceGeometry:{s:['1/2','2'],X:['Xa/2','2Xb'],eta:['-1','1'],h:'0<h<1/64',r0:'2^-34',
  assumptions:['4Xb<=Rstar^2','Xa^-1/2<=Rstar','Rstar>=1','Xa<=1','same original chart, cutoff and radial-phase source']},
 chartArgument:'Independent holomorphic contraction for x=s/s0 in |x-1|<=1/4 using s=T+Z^2*s^(2h), physical perturbation radius1/64 and normalized perturbations<=1/32. Profile radius1/4096 plus physical derivative Cauchy radius1/256 fits inside that contraction domain. Exact rational admission checks are in the companion audit.',
 uniformChartPointwiseBound:'Every required D_Z^a D_T^b log(s) with a+b<=n and either profile s/eta face derivative is bounded by Q_n=4*n!*256^n*4096^2; all X/R derivatives vanish.',
 seams:['Partition denominator>=1/4 on the numerator support; its outside guard and all endpoint jets match zero.','Original step and time cutoff are flat at their real endpoints, so the finite derivative bounds pass to their zero extensions.','The radial annulus has positive Xa; 1/R and original R^dr are smooth throughout the enclosing positive radial interval.','Pure log-chart Cauchy continuation at eta=+-1 does not continue the heat or fluid fields to negative real time.','The input same-family/path chart admission is still required; outside this declared s/X/eta box the packet claims no bound.'],
 simpleCommonUpper:{formula:'2^4096*Rstar^26',enclosure:simpleCommon,belowExistingN6DirectedUpper:true},
 targetComparison:{existingN6Root:n6.root,existingN6Upper:n6.enclosure.upper,newCutoffBothBelow:true},
 scope:{originalPositiveMaximumRecipeBound:true,nativeOrder8Or9GraphMaterialized:false,actualClassSealCreated:false,newBackgroundBounds:false,fullForcedOrSignedClass:false,finalJets:'0/67',release:'HOLD'},
 arithmetic:N.report()};
await writeFile(resolve(outDir,'primary-cutoff-orders.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,rows:rows.map(r=>({n:r.sourceCoefficientOrder,integerBits:r.commonIntegerBits,RstarPower:r.RstarPower,enclosure:r.enclosure,belowN6:r.belowExistingN6DirectedUpper}))}));
