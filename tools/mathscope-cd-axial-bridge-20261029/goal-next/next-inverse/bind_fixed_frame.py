"""Replay the fixed original moving-frame inverse operator in each archived phase."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from functools import cache
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'flat'))
from bind_forced_cutoffs import (Archive, GRAPH_SHA, REGISTRY_SHA, PROJECTION_SHA,
    PRODUCER_COMMIT, NAVIER, checkpoint_record, digest, git_blob, pinned_json)

FORCED_SHA = '719318e74afc94b7f6c45e6cf36d05362cffa8cf1f4567d0d5b61ed852e0b76d'
PREFIX_MATCH = 3615944

ONE = {(): Fraction(1)}
ZERO = {}


def scale(k, p):
    return {m:k*a for m,a in p.items() if k*a}


def add(*ps):
    out = Counter()
    for p in ps:
        for m,c in p.items():
            out[m] += c
    return {m:c for m,c in out.items() if c}


def mul(p, q):
    out = Counter()
    for m,a in p.items():
        for n,b in q.items():
            powers = Counter(dict(m))
            powers.update(dict(n))
            word = tuple(sorted((k,e) for k,e in powers.items() if e))
            out[word] += a*b
    return {m:c for m,c in out.items() if c}


def product(*ps):
    out = ONE
    for p in ps:
        out = mul(out,p)
    return out


def inv(p):
    assert p
    if len(p) == 1:
        (m,c), = p.items()
        return {tuple((k,-e) for k,e in m): 1/c}
    data = tuple(sorted(p.items()))
    sign = 1 if data[0][1] > 0 else -1
    key = ('inverseSum', tuple((m,sign*c) for m,c in data))
    return {((key,1),): Fraction(sign)}


def power(p, n):
    if n < 0:
        return power(inv(p), -n)
    out = ONE
    for _ in range(n):
        out = mul(out,p)
    return out


class Normalizer:
    def __init__(self, graph):
        self.graph = graph

    @cache
    def at(self, index):
        kind, args = self.graph.node(index)
        if kind == 'rational':
            return scale(Fraction(*map(int,args)), ONE)
        if kind == 'add':
            return add(*(self.at(j) for j in args))
        if kind == 'multiply':
            return product(*(self.at(j) for j in args))
        if kind == 'inverse':
            return inv(self.at(args[0]))
        if kind == 'integer_power' and abs(args[1]) <= 4:
            return power(self.at(args[0]),args[1])
        return {((('node', index),1),):Fraction(1)}

    def assert_equal(self, index, expected, label):
        actual = self.at(index)
        assert actual == expected, (label,index,len(actual),len(expected))

    def derivative_in_w(self, index, w):
        poly = self.at(index)
        variable = ('node',w)
        result = Counter()
        for word,c in poly.items():
            entries = dict(word)
            k = entries.pop(variable,0)
            for symbol in entries:
                tag,value = symbol
                if tag=='node':
                    assert w not in self.graph.explicit_reach([value]), (index,w,value)
                else:
                    # The original n(w) is affine in w; inverse sums of
                    # slow coefficients may occur but contain no w term.
                    assert not self.inverse_has_w(value,w)
            if k:
                if k!=1:
                    entries[variable] = k-1
                result[tuple(sorted(entries.items()))] += c*k
        return {m:c for m,c in result.items() if c}

    def inverse_has_w(self, terms, w):
        for m,_ in terms:
            for (kind,value),_ in m:
                if kind=='node':
                    if w in self.graph.explicit_reach([value]):
                        return True
                elif self.inverse_has_w(value,w):
                    return True
        return False


def dot(a,b):
    return add(*(mul(x,y) for x,y in zip(a,b,strict=True)))


def code_pins(repo):
    expected = {
        'source-forced-pulse.mjs': [
            b'damping=G.mul(epsilon,G.pow(k,2),nSquared)',
            b'matrix=Aphi.map((row,i)=>row.map((x,j)=>i===j?G.sub(x,G.mul(G.q(m*m),damping)):x))',
            b'projectedRaw=projection.map(row=>cscale(G,G.q(-1),cdot(G,row,forcing)))',
            b'pressureNumerator=cadd(G,cdot(G,normalRow,velocity),cdot(G,n,forcing))',
            b'pressure=complex(G,G.neg(G.div(pressureNumerator.imaginary,denominator)),G.div(pressureNumerator.real,denominator))',
        ],
        'source-forced-class-majorants.mjs': [
            b'M_m=M_1-(m^2-1)*d*I',
            b'inputWAlphaSeminormStillRequired:true',
        ],
    }
    out = {}
    for file, fragments in expected.items():
        path = NAVIER + file
        raw = git_blob(repo,PRODUCER_COMMIT,path)
        assert all(piece in raw for piece in fragments), file
        out[path] = digest(raw)
    return out


def check_template(graph, norm, old, system, binding, phase_info):
    shift = old['input']['variable'] - system['variable']
    def hint(index):
        return index if index < PREFIX_MATCH else index-shift

    assert old['input']['m'] == binding['mode']
    assert system['variable'] == hint(old['input']['variable'])
    m = binding['mode']
    w = system['variable']
    n = list(map(hint,old['normal']['value']))
    nprime = list(map(hint,old['normal']['derivative']))
    nsq = hint(old['normal']['squared'])
    damping = hint(old['damping'])
    K = [list(map(hint,row)) for row in old['K']]
    P = [list(map(hint,row)) for row in old['projection']]
    Aphi = [list(map(hint,row)) for row in old['Aphi']]
    k,eps = hint(old['k']), hint(old['epsilon'])
    assert k == binding['waveNumber'] == phase_info['waveNumber']
    [kin] = graph.op(k,'ceiling')
    [radical] = graph.op(kin,'inverse')
    assert graph.op(radical,'sqrt_positive') == [eps]
    graph.op(eps,'exp')
    R = system['directions'][0]
    rate = phase_info['windingRate']
    norm.assert_equal(n[1],product(norm.at(rate),inv(norm.at(k)),inv(norm.at(R))), 'cylindrical n_theta')
    nn,kn,epsn = list(map(norm.at,n)),norm.at(k),norm.at(eps)
    n2 = dot(nn,nn)
    norm.assert_equal(nsq,n2,'normal squared')
    norm.assert_equal(damping,product(epsn,power(kn,2),n2),'epsilon k^2 n^2')
    row_n = []
    for j in range(3):
        norm.assert_equal(nprime[j],norm.derivative_in_w(n[j],w),'actual pulse derivative of n')
        col = [norm.at(K[i][j]) for i in range(3)]
        row_n.append(add(dot(nn,col),scale(-1,norm.at(nprime[j]))))
    d = norm.at(damping)
    invn2 = inv(n2)
    pnf = []
    for i in range(3):
        pnf.append([])
        for j in range(3):
            p = add(ONE if i==j else ZERO,scale(-1,product(nn[i],nn[j],invn2)))
            a = add(scale(-1,norm.at(K[i][j])),product(nn[i],row_n[j],invn2))
            pnf[i].append(p)
            norm.assert_equal(P[i][j],p,'full original projection')
            norm.assert_equal(Aphi[i][j],a,'original A_phi')
            norm.assert_equal(system['matrix'][i][j],add(a,scale(-m*m,d) if i==j else ZERO),
                              'registered mode matrix')
    pressure = {}
    for part in ('real','imaginary'):
        path_source = [row[part]['formalPathSource'] for row in binding['components']]
        state = [hint(row[part]) for row in old['velocity']]
        for j,index in enumerate(state):
            assert graph.op(index,'m3_forced_pulse_partial') == [
                system['id'],part,j,w,system['parameters'],[0]*len(system['directions'])]
        sf,st = list(map(norm.at,path_source)),list(map(norm.at,state))
        for i in range(3):
            norm.assert_equal(system['forcing'][i][part],scale(-1,dot(pnf[i],sf)),
                              'registered projected source')
        numerator = add(dot(row_n,st),dot(nn,sf))
        denom = product(scale(m,kn),n2)
        target_part, sign = ('imaginary',1) if part=='real' else ('real',-1)
        target = hint(old['pressure'][target_part])
        norm.assert_equal(target,scale(sign,mul(numerator,inv(denom))), 'registered normal pressure')
        pressure[target_part] = target
    return {'system':system['id'], 'mode':m, 'variable':w,
        'parameters':system['parameters'], 'directions':system['directions'],
        'normal':n,'normalDerivative':nprime,'normalSquared':nsq,'K':K,'Aphi':Aphi,
        'projection':P,'matrix':system['matrix'],'damping':damping,'carrier':k,'epsilon':eps,
        'length':system['length'],'originalPressure':pressure,'windingRate':rate}


def bind(repo, graph, registry, projection, cutoffs):
    _, _, _, systems, _ = json.loads(registry['definitions'])
    old = checkpoint_record(repo)
    records = {(row['key'],row['mode']):row for row in cutoffs['bindings']}
    norm = Normalizer(graph)
    cases=[]
    for template in old['templates']:
        modes=[]
        for f in template['forced']:
            b=records[template['key'],f['m']]
            s=systems[b['system']]
            phase=projection['sourcePhases'][str(b['phase'])]
            modes.append(check_template(graph,norm,f['inverse'],s,b,phase))
        m1,m2=modes
        assert [m1['mode'],m2['mode']] == [1,2]
        for key in ('variable','directions','normal','normalDerivative','normalSquared',
                    'K','Aphi','projection','damping','carrier','epsilon','length','windingRate'):
            assert m1[key]==m2[key], (template['key'],key)
        cases.append({'key':template['key'],'difference':template['levelDifference'],
                      'sign':template['sign'],'oldModeChecks':modes})
    return cases


def main():
    parser=ArgumentParser(description=__doc__)
    for k in ('repo','graph','projection','forced','out'):
        parser.add_argument('--'+k,type=Path,required=True)
    args=parser.parse_args()
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled')
    pins=code_pins(args.repo)
    registry=pinned_json(args.graph/'original-source-functions.json',REGISTRY_SHA)
    projection=pinned_json(args.projection,PROJECTION_SHA)
    forced=pinned_json(args.forced,FORCED_SHA)
    with TemporaryFile() as backing:
        graph=Archive(args.graph/'original-source-nodes.jsonl.gz',backing)
        cases=bind(args.repo,graph,registry,projection,forced)
    receipt={'schema':'MathScope.M3.FixedFrameModeOperatorBinding/1',
             'verdict':'VERIFIED_ORIGINAL_FIXED_FRAME_MODE_OPERATOR',
             'producerCommit':PRODUCER_COMMIT,'sourceSHA256':pins,
             'graphSHA256':GRAPH_SHA,'registrySHA256':REGISTRY_SHA,
             'projectionSHA256':PROJECTION_SHA,'forcedSHA256':FORCED_SHA,
             'fixedPhaseCases':len(cases),'originalArchivedPositiveModesChecked':2*len(cases),
             'cases':cases}
    args.out.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
    print(f"Original matrix, projection and pressure verified in {2*len(cases)} archived systems")


if __name__=='__main__':
    main()
