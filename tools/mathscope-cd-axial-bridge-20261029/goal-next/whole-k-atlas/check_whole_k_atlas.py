"""Exact source pins and rational selector controls for the whole-K prefix atlas."""
import argparse,hashlib,itertools,json,subprocess
from fractions import Fraction as Q
from pathlib import Path
PIN='f8cb4034e86d7b669d52a6f2248aebba156b51b5'
FILES={
'research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs':['growth=G.add(previous,G.log(q(n===2?16:2)))','smallBand=n===1?G.mul(G.add(ellMinimum,q(10)),log2):G.zero','ell0=G.add(ellMinimum,q(6))'],
'research-ide/mathscope-m3/navier/global-source-index.mjs':['next=commonRows[N],previous=N?commonRows[N-1]:null','lower=previous?G.maximum(ell0,floor(G.div(previous.logScale,log2))):ell0','upper=G.sub(floor(G.div(next.logScale,log2)),G.one','Window N needs the genuine common selector through N+1.'],
'research-ide/mathscope-m3/navier/source-global-band.mjs':['family.selector.rows.length<activeOrder+1','rawCount=request.coefficientOrder','for(let n=1;n<=rawCount;n++)'],
'research-ide/mathscope-m3/navier/source-localization.mjs':['expectedQStar=G.exp(G.neg(G.mul(G.add(ell0,q(4)),G.log(q(2)))))','ell0===G.add(ellMinimum,q(6))'],
'research-ide/mathscope-m3/navier/source-global-representative.mjs':['sameBoxDistance:',"fixed-original-ell-six-mesh"]}
def active(t):
 near=(t+Q(1,2)).__floor__();return [j for j in (near-1,near,near+1) if abs(t-j)<Q(3,4)]
def run():
 p=argparse.ArgumentParser();p.add_argument('--repo',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();pins={}
 for path,markers in FILES.items():
  raw=subprocess.check_output(['git','-C',str(a.repo),'show',PIN+':'+path]);text=raw.decode('utf8');assert all(x in text for x in markers),path
  pins[path]=hashlib.sha256(raw).hexdigest()
 # Enumerate rational log-scales, including many floor ties and growth > minimum.
 cases=0;nexts=0;zero=0;four=0
 for C in (8,9,20):
  for f1 in range(0,33,2):
   a1=Q(C+10)+Q(f1,4)
   for d2,d3,d4,d5 in itertools.product((Q(4),Q(17,4)),(Q(1),Q(5,4)),(Q(1),Q(5,4)),(Q(1),Q(5,4))):
    aa=[None,a1,a1+d2,a1+d2+d3,a1+d2+d3+d4,a1+d2+d3+d4+d5]
    assert aa[5]>=C+17
    for j in range(1,33):
     t=Q(C+14)+Q(j,16);ell=t.__floor__();assert C+14<=ell<=C+16
     N=max([0]+[n for n in range(1,5) if aa[n].__floor__()<=ell]);lo=C+6 if N==0 else aa[N].__floor__();hi=aa[N+1].__floor__()-1
     assert lo<=ell<=hi and aa[N+1]>t
     labels=active(t);assert labels and all(C+14<=x<=C+16 for x in labels)
     safe=N;ref=ell
     if aa[N+1]-t<1:
      safe=N+1;ref=aa[N+1].__floor__();assert safe<=4 and -1<ref-t<1 and aa[safe+1]-t>=1
      assert aa[safe].__floor__()<=ref<=aa[safe+1].__floor__()-1;nexts+=1
     else:assert aa[safe+1]-t>=1
     assert safe<=4 and C+14<=ref<=C+16
     for label in labels:assert label>=C+14 and 2*(1-Q(54,label**6))>1
     if N==0:zero+=1
     if safe==4:four+=1
     cases+=1
 # Exact minimal-growth case shows this selection genuinely may choose 4 in the source-inequality model.
 C=8;aa=[None,Q(C+10),Q(C+14),Q(C+15),Q(C+16),Q(C+17)];t=Q(C+16);ell=int(t)
 assert max([0]+[n for n in range(1,5) if aa[n]<=ell])==4 and aa[5]-t==1
 # Empty earlier windows are not invented: N=0 lower=ell0; if b1 is extremely large, it contains all slab labels.
 C=8;assert C+6<=C+14<=C+16<(C+100)-1
 out={'schema':'MathScope.WholeK.FinitePrefixAtlas/1','sourceCommit':PIN,'sourceSha256':pins,'sourceVariables':'C=ellMinimum, ell0=C+6, qBig=2^(-C-10), qGlobalStar=qBig','slab':'qBig/64<=q<qBig/16; C+14<t<=C+16','actualSelectorThrough':5,'maximumSelectedCoefficientOrder':4,'referenceSelection':'ell=floor(t), N=max({0} union {1<=n<=4 | floor(log2 b_n)<=ell}); if b_(N+1)q<2, replace with N+1 and reference floor(log2 b_(N+1)).','representativeMargin':'Every active label C+14<=ell_prime<=C+16. qrep<2^(-C-13)<qGlobalStar and b_(N+1)qrep>1 from |srep-s_prime|<=27/ell_prime^6, s_prime>1/2 and b_(N+1)q>=2.','rationalControlCases':cases,'initialN0Cases':zero,'nextPrefixCases':nexts,'finalN4Cases':four,'logicalSharpness':'Minimal-growth log-scale model can select N=4; it is not a computed actual selector.','scope':'Conditional geometry and real original selector/representative semantics for slab; genuine selector b1..b5 construction, natural Y upper-bound/reachability, all native definedness and final jets are not proved.','release':'HOLD'}
 a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS source pins and exact',cases,'rational log-window controls; actual selector through b5 and all Y bound remain OPEN')
if __name__=='__main__':run()
