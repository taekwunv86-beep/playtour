// POST /api/lottery - 추첨 실행
const MEMBERS = ['K', 'W', 'G', 'P', 'Z', 'C', 'M', 'V', 'J', 'I', 'R', 'U', 'O', 'S', 'Q', 'N', 'F', 'Y'];
const MONTHS = ['2월', '4월', '5월', '6월', '8월', '11월'];
const MEMBERS_PER_MONTH = 3;

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const { member } = await request.json();

        // 유효한 멤버인지 확인
        if (!MEMBERS.includes(member)) {
            return new Response(JSON.stringify({
                success: false,
                error: '유효하지 않은 멤버입니다.'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 이미 추첨했는지 확인
        const existing = await env.DB.prepare(
            'SELECT * FROM lottery_results WHERE member = ?'
        ).bind(member).first();

        if (existing) {
            return new Response(JSON.stringify({
                success: false,
                error: '이미 추첨에 참여한 멤버입니다.',
                assigned_month: existing.assigned_month
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 각 월별 현재 인원 조회
        const monthCountsResult = await env.DB.prepare(
            'SELECT assigned_month, COUNT(*) as count FROM lottery_results GROUP BY assigned_month'
        ).all();

        const monthCounts = {};
        MONTHS.forEach(m => monthCounts[m] = 0);
        monthCountsResult.results.forEach(row => {
            monthCounts[row.assigned_month] = row.count;
        });

        // 배정 가능한 월 찾기 (균등 배분)
        const minCount = Math.min(...MONTHS.map(m => monthCounts[m]));
        let availableMonths = MONTHS.filter(m =>
            monthCounts[m] === minCount && monthCounts[m] < MEMBERS_PER_MONTH
        );

        if (availableMonths.length === 0) {
            availableMonths = MONTHS.filter(m => monthCounts[m] < MEMBERS_PER_MONTH);
        }

        if (availableMonths.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: '모든 월이 가득 찼습니다.'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 랜덤으로 월 선택
        const assignedMonth = availableMonths[Math.floor(Math.random() * availableMonths.length)];

        // DB에 저장
        await env.DB.prepare(
            'INSERT INTO lottery_results (member, assigned_month) VALUES (?, ?)'
        ).bind(member, assignedMonth).run();

        return new Response(JSON.stringify({
            success: true,
            member,
            assigned_month: assignedMonth
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
