# 원본 N6 독립 후속 계산

PR #28 최신 head `a08d9de1777cf460e6fa980674c5c70939201457`에서 분기한 별도 연구다.
원본 producer, 진행 장부와 공개 배포는 변경하지 않는다. 실행 성공은 인증 성공과 다르다.

## 계산과 증명 범위

- `rayleigh.py`: 실제 source nodes622971/622992/622991을 읽고 slow chart 미분과 Rayleigh 다항식의 정확 감소, 양의 하계에 대한 독립 유한 보조정리를 검사한다. 실제 전역 하계의 인증은 별도 의무다.
- `analytic_prerequisites.py`: 원본 A1 eta 미분을 포함한 singular Picard 구조와 원문의 해석적 전제를 대조한다. 원문이나 기존 PASS는 독립 증명으로 사용하지 않는다.
- `cartesian_run.py`: 원본 393개 Cartesian jet 요청, 94개 guard와 세 잔차 분자의 모든 항을 보존하면서 실제 정의에 의해 정당한 leaf 미분을 닫는다.
- `acceptance.py`: 같은 커밋의 완전한 receipt와 원래 열 가지 j=0 클래스 의무를 검증한다. 현재 지원하지 않는 전칭 증명 label/flag는 거부한다. 해당 인증기를 새로 구현하기 전에는 N6-01 OPEN, N6-02 PARTIAL을 유지한다.

## 실행

각 실행은 먼저 `INPUT_LOCK.json`의 원본 230개 파일과 검증기/PDF 해시를 확인하고,
기존 실행38500114302의 ZIP 여섯 개와 모든 member receipt를 재검증한다.
원본 3,892,594노드 graph와 이미 통과한 대규모 mean producer를 새로 생성하지 않는다.

```text
python -B research-ide/mathscope-m3/n6-unconditional-20261014/run_job.py --kind prepare --output OUTPUT/prepare
python -B research-ide/mathscope-m3/n6-unconditional-20261014/run_job.py --kind controls --output OUTPUT/controls
python -B research-ide/mathscope-m3/n6-unconditional-20261014/run_job.py --kind rayleigh --output OUTPUT/rayleigh
python -B research-ide/mathscope-m3/n6-unconditional-20261014/run_job.py --kind analytic --output OUTPUT/analytic
python -B research-ide/mathscope-m3/n6-unconditional-20261014/run_job.py --kind cartesian --output OUTPUT/cartesian
python -B research-ide/mathscope-m3/n6-unconditional-20261014/run_job.py --kind acceptance --research-output OUTPUT --output OUTPUT/acceptance
```

Acceptance는 clean checkout에서 얻은 동일 커밋의 실제 research receipt만 받는다.
수정 중인 로컬 코드의 결과에는 dirty 상태와 각 구현 파일 해시를 기록한다.
표준 `ubuntu-24.04` runner, Python3.12.10, Node24.19.0을 사용하며 각 명령의
시간 한도는1,200초, Node heap 한도는4GiB다. 오류/시간초과도 로그와 receipt를 보존한다.
새 수학 결과와 정확한 미해결 조건은 별도 `RESULTS_KO.md`와 `obligation-matrix.json`에 기록한다.
