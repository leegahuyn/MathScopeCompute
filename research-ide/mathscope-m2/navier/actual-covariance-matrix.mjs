/** Actual algebra of the moving constrained pulse. This small function is
 * deliberately separate from source authentication so independent rational
 * matrices can verify every connection, pressure and moving-basis term. */
import {fail} from './actual-continuation-arithmetic.mjs';

export function covarianceMatrixAlgebra(G){
  const dot=(a,b)=>G.add(...a.map((x,i)=>G.mul(x,b[i])));
  const transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
  const mul=(A,B)=>{const BT=transpose(B);return A.map(r=>BT.map(c=>dot(r,c)));};
  const add=(A,B)=>A.map((r,i)=>r.map((x,j)=>G.add(x,B[i][j])));
  const sub=(A,B)=>A.map((r,i)=>r.map((x,j)=>G.sub(x,B[i][j])));
  const scale=(a,A)=>A.map(r=>r.map(x=>G.mul(a,x)));
  const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?G.one:G.zero));
  return {dot,transpose,mul,add,sub,scale,identity};
}

export function actualMovingPulseFrame(G,input){
  const names=['F','FR','GR','R','epsilon','k','p','pz','x0','v','Ls','u','c0','lambda0','HR','HZ'];
  if(!input||names.some(k=>!Number.isSafeInteger(input[k])||!G.nodes[input[k]])||Object.keys(input).some(k=>!names.includes(k)&&k!=='sign')||![1,-1].includes(input.sign))fail('INVALID_INPUT','Supply each explicit actual field and phase operand. No omitted moving-frame term is accepted.');
  const {F,FR,GR,R,epsilon,k,p,pz,x0,v,Ls,u,c0,lambda0,HR,HZ,sign}=input,q=(n,d=1)=>G.q(n,d),{dot,transpose,mul,sub,scale,identity}=covarianceMatrixAlgebra(G);
  const n=[G.sub(x0,G.mul(v,HR)),G.div(p,R),G.sub(pz,G.mul(epsilon,v,HZ))],nPrime=[G.neg(HR),G.zero,G.neg(G.mul(epsilon,HZ))],n2=dot(n,n);
  const K=[[G.zero,G.neg(G.mul(q(2),F)),G.zero],[G.add(G.mul(q(2),F),G.mul(R,FR)),G.zero,G.zero],[GR,G.zero,G.zero]];
  const nTK=transpose(K).map(c=>dot(n,c)),pressureNumerator=nTK.map((x,j)=>G.sub(x,nPrime[j]));
  const Aphi=K.map((row,i)=>row.map((x,j)=>G.add(G.neg(x),G.div(G.mul(n[i],pressureNumerator[j]),n2))));
  const projection=sub(identity(3),scale(G.inv(n2),n.map(x=>n.map(y=>G.mul(x,y)))));
  const nt=G.sqrt(G.add(G.pow(n[1],2),G.pow(n[2],2))),Ka=[G.div(n[1],nt),G.div(n[2],nt)],Na=[Ka[1],G.neg(Ka[0])],sa=G.div(n[0],nt);
  const s=G.mul(q(sign),u,G.add(q(1,2),G.div(v,Ls))),sPrime=G.div(G.mul(q(sign),u),Ls),root=G.sqrt(G.add(G.one,G.pow(s,2))),c=G.mul(c0,root);
  const U=[[G.one,G.zero],[G.neg(G.mul(sa,Ka[0])),Na[0]],[G.neg(G.mul(sa,Ka[1])),Na[1]]],J=[[G.one,G.one],[c,G.neg(c)]];
  const Uleft=[[G.one,G.zero,G.zero],[G.zero,Na[0],Na[1]]],Jinverse=[[q(1,2),G.div(q(1,2),c)],[q(1,2),G.neg(G.div(q(1,2),c))]];
  const B=mul(U,J),UPrime=U.map(row=>row.map(x=>G.derivative(x,v))),JPrime=J.map(row=>row.map(x=>G.derivative(x,v))),BPrime=G.nodes[v].op==='coordinate'?B.map(row=>row.map(x=>G.derivative(x,v))):null;
  if(!BPrime)fail('INVALID_INPUT','The moving frame needs its independent pulse coordinate.');
  const Bleft=mul(Jinverse,Uleft),projected=mul(Bleft,sub(mul(Aphi,B),BPrime)),lambda=G.div(lambda0,root),dref=G.div(G.mul(lambda0,G.add(G.one,G.pow(s,2))),G.pow(G.sqrt(G.add(G.one,G.pow(u,2))),3)),d=G.mul(epsilon,G.pow(k,2),n2);
  const diagonal=[[lambda,G.zero],[G.zero,G.neg(lambda)]],error=sub(projected,diagonal),wMatrix=projected.map((row,i)=>row.map((x,j)=>i===j?G.sub(x,G.add(lambda,G.sub(d,dref))):x));
  return {n,nPrime,nSquared:n2,principalK:K,Aphi,forcingProjection:projection,
    pressureImaginaryRow:pressureNumerator.map(x=>G.div(x,G.mul(k,n2))),
    nt,Ka,Na,sa,s,sPrime,U,J,UPrime,JPrime,B,BPrime,Bleft,projected,reference:{lambda,dref,diagonal},actualDamping:d,projectedError:error,wMatrix,
    identities:{constraint:'n^T*A_phi+n_prime^T=0',pressure:'pi=i*(n^T*K-n_prime^T)*t/(k*|n|^2)',
      leftInverse:'Bleft*B=I2',basisDerivative:'B_prime=U_prime*J+U*J_prime',
      normalizedEquation:'w_prime=[Bleft*(Aphi*B-Bprime)-lambda*I-(d-dref)*I]*w; z=P*w',
      fullCylindricalConnections:true,movingNormalRetained:true,movingBasisRetained:true},
    sourceCertificate:false};
}
