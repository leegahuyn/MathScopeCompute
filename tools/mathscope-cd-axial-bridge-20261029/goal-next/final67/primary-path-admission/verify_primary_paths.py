"""Authenticate the original Primary arguments and replay rational controls."""

import json
import subprocess
import sys
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path


assert __debug__
if len(sys.argv) != 3:
    raise SystemExit("Usage: verify_primary_paths.py GOAL_NEXT WORK")
GOAL, WORK = (Path(p).resolve() for p in sys.argv[1:])
CHECKOUT = GOAL.parents[2]
SOURCE = WORK / "continuation27/original-primary-degree-runtime"
COMMIT = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"


def digest(blob):
    return sha256(blob).hexdigest()


def original(part, filename, expected, fragments):
    relative = f"research-ide/mathscope-{part}/navier/{filename}.mjs"
    blob = (SOURCE / relative).read_bytes()
    assert digest(blob) == expected, relative
    committed = subprocess.check_output([
        "git", "-c", f"safe.directory={CHECKOUT.as_posix()}", "-C", str(CHECKOUT),
        "show", f"{COMMIT}:{relative}",
    ])
    assert blob == committed, relative
    source = blob.decode()
    for fragment in fragments:
        assert fragment in source, (relative, fragment)
    return relative, expected


def receipt(base, relative, expected):
    blob = (base / relative).read_bytes()
    assert digest(blob) == expected, relative
    return json.loads(blob)


def main():
    source = dict([
        original("m3", "source-global-band", "babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60", [
            "parameters:[Z,T],body:chartBody,left:q(1,2),right:q(2)",
            "X=G.div(G.pow(R,2),G.mul(q(2),s)),eta=G.div(Z,power(s,D)),qActual=G.mul(Q,s)",
            "F0=atRep(leadingFields.F),FR0=atRep(G.derivative(leadingFields.F,R)),GR0=atRep(G.derivative(leadingFields.G,R))",
            "parameters=[R,Z,T,Xrep,etaRep,sRep,ell]",
            "for(const sign of [1,-1])",
            "phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))",
            "G.div(Ls,q(2)),v),P=G.exp(logP)",
            "variable:v,parameters,matrix:frame.wMatrix,normUpper:matrixNorm,length:Ls",
            "transverseMass=G.integral(G.pow(chi,2),xi,G.neg(r0),r0)",
            "t[0],t[1]),v,G.zero,Ls)",
            "t[0],t[2]),v,G.zero,Ls)",
            "G.pow(t[0],2)),v,G.zero,Ls)",
            "G.mul(fields.b,frame.n[0])",
        ]),
        original("m3", "source-global-representative", "f3fbcf74b42c59cbfdd563e0fddcba9fab5cad782a96695930e3445c50373541", [
            "scale=G.pow(ell,6),width=G.div(q(3,4),scale)",
            "sLower=O.maximum(q(1,2),O.div(O.pow(radialLowerPositive,2),O.mul(q(2),Xb)))",
            "sUpperRaw=min(q(2),O.div(O.pow(Ru,2),O.mul(q(2),Xa)))",
            "negativeMidpoint=mid(...negativeInterval)",
            "T=mid(...selectedTimeInterval)",
            "R=O.div(O.add(lower,upper),q(2))",
            "sameBoxDistance:",
        ]),
        original("m3", "source-global-current", "93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760", [
            "if(auxiliary){add(v,G.zero,geometry.Ls,'auxiliary longitudinal');add(xi,G.neg(geometry.r0),geometry.r0,'auxiliary transverse');}",
            "add(geometry.X,geometry.Xa,geometry.Xb,'original open stress shell')",
            "atRepresentative=body=>G.simultaneousSubstitute(body,[Xrep,etaRep,sRep]",
            "G.integral(G.integral(body,xi,G.neg(geometry.r0),geometry.r0),v,G.zero,geometry.Ls)",
            "fixed=atRepresentative(outer.body)",
            "candidateGuardRunsBeforeLocalMonotoneRoot:true",
            "radialRule:'Integrate the entire smooth indexed operation",
            "fullOriginalStress=[background.normalizedBodies.Ttheta,background.normalizedBodies.Tz]",
        ]),
        original("m3", "source-primary-class-majorants", "40b3f1220b7ad1b9b05a11ae1378c864351e77e8efe7134ae1b78921fbab47ea", [
            "amplitudeAndTarget:order+1,background:order+3",
            "homogeneousPressure=dot(G,f.frame.pressureImaginaryRow,old.weightedAmplitude)",
            "sourceStage:'COMPLETE_81_BOX_TWO_SIGN_GLOBAL_HAAR_COVARIANCE'",
            "completePreHaarCommonYCovarianceClassSupplied:false",
            "representative, ell, mesh labels and rounded carriers are frozen before differentiation",
        ]),
        original("m2", "actual-common-admissible-family", "7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75", [
            "Same-box chart paths, full leading C2, and error<=C2*epsilon^2",
        ]),
        original("m2", "actual-covariance-source-certificate", "c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681", [
            "ratio=G.div(g.Q,Q),slow=[G.mul(R,G.sqrt(ratio)),G.mul(Z,power(ratio,c.D)),G.mul(T,ratio)]",
        ]),
        original("m2", "actual-covariance-matrix", "7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26", [
            "const names=['F','FR','GR','R','epsilon','k','p','pz','x0','v','Ls','u','c0','lambda0','HR','HZ']",
        ]),
        original("m2", "actual-pulse-jet-source", "dfdec0ab6ae752080bc919822b917a2e8720ccaa889d35d524318211be01739d", [
            "const {variable,length,parameters}=options",
            "G.integral(integrand,integrationVariable,G.zero,length)",
            "parameters:[...parameters],valueAtZero,timeDerivative",
        ]),
        original("m2", "actual-continuation-exact-support", "0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98", [
            "Xa=4/Lambda with Lambda>=2^16640",
            "actualXR:same(p.XR,{product:[{integer:110}",
            "terminal:r.Xb===G.mul(XR,G.exp(last.end))",
            "r.Xkeep===G.mul(Xa,G.exp(G.div(t1,q(64))))",
        ]),
        original("m2", "actual-covariance-ell-one-obstruction", "305fb60d757d6e4b1963bb6be73a73e25ab14c04c6a6a23aaa74b99ee48eb96f", [
            "Pstar=exp(2T), C=exp(logCSelected), XR=110*(C*Pstar)^10",
            "logCSelected>=Qsource^200",
        ]),
    ])
    cover_hash = "143d32b523429323eb3efc8ef8ea9c8f8922162bd919712cfe41580103a788be"
    scale_hash = "5a6ecee45d797d582e3218c36f980d5eb131619c860cec1bfb4d57aea89cdf56"
    slab_hash = "f756d88c734373cd5a7a34684a5b1edac272298774c60d27667fc8473a1833f9"
    frozen_hash = "a4cbadff8f11caf2b75a5933b49457cc4260307fe2ad712a5c9eadbe8e7f776e"
    cover = receipt(GOAL, "whole-k-atlas/primary-reference-cover.json", cover_hash)
    scale = receipt(GOAL, "whole-k-selector-scales/fourth/fourth-selector-maxima.json", scale_hash)
    slab = receipt(WORK, "continuation72/live-background-c10/positive-c10-directed.json", slab_hash)
    frozen = receipt(WORK, "continuation72/frozen-n4-high/final/frozen-high-bridge.json", frozen_hash)
    assert cover["scaleReceiptSHA256"] == frozen["selectorSHA256"] == scale_hash
    assert scale["exactRatios"] == dict(zip((f"b{i}*qBig" for i in range(1, 5)), [1, 16, 32, 64]))
    assert [(row["prefix"], row["literalCommonPrefixRecords"]) for row in cover["rows"]] == [(3, 127241), (4, 4599551)]
    assert [row["n"] for row in slab["rows"]] == [1, 2, 3]
    assert frozen["scope"]["exceptionalFrozenN4Through10"] and not frozen["scope"]["allOperatorPaths"]

    # On the physical slab t-C lies in (14,16], and |t-ell'|<3/4.
    labels = [n for n in range(11, 20) if Q(14)-Q(3, 4)<n<Q(16)+Q(3, 4)]
    assert labels == [14, 15, 16]
    scales = [Q(2) ** (15 - n) for n in labels]
    assert scales == [2, 1, Q(1, 2)]
    assert Q(9, 16) ** 4 < Q(1, 8) and Q(7, 4) ** 4 > 8
    sqrt_two_upper = Q(3, 2)
    assert sqrt_two_upper**2 > 2
    assert 2 * sqrt_two_upper * Q(3, 2) * 2 + Q(3, 2) < 12
    delta = Q(24, 22 ** 6)
    assert delta < Q(1, 16) and 3 * delta < Q(9, 16)
    assert (Q(9, 16) + delta) / (Q(9, 16) - delta) < 2
    assert 1 - 2 * delta > Q(1, 2)
    assert 1 - Q(54, 22 ** 6) > Q(1, 2)
    assert all(2 * n * Q(1, 64) * 2 < 1 for n in range(1, 4))

    # Rational controls for the genuine interior cell at the N4 lower face.
    # The symbolic proof applies to every permitted actual L and h.
    xa_upper = Q(4, 2 ** 16640)
    assert 2 * xa_upper < Q(1, 3)
    for label in (22, 4096, 65537):
        w = Q(3, 4 * label ** 6)
        assert (1+w)**2 < 110 and (1-w)**2 > 4 * xa_upper
        assert Q(1, 2) < 1-w and 2 - w**2/2 > 1+w
        assert w**2 < Q(1, 2) and 0 < w/2 < w
        assert 0 < w**2/4 < w
        smid = 1 - w**2/8
        assert Q(1, 2) < smid < 1
        assert 1/(2*smid) > Q(1, 2)

    result = {
        "schema": "MathScope.N7.OriginalPrimaryFixedLabelPathAdmission/1",
        "status": "VERIFIED_FIXED_LABEL_GEOMETRY_CONDITIONAL_POINTWISE_CLASS_TRANSPORT",
        "originalCommit": COMMIT,
        "sourceSHA256": source,
        "inputSHA256": {"cover": cover_hash, "selector": scale_hash, "liveC10": slab_hash, "frozenC10": frozen_hash},
        "originalGeometry": {
            "physicalQ": "tau0/2 <= q < 2 tau0, tau0=qBig/32",
            "activeOwnLabelOffsets": labels,
            "activeOwnQOverTau0": [str(x) for x in scales],
            "representativeQ": "tau0/4 < Q' srep < 4 tau0",
            "chart": "1/2 <= s <= 2, Xa/2 <= X <= 2 Xb, |eta| <= 1; T=0 one-sided",
            "slowSegment": "Same original mesh, |s_theta-s_live|<24/(ell')^6, tau0/4<q_theta<4 tau0; original first omitted tail remains flat",
            "referenceSubstitution": "r=Qref/Q'; (R',Z',T',s')=(sqrt(r)R,r^D Z,rT,rs), preserving q,X,eta",
        },
        "actualPrimaryArguments": {
            "carrierSigns": [1, -1],
            "live": ["F", "G", "R", "D_R F", "D_R G", "D_R H", "D_Z H", "D_T H"],
            "frozenCarrierBackground": ["leading F", "D_R leading F", "D_R leading G"],
            "frozenCfullUse": "The separate C10 envelope also covers the full background at the admitted endpoints conditional on its previous analytic bounds. It is sufficient; the band graph itself passes only leading fields to the frozen carrier.",
            "slowComparison": "Leading C2 along the slow path and pointwise completed-minus-leading at the live endpoint",
            "pulse": "Original logP, fixed-parameter Volterra/its coefficient FTC, H columns and mass keep R,Z,T,representative,ell fixed and move only v in [0,Ls]",
            "transverse": "Original chi and local guarded auxiliary Haar traverse xi in [-r0,r0]; no induced slow displacement",
            "indexedHaar": "Both source carrier signs, every active one of the 81 original candidates and all six full angular/Haar covariance components; the background geometry survives guarded radial reindexing since q is fixed at fixed Z,T",
            "classOutputs": ["local weighted amplitude", "potential", "homogeneous pressure", "curl remainder", "full and remainder angular covariance", "complete corresponding auxiliary Haar coefficients"],
        },
        "straightPathControl": {
            "label": "L=ellMinimum+16, grid=(L^6,0,L^6), w=3/(4 L^6)",
            "live": "(1,w/2,1-w^2/4), s=1",
            "actualRepresentative": "(1,-w/2,1), srep>1",
            "midpoint": "(1,0,1-w^2/8), b4 qmid=smid=1-w^2/8<1, Xmid>1/2>Xkeep",
            "conclusion": "Endpoint flatness cannot be used for the whole fourth cutoff along a straight slow path. This controls the inference about the cutoff and does not decide the value of the fourth profile at the midpoint.",
        },
        "open": [
            "Native high-order K seal and all independently required analytic/source estimates",
            "Pre-Haar common-Y two-column composition derivative estimates and actual shifted Forced operator/pressure/radial inverse dependencies",
            "Any proposed full-positive-sum FTC on a displaced path below q=tau0/2 and outside the exceptional raw branch",
            "Complete current pressure, Sigma, positive stress and later signed or spatial operator bounds",
        ],
        "finalJets": "0/67",
        "release": "HOLD",
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
