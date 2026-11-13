"""Same-live common-Y C5 covariance and conditional gamma estimate."""
from argparse import ArgumentParser
from hashlib import sha256
from math import factorial
from pathlib import Path
import gzip
import json
PINS={'nodes':'1ad501984212afd18d2ee6361f14ce6b1a28cf67c36e90eb059bb162514dc8fc',
      'registry':'364425db9d5bbd317f8aaad681fdfdd3206f97e0f46d2beb78b6e7d5a30a3111',
      'primary':'ebd5da297d06da881e0d38bd6d04507595b50a980b2bb2399ac7df42725323ad',
      'w4':'9da54bbb2bd959e097c8ef610eabaf8ef8b163e540c73169dd82fcdaa784bc69',
      'identities':'004b3f26f845c2069c669eedc982f7e76d74afff78814335010000bd49c8e6f7',
      'pressure':'fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d',
      'zeta':'d3713e0a3f1cd17404e2afb23da20c4b32e9e840445eed53ce2849ecd200d240'}
def main():
    p=ArgumentParser(description=__doc__)
    for k in (*PINS,'out'):p.add_argument('--'+k,type=Path,required=True)
    a=p.parse_args();raw={}
    for k,pin in PINS.items():raw[k]=getattr(a,k).read_bytes();assert sha256(raw[k]).hexdigest()==pin,k
    registry,primary,w4,identities=(json.loads(raw[k]) for k in ('registry','primary','w4','identities'))
    assert w4['status']=='SAME_LIVE_N3_COMMON_Y_W4_WEIGHTED_TRANSFER_CONDITIONAL'
    assert identities['status']=='SAME_LIVE_N3_POSITIVE_N_BETA_GAMMA_SOURCE_IDENTITIES_CONDITIONAL'
    local=primary['classRows'][5]['fields']['fullCovariance']
    assert [local[k] for k in ('constant','power','pole','epsilonExponent','weight','gaussian')]==[18310104,2994,42,'1','zeta','P(v)^2']
    assert primary['scope']['actualPreHaarCommonYCovarianceClassCertified'] is False
    text=raw['pressure'].decode('utf8')
    for s in ['gr=G.add(G.neg(De(W.rr,1)),G.neg(Dz(W.rz)),G.div(W.thetatheta,R))',
      'f=G.sub(gr,G.mul(rho,P))',
      "pressure=G.sub(integrals.left,G.mul(chi,integrals.whole))",
      'pZ=G.sub(G.sub(slowZIntegrals.left,G.mul(G.derivative(chi,Z),integrals.whole)),G.mul(chi,slowZIntegrals.whole))',
      'Ez=G.sub(G.add(De(W.rz,1),Dz(W.zz),G.mul(epsilon,pZ)),De(stress[1],1))']:
        assert s in text,s
    zeta=raw['zeta'].decode('utf8')
    assert "const a=G.log(G.div(X,G.parameter('Xa'))),b=G.log(G.div(Xb,X))" in zeta
    assert "const zeta=G.exp(G.neg(G.add(G.div(G.pow(G.parameter('t1'),2),G.pow(a,2)),G.div(q(4),G.pow(b,2)))))" in zeta
    fields=json.loads(registry['base']['fieldDefinitions']);defs=json.loads(registry['base']['expressionDefinitions'])
    info=[]
    for index,component in [(0,'rr'),(2,'rz'),(3,'thetatheta'),(5,'zz')]:
      f=fields[index];assert f['name']=='GlobalCompleteCommonTorus_'+component and len(f['rows'])==162
      boxes={}
      for row in f['rows']:
        d=defs[-1-row['localSystem']]
        assert d['body']==row['localBody'] and d['parameters']==row['localParameters']
        assert d['name']==f"GlobalCommonTorusOriginalFullCurl_{row['label']['sign']}_{component}"
        assert [[x['parameter'] for x in m] for m in row['derivativeMaps']]==[[0],[1],[2],[7,8],[7,8]]
        boxes.setdefault(row['label']['key'],set()).add(row['label']['sign'])
      assert len(boxes)==81 and all(x=={-1,1} for x in boxes.values())
      info.append({'index':index,'component':component,'rows':162,'bodies':sorted({r['localBody'] for r in f['rows']})})
    args=[17732748,17732749,17732750,17732737,17745430,17745431]
    expected={17744195:['multiply',[20,17744194]],
      17754229:['multiply',[17744145,17753668]],17754230:['multiply',[20,17754229]],
      17754231:['add',[17754191,17754230]],17754232:['multiply',[17743734,17754192]],
      17754233:['multiply',[20,17754232]],17754234:['add',[17754231,17754233]],
      17754254:['m3_aux_indexed_partial',[2,args,[1,0,0,0,0]]],
      17754255:['m3_aux_indexed_partial',[2,args,[0,0,0,1,0]]],17754256:['m3_aux_indexed_partial',[2,args,[0,0,0,0,1]]],
      17754257:['multiply',[17733068,17754256]],17754258:['add',[17754255,17754257]],
      17754259:['multiply',[17745446,17754258]],17754260:['add',[17754254,17754259]],
      17753400:['m3_aux_indexed_partial',[2,args,[0]*5]],17754261:['multiply',[17733137,17753400]],
      17754262:['add',[17754260,17754261]],17754263:['m3_aux_indexed_partial',[5,args,[0,1,0,0,0]]],
      17754264:['multiply',[17732744,17754263]],17754265:['multiply',[17732744,17754234]],
      17754266:['add',[17754262,17754264]],17754267:['add',[17754265,17754266]],
      17754268:['add',[17744195,17754267]]}
    found={}
    with gzip.open(a.nodes,'rt',encoding='utf8') as f:
      assert json.loads(next(f))['node_count']==21681493
      for i,line in enumerate(f):
        if i in expected:
          n=json.loads(line);found[i]=[n['op'],n['args']]
    assert found==expected
    # W5: 162 rows, covariance scale<=16, epsilon label/ref<=2,
    # S_label<=4*S and five diagonal Jacobian factors 4*Tg^5*S.
    assert 162*16*2==5184 and 2994+5==2999
    # Product-rule coefficients for <=4 derivatives of gr and <=3 of Ez.
    assert 2+3*(2**4)==50 and 2+2*(2**3)==18
    # 2*(18+50*x) <= 136*(1+x), x>=0.
    assert 2*18<=136 and 2*50<=136
    assert 136*8*5184==5640192
    result={
      'status':'SAME_LIVE_N3_GAMMA_POSITIVE_N_SOURCE_BOUND_CONDITIONAL',
      'pins':PINS,'actualEz':17754268,'actualStress':17744195,'actualPressureZ':17754234,
      'actualPressureZCutoffTerm':{'chiZTimesWhole':17754229,'negative':17754230,
        'firstPartialMinusCutoff':17754231,'chiTimesWholePartial':17754232,
        'negativeWholePartial':17754233,'complete':17754234},
      'fields':info,'localC5':local,'normRoot':18310069,
      'covarianceC5':'||W_rr,W_rz,W_thetatheta,W_zz||_C5 <= 5184 * 4^2999 * Tg^25 * K^2994 * S_ref^2999 * epsilon_ref * zeta * delta_*^-42',
      'gaussianUniform':'Z42=1+22!*(t1^-44+4^-22); original zeta*delta_*^-42 <= Z42 on the whole radial shell, with positive t1.',
      'gaussianProof':'For delta=min(1,log(X/Xa),log(Xb/X))<1, use exp(-u)<=22!*u^-22 on the active end. This even gives an extra delta^2 near that end; for delta=1 use zeta<=1.',
      'radialProjection':'Pperp E_z=Pperp[(D1 W_rz)+epsilon*dZ W_zz+epsilon*dZ T0 G]; G= -D1 W_rr-epsilon*dZ W_rz+W_thetatheta/R. The original -D1 stress and rho*P in T0 are common-Y independent and are removed by Haar projection, not set to zero.',
      'operatorNorms':{'O0':'an actual fixed-chart C4-to-C4 sup norm bound for the complete original shifted T0, including chi and its Z derivatives',
                       'O1':'an actual fixed-chart C3-to-C3 sup norm bound for the complete original shifted A1',
                       'A':'a bound >=1 for the original a and R^-1 slow derivatives through order four'},
      'intermediate':'||G||C4 <= 50*A*B5 and ||projected E_z||C3 <= 2*(18+50*O0)*A*B5',
      'positiveNReferenceGamma':'For the 52 mean-wave positive-N shapes, ||D_s^alpha L^l N^j gamma||infinity <= 136*c0^-1*A*(1+O0)*(1+O1)*B5.',
      'symbolicSourceBound':'<= 5640192 * 4^2999 * Tg^26 * K^2995 * S_ref^3000 * epsilon_ref^(1-kappa_s) * Z42 * (1+O0)*(1+O1)',
      'premises':['original same-live local C5 weighted class and fixed-label 162-row cover on the whole radial integration domain',
                  'the original shifted radial T0 and A1 have the stated finite C4 and C3 norms on that domain',
                  'source smoothness, nonzero inner radius, fixed labels and flat joins',
                  'original Fourier inverse identity, c0 positivity and original radial phase bound'],
      'limitations':['O0 and O1 are unevaluated source-dependent operator bounds and may themselves depend on epsilon; no uniform epsilon exponent is concluded.',
                     'The radial integral requires the global Z42 bound: no local output zeta or delta weight is asserted.',
                     'Own-label conversion, beta, zero-N, full gamma/mean C4, full Forced and numerical K remain open.'],
      'completeForcedSeal':False,'finalJets':'0/67','release':'HOLD'}
    with a.out.open('x',encoding='utf8',newline='\n') as f:json.dump(result,f,indent=2);f.write('\n')
    print(result['status'])
if __name__=='__main__':main()
