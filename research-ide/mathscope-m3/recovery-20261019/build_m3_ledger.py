"""Reconcile existing scoped M3 acceptance with authenticated later receipts.

This reads existing evidence; it neither reruns long research jobs nor promotes
new numeric work into an original acceptance condition.
"""
from pathlib import Path
import hashlib
import json

ROOT=Path(__file__).resolve().parents[3]
M3=ROOT/'research-ide/mathscope-m3'
CURRENT=M3/'evidence/work-continuation-20261018T081100Z_5f6a2d9c/CURRENT_ID_LEDGER.json'
BASE=M3/'evidence/work-recovery-20261018T072604Z_b479c2d1/recovered/base'


def pin(path):
    return {'path':str(path.relative_to(ROOT)),'bytes':path.stat().st_size,
            'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    originals=json.loads((M3/'ORIGINAL_M3_M4_CRITERIA.json').read_text())
    current=json.loads(CURRENT.read_text())
    late={row['id']:row for row in current['items']}
    progress={}
    source_pins=[pin(CURRENT),pin(M3/'ORIGINAL_M3_M4_CRITERIA.json')]
    for name in ['P7_PROGRESS.json','P8_PROGRESS.json','GAUGE_PROGRESS.json','N6_PROGRESS.json','N7_PROGRESS.json','N8_PROGRESS.json']:
        path=M3/name
        source_pins.append(pin(path))
        for row in json.loads(path.read_text())['criteria']:
            if row['id'] in progress:
                raise ValueError('DUPLICATE_ORIGINAL_CRITERION')
            progress[row['id']]={'source':str(path.relative_to(ROOT)),'row':row}
    rows=[]
    for original in originals['criteria']:
        cid=original['id']
        if cid not in progress:
            continue
        entry=progress[cid]
        old=entry['row']
        override=late.get(cid)
        references=[]
        for evidence in old.get('evidence',[]):
            name=evidence if isinstance(evidence,str) else evidence.get('path')
            if not name:
                continue
            candidates=[ROOT/name,M3/name,ROOT/'research-ide'/name]
            path=next((p for p in candidates if p.is_file() or p.is_dir()),None)
            observed=None
            if path:
                if path.is_file():
                    observed=pin(path)
                else:
                    members=[pin(p) for p in sorted(path.rglob('*')) if p.is_file()]
                    observed={'path':str(path.relative_to(ROOT)),'kind':'directory','members':members}
            references.append({'original_reference':name,'available':path is not None,
                               'observed':observed,
                               'meaning':'Referenced source/test/evidence within the inherited criterion; not a new execution.'})
        binding_checks=[]
        if override:
            for evidence in override.get('evidence_files',[])+override.get('independent_reviews',[]):
                path=BASE/evidence['path']
                actual=pin(path) if path.is_file() else None
                valid=actual is not None and actual['sha256']==evidence['sha256'] and actual['bytes']==evidence['size_bytes']
                binding_checks.append({'path':str(path.relative_to(ROOT)),'expected_sha256':evidence['sha256'],
                                       'expected_bytes':evidence['size_bytes'],'actual':actual,'matched':valid})
            if override['status']=='CLOSED' and not all(x['matched'] for x in binding_checks):
                raise ValueError('INHERITED_CLOSURE_EVIDENCE_MISMATCH: '+cid)
        accepted=override['status']=='CLOSED' if override else old['originalCriterionComplete']
        rows.append({'id':cid,'title':original['title'],'original_text':original['text'],
                     'source_page':original['page'],'blueprint_sha256':originals['sha256'],
                     'status':'INHERITED_COMPLETE_WITHIN_RECORDED_SCOPE' if accepted else 'OPEN',
                     'original_criterion_complete_inherited':accepted,'newly_closed_this_session':False,
                     'basis_ledger':str(CURRENT.relative_to(ROOT)) if override else entry['source'],
                     'inherited_scope':override.get('original_scope') if override else old.get('acceptanceScope',old.get('continuumClaim',old.get('implemented'))),
                     'numerical_vs_mathematical_scope':override.get('mathematical_vs_numerical_scope') if override else 'Inherited finite/model/external-theorem scope; no fresh global proof inferred.',
                     'remaining':override.get('remaining_original_obligations',[]) if override else old.get('remainingObligations',old.get('remaining',[])),
                     'available_references':references,'later_closure_hash_checks':binding_checks,
                     'historical_references_not_found_locally':[x['original_reference'] for x in references if not x['available']],
                     'all_supporting_research_reexecuted':False})
    if len(rows)!=64 or sum(x['original_criterion_complete_inherited'] for x in rows)!=62:
        raise ValueError('UNEXPECTED_RECONCILED_BASELINE')
    result={'schema':'MathScope.CurrentM3OriginalCriteriaLedger/1',
            'source_commit':'333d6095d4a2d2d69ceec9b25c44e1d3381e36d2',
            'source_pins':source_pins,'rows':rows,
            'M3':{'inherited_completed':62,'total':64,'newly_closed':0,'open':['N7-06','N8-05']},
            'initial_obligations':current['initial_obligations'],'constants':current['constants'],
            'actual_last_resolved_tau':None,
            'new_work_scope':['Actual original outer-cutoff closed-cell jets and exact zero extension',
                              'Source-pinned original scalar slow inverse and first/second derivatives on declared native input boxes'],
            'new_work_does_not_establish':['Nonzero whole-K final-field values','Actual global energy/refinement comparisons','N8 four-axis results and all separate tails'],
            'reconciliation_is_not_a_new_independent_proof_of_all_62':True,
            'historical_missing_references_are_reported_not_deleted':True}
    output=Path(__file__).parent/'M3_CURRENT_ORIGINAL_LEDGER.json'
    output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'path':str(output.relative_to(ROOT)),'sha256':pin(output)['sha256'],
                      'criteria':64,'inherited_complete':62,'newly_closed':0,
                      'later_evidence_hash_checks':sum(len(x['later_closure_hash_checks']) for x in rows),
                      'later_evidence_hash_matches':sum(sum(y['matched'] for y in x['later_closure_hash_checks']) for x in rows),
                      'missing_historical_references':sum(len(x['historical_references_not_found_locally']) for x in rows)}))


if __name__=='__main__':
    main()
