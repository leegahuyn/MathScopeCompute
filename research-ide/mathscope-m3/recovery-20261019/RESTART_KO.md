# 2026-10-19 실제 재개 지점

이 디렉터리는 현재 ChatGPT 세션에서 **새로 구현한 코드**다. 과거 파일명의
Gemini 표기나 저장되지 않은 10:08–10:16 진행 설명을 실행 증거로 취급하지 않는다.

## 확인한 저장 기준

- PR30 작업 브랜치: `mathscope-m3-n6-cloud-20261014`.
- 재개 기준 commit: `333d6095d4a2d2d69ceec9b25c44e1d3381e36d2`.
- 기준 tree: `341d08d0560cb14d7cec923a20814d362ca6e1dc`.
- 이전 수학 저장본: `a78e0f97d37d07f65a977bf675b03043ce2a8e64`.
- 두 commit 사이 실제 변경은 릴리스 manifest 한 파일이다. 수학 완료 변경이 아니다.
- 원격 PR base는 `mathscope-m3-n6-independent-20261014`이며 main 병합은 하지 않는다.

15개 첨부 ZIP은 원본을 보존한 별도 경로에서 안전하게 복원했다. 최신 continuation의
비아카이브 156개 파일은 위 HEAD의 대응 파일과 모두 SHA-256가 일치한다. 전승된
700개 scalar 기록, 3,407개 추가 의존 기록, 초기 구성의 1,260/1,260 증거는 기존
적용 범위에서 재사용했다. 전체의 비싼 재실행을 새 완료 증거로 꾸미지 않았다.

## 현재 M3 상태

`M3_CURRENT_ORIGINAL_LEDGER.json`에 원문 64개 ID·조건·PDF 페이지·기존 증거·범위가
들어 있다. 후속 원장의 증거 파일 및 독립 검토 41개를 실제 바이트와 대조했고
모두 일치했다. 기존 자료가 지시하는 파일과 디렉터리를 모두 찾았다.

완료 수는 기존 적용 범위의 **62/64 승계**, 이번 세션에서 새로 닫은 원래 조건은 0개다.
N7-06과 N8-05는 OPEN이고 actual global last-resolved tau는 `null`이다.
B0=7/10, C0*=6/5와 원래 양의 h, 정의역, cutoff는 유지한다.

## 이번에 실행한 실제 단위

`native/`는 원 registry `monotone:2`의 실제 slow inverse를 구현한다. 고정한 원 소스
capsule, 양의 h를 포함하는 유리 구간, 독립 endpoint certificate, 원 bracket에서
값 및 1·2차 미분을 사용한다. 소스 호출의 바깥 인자를 이미 계산했다는 뜻은 아니다.

`outer_cutoff.py`는 원 σ1 cutoff의 정확한 AST를 확인하고 13개 요청 미분의 닫힌
구간 상계를 계산한다. 물리적 z0·tau0 인자는 수식으로 유지한다. `run_outer_cutoff.py`는
원 compact K를 덮는 정규화 상자 [-1,1]^3의 8³/16³ 분할을 실행한다. 각각 320/2,656개
셀은 평탄한 0 연장으로 정확히 0이고, 나머지 192/1,440개에는 실제 A/b/p가 필요하다.
이 셀 수는 원래 K의 에너지 계산 완료율이 아니다. 원 전역장의 에너지 적분값은 없다.

원 energy operator binding의 67개 실제 A/b/p jet은 여전히 필요하다. 새로운 cutoff
검사는 9개 통과했고, 서로 다른 독립 검토에는 13개 물리 jet의 상징적 항등식 검사와
383개 고정밀 수식/미분 포함 비교가 있다. 구간 상계의 수학적 근거는
`OUTER_CUTOFF_PROOF.md`에 있고, 유한 비교가 전역 증명을 대신하지 않는다.

## 정확한 다음 구현 지점

1. `native/README.md`에 식별한 실제 호출 인자 622803/622804 및 623921/623934를
   각 원 lexical frame과 물리 정의역에서 평가한다. 현재 제공된 native 입력 상자는
   이 실제 바깥 호출 인자의 평가 결과가 아니다.
2. 원 radial guard의 Xa 및 XR·exp(node319)를 그대로 적용한다. 경계를 가로지르는
   상자는 미해결로 두거나 세분화한다. 임의의 충분조건 상수로 원 selector를 대체하지 않는다.
3. 동일한 최종 family의 stage 1–4와 slow-base, P_hat/C_hat/L_j와 다른 native 경계,
   67개 A/b/p jet을 연결한다. 기존 rho∈[1/2,1]에서 j≥5 보정이 0인 증거는 재사용하되
   slow-base 계수열과 그 tail까지 0이라고 해석하지 않는다.
4. 실제 비영 전역 u, grad(u), p, force와 에너지·소산·force-work를 계산한다.
   N7-06의 원문대로 독립 공간·시간 세분화와 정규화 defect 비교 및 (10.13)을 검사한다.
5. N8-05는 grid, Fourier cutoff, coefficient order, arithmetic precision을 각각 독립적으로
   2배 비교하고 별도 tail bound를 연결한다. 현재 JSON의 요청 설정과 null 결과는
   실제 에너지 비교의 성공/실패 데이터가 아니다. 좌표 네 개로 축을 바꾸지 않는다.

## M4·운영 사이트·원격 저장과의 구분

M4 원문 16개는 `../../mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json`에
있다. 독립 소프트웨어 준비, 기존 Lean 증거 재결속, 현재 전체 인수 조건은 서로 다르다.
M3 의존 조건이 남아 있는 동안 전체 릴리스는 HOLD다.

운영 UI 구현은 `../../mathscope-m4/recovery-ui-20261019/`에 따로 있다. 소스 commit,
GitHub tree/commit/ref 갱신, CI, WebsitePublisher 응답, 실제 운영 URL 검수는 각 단계의
영수증을 확인해야 한다. 이 문서만으로 원격 저장 또는 사이트 게시를 주장하지 않는다.

## 재현

저장소 루트에서 기존 요구 의존성 mpmath==1.3.0을 사용한다.

```bash
python -m unittest discover -s research-ide/mathscope-m3/recovery-20261019 -p test_outer_cutoff.py -v
python research-ide/mathscope-m3/recovery-20261019/run_outer_cutoff.py --output /tmp/mathscope-cutoff-new-run
```

기존 실행 영수증을 덮어쓰지 말고 새 출력 폴더를 사용한다. native 검증 명령과 필요
의존성 sympy==1.14.0은 `native/README.md`에 있다. 독립 검토의 첫 정밀도 상한 오류,
수정 및 후속 성공, 최초 의존성 부재 실패도 삭제하지 않고 남겼다.
