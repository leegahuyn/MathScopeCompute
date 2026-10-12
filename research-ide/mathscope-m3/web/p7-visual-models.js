/* MathScope P7 record-to-display adapter. Geometry is never a certificate.
 * API: MathScopeP7VisualModels.build({criterion, records, capabilities})
 *      MathScopeP7VisualModels.compactRecord(executionRecord)
 * Primitive coordinates are approximate Numbers; exact and source retain the
 * recorded quantities and original record references. No backend is run here.
 */
((host) => {
  'use strict';
  const SCHEMA = 'MathScope.M3.P7VisualModel/1';
  const EXECUTION = 'MathScope.M3.P7Execution/1';
  const COMPACT = 'MathScope.M3.P7VisualRecord/1';
  const COLORS = {primary:'#55d8d0', comparison:'#a78bfa', open:'#f3b95f', reference:'#7caaf5', negative:'#ff8d9e'};
  const TITLES = {
    'P7-01':'국소 인자와 전역 정규화', 'P7-02':'해석적 함수와 보장 구간',
    'P7-03':'유한 높이 영점과 전체 개수', 'P7-04':'명시적 공식과 독립 소수측',
    'P7-05':'연산자 기준 예제와 반증 검사', 'P7-06':'중심값·도함수와 해석적 rank',
    'P7-07':'유리점 배수와 남은 산술 인증', 'P7-08':'계산·가정·미해결 조건 연결'
  };
  const clone = value => value === undefined ? null : JSON.parse(JSON.stringify(value));
  const arr = value => Array.isArray(value) ? value : [];
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const vector = value => Array.isArray(value) && value.length === 3 && value.every(finite);
  const obj = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const label = value => typeof value === 'string' ? value : String(value ?? '미기록');
  const INT = /^-?(?:0|[1-9]\d*)$/;
  const MAX_DIGITS = 20000;
  const scaleBinary = (value,power) => power < -1022 ? (value*2**-1022)*2**(power+1022) : power > 1023 ? (value*2**1023)*2**(power-1023) : value*2**power;

  // Avoid Number(huge mantissa) * 2**exponent producing Infinity * 0.
  // This conversion is for pixels only, not a directed mathematical bound.
  function binaryApprox(integer, exponent = 0) {
    if (typeof integer !== 'string' || integer.length > MAX_DIGITS || !INT.test(integer) || !Number.isSafeInteger(exponent)) return null;
    let n;
    try { n = BigInt(integer); } catch (_) { return null; }
    if (n === 0n) return 0;
    const sign = n < 0n ? -1 : 1;
    if (n < 0n) n = -n;
    const shift = Math.max(0, n.toString(2).length - 53);
    const top = Number(n >> BigInt(shift));
    const power = exponent + shift;
    // Split subnormal exponent scaling so a representable result is not lost.
    const value = sign * scaleBinary(top,power);
    return Number.isFinite(value) ? value : null;
  }

  function approximate(value) {
    if (finite(value)) return value;
    if (obj(value) && typeof value.mantissa === 'string' && typeof value.exponent === 'string' && INT.test(value.exponent)) {
      const exponent = Number(value.exponent);
      return Number.isSafeInteger(exponent) ? binaryApprox(value.mantissa, exponent) : null;
    }
    if (typeof value !== 'string' || value.length > MAX_DIGITS) return null;
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length !== 2 || !parts.every(v => INT.test(v))) return null;
      let n, d;
      try { n = BigInt(parts[0]); d = BigInt(parts[1]); } catch (_) { return null; }
      if (d === 0n) return null;
      if (n === 0n) return 0;
      const sign = (n < 0n) !== (d < 0n) ? -1 : 1;
      if (n < 0n) n = -n;
      if (d < 0n) d = -d;
      const ns = Math.max(0, n.toString(2).length - 53), ds = Math.max(0, d.toString(2).length - 53);
      const ratio = Number(n >> BigInt(ns)) / Number(d >> BigInt(ds));
      const v = sign * scaleBinary(ratio,ns-ds);
      return Number.isFinite(v) ? v : null;
    }
    if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function bounds(value) {
    if (!obj(value) || value.kind === 'nonfinite') return null;
    const lower = approximate(value.lower), upper = approximate(value.upper);
    return lower !== null && upper !== null && lower <= upper ? {lower, upper, middle:lower/2+upper/2} : null;
  }

  function source(record, fieldPath) {
    return {
      fieldPath,
      inputSHA256:record.inputSHA256 ?? null,
      requestSHA256:record.inputSHA256 ?? null,
      recordSHA256:record.recordSHA256 ?? null,
      mathematicalSHA256:record.mathematicalSHA256 ?? null,
      request:clone(record.request),
      sourceBinding:clone(record.sourceBinding),
      archiveReference:record.visualSource?.archiveURL ?? record.visualArchive?.archiveReference ?? null,
      archiveURL:record.visualSource?.archiveURL ?? record.visualArchive?.archiveReference ?? null,
      origin:record.visualRecordSchema === COMPACT || record.visualSource?.mode === 'ARCHIVED_EXAMPLE' ? 'ARCHIVED_EXECUTION_EXAMPLE' : record.visualSource?.mode === 'CURRENT_SERVER_RESULT' ? 'CURRENT_SERVER_RESULT' : 'EXECUTION_RECORD',
      visualSource:clone(record.visualSource),
      currentServerResult:record.visualRecordSchema !== COMPACT && record.visualSource?.mode === 'CURRENT_SERVER_RESULT' && record.visualSource?.current === true,
      verification:'NOT_PERFORMED_BY_VISUAL_ADAPTER',
      originalRecordHashIsCompactedPayloadHash:false
    };
  }

  function compactZero(zero) {
    if (!obj(zero)) return clone(zero);
    const copy = clone({...zero, contour:undefined});
    if (obj(zero.contour)) {
      const {cells, ...smallContour} = zero.contour;
      copy.contour = clone(smallContour);
      copy.visualOmissions = {contourCellCount:Array.isArray(cells)?cells.length:zero.visualOmissions?.contourCellCount ?? 0, wholeTubeEvidence:'See original full record; cells omitted from display seed.'};
    }
    return copy;
  }

  function compactRecord(record) {
    if (!validEnvelope(record)) throw Error('지원되는 P7 실행 기록이 필요합니다.');
    const r = record.result;
    let result = r === null || r === undefined ? null : clone({...r, zeroCertificate:undefined, contour:undefined});
    if (obj(r?.zeroCertificate)) result.zeroCertificate = compactZero(r.zeroCertificate);
    if (obj(r?.contour)) result = compactZero(r);
    const copy = clone({...record, result:undefined});
    copy.result = result;
    copy.visualRecordSchema = COMPACT;
    copy.visualSource = {mode:'ARCHIVED_EXAMPLE', archiveURL:record.visualSource?.archiveURL ?? record.visualArchive?.archiveReference ?? null, title:record.visualSource?.title ?? '저장된 실행 예제', current:false};
    copy.visualArchive = {
      origin:'ARCHIVED_EXECUTION_EXAMPLE',
      label:'저장된 실행 예제 · 현재 서버에서 재검증한 결과가 아닙니다.',
      originalRecordSHA256:record.recordSHA256 ?? null,
      originalInputSHA256:record.inputSHA256 ?? null,
      archiveReference:record.visualArchive?.archiveReference ?? null,
      currentLiveVerification:false,
      compactedPayloadHasOriginalRecordHash:false,
      fullCertificateRetainedInOriginalArchive:true,
      proofStatusPromoted:false
    };
    return copy;
  }

  function validEnvelope(record) {
    return obj(record) && record.schema === EXECUTION && obj(record.request) && obj(record.execution) &&
      record.serializedAuthority === 'UNTRUSTED_REQUIRES_REEXECUTION' &&
      record.formalLeanProofIssued === false && record.wholeP7Complete === false && record.wholeM3Complete === false &&
      (!record.visualRecordSchema || record.visualRecordSchema === COMPACT);
  }

  function blank(criterion, capabilities) {
    const c = arr(capabilities?.progress?.criteria || capabilities?.criteria).find(row => row.id === criterion);
    return {
      schema:SCHEMA, criterion, title:TITLES[criterion] || '지원되지 않는 P7 기준',
      status:'NOT_RUN', criterionStatus:c?.status ?? null,
      axes:[], points:[], lines:[], meshes:[], enclosures:[], labels:[], omissions:[], provenance:[],
      table:{columns:['항목','정확한 기록','범위·상태'], rows:[]},
      summary:'인증 결과의 정확한 데이터와 3D 표시용 좌표를 구분합니다.',
      visualApproximation:true, certificateIssued:false, proofStatusPromoted:false,
      formalLeanProofIssued:false, wholeP7Complete:false, wholeM3Complete:false,
      displayNotice:'3D 좌표·선·면은 표시용 근사입니다. 원본 exact 구간과 source를 확인하세요. 화면에서 겹친 작은 구간을 정확한 영점으로 해석하지 않습니다.'
    };
  }

  function row(model, name, exact, status = '기록된 데이터') {
    model.table.rows.push([label(name), clone(exact), label(status)]);
  }
  function omit(model, text) { if (!model.omissions.includes(text)) model.omissions.push(text); }
  function primitive(model, kind, data) {
    if (model.points.length + model.lines.length + model.enclosures.length + model.meshes.length >= 2400) {
      omit(model,'표시 객체 2,400개 상한으로 일부 기하를 생략했습니다. 원본 증거의 범위를 변경하지 않습니다.'); return;
    }
    model[kind].push({id:kind+'-'+model[kind].length, role:'primary', color:COLORS.primary, visualApproximation:true, certificateIssued:false, ...data});
  }
  function point(model, position, text, exact, record, fieldPath, role = 'primary') {
    if (!vector(position)) { omit(model,'표시할 수 없는 비유한 좌표를 생략했습니다. 정확한 값은 표·원본에 남아 있습니다.'); return; }
    primitive(model,'points',{position,label:text,exact:clone(exact),source:source(record,fieldPath),role,color:COLORS[role] || COLORS.primary});
  }
  function line(model, vertices, text, exact, record, fieldPath, role = 'reference') {
    if (vertices.length < 2 || !vertices.every(vector)) return;
    primitive(model,'lines',{vertices,label:text,exact:clone(exact),source:source(record,fieldPath),role,color:COLORS[role] || COLORS.reference});
  }
  function enclosure(model, min, max, text, exact, record, fieldPath, role = 'primary') {
    if (!vector(min) || !vector(max) || min.some((v,i)=>v>max[i])) { omit(model,'비유한 또는 표시 범위를 벗어난 구간은 기하로 만들지 않았습니다.'); return; }
    const collapsed = min.every((v,i)=>v === max[i]);
    primitive(model,'enclosures',{min,max,label:text,exact:clone(exact),source:source(record,fieldPath),role,color:COLORS[role] || COLORS.primary,collapseToDisplayPoint:collapsed});
    if (collapsed && exact?.exact !== true) omit(model,'일부 원본 구간의 폭이 화면 Number 해상도보다 작습니다. 표시점은 exact 판정을 뜻하지 않습니다.');
    point(model,min.map((v,i)=>v/2+max[i]/2),text,exact,record,fieldPath,role);
  }
  function realBand(model, x, y, ball, text, record, path, role) {
    const b = bounds(ball);
    if (b) enclosure(model,[x,y,b.lower],[x,y,b.upper],text,ball,record,path,role);
    else { row(model,text,ball,'표시 가능한 유한 구간 없음'); omit(model,'유한 구간이 없는 값은 그래프에서 생략했습니다.'); }
  }
  function complexBand(model, x, ball, text, record, path) {
    const re = bounds(ball?.real), im = bounds(ball?.imag);
    if (re && im) enclosure(model,[x,re.lower,im.lower],[x,re.upper,im.upper],text,ball,record,path);
    else row(model,text,ball,'표시 가능한 복소 구간 없음');
  }
  const numericAxis = (label,unit) => ({label,unit,type:'numeric'});
  const categoryAxis = (name,labels) => ({label:name,unit:'범주',type:'category',ticks:labels.map((label,value)=>({value,label}))});
  const only = (records,kind) => records.filter(record => record.request.kind === kind);
  const curveName = record => record.result?.model?.label || record.request.input?.model || 'E';
  const completeResult = record => record.execution.status === 'COMPLETED' && obj(record.result);

  function localFactors(model, records) {
    model.axes = [numericAxis('소수 p','정수'),numericAxis('Frobenius 계수 a_p','정수'),numericAxis('국소 Euler 다항식 차수','차수')];
    model.summary = '실제로 계산한 소수별 a_p와 국소 인자의 차수입니다. 차수 1의 나쁜 소수도 분리해 표시합니다.';
    const seen = new Set();
    for (const record of records) {
      const r = record.result;
      const groups = [['result.localRows',r.localRows],['result.global.badPrimeRows',r.global?.badPrimeRows],['result.localCertificate.badPrimeRows',r.localCertificate?.badPrimeRows]];
      for (const [path,rows] of groups) arr(rows).forEach((item,i)=>{
        const key = (item.modelHash || curveName(record)) + ':' + item.prime;
        if (seen.has(key)) return; seen.add(key);
        const position = [approximate(item.prime),approximate(item.a_p),approximate(item.eulerDegree)];
        const role = item.reduction === 'good' ? 'primary' : 'comparison';
        point(model,position,curveName(record)+' · p='+item.prime+' · '+item.reduction,item,record,path+'.'+i,role);
        if (vector(position)) line(model,[[position[0],0,position[2]],position],'a_p stem',item,record,path+'.'+i,role);
        row(model,curveName(record)+' / p='+item.prime,{a_p:item.a_p,eulerPolynomial:item.eulerPolynomial,kodaira:item.kodaira,localRootNumber:item.localRootNumber},item.status);
      });
      if (r.normalization || r.completedFunctionConvention) row(model,curveName(record)+' 정규화',r.normalization || r.completedFunctionConvention,'기록된 L↔Λ 계약');
      if (r.global || r.localCertificate) {
        const g = r.global || r.localCertificate;
        row(model,curveName(record)+' 전역 데이터',{conductor:g.conductor,rootNumber:g.globalRootNumber,allBadFactorsCertified:g.allBadFactorsCertified,generalTateAlgorithmImplemented:g.generalTateAlgorithmImplemented},g.status);
      }
    }
    omit(model,'일반 additive reduction에 대한 전체 Tate 알고리즘과 임의 곡선의 일반 복소 L 평가는 이 화면이 제공하지 않습니다.');
  }

  function analyticValues(model, records) {
    model.axes = [numericAxis('도함수·계수 차수 n','차수'),numericAxis('기록된 값의 실수부','함수값'),numericAxis('기록된 값의 허수부','함수값')];
    model.summary = '특수함수 도함수와 Taylor 계수의 복소 보장 구간입니다. 계수 f⁽ⁿ⁾/n!와 도함수 f⁽ⁿ⁾는 이름으로 구분합니다.';
    for (const record of only(records,'p7.special_function')) {
      const r=record.result;
      arr(r.derivatives).forEach((item,i)=>{
        const text=(r.request?.operation || record.request.input?.operation || 'f')+' derivative '+item.order;
        complexBand(model,approximate(item.order),item.ball,text,record,'result.derivatives.'+i+'.ball');
        row(model,text,item.ball,'도함수 f⁽ⁿ⁾(s); Taylor 계수 아님');
      });
      row(model,'특수함수 입력',r.request || record.request.input,r.status);
      row(model,'오차 결속',r.errorAccounting,'backend 내부 반올림/잘림 분해가 미노출이면 null 유지');
    }
    for (const record of only(records,'p7.taylor_remainder')) {
      const r=record.result;
      arr(r.coefficients).forEach((item,i)=>{
        complexBand(model,approximate(item.order),item.ball,'Taylor a_'+item.order+' = f⁽ⁿ⁾/n!',record,'result.coefficients.'+i+'.ball');
      });
      row(model,'Taylor 계수 의미','f^(n)(center)/n!','도함수와 구분');
      row(model,'정의역 인증',r.domainCertificate,'정확한 입력과 pole-free 범위');
      row(model,'유한 변위 결과',r.value,r.status);
      row(model,'명시적 Taylor 나머지',r.remainderCertificate,'수치 residual로 대체하지 않음');
    }
    omit(model,'이산 기록 사이를 연속 함수나 인증 surface로 보간하지 않습니다.');
    omit(model,'일반 E의 복소 L(s) surface는 아직 지원되지 않습니다. Stage 8 ζ surface는 별도 수치 지표입니다.');
  }

  function zeroRecords(records) {
    const items=[];
    for (const record of records) {
      if (record.request.kind === 'p7.zeta_zeros') items.push({record,zero:record.result,path:'result'});
      if (obj(record.result.zeroCertificate)) items.push({record,zero:record.result.zeroCertificate,path:'result.zeroCertificate'});
    }
    return items;
  }
  function zeros(model, records) {
    model.axes=[numericAxis('Re ρ / contour 실수부','무차원'),numericAxis('Im ρ / contour 높이','무차원'),numericAxis('양의 영점 번호 · contour는 0','번호')];
    model.summary='원본 Hardy Z 분리 구간과 전체 strip count를 함께 보여줍니다. 높이 밖의 RH는 주장하지 않습니다.';
    for (const {record,zero,path} of zeroRecords(records)) {
      const vertices=arr(zero.contour?.vertices).map(v=>[approximate(v.real),approximate(v.imag),0]);
      if(vertices.length) line(model,[...vertices,vertices[0]],'인증 contour의 경계',zero.contour?.vertices,record,path+'.contour.vertices');
      arr(zero.hardyRoots).forEach((root,i)=>{
        const re=bounds(root.rootEnclosure?.real), im=bounds(root.rootEnclosure?.imag), index=approximate(root.positiveZeroIndex);
        if(re&&im&&index!==null) enclosure(model,[re.lower,im.lower,index],[re.upper,im.upper,index],'Hardy root '+root.positiveZeroIndex,root,record,path+'.hardyRoots.'+i);
        row(model,'양의 영점 '+root.positiveZeroIndex,{lower:root.lower,upper:root.upper,simple:root.simple,oppositeSigns:root.oppositeSigns},'중복도·단순성은 원본 count 결속에서 확인');
      });
      row(model,'전체 높이 count',{height:zero.request?.height,positiveZeroCount:zero.positiveZeroCount,contourCount:zero.contour?.zeroCountIncludingMultiplicity,countSaturation:zero.countSaturation},zero.status);
      row(model,'contour 검증 조건',{wholeSegmentCoverage:zero.contour?.wholeSegmentCoverage,windingInteger:zero.contour?.windingInteger,argumentPrincipleEquation:zero.contour?.argumentPrincipleEquation},'그림의 경계선만으로 인증하지 않음');
    }
    omit(model,'contour의 수많은 whole-tube 계산은 원본 증거에 보존되며 3D에는 경계와 영점 구간만 표시합니다.');
    omit(model,'유한 높이 결과는 global RH 증명이 아닙니다.');
  }

  function explicitFormula(model, records) {
    model.axes=[numericAxis('채널별 항목 번호','번호'),categoryAxis('공식의 채널',['소수 거듭제곱','영점 쌍 기여','합계 비교']),numericAxis('log 기여 / ψ 값','자연로그')];
    model.summary='소수 거듭제곱의 실제 목록, 영점쌍 기여, 명시적 꼬리를 포함한 최종 ψ 구간을 구분합니다.';
    for(const record of only(records,'p7.explicit_formula')) {
      const r=record.result;
      arr(r.primeSide?.primePowers).forEach((item,i)=>{
        const p=approximate(item.prime),v=p!==null&&p>0?Math.log(p):null;
        point(model,[i+1,0,v],item.primePower+': log('+item.prime+')',item,record,'result.primeSide.primePowers.'+i);
        if(v!==null)line(model,[[i+1,0,0],[i+1,0,v]],'표시용 log 기여',{expression:'log('+item.prime+')',...item},record,'result.primeSide.primePowers.'+i);
      });
      arr(r.zeroContributions).forEach((item,i)=>realBand(model,i+1,1,item.unitSecantContribution,'공액 영점쌍 '+item.positiveZeroIndex,record,'result.zeroContributions.'+i+'.unitSecantContribution','comparison'));
      realBand(model,1,2,r.psiEnclosure,'영점측 ψ(x) 최종 보장 구간',record,'result.psiEnclosure');
      realBand(model,2,2,r.primeSide?.value,'독립 소수측 '+label(r.primeSide?.exactExpression),record,'result.primeSide.value','comparison');
      realBand(model,3,2,r.finiteUnitSecantValue,'유한 secant 합 · 꼬리 적용 전',record,'result.finiteUnitSecantValue','reference');
      row(model,'평가 입력과 endpoint',{request:r.request,endpointConvention:r.endpointConvention},r.status);
      row(model,'소수측 정확식',r.primeSide,'독립 비교; 꼬리 경계 선택에 사용하지 않음');
      row(model,'명시적 꼬리',r.tailCertificate,'미관측 영점은 임계선 밖에도 허용');
      row(model,'오차 예산',r.errorBudget,'최종 enclosure의 각 오차 항');
    }
    omit(model,'소수별 log 막대는 화면 근사이며, ψ의 인증값은 원본 dyadic 합계 구간입니다.');
    omit(model,'영점쌍 기여에는 이미 공액쌍 중복도가 포함됩니다. 재차 2배하지 않습니다.');
  }

  function operators(model, records) {
    model.axes=[numericAxis('고유값·probe z·검사 번호 (채널별)','기록된 값'),categoryAxis('연산자 감사 채널',['정수 spectrum','det₂ 유한값','det₂ 꼬리 구간','Gamma 기준','음성대조']),numericAxis('중복도 / determinant / 거부 여부','채널별 단위')];
    model.summary='D eₙ=n eₙ의 유한 압축, det₂ 꼬리와 실제 음성대조 결과입니다. 정수 spectrum은 Riemann 영점 spectrum이 아닙니다.';
    for(const record of only(records,'p7.operator_audit')) {
      const r=record.result;
      arr(r.fixture?.claims?.spectrum).forEach((item,i)=>point(model,[approximate(item.value),0,approximate(item.multiplicity)],'λ='+item.value,item,record,'result.fixture.claims.spectrum.'+i));
      arr(r.analyticReferenceChecks?.det2?.probes).forEach((probe,i)=>{
        const x=approximate(probe.z);
        realBand(model,x,1,probe.finiteDet2,'finite det₂ at '+probe.z,record,'result.analyticReferenceChecks.det2.probes.'+i+'.finiteDet2');
        realBand(model,x,2,probe.finitePlusProductTail,'finite + explicit tail at '+probe.z,record,'result.analyticReferenceChecks.det2.probes.'+i+'.finitePlusProductTail','comparison');
        realBand(model,x,3,probe.gammaReferenceDet2,'Gamma reference at '+probe.z,record,'result.analyticReferenceChecks.det2.probes.'+i+'.gammaReferenceDet2','reference');
      });
      arr(r.negativeControls).forEach((control,i)=>{
        if(typeof control.rejected === 'boolean') point(model,[i+1,4,control.rejected?1:0],control.id,control,record,'result.negativeControls.'+i,control.rejected?'comparison':'negative');
        row(model,control.id,control,control.rejected===true?'실제 음성대조 거부':'대조 결과 확인 필요');
      });
      row(model,'operator와 domain',r.reference || r.candidateDefinition,r.researchStatus);
      row(model,'유한 계약 검사',r.finiteValidation?.checks,r.finiteValidation?.status);
      row(model,'trace D⁻²',r.analyticReferenceChecks?.traceInverseSquare,'유한합과 무한 꼬리 분리');
      row(model,'spectrum≠비자명 영점 증거',r.analyticReferenceChecks?.spectralZetaDoesNotDetermineNontrivialZeroSpectrum,'별도 반례');
      row(model,'미해결 RH 연결',r.unresolvedRHBridges,'RESEARCH_OPEN');
    }
    omit(model,'유한 fixture 통과는 RH operator의 존재, determinant=ξ, global RH를 증명하지 않습니다.');
  }

  function rank(model, records) {
    model.axes=[numericAxis('중앙 도함수 차수','0 또는 1'),categoryAxis('L / completed Λ',['L','Λ']),numericAxis('s=1에서의 값','기록된 정규화')];
    model.summary='L과 Λ의 중앙 도함수를 구분합니다. 값은 derivative이며 factorial로 나눈 Taylor 계수로 바꾸지 않습니다.';
    for(const record of only(records,'p7.elliptic_analytic')) {
      const r=record.result;
      for(const [name,order,channel] of [['L',0,0],['LPrime',1,0],['Lambda',0,1],['LambdaPrime',1,1]]) {
        const ball=r.values?.[name];
        const parityZero=name==='Lambda'?r.method?.exactParity?.LambdaCentralZero===true:name==='LambdaPrime'?r.method?.exactParity?.LambdaPrimeCentralZero===true:name==='L'?r.analyticRank?.centralValueExactZero===true:false;
        const text=curveName(record)+' '+name+(parityZero?' · 원본 parity 강제 0':ball?.containsZero===false?' · 0 제외': ' · 0 포함/미해결');
        realBand(model,order,channel,ball,text,record,'result.values.'+name,parityZero?'comparison':'primary');
        row(model,text,{ball,parityForcedExactZero:parityZero,derivativeOrder:order},parityZero?'원본 functional equation 의존':'원본 exact endpoints 유지');
      }
      row(model,curveName(record)+' analytic rank',r.analyticRank,'산술 rank equality와 분리');
      row(model,'L↔Λ 변환',r.normalization,'Λ′=0이어도 L′=0으로 바꾸지 않음');
      row(model,'유한 합과 명시적 tail',r.errorBudget,'서로 다른 오차 항 유지');
    }
    omit(model,'0을 포함하는 작은 ball은 vanishing 증명이 아닙니다.');
    omit(model,'해석적 rank 결과에서 산술 rank·refined BSD·universal BSD를 추론하지 않습니다.');
  }

  function arithmetic(model, records) {
    model.axes=[numericAxis('x(nP)','유리수의 표시 근사'),numericAxis('y(nP)','유리수의 표시 근사'),numericAxis('정확히 계산한 배수 n','정수')];
    model.summary='서버에서 정확히 계산한 유리점 nP의 좌표와 배수입니다. 선은 배수의 순서만 연결하며 곡선 위의 연속 경로가 아닙니다.';
    for(const record of only(records,'p7.elliptic_local')) {
      const r=record.result,pe=r.pointEvidence;
      let previous=null;
      arr(pe?.firstFiveMultiples).forEach((item,i)=>{
        if(item.point === null) {
          row(model,curveName(record)+' '+item.scalar+'P',{scalar:item.scalar,point:null,display:'O / 무한원점'},'아핀 좌표 없음 · (0,0)으로 대체하지 않음');previous=null;return;
        }
        const position=[approximate(item.point?.[0]),approximate(item.point?.[1]),approximate(item.scalar)];
        point(model,position,curveName(record)+' '+item.scalar+'P',item,record,'result.pointEvidence.firstFiveMultiples.'+i);
        if(previous&&vector(position))line(model,[previous,position],'배수 순서 안내선',{fromScalar:i,toScalar:item.scalar,pathIsCurve:false},record,'result.pointEvidence.firstFiveMultiples','reference');
        previous=vector(position)?position:null;
        row(model,curveName(record)+' '+item.scalar+'P',item,'exact 유리점');
      });
      row(model,curveName(record)+' 곡선',r.model,'원본 Weierstrass 모델');
      row(model,'점의 order와 non-torsion',pe,'원본 유한 산술 증거');
      row(model,'독립 산술 rank 범위',r.arithmeticRank,'upperBound=null은 미계산이며 0이 아님');
      row(model,'torsion',r.rationalTorsion,'정확한 reduction 근거');
      const a=r.arithmeticRank || {};
      for(const key of ['canonicalHeight','realPeriod','regulator','saturation','sha'])row(model,key,a[key]??null,a[key]==='not-computed'?'NOT_COMPUTED':'원본 상태 유지');
      if(a.upperBound===null || a.upperBound===undefined)omit(model,'산술 rank 상계는 알려진 숫자로 채우지 않습니다. descent/Selmer 인증이 남아 있습니다.');
    }
    omit(model,'높이·regulator·period·saturation·Sha의 빈 값은 원본 OPEN/NOT_COMPUTED 상태입니다.');
    omit(model,'외부 rank 정리의 후속 조사 기록은 현재 실행된 산술 인증으로 승격하지 않습니다.');
  }

  function dependencies(model, records, capabilities) {
    model.axes=[{label:'의존 단계',unit:'개념 배치',type:'schematic'},{label:'실행 기록 번호',unit:'개념 배치',type:'schematic'},{label:'가정·미해결 분기',unit:'개념 배치',type:'schematic'}];
    model.summary='위치는 의존 관계를 읽기 위한 개념 배치입니다. 축의 높이나 거리에는 증명 등급·성공률 의미가 없습니다.';
    records.forEach((record,i)=>{
      const r=record.result;
      const nodes=[{x:0,title:'입력',exact:record.request,path:'request'},{x:1,title:'소스',exact:record.sourceBinding,path:'sourceBinding'},{x:2,title:'실행 결과',exact:{schema:r.schema,status:r.status,scope:r.scope},path:'result'}];
      nodes.forEach(n=>point(model,[n.x,i,0],record.request.kind+' · '+n.title,n.exact,record,n.path));
      line(model,[[0,i,0],[1,i,0],[2,i,0]],'입력→소스→결과',{relation:'record-provenance'},record,'recordSHA256');
      const depKey=Array.isArray(r.theoremDependencies)?'theoremDependencies':Array.isArray(r.mathematicalDependencies)?'mathematicalDependencies':'analyticDependencies';
      const deps=arr(r[depKey]);
      deps.slice(0,16).forEach((dep,j)=>{
        const title=typeof dep==='string'?dep:dep.id || dep.name || '외부 의존 '+(j+1);
        point(model,[3,i,1+j],title,dep,record,'result.'+depKey+'.'+j,'reference');
        line(model,[[2,i,0],[3,i,1+j]],'외부 정리 의존',dep,record,'result.'+depKey+'.'+j,'reference');
      });
      arr(r.unresolvedRHBridges).forEach((dep,j)=>{
        point(model,[4,i,-1-j],dep.id,dep,record,'result.unresolvedRHBridges.'+j,'open');
        line(model,[[2,i,0],[4,i,-1-j]],'미해결 연구 연결',dep,record,'result.unresolvedRHBridges.'+j,'open');
      });
      row(model,record.request.kind,{recordSHA256:record.recordSHA256,scope:r.scope,analyticRank:r.analyticRank,arithmeticRank:r.arithmeticRank},'원본 scope의 false/null을 그대로 보존');
    });
    const criteria=arr(capabilities?.progress?.criteria || capabilities?.criteria);
    criteria.forEach(c=>row(model,c.id,{status:c.status,remaining:c.remaining},'서버 진행 상태; 화면이 판정하지 않음'));
    row(model,'증명 승격 금지',{wholeP7Complete:false,wholeM3Complete:false,formalLeanProofIssued:false,proofStatusPromoted:false},'고정된 표시 권한');
    omit(model,'유한 높이 RH, 곡선별 rank equality, leading-term BSD, universal conjecture는 서로 다른 결과 범위입니다.');
    omit(model,'finite-field RH를 classical RH axiom으로 복사하지 않습니다. 미해결 가정은 증명으로 채우지 않습니다.');
  }

  function build({criterion='P7-01',records=[],capabilities=null}={}) {
    const model=blank(criterion,capabilities);
    if(!Object.hasOwn(TITLES,criterion)){omit(model,'지원되는 기준은 P7-01부터 P7-08까지입니다.');return model;}
    const supplied=Array.isArray(records)?records:obj(records)?Object.values(records):[];
    const valid=[];
    for(const record of supplied.slice(-32)) {
      if(!validEnvelope(record)){omit(model,'범위·권한 envelope가 맞지 않는 기록은 표시하지 않았습니다.');continue;}
      if(!completeResult(record)){row(model,record.request.kind,record.execution,'미완료 실행 · 결과 기하 없음');continue;}
      valid.push(record);
    }
    if(supplied.length>32)omit(model,'최근 32개 기록만 표시합니다.');
    const relevant={
      'P7-01':['p7.elliptic_local','p7.elliptic_analytic'], 'P7-02':['p7.special_function','p7.taylor_remainder'],
      'P7-03':['p7.zeta_zeros','p7.explicit_formula'], 'P7-04':['p7.explicit_formula'],
      'P7-05':['p7.operator_audit'], 'P7-06':['p7.elliptic_analytic'], 'P7-07':['p7.elliptic_local']
    }[criterion];
    const selected=relevant?valid.filter(r=>relevant.includes(r.request.kind)):valid;
    for(const record of selected)model.provenance.push(source(record,'result'));
    const renderers={'P7-01':localFactors,'P7-02':analyticValues,'P7-03':zeros,'P7-04':explicitFormula,'P7-05':operators,'P7-06':rank,'P7-07':arithmetic,'P7-08':dependencies};
    renderers[criterion](model,selected,capabilities);
    model.status=selected.length?'RECORDED_EVIDENCE_VISUALIZED':'NOT_RUN';
    model.hasRecordedData=selected.length>0;
    model.hasArchivedExamples=selected.some(r=>r.visualRecordSchema===COMPACT || r.visualSource?.mode==='ARCHIVED_EXAMPLE');
    if(model.hasArchivedExamples)omit(model,'저장된 실행 예제가 포함되어 있습니다. 현재 서버의 live 재검증 결과와 구분하세요.');
    if(!selected.length)omit(model,'이 기준에 연결된 완료 실행 기록이 없습니다. 수치를 생성해 채우지 않았습니다.');
    return model;
  }

  // Optional Stage 8 reuse. This separate model accepts only actual adapter
  // output; it never calls a server or synthesizes a zeta sample grid.
  function buildStage8Surface(adapterResult) {
    const model=blank('P7-02',null);
    model.title='Stage 8 ζ surface · 수치 지표';
    model.axes=[numericAxis('Re(s)','무차원'),numericAxis('Im(s)','무차원'),numericAxis('log(1+|ζ(s)|)','표시 높이')];
    const result=adapterResult?.result || adapterResult;
    const specIndex=arr(result?.outputRepresentations).findIndex(v=>v.type==='ComplexZetaSurfaceSpec');
    const spec=arr(result?.outputRepresentations)[specIndex];
    if(result?.adapter!=='advanced.zeta-complex-surface.v1'||!spec){omit(model,'실제로 계산한 Stage 8 adapter 결과가 필요합니다.');return model;}
    const samples=arr(spec.vertices), nx=spec.grid?.realSamples,ny=spec.grid?.imagSamples;
    if(!Number.isInteger(nx)||!Number.isInteger(ny)||nx<4||ny<4||nx*ny>1600||samples.length!==nx*ny){omit(model,'Stage 8 grid 형식이 올바르지 않습니다.');return model;}
    const vertices=samples.map(v=>['SAMPLED','HEIGHT_CLIPPED'].includes(v.status)&&[v.x,v.y,v.height].every(finite)?[v.x,v.y,v.height]:null);
    const triangles=[];
    for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){
      const a=j*nx+i,b=a+1,c=a+nx,d=c+1;
      for(const triangle of [[a,b,c],[b,d,c]])if(triangle.every(k=>vertices[k]!==null))triangles.push(triangle);
    }
    primitive(model,'meshes',{vertices,triangles,label:'실제 Stage 8 샘플 · NUMERICAL INDICATOR',role:'reference',color:COLORS.reference,exact:{status:spec.status,representation:spec.representation,zeroCertification:spec.zeroCertification,samples:clone(samples)},source:{adapter:result.adapter,reproducibilityHash:result.reproducibilityHash??null,fieldPath:'outputRepresentations.'+specIndex,verification:'NOT_PERFORMED_BY_VISUAL_ADAPTER'},evidenceGrade:'NUMERICAL INDICATOR'});
    model.status='NUMERICAL_INDICATOR';model.hasRecordedData=true;
    model.summary='실제 Stage 8 샘플의 높이 surface입니다. 극점 마스크의 구멍과 높이 clipping을 보존합니다.';
    row(model,'surface 범위',spec.domain,'유한 grid');row(model,'마스크·clipping',{pole:spec.pole,heightClippedCount:spec.heightClippedCount,evaluationMaskedCount:spec.evaluationMaskedCount},'제외 표본을 메우지 않음');
    omit(model,'두 precision 간 차이는 rigorous error bound가 아니며, 이 mesh는 영점·RH certificate가 아닙니다.');
    return model;
  }

  const api=Object.freeze({schema:SCHEMA,build,compactRecord,buildStage8Surface,approximateForDisplay:approximate});
  host.MathScopeP7VisualModels=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
