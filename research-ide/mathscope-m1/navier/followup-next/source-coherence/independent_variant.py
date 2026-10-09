#!/usr/bin/env python3
"""Independent provenance and parameter-path checks for the executed variant.

No global analytic theorem is inferred from these consistency checks.
"""
from pathlib import Path
from fractions import Fraction as F
import hashlib, json, subprocess, sys
sys.set_int_max_str_digits(0)
ROOT=Path(__file__).resolve().parent
V=ROOT/'variants/parameter-path-md101-logp15'
def read(name):return json.loads((V/name).read_text())
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
checks=[]
def check(name,value):checks.append({'name':name,'passed':bool(value)})
a=read('source-axis-cone-refined.json')
d=read('uniform-source-debt-final.json')
p=read('axis-prefix-final.json')
r=read('variant-run.json')
base=json.loads((ROOT/'uniform-source-debt-final.json').read_text())
check('actualDifferentMd',a['sourcePressureCertificate']['parametersExact']['Md']=='101/100')
check('actualDifferentLogP',a['sourcePressureCertificate']['parametersExact']['logP']=='15')
check('pressureAxisContinuationH',a['sourcePressureCertificate']['parameterHExact']==a['selectedParameters']['h']==d['singleSourceProfile']['h'])
check('physicalRadiusUsesActualLogP',d['singleSourceProfile']['logXR']=='log(110)+10*(logC+15)')
check('positivePStarLowerChanged',F(d['estimates']['minimumPStar']['exact'])>F(base['estimates']['minimumPStar']['exact'])>0)
check('actualPressureMassChanged',F(a['sourcePressureCertificate']['totalMassLower'])>F(json.loads((ROOT/'source-axis-cone-refined.json').read_text())['sourcePressureCertificate']['totalMassUpper']))
check('newAxisAndNormalization',d['singleSourceProfile']['Lambda']!=base['singleSourceProfile']['Lambda'] and d['singleSourceProfile']['logC']!=base['singleSourceProfile']['logC'])
check('prefixParametersExactlyBound',all(p['sourceProfileParameters'][k]==d['singleSourceProfile'][k] for k in ['h','j0','Lambda','sigmaStar','logC']))
node="""const fs=require('node:fs'),h=require('node:crypto').createHash;
const d=JSON.parse(fs.readFileSync(process.argv[1]));
process.stdout.write(h('sha256').update(JSON.stringify({...d,execution:undefined})).digest('hex'));"""
mathematical_hash=subprocess.check_output(['node','-e',node,str(V/'source-axis-cone-refined.json')],text=True)
check('fullMathematicalAxisCertificateHash',mathematical_hash==p['sourceCertificateBinding']['sourceCertificateMathematicalHash'])
check('actualPrefixDegreesAndPrecision',p['input']['radialDegree']==24 and p['input']['etaDegree']==2 and p['arithmetic']['bits']==1024)
check('prefixIncludesDirectedRoundingAndRadialTail',p['gates']['roundingIncluded'] and p['gates']['radialInfiniteTailIncluded'])
check('sameActualAxisFileHash',d['sourceFiles']['axisCertificate']['sha256']==sha(V/'source-axis-cone-refined.json'))
check('sameActualRefinementHash',d['sourceFiles']['continuationRefinement']['sha256']==sha(V/'continuation-refinement.json'))
check('allActualLocalScalarChecks',all(d['checks'].values()) and all(read('continuation-refinement.json')['checks'].values()))
check('noGlobalOrKernelPromotion',all(r[k] is False for k in ['fullProfileCertified','entireOuterProfileConeCertified','generatedAnalyticPremisesKernelChecked','originalGlobalParameterHierarchyComplete']))
check('unchangedOriginalFiles',all(sha(ROOT/f)==value for f,value in r['originalSourceHashes'].items()))
parity=json.loads((ROOT/'variants/baseline-exact-parity/exact-baseline-parity.json').read_text())
check('fullJSONBaselineParityNoExcludedFields',parity['excludedFields']==[] and all(x['byteForByteEqual'] and x['referenceSHA256']==x['regeneratedSHA256'] for x in parity['comparisons']))
for name,args in [
    ('existingEvidenceCannotBeOverwritten',['--baseline-check']),
    ('sourceNormCannotBeInjected',['--name','invalid-untrusted-bound','--norm','1']),
    ('unsupportedLogPRejected',['--name','invalid-logp-range','--logP','101']),
    ('nonpositiveHRejected',['--name','invalid-nonpositive-h','--h','0']),
]:
    proc=subprocess.run(['node',str(ROOT/'rebuild-source-variant.mjs'),*args],text=True,capture_output=True)
    check(name,proc.returncode!=0 and not (ROOT/'variants'/args[1]).exists() if args[0]=='--name' else proc.returncode!=0)
out={'schema':'MathScope.Navier.SourceVariantIndependentAudit/1','status':'PASSED' if all(x['passed'] for x in checks) else 'FAILED','passed':sum(x['passed'] for x in checks),'total':len(checks),'variantDirectory':str(V.relative_to(ROOT)),'finalSourceSHA256':sha(V/'uniform-source-debt-final.json'),'mathematicalAxisCertificateHash':mathematical_hash,'checks':checks,'scope':'Independent exact binding, changed-source propagation, immutable baseline parity, and failed-input checks. The analytic theorem and whole outer cone are not proved by this audit.','wholeProfileCertified':False}
(ROOT/'independent-variant.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'status':out['status'],'passed':out['passed'],'total':out['total'],'failed':[x['name'] for x in checks if not x['passed']]},indent=2))
assert out['status']=='PASSED'
