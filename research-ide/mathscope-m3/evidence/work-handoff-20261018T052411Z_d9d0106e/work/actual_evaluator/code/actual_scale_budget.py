"""Exact original scale lower bounds and a bounded materialization decision.

Only the explicit raw-integer/ordinary arithmetic route is declined. Symbolic
or coefficient-domain integration remains possible and is investigated in
actual_angular_energy.py. No relaxed h, finite tau, or model field is supplied.
"""
from pathlib import Path
import argparse,hashlib,json
from fractions import Fraction
from actual_angular_energy import HEADER,PACKET,dump,require,sha

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,default=Path('.'));ap.add_argument('--output-dir',type=Path,required=True)
    ap.add_argument('--max-materialized-integer-bits',type=int,default=1_000_000);a=ap.parse_args();root=a.root.resolve();out=a.output_dir.resolve();out.mkdir(parents=True,exist_ok=True)
    manifest=json.loads((root/'work/actual_evaluator/evidence/INPUT_MANIFEST.json').read_text())
    for row in manifest['files']:require(sha(root/row['path'])==row['sha256'],'Changed pinned input '+row['path'])
    h=json.loads((root/HEADER).read_text());reg={}
    def registries(d):
        for k,v in d.items():
            if k=='base':registries(v)
            elif isinstance(v,str):
                try:reg[k]=json.loads(v)
                except ValueError:pass
    registries(h['definitions']);par=reg['fixed']['source']['parametersExactExpressions']
    require(par['Md']=={'integer':1048576},'Changed original Md')
    require(par['T']=={'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},'Changed original T')
    require(par['h']=={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},'Changed original h')
    packet=json.loads((root/PACKET).read_text());require(packet['sourceHeaderSHA256']==sha(root/HEADER),'Different original source header')
    nodes=packet['records']
    exact={622801:('ceiling',[622800]),622800:('inverse',[622799]),622799:('sqrt_positive',[622798]),
           622798:('exp',[622797]),622797:('multiply',[9,622796]),622796:('log_positive',[622794]),
           622794:('exp',[622793]),622793:('multiply',[20,622792]),622792:('multiply',[127,622791])}
    for i,(op,args) in exact.items():require(nodes[str(i)]=={'op':op,'args':args},'Changed original k/epsilon/Q ancestry '+str(i))
    require(nodes['127']=={'op':'log_positive','args':[24]},'Q is not 2^-ell')
    require(nodes['9']=={'op':'source_parameter','args':['h']},'Wrong original h root')
    require(nodes['20']=={'op':'rational','args':['-1','1']} and nodes['24']=={'op':'rational','args':['2','1']},'Changed Q base/sign')
    require(nodes['622791']=={'op':'coordinate','args':['N6_global_frozen_integer_band_N1$30434']},'Wrong original ell coordinate')
    threshold=root/'work/remaining_chain/source/source-localization-domain.mjs';text=threshold.read_text()
    require('threshold.frequencyMinimum===G.pow(G.div(q(64),h),2)' in text and
            'ellMinimum===G.ceiling(G.maximum(q(8),threshold.Sminimum,threshold.frequencyMinimum))' in text,'Original lower threshold missing')
    # e>2 and T>1 suffice; no floating exponential or logarithm is evaluated.
    require(8002>4096 and Fraction(64**2,2)==2048,'Incorrect exact inequality arithmetic')
    require(a.max_materialized_integer_bits>0,'Positive operation budget required')
    exceeds=a.max_materialized_integer_bits<=(1<<4107)
    result={'schema':'MathScope.ActualRawCarrierMaterializationBudget/1','original_parameter_profile':reg['fixed']['source']['parameterExpressionSHA256'],
        'source_header_sha256':sha(root/HEADER),'threshold_source_sha256':sha(threshold),
        'original_h_expression':par['h'],'original_T_expression':par['T'],'original_Md_expression':par['Md'],
        'actual_carrier_root':622801,'actual_epsilon_root':622798,'actual_Q_root':622794,
        'exact_derivation':['T=exp(1048576)+10>1 and e>2 imply 0<h=exp(-8002*T)<2^-4096.',
            'The unchanged threshold has ell>=ellMinimum>=frequencyMinimum=(64/h)^2.',
            'Q=2^-ell, epsilon=Q^h, k=ceil(epsilon^-1/2), hence log2(k)>=h*ell/2>=2048/h>2^4107.',
            'The ordinary binary integer expansion of k therefore requires more than 2^4107 bits.'],
        'declared_max_materialized_integer_bits':a.max_materialized_integer_bits,'budget_exceeded':exceeds,
        'supported_path_decision':'RAW_INTEGER_CARRIER_NOT_MATERIALIZED' if exceeds else 'LOWER_BOUND_ALONE_DOES_NOT_DECIDE_BUDGET',
        'scope':'This rejects only materializing the original carrier in ordinary binary integer storage under the declared finite budget; it is not an impossibility theorem for symbolic phase, coefficient integration, or log representations.',
        'phase_free_alternative':'actual_angular_energy.py performs literal theta integration for every recovered actual initialized template without materializing k or its phase.',
        'positive_tau_evaluated':None,'actual_last_resolved_tau':None,'source_parameters_changed':False}
    dump(out/'ACTUAL_SCALE_RESOURCE_BOUND.json',result);print(json.dumps({'budget_exceeded':exceeds,'actual_last_resolved_tau':None}))

if __name__=='__main__':main()
