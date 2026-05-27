/**
 * 中国企业招聘信息平台 — 核心应用逻辑
 * ============================================================
 * 职责：搜索、筛选、排序、渲染、收藏夹管理
 *
 * 架构设计：
 *   - 采用 IIFE（立即执行函数表达式）隔离作用域
 *   - 所有状态集中在 state 对象中，单向数据流
 *   - filterAndRender() 是数据管线的唯一入口：
 *     用户操作 → 更新 state → filterAndRender() → 过滤排序 → renderCompanies()
 *
 * 依赖：
 *   - utils.js：getFavorites / toggleFavorite / isFavorite / getFavoritesCount / debounce / formatCities
 *   - data.js：COMPANIES / CATEGORIES / SORT_METHODS
 * ============================================================
 */

(function () {
  'use strict';

  // ============================================================
  // 应用状态（单一数据源）
  // ----------------------------------------------------------
  // 所有筛选条件集中管理，任何条件变化都走 filterAndRender() 更新视图。
  // 这是为了避免"UI状态和筛选状态不同步"的常见前端bug。
  // ============================================================
  const state = {
    searchTerm: '',          // 搜索关键词
    activeCategory: 'all',   // 当前激活的分类（默认"全部"）
    sortMethod: 'default',    // 排序方式：default | name | rank
    campusOnly: false,       // 是否仅显示有校招的企业
    showFavoritesOnly: false // 是否仅显示收藏夹
  };

  // ============================================================
  // DOM引用缓存
  // ----------------------------------------------------------
  // 在 IIFE 顶部一次性查询所有 DOM 节点并缓存。
  // 避免在事件处理函数中反复 querySelector，提升性能。
  // 使用短函数名 $ 简化后续代码。
  // ============================================================
  const $ = (sel) => document.querySelector(sel);

  const searchInput     = $('#searchInput');
  const searchClear     = $('#searchClear');
  const categoryFilters = $('#categoryFilters');
  const sortSelect      = $('#sortSelect');
  const campusCheckbox  = $('#campusOnly');
  const favToggle       = $('#favToggle');
  const favCount        = $('#favCount');
  const cardGrid        = $('#cardGrid');
  const emptyState      = $('#emptyState');
  const resultsCount    = $('#resultsCount');
  const backToTop       = $('#backToTop');

  // ===================== 初始化入口 =====================

  /** 页面加载完成后调用：渲染分类按钮 → 首次渲染 → 绑定事件 */
  function init() {
    renderCategoryPills();
    filterAndRender();      // 首次渲染全部公司
    updateFavCount();
    bindEvents();
  }

  // ===================== 分类胶囊按钮 =====================

  /**
   * 根据 CATEGORIES 数组动态生成分类筛选按钮
   * 使用 DocumentFragment 批量插入，只触发一次回流
   */
  function renderCategoryPills() {
    const fragment = document.createDocumentFragment();
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'category-pill' + (cat.key === 'all' ? ' active' : '');
      btn.textContent = cat.label;
      btn.dataset.category = cat.key;
      fragment.appendChild(btn);
    });
    categoryFilters.appendChild(fragment);
  }

  // ============================================================
  // 核心数据管线：filterAndRender()
  // ----------------------------------------------------------
  // 这是整个应用最重要的函数。所有用户操作最终都流向这里。
  //
  // 管线流程（5步）：
  //   COMPANIES 原始数据
  //     → [1. 分类过滤]  保留 categories 包含 activeCategory 的
  //     → [2. 校招过滤]  如果 campusOnly=true，只保留 hasCampusRecruit 的
  //     → [3. 收藏过滤]  如果 showFavoritesOnly=true，只保留已收藏的
  //     → [4. 全文搜索]  在 nameCN + nameEN + positions + tags + cities + description 中匹配
  //     → [5. 排序]      按默认/名称A-Z/排名
  //     → renderCompanies() 渲染到 DOM
  //
  // 注意：每一步都是纯数组操作，不修改原 COMPANIES 数组（slice() 浅拷贝）
  // ============================================================

  function filterAndRender() {
    let list = [...COMPANIES]; // 浅拷贝，避免修改原始数据

    // 1. 分类筛选：检查公司 categories 数组中是否包含当前选中的分类
    if (state.activeCategory !== 'all') {
      list = list.filter((c) => c.categories.includes(state.activeCategory));
    }

    // 2. 仅看校招
    if (state.campusOnly) {
      list = list.filter((c) => c.hasCampusRecruit);
    }

    // 3. 仅看收藏
    if (state.showFavoritesOnly) {
      const favIds = getFavorites();
      list = list.filter((c) => favIds.includes(c.id));
    }

    // 4. 全文搜索
    //    将所有可搜索字段拼接成一个长字符串，然后做不区分大小写的子串匹配。
    //    选择 includes() 而非正则或分词，是因为：
    //    - 111条数据量下 includes() 性能完全够用（每条约200字符，总计约22KB文本）
    //    - 简单直观，支持中文模糊匹配
    if (state.searchTerm.trim()) {
      const term = state.searchTerm.trim().toLowerCase();
      list = list.filter((c) => {
        const haystack = [
          c.nameCN,
          c.nameEN.toLowerCase(),
          ...c.positions,
          ...(c.tags || []),
          ...(c.cities || []),
          c.description || '',
        ].join(' ').toLowerCase();
        return haystack.includes(term);
      });
    }

    // 5. 排序
    //    localeCompare('zh') 使用中文本地化比较，正确处理拼音排序
    if (state.sortMethod === 'name') {
      list.sort((a, b) => a.nameCN.localeCompare(b.nameCN, 'zh'));
    } else if (state.sortMethod === 'rank') {
      list.sort((a, b) => (a.fortuneRank || 999) - (b.fortuneRank || 999));
    }
    // 默认排序：保持 COMPANIES 数组的原始顺序（按类别组织）

    renderCompanies(list);
  }

  // ===================== 渲染卡片网格 =====================

  /**
   * 将筛选后的公司列表渲染到卡片网格中
   * @param {Array} list - 筛选后的公司数据数组
   */
  function renderCompanies(list) {
    cardGrid.innerHTML = '';

    // 空结果处理：隐藏网格，显示空状态提示
    if (list.length === 0) {
      cardGrid.style.display = 'none';
      emptyState.style.display = 'block';
      resultsCount.textContent = '找到 0 家公司';
      return;
    }

    cardGrid.style.display = '';
    emptyState.style.display = 'none';
    resultsCount.textContent = `找到 ${list.length} 家公司`;

    // 使用 DocumentFragment 批量插入DOM
    // 原理：Fragment 是"虚拟容器"，在其中 appendChild 不会触发页面回流。
    // 最后一次性 appendChild(fragment) 到 cardGrid，只触发一次回流。
    const fragment = document.createDocumentFragment();
    list.forEach((company) => {
      fragment.appendChild(createCard(company));
    });
    cardGrid.appendChild(fragment);
  }

  // ===================== 单张卡片创建 =====================

  /**
   * 根据单家公司数据创建卡片 DOM 元素
   *
   * 卡片结构（从上到下）：
   *   ┌──────────────────────────────┐
   *   │  ★ 收藏星标（右上角）         │
   *   │  [阿] 阿里巴巴                │
   *   │       Alibaba Group          │
   *   │       互联网 · 招聘中         │
   *   │  📍 杭州 / 北京 / 深圳       │
   *   │  [后端开发] [算法工程师] ...  │
   *   │  [头部大厂] [阿里系] ...     │
   *   │  [🌐 官网]  [📋 投递简历]    │
   *   └──────────────────────────────┘
   *
   * @param {Object} company - 公司数据对象
   * @returns {HTMLElement} 完整的卡片DOM元素
   */
  function createCard(company) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = company.id;

    // ---- 收藏星标按钮 ----
    // 位于卡片右上角，通过 position:absolute 定位
    const starBtn = document.createElement('button');
    starBtn.className = 'card-star' + (isFavorite(company.id) ? ' favorited' : '');
    starBtn.title = isFavorite(company.id) ? '取消收藏' : '添加收藏';
    starBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>`;
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止冒泡，避免触发卡片点击
      toggleFavorite(company.id);
      const nowFav = isFavorite(company.id);
      starBtn.classList.toggle('favorited', nowFav);
      starBtn.title = nowFav ? '取消收藏' : '添加收藏';
      updateFavCount();
      // 如果在收藏视图且取消收藏，需要从视图中移除卡片
      if (state.showFavoritesOnly && !nowFav) {
        filterAndRender();
      }
    });
    card.appendChild(starBtn);

    // ---- 卡片头部：头像 + 公司名 + 行业 ----
    const header = document.createElement('div');
    header.className = 'card-header';

    // 头像：取公司中文名首字作为头像文字
    // 例如"阿里巴巴" → "阿"，"华为" → "华"
    const avatar = document.createElement('div');
    avatar.className = 'card-avatar';
    avatar.textContent = company.nameCN.charAt(0);
    header.appendChild(avatar);

    // 名称组：中文名 + 英文名 + 行业标签
    const nameGroup = document.createElement('div');
    nameGroup.className = 'card-name-group';

    const nameCN = document.createElement('div');
    nameCN.className = 'card-name';
    nameCN.textContent = company.nameCN;

    const nameEN = document.createElement('div');
    nameEN.className = 'card-name-en';
    nameEN.textContent = company.nameEN;

    const industry = document.createElement('span');
    industry.className = 'card-industry';
    industry.textContent = company.industry + (company.hiring ? ' · 招聘中' : '');

    nameGroup.appendChild(nameCN);
    nameGroup.appendChild(nameEN);
    nameGroup.appendChild(industry);
    header.appendChild(nameGroup);
    card.appendChild(header);

    // ---- 城市信息（最多显示3个） ----
    if (company.cities && company.cities.length > 0) {
      const cities = document.createElement('div');
      cities.className = 'card-cities';
      // 内联SVG：定位图标
      cities.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>`;
      cities.appendChild(document.createTextNode(formatCities(company.cities)));
      card.appendChild(cities);
    }

    // ---- 招聘职位标签 ----
    // 每个职位渲染为一个圆角小标签
    const positionsDiv = document.createElement('div');
    positionsDiv.className = 'card-positions';
    (company.positions || []).forEach((pos) => {
      const tag = document.createElement('span');
      tag.className = 'position-tag';
      tag.textContent = pos;
      positionsDiv.appendChild(tag);
    });
    card.appendChild(positionsDiv);

    // ---- 企业特色标签（最多4个） ----
    if (company.tags && company.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'card-tags';
      company.tags.slice(0, 4).forEach((t) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = t;
        tagsDiv.appendChild(tag);
      });
      card.appendChild(tagsDiv);
    }

    // ---- 底部操作按钮 ----
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    // "官网" 按钮 → 打开公司官网（新标签页）
    const websiteBtn = document.createElement('a');
    websiteBtn.className = 'btn btn-outline';
    websiteBtn.href = company.website;
    websiteBtn.target = '_blank';
    websiteBtn.rel = 'noopener'; // 安全最佳实践：防止新页面访问 window.opener
    websiteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      官网`;

    // "投递简历" 按钮 → 打开公司招聘/校招页面（新标签页）
    const careerBtn = document.createElement('a');
    careerBtn.className = 'btn btn-primary';
    careerBtn.href = company.careerPage;
    careerBtn.target = '_blank';
    careerBtn.rel = 'noopener';
    careerBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
      投递简历`;

    actions.appendChild(websiteBtn);
    actions.appendChild(careerBtn);
    card.appendChild(actions);

    return card;
  }

  // ===================== 收藏夹计数 =====================

  /** 更新 Header 中收藏夹徽章的数字，以及按钮的激活状态 */
  function updateFavCount() {
    const count = getFavoritesCount();
    favCount.textContent = count;
    favToggle.classList.toggle('active', state.showFavoritesOnly);
  }

  // ============================================================
  // 事件绑定
  // ----------------------------------------------------------
  // 将所有用户交互事件集中绑定在这里。
  // 每个事件处理函数的职责：更新 state 中的对应字段，然后调用 filterAndRender()
  // ============================================================

  function bindEvents() {
    // 搜索输入（防抖300ms）
    // 为什么300ms？经验值——低于200ms用户可能还在打字，
    // 高于500ms会有明显延迟感。300ms是"感觉即时"和"减少计算"的平衡点
    searchInput.addEventListener('input', debounce(function () {
      state.searchTerm = this.value;
      // 有内容时显示清除按钮
      if (this.value.trim()) {
        searchClear.classList.add('visible');
      } else {
        searchClear.classList.remove('visible');
      }
      filterAndRender();
    }, 300));

    // 清除搜索按钮
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      state.searchTerm = '';
      searchClear.classList.remove('visible');
      filterAndRender();
      searchInput.focus(); // 清除后自动聚焦回搜索框，方便重新输入
    });

    // 分类筛选（事件委托模式）
    // 为什么用事件委托？因为分类按钮是动态生成的，
    // 在父容器上绑定一个事件处理器比给每个按钮单独绑定更高效
    categoryFilters.addEventListener('click', (e) => {
      const pill = e.target.closest('.category-pill');
      if (!pill) return; // 点击的不是分类按钮，忽略

      // 切换激活状态
      categoryFilters.querySelectorAll('.category-pill').forEach((p) => {
        p.classList.remove('active');
      });
      pill.classList.add('active');
      state.activeCategory = pill.dataset.category;
      filterAndRender();
    });

    // 排序切换
    sortSelect.addEventListener('change', function () {
      state.sortMethod = this.value;
      filterAndRender();
    });

    // "仅校招"复选框
    campusCheckbox.addEventListener('change', function () {
      state.campusOnly = this.checked;
      filterAndRender();
    });

    // 收藏夹切换按钮
    favToggle.addEventListener('click', () => {
      state.showFavoritesOnly = !state.showFavoritesOnly;
      updateFavCount();
      filterAndRender();
    });

    // 回到顶部按钮的显示/隐藏
    // 滚动超过400px时显示（400px ≈ 一屏半的高度）
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });

    // 回到顶部（平滑滚动）
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- 启动：等待 DOM 就绪后初始化 ---
  document.addEventListener('DOMContentLoaded', init);
})();
