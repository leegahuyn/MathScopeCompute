#!/usr/bin/env python3
"""Fresh original-source domain/exterior gate; every attempt is preserved."""
from __future__ import annotations
from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import json
import math
import os
from pathlib import Path
import re
import resource
import signal
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'research-ide/mathscope-m3/navier'
MAX_RSS=13*1024**3//2
MAX_AS=7*1024**3
TIMEOUT=1200
TEST_COUNT=11
ENTRY=[BASE/'source-exterior-force-jets.mjs',BASE/'source-localization-domain.mjs',
       BASE/'tests/exterior-force-jets-kernel.test.mjs',BASE/'tests/source-exterior-force-jets.test.mjs',Path(__file__).resolve()]

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def write_json(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def source_rows():
    seen=set()
    def visit(path):
        path=path.resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():raise ValueError('Missing/outside source import '+str(path))
        if path in seen:return
        seen.add(path)
        if path.suffix in ['.mjs','.js']:
            for spec in re.findall(r'''(?:from\s*|import\s*)['"](\.[^'"]+)['"]''',path.read_text()):visit(path.parent/spec)
    for path in ENTRY:visit(path)
    visit(ROOT/'research-ide/mathscope-m2/navier/research/evidence/common-physical-package-20261011/actual-common-physical-package-source-attempt6.json')
    return [{'path':str(path.relative_to(ROOT)),'sha256':digest(path),'bytes':path.stat().st_size} for path in sorted(seen)]

def family_memory(pid):
    pending,seen=[pid],set();rss=address=0
    while pending:
        here=pending.pop()
        if here in seen:continue
        seen.add(here)
        try:
            status=Path(f'/proc/{here}/status').read_text()
            r=re.search(r'^VmRSS:\s+(\d+) kB$',status,re.M);a=re.search(r'^VmSize:\s+(\d+) kB$',status,re.M)
            rss+=int(r[1])*1024 if r else 0;address=max(address,int(a[1])*1024 if a else 0)
            pending.extend(map(int,Path(f'/proc/{here}/task/{here}/children').read_text().split()))
        except (FileNotFoundError,ProcessLookupError):pass
    return rss,address

def independent_checks(record,domain):
    checks=[]
    def check(name,passed):checks.append({'id':name,'pass':bool(passed)})
    try:
        program=record['formulaProgram'];nodes,roots=program['nodes'],program['roots']
        def value(index,atoms=None):
            atoms=atoms or {}
            if index in atoms:return atoms[index]
            op,args=nodes[index]['op'],nodes[index]['args']
            if op=='rational':return Fraction(*map(int,args))
            if op=='add':return sum((value(i,atoms) for i in args),Fraction(0))
            if op=='multiply':return math.prod(value(i,atoms) for i in args)
            if op=='inverse':return 1/value(args[0],atoms)
            if op=='integer_power':return value(args[0],atoms)**args[1]
            raise ValueError('Unexpected rational-check operation '+op)
        def expr(name,atoms=None):return value(roots[name],atoms)
        def form(index):
            op,args=nodes[index]['op'],nodes[index]['args']
            if op=='rational':return Fraction(*map(int,args)),{}
            if op=='multiply':
                coefficient=Fraction(1);factors={}
                for child in args:
                    c,fs=form(child);coefficient*=c
                    for key,power in fs.items():factors[key]=factors.get(key,0)+power
                return coefficient,{k:v for k,v in factors.items() if v}
            if op in ['inverse','integer_power']:
                c,fs=form(args[0]);power=-1 if op=='inverse' else args[1]
                return c**power,{k:v*power for k,v in fs.items()}
            return Fraction(1),{index:1}
        check('same-domain-artifact-is-included-in-the-source-force-certificate',record['sourceDomainBridge']==domain)
        check('unchanged-common6-family-is-bound',record['sourceBinding']['common6FamilyGraph']['sha256']=='bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219')
        expected_ids=['fixed-original-background-and-common-selector','fixed-pulse-and-noncharacteristic-estimates',
                      'fixed-primary-covariance-and-signed-denominators','fixed-original-supported-mean-inverse','remaining-mean-and-pressure-maps-are-fixed-linear-maps']
        check('every-distinct-initial-domain-premise-retained',[r['id'] for r in domain['initialPrerequisites']]==expected_ids)
        check('initial-source-mean-map-really-retains-all-positive-inverses',domain['fixedMeanMap']['source']['actualImportedSourceExecuted'] and
              all(row['pass'] for row in domain['fixedMeanMap']['checks']) and all(Fraction(str(row[0]))>0 for row in domain['fixedMeanMap']['moments']['intervals']) and
              Fraction(str(domain['fixedMeanMap']['axial']['thetaInterval'][0]))>0)
        check('exact-whole-support-domain-margin',expr('sourceDomain_ratioExponent')==6 and expr('sourceDomain_tauRatio')==Fraction(1,32) and
              expr('sourceDomain_supportRatio')==Fraction(1,4) and expr('sourceDomain_strictSupportGap')==Fraction(1,4))
        check('original-mean-profiles-have-a-strict-rational-support-margin',1+Fraction(4,5)+2*Fraction(1,10)==expr('sourceDomain_meanSupportRationalUpper')<expr('sourceDomain_meanPatchUpper'))
        qbig=nodes[roots['sourceDomain_qBig']];common=nodes[roots['sourceDomain_commonQStar']]
        log2=next(i for i,node in enumerate(nodes) if node['op']=='log_positive' and nodes[node['args'][0]]=={'op':'rational','args':['2','1']})
        atom={roots['sourceDomain_ellMinimum']:Fraction(13),log2:Fraction(1)}
        check('actual-exponential-domain-exponents-differ-by-six',qbig['op']=='exp' and common['op']=='exp' and value(common['args'][0],atom)-value(qbig['args'][0],atom)==6)
        parameters=program['parametersExactExpressions']
        check('tiny-positive-source-h-and-lambda-not-replaced',parameters['h']=={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}} and
              parameters['lambda']=={'exp':{'product':[{'integer':-1000},{'ref':'T'}]}} and parameters['T']=={'sum':[{'exp':{'ref':'Md'}},{'integer':10}]} and
              parameters['Md']=={'integer':1048576})
        # Independently differentiate log(a/b) at u=1/2 for
        # a=exp(-1/u), b=exp(-1/(1-u)), du/ds=2.
        u=Fraction(1,2);log_ratio_prime=2/u**2+2/(1-u)**2;log_ratio_second=-8/u**3+8/(1-u)**3
        chi=Fraction(1,2);chi_s=-log_ratio_prime/4;chi_ss=-log_ratio_second/4
        check('cutoff-jets-from-independent-logistic-differentiation',expr('chiMid')==chi and expr('chiPrimeMid')==chi_s==-4 and expr('chiSecondMid')==chi_ss==0)
        radius2=Fraction(3,8);cr_over_r=4*chi_s;crr=4*chi_s+16*radius2*chi_ss;lapc=crr+cr_over_r
        check('Cartesian-radial-chain-factors-preserved',expr('radiusSquaredMidpoint')==radius2 and expr('sMidpoint')==radius2/2 and cr_over_r==-16 and lapc==-32)
        for row in record['rows']:
            j=row['order'];prefix='order_'+str(j)+'_'
            for hv in [Fraction(1,8),Fraction(1,1024),Fraction(1,2**4096)]:
                atoms={roots['h']:hv};A=Fraction(1,2)+hv;n=2*A+j
                P=math.prod(hv+k for k in range(j))*math.prod(1+hv+k for k in range(j))
                def pj(k):return math.prod(hv+l for l in range(k))*math.prod(1+hv+l for l in range(k))
                D=sum(math.comb(j,k)*pj(k)*pj(j-k) for k in range(j+1))
                radial=-(cr_over_r*radius2)/(2*n)+chi*(1-chi)
                angular=4*(A+j)*cr_over_r-lapc
                divergence=-lapc/(2*n)+2*(1-chi)*cr_over_r-2*n*chi*(1-chi)/radius2
                lap_pressure=-2*n*chi/radius2+2*cr_over_r-lapc/(2*n)
                divdiv=-2*chi*cr_over_r+2*n*chi**2/radius2
                check(f'order-{j}-independent-rising-integral-and-square-coefficients-h-{hv.denominator}',expr(prefix+'P',atoms)==P and expr(prefix+'D',atoms)==D)
                check(f'order-{j}-independent-cutoff-force-and-pressure-midpoint-h-{hv.denominator}',
                      expr(prefix+'radialNormalized',atoms)==radial>0 and expr(prefix+'thetaNormalized',atoms)==angular<0 and
                      expr(prefix+'divergenceNormalized',atoms)==divergence<0 and expr(prefix+'lapPressureNormalized',atoms)==lap_pressure and
                      expr(prefix+'divDivNormalized',atoms)==divdiv and lap_pressure+divdiv==divergence)
            p_scalar,p_factors=form(roots[prefix+'pressure']);s_scalar,s_factors=form(roots[prefix+'square'])
            ratio_factors=dict(p_factors)
            for key,power in s_factors.items():ratio_factors[key]=ratio_factors.get(key,0)-power
            ratio_factors={k:v for k,v in ratio_factors.items() if v}
            check(f'order-{j}-full-improper-pressure-normalization',p_scalar/s_scalar==Fraction(-1,2) and ratio_factors=={roots[prefix+'n']:-1})
            check(f'order-{j}-nonzero-force-divergence-not-deleted',row['midpoint']['normalizedDivergence']['sign']=='STRICTLY_NEGATIVE' and
                  row['midpoint']['normalizedTheta']['tinyHRetained'] and row['actualSourceAmplitudeUsed'] and not row['numericalGlobalFieldFilledIn'])
        check('no-global-jet-extension-or-active-whole-K-claim',record['scope']['wholeGlobalTerminalForceJetsConstructed'] is False and
              record['scope']['globalForceExtensionConstructed'] is False and record['scope']['wholeKEnergyNearTerminalComputed'] is False and
              record['globalExtension']['exteriorRowsSubstitutedForWholeFj'] is False)
        check('domain-theorem-application-distinct-from-final-field-execution',domain['domainProof']['sourceTheoremAppliedToExecutedInitialPremises'] and
              not domain['domainProof']['unknownHistoricalGammaValueUsed'] and not domain['scope']['fullN6FinalPotentialsConstructed'] and
              not domain['scope']['criterionAssessmentEdited'] and not record['scope']['wholeM3Complete'])
    except Exception as error:checks.append({'id':'independent-artifact-structure','pass':False,'errorType':type(error).__name__,'message':str(error)})
    return {'schema':'MathScope.N7.ExteriorDomainIndependentFraction/1','status':'PASS' if checks and all(row['pass'] for row in checks) else 'FAIL',
            'checks':checks,'newLeanExecuted':False,'scope':'Independent finite exact heat/coefficient, pressure/cutoff/divergence identities and fixed-domain premise structure; Lemma9.7/Prop9.9 remain explicitly cited source-theorem applications.'}

def main():
    if len(sys.argv)!=2 or not re.fullmatch(r'[1-9][0-9]*',sys.argv[1]):raise SystemExit('Usage: run-exterior-force-jets.py NEW_ATTEMPT_NUMBER')
    attempt=int(sys.argv[1]);before=source_rows();out=BASE/'evidence/source-exterior-force-jets-20261012'/f'attempt{attempt}'
    out.mkdir(parents=True,exist_ok=False);snapshot=out/'new-source-snapshot';snapshot.mkdir()
    for path in ENTRY:(snapshot/path.name).write_bytes(path.read_bytes())
    write_json(out/'source-bytes-before.json',{'files':before,'fileCount':len(before)})
    certificate=out/'exterior-force-jets.json';domain_path=out/'source-domain.json';log_path=out/'node.log'
    command=['node','--max-old-space-size=5120','--test','--test-reporter=tap','--test-concurrency=1',
             'research-ide/mathscope-m3/navier/tests/exterior-force-jets-kernel.test.mjs','research-ide/mathscope-m3/navier/tests/source-exterior-force-jets.test.mjs']
    env=dict(os.environ,M3_N7_EXTERIOR_EVIDENCE=str(certificate),M3_N7_DOMAIN_EVIDENCE=str(domain_path))
    def limit():resource.setrlimit(resource.RLIMIT_AS,(MAX_AS,MAX_AS))
    started=datetime.now(timezone.utc).isoformat();start=time.monotonic();peak_rss=peak_as=0;stopped=None
    with log_path.open('wb') as log:
        child=subprocess.Popen(command,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True,preexec_fn=limit)
        while child.poll() is None:
            raw=log_path.read_text(errors='replace');host_pids={int(value) for value in re.findall(r'"hostPID":(\d+)',raw)}
            readings=[family_memory(pid) for pid in host_pids];rss=sum(r[0] for r in readings);asize=max((r[1] for r in readings),default=0)
            peak_rss,peak_as=max(peak_rss,rss),max(peak_as,asize)
            if rss>MAX_RSS:stopped='OBSERVED_SOURCE_WORKER_RSS_LIMIT'
            elif time.monotonic()-start>TIMEOUT:stopped='OBSERVED_EXECUTION_TIME_LIMIT'
            if stopped:
                os.killpg(child.pid,signal.SIGTERM)
                try:child.wait(timeout=5)
                except subprocess.TimeoutExpired:os.killpg(child.pid,signal.SIGKILL)
                break
            time.sleep(.2)
        code=child.wait()
    after=source_rows();write_json(out/'source-bytes.json',{'before':before,'after':after,'unchanged':before==after})
    raw=log_path.read_text(errors='replace');independent={'status':'NOT_RUN','checks':[],'newLeanExecuted':False}
    if code==0 and certificate.is_file() and domain_path.is_file():independent=independent_checks(json.loads(certificate.read_text()),json.loads(domain_path.read_text()))
    write_json(out/'independent-fraction.json',independent)
    def count(name):
        matches=re.findall(r'^# '+name+r' (\d+)$',raw,re.M);return int(matches[-1]) if matches else None
    def observed(key):return max((int(v) for v in re.findall('"'+key+r'":(\d+)',raw)),default=0)
    passed,failed,skipped=count('pass'),count('fail'),count('skipped');node_peak=observed('maxRSSBytes');node_as=observed('vmSizeBytes')
    artifacts=[log_path,out/'source-bytes-before.json',out/'source-bytes.json',out/'independent-fraction.json']+[p for p in [certificate,domain_path] if p.is_file()]
    receipt={'schema':'MathScope.N7.SourceExteriorDomainObservedExecution/1','attempt':attempt,'startedAt':started,'finishedAt':datetime.now(timezone.utc).isoformat(),
             'command':command,'exitCode':code,'stoppedReason':stopped,'elapsedSeconds':time.monotonic()-start,'timeoutSeconds':TIMEOUT,
             'stdoutAndStderrCombined':True,'rawOutputPreserved':True,'observedPeakSourceWorkerFamilyRSSBytes':peak_rss,
             'observedMaximumSingleProcessASBytes':peak_as,'nodeResourceUsagePeakRSSBytes':node_peak,'nodeSelfReportedMaximumASBytes':node_as,
             'sourceWorkerFamilyRSSLimitBytes':MAX_RSS,'perProcessAddressSpaceLimitBytes':MAX_AS,
             'nodeTests':{'passed':passed,'failed':failed,'skipped':skipped},'sourceFilesUnchanged':before==after,'sourceFileCount':len(before),
             'independentStatus':independent['status'],'independentCheckCount':len(independent['checks']),
             'artifacts':[{'path':str(p.relative_to(ROOT)),'sha256':digest(p),'bytes':p.stat().st_size} for p in artifacts],
             'sourceDomainPrerequisitesExecuted':code==0 and domain_path.is_file(),'criterionAssessmentEdited':False,
             'originalFinalN6FieldsConstructed':False,'fullLocalizedForceConstructed':False,'wholeKEnergyNearTerminalComputed':False,
             'globalForceExtensionExecuted':False,'newLeanExecuted':False,'wholeM3Complete':False,
             'pass':code==0 and stopped is None and before==after and passed==TEST_COUNT and failed==0 and skipped==0 and independent['status']=='PASS' and
                    certificate.is_file() and domain_path.is_file() and max(peak_rss,node_peak)<=MAX_RSS and max(peak_as,node_as)<=MAX_AS}
    write_json(out/'receipt.json',receipt);print(json.dumps(receipt,ensure_ascii=False,indent=2),flush=True)
    return 0 if receipt['pass'] else 1

if __name__=='__main__':raise SystemExit(main())
