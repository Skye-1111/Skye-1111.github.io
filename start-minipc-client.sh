#!/bin/bash

# MiniPC端客户端启动脚本
# 运行在Ubuntu系统的miniPC上

echo "=========================================="
echo "    MiniPC数据采集客户端启动脚本"
echo "=========================================="

# 检查Node.js版本
echo "检查Node.js版本..."
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "错误: 未安装Node.js或Node.js不在PATH中"
    echo "请先安装Node.js 18.x或更高版本"
    echo "安装命令: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi
echo "当前Node.js版本: $NODE_VERSION"

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
REQUIRED_FILES=("mini-pc-client.js" "package.json")
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
    sudo chmod 666 /dev/ttyACM* 2>/dev/null || true
fi

# 创建日志目录
mkdir -p logs

# 创建数据目录
mkdir -p data

# 检查网络连接
echo "检查网络连接..."
if ! ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "警告: 网络连接可能有问题，请检查网络设置"
fi

# 获取PC服务器IP地址
echo "请输入PC服务器的IP地址 (默认: localhost):"
read -r PC_SERVER_IP
PC_SERVER_IP=${PC_SERVER_IP:-localhost}

# 设置WebSocket服务器地址
WS_URL="ws://${PC_SERVER_IP}:8080/ws"

echo "=========================================="
echo "启动MiniPC数据采集客户端..."
echo "连接服务器: $WS_URL"
echo "=========================================="

# 启动MiniPC客户端
node mini-pc-client.js "$WS_URL"

echo "MiniPC客户端已停止"
