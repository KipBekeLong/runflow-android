@echo off
echo ========================================
echo RunFlow Android 构建准备检查
echo ========================================
echo.

echo 检查必要文件...
echo.

if exist "package.json" (
    echo ✅ package.json - 存在
) else (
    echo ❌ package.json - 缺失
)

if exist "capacitor.config.ts" (
    echo ✅ capacitor.config.ts - 存在
) else (
    echo ❌ capacitor.config.ts - 缺失
)

if exist "android\app\build.gradle" (
    echo ✅ Android build.gradle - 存在
) else (
    echo ❌ Android build.gradle - 缺失
)

if exist ".github\workflows\build-android.yml" (
    echo ✅ GitHub Actions配置 - 存在
) else (
    echo ❌ GitHub Actions配置 - 缺失
)

if exist "dist\index.html" (
    echo ✅ Web构建文件 - 存在
) else (
    echo ⚠️  Web构建文件 - 不存在，运行 npm run build 生成
)

echo.
echo 检查Git状态...
git status --porcelain

echo.
echo ========================================
echo 📋 检查完成
echo ========================================
echo.
if exist ".github\workflows\build-android.yml" (
    echo ✅ 项目已准备好GitHub Actions构建
    echo.
    echo 下一步：
    echo 1. 运行 setup-github.bat 设置GitHub仓库
    echo 2. 或手动推送到GitHub触发构建
) else (
    echo ❌ 项目配置不完整，请检查缺失的文件
)

echo.
pause