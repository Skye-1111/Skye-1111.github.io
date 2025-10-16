const net = require('net');
const dns = require('dns');
const os = require('os');

console.log('=== 详细网络诊断工具 ===\n');

// 获取网络接口信息
function getNetworkInterfaces() {
    console.log('1. 网络接口信息:');
    const interfaces = os.networkInterfaces();
    
    Object.keys(interfaces).forEach(name => {
        console.log(`\n接口: ${name}`);
        interfaces[name].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`  - IPv4: ${iface.address}`);
                console.log(`  - 子网掩码: ${iface.netmask}`);
                console.log(`  - MAC: ${iface.mac}`);
            }
        });
    });
}

// 测试端口绑定
function testPortBinding(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, '0.0.0.0', () => {
            console.log(`\n2. 端口绑定测试:`);
            console.log(`✅ 端口 ${port} 可以绑定到 0.0.0.0`);
            
            // 测试从不同地址连接
            testConnections(port).then(() => {
                server.close();
                resolve(true);
            });
        });
        
        server.on('error', (err) => {
            console.log(`\n2. 端口绑定测试:`);
            console.log(`❌ 端口 ${port} 绑定失败: ${err.message}`);
            resolve(false);
        });
    });
}

// 测试从不同地址连接
function testConnections(port) {
    return new Promise((resolve) => {
        const addresses = ['127.0.0.1', 'localhost'];
        
        // 添加本机IP地址
        const interfaces = os.networkInterfaces();
        Object.keys(interfaces).forEach(name => {
            interfaces[name].forEach(iface => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    addresses.push(iface.address);
                }
            });
        });
        
        console.log(`\n3. 连接测试:`);
        let completed = 0;
        const total = addresses.length;
        
        addresses.forEach(addr => {
            const client = new net.Socket();
            
            client.connect(port, addr, () => {
                console.log(`✅ 连接成功: ${addr}:${port}`);
                client.destroy();
                completed++;
                if (completed === total) resolve();
            });
            
            client.on('error', (err) => {
                console.log(`❌ 连接失败: ${addr}:${port} - ${err.message}`);
                completed++;
                if (completed === total) resolve();
            });
            
            client.setTimeout(3000, () => {
                console.log(`⏰ 连接超时: ${addr}:${port}`);
                client.destroy();
                completed++;
                if (completed === total) resolve();
            });
        });
    });
}

// 检查端口占用
function checkPortUsage(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, '0.0.0.0', () => {
            console.log(`\n4. 端口占用检查:`);
            console.log(`✅ 端口 ${port} 可用`);
            server.close();
            resolve(true);
        });
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`\n4. 端口占用检查:`);
                console.log(`❌ 端口 ${port} 已被占用`);
            } else {
                console.log(`\n4. 端口占用检查:`);
                console.log(`❌ 端口 ${port} 检查失败: ${err.message}`);
            }
            resolve(false);
        });
    });
}

// DNS解析测试
function testDNSResolution() {
    return new Promise((resolve) => {
        console.log(`\n5. DNS解析测试:`);
        
        dns.lookup(os.hostname(), (err, address) => {
            if (err) {
                console.log(`❌ 主机名解析失败: ${err.message}`);
            } else {
                console.log(`✅ 主机名解析: ${os.hostname()} -> ${address}`);
            }
            resolve();
        });
    });
}

// 主函数
async function runDiagnosis() {
    const port = 8080;
    
    getNetworkInterfaces();
    
    await checkPortUsage(port);
    await testPortBinding(port);
    await testDNSResolution();
    
    console.log(`\n=== 诊断完成 ===`);
    console.log(`\n建议:`);
    console.log(`1. 确保防火墙允许端口 ${port}`);
    console.log(`2. 检查网络策略是否阻止外部连接`);
    console.log(`3. 尝试使用不同的端口号`);
    console.log(`4. 检查是否有其他程序占用端口`);
}

runDiagnosis().catch(console.error);
