/** Source-derived analytic norms for the actual order-zero/one core residual.
 * No declared C, substituted profile, or adjustable observation radius enters
 * this API.  Positive expressions remain exact when their decimals cannot be
 * materialized.  The norm graph executes every sum/product/Cauchy loss.
 */
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {actualBackgroundMajorant} from './actual-background-majorant.mjs';

const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a<0n?-a:a;};
class PositiveExpressions{
  constructor(){this.nodes=[];this.ids=new Map();this.zero=this.rat(0);this.one=this.rat(1);}
  node(op,...args){const key=JSON.stringify([op,...args]);if(this.ids.has(key))return this.ids.get(key);const id=this.nodes.length;this.nodes.push({op,args});this.ids.set(key,id);return id;}
  rat(a,b=1){a=BigInt(a);b=BigInt(b);if(a<0n||b<=0n)throw Error('A positive norm expression cannot have negative input.');const g=gcd(a,b);return this.node('rational',String(a/g),String(b/g));}
  ref(name){return this.node('source_expression',name);}
  add(a,b){if(a===this.zero)return b;if(b===this.zero)return a;const x=this.nodes[a],y=this.nodes[b];if(x.op==='rational'&&y.op==='rational')return this.rat(BigInt(x.args[0])*BigInt(y.args[1])+BigInt(y.args[0])*BigInt(x.args[1]),BigInt(x.args[1])*BigInt(y.args[1]));return this.node('add',...([a,b].sort((x,y)=>x-y)));}
  mul(a,b){if(a===this.zero||b===this.zero)return this.zero;if(a===this.one)return b;if(b===this.one)return a;const x=this.nodes[a],y=this.nodes[b];if(x.op==='rational'&&y.op==='rational')return this.rat(BigInt(x.args[0])*BigInt(y.args[0]),BigInt(x.args[1])*BigInt(y.args[1]));return this.node('multiply',...([a,b].sort((x,y)=>x-y)));}
  div(a,b){if(b===this.zero)throw Error('Zero norm denominator.');return this.mul(a,this.node('inverse_positive',b));}
  power(a,n){let out=this.one;for(let i=0;i<n;i++)out=this.mul(out,a);return out;}
  sum(xs){return xs.reduce((s,x)=>this.add(s,x),this.zero);}
}
const pairs=n=>{const out=[];for(let i=0;i<=n;i++)for(let j=0;j+i<=n;j++)out.push([i,j]);return out;};

/** Taylor-coefficient norm jets. Derivatives reduce the available degree;
 * no missing high derivative is silently set to zero. */
function normJets(G){
  const at=(a,i,j)=>{if(i+j>a.degree)throw Error('Missing analytic derivative in residual norm.');return a.values[i+','+j];};
  const make=(degree,f)=>({degree,values:Object.fromEntries(pairs(degree).map(([i,j])=>[i+','+j,f(i,j)]))});
  const constant=(value,degree=3)=>make(degree,(i,j)=>i+j?G.zero:value);
  const add=(...as)=>make(Math.min(...as.map(a=>a.degree)),(i,j)=>G.sum(as.map(a=>at(a,i,j))));
  const scale=(a,n,d=1)=>make(a.degree,(i,j)=>G.mul(G.rat(n,d),at(a,i,j)));
  const mul=(a,b)=>make(Math.min(a.degree,b.degree),(i,j)=>G.sum(Array.from({length:i+1},(_,r)=>Array.from({length:j+1},(_,s)=>G.mul(at(a,r,s),at(b,i-r,j-s)))).flat()));
  const derivative=(a,coordinate)=>{if(a.degree<1)throw Error('Analytic derivative degree exhausted.');return make(a.degree-1,(i,j)=>G.mul(G.rat(coordinate==='X'?i+1:j+1),at(a,i+(coordinate==='X'?1:0),j+(coordinate==='eta'?1:0))));};
  return {at,make,constant,add,scale,mul,derivative};
}

export function actualResidualOrderBounds({profileId=SOURCE_PROFILE_ID,maxDerivativeOrder=2}={}){
  const source=assertSourceProfile(profileId);
  if(!Number.isSafeInteger(maxDerivativeOrder)||maxDerivativeOrder<0||maxDerivativeOrder>6)throw Error('maxDerivativeOrder must be an integer from 0 to 6.');
  const majorant=actualBackgroundMajorant({profileId,bits:160}),G=new PositiveExpressions(),J=normJets(G);
  const I=n=>({integer:String(n)}),R=name=>({ref:name}),mul=(...a)=>({product:a}),div=(a,b)=>({quotient:[a,b]}),pow=(a,n)=>({power:[a,n]});
  const exactExpressions={...majorant.exactExpressions,
    residualRadialRadius:div(I(3),R('Lambda')),
    residualEtaRadius:div(R('delta'),I(8)),
    residualLogPicardNorm:div(mul(I(9),pow(R('C1'),2),R('residualRadialRadius')),mul(I(2),R('cauchyRadiusLoss'))),
    residualPicardNorm:{exp:R('residualLogPicardNorm')},
    residualFieldNorm:{sum:[I(1),R('radialBaseBound'),mul(I(6),R('Q')),R('residualPicardNorm')]},
  };
  const radius=G.ref('residualRadialRadius'),etaRadius=G.ref('residualEtaRadius'),field=G.ref('residualFieldNorm');
  const invX=G.div(G.rat(2),radius),invEta=G.div(G.rat(2),etaRadius);
  // The underlying scalar fields and their radial averages are bounded on
  // |X|<R, dist(eta,[-1,1])<rho0. Cauchy centers use R/2,rho0/2.
  const atom=norm=>J.make(3,(i,j)=>G.mul(norm,G.mul(G.power(invX,i),G.power(invEta,j))));
  const X=J.make(3,(i,j)=>i+j===0?G.div(radius,G.rat(2)):i===1&&j===0?G.one:G.zero);
  const eta=J.make(3,(i,j)=>i+j===0?G.rat(2):i===0&&j===1?G.one:G.zero);
  const invL=J.make(3,(i,j)=>i?G.zero:G.mul(G.rat(2),G.power(invEta,j)));
  const d=J.add(J.constant(G.one),J.mul(eta,eta));
  const dx=a=>J.derivative(a,'X'),de=a=>J.derivative(a,'eta');
  const fields={f0:atom(field),U0:atom(field),f1:atom(field),U1:atom(field)};
  const average=atom(field);
  // |D+nu_n|<=1 for n=0,1 and the actual h<2^-2048.
  const v=U=>J.mul(invL,J.add(J.scale(J.mul(eta,U),2),J.scale(J.mul(eta,average),2),J.mul(d,de(average))));
  const v0=v(fields.U0),v1=v(fields.U1);
  // Every a in these actual operators has |a|<=4. Using that inequality is
  // a norm estimate, not substitution of a different a in the PDE.
  const Z=p=>J.mul(invL,J.add(J.scale(J.mul(eta,J.add(J.scale(p,4),J.mul(X,dx(p)))),2),J.mul(d,de(p))));
  const T=p=>J.mul(invL,J.add(J.scale(p,4),J.mul(X,dx(p)),J.mul(eta,de(p))));
  const Z2=p=>Z(Z(p));
  const radialDiff=v=>J.scale(J.add(J.scale(dx(v),2),J.mul(X,dx(dx(v)))),2);
  const adv=(vi,vj)=>J.mul(vi,J.add(J.scale(vj,1,2),J.mul(X,dx(vj))));
  const axadv=(U,vj)=>J.mul(U,Z(vj));
  const omega0=J.add(T(v0),adv(v0,v0),axadv(fields.U0,v0),radialDiff(v0));
  const omega1=J.add(T(v1),adv(v0,v1),adv(v1,v0),axadv(fields.U0,v1),axadv(fields.U1,v0),radialDiff(v1),Z2(v0));
  const omega2=J.add(adv(v1,v1),axadv(fields.U1,v1),Z2(v1));
  const f1OverX=atom(G.div(field,radius)); // Schwarz: f1(0,eta)=0.
  const hTheta1=J.add(J.mul(J.mul(X,v1),J.add(dx(fields.f1),f1OverX)),J.mul(fields.U1,Z(fields.f1)),Z2(fields.f1));
  const hZ1=J.add(J.mul(J.mul(X,v1),dx(fields.U1)),J.mul(fields.U1,Z(fields.U1)),Z2(fields.U1));
  const coefficientNorms={theta0:J.at(Z2(fields.f0),0,0),z0:J.at(Z2(fields.U0),0,0),radial0:J.at(omega0,0,0),radial0AxialViscosity:J.at(Z2(v0),0,0),theta1:J.at(hTheta1,0,0),z1:J.at(hZ1,0,0),radial1:J.at(J.add(omega1,J.scale(J.mul(fields.f1,fields.f1),2)),0,0),radial2:J.at(omega2,0,0)};
  const residualNorm=G.add(G.one,G.sum(Object.values(coefficientNorms)));
  const sharpC0=G.mul(G.rat(8),residualNorm);
  const derivativeScale=G.add(G.one,G.add(G.div(G.rat(32),G.node('sqrt_positive',radius)),G.div(G.rat(8),etaRadius)));
  const derivativeConstants=Array.from({length:maxDerivativeOrder+1},(_,m)=>({m,Km:2+m,N:[0,1],CNmNode:G.mul(sharpC0,G.power(G.mul(G.rat(32*(m+2)),derivativeScale),m)),formula:`8*Bres*(32*(${m}+2)*Dspace)^${m}`,qExponent:{hCoefficient:2,orderShift:1,constant:-(2+m)},actualConstantDerived:true}));
  return {schema:'MathScope.ActualResidualOrderBounds/1',profileId,parameterExpressionSHA256:source.parameterExpressionSHA256,sourceInputs:majorant.sourceInputs,exactExpressions,positiveNormGraph:{nodes:G.nodes,coefficientNorms,residualNormNode:residualNorm,sharpConstantNode:sharpC0,derivativeScaleNode:derivativeScale},derivativeConstants,
    analyticDomain:{input:'|X|<R=3/Lambda; dist(eta,[-1,1])<rho0=delta/8',residual:'|X|<=R/2; dist(eta,[-1,1])<=rho0/2',physicalDerivativeCompact:'0<=X<=R/8; eta in [-1,1]',fieldNorm:'M=1+B+6Q+exp(9*C1^2*R/(2*Delta))',sourceSolution:'Unique actual order-one Picard solution of (5.7), not a finite polynomial substituted for that solution.'},
    budgetRules:{derivativeJetConvention:'Taylor coefficient of the local displacement; a derivative multiplies by its order and reduces available degree.',atom:'M*(2/R)^i*(2/rho0)^j',inverseL:'2*(2/rho0)^j, independent of X',radialAverage:'Same M bound, using integral_0^1 U(tX,eta) dt.',f1OverX:'M/R by Schwarz and the exact zero axis datum.',operatorParameterAbsUpper:'4 (all exact source a retained by the residual producer)',scalarResidualMajorant:'Bres=1+sum of eight executed coefficient bounds',cartesianConversion:'sqrt(2X)e_theta and sqrt(X/2)e_r are Cartesian linear coordinates; no singular 1/r estimate is used.',derivativeBudget:'Each Cartesian spacetime derivative costs at most 32*(m+2)*Dspace on nested polydiscs, Dspace=1+32/sqrt(R)+8/rho0.',physicalLoss:'3/2+2h+m <= 2+m since actual 0<h<1/4.'},
    physicalDerivativeProof:{cartesianSimilarityCoordinates:'s_i=x_i/sqrt(q), X=(s_1^2+s_2^2)/2',sourceCoordinateEquations:'tau=q*(1-eta^2), z=q^D*eta, L=1-2*h*eta^2',timeOperator:'partial_t(q^a*f)=q^(a-1)*L^-1*(-a*f+(s dot grad_s f)/2+D*eta*f_eta)',axialOperator:'partial_z(q^a*f)=q^(a-D)*L^-1*(2*eta*(a*f-(s dot grad_s f)/2)+(1-eta^2)*f_eta)',transverseOperator:'partial_x_i(q^a*f)=q^(a-1/2)*partial_s_i f',complexPolydisc:{center:'real X<=R/8, eta in [-1,1]',cartesianRadius:'sqrt(R)/32 per s_i',etaRadius:'rho0/4',radialImageUpper:'1225*R/8192 < R/2, using sqrt(2)<3/2',linearCartesianFactorUpper:'17*sqrt(R)/32 < 1',inverseLUpper:'2, because |eta|<=2 and actual 8*h<1/2'},nestedLoss:'Use m+1 equal radius steps. Cartesian derivative <=(m+1)*Dspace; eta derivative <=(m+1)*Dspace/2.',operatorNormUpper:{time:'8*(m+2)*Dspace',axial:'26*(m+2)*Dspace',transverse:'(m+1)*Dspace',common:'32*(m+2)*Dspace'},qExponentAbsUpperBeforeEachDerivative:'m+2',eachDerivativeQLossUpper:'1 (exact losses are 1, D, 1/2)',baseCartesianScalarSummandsUpper:8},
    scope:{actualSourceNormConstantsComputed:true,finiteN:[0,1],fullSourceEtaIntervalCovered:true,etaDomain:['-1','1'],entireRealEtaLineCovered:false,userSuppliedNormsAccepted:false,decimalConstantsMaterialized:false,allOrdersComplete:false,wholeProfileResidualComplete:false,formalKernelProof:false}};
}

/** Only an arithmetic audit of the positive expression DAG. The supplied
 * ordinary-size values cannot create or replace an actual source receipt. */
export function evaluateResidualNormAudit(graph,values){
  if(graph?.schema!=='MathScope.ActualResidualOrderBounds/1')throw Error('Expected a source-bound residual norm graph.');
  const out=[];
  for(const n of graph.positiveNormGraph.nodes){let v;const a=n.args;
    if(n.op==='rational')v=Number(a[0])/Number(a[1]);
    else if(n.op==='source_expression'){v=values[a[0]];if(!(v>0&&Number.isFinite(v)))throw Error('Missing finite positive audit value '+a[0]);}
    else if(n.op==='add')v=out[a[0]]+out[a[1]];
    else if(n.op==='multiply')v=out[a[0]]*out[a[1]];
    else if(n.op==='inverse_positive')v=1/out[a[0]];
    else if(n.op==='sqrt_positive')v=Math.sqrt(out[a[0]]);
    else throw Error('Unknown norm node.');
    if(!Number.isFinite(v)||v<0)throw Error('Audit norm overflow.');out.push(v);
  }
  return {scope:'UNIVERSAL_POSITIVE_EXPRESSION_ARITHMETIC_ONLY',actualSourceCertificate:false,values:out};
}
