export const PAGE_SIZE = 12;

let toastTimer = null;

export function getElements() {
    return {
        listEl: document.getElementById("coupon-list"),
        searchEl: document.getElementById("search-input"),
        statusEl: document.getElementById("status"),
        totalCountEl: document.getElementById("total-count"),
        visibleCountEl: document.getElementById("visible-count"),
        emptyStateEl: document.getElementById("empty-state"),
        infiniteTriggerEl: document.getElementById("infinite-trigger"),
        toastEl: document.getElementById("toast"),
        tagsFilterListEl: document.getElementById("tags-filter-list"),
        tagsFilterSummaryEl: document.getElementById("tags-filter-summary"),
        sortSelectEl: document.getElementById("sort-select")
    };
}

export function normalizeTags(rawTags) {
    const source = Array.isArray(rawTags) ? rawTags : String(rawTags ?? "").split(/[、,，|]/);
    return source
        .map((tag) => String(tag ?? "").trim())
        .filter(Boolean);
}

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text, keyword) {
    const key = String(keyword ?? "").trim();
    if (!key) {
        return text;
    }
    const keywordRegex = new RegExp(`(${escapeRegExp(key)})`, "gi");
    return text.replace(keywordRegex, `<mark class="keyword-highlight">$1</mark>`);
}

function highlightTextInHtml(html, keyword) {
    const key = String(keyword ?? "").trim();
    if (!key) {
        return html;
    }
    return html
        .split(/(<[^>]+>)/g)
        .map((part) => {
            if (part.startsWith("<") && part.endsWith(">")) {
                return part;
            }
            return highlightText(part, key);
        })
        .join("");
}

function formatDescriptionHtml(rawText, keyword) {
    let html = escapeHtml(String(rawText ?? "").trim() || "暫無說明");
    const priceRegex = /價格：(\$\d+(?:~\$\d+)?)/;
    html = html.replace(priceRegex, "價格：<span class=\"price-highlight\">$1</span>");
    html = html.replaceAll("。", "<br><br>");
    return highlightTextInHtml(html, keyword);
}

export function showToast(toastEl, message) {
    if (!toastEl) {
        return;
    }
    toastEl.textContent = message;
    toastEl.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        toastEl.classList.remove("show");
    }, 1400);
}

export function setStatus(statusEl, message, type = "") {
    if (!statusEl) {
        return;
    }
    statusEl.textContent = message;
    statusEl.className = type ? `status ${type}` : "status";
}

export function renderSkeletons(listEl, infiniteTriggerEl, count = 6) {
    if (!listEl || !infiniteTriggerEl) {
        return;
    }
    listEl.innerHTML = "";
    infiniteTriggerEl.hidden = true;
    for (let i = 0; i < count; i += 1) {
        const skeleton = document.createElement("div");
        skeleton.className = "skeleton";
        listEl.appendChild(skeleton);
    }
}

function createCard(coupon, index, keyword = "") {
    const code = escapeHtml(String(coupon.coupon_num ?? "").trim() || "未提供");
    const rawDescription = String(coupon.description ?? "").trim() || "暫無說明";
    const tags = normalizeTags(coupon.tags);

    const highlightedCode = highlightText(code, keyword);
    const fullDescriptionHtml = formatDescriptionHtml(rawDescription, keyword);
    const normalizedTags = tags.map((tag) => escapeHtml(tag));
    const tagsHtml = `<div class="tags-row${normalizedTags.length ? "" : " tags-row-empty"}" aria-label="優惠標籤"${normalizedTags.length ? "" : " aria-hidden=\"true\""}><div class="tags-list">${normalizedTags.map((tag) => `<span class="tags-item">${highlightText(tag, keyword)}</span>`).join("")}</div></div>`;

    const card = document.createElement("article");
    card.className = "coupon-card";
    card.style.setProperty("--i", index);
    card.innerHTML = `
        <div class="card-head">
            <span class="tag">優惠代碼</span>
            <h3 class="code">${highlightedCode}</h3>
        </div>
        ${tagsHtml}
        <div class="description-wrap">
            <p class="description">
                <span class="description-text is-collapsed">${fullDescriptionHtml}</span>
            </p>
            <button class="description-toggle" type="button" data-expanded="false" hidden>顯示更多</button>
        </div>
        <button class="copy-btn" onclick="window.open('https://www.pizzahut.com.tw/order/?mode=step_2&type_id=1025&cno=${code}', '_blank')" type="button">跳轉訂餐</button>
    `;
    return card;
}

function applyDescriptionExpansion(card) {
    const textEl = card.querySelector(".description-text");
    const toggleEl = card.querySelector(".description-toggle");
    if (!textEl || !toggleEl) {
        return;
    }

    textEl.classList.add("is-collapsed");
    const needsToggle = textEl.scrollHeight > textEl.clientHeight + 1;
    toggleEl.hidden = !needsToggle;
    toggleEl.dataset.expanded = "false";
    toggleEl.textContent = "顯示更多";
}

export function appendCouponCards(listEl, coupons, startIndex, keyword) {
    if (!listEl) {
        return 0;
    }
    coupons.forEach((coupon, index) => {
        const card = createCard(coupon, startIndex + index, keyword);
        listEl.appendChild(card);
        applyDescriptionExpansion(card);
    });
    return coupons.length;
}

export function renderTagFilters(tagsFilterListEl, tags, selectedTags) {
    if (!tagsFilterListEl) {
        return;
    }
    tagsFilterListEl.innerHTML = "";
    tags.forEach((tag) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-tag";
        button.dataset.tag = tag;
        button.textContent = tag;
        button.setAttribute("aria-pressed", selectedTags.has(tag) ? "true" : "false");
        if (selectedTags.has(tag)) {
            button.classList.add("active");
        }
        tagsFilterListEl.appendChild(button);
    });
}

export function updateTagFilterSummary(tagsFilterSummaryEl, selectedTags, tagMatchMode) {
    if (!tagsFilterSummaryEl) {
        return;
    }
    const count = selectedTags.size;
    if (!count) {
        tagsFilterSummaryEl.textContent = "未選取標籤";
        return;
    }
    tagsFilterSummaryEl.textContent = `已選 ${count} 個標籤（${tagMatchMode === "intersection" ? "交集" : "聯集"}）`;
}

export function updateInfiniteTrigger(infiniteTriggerEl, filteredCount, renderedCount) {
    if (!infiniteTriggerEl) {
        return;
    }
    if (filteredCount === 0) {
        infiniteTriggerEl.hidden = true;
        return;
    }
    infiniteTriggerEl.hidden = false;
    infiniteTriggerEl.textContent = renderedCount < filteredCount
        ? "往下滑可載入更多折價券..."
        : `已顯示全部 ${filteredCount} 筆`;
}
