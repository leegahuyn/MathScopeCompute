import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,fixedPath,localPath,output]=process.argv.slice(2);
assert.ok(output,'Provide original runtime, fixed N4, paired-local N3 and a fresh output');
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=async(path,pin)=>{const data=await readFile(path);assert.equal(sha(data),pin,path);return JSON.parse(data);};
const prior={fixed:'c98c467546aae25fd48af3a0374e16669cc2ebdf44063296a6032e85cc94eb04',
  local3:'e14ddddddec16b677a0f2ed7169f09bc3ffd9c2dbdee855c77167bc95db061bb'};
const fixed=await read(fixedPath,prior.fixed),prev=await read(localPath,prior.local3);
assert.deepEqual(prev.actualSystems,[3,5]);assert.equal(fixed.nativeSystem,7);
for(const [name,hash] of Object.entries(fixed.pins))assert.equal(sha(await readFile(resolve(runtime,name))),hash,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const src=await load('actual-residual-order-induction-source.mjs');
const {sourceScaledOperators,buildActualOmegaCoefficientOverX}=await load('actual-continuation-exact-order-two-source.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const live=src.prepareActualOrderInduction({order:4,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,records,bootstrap:b}=live,[n0,n1,n2,n3,n4]=records,{X,eta}=b.constants;
assert.equal(sha(JSON.stringify(G.nodes)),fixed.originalPrefixSHA256);
const q=(u,v=1)=>G.q(u,v),o=G.one,z=G.zero,{A,D}=G.core,h=G.parameter('h'),nu=i=>G.mul(q(2*i),h);
const c=G.neg(A),a=G.neg(G.add(A,q(1,2))),{Z,T}=sourceScaledOperators(G,X,eta);
const norm=records.slice(1).map(n=>n.norm.actual),s1=G.div(b.inner.delta,q(16)),[,s2,s3,s4]=norm.map(r=>r.strip);
const exact=(x,y,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(x,y),{atomicNodes,maxTerms:200000});
assert.ok(exact(s3,G.mul(q(256),s4),[b.inner.delta]).pass);
assert.equal(n4.raw.omegaOverX,fixed.omega3.raw);assert.equal(n4.raw.pKnown,fixed.omega3.rawKnownPressure);
const native=G.picardSystems[n4.raw.system];
assert.deepEqual(native.diagonal,[0,0,2,0,3,1]);
assert.deepEqual(native.A0.slice(0,2),[[z,z,z,z,o,z],[z,z,z,z,z,o]]);
assert.ok(native.A1.slice(0,2).every(row=>row.every(v=>v===z)));
assert.deepEqual(native.radialDomain,[z,G.sqrt(b.inner.aSquared)]);

const xx=G.fresh('C112L_X'),ee=G.fresh('C112L_eta'),atoms=[xx,ee,h],dx=G.sub(X,xx),de=G.sub(eta,ee);
const at=f=>G.simultaneousSubstitute(f,[X,eta],[xx,ee]);
function jet(name){
  const j=Array.from({length:6},(_,i)=>G.fresh('C112L_'+name+'_'+i));atoms.push(...j);
  return G.add(j[0],G.mul(j[1],dx),G.mul(j[2],de),G.mul(q(1,2),j[3],G.pow(dx,2)),G.mul(j[4],dx,de),G.mul(q(1,2),j[5],G.pow(de,2)));
}
const originals=['F','U','v'].map(tag=>[0,1,2,3].map(n=>jet(tag+n)));
const errors=['F','U','v'].map(tag=>[z,...[1,2,3].map(n=>jet('delta'+tag+n))]);
const [F,U,v]=originals,[dF,dU,dv]=errors;
const [f,u,w]=originals.map((r,i)=>r.map((v,j)=>G.sub(v,errors[i][j])));
const sum=xs=>G.add(...xs),prod=(...ids)=>G.mul(...ids);
const velTrans=g=>sum([prod(q(1,2),g),prod(X,G.derivative(g,X))]);
const thetaTrans=g=>sum([g,prod(X,G.derivative(g,X))]);
const ZZ=(b,g)=>Z(G.sub(b,D),Z(b,g));
const om=(U,v)=>buildActualOmegaCoefficientOverX(G,{order:3,X,eta,U,v}).value;
const v3X=G.derivative(dv[3],X);
const omegaError=[T(G.sub(nu(3),o),dv[3]),prod(q(-2),sum([prod(q(2),v3X),prod(X,G.derivative(v3X,X))])),G.neg(ZZ(G.sub(nu(2),o),dv[2]))];
for(let i=0;i<=3;i++){
  const j=3-i,e=G.sub(nu(j),o);
  omegaError.push(prod(dv[i],velTrans(v[j])),prod(w[i],velTrans(dv[j])),prod(dU[i],Z(e,v[j])),prod(u[i],Z(e,dv[j])));
}
const omegaProof=exact(at(G.sub(om(U,v),om(u,w))),at(sum(omegaError)),atoms);
const p=(F,U,v)=>G.sub(sum([prod(q(2),F[1],F[3]),G.pow(F[2],2)]),prod(q(1,2),om(U,v)));
const pChange=G.sub(sum([prod(q(2),dF[1],F[3]),prod(q(2),f[1],dF[3]),prod(G.add(F[2],f[2]),dF[2])]),prod(q(1,2),sum(omegaError)));
const pProof=exact(at(G.sub(p(F,U,v),p(f,u,w))),at(pChange),atoms);

function force(F,U,v){
  const theta=[],axial=[];
  for(let i=1;i<=3;i++){
    const j=4-i;
    theta.push(prod(v[i],thetaTrans(F[j])),prod(U[i],Z(G.add(a,nu(j)),F[j])));
    axial.push(prod(X,v[i],G.derivative(U[j],X)),prod(U[i],Z(G.add(c,nu(j)),U[j])));
  }
  theta.push(G.neg(ZZ(G.add(a,nu(3)),F[3])));axial.push(G.neg(ZZ(G.add(c,nu(3)),U[3])));
  return [sum(theta),sum(axial)];
}
const lhs0=force(F,U,v),lhs1=force(f,u,w),thetaErr=[],axialErr=[];
for(let i=1;i<=3;i++){
  const j=4-i,fa=G.add(a,nu(j)),ca=G.add(c,nu(j));
  thetaErr.push(prod(dv[i],thetaTrans(F[j])),prod(w[i],thetaTrans(dF[j])),prod(dU[i],Z(fa,F[j])),prod(u[i],Z(fa,dF[j])));
  axialErr.push(prod(X,dv[i],G.derivative(U[j],X)),prod(X,w[i],G.derivative(dU[j],X)),prod(dU[i],Z(ca,U[j])),prod(u[i],Z(ca,dU[j])));
}
thetaErr.push(G.neg(ZZ(G.add(a,nu(3)),dF[3])));axialErr.push(G.neg(ZZ(G.add(c,nu(3)),dU[3])));
const forceProofs=[thetaErr,axialErr].map((err,i)=>exact(at(G.sub(lhs0[i],lhs1[i])),at(sum(err)),atoms));
assert.ok([omegaProof,pProof,...forceProofs].every(row=>row.pass));
const priorVisc=G.neg(ZZ(G.sub(nu(2),o),dv[2]));
const wrong=exact(at(G.sub(om(U,v),om(u,w))),at(G.sub(sum(omegaError),priorVisc)),atoms);assert.ok(!wrong.pass);

const ker=(p,t,a)=>src.actualInductionLinearKernel(G,{X,eta,xi:n4.raw.xi,lambda:nu(4),F0:n0.actual.F,U0:n0.actual.U,v0:n0.actual.v,pKnown:p,Htheta:t,Hz:a});
const k0=ker(n4.raw.pKnown,n4.raw.Htheta,n4.raw.Hz),k1=ker(p(f,u,w),...lhs1);
assert.deepEqual(k0.matrix0,k1.matrix0);assert.deepEqual(k0.matrix1,k1.matrix1);
const ax=id=>G.substitute(id,X,G.pow(n4.raw.xi,2));
assert.deepEqual(native.A0,k0.matrix0.map(row=>row.map(ax)));assert.deepEqual(native.A1,k0.matrix1.map(row=>row.map(ax)));

const Q=G.parameter('Q'),t1=G.parameter('t1'),Xa=G.parameter('Xa'),width=G.div(t1,q(64)),rad=G.sqrt(b.inner.aSquared);
const tk1=G.div(q(9),prod(width,Xa)),tk2=sum([G.div(q(9),prod(width,G.pow(Xa,2))),G.div(q(8192),prod(G.pow(width,2),G.pow(Xa,2)))]);
const Tcut=sum([o,prod(q(3),tk1),tk2]),Ma=prod(q(1n<<20n),G.pow(Q,4)),E=s=>sum([o,G.div(q(2),s)]);
function actualMagnitude({C,strip,solutionNorm:m}){return prod(Tcut,sum([m,prod(q(2),sum([prod(Ma,E(strip),m),C]))]));}
const H2=G.maximum(o,b.inner.B,...norm.slice(0,2).map(actualMagnitude)),H3=G.maximum(o,b.inner.B,...norm.slice(0,3).map(actualMagnitude));
const H1=G.div(prod(q(4096),sum([o,norm[0].C]),sum([o,norm[0].solutionNorm]),G.pow(Q,64)),prod(t1,s1));
const Fd2e=G.div(prod(q(1n<<25n),H1),G.pow(s1,2));
function fromForcing(f,ep,s){const v=sum([ep,prod(q(2),rad,f)]),j=sum([prod(q(16),Ma,E(s),v),f]);return {v,cut:prod(Tcut,sum([v,prod(q(2),j)]))};}
function gain(e,ep2,ep3,ep4){
  const f2=prod(Fd2e,e),c2=fromForcing(f2,ep2,s2);
  const f3=G.div(prod(q(1n<<35n),H2,sum([e,c2.cut])),G.pow(s2,4)),c3=fromForcing(f3,ep3,s3);
  const f4=G.div(prod(q(1n<<36n),H3,sum([e,c2.cut,c3.cut])),G.pow(s3,4)),c4=fromForcing(f4,ep4,s4);
  const cauchy=prod(q(6),G.pow(sum([o,G.div(q(16),s4)]),3),sum([c4.v,c4.cut]));
  return {c2,c3,c4,f2,f3,f4,cauchy,total:sum([e,c2.cut,c3.cut,cauchy])};
}
const columns=Array.from({length:4},(_,i)=>gain(...Array.from({length:4},(_,j)=>i===j?o:z)));
const [DN,...DK]=columns.map(r=>r.total),lg2=G.log(q(2)),lg4=G.log(q(4)),bits=q(259);
const e0=prod(q(1n<<25n),G.pow(Q,64),G.pow(t1,-2),sum([prod(q(1n<<73n),G.pow(Q,-77)),prod(q(1n<<46n),G.pow(Q,-19))]));
const N=G.add(q(2),G.ceiling(G.div(G.log(sum([o,prod(G.pow(q(2),259),sum([o,DN]),e0)])),prod(q(25),G.log(Q)))));
const ks=DK.map((p,j)=>G.maximum(sum([norm[j+1].Kcondition,q(2)]),G.ceiling(G.div(sum([prod(bits,lg2),G.log(sum([o,p]))]),lg4))));
assert.ok([N,...ks].every(id=>G.freeCoordinates(id).size===0));
const out={schema:'MathScope.C112.OriginalN4PairedLocalOperands/1',prior,originalPrefix:fixed.originalPrefixSHA256,systems:[3,5,7],originalEta:eta,
  originalRadialDomain:[z,b.inner.aSquared],fixedMatrixEntries:72,nativeStripIds:{s2,s3,s4,ratio:256},
  targetExpressions:{omega3:n4.raw.omegaOverX,known:n4.raw.pKnown,theta:n4.raw.Htheta,axial:n4.raw.Hz},
  pairedExactNumerators:[omegaProof.numeratorMonomials,pProof.numeratorMonomials,...forceProofs.map(x=>x.numeratorMonomials)],
  omittedPreviousOmega2DiffNumerator:wrong.numeratorMonomials,positiveMagnitudes:{H2,H3,Ma,Tcut},positiveColumns:columns,
  nativeWordRatio:'6 Ma sqrt(aSquared)/s4 < 2^60 Q^-26 < 1/2',
  finiteDepths:{N,K2:ks[0],K3:ks[1],K4:ks[2],bitsEach:259,freeCoordinates:0,evaluatedNumerically:false},
  wholePairedN4:'OPEN',generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({numerators:out.pairedExactNumerators,wrong:out.omittedPreviousOmega2DiffNumerator,depths:out.finiteDepths}));
