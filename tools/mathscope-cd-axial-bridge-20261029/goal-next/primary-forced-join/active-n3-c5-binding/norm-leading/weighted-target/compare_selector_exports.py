"""Compare actual common-selector exports with typed lexical AST semantics."""

from argparse import ArgumentParser
from array import array
from collections import Counter, defaultdict
from contextlib import ExitStack
from functools import lru_cache
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryFile
import gzip
import json
import sys


SOURCE = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
PROFILE = 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
ASSOCIATIVE = {'add', 'multiply', 'maximum'}
UNARY = {'inverse', 'exp', 'log_positive', 'sqrt_positive', 'ceiling', 'sine', 'cosine'}
DEFINITIONS = {'actual_expression_partial': 'expression', 'actual_monotone_root': 'monotone',
               'actual_quadratic_root': 'quadratic', 'actual_background_picard': 'picard',
               'actual_background_even_profile': 'picard'}


class Difference(Exception):
    def __init__(self, reason, frames=()):
        self.reason = reason
        self.frames = tuple(frames)
        super().__init__(reason)

    def through(self, left, right, op):
        return Difference(self.reason, ((left, right, op), *self.frames))


def require(condition, reason):
    if not condition:
        raise Difference(reason)


class Export:
    def __init__(self, path, stack):
        [self.graph] = path.rglob('original-source-nodes.jsonl.gz')
        receipt_candidates = [p for p in (path/'original-n2-prefix.json',path/'original-whole-k-prefix.json') if p.is_file()]
        [receipt_path] = receipt_candidates
        self.receipt = json.loads(receipt_path.read_bytes())
        assert self.receipt['sourceCommit'] == SOURCE and self.receipt['currentStage'] == 'COMPLETE'
        self.selector = self.receipt['selector']
        assert self.selector['sourceFamilySHA256'] == PROFILE
        self.manifest = json.loads((self.graph.parent/'original-source-export-manifest.json').read_bytes())
        assert self.receipt['snapshot'] == self.manifest
        assert self.receipt['executingCommit'] == self.manifest['executing_commit']
        assert self.manifest['function_registry_capture_kind'] == 'RAW_BASE_ONLY'
        assert self.receipt['finalJets']==self.manifest['actual_final_67_jets_certified']==0
        assert self.receipt['release']==self.manifest['release']=='HOLD'
        raw = (self.graph.parent/'original-source-functions.json').read_bytes()
        assert sha256(raw).hexdigest() == self.manifest['definitions_sha256']
        self.registry = json.loads(raw)
        self.base = {k:json.loads(v) for k,v in self.registry['base'].items() if isinstance(v,str)}
        assert self.base['fixed']['source']['parameterExpressionSHA256'] == PROFILE
        self.spool = stack.enter_context(TemporaryFile())
        self.offsets = array('Q')
        digest, count, size = sha256(), Counter(), 0
        with gzip.open(self.graph,'rb') as src:
            header=src.readline()
            assert json.loads(header) == {'schema':'MathScope.M3.FullNodesJSONL/1','node_count':self.manifest['node_count']}
            digest.update(header)
            size+=len(header)
            for line in src:
                assert line.endswith(b'\n') and line.startswith(b'{"op":"')
                end=line.index(b'"',7)
                count[line[7:end].decode('ascii')]+=1
                self.offsets.append(self.spool.tell())
                self.spool.write(line)
                digest.update(line)
                size+=len(line)
        assert len(self.offsets)==self.manifest['node_count'] and size==self.manifest['node_stream_uncompressed_bytes']
        assert digest.hexdigest()==self.manifest['node_stream_sha256'] and dict(count)==self.manifest['operation_histogram']

    @lru_cache(maxsize=180_000)
    def node(self, i):
        assert type(i) is int and 0<=i<len(self.offsets)
        self.spool.seek(self.offsets[i]); raw=json.loads(self.spool.readline())
        return raw['op'],raw['args']


def shared_registry_prefix(left,right):
    early=defaultdict(dict)
    with gzip.open(left.graph,'rb') as a,gzip.open(right.graph,'rb') as b:
        a.readline();b.readline()
        shared=0
        for x,y in zip(a,b):
            if x!=y:
                break
            end=x.index(b'"',7)
            op=x[7:end].decode('ascii')
            if op in DEFINITIONS:
                index=json.loads(x)['args'][0]
                early[DEFINITIONS[op]].setdefault(index,shared)
            shared+=1
    for kind, rows in early.items():
        for key,first in rows.items():
            lhs,rhs=left.base[kind][key],right.base[kind][key]
            assert lhs==rhs,(kind,key,'early native registry definition changed')
            if kind=='expression':
                assert lhs['body']<first
    # These primitive kernels are typed by their shared definitions and
    # graph operands. The source parameter expression hash was checked above.
    for name in ('core','naturalKernel'):
        assert left.base['fixed'][name]==right.base['fixed'][name],(name,'primitive kernel definition changed')
    return shared,{k:len(v) for k,v in early.items()}


class Compare:
    def __init__(self,left,right,shared):
        self.exports=(left,right)
        self.shared=shared
        self.normalizations=Counter()
        self.first_ordered_difference=None
        self.first_normalized_pair=None
        self.context=()

    def definition(self,side,kind,index):
        d=self.exports[side].base[kind]
        require(type(index) is int and 0<=index<len(d),f'invalid {kind} registration {index}')
        return d[index]

    def flatten(self,side,i,op):
        leaves,pending=[],[i]
        while pending:
            j=pending.pop();current,a=self.exports[side].node(j)
            if current==op:
                pending.extend(reversed(a))
            else:
                leaves.append(j)
                require(len(leaves)<=25_000,f'{op} associative replay exceeded leaf budget')
        return leaves

    @lru_cache(maxsize=250_000)
    def shape(self,side,i):
        # Only used to form candidate buckets. Every matched pair is still
        # checked by compare with the actual lexical bindings in scope.
        g=self.exports[side];op,a=g.node(i)
        def cs(ids):
            return [self.shape(side,k) for k in ids]
        if op in ASSOCIATIVE:
            items=sorted(cs(self.flatten(side,i,op)))
        elif op in UNARY or op=='smooth_piecewise':
            items=cs(a)
        elif op=='coordinate':
            items=[]
        elif op in ('rational','source_parameter'):
            items=a
        elif op in ('source_step_derivative','integer_power'):
            items=[self.shape(side,a[0]),a[1]]
        elif op=='definite_integral':
            items=cs([a[0],a[2],a[3]])
        elif op=='actual_expression_partial':
            items=[self.definition(side,'expression',a[0])['name'],a[2],*cs(a[1])]
        elif op=='actual_monotone_root':
            items=[self.definition(side,'monotone',a[0])['name'],*cs(a[1:])]
        elif op in ('actual_background_picard','actual_background_even_profile'):
            items=[self.definition(side,'picard',a[0])['name'],a[1],a[4:],*cs(a[2:4])]
        elif op=='actual_quadratic_root':
            items=[self.definition(side,'quadratic',a[0])['name'],a[1],self.shape(side,a[2])]
        elif op=='actual_natural_series':
            items=[a[0],a[3:],*cs(a[1:3])]
        else:
            raise Difference(f'unsupported operation in associative bucket {op}')
        return sha256(json.dumps([op,items],separators=(',',':')).encode()).hexdigest()

    def matching(self,i,j,op,bindings):
        left,right=self.flatten(0,i,op),self.flatten(1,j,op)
        require(len(left)==len(right),f'{op} associative operand count differs: {len(left)} / {len(right)}')
        buckets=defaultdict(list)
        for leaf in right:
            buckets[self.shape(1,leaf)].append(leaf)
        matched=[]
        for a in left:
            candidates=buckets[self.shape(0,a)]
            for idx,b in enumerate(candidates):
                try:
                    self.compare(a,b,bindings)
                    candidates.pop(idx)
                    matched.append([a,b])
                    break
                except Difference:
                    continue
            else:
                raise Difference(f'{op} has an unmatched exact lexical operand at left node {a}')
        require(not any(buckets.values()),f'{op} has unmatched right operands')
        return matched

    @lru_cache(maxsize=350_000)
    def compare(self,i,j,bindings=()):
        if i==j and i<self.shared and all(x==y or i<min(x,y) for x,y in bindings):
            return
        lhs,rhs=self.exports
        op,a=lhs.node(i);other,b=rhs.node(j)
        try:
            require(op==other,f'operation differs: {op} / {other}')

            def children(xs,ys,env=bindings):
                require(len(xs)==len(ys),f'arity differs: {len(xs)} / {len(ys)}')
                for x,y in zip(xs,ys,strict=True):
                    self.compare(x,y,env)

            if op=='coordinate':
                for x,y in reversed(bindings):
                    if i==x or j==y:
                        require((i,j)==(x,y),f'lexical coordinate mismatch: {a} / {b}')
                        return
                require(a==b,f'free coordinate differs: {a} / {b}')
            elif op in ('rational','source_parameter'):
                require(a==b,f'{op} differs: {a} / {b}')
            elif op=='definite_integral':
                require(len(a)==len(b)==4,'malformed integral')
                require(lhs.node(a[1])[0]==rhs.node(b[1])[0]=='coordinate','integral binder is not a coordinate')
                children(a[2:],b[2:]);self.compare(a[0],b[0],(*bindings,(a[1],b[1])))
            elif op=='actual_expression_partial':
                require(len(a)==len(b)==3 and a[2]==b[2],'native expression derivative orders differ')
                l,r=self.definition(0,'expression',a[0]),self.definition(1,'expression',b[0])
                require(all(l.get(k)==r.get(k) for k in ('name','derivativeLimits','implementation','unspecifiedOracle')),
                        f'native expression type differs: {l["name"]} / {r["name"]}')
                require(len(a[1])==len(b[1])==len(a[2])==len(l['parameters'])==len(r['parameters']),
                        'native expression formal/actual arity differs')
                children(a[1],b[1]); self.compare(l['body'],r['body'],(*bindings,*zip(l['parameters'],r['parameters'],strict=True)))
            elif op=='actual_monotone_root':
                l,r=self.definition(0,'monotone',a[0]),self.definition(1,'monotone',b[0])
                require(l['name']==r['name'] and len(a)==len(b)==1+len(l['parameters'])==1+len(r['parameters']),
                        'native monotone system name or arity differs')
                children(a[1:],b[1:])
                env=(*bindings,*zip(l['parameters'],r['parameters'],strict=True))
                keys=('left','right','derivativeLower','derivativeUpper')
                children([l[k] for k in keys],[r[k] for k in keys],env)
                self.compare(l['body'],r['body'],(*env,(l['variable'],r['variable'])))
            elif op in ('integer_power','source_step_derivative'):
                require(len(a)==len(b)==2 and a[1]==b[1],f'{op} exact order/exponent differs')
                self.compare(a[0],b[0],bindings)
            elif op in ('actual_background_even_profile','actual_background_picard'):
                require(a[1]==b[1] and a[4:]==b[4:],f'{op} component/order differs')
                require(self.definition(0,'picard',a[0])==self.definition(1,'picard',b[0]),f'{op} registered source system differs')
                children(a[2:4],b[2:4])
            elif op=='actual_quadratic_root':
                require(len(a)==len(b)==3 and a[1]==b[1],'quadratic root component differs')
                require(self.definition(0,'quadratic',a[0])==self.definition(1,'quadratic',b[0]),
                        'quadratic root registered source system differs')
                self.compare(a[2],b[2],bindings)
            elif op=='actual_natural_series':
                require(len(a)==len(b)==5 and a[0]==b[0] and a[3:]==b[3:],'natural series type/orders differ')
                children(a[1:3],b[1:3])
            elif op in ASSOCIATIVE:
                try:
                    children(a,b)
                except Difference as exc:
                    if self.first_ordered_difference is None:
                        self.first_ordered_difference={'target':self.context,'rootPair':[i,j],'operator':op,'orderedMismatch':exc.reason,
                                                       'orderedFrames':exc.frames}
                    matched=self.matching(i,j,op,bindings)
                    self.normalizations[op]+=1
                    if self.first_normalized_pair is None:
                        self.first_normalized_pair={'target':self.context,'rootPair':[i,j],'operator':op,
                                                    'matchedLeaves':matched,'lexicalBindings':bindings,
                                                    'orderedMismatch':exc.reason,'orderedFrames':exc.frames}
            elif op in UNARY or op=='smooth_piecewise':
                children(a,b)
            else:
                raise Difference(f'unsupported typed source operation {op}')
        except Difference as exc:
            raise exc.through(i,j,op) from None


def clauses(export):
    rows={}
    for row in export.selector['rows']:
        for clause in row['constraints']:
            key=(row['order'],clause['derivativeOrder'],clause['kind'])
            assert key not in rows
            rows[key]=clause
    return rows


def typed_controls():
    class SmallGraph:
        def __init__(self, nodes, function):
            self.nodes=nodes
            self.base={'expression':[function]}

        def node(self,i):
            return self.nodes[i]

    l=SmallGraph([('rational',['0','1']),('rational',['1','1']),('rational',['2','1']),
                  ('coordinate',['left_binder']),('coordinate',['left_formal']),
                  ('add',[1,2]),('add',[0,5]),('definite_integral',[3,3,0,1]),
                  ('actual_expression_partial',[0,[1],[0]])],
                 {'name':'sameFunction','body':4,'parameters':[4],'derivativeLimits':[2]})
    r=SmallGraph([('rational',['0','1']),('rational',['1','1']),('rational',['2','1']),
                  ('coordinate',['renamed_binder']),('coordinate',['renamed_formal']),
                  ('add',[2,0]),('add',[5,1]),('definite_integral',[3,3,0,1]),
                  ('actual_expression_partial',[0,[1],[0]]),('definite_integral',[3,3,3,1]),
                  ('actual_expression_partial',[0,[1],[1]])],
                 {'name':'sameFunction','body':4,'parameters':[4],'derivativeLimits':[2]})
    c=Compare(l,r,0)
    for i in (6,7,8):
        c.compare(i,i)
    assert c.normalizations['add']==1
    for i,j in ((7,9),(8,10)):
        try:
            c.compare(i,j)
        except Difference:
            pass
        else:
            raise AssertionError('synthetic lexical or typed mutation accepted')
    return {'reassociatedAndReorderedSumAccepted':True,'alphaRenamedIntegralAndNativeBinderAccepted':True,
            'integralBinderCannotBindItsEndpoint':True,'changedNativeDerivativeRejected':True}


def main():
    parser=ArgumentParser(description=__doc__)
    for name in ('left','right','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    parser.add_argument('--common-orders',action='store_true',help='Calibration only, compare the shared coefficient orders.')
    parser.add_argument('--expected-right-commit')
    parser.add_argument('--require-diagonal',action='store_true')
    args=parser.parse_args()
    sys.setrecursionlimit(6000)
    with ExitStack() as stack:
        lhs,rhs=(Export(p,stack) for p in (args.left,args.right))
        if args.expected_right_commit:
            assert rhs.receipt['executingCommit']==args.expected_right_commit
        if args.require_diagonal:
            assert rhs.receipt['requestedPrefix']==2 and rhs.receipt['selectorDiagonalOnly'] is True
            assert rhs.manifest['scope']=='ORIGINAL_WHOLE_K_N2_CURRENT_PRESSURE_PREFIX_DIAGONAL_MATERIALIZATION'
        shared,early=shared_registry_prefix(lhs,rhs)
        lrows,rrows=clauses(lhs),clauses(rhs)
        if not args.common_orders:
            assert set(lrows)==set(rrows) and len(lrows)==43
        keys=sorted(set(lrows)&set(rrows))
        assert keys
        comparator=Compare(lhs,rhs,shared)
        rows=[]
        current=('ell0',)
        try:
            comparator.context=current
            comparator.compare(lhs.selector['commonEll0'],rhs.selector['commonEll0'])
            for k in keys:
                current=k
                l,r=lrows[k],rrows[k]
                assert l.get('pole')==r.get('pole')
                pairs={name:[l[name],r[name]] for name in ('bound','requiredLog')}
                for name,pair in pairs.items():
                    current=(*k,name)
                    comparator.context=current
                    comparator.compare(*pair)
                rows.append({'key':k,**pairs})
                print('PASS',*k,flush=True)
            for l,r in zip(lhs.selector['rows'],rhs.selector['rows']):
                for name in ('historicalLogScale','growth','smallBand','logScale','scale'):
                    current=(l['order'],name)
                    comparator.context=current
                    comparator.compare(l[name],r[name])
            lw,rw=lhs.selector['window'],rhs.selector['window']
            matched_window=[]
            if lw['coefficientOrder']==rw['coefficientOrder']:
                assert lw['exactTail']['firstOmitted']==rw['exactTail']['firstOmitted']
                for name in ('lower','upper','nextSourceScale','nextSourceLogScale','Q'):
                    current=('window',name)
                    comparator.context=current
                    env=((lw['ell'],rw['ell']),) if name=='Q' else ()
                    comparator.compare(lw[name],rw[name],env)
                    matched_window.append(name)
        except Difference as exc:
            failure={'schema':'MathScope.N7.SelectorTypedComparisonFailure/1','target':current,
                     'verifiedClausesBeforeFailure':len(rows),'reason':exc.reason,'frames':exc.frames,
                     'firstOrderedMismatch':comparator.first_ordered_difference,
                     'firstAcceptedNormalization':comparator.first_normalized_pair}
            args.out.write_text(json.dumps(failure,indent=2)+'\n',encoding='utf-8')
            raise SystemExit(f'FAIL {current}: {exc.reason}')
        rejected=[]
        for name,actual,replacement in (('replace actual norm bound by literal one',lrows[keys[0]]['bound'],1),
                                        ('replace actual required log by norm bound',lrows[keys[0]]['requiredLog'],rrows[keys[0]]['bound'])):
            comparator.context=('negative control',name)
            try:
                comparator.compare(actual,replacement)
            except Difference as exc:
                rejected.append({'name':name,'reason':exc.reason})
            else:
                raise AssertionError(f'negative control accepted: {name}')
        result={'schema':'MathScope.N7.ActualCommonSelectorTypedEquivalence/1',
                'originalSourceCommit':SOURCE,'leftExecutingCommit':lhs.receipt['executingCommit'],
                'rightExecutingCommit':rhs.receipt['executingCommit'],
                'nodeSHA256':[x.manifest['node_stream_sha256'] for x in (lhs,rhs)],
                'registrySHA256':[x.manifest['definitions_sha256'] for x in (lhs,rhs)],
                'literalSharedRecords':shared,'earlyRegistryDefinitions':early,'matchedClauses':len(rows),
                'typedExpressionPairs':2*len(rows),'rows':rows,'matchedAssociativeReorders':dict(comparator.normalizations),
                'matchedReferenceWindowOperands':matched_window,
                'rightDiagonalMaterialization':rhs.receipt.get('selectorDiagonalOnly',False),
                'firstOrderedMismatch':comparator.first_ordered_difference,'negativeControls':rejected,
                'firstAcceptedNormalization':comparator.first_normalized_pair,
                'syntheticLexicalAndACControls':typed_controls(),
                'scope':'Exact retained common selector arithmetic and typed source functions. Physical field and interval comparisons are separate.'}
    raw=(json.dumps(result,indent=2)+'\n').encode();args.out.write_bytes(raw)
    print(f'{sha256(raw).hexdigest()}  {args.out.name}')


if __name__=='__main__':
    main()
