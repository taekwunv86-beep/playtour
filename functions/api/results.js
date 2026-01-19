// GET /api/results - 전체 결과 조회
export async function onRequestGet(context) {
    const { env } = context;

    try {
        const results = await env.DB.prepare(
            'SELECT member, assigned_month, created_at FROM lottery_results ORDER BY created_at ASC'
        ).all();

        // 월별 카운트 계산
        const monthCounts = {};
        const assignments = {};

        results.results.forEach(row => {
            assignments[row.member] = row.assigned_month;
            if (!monthCounts[row.assigned_month]) {
                monthCounts[row.assigned_month] = [];
            }
            monthCounts[row.assigned_month].push(row.member);
        });

        return new Response(JSON.stringify({
            success: true,
            assignments,
            monthCounts,
            total: results.results.length
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
