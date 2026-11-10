"""Rebuild the historical R1 page locally; no deployment or original edits."""
import gzip, hashlib, importlib.util, json, pathlib, subprocess, os
R=pathlib.Path(__file__).resolve().parent
S=R/'source'/'research-ide'/'mathscope-m4'/'web'
repo=pathlib.Path(os.environ.get('MATHSCOPE_SOURCE_REPO','C:/Users/사용자/Documents/Codex/2026-10-15/task/MathScopeCompute'))
revision='9595b4de5a1065b694d225c0ad2a14d5aa4435a9'
baseline=repo/'docs/evidence/m4-evidence-panel-v103-20261013/public-v103.html.gz'
data=gzip.open(baseline,'rb').read().decode('utf8')
verification=json.loads((repo/'research-ide/mathscope-m4/release-lab/evidence/run-2026-10-13T175955318Z/manifest.json').read_text(encoding='utf8'))
kernel=json.loads((repo/'research-ide/mathscope-m4/evidence/local-kernel-replay-20261013-attempt2/replay.json').read_text(encoding='utf8'))
catalog=json.loads((R/'source/research-ide/mathscope-m4/release-lab/catalog.json').read_text(encoding='utf8'))
assert verification['pass'] is True
orig=subprocess.check_output(['git','show',revision+':research-ide/mathscope-m4/web/build-release-lab.py'],cwd=repo)
(S/'original-builder.py').write_bytes(orig)
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path); mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
new=load('candidate_builder',S/'build-release-lab.py'); old=load('original_builder',S/'original-builder.py')
oldp,oldhtml,oldman=old.build(data,catalog,verification,kernel)
newp,newhtml,newman=new.build(data,catalog,verification,kernel)
assert (oldp,oldhtml,oldman)==(newp,newhtml,newman),'default build changed'
editor=(R/'proof-editor-bundle.js').read_text(encoding='utf8')
patches,html,manifest=new.build(data,catalog,verification,kernel,proof_editor_bundle=editor)
assert manifest['unrelatedBytesPreserved'] is True and html.count('id="ms-r1-lab"')==1
assert html.count('data-r1="proof-job-host"')==1 and html.count('id="ms-r1-proof-editor"')==1
out=R/'built';out.mkdir(exist_ok=True)
(out/'candidate.html').write_bytes(html.encode('utf8'))
summary={'status':'PASS_BUILDER_ONLY','commit':revision,'baseline_sha256':hashlib.sha256(data.encode()).hexdigest(),
 'historical_verification_commit':verification['sourceCommit'],'default_output_byte_identical_to_original_builder':True,
 'candidate_sha256':hashlib.sha256(html.encode()).hexdigest(),'original_builder_sha256':hashlib.sha256(orig).hexdigest(),
 'editor_bundle_sha256':hashlib.sha256(editor.encode()).hexdigest(),'preserves_other_baseline_bytes':manifest['unrelatedBytesPreserved'],
 'scope':'Historical pinned v103 build fixture; no production deployment, current Lean kernel execution or proof of new input mathematical semantics.'}
(out/'build-result.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
print(json.dumps(summary,indent=2))
