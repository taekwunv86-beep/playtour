// POST /api/reset - 결과 초기화 (관리자용)
const ADMIN_PASSWORD = 'playtour2024!'; // 간단한 비밀번호 보호

export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const { password } = await request.json();

        // 비밀번호 확인
        if (password !== ADMIN_PASSWORD) {
            return new Response(JSON.stringify({
                success: false,
                error: '관리자 비밀번호가 일치하지 않습니다.'
            }), {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 모든 결과 삭제
        await env.DB.prepare('DELETE FROM lottery_results').run();

        return new Response(JSON.stringify({
            success: true,
            message: '모든 결과가 초기화되었습니다.'
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
