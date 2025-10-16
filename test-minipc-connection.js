/**
 * MiniPC连接测试脚本
 * 模拟miniPC客户端连接测试
 */

const WebSocket = require('ws');

console.log('=== MiniPC连接测试 ===\n');

// 测试连接
function testConnection(serverUrl) {
    return new Promise((resolve) => {
        console.log(`正在连接: ${serverUrl}`);
        
        const ws = new WebSocket(serverUrl);
        
        ws.on('open', () => {
            console.log(`✅ 连接成功: ${serverUrl}`);
            
            // 发送设备信息
            ws.send(JSON.stringify({
                type: 'device_info',
                deviceType: 'minipc',
                deviceName: 'Test MiniPC',
                deviceId: 'test_minipc_001'
            }));
            
            // 发送状态更新
            ws.send(JSON.stringify({
                type: 'status_update',
                data: {
                    lidarConnected: true,
                    stp23lConnected: true,
                    isScanning: false,
                    isMeasuring: false
                }
            }));
            
            // 等待一下然后关闭
            setTimeout(() => {
                ws.close();
                resolve(true);
            }, 2000);
        });
        
        ws.on('error', (error) => {
            console.log(`❌ 连接失败: ${serverUrl} - ${error.message}`);
            resolve(false);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log(`📨 收到消息: ${message.type}`);
            } catch (e) {
                console.log(`📨 收到原始消息: ${data}`);
            }
        });
        
        ws.on('close', () => {
            console.log(`🔌 连接已关闭: ${serverUrl}`);
        });
    });
}

// 测试多个地址
async function runTests() {
    const addresses = [
        'ws://127.0.0.1:8080/ws',
        'ws://192.168.167.187:8080/ws',
        'ws://172.23.220.178:8080/ws'
    ];
    
    console.log('测试WebSocket连接...\n');
    
    for (const addr of addresses) {
        await testConnection(addr);
        console.log(''); // 空行分隔
    }
    
    console.log('=== 测试完成 ===');
    console.log('\n建议:');
    console.log('1. 使用成功的地址更新miniPC客户端');
    console.log('2. 确保miniPC和PC在同一网络');
    console.log('3. 检查防火墙设置');
}

runTests().catch(console.error);
