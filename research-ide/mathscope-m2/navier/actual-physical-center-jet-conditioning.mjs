/** Small directed conditioning calculation used by the runtime.
 * This is the identical function body copied from the executed-source
 * binder. It accepts numerical boxes, supplies no source authentication,
 * and cannot issue a private original-graph token or a G-NUM certificate.
 * The runtime binds its external executed certificate independently.
 */
import {directedArithmetic,fail} from './actual-continuation-arithmetic.mjs';

export function physicalCenterNumericalJetConditioning(values,bits){
  if(!values||values.centers?.length!==2||values.weights?.length!==2||values.covariance?.length!==2||values.covariance.some(r=>r.length!==2))
    fail('INVALID_INPUT','Two center, covariance-column and positive-weight value intervals are required.');
  const A=directedArithmetic(bits),centers=values.centers.map(x=>A.unpack(x)),squares=centers.map(x=>A.mul(x,x)),
    rawH=values.covariance.map(row=>row.map(x=>A.unpack(x))),rawY=values.weights.map(x=>A.unpack(x)),
    H=rawH.map(row=>row.map((x,i)=>A.div(x,squares[i]))),Y=rawY.map((x,i)=>A.mul(x,squares[i])),
    det=A.sub(A.mul(H[0][0],H[1][1]),A.mul(H[0][1],H[1][0])),
    inverse=[[H[1][1],A.neg(H[0][1])],[A.neg(H[1][0]),H[0][0]]].map(row=>row.map(x=>A.div(x,det))),
    abs=x=>[x[0]>=0n?x[0]:x[1]<=0n?-x[1]:0n,(x[0]<0n?-x[0]:x[0])>(x[1]<0n?-x[1]:x[1])?(x[0]<0n?-x[0]:x[0]):(x[1]<0n?-x[1]:x[1])],
    inverseRows=inverse.map(row=>row.map(abs).reduce((a,b)=>A.add(a,b),A.zero())),sqrtY=Y.map(x=>A.sqrt(x)),
    checks=[{id:'actual-centers-in-one-quarter-to-one-half',pass:centers.every(x=>4n*x[0]>=A.S&&2n*x[1]<=A.S)},
      {id:'actual-uncentered-covariance-has-opposite-second-row-signs',pass:rawH[0].every(x=>8n*x[0]>=A.S&&2n*x[1]<=A.S)&&
        8n*rawH[1][0][0]>=A.S&&2n*rawH[1][0][1]<=A.S&&8n*rawH[1][1][1]<=-A.S&&2n*rawH[1][1][0]>=-A.S},
      {id:'actual-uncentered-positive-weights-in-one-to-four',pass:rawY.every(x=>x[0]>=A.S&&x[1]<=4n*A.S)},
      {id:'actual-centered-H-determinant-negative',pass:det[1]<0n},
      {id:'actual-centered-H-infinity-inverse-at-most-one',pass:inverseRows.every(x=>x[1]<=A.S)},
      {id:'actual-centered-weights-in-one-eighth-to-one-half',pass:Y.every(x=>8n*x[0]>=A.S&&2n*x[1]<=A.S)},
      {id:'actual-centered-positive-square-root-at-least-one-quarter',pass:sqrtY.every(x=>4n*x[0]>=A.S)}];
  if(checks.some(x=>!x.pass))fail('PRECISION_REQUIRED','The actual new-center inverse conditioning is not separated: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {checks,pass:true,sourceAuthenticated:false,H:H.map(row=>row.map(x=>A.pack(x))),Y:Y.map(x=>A.pack(x)),
    determinant:A.pack(det),inverse:inverse.map(row=>row.map(x=>A.pack(x))),inverseRowBounds:inverseRows.map(x=>A.pack(x)),sqrtY:sqrtY.map(x=>A.pack(x)),
    arithmetic:{bits,kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',binary64UsedForDecisions:false},
    source:'H is the actual H/(diag(Ac,u)*massScale); centers are actual a_sign, and weights are actual y/(tau/massScale). Centering divides each independent column by its own positive a_sign^2.'};
}
