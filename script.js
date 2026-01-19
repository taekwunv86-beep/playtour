// 플레이투어 추첨 프로그램 - 메인 스크립트

// 데이터 정의
const MEMBERS = ['K', 'W', 'G', 'P', 'Z', 'C', 'M', 'V', 'J', 'I', 'R', 'U', 'O', 'S', 'Q', 'N', 'F', 'Y'];
const MONTHS = ['2월', '4월', '5월', '6월', '8월', '11월'];
const MEMBERS_PER_MONTH = 3; // 18명 / 6개월 = 3명씩

// 상태 관리
let selectedMember = null;
let isSpinning = false;

// localStorage 키
const STORAGE_KEY = 'playtour_lottery_results';

// 결과 데이터 구조
function getResults() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    // 초기화
    return {
        assignments: {}, // { memberName: assignedMonth }
        monthCounts: MONTHS.reduce((acc, m) => ({ ...acc, [m]: [] }), {})
    };
}

function saveResults(results) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

// 페이지 초기화 (메인 페이지)
function initMainPage() {
    const memberGrid = document.getElementById('memberGrid');
    const monthStatus = document.getElementById('monthStatus');

    if (!memberGrid) return; // admin 페이지에서는 실행 안함

    const results = getResults();

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

// 배정 가능한 월 계산 (균등 배분)
function getAvailableMonths(results) {
    // 각 월의 현재 인원 수
    const counts = MONTHS.map(month => ({
        month,
        count: (results.monthCounts[month] || []).length
    }));

    // 최소 인원 수 찾기
    const minCount = Math.min(...counts.map(c => c.count));

    // 최소 인원인 월들만 반환 (균등 배분)
    const available = counts
        .filter(c => c.count === minCount && c.count < MEMBERS_PER_MONTH)
        .map(c => c.month);

    return available.length > 0 ? available : MONTHS.filter(m =>
        (results.monthCounts[m] || []).length < MEMBERS_PER_MONTH
    );
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

    const results = getResults();
    const availableMonths = getAvailableMonths(results);

    if (availableMonths.length === 0) {
        alert('모든 월이 가득 찼습니다!');
        isSpinning = false;
        spinButton.disabled = false;
        spinButton.classList.remove('spinning');
        return;
    }

    // 결과 월 랜덤 선택
    const resultMonth = availableMonths[Math.floor(Math.random() * availableMonths.length)];

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

    // 결과 저장
    results.assignments[selectedMember] = resultMonth;
    if (!results.monthCounts[resultMonth]) {
        results.monthCounts[resultMonth] = [];
    }
    results.monthCounts[resultMonth].push(selectedMember);
    saveResults(results);

    // 결과 표시
    setTimeout(() => {
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

        renderMonthStatus(results);

        // 상태 리셋
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
    saveResults,
    STORAGE_KEY
};
