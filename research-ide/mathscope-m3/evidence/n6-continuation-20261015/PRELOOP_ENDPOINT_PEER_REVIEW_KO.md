# 실제 pre-C12 S 경계와 끝점 collar 독립 검토

원래 source의 Ns, source.ns=Ns/L, p2=X Ns/(L E)를 각각 구분하여 검토했다. 원래 다섯 actual cumulative moment를 사용한 C^180 경계와 Ns<C^190에서 p2<2C^218<C^220가 따른다. bs<C^34, a^-1<C^122에서 vs<C^192이고, 모두 원래 S=C^100000보다 작다. 새로 고른 S나 reference moment를 대입할 필요가 없다.

검토 중 두 가지 엄밀한 중간식 수정이 필요했다. outer의 E는 처음부터 Pstar 이하인 것이 아니라 초기 로그 증가가 1/10 이하이고 이후 감소하므로 E<2Pstar<C^2다. 또한 L^-1<2를 포함하면 정확한 C^218 경계 대신 C^220를 써야 한다. 현재 source-envelope 문서와 검증기는 두 수정을 반영했다.

B.8의 초기 오차는 실제 measure를 dX로 환산한 뒤 중심 J와 S에서 c 항을 정확히 제거하면 제시한 경계에 들어간다. 원래 양수 mu=h^2를 그대로 사용한 scaled debt는 10^-8보다 작다. 38718702510 실행의 새로운 연속 적분 구간행렬과 실제 preconditioner를 분수 구간 연산으로 다시 곱해 image와 contraction 경계를 재검증했다. disjoint bump support는 교차항을 정확히 없애며, 유한 반복값을 극한근으로 대신하지 않는다. B.8 E/a 양성의 sigma'' 경계와 원래 h^2의 크기도 충분하다.

preloop의 eta 1차 예산을 별도로 추적했다. 실제 natural/B.22에서 eta 2차까지, B.26의 source quotient 미분, B.34 끝값, actual B.8 root의 암시 미분, 최종 cumulative moment 미분을 차례로 사용하면 제시한 C 지수 안에 들어간다. Q^5000<C가 큰 여유를 제공하지만 실제 quotient의 역수 비용을 생략하지 않았다. 이 계산은 반경의 좁은 cutoff 폭을 eta 미분으로 잘못 끌어오지 않는다.

왼쪽 끝점 collar의 chi 분할도 I=[-33/32,33/32] 전체에서 성립한다. chi>=3/4에서는 Bessel 교대급수의 P4 상계가 a_n-2>1/64를 준다. chi<3/4에서는 eta가 (-6j,-j/5)에 놓이고 실제 음수 압력 및 그 eta 미분 부호가 Zstar>Kj/2를 준다. 이 경우 bs_n의 하계가 더 강하다. 실제 B.26은 kappa와 E_B/E_n을 포함한 비교식으로 vs_B>2+1/128를 유지한다. 오른쪽은 원래 power E와 실제 zero axial tail에서 vs=2+2lambda다. 두 구간의 정확한 zero loop primitive 결론은 새 native endpoint probe가 이 branch들을 원본 등록부에 결합한 뒤 적용해야 한다.

endpoint 검증기의 epsilon<j/16 설명에는 Q를 그대로 남겨야 한다. Q>=2^260만으로 j>2^-130를 결론낼 수 없다. 올바른 증명은 Q j^2>1에서 epsilon/j<(1/2)Q^(-111/2)<1/16이다. 이 비율을 독립 검증기에 포함했고 담당자에게 전달했다.

현재 검토한 38718702510의 loop native 영수증은 강화된 endpoint branch 검사 이전 것이다. 따라서 이 검토는 collar 해석 증명을 승인하지만 새 source 결합 실행을 선취하지 않는다. 전체 g21의 압력 J 및 후속 chart 정칙성, 원본 Guard/Jet/PDE의 새 소거 수는 이 문서에서 변경하지 않는다. 독립 실행의 입력 해시와 정확한 결과는 preloop_endpoint_peer_review.json에 기록했다.

후속 ACTUAL_C1_C12_REGULARITY_COMPOSITION_KO.md와 소비 검증기도 검토했다. 실제 preloop의 공통 열린 근방에서의 C∞와 엄격한 S·collar 경계는 원래 두 native 역함수 정리의 가정을 충족한다. 정확한 zero collar에서의 0 연장과 모든 실수 phase의 lift를 합성하면 원래 유한 N의 C.12가 C∞이고 Enew>0이다. 변경하지 않은 loop 파일 50–51행의 식 E+E(exp(Aphysical/N)-1), U+Bphysical/N도 문서와 독립적으로 대조했다. 뒤의 shear/cone, 작은 보정근과 최종 g는 이 결론에서 제외된 것이 맞다. 이 합성의 새 cloud 실행은 여기서 선취하지 않는다.
