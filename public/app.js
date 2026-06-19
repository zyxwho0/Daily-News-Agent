const state = { data: null, category: "All", topic: null, visible: 10 };

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = "") => {
  const node = document.createElement("span");
  node.textContent = value;
  return node.innerHTML;
};

function relativeTime(date) {
  const seconds = Math.max(0, (Date.now() - new Date(date)) / 1000);
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function meta(article) {
  return `<div class="story-meta"><span class="category">${escapeHtml(article.category)}</span><span>${escapeHtml(article.source)}</span><span>${relativeTime(article.published_at)}</span></div>`;
}

function renderLead(articles) {
  const [lead, second, third] = articles;
  if (!lead) {
    $("#leadGrid").innerHTML = `<div class="error-state">No stories match this view.</div>`;
    return;
  }
  const image = lead.image
    ? `<img src="${escapeHtml(lead.image)}" alt="" loading="eager" onerror="this.remove()">`
    : "";
  const side = [second, third].filter(Boolean).map(article => `
    <a class="secondary-story" href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">
      ${meta(article)}
      <h3>${escapeHtml(article.title)}</h3>
    </a>`).join("");
  $("#leadGrid").innerHTML = `
    <a class="lead-story" href="${escapeHtml(lead.url)}" target="_blank" rel="noopener noreferrer">
      ${image}
      <div class="lead-content">
        ${meta(lead)}
        <h3>${escapeHtml(lead.title)}</h3>
        <p>${escapeHtml(lead.summary)}</p>
      </div>
    </a>
    <div class="secondary-stack">${side}</div>`;
}

function renderRows(articles) {
  const list = $("#storyList");
  list.innerHTML = "";
  articles.slice(3, state.visible).forEach((article, index) => {
    const row = $("#storyRowTemplate").content.cloneNode(true);
    row.querySelector(".story-number").textContent = String(index + 4).padStart(2, "0");
    row.querySelector(".category").textContent = article.category;
    row.querySelector(".source").textContent = article.source;
    row.querySelector(".time").textContent = relativeTime(article.published_at);
    const link = row.querySelector("h3 a");
    link.textContent = article.title;
    link.href = article.url;
    row.querySelector(".story-copy > p").textContent = article.summary;
    list.appendChild(row);
  });
  $("#loadMore").hidden = state.visible >= articles.length;
}

function filteredArticles() {
  return state.data.articles.filter(article => {
    const categoryMatches = state.category === "All" || article.category === state.category;
    const text = `${article.title} ${article.summary}`.toLowerCase();
    const topicMatches = !state.topic || text.includes(state.topic.toLowerCase());
    return categoryMatches && topicMatches;
  });
}

function renderStories() {
  const articles = filteredArticles();
  const activeTopic = $("#activeTopic");
  activeTopic.hidden = !state.topic;
  activeTopic.textContent = state.topic ? `Showing “${state.topic}” ×` : "";
  renderLead(articles);
  renderRows(articles);
}

function renderFilters() {
  const categories = ["All", ...new Set(state.data.articles.map(item => item.category))];
  $("#filters").innerHTML = categories.map(category =>
    `<button class="filter ${category === state.category ? "active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`
  ).join("");
}

function renderTopics() {
  const topics = state.data.topics.length ? state.data.topics : [
    { name: "World", count: 1 },
    { name: "Business", count: 1 },
    { name: "Technology", count: 1 }
  ];
  const colors = ["#173d2a", "#547a49", "#93a94b", "#c2d45b", "#78927c", "#a8b7a8", "#56665d", "#d8dfc0"];
  const total = topics.reduce((sum, topic) => sum + (Number(topic.count) || 1), 0);
  let cursor = 0;
  const segments = topics.map((topic, index) => {
    const start = cursor;
    cursor += ((Number(topic.count) || 1) / total) * 360;
    return `${colors[index % colors.length]} ${start}deg ${cursor}deg`;
  });
  const activeTopic = topics.find(topic => topic.name === state.topic);
  const centerLabel = activeTopic
    ? `<strong>${escapeHtml(activeTopic.name)}</strong><span>${activeTopic.count} mentions</span>`
    : `<strong>${total}</strong><span>topic mentions</span>`;
  const legend = topics.map((topic, index) => {
    const active = state.topic === topic.name;
    return `
      <button class="topic-legend-row ${active ? "active" : ""}" type="button"
        data-topic="${escapeHtml(topic.name)}" aria-pressed="${active}">
        <i style="--topic-color:${colors[index % colors.length]}"></i>
        <span class="topic-name">${escapeHtml(topic.name)}</span>
        <span class="topic-count">${topic.count}</span>
      </button>`;
  }).join("");
  $("#topicChart").innerHTML = `
    <div class="donut-wrap">
      <div class="topic-donut" style="--donut:${segments.join(",")}">
        <div class="donut-center">${centerLabel}</div>
        ${topics.map((topic, index) => {
          const midpoint = topics.slice(0, index).reduce(
            (sum, item) => sum + ((Number(item.count) || 1) / total) * 360, 0
          ) + (((Number(topic.count) || 1) / total) * 180);
          return `<button class="donut-hit" type="button"
            data-topic="${escapeHtml(topic.name)}"
            aria-label="${escapeHtml(topic.name)}, ${topic.count} mentions"
            style="--angle:${midpoint}deg"></button>`;
        }).join("")}
      </div>
    </div>
    <div class="topic-legend">${legend}</div>`;
}

function render(data) {
  state.data = data;
  const generated = new Date(data.generated_at);
  $("#todayLabel").textContent = generated.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric"
  });
  const briefingItems = data.briefing_items?.length
    ? data.briefing_items
    : [{ headline: "Today’s briefing", summary: data.briefing }];
  $("#briefingList").innerHTML = briefingItems.map(item => `
    <li>
      <strong>${escapeHtml(item.headline)}</strong>
      <span>${escapeHtml(item.summary)}</span>
    </li>
  `).join("");
  $("#storyCount").textContent = `${data.articles.length} stories reviewed`;
  $("#updatedAt").textContent = `${data.stale ? "Cached" : "Updated"} ${relativeTime(data.generated_at)}`;
  $("#sourceNote").textContent = `Reporting from ${data.sources.join(", ")}.`;
  renderTopics();
  renderFilters();
  renderStories();
}

async function loadNews(force = false) {
  const button = $("#refreshButton");
  button.classList.add("loading");
  button.disabled = true;
  try {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const endpoint = isLocal
      ? `/api/news${force ? "?refresh=1" : ""}`
      : `./data/news.json${force ? `?refresh=${Date.now()}` : ""}`;
    const response = await fetch(endpoint, { cache: force ? "no-store" : "default" });
    if (!response.ok) throw new Error("News service unavailable");
    const data = await response.json();
    render(data);
  } catch (error) {
    $("#leadGrid").innerHTML = `<div class="error-state"><div><strong>We couldn’t reach the newsroom.</strong><br>Check your connection, then try refresh.</div></div>`;
  } finally {
    button.classList.remove("loading");
    button.disabled = false;
  }
}

$("#refreshButton").addEventListener("click", () => loadNews(true));
$("#loadMore").addEventListener("click", () => {
  state.visible += 10;
  renderRows(filteredArticles());
});
$("#filters").addEventListener("click", event => {
  const button = event.target.closest(".filter");
  if (!button) return;
  state.category = button.dataset.category;
  state.topic = null;
  state.visible = 10;
  renderFilters();
  renderTopics();
  renderStories();
});
$("#topicChart").addEventListener("click", event => {
  const button = event.target.closest("[data-topic]");
  if (!button) return;
  state.topic = state.topic === button.dataset.topic ? null : button.dataset.topic;
  state.category = "All";
  state.visible = 10;
  renderTopics();
  renderFilters();
  renderStories();
  $("#stories").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#activeTopic").addEventListener("click", () => {
  state.topic = null;
  state.visible = 10;
  renderTopics();
  renderStories();
});
loadNews();
