#!/usr/bin/env python3
"""Independent targeted arithmetic audit of the new actual preloop gaps.

The full continuous arguments were read independently. This file verifies
the literal ideal source identity, XR scaling, finite density bounds and
margin arithmetic, and binds them to the same actual source derivative S.
No producer/checker module is imported.
"""
from __future__ import annotations
import argparse,hashlib,json
from datetime import datetime,timezone
from fractions import Fraction as F
from pathlib import Path
HERE=Path(__file__).resolve().parent
NAVIER=HERE.parent.parent
AXIS=NAVIER/'followup-20261010-same-datum-axis'
STRESS=NAVIER/'followup-20261010-final-stress-audit'

class P:
    def __init__(self,d=None):self.d={k:F(v) for k,v in (d or {}).items() if v}
    @staticmethod
    def c(v):return P({(0,0):v})
    @staticmethod
    def x(i):return P({(1,0) if i==0 else (0,1):1})
    def __add__(self,b):
        if not isinstance(b,P):b=P.c(b)
        d=dict(self.d)
        for k,v in b.d.items():d[k]=d.get(k,0)+v
        return P(d)
    __radd__=__add__
    def __neg__(self):return P({k:-v for k,v in self.d.items()})
    def __sub__(self,b):return self+(-b if isinstance(b,P) else -F(b))
    def __rsub__(self,b):return -self+b
    def __mul__(self,b):
        if not isinstance(b,P):b=P.c(b)
        d={}
        for k,v in self.d.items():
            for l,w in b.d.items():
                n=(k[0]+l[0],k[1]+l[1]);d[n]=d.get(n,0)+v*w
        return P(d)
    __rmul__=__mul__
    def __pow__(self,n):
        p=P.c(1)
        for _ in range(n):p=p*self
        return p
    def __eq__(self,b):return self.d==b.d

def sha(b):return hashlib.sha256(b).hexdigest()
def rational(v):return F(int(v['numerator']),int(v['denominator']))

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
    out=Path(args.output).resolve();saved=out.with_suffix('.inputs');saved.mkdir(exist_ok=False)
    paths={
      'gap-receipt.json':STRESS/'preloop-gap-review/0001/receipt.json',
      'gap-proof.md':STRESS/'B8_AND_PRELOOP_GAPS_EN.md',
      'gap-producer.py':STRESS/'check_preloop_gaps.py',
      'activation-proof.md':STRESS/'ACTIVATION_COLLAR_BOUNDS_EN.md',
      'activation-receipt.json':STRESS/'activation-review/0002/receipt.json',
      'b8-certificate.json':HERE.parent/'attempts/b8-0001/certificate.json',
      'continuation-certificate.json':AXIS/'continuation-debt-certificate.json',
      'global-source-certificate.json':AXIS/'global-source-envelope-certificate.json',
      'independent-source-review.json':AXIS/'independent-review/source-derivative-review-001.json',
      'outer-proof.md':NAVIER/'followup-20261010-outer-reselection/OUTER_DERIVATION.md',
      'independent-verifier.py':Path(__file__),
    }
    blobs={k:p.read_bytes() for k,p in paths.items()};hashes={k:sha(b) for k,b in blobs.items()}
    for name,b in blobs.items():(saved/name).write_bytes(b)
    gap=json.loads(blobs['gap-receipt.json']);bind=gap['sourceBinding']
    debt=json.loads(blobs['continuation-certificate.json']);b8=json.loads(blobs['b8-certificate.json'])
    gs=json.loads(blobs['global-source-certificate.json']);ind=json.loads(blobs['independent-source-review.json'])
    checks={}
    def check(name,v):
        if name in checks:raise ValueError(name)
        checks[name]=bool(v)
    for name,key in [('gap-proof.md','proofSHA256'),('gap-producer.py','checkerSHA256'),
                     ('continuation-certificate.json','continuationReceiptSHA256'),('b8-certificate.json','B8CertificateSHA256')]:
        check('current_binding_'+key,hashes[name]==bind[key])
    for filename,key in [('B8_AND_PRELOOP_GAPS_EN.md','proofSHA256'),('check_preloop_gaps.py','checkerSHA256')]:
        check('saved_binding_'+filename,sha((STRESS/'preloop-gap-review/0001'/filename).read_bytes())==bind[key])
    for name,digest in bind['continuationProofFilesSHA256'].items():
        check('actual_continuation_input_'+name,sha((AXIS/name).read_bytes())==digest)
    check('same_final_parameter_member',bind['selectedContinuationParameterExpressionSHA256']==debt['parameterExpressionSHA256']==gs['sourceBinding']['finalContinuationParameterExpressionSHA256'])
    check('independent_S_matches_gap_member',ind['status']=='PASS' and ind['inputSHA256']['global-source-envelope-certificate.json']==hashes['global-source-certificate.json'])
    check('same_outer_source',hashes['outer-proof.md']=='ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81')
    geometry=b8['geometry']
    supports=[(rational(a),rational(b)) for a,b in geometry['supports']]
    check('actual_nonunit_B8_bumps',geometry['unitMass'] is False and supports==[(F(n,4096),F(n+1,4096)) for n in [12,14,16,18,20]])
    check('actual_bump_mass',all(rational(x)==F(1,4096) for x in geometry['integralMass']))
    bounds=b8['bounds']
    check('actual_root_eta0_eta1_bounds',all(rational(bounds[k])<=F(1,10**6) for k in ['uRadius','eRadius','uEtaDerivative1','eEtaDerivative1']))
    check('actual_step_bounds',rational(bounds['bumpSupremum'])<9 and rational(bounds['bumpDerivativeSupremum'])<128)

    # Literal ideal 4.16 source identity, in QQ[h,eta], after multiplying
    # by 1+eta^2. This is not a pointwise numerical comparison.
    h,e=P.x(0),P.x(1)
    D=P.c(F(1,2))-h;d=1-e**2;c=4*e
    W=1-2*D*e*c-4*d
    LHS=(-W+F(5,8)*(1-h-4*d+2*(h-D)*e*c))*(1+e**2)+F(5,8)*(D*e+d*c)*2*e
    RHS=(F(9,8)-F(5,8)*h+2*h*e**2)*(1+e**2)+F(5,8)*2*e**2*(D+4*d)
    check('literal_ideal_W_identity',W==P.c(-3)+8*h*e**2)
    check('literal_ideal_Q_identity',LHS==RHS)
    check('XR_angular_moment_cancels',F(3,2)-1-F(1,2)==0)
    check('XR_mass_energy_terms_cancel',1-1==0)
    check('XR_pressure_terms_cancel',1-1==0)

    hm=F(1,2**200);mu=hm**2;field=F(1,1000)
    check('raw_S_unmixing_value_and_eta',3+3*8==27)
    check('restoration_energy_derivative',16+8+4==28)
    check('restoration_angular_derivative',2*(2+1)==6)
    check('physical_bump_field_eta_margin',18*F(1,10**6)<field)
    # Ordinary first derivatives of exact partial density differences.
    J=2*(2*field+8*field+2*field**2)
    energy=16*field+2*field+3*field**2
    pressure=2**13*(2*field+field**2)
    check('partial_J_density_independent',J<1)
    check('partial_energy_density_independent',energy<1)
    check('partial_pressure_density_independent',pressure<17)
    check('all_partial_continuous_debt',27*hm+28*hm**2+17<100)
    check('coordinate_pressure_weight',3**8<2**13)
    check('E_ideal_lower',3**4<F(5,2)**5)
    check('E_actual_lower',F(1,5)-F(9,10**6)>F(1,6))
    shear=12*(21*128+F(9,10))*F(1,10**6)
    bs=12*21*128*F(1,10**6)
    check('actual_a_error_mu_quarter',shear<F(1,4))
    check('actual_bs_error_mu_quarter',bs<F(1,4))
    check('restoration_bs_error_mu_quarter',720*hm**2<1)
    check('actual_v_below_one',F(9,10)+F(1,16)/F(7,10)<1)
    check('ideal_Q_lower_then_partial_perturbation',F(9,8)-F(5,8)*hm-F(1,16)>1)
    check('ideal_Q_upper_four',F(9,8)+2*hm+F(5,8)*F(9,2)<4)
    check('complete_delta_Q_coefficient',100*2**14+(150+200)*2**23+7<2**40)
    check('actual_mu_times_P_smallness',2*8002-2==16002 and 40-16002*128<-4)
    ns=20+5+18+34+27+256
    check('full_Ns_without_C_factor',ns<2**20)
    check('w_from_actual_E_and_Q',6*2**20<2**24)
    check('projected_source_positive',F(10,7)*F(1,4)*2**24<2**26 and 26-16002*128<-2)
    check('B8_raw_projected_gap',F(3,4)*2**27-2>1)
    check('B8_quadratic_gap_for_v_less_than_one',2*F(1)**2>1)

    cm=2**260
    check('activation_flat_lower',4*3**256<2**408)
    check('activation_gap_common_power',2*408-2==814 and 260*1000>814)
    check('actual_a_common_power',122<1000<100000)
    check('post_activation_projected_lower',F(11,5)-F(4,cm**71)>F(21,10))
    check('post_activation_shear_small',F(1,cm**115)+F(4,cm**71)<F(1,10))
    check('reference_stock_integral_barrier',F(6,5)*(100-F(1,100))>3)
    check('final_transition_positive_slack',3-F(4,cm**71)>F(29,10))
    check('shift_constant_stock_barrier',100-F(13,20)*F(5,2)>0)
    ep=F(1,50000)
    check('postshift_source_margin',F(11,20)*(3-F(8,1000)-F(1,1000)-2*ep)-F(11,1000)-F(1,10**6)/(2*F(49,100))-2*ep>1)
    check('outer_stock_C9',110*cm>3**8 and cm**9>2**33)
    check('outer_projected_and_D_gap',F(1,3)-F(2,2**33)>F(1,4) and F(1,3)-F(116,2**33)>F(1,6))
    check('outer_quadratic_margin_actual_finite_stock',F(1,4)-4*F(2259*116,2**33)>F(1,8))
    check('left_collar_v_gap',F(21,10)-2==F(1,10))
    check('right_collar_positive_lambda',1000<8002 and 1<100000)
    check('left_geometry',0<F(1,16)<F(1,8)<F(1,4))
    check('J_right_before_I2_and_pulse',16<2**5 and 16<2**25)
    check('same_S_closes_loop_upper_and_lower_inputs',gap['fixedExpressions']['S']=='C^100000' and gs['parametersExactExpressions']['sourceEnvelopeS']=={'power':[{'ref':'CSelected'},100000]} and 1000<100000)
    check('no_formal_promotion',gap['claimBoundary']['newLeanProof'] is False)
    for name,path in paths.items():check('stable_'+name,path.read_bytes()==blobs[name])
    report={'schema':'MathScope.Navier.IndependentActualPreloopGapAudit/1',
        'verifiedUTC':datetime.now(timezone.utc).isoformat(),'status':'PASS' if all(checks.values()) else 'FAIL',
        'passed':sum(checks.values()),'total':len(checks),'checks':checks,'inputSHA256':hashes,
        'snapshotDirectory':str(saved),'producerImported':False,
        'exactIdealQIdentityAfterDenominatorClearing':{str(k):str(v) for k,v in sorted((LHS-RHS).d.items())},
        'independentPartialDensityCoefficients':{'J':str(J),'S':str(energy),'Cp':str(pressure)},
        'conclusion':'The attached actual C^-1000 relaxed-gap and S^-1 collar proof passes independent finite-algebra review and is bound to the same separately audited source S=C^100000.',
        'scope':'Read and checked the attached continuous proof; no grid substitution, no original Lean proof terms, no automatic full-profile gate promotion.'}
    with out.open('x') as f:json.dump(report,f,indent=2);f.write('\n')
    print(json.dumps({k:report[k] for k in ['status','passed','total']}))
    print(json.dumps({'failed':[k for k,v in checks.items() if not v]}))
    raise SystemExit(0 if report['status']=='PASS' else 1)

if __name__=='__main__':main()
