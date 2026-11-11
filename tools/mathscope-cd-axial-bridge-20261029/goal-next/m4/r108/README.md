# R1-08 범위별 릴리스 판정

원래 설계도 68쪽의 네 검사 가운데 격리 후보에서 적용할 수 있는 세 검사를 재현했다. 그 후보의 Chromium 두 화면은 I3-08 격리 실행 기록에 결속되어 있다.

- 후보 범위. 원본 작업대의 지원 fixture와 축 계수 추적, 소스에 결속된 전문가·학생 설명을 실제 후보 HTML에서 읽어 냈다. 원본 엔진 연결 4개의 소스 해시도 일치한다.
- 모듈과 전체 상태. 현재 등록된 M4 증거 12건을 원래 평가기로 다시 읽었고, 같은 평가기에서 canFreeze=false, publicationConfirmed=false, HOLD를 얻었다. 직렬화된 수용 결과 12건과 위조 게시 기록 1건, 임의의 M3 완료 주장을 넣은 검사에서도 이 판정이 유지됐다.
- 패치와 되돌리기. 보관 v103의 4개 패치를 적용한 SHA-256은 0504482900dbeac2faf992be9a923bc51ab1de6bcec0b82ac058085444669735이다. 역순으로 되돌린 파일이 보관 원본 e6ebde6250a861296554f26305cb40200b0a70e822acb3f588e9dca423d6e784와 바이트 단위로 일치했다. 원본, 후보, 패치 내용 변조 세 검사를 거부했다.
- 실제 게시 화면 확인은 OPEN이다. 운영 웹을 보존한다는 사용자 제약에 따라 새 후보를 게시하지 않았다. 로컬 후보와 과거 v103 화면은 이번 후보의 실제 게시 영수증을 제공하지 않는다. 전체 R1-08 수용 판정은 OPEN이다.

재현 시 원본 Git 객체가 있는 저장소를 REPO, 이 폴더를 EVIDENCE, I3-08 증거 폴더를 I308으로 지정한다.

    python EVIDENCE/replay_owned_patch.py --repo REPO --source-commit 3c942d1a1bc391d12b07efaa25d2b0213ac736e8 --build EVIDENCE --browser-receipt I308/browser-receipt.json --out replayed-patch.json
    node EVIDENCE/verify_hold.mjs REPO replayed-patch.json replayed-hold.json
