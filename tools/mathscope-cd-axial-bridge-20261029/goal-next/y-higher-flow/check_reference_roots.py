import argparse
import hashlib,json
from pathlib import Path
D=Path(__file__).resolve().parent;root=D.parent
parser=argparse.ArgumentParser(description="Compare the actual N3/N4 reference inverse ASTs.")
parser.add_argument("--inputs",type=Path,help="inputs directory from the combined evidence ZIPs")
parser.add_argument("--out",type=Path,default=D/"reference-roots.json")
args=parser.parse_args()
records=[]
for order,run,rs,regsha,ref in [(3,'43057719849','3de8ebed1c18e6d5ec3d104d82e2b5c65302c82865f0025015ba23b96cc886fa','75c53ba678b7db51dc53527d6b753d76e1fc013d515ff253b7b581513b0b53a0',2086999),(4,'43055678022','1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc','049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad',4587654)]:
 if args.inputs:
  group=args.inputs/f"original-whole-k-n{order}-diagonal"
  reached, registry=group/"y-reached.json", group/"original-whole-k-current-pressure-graph/original-source-functions.json"
 else:
  reached=root/f"y-n{order}/reached.json"
  registry=root/f"hosted-{run}-N{order}/original-whole-k-current-pressure-graph/original-source-functions.json"
 raw=reached.read_bytes();assert hashlib.sha256(raw).hexdigest()==rs;x=json.loads(raw);n=dict(x['nodes']);del x,raw
 raw=registry.read_bytes();assert hashlib.sha256(raw).hexdigest()==regsha;r=json.loads(raw);mon=json.loads(r['base']['monotone'])[2]
 z,t,u=ref-17,ref-16,ref-10;R=ref-18
 assert mon['name']=='ActualCommonBandSlowInverse' and mon['variable']==u and mon['parameters']==[z,t] and mon['body']==ref-1 and mon['left']==19 and mon['right']==24
 expect={ref:('actual_monotone_root',[2,z,t]),ref-9:('integer_power',[z,2]),ref-8:('log_positive',[u]),ref-7:('multiply',[25,ref-8]),ref-6:('exp',[ref-7]),ref-5:('multiply',[ref-9,ref-6]),ref-4:('multiply',[20,ref-5]),ref-3:('add',[u,ref-4]),ref-2:('multiply',[20,t]),ref-1:('add',[ref-3,ref-2]),ref+1:('integer_power',[R,2]),ref+2:('multiply',[24,ref]),ref+3:('inverse',[ref+2]),ref+4:('multiply',[ref+1,ref+3]),ref+5:('log_positive',[ref]),ref+6:('multiply',[22,ref+5]),ref+7:('exp',[ref+6]),ref+8:('inverse',[ref+7]),ref+9:('multiply',[z,ref+8]),22:('add',[19,21]),21:('multiply',[9,20]),25:('multiply',[9,24]),19:('rational',['1','2']),20:('rational',['-1','1']),24:('rational',['2','1'])}
 for i,(op,args) in expect.items():assert n[i]=={'op':op,'args':args},(order,i,n.get(i))
 receipt=json.loads((D/f'n{order}.json').read_text());assert receipt['usedRoot2Brackets']==[ref] and not receipt['nativeRootExistenceCertified']
 records.append({'order':order,'root':ref,'slowR':R,'slowZ':z,'slowT':t,'profileX':ref+4,'profileEta':ref+9,'registrySha256':regsha,'reachedSha256':rs})
out={'schema':'MathScope.Y.Higher.ActualReferenceRoot/1','sourceRecords':records,'conditionalIdentity':'For each exact native source, eta=Z/s^(1/2-h), X=R^2/(2s), and F(s)=s-Z^2*s^(2h)-T=0. If an actual reference input has Z=s^D*eta, T=s*(1-eta^2), s in [1/2,2], |eta|<=1 and 0<h<1/16, then F(s)=0 and Fprime>1-8h>1/2 throughout bracket. Thus the relevant defined root is unique, positive and X>=0.','limits':'The original physical chart image and same-family selector application must be established separately; the graph audit never assumes arbitrary formal coordinates are in this image.','release':'HOLD'}
args.out.write_bytes((json.dumps(out,indent=2)+'\n').encode());print('PASS N3/N4 exact slow inverse, X and eta source identities')
