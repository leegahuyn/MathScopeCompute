"""Construct an offline integration fixture from the exact original R1 UI source."""
import argparse,hashlib,json,pathlib,subprocess
p=argparse.ArgumentParser();p.add_argument('--repo',required=True);p.add_argument('--ref',default='9595b4de5a1065b694d225c0ad2a14d5aa4435a9');args=p.parse_args()
root=pathlib.Path(__file__).resolve().parent
def read(path):return subprocess.check_output(['git','show',args.ref+':'+path],cwd=args.repo)
html=read('research-ide/mathscope-m4/web/release-lab.html');css=read('research-ide/mathscope-m4/web/release-lab.css')
anchor=b'<details><summary>\xec\x83\x88 Lean'
assert html.count(anchor)==1
candidate=html.replace(anchor,b'<div data-r1="proof-job-host"></div>\n  '+anchor,1)
(root/'release-lab.html').write_bytes(candidate)
(root/'release-lab.css').write_bytes(css)
document=b'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MathScope proof job isolated integration fixture</title><link rel="icon" href="data:,"><link rel="stylesheet" href="release-lab.css"></head><body>'+candidate+b'''<script type="module">
import {mountM4ProofJobUI} from './proof-job-ui.mjs';
import {createM4ProofJob} from './research-ide/mathscope-m4/proof-jobs.mjs';
let release;const gate=new Promise(r=>release=r);window.releaseSlow=()=>release();
const options=location.search.includes('race')?{make:async p=>{if(p.G==='SLOW')await gate;return createM4ProofJob(p);}}:{};
window.proofEditor=mountM4ProofJobUI(document.querySelector('[data-r1="proof-job-host"]'),options);
</script></body></html>'''
(root/'ui-fixture.html').write_bytes(document)
(root/'ui-source-provenance.json').write_text(json.dumps({'commit':args.ref,'original_release_lab_html_sha256':hashlib.sha256(html).hexdigest(),'original_release_lab_css_sha256':hashlib.sha256(css).hexdigest(),'candidate_html_sha256':hashlib.sha256(candidate).hexdigest(),'changed_content':'One new proof-job-host element before existing kernel details. Other release lab bytes unchanged.','integration_status':'isolated fixture; deploy pipeline not changed'},indent=2)+'\n',encoding='utf8')
print('R1 UI source pins and isolated fixture generated')
