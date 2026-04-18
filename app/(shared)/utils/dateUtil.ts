// KST 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환
export const getTodayKST = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// Date 객체를 KST 기준 YYYY-MM-DD 형식으로 반환
export const toDateStringKST = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};
