#!/bin/bash
echo ""
echo "============================================"
echo "  万能任务APP - 一键QA测试系统"
echo "============================================"
echo ""

cd "$(dirname "$0")"

NODE_EXE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.12.0/node.exe"

if [ ! -f "$NODE_EXE" ]; then
    echo "[错误] 找不到Node.js"
    exit 1
fi

echo "[1/2] 运行全部测试用例..."
echo ""
"$NODE_EXE" "tests/qa-test.js" "android/app/src/main/assets/public" "temp"
RESULT=$?
echo ""

if [ $RESULT -eq 0 ]; then
    echo "========================================="
    echo "  ✅ QA测试通过！可以发布"
    echo "========================================="
    echo ""
    echo "📄 测试报告: temp/qa-report.html"
else
    echo "========================================="
    echo "  ❌ 测试失败！请修复后再发布"
    echo "========================================="
    echo ""
    echo "📄 测试报告: temp/qa-report.html"
    echo ""
    echo "请根据上方失败详情修复问题后重新运行此脚本"
fi
