const http = require('http');

console.log('=== 简单连接测试 ===\n');

// 测试HTTP连接
function testHttpConnection(host, port) {
    return new Promise((resolve) => {
        const options = {
            hostname: host,
            port: port,
            path: '/',
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            console.log(`✅ HTTP连接成功: ${host}:${port} (状态: ${res.statusCode})`);
            resolve(true);
        });

        req.on('error', (err) => {
            console.log(`❌ HTTP连接失败: ${host}:${port} - ${err.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`⏰ HTTP连接超时: ${host}:${port}`);
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

// 测试所有可能的地址
async function runTests() {
    const addresses = [
        '127.0.0.1',
        'localhost', 
        '172.23.220.178',
        '192.168.167.187'
    ];
    
    console.log('测试HTTP连接...\n');
    
    for (const addr of addresses) {
        await testHttpConnection(addr, 8080);
    }
    
    console.log('\n=== 测试完成 ===');
    console.log('\n如果127.0.0.1成功但其他地址失败，说明：');
    console.log('1. 服务器只绑定了localhost');
    console.log('2. 防火墙阻止了外部连接');
    console.log('3. 网络接口配置问题');
}

runTests().catch(console.error);
