"""Exact source replay for a dyadic temporal Fourier inverse bound."""
import argparse
from fractions import Fraction as F
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE.parent / name) for name in ('flat','flat-palette','f1-regularity')]
from bind_forced_cutoffs import Archive, GRAPH_SHA, PRODUCER_COMMIT, REGISTRY_SHA, digest, git_blob, pinned_json
from check_fixed_path import Nodes
from check_palette import ELL, R, T, Y0, Y1, Z, Source, add, atom, exp, floor, inv, log, mul, num, pow_nat, sqrt, sub

MEAN_SHA = '93ae463e259c7937a78c3ae3cc0eccb57e20e7dd36fd7398bb41554ac59d4fb0'
CURRENT = 'research-ide/mathscope-m3/navier/evidence/global-current-20261012/attempt1/global-current.json'
CURRENT_SHA = '8d64f045a4fc87167c8444b11c4e6cb2b8ea89a5eb53f846d31c90c15e8a7f1e'
COMMON = ('research-ide/mathscope-m3/navier/evidence/global-source-class-composition-20261012/'
          'attempt382972107731/actual-common-C4-family.json')
COMMON_SHA = 'c7a04cc4b3dee16031e04d1dbbccfe71f5eeb715832fc2deeb5d668dd0120d05'
CI, BASE_ELL, INDEX, TG, VT0, Q, S = 635063, 635046, 635056, 300172, 623067, 622794, 622795


def pins(repo):
    m3 = 'research-ide/mathscope-m3/'
    checks = {
        m3+'navier/source-global-pressure.mjs': [b'baseEll=G.sub(ell,q(2)),baseIndex=paletteIndex(baseEll)',
                                               b'ci=G.mul(power(Tg,baseIndex),power(band.geometry.Q,G.add(G.one,h)))'],
        m3+'navier/source-auxiliary-fourier.mjs': [b'm=k1-k0,n=k0,integerNorm=m*m-2n*n*n',
                                                b'G.q(4),integral', b'G.div(divisor.reciprocal,coefficient.twoPi)'],
        m3+'navier/source-coupled-expressions.mjs': [b'finiteSumDeclaredEqualToLimit:false', b"node('m3_coupled_inverse_partial'"],
        m3+'navier/source-temporal-potential.mjs': [b'deltaV=G.neg(G.div(inverseTheta,ci))',
                                                  b'gammaDesired=G.neg(G.div(inverseZ,ci))'],
        m3+'navier/source-temporal-class-kernel.mjs': [b'baseDesiredInputOrder:m+4',
                                                     b'actualRadialVelocityInputOrder:m+5'],
        m3+'post-signed-20261023/source-signed-actual-temporal-inverse.mjs': [b'body,Y,cutoff:1,derivativeOrders:[0,1]',
                                                                           b'source=[...frontier.centered]'],
    }
    result = {}
    for path, markers in checks.items():
        raw = git_blob(repo,PRODUCER_COMMIT,path)
        assert all(marker in raw for marker in markers),path
        result[path] = digest(raw)
    return result


def git_record(repo,path,expected):
    raw = git_blob(repo,PRODUCER_COMMIT,path)
    assert digest(raw) == expected
    return json.loads(raw)


def check_geometry(graph,src):
    ell, h = atom('coordinate',ELL), atom('parameter','h')
    sqrt2, log2 = sqrt(num(2)), log(num(2))
    tg = add(num(4),sqrt2)
    log_tg = log(tg)
    base = sub(ell,num(2))
    x = mul(sub(mul(add(num(1),h),base,log2),mul(num(2),log(base))),inv(log_tg))
    i0 = floor(x)
    q = exp(mul(num(-1),ell,log2))
    ci = mul(exp(mul(i0,log_tg)),exp(mul(add(num(1),h),log(q))))
    for root,want in ((TG,tg),(VT0,sub(sqrt2,num(1))),(Q,q),(S,pow_nat(ell,2)),
                      (BASE_ELL,base),(INDEX,i0),(CI,ci)):
        src.exact(root,want)
    assert graph.node(CI)[0]=='multiply'
    assert graph.op(Y0,'coordinate')[0].startswith('global_common_auxiliary_y0$')
    assert graph.op(Y1,'coordinate')[0].startswith('global_common_auxiliary_y1$')


def check_haar_center(graph,centered):
    raw,negative_mean = graph.op(centered,'add')
    sign,mean = graph.op(negative_mean,'multiply')
    assert graph.op(sign,'rational') == ['-1','1']
    inner,last,zero,one = graph.op(mean,'definite_integral')
    assert [last,zero,one]==[Y1,0,1]
    assert graph.op(inner,'definite_integral')==[raw,Y0,0,1]
    return raw,mean


def check_pair(graph,src,definition,j,mean_scopes):
    params = [R,Z,T,ELL,Y0,Y1]
    directions = [R,Z,T,Y0,Y1]
    axes = [Y0,Y1]
    assert definition['Y'] == axes
    assert definition['parameters'] == params and definition['directions'] == directions
    assert definition['directionParameterIndices'] == [0,1,2,4,5]
    assert definition['operator'] == '(sqrt(2)-1)*partial_y0+partial_y1'
    assert definition['zeroMode'] == 'The exact normalized Haar mean is projected out.'
    assert not definition['finiteSumDeclaredEqualToLimit']
    assert [definition[k] for k in ('coefficientProducer','partialSumProducer','tailProducer')] == [
        'source-auxiliary-fourier.mjs:actualFourierCoefficient',
        'source-auxiliary-fourier.mjs:finiteAuxiliaryInverse','source-auxiliary-fourier.mjs:auxiliaryInverseTail']
    source = mean_scopes[f'centeredTemporalSource_{j}']
    inverse = mean_scopes[f'temporalInverse_{j}']
    assert source['physicalThetaIndependent'] and inverse['physicalThetaIndependent']
    assert sorted(params) == source['freeCoordinatesUpperSet'] == inverse['freeCoordinatesUpperSet']
    root,body = inverse['node'],source['node']
    assert definition['body'] == body
    assert graph.op(root,'m3_coupled_inverse_partial') == [definition['id'],params,[0]*len(directions)]
    raw,haar = check_haar_center(graph,body)
    desired = [4417272,4417274][j]
    ci_opaque,u = atom('positive_ci'),atom('exact_inverse',j)
    src.exact(desired,mul(num(-1),u,inv(ci_opaque)),aliases={CI:ci_opaque,root:u})
    return {'component':['theta','z'][j],'system':definition['id'],'body':body,'rawResidual':raw,
            'haar':haar,'exactInverse':root,'desiredMeanIncrement':desired,'arguments':params,
            'directions':directions}


def exact_controls():
    # Finite normalization checks supplement the unbounded integer argument.
    shells = 192
    modes = 0
    min_integer_norm = None
    for k0 in range(-shells,shells+1):
        for k1 in range(-shells,shells+1):
            n = max(abs(k0),abs(k1))
            if n == 0:
                continue
            u,v = k1-k0,k0
            qnorm = abs(u*u-2*v*v)
            assert qnorm >= 1 and abs(u)<=2*n and abs(v)<=n
            min_integer_norm = qnorm if min_integer_norm is None else min(min_integer_norm,qnorm)
            modes += 1
    assert modes == (2*shells+1)**2-1 and min_integer_norm==1
    pell = []
    u,v = 1,0
    for j in range(1,49):
        u,v = u+2*v,u+v
        qnorm = u*u-2*v*v
        assert qnorm == (-1)**j
        if j in (1,2,4,12,24,48):
            pell.append({'power':j,'mode':[v,u+v],'quadraticNorm':qnorm})
    # All inequalities are checked by fractions, using elementary exact
    # bounds for the analytic roots proved in README.
    pi_lower = 4*sum((F((-1)**i,2*i+1) for i in range(8)),F(0))
    assert pi_lower > 3
    assert F(33,32)**32 > 2
    assert F(3,2)**2 > 2
    d_upper = F(7,2)
    ci_inverse_upper = F(11,2)*F(33,8)
    assert ci_inverse_upper==F(363,16)
    # Bessel sqrt(2) and spacing constants are retained before rationalization.
    tail_square_upper = F(256,3)*d_upper**2
    full_square_upper = 21+tail_square_upper
    assert 2*tail_square_upper < 46**2
    assert 2*full_square_upper < 47**2
    full_constant = F(47,6**3)*ci_inverse_upper
    tail_constant = F(46,6**3)*ci_inverse_upper
    assert tail_constant<full_constant<5
    return {'modesChecked':modes,'finiteBoxRadius':shells,'quadraticNormMinimum':min_integer_norm,
            'PellWitnesses':pell,'piLowerRational':str(pi_lower),'ciInverseOverSStrictUpper':str(ci_inverse_upper),
            'fullConstantStrictUpper':str(full_constant),'tailConstantStrictUpper':str(tail_constant)}


def main(args):
    sources = pins(args.repo)
    current = git_record(args.repo,CURRENT,CURRENT_SHA)['source']
    common = git_record(args.repo,COMMON,COMMON_SHA)
    h = common['selector']['positiveSourceH']
    assert h['hExact'] == {'exp':{'product':[{'integer':-8002},{'ref':'T'}]}}
    assert h['hExpression']=='exp(-8002*(exp(1048576)+10))' and h['upperBoundExact']=='2^-4096'
    assert current['domain']['prefixOrder']==1 and current['domain']['referenceChart'].endswith('1/2<=s<=2.')
    assert current['sourceBand']['geometry']['Tg']==TG and current['sourceBand']['geometry']['ell']==ELL
    assert current['sourceBand']['geometry']['Q']==Q and current['sourceBand']['geometry']['S']==S
    assert current['sourceBand']['sourceBinding']['parameterExpressionSHA256']==h['parameterExpressionSHA256']
    mean = pinned_json(HERE.parent/'f1-mean'/'mean-angle-scope.json',MEAN_SHA)
    assert len(mean['rootScopes'])==58 and mean['graphSHA256']==GRAPH_SHA and mean['registrySHA256']==REGISTRY_SHA
    assert mean['sourceCommit']==PRODUCER_COMMIT
    registry = pinned_json(args.graph_dir/'original-source-functions.json',REGISTRY_SHA)
    definitions = json.loads(registry['definitions'])[2]
    with TemporaryFile() as backing:
        graph = Archive(args.graph_dir/'original-source-nodes.jsonl.gz',backing)
        src = Source(Nodes(graph))
        check_geometry(graph,src)
        pairs = [check_pair(graph,src,definition,j,mean['rootScopes']) for j,definition in enumerate(definitions)]
        assert len(pairs)==2
        try:
            check_pair(graph,src,dict(definitions[0],Y=[Y1,Y0]),0,mean['rootScopes'])
        except AssertionError:
            controls = ['reversed native torus direction arguments']
        else:
            raise AssertionError('wrong torus orientation accepted')
        alias = atom('inverse')
        genuine = src.normalize(4417272,aliases={4311889:alias})
        wrong = mul(num(-1),alias,inv(src.normalize(623025)))
        assert genuine != wrong
        controls.append('own band ci substituted for common ci0')
    control = exact_controls()
    out = {'schema':'MathScope.OriginalTemporalDyadicRegularity/1','sourceCommit':PRODUCER_COMMIT,
           'sourcePins':sources,'graphSHA256':GRAPH_SHA,'registrySHA256':REGISTRY_SHA,
           'meanAngleScopeReceiptSHA256':MEAN_SHA,'originalCurrentReceiptSHA256':CURRENT_SHA,
           'commonFamilyC4ReceiptSHA256':COMMON_SHA,
           'verified':{'archivedTemporalBindings':pairs,'commonIndex':INDEX,'baseEll':BASE_ELL,
                       'commonCi':CI,'direction':[VT0,1],'Tg':TG,'referenceBand':ELL,'S':S,
                       'hExpression':h['hExpression'],'integerFrequencyControls':control,
                       'dyadicTailRate':'K^-1 for all integer K>=1 under the stated input norm',
                       'requiredInputDerivativeOrder':{'C1Desired':3,'C2Desired':4},
                       'coarseDesiredOperatorConstant':'5*S',
                       'coarseDesiredTailConstant':'5*S/K'},
           'negativeControlsRejected':controls,
           'conditional':'Each actual residual must be jointly C^(m+2) in the fixed own slow/common-Y chart, smooth periodic to the required order, with the displayed actual two-axis derivative norm. The positive ci0 and fixed labels use ell-2>=8.',
           'open':['Actual archived and repaired C3/C4 residual seminorms, slow/shell derivative definedness and flat joins.',
                   'Full T1/A1 radial and weighted cutoff class and repaired second-stage forcing.']}
    args.output.write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
    print('PASS 2 archived inverses, exact common normalization, 148224 integer modes, 2 controls')
    print(f'{digest(args.output.read_bytes())}  {args.output.name}')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    for flag in ('repo','graph-dir','output'):
        p.add_argument('--'+flag,type=Path,required=True)
    main(p.parse_args())
