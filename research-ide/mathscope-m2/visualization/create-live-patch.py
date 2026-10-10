"""Produce precise M1 presentation-only patches. Does not write protected files."""
from pathlib import Path
import hashlib
import json
import sys

HERE=Path(__file__).resolve().parent
M1=HERE.parent.parent/'mathscope-m1'/'workspace.mjs'
source=M1.read_text()
patches=[]

def replace(old,new):
    assert source.count(old)==1,('workspace anchor is not unique',old[:160])
    patches.append({'operation':'replace','find':old,'replace':new})

replace("new Scene3D($('m1-scene'))","new window.MathScopeM2Visualization.SourceBoundScene($('m1-scene'))")
replace("function loadExample(){const ex=examples.find(e=>e.id===$('m1-example').value);if(!ex)return;",
        "function loadExample(){const ex=examples.find(e=>e.id===$('m1-example').value);if(!ex)return;selected=null;")
replace("b.addEventListener('click',()=>{selected=j.id;renderResult();renderJobs();});",
        "b.addEventListener('click',()=>{setTab(j.request.kind.split('.')[0]);selected=j.id;$('m1-input').value=pretty(j.request);text('m1-kind',j.request.kind);syncGaugeControls();renderResult();renderJobs();});")

replace("if(!selected)return;const j=engine.getJob(selected),r=j.result;", """if(!selected){
      const view=window.MathScopeM2Visualization.makeVisualization(null);scene.setVisualization(view);
      text('m1-result-status','NOT_RUN');text('m1-result-description','현재 입력의 계산을 실행하세요.');
      text('m1-result-json',{});text('m1-observation',view.description);$('m1-color-legend').hidden=true;$('m1-metrics').replaceChildren();
      const body=$('m1-observation-rows');window.MathScopeM2Visualization.renderObservationTable(body.closest('table').querySelector('thead'),body,view);
      document.getElementById('m1-observation-details')?.replaceChildren();$('m1-blockers').hidden=true;$('m1-delta-comparison').hidden=true;
      text('m1-diagnostics',{});root.dataset.resultStatus='NOT_RUN';root.dataset.resultKind='';return;
    }const j=engine.getJob(selected),r=j.result;""")

start=source.index('    const raw=r.visualization||r.values?.visualization;')
end=source.index("    text('m1-diagnostics'",start)
replace(source[start:end],"""    const visual=window.MathScopeM2Visualization;
    const view=visual.makeVisualization(j,{currentEditorMatches:currentEditorMatches(j),maxPoints:4000,maxRows:200});
    scene.setVisualization(view);
    text('m1-observation',[view.title,view.description,
      '원본 실행: '+view.binding.jobId+' · 입력 SHA-256 '+view.binding.inputHash,
      view.axisMetadata.map(a=>a.label+' ['+a.type+'; unit='+a.unit+'; '+a.transform+']').join(' · '),
      view.lod.originalPoints>view.lod.displayedPoints?'표시 표본 '+view.lod.displayedPoints+' / '+view.lod.originalPoints+' · 전 구간의 결정적 LOD; 계산 원본은 유지됩니다.':'',
      ...view.lostInformation].filter(Boolean).join('\\n'));
    const body=$('m1-observation-rows');visual.renderObservationTable(body.closest('table').querySelector('thead'),body,view);
    let detail=document.getElementById('m1-observation-details');if(!detail){detail=document.createElement('div');detail.id='m1-observation-details';body.closest('details').after(detail);}visual.renderObservationDetails(detail,view);
    const range=view.color?.range;$('m1-color-legend').hidden=!range;
    if(range)text('m1-color-range',view.color.quantity+' · '+view.color.unit+' · '+range[0]+' → '+range[1]+' · '+view.color.mode+'; 실행 간 비교에는 동일 범위와 원본 수치를 사용하세요.');
""")

replace("setTab(j.request.kind.split('.')[0]);$('m1-input').value=pretty(j.request);",
        "setTab(j.request.kind.split('.')[0]);selected=j.id;$('m1-input').value=pretty(j.request);")

# Keep exact raw results out of a previously selected observation details panel
# while a new worker job has not returned a result yet.
replace("if(!r){text('m1-result-description'", "if(!r){document.getElementById('m1-observation-details')?.replaceChildren();text('m1-result-description'")

out=HERE/'live-m1-patch.json'
out.write_text(json.dumps(patches,ensure_ascii=False,indent=2))
if len(sys.argv)>1:
    live=Path(sys.argv[1]).read_text()
    for i,p in enumerate(patches):
        assert live.count(p['find'])==1,('live anchor not unique',i,live.count(p['find']))
        live=live.replace(p['find'],p['replace'],1)
    receipt={'schema':'MathScope.M1VisualizationPatch/1','sourceReadProjectionSha256':hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest(),'readProjectionContainsRedactions':True,'readHashScope':'Provider read projection only; preserve the original runtime Worker through targeted patches and verify its runtime hash separately.','patchCount':len(patches),'allAnchorsUnique':True,'workerRebuilt':False,'protectedSourceFilesModified':False,'requires':'Load bundled visualization/global.mjs BEFORE <script id="mathscope-m1-js">','recommendedHTMLTextPatch':{'find':'표에는 앞 100개 표본을 표시합니다.','replace':'표에는 최대 200개 행을 전 구간에서 골라 표시합니다. 정확한 수치와 원본 필드를 보존합니다.'}}
    (HERE/'live-patch-audit.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
print(out)
