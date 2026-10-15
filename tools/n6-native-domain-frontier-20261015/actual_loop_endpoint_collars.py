"""Exact inequalities composing the actual natural/B26 C1 endpoint collars."""
import argparse,hashlib,json
from fractions import Fraction as F
from pathlib import Path

FIXED='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
PRE='7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3'

def prove_inequalities():
    # On I, B=D+4-4 eta² >1/5 for h<1/1000.
    assert F(1,2)-F(1,1000)+4-4*F(33,32)**2>F(1,5)
    assert (1+F(1,1000))*5<6
    assert 1-36*F(1,1000)**2>F(999,1000)
    assert F(998,1000)/F(9,2)>F(1,5)
    # The nonpressure part of actual Zstar has absolute value <26j.
    assert (F(1,2)+F(1,1000))*(1+288*F(1,1000)**2)*24+F(4,1000)<26
    assert F(4,5)-F(26,1024)>F(1,2)
    # For |eta|<6j, f²>4/5, hence |P0|>(5/2)K f²>2K.
    assert 1/(1+36*F(1,1000)**2)**2>F(4,5)
    # J0 alternating P4 derivative is negative throughout [3,4.1].
    xmax=F(21,5)
    assert -F(1,2)+xmax/8-F(9,96)+xmax**3/2304<0
    x=F(3);p4=1-x/2+x*x/16-x**3/288+x**4/9216
    assert p4==-F(23,1024)
    eps=F(1,2**(260*56+1))
    assert p4+(1+F(41,10))*eps<-F(1,64)
    # epsilon/j <(1/2)Q^(-111/2) <(1/2)Q^-55 <1/16.
    assert 8<2**(260*55)
    # exp(x)<=1/(1-x) keeps the entire actual left collar in Y<=4.1.
    assert 4/(1-F(1,70000))<F(41,10)
    # For y/t1<=1/7, sigma<=exp(4-49)<2^-40.
    assert 49-4>40
    # Actual B26 comparison gives factor exp(-32 t1*2^-40)*(1-2^-40).
    # exp(-v)>=1-v, t1<1/10000; use the weaker (1-2^-40)^2.
    assert F(32,10000)<1
    loss=F(1,2**40)
    assert (1-loss)**2*(2+F(1,64))>2+F(1,128)
    # A larger step loss could destroy the left collar; reject that mutation.
    assert (1-F(1,2))**2*(2+F(1,64))<2
    return {'universalEtaIPrimitiveBounds':True,'negativePressureAndZstarAbsorption':True,
      'besselAlternatingPolynomialUniformBound':True,'actualBanachPerturbationAbsorbed':True,
      'actualLeftCollarWithinNaturalDomain':True,'originalSquareSeedLossBelow2Minus40':True,
      'actualKappaAndERatioKeepStrictMargin':True,'changedCutoffLossRejected':True}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--payload',type=Path,required=True)
    p.add_argument('--natural',type=Path,required=True)
    p.add_argument('--radial',type=Path,required=True)
    p.add_argument('--join',type=Path,required=True)
    p.add_argument('--b26-binding',type=Path,required=True)
    p.add_argument('--loop-binding',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    payload=json.loads(a.payload.read_text(encoding='utf8'))
    fixed=payload['fullNativePayloads']['fixed'];params=fixed['source']['parametersExactExpressions']
    assert params['loopILeft']=={'product':[{'quotient':[{'integer':4},{'ref':'Lambda'}]},{'exp':{'quotient':[{'ref':'t1'},{'integer':8}]}}]}
    assert params['loopIRight']=={'product':[{'ref':'XR'},{'exp':{'sum':[{'ref':'T'},{'integer':3}]}}]}
    assert params['kappa0']==params['omega1']==params['omega2']=={'ref':'t1'}
    assert params['t1']=={'power':[{'ref':'CSelected'},-120]}
    assert params['sourceEnvelopeS']=={'power':[{'ref':'CSelected'},100000]}
    assert params['loopDelta']=={'exp':{'product':[{'integer':-1},{'power':[{'ref':'sourceEnvelopeS'},16]}]}}
    assert params['lambda']=={'exp':{'product':[{'integer':-1000},{'ref':'T'}]}}
    paths={k:getattr(a,k.replace('-','_')) for k in ['natural','radial','join','b26-binding','loop-binding']}
    v={k:json.loads(path.read_text(encoding='utf8')) for k,path in paths.items()}
    assert v['natural']['fixedDefinitionSHA256']==v['radial']['fixedDefinitionSHA256']==FIXED
    assert v['natural']['derivedMathematicalConclusion']['normBound']=='Q'
    assert v['radial']['provedActualConclusions']['actualPhiYUpper']=='-chi/32-t/16<0'
    assert all(v['radial']['independentExactChecks'].values())
    assert v['join']['schema']=='MathScope.N6.ActualNaturalB26ConservationIdentity/1'
    assert v['join']['identities']['sourceP1']=='-2X*F_X/F'
    assert v['join']['identities']['sourceNs']=='-2*U_X'
    assert all(v['join']['exactChecks'].values()) and all(v['join']['negativeControls'].values())
    assert v['b26-binding']['sourceSHA256']==PRE and v['b26-binding']['sourceBytesUnchanged']
    assert v['b26-binding']['diagnosticOverlap']>0 and all(v['b26-binding']['checks'].values())
    assert v['loop-binding']['schema']=='MathScope.N6.ActualC1NativeRegularityBinding/1'
    assert v['loop-binding']['sourceSHA256']=='07ee5caa8ce45a9d8a910cab7243ae3e351965a8602a38030917f69114d8902d'
    assert v['loop-binding']['sourceBytesUnchanged'] and v['loop-binding']['registryCompared']
    assert v['loop-binding']['fixedDefinitionCompared'] and v['loop-binding']['diagnosticOverlap']>0
    assert all(v['loop-binding']['checks'].values())
    for k in ['literalEndpointParameters','literalLeftB26Branch','literalRightPowerEBranch','literalRightZeroUTailBranch','literalPulseStartAfterRightCollar']:
        assert v['loop-binding']['checks'][k]
    result={'schema':'MathScope.N6.ActualC1EndpointCollars/1','fixedDefinitionSHA256':FIXED,
      'sourcePregluingSHA256':PRE,'sourceLoopSHA256':v['loop-binding']['sourceSHA256'],
      'inputSHA256':{k:hashlib.sha256(path.read_bytes()).hexdigest() for k,path in paths.items()},
      'independentExactChecks':prove_inequalities(),
      'provedActualCollars':{'etaDomain':'[-33/32,33/32]',
        'leftLogRadiusDomain':'t1/9<=log(X/Xa)<=t1/7 (contains original t1/8)',
        'leftVsMinus2Lower':'1/128>S^-1>loopDelta',
        'rightLogRadiusDomain':'T+5/2<=log(X/XR)<=T+7/2 (contains original T+3)',
        'rightVsMinus2':'2lambda>S^-1>loopDelta',
        'actualAAndBIdenticallyZeroOnEndpointNeighborhoods':True},
      'proof':'ACTUAL_C1_ENDPOINT_COLLARS_KO.md',
      'remainingSourceApplications':['Combine full original preloop E/a/S envelope and all actual B8 composition receipts.','Post-C12 and later C2 full actual domains/regularity.','Full original g21 compact pressure-band application.'],
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'actualLeftEndpointMargin':'1/128','actualRightEndpointMargin':'2lambda','newOriginalDischarged':0}))

if __name__=='__main__':main()
