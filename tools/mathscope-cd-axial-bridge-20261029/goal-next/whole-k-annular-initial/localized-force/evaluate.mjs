import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [goalPath, runtimeTree, workDir] = process.argv.slice(2);assert(goalPath&&runtimeTree&&workDir);
const goal=resolve(goalPath);
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
async function pinned(p,h){const b=await readFile(p);assert.equal(sha(b),h,p);return JSON.parse(b)}
const p=await pinned(resolve(workDir,'original-67plus13-polynomials.json'),'1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7');
assert.equal(p.schema,'MathScope.Annular.ExactOriginal67Plus13LocalizationPolynomial/1');
const initial=await pinned(resolve(goal,'whole-k-annular-initial/numerical/stage-zero-complete-numerical.json'),'9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34');
const fixed=await pinned(resolve(goal,'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json'),'9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c');
const thresholds=await pinned(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const geom=await pinned(resolve(goal,'whole-k-exterior/whole-k-exterior-cell.json'),'254868bebdad829d656c06cfa903a5b5cdf288d35cf5ec9bdf52461c3a7e008b');
const cutoff=await pinned(resolve(goal,'whole-k-core-force/annular-slow-force-energy.json'),'c4f86049b4f20a63443bd610b76313926717576abca9288ae1f9277b3ae4aa37');
assert.deepEqual(cutoff.geometry.factors,{C_tau:'5/tau0',C_z:'20/z0',C_zz:'692/z0^2',C_zzz:'69472/z0^3',C_z_tau:'100/(z0*tau0)',R:'Rstar*sqrt(tau0)','I_field@orders':'exact absolute radius in the pinned scalarIntervals'});
assert.deepEqual(geom.geometry.radialProof,['q<qBig/16','4*Xb<=Rstar^2','qBig*Rstar^2<2/3']);
assert.equal(initial.status,'VERIFIED_ALL_67_ORIGINAL_INITIALIZED_STAGE_ZERO_NUMERICAL_INTERVALS');assert.equal(Object.keys(initial.atoms).length,67);
const {sourceArithmetic}=await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const {N:D}=await sourceArithmetic(runtimeTree,thresholds.sourcePins,'coarse-upper');
const zero={rational:'0'};let rounds=0;
function roundEndpoint(e,up){if(Object.hasOwn(e,'exp'))return {exp:roundEndpoint(e.exp,up)};if(Object.hasOwn(e,'neg'))return {neg:roundEndpoint(e.neg,!up)};const [signed,den=1n]=e.rational.split('/').map(BigInt);assert(den>0n);if(signed===0n)return zero;const mag=signed<0n?-signed:signed;const diff=mag.toString(2).length-den.toString(2).length;const ceil=signed>0n?up:!up;if(Math.abs(diff)>2048){const candidate=1n<<BigInt(Math.abs(diff)),below=diff>=0?mag<den*candidate:mag*candidate<den;const k=BigInt(diff-Number(below));const arg=ceil?(k+1n>0n?String(k+1n):String(k+1n)+'/2'):(k>0n?String(k)+'/2':String(k));const bound={exp:{rational:arg}};return signed<0n?{neg:bound}:bound;}const shift=diff-128,step=1n<<BigInt(Math.abs(shift)),num=shift<0?mag*step:mag,div=shift>0?den*step:den;let m=num/div;if(ceil&&num%div)m++;if(signed<0n)m=-m;return {rational:shift<0?`${m}/${step}`:String(m*step)};}
function outward(x){const b=D.toClosed(x);rounds++;return D.fromClosed({lower:roundEndpoint(b.lower,false),upper:roundEndpoint(b.upper,true)});}
const N={...D};for(const m of ['point','fromClosed','add','mul','max','inverse','exp','sqrt'])N[m]=(...args)=>outward(D[m](...args));
N.pow=(b,n)=>{assert(Number.isSafeInteger(n)&&n>=0);let r=N.one();while(n){if(n%2)r=N.mul(r,b);n=Math.floor(n/2);if(n)b=N.mul(b,b);}return r;};
const ell=N.fromClosed(fixed.hostedOriginal['617432']);const T=N.exp(N.add(ell,N.point('15'))); // 1/tau0=2^(ell+15) <= exp(ell+15), and 1/z0 <= 1/tau0.
const cBounds={'C@0,0,0':[1,0],'C@0,0,1':[5,1],'C@0,1,0':[20,1],'C@0,1,1':[100,2],'C@0,2,0':[692,2],'C@0,3,0':[69472,3]};
const inputs=p.variables.map((name,i)=>{if(i<2)return N.point('1');if(name.startsWith('C@')){if(!(name in cBounds))return N.zero();let [a,b]=cBounds[name];return N.mul(N.point(String(a)),N.pow(T,b));}const atom=initial.atoms[name];assert(atom,name);assert.deepEqual(atom.lower,{neg:atom.upper},name);return N.fromClosed({lower:zero,upper:atom.upper});});assert.equal(inputs.length,82);
function absq(q){return q.startsWith('-')?q.slice(1):q}
let terms=0;function upper(rows){let sum=N.zero();for(const term of rows){let v=N.point(absq(term.coefficient));for(const [idx,exp] of term.powers)v=N.mul(v,N.pow(inputs[idx],exp));sum=N.add(sum,v);terms++;}return N.toClosed(sum).upper;}
const result={velocity:p.outputs.velocity.map(upper),gradient:p.outputs.velocity_gradient.map(row=>row.map(upper)),pressure:upper(p.outputs.localized_pressure),force:p.outputs.force.map(upper)};
const receipt={schema:'MathScope.N7.InitializedAnnularLocalizedForceMajorants/1',status:'INITIALIZED_ANNULAR_ABSOLUTE_INTERVALS_FROM_SOURCE_OPERANDS',scope:{field:'initialized stage zero only',chart:initial.scope.chart,cutoff:'original radial plateau on chart; axial/time transitions retained',finalJetCount:'0/67',N706:'OPEN',N805:'OPEN',release:'HOLD'},source:{initialSHA256:'9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34',polynomialSHA256:sha(await readFile(resolve(workDir,'original-67plus13-polynomials.json'))),cutoffSourceSHA256:'c4f86049b4f20a63443bd610b76313926717576abca9288ae1f9277b3ae4aa37',plateauSourceSHA256:'254868bebdad829d656c06cfa903a5b5cdf288d35cf5ec9bdf52461c3a7e008b',fixedSHA256:'9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'},proof:{radial:'2q Xb < qBig Rstar^2/32 < 1/48, so 2r^2<1/24<1/2',xY:'absolute x,y <=1 on the annulus',timeScale:'tau0^-1=2^(ell+15)<=exp(ell+15); z0^-1<=tau0^-1 for 0<tau0<1 and 0<D<1',cutoffAbsoluteBounds:{C:'1',C_tau:'5 T',C_z:'20 T',C_zz:'692 T^2',C_zzz:'69472 T^3',C_z_tau:'100 T^2',radialDerivatives:'0'},triangleInequality:'absolute each exact polynomial term; no sign cancellation',terms,rounds},symmetricAbsoluteUpperEndpoints:result,arithmetic:D.report()};
await writeFile(resolve(workDir,'initialized-annular-localized-force.json'),JSON.stringify(receipt,null,2)+'\n');console.log('PASS',terms,'exact stencil terms; stage-zero scope only');
