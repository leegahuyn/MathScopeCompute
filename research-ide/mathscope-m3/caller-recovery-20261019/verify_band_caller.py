#!/usr/bin/env python3
"""Scoped independent tests of the new original band caller reduction."""
from __future__ import annotations
from fractions import Fraction as Q
from pathlib import Path
import hashlib
import json
import time
import mpmath as mp
import sympy as sp
from band_caller import ActualBandCaller,center_offset,band_guard,validate_capsule,CAPSULE_SHA256

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
mp.mp.dps=160

def canonical(value):
    return json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()

def mq(value):
    value=Q(value)
    return mp.mpf(value.numerator)/value.denominator

def main():
    start=time.monotonic();caller=ActualBandCaller();I=caller.native.Interval
    checks=[];runs=[];negative=[]
    code_paths=['band_caller.py','verify_band_caller.py','build_caller_dossier.py']
    code_before={name:hashlib.sha256((HERE/name).read_bytes()).hexdigest() for name in code_paths}
    def check(name,condition,**context):
        checks.append({'name':name,'pass':bool(condition),**context})
        if not condition:raise AssertionError(name+': '+str(context))
    before={k:hashlib.sha256((REPO/v['path']).read_bytes()).hexdigest() for k,v in caller.source['source_files'].items()}
    # Z=0 implies s=T for the literal original source at every actual h>0.
    # These are formal chart witnesses, never chosen global solution points.
    point_values=['1/2','3/5','7/10','71/100','3/4','1','5/4','7/5','71/50','3/2','8/5','7/4','2']
    for text in point_values:
        root=Q(text);out=caller.evaluate(I.point(0),I.point(root),96);runs.append(out)
        expected=int(mp.floor(mp.mpf('0.5')-mp.log(mq(root))/mp.log(2)))
        check('literal_original_nearest_band',out['center_label_minus_reference_ell']==expected,source_s=text,expected_offset=expected)
        for candidate in out['candidates']:
            delta=candidate['label_minus_reference_ell'];r=mp.power(2,delta)
            literal_offset=-mp.log(r*mq(root))/mp.log(2)
            expected_guard='ORIGINAL_BAND_GUARD_ACTIVE' if abs(literal_offset)<mp.mpf('0.75') else 'EXACT_ZERO_BY_ORIGINAL_BAND_GUARD'
            check('literal_logarithmic_support_guard',candidate['band_guard']==expected_guard,source_s=text,delta=delta,logarithmic_offset=mp.nstr(literal_offset,80))
            lo,hi=map(mq,candidate['fixed_label_derivative_multipliers']['dR'])
            reference=mp.sqrt(r)
            check('independent_radial_sqrt_multiplier',lo<=reference<=hi,delta=delta)
            alo,ahi=map(mq,candidate['fixed_label_derivative_multipliers']['dZ'])
            h_upper=mq(candidate['source_h']['closed_enclosure'][1])
            for portion in (Q(1,16),Q(1,2),Q(3,4)):
                # Check the mathematical interval algorithm on positive points
                # of its h envelope. These probes are NOT the actual source h.
                h_probe=h_upper*mq(portion)
                value=mp.power(r,mp.mpf('0.5')-h_probe)
                check('positive_h_envelope_multiplier_probe',alo<=value<=ahi,delta=delta,h_probe_kind='positive envelope control, not actual source parameter')
    # Reuse earlier exact source-image inputs for a nonzero Z composition check.
    prior_path=REPO/'research-ide/mathscope-m3/recovery-20261019/native/evidence/ACTUAL_SLOW_INVERSE_VALIDATION.json'
    prior=json.loads(prior_path.read_text())
    selected=[r for r in prior['native_validation_boxes'] if r['source_call_node']==622820][:7]
    for previous in selected:
        z=I(*previous['input_box']['Z']);t=I(*previous['input_box']['T'])
        out=caller.evaluate(z,t,96);runs.append(out)
        check('reused_actual_native_source_image_root',out['reference_root_enclosure']==previous['value'],input_box=previous['input_box'])
        check('no_global_or_original_status_promotion',not out['actual_external_global_point_bound'] and not out['ell_ge_ell0_verified'] and out['actual_global_last_resolved_tau'] is None and out['new_M3_closures']==0)
    open_cases=[(Q(7,10),Q(18,25)),(Q(7,5),Q(10,7))]
    for lo,hi in open_cases:
        out=caller.evaluate(I.point(0),I(lo,hi),96);runs.append(out)
        check('irrational_center_threshold_crossing_stays_open',out['status']=='BAND_LABEL_BOUNDARY_OPEN' and out['candidates'] is None,source_s_interval=[str(lo),str(hi)])
    guard_cases=[(Q(59,100),Q(3,5),'BAND_GUARD_BOUNDARY_OPEN'),
                 (Q(5,3),Q(17,10),'BAND_GUARD_BOUNDARY_OPEN'),
                 (Q(3,5),Q(5,3),'ORIGINAL_BAND_GUARD_ACTIVE'),
                 (Q(1,4),Q(1,2),'EXACT_ZERO_BY_ORIGINAL_BAND_GUARD')]
    for lo,hi,expected in guard_cases:
        check('closed_interval_band_guard',band_guard(I(lo,hi))==expected,source_scaled_s_interval=[str(lo),str(hi)],expected=expected)
    # Exact symbolic identities independent of the implementation's comparisons.
    n=sp.Symbol('ell',integer=True);x=sp.Symbol('x',real=True);h=sp.Symbol('h',positive=True)
    check('integer_floor_translation_identity',sp.simplify(sp.floor(n+x)-n-sp.floor(x))==0)
    check('original_root_transport_exponent_identity',sp.simplify(2*(sp.Rational(1,2)-h)+2*h-1)==0)
    # A precision comparison concerns only these multiplier enclosures. It is
    # not the whole-field independent arithmetic axis required by N8-05.
    precision=[]
    for bits in (32,64,128,512):
        out=caller.evaluate(I.point(0),I.point(Q(3,5)),bits)
        row=next(r for r in out['candidates'] if r['candidate_displacement']==0)
        lo,hi=map(Q,row['fixed_label_derivative_multipliers']['dZ'])
        precision.append({'bits':bits,'axial_multiplier_interval':row['fixed_label_derivative_multipliers']['dZ'],'width':str(hi-lo)})
    check('native_caller_multiplier_precision_refinement',all(Q(a['width'])>Q(b['width']) for a,b in zip(precision,precision[1:])))
    def rejected(name,operation):
        try:operation()
        except (ValueError,TypeError) as error:
            negative.append({'name':name,'rejected':True,'reason':str(error)});return
        raise AssertionError('Negative control accepted: '+name)
    for bits in (True,15,513,96.0):
        rejected('invalid bounded resolution '+str(bits),lambda bits=bits:caller.evaluate(I.point(0),I.point(1),bits))
    rejected('float native input',lambda:caller.evaluate(I.point(0.0),I.point(1)))
    rejected('negative original T',lambda:caller.evaluate(I.point(0),I.point(-1)))
    rejected('source bracket outside original',lambda:center_offset(I(Q(1,4),Q(3,4))))
    rejected('invented fourth band displacement',lambda:caller._candidate(I.point(1),I.point(0),I.point(1),0,2,96))
    rejected('wrong center label binding',lambda:caller._candidate(I.point(1),I.point(0),I.point(1),1,0,96))
    for name,change in [
        ('changed original guard width',lambda d:d['source_nodes']['120836'].update(args=['2','3'])),
        ('changed actual reference caller',lambda d:d['source_nodes']['622820'].update(args=[2,623921,623934])),
        ('changed original B0',lambda d:d['original_constants'].update(B0='1')),
        ('changed representative lexical formal',lambda d:d['lexical_frames'][2].update(formal_nodes=[622803,622804])),
    ]:
        changed=json.loads(json.dumps(caller.source));change(changed)
        changed['payload_sha256']=hashlib.sha256(canonical({k:v for k,v in changed.items() if k!='payload_sha256'})).hexdigest()
        rejected('rehashed '+name,lambda changed=changed:validate_capsule(changed))
    after={k:hashlib.sha256((REPO/v['path']).read_bytes()).hexdigest() for k,v in caller.source['source_files'].items()}
    check('all_original_and_frozen_sources_unchanged',before==after)
    code_after={name:hashlib.sha256((HERE/name).read_bytes()).hexdigest() for name in code_paths}
    check('new_code_bytes_unchanged_during_validation',code_before==code_after)
    report={
        'schema':'MathScope.ActualBandCallerValidation/1','status':'PASS',
        'source_capsule_sha256':CAPSULE_SHA256,
        'checks':checks,'negative_controls':negative,'formal_chart_runs':runs,
        'reused_input_evidence':{'path':str(prior_path.relative_to(REPO)),'sha256':hashlib.sha256(prior_path.read_bytes()).hexdigest(),'input_count':len(selected)},
        'precision_comparison':precision,'source_sha256_before':before,'source_sha256_after':after,
        'new_code_sha256_before':code_before,'new_code_sha256_after':code_after,
        'independent_tools':{'mpmath':mp.__version__,'mpmath_decimal_digits':mp.mp.dps,'sympy':sp.__version__},
        'scope':['Actual original AST scalar/relative band/guard/linear transport only',
                 'Z=0 chart witnesses satisfy the literal source for every actual positive h; they are not claimed global points',
                 'Positive h envelope probes validate the multiplier algorithm; they do not replace source h',
                 'No external global coordinate, numeric ell, fixed mesh representative, radial integral, or whole-K obligation is certified'],
        'new_M3_closures':0,'N7_06_closed':False,'N8_05_closed':False,'actual_global_last_resolved_tau':None,
        'summary':{'checks_passed':len(checks),'negative_controls_passed':len(negative),'formal_chart_runs':len(runs),
                   'precision_bits':[32,64,128,512],'elapsed_seconds':time.monotonic()-start},
    }
    path=HERE/'evidence/BAND_CALLER_VALIDATION.json'
    path.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
    summary=report['summary']|{'status':'PASS','source_capsule_sha256':CAPSULE_SHA256,'new_M3_closures':0,'actual_global_last_resolved_tau':None}
    (HERE/'evidence/SUMMARY.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2))

if __name__=='__main__':main()
