NOTICE

本包「dsh-whale-pet-balance」是 [@asahimoon/dsh-desktop-pet](https://github.com/AsahiMoon/dsh-desktop-pet)
（MIT License）的派生版本，在其基础上集成了 DeepSeek 余额查看功能。

复用 / 派生了以下第三方作品：

## 桌宠本体

- 派生自 @asahimoon/dsh-desktop-pet（MIT License，作者 AsahiMoon）。
  本体代码（config.mjs / main.js / preload.js / renderer/* 及 index.mjs 的桌宠部分）
  版权归原作者。

## 余额 / 计费逻辑

- 集成自 dsh-whale-widget / DeepSeek-Balance-Whale-Widget
  （https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget，MIT License）：
  - DeepSeek 余额接口（api.deepseek.com/user/balance）
  - 峰谷定价表（PRICING / isPeakTime）
  - 每轮对话消耗统计（assistant/message usage 聚合 + turn/end 结算）
  - 今日已用记账（每轮消耗累加）

## 角色素材

- 宠物 sprite 素材（assets/characters/whale-girl/*.png）与动画表
  （assets/characters/whale-girl/manifest.json）来自
  https://github.com/vlln/whale-girl（作者 vlln）—— 该插件以 MIT License 发布。
  - 角色形象（鲸鱼娘 / whale-girl）由画师 ZipZipPipe 绘制。
  - whale-girl 项目 LICENSE 全文随素材保留于其原仓库。

## 运行时

- 桌面运行时使用 Electron（MIT License, https://electronjs.org）。

## Codex 宠物格式

- Codex 宠物格式（pet.json + spritesheet）为本项目实现的格式适配器，不包含
  第三方代码；通过该适配器加载的角色（如 petdex 安装的宠物）版权归各自作者，
  分发时请自行确认许可。运行时新增的角色存放在用户目录
  `%APPDATA%/dsh-desktop-pet/characters/`，不属于本包内容。
