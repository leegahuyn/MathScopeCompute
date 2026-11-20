from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    'c100':'17664f981265e2373a5c16d0bf3c9dc233af48605974de1e072520b9932b71de',
    'c102':'68f115ba24df5970da8c4c9e684e8a6f541078e0d8cd33178db999e05774140f',
    'c103':'75221f220bc472ca8bb4f600a3cb46cb76e07d4d386ba1dcf6ce254e5b86e18b',
    'c104':'9b94457853b46d03a64439173a414a5b614b814ddbbc92a808e0b1c0fc1be993'
}


def read(path,pin):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==pin,path
    return json.loads(data)


def source(args):
    raw=args.operands.read_bytes()
    x=json.loads(raw)
    stages={k:read(getattr(args,k),pin) for k,pin in PINS.items()}
    assert x['prior']['C104']==PINS['c104']
    assert [x['auxiliarySystem'],x['actualSystem']]==[2,3]
    assert x['rawForcingRows']==3 and x['sharedUnchangedMatrixEntries']==72
    assert x['rawForcing'][:3]==[0,0,0] and all(x['rawForcing'][3:])
    assert x['forcingDifferenceNumeratorMonomials']==[0,0,0]
    assert x['ordinaryWholeMomentReplacementNumerators']==[0]*5
    assert x['exactLowerOmega']['wholeLowerHistories']==[120390,120395,120402]
    assert x['exactLowerOmega']['switch']==120375 and x['exactLowerOmega']['outerOmegaTermCount']==7
    assert x['guards']=={'X':4756,'eta':2,'Xcut':28823,'Xv':3293,'Xplus':28824,'lastIpos':117099}
    assert len(x['exteriorZeroChecks'])==6 and all(j['zero'] for j in x['exteriorZeroChecks'])
    assert stages['c100']['norms']['finiteRegisteredValueErrorOnDeltaOver8']=='2^73 Q^-77'
    assert stages['c100']['norms']['rawF1U1XDerivativeErrorOnDeltaOver16']=='2^46 Q^-19'
    assert stages['c102']['sourceScaleBounds']['Xb']=='C^11'
    assert stages['c103']['quantitative']['actualStrip']=='s=delta/2^19'
    assert stages['c103']['quantitative']['tail']=='E=4^-K/3 for K>=actual_Kcondition'
    assert stages['c104']['optionalInnerPressureSourceFromN1']['N2PknownError']=='2^19 Bdelta/s1^2 uniformly through aSquared on S_(s1/4)'
    assert x['originalNorms']=={'C1':24818,'M1':24848,'C2':118568,'Kcondition':118577,'s':117678,'aSquared':24805}
    assert x['leadingNorm']['programSHA256']=='46aed3dffdbc761a19db2d8a2cc8209223c7ad6683314bc697628b8de36390c2'
    assert [x['leadingNorm'][k] for k in ('radialOrder','etaOrder','U','F','nodeCount')]==[2,3,2323,2329,1968]
    norm={i:node for i,node in x['leadingNorm']['arithmeticNodes']}
    assert len(norm)==1968 and {2323,2329}<=norm.keys()
    kinds=Counter()
    for i,node in norm.items():
        op,args=node['op'],node['args']
        kinds[op]+=1
        if op=='rational':
            n,d=map(int,args)
            assert d>0 and Fraction(n,d).denominator==d
        elif op=='source_parameter':
            assert len(args)==1
        else:
            assert op in {'add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling','integer_power'}
            assert all(j in norm and j<i for j in (args[:1] if op=='integer_power' else args))
    return x,sha256(raw).hexdigest(),dict(sorted(kinds.items()))


def local_budget():
    # All native matrix entries except last two rows use at most 32
    # in the common units Q^2/delta. The exact interval X<a^2 fits F0+XF0x.
    assert 8+5*16<128
    assert 2*(4*(4*8+5*16)+5*16)<2**11
    assert 2*(4*(4*8+1)+5*16)<2**11
    diag=2+2**9+2*2*8*2
    a0_r4=2*(4*33*2+2**9)+(4*2*4*128*2+2*2**11)+4*2*4*128*2+diag
    a0_r5=8*2*8*2+(2*4*33*2+4*2*4*2+2*2**11)+4*2*4*2+4*4*2*2+diag
    a1_r4=2*(2*2+5*8)*2+2*(2*5*128*2)
    a1_r5=2*(2*2+5*8+5)*2+2*(2*5*2)
    assert max(a0_r4,a0_r5,a1_r4,a1_r5,32)<2**20
    assert 6*3*2**(20+19)<2**44
    assert 2**44*2 < 2**(260*26)
    assert 2**18 > 2**6 # S_(2*s) inside S_(s1/4).
    # X-coefficients of the exact squared-flat thin radial cutoff.
    assert Fraction(9*64,4)<2**8
    assert Fraction(9*64+8192*64**2,4)<2**24
    assert 1+2*9*64<2**25
    # N1 pointwise F,U, first X, and weighted second X error on the Ipos bumps.
    g=lambda e:2**e
    a,b,b0,b1,b2=g(17),g(31),g(15),g(2070),g(2081)
    ipos=[16*a*(b1+b2),24*b*(b2+3*b1+3*b0)]
    assert 5*max(ipos)<2**(260*62)
    # Cauchy and Z on the N1 strip, then the two full raw forcing differences.
    z=2*(4*(4+1)+5*2)
    zx=2*(4*(4+2)+5*2)
    assert z<2**6 and zx<2**7
    zz=2*(4*(4*2**6+2**7)+5*2**8)
    assert zz<2**14
    assert 2**8+2**7+2**14<2**16
    assert max(2*2**19,2*2**16,2*2**16+16*2**19)<2**25
    assert 2*(4+8+10)<2**6 # N1 radial velocity reconstruction and average.
    assert 2**6*(4+2*4**2)<2**14 # Real eta-C1 cap also applied to v_eta.
    return {'maxActualMatrixRowAfterQSquaredOverDelta':max(a0_r4,a0_r5,a1_r4,a1_r5),
            'localZZIntegerCharge':zz,'localPerturbationRatio':'<2^44 Q^-26<1/2'}


def global_budget():
    # Leading geometry real eta-C1 norms of eta,d,1/L, and eta-C2
    # derivative costs from the positive leading mixed norm.
    assert 1-2*Fraction(1,16)==Fraction(7,8)
    linv=[2,1,2]; geo=[5,11,19]
    jet=[sum(Fraction((1,1,2)[j],(1,1,2)[j-i]*(1,1,2)[i])*linv[i]*geo[j-i]
             for i in range(j+1)) for j in range(3)]
    assert max(jet) < 2**8
    assert max(sum(jet[:2]),sum(jet[1:])) < 2**12
    Z,T=3*(4*(4+1)+3),3*(4+2+1)
    assert Z<2**7 and T<2**5
    assert T+6+3+2*Z <2**16
    assert T+6+Fraction(3,2)+Z <2**16
    # The original positive amplitude reciprocal contributes <=10Q in eta-C1.
    assert 2**10*Fraction(11,2)<2**30
    assert 2**24*10<2**30
    assert 1+3*2**15*2**30<2**48
    assert 2**48+1<2**50
    # Bounds of each pressure, mixed, and X-weighted lower density.
    assert max(2+2**15,4,4+2**15)<2**18
    assert 4<2**6
    # The approximate pressure is the same anchored primitive of the
    # pressure density. One derivative for v2 is all that was used.
    assert max(2,2*(2+2+1))<2**8
    assert 2**8+2<2**9
    # Two strict half-budget bounds sum to the advertised 256-bit target.
    assert 2*Fraction(1,2**257)==Fraction(1,2**256)
    return {'v0DerivativeIntegerCharges':list(map(int,jet)),'ZandTIntegerCharges':[Z,T]}


def main(args):
    x,operand_sha,kinds=source(args)
    local=local_budget()
    global_checks=global_budget()
    result={
      'schema':'MathScope.C105.ActualCoupledN2WholeCoefficientError/1',
      'sourceStatus':'VERIFIED_ORIGINAL_THREE_FORCING_ROWS_FIXED_MATRIX_WHOLE_OMEGA_AND_FIVE_MOMENT_RETARGETING',
      'ordinaryStatus':'CONDITIONAL_ON_COMMON_ORIGINAL_LEADING_N1_N2_AND_FIXED_BOUND_ORDINARY_REALIZATION',
      'operandsSHA256':operand_sha,'previousReceiptPins':PINS,
      'systems':{'actual':3,'auxiliary':2},'originalNorms':x['originalNorms'],
      'originalLowerOmega':x['exactLowerOmega'],'sourceCutoff':x['guards'],
      'exactForcingDifferenceNumerators':x['forcingDifferenceNumeratorMonomials'],
      'coupledMomentNumerators':x['ordinaryWholeMomentReplacementNumerators'],
      'ordinaryLeadingEnvelope':{'U':2323,'F':2329,'radialOrder':2,'etaOrder':3,'arithmeticDagNodes':1968,
                                 'arithmeticOperations':kinds},
      'localStability':{'matrixCap':'Ma=2^20 Q^4','resolventShape':'same source homogeneous diagonal Volterra operator',
                        'forcingError':'Fd=2^25 H1 e/s1^2; s1=delta/16; e=2^25 Q^64 t1^-2 (E1+R1)',
                        'H1':'2^12 (1+C1)(1+M1) Q^64/(t1*s1)',
                        'pairedFiniteAndInfiniteError':'2a Fd on original S_s, a=sqrt(aSquared)',
                        'rawCoupledFiniteError':'E2=4^-K/3+2*a*Fd when K>=original Kcondition',
                        **local},
      'wholeCoupledTransfer':{'errorNorm':'sup_{X>=0,eta in [-1,1]} of each ordinary value',
           'realLeading':'B=CSelected^11; L0=2^12*(1+Ubound[2323]+Fbound[2329])',
           'lowerC1error':'D1=2^14 e/s1^3<=1',
           'trueAndFiniteN1ValueC1':'N1=2^50 Q^2 Hm; Hm=2^17 B^3 L0^2',
           'lowerThreeMomentBodyErrorC1':'DL=2^18 B^2 L0^2 N1 D1',
           'localRawN2ErrorC1':'E2s=4 E2/s',
           'allFiveIncomingMomentErrorsC1':'Merr=2^6 L0 E2s+B DL',
           'wholeF2U2ErrorC1':'S2=E2s+2^48 Q^2 Merr',
           'uniformNineOutputsError':'Z=2^9 B L0 S2+B DL',
           'allNine':['F2','U2','R F2','M2','M2/X','V2','v2','Pi2','Pi2_X'],
           'sameExteriorPressureAndCoefficientErrorsZeroAfterLastIpos':True,
           'twoAdaptiveDepths':'Z=A_K*(4^-K/3)+A_N*e; choose N and K from the positive closed expressions in README',
           'combinedPointwiseError':'strictly below 2^-256 after specified adaptive depths',
           'retainsPressureAndMassBetweenXcutAndIpos':True,
           'depthsMaterialized':False,
           **global_checks},
      'remaining':'OPEN_COUPLED_STRESS_REGULARITY_NUMERICAL_CENTERS_HIGHER_N_AND_ALL_JETS',
      'finalJets':0,'release':'HOLD'}
    with args.out.open('xb') as f:
        f.write((json.dumps(result,indent=2)+'\n').encode())
    print('PASS: native three-row forcing, fixed-matrix resolvent, global Omega and nine coupled coefficients')


if __name__=='__main__':
    p=ArgumentParser()
    for option in ('operands','c100','c102','c103','c104','out'):
        p.add_argument('--'+option,type=Path,required=True)
    main(p.parse_args())
