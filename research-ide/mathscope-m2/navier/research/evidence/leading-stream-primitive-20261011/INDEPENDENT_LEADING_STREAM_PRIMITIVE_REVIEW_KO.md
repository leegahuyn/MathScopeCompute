# 원래 leading stream primitive의 독립 수학 검토

검토일: 2026-10-11. 검토자는 구현자와 별도로 실제 원본 연결, 새로운 두 모듈, 한국어 증명, 최종 source attempt3의 certificate/process/TAP를 읽었다. 추가 source 생성이나 수치 실험은 하지 않았다. 아래 명시된 범위에서 수학적 오류를 찾지 못했다.

## 1. 검토 대상과 실제 실행 증거

- `actual-leading-stream-primitive.mjs` SHA256: `4a9a1d28d9ee7cea2d776fe73bdeed3a95dbe62fdb50a51fa536d3ccc55667de`.
- `actual-leading-stream-primitive-kernel.mjs` SHA256: `afedc437cad409b6b49bcc7903149678fffa103324c6141468d730148a3d5ba6`.
- `source-certificate-3.json` SHA256: `df554b5f2902ca8ac0ba65a3d389d3b30c69c48581c8383fff47e9c50a96530a`.
- `source-attempt-3-process.json` SHA256: `2c38c572d19262df325b165a257f65441b1424d95fe33b1cf30e2ddd1b9a5002`.
- `source-attempt-3.tap` SHA256: `fdc986adf5f1a006619bf2a10741f52918fec22172cb7f21eb20069f06749273`.

최종 TAP는 6/6 PASS이고 별도 process 기록은 exit 0, 1.574451434초, child peak RSS 327,127,040 bytes를 관측했다. certificate 자체는 test group 실행 전에 저장되므로, certificate의 `pass`만으로 최종 process 성공을 추정하지 않았다. 기록된 test/runner와 새 모듈 2개를 포함한 20개 의존 파일의 현재 SHA가 실행 당시 값과 모두 같음을 확인했다. 그중 기존 frozen 의존은 18개다.

실제 source 내부 결속 검사 30개가 모두 통과했다. 고정 graph는 25,922 nodes, canonical 1,036,735 bytes이며 SHA256은 `d6506ec9e8dbcf38415e62f3e7650ab786abff8bcbb6acb11d5f0c12536a7419`이다. generic kernel의 4개 항등식과 3개 잘못된 대조식은 실제 전역 primitive를 인증하는 역할과 구분된다.

## 2. 자연 급수에서의 적분 상수

원래 `actual-continuation-exact-core.mjs`는 동일한 실제 \(u_n\)으로 `average_n=u_n/(n+1)`을 만든다. 각 유한 \(N\)의 항별 항등식

\[
\partial_Y\left(Y\sum_{n=0}^N\frac{u_n}{n+1}Y^n\right)
=\sum_{n=0}^N u_nY^n
\]

은 맞다. 원래 radial base 20과 \(0\le Y\le4.1\)의 tail 경계가 각 고정 유한 미분 차수의 균등 수렴을 주므로 극한에도 적용할 수 있다. \(Y=\Lambda X\)에서 실제

\[
M=X(U_*+\Lambda^{-1}\operatorname{average}(\Lambda X,\eta)),
\qquad U=U_*+\Lambda^{-1}u(\Lambda X,\eta)
\]

는 \(M_X=U\)이다. \(U_*\)는 \(X\)에 독립인 동일 source 함수이며 \(\eta\) 의존을 제거하지 않는다. 축에서 \(M/X\)를 직접 나누는 대신 원래 average를 유지하므로 regular extension도 보존된다.

## 3. B26 이후 모든 실제 prefix와 B8 접합

positive log-radius의 Jacobian \(e^t\)는 필수이다. 실제 `atXi`, `atXsep`, `atRestLeft`, `incomingActual`는 모두 원래 \(e^tU(e^t,\eta)\) 적분 또는 그에 해당하는 상수 구간 적분과 연결되어 있다. `explicitPrimitiveBodyIdentity`는 bound-variable 이름과 정확한 대수 연산의 동치를 처리하며, 적분 본문이나 끝점 또는 실제 accumulated history를 생략하지 않는다.

B8은 unit-mass bump가 아니라 폭 \(w=1/4096\)인 \(\sigma'((x-l)/w)\)를 사용한다. 따라서 dimensionless 전체 적분은 \(w\)이고 실제 mass 보정에는 \(X_RK_\eta\mu w(z_0+z_1)\)가 맞다. 코드의 root row는 선형 계수 \(w,w,0,0\), 해당 quadratic row 0, 실제 contractive root IDs를 확인한다. 전체 접합 오차가

\[
X_RK_\eta\mu\,[w(z_0+z_1)-\mathrm{rhs}_0]
\]

로 인수분해되므로 그 원래 root 방정식에 의해 0이다. 유한 root iterate를 정확한 해로 쓰지 않는다. B8 이후 선택되는 outer branch의 mass 상수가 일치한다는 증명과, 선택되지 않는 내부 중첩 branch에 다른 방정식을 주장하는 것을 구분한 설명도 적절하다.

## 4. 감쇠 질량과 원래 outer pulse의 두 모멘트

감쇠식의 \(M=\eta eX_R(4+\int_0^{\log(X/(eX_R))}e^vk(v)\,dv)\)를 직접 미분하면 \(M_X=\eta k=U\)이다. 원래 \(k\)가 0이 되는 시각 \(e^{M_d}-1\)과 cutoff 끝 \(T=e^{M_d}+10\) 사이의 11 단위 간격도 맞다. 원래 `mConst`를 동일한 whole integral에 연결했으므로 pulse 이전의 mass가 \(\eta m_{\rm const}\)로 유지된다.

outer pulse에서 \(t=\log(X/X_p)\), \(\alpha=-1/2-\lambda\), \(b=1/2-\lambda=1+\alpha\)라고 쓰면 각 실제 partial prefix의 미분은

\[
M_t=X_pE_pe^{bt}R(t)=XU.
\]

main 부분의 \(w=\lambda t\) 변환에서는 \(1/\lambda\)가 정확히 필요하다. 코드가 유지한 [0,1/50], [1/50,10], [10,11]의 세 적분 모두가 전체 mass에 들어간다. 두 translated bump도 각각의 전체 적분을 보존한다.

마지막 0 branch의 정당화는 compact support만으로 얻지 않는다. 첫 실제 affine moment row를 \(X_pE_p e^{b c_0}\)로 되곱하면 incoming 항은 \(-\eta m_{\rm const}\), per-amplitude 항은 음의 whole main mass가 된다. 코드의 exponent 항등식과 실제 source \(X_p=X_Re^{\mathrm{start}}, E_p=P_*e^{\log A}/(1+\eta^2), P_*=e^{\log P}\)는 이 정규화와 일치한다. 그러므로 실제 energy-selected amplitude의 값과 무관하게 원래 선형 mass equation이 마지막 mass를 0으로 만든다. 둘째 affine row도 보존되어 있다.

main은 \(11/\lambda\)에서, 마지막 bump는 \(13/\lambda-1+3/20\)에서 끝나므로 \(13/\lambda\) 전에 열린 0 collar가 있다. 부정확한 primitive 상수를 `smooth_piecewise` 표시만으로 상쇄한 부분은 찾지 못했다.

## 5. C12의 실제 위상과 I1 복원

C12 보정에는 원래 \(N\log X\) 위상을 가진 \(\delta U\)가 들어간다. log-radius 적분의 전체 density \(e^t\delta U(e^t,\eta)\)를 partial prefix와 whole debt 양쪽에 그대로 사용한다. phase 평균이나 frozen phase로 바꾸지 않는다.

I1은 B8과 달리 폭 \(1/2\)로 나눈 unit-mass derivative bump를 쓰므로 primitive가 \(\sigma\)인 식과 \(X_0K\lambda\) 인자는 맞다. 그 실제 first root row는 \(z_0+z_1=\mathrm{rhs}_0\)이며, accumulated modulation-plus-repair mass는

\[
X_0K\lambda\,[z_0+z_1-\mathrm{rhs}_0]=0
\]

이다. 모든 repair bump가 \(I1Right/X_0=e^5\) 전에 끝난다는 source 범위와 일치한다. 첫 source attempt의 atom 비교 실패를 이미 full-body 동치가 확인된 원래 modulation root 공유로 고친 방식은 원래 적분을 삭제하는 것과 다르다.

## 6. 실제 \(v\)와 continuity

코드가 최종 source \(v\)와 대조한 식

\[
v=\frac{2\eta U-2D\eta M/X-dM_\eta/X}{L}
\]

은 원래 stream reconstruction과 같다. \(\delta=M_X-U\), \(A+D=1\)을 사용해 독립적으로 전개하면

\[
L(v+Xv_X)+dU_\eta-2A\eta U-2\eta XU_X
=-2D\eta\delta-d\delta_\eta
\]

가 된다. 앞의 actual source primitive 항등식으로 오른쪽이 0이므로 continuity 결론도 맞다. 축에서는 원래 natural average와 `actualGlobalAxisVX`를 사용하고, 일반식의 \(1/X\)를 0에 그대로 대입하지 않는다.

## 7. 판정의 정확한 범위

이 결과는 원래 N3 source의 smoothness, contraction과 지지집합 순서를 사용하는 **실제 전역 \(M_{0,X}=U_0\), stream reconstruction 및 continuity의 source-bound 서면 증명**이다. 그 입력과 모든 accumulated mass를 실제 AST에 결속한 것이 새 성과다. source 실행 PASS 자체를 FTC나 무한급수 정리의 Lean 증명으로 해석하지 않는다.

Omega의 원래 전역 prefix, 전체 pressure convolution과 그 branch 접합, weighted stress/residual 및 physical flat-error는 별도이다. certificate의 해당 false 플래그와 `wholeGN4Complete:false`, `m3MayStart:false`는 맞는 범위다. 수치 primitive 구간이나 모든 차수의 새로운 공통 majorant도 이번 실행에서 계산하지 않았다.

attempt1의 full-body/atom 비교 오류와 attempt2의 금지 metadata key 오류는 실제 실패 기록이며 설계한 음성 대조가 아니다. 실행 당시 snapshot과 로그를 보존한 채 최종 수정본만 6/6 PASS로 보고하는 방식이 적절하다. 본 검토는 source/문서/기록을 수정하지 않았다.
