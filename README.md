# 鲸鱼娘余额 · DSH 桌面宠物 + DeepSeek 余额查看

一只住在桌面上的鲸鱼娘桌宠，并集成了 DeepSeek 余额查看：**右键看余额、每轮对话花费、今日已用**。

> 本项目派生自 [@asahimoon/dsh-desktop-pet](https://github.com/AsahiMoon/dsh-desktop-pet)（MIT），
> 在其基础上集成了 [dsh-whale-widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget)（MIT）
> 的余额查询与计费逻辑。角色素材来自 [vlln/whale-girl](https://github.com/vlln/whale-girl)（MIT，详见 [NOTICE.md](NOTICE.md)）。

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
- 🎮 成长账本：投喂/玩耍/陪伴 → XP / 等级 / 称号
- 🎨 多角色兼容（Codex / petdex）、热配置

### 余额查看（本分支新增）

- 💰 **余额**：右键菜单「查看余额」→ 显示余额 + 今日已用 + 「充值 →」链接（跳 DeepSeek 官方充值页）
- 💸 **每轮花费**：每轮对话结束后，鲸鱼娘右上角弹出本轮花费（精确 token 计费，约 5 秒）
- 📊 **今日已用**：累计今日消费，跨天自动归零（存 `~/.dsh/.dsh-pet-usage.json`）
- 计费按 DeepSeek 官方峰谷定价（工作日 9:00–12:00 / 14:00–18:00 高峰加倍，周末谷价）；
  `deepseek-v4-pro` 为 flash 的 3 倍价

## 📦 安装

### 前置要求

- 已安装 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/deepseek-harness)（自带 Node.js ≥ 18 与 pnpm）
- 一个 DeepSeek API Key（[在 platform.deepseek.com 创建](https://platform.deepseek.com/api_keys)）

### 安装到 DSH（一条命令搞定）

```sh
dsh plugin --profile web add github:xiaoju-1229/dsh-whale-pet-balance
```

装完**重启 `dsh web`**，鲸鱼娘会自动出现在桌面。

卸载：`dsh plugin --profile web remove dsh-whale-pet-balance`

<details>
<summary>其他来源（一般用不到）</summary>

- **本地路径**（开发者 / 想改代码时）：
  ```sh
  git clone https://github.com/xiaoju-1229/dsh-whale-pet-balance.git
  cd dsh-whale-pet-balance
  dsh plugin --profile web add link:.
  ```
- **npm**（发布到 npm 商店后可用，届时最简洁）：
  ```sh
  dsh plugin --profile web add dsh-whale-pet-balance
  ```
</details>

## 🔑 配置 API Key（余额查询必需）

编辑 DSH 凭据文件 `~/.dsh/.credentials.yaml`
（Windows 为 `C:\Users\<你的用户名>\.dsh\.credentials.yaml`）：

```yaml
DEEPSEEK_API_KEY: sk-xxxxxxxx
```

- API Key 在 https://platform.deepseek.com/api_keys 创建
- 改完**重启 `dsh web`** 生效
- 未配置时桌宠照常运行，只是余额显示「未配置 DEEPSEEK_API_KEY」

## 📦 独立 exe（可选）

```sh
npm install
npm run dist          # 生成 Windows exe（nsis + portable）
```

> ⚠️ 独立 exe 只包含**桌宠本体**（动画 / 交互 / 成长），**不含余额查看和 DSH 状态联动**——
> 那两项依赖 DSH 插件形态运行。

## 🖱️ 使用

- **左键拖拽**：移动鲸鱼娘
- **右键菜单**：喂食 / 玩耍 / 查看余额 / 任务进度 / 详细进度 / 设置 / 退出

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
- [vlln/whale-girl](https://github.com/vlln/whale-girl) —— 鲸鱼娘角色素材（ZipZipPipe 绘制）

三个上游项目均以 MIT License 开源，本合并版本同样以 MIT License 发布。

## 📄 许可

MIT License。

本项目派生自以下 MIT 项目，请一并遵守其许可：

- [@asahimoon/dsh-desktop-pet](https://github.com/AsahiMoon/dsh-desktop-pet) —— 桌宠本体
- [dsh-whale-widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) —— 余额 / 计费逻辑
- [vlln/whale-girl](https://github.com/vlln/whale-girl) —— 鲸鱼娘角色素材（ZipZipPipe 绘制）

详见 [NOTICE.md](NOTICE.md)。
