#!/usr/bin/env python3
"""Original-source 67-final-jet numeric gate. Source graph and CI evidence only.
Never turns finite functional descriptions, proxy roots or cutoffs into final-field numeric jets.
"""
from __future__ import annotations
import argparse, copy, hashlib, json, pathlib, sys
from collections import Counter
from fractions import Fraction

ROOT=pathlib.Path(__file__).resolve().parents[3]
REQ='research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1/work/prune_recovery/energy/evidence/MISSING_ACTUAL_JET_REQUEST.json'
FAMILY='research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1/recovered/base/work/remaining_chain/evidence/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json'
GRID='research-ide/mathscope-m3/recovery-20261019/evidence/OUTER_CUTOFF_WHOLE_K_CELLS.json'
PINS={REQ:'47d5dbc4933eb5064538d4914ed65dceaaafd080',
      FAMILY:'7a44a4737d386903272ebc706d53aeff256be6e2',
      GRID:'26bc1a52f7898e910c6ef81047614a23e4806ecf'}
BASE_COMMIT='a9b3a5b317525f6d0a71e2e356b054c9d25d2e60'
SIGNED_CI_COMMIT='53704255f9571912c3ffb6164a7205fd1fccd3b3'
ACTUAL_FUNCTIONAL_SHA='b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78'

def ensure(ok,message):
    if not ok:raise ValueError('SOURCE_BOUND_GATE_FAILED: '+message)
def gitblob(raw):
    return hashlib.sha1(b'blob '+str(len(raw)).encode()+bytes([0])+raw).hexdigest()
def load_source(path):
    raw=(ROOT/path).read_bytes()
    ensure(gitblob(raw)==PINS[path], 'original Git blob changed: '+path)
    return json.loads(raw),hashlib.sha256(raw).hexdigest()
def validate(req,family,grid,real):
    ensure(req['schema']=='MathScope.RecoveryMissingActualEnergyJets/1','source request schema')
    ensure(req['actual_family_sha256']==ACTUAL_FUNCTIONAL_SHA,'original family SHA')
    ensure(req['requested_domain'].startswith('Every whole-K spatial quadrature cell'),'closed-cell definition')
    jets=req['requested_field_jets'];cs=req['requested_cutoff_jets']
    ensure(len(jets)==67 and len(set(jets))==67,'67 distinct final-field targets')
    ensure(len(cs)==13 and len(set(cs))==13,'13 distinct cutoff targets')
    counts=Counter(x.split('@')[0] for x in jets)
    ensure(counts=={'A0':19,'A1':19,'A2':19,'b':6,'p':4},'correct field targets')
    for label in jets:
        name,index=label.split('@')
        terms=[int(v) for v in index.split(',')]
        ensure(len(terms)==(3 if name=='b' else 4),'original independent variable count '+label)
        ensure(all(t>=0 for t in terms),'negative derivative order '+label)
    ensure(req['coordinates']=={'A_and_p':['x','y','z','tau'],'b_and_C':['s','z','tau'],'physical_time_derivative':'-partial_tau'},'correct time and b coordinates')
    ensure(req['available_family_evaluator'] is False and req['available_supremum_evaluator'] is False,'original evaluator existence mismatch')
    ensure(req['missing_values_replaced_by_zero'] is False and req['alternate_family_selected'] is False,'no fabricated source')
    ensure(len(req['frozen_correction_nodes'])==5 and len(req['frozen_scale_nodes'])==5,'five actual correction/scale functional inputs')
    ensure(family['schema']=='MathScope.ActualRecursiveSourceFunctionals/1','function graph schema')
    ensure(len(family['nodes'])==117 and len(family['actual_stages'])==6,'finite functional stage representation')
    ensure(family['numerical_field_evaluator'] is False and family['numerical_supremum_evaluator'] is False,'source functional numeric evaluator absent')
    node_by_id={n['id']:n for n in family['nodes']}
    ensure(len(node_by_id)==len(family['nodes']),'duplicate function id')
    seen=set()
    for n in family['nodes']:
        ensure(all(i in seen for i in n['inputs']),'forward or missing function dependency')
        seen.add(n['id'])
    ensure(family['fixed_source']==req['fixed_source'] and family['actual_stages'][0]==req['initial_state'],'changed actual source roots')
    ensure(grid['cell_count']==512 and grid['exact_zero_cells']==320 and grid['missing_field_cells']==192,'whole K covering status')
    ensure(grid['settings']['grid']==8 and grid['settings']['normalized_time']==['1/2','1'],'space/time cutoff slab')
    representative=next(c for c in grid['cells'] if c['index']==[3,3,3])
    ensure(representative['status']=='MISSING_ACTUAL_FIELD_JETS' and representative['energy'] is None,'interior numeric cell unproved')
    ensure(grid['actual_nonzero_final_field_evaluated'] is False and grid['whole_K_energy'] is None,'whole K numerical assertion is unsupported')
    ensure(real['schema']=='MathScope.M3.SourceBoundOriginalPipeline/1','real runtime receipt schema')
    ensure(real['expected_base_commit']==BASE_COMMIT and real['executing_commit']==SIGNED_CI_COMMIT,'real CI lineage')
    ensure(real['real_original_forced_seal_issued'] is True and real['real_original_latest_cor85_stress_seal_issued'] is True,'actual source gate')
    ensure(real['real_original_signed162_seal_issued'] is False and real['actual_final67_jets_evaluated']==0,'post-Cor85 stage not final')
    ensure(real['stage']=='original_signed162_successor','genuine current computation frontier')
    row=next(x for x in real['graph_node_counts'] if x['stage']=='original_corollary_8_5_stress')
    ensure(row['node_count']==4162316,'source graph root mismatch')
    ensure(req['actual_last_resolved_tau'] is None and grid['actual_last_resolved_tau'] is None,'no invented global time')
    return jets,cs,counts,representative,row

def result(req,family,grid,real):
    jets,cs,counts,cell,last=validate(req,family,grid,real)
    spatial_max=Fraction(1,4)
    radial_max=2*(spatial_max*spatial_max+spatial_max*spatial_max)
    axial_max=2*spatial_max*spatial_max
    ensure(radial_max==Fraction(1,4) and axial_max==Fraction(1,8),'representative-cell flat spatial cutoff')
    # At rho=3/4 and u=2*rho-1=1/2, F'(u)/F(u)=1/u^2=4.
    # chi = F(1-u)/(F(u)+F(1-u)): dchi/du=-2, dchi/drho=-4.
    chi=Fraction(1,2); first=Fraction(-4)
    exactcut={}
    for key in cs:
        alpha=tuple(map(int,key.split('@')[1].split(',')))
        if alpha==(0,0,0):v='1/2'
        elif alpha==(0,0,1):v='-4/tau0'
        else:v='0'
        exactcut[key]={'symbolic_value':v,'scope':'POINT rho=3/4, ALL CLOSED SPATIAL CELL [3,3,3]',
                       'numerically_evaluated_original_tau0':False}
    ensure(sum(v['symbolic_value']=='0' for v in exactcut.values())==11,'eleven zero cutoff derivatives')
    requirements=['ALL_ORIGINAL_ACTUAL_CYCLES_AND_TAILS','FINAL_EMITTED_SOURCE_GAUGE_AND_PRESSURE_ROOTS',
                  'ORIGINAL_SCALE_SELECTORS_EVALUATED','CLOSED_CELL_NUMERICAL_JET_ENCLOSURES',
                  'INDEPENDENT_DERIVATIVE_AND_SOURCE_GRAPH_REPLAY']
    targets=[{'target':j,'family':j.split('@')[0],'derivative_multiindex':list(map(int,j.split('@')[1].split(','))),
       'actual_final_field_root':None,'original_final_field_numeric_interval':None,
       'status':'BLOCKED_NOT_CERTIFIED','missing':requirements} for j in jets]
    return {'schema':'MathScope.M3.RealSource67JetReadiness/1','classification':'SOURCE_VERIFIED_FIRST_NUMERIC_JET_GATE_NOT_NUMERIC_RESULT',
        'base_pr30':BASE_COMMIT,'real_ci_run':39899886766,'real_ci_commit':SIGNED_CI_COMMIT,
        'real_source_checkpoint':{'source_stage':real['stage'],'last_successful_stage':'original_corollary_8_5_stress',
            'graph_node_count':last['node_count'],'forced_authenticated':True,'cor85_authenticated':True,
            'signed162_authenticated':False,'all_cycles_complete':False},
        'original_final_family':{'source_function_nodes':len(family['nodes']),'illustrative_complete_stages':len(family['actual_stages'])-1,
            'field_evaluator_available':False,'supremum_evaluator_available':False,
            'numerically_evaluated_scale_selectors':0,'fully_emitted_original_final_A_b_p_roots':0},
        'representative_cell':{'cell':cell['index'],'status':'MISSING_ACTUAL_FIELD_JETS',
            'normalized_xyz_interval':['[-1/4,0]']*3,'rho_point':'3/4','rho_slab':['1/2','1'],
            'radial_cutoff_argument_max':str(radial_max),'axial_cutoff_argument_max':str(axial_max)},
        'cutoff_point_jets':exactcut,'exact_cutoff_point_jet_count':13,
        'actual_final_field_jet_count_required':67,'actual_final_field_jet_count_certified':0,
        'family_counts':dict(counts),'field_jet_targets':targets,'minimum_unresolved_field_slots_for_192_cells':67*192,
        'original_numeric_interval_results':None,'N706_closed':False,'N805_closed':False,
        'last_resolved_tau':None,'release':'HOLD',
        'blocker_code':'FINAL_NUMERIC_ROOTS_ABSENT',
        'blocker':'The 117-node functional graph declares no numerical evaluator. A real 4,162,316-node Cor85 graph exists but Signed and later repeated corrections, final gauge and original scale selectors have not been materially evaluated. No 67 final-field jet can be certified.'}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--actual-receipt',required=True,type=pathlib.Path)
    ap.add_argument('--output',required=True,type=pathlib.Path)
    ap.add_argument('--require-final',action='store_true');a=ap.parse_args()
    try:
        req,hr=load_source(REQ);fam,hf=load_source(FAMILY);grid,hg=load_source(GRID)
        ensure(hf==ACTUAL_FUNCTIONAL_SHA,'exact original family SHA256 changed')
        real=json.loads(a.actual_receipt.read_text());out=result(req,fam,grid,real)
        out['original_source_sha256']={'request':hr,'family':hf,'grid':hg}
        a.output.parent.mkdir(parents=True,exist_ok=True)
        a.output.write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
        print(json.dumps({'source_audit':'PASS','cutoff_exact':13,'final_field_numeric':0,'result':'HOLD',
             'blocker_code':out['blocker_code']},ensure_ascii=False))
        return 2 if a.require_final else 0
    except (ValueError,KeyError,TypeError,StopIteration,FileNotFoundError) as e:
        a.output.parent.mkdir(parents=True,exist_ok=True)
        a.output.write_text(json.dumps({'schema':'MathScope.M3.InvalidSource67Gate/1','status':'BLOCKED',
            'error':str(e),'final_field_numeric':0,'release':'HOLD'},indent=2,ensure_ascii=False)+'\n')
        print(str(e),file=sys.stderr);return 3
if __name__=='__main__':raise SystemExit(main())
