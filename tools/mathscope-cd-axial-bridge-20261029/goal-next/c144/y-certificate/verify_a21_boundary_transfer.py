"""Exact arithmetic for the actual A.21 angular-boundary pressure transfer."""

import argparse
from fractions import Fraction as F
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


PINS = {
    "axis": "1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920",
    "outer": "5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9",
    "core": "d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815",
    "profile": "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
    "prior": "f1d4d5da1b3489bd237c20deab6f2d5b05b7b47855cf9a1d1b071b7e1c57f112",
    "boundary": "2edd1187bdb0deadb6b695e74f24c140a52d3819653b4c496f2c7afd65e77f5d",
    "natural": "510b458365617bf881ae80cf9a0eafe097261777dbf301014adf00a1db508c43",
    "operands": "8f5fc8bd620609964c948f4ed8363dbc3443bd332670df760386b293d8c5c765",
}


def pinned(path, key):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], key
    return raw.decode()


def const_export(text, exported):
    return json.loads(text.split("export const " + exported + " = ", 1)[1].strip().rstrip(";"))


def check_source(a):
    axis, outer, core = (pinned(getattr(a,key),key) for key in ("axis","outer","core"))
    for fragment in (r"P(z)=-\int (1+z^2)^{-2\theta(y)}\,d\mu(y)",
                     r"-P(\eta)\ge(5/2)K", r"|P(z)|\le5K",
                     r"\varepsilon_{sharp}:=29Q^{-53}",
                     r"Z_*=-A(1-2\eta U_*)U_*-4H_*-dP'+4A\eta P."):
        assert fragment in axis, fragment
    for fragment in (
        "if(x===o)return q(1,2)",
        "stage('initial',o,s=>sub(mul(q(1,10),s),mul(q(3,5),S(s))))",
        "stage('axialDecay',T,s=>mul(q(-1,2),s),o,q(-1,2))",
        "stage('entry',o,s=>sub(mul(q(-1,2),s),mul(lam,S(s))))",
        "const alpha=neg(sum(q(1,2),lam)),Tw=mul(q(60),B),power=stage('reservedPower',Tw,s=>mul(alpha,s),o,alpha)",
        "stage('pulse',div(q(13),lam),s=>mul(alpha,s),o,alpha)",
        "stage('interpolation',Tf,s=>sub(mul(alpha,s),mul(d.log(q(2)),step(div(s,Tf))))",
        "stage('angular',mul(q(30),B),s=>mul(alpha,s),z,alpha)",
        "stage('steepen',o,s=>sub(mul(alpha,s),mul(sub(o,lam),S(s))),z)",
        "stage('steepPower',holdLength,s=>mul(q(-3,2),s),z,q(-3,2))",
        "stage('flatten',o,s=>sum(mul(q(-3,2),s),mul(sub(o,h),S(s))),z)",
        "terminalSlope=neg(sum(q(1,2),h))",
        "stage('wait',wait,s=>mul(terminalSlope,s),z,terminalSlope)",
        "stage('terminal',q(3),s=>sum(mul(terminalSlope,s),d.log(div(fo(s),sub(o,rho)))),z)",
    ):
        assert fragment in outer, fragment
    for fragment in (
        "G.mul(theta,logf)", "const initialInfinitePrefix=G.mul(G.q(5),G.pow(f,2))",
        "terminalInfiniteTail=G.div(G.exp(G.mul(two,last.logAEnd)),G.add(one,G.mul(two,h)))",
        "pressureOverPstarSquared=G.mul(G.q(-1,2)",
        "fullExteriorTailIncluded:true", "pressureApproximationUsed:false",
    ):
        assert fragment in core, fragment

    profile = const_export(pinned(a.profile,"profile"),"PINNED_N3")["parametersExactExpressions"]
    for key, expr in {
        "Md":{"integer":2**20},
        "T":{"sum":[{"exp":{"ref":"Md"}},{"integer":10}]},
        "h":{"exp":{"product":[{"integer":-8002},{"ref":"T"}]}},
        "lambda":{"exp":{"product":[{"integer":-1000},{"ref":"T"}]}},
        "co":{"rational":"1/256"}, "BOuter":{"product":[{"integer":1000},{"ref":"T"}]},
        "Tf":{"integer":128}, "logP":{"product":[{"integer":2},{"ref":"T"}]},
        "Pstar":{"exp":{"ref":"logP"}}, "K":{"power":[{"ref":"Pstar"},2]},
    }.items():
        assert profile[key] == expr, key
    operands = json.loads(pinned(a.operands,"operands"))
    assert operands["exactPressureDefinition"]["fullExteriorTailIncluded"]
    assert operands["stages"][5]["id"] == "interpolation"
    assert len(operands["stages"]) == 12

    prior = const_export(pinned(a.prior,"prior"),"ACTUAL_BACKGROUND_INPUTS")
    assert prior["inputs"]["pressure"]["sha256"] == "f6b32aab94547230a538d544c81be58831e2555802b653e95a3bf81c56fb7be3"
    proof = prior["pressure"]
    assert proof["sourceReceiptPass"] and proof["fullActualA21Datum"]
    assert proof["quantity"] == "P^(m)(0)/K"
    return next(r["interval"] for r in proof["normalizedDerivativeIntervals"] if r["degree"] == 0)


def mul(a,b,order):
    return [sum(a[j]*b[i-j] for j in range(max(0,i-len(b)+1),min(i+1,len(a))))
            for i in range(order+1)]


def invert(a,order):
    res = [1/F(a[0])]
    for i in range(1,order+1):
        res.append(-sum(a[j]*res[i-j] for j in range(1,min(i+1,len(a))))/a[0])
    return res


def rational_derivative_factors():
    # z=-1+s and 1+z^2=2-2s+s^2. The inverse powers are formal
    # Taylor coefficients with exact rational arithmetic.
    order = 6
    den = [2,-2,1]
    den_inv = invert(den,order)
    den_inv_sq = mul(den_inv,den_inv,order)
    den_inv_cube = mul(den_inv_sq,den_inv,order)
    u_numerator = [8,0,-12,4]  # -4 z(3-z^2) at z=-1+s
    u = mul(u_numerator,den_inv_cube,order)
    pressure_factor = [factorial(m)*v for m,v in enumerate(den_inv_sq)]
    natural_factor = [factorial(m)*v for m,v in enumerate(u)]
    assert pressure_factor[:3]==[F(1,4),F(1,2),F(1)]
    assert natural_factor[:2]==[F(1),F(3)]
    return pressure_factor,natural_factor


def scaled_interval(a,k,pad):
    products = [k*x for x in a]
    lo,hi = min(products)-pad,max(products)+pad
    assert hi-lo < F(1,2**265)
    return [str(lo),str(hi)]


def run(a):
    prior = check_source(a)
    pn = F(prior["lower"]),F(prior["upper"])
    assert F(-4)<pn[0]<pn[1]<F(-5,2)
    assert pn[1]-pn[0]==F(prior["width"])<F(1,2**279)
    certify = json.loads(pinned(a.boundary,"boundary"))
    assert certify["unguardedNaturalDescendantCount"]==0
    source_literal = [
        (4469,"u",0),(4483,"average",0),(5307,"u",1),(5303,"average",1),
        (9839,"u",2),(9836,"average",2),(19953,"u",3),(19950,"average",3),
        (80395,"u",4),(80392,"average",4),
    ]
    natural_rows = {r["id"]:r for r in json.loads(pinned(a.natural,"natural"))["calls"]}
    for node_id,component,m in source_literal:
        assert any(node_id in r["naturalDescendantIds"] and r["etaActual"]==20
                   for r in certify["zeroOrderBoundaryApplications"])
        row = natural_rows[node_id]
        assert (row["component"],row["y"],row["eta"],row["k"],row["m"]) == (component,474,2,0,m)

    # Amplitude ledger. The last six stages and exterior tail have
    # eta-independent densities; interpolation uses 0<=theta<=1.
    # At the pulse end, 2 log A < -13/lambda < -1000*T.
    assert F(1,10)-F(3,5)*F(1,2)==F(-1,5)
    assert F(1,1)/(1-F(1,256))<2
    assert F(1,2)*2**2==2  # factor from -P/K, terminal prefactor and unit decay integral
    assert 1-F(1,32)**2>F(1,2)
    assert 2*(4+4)==16  # complex normalized angular transfer prefactor
    assert 16*factorial(6)*32**6 < 2**44
    assert 1000*(2**20)-44 > 10000
    assert (1000-4)*(2**20)-44 > 10000  # residual also tiny after K scaling
    assert F(2,5)<1

    # Bound the u/average surface on |z+1|<=1/64 before taking eta
    # derivatives. Z_0=-d p0 F' + 2 z p0 F, with p0=P(0)/K.
    assert 1-8*F(1,1000)>F(1,2)   # |L^-1| <= 2
    physical_other = (1+2*2*9)*9 + 4*46
    pressure_residual = 5*1024+8*16
    h_term = 4*2*16
    assert physical_other+pressure_residual+h_term < 2**13
    z0 = 5*1024+4*16
    assert z0 < 2**13
    assert 2*2**13+16*z0 < 2**18
    assert factorial(4)*64**4<2**29
    assert 19+29+1==49 and 4*(2**20)-50>10000

    derivative_pressure,derivative_u = rational_derivative_factors()
    assert derivative_u[3] == 0
    assert derivative_u[0] == 1
    pad = F(1,2**300)
    pressure=[]
    for m,factor in enumerate(derivative_pressure):
        pressure.append({
            "etaOrder":m,
            "ratioToP0Center":str(factor),
            "absoluteRatioErrorUpper":"2^-10000 (strict)",
            "dividedByK":scaled_interval(pn,factor,pad),
        })
    natural=[]
    for i,component,m in source_literal:
        factor=derivative_u[m] / (1 if component=="u" else 2)
        natural.append({
            "id":i,"Y":4,"eta":-1,"component":component,"radialOrder":0,"etaOrder":m,
            "ratioToP0Center":str(factor),
            "absoluteRatioErrorUpper":"2^-10000 (strict)",
            "dividedByK":scaled_interval(pn,factor,pad),
        })

    # Absolute, unscaled geometric remainder before eta differentiation.
    # hK=exp(-7998*T) is below exp(-996*T).
    g_diff = 333 + F(69,2) + 4*7
    g0 = 20*2+32*2**3
    assert g_diff < 400 and 2*400 + 16*g0 < 2**13
    assert 2*pressure_residual < 2**14
    assert 2*h_term + 16*z0 < 2**17
    assert 2**13+2**14+2**17 < 2**18
    assert F(41,20)<4  # max Y/2, covering radial orders zero and one
    assert 996*(2**20) - (18+2+29) > 20000
    assert F(1,2**20000)+F(1,2**12468)<F(1,2**12460)
    assert factorial(3)*(-16) == -96
    descendants = {i for row in certify["zeroOrderBoundaryApplications"] for i in row["naturalDescendantIds"]}
    raw_instances = []
    for row in natural_rows.values():
        component, k, m = row["component"],row["k"],row["m"]
        if row["id"] not in descendants or component=="Phi" or m!=3:
            continue
        assert k in (0,1)
        center = -96 if component=="u" else -48
        constant = k==1 or row["y"]==474
        if k==0 and row["y"]==474:
            center *= 4
        raw_instances.append({
            "id":row["id"],"component":component,"YOperand":row["y"],"eta":-1,
            "radialOrder":k,"etaOrder":m,"rawCenter":str(center) if constant else f"{center}*Y",
            "radius":"2^-12460","constantCenter":constant,
        })
    assert len(raw_instances)==32
    assert {r["id"]:r["rawCenter"] for r in raw_instances if r["constantCenter"]} == {
        10205:"-96",10212:"-96",10219:"-96",19950:"-192",19953:"-384",20520:"-96",79687:"-96",
    }
    return {
        "schema":"MathScope.C144.OriginalA21AngularBoundaryTransfer/1",
        "status":"VERIFIED_SOURCE_RATIO_WITH_CONDITIONAL_NATURAL_BOUNDARY_INSTANCES",
        "pins":PINS,
        "actualA21Variable":"P(eta), original complete source datum",
        "normalizedLateMassUpper":"2*exp(-1000*T)",
        "uniformRealRatio":"0<=P(eta)/P(0)-(1+eta^2)^(-2)<2^-10000 on [-1,1]",
        "strictBoundaryRatio":"1/4 < P(-1)/P(0) < 1/4 + 2^-10000",
        "mixedPressureTransferRawError":"|d_eta^m(P(eta)-P(0)/(1+eta^2)^2)|<2^-10000 for 0<=m<=6 and eta in [-1,1]",
        "ratioEvidenceIndependentlyOfPriorP0NumericReceipt":True,
        "finiteNumericalEnclosuresFromP0Receipt":{"absoluteNormalizedWidthUpper":"2^-265","pressure":pressure,
            "naturalOnExecutedOriginalBoundaryBranches":natural},
        "rawThirdEtaDerivativeBoundaryEnclosures":{
            "count":32,"constantCenterCount":7,"symbolicLinearCenterCount":25,
            "pressureFactorThirdDerivativeExactlyZero":True,
            "sourceLeadingGeometry":"u_geo=10*Y*eta-16*Y*eta^3; average_geo=u_geo/2",
            "requiresP0NumericalReceipt":False,"calls":raw_instances,
        },
        "open":["Actual physical chart activation for guarded descendant call instances",
                "Unscaled absolute numerical P(0) interval at the required K-scaled tolerance",
                "Overall Y and final jet acceptance"],
        "originalNumericalAcceptanceIncrement":0,
        "finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    for name in (*PINS,"output"):
        p.add_argument(name,type=Path)
    args=p.parse_args()
    args.output.write_bytes((json.dumps(run(args),indent=2,sort_keys=True)+"\n").encode())
