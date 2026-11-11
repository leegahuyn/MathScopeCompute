"""Exact range obligation transport for all original Y uses.

Input derives from collect_reachable.mjs and retains the same semantic roots.
An unresolved atom is a proof debt, not evidence of a failed source bound.
"""
import argparse
from collections import Counter, defaultdict
from fractions import Fraction
from functools import lru_cache
import hashlib
import json
from pathlib import Path

if not __debug__:
    raise RuntimeError('Source validation requires Python assertions')

SOURCE_REPLAY_SHA = '5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459'
FIXED_RECEIPT_SHA = 'f810fd2b7d8952f78f1c1e312358903ac9f208c1c6132b67fb861e4ce4404cbb'
REGISTRY_SHA = 'bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
PROFILE_SHA = 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'


def pinned_bytes(path, sha):
    raw = path.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == sha, path
    return raw


def children(n):
    op, a = n['op'], n['args']
    if op in ('coordinate','rational','source_parameter'):
        return []
    if op in ('add','multiply','smooth_piecewise','maximum'):
        return a
    if op in ('inverse','log_positive','exp','integer_power','sqrt_positive',
              'source_step_derivative','sine','cosine','ceiling'):
        return a[:1]
    if op == 'definite_integral':
        return [a[0],a[2],a[3]]
    if op in ('actual_natural_series',):
        return a[1:3]
    if op in ('actual_background_even_profile','actual_background_picard'):
        return a[2:4]
    if op in ('actual_quadratic_root',):
        return a[2:3]
    if op == 'actual_monotone_root':
        return a[1:]
    if op in ('actual_covariance_volterra','m3_global_pulse_jet'):
        return [a[2],*a[3]]
    if op == 'm3_forced_pulse_partial':
        return [a[3],*a[4]]
    if op.endswith('_partial') and len(a) == 3:
        return a[1]
    raise ValueError((op,a))


def main(source, fixed, registry, profile, out, transport, allow_defined_root2, drop_loop_sign):
    assert not allow_defined_root2 or transport
    data = json.loads(pinned_bytes(source,SOURCE_REPLAY_SHA))
    nd = {i:n for i,n in data['nodes']}
    assert len(nd) == 159655
    assert len(data['entries']) == 1745
    assert len(data['roots']) == 11
    bodies = dict(data['sourceBodies'])
    original_registry = json.loads(pinned_bytes(registry,REGISTRY_SHA))['base']['base']
    expressions = json.loads(original_registry['expression'])
    monotones = json.loads(original_registry['monotone'])
    profile_json = pinned_bytes(profile, PROFILE_SHA).decode('utf8').split('export const PINNED_N3 = ',1)[1]
    params = json.loads(profile_json.rstrip()[:-1])['parametersExactExpressions']
    assert params['loopILeft']=={'product':[
        {'quotient':[{'integer':4},{'ref':'Lambda'}]},
        {'exp':{'quotient':[{'ref':'t1'},{'integer':8}]}}]}
    assert params['XR']=={'product':[{'integer':110},
        {'power':[{'product':[{'ref':'CSelected'},{'ref':'Pstar'}]},10]}]}
    assert params['lambda']=={'exp':{'product':[{'integer':-1000},{'ref':'T'}]}}
    assert params['I1Right']=={'product':[{'ref':'X0I1'},{'exp':{'integer':5}}]}
    assert params['X0I1']=={'product':[{'ref':'XR'},{'exp':{'sum':[
        {'ref':'T'},{'integer':2},{'product':[{'integer':60},{'ref':'BOuter'}]},{'integer':-25}]}}]}
    already = set(json.loads(pinned_bytes(fixed,FIXED_RECEIPT_SHA))['certifiedRealYCallIds'])
    assert len(already)==142
    calls = [r for r in data['calls'] if r['id'] not in already]
    call_bits = {r['id']: 1 << j for j,r in enumerate(calls)}
    assert len(calls) == 381

    def node(i):
        return nd[i]['op'], nd[i]['args']

    for i, expected in {
        8:('source_parameter',['lambda']),12:('source_parameter',['XR']),
        24:('rational',['2','1']),474:('rational',['4','1']),
        3454:('source_parameter',['Lambda']),3612:('source_parameter',['t1']),
        3617:('source_parameter',['Xa']),3679:('inverse',[3617]),
        6257:('source_parameter',['loopILeft']),102:('inverse',[8]),
        103:('multiply',[101,102]),612:('exp',[98]),613:('multiply',[12,612]),
        3292:('exp',[103]),3293:('multiply',[613,3292]),
        4756:('coordinate',['X']),
        3290:('rational',['-5','1']),5088:('exp',[3290]),5089:('multiply',[12,5088]),
        7982:('source_parameter',['I1Right']),
        71477:('exp',[71476]),71478:('multiply',[12,71477]),
        71672:('exp',[4708]),71673:('multiply',[71478,71672]),
    }.items():
        assert node(i)==expected
    for r in data['calls']:
        assert node(r['id'])==('actual_natural_series',[r['component'],r['y'],r['eta'],r['k'],r['m']])
    positive_constants = {3454,3617,3612,3679,3293}
    if not drop_loop_sign:
        positive_constants.add(6257)
    # The third right bound contains a terminal logarithm. We use its sign
    # only once a real guard has evaluated it, since then both exponentials
    # are positive. The other two expressions are positive constants.
    positive_right_guards = {5089,7982,71673}
    used_root2_brackets = set()

    def literal(i):
        op, a = node(i)
        return Fraction(int(a[0]), int(a[1])) if op == 'rational' else None

    def match_factor(i, factor):
        op, a = node(i)
        if op != 'multiply' or factor not in a:
            return None
        return a[1] if a[0] == factor else a[0]

    @lru_cache(None)
    def def_debts(i):
        op,a = node(i)
        if op in ('rational','source_parameter','coordinate'):
            return ()
        if op in ('multiply','add','exp'):
            return tuple(x for j in a for x in def_debts(j))
        if op == 'integer_power' and a[1]>=0:
            return def_debts(a[0])
        if op == 'inverse' and a[0] in (3454,3617):
            return ()
        if op == 'log_positive':
            return need('pos',a[0])
        return (('defined',i),)

    @lru_cache(None)
    def need(kind,i):
        """Return sufficient atomic obligations for property, on defined reals.

        Upper bounds: Y<=4exp(2t1), X<=Xa exp(2t1), s<=2t1,
        w<=log(Xa)+2t1. Their listed rewrites are equivalences.
        Lower bounds: nn is nonnegative; pos is strictly positive.
        """
        op,a=node(i)
        q=literal(i)
        if kind == 'defined':
            return def_debts(i)
        if kind == 'Y':
            if q is not None and q<=4:
                return ()
            x = match_factor(i,3454)
            if x is not None:
                return need('X',x)
            e = match_factor(i,474)
            if e is not None and node(e)[0]=='exp':
                return need('s',node(e)[1][0])
        if kind == 'X':
            if i==3617 or q is not None and q<=0:
                return ()
            e=match_factor(i,3617)
            if e is not None and node(e)[0]=='exp':
                return need('s',node(e)[1][0])
            if op=='exp':
                return need('w',a[0])
        if kind == 's':
            if i==3612 or q is not None and q<=0:
                return ()
            e=match_factor(i,3612)
            if e is not None and literal(e) is not None and literal(e)<=2:
                return ()
            if op=='log_positive':
                x=match_factor(a[0],3679)
                if x is not None:
                    return need('X',x)
        if kind=='w' and op=='log_positive':
            return need('X',a[0])
        if kind in ('nn','pos'):
            if q is not None and (q>=0 if kind=='nn' else q>0):
                return ()
            if i in positive_constants:
                return ()
            if allow_defined_root2 and op=='actual_monotone_root' and a[0]==2:
                assert literal(monotones[2]['left'])==Fraction(1,2)
                assert literal(monotones[2]['right'])==2
                used_root2_brackets.add(i)
                return ()
            if op=='exp':
                return def_debts(a[0])
            if op=='multiply':
                for scale in (3454,3617,3679,474):
                    j=match_factor(i,scale)
                    if j is not None:
                        return need(kind,j)
            if kind=='nn' and op=='integer_power' and a[1]>=0 and a[1]%2==0:
                return def_debts(a[0])
            if transport and op=='integer_power' and a[1]%2==0 and a[1]<0:
                return need('pos',a[0])
            if transport and op=='add':
                left=need(kind,a[0]); right=need(kind,a[1])
                if kind=='nn' and not left and not right:
                    return ()
            if transport and op=='multiply':
                left=need(kind,a[0]); right=need(kind,a[1])
                if not left and not right:
                    return ()
            if transport and op=='inverse' and not need('pos',a[0]):
                return ()
        return ((kind,i),)

    @lru_cache(None)
    def depends(i,t):
        if i==t:
            return True
        op,a=node(i)
        if op=='definite_integral':
            return any(depends(c,t) for c in a[2:]) or (a[1]!=t and depends(a[0],t))
        return any(depends(c,t) for c in children(nd[i]))

    def merge(dst,src):
        for k,v in src.items():
            dst[k]=dst.get(k,0)|v

    def impose(dst,conditions,bits):
        for c in conditions:
            dst[c]=dst.get(c,0)|bits

    memo={}
    transported=[]
    unsupported=[]
    for i,n in nd.items():
        op,a=node(i)
        parts=children(n)
        out_={}
        sealed=0
        for j in parts:
            sealed|=memo[j][1]
        if i in call_bits:
            b=call_bits[i]
            impose(out_,(*need('Y',a[1]),*need('nn',a[1]),*def_debts(a[1])),b)
        if transport:
            for root in bodies.get(i,[]):
                assert root<i
                obligations,hidden=memo[root]
                sealed|=hidden
                if not obligations:
                    continue
                if op=='actual_expression_partial':
                    formals=expressions[a[0]]['parameters']
                    values=a[1]
                    assert expressions[a[0]]['body']==root
                    orders=a[2]
                    limits=expressions[a[0]]['derivativeLimits']
                    assert len(orders)==len(limits)==len(formals)
                    assert all(type(order) is int and 0<=order<=limit
                               for order,limit in zip(orders,limits))
                elif op=='actual_monotone_root':
                    formals=monotones[a[0]]['parameters']
                    values=a[1:]
                    assert monotones[a[0]]['body']==root
                else:
                    formals=[];values=[]
                assert len(formals)==len(values)
                mapping=dict(zip(formals,values))
                assert len(mapping)==len(formals)
                for (kind,variable),bits in obligations.items():
                    if variable in mapping and node(variable)[0]=='coordinate':
                        actual=mapping[variable]
                        rec=need(kind,actual)
                        impose(out_,rec,bits)
                        transported.append([i,root,kind,variable,actual,rec])
                    else:
                        sealed|=bits
                        unsupported.append([i,root,kind,variable,op])
        if op=='definite_integral':
            f,t,left,right=a
            for (kind,j),bits in memo[f][0].items():
                if j==t:
                    impose(out_,(*need(kind,left),*need(kind,right)),bits)
                elif depends(j,t):
                    sealed|=bits
                else:
                    impose(out_,((kind,j),),bits)
            for j in (left,right):
                merge(out_,memo[j][0])
        elif op=='smooth_piecewise':
            x,left,right=a[:3]
            for j in (x,left,right):
                merge(out_,memo[j][0])
            for arm,f in enumerate(a[3:]):
                local=memo[f][0].copy()
                if arm<2 and local:
                    end=left if arm==0 else right
                    for kind in ('Y','X','s','w'):
                        nx=need(kind,x)
                        if len(nx)==1 and nx[0] in local:
                            impose(local,need(kind,end),local.pop(nx[0]))
                if arm>0 and local:
                    # Inside implies x>left. After implies x>=right, which
                    # also holds when native substitution specializes x=right.
                    for kind in ('nn','pos'):
                        nx=need(kind,x)
                        # Only use the exact x expression for a lower bound.
                        if nx==((kind,x),) and nx[0] in local:
                            if arm==1:
                                req=need('nn',left)
                            elif right in positive_right_guards:
                                req=()
                            else:
                                req=need(kind,right)
                            impose(local,req,local.pop(nx[0]))
                merge(out_,local)
        else:
            for j in parts:
                merge(out_,memo[j][0])
        memo[i]=(out_,sealed)

    debts=defaultdict(list)
    union=0
    for root in sorted(set(data['roots'] if transport else data['roots']+data['entries'])):
        obligations,sealed=memo[root]
        if sealed:
            union|=sealed
        for condition,bits in obligations.items():
            debts[condition].append((root,bits))
            union|=bits
    newly=[r for r in calls if not union & call_bits[r['id']]]
    left=[r for r in calls if union & call_bits[r['id']]]
    counts=Counter(r['y'] for r in newly)
    print('resolved',len(newly), sorted(counts.items()))
    summary={f'{k} {i}':sum(1 for r in calls if any(bits & call_bits[r['id']] for _,bits in rows))
             for (k,i),rows in debts.items()}
    print('unresolved conditions',len(summary),sorted(summary.items(),key=lambda row:-row[1])[:30])
    unresolved = {
        f'{kind} {node_id}': [
            {'scopeRoot':root, 'calls':[r for r in calls if bits & call_bits[r['id']]]}
            for root,bits in rows]
        for (kind,node_id),rows in debts.items()}
    print('native transported',len(transported),'unsupported',len(unsupported),'sealed unresolved',(union).bit_count())
    receipt={
        'schema':'MathScope.M3.OriginalNaturalYRangeObligationTransport/1',
        'sourceReplaySha256':SOURCE_REPLAY_SHA,
        'fixedBinderReceiptSha256':FIXED_RECEIPT_SHA,
        'nativeRegistrySha256':REGISTRY_SHA,
        'sourceProfileSha256':PROFILE_SHA,
        'nativeActualTransportEnabled':transport,
        'allowsPositiveBracketAtDefinedRoot2':allow_defined_root2,
        'negativeControlDroppedLoopLeftSign':drop_loop_sign,
        'usedRoot2Brackets':sorted(used_root2_brackets),
        'priorCount':len(already),
        'newly':newly,
        'certifiedRangeCount':len(already)+len(newly),
        'openRangeCount':len(left),
        'openCalls':left,
        'unresolved':summary,
        'unresolvedScopes':unresolved,
        'transported':transported,
        'unsupported':unsupported,
        'nativeRootExistenceCertified':False,
        'scope':'Radial Y input bound 0<=Y<=5 with original real branch, interval and substitution semantics',
    }
    out.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('source','fixed','registry','profile','out'):
        parser.add_argument(name,type=Path)
    parser.add_argument('--transport',action='store_true')
    parser.add_argument('--allow-defined-root2',action='store_true')
    parser.add_argument('--drop-loop-sign',action='store_true')
    args=parser.parse_args()
    main(args.source,args.fixed,args.registry,args.profile,args.out,args.transport,
         args.allow_defined_root2,args.drop_loop_sign)
