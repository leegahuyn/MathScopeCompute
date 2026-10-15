"""Bind scoped Picard0 evidence to immutable original obligation IDs.

This is an application boundary audit. Reachability is not a proof of the
contracts on a path. Actual background-row proofs are imported separately;
the audit never invents whole-g, derivative or PDE cancellation evidence.
"""
from __future__ import annotations
import argparse,hashlib,json
from collections import Counter
from pathlib import Path
from shared_structure_frontier import INPUT_PINS,exact_row_inventory
from native_domain_extract import require,sha

HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()

# The importer checks a fresh proof receipt, never reachability or a count alone.
# These are immutable original-source pins, not a new obligation program.
FIXED='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
MATRIX='2e854cc1c7ee577a4451dc9e93849212ae055dcccc705599ee109b7d10bbcf21'
TUPLES26='c4e4cf37d72ffd7ac0b1db624f261c7bbaffb5d7d802471964a98ab612e0b4af'
UNIVERSAL='a399ab7fe02f9890f1e6be57752c07b0de7664fdc4cf0deeafed67133ecce7ed'
GUARDS='9fdac2c5a830d92d69c74504f7c1deaf69553456d9349d7cab2d187b4bc2e8b7'
CANONICAL_HEADER='bf22a99a1ff0b83cd022c31bc4c21aff92d6489359ab4d1c983f8662b0e0f464'
SOURCE_PINS={'parentSHA256':'7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f',
 'sourceScalarSHA256':'aa2da2a3ee1a12ffd9fc24d471271fc62f6b8723d75813a91eabb68713adc0a8',
 'sourceStage4MatrixSHA256':'8ac413724219323a8c422d011a3bdb3b38e0d9cd74dee8c308475e9b3bd2456b'}
# Exact IDs, bodies, and hashes are also checked against the independently
# authenticated consumer registry (684 is absent from compact84;683 is also
# absent from the semantic consumer graph and is bound by the fresh producer).
BODY_PINS={681:(622868,'ab50815281dd1979fe62c59f244c4c09541a8f62472744f126cc24866022fa93'),
 682:(622869,'9fc783876c46919beafe50091d2cdc8d8f4dc384cf0338c941cce55aad83aaa5'),
 684:(622871,'c5bb0794f8fb1489a64d6b32509fd2c678f3531dd029218070f0e37883cc62a1'),
 685:(622873,'3618ef839deca9581fba63320aea2742c49ceaa1e88aeb3fe7c896e4ee3fefc5'),
 688:(622901,'197e505cbe4ed2110e3316eff253f096fed57021d27a94eebafa9f2af3db7dd8'),
 689:(622911,'6f997be9785065a622cf0537dbaa4969011fc04a51f602efbb770f64677de554'),
 690:(622921,'a526a3dd59cb97bf4ec8cdfcf8f6c0599f8725877097fde2e63e8efb89fe7d3e'),
 691:(622931,'56996c659b56c10f5e79808d26ecedc14d6cc0700b98c9a35798f320ae865ca6')}
BODIES={681,682,683,684,685,688,689,690,691}
HELPERS={688:681,689:682,690:685,691:684}
CHART='e53efe521098aa99b855aa457a26f35edec45e6f74224d650afce71b80fec958'
SOURCE_FILES={
 'research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
 'research-ide/mathscope-m3/navier/source-global-band.mjs':'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
 'research-ide/mathscope-m3/navier/source-global-current.mjs':'93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760',
 'research-ide/mathscope-m2/navier/actual-residual-order-induction-background.mjs':'e04a02a8878168d673fd7deed45de6bbfb2591ec58f3abc9eb8f08e1d2770879',
 'research-ide/mathscope-m2/navier/actual-covariance-sensitivity.mjs':'f27ed95c3a1e40a4dfa4a38340d170aa92c7ec6102b277c952e1dc2dc91ac27c'}


def exact_true(record,*keys):
    require(all(record.get(k) is True for k in keys),'Missing or nonboolean proof witness: '+','.join(keys))


def source_binding(binding):
    require(binding.get('schema')=='MathScope.N6.SourceHeaderBinding/1','Missing authenticated source header')
    require(binding.get('sourceHeaderRecordSHA256')==binding.get('detachedHeaderFileSHA256')==HEADER and
            binding.get('sourceHeaderCanonicalSHA256')==CANONICAL_HEADER,'Changed original source header')
    exact_true(binding,'canonicalJSONEqual','typeSensitiveComparison')
    require(binding.get('registryConsumedFrom')=='source gzip first record','Unauthenticated registry source')


def actual_body_witness(proof,native_definitions):
    require(isinstance(proof,dict),'Open body premise cannot close background rows')
    exact_true(proof,'allNormalizedAndPhysicalBodiesCompared','allBodyPrimitiveDomainsChecked','finiteN1Only')
    require(proof.get('infiniteBackgroundEqualityClaimed') is False,'Unproved infinite background equality')
    ledger=proof.get('bodyLineages',[])
    require(len(ledger)==9 and {r['definition'] for r in ledger}==BODIES,'All nine complete body lineages required')
    require(isinstance(native_definitions,dict),'Authenticated consumer native registry required for reached definitions')
    for row in ledger:
        index=row['definition'];d=native_definitions.get('expression:'+str(index),{})
        #683 is genuinely not reached by the consumer graph; its fresh header
        #registry identity is repeated by the complete producer primitive walk.
        require(index==683 and not d or (row.get('body'),row.get('definitionSHA256'))==(d.get('body'),d.get('definitionSHA256')),
                'Different actual source body/definition hash '+str(index))
        require(isinstance(row.get('body'),int) and type(row['body']) is int and
                isinstance(row.get('definitionSHA256'),str) and len(row['definitionSHA256'])==64,'Malformed source body identity')
        if index in BODY_PINS:require((row['body'],row['definitionSHA256'])==BODY_PINS[index],'Changed immutable background body '+str(index))
        if index in HELPERS:
            exact_true(row,'literalActualChartAndMultiplierCompared')
            require(row.get('normalizedDefinition')==HELPERS[index],'Changed normalized helper body')
        else:exact_true(row,'literalCompleteFiniteN1FormulaCompared')
    chart=proof.get('actualChart',{})
    exact_true(chart,'actualEquationAndCoordinatesCompared','positiveSInOriginalInterval',
      'physicalTNonnegativeImpliesAbsEtaAtMostOne','strictPositiveTImpliesAbsEtaLessThanOne','noNegativeTClaim')
    require(chart.get('definitionSHA256')==CHART,'Changed actual slow-chart definition hash')
    require(chart.get('etaIdentity')=='T_physical=s*(1-eta^2)','Missing original physical chart identity')
    cutoff=proof.get('cutoff',{})
    require(cutoff.get('definition')==680 and cutoff.get('body')==622845,'Changed original flat cutoff')
    exact_true(cutoff,'actualFlatBodyCompared')
    require(bool(cutoff.get('allOrdersAtEndpoints')),'Missing flat cutoff endpoint proof')
    cp=proof.get('leadingCp',{})
    require(cp.get('definition')==677 and cp.get('body')==617755,'Changed original pressure primitive')
    exact_true(cp,'exactFiniteIntegralOfSameF0Squared','movingEndpointAndAxisCoveredByActualLeadingCInfinity')
    selector=proof.get('selector',{})
    require(selector.get('actualScaleRoot')==617466,'Changed actual selector scale')
    exact_true(selector,'finiteStrictlyPositive')
    require(type(selector.get('constantAncestorCount')) is int and selector['constantAncestorCount']>0 and
            len(selector.get('constantSourceIDSetSHA256',''))==64 and selector.get('allConstantPrimitiveDomains'),
            'Missing complete constant primitive domain proof')
    primitive=proof.get('actualPrimitiveClosureAudit',{})
    require(primitive.get('schema')=='MathScope.N6.ActualBackgroundPrimitiveClosure/1',
            'Actual uncancelled primitive closure certificate required')
    exact_true(primitive,'completeActualClosure','allOperandsCheckedBeforeAlgebraicCancellation',
      'allActualNativeTuplesChecked','allConditionalBranchesAuditedOnTheirOwnDomains')
    require(primitive.get('unprovedFrontier')==[],'Unproved actual body primitive frontier')
    require(primitive.get('actualPrimitiveDomainChecks') and primitive.get('nativeBoundaryCalls') and
            len(primitive.get('visitedSourceIDsSHA256',''))==64,'Incomplete actual primitive walk witness')
    require(all(r.get('proved') is True for r in primitive['actualPrimitiveDomainChecks']),
            'An actual primitive domain was not proved')
    require({r.get('sourceRoot') for r in primitive.get('approvedBoundaryRoots',[])}=={3451,9239,617466} and
            len(primitive['approvedBoundaryRoots'])==3,'Changed approved actual P0/M0/selector proof boundaries')
    require(primitive.get('actualChartDefinitionSHA256')==chart['definitionSHA256'],
            'Primitive walk uses a different actual chart')
    branches=primitive.get('actualCutoffBranchAudits',[])
    integrals=primitive.get('actualCpIntegralAudits',[])
    require(branches and all(r.get('allThreeActualBranchesScopedAndChecked') is True and
            r.get('originalFlatEndpointExponentialProofRetained') is True for r in branches),
            'Actual lazy-cutoff branch scopes or endpoint proof missing')
    require(integrals and all(r.get('allActualIntegrandPrimitivesChecked') is True and
            r.get('finiteContinuousIntegralWithMovingUpperEndpoint') is True for r in integrals),
            'Actual Cp integral scope/domain proof missing')
    require(all(r.get('sameApprovedContractAndTuple') is True or
                r.get('originalImageAndPositiveRootIntervalChecked') is True for r in primitive['nativeBoundaryCalls']),
            'Actual native tuple/domain was not checked')
    # Exact nine source identities must be independently repeated by the walk;
    # it must not accept only the algebraically simplified body templates.
    domains=primitive.get('bodyRootsAndDefinitionHashes',[])
    expected={(r['definition'],r['body'],r['definitionSHA256']) for r in ledger}
    actual={(r['definition'],r['body'],r['definitionSHA256']) for r in domains if r.get('definition') in BODIES}
    require(actual==expected and len([r for r in domains if r.get('definition') in BODIES])==9,
            'Primitive walk does not cover all nine actual body roots')


def background_proved_ids(background,matrix,original_rows,*,native_definitions=None):
    require(background['schema']=='MathScope.N6.ActualBackground26JetRegularity/1','Actual background source proof required')
    require(matrix['schema']=='MathScope.N6.ActualBackground26RowContinuation/1','Separate immutable-parent matrix required')
    source_binding(background.get('sourceHeaderBinding',{}));source_binding(matrix.get('sourceHeaderBinding',{}))
    require(background.get('fixedDefinitionSHA256')==FIXED,'Changed original fixed definition')
    files=background.get('originalSourceFiles',[])
    require(len(files)==len(SOURCE_FILES) and {r.get('path'):r.get('sha256') for r in files}==SOURCE_FILES,
            'Changed original source domain/endpoint contracts')
    require(background.get('rowClosureMode')=='ALL26_OR_NONE','Changed original row closure mode')
    require(background.get('inputSHA256',{}).get('matrix')==matrix.get('parentHistoricalMatrixSHA256')==MATRIX,
            'Changed authenticated historical matrix')
    for key,pin in SOURCE_PINS.items():require(matrix.get(key)==pin,'Changed original source identity '+key)
    exact_true(matrix,'originalHistoricalMatrixUntouched','originalUniversalRequirementsUnchanged','originalPDECountUnchanged')
    require(sha(matrix.get('originalUniversalRequirements'))==UNIVERSAL,'Original fourteen universal requirements changed')
    require(sha(matrix.get('remainingGlobalGuardIDs'))==GUARDS,'Changed original OPEN Guard identities')
    require(matrix.get('before')=={'GlobalGuard':10,'CartesianJet':230,'PDE':1020,'total':1260},'Changed original initial residual counts')
    require(matrix.get('after',{}).get('PDE')==1020,'Unproved PDE closure')
    require(matrix.get('newDischargedGuardIDs')==[] and matrix['after']['GlobalGuard']==10,'Unproved whole-g Guard closure')
    require(all(matrix.get(k) is False for k in ('allOriginal1266Closed','wholeFunctionRegularityProved','allBandsInfiniteBackgroundEqualityProved')),
            'Unproved whole-function or infinite background closure')
    require(background.get('wholeGOnJProved') is False and background.get('allInfiniteBandsEquivalenceClaimed') is False,
            'Background receipt exceeds finite physical-body scope')
    require(background.get('newOriginalGuardsDischarged')==background.get('newOriginalPDETermsDischarged')==0,'Unexpected nonjet discharge')
    rows=background['actualOriginalBackgroundRows'];require(len(rows)==len({r['id'] for r in rows})==26,'Changed or duplicated original background family')
    require(sha(sorted((r['id'],r['sourceNode'],r['orderedSourceCoordinates']) for r in rows))==TUPLES26,
            'Expected exact original background26 tuple inventory')
    known={r['id']:r for r in original_rows};require(len(known)==len(original_rows)==230,'Changed original230 row inventory')
    proved=[];absent=0
    for row in rows:
        require(row['id'] in known,'Nonoriginal background row')
        old=known[row['id']]
        for key in ('sourceNode','sourceCallSHA256','orderedSourceCoordinates'):
            require(row[key]==old[key],'Changed ordered original background request '+key)
        index=688+row['sourceNode']-622932
        require(index in (688,689,690,691) and row.get('registry')=='expression:'+str(index),'Changed original registered family')
        require(row['sourceCallSHA256']==sha({'op':'actual_expression_partial','args':[index,[622802,622803,622804,622791],[0,0,0,0]]}),
                'Changed original source call AST')
        ordered=row['orderedSourceCoordinates'];zeros=[j for j in ordered if j not in (622802,622803,622804,622791)]
        require(row.get('absentSourceCoordinates')==zeros,'Changed absent-direction ledger')
        require(row.get('partialTargetOrders')==(None if zeros else [ordered.count(j) for j in (622802,622803,622804,622791)]),
                'Changed exact native derivative target')
        require(row.get('exactDerivativeValue')==('0' if zeros else 'same original registered ordinary partial, with original one-sided T=0 convention'),
                'Changed original endpoint/derivative convention')
        absent+=bool(zeros);exact_true(row,'originalOrderedRequestPreserved')
        if row['status']=='PROVED':
            require(row.get('actualFunctionDerivativeExistenceProved') is True,'A formal absent coordinate is not an earlier derivative proof')
            proved.append(row['id'])
        else:require(row['status']=='OPEN' and row.get('actualFunctionDerivativeExistenceProved') is False,'Inconsistent original row proof status')
    require(absent==9,'Changed original nine absent-direction requests')
    require(len(proved) in (0,26),'All26-or-none proof violated')
    require(len(proved)==background['provedOriginalBackgroundRowCount']==background['newOriginalJetsDischarged'],'Background proof count mismatch')
    require(proved==matrix['newDischargedJetIDs'],'Separate matrix differs from exact ordered actual proof rows')
    require(matrix['newDischarged']=={'GlobalGuard':0,'CartesianJet':len(proved),'PDE':0},'Separate matrix count mismatch')
    require(matrix['after']=={'GlobalGuard':10,'CartesianJet':230-len(proved),'PDE':1020,'total':1260-len(proved)},'Original remaining totals mismatch')
    require(matrix['remainingJetIDs']==[r['id'] for r in original_rows if r['id'] not in set(proved)],'Lost or reordered an original OPEN jet')
    require(background.get('remainingOriginalJetCount')==230-len(proved),'Changed exact remaining jet count')
    if proved:
        require(background.get('unprovedBodyDomainGaps')==[] and background.get('unprovedPrimitiveFrontier') is None,
                'Open body premise cannot close background rows')
        actual_body_witness(background.get('actualSourceBodyProof'),native_definitions)
    else:
        require(background.get('actualSourceBodyProof') is None and background.get('unprovedBodyDomainGaps'),
                'OPEN body receipt must retain its concrete premise gap')
    return set(proved)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('guards','jets','pde','frontier','consumers','numeric','background','matrix','increment','out'):
        p.add_argument('--'+name,type=Path,required=True)
    a=p.parse_args();paths={k:getattr(a,k) for k in vars(a) if k!='out'}
    d={k:json.loads(v.read_text(encoding='utf8')) for k,v in paths.items()};h={k:digest(v) for k,v in paths.items()}
    require(all(h[k]==v for k,v in INPUT_PINS.items()),'Changed original obligation inputs')
    gr,jr,pr=exact_row_inventory(d['guards'],d['jets'],d['pde']);original={r['id']:r for r in gr+jr+pr}
    f,c,n=d['frontier'],d['consumers'],d['numeric']
    require(f['schema']=='MathScope.N6.SharedSourceStructureFrontier/1' and f['everyOriginalRowRetainedExactlyOnce'],'Actual all-row source frontier required')
    require(c['schema']=='MathScope.N6.ActualPicardConsumerGraph/1','Actual semantic consumer graph required')
    require(n['schema']=='MathScope.N6.ActualPicardOriginalNumericMajorant/1' and n['sourceHeaderSHA256']==HEADER,'Actual unchanged Picard0 receipt required')
    require(n['actualSourceAndAnalyticInputsComposed'] and n['numericC1KCertifiedTailBoundsProvedHere'],'No numeric proof can be propagated')
    require(not n['wholeGOnJProved'] and not n['actualBnormThresholdApplicationProved'],'This audit requires separately reviewed evidence before promoting whole-g or Bnorm')
    require(c['inputSHA256']['numeric']==h['numeric'],'Consumer graph uses a different Picard theorem')
    require(c['semanticEdgesUseReviewedASTFieldsOnly'] and not c['metadataIntegersScannedAsNodeDependencies'],'Semantic graph contains unreviewed metadata edges')
    require(not c['allPathCallsAndArgumentSubstitutionsDomainProved'],'Independent domain evidence must be added before changing application status')
    for k in INPUT_PINS:
        require(f['inputSHA256'][k]==c['inputSHA256'][k]==h[k],'Graph uses different original rows')
    require(d['background']['inputSHA256']['compact']==f['inputSHA256']['compact']==c['inputSHA256']['compact']==n['inputSHA256']['compact'],'Mixed original source excerpts')
    cf={r['id']:r for r in c['originalRows']};ff={r['id']:r for r in f['originalObligationRows']}
    require(len(cf)==len(c['originalRows'])==len(ff)==1260 and set(cf)==set(ff)==set(original),'Consumer/frontier dropped or substituted an original row')
    source_binding(c.get('sourceHeaderBinding',{}))
    proved=background_proved_ids(d['background'],d['matrix'],jr,native_definitions=c.get('nativeDefinitions'))
    inc=d['increment']
    require(inc['schema']=='MathScope.N6.SharedPDEIncrementIdentity/1' and inc['independentComponentResiduals']==['0']*3,'Independent full PDE increment kernel required')
    require(inc['actualNonlinearSquareRetained'] and all(inc['strictNegativeControls'].values()),'Missing nonlinear/cross/cutoff terms')
    require(not inc['physicalForceDeclaredZero'] and not inc['sourceApplicationComposed'],'Generic identity cannot be promoted to a full source evaluation')
    rows=[];reach=Counter()
    for ident,old in original.items():
        front,consumer=ff[ident],cf[ident];family=front['family']
        require(consumer['family']==family,'Changed original row family')
        path=consumer.get('picard0Path');affected=bool(path)
        require(consumer['roots']==front['sourceRoots'],'Changed original consumer roots')
        if affected:
            require(path in c['picard0ShortestWitnessPaths'],'Missing actual source witness')
            witness=c['picard0ShortestWitnessPaths'][path]
            require(witness and sha(witness)==path,'Changed source witness digest')
            require(consumer['witnessSourceRoot'] in consumer['roots'],'Nonoriginal source witness seed')
            require(witness[0]['from']=='n:'+str(consumer['witnessSourceRoot']) and witness[-1]['to']=='d:picard:0','Different actual proof-consumer path endpoints')
            require(all(left['to']==right['from'] for left,right in zip(witness,witness[1:])),'Disconnected source witness')
            require(consumer['picard0ValueBodyPath']==all(e['role']=='value' for e in witness),'Contract path relabeled as a value body')
        if affected:reach[family]+=1
        row={'id':ident,'family':family,'sourceRoots':front['sourceRoots'],
             'picard0HasDeclaredSourceDependencyWitness':affected,'picard0Path':path,
             'picard0PathRole':'value-body' if consumer.get('picard0ValueBodyPath') else 'contract-only' if affected else None,
             'sourceReachabilityProvesConsumerContract':False,
             'status':'PASS' if ident in proved else 'OPEN',
             'closedBy':'separate actual original background body regularity and ordered derivatives' if ident in proved else None,
             'picard0ReuseCandidate':affected,'actualPicard0DomainTransportProved':False,
             'numericLemmaAloneDischargesThisRow':False}
        if family=='Guard':
            row['originalGuard']=old['originalGuard']
            row['remainingProofContracts']=['actual complete_gr joint C1 on the entire original pressure interval and a common parameter neighborhood',
              'all native domains and fixed-label transport on that interval',
              'uniform domination plus the actual moving-endpoint Leibniz formula including the cutoff derivative']
        elif family=='CartesianJet':
            for key in ('sourceNode','sourceCallSHA256','definitionSHA256','orderedSourceCoordinates','classification','conditionalTarget'):
                row[key]=old[key]
            row['remainingProofContracts']=[] if ident in proved else ['actual native body ordinary derivative existence on the unchanged caller domain',
              'actual ordered chain-rule/AD compatibility including every earlier derivative before an absent direction',
              'all fixed-label, cutoff and physical endpoint joins']
        else:
            for key in ('coefficient','sourceFactors','sourceTermSHA256'):row[key]=old[key]
            row['remainingProofContracts']=['actual full field and every requested ordinary derivative',
              'each actual local residual equals the normalized full differential operator increment',
              'exact initialized mean, disjoint pair tensors and flat joins',
              'same source pressure and force; all nonlinear squares/cross products and cutoff derivatives',
              'independent complete component direct-minus-assembled cancellation; no single-monomial zero assumption']
        rows.append(row)
    pde_components=[]
    for comp in d['pde']['components']:
        rr=comp['rows'];pde_components.append({'component':comp['component'],'originalRowIDs':[r['id'] for r in rr],
          'originalCoefficientFactorInventorySHA256':sha([[r['id'],r['coefficient'],r['sourceFactors'],r['sourceTermSHA256']] for r in rr]),
          'coupledResidualOperands':comp['coupledResidualOperands'],
          'picard0ReachableOriginalRows':sum(bool(cf[r['id']].get('picard0Path')) for r in rr),
          'genericIncrementIdentityVerified':True,'actualSourceDirectMinusAssembledComposed':False,
          'monomialsIndividuallyDeclaredZero':False,'status':'OPEN'})
    result={'schema':'MathScope.N6.PicardReuseApplicationAudit/1','sourceHeaderSHA256':HEADER,'inputSHA256':h,
      'everyOriginal1260IDRetained':True,'allSourceConstantsDefinitionsAndQuantifiersRetained':True,
      'reusedProof':'same source Picard0 B/C1, common value tube, smaller derivative tube, both scoped solutionNorm fields, original Kcondition and each requested Kprecision',
      'semanticReachByOriginalFamily':dict(reach),'reachCountIsNotDischargeCount':True,
      'actualPASSGuardIDs':[],'actualPASSJetIDs':sorted(proved),'actualPASSPDEIDs':[],
      'newOriginalDischarged':{'Guard':0,'Jet':len(proved),'PDE':0},
      'remaining':{'Guard':10,'Jet':230-len(proved),'PDE':1020,'total':1260-len(proved)},
      'originalUniversalRequirements':d['matrix']['originalUniversalRequirements'],
      'pdeDirectMinusAssembledPropagation':pde_components,'originalRows':rows,
      'proofScope':'This audit imports only separately proved original rows. Picard0 reach is a reusable premise with every other consumer contract still explicit.'}
    a.out.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
    print(json.dumps({'allOriginalIDs':1260,'semanticPicard0Reach':dict(reach),'remaining':result['remaining'],'newPicardLemmaOnlyDischarges':0}))

if __name__=='__main__':main()
