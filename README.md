# 鲸鱼娘余额 · DSH 桌面宠物 + DeepSeek 余额查看

一只住在桌面上的鲸鱼娘桌宠，并集成了 DeepSeek 余额查看：**右键看余额、每轮对话花费、今日已用**。

> 本项目派生自 [@asahimoon/dsh-desktop-pet](https://github.com/AsahiMoon/dsh-desktop-pet)（MIT），
> 在其基础上集成了 [dsh-whale-widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget)（MIT）
> 的余额查询与计费逻辑。角色素材来自 [vlln/whale-girl](https://github.com/vlln/whale-girl)（作者 vlln，画师 ZipZipPipe，MIT，详见 [NOTICE.md](NOTICE.md)）。

## 🚀 快速开始（新手 3 步）

> 前提：已安装 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/deepseek-harness)。

**① 获取 DeepSeek API Key**（余额功能必需）
打开 [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)，创建一个 `sk-` 开头的 Key。

**② 安装插件**（在终端执行一条命令）

```sh
dsh plugin --profile web add github:xiaoju-1229/dsh-whale-pet-balance
```

**③ 配置 Key，然后重启 `dsh web`**

编辑 `~/.dsh/.credentials.yaml`，加一行：

```yaml
DEEPSEEK_API_KEY: sk-你复制的Key
```

重启后鲸鱼娘就出现在桌面了 🐋（没配 Key 也能先跑桌宠，只是余额显示「未配置」）。

> ⚠️ **两种形态别搞混**：
> - **DSH 插件**（上面的装法）＝ **完整版**：鲸鱼娘 + 余额 / 每轮花费 / DSH 状态联动
> - **Release 里的 exe**（[下载页](https://github.com/xiaoju-1229/dsh-whale-pet-balance/releases)）＝ **纯桌宠**：只有鲸鱼娘动画
>
> 想要完整功能，请按上面「快速开始」装 DSH 插件，别只下 exe。

## 🎯 核心亮点

- 🐋💰 **一鱼两用**：会动的桌面桌宠 + DeepSeek 余额管家，合二为一
- 🎯 **精确计费**：每轮对话按真实 token 用量 + 官方峰谷价换算，不是估算
- 🚀 **零门槛**：只需一个 `DEEPSEEK_API_KEY`，无需网页令牌
- ⚡ **即装即用**：一条命令安装，重启 `dsh web` 即生效

## ✨ 特性

### 桌宠（继承自原版）

- 🐋 透明置顶、无边框 Electron 小窗，鲸鱼娘住在桌面陪你干活
- 🔗 DSH Agent 状态联动：任务完成 🎉 庆祝 → 💤 睡会儿 → 自动醒；思考/等待/出错有专属动画
- 🖱️ 左键拖拽、右键菜单、点击有反应

### 余额查看（本分支新增）

- 💰 **余额**：右键菜单「查看余额」→ 显示余额 + 今日已用 + 「充值 →」链接（跳 DeepSeek 官方充值页）
- 💸 **每轮花费**：每轮对话结束后，鲸鱼娘右上角弹出本轮花费（精确 token 计费，约 5 秒）
- 📊 **今日已用**：累计今日消费，跨天自动归零（存 `~/.dsh/.dsh-pet-usage.json`）

## 🖱️ 使用

- **左键拖拽**：移动鲸鱼娘
- **右键菜单**：🍗 喂食 / 🎾 玩耍 / 💰 查看余额 / 📋 常驻任务进度 / 📋 详细进度 / ⚙️ 设置 / ❎ 退出

**查看余额**（右键 →「💰 查看余额」）气泡显示：

```
💸 本轮花费 ¥0.0123
📊 今日已用 ¥0.34
💰 余额 ¥6.30 · 充值 →
```

点「充值 →」会用系统默认浏览器打开 DeepSeek 官方充值页
（https://platform.deepseek.com/top_up）。

**每轮花费**：每轮对话结束后，鲸鱼娘右上角自动弹出「💸 本轮花费 ¥X.XX」，约 5 秒后消失。

## 🙏 致谢

本项目是两个开源项目的合并版本，特别感谢原作者：

- [@asahimoon/dsh-desktop-pet](https://github.com/AsahiMoon/dsh-desktop-pet) —— 作者 [AsahiMoon](https://github.com/AsahiMoon)，桌宠本体（Electron 桌宠、状态机、DSH 联动）
- [DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) —— 作者 [MeteorNOX](https://github.com/MeteorNOX)，余额查询与峰谷计费逻辑
- [vlln/whale-girl](https://github.com/vlln/whale-girl) —— 作者 [vlln](https://github.com/vlln)，鲸鱼娘角色素材（画师 ZipZipPipe）

三个上游项目均以 MIT License 开源，本合并版本同样以 MIT License 发布。

## 📄 许可

MIT License。

本项目派生自以下 MIT 项目，请一并遵守其许可：

- [@asahimoon/dsh-desktop-pet](https://github.com/AsahiMoon/dsh-desktop-pet) —— 桌宠本体
- [dsh-whale-widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) —— 余额 / 计费逻辑
- [vlln/whale-girl](https://github.com/vlln/whale-girl) —— 作者 [vlln](https://github.com/vlln)，鲸鱼娘角色素材（画师 ZipZipPipe）

详见 [NOTICE.md](NOTICE.md)。
