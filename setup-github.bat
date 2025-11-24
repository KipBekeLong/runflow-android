@echo off
echo ========================================
echo RunFlow GitHub 仓库设置脚本
echo ========================================
echo.

echo 请按以下步骤操作：
echo.
echo 1. 访问 https://github.com/new
echo 2. 创建新仓库，名称建议：runflow-android
echo 3. 选择 Public 或 Private
echo 4. 不要初始化 README、.gitignore 或 license
echo 5. 点击 "Create repository"
echo.
echo 创建完成后，请按任意键继续...
pause > nul

echo.
echo 请输入您的GitHub用户名：
set /p username=

echo.
echo 请输入您刚才创建的仓库名称（默认：runflow-android）：
set /p repo=
if "%repo%"=="" set repo=runflow-android

echo.
echo 正在添加远程仓库...
git remote add origin https://github.com/%username%/%repo%.git

echo.
echo 正在推送代码到GitHub...
git push -u origin main

echo.
echo ========================================
echo 🎉 推送完成！
echo ========================================
echo.
echo 接下来请：
echo 1. 访问 https://github.com/%username%/%repo%
echo 2. 点击 "Actions" 标签
echo 3. 等待构建完成（约5-10分钟）
echo 4. 构建完成后下载APK文件
echo.
echo 构建过程中您可以在Actions页面查看实时日志
echo.
pause