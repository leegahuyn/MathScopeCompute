#!/usr/bin/env python3
"""New read-only proof application to the authenticated original definitions."""
import argparse,gzip,json
from native_binding import *

def main():
    b=SourceBindings()
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,default=ROOT/b.closure['source_file'])
    args=parser.parse_args()
    picard_path=PROOFS/'ACTUAL_PICARD_ORIGINAL_NUMERIC_MAJORANT.json'
    picard=json.loads(picard_path.read_text())
    actual=b.registry['picard'][0]
    parameter_matches={k:b.fixed['source']['parametersExactExpressions'][k]==v for k,v in picard['actualParameterASTConstraints'].items()}
    tail_matches={k:actual['tail'][k]==v['root'] for k,v in picard['sourceConstants'].items()}
    # The gzip byte pin authenticates the complete original source. This small
    # early scan is portable and never treats a mutable SQLite cache as authority.
    expected_gzip='42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3'
    if args.source.stat().st_size!=32688149:raise Unresolved('full gzip source size changed')
    source_hash=sha256()
    with args.source.open('rb') as raw:
        for chunk in iter(lambda:raw.read(1024*1024),b''):source_hash.update(chunk)
    if source_hash.hexdigest()!=expected_gzip:raise Unresolved('full gzip source byte pin changed')
    wanted={int(k) for k in picard['originalConstantCone'] if int(k) not in b.nodes}
    scanned={}
    with gzip.open(args.source,'rb') as stream:
        if stream.readline()!=HEADER.read_bytes():raise Unresolved('exact original stream header differs')
        for expected_index,line in enumerate(stream):
            index,node=json.loads(line)
            if index!=expected_index:raise Unresolved('original source sequence changed')
            if index in wanted:scanned[index]=node
            if len(scanned)==len(wanted):break
    if set(scanned)!=wanted:raise Unresolved('original source missing requested Picard constants')
    source_authentication={'compressedSHA256':expected_gzip,'compressedBytes':32688149,'exactHeaderSHA256':EXPECTED_HEADER_SHA256,
                           'wholeCompressedSourceAuthenticated':True,'sourceNodesScanned':expected_index+1,'selectedNodeCount':len(scanned),'SQLiteUsed':False}
    comparisons=[];supplements={}
    for key,expected in picard['originalConstantCone'].items():
        node=b.nodes.get(int(key));route='authenticated initialized closure'
        if node is None:
            node=scanned[int(key)];route='original gzip after full compressed-byte authentication';supplements[key]=node
        if node!=expected:raise Unresolved('Picard source constant differs '+key)
        comparisons.append({'node':int(key),'matchesOriginalProof':True,'route':route})
    if not all(parameter_matches.values()) or not all(tail_matches.values()):raise Unresolved('Picard source proof binding mismatch')
    write('PICARD_SOURCE_CONSTANT_SUPPLEMENTS.json',{'sourceHeader':pin(HEADER),'sourceAuthentication':source_authentication,'selectedNodes':supplements,
                                                'allComparedToOriginalProof':True,'scope':'source proof attachment only; no root or call closure expanded'})
    original_root=ROOT/'recovered/base/analysis/base/PR30-primary67-continuation/pressure-proof'
    primary_path=original_root/'inputs/PRIMARY_INDEXED_SOURCE.json'
    primary=json.loads(primary_path.read_text())
    primary_matches={key:row['definition']==b.registry['fieldDefinitions'][int(key)] for key,row in primary['fields'].items()}
    if not all(primary_matches.values()):raise Unresolved('original indexed definitions mismatch')
    application_path=original_root/'original-norm-scope-audit/PRIMARY_WAVE_QUANTITATIVE_SOURCE_APPLICATION.json'
    application=json.loads(application_path.read_text())
    if application['actualTargetBinding']['waveRegistryIDs']!=[6,7,8]:raise Unresolved('primary theorem target mismatch')
    if not all(application['provedConclusions'].values()):raise Unresolved('primary quantitative source theorem conclusions missing')
    selected_matches={k:b.nodes.get(int(k))==v for k,v in application['selectedSourceNodesReadOnly'].items() if int(k) in b.nodes}
    if not all(selected_matches.values()):raise Unresolved('primary theorem selected original nodes differ')
    picard_calls=[{'node':i,'args':n['args']} for i,n in b.nodes.items() if n['op']=='actual_background_even_profile']
    core_plans=[b.picard_core_enclosure_plan(r['node'],Interval(0,4),Interval(-1,1)) for r in picard_calls]
    report={'schema':'MathScope.NewRecoveryExistingProofApplication/1','implementationKind':'NEW RECOVERY implementation; no lost-byte recovery claim',
        'header':pin(HEADER),'sourceParameterASTSHA256':b.fixed['source']['parameterExpressionSHA256'],
        'picard':{'existingProof':pin(picard_path),'sameActualParameterExpressions':parameter_matches,'sameOriginalTailRoots':tail_matches,
            'sameOriginalConstantNodeComparisons':comparisons,'actualCallCount':len(picard_calls),'allCallsSystem0':all(r['args'][0]==0 for r in picard_calls),
            'universalScope':picard['universalSourceScopedQuantifiers'],'solutionNormDomains':picard['bothOriginalSolutionNormFields'],
            'coreDerivativePlans':core_plans,'corePlansConditionalOnActualCallerDomain':True,'actualCallerDomainsNumericallyChecked':False,
            'ordinaryRadialCollarRule':'Use the original singular-diagonal Picard RHS and regular even-profile integral formula in actual-continuation-exact-functions.mjs; first form 2*k xi derivatives, then integrate against product t_j^(2*(k-1-j))/2^k. A common-collar value bound alone is not a radial Cauchy bound.',
            'smoothCollarDeclaredHolomorphicInX':False,'sourceStoredKReusedForEveryEtaOrder':False},
        'indexed':{'primaryDefinitionsSource':pin(primary_path),'exactFieldDefinitionMatches':primary_matches,
            'newerSourceProofApplication':pin(application_path),'reusedPrimaryProofPin':application['inputBindings']['primaryActual'],
            'inheritedConclusions':application['provedConclusions'],'actualWaveRegistryIDs':[6,7,8],'sameSelectedSourceNodes':selected_matches,
            'legacyFlagsDoNotNegateLaterProof':True,'legacySnapshotFlagsPreserved':True,
            'scope':'The later source application explicitly cites ACTUAL_PRIMARY_INDEXED_REGULARITY and proves grouped original primary wave classes for every fixed derivative. This is not a numerical evaluation of all indexed fields or all-stage norms.',
            'finiteRecipeCount':34,'allOtherSourceAcceptanceRowsChanged':False},
        'natural':{'tailSource':pin(M2/'actual-continuation-exact-tail.mjs'),'coefficientSource':pin(M2/'actual-continuation-exact-core.mjs'),
            'scope':'same nonlinear B_rho solution, radial base20, 0<=Y<=5, eta in[-1,1], all observed finite orders covered by explicit majorant',
            'numericValueEvaluated':False},
        'sourceNotRerun':True,'oldClosedScopeReopened':False,'noNewM3Closures':True,'N706_closed':False,'N805_closed':False,
        'remainingNumericalRequirements':[
            {'id':'lexical-domain-evaluation','requirement':'Evaluate actual argument boxes under all surrounding call/integral binders; prove every active branch domain. Source uniform bounds cannot establish those caller memberships by themselves.'},
            {'id':'natural-values','requirement':'Directed finite coefficient evaluations and certified complete radial tails at requested source values; the compressed uniform norm is a positive symbolic real bound, not the value.'},
            {'id':'picard-values','requirement':'Directed ordered term evaluations, source Kcondition/precision, common-collar vs analytic-core routing, and ordinary radial derivative majorants on the smooth collar.'},
            {'id':'root-refinement','requirement':'For sharper quadratic values evaluate actual continuous matrix/RHS operands. For twelve loop roots, and for numerical use of the two slow calls, evaluate original residuals and verify branch/endpoints in scope.'},
            {'id':'covariance','requirement':'Four retained actual covariance Volterra values with explicit coefficient/forcing enclosures and ordered-integral tails.'},
            {'id':'finite-derivatives','requirement':'Materialize and numerically evaluate 811 nonzero formal expression derivatives plus the local derivative requests in all34 guarded finite indexed recipes.'},
            {'id':'inverse-values','requirement':'Three inverse calls retain forcing bodies only: evaluate actual Fourier coefficient integrals, the original divisors, zero-Haar normalization and tail. A forcing value is not an inverse value.'},
            {'id':'final-global-numbers','requirement':'Assemble the original final/global A,b,p and derivative/energy norm targets and complete every actual scalar/integral enclosure; finite initialized source binding alone is insufficient.'}]}
    write('EXISTING_PROOF_APPLICATION.json',report)
    print(json.dumps({'picardConstantComparisons':len(comparisons),'picardSupplements':len(supplements),'picardParameterMatches':len(parameter_matches),
                      'primaryFieldDefinitionMatches':len(primary_matches),'primarySelectedNodeMatches':len(selected_matches),'newM3Closures':0},sort_keys=True))

if __name__=='__main__':main()
