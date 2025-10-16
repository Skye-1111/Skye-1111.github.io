@echo off
chcp 65001 >nul

echo ==========================================
echo     上位机WebSocket服务器启动脚本
echo ==========================================

REM 检查Node.js版本
echo 检查Node.js版本...
node --version
if %errorlevel% neq 0 (
    echo 错误: 未安装Node.js或Node.js不在PATH中
    echo 请先安装Node.js 18.x或更高版本
    pause
    exit /b 1
)

REM 检查项目依赖
echo 检查项目依赖...
if not exist "package.json" (
    echo 错误: 未找到package.json文件
    echo 请确保在项目根目录下运行此脚本
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 安装项目依赖...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 依赖安装失败
        pause
        exit /b 1
    )
)

REM 检查必要文件
echo 检查必要文件...
set REQUIRED_FILES=pc-server.js mini-pc-client.js index.html lidar-system.js
for %%f in (%REQUIRED_FILES%) do (
    if not exist "%%f" (
        echo 错误: 未找到必要文件 %%f
        pause
        exit /b 1
    )
)

REM 创建日志目录
if not exist "logs" mkdir logs

REM 创建数据目录
if not exist "data" mkdir data

echo ==========================================
echo 启动上位机WebSocket服务器...
echo ==========================================

REM 启动PC服务器
echo 启动PC服务器...
start "PC服务器" cmd /k "node pc-server.js"

REM 等待服务器启动
timeout /t 3 /nobreak >nul

echo ==========================================
echo 系统启动成功！
echo ==========================================
echo PC服务器: http://localhost:8080
echo WebSocket连接: ws://localhost:8080/ws
echo 网页端: https://xjy231101217.github.io/lasercode/
echo ""
echo 使用说明:
echo 1. 在miniPC上运行: node mini-pc-client.js
echo 2. 在网页端点击"连接激光雷达"按钮
echo 3. 通过网页端控制miniPC上的设备
echo ""
echo 停止系统: 关闭此窗口或按Ctrl+C
echo ==========================================

pause
