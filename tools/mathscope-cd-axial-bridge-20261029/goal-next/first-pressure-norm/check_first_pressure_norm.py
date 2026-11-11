"""Exact C0--C2 transfer for the actual first corrected shifted pressure and T1 potential."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from math import factorial, comb
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

HERE = Path(__file__).resolve().parent
for name in ('pressure-exterior','temporal-exterior','first-scale-closure','first-gauge'):
    sys.path.insert(0,str(HERE.parent/name))
from check_pressure_exterior import bind_t0, INITIAL_TAG, FINAL_TAG, MEAN
from check_temporal_exterior import chart, definitions, pin_sources, TEMP_PSI, TEMP_INVERSE, temporal_integrals
from check_first_scale_closure import verify_qbig, exact_parameter_tree
from bind_first_cycle_gauge import Graph, Native, read_artifact, git_blob, need, Exact, q

PRESSURE_RECEIPT = 'c5e39a3d7a18849f42189e0821c065298736893d10c60d1baad5c86f8589f04f'


def phase_tree(g):
    checks = {
        635059: ('multiply',[624061,635058]),
        635058: ('exp',[635057]), 635057: ('multiply',[624041,635056]),
        635056: ('multiply',[20,635055]), 635055: ('ceiling',[635054]),
        635054: ('multiply',[20,635053]), 635053: ('multiply',[623016,635052]),
        635052: ('add',[635048,635051]), 635048: ('multiply',[127,635047]),
        635047: ('multiply',[135988,635046]), 635046: ('add',[190,622791]),
        635051: ('multiply',[20,635050]), 635050: ('multiply',[24,635049]),
        635049: ('log_positive',[635046]), 127: ('log_positive',[24]),
        624061: ('exp',[624060]), 624060: ('multiply',[624048,624059]),
        624059: ('log_positive',[624050]), 624050: ('multiply',[622802,624049]),
        624049: ('sqrt_positive',[622794]), 622794: ('exp',[622793]),
        622793: ('multiply',[20,622792]), 622792: ('multiply',[127,622791]),
        624048: ('multiply',[24,624047]), 624047: ('add',[624044,624046]),
        624044: ('multiply',[135988,624042]), 624046: ('multiply',[20,624045]),
        624045: ('multiply',[9,624043]), 624043: ('rational',['1','100000']),
        135988: ('add',[1,9]), 9: ('source_parameter',['h']),
        624042: ('multiply',[623016,624041]), 623016: ('inverse',[623015]),
        624041: ('log_positive',[624040]), 623015: ('log_positive',[300172]),
        624040: ('add',[474,623065]), 623065: ('multiply',[20,3622]),
        300172: ('add',[474,3622]), 3622: ('sqrt_positive',[24]),
        623066: ('add',[1,623065]),
    }
    need(all(g.node(i)==spec for i,spec in checks.items()),'actual original floor, radial exponent and primitive tree')
    need(q(g,190)==-2 and q(g,24)==2 and q(g,474)==4 and q(g,20)==-1,
         'literal source integers in radial phase')
    a=Exact(g)
    need(a.of(635060)==a.mul(a.of(624048),a.of(635059),a.inv(a.of(622802))),
         'actual retained fast radial factor is the radial derivative of this same phase')
    # Lambda²>Tg and Lambda³<Tg² by squaring positive sides.
    need(14**2>2*9**2 and 70**2<2*58**2 and Q(65,64)*Q(4,3)<Q(3,2),
         'exact 1/2<rho_g<2/3 and 1<dr<3/2')
    return {'phi':635059,'fastRadial':635060,'ell':622791,'baseIndex':635056,'dr':624048,
            'radialTorusBasis':[1,623066],
            'coefficient':'Lambda^(-delta) 2^(-2(1+h)rho_g) (ell-2)^(-2rho_g) Q^(h*kappa)',
            'positiveBandCoefficientAtMostOne':True,'maxC1':'2M','maxC2':'M',
            'literalSourceNodesChecked':len(checks)}


def envelope(g,program):
    # chart() has already checked the shared physical endpoints and literal terminal tree.
    a=Exact(g)
    need(a.of(218)==a.add(a.scalar(4),a.of(13),a.of(6),a.mul(a.scalar(90),a.of(7)),
                         a.mul(a.scalar(13),a.inv(a.of(8))),a.mul(a.scalar(-4),a.of(185))),
         'original terminal base 132+90001T+13/lambda-4log(h)')
    extra = {
        242: ('multiply',[186,207]), 243: ('add',[241,242]),
        245: ('exp',[244]), 244: ('multiply',[20,219]), 219: ('multiply',[19,207]),
        225: ('exp',[181]), 181: ('multiply',[20,180]), 180: ('multiply',[19,167]),
        239: ('definite_integral',[238,226,0,1]), 231: ('add',[226,230]),
        230: ('multiply',[20,229]), 229: ('definite_integral',[228,227,0,226]),
        228: ('source_step_derivative',[227,0]), 232: ('multiply',[167,231]),
        257: ('definite_integral',[256,246,0,1]), 249: ('definite_integral',[248,247,0,246]),
        248: ('source_step_derivative',[247,0]), 250: ('multiply',[207,249]),
        267: ('source_step_derivative',[266,1]), 266: ('multiply',[19,265]),
        275: ('definite_integral',[274,262,1,261]),
    }
    need(all(g.node(i)==v for i,v in extra.items()),'terminal positive numerator and derivative denominator roles')
    need(g.node(12)==('source_parameter',['XR']) and q(g,19)==Q(1,2), 'terminal source constants')
    p=program.data['parametersExactExpressions']
    need(p['co']=={'rational':'1/256'} and p['Xa']=={'quotient':[{'integer':4},{'ref':'Lambda'}]}
         and p['Lambda']=={'power':[{'ref':'Q'},64]} and p['Tf']=={'integer':128},
         'original inner radius reciprocal and fixed terminal interpolation width')
    need(2*(7+32008*10)<100000*10 and 32008*2<100000
         and 100000*256 < 2**25 and 8002+Q(25,10)+1<8100
         and 122009+20+16200+15 < 140000
         and Q(140000,800)+10<200 and 25600000>404
         and 25600000*800-8002>1 and 2**10>28,
         'rational slack for original terminal log upper bound')
    return {'M':'max(1,Rout,Rin^(-1))','originalEnvelope':'C12EnvelopeR',
            'MAtMostOriginalEnvelope':True,
            'terminalNumeratorUpper':'100000*T_*','terminalDenominatorLower':'h/256',
            'terminalLogCorrectionUpper':'16200*T_*',
            'logXbUpper':'200*log(CSelected)+13/h',
            'extraTerminalSourceNodesChecked':len(extra)}


def cutoff_operands(g,c):
    a=Exact(g)
    s,Z,T,v=622820,622803,622804,622810
    step_arg=c['cutoffArgument']
    need(c['sourceChart']['variable']==v and c['sourceChart']['body']==622819 and
         a.of(622819)==a.sub(a.sub(a.of(v),a.mul(a.of(Z),a.of(Z),a.of(622814))),a.of(T)) and
         a.of(g.args(622814,'exp')[0])==a.mul(a.scalar(2),a.of(9),a.of(622812)) and
         g.args(622812,'log_positive')==[v], 'actual implicit original normalized chart s-Z²s^(2h)-T')
    need(a.of(22)==a.sub(a.scalar(Q(1,2)),a.of(9)) and
         g.args(622825,'log_positive')==[s] and
         a.of(g.args(622827,'exp')[0])==a.mul(a.of(22),a.of(622825)) and
         a.of(622829)==a.mul(a.of(Z),a.inv(a.of(622827))), 'actual eta=Z/s^D on original chart')
    need(g.args(633707,'smooth_piecewise')==[step_arg,0,1,0,633706,0] and
         a.of(g.args(633706,'exp')[0])==a.neg(a.inv(a.mul(a.of(step_arg),a.sub(a.one,a.of(step_arg))))),
         'literal original compact normalizing bump exp[-1/(b(1-b))]')
    need(a.of(633697)==a.inv(a.mul(a.of(633686),a.of(633687))) and
         g.args(633708,'multiply')==[633697,633707] and
         g.args(633726,'multiply')==[633708,633725],
         'literal original normalized bump prefactor and inverse mass')
    return {'chartBody':622819,'eta':622829,'chi':c['cutoff'],'b':step_arg,
            'compactRhoBump':633707,'rhoPrefactor':633697,'rhoMass':633724,'rho':633726}


def majorants():
    # All norms are maximum over coordinate partials through each order.
    # s derivatives use the implicit chart denominator F_s>1/2.
    s1 = 2*2*2*2
    s2 = 2*(4+2*Q(1,2)*s1+s1*s1)
    need(s1==16 and s2<2**10,'first and second implicit chart derivatives')
    b1=max(20,Q(11,2)*2*s1)
    b2=max(10*2*s1,11*(3*s1*s1+2**10))
    need(b1<2**8 and b2<2**15,'mean patch transition coordinate derivatives')
    # Source step seed: p(s)=exp(-1/s²). p' <=4, p'' <=36.
    square_p1=2*factorial(2)
    square_p2=4*factorial(3)+6*factorial(2)
    inv_step_den=3**4
    sigma1=inv_step_den*square_p1
    sigma2=inv_step_den*(3*square_p2+4*square_p1*sigma1)
    need(sigma1<2**9 and sigma2<2**19,'original square-step quotient derivative bounds')
    chi1=sigma1*2**8
    chi2=sigma2*2**16+sigma1*2**15
    need(chi1<2**17 and chi2<2**36,'actual composed cutoff bounds')
    # rho numerator uses exp(-1/s) exp(-1/(1-s)).
    linear_p1=factorial(2)
    linear_p2=factorial(4)+2*factorial(3)
    bump1=2*linear_p1
    bump2=2*linear_p2+2*linear_p1**2
    inverse_mass=20*3**6
    pref0=2
    pref1=2*s1
    pref2=2*(3*s1*s1+2**10)
    rho0=inverse_mass*pref0
    rho1=inverse_mass*(pref1+pref0*bump1*2**8)
    rho2=inverse_mass*(pref2+2*pref1*bump1*2**8+
                       pref0*(bump2*2**16+bump1*2**15))
    need(rho0<2**15 and rho1<2**25 and rho2<2**38,'actual normalized rho C0--C2')
    left=[1,5,23]
    whole=[1,4,18]
    shifted=[1,4,18]
    cutoff=[1,2**17,2**36]
    normalizer=[2**15,2**25,2**38]
    t0=[left[m]+sum(comb(m,j)*cutoff[j]*whole[m-j] for j in range(m+1))
        for m in range(3)]
    f=[1+sum(comb(m,j)*normalizer[j] for j in range(m+1)) for m in range(3)]
    t0_round=[2,2**18,2**37]
    f_round=[2**16,2**26,2**39]
    need(all(a<=b for a,b in zip(t0,t0_round,strict=True)) and
         all(a<=b for a,b in zip(f,f_round,strict=True)), 'source pressure and normalization transfer')
    pressure_exponents=[17,44,76]
    need([a*b for a,b in zip(t0_round,f_round,strict=True)]==[2**k for k in pressure_exponents],
         'composed normalized pressure majorant exponents')
    psi=[3*t0_round[m]*sum(comb(m,j)*factorial(j) for j in range(m+1)) for m in range(3)]
    psi_exp=[3,21,41]
    need(all(a<=2**b for a,b in zip(psi,psi_exp,strict=True)),'actual weighted T1 potential majorants')
    # Bnorm contains R_*^4096; the C2 transfer costs at most R_*^4,
    # and the T1 transfer R_*^5. Constants fit the existing a,b budgets.
    need(max(pressure_exponents+psi_exp)<=2**16 and 5<=4096,
         'fixed transfer constants fit existing power budget')
    return {'implicitSFirst':s1,'implicitSSecond':str(s2),
            'bFirst':str(b1),'bSecond':str(b2),'squareStepFirst':sigma1,'squareStepSecond':sigma2,
            'chiFirst':chi1,'chiSecond':chi2,'rhoDerivatives':[rho0,rho1,rho2],
            'fixedRhoMassInverseUpper':inverse_mass,
            'gShiftMaximumConstants':shifted,'leftIntegralConstants':left,'wholeIntegralConstants':whole,
            'T0Coefficient':t0,'T0Rounded':t0_round,'normalizedInputCoefficient':f,
            'pressurePowerOfTwo':pressure_exponents,'pressurePowerOfM':[2,3,4],
            'T1PotentialPowerOfTwo':psi_exp,'T1PotentialPowerOfM':[3,4,5],
            'normsAreMaximumOfAllPartialsThroughOrder':True}


def check(g,native,repo,run,prior):
    c=chart(g,native,repo)
    aux=definitions(native,'expressionDefinitions')
    i=bind_t0(g,MEAN[0],aux[INITIAL_TAG+'_complete_gr'],aux[INITIAL_TAG+'_P'],
              aux[INITIAL_TAG+'_haar_gr'],'m3_aux_expression_partial',c)
    f=bind_t0(g,MEAN[1],native.expressions[FINAL_TAG+'_complete_gr'],native.expressions[FINAL_TAG+'_P'],
              native.expressions[FINAL_TAG+'_haar_gr'],'m3_coupled_expression_partial',c)
    need([i,f]==[prior['initialT0'],prior['finalT0']] and prior['strictExteriorVerified'],
         'independent exact T0 reread agrees with prior source/exterior proof')
    t1=temporal_integrals(g,native.expressions[TEMP_PSI]['body'],native.inverses[TEMP_INVERSE[1]],
                          'm3_coupled_inverse_partial')
    need(t1==prior['temporalExteriorSource']['T1'],'same actual realized T1 gauge body')
    program,cutoff_roots=verify_qbig(repo)
    exact_parameter_tree(program)
    return {'actualT0':[i,f],'actualT1':t1,'actualOriginalQbig':cutoff_roots,
            'phase':phase_tree(g),'radialEnvelopeComparison':envelope(g,program),
            'actualCutoffOperands':cutoff_operands(g,c),
            'rationalMajorants':majorants(),
            'remainingPressureInput':{'initialRawGr':i['formalGrBody'],'finalRawGr':f['formalGrBody'],
             'needed':'Actual common-reference C^m norm of their difference on the whole shell'},
            'remainingTemporalInput':{'needed':'Actual common-reference C^m norm of the desired axial native inverse velocity'},
            'actualWeightedUncutCAndPClosed':False,'finalJets':0,'release':'HOLD'}


def main():
    p=ArgumentParser(description=__doc__)
    for key in ('repo','artifact','pressure-receipt','out'):
        p.add_argument('--'+key,required=True,type=Path)
    a=p.parse_args()
    d,run,manifest,run_sha=read_artifact(a.artifact,True)
    receipt=a.pressure_receipt.read_bytes()
    need(sha256(receipt).hexdigest()==PRESSURE_RECEIPT,'pinned first corrected pressure exterior receipt')
    prior=json.loads(receipt)
    need(prior['graphSHA256']==manifest['node_stream_sha256'] and
         prior['registrySHA256']==manifest['definitions_sha256'],'same corrected graph and native registry')
    native=Native(d/'original-source-functions.json',manifest)
    pins=pin_sources(a.repo,run)
    name='research-ide/mathscope-m2/navier/actual-continuation-exact-support.mjs'
    src=git_blob(a.repo,run['executing_commit'],name)
    need(b'sigma=exp(-1/s^2)/(exp(-1/s^2)+exp(-1/(1-s)^2))' in src,
         'original square seed meaning of smooth step')
    pins[name]=sha256(src).hexdigest()
    with TemporaryFile() as backing:
        graph=Graph(d/'original-source-nodes.jsonl.gz',backing,manifest)
        result=check(graph,native,a.repo,run,prior)
    data={'schema':'MathScope.N7.CorrectedFirstPressureLowOrderTransfer/1',
          'sourceCommit':manifest['executing_commit'],'graphSHA256':manifest['node_stream_sha256'],
          'registrySHA256':manifest['definitions_sha256'],'hostedRunSHA256':run_sha,
          'sourceSHA256':pins,'pressureExteriorSHA256':PRESSURE_RECEIPT,**result}
    a.out.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
    print('PASS actual normalized T0 C0--C2 [2^17 M^2,2^44 M^3,2^76 M^4]; '
          'actual T1 potential [2^3 M^3,2^21 M^4,2^41 M^5]; M <= C12EnvelopeR')


if __name__=='__main__':
    main()

