# C88 실제 첫 Forced 프레임과 원본 펄스 가중치

**VERIFIED.** 원본 실행 44582875351의 22,155,584개 레코드를 다시 인증했다.
두 부호에서 원래의 이동 법선 \(n,n_w\), 원통 행렬 \(K\), \(A_\phi\), 움직이는 기저 \(B,B_\ell\), 원래의 2×2 정규화 행렬과 \(P\) 적분을 재구성했다.
같은 형식 인자에 실제 대표점 \((X_{\rm rep},\eta_{\rm rep},s_{\rm rep})\)과
독립 펄스 좌표 \(w\)를 치환하면 스무 Forced 시스템의 행렬 180개가 일치한다.
각 스칼라 비동차 항도 같은 법선의 \(-\Pi f_m\)와 대조해 120개를 확인했다.
문제의 행렬은 보조각 \(Y_0,Y_1\)와 독립이다.

초기 Primary 속도, 압력, 주 펄스 꼬리의 실제 100개 본문에서 같은 원본 \(P(v)\) 인자를 찾았다.
실제 속도에서는 여섯 원본 포텐셜 정의를 열고 형식·실제 인자를 대조했다.
포텐셜의 원래 느린 좌표와 횡좌표 미분은 \(P\)의 형식 펄스 좌표와 독립이다.
나머지 원본 항의 \(v\) 미분에는 \(P_v=(\lambda-d_{\rm ref})P\)를 사용한다.
원본 \(P\) 적분의 아래끝은 정확히 \(L_s/2\)다.

## 원본 분모와 팔레트 범위

모든 실제 법선의 각 성분은 \(n_\theta=p/R\)이며
\(p=j/k\)에서 \(j\)는 원본 반올림과 0일 때의 부호 보정이 주는 0이 아닌 정수다.
원본 \(k=\lceil\varepsilon^{-1/2}\rceil\), \(0<\varepsilon\le1\)에서
\(1\le k\le2\varepsilon^{-1/2}\)이다. 따라서 허용 셸 \(0<R\le R_{\rm env}\)에서

\[
|n|^2,\ n_\theta^2+n_z^2
 \ \ge\ n_\theta^2\ \ge\ \frac{\varepsilon}{4R_{\rm env}^2},
\qquad
\frac{1}{m k |n|^2}\le\frac{2R_{\rm env}^2}{m\sqrt\varepsilon}.
\]

왼쪽 기저 역행렬의 다른 분모 \(c=c_0\sqrt{1+s^2}\)에는 같은 원본
primitive의 \(\lvert c_0\rvert\ge R_{\rm env}^{-6}\)를 적용한다.
여기서 \(s=\operatorname{sign}\,u(1/2+w/L_s)\)는 원래의 참조 기울기이고
\(u=2/\kappa=2R_{\rm env}^{10}\ge2\)다. 따라서 \(\sqrt{1+s^2}\le2u\),
\(\lvert c\rvert\le2u\lvert c_0\rvert\) 및
\(\lvert \partial_wc\rvert\le u\lvert c_0\rvert/L_s\)를 사용한다.

원본 정수 팔레트의 바닥 함수와 \(Q=2^{-\ell}\)을 유지하면
\(1/(T_g\ell^2)<c_i\le1/\ell^2\)다. 따라서 원본 \(L_s=2r_0/c_i\)는
\(2r_0\le L_s/\ell^2<2r_0T_g\)를 만족한다.

## 정규화된 조건부 Forcing 전달

\(q_n=n^T n\), \(\Pi=I-nn^T/q_n\), \(d=\varepsilon k^2 q_n\)로 쓰고
프로젝션 뒤의 실제 강제항을 \(g_m=-\Pi f_m\)라 하자.
실제 움직이는 법선과 원래 영초기조건에서
\[
\partial_w(n^T U)=-m^2d\,n^T U,\qquad n^TU(0)=0
\]
이므로 실제 해 \(U\)는 모든 같은 고정 라벨에서 접평면에 있다.
\(B_\ell B=I_2\), \(n^TB=0\)이므로 \(U=P B z\)에서
\[
z_w=\bigl[M_{\rm orig}-(m^2-1)d I_2\bigr]z+
          B_\ell g_m/P .
\]
\(M_{\rm orig}\)는 대조를 마친 원래의 두 부호 정규화 행렬이다.
이 유도는 본래 3차원 해의 매개변수 미분을 임의로 접벡터라고 부르지 않는다.
먼저 각 매개변수의 해를 2차원 이동 기저로 전개한 뒤 미분한다.

\(w/L_s\le1/2\)에서는 \(|s|\le|u|\)여서 \(\lambda-d_{\rm ref}\ge0\),
이후에는 반대 부호다. 중점을 아래끝으로 하는 적분에서 \(0<P(w)\le1\)을 얻는다.
원본 같은 가족의 폐펄스 구간에서 \(M_{\rm orig}\)의 참조 대각은
\(\mathrm{diag}(0,-2\lambda)\)다. 실제 원본의 각 입구 오차 및 감쇠 오차
상계 \(B_{\rm norm}^{256}/S\)를 적용하면
추가 감쇠를 유지한 유도 무한대 로그 노름 상한은
\(3B_{\rm norm}^{256}/S\)다.
따라서 그 허용 범위의 모든 라벨에서 순방향 전파자에는 같은
\(\exp(3B_{\rm norm}^{256}L_{\max})\) 상한이 적용된다.
물리 변수에서 전파자의 \(P(t)/P(s)\)를 균일하게 상계할 필요가 없다.
모드 1에는 실제 \(P\)가 하나 이상 들어가므로 위 식의 \(g_1/P\)에 그 인자를
줄일 수 있다. 모드 2에는 \(P^2/P=P\le1\)이 남는다.

\(\mathcal M\ge1\)을 원본 느린 \(F,G\) 5차 상계, 양의 셸 반지름과
역수, 동결 운반자, \(L_s,L_s^{-1},\lambda_0,u|c_0|,|c_0|^{-1}\),
\(4R_{\rm env}^2/\varepsilon\)의 공통 상계로 두었다.
유리수 검사는 위 원본 분모와 Leibniz 합에서 \(R,Z\) 0–4차의
원소별 상계를 계산한다. 다항식 상계에는 \(\Pi,B,B_w,B_\ell,M_{\rm norm}\)이
포함된다. \(\mathcal M\)의 유한 거듭제곱만 사용한다.
\(L\) 미분은 같은 고정 경로에서 행렬에 작용할 때 0이다.

같은 원본 소섭동 범위에서는 분모를 더 강하게 제어한다.
\(B_*=B_{\rm norm}\), \(S=\ell^2\), \(S\ge B_*^{512}\)이고,
참조 횡법선의 크기 \(B_s>B_*^{-1}\)와 두 횡성분의 오차
\(B_*^{12}/S\)를 원본에서 사용한다. 그러면 \(\sqrt{n_\theta^2+n_z^2}\ge B_*^{-2}\)다.
이 경우 \(\mathcal M\)에서 \(4R_{\rm env}^2/\varepsilon\) 자리를
\(B_*^4\)로 대체할 수 있고, 원래 운반자 크기와 팔레트 길이에 의해
\(\mathcal M\le C_*S\)가 된다. 여기서 \(u|c_0|\le2R_{\rm env}^{20}\)은
고정 원본 상수 부분에 포함한다. 정규화 행렬의 각 \(j\)차 상계에는
명시적 계수와 \(\mathcal M^{36+13j}\)가 쓰인다.
전체 유도 무한대 노름은 2×2 행렬의 원소별 상계에 2를 곱하면 된다.

**CONDITIONAL.** 같은 원본 팔레트·등식·오차의 해석적 허용 도메인,
원본의 보통 매개변수 미분과 \(F,G\)의 실제 상계를 적용하면 이 전달은
C87의 양쪽 Gaussian 극점에 추가 방사 극점을 만들지 않는다.
실제 초기 평균 C5, Primary 정규화 진폭 C7, 나머지 압력과 최종
보정의 균일 수치 상계는 별도 입력이다. 검증한 범위는 첫 Forced 20개다.
N7-06·N8-05 및 최종 jets는 OPEN, RELEASE HOLD다.

## 재현

~~~powershell
python -B verify_all_label_pulse.py --goal GOAL --runtime C66_RUNTIME --outer-runtime C30_RUNTIME --artifact HOSTED --cache C80_CACHE --out NEW_JSON
~~~
