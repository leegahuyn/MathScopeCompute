"""Small independent analytic controls for the recovered interval adapter."""
from pathlib import Path
from fractions import Fraction as Q
import hashlib
import json
import sys
from actual_energy_backend import (Interval as I, evaluate_unidentified_jets,
    energy_contract_nu_one, FrozenActualEnergyAdapter, MissingActualJet)

BASE = Path(__file__).resolve().parents[1]
ROOT = Path(sys.argv[1] if len(sys.argv)>1 else 'recovered/base').resolve()
binding = json.loads((BASE/'evidence/ACTUAL_ENERGY_OPERATOR_BINDING.json').read_text())
checks=[]


def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append(name)


def monomial_jet(terms, point, orders):
    """Independent derivatives of explicit polynomial fixtures."""
    total=Q(0)
    for powers, coefficient in terms.items():
        term=Q(coefficient)
        for power, order, value in zip(powers,orders,point):
            if order>power:
                term=0
                break
            for k in range(order):
                term*=power-k
            term*=value**(power-order)
        total+=term
    return total


for case in ('cutoff_potential','direct_swirl'):
    for point in ((2,3,5,7),(0,0,2,3),(-1,2,-3,2)):
        x,y,z,t=map(Q,point);s=x*x+y*y
        if case=='cutoff_potential':
            fields={'A2':{(2,0,1,1):1,(0,2,1,1):1},
                    'C':{(1,0,0):1,(0,1,0):1,(0,0,1):1},
                    'p':{(1,0,0,0):1,(0,1,0,0):1,(0,0,1,0):1,(0,0,0,1):1}}
            w=-2*z*t*(2*s+z+t);ws=-4*z*t;wss=Q(0)
            wz=-2*t*(2*s+2*z+t);wzz=-4*t;wt=-2*z*(2*s+z+2*t)
            c=s+z+t;p=x+y+z+t
            gradp=[2*x*p+c,2*y*p+c,p+c];pressure=c*p
        else:
            fields={'C':{(0,0,0):1},'b':{(2,0,0):1,(0,3,0):1,(0,0,1):1}}
            w=s*s+z**3+t;ws=2*s;wss=Q(2);wz=3*z*z;wzz=6*z;wt=Q(1)
            gradp=[Q(0)]*3;pressure=Q(0)
        jets={}
        for atom in binding['requiredAtoms']:
            if atom=='x0':jets[atom]=I.point(x);continue
            if atom=='x1':jets[atom]=I.point(y);continue
            field,orders=atom.split('@');orders=tuple(map(int,orders.split(',')))
            coords=(s,z,t) if field in ('C','b') else (x,y,z,t)
            jets[atom]=I.point(monomial_jet(fields.get(field,{}),coords,orders))
        result=evaluate_unidentified_jets(binding,jets)
        expected_u=[-y*w,x*w,Q(0)]
        expected_grad=[[-2*x*y*ws,-w-2*y*y*ws,-y*wz],
                       [w+2*x*x*ws,2*x*y*ws,x*wz],[Q(0)]*3]
        linear=-wt-(8*ws+4*s*wss+wzz)
        expected_f=[-y*linear-x*w*w+gradp[0],x*linear-y*w*w+gradp[1],gradp[2]]
        suffix=case+':'+str(point)
        check('velocity:'+suffix,result['velocity']==list(map(I.point,expected_u)))
        check('full-gradient:'+suffix,result['gradient']==[list(map(I.point,r)) for r in expected_grad])
        check('direct-force:'+suffix,result['force']==list(map(I.point,expected_f)))
        check('pressure:'+suffix,result['pressure']==I.point(pressure))
        check('kinetic:'+suffix,result['velocity_squared']==I.point(s*w*w))
        check('force-work:'+suffix,result['work_density']==I.point(sum(a*b for a,b in zip(expected_u,expected_f))))
        check('unidentified-not-promoted:'+suffix,result['actual_field_authenticated'] is False)

check('interval-square-crosses-zero',I(-2,3).square()==I(0,9))
check('interval-product-directed',I(-2,3)*I(-5,7)==I(-15,21))
check('nu1-sufficient-bound',energy_contract_nu_one(0,1,1,3,2)['nu_one_10_13_status']=='CERTIFIED')
check('nu1-force-norm-not-force-squared',energy_contract_nu_one(0,4,0,2,1)['nu_one_10_13_status']=='VIOLATED')
try:
    energy_contract_nu_one(I(0,1),0,0,0,0)
    raise AssertionError('nonexact E0 accepted')
except ValueError as e:
    check('initial-energy-exact-zero-guard',str(e)=='INITIAL_ENERGY_MUST_BE_EXACTLY_ZERO')
try:
    evaluate_unidentified_jets(binding,{})
    raise AssertionError('missing jets accepted')
except KeyError:
    checks.append('missing-generic-jets-not-zero')

adapter=FrozenActualEnergyAdapter(ROOT,binding)
for field in ('requiredAtoms','exactPolynomials','sourcePins'):
    changed=json.loads(json.dumps(binding))
    changed[field]=[] if isinstance(changed[field],list) else {}
    try:
        FrozenActualEnergyAdapter(ROOT,changed)
        raise AssertionError('tampered '+field+' accepted')
    except ValueError as e:
        check('tampered-'+field+'-rejected',str(e)=='CHANGED_EXACT_OPERATOR_BINDING')
changed_adapter=FrozenActualEnergyAdapter(ROOT,binding)
changed_adapter.binding['requiredAtoms']=[]
try:
    changed_adapter.required_request()
    raise AssertionError('post-construction changed request accepted')
except ValueError as e:
    check('post-construction-binding-change-rejected',str(e)=='CHANGED_EXACT_OPERATOR_BINDING')
try:
    adapter.evaluate_actual_cell()
    raise AssertionError('actual source jets silently available')
except MissingActualJet as e:
    request={'error_code':e.code,'message':str(e),**e.request}
    (BASE/'evidence/MISSING_ACTUAL_JET_REQUEST.json').write_text(json.dumps(request,indent=2)+'\n')
    check('actual-source-bound-request-not-zero',request['missing_values_replaced_by_zero'] is False)
    check('exact-source-67-required-field-jets',len(request['requested_field_jets'])==67)

angular_path=ROOT/'work/actual_evaluator/evidence/ACTUAL_ANGULAR_ENERGY_FRONTEND.json'
angular=json.loads(angular_path.read_text());closure=angular['numeric_coefficient_closure_attempt']
blockers={
    'schema':'MathScope.RecoveryActualEnergyAdapterBoundary/1',
    'implementation':'NEW_RECOVERY_IMPLEMENTATION_NOT_LOST_BYTES',
    'source_bound_jet_requests':'MISSING_ACTUAL_JET_REQUEST.json',
    'available_connections':[
        {'path':'work/remaining_chain/source/final-summation/source-final-summation.mjs',
         'function':'constructFinalSummationFromRoots',
         'requires':'Complete pulled-back Cartesian potential, axisymmetric scalar, pressure and exact active prefix',
         'provides':'Generic positive-window exact cutoff/curl consumer',
         'missing':'Same final-family numerical operands; supplied norm/root provenance remains external'},
        {'path':'work/remaining_chain/source/source-localization.mjs',
         'function':'fixedSourceInputs/localizationOperator',
         'provides':'Original (10.4) operator and exact cutoff',
         'missing':'The named final operands remain theorem inputs, not actual jet values'},
        {'path':'work/actual_evaluator/code/actual_angular_energy.py',
         'provides':'Actual initialized coefficient-root integrands and dependency walk',
         'missing':'Full final potential gauge, all recursive corrections, all cover-label joins, numerical coefficients'},
        {'path':'work/remaining_chain/source/source-exterior-force-jets.mjs',
         'provides':'Actual exterior positive-radius restriction',
         'missing':'Interior/correction/axis/whole-K final field values'}],
    'historical_initialized_frontier_before_full_source_recovery':{'path':str(angular_path.relative_to(ROOT)),
        'sha256':hashlib.sha256(angular_path.read_bytes()).hexdigest(),
        'same_header':angular['source_header_sha256'],
        'present_nodes':closure['present_nodes'],
        'missing_scalar_bodies':closure['missing_scalar_bodies'],
        'non_expression_native_kernels':closure['non_expression_native_kernels']},
    'current_recovered_source_connection':'ACTUAL_ENERGY_SOURCE_CONNECTION.json',
    'historical_frontier_is_not_current_missing_record_status':True,
    'frozen_exact_selector_evaluated':False,
    'whole_K_energy_integrated':False,
    'independent_space_time_defect_decrease':None,
    'cutoff_weight_is_not_energy':True,
    'alternate_sufficient_schedule_identified_with_original':False,
    'N706_closed':False,'N805_closed':False,'actual_last_resolved_tau':None}
(BASE/'evidence/ACTUAL_ADAPTER_BLOCKERS.json').write_text(json.dumps(blockers,indent=2)+'\n')
report={'schema':'MathScope.RecoveryEnergyVerification/1','checks':checks,'passed':len(checks),'failed':0,
        'scope':'Exact arithmetic/analytic fixture verification plus actual missing-jet boundary; fixtures do not instantiate actual field',
        'actual_field_values_computed':False,'N706_closed':False,'N805_closed':False}
(BASE/'evidence/RECOVERY_CHECKS.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':len(checks),'required_actual_field_jets':len(request['requested_field_jets']),
    'required_cutoff_jets':len(request['requested_cutoff_jets']),
    'historical_missing_original_scalar_records':len(closure['missing_scalar_bodies']),
    'historical_native_kernel_frontiers':len(closure['non_expression_native_kernels']),
    'current_frontier_connection':'ACTUAL_ENERGY_SOURCE_CONNECTION.json','N706_closed':False}))
