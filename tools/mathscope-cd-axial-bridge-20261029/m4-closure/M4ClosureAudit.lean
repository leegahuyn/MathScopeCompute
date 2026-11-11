import Lean.Elab.Command
import Lean.Util.CollectAxioms

open Lean Elab Command

/-- Check the exported constants by their defining modules and use Lean's
transitive kernel axiom collector. The core Lean allowlist is exact. -/
elab "#audit_m4_unconditional" : command => do
  let env ← getEnv
  let imports := env.allImportedModuleNames
  if imports.contains `MathScope.M4.Open then
    throwError "M4_OPEN_MODULE_IMPORTED"
  if imports.contains `MathScope.M4.Conditional then
    throwError "M4_CONDITIONAL_MODULE_IMPORTED"
  let required := #[`MathScope.M0.Defs, `MathScope.M0.Finite, `MathScope.M4.Defs,
    `MathScope.M4.Finite, `MathScope.M4.Analytic, `MathScope.M4.Comparison]
  for mod in required do
    unless imports.contains mod do
      throwError "M4_REQUIRED_MODULE_MISSING {mod}"
  let names : Array Name := env.constants.fold (fun acc name _ =>
    match env.getModuleIdxFor? name with
    | some idx =>
      if imports[idx.toNat]!.toString.startsWith "MathScope." then acc.push name else acc
    | none => acc) #[]
  if names.isEmpty then
    throwError "M4_EXPORTED_DECLARATIONS_MISSING"
  let allowed := #[`propext, `Classical.choice, `Quot.sound]
  let mut violations : Array String := #[]
  for name in names do
    let axioms ← Lean.collectAxioms name
    let userAxioms := axioms.filter (fun axiomName => !allowed.contains axiomName)
    unless userAxioms.isEmpty do
      violations := violations.push (s!"{name}: {userAxioms.toList}")
  unless violations.isEmpty do
    throwError "M4_USER_AXIOM_IN_TRANSITIVE_CLOSURE {violations.toList}"
  logInfo m!"M4_UNCONDITIONAL_CLOSURE_CLEAN {names.size} exported MathScope declarations"
