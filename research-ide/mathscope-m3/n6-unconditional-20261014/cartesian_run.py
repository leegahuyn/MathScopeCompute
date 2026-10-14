"""Bounded source-pinned Cartesian frontier and fixed-label chart audit.

No source producer, stored derivative helper or public progress file is edited.
Finite chart checks are explicitly separated from analytic whole-field proof.
"""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime, timezone
from fractions import Fraction as Q
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
sys.path.insert(0, str(HERE.parent / 'n6-continuation-20261014'))
from pde_replay import replay, js_hash, require, digest, reduce_sqrt2

PARENT = '7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
ANGULAR_SHA = 'ba60de00a1e41f9c448da3aabcbf791bc4649b5fcfd99cff7a71865463db8b14'
BASE = REPO / 'research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291'
HEADER_SHA = '010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c'
DB_SHA = 'ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003'


def read(path):
    return json.loads(path.read_text(encoding='utf8'))


def save(path, value):
    raw = (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('xb') as stream:
        stream.write(raw)
    return {'path': str(path), 'bytes': len(raw), 'sha256': digest(raw)}


def definition_key(node):
    op, a = node['op'], node['args']
    if op == 'actual_expression_partial': return f'expression:{a[0]}'
    if op == 'm3_aux_expression_partial': return f'expressionDefinitions:{-1-a[0]}'
    if op == 'm3_aux_indexed_partial': return f'fieldDefinitions:{a[0]}'
    if op == 'm3_aux_inverse_partial': return f'inverseDefinitions:{a[0]}'
    if op == 'actual_monotone_root': return f'monotone:{a[0]}'
    return None


def actual_slow_jets(cartesian, nodes, definitions):
    """Prove the actual implicit first derivatives on its ORIGINAL image.

    This is a local-function proof at every point of the source image. It does
    not assert that all global source PDE arguments satisfy that image guard.
    """
    expected = {
        9: {'op':'source_parameter','args':['h']},
        19: {'op':'rational','args':['1','2']},
        20: {'op':'rational','args':['-1','1']},
        24: {'op':'rational','args':['2','1']},
        25: {'op':'multiply','args':[9,24]},
        622820: {'op':'actual_monotone_root','args':[2,622803,622804]},
        622811: {'op':'integer_power','args':[622803,2]},
        622812: {'op':'log_positive','args':[622810]},
        622813: {'op':'multiply','args':[25,622812]},
        622814: {'op':'exp','args':[622813]},
        622815: {'op':'multiply','args':[622811,622814]},
        622816: {'op':'multiply','args':[20,622815]},
        622817: {'op':'add','args':[622810,622816]},
        622818: {'op':'multiply','args':[20,622804]},
        622819: {'op':'add','args':[622817,622818]},
    }
    for ident, value in expected.items():
        require(nodes.get(ident) == value, f'Changed actual implicit body: {ident}')
    definition = definitions['monotone:2']['definition']
    require({k:definition[k] for k in ['variable','parameters','body','left','right']} ==
        {'variable':622810,'parameters':[622803,622804],'body':622819,'left':19,'right':24}, 'Changed original slow chart binding')
    # Recompute the strict rational collar bounds rather than accepting a flag.
    h_upper, distance = Q(1,64), Q(1,256)
    bounds = {'sourceImageFsFloor': 1-8*h_upper, 'commonCollarFsFloor':1-32*h_upper,
        'collarLeftEndpointMargin':Q(1,8)-13*distance,
        'collarRightEndpointMargin':Q(1,2)-13*distance}
    require(bounds['sourceImageFsFloor'] > Q(1,2) and bounds['commonCollarFsFloor'] == Q(1,2)
        and min(bounds['collarLeftEndpointMargin'],bounds['collarRightEndpointMargin'])>0,
        'Actual implicit common-collar lower bound failed')
    program = cartesian['scalarProgram']
    rows=[]
    for request in cartesian['diagnostics']['unresolvedActualJetRequests']:
        base=program[request['base']]
        if base['op']!='actual_opaque_value' or base['args'][0]!=622820: continue
        coordinates=[program[i]['args'][1] for i in request['orderedDifferentiationCoordinates']]
        require(len(coordinates)==1, 'A new higher-order slow-chart request needs explicit review')
        variable=coordinates[0]
        formula='2*Z*s^(2h)/Fs' if variable==622803 else '1/Fs' if variable==622804 else '0'
        rows.append({**request, 'baseSourceNode':622820,'requestedSourceCoordinates':coordinates,
            'status':'PROVED_EXACT_SLOW_CHART_JET_ON_ORIGINAL_IMAGE','derivativeComputed':True,
            'exactExpression':formula,'Fs':'1-2*h*Z^2*s^(2h-1)',
            'sourceImplicitBodyVerified':True, 'validOn':'original source image and its common open collar',
            'allGlobalPDEArgumentsProvedInsideThisDomain':False,
            'proof':'Differentiate the verified elementary identity F(s;Z,T)=0. The actual Fs has the strict uniform collar floor, so the implicit-function theorem gives the derivative. R, Y0, Y1 and theta do not enter this exact defining body or its input tuple.'})
    require(len(rows)==5, 'Actual original slow-root five-request frontier changed')
    return {'rows':rows,'definitionKey':'monotone:2','definition':definition,
        'sourceImage':'(Z,T)=(s0^(1/2-h)*eta,s0*(1-eta^2)), 1/2<=s0<=2, -1<=eta<=1',
        'actualHUpperNeeded':'0<h<1/64', 'bounds':{k:str(v) for k,v in bounds.items()},
        'proof':['On the actual image, F(s0;Z,T)=0 because Z^2*s0^(2h)=s0*eta^2.',
            'Throughout the original bracket, Z^2*s^(2h-1)<4 and Fs>1-8h>7/8. Strict monotonicity gives the unique source root.',
            'On the 1/256 collar use |Z|<2, 1/4<s<3. Then Fs>1-32h>1/2. The endpoint perturbation is at most 13/256; the two recomputed margins are 19/256 and 115/256.',
            'The elementary F is smooth for s>0. The implicit-function theorem and uniqueness glue a smooth common-collar function. No series, Fourier inverse or Picard theorem is invoked for this leaf.'],
        'globalPDEDomainObligationDischarged':False,'wholeSourceFunctionExistenceProved':False}


def run(artifacts, source_inputs, output):
    started=time.monotonic();output.mkdir(parents=True, exist_ok=True)
    # Replay all exact rational terms and KEEP every original and remaining
    # monomial. No graph producer is reopened or a missing jet replaced.
    pde = replay(artifacts, output/'rational')
    folder=artifacts/'mean-proof-residual-38500114302'
    if not folder.is_dir(): folder=artifacts
    frontier=read(folder/'residual-actual-atoms-and-frontier.json')
    cartesian=read(folder/'residual-independent-cartesian-jets.json')
    summary=read(folder/'residual-audit-summary.json')
    witnesses={}
    for w in frontier['sourceWitnesses']+cartesian['diagnostics']['sourceBindings']+summary['sourceRoots']:
        require(js_hash(w['node'])==w['nodeSHA256'],'Changed actual source witness')
        require(w['sourceNode'] not in witnesses or witnesses[w['sourceNode']]==w,'Conflicting actual source witness')
        witnesses[w['sourceNode']]=w
    definitions={d['key']:d for d in frontier['definitionBindings']}
    for d in definitions.values(): require(js_hash(d['definition'])==d['definitionSHA256'],'Changed actual registry body')
    nodes={ident:w['node'] for ident,w in witnesses.items()}
    # Reopen just the source-pinned common chart theorem (small SQLite prefix),
    # not the full parent. This validates actual h and original producer bytes.
    input_receipt=read(source_inputs/'input-receipt.json')
    for name, pin in [('dag/header.json',HEADER_SHA),('dag/source-dag-checkpoint.sqlite',DB_SHA)]:
        raw=(source_inputs/name).read_bytes();member=next(m for m in input_receipt['members'] if m['path']==name)
        require(digest(raw)==pin==member['sha256'] and len(raw)==member['bytes'],'Changed source input member')
    from analytic_initial_source import run as chart_domain_run
    chart_domain=chart_domain_run(REPO, source_inputs.parent, output/'source-chart')
    require(chart_domain['source']['parentNodesSHA256']==PARENT,'Changed chart source parent')
    slow=actual_slow_jets(cartesian,nodes,definitions)
    core_input={'cartesian':cartesian,'sourceWitnesses':list(witnesses.values()),'definitionBindings':list(definitions.values()),'slowChartProof':slow}
    checkpoint=save(output/'checkpoints/cartesian-source-checkpoint.json',core_input)
    command=['node',str(HERE/'cartesian-closure.mjs'),'--input',str(output/'checkpoints/cartesian-source-checkpoint.json'),'--output',str(output)]
    process=subprocess.run(command,capture_output=True,text=True,encoding='utf8',timeout=240)
    (output/'cartesian-core.log').write_text(process.stdout+process.stderr,encoding='utf8')
    require(process.returncode==0,'Independent Cartesian chart core failed; see preserved cartesian-core.log')
    core=read(output/'cartesian-closure-core.json')
    require(len(core['selectors']['closed'])==23,'Primitive selector frontier changed')
    slow_results={r['result'] for r in slow['rows']}
    still_open=[r for r in core['selectors']['open'] if r['result'] not in slow_results]
    inventory=[]
    for r in still_open:
        base=cartesian['scalarProgram'][r['base']]
        while base['op']=='unresolved_opaque_substitution':base=cartesian['scalarProgram'][base['args'][0]]
        sid=base['args'][0] if base['op']=='actual_opaque_value' else None
        n=nodes.get(sid);key=definition_key(n) if n else None;binding=definitions.get(key)
        inventory.append({**r,'baseSourceNode':sid,'actualSourceNode':n,'actualDefinitionKey':key,
            'actualDefinitionName':binding['name'] if binding else None,'actualDefinitionSHA256':binding['definitionSHA256'] if binding else None,
            'allActualApplicationArgumentsRetained':True,'analyticClassProved':False,
            'minimalObligation': 'C2 all-row compact-cover gluing and exact local chain rule' if n and 'indexed' in n['op'] else
                'Actual Fourier inverse existence, common source parameter neighborhood and uniform differentiated tails' if n and 'inverse_partial' in n['op'] else
                'Actual defining-body differentiability on all source arguments; source limits and domain guards must remain in the proof'})
    angular_raw=(BASE/'initialized-angular-construction.json').read_bytes();require(digest(angular_raw)==ANGULAR_SHA,'Changed actual initialized angular construction')
    angular=json.loads(angular_raw)
    stage={'status':'SAME_DECLARED_INITIALIZED_STAGE_COUPLED_NODES_ARE_RESIDUAL_FIELDS',
        'sourceSnapshotSHA256':ANGULAR_SHA,'schema':angular['schema'],
        'sourceVelocityRoots':angular['global']['velocity'],'sourcePressureRoot':angular['global']['pressure'],
        'forcedInverseApplied':angular['scope']['forcedInverseApplied'],
        'coupledResidualFields':[{'sourceNode':3825003+i,'node':nodes[3825003+i],
          'definitionKey':f'definitions:1:{i}','definitionName':definitions[f'definitions:1:{i}']['name']} for i in range(3)],
        'conclusion':'The three coupled indexed roots name initialized angular RESIDUAL fields, not omitted velocity updates. Their absence from direct velocity leaves is expected. Structural inspection therefore provides no stage-mismatch counterexample.',
        'directAssembledIdentityProved':False,'mathematicalCounterexampleClaimed':False}
    require(stage['sourceVelocityRoots']==[3825006,3825007,3825008] and stage['sourcePressureRoot']==3825009
        and stage['forcedInverseApplied'] is False,'Changed actual Cartesian target stage')
    bybase=Counter((r['baseSourceNode'],r['actualDefinitionKey']) for r in inventory)
    result={'schema':'MathScope.N6.IndependentCartesianClosure/1',
        'status':'28_ORIGINAL_JET_REQUESTS_CLOSED_ON_DECLARED_DOMAINS_FULL_CARTESIAN_PDE_OPEN',
        'baselineCommit':'a08d9de1777cf460e6fa980674c5c70939201457',
        'implementationCommit':__import__('os').environ.get('GITHUB_SHA') or subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip(),
        'reusedPDEArtifactCommit':'ba87dc9c09567c9a486d424ffb3e63a7eb04a12d','originalNodesSHA256':PARENT,
        'initialUnresolvedCartesianJets':393,'primitiveSelectorJetsClosed':23,'sourceSlowChartJetsClosed':5,
        'closedIndependentJets':28,'remainingUnresolvedCartesianJets':len(inventory),
        'remainingByActualBase':[{'sourceNode':s,'definitionKey':k,'requestCount':v} for (s,k),v in sorted(bybase.items(),key=lambda r:str(r[0]))],
        'originalGuardsRetained':cartesian['diagnostics']['conditionalDomainHypotheses'],
        'originalDomainGuardCount':len(cartesian['diagnostics']['conditionalDomainHypotheses']),
        'globalGuardsDischargedByThisAudit':0,'closedSelectorRequests':core['selectors']['closed'],
        'sourceSlowChartProof':slow,'remainingUnresolvedRequests':inventory,
        'reducedNumeratorTermsByComponent':[c['reducedMonomials'] for c in pde['components']],
        'totalReducedNumeratorTerms':pde['reducedMonomials'],'newAlgebraMonomialsCancelled':0,
        'indexedMapSummary':[{'definitionKey':f['definitionKey'],'rows':f['actualRows'],
          'coefficientConstancyPasses':f['coefficientConstancyPasses'],
          'conditionalFixedLabelCoefficientConstancyPasses':f['conditionalFixedLabelCoefficientConstancyPasses'],
          'conditionalFixedLabelJacobianPasses':f['conditionalFixedLabelJacobianPasses']} for f in core['maps']['fields']],
        'stageDiagnosis':stage,'allRemainingMonomialsAndFailuresRetained':True,
        'appliedCartesianPDECheckpoint':'cartesian-applied-pde-checkpoint.json',
        'proofBoundary':{'opaqueRegisteredDerivativesUsedAsOracle':False,'unknownJetReplacedByZero':False,
          'fixedLabelsFrozenOnlyForConditionalLocalMapChecks':True,'globalIndexedJoinsProved':False,
          'fullCartesianPDEIndependentVerification':False,'numericalDomainAndErrorEnclosure':False,
          'originalN601Complete':False,'originalN602Complete':False,'original56Of64Changed':False},
        'checkpoint':checkpoint,'elapsedSeconds':time.monotonic()-started}
    require(result['remainingUnresolvedCartesianJets']==365 and result['originalDomainGuardCount']==94,
        'Unexpected frontier closure count; review before promotion')
    record=save(output/'cartesian-closure-result.json',result)
    save(output/'cartesian-closure-execution.json',{'schema':'MathScope.N6.CartesianClosure.Execution/1',
        'sourceCommit':__import__('os').environ.get('GITHUB_SHA'), 'finishedAtUTC':datetime.now(timezone.utc).isoformat(),
        'elapsedSeconds':time.monotonic()-started,'limits':{'nodeCoreSeconds':240,'rationalReplaySeconds':120},
        'implementationSHA256':digest(Path(__file__).read_bytes()),'result':record,'sourceInputsVerified':True,
        'completionImpliesWholeN6Certification':False})
    print(json.dumps({k:result[k] for k in ['status','initialUnresolvedCartesianJets','closedIndependentJets',
        'remainingUnresolvedCartesianJets','originalDomainGuardCount','totalReducedNumeratorTerms','indexedMapSummary']}))
    return result


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--artifacts',required=True,type=Path)
    parser.add_argument('--source-inputs',required=True,type=Path);parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    try:run(args.artifacts,args.source_inputs,args.output)
    except Exception as error:
        args.output.mkdir(parents=True,exist_ok=True)
        save(args.output/'cartesian-closure-failure.json',{'status':'FAILED','type':type(error).__name__,
          'message':str(error),'originalN601Complete':False,'originalN602Complete':False})
        raise


if __name__=='__main__':main()
