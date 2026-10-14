"""Strict original Prop.9.5 j0 dependency checker for cloud attempts.

The original universal obligations have immutable statement/root bindings.
Counters, workflow success, finite derivative tables and serialized PASS flags
cannot replace missing all-order or whole-domain proof implementations.
"""
from __future__ import annotations

from collections import Counter
from fractions import Fraction as Q
import hashlib
import json
from pathlib import Path

from guard_worker import PARENT, canonical, read, sha, write, find

REQUIREMENTS_SHA='6936a8bdb32be46f4afaaab6da3e8ca02ab0dc3d441eaf5d4c3bff97626ba988'
BINDINGS_SHA='de5475f98fac85972f52e3a5a62b14b71b00a0a277d43c6f9e0483d557b21f3e'
GUARDS_SHA='845c625abb5e677ae9c416afe40fdb37bfaf569ea27f5b603ca86aed6fd7115d'
REQUESTS_SHA='78a1d4c5dec48b2358b1a3a0341d264c4814e1bdce560142e02c8cdb877459ca'
SEQUENCE=['primary-current-pressure','temporal-8.20','post-temporal-8.12',
          'five-moments-8.25-on-new-P-J','post-moment-8.12']
REQUEST_BINDING_FIELDS=('actualOrDerivedOperand','operation','base',
    'orderedDifferentiationCoordinates','result','baseNode','syntacticSupport',
    'baseSourceNode','actualSourceNode','actualDefinitionKey',
    'actualDefinitionName','actualDefinitionSHA256','allActualApplicationArgumentsRetained')


def verify_request_binding(original,row,source_program=None):
    """Verify actual source meaning while allowing new computed explanations.

    The baseline's minimalObligation/proof/exactValue/status are historical
    assessment metadata. A worker may compute a new reason or exact formula;
    the original request is separately preserved, never used as a proof flag.
    """
    for key in REQUEST_BINDING_FIELDS:
        if key not in original or row.get(key)!=original[key]:
            raise ValueError('Original jet node/registry/directions/capture row changed: '+key)
    if 'originalRequest' in row and row['originalRequest']!=original:
        raise ValueError('Preserved complete original jet request changed')
    if 'originalMinimalObligation' in row and row['originalMinimalObligation']!=original.get('minimalObligation'):
        raise ValueError('Preserved original minimal obligation changed')
    if row.get('originalSourceNodeSHA256')!=sha(original['actualSourceNode']):
        raise ValueError('Original jet source node hash changed')
    if source_program is not None:
        coordinates=[source_program[x]['args'][1] for x in original['orderedDifferentiationCoordinates']]
        if row.get('orderedSourceCoordinates')!=coordinates:
            raise ValueError('Original ordered source-coordinate word changed')
    if row.get('closedOnOriginalLeafDefinedDomain') is True:
        if row.get('derivativeComputed') is not True or row.get('exactParameterAndCaptureSemantics',{}).get('pass') is not True:
            raise ValueError('A closed jet lacks its independently computed capture/calculus evidence')
    return True


def verify_original_matrix(matrix):
    if matrix['parentNodesSHA256']!=PARENT:raise ValueError('Original 3892594-node parent changed')
    if Q(matrix['B0'])!=Q(7,10) or Q(matrix['C0star'])!=Q(6,5):raise ValueError('Original Prop.9.5 thresholds changed')
    if matrix['orderedOriginalUpdates']!=SEQUENCE:raise ValueError('Original latest-pressure/update sequence changed')
    for key,expected in [('requirements',REQUIREMENTS_SHA),('actualOriginalSourceBindings',BINDINGS_SHA),
                         ('originalIndependentCartesianDomainGuards',GUARDS_SHA),('originalIndependentCartesianRequests',REQUESTS_SHA)]:
        if sha(matrix[key])!=expected:raise ValueError('Original statement, source roots or frontier substituted: '+key)
    if len(matrix['requirements'])!=14:raise ValueError('Missing original universal requirement')
    return True


def dependency_plan(requirement):
    ident=requirement['id']
    if ident.startswith('9.8-') or ident.startswith('9.9-'):
        return ['original-registered-source-existence','common-full-field-domain-support',
                'all-order-WMS-original-j0-norms','nonlinear-cutoff-flat-Fourier-Gaussian-tails']
    if ident.startswith('9.10-'):
        return ['original-registered-source-existence','common-full-field-domain-support',
                'exact-full-Haar-moment-and-Fubini','nonlinear-cutoff-flat-Fourier-Gaussian-tails']
    if ident=='9.4-common-domain-support-divergence':
        return ['original-registered-source-existence','all-original-global-guards',
                'common-full-field-domain-support','independent-full-divergence']
    if ident=='A-global-rayleigh-source-premises':return ['actual-global-Rayleigh-positive-envelope']
    if ident=='B-common-holomorphic-eta-strip':return ['actual-Picard-holomorphic-coefficient-norms','common-eta-strip-and-limit-transport']
    if ident=='C-actual-registered-cartesian-jets':return ['all-original-source-jets','all-original-global-guards','original-registered-source-existence']
    if ident=='E-all-three-full-original-PDE-components':
        return ['all-original-source-jets','all-original-global-guards',
                'three-exact-original-direct-minus-assembled-identities',
                'defined-original-domain-and-rounding-tail-enclosure']
    raise ValueError('Unknown immutable original obligation '+ident)


def stage_files(results_root,name):
    paths=sorted(Path(results_root).rglob(name))
    return [(str(p.relative_to(results_root)),read(p)) for p in paths]


def evaluate_acceptance(matrix,stage_results,baseline_requests=None,source_program=None):
    verify_original_matrix(matrix)
    # No implementation here proves the complete universal W/M/S, Haar, source
    # image or complex Picard premises. In particular a forged zero frontier
    # cannot bypass these missing original analytic hypotheses.
    for kind,files in stage_results.items():
        for path,data in files:
            for field in ['originalN601Complete','originalN602Complete']:
                if data.get(field) is True:raise ValueError('Unsupported stage completion promotion: '+path)
            for key in ['originalParentNodesSHA256','originalNodesSHA256','originalParentSHA256','sourceParentSHA256']:
                if key in data and data[key]!=PARENT:raise ValueError('Different original parent in '+path)
    coverage=[];jet_files=stage_results.get('jets',[]);seen=set();request_rows=[]
    for path,data in jet_files:
        if data.get('baselineRemainingRequests')!=365:raise ValueError('Original 365-jet frontier substituted')
        if data.get('attemptedRequests')!=len(data.get('requests',[])):raise ValueError('Jet attempt count mismatch')
        if data.get('newClosedOnOriginalLeafDefinedDomains')!=sum(r.get('closedOnOriginalLeafDefinedDomain') is True for r in data.get('requests',[])):
            raise ValueError('Jet closure count mismatch')
        for row in data['requests']:
            if row['requestId']!=f"cartesian-result:{row['result']}":raise ValueError('Jet result ID changed')
            if row['requestId'] in seen:raise ValueError('Duplicated original jet request across shards')
            seen.add(row['requestId']);request_rows.append(row)
            if row.get('unconditionalAnalyticJetProved') is not False:raise ValueError('Conditional leaf jet promoted to global proof')
    if baseline_requests is not None:
        expected={f"cartesian-result:{r['result']}":r for r in baseline_requests}
        if len(expected)!=365:raise ValueError('Original baseline 365 requests missing or duplicated')
        for row in request_rows:
            original=expected.get(row['requestId'])
            if original is None:raise ValueError('Invented source jet request')
            verify_request_binding(original,row,source_program)
        missing=sorted(set(expected)-seen)
    else:missing=[] if len(seen)==365 else ['Original baseline frontier comparison unavailable']
    coverage.append({'stage':'A','attempted':len(seen),'required':365,'missingOriginalRequestIDs':missing,
                     'completeOriginalCoverage':len(seen)==365 and not missing})
    comps={}
    for path,data in stage_results.get('residual',[]):
        i=data['component']
        if i in comps or i not in range(3):raise ValueError('Duplicated/substituted original PDE component')
        if data['sourceRoots']!={'direct':[3825257,3825259,3825261][i],'assembled':[3825348,3825349,3825350][i]}:
            raise ValueError('Original direct/assembled PDE source roots changed')
        if data['pinnedRemainingInputTerms']!=[169,197,654][i] or data['attemptedOriginalTerms']!=[169,197,654][i]:
            raise ValueError('Dropped original rational numerator term')
        if data['allOriginalMonomialsAndFailedAttemptsRetained'] is not True:
            raise ValueError('Original rational monomial/failure evidence removed')
        required_controls={'coefficient','omitted_original_term','source_witness_hash','output_factor'}
        if (data['independentVerifier']['status']!='INDEPENDENT_CERTIFICATE_REPLAY_PASS'
            or {c['mutation'] for c in data['negativeControls']}!=required_controls
            or len(data['negativeControls'])!=4
            or not all(c['rejected'] is True for c in data['negativeControls'])):
            raise ValueError('Residual independent verification/negative mutation control failed')
        if data['proofBoundary']['wholeCartesianPDEProved'] is not False:
            raise ValueError('Finite symbolic rational identity promoted to original Cartesian analytic proof')
        comps[i]=data
    coverage.append({'stage':'B','attempted':sum(d['attemptedOriginalTerms'] for d in comps.values()),
        'required':1020,'componentsPresent':sorted(comps),'completeOriginalCoverage':len(comps)==3})
    guards=stage_results.get('guards',[])
    if len(guards)!=1:raise ValueError('Exactly one complete Stage C result is required')
    g=guards[0][1];rows=g.get('rows',[])
    if g.get('originalGuardCount')!=94 or len(rows)!=94:raise ValueError('Dropped original global guards')
    if len({r['id'] for r in rows})!=94:raise ValueError('Duplicated original guard IDs')
    if [r['originalGuard'] for r in rows]!=matrix['originalIndependentCartesianDomainGuards']:
        raise ValueError('Changed original guard inventory')
    if g.get('globallyDischargedGuards')!=sum(r.get('provedByThisWorker') is True for r in rows):
        raise ValueError('Guard solved count does not match complete original inventory')
    if g.get('remainingGlobalGuards')!=sum(r.get('provedByThisWorker') is not True for r in rows):
        raise ValueError('Guard unresolved count does not match complete original inventory')
    dependencies={}
    for requirement in matrix['requirements']:
        for ident in dependency_plan(requirement):
            dependencies[ident]={'id':ident,'mathematicalStatus':'OPEN',
                'sourceExactProofImplementationAvailable':False,
                'reason':'No implemented source-bound proof closes this original universal premise. Finite exact identities and finite derivative certificates do not imply it.'}
    dependencies['all-original-global-guards'].update({
        'remaining':g['remainingGlobalGuards'],'attempted':94,
        'reason':'Every original guard has an exact source-bound attempted proof; remaining global guards and full registered-source images must be closed.',
        'finitePrimitiveProofsDischarged':g['globallyDischargedGuards']})
    deps=list(dependencies.values());obligations=[]
    for requirement in matrix['requirements']:
        obligations.append({**requirement,'status':'OPEN','dependencyIDs':dependency_plan(requirement),
            'wholeSourceCertificateIndependentlyVerified':False,
            'sourceBindingsVerifiedByImmutableDigest':True})
    return {'schema':'MathScope.N6.CloudStrictAcceptance/1','stage':'D',
        'strictInputValidation':'PASSED',
        'originalParentNodesSHA256':PARENT,'originalProp95j0BindingUnchanged':True,
        'B0':'7/10','C0star':'6/5','originalRequirementsSHA256':REQUIREMENTS_SHA,
        'allOriginalSourceBindingsSHA256':BINDINGS_SHA,'requirements':obligations,'dependencies':deps,
        'finiteStageResultCounts':{kind:len(files) for kind,files in stage_results.items()},
        'originalCalculationCoverage':coverage,
        'N6-01':{'status':'OPEN','originalCriterionComplete':False},
        'N6-02':{'status':'PARTIAL','originalCriterionComplete':False},
        'strictAcceptancePromoted':False,'original56Of64Changed':False,
        'testsOrCompletionFlagsUsedAsMathematicalProof':False,
        'numericWholeOriginalDomainEnclosure':None,
        'originalN601Complete':False,'originalN602Complete':False}


def run(context,results_root,out):
    matrix=read(context['matrix_path']);results_root=Path(results_root)
    sources={'guards':stage_files(results_root,'guard-result.json'),
             'jets':stage_files(results_root,'jet-results-shard-*.json'),
             'residual':stage_files(results_root,'residual-component-*-result.json'),
             'bounds':stage_files(results_root,'global-bounds-result.json')}
    baseline=read(find(context['baseline'],'cartesian-closure-result.json'))['remainingUnresolvedRequests']
    source_program=read(find(context['baseline'],'cartesian-source-checkpoint.json'))['cartesian']['scalarProgram']
    try:result=evaluate_acceptance(matrix,sources,baseline,source_program)
    except (ValueError,KeyError,TypeError) as error:
        # Always preserve a failed/partial acceptance report after missing or
        # invalid worker outputs; transport aggregation separately fails CI.
        verify_original_matrix(matrix)
        result={'schema':'MathScope.N6.CloudStrictAcceptance/1','stage':'D',
            'strictInputValidation':'FAILED','failure':{'type':type(error).__name__,'message':str(error)},
            'requirements':matrix['requirements'],'dependencies':[],
            'N6-01':{'status':'OPEN','originalCriterionComplete':False},
            'N6-02':{'status':'PARTIAL','originalCriterionComplete':False},
            'originalN601Complete':False,'originalN602Complete':False,
            'strictAcceptancePromoted':False,'original56Of64Changed':False}
    result['sameRunStageInputs']=[{'kind':kind,'path':name,'sha256':sha(data)}
        for kind,files in sources.items() for name,data in files]
    # Mutation controls independently exercise all immutable source boundaries.
    controls=[]
    for key in ['B0','C0star','parentNodesSHA256','orderedOriginalUpdates',
                'actualOriginalSourceBindings','requirements','originalIndependentCartesianDomainGuards']:
        changed=json.loads(json.dumps(matrix))
        if isinstance(changed[key],list):changed[key]=changed[key][:-1]
        elif isinstance(changed[key],dict):changed[key]={}
        else:changed[key]='0'
        try:verify_original_matrix(changed)
        except (ValueError,KeyError,TypeError):controls.append({'mutation':key,'rejected':True})
        else:raise AssertionError('Acceptance source-binding mutation was accepted: '+key)
    if sources['guards']:
        forged=json.loads(json.dumps(sources));forged['guards'][0][1]['originalN601Complete']=True
        try:evaluate_acceptance(matrix,forged,baseline,source_program)
        except ValueError:controls.append({'mutation':'stage claims universal completion','rejected':True})
        else:raise AssertionError('A serialized completion flag bypassed proof requirements')
    result['negativeControls']=controls
    write(Path(out)/'acceptance-result.json',result)
    print(json.dumps({'stage':'D','N6-01':result['N6-01'],'N6-02':result['N6-02'],
                      'originalUniversalRequirements':len(result['requirements']),
                      'openUniversalDependencies':len(result['dependencies']),
                      'sourceBindingMutationControlsRejected':len(controls)}))
    return result
