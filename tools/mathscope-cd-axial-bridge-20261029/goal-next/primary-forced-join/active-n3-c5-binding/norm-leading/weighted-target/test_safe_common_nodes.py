from copy import deepcopy
from safe_common_nodes import cert

class G:
 def __init__(self):
  self.header={'fixedRegistry':'source'}
  self.nodes={0:{'op':'coordinate','args':['x']},1:{'op':'rational','args':['1','1']},2:{'op':'add','args':[0,1]},3:{'op':'actual_expression_partial','args':[0,[1],[0]]},4:{'op':'definite_integral','args':[3,0,0,1]},5:{'op':'unsupported','args':[0]}}
  self.reg={'expression':{0:{'parameters':[0],'body':2}},'monotone':{},'picard':{},'quadratic':{}}

a=G();b=deepcopy(a)
assert cert(a,b)=={0,1,2,3,4}
b.nodes[0]['args']=['changed']
assert cert(a,b)=={1}
b=deepcopy(a);b.reg['expression'][0]['body']=1
assert cert(a,b)=={0,1,2}
b=deepcopy(a);b.header['fixedRegistry']='changed'
assert cert(a,b)==set()
a.nodes[2]['args']=[0,4];b=deepcopy(a)
assert cert(a,b)=={0,1}
print('PASS: lexical dependency closure, changed leaf/definition/registry, unsupported op and forward reference')
