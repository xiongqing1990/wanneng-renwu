@echo off
chcp 65001 >nul
echo ========================================
echo   万能任务APP - GitHub Pages 部署脚本
echo ========================================
echo.
echo 请先在GitHub上创建仓库，然后回来贴上仓库地址
echo 仓库地址格式: https://github.com/你的用户名/仓库名
echo.
set /p repo="请输入GitHub仓库地址: "

cd /d "%~dp0"

echo.
echo 正在初始化Git仓库...
git init
git add .
git commit -m "万能任务APP v1.0"

echo.
echo 正在连接远程仓库...
git remote add origin %repo%
git branch -M main

echo.
echo 正在推送代码...
git push -u origin main --force

echo.
echo ========================================
echo   部署完成！
echo.
echo 接下来请：
echo 1. 访问你的GitHub仓库
echo 2. 进入 Settings → Pages
echo 3. Source 选 "main" 分支
echo 4. 等2分钟后访问:
echo    https://%repo:~19,-4%.github.io/%repo:~51,-4%
echo.
echo 手机上用Chrome打开上述链接
echo 然后：菜单 → 添加到主屏幕
echo ========================================
pause
