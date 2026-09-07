# 鲸鱼娘账单 · DSH 桌面宠物 + DeepSeek 账单查看

一只住在桌面上的鲸鱼娘桌宠，并集成了 DeepSeek 账单查看：**右键看账单、每轮对话花费、今日已用**。

## 🤖 让 AI 帮你装（最简单，不用记命令）

把下面这段话**原样复制**，发给你的 DSH，它会自动帮你安装完成：

```text
请帮我安装插件 dsh-whale-pet-balance（DeepSeek 鲸鱼娘账单桌宠）。
来源：GitHub 仓库 xiaoju-1229/dsh-whale-pet-balance。
步骤：
1. 执行 dsh plugin --profile web add github:xiaoju-1229/dsh-whale-pet-balance
2. 输入你的 DeepSeek API Key：sk-**********，帮我写入凭据文件 ~/.dsh/.credentials.yaml 的 DEEPSEEK_API_KEY
3. 重启 dsh web 并确认桌宠出现在桌面；若没出现（说明环境缺 Electron），帮我补装：
   执行 dsh plugin --profile web add electron，再编辑 profiles/web/pnpm-workspace.yaml 在 allowBuilds 下加 electron: true，重新安装直到桌宠出现
4. 验证：右键桌宠能看到「💰 查看账单」
```

> ⚠️ **两种形态别搞混**：
> - **DSH 插件**（AI 装的就是这个）＝ **完整版**：鲸鱼娘 + 账单 / 每轮花费 / DSH 状态联动
> - **Release 里的 exe**（[下载页](https://github.com/xiaoju-1229/dsh-whale-pet-balance/releases)）＝ **纯桌宠**：只有鲸鱼娘动画
>
> 想要完整功能请装 DSH 插件，别只下 exe。


## ✨ 特性

### 桌宠（继承自原版）

- 🐋 鲸鱼娘住在桌面陪你干活
- 🖱️ 左键拖拽、右键菜单、点击有反应
- 🔗 DSH Agent 状态联动：任务完成 🎉 庆祝 → 💤 睡会儿 → 自动醒；思考/等待/出错有专属动画

### 账单查看（本分支新增）

- 💸 **每轮花费**：每轮对话结束后，鲸鱼娘右上角弹出本轮花费（精确 token 计费，约 5 秒）
- 💰 **余额**：右键菜单「查看账单」→ 显示账单 + 今日已用 + 「充值 →」链接（跳 DeepSeek 官方充值页）
- 📊 **今日已用**：累计今日消费，跨天自动归零

## 🖱️ 使用

- **左键拖拽**：移动鲸鱼娘
- **右键菜单**：🍗 喂食 / 🎾 玩耍 / 💰 查看账单 / 📋 常驻任务进度 / 📋 详细进度 / ⚙️ 设置 / ❎ 退出

- **查看账单**（右键 →「💰 查看账单」）气泡显示：

```
💸 本轮花费 ¥0.0123
📊 今日已用 ¥0.34
💰 余额 ¥6.30 · 充值 →
```

点「充值 →」会用系统默认浏览器打开 DeepSeek 官方充值页
（https://platform.deepseek.com/top_up）。


## 📄 许可与致谢

本项目是两个开源项目的合并版本，派生自以下 MIT 项目，特别感谢原作者并请遵守其许可：

- [@asahimoon/dsh-desktop-pet](https://github.com/AsahiMoon/dsh-desktop-pet) —— 作者 [AsahiMoon](https://github.com/AsahiMoon)，桌宠本体（Electron 桌宠、状态机、DSH 联动）
- [DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) —— 作者 [MeteorNOX](https://github.com/MeteorNOX)，账单查询与峰谷计费逻辑
- [vlln/whale-girl](https://github.com/vlln/whale-girl) —— 作者 [vlln](https://github.com/vlln)，鲸鱼娘角色素材（画师 ZipZipPipe）

三个上游项目均以 MIT License 开源，本合并版本同样以 MIT License 发布。详见 [NOTICE.md](NOTICE.md)。
