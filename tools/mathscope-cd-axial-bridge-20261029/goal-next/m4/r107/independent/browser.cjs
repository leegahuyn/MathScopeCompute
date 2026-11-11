const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(path.join(process.env.USERPROFILE,
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

async function withCandidate(file, action) {
  const bytes = await readFile(file);
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1330,height:900},acceptDownloads:true});
    const errors=[];
    page.on('pageerror', error => errors.push(error.message));
    const url='http://127.0.0.1:49173/independent-walkthrough.html';
    await page.route('**/*',route => route.request().url() === url
      ? route.fulfill({body:bytes,contentType:'text/html; charset=utf-8'})
      : route.abort());
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
    return await action(page,bytes,errors);
  } finally { await browser.close(); }
}
module.exports={withCandidate};
if (require.main === module) {
  withCandidate(process.argv[2],async page => {
    await page.locator('#ms-m4-launcher').click();
    console.log('Fixtures',await page.locator('[data-r1=fixture] option').allTextContents());
    console.log('Dialog buttons',await page.locator('#ms-m4-dialog button').allTextContents());
    console.log('M1 NS nodes',await page.getByText('Navier–Stokes',{exact:true}).count());
    console.log('M1 NS hyphen nodes',await page.getByText('Navier-Stokes',{exact:true}).count());
    console.log('NS controls',await page.getByText('FD·FFT·고정밀·음성 대조군',{exact:false}).count());
  }).catch(error=>{console.error(error);process.exitCode=1;});
}
