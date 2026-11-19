"""Exact original Sigma flux path and conditional local norm transfer audit."""
from argparse import ArgumentParser
from fractions import Fraction as F
from hashlib import sha256
from importlib.util import module_from_spec,spec_from_file_location
from pathlib import Path
import json
import sympy as S

if not __debug__:raise RuntimeError('Exact proof assertions must remain enabled.')
PINS={'checker':'9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee',
 'primary':'23599487a19b0570eb9641567a0e64ce7de7bf9a8583a5203f15dcfa84cb8a27',
 'sameFamily':'dab937b981df7eeca4e72338d69e9969ed435e7e1590a4b146f6ae1043b0a937',
 'meanPath':'e366138903bd4ba773ac898707a0a38782cc00ace2d570733668e93760d1dc59',
 'meanLongitudinal':'778a1058ffff15e9f80c3066645218b51b4ce52aa75514172008e05150ec94b9',
 'meanTransverse':'121c25bb1dc783bec4004184e829db082d3cf074a6698a2004a011c6ea6863c8'}
PINS['liveBinder']='fa0e60771796b77a1fe37c17a4fe6f9271eae156dd6c1ba73ac2297990f9b20b'
SOURCE_PINS={'source-global-updated-mean-stress.mjs':'4e91089ebd54aff4b2b1cd8479aef94dc255f14320ccf08f2cb60cf15c4b0ff4',
 'source-updated-mean-stress.mjs':'bbe4e3d87e79a770590a94bc75a8ac0f36f69f4338cab5739340a637a42bfbf5',
 'source-full-mean-equations.mjs':'2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76',
 'source-global-current.mjs':'93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760',
 'source-global-signed.mjs':'4078e65989da153d57a36672645bad13ac0b4f2894c5c77b88208fc1fc25ceb1',
 'source-global-forced-current.mjs':'b41f298702238cf6170c16f31362e9429ebc659ca2a999d8d85cf2159ae01be3',
 'source-updated-mean-pressure.mjs':'6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07',
 'source-primary-class-majorants.mjs':'40b3f1220b7ad1b9b05a11ae1378c864351e77e8efe7134ae1b78921fbab47ea',
 'source-global-band.mjs':'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
 'source-initialized-angular.mjs':'655809f64af15daa67260ae4207ceac3d3090816086e9920027eedda2ccf24b7'}

def load(path,key):
    data=path.read_bytes();assert sha256(data).hexdigest()==PINS[key],key
    return json.loads(data)

def main():
    p=ArgumentParser(description=__doc__);p.add_argument('goal_next',type=Path)
    p.add_argument('source_bundle',type=Path);p.add_argument('output',type=Path)
    a=p.parse_args();assert not a.output.exists()
    cp=a.goal_next/'first-scale-closure/check_first_scale_closure.py'
    assert sha256(cp.read_bytes()).hexdigest()==PINS['checker']
    spec=spec_from_file_location('pinned_source_reader',cp);m=module_from_spec(spec);spec.loader.exec_module(m)
    text={}
    for name,pin in SOURCE_PINS.items():
        raw=m.git_blob(a.goal_next.parents[2],'research-ide/mathscope-m3/navier/'+name)
        assert sha256(raw).hexdigest()==pin,name;text[name]=raw.decode()
    def clauses(name,*need):
        for clause in need:assert clause in text[name],(name,clause)
    binder_path=a.goal_next/'primary-forced-join/active-n3-c5-binding/bind_live_primary_c5.mjs'
    assert sha256(binder_path.read_bytes()).hexdigest()==PINS['liveBinder']
    binder=binder_path.read_text(encoding='utf8')
    for clause in ('assert.equal(G.simultaneousSubstitute(pull.root, f.path.Y, f.path.Hw), pull.mapped);',
      'assert.equal(pull.mapped, f.bound.originalSource[j][part]);',
      'assert.equal(system.variable, f.path.w);','assert.equal(system.length, old.sourcePulseLength);'):
        assert clause in binder,clause
    clauses('source-global-band.mjs',
      "leadingFields={F:G.share(G.mul(multipliers.F,atProfile(src.records[0].global.F)),slow,'ActualCommonBandLeading_F')",
      'F0=atRep(leadingFields.F),FR0=atRep(G.derivative(leadingFields.F,R)),GR0=atRep(G.derivative(leadingFields.G,R))',
      'phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))',
      'frame=actualMovingPulseFrame(G,{F:fields.F,FR:G.derivative(fields.F,R),GR:G.derivative(fields.G,R),R,epsilon,k,p,pz,x0,v,Ls,u,c0,lambda0,HR,HZ,sign})',
      'qActual=G.mul(Q,s)')
    clauses('source-initialized-angular.mjs',
      'factor=G.div(ci,G.pow(Tg,delta)),difference=G.sub(w,lift.v),Hw=Y.map((y,j)=>G.add(y,G.mul(factor,difference,vt[j])))',
      "originalOperatorFormula:'H_w=Y+(ci_label/Tg^delta)*(w-v(Y))*v_t'")
    clauses('source-global-forced-current.mjs',
      'velocity:source.mean.stages.moments.velocity,covariance,stress:pressure.residual.fullOriginalStress',
      'fullCurrentCovariance:covariance')
    clauses('source-global-updated-mean-stress.mjs',
      'sameVelocity=Object.keys(mean.stages.moments.velocity).every(name=>stage.velocity[name]===mean.stages.moments.velocity[name])',
      'stage:forced.mean,assertInput:assertGlobalForcedCurrent',
      'theoremReducedWeightedWhole:G.zero,theoremReducedCutoff:G.zero',
      'sourceTheoremsAppliedToConstructedOperands:true,rawIntegralNodesPreserved:true')
    clauses('source-updated-mean-stress.mjs',
      'G.mul(epsilon,G.derivative(G.add(Jz,G.mul(cRho,P)),Z))',
      'stage.mean.Ez===G.add(raw.Ez,G.mul(epsilon,pZ))',
      'value=G.neg(G.div(compact,G.pow(R,weight)))',
      'source=G.sub(mean,G.mul(sigma[j],targets[j]))')
    clauses('source-global-current.mjs',
      'stressScale=G.mul(epsilon,g.power(g.s,G.neg(G.add(band.constants.A,q(1,2)))))',
      'fullOriginalStress=[background.normalizedBodies.Ttheta,background.normalizedBodies.Tz].map(x=>G.mul(stressScale,at(x)))')
    clauses('source-updated-mean-pressure.mjs','source=G.sub(gr,G.mul(rho,P))',
      'G.mul(G.derivative(chi,Z),integrals.whole)',
      'fullReconstructionEquation:\'p_m=T0(g_r-rho*P), after recomputing g_r and P from this complete updated velocity.\'')
    clauses('source-global-signed.mjs',
      'amplitude=f.t.map(x=>G.mul(G.sqrt(epsilon),deltaA,band.cutoffs.chi,band.cutoffs.psi,x))',
      'rawPotential=cross(G,f.frame.n,weighted).map(x=>G.div(x,G.mul(k,f.frame.nSquared)))')
    clauses('source-primary-class-majorants.mjs',
      'const G=target.G,PG=current.G',
      'K=G.maximum(q(1n<<128n),backgroundRow.B_m,G.pow(W,m+3),G.inv(dstar),G.inv(G.sqrt(cy)),haarLengthUpper,',
      "coefficientConstants.maximum,...targetRows.map(r=>r.N_m)")

    # Independent differential-polynomial check of the exact full-mean source fluxes, before Haar.
    r,z,t,y0,y1=S.symbols('R Z T Y0 Y1');eps,ci,vr0,vr1,vt0,vt1=S.symbols('epsilon ci vr0 vr1 vt0 vt1')
    coords=(r,z,t,y0,y1)
    fn=lambda name:S.Function(name)(*coords)
    slow=lambda name:S.Function(name)(r,z,t)
    b,V,G0=map(slow,('b','V','G0'));beta,v,gamma=map(fn,('beta','v','gamma'))
    wrt,wrz,wtz,wzz,wrr,wtt=map(fn,('Wrt','Wrz','Wtz','Wzz','Wrr','Wtt'))
    st,sz=map(slow,('stress_theta','stress_z'));pressure=fn('pressure');aa=S.Function('a')(r)
    LL=lambda f:vr0*S.diff(f,y0)+vr1*S.diff(f,y1)
    NN=lambda f:vt0*S.diff(f,y0)+vt1*S.diff(f,y1)
    DR=lambda f:S.diff(f,r)+aa*LL(f)
    DZ=lambda f:eps*S.diff(f,z)
    TM=lambda f:-eps*S.diff(f,t)+ci*NN(f)
    DE=lambda f,e:DR(f)+e*f/r
    lap=lambda f:DR(DR(f))+DR(f)/r+DZ(DZ(f))
    lapv=lambda f:lap(f)-f/r**2
    Etheta=TM(v)+DE(b*v+beta*V+beta*v+wrt,2)+DZ(G0*v+V*gamma+gamma*v+wtz)-eps*lapv(v)-DE(st,2)
    Ez=TM(gamma)+DE(b*gamma+beta*G0+beta*gamma+wrz,1)+DZ(2*G0*gamma+gamma**2+wzz+pressure)-eps*lap(gamma)-DE(sz,1)
    FRtheta=r**2*(b*v+beta*V+beta*v+wrt-st)-eps*(r**2*DR(v)-r*v)
    FRz=r*(b*gamma+beta*G0+beta*gamma+wrz-sz)-eps*r*DR(gamma)
    FZtheta=r**2*(G0*v+V*gamma+gamma*v+wtz)-eps*r**2*DZ(v)
    FZz=r*(2*G0*gamma+gamma**2+wzz+pressure)-eps*r*DZ(gamma)
    defects=[S.expand(r**2*Etheta-TM(r**2*v)-DR(FRtheta)-DZ(FZtheta)),
      S.expand(r*Ez-TM(r*gamma)-DR(FRz)-DZ(FZz))]
    assert defects==[0,0]
    # Fixed mean/background/stress: only covariance and its reconstructed pressure change after Forced.
    dwrt,dwrz,dwtz,dwzz,dwrr,dwtt,dp=map(fn,('dWrt','dWrz','dWtz','dWzz','dWrr','dWtt','dp'))
    changes={wrt:wrt+dwrt,wrz:wrz+dwrz,wtz:wtz+dwtz,wzz:wzz+dwzz,wrr:wrr+dwrr,wtt:wtt+dwtt,pressure:pressure+dp}
    gr=-TM(beta)-DE(2*b*beta+beta**2+wrr,1)-DZ(b*gamma+G0*beta+beta*gamma+wrz)+(2*V*v+v**2+wtt)/r+eps*lapv(beta)
    linear_defects=[S.expand((gr.xreplace(changes)-gr-(-DE(dwrr,1)-DZ(dwrz)+dwtt/r)).doit()),
      S.expand((Etheta.xreplace(changes)-Etheta-DE(dwrt,2)-DZ(dwtz)).doit()),
      S.expand((Ez.xreplace(changes)-Ez-DE(dwrz,1)-DZ(dwzz+dp)).doit())]
    assert linear_defects==[0,0,0]
    cr=S.Function('c_rho')(z,t);PP=S.Function('P')(z,t);J=S.Function('Jz')(z,t)
    target=eps*S.diff(J+cr*PP,z)
    wrong=eps*(S.diff(J,z)+cr*S.diff(PP,z))
    assert S.expand(target-wrong)==eps*PP*S.diff(cr,z)
    assert (target-wrong).subs({cr:z,PP:S.Integer(1),J:S.Integer(0)}).doit()==eps

    primary=load(a.source_bundle/'primary-c5-native.json','primary')
    report=load(a.source_bundle/'same-family-mode-two.json','sameFamily')
    base=load(a.goal_next/'whole-k-annular-pressure-lower/mean-path-longitudinal.json','meanPath')
    longitudinal=load(a.goal_next/'primary-forced-weights/higher-mean/mean-longitudinal.json','meanLongitudinal')
    transverse=load(a.goal_next/'primary-forced-weights/higher-mean/mean-transverse-c3.json','meanTransverse')
    assert primary['normRoot']==report['normRoots']['K']==18310069
    assert primary['backgroundRow']=={'derivativeOrder':6,'backgroundDerivativeOrder':8,'B_m':14220496,'Bnorm':14220485,'C_mPlusTwo':14220475,'Lmax':14220489,
      'sourceMeaning':'A source-only base for the original all-order moving matrix/physical jet ledger; no matrix or Gaussian source binding is asserted here.'}
    assert len(report['full']['rows'])==20 and all(not row['forcedOutputClassCertified'] for row in report['full']['rows'])
    assert len(base['nodes'])==8438
    assert longitudinal['scope']['fullMeanC3Bounded'] is False and longitudinal['scope']['activeWholeKFamilyAttached'] is False
    assert transverse['status']=='VERIFIED_ARCHIVED_MEAN_TRANSVERSE_C3_CONDITIONAL_POSITIVE_BOUNDS'
    # Exact epsilon ledger; derivative/weighted coefficients are separate hypotheses.
    signed=[{'group':name,'epsilonPower':expr} for name,expr in
      [('A','gammaSigma'),('G_A','gammaSigma-1/2'),('U','gammaSigma-1/2'),('G_U','gammaSigma-1')]]
    assert F(1,4)-1==F(-3,4) and min(F(1,2)+F(1,8),2*F(1,8),F(1))==F(1,4)
    result={'schema':'MathScope.N7.OriginalSigmaFluxAndLocalTransferBoundary/1',
      'status':'VERIFIED_EXACT_SOURCE_FLUX_IDENTITIES_AND_CONDITIONAL_TRANSFER_BOUNDARY',
      'fixedOriginalCommit':m.REFERENCE,'sourceSHA256':SOURCE_PINS,'inputSHA256':PINS,
      'actualSourceBinding':{'afterForcedMeanVelocity':'source.mean.stages.moments.velocity unchanged',
        'freshCovarianceAndPressureRetained':True,'all20ForcedOutputClassBoundsStillOpen':True,
        'sourceSigmaIsCompleteMeanResidualNotJustCovariance':True},
      'exactChecks':{'fullPreHaarWeightedFluxDefects':list(map(str,defects)),
        'fixedMeanCovarianceIncrementDefects':list(map(str,linear_defects)),
        'omitting_cRho_Z_times_P_isDetected':True},
      'reducedSigma':{'premises':['source smooth periodicity to remove Haar L/N derivatives',
        'source compact radial endpoint fluxes vanish','actual conservation and pressure compatibility reduce weighted whole source to zero',
        'fixed radial endpoints; retain full Jz+c_rho*P product'],
        'formula':'Sigma_j=R^(-e)*[-FRbar_j+epsilon*partial_T Integral_a^R(R^e*mean_u_j)-epsilon*partial_Z Integral_a^R FZbar_j+epsilon*partial_Z(M_j)*Integral_a^R rho]',
        'weights':[2,1],'mean_u':['v','gamma'],'M':['Jtheta','Jz+c_rho*P'],
        'radialFlux':{'theta':'R^2*(b*v+beta*V+beta*v+W_rtheta-stress_theta)-epsilon*(R^2*Dr(v)-R*v)',
          'z':'R*(b*gamma+beta*G0+beta*gamma+W_rz-stress_z)-epsilon*R*Dr(gamma)'},
        'axialFlux':{'theta':'R^2*(G0*v+V*gamma+gamma*v+W_thetaz)-epsilon^2*R^2*partial_Z(v)',
          'z':'R*(2*G0*gamma+gamma^2+W_zz+pressure)-epsilon^2*R*partial_Z(gamma)'},
        'originalStress':'epsilon*s^(-A-1/2)*actual(Ttheta,Tz)',
        'pressurePaths':['epsilon*partial_Z of axial pressure flux','epsilon*partial_Z(Jz+c_rho*P)'],
        'pressureCutoffDerivative':'Raw p_Z retains -chi_Z*wholeSource; only its Haar/compatibility reduction may remove it.',
        'chiAndRhoMayDependOnZAndT':True,'newNegativeEpsilonPowerIntroducedByCorollary85':False},
      'covarianceVersusInitializedMean':{'exactAffineDecomposition':'Sigma_afterForced=Sigma_afterInitializedMean+L_actual(deltaW)',
        'deltaGr':'-De(deltaW_rr,1)-epsilon*partial_Z(deltaW_rz)+deltaW_thetatheta/R',
        'deltaEtheta':'De(deltaW_rtheta,2)+epsilon*partial_Z(deltaW_thetaz)',
        'deltaEz':'De(deltaW_rz,1)+epsilon*partial_Z(deltaW_zz+deltaPressure)',
        'deltaPressure':'same linear T0 applied to deltaGr-rho*deltaP',
        'initialMeanStressBoundStillRequired':True,'forcingBoundsAloneSuffice':False},
      'signedEpsilonLedger':signed,'signedThreshold':{'requiredFor_epsilon_minus_3_over_4':'gammaSigma>=1/4 plus separately bounded tiny phase losses',
        'sufficientWaveExponentForCovarianceOnly':'alphaForced>=1/8 if original Primary>=epsilon^(1/2) and all same-source covariance products are bounded',
        'extraObligations':['weighted Sigma derivatives through spatial order2','original H/y/reciprocal frame derivatives',
          'initialized mean/background/stress and pressure/moment bounds in the fluxes'],
        'newSqrtOfSigmaTaken':False},
      'localPrimaryRebase':{'actualKSourceRoot':18310069,'currentFieldGraphDependsOnThatNormRoot':False,
        'KFormula':'max(2^128,B6,W_prop^8,dstar^-1,cy^-1/2,Haar,Ccoeff7,N0..N6)',
        'B6Formula':'max(Bnorm,Cslow8,8!,Lmax,2)',
        'Cslow8Root':14220475,'B6Root':14220496,'coefficientMaximumRoot':18310062,
        'targetRoots':[17759538,17759550,17759597,17759730,17760036,17760648,17761755],
        'validTransfer':'Re-apply the finite degree proof to SAME source with an external local base dominating every primitive on its full actual path closure.',
        'invalidTransfer':'Infer a smaller bound merely by substituting Kloc into the existing Kglobal^p inequality.',
        'requiredClosure':['live slow R/Z/T points; full pulse w in[0,Ls] leaves these fixed',
          'frozen reference F0/FR0/GR0 are leading-only in actual source-band; no full n4 C8 jet at reference is needed for these three values',
          'every separately used target/cutoff/normal primitive and native own/reference path',
          'complete shifted radial envelope for mean and pressure, with label changes and smooth flat joins'],
        'existingPrivateClassSealReissued':False,'actualKNodeChanged':False},
      'liveVersusFrozenSourceAnchors':{
        'frozenLeadingValues':{'file':'source-global-band.mjs','constructor':'attachGlobalSourceBand',
          'sourceAnchors':['leadingFields from src.records[0].global.F/U','F0=atRep(leadingFields.F)',
            'FR0=atRep(derivative(leadingFields.F,R))','GR0=atRep(derivative(leadingFields.G,R))'],
          'meaning':'These three frozen reference values use leading-only fields; this statement is not a claim about arbitrary full fields evaluated at a representative.'},
        'liveFullCoefficientJets':{'file':'source-global-band.mjs','constructor':'actualMovingPulseFrame',
          'passedArguments':['F=fields.F','FR=partial_R fields.F','GR=partial_R fields.G','HR,HZ from phaseSpeed=p*fields.F+pz*fields.G'],
          'meaning':'Full background coefficient jets are evaluated at the live slow R/Z/T argument; representative and carrier labels are frozen before differentiating.'},
        'forcedPulsePath':{'file':'source-initialized-angular.mjs','constructor':'originalFixedLiftPulsePath',
          'formula':'H_w=Y+(ci_label/Tg^delta)*(w-v(Y))*v_t','substitutedCoordinates':['Y0','Y1'],
          'unchangedCoordinates':['R','Z','T','ell/reference parameters'],
          'fixedPhysicalScale':'qActual=Q*s(Z,T), unchanged by this Y-only path'},
        'all20SourceBinder':{'file':'primary-forced-join/active-n3-c5-binding/bind_live_primary_c5.mjs',
          'constructor':'bindForcedTemplate','checks':['actual native system variable=w','length=original Ls',
            'pull.root[Y:=H_w]=pull.mapped=f.bound.originalSource'],
          'all20ReceiptRowsRetained':True},
        'normProofVersusPhysicalMap':'The original C5 norm proof chooses a global B6 and K to cover every window. An external local proof may cover only the authenticated live path closure. The physical H_w map does not turn live full F/G jets into full representative jets. Native chart membership, all labels and shifted radial paths still need their own source transport.'},
      'meanPositiveProgramTransfer':{'archiveGraphSHA256':base['sourceSHA256'],'baseRecords':len(base['nodes']),
        'available':'full C2 mean positive programs and requested positive longitudinal derivatives; transverse C3 beta/gamma and positive-L subset',
        'pureSlowTotal_v_C3_Open':True,'activeN3FamilyBound':False,
        'firstDocumentedMissingRoute':'FiveMap v C3 -> fresh P/Jz C3 -> Temporal beta C4 -> T1 C5 -> Ez C5 -> Wrz slow7 plus L^2 loss input',
        'availablePotentialSlow7GivesFullCurlOnlyThroughSlow6':True,
        'localC8ReplacementAloneClosesThisRoute':False,
        'whatCanBeTransportedConditionally':'Existing polynomial positive programs on independently source-matched leaves, preserving epsilon valuations, fixed frame/normal/target inputs, same charts/native paths and actual radial/Fourier operators',
        'selectiveSpatialAlternative':'Exploit FiveMap target coefficients independent of R before differentiating; spatial/time specific missing jets need an actual derivation, not a total-order C3 assertion.',
        'archivedRemainingLeaves':transverse['remainingC2MeanWaveMeanLeaves']},
      'scope':{'actualStageCapEnclosed':False,'newFinalGateClaim':False,'newArtifactDownloaded':False,
        'localLeanCompilation':False,'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}}
    a.output.write_bytes((json.dumps(result,indent=2)+'\n').encode())
    print(json.dumps({'status':result['status'],'exactDifferentialDefects':5,'allZero':True,
      'pressureProductControl':'PASS','ForcedSystems':20,'actualStageCapsClosed':0}))

if __name__=='__main__':main()
