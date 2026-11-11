# R1-06 원본 증거 검증과 음성 대조

원본 설계도 68쪽의 기준에 맞춰 M4 감사, M1 산술 검증, N7 원본 힘 및 cutoff 소비 경계를 격리 재현한다.

- M4의 원래 심사기는 해시만 맞춘 직렬화 PASS, 원래 Lean 파일의 한 바이트 변경, 같은 목표 ID의 정리 타입 변경을 거부한다. 감사된 원본 소스·로그·환경을 다시 읽었을 때 기존 커널 영수증은 정확히 일치한다.
- M1의 실제 산술 검증 요청은 97의 Lucas–Pratt 증명서를 확인한다. 위조한 증인 1, 인수 거듭제곱의 곱이 96에서 48로 달라진 증명서를 각각 거부한다. 참인 증명서의 결과 해시는 처음과 끝에 일치한다. 실패한 증명서의 결과는 UNKNOWN이다.
- 기록된 N7 원본 관측기는 외부 force 및 cutoff 값을 거부하고 기존 관측을 보존한다. 별도로 실제 원래 N7 힘 및 domain 생산기를 실행한다. 원본 외부 힘의 압력항을 지우거나 cutoff support ratio를 1/4에서 3/4로 변경한 두 사례를 실제 소비 검사가 거부한다. 원래 압력항은 양의 S₀와 2A>0에서 −S₀/(4A)이다. 원래 cutoff 비율 1/4는 1/2보다 작다. 각 변조를 복원하면 원본의 힘과 domain 증명서가 변경 전과 일치한다.
- 원시 로그의 각 행은 런타임 이유 코드와 원문 메시지를 남기며, 어떤 수학적 또는 증거 전제가 달라졌는지 설명한다.

힘 그래프 624,919개 노드와 독립 스칼라 프로그램 30,292개 노드의 해시, cutoff 정의역 메타데이터 해시가 기존 Linux 실행의 원본 기록과 일치했다. 범위는 원본의 열방정식 외부 제한과 고정 cutoff 정의역이다. 최종 전체장, 전역 종단 외력, 전체 K 에너지, 새 Lean 실행 및 게시 여부는 이 증거로 판정하지 않는다.

정확한 소스 스냅샷은 원본 Git 저장소 REPO에서 아래 명령으로 복원한다. EVIDENCE는 이 폴더다.

    python EVIDENCE/materialize.py REPO EVIDENCE
    node EVIDENCE/evidence_cases.mjs REPO replayed-evidence.json
    node --max-old-space-size=4608 EVIDENCE/force_cases.mjs replayed-force.json
