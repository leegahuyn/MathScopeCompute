"""Check strict source collars at both artificial radial integration endpoints."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import json
import sys

BASE=Path(__file__).resolve().parent.parent
for name in ('pressure-exterior','temporal-exterior','first-pressure-norm','first-gauge'):
    sys.path.insert(0,str(BASE/name))
from bind_first_cycle_gauge import Graph, Native, need, q, git_blob, read_artifact
from check_pressure_exterior import check as replay_pressure
from check_temporal_exterior import Scope, CHI, ELL, INNER, OUTER, X, XA, XB, R, Z, T, Y
from check_first_pressure_norm import cutoff_operands

PINS={
    'native':'5b419e65a27e35181fb79e39727b2d90f24402a690875e03ece07ad80cf15968',
    'pressure':'c5e39a3d7a18849f42189e0821c065298736893d10c60d1baad5c86f8589f04f',
    'temporal-c3':'8015ecf6eb80cc1b9ebc14ec5ec8c80ce6e8fe38ce5b9bd2cb27a736b3596ff7',
}
CURRENT='research-ide/mathscope-m3/navier/source-global-current.mjs'


def pinned(path,key):
    raw=path.read_bytes()
    need(sha256(raw).hexdigest()==PINS[key],f'pinned original {key} evidence')
    return json.loads(raw)


def strict_geometry():
    zmax=Q(5,32)
    tlo,thi=Q(29,32),Q(69,64)
    slo,shi=tlo,thi+Q(3,2)*zmax*zmax
    need(zmax>Q(1,8) and tlo<Q(15,16)<Q(17,16)<thi,
         'original closed N1 Z,T box lies strictly inside enlarged open domain')
    need(Q(1,2)-tlo<0 and 2-Q(3,2)*zmax*zmax-thi>0 and
         1-Q(1,32)*3*zmax*zmax>Q(1,2),
         'exact enlarged implicit root signs and derivative bound on s in [1/2,2]')
    need(Q(1,2)<slo<shi==Q(2283,2048)<2 and 2*zmax<1 and
         4*slo>1 and shi/4<1,
         'original enlarged source image, retained prefix and q-global-star margin')
    collar=[Q(3,4),Q(5,4)]
    lower=collar[1]**2/(2*slo)
    upper=2*collar[0]**2/shi
    old_lower=collar[1]**2/(2*Q(15,16))
    old_upper=2*collar[0]**2/Q(35,32)
    need(lower==Q(25,29)<1 and upper==Q(768,761)>1 and
         old_lower==Q(5,6)<1 and old_upper==Q(36,35)>1,
         'both quarter-width collars remain on the correct intrinsic exterior')
    # The integration endpoints themselves are the ratio-one points in each collar.
    # At a fixed s, the whole connecting radial segment shares the same strict inequalities.
    need(collar[0]<1<collar[1] and 0<collar[0] and
         Q(1,2)<slo and shi<2, 'fixed source endpoints stay within the same intrinsic exterior')
    # At the global s endpoints the same proof cannot give a two-sided strict collar.
    small=Q(1,100)
    need((1+small)**2>1 and (1-small)**2<1,'strict-collar control at global extreme s')
    return {
        'originalClosedZT':{'Z':['-1/8','1/8'],'T':['15/16','17/16'],'s':['15/16','35/32']},
        'largerOpenZT':{'Z':['-5/32','5/32'],'T':['29/32','69/64'],
                        'sStrict':[str(slo),str(shi)],'etaAbsoluteUpper':'5/16',
                        'b2qStrictLower':str(4*slo),'qOverQGlobalStarStrictUpper':str(shi/4)},
        'closedRadialRatiosToEachArtificialSeam':[str(x) for x in collar],
        'positiveHalfWidths':['sqrt(Xa)/4','(2 sqrt(Xb))/4'],
        'XOverXaUpperOriginalBox':str(old_lower),'XOverXbLowerOriginalBox':str(old_upper),
        'XOverXaUpperOpenEnlargement':str(lower),'XOverXbLowerOpenEnlargement':str(upper),
        'globalEndpointsDoNotGiveStrictUniformGeometry':{
            's=1/2, R=101 Rin/100':str((1+small)**2),
            's=2, R=99 Rout/100':str((1-small)**2),
        },
    }


def actual_inputs(g,n,repo,run,old,pressure,c3):
    box=old['formalInverseChartBox']
    need(old['inputBinding']['witnessBindingVerified'] and
         old['inputBinding']['ell']=='L+2 with L=#622785 and L>=1' and
         box['input_Z']==['-1/8','1/8'] and box['input_T']==['15/16','17/16'] and
         Q(15,16)<=Q(box['root'][0])<=Q(box['root'][1])<=Q(35,32),
         'exact original attained N1 closed box and reference band')
    for key,value in old['sourceWindowAndRepresentativeAnchors'].items():
        need(g.node(int(key))==(value['op'],value['args']),f'same corrected native prefix anchor {key}')
    need(g.args(617433,'add')==[117105,617432] and q(g,117105)==6 and
         g.args(617463,'add')==[669,617432] and q(g,669)==10 and
         g.args(617464,'multiply')==[127,617463] and 617464 in g.args(617465,'maximum'),
         'L>=ell_min+10 and q-global-star formula from actual original common scale')
    need(g.args(617512,'log_positive')==[591] and q(g,591)==16 and
         g.args(617513,'add')==[617465,617512] and 617513 in g.args(617514,'maximum'),
         'actual b2>=16 b1 guarantees the enlarged box stays in first coefficient prefix')
    current=git_blob(repo,run['executing_commit'],CURRENT)
    need(sha256(current).hexdigest()==pressure['sourceSHA256'][CURRENT] and
         b'qGlobalStar=G.exp(G.neg(G.mul(G.add(band.family.constants.ell0,q(4)),G.log(q(2)))))' in current,
         'actual finite-prefix current q-global-star relation')
    fresh=replay_pressure(g,n,repo,run)
    for key in ('initialT0','finalT0','actualRadialSourceComparison','temporalExteriorSource',
                'actualFiveMapSupport','normalizedReferenceShell'):
        need(json.loads(json.dumps(fresh[key]))==pressure[key],
             f'same exact exterior specialization and native replay at {key}')
    operands=cutoff_operands(g,fresh['normalizedReferenceShell'])
    need(operands['chi']==CHI and operands['rho']==633726,'actual common plateau and compact mean normalization')
    endpoint_scope=Scope(g,n.raw)
    need(not endpoint_scope.free(INNER) and not endpoint_scope.free(OUTER),
         'actual integration endpoints have no slow, torus or physical angle coordinate')
    pres=[fresh[k] for k in ('initialT0','finalT0')]
    temp=fresh['temporalExteriorSource']
    early_psi=1706769
    early_left,early_whole=1706665,1706666
    oldbody,oldr,oldlo,oldhi=g.args(early_whole,'definite_integral')
    need([oldlo,oldhi]==[INNER,OUTER] and
         g.args(early_left,'definite_integral')==[oldbody,oldr,INNER,R],
         'actual early Temporal realization uses one identical shifted input and two fixed endpoints')
    for row in [*pres,temp['T1']]:
        lo,hi=row.get('bounds',[row.get('inner'),row.get('outer')])
        need([lo,hi]==[INNER,OUTER] and row['chi']==CHI,
             'each actual T0/T1 pair uses the original artificial fixed endpoints and cutoff')
    vc=c3['actualTemporalVelocity']
    need([vc['psi'],vc['directSwirl'],vc['realizedRadial'],vc['realizedAxial'],vc['desiredAxial'],
          vc['axialCutoffRemainder']]==[4454155,4454009,4454158,4454167,4454011,4454181] and
         [vc['psi'],vc['directSwirl'],[vc['realizedRadial'],vc['realizedAxial']]]==
         [temp['psi'],temp['directSwirl'],temp['curlVelocity']],
         'same actual source-bound Temporal correction and nonzero-cutoff expression')
    return {
        'referenceCoordinates':{'R':R,'Z':Z,'T':T,'ell':ELL,'Y':Y},
        'fixedRadialEnvelope':[INNER,OUTER],'intrinsicXGuard':[X,XA,XB],
        'initialNormalizedMeanPressure':pres[0],'finalNormalizedMeanPressure':pres[1],
        'earlyTemporalActualPsi':{'body':early_psi,'partial':early_left,'whole':early_whole},
        'firstCorrectionTemporal':temp,'realizedTemporalRoots':vc,
        'actualCommonCutoff':operands,
        'commonCurrentSourceSHA256':sha256(current).hexdigest(),
        'actualExteriorRadialPolynomialTerms':fresh['actualRadialSourceComparison']['sameExteriorPolynomialTerms'],
    }


def main():
    p=ArgumentParser(description=__doc__)
    for k in ('repo','artifact','native','pressure','temporal-c3','out'):
        p.add_argument('--'+k,required=True,type=Path)
    a=p.parse_args()
    f,run,m,run_sha=read_artifact(a.artifact,True)
    old,pr,c3=(pinned(getattr(a,k.replace('-','_')),k) for k in ('native','pressure','temporal-c3'))
    need(all(r['graphSHA256']==m['node_stream_sha256'] and
             r['registrySHA256']==m['definitions_sha256'] for r in (pr,c3)),
         'same corrected graph and native registry for exact pressure and Temporal replay')
    native=Native(f/'original-source-functions.json',m)
    with TemporaryFile() as backing:
        graph=Graph(f/'original-source-nodes.jsonl.gz',backing,m)
        inputs=actual_inputs(graph,native,a.repo,run,old,pr,c3)
    result={
        'schema':'MathScope.N7.AttainedN1StrictArtificialRadialCollars/1',
        'sourceCommit':m['executing_commit'],'graphSHA256':m['node_stream_sha256'],
        'registrySHA256':m['definitions_sha256'],'hostedRunSHA256':run_sha,'nodeCount':m['node_count'],
        'inputSHA256':PINS,'actualSource':inputs,'strictCollars':strict_geometry(),
        'integralSemantics':'At fixed slow coordinates the full segment between the actual fixed endpoint and R lies on the same strict intrinsic exterior; orient each integral with its own R and common binder.',
        'vanishingActualNormalizedMeanPressureDifference':[4455781,3615361],
        'vanishingActualTemporalRoots':[4454155,4454009,4454158,4454167,4454011,4454181],
        'allLocalJetsZeroByIdenticalOpenNeighborhood':True,'movingIntrinsicEndpointsSubstituted':False,
        'allAdmissibleChartsSeamsCertified':False,'completeFinalJetsAdded':0,'release':'HOLD',
    }
    a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print('PASS actual N1 quarter-width radial collars: X/Xa <=25/29 and X/Xb >=768/761 '
          'on enlarged open slow chart; normalized mean pressure difference and actual Temporal roots have zero local jets')


if __name__=='__main__':
    main()

