/** Source-bound factorization of genuine moving-frame normal tangency.
 * The original wave t=Bz, B=UJ has n·U=0 because nt^2=n_theta^2+n_z^2.
 * Do NOT atomize weighted amplitude components: that hides this identity.
 * No private seal is forged and no source constants may be caller-selected.
 */
export const FRAME_TANGENCY_SCHEMA='MathScope.N6.OriginalSignedFrameTangency/1';
const die=(code,message)=>{const e=new Error(message);e.code=code;throw e;};
const root=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes?.[x];
const same=(G,a,b)=>root(G,a)&&root(G,b)&&a===b;
const dot=(G,a,b)=>G.add(...a.map((x,i)=>G.mul(x,b[i])));
const mult=(G,A,B)=>A.map(row=>B[0].map((_,j)=>dot(G,row,B.map(col=>col[j]))));
const matrix=(G,A,r,c)=>Array.isArray(A)&&A.length===r&&A.every(row=>Array.isArray(row)&&row.length===c&&row.every(v=>root(G,v)));
const equalMatrix=(G,A,B)=>A.length===B.length&&A.every((row,i)=>row.length===B[i].length&&row.every((x,j)=>same(G,x,B[i][j])));
export function certifySignedTangencyByOriginalFrame(G,f,weighted,{graphEqual,epsilon,deltaAmplitude,chi,psi,slowCutoff}={}){
  if(typeof graphEqual!=='function'||!G?.nodes||!f?.frame||!f?.t||!f?.z)
    die('SIGNED_FRAME_CERTIFICATE_MISSING','Original moving frame and z must exist.');
  const {n,nt,U,J,B}=f.frame;
  if(!Array.isArray(n)||n.length!==3||!n.every(x=>root(G,x))||!root(G,nt)||
     !matrix(G,U,3,2)||!matrix(G,J,2,2)||!matrix(G,B,3,2)||
     !Array.isArray(f.t)||f.t.length!==3||!f.t.every(x=>root(G,x))||
     !Array.isArray(f.z)||f.z.length!==2||!f.z.every(x=>root(G,x))||
     !Array.isArray(weighted)||weighted.length!==3||!weighted.every(x=>root(G,x))||
     ![epsilon,deltaAmplitude,chi,psi,slowCutoff].every(x=>root(G,x)))
    die('SIGNED_FRAME_CERTIFICATE_MISSING','No missing or caller-defined frame coefficients.');
  const tangentSquared=G.add(G.pow(n[1],2),G.pow(n[2],2));
  if(G.nodes[nt].op!=='sqrt_positive'||G.nodes[nt].args[0]!==tangentSquared)
    die('SIGNED_FRAME_NT_POSITIVITY_UNPROVED','nt must equal sqrt_positive(n_theta²+n_z²).');
  const Ka=[G.div(n[1],nt),G.div(n[2],nt)],Na=[Ka[1],G.neg(Ka[0])],sa=G.div(n[0],nt),
        expectedU=[[G.one,G.zero],[G.neg(G.mul(sa,Ka[0])),Na[0]],[G.neg(G.mul(sa,Ka[1])),Na[1]]];
  if(!equalMatrix(G,U,expectedU))
    die('SIGNED_FRAME_BASIS_MISMATCH','The source U is not the original n/nt basis.');
  if(!same(G,J[0][0],G.one)||!same(G,J[0][1],G.one)||!same(G,J[1][1],G.neg(J[1][0]))||
     !equalMatrix(G,B,mult(G,U,J)))
    die('SIGNED_FRAME_TRANSPORT_MISMATCH','The source B must be UJ.');
  const expectedT=mult(G,B,f.z.map(x=>[x])).map(row=>row[0]);
  if(!f.t.every((x,i)=>same(G,x,expectedT[i])))
    die('SIGNED_FRAME_PULSE_MISMATCH','The source tangent must be the actual Bz.');
  const expectedW=f.t.map(x=>G.mul(slowCutoff,G.mul(G.sqrt(epsilon),deltaAmplitude,chi,psi,x)));
  if(!weighted.every((x,i)=>same(G,x,expectedW[i])))
    die('SIGNED_FRAME_AMPLITUDE_MISMATCH','Wrong original Signed scalar prefactor.');
  // Only n,nt are rational atoms. The U basis is expanded and both
  // identities must pass the original source graph-rational checker.
  const p0=G.mul(G.pow(nt,2),dot(G,n,U.map(row=>row[0]))),
        q0=G.mul(n[0],G.sub(G.pow(nt,2),tangentSquared)),
        p1=dot(G,n,U.map(row=>row[1]));
  const col0=graphEqual(G,p0,q0,[...n,nt]),col1=graphEqual(G,p1,G.zero,[...n,nt]);
  if(col0?.pass!==true||col1?.pass!==true)
    die('SIGNED_FRAME_RATIONAL_PROOF_FAILED','Both cleared moving-frame identities require exact rational proof.');
  return {schema:FRAME_TANGENCY_SCHEMA,pass:true,method:'SOURCE_BOUND_FACTORIZED_MOVING_FRAME',
    identityProven:'nt²*(n·U0)=n0*(nt²-n1²-n2²)=0, n·U1=0, B=UJ, t=Bz, weighted=scalar*t',
    checks:[{id:'original-positive-nt',pass:true},{id:'source-U',pass:true},{id:'source-B-equals-UJ',pass:true},
      {id:'source-t-equals-Bz',pass:true},{id:'weighted-source-factor',pass:true},
      {id:'cleared-U0',...col0},{id:'U1',...col1}],sourceNumericallyEvaluated:false};
}
