"""Exact finite controls, source binding and N2 anchor replay for all-order atlas."""
import argparse,collections,gzip,hashlib,json,subprocess
from fractions import Fraction as Q
from pathlib import Path

PIN='f8cb4034e86d7b669d52a6f2248aebba156b51b5'
N2_SHA='75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987'
REG_SHA='6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f'
NODES={2:('coordinate',['eta']),3454:('source_parameter',['Lambda']),4756:('coordinate',['X']),4757:('multiply',[3454,4756]),4758:('actual_natural_series',['Phi',4757,2,0,0]),4784:('actual_natural_series',['u',4757,2,0,0]),5177:('actual_natural_series',['average',4757,2,0,0]),5299:('actual_natural_series',['average',4757,2,0,1]),1446472:('exp',[1446471]),1446519:('add',[1446471,1446518]),1446521:('exp',[1446520]),1446582:('add',[127,1446520]),1446584:('exp',[1446583]),1451854:('maximum',[1446439,1451853]),1451859:('add',[20,1451858]),1451889:('actual_monotone_root',[2,1451872,1451873]),1451893:('multiply',[1451890,1451892]),1451899:('multiply',[1451863,1451889]),1463469:('multiply',[1446584,1451899])}
FILES={'research-ide/mathscope-m3/navier/source-global-representative.mjs':('6984feb5e56cd2a555a7c521a4d6c3f1775cba9a',['sLower=O.maximum(q(1,2),O.div(O.pow(radialLowerPositive,2),O.mul(q(2),Xb)))','sUpperRaw=min(q(2),O.div(O.pow(Ru,2),O.mul(q(2),Xa)))','Z=O.choose(negativeWidth,O.zero,O.zero,positiveMidpoint,positiveMidpoint,negativeMidpoint)','selectedTimeInterval=[O.maximum(TLower,F(sLower)),min(TUpper,F(sUpper))]']),
'research-ide/mathscope-m2/navier/actual-common-admissible-family.mjs':('614c59419ec1a6d7e37a52084d10b6a3b4e5d30b',['growth=G.add(previous,G.log(q(n===2?16:2)))','ell0=G.add(ellMinimum,q(6))']),
'research-ide/mathscope-m3/navier/global-source-index.mjs':(None,['lower=previous?G.maximum(ell0,floor(G.div(previous.logScale,log2))):ell0','upper=G.sub(floor(G.div(next.logScale,log2)),G.one)']),
'research-ide/mathscope-m3/navier/source-global-current.mjs':(None,["conditions:['0<q<qGlobalStar','b_(N+1)*q>=1']",'prefixSharedByAllCoverLabels:true,prefixSharedByWholeRadialIntegral:true'])}
def active(t):
 n=(t+Q(1,2)).__floor__();return [k for k in (n-1,n,n+1) if abs(t-k)<Q(3,4)]
def main():
 p=argparse.ArgumentParser();p.add_argument('--repo',type=Path,required=True);p.add_argument('--n2-graph',type=Path,required=True);p.add_argument('--n2-stage',type=Path,required=True);p.add_argument('--n2-domain',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 blobs={}
 for path,(expected,fragments) in FILES.items():
  oid=subprocess.check_output(['git','-C',str(a.repo),'rev-parse',PIN+':'+path],text=True).strip();raw=subprocess.check_output(['git','-C',str(a.repo),'show',PIN+':'+path]);assert expected is None or oid==expected
  s=raw.decode('utf8');assert all(x in s for x in fragments),path;blobs[path]=oid
 raw=(a.n2_graph/'original-source-functions.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==REG_SHA
 reg=json.loads(raw);system=json.loads(reg['base']['monotone'])[2];assert system['name']=='ActualCommonBandSlowInverse' and [system[k] for k in ('variable','body','left','right','parameters')]==[1451879,1451888,19,24,[1451872,1451873]]
 h=hashlib.sha256();count=0;nodes={};natural=collections.Counter()
 with gzip.open(a.n2_graph/'original-source-nodes.jsonl.gz','rb') as f:
  line=f.readline();h.update(line);header=json.loads(line)
  for line in f:
   h.update(line);x=json.loads(line)
   if count in NODES:nodes[count]=x
   if x['op']=='actual_natural_series':natural[x['args'][0]]+=1
   count+=1
 assert count==header['node_count']==2852905 and h.hexdigest()==N2_SHA
 for k,(op,args) in NODES.items():assert nodes[k]=={'op':op,'args':args},k
 assert natural=={'Phi':1121,'u':948,'average':745}
 stage=json.loads(a.n2_stage.read_text(encoding='utf8'));w=stage['selector']['window'];assert stage['currentStage']=='COMPLETE' and w['coefficientOrder']==2 and [w['lower'],w['upper'],w['nextSourceScale']]==[1451854,1451859,1446584]
 domain=json.loads(a.n2_domain.read_text(encoding='utf8'));assert domain['indexedRows']['checked']==1458 and domain['indexedRows']['allShellMeshAndBandOperandsExact'] and domain['fullPhysicalDomainClosureAudited'] is False
 cases=0
 for L in range(3,8):
  for U in range(L,L+5):
   for numerator in range(4*L-5,4*U+6):
    for delta in (Q(-1,64),Q(0),Q(1,64)):
     t=Q(numerator,4)+delta; labels=active(t)
     assert labels and (all(L<=x<=U for x in labels)==(Q(L)-Q(1,4)<=t<=Q(U)+Q(1,4)));cases+=1
 # Strong representative ratio and source-domain estimate for every integer ell >= ell0+7 >= 3.
 for ell in range(3,100):assert 54<ell**6 and 2*(1-Q(54,ell**6))>1
 # If 1 <= b_(N+1) q < 2, t in (a-1,a]; the next label floor(a) is an original bracket label.
 nextcases=0
 for integer in range(22,32):
  for r in range(8):
   a_log=Q(integer)+Q(r,8)
   for j in range(1,17):
    t=a_log-1+Q(j,16);label=a_log.__floor__();assert -1<label-t<1
    if t>21: assert all(x>=21 for x in active(t))
    nextcases+=1
 # Minimal-band actual representative counterexample: all inequalities monotone with L>=3.
 w=Q(3,4*3**6); assert w<Q(1,2) and 1-w/2>Q(3,4) and (Q(3,4)**4)>Q(1,8)
 assert 1-w>Q(1,2) and 2-w*w/2>1+w and Q(1,2)>w*w
 # At Z cell center, selected negative interval is [-w,0], not a symmetric midpoint 0.
 assert (-w+0)/2==-w/2 and (-w+0)/2!=0
 # Source-only envelope 0 < Xa <4, XR>110 and Xb>XR give strict Xb>16 Xa.
 assert 110>16*4
 out={'schema':'MathScope.Y.AllOrderOriginalAtlasGuardAudit/1','originalSourceCommit':PIN,'producerBlobIDs':blobs,'n2GraphSHA256':N2_SHA,'n2RegistrySHA256':REG_SHA,'n2GraphNodes':count,'n2RawNaturalSeriesNodes':dict(natural),'n2RawNaturalSeriesTotal':sum(natural.values()),'n2ActualBandInverse':1451889,'n2ActualReferenceX':1451893,'n2GuardedRowRecordsFromPriorReplay':1458,'originalFourNaturalSeriesAnchors':[4758,4784,5177,5299],
 'finiteOpenGuardRationalControls':cases,'finiteNextPrefixControls':nextcases,'uniformStrongMargin':'N>=2, actual reference label in [L_N,U_N], 1/2<=s<=2 and b_(N+1)*q>=2 imply q_rep<qGlobalStar and b_(N+1)*q_rep>1 for every active guarded row, conditional on original representative proof.',
 'oneFurtherPrefix':'For 1<=b_(N+1)*q<2, construct actual prefix N+1 including b_(N+2); choose floor(log2 b_(N+1)) and use b_(N+2)*q>=2. N>=2; N=1 separately needs the stated exceptional global margin.',
 'minimalN1ConditionalObstruction':'If the actual selector has L1=ell0+4, the source centered mesh point with T=1-w/2,Z=0,R=sqrt(Xb)/2 gives Zrep=-w/2,Trep=1,srep>1,qrep>qGlobalStar, despite all active guards and b2*q>1.',
 'status':'Geometry and source-domain consequences conditional on pinned source semantics, real regularity and stated selector facts; no all-order native natural-series upper-bound flow or all-order 523/523 claim.', 'release':'HOLD'}
 a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS N2 source anchors, exact all-window controls and minimal-band rational inequalities; N2 Y reachability OPEN')
if __name__=='__main__':main()
