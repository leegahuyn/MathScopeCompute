"""Bind all actual Repeat fast guards to original open zero collars."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

ACTIVE = "continuation132/active-repeat-source/"
NAVIER = "mathscope-m3/navier/"
PINS = {
    "active":("work",ACTIVE+"active-readback.json","49c39b69df109650688cb21e8331fe53ffc65da1e8f899d1fa97c61a67cce2c4"),
    "pulse":("work",ACTIVE+"active-pulse.json","66ef428eac20fb51f5aa5f4a26b2e197e3580c1d1b42bf6cc0521cfe40c7c1e7"),
    "side":("work",ACTIVE+"active-nonradial.json","86ec5d2ed89cb1b2038d1be5b3afcaeb6233feb6901bd2db16970578cb7d2cf6"),
    "wave":("work",ACTIVE+"protected-wave-bodies.json","2d326dee551a7c4b83908aab1244fcbd9916d398fa3d77af17eb73698106256b"),
    "tails":("work",ACTIVE+"protected-cutoff-tails.json","7932abec4bdcc8db898e8c3c7fb8c5b8e217879fe31937eedf437874154b7f03"),
    "transverse":("work","continuation110/active-j2-full-source/protected-transverse-bodies.json","92efd7b6e297e59a8d74f0692313e485e7b6d60340330406ae0a42cb55777ce0"),
    "subtractions":("work","continuation136/radial-subtractions/radial-subtractions.json","5a180455eb9a631903da085ca0bd62218da2562e19a43c12fb1b79796c1e7636"),
    "radial":("work","continuation137/actual-radial-c1/actual-radial-c1.json","519ce3b290761aff72299c32589341da77e32c750baa88f833b490110f24f7ac"),
    "slow":("work","continuation112/j2-slow-radial/active-slow-face-binding.json","c6cc14cede238f252f31996abd2dabdbb8c8c34aae972e3288c40866241fc249"),
    "candidate":("work","continuation132/hosted-44682703381/active-n3-repeat-forced-candidate.json","b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e"),
    "family":("runtime","mathscope-m2/navier/actual-common-admissible-family.mjs","7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75"),
    "band":("runtime",NAVIER+"source-global-band.mjs","a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
    "current":("runtime",NAVIER+"source-global-current.mjs","b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36"),
    "pressure":("runtime",NAVIER+"source-global-pressure.mjs","c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4"),
    "lift":("runtime",NAVIER+"source-initialized-angular.mjs","4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e"),
    "first":("runtime",NAVIER+"source-global-forced-current.mjs","1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3"),
    "forcedKernel":("runtime",NAVIER+"source-forced-pulse.mjs","866d8ec69758b9f036b73e6e8f04fb88cfb248e7a01d32e7b048df535c1020f9"),
    "mapped":("runtime",NAVIER+"source-mapped-forced-curl.mjs","3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd"),
    "repeat":("runtime","mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs","4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7"),
}
FAMILIES = {
    "first-forced-remaining-source":120,
    "first-forced-cutoff-derivative":120,
    "primary-cutoff-derivative":30,
    "signed-cutoff-derivative":30,
}


def data(roots):
    result={}
    for k,(sub,rel,h) in PINS.items():
        p=roots[sub]/rel
        raw=p.read_bytes()
        assert sha256(raw).hexdigest()==h,(k,p)
        result[k]=json.loads(raw) if p.suffix==".json" else raw.decode()
    return result


def source_checks(d):
    checks={
        "family":("r0=q(1,1n<<34n)","ell0=G.add(ellMinimum,q(6))"),
        "band":("G.choose(a,q(1,4),q(3,4),G.one,G.step(G.sub(q(3,2),G.mul(q(2),a))),G.zero)",
                "G.mul(G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls))))",
                "Ls=G.div(G.mul(q(2),r0),ci)"),
        "current":("conditions:['0<q<qGlobalStar','b_(N+1)*q>=1']",
                   "compatibleAtlas:'For any two prefix orders valid at this same q",
                   "outerCandidateGuard:'Use reference q and mapped mesh coordinates"),
        "pressure":("allCrossLabelProductsVanish:current.assembly.sourceCrossTermsZero",
                    "localFinitenessAndFlatJoins:current.assembly.derivativeRule"),
        "lift":("original-integer-lift-transverse-fixed",
                "original-integer-lift-pulse-at-Hw-is-w",
                "primary.originalFixedPositiveA,band.cutoffs.chi,x",
                "localMap(G.mul(G.q(1,2),dpsi,x))"),
        "first":("zeroDataPreservesTransverseSupport:",
                 "exactAngularSourceSupportIdeal(G,{rows:old.nonzeroAngularForcing,waveSystems:systems})"),
        "forcedKernel":("pressureNumerator=cadd(G,cdot(G,normalRow,velocity),cdot(G,n,forcing))",
                         "pressure=cscale(G,psi,result.pressure)"),
        "mapped":("C.scale(G.sub(G.one,psiPath),z)","C.scale(pathCutoff.dpsi,z)"),
        "repeat":("row.deltaAmplitude, chi, x","localMap(G.mul(G.q(1, 2), dpsi, root))",
                  "rows: positive.map(({ m, raw }) => ({ m, value: raw }))"),
    }
    for name, needles in checks.items():
        for needle in needles:
            assert needle in d[name],(name,needle)
    return {k:len(v) for k,v in checks.items()}


def geometry():
    radius=Q(1,2**34)
    xi=Q(7,8)
    lo,hi=Q(1,10),Q(9,10)
    assert Q(3,4)<xi<1
    assert 20*lo-4==-2 and 16-20*hi==-2
    assert Q(1,5)<Q(4,5)
    assert 2*radius==Q(1,2**33)<Q(1,2)
    assert Q(1,4)<Q(1,2)<2<4
    assert Q(1,2)<Q(3,4)<Q(3,2)
    assert Q(3,2)-2*Q(1,2)==Q(1,2)
    return {"r0":str(radius),"normalizedInnerXiSupport":str(Q(3,4)),
            "sufficientXiCollarAbsNormalized":str(xi),
            "normalizedPulseSupport":[str(Q(1,5)),str(Q(4,5))],
            "sufficientPulseCollars":[str(lo),str(hi)],
            "nativeNearestCopyMargin":str(Q(1,2)-2*radius),
            "sharedReferenceTieControl":{"q":"2^(-(ell+1/2))","squaredScales":["1/2","2"],
                "bothRetainedAbsoluteBandOffsets":"1/2","flatOmittedBandOffset":"3/2"},
            "outerQBandCenterControl":"At q*=2^(-(ell0+4)), the label ell0+4 has zero band offset, so the band bump does not enforce a zero trace."}


def by_chart(rows, name="chart"):
    output={r[name]:r for r in rows}
    assert len(output)==len(rows)==10
    return output


def guard_join(d):
    mech=d["active"]["mechanics"]
    stream=d["active"]["stream"]["sha256"]
    assert stream==d["pulse"]["sourceStreamSHA256"]==d["side"]["streamSHA256"]
    assert d["side"]["pulseClosureSHA256"]==PINS["pulse"][2]
    assert mech["sourceScalars"]==mech["interiorLiteralSupportedEquality"]==240
    assert mech["everyFailedGuardLazyZero"] is True
    assert d["pulse"]["status"]=="CONDITIONAL_ACTIVE_ORIGINAL_CLOSED_PULSE_EQUALITY"
    assert d["side"]["status"]=="CONDITIONAL_ACTUAL_NONRADIAL_FACE_ATTACHMENTS"
    assert d["side"]["checkedSignedBodies"]==30 and d["side"]["axisChecks"]==150
    assert d["radial"]["supportedScalars"]==240 and d["radial"]["radialFaces"]==2
    protected=d["active"]["stream"]["protectedPrefixCompleteHash"]
    assert protected==d["wave"]["predecessor"]["streamSHA256"]==d["transverse"]["originalStreamSHA256"]
    assert protected==d["slow"]["source"]["sha256"]==d["tails"]["sourceStreamSHA256"]
    assert d["wave"]["upstreamTailProofSHA256"]==PINS["tails"][2]
    assert d["transverse"]["protectedPulseBodiesSHA256"]==PINS["wave"][2]
    assert d["transverse"]["protectedWaveBodies"]==160
    assert d["subtractions"]["nonliteralZeroScalarFamilyCounts"]==FAMILIES

    p=by_chart(d["pulse"]["rows"])
    s=by_chart(d["side"]["rows"])
    w=by_chart(d["transverse"]["charts"])
    c=by_chart(d["candidate"]["templates"],"key")
    assert set(p)==set(s)==set(w)==set(c)==set(mech["guardTriplesByChart"])
    slow=[d["slow"]["axisFactors"][axis]["guard"] for axis in ("band","T","Z","R")]
    corner=[]
    for key,guards in sorted(mech["guardTriplesByChart"].items()):
        assert len(guards)==7 and guards[:4]==slow
        assert guards[4]==[17732770,3617,28826]
        assert guards[5]==s[key]["xiGuard"]
        assert guards[5]==[w[key]["xi"],17733047,d["transverse"]["originalTransverseRadius"]]
        assert guards[6]==p[key]["pulse"]==[w[key]["v"],0,17733029]
        assert s[key]["originalFlatFactorUsesByAxis"]["xi"]
        assert len(w[key]["reportedOwnersAndVerifiedProtectedBodyRoots"])==16
        assert len(p[key]["independentRawIdeal"]["checks"])==24
        assert all(x["reduced"]==0 for x in p[key]["independentRawIdeal"]["checks"])
        raw_ids={r["raw"][j][part] for r in c[key]["rows"] for j in range(3) for part in ("real","imaginary")}
        assert raw_ids=={x["source"] for x in p[key]["independentRawIdeal"]["checks"]}
        ids=[x["root"] for x in s[key]["nativeSignedTailCases"]]
        assert ids==[x["real"] for x in p[key]["signedCutoffDerivative"]["roots"]]
        assert len(ids)==3
        corner.append({"chart":key,"nativeGuardTuples":guards,"supportedScalars":24,
            "rawWaveIdealChecks":24,"protectedWaveOwners":16,"signedTailRoots":ids,
            "radialFastFaceGroups":8})
    return corner


def main(roots):
    d=data(roots)
    cases=guard_join(d)
    return {"schema":"MathScope.C138.OriginalRepeatFixedLabelFastCorners/1",
        "status":"CONDITIONAL_ACTUAL_FIXED_LABEL_RADIAL_FAST_CORNERS_C1",
        "pins":PINS,"sourceChecks":source_checks(d),"originalGuardsByChart":cases,
        "exactMargins":geometry(),"chartScalarCount":sum(row["supportedScalars"] for row in cases),
        "fixedLabelRadialFastFaceGroups":sum(row["radialFastFaceGroups"] for row in cases),
        "cornerProperty":"The original guarded supported field and every first partial are identically zero in an open fast strip near either actual fast guard on each admitted fixed label, including joint radial approaches.",
        "allFourSubtractionFamilies":FAMILIES,
        "open":["Common-active-label real chart admission and transported equality of value and first jets across reference label changes",
            "Global updated indexed nearest-copy/relabel agreement and exact outer-domain cutover as applicable"],
        "fullGlobalC1Claim":False,"uniformEpsilonClaim":False,"finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for f in ("work","runtime","out"):
        p.add_argument("--"+f,type=Path,required=True)
    a=vars(p.parse_args())
    a["out"].write_bytes((json.dumps(main(a),indent=2,sort_keys=True)+"\n").encode())
