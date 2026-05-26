import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, PluginSpec, PluginValue, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import AddCommentPlugin from './main';
import { Menu } from 'obsidian';
import { throws } from 'assert';

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

  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const text = view.state.doc.toString();
    const regex = /\[#comment:(.*?)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (!match[0]) continue;

      const tagId = match[0].split(':')[1]?.replace(']', '').trim() || null

      const from = match.index;
      const to = match.index + match[0].length;

      if (to > view.state.doc.length) continue;

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

export class CommentTagWidget extends WidgetType {

  constructor(private tagId: string | null) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const span = document.createElement('a');
    span.textContent = "#comment";
    span.className = "tag cm-hashtag cm-hashtag-begin cm-hashtag-end";
    span.style.cursor = "pointer";

    if (this.tagId) span.id = this.tagId

    span.addEventListener('contextmenu', (e) => {
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
              const tagElem = document.getElementById(this.tagId)

              if (tagElem) {
                tagElem.remove();
              }
            }

          });

      })
      menu.showAtPosition({ x: e.clientX, y: e.clientY });
    })

    span.onclick = () => {

      const plugin = this.getPlugin(view)
      if (plugin) {
        if (!this.tagId) return;
        plugin.activateView(null, this.tagId);
      }
    };
    return span;
  }

  private getPlugin(view: EditorView) {

    const app = (view as any).cm?.view?.plugin?.app || (window as any).app;
    const plugin = app?.plugins?.plugins['comments'] as AddCommentPlugin;
    return plugin

  }

  ignoreEvent(event: Event) {
    return false;
  }
}