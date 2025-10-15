#!/bin/bash

# 激光雷达远程控制系统停止脚本
# 用于停止WebSocket服务器和蓝牙桥接器

echo "=========================================="
echo "    激光雷达远程控制系统停止脚本"
echo "=========================================="

# 检查PID文件
if [ -f "logs/websocket-server.pid" ]; then
    WEBSOCKET_PID=$(cat logs/websocket-server.pid)
    echo "停止WebSocket服务器 (PID: $WEBSOCKET_PID)..."
    kill $WEBSOCKET_PID 2>/dev/null
    rm -f logs/websocket-server.pid
else
    echo "未找到WebSocket服务器PID文件"
fi

if [ -f "logs/bluetooth-bridge.pid" ]; then
    BRIDGE_PID=$(cat logs/bluetooth-bridge.pid)
    echo "停止蓝牙桥接器 (PID: $BRIDGE_PID)..."
    kill $BRIDGE_PID 2>/dev/null
    rm -f logs/bluetooth-bridge.pid
else
    echo "未找到蓝牙桥接器PID文件"
fi

# 强制停止相关进程
echo "清理残留进程..."
pkill -f "websocket-server.js" 2>/dev/null || true
pkill -f "bluetooth-bridge.js" 2>/dev/null || true

# 等待进程完全停止
sleep 2

# 检查是否还有残留进程
REMAINING_PROCESSES=$(pgrep -f "websocket-server.js\|bluetooth-bridge.js" | wc -l)
if [ $REMAINING_PROCESSES -gt 0 ]; then
    echo "强制终止残留进程..."
    pkill -9 -f "websocket-server.js" 2>/dev/null || true
    pkill -9 -f "bluetooth-bridge.js" 2>/dev/null || true
fi

echo "系统已停止"
echo "=========================================="
