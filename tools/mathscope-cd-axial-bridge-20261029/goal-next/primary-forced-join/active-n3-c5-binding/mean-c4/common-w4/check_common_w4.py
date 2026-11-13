"""Exact five-direction fixed-label transfer of same-live local W4 bounds."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json

PINS={'pointwise':'f701974230bf95b9603c7f1a3e7e8d344e07f8b09e85d96f81e3a60cf289f2cd',
      'primary':'ebd5da297d06da881e0d38bd6d04507595b50a980b2bb2399ac7df42725323ad',
      'registry':'364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111',
      'pressure':'fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d',
      'band':'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
      'globalclass':'f07341f299b2b9cd24844c4d738b5c6605816bdaf4eeca317b80618b27ed7095',
      'classsource':'40b3f1220b7ad1b9b05a11ae1378c864351e77e8efe7134ae1b78921fbab47ea'}
def add(x,y):return (x[0]+y[0],x[1]+y[1])
def mul(x,y):return (x[0]*y[0]+2*x[1]*y[1],x[0]*y[1]+x[1]*y[0])
def main():
    p=ArgumentParser(description=__doc__)
    for k in (*PINS,'out'):p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args();raw={}
    for k,pin in PINS.items():
        raw[k]=getattr(a,k).read_bytes();assert sha256(raw[k]).hexdigest()==pin,k
    previous,primary,registry=(json.loads(raw[k]) for k in ('pointwise','primary','registry'))
    assert previous['status']=='SAME_LIVE_POSITIVE_N_V_POINTWISE_CONDITIONAL_REDUCTION'
    assert primary['status']=='VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS'
    assert primary['normRoot']==18310069 and primary['scope']['actualPreHaarCommonYCovarianceClassCertified'] is False
    bound=primary['classRows'][4]['fields']['fullCovariance']
    assert [bound[x] for x in ('constant','power','pole','epsilonExponent','weight','gaussian')]==[18310098,2585,36,'1','zeta','P(v)^2']
    assert bound['sourceStage']=='LOCAL_COEFFICIENT_BEFORE_AUXILIARY_HAAR_AVERAGE'
    pressure=raw['pressure'].decode('utf8');source=raw['classsource'].decode('utf8')
    for s in ['const {band,assembly,local,representative}=current',
        'parameters=[R,Z,T,ell,...Y],directions=[R,Z,T,...Y]',
        'vr=current.geometry.basis[0],vt=current.geometry.basis[1]',
        'values=[...b.slow,label.ell,...label.grid,rectangle.xi,rectangle.v]',
        'coefficient=power(b.ratio,G.mul(q(2),A))',
        'xiJacobian=[0,1].map(j=>G.div(dot(G,vr,matrix.map(row=>row[j])),Dgeom))',
        'vJacobian=[0,1].map(j=>G.div(dot(G,vt,matrix.map(row=>row[j])),G.mul(Dgeom,ci)))',
        'integerRange:{minimum:0,maximum:4',
        'Every local compact rectangle has the original flat auxiliary joins']:
        assert s in pressure,s
    for s in ['constant:G.pow(K,d.power)',
        'S_label<=4*S_ref','All slow derivative chart factors are <=4 per derivative',
        'The original X and both logarithmic boundary distances are unchanged',
        'coefficientConstants.maximum,...targetRows.map(r=>r.N_m)']:
        assert s in source,s
    globalclass=raw['globalclass'].decode('utf8')
    for s in ['fastRadialProof:', 'Lambda^i*Q^(dr/2)<=epsilon^(-kappa_s)',
        '...radiusRows.flatMap(r=>[r.inverseRadius,r.fastRadial])',
        'Rlower=G.sqrt(G.div(c.Xa,q(2)))']:
        assert s in globalclass,s
    band=raw['band'].decode('utf8')
    assert 'S=G.pow(ell,2),epsilon=power(Q,h)' in band
    assert 'ci=G.mul(power(Tg,paletteIndex),power(Q,G.add(G.one,h)))' in band
    assert 'paletteIndex=G.neg(G.ceiling(G.neg(paletteQuotient)))' in band
    f=json.loads(registry['base']['fieldDefinitions']);defs=json.loads(registry['base']['expressionDefinitions'])
    for n,name in [(1,'GlobalCompleteCommonTorus_rtheta'),(4,'GlobalCompleteCommonTorus_thetaz')]:
        field=f[n];assert field['name']==name and len(field['rows'])==162
        box={}
        for row in field['rows']:
            d=defs[-1-row['localSystem']]
            assert d['body']==row['localBody'] and d['parameters']==row['localParameters']
            component='rtheta' if n==1 else 'thetaz'
            assert d['name']==f"GlobalCommonTorusOriginalFullCurl_{row['label']['sign']}_{component}"
            assert len(d['parameters'])==9 and len(row['values'])==9
            maps=row['derivativeMaps'];assert len(maps)==5
            assert [[x['parameter'] for x in m] for m in maps]==[[0],[1],[2],[7,8],[7,8]]
            key=row['label']['key'];box.setdefault(key,set()).add(row['label']['sign'])
        assert len(box)==81 and all(x=={-1,1} for x in box.values())
    for x,y in zip(f[1]['rows'],f[4]['rows']):
        for key in ['coefficient','values','derivativeMaps','guards','label']:
            assert x[key]==y[key],key

    # Exact eigen-relations for every integer cover power 0..4 in Q(sqrt(2)).
    z=(Q(0),Q(0));one=(Q(1),Q(0));rt=(Q(0),Q(1));a0=(Q(-1),Q(1))
    vr=(one,(Q(1),Q(-1)));vt=(a0,one)
    lr=(Q(4),Q(-1));lt=(Q(4),Q(1));M=((Q(3),Q(1)),(Q(1),Q(5)))
    def mv(v):return tuple(add(mul((M[i][0],Q(0)),v[0]),mul((M[i][1],Q(0)),v[1])) for i in range(2))
    def scaled(t,v):return tuple(mul(t,x) for x in v)
    assert mv(vr)==scaled(lr,vr) and mv(vt)==scaled(lt,vt)
    r,t=vr,vt;rp,tp=one,one
    for n in range(5):
        assert r==scaled(rp,vr) and t==scaled(tp,vt)
        r,t=mv(r),mv(t);rp,tp=mul(rp,lr),mul(tp,lt)
    assert Q(1)<Q(2)<Q(9,4) # 1<sqrt2<3/2, so 4-sqrt2<3, Tg>1.
    assert 4*64>3**4 and 162*16*2==5184
    assert 36*8*2*5184==2985984 and 18*8*2*5184==1492992

    result={
      'status':'SAME_LIVE_N3_COMMON_Y_W4_WEIGHTED_TRANSFER_CONDITIONAL',
      'pins':PINS,'order':4,'actualSignedRowsPerComponent':162,'actualBoxes':81,
      'components':['W_rtheta','W_thetaz'],'localClassConstantRoot':18310098,'KRoot':18310069,
      'rootNamespace':'same-live target/norm graph, not current graph',
      'integerPower':2585,'finalScalePower':2589,'boundaryPole':36,
      'Tg':'4+sqrt(2)','Lambda':'4-sqrt(2)','referenceScale':'S_ref=ell_ref^2',
      'fixedLabelJacobian':'L xi=Lambda^delta, N xi=0, L v=0, N v=Tg^delta/ci_label; 0<=delta<=4',
      'jacobianBound':'Every derivative in (R,Z,T,L,N) is bounded by J=4*Tg^5*S_ref in local coordinates, assuming the original admitted fixed-band label inequalities.',
      'weightedBound':'max_(|I|<=4) |I W_(rtheta,thetaz)(Y)| <= 5184 * 4^2589 * Tg^20 * K^2585 * S_ref^2589 * epsilon_ref * zeta * delta_*^(-36)',
      'conditionalPositiveNMeanV':{
        'projectionRows':19,'derivativeRows':33,
        'projectionBound':'2985984 * 4^2589 * Tg^21 * K^2586 * S_ref^2590 * epsilon_ref^(1-kappa_s) * zeta * delta_*^(-36)',
        'derivativeBound':'1492992 * 4^2589 * Tg^21 * K^2586 * S_ref^2590 * epsilon_ref^(1-kappa_s) * zeta * delta_*^(-36)',
        'additionalInputs':'Use c0^-1<=8*Tg*S_ref, monotonic i(ell_ref-2)<=i(ell_ref), and A<=2*K*epsilon_ref^(-kappa_s) from the original fast-radial and inverse-radius norms through C3.',
        'coordinateScope':'Common-reference D_s/L/N derivative shapes. Own-label xi/v and dyadic slow pullback factors are not included.',
      },
      'derivation':['local C4 is K^2585 S_label^2585 epsilon_label zeta delta_*^-36 P(v_label)^2',
                    'S_label<=4 S_ref, epsilon_label<=2 epsilon_ref, original zeta and delta_* unchanged, P^2<=1',
                    'reference covariance factor (Q_ref/Q_label)^(2A)<=16',
                    'fixed-label derivatives are one diagonal local direction, with norm <=J per derivative',
                    'sum all 162 signed original source rows; 162*16*2=5184'],
      'premises':['same-live local Primary C4 estimate at every mapped point',
                  'original domain ell_ref>=8, 0<h<1/2, active ell labels within two bands and c_i formula',
                  'original label and nearest-copy freezing, support and flat joins',
                  'the two covariance fields use the original same-chart zeta and delta_* at mapped points'],
      'scope':'Finite source-linked conditional W4 bound for two original common-Y covariance components. No numerical K, c0, physical output intervals, full mean C4 or full Forced estimate is computed.',
      'actualPreHaarNativeSealConstructed':False,'finalJets':'0/67','release':'HOLD'}
    with a.out.open('x',encoding='utf8',newline='\n') as f:json.dump(result,f,indent=2);f.write('\n')
    print(result['status'])
if __name__=='__main__':main()
