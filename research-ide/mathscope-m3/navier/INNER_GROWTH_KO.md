# N7-07: 원래 내부 경로의 양의 하한과 명시적 오차

이 모듈은 원래 M2 공통 수열을 새로 생성하고, 원래 비선형 core를 새 구간 연산으로 계산하여 N7-07의 내부 경로에 대한 양의 하한과 오차 상계를 구성한다. **원문 최종 N6 장과 이 제한된 경로의 동일성에는 논문의 Proposition 9.9 및 Proposition 10.1을 외부 정리 의존성으로 사용한다.** 전체 N6 반복·전역 합이나 매끄러운 전역 외력을 새로 구성했다고 주장하지 않는다. 원문 기준의 최종 승격은 별도 검토 대상이며 이 실행 기록의 `originalN7CriterionComplete`는 `false`다.

## 1. 원문 기준과 출처

대상은 2026-10-12 061419 설계서의 **N7-07, 실제 blowup 경로와 오차**, 64쪽이다. 원문은 다음을 요구한다.

> xτ=(√(2Xinτ),0,0), η=0에서 τ^A uθ=e0+O(τ^(2h)), e0>0를 측정한다. e0의 양의 하한과 remainder의 explicit bound가 있어야 해석적 성장 certificate로 연결한다. 유한값 plot의 증가만으로 τ→0의 무한대를 증명하지 않는다.

설계서 SHA256은 `f4758ab0c6f4038ab30cd9d3d945a471a467f9ffb4d36a0e172f95320720f0ac`다. 원래 논문은 [Navier–Stokes PDF](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), SHA256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`다. 관련 내용은 106쪽 Definition 9.4, 114–116쪽 Proposition 9.9와 Step 5, 118쪽 Proposition 10.1, 124쪽 식 (10.20)–(10.21)이다.

생산 코드는 [source-inner-growth.mjs](source-inner-growth.mjs)다. 고정 profile `same-profile-2026-10-10.3`과 원래 매개변수 표현 SHA `e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`를 사용한다. 사용자는 관측 깊이, 구간 정밀도, 비교급수의 유한 차수만 선택할 수 있다. 원래 `h`, `Lambda`, `CSelected` 또는 경로를 다른 유한 값으로 교체하는 입력은 거부한다.

## 2. 실제 core에서 얻는 양의 선도항

원래 상수에서

\[
X_a=\frac4\Lambda,\qquad
X_{\rm in}=\frac{X_a}{2}=\frac2\Lambda,\qquad
Y=\Lambda X_{\rm in}=2,\qquad \eta=0.
\]

이 점은 원래 core의 \(0\le Y\le4\) 안에 있고, 원래 정규화 계수의 상계 영역 \([X_a/2,2X_b]\)에도 포함된다. 원래 완전한 선도 함수의 내부 분기가 실제 `Phi`인지 확인하고, 원래 적분식에서 \(g(0)=1/C_{\rm Selected}\)를 정확한 유리식 항등식으로 확인한다.

따라서

\[
s=\frac{2}{C_{\rm Selected}\sqrt\Lambda}>0,\qquad
e_0=s\Phi(2,0).
\]

새 256-bit, degree 64 구간 실행은 원래 비선형 \(\Phi(2,0)\)의 유리수 하한이 \(1/2\)보다 크다는 것을 확인했다. 표시 근삿값은 약 0.5767248959653625이며, 정확한 양 끝점은 [실제 결과의 `leading.freshCore.phi.rows[0].actualNonlinearInterval`](evidence/inner-growth-20261012/attempt2/inner-growth.json)에 있다. 원래 양의 비선형 오차와 비교급수의 Cauchy tail을 모두 유지한다. 이전 accepted core index 30의 실제 구간과도 겹친다.

그 결과 사용 가능한 명시적 하한은

\[
e_0>e_{\rm lower}:=\frac1{C_{\rm Selected}\sqrt\Lambda}>0.
\]

별도 Python `Fraction` 검산은 \(\eta=0\)에서 \(\chi=4000000/4000001\)인 정확한 비교급수

\[
\sum_{n\ge0}\frac{(-\chi)^n}{n!(n+1)!}
\]

를 독립적으로 더한다. 교대급수의 다음 항과 원래 비선형 오차 \(290/(9\,2^{260\cdot53})>0\)를 포함한 구간이 새 Node 구간 안에 드는지 확인했다. 이는 전체 논문 또는 최종 N6 존재 정리를 독립 증명했다는 의미가 아니다.

## 3. 실제 공통 수열과 전체 tail의 상계

실행은 기존 `actual-common-admissible-family.mjs`의 실제 common6 입력을 그대로 재생성한다. 원래 622,781개 노드의 canonical graph SHA가 `bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219`와 일치한다. 이후 새 제한 경로 표현만 추가한다. 원래 노드·함수 정의·수열·압력 입력은 변경하지 않는다.

상계는 원래 `actualNormalizedFiniteBlock`의 미분차수 0, \(J=3\) 블록을 소비한다. 원래 \(n=1\)과 \(n=2\)의 실제 계수 상계를 각각 \(B_1,B_2\)라 하면

\[
C=B_1+B_2+\frac14.
\]

`C`는 0이나 임의의 유한 정수로 치환한 값이 아니다. 실제 계수 norm에서 유도된 원래 적분 및 거대한 양의 상수의 정확한 표현이다. 결과에는 피적분함수·적분변수·양 끝점과 `sigma_2` 미분의 원래 정의를 포함한 28,966개 노드의 닫힌 수식·함수 프로그램이 들어 있다. 모든 scalar root의 자유 좌표가 없음을 확인한다.

원래 private completed-background의 `allIntegerOrdersBySameWellFoundedRecipe`를 직접 소비한다. 독립 finite-block 결과의 조건부 flag만으로 무한 tail을 인증하지 않는다. 실제 공통 \(b_n\)이 원래 \(c_n\)보다 크고, 관측 깊이를 바꾸어도 같은 수열을 사용한다. \(n\ge3\)에서는 원래 cutoff의 scale 독립 Euler 상계에 의해

\[
\sum_{n\ge3}2^{-n}q^{nh}\le\frac14q^{3h}\le\frac14q^{2h}
\quad(0<q\le1).
\]

유한 \(n=1,2\) 항을 포함하면 내부 경로에서

\[
|\tau^A u_\theta-e_0|\le C\tau^{2h}.
\]

이 부등식의 실제 background 제한은 원래 source 수열에 연결되어 있다. 원문 **최종 국소화 장**에 대한 동일성은 아래의 외부 정리 연결을 명시적으로 필요로 한다.

## 4. annular support와 localization의 정확한 범위

논문 116쪽 Step 5는 모든 annular correction이 \(X<X_a\)에서 사라진다는 것을 사용한다. \(X_{\rm in}=X_a/2\)는 그 열린 영역 안에 있으므로 벡터 퍼텐셜의 curl과 직접 swirl 보정도 그 근방에서 0이다. \(\chi(a_jq)\)를 곱해도 이 지지 성질은 유지된다. 구현은 알 수 없는 correction 값을 입력으로 0이라고 가정하지 않는다. 이 지지 성질과 최종 (9.21)의 존재·동일성은 원문의 Proposition 9.9에 의존한다고 기록한다.

localization에는 같은 source의 더 작은 complete-partition 영역을 쓴다.

\[
q_* = 2^{-(\ell_0+4)}
     = \frac{q_{\rm family}}{64},\qquad
\ell_0=\ell_{\min}+6.
\]

이는 앞선 family threshold \(2^{-(\ell_{\min}+4)}\)를 그대로 최종 partition 영역으로 오인하는 것을 방지한다. \(C_0=4\), \(\tau_0=q_*/32\), \(z_0=\tau_0^D\), \(r_0=1\)을 선택하면

\[
4(\tau_0+z_0^{1/D})=q_*/4<q_*/2.
\]

원래 \(h<2^{-4096}\)에서 \(D=1/2-h>1/4\)이므로 사용한 \(C_0\)가 유효하다. cutoff는 실제 평평한 분기까지 명시한 \(\chi(s)=1-\sigma_1(2s-1)\)이며,

\[
\chi_x=\chi(2r^2/r_0^2)\chi(2z^2/z_0^2),\qquad
\chi_t=\chi(\tau/\tau_0).
\]

cutoff 전체 지지는 위의 작은 source 영역에 들어간다. 관측점의 주변에서는 모든 cutoff가 정확히 1이므로 곱의 추가 curl 항도 사라진다. 전체 외력, 시간 jet 연장, 에너지 항등식은 이 모듈의 결과가 아니다.

## 5. 정확한 관측 시간과 구간

\[
\delta=\frac1{4+4/\tau_0+32X_{\rm in}},\quad R=C/s,\quad
\tau_d=\delta\exp\!\left[-\frac{\log(1+4R)+d\log2}{2h}\right].
\]

모든 \(\tau_d\)는 정확한 양의 수식으로 남는다. binary64 underflow로 0이 되지 않는다. \(0<\delta<1\)이므로

\[
R\tau_d^{2h}<2^{-d-2}.
\]

따라서 아래 표는 \((C_{\rm Selected}\sqrt\Lambda/2)\tau_d^A u_\theta\)에 대한 보장 구간의 **표시용 외향 근사**다. 유한 합의 midpoint나 원래 무한합의 직접 부동소수점 평가는 아니다.

| 깊이 \(d\) | 정규화 오차의 정확한 상계 | 표시용 하한 | 표시용 상한 |
|---:|---:|---:|---:|
| 0 | 1/4 | 0.32672489596536247 | 0.8267248959653626 |
| 2 | 1/16 | 0.5142248959653624 | 0.6392248959653626 |
| 4 | 1/64 | 0.5610998959653624 | 0.5923498959653626 |
| 8 | 1/1024 | 0.5757483334653624 | 0.5777014584653626 |
| 12 | 1/16384 | 0.5766638608091124 | 0.5767859311216126 |

실제 속도의 배율 \(s\tau_d^{-A}\), 시간 \(1-\tau_d\), 반지름 \(\sqrt{2X_{\rm in}\tau_d}\), cutoff의 각 인수도 같은 닫힌 수식 프로그램에 저장한다. 유리수 구간은 원본 그대로 유지한다.

양의 \(e_{\rm lower}\), \(h>0\), 명시적 나머지에서 충분히 작은 \(\tau>0\)에 대해 \(\tau^A u_\theta\ge e_{\rm lower}/2\)를 얻는다. \(A>0\)이므로, **외부 최종장 동일성 정리가 적용되는 원문 장**의 성장 결론이 따른다. 표의 유한 증가나 회귀 기울기를 성장의 증명으로 사용하지 않는다.

## 6. 실제 실행·변조 검사와 남은 경계

재실행은 새 시도 번호를 사용한다. 기존 attempt 폴더가 있으면 덮어쓰지 않고 거부한다.

```sh
python research-ide/mathscope-m3/navier/tests/run-inner-growth-source.py 3
```

최종 관찰 attempt2는 158.965초, peak RSS 4,434,853,888 bytes, exit code 0이다. Node 상한은 6,144 MiB이며 이 실행은 다른 대규모 source constructor와 동시에 실행하지 않았다. 실제 Node 8/8, 별도 Python Fraction 검사 9/9, 관련 원본 97파일의 실행 전·후 SHA 일치가 모두 통과했다. 테스트는 원래 common6 graph, 실제 비선형 core의 독립 정밀도 개선, 누락된 n2, 바뀐 공통 수열, 삭제한 외부 정리 전제, 위조한 양의 하한, copied-record의 권한 채택, 적분·배율 archive의 출처 대응을 검사한다. 실제 Lean 커널은 새로 실행하지 않았다.

attempt1은 121.823초, exit code 1로 실패했다. 실제 source 생성 후 새 archive가 원래 `definite_integral`을 처리하지 못한 구현 오류이며, [실패 receipt](evidence/inner-growth-20261012/attempt1/receipt.json)와 원래 실행 소스 snapshot을 보존한다. 성공 수치에 이 실패를 합치지 않는다.

| 기록 | SHA256 |
|---|---|
| [attempt2 receipt](evidence/inner-growth-20261012/attempt2/receipt.json) | `019bd3babe83d6af74dccd28bde6eb734393a454a7af60f114778f20c556ff28` |
| [실제 수식·구간 결과](evidence/inner-growth-20261012/attempt2/inner-growth.json) | `7a72e1ca1293ba2542ed4ed2612ad67b95df7cb31eb49cf91be004f6ae16a5fe` |
| [독립 Fraction 검산](evidence/inner-growth-20261012/attempt2/independent-fraction.json) | `641c0dbcbf20de141d04d9549fc4b62b107ad92f331350ccfd5276f51ee43c5d` |
| [원본 97파일 결속](evidence/inner-growth-20261012/attempt2/source-bytes.json) | `97cfdf5467c2b16818db33b2d5a7a72cff0127ac65485b0698587c20389181fe` |

실행 결과는 실제 source에 연결된 내부 경로 구간과 조건이 드러난 해석적 귀결을 제공한다. 전체 N6 반복, 전역 국소장·외력, N7의 다른 일곱 조건, Navier–Stokes의 미해결 일반 문제 또는 M3 전체 완료를 이 기록에서 도출할 수 없다. 공개 UI에서 이 기록을 보여줄 때에는 저장된 실제 실행 자료임을 표시해야 하며, 이 159초 source 생성이 브라우저에서 새로 수행됐다고 표시해서는 안 된다.
