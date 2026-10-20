#!/usr/bin/env python3
"""Build a single preserved-page evidence block from pinned, existing evidence.

This is a new UI implementation. It does not run mathematical acceptance, issue
certificates, change M3/M4 counts, or publish. New evidence URLs must be pinned
to an actual branch commit before publication.
"""
import argparse, base64, copy, gzip, hashlib, html, json, pathlib, re, shutil, subprocess
ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
WS = ROOT.parent
BASELINE = "333d6095d4a2d2d69ceec9b25c44e1d3381e36d2"
BRANCH = "mathscope-m3-n6-cloud-20261014"
PREFIX = "research-ide/mathscope-m3/evidence/work-continuation-20261018T081100Z_5f6a2d9c"
M3NEW = "research-ide/mathscope-m3/recovery-20261019"
M4NEW = "research-ide/mathscope-m4/recovery-20261019"

def digest(raw): return hashlib.sha256(raw).hexdigest()
def read(path):
    raw = (ROOT / path).read_bytes()
    return json.loads(raw), digest(raw), len(raw)
def ref(path, label, revision=BASELINE):
    file = ROOT / path
    if not file.is_file(): raise FileNotFoundError(path)
    raw = file.read_bytes()
    return {"path":path,"label":label,"sha256":digest(raw),"bytes":len(raw),
            "url":f"https://github.com/leegahuyn/MathScopeCompute/blob/{revision}/{path}"}
def compact(data): return json.dumps(data,ensure_ascii=False,separators=(",",":"))
def verify_pinned_urls(data):
    """Verify each rendered GitHub blob/tree URL against its immutable git object."""
    found = {}
    def walk(value):
        if isinstance(value, dict):
            url = value.get("url")
            if isinstance(url, str):
                match = re.fullmatch(r"https://github\.com/leegahuyn/MathScopeCompute/(blob|tree)/([0-9a-f]{40})/(.+)", url)
                if match:
                    kind, revision, path = match.groups()
                    key = (revision, path)
                    if key not in found:
                        spec = revision + ":" + path
                        result = subprocess.run(["git", "cat-file", "-t", spec], cwd=ROOT, capture_output=True, text=True)
                        if result.returncode: raise ValueError("Immutable source URL is missing: " + url)
                        observed = result.stdout.strip()
                        if observed != ("blob" if kind == "blob" else "tree"): raise ValueError("Immutable source URL has wrong object kind: " + url)
                        record = {"url":url,"revision":revision,"path":path,"kind":observed,"exists":True}
                        if observed == "blob":
                            raw = subprocess.run(["git", "cat-file", "blob", spec], cwd=ROOT, capture_output=True, check=True).stdout
                            record.update({"bytes":len(raw),"sha256":digest(raw)})
                        found[key] = record
                    if value.get("sha256") and found[key].get("sha256") != value["sha256"]:
                        raise ValueError("Immutable source URL byte hash differs: " + url)
                elif url.startswith("https://github.com/leegahuyn/MathScopeCompute/") and ("/blob/" in url or "/tree/" in url):
                    raise ValueError("Source URL must use an immutable 40-character revision: " + url)
            for child in value.values(): walk(child)
        elif isinstance(value, list):
            for child in value: walk(child)
    walk(data)
    return {"schema":"MathScope.ImmutableSourceLinks/1","allPassed":True,"uniqueSourcePaths":len(found),"sources":list(found.values())}
def build(revision, expected_page_hash):
    extract_path = "research-ide/mathscope-m4/recovery-ui-20261019/ORIGINAL_CRITERIA_EXTRACT.json"
    original, _, _ = read(extract_path)
    current_path = PREFIX + "/CURRENT_ID_LEDGER.json"
    ledger, _, _ = read(current_path)
    current_matrix_path = M3NEW + "/M3_CURRENT_ORIGINAL_LEDGER.json"
    current_matrix, _, _ = read(current_matrix_path)
    native_path = PREFIX + "/work/resumed_continuation/quadratic/evidence/ACTUAL_CONTINUOUS_MATRIX_AND_JETS.json"
    native, _, _ = read(native_path)
    support_path = M3NEW + "/evidence/OUTER_CUTOFF_WHOLE_K_CELLS.json"
    support, _, _ = read(support_path)
    refinement_path = M3NEW + "/evidence/ACTUAL_ENERGY_REFINEMENT_ATTEMPTS.json"
    attempts, _, _ = read(refinement_path)
    m4_path = M4NEW + "/M4_ORIGINAL_ACCEPTANCE_MATRIX.json"
    m4, _, _ = read(m4_path)
    assert ledger["M3"]["completed"] == 62 and ledger["M3"]["total"] == 64
    assert ledger["M3"]["open"] == ["N7-06","N8-05"]
    assert ledger["post_checkpoint_results"]["actual_global_last_resolved_tau"] is None
    assert m4["acceptedCurrentRelease"] is None and m4["finalAcceptance"] == "UNCONFIRMED"
    assert not support["N706_closed"] and not support["N805_closed"]
    assert support["whole_K_energy"] is None and support["actual_last_resolved_tau"] is None
    assert support["run_hash"] == attempts["run_hash"]
    assert len(original["rows"]) == 80
    sources = {
      "currentLedger":ref(current_path,"현재 M3 원장 · 62/64"),
      "m3Matrix":ref(current_matrix_path,"M3 원래 64개 · 현재 범위와 개별 근거",revision),
      "m4Matrix":ref(m4_path,"M4 원래 16개와 실행 근거",revision),
      "criteria":ref("research-ide/mathscope-m3/ORIGINAL_M3_M4_CRITERIA.json","원 설계도 80개 기준 원문·페이지",revision),
      "native":ref(native_path,"인증된 연속 행렬·root·caller 구간"),
      "nativeChecks":ref(PREFIX+"/work/resumed_continuation/quadratic/evidence/CHECKS.json","구간 검증 및 실패 대조"),
      "nativeLog":ref(PREFIX+"/work/resumed_continuation/quadratic/logs/run.stdout.log","native 실행 로그"),
      "nativeCode":ref(PREFIX+"/work/resumed_continuation/quadratic/code/continue_quadratic.py","native 계산 소스"),
      "support":ref(support_path,"실제 cutoff 전체 셀 데이터",revision),
      "supportRun":ref(M3NEW+"/evidence/OUTER_CUTOFF_RUN.json","cutoff 실행 결과·출력 해시",revision),
      "supportCode":ref(M3NEW+"/outer_cutoff.py","cutoff 계산 소스",revision),
      "supportTests":ref(M3NEW+"/test_outer_cutoff.py","cutoff 검증·실패 대조 코드",revision),
      "refinement":ref(refinement_path,"원래 세분화 요청과 중단 원인",revision),
    }
    known = {row["id"]:row for row in ledger["items"]}
    current_byid = {row["id"]:row for row in current_matrix["rows"]}
    m4_byid = {row["id"]:row for row in m4["rows"]}
    rows = []
    for raw in original["rows"]:
        row = copy.deepcopy(raw)
        if row["stage"] == "M3":
            detail = known.get(row["id"])
            row.update({
                "status":"OPEN" if row["id"] in ledger["M3"]["open"] else "INHERITED_COMPLETE",
                "summary":detail.get("decision",detail.get("validation","인증된 저장 원장의 원래 인수 범위를 승계합니다.")) if detail else "기존 원래 인수 범위 완료를 현재 원장에서 승계합니다. 이번 UI 실행은 재증명이 아닙니다.",
                "scope":detail.get("original_scope",detail.get("mathematical_vs_numerical_scope","원래 개별 항목 범위; 실제 전역 수치 완료와 구분.")) if detail else "기존 56개 항목의 원래 인수 범위를 승계. 현재 원장과 원 설계도에 연결하며 새로운 실행 완료를 주장하지 않습니다.",
                "source":sources["currentLedger"],
                "details":detail if detail else {"source_ledger":sources["currentLedger"],"inherited_original_scope":True,"new_execution_claimed":False,"original_acceptance":raw["original_acceptance"]},
                "links":[sources["criteria"]]
            })
            current = current_byid[row["id"]]
            assert current["source_page"] == row["source_page"]
            row["scope"] = str(current.get("inherited_scope", current.get("original_scope", row["scope"]))) + " " + str(current.get("numerical_vs_mathematical_scope", ""))
            row["details"] = current
            row["source"] = sources["m3Matrix"]
            for item in current.get("available_references", []):
                if item.get("available") and item.get("observed"):
                    observed = item["observed"]
                    if observed.get("kind") == "directory":
                        for member in observed["members"]:
                            assert ref(member["path"], "member")["sha256"] == member["sha256"]
                        row["links"].append({"path":observed["path"],"label":pathlib.Path(observed["path"]).name+" · 디렉터리", "url":f"https://github.com/leegahuyn/MathScopeCompute/tree/{BASELINE}/{observed['path']}"})
                        continue
                    source = ref(observed["path"], pathlib.Path(observed["path"]).name, revision if "/recovery-20261019/" in observed["path"] else BASELINE)
                    assert source["sha256"] == observed["sha256"]
                    row["links"].append(source)
            if row["id"] in ["N7-06","N8-05"]:
                row["links"] += [sources["refinement"],sources["support"]]
        else:
            detail = m4_byid[row["id"]]
            assert detail["original_acceptance"] == row["original_acceptance"]
            links = []
            for item in detail.get("implementation",[]) + detail.get("inheritedEvidence",[]):
                if item.get("present") and (ROOT/item["path"]).is_file():
                    source = ref(item["path"],pathlib.Path(item["path"]).name,revision if "/recovery-20261019/" in item["path"] else BASELINE)
                    assert source["sha256"] == item["sha256"]
                    links.append(source)
            for test in detail.get("tests",[]):
                for item in test.get("evidence",[]):
                    if (ROOT/item["path"]).is_file():
                        source = ref(item["path"],test["suite"]+" · "+pathlib.Path(item["path"]).name,revision)
                        assert source["sha256"] == item["sha256"]
                        links.append(source)
            row.update({"status":detail["status"],"summary":"원래 인수 미확인 · "+detail.get("independentPreparation","PREPARATION_ONLY"),
                        "scope":detail["verifiedScope"]+" "+detail["dependencyBoundary"],"source":sources["m4Matrix"],
                        "details":detail,"links":links})
        rows.append(row)
    native_rows=[]
    bindings={(item["row"],item["column"]):item for item in native["matrixIntegralBindings"]}
    for i, values in enumerate(native["linearMatrixIntervals"]):
        for j, interval in enumerate(values):
            native_rows.append({"id":f"I1[{i},{j}]","label":f"I₁ 행렬 ({i},{j}) · node {bindings[i,j]['sourceNode']}",
              "family":"matrix","interval":interval,"source":sources["native"],
              "scope":"원래 unit-mass 양의 연속 bump 적분 행렬. quadrature 표본이나 대체 행렬이 아닙니다.",
              "details":{"binding":bindings[i,j],"method":native["method"],"normalization":native["normalization"],
                         "lambda_interval":native["lambdaInterval"],"actual_lambda_strictly_positive":True,
                         "source_authentication":native["sourceAuthentication"]}})
    for root in native["rootDerivativeEnclosures"]:
        native_rows.append({"id":str(root["sourceCallNode"]),"label":f"root node {root['sourceCallNode']} · η 차수 0,1,2",
          "family":"root","interval":root["eachDerivativeEnclosure"],"source":sources["native"],
          "scope":"같은 zero-seeded 실제 root의 η∈[-1,1] 균일 C² 구간. RHS와 도함수 중심의 직접 수치 평가는 미완료.",
          "details":root|{"originalRhsNumericallyEvaluated":native["originalRhsNumericallyEvaluated"],"originalRhsDerivativeNumericallyEvaluated":native["originalRhsDerivativeNumericallyEvaluated"]}})
    for caller in native["actualCallers"]:
        native_rows.append({"id":str(caller["callerNode"]),"label":f"caller node {caller['callerNode']} · η 차수 0,1,2",
          "family":"caller","interval":caller["eachCallerDerivativeEnclosure"],"source":sources["native"],
          "scope":"원래 root를 곱하는 실제 caller 전체의 균일 상계. all finite real X, 원래 양의 X₀를 유지합니다.",
          "details":caller})
    assert len(native_rows)==35
    original_html=(HERE/"baseline/integrated-m3-v117-block.html").read_text()
    legacy=json.loads(re.search(r"const d=(\{.*?\});const special=",original_html,re.S).group(1))
    sources["paper"]={"url":"https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf","label":"원 논문 · 동일 SHA-256","sha256":legacy["source"]["paperSHA256"]}
    n7=attempts["N706"]
    refinement={
      "n7":[{"axis":"space","request":f"grid {n7['space']['baseline_grid']} → {n7['space']['doubled_grid']}; 시간 조건 고정","comparison":None,"tail":None,"status":"OPEN · 실제 장 평가 전 중단"},
            {"axis":"time","request":f"time cells {n7['time']['baseline_cells']} → {n7['time']['doubled_cells']}; 공간 조건 고정","comparison":None,"tail":None,"status":"OPEN · 실제 장 평가 전 중단"}],
      "n8":[{"axis":item["axis"],"request":str(item["baseline"][item["axis"]])+" → "+str(item["doubled"][item["axis"]])+"; 나머지 세 축 고정","comparison":item["comparison"],"tail":item["independent_tail_bound"],"status":item["status"]} for item in attempts["N805"]["axes"]],
      "raw":attempts}
    data={"schema":"MathScope.RecoveryEvidenceView/1",
      "revision":{"label":"recovery-20261019-1","newEvidenceCommit":revision,"inheritedCommit":BASELINE,"branch":BRANCH,"expectedProductionHash":expected_page_hash},
      "blueprint":original["source"],
      "status":{"m3Complete":62,"m3Total":64,"actualGlobalLastResolvedTau":None,"m4Complete":None,"wholeM4Complete":False,"initial1260Scope":"INITIAL_CONSTRUCTION_ONLY",
        "M4OriginalAcceptance":"UNCONFIRMED","M4SoftwareChecks":m4["softwareTests"],"originalNativeWholeKernelsOpen":138,"indexedRecordsReused":3407},
      "criteria":rows,"nativeRows":native_rows,"sources":sources,"support":support,"refinement":refinement,"legacy":legacy}
    raw=compact(data).replace("<","\\u003c").replace("\u2028","\\u2028").replace("\u2029","\\u2029")
    immutable_links = verify_pinned_urls(data)
    ui_data_sha=digest(raw.encode())
    packed = gzip.compress(raw.encode(), compresslevel=9, mtime=0)
    encoded = base64.b64encode(packed).decode("ascii")
    assert len(raw.encode()) <= 2500000 and len(encoded) <= 400000
    script='<script id="ms3ip-recovery-data" type="application/octet-stream" data-encoding="gzip-base64" data-bytes="'+str(len(raw.encode()))+'" data-sha256="'+ui_data_sha+'">'+encoded+'</script>'
    static_links = " ".join('<a href="'+html.escape(sources[key]["url"],quote=True)+'" target="_blank" rel="noopener noreferrer">'+html.escape(sources[key]["label"])+'</a>' for key in ["currentLedger","m3Matrix","m4Matrix","criteria"])
    model=(HERE/"recovery-model.mjs").read_text()
    model=re.sub(r"(?m)^export ","",model)
    runtime="(() => {\n"+model+"\n"+(HERE/"recovery-runtime.js").read_text()+"\n})();"
    assert "</script" not in runtime.lower()
    block=(HERE/"recovery-panel.html").read_text().replace("__RECOVERY_DATA__",script).replace("__RECOVERY_RUNTIME__",runtime).replace("__RECOVERY_STATIC_SOURCES__",static_links)
    assert "__RECOVERY_" not in block
    out=HERE/"generated";out.mkdir(exist_ok=True)
    (out/"RECOVERY_UI_DATA.json").write_text(raw)
    (out/"RECOVERY_UI_DATA.json.gz").write_bytes(packed)
    (out/"IMMUTABLE_SOURCE_LINKS.json").write_text(json.dumps(immutable_links,ensure_ascii=False,indent=2)+"\n")
    (out/"integrated-block.html").write_text(block)
    (out/"runtime.js").write_text(runtime)
    before=(WS/"website_audit/production-v117-public.html").read_bytes().decode("utf-8")
    begin="<!-- MathScope M3 integrated 20261016 BEGIN -->"
    end="<!-- MathScope M3 integrated 20261016 END -->"
    start=before.index(begin);stop=before.index(end)+len(end)
    old=before[start:stop]
    after=before[:start]+block.rstrip("\n")+before[stop:]
    patches=[{"operation":"replace","find":old,"replace":block.rstrip("\n")}]
    patch={"project_id":29770,"slug":"v0.3.1.html","base_version_hash":expected_page_hash,
      "patch_summary":"Restore authenticated M3 62/64 scope and original 80 criteria. Add sourced native intervals and exact cutoff cell explorer; preserve null energy/tau and original M4 unconfirmed acceptance. Isolated integrated panel only; legacy Worker/engine bytes preserved.",
      "patches":patches}
    (out/"websitepublisher-patch.json").write_text(compact(patch))
    # Full public HTML is a local backup/preview, not a second production page.
    (WS/"website_audit/production-proposed.html").write_text(after)
    def scripts(html):
        return [(m.group(1),digest(m.group(2).encode())) for m in re.finditer(r'<script\b([^>]*)>(.*?)</script\s*>',html,re.S|re.I)]
    b_scripts=scripts(before[:start]+before[stop:])
    a_start=after.index(begin);a_stop=after.index(end)+len(end)
    a_scripts=scripts(after[:a_start]+after[a_stop:])
    assert b_scripts==a_scripts
    report={"schema":"MathScope.ProductionPatchPreparation/1","original_public_sha256":digest(before.encode()),"proposed_public_sha256":digest(after.encode()),
      "expected_base_version":117,"expected_base_version_hash":expected_page_hash,"isolated_markers":[begin,end],
      "outside_marker_bytes_identical":before[:start]==after[:a_start] and before[stop:]==after[a_stop:],
      "all_outside_scripts_identical":b_scripts==a_scripts,"outside_script_count":len(b_scripts),
      "new_ui_data_sha256":ui_data_sha,"new_ui_data_bytes":len(raw.encode()),"replacement_block_bytes":len(block.encode()),
      "data_transport":{"encoding":"gzip-base64","gzip_bytes":len(packed),"base64_characters":len(encoded),"max_decoded_bytes":2500000,"decoded_payload_identical":gzip.decompress(packed)==raw.encode(),"immutable_source_paths":immutable_links["uniqueSourcePaths"]},
      "patch_request_bytes":len(compact(patch).encode()),"new_evidence_revision":revision,"source_hashes":sources,
      "published":False,"mobile_browser_inspection":False,"new_webgl_dependency":False,"global_energy":None,"actual_last_resolved_tau":None}
    (out/"PREPUBLICATION_MANIFEST.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    return report
if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--revision",default=BRANCH);parser.add_argument("--base-version-hash",default="d7474dd6")
    args=parser.parse_args();report=build(args.revision,args.base_version_hash)
    print(json.dumps({k:report[k] for k in ["new_ui_data_sha256","new_ui_data_bytes","replacement_block_bytes","patch_request_bytes","outside_marker_bytes_identical","all_outside_scripts_identical","published"]},indent=2))

