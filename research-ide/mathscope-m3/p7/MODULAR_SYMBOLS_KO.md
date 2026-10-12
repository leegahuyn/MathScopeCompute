# P7-06: 실제 exact modular-symbol 영값·비영값 채널

`modular_symbols.py`는 정확한 계수 모델 11a1과 37a1에 대해 **고정된 PARI/GP
2.19.0을 새 프로세스에서 실행**한다. 각 곡선에 대응하는 유리수 modular symbol을
구하고 중앙 경로 `[infinity,0]`, 즉 약수 `[0]-[infinity]`에 평가한다.

이 구현에서 사용하는 정규화는 **선택된 ambient 기저의 첫 비영 좌표를 1로 놓는 것**이다.
Néron 실주기로 나눈 수를 계산하는 정규화가 아니다. 결과의 1 또는 0을
`L(E,1)/Omega_E` 값으로 표시하면 안 된다.

## 실제 실행 결과

| 정확한 입력 모델 | level | plus 공간 차원 | new cuspidal plus 차원 | 정규화된 symbol 좌표 | 중앙 경로의 정확한 값 | 이 채널의 해석적 결론 |
|---|---:|---:|---:|---|---:|---|
| 11a1: `[0,-1,1,-10,-20]` | 11 | 2 | 1 | `[1,-5/2]` | `1` | 명시된 정리·CAS 의존성 아래 `L(E,1)≠0`, 해석적 rank 0 |
| 37a1: `[0,0,1,-1,0]` | 37 | 3 | 2 | `[0,1,0]` | `0` | 명시된 정리·CAS 의존성 아래 `L(E,1)=0`, 해석적 rank ≥1 |

두 symbol 자체는 모두 비영이다. 37a1에 영벡터를 입력해서 중앙값 0을 얻은 것이 아니다.
원본 `.gp`, stdout, stderr, backend fingerprint 및 전체 certificate는
`evidence/modular-symbols-20261012/`에 보존한다. 해당 값과 파일 SHA는 이 디렉터리의
`receipt.json`으로 묶는다. 데이터베이스의 rank 또는 L값을 입력하지 않는다.

## 정확한 계산과 별도 유리수 검증

PARI의 `msinit(N,2,1)`로 plus 공간을, `msnew`로 new cuspidal 부분공간을 구성한다.
`msfromhecke(...,H)`가 주는 좌표는 **H 기저의 좌표**이므로 반드시 `H[1]`을 곱해
ambient 공간으로 올린다. `mshecke`의 행렬과 `mseval`의 경로 함수를 함께 내보낸다.
이 API들의 공간·기저·경로 정의는 [PARI 공식 modular-symbol 문서](https://pari.math.u-bordeaux.fr/dochtml/html-stable/Modular_symbols.html)에 따른다.

Python의 `fractions.Fraction`으로 다음 유한 항등식을 다시 검사한다.

- new 기저의 full column rank, 비영 eigensymbol, ambient lift와 정규화의 정확한 일치.
- 소수 `2,3,5,7,N` 각각의 `T_p` 또는 나쁜 소수의 `U_p`에 대한 부분공간 불변성과 고유벡터 항등식.
- 이 행렬들의 고유조건을 쌓은 행렬의 nullity가 정확히 1이라는 Gaussian elimination 결과.
- 첫 12개 정규화된 q-계수가 독립 유한체 점 개수·완전한 Euler 재귀로 계산한 계수와 일치함.
- 중앙 functional과 symbol의 내적, 경로 반전의 부호, 영경로, 두 비영 스칼라 배의 정확한 값.
- **모든** `mspathgens` 경로의 값과 weight 2의 Manin 관계 잔차가 정확히 0임.

weight 2의 계수 표현은 `V_2=Q`로 자명하므로 관계에 등장하는 group-ring 원소는
계수의 합으로 작용한다. 이 augmentation으로 얻은 관계행렬을 내보내고 Python에서
그 행렬과 전체 generator 값의 곱이 영벡터인지 확인한다. PARI의 전체 공간 구성과
관계 목록 자체까지 Python이 독립 구현했다고 주장하지는 않는다.

모델을 식별하는 데 쓰는 보수적인 Sturm bound는
`ceil(2*[SL2(Z):Gamma0(N)]/12)`이다. 여기서는 N이 소수라 index는 `N+1`이고
bound는 각각 2와 7이다. 두 cusp form의 상수항은 0이며 실제 12개 계수를 비교한다.
[Sturm 정리와 Γ0 index 공식](https://wstein.org/books/modform/modform/newforms.html#sturm-s-theorem)은
이 유한 계수 일치를 정규화된 form의 일치로 연결한다. Hecke 대수의 가환성과
new 공간의 불변성을 함께 사용해 1차원 공동 고유공간의 form을 해석한다.

## 주기·Manin 상수와 분석적 결론의 경계

정확한 곡선의 complete Euler 계수가 modular form에 대응한다는 것은
[semistable modularity 정리](https://annals.math.princeton.edu/1995/141-3/p01)를 사용한다.
그 form의 plus period symbol은 위의 유리수 eigensymbol과 **비영 실수배** 관계이고,
중앙 period 적분은 `L(E,1)`이다. 이에 필요한
[modular-symbol period map](https://wstein.org/books/modform/modform/periods.html)을
명시된 수학적 의존성으로 남긴다. 비영 배율의 수치를 몰라도 영값·비영값은 보존된다.

따라서 Manin 상수를 1로 가정할 필요가 없고, Néron period 또는 BSD 공식을
계산에 끼워 넣지 않는다. 이 결과는 새 Lean kernel proof가 아니라 **명시된 표준 정리와
고정된 정확 CAS 알고리즘에 의존하는 계산 증거**이다.

37a1의 symbol 값 0만으로 영점의 중복도 1을 알 수는 없다. 결과는
`exactAnalyticRank:null`, `analyticRankLowerBound:1`, `firstDerivativeComputed:false`를 유지한다.
기존 `elliptic_analytic.py`가 별도로 실행하는 completed 함수의 FE 대칭과
`0 ∉ LambdaPrime(1)` ball을 결합할 때 해석적 rank 1 결론이 가능하다.
새 테스트는 실제 두 생산자를 실행해 모델 hash가 같고 각 증명 경로가 분리되어 있음을 확인한다.
작은 ball이 0을 포함한다는 사실은 이 채널의 exact vanishing 증거가 아니다.

## 실제 PARI 경계 동작과 처리

PARI 2.19.0의 level 37에서 `mseval(M,s)` shortcut은 5개 generator 값만 반환한다.
같은 공간의 `mspathgens(M)[1]`에는 9개 경로가 있다. shortcut 벡터에
`msissymbol(M,V)`를 적용한 실제 결과는 0이었다.

구현은 `V=vector(#G,i,mseval(M,s,G[i]))`로 **9개 경로를 모두 명시적으로 평가**한다.
`[0,-1,1,1,0,0,0,0,0]`을 얻고 `msissymbol`은 1을 반환한다.
강제로 영인 네 항을 삭제하거나 성공 guard를 완화하지 않는다.
두 실행의 원문은 `generator-shortcut-attempt1.*`과 `generator-explicit-attempt1.*`에 각각 보존한다.

GP는 경고·오류 뒤에도 exit code 0을 반환할 수 있다. 따라서 성공은
exit 0, 빈 stderr, 정확히 한 개의 결과 marker, exact rational protocol,
유효한 전체 witness를 모두 요구한다. 프로세스는 64 MB GP stack과 60초 제한을 사용하며
외부 CLI의 execution lease 안에서 실행된다. 고정 source archive SHA와 빌드 sidecar,
실제 executable SHA, `--version` 일치를 먼저 검사한다.

## API와 재실행

```python
from p7.modular_symbols import (
    modular_symbol_certificate,
    evaluate_modular_symbols,
    replay_modular_symbol_certificate,
    check_modular_symbol_witness,
)

record = evaluate_modular_symbols({"model": "37a1"})
assert record["status"] == "EXACT_MODULAR_SYMBOL_ZERO"
assert record["analyticConclusion"]["exactAnalyticRank"] is None
assert replay_modular_symbol_certificate(record)["status"] == "MATCH"
```

`check_modular_symbol_witness`는 주어진 유리수 데이터의 일관성을 검사한다.
그것만으로 외부 JSON의 출처를 인증하지 않는다. `replay_modular_symbol_certificate`는
현재 source hash를 확인하고 **고정 GP를 다시 실행하여 전체 결과를 비교**한다.
숫자·claim·request를 변조한 뒤 hash만 다시 붙여도 재실행에서 거부한다.

실제 pinned runtime이 설치된 환경에서:

```bash
PYTHONPATH=research-ide/mathscope-m3 python -m unittest discover \
  -s research-ide/mathscope-m3/p7/tests -p test_modular_symbols.py -v
```

10개 테스트가 두 실제 양성 실행, fresh replay, 정확 계수·나쁜 Euler 인자,
독립 derivative 채널을 검사한다. 정확한 영값·벡터·Hecke 행렬·new 기저·Manin 항,
Sturm 계수·모델·부호·source·rank claim의 변조와 빈/중복/경고 GP 출력,
잘못된 요청 및 runtime 부재도 모두 성공 증거로 받아들이지 않는다.
