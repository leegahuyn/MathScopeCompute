# N6 Stage 3 — 원본 slow 평가 인자의 공통 정의역 전파

2026-10-15 KST · PR #30의 bump 보조정리(819549c) 계승, PR #31 Picard 작업과 분리.

## 인증 원본
GitHub Actions 38523108728의 `cartesian-source-checkpoint.json` SHA256 `ba1fd222b9b50236dcbe8eff144a43ac6d4a5b724f2352fc0f67afad83f34ef2`, `source-dag-checkpoint.sqlite` SHA256 `ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003`; run 38529033425의 `OBLIGATION_MATRIX.json` SHA256 `98275fe97be5933ef51a0facb633eaf11b5f1a90b7d6d42735e9e1473e3f825e`, `actual-structural-obstructions.json` SHA256 `18c98a280e9dbb355fe10eaecdb5997acd3bd3c99698426f2b825bb3d1a34541`. 원본 parent hash `7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f`. 이 입력으로 독립 source-bound 감사 스크립트 및 음성 대조를 실제 계산 환경에서 실행해 20/20 테스트 PASS. 이번 변경의 GitHub Actions 성공이나 Lean 인증을 주장하지 않는다.

## 구체적 진전: 2,349 source-binding 행 → 정확한 4개 입력족
인증된 Cartesian checkpoint의 196개 definitionBindings 전체에서 local slow `(Z,T)` 인자를 대조했다.

| Z source ID | T source ID | 행 수 | 원본 입력 형태 |
|---|---|---:|---|
| 622803 | 622804 | 486 | (Z,T) |
| 632193 | 632194 | 621 | (c1^D Z,c1 T) |
| 632227 | 632228 | 621 | (c2^D Z,c2 T) |
| 632262 | 632263 | 621 | (c3^D Z,c3 T) |

여기서 `D=1/2-h`이고 c1,c2,c3는 원본 source node 632187,632221,632256의 양의 `exp(a)/exp(b)` 배율이다. 원본 SQLite의 실제 multiply/log/exp graph에서 양 좌표에 쓰인 *동일한* c를 확인했다. 이 2,349행은 **해당 체크포인트에 명시된 source-binding 행 전체**이지, 전체 소스 호출 집합의 전역 정의역 증명은 아니다.

독립 기존 indexed 구조 검사 4,238개 중 4,050개는 구조 검사를 통과했으며, 나머지 188개는 모두 `m3GlobalBlocks`에서 원본 slow 좌표 3개를 명시적으로 바인딩하지 못한 경우다. 두 검사는 범위가 서로 다르므로 수치를 단순 합산하지 않는다.

## 수학적 연결 정리
원본 `F(s;Z,T)=s-Z²s^(2h)-T`, `D=1/2-h`에 대하여 모든 c>0에서

```
F(c*s; c^D*Z, c*T) = c*F(s; Z,T).
eta(c^D*Z,c*T) = eta(Z,T)
```

가 성립한다. 첫 식은 `2D+2h=1`에 따른 정확한 항등식이며, 둘째 식은 양의 root가 존재하는 영역에서 `eta=Z/s^D`로 정의했을 때 성립한다. 따라서 세 비항등 입력족은 원본 slow root의 *배율 공변성*으로 묶인다. **원래 finite-root bracket [1/2,2]에 들어간다는 결론은 자동이 아니다.** 각 실제 band/label/copy에서 `1/2<=c*s<=2` 또는 실제 허용 root/branch 정의역의 적합성이 추가로 필요하다.

또한 T>=0, (Z,T)!=(0,0)인 양의 root는 유일하다. `H(s)=(s-T)/s^(2h)`의 도함수는 `(1-2h)s^(-2h)+2h*T*s^(-2h-1)>0`이기 때문이다. 그러므로 모든 0<a<b에 대하여

```
a <= s(Z,T) <= b  iff  F(a;Z,T) <= 0 <= F(b;Z,T).
```

원본 bump의 전체 적분 support 포함을 위한 plateau 경계는
`a=Xa/(2eX0)`, `b=200Xb/(121eX0)`이고, 위 동치는 곧 다음 원본 입력 부등식으로 환원된다.

```
T+Z²*a^(2h) >= a
T+Z²*b^(2h) <= b
```

이 부등식을 **각 실제 source 인자에 대해** 증명하면 앞선 bump 정규화 `I(s)=C_beta>0`, 전 차수 정규화 도함수 0 등을 이 호출에 정당하게 적용할 수 있다. `|Z|<=3/4, 1/2<=T<=3/4`는 공통 collar `1/4<s<3` 안에 들어가는 한 가지 증명 가능한 충분 조건이다. 그러나 원본 모든 행이 이 사각형에 든다고 가정하지 않는다.

반례 경고: `(Z,T)=(0,0)`에서는 `F(s)=s`이므로 양의 slow root가 없다. 좌표 박스 guard만으로 전역 호출 정의역을 선언해서는 안 된다. 이는 원본 허용영역 자체의 반례를 뜻하지는 않는다.

## 남은 실제 의무
원본 Guard C-025,038,040,041,068,076,084,092 모두 **OPEN**. 네 입력족 각각의 실제 band/label/copy에 위 포함 부등식이 성립하는지 인증하고, 188개 `m3GlobalBlocks` 누락된 바인딩, inactive-branch 평가 회피, changing-label 접합도 검증해야 한다. 이번에는 원본 Global Guard/Jet/PDE를 하나도 소거하지 않았다.

공식 현황: **Jet 230 / Global Guard 38 / PDE 1,020 / 합계 1,288**, N6-01 OPEN, N6-02 PARTIAL, M3 56/64. 원본 producer·criteria·공개 UI·Picard PR #31은 변경하지 않는다.

## 독립 실행 재현
전문 감사 코드 `stage3_domain_transport.py`, `test_stage3_domain_transport.py`, 추가 기계판독 결과와 20개 테스트 실행 기록은 이번 대화의 Stage 3 패키지에 함께 보존한다. 이 문서만으로 모든 호출에 대한 전역 적용 인증을 대체하지 않는다.
