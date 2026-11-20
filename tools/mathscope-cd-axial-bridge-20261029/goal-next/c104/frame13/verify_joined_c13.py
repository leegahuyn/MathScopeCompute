"""Join the actual original background, three target regions and compact donor."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    "background": "95155cca443e1a62c0cbc6234a24ba7f8180bac15003e70c46d035309b96c18b",
    "inner": "8f1ba9f615264e97fca7c0d12ce02735360618695fffaaf6dd1ec2b836d34bd5",
    "outer": "193ce67b755ff9cf58343ee7e45380b62fea8c7f3ca10fd33e306216cdfd4de6",
    "middle": "8fcbae387b6feb83c6f9d27a403485d5aca2ecb3fa88c91deccd2894a1864093",
    "frame": "4552e8b0b8d6d3d850b3e7c03d579ecb5fccb9efbf10df3612a0d86f0200034c",
    "compact": "360b18bef09ba1afd09b160b342e70f38474c876b19a00a73fe0eb3169b9f650",
}
CHART="b3f110811f8c704daf2d1b9190947b41f4cc76aeeb62b2656f65044a98b077c2"


def main(args):
    sources,digests={},{}
    for name in ("background","inner","middle","outer","frame","compact"):
        raw=getattr(args,name).read_bytes()
        digest=sha256(raw).hexdigest()
        if name in PINS:
            assert digest==PINS[name],name
        sources[name],digests[name]=json.loads(raw),digest
    bg,inner,middle,outer,frame,compact=(sources[name] for name in (
        "background","inner","middle","outer","frame","compact"))
    assert bg["inputs"]["chartSHA"]==frame["pins"]["chart14"]==middle["pins"]["chart14"]==CHART
    assert inner["pins"]["chart14"]==outer["pins"]["chart14"]==CHART
    assert inner["pins"]["background14"]==digests["background"]
    assert compact["pins"]["frame"]==digests["frame"]
    assert bg["derivativeOrder"]==14 and bg["comparison"]["sign"]==-1
    assert bg["leading"]["leadingLogCap"]=="H/2^300" and bg["leading"]["leadingLogCapSign"]==-1
    assert inner["originalRegularInnerBodies"]==[119712,119713]
    assert outer["actualRegularOuterBodies"]==[119567,119694]
    assert inner["outputDerivativeOrder"]==outer["outputDerivativeOrder"]==13
    assert inner["domain"]["u"]==["0","1/4"] and inner["domain"]["eta"]==["-1","1"]
    assert inner["ordinaryCapRows"][-1]["physicalRZTCap"]==outer["ordinaryCapRows"][-1]["physicalRZTCap"]=="2^4096*Bnorm"
    assert middle["domain"]==["log(X/Xa)>=t1/8","log(Xb/X)>=1/4","abs(eta)<=1","1/2<=s<=2"]
    assert [row["activeSlot"] for row in middle["sourceRows"]]==outer["activeTargetSlots"]
    assert all(row["literalMatch"] for row in middle["sourceRows"])
    middle_cap=middle["capRows"][-1]
    assert middle_cap["outputOrder"]==13 and middle_cap["inputLeadingOrdinaryOrder"]==14
    assert middle_cap["positiveRecurrence"]["bothMiddleSlowRenvDegree"]==339
    # The C101 same-source chart inequalities apply to the larger finite
    # ranks. The directed bound for D pays two terms in the middle product.
    assert 4097*2**129 < 2**(4096*510)
    assert 339*2**301 < 2**(4096*510) and 3 < 2**44
    assert compact["sizes"]["primaryHighCovariance"]==169
    assert max(sum(row["logDegreeRanks"]) for row in compact["covarianceHighOrders"])<2**17
    assert compact["actualCompactProfile"]["compactChargeInHOver2Pow128"]==54920 < 2**17
    result={"schema":"MathScope.C104.JoinedBG14AndTarget13WithCompactMomentInputs/1",
            "status":"VERIFIED_ORIGINAL_SOURCE_BUDGET_CONDITIONAL_ORDINARY_CHARTS",
            "pins":digests,"backgroundOrder":14,"regularTargetOrder":13,
            "regularTargetLogCaps":{"inner":"H/2^128","middle":"H/2^256","outer":"H/2^128"},
            "sourceCovarianceRequests":compact["sizes"]["primaryCovariance"],
            "highOriginalDerivativeCovarianceRequests":compact["sizes"]["primaryHighCovariance"],
            "compactMomentMaximumZT":compact["momentMaxZT"],
            "remaining":["The complete original high Forced and local higher stress bounds in both Signed pressure rows.",
                         "The complete post-Signed covariance, late inverse and stage-one coupled energy.",
                         "Independent final field convergence and all 67 jets."],
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS joined original C14 background and three C13 regular target regions", compact["sizes"])


if __name__=="__main__":
    parser=ArgumentParser(description=__doc__)
    for name in ("background","inner","middle","outer","frame","compact","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    main(parser.parse_args())
