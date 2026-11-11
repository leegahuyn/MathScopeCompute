"""Exact source-shape replay; native majorant regularity remains an external premise."""
import argparse,gzip,hashlib,json,subprocess
from fractions import Fraction
from pathlib import Path
PIN='f8cb4034e86d7b669d52a6f2248aebba156b51b5';GRAPH='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf'
FILES={
'actual-residual-order-induction-background.mjs':('88986dcfa270b01f2dab9a85c74a493689266cf1',["Ftotal=G.add(Fleading,Ferror)","Gtotal=G.add(Gleading,Gerror)","FTotal:{constant:Ftotal,power:'1'},GTotal:{constant:Gtotal,power:'1'}","derivatives:'each ordinary slow derivative of total order<=2'","closedEtaEndpoints:true,timeEndpoint:'T=0 one-sided'"]),
'actual-common-admissible-family.mjs':('614c59419ec1a6d7e37a52084d10b6a3b4e5d30b',["['FGErrorConstant','bTotalConstant','FTotalConstant','GTotalConstant']","chart.operatorA,chart.operatorB","sameCanonicalNormalizedBoundsUnderEnlargement:true","same(chart.roots,background.roots)"]),
'actual-common-target-weighted-norms.mjs':('49ed9c8ba2174c9b708864baac9dba47b366620c',["Xlo=G.mul(c.Xa,G.exp(G.div(c.t1,q(8))))","Xhi=G.mul(c.Xb,G.exp(q(-1,4)))","body=G.div(derivative,zeta)","ftcRows.length===3*(m+1)*(m+2)","widthInner=G.div(c.t1,q(4)),widthOuter=q(1,2)","pole:3+3*order"]),
'actual-pressure-stress-all-order-tail.mjs':('4897ca3be356eecf0c3632ee88a8626cad4ab758',["G.pow(G.log(G.div(X,G.parameter('Xa'))),2)","G.div(q(4),G.pow(G.log(G.div(Xb,X)),2))"]),
'actual-compact-all-band-background-norms.mjs':('90d2d62ce4d12416f460b8b7581c386197150039',["for(let n=0;n<=m;n++)for(let r=0;r<=n;r++)","for(let j=0;j+2<=m;j++)gaussianRows.push","request.maxCoefficientJets","request.maxJetRequests"])}
NODES={300162:('rational',[str(2**128),'1']),215562:('multiply',[215511,215561]),215564:('multiply',[215511,215563]),215573:('maximum',[1,215562,215564]),215574:('add',[215566,215570]),215575:('add',[215564,215572]),216829:('add',[215562,216828]),300163:('integer_power',[216823,4096]),300164:('add',[300162,300163]),300165:('add',[215573,300164]),300166:('add',[215574,300165]),300167:('add',[216829,300166]),300168:('add',[215575,300167]),300169:('add',[215530,300168]),300170:('add',[215531,300169])}
def main():
 p=argparse.ArgumentParser();p.add_argument('--repo',type=Path,required=True);p.add_argument('--graph',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 blobs={}
 for name,(oid,parts) in FILES.items():
  path='research-ide/mathscope-m2/navier/'+name
  got=subprocess.check_output(['git','-C',str(a.repo),'rev-parse',PIN+':'+path],text=True).strip();assert got==oid,(name,got)
  raw=subprocess.check_output(['git','-C',str(a.repo),'show',PIN+':'+path]);text=raw.decode('utf-8');assert all(s in text for s in parts),name
  blobs[name]=oid
 nodes={};h=hashlib.sha256();count=0
 with gzip.open(a.graph/'original-source-nodes.jsonl.gz','rb') as f:
  line=f.readline();h.update(line);header=json.loads(line)
  for line in f:
   h.update(line)
   if count in NODES:nodes[count]=json.loads(line)
   count+=1
 assert h.hexdigest()==GRAPH and count==header['node_count']==4456994
 for k,(op,args) in NODES.items():assert nodes[k]=={'op':op,'args':args},(k,nodes[k])
 # On t1/8 <= a and 1/4 <= b, t1^2/a^2 <= 8^2 and 4/b^2 <= 64.
 assert Fraction(1,1)/Fraction(1,8)**2==64 and Fraction(4,1)/Fraction(1,4)**2==64
 assert sum(n+1 for n in range(6))*2==42 and 3*(3+1)*(3+2)==60 and 4*60==240
 out={'source_commit':PIN,'source_blob_ids':blobs,'graph_sha256':GRAPH,'graph_nodes':count,'Bnorm':300170,'Ftotal':216829,'Gtotal':215575,'FTC_m3_rows':60,'FTC_m3_faces':240,'background_C5_leading_profile_jets':42,'middle_inverse_zeta_bound':'exp(128) < 2^256 <= Bnorm^2','low_order_consequence':'Conditional on the native source C2 and enlargement proofs, all original slow F/G derivatives through order 2 are bounded by Bnorm on the declared band and annulus; T=0 uses one-sided eta derivatives.','limits':'C3-C5, target constants and actual Forced W-alpha/gauge/pressure norms are not bounded here; no first cutoff C/P or release promotion.'}
 a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS source shape, Bnorm addition chain, exact C3 target counts and middle denominator inequality')
if __name__=='__main__':main()
