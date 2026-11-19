"""Read back original active N3 first Forced gauges and their actual source curls."""

from argparse import ArgumentParser
from array import array
from collections import Counter, defaultdict
from fractions import Fraction as F
from functools import lru_cache
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import gzip
import json
import re
import sys


WORKSPACE = Path(__file__).resolve().parents[4]
GOAL = WORKSPACE / "work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next"
sys.path[:0] = [str(GOAL / "first-force-repair")]
from verify_repaired_first_force import Exact, Graph

PARTS = ("real", "imaginary")
R,Z,T,THETA,Y0,Y1 = 17732748,17732749,17732750,17732752,17745430,17745431
LEVEL, EPS, K, LEN = 21435320,17732744,17732747,17733029
SQRT2, LAMBDA, VR1, RADIAL = 3622,17734041,17733068,17735155
NATIVE_GAUGE = re.compile(r"ActualMappedOriginalForced_([0-4]:(?:-1|1))_m([12])_(real|imaginary)_([0-2])\Z")
PINS = {
    "manifest": "8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a",
    "registry": "e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
    "ingress": "20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f",
    "sameRunFirstForced": "6bf1e8c538e67bec6ea52e5960fd5cb23a556442d413d120025c49f30f117c27",
    "oldFirstForcedGauge": "95e5f4cce485e95414a0b6574513ea462d50a4e0cc1e98675c6d54a216e21c80",
    "stream": "faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96",
}


def read(path, pin):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == pin, path
    return json.loads(raw)


def key(op, args):
    return op, json.dumps(args, separators=(",", ":"))


class ActiveGraph(Graph):
    """Ephemeral indexed original stream, with native application lookup."""

    def __init__(self, path, backing, manifest, native_fields=None):
        self.backing = backing
        self.offsets = array("Q")
        self.apps = defaultdict(list)
        native_fields = native_fields or set()
        partials = tuple(f'{{"op":"actual_expression_partial","args":[{i},'.encode() for i in native_fields)
        digest, size, offset = sha256(), 0, 0
        with gzip.open(path,"rb") as stream:
            header = stream.readline()
            assert json.loads(header) == {"schema":"MathScope.M3.FullNodesJSONL/1", "node_count":manifest["node_count"]}
            digest.update(header)
            size += len(header)
            tail = b""
            while block := stream.read(8*1024*1024):
                digest.update(block)
                size += len(block)
                lines = (tail+block).split(b"\n")
                tail = lines.pop()
                for line in lines:
                    i = len(self.offsets)
                    self.offsets.append(offset)
                    offset += len(line)+1
                    if line.startswith((b'{"op":"m3_coupled_expression_partial"', b'{"op":"m3_forced_pulse_partial"',*partials)):
                        item = json.loads(line)
                        self.apps[key(item["op"],item["args"])].append(i)
                backing.write(block)
        assert not tail and len(self.offsets) == manifest["node_count"] == 22155584
        assert size == manifest["node_stream_uncompressed_bytes"] == 1024352367
        assert digest.hexdigest() == manifest["node_stream_sha256"] == PINS["stream"]

    def native(self, op, args):
        roots = self.apps[key(op,args)]
        assert len(roots) == 1, (op, args, roots)
        return roots[0]

    def factors(self, *terms):
        scalar, factors = F(1), Counter()

        def visit(index, power):
            nonlocal scalar
            op,args = self.node(index)
            if op == "rational":
                scalar *= F(*map(int,args))**power
            elif op == "multiply":
                for child in args:
                    visit(child,power)
            elif op == "inverse":
                visit(args[0],-power)
            elif op == "integer_power":
                visit(args[0],power*args[1])
            else:
                factors[index] += power

        for root, power in terms:
            visit(root,power)
        return scalar, {k:v for k,v in factors.items() if v}


def literal(graph,i):
    return F(*map(int,graph.args(i,"rational")))


def case_body(graph,root,delta):
    guards, levels = [], []
    while graph.node(root)[0] == "smooth_piecewise":
        test,lo,hi,before,inside,after = graph.args(root,"smooth_piecewise")
        if test == LEVEL:
            a,b = literal(graph,lo),literal(graph,hi)
            assert a.denominator == b.denominator == 2 and b-a == 1 and before == after
            levels.append([lo,hi])
            if a<delta<b:
                root = inside
            else:
                root = before
        else:
            assert before == after == 0
            guards.append([test,lo,hi])
            root = inside
    assert len(guards) == 7 and levels and root != 0
    return root, guards


def cross(a,left,right):
    return [a.sub(a.mul(left[i],right[j]),a.mul(left[j],right[i])) for i,j in ((1,2),(2,0),(0,1))]


def equal(a,left,right,tag):
    delta = a.sub(left,right)
    if delta and a.reduce_sqrt_two(delta,SQRT2):
        assert not a.reduce_sqrt_two(a.clear_compound_denominators(delta),SQRT2), tag


def rational_value(a,root,want,tag):
    equal(a,a.of(root),a.scalar(want),tag)


def phase_derivatives(graph,a,root,native_fields,delta):
    """Literal graph differentiation on the admitted fixed label."""

    @lru_cache(maxsize=50000)
    def d(index,axis):
        if index == axis:
            return a.one
        if index < R:
            return a.zero
        op,args = graph.node(index)
        if op in ("coordinate","rational","source_parameter"):
            return a.zero
        if op in ("add","multiply"):
            terms = [d(x,axis) for x in args]
            if op == "add":
                return a.add(*terms)
            return a.add(*(a.mul(term,*(a.of(v) for j,v in enumerate(args) if j!=i)) for i,term in enumerate(terms) if term))
        if op in ("inverse","sqrt_positive","log_positive","exp","integer_power"):
            first = d(args[0],axis)
            if not first:
                return a.zero
            if op == "inverse":
                return a.neg(a.mul(first,a.pow(a.of(index),2)))
            if op == "sqrt_positive":
                return a.mul(a.scalar(F(1,2)),first,a.inv(a.of(index)))
            if op == "log_positive":
                return a.mul(first,a.inv(a.of(args[0])))
            if op == "exp":
                return a.mul(first,a.of(index))
            return a.mul(a.scalar(args[1]),first,a.pow(a.of(args[0]),args[1]-1))
        if op == "actual_expression_partial":
            system,values,orders = args
            changes = [(i,d(x,axis)) for i,x in enumerate(values)]
            changes = [(i,x) for i,x in changes if x]
            if not changes:
                return a.zero
            assert system in native_fields and len(values)==len(orders), (index,system,axis)
            result=[]
            for i,change in changes:
                next_order=orders.copy()
                next_order[i]+=1
                partial=graph.native(op,[system,values,next_order])
                result.append(a.mul(change,a.of(partial)))
            return a.add(*result)
        children=Graph.children(op,args)
        if op == "actual_monotone_root":
            children=args[1] if isinstance(args[1],list) else args[1:]
        if op == "actual_covariance_volterra":
            children=[args[2],*args[3]]
        assert op in ("ceiling","maximum","smooth_piecewise","source_step_derivative","actual_monotone_root","actual_covariance_volterra"), (index,op)
        assert not any(d(x,axis) for x in children), (root,index,op,axis)
        return a.zero

    longitudinal=a.add(d(root,Y0),a.mul(a.of(VR1),d(root,Y1)))
    equal(a,longitudinal,a.zero,(root,"L phase"))
    radial = d(root,R)
    return radial, a.mul(d(root,THETA),a.inv(a.of(R))), a.mul(a.of(EPS),d(root,Z))


def series(graph,a,root,phase):
    """Return exact coefficients on both signed original angular phases."""
    result=defaultdict(list)

    def walk(index,sign=1):
        op,args=graph.node(index)
        if op=="add":
            for i in args:
                walk(i,sign)
            return
        if op=="multiply" and len(args)==2 and 20 in args:
            walk(next(i for i in args if i!=20),-sign)
            return
        assert op=="multiply" and len(args)==2, (index,op)
        trig, = [i for i in args if graph.node(i)[0] in ("cosine","sine")]
        fn, (angle,) = graph.node(trig)
        m, remain=graph.factors((angle,1),(K,-1),(phase,-1))
        assert not remain and m.denominator==1 and 0<abs(m)<=2, (root,index,angle,m,remain)
        result[(int(m),fn)].append(a.mul(a.scalar(sign),a.of(next(i for i in args if i!=trig))))

    walk(root)
    return {tag:a.add(*xs) for tag,xs in result.items()}


def check_cutoff(graph,psi,pulse,length):
    try:
        factors=graph.args(psi,"multiply")
        assert len(factors)==2
        own=set()
        for part in factors:
            arg,order=graph.args(part,"source_step_derivative")
            assert order==0
            pieces=graph.args(arg,"add")
            fixed, = [v for v in pieces if graph.node(v)[0]=="rational"]
            constant=literal(graph,fixed)
            assert constant in (-4,16) and len(pieces)==2
            moving=next(v for v in pieces if v!=fixed)
            goal=20 if constant==-4 else -20
            assert graph.factors((moving,1),(length,1),(pulse,-1))==(goal,{})
            own.add(constant)
        return own=={-4,16}
    except (AssertionError,ValueError):
        return False


def term_psi(graph,bodies,states,pulse,length):
    reachable = graph.reach(bodies)
    options = {i:set() for i in states}
    for i in reachable:
        op,args=graph.node(i)
        if op=="multiply" and len(args)==2:
            for j,v in enumerate(args):
                if v in options and check_cutoff(graph,args[1-j],pulse,length):
                    options[v].add(args[1-j])
    assert all(len(xs)==1 for xs in options.values()), options
    result, = set().union(*options.values())
    return result


def same_reference_readback(graph,a,defs,ingress,registry_fields):
    local=defs['ActualForcedCurrent_velocity_0_own_0']['parameters']
    ell,ref=local[3],local[7]
    refargs=ingress['wave']['referenceArguments']
    scale=ingress['wave']['potentialScale']
    A=ingress['wave']['A']
    x0,x1=graph.args(refargs[2],"multiply")
    assert T in (x0,x1)
    ratio=x1 if x0==T else x0
    logratio=native_log(graph,scale,ratio)
    rexp,=graph.args(ratio,"exp")
    log2,= [i for i in graph.args(rexp,"multiply") if graph.node(i)[0]=="log_positive"]
    assert literal(graph,graph.args(log2,"log_positive")[0])==2
    equal(a,a.of(rexp),a.mul(a.sub(a.of(ell),a.of(ref)),a.of(log2)),"dyadic ratio")
    zfactor,zid=graph.args(refargs[1],"multiply")
    if zfactor==Z:
        zfactor,zid=zid,zfactor
    assert zid==Z
    lexp,=graph.args(zfactor,"exp")
    equal(a,a.of(lexp),a.mul(a.sub(a.one,a.of(A)),a.of(logratio)),"Z scaling")
    rfactor,rid=graph.args(refargs[0],"multiply")
    if rfactor==R:
        rfactor,rid=rid,rfactor
    assert rid==R and graph.args(rfactor,"sqrt_positive")==[ratio]
    assert refargs[3:]==local[3:]
    gauge_exponent=a.sub(a.of(A),a.scalar(F(1,2)))
    equal(a,a.of(graph.args(scale,"exp")[0]),a.mul(gauge_exponent,a.of(logratio)),"potential scaling")
    velocity_fields=[registry_fields[i] for i in (9,10,11)]
    pressure=registry_fields[12]
    gauge_fields=[next(field for field in registry_fields if field["id"]==i["field"]) for i in ingress['wave']['indexed']]
    master=velocity_fields[0]
    def row_map(row):
        return {k:row[k] for k in ("values","derivativeMaps","guards","coefficient","label")}
    for field in [*velocity_fields,pressure,*gauge_fields]:
        assert field['parameters']==master['parameters'] and field['directions']==master['directions']
        assert len(field['rows'])==162
        assert [row_map(r) for r in field['rows']]==[row_map(r) for r in master['rows']]
        for row in field['rows']:
            sign_index=0 if row['label']['sign']==1 else 1
            ref_name=f"{field['name']}_reference_{sign_index}"
            own_name=(f"SpatialStage1Gauge_own_{sign_index}_{field['name'].split('_')[-1]}" if field in gauge_fields else f"{field['name']}_own_{sign_index}")
            if field in gauge_fields:
                ref_name=f"SpatialStage1Gauge_reference_{sign_index}_{field['name'].split('_')[-1]}"
            own,reference=defs[own_name],defs[ref_name]
            assert own['parameters']==reference['parameters']==local
            assert row['localSystem']==reference['id']
            fn=graph.native("m3_coupled_expression_partial",[own['id'],refargs,[0]*len(refargs)])
            operands=graph.args(reference['body'],"multiply")
            assert len(operands)==2 and fn in operands
            coefficient=next(i for i in operands if i!=fn)
            if field in gauge_fields:
                assert coefficient==scale
            else:
                want=a.mul(a.of(A),a.of(logratio),a.scalar(2 if field==pressure else 1))
                equal(a,a.of(graph.args(coefficient,"exp")[0]),want,(field['name'],"reference scale"))
    return ratio,master


def native_log(graph,scale,ratio):
    exponent,=graph.args(scale,"exp")
    logratio,=[i for i in graph.args(exponent,"multiply") if graph.node(i)[0]=="log_positive"]
    assert graph.args(logratio,"log_positive")==[ratio]
    return logratio


def guard_roles(graph,a,guards,t):
    for _,lo,hi in guards[:4]:
        assert literal(graph,lo)==-F(3,4) and literal(graph,hi)==F(3,4)
    assert guards[0][0]==17735160
    assert graph.args(17735156,'log_positive')==[17732776]
    assert literal(graph,graph.args(127,'log_positive')[0])==2
    band_coordinate=a.neg(a.mul(a.of(17735156),a.inv(a.of(127))))
    equal(a,a.of(guards[0][0]),a.sub(band_coordinate,a.of(17732737)),(t['key'],'band offset'))
    for j,(axis,mesh) in enumerate(((T,17733858),(Z,17733857),(R,17733856)),1):
        equal(a,a.of(guards[j][0]),a.sub(a.mul(a.pow(a.of(17732737),6),a.of(axis)),a.of(mesh)),(t['key'],"mesh",j))
    assert guards[4]==[17732770,3617,28826]
    assert guards[5][0]==t['transverse']
    assert literal(graph,guards[5][1])==-F(1,2**34) and literal(graph,guards[5][2])==F(1,2**34)
    assert guards[6]==[t['pulse'],0,LEN]


def check_all(graph,registry,ingress,forced,old,native_fields):
    expr,fields,_,systems,_=json.loads(registry['definitions'])
    want_prefix=('ActualMappedOriginalForced_','ActualForcedCurrent_velocity_',
                 'ActualForcedCurrent_angular_pressure_','SpatialStage1Gauge_', 'InitializedOriginalWave_')
    selected=[x for x in expr if x['name'].startswith(want_prefix)]
    defs={x['name']:x for x in selected}
    assert len(defs)==len(selected)
    trows={x['key']:x for x in ingress['wave']['perTemplate']}
    frows={(r['key'],r['harmonic']):r for r in forced['full']['rows']}
    assert len(trows)==10 and len(frows)==20
    assert set(frows)=={(r['key'],r['mode']) for r in old['cases']}
    assert old['positiveModeCases']==20 and old['nativePotentialApplications']==120
    assert old['ownToReferencePotentialMultiplier']=="rho^(A-1/2)" and old['referenceToPhysicalPotentialMultiplier']=="Q_ref^(1/2-A)"
    assert all([p['real']['coefficient'],p['imaginary']['coefficient']]==[-1,1]
               for r in old['cases'] for p in r['positiveNormalizedCylindricalPotential'])
    inventory=[x for x in expr if NATIVE_GAUGE.fullmatch(x['name'])]
    assert len(inventory)==120
    a=Exact(graph)
    ratio,master=same_reference_readback(graph,a,defs,ingress,fields)
    assert literal(graph,graph.args(SQRT2,'sqrt_positive')[0])==2
    equal(a,a.of(LAMBDA),a.sub(a.scalar(4),a.of(SQRT2)),"integer cover radial eigenvalue")
    equal(a,a.of(VR1),a.sub(a.one,a.of(SQRT2)),"radial direction")
    assert graph.args(RADIAL,'multiply')==[17734059,17735154]
    result=[]
    for t in trows.values():
        delta,sign=map(int,t['key'].split(':'))
        sign_index=0 if sign==1 else 1
        phase,pulse=t['phase'],t['pulse']
        assert t['k']==K and t['sign']==sign
        velocity=[]
        guards=None
        gauges,owner_roots=[],[]
        for j in range(3):
            owner=defs[f'ActualForcedCurrent_velocity_{j}_own_{sign_index}']
            raw,support=case_body(graph,owner['body'],delta)
            owner_roots.append(raw)
            if guards is None:
                guards=support
                guard_roles(graph,a,guards,t)
            assert guards==support
            velocity.append(series(graph,a,raw,phase))
            g_owner=defs[f'SpatialStage1Gauge_own_{sign_index}_{j}']
            rawg,supportg=case_body(graph,g_owner['body'],delta)
            assert supportg==guards
            gauges.append(rawg)
        p_owner=defs[f'ActualForcedCurrent_angular_pressure_own_{sign_index}']
        pbody,pg=case_body(graph,p_owner['body'],delta)
        assert pg==guards
        _=series(graph,a,pbody,phase)
        n=phase_derivatives(graph,a,phase,native_fields,delta)
        invR=a.inv(a.of(R))
        actual_radials={i for i in graph.reach(owner_roots) if i==RADIAL or
                        (graph.node(i)[0]=='multiply' and RADIAL in graph.node(i)[1])}
        actual_radials={i for i in actual_radials if graph.factors((i,1),(RADIAL,-1),(LAMBDA,delta))==(1,{})}
        assert len(actual_radials)==1, (t['key'],actual_radials)
        actual_radial=next(iter(actual_radials))
        radial=a.of(actual_radial)
        original_signed=t['potential'][2]
        assert [p['m'] for p in t['potential']]==[1,2,1] and original_signed['real']==[0,0,0]
        g_expected=[a.zero for _ in range(3)]
        g_atoms={i for p in t['potential'] for i in p['imaginary'] if i}
        stage_a=Exact(graph)
        exact_aof=stage_a.of
        stage_a.of=lambda index:({((index,1),):F(1)} if index in g_atoms else exact_aof(index))
        for m in (1,2):
            row=frows[t['key'],m]
            system=systems[row['system']]
            assert system['name']==f"ActualOriginalForced_{t['key']}_m{m}" and row['projected']==system['forcing']
            assert system['length']==LEN and system['directions']==[R,Z,T,Y0,Y1] and not system['finitePartialSumIsExactSolution']
            assert system['left']==0 and system['initial']==[{p:0 for p in PARTS} for _ in range(3)]
            source_names={part:[defs[f"ActualMappedOriginalForced_{t['key']}_m{m}_{part}_{j}"] for j in range(3)] for part in PARTS}

            def app(part,j,axis=None):
                definition=source_names[part][j]
                params=definition['parameters']
                assert params==system['parameters']
                assert all(graph.node(i)[0]=='coordinate' for i in params)
                assert system['variable'] not in params and THETA not in params
                assert axis is None or axis in params
                return graph.native("m3_coupled_expression_partial",[definition['id'],params,[int(q==axis) for q in params]])

            def flow(part,j):
                return graph.native("m3_forced_pulse_partial",[row['system'],part,j,pulse,system['parameters'],[0]*5])

            native_gauge={part:[app(part,j) for j in range(3)] for part in PARTS}
            native_flow={part:[flow(part,j) for j in range(3)] for part in PARTS}
            potential_bodies=[d['body'] for part in PARTS for d in source_names[part]]
            psi=term_psi(graph,potential_bodies,[i for part in PARTS for i in native_flow[part]],pulse,LEN)
            km=a.mul(a.scalar(m),a.of(K))
            norm=a.dot(n,n)
            denominator=a.inv(a.mul(km,norm))
            curl={}
            for part in PARTS:
                amplitude=[a.mul(a.of(psi),a.of(i)) for i in native_flow[part]]
                raw_cross=cross(a,n,amplitude)
                for j,body in enumerate(source_names[part]):
                    equal(a,a.of(body['body']),a.mul(raw_cross[j],denominator),(t['key'],m,part,j,'normal cross potential'))
                shared=[a.of(i) for i in native_gauge[part]]
                dr=lambda j:a.add(a.of(app(part,j,R)),a.mul(radial,a.add(a.of(app(part,j,Y0)),a.mul(a.of(VR1),a.of(app(part,j,Y1))))))
                dz=lambda j:a.mul(a.of(EPS),a.of(app(part,j,Z)))
                leading=[a.neg(a.mul(km,z)) for z in cross(a,n,shared)]
                curl[part]=(leading,[a.neg(dz(1)),a.sub(dz(0),dr(2)),a.add(dr(1),a.mul(shared[1],invR))])
            old_carrier_count=0
            for j in range(3):
                lead_r,rem_r=curl['real']
                lead_i,rem_i=curl['imaginary']
                independent={'real':a.sub(lead_r[j],rem_i[j]),'imaginary':a.add(lead_i[j],rem_r[j])}
                for part,trig,orient in (('real','cosine',1),('imaginary','sine',-1)):
                    base=a.zero
                    old_name=f"InitializedOriginalWave_{delta}_{sign}_{j}_{part}"
                    if m==1 and old_name in defs:
                        d=defs[old_name]
                        b=graph.native("m3_coupled_expression_partial",[d['id'],d['parameters'],[0]*len(d['parameters'])])
                        base=a.of(b)
                        old_carrier_count+=1
                    positive=a.mul(a.scalar(orient),velocity[j].get((m,trig),a.zero))
                    negative=a.mul(a.scalar(orient),velocity[j].get((-m,trig),a.zero))
                    equal(a,a.sub(positive,base),independent[part],(t['key'],m,j,part,'forced-only source curl'))
                    equal(a,negative,positive if part=='real' else a.neg(positive),(t['key'],m,j,part,'opposite signed coefficient'))
                local_coeff=t['potential'][m-1]
                assert local_coeff['imaginary'][j]==native_gauge['real'][j]
                equal(a,a.of(local_coeff['real'][j]),a.neg(a.of(native_gauge['imaginary'][j])),(t['key'],m,j,'stage gauge orientation'))
                tc,ts=trig_pair(graph,gauges[j],phase,m)
                scalar=stage_a.mul(stage_a.scalar(2),stage_a.sub(stage_a.mul(stage_a.of(local_coeff['real'][j]),stage_a.of(tc)),
                                                               stage_a.mul(stage_a.of(local_coeff['imaginary'][j]),stage_a.of(ts))))
                g_expected[j]=stage_a.add(g_expected[j],scalar)
            result.append({'key':t['key'],'mode':m,'phase':phase,'pulse':pulse,'psi':psi,'system':row['system'],
                           'guards':guards,'nativeZeroOrderGauge':native_gauge,'nativeZeroOrderPulse':native_flow,
                           'curlDifferentialFactors':{'aOwn':RADIAL,'aOwnPaletteFactor':17734059,
                                                      'aOwnRadialDerivativeWithoutPaletteFactor':17735154,
                                                      'Lambda':LAMBDA,'levelDifference':delta,
                                                      'radialFast':actual_radial,'epsilon':EPS,'radialDirectionSecondComponent':VR1},
                           'verifiedFirstForcedCurlParts':6,'nativeInitializedCarrierTermsSubtracted':old_carrier_count})
        for j in range(3):
            _,ts=trig_pair(graph,gauges[j],phase,1)
            signed=stage_a.mul(stage_a.scalar(-2),stage_a.of(original_signed['imaginary'][j]),stage_a.of(ts))
            equal(stage_a,stage_a.sub(stage_a.of(gauges[j]),signed),g_expected[j],(t['key'],j,'stage gauge Forced contributions only'))
        print("Verified first-Forced local template",t['key'],flush=True)
    assert len(result)==20
    return {'status':'VERIFIED_ACTIVE_N3_FIRST_FORCED_LOCAL_COMPLEX_POTENTIAL_AND_SOURCE_CURL',
            'inputSHA256':PINS,'sourceNodeCount':22155584,'sameRunForcingRows':20,
            'cases':result,'checkedIndexedRowsPerComponent':len(master['rows']),
            'chartRatio':ratio,'archivedComparatorUsedForShapesNotSourceIds':True,
            'signedPotentialOpaqueForFirstForcedExtraction':True,'independentPressureFormula':False,
            'stageOneNumericalEndpoints':False,'finalJets':'0/67','release':'HOLD'}


def trig_pair(graph,root,phase,mode):
    wanted={"cosine":set(),"sine":set()}
    pending=[root]
    while pending:
        i=pending.pop()
        op,args=graph.node(i)
        if op=='add':
            pending.extend(args)
        elif op=='multiply':
            trig=[k for k in args if graph.node(k)[0] in wanted]
            if trig:
                assert len(trig)==1
                j=trig[0]
                name,(angle,)=graph.node(j)
                if graph.factors((angle,1),(K,-1),(phase,-1))==(mode,{}):
                    wanted[name].add(j)
            else:
                pending.extend(k for k in args if graph.node(k)[0] in ('add','multiply'))
    assert all(len(v)==1 for v in wanted.values()), (root,phase,mode,wanted)
    return tuple(next(iter(x)) for x in wanted.values())


def main():
    cli=ArgumentParser(description=__doc__)
    cli.add_argument("artifact",type=Path)
    cli.add_argument("out",type=Path)
    args=cli.parse_args()
    prefix=args.artifact/"first-correction-spatial-source"
    manifest=read(prefix/"original-source-export-manifest.json",PINS["manifest"])
    registry=read(prefix/"original-source-functions.json",PINS["registry"])
    ingress=read(args.artifact/"first-correction-spatial-ingress.json",PINS["ingress"])
    forced=read(args.artifact/"same-family-mode-two.json",PINS["sameRunFirstForced"])
    old=read(GOAL/"final67/first-forced-gauge.json",PINS["oldFirstForcedGauge"])
    assert forced["completeForcedSeal"] and not forced["numericOutputBound"]
    assert [len(group) for group in json.loads(registry["definitions"])] == [1355,29,2,20,0]
    base=json.loads(registry["base"]["base"]["expression"])
    native_fields={i for i,row in enumerate(base) if row["name"] in ("M3GlobalBandSlow_F","M3GlobalBandSlow_G")}
    assert native_fields == {32027,32028}
    with TemporaryFile(dir=args.out.parent) as backing:
        graph=ActiveGraph(prefix/"original-source-nodes.jsonl.gz",backing,manifest,native_fields)
        data=check_all(graph,registry,ingress,forced,old,native_fields)
    with args.out.open("x",encoding="utf8",newline="\n") as out:
        out.write(json.dumps(data,indent=2)+"\n")
    print(data["status"])


if __name__ == "__main__":
    main()
