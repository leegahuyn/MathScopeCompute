from collections import Counter
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

goal, bundle, first_dir, runtime, output = map(Path, sys.argv[1:])
sys.path.insert(0,str(goal/'first-force-repair'))
from check_repeat_forced_candidates import Graph, STREAM, Exact, read_guards, verify_path_source
from verify_repaired_first_force import bind_path

def read(parent,name,pin=None):
    body=(parent/name).read_bytes()
    digest=sha256(body).hexdigest()
    if pin:
        assert digest==pin,(name,digest)
    return json.loads(body),digest

repair=goal/'first-force-repair'
archive,archive_sha=read(bundle,'post-five-repeat-forced-candidate.json',
 '43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf')
registry,registry_sha=read(bundle,'original-source-functions.json','5d8a751e5ad4b5d2bd4efa5a1f285dc465b0a5b19b3e0bbf8113f160bb582920')
official,official_sha=read(repair,'independent-second-forced-candidates.json','3e3911a19698f1f59187a34665a86be9b1e2f6296a3fa113be1b5f12be2d5285')
waves,wave_sha=read(repair,'repeat-own-wave-operands-detailed.json','7ac31a18079dd4cabf9f190dfbca0559d1ade8ea779aa4866238cd7b935eba67')
low,low_sha=read(repair,'low-forced-collar-binding.json','f6ba2421724e70caba338fa6483dcd399af1813aea3d33ebf8835bfeeb5eb697')
ideal,ideal_sha=read(repair,'actual-raw-support-ideal.json','ba6298855c23f7e044e0a817ad244ecab7b44ffefefe786bf2909f4f0e060634')
guards,guards_sha=read(goal/'corrected-flat','seven-guards-receipt.json','722f8227d71d18041b62449d10e957ce237625ab791c50b84d2ebedb754273d1')
first,first_sha=read(first_dir,'corrected-first-force.json','c7d429adb927a3020b870df3fb755806061727ed2efc7d8df8736c785e65f835')
pins={
 'mathscope-m3/navier/source-global-current.mjs':'93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760',
 'mathscope-m3/navier/source-global-band.mjs':'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60',
 'mathscope-m2/navier/actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
}
for path,pin in pins.items():
    assert sha256((runtime/path).read_bytes()).hexdigest()==pin,path
lazy=(runtime/'mathscope-m2/navier/actual-global-source-expressions.mjs').read_text(encoding='utf8')
assert 'v=ev(x<=a?args[3]:x>=b?args[5]:args[4],env)' in lazy
repeat=goal/'primary-forced-join/active-n3-c5-binding/repeat-candidate-preflight/pinned-original/source-postfive-repeat-forced.mjs'
repeat_sha=sha256(repeat.read_bytes()).hexdigest()
assert repeat_sha=='4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7'
assert 'constructPostFiveRepeatForcing' in repeat.read_text(encoding='utf8')
assert ideal['graphSHA256']==official['graphSHA256']
assert low['officialAuditSHA256']==ideal['officialAuditSHA256']==waves['officialAuditSHA256']==official_sha
assert low['sevenGuardsSHA256']==guards_sha
assert archive['snapshot']['node_count']==4682006 and archive['registeredPositiveSystems']==40
assert official['graphSHA256']==archive['snapshot']['node_stream_sha256']==waves['graphSHA256']==low['candidateGraphSHA256']
assert official['registrySHA256']==waves['registrySHA256']==registry_sha
defs=json.loads(registry['definitions'])
expression={
 'm3_coupled_expression_partial':{row['id']:row for row in defs[0]},
 'm3_aux_expression_partial':dict(enumerate(json.loads(registry['base']['expressionDefinitions']))),
 'actual_expression_partial':dict(enumerate(json.loads(registry['base']['base']['expression']))),
}
parts=['real','imaginary']
wavecases={(row['key'],row['mode']):row for row in waves['waves']}
lowcases={(row['key'],row['mode']):row for row in low['liveLowModeSubtractions']}
formalV=622805
length=623027

with TemporaryFile() as file:
 graph=Graph(bundle/STREAM,file,archive['snapshot'])
 a=Exact(graph)
 assert graph.node(formalV)[0]=='coordinate'
 invLs=a.inv(a.of(length))

 @cache
 def cutoff_affine(pulse):
    root=a.mul(a.scalar(20),invLs,a.of(pulse))
    return a.add(root,a.scalar(-4)),a.sub(a.scalar(16),root)

 unexplained=Counter()
 used_step=Counter()
 used_definition=Counter()
 @cache
 def zero(root,pulse,side):
    if root==0:
        return True
    op,args=graph.node(root)
    if op=='add':
        return all(zero(i,pulse,side) for i in args)
    if op=='multiply':
        return any(zero(i,pulse,side) for i in args)
    if op=='integer_power' and args[1]>0:
        return zero(args[0],pulse,side)
    if op=='source_step_derivative':
        argument,order=args
        af=a.of(argument)
        for j,expected in enumerate(cutoff_affine(pulse)):
            if af==expected and (j==side or order>0):
                used_step[(root,pulse,side)]+=1
                return True
        return False
    if op in expression:
        system,actual,orders=args
        d=expression[op][system]
        matching=[f for f,x in zip(d['parameters'],actual,strict=True) if x==pulse]
        if len(matching)==1:
            inward=matching[0]
        elif d['parameters']==actual:
            inward=pulse
        else:
            unexplained[(op,d['name'])]+=1
            return False
        passed=zero(d['body'],inward,side)
        if passed:
            used_definition[(op,system,tuple(orders))]+=1
        return passed
    unexplained[(op,str(root))]+=1
    return False

 values=[]
 for (key,m),case in wavecases.items():
    pulse=case['guards'][-1][0]
    assert case['guards'][-1][1:]==[0,length]
    checks=[]
    for j,field in enumerate(case['fields']):
        for part in parts:
            for origin in ('forcedCoefficient','signedCoefficient','body'):
                root=field[part][origin]
                left,right=[zero(root,pulse,side) for side in (0,1)]
                if not all([left,right]):
                    print('FAIL wave',key,m,j,part,origin,root,left,right,flush=True)
                checks.append([j,part,origin,root,left,right])
            assert all(zero(app['root'],pulse,side) for app in field[part]['nativeApplications'] for side in (0,1))
            assert max(sum(app['orders']) for app in field[part]['nativeApplications']) <= (1 if j==3 else 2)
    values.append({'key':key,'m':m,'pulse':pulse,'checks':checks})
 tails=[]
 inherited=[]
 for template in archive['templates']:
    key=template['key']
    for row in template['rows'][:2]:
        m=row['m']
        lens=lowcases[key,m]
        pulse=lens['pulse']
        for term in row['terms']:
            if term['family']=='first-forced-remaining-source':
                assert term['value']==lens['remaining']
                assert lens['checkedZeroInitialDataAndProjection']
                assert len(lens['actualSourceRoots'])==6
                inherited.append({'key':key,'mode':m,'remaining':term['value'],
                  'firstSupportedRoots':[item['supported'] for item in lens['actualSourceRoots']]})
                continue
            for j,z in enumerate(term['value']):
                for part in parts:
                    root=z[part]
                    left,right=[zero(root,pulse,side) for side in (0,1)]
                    if not all([left,right]):
                        print('FAIL tail',key,m,term['family'],j,part,root,left,right,flush=True)
                    tails.append([key,m,term['family'],j,part,root,left,right])
 by_guard={r['key']:r['sourceGuards'] for r in guards['sourceCases']}
 first_rows={(r['key'],r['m']):r for r in first['rows']}
 pulses={r['id']:r for r in defs[3]}
 stage2={(r['key'],r['m']):r for r in archive['systems']}
 ideal_by_key={r['key']:r for r in ideal['rows']}
 verified_paths=[]
 number=0
 layers=0
 for t in archive['templates']:
    key=t['key']
    prev=first_rows[key,1]
    old=pulses[prev['system']]
    expected=by_guard[key]
    assert expected[-1]==[prev['path']['pulse'],0,length]
    assert expected[-2][0]==lowcases[key,1]['pathPreservedOwnXi']
    actuals=bind_path(graph,a,prev['path'],old,key)
    x=expected[-2][0]
    y=prev['path']['Y']
    value=a.of(x)
    a.verify_affine_atoms(value,y)
    mapped=a.affine_at(value,{u:a.of(z) for u,z in actuals.items()})
    assert not a.reduce_sqrt_two(a.clear_compound_denominators(a.sub(mapped,value)),3622)
    expected_raw=ideal_by_key[key]['checks']
    count=0
    good=[]
    for row in t['rows']:
      m=row['m']
      candidate=stage2[key,m]
      assert pulses[candidate['system']]['variable']==prev['path']['w']
      assert pulses[candidate['system']]['length']==length
      assert pulses[candidate['system']]['directions'][:3]==old['directions'][:3]
      applications=verify_path_source(graph,row,candidate,prev,expression['m3_coupled_expression_partial'])
      for j in range(3):
        for part in parts:
          check=expected_raw[count]
          assert check=={'id':f'actual-forcing-wave-support-{m}-{j}-{part}','source':row['raw'][j][part],'reduced':0}
          layers+=read_guards(graph,row['guarded'][j][part],row['supported'][j][part],expected)
          count+=1
          number+=1
      good.append({'mode':m,'system':candidate['system'],'mapped':applications})
    assert count==24
    # A changed pulse cannot yield the same exact section, even when the
    # other chart arguments stay fixed. A wrong body drops a guard check.
    bad=dict(prev['path'])
    bad['Hw']=list(reversed(prev['path']['Hw']))
    try:
       bind_path(graph,a,bad,old,key)
    except (AssertionError,ValueError):
       pass
    else:
       raise AssertionError('swapping actual H_w coordinates passed')
    verified_paths.append({'key':key,'originalPath':prev['path'],'slowAndShellGuards':expected[:5],
       'transverseGuard':expected[-2],'pulseGuard':expected[-1],'verifiedSystems':good})
 assert number==240 and layers==1680 and len(verified_paths)==10 and len(inherited)==20
 all_ok=all(all(c[-2:]) for row in values for c in row['checks']) and all(all(c[-2:]) for c in tails)
 assert all_ok
 assert graph.node(3862106)==('multiply',[3687251,3861788])
 assert graph.node(3861788)[0]=='m3_forced_pulse_partial'
 assert zero(3862106,3675304,1) and not zero(3861788,3675304,1)
 assert graph.node(3861788)[1][3]==3675304
 print('PASS closed original pulse: 240 component slots, 40 systems, 1680 guards',flush=True)
 data={'schema':'MathScope.N6.ArchivedRepeatClosedPulseGuardRemoval/1','run':43015175416,
       'inputs':{'archive':archive_sha,'graph':official['graphSHA256'],'registry':registry_sha,'priorCandidateCheck':official_sha,
            'waveBodies':wave_sha,'firstCollarIdeal':low_sha,'rawWaveIdeal':ideal_sha,'firstForce':first_sha,
            'sevenGuards':guards_sha,'originalRepeatModule':repeat_sha,**pins},
       'graphNodes':len(graph.offsets),'componentSlots':number,'lazyGuards':layers,'pathRows':verified_paths,
       'cutoffAssignments':[[node,pulse,side] for node,pulse,side in sorted(used_step)],
       'actualWaveBodies':values,'directFlatTerms':tails,'inheritedFirstRemainingSource':inherited,
       'nativeDefinitionDerivativeUses':len(used_definition),
       'rightCollarControl':{'particularDerivativeTerm':3862106,'actualDpsi':3687251,
               'particularNativeState':3861788,'statePulseArgument':3675304,
               'droppingDpsiNotSupported':True,'actualStateNonzeroInferred':False},
       'conclusion':'At actual H_w on 0<=w<=Ls with strict four original slow offset guards, strict shell Xa<X<Xb, and |xi|<r0, every guarded component equals the original unclipped supported component wherever the original ordinary operands are admitted. In the open pulse the seven branches return the body; at either endpoint the whole supported body vanishes by the collar proof. Endpoint pulse derivatives are one-sided and zero where the original native derivatives are admitted.',
       'remaining':'The five slow/shell guards, the transverse guard and its extension, ordinary admission outside the guarded chart and N3 same-live transport are separate obligations.',
       'verifiedSymbolicOnly':True,'finalJets':0,'release':'HOLD'}
 with output.open('x',encoding='utf8',newline='\n') as stream:
    json.dump(data,stream,indent=2)
    stream.write('\n')
