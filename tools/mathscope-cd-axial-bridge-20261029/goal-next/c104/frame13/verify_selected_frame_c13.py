"""Extend the original pulse coefficient recurrence for the pure axial C103 rows."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from math import comb, factorial, prod
from pathlib import Path
import runpy


PINS = {
    "program": "601dd48d4d6bf7cc7b33c50893e81bcf136abb737d622739128e39a582caaa9f",
    "frame11": "5c66c394ca8ae4bf1d347628d4045e8aaf402b0e1895413b8f0ac5a829698603",
    "signedUpstream": "d7d5d99aa0285e99680f90563b9e27bce8a95877265134165061a7f7745e5cc8",
    "chart14": "b3f110811f8c704daf2d1b9190947b41f4cc76aeeb62b2656f65044a98b077c2",
}


def pin(file, digest):
    raw = file.read_bytes()
    assert sha256(raw).hexdigest() == digest, file
    return raw


def adapt(fn, changes):
    source = inspect.getsource(fn)
    for old,new,count in changes:
        assert source.count(old) == count, old
        source = source.replace(old,new)
    scope = {}
    exec(compile(source,inspect.getfile(fn),"exec"),fn.__globals__,scope)
    return scope[fn.__name__]


def coefficient_recurrence(args):
    frame_folder = args.goal/"c101/high-frame"
    program = frame_folder/"verify_high_frame.py"
    pin(program,PINS["program"])
    c101 = runpy.run_path(str(program))
    past = json.loads(pin(frame_folder/"high-frame.json",PINS["frame11"]))
    received = {name:pin(args.goal/path,sha) for name,(path,sha) in c101["PINNED"].items()}
    frame_path,_ = c101["PINNED"]["frameSource"]
    base = runpy.run_path(str(args.goal/frame_path))
    inputs = {name:json.loads(pin(args.goal/path,sha)) for name,(path,sha) in base["PINS"].items()}
    earlier = json.loads(received["selectiveC8"])
    native_chart = json.loads(pin(args.chart14,PINS["chart14"]))
    assert native_chart["pointwiseCoefficientCap"] == "2^3654*Hc^255"
    assert native_chart["totalDirections"] == 680
    expand = adapt(c101["matrix_and_frame"], [
        ('function.__globals__["ORDER"] = 11','function.__globals__["ORDER"] = 13',1),
        ('"assert tested==364"','"assert tested==560"',1),
        ("range(9,12)","range(9,14)",1),
        ('== 364','== 560',1),
        ('== 22','== 26',1),
        ('== 12','== 14',2),
        ('range(1, 12)','range(1, 14)',1),
        ('range(12)','range(14)',3),
        ('range(11)','range(13)',1),
    ])
    matrix,catalog,band,(sigma,tangent,potential,pressure) = expand(args,base,inputs,earlier)
    for key,previous in past["frame"]["coefficientRanks"].items():
        if key=="gramInverse":
            assert catalogue_value(catalog,key) == previous
        else:
            assert catalogue_value(catalog,key)[:len(previous)] == previous, key
    assert matrix["distinctMixedMultiIndicesAudited"] == comb(16,3)==560
    assert band == ["51/2","53/2","105/4"]
    cutoff_replay = adapt(c101["cutoff_and_gaussian"], [
        ('"maximum=15"','"maximum=17"',1),
        ('"2^2699*Hc^195"','"2^3654*Hc^255"',1),
        ('2699+factorial(13)','3654+factorial(15)',1),
        ('195+2*13+1','255+2*15+1',1),
        ('range(12)','range(14)',1),
    ])
    cuts,gaussian,constant = cutoff_replay(args,inputs,native_chart)
    assert cuts["maximumOrdinaryOrder"]==17
    assert all(gaussian[side][:12]==past["gaussianChain"]["polynomials"][side] for side in gaussian)
    Bound=base["Bound"]
    amplitude=Bound(2)*sigma*tangent*Bound(constant,1)*Bound(2**8192,128)
    primary=Bound(2**32)*Bound(2**60,10)*amplitude*(Bound(1)+potential+pressure)
    return (matrix,catalog,band,cuts,gaussian,primary.log_degrees())


def catalogue_value(catalogue,key):
    # A raw Python tuple of scalar ranks is compared to its JSON representation.
    return json.loads(json.dumps(catalogue[key]))


def selected_rows(upstream, cap):
    directions=upstream["topCompactAngularMomentCovarianceRowsZ11andHigher"]
    assert len(directions)==12
    assert [x for x in directions if x[1][1]==12]==[["W_rz",[0,12,0]],["W_rz",[0,12,2]]]
    rows=[]
    for name,(r,z,l) in directions:
        assert r==0 and l in (0,2) and z in (11,12)
        band=Q(1,2)+3*z
        words=sum(comb(z,j)*comb(l,k) for j in range(z+1) for k in range(l+1))
        assert words==2**(z+l)
        assert all(Q(1,4)+3*j+Q(1,4)+3*(z-j)==band for j in range(z+1))
        outer,inner=9+3*z,6+3*z
        outer_half,inner_half=(outer+1)//2,(inner+1)//2
        assert Q(factorial(outer_half),4**outer_half)<2**29
        assert factorial(inner_half)<2**66
        cover=prod((162,16,2,2**band.__ceil__(),4**z,81**l,words,4))
        ranks=[2*cap[0]+cover.bit_length()+66,*(2*x for x in cap[1:])]
        assert Q(sum(ranks),2**128)<Q(1,2**111)
        rows.append({"component":name,"RZL":[r,z,l],"epsilonGrade":"1","bandPower":str(band),
                     "potentialOrders":{"slow":z+1,"L":l+1},"outerAndInnerPoles":[outer,inner],
                     "exactLeibnizSum":words,"logRanks":ranks,"conditionalLogCoefficient":"H/2^111"})
    return rows


def main(args):
    matrix,catalog,band,cuts,gaussian,cap=coefficient_recurrence(args)
    upstream=json.loads(pin(args.goal/"c103/signed-high/signed-high-upstream.json",PINS["signedUpstream"]))
    rows=selected_rows(upstream,cap)
    result={"schema":"MathScope.C104.SelectedPrimaryFrameAndPureAxialCovarianceC13/1",
            "status":"VERIFIED_RECURRENCES_CONDITIONAL_SAME_SOURCE_C14_AND_THREE_C13_TARGETS",
            "pins":PINS,
            "frame":{"auditedDirections":matrix["distinctMixedMultiIndicesAudited"],
                     "coefficientRanks":catalog,"gramWeightSquareRootBandAtThirteen":band},
            "cutoff":{"order":cuts["maximumOrdinaryOrder"],
                      "lastPartitionBits":int(cuts["normalizedFixedLabelPartitionInDimensionlessOffset"][-1]).bit_length()},
            "collarGaussian":gaussian,"primaryUniformLogRanks":cap,"rows":rows,
            "premises":["Original stable normalized pulse and same-label positive Gram on its admitted smooth real charts.",
                        "Whole original leading background C14 and same-label inner, middle and outer regular targets C13.",
                        "Actual normalized source envelope log ranks at most H/2^128."],
            "open":["Independent attachment of exact three target/background receipts.",
                    "Other upstream Forced and early Signed high derivatives, complete K1 and final jets."],
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS selected C13 frame and C17 cutoffs, pure axial covariance rows",len(rows),
          "maximum finite log rank",max(sum(row["logRanks"]) for row in rows))


if __name__=="__main__":
    parser=ArgumentParser(description=__doc__)
    for key in ("goal","chart14","out"):
        parser.add_argument("--"+key,type=Path,required=True)
    main(parser.parse_args())
