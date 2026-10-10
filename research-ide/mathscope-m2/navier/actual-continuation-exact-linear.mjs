/** Small independent Laurent-polynomial verification of the exact linear
 * identities used by the actual continuous moment solve. Matrix entries,
 * nonzero scales and incoming moments are indeterminates. No sampled debt
 * or numerical inverse enters this verification.
 */

const zero=()=>new Map(),one=()=>new Map([['',1n]]);
const decode=s=>new Map(s?s.split(',').map(t=>{const [v,p]=t.split(':');return [Number(v),Number(p)];}):[]);
const encode=m=>[...m].filter(([,p])=>p).sort((a,b)=>a[0]-b[0]).map(([v,p])=>v+':'+p).join(',');
const variable=(v,p=1)=>new Map([[v+':'+p,1n]]);
function add(...ps){const out=zero();for(const p of ps)for(const [k,v]of p){const n=(out.get(k)??0n)+v;if(n)out.set(k,n);else out.delete(k);}return out;}
const neg=p=>new Map([...p].map(([k,v])=>[k,-v]));
function multiply(a,b){const out=zero();for(const [ka,va]of a)for(const [kb,vb]of b){const m=decode(ka);for(const [v,p]of decode(kb))m.set(v,(m.get(v)??0)+p);const k=encode(m),n=(out.get(k)??0n)+va*vb;if(n)out.set(k,n);else out.delete(k);}return out;}
const product=(...ps)=>ps.reduce(multiply,one());
function determinant(a){if(a.length===0)return one();if(a.length===1)return a[0][0];return add(...a[0].map((v,j)=>{const t=multiply(v,determinant(a.slice(1).map(row=>row.filter((_,k)=>k!==j))));return j%2?neg(t):t;}));}

export function verifyActualMomentLinearIdentities(){
  const matrixChecks=[];
  for(const size of [2,3]){
    const a=Array.from({length:size},(_,i)=>Array.from({length:size},(_,j)=>variable(i*size+j))),det=determinant(a);
    const adj=a.map((_,i)=>a.map((__,j)=>{const minor=determinant(a.filter((_,r)=>r!==j).map(row=>row.filter((_,c)=>c!==i)));return (i+j)%2?neg(minor):minor;}));
    for(let i=0;i<size;i++)for(let j=0;j<size;j++){
      const residual=add(...a[i].map((v,k)=>multiply(v,adj[k][j])),i===j?neg(det):zero());
      matrixChecks.push({size,row:i,column:j,remainingMonomials:residual.size,pass:residual.size===0});
    }
  }
  const m=Array.from({length:5},(_,i)=>variable(i)),r=variable(5),ri=variable(5,-1),ef=variable(6),efi=variable(6,-1),ru=variable(7),rui=variable(7,-1),r2=variable(8),r2i=variable(8,-1),rp=variable(9),rpi=variable(9,-1),rz=variable(10),rzi=variable(10,-1),two=variable(11),twoi=variable(11,-1),lambda2=variable(12),lambda2i=variable(12,-1);
  const u0=neg(product(m[0],ri)),u1=product(add(neg(product(m[0],ri)),product(m[3],efi,rui)),lambda2i),originalU1=add(u0,neg(multiply(lambda2,u1)));
  const e0=neg(product(m[1],r2i)),e1=neg(product(m[2],twoi,efi,rpi)),e2=product(m[4],efi,rzi);
  const correction=[product(r,u0),product(r2,e0),product(two,ef,rp,e1),product(ef,ru,originalU1),neg(product(ef,rz,e2))];
  const physicalMomentChecks=m.map((v,j)=>{const residual=add(v,correction[j]);return {moment:j+1,remainingMonomials:residual.size,pass:residual.size===0};});
  const pass=[...matrixChecks,...physicalMomentChecks].every(v=>v.pass);
  if(!pass)throw Error('The actual moment linear identities did not reduce to exact zero.');
  return {schema:'MathScope.ActualMomentUniversalLinearIdentity/1',arithmetic:'BigInt Laurent polynomials; every nonzero matrix scale and every incoming moment is an independent symbol',
    matrixIdentity:'A*adj(A)=det(A)*I for both 2x2 and 3x3 blocks',matrixChecks,physicalMomentChecks,
    determinantNonzeroSuppliedSeparatelyByContinuousPositiveBumpProof:true,arbitraryIncomingMoments:true,approximateArithmetic:false,pass};
}
