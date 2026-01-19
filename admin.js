// 관리자 페이지 스크립트 (서버 DB 연동)

const ADMIN_PASSWORD = 'playtour2024!';

document.addEventListener('DOMContentLoaded', initAdminPage);

async function initAdminPage() {
    await refreshData();

    // 버튼 이벤트 바인딩
    document.getElementById('downloadBtn').addEventListener('click', downloadExcel);
    document.getElementById('resetBtn').addEventListener('click', resetResults);
    document.getElementById('backupBtn').addEventListener('click', backupToFormspree);
}

// 데이터 새로고침
async function refreshData() {
    const results = await window.PLAYTOUR.getResults();
    renderSummary(results);
    renderResultTable(results);
    renderMemberStatus(results);
}

// 요약 카드 렌더링
function renderSummary(results) {
    const { MEMBERS } = window.PLAYTOUR;

    const totalMembers = MEMBERS.length;
    const assignedMembers = Object.keys(results.assignments).length;
    const remainingMembers = totalMembers - assignedMembers;

    const summaryCards = document.getElementById('summaryCards');
    summaryCards.innerHTML = `
        <div class="summary-card">
            <div class="card-title">전체 멤버</div>
            <div class="card-value">${totalMembers}</div>
            <div class="card-sub">명</div>
        </div>
        <div class="summary-card">
            <div class="card-title">추첨 완료</div>
            <div class="card-value" style="color: var(--success-color)">${assignedMembers}</div>
            <div class="card-sub">명</div>
        </div>
        <div class="summary-card">
            <div class="card-title">추첨 대기</div>
            <div class="card-value" style="color: var(--secondary-color)">${remainingMembers}</div>
            <div class="card-sub">명</div>
        </div>
        <div class="summary-card">
            <div class="card-title">진행률</div>
            <div class="card-value">${Math.round((assignedMembers / totalMembers) * 100)}</div>
            <div class="card-sub">%</div>
        </div>
    `;
}

// 결과 테이블 렌더링
function renderResultTable(results) {
    const { MONTHS, MEMBERS_PER_MONTH } = window.PLAYTOUR;

    const tbody = document.getElementById('resultTableBody');
    tbody.innerHTML = '';

    // 각 행 (최대 3명씩)
    for (let i = 0; i < MEMBERS_PER_MONTH; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${i + 1}</td>`;

        MONTHS.forEach(month => {
            const members = results.monthCounts[month] || [];
            const member = members[i] || '-';
            row.innerHTML += `<td>${member}</td>`;
        });

        tbody.appendChild(row);
    }
}

// 멤버별 상태 렌더링
function renderMemberStatus(results) {
    const { MEMBERS } = window.PLAYTOUR;

    const grid = document.getElementById('memberStatusGrid');
    grid.innerHTML = '';

    MEMBERS.forEach(member => {
        const assignedMonth = results.assignments[member];
        const item = document.createElement('div');
        item.className = `member-status-item ${assignedMonth ? '' : 'pending'}`;
        item.innerHTML = `
            <div class="member-name">${member}</div>
            <div class="member-month">${assignedMonth || '대기중'}</div>
        `;
        grid.appendChild(item);
    });
}

// 엑셀 다운로드 (CSV 형식)
async function downloadExcel() {
    const results = await window.PLAYTOUR.getResults();
    const { MONTHS, MEMBERS_PER_MONTH, MEMBERS } = window.PLAYTOUR;

    // CSV 헤더
    let csv = '\uFEFF'; // BOM for Excel UTF-8
    csv += 'No,' + MONTHS.join(',') + '\n';

    // 월별 배정 테이블
    for (let i = 0; i < MEMBERS_PER_MONTH; i++) {
        let row = (i + 1).toString();
        MONTHS.forEach(month => {
            const members = results.monthCounts[month] || [];
            row += ',' + (members[i] || '');
        });
        csv += row + '\n';
    }

    csv += '\n\n멤버별 배정 현황\n';
    csv += '멤버,배정월\n';
    MEMBERS.forEach(member => {
        csv += `${member},${results.assignments[member] || '미배정'}\n`;
    });

    // 다운로드
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `플레이투어_추첨결과_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 결과 초기화
async function resetResults() {
    if (!confirm('정말로 모든 추첨 결과를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        return;
    }

    const password = prompt('관리자 비밀번호를 입력하세요:');
    if (!password) {
        return;
    }

    try {
        const response = await fetch(`${window.PLAYTOUR.API_BASE}/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (data.success) {
            alert('초기화가 완료되었습니다.');
            await refreshData();
        } else {
            alert(data.error || '초기화에 실패했습니다.');
        }
    } catch (error) {
        alert('오류가 발생했습니다: ' + error.message);
    }
}

// Formspree 백업
async function backupToFormspree() {
    const results = await window.PLAYTOUR.getResults();
    const { MONTHS, MEMBERS } = window.PLAYTOUR;

    // 결과를 보기 좋게 정리
    let summary = '=== 플레이투어 추첨 결과 ===\n';
    summary += `백업 시간: ${new Date().toLocaleString('ko-KR')}\n\n`;

    summary += '[ 월별 배정 ]\n';
    MONTHS.forEach(month => {
        const members = results.monthCounts[month] || [];
        summary += `${month}: ${members.join(', ') || '없음'}\n`;
    });

    summary += '\n[ 멤버별 배정 ]\n';
    MEMBERS.forEach(member => {
        summary += `${member}: ${results.assignments[member] || '미배정'}\n`;
    });

    // Formspree 폼 ID 확인
    const form = document.getElementById('formspreeForm');
    const formAction = form.getAttribute('action');

    if (formAction.includes('YOUR_FORM_ID')) {
        const formId = prompt(
            'Formspree 폼 ID를 입력하세요.\n' +
            '(https://formspree.io에서 폼을 만들고 ID를 복사하세요)\n\n' +
            '예: xyzabcde'
        );

        if (!formId) {
            alert('백업이 취소되었습니다.');
            return;
        }

        form.setAttribute('action', `https://formspree.io/f/${formId}`);
    }

    // 폼 데이터 설정
    document.getElementById('formspreeResults').value = summary;

    // 확인 후 제출
    if (confirm('Formspree로 결과를 백업하시겠습니까?\n\n' + summary)) {
        form.submit();
    }
}

// 자동 새로고침 (10초마다)
setInterval(refreshData, 10000);
