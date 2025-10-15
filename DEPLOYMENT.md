# 激光雷达远程控制系统部署指南

## 系统架构概述

本系统实现了基于蓝牙的远程激光雷达控制，支持林场设备端无显示器运行，通过网页端进行远程操作。

### 系统组成

1. **林场设备端（Ubuntu迷你PC）**
   - WebSocket服务器（websocket-server.js）
   - 蓝牙桥接器（bluetooth-bridge.js）
   - HC-05蓝牙模块
   - 激光雷达（HOKUYO URG-04LX-UG01）
   - STP-23L高度传感器

2. **远程控制端**
   - 网页界面（https://xjy231101217.github.io/lasercode/）
   - 蓝牙连接（通过HC-05模块）

## 部署步骤

### 1. 林场设备端部署

#### 1.1 硬件连接
```
迷你PC (Ubuntu)
├── USB端口1: 激光雷达 (HOKUYO URG-04LX-UG01)
├── USB端口2: STP-23L高度传感器
└── USB端口3: HC-05蓝牙模块
```

#### 1.2 软件安装
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装串口工具
sudo apt-get install -y minicom screen

# 添加用户到dialout组（串口权限）
sudo usermod -a -G dialout $USER
```

#### 1.3 项目部署
```bash
# 克隆项目
git clone https://github.com/xjy231101217/lasercode.git
cd lasercode

# 安装依赖
npm install

# 设置权限
chmod +x start-remote-system.sh
chmod +x bluetooth-bridge.js

# 创建必要目录
mkdir -p data logs
```

#### 1.4 配置蓝牙模块
```bash
# 检查蓝牙设备
ls /dev/ttyUSB* /dev/ttyACM*

# 配置HC-05（如果需要）
# 使用AT指令配置蓝牙模块
# 波特率: 9600
# 配对密码: 1234（默认）
```

#### 1.5 启动系统
```bash
# 启动远程控制系统
./start-remote-system.sh

# 或者手动启动
node websocket-server.js &
node bluetooth-bridge.js &
```

### 2. 远程控制端配置

#### 2.1 蓝牙连接
1. 在电脑/手机上启用蓝牙
2. 搜索并连接到HC-05设备
3. 配对密码：1234（默认）
4. 建立串口连接

#### 2.2 网页访问
1. 打开浏览器
2. 访问：https://xjy231101217.github.io/lasercode/
3. 等待WebSocket连接建立
4. 使用远程控制功能

## 使用说明

### 远程控制功能

1. **激光雷达控制**
   - 远程连接激光雷达
   - 远程断开激光雷达
   - 远程开始/停止扫描
   - 远程单次扫描
   - 远程检测树木

2. **高度传感器控制**
   - 远程连接STP-23L传感器
   - 远程断开STP-23L传感器
   - 远程开始/停止高度测量

3. **状态监控**
   - 实时设备状态显示
   - 远程数据接收
   - 系统日志查看

### 数据流程

```
远程控制端 → 蓝牙(HC-05) → 蓝牙桥接器 → WebSocket服务器 → 激光雷达/传感器
     ↑                                                                    ↓
     ← 实时数据 ← WebSocket服务器 ← 蓝牙桥接器 ← 蓝牙(HC-05) ← 设备响应
```

## 故障排除

### 常见问题

1. **蓝牙连接失败**
   - 检查HC-05模块电源
   - 确认蓝牙配对密码
   - 检查串口权限

2. **WebSocket连接失败**
   - 检查网络连接
   - 确认服务器端口8080可用
   - 检查防火墙设置

3. **设备无响应**
   - 检查设备连接
   - 查看系统日志
   - 重启蓝牙桥接器

### 日志查看

```bash
# 查看系统日志
tail -f logs/system.log

# 查看WebSocket服务器日志
journalctl -u websocket-server

# 查看蓝牙桥接器日志
journalctl -u bluetooth-bridge
```

## 安全注意事项

1. **网络安全**
   - 使用HTTPS访问网页
   - 配置防火墙规则
   - 定期更新系统

2. **设备安全**
   - 保护设备物理安全
   - 定期备份数据
   - 监控系统状态

3. **数据安全**
   - 加密敏感数据
   - 定期清理日志
   - 备份重要配置

## 维护建议

1. **定期维护**
   - 每周检查设备状态
   - 每月更新软件
   - 每季度备份数据

2. **性能优化**
   - 监控系统资源使用
   - 优化网络配置
   - 调整扫描参数

3. **扩展功能**
   - 添加更多传感器
   - 实现数据存储
   - 开发移动应用

## 技术支持

如遇到问题，请：
1. 查看系统日志
2. 检查设备连接
3. 参考故障排除指南
4. 联系技术支持

---

**注意**: 使用前请确保所有设备正确连接，并按照安全操作规程进行操作。
