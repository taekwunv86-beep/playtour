# 플레이투어 추첨 프로그램

2, 4, 5, 6, 8, 11월에 진행하는 플레이투어의 기획 담당 멤버를 추첨하는 웹 애플리케이션입니다.

## 기능

- 18명의 멤버가 6개 월에 균등하게 배정 (월당 3명)
- 슬롯머신 형태의 추첨 애니메이션
- 효과음 지원
- 관리자 페이지에서 결과 모니터링
- 엑셀(CSV) 다운로드
- Formspree를 통한 결과 백업

## 배포 방법 (Cloudflare Pages)

1. GitHub에 저장소 생성
2. Cloudflare Dashboard 접속 (https://dash.cloudflare.com)
3. Pages > Create a project > Connect to Git
4. 저장소 선택 후 배포 설정:
   - Build command: (비워두기)
   - Build output directory: `/`
5. Save and Deploy 클릭

## 파일 구조

```
playtour-lottery/
├── index.html      # 메인 추첨 페이지
├── admin.html      # 관리자 페이지
├── styles.css      # 스타일시트
├── script.js       # 메인 JavaScript
├── admin.js        # 관리자 페이지 JavaScript
└── README.md       # 설명 문서
```

## Formspree 설정 (선택사항)

1. https://formspree.io 접속
2. 무료 계정 생성
3. 새 폼 생성 후 폼 ID 복사
4. 관리자 페이지에서 백업 시 ID 입력
