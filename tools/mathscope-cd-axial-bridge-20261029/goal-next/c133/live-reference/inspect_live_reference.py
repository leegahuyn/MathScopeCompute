#!/usr/bin/env python3
"""Read the small actual Repeat append and selected nearby reference AST."""
import argparse,gzip,hashlib,json
from fractions import Fraction
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--artifact',type=Path,required=True);p.add_argument('--active-readback',type=Path,required=True);p.add_argument('--joint',type=Path,required=True);p.add_argument('--band-source',type=Path,required=True);p.add_argument('--predecessor-manifest',type=Path,required=True);p.add_argument('--predecessor-registry',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();P=a.artifact
pins={'candidate':('active-n3-repeat-forced-candidate.json','b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e'),
 'registry':('active-n3-repeat-forced-source/original-source-functions.json','62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce'),
 'manifest':('active-n3-repeat-forced-source/original-source-export-manifest.json','04351d6619a0d782ac108f231efc67ffbd35c2f88e7951f2b1b14445a8ca59a2')}
D={}
for k,(rel,h) in pins.items():
 raw=(P/rel).read_bytes();assert hashlib.sha256(raw).hexdigest()==h,k;D[k]=json.loads(raw)
c=D['candidate'];m=D['manifest'];native=D['registry'];defs=json.loads(native['definitions'])
full_raw=a.active_readback.read_bytes();assert hashlib.sha256(full_raw).hexdigest()=='49c39b69df109650688cb21e8331fe53ffc65da1e8f899d1fa97c61a67cce2c4';full=json.loads(full_raw)
assert full['status']=='VERIFIED_ACTUAL_ACTIVE_N3_REPEAT_APPEND_AND_GUARD_INTERIOR_STAGE_TWO_OPEN'
assert full['manifestSHA256']==pins['manifest'][1] and full['registrySHA256']==pins['registry'][1] and full['candidateSHA256']==pins['candidate'][1]
assert full['stream']['sha256']==m['node_stream_sha256'] and full['stream']['nodes']==m['node_count']
assert full['stream']['protectedPrefixNodes']==22155584 and full['stream']['protectedPrefixCompleteHash']=='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
old_raw=a.predecessor_manifest.read_bytes();assert hashlib.sha256(old_raw).hexdigest()=='8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a';old=json.loads(old_raw)
old_defs_raw=a.predecessor_registry.read_bytes();assert hashlib.sha256(old_defs_raw).hexdigest()=='e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03'
old_defs=json.loads(json.loads(old_defs_raw)['definitions'])
assert old_defs[0]==defs[0][:len(old_defs[0])] and old_defs[1]==defs[1] and old_defs[2]==defs[2] and old_defs[3]==defs[3][:len(old_defs[3])]
assert old['node_count']==22155584 and old['node_stream_uncompressed_bytes']==1024352367
assert old['extended_coupled_function_counts']==[1355,29,2,20,0] and m['extended_coupled_function_counts']==[2269,29,2,60,0]
joint_raw=a.joint.read_bytes();assert hashlib.sha256(joint_raw).hexdigest()=='411d526087ae7aa5e2fd281f1a10fb6b659cb390fc5da1004bdebd81f6d3a6b5';joint=json.loads(joint_raw)
band=a.band_source.read_bytes();assert hashlib.sha256(band).hexdigest()=='a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b'
for fragment in ('chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T)','left:q(1,2),right:q(2),derivativeLower:q(1,2)'):
 assert fragment in band.decode()
assert joint['exactGuard']['strictS']=='max(1/2,b/2)<s<min(2,2b)' and joint['exactGuard']['minimumAdditionalStrictGivenOwnPositive']=='abs(t-ell_ref)<1'
assert c['preRepeatNodeCount']==22155584 and c['postRepeatNodeCount']==m['node_count']==22380596
assert m['node_stream_sha256']=='7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2'
assert m['definitions_sha256']==pins['registry'][1] and c['sourceModuleSHA256']=='4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7'
systems=[q for q in defs[0] if q.get('name','').startswith('PostFiveRepeatMeanVelocity_')]
systems.sort(key=lambda x:x['name']);assert len(systems)==3
assert [x['id'] for x in systems]==['coupled-expression:1355','coupled-expression:1356','coupled-expression:1357']
assert all(x['parameters']==[17732748,17732749,17732750,17732737,17745430,17745431] for x in systems)
assert [x['body'] for x in systems]==[22155584,22155585,22155586]
indexed={x['id']:x for x in defs[1]}
ids=[f'coupled-field:{i}' for i in (*range(9,13),*range(16,20))]
assert [x['field'] for x in c['fields']]==ids
fields=[indexed[x] for x in ids];assert all(len(x['rows'])==162 for x in fields)
def rowmap(row):return {k:row[k] for k in ('values','guards','derivativeMaps','coefficient','label')}
baseline=[rowmap(x) for x in fields[0]['rows']]
assert all([rowmap(x) for x in field['rows']]==baseline for field in fields)
assert len({r['label']['key'] for r in baseline})==81
for row in baseline:
 assert len(row['guards'])==5 and len(row['values'])==16
 assert row['values'][:3]==[17732748,17732749,17732750]
 assert row['values'][3]==row['label']['ell'] and row['values'][7]==17732737
zpath=P/'active-n3-repeat-forced-source/original-source-nodes.jsonl.gz'
# Skip line bytes without decoding or parsing the previous ~21 million records.
lo,hi=21435270,21435430;near={}
with gzip.open(zpath,'rb') as f:
 header=json.loads(f.readline())
 assert header=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':m['node_count']}
 for i,line in enumerate(f):
  if i>hi:break
  if i>=lo:near[i]=json.loads(line)
with gzip.open(zpath,'rb') as f:
 f.readline();first={i:json.loads(f.readline()) for i in range(282)}
assert first[20]=={'op':'rational','args':['-1','1']} and first[24]=={'op':'rational','args':['2','1']}
assert first[9]=={'op':'source_parameter','args':['h']} and first[19]=={'op':'rational','args':['1','2']}
assert first[21]=={'op':'multiply','args':[9,20]} and first[22]=={'op':'add','args':[19,21]} and first[23]=={'op':'add','args':[9,19]}
# Affine exponents (constant, coefficient of h): D=1/2-h implies
# -2D-2h=-1, exactly the power needed in the chart substitution.
Dexp=(Fraction(1,2),Fraction(-1));hexp=(Fraction(0),Fraction(1))
assert tuple(-2*x-2*y for x,y in zip(Dexp,hexp))==(Fraction(-1),Fraction(0))
assert first[127]=={'op':'log_positive','args':[24]} and first[281]=={'op':'multiply','args':[20,23]}
assert near[21435315]['op']=='coordinate' and near[21435315]['args'][0].startswith('initialized_angular_reference_band$')
for n,op,args in ((21435321,'multiply',[20,21435315]),(21435322,'add',[17732737,21435321]),
 (21435323,'multiply',[127,21435322]),(21435324,'exp',[21435323]),
 (21435325,'sqrt_positive',[21435324]),(21435326,'inverse',[21435325]),(21435327,'multiply',[17732748,21435326]),
 (21435328,'log_positive',[21435324]),(21435329,'multiply',[22,21435328]),(21435330,'exp',[21435329]),
 (21435331,'inverse',[21435330]),(21435332,'multiply',[17732749,21435331]),
 (21435333,'inverse',[21435324]),(21435334,'multiply',[17732750,21435333]),
 (21435339,'multiply',[281,21435328]),(21435340,'exp',[21435339])):
 assert near[n]=={'op':op,'args':args},n
with gzip.open(zpath,'rb') as f:
 # Offset is the separately pinned exact 22,155,584-node predecessor length;
 # this script does not authenticate the complete compressed stream itself.
 f.seek(1024352367);append={22155584+i:json.loads(f.readline()) for i in range(28)}
values=[21435327,21435332,21435334,21435315,17745430,17745431]
for j in range(3):
 root=22155604+2*j;actual=append[root]
 assert actual=={'op':'m3_coupled_expression_partial','args':[systems[j]['id'],values,[0]*6]}
 assert append[root+1]=={'op':'multiply','args':[21435340,root]}
assert [v['real'] for v in c['mean']['velocity']]==[22155605,22155607,22155609]
assert all(v['imaginary']==0 for v in c['mean']['velocity'])
assert append[22155610]['op']=='m3_coupled_expression_partial'
assert append[22155610]['args'][1]==values
result={'schema':'MathScope.C133.LiveRepeatReferencePartialReadback/1','status':'LIVE_REGISTRY_AND_SELECTED_NODE_MATCH_INDEPENDENT_FULL_SOURCE_READBACK',
 'manifestNodeCount':m['node_count'],'manifestNodeSHA256':m['node_stream_sha256'],'liveRegistry':systems,
 'actualMeanValues':values,'actualScaleRoot':21435340,'actualApplicationRoots':[22155604,22155606,22155608],
 'actualReferenceMap':{'ratioRoot':21435324,'ratio':'2^(ell_own-ell_ref)','R':'R/sqrt(ratio)','Z':'Z/ratio^D','T':'T/ratio','label':'ell_ref','torus':'same Y0,Y1','meanScale':'ratio^(-A)'},
 'chartScaleIdentity':{'equation':'F(s;Z,T)=s-Z^2*s^(2h)-T','exact':'F(s/b; Z/b^D, T/b)=F(s;Z,T)/b','condition':'b>0, s>0, D=1/2-h; equality itself does not prove bracket membership','originalBandSourceSHA256':hashlib.sha256(band).hexdigest()},
 'actualIndexedFieldReadback':{'fields':ids,'rowsPerField':162,'distinctBoxes':81,'guardsPerRow':5,'allEightRowMapsIdentical':True,'localOwnLabelSlot':3,'localReferenceLabelSlot':7,'outerReferenceLabelRoot':17732737,'firstRow':baseline[0],'lastRow':baseline[-1]},
 'independentFullSourceReadbackSHA256':'49c39b69df109650688cb21e8331fe53ffc65da1e8f899d1fa97c61a67cce2c4',
 'sourceFieldRegistration':'OPEN: candidate adds no indexed field; actual registration and full physical source-field closure remain separate.',
 'registryCountsBefore':old['extended_coupled_function_counts'],'registryCountsAfter':m['extended_coupled_function_counts'],'newIndexedFields':0,
 'unchangedPredecessorRegistry':{'indexedRowsExact':True,'expressionAndPulsePrefixesExact':True,'inverseSystemsExact':True,'predecessorRegistrySHA256':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03'},
 'jointGuard':joint['exactGuard']['strictS'],'closedGuard':joint['exactGuard']['closedS'],
 'allChartUnresolved':'Need each active indexed row to bind its own and reference labels and to prove the actual outer reference admission, guarded branch reachability and chart/ratio premises at all physical points. Endpoint equalities require closed traces or an independently established ordinary extension; C120 alternative labels are not automatic reindexing.',
 'actualOutputRoots':[22155605,22155607,22155609],'nearbyReferenceNodes':near,'appendStart':append,'pins':pins,
 'scope':'Only selected nodes and native registry are scanned here; source integrity is cross-checked against the pinned independent full-source readback rather than recomputed here. Actual source-field registration, original native guard/binding closure, C121 joint guard and physical all-chart assumptions remain separately necessary.',
 'release':'HOLD'}
a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_bytes((json.dumps(result,indent=2)+'\n').encode());print('PASS live reference and 162-row mapping, cross-checked with independent full stream; field registration OPEN')
