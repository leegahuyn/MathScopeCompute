"""Compose actual completed-leading and frozen-frame domains, no row closure."""
import argparse,hashlib,json
from pathlib import Path

FIXED='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'

def require(value,message):
    if not value:raise AssertionError(message)

def full(rec):return rec.get('fullDefinition',rec)

def actual_boxes(i1,i2):
    require(i1['schema']=='MathScope.N6.ActualI1TrueDebtContraction/1','Actual I1 theorem')
    require(i2['schema']=='MathScope.N6.ActualI2TrueHeatDebtContraction/1','Actual I2 theorem')
    require(i1['actualSourceProofInputsComposed'] and i2['actualSourceProofInputsComposed'],'Arithmetic-only input cannot discharge actual root existence')
    require(i1['sameActualI1Root']['existsUniqueInOriginalBox'],'Genuine actual I1 box')
    require(i1['sameActualI1Root']['isCInfinityOnOpenEtaNeighborhood'],'Actual I1 parameter regularity')
    require(i2['sameActualI2Root']['existsUniqueInOriginalBox'],'Genuine actual I2 box')
    require(i2['sameActualI2Root']['isCInfinityForAbsEtaStrictlyLessThanOne'],'Physical interior actual I2 regularity')
    require(i2['sameActualI2Root']['hasContinuousOneSidedEtaJetsAtBothEndpointsAtEveryFixedOrder'],'Actual I2 endpoint jets')
    require(not i1['originalI1RadiusAssumedAsExistenceEvidence'] and not i2['originalI2RadiusAssumedAsExistenceEvidence'],'Radius metadata used as existence evidence')
    require(not i2['negativeZExtensionAsserted'] and not i2['openNeighborhoodBeyondEtaEndpointsAsserted'],'Nonphysical heat extension')
    require(not i1['actualDebtValueReplacedByUpperBoundOrZero'] and not i2['actualHeatDebtValueReplacedByUpperBoundOrZero'],'Actual debt replaced')
    for rec in (i1,i2):
        require(rec['independentExactBounds']['originalRootRadius']=='1/1000000','Original root radius')
        require(rec['independentExactBounds']['imageStrictlyInsideOriginalBox'] and rec['independentExactBounds']['contractionStrictlyBelowQuarter'],'Actual inclusion and uniqueness')

def validate(d,h):
    post,outer,i1,i2,ib,jb,repair,frame,stream,payload=(d[k] for k in ['post-c12','outer','i1','i2','i1-binding','i2-binding','repair','frame','stream-binding','payload'])
    require(post['schema']=='MathScope.N6.ActualPostC12ShearGap/1','Actual postC12 theorem')
    require(post['fixedDefinitionSHA256']==outer['fixedDefinitionSHA256']==FIXED,'Same completed-leading source')
    require(post['inputSHA256']['payload']==h['payload'],'Same postC12 source payload')
    require(outer['inputSHA256']['payload']==h['payload'],'Same original outer payload')
    require(all(post['independentExactChecks'].values()) and all(outer['independentActualAlgebra'].values()) and all(outer['independentUniformInequalities'].values()),'Actual source algebra/inequalities')
    require(post['provedActualConclusions']['anewLower']=='(1/2)*vTarget/(1+t^2)>0','Actual postC12 positive a')
    require(post['provedActualConclusions']['vsnewLower']=='2+loopDelta/16','Actual postC12 positive growth gap')
    require(outer['schema']=='MathScope.N6.ActualOuterRootAndHeatDomains/1','Actual outer theorem')
    require(outer['provedActualConclusions']['angularE']=='positive, a>2+lambda','Actual angular shear')
    require(outer['provedActualConclusions']['terminalHeatE']=='positive, a>2+h/2','Actual heat shear')
    require(outer['provedActualConclusions']['pulseAmplitude']=='positive real C-infinity, actual amp0<-3/32,amp2>0','Actual pulse radical domain')
    actual_boxes(i1,i2)
    require(i1['inputSHA256']['binding']==h['i1-binding'],'Same actual I1 body')
    require(i2['inputSHA256']['binding']==h['i2-binding'] and i2['inputSHA256']['i1']==h['i1'] and i2['inputSHA256']['i1-binding']==h['i1-binding'],'Same actual I2 dependency chain')
    require(i1['inputSHA256']['c1']==post['inputSHA256']['composition'],'Same actual finite-N C12 functions')
    require(i2['inputSHA256']['heat']==outer['inputSHA256']['heat'],'Same actual full heat factor')
    require(ib['schema']=='MathScope.N6.ActualI1TrueDebtSourceBinding/1','Original I1 constructor')
    require(jb['schema']=='MathScope.N6.ActualI2TrueHeatDebtSourceBinding/1','Original I2 constructor')
    for b in (ib,jb):
        require(b['sourceBytesUnchanged'] and b['registryCompared'] and b['fixedDefinitionCompared'] and b['diagnosticOverlap']>0,'Original registry/fixed/prefix comparison')
        require(all(b['checks'].values()) and all(b['strictNegativeControls'].values()),'Exact original source body check')
        require(b['sourceHeaderSHA256']==HEADER,'Same original source header')
    require(jb['checks']['literalActualFinalLeadingFAndU'],'Literal final leading F/U binding')
    require(jb['actualI1QuadraticDefinition']==ib['actualQuadraticDefinition']==i1['actualOriginalQuadraticDefinition'],'Same I1 actual root')
    require(jb['actualQuadraticDefinition']==i2['actualOriginalQuadraticDefinition'],'Same I2 actual root')
    require(repair['schema']=='MathScope.N6.ActualRepairShearPreservation/1','Actual repair shear theorem')
    require(repair['actualSourceFormulaBindingsComplete'] and repair['actualBaseIdentitiesCheckedForBothPatches'],'Fresh actual repair body comparison')
    require(repair['sourceHeaderSHA256']==frame['sourceHeaderSHA256']==HEADER,'Same actual repair/frame source')
    require(full(repair['actualQuadraticDefinitions']['1'])==ib['actualQuadraticDefinition'] and full(repair['actualQuadraticDefinitions']['2'])==jb['actualQuadraticDefinition'],'Actual repair roots bound to actual existence theorems')
    ar=repair['independentRationalPreservationCertificate']
    require(ar['rootBoxRadius']=='1/1000000' and ar['strictlyBelowHalf'],'Original repair quantitative shear preservation')
    require(all(v['rejected'] for v in repair['strictSourceNegativeControls']),'Actual repair adverse source controls')
    require(frame['schema']=='MathScope.N6.ActualFrozenFrameConditionalDomains/1','Actual frozen frame algebra theorem')
    require(frame['freshMatrixAncestryVerified'],'Only compact frame diagnostics cannot prove original matrix ancestry')
    require(all(frame['exactAlgebraChecks'].values()) and all(v['rejected'] for v in frame['strictNegativeControls']),'Actual frame algebra and branches')
    roots=jb['actualCompletedLeadingRoots'];defs=frame['actualCompletedLeadingDefinitions']
    require(roots['F']==full(defs['expression:2'])['body'] and roots['U']==full(defs['expression:3'])['body'],'Same completed leading base F/U in frozen frame')
    require(stream['schema']=='MathScope.N6.ActualOrderOnePrimitiveBinding/1','Actual complete leading stream binding')
    require(stream['sourceHeaderSHA256']==HEADER and stream['diagnosticsSHA256']==h['payload'],'Same original leading stream graph')
    require(stream['sourcePaperSHA256']=='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f','Same actual source paper')
    require(stream['diagnosticOverlap']>0 and all(stream['exactOriginalBindings'].values()) and all(stream['strictNegativeControls'].values()),'Original stream constructor/fixed/prefix comparison')
    require(all(c['pass'] for c in stream['leadingStream']['checks']),'All actual primitive histories and branch equations')
    for key in ('actualGlobalLeadingMassPrimitiveIdentity','actualGlobalLeadingStreamReconstruction','actualLeadingContinuityIdentity'):
        require(stream['leadingStream']['scope'][key],'Actual leading stream source identity '+key)
    sr=stream['leadingStream']['sourceRootBindings']
    require(sr['actualGlobalM0']==roots['M'] and sr['actualGlobalU0']==roots['U'] and sr['actualGlobalv0']==roots['v'],'Same actual M/U/v primitive roots')
    require(all(stream['actualLeadingRoots'][key]==roots[key] for key in ('U','M','V','v','Xv')),'Same whole leading axial source roots')
    require(stream['originalExactAlgebra']['continuity']['pass'],'Original exact radial-stream continuity algebra')
    require(frame['actualChartChainRule']['radialChainFactorExactly2X'] and frame['actualChartChainRule']['axialChainFactorExactlySqrt2X'],'Exact actual physical chart chain rule')
    require(payload['fullNativePayloadSHA256']['fixed']==FIXED,'Authenticated source payload identity')
    return roots

def main():
    p=argparse.ArgumentParser(description=__doc__)
    names=['post-c12','outer','i1','i2','i1-binding','i2-binding','repair','frame','stream-binding','payload']
    for n in names:p.add_argument('--'+n,type=Path,required=True)
    p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    paths={n:getattr(a,n.replace('-','_')) for n in names};raw={n:v.read_bytes() for n,v in paths.items()}
    d={n:json.loads(v) for n,v in raw.items()};h={n:hashlib.sha256(v).hexdigest() for n,v in raw.items()}
    roots=validate(d,h)
    # A declaration or stale root receipt cannot silently replace actual I2.
    mutated={**d['i2'],'actualSourceProofInputsComposed':False}
    try:actual_boxes(d['i1'],mutated)
    except AssertionError:pass
    else:raise AssertionError('Accepted arithmetic-only actual I2 receipt')
    try:validate(d,{**h,'i1-binding':'0'*64})
    except AssertionError:pass
    else:raise AssertionError('Accepted changed actual I1 source binding')
    changed_stream={**d['stream-binding'],'actualLeadingRoots':{**d['stream-binding']['actualLeadingRoots'],'M':-1}}
    try:validate({**d,'stream-binding':changed_stream},h)
    except AssertionError:pass
    else:raise AssertionError('Accepted different actual leading stream root')
    result={'schema':'MathScope.N6.ActualCompletedLeadingFrozenApplication/1','fixedDefinitionSHA256':FIXED,
      'sourceHeaderSHA256':HEADER,'inputSHA256':h,'actualCompletedLeadingRoots':roots,
      'provedActualCompletedLeading':{'EPositive':'For every X>0 and abs(eta)<=1, with the original physical heat convention',
        'regularity':'F0,U0,M0,V0/X are C-infinity for X>=0 and abs(eta)<1; all fixed one-sided eta jets extend to eta=+-1',
        'radialMomentIdentity':'partial_X M0=U0; actual V0/X uses this same M0 and its eta derivative',
        'axis':'Original natural analytic-X expression and common eta tube are retained before loopILeft',
        'axialSupport':'U0=M0=V0=0 after the original Xv',
        'annularGrowthDomain':'Xa<=X<=Xb, abs(eta)<=1',
        'annularA':'positive','annularVs':'strictly greater than2',
        'gapCases':['Inner actual kappa collar:1/128','Original C12 loop:loopDelta/16','Power/pulse/interpolation:2lambda','Actual I1/I2 patches:3lambda/2','Angular:lambda','Steepen/flatten/wait:2h','Terminal heat:h/2']},
      'provedActualFrozenApplication':{'domain':'Only representatives selected from an original nonempty physical active mesh box with T>=0; Xa<Xrep<Xb, abs(etarep)<1, Trep>0, 1/2<srep<2',
        'sameActualBaseProfilesUsed':True,'actualSourceRadicalsAndDivisions':['F0>0','gabs>0','lambda0>0','c0<0','Bs>0','Ls>0'],
        'allUnchangedFiniteBandsAndFrozenLabels':True,'sameMatrixAncestryVerified':True},
      'negativeControls':{'arithmeticOnlyI2ReceiptRejected':True,'changedActualI1BindingRejected':True,'changedActualLeadingStreamRootRejected':True},
      'proof':'ACTUAL_COMPLETED_LEADING_DOMAINS_KO.md',
      'excluded':['Nonphysical negative heat argument or abs(eta)>1','Arbitrary unguarded representative/caller values','Whole covariance/weight cone and determinant positivity','Full final g21 pressure-J application or row closure'],
      'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0,'newLeanExecution':False}
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'actualCompletedLeadingPhysicalDomains':True,'actualActiveRepresentativeFrameDomains':True,'newOriginalDischarged':0}))

if __name__=='__main__':main()
