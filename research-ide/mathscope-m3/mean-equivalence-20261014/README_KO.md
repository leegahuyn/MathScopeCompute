# MathScope M3 실제 mean 동등성과 N6 원본 함수 감사

기준은 PR #27의 커밋 `5422e232219a5de4722ac4e38ba79eb83b9e95cd`이다.
새 브랜치는 `mathscope-m3-mean-equivalence-20261014`이며 원본 producer,
기존 계산 기록, 공개 사이트, main, 기존 56/64 판정을 변경하지 않는다.

## 재현

`.github/workflows/m3-mean-equivalence.yml`은 표준 `ubuntu-24.04`에서
Python **3.12.10**, Node **24.19.0**을 사용한다. 각 명령의 제한은 2,200초,
Node heap은 8,192 MiB이다. 실제 CPU·RAM·디스크·버전·commit·입력 해시와
실패/중단을 artifact에 기록한다. 실행 성공은 수학적 인증을 의미하지 않는다.

1. `verified_inputs.py`는 기존 클라우드 run 38495642925의 GitHub에 영구 보관된
   ZIP을 고정 SHA-256으로 검증한다. 소스 정의 header와 SQLite checkpoint를
   재사용한다. 모든 job에서 389만 노드를 다시 구성하지 않는다.
2. `mean-equivalence-run.mjs`는 실제 private source를 한 번 열어 원본 maximum을
   유지한 두 mean 단계를 다시 계산한다. 실제 정의·formal·order·capture·branch를
   보존하는 alpha 및 유리식 비교를 수행하고 다섯 초기 보정식의 원본 연산자를 내보낸다.
3. `natural_actual.py`는 실제 natural core의 Banach 공간·operator·무한 recurrence,
   B8 전체 이력 및 실제 preconditioned branch를 조사한다. 정확 산술과 양의 측도
   적분의 외향 구간 계산을 사용한다. 증명 범위는 `analytic_natural_b8.md`에 있다.
4. `residual-audit.mjs`는 완전한 원본 소스를 한 번 열어 175/203/690개 잔여항 전부와
   실제 operator 정의 경계를 저장한다. 같은 실제 각도의 삼각 항등식을 적용한다.
   별도 Cartesian 미분 구현은 미계산된 실제 함수 jet을 명시적인 미해결 항으로 남긴다.
5. `initial_finite.py`는 동일 실행의 private source receipt에 연결된 다섯 원본 보정식을
   독립 Python Fraction 다항식으로 검증한다. 전체 클래스·모멘트는 별도로 판정한다.

원본 식의 동일성, 실제 함수의 해석적 존재성, 초기 상태의 모든 클래스,
전체 물리 PDE의 인증은 서로 다른 증거를 요구한다. 같은 이름의 함수 병합,
finite truncation과 infinite limit의 동일시, 숫자 샘플에 의한 승격을 허용하지 않는다.
미증명 전제를 표시한 기호적 8/8은 무조건부 전체 N6 인증으로 승격하지 않는다.

최종 실행·모든 성공/실패 artifact ZIP·한국어 판정은
`../evidence/mean-equivalence-20261014/`에 영구 저장한다.
두 PDF는 `INPUT_MANIFEST.json`이 지정하는 기존 GitHub 파일을 재사용한다.

## 작은 독립 부정 대조군

```sh
python -B -m unittest discover -s research-ide/mathscope-m3/mean-equivalence-20261014 -p 'test_*.py'
node --test research-ide/mathscope-m3/mean-equivalence-20261014/*.test.mjs
```

원본 node/body·branch·argument·capture·적분 경계·미분 order 변조, 빠진 nonlinear
항, 다른 실제 각도, copied capability, 자원 상한 및 미정의 역수를 검사한다.
