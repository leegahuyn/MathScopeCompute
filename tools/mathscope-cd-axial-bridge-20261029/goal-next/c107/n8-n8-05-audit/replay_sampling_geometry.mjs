import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,output]=process.argv.slice(2);
assert(output,'Usage: ORIGINAL_NAVIER NEW_JSON');
const pins={
  'actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
  'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-covariance-source-operator.mjs':'8de6b94b5819ec7b7cdbf8312de32e0c7f8556d9e2d78fa250542f1d6ee3b759',
  'actual-covariance-source-certificate.mjs':'c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681',
  'actual-covariance-operator-bounds.mjs':'b5e96a01ba3a64c2d8b07c4562cccc3bf5c062180a1b0fb8cae9bd799e896d88',
  'actual-common-band-physical-curl.mjs':'60001a58480274c646856bba803b62fd234db0f9bca33b9d81421963d19b5b70',
  'actual-covariance-global-assembly.mjs':'bd0f09f78a2f93cad9fdb679ba25509ecb2891ba86eee1bc3e57df6da74e37cc',
  'source-radial-phase-exponent.mjs':'09ffa7aca344391d39de50f38a9a4c67f175d6d500e4514ac6a86e591768ab7c',
  'actual-residual-order-induction-background.mjs':'e04a02a8878168d673fd7deed45de6bbfb2591ec58f3abc9eb8f08e1d2770879',
  'actual-continuation-exact-identities.mjs':'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712',
};
const sha=b=>createHash('sha256').update(b).digest('hex');
const text={};
for(const [file,pin] of Object.entries(pins)){
  const bytes=await readFile(resolve(runtime,file));
  assert.equal(sha(bytes),pin,file);
  text[file]=bytes.toString();
}
const a=text['actual-covariance-source-operator.mjs'];
for(const fragment of [
  "k=G.ceiling(G.inv(G.sqrt(epsilon)))",
  "r0=q(1,1n<<34n)",
  "paletteQuotient=G.div(G.sub(G.mul(G.add(G.one,h),ell,logTwo),G.mul(q(2),G.log(ell))),G.log(Tg))",
  "ci=G.mul(powReal(Tg,paletteIndex),powReal(band.Q,G.add(G.one,h))),Ls=G.div(G.mul(q(2),r0),ci)",
  "G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls)))",
  "b=sigma(3/2-2|t|) on 1/4<|t|<3/4",
  "phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,H))",
]) assert.ok(a.includes(fragment),fragment);
assert.ok(text['actual-common-band-physical-curl.mjs'].includes('D_t=-epsilon partial_T+partial_v'));
assert.ok(text['actual-residual-order-induction-background.mjs'].includes('chi(s)=1-sigma1(2s-1)'));
const assembly=text['actual-covariance-global-assembly.mjs'];
for(const fragment of ["bandCoordinate:'t=-log(q)/log(2)'", "meshCoordinate:'ell^6*(C_ell(r,z,t)-fixed_origin)'", "sigma(3/2-2|t|)"])
  assert.ok(assembly.includes(fragment),fragment);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const {ActualConvergentExpressions}=await load('actual-continuation-exact-functions.mjs');
const {attachSourcePalette}=await load('actual-covariance-source-certificate.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const {actualOperatorPowerAudit}=await load('actual-covariance-operator-bounds.mjs');
const {originalSourceRadialPhase,assertOriginalSourceTorusMap}=await load('source-radial-phase-exponent.mjs');
const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),o=G.one,z=G.zero,h=G.parameter('h'),
  [R,Z,T,ell]=['R','Z','T','ell'].map(n=>G.fresh('C107_'+n)),
  sqrt2=G.sqrt(q(2)),Tg=G.add(q(4),sqrt2),r0=q(1,1n<<34n),
  expPower=(a,b)=>G.exp(G.mul(b,G.log(a))),Q=G.exp(G.neg(G.mul(ell,G.log(q(2))))),
  D=G.sub(q(1,2),h),epsilon=expPower(Q,h),S=G.pow(ell,2),
  paletteLog=G.div(G.sub(G.mul(G.add(o,h),ell,G.log(q(2))),G.mul(q(2),G.log(ell))),G.log(Tg)),
  i=G.neg(G.ceiling(G.neg(paletteLog))),
  ci=G.mul(expPower(Tg,i),expPower(Q,G.add(o,h))),Ls=G.div(G.mul(q(2),r0),ci),
  Dgeom=G.sub(q(4),G.mul(q(2),sqrt2)),basis=[[o,G.sub(o,sqrt2)],[G.sub(sqrt2,o),o]];
const actual=attachSourcePalette({G,geometry:{r0,Ls,Q,ell,Tg,paletteIndex:i,ci,Dgeom,rectangleBasis:basis},
  constants:{h,D},coordinates:{R,Z,T},families:[{sign:1},{sign:-1}]});
assert.ok(actual.palette.pass&&actual.torus.pass);
const {Lambda,dr,kappa}=originalSourceRadialPhase(G,{h,Tg});
const radialAudit=assertOriginalSourceTorusMap(G,{h,Tg,physicalMap:actual.physicalMap});
assert.ok(radialAudit.comparison.allSixExpectedBodiesMatched);
assert.equal(actual.physicalMap.r,G.mul(G.sqrt(Q),R));
assert.equal(actual.physicalMap.z,G.mul(expPower(Q,D),Z));
assert.equal(actual.physicalMap.tau,G.mul(Q,T));
const radial=G.mul(expPower(Lambda,i),expPower(actual.physicalMap.r,dr)),
  temporal=G.mul(expPower(Tg,i),G.sub(o,G.mul(Q,T)));
const expectedYi=basis[0].map((c,j)=>G.add(G.mul(c,radial),G.mul(basis[1][j],temporal)));
assert.deepEqual(actual.physicalMap.Yi,expectedYi);
const eq=(left,right,atoms=[])=>{
  const p=sourceGraphRationalIdentity(G,G.sub(left,right),{atomicNodes:atoms,maxTerms:10000});
  return p;
};
const two=G.add(o,o),expectedXiR=G.derivative(radial,R),expectedWTime=G.neg(G.div(G.mul(expPower(Tg,i),Q),G.mul(two,r0)));
const norm2=G.add(...basis[0].map(c=>G.mul(c,c))),
  projection=G.div(norm2,Dgeom);
assert.ok(eq(norm2,G.add(...basis[1].map(c=>G.mul(c,c))),[sqrt2]).pass);
// In Q(sqrt(2)), |(1,1-sqrt(2))|^2 = 1 + (3-2sqrt(2)).
const q2Add=([a,b],[c,d])=>[a+c,b+d];
const q2Mul=([a,b],[c,d])=>[a*c+2n*b*d,a*d+b*c];
const q2Dot=(a,b)=>a.map((x,j)=>q2Mul(x,b[j])).reduce(q2Add,[0n,0n]);
const basisQ2=[[[1n,0n],[1n,-1n]],[[-1n,1n],[1n,0n]]];
assert.deepEqual(q2Dot(basisQ2[0],basisQ2[0]),[4n,-2n]);
assert.deepEqual(q2Dot(basisQ2[1],basisQ2[1]),[4n,-2n]);
assert.deepEqual(q2Dot(basisQ2[0],basisQ2[1]),[0n,0n]);
const shape=[];
for(const row of actual.rectangleRows){
  const frozen=row.copy.map((_,j)=>G.fresh('C107_fixed_copy_'+row.sign+'_'+j)),
    map=f=>G.simultaneousSubstitute(G.simultaneousSubstitute(f,row.copy,frozen),actual.Yi,actual.physicalMap.Yi),
    mxi=map(row.xi),w=G.div(map(row.v),Ls);
  const atoms=[h,Q,epsilon,ci,i,ell,R,Z,T,radial,expectedXiR,sqrt2,expPower(Tg,i)];
  const checks=[
    eq(G.derivative(mxi,R),G.mul(projection,expectedXiR),atoms),
    eq(G.derivative(mxi,Z),z,atoms),
    eq(G.derivative(mxi,T),z,atoms),
    eq(G.derivative(w,R),z,atoms),
    eq(G.derivative(w,Z),z,atoms),
    eq(G.derivative(w,T),G.mul(projection,expectedWTime),atoms),
  ];
  assert.ok(checks.every(c=>c.pass),JSON.stringify(checks));
  assert.ok(eq(G.derivative(map(row.v),T),G.neg(G.div(G.mul(projection,expPower(Tg,i),Q),ci)),atoms).pass);
  assert.ok(!eq(G.derivative(w,T),G.neg(G.mul(projection,expectedWTime)),atoms).pass);
  shape.push({sign:row.sign,zeroNumeratorMonomials:checks.map(x=>x.numeratorMonomials),wrongTimeSignRejected:true});
}
const op=actualOperatorPowerAudit();
assert.ok(op.pass&&op.unconditional.some(row=>row.id==='phase-gradient'&&row.upperPower===8));
assert.ok(op.unconditional.some(row=>row.id==='unrounded-and-rounded-carrier'&&row.upperPower===5));
const result={
  schema:'MathScope.C107.OriginalAnnularSamplingGeometryOperands/1',pins,
  exactSourceGeometryArithmeticOnly:true,dimensions:['R','Z','T','theta'],
  exactFixedCopyJacobianRows:shape,ellCoverageArithmeticProgram:{i,ci,Ls,epsilon,S,kappa,sourceR0:'2^-34'},
  exactBasisGramOverQSqrt2:[[[4,-2],[0,0]],[[0,0],[4,-2]]],
  sourcePhaseTimeChain:'partial_T(v)=-Q Tg^i/ci=-1/epsilon on a fixed copy and label',
  sourcePhysicalJacobian:['d_r xi=dr*Lambda^i*r^(dr-1)','d_z xi=d_tau xi=0',
    'd_r(v/Ls)=d_z(v/Ls)=0','d_tau(v/Ls)=-Tg^i/(2 r0)'],
  sourceLongitudinalTransitionWidth:'r0/(10 Tg^i)',
  sourceCartesianProjectionScales:['r=sqrt(Q)*R','z=Q^D*Z','tau=Q*T'],
  originalNormalAndCarrierCaps:{normal:'Bnorm^8*(1+Ls)',carrier:'Bnorm^5'},
  sourcePaletteCertificate:{colors:actual.palette.paletteSize,period:actual.palette.bandPeriod,deltaMax:actual.palette.deltaMax},
  boundProfile:{status:'ORIGINAL_FORMULAS_BOUND_AT_FIXED_SYMBOLIC_LABEL',evaluatedWholeField:false,evaluatedTau:null}
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({geometryRows:shape,colors:actual.palette.paletteSize,cutoffWidth:result.sourceLongitudinalTransitionWidth}));
