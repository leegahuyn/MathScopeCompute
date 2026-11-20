"""Exact fixed-label phase-free Signed product, cutoff, and Gaussian recurrences."""

from argparse import ArgumentParser
from collections import defaultdict
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
from math import comb, factorial, prod
from pathlib import Path
import inspect
import json
import runpy


BAND=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
PINS={
    "demand":"e3a2f7903bc28324bb09f436fb0ff399ab56f334ef95362c64f715ca4cbc00f8",
    "core":"e8ab0b3aad45d6f995346a20ead2ed412b0fc63fcf9c7ac0a3ed5753bb212b35",
    "implicit":"00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884",
    "cutoffProgram":"f54f5f4cecdbcb3fa6fe8297afba0d679b8b65c4aae62a852288ec616c09bb74",
    "palette":"05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e",
    "pulse":"0b7c13076805acc97cd45e3e4e70e6f7620950744dc493dbff26d0644ff977cc",
    "band":"a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b",
    "pressure":"c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4",
    "guard":"b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36",
    "indexed":"973136acf1571a75a307e374576ec8dbbe0340c19e90ee327373df7638100bec",
}


def pin(name,path):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name],(name,path)
    return raw


def source(a):
    root=a.runtime/"research-ide/mathscope-m3/navier"
    paths={"band":"source-global-band.mjs","pressure":"source-global-pressure.mjs",
           "guard":"source-global-current.mjs","indexed":"generic-signed-162-indexed.mjs"}
    files={k:pin(k,root/v).decode() for k,v in paths.items()}
    assert "xi=G.div(dot(G,vr,offset),Dgeom),eta=G.div(dot(G,vt,offset),Dgeom),v=G.div(G.add(eta,r0),ci)" in files["pressure"]
    assert "derivativeScales=[G.sqrt(b.ratio),power(b.ratio,D),b.ratio]" in files["pressure"]
    assert "q(1,4),q(3,4),G.one,G.step(G.sub(q(3,2),G.mul(q(2),a))),G.zero" in files["band"]
    assert "G.div(G.mul(q(20),v),Ls)" in files["band"]
    assert "out=G.choose(coordinate,left,right,G.zero,inner,G.zero)" in files["guard"]
    assert "G.choose(t.lift.v,G.zero,Ls,G.zero,bodyAt(t),G.zero)" in files["indexed"]
    palette=json.loads(pin("palette",a.goal/BAND/"first-forced-budget/global-covariance-join/global-primary-covariance.json"))
    assert palette["sameLiveCovariance"]["slowDerivativeJacobian"]==["ratio^(1/2)","ratio^D","ratio"]
    rows=palette["sameLiveCovariance"]["coverMatrices"]
    assert [x["LxiUpper"] for x in rows]==[1,3,9,27,81] and all(x["LvExact"]==0 for x in rows)
    pulse=json.loads(pin("pulse",a.goal/BAND/"outer-fixed-label-norm/background-transport.json"))
    families=pulse["actualCovarianceFamilies"]
    assert [row["P"] for row in families]==[17733391,17733724]
    assert all(row["GaussianFixedSlow"] for row in families)


def product_series(left,right,order):
    return [sum(left[i]*right[j-i] for i in range(j+1)) for j in range(order+1)]


def compose(f, x, order):
    acc=[Q(0)]*(order+1)
    power=[Q(1)]+[Q(0)]*order
    for coefficient in f:
        acc=[a+coefficient*b for a,b in zip(acc,power,strict=True)]
        power=product_series(power,x,order)
    return acc


def cutoff_series(a,degree):
    path=a.goal/BAND/"initial-mean-norm/primary/verify_primary_quotient.py"
    pin("cutoffProgram",path)
    fn=runpy.run_path(str(path))["cutoff_constants"]
    old=fn()
    source=inspect.getsource(fn)
    assert source.count("maximum=9")==1
    scope={}
    exec(compile(source.replace("maximum=9","maximum=19"),str(path),"exec"),fn.__globals__,scope)
    new=scope["cutoff_constants"]()
    for name,value in old.items():
        if isinstance(value,list):
            assert new[name][:len(value)]==value
    assert degree==6
    series=json.loads(pin("implicit",a.goal/"c106/high-compact-mode-one/compact-mode-one-c15.json"))["cutoff"]["sTaylorBounds"]
    ds=list(map(Q,series[:degree+1]))
    assert ds[0]==0 and ds[1]==18
    log_s=compose([Q(0)]+[Q(2**j,j) for j in range(1,degree+1)],ds,degree)
    assert log_s[1]==36 and 2*log_s[1]==72
    partition=list(map(Q,new["normalizedFixedLabelPartitionInDimensionlessOffset"]))
    terms=[partition[j]/factorial(j) for j in range(degree+1)]
    band=compose(terms,[2*x for x in log_s],degree)
    slow=band
    for _ in range(3):
        # Frozen mesh offsets have a single derivative ell^6=S^3.
        slow=product_series(slow,terms,degree)
    chart_slow=[factorial(j)*x for j,x in enumerate(slow)]
    chi=[Q(s)*(81*2**34)**j for j,s in enumerate(new["bumpInDimensionlessOffset"][:degree+1])]
    assert chart_slow[0]==chi[0]==1
    return chart_slow,chi,log_s


def reciprocal_gaussians(limit,log_s):
    out={}
    for side,c,exponent in (("inner",Q(1,2),Q(0)),("outer",Q(2),Q(3,2))):
        p={0:Q(1)}
        taylor=[]
        for j in range(limit+1):
            ceiling=sum(abs(v)*Q(1,16)**k for k,v in p.items())
            assert ceiling < 2**20
            taylor.append(ceiling/factorial(j))
            nxt=defaultdict(Q)
            for k,v in p.items():
                nxt[k]+=-2*c*v
                nxt[k+1]+=(exponent-3*j+2*k)*v
            p=nxt
        # log X = 2 log R - log(2) - log s. For j>0 the
        # j-th Taylor coefficient costs at most 2/j+majorant(log s)
        # after taking out Renv^j. The extra t1^-1 on the inner side
        # costs at most Renv, hence use the uniform Renv^(2j).
        coordinate=[Q(0)]+[Q(2,j)+log_s[j] for j in range(1,limit+1)]
        composite=compose(taylor,coordinate,limit)
        rows=[]
        for j in range(limit+1):
            q=factorial(j)*composite[j]
            assert 2*j<4096 and q>0
            rows.append({"order":j,"oneDimensionalCoefficientOnQuarter":str(taylor[j]*factorial(j)),
                         "exactPositiveComposedCoefficient":str(q),"extraPole":3*j,
                         "ordinaryLogRankAfterGeometry":q.__ceil__().bit_length()+1})
        out[side]=rows
    return out


def ordinary_requests(demand,core,cut,chi,radial):
    ranks={tuple(row["RZ"]):row for row in core["transfer"]["requests"]}
    directions=set()
    rows=[]
    for r,z,l in demand["directions"]:
        degree=r+z
        term_exponents=[]
        charges=[]
        total=0
        for ar,az in product(range(r+1),range(z+1)):
            for br,bz in product(range(r-ar+1),range(z-az+1)):
                cr,cz=r-ar-br,z-az-bz
                weight=comb(r,ar)*comb(z,az)*comb(r-ar,br)*comb(z-az,bz)
                total+=weight
                directions.add((cr,cz))
                invariant=ranks[br,bz]
                # Upper bound ordinary derivative of the normalized factors
                # while retaining the reciprocal half-Gaussian separately.
                finite=cut[ar+az]*chi[l]*weight
                charge=sum(invariant["logRanks"])+finite.__ceil__().bit_length()
                charges.append(charge)
                term_exponents.append(3*(ar+az)+Q(invariant["bandPower"])+3*(cr+cz))
        assert total==3**degree
        band=max(term_exponents)
        assert band<=Q(1,4)+3*degree
        reciprocal_rank=max(row["ordinaryLogRankAfterGeometry"] for side in radial.values()
                            for row in side[:degree+1])
        # For the fourth factor use the binomial sum at its true derivative
        # order. The selected-label velocity ratio and its slow Jacobian
        # cost at most 4^(2+j), and there are at most 162 source labels.
        extra=reciprocal_rank+degree+(162*4**(2+degree)).bit_length()
        rank=max(charges)+len(charges).bit_length()+extra
        assert Q(rank,2**128)+band/2**32636 < Q(1,2**112)
        rows.append({"RZL":[r,z,l],"factorAssignments":len(charges),
                     "leibnizCoefficientSum":total,"logRank":rank,
                     "bandAboveSigmaIntercept":str(band),"reciprocalGaussianPoleIncrement":3*degree})
    assert directions==set(ranks) and len(rows)==79
    return rows


def main(a):
    source(a)
    demand=json.loads(pin("demand",a.demand))
    core=json.loads(pin("core",a.goal/"c103/signed-high/signed-high.json"))
    bounds,chi,log_s=cutoff_series(a,6)
    radial=reciprocal_gaussians(6,log_s)
    rows=ordinary_requests(demand,core,bounds,chi,radial)
    result={"schema":"MathScope.C107.NativeSignedHighPhaseFreeCutoffTransfer/1",
            "status":"VERIFIED_SAME_SOURCE_GEOMETRY_CONDITIONAL_TWO_SIGMA_INPUTS",
            "pins":PINS,"rows":rows,"cutoffOrdinaryRanks":[x.__ceil__().bit_length() for x in bounds],
            "transverseRanks":[x.__ceil__().bit_length() for x in chi],
            "chartBandOffsetTaylorMajorants":[str(2*x) for x in log_s],
            "GaussianReciprocal":radial,
            "maximumNonSigmaLogOverH":"2^-112",
            "scope":"Keep the original rectangular auxiliary chart, fixed ratio/label, P(v) and psi(v). L acts only on chi(xi); the shell/auxiliary guard introduces piecewise support with the original flat endpoint realization.",
            "remaining":"Full ordinary high Sigma, the reciprocal smooth regular target, and the same original native smooth traces on the full radial paths.",
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original phase-free Signed cutoff through 79 directions; maximum rank",max(x["logRank"] for x in rows))


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("goal","runtime","demand","out"):
        p.add_argument("--"+name,type=Path,required=True)
    main(p.parse_args())
