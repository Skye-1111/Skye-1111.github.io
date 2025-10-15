#!/bin/bash

# 激光雷达远程控制系统启动脚本
# 用于启动WebSocket服务器和蓝牙桥接器

echo "=========================================="
echo "    激光雷达远程控制系统启动脚本"
echo "=========================================="

# 检查Node.js版本
echo "检查Node.js版本..."
NODE_VERSION=$(node --version)
echo "当前Node.js版本: $NODE_VERSION"

# 检查Node.js版本是否满足要求
if [[ $NODE_VERSION == v12* ]] || [[ $NODE_VERSION == v14* ]] || [[ $NODE_VERSION == v16* ]]; then
    echo "警告: Node.js版本过低，建议升级到18.x版本"
    echo "继续运行可能会遇到兼容性问题..."
    read -p "是否继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "启动已取消"
        exit 1
    fi
fi

# 检查项目依赖
echo "检查项目依赖..."
if [ ! -f "package.json" ]; then
    echo "错误: 未找到package.json文件"
    echo "请确保在项目根目录下运行此脚本"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "安装项目依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误: 依赖安装失败"
        exit 1
    fi
fi

# 检查必要文件
echo "检查必要文件..."
REQUIRED_FILES=("websocket-server.js" "bluetooth-bridge.js" "lidar-system.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "错误: 未找到必要文件 $file"
        exit 1
    fi
done

# 检查串口权限
echo "检查串口权限..."
if [ ! -w /dev/ttyUSB0 ] && [ ! -r /dev/ttyUSB0 ]; then
    echo "警告: 串口权限不足，尝试修复..."
    sudo chmod 666 /dev/ttyUSB* 2>/dev/null || true
fi

# 检查蓝牙服务
echo "检查蓝牙服务..."
if ! systemctl is-active --quiet bluetooth; then
    echo "启动蓝牙服务..."
    sudo systemctl start bluetooth
fi

# 创建日志目录
mkdir -p logs

# 启动WebSocket服务器
echo "启动WebSocket服务器..."
nohup node websocket-server.js > logs/websocket-server.log 2>&1 &
WEBSOCKET_PID=$!
echo "WebSocket服务器PID: $WEBSOCKET_PID"

# 等待WebSocket服务器启动
sleep 3

# 检查WebSocket服务器是否启动成功
if ! kill -0 $WEBSOCKET_PID 2>/dev/null; then
    echo "错误: WebSocket服务器启动失败"
    echo "查看日志: cat logs/websocket-server.log"
    exit 1
fi

# 启动蓝牙桥接器
echo "启动蓝牙桥接器..."
nohup node bluetooth-bridge.js > logs/bluetooth-bridge.log 2>&1 &
BRIDGE_PID=$!
echo "蓝牙桥接器PID: $BRIDGE_PID"

# 等待蓝牙桥接器启动
sleep 3

# 检查蓝牙桥接器是否启动成功
if ! kill -0 $BRIDGE_PID 2>/dev/null; then
    echo "错误: 蓝牙桥接器启动失败"
    echo "查看日志: cat logs/bluetooth-bridge.log"
    kill $WEBSOCKET_PID 2>/dev/null
    exit 1
fi

# 保存PID到文件
echo $WEBSOCKET_PID > logs/websocket-server.pid
echo $BRIDGE_PID > logs/bluetooth-bridge.pid

echo "=========================================="
echo "系统启动成功！"
echo "=========================================="
echo "WebSocket服务器: http://localhost:8080"
echo "WebSocket连接: ws://localhost:8080/ws"
echo "WebSocket服务器PID: $WEBSOCKET_PID"
echo "蓝牙桥接器PID: $BRIDGE_PID"
echo ""
echo "查看日志:"
echo "  WebSocket服务器: tail -f logs/websocket-server.log"
echo "  蓝牙桥接器: tail -f logs/bluetooth-bridge.log"
echo ""
echo "停止系统: ./stop-remote-system.sh"
echo "=========================================="

# 显示实时日志
echo "显示实时日志 (按Ctrl+C退出):"
tail -f logs/websocket-server.log logs/bluetooth-bridge.log