/** Independent operand replay of the unchanged higher-order moment constructor. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,priorPath,output]=process.argv.slice(2);
assert.ok(output);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pins={
  'actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'actual-continuation-exact-order-one.mjs':'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
  'actual-continuation-exact-order-two-source.mjs':'1ebf8b2b6f1df054a06309c5dc8695f2f3a867733544ab012f206bfed2969dd0',
  'actual-continuation-exact-identities.mjs':'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712',
  'actual-global-primitive-kernels.mjs':'efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59',
};
for(const [file,pin] of Object.entries(pins)) assert.equal(sha(await readFile(resolve(runtime,file))),pin);
const priorBytes=await readFile(priorPath);
const priorSHA256=sha(priorBytes);
assert.equal(priorSHA256,'3d4be5e7b50d1f1310ee2588f59cf055be87ddfaff60f75ca4cbf98c9371d4cb');
const prior=JSON.parse(priorBytes);
const mod=file=>import(pathToFileURL(resolve(runtime,file)).href);
const {prepareActualOrderInduction,assertActualOrderInduction}=await mod('actual-residual-order-induction-source.mjs');
const {sourceGraphRationalIdentity}=await mod('actual-continuation-exact-identities.mjs');
const {explicitPrimitiveBodyIdentity}=await mod('actual-global-primitive-kernels.mjs');
const prepared=prepareActualOrderInduction({order:5});
assert.equal(assertActualOrderInduction(prepared),true);
const {G,bootstrap,records}=prepared;
assert.equal(sha(JSON.stringify(G.nodes.slice(0,117100))),prior.originalPrefix.sha256);
const {X,eta,Xv}=bootstrap.constants,{Xkeep,Xcut,X0,IposRight,Xplus,Rbase,ef,Umat,Emat,Uinverse,Einverse,supports}=bootstrap.orderOne;
const {aSquared}=bootstrap.inner,{D,d,L}=G.core;
const z=G.zero,o=G.one,q=(a,b=1)=>G.q(a,b),h=G.parameter('h'),lambda=G.parameter('lambda');
const node=id=>G.nodes[id];
const power=(x,a)=>G.exp(G.mul(a,G.log(x)));
const sum=ids=>G.add(...ids);
const dot=(a,b)=>sum(a.map((value,i)=>G.mul(value,b[i])));
const diff=(a,x=X)=>G.derivative(a,x);
const equal=(a,b,label)=>assert.ok(explicitPrimitiveBodyIdentity(G,a,b).pass,label);
const rational=(a,b,atoms)=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes:atoms}).pass;
assert.deepEqual({Xkeep,Xcut,X0,IposRight,Xv,Xplus},prior.endpoints);
assert.ok([Xkeep,Xcut,X0,IposRight,Xv,Xplus,aSquared].every(id=>diff(id,eta)===z));
assert.ok(bootstrap.stress.supportOrder.pass);
assert.equal(Rbase,G.sqrt(G.mul(q(2),X0)));
const R=G.sqrt(G.mul(q(2),X)),rho=G.div(R,Rbase);
const p=G.sub(q(-2),G.mul(q(2),lambda));
const powAngular=G.sub(o,G.mul(q(2),lambda)),powAxial=G.mul(q(-2),lambda);
assert.ok(rational(G.add(p,q(3)),powAngular,[lambda]));
assert.ok(rational(G.add(p,q(2)),powAxial,[lambda]));
const R1=power(Rbase,powAngular),Rp=power(Rbase,p),Rz=power(Rbase,powAxial);
const bump=(value,j)=>{
  const width=q(1,2048);
  return G.div(G.step(G.div(G.sub(value,supports[j][0]),width),1),width);
};
const fieldBody=(id,args)=>{
  const row=node(id);
  assert.equal(row.op,'actual_expression_partial');
  assert.deepEqual(row.args[1],args);
  assert.ok(row.args[2].every(x=>x===0));
  assert.deepEqual(G.expressionSystems[row.args[0]].parameters,args);
  return G.expressionSystems[row.args[0]].body;
};
const flatten=id=>node(id).op==='add'?node(id).args.flatMap(flatten):[id];
const branch=(id,a,b)=>{
  const row=node(id);
  assert.equal(row.op,'smooth_piecewise');
  assert.deepEqual(row.args.slice(0,3),[X,a,b]);
  return row.args.slice(3);
};
const literal=(id,a,b,expected,expectedCoordinate=X)=>{
  const row=node(id);
  assert.equal(row.op,'definite_integral');
  const [body,binder,l,r]=row.args;
  assert.deepEqual([l,r],[a,b]);
  assert.equal(node(binder).op,'coordinate');
  assert.notEqual(binder,X);
  assert.notEqual(binder,eta);
  assert.equal(G.dependsOn(body,X),false);
  equal(G.substitute(body,binder,expectedCoordinate),expected,'literal integrand at formal radius');
  return {id,binder,body,left:l,right:r,expected};
};
const productOther=(id,known)=>{
  assert.equal(node(id).op,'multiply');
  assert.ok(node(id).args.includes(known));
  return node(id).args.find(x=>x!==known);
};
function bumpPrefixes(root,scale,coefficients,index,weight,completed){
  const ids=flatten(productOther(root,scale));
  assert.equal(ids.length,coefficients.length);
  return coefficients.map((value,i)=>{
    const term=ids.find(id=>node(id).op==='multiply'&&node(id).args.includes(value));
    assert.notEqual(term,undefined);
    const piece=productOther(term,value),entry=node(piece),j=i+index;
    assert.equal(entry.op,'smooth_piecewise');
    const [actualRho,left,right,before,prefix,after]=entry.args;
    assert.deepEqual([actualRho,left,right,before,after],[rho,...supports[j],z,completed[i]]);
    return literal(prefix,left,rho,G.mul(weight(X),bump(X,j)));
  });
}
const exponent=k=>G.mul(q(2*k),h);
const time=(a,f)=>G.div(G.add(G.neg(G.mul(a,f)),G.mul(D,eta,diff(f,eta)),G.mul(X,diff(f))),L);
const zder=(a,f)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(a,f),G.mul(X,diff(f)))),G.mul(d,diff(f,eta))),L);
function omega(fields,k){
  const v=fields.map(field=>field.v),u=fields.map(field=>field.U);
  const terms=[time(G.sub(exponent(k),o),v[k]),G.mul(q(-2),G.add(G.mul(q(2),diff(v[k])),G.mul(X,diff(diff(v[k])))))];
  for(let i=0;i<=k;i++){
    const j=k-i;
    terms.push(G.mul(v[i],G.add(G.mul(q(1,2),v[j]),G.mul(X,diff(v[j])))),G.mul(u[i],zder(G.sub(exponent(j),o),v[j])));
  }
  const hz=G.sub(exponent(k-1),o);
  terms.push(G.neg(zder(G.sub(hz,D),zder(hz,v[k-1]))));
  return sum(terms);
}

const rows=[];
for(const row of records.slice(2)){
  const n=row.order,g=row.global,lower=records.slice(0,n);
  const F0=lower[0].actual.F,U0=lower[0].actual.U,Ft=row.actual.F,Ut=row.actual.U;
  const [fBefore,,fAfter]=branch(Ft,Xkeep,Xcut),[uBefore,,uAfter]=branch(Ut,Xkeep,Xcut);
  assert.deepEqual([fBefore,fAfter,uBefore,uAfter],[row.raw.F,z,row.raw.U,z]);
  const localDensities=[Ut,G.mul(q(2),X,Ft),G.mul(q(2),F0,Ft),G.mul(q(2),X,G.add(G.mul(U0,Ft),G.mul(Ut,F0))),
    G.sub(G.mul(q(2),U0,Ut),G.mul(q(2),X,F0,Ft))];
  const local=localDensities.map((body,i)=>{
    equal(g.localBodies[i],body,'local moment body');
    return literal(g.localMoments[i],z,Xcut,body);
  });
  const [omegaLocal,omegaWhole,omegaAfter]=branch(g.omega,aSquared,Xplus);
  assert.equal(omegaAfter,z);
  assert.equal(omegaLocal,row.raw.omegaOverX);
  equal(omegaLocal,omega(lower.map(r=>r.actual),n-1),'reconstructed cutoff-local Omega');
  equal(omegaWhole,omega(lower.map(r=>r.global),n-1),'reconstructed global Omega');
  const pairs=Array.from({length:n-1},(_,i)=>[i+1,n-i-1]);
  const F=lower.map(r=>r.global.F),U=lower.map(r=>r.global.U);
  const ff=pairs.map(([i,j])=>G.mul(F[i],F[j]));
  const uf=pairs.map(([i,j])=>G.mul(q(2),X,U[i],F[j]));
  const zflux=pairs.map(([i,j],k)=>G.sub(G.mul(U[i],U[j]),G.mul(X,ff[k])));
  [ff,uf,zflux].forEach((terms,i)=>equal(g.lowerBodies[i],sum(terms),'ordered global lower products'));
  const lowerDensities=[G.sub(sum(ff),G.mul(q(1,2),g.omega)),sum(uf),G.add(sum(zflux),G.mul(q(1,2),X,g.omega))];
  equal(lowerDensities[0],g.lowerPressure,'pressure convolution body');
  const history=[];
  const d=g.incoming.map((id,i)=>{
    const body=fieldBody(id,[eta]);
    assert.equal(G.dependsOn(body,X),false);
    if(i<2){assert.equal(body,local[i].id);return body;}
    const operands=node(body).args;
    assert.equal(node(body).op,'add');
    assert.ok(operands.includes(local[i].id));
    history.push(literal(operands.find(x=>x!==local[i].id),z,Xplus,lowerDensities[i-2]));
    return body;
  });
  const duSource=fieldBody(g.U,[X,eta]),dfSource=fieldBody(g.F,[X,eta]);
  assert.equal(duSource,G.add(Ut,g.dU));
  assert.equal(dfSource,G.add(Ft,g.dF));
  assert.deepEqual(branch(g.dU,X0,IposRight),[z,G.div(dot(g.alpha,supports.slice(0,2).map((_,j)=>bump(rho,j))),Rbase),z]);
  assert.deepEqual(branch(g.dF,X0,IposRight),[z,G.div(dot(g.beta,supports.slice(2).map((_,j)=>bump(rho,j+2))),G.mul(Rbase,R)),z]);
  const m=g.incoming,mass=G.div(m[0],Rbase),angularFlux=G.div(m[3],G.mul(ef,R1));
  const uRhs=[G.neg(mass),G.div(G.sub(angularFlux,mass),G.mul(q(2),lambda))];
  const eRhs=[G.neg(G.div(m[1],G.pow(Rbase,2))),G.neg(G.div(m[2],G.mul(q(2),ef,Rp))),G.div(m[4],G.mul(ef,Rz))];
  for(const [got,want] of [[g.Urhs,uRhs],[g.Erhs,eRhs],[g.alpha,Uinverse.map(v=>dot(v,uRhs))],[g.beta,Einverse.map(v=>dot(v,eRhs))]])
    got.forEach((value,i)=>equal(value,want[i],'same source inverse/RHS'));
  const angularRow=Umat[0].map((v,j)=>G.sub(v,G.mul(q(2),lambda,Umat[1][j])));
  const correctionMoments=[
    G.mul(Rbase,dot(Umat[0],g.alpha)),
    G.mul(G.pow(Rbase,2),dot(Emat[0],g.beta)),
    G.mul(q(2),ef,Rp,dot(Emat[1],g.beta)),
    G.mul(ef,R1,dot(angularRow,g.alpha)),
    G.neg(G.mul(ef,Rz,dot(Emat[2],g.beta)))
  ];
  correctionMoments.forEach((want,i)=>{
    equal(g.correctionMoments[i],want,'same five physical correction moments');
    assert.ok(rational(G.add(m[i],want),z,m),'exact original repaired moment zero');
  });
  const lastU=G.mul(X0,G.pow(supports[1][1],2)),massBody=fieldBody(g.M,[X,eta]);
  const [massBefore,massMid,massAfter]=branch(massBody,Xkeep,lastU);
  equal(massBefore,G.mul(X,row.raw.average),'axis regular mass');
  assert.equal(massAfter,z);
  const [avgBefore,avgMid,avgAfter]=branch(fieldBody(g.average,[X,eta]),Xkeep,lastU);
  assert.deepEqual([avgBefore,avgMid,avgAfter],[row.raw.average,G.div(g.M,X),z]);
  const massPieces=node(massMid).args;
  assert.equal(node(massMid).op,'add');
  const massSource=massPieces.find(id=>node(id).op==='smooth_piecewise');
  const [massPrefix,massPrefixMid,massPlateau]=branch(massSource,Xkeep,Xcut);
  assert.deepEqual([massPrefixMid,massPlateau],[massPrefix,local[0].id]);
  const localMassPrefix=literal(massPrefix,z,X,Ut);
  const bumpMassPrefixes=bumpPrefixes(massPieces.find(id=>id!==massSource),Rbase,g.alpha,0,x=>x,Umat[0]);
  const [piBefore,piMid,piAfter]=branch(fieldBody(g.Pi,[X,eta]),Xkeep,Xplus);
  assert.deepEqual([piBefore,piAfter],[row.raw.Pi,z]);
  const piPieces=flatten(piMid);
  const pressureSource=piPieces.find(id=>node(id).op==='smooth_piecewise');
  const [piPrefix,piPrefixMid,piPlateau]=branch(pressureSource,Xkeep,Xcut);
  assert.deepEqual([piPrefixMid,piPlateau],[piPrefix,local[2].id]);
  const localPressurePrefix=literal(piPrefix,z,X,localDensities[2]);
  const piGlobalId=piPieces.find(id=>node(id).op==='definite_integral');
  const pressureGlobalPrefix=literal(piGlobalId,z,X,lowerDensities[0]);
  const pressurePatch=piPieces.find(id=>id!==pressureSource&&id!==piGlobalId);
  const bumpPressurePrefixes=bumpPrefixes(pressurePatch,G.mul(q(2),ef,Rp),g.beta,2,x=>power(x,p),Emat[1]);
  const fsplit=G.add(G.choose(X,Xkeep,Xcut,G.mul(F0,row.raw.F),G.mul(F0,Ft),z),
    G.choose(X,X0,IposRight,z,G.mul(ef,power(R,p),g.dF),z));
  equal(g.F0Fn,fsplit,'same leading-current pressure product on both supports');
  equal(g.pressureDerivative,G.add(G.mul(q(2),fsplit),lowerDensities[0]),'retained full pressure derivative');
  const row3wrong=G.add(sum(ff),G.mul(q(1,2),g.omega));
  const row5wrong=G.add(sum(zflux),G.mul(q(1,2),g.omega));
  assert.equal(rational(row3wrong,lowerDensities[0],[g.omega,...F]),false);
  assert.equal(rational(row5wrong,lowerDensities[2],[g.omega,...U,...F]),false);
  assert.equal(rational(m[4],z,m),false);
  rows.push({n,pairs,omega:{index:n-1,nestedViscosityIndex:n-2,source:g.omega,omegaLocal,omegaWhole},
    local,history,incoming:m,incomingBodies:d,correctionMoments:g.correctionMoments,
    prefixes:{localMassPrefix,localPressurePrefix,pressureGlobalPrefix,bumpMassPrefixes,bumpPressurePrefixes},
    omittedCorrectionRejected:true,wrongPressureOmegaSignRejected:true,missingAxialXWeightRejected:true});
}
const result={status:'VERIFIED_ORIGINAL_HIGHER_MOMENT_OPERANDS_WITH_CONDITIONAL_ORDINARY_DENOTATION',
  pins,priorSHA256,prefixSHA256:prior.originalPrefix.sha256,rows,release:'HOLD'};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,orders:rows.map(row=>row.n),localRows:20,wholeLowerRows:12,repairRows:20}));
