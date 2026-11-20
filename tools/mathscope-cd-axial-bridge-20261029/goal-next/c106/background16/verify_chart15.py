"""Replay the original ordinary chart coefficient support through order fifteen."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import runpy

PINS={
    "kernel":"384daafdcb5cad2e57b4bbb0440bc4b2e4a5912b4835e2d7510c21301a44ff15",
    "chart14":"b3f110811f8c704daf2d1b9190947b41f4cc76aeeb62b2656f65044a98b077c2",
    "support":"76c582686456dfbbb6e010bcad886d9c388c1625d45c66a05d42bdca7c401271",
}


def pin(a,key):
    path=getattr(a,key)
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],path
    return raw


def main(a):
    old=json.loads(pin(a,"chart14"))
    kernel=pin(a,"kernel")
    for fragment in (b'alpha.findLastIndex(x=>x>0)',
        b'put([...term.profileOrders],chart.derivative(term.coefficient,axis));',
        b'put(beta,G.mul(term.coefficient,chart.coefficients[axis][j]));'):
        assert fragment in kernel
    pin(a,"support")
    support=runpy.run_path(str(a.support))["support"]
    assert old["atomDerivativeOrder"]==15 and old["totalDirections"]==680
    atom_order=16
    assert 1-2*Q(1,64)*Q(5,4)**2>Q(1,2)
    recip=2*4**atom_order*factorial(atom_order)
    half=factorial(atom_order+1)
    scale=2**(atom_order+2)*half
    integer=2*2**atom_order*8*4**atom_order*scale*half*recip
    dyadic=integer.bit_length()
    geom=18
    assert Q(atom_order)+Q(1,2)<geom
    step=(6*2**atom_order).bit_length()
    n=0
    prior={tuple(row["RZT"]):row for row in old["additionalDirections"]}
    next_rows=[]
    for r in range(16):
        for z in range(16-r):
            for t in range(16-r-z):
                seq=(r,z,t)
                rows=sorted(support(seq))
                assert max(map(sum,rows))==sum(seq)
                if sum(seq)>=13:
                    data=json.dumps(rows,separators=(",",":")).encode()
                    row={"RZT":seq,"terms":len(rows),"profileSupportSHA256":sha256(data).hexdigest()}
                    if sum(seq)<=14:
                        assert {**prior[seq],"RZT":seq}==row
                    else:
                        next_rows.append(row)
                n+=1
    assert n==comb(18,3)==816 and len(next_rows)==136
    cover=(4*n).bit_length()
    exponent=dyadic+15*(dyadic+step)+cover
    geometry=geom*16
    assert (dyadic,step,cover,exponent,geometry)==(244,19,12,4201,288)
    receipt={"schema":"MathScope.C105.OriginalC15PointwiseCoefficientTransfer/1",
        "status":"VERIFIED_ORIGINAL_COEFFICIENT_RECURRENCE_CONDITIONAL_CHART_REALIZATION",
        "pins":PINS,"atomDerivativeOrder":atom_order,"atomCoefficientCap":"2^244*Hc^18",
        "pointwiseCoefficientCap":"2^4201*Hc^288","totalDirections":n,
        "additionalDirections":next_rows,"exactOrder13And14ReadbackRows":len(prior),
        "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(receipt,indent=2)+"\n").encode())
    print("PASS C15 mixed chart",n,len(next_rows),receipt["pointwiseCoefficientCap"])


if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for key in ("kernel","chart14","support","out"):
        p.add_argument("--"+key,type=Path,required=True)
    main(p.parse_args())
