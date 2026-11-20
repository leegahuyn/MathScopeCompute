"""Read all original Repeat subtraction bodies and attach the first derivative Gaussian proof."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path
import runpy

PINS={
    "loader":("work","continuation135/radial-all-tt/verify_all_wave_tt.py","c361ed8a91f7b9fdaaa3143830dc0b5ae2e1b411012b935b535c6be2e1b3b663"),
    "time":("work","continuation135/radial-all-tt/all-wave-tt.json","0b2bc4cb556d2fcf45f2cc513f3e3fad2753bc01b256aa8226c6c5fe4037171d"),
    "pulse":("work","continuation135/radial-pulse-vv/radial-pulse-vv.json","21f501d7ebcb63a32871a992b15c95d31ed4abdb18240f311295e9e2032b5824"),
    "sigma":("work","continuation135/radial-sigma-mixed/replay1.json","847609b8d145c6ae52f9b6a96c7aa0764531f8c8767c97be619f0969f73d6184"),
    "originalRaw":("work","continuation70/hosted-44582875351/same-family-mode-two.json","6bf1e8c538e67bec6ea52e5960fd5cb23a556442d413d120025c49f30f117c27"),
    "repeat":("work","continuation66/stage2/runtime-exact/research-ide/mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs","4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7"),
    "mapped":("work","continuation66/stage2/runtime-exact/research-ide/mathscope-m3/navier/source-mapped-forced-curl.mjs","3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd"),
    "signedStatic":("goal","c108/early-sigma-c6/early-sigma-c6.json","d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
    "signedSigmaT":("work","continuation118/pure-sigma-time-join/pure-sigma-time.json","b128b6131412a2aef44c6a945b00ca03b38c04308a57c141e03476ea82d5c796"),
    "signedTime":("work","continuation118/pure-sigma-time-join/signed-pure-time-gauge.json","c484371659b9b10fea0808449e4ae6dbade3782cb1d0a79852a81056b8aa4bdd"),
}
FORCE="first-forced-remaining-source"
STATE="first-forced-cutoff-derivative"
PRIMARY="primary-cutoff-derivative"
SIGNED="signed-cutoff-derivative"
PARTS=("real","imaginary")
COMPONENTS=("r","theta","z")
EPS,HALF,LS=17732744,19,17733029
TARGETS={22001223,22001224}
AUX=(17745430,17745431)


def load(a):
    d={}
    for key,(base,rel,want) in PINS.items():
        p=getattr(a,base)/rel
        raw=p.read_bytes()
        assert sha256(raw).hexdigest()==want,p
        d[key]=runpy.run_path(str(p)) if p.suffix==".py" else json.loads(raw) if p.suffix==".json" else raw.decode()
    return d


def multiply_atoms(g,root):
    op,args=g.node(root)
    if op!="multiply":
        return [root]
    return [q for j in args for q in multiply_atoms(g,j)]


def psi_shapes(g,E,psi,dpsi,v,Ls):
    p=g.args(psi,"multiply")
    assert len(p)==2
    factors=[]
    expected=[E.sub(E.mul(E.scalar(20),E.of(v),E.inv(E.of(Ls))),E.scalar(4)),
              E.sub(E.scalar(16),E.mul(E.scalar(20),E.of(v),E.inv(E.of(Ls))))]
    for q in expected:
        [leaf]=[j for j in p if g.args(j,"source_step_derivative")[1]==0
                and E.of(g.args(j,"source_step_derivative")[0])==q]
        factors.append(leaf)
    lo,hi=factors
    slope=E.mul(E.scalar(20),E.inv(E.of(Ls)))
    leaves={tuple(g.args(j,"source_step_derivative")):j for j in g.leaves(dpsi)
            if g.node(j)[0]=="source_step_derivative"}
    l0,h0=[g.args(j,"source_step_derivative")[0] for j in factors]
    assert set(leaves)=={(l0,0),(h0,0),(l0,1),(h0,1)}
    a1,b1=leaves[l0,1],leaves[h0,1]
    compare=E.mul(slope,E.sub(E.mul(E.of(a1),E.of(hi)),E.mul(E.of(lo),E.of(b1))))
    assert E.of(dpsi)==compare
    # These tokens are the two authenticated arguments with native step
    # derivative orders. Differentiate the exact first-derivative rule.
    first={(1,0):1,(0,1):-1}
    second=Counter()
    for (i,j),c in first.items():
        second[i+1,j]+=c
        second[i,j+1]-=c
    assert second=={(2,0):1,(1,1):-2,(0,2):1}
    return {"nativePsi":psi,"actualFirstPulseDerivative":dpsi,"positiveLength":Ls,
            "actualLiftedPulse":v,"stepArguments":[l0,h0],"stepFirstDerivativeAtoms":[a1,b1],
            "secondPulsePolynomial":[[i,j,c] for (i,j),c in sorted(second.items())],"outerSlope":"(20/L_s)^2"}


def pullback_family(g,E,defs,pulse,source,cut,root,kind,j,part):
    factors=g.args(root,"multiply")
    assert len(factors)==2
    if kind==FORCE:
        [child]=[q for q in factors if g.node(q)[0]=="m3_coupled_expression_partial"]
        other,=[q for q in factors if q!=child]
        assert E.of(other)==E.sub(E.one,E.of(cut["nativePsi"]))
        index,args,order=g.args(child,"m3_coupled_expression_partial")
        fn=defs[index]
        assert fn["name"]==f"CoupledForced_source_{j}_{part}" and not any(order)
        assert fn["body"]==source["originalSource"][j][part]
        assert fn["parameters"]==[pulse["variable"],*pulse["parameters"]]
        assert args==[cut["actualLiftedPulse"],*pulse["parameters"]]
        return {"factor":other,"root":root,"unprojectedOriginalForcing":child,"sameNativeSourceBody":fn["body"]}
    [child]=[q for q in factors if g.node(q)[0]=="m3_forced_pulse_partial"]
    other,=[q for q in factors if q!=child]
    assert cut["actualFirstPulseDerivative"]==other
    assert g.args(child,"m3_forced_pulse_partial")==[
        pulse["id"],part,j,cut["actualLiftedPulse"],pulse["parameters"],[0]*len(pulse["directions"])]
    return {"factor":other,"root":root,"uncutZeroDataPulseValue":child}


def homogeneous_pair(g,E,defs,subrows,cut,key,j):
    level,sgn=key.split(":")
    bodies={}
    pieces={}
    for name,id0,want in ((PRIMARY,subrows[PRIMARY][j],f"OriginalPrimaryPrincipalFlat_{level}_{sgn}_{j}"),
                          (SIGNED,subrows[SIGNED][j],f"PostFiveSignedPrincipalTail_{key}_{j}")):
        assert id0["imaginary"]==0
        root=id0["real"]
        fn,args,orders=g.args(root,"m3_coupled_expression_partial")
        rec=defs[fn]
        assert rec["name"]==want and args==rec["parameters"] and not any(orders)
        assert {17732748,17732749,17732750,*AUX}<=set(args)
        bodies[name]={"root":root,"definition":fn,"body":rec["body"],"args":args}
        pieces[name]=Counter(multiply_atoms(g,rec["body"]))
    assert bodies[PRIMARY]["args"]==bodies[SIGNED]["args"]
    common=pieces[PRIMARY]&pieces[SIGNED]
    assert common[HALF]==common[cut["actualFirstPulseDerivative"]]==1
    [positive]=(pieces[PRIMARY]-common).elements()
    assert g.node(positive)[0]=="sqrt_positive"
    remaining=list((pieces[SIGNED]-common).elements())
    assert len(remaining)==3
    [scaled_inv]=[q for q in remaining if g.node(q)[0]=="inverse" and
                  E.mul(E.scalar(2),E.of(positive),E.of(q))==E.one]
    remaining.remove(scaled_inv)
    [numer]=[q for q in remaining if g.node(q)[0]=="add"]
    remaining.remove(numer)
    [gram]=remaining
    assert g.node(gram)[0]=="inverse" and not (g.leaves(gram)&TARGETS)
    assert g.leaves(numer)&TARGETS==TARGETS
    assert all(sum(count for i,count in monom if i in TARGETS)==1 for monom in E.of(numer))
    inv_eps=E.inv(E.of(EPS))
    ep_atom,=[i for (i,power), in inv_eps if power==-1]
    assert all(dict(monom).get(ep_atom)==-1 for monom in E.of(numer))
    identity=E.mul(E.of(scaled_inv),E.of(gram),E.of(numer))
    # The same native signed gauge retains the zero-order Signed
    # amplitude factors. Only the representative, xi and v are mapped.
    # The protected Sigma unevaluated applications remain the same IDs.
    native=[r for r in defs.values()
            if r["name"]==f"GenericSignedAfterForced_{0 if sgn=='1' else 1}_{j}"]
    [native]=native
    assert TARGETS<=g.leaves(native["body"])
    assert identity
    bodies["commonFactors"]=sorted(common.elements())
    bodies["positivePrimaryAmplitude"]=positive
    bodies["signedAmplitudeFactors"]={"inverseTwicePrimary":scaled_inv,"inverseGramDeterminant":gram,
                                      "linearSignedNumerator":numer,"actualSigmaRoots":sorted(TARGETS),
                                      "sameProtectedGenericSignedGauge":native["body"]}
    return bodies


def prove(a,d):
    old=d["loader"]
    inp=old["read"](a)
    old["source_rules"](inp)
    g,native,defs,tail=old["get_streams"](a,inp)
    V=old["View"](g,tail)
    Exact=runpy.run_path(str(inp["algebra"]))["Exact"]
    E=Exact(V)
    append=Exact(old["AppendixAlgebra"](V))
    try:
        guides=inp["firstForced"]
        chart_v={q["chart"]:q for q in inp["nativePressure"]["protectedPulseCoordinateChecks"]}
        assert len(chart_v)==10 and all(q["affineLVZero"] and q["affineNXiZero"] and q["effectiveCiNVOne"] for q in chart_v.values())
        gauss=inp["gaussian"]
        required_slow={(0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,1,0),(0,0,0,1)}
        assert required_slow<=set(map(tuple,gauss["forceRZTL"]))
        assert gauss["gaussianPowers"]["firstForcedModeOne"]=="1/2"
        assert gauss["gaussianPowers"]["firstForcedModeTwo"]=="1"
        assert gauss["gaussianPowers"]["signedTarget"]=="1"
        assert gauss["rawFirstForcedAudit"]["eachModeOneRowContainsPrimaryWaveOrPressure"]
        pulse_hull=d["pulse"]["originalCoefficientEnvelope"]
        assert pulse_hull["rawAddedPulseOrder"]==1 and pulse_hull["primaryOrdinaryEnvelope"]==7
        assert {(q["chart"],q["mode"]) for q in d["pulse"]["allRawChartModes"]}=={
            (key,mode) for key in chart_v for mode in (1,2)}
        first={(r["key"],r["harmonic"]):r for r in d["originalRaw"]["full"]["rows"]}
        assert len(first)==20 and guides["sourceSHA256"]["first"]==PINS["originalRaw"][2]
        live_receipt=d["time"]
        assert live_receipt["activeSource"]==inp["liveCensus"]["source"]
        tt_rows={(r["chart"],r["harmonic"],COMPONENTS.index(r["component"]),r["part"]):r
                 for r in live_receipt["rows"]}
        assert len(tt_rows)==120
        counts=Counter()
        result=[]
        for chart in inp["candidate"]["templates"]:
            key=chart["key"]
            common_cutoff=None
            for row in chart["rows"]:
                mode=row["m"]
                branches={r["family"]:r["value"] for r in row["terms"]}
                if mode in (3,4):
                    assert not branches and all(j[p]==0 for j in row["subtraction"] for p in PARTS)
                    continue
                assert set(branches)==({FORCE,STATE,PRIMARY,SIGNED} if mode==1 else {FORCE,STATE})
                case,=[c for c in guides["cases"] if c["key"]==key and c["mode"]==mode]
                assert (case["v"],case["xi"])==(chart_v[key]["v"],chart_v[key]["xi"])
                p=native.pulses[case["nativeSystem"]]
                f=first[key,mode]
                assert p["id"]==f["system"] and p["variable"]==case["w"] and p["length"]==LS
                assert p["initial"]==[{"real":0,"imaginary":0}]*3 and p["left"]==0
                node0=branches[STATE][0]["real"]
                dpsi,=[q for q in V.args(node0,"multiply") if V.node(q)[0]!="m3_forced_pulse_partial"]
                cutoff=psi_shapes(V,E,case["psi"],dpsi,case["v"],p["length"])
                assert common_cutoff in (None,cutoff)
                common_cutoff=cutoff
                entries=[]
                for j in range(3):
                    homo=homogeneous_pair(V,E,defs,branches,cutoff,key,j) if mode==1 else None
                    for part in PARTS:
                        roots=[branches[fam][j][part] for fam in branches]
                        raw,sup,sub=(row[n][j][part] for n in ("raw","supported","subtraction"))
                        assert E.of(sub)==E.add(*(E.of(i) for i in roots)),(key,mode,j,part,sub,roots)
                        assert append.of(sup)==append.sub(append.of(raw),append.of(sub)),(key,mode,j,part,raw,sup,sub)
                        t=tt_rows[key,mode,j,part]
                        marker=t["actualFirstTimeApplication"]
                        assert (raw,sup,sub)==(t["sourceRaw"],t["sourceSupported"],t["sourceSubtraction"])
                        assert old["coefficient"](append,raw,marker)==old["coefficient"](append,sup,marker)==append.neg(append.of(EPS))
                        assert all(not old["coefficient"](append,i,marker) for i in [sub,*roots])
                        ff=pullback_family(V,E,defs,p,f,cutoff,branches[FORCE][j][part],FORCE,j,part)
                        tv=pullback_family(V,E,defs,p,f,cutoff,branches[STATE][j][part],STATE,j,part)
                        counts.update(fam for fam in branches if branches[fam][j][part])
                        entries.append({"component":COMPONENTS[j],"part":part,"raw":raw,"supported":sup,
                                        "subtraction":sub,"unchangedRawTimeApplication":marker,
                                        "firstForcedRemaining":ff,"firstForcedCutoff":tv,
                                        "homogeneousCutoff":homo if part=="real" else None})
                result.append({"chart":key,"harmonic":mode,"pulseSystem":p["id"],"cutoff":cutoff,"rows":entries})
    finally:
        g.__exit__(None,None,None)
    assert counts=={FORCE:120,STATE:120,PRIMARY:30,SIGNED:30}
    assert len(result)==20
    return result,dict(counts)


def product_footprint():
    products={
        FORCE:[(1,("f",)),(-1,("psi","f"))],
        STATE:[(1,("psi_v","t"))],
        PRIMARY:[(Q(1,2),("psi_v","A_primary"))],
        SIGNED:[(Q(1,2),("psi_v","A_signed"))],
    }
    result={}
    for direction in ("R","Z","T","L","v"):
        table={}
        for kind,items in products.items():
            coeffs=Counter()
            for coefficient,terms in items:
                for i,atom in enumerate(terms):
                    if atom in ("psi","psi_v"):
                        if direction!="v":
                            continue
                        new={"psi":"psi_v","psi_v":"psi_vv"}[atom]
                    else:
                        new=atom+"_"+direction
                    coeffs[tuple(sorted((*terms[:i],new,*terms[i+1:])))] += coefficient
            table[kind]=[[str(v),list(k)] for k,v in sorted(coeffs.items()) if v]
        result[direction]=table
        assert [len(table[kind]) for kind in products]==([3,2,2,2] if direction=="v" else [2,1,1,1])
    # In normalized slow time, (-epsilon)*D_T(raw - subtraction)
    # gives a plus epsilon on each D_T subtraction. The raw time marker
    # is a different inner coefficient -epsilon proven in prove().
    return result


def conditions(d):
    assert d["time"]["sourceCensus"]["typedTimeUses"]==120
    assert d["pulse"]["traceScope"]["finiteFixedLabelPole"]
    assert d["pulse"]["traceScope"]["gaussianPower"]=="1/2"
    assert d["pulse"]["traceScope"]["radialFaces"]==[3617,28826]
    assert d["sigma"]["sourceRoots"]==[22001223,22001224,22000443]
    assert d["signedStatic"]["SigmaApplications"]==[22001223,22001224]
    assert d["signedStatic"]["commonBound"]["retainedGaussian"]=="zeta"
    static={tuple(r["RZT"]) for r in d["signedStatic"]["regions"]["inner"]["rows"]}
    assert {(0,0,0),(1,0,0),(0,1,0)}<=static
    assert d["signedTime"]["originalSigma"]==[22001223,22001224]
    assert d["signedTime"]["pins"]["sigmaT"]==PINS["signedSigmaT"][2]
    assert d["signedTime"]["pureTimeGauge"]["gaussian"]=="sqrt(zeta)"
    for k,s in {
        "mapped":("remainingSource:inverse.source.map(z=>mapComplex(C.scale(G.sub(G.one,psiPath),z)))",
                  "derivativeSource:inverse.velocity.map(z=>mapComplex(C.scale(pathCutoff.dpsi,z)))"),
        "repeat":("const subtraction = value.map((_, j) => C.add(...terms.map(term => term.value[j])))",
                  "const supported = value.map((z, j) => C.sub(z, subtraction[j]));",
                   "row.deltaAmplitude, chi, x", "'exact signed cutoff times uncut amplitude'"),
    }.items():
        assert all(x in d[k] for x in s),k


def main(a):
    d=load(a)
    conditions(d)
    rows,counts=prove(a,d)
    return {"schema":"MathScope.C136.OriginalRepeatSubtractionDerivatives/1",
            "status":"VERIFIED_ORIGINAL_FOUR_SUBTRACTIONS_CONDITIONAL_THEIR_RADIAL_C1_TRACE",
            "pins":PINS,"chartModes":rows,"nonliteralZeroScalarFamilyCounts":counts,
            "exactDerivativeProducts":product_footprint(),
            "nativeOperators":{"slow":"R,Z,T,L annihilate psi and psi_v on the fixed lift",
                "fast":"c_i,eff N is d/dv on these mapped pulse roots, with the original H_w basepoint identity",
                "supportedRule":"D raw - sum D family. Outer -epsilon partial_T gives +epsilon partial_T of each subtraction. The original inner raw time marker is exactly -epsilon and absent in all four families.",
                "restoredHarmonic":"Differentiating Q exp(i m k phi) adds i m k (D phi) Q, a finite fixed-label factor. The azimuthal derivative only enters that carrier.",
                "support":"The original step arguments have fixed L_s and satisfy the actual [L_s/5,4L_s/5] flat longitudinal restriction. No division by psi or 1-psi."},
            "firstDerivativeTrace":{"forcedModeOne":"sqrt(zeta) times a finite collar pole",
                                     "forcedModeTwo":"zeta times a finite collar pole (sqrt(zeta) suffices)",
                                     "primaryAndSigned":"sqrt(zeta) times a finite collar pole",
                                     "scope":"Original fixed-label admitted chart, source pressure and exact inverse, positive frame, both fixed radial endpoints and flat smooth Fourier, pulse and cutoff realization."},
            "open":"The raw Repeat derivative footprint, complete grouped radial C1 trace, uniform epsilon norm and final jets require their own evidence.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","goal","out"):
        p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args()
    output=main(a)
    a.out.write_bytes((json.dumps(output,indent=2)+"\n").encode())
    print(output["status"],output["nonliteralZeroScalarFamilyCounts"])
