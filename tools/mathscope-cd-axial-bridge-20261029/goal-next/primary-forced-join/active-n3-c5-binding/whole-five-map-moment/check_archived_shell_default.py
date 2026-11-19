from pathlib import Path
import gzip
import json
import sys

goal, repo, node_file = map(Path,sys.argv[1:])
sys.path.insert(0,str(goal/'first-gauge'))
from prove_five_whole import verify_shell

class ArchivedShell:
    def __init__(self,path):
        self.sample = {}
        with gzip.open(path,'rb') as source:
            source.readline()
            for index,line in enumerate(source):
                if index < 3620 or index in (28825,28826) or 633670 <= index <= 633715:
                    self.sample[index] = json.loads(line)
                if index > 633715:
                    break

    def node(self,index):
        rec = self.sample[index]
        return rec['op'],rec['args']

    def args(self,index,operation):
        tag,args = self.node(index)
        assert tag == operation, (index,tag)
        return args

archived = ArchivedShell(node_file)
r = verify_shell(archived,repo,{'inner':633710,'outer':633712})
assert r['center'] == 633686 and r['terminalTreeNodesChecked'] > 40
print(json.dumps({'archivedDefaultShell':'PASS','center':r['center'],
                  'terminalTreeNodesChecked':r['terminalTreeNodesChecked']}))
