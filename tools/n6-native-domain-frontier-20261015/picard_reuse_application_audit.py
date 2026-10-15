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

def background_proved_ids(background,matrix,original_rows):
    require(background['schema']=='MathScope.N6.ActualBackground26JetRegularity/1','Actual background source proof required')
    require(matrix['schema']=='MathScope.N6.ActualBackground26RowContinuation/1','Separate immutable-parent matrix required')
    require(matrix['originalHistoricalMatrixUntouched'] and matrix['originalUniversalRequirementsUnchanged'],'Historical parent/quantifiers changed')
    require(matrix['originalPDECountUnchanged'] and matrix['after']['PDE']==1020,'Unproved PDE closure')
    require(matrix['newDischargedGuardIDs']==[] and matrix['after']['GlobalGuard']==10,'Unproved whole-g Guard closure')
    rows=background['actualOriginalBackgroundRows'];require(len(rows)==len({r['id'] for r in rows})==26,'Changed or duplicated original background family')
    known={r['id']:r for r in original_rows};proved=[]
    for row in rows:
        require(row['id'] in known,'Nonoriginal background row')
        old=known[row['id']]
        for key in ('sourceNode','sourceCallSHA256','orderedSourceCoordinates'):
            require(row[key]==old[key],'Changed ordered original background request '+key)
        require(row['originalOrderedRequestPreserved'],'Lost original derivative order')
        if row['status']=='PROVED':
            require(row['actualFunctionDerivativeExistenceProved'],'A formal absent coordinate is not an earlier derivative proof')
            proved.append(row['id'])
        else:require(row['status']=='OPEN' and not row['actualFunctionDerivativeExistenceProved'],'Inconsistent original row proof status')
    require(len(proved) in (0,26),'All26-or-none proof violated')
    require(len(proved)==background['provedOriginalBackgroundRowCount']==background['newOriginalJetsDischarged'],'Background proof count mismatch')
    require(set(proved)==set(matrix['newDischargedJetIDs']),'Separate matrix differs from actual proof rows')
    require(len(proved)==matrix['newDischarged']['CartesianJet'],'Separate matrix count mismatch')
    require(matrix['after']=={'GlobalGuard':10,'CartesianJet':230-len(proved),'PDE':1020,'total':1260-len(proved)},'Original remaining totals mismatch')
    require(set(matrix['remainingJetIDs'])==set(known)-set(proved),'Lost an original OPEN jet')
    require(len(matrix['remainingJetIDs'])==230-len(proved),'Duplicated remaining original jet')
    require(not proved or background['actualSourceBodyProof'] is not None and background['unprovedBodyDomainGaps']==[], 'Open body premise cannot close background rows')
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
    proved=background_proved_ids(d['background'],d['matrix'],jr)
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
