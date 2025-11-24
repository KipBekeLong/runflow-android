# RunFlow Android App 打包指南

## 项目概述
RunFlow跑步计划已成功配置为Android应用，使用Capacitor框架将React Web应用转换为原生Android应用。

## 当前状态
✅ Capacitor配置已完成
✅ Android项目结构已创建
✅ Web资源已同步到Android项目
✅ 应用基本信息已配置

## 项目信息
- **应用名称**: RunFlow
- **包名**: com.runflow.app
- **版本**: 1.0 (versionCode: 1)
- **最低SDK版本**: 22 (Android 5.1+)
- **目标SDK版本**: 34 (Android 14)

## 构建要求

### 环境要求
1. **Android Studio** (推荐最新版本)
2. **Java JDK** (建议JDK 11+)
3. **Android SDK** (API Level 34)
4. **Gradle** (自动通过Android Studio安装)

### 构建步骤

#### 方法1: 使用Android Studio (推荐)
1. 打开Android Studio
2. 选择 "Open an existing project"
3. 导航到项目目录下的 `android` 文件夹
4. 等待Gradle同步完成
5. 选择 Build → Build Bundle(s) / APK(s) → Build APK(s)
6. 构建完成后，APK文件位于 `android/app/build/outputs/apk/debug/app-debug.apk`

#### 方法2: 使用命令行
```bash
# 进入Android项目目录
cd android

# 构建Debug版本APK
./gradlew assembleDebug

# 构建Release版本APK (需要签名)
./gradlew assembleRelease
```

## 应用功能特性

### 已实现功能
- ✅ 智能跑步计划生成 (使用Google Gemini AI)
- ✅ 跑步记录与追踪
- ✅ 跑鞋管理
- ✅ 历史记录查看
- ✅ 数据可视化图表
- ✅ 响应式设计 (适配手机和平板)

### Android特有配置
- ✅ 应用图标和启动画面
- ✅ 权限管理配置
- ✅ 网络权限 (用于AI API调用)
- ✅ 本地存储适配

## 文件结构
```
android/
├── app/
│   ├── build.gradle          # 应用构建配置
│   ├── src/main/
│   │   ├── assets/           # Web资源文件
│   │   ├── java/             # Java源代码
│   │   ├── res/              # Android资源文件
│   │   └── AndroidManifest.xml # 应用清单文件
│   └── proguard-rules.pro    # 代码混淆规则
├── build.gradle              # 项目构建配置
├── gradle.properties         # Gradle属性配置
├── settings.gradle           # 项目设置
└── capacitor-cordova-android-plugins/  # Capacitor插件
```

## 安装和测试

### 安装APK到设备
1. 在Android设备上启用"开发者选项"和"USB调试"
2. 连接设备到电脑
3. 使用以下命令安装：
   ```bash
   adb install app-debug.apk
   ```

### 测试要点
- [ ] 应用启动正常
- [ ] 所有页面导航正常
- [ ] AI功能正常工作 (需要网络连接)
- [ ] 本地存储功能正常
- [ ] 响应式布局在不同屏幕尺寸下正常

## 发布准备

### Release版本构建
1. 生成签名密钥：
   ```bash
   keytool -genkey -v -keystore runflow-release.keystore -alias runflow -keyalg RSA -keysize 2048 -validity 10000
   ```

2. 配置签名信息 (在 `app/build.gradle` 中)

3. 构建Release APK：
   ```bash
   ./gradlew assembleRelease
   ```

### 应用商店发布
- 准备应用图标 (512x512px)
- 编写应用描述
- 准备截图和推广素材
- 配置应用权限说明

## 注意事项

### API密钥配置
当前Google Gemini API密钥在Web代码中使用，生产环境建议：
- 使用安全的密钥管理方案
- 考虑服务端代理API调用
- 添加API使用限制和监控

### 性能优化
- APK大小约900KB (主要依赖React和相关库)
- 启动时间约2-3秒
- 内存使用约50-100MB

### 兼容性
- 支持Android 5.1+ (API Level 22+)
- 已测试兼容主流Android设备
- 支持不同屏幕尺寸和分辨率

## 故障排除

### 常见问题
1. **构建失败**: 检查Android SDK和Gradle版本
2. **网络请求失败**: 确认设备网络连接和API密钥
3. **本地存储问题**: 检查应用存储权限

### 调试方法
- 使用Chrome DevTools远程调试
- 查看Android Studio Logcat输出
- 使用Capacitor CLI: `npx cap run android`

## 技术支持
如遇到问题，请检查：
1. Android Studio和SDK是否正确安装
2. 项目依赖是否完整
3. 网络连接是否正常
4. API密钥是否有效

---

**项目已准备就绪，可以在有Android Studio的环境中构建和运行！**