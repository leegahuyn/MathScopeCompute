from pathlib import Path
import subprocess, json, hashlib
r=Path('C:/Users/사용자/Documents/Codex/2026-10-15/task/MathScopeCompute')
w=Path('.')
pin=json.loads((w/'producer-hashes.json').read_text(encoding='utf8'))
ui=json.loads((w/'ui-source-provenance.json').read_text(encoding='utf8'))
ref=pin['commit']; report={}
def blob(p):return subprocess.check_output(['git','show',f'{ref}:{p}'],cwd=r)
def sha(b):return hashlib.sha256(b).hexdigest()
for p,h in pin['sha256'].items():
 b=blob(p);local=(w/p).read_bytes();report[p]={'remote_manifest_sha_match':sha(b)==h,'local_exact_bytes_match':b==local}
for name in ('html','css'):
 p=f'research-ide/mathscope-m4/web/release-lab.{name}'; b=blob(p); h=ui[f'original_release_lab_{name}_sha256'];report[p]={'remote_manifest_sha_match':sha(b)==h}
orig=blob('research-ide/mathscope-m4/web/release-lab.html');candidate=(w/'release-lab.html').read_bytes()
patch=b'<div data-r1="proof-job-host"></div>\n  ';report['candidate_single_insertion']={'pass':candidate.count(patch)==1 and candidate.replace(patch,b'',1)==orig,'candidate_sha_matches_manifest':sha(candidate)==ui['candidate_html_sha256']}
report['css_exact_bytes_match']={'pass':(w/'release-lab.css').read_bytes()==blob('research-ide/mathscope-m4/web/release-lab.css')}
print(json.dumps(report,indent=2));assert all(all(v.values()) for v in report.values())
(w/'independent-review/provenance-replay.json').write_text(json.dumps(report,indent=2)+'\n')
