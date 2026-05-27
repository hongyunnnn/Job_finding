/**
 * 工具函数模块
 * ============================================================
 * 职责：提供三个纯工具函数
 *   1. 收藏夹管理 — 基于 localStorage 的增删查
 *   2. 防抖函数   — 限制高频事件（搜索输入）的触发频率
 *   3. 城市格式化 — 将城市数组转为展示字符串
 *
 * 设计原则：这些函数不依赖 DOM，不依赖全局状态，
 * 仅做数据转换，便于单独测试和复用。
 * ============================================================
 */

// ============================================================
// 收藏夹管理（localStorage 持久化）
// ----------------------------------------------------------
// 存储键名：'job-favorites'
// 存储格式：JSON 字符串数组，如 '["alibaba","tencent","bytedance"]'
// 数据量：最多111个ID，每个约10-20字符，总计不超过3KB
// ============================================================

const FAVORITES_KEY = 'job-favorites';

/**
 * 从 localStorage 读取收藏夹ID列表
 * @returns {string[]} 已收藏的公司ID数组
 */
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return []; // localStorage 数据损坏时降级为空数组
  }
}

/**
 * 保存收藏夹ID列表到 localStorage
 * @param {string[]} list - 要保存的公司ID数组
 */
function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

/**
 * 判断某公司是否已被收藏
 * @param {string} id - 公司唯一标识
 * @returns {boolean}
 */
function isFavorite(id) {
  return getFavorites().includes(id);
}

/**
 * 切换收藏状态（添加↔移除）
 * 这是收藏夹的核心操作，被卡片上的星标按钮调用
 *
 * @param {string} id - 公司唯一标识
 * @returns {boolean} 切换后是否为收藏状态
 */
function toggleFavorite(id) {
  const list = getFavorites();
  const idx = list.indexOf(id);
  if (idx === -1) {
    list.push(id);        // 未收藏 → 添加
  } else {
    list.splice(idx, 1);  // 已收藏 → 移除
  }
  saveFavorites(list);
  return list.indexOf(id) !== -1;
}

/** @returns {number} 当前收藏夹中的公司数量 */
function getFavoritesCount() {
  return getFavorites().length;
}

// ============================================================
// 防抖函数
// ----------------------------------------------------------
// 使用场景：搜索输入框每次按键都会触发筛选，
// 如果不加防抖，快速输入"阿里巴巴"会触发5次 filterAndRender()。
// 加 300ms 防抖后，只有用户停止输入 300ms 后才执行一次。
//
// 实现方式：每次调用清除上一个定时器，重新计时。
// 这是一个经典的闭包应用——timer 变量被返回的函数持有，
// 外部无法访问，形成私有状态。
// ============================================================

/**
 * 创建防抖版本的函数
 * @param {Function} fn  - 要延迟执行的函数
 * @param {number} delay - 延迟毫秒数（默认300ms）
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);                          // 取消上一次的延迟调用
    timer = setTimeout(() => fn.apply(this, args), delay); // 重新计时
  };
}

// ============================================================
// 格式化工具
// ============================================================

/**
 * 格式化城市列表为展示字符串
 * 输入 ["北京", "上海", "深圳", "成都", "武汉"] → 输出 "北京 / 上海 / 深圳"
 * 仅展示前3个城市，避免卡片内容过长
 *
 * @param {string[]} cities - 城市名称数组
 * @returns {string} 格式化后的城市字符串
 */
function formatCities(cities) {
  if (!cities || cities.length === 0) return '';
  return cities.slice(0, 3).join(' / ');
}
