@echo off
REM MiniPC启动脚本 (Windows)
REM 确保使用正确的服务器地址

echo === 启动MiniPC客户端 ===
echo 服务器地址: ws://192.168.167.187:8080/ws
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: Node.js未安装
    pause
    exit /b 1
)

REM 检查文件是否存在
if not exist "mini-pc-client.js" (
    echo 错误: mini-pc-client.js文件不存在
    pause
    exit /b 1
)

REM 启动客户端，明确指定服务器地址
echo 正在连接到PC服务器...
node mini-pc-client.js ws://192.168.167.187:8080/ws

pause
