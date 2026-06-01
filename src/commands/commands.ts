import { Editor, Notice } from "obsidian";
import CommentsPlugin from "../main";


/**
 * Регистрация интерфейсных элементов управления, контекстного меню 
  */
export function registerCommands(plugin: CommentsPlugin) {

    // иконка на левой панели для открытия сайдбара
    plugin.addRibbonIcon('message-circle-more', 'Открыть комментарии', async () => {
        await plugin.activateView();
    });

    // пункт в контекстном меню редактора при клике правой кнопкой мыши
    plugin.registerEvent(
        plugin.app.workspace.on("editor-menu", (menu, editor, view) => {
            menu.addItem((item) => {
                item
                    .setTitle('Добавить комментарий')
                    .setIcon('message-circle-plus')
                    .onClick(async () => {
                        await plugin.addComment(editor)
                    });
            });


        }))

    // команда создания комментария по выделенному тексту через палитру команд (Ctrl/Cmd + P)
    plugin.addCommand({
        id: 'add-comment',
        name: 'Добавить комментарий',
        editorCallback: async (editor: Editor) => {
            await plugin.addComment(editor)
        },
    })

    // команда удаления комментария по выделенному тегу через палитру команд (Ctrl/Cmd + P)
    plugin.addCommand({
        id: 'delete-comment',
        name: 'Удалить комментарий',
        editorCallback: async (editor: Editor) => {

            const sel = editor.getSelection();
            if (!sel || sel.trim().length === 0) return;

            const tagMatch = sel.match(/^\s*\[#comment:([0-9]+)\]/);

            if (tagMatch && tagMatch[1]) {
                await plugin.deleteCommentByTagId(tagMatch[1])
                editor.replaceSelection("");
            }
            else {
                new Notice("Выделите тег комментария целиком, чтобы удалить его");
            }

        },
    })
}