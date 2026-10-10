import Lean.Elab.Import

/- Read-only dependency reporting through the exact API used by the official
   Lean.Shell `--deps` branch. No custom mathematical module is imported here. -/
def main (args : List String) : IO Unit := do
  for filename in args do
    IO.println s!"BEGIN {filename}"
    let source ← IO.FS.readFile filename
    Lean.Elab.printImports source (some filename)
    IO.println s!"END {filename}"
