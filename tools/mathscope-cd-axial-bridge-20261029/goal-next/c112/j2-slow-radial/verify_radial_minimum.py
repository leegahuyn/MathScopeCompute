"""Locate a real active protected wave operand at the original physical shell."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import subprocess
import sys

from verify_active_slow_faces import DIGESTS, chart, pin


RUN_COMMIT="059df9db3a188ce18f3c43a0dca3a92f2e02a4b2"
SOURCE_PINS={
    "mathscope-m3/navier/source-global-band.mjs":
        "babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60",
    "mathscope-m2/navier/actual-common-admissible-family.mjs":
        "7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75",
    "mathscope-m2/navier/actual-global-source-expressions.mjs":
        "cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3",
}
PATH=(22004387,21668129,21441205,21436084,21436083,21436082,21436081,
      17735324,17735318,17735315,17735308,17735305,17735304,17735303,17735302,17733826)


def committed_source(repo):
    result={}
    for path,digest in SOURCE_PINS.items():
        body=subprocess.run(["git","-c",f"safe.directory={repo.as_posix()}","-C",str(repo),
                             "show",f"{RUN_COMMIT}:research-ide/{path}"],check=True,capture_output=True).stdout
        assert sha256(body).hexdigest()==digest,path
        result[path]=body
    band,family,evaluator=result.values()
    assert b"positiveWeightDomain:'Additionally Xa<X<Xb and ell>=the explicit ell0.'" in band
    assert b"squareRootWeights:weights.map(x=>G.sqrt(x))" in band
    assert b"sourceWeightOverZetaLower:family.uniformCovariance.positivity.weightOverZetaLower" in band
    assert b"weightOverZetaLower=G.div(G.mul(kappa,targetScaleOverZetaLower),G.mul(q(64),massUpper))" in family
    assert b"v=ev(x<=a?args[3]:x>=b?args[5]:args[4],env)" in evaluator


def witness(g,n,geom,pulse_result):
    defs={r["id"]:r for r in n.expressions}
    base=json.loads(n.base_snapshot["base"]["expression"])
    original_waves={r["chart"]:dict(r["reportedOwnersAndVerifiedProtectedBodyRoots"]) for r in pulse_result["charts"]}
    assert original_waves["0:1"]["coupled-expression:1363"]==PATH[0]
    typed=[]
    for i,next_i in zip(PATH[:-1],PATH[1:],strict=True):
        op,args=g.node(i)
        if op in ("add","multiply","inverse","smooth_piecewise"):
            assert next_i in args
        elif op in ("integer_power","sqrt_positive","source_step_derivative"):
            assert next_i==args[0]
        else:
            assert op in ("m3_coupled_expression_partial","actual_expression_partial")
            system,actual,orders=args
            d=defs[system] if op=="m3_coupled_expression_partial" else base[system]
            assert next_i==d["body"] and len(d["parameters"])==len(actual)==len(orders)
            typed.append({"id":i,"name":d["name"],"formal":d["parameters"],"actual":actual,"orders":orders})
    assert [x["name"] for x in typed]==["InitializedOriginalWave_0_1_0_imaginary","GlobalOriginalPotential_1_1"]
    last=typed[-1]
    assert last["id"]==21436081 and last["orders"]==[0,1]+[0]*10
    assert last["formal"][:3]==last["actual"][:3]==geom["RZT"]
    assert g.args(PATH[-1],"sqrt_positive")==[17733801]
    X=geom["X"]
    Xa,Xb=geom["shellThresholds"]
    assert g.node(Xa)==("source_parameter",["Xa"])
    assert g.node(12)==("source_parameter",["XR"])
    assert g.args(Xb,"multiply")==[12,28825] and g.args(28825,"exp")==[319]
    return {"chart":"0:1","mode":1,"slot":"radial velocity imaginary",
            "reportedNativeOwner":"coupled-expression:1363","protectedWaveBody":PATH[0],
            "nativePathToRadical":list(PATH),"nativeApplications":typed,
            "positiveTargetSquareRoot":PATH[-1],"targetRadicand":17733801,"shell":[X,Xa,Xb],
            "sourceShellThresholds":{"Xa":Xa,"Xb":Xb,"XbFactors":[12,28825],"sourceAdmission":"0<Xa<Xb"}}


def main():
    cli=ArgumentParser(description=__doc__)
    for arg in ("work","goal","previous","repo","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    args=cli.parse_args()
    committed_source(args.repo.resolve())
    scope=args.goal/"primary-forced-join/active-n3-c5-binding"
    reader=scope/"spatial-readback"
    cache_reader=scope/"live-wave-gauge/signed"
    algebra=args.goal/"first-force-repair"
    pin(args.previous/"verify_predecessor_cutoff_tails.py",DIGESTS["C110Script"])
    sys.path[:0]=[str(args.previous),str(reader),str(cache_reader),str(algebra)]
    from verify_predecessor_cutoff_tails import PINS, pinned
    pinned(reader/"source_stream.py","reader")
    pinned(cache_reader/"source_cache.py","cacheReader")
    pinned(algebra/"verify_repaired_first_force.py","exactAlgebra")
    import source_stream as st
    from source_cache import load
    from verify_repaired_first_force import Exact
    hosted=args.work/"continuation70/hosted-44582875351"
    directory=hosted/"first-correction-spatial-source"
    manifest=json.loads(pinned(directory/st.MANIFEST,"manifest"))
    terminal=json.loads((args.work/"continuation70/terminal-run-44582875351.json").read_bytes())
    assert terminal["databaseId"]==44582875351 and terminal["status"]=="completed" and terminal["conclusion"]=="success"
    assert terminal["headSha"]==manifest["executing_commit"]==RUN_COMMIT
    p=json.loads(pin(args.previous/"protected-wave-bodies.json",DIGESTS["C110ProtectedWaves"]))
    assert p["predecessor"]["streamSHA256"]==manifest["node_stream_sha256"]
    native=st.Native(directory,manifest)
    assert native.pin==PINS["registry"]
    g=load(st,directory,manifest,22153782,args.work/"continuation80/signed-wave/cache")
    def node(i):
        row=g.record(i)
        return row["op"],row["args"]
    g.node=node
    try:
        geo=chart(g,native,Exact(g))
        path=witness(g,native,geo,p)
    finally:
        g.__exit__(None,None,None)
    result={"schema":"MathScope.C112.ActiveProtectedRadialShellMinimum/1",
            "status":"VERIFIED_ACTIVE_SHELL_RADICAL_REACH_ORDINARY_EXTENSION_OPEN",
            "source":{"gitCommit":RUN_COMMIT,"nodes":manifest["node_count"],"sha256":manifest["node_stream_sha256"],
                      "registrySHA256":native.pin,"sourceModuleSHA256":SOURCE_PINS},
            "geometry":geo,"originalTraceWitness":path,
            "proofGap":"The source positive target lower is proportional to a Gaussian shell factor that tends to zero at both physical shell endpoints. It does not imply a positive edge margin for this uncut derivative, nor a numerical nonzero shell trace or an actual failure of the original sum.",
            "minimum":"At the admitted original label and fixed native pulse, require every one-sided interior aggregate supported derivative of needed finite orders to tend jointly to zero as X approaches Xa or Xb. Keep Z and T fixed to probe R approaching sqrt(2*s*Xe); uniform bounds on retained compact tangential/pulse sets suffice for the same ordinary zero extension.",
            "sufficient":"For d=min(1,log(X/Xa),log(Xb/X)), any bound C*d^(-p)*exp(-c/d^2) with c>0 on each exact aggregate derivative forces the required limit. The protected sqrt path alone does not establish such a bound; a cancellation proof for the aggregate is also admissible.",
            "activeExtraction":"The protected path is in the announced wave body. The active exact new graph must prove that its own raw source reaches the registered partial and preserve all other raw and subtraction terms; then analyze the actual aggregate on the two shell faces.",
            "shellTraceComputed":False,"stageTwoComplete":"OPEN","finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],"native potential",path["nativeApplications"][-1]["id"])


if __name__=="__main__":
    assert __debug__
    main()
