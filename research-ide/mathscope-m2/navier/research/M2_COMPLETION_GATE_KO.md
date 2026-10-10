# M2 추가 수학 범위의 완료 관문과 M3 진행 순서

## 현재 판정

**원문 M2 64개 수용 항목의 기존 범위 내 PASS와, 이번에 요청한 추가 수학 범위의 전체 완료는 별도 판정이다.** 기존 64개 판정은 유지한다. 현재 추가 작업에서 실제 도함수 식, 수렴하는 함수식 잔여항, 조건부 inverse/curl 구성, 새 Lean 대수 보조정리를 추가했지만, 실행한 `ell=1`의 공분산 양성, 엄밀한 수치 도함수 구간, 원래 배경·pulse의 전체 물리 잔차 및 flat-error 연결은 아직 닫히지 않았다. 따라서 `userRequestedM2Complete=false`, `m3MayStart=false`이다.

이 문서의 기계 판독 기록은 [M2_COMPLETION_GATE.json](M2_COMPLETION_GATE.json)이다. 구현 또는 실행 중인 항목은 해당 기록의 `status`와 실제 증거 경로로 구분한다. 문서나 JSON의 `true`, 파일 이름, 테스트 개수만으로 완료를 부여할 수 없다. 이 기록은 범위가 명시된 **감사 판단**이며, 모든 수학 명제를 자동으로 인증하는 증명 객체가 아니다.

## 1. 원문·이전 판정과의 연결

이번 첨부 Blueprint PDF의 SHA-256은 아래 값이며, 기존 `../../evidence/original-m2-criteria.json`의 `sourceSHA256`과 바이트 단위로 같다. 파일 이름 변경을 새 기준으로 해석하지 않는다.

```text
Blueprint: f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac
Handoff:   e5a3ff18db7c804ca972cf7105068b9f8c9ff49d4e5a3535184ac88fd5872cc5
```

기준 구현 커밋은 `0d846135e72672f99a468ec5caa4e0115236b2a6`, 기준 최종 검증 기록은 `479af296749989a8c6a73cd3e184a0271390f679`이다. 이 추가 문서는 그 판정의 수학적 범위를 확장해서 읽지 않는다.

이번 추가 구현은 `mathscope-m2-completion-20261011` branch의 [구현 커밋 cc075ec6](https://github.com/leegahuyn/MathScopeCompute/commit/cc075ec661b573671ac43a88cf30ccdc2dbb9bd8)에 저장되었고, 기존 공개 페이지의 **v74 (`b9e93d8d`)**로 게시되었다. 게시와 수학 범위의 완료 판정은 아래처럼 별도로 기록한다.

| 근거 | 이 관문에서 사용하는 내용 |
| --- | --- |
| Blueprint PDF 12쪽 | M2는 I2/P4–P6/Y3–Y4/N4–N5, M3는 P7–P8/Y5–Y7/N6–N8. 실제 입력을 고정하는 선행 관문을 유지한다. |
| Blueprint 57–60쪽 | N4는 실제 배경·stress·flat-error·원래 차수의 점근 잔여항을 연결한다. N5는 두 covariance 방향의 양성, 전체 curl의 정확한 divergence, 실제 pulse tail을 연결한다. |
| Blueprint 61–66쪽 | N6의 전체 보정, N7의 전역화·force·energy, N8의 near-terminal 재구성은 각각 다음 단계다. |
| Blueprint 81쪽 | background의 형식 점근급수, cutoff로 실현한 매끄러운 합, Picard/Volterra 급수, 열 적분 등 서로 다른 수렴 계약을 구분한다. |
| Blueprint 83쪽 | 실제 잔차 오차에는 시간 1차, 공간 2차, 압력 1차 도함수와 비선형 오차가 필요하다. 수치·공식 증명·원문 가정을 각각 기록한다. |
| Handoff 2·7·12·16쪽 | 기준 항목 수, 테스트 수, 정리 수를 합산하지 않는다. 현재 source/input/run/hash/음성 대조/수학 범위를 다시 연결한다. 과거 대화의 완료 표현은 새 실행 증거가 아니다. |

`../../evidence/resume-2026-10-11/release-validation.json`은 원문 M2를 `64/64 PASS`로 기록하면서 `fullSameProfileN4`, `fullSameProfileN5`, 전체 물리 잔차·flat-error, 새 Lean을 `false`로 구분했다. `../evidence/acceptance.json`도 N4/N5의 원문 16개 PASS와 `packageCompletionGate=false`를 함께 보존한다. 이번 보조정리 14개를 더해 “78개 완료”라고 세지 않는다.

## 2. 새 결과의 정확한 범위

| 항목 | 확보하거나 구현한 결과 | 별도로 필요한 결론 |
| --- | --- | --- |
| 기존 실제 1차 pulse 미분 | `ell=1`, 고정 label의 R/Z/T 1차 도함수, 원래 moving frame와 envelope, `terms:0` 및 factorial tail. 이전 실제 축별 receipt가 있다. | 전체 수치 도함수 값, 양의 covariance weight, 전체 물리 잔차 |
| 실제 공분산 1차 미분 | 원래 두 sign의 theta/z/mass 적분과 전체 leading target을 미분한다. `H y=T`로부터 `y_a=H^{-1}(T_a-H_a y)`를 구성한다. 실제 R source 검사 5개와 별도 Z·T source 축 검사 각 8개 그룹이 통과했고 원본 log를 보관했다. | 실행 member의 `det(H)≠0` 및 `y_±>0`, 수치 inverse 조건수와 오차, 경계의 제곱근 미분 |
| 실제 R/Z/T 2차·혼합 pulse 미분 | 각 sign의 20성분 변분계, RR/RZ/RT/ZZ/ZT/TT, 실제 coefficient에서 만든 FTC norm, 0항 또는 첫 ordered-integral 보정항과 별도 수렴 tail을 구성한다. 실제 `terms:1` source 검사 7개가 통과했고 실행 당시 source/kernel hash를 대조했다. | 공통 all-band C3/Gaussian 상수, 실제 quadrature, 전체 weighted field의 전역 오차 |
| 실제 local full curl | 원래 phase, pulse, covariance weight, transverse/longitudinal cutoff, `sqrt(epsilon)`, 원통 기저항을 포함하는 local potential의 전체 curl을 구성한다. 최종 실제 source 검사 5개와 두 sign의 기하·혼합 미분 전제가 통과했다. | 양의 weight 정의역의 실행 member 인증, 모든 slow partition/label의 결합, 전역 물리 잔차·flat-error |
| 새 Lean 대수 보조정리 | 공식 pinned Lean 4.34.0-rc2에서 14개 선언을 컴파일하고 별도 import 후 공리를 감사했다. | 실제 source의 해석학적 가정과 이 보조정리의 Lean 인스턴스 연결 |

새 구현의 `COMPLETED`는 해당 행의 **명시된 구성 범위**에만 적용한다. 수치 적분을 실행하지 않은 exact expression, 조건부 inverse, local curl을 실제 전역해의 인증된 수치값으로 표시하지 않는다. 아래의 실제 application Worker 경로는 실행했으며, 브라우저 조작과 게시된 페이지의 확인은 별도 실행·배포 증거를 요구한다.

새 source 실행 기록은 `evidence/differential-extension-20261011/`에 있다. 2차 source의 compiler hash는 `c3ad36b3fb6d9e0b2b0617dc33ee62b8a1d4b3fd4ac7f825a35826140a898894`이며, 54개 amplitude 도함수 행과 54개 endpoint 행, 각 sign의 104개 FTC scalar bound를 생성했다. 공분산 R의 이전 테스트 log에 실행 당시 source SHA가 없었던 제한은 역사 기록으로 보존했다. 그 뒤 `actual-covariance-sensitivity-source-runtime.json`에서 같은 실제 source를 **다시 실행하고 runtime source SHA를 기록**했다. 현재 구현의 provenance는 이 새 실행과 다음 Worker 비교로 확인하며, 이전 log의 제한을 새 실행에도 적용하지 않는다.

최종 local curl의 compiler hash는 `554cc288213b1d96de9f81c9da4e387ab58afe3438388a0fbbf5660f1b0c192d`이다. 원래 자동 미분에 남은 동일한 0 branch를 독립 원자로 해석해 기하 항등식을 거절한 초기 checker 실패와, 곱의 결합 순서가 다른 AST node ID를 비교한 테스트 실패도 보존했다. 전자는 세 branch가 정확히 같은 경우에만 적용하는 점별 항등식으로, 후자는 모든 원래 factor를 유지한 정확 유리함수 비교로 해결했다. 최종 source 5개 검사가 통과했으며, 이 개발 과정의 실패를 의도한 음성 대조나 새 통과 개수로 세지 않는다.

### 실제 source와 application Worker의 연결

다음 네 실행은 직렬로 수행되었고 모두 **exit code 0**이었다. 각 JSON은 실제 요청, 환경, compiler hash, 결과와 certificate hash, runtime source SHA를 포함한다. 이 네 실행을 새로운 수학 정리 네 개나 원문 수용 항목 네 개로 세지 않는다.

| 실행 기록 | 실제 경로와 확인한 결과 |
| --- | --- |
| `actual-covariance-sensitivity-source-runtime.json` | R 방향, `ell=1`, `terms:0`의 실제 source 재실행. 실행 시점의 source SHA를 기록했다. |
| `actual-covariance-sensitivity-worker-runtime.json` | 같은 요청을 application Worker factory로 실행했다. 앞 source 실행과 compiler·수학 결과·certificate hash가 모두 같다. |
| `actual-pulse-jet-worker-runtime.json` | R/Z/T 2차·혼합 미분, `terms:1`을 Worker로 실행했다. 앞서 source 검사에서 생성한 compiler hash와 같다. |
| `actual-full-curl-worker-runtime.json` | `terms:0`의 조건부 local full curl을 Worker로 실행했다. 앞서 source 검사에서 생성한 compiler hash와 같다. |

공분산의 source/Worker compiler hash는 `67e500546cd8dcbf5404aa5ce82900a8dabefe09fe76bae07ec6461b3ea1b7bd`이다. 세 Worker 결과의 5·4·3개 패널에서는 **source path가 있는 원본 값 셀**을 해당 source 값과 비교했고, 수치 물리 좌표는 생성하지 않았다. 각 행은 source 경로를 보존한다. 항목명 label 셀과 source path가 없는 보조 셀은 이 값 비교에서 제외되므로, 모든 표시 셀이 source에 연결되었다고 해석하지 않는다. 행 경로의 보존 역시 행 전체의 별도 동등성 비교를 의미하지 않는다. 이는 정확한 식을 반환하는 runtime/Worker와 값 셀의 연결 확인이며, numerical quadrature나 브라우저 화면 조작의 검증은 아니다.

추가로 [Z source 기록](evidence/differential-extension-20261011/actual-covariance-sensitivity-axis-Z-source.json)과 [T source 기록](evidence/differential-extension-20261011/actual-covariance-sensitivity-axis-T-source.json)은 `ell=1`, `terms:0`을 축별 별도 process에서 실행한 결과다. 두 sign의 실제 parameter root·index, 원래 H·전체 target body의 미분, inverse 항등식 6개, 유한식·적분 tail 및 조건부 정의역을 각 8개 검사 그룹으로 확인했다. 원래 program hash는 checker가 식을 추가하기 전에 기록했다. 두 실행의 48개 literal-import source manifest는 같고, 실행 전후 SHA 및 이번 최종 검토 시점의 실제 파일 SHA가 모두 일치한다. 이는 R/Z/T 각 방향의 실제 source 실행을 확보한 결과이며, Z/T를 Worker·브라우저에서 실행했다거나 양성·수치 구간을 추가로 증명했다는 뜻은 아니다.

### 표시 셀 범위 교정과 원본 실행의 보존

[별도 표 결속 감사](evidence/differential-extension-20261011/replay-view-binding-audit.json)는 보존된 replay의 bundle·계산 결과 hash를 검사한 뒤, source path가 있는 값 셀의 일치와 각 행이 가리키는 원래 값의 존재를 확인했다. source를 재컴파일하거나 브라우저를 다시 실행하지 않았다.

| 실행 결과 | 경로가 있는 행 | 비교한 원본 값 셀 | 경로 없는 항목명 셀 | 빈 placeholder |
| --- | ---: | ---: | ---: | ---: |
| 공분산 R source 및 Worker 각각 | 69 | 183 | 45 | 0 |
| 2차 pulse jet Worker | 173 | 1,132 | 52 | 0 |
| local full curl Worker | 76 | 155 | 55 | 0 |

이 수는 생성된 패널·관련 표의 검사 범위다. 행은 source 경로가 존재하는지 확인했으며, 행 전체를 별도로 동등성 비교한 것은 아니다. 원래 `allCellsSourceBound=true` 표기는 경로 없는 항목명까지 포함하는 것으로 읽힐 수 있어 `false`와 `checkedCellsWithSourcePathsMatchSource=true`로 교정했다.

원본 runtime JSON과 원래 실행기는 구현 커밋 `cc075ec661b573671ac43a88cf30ccdc2dbb9bd8`에 보존되어 있다. 각 JSON의 `postRunMetadataCorrection`은 원래 record·실행기 SHA, 교정 후 reporter SHA와 사유, 별도 표 감사의 SHA를 구분한다. 이번 최종 검토에서 원본 커밋의 실제 바이트와 원래 SHA를 대조했고, 표시 범위 flag 이외의 원본 필드—요청·scope·graph·계산·certificate·runtime SHA 및 실행 시간—가 보존된 것을 확인했다. 추가된 셀 개수는 별도 감사에서 얻은 값이다. 현재 reporter의 SHA로 과거 실행기의 SHA를 바꾸지 않았다.

현재 JSON은 최종 실행·배포·브라우저 기록, source module과 Worker, 관련 문서의 SHA를 실제 파일에 대조한 스냅샷이다. 참조 파일이 이후 바뀌면 실행과 source의 연결을 다시 판단해야 한다. hash만 새로 계산하여 과거 실행을 변경된 코드의 증거로 승격하지 않는다.

### 공개 source와 실제 브라우저 QA

`evidence/differential-extension-20261011/published-source-verification.json`은 [기존 공개 M2 페이지](https://project29770.websitepublisher.ai/v0.3.1.html)의 **v74 (`b9e93d8d`)**를 확인한 기록이다. 공개 HTML 전체가 로컬에서 생성한 정확한 patch candidate와 바이트 단위로 같았고, 두 파일의 SHA-256은 모두 다음 값이다.

```text
14c0cd8068fc27e5810df2cc82d988b8c1fc134bfbee5ee3aa6e075e939c6e75
```

검증한 bundle과 Worker가 게시물에 유지되었으며, 기존 M1 script와 visualization script도 보존되었다. 현재 파일의 bundle·Worker SHA도 이 공개 검증 기록과 일치한다. 새 페이지나 asset을 추가하지 않고 기존 페이지를 갱신했다.

**실제 브라우저 QA 판정은 `COMPLETED_WITH_LIMITATIONS`이다.** [브라우저 기록](evidence/differential-extension-20261011/browser-qa.json)과 [원본 log](evidence/differential-extension-20261011/browser-qa.log)에 공개 페이지의 세 새 예제를 각각 한 번씩 직렬 실행하여 모두 `COMPLETED`에 도달한 결과를 남겼다. 12개 패널이 `READY`였고, 세 실제 요청의 compiler·수학 결과 hash가 현재 Node Worker 기록과 일치했다. 공분산의 브라우저 요청은 R 방향이며, 이 일치를 모든 요청·환경에 일반화하지 않는다.

다섯 경로와 12개 패널에서 1348×936 CSS viewport의 의도하지 않은 가로 넘침은 관측하지 않았다. 긴 정확한 식을 위한 내부 스크롤은 유지한다. `arithmetic.elliptic` 실행 기록을 실제로 가져와 다시 계산한 결과는 `MATCH`였다. 입력만 불러온 단계에서는 새 job을 제출하거나 가져온 결과를 채택하지 않았고, 가져온 증거의 자동 신뢰·저장도 하지 않았다. 이 브라우저 replay를 세 NS 예제의 replay 검사로 확대하지 않는다.

`i2-blowup-pair`에서 실제 카메라 버튼을 30회 조작한 뒤 표시된 runtime draw p95는 4.1ms였고, representation revision은 1에서 31로 바뀌었으며 입력·결과·source hash는 유지됐다. 이 측정 창에는 초기 페이지·결과 그리기도 포함된다. 카메라 동작만의 표본 백분위나 종단 간 지연을 측정한 값은 아니다.

360/390/412 CSS px 검사는 **미실행**이다. 사용 가능한 브라우저에는 광고된 viewport emulation API가 없었고, 임시 `file://` iframe harness 이동은 명시적인 URL 보안 정책으로 거절됐다. 다른 경로나 숨은 API로 우회하지 않았다. 따라서 데스크톱 관측이나 screenshot을 모바일 QA로 표시하지 않는다.

반환된 최근 console 200건은 extension metadata 오류 188건과 GPU가 비활성화된 환경의 WebGL context 생성 오류 12건이었다. 그 창에서 다른 오류는 관측하지 않았지만 전체 이력의 무오류를 보증하지 않는다. `strictConsoleClean=false`를 유지하고 WebGL 검증을 선언하지 않는다. M2의 CPU Canvas2D 표와 실제 Worker가 관측된 조작을 수행한 범위만 기능 확인으로 남긴다.

이 브라우저·배포 검증은 G-POS/G-NUM/G-CURL/G-N4/G-N5의 남은 수학 의무를 바꾸지 않는다. M3 시작 관문도 여전히 닫혀 있다.

### 2.1 두 번 미분한 실제 변분계

고정된 label에서 `w_v=Mw`의 원래 coefficient body를 미분하면

\[
\begin{aligned}
(w_i)_v&=M w_i+M_iw,\\
(w_{ij})_v&=M w_{ij}+M_iw_j+M_jw_i+M_{ij}w.
\end{aligned}
\]

같은 방향에서는 두 교차항이 합쳐져 계수 2가 된다. 움직이는 초기점·평가점의 미분은 일반 커널에서 보존하고, 실제 source의 고정 끝점에서는 그 미분이 0임을 body에서 계산한다. 정규화된 initial datum과 물리 amplitude의 initial datum은 다르다.

실제 `t=P B w`에서 frozen representative의 `P_i=0`이지만 `P(v)` 자체를 제거하지 않는다.

\[
t_{ij}=P\,(B_{ij}w+B_iw_j+B_jw_i+B w_{ij}).
\]

전체 증강계의 잔여항을 `E_N`이라 하면 이 도함수의 componentwise absolute tail은

\[
P(v)\,(\|B_{ij}\|+\|B_i\|+\|B_j\|+\|B\|)E_N
\]

으로 연결된다. 이 식과 `N=0` 또는 `N=1` 유한식의 제공은 decimal quadrature의 완료와 다르다.

### 2.2 실제 coefficient의 FTC norm

고정된 slow parameter `a`에 대해 실수 coefficient `f(v,a)`가 `0≤v≤Ls`에서 C1이면

\[
\sup_{0\le v\le L_s}|f(v,a)|
\le \sqrt{1+f(0,a)^2}
+\int_0^{L_s}\sqrt{1+(\partial_v f(v,a))^2}\,dv=:U_f(a).
\]

`M`, `M_i`, `M_ij`, `M_v`, `B`, `B_i`, `B_ij`의 각 원래 entry에 이를 적용한다. 행합의 최댓값으로 induced infinity norm을 만든다. 특히 `M_ijv`를 실제로 생성하며, 기존 completed C2 상계를 C3 상계로 재명명하지 않는다. 제곱근의 내부에 `1`을 두어 절댓값 0에서 생기는 미분 분모 문제를 피한다.

이 norm은 slow parameter에 의존하는 **정확한 유한 적분식**이다. `f`와 `f_v`의 joint continuity가 있으면 compact slow neighborhood에서 `U_f`들이 유계다. 따라서 미분된 ordered-integral 급수의 factorial tail이 그 neighborhood에서 균등하게 0으로 가고, 실제 해의 parameter 미분과 연결된다. 단지 한 점에서 tail이 0으로 간다는 사실만으로 미분·극한 교환을 주장하지 않는다.

실제 source에서는 고정된 finite active background recipe와 원래의 비영 분모를 유지한다. 예를 들어 nonzero integer angular carrier가 `|n_tan|≥|p|/R>0`을 준다. 대표점·carrier 선택을 바꾸는 경계에서의 미분은 이 계약에 포함하지 않는다. 이 방법은 원래 coefficient에서 유한한 local norm을 제공하지만, 모든 band/representative에 공통인 평가된 C3 상수나 Gaussian/flat-error 상수를 자동으로 제공하지 않는다.

## 3. 완료를 위해 남은 구체적인 의무

다음 항목은 “추후 검토”라는 이름만 남기지 않고, 닫기 위해 필요한 입력·출력과 증명 조건을 고정한다. source snapshot이 바뀌면 증거도 다시 연결해야 한다.

### G-POS: 실제 member의 covariance 정의역과 제곱근

**입력:** 같은 original source, 정확한 `ell`, 선택한 slow box와 대표점, 실제 `H`, 전체 leading target `T`, `H`의 적분 오차 및 원래 `ellMinimum/qStar` 구성.

**필요한 출력:** 사용하려는 member가 인증된 band 조건을 만족한다는 증거, 또는 그 member의 별도 검증에서 얻은 양의 `d0,y0`와 `|det H|≥d0`, `y_±≥y0`인 명시된 열린 영역. `ell=1`이 조건을 만족한다는 결론은 아직 없다. 이는 `ell=1`에서 양성이 거짓이라는 판정도 아니다. 기존 all-band family가 `ell≥ellMinimum`에서 제공하는 양성을 무효화하지 않으며, display member에 그 조건을 자동 적용하지 않는다.

**증명 의무:** 적분·truncation 오차를 포함한 실제 두 column과 target의 연결, inverse 분모의 비영성, 두 sign의 양성. `a_±=sqrt(y_±)`의 도함수는

\[
a_i=\frac{y_i}{2a},\qquad
a_{ij}=\frac{y_{ij}}{2a}-\frac{y_i y_j}{4a^3},\qquad
y_{ij}=H^{-1}(T_{ij}-H_{ij}y-H_i y_j-H_j y_i)
\]

에 필요한 분모·도함수 상계를 함께 요구한다. 닫힌 stress 경계에서는 `y=0`이므로 위 나눗셈을 그대로 평가하지 않는다. 원래의 구체적인 `e_a`, `e_b*delta^-3` factorization과 양의 smooth coefficient를 통해 필요한 제곱근 flat jets를 증명해야 한다. 임의의 양의 flat 함수라는 말만으로 smooth square-root extension을 대체하지 않는다.

### G-NUM: 엄밀한 수치 도함수와 적분 구간

**입력:** exact source graph/hash, 명시된 수치 영역·precision·truncation order, 시간/공간 도함수 차수, 실제 coefficient와 source tail.

**필요한 출력:** `w`, `w_i`, `w_ij`, `t_i`, `t_ij`, `H_i`, 필요한 weight/curl 도함수 각각의 directed enclosure와 독립된 오차 예산. Volterra truncation, 원래 source/Picard/heat 적분, finite quadrature, 반올림, inverse 조건수, 제곱근 경계 오차를 모두 포함한다.

**증명 의무:** 적분기의 domain split, 무한 열 적분의 tail, ODE의 coefficient·solution enclosure, 도함수 평가의 안정성, 모든 오차 합이 요청 tolerance 이하임. 표시용 0항/첫 적분항을 exact limit으로 부르거나, 작은 sampled residual을 연속 영역의 상계로 해석하지 않는다. 열린 양성 정의역이 없으면 weight/curl 숫자를 무조건 출력하지 않는다.

### G-CURL: 실제 local curl에서 전체 source field로의 결합

**입력:** 원래 `sqrt(epsilon)*sqrt(y)*chi*psi*t` amplitude, `n=grad Phi`, 같은 frozen carrier, `C=n×amplitude/(k|n|²)`와 local potential `i C exp(i k Phi)`, 실제 slow partition과 auxiliary physical map.

**필요한 출력:** 각 label의 실제 전체 curl, conjugate와 physical scaling, 모든 cutoff 미분, 같은 source의 조립된 field, 원래 support/zero extension을 포함한 정확한 divergence 항등식. phase factor를 분리한 정규화된 local curl은

\[
e^{-ik\Phi}\operatorname{curl}(iC e^{ik\Phi})
=-k\,n\times C
+i\,(-D_zC_\theta,\ D_zC_r-D_rC_z,\ D_rC_\theta+C_\theta/R)
\]

이며 `sqrt(epsilon)`, 원통 연결항, transverse fast derivative를 생략할 수 없다. `D_r=∂R+M_i d_r R^{d_r-1}∂xi`, `D_z=epsilon ∂Z` 및 원래 `D_r v=D_z v=0`의 physical-map 관계를 사용한다.

**증명 의무:** source phase-gradient 일치, amplitude의 transversality, cutoff 경계의 smooth trace, 모든 active label을 한 번만 세는 partition, 서로 다른 label의 support 분리와 같은 label의 모든 교차항 보존. 고정 box의 조건부 local curl만으로 global slow-partition 결합을 판정하지 않는다.

### G-N4: 실제 background·stress·flat-error의 물리 잔차 연결

**입력:** 동일 canonical coefficient sequence, 각 차수의 실제 moment repair, cutoff schedule, 원래 pressure와 vector potential, 실제 derivative/tail 상수.

**필요한 출력:** 선언된 물리 영역에서

\[
\mathcal R(u_B,p_B)=-\operatorname{div}T_{\rm phys}+E_B
\]

의 실제 식 연결과, 필요한 모든 차수의 `E_B` 및 asymptotic remainder 상계. Blueprint 57쪽의 Proposition 5.5 계약이다. 아직 pulse로 소거하지 않은 stress를 잔차에서 삭제하지 않는다.

**증명 의무:** Lemma 5.4에 넣는 `C_hat`, log-power, cutoff threshold와 derivative loss의 실제 값/생성 규칙, 무한합과 미분/곱의 교환, chart·축·annulus 경계. finite prefix가 정확히 inactive인 나머지를 갖는 것과 `q→0` 전 영역의 모든 차수 flat bound는 다른 명제다. completed C2 또는 finite high-jet 검사를 all-order 물리 잔차의 증명으로 승격하지 않는다.

### G-N5: primary wave의 전체 물리 잔차와 다음 correction 단계의 입력

**입력:** G-CURL의 실제 field, G-N4의 background·pressure·stress, 실제 eikonal remainder, 모든 pairwise harmonic, 원래 cutoff tail.

**필요한 출력:** 같은 `u,p`를 사용하는 직접 물리 잔차와 분해식의 일치, covariance 소거 후 남는 항의 support·mean·scale·derivative bounds, N6에 넘길 실제 finite-state 데이터와 flat-tail interface.

**증명 의무:** `1/2` angular factor, Haar/Jacobian, 원래 비영 `epsilon*v*(H_T-G H_Z)+b*n_r`, cutoff 밖의 `(1-psi)f+psi' t`, 비선형 `div(du⊗du)`와 mode 간 교차항을 유지한다. Gaussian label 합에 필요한 공통 상수와 summable tail을 제공해야 한다. `H y=T`인 평균 covariance 식은 pointwise NS PDE residual 자체가 아니다.

직접 residual의 엄밀 계산에는 시간 1차·공간 2차 velocity와 공간 1차 pressure가 필요하다. velocity가 potential의 curl이면 공간 3차 potential, 또는 그와 동등한 source 식 재작성과 오차 정리가 필요하다. 두 번 미분한 raw pulse만으로 이 차수 의무가 사라지지 않는다.

### G-LEAN: 실제 분석적 가정의 형식 연결

**이미 확보한 출력:** `../lean/MathScope/M2/Navier/DifferentialAlgebra.lean`의 14개 주정리, 공식 kernel/source hash, fresh import, 선언별 `#print axioms`, 가짜 `False`·혼합 교차항 누락·원통 기저항 누락의 실패 기록. 양성 증명에는 `sorryAx`나 새 공리가 없다. 기본 Lean의 `propext`, `Classical.choice`, `Quot.sound` 의존성은 기록되어 있다.

**추가 입력:** 실제 function space, domain, source definitions와 matrix/vector representation, 비영 분모·양성, 실제 미분가능성 및 적분/Volterra 극한 교환의 증명.

**필요한 출력:** 앞서 커널로 검사한 조건부 대수 정리의 가정을 실제 source에서 해소한 Lean 선언과 동일한 해시·커널 감사. 필요하면 coefficient regularity → local uniform variation convergence → covariance differentiation → positive inverse/square root → physical evaluated curl 순으로 연결한다. 추상 `Differential` 구조가 Leibniz 법칙을 가진다는 입력 가정은 실제 source가 미분 가능하다는 증명이 아니다. 새 대수 보조정리가 생겼다는 사실과 전체 source 해석학을 Lean으로 완료했다는 결론은 별도로 표시한다.

이 관문의 M2 잔차 의무는 N4/N5에서 N6로 넘기는 **실제 source 연결**이다. N6의 전체 correction cycle, N7의 전역 force/energy 정리까지 이름만 M2로 바꾸어 완료 처리하지 않는다. 사용자가 요청한 전역 물리 연결의 최종 결론은 이 bridge와 이후 N6/N7 증거를 함께 필요로 한다.

## 4. 완료 승격에 필요한 증거 규칙

1. 원문 기준 ID·PDF page·원문 문구·source hash를 고정한다. 기존 기준을 짧은 새 문장으로 교체한 뒤 PASS를 재사용하지 않는다.
2. 구현 source와 실제 input revision, compiler/theorem/kernel, run ID, 명령·exit code, artifact/log hash, domain·precision·assumptions를 연결한다. source나 가정이 바뀌면 기존 run은 새 source의 증거가 아니다.
3. exact 식 구성, 유한 기계검사, 분석적 증명, 엄밀 수치구간, 형식 kernel 증명을 독립된 결과 종류로 저장한다. generic fixture는 실제 source 실행으로 승격되지 않는다.
4. 증거가 없는 경우 `OPEN` 또는 `IMPLEMENTED_EXECUTION_PENDING`으로 남긴다. `allTestsPass`, caller가 넣은 완료 flag, copied graph/receipt, README의 문장만으로 `VERIFIED`를 만들지 않는다.
5. 적어도 교차항·cutoff/기저항 누락, 양성/비영성 조건 누락, stale source 또는 위조 객체에 대한 음성 대조를 포함한다. 음성 대조의 성공은 잘못된 입력이 거절되었다는 뜻이며, 원래 수학 가정의 독립 증명을 대신하지 않는다.
6. `userRequestedM2Complete`는 필요한 각 입력 정의역·수치·source residual/flat-tail 연결이 모두 별도 증거로 닫힌 뒤에만 바꿀 수 있다. 이 문서의 hash를 다시 계산하거나 테스트 개수를 늘리는 행위는 이 조건을 충족하지 않는다.

## 5. M3의 정확한 진행 순서

현재는 **M2의 추가 완료 관문을 통과할 때까지 M3를 시작하지 않는다.** 그다음 작업 순서는 `P7 → P8`, `Y5 → Y6 → Y7`, `N6 → N7 → N8`이다. 독립 트랙의 병렬 작업 가능 여부와 각 모듈 원문의 실제 선행 조건은 아래처럼 보존한다.

| 작업 | Blueprint의 실제 선행 조건 | 이번 진행에서의 입력·출력 관문 |
| --- | --- | --- |
| P7 | P1, P4 — PDF 33–34쪽 | global L-function bundle의 local factors, conductor·gamma·normalization·hypotheses와 실제 계산 오차를 먼저 고정한다. |
| P8 | P1, P2, P3, P4 — PDF 35–36쪽 | P7의 이번 출력도 함께 인계한 뒤 ObjectSpec/CalculationManifest/RepresentationContract/EvidenceRecord/BridgeLedger를 연결한다. 원문에 P7 선행 조건이 있었다고 쓰지 않는다. |
| Y5 | Y2, Y4 — PDF 45–46쪽 | Delta의 대상·단위·모델·ensemble·가정·추정기를 고정한다. |
| Y6 | Y2, Y3, Y5 — PDF 47–48쪽 | 4D→3D 관측의 타입과 잃는 정보, 조건부 보존 정리를 기록한다. |
| Y7 | Y1, Y2, Y3, Y4, Y5, Y6 — PDF 49–50쪽 | finite/conditional/numerical/external/open continuum 증거를 구분해 봉인한다. |
| N6 | N5 — PDF 61–62쪽 | 실제 현재 state의 wave→covariance→auxiliary mean→radial moment 보정, 전체 잔차 재계산, flat tail을 먼저 연결한다. Definition 9.4→Propositions 9.5/9.6→Lemmas 9.7/9.8→Proposition 9.9 순서를 유지한다. |
| N7 | N6 — PDF 63–64쪽 | 완성된 local field에서 전역 cutoff, 실제 force의 smooth extension, 전역 energy를 연결한다. force가 연장된다는 사실을 velocity의 terminal-time 연장으로 해석하지 않는다. |
| N8 | N2, N7 — PDF 65–66쪽 | 원문 재구성 branch의 finite `t<T` 실험과 오차를 연결한다. generic Fourier–Galerkin branch와 원문 재구성을 구분한다. |

Blueprint는 N8의 generic branch가 N2 다음 독립 착수 가능하다고 명시한다. 이번에는 사용자가 “M2 전부 완료한 다음 M3”를 요청했으므로 그 branch도 이 순서 뒤에 둔다. 이는 사용자 작업 순서이며 원문 의존성의 변경이 아니다.

P7/P8의 일반 RH·BSD 등 연구 항목, Y7의 새 continuum 구성 등은 원문대로 `RESEARCH OPEN`을 보존한다. M3의 구현 완료와 그 독립 연구 명제의 증명을 혼동하지 않는다. 각 패키지는 그 원문 정의역과 가정을 갖춘 구체적인 결과가 준비된 다음 단계로만 넘어간다.
