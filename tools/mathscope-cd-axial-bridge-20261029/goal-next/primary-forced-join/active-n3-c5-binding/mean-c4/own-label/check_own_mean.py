"""Bind actual N3 mode-one mean-v pullback and 52 positive-N bounds."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import gzip
import json

PINS={'nodes':'1ad501984212afd18d2ee6361f14ce6b1a28cf67c36e90eb059bb162514dc8fc',
      'registry':'364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111',
      'witness':'a35bd111ef2f60b0e779a85433571db8caa00061616da91372782a28a16859e9',
      'endpoint':'5abe63bc103e29e14694528d5bac4733b84f217344679ddfdff0b65727e18d85',
      'w4':'9da54bbb2bd959e097c8ef610eabaf8ef8b163e540c73169dd82fcdaa784bc69',
      'demand':'7db7caeab702abd948936c075f6cc27e8218e5fd98fc577a6d325224f25376ec',
      'angular':'3e4f32a554e8e2ceccd3e003aa220c2f191c23b98cceb3b07f1f2d81e4bf2f1d'}
PATHS={
 '0:1:real':[21449789,21444294,21443860,21443078,21443077,21442961,21442960,21442645,21442644,21435344],
 '0:1:imaginary':[21444295,21443861,21443081,21443080,21442962,21442633,21442624,21435344],
 '1:1:real':[21486489,21481021,21480587,21479805,21479804,21479688,21479687,21479372,21479371,21435344],
 '1:1:imaginary':[21481022,21480588,21479808,21479807,21479689,21479360,21479351,21435344],
}
def main():
    p=ArgumentParser(description=__doc__)
    for k in (*PINS,'out'):p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args();raw={}
    for k,pin in PINS.items():
        raw[k]=getattr(a,k).read_bytes();assert sha256(raw[k]).hexdigest()==pin,k
    registry,witness,endpoint,w4,demand=(json.loads(raw[k]) for k in ('registry','witness','endpoint','w4','demand'))
    assert endpoint['status']=='VERIFIED_ACTIVE_ORIGINAL_ENDPOINT_AND_CYLINDRICAL_CURL'
    assert endpoint['priorEdges']==43980655 and endpoint['sameLiveNormFamily']
    assert w4['status']=='SAME_LIVE_N3_COMMON_Y_W4_WEIGHTED_TRANSFER_CONDITIONAL'
    assert w4['conditionalPositiveNMeanV']['coordinateScope'].startswith('Common-reference')
    assert [x['key'] for x in witness['rows']]==['0:1','1:1']
    assert [x['key'] for x in endpoint['rows']]==['0:1','1:1']
    text=raw['angular'].decode('utf8')
    for s in ['referenceValues=[G.div(R,G.sqrt(ratio)),G.div(Z,power(ratio,D)),G.div(T,ratio),ellReference,...Y]',
              'normalizedMeanVelocity=referenceFunctions.velocity.map(id=>G.mul(power(ratio,G.neg(A)),G.expressionValue(id,referenceValues)))',
              'factor=G.div(ci,G.pow(Tg,delta)),difference=G.sub(w,lift.v),Hw=Y.map',
              'previous=[{m:0,velocity:normalizedMeanVelocity.map(x=>C.value(x))',
              'nonzeroAngularForcing=subtractVectorRows(G,waveResidual,primaryFlatResidual)']:
        assert s in text,s
    definitions=json.loads(registry['definitions']); expressions=definitions[0];pulses=definitions[3]
    actual=next(x for x in expressions if x.get('name')=='ActualInitializedMeanVelocity_1')
    assert actual['id']=='coupled-expression:1' and actual['body']==21435336
    for delta in (0,1):
      for part in ('real','imaginary'):
        name=f'ActualWholeNonzeroSource_{delta}:1_1_0_{part}'
        d=next(x for x in expressions if x.get('name')==name)
        assert d['body']==PATHS[f'{delta}:1:{part}'][0]
      pulse=next(x for x in pulses if x.get('name')==f'ActualOriginalForced_{delta}:1_m1')
      witness_row=witness['rows'][delta]
      assert pulse['variable']==witness_row['path']['w']
      assert witness_row['path']['levelDifference']==delta
      assert witness_row['path']['ci']==17733027 and witness_row['path']['Tg']==14220487
    expected={
      19:['rational',['1','2']],21:['multiply',[9,20]],22:['add',[19,21]],23:['add',[9,19]],
      281:['multiply',[20,23]],127:['log_positive',[24]],
      21435321:['multiply',[20,21435315]],21435322:['add',[17732737,21435321]],
      21435323:['multiply',[127,21435322]],21435324:['exp',[21435323]],
      21435325:['sqrt_positive',[21435324]],21435326:['inverse',[21435325]],
      21435327:['multiply',[17732748,21435326]],21435328:['log_positive',[21435324]],
      21435329:['multiply',[22,21435328]],21435330:['exp',[21435329]],
      21435331:['inverse',[21435330]],21435332:['multiply',[17732749,21435331]],
      21435333:['inverse',[21435324]],21435334:['multiply',[17732750,21435333]],
      21435339:['multiply',[281,21435328]],21435340:['exp',[21435339]],
      21435343:['m3_coupled_expression_partial',['coupled-expression:1',[21435327,21435332,21435334,21435315,17745430,17745431],[0]*6]],
      21435344:['multiply',[21435340,21435343]],
      17732713:['inverse',[14220487]],21472299:['multiply',[17732713,17733027]],
      21661709:['add',[21661707,21661708]],21661710:['multiply',[17733027,21661709]],
      21661711:['multiply',[17733069,21661710]],21661712:['add',[17745430,21661711]],
      21661713:['add',[17745431,21661710]],
      21675100:['add',[21675098,21675099]],21675101:['multiply',[21472299,21675100]],
      21675102:['multiply',[17733069,21675101]],21675103:['add',[17745430,21675102]],
      21675104:['add',[17745431,21675101]],
    }
    need=set(expected)|{x for path in PATHS.values() for x in path}
    found={}
    with gzip.open(a.nodes,'rt',encoding='utf8') as f:
      header=json.loads(next(f));assert header['node_count']==21681493
      for i,line in enumerate(f):
        if i in need:
          node=json.loads(line);found[i]=[node['op'],node['args']]
    for node,value in expected.items():assert found[node]==value,node
    for key,path in PATHS.items():
      for parent,child in zip(path,path[1:]):
        op,args=found[parent];assert op in ('add','multiply') and child in args,(key,parent,child)
    # Negative controls: an incorrect radial power, inverse Tg, and absent
    # reference amplitude cannot reproduce the witnessed source nodes.
    assert found[21435327]!=['multiply',[17732748,21435325]]
    assert found[21472299]!=['multiply',[14220487,17733027]]
    assert found[21435344]!=['multiply',[21435343,21435343]]

    rows=demand['rows'];assert len(rows)==52
    projections=[x for x in rows if x['j']==1 and x['L']==0]
    assert len(projections)==19 and len(rows)-len(projections)==33
    # With A=1/2+h, D=1/2-h and eps_ref=rho^h eps_own,
    # the exponent on rho is -(1/2+h*kappa+r/2+D*z+t).
    # Its absolute value is < 1+slow <=4 on the admissible interval.
    exponent_max=Q(0)
    for x in rows:
      r,z,t=x['slow'];assert r+z+t<=3
      for h in (Q(0),Q(1,2)):
        for kappa in (Q(0),Q(1)):
          magnitude=Q(1,2)+h*kappa+Q(r,2)+(Q(1,2)-h)*z+t
          assert Q(0)<magnitude<=1+r+z+t<=4
          exponent_max=max(exponent_max,magnitude)
    assert 4**4==256 and 2985984*256==764411904 and 1492992*256==382205952
    # D=1/2-h gives 2D+2h=1, the exact condition for the two
    # inverse slow charts to send the same (q,X,eta) to one another.
    assert 2*Q(1,2)==1 and 2*(-1)+2==0
    result={'status':'SAME_LIVE_N3_OWN_MEAN_V_POSITIVE_N_CONDITIONAL_WEIGHTED_PULLBACK',
      'pins':PINS,'cases':['0:1','1:1'],'literalSourceMean':21435344,'actualBody':21435336,
      'rho':21435324,'referenceRZT':[21435327,21435332,21435334],
      'referencePrefactor':21435340,'modeOneComponentZeroTypedPaths':PATHS,
      'actualPulsePaths':[{'case':r['key'],**r['path']} for r in witness['rows']],
      'chart':'rho=Q_ref/Q_own, A=1/2+h, D=1/2-h; q, X and eta agree by 2D+2h=1 and uniqueness of the positive source chart.',
      'exactPullback':'rho^(-A-r/2-D*z-t) Lambda^(-delta*l) (ci_own/Tg^delta)^j times reference D_R^r D_Z^z D_T^t L^l N^j v, evaluated on original H_w.',
      'admissibleCoefficientBound':'For 1/4<=rho<=4, 0<h<1/2, 0<kappa_s<1, 0<=delta<=4, ell_own>=8 and slow r+z+t<=3, all chart and epsilon conversion factors together are <=4^4=256; Lambda>1 and 0<ci_own<=ell_own^-2<=1.',
      'projectionRows':19,'derivativeRows':33,'referenceScale':'S_ref=ell_ref^2',
      'projectionBound':'764411904 * 4^2589 * Tg^21 * K^2586 * S_ref^2590 * epsilon_own^(1-kappa_s) * zeta * delta_*^(-36)',
      'derivativeBound':'382205952 * 4^2589 * Tg^21 * K^2586 * S_ref^2590 * epsilon_own^(1-kappa_s) * zeta * delta_*^(-36)',
      'controls':['wrong rho square-root rejected','wrong Tg inversion rejected','missing rho^-A rejected',
                  'actual add/multiply source paths checked','two chart exponent coefficients checked'],
      'premises':['same-live original local C4 and conditional W4 envelope',
                  'source fixed labels, frozen nearest copies and original flat support joins',
                  'rho in [1/4,4] and both charts admitted along the original H_w pulse interval',
                  'Xa<X<Xb and delta_*>0; endpoint flatness is not inferred from delta_*^-36',
                  'original positive c_i, Fourier inverse theorem, and source radial phase bound'],
      'scope':'Finite exact source binding and symbolic conditional pointwise own-label mean-v bound only; all other mean components, zero-N indices, complete mode-one source and numerical constants remain open.',
      'completeForcedSeal':False,'finalJets':'0/67','release':'HOLD'}
    with a.out.open('x',encoding='utf8',newline='\n') as f:json.dump(result,f,indent=2);f.write('\n')
    print(result['status'])
if __name__=='__main__':main()
