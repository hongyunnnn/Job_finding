# 实施步骤文档

## 阶段 1：项目脚手架 ✅

**目标**：搭建目录结构，创建空文件

```
d:/Job/
├── index.html          # 浏览器版入口
├── css/style.css       # 样式表
├── js/
│   ├── data.js         # 数据集
│   ├── app.js          # 核心逻辑
│   └── utils.js        # 工具函数
└── assets/icon.svg     # Logo 图标
```

## 阶段 2：数据整理 ✅

**目标**：编写 111 家企业的招聘数据集

1. 定义数据模型（14 个字段：名称/官网/招聘页/职位/城市/排名等）
2. 按9大类别组织数据（互联网/电商/电信/硬件/AI/游戏/金融/车企/企业软件）
3. 新增24家外企中国研发中心
4. 验证所有 URL 可访问
5. 添加分类标签常量 `CATEGORIES` 和排序常量 `SORT_METHODS`

## 阶段 3：工具函数 ✅

**`js/utils.js`** 三个纯函数：

1. `getFavorites()` / `saveFavorites()` / `isFavorite()` / `toggleFavorite()` / `getFavoritesCount()` — localStorage CRUD
2. `debounce(fn, delay)` — 闭包实现的防抖
3. `formatCities(cities)` — 数组格式化

## 阶段 4：样式设计 ✅

**`css/style.css`** 样式系统：

1. CSS 自定义属性（设计令牌）：颜色、阴影、圆角、过渡
2. Reset & Base：统一浏览器默认样式
3. Header：sticky 定位 + Logo + 标题 + 收藏按钮
4. Toolbar：搜索框 + 分类胶囊 + 排序选择器
5. 卡片网格：CSS Grid `auto-fill` + `minmax(290px, 1fr)`
6. 卡片组件：头像/名称/行业/城市/职位标签/操作按钮
7. 空状态、页脚、回到顶部按钮
8. 响应式断点：900px、600px
9. 动画：卡片悬停、按钮过渡、搜索聚焦

## 阶段 5：核心逻辑 ✅

**`js/app.js`** IIFE 包裹的应用逻辑：

1. `state` 对象：集中管理筛选条件
2. `init()`：渲染分类按钮 → 首次渲染 → 绑定事件
3. `renderCategoryPills()`：动态生成分类胶囊按钮
4. `filterAndRender()`：数据管线（分类→校招→收藏→搜索→排序）
5. `createCard(company)`：单张卡片 DOM 构建
6. `renderCompanies(list)`：批量渲染（DocumentFragment）
7. 事件绑定：搜索防抖、分类筛选(事件委托)、排序、收藏切换、回到顶部

## 阶段 6：HTA 打包 ✅

**`企业招聘信息平台.hta`** 单文件包装：

1. `<hta:application>` 窗口配置（最大化、禁止重复实例、任务栏显示）
2. 内联 CSS：全部样式移至 `<style>` 标签
3. 内联 SVG：Logo 直接嵌入 HTML
4. 内联 JS：utils.js → data.js → app.js 依次嵌入
5. 最终 101KB，微信直接发送

## 阶段 7：文档与部署 ✅

1. README.md — 用户文档
2. docs/requirements.md — 需求文档
3. docs/architecture.md — 架构文档
4. docs/design-spec.md — 设计规范
5. docs/implementation-steps.md — 本文档
6. 开发日志.md — 开发记录
7. CLAUDE.md — AI 助手指引
8. Git 初始化 + 推送 GitHub

## 阶段 8：待实施

- [ ] 数据更新：2026 秋招信息
- [ ] "已申请"状态追踪（localStorage）
- [ ] URL 参数深层链接
- [ ] 数据构建脚本（自动同步 data.js → HTA）
- [ ] PWA Service Worker 离线支持
