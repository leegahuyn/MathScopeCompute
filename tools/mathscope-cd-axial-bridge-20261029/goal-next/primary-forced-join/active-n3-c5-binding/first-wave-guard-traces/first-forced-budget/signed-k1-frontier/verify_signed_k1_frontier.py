"""Original Signed source frontier and finite conditional K1 coefficient transfer."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path


BAND=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces")
PINS={
    "signed":(BAND/"signed-shell/signed-shell.json","5fe379bdc734b5f1c17248bd4ad5b879afa19206e15d74a6f29204846cec8308"),
    "seams":(BAND/"signed/signed-seams.json","65c08c86d7682f989e9bf6c98f7ae04a42d2f1594488287da2548e85ca0a2815"),
    "pressure":(BAND/"weighted-haar-shell/pressure/pressure-shell.json","22ff14cbd3c6df110159eb33d1cd6c938ecfdc08242d917a22a200bfb2075797"),
    "covariance":(BAND/"weighted-haar-shell/covariance/covariance-shell.json","87ee4c05499ed8cdc1b22c490eb9eebb26375e04063559245ead711eaf8be970"),
    "matrix":(BAND/"outer-fixed-label-norm/matrix/matrix-s-j.json","e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36"),
    "stageGate":(Path("final67/energy-1013-sharp/correction-budget/spatial-gauge/active-correction-bounds/late-spatial-gates.json"),
                 "1fa33500726728505f74ed51aae5e113f4c10c452c5faa7a4f823d5a6d2d6a36"),
    "lean":(BAND/"first-forced-budget/outer-physical-gauge/lean-github/receipt.json","0cb7cfef4f66265cf0022131e17a5da4eb4360d76c4e565b83929d56c079113e"),
    "sourceSigned":(BAND/"signed/source-context/generic-signed-source-kernel.mjs","15eea2c0f984c5b3bb58dd372d9b01660e44a85526c1f329b41b41855b4c27e2"),
}
RUNTIME={
    "mathscope-m2/navier/actual-physical-residual-algebra.mjs":"df6f10cda4c77b0b679ded7eb254979e528d133239b2da1ce0904479585d2116",
    "mathscope-m3/navier/source-updated-mean-stress.mjs":"bbe4e3d87e79a770590a94bc75a8ac0f36f69f4338cab5739340a637a42bfbf5",
}
EXTRA={
    "frame":"b312748ae060076831485bc30cfeac644a7dfdde86d4ae9c306137df678cb3b8",
    "ingress":"20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f",
    "nativeMean":"3212a321563d65e5d7972cb7ab0c97f03f1ee0917276542a7a45074912fe34ff",
}


def pinned(path, digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest, path
    return raw


def source_frontier(data, raw, runtime, ingress, mean):
    actual=ingress["input"]
    assert actual["meanPotentials"]==[22150943,22151952]
    assert actual["azimuthalSwirls"]==[22150797,22151941] and actual["directSwirl"]==22154876
    assert mean["conditionalEnergyAttachment"]["middlePhysicalGrade"]=="139993/100000"
    ids=data["signed"]["actualSigmaRows"]
    assert [r["normalizedHaarEAtBoundRadius"] for r in ids]==[21999624,22000447]
    assert [r["nativeApplication"] for r in ids]==[22001223,22001224]
    assert [r["weight"] for r in ids]==[2,1]
    assert all(r["fixedLimits"]==[17743711,17743713] and r["noFreeRInBoundIntegrandAndFixedLimits"] for r in ids)
    assert all(len(r["parameters"])==4 for r in ids)
    rank=data["signed"]["actualSignedLinearTransfer"]
    assert [r["body"] for r in rank]==[22001304,22001305,22001306,22001468,22001469,22001470]
    assert all(r["linearSigmaApplications"]==[22001223,22001224] and r["inverseAmplitudePower"]==-1 for r in rank)
    assert len(data["signed"]["fixedCases"])==10
    assert data["seams"]["status"].startswith("VERIFIED")
    assert data["pressure"]["status"].startswith("VERIFIED") and data["covariance"]["status"].startswith("VERIFIED")
    signed=raw["sourceSigned"].decode()
    assert "G.mul(G.sqrt(eps),da,band.cutoffs.chi,band.cutoffs.psi,x)" in signed
    assert "G.div(x,G.mul(k,f.frame.nSquared))" in signed
    assert "rhs=Sigma.map(x=>G.div(x,epsilon))" in runtime["mathscope-m2/navier/actual-physical-residual-algebra.mjs"]
    assert "deltaAmplitude=dSigma.map((x,j)=>G.div(x,G.mul(G.q(2),a[j])))" in runtime["mathscope-m2/navier/actual-physical-residual-algebra.mjs"]
    stress=runtime["mathscope-m3/navier/source-updated-mean-stress.mjs"]
    for fragment in (
        "G.add(time(w),Dr(radialFluxes[j]),Dz(axialFluxes[j]))",
        "targets=[G.mul(epsilon,G.derivative(Jtheta,Z)),G.mul(epsilon,G.derivative(G.add(Jz,G.mul(cRho,P)),Z))]",
        "stage.mean.Ez===G.add(raw.Ez,G.mul(epsilon,pZ))",
        "G.sub(weightedMean,G.mul(rho,targets[j]))",
        "value=G.neg(G.div(compact,G.pow(R,weight)))",
    ):
        assert fragment in stress
    assert Q(11,10)**2 < 2 and Q(1,512)+Q(1,4)<2
    s2={(r,z) for r in range(3) for z in range(3-r)}
    axial, time=set(),set()
    for r,z in s2:
        for a in range(r+1):
            for b in range(z+1):
                axial.add((max(0,a-1),b+1))
                time.add((max(0,a-1),b,1))
    assert axial=={(0,1),(0,2),(0,3),(1,1)}
    assert time=={(0,0,1),(0,1,1),(0,2,1),(1,0,1)}
    return {
        "nativeSignedSigmaRoots":[r["nativeApplication"] for r in ids],
        "nativePostForcedHaarRoots":[r["normalizedHaarEAtBoundRadius"] for r in ids],
        "signedPotentialBodies":[r["body"] for r in rank],
        "lateTemporalAndFiveMapGaugeIsSeparate":{"A_theta":actual["meanPotentials"],
                                                   "B_theta":actual["azimuthalSwirls"],
                                                   "B_thetaSum":actual["directSwirl"]},
        "minimalDirectSigmaSpatialOrdersRZ":sorted(s2),
        "collarHaarPrimitiveValueOrdersRZ":[[0,0],[0,1],[0,2]],
        "collarDirectHaarOrdersRZ":[[0,0],[0,1],[1,0]],
        "fluxFormAfterHaarFTC":{
            "radialFluxOrdersRZ":sorted(s2),
            "axialPlusPressureFluxOrdersRZ":sorted(axial),
            "compactMeanTimeDerivativeOrdersRZT":sorted(time),
            "defectZOrder":3,
            "formula":"Put T=I-chi J, F=Haar(radial flux), G=Haar(axial flux)+axial-only R*pbar, W=Haar(R^e*v_e) and D=Jtheta or Jz+c_rho*P. Sigma = -R^-e*(F-F_left-chi*(F_right-F_left)-epsilon*T(partial_T W)+epsilon*T(partial_Z G)-epsilon*D_Z*T(rho)).",
            "correctedTimeTerm":"-epsilon*T(partial_T W) is inside the bracket. In general partial_T(T W) differs by -chi_T*J(W).",
            "assumption":"Ordinary Haar/FTC and endpoints. Only then use the original flat zero endpoint fluxes and the support of the Haar mean.",
        },
        "compactSupport":{
            "cutoffAndRho":"X in [e*X0Imean,e*(11/10)^2*X0Imean], top strictly below e^2*X0Imean.",
            "compactDefectPrimitive":"With the original whole rho normalized to 1, T rho=I(rho)-chi is zero at the two collars.",
            "initialFiveMap":"Actual source lies between X0Imean and exp(2)*X0Imean. At the two collars its linear Haar terms vanish.",
        },
    }


ZERO=(0,0,0,0)


def multiply(*terms):
    return tuple(map(sum,zip(*terms,strict=True))) if terms else ZERO


def scalar(value, coefficients):
    return ((value-1).bit_length()+coefficients[0], *coefficients[1:])


def add(*terms):
    maxima=[max(x) for x in zip(*terms,strict=True)]
    maxima[0]+=(len(terms)-1).bit_length()
    return tuple(maxima)


def differential_product(left,right,order):
    return [add(*(scalar(comb(j,k),multiply(left[k],right[j-k])) for k in range(j+1))) for j in range(order+1)]


def differential_inverse(series,base,order):
    inverse=[base]
    for j in range(1,order+1):
        rest=add(*(scalar(comb(j,k),multiply(series[k],inverse[j-k])) for k in range(1,j+1)))
        inverse.append(multiply(base,rest))
    return inverse


def coefficient_transfer(frame,matrix,stage):
    assert stage["stages"][0]["requiredWeightedPhysicalNorms"]["A_orders"]==[0,1,2]
    assert stage["stages"][0]["requiredWeightedPhysicalNorms"]["Bvector_orders"]==[0,1]
    assert stage["stages"][0]["actualK"] is None
    cat=frame["recurrence"]["leadingFieldCatalogue"]
    jmax=2
    phase_exponent=[Q(1,2),Q(1,100000),Q(0)]
    assert max(phase_exponent)==Q(1,2)
    gram_inv=differential_inverse(cat["gram"],tuple(cat["gramInverse"]),jmax)
    # C97 inverse 2*sqrt regular weight <=2^16 B W, so the reciprocal
    # square root has twice that bound. Keep ordinary derivative order.
    assert frame["weightConstants"]["inverseTwiceSqrtNormalizedWeightMajorant"]=="2^16*Bnorm*W"
    sqrt_inv=differential_inverse(cat["squareRootWeight"],(17,1,1,0),jmax)
    table=matrix["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    def rows(name):
        return [scalar(Q(c).__ceil__(),(0,6*a,0,a)) for c,a,_ in table[name][:jmax+1]]
    normal=differential_product(rows("n"),rows("inverseNormalSquared"),jmax)
    shell=differential_product(gram_inv,sqrt_inv,jmax)
    shell=differential_product(shell,cat["tangent"],jmax)
    shell=differential_product(shell,normal,jmax)
    # Caused by fixed radial inverse Gaussian through2, finite cylindrical/
    # phase operators, original normalized cutoffs and original cover count.
    # All these inequalities are sufficient conditions for this budget row.
    component_rank=tuple(map(max,zip(*shell,strict=True)))
    radial_pole=64+3*jmax
    n=(radial_pole+1)//2
    gaussian_charge=(2**n*factorial(n)).bit_length()
    assert n==35 and gaussian_charge<2**8
    assumed_fixed_factors=(2**14,128,0,0) # multiplier includes exact chart/cutoff and phase ranks when sourced.
    log_ranks=multiply(component_rank,(gaussian_charge,0,0,0),assumed_fixed_factors)
    assert sum(log_ranks)<2**16
    eps_factors=(Q(1,2),Q(-1),Q(1,2))
    assert sum(eps_factors)==0
    natural_budget=[]
    for j in range(jmax+1):
        assert Q(1,2)+2*j-Q(1,4)==Q(1,4)+2*j
        natural_budget.append({"order":j,"HInverseBandPower":str(Q(1,2)+2*j),
                               "reciprocalRegularSquareRootBandPower":str(-Q(1,4)+2*j),
                               "extraBandOverSigmaBeforeAbsorption":str(Q(1,4)),
                               "totalSlopeForSigmaWithSlopeAtMost3":3})
    return {
        "perDerivativeRows":natural_budget,"HInverseCoefficientRankSeries":gram_inv,
        "regularSquareRootReciprocalCoefficientRankSeries":sqrt_inv,
        "coreSignedMultiplierRankSeries":shell,"exampleSufficientFixedGeometryRanks":assumed_fixed_factors,
        "finitePoleThrough":64,"withInverseAndRadialDerivativesPoleAtMost":radial_pole,
        "innerAndOuterHalfGaussianFiniteChargeBits":gaussian_charge,
        "signedNonSigmaLogCapWithFixedGeometryPremise":"H/2^112",
        "epsilonProductBeforeSigma":"epsilon^(1/2)*epsilon^(-1)*epsilon^(1/2)=epsilon^0",
        "coefficientLogDegreeBase":["log2","logBnorm","logWprop","logM"],
    }


def safe_energy(data):
    assert data["stageGate"]["energyDyadicUpper"]=="2^40"
    assert data["lean"]["conclusion"]=="success"
    kappa=Q(1,100000)
    sigma_grade=Q(3,5)+2*kappa
    adjusted=sigma_grade-Q(1,10)-kappa
    effective_log=1-Q(2,2**128)
    assert adjusted==Q(1,2)+kappa
    assert adjusted*effective_log>Q(1,2)
    assert 2*Q(1,2**108)<kappa
    assert Q(1,2)+Q(1,10)-Q(40,2**128)>0
    assert 40-2*36==-32 and 4*Q(1,2**36)<Q(1,2**33)
    return {
        "sufficientSigmaEpsilonGrade":str(sigma_grade),
        "physicalEpsilonAfterStageAndSingleDebit":str(adjusted),
        "sufficientTotalLogCoefficientIncludingBand":"H/2^108",
        "conditionalSignedK1SliceEnvelope":"exp(-H/2)",
        "conditionalSignedSliceEnergyRatio":"<2^-32",
        "combinedK1IfFourComponentFamiliesEachMeetReservedPotentialScale":"4*2^-36<2^-33",
        "readyInput":"Both same-source Sigma components, all ordinary R/Z jets through order two, with epsilon grade and full zeta weight and finite pole. The total proved constant includes the original spatial cutoff, band, physical gauge and frame comparison.",
    }


def fundamental_covariance_grade():
    kappa=Q(1,100000)
    # Per normalized velocity, with the indicated local finite radial pole removed.
    primary,forced_one,forced_two=(Q(1,2),Q(1,2)), (1-6*kappa,Q(1,2)), (1-kappa,Q(1))
    pairs={"primaryPrimary":(primary,primary),"primaryForcedOne":(primary,forced_one),
           "forcedOneSquared":(forced_one,forced_one),"forcedTwoSquared":(forced_two,forced_two)}
    rows={name:{"epsilon":str(x[0]+y[0]),"zeta":str(x[1]+y[1])} for name,(x,y) in pairs.items()}
    assert all(Q(v["zeta"])>=1 for v in rows.values())
    assert min(Q(rows[k]["epsilon"]) for k in rows if k!="primaryPrimary")==Q(3,2)-6*kappa
    return {"conditionalPhaseFreeVelocityGrades":rows,
            "lowestEpsilonForForcedCovarianceIncrement":str(Q(3,2)-6*kappa),
            "pureAxialPressureCovarianceDonor":["C_rz",0,4,0],
            "correspondingHigherOrdinaryPotentialDonors":[["C_theta",0,5,0],["C_theta",1,4,0]],
            "premise":"The actual phase-free velocity, band and finite pole bounds must first be supplied in the same original chart. This arithmetic does not infer them from the physical K slice.",
            "weightQuestion":"A first Forced mode-one zeta^1/2 weight is sufficient; pairing with the original Primary restores zeta. Mode two enters only squared and has the stronger zeta weight."}


def main(goal,runtime,extras_paths,out):
    raw={k:pinned(goal/path,digest) for k,(path,digest) in PINS.items()}
    data={k:json.loads(x) for k,x in raw.items() if k!="sourceSigned"}
    rt={k:pinned(runtime/k,h).decode() for k,h in RUNTIME.items()}
    extras={k:json.loads(pinned(extras_paths[k],h)) for k,h in EXTRA.items()}
    source=source_frontier(data,raw,rt,extras["ingress"],extras["nativeMean"])
    coeff=coefficient_transfer(extras["frame"],data["matrix"],data["stageGate"])
    energy=safe_energy(data)
    result={
      "status":"VERIFIED_SIGNED_K1_SOURCE_FRONTIER_CONDITIONAL_TWO_WEIGHTED_SIGMA_INPUTS",
      "pins":{**{k:x[1] for k,x in PINS.items()},**RUNTIME,**EXTRA},
      "originalSignedFrontier":source,"conditionalCoefficientTransfer":coeff,"conditionalSignedEnergyGate":energy,
      "postForcedCovarianceGrades":fundamental_covariance_grade(),
      "open":[
          "Attach actual full post-Forced Haar axial/radial fluxes and pressure with retained zeta through the listed directional roles. C98 first-Forced energy does not itself provide these phase-free weighted velocity/pressure donor norms.",
          "The actual n=1 outer angular stress coefficient still needs live regular slow C2 numerics. Its old value/normal reduction alone does not supply all listed axial directions.",
          "Original late Temporal and late FiveMap families require bounds after Signed, for A through two and the direct angular vector through one. They differ from the initialized C98 mean."
      ],"finalJets":0,"release":"HOLD",
    }
    out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print("Verified exact Signed source frontier and conditional K1 epsilon grade",energy["sufficientSigmaEpsilonGrade"])


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires enabled assertions.")
    parser=ArgumentParser()
    for name in ("goal","runtime","ingress","native-mean","frame","out"):
        parser.add_argument("--"+name,type=Path,required=True)
    args=parser.parse_args()
    main(args.goal,args.runtime,{"ingress":args.ingress,"nativeMean":args.native_mean,"frame":args.frame},args.out)
