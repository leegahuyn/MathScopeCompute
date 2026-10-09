import { GROUP_DATA } from './group-data.mjs';
import * as M from './matrix.mjs';
import { verifyExactTable } from './exact.mjs';
const byId=new Map(GROUP_DATA.map(d=>[d.id,d]));
const cache=new Map();
export class GaugeInputError extends Error {constructor(code,message,path=null){super(message);this.name='GaugeInputError';this.code=code;this.path=path;}}
export function requireCondition(ok,code,message,path){if(!ok)throw new GaugeInputError(code,message,path);}
export function normalizeGroupSpec(spec){
 requireCondition(spec&&typeof spec==='object'&&!Array.isArray(spec),'GROUP_SPEC_REQUIRED','Actual group request needs family, parameter, globalForm and representation.','input.group');
 requireCondition(['SU','SO','Sp','G2'].includes(spec.family),'GROUP_NOT_IMPLEMENTED','Supported constructive adapters: SU(2..6), SO(3,5..8), compact Sp(1..3), compact G2. Spin, F4, E6/E7/E8 and arbitrary quotients have no adapter.','input.group.family');
 requireCondition(Number.isInteger(spec.parameter),'GROUP_PARAMETER_REQUIRED','Group parameter is required; G2 uses parameter 2.','input.group.parameter');
 const id=spec.family==='G2'?'G2':`${spec.family}${spec.parameter}`,data=byId.get(id);
 requireCondition(data&&data.parameter===spec.parameter,'GROUP_BOUNDS','Requested group is outside the certified matrix bounds; SO(4) is excluded because its Lie algebra is not simple.','input.group.parameter');
 requireCondition(spec.globalForm===data.globalForm.form,'GLOBAL_FORM_NOT_IMPLEMENTED',`The actual stored group is ${data.name}, globalForm ${data.globalForm.form}. A cover or quotient is a distinct group and cannot be selected by changing its label.`,'input.group.globalForm');
 const rep=spec.family==='G2'?'REAL_7':'DEFINING';
 requireCondition(spec.representation===rep,'REPRESENTATION_NOT_IMPLEMENTED',`The actual faithful representation for this adapter is ${rep}.`,'input.group.representation');
 if(spec.quotient!==undefined)requireCondition(spec.quotient===null,'CENTRAL_QUOTIENT_NOT_IMPLEMENTED','Nontrivial central quotients require a new character lattice and descended representation; this adapter rejects them.','input.group.quotient');
 return {family:spec.family,parameter:spec.parameter,globalForm:spec.globalForm,representation:rep,quotient:null};
}
export function createGroup(spec){
 const normalized=normalizeGroupSpec(spec),id=normalized.family==='G2'?'G2':`${normalized.family}${normalized.parameter}`;
 if(cache.has(id))return cache.get(id);
 const data=byId.get(id),basis=data.basis.matrices.map(M.fromSparse),embedding=data.embedding.matrixGenerators.map(M.fromSparse),metricTraceFactor=M.rationalNumber(data.metricTraceFactor),gram=data.gram.map(r=>r.map(M.rationalNumber));
 const result={id,data,spec:normalized,basis,embedding,gram,gramInverse:M.inverseReal(gram),metricTraceFactor,dimension:data.dimension,matrixDimension:data.matrixDimension,rank:data.rank,index:M.rationalNumber(data.embedding.index)};
 cache.set(id,result);return result;
}
export function groupDescriptor(g){const d=g.data;return {schema:'MathScope.GaugeGroupSpec/1',id:`gauge-${g.id}`,revision:'m1-1',sourceRefs:[],assumptionRefs:[],name:d.name,compact:true,simple:true,lieAlgebra:{family:d.rootDatum.type,rank:d.rank,dimension:d.dimension,basis:`${d.dimension} exact compact matrices; complete integral Chevalley basis`,bracket:'[X,Y]=XY-YX; full sparse rational structure constants'},globalForm:{...structuredClone(d.globalForm),kernel:'{'+d.globalForm.kernel.join(', ')+'}'},representation:structuredClone(d.representation),invariantInnerProduct:structuredClone(d.invariantInnerProduct)};}
export function detailedDescriptor(g){return {id:g.id,family:g.spec.family,parameter:g.spec.parameter,rank:g.rank,dimension:g.dimension,matrixDimension:g.matrixDimension,globalForm:g.data.globalForm,center:g.data.center,representation:g.data.representation,invariantInnerProduct:g.data.invariantInnerProduct,rootDatum:g.data.rootDatum,basisNames:g.data.basis.names,embedding:g.data.embedding,embeddings:g.data.embeddings,exactDataSha256:g.data.dataSha256,classificationStatus:'THEOREM_REFERENCE',simpleMeaning:'The compact real Lie algebra is simple; a group with nontrivial center is not declared an abstract simple group.'};}
export function selectEmbedding(g,id){const e=g.data.embeddings.find(x=>x.id===id);requireCondition(e,'EMBEDDING_NOT_IMPLEMENTED','No exact supported SU2 homomorphism exists for this embedding ID.');return {...g,embedding:e.matrixGenerators.map(M.fromSparse),index:M.rationalNumber(e.index),selectedEmbedding:e};}
export const inner=(g,a,b)=>-g.metricTraceFactor*M.traceProduct(a,b).re;
export function coordinates(g,x){const rhs=g.basis.map(t=>inner(g,t,x));return g.gramInverse.map(row=>row.reduce((s,v,k)=>s+v*rhs[k],0));}
export function fromCoordinates(g,c){requireCondition(c.length===g.dimension,'COORDINATE_DIMENSION','One real coefficient per compact basis vector is required.');return M.linearCombination(g.basis,c);}
const permSign=(a,b,c)=>a===b||b===c||a===c?0:(a-b)*(b-c)*(a-c)<0?1:-1;
export function phiTensor(g){if(!g.data.octonions)return null;const phi=Array.from({length:7},()=>Array.from({length:7},()=>Array(7).fill(0)));for(const [a,b,c,s] of g.data.octonions.phi)for(const [i,j,k] of [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]])phi[i][j][k]=s*permSign(i,j,k);return phi;}
export function groupElementResidual(g,u){
 const unitarity=M.unitaryResidual(u),det=M.determinant(u),determinant=Math.hypot(det.re-1,det.im);let real=0,symplectic=0,phi=0;
 if(g.spec.family==='SO'||g.spec.family==='G2')real=Math.max(...Array.from(u.im,Math.abs));
 if(g.spec.family==='Sp'){const n=g.spec.parameter,j=M.matrix(2*n);for(let i=0;i<n;i++){j.re[i*2*n+n+i]=1;j.re[(n+i)*2*n+i]=-1;}symplectic=M.distance(M.multiply(M.multiply(M.transpose(u),j),u),j);}
 if(g.spec.family==='G2'){const p=phiTensor(g);for(let i=0;i<7;i++)for(let j=i+1;j<7;j++)for(let k=j+1;k<7;k++){let value=0;for(let a=0;a<7;a++)for(let b=0;b<7;b++)for(let c=0;c<7;c++)if(p[a][b][c])value+=p[a][b][c]*u.re[a*7+i]*u.re[b*7+j]*u.re[c*7+k];phi=Math.max(phi,Math.abs(value-p[i][j][k]));}}
 return {unitarity,determinant,real,symplectic,phi,max:Math.max(unitarity,determinant,real,symplectic,phi)};
}
export function verifyGroup(g,{exact=true,tolerance=1e-10}={}){
 let antiHermitian=0,traceless=0,closure=0,embeddingBracket=0,embeddingGram=0,metric=0;const d=g.dimension;
 const table=new Map();for(const [a,b,k,v] of g.data.structureConstants){const key=`${a}:${b}`;if(!table.has(key))table.set(key,Array(d).fill(0));table.get(key)[k]=M.rationalNumber(v);}
 for(const x of g.basis){antiHermitian=Math.max(antiHermitian,M.frobenius(M.add(x,M.dagger(x))));const t=M.trace(x);traceless=Math.max(traceless,Math.hypot(t.re,t.im));}
 for(let a=0;a<d;a++)for(let b=a+1;b<d;b++)closure=Math.max(closure,M.distance(M.commutator(g.basis[a],g.basis[b]),fromCoordinates(g,table.get(`${a}:${b}`)||Array(d).fill(0))));
 for(let i=0;i<3;i++){embeddingBracket=Math.max(embeddingBracket,M.distance(M.commutator(g.embedding[i],g.embedding[(i+1)%3]),g.embedding[(i+2)%3]));for(let j=0;j<3;j++)embeddingGram=Math.max(embeddingGram,Math.abs(inner(g,g.embedding[i],g.embedding[j])-(i===j?g.index/2:0)));}
 for(let i=0;i<d;i++)for(let j=0;j<d;j++)metric=Math.max(metric,Math.abs(inner(g,g.basis[i],g.basis[j])-g.gram[i][j]));
 const x=fromCoordinates(g,Array.from({length:d},(_,i)=>Math.sin(i+1)/Math.sqrt(d))),u=M.exponential(M.scale(x,0.37));
 const element=groupElementResidual(g,u);const exactCertificate=exact?verifyExactTable(g.data):{ok:null,status:'NOT_REQUESTED'};
 const max=Math.max(antiHermitian,traceless,closure,embeddingBracket,embeddingGram,metric,element.max);
 return {ok:max<=tolerance&&exactCertificate.ok!==false,tolerance,floatingResiduals:{antiHermitian,traceless,closure,embeddingBracket,embeddingGram,metric,exponentialMembership:element,max},exactCertificate,generatorCertificate:g.data.certificate,scope:'The exact finite matrices and their relations are checked. Classification, compact connected global integration and center facts retain THEOREM_REFERENCE status.'};
}
export function availableGroups(){return GROUP_DATA.map(d=>({id:d.id,label:d.name,spec:{family:d.family,parameter:d.parameter,globalForm:d.globalForm.form,representation:d.family==='G2'?'REAL_7':'DEFINING'},dimension:d.dimension,rank:d.rank,matrixDimension:d.matrixDimension}));}
export { GROUP_DATA };
