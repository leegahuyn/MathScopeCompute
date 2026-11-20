"""Join the pinned original high-order source upper bounds on the admitted live charts."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    "inner": "79c6471329316eeb52668dea299949866ff80f8d29ecebe34cac9a9d4cc44a0a",
    "middle": "71d6373f95b02c5d9eba7583090d9ea9f874509c0487b5e98d3010db6178bf04",
    "outer": "6b6c589046cc8b53222a1e4c76dfdd3fd2ac6312b24da2c729e2534c546f0534",
}


def main(args):
    docs, digests = {}, {}
    for name in ("inner","middle","outer","background","frame"):
        data=getattr(args,name).read_bytes()
        digests[name]=sha256(data).hexdigest()
        if name in PINS:
            assert digests[name] == PINS[name]
        docs[name]=json.loads(data)
    inner,middle,outer,bg,frame=(docs[n] for n in ("inner","middle","outer","background","frame"))
    assert inner["domain"]["u"]==["0","1/4"] and inner["domain"]["eta"]==["-1","1"]
    assert inner["originalRegularInnerBodies"] == [119712,119713]
    assert outer["actualRegularOuterBodies"] == [119567,119694] and outer["activeTargetSlots"]==[32017,32018]
    assert inner["ordinaryCapRows"][-1]["physicalRZTCap"] == outer["ordinaryCapRows"][-1]["physicalRZTCap"] == "2^4096*Bnorm"
    assert inner["outputDerivativeOrder"]==outer["outputDerivativeOrder"]==11
    assert middle["domain"]==["log(X/Xa)>=t1/8","log(Xb/X)>=1/4","abs(eta)<=1","1/2<=s<=2"]
    assert [row["activeSlot"] for row in middle["sourceRows"]]==outer["activeTargetSlots"]
    assert all(row["literalMatch"] for row in middle["sourceRows"])
    assert middle["highInputBound"]["prefixPureEtaPath"] == "0<=X<=Xb"
    assert middle["independentActualP0"]["independentOrdinaryC12Cap"] == "CSelected^2<Renv"
    target = middle["ordinaryCapRows"][-1]["positiveRecurrence"]
    assert target["bothMiddleSlowRenvDegree"]==244 and target["bothMiddleSlowEnvelopeDegree"]==2
    chart_sha = "2b67932e63182154d7f529d767c77180b7de458d4c049da2eb6c7fabdb4df337"
    assert bg["inputs"]["chartSHA"] == frame["pins"]["chart"] == chart_sha
    assert bg["derivativeOrder"]==12 and bg["comparison"]["sign"]==-1
    assert bg["leading"]["leadingLogCap"]=="H/2^300" and bg["leading"]["leadingLogCapSign"]==-1
    assert bg["leading"]["rejectedTighterRenvPowerSign"]==1

    # Bnorm >= Renv^4096 >= 2^4096 and H > Bnorm^511/2 on this same label.
    # log Renv <= Bnorm and log Bnorm <= Bnorm. The collar cap fits M.
    assert 4097*2**129 < 2**(4096*510)
    # For the actual looser, directed leading cap, the exponent in
    # Renv^244 D^2 costs at most (1+2) H/2^300. P0 < Renv fits D as well.
    assert 244*2**301 < 2**(4096*510)
    assert 3 < 2**(300-256)
    assert all(sum(row["logDegreeRanks"]) < 2**16 for row in frame["selectedRows"])
    assert len(frame["selectedRows"])==10 and max(row["RZL"][1] for row in frame["selectedRows"])==10
    result = {
        "schema":"MathScope.C101.JoinedSelectedBackgroundFrameAndTarget/1",
        "status":"VERIFIED_DIRECTED_SOURCE_BUDGET_CONDITIONAL_ORIGINAL_SHIFTED_CHARTS",
        "pins":digests,
        "backgroundOrdinaryOrder":12,
        "regularTargetOrdinaryOrder":11,
        "sourceLeadingPressureCap":"CSelected^2<Renv",
        "targetThreeRegions":{"inner":"<=M by 2^4096*Bnorm",
                              "middle":"log <=3 H/2^300 < H/2^256",
                              "outer":"<=M by 2^4096*Bnorm"},
        "selectedCovarianceCount":10,
        "selectedCovarianceCoefficientLogCap":"H/2^112",
        "scope":"Pointwise on the original admitted slab and stated original charts, under the original "
                "normalized pulse, Gram, torus translation and ordinary smooth realization. The rows "
                "cover the C100 linear Temporal selection and the identified pure Z10 W_rz channel. "
                "Full compact mean demands and nesting through the native signed stage still require attachment.",
        "open":["Complete compact derivative selection", "Whole shifted-path Temporal and Signed source gates",
                "N7-06 and N8-05", "All final jets"],
        "release":"HOLD",
    }
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original C12 background, three actual C11 regular target budgets and 10 selected covariance rows")


if __name__=="__main__":
    assert __debug__
    cli=ArgumentParser(description=__doc__)
    for key in ("inner","middle","outer","background","frame","out"):
        cli.add_argument("--"+key,type=Path,required=True)
    main(cli.parse_args())
