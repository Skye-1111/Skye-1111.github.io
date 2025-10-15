@echo off
REM 激光雷达远程控制系统启动脚本 (Windows版本)
REM 用于在林场设备端启动所有服务

echo ==========================================
echo 激光雷达远程控制系统启动脚本
echo ==========================================

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: Node.js未安装，请先安装Node.js
    pause
    exit /b 1
)

REM 检查npm是否安装
npm --version >nul 2>&1
if errorlevel 1 (
    echo 错误: npm未安装，请先安装npm
    pause
    exit /b 1
)

REM 检查项目目录
if not exist "package.json" (
    echo 错误: 请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 安装依赖（如果需要）
if not exist "node_modules" (
    echo 正在安装依赖...
    npm install
)

REM 创建数据目录
if not exist "data" mkdir data

echo 正在启动WebSocket服务器...
REM 启动WebSocket服务器（后台运行）
start /b node websocket-server.js

REM 等待WebSocket服务器启动
timeout /t 3 /nobreak >nul

echo 正在启动蓝牙桥接器...
REM 启动蓝牙桥接器（后台运行）
start /b node bluetooth-bridge.js

REM 等待蓝牙桥接器启动
timeout /t 2 /nobreak >nul

echo ==========================================
echo 系统启动完成！
echo ==========================================
echo WebSocket服务器: http://localhost:8080
echo WebSocket连接: ws://localhost:8080/ws
echo 蓝牙桥接器: 正在扫描HC-05设备...
echo.
echo 远程控制端可以通过以下方式连接:
echo 1. 打开网页: https://xjy231101217.github.io/lasercode/
echo 2. 通过蓝牙连接到HC-05模块
echo 3. 使用远程控制功能操作设备
echo.
echo 按任意键停止所有服务

pause >nul

REM 停止所有Node.js进程
taskkill /f /im node.exe >nul 2>&1

echo 服务已停止
pause
