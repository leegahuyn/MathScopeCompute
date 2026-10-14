"""Bounded-memory, byte-authenticated original source checkpoint reader.

All helpers authenticate observed source bytes only. They grant no mathematical
authority. The CLI inventories root 633815 and provides a restart-checked exact
DAG checkpoint; source nodes are never evaluated, truncated, or zeroed.
"""
from pathlib import Path
import argparse, collections, gzip, hashlib, io, json, os, sqlite3, time

BASE=Path('research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291')
INDEX_SHA='ba251f2f3401d2d81467a8ac3c5ceb0da7c6ddc3899aab6d9d580755ff0fd1f3'
CAPTURE_SHA='37960fe03a79493d12b6b9051b8a69a88ab71cc3505cc8cd62c6f2fc4bc0daeb'
def digest(raw):return hashlib.sha256(raw).hexdigest()
def pinned_json(path, sha):
    raw=Path(path).read_bytes()
    if digest(raw)!=sha:raise ValueError('Changed pinned source: '+str(path))
    return json.loads(raw)
def snapshot_manifest(repo_root):
    root=Path(repo_root);index=pinned_json(root/BASE/'checkpoint-index.json',INDEX_SHA)
    first=index['checkpoints'][0];manifest=pinned_json(root/first['path'],first['sha256'])
    if manifest['firstNode']!=0 or manifest['nodeCount']!=3892594:raise ValueError('Changed complete source parent')
    return root/first['path'],manifest
class Parts(io.RawIOBase):
    def __init__(self,folder,manifest):
        self.folder=folder;self.manifest=manifest;self.i=0;self.file=None;self.part_hash=None;self.part_bytes=0;self.total=0;self.hasher=hashlib.sha256()
    def readable(self):return True
    def readinto(self, buf):
        while True:
            if self.file is None:
                if self.i==len(self.manifest['parts']):return 0
                row=self.manifest['parts'][self.i];path=(self.folder/row['path']).resolve()
                if not path.is_relative_to(self.folder.resolve()):raise ValueError('Unsafe source part')
                self.file=path.open('rb');self.part_hash=hashlib.sha256();self.part_bytes=0
            n=self.file.readinto(buf)
            if n:
                raw=memoryview(buf)[:n];self.part_hash.update(raw);self.hasher.update(raw);self.part_bytes+=n;self.total+=n;return n
            row=self.manifest['parts'][self.i]
            if self.part_bytes!=row['bytes'] or self.part_hash.hexdigest()!=row['sha256']:raise ValueError('Changed source compressed part')
            self.file.close();self.file=None;self.i+=1
    def close(self):
        if self.file:self.file.close()
        super().close()
def _stream(repo_root, header_only=False):
    path,m=snapshot_manifest(repo_root);parts=Parts(path.parent,m);raw_hash=hashlib.sha256();node_hash=hashlib.sha256();raw_bytes=node_bytes=0;expected=0
    with parts,io.BufferedReader(parts) as joined,gzip.GzipFile(fileobj=joined,mode='rb') as gz:
        line=gz.readline();header=json.loads(line);raw_hash.update(line);raw_bytes+=len(line)
        if header.get('schema')!='MathScope.N6.ExactSourceStageGraphNDJSON/1' or header['firstNode']!=0 or header['nodeCount']!=m['nodeCount']:raise ValueError('Changed source header')
        yield ('header',header)
        if header_only:return
        for line in gz:
            raw_hash.update(line);raw_bytes+=len(line);node_hash.update(line);node_bytes+=len(line)
            row=json.loads(line)
            if len(row)!=2 or row[0]!=expected or not isinstance(row[1].get('args'),list):raise ValueError('Reordered source node')
            expected+=1;yield row[0],row[1]
        # Flush joined input to verify every compressed part, including the
        # gzip trailer. Unexpected suffixes are rejected by gzip parsing.
        while joined.read(1024*1024):pass
    if expected!=m['nodeCount'] or raw_bytes!=m['rawBytes'] or raw_hash.hexdigest()!=m['rawSHA256'] or node_bytes!=m['nodeBytes'] or node_hash.hexdigest()!=m['nodesSHA256'] or parts.total!=m['gzipBytes'] or parts.hasher.hexdigest()!=m['gzipSHA256']:raise ValueError('Changed complete source stream')
def open_header(repo_root):
    # Header-only inspection is explicitly not a full stream verification.
    it=_stream(repo_root,True)
    try:return next(it)[1]
    finally:it.close()
def stream_snapshot(repo_root):
    """Yield (source_id,node); exhaust to verify all stream checksums."""
    for ident,node in _stream(repo_root):
        if ident!='header':yield ident,node
def verify_capture(repo_root):
    root=Path(repo_root);capture=pinned_json(root/BASE/'source-bytes-before.json',CAPTURE_SHA)
    if len(capture['files'])!=155:raise ValueError('Incomplete original producer capture')
    for row in capture['files']:
        for path in [root/row['path'],root/BASE/'sources'/row['path']]:
            raw=path.read_bytes()
            if len(raw)!=row['bytes'] or digest(raw)!=row['sha256']:raise ValueError('Changed producer: '+str(path))
    return {'status':'SOURCE_VERIFIED','count':155,'captureSHA256':CAPTURE_SHA,'originalAndCopyBytesVerified':True}
def definitions(header):
    result={}
    def visit(obj,prefix='snapshot'):
        for name,value in obj.items():
            if name=='base' and isinstance(value,dict):visit(value,prefix+'.base')
            elif isinstance(value,str):
                try:decoded=json.loads(value)
                except (ValueError,TypeError):continue
                if name in result:raise ValueError('Ambiguous registry '+name)
                result[name]=decoded
    visit(header['definitions']);return result
def primitive_children(node):
    op=node['op'];a=node['args']
    if op in ['rational','coordinate','source_parameter']:return []
    if op in ['add','multiply','maximum','smooth_piecewise']:return a
    if op in ['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling','integer_power','source_step_derivative']:return a[:1]
    if op=='definite_integral':return a
    if op in ['m3_aux_expression_partial','actual_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial','m3_global_indexed_partial']:return a[1]
    if op=='actual_monotone_root':return a[1:]
    if op=='actual_quadratic_root':return a[2:3]
    if op=='actual_natural_series':return a[1:3]
    return None
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--root',type=int,default=633815);args=parser.parse_args()
    repo=Path(__file__).resolve().parents[3];out=Path(args.output);out.mkdir(parents=True,exist_ok=True);start=time.monotonic();capture=verify_capture(repo)
    if not 0<=args.root<3892594:raise ValueError('Root outside saved original source')
    dbpath=out/'source-dag-checkpoint.sqlite';db=sqlite3.connect(dbpath);db.execute('PRAGMA journal_mode=DELETE');db.execute('CREATE TABLE IF NOT EXISTS nodes(id INTEGER PRIMARY KEY, raw TEXT NOT NULL)')
    header=open_header(repo);registry=definitions(header);retained=0;batch=[];ops=collections.Counter()
    for ident,node in stream_snapshot(repo):
        if ident<=args.root:
            batch.append((ident,json.dumps(node,separators=(',',':'),ensure_ascii=False)));ops[node['op']]+=1;retained+=1
            if len(batch)>=10000:db.executemany('INSERT OR REPLACE INTO nodes VALUES (?,?)',batch);db.commit();batch=[]
    if batch:db.executemany('INSERT OR REPLACE INTO nodes VALUES (?,?)',batch);db.commit()
    cache={};missing=[];definition_bindings={};unreviewed={}
    def take(i):
        if i in cache:return cache[i]
        row=db.execute('SELECT raw FROM nodes WHERE id=?',(i,)).fetchone()
        if row is None:missing.append(i);return None
        return json.loads(row[0])
    def children(node):
        c=primitive_children(node)
        if c is None:return []
        op=node['op'];a=node['args'];extra=[];key=None;d=None
        if op in ['m3_aux_expression_partial','actual_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial','m3_global_indexed_partial']:
            kind={'m3_aux_expression_partial':'expressionDefinitions','actual_expression_partial':'expression','m3_aux_indexed_partial':'fieldDefinitions','m3_aux_inverse_partial':'inverseDefinitions','m3_global_indexed_partial':'m3GlobalFields'}[op]
            index=-1-a[0] if op=='m3_aux_expression_partial' else a[0];key=f'{kind}:{index}';d=registry[kind][index]
            if 'body' in d:extra=[d['body'],*d.get('parameters',[])]
            else:unreviewed[key]={'operation':op,'definition':d,'reason':'Indexed/inverse limit semantics require independent closure proof'}
        elif op=='actual_monotone_root':
            key=f'monotone:{a[0]}';d=registry['monotone'][a[0]];extra=[d[k] for k in ['body','left','right','derivativeLower','derivativeUpper']]+d['parameters']+[d['variable']]
        elif op=='actual_quadratic_root':
            key=f'quadratic:{a[0]}';d=registry['quadratic'][a[0]];extra=[*sum(d['linear'],[]),*sum(d['quadraticDiagonal'],[]),*d['rhs'],d['scale'],*sum(d['preconditioner'],[]),d['rootRadius'],d['lipschitzUpper']]
        elif op=='actual_natural_series':
            # The recurrence core is source-code bound by the separate series
            # audit. Do not invent a registry or pretend argument closure alone
            # closes the defining infinite limit.
            unreviewed['natural-recurrence']={'operation':op,'reason':'Complete recurrence core/captures and B_rho premise separately audited'}
        if key:definition_bindings[key]={'definition':d,'sha256':digest(json.dumps(d,separators=(',',':'),ensure_ascii=False).encode())}
        return c+extra
    seen=set();pending=[args.root];closureops=collections.Counter();edges=0;integrals=[];unknown=[]
    while pending:
        ident=pending.pop()
        if ident in seen:continue
        if not isinstance(ident,int) or ident<0:raise ValueError('Metadata used as scalar node')
        node=take(ident)
        if node is None:continue
        seen.add(ident);closureops[node['op']]+=1;child=children(node);edges+=len(child);pending.extend(child)
        if primitive_children(node) is None:unknown.append({'sourceNode':ident,'node':node})
        if node['op']=='definite_integral':integrals.append({'sourceNode':ident,'integrand':node['args'][0],'binder':node['args'][1],'left':node['args'][2],'right':node['args'][3]})
    # A node checksum binds the exact reachable saved DAG. No evaluation is
    # performed and all original operator metadata is preserved.
    closure_hash=hashlib.sha256();checkpoint=out/'root-633815-closure.ndjson.gz'
    with gzip.open(checkpoint,'wb',compresslevel=6) as gz:
        for ident in sorted(seen):
            node=take(ident);line=(json.dumps([ident,node],separators=(',',':'),ensure_ascii=False)+'\n').encode();closure_hash.update(line);gz.write(line)
    expected=closure_hash.hexdigest();db.close()
    # Resume from an independent connection and independently replay the
    # serialized checkpoint. This verifies identity, not PDE completion.
    db=sqlite3.connect(dbpath);restart_hash=hashlib.sha256()
    with gzip.open(checkpoint,'rb') as gz:
        for line in gz:
            ident,node=json.loads(line);actual=json.loads(db.execute('SELECT raw FROM nodes WHERE id=?',(ident,)).fetchone()[0])
            if node!=actual:raise ValueError('Restart changed source DAG')
            restart_hash.update(line)
    if restart_hash.hexdigest()!=expected:raise ValueError('Restart digest differs')
    db.close()
    result={'schema':'MathScope.N6.SourceDAGRecovery/1','status':'SOURCE_VERIFIED','root':args.root,'rootNode':take_from_checkpoint(checkpoint,args.root),'retainedPrefixNodes':retained,'fullParentStreamNodes':3892594,'capture':capture,'dependencyNodes':len(seen),'dependencyEdges':edges,'operatorCounts':dict(closureops),'prefixOperatorCounts':dict(ops),'integralCount':len(integrals),'integrals':integrals,'definitions':definition_bindings,'unknownOperators':unknown,'unreviewedDefinitionClosure':unreviewed,'missingDefinitionNodes':sorted(set(missing)),'closureSHA256':expected,'checkpointSHA256':digest(checkpoint.read_bytes()),'restartEqualityVerified':True,'sourceNodeReplacedByZero':False,'derivativeReplayResumed':False,'wholeMeanComputed':False,'originalN601Complete':False,'originalN602Complete':False,'elapsedSeconds':time.monotonic()-start}
    (out/'dag-result.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8');(out/'header.json').write_text(json.dumps(header,ensure_ascii=False),encoding='utf-8')
    print(json.dumps({k:result[k] for k in ['status','root','dependencyNodes','integralCount','operatorCounts','missingDefinitionNodes','restartEqualityVerified','elapsedSeconds']}))
def take_from_checkpoint(path,root):
    with gzip.open(path,'rb') as gz:
        for line in gz:
            ident,node=json.loads(line)
            if ident==root:return node
    raise ValueError('Missing checkpoint root')
if __name__=='__main__':main()
