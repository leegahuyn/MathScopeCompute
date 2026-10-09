#!/usr/bin/env python3
"""Independent exact checks of the selected positive-scale factorization."""
from pathlib import Path
from fractions import Fraction as F
import json,hashlib,math,sys
sys.set_int_max_str_digits(0)
ROOT=Path(__file__).resolve().parent
def read(name):return json.loads((ROOT/name).read_text())
def sha(name):return hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
def ceil(x):return -(-x.numerator//x.denominator)
def main():
    a=read('source-axis-cone-refined.json');d=read('uniform-source-debt-final.json');c=read('continuation-refinement.json');p=d['singleSourceProfile'];v=c['finiteBounds'];checks=[]
    def check(name,ok):checks.append({'name':name,'pass':bool(ok)})
    lam=F(p['Lambda']);delta=F(a['selectedParameters']['deltaStar']);err=F(a['controlled']['remainderBound'])/(2*lam)
    check('actual_remainder_division',err==F(a['bounds']['selfMapDisplacementUpper']['exact']))
    check('actual_low_chi_target',err<=delta/100)
    check('actual_source_hash',d['sourceFiles']['axisCertificate']['sha256']==sha('source-axis-cone-refined.json'))
    check('actual_continuation_hash',d['sourceFiles']['continuationRefinement']['sha256']==sha('continuation-refinement.json'))
    Z=F(a['complexInput']['complexSuprema']['normalizedGradient']);L=F(p['logC'])+lam*Z;B0=F(v['GammaRationalFactor']['exact']);A=F(v['VmaxRationalFactor']['exact'])
    check('actual_log_budget',L==F(v['logAmplitudeBudget']['exact']) and L>0)
    envelopes=[]
    for name in ['t1','kappa0','axialWidth','shearWidth']:
        w=p[name];old=F(p['originalWidthEnvelopes'][name]);envelopes.append(old)
        check(name+'_strict_positive_coefficient',F(w['coefficientNumeratorExact'])==old and old>0)
        check(name+'_exponent',F(w['exponentExact'])==-24*L)
        fs=w['denominatorFactors'];check(name+'_exact_factored_denominator',fs==[{'baseExact':'100000000','power':1},{'baseExact':str(B0),'power':20},{'baseExact':str(1+A),'power':1}])
        check(name+'_dyadic_enclosure',24*L>=c['dyadicWidthUpper']['bits'] and B0>=1 and A>=1)
    # K=1000 B0^16 exp(16L). Rather than materializing the huge powers,
    # cancel common factors symbolically and check the remaining positive
    # rational coefficient and nonpositive exponential power.
    check('global_K_width_sum',sum(envelopes)/100000<F(1,100) and -8*L<=0 and B0**4>=1)
    check('activation_K_V_width',envelopes[0]/100000<F(1,100) and -6*L<=0)
    check('small_shear_Vmax',envelopes[1]/100000000<F(1,100) and -22*L<=0)
    check('whole_quadratic_cone_margin',2*F(1,100)**2<8)
    q=F(159,200);phiMax=1+err/q;ey=err/(20*q*q)
    angular=2+2*(F(18,100)-err/q-4*ey)/phiMax
    check('independent_high_chi_margin',angular==F(v['angularEndpointLower']['exact']) and angular>F(23,10))
    check('source_constant_has_margin',F(v['sourceSqConstantLower']['exact'])>F(12,5))
    check('constant_a_segment_has_margin',F(v['finalConstantSlopeSqLower']['exact'])>1)
    check('whole_shape_transition_has_margin',F(v['shapeTransitionSqLower']['exact'])>1)
    nc=1/F(p['reservedInnerCollar']['activationFraction']);check('reserved_collar_denominator_integral',nc.denominator==1)
    check('reserved_collar_step_exponent',nc*nc-4>2*L+ceil(1+A).bit_length()+10)
    check('reserved_collar_field_gap',F(23,10)-F(1,1024)-F(1,100000)>F(9,4))
    prefix=read('axis-prefix-final.json')
    for k in ['h','j0','Lambda','sigmaStar','logC']:check('same_prefix_'+k,F(prefix['sourceProfileParameters'][k])==F(p[k]))
    check('full_kernel_claim_not_invented',not d['gates']['generatedAnalyticPremisesKernelChecked'] and not c['gates']['allAnalyticInequalitiesKernelChecked'])
    out={'schema':'MathScope.Navier.IndependentContinuationVerification/1','status':'PASS' if all(x['pass'] for x in checks) else 'FAIL','passed':sum(x['pass'] for x in checks),'total':len(checks),'checks':checks,'method':'Independent Python Fraction cancellation and exact source-hash/datum checks; no exp(logC) floating-point evaluation.','proofBoundary':'The positive factors and reduced arithmetic inequalities are checked here. The analytic input comparison lemma is documented and independently reviewed, but is not automatically a Lean proof.'}
    (ROOT/'independent-continuation.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'status':out['status'],'passed':out['passed'],'total':out['total']}));assert out['status']=='PASS'
if __name__=='__main__':main()
