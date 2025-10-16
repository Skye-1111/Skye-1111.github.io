#!/bin/bash
# MiniPC启动脚本
# 确保使用正确的服务器地址

echo "=== 启动MiniPC客户端 ==="
echo "服务器地址: ws://192.168.167.187:8080/ws"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js未安装"
    exit 1
fi

# 检查文件是否存在
if [ ! -f "mini-pc-client.js" ]; then
    echo "错误: mini-pc-client.js文件不存在"
    exit 1
fi

# 启动客户端，明确指定服务器地址
echo "正在连接到PC服务器..."
node mini-pc-client.js ws://192.168.167.187:8080/ws
