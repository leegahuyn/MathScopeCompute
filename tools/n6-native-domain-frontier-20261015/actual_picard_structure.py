"""Source-bound Picard derivative-loss structure, without importing norm claims."""
from collections import Counter
from functools import lru_cache
import hashlib
import json
from pathlib import Path
import argparse
import os
import unittest

ROOT=Path('work/native-result-small')

def sha(obj):
    return hashlib.sha256(json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()

def masks(system):
    if system['diagonal'] != [0,0,2,0,3,1]:
        raise ValueError('Original singular diagonal changed')
    if any(len(system[k])!=6 or any(len(row)!=6 for row in system[k]) for k in ('A0','A1')):
        raise ValueError('Matrix shape changed')
    a0=[[int(v!=0) for v in row] for row in system['A0']]
    a1=[[int(v!=0) for v in row] for row in system['A1']]
    if any(a1[i][j] and (i not in (4,5) or j not in (0,1,2,3)) for i in range(6) for j in range(6)):
        raise ValueError('Actual A1 no longer maps the first four coordinates to the last two')
    if any(sum(a1[i][k]*a1[k][j] for k in range(6)) for i in range(6) for j in range(6)):
        raise ValueError('A1 derivative-loss mask is not square-zero')
    return a0,a1

def capture(graph,roots):
    seen=set();stack=list(roots)
    while stack:
        i=stack.pop()
        if i in seen:continue
        seen.add(i)
        if str(i) not in graph:raise ValueError('Missing original node '+str(i))
        n=graph[str(i)];op=n['op'];a=n['args']
        if op in ('rational','coordinate','source_parameter'):continue
        if op in ('add','multiply','maximum','smooth_piecewise','definite_integral'):stack.extend(a)
        elif op in ('inverse','sqrt_positive','log_positive','exp','sine','cosine','integer_power','source_step_derivative','ceiling'):stack.append(a[0])
        elif op=='actual_natural_series':stack.extend(a[1:3])
        else:raise ValueError('Unproved Picard coefficient native boundary '+op)
    return seen

def eta_coordinates(graph):
    @lru_cache(None)
    def visit(i):
        n=graph[str(i)];op=n['op'];a=n['args']
        if op=='coordinate':return frozenset({i})
        if op in ('rational','source_parameter'):return frozenset()
        if op=='definite_integral':return (visit(a[0])-{a[1]})|visit(a[2])|visit(a[3])
        if op in ('add','multiply','maximum','smooth_piecewise'):return frozenset().union(*(visit(v) for v in a))
        if op in ('inverse','sqrt_positive','log_positive','exp','sine','cosine','integer_power','source_step_derivative','ceiling'):return visit(a[0])
        if op=='actual_natural_series':return visit(a[1])|visit(a[2])
        raise ValueError('Unknown dependence operation '+op)
    return visit

def derivative_counts(a0,a1,limit=32):
    # Matrix paths, including all possible input/output coordinates. Eta
    # differentiation can remove matrix entries but cannot add a new entry.
    state=[0]*6;rows=[]
    for length in range(1,limit+1):
        state=[max([state[j]+q for mask,q in ((a0,0),(a1,1)) for j in range(6) if mask[i][j]] or [-10000]) for i in range(6)]
        maximum=max(state)
        assert maximum<=(length+1)//2
        rows.append({'operatorWordLength':length,'maximumEtaDerivatives':maximum,'universalUpper':(length+1)//2})
    return rows

class NegativeControls(unittest.TestCase):
    def setUp(self):
        import copy
        self.s=copy.deepcopy(PAYLOAD['fullNativePayloads']['picard:0'])
    def test_actual_mask(self):masks(self.s)
    def test_reject_upper_block_derivative(self):
        self.s['A1'][0][4]=1
        with self.assertRaises(ValueError):masks(self.s)
    def test_reject_changed_singular_diagonal(self):
        self.s['diagonal'][0]=-1
        with self.assertRaises(ValueError):masks(self.s)
    def test_reject_unknown_coefficient_operator(self):
        with self.assertRaises(ValueError):capture({'0':{'op':'opaque_unproved_limit','args':[]}},[0])
    def test_reject_missing_coefficient_node(self):
        with self.assertRaises(ValueError):capture({},[0])
    def test_eta_dependent_step_is_detected(self):
        f=eta_coordinates({'2':{'op':'coordinate','args':['eta']},'3':{'op':'source_step_derivative','args':[2,0]}})
        self.assertIn(2,f(3))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--diagnostics',type=Path);parser.add_argument('--out',type=Path,default=Path('work/ACTUAL_PICARD_STRUCTURE.json'));args=parser.parse_args()
    if args.diagnostics:
        PAYLOAD=json.loads(args.diagnostics.read_text(encoding='utf-8'));GRAPH=PAYLOAD['argumentAndContextGraph']
    else:
        PAYLOAD=json.loads((ROOT/'NATIVE_PAYLOADS.json').read_text(encoding='utf-8'))
        GRAPH=json.loads((ROOT/'NATURAL_ARGUMENT_GRAPH.json').read_text(encoding='utf-8'))['argumentAndContextGraph']
    system=PAYLOAD['fullNativePayloads']['picard:0']
    expected=PAYLOAD['fullNativePayloadSHA256']['picard:0']
    assert sha(system)==expected=='c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60'
    assert GRAPH['0']=={'op':'rational','args':['0','1']}
    roots=sorted(set(system['forcing']+[v for k in ('A0','A1') for row in system[k] for v in row]))
    seen=capture(GRAPH,roots);free=eta_coordinates(GRAPH)
    step=[]
    for i in sorted(seen):
        n=GRAPH[str(i)]
        if n['op']=='source_step_derivative':
            coordinates=sorted(free(n['args'][0]));assert 2 not in coordinates
            step.append({'sourceNode':i,'node':n,'argumentFreeCoordinates':coordinates,'etaIndependent':True})
    a0,a1=masks(system)
    tests=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NegativeControls))
    assert tests.wasSuccessful()
    result={'schema':'MathScope.N6.ActualPicardNilpotentStructure/1','sourceEvidenceRun':'38696116795','executionRun':os.environ.get('GITHUB_RUN_ID'),
        'sourceDefinitionSHA256':expected,'sourceDefinitionName':system['name'],'sourceMatrixA0':system['A0'],'sourceMatrixA1':system['A1'],
        'sourceDiagonal':system['diagonal'],'sourceForcing':system['forcing'],'actualCoefficientAncestorNodes':len(seen),
        'actualCoefficientOperations':dict(Counter(GRAPH[str(i)]['op'] for i in seen)),
        'actualEtaIndependentStepCalls':step,'wordDerivativeCounts':derivative_counts(a0,a1),
        'provedSourceFacts':['Actual A1 and all its eta derivatives map coordinates0..3 into4..5 and vanish on4..5.',
        'Every pair of consecutive derivative-loss operators vanishes, including derivatives of intervening A1 coefficients and the diagonal Volterra weights.',
        'Every length-k surviving operator word uses at most ceil(k/2) eta differentiations.',
        'Every actual smooth step in A0/A1/forcing is independent of eta; no holomorphic continuation of the smooth step itself in its argument is required.'],
        'conditionalConvergenceTheorem':{'operator':'Gf_i(x)=x*integral_0^1 t^c_i f_i(tx)dt; T=G(A0+A1 partial_eta)',
          'hypotheses':['Actual A0,A1,f are bounded on [0,a] times one complex eta tube.',
             'They are holomorphic in eta there and C-infinity in x as holomorphic-function-valued maps.',
             'All actual incoming natural-series, reciprocal, logarithm, square-root and integral domains are valid there.'],
          'wordBound':'||T^k Gf|| <= 2^k C^(k+1) a^(k+1)/(k+1)! * max(1,ceil(k/2)/Delta)^ceil(k/2)',
          'conclusion':'Normal convergence of the original native Picard series and every fixed finite eta/x derivative on smaller tubes; no smallness of a or evaluation of its enormous certified truncation index is needed.',
          'actualInputHypothesesProved':False},
        'negativeControls':{'tests':tests.testsRun,'successful':tests.wasSuccessful()},
        'newOriginalGuardDischarged':0,'newOriginalJetDischarged':0,'newOriginalPDEDischarged':0}
    output=args.out;output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'actualCoefficientNodes':len(seen),'etaIndependentSteps':len(step),'tests':tests.testsRun,'newDischarged':0}))
