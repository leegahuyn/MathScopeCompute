"""Bind the original active-N3 whole FiveMap integral to its two scaled bumps."""
from argparse import ArgumentParser
from fractions import Fraction
from functools import cache
from hashlib import sha256
from pathlib import Path
import json
import subprocess
import sys


ORIGINAL = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
MANIFEST_PIN = '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a'
MOMENT_PIN = '0d02d55b291db8c55db26810ae4783d62e09ac3d058fd582f4161cb444871e46'


def bind(graph, native, repo):
    def expect(index, operation, operands):
        assert graph.args(index, operation) == operands, (index, operation)

    def q(i, value):
        assert graph.rational(i) == value

    for index,value in ((0,0),(1,1),(19,Fraction(1,2)),(20,-1),(24,2),(669,10),(4708,Fraction(1,5))):
        q(index,value)
    ell, R, Z, T = 17732737,17732748,17732749,17732750
    for index in (ell,R,Z,T):
        graph.args(index,'coordinate')
    s, x0, e = 17732766,17743687,71672
    # s is the original monotone coordinate inverse with only slow Z,T arguments.
    expect(s,'actual_monotone_root',[2,Z,T])
    inverse = json.loads(native.base_snapshot['base']['monotone'])[2]
    assert inverse['name'] == 'ActualCommonBandSlowInverse'
    assert inverse['parameters'] == [Z,T]
    assert [inverse['left'],inverse['right']] == [19,24]
    expect(17732771,'log_positive',[s])
    expect(17743688,'sqrt_positive',[s])
    expect(23,'add',[9,19])
    expect(281,'multiply',[20,23])
    expect(17732887,'multiply',[281,17732771])
    expect(17732888,'exp',[17732887])
    expect(17743683,'source_parameter',['X0Imean'])
    expect(17743684,'multiply',[24,17743683])
    expect(17743685,'sqrt_positive',[17743684])
    expect(17743686,'exp',[19])
    expect(x0,'multiply',[17743685,17743686])
    expect(17744653,'inverse',[x0])
    expect(e,'exp',[4708])
    expect(17744840,'inverse',[e])
    expect(17744826,'inverse',[17743688])
    expect(17744827,'multiply',[R,17744826])
    expect(17744854,'multiply',[17744827,17744840])

    def bump(inner, base):
        # The same guarded smooth profile of 10*(R/(sqrt(s)*x0*E^j)-1).
        for i, op, args in [
            (base,'multiply',[17744653,inner]),
            (base+1,'add',[20,base]),
            (base+2,'multiply',[669,base+1]),
            (base+3,'multiply',[20,base+2]),
            (base+4,'add',[1,base+3]),
            (base+5,'multiply',[base+2,base+4]),
            (base+6,'inverse',[base+5]),
            (base+7,'multiply',[20,base+6]),
            (base+8,'exp',[base+7]),
            (base+9,'smooth_piecewise',[base+2,0,1,0,base+8,0]),
            (base+10,'multiply',[17744653,base+9]),
        ]:
            expect(i,op,args)

    bump(17744827,17744828)
    bump(17744854,17744855)
    expect(17744839,'multiply',[17732888,17744838])
    expect(17744866,'multiply',[17744840,17744865])
    expect(17744867,'multiply',[17732888,17744866])

    # Read actual c0 and c1, including the original common Jtheta target.
    jtheta, jtheta_args, jtheta_order = native.application(
        graph,22151577,'ActualSignedAfterTemporalUpdatedPressure_Jtheta')
    assert jtheta['parameters'] == jtheta_args == [ell,Z,T] and jtheta_order == [0]*3
    assert jtheta['body'] == 22151576
    expect(17744802,'add',[1,17744801])
    expect(17744801,'multiply',[20,17744725])
    expect(17744803,'inverse',[17744732])
    expect(17744805,'inverse',[17744802])
    expect(17744807,'multiply',[e,17744802])
    expect(17744808,'inverse',[17744807])
    expect(22151889,'multiply',[17744712,22151577])
    expect(22151893,'multiply',[20,22151889])
    expect(22151920,'multiply',[17744803,22151893])
    expect(22151921,'multiply',[17744805,22151920])
    expect(22151922,'multiply',[17744808,22151920])
    expect(22151923,'multiply',[20,22151922])
    expect(22151942,'multiply',[17744839,22151921])
    expect(22151943,'multiply',[17744867,22151923])
    expect(22151944,'add',[22151942,22151943])

    # Constants and binder-local coordinates do not become free R slots.
    @cache
    def free_coordinates(index):
        row = graph.record(index)
        op, args = row['op'], row['args']
        if op == 'coordinate':
            return {index}
        if op in ('rational','source_parameter'):
            return set()
        if op == 'actual_monotone_root':
            assert index == s and args == [2,Z,T]
            return {Z,T}
        if op == 'm3_coupled_expression_partial':
            assert index == 22151577 and args[1] == jtheta_args
            return set(jtheta_args)
        if op == 'definite_integral':
            integrand,bound,lower,upper = args
            return ((free_coordinates(integrand) - {bound}) |
                    free_coordinates(lower) | free_coordinates(upper))
        if op in ('integer_power','source_step_derivative'):
            return free_coordinates(args[0])
        assert op in ('add','multiply','inverse','exp','log_positive','sqrt_positive',
                      'smooth_piecewise'), (index,op)
        return set().union(*(free_coordinates(child) for child in args))

    assert free_coordinates(22151921) == free_coordinates(22151923) == {ell,Z,T}
    assert free_coordinates(17744839) == free_coordinates(17744867) == {R,Z,T}
    assert free_coordinates(17743711) == free_coordinates(17743713) == set()

    app, params, orders = native.application(graph,22151948,'PostSignedFiveBump_gamma')
    assert app['body'] == 22151944 and app['parameters'] == [ell,R,Z,T]
    assert params == [ell,22151946,Z,T] and orders == [0]*4
    expect(22151949,'multiply',[22151946,22151948])
    expect(22151951,'definite_integral',[22151949,22151946,17743711,17743713])
    expect(17743711,'sqrt_positive',[3617])
    expect(3617,'source_parameter',['Xa'])
    expect(17743713,'multiply',[24,17743712])
    expect(17743712,'sqrt_positive',[28826])

    class ShellGraph:
        args = graph.args

        @staticmethod
        def node(index):
            row = graph.record(index)
            return row['op'], row['args']

    from prove_five_whole import verify_shell
    fixed_shell = verify_shell(
        ShellGraph(),repo,{'inner':17743711,'outer':17743713},center=x0)
    return {
        'sourceStream':graph.verify,
        'actualRoots':{'whole':22151951,'gammaBody':22151944,'weightedIntegrand':22151949,
                       'radiusBinder':22151946,'scale':s,'x0':x0,'dilation':e,
                       'coefficients':[22151921,22151923],'profileCopies':[17744839,17744867],
                       'fixedLimits':[17743711,17743713],'postTemporalJtheta':22151577},
        'coefficientFreeSlots':['ell','Z','T'],
        'wholeLimitFreeChartSlots':[],
        'nativeInverseBracket':['1/2','2'],
        'exactOriginalShell':fixed_shell,
        'exactCoefficientCancellation':'c1=-c0/E, E=exp(1/5)',
        'fullWeightedProfileMoments':'M1=E*M0 by R=E*u on the dilated copy',
        'supportConditions':['sqrt(Xa) <= sqrt(s)*x0',
                             '(11/10)*sqrt(s)*E*x0 <= 2*sqrt(Xb)'],
        'otherPremises':['s>0 and x0>0 on the active original chart',
                         'nonzero original coefficient denominators',
                         'well-defined ordinary native integral on the same fixed chart'],
        'wholeIntegralOnAdmittedSupports':'c0*M0 + c1*M1 = 0',
        'uniformOnAdmittedNativeInverseImage':True,
        'supportLowerProof':'s*x0^2 >= e*X0Imean > Xa',
        'supportUpperProof':'(11/10)^2*s*E^2*x0^2 < 4*exp(3)*X0Imean < 4*Xb',
    }


def main():
    cli = ArgumentParser(description=__doc__)
    for name in ('reader','repo','goal','artifact','scratch','out'):
        cli.add_argument('--'+name,type=Path,required=True)
    args = cli.parse_args()
    sys.path.insert(0,str(args.reader))
    sys.path.insert(0,str(args.goal/'first-gauge'))
    from source_stream import Native, SourceStream, read, MANIFEST

    source_path = 'research-ide/mathscope-m3/navier/source-global-moment.mjs'
    original = subprocess.check_output(['git','-c','safe.directory='+args.repo.as_posix(),
        '-C',str(args.repo),'show',ORIGINAL+':'+source_path])
    assert sha256(original).hexdigest() == MOMENT_PIN
    assert b'axial-velocity-moment' in original
    manifest, _ = read(args.artifact/MANIFEST,MANIFEST_PIN)
    native = Native(args.artifact,manifest)
    with SourceStream(args.artifact,manifest,22153782,args.scratch) as graph:
        r = bind(graph,native,args.repo)

    # Smooth-piece polynomial control with support [1,11/10]. The second
    # copy is disjoint there since exp(1/5) >= 1+1/5 > 11/10.
    mass0 = sum(Fraction(coef,10) * (Fraction(1,k+1) + Fraction(1,10*(k+2)))
                for k,coef in ((2,1),(3,-2),(4,1)))
    assert mass0 == Fraction(7,2000)
    r.update({'schema':'MathScope.N7.ActualN3WholeFiveMapMoment/1',
              'status':'CONDITIONAL_ACTUAL_FIVE_MAP_WHOLE_MOMENT_CANCELLATION',
              'githubRun':44582875351,'sourceCommit':ORIGINAL,'originalMomentSHA256':MOMENT_PIN,
              'truncationControl':{'window':'[1,11/10]','profile':'u^2*(1-u)^2 for 0<u<1',
                 'signedWholeValue':str(mass0),'originalProfileCounterexample':False},
              'wholeGauge':'OPEN','finalJets':0,'release':'HOLD'})
    with args.out.open('x',encoding='utf-8',newline='\n') as handle:
        json.dump(r,handle,indent=2)
        handle.write('\n')
    print(r['status'],r['truncationControl']['signedWholeValue'])


if __name__ == '__main__':
    assert __debug__
    main()
