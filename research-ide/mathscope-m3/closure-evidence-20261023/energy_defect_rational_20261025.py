from fractions import Fraction as F

def exact_energy_identity(e0,e1,nu,d,work,rwork,div2,pdiv):
    vals=(e0,e1,nu,d,work,rwork,div2,pdiv)
    if not all(type(x) is F for x in vals):
        raise ValueError("Independent exact rational integrals required")
    if min(e0,e1,nu,d)<0 or nu==0:
        raise ValueError("Invalid physical energy or viscosity")
    lhs=(e1-e0)/2+nu*d-work
    rhs=rwork+div2/2+pdiv
    if lhs!=rhs:
        raise ValueError("Unclosed whole-domain energy residual")
    return {"exact_identity":True,"value":str(lhs),
            "actual_MathScope_source_integrals_verified":False,
            "N7_06":"OPEN","RELEASE":"HOLD"}
