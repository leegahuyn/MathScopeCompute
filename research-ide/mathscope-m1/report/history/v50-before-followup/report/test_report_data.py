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
        self.assertIn('interval Newton',rows[0][1])
        self.assertIn('전 구간 cone margin',rows[0][1])
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


if __name__=='__main__':
    unittest.main()
