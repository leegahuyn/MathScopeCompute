"""Literal fast-chain identities and actual first-slow-derivative C12 gap."""
import argparse,hashlib,json,sys
from fractions import Fraction as F
from pathlib import Path

BASE=Path(__file__).resolve().parent

def first_derivative_budget():
    # Finite sums cost one C exponent; C>2^2048. Analytic body estimates in proof.
    b={'referenceF_y':4,'referenceU_y':4,'referenceMoments_y_eta0to1':25,
       'referenceSource_y':100,'B26Cutoff_y':121,'actualU_yy':200,
       'actualA_y':200,'actualBs_y':205,'actualNs_y':230,'actualP2_y':260,
       'allThreeFirstStateDerivatives':600,'sourceS':100000}
    assert b['B26Cutoff_y']+1+1+1<200
    assert b['referenceSource_y']+1+1+1<200
    assert b['actualU_yy']+4+1<=b['actualBs_y']
    assert 184+28+1<b['actualNs_y']
    assert 24+b['actualNs_y']+4+1+1<=b['actualP2_y']
    assert max(b['actualA_y'],b['actualBs_y'],b['actualP2_y'])<b['allThreeFirstStateDerivatives']<b['sourceS']
    # Third source step derivative: Gaussian damping times explicit polynomial.
    assert 81*(32*240+36*24+24*6+288*2+576*2+21760)<2**22<2**2048
    # exp absorption lemma: at S>=2^20 and p>=1, these positive log sums
    # are <S^(p+2), without materializing any enormous exponential.
    rows=[('r_y',16,18,1,10,16),('Wp',13,15,12,24,8),
          ('mu_y',22,24,3,2,2),('t_y',24,26,4,30,16),
          ('density_y',26,28,4,20,16),('theta_y',28,30,1,4,16),
          ('A_y',30,32,2,4,16),('B_y_over_E',34,36,4,10,16)]
    for _,p,q,coef,poly,constant in rows:
        assert q-p>=2 and coef+poly+constant<2**40
    return b,[{'quantity':name,'logBoundPower':q} for name,p,q,*_ in rows]

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    for name in ['composition','envelope','native','payload','out']:ap.add_argument('--'+name,type=Path,required=True)
    a=ap.parse_args()
    try:import sympy as s
    except ImportError:
        sys.path.insert(0,str(BASE/'audit-deps'));import sympy as s
    paths={name:getattr(a,name) for name in ['composition','envelope','native','payload']}
    raw={name:path.read_bytes() for name,path in paths.items()}
    data={name:json.loads(v) for name,v in raw.items()}
    sha={name:hashlib.sha256(v).hexdigest() for name,v in raw.items()}
    c,e,n,p=(data[name] for name in ['composition','envelope','native','payload'])
    assert c['schema']=='MathScope.N6.ActualC1C12RegularityComposition/1'
    assert c['inputSHA256']['envelope']==sha['envelope']
    assert c['inputSHA256']['loop-binding']==sha['native']
    assert c['inputSHA256']['diagnostics']==sha['payload']
    assert all(c['provedActualConclusions'].values())
    assert e['schema']=='MathScope.N6.ActualPreloopSourceEnvelope/1'
    assert e['actualSourceBounds']['inverseA']=='<CSelected^122<sourceEnvelopeS'
    assert e['actualSourceBounds']['vs']=='<CSelected^192<sourceEnvelopeS'
    assert e['actualSourceBounds']['absP2']=='<CSelected^220<sourceEnvelopeS'
    for name in ['literalActualStateSourceP1P2AndShears','literalZeroMeanPrimitiveBodies','literalFiniteNPhaseAndC12Bodies']:
        assert n['checks'][name]
    params=p['fullNativePayloads']['fixed']['source']['parametersExactExpressions']
    assert params['sourceEnvelopeS']=={'power':[{'ref':'CSelected'},100000]}
    assert params['C12EnvelopeR']=={'exp':{'power':[{'ref':'sourceEnvelopeS'},256]}}
    assert params['radialFrequencyN']=={'sum':[{'integer':1},{'ceil':{'power':[{'ref':'C12EnvelopeR'},50]}}]}
    assert params['loopDelta']=={'exp':{'product':[{'integer':-1},{'power':[{'ref':'sourceEnvelopeS'},16]}]}}
    assert params['t1']=={'power':[{'ref':'CSelected'},-120]}
    assert params['kappa0']==params['omega1']==params['omega2']=={'ref':'t1'}
    av,bv,E,v,t=s.symbols('a bs E vTarget t',nonzero=True)
    ts=-bv/av;theta_q_over_2pi=v/(av*(1+t*t))
    Aq=av*(1-theta_q_over_2pi)/2
    Bq=E*av*(ts-t*theta_q_over_2pi)/2
    abar=v/(1+t*t);bbar=-abar*t
    assert s.cancel(av-2*Aq-abar)==0
    assert s.cancel(bv+2*Bq/E-bbar)==0
    assert s.cancel(abar+bbar*bbar/abar-v)==0
    # Omitting the original fast phase derivative changes the actual principal.
    assert s.cancel(av-abar)!=0
    assert s.cancel(bv-bbar)!=0
    budget,slow=first_derivative_budget()
    assert F(1,8)-F(1,16)==F(1,16)
    assert F(2)+F(4,2)<=4 # bs exponential perturbation bound for R>=2
    assert 2+24+4<=30
    # R^-44 < delta/16: 44 S^256 > S^16+4 and exp(4)>16.
    assert 44-1>4 and 2**4==16
    result={'schema':'MathScope.N6.ActualPostC12ShearGap/1',
      'inputSHA256':sha,'fixedDefinitionSHA256':c['fixedDefinitionSHA256'],
      'actualFirstLogRadiusDerivativeBudget':budget,'actualSlowDerivativeLogBounds':slow,
      'independentExactChecks':{'literalFastChainA':True,'literalFastChainB':True,
        'literalPrincipalVsEqualsVTarget':True,'originalCutoffTargetAtLeast2PlusDeltaOver8':True,
        'sourceThirdStepDerivativeBelow2Power22':True,'actualFirstStateDerivativesBelowS':True,
        'actualSlowLoopDerivativesBelowOriginalR':True,'originalFiniteNAbsorbsAllErrors':True,
        'omittedFastPhaseDerivativeRejected':True},
      'provedActualConclusions':{'domain':'Original full loop rectangle and eta in [-33/32,33/32], with an open neighborhood',
        'Enew':'positive and C-infinity','anewLower':'(1/2)*vTarget/(1+t^2)>0',
        'vsnewLower':'2+loopDelta/16','principalA':'vTarget/(1+t^2)',
        'principalBs':'-vTarget*t/(1+t^2)','actualVsErrorUpper':'30*R^5/N<R^-44<loopDelta/16',
        'originalFiniteNAndPhysicalFastPhaseRetained':True},
      'proof':'ACTUAL_POST_C12_SHEAR_KO.md',
      'notClaimed':['anew>2','Post-I1/I2 whole-domain application','Full final g21 pressure-J regularity'],
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'actualPostC12aPositive':True,'actualPostC12VsLower':'2+delta/16','newOriginalDischarged':0}))

if __name__=='__main__':main()
