"""C3 transfer and the actual order-two Temporal velocity inputs on the original chart."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from math import comb, factorial
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

HERE = Path(__file__).resolve().parent
for name in ('first-pressure-norm','pressure-exterior','temporal-exterior','first-gauge'):
    sys.path.insert(0,str(HERE.parent/name))
from check_first_pressure_norm import (
    PRESSURE_RECEIPT, check as check_c2, Graph, Native, read_artifact, need,
    Exact, pin_sources, git_blob,
)
from check_pressure_exterior import bind_shift
from check_temporal_exterior import actual_curl, CHI, CI0, EPSILON, INNER, OUTER, R, Z, T, ELL, Y, TEMP_PSI, TEMP_INVERSE

C2_RECEIPT = '68c70a831a219b9fbf5e6202c55c8f6f27c7bca252aab3669c6125054e392117'


def seed_next(p,square):
    """Differentiate P(1/u)*exp(-1/u^a) with a=1 or a=2."""
    power = 2 if square else 1
    result = {}
    for degree,coefficient in p.items():
        result[degree+power+1] = result.get(degree+power+1,0)+power*coefficient
        if degree:
            result[degree+1] = result.get(degree+1,0)-degree*coefficient
    return {d:c for d,c in result.items() if c}


def third_majorants(c2):
    s1 = c2['implicitSFirst']
    s2 = Q(c2['implicitSSecond'])
    # F_{sss}, F_{ssZ}, F_{sZZ} have respective bounds 4,1,1/4.
    s3 = 2*(4*s1**3+3*s1*s1+3*Q(1,4)*s1+3*s2*(s1+Q(1,2)))
    need(s3 == 88976 and s3 < 2**17, 'implicit original chart mixed derivatives through three')
    b1,b2,b3 = 2**8,2**15,2**22
    prefactor = [2,32,3584,2*(15*s1**3+9*2**10*s1+2**17)]
    need(prefactor[-1]==679936 and max(10*prefactor[2],Q(11,2)*prefactor[3])<b3,
         'third derivative of the actual original patch argument')
    square, linear = {0:1},{0:1}
    for _ in range(3):
        square=seed_next(square,True)
        linear=seed_next(linear,False)
    need(square=={9:8,7:-36,5:24} and linear=={6:1,5:-6,4:6}, 'third derivative of the two actual flat seeds')
    sq3=sum(abs(c)*factorial((d+1)//2) for d,c in square.items())
    lin3=sum(abs(c)*factorial(d) for d,c in linear.items())
    need((sq3,lin3)==(1968,1584),'exact factorial majorants for the two actual seeds')
    sig1,sig2=c2['squareStepFirst'],c2['squareStepSecond']
    sig3=81*(3*sq3+3*sig2*8+3*sig1*72)
    chi3=sig3*b1**3+3*sig2*b1*b2+sig1*b3
    need(sig3 < 2**30 and chi3 < 2**55,'actual square-seed step and composed cutoff through three')
    bump3=2*lin3+6*36*2
    bump=[1,4,80,bump3]
    a0,a1,a2,a3=prefactor
    rho3=c2['fixedRhoMassInverseUpper']*(
        a3+3*a2*bump[1]*b1+3*a1*(bump[2]*b1*b1+bump[1]*b2)+
        a0*(bump[3]*b1**3+3*bump[2]*b1*b2+bump[1]*b3))
    need(bump3==3600 and rho3<2**51,'actual normalized compact mass cutoff derivative through three')
    shifted3=2+24+64
    partial3=1+20+2*18+shifted3
    need((shifted3,partial3)==(90,147),'radial third derivative and both endpoint terms')
    I=[1,5,23,partial3]
    J=[1,4,18,shifted3]
    chi=[1,2**17,2**36,2**55]
    rho=[2**15,2**25,2**38,2**51]
    t0=c2['T0Rounded']+[2**56]
    exact_t0_3=I[3]+sum(comb(3,j)*chi[j]*J[3-j] for j in range(4))
    radial_input=1+sum(comb(3,j)*rho[j] for j in range(4))
    need(exact_t0_3<=t0[3] and radial_input<=2**52, 'actual T0 and compact mean normalization C3 transfer')
    psi3=4*t0[3]*sum(comb(3,j)*factorial(j) for j in range(4))
    need(psi3==2**62,'actual weighted realized T1 potential C3')
    beta_from_gz = 3*sum(comb(2,j)*factorial(j)*t0[2-j] for j in range(3))
    cutoff_from_g = 3*sum(comb(2,j)*factorial(j)*sum(
        comb(2-j,i)*chi[i+1]*J[2-j-i] for i in range(3-j))
        for j in range(3))
    need(beta_from_gz<=2**39 and cutoff_from_g<=2**57 and 1+cutoff_from_g<=2**58,
         'anisotropic beta and FTC-reduced gamma C2 transfers')
    return {
        'sC3Upper':int(s3),'patchArgumentC3Upper':b3,'patchPrefactorC3Upper':prefactor[-1],
        'squareSeedC3Upper':sq3,'linearSeedC3Upper':lin3,'sigmaC3Upper':sig3,'chiC3Upper':chi3,
        'compactBumpC3Upper':bump3,'rhoC3Upper':rho3,
        'shiftC3Constant':shifted3,'partialIntegralC3Constant':partial3,'wholeIntegralC3Constant':shifted3,
        'T0C3ConstantBeforeRounding':exact_t0_3,'T0C3PowerOfTwo':56,'T0C3PowerOfM':4,
        'normalizedInputC3BeforeRounding':radial_input,
        'normalizedMeanPressureC3PowerOfTwo':108,'normalizedMeanPressureC3PowerOfM':5,
        'T1PotentialC3PowerOfTwo':62,'T1PotentialC3PowerOfM':6,
        'betaZDerivativeInputC2ConstantBeforeRounding':beta_from_gz,
        'velocityCutoffC2ConstantBeforeRounding':cutoff_from_g,
        'betaZDerivativeInputC2PowerOfTwo':39,'betaUndifferentiatedInputC2PowerOfTwo':57,
        'betaC2PowerOfM':5,'gammaC2PowerOfTwo':58,'gammaC2PowerOfM':5,
    }


def bind_chi_derivatives(g):
    a=Exact(g)
    b, derivative, chi_r,chi_z = 633700,633759,633761,633960
    step=g.args(CHI,'source_step_derivative')
    need(step==[b,0] and g.args(derivative,'source_step_derivative')==[b,1],
         'actual same original mean patch cutoff step')
    pref,s,sz = 633697,622820,633921
    pow_s=633904
    need(a.of(g.args(pow_s,'exp')[0])==a.mul(a.scalar(2),a.of(9),a.of(622825)),
         'actual implicit s derivative uses the same power s^(2h)')
    denom=a.sub(a.one,a.mul(a.scalar(2),a.of(9),a.of(Z),a.of(Z),
                           a.of(pow_s),a.inv(a.of(s))))
    need(a.of(sz)==a.mul(a.scalar(2),a.of(Z),a.of(pow_s),a.inv(denom)),
         'actual implicit derivative s_Z')
    need(a.of(633928)==a.neg(a.mul(a.scalar(Q(1,2)),a.of(633686),a.of(sz),
                                  a.inv(a.of(633687)),a.pow(a.of(pref),2))),
         'actual derivative of the original reciprocal patch prefactor')
    need(a.of(chi_r)==a.mul(a.scalar(10),a.of(derivative),a.of(pref)) and
         a.of(chi_z)==a.mul(a.scalar(10),a.of(derivative),a.of(R),a.of(633928)),
         'actual chi_R and chi_Z retain the original chain rules')
    return {'chi':CHI,'chiR':chi_r,'chiZ':chi_z,'sZ':sz}


def bind_velocity(g,native,temporal,chi):
    psi, beta, gamma, delta_v, gd, cutoff, gamma_ftc, gamma_reduced=(
        4454155,4454158,4454167,4454009,4454011,4454181,4454182,4454184)
    d=native.expressions[TEMP_PSI]
    need(g.args(psi,'m3_coupled_expression_partial')==[d['id'],d['parameters'],[0]*6]
         and actual_curl(g,d,psi)==[beta,gamma], 'actual realized Temporal curl roots')
    need(g.args(4454156,'m3_coupled_expression_partial')==
         [d['id'],d['parameters'],[int(x==Z) for x in d['parameters']]],
         'actual radial velocity consumes only the Z derivative of the registered T1')
    j=temporal['whole']
    i=temporal['left']
    op='m3_coupled_inverse_partial'
    defs=[native.inverses[n] for n in TEMP_INVERSE]
    roots=[4348626,4396853]
    for root,d in zip(roots,defs,strict=True):
        need(g.args(root,op)==[d['id'],[R,Z,T,ELL,*Y],[0]*5],
             'exact corrected two-torus inverse at the actual common chart')
    a=Exact(g)
    v=a.of
    scale=a.inv(v(CI0))
    need(v(delta_v)==a.neg(a.mul(scale,v(roots[0]))) and
         v(gd)==a.neg(a.mul(scale,v(roots[1]))), 'actual desired direct swirl and axial velocity')

    # Bind the separate shifted integrals of L(R gamma_d) in the exact FTC route.
    lleft,lwhole=4454139,4454140
    body,binder,lo,hi=g.args(lwhole,'definite_integral')
    need([lo,hi]==[INNER,OUTER] and g.args(lleft,'definite_integral')==[body,binder,INNER,R],
         'actual auxiliary derivative integrals retain the original same binder and endpoints')
    applications=[4454129,4454133]
    a0,a1=[g.args(n,op) for n in applications]
    need(a0[0]==a1[0]==defs[1]['id'] and a0[1]==a1[1] and a0[1][:4]==[binder,Z,T,ELL] and
         a0[2]==[0,0,0,1,0] and a1[2]==[0,0,0,0,1],
         'actual native angular derivative branches of the same shifted axial inverse')
    shift=bind_shift(g,a0[1],binder)
    need(v(body)==a.neg(a.mul(v(binder),scale,a.add(v(applications[0]),a.mul(v(623066),v(applications[1]))))),
         'actual integrand is L of the same R times desired gamma before shift')
    inv_r=a.inv(v(R))
    fast=v(635060)
    source_cutoff=a.mul(v(chi['chiR']),v(j),inv_r)
    expected_rd=a.add(a.mul(v(R),v(gd)),a.neg(a.mul(fast,v(lleft))),
                      a.neg(a.mul(v(chi['chiR']),v(j))),a.mul(v(CHI),fast,v(lwhole)))
    expected_L=a.sub(v(lleft),a.mul(v(CHI),v(lwhole)))
    need(v(4454175)==expected_rd and v(4454178)==expected_L and v(cutoff)==source_cutoff and
         v(gamma_ftc)==a.mul(inv_r,a.add(expected_rd,a.mul(fast,expected_L))) and
         v(gamma_reduced)==v(gamma_ftc)==a.sub(v(gd),v(cutoff)),
         'actual FTC cancellation yields gamma_d minus the literal cutoff remainder')
    need(v(gamma_reduced)!=a.add(v(gd),v(cutoff)), 'wrong-sign cutoff control is rejected')
    return {'psi':psi,'realizedRadial':beta,'realizedAxial':gamma,'directSwirl':delta_v,
            'desiredAxial':gd,'desiredAxialNativeInverse':roots[1],'desiredThetaNativeInverse':roots[0],
            'partial':i,'whole':j,'angularIntegralPartial':lleft,'angularIntegralWhole':lwhole,
            'angularShift':shift,'angularActualInversePartials':applications,
            'axialCutoffRemainder':cutoff,'axialExplicitFTC':gamma_ftc,'axialReduced':gamma_reduced,
            'centeredAxialSource':defs[1]['body'],'centeredThetaSource':defs[0]['body'],
            'rawAxialSource':4229480,'rawThetaSource':4229105,
            'radialC2Inputs':['gamma_d C2','partial_Z gamma_d C2'],
            'axialC2Inputs':['gamma_d C2'],
            'directSwirlC2Inputs':['desired theta inverse velocity C2'],
            'cutoffRemainderNotZeroed':True,'wrongSignCutoffRejected':True}


def main():
    p=ArgumentParser(description=__doc__)
    for key in ('repo','artifact','pressure-receipt','c2-receipt','out'):
        p.add_argument('--'+key,required=True,type=Path)
    a=p.parse_args()
    d,run,manifest,run_sha=read_artifact(a.artifact,True)
    raw=a.pressure_receipt.read_bytes()
    low_bytes=a.c2_receipt.read_bytes()
    need(sha256(raw).hexdigest()==PRESSURE_RECEIPT and sha256(low_bytes).hexdigest()==C2_RECEIPT,
         'pinned prior exterior and exact C2 receipt')
    prior,low=json.loads(raw),json.loads(low_bytes)
    for record in (prior,low):
        need(record['graphSHA256']==manifest['node_stream_sha256'] and
             record['registrySHA256']==manifest['definitions_sha256'],'same corrected graph and native registry')
    native=Native(d/'original-source-functions.json',manifest)
    pins=pin_sources(a.repo,run)
    name='research-ide/mathscope-m3/navier/source-temporal-potential.mjs'
    src=git_blob(a.repo,run['executing_commit'],name)
    need(all(x in src for x in (
        b'gammaIdentity=globalGraphEqual(G,realizedGammaFromFTC,G.sub(gammaDesired,cutoffRemainder)',
        b'beta=G.neg(Dz(psi)),gamma=De(psi,1)',
        b'angularIntegrals=shiftedRadialIntegrals(G,{body:L(weighted)')),
        'original realized Temporal calculus producer')
    name='research-ide/mathscope-m2/navier/actual-continuation-exact-support.mjs'
    src=git_blob(a.repo,run['executing_commit'],name)
    digest=sha256(src).hexdigest()
    need(digest==low['sourceSHA256'][name] and
         b'sigma=exp(-1/s^2)/(exp(-1/s^2)+exp(-1/(1-s)^2))' in src,
         'same original square seed source after reopening the pinned prior receipt')
    pins[name]=digest
    with TemporaryFile() as backing:
        graph=Graph(d/'original-source-nodes.jsonl.gz',backing,manifest)
        same=check_c2(graph,native,a.repo,run,prior)
        need(all(same[k]==low[k] for k in ('actualT0','actualT1','actualCutoffOperands','phase',
                 'radialEnvelopeComparison','rationalMajorants')),'replayed original C0--C2 transfer')
        chi=bind_chi_derivatives(graph)
        velocity=bind_velocity(graph,native,same['actualT1'],chi)
    result={
        'schema':'MathScope.N7.CorrectedFirstPressureTemporalC3Transfer/1',
        'sourceCommit':manifest['executing_commit'],'graphSHA256':manifest['node_stream_sha256'],
        'registrySHA256':manifest['definitions_sha256'],'hostedRunSHA256':run_sha,
        'sourceSHA256':pins,'pressureExteriorSHA256':PRESSURE_RECEIPT,'lowOrderReceiptSHA256':C2_RECEIPT,
        'actualT0':same['actualT0'],'actualT1':same['actualT1'],'phase':same['phase'],
        'radialEnvelopeComparison':same['radialEnvelopeComparison'],'actualCutoffDerivatives':chi,
        'originalPhaseThirdDerivativeBound':'M^2',
        'actualTemporalVelocity':velocity,'rigorousC3Transfer':third_majorants(same['rationalMajorants']),
        'conditionalFourierInputsForOrderTwoVelocity':['raw E_theta C4',
              'raw E_z C4','partial_Z raw E_z C4 with one distinguished axial derivative'],
        'sufficientFourierDerivativeFamily':'partial_Y_j^2 D^alpha of Etheta, Ez and partial_Z Ez, |alpha|<=2',
        'actualUniformInputSeminormsVerified':False,'actualFirstCutoffCAndPVerified':False,'finalJets':0,
        'release':'HOLD',
    }
    a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print('PASS actual C3: mean pressure 2^108 M^5, T1 2^62 M^6; '
          'actual C2 radial velocity uses axial gamma_d C2 and distinguished partial_Z gamma_d C2; '
          'actual C2 axial velocity uses gamma_d C2 via checked FTC')


if __name__=='__main__':
    main()

