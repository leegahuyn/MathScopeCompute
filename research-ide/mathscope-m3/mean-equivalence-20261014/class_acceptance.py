"""Actual j=0 class/moment ledger: no algebra-to-analytic promotion."""
import argparse, hashlib, json
from pathlib import Path
def run(inputs,out):
    prior=inputs/'initial_residual/initial-state-audit.json'
    data=json.loads(prior.read_text(encoding='utf8'))
    if data['source']['fullParentNodesSHA256']!='7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f':raise ValueError('Wrong class source parent')
    if data['orderedOriginalUpdates']!=['primary-current-pressure','temporal-8.20','post-temporal-8.12','five-moments-8.25-on-new-P-J','post-moment-8.12']:raise ValueError('Wrong initial state or stale pressure order')
    if len(data['requirements'])!=10 or any(x['proved'] for x in data['requirements']):raise ValueError('Baseline class obligations changed')
    rows=[]
    for item in data['requirements']:
        rows.append({'id':item['id'],'sourceRoots':item['sourceRoots'],'required':item['required'],'minimalLemma':item['minimalLemma'],'status':'UNRESOLVED','quantifier':'There exist original source constants for every required derivative order, uniformly on one common original q domain','finiteFiveRowIdentitiesSuffice':False,'wholeMeanExpressionIdentitiesSuffice':False})
    source=data['source'];result={'schema':'MathScope.N6.CurrentInitialClassAcceptance/1','source':source,'baselineClassAuditSHA256':hashlib.sha256(prior.read_bytes()).hexdigest(),'B0':'7/10','C0star':'6/5','requestedState':'original j=0 finite correction state','sequence':data['orderedOriginalUpdates'],'latestSourceBindings':data['actualVelocityAndLatestPressureRoots'],'requirements':rows,'preservedActualNonzeroDefectAndPressureCutoffRemainders':True,'allOrderSourceFamilyAndTargetNormProducerRecovered':False,'mathematicalStatus':'UNRESOLVED','originalN601Complete':False,'originalProgressChanged':False,'rigorousNumericWholeStateCertificate':None,'numericalUnavailableReason':'No authenticated simultaneous source envelope for all required derivative orders and common domain. No numerical sampling is used as a substitute.'}
    out.mkdir(parents=True,exist_ok=True);(out/'initial-class-acceptance.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return result
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--inputs',required=True);p.add_argument('--output',required=True);a=p.parse_args();r=run(Path(a.inputs),Path(a.output));print(json.dumps({'N601':r['mathematicalStatus'],'requiredOriginalClasses':len(r['requirements']),'B0':r['B0'],'C0star':r['C0star']}))
