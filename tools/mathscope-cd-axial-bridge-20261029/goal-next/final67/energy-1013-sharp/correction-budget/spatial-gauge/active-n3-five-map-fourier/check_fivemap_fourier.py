"""Exact Cartesian angular comparison for the same-live post-Signed FiveMap increment."""
from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from hashlib import sha1,sha256
from pathlib import Path
import json

PINS = {
    'registry':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'livePrefix':'7b070da91d4ecb58df0cfa775c9b56be3cd9ceb10fcba0d7189fa8978e040775',
    'ingress':'20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f',
    'whole':'3e7be0b196440736e725849634700bbaf11620f1b6177fd3566c911cd493393c',
    'occurrences':'c1fff7407662f69d865c49608edccb3da890f89f747767fb33012ca64f49bdee',
    'live-source-pins':'3f57354aca3da79d475e0bd0605ece51c36cf2633e7744cee35d59efe874b3f7',
    'five-source.mjs':'22976ece2c801beb9e51045820749cc077ddf2c198e364f2033a53789989466d',
    'binding.mjs':'5f83192211b649526a2616421a68c9e53004ace96776243e55e37b0a6973cf39',
    'pde.mjs':'d93195ac381c75860e5d450a77ad3160ade16ca4579f4988dc38948e504163de',
}


def atom(real=0,imag=0,k=0,v=()):
    return {(k,v):(Q(real),Q(imag))} if real or imag else {}


def add(*objects):
    terms=defaultdict(lambda:(Q(0),Q(0)))
    for item in objects:
        for key,(a,b) in item.items():
            x,y=terms[key]
            terms[key]=(x+a,y+b)
    return {k:xy for k,xy in terms.items() if any(xy)}


def mul(left,right):
    terms=defaultdict(lambda:(Q(0),Q(0)))
    for (k,v),(a,b) in left.items():
        for (l,w),(c,d) in right.items():
            key=(k+l,tuple(sorted(v+w)))
            x,y=terms[key]
            terms[key]=(x+a*c-b*d,y+a*d+b*c)
    return {k:xy for k,xy in terms.items() if any(xy)}


def scale(a,obj):
    return mul(atom(a),obj)


def project(obj,K):
    return {(mode,v):ab for (mode,v),ab in obj.items() if abs(mode)<=K}


def mean(obj,N=None):
    return add(*(atom(a,b,v=v) for (k,v),(a,b) in obj.items()
                 if k==0 or (N is not None and k%N==0)))


def square(a):
    return mul(a,a)


def matmul(A,B):
    return [[add(*(mul(a,b) for a,b in zip(row,col,strict=True))) for col in zip(*B,strict=True)]
            for row in A]


def spectrum():
    cos=add(atom(Q(1,2),k=-1),atom(Q(1,2),k=1))
    sin=add(atom(imag=Q(1,2),k=-1),atom(imag=-Q(1,2),k=1))
    rot=[[cos,scale(-1,sin),{}],[sin,cos,{}],[{},{},atom(1)]]
    rtr=[list(col) for col in zip(*rot,strict=True)]
    vars={v:atom(1,v=(v,)) for v in ('b','v','g','br','vr','gr','bz','vz','gz','boverr','voverr')}
    b,v,g,br,vr,gr,bz,vz,gz,boverr,voverr=vars.values()
    source_G=[[br,scale(-1,voverr),bz],[vr,boverr,vz],[gr,{},gz]]
    physical_G=matmul(matmul(rot,source_G),rtr)
    G_entries=[x for row in physical_G for x in row]
    modes=lambda expr:sorted({k for k,_ in expr})
    assert all(modes(x)==[-2,0,2] for row in physical_G[:2] for x in row[:2])
    assert all(modes(physical_G[i][2])==modes(physical_G[2][i])==[-1,1] for i in range(2))
    assert modes(physical_G[2][2])==[0]
    traceless_a=scale(Q(1,2),add(br,scale(-1,boverr)))
    traceless_b=scale(Q(1,2),add(vr,scale(-1,voverr)))
    high=[add(x,scale(-1,project(x,1))) for x in G_entries]
    removed=scale(2,add(square(traceless_a),square(traceless_b)))
    assert add(*(square(x) for x in high))==removed
    assert add(*(mul(project(x,1),y) for x,y in zip(G_entries,high,strict=True)))=={}
    assert add(*(square(x) for x in G_entries))==add(*(square(x) for row in source_G for x in row))
    assert all(project(x,2)==x for x in G_entries)
    biases=[]
    h_bias=scale(Q(1,2),add(square(traceless_a),scale(-1,square(traceless_b))))
    for j,x in enumerate(G_entries):
        assert mean(square(x),5)==mean(square(x))
        d=add(mean(square(x),4),scale(-1,mean(square(x))))
        target=h_bias if j in (0,4) else scale(-1,h_bias) if j in (1,3) else {}
        assert d==target,j
        biases.append(d)
    assert add(*biases)=={}
    assert h_bias
    velocity=matmul(rot,[[b],[v],[g]])
    assert [modes(row[0]) for row in velocity]==[[-1,1],[-1,1],[0]]
    assert add(*(square(row[0]) for row in velocity))==add(square(b),square(v),square(g))
    assert add(*(square(add(row[0],scale(-1,project(row[0],0)))) for row in velocity))==add(square(b),square(v))
    return {
        'normalizedAngularMeasure':'dtheta/(2*pi)',
        'cartesianVelocitySupport':[[-1,1],[-1,1],[0]],
        'cartesianGradientSupport':[[modes(x) for x in row] for row in physical_G],
        'velocityFourierRefinement0To1':'exact omitted energy-square density beta^2+v^2 at cutoff 0, zero at cutoff 1',
        'gradientFourierRefinement1To2':'exact omitted squared Frobenius density ((beta_r-beta/r)^2+(v_r-v/r)^2)/2 at cutoff 1, zero at cutoff 2',
        'physicalChartScaling':'If beta,v,R denote frozen-chart normalized values, physical omitted gradient square is Q^(-2A-1)*((beta_R-beta/R)^2+(v_R-v/R)^2)/2.',
        'cartesianFourNodeAlias':{
            'angles':'theta_j=2*pi*j/4, j=0,1,2,3',
            'a':'(beta_r-beta/r)/2','b':'(v_r-v/r)/2',
            'xx,yy':'subtract (a^2-b^2)/2 from four-node square mean',
            'xy,yx':'subtract (b^2-a^2)/2 from four-node square mean',
            'remainingEntries':'no four-node square alias',
            'fullFrobenius':'the four componentwise biases sum exactly to zero',
            'fiveNodes':'all nine square means exact, also distinguishes the signed Nyquist modes',
        },
        'verifiedControls':{
            'nonzeroComponentFourNodeBias':'symbolic polynomial (a^2-b^2)/2 is not zero',
            'pureRadialDilationHasNoSecondMode':'a=b=0 yields zero removed norm',
            'sourceComponentMetricOnly':True,
        },
    }


def actual(raw):
    registry,readback,ingress,whole,occurrences=(json.loads(raw[k]) for k in
        ('registry','livePrefix','ingress','whole','occurrences'))
    witness=readback['nativeTypedSourceReadback']
    assert occurrences['sha256']==witness['verifiedLiveNodeStreamSHA256']==whole['sourceStream']['sha256']
    assert occurrences['nodeCount']==witness['nodeCount']==ingress['materializedNodes']==22155584
    assert whole['githubRun']==readback['liveRun']['id']==44582875351
    assert ingress['physicalMultipliers']['U']=='Q^(-A)'
    assert ingress['physicalMultipliers']['G_U']=='Q^(-A-1/2)'
    assert ingress['input']['azimuthalSwirls'][1]==22151941
    assert ingress['input']['meanPotentials'][1]==22151952
    assert ingress['input']['fiveCompactCandidate']==22151956
    assert ingress['input']['fiveWhole']==whole['actualRoots']['whole']==22151951
    assert whole['actualRoots']['gammaBody']==22151944
    srcpins=json.loads(raw['live-source-pins'])
    binder_path='research-ide/mathscope-m3/navier/source-coupled-expressions.mjs'
    binder=raw['binding.mjs']
    blob=sha1(('blob '+str(len(binder))+'\0').encode()+binder).hexdigest()
    matching=[row for rows in srcpins.values() if isinstance(rows,list) for row in rows
              if isinstance(row,dict) and row.get('path')==binder_path]
    assert matching==[{'path':binder_path,'gitBlobSHA':blob,'byteLength':len(binder)}]
    for source,clauses in {
        'five-source.mjs':[
            "'PostSignedFiveBump_v'","'PostSignedFiveBump_gamma'","'PostSignedFiveBump_beta'",
            'rawDeltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z)))',
            'increment={beta:deltaBeta,v:deltaV,gamma:gammaDesired}',
            'updated=Object.fromEntries(names.map(n=>[n,G.add(previous[n],increment[n])]))',
            'source-five-mean-bumps-independent-of-auxiliary-torus',
        ],
        'binding.mjs':["[...this.freeCoordinates(body)].some(x=>!parameters.includes(x))",
                       "A joint shared expression needs its whole actual body and complete coordinates."],
        'pde.mjs':['meanIncrements=names.map(n=>G.sub(latestMean[n],baseline[n]))',
                   'velocity=old.fullVelocity.map((rootId,j)=>G.add(rootId,meanIncrements[j]))'],
    }.items():
        text=raw[source].decode('utf8')
        assert all(clause in text for clause in clauses),source
    nodes=occurrences['nodes']
    def check(i,op,args):
        assert nodes[str(i)]=={'op':op,'args':args},i
    R,Z,T,ell,theta=17732748,17732749,17732750,17732737,17732752
    check(theta,'coordinate',['m3_global_band_angle$1207477'])
    params=[ell,R,Z,T]
    declarations=json.loads(registry['definitions'])[0]
    result={}
    for name,i,body,app in [
        ('beta',1337,22151962,22151963),
        ('v',1335,22151940,22151941),
        ('gamma',1336,22151944,22151945),
    ]:
        system='coupled-expression:'+str(i)
        d=declarations[i]
        assert d['id']==system and d['name']=='PostSignedFiveBump_'+name
        assert d['parameters']==params and d['body']==body
        check(app,'m3_coupled_expression_partial',[system,params,[0]*4])
        result[name]={'system':system,'body':body,'actualApplication':app,'freeCoordinateEnvelope':params}
    # The native post-Temporal body is added to the exact FiveMap component;
    # the full same-live PDE export consumes each resulting updated mean.
    links=[]
    for app,preceding,merged,baseline,delta,old,full in [
        (22151963,22151019,22151964,22153216,22153217,22031659,22153222),
        (22151941,22151020,22151965,22153218,22153219,22031660,22153223),
        (22151945,22151021,22151966,22153220,22153221,22031661,22153224),
    ]:
        check(merged,'add',[preceding,app])
        check(delta,'add',[merged,baseline])
        check(full,'add',[old,delta])
        links.append({'increment':app,'updatedMean':merged,'finalFirstCycleVelocity':full})
    assert [row['finalFirstCycleVelocity'] for row in links]==ingress['input']['latest']
    check(22151957,'m3_coupled_expression_partial',
          ['coupled-expression:1336',[ell,22151946,Z,T],[0,0,1,0]])
    check(22151959,'definite_integral',[22151958,22151946,17743711,R])
    check(22151962,'multiply',[20,22151961])
    return {
        'field':'actual first post-Signed FiveMap increment, before external cutoffs',
        'actualComponents':result,'sourceApplicationLinks':links,'psi':22151952,
        'compactVersion':22151956,'nativePhysicalAngle':theta,
        'nativeAuxiliaryTorusCoordinates':[17745430,17745431],
        'hostedNativeCoordinateBinderBlob':blob,
        'angularIndependence':'Every native declaration passes the source kernel complete-free-coordinates check and every actual argument is one of ell,R,Z,T.',
        'wholeSupportReference':'C79 authentic fixed radial whole identity under its stated support/source premises; angular evaluation uses this same direct increment.',
        'nonzeroNumericalTailEnclosed':False,
        'liveRun':44582875351,
    }


def source_paths(workspace,here):
    local=workspace/'work/goal-next'
    artifact=local/'continuation70/hosted-44582875351'
    m3=local/'continuation66/stage2/runtime-exact/research-ide/mathscope-m3'
    return {
        'registry':artifact/'first-correction-spatial-source/original-source-functions.json',
        'livePrefix':local/'continuation77/live-old-path-bind/live-prefix-final.json',
        'ingress':artifact/'first-correction-spatial-ingress.json',
        'whole':local/'continuation79/five-whole/five-whole-moment.json',
        'occurrences':here/'fivemap-occurrences.json',
        'live-source-pins':artifact/'pr30-source-pins.json',
        'five-source.mjs':m3/'post-signed-20261023/source-signed-actual-five-map.mjs',
        'binding.mjs':m3/'navier/source-coupled-expressions.mjs',
        'pde.mjs':m3/'post-signed-20261023/source-postfive-full-3d-residual.mjs',
    }


def main():
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('workspace',type=Path)
    parser.add_argument('out',type=Path)
    parser.add_argument('--bundle',action='store_true')
    args=parser.parse_args()
    here=Path(__file__).resolve().parent
    paths=({k:here/'pinned'/(k if k.endswith('.mjs') else k+'.json') for k in PINS}
           if args.bundle else source_paths(args.workspace,here))
    raw={k:p.read_bytes() for k,p in paths.items()}
    for k,content in raw.items():
        assert sha256(content).hexdigest()==PINS[k],k
    result={
        'status':'VERIFIED_SAME_LIVE_ACTUAL_FIVEMAP_ANGULAR_VELOCITY_AND_GRADIENT_REFINEMENT',
        'pins':PINS,'source':actual(raw),'fourier':spectrum(),
        'scope':'Exact physical angular quadrature and Fourier tail for the isolated actual first-cycle FiveMap increment. No radial/time coefficient evaluation, mixed-field force evaluation, or complete N8 experiment.',
        'finalFourComparisonsCompleted':0,'finalJets':0,'release':'HOLD',
    }
    with args.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])


if __name__=='__main__':
    main()
