# 원래 전역 leading mass와 stream 재구성의 결속

2026-10-11. `actual-leading-stream-primitive.mjs`는 변경하지 않은 private
`prepareActualGlobalLeadingProgram`에 붙어 다음 두 항등식을 확인한다.

\[
 \partial_X M_0=U_0,\qquad
 v_0=\frac{2\eta U_0-2D\eta M_0/X-d\,\partial_\eta M_0/X}{L}
 \quad(X>0).
\]

축 X=0에서는 원래 natural average로 정의한 regular extension을 유지한다.
source의 h, lambda, N과 모든 연속 모멘트는 원래 값이다. 이 결과는 원래
N3 source의 매끄러움·지지집합·contraction 증명에 결속하는 서면 해석학 논증과
실행된 exact body/algebra 검사이다. **새 Lean kernel 증명이 아니다.**
이 모듈만으로 압력의 전체 convolution, NS 잔차의 flatness나 M3를 완료하지 않는다.

## 1. 축에서 시작하는 원래 적분 상수

원래 계수 생산자 `actual-continuation-exact-core.mjs`는 매 차수 n에서
`average_n=u_n/(n+1)`을 쓴다. 그러므로 임의의 N에 대해

\[
 \frac{d}{dY}\left(Y\sum_{n=0}^N\frac{u_n(\eta)}{n+1}Y^n\right)
   =\sum_{n=0}^N u_n(\eta)Y^n.
\]

원래 B_rho 계수 공간의 radial base 20과 영역 0<=Y<=4.1은 각 고정 차수의
미분 급수까지 균등 수렴시킨다. 따라서 극한에서도
`d_Y(Y average)=u`이고, Y=Lambda X에서

\[
 M_0=X\left(U_*+\Lambda^{-1}\operatorname{average}(\Lambda X,\eta)\right),
 \quad U_0=U_*+\Lambda^{-1}u(\Lambda X,\eta)
\]

는 M_X=U를 만족한다. 실행은 이 두 원래 natural 함수 root, 실제 pressure와
g를 쓰는 계수 생산자 및 tail 생산자를 결속한다. 임의의 n에 대한 계수
나눗셈 항등식은 generic rational 검사로 확인하고, 잘못된 n+2 분모를
음성 대조로 거절한다. 유한 coefficient materialization을 전체 급수로
선언하지 않는다.

## 2. B26·B34·restoration의 전체 이력

원래 source는 모멘트를 log-radius로 적분하기도 한다. 양수 a,b에 대해

\[
 \int_{\log a}^{\log b} e^t U(e^t,\eta)\,dt
   =\int_a^b U(X,\eta)\,dX
\]

이므로 원래 log-radius Jacobian e^t를 반드시 보존한다. 실행은 실제
`atXi`, `atXsep`, `atRestLeft`, `incomingActual`의 첫 모멘트를 이 전체
이력과 하나씩 대조한다. 본문이 같은 적분의 bound 변수 이름과 곱셈·덧셈의
괄호만 정규화하고 integrand·끝점·원래 source operand는 바꾸지 않는다.

- Xa=4/Lambda에서 natural mass의 끝값과 B26 prefix의 시작값이 같다.
- Xi에서 B26의 complete log integral과 X-coordinate prefix가 같다.
- Xi 이후 두 Gi 상수 구간의 적분은 Gi times endpoint difference이다.
- restoration 끝에서 저장된 incoming mass는 원래 restoredU의 전체 적분이다.

이 접합 상수는 `smooth_piecewise`라는 노드 이름만으로 가정하지 않는다.
실제 겹치는 구간과 원래 N3의 flat cutoff 접합을 사용한다. 바깥 branch에
의해 선택되지 않는 중첩 내부 branch에 별도의 미분 방정식을 주장하지 않는다.

## 3. B8의 원래 첫 모멘트 방정식

B8 bump는 폭 w=1/4096인 `sigma_prime((x-left)/w)`이고 unit mass로
나눈 bump가 아니다. 따라서 그 전체 질량은 w이다. source의 실제 root z와
정확한 원래 first-row rhs를 그대로 두면

\[
 \Delta M_{B8}=M_{\rm incoming}-4\eta X_{\rm restRight}
       +X_R K_\eta\mu w(z_0+z_1)
       =X_RK_\eta\mu\,[w(z_0+z_1)-\mathrm{rhs}_0]=0.
\]

이 마지막 0은 실제 contractive root의 정의 방정식이다. 유한 iterate의
오차를 0으로 놓은 결과가 아니다. 모듈은 row의 폭, quadratic 항의 0,
actual root IDs와 discrepancy의 위 인수분해를 확인한다. B8 bump가 끝난
후 mass는 정확히 4eta X이므로 다음 원래 outer 구간으로 접합한다.

## 4. 감쇠 구간과 바깥 pulse의 끝

e XR 이후 원래

\[
 k(s)=4[1-\sigma(\log(1+s)/M_d)],\qquad
 M=\eta eX_R\left(4+\int_0^{\log(X/(eX_R))}e^v k(v)\,dv\right)
\]

에 FTC를 적용하면 M_X=eta k=U다. k는 `exp(Md)-1` 뒤에서 0이고
원래 T=`exp(Md)+10`까지 **11 단위**의 flat tail이 있다. 코드가 원래
`mConst`에 사용하는 whole integral과 같은지 확인하여 pulse 이전의
mass가 `eta*mConst`임을 결속한다.

다음 t=log(X/Xp) chart에서 원래 pulse는

\[
 U=E_p e^{\alpha t}R(t),\quad \alpha=-1/2-\lambda,
\]

\[
 M=\eta m_{\rm const}+X_pE_p\left(
     a\,I_{\rm main}(t)+c_0I_0(t)+c_1I_1(t)\right).
\]

`I_main`은 원래 w=lambda t의 세 구간 [0,1/50], [1/50,10], [10,11]의
complete/partial prefix를 모두 포함한다. 두 I_j는 center가 2만큼 떨어진
원래 bump의 전체 모멘트를 보존한다. `1+alpha=1/2-lambda`와 양수
log-radius 변환을 사용하면 각 active 구간에서 M_t=XU, 즉 M_X=U다.

마지막 zero branch를 위해서는 다음 실제 방정식도 필요하다.

\[
 \mathrm{linear}_{0,0}c_0+\mathrm{linear}_{0,1}c_1
   =\mathrm{incoming}_0+a\,\mathrm{perAmplitude}_0.
\]

실행은 두 affine moment solve의 정확한 유리식, 중심 이동의 exponential
인수, 원래 incoming mass와 **세 구간 전체 main-pulse debt**를 대조한다.
정규화 인수 `Xp Ep exp((1/2-lambda) center0)`를 되곱하면 incoming은
`-eta*mConst`, perAmplitude는 음의 main mass가 된다. 여기에는 원래
`Pstar=exp(logP)`를 사용하며 숫자 근사를 사용하지 않는다. 따라서 실제
energy 방정식으로 선택한 amplitude에서도 마지막 mass가 정확히 0이다.
main은 11/lambda, 마지막 bump는 13/lambda-1+3/20에서 끝나므로
13/lambda의 zero branch 전에 열린 zero collar가 존재한다.

## 5. 실제 C12 위상과 I1 모멘트 복원

C12의 deltaU는 원래 `B_cut(X,eta,N log X)/N`이다. 실행은 실제 zero guard와
두 끝점, 원래 N log X를 직접 결속한다. 그 전체 log-radius density
`exp(t)*deltaU(exp(t))`가 partial prefix와 완전한 debt dM에 모두 들어간다.
period average나 frozen phase로 바꾸지 않는다.

I1은 폭 1/2의 **unit-mass** bump를 쓰므로 원래 primitive는 sigma이며

\[
 M_{I1}=X_0 K\lambda\sum_{j=0}^1 z_j\sigma((X/X_0-l_j)/(1/2)).
\]

미분하면 실제 repairU와 같다. 모든 bump가 끝난 뒤 원래 first-row equation은

\[
 dM+X_0K\lambda(z_0+z_1)
   =X_0K\lambda\,[z_0+z_1-\mathrm{rhs}_0]=0
\]

를 준다. 원래 `I1Right/X0=exp(5)>32>13.5`에서 모든 bump가 이미 끝난다.
따라서 이후 M=preM, U=preU로 돌아가는 실제 source branch의 상수도 맞는다.

## 6. 원래 v와 continuity의 연결

실제 finalv의 내부 branch와 preC12v의 일반 branch가 문서 첫 번째 stream
공식과 같은지 대조한다. natural core에서는 M=X times average를 사용하면
축에서 나누지 않는 원래 v 공식과 X>0의 일반 공식이 같다. 이후 고정된 원래
axis boundary `actualGlobalAxisVX`를 그대로 보존한다.

delta=M_X-U라 놓은 generic exact identity는

\[
 L(v+Xv_X)+dU_\eta-2A\eta U-2\eta XU_X
   =-2D\eta\delta-d\delta_\eta
\]

이다. 위 actual source mass 항등식으로 오른쪽은 0이다. 이 결과가 다음
original Omega prefix·pressure convolution adapter에 필요한 전역 입력이다.
Omega의 전체 적분 body와 pressure branch는 그 다음 모듈에서 별도로 결속한다.

## 7. 검증·실패 기록과 범위

수정 후 actual source attempt3은 6/6 PASS, exit0,
1.574451434초 / 최대 RSS 327,127,040 bytes였다. 최종 kernel은 4/4 PASS다.
실행 중 새 모듈 2개와 기존 의존 18개가 모두 불변이었다. source certificate와
최종 독립 검토, 정확한 graph와 파일 SHA는
`evidence/leading-stream-primitive-20261011/`에 저장한다.

attempt1은 이미 full-body alpha-equivalence로 확인한 modulation prefix의
재구성 node를 original source node와 다른 atom으로 취급해 마지막 복합
branch 비교가 실패했다. bound integrand 이름의 동치가 확인된 원래 node를
공유하도록 수정했다. attempt2에서는 수학 검사를 마친 뒤 metadata의
`constructor` 키가 기존 canonical JSON 정책에 거절됐다. 필드명을
`originalConstructor`로 바꾸었고 validator는 유지했다. 두 실패의 소스,
test, runner, log, process는 각각의 attempt snapshot으로 보존했다.

증명 영역은 원래 X>=0, eta in [-1,1]이며 축과 eta 끝점에서는 원래 inward
미분을 사용한다. 전역 mass와 stream 항등식의 결속은 제공하지만 이 모듈은
transcendental 모멘트의 수치 구간, 모든 차수의 새로운 majorant,
pressure/stress 잔차 전체, full physical flat-error, actual analytic Lean
인스턴스를 생성하지 않는다. wholeGN4와 M3 gate는 계속 false다.
