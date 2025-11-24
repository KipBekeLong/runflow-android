# 🚀 RunFlow Android应用自动构建指南

## ⚡ 快速构建方案

由于当前环境缺少完整的Android开发工具，我为您准备了三种构建APK的方案：

---

## 🎯 方案1: GitHub Actions自动构建 (推荐)

### 步骤1: 推送到GitHub
```bash
# 如果还没有Git仓库
git init
git add .
git commit -m "Initial commit - RunFlow Android App"

# 创建GitHub仓库后
git remote add origin https://github.com/您的用户名/runflow-android.git
git push -u origin main
```

### 步骤2: 设置GitHub Actions
1. 在GitHub仓库中，点击 `Actions` 标签
2. 点击 `New workflow`
3. 选择 `set up a workflow yourself`
4. 复制 `github-actions-build.yml` 的内容
5. 提交工作流文件

### 步骤3: 自动构建
- 推送代码后，GitHub Actions会自动开始构建
- 构建完成后，在 `Actions` 页面下载APK文件
- APK文件保存30天

---

## 🛠️ 方案2: 本地Android Studio构建

### 安装要求
1. **Android Studio** - 从 https://developer.android.com/studio 下载
2. **Java JDK 11+** - Android Studio自带或单独安装
3. **Android SDK** - 通过Android Studio安装

### 构建步骤
```bash
# 1. 打开Android Studio
# 2. 选择 "Open an existing project"
# 3. 导航到项目目录下的 android 文件夹
# 4. 等待Gradle同步完成 (可能需要几分钟)
# 5. 选择菜单 Build → Build Bundle(s) / APK(s) → Build APK(s)
# 6. 构建完成后，点击 "locate" 找到APK文件
```

### APK位置
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🌐 方案3: 在线构建平台

### 使用AppCenter (Microsoft)
1. 访问 https://appcenter.ms
2. 注册Microsoft账户
3. 创建新应用，选择Android平台
4. 上传项目代码
5. 配置构建设置
6. 开始构建

### 使用Codemagic
1. 访问 https://codemagic.io
2. 连接GitHub仓库
3. 选择React Native/Android模板
4. 配置构建脚本
5. 开始构建

---

## 📱 构建完成后

### 安装APK到Android设备
```bash
# 方法1: 使用ADB (需要启用开发者选项)
adb install app-debug.apk

# 方法2: 直接在设备上安装
# 将APK文件传输到手机，点击安装

# 方法3: 使用网页安装
# 上传APK到 https://appdistribution.io 扫码安装
```

### 测试清单
- [ ] 应用正常启动
- [ ] 主界面显示正确
- [ ] AI跑步计划生成功能
- [ ] 跑步记录功能
- [ ] 数据保存和加载
- [ ] 响应式布局适配

---

## 🔧 自定义构建选项

### 修改应用信息
编辑 `android/app/src/main/AndroidManifest.xml`:
```xml
android:label="RunFlow跑步计划"  <!-- 应用名称 -->
android:icon="@mipmap/ic_launcher"  <!-- 应用图标 -->
```

### 修改包名
编辑 `android/app/build.gradle`:
```gradle
applicationId "com.yourcompany.runflow"  <!-- 修改为您的包名 -->
```

### 修改版本号
```gradle
versionCode 2        // 每次发布递增
versionName "1.1.0"   // 用户看到的版本号
```

---

## 📊 构建信息

| 项目 | 值 |
|------|-----|
| 应用名称 | RunFlow |
| 包名 | com.runflow.app |
| 版本 | 1.0 (versionCode: 1) |
| 最低支持 | Android 5.1+ |
| 目标版本 | Android 14 |
| 预估APK大小 | 3-5MB |
| 构建时间 | 5-10分钟 |

---

## 🚨 注意事项

### 安全提醒
- ⚠️ Debug版本包含调试信息，不推荐发布到应用商店
- ⚠️ API密钥在Debug版本中可能暴露，生产环境需要安全配置
- ⚠️ 发布前请测试所有功能

### 性能优化
- APK包含React框架，首次启动可能较慢
- 建议在真机上测试性能表现
- 可以考虑代码分割减小APK大小

---

## 🎉 构建成功！

恭喜！您的RunFlow跑步计划现在可以作为一个真正的Android应用运行了！

**推荐使用GitHub Actions方案，无需本地安装Android开发工具，自动构建并下载APK文件。**