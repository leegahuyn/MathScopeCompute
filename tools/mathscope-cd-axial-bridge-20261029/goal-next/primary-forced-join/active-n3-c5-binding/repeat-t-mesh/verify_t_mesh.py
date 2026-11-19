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
sys.path.insert(0,str(goal/'f1-regularity'))
from check_fixed_path import slow_cutoffs, Nodes
from check_palette import Source

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
offset=625265
factor=625297
denom=625293
bump=625280
R=622802
assert len(paths)==10 and all(r["slowAndShellGuards"][1][0]==offset for r in paths.values())
axis=next(row for row in guard_data["slowAxes"] if row["offset"]==offset)
assert axis=={"offset":offset,"factor":factor,"denominator":denom,"bumps":{"0":bump,"1":625288,"-1":625273}}
prior_rows={(r["key"],r["m"]):r for r in prior["rows"]}
stored={r["id"]:r for r in defs[3]}


with TemporaryFile() as file:
 graph=Graph(bundle/STREAM,file,archive['snapshot'])
 a=Exact(graph)
 assert graph.node(formalV)[0]=='coordinate'
 assert graph.node(R)[0]=="coordinate"
 ell,jT=622791,623857
 Z,T=622803,622804
 chartS,chartX=622820,622824
 representative_formal=[622807,622808,622809]
 representative_actual=[623950,623955,623935]
 assert all(graph.node(node)[0]=="coordinate" for node in [ell,jT,Z,T,*representative_formal])
 assert a.of(offset)==a.sub(a.mul(a.pow(a.of(ell),6),a.of(T)),a.of(jT))
 class ChartGraph:
    def op(self, root, kind):
        return graph.args(root,kind)
    def node(self, root):
        return graph.node(root)
 archive_monotone=json.loads(registry["base"]["base"]["monotone"])
 chart_graph=ChartGraph()
 axes,chart_readback=slow_cutoffs(chart_graph,Source(Nodes(chart_graph)),archive_monotone)
 original_axis=next(row for row in axes if row["offset"]==offset)
 assert (original_axis["factor"],original_axis["denominator"],original_axis["bumps"][0])==(factor,denom,bump)
 assert chart_readback==guard_data["slowChart"]
 assert graph.node(chartS)==("actual_monotone_root",[2,Z,T])
 monotone=archive_monotone[2]
 assert monotone["parameters"]==[Z,T]
 assert a.of(monotone["left"])==a.scalar(Fraction(1,2))
 assert a.of(monotone["right"])==a.scalar(2)
 assert a.of(chartX)==a.mul(a.pow(a.of(R),2),a.inv(a.mul(a.scalar(2),a.of(chartS))))
 eta_root,q_root,Q_root=622829,622830,622794
 assert graph.node(9)==("source_parameter",["h"])
 assert a.of(22)==a.sub(a.scalar(Fraction(1,2)),a.of(9))
 assert graph.node(eta_root)==("multiply",[Z,622828])
 assert graph.node(622828)==("inverse",[622827])
 assert graph.node(622827)==("exp",[622826])
 assert graph.node(622826)==("multiply",[22,622825])
 assert graph.node(622825)==("log_positive",[chartS])
 assert graph.node(q_root)==("multiply",[Q_root,chartS])
 assert graph.node(Q_root)==("exp",[622793])
 assert graph.node(622793)==("multiply",[20,622792])
 assert graph.node(622792)==("multiply",[127,ell])
 assert graph.node(127)==("log_positive",[24])
 assert a.of(24)==a.scalar(2) and a.of(20)==a.scalar(-1)
 assert graph.node(representative_actual[2])[0]=="actual_monotone_root"
 assert not set(graph.reach(representative_actual)).intersection({R,Z,T,formalV,635044,635045})
 assert not set(graph.reach([offset])).intersection({R,Z,formalV,635044,635045})
 # Variation in T changes the same original slow root. The typed
 # readback gives F(s,Z,T)=s-Z^2*s^(2h)-T and eta=Z/s^(1/2-h).
 # In the strict bracket at T>0, F_s=1-2h*eta^2>1/2. Fixed R
 # and continuous transport of s keep the strict shell locally.
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
 offset_inputs={offset,T,ell,jT,*graph.args(offset,"add")}
 used_step=Counter()
 used_definition=Counter()
 unexplained=Counter()
 calls=Counter()
 @cache
 def zero(root,slow_offset,key):
    if root==0:
      return True
    op,args=graph.node(root)
    if op=="add":
      return all(zero(i,slow_offset,key) for i in args)
    if op=="multiply":
      return any(zero(i,slow_offset,key) for i in args)
    if op=="integer_power" and args[1]>0:
      return zero(args[0],slow_offset,key)
    if root==factor:
      used_step[(root,slow_offset)]+=1
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
        inward=slow_offset
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
    current_offset=offset
    assert case['guards'][-1][1:]==[0,length]
    assert case['guards'][-2]==paths[key]['transverseGuard']
    assert case['guards'][1]==[offset,lo,hi]
    assert case['guards'][:5]==paths[key]['slowAndShellGuards']
    assert prior_rows[key,1]['path']==paths[key]['originalPath']
    checks=[]
    for j,field in enumerate(case['fields']):
        for part in parts:
            for origin in ('forcedCoefficient','signedCoefficient','body'):
                root=field[part][origin]
                vanishes=zero(root,current_offset,key)
                if not vanishes:
                    print('FAIL wave',key,m,j,part,origin,root,vanishes,flush=True)
                checks.append([j,part,origin,root,vanishes])
            assert all(zero(app['root'],current_offset,key) for app in field[part]['nativeApplications'])
    values.append({'key':key,'m':m,'tOffset':current_offset,'checks':checks})
 tails=[]
 inherited=[]
 for template in archive['templates']:
    key=template['key']
    for row in template['rows'][:2]:
        m=row['m']
        lens=lowcases[key,m]
        current_offset=offset
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
                    vanishes=zero(root,current_offset,key)
                    if not vanishes:
                        print('FAIL tail',key,m,term['family'],j,part,root,vanishes,flush=True)
                    tails.append([key,m,term['family'],j,part,root,vanishes])
 assert all(c[-1] for row in values for c in row["checks"]) and all(c[-1] for c in tails)
 assert len(first_jet_generators)==100
 assert len(values)==20 and len(tails)==240 and len(inherited)==20
 assert zero(3861788,offset,"0:1")
 assert not zero(3861788,offset,"1:1")
 assert list(used_step)==[(factor,offset)]
 print("PASS T-mesh face factor for all 240 supported slots",flush=True)
 data={
   "schema":"MathScope.N6.ArchivedRepeatTMeshFaceRemoval/1","run":43015175416,
   "sourcePins":{"archive":archive_sha,"graph":official["graphSHA256"],"registry":registry_sha,
      "closedPulse":pulse_proof_sha,"originalFirstForced":prior_sha,"firstCollarIdeal":low_sha,
      "originalSevenGuards":guard_sha,"repeatWaveBodies":wave_sha,**source_pins},
   "graphNodes":len(graph.offsets),"checkedPositiveSystems":40,"componentSlots":240,
   "tMeshGuard":{"offset":offset,"definition":"ell^6 T-j_T","factor":factor,"numerator":bump,
       "denominator":denom,"faceReadback":faceNumerics,"centralBumpRemovedControl":"A unit numerator would give 1, not 0, on either face."},
   "fixedChart":{"R":R,"Z":Z,"T":T,"ell":ell,"j_T":jT,"s":chartS,"X":chartX,
       "eta":eta_root,"q":q_root,"Q":Q_root,"nativeSlowRootArguments":[Z,T],"representativeFormal":representative_formal,
       "representativeActual":representative_actual,"pathLeavesOffsetAndRepresentativeFixed":True,
       "sourceImplicitRoot":"s-Z^2*s^(2h)-T=0, eta=Z*s^(-1/2+h)",
       "strictChartPremise":"1/2<s<2, T>0, 0<h<1/16, strict Xa<X<Xb and strict other slow guards; frozen labels and representative.",
       "implicitVariation":"ds/dT=1/(1-2*h*eta^2)>0. A physical T-mesh face cannot have T=0: ell^6*T-j_T=+/-3/4 with integer j_T contradicts T=0. Thus the local physical slow chart admits a two-sided T variation from T>0."},
   "firstSupportIdealAtTFace":first_support_cases,
   "actualWaveBodies":values,"directSubtractions":tails,"inheritedFirstRemainingSource":inherited,
   "readback":{"exactTMeshFactor":[factor,offset],"nativeDerivativeUses":len(used_definition),
      "originalFirstZeroInputAndStateUses":[[op,system,count] for (op,system),count in sorted(calls.items())]},
   "originalFirstParticularNegativeControl":{"actualStateRoot":3861788,"originalRow":"0:1","differentRowRejected":"1:1"},
   "analyticPrerequisites":"On the admitted fixed representative chart, the original T slow factor and its admitted derivatives vanish at both s_T faces since the central original bump is flat with positive denominator. Ordinary admitted cofactors and the fixed-label H_w transport are required. Native first Forced zero-data parameter variations then vanish through the required finite orders by induction in derivative order, using the proven first source ideal for the complete w interval.",
   "conclusion":"The actual guarded and unclipped supported components agree along the original closed pulse through both T-mesh faces ell^6 T-j_T=+/-3/4, for strict other slow guards and strict original shell, with 1/2<s<2, T>0 and all original ordinary operands admitted in the frozen chart.",
   "remaining":"Band, other slow faces, physical T=0 and the physical shell, source-definedness beyond admitted neighborhoods, N3 same-live transport and complete supported-source norm remain separate.",
   "actualStateOutsideNativePulseEvaluated":False,"numericBound":False,"finalJets":0,"release":"HOLD",
 }
 with output.open('x',encoding='utf8',newline='\n') as stream:
    json.dump(data,stream,indent=2)
    stream.write('\n')
