import { fetchCoupons } from "./api.js";
import { setupEvents } from "./event.js";
import {
    PAGE_SIZE,
    appendCouponCards,
    getElements,
    normalizeTags,
    renderSkeletons,
    renderTagFilters,
    setStatus,
    showToast,
    updateInfiniteTrigger,
    updateTagFilterSummary
} from "./ui.js";

const elements = getElements();

const state = {
    allCoupons: [],
    filteredCoupons: [],
    renderedCount: 0,
    isAppending: false,
    activeKeyword: "",
    tagMatchMode: "union",
    selectedTags: new Set(),
    allAvailableTags: []
};

function normalize(value) {
    return String(value ?? "").toLowerCase();
}

function hasMoreCoupons() {
    return state.renderedCount < state.filteredCoupons.length;
}

function buildTagCatalog(coupons) {
    const counter = new Map();
    coupons.forEach((coupon) => {
        normalizeTags(coupon.tags).forEach((tag) => {
            counter.set(tag, (counter.get(tag) || 0) + 1);
        });
    });
    return [...counter.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant"))
        .map(([name]) => name);
}

function getTagMatch(couponTags, tagsToMatch, mode) {
    if (!tagsToMatch.length) {
        return true;
    }
    const couponTagSet = new Set(couponTags);
    if (mode === "intersection") {
        return tagsToMatch.every((tag) => couponTagSet.has(tag));
    }
    return tagsToMatch.some((tag) => couponTagSet.has(tag));
}

function filterCoupons(keyword) {
    const key = normalize(keyword).trim();
    const tagsToMatch = [...state.selectedTags];
    return state.allCoupons.filter((coupon) => {
        const keywordMatched = !key ||
            normalize(coupon.coupon_num).includes(key) ||
            normalize(coupon.description).includes(key) ||
            normalize(normalizeTags(coupon.tags).join(" ")).includes(key);
        if (!keywordMatched) {
            return false;
        }
        return getTagMatch(normalizeTags(coupon.tags), tagsToMatch, state.tagMatchMode);
    });
}

function appendNextPage() {
    if (state.isAppending || !hasMoreCoupons()) {
        updateInfiniteTrigger(elements.infiniteTriggerEl, state.filteredCoupons.length, state.renderedCount);
        return;
    }

    state.isAppending = true;
    const startIndex = state.renderedCount;
    const nextCoupons = state.filteredCoupons.slice(startIndex, startIndex + PAGE_SIZE);
    const addedCount = appendCouponCards(elements.listEl, nextCoupons, startIndex, state.activeKeyword);

    state.renderedCount += addedCount;
    elements.visibleCountEl.textContent = String(state.renderedCount);
    elements.emptyStateEl.hidden = state.filteredCoupons.length > 0;
    state.isAppending = false;
    updateInfiniteTrigger(elements.infiniteTriggerEl, state.filteredCoupons.length, state.renderedCount);
}

function renderCoupons(coupons, keyword = "") {
    state.filteredCoupons = coupons;
    state.activeKeyword = String(keyword ?? "").trim();
    state.renderedCount = 0;
    elements.listEl.innerHTML = "";
    elements.visibleCountEl.textContent = "0";
    elements.emptyStateEl.hidden = coupons.length > 0;

    appendNextPage();

    while (hasMoreCoupons() && elements.listEl.getBoundingClientRect().bottom < window.innerHeight + 80) {
        appendNextPage();
    }

    updateInfiniteTrigger(elements.infiniteTriggerEl, state.filteredCoupons.length, state.renderedCount);
}

function updateResults() {
    const keyword = elements.searchEl.value;
    const filtered = filterCoupons(keyword);
    renderCoupons(filtered, keyword);

    const trimmedKeyword = keyword.trim();
    const hasKeyword = Boolean(trimmedKeyword);
    const hasTags = state.selectedTags.size > 0;
    if (hasKeyword || hasTags) {
        const conditions = [];
        if (hasKeyword) {
            conditions.push(`關鍵字「${trimmedKeyword}」`);
        }
        if (hasTags) {
            conditions.push(`標籤${state.tagMatchMode === "intersection" ? "交集" : "聯集"} ${state.selectedTags.size} 個`);
        }
        setStatus(elements.statusEl, `${conditions.join("＋")} 共 ${filtered.length} 筆`);
    } else if (state.allCoupons.length > 0) {
        setStatus(elements.statusEl, `已載入 ${state.allCoupons.length} 筆折價券`, "success");
    }
}

async function copyCode(code) {
    try {
        await navigator.clipboard.writeText(code);
        showToast(elements.toastEl, `已複製 ${code}`);
    } catch {
        showToast(elements.toastEl, "複製失敗，請手動選取代碼");
    }
}

function refreshTagFilters() {
    renderTagFilters(elements.tagsFilterListEl, state.allAvailableTags, state.selectedTags);
    updateTagFilterSummary(elements.tagsFilterSummaryEl, state.selectedTags, state.tagMatchMode);
}

async function loadCoupons() {
    renderSkeletons(elements.listEl, elements.infiniteTriggerEl);
    setStatus(elements.statusEl, "正在載入折價券資料...");

    try {
        state.allCoupons = await fetchCoupons();
        state.allAvailableTags = buildTagCatalog(state.allCoupons);
        refreshTagFilters();
        elements.totalCountEl.textContent = String(state.allCoupons.length);
        renderCoupons(state.allCoupons, elements.searchEl.value);
        setStatus(elements.statusEl, `已載入 ${state.allCoupons.length} 筆折價券`, "success");
    } catch (error) {
        state.allCoupons = [];
        state.allAvailableTags = [];
        state.selectedTags.clear();
        refreshTagFilters();
        elements.totalCountEl.textContent = "0";
        renderCoupons([], elements.searchEl.value);
        setStatus(elements.statusEl, `載入失敗：${error.message}`, "error");
    }
}

setupEvents({
    elements,
    onSearchInput: updateResults,
    onTagToggle: (tag, button) => {
        if (state.selectedTags.has(tag)) {
            state.selectedTags.delete(tag);
        } else {
            state.selectedTags.add(tag);
        }
        button.classList.toggle("active", state.selectedTags.has(tag));
        button.setAttribute("aria-pressed", state.selectedTags.has(tag) ? "true" : "false");
        updateTagFilterSummary(elements.tagsFilterSummaryEl, state.selectedTags, state.tagMatchMode);
        updateResults();
    },
    onMatchModeChange: (value) => {
        state.tagMatchMode = value === "intersection" ? "intersection" : "union";
        updateTagFilterSummary(elements.tagsFilterSummaryEl, state.selectedTags, state.tagMatchMode);
        updateResults();
    },
    onDescriptionToggle: (toggleButton) => {
        const textEl = toggleButton.closest(".description-wrap")?.querySelector(".description-text");
        if (!textEl) {
            return;
        }
        const expanded = toggleButton.dataset.expanded === "true";
        const nextExpanded = !expanded;
        textEl.classList.toggle("is-collapsed", !nextExpanded);
        toggleButton.dataset.expanded = nextExpanded ? "true" : "false";
        toggleButton.textContent = nextExpanded ? "顯示更少" : "顯示更多";
    },
    onCopyButtonClick: (button) => {
        copyCode(button.dataset.code || "");
    },
    onInfiniteIntersect: appendNextPage
});

loadCoupons();
