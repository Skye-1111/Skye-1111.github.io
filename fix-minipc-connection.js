/**
 * 修复MiniPC连接脚本
 * 确保miniPC客户端使用正确的服务器地址
 */

const fs = require('fs');
const path = require('path');

console.log('=== 修复MiniPC连接配置 ===\n');

// 读取mini-pc-client.js文件
const filePath = 'mini-pc-client.js';

try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log('当前文件内容检查:');
    
    // 检查是否包含错误的IP地址
    const wrongIPs = ['127.0.0.1', '172.23.220.178'];
    let hasWrongIP = false;
    
    wrongIPs.forEach(ip => {
        if (content.includes(ip)) {
            console.log(`❌ 发现错误IP地址: ${ip}`);
            hasWrongIP = true;
        }
    });
    
    // 检查是否包含正确的IP地址
    const correctIP = '192.168.167.187';
    if (content.includes(correctIP)) {
        console.log(`✅ 发现正确IP地址: ${correctIP}`);
    } else {
        console.log(`❌ 未发现正确IP地址: ${correctIP}`);
    }
    
    if (!hasWrongIP && content.includes(correctIP)) {
        console.log('\n✅ 配置文件已经是正确的！');
        console.log('MiniPC应该能够连接到PC服务器。');
        console.log('\n使用方法:');
        console.log('1. 在miniPC上运行: node mini-pc-client.js');
        console.log('2. 或者指定地址: node mini-pc-client.js ws://192.168.167.187:8080/ws');
    } else {
        console.log('\n❌ 配置文件需要修复！');
        
        // 修复错误的IP地址
        let fixedContent = content;
        
        // 替换所有错误的IP地址
        wrongIPs.forEach(ip => {
            const regex = new RegExp(ip.replace(/\./g, '\\.'), 'g');
            fixedContent = fixedContent.replace(regex, correctIP);
        });
        
        // 确保默认地址是正确的
        fixedContent = fixedContent.replace(
            /constructor\(serverUrl = 'ws:\/\/[^']+'\)/,
            `constructor(serverUrl = 'ws://${correctIP}:8080/ws')`
        );
        
        fixedContent = fixedContent.replace(
            /const serverUrl = process\.argv\[2\] \|\| '[^']+'/,
            `const serverUrl = process.argv[2] || 'ws://${correctIP}:8080/ws'`
        );
        
        // 写回文件
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        
        console.log('✅ 配置文件已修复！');
        console.log(`所有IP地址已更新为: ${correctIP}`);
    }
    
} catch (error) {
    console.error('❌ 修复失败:', error.message);
}

console.log('\n=== 修复完成 ===');
