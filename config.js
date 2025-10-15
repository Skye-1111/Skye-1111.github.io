# 激光雷达远程控制系统配置文件

# WebSocket服务器配置
WEBSOCKET_CONFIG = {
    port: 8080,
    host: '0.0.0.0',  # 允许外部连接
    path: '/ws',
    heartbeat_interval: 30000,  # 30秒心跳
    max_reconnect_attempts: 5,
    reconnect_interval: 3000
}

# 蓝牙配置
BLUETOOTH_CONFIG = {
    baud_rate: 9600,  # HC-05默认波特率
    data_bits: 8,
    stop_bits: 1,
    parity: 'none',
    flow_control: 'none',
    auto_reconnect: true,
    reconnect_interval: 5000
}

# 激光雷达配置
LIDAR_CONFIG = {
    baud_rate: 115200,
    data_bits: 8,
    stop_bits: 1,
    parity: 'none',
    flow_control: 'none',
    scan_interval: 100,  # 扫描间隔(ms)
    max_range: 5500,     # 最大距离(mm)
    min_range: 20        # 最小距离(mm)
}

# STP-23L传感器配置
STP23L_CONFIG = {
    baud_rate: 230400,
    data_bits: 8,
    stop_bits: 1,
    parity: 'none',
    flow_control: 'none',
    measurement_interval: 100,  # 测量间隔(ms)
    max_distance: 30000,        # 最大距离(mm)
    min_distance: 20           # 最小距离(mm)
}

# 远程控制配置
REMOTE_CONTROL_CONFIG = {
    command_timeout: 5000,      # 指令超时时间(ms)
    max_command_queue: 10,      # 最大指令队列长度
    enable_command_logging: true,
    enable_status_broadcast: true
}

# 数据存储配置
DATA_CONFIG = {
    max_history_size: 1000,     # 最大历史记录数
    save_interval: 300000,      # 保存间隔(ms) - 5分钟
    data_directory: './data',
    backup_enabled: true
}

# 日志配置
LOG_CONFIG = {
    level: 'info',              # 日志级别: debug, info, warn, error
    enable_console: true,
    enable_file: true,
    log_file: './logs/system.log',
    max_file_size: '10MB',
    max_files: 5
}

# 安全配置
SECURITY_CONFIG = {
    enable_cors: true,
    allowed_origins: ['https://xjy231101217.github.io'],
    enable_rate_limiting: true,
    max_requests_per_minute: 60,
    enable_command_validation: true
}

# 设备识别配置
DEVICE_CONFIG = {
    device_types: {
        'bluetooth_bridge': 'HC-05蓝牙桥接器',
        'web_client': '网页客户端',
        'mobile_client': '移动客户端',
        'desktop_client': '桌面客户端'
    },
    auto_device_detection: true,
    device_timeout: 300000  # 设备超时时间(ms) - 5分钟
}

# 导出配置
module.exports = {
    websocket: WEBSOCKET_CONFIG,
    bluetooth: BLUETOOTH_CONFIG,
    lidar: LIDAR_CONFIG,
    stp23l: STP23L_CONFIG,
    remote_control: REMOTE_CONTROL_CONFIG,
    data: DATA_CONFIG,
    log: LOG_CONFIG,
    security: SECURITY_CONFIG,
    device: DEVICE_CONFIG
};
