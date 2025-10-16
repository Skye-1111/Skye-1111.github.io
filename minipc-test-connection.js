/**
 * MiniPC连接测试 - 简化版本
 * 用于测试miniPC到PC的连接
 */

const WebSocket = require('ws');

console.log('=== MiniPC连接测试 ===\n');

// 测试不同的服务器地址
const testAddresses = [
    'ws://192.168.167.187:8080/ws',  // 正确的PC IP
    'ws://172.23.220.178:8080/ws',   // 旧的IP
    'ws://127.0.0.1:8080/ws'         // 本地地址（在miniPC上不会工作）
];

async function testConnection(url) {
    return new Promise((resolve) => {
        console.log(`测试连接: ${url}`);
        
        const ws = new WebSocket(url);
        
        ws.on('open', () => {
            console.log(`✅ 连接成功: ${url}`);
            ws.close();
            resolve(true);
        });
        
        ws.on('error', (error) => {
            console.log(`❌ 连接失败: ${url} - ${error.message}`);
            resolve(false);
        });
        
        ws.on('close', () => {
            console.log(`🔌 连接已关闭: ${url}\n`);
        });
    });
}

async function runTests() {
    console.log('开始测试miniPC到PC的连接...\n');
    
    for (const url of testAddresses) {
        await testConnection(url);
    }
    
    console.log('=== 测试完成 ===');
    console.log('\n建议:');
    console.log('1. 使用成功的地址运行: node mini-pc-client.js ws://[成功地址]');
    console.log('2. 确保PC服务器正在运行');
    console.log('3. 检查网络连接');
}

runTests().catch(console.error);
