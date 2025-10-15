/**
 * 蓝牙桥接模块 - 用于连接HC-05蓝牙模块
 * 负责接收WebSocket控制指令并转发给蓝牙设备
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @description 蓝牙桥接器，连接HC-05模块实现远程控制
 */

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const WebSocket = require('ws');

class BluetoothBridge {
    constructor(websocketUrl = 'ws://localhost:8080/ws') {
        this.websocketUrl = websocketUrl;
        this.serialPort = null;
        this.parser = null;
        this.ws = null;
        this.isConnected = false;
        this.deviceId = 'bluetooth_bridge_' + Math.random().toString(36).substr(2, 9);
        
        // 蓝牙配置
        this.bluetoothConfig = {
            baudRate: 9600,  // HC-05默认波特率
            dataBits: 8,
            stopBits: 1,
            parity: 'none'
        };
        
        // 指令映射表
        this.commandMap = {
            'connect_lidar': 'LIDAR_CONNECT',
            'disconnect_lidar': 'LIDAR_DISCONNECT',
            'start_scan': 'LIDAR_START_SCAN',
            'stop_scan': 'LIDAR_STOP_SCAN',
            'single_scan': 'LIDAR_SINGLE_SCAN',
            'detect_trees': 'LIDAR_DETECT_TREES',
            'clear_trees': 'LIDAR_CLEAR_TREES',
            'connect_stp23l': 'STP23L_CONNECT',
            'disconnect_stp23l': 'STP23L_DISCONNECT',
            'start_height_measure': 'STP23L_START_MEASURE',
            'stop_height_measure': 'STP23L_STOP_MEASURE',
            'get_status': 'GET_STATUS',
            'reset_system': 'RESET_SYSTEM'
        };
        
        this.init();
    }
    
    /**
     * 初始化蓝牙桥接器
     */
    async init() {
        console.log(`[${new Date().toISOString()}] 蓝牙桥接器初始化中...`);
        
        // 连接WebSocket服务器
        await this.connectWebSocket();
        
        // 扫描并连接蓝牙设备
        await this.scanAndConnectBluetooth();
        
        console.log(`[${new Date().toISOString()}] 蓝牙桥接器初始化完成`);
    }
    
    /**
     * 连接WebSocket服务器
     */
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.websocketUrl);
            
            this.ws.on('open', () => {
                console.log(`[${new Date().toISOString()}] 已连接到WebSocket服务器`);
                
                // 发送设备信息
                this.ws.send(JSON.stringify({
                    type: 'device_info',
                    deviceType: 'bluetooth_bridge',
                    deviceName: 'HC-05蓝牙桥接器',
                    deviceId: this.deviceId
                }));
                
                resolve();
            });
            
            this.ws.on('message', (data) => {
                this.handleWebSocketMessage(data);
            });
            
            this.ws.on('error', (error) => {
                console.error(`[${new Date().toISOString()}] WebSocket连接错误:`, error);
                reject(error);
            });
            
            this.ws.on('close', () => {
                console.log(`[${new Date().toISOString()}] WebSocket连接已断开`);
                // 尝试重连
                setTimeout(() => {
                    this.connectWebSocket();
                }, 5000);
            });
        });
    }
    
    /**
     * 扫描并连接蓝牙设备
     */
    async scanAndConnectBluetooth() {
        try {
            console.log(`[${new Date().toISOString()}] 扫描蓝牙设备...`);
            
            // 获取可用串口列表
            const ports = await SerialPort.list();
            console.log(`[${new Date().toISOString()}] 发现 ${ports.length} 个串口设备:`);
            ports.forEach(port => {
                console.log(`  - ${port.path}: ${port.manufacturer || 'Unknown'} ${port.productId || ''}`);
            });
            
            // 查找HC-05设备（通常包含HC-05或蓝牙相关标识）
            const hc05Port = ports.find(port => 
                port.manufacturer && (
                    port.manufacturer.toLowerCase().includes('hc-05') ||
                    port.manufacturer.toLowerCase().includes('bluetooth') ||
                    port.manufacturer.toLowerCase().includes('ch340') ||
                    port.manufacturer.toLowerCase().includes('cp210')
                )
            );
            
            if (hc05Port) {
                console.log(`[${new Date().toISOString()}] 找到HC-05设备: ${hc05Port.path}`);
                await this.connectToBluetooth(hc05Port.path);
            } else {
                console.log(`[${new Date().toISOString()}] 未找到HC-05设备，尝试连接第一个可用串口`);
                if (ports.length > 0) {
                    await this.connectToBluetooth(ports[0].path);
                } else {
                    throw new Error('未找到可用的串口设备');
                }
            }
            
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 蓝牙设备扫描失败:`, error);
            // 5秒后重试
            setTimeout(() => {
                this.scanAndConnectBluetooth();
            }, 5000);
        }
    }
    
    /**
     * 连接到蓝牙设备
     */
    async connectToBluetooth(portPath) {
        return new Promise((resolve, reject) => {
            try {
                this.serialPort = new SerialPort(portPath, this.bluetoothConfig);
                this.parser = this.serialPort.pipe(new Readline({ delimiter: '\n' }));
                
                this.serialPort.on('open', () => {
                    console.log(`[${new Date().toISOString()}] 已连接到蓝牙设备: ${portPath}`);
                    this.isConnected = true;
                    
                    // 发送蓝牙状态更新
                    this.sendBluetoothStatus(true, portPath);
                    
                    // 发送测试指令
                    this.sendCommand('GET_STATUS');
                    
                    resolve();
                });
                
                this.serialPort.on('error', (error) => {
                    console.error(`[${new Date().toISOString()}] 蓝牙设备错误:`, error);
                    this.isConnected = false;
                    this.sendBluetoothStatus(false, portPath);
                    reject(error);
                });
                
                this.serialPort.on('close', () => {
                    console.log(`[${new Date().toISOString()}] 蓝牙设备连接已断开`);
                    this.isConnected = false;
                    this.sendBluetoothStatus(false, portPath);
                    
                    // 尝试重连
                    setTimeout(() => {
                        this.scanAndConnectBluetooth();
                    }, 5000);
                });
                
                // 监听蓝牙设备响应
                this.parser.on('data', (data) => {
                    this.handleBluetoothResponse(data.trim());
                });
                
            } catch (error) {
                console.error(`[${new Date().toISOString()}] 连接蓝牙设备失败:`, error);
                reject(error);
            }
        });
    }
    
    /**
     * 处理WebSocket消息
     */
    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'remote_control':
                    this.handleRemoteControl(message);
                    break;
                    
                case 'ping':
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
     * 处理远程控制指令
     */
    handleRemoteControl(message) {
        const { command, parameters } = message;
        
        console.log(`[${new Date().toISOString()}] 收到远程控制指令: ${command}`);
        
        // 检查指令是否在映射表中
        if (this.commandMap[command]) {
            const bluetoothCommand = this.commandMap[command];
            this.sendCommand(bluetoothCommand, parameters);
            
            // 发送控制响应
            this.sendControlResponse(command, 'forwarded');
        } else {
            console.log(`[${new Date().toISOString()}] 未知控制指令: ${command}`);
            this.sendControlResponse(command, 'unknown_command');
        }
    }
    
    /**
     * 发送指令到蓝牙设备
     */
    sendCommand(command, parameters = null) {
        if (!this.isConnected || !this.serialPort) {
            console.log(`[${new Date().toISOString()}] 蓝牙设备未连接，无法发送指令: ${command}`);
            return false;
        }
        
        try {
            let commandString = command;
            
            // 添加参数
            if (parameters) {
                commandString += ':' + JSON.stringify(parameters);
            }
            
            // 添加时间戳和校验
            const timestamp = Date.now();
            const checksum = this.calculateChecksum(commandString);
            const fullCommand = `${commandString}|${timestamp}|${checksum}\n`;
            
            this.serialPort.write(fullCommand);
            console.log(`[${new Date().toISOString()}] 已发送蓝牙指令: ${commandString}`);
            
            return true;
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 发送蓝牙指令失败:`, error);
            return false;
        }
    }
    
    /**
     * 处理蓝牙设备响应
     */
    handleBluetoothResponse(data) {
        try {
            console.log(`[${new Date().toISOString()}] 收到蓝牙响应: ${data}`);
            
            // 解析响应数据
            const parts = data.split('|');
            if (parts.length >= 2) {
                const command = parts[0];
                const timestamp = parts[1];
                const checksum = parts[2];
                
                // 验证校验和
                if (this.verifyChecksum(command, checksum)) {
                    this.processBluetoothCommand(command, timestamp);
                } else {
                    console.log(`[${new Date().toISOString()}] 蓝牙响应校验失败: ${data}`);
                }
            } else {
                // 简单响应处理
                this.processSimpleResponse(data);
            }
            
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 处理蓝牙响应失败:`, error);
        }
    }
    
    /**
     * 处理蓝牙指令响应
     */
    processBluetoothCommand(command, timestamp) {
        const parts = command.split(':');
        const cmd = parts[0];
        const data = parts[1] ? JSON.parse(parts[1]) : null;
        
        // 根据指令类型处理响应
        switch (cmd) {
            case 'STATUS_RESPONSE':
                this.handleStatusResponse(data);
                break;
                
            case 'SCAN_DATA':
                this.handleScanData(data);
                break;
                
            case 'TREE_DATA':
                this.handleTreeData(data);
                break;
                
            case 'HEIGHT_DATA':
                this.handleHeightData(data);
                break;
                
            case 'ERROR_RESPONSE':
                this.handleErrorResponse(data);
                break;
                
            default:
                console.log(`[${new Date().toISOString()}] 未知蓝牙指令: ${cmd}`);
        }
    }
    
    /**
     * 处理简单响应
     */
    processSimpleResponse(response) {
        // 发送到WebSocket服务器
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'bluetooth_response',
                data: response,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 处理状态响应
     */
    handleStatusResponse(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'status_update',
                data: data,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 处理扫描数据
     */
    handleScanData(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'scan_data',
                data: data,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 处理树木数据
     */
    handleTreeData(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'tree_data',
                data: data,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 处理高度数据
     */
    handleHeightData(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'height_data',
                data: data,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 处理错误响应
     */
    handleErrorResponse(data) {
        console.error(`[${new Date().toISOString()}] 蓝牙设备错误:`, data);
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'error_response',
                data: data,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 发送蓝牙状态
     */
    sendBluetoothStatus(connected, port = null) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'bluetooth_status',
                data: {
                    connected: connected,
                    port: port,
                    baudRate: this.bluetoothConfig.baudRate
                },
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 发送控制响应
     */
    sendControlResponse(command, status) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'control_response',
                data: {
                    command: command,
                    status: status
                },
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 计算校验和
     */
    calculateChecksum(data) {
        let checksum = 0;
        for (let i = 0; i < data.length; i++) {
            checksum += data.charCodeAt(i);
        }
        return checksum % 256;
    }
    
    /**
     * 验证校验和
     */
    verifyChecksum(data, checksum) {
        return this.calculateChecksum(data) === parseInt(checksum);
    }
    
    /**
     * 断开连接
     */
    disconnect() {
        console.log(`[${new Date().toISOString()}] 正在断开蓝牙桥接器连接...`);
        
        if (this.serialPort) {
            this.serialPort.close();
        }
        
        if (this.ws) {
            this.ws.close();
        }
        
        this.isConnected = false;
    }
}

// 启动蓝牙桥接器
if (require.main === module) {
    const bridge = new BluetoothBridge();
    
    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n收到中断信号，正在关闭蓝牙桥接器...');
        bridge.disconnect();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n收到终止信号，正在关闭蓝牙桥接器...');
        bridge.disconnect();
        process.exit(0);
    });
}

module.exports = BluetoothBridge;