#!/usr/bin/env python3
"""Verify assembled source bindings and static UI contracts; not a browser test."""
import hashlib,json,pathlib,re,subprocess,sys
from html.parser import HTMLParser
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[2]
class Markup(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.labels=[];self.controls=[];self.svgs=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if "id" in a:self.ids.append(a["id"])
        if tag in ("input","select","button"):self.controls.append((tag,a))
        if tag=="svg":self.svgs.append(a)
h=(HERE/"generated/integrated-block.html").read_text();p=Markup();p.feed(h)
checks=[]
def check(name,passed,detail=None):
    checks.append({"id":name,"pass":bool(passed),"detail":detail})
check("unique_static_ids",len(p.ids)==len(set(p.ids)))
runtime=(HERE/"generated/runtime.js").read_text()
needed=set(re.findall(r"\$\('([^']+)'\)",runtime))|set(re.findall(r"txt\('([^']+)'",runtime))
missing=sorted("ms3ip-"+name for name in needed if "ms3ip-"+name not in p.ids)
check("all_static_runtime_targets_exist",not missing,missing)
check("dialog_labels_and_focus_styles",'aria-labelledby="ms3ip-title"' in h and ':focus-visible' in h and "panel.addEventListener('close'" in runtime)
check("six_panes_match_navigation",sorted(re.findall('data-pane="([^"]+)"',h))==sorted(re.findall('data-view="([^"]+)"',h)))
check("mobile_breakpoint_and_wrapping", "@media(max-width:700px)" in h and "overflow-wrap:anywhere" in h and "min-height:44px" in h,"CSS source only; actual mobile layout remains uninspected.")
check("no_new_webgl_dependency","WebGLRenderer" not in runtime and all(svg.get("role")=="img" and svg.get("aria-label") for svg in p.svgs))
check("missing_and_error_states","미평가" in h and "빈" not in runtime or "검색 결과가 없습니다" in runtime)
data=json.loads((HERE/"generated/RECOVERY_UI_DATA.json").read_text())
check("all_source_scope_strings",all(isinstance(r["scope"],str) and r["scope"] and r["scope"]!="None" for r in data["criteria"]))
check("cutoff_boxes_are_not_K_energy_percentage","이 비율은 K의 에너지 평가율이나 M3 진척률이 아닙니다" in runtime and "ξ²+υ² ≤ 1/2" in h)
check("same_frozen_root_run",data["support"]["run_hash"]==data["refinement"]["raw"]["run_hash"])
native=data["nativeRows"]
check("native35_scope_verified",{f:sum(r["family"]==f for r in native) for f in ["matrix","root","caller"]}=={"matrix":25,"root":8,"caller":2})
for name,source in data["sources"].items():
    if source.get("path"):
        file=ROOT/source["path"]
        check("source_bytes_"+name,file.is_file() and hashlib.sha256(file.read_bytes()).hexdigest()==source["sha256"],source["path"])
check("no_unconditional_M4_acceptance",all(r["details"].get("originalAcceptance")=="UNCONFIRMED" for r in data["criteria"] if r["stage"]=="M4"))
result={"schema":"MathScope.RecoveryUIStaticAudit/1","checks":checks,"allPassed":all(r["pass"] for r in checks),"browser_execution":False,"mobile_execution":False}
out=HERE/"evidence/STATIC_AUDIT.json";out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({"checks":len(checks),"passed":sum(r["pass"] for r in checks),"allPassed":result["allPassed"],"failures":[r for r in checks if not r["pass"]]},ensure_ascii=False))
sys.exit(0 if result["allPassed"] else 1)

