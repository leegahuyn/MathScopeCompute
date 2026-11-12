"""Make reversible scratch overlays for large native graph seal call sites."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

def digest(data):return hashlib.sha256(data).hexdigest()

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--runtime',type=Path,required=True);p.add_argument('--out',type=Path)
 p.add_argument('--owned',action='store_true',help='Patch the explicitly owned runtime in place after all target source pins and reversals pass.')
 p.add_argument('--helper',type=Path,required=True);p.add_argument('--background-overlay',type=Path)
 p.add_argument('--receipt',type=Path,required=True);a=p.parse_args()
 m2='research-ide/mathscope-m2/navier/';m3='research-ide/mathscope-m3/navier/'
 expected={m2+'actual-compact-all-band-background-norms.mjs':{'62d877ca5d45073c8e95862bc0f5d0d44197f8ace34bd77d885bfbececc69464','7c8137302c6d2716a41fdf7c7eaeb29acfe527a005bd1c1dfb2eb5b7cfb5fefe'},
  m2+'actual-common-admissible-family.mjs':{'7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75'},
  m2+'actual-common-admissible-band.mjs':{'41a1fb93ec6384a3999761913ede62d374bce077810c366cbb6c2a065c71d28a'},
  m2+'actual-common-target-weighted-norms.mjs':{'6fca53620e45a839868d094a1425ee0071ec4ca21c16bff77476d8be2f32e38a'},
  m3+'source-global-band.mjs':{'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60','085f21f84de6c0dcb3739fc6e8d51b3c88cf3bf20b43a14c308fe924a34b0c41'},
  m3+'source-global-representative.mjs':{'f3fbcf74b42c59cbfdd563e0fddcba9fab5cad782a96695930e3445c50373541'},
  m3+'source-global-current.mjs':{'93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760'}}
 if a.owned:
  assert a.out is None or a.out.resolve()==a.runtime.resolve(),'In owned mode --out must be omitted or the owned checkout.'
  assert a.background_overlay is None,'Apply the existing background overlay before owned mode.'
  a.out=a.runtime;raw=b''
  for name,pins in expected.items():assert digest((a.runtime/name).read_bytes()) in pins,name
 else:
  assert a.out is not None and a.out.resolve()!=a.runtime.resolve()
  raw=(a.runtime/'GIT-SOURCE-SHA256.json').read_bytes()
  assert digest(raw)=='4ed49674a762ecf54adaa8ddf9b5c0955c484b5442dc251d862f0156f502f066'
  manifest=json.loads(raw);assert len(manifest)==119
  for name,pin in manifest.items():assert digest((a.runtime/name).read_bytes())==pin,name
  shutil.copytree(a.runtime,a.out,dirs_exist_ok=True)
 helper=a.helper.read_bytes()
 wrapper=b"\nimport {canonicalStringify as _originalCanonical} from '../../mathscope-m0/contracts.mjs';\nconst _prefix=(nodes,count,fn)=>{if(!Number.isSafeInteger(count)||count<0||count>nodes.length)throw TypeError('Invalid prefix');return captureNodePrefix(count===nodes.length?nodes:nodes.slice(0,count),fn)};\nexport const captureNodes=(nodes,count=nodes.length)=>_prefix(nodes,count,_originalCanonical);\nexport const captureRawNodes=(nodes,count=nodes.length)=>_prefix(nodes,count,JSON.stringify);\nexport const makeProgramSnapshot=packed=>makeSnapshot(packed,_originalCanonical);\nexport const sameNodePrefix=(a,b,count)=>compareNodePrefixes(a,b,count,_originalCanonical);\n"
 pending={m2+'mathscope-large-seal.mjs':helper+wrapper}
 if a.background_overlay:
  src=a.background_overlay.read_bytes();assert digest(src)=='7c8137302c6d2716a41fdf7c7eaeb29acfe527a005bd1c1dfb2eb5b7cfb5fefe'
  pending[m2+'actual-compact-all-band-background-norms.mjs']=src
 inventories=[]
 def transform(name,edits):
  path=a.out/name;before=(pending[name].decode('utf8') if name in pending else path.read_text(encoding='utf8'));value=before;reversed_edits=[]
  for old,new in edits:
   assert value.count(old)==1,(name,old[:180],value.count(old))
   pos=value.index(old);value=value[:pos]+new+value[pos+len(old):];reversed_edits.append((old,new,pos))
  restored=value
  for old,new,pos in reversed(reversed_edits):
   assert restored[pos:pos+len(new)]==new,(name,pos)
   restored=restored[:pos]+old+restored[pos+len(new):]
  assert restored==before,name
  pending[name]=value.encode('utf8')
  inventories.append({'file':name,'inputSHA256':digest(before.encode()),'overlaySHA256':digest(value.encode()),'edits':len(edits),'exactByteReversal':True})
 def imports(pre):return ("/** Compact all-band", "import {captureNodes,makeProgramSnapshot,canonicalHash} from './mathscope-large-seal.mjs';\n/** Compact all-band")
 # Original definitions and data checks remain; node/program seals use exact
 # frozen-record identity and canonical-equality fallback, not hash equality.
 bg=m2+'actual-compact-all-band-background-norms.mjs'
 transform(bg,[imports(None),
  ('originalPrefix=canonicalStringify(G.nodes)','originalPrefix=captureNodes(G.nodes)'),
  ('canonicalStringify(G.nodes.slice(0,originalCount))===originalPrefix','originalPrefix.verify(G.nodes)'),
  ('result.program=JSON.parse(canonicalStringify(packed));','const largeSnapshot=makeProgramSnapshot(packed);result.program=largeSnapshot.program;'),
  ('nodeCount:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:data(result),program:canonicalStringify(result.program)',
   'nodeCount:G.nodes.length,largeSnapshot,definitions:G.captureFunctionDefinitions(),data:data(result)'),
  ('canonicalStringify(s.G.nodes.slice(0,s.nodeCount))!==s.prefix||!s.G.functionDefinitionsUnchanged(s.definitions)||data(result)!==s.data||canonicalStringify(result.program)!==s.program',
   '!s.largeSnapshot.verify(s.G.nodes,result.program)||!s.G.functionDefinitionsUnchanged(s.definitions)||data(result)!==s.data'),
  ('const s=seals.get(result),text=s.program;','const s=seals.get(result),encoded=canonicalHash(result.program);'),
  ('sha256:await sha256(text),nodeCount:s.nodeCount,compilerBytes:new TextEncoder().encode(text).length','sha256:encoded.sha256,nodeCount:s.nodeCount,compilerBytes:encoded.bytes')])
 imp="import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';"
 fam=m2+'actual-common-admissible-family.mjs'
 transform(fam,[(imp,"import {captureNodes,makeProgramSnapshot,canonicalHash} from './mathscope-large-seal.mjs';\n"+imp),
  ('originalPrefix=canonicalStringify(G.nodes)','originalPrefix=captureNodes(G.nodes)'),
  ('canonicalStringify(G.nodes.slice(0,originalCount))===originalPrefix','originalPrefix.verify(G.nodes)'),
  ('result.program=JSON.parse(canonicalStringify(packed));','const largeSnapshot=makeProgramSnapshot(packed);result.program=largeSnapshot.program;'),
  ('count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:data(result),program:canonicalStringify(result.program)',
   'count:G.nodes.length,largeSnapshot,definitions:G.captureFunctionDefinitions(),data:data(result)'),
  ('data(p)!==s.data||canonicalStringify(p.program)!==s.program||canonicalStringify(p.G.nodes.slice(0,s.count))!==s.prefix',
   'data(p)!==s.data||!s.largeSnapshot.verify(p.G.nodes,p.program)'),
  ('assertActualCommonAdmissibleFamily(p);const s=seals.get(p);','assertActualCommonAdmissibleFamily(p);const s=seals.get(p),encoded=canonicalHash(p.program);'),
  ("clearDisposableThirdJetCaches(G);stage(context,'common-full-Cm-ready',G);",
   "clearDisposableThirdJetCaches(G);stage(context,'common-full-Cm-ready',G);context.onBackgroundNorms?.(backgroundNorms);"),
  ('sha256:await sha256(s.program),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.program).length',
   'sha256:encoded.sha256,nodeCount:s.count,canonicalBytes:encoded.bytes')])
 for file in ('actual-common-admissible-band.mjs','actual-common-target-weighted-norms.mjs'):
  name=m2+file
  edits=[(imp,"import {makeProgramSnapshot,canonicalHash,sameNodePrefix} from './mathscope-large-seal.mjs';\n"+imp),
   ('same(G.nodes.slice(0,count),family.G.nodes.slice(0,count))','sameNodePrefix(G.nodes,family.G.nodes,count)'),
   ('result.program=JSON.parse(canonicalStringify(packed));','const largeSnapshot=makeProgramSnapshot(packed);result.program=largeSnapshot.program;'),
   ('prefix:canonicalStringify(G.nodes)','largeSnapshot'),
   (',program:canonicalStringify(result.program)',''),
   ('canonicalStringify(p.program)!==s.program||\n    canonicalStringify(p.G.nodes.slice(0,s.count))!==s.prefix',
    '!s.largeSnapshot.verify(p.G.nodes,p.program)'),
   ('sha256:await sha256(s.program),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.program).length',
    'sha256:canonicalHash(p.program).sha256,nodeCount:s.count,canonicalBytes:canonicalHash(p.program).bytes')]
  transform(name,edits)
 # M3-owned seals have no detached complete program; only their exact prefix
 # checks and streamed certificate payloads need to change.
 for file in ('source-global-band.mjs','source-global-representative.mjs','source-global-current.mjs'):
  name=m3+file
  edits=[(imp,"import {captureNodes,canonicalHash} from '../../mathscope-m2/navier/mathscope-large-seal.mjs';\n"+imp)]
  if file=='source-global-band.mjs':
   edits += [('sourcePrefix=canonicalStringify(family.G.nodes)','sourcePrefix=captureNodes(family.G.nodes)'),
    ('canonicalStringify(G.nodes.slice(0,sourceCount))===sourcePrefix','sourcePrefix.verify(G.nodes)'),
    ('prefix:canonicalStringify(G.nodes)','prefix:captureNodes(G.nodes)'),
    ('s.prefix!==canonicalStringify(p.G.nodes.slice(0,s.count))','!s.prefix.verify(p.G.nodes)'),
    ('},bytes=canonicalStringify(delta);','},encoded=canonicalHash(delta);'),
    ('sha256:await sha256(bytes),nodeCount:s.count,newNodeCount:s.count-p.sourceBinding.sourcePrefixNodeCount,canonicalBytes:new TextEncoder().encode(bytes).length',
     'sha256:encoded.sha256,nodeCount:s.count,newNodeCount:s.count-p.sourceBinding.sourcePrefixNodeCount,canonicalBytes:encoded.bytes')]
  elif file=='source-global-representative.mjs':
   edits += [('prefix=canonicalStringify(G.nodes)','prefix=captureNodes(G.nodes)'),
    ('canonicalStringify(G.nodes.slice(0,n))===prefix','prefix.verify(G.nodes)'),
    ('prefix:canonicalStringify(G.nodes)','prefix:captureNodes(G.nodes)'),
    ('s.prefix!==canonicalStringify(p.G.nodes.slice(0,s.count))','!s.prefix.verify(p.G.nodes)')]
  else:
   edits += [('prefix=canonicalStringify(G.nodes)','prefix=captureNodes(G.nodes)'),
    ('canonicalStringify(G.nodes.slice(0,prefixCount))===prefix','prefix.verify(G.nodes)'),
    ('prefix:canonicalStringify(G.nodes)','prefix:captureNodes(G.nodes)'),
    ('s.prefix!==canonicalStringify(state.G.nodes.slice(0,s.count))','!s.prefix.verify(state.G.nodes)'),
    ('encoded=canonicalStringify({data,nodes:G.nodes.slice(state.source.prefixNodeCount,s.count),definitions:s.definitions,kernel:s.kernel});',
     'encoded=canonicalHash({data,nodes:G.nodes.slice(state.source.prefixNodeCount,s.count),definitions:s.definitions,kernel:s.kernel});'),
    ('sha256:await sha256(encoded),nodeCount:s.count,deltaNodeCount:s.count-state.source.prefixNodeCount,canonicalBytes:new TextEncoder().encode(encoded).length',
     'sha256:encoded.sha256,nodeCount:s.count,deltaNodeCount:s.count-state.source.prefixNodeCount,canonicalBytes:encoded.bytes'),
    ('encoded=canonicalStringify({sourceGraph:source.graph,closure,nodes:G.nodes.slice(state.source.prefixNodeCount),definitions,kernel}),',
     'encoded=canonicalHash({sourceGraph:source.graph,closure,nodes:G.nodes.slice(state.source.prefixNodeCount),definitions,kernel}),'),
    ('sha256:await sha256(encoded),nodeCount:G.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length',
     'sha256:encoded.sha256,nodeCount:G.nodes.length,canonicalBytes:encoded.bytes')]
  transform(name,edits)
 # All targets, substitutions and byte reversals were checked before writing.
 for name,content in pending.items():
  path=a.out/name
  if name.endswith('mathscope-large-seal.mjs') and path.exists():assert path.read_bytes()==content,'Existing helper differs.'
  path.write_bytes(content)
 a.receipt.write_text(json.dumps({'schema':'MathScope.C8.LargeSealScratchOverlays/1','status':'PREPARED_REQUIRES_NATIVE_REPLAY',
  'manifestSHA256':digest(raw) if raw else None,'ownedMode':a.owned,'helperSHA256':digest(helper+wrapper),'files':inventories,
  'scope':'Instrumented source and exact canonical-value seal representation overlays; direct node freezing changes mutation behavior. Not a new original theorem or complete C8 run.','release':'HOLD'},indent=2)+'\n',encoding='utf8',newline='\n')
 print('PASS pinned source overlays and exact reversal',len(inventories))

if __name__=='__main__':main()
