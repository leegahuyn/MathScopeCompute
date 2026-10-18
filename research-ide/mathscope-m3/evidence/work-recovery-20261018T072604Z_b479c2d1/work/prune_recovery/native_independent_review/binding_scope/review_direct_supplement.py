#!/usr/bin/env python3
"""Independent byte/role review of the finite direct-operand supplement."""
import argparse
from collections import defaultdict
import gzip
from hashlib import sha256
import importlib.util
import json
from pathlib import Path

from review_frozen_bindings import ROOT, OUT, HEADER, EXPORT, NATIVE, HEADER_PIN, check, file_pin


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT/'work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz')
    args = parser.parse_args()
    supplement_path = NATIVE/'evidence/DIRECT_INDEXED_OPERAND_SUPPLEMENTS.json'
    recipes_path = NATIVE/'evidence/FINITE_INDEXED_RECIPES.json'
    supplement = json.loads(supplement_path.read_bytes())
    recipes = json.loads(recipes_path.read_bytes())
    existing = {int(k): v for k,v in json.loads(EXPORT.read_bytes())['records'].items()}
    records = {int(k): v for k,v in supplement['records'].items()}
    check(file_pin(HEADER)['sha256'] == HEADER_PIN, 'Changed original header')
    for name, path in [('sourceHeader',HEADER),('rawClosure',EXPORT),('recipeInput',recipes_path)]:
        check(supplement[name]['sha256'] == file_pin(path)['sha256'], 'Supplement input join failed: '+name)
    roles = defaultdict(set)
    narrow = set()
    for recipe in recipes['recipes']:
        for root in recipe['outerParameters']: roles[root].add('outer_formal')
        for root in recipe['outerArgumentNodes']: roles[root].add('caller_argument')
        for row in recipe['rows']:
            groups = [('local_body',[row['localBody']]),('local_formal',row['localParameters']),
                      ('local_argument',row['argumentNodes']),('row_coefficient',[row['rowCoefficientNode']])]
            for guard in row['guards']:
                check(len(guard) == 3, 'Malformed guard role tuple')
                groups.extend(zip(['guard_selector','guard_left','guard_right'], [[root] for root in guard]))
            for role, roots in groups:
                for root in roots:
                    roles[root].add(role); narrow.add(root)
            for derivative in row['derivatives']:
                for root in derivative['coefficientNodeFactors']: roles[root].add('map_coefficient')
    requested = set(roles)
    check(len(requested) == 453 and len(narrow) == 425, 'Independent direct-root count changed')
    check(sorted(requested) == supplement['requestedDirectOperandIDs'], 'Supplement selected different recipe roots')
    missing = requested - set(existing)
    check(set(records) == missing and len(missing) == 429, 'Supplement missing/extra raw records')
    check(len(narrow-set(existing)) == 411 and narrow-set(existing) <= set(records), 'Narrow 411-root review not covered')
    check(args.source.stat().st_size == 32688149, 'Original gzip size mismatch')
    full_hash = sha256()
    with args.source.open('rb') as source:
        for block in iter(lambda: source.read(1024*1024), b''): full_hash.update(block)
    check(full_hash.hexdigest() == '42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3', 'Original gzip byte pin mismatch')
    compared = set()
    with gzip.open(args.source,'rb') as source:
        check(source.readline() == HEADER.read_bytes(), 'Original header line differs byte-for-byte')
        for expected, line in enumerate(source):
            root, node = json.loads(line)
            check(root == expected, 'Source prefix sequence mismatch')
            if root in records:
                check(records[root] == node, 'Supplement differs from original source record '+str(root))
                compared.add(root)
            if compared == set(records): break
    check(compared == set(records), 'Source prefix did not contain all selected records')
    helper_path = ROOT/'recovered/base/analysis/base/PR30-recovery-handoff/MathScopeCompute/tools/n6-native-domain-frontier-20261015/native_domain_extract.py'
    check(file_pin(helper_path)['sha256'] == '566e1a18b5417cafecf9fe7a4cd2e38d1e270c0cc29c1d984448a579a2a92f9d', 'Operand grammar changed')
    spec = importlib.util.spec_from_file_location('independent_operand_grammar',helper_path)
    helper = importlib.util.module_from_spec(spec); spec.loader.exec_module(helper)
    available = set(existing) | set(records)
    immediate = {child for node in records.values() for child in helper.argument_children(node)} - available
    check(sorted(immediate) == supplement['additionalImmediateArgumentDependencies'] and len(immediate) == 418, 'Immediate missing dependency count differs')
    for key in ['transitiveScalarClosureComplete','formalDerivativeBodiesMaterialized','callerDomainsNumericallyChecked','scalarNumericalEvaluationComplete','original128555ClosureRewritten','N706_closed','N805_closed']:
        check(supplement[key] is False, 'Supplement overclaims '+key)
    output = {'schema':'MathScope.IndependentDirectIndexedSupplementReview/1','status':'PASS_DIRECT_SOURCE_RECORDS_ONLY',
              'inputs':[file_pin(path) for path in [supplement_path,recipes_path,HEADER,EXPORT,helper_path,Path(__file__),NATIVE/'code/recover_indexed_operands.py']],
              'whole_gzip_sha256':full_hash.hexdigest(),'compressed_bytes':32688149,'exact_header_sha256':HEADER_PIN,
              'source_prefix_records_scanned':expected+1,'direct_operand_count':453,'original_export_present':24,
              'new_records_compared_to_original_gzip':429,'narrow_row_operand_count':425,'narrow_missing_roots_recovered':411,
              'direct_operand_roles':{str(root):sorted(value) for root,value in sorted(roles.items())},
              'remaining_immediate_dependencies':418,'all_direct_recipe_roots_available_with_supplement':True,
              'native_producer_executed':False,'source_producer_executed':False,'existing_tests_repeated':False,'sqlite_used':False,
              'transitive_scalar_closure_complete':False,'formal_derivatives_materialized':False,
              'scalar_numeric_evaluation_complete':False,'N706_closed':False,'N805_closed':False}
    (OUT/'DIRECT_SUPPLEMENT_REVIEW.json').write_text(json.dumps(output,indent=2)+'\n')
    print(json.dumps({key:output[key] for key in ['status','direct_operand_count','new_records_compared_to_original_gzip','narrow_missing_roots_recovered','remaining_immediate_dependencies']}))


if __name__ == '__main__': main()
