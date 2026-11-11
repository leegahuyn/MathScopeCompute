import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve, sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const [output, sourceTree] = process.argv.slice(2);
assert.ok(output && sourceTree, 'Supply output JSON and the original research-ide directory.');
const originalSource = pathToFileURL(resolve(sourceTree) + sep);
const source = name => import(new URL('mathscope-m2/navier/' + name, originalSource));
const expectedSource = {
  'mathscope-m2/navier/actual-background-physical-seminorms.mjs':'d3713e0a3f1cd17404e2afb23da20c4b32e9e840445eed53ce2849ecd200d240',
  'mathscope-m2/navier/actual-pressure-stress-all-order-tail.mjs':'3748cac5658e485d3c7c59a7aef4bb80a3ca6ba50de934bd3cacc5431d3ff66a',
  'mathscope-m2/navier/actual-common-admissible-family.mjs':'7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75',
  'mathscope-m2/navier/actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'mathscope-m2/navier/actual-continuation-exact-support.mjs':'0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
  'mathscope-m3/navier/global-source-index.mjs':'a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f',
  'mathscope-m3/navier/source-global-current.mjs':'93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760',
  'mathscope-m3/navier/source-global-band.mjs':'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
};
for (const [path,sha] of Object.entries(expectedSource)) {
  const bytes = await readFile(new URL(path,originalSource));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),sha,path);
}
const [
  {prepareActualOrderInduction}, {actualPositiveStressFTC}, {actualSupportOrderProof},
  {rectangularSourceFTC}, {sourceNormalizedCutoffWeights}
] = await Promise.all([
  source('actual-residual-order-induction-source.mjs'),
  source('actual-background-residual-bridge.mjs'),
  source('actual-continuation-exact-support.mjs'),
  source('actual-background-physical-seminorms.mjs'),
  source('actual-residual-order-induction-kernels.mjs')
]);
const positiveReceiptURL = new URL('../axial-alln/order-three.json',import.meta.url);
const positiveBytes = await readFile(positiveReceiptURL);
const positiveSHA = createHash('sha256').update(positiveBytes).digest('hex');
assert.equal(positiveSHA,'26bbd0d14f0218dfe0a6be2494845e6de86bb8cb23f782bccb695ba2abfee2c7');
const positive = JSON.parse(positiveBytes).certificate;
const prepared = prepareActualOrderInduction({order:3,maxNodes:2200000});
const {G,records,bootstrap} = prepared;
const {X,eta} = bootstrap.constants;
const {Xminus,Xplus,Xb} = bootstrap.orderOne;
const support = actualSupportOrderProof(bootstrap.completedOrderOne);
const stress = actualPositiveStressFTC(prepared);
assert.ok(support.pass && stress.pass);
assert.deepEqual([Xminus,Xplus,Xb],[28814,28824,28826]);
const q=(n,d=1)=>G.q(n,d);
const Xa=G.parameter('Xa'),t1=G.parameter('t1'),h=G.parameter('h');
const zeta=G.exp(G.neg(G.add(G.div(G.pow(t1,2),G.pow(G.log(G.div(X,Xa)),2)),
  G.div(q(4),G.pow(G.log(G.div(Xb,X)),2)))));
const box={coordinates:[X,eta],lower:[Xminus,q(-1)],upper:[Xplus,G.one]};
const outputRows=[];
let literalIntegrals=0;
function derivative(root,r,s) {
  for (let i=0;i<r;i++) root=G.derivative(root,X);
  for (let i=0;i<s;i++) root=G.derivative(root,eta);
  return root;
}
function checkFaces(receipt) {
  assert.deepEqual(receipt.lower,box.lower);
  assert.deepEqual(receipt.upper,box.upper);
  assert.deepEqual(receipt.faces.map(f=>f.mask),[0,1,2,3]);
  const allowed=new Map([[Xminus,Xplus],[q(-1),G.one]]);
  for (const face of receipt.faces) {
    assert.equal(G.freeCoordinates(face.upperBound).size,0);
    let value=face.upperBound;
    const used=[];
    while(G.nodes[value].op==='definite_integral') {
      const [integrand,binder,left,right]=G.nodes[value].args;
      assert.equal(allowed.get(left),right);
      assert.equal(G.nodes[binder].op,'coordinate');
      assert.notEqual(binder,X);
      assert.notEqual(binder,eta);
      used.push([left,right]);
      literalIntegrals++;
      value=integrand;
    }
    assert.ok(used.length<=face.selectedCoordinates.length);
    const kind=G.nodes[value].op;
    if(kind==='multiply') {
      assert.ok(used.length<face.selectedCoordinates.length);
      assert.ok(G.nodes[value].args.includes(q(2)));
      assert.ok(G.nodes[value].args.some(id=>G.nodes[id].op==='sqrt_positive'));
    } else if(kind==='rational') {
      assert.ok(value===G.one || value===q(2),JSON.stringify({face,value}));
    } else assert.equal(kind,'sqrt_positive');
  }
  assert.equal(G.freeCoordinates(receipt.bound).size,0);
}
for (const n of [2,3]) {
  const record=records[n],proof=positive.stressRows.find(row=>row.order===n && row.component==='z');
  assert.ok(proof.pass && proof.allFixedDerivativeJetsMatch);
  assert.equal(proof.actualStress,record.stress.Tz);
  assert.deepEqual(record.stress.compactSupport,[Xminus,Xplus]);
  const sourceRoot=record.stress.Tz, quotient=G.div(sourceRoot,zeta);
  const jets=[];
  const cutoff=sourceNormalizedCutoffWeights({order:n,derivativeOrder:n});
  assert.equal(cutoff.pass,true);
  const W=cutoff.weights.map(w=>G.add(...w.polynomialInSourceH.map((c,k)=>G.mul(q(BigInt(c)),G.pow(h,k)))));
  for (let r=0;r<=n;r++) for(let s=0;r+s<=n;s++) {
    const quotientJet=derivative(quotient,r,s),directJet=G.div(derivative(sourceRoot,r,s),zeta);
    const qr=rectangularSourceFTC(G,{body:quotientJet,...box});
    const dr=rectangularSourceFTC(G,{body:directJet,...box});
    checkFaces(qr);
    checkFaces(dr);
    jets.push({r,s,quotientJet,directJet,quotientBound:qr.bound,directBound:dr.bound,
      quotientFaces:qr.faces.map(row=>row.upperBound),directFaces:dr.faces.map(row=>row.upperBound)});
  }
  const bounds=[];
  for(let m=0;m<=n;m++) {
    const qRows=[],dRows=[];
    for(const j of jets) for(let e=0;e+j.r+j.s<=m;e++) {
      qRows.push(G.mul(W[e],j.quotientBound));
      dRows.push(G.mul(W[e],j.directBound));
    }
    const quotientBound=G.maximum(G.one,...qRows),directBound=G.maximum(G.one,...dRows);
    assert.equal(G.freeCoordinates(quotientBound).size,0);
    assert.equal(G.freeCoordinates(directBound).size,0);
    bounds.push({m,quotientBound,directBound,requiredLogAxialOnly:G.div(
      G.add(G.mul(q(n),G.log(q(2))),G.log(G.maximum(quotientBound,directBound))),G.mul(q(n),h))});
  }
  outputRows.push({n,sourceRoot,quotient,zeta,jets,bounds});
  console.log('Actual axial weighted quotient and direct-weight FTC through derivative order '+n);
}
await writeFile(output,JSON.stringify({schema:'MathScope.OriginalHigherAxialWeightedFiniteFaces/1',
  sourceCommit:'f8cb4034e86d7b669d52a6f2248aebba156b51b5',sourceFiles:expectedSource,
  positiveSHA,box,zeta,literalIntegrals,nodeCount:G.nodes.length,rows:outputRows,
  scope:'Exact original axial FTC ingredients in the higher-order selector only. No common selector or general-N physical export is claimed.'},null,2)+'\n');
console.log('PASS: original higher axial weighted FTC row domains at n=2,3.');

