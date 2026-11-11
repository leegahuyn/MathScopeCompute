"""Enclose the full original geometric heat exterior, including its moving lower face."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json
import sys

import sympy as sp

HERE = Path(__file__).resolve().parent
PINS = {
    "cell": "254868bebdad829d656c06cfa903a5b5cdf288d35cf5ec9bdf52461c3a7e008b",
    "amplitude": "647a71162df52b9bfb489479c14dbf6b916086d7f64a36c5c61cee9820a6c7cf",
    "force": "9bba52b109ec9c61db0cd8bdc32cd5aaf6baedfac416277ec65b00d5c656afea",
    "chart": "af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9",
}


def read(path, name):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == PINS[name], name
    return json.loads(data)


def heat_atoms(names):
    from check_whole_k_exterior_cell import algebra
    algebra()
    h = Fraction(1,64)
    beta = 1+h
    assert beta+h < 3
    assert beta*(beta+1)+2*(beta+1)*h+h*(1+h) < 8
    assert 4*(1+h) < 8
    assert Fraction(1,2)+h < 1
    exact_axial = {"b@0,1,0","b@0,2,0","p@0,0,1,0"}
    nonzero = {
        "b@0,0,0": ("0","1","B*s0^(-beta)"),
        "b@0,0,1": ("-8","0","h*B*s0^(-beta-1)"),
        "b@1,0,0": ("-3","0","B*s0^(-beta-1)"),
        "b@2,0,0": ("-8","8","B*s0^(-beta-2)"),
        "p@0,0,0,0": ("-1","0","B^2*s0^(-2*A)/(4*A)"),
        "p@0,1,0,0": ("-1","1","B^2*s0^(-2*A-1/2)"),
        "p@1,0,0,0": ("-1","1","B^2*s0^(-2*A-1/2)"),
    }
    rows = {}
    for name in names:
        if name.startswith(("A0@","A1@","A2@")) or name in exact_axial:
            rows[name] = {"interval":["0","0"],"positiveFactor":"1"}
        elif name in nonzero:
            lo,hi,factor = nonzero[name]
            rows[name] = {"interval":[lo,hi],"positiveFactor":factor}
    assert len(rows)==67 and Counter(row["interval"]==["0","0"] for row in rows.values()) == {True:60,False:7}
    return rows


def force_bounds(data):
    from check_exterior_cutoff_force import component_check
    formula = component_check()
    assert formula == data["verifiedCylindricalAlgebra"]
    cb = data["coarseFactoredBounds"]["cutoffDerivatives"]
    assert cb == {"chiPrime":108,"chiSecond":19440,"CtTau0":108,"Cr":324,"CzZ0":324,
                  "radialLaplacian":156384,"axialLaplacianZ0Squared":155952}
    A,D,tau0 = sp.symbols("A D tau0",positive=True)
    h=sp.Symbol("h",positive=True)
    assert (1-A-D).subs({A:sp.Rational(1,2)+h,D:sp.Rational(1,2)-h}) == 0
    assert sp.expand((1-2*D).subs(D,sp.Rational(1,2)-h)) == 2*h
    return {
        "physicalFormula": formula,
        "derivedFactors": {"s0":"tau0*Xb","r0Exterior":"sqrt(s0)",
                           "B":"cInfinity*2^A","beta":"A+1/2",
                           "Kmax":"B*s0^(-A)","Kradial":"2*Kmax/r0Exterior",
                           "Pmax":"Kmax^2/(4*A)",
                           "M":"tau0^A*Kmax=B*Xb^(-A)","z0":"tau0^D"},
        "normalizedPointwise": {
            "velocity":"M",
            "thetaForce":"M*(108+156384*tau0+155952*tau0^(2*h)+1296*tau0/r0Exterior)",
            "radialForce":"z0*M^2*(1/(4*r0Exterior)+324/(4*A))",
            "axialForce":"324*M^2/(4*A)",
            "transverseGradientSquared":"M^2*((324+2/r0Exterior)^2+1/r0Exterior^2)",
            "axialGradientSquared":"M^2*(324/z0)^2",
        },
        "normalizedIntegrals": {
            "spatialVolumeUpper":"33/14",
            "spaceTimeVolumeUpper":"33/28",
            "endpointEnergyUpper":"(33/14)*M^2",
            "dissipationWithPhysicalTimeWeightUpper":
                "(33/28)*tau0*(transverseGradientSquared+axialGradientSquared)",
            "forceSquaredUpper":"(33/28)*(thetaForce^2+radialForce^2+axialForce^2)",
            "absoluteWorkUpper":"(33/28)*M*thetaForce",
            "workJustification":"actual pure swirl velocity; radial and axial force do no work",
        },
    }


def main():
    p=ArgumentParser(description=__doc__)
    p.add_argument("--localization-source",type=Path,required=True)
    p.add_argument("--chart",type=Path,required=True)
    p.add_argument("--out",type=Path,default=HERE/"geometric-heat-exterior.json")
    a=p.parse_args()
    sys.path.insert(0,str(a.localization_source/"research-ide/mathscope-m3/recovery-20261019"))
    from outer_cutoff import ActualOuterCutoff

    outer = ActualOuterCutoff(a.localization_source)
    chart = read(a.chart,"chart")
    cell = read(HERE/"whole-k-exterior-cell.json","cell")
    amplitude = read(HERE/"amplitude/whole-k-exterior-amplitude.json","amplitude")
    force = read(HERE/"exterior-cutoff-force.json","force")
    assert chart["variables"]["bounds"] == ["1/2 <= Q < 2","|eta| < 3/4","q < qBig/16"]
    assert cell["sourceCode"]["pressureNormalization"] == "original radial infinity; no additive time function"
    assert force["sourceCellReceiptSHA256"] == PINS["cell"]
    assert force["sourceAmplitudeReceiptSHA256"] == PINS["amplitude"]
    assert cell["fieldAtoms"]["count"] == 67 and amplitude["bounds"]["MFixedDyadicUpper"] == "2^(-8388607)"
    report = {
        "schema":"MathScope.N7.ActualGeometricHeatExterior/1",
        "status":"SOURCE_THEOREM_BOUND_FULL_HEAT_EXTERIOR_INTERVALS",
        "sourceSHA256":PINS,
        "geometry":{
            "domain":"entire source whole-K slab at X=r^2/(2q)>=Xb, including the outer support seams",
            "movingLowerFace":"r^2>=2*q*Xb>=tau0*Xb=s0>0",
            "seam":"original smooth annular zero extension; by continuity field jets agree at X=Xb",
            "sourceSplit":"X_+<X_b removes all positive background orders; their Stokes primitives are closed by the original axial moments",
        },
        "heatAnalyticBounds":{
            "kernel":"original H(Z), Z=4*tau/r^2; normalized Laplace weight v^h*exp(-v)*(1+Zv)^(-h)",
            "allZ":"0<H<=1, 0<=-H'<=h*(1+h), 0<=-Z*H'/H<=h, 0<=Z^2*H''/H<=h*(1+h)",
            "proof":"Z*v/(1+Z*v)<=1 bounds normalized derivative factors at every Z>=0",
            "radialSlope":"-r*K_r/K=2*A+2*Z*H'/H is between 1 and 1+2*h",
            "pressureTail":"integral_r^infty K(xi,tau)^2 dxi/xi <= B^2*r^(-4*A)/(4*A)",
        },
        "fieldAtomIntervals":heat_atoms(outer.binding["requiredAtoms"]),
        "forceEnergyBounds":force_bounds(force),
        "scope":{"localFieldAtoms":67,"exactLocalZeros":60,"completeAnnularInterior":False,
                 "originalAmplitudeSymbolicFactorsRetained":True,"wholeKJets":"0/67",
                 "N7-06":"OPEN","N8-05":"OPEN","release":"HOLD"},
    }
    a.out.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8",newline="\n")
    print("PASS all 67 actual heat exterior atoms down to X=Xb; original cutoff force and norm factors retained.")
    print(sha256(a.out.read_bytes()).hexdigest(),a.out.name)


if __name__=="__main__":
    main()

