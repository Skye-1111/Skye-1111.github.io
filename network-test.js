const WebSocket = require('ws');
const http = require('http');

console.log('=== 网络连接诊断工具 ===\n');

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

// 测试WebSocket连接
function testWebSocketConnection(host, port) {
    return new Promise((resolve) => {
        const wsUrl = `ws://${host}:${port}/ws`;
        console.log(`正在测试WebSocket连接: ${wsUrl}`);
        
        const ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
            console.log(`⏰ WebSocket连接超时: ${wsUrl}`);
            ws.terminate();
            resolve(false);
        }, 5000);

        ws.on('open', () => {
            console.log(`✅ WebSocket连接成功: ${wsUrl}`);
            clearTimeout(timeout);
            ws.close();
            resolve(true);
        });

        ws.on('error', (err) => {
            console.log(`❌ WebSocket连接失败: ${wsUrl} - ${err.message}`);
            clearTimeout(timeout);
            resolve(false);
        });
    });
}

// 主测试函数
async function runTests() {
    const testHosts = [
        'localhost',
        '127.0.0.1', 
        '172.23.220.178'
    ];
    
    const port = 8080;
    
    console.log('1. 测试HTTP连接...\n');
    for (const host of testHosts) {
        await testHttpConnection(host, port);
    }
    
    console.log('\n2. 测试WebSocket连接...\n');
    for (const host of testHosts) {
        await testWebSocketConnection(host, port);
    }
    
    console.log('\n=== 诊断完成 ===');
    console.log('\n如果所有连接都失败，可能的原因：');
    console.log('1. 服务器未运行');
    console.log('2. 防火墙阻止连接');
    console.log('3. 网络配置问题');
    console.log('\n如果localhost成功但IP地址失败，可能是防火墙问题');
    console.log('如果所有连接都成功，miniPC应该能够连接');
}

runTests().catch(console.error);
