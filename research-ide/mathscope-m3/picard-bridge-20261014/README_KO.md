# N6 실제 Picard 정의역/노름 연결 검증 — 정확 산술 단계

## 목적과 범위

PR #30 HEAD \`26e51d2c2c92169b6416c2af246aacd9ac1330c3\`에서 시작한다.
기존 N6의 230개 미계산 jet, 38개 전역 Guard, 1,020개 PDE 잔여항을 임의 소거하지 않는다.

M2의 실제 fixed-order \`n=1\` Picard 소스 인증서와 원본 N6가 요구하는 **모든 보정차수, 실제 매개변수, 공통 복소 \`eta\`-근방 및 full-field 도함수**를 구분한다.

\`run_source.mjs\`는 source repository의 실제 pinned 바이트/길이/SHA256을 검사한 뒤, M2 원본 6×6 Picard A0/A1/forcing과 n=1 source-derived bounds/certificate를 실행한다. n=1..8이 소스 레벨에서 공유하는 A1 sparsity를 확인한다. 이는 모든 차수의 실제 RHS를 계산했다는 뜻이 아니다.

\`verify_majorant.py\`는 독립적인 정확 유리수/단항식 산술로 source **충분조건**을 전개한다.

원본 n=1 문헌/소스의 기호 상계를 사용하면

\`\`\`text
delta = rho/(1024 Q)
B = 4096 Lambda^2 Q^3 / t1
C1 = 262144 B^2/delta^2
Delta = delta/8
a^2 = Xa exp(t1/16)

K >= 72 (C1 a)^2 / Delta
  = 9*2^140 Lambda^8 Q^17 a^2/(t1^4 rho^5)
\`\`\`

모든 파라미터가 양수이고 **실제 native A0,A1,f가 동일한 복소 strip에서 유계 정칙함수라는 조건** 아래에서만 이 정량 꼬리 충분조건을 사용할 수 있다. 이는 최소 K가 아니며, 거대한 K항을 실제 계산한 것도 아니다. 이 정도의 거친 상계는 K를 직접 열거하는 방법보다 원본 해석적 tail 증명을 사용하는 것이 필요한 이유를 보여준다.

## 원본 N6로 연결하기 위한 최소 열린 정리

| ID | 실제 미증명 의무 |
|---|---|
| PB-COMPLEX-STRIP | 실제 native 각 보정차수의 A0/A1/forcing 및 inverse에 공통 \`eta\` 복소 strip과 유계 상계 |
| PB-NATIVE-IDENTITY | M2의 source-derived 상계에 사용한 함수가 native source DAG의 모든 coefficient, binder 및 branch와 같음 |
| PB-PREVIOUS-ORDERS | n>=2의 진짜 완료된 이전 차수·모멘트·cutoff가 현재 forcing에 주는 노름 상계 |
| PB-ALL-BANDS | N6 모든 band/label/copy의 입력 image, 전역 support, W/M/S·Haar·PDE를 선행 해석 증거와 연결 |

**검증 범위:** 원본 M2 \`n=1\` 소스 바이트, sparse A1, 꼬리 상계 식의 정확 산술 및 부정 대조군만 검사한다. 새 native 실수/복소 domain·sup-norm enclosure를 만들어 내지 않는다. 논문에 나온 존재를 실제 numerical evaluator 또는 Lean 커널 검증과 혼동하지 않는다. N6-01 OPEN/N6-02 PARTIAL, M3 56/64, M4, 원래 producer/main/public URL 변경 없음.

## 재현 (GitHub Actions에서 수행)

\`\`\`bash
node research-ide/mathscope-m3/picard-bridge-20261014/run_source.mjs "$RUNNER_TEMP/n6-picard/source.json"
python -B research-ide/mathscope-m3/picard-bridge-20261014/verify_majorant.py --input "$RUNNER_TEMP/n6-picard/source.json" --output "$RUNNER_TEMP/n6-picard/result.json"
PICARD_BRIDGE_INPUT="$RUNNER_TEMP/n6-picard/source.json" python -B -m unittest discover -s research-ide/mathscope-m3/picard-bridge-20261014 -p 'test_verify_majorant.py' -v
\`\`\`

실제 GitHub Actions 성공/실패 stdout, 검증된 source blobs와 hash, \`result.json\`을 보존한다. GitHub-hosted 작업은 사용자 노트북에 저장소를 내려받지 않는다.


## 157개 실제 자연급수의 후속 결과

같은 PR #31의 n=1 원본 그래프를 24개 입력 함수족으로 분류한 구현은 `natural_series_audit.py`에 있다. 실제 범위 확인은 Y=4인 9개 호출이며 148개 호출의 입력 범위는 미해결이다. 실제 호환 계수 노름을 가정한 복소 수렴 정리와 전체 계수 노름의 미증명을 구분한다.

- [수학적 방법과 조건](NATURAL_SERIES_METHOD_KO.md)
- [실제 실행 결과와 공개 확인 상태](NATURAL_SERIES_RESULTS_KO.md)
- [기계 판독 결과](NATURAL_SERIES_VERIFIED_SUMMARY.json)
- [인증된 클라우드 증거와 원본 HTML](evidence/38537364528/)

기존 결과 문서는 이전 실행의 역사적 기록이다. 최신 N6 잔여 1,288개와 M3 56/64는 유지한다.
