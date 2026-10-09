#!/usr/bin/env python3
"""Report integrity tests. No PDF or artifact operation marker is created."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('m0m1_report', HERE/'build_m0_m1_report.py')
report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(report)


class ReportDataTests(unittest.TestCase):
    def test_native_component_pass_does_not_complete_common_acceptance(self):
        model = report.assemble()
        self.assertEqual(len(model['items']), 70)
        self.assertEqual(model['counts']['M0']['PENDING_DATA'], 6)
        self.assertEqual(model['counts']['M0']['PASS'], 0)

    def test_release_updates_evidence_but_not_original_criteria(self):
        original = report.read_json(report.ORIGINAL)
        with tempfile.TemporaryDirectory(dir=HERE) as folder:
            data = Path(folder)/'release-fixture.json'
            data.write_text(json.dumps({'overrides': {'N1-05': {
                'status':'PARTIAL',
                'implementation':['원본 환경 명령은 수행했으나 전체 build 실패'],
                'remaining':['실패 모듈 해결과 전체 build 재실행 필요'],
            }}}))
            model = report.assemble(data)
            for source, result in zip(original, model['items']):
                self.assertEqual(result['id'], source['id'])
                self.assertEqual(result['detail'], source['detail'])
                self.assertEqual(result['accept'], source['accept'])
            item = next(x for x in model['items'] if x['id']=='N1-05')
            self.assertEqual(item['status'], 'PARTIAL')
            self.assertEqual(item['remaining'], ['실패 모듈 해결과 전체 build 재실행 필요'])
            data.write_text(json.dumps({'overrides': {'N1-05': {
                'status':'PASS', 'accept':'좁은 component build만 통과하면 된다'
            }}}))
            with self.assertRaisesRegex(ValueError, 'may not rewrite'):
                report.assemble(data)

    def test_structured_gauge_evidence_and_limits_survive_normalization(self):
        normalized = report.native_item({
            'status':'PASS_WITH_DECLARED_BOUNDS',
            'implementation':'정확한 구조상수 검사',
            'evidence':[{'file':'evidence/validation.json','record':'all-jacobi','status':'PASS'}],
            'limits':['임의 전역 군의 형식화를 뜻하지 않는다.'],
        }, 'gauge')
        self.assertEqual(normalized['status'], 'PASS')
        self.assertIn('all-jacobi', normalized['validation'][0])
        self.assertIn('임의 전역 군', normalized['boundary'])

    def test_final_card_summary_overrides_frozen_core_summary_without_rewriting_evidence(self):
        original = next(x for x in report.read_json(report.ORIGINAL) if x['id']=='I3-04')
        with tempfile.TemporaryDirectory(dir=HERE) as folder:
            data=Path(folder)/'display-fixture.json'
            data.write_text(json.dumps({'overrides':{'I3-04':{
                'status':'PASS',
                'implementation':['상세 원본 근거는 이 필드에서 보존한다.'],
                'validation':['초기 검사와 새 후속 검사는 별도이다.'],
                'reportDisplay':{'implementation':'최종 구현 요약 fixture',
                                 'validation':'최종 감사 범위 fixture'},
            }}}))
            item=next(x for x in report.assemble(data)['items'] if x['id']=='I3-04')
        self.assertEqual(item['implementation'],['상세 원본 근거는 이 필드에서 보존한다.'])
        self.assertEqual(item['validation'],['초기 검사와 새 후속 검사는 별도이다.'])
        self.assertEqual(report.acceptance_display(item),{
            'implementation':'최종 구현 요약 fixture','validation':'최종 감사 범위 fixture'})
        for key in ['id','title','detail','accept']:
            self.assertEqual(item[key],original[key])

    def test_card_display_cannot_override_criteria_status_or_hide_evidence(self):
        item={**next(x for x in report.read_json(report.ORIGINAL) if x['id']=='I3-04'),
              **report.native_item({},'core')}
        for bad in [{'accept':'수정 기준'},{'status':'PASS'},{'validation':''},None]:
            with self.assertRaisesRegex(ValueError,'reportDisplay'):
                report.apply_override(dict(item),{'reportDisplay':bad})

    def test_n1_summary_uses_final_remaining_without_reopening_completed_work(self):
        # A data fixture, not an assertion that an official build has completed.
        items=[
            {'id':'N1-05','status':'PARTIAL','implementation':['C/D build completed in fixture'],
             'remaining':['전체 default target의 완료 기록이 필요하다.']},
            {'id':'N1-06','status':'PARTIAL','validation':['main C/D axioms recorded in fixture'],
             'remaining':['정상 보호환경의 Comparator 결과가 필요하다.']},
        ]
        before=json.dumps(items,ensure_ascii=False)
        rows=report.ns_pending_rows(items)
        self.assertEqual(rows,[['N1-05 PARTIAL; N1-06 PARTIAL',
            'N1-05: 전체 default target의 완료 기록이 필요하다. N1-06: 정상 보호환경의 Comparator 결과가 필요하다.']])
        self.assertNotIn('axioms',rows[0][1])
        self.assertNotIn('cache/build',rows[0][1])
        self.assertEqual(before,json.dumps(items,ensure_ascii=False))

    def test_n1_pass_is_removed_from_unfinished_summary(self):
        rows=report.ns_pending_rows([
            {'id':'N1-05','status':'PASS','remaining':['stale fixture text must not leak']},
            {'id':'N1-06','status':'PARTIAL','remaining':['guarded Comparator만 미충족']},
        ])
        self.assertEqual(rows,[['N1-06 PARTIAL','N1-06: guarded Comparator만 미충족']])

    def test_n1_completed_summary_keeps_n3_math_blockers(self):
        rows=report.ns_pending_rows([
            {'id':'N1-05','status':'PASS','remaining':[]},
            {'id':'N1-06','status':'PASS','remaining':[]},
            {'id':'N3-05','status':'BLOCKED','remaining':['실제 moment 접합 미충족']},
            {'id':'N3-06','status':'BLOCKED','remaining':['전 구간 cone 미충족']},
        ])
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0][0],'N3-05 BLOCKED; N3-06 BLOCKED')
        self.assertIn('실제 moment 접합 미충족',rows[0][1])
        self.assertIn('전 구간 cone 미충족',rows[0][1])
        self.assertNotIn('N1-',str(rows))

    def test_release_rows_do_not_add_historical_final_or_official_counts(self):
        model={'metadata':{'version':'v50'},'tests':{
            'arithmetic':{'pass':38,'total':38,'lean':31},
            'gauge':{'pass':18,'total':18,'lean':27},
            'navier':{'pass':90,'total':90,'lean':13},
            'officialNS':{'pass':2,'total':2,'toolchain':'4.34.0-rc2'},
            'browserLiveChecks':{'pass':25,'total':25},'cli':{'pass':18,'total':18},
            'browserFinal':{'pass':11,'total':11},'cliFinal':{'pass':12,'total':12},
        }}
        rows=dict(report.release_test_rows(model))
        self.assertTrue(rows['실제 로컬 Lean target'].startswith('71개:'))
        self.assertEqual(rows['원래 rc2 C/D 제출 정리'],'2 / 2 / Lean 4.34.0-rc2')
        self.assertEqual(rows['이전 브라우저 관찰 / 이전 CLI 검사'],'25 / 25 · 18 / 18')
        self.assertEqual(rows['v50 브라우저 추가 확인'],'11 / 11')
        self.assertEqual(rows['v50 CLI 추가 확인'],'12 / 12')

    def test_release_rows_omit_missing_final_results(self):
        model={'metadata':{'version':'v50'},'tests':{'cliFinal':{'pass':12,'total':12}}}
        rows=dict(report.release_test_rows(model))
        self.assertNotIn('v50 브라우저 추가 확인',rows)
        self.assertNotIn('원래 rc2 C/D 제출 정리',rows)
        self.assertEqual(rows['v50 CLI 추가 확인'],'12 / 12')

    def test_historical_core_receipt_keeps_its_own_execution_version(self):
        class Recorder:
            def __init__(self):
                self.model={'metadata':{'version':'v-final'},'releaseData':{},
                            'tests':{'core':{'pass':19,'total':19,'executionVersion':'v52'}}}
                self.calls=[]
            def __getattr__(self,name):
                return lambda *args,**kwargs:self.calls.append((name,args,kwargs))
        c=Recorder()
        report.verification_scope(c)
        text=json.dumps(c.calls,ensure_ascii=False)
        self.assertIn('공통 엔진 v52',text)
        self.assertNotIn('공통 엔진 v-final',text)

    def test_final_cli_is_not_relabelled_as_later_ui_release(self):
        rows=dict(report.release_test_rows({'metadata':{'version':'v54'},'tests':{
            'cliFinal':{'pass':48,'total':48,'executionVersion':'v53'},
            'browserFinal':{'pass':5,'total':5,'executionVersion':'v54'},
        }}))
        self.assertEqual(rows['v53 CLI 추가 확인'],'48 / 48')
        self.assertEqual(rows['v54 브라우저 추가 확인'],'5 / 5')
        self.assertNotIn('v54 CLI 추가 확인',rows)

    def test_missing_followup_stays_absent_and_duplicate_ids_rejected(self):
        self.assertEqual(report.followup_data({}), {})
        self.assertEqual(report.followup_data({'followupConstruction':None}), {})
        with self.assertRaisesRegex(ValueError,'distinct nonempty'):
            report.followup_data({'followupConstruction':{'modules':[{'id':'axis'},{'id':'axis'}]}})
        with self.assertRaisesRegex(ValueError,'nonnegative integer'):
            report.followup_data({'followupConstruction':{'leanAudit':{'newScalarTargets':True}}})

    def test_followup_module_pass_does_not_change_original_seventy_statuses(self):
        before=report.assemble()
        with tempfile.TemporaryDirectory(dir=HERE) as folder:
            data=Path(folder)/'followup-fixture.json'
            data.write_text(json.dumps({'followupConstruction':{
                'summary':['정확 국소 상계 fixture'],
                'modules':[{'id':'axis','title':'축 인증','status':'PASS',
                    'implementation':['명시적 pressure의 국소 성분'],
                    'remaining':['완성된 outer pressure 연결 필요']}],
                'leanAudit':{'originalImportedTargets':16,'newScalarTargets':4,
                             'negativeControlsPassed':1},
            }}))
            after=report.assemble(data)
        self.assertEqual(before['counts'],after['counts'])
        self.assertEqual(len(after['items']),70)
        for old,new in zip(before['items'],after['items']):
            for key in ['id','title','detail','accept','status']:
                self.assertEqual(old[key],new[key])
        self.assertEqual(after['followupConstruction']['modules'][0]['id'],'axis')

    def test_followup_counts_and_three_lean_roles_are_not_combined(self):
        model={'metadata':{'version':'v-next'},'tests':{
            'arithmetic':{'lean':31},'gauge':{'lean':27},'navier':{'lean':13},
            'officialNS':{'pass':2,'total':2,'toolchain':'4.34.0-rc2'},
            'followup':{
                'axis':{'label':'축 JS','pass':27,'total':27,'artifact':'axis-tests.tap'},
                'independent':{'label':'독립 유리수','pass':131,'total':131,'artifact':'exact.json'},
            }},'followupConstruction':{'leanAudit':{
                'originalImportedTargets':16,'newScalarTargets':4,'negativeControlsPassed':1}}}
        main=dict(report.release_test_rows(model))
        self.assertTrue(main['실제 로컬 Lean target'].startswith('71개:'))
        self.assertEqual(main['원래 rc2 C/D 제출 정리'],'2 / 2 / Lean 4.34.0-rc2')
        self.assertEqual(report.followup_test_rows(model),[
            ['축 JS','27 / 27','axis-tests.tap'],['독립 유리수','131 / 131','exact.json']])
        self.assertEqual(report.followup_lean_rows(model),[
            ['새로 조사한 원문 exported 타입·공리 참조','16개'],
            ['새로 검사한 정확 스칼라 정리','4개'],
            ['새 거짓 스칼라 명제의 음성 대조','1개']])

    def test_updated_n3_remaining_does_not_reopen_closed_local_bounds(self):
        rows=report.ns_pending_rows([
            {'id':'N3-03','status':'PARTIAL',
             'implementation':['국소 Bρ invariant ball·복소 Ω·tail 인증 완료'],
             'remaining':['완성된 outer pressure와 기존 finite η-jet의 동일성 연결이 필요하다.']},
        ])
        self.assertEqual(rows,[['N3-03 PARTIAL',
            'N3-03: 완성된 outer pressure와 기존 finite η-jet의 동일성 연결이 필요하다.']])
        self.assertNotIn('수축상수',rows[0][1])
        self.assertNotIn('공통 복소영역',rows[0][1])

    def test_followup_story_displays_supplied_modules_without_inventing_c12(self):
        class Recorder:
            def __init__(self,model): self.model=model;self.calls=[]
            def __getattr__(self,name):
                return lambda *args,**kwargs:self.calls.append((name,args,kwargs))
        model={'tests':{'followup':{'axis':{'label':'축 JS','pass':27,'total':27}}},
               'followupConstruction':{'summary':['국소 인증'],
                 'modules':[{'id':'axis','title':'축 인증','kind':'ns.axis-certificate',
                   'status':'VERIFIED_LOCAL_BOUND_CERTIFICATE','implementation':['무한 계수 상계'],
                   'scope':['생성 해석 전제 전체의 Lean 증명은 아님'],
                   'remaining':['실제 pressure 연결 필요'],'artifacts':['axis.json'],
                   'formulas':[r'B/(2\Lambda)\leq 1'],
                   'commands':['node axis-test.mjs']}],
                 'leanAudit':{'originalImportedTargets':16,'newScalarTargets':4,
                              'negativeControlsPassed':1,'artifact':'axis-pinned-audit.json'}}}
        recorder=Recorder(model)
        report.followup_pages(recorder)
        serialized=json.dumps(recorder.calls,ensure_ascii=False)
        for text in ['ns.axis-certificate','무한 계수 상계','실제 pressure 연결 필요',
                     'axis-pinned-audit.json','원문 타입 참조','별도 검증 기록']:
            self.assertIn(text,serialized)
        self.assertNotIn('C.12',serialized)
        empty=Recorder({'tests':{},'followupConstruction':{}})
        report.followup_pages(empty)
        self.assertEqual(empty.calls,[])


if __name__=='__main__':
    unittest.main()
