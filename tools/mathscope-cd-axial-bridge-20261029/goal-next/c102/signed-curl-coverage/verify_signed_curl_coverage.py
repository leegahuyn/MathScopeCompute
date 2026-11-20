"""Enumerate ordinary pressure and axial Haar curl demands of the original Signed stage."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


PINS={
 "curl":"3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd",
 "operators":"339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20",
 "frontier":"8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942",
 "variation":"c3ec1fb8ea1bf30ec18c09111440099e921a26c3417d5a47e083e5aa6e85dc37",
}
COMPONENTS={"rr":"rr","rz":"rz","rtheta":"ra","thetatheta":"aa","thetaz":"az","zz":"zz"}
# Only the phase-free derivative shifts, since all leading carrier terms
# are products without a derivative of C. R,Z,L are ORIGINAL directions.
REAL=[(0,0,0)]
CURL={"r":[(0,1,0)],"a":[(0,1,0),(1,0,0),(0,0,1)],"z":[(1,0,0),(0,0,1),(0,0,0)]}


def pin(path,name):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[name],path
    return raw


def add(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def pair_demand(frontier,known):
    rows=[]
    misses=set()
    cases=0
    for field,orders in sorted(frontier.items()):
        left,right=COMPONENTS[field]
        for r,z,t in orders:
            assert t==0
            local=set()
            moved={"radial":0,"torus":0}
            for i in range(r+1):
                for j in range(z+1):
                    for options in [(REAL,REAL),(CURL[left],CURL[right])]:
                        for left_shift in options[0]:
                            for right_shift in options[1]:
                                pot=[add(left_shift,(i,j,0)),add(right_shift,(r-i,z-j,0))]
                                cases+=1
                                for k in (0,1):
                                    # The C99 continuous centered two-primitive radial kernel
                                    # is used ONLY for the top Wrz,Z4 term.
                                    if pot[k]==(1,4,0):
                                        assert field=="rz" and (r,z)==(0,4)
                                        pot[k]=(0,4,0)
                                        pot[1-k]=add(pot[1-k],(1,0,0))
                                        moved["radial"]+=1
                                    if pot[k] in ((0,3,1),(0,4,1)):
                                        # Haar derivative moves onto the other retained factor.
                                        pot[k]=(0,pot[k][1],0)
                                        pot[1-k]=add(pot[1-k],(0,0,1))
                                        moved["torus"]+=1
                                local.update(pot)
            missing=sorted(local-known)
            misses.update(missing)
            rows.append({"nativeCovarianceComponent":field,"ordinaryRZ":[r,z],
                         "sufficientGaugeDirectionsRZL":sorted(local),"remainingDirections":missing,
                         "movingDerivativeCases":moved})
    return rows,sorted(misses),cases


def simple_torus_control():
    # A normalized period 2*pi for the test yields L(e^(iny))=in e^(iny).
    # cos y has coefficients 1/2. The product of the imaginary coefficients
    # on modes n and -n gives +n^2/4. Use Ctheta=cos y (1+Z^3/6).
    derivative_cube=2*sum(Fraction(n*n,4) for n in (-1,1))
    after_ibp=-2*sum(Fraction(-n*n,4) for n in (-1,1))
    assert derivative_cube==after_ibp==1
    return str(derivative_cube)


def main(a):
    curl=pin(a.curl,"curl").decode()
    operators=pin(a.operators,"operators").decode()
    assert "remainder=[G.neg(Dz[1]),G.sub(Dz[0],Dr[2]),G.add(Dr[1],G.div(X[1],R))]" in curl
    assert "Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))" in operators
    assert "Dz=x=>G.mul(epsilon,G.derivative(x,Z))" in operators
    prior=json.loads(pin(a.variation,"variation"))
    prior_slots={tuple(row["RZL"]) for row in prior["rows"]}
    assert len(prior_slots)==23
    known=prior_slots|{(0,4,0),(0,5,0)}
    frontier=json.loads(pin(a.frontier,"frontier"))["numericalFrontier"]["forcedCovarianceSupremumOrders"]
    rows,misses,cases=pair_demand(frontier,known)
    assert misses==[(0,0,2)],misses
    remaining_fields=sorted({row["nativeCovarianceComponent"] for row in rows if row["remainingDirections"]})
    assert remaining_fields==["thetatheta","thetaz","zz"],remaining_fields
    result={"schema":"MathScope.C102.OriginalSignedOrdinaryCovarianceCoverage/1",
            "status":"VERIFIED_PAIRED_GAUGE_DEMAND_CENSUS_OPEN_ORIGINAL_PURE_L2",
            "pins":PINS,"sourceRoles":rows,"exactPairCases":cases,
            "remainingPhaseFreeGaugeDirectionsRZL":misses,"remainingCovarianceComponents":remaining_fields,
            "nonzeroTorusL2DiagnosticWithoutPhysicalConstants":simple_torus_control(),
            "scope":"The original Coulomb potentials, common phase and normalized Haar pairs are retained. "
                    "Haar moves the high L derivative onto the lower factor; the C99 radial pressure kernel "
                    "moves only the exceptional RZ4 derivative. Geometric coefficient derivatives use the "
                    "prior finite original frame bounds. The sufficient uncovered direction is not a claim "
                    "that the individual actual original amplitude is nonzero.",
            "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS",cases,"original curl-pair combinatorial rows; remaining native pure transverse L^2")


if __name__=="__main__":
    assert __debug__
    cli=ArgumentParser(description=__doc__)
    for item in (*PINS,"out"):
        cli.add_argument("--"+item,type=Path,required=True)
    main(cli.parse_args())
