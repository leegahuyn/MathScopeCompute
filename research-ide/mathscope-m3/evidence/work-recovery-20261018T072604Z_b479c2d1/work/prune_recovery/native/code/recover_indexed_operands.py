#!/usr/bin/env python3
"""Recover the finite recipe's missing direct operands from original gzip bytes.

This supplements direct rows only. It is not a transitive dependency closure,
formal derivative materialization, numeric caller-domain check, or M3 closure.
"""
import argparse,gzip,importlib.util
from native_binding import *

def main():
    b=SourceBindings();parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,default=ROOT/b.closure['source_file']);args=parser.parse_args()
    path=OUT/'evidence/FINITE_INDEXED_RECIPES.json';plans=json.loads(path.read_text())
    wanted=set()
    for rec in plans['recipes']:
        # Recompute each finite plan against the pinned original definitions;
        # a stale or changed output cannot choose arbitrary new source rows.
        if rec!=b.indexed_recipe(rec['node']):raise Unresolved('indexed recipe changed')
        wanted.update(rec['outerParameters']);wanted.update(rec['outerArgumentNodes'])
        for row in rec['rows']:
            wanted.add(row['localBody']);wanted.update(row['localParameters']);wanted.update(row['argumentNodes']);wanted.add(row['rowCoefficientNode'])
            wanted.update(x for g in row['guards'] for x in g)
            for d in row['derivatives']:wanted.update(d['coefficientNodeFactors'])
    missing=wanted-set(b.nodes)
    if len(wanted)!=453 or len(missing)!=429:raise Unresolved('direct operand inventory differs')
    expected_sha='42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3'
    h=sha256()
    if args.source.stat().st_size!=32688149:raise Unresolved('gzip source size differs')
    with args.source.open('rb') as source:
        for block in iter(lambda:source.read(1024*1024),b''):h.update(block)
    if h.hexdigest()!=expected_sha:raise Unresolved('gzip source byte pin differs')
    rows={}
    with gzip.open(args.source,'rb') as source:
        if source.readline()!=HEADER.read_bytes():raise Unresolved('original header line differs')
        for expected_index,line in enumerate(source):
            index,node=json.loads(line)
            if index!=expected_index:raise Unresolved('source node sequence differs')
            if index in missing:rows[index]=node
            if len(rows)==len(missing):break
    if set(rows)!=missing:raise Unresolved('source missing requested direct operand')
    helper_path=ROOT/'recovered/base/analysis/base/PR30-recovery-handoff/MathScopeCompute/tools/n6-native-domain-frontier-20261015/native_domain_extract.py'
    if pin(helper_path)['sha256']!='566e1a18b5417cafecf9fe7a4cd2e38d1e270c0cc29c1d984448a579a2a92f9d':raise Unresolved('source operand grammar changed')
    spec=importlib.util.spec_from_file_location('pinned_direct_operand_grammar',helper_path);helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
    known=set(b.nodes)|set(rows);unresolved=set()
    for node in rows.values():unresolved.update(set(helper.argument_children(node))-known)
    report={'schema':'MathScope.NewRecoveryDirectIndexedOperands/1','implementationKind':'NEW RECOVERY direct-row extraction',
        'sourceHeader':pin(HEADER),'rawClosure':pin(CLOSURE),'recipeInput':pin(path),'operandGrammar':pin(helper_path),
        'sourceAuthentication':{'compressedSHA256':expected_sha,'compressedBytes':32688149,'exactHeaderSHA256':EXPECTED_HEADER_SHA256,
            'wholeCompressedSourceAuthenticated':True,'sourceNodesScanned':expected_index+1,'SQLiteUsed':False},
        'requestedDirectOperandCount':len(wanted),'alreadyPresentDirectOperands':len(wanted)-len(rows),'newDirectRecordCount':len(rows),
        'requestedDirectOperandIDs':sorted(wanted),'records':{str(k):rows[k] for k in sorted(rows)},
        'allDirectRecipeOperandsPresent':True,'additionalImmediateArgumentDependencies':sorted(unresolved),
        'transitiveScalarClosureComplete':False,'formalDerivativeBodiesMaterialized':False,'callerDomainsNumericallyChecked':False,
        'scalarNumericalEvaluationComplete':False,'original128555ClosureRewritten':False,'newM3Closures':0,'N706_closed':False,'N805_closed':False}
    write('DIRECT_INDEXED_OPERAND_SUPPLEMENTS.json',report)
    print(json.dumps({'requestedDirectOperands':len(wanted),'newDirectRecords':len(rows),'remainingImmediateDependencyNodes':len(unresolved),
                      'sourceNodesScanned':expected_index+1,'numericComplete':False,'newM3Closures':0},sort_keys=True))

if __name__=='__main__':main()
