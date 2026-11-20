"""Directed selection of an admitted reference label from exact physical log-scale enclosures."""
from fractions import Fraction as F
import argparse
import json
from pathlib import Path


def selected_reference(log_low, log_high, ell_low, ell_high):
    """Pick the label minimizing the worst log-coordinate distance on this cell."""
    assert log_low <= log_high and ell_low <= ell_high
    midpoint = (log_low + log_high)/2
    unbounded = (midpoint + F(1,2))//1
    label = min(ell_high,max(ell_low,unbounded))
    distance = max(abs(log_low-label),abs(log_high-label))
    return {
        "label":label,
        "logOffset":[str(log_low-label),str(log_high-label)],
        "worstLogOffset":str(distance),
        "strictBracketCertified":distance<=F(3,4),
    }


def replay():
    # For |ell-t| <= 3/4 the normalized s=2**(ell-t) and
    # s**(1-2h) both lie in [(7/12),(12/7)] with 0<=h<=1/16.
    small,big = F(7,12),F(12,7)
    assert small**4 < F(1,8) and 8 < big**4
    assert 2*F(7,8)**8<1
    lower=min(small,F(7,8)*small)
    upper=max(big,F(8,7)*big)
    assert lower==F(49,96)>F(1,2)
    assert upper==F(96,49)<2

    # Compare the exact minimax result with a separate exhaustive finite
    # reference-index check. This uses no logarithm or floating-point root.
    checked=0
    for ell_low,ell_high in [(-3,-3),(-3,3),(2,6),(17,18)]:
        allowed=list(range(ell_low,ell_high+1))
        for left8 in range(-36,157):
            lo=F(left8,8)
            for span8 in range(17):
                hi=lo+F(span8,8)
                result=selected_reference(lo,hi,ell_low,ell_high)
                distances={i:max(abs(lo-i),abs(hi-i)) for i in allowed}
                assert F(result["worstLogOffset"]) == min(distances.values())
                assert result["strictBracketCertified"] == any(d<=F(3,4) for d in distances.values())
                checked+=1
    # Translate integer ranges using large integer indices without forming
    # 2^ell, as the original pinned family may have a large frozen label.
    big_label=10**1000
    large=selected_reference(F(big_label)+F(1,4),F(big_label)+F(3,4),big_label,big_label+2)
    assert large["label"]==big_label+1 and large["strictBracketCertified"]
    overlap=selected_reference(F(11,4),F(13,4),2,6)
    rejected=selected_reference(F(5),F(11,2),2,3)
    assert overlap["strictBracketCertified"] and not rejected["strictBracketCertified"]
    return {
        "testedClosedIntervalCells":checked,
        "coversAnyPermittedReferenceCellWithWorstLogOffsetAtMost":"3/4",
        "rationalNormalizedScaleBounds":[str(small),str(big)],
        "strictEndpointGaps":[str(lower-F(1,2)),str(2-upper)],
        "overlapControl":overlap, "outsideWindowControl":rejected,
        "largeIndexOffsetControl":large["logOffset"],
        "exactPhysicalQEnclosureSuppliedByCaller":True,
        "installedOnOriginalNativeCaller":False,
        "release":"HOLD",
    }


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output",type=Path)
    args=parser.parse_args()
    args.output.write_text(json.dumps(replay(),indent=2,sort_keys=True)+"\n",encoding="utf-8",newline="\n")
