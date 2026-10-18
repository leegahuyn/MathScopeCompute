"""Reproducible new cutoff continuation checks; no historical checks rerun."""
from pathlib import Path
from fractions import Fraction as Q
from itertools import product
import copy
import json
import sys

from cutoff_continuation import (ROOT, FAMILY_SHA, FAMILY_REL, SUPPORT_PINS,
    FrozenCutoffPlanner, I, backend, sha, selected_C_enclosure,
    conditional_scale_enclosure, certified_tail_start, cutoff_chain_jets,
    multiindices, normalized_box_integral)

OUT = ROOT/'work/resumed_continuation/cutoff/evidence'
OUT.mkdir(parents=True, exist_ok=True)


def write(name, obj):
    (OUT/name).write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n')


checks=[]


def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append({'id':name,'pass':True})


def rejects(name, call, code):
    try:
        call()
    except ValueError as e:
        check(name, str(e)==code)
    else:
        raise AssertionError(name+' unexpectedly accepted')


def main():
    recovered=ROOT/'recovered/base'
    planner=FrozenCutoffPlanner(recovered)
    plan=planner.plan('1/2',5)
    proof=plan['proof']
    check('actual-family-exact-fifth-stage-zero-tail-witness',
          proof['Taylor_degree']==4 and proof['exp_J_rational_lower']=='523/8'
          and proof['product_strict_lower']=='523/512')
    check('retain-all-four-possibly-active-original-stages',
          plan['possibly_active_stage_indices']==[1,2,3,4]
          and len(plan['serialized_active_correction_nodes'])==4)
    check('does-not-certify-base-coefficient-tail-or-prefix-values',
          plan['base_coefficient_series_tail_evaluated'] is False
          and plan['finite_prefix_values_evaluated'] is False)
    rejects('reject-terminal-slab-zero-lower',lambda:planner.plan('0'),
            'FINITE_NONZERO_PHYSICAL_TIME_SLAB_REQUIRED')
    rejects('reject-negative-cell-q',lambda:certified_tail_start('-1'),
            'POSITIVE_CELL_Q_LOWER_BOUND_REQUIRED')
    later=planner.plan(Q(1,256))
    check('unserialized-finite-prefix-is-explicit',
          bool(later['unserialized_active_stage_indices'])
          and later['finite_prefix_values_evaluated'] is False)
    write('ACTUAL_FINITE_PREFIX_PLAN.json',plan)

    # These are conditional arithmetic fixtures, never actual source selectors.
    check('ceil-image-straddles-integer-without-picking-side',
          selected_C_enclosure(I(Q(3,2),Q(5,2)))==I(3,4))
    check('ceil-image-exact-integer-and-zero',
          selected_C_enclosure(I.point(2))==I.point(3)
          and selected_C_enclosure(I.point(0))==I.point(1))
    scale=conditional_scale_enclosure(1,I.point(1),I.point(3),I.point(3),
                                     {0:(0,I.point(0)),1:(1,I(Q(3,2),Q(5,2)))})
    check('same-frozen-scale-formula-conditional-interval-image',scale['L']==I.point(1600)
          and scale['actual_selector_authenticated'] is False)
    rejects('all-frozen-derivative-orders-required',
            lambda:conditional_scale_enclosure(1,I.point(1),I.point(3),I.point(3),{0:(0,I.point(0))}),
            'ALL_ORDERS_ZERO_THROUGH_J_REQUIRED')
    rejects('interval-valued-exponent-rejected-as-not-exact-integer',
            lambda:conditional_scale_enclosure(1,I.point(1),I.point(3),I.point(3),
                                               {0:(I(0,1),I.point(0)),1:(1,I.point(1))}),
            'EXACT_NONNEGATIVE_MINIMAL_P_REQUIRED')

    # chi(s)=s^3 and q(x)=x at q=2,a=1/4 provide a chain-rule control.
    # This polynomial is expressly a fixture, not the original flat cutoff.
    qjets={(0,):I.point(2),(1,):I.point(1),(2,):I.point(0),(3,):I.point(0)}
    jets=cutoff_chain_jets(qjets,[I.point(Q(1,8)),I.point(Q(3,4)),I.point(3),I.point(6)],I.point(Q(1,2)),3,1)
    check('fixed-a-derivative-before-s-over-q-substitution',
          [jets[(k,)] for k in range(4)]==[I.point(Q(1,8)),I.point(Q(3,16)),I.point(Q(3,16)),I.point(Q(3,32))])
    # q=x+y+2, a=1/4. The mixed xy derivative of chi(aq) equals 3*a^2.
    q2={a:I.point(0) for a in multiindices(2,2)}
    q2[(0,0)]=I.point(2);q2[(1,0)]=q2[(0,1)]=I.point(1)
    j2=cutoff_chain_jets(q2,[I.point(Q(1,8)),I.point(Q(3,4)),I.point(3)],I.point(Q(1,2)),2,2)
    check('multivariate-mixed-cutoff-chain-jet',j2[(1,1)]==I.point(Q(3,16)))
    zerojets=cutoff_chain_jets(qjets,[],I(1,2),3,1)
    check('original-flat-zero-branch-needs-no-chi-values',all(v==I.point(0) for v in zerojets.values()))
    rejects('missing-q-jet-rejected',lambda:cutoff_chain_jets({(0,):I.point(2)},[],I.point(1),3,1),
            'INCOMPLETE_Q_JETS')

    # Exact coverage/integration fixture on a whole box, independent of old
    # 54-check operator controls and their 540-term symbolic expansion.
    edges=[[-1,0,1],[-1,1],[-1,1]]
    cells=[{'index':i,'enclosures':{'velocity_squared':I.point(2),'dissipation_density':I(1,3)}}
           for i in product(range(2),range(1),range(1))]
    result=normalized_box_integral(edges,cells,['velocity_squared','dissipation_density'])
    check('whole-box-measure-applied-to-enclosed-densities',
          result['integrals']['velocity_squared']==I.point(16)
          and result['integrals']['dissipation_density']==I(8,24)
          and result['actual_field_authenticated'] is False)
    rejects('whole-box-missing-cell-rejected',lambda:normalized_box_integral(edges,cells[:-1],['velocity_squared']),
            'WHOLE_BOX_COVER_INCOMPLETE')
    rejects('whole-box-duplicate-cell-rejected',lambda:normalized_box_integral(edges,cells+[cells[0]],['velocity_squared']),
            'DUPLICATE_OR_OUT_OF_DOMAIN_CELL')
    rejects('duplicate-density-name-cannot-double-count-integral',
            lambda:normalized_box_integral(edges,cells,['velocity_squared','velocity_squared']),
            'DISTINCT_NONEMPTY_QUANTITIES_REQUIRED')

    binding_path=ROOT/'work/prune_recovery/energy/evidence/ACTUAL_ENERGY_OPERATOR_BINDING.json'
    binding=json.loads(binding_path.read_text())
    adapter=backend.FrozenActualEnergyAdapter(recovered,binding)
    request=adapter.required_request()
    check('same-energy-target-keeps-67-plus13-original-jet-requests',
          len(request['requested_field_jets'])==67 and len(request['requested_cutoff_jets'])==13
          and request['actual_family_sha256']==FAMILY_SHA)
    family=planner.family
    norm_path=recovered/family['source_norm_family']['path']
    check('frozen-norm-archive-hash-retained',sha(norm_path)==family['source_norm_family']['sha256'])
    norms=json.loads(norm_path.read_text())
    criteria_path=recovered/'work/m4_criteria/M3_REMAINING_NUMERIC_REQUIREMENTS.json'
    criteria=json.loads(criteria_path.read_text())
    original=[r for r in criteria['requirements'] if r['id'] in ('N7-06','N8-05')]

    norm_review={
      'schema':'MathScope.ExactFrozenSelectorRemainingPremises/1',
      'family_sha256':FAMILY_SHA,
      'source_norm_archive':{**family['source_norm_family'],'hash_rechecked':True},
      'saved_norm_family_scope':norms['family']['scope'],
      'saved_certificates':[{'scope':c['scope'],'exactDeferredSourceNormExpressions':c['exactDeferredSourceNormExpressions'],
                            'allIntegerDerivativeGraphsExecuted':c['allIntegerDerivativeGraphsExecuted']}
                            for c in norms['certificates']],
      'selector_premises':planner.selector_premises(),
      'minimality_is_existing_frozen_definition_not_new_acceptance_gate':True,
      'original_criteria_do_not_require_this_unique_schedule': 'The exact min/ceil functionals define the already chosen frozen family. No claim is made that the paper permits only this choice. An alternative sufficient original-compliant schedule would require an explicit separate construction, source rebinding and revalidation; it is not silently substituted here.',
      'sufficient_bound_warning': 'S_pbar <= M implies P_hat <= pbar, but does not bound S_(P_hat) by M. A different sufficient C,P does not evaluate or preserve the frozen scale.',
      'counterexample':{'Lambda_domain':'[1,infinity)', 'F_N':'N*Lambda^2/(N+Lambda)',
                        'S_2_upper':'1','P_min':'1','S_1':'N','C_selected':'N+1',
                        'scope':'abstract selector distinction, not an actual source replacement'},
      'conditional_computable_routes':[
          'Prove finite S_hat_0 with a certified global upper bound: minimal P_hat is then exactly zero.',
          'For p>0 prove finite S_hat_p and infinite S_hat_(p-1); Lambda>=1 covers all smaller p.',
          'Once P_hat is identified, any rigorous interval [Slo,Shi] encloses C by [1+ceil(Slo),1+ceil(Shi)]; exact supremum equality is unnecessary for an enclosing L interval.',
          'A ceiling interval crossing an integer may remain nontrivial; do not replace it by its midpoint or claim a selected exact integer.'
      ],
      'scale_supremum_reparametrization':{
          'identity':'sup_(a>=1,(x,t) in D) W*|T_a Z_j|_m = sup_((x,t) in D,q<=s<=1) W*|D^alpha T_a Z_j evaluated at a=s/q|_max',
          'weight':'W=q^(ellPrime_m-g_j)/(1+|log q|)^p',
          'derivative_order_rule':'Differentiate with a CONSTANT, then substitute a=s/q; do not differentiate the substituted expression at fixed s.',
          'reason':'For q>0, s=a*q is a bijection [1,infinity) to [q,infinity); all cutoff jets vanish on s>=1.',
          'remaining_noncompact_endpoint':'q approaches zero; this still requires actual weighted source bounds and exponent minimality',
          'actual_values_evaluated':False},
      'original_criteria':original,
      'no_fixed_tolerance_or_invented_grid':True,
      'actual_selector_values_evaluated':False,
      'N706_closed':False,'N805_closed':False,'actual_last_resolved_tau':None}
    check('all-twenty-serialized-selector-premise-rows-retained',len(norm_review['selector_premises'])==20)
    write('FROZEN_SELECTOR_PREMISES.json',norm_review)
    write('ENERGY_INTEGRATION_CONNECTION.json',{
      'schema':'MathScope.CutoffFinitePrefixEnergyConnection/1',
      'family_sha256':FAMILY_SHA,
      'operator_binding':{'path':str(binding_path.relative_to(ROOT)),'sha256':sha(binding_path)},
      'required_original_field_jets':request['requested_field_jets'],
      'required_original_outer_cutoff_jets':request['requested_cutoff_jets'],
      'stage_tail_on_planned_positive_slab':'Exactly zero, by ACTUAL_FINITE_PREFIX_PLAN.json',
      'still_missing':['Actual stages1..4 canonical potential/direct scalar/complete pressure derivatives and exact active selector enclosures',
                       'Actual initialization and slow-base coefficient series values, native values and their independent tails',
                       'Closed-cell enclosures for all67+13 jets and physical tau0,z0, followed by actual whole-K quadrature',
                       'Independent space/time numerical defect decrease and original N8-05 four-axis comparisons'],
      'normalized_coordinates':{'physical_x':'xi','physical_y':'upsilon','physical_z':'z0*zeta','physical_tau':'tau0*s',
                                'spatial_box':'[-1,1]^3 in xi,upsilon,zeta',
                                'whole_K_in_box':'K: xi^2+upsilon^2<=1/2 and zeta^2<=1/2',
                                'spatial_measure':'z0 dxi dupsilon dzeta','space_time_measure':'z0*tau0 dxi dupsilon dzeta ds'},
      'energy_route':{'velocity_squared':'z0 * normalized spatial integral of velocity_squared',
                      'dissipation':'z0*tau0 * normalized space-time integral of dissipation_density',
                      'work':'z0*tau0 * normalized space-time integral of work_density',
                      'force_norm_integral':'tau0 * integral_s sqrt(z0 * spatial integral of force_squared) ds',
                      'time_orientation':'t=1-tau0*s; from t=1-tau0 to target t corresponds to integral s_target..1',
                      'initial_energy':'0 on t<=1-tau0 by original exact temporal zero branch'},
      'code_consumer':'normalized_box_integral validates full rectangular cover and exact rational cell measures; it does not authenticate its input enclosures.',
      'actual_whole_K_integrated':False,'generic_fixture_numbers_are_actual_energy':False,
      'N706_closed':False,'N805_closed':False,'actual_last_resolved_tau':None})

    write('CONTINUATION_CHECKS.json',{'schema':'MathScope.CutoffContinuationChecks/1',
      'checks':checks,'passed':len(checks),'failed':0,
      'scope':'New support-application and arithmetic consumer controls only; no historical54/540 replay.',
      'actual_numeric_field_values':0,'actual_selector_values':0,
      'N706_closed':False,'N805_closed':False,'actual_last_resolved_tau':None})
    write('INPUT_PINS.json',{'family':{'path':str((recovered/FAMILY_REL).relative_to(ROOT)),'sha256':FAMILY_SHA},
      'support_sources':[{'path':str((recovered/p).relative_to(ROOT)),'sha256':v} for p,v in SUPPORT_PINS.items()],
      'norm_archive':{'path':str(norm_path.relative_to(ROOT)),'sha256':sha(norm_path)},
      'criteria':{'path':str(criteria_path.relative_to(ROOT)),'sha256':sha(criteria_path)},
      'energy_backend':{'path':str((ROOT/'work/prune_recovery/energy/code/actual_energy_backend.py').relative_to(ROOT)),
                        'sha256':sha(ROOT/'work/prune_recovery/energy/code/actual_energy_backend.py')}})
    print(json.dumps({'passed':len(checks),'failed':0,'actual_stage_tail_zero_on':'tau/tau0 in[1/2,1]',
                      'possibly_active_corrections':[1,2,3,4],
                      'actual_selector_values_evaluated':False,'actual_whole_K_integrated':False,
                      'N706_closed':False,'N805_closed':False,'actual_last_resolved_tau':None}))


if __name__=='__main__':
    main()
