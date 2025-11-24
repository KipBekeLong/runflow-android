# 🚀 推送命令指南

## 请按以下步骤操作：

### 1. 创建GitHub仓库
- 访问：https://github.com/new
- 仓库名称：`runflow-android`
- 选择 Public 或 Private
- **重要**：不要勾选 "Initialize this repository with a README"
- 点击 "Create repository"

### 2. 复制并运行以下命令

请将 `YOUR_USERNAME` 替换为您的GitHub用户名：

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/runflow-android.git

# 推送代码到GitHub
git push -u origin main
```

### 示例（如果您的用户名是 johndoe）：
```bash
git remote add origin https://github.com/johndoe/runflow-android.git
git push -u origin main
```

### 3. 监控构建进度

推送成功后：
1. 访问：https://github.com/YOUR_USERNAME/runflow-android
2. 点击 "Actions" 标签
3. 查看 "Build Android APK" 工作流
4. 等待构建完成（约5-10分钟）

### 4. 下载APK

构建完成后有两种下载方式：

**方式1：从Actions下载**
- 在Actions页面点击完成的构建
- 在 "Artifacts" 部分找到 `runflow-android-apk`
- 点击下载

**方式2：从Releases下载**
- 访问仓库的 "Releases" 页面
- 下载最新版本的APK文件

---

## 🔧 如果遇到问题

### 推送失败
```bash
# 如果远程仓库已存在，先删除
git remote remove origin

# 然后重新添加
git remote add origin https://github.com/YOUR_USERNAME/runflow-android.git
git push -u origin main
```

### 构建失败
- 检查Actions日志中的错误信息
- 确认所有文件都已正确推送
- 重新推送代码触发新构建

---

## 📱 构建成功后

您将获得：
- ✅ 可安装的Android APK文件
- ✅ 完整的RunFlow跑步计划应用
- ✅ AI智能训练计划功能
- ✅ 数据记录和追踪功能

**立即开始创建GitHub仓库并推送代码吧！** 🚀