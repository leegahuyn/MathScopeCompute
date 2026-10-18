
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
