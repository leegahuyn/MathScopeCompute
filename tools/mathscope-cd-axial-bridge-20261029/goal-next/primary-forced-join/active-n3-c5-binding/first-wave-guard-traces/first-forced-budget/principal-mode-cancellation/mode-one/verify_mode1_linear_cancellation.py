"""Replay the complete actual mode-one source and isolate its leading cancellation."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json
import sys


FILES={
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'factor':'dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d',
    'frame':'56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d',
    'frameChecker':'38fdd2226e02fd4868f3c0eb48617bdf714fb80971a7001888daacf74d3d6fb9',
    'geometry':'e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291',
    'geometryChecker':'7bd56fcac3a23b33d10c6ba1cfe0a56004846ba76d5cd883f4bdd8104c0605b1',
    'primary':'a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244',
    'matrix':'e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36',
    'mean':'2d172188703c2ddb81925eae70fd91252f8df9a743b8ff96ba325a6ac7f9bd1a',
    'rawWeights':'836e8ed0b22ee3451f9ed3f09f176bf439fc05b5f9380fa58b08a3ba841efcc0',
    'cache':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'reader':'6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
    'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
}
R,Z,T,Y0,Y1=17732748,17732749,17732750,17745430,17745431
EPS=17732744
PARTS=('real','imaginary')
STREAM='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'


def read(path,key):
    raw=path.read_bytes()
    if path.suffix=='.py':
        raw=raw.replace(b'\r\n',b'\n')
    assert sha256(raw).hexdigest()==FILES[key],key
    return raw


def compare_chart(g, Exact, frame, geometry, c88, case, chart, defs):
    key=case['chart']
    form,coefs,ratios=geometry.choices(g,frame,Exact,c88,chart)
    eq=geometry.equal(form,Exact)
    e=form.a
    at=lambda i:form.val(i,False)
    scal=e.scalar
    indices={}
    fields={a['root']:a for a in case['rawJetAtoms']}
    named={d['name']:d for d in defs.values()}
    empty=e.zero,e.zero

    def add(*vectors):
        return tuple(e.add(*(v[i] for v in vectors)) for i in range(2))

    def mul_real(f,v):
        return tuple(e.mul(f,x) for x in v)

    def mul_i(f,v):
        return e.neg(e.mul(f,v[1])),e.mul(f,v[0])

    def field(name,directions):
        if name not in named:
            assert 'PrimaryPressure_' in name and name.endswith('_real')
            return e.zero
        d=named[name]
        parameters=d['parameters']
        multi=tuple(directions.count(axis) for axis in parameters)
        assert sum(multi)==len(directions),(name,directions,parameters)
        marker=(d['id'],multi)
        atom=indices.setdefault(marker,g.count+1+len(indices))
        return {((atom,1),):Q(1)}

    def atom_for_original(i):
        if i not in fields:
            return at(i)
        desc=fields[i]
        d=defs[desc['nativeDefinition']]
        expected=[21435327,21435332,21435334,21435315,Y0,Y1] if desc['role']=='mean' else d['parameters']
        assert desc['arguments']==expected
        marker=(d['id'],tuple(desc['orders']))
        atom=indices.setdefault(marker,g.count+1+len(indices))
        return {((atom,1),):Q(1)}

    tag=key.replace(':','_')
    wave=f'InitializedOriginalWave_{tag}'
    p_tag=f'InitializedOriginalPrimaryPressure_{tag}'
    u=lambda j,*axes:tuple(field(f'{wave}_{j}_{part}',axes) for part in PARTS)
    p=lambda *axes:tuple(field(f'{p_tag}_{part}',axes) for part in PARTS)
    tail=lambda j:(field(f'OriginalPrimaryPrincipalFlat_{tag}_{j}',()),e.zero)
    eps=at(EPS)
    a=coefs['radialFast']
    a_r=coefs['radialFastR']
    vr=coefs['vr1']
    vt=coefs['vt0']
    radius=coefs['invR']
    radius2=coefs['invR2']
    time=coefs['timeFast']
    k=(coefs['KNormalR'],coefs['KNormalTheta'],coefs['KNormalZ'])
    k_t=coefs['KPhaseTime']
    k_p=coefs['KCarrierP']

    def l(f):
        return add(f(Y0),mul_real(vr,f(Y1)))

    def ll(f):
        return add(f(Y0,Y0),mul_real(e.mul(scal(2),vr),f(Y0,Y1)),mul_real(e.pow(vr,2),f(Y1,Y1)))

    def dr(f):
        return add(f(R),mul_real(a,l(f)))

    def drr(f):
        return add(f(R,R),mul_real(e.mul(scal(2),a),l(lambda *j:f(R,*j))),
                   mul_real(a_r,l(f)),mul_real(e.pow(a,2),ll(f)))

    def dz(f):
        return mul_real(eps,f(Z))

    def grad(f):
        return add(dr(f),mul_i(k[0],f())),mul_i(k[1],f()),add(dz(f),mul_i(k[2],f()))

    def dt(f):
        return add(mul_real(e.neg(eps),f(T)),mul_real(time,add(mul_real(vt,f(Y0)),f(Y1))),mul_i(k_t,f()))

    def lap(f):
        return add(drr(f),mul_real(e.pow(eps,2),f(Z,Z)),
                   mul_i(coefs['KNormalRRadial'],f()),mul_i(e.mul(eps,coefs['KNormalZAxial']),f()),
                   mul_i(e.mul(scal(2),k[0]),dr(f)),mul_i(e.mul(scal(2),k[2]),dz(f)),
                   mul_real(e.neg(e.add(*(e.pow(x,2) for x in k))),f()),
                   mul_real(radius,grad(f)[0]))

    def m(j,*axes):
        factor=e.mul(at(ratios['inverseVelocityScale']),
                     *(at(ratios['inverseSqrt'] if axis==R else ratios['inverseAxialScale'])
                       for axis in axes if axis in (R,Z)))
        return e.mul(factor,field(f'ActualInitializedMeanVelocity_{j}',axes))

    M=[m(j) for j in range(3)]
    Mgrad=[(e.add(m(j,R),e.mul(a,e.add(m(j,Y0),e.mul(vr,m(j,Y1))))),e.zero,e.mul(eps,m(j,Z)))
           for j in range(3)]
    U=[u(j) for j in range(3)]
    DU=[grad(lambda *axes,j=j:u(j,*axes)) for j in range(3)]
    div_u=add(*(DU[i][i] for i in range(3)),mul_real(radius,U[0]))
    div_m=e.add(*(Mgrad[i][i] for i in range(3)),e.mul(radius,M[0]))
    grad_p=grad(p)
    rows=[]
    for j in range(3):
        f=lambda *axes:u(j,*axes)
        visc=lap(f)
        if j==0:
            visc=add(visc,mul_real(e.neg(radius2),U[0]),mul_i(e.neg(e.mul(scal(2),radius2,k_p)),U[1]))
        if j==1:
            visc=add(visc,mul_real(e.neg(radius2),U[1]),mul_i(e.mul(scal(2),radius2,k_p),U[0]))
        metric=empty
        if j==0:
            metric=mul_real(e.mul(scal(-2),radius,M[1]),U[1])
        if j==1:
            metric=add(mul_real(e.mul(radius,M[0]),U[1]),mul_real(e.mul(radius,M[1]),U[0]))
        advect=add(*(mul_real(M[i],DU[j][i]) for i in range(3)),
                   *(mul_real(Mgrad[j][i],U[i]) for i in range(3)),metric)
        cross=add(advect,mul_real(div_m,U[j]),mul_real(M[j],div_u))
        linear=add(dt(f),mul_real(e.neg(eps),visc),grad_p[j],mul_real(scal(-1),tail(j)))
        expected=add(linear,cross)
        for part,expr in zip(PARTS,expected,strict=True):
            [rec]=[row for row in case['scalars'] if row['coordinate']==j and row['part']==part]
            got=e.add(*(e.mul(scal(Q(number)),*(e.pow(atom_for_original(i),multiplicity)
                                                for i,multiplicity in monomial))
                        for number,monomial in rec['termsAfterFactoringPToMode']))
            assert eq(got,expr),(key,j,part,len(got),len(expr))
            rows.append({'component':j,'part':part,'actualSupportedRoot':rec['supported'],
                         'sparseInputTerms':len(rec['termsAfterFactoringPToMode']),
                         'fullConservativeAndLinearEquationExact':True})
    return {'chart':key,'originalModeOneNativeSystem':case['system'],'rows':rows}


def frame_and_amplitude(g,Exact,frame,data):
    native=json.loads(data['registry']['base']['base']['m3GlobalPulses'])
    original=frame.verify_original(g,Exact,native)
    assert original==data['frame']['verifiedOriginalFrames']
    primary=data['primary']['exactSameBody']
    inputs=data['matrix']['sameLiveMatrixBinding']['originalMatrixRows']
    out={}
    for sign,f in original.items():
        assert inputs[sign]['P']==f['P'] and inputs[sign]['originalMatrix']==f['originalMatrix']
        tied=primary['families'][sign]
        assert tied['normal']==f['n'] and tied['normalPrime']==f['np']
        assert tied['realCurlReducesToHalfAmplitudeOnPositiveFrameDomain']
        fixed=[17732745,17733045,17735301,tied['squareRootOfActualCramerWeight']]
        assert all(frame.V not in frame.free(g,i) for i in fixed)
        f0=frame.Forms(g,Exact,{})
        e=f0.a
        at=lambda i:f0.val(i,False)
        n=list(map(at,f['n']))
        np=list(map(at,f['np']))
        q=at(f['q'])
        assert f0.eq(q,e.dot(n,n))
        assert all(f0.eq(at(npi),f0.derivative_w(ni)) for ni,npi in zip(f['n'],f['np'],strict=True))
        Aphi=[list(map(at,row)) for row in f['Aphi']]
        assert all(f0.eq(e.dot(n,col),e.neg(nd)) for col,nd in zip(zip(*Aphi,strict=True),np,strict=True))
        B=[list(map(at,row)) for row in f['B']]
        L=[list(map(at,row)) for row in f['BL']]
        [squared]=g.args(f['tau'],'sqrt_positive')
        assert f0.eq(at(squared),e.dot(n[1:],n[1:]))
        radical=at(f['tau'])
        (((root,power),),scalar),=radical.items()
        assert power==scalar==1

        def equal_on_positive_frame(x,y):
            reduced=[]
            delta=e.sub(x,y)
            for word,coefficient in delta.items():
                powers=dict(word)
                count=powers.pop(root,0)
                a,b=divmod(count,2)
                if b:
                    powers[root]=b
                reduced.append(e.mul({tuple(sorted(powers.items())):coefficient},e.pow(at(squared),a)))
            return f0.eq(e.add(*reduced),e.zero)

        assert all(equal_on_positive_frame(e.dot(n,col),e.zero) for col in zip(*B,strict=True))
        for i in range(2):
            for j,col in enumerate(zip(*B,strict=True)):
                assert equal_on_positive_frame(e.dot(L[i],col), e.scalar(int(i==j)))
        out[sign]={'positiveFrameTangencyAndLeftInverse':True,'movingNormalDifferentialIdentity':True,
                   'P':f['P'],'matrix':f['originalMatrix'],'pressureRowNormal':f['n'],'pressureRowNormalPrime':f['np'],
                   'amplitudePrefactorIndependentOfPulseRoots':fixed,
                   'actualPotentialSlots':tied['potentialSlots']}
    assert len(primary['tenCharts'])==10 and all(len(r['completeSameBodyBindings'])==10 for r in primary['tenCharts'])
    return out


def epsilon_audit(data):
    kappa=Q(1,100000)
    profiles=data['primary']['weightedQuotientLedger']['bounds']
    minima={}
    for role,start in [('realU','velocityReal'),('imaginaryU','velocityImaginary'),
                       ('pressure','pressure'),('tail','principalTail')]:
        minima[role]=min(Q(r['epsilonPower'])+Q(r['inverseCarrierPower'],2)
                         for r in profiles if r['role'].startswith(start))
    assert minima=={'realU':Q(1,2),'imaginaryU':1-kappa,'pressure':Q(1),'tail':Q(1,2)}
    min_mean={name:min(Q(x[1],100000) for row in rows for x in row['terms'])
              for name,rows in data['mean']['rows'].items()}
    assert min(min_mean.values())==1-kappa
    assert data['mean']['scope']['sameLiveBackgroundBOverEpsilonC5BoundAttachedOnOriginalSlab']
    assert data['primary']['weightedQuotientLedger']['firstPulseDerivativeCoverage']['addsBandOrLogLoss'] is False
    assert all(r['independentPulseDerivativesOfNormalizedFields']=='first derivative of matching u, coefficient +1'
               for r in data['primary']['firstForcedDemand']['pulseDerivativeCancellations'] if r['mode']==1)
    by_piece={
        'retainedImaginaryHomogeneousAmplitude':minima['imaginaryU'],
        'slowPressureGradient':minima['pressure']-kappa,
        'groupedCarrierEikonal':min_mean['v']+minima['realU']-Q(1,2),
        'singleCarrierViscousPhaseAndConnection':1-Q(1,2)+minima['realU']-kappa,
        'backgroundAndIncrementTransportWithMeanDivergence':min(min_mean.values())+minima['realU']-kappa,
        'zeroCarrierSlowTimeAndViscosity':1+minima['realU']-2*kappa,
    }
    assert min(by_piece.values())==1-kappa
    real={
        'groupedCarrierEikonal':min_mean['v']+minima['imaginaryU']-Q(1,2),
        'singleCarrierViscousPhaseAndConnection':1-Q(1,2)+minima['imaginaryU']-kappa,
        'backgroundAndIncrementTransportWithMeanDivergence':min(min_mean.values())+minima['realU']-kappa,
        'zeroCarrierSlowTimeAndViscosity':1+minima['realU']-2*kappa,
    }
    assert min(real.values())==Q(3,2)-2*kappa
    return {'directFieldEpsilonGradesWithCarrierBound':{k:str(v) for k,v in minima.items()},
            'meanIncrementEpsilonGrades':{k:str(v) for k,v in min_mean.items()},
            'signedAnalyticRemainderGrades':{k:str(v) for k,v in by_piece.items()},
            'realPartRemainderGrades':{k:str(v) for k,v in real.items()},
            'realPartConditionalEpsilonDegree':str(Q(3,2)-2*kappa),
            'imaginaryPartConditionalEpsilonDegree':str(1-kappa),
            'commonPostCancellationConditionalEpsilonDegree':str(1-kappa),
            'gradeNotACombinedBandEstimate':'S factors and radial poles on actual derivatives are retained. No numeric source constant, sign, final PDE residual or global closure follows from this grade.'}


def post_cancellation_weights(data):
    raw=data['rawWeights']
    norm=data['primary']['weightedQuotientLedger']
    fields=norm['bounds']
    assert norm['transverseDerivativeCoverage']['costInSAndLaurent']==0
    assert norm['firstPulseDerivativeCoverage']['addsBandOrLogLoss'] is False
    u=[]
    p=[]
    for j in range(7):
        vel=[r for r in fields if r['slowOrder']==j and r['role'].startswith('velocity')]
        press=[r for r in fields if r['slowOrder']==j and r['role']=='pressureOverP']
        [pr]=press
        u.append((max(Q(r['constantSPower']) for r in vel),max(r['totalLogPoleAfterG'] for r in vel)))
        p.append((Q(pr['constantSPower']),pr['totalLogPoleAfterG']))
    assert u==[(Q(13,4)+3*j,3+3*j) for j in range(7)]
    assert p==[(Q(1,4)+3*j,3*j) for j in range(7)]
    for field,rows in data['mean']['rows'].items():
        for row in rows:
            s=sum(row['RZL'][:2])
            assert max(Q(x[0]) for x in row['terms'])<=Q(21,2)+3*s,(field,row['RZL'])
            assert max(x[2] for x in row['terms'])<=27
    rows=[]
    pre={tuple(x['RZL']):x for x in raw['rawPerDirection']['1']}
    native={tuple(x['RZL']):x for x in raw['conditionalOrderedVariation']['1']['physicalOverP']}
    for alpha in map(tuple,raw['directions']):
        s=sum(alpha[:2])
        assert sum(alpha)<=4
        ordinary_time_viscosity=u[s+2]
        ordinary_pressure=p[s+1]
        mean_transport=(Q(21,2)+u[0][0]+3*(s+1),u[s+1][1])
        # Normal and normal-squared jets cost at most one S per assigned
        # slow index; their undifferentiated values are bounded on the cone.
        first_carrier_viscosity=u[s+1]
        eikonal=(Q(21,2)+u[s][0],u[s][1])
        pieces={'pureImaginaryAmplitude':u[s],
                'ordinaryZeroCarrierTimeAndViscosity':ordinary_time_viscosity,
                'ordinaryPressureGradient':ordinary_pressure,
                'meanTransportGradientMetricAndMeanDivergence':mean_transport,
                'singleCarrierViscosityAndConnection':first_carrier_viscosity,
                'groupedEikonal':eikonal}
        s_out=max(v[0] for v in pieces.values())
        p_out=max(v[1] for v in pieces.values())
        assert s_out==Q(67,4)+3*s and p_out==9+3*s
        assert s_out<=Q(pre[alpha]['rawBandPower']) and p_out<=pre[alpha]['rawAdditionalLogPoleAfterGToMode']
        assert s_out+1<=Q(native[alpha]['velocityOverPBandPower']) and p_out<=native[alpha]['additionalLogPoleAfterGToMode']
        rows.append({'RZL':alpha,'slowRZ':s,'rawBandPower':str(s_out),'rawPoleAfterG':p_out,
                     'nativeVelocityOverPBandPower':str(s_out+1),'nativeVelocityPoleAfterG':p_out,
                     'remainderGroupUpperDegrees':{k:[str(v[0]),v[1]] for k,v in pieces.items()}})
    assert len(rows)==23
    assert max(Q(r['nativeVelocityOverPBandPower']) for r in rows)==Q(119,4)
    assert max(r['nativeVelocityPoleAfterG'] for r in rows)==21
    c=raw['conditionalScalarFactorsAndLogJoin']['constantLedger']
    assert c['combinedLogAfterFiniteFactor']=='H/2^108' and c['allowedFiniteFactor']=='2^136'
    exp=sum(c['powersOfTwoByReason'].values())
    # A conservative bound for re-expanding the surviving groups.
    # At most 64 branches per scalar, each with scalar magnitude <=16;
    # distributing four mixed derivatives across <=5 factors costs <=5^4.
    assert 64*16*5**4<2**20 and exp+20<=136
    return {'rows':rows,'directionCount':len(rows),'maxNativeVelocityOverPBandPower':'119/4',
            'maxAdditionalRadialPoleAboveG':21,'postCancellationPrefactorLogCap':'H/2^108',
            'extraBitChargeForRegroupedAbsoluteCoefficients':20,'priorFiniteBitCharge':exp,
            'availableFiniteBits':136,
            'whyExistingSourceLogCapApplies':['Use C93/C92 Primary, pressure, mean and frame constants at the same derivative orders.',
              'Coefficient products need at most the prior four original geometry-sized factors and one complete background factor. This includes the G multiplying omega_Z, and the source-only K in the imaginary-amplitude block.',
              'Source signs and expansions are first regrouped. The displayed extra finite coefficient charge replaces any use of an unproved monotonicity of absolute raw monomial sums under regrouping.',
              'The original C90 mode-one integration length spends one S and its original coefficient constant is already in C93. The varied matrices consume at most two S per reassigned slow derivative, while the raw forcing slope is three.'],
            'scope':'Same physical fixed representative and band label, H_w preserving xi, d and L. The original admitted slab, q_n and positive tangent denominator, complete short pressure/mean paths, C91 field norms and original propagator remain premises. The last physical curl and all nonlinear/pde-energy joins are outside these raw and native bounds.'}


def main():
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for key in ('goal','artifact','cache','out'):
        p.add_argument('--'+key,type=Path,required=True)
    args=p.parse_args()
    active=args.goal/'primary-forced-join/active-n3-c5-binding'
    band=active/'first-wave-guard-traces'
    host=args.artifact/'first-correction-spatial-source'
    paths={
        'manifest':host/'original-source-export-manifest.json','registry':host/'original-source-functions.json',
        'factor':band/'forced-normalized-variation/source/normalized-first-forced.json',
        'frame':band/'outer-normalized-amplitude/pulse-frame/pulse-frame-caps-final.json',
        'frameChecker':band/'outer-normalized-amplitude/pulse-frame/verify_all_label_pulse.py',
        'geometry':band/'first-forced-budget/geometry/outer-forced-geometry.json',
        'geometryChecker':band/'first-forced-budget/geometry/verify_geometry.py',
        'primary':band/'initial-mean-norm/primary/primary-quotient-ledger.json',
        'matrix':band/'outer-fixed-label-norm/matrix/matrix-s-j.json',
        'mean':band/'initial-mean-norm/initial-mean-caps.json',
        'rawWeights':band/'first-forced-budget/outer-weight-comparison/raw-weights/raw-weight-degrees-final.json',
        'cache':active/'live-wave-gauge/signed/source_cache.py','reader':active/'spatial-readback/verify_spatial_artifact.py',
        'exact':args.goal/'first-force-repair/verify_repaired_first_force.py',
    }
    raw={k:read(path,k) for k,path in paths.items()}
    data={k:json.loads(raw[k]) for k,path in paths.items() if path.suffix=='.json'}
    sys.path[:0]=[str(paths[k].parent) for k in ('cache','reader','exact','frameChecker','geometryChecker')]
    import source_cache,verify_spatial_artifact
    import verify_all_label_pulse as frame
    import verify_geometry as geometry
    from verify_repaired_first_force import Exact

    definitions={d['id']:d for d in json.loads(data['registry']['definitions'])[0]}
    g=source_cache.load(verify_spatial_artifact,host,data['manifest'],22153782,args.cache)
    try:
        assert g.count==22155584 and g.verify['sha256']==STREAM
        rows=[compare_chart(g,Exact,frame,geometry,data['frame'],row,
                            data['factor']['normalizedPrimaryByChart'][row['chart']],definitions)
              for row in data['factor']['cases'] if row['mode']==1]
        frame_checks=frame_and_amplitude(g,Exact,frame,data)
    finally:
        g.__exit__(None,None,None)
    assert len(rows)==10 and sum(len(r['rows']) for r in rows)==60
    result={'status':'VERIFIED_ORIGINAL_FULL_MODE_ONE_LINEAR_AND_CONSERVATIVE_GROUPS',
            'inputPins':FILES,'sourceStream':g.verify,'chartRows':rows,
            'sameBodyHomogeneousFrame':frame_checks,
            'sourceIdentitiesApplied':{
                'physicalHomogeneousPulse':'t=P*B*z and t_v=A_phi*t-diffusion*t on admitted frame. Differentiate n dot B=0; n dot A_phi=-n_v, so columns of A_phi*B-B_v lie in span B and B_left inverts them.',
                'normalizedLeadingBlock':'U_R=psi*A0*(Bz)/2 and p_I=(n^T*K-n_v^T)U_R/(k*q). Then (partial_v+P_v/P+K+epsilon*k^2*q)U_R-k*n*p_I=psi_v*A0*(Bz)/2 exactly the registered tail.',
                'conservativeCurlDivergence':'For D_r^phi=D_r+i*k*n_r and D_z^phi=D_z+i*k*n_z, their commutator vanishes by D_r*n_z=D_z*n_r and commuting actual slow derivatives. The cylindrical angular commutators use D_r*n_theta=-n_theta/R and D_z*n_theta=0. Thus div_phi(U)=0 for the original full curl; removal includes both the phase and ordinary parts of M*div_phi(U).',
                'completeMean':'The rescaled original mean is (b,RF,G)+Delta on the same physical chart. Its divergence is allowed to remain. After splitting the gradient and metric pieces as K*U plus the remaining background and Delta terms, all remaining mean-gradient, transport and divergence factors carry at least one explicit epsilon or one weighted Delta.',
            },
            'minimalFormalSurvivor':{
                'example':'+k*n_theta*Delta_theta*Re(U_j) in the imaginary eikonal equation',
                'reason':'This is the only zero-order Delta_theta times Re(U_j) carrier contribution after removing M*div_phi(U). The initialized-mean derivative and cylindrical terms involve different jet/component variables, or the other complex part. The frozen angular integer is nonzero and the real Primary vector is tangent. Projection preserves the vector up to its signed forcing convention.',
                'noNumericalNonvanishingOrSignClaim':True},
            'postCancellationConditionalGrades':epsilon_audit(data),
            'postCancellationUniformWeights':post_cancellation_weights(data),
            'finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])


if __name__=='__main__':
    main()
