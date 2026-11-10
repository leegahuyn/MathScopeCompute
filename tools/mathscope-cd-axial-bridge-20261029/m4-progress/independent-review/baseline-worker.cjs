const {chromium}=require(process.env.MATHSCOPE_PLAYWRIGHT_PATH||'C:/Users/사용자/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.MATHSCOPE_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage();
await page.goto(process.env.MATHSCOPE_TEST_URL || 'http://127.0.0.1:39148/baseline.html',{waitUntil:'domcontentloaded',timeout:120000});await page.locator('#ms-m4-launcher').click();await page.locator('[data-r1="fixture"]').selectOption('point');await page.locator('[data-r1="run"]').click();
await page.waitForFunction(()=>/SUCCEEDED|COMPLETED|실패|거부/.test(document.querySelector('[data-r1="status"]').textContent),null,{timeout:60000});
const status=await page.locator('[data-r1="status"]').textContent();assert.match(status,/SUCCEEDED|COMPLETED/);const result=JSON.parse(await page.locator('[data-r1="inspect"]').textContent());
const candidate=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'built/browser-result.json'),'utf8'));
assert.equal(result.sourceWorkerSHA256,candidate.workerHash);assert.equal(result.resultHash,candidate.resultHash);
const o={status:'PASS',baselineWorkerHash:result.sourceWorkerSHA256,candidateWorkerHash:candidate.workerHash,baselineResultHash:result.resultHash,candidateResultHash:candidate.resultHash,scope:'One P0 fixture, historical v103 isolated build'};fs.writeFileSync(require('node:path').join(__dirname,'baseline-worker-result.json'),JSON.stringify(o,null,2));console.log(JSON.stringify(o));await browser.close()})().catch(e=>{console.error(e);process.exitCode=1});
