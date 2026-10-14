# N6 원본 방사형 bump: flat join·정규화·모든 고정 차수 미분

2026-10-14 · PR #30 계승 · Picard PR #31과 분리한 보조정리

## 0. 판정과 범위

이 문서는 **실제 원본 bump와 정규화 적분을 공통 slow-chart에서 해석적으로 증명**한다. 전체 j0 입력의 chart 포함, Picard/Fourier/indexed 함수 전체의 정의·정칙성, 전체 W/M/S 추정, Haar 모멘트, 독립 Cartesian PDE는 증명하지 않는다.

따라서 원본 잔여 수는 Jet 230 / Global Guard 38 / PDE 1,020 / 합계 1,288이다. N6-01 OPEN, N6-02 PARTIAL, M3 56/64를 유지한다. 관련 8개 Guard의 **원시함수 보조정리**를 얻은 것이지, 원래 전역 Guard 8개를 완료한 것이 아니다. 아래 전 차수 결론의 근거는 귀납적 서면 증명이다. 실행된 유한 차수 회귀검사나 SHA 인증을 전 차수 수학 증명 또는 Lean 인증으로 취급하지 않는다.

## 1. 원본 결합

입력은 GitHub Actions run 38523108728의 `n6-finish-prepare`와 run 38529033425의 `n6-final-summary`이다. 원본 producer는 호출하거나 변경하지 않았다.

| 대상 | SHA-256 |
|---|---|
| prepare ZIP | `67bf9f9b170d6422e030493afe614e38801ae3cfd7ec9fbf7f041614d73af963` |
| final-summary ZIP | `9d9a21b6879767f3ae5fe4072a78c41c3a8629454297eac299a26bfbb8d39b33` |
| Cartesian checkpoint 파일 | `ba1fd222b9b50236dcbe8eff144a43ac6d4a5b724f2352fc0f67afad83f34ef2` |
| scalarProgram 정규 직렬화 | `aa2da2a3ee1a12ffd9fc24d471271fc62f6b8723d75813a91eabb68713adc0a8` |
| SQLite prefix | `ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003` |
| final matrix 파일 | `98275fe97be5933ef51a0facb633eaf11b5f1a90b7d6d42735e9e1473e3f825e` |

원본 root는 source node 622820의 `actual_monotone_root(2,Z,T)`이며, Cartesian scalar 114가 이를 가리킨다. 여기의 scalar ID는 원본 SQLite source node ID와 다른 번호 체계다.

- scalar 116: `a(s)=sqrt(2 X0Imean) exp(1/2) sqrt(s)`.
- scalar 129: `beta(10(r/a-1))`, binder scalar 119, 원본 coordinate 633709.
- scalar 242: 같은 bump의 별도 binder scalar 232, 원본 coordinate 3615151.
- scalar 230: `I(s)=integral_L^U a(s)^(-1) beta(10(r/a(s)-1)) dr`.
- scalar 132: `L=sqrt(Xa)`; scalar 229: `U=2 sqrt(Xb)`.
- scalar 227이 실제 `Xb` 식이다. 이를 단순한 이름의 상수로 대체하지 않고, scalar 133–229에 포함된 clock 적분·분모·로그를 모두 결합했다.

정확 parameter AST는 checkpoint의 native definition.source에서 추출했다. 추출 직렬화 해시는 `a5966ffed2627ea4dc686fb46cc8b5603969b22c0b2a8220f67cbc42353349c2`이며 원본 선언 해시 `e44aab5d...`와 별도로 보존한다. 두 직렬화 해시가 같다고 주장하지 않는다. 실제 검증은 잠근 checkpoint 바이트와 측정한 AST 해시를 사용한다.

## 2. Bump의 전역 flatness: 원시변수 t 전체에 대한 증명

`u(t)=t(1-t)`로 놓고

```
beta(t) = exp(-1/u(t))   (0<t<1),
          0             (t<=0 또는 t>=1)
```

로 정의한다. 내부에서 모든 n>=0에 대하여

```
beta^(n)(t) = exp(-1/u(t)) P_n(t) / u(t)^(2n),
P_0=1,
P_(n+1)=u^2 P_n' - 2n u u' P_n + u' P_n.
```

이는 곱·연쇄법칙으로 직접 귀납된다. `deg P_n<=3n`이며 `B_0=1`, `B_(n+1)=(24n+3)B_n`이면 `||P_n||_1<=B_n`이다. 실제로 `||u^2||_1=4`, `||u u'||_1=6`, `||u'||_1=3`, `||P_n'||_1<=3n||P_n||_1`이므로 다음 차수의 계수합은 `(12n+12n+3)B_n` 이하이다.

`y=1/u>=4`에 대해 `y^(2n)exp(-y) <= (2n+1)!/y`이므로 양 끝점에서 모든 내부 도함수는 0으로 수렴한다. 양쪽 영 함수와 매 차수 도함수가 일치하므로 beta는 실수 전체에서 C-infinity이고, 두 끝점에서 모든 jet가 0이다. 또한 `exp(y)>=y^(2n)/(2n)!`를 이용하면

```
sup_R |beta^(n)| <= B_n (2n)!.
```

이 결론은 유한 n 테스트의 외삽이 아니라 위의 모든 n에 대한 귀납이다. 원본 scalar 129, 242가 정확히 이 두 flat join을 사용함을 source 결합 검사가 확인한다. 단, 이 원시변수 정리는 합성인자 `r/a(s)`의 전체 원본 정의역을 대신 증명하지 않는다.

## 3. 원본 clock 식으로부터 실제 고정 적분구간의 포함 증명

원본 exact profile에서 `T=exp(1048576)+10>11`, `lambda=exp(-1000T)`, `h=exp(-8002T)`이므로 `0<h<lambda<1/2`, `h<1/64`이다. `co=1/256`, `BOuter=1000T`, `Tf=128`이다. 또한 `Lambda>1`, `CSelected>1`, `Pstar>1`이므로

```
Xa=4/Lambda <4,
XR=110(CSelected Pstar)^10 >110,
X0=X0Imean=XR exp(T+60 BOuter-6)>110.
```

원본 scalar 202, 218을 각각 A, B라고 쓰면, scalar 157, 223–227의 실제 결합은

```
Xb = XR exp(3+q_plus+log(A/B)/(1-h)),
q_plus=4+T+90 BOuter+13/lambda+Tf-4 log(h).
```

A와 B는 임의 상수가 아니다. 원본 flat logistic step `sigma`는 0<=sigma<=1, 내부에서 sigma'>0, 양 끝 값 0과 1을 가진다. 실제 식에서 A의 다른 적분항은 비음수이고,

```
A >= exp(-(1-h)/2) [-4 log(h)] (1-h) >8002.
```

B의 실제 원본 식은

```
B = co*h/[2(1-co*h)] * integral_1^3
      sigma'((q-1)/2) exp((1-h)q) dq.
```

적분의 내부 integrand가 양수이므로 B>0이다. `integral_1^3 sigma'((q-1)/2)dq=2`, `exp((1-h)q)<=exp(3)<27`, `co*h/(1-co*h)<1/8192`이므로 `B<27/8192<1`이다. 따라서 A/B>1이고 log(A/B)>0이다. 이로부터

```
log(Xb/X0)>13+30 BOuter+13/lambda+Tf-4 log(h)>13,
Xb > exp(13) X0.
```

여기서 sigma는 beta와 서로 다른 원시함수다. 원본 `source_step_derivative`의 flat logistic 정의를 사용하며, 정규화 bump를 sigmoid로 바꾼 것이 아니다.

기존 원본 slow-chart의 공통 collar에서 `1/4<s<3`이다. 그 안에서 `a^2=2 exp(1) X0 s`이므로

```
a_min^2=exp(1) X0/2 >110>Xa,
(11 a_max/10)^2=(363/50) exp(1) X0,
U^2=4 Xb>4 exp(13)X0>8 exp(1)X0.
```

따라서 `L<a(s)<11a(s)/10<U`가 하나의 고정 적분구간 안에서 전 collar에 걸쳐 성립한다. 위 마지막 두 제곱의 차이는 `(37/50)exp(1)X0`보다 크다. 매 미분 차수마다 새 support 구간을 선택할 필요가 없다.

기존 slow-root의 C-infinity collar 증명은 `cartesian/source-chart/analytic-initial-source-domain.json`을 계승한다. 이 문서는 그 collar를 전체 j0 입력에 적용할 수 있다고 가정하지 않는다.

## 4. 정확한 정규화 상수와 분모 하한

`r=a(s)(1+t/10)`으로 치환하면 `dr=a(s)dt/10`이고, support 전체가 L과 U 사이에 있으므로

```
I(s)=C_beta=(1/10) integral_0^1 exp(-1/[t(1-t)]) dt.
```

이는 `s`와 모든 slow 좌표에서 독립인 동일한 양의 상수이다. `1/4<=t<=3/4`에서 `t(1-t)>=3/16`이고 전체 내부에서 `t(1-t)<=1/4`이므로

```
(1/20)exp(-16/3) <= C_beta <= (1/10)exp(-4),
1/14580 < C_beta <1/160,
C_beta^(-1)<14580.
```

두 유리수 경계는 `2<exp(1)<3`만 사용한 보수적 경계다. 정규화 적분의 모든 양의 차수 slow 미분은 정확히 0이다. 독립적인 compact support의 C-infinity integrand와 endpoint 분리 여유가 있으므로, 매 고정 차수에서 미분을 적분 안으로 옮기는 근거도 갖는다. 원본 P/J나 complete_gr를 곱한 integrand 전체의 정칙성은 이 정리만으로 나오지 않는다.

## 5. 방사형·log-scale 혼합미분의 명시적 전 차수 상계

`K_a(r)=a^(-1) beta(k(r/a-1))`, `k=10`, `q=log(a)`, `y=r/a`라 쓰면

```
partial_q^m partial_r^n K_a
 = a^(-n-1) k^n sum_(j=0)^m c_(m,j) y^j beta^(n+j)(k(y-1)),
c_(0,0)=1,
c_(m+1,j)=-(n+1+j)c_(m,j)-k*c_(m,j-1).
```

이는 `partial_q y=-y`에서 모든 m,n에 대한 귀납으로 성립한다. support에서는 `1<=y<=11/10`이므로 a>=a_min>0인 동일 구간에서

```
|partial_q^m partial_r^n K_a|
 <= a_min^(-n-1) 10^n sum_j
    |c_(m,j)|(11/10)^j B_(n+j)(2n+2j)!.
```

정규화 kernel `K_a/C_beta`에는 우변에 14580을 곱하면 된다. 실제 s(Z,T)의 미분을 합성할 때는 기존 공통 collar의 implicit derivative 상계가 추가로 들어간다. 전체 원본 W/M/S 상계를 얻었다고 해석하지 않는다.

## 6. 정의역을 제거하면 생기는 정확한 실패와 경계식

일반적인 `0<L<U`, `a>0`에서 support는 `[a,11a/10]`이다. 따라서

```
I(a)>0  iff  a<U and 11a/10>L,
I(a)=C_beta if L<=a and 11a/10<=U,
I(a)=0 if a>=U or 11a/10<=L.
```

특히 a=2U로 놓으면 적분은 정확히 0이다. 이것은 원본 허용영역의 반례라고 주장하는 것이 아니다. 단지 **arbitrary positive scale에서 원본 유한구간 정규화가 항상 비영이라는 과도한 일반화가 틀림**을 보인다. 전역 적용을 위해서는 실제 s의 영역을 연결해야 한다.

s로 쓰면 양의 질량 조건은

```
50Xa/(121 exp(1)X0) < s < 2Xb/(exp(1)X0),
```

완전 지지집합 포함에 충분하고 필요한 plateau 조건은

```
Xa/(2 exp(1)X0) <= s <= 200Xb/(121 exp(1)X0).
```

정규화가 full constant라는 증명은 이 plateau 또는 검증된 source collar에서만 사용한다.

## 7. 원본 장부에 대한 적용과 남은 일

관련된 원본 Guard 번호는 025(분모), 038/068/076/084/092(동일 질량 적분의 미분), 040/041(두 flat join)이다. 실제 ID·binder·끝점·전체 scalar graph 해시를 결과 JSON에 남겼다.

아직 없는 것은 전체 원본 j0의 모든 band/label/copy에서 slow 인자가 위 영역에 들어간다는 검증이다. 현재 결과에는 이를 false로 기록하고 **8개 모두 원본 전역 상태 OPEN을 유지**한다. 새로운 정의역 가정을 원래 기준에 끼워 넣거나 기존 1,288개 중 일부를 삭제하지 않았다.

1020개 PDE 항은 원래 169/197/654개 장부를 그대로 유지한다. 이 bump 항등식은 이후 source body 전개에서 사용할 수 있지만, 그것만으로 남은 opaque P/J·indexed/Fourier/Picard 원자들을 0으로 둘 수는 없다.

## 8. 실행과 재현

Python 표준 라이브러리로 실제 source audit를 실행한다. 독립 유한 다항식 비교 테스트에는 SymPy가 필요하다.

```sh
python n6_bump_bridge.py --prepared /path/to/prepared \
  --frontier /path/to/OBLIGATION_MATRIX.json --out ./evidence
N6_PREPARED=/path/to/prepared N6_FRONTIER=/path/to/OBLIGATION_MATRIX.json \
  python -m unittest -v test_n6_bump_bridge
```

실행 관측: 27개 unittest PASS. 원본 입력 변조·가짜 완료 판정에 대한 11개 거부 테스트가 포함된다. 별도로 12개 연속 도함수 재귀식의 독립 CAS 비교, 32차까지 계수합 부등식 회귀, 방사형/log-scale 미분 연산자의 72개 다항식 비교, 정확한 치환/Jacobian 및 support 경계 테스트를 수행했다.

이것은 현재 assistant 계산 환경에서의 실제 실행이다. 이 기록만으로 GitHub Actions 실행 성공을 주장하지 않는다. 원본 큰 체크포인트는 기존 run의 아티팩트를 사용하며 이 폴더에 중복 추가하지 않는다.
