const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.MATHSCOPE_PLAYWRIGHT_PATH || 'playwright');
const dir = path.resolve(process.argv[2]);
const sha = data => createHash('sha256').update(data).digest('hex');
const html = fs.readFileSync(path.join(dir, 'candidate.html'));
const build = JSON.parse(fs.readFileSync(path.join(dir, 'browser-build.json')));
assert.equal(sha(html), build.candidateSHA256);

async function verify() {
  const browser = await chromium.launch({ executablePath: process.env.MATHSCOPE_CHROME_PATH, headless: true });
  try {
    const page = await browser.newPage({ viewport: {width: 1250, height: 960} });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    const url = 'http://127.0.0.1:39147/candidate.html';
    await page.route('**/*', route => route.request().url() === url
      ? route.fulfill({ body: html, contentType: 'text/html; charset=utf-8' }) : route.abort());
    await page.goto(url, {waitUntil:'domcontentloaded',timeout:120000});
    await page.locator('#ms-m4-launcher').click();
    const control = key => page.locator('[data-r1="' + key + '"]');
    const inspect = async () => JSON.parse(await control('inspect').textContent());
    const states = new Set(['PARTIAL', 'COMPLETED', 'FAILED', 'UNSUPPORTED', 'PRECISION_REQUIRED', 'BUDGET_EXCEEDED']);
    const launch = async () => {
      await control('run').click();
      await page.waitForFunction(() => !document.querySelector('[data-r1="run"]').disabled, {timeout:120000});
      const state = await page.locator('#ms-r1-lab').getAttribute('data-state');
      assert(states.has(state), await control('status').textContent());
      assert(['PARTIAL','COMPLETED'].includes(state), await control('status').textContent());
    };
    const evidence = {};
    async function select(index, method) {
      const glyph = control('chart').locator('[role=button]').nth(index);
      if (method === 'keyboard') {
        await glyph.focus();
        await page.keyboard.press('Enter');
      } else await glyph.click();
      const observation = await inspect();
      for (const key of ['sourceWorkerSHA256','environmentHash','inputHash','resultHash'])
        assert.match(observation[key], /^[a-f0-9]{64}$/);
      assert.equal(observation.formalPass, false);
      assert(await control('source').isVisible());
      assert(await control('paper').isVisible());
      observation.paperHref = await control('paper').getAttribute('href');
      return observation;
    }

    await control('fixture').selectOption('ns-coefficient');
    await launch();
    const ns = await select(0, 'keyboard');
    const original = JSON.parse(fs.readFileSync(path.join(dir,'ns-coefficient.json')));
    const axis = original.result.results.axisObservations.samples[1];
    assert.equal(ns.sourceWorkerSHA256, original.workerSHA256);
    assert.equal(ns.resultHash, original.resultHash);
    assert.equal(ns.inputHash, original.inputHash);
    assert.equal(ns.state, 'PARTIAL');
    assert.equal(ns.sampleTrace.theoremId, 'N00/Lemma 5.2');
    assert.equal(ns.source.equation, '(5.4), Lemma 5.2');
    assert(ns.paperHref.endsWith('#page=46'));
    assert.equal(ns.sampleTrace.generator.nodeId, original.result.results.jets.positive.U[1]);
    assert.deepEqual(ns.rawValue,axis.normalizedInterval);
    assert.deepEqual(ns.error.normalizedInterval,axis.normalizedInterval);
    assert.equal(ns.sampleTrace.verifiedScope.actualPositiveOrderValuesEnclosed,true);
    evidence.ns = ns;

    await control('fixture').selectOption('prism');
    await launch();
    const prism = await select(0, 'click');
    const originalPrism = JSON.parse(fs.readFileSync(path.join(dir, 'prism.json')));
    assert.equal(prism.sourceWorkerSHA256, originalPrism.workerSHA256);
    assert.equal(prism.resultHash, originalPrism.resultHash);
    assert.equal(prism.rawValue.operation,'FROBENIUS_TWISTED_DERIVED_BASE_CHANGE_THETA');
    assert.equal(prism.sampleTrace.comparisonMap.coefficientMap, 'A_inf --phi--> A_inf --theta--> O_K');
    assert.deepEqual(prism.sampleTrace.comparisonMap, originalPrism.result.results.route.details);
    assert.equal(prism.sampleTrace.theoremIds[0].sourceId,'S01');
    assert.equal(prism.error.displayedStageRounding,0);
    assert.equal((await select(1,'keyboard')).rawValue.operation,'DERIVED_P_COMPLETION');
    evidence.prism = prism;

    await control('fixture').selectOption('delta');
    await launch();
    const delta1 = await select(0, 'click');
    assert.equal(delta1.sampleTrace.selected.rho, 1);
    assert.equal(delta1.error.sameProbe, true);
    const unverified = await select(1, 'keyboard');
    assert.equal(unverified.error.sameProbe, false);
    assert.equal(unverified.error.finiteDifference, null);
    await control('input').locator('..').locator('..').locator('summary').click();
    const next = JSON.parse(await control('input').inputValue());
    next.input.family.delta = 2;
    next.input.probe = [0.1, -0.15, 0.2, 0.05];
    await control('input').fill(JSON.stringify(next, null, 2));
    await control('apply').click();
    const stale = await inspect();
    assert.equal(stale.state,'STALE');
    assert.equal(stale.resultHash,delta1.resultHash);
    await launch();
    const delta2 = await select(1, 'keyboard');
    assert.equal(delta2.sampleTrace.generatorId,'Y5-01/CLASSICAL_SCALE');
    assert.equal(delta2.sampleTrace.selected.delta,2);
    assert.equal(delta2.sampleTrace.selected.rho,0.5);
    assert.equal(delta2.sampleTrace.selected.trialLength,0.6);
    assert.notEqual(delta2.sampleTrace.selected.physicalFieldHash,delta1.sampleTrace.selected.physicalFieldHash);
    assert.notEqual(delta2.resultHash,delta1.resultHash);
    assert.notEqual(delta2.inputHash,delta1.inputHash);
    const originalDelta2 = JSON.parse(fs.readFileSync(path.join(dir, 'delta2.json')));
    assert.equal(delta2.sourceWorkerSHA256,originalDelta2.workerSHA256);
    assert.equal(delta2.inputHash,originalDelta2.inputHash);
    const [download] = await Promise.all([page.waitForEvent('download'), control('export').click()]);
    const browserPath = path.join(dir,'delta2-browser-export.json');
    await download.saveAs(browserPath);
    const exported = JSON.parse(fs.readFileSync(browserPath));
    assert.equal(exported.formalPass,false);
    assert.equal(exported.bundle.mathematicalHash,delta2.resultHash);
    assert.equal(exported.bundle.inputHash,delta2.inputHash);
    const exact = exported.bundle.result.comparison[1];
    assert.equal(delta2.rawValue,exact.physicalDensity.actionDensity);
    assert.equal(delta2.sampleTrace.selected.physicalFieldHash,exact.physicalFieldHash);
    assert.equal(delta2.error.gaugeDensityDifference,exported.bundle.result.verification.gauge.actionDensityDifference);
    const native = originalDelta2.result.comparison[1];
    assert.equal(exact.physicalFieldHash,native.physicalFieldHash);
    const densityDifference = Math.abs(delta2.rawValue-native.physicalDensity.actionDensity);
    assert(densityDifference <= 1e-12);
    assert.equal(delta2.error.sameProbe,true);
    assert.equal(delta2.error.certifiedDensityError,null);
    assert(delta2.error.finiteDifference.error > delta2.error.finiteDifference.halfStepError);
    assert.equal(delta2.sampleTrace.paper.id,'YM-R06');
    assert.equal(delta2.sampleTrace.assumptionRefs.length,0);
    evidence.delta = delta2;
    assert.deepEqual(errors, []);
    const report = {schema:'MathScope.M4.R1-03.Provenance/1',criterionId:'R1-03',
      originalBlueprintPage:68, sourcePatchBase:'294e36eb04a8269def23fe82a4d503d67a05d514',
      browser:{version:browser.version(),viewport:[1250,960],candidateSHA256:build.candidateSHA256,errors},
      evidence, browserDeltaExportSHA256:sha(fs.readFileSync(browserPath)),
      crossRuntimeDelta:{browserResultHash:delta2.resultHash,nativeResultHash:originalDelta2.resultHash,
        commonInputHash:delta2.inputHash,commonWorkerSHA256:delta2.sourceWorkerSHA256,
        commonPhysicalFieldHash:exact.physicalFieldHash,observedAbsoluteDensityDifference:densityDifference,
        comparisonTolerance:1e-12},
      controls:{unmatchedDeltaDiagnosticWithheld:true,foreignInputStale:true},
      checks:{NS_POINT_TO_ORIGINAL_EQUATION_JOB_ERROR_CLAIM:'PASS',
        PRISM_POINT_TO_COMPARISON_JOB_ERROR_CLAIM:'PASS',DELTA_POINT_TO_GENERATOR_JOB_ERROR_CLAIM:'PASS'},
      verdict:'PASS_BROWSER_SAMPLE_PROVENANCE', publicationConfirmed:false};
    fs.writeFileSync(path.join(dir,'R1-03_RECEIPT.json'), JSON.stringify(report,null,2)+'\n');
    console.log('R1-03 browser readback: three original sources and sampled values, two stale/foreign diagnostics controls');
  } finally {
    await browser.close();
  }
}
verify().catch(error => { console.error(error); process.exitCode = 1; });
