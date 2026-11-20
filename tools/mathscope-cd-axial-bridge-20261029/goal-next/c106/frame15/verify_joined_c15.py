"""Bind the same-label directed C16 background and all primary C15 target data."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path


PINS={
    "inner":"5e15f58956e40d31904dcd2522f050bc6f72d614a07fc26de664b71ec513e6be",
    "outer":"89488720477dca34e5e98f2304a26c0722be72df6bc17278e62790f2cf609c93",
    "middle":"82a8f02074be1f1e0d4fa21d897c7a59adb96a9f77174f82530169fc94b81cd3",
    "frame":"09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8",
    "chart_geometry":"25144d0df386b7522ac5076696aa78feadc1bee9c7188ab8847a9efaae4a6596",
    "compact":"00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884",
    "raw_grade":"6b720ec53272ee59d1576ed374dedcf9267bbdfc41c2ad122d0e7e24face8298",
    "radial":"789ebac9d163f4170581078e2a73e85cb4703582155d7ae8e71846915b6b08fc",
    "primary_c11":"595b67bd263d08a54ac25bc7dae5cdc108d050158b6c238e603c19e00704aec8",
}
CHART="ba0830ec36ca4dcd8c7c9709e868a4523b938afc4ed0c97cb9ddbfbb160b823c"
LEADING="bc5d210c3a2d0dddebe316492e385574e36540188dc2599442351c8d0ec76da7"
BACKGROUND="1833785fc21ad6c73029361d6d6a44b2bb0baa099d57986709114093a53de9cc"


def main(a):
    files=("background",*PINS)
    data, hashes={},{}
    for name in files:
        raw=getattr(a,name).read_bytes()
        hashes[name]=sha256(raw).hexdigest()
        if name in PINS:
            assert hashes[name]==PINS[name],name
        data[name]=json.loads(raw)
    assert hashes["background"]==BACKGROUND
    bg,inner,outer,middle,frame,geometry,compact,grades,radial,primary=(data[k] for k in files)
    assert bg["derivativeOrder"]==16 and bg["comparison"]["sign"]==-1
    assert bg["leading"]["leadingLogCap"]=="H/2^300" and bg["leading"]["leadingLogCapSign"]==-1
    assert inner["pins"]["chart16"]==outer["pins"]["chart16"]==middle["pins"]["chart16"]==frame["pins"]["chart16"]==CHART
    assert inner["pins"]["directedLeading16"]==middle["pins"]["directedLeading"]==LEADING
    assert bg["inputs"]["chartSHA"]==CHART
    assert "Hc" in json.dumps(geometry) and "Renv" in json.dumps(geometry)
    assert inner["originalRegularInnerBodies"]==[119712,119713]
    assert outer["actualRegularOuterBodies"]==[119567,119694]
    assert inner["outputDerivativeOrder"]==outer["outputDerivativeOrder"]==middle["capRows"][-1]["outputOrder"]==15
    assert inner["ordinaryCapRows"][-1]["physicalRZTCap"]==outer["ordinaryCapRows"][-1]["physicalRZTCap"]=="2^4096*Bnorm"
    assert all(row["literalMatch"] for row in middle["sourceRows"])
    assert [row["activeSlot"] for row in middle["sourceRows"]]==outer["activeTargetSlots"]
    assert frame["upstreamPrimaryCount"]==compact["primaryRoles"]==1213
    assert frame["upstreamHighPrimaryCount"]==compact["highPrimaryRoles"]==335
    assert compact["pins"]["frame"]==hashes["frame"] and grades["pins"]["compact"]==hashes["compact"]
    assert primary["sourceRawRoleCount"]==110
    assert compact["coefficientProfile"]["compactChargeInHOver2Pow128"]==59559
    assert radial["ordinaryDerivativeOrder"]==10 and radial["originalLiveSlabThresholdComparison"]==-1
    result={"schema":"MathScope.C106.JoinedSourceC16AndHighModeOneInputs/1",
            "status":"VERIFIED_DIRECTED_SOURCE_BUDGET_CONDITIONAL_ADMITTED_ORIGINAL_CHARTS",
            "pins":hashes,"originalBackgroundOrder":16,"regularTargetOrder":15,
            "wholeMeanDonorRoles":273,"primaryCovarianceRoles":1213,"highPrimaryRoles":335,
            "originalDirectQuotientRoles":110,"normalizedRadialBackgroundOrder":10,
            "candidateModeOneGaugeGradeUnderDeclaredRawGeometryPremises":grades["conditionalPhaseFreeGaugeGrade"],
            "open":["Remaining high transport and phase coefficient product and collar attachment on the source.",
                    "Full actual early Signed targets and post-Signed covariance matching, complete coupled K1 energy, final N8 and jets."],
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS same original C16/C15 target and high ModeOne donor join: 273 mean, 335 high covariance, 110 direct quotient")


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("background",*PINS,"out"):
        p.add_argument("--"+name.replace("_","-"),type=Path,required=True)
    main(p.parse_args())
