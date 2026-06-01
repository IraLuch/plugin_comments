import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, PluginSpec, PluginValue, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import AddCommentPlugin from '../main';
import { Menu } from 'obsidian';
import CommentsPlugin from '../main';

/**
 * Заменяет текстовые теги [#comment:id] на UI-виджеты в редакторе
 */

class CommentTagPlugin implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  destroy() { }

  /**
     * Парсинг текста документа и создание тегов на месте сырых тегов
     */
  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();

    const text = view.state.doc.toString();
    
    const regex = /\[#comment:([0-9]+)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (!match[0] || !match[1]) continue;

      const tagId = match[1]

      const from = match.index;
      const to = match.index + match[0].length;

      builder.add(
        from,
        to,
        Decoration.replace({
          widget: new CommentTagWidget(tagId),
          inclusive: false
        })
      );
    }

    return builder.finish();
  }
}

const pluginSpec: PluginSpec<CommentTagPlugin> = {
  decorations: (value: CommentTagPlugin) => value.decorations,
};

export const commentTagPlugin = ViewPlugin.fromClass(
  CommentTagPlugin,
  pluginSpec
);


/**
 * Виджет, который рендерится в редакторе вместо сырого текста 
 */
export class CommentTagWidget extends WidgetType {

  constructor(private tagId: string | null) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const tagEl = document.createElement('a');
    tagEl.textContent = `^^${this.tagId}`;


    if (this.tagId) tagEl.id = this.tagId

    tagEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const menu = new Menu();

      menu.addItem((item) => {
        item.setTitle('Удалить комментарий')
          .setIcon('message-circle-x')
          .onClick(async () => {
            const plugin = this.getPlugin(view)
            if (plugin && this.tagId) {
              await plugin.deleteCommentByTagId(this.tagId);
            }

          });

      })
      menu.showAtPosition({ x: e.clientX, y: e.clientY });
    })

    tagEl.onclick = () => {

      const plugin = this.getPlugin(view)
      if (plugin) {
        if (!this.tagId) return;
        plugin.activateView(null, this.tagId);
      }
    };
    return tagEl;
  }


  /**
     * Извлечение экземпляра плагина 
     */
  private getPlugin(view: EditorView) {
    return  (window as any).app.plugins.plugins['comments'] as CommentsPlugin;

  }
}