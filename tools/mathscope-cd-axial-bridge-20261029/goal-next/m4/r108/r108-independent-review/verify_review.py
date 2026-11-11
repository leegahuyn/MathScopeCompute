"""Offline independent review: scoped first-party receipt evidence, no credential use."""
import argparse,hashlib,json
from pathlib import Path
CANDIDATE='0504482900dbeac2faf992be9a923bc51ab1de6bcec0b82ac058085444669735';COMMIT='cfd810e9becc8d14680907f45013fb8e85b68654'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def verify(root):
 d=root/'r108-hosted-screen';r=root/'r108-independent-review'
 p=read(r/'independent-patch.json');h=read(r/'independent-hold.json');w=read(r/'worker-binding.json');s=read(d/'actual-post-publication-screen.json');site=read(d/'isolated-deployment.json');pub=read(r/'public-readback.json')
 assert p['candidateSHA256']==CANDIDATE and p['restoredBaselineSHA256']==p['baselineSHA256'] and p['patches']==4
 assert p['checks']['DECLARED_CAPABILITIES_SCOPE']=='PASS_LOCAL_COMBINED_CANDIDATE' and p['checks']['PATCH_TEST_ROLLBACK']=='PASS_EXACT_BYTE_ROUND_TRIP_AND_LOCAL_BROWSER'
 assert len(h['acceptedCriterionIds'])==15 and h['openCriterionIds']==['R1-08'] and h['release']['gate']=='HOLD' and h['release']['canFreeze'] is False
 assert w['commit']==COMMIT and w['candidate_matches_local'] is True and w['embedded_html_sha256']==CANDIDATE and w['embedded_html_bytes']==28928002
 assert site['deployment']['status']=='succeeded' and site['deployment']['id']=='appgdep_6af47d1371308191aa59fcbb4e07fae5' and site['source']['commit_sha']==COMMIT and site['source']['candidateSHA256']==CANDIDATE
 assert site['access']['mode']=='custom' and site['access']['userCount']==1 and site['access']['externalVisitorCount']==0
 assert pub['site']['anonymousHTTPStatus']==403 and pub['operating']['matchesRecordedBeforeHash'] is True
 assert s['http']['status']==200 and s['http']['candidateSHA256']==CANDIDATE and s['http']['bytes']==28928002+s['http']['providerInsertion']['bytes']
 assert s['browserHttp']['status']==200 and s['browserHttp']['path']=='/v0.3.1.html' and s['responseSubstitution'] is False
 assert s['selectedCriterion']=='R1-08' and s['releaseHoldVisible'] is True and 'HOLD' in s['holdText'] and '56 / 64' in s['historicalModuleStatus']
 assert {x['fixture'] for x in s['fixtures']}=={'su2','point'} and all(x['status']=='COMPLETED' for x in s['fixtures'])
 for row in s['fixtures']:
  for k in ('inputHash','resultHash','sourceWorkerSHA256'):assert len(row[k])==64 and all(c in '0123456789abcdef' for c in row[k])
 assert len(s['viewports'])==4
 for v in s['viewports']:assert sha(d/v['filename'])==v['sha256']
 return {'schema':'MathScope.R108.IndependentReview/1','criteria':{'DECLARED_CAPABILITIES_SCOPE':'PASS_SCOPED_LOCAL_M1_M2_CATALOG','MODULE_STATUS_GLOBAL_HOLD_DISTINCTION':'PASS_WITH_HISTORICAL_DISPLAY_CAVEAT','PATCH_TEST_ROLLBACK':'PASS_EXACT_ROUNDTRIP','ACTUAL_POST_PUBLICATION_SCREEN_RECEIPT':'PASS_PRIVATE_SITE_SERVICE_AUTHENTICATED'},'independentReviewerVerdict':'PASS_SCOPE_WITH_DOCUMENTED_LIMITATIONS','originalEvaluatorRegistration':'OPEN_R1_08_REQUIRES_REVIEW_DIGEST_REGISTRATION','sourceCommit':COMMIT,'candidateSHA256':CANDIDATE,'hostedResponseSHA256':s['http']['sha256'],'providerInsertion':s['http']['providerInsertion'],'screenHashes':{v['filename']:v['sha256'] for v in s['viewports']},'limitations':['The actual screen uses official service authentication rather than a tested human sign-in flow.','The isolated site CSP blocks the original WebsitePublisher external assets and P7 connection; screenshot shows Failed to fetch, and an empty uncaught pageerror list does not mean all functional requests passed.','The screen displays historical M3 56/64 and M4 final unconfirmed, not current M3 62/64 and independently assessed M4 15/16.','Provider adds 1114 bytes to HTTP response; prefix and suffix comparison and embedded source binding establish candidate relationship, not identical HTTP bytes.','Scoped candidate only; no global release, final jets, or user-visible operating site change is authorized by this review.'],'release':'HOLD'}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args();result=verify(a.root);a.out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8');print('PASS independent R1-08 scoped review; original evaluator registration OPEN; global HOLD')
if __name__=='__main__':main()
