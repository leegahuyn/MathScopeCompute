"""Execute new actual outer-cutoff work, without rerunning historical graphs."""
from pathlib import Path
from fractions import Fraction as Q
from itertools import product
import argparse
import hashlib
import json
import time

from outer_cutoff import ActualOuterCutoff, I, chi_jets, PINS, REPO, sha


def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False)


def output_reference(path):
    path=Path(path).resolve()
    return str(path.relative_to(REPO)) if path.is_relative_to(REPO) else str(path)


def partition(evaluator, grid, rho, bits):
    edges = [Q(-1)+Q(2*i,grid) for i in range(grid+1)]
    sets, seen, cells = [], {}, []
    for index in product(range(grid),repeat=3):
        x,y,z = [I(edges[k],edges[k+1]) for k in index]
        radial = x.square()+y.square()
        key = (radial.lo,radial.hi,z.lo,z.hi,rho.lo,rho.hi,bits)
        if key not in seen:
            row = evaluator.evaluate(x,y,z,rho,bits)
            row['jet_set'] = len(sets)
            seen[key] = len(sets)
            sets.append(row)
        entry = sets[seen[key]]
        cells.append({'index':list(index),'jet_set':seen[key],
                      'status':entry['status'],'energy':None})
    zero = sum(c['status']=='EXACT_ZERO' for c in cells)
    return {'grid':grid,'edges':[str(v) for v in edges],
            'cell_count':len(cells),'exact_zero_cells':zero,
            'missing_field_cells':len(cells)-zero,
            'normalized_cell_volume':str(Q(2,grid)**3),
            'normalized_zero_volume':str(Q(2,grid)**3*zero),
            'normalized_unresolved_volume':str(Q(2,grid)**3*(len(cells)-zero)),
            'cells':cells,'jet_sets':sets}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--grid',type=int,default=8)
    parser.add_argument('--precision',type=int,default=80)
    parser.add_argument('--output',type=Path,default=Path(__file__).parent/'evidence')
    args = parser.parse_args()
    args.output=args.output.resolve()
    if args.grid not in (4,8,16) or not 32 <= args.precision <= 256:
        raise ValueError('DECLARED_WORK_BUDGET_EXCEEDED')
    started=time.perf_counter()
    evaluator=ActualOuterCutoff()
    rho=I(Q(1,2),1)
    base=partition(evaluator,args.grid,rho,args.precision)
    double=partition(evaluator,2*args.grid,rho,args.precision)
    # Whole-K native energy is deliberately not inferred from cutoff coverage.
    binding=evaluator.binding
    missing_fields=[a for a in binding['requiredAtoms'] if a.startswith(('A0@','A1@','A2@','b@','p@'))]
    assert len(missing_fields)==67
    settings={'grid':args.grid,'double_grid':2*args.grid,'precision_bits':args.precision,
              'normalized_time':['1/2','1'],'source_commit':'333d6095d4a2d2d69ceec9b25c44e1d3381e36d2'}
    code_pins={str(p.relative_to(REPO)):sha(p) for p in (Path(__file__),Path(__file__).with_name('outer_cutoff.py'))}
    run_hash=hashlib.sha256(canonical({'source_pins':PINS,'code_pins':code_pins,'settings':settings}).encode()).hexdigest()
    result={'schema':'MathScope.ActualOuterCutoffCells/1','implementation_kind':'NEW_IMPLEMENTATION_FROM_VERIFIED_SAVED_SOURCE',
            'run_hash':run_hash,'source_pins':PINS,'code_pins':code_pins,'settings':settings,
            'source_formula':'C=chi(2*(x^2+y^2))*chi(2*zeta^2)*chi(rho), chi(s)=1-sigma1(2*s-1)',
            'coordinates':{'labels':['xi','upsilon','zeta'],'physical':['x=xi','y=upsilon','z=z0*zeta'],
                           'time':'tau=tau0*rho; physical dt=-tau0 d rho','z0':'tau0^(1/2-h)',
                           'tau0':'qbig/32','qbig':'2^(-(ellMinimum+10))','r0':'1',
                           'whole_K':'xi^2+upsilon^2<=1/2 and zeta^2<=1/2',
                           'partition_box':'[-1,1]^3 encloses the original compact K; zero exterior cells are not a percentage of K energy evaluated',
                           'space_measure':'z0 dxi dupsilon dzeta'},
            'derivative_contract':{'orders':'C@a,b,c are physical derivatives in s=x^2+y^2,z,tau',
                                   'coefficient':'exact normalized interval times z0^(-b)*tau0^(-c)',
                                   'physical_scale_numerically_evaluated':False,
                                   'closed_cell_enclosures':True,'positive_h_preserved':True},
            'grid':base['grid'],'edges':base['edges'],'cell_count':base['cell_count'],
            'exact_zero_cells':base['exact_zero_cells'],'missing_field_cells':base['missing_field_cells'],
            'cells':base['cells'],'jet_sets':base['jet_sets'],
            'spatial_refinement':[{k:v for k,v in row.items() if k not in ('cells','jet_sets','edges')} for row in (base,double)],
            'refinement_scope':'Actual cutoff support cover in an enclosing box; exterior zero cells are not completed interior energy cells. Not an energy defect or N8 four-axis acceptance result.',
            'cutoff_curve':[{'s':str(Q(i,64)), 'interval':chi_jets(Q(i,64),Q(i,64),args.precision)[0].encoded()} for i in range(65)],
            'remaining_field_jets':missing_fields,
            'actual_nonzero_final_field_evaluated':False,'whole_K_energy':None,'energy_defect':None,
            'actual_last_resolved_tau':None,'N706_closed':False,'N805_closed':False}
    requests=[]
    baseline={'grid':args.grid,'fourier_cutoff':16,'coefficient_order':4,'arithmetic_precision':args.precision}
    # These are concrete requested runs. Unresolved source operands stop each
    # request before any energy or convergence number can be manufactured.
    for axis in ['grid','fourier_cutoff','coefficient_order','arithmetic_precision']:
        doubled={**baseline,axis:2*baseline[axis]}
        requests.append({'axis':axis,'baseline':baseline,'doubled':doubled,
                         'status':'BLOCKED_BEFORE_ACTUAL_FIELD_EVALUATION',
                         'cause':'67 actual final A/b/p jets, active selected scales, and slow-base coefficient/tail data are still required.',
                         'baseline_energy':None,'doubled_energy':None,'comparison':None,
                         'independent_tail_bound':None,'last_resolved_tau':None})
    attempts={'schema':'MathScope.ActualEnergyRefinementBlockedRequests/1','run_hash':run_hash,
              'N706':{'original_axes':['space','time'],
                       'space':{'baseline_grid':args.grid,'doubled_grid':2*args.grid,'defects':[None,None]},
                       'time':{'baseline_cells':4,'doubled_cells':8,'defects':[None,None]},
                       'scope':'whole original K','status':'OPEN','reason':'Actual nonzero final-field evaluator is not yet available.',
                       'nu_one_10_13':None,'monotonicity_imposed_on_field':False,'new_acceptance_threshold':None},
              'N805':{'axes':requests,'status':'OPEN','axis_budget_is_new_execution_choice_not_original_acceptance':True},
              'separate_tail':{'stage_corrections_j_ge_5':'Inherited exact zero on rho in[1/2,1]; finite prefix1..4 still required.',
                               'slow_base_coefficients':None,'Fourier':None,'quadrature':None,'arithmetic':'Outward rational rounding included in each cutoff enclosure only.'},
              'actual_last_resolved_tau':None,'full_M3_complete':False}
    args.output.mkdir(parents=True,exist_ok=True)
    outputs={'OUTER_CUTOFF_WHOLE_K_CELLS.json':result,
             'OUTER_CUTOFF_DOUBLED_GRID.json':{'schema':'MathScope.ActualOuterCutoffDoubledGrid/1','run_hash':run_hash,**double},
             'ACTUAL_ENERGY_REFINEMENT_ATTEMPTS.json':attempts}
    for name,value in outputs.items():
        (args.output/name).write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n')
    for relative,expected in PINS.items():
        assert sha(REPO/relative)==expected
    receipt={'schema':'MathScope.ActualOuterCutoffRun/1','run_hash':run_hash,'source_pins_unchanged':True,
             'grid_results':result['spatial_refinement'],'cutoff_jets_per_cell':13,
             'original_field_jets_remaining':67,'actual_nonzero_field_evaluated':False,
             'seconds':time.perf_counter()-started,
             'outputs':[{'path':output_reference(args.output/name),'sha256':sha(args.output/name),
                         'bytes':(args.output/name).stat().st_size} for name in outputs],
             'N706_closed':False,'N805_closed':False,'actual_last_resolved_tau':None}
    (args.output/'OUTER_CUTOFF_RUN.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print(json.dumps(receipt,indent=2))


if __name__=='__main__':
    main()
