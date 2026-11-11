"""Locate direct source paths that need the reference inverse before a guard.

The paths use required typed operands only. They exclude all branch arms,
integral bodies, and native definition edges. They show where the caller
must establish the reference chart. They do not evaluate a physical field.
"""
import argparse
from collections import deque
import json
from pathlib import Path

from range_flow import SOURCE_REPLAY_SHA, children, pinned_bytes

RECEIPT_SHA = 'a98dd2e4944008f6b1b56791cc9068141376090c580952e3565137e6a51e6387'
INVERSE = 622820
Z_ID = 622803
T_ID = 622804


def required_operands(node):
    if node['op'] == 'smooth_piecewise':
        return node['args'][:3]
    if node['op'] == 'definite_integral':
        return node['args'][2:]
    return children(node)


def trace(nodes, root):
    predecessors = {root:None}
    queue = deque([root])
    while queue:
        i = queue.popleft()
        if i == INVERSE:
            path = []
            while i is not None:
                path.append({'nodeId':i,'operation':nodes[i]['op']})
                i = predecessors[i]
            return list(reversed(path))
        for arg in required_operands(nodes[i]):
            if arg not in predecessors:
                predecessors[arg] = i
                queue.append(arg)
    return None


def main(replay, receipt, out):
    replay_data = json.loads(pinned_bytes(replay,SOURCE_REPLAY_SHA))
    receipt_data = json.loads(pinned_bytes(receipt,RECEIPT_SHA))
    roles = {row['root_id']:row['role'] for row in receipt_data['root_usage']}
    assert set(roles) == set(replay_data['roots'])
    nodes = dict(replay_data['nodes'])
    assert nodes[INVERSE] == {'op':'actual_monotone_root','args':[2,Z_ID,T_ID]}
    assert nodes[Z_ID] == {'op':'coordinate','args':['m3_global_band_slow_Z$30436']}
    assert nodes[T_ID] == {'op':'coordinate','args':['m3_global_band_slow_T$30437']}
    paths = []
    for root in replay_data['roots']:
        path = trace(nodes,root)
        if path is not None:
            paths.append({'rootId':root,'role':roles[root],'path':path})
    assert [p['rootId'] for p in paths] == [4419702,4420035,4420039,4420249,4420253]
    result = {
        'schema':'MathScope.M3.OriginalReferenceSlowInverseRequiredOperandPaths/1',
        'sourceReplaySha256':SOURCE_REPLAY_SHA,
        'rootRoleReceiptSha256':RECEIPT_SHA,
        'originalSlowInverseNode':INVERSE,
        'actualArgumentNodes':[Z_ID,T_ID],
        'paths':paths,
        'sourceEndpointObligations':['Z^2*2^(-2h)+T>=1/2','Z^2*2^(2h)+T<=2'],
        'rootDomainConditionAtFreeFormalAssignmentZ0T0':False,
        'physicalRuntimeReachabilityOfThatAssignmentProved':False,
        'additionalRealYCallIdsClosed':0,
        'requiredInput':'Externally certified physical reference-chart binding for the free Z,T arguments on these original field roots',
    }
    out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
    print(f'Original #622820 is a required operand on {len(paths)}/11 original roots')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('replay','receipt','out'):
        parser.add_argument(name,type=Path)
    args = parser.parse_args()
    main(args.replay,args.receipt,args.out)
