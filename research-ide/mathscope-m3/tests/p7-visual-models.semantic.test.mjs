/* Independent semantic regressions: display geometry never grants authority.
 * Positive examples use the existing source-bound attempt2 execution records.
 * Mutated copies are display-boundary fixtures, never new math certificates.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const context = vm.createContext({window:{}});
vm.runInContext(readFileSync(new URL('web/p7-visual-models.js', root), 'utf8'), context);
vm.runInContext(readFileSync(new URL('web/p7-visualization.js', root), 'utf8'), context);
const models = context.window.MathScopeP7VisualModels;
const renderer = context.window.MathScopeP7Visualization;
const plain = value => JSON.parse(JSON.stringify(value));
const clone = plain;
const criteria = Array.from({length:8}, (_, i) => `P7-0${i+1}`);
const names = ['zeta-2','taylor-zeta','central-11a1','central-37a1','elliptic-local','operator-reference','explicit-psi'];
const manifest = JSON.parse(readFileSync(new URL('evidence/resume-20261012/attempt2/manifest.json', root), 'utf8'));
const progress = JSON.parse(readFileSync(new URL('P7_PROGRESS.json', root), 'utf8'));
const fullRecords = names.map(name => {
  const filename = name+'.json.gz';
  const raw = readFileSync(new URL('evidence/resume-20261012/attempt2/'+filename, root));
  const metadata = manifest.runs.find(row => row.artifact === filename);
  assert.ok(metadata, 'Positive fixture must be named by the saved execution manifest');
  assert.equal(createHash('sha256').update(raw).digest('hex'), metadata.sha256);
  const value = JSON.parse(gunzipSync(raw));
  assert.equal(value.execution.status, 'COMPLETED');
  assert.equal(value.recordSHA256, metadata.recordSHA256);
  return value;
});
const records = fullRecords.map(record => models.compactRecord(record));
const capabilities = {progress, sourceBinding:clone(fullRecords[0].sourceBinding)};
const findRecord = name => clone(records[names.indexOf(name)]);
const build = (criterion, selected=records) => models.build({criterion, records:selected, capabilities});
const primitives = model => [...model.points,...model.lines,...model.meshes,...model.enclosures];
const coordinates = model => primitives(model).flatMap(item => item.position ? [item.position] : item.min ? [item.min,item.max] : item.vertices || []).filter(value => value !== null);
const frozen = (value, seen=new Set()) => {
  if(value && typeof value==='object' && !seen.has(value)) {
    seen.add(value);Object.values(value).forEach(child=>frozen(child,seen));Object.freeze(value);
  }
  return value;
};
const noPromotion = model => {
  for(const field of ['certificateIssued','proofStatusPromoted','formalLeanProofIssued','wholeP7Complete','wholeM3Complete'])assert.equal(model[field], false, field);
  assert.equal(model.visualApproximation, true);
  for(const item of primitives(model)) {
    assert.equal(item.certificateIssued, false);
    assert.equal(item.visualApproximation, true);
  }
};

test('all eight original P7 criteria produce sourced display data from actual executions', () => {
  for(const criterion of criteria) {
    const model=build(criterion);
    assert.equal(model.criterion, criterion);
    assert.equal(model.axes.length, 3);
    assert.equal(model.hasRecordedData, true);
    assert.ok(primitives(model).length>0, criterion+' has actual geometry');
    assert.ok(model.table.rows.length>0, criterion+' retains accessible exact data');
    assert.equal(model.criterionStatus, progress.criteria.find(row=>row.id===criterion).status);
    noPromotion(model);
    for(const position of coordinates(model))assert.ok(position.length===3 && position.every(Number.isFinite));
    for(const item of primitives(model)) {
      assert.ok(item.source?.fieldPath, criterion+' source field');
      assert.ok(records.some(record=>record.recordSHA256===item.source.recordSHA256), criterion+' source record');
      assert.equal(item.source.verification, 'NOT_PERFORMED_BY_VISUAL_ADAPTER');
      assert.equal(item.source.originalRecordHashIsCompactedPayloadHash, false);
    }
  }
});

test('no-data scenes remain NOT_RUN and do not synthesize measurements', () => {
  for(const criterion of criteria) {
    const model=build(criterion, []);
    assert.equal(model.status, 'NOT_RUN');
    assert.equal(model.hasRecordedData, false);
    assert.equal(primitives(model).length, 0);
    noPromotion(model);
  }
});

test('display building and renderer preparation leave exact records and capabilities unchanged', () => {
  const input=frozen(clone(records)), caps=frozen(clone(capabilities));
  const before=JSON.stringify({input,caps});
  for(const criterion of criteria) {
    const model=models.build({criterion,records:input,capabilities:caps});
    const modelBefore=JSON.stringify(model);
    const inspected=renderer.inspectModel(model);
    assert.ok(inspected.items>0);
    assert.equal(inspected.proofStatusPromoted, false);
    assert.equal(JSON.stringify(model), modelBefore);
  }
  assert.equal(JSON.stringify({input,caps}), before);
});

test('compacting a full zero certificate discloses omitted cells without altering the original', () => {
  const original=fullRecords[names.indexOf('explicit-psi')];
  const before=JSON.stringify(original), copy=models.compactRecord(original);
  assert.equal(JSON.stringify(original), before);
  assert.equal(copy.visualSource.current, false);
  assert.equal(copy.visualArchive.currentLiveVerification, false);
  assert.equal(copy.visualArchive.compactedPayloadHasOriginalRecordHash, false);
  assert.equal(copy.visualArchive.originalRecordSHA256, original.recordSHA256);
  assert.equal(copy.result.zeroCertificate.contour.cells, undefined);
  assert.ok(copy.result.zeroCertificate.visualOmissions.contourCellCount>0);
  const model=build('P7-03',[copy]);
  assert.equal(model.hasArchivedExamples, true);
  assert.ok(model.provenance.every(p=>p.currentServerResult===false));
});

test('envelope authority promotions and incomplete executions cannot become geometry', () => {
  for(const change of [
    r=>r.wholeP7Complete=true, r=>r.wholeM3Complete=true,
    r=>r.formalLeanProofIssued=true, r=>r.serializedAuthority='TRUST_ME',
    r=>r.schema='forged', r=>r.visualRecordSchema='forged',
    r=>r.execution.status='SOURCE_CHANGED', r=>r.execution.status='UNRESOLVED',
    r=>r.execution.status='ENVIRONMENT_CHANGED',
  ]) {
    const record=findRecord('zeta-2');change(record);
    const model=build('P7-02',[record]);
    assert.equal(primitives(model).length, 0);
    assert.equal(model.status,'NOT_RUN');
    noPromotion(model);
  }
});

test('null, booleans, nonfinite values and blank strings are not plotted as zero', () => {
  for(const value of [null,undefined,false,true,NaN,Infinity,-Infinity,'',' ','NaN','Infinity','1/0'])assert.equal(models.approximateForDisplay(value), null);
  for(const value of [0,'0','0/17',{mantissa:'0',exponent:'-4096'}])assert.equal(models.approximateForDisplay(value), 0);
  for(const lower of [null,'NaN','1e9999']) {
    const record=findRecord('zeta-2');
    record.result.derivatives[0].ball.real.lower=lower;
    const model=build('P7-02',[record]);
    assert.equal(primitives(model).length,0);
    assert.ok(model.table.rows.length>0);
  }
});

test('huge dyadic mantissas with balancing exponents retain finite display coordinates', () => {
  assert.equal(models.approximateForDisplay({mantissa:(1n<<4096n).toString(),exponent:'-4096'}),1);
  assert.equal(models.approximateForDisplay({mantissa:(-(1n<<4096n)).toString(),exponent:'-4095'}),-2);
  assert.equal(models.approximateForDisplay({mantissa:'1',exponent:'99999'}),null);
  assert.equal(models.approximateForDisplay({mantissa:'1',exponent:'9007199254740993'}),null);
  assert.equal(models.approximateForDisplay('9'.repeat(20001)),null);
  assert.equal(models.approximateForDisplay({mantissa:'1',exponent:'-1074'}),Number.MIN_VALUE);
  assert.equal(models.approximateForDisplay((3n<<52n).toString()+'/'+(1n<<1128n).toString()),Number.MIN_VALUE);
});

test('a tiny zero-containing ball keeps exact nonzero width when its display collapses', () => {
  const record=findRecord('zeta-2');
  const tiny={kind:'finite',lower:{mantissa:'-1',exponent:'-4096'},upper:{mantissa:'1',exponent:'-4096'},width:{mantissa:'1',exponent:'-4095'},containsZero:true,exact:false,toleranceMet:false};
  record.result.derivatives[0].ball.real=clone(tiny);
  const model=build('P7-02',[record]), enclosure=model.enclosures[0];
  assert.ok(enclosure);
  assert.equal(enclosure.collapseToDisplayPoint,true);
  assert.deepEqual(plain(enclosure.exact.real),tiny);
  assert.equal(enclosure.exact.real.exact,false);
  assert.equal(enclosure.exact.real.toleranceMet,false);
  assert.ok(model.omissions.some(text=>text.includes('Number')));
  noPromotion(model);
});

test('actual zero boxes retain finite-height count and multiplicity context', () => {
  const record=findRecord('explicit-psi'), zero=record.result.zeroCertificate;
  const model=build('P7-03',[record]);
  assert.equal(model.enclosures.length,3);
  assert.equal(zero.positiveZeroCount,3);
  // The source rectangle is symmetric in +/-T: its count includes conjugates.
  assert.equal(zero.contour.zeroCountIncludingMultiplicity,6);
  const table=plain(model.table.rows);
  const count=table.find(row=>row[0]==='전체 높이 count')[1];
  assert.equal(count.positiveZeroCount,3);
  assert.equal(count.contourCount,6);
  assert.equal(count.countSaturation.positiveSignBrackets,3);
  assert.equal(count.countSaturation.conjugateNegativeBrackets,3);
  assert.equal(count.countSaturation.remainingZerosInRectangle,0);
  for(let i=0;i<3;i++)assert.deepEqual(plain(model.enclosures[i].exact),zero.hardyRoots[i]);
  noPromotion(model);
});

test('explicit formula keeps prime side, uninflated conjugate contributions and original tail band separate', () => {
  const record=findRecord('explicit-psi'), r=record.result, model=build('P7-04',[record]);
  const band=model.enclosures.find(item=>item.source.fieldPath==='result.psiEnclosure');
  assert.deepEqual(plain(band.exact),r.psiEnclosure);
  assert.ok(band.max[2]-band.min[2]>12);
  assert.equal(r.primeSide.exactExpression,'log(2520)');
  assert.equal(r.primeSide.usedToChooseTailBound,false);
  assert.equal(r.primeSide.intersectedWithZeroSideBand,false);
  for(let i=0;i<r.zeroContributions.length;i++) {
    const item=model.enclosures.find(item=>item.source.fieldPath===`result.zeroContributions.${i}.unitSecantContribution`);
    assert.deepEqual(plain(item.exact),r.zeroContributions[i].unitSecantContribution);
  }
  assert.ok(!primitives(model).some(item=>item.source.fieldPath.includes('unsmoothed')));
});

test('operator reference audit retains all nine rejections and seven open RH bridges', () => {
  const record=findRecord('operator-reference'), model=build('P7-05',[record]);
  assert.equal(record.result.negativeControls.length,9);
  assert.ok(record.result.negativeControls.every(row=>row.rejected===true));
  assert.equal(record.result.unresolvedRHBridges.length,7);
  const open=plain(model.table.rows).find(row=>row[0]==='미해결 RH 연결');
  assert.equal(open[2],'RESEARCH_OPEN');
  assert.equal(open[1].length,7);
  assert.equal(model.status,'RECORDED_EVIDENCE_VISUALIZED');
  noPromotion(model);
});

test('analytic rank view preserves exact parity and L versus Lambda derivative distinctions', () => {
  const even=findRecord('central-11a1'), odd=findRecord('central-37a1');
  const model=build('P7-06',[even,odd]);
  assert.equal(model.enclosures.length,8);
  assert.equal(even.result.analyticRank.exactRank,0);
  assert.equal(odd.result.analyticRank.exactRank,1);
  const evenLambdaPrime=model.enclosures.find(item=>item.source.recordSHA256===even.recordSHA256 && item.source.fieldPath==='result.values.LambdaPrime');
  const evenLPrime=model.enclosures.find(item=>item.source.recordSHA256===even.recordSHA256 && item.source.fieldPath==='result.values.LPrime');
  assert.match(evenLambdaPrime.label,/parity/);
  assert.doesNotMatch(evenLPrime.label,/parity/);
  assert.deepEqual(plain(evenLPrime.exact),even.result.values.LPrime);
  const altered=clone(odd);
  altered.result.analyticRank.centralValueExactZero=false;
  altered.result.analyticRank.exactRank=null;
  altered.result.method.exactParity.LambdaCentralZero=false;
  const unresolved=build('P7-06',[altered]);
  assert.ok(unresolved.enclosures.filter(item=>['result.values.L','result.values.Lambda'].includes(item.source.fieldPath)).every(item=>!item.label.includes('parity')));
  const rank=plain(unresolved.table.rows).find(row=>row[0].includes('analytic rank'))[1];
  assert.equal(rank.exactRank,null);
  noPromotion(unresolved);
});

test('rational point coordinates retain fractions and unknown arithmetic rank bounds', () => {
  const record=findRecord('elliptic-local'), model=build('P7-07',[record]);
  const p=model.points.find(item=>item.exact.scalar===5);
  assert.deepEqual(plain(p.position),[.25,-.625,5]);
  assert.deepEqual(plain(p.exact.point),['1/4','-5/8']);
  const rank=plain(model.table.rows).find(row=>row[0]==='독립 산술 rank 범위')[1];
  assert.equal(rank.lowerBound,1);
  assert.equal(rank.upperBound,null);
  assert.equal(rank.exactRank,null);
  assert.equal(rank.regulator,'not-computed');
  noPromotion(model);
});

test('the point at infinity remains an explicit row and breaks the affine guide line', () => {
  const record=findRecord('elliptic-local');
  record.result.pointEvidence.firstFiveMultiples=[{scalar:1,point:['0','0']},{scalar:2,point:null},{scalar:3,point:['1','1']}];
  const model=build('P7-07',[record]);
  assert.equal(model.points.length,2);
  assert.equal(model.lines.length,0);
  assert.ok(plain(model.table.rows).some(row=>row[1]?.display==='O / 무한원점'));
  assert.ok(!model.points.some(item=>item.position[2]===2));
});

test('dependency layout is explicitly schematic and cannot numerically rank proof authority', () => {
  const model=build('P7-08');
  assert.ok(model.axes.every(axis=>axis.type==='schematic'));
  assert.ok(model.points.some(item=>item.role==='open'));
  const originalScope=plain(model.table.rows).find(row=>row[0]==='p7.operator_audit')[1].scope;
  assert.equal(originalScope.globalRHProved,false);
  assert.equal(originalScope.universalBSDProved,false);
  noPromotion(model);
});

test('renderer rejects nonfinite coordinates and never bridges missing line vertices', () => {
  const model=build('P7-02',[]);
  model.points=[{position:[0,0,0]},{position:[null,0,0]},{position:[NaN,0,0]},{position:[Infinity,0,0]}];
  model.lines=[{vertices:[[0,0,0],null,[2,2,2]]}];
  model.enclosures=[{min:[2,0,0],max:[1,0,0]}];
  const before=JSON.stringify(model), inspected=renderer.inspectModel(model);
  assert.equal(inspected.items,1);
  assert.equal(inspected.geometryCount,1);
  assert.ok(inspected.skipped>=5);
  assert.equal(JSON.stringify(model),before);
  assert.throws(()=>renderer.inspectModel({...model,proofStatusPromoted:true}));
  assert.throws(()=>renderer.inspectModel({...model,visualApproximation:false}));
});

test('Stage 8 uses supplied log1p heights, clipping and mask holes without certifying zeros', () => {
  const vertices=Array.from({length:16},(_,i)=>({x:i%4,y:Math.floor(i/4),height:.5+i/10,status:'SAMPLED',magnitude:Math.expm1(.5+i/10)}));
  vertices[5]={...vertices[5],height:null,status:'POLE_MASKED'};
  vertices[15]={...vertices[15],height:2,status:'HEIGHT_CLIPPED'};
  const spec={type:'ComplexZetaSurfaceSpec',grid:{realSamples:4,imagSamples:4},vertices,zeroCertification:'NONE',heightScale:'log1p(abs(zeta(s)))',heightClippedCount:1,evaluationMaskedCount:0};
  const model=models.buildStage8Surface({adapter:'advanced.zeta-complex-surface.v1',outputRepresentations:[spec],reproducibilityHash:'boundary-fixture'});
  assert.equal(model.status,'NUMERICAL_INDICATOR');
  assert.equal(model.meshes[0].vertices[5],null);
  assert.ok(model.meshes[0].triangles.every(indices=>!indices.includes(5)));
  assert.equal(model.meshes[0].vertices[15][2],2);
  assert.equal(model.meshes[0].exact.zeroCertification,'NONE');
  assert.match(model.axes[2].label,/log\(1\+/);
  noPromotion(model);
});
