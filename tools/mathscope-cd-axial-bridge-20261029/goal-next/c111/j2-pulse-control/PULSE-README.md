# Second Forced closed-pulse source checker

The archived N1 positive control authenticates the original 4,682,006-record stream and native registry. It independently checks the 240 raw repeat Fourier source slots after replacing only the corresponding registered own-chart wave jets by zero. Real/imaginary pressure derivatives remain in the source. It also directly verifies that all 30 nonzero Signed-tail slots have their own original native wrapper and that both strict pulse collars annihilate its retained derivative factor. The complete archived replay matches byte for byte on a second execution.

The active replay first needs the verified same-run active full-source receipt and exported graph. It then requires the protected active cutoff and wave-body receipts in this folder. The exact registrations reached by the raw-wave ideal must agree with the 160 previously authenticated protected bodies and original actual coordinates. This supplies the raw pulse-collar calculation and the 30 real Signed tail operands. Along the original (H_w), the returned guarded body agrees with the unclipped supported expression on the closed pulse only on the fixed original chart, with the other guards strict and all ordinary operands admitted at the relevant points. One-sided zero jets use an original ordinary source realization at the pulse endpoints. Equality with the unclipped expression on other seams and full stage two stay OPEN.

```powershell
$PulseTool = Join-Path (Split-Path $Tool) 'verify_native_j2_pulse.py'
$Receipt = Split-Path $Tool
& $Python -B $PulseTool --artifact $GitHubArtifact --goal $Tools `
    --predecessor (Join-Path $Predecessor 'first-correction-spatial-source') `
    --native-readback (Join-Path $Receipt 'active-readback.json') `
    --protected-waves (Join-Path $Receipt 'protected-wave-bodies.json') `
    --protected-tails (Join-Path $Receipt 'protected-cutoff-tails.json') `
    --out (Join-Path $Receipt 'active-closed-pulse.json')
```

For the archived control, pass `--archive-control`, select the archive and its predecessor from the main README, and pass the original pinned `continuation71/repeat-support/closed-pulse-final/closed-pulse.json` as `--closed-pulse`. Use Python assertions and a fresh output.
