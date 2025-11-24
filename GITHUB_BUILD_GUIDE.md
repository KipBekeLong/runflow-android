# 🚀 GitHub Actions Android构建指南

## 📋 构建流程

### 步骤1: 推送代码到GitHub

如果还没有远程仓库，请按以下步骤操作：

```bash
# 1. 在GitHub上创建新仓库
# 访问 https://github.com/new 创建名为 "runflow-android" 的仓库

# 2. 添加远程仓库
git remote add origin https://github.com/您的用户名/runflow-android.git

# 3. 推送代码
git add .
git commit -m "Add GitHub Actions Android build configuration"
git push -u origin main
```

### 步骤2: 自动构建

推送代码后，GitHub Actions会自动开始构建：

1. 访问您的GitHub仓库
2. 点击 `Actions` 标签
3. 选择 `Build Android APK` 工作流
4. 等待构建完成（约5-10分钟）

### 步骤3: 下载APK

构建完成后，有两种方式获取APK：

#### 方式1: 从Actions下载
1. 在Actions页面点击完成的构建任务
2. 在 `Artifacts` 部分找到 `runflow-android-apk`
3. 点击下载APK文件

#### 方式2: 从Releases下载
1. 访问仓库的 `Releases` 页面
2. 下载最新版本的APK文件

---

## 🔧 构建配置说明

### 工作流程特性
- ✅ 自动触发（推送或PR时）
- ✅ 手动触发（workflow_dispatch）
- ✅ 多级缓存优化构建速度
- ✅ 自动创建Release
- ✅ APK文件保存30天

### 构建环境
- **系统**: Ubuntu Latest
- **Node.js**: 18.x
- **Java**: Temurin JDK 17
- **Android SDK**: 最新稳定版
- **Gradle**: 项目配置版本

---

## 📱 构建结果

### APK信息
- **文件名**: `app-debug.apk`
- **包名**: `com.runflow.app`
- **版本**: `1.0.0`
- **最低系统**: Android 5.1+
- **架构**: ARM64, x86, x86_64

### 预期文件大小
- **APK大小**: 3-5 MB
- **安装后大小**: 8-12 MB

---

## 🛠️ 故障排除

### 常见问题

#### 1. 构建失败 - Gradle错误
```bash
# 检查 android/gradle/wrapper/gradle-wrapper.properties
# 确保distributionUrl有效
```

#### 2. 构建失败 - 依赖问题
```bash
# 检查 package.json 依赖版本
# 确保所有依赖都正确安装
```

#### 3. APK无法安装
- 确保在Android设备上启用"未知来源"安装
- 检查设备Android版本是否≥5.1

### 调试方法
1. 查看Actions日志中的错误信息
2. 检查构建步骤的输出
3. 在本地复现问题

---

## 🔄 自动化流程

### 触发条件
- 推送到main分支
- 创建Pull Request
- 手动触发Actions

### 构建步骤
1. 检出代码
2. 设置Node.js环境
3. 安装依赖
4. 构建Web应用
5. 设置Java和Android SDK
6. 构建Android APK
7. 上传构建产物
8. 创建Release（仅main分支推送）

---

## 📊 构建统计

| 指标 | 预估值 |
|------|--------|
| **构建时间** | 5-10分钟 |
| **成功率** | 95%+ |
| **APK大小** | 3-5 MB |
| **保存时间** | 30天 |

---

## 🎯 下一步

### 构建成功后
1. **下载APK** - 从Actions或Releases页面
2. **安装测试** - 在Android设备上安装
3. **功能验证** - 测试所有应用功能
4. **性能测试** - 检查启动速度和内存使用

### 发布准备
1. **应用签名** - 配置Release签名
2. **图标设计** - 创建应用图标
3. **描述优化** - 编写应用描述
4. **应用商店** - 准备上架材料

---

## 🎉 开始构建

现在您可以开始构建了！

```bash
# 如果还没有远程仓库，请先创建
git remote add origin https://github.com/您的用户名/runflow-android.git

# 推送代码触发构建
git push -u origin main
```

推送后，访问您的GitHub仓库查看Actions构建进度。构建完成后即可下载APK文件！

**🚀 您的RunFlow Android应用即将诞生！**