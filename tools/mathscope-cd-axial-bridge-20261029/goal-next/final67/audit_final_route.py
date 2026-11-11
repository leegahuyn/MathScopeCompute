"""Audit the exact inputs and missing operator bridge for the 67 source jets."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys

HERE=Path(__file__).resolve().parent
M3=HERE/'source/research-ide/mathscope-m3'
CLOSURE=M3/'closure-evidence-20261023'
sys.path.insert(0,str(CLOSURE))
from compile_original_67jet_force_stencil import compile_stencil
from verify_real_67jet_readiness import load_source,REQ,FAMILY

REACHED='5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459'
MANIFEST='af597477e3927cca830b1c3211b61b93b64d63e553f7370ea07822528db9ee3c'
SUBTRACTION='6ad8e9a933b88c08088b581e18775c909479906fa38aef93db73d67e8bce8da1'
JOBS={'A0':19,'A1':19,'A2':19,'b':6,'p':4}
DIRECT_GRAMMAR={
    'rational','coordinate','add','multiply','inverse','integer_power',
    'exp','log_positive','sqrt_positive','source_parameter',
}


def pinned(path, sha):
    raw=path.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==sha,path
    return json.loads(raw)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('reached','manifest','subtraction','out'):
        p.add_argument('--'+name,required=True,type=Path)
    args=p.parse_args()
    reached=pinned(args.reached,REACHED)
    manifest=pinned(args.manifest,MANIFEST)
    subtraction=pinned(args.subtraction,SUBTRACTION)
    req,req_sha=load_source(REQ)
    family,family_sha=load_source(FAMILY)
    assert family_sha==req['actual_family_sha256']
    stencil=compile_stencil(req)
    assert stencil['original_target_counts']==JOBS and stencil['original_cutoff_count']==13
    assert family['numerical_field_evaluator'] is family['numerical_supremum_evaluator'] is False
    assert not req['available_family_evaluator'] and not req['available_supremum_evaluator']
    assert not req['alternate_family_selected'] and not req['missing_values_replaced_by_zero']
    assert reached['roots']==manifest['original_root_ids']
    assert len(reached['nodes'])==159655 and len(reached['entries'])==1745
    assert len(reached['calls'])==523
    assert subtraction['verdict']=='VERIFIED_EXACT_PRINCIPAL_FLAT_SUBTRACTION'
    assert subtraction['completeSecondForcingInput'] is False
    assert manifest['node_count']==4420257 and manifest['final_all_cycle_A_b_p'] is False
    assert manifest['actual_final_67_jets_certified']==0
    assert manifest['all_order_math_proved'] is False
    histogram=Counter(node['op'] for _,node in reached['nodes'])
    unsupported={k:v for k,v in sorted(histogram.items()) if k not in DIRECT_GRAMMAR}

    elementary=(CLOSURE/'sourceexpressions_elementary_intervals.py').read_text(encoding='utf8')
    for tag in DIRECT_GRAMMAR-{'exp','log_positive','sqrt_positive'}:
        assert f"op=='{tag}'" in elementary
    assert "op in ('exp','log_positive','sqrt_positive')" in elementary
    assert 'raise UnsupportedOriginalNumericKernel(op,i)' in elementary

    assembler=(M3/'navier/final-summation/source-final-summation.mjs').read_text(encoding='utf8')
    assert all(token in assembler for token in (
       'UNRESOLVED_ACTIVE_SET','INCOMPLETE_ACTIVE_SOURCE','INVALID_POTENTIAL',
       'NONAXISYMMETRIC_DIRECT_MEAN','UNSUBSTITUTED_SOURCE_COORDINATE',
       'base.A[i],...stages.map(row=>row.cutoffPotential[i])',
       'finalPotential:A,finalDirectMean:B,velocity,pressure',
       'sourceCoefficientNormsAuthenticated:false,sourceCurrentRootsAuthenticated:false',
       'originalFinalN6FieldConstructed:false'))
    ids={n['id']:n for n in family['nodes']}
    first_scale=ids[req['frozen_scale_nodes'][0]]
    first_scale_bounds=[ids[i] for i in first_scale['inputs'] if ids[i]['operation']=='ActualCutoffCurlBound']
    assert len(first_scale_bounds)==2
    pending_second_source=ids['f_68465a2d86d9ee074ccccd4b']
    pending_second_forced=ids['f_a242f88bead89cbf747ec4d4']
    assert pending_second_source['operation']=='GroupedSupportedNonzeroResidual'
    assert pending_second_forced['operation']=='OriginalForcedMap'
    assert pending_second_source['id'] in pending_second_forced['inputs']

    result={'schema':'MathScope.M3.Final67ExactNumericalRouteReadback/1',
      'sourceInputs':{'requestSHA256':req_sha,'familySHA256':family_sha,
                     'preFinalExportManifestSHA256':MANIFEST,'reachedSourceSHA256':REACHED,
                     'principalSubtractionSHA256':SUBTRACTION,
                     'principalSubtractionVerdict':subtraction['verdict'],
                     'completeSecondForcingInput':subtraction['completeSecondForcingInput']},
      'originalJetRequest':{'fieldCounts':JOBS,'cutoffCount':stencil['original_cutoff_count'],
                            'coordinates':req['coordinates'],'domain':req['requested_domain']},
      'actualPreFinalRootInventory':manifest['original_root_ids'],
      'genericIntervalCoverageOfPreFinalOnly':{
        'sourceNodes':len(reached['nodes']),'nativeEntryPoints':len(reached['entries']),
        'operationKinds':len(histogram),'syntaxRecognizedOperationKinds':len(histogram)-len(unsupported),
        'unimplementedByThisInterpreter':unsupported,'nodesOfThoseKinds':sum(unsupported.values()),
        'recognizedSyntaxDoesNotDischargeNodeDomains':True,
        'partialSpecializedNativeKernelsDoNotProvideGlobalDispatcher':True},
      'earliestMissingInputs':{
        'secondSupportedResidual':pending_second_source,
        'secondOriginalForcedMap':pending_second_forced,
        'firstScale':first_scale,
        'firstScaleCutoffCurlBoundIDs':[node['id'] for node in first_scale_bounds]},
      'finalCompiler':{'entryPoint':'constructFinalSummationFromRoots',
        'requiresCompleteActiveStageWindow':True,
        'operands':'Authentic A0,A1,A2,b,p for base and every active stage with identical graph and original q; source-only scale bounds',
        'scalarRadialMeanRecovery':'retain b_j(s,z,tau) before Cartesian substitution; sum b0+sum_j chi(a_j*q(z,tau))*b_j(s,z,tau), then recheck pullback to finalDirectMean',
        'whyPressureAndVelocityAreInsufficient':'Gauge is not fixed by velocity; cutoff localization depends on it. First-cycle p does not include later active pressure increments.',
        'outputIsNotSourceAuthorityWithoutCallerBindings':True},
      'finalOriginalGaugeRootInventory':None,'actualFinalJetsCertified':0,
      'N7_06':'OPEN','N8_05':'OPEN','lastResolvedTau':None,'release':'HOLD'}
    args.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8',newline='\n')
    print(json.dumps({'jetTargetCounts':JOBS,'preFinalNodes':len(reached['nodes']),
                      'preFinalUnsupportedOpNodes':sum(unsupported.values()),'actualFinalJetsCertified':0}))

if __name__=='__main__':
    main()
