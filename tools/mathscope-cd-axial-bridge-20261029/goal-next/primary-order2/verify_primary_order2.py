"""Fail-closed offline readback; checks exported source bodies and finite class scope."""
import argparse,hashlib,json
from pathlib import Path

PIN='f8cb4034e86d7b669d52a6f2248aebba156b51b5'
REQUIRED={'family-certificate.json','family-program.json','current-certificate.json','current-native-program.json','current-full-graph.json','target-certificate.json','target-program.json','primary-certificate.json','primary-additive-program.json'}
def require(ok,message):
 if not ok: raise ValueError(message)
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def digest_file(p):
 h=hashlib.sha256();size=0
 with p.open('rb') as f:
  while True:
   chunk=f.read(1048576)
   if not chunk: break
   h.update(chunk);size+=len(chunk)
 return h.hexdigest(),size

def verify(out):
 s=read(out/'status.json');require(s.get('status')=='PASS','native run did not pass');require(s.get('sourceCommit')==PIN,'unmatched source pin');require(s.get('release')=='HOLD','unjustified release promotion')
 files=s.get('files',{});require(set(files)==REQUIRED,'missing or unexpected evidence files')
 for name,info in files.items():
  h,n=digest_file(out/name);require((h,n)==(info['sha256'],info['bytes']),'artifact hash or length mismatch: '+name)
 fc=read(out/'family-certificate.json');cc=read(out/'current-certificate.json');tc=read(out/'target-certificate.json');pc=read(out/'primary-certificate.json')
 for c in (fc,tc,pc):require(c.get('checks') and all(x.get('pass') is True for x in c['checks']),'native source checks failed')
 require(fc['request']['throughOrder']==2 and fc['request']['derivativeOrder']==5,'family request is not C5/N2')
 require(tc['request']['derivativeOrder']==3 and pc['request']['order']==2,'target or primary order mismatch')
 require(pc['bounds']['backgroundRow']['derivativeOrder']==3 and pc['bounds']['backgroundRow']['backgroundDerivativeOrder']==5,'wrong B3/C5 row')
 rows=pc['bounds']['targetRows'];require([x['derivativeOrder'] for x in rows]==[0,1,2,3] and [x['pole'] for x in rows]==[3,6,9,12],'wrong target jets')
 require(pc['domain']['actualWindow']['coefficientOrder']==1 and pc['domain']['oneFinitePrefixClaimedValidAtAllQ'] is False,'wrong source window or atlas scope')
 scope=pc['scope'];require(scope['actualFiniteDerivativeOrder']==2 and scope['actualOriginalPrimaryWOneHalfClassCertified'] is True and scope['actualOriginalPrimaryPressureWOneClassCertified'] is True,'missing finite primary class')
 for k in ('actualForcedInputWClassCertified','actualCompleteInitialN6TupleClassCertified','allFiniteIterationStagesClassCertified','completeN6','newLeanKernelProof'):require(scope[k] is False,'scope promotion: '+k)
 for c,filename,k in [(fc,'family-program.json','familyHash'),(cc,'current-native-program.json','currentHash'),(tc,'target-program.json','targetHash'),(pc,'primary-additive-program.json','primaryHash')]:
  h=files[filename]['sha256'];require(c['graph']['sha256']==h==s[k],'native program hash mismatch: '+filename)
 target=read(out/'target-program.json');require(len(target['nodes'])==tc['graph']['nodeCount'],'target node count mismatch');require(target['request']['derivativeOrder']==3,'target body request')
 full=read(out/'current-full-graph.json');native=read(out/'current-native-program.json');base=cc['source']['prefixNodeCount'];require(len(full['nodes'])==cc['graph']['nodeCount'],'current node count mismatch');require(full['nodes'][base:]==native['nodes'],'current native body is not full graph suffix');require(full['definitions']==native['definitions'] and full['kernel']==native['kernel'],'current definition mismatch')
 add=read(out/'primary-additive-program.json');require(add['targetBase']['sha256']==tc['graph']['sha256'] and add['currentBase']['sha256']==cc['graph']['sha256'],'primary wrong parent graphs')
 require(add['norm']['start']==len(target['nodes']) and add['current']['start']==len(full['nodes']),'primary additive offsets wrong')
 require(len(add['norm']['nodes'])==pc['graph']['normAddedNodes'] and len(add['current']['nodes'])==pc['graph']['currentAddedNodes'],'primary additive node lengths wrong')
 require(add['record']['request']['order']==2,'primary native record order wrong')
 return {'status':'PASS','sourceCommit':PIN,'familyHash':s['familyHash'],'targetHash':s['targetHash'],'currentHash':s['currentHash'],'primaryHash':s['primaryHash'],'scope':'finite primary source attachment only; forced input and release remain OPEN'}

def main():
 p=argparse.ArgumentParser();p.add_argument('directory',type=Path);p.add_argument('--out',type=Path,required=True);a=p.parse_args();result=verify(a.directory);a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print('PASS offline file hashes, parent links, current body, class scope')
if __name__=='__main__':main()
