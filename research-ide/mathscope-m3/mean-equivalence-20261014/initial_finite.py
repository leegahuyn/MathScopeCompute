"""Independent Fraction-polynomial check of all five actual source rows.

This implementation expands ordinary fractions, unlike the Node factored
verifier. Analytic source leaves retain exact IDs. It records nonzero-divisor
and full-class obligations instead of converting rational identities to N6.
"""
from __future__ import annotations
import argparse, hashlib, json
from fractions import Fraction
from pathlib import Path

EXPECTED=[3614735,3614757,3614759,3614752,3614761]
class Budget(Exception): pass
def canonical(value):return json.dumps(value,ensure_ascii=False,separators=(',',':')).encode('utf8')
def addpoly(a,b):
    out=dict(a)
    for k,v in b.items():
        out[k]=out.get(k,Fraction())+v
        if not out[k]:del out[k]
    if len(out)>30000:raise Budget('Independent expanded polynomial exceeded 30,000 monomials')
    return out
class FractionVerifier:
    def __init__(self,nodes):self.nodes=nodes;self.memo={};self.products=0;self.divisors=set();self.atoms=set()
    def multiply(self,a,b):
        result={}
        for ka,va in a.items():
            for kb,vb in b.items():
                self.products+=1
                if self.products>3000000:raise Budget('Independent expanded polynomial exceeded 3,000,000 products')
                key=tuple(sorted(ka+kb));result[key]=result.get(key,Fraction())+va*vb
                if not result[key]:del result[key]
        if len(result)>30000:raise Budget('Independent polynomial exceeded monomial budget')
        return result
    def mul(self,a,b):
        if not a[0] or not b[0]:return ({},{():Fraction(1)})
        return self.multiply(a[0],b[0]),self.multiply(a[1],b[1])
    def add(self,a,b):
        if not a[0]:return b
        if not b[0]:return a
        # Equal denominator optimization is exact structural polynomial equality.
        if a[1]==b[1]:return addpoly(a[0],b[0]),a[1]
        return addpoly(self.multiply(a[0],b[1]),self.multiply(b[0],a[1])),self.multiply(a[1],b[1])
    def eval(self,ident):
        if ident in self.memo:return self.memo[ident]
        n=self.nodes[ident];op,args=n['op'],n['args'];one={():Fraction(1)}
        if op=='rational':
            q=Fraction(int(args[0]),int(args[1]));result=({():q} if q else {},one)
        elif op=='add':
            result=({},one)
            for x in args:result=self.add(result,self.eval(x))
        elif op=='multiply':
            result=(one,one)
            for x in args:result=self.mul(result,self.eval(x))
        elif op in ('inverse','integer_power'):
            a=self.eval(args[0]);power=-1 if op=='inverse' else args[1]
            if abs(power)>10000:raise Budget('Integer power exceeds independent budget')
            if power<0:
                if not a[0]:raise ValueError('Actual source inverts exact zero')
                self.divisors.add(args[0]);a=(a[1],a[0]);power=-power
            result=(one,one)
            while power:
                if power%2:result=self.mul(result,a)
                power//=2
                if power:a=self.mul(a,a)
        else:
            self.atoms.add(ident);result=({(ident,):Fraction(1)},one)
        self.memo[ident]=result;return result
def verify_witness(witness):
    if witness['schema']!='MathScope.N6.ActualFiveRowArithmeticWitness/1':raise ValueError('Wrong actual source witness')
    if [x['expression'] for x in witness['rows']]!=EXPECTED:raise ValueError('Wrong five-row roots')
    if hashlib.sha256(canonical(witness['nodes'])).hexdigest()!=witness['nodeRowsSHA256']:raise ValueError('Changed actual source operand bytes')
    if witness['actualInputDefects']!={'P':3614334,'Jtheta':3614376,'Jz':3614420}:raise ValueError('Old or replacement defects used')
    if witness['source']['completeParentSnapshotNodeSHA256']!='7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f':raise ValueError('Different source parent')
    nodes=dict(witness['nodes'])
    if len(nodes)!=len(witness['nodes']):raise ValueError('Duplicate source node')
    rows=[]
    for row in witness['rows']:
        verifier=FractionVerifier(nodes)
        try:
            numerator,denominator=verifier.eval(row['expression'])
            result={**row,'status':'EXACT_MATCH' if not numerator else 'UNRESOLVED_DIFFERENCE','numeratorMonomials':len(numerator),'denominatorMonomials':len(denominator),'productsUsed':verifier.products,'nonzeroDivisorsRequired':sorted(verifier.divisors),'actualAnalyticAtoms':sorted(verifier.atoms),'omitOrPerturbRowDetected':bool(addpoly(numerator,denominator)),'actualBumpIntegralInterpretationProved':False}
        except Budget as error:result={**row,'status':'RESOURCE_LIMIT','reason':str(error),'productsUsed':verifier.products}
        rows.append(result)
    return {'schema':'MathScope.N6.IndependentActualFiveRows/1','rows':rows,'source':witness['source'],'sourceOperandSHA256':witness['nodeRowsSHA256'],'implementation':'Independent Python Fraction polynomial numerator/denominator expansion; no stored PASS inputs','fiveArithmeticRowsMatched':all(x['status']=='EXACT_MATCH' for x in rows),'uniformClassesProved':False,'momentIntegrals9_10Proved':False,'originalN601Complete':False}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--witness',required=True);p.add_argument('--output',required=True);args=p.parse_args()
    result=verify_witness(json.loads(Path(args.witness).read_text(encoding='utf8')));out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    (out/'independent-five-rows.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'fiveArithmeticRowsMatched':result['fiveArithmeticRowsMatched'],'rows':[{'id':x['id'],'status':x['status']} for x in result['rows']],'N601':'UNRESOLVED'}))
