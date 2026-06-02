#!/usr/bin/env bash
# OpenFairyGUI Web UI 快速重启脚本
# 用法: bash packages/web/restart.sh [port]

PORT=${1:-3210}

echo "[1/3] 清理端口 ${PORT} 上的旧进程..."
PIDS=$(netstat -ano 2>/dev/null | grep ":${PORT}.*LISTEN" | awk '{print $5}' | sort -u)
if [ -n "$PIDS" ]; then
    for pid in $PIDS; do
        taskkill //PID "$pid" //F 2>/dev/null && echo "  已终止 PID: $pid"
    done
    sleep 1
else
    echo "  端口 ${PORT} 无占用"
fi

echo "[2/3] 启动 Web UI 服务器 (端口: ${PORT})..."
PORT=$PORT npx tsx packages/web/src/server.ts &
SERVER_PID=$!

echo "[3/3] 等待服务器就绪..."
for i in $(seq 1 10); do
    if curl -s -o /dev/null "http://127.0.0.1:${PORT}/" 2>/dev/null; then
        echo ""
        echo "========================================="
        echo "  OpenFairyGUI Web UI 已启动"
        echo "  地址: http://127.0.0.1:${PORT}"
        echo "  PID:  $SERVER_PID"
        echo "========================================="
        exit 0
    fi
    sleep 1
done

echo "启动超时，请检查日志"
exit 1
