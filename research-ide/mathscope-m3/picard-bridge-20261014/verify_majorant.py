#!/usr/bin/env python3
"""Independent exact-symbolic Picard-majorant expansion and scope audit.

This is NOT an enclosure of the actual native N6 holomorphic coefficients.
It independently verifies a sufficient K from the M2 n=1 source majorant.
"""
from __future__ import annotations
import argparse
import copy
from dataclasses import dataclass
from fractions import Fraction
import json
from pathlib import Path

@dataclass(frozen=True)
class Monomial:
    factor: Fraction
    powers: tuple[tuple[str,int], ...]
    @staticmethod
    def of(factor: int|Fraction=1, **powers: int)->"Monomial":
        return Monomial(Fraction(factor),tuple(sorted((k,v) for k,v in powers.items() if v)))
    def __mul__(self,other:"Monomial")->"Monomial":
        p=dict(self.powers)
        for k,v in other.powers:p[k]=p.get(k,0)+v
        return Monomial.of(self.factor*other.factor,**p)
    def __truediv__(self,other:"Monomial")->"Monomial":
        return self*(other**-1)
    def __pow__(self,n:int)->"Monomial":
        assert isinstance(n,int)
        return Monomial.of(self.factor**n,**{k:v*n for k,v in self.powers})
    def json(self):
        return {'factor':str(self.factor),'exponents':dict(self.powers)}

def check(a):
    if not a:raise AssertionError("Source coefficient or scope assertion failed")

def inspect(payload:dict)->dict:
    check(payload["schema"]=="MathScope.N6PicardM2NativeBridgeAudit/1")
    check(payload["verifiedM2FixedOrder"]==1)
    check(payload["sourceRequestedOrders"]==list(range(1,9)))
    check(payload["declaredM2Criterion"]=="N4-03")
    check(payload["paperSHA256"]=="0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f")
    check(payload["nativeN6OriginalParentSHA256"]=="7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f")
    check(payload["allSourceOrdersShareSymbolicEtaDerivativeBlock"] is True)
    check(payload["allHigherOrdersActuallySolved"] is False)
    check(payload["allOriginalSourceEtaComplexInverseDomainsVerified"] is False)
    check(payload["existingActualOrderOneProofIsNotGlobalNSCertificate"] is True)
    check({r["id"] for r in payload["requiredBridgeClaims"]}=={
        "PB-COMPLEX-STRIP","PB-NATIVE-IDENTITY","PB-PREVIOUS-ORDERS","PB-ALL-BANDS"})
    check(all(row["status"]=="OPEN" for row in payload["requiredBridgeClaims"]))
    n1=payload["exactM2OriginalSystem"]
    check(n1["n"]==1 and n1["singularDiagonal"]==[0,0,2,0,3,1])
    a1=n1["A1"]
    check(len(a1)==6 and all(len(row)==6 for row in a1))
    active={(i,j) for i,row in enumerate(a1) for j,val in enumerate(row) if val!="0"}
    check(len(active)==6 and all(i>=4 and j<=3 for i,j in active))
    check(all(not (i==k and j==k) for i,j in active for k in range(6)))
    # Exact graph argument: A1 preserves V -> U, annihilates U; a diagonal
    # Green kernel and eta derivatives preserve these structural zeros.
    for i,j in active:
        for k,l in active:
            check(j!=k)
    # Exact Cauchy/ordered-simplex sufficient truncation inequality is
    # K >= 72(C_1 a)^2/Delta, C_1=2^18 B^2/delta^2,
    # B=2^12 Lambda^2 Q^3/t1, delta=rho/(2^10 Q), Delta=delta/8.
    c=payload["majorantConstants"]
    expect=lambda n:{"integer":str(n)}
    ref=lambda x:{"ref":x}
    prod=lambda *args:{"product":list(args)}
    powr=lambda a,n:{"power":[a,n]}
    div=lambda a,b:{"quotient":[a,b]}
    check(c["delta"]==div(ref("rho"),prod(expect(1024),ref("Q"))))
    check(c["radialBaseBound"]==div(prod(expect(4096),powr(ref("Lambda"),2),powr(ref("Q"),3)),ref("t1")))
    check(c["C1"]==div(prod(expect(262144),powr(ref("radialBaseBound"),2)),powr(ref("delta"),2)))
    check(c["cauchyRadiusLoss"]==div(ref("delta"),expect(8)))
    check(c["picardA"]==prod(ref("C1"),ref("a")))
    check(c["truncationIndex"]["max"][1]=={"ceil":div(prod(expect(72),powr(ref("picardA"),2)),ref("cauchyRadiusLoss"))})
    B=Monomial.of(4096,Lambda=2,Q=3,t1=-1)
    delta=Monomial.of(Fraction(1,1024),rho=1,Q=-1)
    C1=Monomial.of(262144)*(B**2)/(delta**2)
    delta_loss=delta/Monomial.of(8)
    k_expression=Monomial.of(72)*(C1**2)*Monomial.of(1,a2=1)/delta_loss
    independent=Monomial.of(9*2**140,Lambda=8,Q=17,a2=1,t1=-4,rho=-5)
    check(k_expression==independent)
    tampered=Monomial.of(9*2**140,Lambda=8,Q=17,a2=1,t1=-4,rho=-4)
    check(tampered!=k_expression)
    # All signs are conditional on positive Lambda,Q,a,rho,t1.
    return {
      'schema':'MathScope.N6.PicardMajorantExactAlgebra/1',
      'M2FixedOrderActualSourceVerified':1,
      'allFinitePicardOrdersSourceDerivativeMaskStructurallyChecked':8,
      'sourceDerivedInputBoundsAlreadyAssertedByM2':True,
      'sourceNativeFullN6AnalyticDomainsProvedByThisAudit':False,
      'newGlobalGuardsClosed':0,
      'newCartesianJetsGloballyClosed':0,
      'newPDESymbolicTermsDischarged':0,
      'sufficientKIntegerThreshold':'K >= ceil(9 * 2^140 * Lambda^8 * Q^17 * a^2 / (t1^4 * rho^5))',
      'warning':'a^2 is Xa*exp(t1/16); this threshold is sufficient, not minimal, and K was not explicitly materialized',
      'derivedExactMonomial':k_expression.json(),
      'signedAssumptions':['Lambda>0','Q>0','rho>0','t1>0','a>0','source A0,A1,f bounded holomorphic on common complex eta strip'],
      'openBridgeClaims':payload['requiredBridgeClaims'],
      'independentNegativeControlRejected':True,
      'originalN601Complete':False,
      'originalN602Complete':False,
      'originalM3Completion':'56/64'
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--input',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    a=p.parse_args()
    payload=json.loads(a.input.read_text())
    result=inspect(payload)
    a.output.parent.mkdir(parents=True,exist_ok=True)
    if a.output.exists():raise FileExistsError(str(a.output))
    a.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'status':'SOURCE_BOUNDED_CONDITIONAL_ALGEBRA_PASS','KMonomial':result['derivedExactMonomial'],'openBridgeClaims':len(result['openBridgeClaims']),'N6AcceptancePromoted':False}))
if __name__=='__main__':main()
