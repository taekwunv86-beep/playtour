// 플레이투어 추첨 프로그램 - 메인 스크립트 (서버 DB 연동)

// 데이터 정의
const MEMBERS = ['K', 'W', 'G', 'P', 'Z', 'C', 'M', 'V', 'J', 'I', 'R', 'U', 'O', 'S', 'Q', 'N', 'F', 'Y'];
const MONTHS = ['2월', '4월', '5월', '6월', '8월', '11월'];
const MEMBERS_PER_MONTH = 3; // 18명 / 6개월 = 3명씩

// API 베이스 URL
const API_BASE = '/api';

// 상태 관리
let selectedMember = null;
let isSpinning = false;
let cachedResults = null;

// 서버에서 결과 조회
async function getResults() {
    try {
        const response = await fetch(`${API_BASE}/results`);
        const data = await response.json();

        if (data.success) {
            // monthCounts를 배열 형태로 변환
            const monthCounts = {};
            MONTHS.forEach(m => {
                monthCounts[m] = data.monthCounts[m] || [];
            });

            cachedResults = {
                assignments: data.assignments || {},
                monthCounts
            };
            return cachedResults;
        }
    } catch (error) {
        console.error('결과 조회 실패:', error);
    }

    // 실패 시 빈 결과 반환
    return {
        assignments: {},
        monthCounts: MONTHS.reduce((acc, m) => ({ ...acc, [m]: [] }), {})
    };
}

// 서버에 추첨 요청
async function submitLottery(member) {
    try {
        const response = await fetch(`${API_BASE}/lottery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ member })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('추첨 요청 실패:', error);
        return { success: false, error: error.message };
    }
}

// 페이지 초기화 (메인 페이지)
async function initMainPage() {
    const memberGrid = document.getElementById('memberGrid');
    const monthStatus = document.getElementById('monthStatus');

    if (!memberGrid) return; // admin 페이지에서는 실행 안함

    // 로딩 표시
    memberGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">로딩 중...</div>';

    const results = await getResults();

    // 멤버 버튼 생성
    memberGrid.innerHTML = '';
    MEMBERS.forEach(member => {
        const btn = document.createElement('button');
        btn.className = 'member-btn';
        btn.textContent = member;
        btn.dataset.member = member;

        // 이미 추첨한 멤버는 비활성화
        if (results.assignments[member]) {
            btn.disabled = true;
            btn.classList.add('completed');
            btn.title = `${member}: ${results.assignments[member]} 배정됨`;
        } else {
            btn.addEventListener('click', () => selectMember(member));
        }

        memberGrid.appendChild(btn);
    });

    // 월별 현황 표시
    renderMonthStatus(results);

    // 스핀 버튼 이벤트
    const spinButton = document.getElementById('spinButton');
    spinButton.addEventListener('click', startSpin);
}

// 멤버 선택
function selectMember(member) {
    selectedMember = member;

    // UI 업데이트
    document.querySelectorAll('.member-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.member === member) {
            btn.classList.add('selected');
        }
    });

    document.getElementById('selectedMemberName').textContent = member;
    document.getElementById('spinButton').disabled = false;
    document.getElementById('slotResult').textContent = '';
}

// 월별 현황 렌더링
function renderMonthStatus(results) {
    const monthStatus = document.getElementById('monthStatus');
    if (!monthStatus) return;

    monthStatus.innerHTML = '';

    MONTHS.forEach(month => {
        const members = results.monthCounts[month] || [];
        const card = document.createElement('div');
        card.className = 'month-card';
        card.innerHTML = `
            <div class="month-name">${month}</div>
            <div class="month-count">${members.length}/${MEMBERS_PER_MONTH}</div>
            <div class="month-target">명</div>
            <div class="member-list">${members.join(', ') || '-'}</div>
        `;
        monthStatus.appendChild(card);
    });
}

// 슬롯머신 효과음 생성 (Web Audio API)
function createSpinSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    return {
        play: function() {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 200 + Math.random() * 400;
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        },
        playWin: function() {
            const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                }, i * 150);
            });
        }
    };
}

let spinSound = null;

// 슬롯머신 시작
async function startSpin() {
    if (!selectedMember || isSpinning) return;

    isSpinning = true;
    const spinButton = document.getElementById('spinButton');
    const slotReel = document.getElementById('slotReel');
    const slotResult = document.getElementById('slotResult');

    spinButton.disabled = true;
    spinButton.classList.add('spinning');
    slotResult.textContent = '';

    // 효과음 초기화
    if (!spinSound) {
        spinSound = createSpinSound();
    }

    // 서버에 추첨 요청 (먼저 결과를 받아옴)
    const lotteryResult = await submitLottery(selectedMember);

    if (!lotteryResult.success) {
        alert(lotteryResult.error || '추첨에 실패했습니다.');
        isSpinning = false;
        spinButton.disabled = false;
        spinButton.classList.remove('spinning');

        // 이미 추첨한 멤버인 경우 UI 업데이트
        if (lotteryResult.assigned_month) {
            const selectedBtn = document.querySelector(`.member-btn[data-member="${selectedMember}"]`);
            if (selectedBtn) {
                selectedBtn.disabled = true;
                selectedBtn.classList.remove('selected');
                selectedBtn.classList.add('completed');
                selectedBtn.title = `${selectedMember}: ${lotteryResult.assigned_month} 배정됨`;
            }
            selectedMember = null;
            document.getElementById('selectedMemberName').textContent = '-';
        }
        return;
    }

    const resultMonth = lotteryResult.assigned_month;

    // 슬롯머신 애니메이션
    const totalSpins = 30 + Math.floor(Math.random() * 20);
    const allMonths = [...MONTHS, ...MONTHS, ...MONTHS]; // 반복

    // 슬롯 릴 재구성
    slotReel.innerHTML = '';
    allMonths.forEach(month => {
        const item = document.createElement('div');
        item.className = 'slot-item';
        item.textContent = month;
        slotReel.appendChild(item);
    });

    // 결과 월의 인덱스 찾기
    const resultIndex = MONTHS.indexOf(resultMonth) + MONTHS.length;

    let currentPosition = 0;
    const itemHeight = 120;

    for (let i = 0; i < totalSpins; i++) {
        await new Promise(resolve => {
            const delay = 50 + (i * (i > totalSpins - 10 ? 20 : 5));
            setTimeout(() => {
                currentPosition++;
                if (currentPosition >= allMonths.length) currentPosition = 0;

                slotReel.style.transform = `translateY(-${currentPosition * itemHeight}px)`;
                spinSound.play();

                resolve();
            }, delay);
        });
    }

    // 최종 위치로 이동
    slotReel.style.transform = `translateY(-${resultIndex * itemHeight}px)`;

    // 결과 표시
    setTimeout(async () => {
        spinSound.playWin();
        slotResult.innerHTML = `<span style="color: var(--secondary-color)">${selectedMember}</span> 님은 <span style="color: var(--success-color)">${resultMonth}</span> 담당!`;

        // 컨페티 효과
        createConfetti();

        // UI 업데이트
        const selectedBtn = document.querySelector(`.member-btn[data-member="${selectedMember}"]`);
        if (selectedBtn) {
            selectedBtn.disabled = true;
            selectedBtn.classList.remove('selected');
            selectedBtn.classList.add('completed');
            selectedBtn.title = `${selectedMember}: ${resultMonth} 배정됨`;
        }

        // 서버에서 최신 결과 다시 조회
        const results = await getResults();
        renderMonthStatus(results);

        // 상태 리셋
        const completedMember = selectedMember;
        selectedMember = null;
        document.getElementById('selectedMemberName').textContent = '-';
        isSpinning = false;
        spinButton.classList.remove('spinning');

        // 모든 추첨 완료 체크
        checkAllComplete(results);
    }, 500);
}

// 컨페티 효과
function createConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 4000);
}

// 모든 추첨 완료 체크
function checkAllComplete(results) {
    const totalAssigned = Object.keys(results.assignments).length;
    if (totalAssigned >= MEMBERS.length) {
        setTimeout(() => {
            alert('모든 멤버의 추첨이 완료되었습니다!\n관리자 페이지에서 결과를 확인하세요.');
        }, 1000);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initMainPage);

// Export for admin page
window.PLAYTOUR = {
    MEMBERS,
    MONTHS,
    MEMBERS_PER_MONTH,
    getResults,
    API_BASE
};
