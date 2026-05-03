export async function fetchCoupons() {
    const response = await fetch("/api/coupons");
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
}
