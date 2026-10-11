# 교정된 source4 원본 물리점·270개 수치 도함수의 독립 최종 검토

검토자: `/root/sensitivity_kernel`  
검토 기준: 2026-10-11 UTC, 아래 source4 최종 실행물과 실행 당시 동결한 파일  
판정: **`SCOPED_EXECUTED_SOURCE_PASS`**

원문 (6.2)의 반지름 지수 괄호를 교정한 **한 실제 허용 물리점**에서, 원래 두 결합계의 변분·공분산·가중치 및 전체 물리 curl을 생성하고 수치 구간에 연결한 source4의 선언 범위에서 구체적인 수학 또는 결속 오류를 찾지 못했다. 최종 실행은 상위 검사 8/8, 관측 종료 코드 0, timeout 없음이다. 이 검토는 M2 전체 완료, 전역 잔차의 수치 구간, 모든 라벨의 수치 계산, 새 Lean 증명, Worker·브라우저 실행 또는 M3 착수를 승인하지 않는다.

이 문서는 이전 `SOURCE4_INDEPENDENT_INTEGRATION_REVIEW_PLAN.json`의 원본 실행 관련 항목을 완료한 **새 기록**이다. 기존 대기 상태 문서, 실패 실행, 잘못된 반지름 지수를 사용한 source3 및 당시 리뷰의 바이트는 수정하지 않았다.

## 1. 직접 대조한 실행과 해시

원래 source constructor를 다시 실행하지 않았다. 저장된 원본 실행물, 현재 코드, 실행 당시 복사본을 읽고 SHA-256·정확한 유리수·행별 원본 root를 대조했다. 독립 교차검사 스크립트는 512 MiB 가상 메모리 제한에서 실행됐으며, **36개 검사 통과, 도구가 관측한 종료 코드 0**, peak RSS 126,754,816 bytes였다. 이는 이미 실행된 source4를 검토한 경량 실행이며, 별도의 source 재실행이 아니다.

| 항목 | 직접 확인한 값 |
|---|---|
| 원본 실행 시작 | 2026-10-11 14:28:53.456083 UTC |
| 원본 실행 종료 | 2026-10-11 14:55:34.424781 UTC |
| 외부 관측 경과 시간 | 1600.967387382996초 |
| 원본 실행 peak RSS | 5,449,146,368 bytes |
| source 기록 / 외부 observer | 모두 완료·PASS·exit 0, observer timeout false |
| source가 기록한 시작 commit | `465b79300ce8f429262ffbf58973d930518afea7` |
| 초기 의존 파일 | 119개: 현재 파일과 실행 당시 복사본 전부 일치 |
| 최종 의존 파일 | 131개: 현재 파일과 실행 당시 복사본 전부 일치 |
| observer의 복사본 목록 | 120개 전부 일치; 초기 closure 외 실행 runner 포함 |

| 실행물 | SHA-256 |
|---|---|
| source4 최종 JSON | `88f7cf6fe5af934d6b3bcacc8ad975e86bd0b37fee2110b9db8c73e72acb129e` |
| source4 외부 process JSON | `91d434d69db5df06ccf5afad4e5e7b71eb442db7a75bdfbc4647d82812e10a3e` |
| 원문 식 결속 JSON | `09fafc1c0c46328e0fac01062362ad9b7936c988c6fca67de79de607ea0a6d79` |
| 실제 물리점·값 certificate | `f5f172ac9cde85427a537e5814615dacdf36833f2a20f3c6b5f6b7e176b6733c` |
| 실제 도함수 본문 certificate | `261c740d78ce36129b422467bd61ec6864cd79b589ddda4a1f5d8ed557a0dcae` |
| 최종 수치 certificate | `46860eb0f5b4c4b891a4b2f1463e23d2e2ad75390ec12fe6cfb9751a5ed1266c` |
| 초기 파일 목록 | `9f9f026e44e9a00ef6a147e31315e4f19a0fd0e5df438956bc6a0ad696798bb4` |
| 최종 파일 목록 | `b9987ab318ca19e18a1897b246ef1a2d2c0507499f9a1fc39d90d2ffa95bd302` |

두 로그, 다섯 certificate, 원문 식, 세 부분 첨부, 원래 selector trace·진단·prepared schema를 포함한 **15개 참조 파일의 해시**를 직접 비교했다. 초기/최종 목록의 공통 파일은 같은 바이트다. 대용량 실행물 3개의 gzip 파일은 압축 바이트의 해시와 **해제한 원본 바이트의 SHA-256**을 각각 대조했다. 압축은 원본 계산 또는 수치 결과를 바꾸지 않는다.

원본 프로그램의 기록된 최종 그래프는 2,776,938 nodes, canonical 129,600,479 bytes, SHA-256 `5360c1375666eb6294285a9f6d063f0b59319d98c48cdebdc91237e020e841b4`다. 이는 실행된 constructor의 전체 그래프 seal에 대한 기록이다. 이 검토자가 그 전체 그래프를 다시 구성해 재계산했다고 주장하지 않는다.

## 2. 원문 반지름 식과 새 물리점의 동일성

원문 PDF SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`, 인쇄 페이지 63의 (6.2)는 다음 식이다.

\[
d_r=2\bigl((1+h)\rho_g-h\kappa_s\bigr),\qquad
\rho_g=\frac{\log(4-\sqrt2)}{\log(4+\sqrt2)},\qquad
\kappa_s=\frac1{100000}.
\]

저장된 20개 typed node를 독립적으로 다시 읽어, 두 항의 합 **바깥에 2가 곱해진 이진 괄호 구조**를 확인했다. 단순히 `formula` 문자열을 읽어 승인한 것이 아니다. `dr=actualDr=628161`은 원래 지도, 역지도 입력, 새 실제 물리점의 `originalTorusMapBinding`에서 동일하다. 최종 수치 certificate의 전체 `originalPhysicalPoint`도 실제 물리점 certificate의 inverse 객체와 정확히 같다.

원래 양의 매개변수는

\[
h=\exp\!\left[-8002\bigl(\exp(1048576)+10\bigr)\right]>0
\]

인 source parameter로 보존된다. 이 결속은 h를 부동소수점 0으로 치환하지 않는다. 원문 helper의 여섯 정의, 원본 profile/expression SHA, 같은 h root를 요구하며, 잘못된 `2*(1+h)*rho_g-h*kappa_s`는 승인하지 않는다.

앞선 독립 영향 검토에서 확인한 대로, 지수 교정의 반지름 배율 차이는 단순 반올림 오차가 아니다. source4는 교정된 원래 지도에서 point·lift·대표점을 새로 생성했다. 이전 source3의 점값이나 root를 새 원문 실행으로 재명명하지 않았다. 새 점은 기존 허용 이론의 작은 변위 영역에 있으며, 기존 점의 고유 μ·ν 수치를 복사하는 대신 새 점의 원래 식과 근방 오차를 다시 연결한다.

## 3. 228개 원래 결합계 행과 42개 물리 도함수

행 키, 부호, 성분, 차수, 원래 도함수, 점 대입값, 정규화값, 양의 scale, coefficient, 본문 결속 표시를 원본 bodies certificate와 최종 수치 certificate 사이에서 **각 행의 모든 필드로** 대조했다. 270개 키는 중복·누락 없이 정확히 일치한다.

| 양 | 수치 행 수 | 범위 |
|---|---:|---|
| `weightedPulse` | 84 | 두 부호 × 세 성분의 slow 1·2차와 v, vv, Rv/Zv/Tv |
| `pulse` | 54 | 두 부호 × 세 성분의 R/Z/T 1차·대칭 2차 |
| `a` | 18 | 두 원래 wPlus 중심의 slow 1차·대칭 2차 |
| `wMinus` | 18 | 두 원래 음의 모드 성분의 slow 1차·대칭 2차 |
| `H` | 36 | 두 열·두 성분의 slow 1차·대칭 2차 |
| `y` | 18 | 두 inverse 가중치의 slow 1차·대칭 2차 |
| `physicalCurl` | 42 | 세 성분 × 네 방향 1차와 열 개 대칭 2차 |

두 실제 원래 matrix마다 \(|\alpha|\le2\)인 10개 다중지수와 두 모드, 즉 **20성분 변분계**가 생성돼 있다. 실제 matrix 미분 및 원래 단위 초기값이 보존되고, `H^{-1}T`와 양의 square root의 유한 미분 항등식·분모 조건도 결속돼 있다. generic 변분 또는 다항식 검사만으로 원래 source 인증을 만들지 않는다.

Pulse 행의 반지름 정규화는

\[
(R_\#)^r\,\partial_R^r\partial_Z^z\partial_T^t
\]

로, **원래 미분을 먼저 수행한 뒤** 고정된 \(R_\#\) 거듭제곱을 곱한다. 이를 가변계수 Euler 연산자 \((R\partial_R)^r\)나 정규화하지 않은 \(\partial_R^r\)로 해석하면 안 된다. 양의 scale을 곱한 후에도 이 \(R_\#^r\)는 pulse 행에 남는다. 물리 42행은 별도의 `physicalValue`를 계산하며 이 slow 정규화 해석과 구분한다.

물리 2차 방향은 `rr, rz, rt, zz, zt, tt, rtheta, ztheta, ttheta, thetatheta`이다. 회전하는 원통 성분에서

\[
N_\theta W=\frac{\partial_\theta W+JW}{R},\qquad
JW=(-W_\theta,W_r,0),\qquad
H_{\theta\theta}W=N_\theta(N_\theta W)+\frac{D_rW}{R}
\]

의 성분 및 방향 기저 연결을 보존한다. 원래 `a(R)`와 그 미분도 전체 물리 미분 안에 남는다. θ를 포함하는 행에 성분 연결 표시, θθ 행에 추가 방향 연결 표시가 각각 정확히 붙어 있다.

특히 `sin(kPhi)=0`을 미분 전에 대입하지 않는다. 원래 전체 curl의 sine 항을 먼저 미분하고 점에서 위상을 평가하며, coefficient는 2차, phase는 3차까지 구분해 생성한다. 물리점에서 음의 가족 rectangle은 배제되고 양의 가족이 활성화된다. 두 가족의 보조 결합계 중심 수치를 모두 출력한다는 사실과, 두 물리 rectangle이 동시에 중앙에서 활성화된다는 주장은 다르다.

## 4. 수렴·초기층·conditioning과 실제 수치 폭

원래 finite auxiliary/matrix bound는 전체 \(0\le v\le L_s\)를 덮는다. Gaussian core만으로 tail 적분을 승인하지 않는다. 실제 움직이는 frame·압력·감쇠·공분산 적분과 처음의 Riccati layer를 유지한다. 중간 구간의 초기층은 양의 \(\exp[-L/(4B)]<S^{-4}\)로 제어하며 정확한 0이라고 놓지 않는다. `originalInitialLayerDiscarded:false`가 최종 source에도 남는다.

원본 finite ledger의 matrix 3313, amplitude 1132, reserve 4096과 새 점의 expanded field/target 조건을 연결한다. 이는 필요한 \(M_i,M_{ij},L\partial_vM_i\)와 유한 auxiliary 미분의 경계이며, 모든 4차 slow matrix 미분이 계산됐다는 주장은 아니다. 각도 phase Hessian은 \(D_r\Phi/R\)를 포함하므로 정규화 뒤 남는 길이 제곱을 **\(B^{64}S^2\)** reserve에 포함한다.

중심 H의 determinant 상한이 음수, inverse 무한대 행 노름 상한이 1 이하, 정규화 가중치가 \([1/8,1/2]\), square root 하한이 1/4 이상임을 저장된 구간의 정확한 유리수로 다시 확인했다. 이 directed conditioning 객체는 `sourceAuthenticated:false`이고, 최종 private 원본 adapter가 해당 원래 H/y와 결합할 때만 실제 source의 근거가 된다.

270행 모두에서 `upper-lower=width`, \(0<\mathrm{width}\le10^{-12}\), `positiveErrorRadius>0`을 Fraction 연산으로 확인했다. 실제 이번 최대 폭은 \(10^{-21}\)보다도 작다. Pulse 계수들의 양의 분석 오차 reserve는 \(2^{-560}\), 물리 curl 계수는 \(2^{-512}\)로 보존된다. 표시용 `displayEnclosure`의 binary64 수치는 판단에 사용하지 않았다.

부분 실행 중 기록한 세 첨부는 `originalSameProcess:true`, `finalSourcePassRequired:true`, `standaloneCompletionClaim:false`이다. 앞 두 첨부의 원래 본문·검사는 최종 source bound에 보존되며, 최종 selector/scale 부분 첨부는 최종 certificate의 대응 객체와 완전히 같다. 중간 첨부 하나만으로 전체 source가 통과했다고 승격하지 않는다.

일부 하위 대수 진단에는 sqrt를 독립 원자로 본 초기 polynomial 비교의 `pass:false`가 보존돼 있다. 이는 버려진 source 실패를 성공으로 바꾼 것이 아니다. 양의 동일 sqrt의 \(r^2=D\) 관계를 별도로 결속하고 나머지 두 유리식 계수가 0임을 확인한 최종 reduction/상위 항등식이 PASS하는 경로다. 모든 중간 객체의 `pass`를 맥락 없이 한꺼번에 승격하지 않는다.

## 5. 모든 양의 scale, 절대 H/y 값과 정밀도 의미

최종 source의 270개 `positiveExactScale` root는 각각 selector-scale 행의 `sourceRoot`와 같다. 이 결속은 원래 \(\ell,Q,\epsilon,k,c_i,L_s,J\)와 palette floor 상관을 유지한 source recipe에서 이루어진다. 원래 FTC 값을 하나씩 정밀 적분했다는 뜻은 아니다. 원본 FTC 피적분자와 face에 대한 증명된 상계를 통해 원래 selector의 범위를 계산하고, 그 selector의 충분히 좁은 반복 로그 구간을 닫는다.

모든 derivative-scale 끝점과 28개 절대값 끝점이 **유리수 잎과 유한 `exp`/`neg`만** 포함하는지 검사했다. 원본 root 이름, 미평가 적분 또는 해 함수는 그 수치 끝점에 남아 있지 않다. 절대값 28행에는 두 가족의 원래 세 성분 pulse/weighted pulse, 네 H 성분, 두 양의 inverse 가중치, 두 중심, 두 mass, determinant, 두 square root, 세 물리 curl 값이 포함된다. H 네 성분과 두 가중치의 source root도 실제 물리점 certificate와 각각 일치한다. H나 determinant의 음수 부호는 별도로 보존되며 모든 H 원소를 양수라고 주장하지 않는다.

여기서 요청한 \(10^{-12}\)는 **명시된 반복 로그 좌표의 구간 폭**이다. 원래 값의 상대오차 \(10^{-12}\)가 아니다. 143개 scale/보조 행 중 `T`와 `etaBeta` 두 행은 넓은 양의 구간을 사용하며 `individualPrecisionMet:false`, `toleranceMet:false`를 명시한다. 두 인자의 불확실성을 포함한 실제 270개 최종 scale과 28개 절대값의 필요한 반복 로그 폭은 모두 충족한다. 이 구분을 지우고 모든 개별 재료가 같은 상대 정밀도로 계산됐다고 표시하면 부정확하다.

## 6. 추가된 원래 wMinus VALUE 두 행

원래 270행의 수와 source4 constructor는 바꾸지 않았다. source4 실제 물리점 certificate에서 결합계 0/1의 `(wPlus,wMinus)` 중심 root는 각각 `(631248,631249)`, `(649606,649607)`이며 v는 각각 \(L_s/2\)다. 두 wPlus 중심의 동일한 포함 구간은 각각 \(0<w_+<1/2\)를 만족한다. 원래 source bounds

\[
B\ge2^{128},\quad S\ge B^{1024},\quad
|w_-/w_+|\le B^{260}/S
\]

로부터

\[
|w_-|<\tfrac12 B^{-764}\le2^{-97793}
\]

이다. 192~512 bits에서 이를 \([-2^{-\mathrm{bits}},2^{-\mathrm{bits}}]\)로 외향 포함하는 새 순수 helper는 수학적으로 타당하다. 정확한 0은 아니다. 이 값은 \(A_c,u,R_\#\)를 곱하지 않은 원래 모드 값이다.

이 helper는 source4의 동결된 119/131 파일에 속하지 않으며, 자체 `sourceAuthenticated:false`이다. source4가 이미 생성한 두 원래 음의 성분 root·관측 certificate SHA·실제 cone premise를 설치 wrapper가 따로 연결해야 한다. 그 연결 코드의 읽기 검토와 부분 certificate projection 경량 검사는 완료했고, 별도 불변 리뷰 `physical-negative-mode-values-20261011/INDEPENDENT_NEGATIVE_MODE_VALUES_REVIEW_KO_SENSITIVITY.md`에 기록했다. 이 source-only 최종 검토는 새 wrapper의 실제 설치/Worker 실행 결과를 대신하지 않는다.

두 부호의 모드 중심값은 **같은 새 slow 좌표·대표점에서 각 원래 결합계를 v=Ls/2로 평가한 값**이다. 새 물리점의 음의 가족 합성 fast 좌표도 중앙이라고 주장하지 않는다는 UI 정정도 읽기에서 확인했다.

## 7. 설치·현재 재계산·원문 전역 실행의 경계

현재 pin/build/runtime 코드는 관측 source8/8·exit0, 원문 식, 물리점 certificate SHA, 초기/최종 import SHA, 동일한 270행 root와 normalizer, source conditioning 본문을 요구한다. 사용자 replay JSON으로 원본 private 객체를 생성하지 않는다. 설치 artifact의 역할은 **고정된 외부 원본 실행 증거**이며, 현재 Worker에서 그 2.7M 노드 그래프를 재구성했다는 뜻이 아니다.

현재 계산은 계수·기울기·일부 target/profile 값의 새 directed 재계산, 설치된 scale과의 새 signed interval 곱, 그리고 별도 raw coupled-value 포함을 구분한다. 설치된 절대값/scale을 보여 주는 패널은 fresh 재계산으로 표시하지 않는다. 이 구분과 R# 정규화 설명은 타당하다. 다만 **실제 pin4/build/runtime/Worker/browser의 최종 관측 결과는 본 리뷰의 승인 대상이 아니며**, 해당 후속 실행 기록에서 판단해야 한다.

원문 반지름 식을 교정한 common/global source6도 이 리뷰 당시 별도 실행 중이다. source4가 한 실제 작은-q 물리점의 수치 도함수를 닫았다는 결과를 그 전역 재실행의 성공으로 대신하지 않는다. `allSourceLabelsNumericallyCovered:false`, `globalResidualNumericallyEnclosed:false`, `wholeGNUMComplete:false`, `userRequestedM2Complete:false`, `newLeanKernelProof:false`, `M3Started:false`가 최종 기록에 남아 있음을 확인했다.

## 8. 이 검토의 재현 파일과 불변 범위

같은 디렉터리의 다음 두 새 파일에 경량 교차검사와 결과를 보존했다.

- `independent-source4-crosscheck-sensitivity.py` — SHA-256 `6cefe2a2ed2f8583b9e929abb0319b776ff21592583ae07a90f3d1a652ce59ba`
- `independent-source4-crosscheck-sensitivity.json` — SHA-256 `800f4f3260b85cd1a17eab0c63e935aa2b577dbfa8a3151381dcb4c158141c62`

이 스크립트는 실행물의 원본 해시, 모든 closure 파일·복사본, gzip 원본 바이트, typed 원문 괄호, 각 행의 원본 대응, 유리수 폭, 양의 로그 scale, inverse/sqrt domain, source scope를 검사한다. 결과 파일이 이미 있으면 덮어쓰지 않는다. 검토 중 스크립트의 JSON optional/null 필드 해석을 조정했으나 원본 제품 코드나 source 실행물을 변경하지 않았다.

기존 코드의 수학 검토, 원문 지수 영향·통합 guard 검토, source4 관측 실행 및 이 독립 정적/정확산술 대조를 함께 근거로 **선언된 실제 witness의 원본 수치 연결을 승인한다.** 추가 원본 생성, 새로운 증명 토큰, 전역 게이트 상태 변경, M3 시작은 수행하지 않았다.
