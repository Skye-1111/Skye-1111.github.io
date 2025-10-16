/**
 * MiniPC端数据采集和WebSocket客户端
 * 运行在Ubuntu系统的miniPC上，负责连接激光雷达和STP-23L传感器
 * 通过WebSocket与上位机通信
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @description MiniPC端数据采集客户端
 */

const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');
const path = require('path');

class MiniPCClient {
    constructor(serverUrl = 'ws://192.168.167.187:8080/ws') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.isConnected = false;
        this.deviceId = 'minipc_' + Math.random().toString(36).substr(2, 9);
        
        // 激光雷达配置
        this.lidarConfig = {
            baudRate: 115200,
            dataBits: 8,
            stopBits: 1,
            parity: 'none'
        };
        
        // STP-23L传感器配置
        this.stp23lConfig = {
            baudRate: 230400,
            dataBits: 8,
            stopBits: 1,
            parity: 'none'
        };
        
        // 设备状态
        this.deviceStatus = {
            lidarConnected: false,
            stp23lConnected: false,
            isScanning: false,
            isMeasuring: false,
            lidarPort: null,
            stp23lPort: null
        };
        
        // 数据存储
        this.scanData = [];
        this.treeData = [];
        this.heightData = [];
        
        this.init();
    }
    
    /**
     * 初始化客户端
     */
    async init() {
        console.log(`[${new Date().toISOString()}] MiniPC客户端初始化中...`);
        
        // 连接WebSocket服务器
        await this.connectWebSocket();
        
        // 扫描可用设备（但不自动连接）
        await this.scanAvailableDevices();
        
        console.log(`[${new Date().toISOString()}] MiniPC客户端初始化完成`);
    }
    
    /**
     * 连接WebSocket服务器
     */
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.serverUrl);
            
            this.ws.on('open', () => {
                console.log(`[${new Date().toISOString()}] 已连接到WebSocket服务器`);
                this.isConnected = true;
                
                // 发送设备信息
                this.ws.send(JSON.stringify({
                    type: 'device_info',
                    deviceType: 'minipc',
                    deviceName: 'MiniPC数据采集端',
                    deviceId: this.deviceId,
                    status: this.deviceStatus
                }));
                
                // 立即发送当前状态
                this.sendStatusUpdate();
                
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
                this.isConnected = false;
                // 尝试重连
                setTimeout(() => {
                    this.connectWebSocket();
                }, 5000);
            });
        });
    }
    
    /**
     * 扫描可用设备
     */
    async scanAvailableDevices() {
        try {
            console.log(`[${new Date().toISOString()}] 扫描可用设备...`);
            
            // 获取可用串口列表
            const { SerialPort } = require('serialport');
            const ports = await SerialPort.list();
            console.log(`[${new Date().toISOString()}] 发现 ${ports.length} 个串口设备:`);
            ports.forEach(port => {
                console.log(`  - ${port.path}: ${port.manufacturer || 'Unknown'} ${port.productId || ''}`);
            });
            
            // 查找激光雷达设备
            const lidarPort = ports.find(port => 
                port.manufacturer && (
                    port.manufacturer.toLowerCase().includes('hokuyo') ||
                    port.manufacturer.toLowerCase().includes('urg') ||
                    port.manufacturer.toLowerCase().includes('lidar')
                )
            );
            
            // 查找STP-23L传感器
            const stp23lPort = ports.find(port => 
                port.manufacturer && (
                    port.manufacturer.toLowerCase().includes('stp') ||
                    port.manufacturer.toLowerCase().includes('23l') ||
                    port.manufacturer.toLowerCase().includes('height')
                )
            );
            
            // 保存可用设备信息，但不自动连接
            if (lidarPort) {
                console.log(`[${new Date().toISOString()}] 发现激光雷达设备: ${lidarPort.path}`);
                this.availableLidarPort = lidarPort.path;
            } else {
                console.log(`[${new Date().toISOString()}] 未发现激光雷达设备`);
                this.availableLidarPort = null;
            }
            
            if (stp23lPort) {
                console.log(`[${new Date().toISOString()}] 发现STP-23L传感器: ${stp23lPort.path}`);
                this.availableSTP23LPort = stp23lPort.path;
            } else {
                console.log(`[${new Date().toISOString()}] 未发现STP-23L传感器`);
                this.availableSTP23LPort = null;
            }
            
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 设备扫描失败:`, error);
        }
    }
    
    /**
     * 连接激光雷达
     */
    async connectLidar(portPath) {
        return new Promise((resolve, reject) => {
            try {
                const lidarPort = new SerialPort(portPath, this.lidarConfig);
                const lidarParser = lidarPort.pipe(new ReadlineParser({ delimiter: '\n' }));
                
                lidarPort.on('open', () => {
                    console.log(`[${new Date().toISOString()}] 激光雷达已连接: ${portPath}`);
                    this.deviceStatus.lidarConnected = true;
                    this.deviceStatus.lidarPort = portPath;
                    
                    // 发送状态更新
                    this.sendStatusUpdate();
                    
                    resolve();
                });
                
                lidarPort.on('error', (error) => {
                    console.error(`[${new Date().toISOString()}] 激光雷达连接错误:`, error);
                    this.deviceStatus.lidarConnected = false;
                    this.deviceStatus.lidarPort = null;
                    this.sendStatusUpdate();
                    reject(error);
                });
                
                lidarPort.on('close', () => {
                    console.log(`[${new Date().toISOString()}] 激光雷达连接已断开`);
                    this.deviceStatus.lidarConnected = false;
                    this.deviceStatus.lidarPort = null;
                    this.sendStatusUpdate();
                });
                
                // 监听激光雷达数据
                lidarParser.on('data', (data) => {
                    this.handleLidarData(data.trim());
                });
                
                // 保存端口引用
                this.lidarPort = lidarPort;
                this.lidarParser = lidarParser;
                
            } catch (error) {
                console.error(`[${new Date().toISOString()}] 连接激光雷达失败:`, error);
                reject(error);
            }
        });
    }
    
    /**
     * 连接STP-23L传感器
     */
    async connectSTP23L(portPath) {
        return new Promise((resolve, reject) => {
            try {
                const stp23lPort = new SerialPort(portPath, this.stp23lConfig);
                const stp23lParser = stp23lPort.pipe(new ReadlineParser({ delimiter: '\n' }));
                
                stp23lPort.on('open', () => {
                    console.log(`[${new Date().toISOString()}] STP-23L传感器已连接: ${portPath}`);
                    this.deviceStatus.stp23lConnected = true;
                    this.deviceStatus.stp23lPort = portPath;
                    
                    // 发送状态更新
                    this.sendStatusUpdate();
                    
                    resolve();
                });
                
                stp23lPort.on('error', (error) => {
                    console.error(`[${new Date().toISOString()}] STP-23L传感器连接错误:`, error);
                    this.deviceStatus.stp23lConnected = false;
                    this.deviceStatus.stp23lPort = null;
                    this.sendStatusUpdate();
                    reject(error);
                });
                
                stp23lPort.on('close', () => {
                    console.log(`[${new Date().toISOString()}] STP-23L传感器连接已断开`);
                    this.deviceStatus.stp23lConnected = false;
                    this.deviceStatus.stp23lPort = null;
                    this.sendStatusUpdate();
                });
                
                // 监听STP-23L数据
                stp23lParser.on('data', (data) => {
                    this.handleSTP23LData(data.trim());
                });
                
                // 保存端口引用
                this.stp23lPort = stp23lPort;
                this.stp23lParser = stp23lParser;
                
            } catch (error) {
                console.error(`[${new Date().toISOString()}] 连接STP-23L传感器失败:`, error);
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
                    
                case 'welcome':
                    console.log(`[${new Date().toISOString()}] 服务器欢迎消息: ${message.message}`);
                    break;
                    
                case 'client_list':
                    // 服务器发送的客户端列表，可以忽略
                    break;
                    
                case 'status_update':
                    // 服务器发送的状态更新，可以忽略
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
        
        switch (command) {
            case 'connect_lidar':
                this.connectLidarCommand();
                break;
                
            case 'disconnect_lidar':
                this.disconnectLidarCommand();
                break;
                
            case 'start_scan':
                this.startScanCommand();
                break;
                
            case 'stop_scan':
                this.stopScanCommand();
                break;
                
            case 'single_scan':
                this.singleScanCommand();
                break;
                
            case 'detect_trees':
                this.detectTreesCommand();
                break;
                
            case 'connect_stp23l':
                this.connectSTP23LCommand();
                break;
                
            case 'disconnect_stp23l':
                this.disconnectSTP23LCommand();
                break;
                
            case 'start_height_measure':
                this.startHeightMeasureCommand();
                break;
                
            case 'stop_height_measure':
                this.stopHeightMeasureCommand();
                break;
                
            case 'get_status':
                this.getStatusCommand();
                break;
                
            default:
                console.log(`[${new Date().toISOString()}] 未知控制指令: ${command}`);
                this.sendControlResponse(command, 'unknown_command');
        }
    }
    
    /**
     * 连接激光雷达指令
     */
    async connectLidarCommand() {
        try {
            if (this.deviceStatus.lidarConnected) {
                this.sendControlResponse('connect_lidar', 'already_connected');
                return;
            }
            
            // 重新扫描设备
            await this.scanAvailableDevices();
            
            if (this.availableLidarPort) {
                console.log(`[${new Date().toISOString()}] 尝试连接激光雷达: ${this.availableLidarPort}`);
                await this.connectLidar(this.availableLidarPort);
                
                if (this.deviceStatus.lidarConnected) {
                    this.sendControlResponse('connect_lidar', 'success');
                } else {
                    this.sendControlResponse('connect_lidar', 'failed');
                }
            } else {
                console.log(`[${new Date().toISOString()}] 未找到可用的激光雷达设备`);
                this.sendControlResponse('connect_lidar', 'no_device_found');
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 连接激光雷达失败:`, error);
            this.sendControlResponse('connect_lidar', 'error');
        }
    }
    
    /**
     * 断开激光雷达指令
     */
    disconnectLidarCommand() {
        try {
            if (this.lidarPort) {
                this.lidarPort.close();
                this.lidarPort = null;
                this.lidarParser = null;
            }
            
            this.deviceStatus.lidarConnected = false;
            this.deviceStatus.lidarPort = null;
            this.sendStatusUpdate();
            
            this.sendControlResponse('disconnect_lidar', 'success');
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 断开激光雷达失败:`, error);
            this.sendControlResponse('disconnect_lidar', 'error');
        }
    }
    
    /**
     * 开始扫描指令
     */
    startScanCommand() {
        try {
            if (!this.deviceStatus.lidarConnected) {
                this.sendControlResponse('start_scan', 'lidar_not_connected');
                return;
            }
            
            this.deviceStatus.isScanning = true;
            this.sendStatusUpdate();
            
            // 开始连续扫描
            this.startContinuousScan();
            
            this.sendControlResponse('start_scan', 'success');
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 开始扫描失败:`, error);
            this.sendControlResponse('start_scan', 'error');
        }
    }
    
    /**
     * 停止扫描指令
     */
    stopScanCommand() {
        try {
            this.deviceStatus.isScanning = false;
            this.sendStatusUpdate();
            
            this.sendControlResponse('stop_scan', 'success');
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 停止扫描失败:`, error);
            this.sendControlResponse('stop_scan', 'error');
        }
    }
    
    /**
     * 单次扫描指令
     */
    singleScanCommand() {
        try {
            if (!this.deviceStatus.lidarConnected) {
                this.sendControlResponse('single_scan', 'lidar_not_connected');
                return;
            }
            
            // 执行单次扫描
            this.performSingleScan();
            
            this.sendControlResponse('single_scan', 'success');
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 单次扫描失败:`, error);
            this.sendControlResponse('single_scan', 'error');
        }
    }
    
    /**
     * 检测树木指令
     */
    detectTreesCommand() {
        try {
            if (this.scanData.length === 0) {
                this.sendControlResponse('detect_trees', 'no_scan_data');
                return;
            }
            
            // 执行树木检测算法
            const trees = this.detectTrees(this.scanData);
            this.treeData = trees;
            
            // 发送树木数据
            this.sendTreeData(trees);
            
            this.sendControlResponse('detect_trees', 'success');
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 检测树木失败:`, error);
            this.sendControlResponse('detect_trees', 'error');
        }
    }
    
    /**
     * 连接STP-23L指令
     */
    async connectSTP23LCommand() {
        try {
            if (this.deviceStatus.stp23lConnected) {
                this.sendControlResponse('connect_stp23l', 'already_connected');
                return;
            }
            
            // 重新扫描设备
            await this.scanAvailableDevices();
            
            if (this.availableSTP23LPort) {
                console.log(`[${new Date().toISOString()}] 尝试连接STP-23L传感器: ${this.availableSTP23LPort}`);
                await this.connectSTP23L(this.availableSTP23LPort);
                
                if (this.deviceStatus.stp23lConnected) {
                    this.sendControlResponse('connect_stp23l', 'success');
                } else {
                    this.sendControlResponse('connect_stp23l', 'failed');
                }
            } else {
                console.log(`[${new Date().toISOString()}] 未找到可用的STP-23L传感器`);
                this.sendControlResponse('connect_stp23l', 'no_device_found');
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 连接STP-23L失败:`, error);
            this.sendControlResponse('connect_stp23l', 'error');
        }
    }
    
    /**
     * 断开STP-23L指令
     */
    disconnectSTP23LCommand() {
        try {
            if (this.stp23lPort) {
                this.stp23lPort.close();
                this.stp23lPort = null;
                this.stp23lParser = null;
            }
            
            this.deviceStatus.stp23lConnected = false;
            this.deviceStatus.stp23lPort = null;
            this.sendStatusUpdate();
            
            this.sendControlResponse('disconnect_stp23l', 'success');
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 断开STP-23L失败:`, error);
            this.sendControlResponse('disconnect_stp23l', 'error');
        }
    }
    
    /**
     * 开始高度测量指令
     */
    startHeightMeasureCommand() {
        try {
            if (!this.deviceStatus.stp23lConnected) {
                this.sendControlResponse('start_height_measure', 'stp23l_not_connected');
                return;
            }
            
            this.deviceStatus.isMeasuring = true;
            this.sendStatusUpdate();
            
            this.sendControlResponse('start_height_measure', 'success');
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 开始高度测量失败:`, error);
            this.sendControlResponse('start_height_measure', 'error');
        }
    }
    
    /**
     * 停止高度测量指令
     */
    stopHeightMeasureCommand() {
        try {
            this.deviceStatus.isMeasuring = false;
            this.sendStatusUpdate();
            
            this.sendControlResponse('stop_height_measure', 'success');
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 停止高度测量失败:`, error);
            this.sendControlResponse('stop_height_measure', 'error');
        }
    }
    
    /**
     * 获取状态指令
     */
    getStatusCommand() {
        this.sendStatusUpdate();
        this.sendControlResponse('get_status', 'success');
    }
    
    /**
     * 处理激光雷达数据
     */
    handleLidarData(data) {
        try {
            // 解析激光雷达数据
            const scanData = this.parseLidarData(data);
            if (scanData) {
                this.scanData.push(scanData);
                
                // 发送扫描数据
                this.sendScanData(scanData);
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 处理激光雷达数据失败:`, error);
        }
    }
    
    /**
     * 处理STP-23L数据
     */
    handleSTP23LData(data) {
        try {
            // 解析STP-23L数据
            const heightData = this.parseSTP23LData(data);
            if (heightData) {
                this.heightData.push(heightData);
                
                // 发送高度数据
                this.sendHeightData(heightData);
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 处理STP-23L数据失败:`, error);
        }
    }
    
    /**
     * 解析激光雷达数据
     */
    parseLidarData(data) {
        try {
            // 这里需要根据实际的激光雷达数据格式进行解析
            // 假设数据格式为: "angle,distance,quality\n"
            const lines = data.split('\n');
            const points = [];
            
            lines.forEach(line => {
                if (line.trim()) {
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        points.push({
                            angle: parseFloat(parts[0]),
                            distance: parseFloat(parts[1]),
                            quality: parts[2] ? parseInt(parts[2]) : 0
                        });
                    }
                }
            });
            
            return {
                timestamp: new Date().toISOString(),
                points: points,
                pointCount: points.length
            };
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 解析激光雷达数据失败:`, error);
            return null;
        }
    }
    
    /**
     * 解析STP-23L数据
     */
    parseSTP23LData(data) {
        try {
            // 这里需要根据实际的STP-23L数据格式进行解析
            // 假设数据格式为: "height,quality\n"
            const parts = data.split(',');
            if (parts.length >= 1) {
                return {
                    timestamp: new Date().toISOString(),
                    height: parseFloat(parts[0]),
                    quality: parts[1] ? parseInt(parts[1]) : 0
                };
            }
            return null;
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 解析STP-23L数据失败:`, error);
            return null;
        }
    }
    
    /**
     * 检测树木算法
     */
    detectTrees(scanData) {
        // 简单的树木检测算法
        // 这里需要根据实际需求实现更复杂的算法
        const trees = [];
        
        // 假设检测逻辑：找到距离在合理范围内的点群
        const validPoints = scanData.filter(point => 
            point.distance > 100 && point.distance < 5000 && point.quality > 50
        );
        
        // 简单的聚类算法
        const clusters = this.clusterPoints(validPoints);
        
        clusters.forEach(cluster => {
            if (cluster.length > 5) { // 至少5个点才认为是树木
                const center = this.calculateClusterCenter(cluster);
                const diameter = this.calculateClusterDiameter(cluster);
                
                trees.push({
                    id: trees.length + 1,
                    center: center,
                    diameter: diameter,
                    pointCount: cluster.length,
                    confidence: Math.min(cluster.length / 20, 1.0)
                });
            }
        });
        
        return trees;
    }
    
    /**
     * 点聚类算法
     */
    clusterPoints(points) {
        const clusters = [];
        const visited = new Set();
        
        points.forEach((point, index) => {
            if (visited.has(index)) return;
            
            const cluster = [point];
            visited.add(index);
            
            // 查找附近的点
            points.forEach((otherPoint, otherIndex) => {
                if (visited.has(otherIndex)) return;
                
                const distance = Math.sqrt(
                    Math.pow(point.angle - otherPoint.angle, 2) +
                    Math.pow(point.distance - otherPoint.distance, 2)
                );
                
                if (distance < 50) { // 距离阈值
                    cluster.push(otherPoint);
                    visited.add(otherIndex);
                }
            });
            
            clusters.push(cluster);
        });
        
        return clusters;
    }
    
    /**
     * 计算聚类中心
     */
    calculateClusterCenter(cluster) {
        const sumAngle = cluster.reduce((sum, point) => sum + point.angle, 0);
        const sumDistance = cluster.reduce((sum, point) => sum + point.distance, 0);
        
        return {
            angle: sumAngle / cluster.length,
            distance: sumDistance / cluster.length
        };
    }
    
    /**
     * 计算聚类直径
     */
    calculateClusterDiameter(cluster) {
        let maxDistance = 0;
        
        for (let i = 0; i < cluster.length; i++) {
            for (let j = i + 1; j < cluster.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(cluster[i].angle - cluster[j].angle, 2) +
                    Math.pow(cluster[i].distance - cluster[j].distance, 2)
                );
                maxDistance = Math.max(maxDistance, distance);
            }
        }
        
        return maxDistance;
    }
    
    /**
     * 开始连续扫描
     */
    startContinuousScan() {
        if (!this.deviceStatus.isScanning) return;
        
        // 发送扫描指令到激光雷达
        if (this.lidarPort && this.lidarPort.isOpen) {
            this.lidarPort.write('SCAN\n');
        }
        
        // 设置下次扫描
        setTimeout(() => {
            this.startContinuousScan();
        }, 100); // 100ms间隔
    }
    
    /**
     * 执行单次扫描
     */
    performSingleScan() {
        if (this.lidarPort && this.lidarPort.isOpen) {
            this.lidarPort.write('SINGLE_SCAN\n');
        }
    }
    
    /**
     * 发送扫描数据
     */
    sendScanData(scanData) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'scan_data',
                data: scanData,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 发送树木数据
     */
    sendTreeData(trees) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'tree_data',
                data: {
                    trees: trees,
                    treeCount: trees.length,
                    avgDiameter: trees.reduce((sum, tree) => sum + tree.diameter, 0) / trees.length
                },
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 发送高度数据
     */
    sendHeightData(heightData) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'height_data',
                data: {
                    currentHeight: heightData.height,
                    avgHeight: this.calculateAverageHeight(),
                    heightCount: this.heightData.length
                },
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    /**
     * 计算平均高度
     */
    calculateAverageHeight() {
        if (this.heightData.length === 0) return 0;
        
        const sum = this.heightData.reduce((sum, data) => sum + data.height, 0);
        return sum / this.heightData.length;
    }
    
    /**
     * 发送状态更新
     */
    sendStatusUpdate() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'status_update',
                data: this.deviceStatus,
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
     * 断开连接
     */
    disconnect() {
        console.log(`[${new Date().toISOString()}] 正在断开MiniPC客户端连接...`);
        
        if (this.lidarPort) {
            this.lidarPort.close();
        }
        
        if (this.stp23lPort) {
            this.stp23lPort.close();
        }
        
        if (this.ws) {
            this.ws.close();
        }
        
        this.isConnected = false;
    }
}

// 启动MiniPC客户端
if (require.main === module) {
    // 从命令行参数获取服务器URL
    const serverUrl = process.argv[2] || 'ws://192.168.167.187:8080/ws';
    const client = new MiniPCClient(serverUrl);
    
    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n收到中断信号，正在关闭MiniPC客户端...');
        client.disconnect();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n收到终止信号，正在关闭MiniPC客户端...');
        client.disconnect();
        process.exit(0);
    });
}

module.exports = MiniPCClient;
