const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { chromium } = require(process.env.MATHSCOPE_PLAYWRIGHT_PATH || 'playwright');

const root = resolve(process.argv[2]);
const output = resolve(process.argv[3]);
mkdirSync(output, { recursive:true });
const bytes = readFileSync(join(root,'built/candidate.html'));
const manifest = JSON.parse(readFileSync(join(root,'built/manifest.json')));
const walk = JSON.parse(readFileSync(join(root,'walkthrough-steps.json')));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const save = (name,value) => writeFileSync(join(output,name+'.json'),JSON.stringify(value,null,2)+'\n');
assert.equal(sha(bytes),manifest.candidateSHA256);
assert(manifest.reversible && manifest.unrelatedBytesPreserved);

function edit(request, edits) {
  for (const [path,value] of Object.entries(edits)) {
    const keys = path.split('.');
    const leaf = keys.pop();
    const parent = keys.reduce((node,key)=>node[key],request);
    assert(Object.hasOwn(parent,leaf),path);
    parent[leaf]=value;
  }
  return request;
}

async function execute() {
  const browser=await chromium.launch({executablePath:process.env.MATHSCOPE_CHROME_PATH,headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1250,height:950}});
    const failures=[];
    page.on('pageerror',error=>failures.push(error.message));
    const url='http://127.0.0.1:39217/mathscope-r107.html';
    await page.route('**/*',route=>route.request().url()===url
      ?route.fulfill({body:bytes,contentType:'text/html; charset=utf-8'})
      :route.abort());
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
    const control=key=>page.locator('[data-r1="'+key+'"]');
    const drawer=control('input').locator('..').locator('..');
    await page.locator('#ms-m4-launcher').click();
    await drawer.locator('summary').click();
    const receipts=[];
    for (const scenario of walk.workflow) {
      const steps=[];
      for (const entry of scenario.steps) {
        if (entry.m1Example) {
          await page.locator('#ms-m4-dialog [data-close]').click();
          await page.locator('[data-view-target="research-objects"]').click();
          await page.locator('[data-m1-tab="ns"]').click();
          await page.locator('#m1-example').selectOption(entry.m1Example);
          const request=JSON.parse(await page.locator('#m1-input').inputValue());
          assert.equal(request.kind,'ns.validate');
          await page.locator('#m1-run').click();
          await page.waitForFunction(()=> {
            const raw=document.getElementById('m1-result-json')?.textContent;
            try { return ['COMPLETED','PARTIAL','FAILED','BUDGET_EXCEEDED'].includes(JSON.parse(raw).status); }
            catch { return false; }
          },{timeout:120000});
          const job=JSON.parse(await page.locator('#m1-result-json').textContent());
          assert.equal(job.request.kind,'ns.validate');
          assert(['COMPLETED','PARTIAL'].includes(job.status),JSON.stringify(job.blockers));
          await page.locator('#m1-export').click();
          await page.waitForFunction(()=>document.getElementById('m1-export-content').value.length>100);
          const bundle=JSON.parse(await page.locator('#m1-export-content').inputValue());
          const status=await page.evaluate(()=>window.MathScopeResearchM1.getStatus());
          assert.equal(bundle.request.kind,'ns.validate');
          assert.equal(bundle.inputHash,job.inputHash);
          assert.equal(bundle.environment.workerSha256,status.environment.workerSha256);
          assert.equal(status.environment.execution,'BROWSER_WEB_WORKER');
          assert.equal(status.formalPass,false);
          save(entry.name,bundle);
          steps.push({name:entry.name,request,status:job.status,workerSha256:bundle.environment.workerSha256,
            inputHash:bundle.inputHash,mathematicalHash:bundle.mathematicalHash,formalPass:false});
          continue;
        }
        await control('fixture').selectOption(entry.fixture);
        const request=edit(JSON.parse(await control('input').inputValue()),entry.edits);
        await control('input').fill(JSON.stringify(request,null,2));
        await control('apply').click();
        await control('run').click();
        await page.waitForFunction(()=>!document.querySelector('[data-r1="run"]').disabled,{timeout:120000});
        const state=await page.locator('#ms-r1-lab').getAttribute('data-state');
        assert(['COMPLETED','PARTIAL'].includes(state),entry.name+': '+await control('status').textContent());
        if (Number.isInteger(entry.sampleIndex)) await control('chart').locator('[role=button]').nth(entry.sampleIndex).press('Enter');
        const observation=JSON.parse(await control('inspect').textContent());
        const [download]=await Promise.all([page.waitForEvent('download'),control('export').click()]);
        const file=join(output,entry.name+'.json');
        await download.saveAs(file);
        const exported=JSON.parse(readFileSync(file));
        assert.equal(exported.formalPass,false);
        const { bundle }=exported;
        assert.equal(bundle.inputHash,observation.inputHash);
        assert.equal(bundle.mathematicalHash,observation.resultHash);
        assert.equal(bundle.environment.workerSha256,observation.sourceWorkerSHA256);
        assert.equal(exported.fixtureId,entry.fixture);
        assert.equal(observation.formalPass,false);
        steps.push({name:entry.name,request,status:state,workerSha256:bundle.environment.workerSha256,
          inputHash:bundle.inputHash,mathematicalHash:bundle.mathematicalHash,formalPass:false,
          selectedPath:observation.selectedPath,sampleTrace:observation.sampleTrace,source:observation.source});
      }
      receipts.push({id:scenario.id,steps});
      console.log(scenario.id,steps.length);
    }
    assert.deepEqual(failures,[]);
    save('browser-execution',{schema:'MathScope.M4.R107.BrowserExecution/1',chromium:browser.version(),
      candidateSha256:manifest.candidateSHA256,baseSha256:manifest.baseSHA256,walkthroughs:receipts,
      browserErrors:failures,publicationConfirmed:false});
  } finally {
    await browser.close();
  }
}
execute().catch(error=>{console.error(error);process.exitCode=1;});
