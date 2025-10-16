# MiniPC连接故障排除指南

## 问题描述
MiniPC客户端报错：`Error: connect ECONNREFUSED 127.0.0.1:8080`

## 问题分析
MiniPC上的 `mini-pc-client.js` 文件仍在使用错误的IP地址 `127.0.0.1`，而不是正确的PC服务器地址。

## 解决方案

### 方案1: 直接指定服务器地址（推荐）
在miniPC上运行：
```bash
node mini-pc-client.js ws://192.168.167.187:8080/ws
```

### 方案2: 使用启动脚本
在miniPC上运行：
```bash
# Linux/macOS
./start-minipc.sh

# Windows
start-minipc.bat
```

### 方案3: 更新miniPC上的文件
1. 将PC上的 `mini-pc-client.js` 文件复制到miniPC
2. 确保文件中的IP地址是 `192.168.167.187`

### 方案4: 手动修改miniPC上的文件
在miniPC上编辑 `mini-pc-client.js`，将以下行：
```javascript
constructor(serverUrl = 'ws://127.0.0.1:8080/ws')
```
改为：
```javascript
constructor(serverUrl = 'ws://192.168.167.187:8080/ws')
```

## 验证步骤

### 1. 检查PC服务器状态
在PC上确认服务器正在运行：
```bash
node pc-server.js
```
应该看到：
```
[时间] 上位机WebSocket服务器已启动
[时间] HTTP服务器: http://localhost:8080
[时间] WebSocket服务器: ws://localhost:8080/ws
[时间] 网络访问: http://192.168.167.187:8080
[时间] WebSocket网络访问: ws://192.168.167.187:8080/ws
```

### 2. 测试网络连接
在miniPC上测试连接：
```bash
node minipc-test-connection.js
```

### 3. 检查防火墙
确保PC的防火墙允许端口8080的入站连接。

## 常见错误

### ECONNREFUSED
- **原因**: 服务器未运行或IP地址错误
- **解决**: 检查服务器状态，使用正确的IP地址

### socket hang up
- **原因**: 网络连接问题
- **解决**: 检查网络连接，确认IP地址正确

### timeout
- **原因**: 防火墙阻止连接
- **解决**: 检查防火墙设置

## 网络配置检查

### PC端
```bash
# 查看IP地址
ipconfig

# 检查端口监听
netstat -an | findstr :8080
```

### MiniPC端
```bash
# 查看IP地址
ip addr show

# 测试连接
ping 192.168.167.187
telnet 192.168.167.187 8080
```

## 成功标志
当连接成功时，应该看到：
- PC端：`客户端连接: client_xxx (192.168.167.187)`
- MiniPC端：`WebSocket连接已建立`

## 联系支持
如果问题仍然存在，请提供：
1. PC和MiniPC的IP地址
2. 完整的错误日志
3. 网络配置信息
