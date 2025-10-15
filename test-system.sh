#!/bin/bash

# 激光雷达远程控制系统测试脚本
# 用于测试系统各个组件的功能

echo "=========================================="
echo "    激光雷达远程控制系统测试脚本"
echo "=========================================="

# 检查Node.js版本
echo "1. 检查Node.js版本..."
NODE_VERSION=$(node --version)
echo "   当前版本: $NODE_VERSION"
if [[ $NODE_VERSION == v18* ]]; then
    echo "   ✅ Node.js版本符合要求"
else
    echo "   ⚠️  Node.js版本过低，建议升级到18.x"
fi

# 检查npm版本
echo "2. 检查npm版本..."
NPM_VERSION=$(npm --version)
echo "   当前版本: $NPM_VERSION"

# 检查项目依赖
echo "3. 检查项目依赖..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules目录存在"
    
    # 检查关键依赖
    if [ -d "node_modules/ws" ]; then
        echo "   ✅ WebSocket依赖已安装"
    else
        echo "   ❌ WebSocket依赖缺失"
    fi
    
    if [ -d "node_modules/serialport" ]; then
        echo "   ✅ 串口依赖已安装"
    else
        echo "   ❌ 串口依赖缺失"
    fi
else
    echo "   ❌ node_modules目录不存在"
    echo "   请运行: npm install"
fi

# 检查必要文件
echo "4. 检查必要文件..."
REQUIRED_FILES=("websocket-server.js" "bluetooth-bridge.js" "lidar-system.js" "index.html")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file 缺失"
    fi
done

# 检查串口设备
echo "5. 检查串口设备..."
SERIAL_DEVICES=$(ls /dev/ttyUSB* 2>/dev/null | wc -l)
if [ $SERIAL_DEVICES -gt 0 ]; then
    echo "   找到 $SERIAL_DEVICES 个串口设备:"
    ls -la /dev/ttyUSB* 2>/dev/null | while read line; do
        echo "     $line"
    done
else
    echo "   ⚠️  未找到串口设备"
fi

# 检查蓝牙服务
echo "6. 检查蓝牙服务..."
if systemctl is-active --quiet bluetooth; then
    echo "   ✅ 蓝牙服务正在运行"
else
    echo "   ❌ 蓝牙服务未运行"
    echo "   请运行: sudo systemctl start bluetooth"
fi

# 检查蓝牙设备
echo "7. 检查蓝牙设备..."
if command -v hcitool >/dev/null 2>&1; then
    echo "   扫描蓝牙设备..."
    sudo hcitool scan 2>/dev/null | grep -i hc05 || echo "   未找到HC-05设备"
else
    echo "   ⚠️  hcitool命令不可用"
fi

# 检查端口占用
echo "8. 检查端口占用..."
if netstat -tlnp 2>/dev/null | grep -q ":8080 "; then
    echo "   ⚠️  端口8080已被占用"
    netstat -tlnp 2>/dev/null | grep ":8080 "
else
    echo "   ✅ 端口8080可用"
fi

# 检查用户权限
echo "9. 检查用户权限..."
if groups | grep -q dialout; then
    echo "   ✅ 用户已加入dialout组"
else
    echo "   ❌ 用户未加入dialout组"
    echo "   请运行: sudo usermod -a -G dialout $USER"
    echo "   然后重新登录"
fi

# 检查系统资源
echo "10. 检查系统资源..."
echo "   内存使用:"
free -h | grep Mem | awk '{print "     总内存: " $2 ", 已使用: " $3 ", 可用: " $7}'
echo "   磁盘使用:"
df -h / | tail -1 | awk '{print "     总空间: " $2 ", 已使用: " $3 ", 可用: " $4}'

echo "=========================================="
echo "测试完成"
echo "=========================================="

# 提供建议
echo "建议操作:"
if [[ $NODE_VERSION != v18* ]]; then
    echo "1. 升级Node.js: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
fi

if [ ! -d "node_modules" ]; then
    echo "2. 安装依赖: npm install"
fi

if ! groups | grep -q dialout; then
    echo "3. 添加串口权限: sudo usermod -a -G dialout $USER && 重新登录"
fi

if ! systemctl is-active --quiet bluetooth; then
    echo "4. 启动蓝牙服务: sudo systemctl start bluetooth"
fi

echo "5. 启动系统: ./start-remote-system.sh"
echo "=========================================="