/**
 * MiniPC端数据采集和WebSocket客户端 - 调试版本
 * 简化版本用于调试连接问题
 */

const WebSocket = require('ws');

class MiniPCDebugClient {
    constructor(serverUrl = 'ws://192.168.167.187:8080/ws') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.isConnected = false;
        this.deviceId = 'minipc_debug_' + Math.random().toString(36).substr(2, 9);
        
        // 设备状态
        this.deviceStatus = {
            lidarConnected: false,
            stp23lConnected: false,
            isScanning: false,
            isMeasuring: false,
            lidarPort: null,
            stp23lPort: null
        };
        
        this.init();
    }
    
    /**
     * 初始化客户端
     */
    async init() {
        console.log(`[${new Date().toISOString()}] MiniPC调试客户端初始化中...`);
        
        try {
            // 连接WebSocket服务器
            await this.connectWebSocket();
            console.log(`[${new Date().toISOString()}] MiniPC调试客户端初始化完成`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 初始化失败:`, error);
        }
    }
    
    /**
     * 连接WebSocket服务器
     */
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            console.log(`[${new Date().toISOString()}] 正在连接WebSocket服务器: ${this.serverUrl}`);
            
            this.ws = new WebSocket(this.serverUrl);
            
            this.ws.on('open', () => {
                console.log(`[${new Date().toISOString()}] 已连接到WebSocket服务器`);
                this.isConnected = true;
                
                // 发送设备信息
                const deviceInfo = {
                    type: 'device_info',
                    deviceType: 'minipc',
                    deviceName: 'MiniPC调试客户端',
                    deviceId: this.deviceId,
                    status: this.deviceStatus
                };
                
                console.log(`[${new Date().toISOString()}] 发送设备信息:`, deviceInfo);
                this.ws.send(JSON.stringify(deviceInfo));
                
                // 立即发送当前状态
                this.sendStatusUpdate();
                
                resolve();
            });
            
            this.ws.on('message', (data) => {
                console.log(`[${new Date().toISOString()}] 收到服务器消息:`, data.toString());
                this.handleWebSocketMessage(data);
            });
            
            this.ws.on('error', (error) => {
                console.error(`[${new Date().toISOString()}] WebSocket连接错误:`, error);
                reject(error);
            });
            
            this.ws.on('close', (code, reason) => {
                console.log(`[${new Date().toISOString()}] WebSocket连接已断开 - 代码: ${code}, 原因: ${reason}`);
                this.isConnected = false;
                
                // 尝试重连
                console.log(`[${new Date().toISOString()}] 5秒后尝试重连...`);
                setTimeout(() => {
                    this.connectWebSocket().catch(err => {
                        console.error(`[${new Date().toISOString()}] 重连失败:`, err);
                    });
                }, 5000);
            });
        });
    }
    
    /**
     * 处理WebSocket消息
     */
    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log(`[${new Date().toISOString()}] 解析消息:`, message);
            
            switch (message.type) {
                case 'welcome':
                    console.log(`[${new Date().toISOString()}] 服务器欢迎消息: ${message.message || '连接成功'}`);
                    break;
                    
                case 'client_list':
                    console.log(`[${new Date().toISOString()}] 收到客户端列表更新`);
                    break;
                    
                case 'status_update':
                    console.log(`[${new Date().toISOString()}] 收到服务器状态更新`);
                    break;
                    
                case 'ping':
                    console.log(`[${new Date().toISOString()}] 收到ping，发送pong`);
                    this.ws.send(JSON.stringify({
                        type: 'pong',
                        timestamp: new Date().toISOString()
                    }));
                    break;
                    
                default:
                    console.log(`[${new Date().toISOString()}] 收到未知消息类型: ${message.type}`);
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] WebSocket消息解析错误:`, error);
        }
    }
    
    /**
     * 发送状态更新
     */
    sendStatusUpdate() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const statusUpdate = {
                type: 'status_update',
                data: this.deviceStatus,
                timestamp: new Date().toISOString()
            };
            
            console.log(`[${new Date().toISOString()}] 发送状态更新:`, statusUpdate);
            this.ws.send(JSON.stringify(statusUpdate));
        }
    }
    
    /**
     * 断开连接
     */
    disconnect() {
        console.log(`[${new Date().toISOString()}] 正在断开MiniPC调试客户端连接...`);
        
        if (this.ws) {
            this.ws.close();
        }
        
        this.isConnected = false;
    }
}

// 启动MiniPC调试客户端
if (require.main === module) {
    // 从命令行参数获取服务器URL
    const serverUrl = process.argv[2] || 'ws://192.168.167.187:8080/ws';
    console.log(`[${new Date().toISOString()}] 启动MiniPC调试客户端，服务器: ${serverUrl}`);
    
    const client = new MiniPCDebugClient(serverUrl);
    
    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n收到中断信号，正在关闭MiniPC调试客户端...');
        client.disconnect();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n收到终止信号，正在关闭MiniPC调试客户端...');
        client.disconnect();
        process.exit(0);
    });
    
    // 定期发送心跳
    setInterval(() => {
        if (client.isConnected) {
            console.log(`[${new Date().toISOString()}] 发送心跳...`);
            client.sendStatusUpdate();
        }
    }, 30000); // 每30秒发送一次心跳
}

module.exports = MiniPCDebugClient;

