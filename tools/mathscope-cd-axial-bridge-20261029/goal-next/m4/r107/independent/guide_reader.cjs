const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFile, writeFile } = require('node:fs/promises');
const { withCandidate } = require('./browser.cjs');

const [candidate, guide, output] = process.argv.slice(2);
assert(candidate && guide && output);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const near = (value, expected, tolerance=1e-9) => {
  assert(Number.isFinite(Number(value)) && Math.abs(Number(value)-expected)<=tolerance,
    'Observed '+value+', expected '+expected+' ± '+tolerance);
};
const ratio = value => {
  if (value && typeof value==='object') return Number(value.numerator) / Number(value.denominator);
  const terms=String(value).split('/').map(Number);
  return terms[0] / (terms[1] ?? 1);
};

async function independentRead(page, bytes, errors) {
  const traces=[];
  const r1=key=>page.locator('[data-r1="'+key+'"]');
  const inspect=async()=>JSON.parse(await r1('inspect').innerText());
  await page.locator('#ms-m4-launcher').click({timeout:120000});
  async function chooseRow(index) {
    const select=r1('rows').getByRole('button').nth(index);
    if (await select.count()) await select.click();
    else await r1('chart').locator('[data-index]').nth(index).click();
    return inspect();
  }
  async function experiment(label, edit=()=>{}, row=null) {
    const options=await r1('fixture').locator('option').allTextContents();
    assert(options.includes(label), JSON.stringify(options));
    await r1('fixture').selectOption({label});
    if (!await r1('input').isVisible()) await page.getByText(/실제 입력 · 변경 시/).click();
    const request=JSON.parse(await r1('input').inputValue());
    edit(request);
    await r1('input').fill(JSON.stringify(request, null, 2));
    await r1('apply').click();
    const before=await inspect();
    await r1('run').click();
    await page.waitForFunction(old=>{
      try {
        const value=JSON.parse(document.querySelector('[data-r1="inspect"]').textContent);
        return value.jobId && value.jobId!==old && ['COMPLETED','PARTIAL'].includes(value.state);
      } catch { return false; }
    },before.jobId??null,{timeout:120000});
    const selected=row===null?await inspect():await chooseRow(row);
    const [download]=await Promise.all([page.waitForEvent('download'),r1('export').click()]);
    const saved=JSON.parse(await readFile(await download.path(),'utf8'));
    const bundle=saved.bundle;
    assert(bundle?.result && bundle?.request);
    assert.match(bundle.inputHash,/^[0-9a-f]{64}$/);
    assert.match(bundle.mathematicalHash,/^[0-9a-f]{64}$/);
    assert.equal(selected.inputHash,bundle.inputHash);
    assert.equal(selected.resultHash,bundle.mathematicalHash);
    traces.push({label,request:bundle.request,inputHash:bundle.inputHash,mathematicalHash:bundle.mathematicalHash,
      workerSHA256:selected.sourceWorkerSHA256,jobId:selected.jobId});
    return {result:bundle.result,selected};
  }
  const p1='P¹ / F₃';
  const p1runs=[];
  for (const [p,N,count] of [['3',4,'4'],['3',8,'4'],['5',8,'6']]) {
    const {result}=await experiment(p1,r=>{r.input.p=p;r.input.m=1;r.precision.N=N;});
    assert.equal(result.results.pointCount,count);
    assert.equal(result.precisionLedger.requested.N,N);
    const positive=result.results.cohomology.filter(row=>row.rank>0);
    assert.deepEqual(positive.map(row=>row.coefficientRing),['Z_'+p,'Z_'+p]);
    assert.deepEqual(positive.map(row=>row.frobeniusEigenvalue),['1',p]);
    assert(result.scope.comparison);
    p1runs.push({p,N,count,frobenius:positive.map(row=>row.frobeniusEigenvalue),comparison:result.scope.comparison});
  }

  const {result:elliptic}=await experiment('E: y²=x³−x / F₅',r=>{r.input.p='5';r.input.m=1;r.precision.N=4;});
  const E=elliptic.results;
  let direct=1;
  for(let x=0;x<5;x++)for(let y=0;y<5;y++)if((y*y-x*x*x+x)%5===0)direct++;
  assert.equal(direct,8);
  assert.equal(E.primeField.affinePoints.length,direct-1);
  assert.equal(E.reduction.status,'GOOD');
  assert.equal(E.reduction.certificate.residue,'4');
  assert.equal(E.aP,'-2');
  assert.deepEqual(E.characteristicPolynomial.coefficients,['5','2','1']);
  assert.deepEqual(E.localZeta.ellipticL.denominator,['1','2','5']);
  const prism=await experiment('Perfect prism → de Rham 비교',undefined,0);
  assert.equal(prism.selected.sampleTrace.comparisonMap.coefficientMap,'A_inf --phi--> A_inf --theta--> O_K');
  assert(prism.result.scope);

  const deltas=[];
  for (const [d,n,probe,rho,length,count,density] of [
    [1,3,[.2,-.3,.4,.1],1,1.2,27,16.6691032635],
    [2,3,[.1,-.15,.2,.05],.5,.6,27,266.7056522162],
    [2,5,[.1,-.15,.2,.05],.5,.6,125,266.7056522162],
  ]) {
    const {result,selected}=await experiment('Δ 상태족 / 같은 생성 규칙',r=>{
      r.input.family.delta=d;r.input.observation.samplesPerAxis=n;r.input.probe=probe;
    },d-1);
    near(selected.sampleTrace.selected.rho,rho);
    near(result.fieldSpec.perturbation.length,length);
    assert.equal(result.visualization.points.length,count);
    near(selected.rawValue,density);
    assert(result.proofBoundary.continuumQuantumYM);
    deltas.push({d,n,rho,length,count,density:selected.rawValue,physicalFieldHash:result.hashes.physicalField,
      open:result.proofBoundary.continuumQuantumYM});
  }
  assert.equal(deltas[1].physicalFieldHash,deltas[2].physicalFieldHash);

  const nsHeat=[];
  for (const [radialCount,expected] of [[3,48],[6,96]]) {
    const {result}=await experiment('Heat 외곽 r>0',r=>{r.input.radialCount=radialCount;});
    assert.equal(result.points.length,expected);
    assert.equal(result.domain.excludeAxis,true);
    nsHeat.push({radialCount,count:result.points.length});
  }
  const nsTail=[];
  for (const [degree,estimate] of [[8,9.1239e-16],[16,2.0451e-31]]) {
    const {result}=await experiment('국소 축 해 / 정확 tail',r=>{r.input.tailDegree=degree;});
    const row=result.tails.rows[1];
    assert.equal(row.Y,'41/160');
    near(ratio(row.phiTailUpper),estimate,estimate*.001);
    assert.equal(result.inputModel.pressure.completedOutgoingPressure,false);
    nsTail.push({degree,Y:row.Y,phiTailUpper:row.phiTailUpper});
  }
  assert(ratio(nsTail[1].phiTailUpper)<ratio(nsTail[0].phiTailUpper));
  const taylor=await experiment('Taylor–Green 기준 PDE');
  near(taylor.result.meanEnergy,.1169166067524773);
  near(taylor.result.meanDissipation,.4676664270099092);
  near(taylor.result.energyDerivative,-.4676664270099092);

  const dialog=page.locator('#ms-m4-dialog');
  await dialog.getByRole('button',{name:'닫기',exact:true}).click();
  await page.locator('[data-view-target=research-objects]').click();
  await page.locator('#m1-tab-ns').click();
  await page.locator('#m1-example').selectOption({label:'FD·FFT·고정밀·음성 대조군'});
  if (await page.locator('#m1-load').isVisible()) await page.locator('#m1-load').click();
  const request=JSON.parse(await page.locator('#m1-input').inputValue());
  assert.equal(request.kind,'ns.validate');
  await page.locator('#m1-run').click();
  await page.waitForFunction(()=>{
    try {
      const value=JSON.parse(document.getElementById('m1-result-json').textContent);
      return Array.isArray(value.result?.checks)&&value.result.checks.some(c=>c.name==='nonlinear_axis_recurrence_order_refinement');
    } catch { return false; }
  },null,{timeout:150000});
  const m1Job=JSON.parse(await page.locator('#m1-result-json').textContent());
  const observed=m1Job.result;
  const wanted=[
    'nonlinear_axis_recurrence_order_refinement','actual_core_Cartesian_divergence_FD',
    'taylor_green_fd_nu_1','negative_pressure_sign_nu_1',
  ];
  const nsResidual=Object.fromEntries(wanted.map(id=>[id,observed.checks.find(c=>c.name===id)]));
  for (const name of wanted) assert(nsResidual[name],name);
  near(nsResidual.actual_core_Cartesian_divergence_FD.fullNSResidual,.99533,1e-5);
  near(nsResidual.negative_pressure_sign_nu_1.observedResidual,.17036,1e-5);
  assert.equal(nsResidual.nonlinear_axis_recurrence_order_refinement.certifiedNonlinearTail,false);
  assert.equal(observed.fullCertifiedProfile ?? observed.scope?.fullCertifiedProfile,false);
  near(Math.abs(nsResidual.nonlinear_axis_recurrence_order_refinement.coarse.angular),4.1879e-4,1e-9);
  near(Math.abs(nsResidual.nonlinear_axis_recurrence_order_refinement.refined.angular),7.3229e-11,1e-12);
  assert(nsResidual.taylor_green_fd_nu_1.value.normalizedResidual < 1e-9);
  assert(nsResidual.taylor_green_fd_nu_1.refinedValue.normalizedResidual < 1e-9);
  await page.locator('#m1-export').click();
  const m1Bundle=JSON.parse(await page.locator('#m1-export-content').inputValue());
  const m1Receipt=m1Bundle.bundle ?? m1Bundle;
  assert.equal(m1Receipt.request.kind,'ns.validate');
  for (const key of ['inputHash','mathematicalHash']) assert.match(m1Receipt[key],/^[0-9a-f]{64}$/);
  const m1Worker=m1Receipt.environment?.workerSha256 ?? m1Receipt.workerSha256;
  assert.match(m1Worker,/^[0-9a-f]{64}$/);
  traces.push({label:'FD·FFT·고정밀·음성 대조군',request:m1Receipt.request,inputHash:m1Receipt.inputHash,
    mathematicalHash:m1Receipt.mathematicalHash,workerSHA256:m1Worker,jobId:m1Job.id});

  const reader={schema:'MathScope.M4.R107.IndependentGuideReadback/1',readGuideSHA256:sha(await readFile(guide)),
    candidateSHA256:sha(bytes),p1:p1runs,elliptic:{directPointCount:direct,aP:E.aP,localFactor:E.localZeta.ellipticL.denominator},
    prism:{map:prism.selected.sampleTrace.comparisonMap.coefficientMap,scope:prism.result.scope},
    deltas,nsHeat,nsTail,taylor:{meanEnergy:taylor.result.meanEnergy,meanDissipation:taylor.result.meanDissipation,
      energyDerivative:taylor.result.energyDerivative},nsResidual,jobReceipts:traces,errors,
    scope:'Independent reader used the written guide and the isolated browser candidate.'};
  assert.deepEqual(errors,[]);
  await writeFile(output,JSON.stringify(reader,null,2)+'\n','utf8');
  console.log(JSON.stringify({independentRoutes:4,workerJobs:traces.length,candidateSHA256:reader.candidateSHA256}));
}
withCandidate(candidate,independentRead).catch(error=>{console.error(error);process.exitCode=1;});
