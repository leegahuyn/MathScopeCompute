# 실제 enlarged annulus의 선도장 C²

`actual-leading-enlarged-c2.mjs`는 동일 N3의 `F0=E0/sqrt(2X)`에 대해
`[Xa/2,2Xb] × [-1,1]`에서 ordinary physical `X,eta` total order 2까지의
상계를 만든다. 임의 차수 `F0active` 영역을 전역으로 재명명하지 않는다.

1. `[Xa/2,Xplus]`에서는 동결한 `actualLeadingAllOrderJets`의 실제
   `F0active` ordinary bound를 내부 호출한다.
2. `[Xa,Xb]`에서는 동결한 `actualStressDirectionBounds`의 실제 full
   leading field `R^70` log-X/eta total2 bound를 사용한다. 원래 finite
   `N`의 두 번째 radial derivative, I1/I2 및 heat 편집이 포함된다.
3. `[Xb,2Xb]`에서는 실제 terminal 식을 직접 사용한다.

\[
F_0=A_{ext}X^{-1-h}H(2(1-\eta^2)/X),\qquad
H(z)=\Gamma(1+h)^{-1}\int_0^\infty e^{-t}t^h(1+zt)^{-h}dt.
\]

`Aext` 자체가 작다고 주장하지 않는다. 실제 power prefactor는

\[
A_{ext}X^{-1-h}
=\frac{E_{tail}}{\sqrt{2X}(1-\rho)}(X/X_{tail})^{-A}<2C^2,
\]

왜냐하면 원래 `Etail<=Pstar<C`, `X>=Xb>=Xtail>1`, `rho<1/2`이기
때문이다. `0<h<1`에서 Gamma 미분 상계는 `H<=1`, `|H'|<=2`,
`|H''|<=12`이다. `y=log X`라 쓰면 Z의 value/y/eta/yy/yeta/etaeta
상계는 각각 `2,2,4,2,4,4`이다. 모든 product/chain 항을 합한 H의
상계는 `1,4,8,52,104,200`이고 `X^(-1-h)`의 미분도 곱하면
`1,6,8,72,120,200`이다. 따라서 실제 power height를 곱한 모든
log-X/eta total2 jet는 `4096 C^2` 안에 든다. eta 끝점은 양의 Gamma
적분으로 얻은 연속 one-sided derivative이다.

`dX=X^-1 Dy`, `dX²=X^-2(Dy²-Dy)`의 모든 항을 유지한다. 앞의 두
log-radius 상계에는 `8(1+Xa^-1)^2`를 곱한다. 이미 physical 상계인 첫
영역은 재환산하지 않는다. 세 bound의 합은 모든 영역에서 유효하다.
원래 smooth join의 미분은 일치하고 coverage에 빈 구간이 없다.

원문은 `HEAT_COMPENSATION_PROOF_EN.md` H5-H7 및
`actual-continuation-exact-heat.mjs`의 실제 terminal exterior 정의,
`ACTUAL_STRESS_DIRECTION_KO.md`의 중간 영역 field bound이다. 원래
parameter SHA와 모든 actual field identity를 실행 시 확인한다.
독립 읽기 검토는 `blueprint_review`가 실제 power normalization,
Gamma/chain 계수, physical-X 변환, coverage와 끝점 범위를 재계산했다.

이 결과가 완료하는 것은 **선도장의 enlarged C²**다. 양의 차수 배경,
실제 일반 label의 ODE/H 적분, 양의 inverse, 공통 q*, (7.30)은 여기서
완료했다고 표시하지 않는다. 반환값의 해당 flag는 false다.
