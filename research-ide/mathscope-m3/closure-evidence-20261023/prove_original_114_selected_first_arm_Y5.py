#!/usr/bin/env python3
"""Original-source conditional radius theorem for all 114 first AST piecewise arms.

Use exact N3 t1=CSelected^-120, CSelected>2, Xa=4/Lambda>0:
0<t1<2^-120<1/16, so
 Lambda*Xa*exp(2*t1)=4*exp(2*t1)<4/(1-1/8)=32/7<5.
SHA-valid source guards:
 94 first-before arms: Y=Lambda*x, x<=Xa or Xa*exp(t1).
 20 first-inside arms: x<Xa*exp(2*t1) and original
 4*exp(log_positive(x/Xa))=Lambda*x (including nested exp-log case).
Requires selected arm, actual source x>=0, positivity of all log inputs,
and all native root-to-call execution paths proven to use this arm.
Such native path dominance and global conditions are NOT proved here.
NO previously OPEN full natural-series calls are promoted.
"""
import argparse,gzip,json
from collections import Counter
from fractions import Fraction as F
from pathlib import Path
from audit_original_114_first_AST_piecewise_guards import audit_first_AST_piecewise
from prove_original_n3_t1_natural_domain import source_t1_strict_upper_bound
from pinned_n3_parameter_intervals import pinned_profile

# Exact unmodified original AST nodes required to eliminate source
# exp(log_positive) aliases, not mere symbolic naming guesses.
PINS={
 24:('rational',['2','1']),
 474:('rational',['4','1']),
 3454:('source_parameter',['Lambda']),
 3612:('source_parameter',['t1']),
 3617:('source_parameter',['Xa']),
 3679:('inverse',[3617]),
 3623:('exp',[3612]),
 3624:('multiply',[3617,3623]),
 3625:('multiply',[24,3612]),
 3626:('exp',[3625]),
 3627:('multiply',[3617,3626]),
 6951:('log_positive',[6944]),
 24987:('exp',[6951]),
 7022:('multiply',[3679,6944]),
 7023:('log_positive',[7022]),
 25062:('exp',[7023]),
 25063:('multiply',[474,25062]),
 24990:('multiply',[3679,24987]),
 24991:('log_positive',[24990]),
 50906:('exp',[24991]),
 50907:('multiply',[474,50906]),
 33489:('multiply',[3679,33411]),
 33490:('log_positive',[33489]),
 54060:('exp',[33490]),
 54061:('multiply',[474,54060]),
}
INSIDE_Y_X={25063:6944,50907:6944,54061:33411}
INSIDE_COUNTS={25063:8,50907:6,54061:6}
class InvalidLocalFirstArmProof(ValueError):pass

def ensure(ok,reason):
    if not ok:raise InvalidLocalFirstArmProof(reason)

def proof(graph_dir):
    prior=audit_first_AST_piecewise(graph_dir)
    t1=source_t1_strict_upper_bound()
    profile=pinned_profile()
    ensure(t1['source_CSelected_strict_gt_2_proved_from_formulas'] and
           t1['original_t1_positive'] and
           profile['parametersExactExpressions']['t1']=={'power':[{'ref':'CSelected'},-120]},
           'Cannot strengthen t1 without exact N3 CSelected^-120')
    # Strict inequality from the actual original formula, not numerical fitting.
    t_upper=F(1,2**120)
    ensure(t_upper<F(1,16) and 2*F(1,16)==F(1,8),'strengthened t1 comparison')
    bound=F(4,1)/(1-F(1,8))
    ensure(bound==F(32,7) and bound<F(5),'original 2t1 exponential bound invalid')
    # The original paper's Proposition B.2 is certified on Y<=4.1, NOT Y<=5.
    # Original t1<CSelected^-120<2^-120 is strong enough for that smaller radius:
    # for 0<=u<1, exp(u)<=1/(1-u). With u=2t1<2^-119<1/41,
    # Lambda*x<=4*exp(2t1)<4/(1-2^-119)<41/10.
    analytic_u_upper=F(1,2**119)
    paper_radius=F(41,10)
    paper_upper=F(4)/(1-analytic_u_upper)
    ensure(analytic_u_upper<F(1,41) and paper_upper<paper_radius,
           'original source guard does not reach actual Appendix B radius 4.1')
    need=set(PINS)
    found={}
    with gzip.open(Path(graph_dir)/'original-source-nodes.jsonl.gz','rt') as f:
        next(f)
        for i,line in enumerate(f):
            if i in need:found[i]=json.loads(line)
            if i>=max(need):break
    for i,(op,args) in PINS.items():
        node=found.get(i)
        ensure(node=={'op':op,'args':args},'Original source alias tree changed at '+str(i))
    rows=prior['first_ancestor_records']
    counts=Counter()
    for r in rows:
        Y=r['Y_node_id']
        if r['arm']=='before':
            ensure(r['conditional_local_before_Y_le_5'] and r['left_node'] in (3617,3624),
                   'Before arm is not a direct source Y=Lambda*x input')
            counts['before']+=1
        elif r['arm']=='inside':
            ensure(Y in INSIDE_Y_X and r['guard_x_node']==INSIDE_Y_X[Y] and
                   r['left_node']==3624 and r['right_node']==3627,
                   'Inside arm original coordinate or exponential alias changed')
            counts[Y]+=1
        else:
            raise InvalidLocalFirstArmProof('Unproved first-arm case '+str(r))
    ensure(counts['before']==94 and
           {y:counts[y] for y in INSIDE_COUNTS}==INSIDE_COUNTS,
           'Missing first-arm domain case')
    return {
      'schema':'MathScope.M3.Original114SelectedFirstArmConditionalY5/1',
      'scope':'FIRST_POST_SIGNED_FIVEMAP_SOURCE_LOCAL_FIRST_SYNTACTIC_ARM',
      'original_graph_sha256':prior['graph_source_sha256'],
      'source_first_syntactic_guard_count':114,
      'original_exact_N3_t1_strict_bound':'1/2^120',
      'weaker_simple_t1_strict_bound':'1/16',
      'exact_sufficient_exp_2t1_upper':str(bound),
      'actual_OpenAI_Proposition_B2_Y_radius':'41/10',
      'exact_new_exp_2t1_upper_for_B2':str(paper_upper),
      'all_first_syntactic_arms_conditional_Y_lt_4point1':114,
      'strict_paper_B2_radius_uses_original_t1_lt_2pow_minus120':True,
      'source_Xa_eq_4_over_Lambda':True,
      'first_before_local_conditional_Y_le_5':94,
      'first_inside_alias_local_conditional_Y_le_5':20,
      'all_first_syntactic_arms_local_conditional_Y_le_5':114,
      'verified_inside_Y_alias_source_nodes':{str(y):{'guard_x_node':x,'calls':counts[y]} for y,x in INSIDE_Y_X.items()},
      'requires_selected_syntactic_arm':True,
      'requires_original_real_nonnegative_coordinate_and_log_positive_guards':True,
      'every_native_root_to_call_path_dominance_proved':False,
      'common_complex_eta_and_Brho_norm_proved':False,
      'source_114_GLOBAL_Y_le_5_newly_proved':0,
      'all_523_original_Y_certified':33,'all_523_original_Y_OPEN':490,
      'actual_67_final_field_jets_certified':0,
      'M3':'62/64','M4':'0/16','release':'HOLD',
    }

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--graph-dir',required=True);p.add_argument('--output')
    args=p.parse_args()
    result=proof(args.graph_dir)
    if args.output:Path(args.output).write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(result,indent=2,ensure_ascii=False))
