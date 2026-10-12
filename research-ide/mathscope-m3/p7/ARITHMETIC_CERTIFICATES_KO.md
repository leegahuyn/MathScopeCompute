# P7의 실제 산술 rank와 BSD 데이터

`p7.elliptic_arithmetic`은 정확한 유리수 Weierstrass 계수에서 새 PARI/GP
프로세스를 실행한다. 모델 별칭 `11a1`, `37a1`은 계수 입력의 편의 표기다.
rank 데이터베이스, analytic rank, BSD 추측을 산술 상한으로 사용하지 않는다.
산술 결과는 표준 수학 정리와 고정된 CAS 알고리즘을 사용한 인증서이며,
PARI 내부 descent를 Lean으로 형식화했다는 주장은 하지 않는다.

## 실행과 재현

네이티브 배포의 requirements 항목은
`./research-ide/mathscope-m3/p7/pari_runtime`이다. 이 로컬 패키지가 공식
PARI 2.19.0 소스를 TLS로 내려받아 게시된 SHA-256
`f317b9722eb5d9094a60303774f066f3a83e3ec1f170be8546c44d7583f30b6d`를
검사한 뒤 빌드한다. 빌드 명령·예산·캐시 검증·발견 경로는
`pari_runtime/README.md`에 있다. 캐시를 쓴 관측 실행은 새 TLS 다운로드를
했다고 기록하지 않는다. 소스 핀과 실제 실행 파일의 관측 SHA는 별개로 남긴다.

요청 프로세스는 설치된 `mathscope_p7_pari.binary_path()`를 사용한다.
관리자가 지정한 `MATHSCOPE_PARI_GP` 경로도 옆의 검증된 빌드 sidecar가
필요하다. 검증하지 않은 PATH의 `gp`나 데이터베이스로 자동 대체하지 않는다.
GP는 CLI lease의 프로세스 그룹을 상속하여 시간 초과 정리에 함께 포함된다.
실행 기록에는 정확한 GP 스크립트, stdout/stderr, 종료 코드, 각 SHA와
실행 파일·소스 아카이브·빌드 레시피의 관측값이 들어간다.

PARI 2.19.0의 `ellan(E,1)`에서 실제 Floating Point Exception을 관측했다.
따라서 `ellan(E,max(2,K))`를 계산하고 정확히 처음 K개만 반환한다.
이 변경은 요청의 analytic cutoff나 무한 tail을 2로 바꾸지 않는다.
K=1 실패와 수정 후 실행은 회귀 검증에 남아 있다.

## 최소모형, Tate 자료, 모든 국소 인자

5개 계수의 변환 `(u,r,s,t)`를 다시 대입하여 최소모형과 원래 모델의
동형 관계를 유리수 등식으로 검사한다. 판별식의 모든 소인수, 각 Tate
환원 자료, conductor 지수, Kodaira 형, Tamagawa 수, root number 및
Euler 인자를 함께 반환한다. 판별식 인수분해의 재곱, conductor와 Tamagawa
곱, root-number 곱을 검사한다. 좋은 소수의 점 개수와 Euler 재귀를
독립적으로 계산하여 PARI의 모든 `a_n`, `1≤n≤K`와 비교한다.

`complete_local_certificate(model, coefficient_limit=128)`는 이 부분만
실행한다. GP 스크립트에 `ellrank`, `ell2cover`, `elltors`가 없고 height와
period 계산도 하지 않는다. 해석적 연장에 필요한 완전한 국소 자료는 어려운
rank/saturation 계산의 성공 여부와 분리된다. additive 예제
`y²=x³−x`와 `y²=x³−2`의 conductor 32, 1728도 실제 검증했다.

## 서로 독립적인 rank 하한과 상한

상한은 PARI의 무조건적 2-descent와 Cassels pairing 결과다. 2-Selmer
차원을 C, 유리 2-torsion 차원을 T, 반환된 pairing의 짝수 rank를 s라 두면
상한은 `C−T−s`이다. 반환된 모든 quartic 2-cover 및 타원곡선으로의 유리
사상에 대해 Python의 정확한 유리수 다항식 연산으로 원래 Weierstrass
방정식을 재검사한다. 각 cover의 모든 곳에서의 국소 가해성과 Selmer
basis의 완전성은 고정된 PARI 알고리즘에 의존한다. 단순히 사상 항등식을
검사했다는 이유로 그 추가 성질까지 Lean으로 증명했다고 기록하지 않는다.

하한은 별도의 유리점·정확한 군 법칙·canonical-height Gram 행렬로 얻는다.
성공한 각 확대에서 행렬식의 전체 인증구간이 양수일 때만 독립점을 늘린다.
PARI가 반환한 하한은 참고 필드로 분리하며, 하한을 analytic rank에서
가져오지 않는다. `[r_min,r_max]`가 한 점인 경우에만 `exactRank`를 낸다.
현재 독립점 탐색 예산은 3개이며 그 예산을 넘어가는 일반 rank를 확정하지 않는다.

실제 예제에서 `11a1`은 `[0,0]`, `37a1`은 `[1,1]`이다. `37a1`의
`(0,0)`은 높이가 양수인 독립점이다. PARI가 찾은 다른 점이 자동으로
포화된 생성자라고 가정하지 않는다.

## Canonical height의 유한 항과 명시적 무한 tail

원래 좌표 높이는 `h_x(P)=log(max(|u|,|v|))`, `x(P)=u/v`,
`gcd(u,v)=1`이다. Weierstrass의 `b2,b4,b6,b8`로 duplication의
동차 4차식 F,G를 만든다. 정확한 선형계에서 얻은 3차 cofactor가

`A_u F+B_u G=D u^7`, `A_v F+B_v G=D v^7`

을 만족하는지 다시 곱하여 검사한다. `gcd(F(u,v),G(u,v))`는 D를 나눈다.
계수 절댓값 합과 cofactor의 절댓값 합으로 계산한 C에 대해

`|h_x(2P)−4h_x(P)|≤log C`

가 성립한다. 따라서

`h_Cremona(P)=lim_n 4^(−n) h_x(2^n P)`

의 n번째 근사 오차는 정확히 명시한 상계 `log(C)/(3·4^n)` 이하이다.
유리수 duplication 값, 로그의 FLINT 외향 구간, 이 무한 tail을 따로
기록한다. `h_Silverman=h_Cremona/2`도 별도 필드이며 정규화를 섞지 않는다.

Canonical height의 모든 정수배에 대한 이차성, 양의 준정부호성 및 torsion
영공간은 표준 정리 의존성이다. duplication tail 자체만으로 임의의 정수 m에
대한 `h(mP)=m²h(P)`까지 새로 증명했다고 주장하지 않는다.

## Rank one의 완전한 saturation

같은 최소모형에서 rank 1과 torsion 0을 별도로 인증한 뒤 적용한다.
`P=mQ`, `|m|≥2`라면 `h(Q)≤h(P)/4`다. 이 부등식과 위의 naive-height
차이 상계로 유리 x좌표의 분자·분모 높이에 대한 유한 정수 상계를 얻는다.
상계는 외향 구간의 위끝과 엄격한 비교로 정한다.

`37a1`, `P=(0,0)`에서는 `H(x(Q))≤5`로 충분하다. 기약 분자·분모
쌍 39개를 전부 검사하여 모든 유리 y 근을 포함한 10개 affine 점을 찾는다.
음수 y 또는 분모가 있는 점을 빼지 않는다. 각 점의 height 하한이 가능한
divisor threshold보다 엄격히 커서 모든 proper integer divisor를 배제한다.
실제 `3P`에는 이 인증서가 실패한다. 몇 개 소수만 검사한 bounded
saturation을 전체 saturation으로 바꾸지 않는다.

## Regulator, torsion, period, Sha

Torsion은 GP 생성자의 정확한 위수와 생성 부분군의 모든 원소를 계산하고,
좋은 소수 환원에서 얻은 독립 상한과 비교한다. 포화된 전체 자유부분 basis를
확인한 경우에만 Gram 행렬식을 full regulator로 부른다. 그렇지 않으면
부분군 regulator와 미지의 `index²` 관계가 남는다. Rank 0의 빈 행렬식은 1이다.

실수 Néron period는 최소모형의 불변 미분을 직접 적분한다. `Y²=X³+AX+B`의
가장 큰 실근을 정확한 Sturm 수열로 고립하고, 무한 적분 구간을 `[0,1]`로
치환한다. 제곱근의 analytic branch 조건을 FLINT 적분 callback에 전달한다.
판별식이 양수이면 두 실연결 성분의 합을 포함한다. 따라서 숨은
Manin-constant 가정으로 period를 대신하지 않는다.

`Sha`의 전체 유한성·위수는 `UNKNOWN`이다. 2-Selmer 정보나 BSD 식에서
수치적으로 1에 가까운 비율이 나왔다는 이유로 Sha=1을 선언하지 않는다.
`p7.result_claim`의 refined type은 이 의무를 자동 나열하며, 사용자가
`conditionalShaOrder`를 넣으면 그 값을 연구 가정과 함께만 내보낸다.

## 출처와 증거

- [PARI 2.19.0 공식 배포·해시](https://pari.math.u-bordeaux.fr/download.html)
- [PARI elliptic-curve 문서: ellrank, ell2cover, ellglobalred, elllocalred](https://pari.math.u-bordeaux.fr/dochtml/html-stable/Elliptic_curves.html)
- [J. S. Milne, Elliptic Curves, 2nd ed., Chapter IV §4](https://www.jmilne.org/math/Books/EC2.pdf): canonical height의 이차성 및 naive height와의 차이
- `evidence/pari-runtime-20261012/`: 실제 빌드·설치·버전·원문 실패 로그
- `tests/test_elliptic_arithmetic.py`: 실제 rank/cover/height/saturation/period 및 변조 검증

정확한 다항식 증거, 유리수 계산, 외향 ball, 외부 CAS 알고리즘, 표준 정리의
의존성을 결과 안에서 각각 구분한다. 이 유한 계산들은 보편 RH나 BSD의
새 증명이 아니다.
