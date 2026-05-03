export function setupEvents({
    elements,
    onSearchInput,
    onTagToggle,
    onMatchModeChange,
    onSortChange,
    onDescriptionToggle,
    onCopyButtonClick,
    onInfiniteIntersect
}) {
    const {
        listEl,
        searchEl,
        tagsFilterListEl,
        sortSelectEl,
        infiniteTriggerEl
    } = elements;

    if (searchEl) {
        searchEl.addEventListener("input", onSearchInput);
    }

    if (tagsFilterListEl) {
        tagsFilterListEl.addEventListener("click", (event) => {
            const button = event.target.closest(".filter-tag");
            if (!button) {
                return;
            }
            const tag = button.dataset.tag;
            if (!tag) {
                return;
            }
            onTagToggle(tag, button);
        });
    }

    document.querySelectorAll("input[name='tag-match-mode']").forEach((radio) => {
        radio.addEventListener("change", (event) => {
            onMatchModeChange(event.target.value);
        });
    });

    if (sortSelectEl) {
        sortSelectEl.addEventListener("change", (event) => {
            onSortChange(event.target.value);
        });
    }

    if (listEl) {
        listEl.addEventListener("click", (event) => {
            const toggleButton = event.target.closest(".description-toggle");
            if (toggleButton) {
                onDescriptionToggle(toggleButton);
                return;
            }
            const button = event.target.closest(".copy-btn");
            if (button) {
                onCopyButtonClick(button);
            }
        });
    }

    if (!infiniteTriggerEl) {
        return null;
    }

    const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            onInfiniteIntersect();
        }
    }, {
        root: null,
        rootMargin: "180px 0px",
        threshold: 0
    });

    observer.observe(infiniteTriggerEl);
    return observer;
}
