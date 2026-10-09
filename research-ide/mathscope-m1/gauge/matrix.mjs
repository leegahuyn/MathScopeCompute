/** Small dense complex matrices. No DOM, network, ambient randomness or eval. */
export const matrix=(n)=>({n,re:new Float64Array(n*n),im:new Float64Array(n*n)});
export function identity(n){const a=matrix(n);for(let i=0;i<n;i++)a.re[i*n+i]=1;return a;}
export const clone=a=>({n:a.n,re:a.re.slice(),im:a.im.slice()});
export function rationalNumber(s){if(typeof s==='number')return s;const [a,b]=s.split('/').map(Number);return b===undefined?a:a/b;}
export function fromSparse(s){const a=matrix(s.n);for(const [i,j,re,im] of s.entries){a.re[i*s.n+j]=rationalNumber(re);a.im[i*s.n+j]=rationalNumber(im);}return a;}
export function add(a,b){const c=clone(a);return addTo(c,b);}
export function addTo(a,b,s=1){if(a.n!==b.n)throw new Error('MATRIX_DIMENSION_MISMATCH');for(let k=0;k<a.re.length;k++){a.re[k]+=s*b.re[k];a.im[k]+=s*b.im[k];}return a;}
export function scale(a,s,t=0){const b=matrix(a.n);for(let k=0;k<a.re.length;k++){b.re[k]=a.re[k]*s-a.im[k]*t;b.im[k]=a.re[k]*t+a.im[k]*s;}return b;}
export function multiply(a,b){if(a.n!==b.n)throw new Error('MATRIX_DIMENSION_MISMATCH');const n=a.n,c=matrix(n);for(let i=0;i<n;i++)for(let k=0;k<n;k++){const x=i*n+k,ar=a.re[x],ai=a.im[x];if(ar===0&&ai===0)continue;for(let j=0;j<n;j++){const y=k*n+j,z=i*n+j,br=b.re[y],bi=b.im[y];c.re[z]+=ar*br-ai*bi;c.im[z]+=ar*bi+ai*br;}}return c;}
export const commutator=(a,b)=>addTo(multiply(a,b),multiply(b,a),-1);
export function dagger(a){const b=matrix(a.n);for(let i=0;i<a.n;i++)for(let j=0;j<a.n;j++){b.re[i*a.n+j]=a.re[j*a.n+i];b.im[i*a.n+j]=-a.im[j*a.n+i];}return b;}
export function transpose(a){const b=matrix(a.n);for(let i=0;i<a.n;i++)for(let j=0;j<a.n;j++){b.re[i*a.n+j]=a.re[j*a.n+i];b.im[i*a.n+j]=a.im[j*a.n+i];}return b;}
export function trace(a){let re=0,im=0;for(let i=0;i<a.n;i++){re+=a.re[i*a.n+i];im+=a.im[i*a.n+i];}return {re,im};}
export function traceProduct(a,b){let re=0,im=0;for(let i=0;i<a.n;i++)for(let j=0;j<a.n;j++){const x=i*a.n+j,y=j*a.n+i;re+=a.re[x]*b.re[y]-a.im[x]*b.im[y];im+=a.re[x]*b.im[y]+a.im[x]*b.re[y];}return {re,im};}
export function frobenius(a){let s=0;for(let k=0;k<a.re.length;k++)s+=a.re[k]**2+a.im[k]**2;return Math.sqrt(s);}
export const distance=(a,b)=>frobenius(addTo(clone(a),b,-1));
export const relativeDistance=(a,b)=>distance(a,b)/Math.max(1,frobenius(a),frobenius(b));
export function norm1(a){let max=0;for(let j=0;j<a.n;j++){let s=0;for(let i=0;i<a.n;i++)s+=Math.hypot(a.re[i*a.n+j],a.im[i*a.n+j]);max=Math.max(max,s);}return max;}
export function linearCombination(basis,coeff){const a=matrix(basis[0].n);for(let i=0;i<basis.length;i++)if(coeff[i])addTo(a,basis[i],coeff[i]);return a;}
export function exponential(a){const mag=norm1(a);if(!Number.isFinite(mag)||mag>1e5)throw new Error('EXPONENT_NORM_OUT_OF_BOUNDS');const k=Math.max(0,Math.ceil(Math.log2(Math.max(1,mag))));const b=scale(a,2**(-k));let term=identity(a.n),sum=identity(a.n);for(let i=1;i<=28;i++){term=scale(multiply(term,b),1/i);addTo(sum,term);if(frobenius(term)<2e-17)break;}for(let j=0;j<k;j++)sum=multiply(sum,sum);return sum;}
export const conjugate=(u,a)=>multiply(multiply(u,a),dagger(u));
export function determinant(a){const b=clone(a),n=a.n;let dr=1,di=0;for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.hypot(b.re[i*n+k],b.im[i*n+k])>Math.hypot(b.re[p*n+k],b.im[p*n+k]))p=i;if(Math.hypot(b.re[p*n+k],b.im[p*n+k])<1e-30)return {re:0,im:0};if(p!==k){for(let j=k;j<n;j++){const x=k*n+j,y=p*n+j;[b.re[x],b.re[y]]=[b.re[y],b.re[x]];[b.im[x],b.im[y]]=[b.im[y],b.im[x]];}dr=-dr;di=-di;}const pr=b.re[k*n+k],pi=b.im[k*n+k],[nr,ni]=[dr*pr-di*pi,dr*pi+di*pr];dr=nr;di=ni;for(let i=k+1;i<n;i++){const x=i*n+k,den=pr*pr+pi*pi,fr=(b.re[x]*pr+b.im[x]*pi)/den,fi=(b.im[x]*pr-b.re[x]*pi)/den;for(let j=k+1;j<n;j++){const y=i*n+j,z=k*n+j;b.re[y]-=fr*b.re[z]-fi*b.im[z];b.im[y]-=fr*b.im[z]+fi*b.re[z];}}}return {re:dr,im:di};}
export function unitaryResidual(u){return distance(multiply(dagger(u),u),identity(u.n));}
export function jsonMatrix(a){return {n:a.n,re:Array.from(a.re),im:Array.from(a.im)};}
export function inverseReal(a){const n=a.length,b=a.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>+(i===j))]);for(let j=0;j<n;j++){let p=j;for(let i=j+1;i<n;i++)if(Math.abs(b[i][j])>Math.abs(b[p][j]))p=i;if(Math.abs(b[p][j])<1e-15)throw new Error('SINGULAR_GRAM');[b[p],b[j]]=[b[j],b[p]];const v=b[j][j];for(let k=0;k<2*n;k++)b[j][k]/=v;for(let i=0;i<n;i++)if(i!==j){const v=b[i][j];for(let k=0;k<2*n;k++)b[i][k]-=v*b[j][k];}}return b.map(r=>r.slice(n));}
