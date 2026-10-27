"""Exact witness for strict original 3/4-cell mesh on the axis s=1.

NOT a certificate of original runtime index selection, physical-field support,
or the full root #623935. General real witnesses follow from the floor lemma
in the accompanying note; this fixture uses rationals and never chooses h=0.
"""
from fractions import Fraction as F

class MeshPremiseOpen(ValueError):
    pass

def nearest_index(E: int, value: F) -> int:
    if type(E) is not int or E < 1 or type(value) is not F:
        raise MeshPremiseOpen("Positive integer E and exact rational value required")
    # Floor(E*value+1/2) is valid also for negative mesh coordinates.
    x = E*value+F(1, 2)
    return x.numerator // x.denominator

def certify_axis_witness(ell: int, R: F, eta: F, Xa: F, Xb: F):
    if type(ell) is not int or ell < 3 or any(type(v) is not F for v in (R,eta,Xa,Xb)):
        raise MeshPremiseOpen("Original integer level and exact rational witnesses required")
    X = R*R / 2
    if not (R > 0 and -1 <= eta <= 1 and 0 < Xa <= X <= Xb):
        raise MeshPremiseOpen("Original representative radial/image premises missing")
    E = ell**6
    # At s=1, Z=s^(1/2-h)*eta=eta for EVERY original 0<h<2^-4096.
    Z, T = eta, 1-eta*eta
    r,z,t = [nearest_index(E,v) for v in (R,Z,T)]
    def exact_strict(v,k):
        d=abs(E*v-k)
        if not d <= F(1,2) or not d < F(3,4):
            raise AssertionError("Nearest mesh never loses its strict margin")
        return d
    dr,dz,dt=(exact_strict(v,k) for v,k in ((R,r),(Z,z),(T,t)))
    rlo=(F(r)-F(3,4))/E
    rhi=(F(r)+F(3,4))/E
    tlo=(F(t)-F(3,4))/E
    thi=(F(t)+F(3,4))/E
    a=max(F(1,2),max(F(0),rlo)**2/(2*Xb))
    b=max(a,min(F(2),rhi*rhi/(2*Xa)))
    m=max(F(0),tlo)
    M=thi
    assert F(1,2)<=a<=1<=b<=2 and 0<=m<=T<M
    return {"schema":"MathScope.M3.OriginalRepresentativeNearestMeshAxisWitness/1",
            "scope":"CONDITIONAL_EXISTENTIAL_AXIS_ONLY",
            "ell":ell,"E":str(E),"s_rep":"1","Z_rep":str(Z),"T_rep":str(T),
            "R_rep":str(R),"X_rep":str(X),"indices":[r,z,t],
            "max_scaled_cell_distance":str(max(dr,dz,dt)),
            "strict_3_over_4_cell_margin":str(F(3,4)-max(dr,dz,dt)),
            "s_bracket":[str(a),str(b)],"T_bracket":[str(m),str(M)],
            "h_replaced_by_zero":False,"runtime_mesh_indices_match_proved":False,
            "global_native_caller_image_proved":False,
            "new_original_Y_bounds_certified":0,"final_jets":0,"release":"HOLD"}
