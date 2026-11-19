"""Bind one exact archived shell obligation without evaluating outside the open shell."""
from collections import deque
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


def read(path, expected):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==expected,path
    return json.loads(raw)


def bind_source_files(runtime):
    files={
      "mathscope-m3/navier/source-global-band.mjs":
        "babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60",
      "mathscope-m2/navier/actual-background-physical-seminorms.mjs":
        "d3713e0a3f1cd17404e2afb23da20c4b32e9e840445eed53ce2849ecd200d240",
      "mathscope-m2/navier/actual-common-admissible-family.mjs":
        "7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75",
    }
    for name,pin in files.items():
        raw=(runtime/name).read_bytes()
        assert sha256(raw).hexdigest()==pin
        if name.endswith("actual-background-physical-seminorms.mjs"):
            assert b"a=G.log(G.div(X,G.parameter('Xa'))),b=G.log(G.div(Xb,X))" in raw
            assert b"G.div(G.pow(G.parameter('t1'),2),G.pow(a,2)),G.div(q(4),G.pow(b,2))" in raw
        elif name.endswith("source-global-band.mjs"):
            assert b"positiveWeightDomain:'Additionally Xa<X<Xb and ell>=the explicit ell0.'" in raw
            assert b"squareRootWeights:weights.map(x=>G.sqrt(x))" in raw
            assert b"sourceWeightOverZetaLower:family.uniformCovariance.positivity.weightOverZetaLower" in raw
        else:
            assert b"weightOverZetaLower=G.div(G.mul(kappa,targetScaleOverZetaLower),G.mul(q(64),massUpper))" in raw
    return files


def reach_potential(graph, root, expression_definitions):
    pending=deque([root])
    ancestor={root:None}
    while pending:
        current=pending.popleft()
        op,args=graph.node(current)
        children=list(graph.children(op,args))
        if op in expression_definitions:
            system,actual,orders=args
            definition=expression_definitions[op][system]
            if (definition["name"].startswith("GlobalOriginalPotential_1_")
                and any(orders)):
                path=[]
                vertex=current
                while vertex is not None:
                    path.append(vertex)
                    vertex=ancestor[vertex]
                return list(reversed(path)),current,definition,actual,orders
            children.append(definition["body"])
        for index in children:
            if index not in ancestor:
                ancestor[index]=current
                pending.append(index)
    raise AssertionError("selected body must reach an actual potential derivative")


def main():
    goal,bundle,runtime,output=map(Path,sys.argv[1:])
    repair=goal/"first-force-repair"
    sys.path.insert(0,str(repair))
    from check_repeat_forced_candidates import Graph, STREAM, Exact, read_guards

    pins={
      "archive":"43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf",
      "registry":"5d8a751e5ad4b5d2bd4efa5a1f285dc465b0a5b19b3e0bbf8113f160bb582920",
      "sevenGuards":"722f8227d71d18041b62449d10e957ce237625ab791c50b84d2ebedb754273d1",
      "rawWaveIdeal":"ba6298855c23f7e044e0a817ad244ecab7b44ffefefe786bf2909f4f0e060634",
    }
    archive=read(bundle/"post-five-repeat-forced-candidate.json",pins["archive"])
    registry=read(bundle/"original-source-functions.json",pins["registry"])
    guards=read(goal/"corrected-flat/seven-guards-receipt.json",pins["sevenGuards"])
    ideal=read(repair/"actual-raw-support-ideal.json",pins["rawWaveIdeal"])
    pins.update(bind_source_files(runtime))
    assert archive["snapshot"]["node_stream_sha256"]==ideal["graphSHA256"]
    assert archive["snapshot"]["node_count"]==4682006
    defs={
      "actual_expression_partial":dict(enumerate(json.loads(registry["base"]["base"]["expression"]))),
      "m3_aux_expression_partial":dict(enumerate(json.loads(registry["base"]["expressionDefinitions"]))),
      "m3_coupled_expression_partial":{row["id"]:row for row in json.loads(registry["definitions"])[0]},
    }
    case=next(x for x in archive["templates"] if x["key"]=="0:1")
    original=next(r for r in case["rows"] if r["m"]==1)
    expected=next(r["sourceGuards"] for r in guards["sourceCases"] if r["key"]=="0:1")
    assert expected[4]==[622824,3617,28826]
    raw,supported,guarded=(original[x][0]["real"] for x in ("raw","supported","guarded"))
    assert (raw,supported,guarded)==(4468468,4468558,4468682)
    with TemporaryFile() as file:
        graph=Graph(bundle/STREAM,file,archive["snapshot"])
        a=Exact(graph)
        assert read_guards(graph,guarded,supported,expected)==7
        current=guarded
        lazy_shell=None
        for _ in range(7):
            x,lo,hi,left,inside,right=graph.args(current,"smooth_piecewise")
            if [x,lo,hi]==expected[4]:
                lazy_shell={"node":current,"zeroBranches":[left,right],"interior":inside,"operands":[x,lo,hi]}
            current=inside
        assert lazy_shell is not None
        assert graph.node(622820)==("actual_monotone_root",[2,622803,622804])
        assert a.of(622824)==a.mul(a.pow(a.of(622802),2),a.inv(a.mul(a.scalar(2),a.of(622820))))
        path,application,potential,actual,orders=reach_potential(graph,supported,defs)
        assert len(potential["parameters"])==len(actual)==len(orders)
        assert potential["parameters"][:3]==actual[:3]==[622802,622803,622804]
        [radicand]=graph.args(623824,"sqrt_positive")
        assert radicand==623799 and 623824 in graph.reach([potential["body"]])
        for row in ideal["rows"]:
            assert row["modeMaximumJetOrders"]=={
                "1":{"velocity":2,"pressure":1},"2":{"velocity":2,"pressure":1},
                "3":{"velocity":1,"pressure":0},"4":{"velocity":1,"pressure":0},
            }
        data={
          "schema":"MathScope.N6.ArchivedRepeatPhysicalShellMinimumExtension/1",
          "pins":pins,"graphSHA256":archive["snapshot"]["node_stream_sha256"],
          "candidate":{"key":"0:1","mode":1,"component":"radial.real",
            "raw":raw,"supported":supported,"guarded":guarded,"lazyShell":lazy_shell},
          "actualInteriorTargetDerivative":{
            "pathFromSupportedBody":path,"nativeApplication":application,"nativeName":potential["name"],
            "parameters":potential["parameters"],"actual":actual,"orders":orders,
            "body":potential["body"],"targetSquareRoot":623824,"targetRadicand":radicand},
          "geometry":"On s in (1/2,2), T>0, and strict other guards, X=R^2/(2s) with R>0. For either positive shell endpoint Xe the inward radial path R->sqrt(2*s*Xe) with fixed Z,T stays in the original open shell where the original ordinary hypotheses hold.",
          "remainingMinimalExtension":"The guarded zero extends the supported value continuously at an admitted shell face exactly if the one-sided interior supported component tends to zero there, jointly in the admitted chart and pulse arguments. For ordinary C^r zero extension require the corresponding one-sided limits of all ordinary derivatives through order r, locally uniformly on admitted compact pulse and tangential sets. Keep native evaluation on 0<=w<=Ls and physical cofactors on their original admitted open shells.",
          "directInputOrders":"For values, the checked raw wave ideal reaches original velocity order two and pressure order one for modes 1,2, and velocity order one for modes 3,4. A direct C^r proof by the same Leibniz expansion must carry the input jet orders raised by r, the retained independent coefficients and each actual subtracted family. A proof of the aggregate limits can use cancellations.",
          "strictPositivityObstruction":"The actual interior potential derivative uses sqrt(#623799) at #623824. Original strict target square-root admissibility uses y>=c_y*zeta in the open shell with c_y>0. The original shell majorant zeta approaches zero at either shell face. This lower bound supplies no positive margin for the uncut target square-root derivative at the face. It does not determine the actual target value or the supported limit.",
          "sufficientWeightedProof":"A same-source bound sqrt(zeta)*C*delta^(-m) for each required aggregate derivative implies the minimum limit, where delta=min(1,log(X/Xa),log(Xb/X)) and sqrt(zeta)<=exp(-min(t1^2/2,2)/delta^2) near each edge. This packet does not assume the weighted bound for the full repeated source.",
          "shellEquality":"OPEN",
          "numericComparison":"No endpoint bound for the actual aggregate supported value or its derivatives was derived. The lazy zero and non-separating source margin establish neither a numeric inequality nor an actual counterexample.",
          "numericActualValueInferred":False,
          "actualOutsideAdmittedDomainEvaluated":False,"finalJets":0,"release":"HOLD",
        }
    with output.open("x",encoding="utf8",newline="\n") as file:
        json.dump(data,file,indent=2)
        file.write("\n")
    print("PASS exact archived shell guard and actual interior target derivative path")

if __name__=="__main__":
    main()
