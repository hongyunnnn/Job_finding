# CLAUDE.md — AI 助手指引

> 本文件为 Claude Code 提供项目工作上下文和操作指引。

---

## 项目概述

**中国企业招聘信息平台** — 帮助计算机大类学生快速找到招聘信息的工具。覆盖 111 家 Fortune 中国 500 强中招聘 CS 岗位的企业。

- **目标用户**：计算机专业应届生
- **分发方式**：微信发送 `.hta` 文件（101KB）
- **技术栈**：纯 HTML/CSS/JS，零框架零依赖

---

## 文件导航

### 入口文件
| 文件 | 说明 |
|------|------|
| [index.html](index.html) | 浏览器版入口（开发调试用） |
| [企业招聘信息平台.hta](企业招聘信息平台.hta) | **分发用单文件**，Windows 双击运行 |

### 源代码
| 文件 | 说明 |
|------|------|
| [css/style.css](css/style.css) | 样式表（CSS Grid 响应式布局，3色调色板） |
| [js/data.js](js/data.js) | 111家企业数据集 |
| [js/app.js](js/app.js) | 核心逻辑（搜索/筛选/排序/渲染/收藏） |
| [js/utils.js](js/utils.js) | 工具函数（localStorage/防抖/格式化） |
| [assets/icon.svg](assets/icon.svg) | Logo 图标 |

### 项目文档
| 文件 | 说明 |
|------|------|
| [README.md](README.md) | 用户文档（快速开始、功能、文件结构） |
| [开发日志.md](开发日志.md) | 每日开发记录（完成事项 + 待办） |
| [docs/requirements.md](docs/requirements.md) | 开发需求文档 |
| [docs/architecture.md](docs/architecture.md) | 技术架构文档 |
| [docs/design-spec.md](docs/design-spec.md) | 设计规范（色彩/排版/间距/动画） |
| [docs/implementation-steps.md](docs/implementation-steps.md) | 实施步骤记录 |

---

## 工作约定

### 代码风格
- **注释语言**：中文注释关键逻辑，英文命名变量/函数
- **JavaScript**：ES6+ 语法，`const`/`let` 优先，IIFE 隔离作用域
- **CSS**：通过 `:root` CSS 变量管理主题，不写硬编码颜色值
- **HTML**：语义化标签，SVG 全部内联

### 修改原则
1. 修改 `js/data.js` 后，必须同步更新 `企业招聘信息平台.hta` 中的数据
2. 修改 `css/style.css` 后，必须同步更新 HTA 中的 `<style>` 块
3. 修改 `js/app.js` 或 `js/utils.js` 后，必须同步更新 HTA 中对应的 `<script>` 块
4. 保持 3 色限制：绿色 (#2ecc71) + 白色 (#ffffff) + 深海军蓝 (#2c3e50)
5. 修改前先读 [docs/design-spec.md](docs/design-spec.md) 确认不违反设计规范

### 数据更新流程
1. 打开 [js/data.js](js/data.js)
2. 找到对应分类区块
3. 按数据模型添加新条目（14个字段，参见 [docs/architecture.md](docs/architecture.md)）
4. 同步到 [企业招聘信息平台.hta](企业招聘信息平台.hta) 的对应数据区域
5. 更新 [开发日志.md](开发日志.md) 记录变更
6. 提交 Git commit

### Git 工作流
- 仓库地址：https://github.com/hongyunnnn/Job_finding
- 主分支：`master`
- Commit 格式：`类型: 简短描述`（如 `feat: 新增5家AI公司`、`fix: 修正腾讯校招链接`）
- 类型：`feat` / `fix` / `docs` / `style` / `refactor` / `data`

---

## 关键架构知识

### 数据管线（app.js）
```
用户操作 → 更新 state → filterAndRender() → 5步过滤排序 → renderCompanies()
```
- `state` 是唯一数据源，所有筛选条件集中管理
- `filterAndRender()` 是数据到视图的唯一入口
- 使用 `DocumentFragment` 批量 DOM 操作

### HTA 文件结构
- `<hta:application>` 标签控制窗口行为
- CSS 全部在 `<style>` 中
- JS 按依赖顺序排列：utils.js → 数据 → app.js

### 数据存储
- 收藏夹：`localStorage`，键名 `'job-favorites'`，JSON 数组格式
- 没有后端，没有数据库，一切都在客户端

---

## 每日 Cron

已设置每日 21:57 自动提醒更新开发日志。到时 Claude Code 会提示检查今天的开发进展并更新 [开发日志.md](开发日志.md)。
