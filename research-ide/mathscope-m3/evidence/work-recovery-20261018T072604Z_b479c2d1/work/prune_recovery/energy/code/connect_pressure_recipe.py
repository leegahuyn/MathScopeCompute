"""RECOVERY: apply the current native indexed adapter to original pressure3676897."""
from pathlib import Path
import hashlib
import json
import sys

BASE=Path(__file__).resolve().parents[1]
WORKSPACE=BASE.parents[2]
NATIVE=WORKSPACE/'work/prune_recovery/native'
sys.path.insert(0,str(NATIVE/'code'))
from native_binding import SourceBindings

def pin(p):return {'path':str(p.relative_to(WORKSPACE)),
                  'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
extra_path=BASE/'evidence/ENERGY_ADDITIONAL_RAW_SOURCE_RECORDS.json'
extra=json.loads(extra_path.read_text())
bindings=SourceBindings()
assert extra['source_header_sha256']==bindings.closure['source_header_sha256']
assert extra['source_node_sha256']==bindings.closure['authentication']['parentSHA256']
for key,value in extra['records'].items():
    ident=int(key)
    assert ident not in bindings.nodes or bindings.nodes[ident]==value
    bindings.nodes[ident]=value
assert bindings.nodes[3825009]=={'op':'add','args':[3676897,3677236]}
assert bindings.nodes[3676897]['op']=='m3_aux_indexed_partial'
assert bindings.nodes[3676897]['args'][0]==9
recipe=bindings.indexed_recipe(3676897)
result={'schema':'MathScope.RecoveryCanonicalInitializedPressureRecipe/1',
    'implementation':'NEW_RECOVERY_IMPLEMENTATION_NOT_LOST_BYTES',
    'input_pins':[pin(p) for p in (extra_path,NATIVE/'code/native_binding.py',
        BASE/'evidence/ACTUAL_ENERGY_SOURCE_CONNECTION.json')],
    'source_pressure_root':3825009,'indexed_pressure_child':3676897,
    'other_complete_pressure_child':3677236,
    'recipe':recipe,'retained_rows':len(recipe['rows']),
    'finite_local_derivative_requests':sum(len(r['derivatives']) for r in recipe['rows']),
    'original_34_recipe_inventory_changed':False,
    'scope':'Original initialized pressure indexed contribution; preserves all actual rows/guards and local bodies. It does not identify final pressure or evaluate the requested local derivatives.',
    'numeric_pressure_computed':False,'N706_closed':False,'N805_closed':False}
(BASE/'evidence/ADDITIONAL_PRESSURE_INDEXED_RECIPE.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ('source_pressure_root','indexed_pressure_child','retained_rows','finite_local_derivative_requests','numeric_pressure_computed','N706_closed')}))
