"""In-memory checker controls only. These fixtures do not model an executed N=2 run."""
from copy import deepcopy
from check_n2_selector_receipt import (
    COMMON, PROFILE, SOURCE, WEIGHTED_HIGHER, WEIGHTED_ONE,
    check_stage, check_anchors,
)


def test_stage_and_anchors():
    nodes = {0:{"op":"rational","args":["0","1"]},1:{"op":"rational","args":["1","1"]}}
    next_id = 50000
    intern = {("rational",("0","1")):0,("rational",("1","1")):1}

    def node(op,*args):
        nonlocal next_id
        key = op, args
        if key not in intern:
            intern[key] = next_id
            nodes[next_id] = {"op":op,"args":list(args)}
            next_id += 1
        return intern[key]

    def rational(n,d=1):
        return node("rational",str(n),str(d))

    def add(a,b):
        return b if a==0 else a if b==0 else node("add",*sorted((a,b)))

    def mul(a,b):
        return 0 if a==0 or b==0 else b if a==1 else a if b==1 else node("multiply",*sorted((a,b)))

    def neg(a):
        return mul(rational(-1),a)

    def div(a,b):
        return mul(a,node("inverse",b))

    def floorlog(a):
        return neg(node("ceiling",neg(div(a,log2))))

    log2 = node("log_positive",rational(2))
    ell_min = node("coordinate","diagnostic_floor_input")
    ell0 = add(ell_min,rational(6))
    h = node("source_parameter","h")
    rows,old_rows = [],[]
    previous = 0
    for n in (1,2,3):
        old_log = node("coordinate","diagnostic_historical_log"+str(n))
        old_scale = node("exp",old_log)
        source_roots = {"diagnostic":old_log}
        old_rows.append({"order":n,"logScale":old_log,"scale":old_scale,"sourceCoefficientRoots":source_roots})
        kinds = COMMON | (WEIGHTED_ONE if n==1 else WEIGHTED_HIGHER)
        clauses = []
        for m in range(n+1):
            for kind in sorted(kinds):
                bound = node("maximum",1,node("coordinate",kind+str(n)+str(m)))
                required = div(add(mul(rational(n),log2),node("log_positive",bound)),mul(rational(n),h))
                clauses.append({"kind":kind,"derivativeOrder":m,"bound":bound,"requiredLog":required})
        growth = add(previous,node("log_positive",rational(16 if n==2 else 2)))
        small = mul(add(ell_min,rational(10)),log2) if n==1 else 0
        log = node("maximum",old_log,growth,small,*[r["requiredLog"] for r in clauses])
        rows.append({"order":n,"historicalScale":old_scale,"historicalLogScale":old_log,
                     "previousLogScale":previous,"sourceCoefficientRoots":source_roots,
                     "growth":growth,"smallBand":small,"constraints":clauses,
                     "logScale":log,"scale":node("exp",log)})
        previous = log

    lower = floorlog(rows[1]["logScale"])
    upper = add(floorlog(rows[2]["logScale"]),rational(-1))
    lower_max = node("maximum",ell0,lower)
    ell = node("coordinate","diagnostic_ell")
    Q = node("exp",neg(mul(ell,log2)))
    window = {"schema":"MathScope.N6.OriginalBandWindow/1","coefficientOrder":2,
              "nextSourceScale":rows[2]["scale"],"nextSourceLogScale":rows[2]["logScale"],
              "coefficientRows":rows[:2],"exactTail":{"firstOmitted":3},"ell":ell,"Q":Q,
              "lower":lower_max,"upper":upper,"domain":{"bounds":[lower_max,upper],"qOverQ":["1/2","2"]}}
    point_Q = node("exp",neg(mul(lower,log2)))
    relative = node("exp",add(mul(lower,log2),neg(rows[1]["logScale"])))
    s = mul(rational(1,2),add(rational(1,2),relative))
    point = {"lowerLabel":lower,"Q":point_Q,"relative":relative,"s":s,"q":mul(point_Q,s),"eta":0}
    q0 = node("coordinate","diagnostic_q")
    active = []
    for j,row in enumerate(rows[:2]):
        sigma = mul(row["scale"],q0)
        # Native node operation payloads use lists; create them directly.
        chi = node("coordinate","diagnostic_chi_slot"+str(j))
        nodes[chi] = {"op":"actual_expression_partial","args":[1,[sigma],[0]]}
        d_chi = node("coordinate","diagnostic_dchi_slot"+str(j))
        nodes[d_chi] = {"op":"actual_expression_partial","args":[1,[sigma],[1]]}
        stress = node("smooth_piecewise",4756,28814,28824,0,node("coordinate","diagnostic_Tz"+str(j)),0)
        extra = mul(sigma,d_chi)
        active.append({"order":j+1,"scale":row["scale"],"logScale":row["logScale"],
                       "sourceSelectorRow":j,"sigma":sigma,"chi":chi,"extra":extra,
                       "reducedChi":chi,"reducedExtra":extra,"sourceRoots":{"Tz":stress}})
    ids = ["genuine-common-source-family","source-coefficient-window-is-complete",
           "original-cutoff-closed-flat-zero-boundary","actual-positive-coefficients-and-pressure-retained",
           "source-prefix-and-original-function-definitions-preserved"]
    stage = {"schema":"MathScope.M3.OriginalAxialN2CurrentPressurePrefix/1","sourceCommit":SOURCE,
             "executingCommit":"a"*40,"requestedPrefix":2,"finalJets":0,"release":"HOLD",
             "currentStage":"sealed-original-representative-N2",
             "stages":[{"name":"sealed-original-band-N2","nodes":next_id,"milliseconds":10}],
             "selector":{"rows":rows,"historicalRows":old_rows,"originalPrefix":3,"window":window,
                         "commonEll0":ell0,"sourceBandChecks":[{"id":i,"pass":True} for i in ids],
                         "activeBackgroundRows":active,"exactInteriorChartPoint":point,"sourceFamilySHA256":PROFILE}}
    assert check_stage(stage,"a"*40)==stage["selector"]
    assert check_anchors(stage,stage["selector"],nodes.__getitem__)["originalScaleAndWindowAST"]

    wrong_clause = deepcopy(stage)
    wrong_clause["selector"]["rows"][2]["constraints"].pop()
    try:
        check_stage(wrong_clause)
    except AssertionError:
        pass
    else:
        raise AssertionError("Dropped diagonal clause was accepted.")

    wrong_window = deepcopy(nodes)
    wrong_window[upper]["args"] = [rational(-1),floorlog(rows[1]["logScale"])]
    try:
        check_anchors(stage,stage["selector"],wrong_window.__getitem__)
    except AssertionError:
        pass
    else:
        raise AssertionError("N=2 window built from b2 instead of b3 was accepted.")


if __name__ == "__main__":
    test_stage_and_anchors()
    print("PASS: stage/anchor shape and two negative controls; synthetic checker validation only.")

