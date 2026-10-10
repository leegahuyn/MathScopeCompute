import {bigint,small,fail,mod} from '../../mathscope-m1/arithmetic/exact.mjs';
import {primeBase} from '../../mathscope-m1/arithmetic/padic.mjs';

// Polynomial coefficients are ascending. All arithmetic here is in F_p.
const rem=(x,p)=>((x%p)+p)%p;
const trim=a=>{const b=a.slice();while(b.length>1&&b.at(-1)===0)b.pop();return b.length?b:[0];};
function inverse(a,p){for(let x=1;x<p;x++)if(rem(a*x,p)===1)return x;fail('NONUNIT_DIVISION','The polynomial leading coefficient is not a field unit.');}
function divrem(a,b,p){a=trim(a.map(x=>rem(x,p)));b=trim(b.map(x=>rem(x,p)));if(b.length===1&&b[0]===0)fail('DIVISION_BY_ZERO','Zero polynomial divisor.');const q=Array(Math.max(1,a.length-b.length+1)).fill(0),inv=inverse(b.at(-1),p);while(a.length>=b.length&&!(a.length===1&&a[0]===0)){const d=a.length-b.length,c=rem(a.at(-1)*inv,p);q[d]=c;for(let j=0;j<b.length;j++)a[j+d]=rem(a[j+d]-c*b[j],p);a=trim(a);}return{q:trim(q),r:a};}
function multiply(a,b,p,f=null){const c=Array(a.length+b.length-1).fill(0);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)c[i+j]=rem(c[i+j]+a[i]*b[j],p);return f?divrem(c,f,p).r:trim(c);}
function power(a,n,p,f){let r=[1];while(n>0){if(n%2)r=multiply(r,a,p,f);n=Math.floor(n/2);if(n)a=multiply(a,a,p,f);}return r;}
function gcd(a,b,p){while(!(b.length===1&&b[0]===0)){[a,b]=[b,divrem(a,b,p).r];}const inv=inverse(a.at(-1),p);return trim(a.map(x=>rem(x*inv,p)));}
function minusX(a,p){const b=a.slice();while(b.length<2)b.push(0);b[1]=rem(b[1]-1,p);return trim(b);}

export function isIrreducible(polynomial,p){
  p=Number(primeBase(p));const f=trim(polynomial.map(x=>rem(small(x,'field coefficient',-1000000,1000000),p))),m=f.length-1;
  if(m<1||f.at(-1)!==1)return false;
  // Rabin's test, checking every degree up to m/2 rather than factoring m.
  let xp=[0,1];
  for(let k=1;k<=m;k++){
    xp=power(xp,p,p,f);
    if(k<=Math.floor(m/2)&&gcd(f,minusX(xp,p),p).length>1)return false;
  }
  return divrem(minusX(xp,p),f,p).r.every(x=>x===0);
}

export function finiteField(p=3,m=1,polynomial=null,tracker=null){
  p=Number(primeBase(p));if(p>257)fail('UNSUPPORTED','Finite-field observations support p <= 257.');
  m=small(m,'extension degree',1,4);const q=p**m;
  if(q>4096)fail('BUDGET_LIMIT','The exact finite-field view is limited to p^m <= 4096.',{p,m,q,maxFieldOrder:4096});
  let f;
  if(polynomial!==null){if(!Array.isArray(polynomial)||polynomial.length!==m+1)fail('INVALID_FIELD','A degree-m monic defining polynomial is required.');f=polynomial.map(x=>rem(small(x,'field coefficient',-1000000,1000000),p));if(f.at(-1)!==1||!isIrreducible(f,p))fail('INVALID_FIELD','The defining polynomial is reducible or not monic.');}
  else if(m===1)f=[0,1];
  else{
    for(let code=1;code<q;code++){tracker?.tick();if(code%p===0)continue;let n=code;const candidate=Array.from({length:m},()=>{const d=n%p;n=Math.floor(n/p);return d;});candidate.push(1);if(isIrreducible(candidate,p)){f=candidate;break;}}
    if(!f)fail('INTERNAL_CERTIFICATE','No irreducible polynomial was found.');
  }
  const decode=x=>{const a=[];for(let i=0;i<m;i++){a.push(x%p);x=Math.floor(x/p);}return a;};
  const encode=a=>a.reduce((s,x,i)=>s+rem(x,p)*p**i,0);
  const coeffs=Array.from({length:q},(_,x)=>decode(x));
  const add=(x,y)=>encode(coeffs[x].map((a,i)=>a+coeffs[y][i]));
  const sub=(x,y)=>encode(coeffs[x].map((a,i)=>a-coeffs[y][i]));
  const mul=(x,y)=>{tracker?.tick();if(m===1)return x*y%p;return encode(multiply(coeffs[x],coeffs[y],p,f));};
  const pow=(x,n)=>{let a=x,r=1;while(n){if(n%2)r=mul(r,a);n=Math.floor(n/2);if(n)a=mul(a,a);}return r;};
  return{p,m,q,polynomial:f,decode,encode,add,sub,mul,pow,constant:x=>Number(mod(bigint(x,'integer coefficient'),BigInt(p))),manifest:{kind:'EXACT_FINITE_FIELD',characteristic:String(p),extensionDegree:m,order:String(q),definingPolynomial:f.map(String),coefficientOrder:'ascending in alpha',elementEncoding:'base-p coefficients in basis 1,alpha,...,alpha^(m-1)',irreducibility:{method:'Rabin: Frobenius powers, gcd tests and x^(p^m)=x modulo f',pass:true}}};
}

export function ellipticPointCount(field,a=-1,b=0,{fullPairs=false,maxPoints=500,tracker=null}={}){
  const {q,m,p}=field,A=field.constant(a),B=field.constant(b),squares=Array(q),rhs=Array(q),multiplicities=Array(q).fill(0),roots=Array.from({length:q},()=>[]);
  for(let y=0;y<q;y++){squares[y]=field.mul(y,y);multiplicities[squares[y]]++;roots[squares[y]].push(y);}
  let count=1;
  const points=[];
  for(let x=0;x<q;x++){rhs[x]=field.add(field.add(field.mul(field.mul(x,x),x),field.mul(A,x)),B);count+=multiplicities[rhs[x]];for(const y of roots[rhs[x]])if(points.length<maxPoints)points.push({x:String(x),y:String(y),xCoefficients:field.decode(x).map(String),yCoefficients:field.decode(y).map(String)});}
  let pairCount=null;
  if(fullPairs){pairCount=1;for(let x=0;x<q;x++){tracker?.tick(q);for(let y=0;y<q;y++)if(squares[y]===rhs[x])pairCount++;}}
  return{field:field.manifest,count:String(count),pointAtInfinity:{projectiveCoordinates:['0','1','0'],includedOnce:true},affinePoints:points,displaySampled:count-1>points.length,method:'Exact square-multiplicity enumeration in the explicitly constructed finite field',independentFullPairCount:pairCount===null?null:String(pairCount),checks:[{name:'finite field irreducibility',pass:true},...(pairCount===null?[]:[{name:'all (x,y) pair enumeration agrees with square multiplicities',pass:pairCount===count}])],scope:{finite:true,p:String(p),extensionDegree:m,geometricDimension:1,pointCoordinatesAreFiniteFieldResidueRepresentatives:true}};
}
