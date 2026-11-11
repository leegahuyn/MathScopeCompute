# 원본 중심 영역의 Stokes gauge와 최종장 jet 식

원고 77·78·90·104·114–118쪽에서 파동·평균 보정의 annular 지지와 Proposition 9.9의 (9.21)을 결속했다. \(\tau>0,\ q<q_\star,\ 0\le X=r^2/(2q)<X_a\)에서 모든 annular 보정이 사라진다. (10.1)의 고정된 배경 포텐셜은 \(A=(-ya,xa,0)\)이며 \(s=x^2+y^2\)이다. 실제 축을 포함한다. 원고에 적힌 배경 가중치는 \(\chi(c_nq)\)이며 공통 소스 실현에서 커진 \(b_n\)을 택한 경우에도 같은 Stokes 공식이 적용된다. 각 경우에서 실제 사용한 cutoff가 합에 남는다.

\[
a_n(s,z,\tau)=\frac{q^{-A+2nh}}2\int_0^1U_n(vX,\eta)\,dv.
\]

평활한 \(U_n\)의 축 도함수는 적분의 \(v^j\) 가중치를 통해 \(1/(j+1)\)을 얻는다. 이는 \(s=0\)에서 \(S/s\)를 직접 나누는 절차를 없앤다. \(\partial_x=2x\partial_s\), \(\partial_y=2y\partial_s\)에 곱미분을 적용해 원본 요청 순서의 67개 식을 생성했다. 독립적인 3차 Taylor 다항식 미분으로 Stokes 입력을 검사했다. \(A_z\)와 그 요청 도함수 19개는 이 영역에서 정확히 0이다. \(b=B/r\)의 입력은 원본대로 \((s,z,\tau)\), 압력의 입력은 \((x,y,z,\tau)\)이다. (10.4)의 \(C\) jet 13개는 별도 원본 연산자 입력이다.

나머지 식에 필요한 \(a,b,p_{\rm loc}\)의 스칼라 도함수 목록은 재현 JSON에 있다. 이 식들은 전역 구간 수치와 전체 \(K\)의 압력·외력 적분에 필요한 입력이다. annular 및 cutoff 전환 구간과 전체 \(K\)의 최종장 67개 수치 구간은 OPEN이다.

```text
python check_inner_gauge_atoms.py --paper <original-166-page.pdf> --localization-source <original-localization-tree>
```

