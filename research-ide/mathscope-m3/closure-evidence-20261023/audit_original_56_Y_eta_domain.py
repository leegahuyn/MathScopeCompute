#!/usr/bin/env python3
"""Authenticate ORIGINAL 56 natural-series Y,eta arguments and simplify Lambda*Xa.

This does not infer unproved coordinate bounds, exponential signs, rho-norms,
coefficient enclosures or final A,b,p fields. Input must be a source-SHA checked
original first-FiveMap node stream plus the independently reached 11-root
semantic receipt from postprocess_original_full_graph.mjs.
"""
from pathlib import Path
import gzip,hashlib,json,sys
from prove_original_n3_Q_rho_signs import original_n3_Q_rho_strict_positivity
from pinned_n3_parameter_intervals import pinned_profile
from prove_original_n3_t1_natural_domain import source_t1_strict_upper_bound
SOURCE_SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
DEFS_SHA='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
PINNED_PR='a9b3a5b317525f6d0a71e2e356b054c9d25d2e60'
class MissingSourceDomainCertificate(ValueError):pass

def _op(node,op,value=None):
    return isinstance(node,dict) and node.get('op')==op and (
      value is None or node.get('args')==[value])

def _exp_domain_certificate(exp_argument_node):
    if _op(exp_argument_node,'source_parameter','t1'):
        proof=source_t1_strict_upper_bound()
        return {'exponent_bound_proved':True,
          'Y_upper5_proved':True,
          'source_t1_upper':'1/8',
          'source_Y_strict_upper_bound':proof['four_exp_t1_strict_upper_bound'],
          'actual_original_analytic_coefficient_norm_proved':False}
    return {'exponent_bound_proved':False,'Y_upper5_proved':False}

def classify_original_Y(source_nodes,Y_id):
    """Pure pattern proof. Never certify exp exponent sign or a global bound."""
    def node(i):
        if type(i) is not int or i<0 or i>=len(source_nodes):
            raise MissingSourceDomainCertificate('Missing root in original source prefix')
        return source_nodes[i]
    root=node(Y_id)
    if root.get('op')=='rational':
        from fractions import Fraction
        try:q=Fraction(int(root['args'][0]),int(root['args'][1]))
        except Exception as e:raise MissingSourceDomainCertificate('Invalid original rational') from e
        if 0<=q<=5:
            return {'shape':'SOURCE_EXACT_RATIONAL_Y_LE_5',
               'exact_Y':str(q),'Y_upper5_proved':True,
               'Y_rewrite_proved':True,'exponent_bound_proved':True}
        return {'shape':'SOURCE_RATIONAL_OUTSIDE_Y_DOMAIN','Y_upper5_proved':False,
                'Y_rewrite_proved':True}
    if root.get('op')!='multiply':
        return {'shape':'COORDINATE_OR_OTHER_UNCERTIFIED',
                'Y_upper5_proved':False,'Y_rewrite_proved':False}
    a,b=root.get('args',())
    if _op(node(a),'rational') and node(a).get('args')==['4','1'] and _op(node(b),'exp'):
        return {'shape':'SOURCE_FOUR_TIMES_EXP',
            'exponent_root_id':node(b)['args'][0],
            'symbolically_exact_Y':'4*exp(source_exponent)',
            'sufficient_domain_obligation':'source_exponent <= 0',
            'sharp_domain_obligation':'source_exponent <= log(5/4)',
            'Y_rewrite_proved':True,**_exp_domain_certificate(node(node(b)['args'][0]))}
    # Pinned N3 defines Lambda>0 and Xa=4/Lambda, hence Lambda*Xa=4.
    if _op(node(a),'source_parameter','Lambda') and node(b).get('op')=='multiply':
        x,ep=node(b)['args']
        if _op(node(x),'source_parameter','Xa') and _op(node(ep),'exp'):
            return {'shape':'SOURCE_LAMBDA_XA_EXP_CANCELS_TO_FOUR_TIMES_EXP',
                'exponent_root_id':node(ep)['args'][0],
                'symbolically_exact_Y':'4*exp(source_exponent)',
                'sufficient_domain_obligation':'source_exponent <= 0',
                'sharp_domain_obligation':'source_exponent <= log(5/4)',
                'Y_rewrite_proved':True,**_exp_domain_certificate(node(node(ep)['args'][0]))}
    return {'shape':'ARITHMETIC_UNCERTIFIED',
            'Y_upper5_proved':False,'Y_rewrite_proved':False}

def authenticate_and_classify(archive_dir,receipt_file):
    archive_dir=Path(archive_dir);receipt_file=Path(receipt_file)
    m=json.loads((archive_dir/'original-source-export-manifest.json').read_text())
    receipt=json.loads(receipt_file.read_text())
    if (m.get('node_stream_sha256')!=SOURCE_SHA or
        m.get('definitions_sha256')!=DEFS_SHA or
        m.get('original_pr30_commit')!=PINNED_PR or m.get('node_count')!=4420257 or
        len(m.get('original_root_ids',[]))!=11 or
        m.get('scope')!='ORIGINAL_FIRST_POST_SIGNED_FIVEMAP_3D_DIRECT_SPLIT_NOT_FINAL_A_b_p' or
        receipt.get('source_node_sha256') not in (None,SOURCE_SHA)):
        raise MissingSourceDomainCertificate('Original first FiveMap provenance mismatch')
    v=receipt.get('expanded_native_definition_semantic_closure') or {}
    profile=v.get('natural_source_input_pairs') or {}
    pairs=profile.get('original_56_input_pairs')
    if not isinstance(pairs,list) or len(pairs)!=56 or profile.get('total_reachable_calls')!=523:
        raise MissingSourceDomainCertificate('Authentic 56 Y/eta source tuples not independently reached')
    p=pinned_profile();signs=original_n3_Q_rho_strict_positivity()
    if p['parametersExactExpressions'].get('Xa')!={
         'quotient':[{'integer':4},{'ref':'Lambda'}]} or not signs['Lambda_is_strictly_positive']:
        raise MissingSourceDomainCertificate('Original Lambda*Xa identity not justified')
    maxid=max(max(q['Y_node_id'],q['eta_node_id']) for q in pairs)
    if maxid>=100000:raise MissingSourceDomainCertificate('Original Y prefix size outside checked budget')
    h=hashlib.sha256();nodes=[]
    with gzip.open(archive_dir/'original-source-nodes.jsonl.gz','rb') as f:
        for line_no,line in enumerate(f):
            h.update(line)
            if line_no==0:
                header=json.loads(line)
                if header.get('node_count')!=m['node_count']:
                    raise MissingSourceDomainCertificate('Original source node header changed')
                continue
            if len(nodes)<=maxid:nodes.append(json.loads(line))
    if h.hexdigest()!=SOURCE_SHA:
        raise MissingSourceDomainCertificate('Full 4.4M SourceExpressions byte stream tampered')
    grouped={}
    for q in pairs:
        yi,ei=q['Y_node_id'],q['eta_node_id']
        if (nodes[yi]!=q['Y_source_node'] or nodes[ei]!=q['eta_source_node'] or
            nodes[ei]!={'op':'coordinate','args':['eta']}):
            raise MissingSourceDomainCertificate('Actual source Y/eta shape does not match 11-root receipt')
        classification=classify_original_Y(nodes,yi)
        label=classification['shape']
        row=grouped.setdefault(label,{'pairs':0,'source_calls':0})
        row['pairs']+=1;row['source_calls']+=q['source_call_nodes']
        q['source_Y_algebraic_classification']=classification
    algebraic_Y_bound_calls=sum(q['source_call_nodes'] for q in pairs
       if q['source_Y_algebraic_classification'].get('Y_upper5_proved'))
    if sum(x['source_calls'] for x in grouped.values())!=523:
        raise MissingSourceDomainCertificate('Incomplete source call partition')
    return {'schema':'MathScope.M3.Original56NaturalArgumentConditionalDomainAudit/1',
      'source_sha256':SOURCE_SHA,'native_definition_sha256':DEFS_SHA,
      'first_FiveMap_only':True,'physical_roots':11,'natural_calls':523,
      'unique_Y_eta_pairs':56,'classification':grouped,
      'source_original_Q_rho_and_Lambda_positive_proved':True,
      'source_Lambda_Xa_exactly_four_proved':True,
      'original_source_Y_interval_0_to_5_algebraically_certified_calls':algebraic_Y_bound_calls,
      'actual_Y_bound_is_not_common_eta_domain_or_coefficient_norm_proof':True,
      'source_exponent_sign_and_domain_proved':False,
      'shared_eta_complex_domain_proved':False,
      'coefficient_Brho_norm_le_Q_proved':False,
      'original_finite_natural_coefficients_evaluated':0,
      'final_original_67_jets_certified':0,'release':'HOLD','pairs':pairs}

if __name__=='__main__':
    if len(sys.argv)!=4:
        raise SystemExit('Usage: script.py original_graph_dir official_11root_receipt.json out.json')
    result=authenticate_and_classify(sys.argv[1],sys.argv[2])
    Path(sys.argv[3]).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'source_calls':result['natural_calls'],
       'classified':result['classification'],'final67':0,'release':'HOLD'}))
