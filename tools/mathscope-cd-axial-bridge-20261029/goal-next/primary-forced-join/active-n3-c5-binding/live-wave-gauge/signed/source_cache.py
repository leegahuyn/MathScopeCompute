"""Authenticated reusable local spool of the completed same-live source export."""
from array import array
from hashlib import sha256
from pathlib import Path
import gzip,json,sys
EXPECTED_META_SHA256='da2fa0a74d87c85b608046563330bcdb93b89c9f51174bfd495eacd0f108f244'
def digest(path):
 h=sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(8*1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def prepare(reader,directory,manifest,prefix,cache):
 cache.mkdir(parents=True,exist_ok=True)
 meta=cache/'cache.json'
 if meta.exists():return load(reader,directory,manifest,prefix,cache)
 records=cache/'records.jsonl';offsets=cache/'offsets.bin'
 original=reader.TemporaryFile
 reader.TemporaryFile=lambda **kwargs:records.open('w+b')
 try:
  stream=reader.SourceStream(directory,manifest,prefix,cache)
  stream.__enter__()
 finally:reader.TemporaryFile=original
 try:
  with offsets.open('wb') as f:stream.offsets.tofile(f)
  stream.backing.flush()
  with gzip.open(directory/reader.STREAM,'rb') as f:header=f.readline()
  result={'schema':'MathScope.C80.AuthenticatedLocalSourceCache/1','verify':stream.verify,'byteorder':sys.byteorder,
   'header':header.decode('ascii'),'recordsBytes':records.stat().st_size,'offsetBytes':offsets.stat().st_size,
   'offsetSHA256':digest(offsets)}
  meta.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
  assert sha256(meta.read_bytes()).hexdigest()==EXPECTED_META_SHA256
  print('source cache verified',stream.count,stream.verify['sha256'],flush=True)
  return stream
 except BaseException:
  stream.__exit__(None,None,None);raise
def load(reader,directory,manifest,prefix,cache):
 raw=(cache/'cache.json').read_bytes();assert sha256(raw).hexdigest()==EXPECTED_META_SHA256;meta=json.loads(raw)
 assert meta['schema']=='MathScope.C80.AuthenticatedLocalSourceCache/1' and meta['byteorder']==sys.byteorder=='little'
 assert meta['verify']['sha256']==manifest['node_stream_sha256'] and meta['verify']['nodes']==manifest['node_count']
 assert meta['verify']['originalPrefixRecords']==prefix
 records=cache/'records.jsonl';offsets=cache/'offsets.bin'
 assert records.stat().st_size==meta['recordsBytes'] and offsets.stat().st_size==meta['offsetBytes']
 assert digest(offsets)==meta['offsetSHA256']
 h=sha256();h.update(meta['header'].encode('ascii'))
 with records.open('rb') as f:
  for chunk in iter(lambda:f.read(8*1024*1024),b''):h.update(chunk)
 assert h.hexdigest()==manifest['node_stream_sha256']
 obj=reader.SourceStream(directory,manifest,prefix,cache)
 with offsets.open('rb') as f:obj.offsets.fromfile(f,manifest['node_count'])
 assert len(obj.offsets)==manifest['node_count'] and obj.offsets[0]==0 and obj.offsets[-1]<meta['recordsBytes']
 obj.backing=records.open('rb');obj.verify=meta['verify']
 print('authenticated source cache reused',obj.count,flush=True)
 return obj
