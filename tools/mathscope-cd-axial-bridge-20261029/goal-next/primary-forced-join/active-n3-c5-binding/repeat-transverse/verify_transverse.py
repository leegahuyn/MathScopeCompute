from collections import Counter
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

goal, bundle, prior_folder, pulse_proof_file, output = map(Path, sys.argv[1:])
sys.path.insert(0,str(goal/'first-force-repair'))
from check_repeat_forced_candidates import Graph, STREAM, Exact

def read(parent,name,pin=None):
    body=(parent/name).read_bytes()
    digest=sha256(body).hexdigest()
    if pin:
        assert digest==pin,(name,digest)
    return json.loads(body),digest

repair=goal/'first-force-repair'
archive,archive_sha=read(bundle,'post-five-repeat-forced-candidate.json','43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf')
registry,registry_sha=read(bundle,'original-source-functions.json','5d8a751e5ad4b5d2bd4efa5a1f285dc465b0a5b19b3e0bbf8113f160bb582920')
official,official_sha=read(repair,'independent-second-forced-candidates.json','3e3911a19698f1f59187a34665a86be9b1e2f6296a3fa113be1b5f12be2d5285')
waves,wave_sha=read(repair,'repeat-own-wave-operands-detailed.json','7ac31a18079dd4cabf9f190dfbca0559d1ade8ea779aa4866238cd7b935eba67')
low,low_sha=read(repair,'low-forced-collar-binding.json','f6ba2421724e70caba338fa6483dcd399af1813aea3d33ebf8835bfeeb5eb697')
assert official['graphSHA256']==archive['snapshot']['node_stream_sha256']==waves['graphSHA256']==low['candidateGraphSHA256']
assert official['registrySHA256']==waves['registrySHA256']==registry_sha
defs=json.loads(registry['definitions'])
expression={
 'm3_coupled_expression_partial':{row['id']:row for row in defs[0]},
 'm3_aux_expression_partial':dict(enumerate(json.loads(registry['base']['expressionDefinitions']))),
 'actual_expression_partial':dict(enumerate(json.loads(registry['base']['base']['expression']))),
}
parts=['real','imaginary']
wavecases={(row['key'],row['mode']):row for row in waves['waves']}
lowcases={(row['key'],row['mode']):row for row in low['liveLowModeSubtractions']}
formalV=622805
length=623027
r0=300171
prior,prior_sha=read(prior_folder,"corrected-first-force.json","c7d429adb927a3020b870df3fb755806061727ed2efc7d8df8736c785e65f835")
pulse_proof,pulse_proof_sha=read(pulse_proof_file.parent,pulse_proof_file.name,
    "547c4079aa37fbf0afb6463a34f392e52eb25cf1915dbfb05ad86b50ba5c7ed6")
assert pulse_proof["inputs"]["archive"]==archive_sha
assert pulse_proof["inputs"]["graph"]==official["graphSHA256"]
assert pulse_proof["inputs"]["registry"]==registry_sha
assert pulse_proof["inputs"]["firstForce"]==prior_sha
assert pulse_proof["inputs"]["firstCollarIdeal"]==low_sha
assert pulse_proof["componentSlots"]==240 and pulse_proof["lazyGuards"]==1680
paths={r["key"]:r for r in pulse_proof["pathRows"]}
assert len(paths)==10 and all(r["transverseGuard"][2]==r0 for r in paths.values())
prior_rows={(r["key"],r["m"]):r for r in prior["rows"]}
stored={r["id"]:r for r in defs[3]}


with TemporaryFile() as file:
 graph=Graph(bundle/STREAM,file,archive['snapshot'])
 a=Exact(graph)
 assert graph.node(formalV)[0]=='coordinate'
 invR0=a.inv(a.of(r0))
 assert a.of(r0)==a.scalar(Fraction(1,2**34))
 def exterior_transverse(root,xi):
    op,args=graph.node(root)
    if op!="smooth_piecewise":
      return False
    norm,lo,hi,left,middle,right=args
    if a.of(hi)!=a.scalar(Fraction(3,4)) or right!=0:
      return False
    nOp,nArgs=graph.node(norm)
    if nOp!="sqrt_positive":
      return False
    pOp,pArgs=graph.node(nArgs[0])
    return pOp=="integer_power" and pArgs[1]==2 and a.of(pArgs[0])==a.mul(a.of(xi),invR0)

 used_step=Counter()
 used_definition=Counter()
 unexplained=Counter()
 calls=Counter()
 @cache
 def zero(root,xi,key):
    if root==0:
      return True
    op,args=graph.node(root)
    if op=="add":
      return all(zero(i,xi,key) for i in args)
    if op=="multiply":
      return any(zero(i,xi,key) for i in args)
    if op=="integer_power" and args[1]>0:
      return zero(args[0],xi,key)
    if exterior_transverse(root,xi):
      used_step[(root,xi)]+=1
      return True
    arcs=[prior_rows[key,1],prior_rows[key,2]]
    if op=="m3_forced_pulse_partial":
      system,part,component,x,par,orders=args
      for arc in arcs:
        old=stored[arc["system"]]
        if system==old["id"] and x==arc["path"]["pulse"] and par==old["parameters"]:
          assert part in parts and component in range(3) and len(orders)==len(old["directions"])
          calls[(op,system)]+=1
          return True
      unexplained[(op,str(root))]+=1
      return False
    if op in expression:
      system,actual,orders=args
      d=expression[op][system]
      for arc in arcs:
        old=stored[arc["system"]]
        if not d["name"].startswith("CoupledForced_source_"):
          continue
        component,part=d["name"].split("_")[-2:]
        part_row=next(c for c in arc["components"] if c["j"]==int(component) and c["part"]==part)
        partial=graph.node(part_row["formalPathSource"])
        if partial[0]==op and system==partial[1][0]:
          assert d["parameters"]==[old["variable"],*old["parameters"]]
          if actual==[arc["path"]["pulse"],*old["parameters"]]:
            calls[(op,system)]+=1
            return True
      matching=[f for f,x in zip(d["parameters"],actual,strict=True) if x==xi]
      if len(matching)==1:
        inward=matching[0]
      elif d["parameters"]==actual:
        inward=xi
      else:
        unexplained[(op,d["name"])]+=1
        return False
      passed=zero(d["body"],inward,key)
      if passed:
        used_definition[(op,system,tuple(orders))]+=1
      return passed
    unexplained[(op,str(root))]+=1
    return False

 values=[]
 for (key,m),case in wavecases.items():
    pulse=case['guards'][-2][0]
    assert case['guards'][-1][1:]==[0,length]
    assert case['guards'][-2]==paths[key]['transverseGuard']
    assert a.of(case['guards'][-2][1])==a.neg(a.of(r0))
    assert case['guards'][:5]==paths[key]['slowAndShellGuards']
    assert prior_rows[key,1]['path']==paths[key]['originalPath']
    checks=[]
    for j,field in enumerate(case['fields']):
        for part in parts:
            for origin in ('forcedCoefficient','signedCoefficient','body'):
                root=field[part][origin]
                left=right=zero(root,pulse,key)
                if not all([left,right]):
                    print('FAIL wave',key,m,j,part,origin,root,left,right,flush=True)
                checks.append([j,part,origin,root,left])
            assert all(zero(app['root'],pulse,key) for app in field[part]['nativeApplications'])
    values.append({'key':key,'m':m,'pulse':pulse,'checks':checks})
 tails=[]
 inherited=[]
 for template in archive['templates']:
    key=template['key']
    for row in template['rows'][:2]:
        m=row['m']
        lens=lowcases[key,m]
        pulse=lens['pathPreservedOwnXi']
        for term in row['terms']:
            if term['family']=='first-forced-remaining-source':
                assert term['value']==lens['remaining']
                assert lens['pathPreservedOwnXi']==paths[key]['transverseGuard'][0]
                assert lens['checkedZeroInitialDataAndProjection']
                inherited.append({'key':key,'mode':m,'remaining':term['value'],
                    'firstSupportedRoots':[item['supported'] for item in lens['actualSourceRoots']]})
                continue
            for j,z in enumerate(term['value']):
                for part in parts:
                    root=z[part]
                    left=right=zero(root,pulse,key)
                    if not all([left,right]):
                        print('FAIL tail',key,m,term['family'],j,part,root,left,right,flush=True)
                    tails.append([key,m,term['family'],j,part,root,left])
 assert all(c[-1] for row in values for c in row["checks"]) and all(c[-1] for c in tails)
 assert len(values)==20 and len(tails)==240 and len(inherited)==20
 assert zero(3861788,paths["0:1"]["transverseGuard"][0],"0:1")
 assert not zero(3861788,paths["1:1"]["transverseGuard"][0],"1:1")
 assert len(used_step)==6
 print("PASS transverse strict collar for all 240 supported slots",flush=True)
 data={
   "schema":"MathScope.N6.ArchivedRepeatTransverseGuardRemoval/1","run":43015175416,
   "sourcePins":{"archive":archive_sha,"graph":official["graphSHA256"],"registry":registry_sha,
      "closedPulse":pulse_proof_sha,"originalFirstForced":prior_sha,"firstCollarIdeal":low_sha,"repeatWaveBodies":wave_sha},
   "graphNodes":len(graph.offsets),"checkedPositiveSystems":40,"componentSlots":240,
   "actualWaveBodies":values,"directSubtractions":tails,"inheritedFirstRemainingSource":inherited,
   "readback":{"exactTransverseCutoffPairs":[list(pair) for pair in sorted(used_step)],"nativeDerivativeUses":len(used_definition),
      "originalFirstZeroInputAndStateUses":[[op,system,count] for (op,system),count in sorted(calls.items())]},
   "originalFirstParticularNegativeControl":{"actualStateRoot":3861788,"originalRow":"0:1","differentRowRejected":"1:1"},
   "analyticPrerequisites":"On the admitted full fixed-chart transverse collar and all original closed pulse times the first corrected source vanishes by its original support ideal and xi(H_w)=xi. The original finite normal denominators, zero-data linear ODE uniqueness and ordinary native derivatives identify its forced velocity and pressure with zero there. Those ordinary/native domains must hold in a neighborhood of any transverse face where an unclipped value is used.",
   "conclusion":"On strict four original slow offsets and strict Xa<X<Xb, where the original ordinary/unclipped operands are admitted, the repeated guarded and supported inputs agree along the original closed pulse through both transverse reference faces. Their equality at a face uses |xi|=r0>3r0/4 and the actual local zero collar.",
   "remaining":"Five slow/shell guard faces, source-definedness outside the admitted transverse neighborhood, fresh same-live N3 transport and full supported-source norm remain separate.",
   "actualStateOutsideNativePulseEvaluated":False,"numericBound":False,"finalJets":0,"release":"HOLD",
 }
 with output.open('x',encoding='utf8',newline='\n') as stream:
    json.dump(data,stream,indent=2)
    stream.write('\n')
