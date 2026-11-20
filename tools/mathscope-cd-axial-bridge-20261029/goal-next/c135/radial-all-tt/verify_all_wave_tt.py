"""Read the 120 active protected time applications and attach the original Gaussian TT donors."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from functools import cache
import gzip
from hashlib import sha256
import json
from pathlib import Path
import runpy
import sys

ACTIVE="continuation132/active-repeat-source/"
HOSTED="continuation132/hosted-44682703381/"
PROTECTED="continuation70/hosted-44582875351/first-correction-spatial-source/"
NAVIER="continuation66/stage2/runtime-exact/research-ide/mathscope-m3/navier/"
SCOPE="primary-forced-join/active-n3-c5-binding/"
PINS={
    "active":("work",ACTIVE+"active-readback.json","49c39b69df109650688cb21e8331fe53ffc65da1e8f899d1fa97c61a67cce2c4"),
    "candidate":("work",HOSTED+"active-n3-repeat-forced-candidate.json","b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e"),
    "protectedManifest":("work",PROTECTED+"original-source-export-manifest.json","8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a"),
    "liveCensus":("work","continuation133/live-radial-trace/live-radial-trace.json","70d841c3686c7f3135592e04e170048cd5663cfaaf4e53ac5b12bae84bb5c8ba"),
    "gaussian":("work","continuation134/radial-time-gaussian/radial-time-gaussian.json","a69531c3a1be1d2c8fdf2a56f2b41d50c84f89b806134540c5072ea281091d23"),
    "signed":("work","continuation119/signed-curl-mixed-t/signed-mixed-curl.json","2efe3573d8c7a9b41bb2ba6682307140a017436ada61291f6d131c24ff25cf2a"),
    "signedLocal":("work","continuation80/signed-wave/final/signed-local-curl.json","7e494388cecfb1cdfa8c22732491063135af4947ee9b667f37f0ce25d4604aec"),
    "phase":("work","continuation80/signed-wave/final/signed-phase-gradient.json","5fe1bb69eda9e5932ac57ba69814a51b26c1cfac4b4449937ead85e9e5ea19c0"),
    "firstForced":("work","continuation82/forced-seams/forced-seams-final.json","888b8575fb5f02c9fac90e37cc757261b2bb7eaf8fea62d1a6ca6b4c544532b1"),
    "nativePressure":("goal","c120/repeat-raw-pulse-and-projection/repeat-radial-operands.json","d17ce2cd317c62775c5208b2c75efab78a6e962f2c4539c2da1091c92a3e17c7"),
    "reader":("goal",SCOPE+"spatial-readback/source_stream.py","2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb"),
    "cache":("goal",SCOPE+"live-wave-gauge/signed/source_cache.py","909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f"),
    "algebra":("goal","first-force-repair/verify_repaired_first_force.py","260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75"),
    "signedIndex":("work",NAVIER+"generic-signed-162-indexed.mjs","973136acf1571a75a307e374576ec8dbbe0340c19e90ee327373df7638100bec"),
    "signedAudit":("work",NAVIER+"source-signed-162-successor-audit.mjs","d43dce8fc7a2563892c68b5619fef930058ab627129bb7fedcdb86ccbad92b8c"),
    "forcedModule":("work",NAVIER+"source-global-forced-current.mjs","1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3"),
    "mappedModule":("work",NAVIER+"source-mapped-forced-curl.mjs","3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd"),
    "primaryModule":("work",NAVIER+"source-initialized-angular.mjs","4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e"),
}
R,Z,T=17732748,17732749,17732750
Y0,Y1=17745430,17745431
ELL,EPS,K,VR,LAMBDA,A=17732737,17732744,17732747,17733068,17734041,17735155
SQ2=3622
PREFIX=22155584
PARTS=("real","imaginary")
COMPONENTS=("r","theta","z")
OFFSETS=((0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,0,1))
SIGMA_TT=(0,0,2)
SIGMA_RTT=(1,0,2)
SIGMA_ZTT=(0,1,2)


def read(a):
    docs={}
    for key,(root,rel,expected) in PINS.items():
        p=getattr(a,root)/rel
        raw=p.read_bytes()
        assert sha256(raw).hexdigest()==expected,p
        docs[key]=json.loads(raw) if p.suffix==".json" else p if p.suffix==".py" else raw.decode()
    return docs


def source_rules(d):
    fragments={
        "primaryModule":("waveRows=[{m:1,velocity:positiveVelocity,pressure:positivePressure}",
                         "'InitializedOriginalWave_'+delta+'_'+prior.sign+'_'+j"),
        "forcedModule":("increment.push({m,velocity:mapped.velocity,pressure:mapped.pressure}",
                        "const waveRows=sumStateRows(G,old.waveRows,increment)"),
        "mappedModule":("leading=cross(G,normal,X).map(x=>G.neg(G.mul(km,x)))",
                        "remainder=[G.neg(Dz[1]),G.sub(Dz[0],Dr[2]),G.add(Dr[1],G.div(X[1],R))]",
                        "curlRemainder=[0,1,2].map(j=>C.value(G.neg(curl.imaginary.remainder[j]),curl.real.remainder[j]))"),
        "signedIndex":("return [{m:1,velocity,pressure},{m:-1",
                       "waveRows=sumModes(C,old.waveRows,signedRows)"),
        "signedAudit":("!same(t.signedRows.map(x=>x.m),[1,-1])",),
    }
    for program,needed in fragments.items():
        assert all(s in d[program] for s in needed),program


def get_streams(a,d):
    active=d["active"]
    assert active["terminalRun"]["run"]==d["liveCensus"]["source"]["run"]==44682703381
    assert active["stream"]["sha256"]==d["liveCensus"]["source"]["liveStream"]
    assert active["stream"]["protectedPrefixNodes"]==d["candidate"]["preRepeatNodeCount"]==PREFIX
    mf=d["protectedManifest"]
    assert active["stream"]["protectedPrefixCompleteHash"]==mf["node_stream_sha256"]
    assert mf["node_stream_sha256"]==d["signed"]["sourceStreamSHA256"]==d["nativePressure"]["sourceStreamSHA256"]
    assert mf["node_stream_sha256"]==d["signedLocal"]["sourceStream"]["sha256"]==d["phase"]["sourceStreamSHA256"]
    assert mf["node_stream_sha256"]==d["firstForced"]["originalStreamSHA256"]
    sys.path.insert(0,str(d["reader"].parent))
    import source_stream as native
    cache_program=runpy.run_path(str(d["cache"]))
    graph=cache_program["load"](native,a.work/PROTECTED,mf,22153782,a.work/"continuation80/signed-wave/cache")
    definitions=native.Native(a.work/PROTECTED,mf)
    assert definitions.pin==d["signed"]["registrySHA256"]==d["signedLocal"]["registrySHA256"]
    hosted=a.work/HOSTED/"active-n3-repeat-forced-source"
    raw=(hosted/"original-source-functions.json").read_bytes()
    assert sha256(raw).hexdigest()==active["registrySHA256"]==d["liveCensus"]["source"]["nativeRegistry"]
    ids={x["id"]:x for x in json.loads(json.loads(raw)["definitions"])[0]}
    assert all(ids[x["id"]]==x for x in definitions.expressions)
    with gzip.open(hosted/"original-source-nodes.jsonl.gz","rb") as f:
        f.seek(mf["node_stream_uncompressed_bytes"])
        suffix=f.read()
    assert sha256(suffix).hexdigest()==active["stream"]["appendRecordsSHA256"]
    tail=[json.loads(line) for line in suffix.splitlines()]
    assert len(tail)==active["stream"]["nodes"]-PREFIX==225012
    return graph,definitions,ids,tail


class View:
    """One verified prefix plus one verified appended body."""
    def __init__(self,g,tail):
        self.g=g
        self.tail=tail

    @cache
    def node(self,i):
        rec=self.g.record(i) if i<PREFIX else self.tail[i-PREFIX]
        return rec["op"],rec["args"]

    def args(self,i,operator):
        op,args=self.node(i)
        assert op==operator,(i,operator,op)
        return args

    @cache
    def leaves(self,i):
        op,args=self.node(i)
        if op in {"add","multiply","inverse"}:
            return frozenset().union(*(self.leaves(j) for j in args))
        if op=="integer_power":
            return self.leaves(args[0])
        return frozenset((i,))


def scaled(E,s,p):
    return E.mul(E.scalar(s),p)


def equal(E,left,right):
    difference=E.sub(left,right)
    return not E.reduce_sqrt_two(E.clear_compound_denominators(difference),SQ2)


def cross(E,n,p):
    def pair(i,j):
        return E.sub(E.mul(n[i],p[j]),E.mul(n[j],p[i]))
    return pair(1,2),pair(2,0),pair(0,1)


def signed_forms(g,E,case,normal):
    C=case["actualNativeSignedPotential"]
    slots={(r["component"],tuple(r["orders"])):r["root"] for r in case["nativeJetInventory"]}
    partial={}
    for (j,v),index in slots.items():
        if sum(v)==1:
            partial[j,v.index(1)]=index
    Cn=[E.of(x) for x in C]
    real=[E.mul(E.scalar(Q(-1,2)),E.of(K),x) for x in cross(E,normal,Cn)]
    Dr=lambda j:E.add(E.of(partial[j,0]),E.mul(E.of(A),E.of(partial[j,3])))
    Dz=lambda j:E.mul(E.of(EPS),E.of(partial[j,1]))
    imag=[scaled(E,Q(-1,2),Dz(1)),scaled(E,Q(1,2),E.sub(Dz(0),Dr(2))),
          scaled(E,Q(1,2),E.add(Dr(1),E.mul(Cn[1],E.inv(E.of(R)))))]
    for j,w in enumerate(case["actualVelocityCoefficients"]):
        assert equal(E,real[j],E.of(w["real"])),(case["key"],j,"signed real")
        assert equal(E,imag[j],E.of(w["imaginary"])),(case["key"],j,"signed imaginary")


def actual_parts(g,native,defs,d,owners,key,mode):
    local={x["key"]:x for x in d["signedLocal"]["cases"]}[key]
    signed={x["chart"]:x for x in d["signed"]["cases"]}[key]
    forced_ref={ (x["key"],x["mode"]):x for x in d["firstForced"]["cases"]}[key,mode]
    pulse=native.pulses[forced_ref["nativeSystem"]]
    normal_rows={x["chart"]:x for x in d["nativePressure"]["protectedModeTwoPressure"] if x["part"]=="real"}
    normal=[normal_rows[key]["unprojectedNormalForcing"][str(j)][1] for j in range(3)]
    E=d["Exact"](g)
    n=[E.of(i) for i in normal]
    if mode==1:
        signed_forms(g,E,local,n)
    found_signed={(x["component"],x["part"]):x for x in signed["actualSignedAddends"]}
    forced_roots={}
    summary={}
    level,sign=map(int,key.split(":"))
    for j in range(3):
        for part in PARTS:
            body=owners[j,part]["body"]
            if mode==1:
                link=found_signed[j,part]
                assert body==link["completeRepeatWave"]
                signed_root=link["exactSignedAddend"]
                pre=link["remainingWaveAddend"]
                assert signed_root==local["actualVelocityCoefficients"][j][part]
                assert Counter(g.args(body,"add"))==Counter((signed_root,pre))
                old=g.args(pre,"add")
                assert len(old)==2
                pname=f"InitializedOriginalWave_{level}_{sign}_{j}_{part}"
                [primary]=[x for x in old if g.node(x)[0]=="m3_coupled_expression_partial"
                            and defs[g.node(x)[1][0]]["name"]==pname]
                pop,pa,po=g.args(primary,"m3_coupled_expression_partial")
                assert pa==defs[pop]["parameters"] and not any(po)
                [forced]=[x for x in old if x!=primary]
                summary[j,part]={"primaryApplication":primary,"primaryDefinition":pop,
                                  "primaryBody":defs[pop]["body"],"firstForcedBody":forced,"signedBody":signed_root}
            else:
                forced=body
                summary[j,part]={"firstForcedBody":forced}
            forced_roots[j,part]=forced

    prefix=f"ActualMappedOriginalForced_{key}_m{mode}_"
    fields={}
    roots_by_field={}
    for atom in set().union(*(g.leaves(x) for x in forced_roots.values())):
        op,args=g.node(atom)
        if op!="m3_coupled_expression_partial":
            continue
        idx,values,orders=args
        field=defs[idx]
        if not field["name"].startswith(prefix):
            continue
        part,j=field["name"].removeprefix(prefix).split("_")
        j=int(j)
        assert part in PARTS and j in range(3)
        assert sum(orders)<=1 and values==field["parameters"]
        axis=field["parameters"][orders.index(1)] if sum(orders) else 0
        assert axis in (0,R,Z,Y0,Y1)
        k=(part,j,axis)
        assert fields.setdefault(k,atom)==atom
        assert roots_by_field.setdefault((part,j),idx)==idx
    assert len(roots_by_field)==6
    expected_combinations={(part,j,axis) for part in PARTS
                           for j,axes in enumerate(((0,Z),(0,R,Z,Y0,Y1),(0,R,Y0,Y1)))
                           for axis in axes}
    assert set(fields)==expected_combinations,(key,mode,set(fields)^expected_combinations)
    for (part,j),idx in roots_by_field.items():
        owner=defs[idx]
        states=[q for q in g.leaves(owner["body"]) if g.node(q)[0]=="m3_forced_pulse_partial"]
        assert len(states)==2,(key,mode,j,part,states)
        for q in states:
            sid,p,jp,v,params,order=g.args(q,"m3_forced_pulse_partial")
            assert sid==pulse["id"] and part==p and j!=jp and jp in range(3)
            assert v==forced_ref["v"] and params==pulse["parameters"] and not any(order)
    radial=E.mul(E.of(A),E.pow(E.of(LAMBDA),-level))
    def gjet(part,j,axis):
        return E.of(fields[part,j,axis])
    def leading(part):
        return [E.mul(E.scalar(-mode),E.of(K),c) for c in cross(E,n,[gjet(part,j,0) for j in range(3)])]
    def curl(part):
        Dr=lambda j:E.add(gjet(part,j,R),E.mul(radial,E.add(gjet(part,j,Y0),E.mul(E.of(VR),gjet(part,j,Y1)))))
        Dz=lambda j:E.mul(E.of(EPS),gjet(part,j,Z))
        return [E.neg(Dz(1)),E.sub(Dz(0),Dr(2)),E.add(Dr(1),E.mul(gjet(part,1,0),E.inv(E.of(R))))]
    for part,other,sign0 in (("real","imaginary",-1),("imaginary","real",1)):
        compare=[E.add(lead,scaled(E,sign0,c)) for lead,c in zip(leading(part),curl(other),strict=True)]
        for j,formula in enumerate(compare):
            assert equal(E,formula,E.of(forced_roots[j,part])),(key,mode,j,part,"forced signed curl")
    return summary,{"normal":normal,"pulseSystem":pulse["id"],"mappedGaugeIds":sorted(roots_by_field.values())}

def donor_check(d):
    caps=d["gaussian"]
    exact=caps["activeRoots"]
    assert (exact["coupledExpression"],exact["protectedBody"],exact["exposedFirstTime"])==(
        "coupled-expression:1363",22004387,22161393)
    s={tuple(j) for j in caps["originalLiveSigmaTargets"]}|{tuple(caps["optionalOneRadialDirectionalTarget"])}
    assert s=={SIGMA_TT,SIGMA_RTT,SIGMA_ZTT}
    assert {(tuple(j["RZT"]),j["region"]) for j in caps["collarDependentRows"]}=={
        (q,region) for q in s for region in ("inner","outer")}
    tt=(0,0,2,0)
    forced={tuple(q) for q in caps["forceRZTL"]}
    assert {tuple(i+j for i,j in zip(tt,x,strict=True)) for x in OFFSETS}<=forced
    p={tuple(q) for f,q in caps["primaryRows"] if f in ("U","Uo")}
    assert tt in p and caps["primaryDirectionEnvelope"]["T"]>=3
    for name in ("primaryWave","firstForcedModeOne","signedWave"):
        assert caps["gaussianPowers"][name]=="1/2"
    assert caps["gaussianPowers"]["signedTarget"]==caps["gaussianPowers"]["firstForcedModeTwo"]=="1"
    assert not caps["uniformEpsilonClaim"] and not caps["fullSupportedRepeatC1Claim"]
    assert caps["rawFirstForcedAudit"]["eachModeOneRowContainsPrimaryWaveOrPressure"]
    return {
        ("r","real"):[SIGMA_TT],
        ("theta","real"):[SIGMA_TT],
        ("z","real"):[SIGMA_TT],
        ("r","imaginary"):[SIGMA_TT,SIGMA_ZTT],
        ("theta","imaginary"):[SIGMA_TT,SIGMA_RTT,SIGMA_ZTT],
        ("z","imaginary"):[SIGMA_TT,SIGMA_RTT],
    }


class AppendixAlgebra:
    """Retain prefix coefficients as source atoms when testing a time application."""
    def __init__(self,g):
        self.g=g

    def node(self,i):
        if i<PREFIX:
            op,args=self.g.node(i)
            return (op,args) if op=="rational" else ("protected_atom",[])
        return self.g.node(i)


def coefficient(E,body,marker):
    values={}
    for power,c in E.of(body).items():
        exponent=dict(power).get(marker,0)
        assert exponent in (0,1)
        if exponent:
            values[tuple((i,p) for i,p in power if i!=marker)]=c
    return values


def all_actual(a,d):
    g,native,ids,tail=get_streams(a,d)
    g0=View(g,tail)
    by_name={x["name"]:x for x in ids.values()}
    E=d["Exact"](AppendixAlgebra(g0))
    sigmas=donor_check(d)
    time_atoms=set()
    rows=[]
    branch_details=[]
    try:
        for template in d["candidate"]["templates"]:
            key=template["key"]
            meta={(x["system"],tuple(x["orders"])):x["actualBody"]
                  for x in template["rawSupport"]["waveJets"]}
            assert len(meta)==len(template["rawSupport"]["waveJets"])
            all_T={(idx,vec) for idx,vec in meta if vec[ids[idx]["parameters"].index(T)]}
            wanted_T=set()
            modes={r["m"]:r for r in template["rows"]}
            for mode in (1,2):
                owner={(j,p):by_name[f"PostFiveRepeatWave_{key}_{mode}_{j}_{p}"]
                       for j in range(3) for p in PARTS}
                source,branch=actual_parts(g0,native,ids,d,owner,key,mode)
                branch_details.append({"chart":key,"harmonic":mode,**branch})
                for (j,p),fun in owner.items():
                    r=modes[mode]
                    ids0=fun["parameters"]
                    ti=ids0.index(T)
                    assert ti==3 and ids0[:4]==[ELL,R,Z,T] and fun["derivativeLimits"][ti]>=2
                    t_order=tuple(int(i==ti) for i in range(len(ids0)))
                    wanted_T.add((fun["id"],t_order))
                    assert meta[fun["id"],t_order]==fun["body"]
                    raw,supported,sub=(r[x][j][p] for x in ("raw","supported","subtraction"))
                    current=r["guarded"][j][p]
                    original_radial_branch=None
                    for layer in range(7):
                        x,lo,hi,below,inside,above=g0.args(current,"smooth_piecewise")
                        assert below==above==0
                        if layer==4:
                            assert [x,lo,hi]==d["liveCensus"]["guard"]["triple"]==[17732770,3617,28826]
                            original_radial_branch=current
                        current=inside
                    assert current==supported and original_radial_branch is not None
                    targets=[]
                    for term in E.of(raw):
                        for node,power in term:
                            if node<PREFIX:
                                continue
                            op,args=g0.node(node)
                            if op=="m3_coupled_expression_partial" and args[0]==fun["id"] and args[2][ti]:
                                assert tuple(args[2])==t_order and args[1]==ids0 and power==1
                                targets.append(node)
                    marker,=set(targets)
                    assert marker not in time_atoms
                    time_atoms.add(marker)
                    want=E.neg(E.of(EPS))
                    assert coefficient(E,raw,marker)==coefficient(E,supported,marker)==want
                    assert not coefficient(E,sub,marker)
                    if key=="0:1" and mode==1 and (j,p)==(0,"imaginary"):
                        assert marker==22161393 and fun["body"]==22004387
                    sig=sigmas[COMPONENTS[j],p] if mode==1 else []
                    rows.append({
                        "chart":key,"harmonic":mode,"component":COMPONENTS[j],"part":p,
                        "definition":fun["id"],"actualArgumentIds":ids0,
                        "nativeProtectedBody":fun["body"],"actualFirstTimeApplication":marker,
                        "sourceRaw":raw,"sourceSupported":supported,"sourceSubtraction":sub,
                        "sameOriginalRadialZeroGuard":original_radial_branch,
                        "exactRawAndSupportedCoefficient":"-epsilon","subtractionCoefficient":0,
                        "formalSecondTimeDerivativeOrder":[2*i for i in t_order],
                        "actualProtectedAddends":source[j,p],"signedSigmaTopTimeRZT":sig,
                        "gaussianPower":"1/2" if mode==1 else "1",
                    })
            assert wanted_T==all_T and len(wanted_T)==12
        assert len(time_atoms)==len(rows)==120
    finally:
        g.__exit__(None,None,None)
    counts=Counter((r["harmonic"],r["part"],r["component"]) for r in rows)
    assert set(counts.values())=={10} and len(counts)==12
    return {"schema":"MathScope.C135.ActiveAllWaveTTGaussianTransfer/1",
            "status":"VERIFIED_120_ACTIVE_T_SLOTS_CONDITIONAL_120_TT_RADIAL_TRACES",
            "pins":PINS,"activeSource":d["liveCensus"]["source"],
            "sourceCensus":{"charts":10,"typedTimeUses":120,"explicitBodyAddendChecks":120,
                            "exactForcedCurlComparisons":120,"exactSignedCurlComparisons":60,"originalRadialGuardPaths":120,
                            "gaussianPowers":{"mode1":"1/2","mode2":"1"}},
            "signedSigmaCoverage":[SIGMA_TT,SIGMA_RTT,SIGMA_ZTT],
            "sigmaOrdersConvention":"Top T=2 rows listed per component. Leibniz lower derivatives are included via the original C134 collar downsets.",
            "activeTTApplicationScope":"The existing first-T native nodes and their coefficient footprints are read back. The second time order is an ordinary analytic derivative of exactly the same body, and this checker does not add TT nodes.",
            "conditionalTrace":"After any fixed finite radial pole, the actual ordinary TT field has vanishing joints at both original moving X faces, under the C134 admitted frame, chart, centered Fourier and fixed-pulse source hypotheses.",
            "unproved":"This only covers the time-time part in the full first derivative of the supported Repeat blocks. Other mixed derivatives, mean and pressure cofactors and subtractions are their own joins.",
            "rows":rows,"chartAndModeDefinitions":branch_details,"finalJets":0,"release":"HOLD"}


def main(a):
    d=read(a)
    source_rules(d)
    d["Exact"]=runpy.run_path(str(d["algebra"]))["Exact"]
    return all_actual(a,d)


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","goal","out"):
        p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args()
    out=main(a)
    a.out.write_bytes((json.dumps(out,indent=2)+"\n").encode())
    print(out["status"],len(out["rows"]))
