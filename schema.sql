-- 추첨 결과 테이블
CREATE TABLE IF NOT EXISTS lottery_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member TEXT NOT NULL UNIQUE,
    assigned_month TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_member ON lottery_results(member);
CREATE INDEX IF NOT EXISTS idx_month ON lottery_results(assigned_month);
