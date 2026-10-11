# 원래 작은 결합 성분 VALUE 후처리의 독립 검토

검토자: `sensitivity_kernel`. 날짜: 2026-10-11 UTC.

## 결론과 범위

새 `actual-physical-center-negative-mode-value-kernel.mjs`, 일곱 경량 테스트, 한국어 설명, 그리고 **source4가 이미 출력한 실제 physical-center certificate**를 읽었다. 선언된 전제 아래 두 작은 성분의 정확한 수치 후처리와 실제 root의 의미에서 구체적인 수학·구현 오류를 발견하지 못했다.

이 helper는 `sourceAuthenticated:false`를 유지한다. 이 검토 시점의 source4 전체는 아직 최종 관측 PASS를 승인하지 않았다. 읽은 physical certificate의 부분 완성과 전체 프로세스의 성공을 구분한다. 새 helper를 실제 원본 결과에 결합하는 pin/build/runtime의 최종 연결도 별도 검증 대상이다. frozen source4 imports를 수정하거나 실제 source constructor를 추가 실행하지 않았다.

## 1. 값의 의미와 실제 root

원래 physical adapter의 `bindNewCenterFamily`는 두 sign family마다 동일한 실제 coupled covariance system에서

\[
a=w_+(L_s/2),\qquad b_{\rm other}=w_-(L_s/2)
\]

를 생성한다. 코드상 각각 `G.covarianceValue(f.system,0,v0,values)`와 `G.covarianceValue(f.system,1,v0,values)`다. `values`는 교정된 물리점과 같은 허용된 대표점이며 `v0=Ls/2`다. `center.other`에는 \(A_c,u,A_0,\sqrt y\) 또는 radial derivative의 \(R_\#\) 배율이 없다.

`w_minus`는 sign family \(-1\)을 뜻하지 않는다. 각 sign family에 \((w_+,w_-)\) 두 성분이 있다. 따라서 이번 추가 출력은 두 개의 작은 성분 VALUE이고, 기존 derivative 228+42행과 혼동하지 않는다.

source4의 다음 실제 파일을 읽었다.

`research/evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt4-physical-value-certificate.json`

SHA-256:
`f5f172ac9cde85427a537e5814615dacdf36833f2a20f3c6b5f6b7e176b6733c`

그 파일의 root 연결은 다음과 같다. 이 숫자는 이 certificate의 graph namespace에만 속한다.

| sign family | coupled system | `center.a` | `center.other` | `center.v0` |
|---|---:|---:|---:|---:|
| +1 | 0 | 631248 | 631249 | 623359 |
| −1 | 1 | 649606 | 649607 | 623359 |

같은 파일의 `sourceBounds.roots.B=300170`, `S=622784`, `h=9`, `Ls=623014`를 확인했다. source bound의 여덟 체크와 각 family의 여섯 체크가 모두 true다. 실제 unit initial data, 원래 moving pressure/basis/damping, nonzero rounded carrier, Gaussian, 완전한 slow substitution을 검사하는 producer 본문과 대응한다. `P=1`은 별도로 확인된 실제 center 값이다. 작은 결합 성분을 제거한 대체 system을 입력하는 경로는 없다.

원문 (6.2)의 교정된 equation binding도 포함되어 있고, 그 `actualDr`가 같은 physical inverse의 `input.dr`와 일치한다. 이 부분 certificate를 최종 source4와 설치 증거에 결속하려면 최종 관측 process 및 파일 SHA 검사가 추가로 필요하다.

## 2. 수치 상계의 독립 재계산

실제 source의 `sourceBounds.derivation.base`, `.band`, `.cone`은 같은 원본에 대해

\[
B\ge2^{128},\qquad S\ge B^{1024},\qquad
w_+>0,\qquad \left|\frac{w_-}{w_+}\right|\le\frac{B^{260}}S
\]

를 결속한다. private source의 이 전제와 같은 \(w_+\)를 감싸는 새 구간의 \(w_+<1/2\)를 함께 쓰면

\[
|w_-|<\frac12\frac{B^{260}}S
\le\frac12B^{-764}
\le2^{-(128\cdot764+1)}=2^{-97793}.
\]

\(1024-260=764\), \(128\cdot764+1=97793\)이며 부등호 방향도 맞다. 첫 strict 부등호는 \(w_+<1/2\)에서 온다. \(B,S\)의 구체적인 거대 값을 0이나 무한대로 대입할 필요가 없다.

읽은 실제 certificate의 `numerics.values.centers` 두 구간에 대해 exact rational 끝점을 독립적으로 비교하여
\(0<\mathrm{lower}\le\mathrm{upper}<1/2\)를 확인했다. 표시용 binary64 값을 비교에 사용하지 않았다. 또한 `enclosePhysicalCenterCoefficients`에서 이 `centers`가 `encloseAdiabaticPulseCenters`의 실제 center 구간임을 읽었으며, covariance 또는 weighted-amplitude의 별도 정규화 계수를 center 값으로 혼용한 것이 아니다.

새 runtime의 center는 동일한 source 전제에 적합한 directed algorithm으로 다시 계산해야 한다. 기존 certificate에 적힌 interval이나 helper에 넘긴 임의 root ID 자체가 새로운 source 인증을 만드는 것은 아니다.

## 3. 외향 반올림과 API의 제한

helper는 \(p=\texttt{precisionBits}\)에 대해 \(192\le p\le512<97793\)을 확인한다. 양의 분석적 반지름 \(2^{-97793}\)을 격자 \(2^{-p}\)로 외향 반올림하면 한 격자 단위가 되므로

\[
[-2^{-p},\,2^{-p}],\qquad \text{폭}=2^{1-p}
\]

는 실제 값의 유효한 대칭 구간이다. 이 구간 안에 0이 들어가도 원래 성분이 항등적으로 0이라는 뜻은 아니다. helper는 `identicallyZeroClaimed:false`, 양의 `positiveErrorRadius`, 정확한 dyadic 분석적 반지름을 모두 남긴다.

허용 precision 범위에서는 \(2^{97793}\)의 거대한 분모를 실제로 만들지 않고 지수 표현으로 보존해도 반올림 비교가 정확하다. 현재 denominator의 크기는 최대 \(2^{512}\)다. 폭을 요청 tolerance와 exact rational로 비교하고 너무 넓으면 `PRECISION_REQUIRED`를 반환한다. 상대 오차나 부호 판정은 주장하지 않는다.

입력에서는 두 sign family, 네 서로 다른 component root, 유리수 문자열 끝점, \(0<\mathrm{lower}\le\mathrm{upper}<1/2\)를 검사한다. source cone 지수는 caller가 바꿀 수 없다. 결과는 input 객체를 alias하지 않는다. 그러나 sign 순서와 root의 **원래 certificate에 대한 실제 동일성**은 generic helper가 인증할 수 없으며, 코드와 문서가 이를 wrapper 책임으로 명시한다.

## 4. 최종 결합에서 보존할 의무

읽기 시점의 helper가 올바르다는 판단과 다음 설치 의무를 구분한다.

- 최종 source4의 성공·완료·관측 exit 0과 위 physical certificate의 실제 SHA를 결속한다.
- 실제 certificate의 source bounds가 보존되고, base/band/cone 설명만 복사하는 대신 해당 producer의 실제 checks와 원래 source import manifest를 함께 고정한다.
- 두 binding의 sign, `center.a`, `center.other`, system 및 `v0`의 순서가 같은 source의 두 family와 일치해야 한다.
- fresh center 구간을 동일 sign 순서로 넘기며, 그 구간의 positivity와 \(1/2\) 상계를 현재 요청에서 재검사한다.
- 반환 두 값은 `wMinus:{sign}:1:VALUE`, 배율 1인 원래 작은 결합 성분 값으로 표시한다. sign \(-1\)인 wave와 작은 성분 자체를 혼동하지 않는다.
- 결과는 순수 수치 후처리 `sourceAuthenticated:false`이고, 외부에서 관측한 원래 source 증거와 분리한다. 새 private source token이나 원본 graph 재구성을 주장하지 않는다.

전체 derivative 270행을 수정하거나 source4 import manifest에 이 새 helper를 뒤늦게 끼워 넣을 필요는 없다. 이미 생성된 원래 값과 부등식의 exact arithmetic 결과를 별도 두 행으로 추가하고, 새 runtime 알고리즘의 SHA 및 실행을 별도로 기록하면 된다.

## 5. 경량 실행 및 고정된 바이트

[경량 원 기록](negative-mode-values-light-attempt1.json)과 [TAP 로그](negative-mode-values-light-attempt1.log)를 읽었다. 512 MiB Node 실행, 7/7 PASS, 관측 exit 0, 0.13321356200322043초이며 실제 source constructor는 실행하지 않았다. 실제 \(B^{260}/S\) quotient를 독립적으로 구성한 양·음 endpoint, 잘못된 center/부호/root/precision, exact zero 또는 source authority 주입, input 불변과 취소를 포함한다. 본 검토자가 다시 실행하지는 않았다.

세 파일과 로그의 현재 SHA가 해당 경량 기록의 SHA와 모두 일치함을 직접 확인했다.

| 파일 | SHA-256 |
|---|---|
| `actual-physical-center-negative-mode-value-kernel.mjs` | `87db7de6038f6f5fff26027fc08d46c231634512693a4add213ed44ebd39affa` |
| `tests/actual-physical-center-negative-mode-value-kernel.test.mjs` | `2d9722bd7c16605ed2e00a43366036d2fd1a16e06de32b9dbaa52b2010336082` |
| `research/ACTUAL_PHYSICAL_CENTER_NEGATIVE_MODE_VALUES_KO.md` | `48f123d0240299637853d2072922be66e09d39b9d6efd79a3754b99c2ac453c5` |
| `negative-mode-values-light-attempt1.json` | `ad78f6c67b9fc21f701a97d891c8ff3e1fe584838cd2f064e13768e0bb2c74b6` |
| `negative-mode-values-light-attempt1.log` | `1adeaefeb48c8d9767521112e113227aa0a27a82ee19ca8e52962f07ba4c2c59` |
| `actual-common-physical-center-enclosure.mjs` | `f60441131a2650b15b5f3f2aa8894a0462eb0383735a256d895e0c10c70fe6eb` |
| `actual-physical-center-kernel.mjs` | `8f65b781a5b68eb993db4789943e2c09bd05957543749a9582adbab4274b7e08` |

최종 상태: **두 작은 결합 성분 VALUE의 조건부 exact arithmetic와 읽은 실제 source root 연결에 오류를 발견하지 못함. source4 전체 관측 및 최종 pin/build/runtime 결합의 통과는 아직 별도 확인 대상.**
