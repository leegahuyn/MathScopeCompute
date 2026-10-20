"""Compose source-bound actual background, C1 roots/collars and finite-N C12.

This checks an exact dependency chain for the written analytic composition.
It never promotes a downstream shear or final-g obligation from a receipt.
"""
import argparse,hashlib,json
from pathlib import Path

FIXED='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
PRE='7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3'
LOOP='07ee5caa8ce45a9d8a910cab7243ae3e351965a8602a38030917f69114d8902d'
RAW='b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1'

def require(value,message):
    if not value:raise AssertionError(message)

def same_hash(parent,field,name,digests):
    require(parent[field][name]==digests[name],'Changed dependency: '+name)

def validate(data,digests):
    n,r,b26,b34,b8=(data[k] for k in ['natural','natural-radial','b26','b34','b8'])
    join,bb,lb,lp,env,col=(data[k] for k in ['join','b26-binding','loop-binding','loop-proof','envelope','collars'])
    require(digests['diagnostics']==RAW,'Authenticated diagnostic pin')
    raw=data['diagnostics'];require(raw['fullNativePayloadSHA256']['fixed']==FIXED,'Actual fixed definition pin')
    require(n['fixedDefinitionSHA256']==r['fixedDefinitionSHA256']==FIXED,'Same actual natural function')
    require(n['schema']=='MathScope.N6.ActualNaturalIndependentBanachMajorant/1','Actual natural proof')
    require(n['derivedMathematicalConclusion']['normBound']=='Q','Proved actual coefficient bound')
    require(r['provedActualConclusions']['actualPhiYUpper']=='-chi/32-t/16<0','Actual reference monotonicity')
    require(b26['schema']=='MathScope.N6.ActualB26RadialPositivity/1' and b26['sourceSHA256']==PRE,'Actual B26 source')
    require(b26['originalProducerBindingExecuted'],'Actual B26 replay')
    require(b34['schema']=='MathScope.N6.ActualB34RadialPositivity/1' and b34['sourceSHA256']==PRE,'Actual B34 source')
    same_hash(b34,'inputSHA256','b26',digests)
    require(b8['schema']=='MathScope.N6.ActualB8IncomingAndPositivity/1','Actual continuous B8 proof')
    for name in ['natural','natural-radial','b26','b34']:same_hash(b8,'inputSHA256',name,digests)
    require(b8['sameActualRoot']['existsUnique'] and b8['sameActualRoot']['isCInfinityOnOpenEtaNeighborhood'],'Actual B8 root regularity')
    require(b8['actualB8EAndA']['aLower']=='3/4','Actual B8 positivity')
    require(join['schema']=='MathScope.N6.ActualNaturalB26ConservationIdentity/1','Actual interface theorem')
    require(join['identities']['sourceP1']=='-2X*F_X/F' and join['identities']['sourceNs']=='-2*U_X','Actual conserved logarithmic derivatives')
    require(all(join['exactChecks'].values()),'Actual natural/B26 equation algebra')
    require(bb['sourceSHA256']==PRE and bb['sourceBytesUnchanged'] and bb['diagnosticOverlap']>0,'Actual B26 graph binding')
    require(all(bb['checks'].values()),'Actual B26 constructor comparison')
    require(lb['schema']=='MathScope.N6.ActualC1NativeRegularityBinding/1' and lb['sourceSHA256']==LOOP,'Actual C1 source')
    require(lb['sourceBytesUnchanged'] and lb['fixedDefinitionCompared'] and lb['registryCompared'] and lb['diagnosticOverlap']>0,'Actual C1 original graph/registry binding')
    require(all(lb['checks'].values()),'Actual C1 constructor identities')
    require(lp['schema']=='MathScope.N6.ActualC1NativeRegularityProof/1' and lp['originalProducerBindingExecuted'],'Actual C1 native theorem execution')
    require(lp['sourceRows'][0]['sha256']==LOOP and all(v['sourceBytesUnchanged'] for v in lp['sourceRows']),'Same literal native implementation')
    require(lp['actualScalarASTCheck']['sourceScalarSHA256']==lb['scalarVariance']['sha256'],'Same scalar variance AST')
    require(lp['actualScalarASTCheck']['actualMeanRatioAndSecondDerivativeIndependentlyCompared'],'Independent actual scalar identities')
    require(all(lp['negativeControls'].values()),'Native adverse controls')
    require([v['name'] for v in lp['actualNativeDefinitions']]==['ActualC1VarianceRoot','ActualC1CircleInverseLift'],'Same two actual roots')
    require([v['body'] for v in lp['actualNativeDefinitions']]==[v['body'] for v in lb['monotoneDefinitions']],'Same two actual native bodies')
    require(env['schema']=='MathScope.N6.ActualPreloopSourceEnvelope/1','Actual entire rectangle proof')
    for name in ['natural','natural-radial','b26','b34','b8','loop-binding','diagnostics']:same_hash(env,'inputSHA256',name,digests)
    require(env['actualCumulativeMomentsUsed'] and not env['referenceSubstitutedForActualMoments'],'Actual cumulative moments')
    require(not env['p2IdentifiedWithEEta'],'Literal actual source p2 retained')
    bounds=env['actualSourceBounds']
    require(bounds['E']=='0<E<CSelected^2' and bounds['a']=='0<a<CSelected^2','Actual positivity throughout original rectangle')
    require(bounds['inverseA']=='<CSelected^122<sourceEnvelopeS','Actual inverse-a bound')
    require(bounds['vs']=='<CSelected^192<sourceEnvelopeS','Actual vs bound')
    require(bounds['absP2']=='<CSelected^220<sourceEnvelopeS','Actual p2 bound')
    require(col['schema']=='MathScope.N6.ActualC1EndpointCollars/1' and col['fixedDefinitionSHA256']==FIXED,'Actual endpoint theorem')
    for name in ['natural','radial','join','b26-binding','loop-binding']:
        same_hash(col,'inputSHA256',name,dict(digests,radial=digests['natural-radial']))
    require(col['provedActualCollars']['leftVsMinus2Lower']=='1/128>S^-1>loopDelta','Actual left collar')
    require(col['provedActualCollars']['rightVsMinus2']=='2lambda>S^-1>loopDelta','Actual right collar')
    require(all(col['independentExactChecks'].values()),'Actual collar inequalities')
    params=raw['fullNativePayloads']['fixed']['source']['parametersExactExpressions']
    require(params['radialFrequencyN']=={'sum':[{'integer':1},{'ceil':{'power':[{'ref':'C12EnvelopeR'},50]}}]},'Original finite N retained')
    require(params['C12EnvelopeR']=={'exp':{'power':[{'ref':'sourceEnvelopeS'},256]}},'Original finite R scale')
    require(lb['checks']['literalZeroMeanPrimitiveBodies'] and lb['checks']['literalFiniteNPhaseAndC12Bodies'],'Literal original A/B and C12 modulation')
    return {'sameAuthenticatedOriginalDefinitions':True,'actualPregluingCInfinityAndPositive':True,
      'allOriginalC1AnalyticPremisesDischargedByActualProofs':True,
      'actualC1VarianceAndLiftRootsCInfinity':True,'actualPeriodOneZeroMeanPrimitivesCInfinity':True,
      'actualRadialZeroExtensionCInfinity':True,'actualFiniteNC12FieldsCInfinityAndEPositive':True}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    names=['natural','natural-radial','b26','b34','b8','join','b26-binding','loop-binding','loop-proof','envelope','collars','diagnostics']
    for name in names:p.add_argument('--'+name,type=Path,required=True)
    p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    paths={name:getattr(a,name.replace('-','_')) for name in names}
    raw={name:path.read_bytes() for name,path in paths.items()}
    data={name:json.loads(value) for name,value in raw.items()}
    digests={name:hashlib.sha256(value).hexdigest() for name,value in raw.items()}
    conclusions=validate(data,digests)
    # A prior successful receipt cannot be silently combined with changed inputs.
    bad={**digests,'b8':'0'*64}
    try:validate(data,bad)
    except AssertionError:pass
    else:raise AssertionError('Accepted changed actual B8 proof input')
    result={'schema':'MathScope.N6.ActualC1C12RegularityComposition/1',
      'fixedDefinitionSHA256':FIXED,'sourceLoopSHA256':LOOP,'inputSHA256':digests,
      'provedActualConclusions':conclusions,
      'actualDomain':{'eta':'[-33/32,33/32], with an open neighborhood',
        'slowRadius':'Original [loopILeft,loopIRight], with endpoint neighborhoods',
        'phase':'Every real phase, with original period one'},
      'actualModulation':{'N':'Unchanged original 1+ceil(C12EnvelopeR^50), a finite positive integer',
        'phase':'N log X','Enew':'E exp(A(X,eta,N log X)/N)>0',
        'Unew':'U+B(X,eta,N log X)/N'},
      'changedActualB8ReceiptRejected':True,
      'proof':'ACTUAL_C1_C12_REGULARITY_COMPOSITION_KO.md',
      'notClaimed':['Post-C12 a>0 and vs>2 or cone conditions','Genuine later I1/I2 small-root boxes','Full final g21/pressure-J regularity','All original Guard/Jet/PDE obligations discharged'],
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0,'newLeanExecution':False}
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'actualC1FullRectangleRegularity':True,'actualFiniteNC12PositiveAndSmooth':True,'newOriginalDischarged':0}))

if __name__=='__main__':main()
