"""Exact open-neighborhood bounds for the original closed axial chart endpoint."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

BAND="a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"
BRACKET="411d526087ae7aa5e2fd281f1a10fb6b659cb390fc5da1004bdebd81f6d3a6b5"


def pin(p, expected):
    raw=p.read_bytes()
    assert sha256(raw).hexdigest()==expected,(p,expected)
    return raw


def verify(runtime, joint):
    band=pin(runtime/"source-global-band.mjs",BAND).decode()
    pin(joint,BRACKET)
    assert "chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T)" in band
    assert "left:q(1,2),right:q(2)" in band
    assert "eta=G.div(Z,power(s,D))" in band
    s_lo,s_hi=Q(1,4),Q(1)
    T_lo,T_hi=Q(3,8),Q(5,8)
    Z_abs,h_hi=Q(1,8),Q(1,16)
    low_value=s_lo-T_lo
    high_value=s_hi-Z_abs**2-T_hi
    derivative=1-2*h_hi*Z_abs**2/s_lo
    assert (low_value,high_value,derivative)==(Q(-1,8),Q(23,64),Q(127,128))
    # On [1/4,1], s^(2h)<=1 and s^(-1)<=4 for h>0.
    # For D in (0,1/2), s^D>=sqrt(s)>=1/2, so |eta|<1/4.
    assert (2*Z_abs)==Q(1,4)
    return {
        "schema":"MathScope.C121.OriginalReferenceAxisOrdinaryExtension/1",
        "originalBracket":["1/2","2"],
        "extensionNeighborhood":{"absZ":"<1/8","T":["3/8","5/8"],"TEndpoints":"open"},
        "extensionRootBracket":["1/4","1"],
        "strictSourceValues":{"lowerAtOneQuarter":str(low_value),"upperAtOne":str(high_value)},
        "ordinaryRootDerivativeLower":str(derivative),
        "etaAbsoluteBound":"<1/4",
        "axisFirstAndSecondJet":{"s":"1/2","s_T":1,"s_Z":0,"s_TT":0,"s_ZT":0,
                                "s_ZZ":"2*(1/2)^(2h)","all_R":0},
        "binding":"Unique real analytic continuation of the same original equation; agrees wherever the transported root is in [1/2,2].",
        "runtimeClaim":"Shared original registered root still has the original domain; the extension supplies its ordinary one-sided derivative realization.",
        "namedActiveRepeatRegisterCalls":"OPEN","finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("runtime","joint","out"):
        p.add_argument("--"+name,type=Path,required=True)
    a=p.parse_args()
    result=verify(a.runtime,a.joint)
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS exact original chart analytic continuation, derivative lower 127/128")
