// Cloudflare API를 사용하여 D1 바인딩 설정
const { execSync } = require('child_process');
const https = require('https');

const ACCOUNT_ID = '9e753a10edff77680c6b3f063a2d8d38';
const PROJECT_NAME = 'playtour';
const D1_DATABASE_ID = 'b56e4440-e7ba-44ca-a270-0c5572d530ef';

// wrangler의 OAuth 토큰을 가져오는 함수
async function getWranglerToken() {
    // wrangler config 파일 위치 찾기
    const os = require('os');
    const path = require('path');
    const fs = require('fs');

    const possiblePaths = [
        path.join(os.homedir(), '.wrangler', 'config', 'default.toml'),
        path.join(process.env.APPDATA || '', 'xdg.config', '.wrangler', 'config', 'default.toml'),
        path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), '.wrangler', 'config', 'default.toml'),
    ];

    for (const configPath of possiblePaths) {
        try {
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf-8');
                const match = content.match(/oauth_token\s*=\s*"([^"]+)"/);
                if (match) {
                    return match[1];
                }
            }
        } catch (e) {
            continue;
        }
    }

    // 토큰을 찾지 못하면 wrangler whoami로 확인
    throw new Error('OAuth token not found in wrangler config');
}

// API 호출 함수
function apiCall(method, endpoint, token, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.cloudflare.com',
            path: endpoint,
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function main() {
    console.log('D1 바인딩 설정을 시작합니다...\n');

    let token;
    try {
        token = await getWranglerToken();
        console.log('✓ OAuth 토큰을 찾았습니다.');
    } catch (e) {
        console.error('✗ OAuth 토큰을 찾을 수 없습니다.');
        console.log('\n대안: Cloudflare Dashboard에서 수동으로 설정해주세요.');
        console.log('URL: https://dash.cloudflare.com/' + ACCOUNT_ID + '/pages/view/' + PROJECT_NAME + '/settings/functions');
        process.exit(1);
    }

    // 현재 프로젝트 정보 가져오기
    console.log('\n프로젝트 정보를 가져오는 중...');
    const projectInfo = await apiCall(
        'GET',
        `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}`,
        token
    );

    if (!projectInfo.success) {
        console.error('프로젝트 정보를 가져올 수 없습니다:', projectInfo.errors);
        process.exit(1);
    }

    console.log('✓ 프로젝트 정보:', projectInfo.result.name);

    // D1 바인딩 업데이트
    console.log('\nD1 바인딩을 설정하는 중...');

    const updateBody = {
        deployment_configs: {
            production: {
                d1_databases: {
                    DB: {
                        id: D1_DATABASE_ID
                    }
                }
            },
            preview: {
                d1_databases: {
                    DB: {
                        id: D1_DATABASE_ID
                    }
                }
            }
        }
    };

    const updateResult = await apiCall(
        'PATCH',
        `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}`,
        token,
        updateBody
    );

    if (updateResult.success) {
        console.log('✓ D1 바인딩이 성공적으로 설정되었습니다!');
        console.log('\n이제 사이트를 재배포합니다...');
    } else {
        console.error('✗ D1 바인딩 설정 실패:', JSON.stringify(updateResult.errors, null, 2));
        process.exit(1);
    }
}

main().catch(console.error);
