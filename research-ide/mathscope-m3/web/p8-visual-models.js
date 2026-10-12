/* Display adapters consume actual P8 execution output. They never issue certificates. */
(()=>{'use strict';
  const VIEWS=['degree-basis-valuation','hodge-newton','prime-degree-frobenius','refinement-tower','comparison-diagram'];
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const exactInteger=v=>typeof v==='number'&&Number.isSafeInteger(v)?BigInt(v):typeof v==='string'&&/^-?\d{1,1024}$/.test(v)?BigInt(v):null;
  function display(v){if(finite(v))return v;const n=exactInteger(v);if(n===null)return null;const x=Number(n);return Number.isFinite(x)?x:null;}
  function rational(a,b){const n=display(a),d=display(b);return n!==null&&d!==null&&d!==0&&Number.isFinite(n/d)?n/d:null;}
  function valuation(value,prime){let v=exactInteger(value),p=exactInteger(prime);if(v===null||p===null||p<2n||v===0n)return null;if(v<0n)v=-v;let n=0;while(v%p===0n){v/=p;n++;if(n>4096)return null;}return n;}
  const axis=(label,type='numeric',unit='')=>({label,type,unit});
  const clone=value=>JSON.parse(JSON.stringify(value));
  function empty(view){return{schema:'MathScope.M3.P8.VisualModel/1',view,title:'실행된 구조를 기다립니다',status:'NOT_RUN',axes:[axis('X'),axis('Y'),axis('Z')],points:[],lines:[],table:{columns:['항목','정확한 기록','출처'],rows:[]},omissions:[],provenance:[],visualApproximation:true,certificateIssued:false,formalComplete:false,proofStatusPromoted:false};}
  function build({record,view}={}){
    view=view||record?.request?.input?.view||'degree-basis-valuation';if(!VIEWS.includes(view))throw Error('지원하지 않는 P8 좌표 계약입니다.');const model=empty(view);
    if(!record){model.omissions.push('먼저 실제 계산을 실행하세요. 실행 전 값을 0이나 예제 그림으로 채우지 않습니다.');return model;}
    if(record.schema!=='MathScope.M3.P8.Execution/1'||record.execution?.status!=='COMPLETED')throw Error('완료된 P8 실행 기록이 필요합니다.');
    if(record.scope?.wholeM3Complete===true||record.scope?.wholeP8Complete===true||record.scope?.proofStatusPromoted===true)throw Error('시각화는 전체 완료나 증명 권한 승격을 허용하지 않습니다.');
    const inherited=record.result?.inheritedM2,data=inherited?.results;
    const source=fieldPath=>({fieldPath,inputSHA256:record.inputSHA256,recordSHA256:record.recordSHA256,sourceBinding:record.sourceBinding,inheritedResultHash:inherited?.resultHash,inheritedSourceHash:inherited?.provenance?.sourceHash,adapterVerification:'DISPLAY_ONLY_NOT_AN_AUTHORITY_CHECK'});
    const row=(label,value,path)=>model.table.rows.push([label,clone(value),source(path)]);
    const point=(label,position,exact,path,role='data')=>{if(!position.every(finite)){model.omissions.push(label+'의 유한 표시 좌표를 만들 수 없습니다. 정확한 값은 표에 유지합니다.');return;}model.points.push({id:'p8-point-'+model.points.length,label,position,exact:clone(exact),source:source(path),role});};
    const line=(label,vertices,exact,path,role='data')=>{if(vertices.length<2||!vertices.every(p=>p.length===3&&p.every(finite)))return;model.lines.push({id:'p8-line-'+model.lines.length,label,vertices:vertices.map(p=>p.slice()),exact:clone(exact),source:source(path),role});};
    model.provenance.push(source('result'));model.status='RECORDED_EXECUTION_DISPLAY';
    if(view==='comparison-diagram'){
      const diagram=record.result?.diagram||record.result?.comparison||record.result,path=record.result?.diagram?'result.diagram':record.result?.comparison?'result.comparison':'result';
      const invalidEdges=new Set([...(record.result?.validation?.invalidEdgeIds||[]),...(record.result?.invalidation?.invalidEdgeIds||[]),...(record.result?.replayAfterRemoval?.invalidEdgeIds||[])]),invalidNodes=new Set(record.result?.invalidation?.invalidNodeIds||[]);
      model.title='조건이 붙은 비교 사상';model.axes=[axis('노드 순서 · 개념 배치','schematic'),axis('계수환 범주','schematic'),axis('base 범주','schematic')];
      if(!Array.isArray(diagram?.nodes)||!Array.isArray(diagram?.edges)){model.omissions.push('이 실행에는 비교 diagram이 없습니다. P8-03 비교 예제를 실행하세요.');}
      else{
        const positions=new Map(),rings=new Map(),bases=new Map(),category=(map,value)=>{const key=JSON.stringify(value??null);if(!map.has(key))map.set(key,map.size);return map.get(key);};
        diagram.nodes.slice(0,64).forEach((node,i)=>{const p=[i,category(rings,node.coefficientRingRef||node.coefficientRing),category(bases,node.baseRef)],invalid=invalidNodes.has(node.id);positions.set(node.id,p);point((invalid?'[STALE] ':'')+(node.label||node.id),p,node,path+'.nodes['+i+']',invalid?'open':'reference');row(node.id,node,path+'.nodes['+i+']');});
        diagram.edges.slice(0,96).forEach((edge,i)=>{const a=positions.get(edge.from||edge.source),b=positions.get(edge.to||edge.target),invalid=invalidEdges.has(edge.id)||edge.valid===false;if(a&&b){line((invalid?'[STALE] ':'')+(edge.operation||edge.type||edge.id),[a,b],edge,path+'.edges['+i+']',invalid?'open':'reference');model.lines.at(-1).directed=true;}row(edge.id||'사상 '+i,edge,path+'.edges['+i+']');});
        if(invalidEdges.size||invalidNodes.size){model.status='COMPARISON_STALE';model.omissions.push('반환된 검증에서 무효가 된 사상 '+invalidEdges.size+'개를 STALE 점선으로 표시합니다. 원래 diagram과 가정 변경 후 검증 결과를 함께 읽으세요.');if(record.result.invalidation)row('가정 변경으로 무효가 된 경로',record.result.invalidation,'result.invalidation');if(record.result.replayAfterRemoval)row('가정 제거 후 새 검증',record.result.replayAfterRemoval,'result.replayAfterRemoval');}
        model.omissions.push('노드의 화면 위치는 연결을 읽기 위한 개념 배치입니다. 거리·각도는 사상이나 공간의 수학적 성질이 아닙니다.');
      }
    }else if(!inherited||inherited.schema!=='MathScope.M2.ArithmeticResult/1'||inherited.status!=='COMPLETED'||!data){
      model.omissions.push('선택한 좌표 계약에 필요한 완료된 M2 산술 결과가 없습니다. 해당 구조 예제를 실제 실행하세요.');
    }else if(view==='degree-basis-valuation'){
      model.title='차수 · 기저 · Frobenius 값매김';model.axes=[axis('cohomological degree','numeric','차수'),axis('기저 인덱스','category'),axis('v_p(F eigenvalue)','numeric','v_p(p)=1')];
      const comparison=data.finitePerfectComparison,terms=comparison?.finitePerfectComplex?.terms,p=data.object?.p||inherited.request?.input?.p;
      if(Array.isArray(terms))for(let i=0;i<terms.length;i++){
        const term=terms[i];row('H^'+term.degree,term,'result.inheritedM2.results.finitePerfectComparison.finitePerfectComplex.terms['+i+']');
        for(let j=0;j<(term.basis||[]).length;j++){
          const column=(term.frobenius||[]).map(r=>r[j]),eigenvalue=term.rank===1?column[0]:null,v=valuation(eigenvalue,p),details={term,basis:term.basis[j],matrixColumn:column,comparisonMap:comparison.comparisonMap,sourceTheorem:comparison.comparisonMap?.quasiIsomorphismSource};
          if(v===null){model.omissions.push('H^'+term.degree+'의 단일 eigenvalue 값매김이 주어지지 않았습니다. 행렬 열을 원본에서 확인하세요.');continue;}
          point(term.basis[j]+' ∈ H^'+term.degree,[term.degree,j,v],details,'result.inheritedM2.results.finitePerfectComparison.finitePerfectComplex.terms['+i+']');
        }
      }else model.omissions.push('이 결과에는 유한 perfect complex의 기저와 Frobenius 행렬이 없습니다.');
      model.omissions.push('각 축은 별도 산술 속성입니다. 원래 projective 공간의 3차원 매장이나 동형을 뜻하지 않습니다.');
    }else if(view==='hodge-newton'){
      model.title='Hodge와 Newton의 누적 기울기';model.axes=[axis('누적 차원','numeric'),axis('누적 기울기','numeric','v_p(p)=1'),axis('polygon 종류','category','0=Hodge, 1=Newton')];
      const h=data.hodge?.hodgeDegrees,n=data.newton?.rootValuations;
      for(const [values,lane,name,path]of [[h,0,'Hodge','hodge.hodgeDegrees'],[n,1,'Newton','newton.rootValuations']]){
        if(!Array.isArray(values)){model.omissions.push(name+' 기울기가 이 결과에 없습니다.');continue;}
        const slopes=values.map(x=>typeof x==='object'&&x?rational(x.numerator,x.denominator):display(x));row(name+' 원본 기울기',values,'result.inheritedM2.results.'+path);
        if(!slopes.every(finite)){model.omissions.push(name+'의 표시 좌표 변환을 생략했습니다.');continue;}
        const sorted=slopes.slice().sort((a,b)=>a-b),vertices=[[0,0,lane]];let sum=0;sorted.forEach((v,i)=>{sum+=v;vertices.push([i+1,sum,lane]);});
        const details={originalSlopes:values,displayDerivation:'Sort the recorded slopes and take cumulative sums; Float64 display only.',polynomialConvention:data.newton?.normalization};
        vertices.forEach((p,i)=>point(name+' 꼭짓점 '+i,p,details,'result.inheritedM2.results.'+path,lane?'comparison':'data'));line(name,vertices,details,'result.inheritedM2.results.'+path,lane?'comparison':'data');
      }
      if(data.newton?.hull)row('원래 계수 Newton hull',data.newton,'result.inheritedM2.results.newton');
      model.omissions.push('계수 다항식의 아래 convex hull과 부호가 반대인 root valuation 기울기를 구분합니다. 여기서는 기록된 root valuation의 누적 polygon을 그립니다.');
    }else if(view==='prime-degree-frobenius'){
      model.title='소수 · 차수 · Frobenius 가중치';model.axes=[axis('소수 p','numeric'),axis('cohomological degree','numeric'),axis('Weil weight','numeric','projective Tate class')];
      const entries=data.globalIdentity?.placeIndexedIdentity?.byPrime;
      if(Array.isArray(entries))entries.slice(0,512).forEach((entry,i)=>{
        const p=display(entry.prime),degree=display(entry.cohomologicalDegree),factor=entry.factor,eigen=Array.isArray(factor)&&factor.length===2?exactInteger(factor[1]):null;
        const vp=eigen===null?null:valuation(String(-eigen),entry.prime),weight=vp===null?null:2*vp;
        const details={localFactor:entry,eigenvalue:eigen===null?null:String(-eigen),padicValuation:vp,weightDerivation:'For the recorded projective Tate class F=p^i, its Weil weight is 2i. This relies on the stated projective comparison; it is not a general eigenvalue weight classifier.',sourceTheorem:data.finitePerfectComparison?.comparisonMap?.quasiIsomorphismSource};
        row('p='+entry.prime+' · H^'+entry.cohomologicalDegree,details,'result.inheritedM2.results.globalIdentity.placeIndexedIdentity.byPrime['+i+']');
        if(inherited.kind==='arithmetic.projective'&&weight===degree)point('p='+entry.prime+' · H^'+degree,[p,degree,weight],details,'result.inheritedM2.results.globalIdentity.placeIndexedIdentity.byPrime['+i+']');
      });else model.omissions.push('projective Tate class의 소수별·차수별 local factor가 없습니다.');
      model.omissions.push('가중치 해석은 이 projective 비교 모형의 외부 정리에 한정됩니다. 복소각을 p-adic 값매김으로 사용하지 않습니다.');
    }else if(view==='refinement-tower'){
      model.title='유한 root prefix와 refinement';model.axes=[axis('root level','numeric'),axis('선택한 호환 열','category'),axis('log_p v_p(root)','numeric','정확한 값 -level')];
      const vertices=[];if(Array.isArray(data.levels))data.levels.slice(0,64).forEach((entry,i)=>{
        const p=exactInteger(data.base?.p),den=exactInteger(entry.valuationDenominator),level=display(entry.level),consistent=p!==null&&p>=2n&&Number.isSafeInteger(level)&&level>=0&&level<=64&&exactInteger(entry.valuationNumerator)===1n&&den===p**BigInt(level);
        const details={level:entry,refinement:data.finiteObservation?.refinement,prefixReduction:data.finiteObservation?.prefixReduction,sourceTheorem:data.base?.perfectoidEvidence};row('level '+entry.level,details,'result.inheritedM2.results.levels['+i+']');
        if(consistent){const pos=[level,0,-level];point(entry.symbol,pos,details,'result.inheritedM2.results.levels['+i+']');vertices.push(pos);}else model.omissions.push('level '+entry.level+'의 로그 값매김 계약을 확인할 수 없어 그리지 않았습니다.');
      });else model.omissions.push('이 결과에는 실제 계산된 호환 root prefix가 없습니다.');
      for(let i=1;i<vertices.length;i++)if(vertices[i][0]===vertices[i-1][0]+1)line('p-power 호환 관계',[vertices[i-1],vertices[i]],data.finiteObservation||{},'result.inheritedM2.results.finiteObservation','reference');
      model.omissions.push('마지막 점 이후는 SYMBOLIC_NOT_COMPUTED입니다. 유한 prefix를 완비 역극한이나 perfectoid 전체 객체로 승격하지 않습니다.');
    }
    if(!model.points.length&&!model.lines.length)model.status='NO_COMPATIBLE_EXECUTED_COORDINATES';
    model.omissions.push('시점·확대·표시 개수 변경은 표시용 변환이며 실행 기록·수학 결과·증명 상태를 변경하지 않습니다.');return model;
  }
  window.MathScopeP8VisualModels=Object.freeze({version:'1.0.0',views:VIEWS.slice(),build});
})();
