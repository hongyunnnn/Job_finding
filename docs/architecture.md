# 技术架构文档

## 技术选型

| 决策 | 选择 | 理由 |
|------|------|------|
| 运行时 | 纯 HTML/CSS/JS | 零依赖，无 Node/Python/Electron |
| 分发格式 | HTA (HTML Application) | Windows 原生支持，101KB 单文件 |
| 数据存储 | JS 内联变量 | 绕过 `file://` CORS 限制 |
| 布局方案 | CSS Grid | 自适应列数，无需 JS 干预 |
| 状态管理 | 集中式 state 对象 | 单向数据流，避免 UI/状态不同步 |
| 持久化 | localStorage | 收藏夹数据，无需后端 |
| 字体 | system-ui 原生栈 | 零网络请求，加载即渲染 |

## 架构图

```
┌─────────────────────────────────────────────┐
│                   index.html                 │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  css/        │  │  js/                  │  │
│  │  style.css   │  │  utils.js (工具层)    │  │
│  │  (样式层)    │  │  data.js (数据层)     │  │
│  │             │  │  app.js  (逻辑层)     │  │
│  └─────────────┘  └──────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  企业招聘信息平台.hta                  │   │
│  │  (全部内联，单文件分发)                │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## 数据流

```
用户操作（搜索/筛选/排序）
        │
        ▼
  更新 state 对象
        │
        ▼
  filterAndRender()  ← 唯一数据入口
        │
        ├─ 1. 分类过滤
        ├─ 2. 校招过滤
        ├─ 3. 收藏过滤
        ├─ 4. 全文搜索
        └─ 5. 排序
        │
        ▼
  renderCompanies(list)
        │
        ├─ createCard() × N  → DocumentFragment
        └─ cardGrid.appendChild(fragment)
```

## 模块职责

| 模块 | 文件 | 职责 |
|------|------|------|
| 数据层 | `js/data.js` | 111家企业原始数据 + 分类/排序常量 |
| 工具层 | `js/utils.js` | localStorage CRUD / debounce / formatCities |
| 逻辑层 | `js/app.js` | IIFE 包裹，state 管理，DOM 渲染，事件绑定 |
| 样式层 | `css/style.css` | CSS 变量设计令牌，Grid 布局，响应式断点 |
| 入口 | `index.html` | DOM 骨架，外部资源引用 |
| 分发 | `企业招聘信息平台.hta` | 全部内联的单文件 Windows 程序 |

## 关键设计模式

### 1. IIFE 隔离作用域
```javascript
(function () {
  'use strict';
  // 所有变量和函数都在此闭包内，不污染全局
})();
```

### 2. 事件委托
```javascript
// 不：给16个分类按钮每个绑定 click
// 是：在父容器上绑定一个 click，通过 e.target.closest() 判断目标
categoryFilters.addEventListener('click', (e) => {
  const pill = e.target.closest('.category-pill');
  if (!pill) return;
  // ...
});
```

### 3. DocumentFragment 批量渲染
```javascript
const fragment = document.createDocumentFragment();
list.forEach(c => fragment.appendChild(createCard(c)));
cardGrid.appendChild(fragment); // 只触发一次回流
```

### 4. CSS Grid auto-fill 自适应
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  /* 自动计算列数，无需 JS 处理 resize */
}
```
