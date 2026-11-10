"""Prepare source-based M4 proof editor integration in an isolated source snapshot."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parent
WEB=ROOT/'source/research-ide/mathscope-m4/web'
prior=ROOT.parent/'m4-followup'
session=(prior/'proof-session.mjs').read_text(encoding='utf8').replace("'./research-ide/mathscope-m4/proof-jobs.mjs'","'../proof-jobs.mjs'")
ui=(prior/'proof-job-ui.mjs').read_text(encoding='utf8').replace("'./research-ide/mathscope-m4/proof-jobs.mjs'","'../proof-jobs.mjs'")
(WEB/'proof-session.mjs').write_text(session,encoding='utf8')
(WEB/'proof-job-ui.mjs').write_text(ui,encoding='utf8')
(WEB/'proof-job-bootstrap.mjs').write_text("import {mountM4ProofJobUI} from './proof-job-ui.mjs';\nconst host=document.querySelector('#ms-r1-lab [data-r1=proof-job-host]');\nif(host) mountM4ProofJobUI(host);\n",encoding='utf8')
path=WEB/'build-release-lab.py';original=path.read_text(encoding='utf8')
def once(src,old,new):
 if src.count(old)!=1:raise ValueError('missing unique builder marker '+old)
 return src.replace(old,new,1)
updated=once(original,'def build(observed, catalog, verification, kernel, source_refinement=None):','def build(observed, catalog, verification, kernel, source_refinement=None, proof_editor_bundle=None):')
updated=once(updated,"    find='<div class=\"ms-m4-tools\">'","    if proof_editor_bundle is not None:\n        anchor='  <details><summary>새 Lean 커널 실행 및 오류 대조</summary>'\n        if html.count(anchor)!=1: raise ValueError('Proof editor anchor not unique')\n        html=html.replace(anchor,'  <div data-r1=\"proof-job-host\"></div>\\n'+anchor,1)\n    find='<div class=\"ms-m4-tools\">'")
updated=once(updated,"    patch('</body>',addon+'</body>')","    if proof_editor_bundle is not None:\n        addon += '<script id=\"ms-r1-proof-editor\">\\n' + re.sub('</script',r'<\\\\/script',proof_editor_bundle,flags=re.I) + '\\n</script>\\n'\n    patch('</body>',addon+'</body>')")
updated=once(updated,"p.add_argument('--refinement',type=Path);args=p.parse_args()","p.add_argument('--refinement',type=Path);p.add_argument('--proof-editor-bundle',type=Path);args=p.parse_args()")
updated=once(updated,"catalog,verification,kernel,refinement)","catalog,verification,kernel,refinement,args.proof_editor_bundle.read_text(encoding='utf-8') if args.proof_editor_bundle else None)")
path.write_text(updated,encoding='utf8')
print('Isolated builder supports optional prebuilt source-derived proof editor; default output remains unchanged.')
