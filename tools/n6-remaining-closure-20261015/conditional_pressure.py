"""Exact source binding for a sufficient anisotropic regularity lemma.

The finite compactness/Leibniz proof is in PROOF_KO.md. This module does not
assert that the original complete_gr satisfies that regularity hypothesis.
"""
from remaining_closure import require, exact_node, sha, R,Z,T,N,Y0,Y1,BINDER,CaptureAudit

def verify(p,g,reg,remaining_guard_rows):
    expected={
      247:('actual_opaque_value',[3615202,'m3_aux_expression_partial']),
      248:('add',[246,247]),249:('definite_integral',[248,232,132,2]),
      254:('definite_integral',[248,232,132,229]),
      245:('multiply',[107,244]),246:('multiply',[8,245]),
      244:('multiply',[231,243]),255:('multiply',[253,254]),
      256:('multiply',[8,255]),257:('add',[249,256]),8:('rational',['-1','1'])}
    for i,(op,a) in expected.items():require(p[i]=={'op':op,'args':a},'Changed full pressure primitive scalar '+str(i))
    for i,op,a in [
      (3615048,'m3_aux_expression_partial',[-22,[N,R,Z,T,Y0,Y1],[0]*6]),
      (3615049,'definite_integral',[3615048,Y0,0,1]),
      (3615050,'definite_integral',[3615049,Y1,0,1]),
      (3615051,'m3_aux_expression_partial',[-23,[N,R,Z,T],[0]*4]),
      (3615053,'m3_aux_expression_partial',[-23,[N,3615052,Z,T],[0]*4]),
      (3615054,'definite_integral',[3615053,3615052,633710,633712]),
      (3615055,'m3_aux_expression_partial',[-24,[N,Z,T],[0]*3])]:exact_node(g,i,op,a)
    require(reg['expressionDefinitions'][22]['body']==3615050 and reg['expressionDefinitions'][22]['parameters']==[N,R,Z,T], 'Changed Haar defining body')
    require(reg['expressionDefinitions'][23]['body']==3615054 and reg['expressionDefinitions'][23]['parameters']==[N,Z,T], 'Changed P defining body')
    require(p[107]=={'op':'actual_opaque_value','args':[3615055,'m3_aux_expression_partial']},'Changed scalar P')
    # Source phase scale Psi and direction v do not depend on slow Z/T or the
    # fast coordinates. No differentiation of a floor-selected label is used.
    forbidden={Z,T,Y0,Y1,BINDER}
    phase=CaptureAudit(g,reg).run(635059,forbidden)
    direction=CaptureAudit(g,reg).run(623066,forbidden|{R})
    require(phase['forbiddenCaptureAbsent'] and direction['forbiddenCaptureAbsent'],'Phase has unreviewed moving slow input')
    theta_absence=CaptureAudit(g,reg).run(3614891,{622806})
    open_rows=[r for r in remaining_guard_rows if r['status']=='OPEN']
    observed={(r['originalGuard']['operand'],r['originalGuard']['variable']) for r in open_rows}
    expected={(i,v) for i in (249,254) for v in (2,6,7,5,3)}
    require(len(open_rows)==10 and observed==expected,'Remaining Leibniz family no longer matches the lemma')
    for r in open_rows:
        x=r['originalGuard']; require(x['body']==248 and x['binder']==232 and x['left']==132 and x['right']==(2 if x['operand']==249 else 229),'Changed compact integral source binding')
    return {
      'schema':'MathScope.N6.ConditionalAnisotropicPressureLemma/1',
      'sourceCompleteGr':{'registry':'expressionDefinitions:21','body':3614891,'parameters':[N,R,Z,T,Y0,Y1]},
      'sourceP':{'registry':'expressionDefinitions:23','body':3615054,'parameters':[N,Z,T], 'definition':'integral_[L,U] integral_[0,1]^2 g(rho,Z,T,y) dy drho'},
      'sourcePressureScalar':257,'movingIntegral':249,'wholeIntegral':254,'integrand':248,
      'phaseSource':635059,'phaseDirection':[1,623066], 'phaseCapture':phase, 'directionCapture':direction,
      'completeGrHasNoThetaCapture':theta_absence['forbiddenCaptureAbsent'],
      'thetaCaptureAuditNodes':theta_absence['sourceNodes'], 'thetaCaptureAuditIdSetSHA256':theta_absence['sourceNodeIdSetSHA256'],
      'targetOriginalGuardIDs':[r['id'] for r in open_rows],
      'sufficientRegularity':[
        'For each fixed admissible band and local (R,Z,T,Y), complete_gr and its partial derivatives in Z,Y0,Y1 are jointly continuous on a compact radial/slow/phase neighborhood containing both the shifted and unit-square averaging arguments.',
        'The original normalized bump and its Z derivative are continuous on the same compact radial/slow neighborhood (established primitive lemma).',
        'The actual phase is continuously differentiable for R>0 at fixed N (established primitive expression).'
      ],
      'notRequiredForTheseTenGuards':['A uniform constant over ALL bands','An explicit giant numerical norm','A radial derivative of complete_gr','All derivative orders of complete_gr','A T derivative of complete_gr'],
      'compactDerivativeBounds':{
        'P':'length(J)*M0','P_Z':'length(J)*MZ',
        'H_R':'max|Psi_prime|*(M_Y0+abs(v1)*M_Y1)',
        'H_Y0':'M_Y0','H_Y1':'M_Y1','H_theta':'0',
        'H_Z':'M_Z+B_Z*length(J)*M0+B0*length(J)*M_Z'},
      'transportOperator':'D=partial_R+Psi_prime(R)*(partial_Y0+v1*partial_Y1)',
      'conditionalIdentities':[
        'D H(R,rho,Z,T,Y)=0',
        'D integral_L^R H drho = H(R,R,Z,T,Y)',
        'D integral_L^U H drho = 0',
        'D p_correction = complete_gr(R,Z,T,Y)-normalized_bump(R,Z,T)*P(Z,T)-chi_prime(R)*integral_L^U H drho'
      ],
      'cutoffRemainderRetained':True,'actualCompleteGrRegularityProved':False,
      'allTenOriginalGuardsDischarged':False,'conditionalLemmaIsNotOriginalPdeProof':True}
