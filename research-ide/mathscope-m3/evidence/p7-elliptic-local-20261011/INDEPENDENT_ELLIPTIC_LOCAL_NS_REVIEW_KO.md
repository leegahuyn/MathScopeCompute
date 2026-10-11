# P7 유한 타원곡선 산술 — NS 독립 읽기 검토

검토일: 2026-10-11. 구현 담당: `positive_stress`. 검토 담당: `ns_proof_audit`.

## 1. 판정과 독립성

동결된 `p7/elliptic_local.py`, 단위검사 24개, `p7/ELLIPTIC_LOCAL_KO.md`, 두 차례 실행 기록과 원본 스냅샷을 읽었다. 지원한다고 명시한 **정확한 유리수 군법, 유한 소체 점 개수, unit-c4로 인증되는 반안정 국소 자료, torsion 및 랭크 하한, 유한 Dirichlet 계수**의 범위에서 구체적인 수학 오류를 발견하지 못했다.

이 문서는 구현자가 작성한 증명의 독립 읽기 검토다. 검토자는 해당 타원곡선 모듈을 작성하지 않았으며, 검토 중 이 모듈·기존 문서·기존 실행물을 수정하지 않았다. 저장된 24개 검사의 성공을 읽고 원본 바이트를 대조했으나 **이 검토를 위해 24개 검사를 새로 실행하거나 새 곡선 계산을 수행하지 않았다.** 이하의 실제 실행 수치는 이미 저장된 프로세스 기록에 귀속된다.

판정은 P7 전체 완료, 모든 타원곡선의 Tate 알고리즘, 해석적 연속, 정확한 전체 랭크, BSD 또는 형식 증명 커널의 검증을 뜻하지 않는다. root의 별도 CLI release gzip 파일 문제는 이 산술 모듈과 아래의 원문 단위검사 기록을 변경하지 않았다. 이 문서에서는 해당 release 파일을 근거로 사용하지 않는다.

## 2. 정확한 입력과 일반 Weierstrass 군법

원래 입력 모델은

\[
y^2+a_1xy+a_3y=x^3+a_2x^2+a_4x+a_6
\]

의 다섯 계수다. 정수·`Fraction`·정수 또는 유리수 문자열을 정확히 읽고, float와 bool 및 이 API가 지원하지 않는 소수 문자열을 거절한다. 이 입력 정책은 별도 ball backend의 정확한 소수 문자열 정책과 구분돼 있다. 특이곡선도 거절한다. 모델 별칭은 계수를 제공할 뿐, 알려진 conductor나 rank를 계산 결과로 복사하지 않는다.

`_invariants`의 b-불변량, c-불변량, 판별식과 두 항등식

\[
c_4^3-c_6^2=1728\Delta,\qquad b_2b_6-b_4^2=4b_8
\]

은 표준 다섯 계수 식과 일치한다. b-불변량으로 쓰인 판별식 식을 다시 1728로 나누는 오류도 없다.

`_add`, `point_negate`, `point_multiply`의 일반 군법을 읽었다. 역원은 \((x,-y-a_1x-a_3)\)이고, 접선의 분모는 \(2y+a_1x+a_3\)다. 교점에서 얻은 세 번째 점에 다시 역원을 취하는 a1·a3 항과 secant/tangent의 절편이 유지된다. 역원인 두 점과 수직 접선의 예외 분기가 일반 나눗셈보다 먼저 처리된다. 항등원·0배 분기에서도 입력 점의 곡선 소속을 검사한다.

검사의 일반 좌표변환 예제는 다섯 계수가 모두 비영인 모델까지 다룬다. 따라서 두 명명 곡선의 짧은 Weierstrass 식에만 우연히 맞는 군법을 검사한 구성이 아니다. 주장한 점의 정확한 차수는 n배가 항등원인 것뿐 아니라 n의 모든 소인수 ell에 대해 n/ell배가 항등원이 아닌 것까지 검사한다.

## 3. 점 개수, 최소성, 곱셈적 축소

`_projective_count`는 홀수 소수에서 y에 관한 이차식의 판별식

\[
(a_1x+a_3)^2+4(x^3+a_2x^2+a_4x+a_6)
\]

의 Legendre 기호로 각 x의 해 개수를 세고 무한원점을 더한다. p=2에서는 나눗셈 공식을 강행하지 않고 두 y 값을 직접 센다. 소수성, 좋은 축소, 정수적 환원 가능성을 실제로 확인한다. Hasse 검사는 정수 부등식 \(a_p^2\le4p\)로 수행된다. 검사 코드의 별도 O(p²) 방정식 열거와 비교하는 방식은 이차판별식 구현을 그대로 복제하지 않는다.

`local_reduction`에서 \(v_p(\Delta)>0\), \(v_p(c_4)=0\)인 경우의 최소성 근거가 타당하다. 비최소 모델을 p로 축소하면 c4의 가중치 4에 따라 현재 c4가 p의 배수여야 하므로 unit-c4와 모순된다. 그 최소 모델의 곱셈적 축소 형식은 \(I_n\), \(n=v_p(\Delta)\)다.

`_multiplicative_node`는 실제 특이점을 찾고 그 점의 접선 원뿔

\[
Y^2+a_1XY-(3x_0+a_2)X^2
\]

을 계산한다. Y²의 계수가 1이므로 \(X=0\) 방향이 누락되는 문제는 없다. 유리 접선 두 개와 0개를 split/nonsplit로 구분하며, p=2와 p=3에서도 같은 직접 접선 검사를 사용한다. p≥5의 \((-c_6/p)\) 대조는 접선 계산과 별개의 확인이다. 특이 세제곱곡선의 점 개수도 다시 세어 \(a_p=\pm1\)과 대조한다.

이 범위의 conductor 지수 1, 국소 root number \(-a_p\), split \(I_n\)의 Tamagawa 수 n, nonsplit \(I_n\)의 홀수 n일 때 1·짝수 n일 때 2가 서로 일관된다. 판별식의 모든 소인수를 완전히 인수분해하고 각 나쁜 소수의 지원 조건을 확인한 경우에만 전체 반안정 conductor와 root number를 조립한다. 자원 예산 때문에 인수분해가 끝나지 않으면 인증을 발급하지 않는다.

가법적 또는 처리하지 않은 비최소 가지는 `unsupported`로 남는다. 이 경우 임의의 \(a_p=0\), conductor, root number 또는 Tamagawa 수를 채워 넣지 않는다. 판별식 지수 등 일부 정보로 최소성을 알 수 있는 경우에도 구현하지 않은 축소 형식까지 확장하지 않는다.

## 4. torsion 주입과 랭크 하한

`_torsion_bound`는 각 torsion 소수 ell에 대해 **p≠ell인 좋은 축소만** 사용하여 ell-일차 부분을 주입한다. 각 해당 점 개수의 ell-adic 지수 중 최솟값이 torsion의 그 부분을 제한한다. 서로 다른 좋은 소수를 적어도 둘 요구하므로 p와 같은 torsion 소수를 잘못 제외하는 문제가 없다. 사용한 소수 및 유한 점 개수의 인수들 밖에 있는 ell은 점 개수의 해당 지수가 0이어서 제외된다.

따라서 두 소체 점 개수의 단순 gcd가 모든 경우의 torsion 정리인 것처럼 사용하지 않는다. 특히 p=2에서 전체 torsion이 무조건 주입된다고 가정하지 않는다.

11a1에서는 실제 유리점 (5,5)의 차수 5와 위의 torsion 상한 5를 함께 사용하므로 전체 torsion 군의 차수와 순환 구조가 결정된다. 37a1에서는 좋은 소수 2와 3의 실제 점 개수가 5와 7이고, 위의 prime-to-p 논증으로 torsion 상한이 1이다. 실제 점 (0,0)이 항등원이 아니므로 비torsion이며 랭크가 적어도 1이다. 이것은 랭크 상한, descent 또는 정확한 전체 Mordell–Weil 생성계의 계산이 아니다.

## 5. 유한 Euler 계수와 해석적 범위

좋은 소수의 국소 다항식은 \(1-a_pT+pT^2\), 곱셈적 나쁜 소수의 국소 다항식은 \(1-a_pT\)다. `coefficients`와 `dirichlet_coefficients`는 각각의 역수를 유한 차수까지 전개하는 재귀 및 서로소 곱셈성을 사용한다. 좋은 소수 제곱의 p 항과 나쁜 소수 제곱에서 그 항이 없는 차이가 유지된다. 전체 L 계수 모드에서는 요청된 계수 한계보다 큰 나쁜 소수라도 먼저 지원되는 국소 자료인지 확인한다.

`good_only=True`는 지정된 나쁜 소수의 국소 인자를 **생략한** \(L^S\)로 명시한다. 그 소수의 배수 계수를 0으로 두는 것은 생략된 Euler 인자의 정의이며, 미구현 가법적 국소 인자를 계산했다는 주장이 아니다.

계수의 정규화는 산술 L 함수의 중심 s=1이다. 문서의

\[
\Lambda(E,s)=N^{s/2}(2\pi)^{-s}\Gamma(s)L(E,s)
\]

및 s↔2−s 함수방정식은 사용할 정규화와 표준 이론의 전제를 기록한 것이다. 모듈이 무한 Euler 곱의 꼬리, 해석적 연속, 함수방정식 자체 또는 L 값의 엄밀 구간을 실행했다는 뜻으로 쓰이지 않는다. 유한 계수 검사도 별도 형식 Euler 곱 전개와 대조하며 무한 수렴 검사로 승격하지 않는다.

## 6. 실제 두 모델의 판정 범위

아래 값은 동결 코드·단위검사·문서의 서로 일치하는 계산 결과다. 검토자가 새 실행에서 얻은 표가 아니다.

| 항목 | 11a1 | 37a1 |
|---|---|---|
| 다섯 계수 | (0,−1,1,−10,−20) | (0,0,1,−1,0) |
| c4 / c6 | 496 / 20008 | 48 / −216 |
| 판별식 | −11⁵ | 37 |
| 나쁜 소수의 인증 | 11에서 split I5 | 37에서 nonsplit I1 |
| conductor / 전역 root number | 11 / +1 | 37 / −1 |
| Tamagawa 곱 | 5 | 1 |
| torsion | 차수 5 순환군 | 자명군 |
| 실제 점으로 얻은 랭크 정보 | 하한 0, 상한 미계산 | 하한 1, 상한 미계산 |

37a1의 랭크를 정확히 1이라고 하거나 11a1의 랭크를 정확히 0이라고 하는 주장은 이 인증에 포함되지 않는다. 두 모델 이름의 데이터베이스 값에 기대어 해당 상한을 추가하지 않는다.

## 7. 실행·자원·직렬화 검토

최종 단위검사 기록은 **24/24 PASS, 관측 exit 0**, 경과 0.23447551899880636초, peak RSS 16,400,384바이트다. 최초 기록도 **23/23 PASS, 관측 exit 0**다. 최초 실패를 수정한 이력으로 표시해서는 안 된다. 두 번째 실행에는 호출자가 지정한 입력 비트 예산 준수, 무한 prime iterable 차단, Python 전역 십진수 자릿수 제한을 변경하지 않는 큰 정수 직렬화 검사가 추가·보강됐다.

정수의 9자리 묶음 파싱·출력은 exact integer 연산이며 큰 불변량을 float로 우회하지 않는다. 소수열·인수분해·점 열거·계수 수에는 명시적 유한 작업 예산이 있고, 예산 소진은 부분 자료의 성공 인증이 아니라 오류다. 입력 모델과 출력 JSON의 결정성, 반환 범위 및 `unsupported`를 검사하는 회귀도 포함된다.

## 8. 원문 바이트 대조

아래 11개 파일은 동결 packet의 SHA-256과 바이트 길이를 **전부 직접 다시 계산하여 일치**함을 확인했다. packet 자체도 별도로 해시했다. 이 문서는 기존 packet을 수정하지 않고 그 바깥에 추가된다.

| 원본 경로 — `research-ide/mathscope-m3/` 기준 | SHA-256 |
|---|---|
| `p7/elliptic_local.py` | `85b2a163a76dbb7cd8bee367f66bea0824ab385e164161b4a1f0d2d3da8e03da` |
| `tests/test_elliptic_local.py` | `e428a1d53cd2f3b74db942b0f9fbfa8be4cadc8a2c2c851cc6a0e0dba27a8ba6` |
| `p7/ELLIPTIC_LOCAL_KO.md` | `43593bd48fc95ff84c185fef8f2d4f0e62fc9b63c8e94c97e478cb6a41adc2a2` |
| `evidence/p7-elliptic-local-20261011/attempt1-elliptic_local.py.txt` | `e84edc77da45d0a18d8e50644413d35dd89b18ce950eaf76b3c7f75a88d5bc94` |
| `evidence/p7-elliptic-local-20261011/attempt1-test_elliptic_local.py.txt` | `a6166238572f3c5b8d285095008c2c314a1c7211937bb85e0b39859351c184d9` |
| `evidence/p7-elliptic-local-20261011/attempt2-elliptic_local.py.txt` | `85b2a163a76dbb7cd8bee367f66bea0824ab385e164161b4a1f0d2d3da8e03da` |
| `evidence/p7-elliptic-local-20261011/attempt2-test_elliptic_local.py.txt` | `e428a1d53cd2f3b74db942b0f9fbfa8be4cadc8a2c2c851cc6a0e0dba27a8ba6` |
| `evidence/p7-elliptic-local-20261011/elliptic-local-unittest-attempt1.json` | `4b625bd126ae76bc475d40471ca48e384bd0d7b19f01252b94b4a79a82857042` |
| `evidence/p7-elliptic-local-20261011/elliptic-local-unittest-attempt1.log` | `02c78a38868a132345d74ef0122f5a8a5ea53b5327f123d850f5383fe9ae6a6a` |
| `evidence/p7-elliptic-local-20261011/elliptic-local-unittest-attempt2.json` | `c4dffb1c2bee05cc86c9bf1b4a5968e9cf07c591312aee132f1d32b2e2a3b2a9` |
| `evidence/p7-elliptic-local-20261011/elliptic-local-unittest-attempt2.log` | `794cd22bbb496da70e8fa8fedb244600c46ca8569442d85c36e76d624b5b4e6d` |

packet: `evidence/p7-elliptic-local-20261011/elliptic-local-packet.json`, SHA-256 `08aaa78686be1074e5fc9aaa33c5537b691f51632a1c37763d7e43c9181583bb`.

기존 한국어 문서가 연결한 표준 정리의 참고문헌 목록을 검토했지만, 이 짧은 검토에서 그 책·논문 전체를 새로 읽었다고 주장하지 않는다. 위에서 실제로 확인한 것은 명시된 표준 국소 정리의 전제와 구현 분기, 원래 식, 유한 계산 검사 및 실행 원문의 연결이다. 향후 전체 P7의 해석적 ball·함수방정식·무한 꼬리·랭크 상한을 추가할 때는 해당 별도 전제와 실제 실행을 따로 결속해야 한다.
