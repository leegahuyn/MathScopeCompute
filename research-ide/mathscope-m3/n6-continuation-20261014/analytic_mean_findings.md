# 실제 Volterra/Picard 해석 조건의 후속 축소

이 검사는 1차 cloud의 고정된 `header.json` 및 `source-dag-checkpoint.sqlite`와 실제 producer 7개의 바이트를 확인한다. 두 원본 covariance system 0/1의 matrix source root는 각각 `[[623351,623328],[623332,623352]]`, `[[623685,623663],[623667,623686]]`다. 원본 initial datum은 정확히 `(1,0)`, pulse coordinate는 `622805`, length는 `623027`이다. 원본 slow derivative 방향은 `[622802,622803,622804]`; representative와 band `[622807,622808,622809,622791]`은 이 미분 전에 고정된다. 새 검사에서 **128,206 node**의 coefficient/definition closure에 unknown boundary는 **0**이었다.

## 원본 scalar 조건

원본 node `623027`은

\[
 L_s=\frac{1/8589934592}{\exp(623021)\exp(623023)}>0
\]

이다. 유한한 양의 원본 정수 band와 유한한 고정 source parameter에서 exponent는 유한하다. 이 positivity는 background 함수의 값이나 후보 `normUpper`에 의존하지 않는다. 원본 `622801`의 \(k=\lceil\epsilon^{-1/2}\rceil\)는 \(\epsilon=\exp(h\log Q)>0\)로 인해 양의 유한 정수다.

두 angular carrier node `623111`, `623463`는 각각 node `623109`, `623462`의 정수를 이 \(k\)로 나눈다. 원본 piecewise rule은 정수 \(j=\lfloor y+1/2\rfloor\)가 0일 때 부호에 따른 \(\pm1\)을 사용하고, 그 외에는 \(j\)를 사용한다. 따라서 실제 raw carrier 값이 유한한 실수이면 두 부호 모두

\[
 |p|\geq 1/k>0.
\]

원본 양의 annulus chart에서는 \(R=\sqrt{2sX}>0\)이다. 모든 Cartesian 호출이 이 chart에 속하는지는 독립 판정으로 남긴다.

원본 frozen scalar \(c_0\) node `623008`의 nonzero는 원본 leading 값이 유한한 실수라는 전제에서 다음 **한 개 실제 polynomial inequality**로 축소된다.

\[
 -2F_0g_R\bigl(g_R^2+g_Z^2+2F_0g_R\bigr)>0,
\]

여기서 \(F_0,g_R,g_Z\)는 각각 source node `622971`, `622992`, `622991`이다. \(G=g_R^2+g_Z^2\)라 두면 이 부등식은 \(G>0\), \(2F_0g_R\ne0\)를 주고, 실제 growth radicand node `623005`는 위 polynomial을 \(G\)로 나눈 값이다. 그러므로 \(\lambda_0>0\), \(c_0=\lambda_0/(2F_0g_R/\sqrt G)\ne0\)가 된다. 이 source 대표점 전체에서의 strict Rayleigh inequality와 leading 함수의 실수 존재성은 아직 증명하지 않았다. 같은 root의 local certificate 또는 source 방향 설명을 전체 대표점의 부등식 증명으로 대체하지 않는다.

기존 `actual-stress-direction-bounds.mjs:frozenRatioBound()`에는 이 sign을 얻는 원본 annulus 경로가 있다. 실제 order-zero 대표점에서 `F>R^-10`, `a>R^-10`, `v_s-2>R^-10`와 `c0²=(v_s-2)/2`로 `|c0|>R^-6`, `lambda0>R^-31`, `|g0|>R^-20`를 제시한다. 적용 영역은 `Xa<=X<=Xb`, `eta∈[-1,1]`, `s∈[1/2,2]`다. 이 경로는 S9–S13의 leading F lower bound, C12/inner collar의 실제 shear gap, O §§8–9 및 H19/H22/H25의 outer/heat slope gap, natural/B26/heat의 실제 존재·norm을 상속한다. 이번 검사는 해당 producer의 바이트를 확인하고 이 의존 관계를 보존하며, 모든 상속 전제를 새로 증명하거나 serialized PASS를 그 증명으로 사용하지 않는다. 이 prior source theorem의 모든 전제를 독립 검토하면 위 실제 polynomial inequality를 닫을 수 있다.

## pulse time 전체에서의 실제 frame 및 Volterra 정리

원본 frame에서

\[
 n_t^2=(p/R)^2+(p_z-\epsilon vH_Z)^2\geq(p/R)^2>0,
 \qquad |n|^2=(x_0-vH_R)^2+n_t^2>0.
\]

또한 \(r(v)^2=1+u^2(1/2+v/L_s)^2\geq1\), \(c(v)=c_0r(v)\ne0\)다. 위의 실제 scalar 전제가 성립하면 원본 moving-frame의 모든 pulse-time 분모는 **모든 실수 \(v\)**에서 nonzero다. 고정된 background 값이 유한하면 matrix는 pulse time에 대해 \(C^\infty\)다. 따라서 finite pulse interval 중간의 frame singularity를 따로 가정할 필요가 없다.

임의의 유한 \(|v|\leq L\)에서 연속 matrix \(M\)에는 유한 \(K=\sup\|M(v)\|_\infty\)가 존재한다. 원본 ordered-integral의 \(n\)차 항은 \((KL)^n/n!\)로 지배된다. 지수급수의 국소 균등 수렴과 time differentiation으로 원본 exact limit이 \(w'=Mw\), \(w(0)=e_1\)을 만족한다. 두 해의 차이에 Volterra inequality를 반복하면 모든 \(n\)에 대해 \(C(KL)^n/n!\)로 지배되므로 해가 유일하다. 겹치는 유한 구간의 해는 일치하고, 이로써 **각 admitted source tuple에 대해 모든 실수 pulse time의 유일한 해**를 얻는다.

이 존재성 정리에는 원래 저장한 거대한 `normUpper`가 실제 coefficient 상계임을 인증할 필요가 없다. 그 상계의 인증은 정량적인 uniform norm, tail, source class 추정에 계속 필요할 수 있다. 원본 background/대표점이 admitted scalar 조건을 만족함까지 증명한 것은 아니다.

## 세 slow 방향의 매끄러움

고정 representative/band/carrier와 admitted compact slow neighborhood에서 원본 source field가 \(C^{m+1}\)이면, matrix는 \(C^m\)이다. \(K_m\geq1\)이 모든 total order \(\leq m\) coefficient derivative의 상계이면 \(n\)개의 matrix product에 \(m\)개의 labelled derivative를 배정하는 방법은 \(n^m\)개 이하다. 따라서 differentiated ordered-integral의 상계는

\[
 n^m(K_mL)^n/n!.
\]

\(n\geq1\)에서 연속 항의 비는 \(2^mK_mL/(n+1)\) 이하이므로 모든 \(m\)차 이하 미분급수가 국소 균등 수렴한다. Exact limit은 실제 세 slow 방향에서 \(C^m\)이고, 원본 downward-closed variational system 및 binomial 계수를 만족한다. 이 결론은 실제 source field의 해당 regularity를 여전히 전제로 한다.

Rounded representative/carrier 전체를 매끄럽게 변화시키는 정리는 주장하지 않는다. 원본 `ceiling`은 그 변수에 대해 불연속일 수 있고, 실제 wrapper의 미분 방향도 그 변수를 제외한다. Cover/cutoff를 포함한 전체 global field의 매끄러움은 별도 조건이다.

## Picard system 0

원본 \(A_1\)은 마지막 두 행과 처음 네 열에만 지지된다. 보존된 matrix scalar들을 확인하면 \(A_1A_1=0\)이고, 같은 block mask의 eta derivative에도 이 구조가 유지된다. 원본 singular diagonal은 `[0,0,2,0,3,1]`, zero axis datum은 `[0,0,0,0,0,0]`이다. 첫 coefficient의 divisor \(1+c_i\)는 `[1,1,3,1,4,2]`로 모두 양의 정수다.

그러나 방정식에는 \(A_1\partial_\eta W\)가 실제로 있다. 평범한 6차원 ODE 존재성 정리만으로 이 operator를 인증할 수 없다. 원본 common eta strip에서 A0/A1/forcing의 holomorphic norm, natural/quadratic/background 입력의 존재·정의역, 실제 C1·a·loss 상계 및 nilpotent derivative word를 포함한 source tail 추정, axis even/flat extension을 인증해야 한다. 현재 저장된 tail 설명을 이 실제 전제의 증명으로 승격시키지 않는다.

실행은 `python research-ide/mathscope-m3/n6-continuation-20261014/analytic_mean_run.py --artifacts INPUT_ARTIFACTS --output OUTPUT_DIR`이다. 결과/실패 JSON을 모두 보존한다. 이 단계 이후에도 무조건부 mean 8/8, N6-01, N6-02, completeN6는 false다.
