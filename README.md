# 听风播放器（music-player）

原生 HTML / CSS / JavaScript 写的单页音乐播放器，阶段 2 的练习项目。

在线体验：https://longdandan-dev.github.io/music-player/

## 功能

- 播放列表：数据驱动渲染，6 首示例曲 + 1 首故意留的坏音频
- 播放 / 暂停、上一首 / 下一首（播过 3 秒点上一首先回本首开头）
- 三种循环模式：列表循环 / 单曲循环 / 顺序播放
- 进度条拖动、当前时间与总时长
- 音量与静音、键盘快捷键（空格、← →、↑ ↓）
- 搜索（防抖）+ 收藏筛选，localStorage 持久化
- 音频加载失败自动提示并跳下一首，不卡死
- 响应式三档（手机 / 平板 / 桌面）+ 无障碍（焦点环、跳转链接、aria 状态、减少动效）

## 技术栈
原生 JS + Vite，零第三方依赖；零图片 —— 封面用 CSS 渐变画，图标是手写 SVG。

## 本地运行
```powershell
npm install
npm run dev
```
## 目录结构
```
index.html        页面骨架
vite.config.js    打包配置（base 子路径、产物输出到 docs）
package.json      项目信息与运行脚本
public/audio/     6 首示例音频（构建时原样复制到产物里）
src/main.js       数据、状态、渲染与交互逻辑
src/style.css     设计令牌与全部样式
docs/             打包产物，GitHub Pages 从这里发布
```
## 说明
6 首示例音频为本地合成，无版权问题；列表最后一首《错误音频》是故意留的坏数据，用来演示错误处理。