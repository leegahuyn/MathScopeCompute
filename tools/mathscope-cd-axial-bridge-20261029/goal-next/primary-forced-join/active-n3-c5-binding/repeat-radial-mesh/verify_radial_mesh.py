from collections import Counter
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

goal, bundle, prior_folder, pulse_proof_file, runtime, output = map(Path, sys.argv[1:])
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
source_pins={
 "mathscope-m3/navier/source-global-current.mjs":"93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760",
 "mathscope-m2/navier/actual-physical-full-curl.mjs":"539753a76375338653ff7420752270b600dc8c78893212ce541c47484b2f6454",
}
for path,pin in source_pins.items():
    assert sha256((runtime/path).read_bytes()).hexdigest()==pin,path
source=(runtime/"mathscope-m2/navier/actual-physical-full-curl.mjs").read_text(encoding="utf8")
assert "const value=G.choose(offset,q(-3,4),q(3,4),G.zero,quotient,G.zero)" in source
assert "The nearest integer" in source
paths={r["key"]:r for r in pulse_proof["pathRows"]}
guard_data,guard_sha=read(goal/"corrected-flat","seven-guards-receipt.json","722f8227d71d18041b62449d10e957ce237625ab791c50b84d2ebedb754273d1")
offset=625195
factor=625227
denom=625223
bump=625210
R=622802
assert len(paths)==10 and all(r["slowAndShellGuards"][3][0]==offset for r in paths.values())
axis=next(row for row in guard_data["slowAxes"] if row["offset"]==offset)
assert axis=={"offset":offset,"factor":factor,"denominator":denom,"bumps":{"0":bump,"1":625218,"-1":625203}}
prior_rows={(r["key"],r["m"]):r for r in prior["rows"]}
stored={r["id"]:r for r in defs[3]}


with TemporaryFile() as file:
 graph=Graph(bundle/STREAM,file,archive['snapshot'])
 a=Exact(graph)
 assert graph.node(formalV)[0]=='coordinate'
 assert graph.node(R)[0]=="coordinate"
 ell,jR=622791,623855
 Z,T=622803,622804
 chartS,chartX=622820,622824
 representative_formal=[622807,622808,622809]
 representative_actual=[623950,623955,623935]
 assert all(graph.node(node)[0]=="coordinate" for node in [ell,jR,Z,T,*representative_formal])
 assert a.of(offset)==a.sub(a.mul(a.pow(a.of(ell),6),a.of(R)),a.of(jR))
 assert graph.node(chartS)==("actual_monotone_root",[2,Z,T])
 monotone=json.loads(registry["base"]["base"]["monotone"])[2]
 assert monotone["parameters"]==[Z,T]
 assert a.of(monotone["left"])==a.scalar(Fraction(1,2))
 assert a.of(monotone["right"])==a.scalar(2)
 assert a.of(chartX)==a.mul(a.pow(a.of(R),2),a.inv(a.mul(a.scalar(2),a.of(chartS))))
 assert graph.node(representative_actual[2])[0]=="actual_monotone_root"
 assert not set(graph.reach(representative_actual)).intersection({R,Z,T,formalV,635044,635045})
 assert not set(graph.reach([offset])).intersection({Z,T,formalV,635044,635045})
 # A one-dimensional radial move inside this original fixed chart
 # preserves q and eta arguments, since s solves the retained slow root
 # in (Z,T) and eta uses Z and this same s.
 x,lo,hi,left,middle,right=graph.args(factor,"smooth_piecewise")
 assert (x,left,right)==(offset,0,0)
 assert a.of(lo)==a.scalar(Fraction(-3,4)) and a.of(hi)==a.scalar(Fraction(3,4))
 square_root=next(node for node in graph.reach([middle]) if graph.node(node)==("sqrt_positive",[denom]))
 assert a.of(middle)==a.mul(a.of(bump),a.inv(a.of(square_root)))
 assert a.of(denom)==a.add(*(a.pow(a.of(node),2) for node in axis["bumps"].values()))
 for shift,node in sorted((int(j),node) for j,node in axis["bumps"].items()):
    norm,blo,bhi,bl,bmiddle,br=graph.args(node,"smooth_piecewise")
    assert a.of(blo)==a.scalar(Fraction(1,4)) and a.of(bhi)==a.scalar(Fraction(3,4))
    assert (bl,br)==(1,0)
    [square]=graph.args(norm,"sqrt_positive")
    root,exponent=graph.args(square,"integer_power")
    assert exponent==2 and a.of(root)==a.sub(a.of(offset),a.scalar(shift))
    argument,order=graph.args(bmiddle,"source_step_derivative")
    assert order==0 and a.of(argument)==a.sub(a.scalar(Fraction(3,2)),a.mul(a.scalar(2),a.of(norm)))
 # At either tested face the neighbor equals one; its denominator is
 # therefore nonvanishing on a two-sided fixed-label neighborhood.
 def b_at_plateau(x):
    if abs(x)<=Fraction(1,4):
      return 1
    if abs(x)>=Fraction(3,4):
      return 0
    raise ValueError("not a plateau point")
 faceNumerics={}
 for face in [Fraction(-3,4),Fraction(3,4)]:
    evaluated=[b_at_plateau(face-j) for j in [-1,0,1]]
    assert evaluated[1]==0 and sum(x*x for x in evaluated)==1
    faceNumerics[str(face)]={"threeBumpValues":evaluated,"denominatorBeforeSqrt":1}
 offset_inputs={offset,R,ell,jR,625193,625194}
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
    if root==factor:
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
      parameters=dict(zip(d["parameters"],actual,strict=True))
      if all(parameters.get(operand,operand)==operand for operand in offset_inputs):
        # Frozen representative or pulse actuals may change; none of the
        # source roots determining the selected slow factor may change.
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

 first_jet_generators=set()
 first_support_cases=[]
 for entry in low['firstSourceIdeal']:
    key=entry['key']
    verified=[]
    for system,orders in entry['distinctSystemOrders']:
        native=expression['m3_coupled_expression_partial'][system]
        assert native['name'].startswith(('InitializedOriginalWave_', 'InitializedOriginalPrimaryPressure_', 'OriginalPrimaryPrincipalFlat_'))
        assert '_'+key.replace(':','_')+'_' in native['name']
        assert zero(native['body'],offset,key),(key,system,native['body'])
        first_jet_generators.add(system)
        verified.append([system,orders,native['body']])
    first_support_cases.append({'key':key,'mode':entry['mode'],'primaryGeneratorJets':verified})
 assert len(first_support_cases)==20
 values=[]
 for (key,m),case in wavecases.items():
    pulse=offset
    assert case['guards'][-1][1:]==[0,length]
    assert case['guards'][-2]==paths[key]['transverseGuard']
    assert case['guards'][3]==[offset,lo,hi]
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
    values.append({'key':key,'m':m,'radialOffset':pulse,'checks':checks})
 tails=[]
 inherited=[]
 for template in archive['templates']:
    key=template['key']
    for row in template['rows'][:2]:
        m=row['m']
        lens=lowcases[key,m]
        pulse=offset
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
 assert len(first_jet_generators)==100
 assert len(values)==20 and len(tails)==240 and len(inherited)==20
 assert zero(3861788,offset,"0:1")
 assert not zero(3861788,offset,"1:1")
 assert list(used_step)==[(factor,offset)]
 print("PASS radial face factor for all 240 supported slots",flush=True)
 data={
   "schema":"MathScope.N6.ArchivedRepeatRadialMeshFaceRemoval/1","run":43015175416,
   "sourcePins":{"archive":archive_sha,"graph":official["graphSHA256"],"registry":registry_sha,
      "closedPulse":pulse_proof_sha,"originalFirstForced":prior_sha,"firstCollarIdeal":low_sha,
      "originalSevenGuards":guard_sha,"repeatWaveBodies":wave_sha,**source_pins},
   "graphNodes":len(graph.offsets),"checkedPositiveSystems":40,"componentSlots":240,
   "radialGuard":{"offset":offset,"definition":"ell^6 R-j_R","factor":factor,"numerator":bump,
       "denominator":denom,"faceReadback":faceNumerics,"centralBumpRemovedControl":"A unit numerator would give 1, not 0, on either face."},
   "fixedChart":{"R":R,"Z":Z,"T":T,"ell":ell,"j_R":jR,"s":chartS,"X":chartX,
       "nativeSlowRootArguments":[Z,T],"representativeFormal":representative_formal,
       "representativeActual":representative_actual,"pathLeavesOffsetAndRepresentativeFixed":True},
   "firstSupportIdealAtRadialFace":first_support_cases,
   "actualWaveBodies":values,"directSubtractions":tails,"inheritedFirstRemainingSource":inherited,
   "readback":{"exactRadialFactor":[factor,offset],"nativeDerivativeUses":len(used_definition),
      "originalFirstZeroInputAndStateUses":[[op,system,count] for (op,system),count in sorted(calls.items())]},
   "originalFirstParticularNegativeControl":{"actualStateRoot":3861788,"originalRow":"0:1","differentRowRejected":"1:1"},
   "analyticPrerequisites":"On the admitted fixed representative chart, the original radial slow factor and its admitted derivatives vanish at both s_R faces since the central original bump is flat with positive denominator. Ordinary admitted cofactors and the fixed-label H_w transport are required. Native first Forced zero-data parameter variations then vanish through the required finite orders by induction in derivative order, using the proven first source ideal for the complete w interval.",
   "conclusion":"The actual guarded and unclipped supported components agree along the original closed pulse through both R-mesh faces ell^6 R-j_R=+/-3/4, for strict other slow guards and strict original shell, wherever ordinary operands remain admitted in the fixed frozen chart.",
   "remaining":"Band, Z-mesh and T-mesh faces and the physical shell, source-definedness beyond admitted neighborhoods, N3 same-live transport and complete supported-source norm remain separate.",
   "actualStateOutsideNativePulseEvaluated":False,"numericBound":False,"finalJets":0,"release":"HOLD",
 }
 with output.open('x',encoding='utf8',newline='\n') as stream:
    json.dump(data,stream,indent=2)
    stream.write('\n')
