"""Exact endpoint-sign checks for changing the original reference label."""
import argparse
from dataclasses import dataclass
from fractions import Fraction
import json
from pathlib import Path


Q = Fraction
HALF = Q(1, 2)
SEVEN_EIGHTHS = Q(7, 8)
EIGHT_SEVENTHS = Q(8, 7)


@dataclass(frozen=True)
class Interval:
    lo: Fraction
    hi: Fraction

    def __post_init__(self):
        assert self.lo <= self.hi

    def nonnegative_scale(self, lo, hi):
        assert 0 <= self.lo <= self.hi and 0 <= lo <= hi
        return Interval(self.lo * lo, self.hi * hi)


@dataclass(frozen=True)
class SlowPointBounds:
    Z_squared: Interval
    T: Interval

    def __post_init__(self):
        assert 0 <= self.Z_squared.lo
        assert 0 <= self.T.lo

    def adjacent(self, difference):
        # Original D = 1/2 - h. With 0 <= h <= 1/16,
        # 7/4 <= 2^(2D) <= 2 and 1/2 <= 2^(-2D) <= 4/7.
        if difference == 0:
            return self
        if difference == 1:
            return SlowPointBounds(self.Z_squared.nonnegative_scale(Q(7,4),Q(2)),
                                   self.T.nonnegative_scale(Q(2),Q(2)))
        assert difference == -1
        return SlowPointBounds(self.Z_squared.nonnegative_scale(Q(1,2),Q(4,7)),
                               self.T.nonnegative_scale(HALF,HALF))

    def endpoint_certificate(self):
        # Native F(s)=s-Z^2*s^(2h)-T; the lower sign is negative
        # and the upper sign is positive when both gaps are strictly positive.
        assert 2 * SEVEN_EIGHTHS**8 < 1
        lower_gap = self.T.lo + SEVEN_EIGHTHS * self.Z_squared.lo - HALF
        upper_gap = Q(2) - self.T.hi - EIGHT_SEVENTHS * self.Z_squared.hi
        return lower_gap, upper_gap


def select_reference(bounds, label, allowed):
    choices = []
    for difference in (0, -1, 1):
        selected = label+difference
        if selected not in allowed:
            continue
        candidate = bounds.adjacent(difference)
        left,right = candidate.endpoint_certificate()
        choices.append({"relativeReferenceLabel":difference,"lowerGap":str(left),"upperGap":str(right),
                        "strictNativeSignsCertified":min(left,right)>0})
    admitted = [c for c in choices if c["strictNativeSignsCertified"]]
    # Prefer the largest certified distance to either endpoint; margin ties
    # use the original ordering and prefer the existing fixed reference.
    return (max(admitted,key=lambda c:min(Q(c["lowerGap"]),Q(c["upperGap"]))) if admitted else None), choices


def point(Z_squared,T):
    return SlowPointBounds(Interval(Q(Z_squared),Q(Z_squared)),Interval(Q(T),Q(T)))


def replay():
    # The two exact Z=0 controls are in the original N1 coefficient
    # window for reference ell=L+2. The allowed window is separate input.
    label=2
    valid=set(range(5))
    old_inner=point(0,Q(15,32))
    old_outer=point(0,Q(5,2))
    inner, inner_choices = select_reference(old_inner,label,valid)
    outer, outer_choices = select_reference(old_outer,label,valid)
    assert inner["relativeReferenceLabel"] == 1 and outer["relativeReferenceLabel"] == -1
    assert select_reference(old_inner,label,{label})[0] is None
    assert select_reference(old_outer,label,{label})[0] is None
    axis,_=select_reference(point(1,0),label,valid)
    interior,_=select_reference(point(0,1),label,valid)
    assert axis["relativeReferenceLabel"] == 0 and interior["relativeReferenceLabel"] == 0
    # When both s and s^(1-2h) lie in [2/3,3/2], the source
    # physical eta² in [0,1] makes each lower/upper expression a convex blend.
    h_lo=max(Q(1,2),Q(0))
    h_hi=Q(2)
    convex_lower=min(Q(2,3),SEVEN_EIGHTHS*Q(2,3))
    convex_upper=max(Q(3,2),EIGHT_SEVENTHS*Q(3,2))
    assert convex_lower==Q(7,12)>h_lo and convex_upper==Q(12,7)<h_hi
    return {
        "lowerRejectedOldReference":{"Z2":"0","T":"15/32","choices":inner_choices,"selected":inner},
        "upperRejectedOldReference":{"Z2":"0","T":"5/2","choices":outer_choices,"selected":outer},
        "originalLabelFixedControlFails":True,
        "testExistingInteriorAndPhysicalTauZero": [interior,axis],
        "uniformEndpointMarginWithinNearReference": [str(convex_lower-HALF),str(Q(2)-convex_upper)],
        "inputAssumptions":["0 <= h <= 1/16","T >= 0","source coefficient-window and physical input validated separately"],
        "operatingCodeChanged":False,
        "wholeNativeJetCoverage":False,
        "release":"HOLD",
    }


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("output",type=Path)
    args=cli.parse_args()
    args.output.write_text(json.dumps(replay(),indent=2,sort_keys=True)+"\n",encoding="utf-8",newline="\n")
