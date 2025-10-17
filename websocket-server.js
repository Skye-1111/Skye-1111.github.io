/**
 * 激光雷达树木检测系统 - WebSocket服务器
 * 用于实时数据同步和多设备协作
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @description 提供WebSocket服务，支持实时数据同步、设备状态共享
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

class LidarWebSocketServer {
    constructor(port = 8080) {
        this.port = port;
        this.clients = new Map(); // 存储连接的客户端
        this.dataHistory = []; // 存储历史数据
        this.maxHistorySize = 1000; // 最大历史记录数
        
        // 创建HTTP服务器
        this.server = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });
        
        // 创建WebSocket服务器
        this.wss = new WebSocket.Server({ 
            server: this.server,
            path: '/ws'
        });
        
        this.setupWebSocketHandlers();
        this.setupDataPersistence();
    }
    
    /**
     * 处理HTTP请求（用于静态文件服务）
     */
    handleHttpRequest(req, res) {
        // 规范化路径并限制到项目根目录，防止路径遍历
        const publicRoot = __dirname;
        const requestedUrl = req.url === '/' ? '/index.html' : req.url;
        const safePath = path.normalize(requestedUrl).replace(/^\\+|^\/+/, ''); // 去掉开头的分隔符
        const resolvedPath = path.join(publicRoot, safePath);
        if (!resolvedPath.startsWith(publicRoot)) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Bad Request');
            return;
        }

        // 根据扩展名设置更完整的 Content-Type
        const ext = path.extname(resolvedPath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';

        fs.readFile(resolvedPath, (err, data) => {
            if (err) {
                res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(err.code === 'ENOENT' ? 'File not found' : 'Internal server error');
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }
    
    /**
     * 设置WebSocket事件处理器
     */
    setupWebSocketHandlers() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const clientInfo = {
                id: clientId,
                ws: ws,
                ip: req.socket.remoteAddress,
                connectedAt: new Date(),
                lastActivity: new Date(),
                deviceType: 'unknown'
            };
            
            this.clients.set(clientId, clientInfo);
            console.log(`[${new Date().toISOString()}] 客户端连接: ${clientId} (${clientInfo.ip})`);
            
            // 发送欢迎消息和历史数据
            this.sendToClient(ws, {
                type: 'welcome',
                clientId: clientId,
                message: '连接成功',
                timestamp: new Date().toISOString()
            });
            
            // 发送历史数据
            if (this.dataHistory.length > 0) {
                this.sendToClient(ws, {
                    type: 'history',
                    data: this.dataHistory.slice(-50), // 发送最近50条记录
                    timestamp: new Date().toISOString()
                });
            }
            
            // 处理客户端消息
            ws.on('message', (message) => {
                this.handleClientMessage(clientId, message);
            });
            
            // 处理客户端断开连接
            ws.on('close', () => {
                console.log(`[${new Date().toISOString()}] 客户端断开: ${clientId}`);
                this.clients.delete(clientId);
                this.broadcastClientList();
            });
            
            // 处理错误
            ws.on('error', (error) => {
                console.error(`[${new Date().toISOString()}] 客户端错误 ${clientId}:`, error);
            });
            
            // 发送当前客户端列表
            this.broadcastClientList();
        });
    }
    
    /**
     * 处理客户端消息
     */
    handleClientMessage(clientId, message) {
        try {
            const data = JSON.parse(message);
            const client = this.clients.get(clientId);
            
            if (client) {
                client.lastActivity = new Date();
                
                switch (data.type) {
                    case 'device_info':
                        client.deviceType = data.deviceType || 'unknown';
                        client.deviceName = data.deviceName || 'Unknown Device';
                        console.log(`[${new Date().toISOString()}] 设备信息更新: ${clientId} - ${client.deviceName}`);
                        this.broadcastClientList();
                        break;
                        
                    case 'scan_data':
                        this.handleScanData(clientId, data);
                        break;
                        
                    case 'tree_data':
                        this.handleTreeData(clientId, data);
                        break;
                        
                    case 'height_data':
                        this.handleHeightData(clientId, data);
                        break;
                        
                    case 'status_update':
                        this.handleStatusUpdate(clientId, data);
                        break;
                        
                    case 'remote_control':
                        this.handleRemoteControl(clientId, data);
                        break;
                        
                    case 'bluetooth_status':
                        this.handleBluetoothStatus(clientId, data);
                        break;
                        
                    case 'sensor_data':
                        this.handleSensorData(clientId, data);
                        break;
                        
                    case 'control_response':
                        this.handleControlResponse(clientId, data);
                        break;
                        
                    case 'bluetooth_response':
                        this.handleBluetoothResponse(clientId, data);
                        break;
                        
                    case 'error_response':
                        this.handleErrorResponse(clientId, data);
                        break;
                        
                    case 'command_forwarded':
                        this.handleCommandForwarded(clientId, data);
                        break;
                        
                    case 'ping':
                        this.sendToClient(client.ws, {
                            type: 'pong',
                            timestamp: new Date().toISOString()
                        });
                        break;
                        
                    default:
                        console.log(`[${new Date().toISOString()}] 未知消息类型: ${data.type}`);
                }
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 消息解析错误:`, error);
        }
    }
    
    /**
     * 处理扫描数据
     */
    handleScanData(clientId, data) {
        const scanData = {
            type: 'scan_data',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: {
                points: data.points,
                treeCount: data.treeCount,
                scanTime: data.scanTime,
                avgDistance: data.avgDistance,
                maxDistance: data.maxDistance
            }
        };
        
        this.addToHistory(scanData);
        this.broadcastToOthers(clientId, scanData);
    }
    
    /**
     * 处理树木数据
     */
    handleTreeData(clientId, data) {
        const treeData = {
            type: 'tree_data',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: {
                trees: data.trees,
                treeCount: data.treeCount,
                avgDiameter: data.avgDiameter
            }
        };
        
        this.addToHistory(treeData);
        this.broadcastToOthers(clientId, treeData);
    }
    
    /**
     * 处理高度数据
     */
    handleHeightData(clientId, data) {
        const heightData = {
            type: 'height_data',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: {
                currentHeight: data.currentHeight,
                avgHeight: data.avgHeight,
                heightCount: data.heightCount
            }
        };
        
        this.addToHistory(heightData);
        this.broadcastToOthers(clientId, heightData);
    }
    
    /**
     * 处理状态更新
     */
    handleStatusUpdate(clientId, data) {
        const statusData = {
            type: 'status_update',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: {
                lidarConnected: data.lidarConnected,
                stp23lConnected: data.stp23lConnected,
                isScanning: data.isScanning,
                isMeasuring: data.isMeasuring
            }
        };
        
        this.broadcastToOthers(clientId, statusData);
    }
    
    /**
     * 处理远程控制指令
     */
    handleRemoteControl(clientId, data) {
        console.log(`[${new Date().toISOString()}] 收到远程控制指令: ${data.command} (来自: ${clientId})`);
        console.log(`[${new Date().toISOString()}] 指令参数:`, data.parameters);
        
        // 转发给MiniPC客户端
        this.forwardToMiniPC(data);
        
        // 广播给其他客户端
        const controlData = {
            type: 'remote_control',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: {
                command: data.command,
                parameters: data.parameters,
                status: 'forwarded'
            }
        };
        
        this.broadcastToOthers(clientId, controlData);
    }
    
    /**
     * 处理蓝牙状态
     */
    handleBluetoothStatus(clientId, data) {
        console.log(`[${new Date().toISOString()}] 蓝牙状态更新: ${data.connected ? '已连接' : '未连接'}`);
        
        const bluetoothData = {
            type: 'bluetooth_status',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: {
                connected: data.connected,
                port: data.port,
                baudRate: data.baudRate
            }
        };
        
        this.broadcastToOthers(clientId, bluetoothData);
    }
    
    /**
     * 处理传感器数据
     */
    handleSensorData(clientId, data) {
        const sensorData = {
            type: 'sensor_data',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: data.data
        };
        
        this.addToHistory(sensorData);
        this.broadcastToOthers(clientId, sensorData);
    }
    
    /**
     * 处理控制响应
     */
    handleControlResponse(clientId, data) {
        console.log(`[${new Date().toISOString()}] 控制响应: ${data.data.command} - ${data.data.status}`);
        
        const responseData = {
            type: 'control_response',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: {
                command: data.data.command,
                status: data.data.status
            }
        };
        
        this.broadcastToOthers(clientId, responseData);
    }
    
    /**
     * 处理蓝牙响应
     */
    handleBluetoothResponse(clientId, data) {
        console.log(`[${new Date().toISOString()}] 蓝牙响应: ${data.data}`);
        
        const responseData = {
            type: 'bluetooth_response',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: data.data
        };
        
        this.broadcastToOthers(clientId, responseData);
    }
    
    /**
     * 处理错误响应
     */
    handleErrorResponse(clientId, data) {
        console.error(`[${new Date().toISOString()}] 设备错误响应:`, data);
        
        const errorData = {
            type: 'error_response',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        this.broadcastToOthers(clientId, errorData);
    }
    
    /**
     * 处理指令转发状态
     */
    handleCommandForwarded(clientId, data) {
        console.log(`[${new Date().toISOString()}] 指令转发状态: ${data.command} - ${data.status}`);
        
        const forwardedData = {
            type: 'command_forwarded',
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: {
                command: data.command,
                status: data.status,
                error: data.error
            }
        };
        
        this.broadcastToOthers(clientId, forwardedData);
    }
    
    /**
     * 转发给蓝牙桥接器
     */
    forwardToBluetoothBridge(data) {
        // 查找蓝牙桥接器客户端
        const bridgeClient = Array.from(this.clients.values())
            .find(client => client.deviceType === 'bluetooth_bridge');
        
        if (bridgeClient && bridgeClient.ws.readyState === WebSocket.OPEN) {
            this.sendToClient(bridgeClient.ws, {
                type: 'remote_control',
                command: data.command,
                parameters: data.parameters,
                timestamp: new Date().toISOString()
            });
            console.log(`[${new Date().toISOString()}] 指令已转发给蓝牙桥接器`);
            
            // 广播指令转发状态
            this.broadcast({
                type: 'command_forwarded',
                command: data.command,
                status: 'success',
                timestamp: new Date().toISOString()
            });
        } else {
            console.log(`[${new Date().toISOString()}] 蓝牙桥接器未连接，无法转发指令`);
            
            // 广播指令转发失败状态
            this.broadcast({
                type: 'command_forwarded',
                command: data.command,
                status: 'failed',
                error: '蓝牙桥接器未连接',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * 转发给MiniPC客户端
     */
    forwardToMiniPC(data) {
        // 查找MiniPC客户端
        const minipcClient = Array.from(this.clients.values())
            .find(client => client.deviceType === 'minipc');
        
        if (minipcClient && minipcClient.ws.readyState === WebSocket.OPEN) {
            this.sendToClient(minipcClient.ws, {
                type: 'remote_control',
                command: data.command,
                parameters: data.parameters,
                timestamp: new Date().toISOString()
            });
            console.log(`[${new Date().toISOString()}] 指令已转发给MiniPC客户端`);
            
            // 广播指令转发状态
            this.broadcast({
                type: 'command_forwarded',
                command: data.command,
                status: 'success',
                timestamp: new Date().toISOString()
            });
        } else {
            console.log(`[${new Date().toISOString()}] MiniPC客户端未连接，无法转发指令`);
            
            // 广播指令转发失败状态
            this.broadcast({
                type: 'command_forwarded',
                command: data.command,
                status: 'failed',
                error: 'MiniPC客户端未连接',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * 添加到历史记录
     */
    addToHistory(data) {
        this.dataHistory.push(data);
        
        // 限制历史记录大小
        if (this.dataHistory.length > this.maxHistorySize) {
            this.dataHistory = this.dataHistory.slice(-this.maxHistorySize);
        }
    }
    
    /**
     * 广播给其他客户端（排除发送者）
     */
    broadcastToOthers(senderId, data) {
        this.clients.forEach((client, clientId) => {
            if (clientId !== senderId && client.ws.readyState === WebSocket.OPEN) {
                // MiniPC客户端不接收远程控制的广播消息，因为它已经通过forwardToMiniPC直接接收了
                if (data.type === 'remote_control' && client.deviceType === 'minipc') {
                    return;
                }
                this.sendToClient(client.ws, data);
            }
        });
    }
    
    /**
     * 广播客户端列表
     */
    broadcastClientList() {
        const clientList = Array.from(this.clients.values()).map(client => ({
            id: client.id,
            deviceType: client.deviceType,
            deviceName: client.deviceName || 'Unknown Device',
            connectedAt: client.connectedAt,
            lastActivity: client.lastActivity
        }));
        
        const message = {
            type: 'client_list',
            clients: clientList,
            timestamp: new Date().toISOString()
        };
        
        this.broadcast(message);
    }
    
    /**
     * 广播消息给所有客户端
     */
    broadcast(data) {
        this.clients.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                this.sendToClient(client.ws, data);
            }
        });
    }
    
    /**
     * 发送消息给指定客户端
     */
    sendToClient(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
    
    /**
     * 生成客户端ID
     */
    generateClientId() {
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 设置数据持久化
     */
    setupDataPersistence() {
        // 每5分钟保存一次数据
        setInterval(() => {
            this.saveDataToFile();
        }, 5 * 60 * 1000);
        
        // 启动时加载数据
        this.loadDataFromFile();
    }
    
    /**
     * 保存数据到文件
     */
    saveDataToFile() {
        const dataFile = path.join(__dirname, 'data', 'lidar_data.json');
        const dataDir = path.dirname(dataFile);
        
        // 确保目录存在
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const data = {
            timestamp: new Date().toISOString(),
            history: this.dataHistory,
            clients: Array.from(this.clients.keys())
        };
        
        fs.writeFile(dataFile, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                console.error('保存数据失败:', err);
            } else {
                console.log(`[${new Date().toISOString()}] 数据已保存到文件`);
            }
        });
    }
    
    /**
     * 从文件加载数据
     */
    loadDataFromFile() {
        const dataFile = path.join(__dirname, 'data', 'lidar_data.json');
        
        fs.readFile(dataFile, 'utf8', (err, data) => {
            if (err) {
                console.log('没有找到历史数据文件，将创建新的数据存储');
                return;
            }
            
            try {
                const parsedData = JSON.parse(data);
                this.dataHistory = parsedData.history || [];
                console.log(`[${new Date().toISOString()}] 已加载 ${this.dataHistory.length} 条历史记录`);
            } catch (error) {
                console.error('加载历史数据失败:', error);
            }
        });
    }
    
    /**
     * 启动服务器
     */
    start() {
        this.server.listen(this.port, () => {
            console.log(`[${new Date().toISOString()}] 激光雷达WebSocket服务器已启动`);
            console.log(`[${new Date().toISOString()}] HTTP服务器: http://localhost:${this.port}`);
            console.log(`[${new Date().toISOString()}] WebSocket服务器: ws://localhost:${this.port}/ws`);
            console.log(`[${new Date().toISOString()}] 等待客户端连接...`);
        });
    }
    
    /**
     * 停止服务器
     */
    stop() {
        console.log(`[${new Date().toISOString()}] 正在停止服务器...`);
        
        // 保存数据
        this.saveDataToFile();
        
        // 关闭所有客户端连接
        this.clients.forEach((client) => {
            client.ws.close();
        });
        
        // 关闭服务器
        this.server.close(() => {
            console.log(`[${new Date().toISOString()}] 服务器已停止`);
        });
    }
}

// 启动服务器
const server = new LidarWebSocketServer(8080);

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n收到中断信号，正在关闭服务器...');
    server.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n收到终止信号，正在关闭服务器...');
    server.stop();
    process.exit(0);
});

server.start();

module.exports = LidarWebSocketServer;
