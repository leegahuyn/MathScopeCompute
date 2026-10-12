# P7 복소 해석 계산과 오차 장부

이 문서는 `p7.zeta_em`, `p7.euler_product`, `p7.elliptic_complex`의 계산 범위를 설명한다. 결과는 입력·소스·실제 실행 환경에 결속된 복소 보장 구간이다. 유한 높이 영점 개수, 해석적 rank, 산술 rank, 보편 RH/BSD의 증명은 각기 다른 결과 유형이다.

## 1. API와 정의역

| kind | 실제 계산 | 입력 범위와 의미 |
|---|---|---|
| `p7.zeta_em` | Euler–Maclaurin 항, 유한 Bernoulli 적분의 급수, 두 나머지 상한 | 정확한 유리수 복소점, `s != 1`, `Re(s)+2M-1 > 0`; 임계영역 허용 |
| `p7.euler_product` | 명시한 유한 소수 집합의 Euler 인자 곱 | ζ는 입력 직사각형 전체의 `Re(s)>1`; 타원곡선은 전체의 `Re(s)>3/2` |
| `p7.elliptic_complex` | 완전한 국소 산술을 사용하는 split Mellin 연속과 명시적 계수 꼬리 | PARI가 처리한 유리수 Weierstrass 모델, 정확한 복소점, `|Re(s)|<=16`, 각 좌표 절댓값 `<=64` |

Euler 곱의 결과는 그 유한 곱 자체의 구간이다. 포함된 소수, 최대 요청 소수까지의 누락, 이후 무한 소수 꼬리의 미평가 상태를 기록한다. 타원곡선의 good-only 곱에는 `L^S` 표기를 유지한다. 임계영역의 유한 Euler 곱을 ζ 또는 완전한 L값으로 요청하면 실패한다. 잘못된 입력 뒤에 다른 계산식을 자동 대입하지 않는다.

`precisionBits`와 `tolerance`는 별개이다. 모든 실수·허수 성분의 실제 전체 폭이 요청한 정확한 tolerance 이하일 때만 `toleranceMet=true`이다. 정상적으로 계산된 넓은 구간은 유효한 enclosure이지만 요청 오차 충족 상태가 아니다.

## 2. ζ: 유한 산술, 급수 잘림, 무한 적분 꼬리

사용하는 Euler–Maclaurin 항등식은 다음과 같다. \((s)_k\)는 상승계승이다.

\[
\begin{aligned}
\zeta(s)={}&\sum_{n=1}^{N-1}n^{-s}+\frac{N^{1-s}}{s-1}+\frac12N^{-s}\\
&+\sum_{k=1}^{M}\frac{B_{2k}}{(2k)!}(s)_{2k-1}N^{1-s-2k}
-\frac{(s)_{2M}}{(2M)!}\int_N^\infty\widetilde B_{2M}(x)x^{-s-2M}\,dx.
\end{aligned}
\]

NIST의 Euler–Maclaurin 표현과 Bernoulli 미분 관계를 부분적분하여 같은 짝수 차수 나머지를 얻는다. 주기적 Bernoulli 함수의 Fourier 표현은 \(|\widetilde B_{2M}(x)|\le |B_{2M}|\)를 준다. 근거는 [DLMF 25.2](https://dlmf.nist.gov/25.2)와 [DLMF 24.8](https://dlmf.nist.gov/24.8)이다.

### 유한 구간의 실제 계산

적분을 \([N,B]\)와 \([B,\infty)\)로 나눈다. 유한 부분의 각 단위 구간에서 \(q=n+1/2\), \(u=x-q\), \(\alpha=s+2M\)로 두고 \(|u|\le1/2\)에서

\[
x^{-\alpha}=q^{-\alpha}\sum_{k\ge0}
\frac{(-1)^k(\alpha)_k}{k!q^k}u^k
\]

를 사용한다. \(B_{2M}(u+1/2)\)의 계수와 각 \(u^k\)의 적분 모멘트는 정확한 유리수로 계산한다. \(B_j(1/2)=(2^{1-j}-1)B_j\)와 홀수 모멘트의 소멸을 사용하며, 짝수 차수 \(r\)의 적분은 \(1/[2^r(r+1)]\)이다.

처음 K개 항만 계산한 뒤, 이후 연속 항 비율의 상한을

\[
\rho=\frac{1}{2q}\max\left(1,\frac{|\alpha|+K}{K+1}\right)<1
\]

로 검사한다. `max`에 들어가는 값과 최종 비율 모두 외향 상단점을 사용한다. 따라서 각 구간의 ζ값 기여 오차는

\[
\left|\frac{(s)_{2M}}{(2M)!}\right||B_{2M}||q^{-\alpha}|
\frac{|(\alpha)_K|}{K!(2q)^K(1-\rho)}
\]

이하이다. 이 값들을 더한 것이 `seriesTruncationUpper`이다.

### 무한 꼬리

\(\sigma=\operatorname{Re}(s)\)이고 \(\sigma+2M-1>0\)일 때 남은 부정적분은

\[
\left|\frac{(s)_{2M}}{(2M)!}\right||B_{2M}|
\frac{B^{1-\sigma-2M}}{\sigma+2M-1}
\]

로 제어한다. 이것이 별도 `infiniteTailUpper`이다. K를 늘리는 것과 B를 늘리는 것은 서로 다른 나머지 항에 작용한다. 테스트는 이 분리도 확인한다.

### 최종 구간의 합성

유한 합은 pinned Arb/ACB에서 실행하며 `finiteArithmeticBall`로 보존한다. 이 구간은 정확한 입력 변환, 외향 사칙연산, 유한하게 호출한 거듭제곱·log·exp의 내부 enclosure를 포함한다. primitive 내부의 하드웨어 반올림과 primitive 근사 오차를 다시 분리했다고 주장하지 않는다.

두 해석적 절대 상한의 외향 합을 유한 ball의 실수부와 허수부 각각에 대칭으로 더한다. `roundingEnclosure`, `seriesTruncationUpper`, `infiniteTailUpper`가 따로 남으며, ζ routine의 결과나 관측 residual은 이 값 또는 꼬리의 근거로 사용하지 않는다.

## 3. 타원곡선: 완전한 국소 계수와 일반 복소 Mellin 연속

`complete_local_certificate`는 원래 모델의 최소 모델 변환, 모든 bad prime의 Tate 자료, conductor N, root number w, 완전한 계수 \(a_1,\ldots,a_K\)를 새 PARI 프로세스에서 얻고 정확한 산술로 확인한다. 이 경로는 descent·height·period 계산을 요구하지 않는다. `allBadFactorsIncluded=true`와 `seriesLabel="L(E,s)"`가 아닌 계수는 완성함수 계산에 사용할 수 없다.

\(c=2\pi/\sqrt N\)로 두면 가중치 2의 Mellin 표현은

\[
\Lambda(E,s)=\int_1^\infty\sum_{n\ge1}a_ne^{-cnt}
\left(t^{s-1}+w t^{1-s}\right)\,dt.
\]

처음 K개 계수의 실제 계산은

\[
\sum_{n=1}^{K}a_n\left[
\frac{\Gamma(s,cn)}{(cn)^s}
+w\frac{\Gamma(2-s,cn)}{(cn)^{2-s}}
\right]
\]

이다. 양의 실수 x에 대해 `x.gamma_upper(s)`가 \(\Gamma(s,x)\)라는 pinned python-flint API 순서를 사용한다. [ACB 공식 문서](https://python-flint.readthedocs.io/en/latest/acb.html)에 설명된 복소 enclosure를 사용하며, 중앙값 표나 `lfun` 수치를 계산값으로 가져오지 않는다.

### 모든 누락 계수의 명시적 상한

완전한 good/bad Euler 계수의 Hasse 상한으로 \(|a_n|\le d(n)\sqrt n\le2n\)이다. \(m=\lceil|\operatorname{Re}(s)-1|\rceil\), \(q=e^{-c}\), \(x=c(K+1)\)이면 \(t\ge1\)에서 두 Mellin 가중치의 절댓값 합은 \(2t^m\) 이하이다. 또한

\[
\sum_{n>K}2n e^{-cnt}
\le \frac{2(K+1)e^{-c(K+1)t}}{(1-e^{-c})^2}.
\]

따라서 두 누락 Mellin 합의 전체 절대 오차는

\[
\delta_\Lambda\le
\frac{4(K+1)}{(1-q)^2}
\frac{m!e^{-x}}{x^{m+1}}
\sum_{j=0}^{m}\frac{x^j}{j!}.
\]

이 공식은 유한 지수 다항식으로 실제 평가한다. `coefficientSeriesTailUpper`는 누락 계수 전체를 포함하며 residual에 맞춰 추정하지 않는다. 유한 incomplete-Gamma 계산의 내부 반올림·근사 오차는 `finiteArithmeticEnclosure` 안에 함께 기록한다. 내부 특수함수 오차의 세부 분리는 노출되지 않는다는 상태도 유지한다.

완전한 L값은 \(L(E,s)=c^s\operatorname{rgamma}(s)\Lambda(E,s)\)로 변환한다. 비양의 정수에서 reciprocal Gamma를 사용하므로 pole을 가진 Gamma로 나누는 수치 연산을 하지 않는다. \(s=1,w=-1\)의 중앙 영점은 정확한 parity 항등식으로 처리한다. 작은 구간에 0이 포함된다는 이유로 exact vanishing을 선언하지 않는다.

모듈러성, weight-two Mellin 항등식, Hasse–Euler 계수 상한은 명시된 수학적 의존성이다. 이 프로그램이 그 정리를 Lean으로 새로 증명한 것은 아니다. 근거는 [Milne, Elliptic Curves](https://www.jmilne.org/math/Books/EC2.pdf)와 [Breuil–Conrad–Diamond–Taylor의 모듈러성 논문 목록](https://math.stanford.edu/~rltaylor/)이다. 반사점과의 함수방정식 residual은 같은 Mellin 구성의 대수적 일관성 검사이며 conductor나 모듈러성의 독립 검증으로 표시하지 않는다.

## 4. 영점·극·정규화 기록

`normalizationLedger`는 ζ/ξ, 중앙 L/Λ, 일반 복소 L/Λ 결과에 자동으로 포함된다.

| 위치 | 원함수 | 완성함수에서의 처리 |
|---|---|---|
| ζ의 `s=1` | residue 1인 단순극 | `s-1`과 상쇄, `xi(1)=1/2` |
| ζ의 `s=0` | `zeta(0)=-1/2` | s와 Gamma 극의 상쇄, `xi(0)=1/2` |
| ζ의 음의 짝수 | 자명 단순영점 | Gamma 극과 상쇄, ξ의 영점으로 이전되지 않음 |
| 타원곡선 L의 비양의 정수 | 자명 단순영점 | Gamma 극과 상쇄, 완전한 Λ는 유한·비영 |
| 정규화 인자가 유한·비영인 곳 | 비자명 영점 | 같은 중복도를 유지 |

ζ/ξ의 정규화와 반사식은 [DLMF 25.4](https://dlmf.nist.gov/25.4)에 따른다. good-only `L^S`에는 빠진 bad factors를 복원하기 전의 완성함수 방정식을 부여하지 않는다.

## 5. 실제 검증과 재현

`p7/tests/test_zeta_em.py`는 정확한 ζ 특수값, 독립 π²/6, 다른 고정밀 ζ 알고리즘, 두 나머지 제어, pole/정의역/잘못된 Euler 요청을 검사한다. `p7/tests/test_elliptic_complex.py`는 11a1·37a1·conductor 32의 가법적 환원 곡선에서 별도로 실행한 80자리 PARI `lfun` 값과 비교한다. 이 reference는 검산에만 사용하고 수학적 enclosure의 근거로 채택하지 않는다. 중앙에서는 기존 exponential/E1 알고리즘과 별도로 비교한다.

반증 검사는 빠진 bad factor, 바뀐 `L^S` 이름, 변경된 계수, 부족한 cutoff, exact parity와 작은 ball의 차이, 자명영점의 Gamma 상쇄를 포함한다. 허용되는 최소 cutoff K=1도 원래 입력을 보존하여 실행한다. PARI 2.19.0의 `ellan(E,1)` 오류는 최소 두 계수를 계산한 후 정확히 요청한 첫 K개만 반환하여 회피하며, 이 처리로 해석 계산의 cutoff를 늘리지 않는다.

`tests/test_p7_api.py`는 실제 384 MiB/90초 자원 계약 아래 새 계산과 source/environment 일치 replay를 수행한다. 저장 기록을 읽는 것과 현재 소스로 새 계산하는 것은 별개의 동작이다. 최종 release의 실제 테스트 결과·소스 해시·CI 실행은 별도 실행 manifest에 기록한다.
