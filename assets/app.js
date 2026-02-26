const state = {
  itemsAi: [],
  itemsAll: [],
  itemsAllRaw: [],
  statsAi: [],
  totalAi: 0,
  totalRaw: 0,
  totalAllMode: 0,
  allDedup: true,
  siteFilter: "",
  query: "",
  mode: "ai",
  waytoagiMode: "today",
  waytoagiData: null,
  generatedAt: null,
};

const statsEl = document.getElementById("stats");
const siteSelectEl = document.getElementById("siteSelect");
const sitePillsEl = document.getElementById("sitePills");
const newsListEl = document.getElementById("newsList");
const updatedAtEl = document.getElementById("updatedAt");
const searchInputEl = document.getElementById("searchInput");
const resultCountEl = document.getElementById("resultCount");
const itemTpl = document.getElementById("itemTpl");
const modeAiBtnEl = document.getElementById("modeAiBtn");
const modeAllBtnEl = document.getElementById("modeAllBtn");
const modeHintEl = document.getElementById("modeHint");
const allDedupeWrapEl = document.getElementById("allDedupeWrap");
const allDedupeToggleEl = document.getElementById("allDedupeToggle");
const allDedupeLabelEl = document.getElementById("allDedupeLabel");

const waytoagiUpdatedAtEl = document.getElementById("waytoagiUpdatedAt");
const waytoagiMetaEl = document.getElementById("waytoagiMeta");
const waytoagiListEl = document.getElementById("waytoagiList");
const waytoagiTodayBtnEl = document.getElementById("waytoagiTodayBtn");
const waytoagi7dBtnEl = document.getElementById("waytoagi7dBtn");
const waytoagiWrapEl = document.getElementById("waytoagiWrap");
const waytoagiToggleBtnEl = document.getElementById("waytoagiToggleBtn");
const subsiteSummaryBtnEl = document.getElementById("subsiteSummaryBtn");
const subsiteModalEl = document.getElementById("subsiteModal");
const subsiteModalBackdropEl = document.getElementById("subsiteModalBackdrop");
const subsiteModalCloseBtnEl = document.getElementById("subsiteModalCloseBtn");
const subsiteModalMetaEl = document.getElementById("subsiteModalMeta");
const subsiteModalBodyEl = document.getElementById("subsiteModalBody");

const PRIMARY_SITE_ORDER = [
  ["techurls", "TechURLs"],
  ["buzzing", "Buzzing"],
  ["iris", "Info Flow"],
  ["bestblogs", "BestBlogs"],
  ["tophub", "TopHub"],
  ["zeli", "Zeli"],
  ["aihubtoday", "AI HubToday"],
  ["aibase", "AIbase"],
  ["aihot", "AI今日热榜"],
  ["newsnow", "NewsNow"],
];

function fmtNumber(n) {
  return new Intl.NumberFormat("zh-CN").format(n || 0);
}

function fmtTime(iso) {
  if (!iso) return "时间未知";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function fmtDate(iso) {
  if (!iso) return "未知日期";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function fmtAgo(iso) {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diffMs = Date.now() - ts;
  if (diffMs <= 0) return "（刚刚）";

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) return `（${Math.max(1, minutes)}分钟前）`;

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 24) return `（${hours}小时前）`;

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return `（${days}天前）`;
}

function primarySiteNameMap(siteStats) {
  const nameMap = new Map(PRIMARY_SITE_ORDER);
  (siteStats || []).forEach((row) => {
    if (!row?.site_id) return;
    if (row.site_name) nameMap.set(row.site_id, row.site_name);
  });
  return nameMap;
}

function buildSubsiteSummary(payload) {
  const items = payload?.items_all_raw || payload?.items_all || payload?.items || [];
  const siteStats = payload?.site_stats || [];
  const nameMap = primarySiteNameMap(siteStats);
  const allSites = new Map();

  PRIMARY_SITE_ORDER.forEach(([siteId]) => {
    allSites.set(siteId, new Map());
  });

  items.forEach((item) => {
    const siteId = String(item?.site_id || "").trim();
    if (!siteId || !allSites.has(siteId)) return;
    const source = String(item?.source || "").trim() || "未分区";
    const sourceCounter = allSites.get(siteId);
    sourceCounter.set(source, (sourceCounter.get(source) || 0) + 1);
  });

  return PRIMARY_SITE_ORDER.map(([siteId, fallbackName]) => {
    const counter = allSites.get(siteId) || new Map();
    const subsites = Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
      .map(([source, count]) => ({ source, count }));
    const total = subsites.reduce((acc, row) => acc + row.count, 0);
    return {
      site_id: siteId,
      site_name: nameMap.get(siteId) || fallbackName,
      subsite_count: subsites.length,
      total_count: total,
      subsites,
    };
  });
}

function renderSubsiteSummary(payload) {
  if (!subsiteModalBodyEl || !subsiteModalMetaEl) return;
  const rows = buildSubsiteSummary(payload);
  subsiteModalBodyEl.innerHTML = "";

  const totalSubsites = rows.reduce((acc, row) => acc + row.subsite_count, 0);
  const totalItems = rows.reduce((acc, row) => acc + row.total_count, 0);
  subsiteModalMetaEl.textContent = `共 ${fmtNumber(rows.length)} 个主站点，${fmtNumber(totalSubsites)} 个子站点，${fmtNumber(totalItems)} 条24h全量记录。`;

  rows.forEach((row) => {
    const sec = document.createElement("div");
    sec.className = "subsite-group";

    const toggleHtml = `
      <div class="subsite-group-toggle" role="button" tabindex="0">
        <span class="subsite-group-title">${row.site_name} (${row.site_id})</span>
        <span class="subsite-group-info">${fmtNumber(row.subsite_count)} 个子站点 / ${fmtNumber(row.total_count)} 条</span>
        <span class="subsite-arrow">▶</span>
      </div>
    `;
    sec.insertAdjacentHTML("beforeend", toggleHtml);

    let listHtml = '<ul class="subsite-list">';
    if (!row.subsites.length) {
      listHtml += '<li class="subsite-empty">(无数据)</li>';
    } else {
      row.subsites.forEach((sub) => {
        listHtml += `<li><span class="subsite-source">${sub.source}</span><span class="subsite-count">${fmtNumber(sub.count)}</span></li>`;
      });
    }
    listHtml += "</ul>";
    sec.insertAdjacentHTML("beforeend", listHtml);

    const toggleEl = sec.querySelector(".subsite-group-toggle");
    const arrowEl = sec.querySelector(".subsite-arrow");

    toggleEl.onclick = function (evt) {
      evt.stopPropagation();
      const wasOpen = sec.dataset.open === "true";
      sec.dataset.open = wasOpen ? "false" : "true";
      arrowEl.textContent = wasOpen ? "▶" : "▼";
    };

    subsiteModalBodyEl.appendChild(sec);
  });
}

function openSubsiteModal() {
  if (!subsiteModalEl) return;
  subsiteModalEl.hidden = false;
  subsiteModalEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeSubsiteModal() {
  if (!subsiteModalEl) return;
  subsiteModalEl.hidden = true;
  subsiteModalEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setStats(payload) {
  const cards = [
    ["24h AI", fmtNumber(payload.total_items)],
    ["24h 全量", fmtNumber(payload.total_items_raw || payload.total_items)],
    ["全量去重后", fmtNumber(payload.total_items_all_mode || payload.total_items_raw || payload.total_items)],
    ["站点数", fmtNumber(payload.site_count)],
    ["来源分组", fmtNumber(payload.source_count)],
    ["归档总量", fmtNumber(payload.archive_total || 0)]
  ];

  statsEl.innerHTML = "";
  cards.forEach(([k, v]) => {
    const node = document.createElement("div");
    node.className = "stat";
    node.innerHTML = `<div class="k">${k}</div><div class="v">${v}</div>`;
    statsEl.appendChild(node);
  });
}

function computeSiteStats(items) {
  const m = new Map();
  items.forEach((item) => {
    if (!m.has(item.site_id)) {
      m.set(item.site_id, { site_id: item.site_id, site_name: item.site_name, count: 0, raw_count: 0 });
    }
    const row = m.get(item.site_id);
    row.count += 1;
    row.raw_count += 1;
  });
  return Array.from(m.values()).sort((a, b) => b.count - a.count || a.site_name.localeCompare(b.site_name, "zh-CN"));
}

function currentSiteStats() {
  if (state.mode === "ai") return state.statsAi || [];
  return computeSiteStats(state.allDedup ? (state.itemsAll || []) : (state.itemsAllRaw || []));
}

function renderSiteFilters() {
  const stats = currentSiteStats();

  siteSelectEl.innerHTML = '<option value="">全部站点</option>';
  stats.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.site_id;
    const raw = s.raw_count ?? s.count;
    opt.textContent = `${s.site_name} (${s.count}/${raw})`;
    siteSelectEl.appendChild(opt);
  });
  siteSelectEl.value = state.siteFilter;

  sitePillsEl.innerHTML = "";
  const allPill = document.createElement("button");
  allPill.className = `pill ${state.siteFilter === "" ? "active" : ""}`;
  allPill.textContent = "全部";
  allPill.onclick = () => {
    state.siteFilter = "";
    renderSiteFilters();
    renderList();
  };
  sitePillsEl.appendChild(allPill);

  stats.forEach((s) => {
    const btn = document.createElement("button");
    btn.className = `pill ${state.siteFilter === s.site_id ? "active" : ""}`;
    const raw = s.raw_count ?? s.count;
    btn.textContent = `${s.site_name} ${s.count}/${raw}`;
    btn.onclick = () => {
      state.siteFilter = s.site_id;
      renderSiteFilters();
      renderList();
    };
    sitePillsEl.appendChild(btn);
  });
}

function renderModeSwitch() {
  modeAiBtnEl.classList.toggle("active", state.mode === "ai");
  modeAllBtnEl.classList.toggle("active", state.mode === "all");
  if (allDedupeWrapEl) allDedupeWrapEl.classList.toggle("show", state.mode === "all");
  if (allDedupeToggleEl) allDedupeToggleEl.checked = state.allDedup;
  if (allDedupeLabelEl) allDedupeLabelEl.textContent = state.allDedup ? "去重开" : "去重关";
  if (state.mode === "ai") {
    modeHintEl.textContent = `当前视图：AI强相关（${fmtNumber(state.totalAi)} 条）`;
  } else {
    const allCount = state.allDedup
      ? (state.totalAllMode || state.itemsAll.length)
      : (state.totalRaw || state.itemsAllRaw.length);
    modeHintEl.textContent = `当前视图：全量（${state.allDedup ? "去重开" : "去重关"}，${fmtNumber(allCount)} 条）`;
  }
}

function effectiveAllItems() {
  return state.allDedup ? state.itemsAll : state.itemsAllRaw;
}

function modeItems() {
  return state.mode === "all" ? effectiveAllItems() : state.itemsAi;
}

function getFilteredItems() {
  const q = state.query.trim().toLowerCase();
  return modeItems().filter((item) => {
    if (state.siteFilter && item.site_id !== state.siteFilter) return false;
    if (!q) return true;
    const hay = `${item.title || ""} ${item.title_zh || ""} ${item.title_en || ""} ${item.site_name || ""} ${item.source || ""}`.toLowerCase();
    return hay.includes(q);
  });
}

function renderItemNode(item) {
  const node = itemTpl.content.firstElementChild.cloneNode(true);
  node.querySelector(".source").textContent = item.source || "未分区";
  node.querySelector(".time").textContent = fmtTime(item.published_at || item.first_seen_at);
  const ageText = fmtAgo(item.published_at || item.first_seen_at);

  const titleEl = node.querySelector(".title");
  const zh = (item.title_zh || "").trim();
  const en = (item.title_en || "").trim();
  titleEl.textContent = "";

  const makeAgeSpan = () => {
    const span = document.createElement("span");
    span.className = "title-age";
    span.textContent = ageText;
    return span;
  };

  if (zh && en && zh !== en) {
    const primary = document.createElement("span");
    primary.className = "title-main";
    primary.textContent = zh;
    if (ageText) primary.appendChild(makeAgeSpan());
    const sub = document.createElement("span");
    sub.className = "title-sub";
    sub.textContent = en;
    titleEl.appendChild(primary);
    titleEl.appendChild(sub);
  } else {
    const primary = document.createElement("span");
    primary.className = "title-main";
    primary.textContent = item.title || zh || en;
    if (ageText) primary.appendChild(makeAgeSpan());
    titleEl.appendChild(primary);
  }
  titleEl.href = item.url;
  return node;
}

function buildSourceGroupNode(source, items) {
  const section = document.createElement("section");
  section.className = "source-group";
  section.innerHTML = `
    <header class="source-group-head">
      <h3>${source}</h3>
      <span>${fmtNumber(items.length)} 条</span>
    </header>
    <div class="source-group-list"></div>
  `;
  const listEl = section.querySelector(".source-group-list");
  items.forEach((item) => listEl.appendChild(renderItemNode(item)));
  return section;
}

function groupBySource(items) {
  const groupMap = new Map();
  items.forEach((item) => {
    const key = item.source || "未分区";
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key).push(item);
  });

  return Array.from(groupMap.entries()).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "zh-CN"));
}

function renderGroupedBySource(items) {
  const groups = groupBySource(items);
  const frag = document.createDocumentFragment();

  groups.forEach(([source, groupItems]) => {
    frag.appendChild(buildSourceGroupNode(source, groupItems));
  });

  newsListEl.appendChild(frag);
}

function renderGroupedBySiteAndSource(items) {
  const siteMap = new Map();
  items.forEach((item) => {
    if (!siteMap.has(item.site_id)) {
      siteMap.set(item.site_id, {
        siteName: item.site_name || item.site_id,
        items: [],
      });
    }
    siteMap.get(item.site_id).items.push(item);
  });

  const sites = Array.from(siteMap.entries()).sort((a, b) => {
    const byCount = b[1].items.length - a[1].items.length;
    if (byCount !== 0) return byCount;
    return a[1].siteName.localeCompare(b[1].siteName, "zh-CN");
  });

  const frag = document.createDocumentFragment();
  sites.forEach(([, site]) => {
    const siteSection = document.createElement("section");
    siteSection.className = "site-group";
    siteSection.innerHTML = `
      <header class="site-group-head">
        <h3>${site.siteName}</h3>
        <span>${fmtNumber(site.items.length)} 条</span>
      </header>
      <div class="site-group-list"></div>
    `;

    const siteListEl = siteSection.querySelector(".site-group-list");
    const sourceGroups = groupBySource(site.items);
    sourceGroups.forEach(([source, groupItems]) => {
      siteListEl.appendChild(buildSourceGroupNode(source, groupItems));
    });
    frag.appendChild(siteSection);
  });

  newsListEl.appendChild(frag);
}

function renderList() {
  const filtered = getFilteredItems();
  resultCountEl.textContent = `${fmtNumber(filtered.length)} 条`;

  newsListEl.innerHTML = "";

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "当前筛选条件下没有结果。";
    newsListEl.appendChild(empty);
    return;
  }

  if (state.siteFilter) {
    renderGroupedBySource(filtered);
    return;
  }

  renderGroupedBySiteAndSource(filtered);
}

function waytoagiViews(waytoagi) {
  const updates7d = Array.isArray(waytoagi?.updates_7d) ? waytoagi.updates_7d : [];
  const latestDate = waytoagi?.latest_date || (updates7d.length ? updates7d[0].date : null);
  const updatesToday = Array.isArray(waytoagi?.updates_today) && waytoagi.updates_today.length
    ? waytoagi.updates_today
    : (latestDate ? updates7d.filter((u) => u.date === latestDate) : []);
  return { updates7d, updatesToday, latestDate };
}

function renderWaytoagi(waytoagi) {
  const { updates7d, updatesToday, latestDate } = waytoagiViews(waytoagi);
  if (waytoagiTodayBtnEl) waytoagiTodayBtnEl.classList.toggle("active", state.waytoagiMode === "today");
  if (waytoagi7dBtnEl) waytoagi7dBtnEl.classList.toggle("active", state.waytoagiMode === "7d");
  waytoagiUpdatedAtEl.textContent = `更新时间：${fmtTime(waytoagi.generated_at)}`;

  waytoagiMetaEl.innerHTML = `
    <a href="${waytoagi.root_url || "#"}" target="_blank" rel="noopener noreferrer">主页面</a>
    <span>·</span>
    <a href="${waytoagi.history_url || "#"}" target="_blank" rel="noopener noreferrer">历史更新页</a>
    <span>·</span>
    <span>当天(${latestDate || "--"})：${fmtNumber(waytoagi.count_today || updatesToday.length)} 条</span>
    <span>·</span>
    <span>近 7 日：${fmtNumber(waytoagi.count_7d || updates7d.length)} 条</span>
  `;

  waytoagiListEl.innerHTML = "";
  if (waytoagi.has_error) {
    const div = document.createElement("div");
    div.className = "waytoagi-error";
    div.textContent = waytoagi.error || "WaytoAGI 数据加载失败";
    waytoagiListEl.appendChild(div);
    return;
  }

  const updates = state.waytoagiMode === "today" ? updatesToday : updates7d;
  if (!updates.length) {
    const div = document.createElement("div");
    div.className = "waytoagi-empty";
    div.textContent = state.waytoagiMode === "today"
      ? "当天没有更新，可切换到近7日查看。"
      : (waytoagi.warning || "近 7 日没有更新");
    waytoagiListEl.appendChild(div);
    return;
  }

  updates.forEach((u) => {
    const row = document.createElement("a");
    row.className = "waytoagi-item";
    row.href = u.url || "#";
    row.target = "_blank";
    row.rel = "noopener noreferrer";
    row.innerHTML = `<span class="d">${fmtDate(u.date)}</span><span class="t">${u.title}</span>`;
    waytoagiListEl.appendChild(row);
  });
}

async function loadNewsData() {
  const res = await fetch(`./data/latest-24h.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`加载 latest-24h.json 失败: ${res.status}`);
  return res.json();
}

async function loadWaytoagiData() {
  const res = await fetch(`./data/waytoagi-7d.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`加载 waytoagi-7d.json 失败: ${res.status}`);
  return res.json();
}

async function init() {
  const [newsResult, waytoagiResult] = await Promise.allSettled([loadNewsData(), loadWaytoagiData()]);

  if (newsResult.status === "fulfilled") {
    const payload = newsResult.value;
    state.itemsAi = payload.items_ai || payload.items || [];
    state.itemsAllRaw = payload.items_all_raw || payload.items_all || payload.items || [];
    state.itemsAll = payload.items_all || payload.items || [];
    state.statsAi = payload.site_stats || [];
    state.totalAi = payload.total_items || state.itemsAi.length;
    state.totalRaw = payload.total_items_raw || state.itemsAllRaw.length;
    state.totalAllMode = payload.total_items_all_mode || state.itemsAll.length;
    state.generatedAt = payload.generated_at;

    setStats(payload);
    renderSubsiteSummary(payload);
    renderModeSwitch();
    renderSiteFilters();
    renderList();
    updatedAtEl.textContent = `更新时间：${fmtTime(state.generatedAt)}`;
  } else {
    updatedAtEl.textContent = "新闻数据加载失败";
    newsListEl.innerHTML = `<div class="empty">${newsResult.reason.message}</div>`;
  }

  if (waytoagiResult.status === "fulfilled") {
    state.waytoagiData = waytoagiResult.value;
    renderWaytoagi(state.waytoagiData);
  } else {
    waytoagiUpdatedAtEl.textContent = "加载失败";
    waytoagiListEl.innerHTML = `<div class="waytoagi-error">${waytoagiResult.reason.message}</div>`;
  }
}

if (waytoagiToggleBtnEl && waytoagiWrapEl) {
  waytoagiToggleBtnEl.addEventListener("click", () => {
    const isOpen = waytoagiWrapEl.dataset.open === "true";
    waytoagiWrapEl.dataset.open = isOpen ? "false" : "true";
    waytoagiToggleBtnEl.textContent = isOpen ? "WaytoAGI 更新日志" : "收起 WaytoAGI";
  });
}

if (subsiteSummaryBtnEl) {
  subsiteSummaryBtnEl.addEventListener("click", openSubsiteModal);
}

if (subsiteModalCloseBtnEl) {
  subsiteModalCloseBtnEl.addEventListener("click", closeSubsiteModal);
}

if (subsiteModalBackdropEl) {
  subsiteModalBackdropEl.addEventListener("click", closeSubsiteModal);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && subsiteModalEl && !subsiteModalEl.hidden) {
    closeSubsiteModal();
  }
});

searchInputEl.addEventListener("input", (e) => {
  state.query = e.target.value;
  renderList();
});

siteSelectEl.addEventListener("change", (e) => {
  state.siteFilter = e.target.value;
  renderSiteFilters();
  renderList();
});

modeAiBtnEl.addEventListener("click", () => {
  state.mode = "ai";
  renderModeSwitch();
  renderSiteFilters();
  renderList();
});

modeAllBtnEl.addEventListener("click", () => {
  state.mode = "all";
  renderModeSwitch();
  renderSiteFilters();
  renderList();
});

if (allDedupeToggleEl) {
  allDedupeToggleEl.addEventListener("change", (e) => {
    state.allDedup = Boolean(e.target.checked);
    renderModeSwitch();
    renderSiteFilters();
    renderList();
  });
}

if (waytoagiTodayBtnEl) {
  waytoagiTodayBtnEl.addEventListener("click", () => {
    state.waytoagiMode = "today";
    if (state.waytoagiData) renderWaytoagi(state.waytoagiData);
  });
}

if (waytoagi7dBtnEl) {
  waytoagi7dBtnEl.addEventListener("click", () => {
    state.waytoagiMode = "7d";
    if (state.waytoagiData) renderWaytoagi(state.waytoagiData);
  });
}

init();
