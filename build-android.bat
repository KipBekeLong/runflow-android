@echo off
echo ========================================
echo RunFlow Android App 构建脚本
echo ========================================
echo.

echo 正在检查环境...

:: 检查Java
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Java。请安装Java JDK 11或更高版本。
    pause
    exit /b 1
)

:: 检查Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js。请安装Node.js 16或更高版本。
    pause
    exit /b 1
)

echo 环境检查通过！
echo.

echo 步骤1: 构建Web应用...
call npm run build
if %errorlevel% neq 0 (
    echo 错误: Web应用构建失败。
    pause
    exit /b 1
)

echo 步骤2: 同步到Android项目...
call npx cap sync
if %errorlevel% neq 0 (
    echo 错误: Android项目同步失败。
    pause
    exit /b 1
)

echo.
echo ========================================
echo 构建完成！
echo ========================================
echo.
echo 接下来请：
echo 1. 使用Android Studio打开 android 文件夹
echo 2. 等待Gradle同步完成
echo 3. 选择 Build → Build APK(s)
echo.
echo 或者如果您已配置好命令行环境：
echo cd android && gradlew assembleDebug
echo.
echo APK文件将生成于: android/app/build/outputs/apk/debug/
echo.
pause