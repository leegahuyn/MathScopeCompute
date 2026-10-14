#!/usr/bin/env python3
"""Render the authenticated n=1 Picard inventory as a self-contained M3 view.

The view reports source classification and conditional lemmas separately from
full coefficient/domain certification. It deliberately cannot advance N6.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


OPERATORS = {"actual_natural_series": 157, "inverse": 33,
             "log_positive": 21, "sqrt_positive": 5}
HEADER_SHA = "010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c"
DB_SHA = "ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate(data):
    require(data.get("schema") == "MathScope.N6.PicardActualNativeDomainInventory/1",
            "Unsupported native inventory schema")
    source = data.get("source", {})
    require(source.get("headerSHA256") == HEADER_SHA
            and source.get("databaseSHA256") == DB_SHA
            and source.get("picard") == "ActualSameN3OrderOneInner"
            and source.get("eta") == 2 and source.get("xi") == 25516,
            "Native source metadata does not match this pinned Picard view")
    calls = data.get("actualNativeCalls", [])
    require(len(calls) == 216, "Expected all 216 authenticated native calls")
    ids = [c.get("sourceNode") for c in calls]
    require(all(type(n) is int for n in ids) and len(set(ids)) == len(ids),
            "Native source node IDs must be unique integers")
    require({op: sum(c.get("operator") == op for c in calls) for op in OPERATORS}
            == OPERATORS, "Native operator counts changed")
    l = data.get("nativeLRoot", {})
    require(l.get("formula") == "1-2*h*eta^2"
            and 1953 in l.get("allFoundOriginalInverseNodes", [])
            and l.get("analyticallyValidForNativeInverseCalls") is True
            and any(c["sourceNode"] == 1953 and c["operator"] == "inverse" for c in calls),
            "Displayed L proof is not attached to its original inverse call")
    require(data.get("actualRootCoefficientClosure", {}).get("uniqueNodeCount") == 3679,
            "Authenticated Picard closure count changed")
    require(data.get("N6RemainingJetsUnchanged") == 230
            and data.get("N6TotalGlobalGuardCountUnchanged") == 38
            and data.get("N6ResidualPDETermsUnchanged") == 1020
            and data.get("originalM3Status") == "56/64"
            and data.get("originalN601Complete") is False
            and data.get("originalN602Complete") is False,
            "This view cannot promote the original N6 frontier")
    require(data.get("nativeA0A1ForcingCommonHolomorphicStripProved") is False
            and data.get("nativeA0A1ForcingUniformComplexSupNormProved") is False
            and data.get("sameProfileM2PicardNormTransferredToAllOriginalN6") is False,
            "Full coefficient certification changed; update this view's proof scope first")
    inventory = data.get("naturalSeriesFamilyInventory")
    require(isinstance(inventory, dict), "Natural-series family inventory required")
    require(inventory.get("schema") == "MathScope.N6.PicardNaturalSeriesFamilyInventory/1",
            "Unsupported natural-series inventory schema")
    families = inventory.get("families", [])
    require(isinstance(families, list) and bool(families), "Family classification is empty")
    family_ids = [f.get("id") for f in families]
    require(all(isinstance(i, str) and i for i in family_ids)
            and len(set(family_ids)) == len(family_ids), "Duplicate or invalid family IDs")
    covered = []
    for family in families:
        nodes = family.get("sourceNodes", [])
        require(isinstance(nodes, list) and bool(nodes)
                and all(type(n) is int for n in nodes), "Family source nodes missing")
        require(family.get("callCount") == len(nodes), "Family count disagrees with nodes")
        covered.extend(nodes)
    natural_nodes = {c["sourceNode"] for c in calls if c["operator"] == "actual_natural_series"}
    require(len(covered) == 157 and len(set(covered)) == 157
            and set(covered) == natural_nodes,
            "Family classification must cover every natural-series call exactly once")
    summary = inventory.get("summary", {})
    require(summary.get("callCount") == 157
            and summary.get("argumentFamilyCount") == len(families),
            "Family summary disagrees with classified source nodes")
    proved_argument_count = sum(f["callCount"] for f in families
                                if f.get("radialDomain", {}).get("status")
                                == "PROVED_ARGUMENT_RANGE_ONLY")
    require(summary.get("exactArgumentDomainProvedCalls") == proved_argument_count
            and summary.get("argumentDomainUnresolvedCalls") == 157 - proved_argument_count,
            "Argument-range summary disagrees with family evidence")
    require(summary.get("fullCoefficientNormProved") is False
            and summary.get("actualKernelHolomorphyProvedCalls") == 0,
            "Actual kernel certification changed; review conditional scope")
    return data


def embedded_json(data):
    # JSON script elements are raw text. Escaping angle brackets prevents an
    # authenticated or test description containing </script> from closing it.
    return (json.dumps(data, ensure_ascii=False, separators=(",", ":"))
            .replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")
            .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029"))


def render(data):
    validate(data)
    return TEMPLATE.replace("__AUDIT_JSON__", embedded_json(data))


TEMPLATE = r'''<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MathScope M3 · Picard 자연급수 검증</title>
<style>
:root{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#182c3f;background:#f3f6f8;line-height:1.6;--ink:#182c3f;--muted:#4e6374;--line:#d9e2e8;--blue:#185c8c;--amber:#785006}
*{box-sizing:border-box}body{margin:0}main{max-width:1180px;margin:auto;padding:36px 28px 64px}h1,h2,h3,p{margin:0}h1{font-size:clamp(1.65rem,4vw,2.4rem);line-height:1.25;letter-spacing:-.03em}h2{font-size:1.22rem;margin-bottom:12px}h3{font-size:1rem;margin-bottom:8px}p+p{margin-top:8px}.eyebrow{color:var(--blue);font-size:.76rem;font-weight:750;letter-spacing:.12em;margin-bottom:10px}.intro{max-width:790px;color:var(--muted);margin-top:14px}.frontier{margin-top:22px;padding:15px 18px;background:#fff5df;border-left:4px solid #9d6b0a;border-radius:4px}.frontier strong{font-size:1rem}.frontier p{font-size:.9rem;color:#6e501c}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:24px 0}.card,.panel{background:white;border:1px solid var(--line);border-radius:8px}.card{padding:19px 20px}.card span{font-size:.82rem;color:var(--muted)}.card b{display:block;font-size:2.05rem;line-height:1.25;font-variant-numeric:tabular-nums}.card p{font-size:.84rem;color:var(--muted);margin-top:7px}.panel{padding:22px;margin-top:18px}.split{display:grid;grid-template-columns:1fr 1fr;gap:20px}.tag{display:inline-block;border-radius:4px;padding:2px 8px;border:1px solid;font-size:.74rem;font-weight:700;vertical-align:middle}.partial{background:#fff5df;color:#765109;border-color:#ddc790}.proof{background:#e7f4ee;color:#205c40;border-color:#8ebea4}.open{background:#edf2f6;color:#405c72;border-color:#a9becd}.formula{font-family:ui-monospace,Consolas,monospace;background:#f3f6f8;padding:12px;border-radius:5px;font-size:.88rem;overflow-wrap:anywhere;margin:12px 0}.small{font-size:.85rem;color:var(--muted)}.domain{width:100%;max-height:170px;margin-top:10px}svg text{font-family:system-ui,sans-serif;font-size:12px;fill:#4e6374}.controls{display:flex;gap:12px;align-items:end;margin:16px 0}.controls label{display:block;font-size:.8rem;font-weight:650}.controls .search{flex:1}input,select,button{font:inherit;border:1px solid #9fb2c2;border-radius:5px;background:#fff;color:var(--ink);min-height:42px;padding:8px 11px}input{width:100%}button{cursor:pointer}button:hover{background:#edf4f8}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #247bbb;outline-offset:3px}.count{font-size:.85rem;color:var(--muted);margin-bottom:10px}.table-wrap{overflow:auto;max-width:100%}table{border-collapse:collapse;width:100%;font-size:.85rem}caption{text-align:left;font-weight:650;margin-bottom:9px}th{text-align:left;color:#456075;font-size:.76rem;background:#f3f6f8}th,td{padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:top}td:first-child{font-weight:650;min-width:180px}td button{font-size:.83rem;min-height:36px;padding:4px 7px}.bar{display:block;background:#e7eef3;height:5px;width:110px;margin-top:6px}.bar>i{display:block;background:var(--blue);height:100%}.nodes{max-width:180px;overflow-wrap:anywhere;font-family:ui-monospace,Consolas,monospace;font-size:.78rem}.empty{padding:22px;color:var(--muted);background:#f3f6f8;display:none}.blockers{padding-left:20px;font-size:.88rem;margin:12px 0}.blockers li+li{margin-top:8px}details{margin-top:14px}summary{cursor:pointer;font-size:.88rem;font-weight:650;min-height:36px}pre{font-size:.78rem;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f6f8;padding:14px;border-radius:5px;max-height:450px;overflow:auto}footer{margin-top:24px;color:var(--muted);font-size:.79rem}.hashes{display:grid;grid-template-columns:180px 1fr;gap:6px 12px;font-size:.8rem;margin-top:14px}.hashes dt{font-weight:650}.hashes dd{margin:0;overflow-wrap:anywhere;font-family:ui-monospace,Consolas,monospace}#selected-label{margin:14px 0 8px;font-size:.9rem}#selected-family{margin:0}.no-script{border:2px solid #a6740b;padding:14px}
@media(max-width:720px){main{padding:23px 16px 40px}.cards{gap:9px}.card{padding:13px 10px}.card b{font-size:1.6rem}.card span{font-size:.75rem}.card p{font-size:.75rem}.panel{padding:17px 14px}.split{grid-template-columns:1fr;gap:20px}.controls{flex-wrap:wrap}.controls .search{flex-basis:100%}.hashes{grid-template-columns:1fr;gap:2px}.hashes dd{margin-bottom:8px}.frontier{padding:12px}.table-wrap{border:1px solid var(--line);border-radius:5px}table{min-width:750px}}
@media print{body{background:white}main{padding:0;max-width:none}.controls{display:none}.panel,.card{break-inside:avoid}.table-wrap{overflow:visible}pre{max-height:none}.bar{print-color-adjust:exact}details{display:block}}
</style></head>
<body><main>
<header><p class="eyebrow">MATHSCOPE · M3 / N6 · ORIGINAL SOURCE EVIDENCE</p><h1>157개 자연급수 호출의<br>함수족과 열린 복소 정의역</h1><p class="intro">원본 SQLite Picard 그래프의 실제 호출을 같은 인자별로 묶어 확인합니다. 함수족 분류, 조건부 급수 수렴, 원본 계수 전체의 공통 정의역·노름 증명을 각각 표시합니다.</p></header>
<div class="frontier" role="note"><strong>N6-01 OPEN · N6-02 PARTIAL · M3 56/64</strong><p>남은 원본 의무 1,288개: Cartesian Jet 230 · 전역 Guard 38 · PDE 잔여항 1,020. 이 분석에서 공식 소거한 의무는 0개입니다.</p></div>
<noscript><p class="no-script">JavaScript가 꺼져 있어 원본 데이터 표를 표시할 수 없습니다. 이 HTML과 함께 보존된 native-domain-inventory.json을 확인하세요.</p></noscript>
<div class="cards"><section class="card"><span>원본 계수 그래프</span><b>3,679</b><p>A0 · A1 · forcing의 고유 노드</p></section><section class="card"><span>확인한 함수 호출</span><b>216</b><p>자연급수 157 · inverse 33 · log 21 · sqrt 5</p></section><section class="card"><span>서로 다른 급수 인자족</span><b id="family-count">—</b><p id="family-summary">원본 인자를 읽는 중</p></section></div>
<section class="panel split" aria-labelledby="domain-heading"><div><h2 id="domain-heading">실제 분모의 복소 상계</h2><span class="tag proof">정확 유리수 증명 · node 1953</span><p class="formula">L(η) = 1 − 2hη²<br>0 &lt; h &lt; 1/100<br>dist(η, [−1, 1]) &lt; 1/4<br>|L(η)| &gt; 31/32 · |1/L(η)| &lt; 32/31</p><p class="small">h의 범위는 가정입니다. 이 분모의 역원 증명은 다른 분모, 로그, 제곱근, 자연급수의 정의역 증명을 대신하지 않습니다.</p></div><div><h3>η 공통 근방의 형태</h3><svg class="domain" viewBox="0 0 460 165" role="img" aria-label="실수 구간 마이너스 1부터 1까지에서 거리가 1/4 미만인 복소 스타디움의 개념도"><rect x="77" y="34" width="306" height="78" rx="39" fill="#edf5fa" stroke="#5692b8" stroke-width="2" stroke-dasharray="5 4"/><path d="M38 73 H422 M230 14 V143" stroke="#b6c4cf"/><path d="M116 73 H344" stroke="#185c8c" stroke-width="4"/><circle cx="116" cy="73" r="4" fill="#185c8c"/><circle cx="344" cy="73" r="4" fill="#185c8c"/><text x="107" y="96">−1</text><text x="340" y="96">1</text><text x="236" y="140">Re η</text><text x="236" y="22">Im η</text><text x="121" y="152">도식 · 열린 경계 · 그림으로 인증하지 않음</text><path d="M344 27 V65" stroke="#5692b8"/><text x="355" y="44">1/4</text></svg><p class="small">이 근방에서는 |η| &lt; 5/4입니다. 전체 Picard 계수의 공통 정칙성·균일 노름은 아래 함수족별 인자와 분기 의무를 추가로 확인해야 합니다.</p></div></section>
<section class="panel" aria-labelledby="scope-heading"><h2 id="scope-heading">현재 증거의 범위</h2><div class="split"><div><span class="tag partial">조건부 급수 수렴</span><p id="lemma-summary" class="small" style="margin-top:10px">원본 계수·분기 전제가 남아 있습니다.</p><p id="lemma-domain" class="formula"></p><details><summary>정확한 급수 수렴 근거와 가정</summary><pre id="lemma-detail"></pre></details></div><div><span class="tag open">전체 Picard 계수 · 미증명</span><p id="norm-summary" class="small" style="margin-top:10px">A0/A1/forcing 전체 공통 복소 정의역, 균일 노름 및 원본 전체 Picard 수렴은 인증되지 않았습니다.</p><p id="argument-summary" class="small" style="margin-top:10px"></p><details><summary>전체 계수와 Picard 연결 상태</summary><pre id="norm-detail"></pre></details></div></div><details><summary>실제 미분 차수별 조건부 균일 노름 · 정확 유리수 상계</summary><p class="small">각 상계는 Q · ρ^(−m)을 곱해야 합니다. Q와 ρ 및 실제 계수의 호환되는 jet 노름은 가정이며, 아래 값은 실제 원본 계수 노름의 인증값이 아닙니다.</p><div class="table-wrap"><table><caption>∂Y^k ∂η^m 자연급수의 조건부 상계</caption><thead><tr><th scope="col">k (Y 미분)</th><th scope="col">m (η 미분)</th><th scope="col">노름 상계 / (Q · ρ^(−m))</th><th scope="col">꼬리 차수</th><th scope="col">꼬리 상계 / (Q · ρ^(−m))</th></tr></thead><tbody id="conditional-bounds"></tbody></table></div></details></section>
<section class="panel" aria-labelledby="inverse-heading"><h2 id="inverse-heading">추가 역원 상계와 영역 반례</h2><p id="inverse-summary" class="small">전체 역원 호출의 증명 결과를 원본 node ID와 함께 확인합니다.</p><details><summary>인증된 개별 역원과 정확한 상계</summary><pre id="inverse-detail"></pre></details><details><summary>후보 공통 영역 · 반례와 남은 전제</summary><pre id="candidate-detail"></pre></details><p class="small" style="margin-top:12px">스타디움과 |η| &lt; 5/4 원판은 서로 다른 영역입니다. |η| 상계만으로 원판 전체에 정칙성이 따라오지 않습니다. 조건부 급수 노름의 후보 튜브 역시 위의 1/4 스타디움과 구분합니다.</p></section>
<section class="panel" aria-labelledby="families-heading"><h2 id="families-heading">급수 인자족별 원본 호출</h2><p class="small">막대 길이는 호출 수만 나타냅니다. 실수 Y 범위 확인은 실제 실수 인자와 적분 경로의 |Y| ≤ 5 확인입니다. 급수 정칙성 및 복소 영역 배치 증명과 구분합니다. 각 행에서 실제 node ID와 인자 분류·전제를 확인할 수 있습니다.</p><div class="controls"><div class="search"><label for="search">함수족 · 원본 node ID · 인자 검색</label><input id="search" type="search" placeholder="예: Y node 또는 Phi" autocomplete="off"></div><div><label for="coverage-filter">실수 Y 인자 범위</label><select id="coverage-filter"><option value="all">전체 함수족</option><option value="proved">실수 Y 범위 확인</option><option value="open">실수 Y 범위 미확인</option></select></div><button id="reset" type="button">검색 초기화</button></div><p id="visible-count" class="count" aria-live="polite"></p><div class="table-wrap"><table><caption>같은 (Y, η) 인자를 공유하는 급수 호출</caption><thead><tr><th scope="col">함수족 / 호출 수</th><th scope="col">성분 · (Y, η) 미분 차수</th><th scope="col">실수 Y 인자와 범위</th><th scope="col">η 인자와 공통 근방</th><th scope="col">원본 호출 노드</th></tr></thead><tbody id="family-rows"></tbody></table></div><p class="empty" id="empty">검색 조건에 해당하는 함수족이 없습니다.</p><p id="selected-label" aria-live="polite">함수족을 선택하면 모든 인자·증명 상태를 표시합니다.</p><pre id="selected-family" hidden></pre></section>
<section class="panel" aria-labelledby="blockers-heading"><h2 id="blockers-heading">남은 해석적 연결 의무</h2><ul id="blockers" class="blockers"></ul><p class="small">동일한 함수족의 여러 호출을 분류했다고 전역 Guard나 PDE 잔여항이 소거되지는 않습니다. 이 결과는 고정 차수 n = 1의 실제 계수 그래프를 대상으로 합니다.</p></section>
<section class="panel" aria-labelledby="source-heading"><h2 id="source-heading">검증한 원본 출처</h2><p class="small">뷰는 함께 생성한 JSON을 내장합니다. 네트워크 요청·외부 라이브러리 없이 열 수 있으며, 표의 node ID는 원본 그래프 ID입니다.</p><dl id="hashes" class="hashes"></dl><details><summary>전체 기계 판독 결과</summary><pre id="all-data"></pre></details></section>
<footer>MathScope M3 · Picard 실제 원본 증거 뷰. 원본 N6 판정은 유지합니다. CI 성공은 표시된 수학적 미증명 의무를 완료하지 않습니다.</footer>
</main>
<script id="audit-data" type="application/json">__AUDIT_JSON__</script>
<script>
"use strict";
const data=JSON.parse(document.getElementById("audit-data").textContent);
const inventory=data.naturalSeriesFamilyInventory;
const families=inventory.families;
const $=id=>document.getElementById(id);
const pretty=value=>JSON.stringify(value,null,2);
const valueText=value=>value==null?"미증명":typeof value==="object"?JSON.stringify(value):String(value);
const isProved=family=>family.radialDomain?.status==="PROVED_ARGUMENT_RANGE_ONLY";
const maxCount=Math.max(...families.map(f=>f.callCount));
$("family-count").textContent=families.length;
$("family-summary").textContent="157개 호출을 중복 없이 분류 · 성분 "+Object.entries(inventory.summary.componentCounts||{}).map(([k,v])=>`${k} ${v}`).join(" · ");
$("lemma-summary").textContent=inventory.convergenceLemma?.summary||"157개 호출의 미분 차수에 대해, 계수의 호환되는 jet 노름과 인자 배치 전제하의 수렴·노름 함의를 증명했습니다. 실제 원본의 Q·ρ 노름 및 공통 영역 배치는 미증명입니다.";
$("lemma-detail").textContent=pretty(inventory.convergenceLemma||{});
$("lemma-domain").textContent=inventory.convergenceLemma?.domain||"조건부 복소 영역을 확인하세요";
$("argument-summary").textContent=`실제 Y 인자 범위 확인 ${inventory.summary.exactArgumentDomainProvedCalls} / 157개 호출 · 미확인 ${inventory.summary.argumentDomainUnresolvedCalls}개. 실제 급수 정칙성 인증 0 / 157개.`;
for(const bound of inventory.convergenceLemma?.boundsForActualDerivativeOrders||[]){const row=document.createElement("tr");for(const key of ["radialOrder","etaOrder","scaledSupNormUpper","degree","scaledTailUpper"])cell(row,valueText(bound[key]));$("conditional-bounds").append(row);}
const inverseLeaves=data.nativeComplexInverseLeaves||[];
$("inverse-summary").textContent=`${inverseLeaves.length}개 개별 역원의 추가 증거 · ${33-inverseLeaves.length}개 나머지 역원의 전제가 남음. 전체 공통 계수 노름은 미증명입니다.`;
$("inverse-detail").textContent=pretty(inverseLeaves);
$("candidate-detail").textContent=pretty(data.candidateCommonComplexDomain||{});
$("norm-detail").textContent=pretty({nativeA0A1ForcingCommonHolomorphicStripProved:data.nativeA0A1ForcingCommonHolomorphicStripProved,nativeA0A1ForcingUniformComplexSupNormProved:data.nativeA0A1ForcingUniformComplexSupNormProved,sameProfileM2PicardNormTransferredToAllOriginalN6:data.sameProfileM2PicardNormTransferredToAllOriginalN6,summary:inventory.summary,picard:inventory.picardConvergence||data.picardConvergence||data.actualPicardConvergence||null});
$("all-data").textContent=pretty(data);
for(const [name,value] of Object.entries(data.source||{})){const dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=name;dd.textContent=valueText(value);$("hashes").append(dt,dd);}
for(const blocker of inventory.blockers||[]){const li=document.createElement("li");li.textContent=valueText(blocker);$("blockers").append(li);}
function selectFamily(family){$("selected-label").textContent=`${family.id} · ${family.callCount}개 원본 호출의 인자와 증거`;$("selected-family").hidden=false;$("selected-family").textContent=pretty(family);}
function cell(row,text){const td=document.createElement("td");td.textContent=text;row.append(td);return td;}
function syncHash(){const state=new URLSearchParams();if($("search").value)state.set("q",$("search").value);if($("coverage-filter").value!=="all")state.set("coverage",$("coverage-filter").value);history.replaceState(null,"",location.pathname+location.search+(state.size?"#"+state:""));}
function renderRows(){const query=$("search").value.trim().toLowerCase(),filter=$("coverage-filter").value;const shown=families.filter(f=>(!query||pretty(f).toLowerCase().includes(query))&&(filter==="all"||(filter==="proved"?isProved(f):!isProved(f))));$("family-rows").replaceChildren();for(const family of shown){const row=document.createElement("tr"),label=cell(row,"");const button=document.createElement("button");button.type="button";button.textContent=`${family.id} · ${family.callCount}개`;button.setAttribute("aria-label",`${family.id} 함수족 상세 보기`);button.addEventListener("click",()=>selectFamily(family));label.append(button);const bar=document.createElement("span"),fill=document.createElement("i");bar.className="bar";bar.setAttribute("aria-hidden","true");fill.style.width=100*family.callCount/maxCount+"%";bar.append(fill);label.append(bar);cell(row,Object.entries(family.componentCounts||{}).map(([name,count])=>`${name} ${count}`).join(" · ")+" / "+(family.derivativeOrders||[]).map(order=>`(${order.join(", ")})`).join(" "));cell(row,`node ${family.YSourceNode} · ${family.YStructuralClass||"분류 없음"}\n${isProved(family)?`Y 범위 확인 · |Y| ≤ ${family.radialDomain.absoluteBound}`:"Y 범위 미확인"}`);cell(row,`node ${family.etaSourceNode} · ${family.etaDomain?.status==="EXACT_SYSTEM_ETA_COORDINATE"?"실제 η 좌표":"η 인자 미확인"}\n1/4 스타디움의 급수 정칙성 미증명`);const nodes=cell(row,family.sourceNodes.join(", "));nodes.className="nodes";$("family-rows").append(row);}$("visible-count").textContent=`${shown.length} / ${families.length}개 함수족 · ${shown.reduce((s,f)=>s+f.callCount,0)} / 157개 호출`;$("empty").style.display=shown.length?"none":"block";syncHash();}
function restoreHash(){const state=new URLSearchParams(location.hash.slice(1));$("search").value=state.get("q")||"";$("coverage-filter").value=["proved","open"].includes(state.get("coverage"))?state.get("coverage"):"all";renderRows();}
$("search").addEventListener("input",renderRows);$("coverage-filter").addEventListener("change",renderRows);$("reset").addEventListener("click",()=>{$("search").value="";$("coverage-filter").value="all";renderRows();$("search").focus();});window.addEventListener("hashchange",restoreHash);restoreHash();
document.documentElement.dataset.picardViewReady="true";
</script></body></html>
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    data = json.loads(args.input.read_text(encoding="utf-8"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render(data), encoding="utf-8")
    print(json.dumps({"view": str(args.output), "familyCount":
                      len(data["naturalSeriesFamilyInventory"]["families"]),
                      "originalFrontierAdvanced": False}))


if __name__ == "__main__":
    main()
