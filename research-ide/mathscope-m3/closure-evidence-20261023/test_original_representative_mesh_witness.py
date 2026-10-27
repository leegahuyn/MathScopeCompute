import pytest
from fractions import Fraction as F
from original_representative_mesh_witness import nearest_index,certify_axis_witness,MeshPremiseOpen

@pytest.mark.parametrize('ell',[3,4,15,512,8205])
@pytest.mark.parametrize('R,eta',[('1/8','0'),('4/5','1'),('15/8','-1'),('31/21','1/3'),('2/729','-1/7'),('3/2','1/2')])
def test_strict_mesh_and_original_radii(ell,R,eta):
    R,eta=F(R),F(eta)
    x=R*R/2
    q=certify_axis_witness(ell,R,eta,x/2,x*2)
    assert F(q['max_scaled_cell_distance'])<=F(1,2)
    assert F(q['strict_3_over_4_cell_margin'])>=F(1,4)
    assert q['new_original_Y_bounds_certified']==0
    assert q['release']=='HOLD'

def test_boundary_half_integer_is_still_strict_inside_original_cell():
    assert nearest_index(1,F(1,2))==1
    assert abs(F(1,2)-nearest_index(1,F(1,2)))==F(1,2)<F(3,4)
    assert nearest_index(1,F(-1,2))==0

@pytest.mark.parametrize('bad',[('0','0'),('1','5/4'),('1','-5/4')])
def test_bad_source_image_fails_closed(bad):
    R,eta=map(F,bad)
    with pytest.raises(MeshPremiseOpen):
        certify_axis_witness(3,R,eta,F(1,4),F(5,2))

def test_wrong_radial_interval_fails_closed():
    with pytest.raises(MeshPremiseOpen):
        certify_axis_witness(3,F(1),F(0),F(2),F(3))
