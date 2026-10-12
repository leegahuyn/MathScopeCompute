# 실제 terminal F의 첫 수치 jet: 독립 검토에서 발견한 slow 정규화 누락

## 검토 결과

첫 `actual-terminal-field-scaled-enclosure` source 실행은 8/8 software 검사 PASS, process exit 0이었지만, **실제 slow F의 도함수라는 수학적 결론은 이 독립 검토에서 거절했다.** 값이 같아지는 한 점에서 profile 함수와 slow 함수를 혼동한 것이 원인이다. 이 기록은 실패한 소스 실행으로 바꾸거나 설계된 음성대조라고 다시 부르지 않는다. 실행은 통과했고 그 뒤의 독립 수학 검토가 오류를 발견했다.

- 당시 certificate: `source-attempt-1-certificate.json`, SHA256 `556bdf48b501a483cc68c9483da9a300ccf6a735342e9d582db44d8052d10bfb`.
- 당시 process: `source-attempt-1-process.json`, SHA256 `0ff641e6b12655846d4f4a1e33d2a1517cc78248b5d4793fe2836c07ffb6c3f4`.
- 당시 TAP: `source-attempt-1.tap`, SHA256 `8fbbf0c80020ba97ca6e0af0c1731e06ad66b17053a3802a02a9668f22ed0ab1`.
- 실제 관측: process 18.485134368초, peak RSS 1,423,507,456 bytes, exit 0.
- 당시 graph SHA256: `cf6eb27a75bc9105a1d92bbbcc1a5542a3d127a0559a340b7ce8c10ff5402fcf`.

검토자는 새 heavy source를 실행하지 않았다. 실제 원래 operator의 body, 새 audit 식, source receipt 및 정확한 chart를 읽고 미분했다. 기존 전체 heat 수치 enclosure의 오류를 발견한 것은 아니다.

## 원래 source의 서로 다른 두 함수

원래 `actual-covariance-source-operator.mjs`는

\[
F_{\rm slow}(R,Z,T)=s^{-A-1/2}F_0(X,\eta),\qquad
A=\tfrac12+h,\quad X=R^2/(2s)
\]

를 field body로 만든다. terminal 구간에서

\[
F_0(X,\eta)=B(X)f(y)H(z),\quad
B(X)=C_{\rm tail}X^b,\quad b=-1-h,
\]

\[
y=\log(X/X_{\rm tail}),\qquad
z=2(1-\eta^2)/X=4T/R^2.
\]

따라서 실제 slow 식은

\[
F_{\rm slow}=B_r f(y)H(z),\qquad
B_r=C_{\rm tail}(R^2/2)^b,
\quad y=\log\frac{R^2}{2sX_{\rm tail}}.
\]

이는 양의 실수에 대한 정확한 지수 항등식 \(s^bX^b=(R^2/2)^b\)이다. 첫 구현은 \(B(X)f(y)H(z)\)를 미분했고 앞의 \(s^b\)를 누락했다. 표시 점 \(s=T=1,Z=0\)에서는 두 함수의 값과 R 방향 도함수가 같으므로 그 점의 값 비교만으로는 누락을 발견할 수 없다.

## 올바른 실제 slow 도함수

다음 \(U,V\)는 첫 코드의 기호를 그대로 쓴다.

\[
U=(bf+f_y)H-fzH',
\]

\[
V=(b^2f+2bf_y+f_{yy})H
+((1-2b)f-2f_y)zH'+fz^2H''.
\]

\(Z=0\)에서는 정확히 \(s=T\)이다. 표시 점에서 \(B=B_r=B(X)>0\)라 쓰면

\[
F_R=2BU/R,\qquad F_{RR}=B(4V-2U)/R^2,
\]

\[
F_T=\frac B T(bfH-U),\qquad
F_{RT}=\frac{2B}{RT}(bU-V),
\]

\[
F_{TT}=\frac B{T^2}\bigl[V+(1-2b)U+b(b-1)fH\bigr].
\]

원래 implicit chart \(s-Z^2s^{2h}-T=0\)는 표시 점에서 \(s_Z=0,s_{ZZ}=2\)를 준다. \(B_r,z\)는 Z에 의존하지 않으므로

\[
F_Z=F_{RZ}=F_{ZT}=0,\qquad
\boxed{F_{ZZ}=-2Bf_yH<0.}
\]

첫 구현의 \(-2B(bf+f_y)H>0\)는 빠진 정규화 인자를 포함하지 않은 profile pullback의 곡률이었다.

## 작은 h를 0으로 만들지 않는 부호 분리

\[
a=\sigma(1/8)/256,\quad d=\sigma'(1/8)/512>0,
\quad c=-\sigma''(1/8)/1024<0,
\]

\[
f=1-ha,\quad f_y=hd,\quad f_{yy}=hc,\quad
H'=-hD_1,\quad H''=h(1+h)D_2.
\]

위 식에서 h를 정확히 먼저 분리하면

\[
\frac{F_T}{Bh/T}=-dH-fzD_1<0,
\]

\[
\frac{F_{RT}}{2Bh/(RT)}
=((1+h)d-c)H+((2+h)f-2hd)zD_1-f(1+h)z^2D_2,
\]

\[
\frac{F_{TT}}{Bh/T^2}
=(d+c)H+2hdzD_1+f(1+h)z^2D_2,
\qquad
\frac{F_{ZZ}}{Bh}=-2dH<0.
\]

실제 step 구간값에서 \(|c|\)가 d보다 충분히 크고 z가 작으므로 수정된 구간 검사는 RT의 양성 및 TT의 음성을 분리할 수 있다. 이 문서는 아직 수정 source의 새 실행 PASS를 기록하지 않는다. 그런 실행은 새 receipt와 별도의 최종 검토로 남겨야 한다.

## 수정 검증에 필요한 결속

수정 모듈은 원래 operator F share를 materialize하여 `s^(-A-1/2)`와 profile F body를 모두 보존해야 한다. terminal profile 환원만 맞는 것을 slow field의 동일성으로 승격하지 않는다. generic chain audit도 같은 양의 s 인자를 포함하여 미분해야 한다. 빠진 s 인자와 잘못된 ZZ 부호는 독립적인 회귀 대조로 검사할 수 있다.

당시 실행기의 SHA 및 모든 원래 import SHA는 첫 process JSON에 보존한다. 수정한 실행기의 SHA로 그 기록을 덮어쓰지 않는다. 전체 H, pulse, weight 수치 enclosure, 전역 F, 물리 잔차, G-NUM 완료, Lean 및 M3에 관한 결론은 이 조각에서 얻을 수 없다.
