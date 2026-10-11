# 실제 small-q terminal covariance: 독립 수학·실행범위 검토

## 검토 결론

actual-admissible-terminal-covariance.mjs와 실제 source 실행 기록을 읽기 전용으로 대조했다. 검토한 원래 support recipe, 새 band의 source 전이, 행렬 방향·질량 인자, source threshold 선택 및 claim 범위에서 **구체적인 수학적 결함을 발견하지 못했다**. 실제 원본 source/새 두 Volterra 시스템/target/inverse를 생성한 실행은 13개 검사 묶음이 모두 PASS이고, 28개 source 결속 항목도 PASS다.

이는 다음의 한정된 결과를 뒷받침한다.

> 원래 source에서 선택한 정확한 dyadic band와 선언한 terminal 영역의 고정 label에 대해, 원래 전체 공분산 행렬의 determinant가 음수이고 두 inverse weight가 양수라는 분석적 증명을 실제 식에 결속했다. 원래 heat, 무한 Volterra 해 및 전체 covariance 적분을 근삿값으로 교체하지 않았다.

전체 공분산의 **수치 구간**, 원문의 미지 최종 Γ, 모든 source box, flat endpoint의 연장, 실제 분석 명제의 Lean 증명 또는 M3 시작을 인증한 것은 아니다.

검토는 다음 파일·기록에 해당한다.

| 대상 | SHA-256 |
|---|---|
| actual-admissible-terminal-covariance.mjs | fb1d4771c0336fc68c3f023a0d13927321948235c6ad371e8b829f00e3539f2d |
| actual-admissible-terminal-covariance-source.test.mjs | acf1c2e056a3ad9e00cd3ff364f6559205ccc31fb86f606d61f700898c0671ab |
| actual-admissible-terminal-covariance-source-attempt1.json | 39d3c0a3834348a2ef5b82ec06119aa76ab7d5e25b841772ddded86a66ff0beb |
| actual-admissible-terminal-covariance-source-attempt1.log | bb55c0e2d9d57ab12a4d34661765665efc0a971b3b4883ae1596485700df8226 |

## 1. 모든 양의 차수의 공통 zero exterior

원래 actual-residual-order-induction-source.mjs의 completeOrder와 새 모듈을 대조했다. 각 $n\ge2$에서 내부 본문과 moment debt가 어떻든 다음의 같은 원본 경계를 사용한다.

| 원래 항 | 실제 zero after-branch의 경계 |
|---|---|
| local $F_n,U_n$ | $X_{\rm cut}$ |
| moment correction $dF_n,dU_n$ | $I_{\rm pos,right}$ |
| $M_n$와 average | 마지막 $U$ bump 경계 |
| $\Pi_n$ | $X_+$ |
| $v_n$ | $U_n$, average 및 그 $\eta$ 미분의 조합 |

원래 actualSupportOrderProof는 이 경계들이 $X_+$ 이전에 있다는 식과 상수 부등식을 결속한다. 경계가 $\eta$에 의존하지 않으므로 smooth zero exterior의 모든 유한 $X,\eta$ 미분도 0이다. $n=1$은 원래 moment-completed first-order 생산자에서 따로 결속한다.

이 설명은 관찰된 차수 $1,2,3$을 모든 차수로 외삽한 것이 아니다. 모든 $n$에서 같은 원래 completeOrder 함수를 사용하는 것에 대한 **서술적 귀납 증명**이다. 검사된 finite prefix와 임의 내부 본문의 support grammar는 이 연결의 일부다. 새 generic grammar만으로 actual-source 권한을 부여하지 않는다.

$c_n\ge2^n$에 의한 local finiteness를 함께 사용하면, 모든 $q>0$에서 $X>X_+$인 열린 영역의 실제 완성 배경은 leading 배경과 정확히 같다. cutoff의 추가 stream 미분항도 그 영역에서 양의 차수 field가 0이므로 사라진다. $X\le X_+$ 안의 활성 계수까지 없애지 않는다.

새 reducer는 compact integrand라는 이유만으로 그 원시적분을 0으로 바꾸지 않는다. 실제 moment-closed zero branch가 있거나 본문이 literal 0/적분길이가 0인 경우만 사용한다. 이 negative control을 포함한 설계가 적절하다.

## 2. 원래 ell=1 pulse와 새 멤버의 구별

기존 private ell=1 operator는 원본 leading/background/방향 및 고정 source norm 식을 얻는 데에만 사용한다. 새 graph는 그 prefix를 복사하고, 다음을 다시 구성한다.

- $\ell_*=\ell_{\min}+8$인 정확한 dyadic band.
- 실제 $\epsilon,k,c_i,L_s,B_s$.
- 원래 규칙대로 반올림한 두 frozen carrier.
- moving-normal pressure 및 moving-basis 항을 포함한 실제 계수행렬.
- 원래 초기조건을 가진 두 full Volterra 시스템.
- 원래 $\chi,\psi$와 Haar 인자를 포함한 covariance 및 mass 적분.

코드는 원래 ell=1의 pulse나 covariance를 새 admissible 멤버라고 재분류하지 않는다. source prefix가 바뀌지 않았는지, 실제 두 새 Volterra 시스템의 본문·초깃값·길이·norm root가 결속되는지 검사한다.

고정 $B_{\rm norm}$ 식도 원래 $2^{128}+R_{\rm env}^{4096}$, 완성 배경의 실제 norm roots 및 chart constants로 재대조한다. 따라서 free coordinates가 없다는 이유만으로 임의 scalar norm을 통과시키는 구조가 아니다. terminal의 completed-leading error가 정확히 0이므로 해당 새 영역에서 원래 source 근접성·frame 경계를 소비할 수 있다.

## 3. 실제 band와 원문의 미지 Γ

새 band의 정수 $\ell_*$를 천문학적인 정수 문자열로 전개하지 않아도 정의와 부등식을 정확히 다룰 수 있다. 원래 source threshold를 사용하면

\[
\ell_*=\ell_{\min}+8,\qquad
Q_*=2^{-\ell_*},\qquad
q_*=2^{-\ell_{\min}-4}
\]

이므로

\[
2Q_* = q_*/8<q_*.
\]

따라서 $s\in[1/2,2]$인 선택된 전체 physical band의 $q=Q_*s$가 원래 **source가 증명한 충분조건 영역**에 들어간다. 이는 미지의 최종 $q_{\rm big}$ 또는 $\ell_0$를 수치 입력으로 평가했다는 뜻이 아니다. 실제 receipt의 unknownPaperGammaMembership=NOT_EVALUATED와 arbitraryOriginalQbigAndEll0Evaluated=false가 이 구별을 유지한다.

palette 식을 직접 계산하면, $a=((1+h)\ell_*\log2-2\log\ell_*)/\log T_g$ 및 $m=\lfloor a\rfloor$에서

\[
\frac1{T_gS_*}<c_i\le\frac1{S_*},
\qquad
2r_0\le L_s/S_*<2r_0T_g.
\]

반올림한 소수 로그를 사용하지 않는 코드와 일치한다. $S_*=\ell_*^2$ 및 원래 frequency threshold도 그대로 유지한다.

## 4. determinant와 양의 weight의 인자·방향

각 family의 실제 양의 질량을 $m_\pm$라 하고 $A_c=-c_0\sqrt{1+u^2}>0$라 하자. 정규화 행렬은

\[
C=
\begin{pmatrix}-N^T/A_c\\K^T/u\end{pmatrix}
H_{\rm cov}\operatorname{diag}(m_+^{-1},m_-^{-1}).
\]

원래 $N,K$의 방향 때문에 왼쪽 행렬의 determinant는 $-1/(A_cu)$이다. 따라서

\[
\det H_{\rm cov}
=-A_cu\,m_+m_-\det C.
\]

이는 새 코드의 음의 determinant 부호와 일치한다. 질량 인자가 역수로 뒤집히거나 square-root 계수가 빠진 부분을 발견하지 못했다.

원래 source bound가 $15/8<\det C<17/8$와 양의 질량 하한을 주므로, 코드의

\[
|\det H_{\rm cov}|>
\frac{15}{8}A_cu\,m_+m_-
\]

및 질량 하한을 대입한 uniform bound가 정당하다. 실제 Haar·transverse mass 인자가 포함된다. $P\le1$, $\psi\le1$, 실제 amplitude bound를 통한 mass upper bound도 같은 원래 적분에 적용된다.

실제 chart target $\overline T=s^{-A-1/2}T_0(X,\eta)$와 target scale $b=-(N\cdot\overline T)/A_c>0$에 대해

\[
\frac{\kappa}{64}\le\frac{m_\pm y_\pm}{b}\le2
\]

를 실제 target 방향 및 column error에 결속한다. 코드의 $y_\pm$ 하·상한은 이 식과 정확히 같다. 실제 adjugate inverse의 두 행 항등식과 inverse weight를 변경한 negative control도 실행됐다.

다만 이 부등식은 **원래 식에 결속된 분석적 부등식**이다. 매우 작은 실제 determinant와 weight를 decimal 또는 directed numerical interval로 계산했다고 해석해서는 안 된다.

## 5. 영역과 smoothness의 끝점

positivity 부등식의 선언 영역은 representative와 slow point 모두 $X_+<X<X_b$, 같은 source slow box, $\eta\in[-1,1]$, $s\in[1/2,2]$다. 대표점과 rounded label은 slow 미분 전에 고정한다.

smooth positive square root에 대한 문장은 **열린 slow chart 내부**에 적용한다. $\eta=\pm1$은 slow $T=0$이고 원래 Laplace heat는 $z\ge0$에서 정의된다. 그 경계에서는 원래 적분의 모든 고정 유한 jet에 대한 적분가능한 지배와 안쪽 연속연장을 사용할 수 있다. 원래 실수 적분을 $z<0$까지 확장했다거나 경계 밖의 smooth source를 만들었다는 주장은 하지 않는다. closed $\eta$에서의 부등식과 open chart 내부의 smoothness를 구별해야 한다.

$X=X_+$, $X=X_b$에서의 전역 zero extension, 서로 다른 frozen representative 사이의 연결, 모든 label 합 또는 전역 물리 잔차도 이 새 결과의 범위 밖이다.

## 6. 실행 기록의 범위

검토한 source receipt와 TAP 로그는 다음을 담고 있다.

- 실제 검사 묶음 **13/13 PASS**, source 결속 **28/28 PASS**.
- 새 graph **234,335 nodes**, SHA-256 8074f84667fd1bddddf6090f706709dd29bd981ca2120b67f009fa47e17a152a.
- 실행 전후 같은 **51개 파일** import closure SHA-256 54620b8811537a0bb4b8389279c12082fda028c9d7113db941461d827779420e.
- source 계산 기록 **32.4705초**, peak RSS **1,986,326,528 bytes**.
- 실행 당시 HEAD c4b1903b21243d7a2066daa9e66423f41c4e862f.

실행 담당자가 최종 process의 tool 결과에서 exit_code=0을 관측했다고 전달했다. source JSON 본문에는 별도 exitCode 필드가 없으므로 이 검토는 **TAP의 13/13 PASS와 그 최종 process 관측을 구분**한다. 원래 receipt를 수정하거나 source 실행을 반복할 이유는 없다. 별도 runtime observation에 이 최종 exit code를 보존하는 것이 적절하다.

이 독립 검토에서는 대형 source 작업을 새로 실행하지 않았다. source 생성/증명 모듈과 기존 제품 bundle을 수정하지도 않았다. 검토 대상은 직접 Node source 실행이며, worker 또는 browser 경로가 새 수학 모듈을 실행했다는 증거는 아니다.

최종 receipt의 wholeGPOSComplete=false, rigorousWholeHNumericalEnclosure=false, newLeanKernelProof=false, m3MayStart=false를 유지하는 것이 실제 결과와 일치한다.
