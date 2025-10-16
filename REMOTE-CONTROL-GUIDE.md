# 激光雷达远程控制系统使用指南

## 系统概述

本系统实现了激光雷达的远程控制功能，允许通过网页端远程控制miniPC上的激光雷达设备。系统采用WebSocket通信协议，支持实时数据传输和设备控制。

## 系统架构

```
网页端 (GitHub Pages) 
    ↕ WebSocket
上位机 (PC服务器) 
    ↕ WebSocket  
miniPC (数据采集端)
    ↕ 串口
激光雷达设备
```

## 文件结构

```
laser-radar-system/
├── pc-server.js              # 上位机WebSocket服务器
├── mini-pc-client.js         # miniPC端数据采集客户端
├── index.html                # 网页端界面
├── lidar-system.js           # 网页端JavaScript逻辑
├── start-pc-server.bat       # Windows启动脚本
├── start-minipc-client.sh    # Linux启动脚本
├── config-pc.json            # 配置文件
├── package.json              # 项目依赖
└── REMOTE-CONTROL-GUIDE.md   # 本说明文档
```

## 部署步骤

### 1. 上位机部署 (Windows)

1. **安装Node.js**
   - 下载并安装Node.js 18.x或更高版本
   - 验证安装：`node --version`

2. **准备项目文件**
   - 将所有项目文件放在同一目录下
   - 确保包含所有必要文件

3. **启动服务器**
   ```bash
   # 方法1: 使用批处理脚本
   start-pc-server.bat
   
   # 方法2: 手动启动
   npm install
   node pc-server.js
   ```

4. **验证启动**
   - 服务器启动后显示：`WebSocket服务器运行在 ws://localhost:8080/ws`
   - 浏览器访问：`http://localhost:8080` 查看状态页面

### 2. miniPC部署 (Ubuntu)

1. **安装Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **准备项目文件**
   - 将项目文件传输到miniPC
   - 确保包含 `mini-pc-client.js` 和 `package.json`

3. **设置串口权限**
   ```bash
   sudo chmod 666 /dev/ttyUSB*
   sudo chmod 666 /dev/ttyACM*
   ```

4. **启动客户端**
   ```bash
   # 使用脚本启动
   chmod +x start-minipc-client.sh
   ./start-minipc-client.sh
   
   # 或手动启动
   npm install
   node mini-pc-client.js ws://[PC_IP]:8080/ws
   ```

### 3. 网页端部署

1. **更新网页代码**
   - 将修改后的 `index.html` 和 `lidar-system.js` 上传到GitHub Pages
   - 确保WebSocket连接地址正确

2. **访问网页**
   - 打开：`https://xjy231101217.github.io/lasercode/`
   - 点击"连接激光雷达"按钮

## 使用说明

### 1. 启动系统

1. **启动上位机服务器**
   - 在PC上运行 `start-pc-server.bat`
   - 等待显示"系统启动成功！"

2. **启动miniPC客户端**
   - 在miniPC上运行 `./start-minipc-client.sh`
   - 输入PC服务器的IP地址
   - 等待显示"MiniPC客户端已连接"

3. **连接网页端**
   - 打开网页：`https://xjy231101217.github.io/lasercode/`
   - 点击"连接激光雷达"按钮
   - 等待连接成功提示

### 2. 控制功能

#### 激光雷达控制
- **连接/断开**：控制激光雷达的串口连接
- **开始/停止扫描**：控制激光雷达数据采集
- **参数设置**：调整扫描参数和范围

#### STP23L测距仪控制
- **连接/断开**：控制STP23L的串口连接
- **开始/停止测量**：控制距离测量
- **参数设置**：调整测量参数

#### 数据管理
- **实时显示**：查看实时采集的数据
- **数据保存**：保存采集的数据到文件
- **历史数据**：查看历史采集记录

### 3. 监控功能

#### 连接状态监控
- **WebSocket连接**：显示与miniPC的连接状态
- **设备连接**：显示激光雷达和STP23L的连接状态
- **数据流**：显示数据采集状态

#### 系统状态监控
- **CPU使用率**：显示miniPC的CPU使用情况
- **内存使用率**：显示miniPC的内存使用情况
- **网络状态**：显示网络连接质量

## 故障排除

### 1. 连接问题

**问题**：网页端无法连接到激光雷达
**解决方案**：
1. 检查PC服务器是否正常运行
2. 检查miniPC客户端是否已连接
3. 检查网络连接是否正常
4. 检查防火墙设置

**问题**：miniPC无法连接到PC服务器
**解决方案**：
1. 检查PC服务器IP地址是否正确
2. 检查端口8080是否被占用
3. 检查网络连接
4. 检查防火墙设置

### 2. 设备问题

**问题**：激光雷达无法连接
**解决方案**：
1. 检查串口设备是否存在：`ls /dev/ttyUSB*`
2. 检查串口权限：`sudo chmod 666 /dev/ttyUSB*`
3. 检查设备是否被其他程序占用
4. 检查串口参数设置

**问题**：STP23L无法连接
**解决方案**：
1. 检查串口设备是否存在
2. 检查串口权限
3. 检查波特率设置（230400）
4. 检查设备连接线

### 3. 数据问题

**问题**：无法接收数据
**解决方案**：
1. 检查设备连接状态
2. 检查数据采集是否已启动
3. 检查WebSocket连接状态
4. 查看系统日志

**问题**：数据异常
**解决方案**：
1. 检查设备参数设置
2. 检查环境条件
3. 重启设备连接
4. 查看错误日志

## 配置说明

### 1. 服务器配置 (config-pc.json)

```json
{
  "server": {
    "port": 8080,                    // WebSocket服务器端口
    "host": "0.0.0.0",              // 监听地址
    "heartbeat_interval": 30000      // 心跳间隔(ms)
  },
  "lidar": {
    "baud_rate": 115200,            // 激光雷达波特率
    "scan_interval": 100            // 扫描间隔(ms)
  },
  "stp23l": {
    "baud_rate": 230400,            // STP23L波特率
    "measurement_interval": 100     // 测量间隔(ms)
  }
}
```

### 2. 网络配置

- **PC服务器端口**：8080
- **WebSocket路径**：/ws
- **网页端地址**：https://xjy231101217.github.io/lasercode/

## 安全注意事项

1. **网络安全**
   - 确保防火墙正确配置
   - 使用HTTPS访问网页端
   - 定期更新系统补丁

2. **设备安全**
   - 不要随意修改设备参数
   - 定期备份配置文件
   - 监控系统运行状态

3. **数据安全**
   - 定期备份采集数据
   - 设置数据保存期限
   - 保护敏感数据

## 技术支持

如遇到问题，请检查：
1. 系统日志文件
2. 网络连接状态
3. 设备连接状态
4. 配置文件设置

## 更新日志

- **v1.0.0**：初始版本，支持基本的远程控制功能
- 支持激光雷达和STP23L的远程控制
- 支持实时数据传输和状态监控
- 支持WebSocket通信协议
