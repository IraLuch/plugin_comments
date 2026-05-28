import * as os from 'os';

export function getCommentAuthor(): string {
    try {
        return os.userInfo().username; 
    } catch (e) {
        return "Пользователь"; 
    }
}

export const formatCommentDate = (id: string): string => {
    const timestamp = Number(id);
    if (isNaN(timestamp)) return "";
    const date = new Date(timestamp);
    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};