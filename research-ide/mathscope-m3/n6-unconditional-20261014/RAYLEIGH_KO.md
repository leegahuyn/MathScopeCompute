# 원본 전체 대표점 Rayleigh 후속 독립 검사

판정은 **전역 실제 적용 OPEN**이다. 이번 실행은 실제 원본 노드의 연결,
보편 정확 다항식 항등식, 유한 양의 하한 보조정리를 독립 확인했다.
원본 전체 profile의 존재성·매끄러움과 전역 shear 하한을 저장된 PASS로
대신하지 않았다. N6-01/N6-02 또는 M3 56/64 상태를 바꾸지 않는다.

## 1. 원본 노드와 Cartesian 이전 slow chart의 정확 연결

SHA로 인증된 기존 첫 cloud source DAG에서 다음을 다시 읽는다.

| 실제 의미 | 원본 source node / registry |
| --- | --- |
| frozen F0 | 622971, expression 692 |
| gR=Rrep·F_R | 622992=622954·622981 |
| gZ=G_R | 622991, expression 693의 R derivative |
| 원본 slow inverse | 622820, monotone registry 2 |
| X=R²/(2s), eta=Z/s^D | 622824, 622829 |
| 원본 최종 radial F, U | expression 2 body 71959, expression 3 body 9236 |
| λ0²의 실제 sqrt 입력, c0 | 623005, 623008 |

원본 leading shared function은
`Fslow=s^(-A-1/2) Fprofile(X,eta)`와
`Gslow=s^(-A) Uprofile(X,eta)`다. 원본 implicit equation의 변수는
Z,T뿐이다. 따라서 R 미분 시 `s_R=eta_R=0`, `R X_R=2X`이다.
`E=sqrt(2X) Fprofile`, `a=1-2X E_X/E`, `b=2X U_X/E`로 두면

\[
g_R=R F_R=-aF_0,\qquad g_Z=G_R=bF_0.
\]

이는 실제 body를 한 번 미분하여 얻는 공식이다. 임의 atom 치환이 아니다.
단, 식 자체의 해석적 적용에는 실제 profile의 C1 존재성과 E≠0,
원본 대표점이 지정된 chart image에 속한다는 전제가 필요하다.
이번 source 검사는 그 전제를 자동 증명하지 않는다.

특히 gZ는 `G_R`다. `F_Z`나 `G_Z`로 바꾸면 원본 성장률과 다른
검사가 된다. 실제 chart의 R과 거대한 envelope R은 각각
`Rchart`, `Renv`로 구별한다.

## 2. 보편 정확 다항식 보조정리

독립 희소 다항식 계산기는 유리수 계수환 Q[F,a,b]에서 원본을 전개하고,
다른 곱셈 경로의 인수분해와 비교한다. 전개 잔여항은 정확히 0이다.

\[
\begin{aligned}
P&=-2F_0g_R(g_R^2+g_Z^2+2F_0g_R)\\
 &=2aF_0^4(a^2+b^2-2a)
 =2a^2F_0^4(v_s-2),\quad v_s=a+b^2/a.
\end{aligned}
\]

마지막 등식은 a≠0에서만 사용한다. 따라서 전체 원하는 도메인에서
`F0≥f>0`, `a≥α>0`, `v_s-2≥γ>0`이면

\[
P\ge2\alpha^2f^4\gamma>0.
\]

이 유한 lower-bound lemma는 독립 증명했다. 실제 전역 lower bound를
입력으로 얻었다는 주장과는 별개의 결론이다. 예를 들어 정확 유리수
`f=1/3, α=1/5, γ=1/7`이면 하한은 `2/14175`이다.
이 숫자는 실제 source profile의 수치 enclosure가 아니다.

원본 `frozenRatioBound`의 전제를 실제 전체 도메인에서 증명한다면
그 동일 source polynomial에는 `P>2 Renv^-70`이 따른다. 거대한
`Renv=exp(CSelected^25600000)`를 float로 평가하거나 0/∞로 바꾸지 않는다.
같은 전제와 `|a|,|b|<Renv³`로
`|g0|>Renv^-20`, `|Ntheta|>Renv^-14`, `|c0|>Renv^-6`,
`lambda0>Renv^-31`도 유한 정확 power ledger에서 확인했다.

원본 성장률까지 식을 연결했다. `G=gR²+gZ²`라 두면 authenticated
node623005의 실제 sqrt 입력은 `P/G`, node623002의 실제 분모는
`2F0gR/sqrt(G)`다. P>0은 F0gR≠0, G>0을 함의하므로 sqrt 입력은
양수이고 분모는 비영이다. 따라서 실제 `c0²=P/(4F0²gR²)=(v_s-2)/2`
이다. 전역 P>0 전제를 이번 코드가 증명했다는 뜻은 아니다.

원본 explicit parameter 식에 대해서는 별도로 실제 무조건부 결과를
얻었다. Md=1048576, T=exp(Md)+10, h=exp(-8002T), sigmaStar=h⁴/2000,
Q=2²⁶⁰K/sigmaStar², CSelected와 S 및 Renv의 원래 식을 byte 인증 후
직접 확인했다. 지수함수의 양의 급수에서 `exp(x)>x` (x>0)가 따르므로
모든 값은 유한하고, `0<h<1/100`, `Q>2²⁶⁰`, `Renv>2²⁶⁰>8192`,
`N=1+ceil(Renv⁵⁰)>Renv⁵⁰`다. 이는 실제 parameter hierarchy의 증명이며,
Renv가 실제 field 전체 노름을 지배한다는 증명은 아니다.

원래 C12의 네 raw cone gap에 대한 유한 보조정리도 독립 검산했다.
`Psi=(a,v-2,c-v,2(c-v)²-(v-2)j²)`, `v=a+b²/a`,
`c=p-bq/a`, `j=q+bp/a`로 둔다. `B=2Renv`, a⁻¹≤B,
|a|,|b|,|p|,|q|≤B인 전체 convex box에서 직접 미분하면
`||Dv||1,||Dc||1,||Dj||1≤4B⁴`이며,
네 번째 gap에는 `||D Psi4||1≤128B⁷+80B¹⁰≤256B¹⁰<Renv¹²`가 따른다.
계수와 power 비교는 정확 유리수/정수 연산으로 검사한다.
원본 비교 tuple의 각 gap≥1/Renv이고 각 좌표 perturbation≤Renv³⁴/N이면
N≥Renv⁵⁰에서 error≤Renv⁻¹⁶이고 line segment는 양의 a box 안에 남는다.
따라서 모든 최종 gap≥Renv⁻¹-Renv⁻⁴>1/(2Renv)>Renv⁻¹⁰다.
이 증명은 모든 phase와 partial repair point에 전제가 성립할 경우
전역으로 적용된다. 실제 source perturbation norm을 이번에 얻었다고
주장하지 않는다.

## 2a. 실제 열 primitive의 독립 실수-domain 증명과 holomorphic 경계

실제 source node71517은 compactified Γ(1+h), node71925는
`Z=2(1-eta²)/X`, node71947/71948은 정규화된 `1-H(Z)`다.
두 적분의 body와 Jacobian까지 정확 노드 형태를 인증했다.
`t=u/(1-u)`를 원래 improper integral에 적용하면

\[
H_h(Z)=\Gamma(1+h)^{-1}\int_0^\infty e^{-t}t^h(1+Zt)^{-h}\,dt.
\]

실제 h의 `0<h<1/100`은 위 parameter 증명에서 얻었다.
전체 physical domain X>0, |eta|≤1에서 Z≥0다. Γ 적분은 유한·양수이며
양의 integrand를 비교하면 `0<H_h(Z)≤1`이다. 모든 고정 정수 m≥0에

\[
|H_h^{(m)}(Z)|\le(h)_m(1+h)_m
\]

가 전체 Z≥0에서 성립한다. 여기 (x)_m은 rising factorial이다.
이는 m차 미분 integrand를 `e^-t t^(h+m)`로 지배하고 gamma의
integration-by-parts recurrence를 쓰는 증명이다. 따라서 모든 고정
미분과 Z=0의 오른쪽 극한을 dominated convergence로 정당화한다.
eta의 원래 닫힌 physical interval에서도 모든 고정 미분의 한쪽
endpoint smoothness를 얻는다. 실제 열 primitive의 존재성·양수성·실수
미분은 저장된 PASS나 quadrature 없이 증명했지만, 최종 profile 전체와
join 및 shear 하한은 아직 증명하지 않았다.

볼록성으로 `H≥1-hZ(1+h)`, `|H'|≤h(1+h)`다. X≥4이면 deficit은
정확히 `101/20000` 이하이므로 `H>1/2`,
`0≤-ZH'/H<6h/X`를 얻는다. H25에서 필요한 열 radial slope 성분을
독립 공급한다. cutoff slope와 최종 field 동치·지원구간은 별도 의무다.

동시에 실제 열 함수의 **전역 holomorphic eta strip에는 장애가 있다**.
정확 endpoint 미분은
`H_h^(m)(0)=(-1)^m(h)_m(1+h)_m`이고, Taylor 절대계수 비는
`(h+m)(1+h+m)/(m+1)>m`이다. 따라서 고정 h>0의 Z=0 Taylor 반경은 0이다.
`Z(eta)=2(1-eta²)/X`는 eta=±1에서 derivative=-4eta/X≠0이므로,
열 H를 eta endpoint 주변 holomorphic 함수로 확장하면 analytic inverse로
Z=0의 holomorphic 확장이 따라 모순이다.

이 결과는 전체 열 ingredient의 eta endpoint에 관한 명제다.
열 수정이 없는 별도 inner radial collar에서 Picard coefficient에 공통
holomorphic strip이 있다는 주장은 이 결과로 반증되지 않는다.
열 함수의 한쪽 실수 C∞ 미분은 유지된다. 이 구별 없이 전체 source의
holomorphic strip을 가정하면 인증에서 잘못된 전제가 된다.

## 3. 독립 negative controls

- F=1,a=1,b=0은 a>0이어도 P=-2이므로 strict Rayleigh가 실패한다.
- F=1,a=2,b=0은 P=0이며 strict 경계를 통과시키지 않는다.
- F=0은 양의 shear와 무관하게 P=0이다.
- gR의 부호를 잘못 뒤집으면 P<0인 control이 나온다.
- F=1,a=4/5,b=1은 P=8/125>0이다. a>2를 필요조건으로 요구하면
  원본 loop가 허용하는 유효 shear를 잘못 배제한다.
- f,α,γ 중 0 또는 음수인 입력과 변경된 archive/PASS-only 입력은 거부한다.

이 control들은 실제 profile의 반례라고 표시하지 않는다. 현재 실제
profile의 strict Rayleigh를 반증하는 점은 발견하지 않았다.

## 4. 실제 source closure와 전역 미해결 경계

현재 root 622971/622991/622992를 원본 registries까지 확장하면 6,576개
source node가 연결된다. 452개 정확 적분, 155개 smooth-piecewise,
139개 natural-series 요청, 13개 quadratic-root 요청과 5개 monotone-root
요청을 보존한다. 알 수 없는 operator grammar는 0개다. 이는
operator의 해석적 존재성·양수성·전역 하한이 증명됐다는 뜻은 아니다.
모든 실제 natural/quad/monotone node ID와 expanded definition은
`rayleigh-result.json`에 저장한다. 주요 연결은 다음과 같다.

- 자연급수 4483을 포함한 139개 실제 요청의 원래 input class와 균등 미분.
- B8 root 5025–5029, I1 9169–9173, I2 71717–71719의 실제 rhs 전역 상계.
- C1 variance/inverse-circle roots 7456/7945/8490/8632의 실제 branch,
  양의 derivative bounds와 전체 X,eta,phase 도메인 존재성.
- 원본 slow inverse 622820과 실제 cover representative 622807–622809의
  전체 label/copy membership. parametric 선언만으로 selector 범위를 증명하지 않는다.

전역 적용을 위해 최소 다음 다섯 obligation을 남긴다.

1. `Fprofile71959`, `Uprofile9236`의 전체 annulus C1 존재성과 실제 join.
2. 모든 실제 대표점의 `Xa≤X≤Xb`, `|eta|≤1`, `1/2≤s≤2` membership.
3. 최종 전체 source의 `F0>Renv^-10`: S9–S13, C12 reciprocal envelope,
   S4와 I1/I2/heat 수정의 실제 일치가 필요하다.
4. 최종 `a>Renv^-10`: B29/A10, C12 raw gaps, O §§8–9,
   H19/H22/H25의 동일-source 적용이 필요하다.
5. 최종 `v_s-2>Renv^-10`: B29/A9 inner collar와 원본 C12 모든 phase,
   모든 partial I1 repair integral, O/H 구간을 공통 도메인으로 덮어야 한다.

`C12_FREQUENCY_CONTRACT.md`의 §1은 실제 whole-profile envelope와 네 raw
gap을 요구하는 정량적 implication이라고 명시한다.
`GLOBAL_STRESS_ASSEMBLY_EN.md`도 모든 같은-source input을 연결할 때까지
implication이라고 명시한다. `global-source-envelope-certificate.json`의
PROVED 문자열, `source-profile-data.mjs`의 accepted flags 또는 대표점
샘플은 이번 독립 실행에서 전제의 증거로 사용하지 않는다.

## 5. 실행과 판정 보존

`rayleigh.py --artifacts DIRECTORY --output OUTPUT_DIR`는 기존 header/database
SHA, producer capture SHA 및 관련 actual producer bytes를 검증한다.
수학 보조정리, 실제 source binding, 조건부 power margin과 아직 OPEN인
전역 적용을 별도 필드로 출력한다. 원본 producer와 progress bytes는
수정하지 않는다. 실행 성공 및 unit control 통과는 N6 인증이 아니다.
