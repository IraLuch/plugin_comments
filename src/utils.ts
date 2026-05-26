import * as os from 'os';
export function getCommentAuthor(): string {
    try {
        return os.userInfo().username; 
    } catch (e) {
        return "Пользователь"; 
    }
}

export const formatCommentDate = (id: string): string => {
    // 1. Превращаем строку-id обратно в число (таймстамп)
    const timestamp = Number(id);
    
    // Если id оказался не числом, возвращаем пустую строку (страховка)
    if (isNaN(timestamp)) return "";

    // 2. Создаем объект даты
    const date = new Date(timestamp);

    // 3. Форматируем в удобный вид (ДД.ММ.ГГГГ, ЧЧ:ММ)
    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};