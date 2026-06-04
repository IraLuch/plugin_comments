import { Editor, EditorPosition, TFile, Notice, Plugin, WorkspaceLeaf, MarkdownView, EditorRange } from 'obsidian';
import { commentTagPlugin } from './editing/editorTag-plugin';
import { Comment } from './types';

import { registerReadingMode } from './editing/registerReadingMode';
import { registerCommands } from './commands/commands';
import { ViewCommentsView, VIEW_TYPE_COMMENTS } from './views/view-comments';


export default class CommentsPlugin extends Plugin {
  // хранилище комментариев: Ключ — tagId, Значение — массив связанных объектов Comment
  commentsByText: Map<string, Comment[]> = new Map<string, Comment[]>();

  tagId: string | null = null;
  to: EditorPosition | null = null;
  from: EditorPosition | null = null;
  filePath: string | null = null;
  public isBlockMode = false;
  public openedFromTag = false;

  private sourceLeaf: WorkspaceLeaf | null = null;


  async onload() {

    registerReadingMode(this)

    this.registerEditorExtension(commentTagPlugin);

    await this.loadComments();

    registerCommands(this);


    this.registerEvent(
      this.app.workspace.on("file-open", async () => {

          this.openedFromTag = false;
        this.tagId = null;
        this.isBlockMode = false;


        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return;

        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_COMMENTS);

        if (leaves.length === 0) return;

        const leaf = leaves[0]!;

        const comments = Array.from(this.commentsByText.values()).flat()
          .filter(c => c.filePath === activeFile.path);

        if (leaf.view instanceof ViewCommentsView) {
          leaf.view.renderComments(comments, activeFile.path);
        }
      }


      ));

    this.registerView(
      VIEW_TYPE_COMMENTS,
      (leaf) => new ViewCommentsView(leaf, this)
    );



  };

  /**
    * Загружает сохранённые комментарии из data.json
    */
  async loadComments() {
    const data = await super.loadData();
    if (!data || !data.commentsByText) return;
    this.commentsByText = new Map(Object.entries(data.commentsByText));
  }

  /**
     *  Сохраняет текущее состояние комментариев в data.json
     */
  async saveComments() {
    const obj = {
      commentsByText: Object.fromEntries(this.commentsByText)
    };
    await this.saveData(obj);
  }


  /**
   *  Удаляет всю ветку комментариев по идентификатору тега
   */
  async deleteCommentByTagId(tagId: string | null) {


    if (!tagId) return;

    this.commentsByText.delete(tagId)


    if (this.app.workspace.rightSplit) {
      this.app.workspace.rightSplit.collapse();
    }
    const tagElem = document.getElementById(tagId)

    if (tagElem) {
      tagElem.remove();
    }

    await this.saveComments();
    new Notice("Комментарий успешно удален");
  }


  /**
    *  Открывает правую панель
    * если передан text — форма создания комментария,
    * иначе просмотр существующих комментариев
    */
  async activateView(text: string | null = null, tagId: string | null = null) {

    const { workspace } = this.app;
    const leaf = await this.getLeaf(VIEW_TYPE_COMMENTS);

    if (!leaf) return;
    const view = leaf.view;

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;


    if (view instanceof ViewCommentsView) {
      if (text && tagId && this.filePath) { view.renderForm(text, this.filePath); }

      // открываем все комментарии файла
      else if (!tagId) {
        this.openedFromTag = false;
        
    this.tagId = null;
        this.isBlockMode = false;
        const allComments = Array.from(this.commentsByText.values()).flat().filter(c => c.filePath === activeFile?.path);
        view.renderComments(allComments, activeFile.path);
      }

      // открываем комментарии по блоку текста
      else {
         this.openedFromTag = true;
         this.tagId = tagId;
             this.isBlockMode = true;
        const filterComments = this.commentsByText.get(tagId) || [];
        view.renderComments(filterComments, activeFile.path);
      }
    }
    workspace.revealLeaf(leaf);
  }


  /**
    *   Получает существующую панель нужного типа
    * или создаёт новую справа
    */
  private async getLeaf(viewType: string) {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(viewType);
    if (leaves.length > 0) {
      leaf = leaves[0]!;
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: viewType, active: true });
    }

    return leaf;
  }

  /**
   *   Добавляет комментарий в ветку и создаёт тег в тексте
   * если это первый комментарий для данного блока
   */
  async createComment(comment: Comment) {
    const branch = this.commentsByText.get(comment.tagId) || [];
    branch.push(comment);
    this.commentsByText.set(comment.tagId, branch);
    if (branch.length === 1) {

      this.insertTag(comment.tagId);
    }
    await this.saveComments();

    const leaf = await this.getLeaf(VIEW_TYPE_COMMENTS);

    if (!leaf) return;
    const view = leaf.view;

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;


    if (view instanceof ViewCommentsView) {
      if (comment.replyTo) {
        this.isBlockMode = true;
         this.tagId = comment.tagId;
        const coms =  this.getCommentBlock(comment)
        view.renderComments(
         coms,
          activeFile.path
        );
      }
      else {
    
        this.activateView(null, comment.tagId);
      }
    }
  }

  /**
   *  Обрабатывает создание комментария для текущего выделения
   */
  async addComment(editor: Editor) {

    const sel = editor.getSelection();
    if (!sel || sel.trim().length === 0) return;

    this.sourceLeaf = this.app.workspace.activeLeaf;

    this.from = editor.getCursor("from");
    this.to = editor.getCursor("to");
    this.filePath = this.app.workspace.getActiveFile()?.path || null;;


    const nextLineExists = this.to.line + 1 < editor.lineCount();

    // берем текущую и следующую строку (если есть) для проверки,
    // чтобы не дублировать тег
    const endPos = {
      line: nextLineExists ? this.to.line + 1 : this.to.line,
      ch: nextLineExists ? editor.getLine(this.to.line + 1).length : editor.getLine(this.to.line).length
    };
    const textAfterSelection = editor.getRange(this.to, endPos);

    // проверяем, есть ли уже тег комментария после выделенного текста.
    // если есть — используем существующую ветку комментариев.
    const tagMatch = textAfterSelection.match(/^\s*\[#comment:([0-9]+)\]/);

    if (tagMatch && tagMatch[1]) {

      this.tagId = tagMatch[1];
    } else {
      this.tagId = `${Date.now()}`;
    }
    
    this.openedFromTag = true;
    await this.activateView(sel, this.tagId);
  }


  /**
    *  Вставляет маркер комментария в текст документа
    */
  async insertTag(tagId: string) {

    if (!this.to) return;
    const view = this.sourceLeaf?.view;

    if (!(view instanceof MarkdownView)) return;

    const editor = view.editor;

    const tagText = `[#comment:${tagId}]`;

    // вставляем тег после выделенного текста
    editor.replaceRange(` ${tagText} `, this.to);

    this.to = null;
    this.from = null;
    this.tagId = null;
  }

  /**
    *   Удаляет тег комментария из файла,
    * если ветка комментариев была полностью удалена
    */
  async removeTag(com: Comment) {
    const file = this.app.vault.getAbstractFileByPath(com.filePath);
    if (!file || !(file instanceof TFile)) return;

    let fileContent = await this.app.vault.read(file);

    const tagRegExp = new RegExp(`\\[#comment:${com.tagId}\\]`, 'g');

    if (tagRegExp.test(fileContent)) {

      fileContent = fileContent.replace(tagRegExp, '');

      await this.app.vault.modify(file, fileContent);
    }
  }


  /**
    *   Переходит к месту в файле, связанному с комментарием,
    *  прокручивает редактор и подсвечивает текст
    */
  openCommentInFile(comment: Comment) {
    let markdownView: MarkdownView | null = null;

    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView && leaf.view.file?.path === comment.filePath) {
        markdownView = leaf.view;
      }
    });

    if (!markdownView) {
      new Notice(`Файл ${comment.filePath} должен быть открыт на экране.`);
      return;
    }


    this.app.workspace.setActiveLeaf((markdownView as MarkdownView).leaf, { focus: true });

    const editor = (markdownView as MarkdownView).editor;
    const fullText = editor.getValue();
    const tag = `[#comment:${comment.tagId}]`;

    const tagPos = fullText.indexOf(tag);
    if (tagPos === -1) {
      new Notice("Тег комментария не найден в тексте файла.");
      return;
    }
    const searchStartPos = Math.max(0, tagPos - comment.selectedText.length - 1);

    const textBeforeTag = fullText.substring(searchStartPos, tagPos);

    let startInWindow = textBeforeTag.lastIndexOf(comment.selectedText);

    let start: number;
    let end: number;

    if (startInWindow !== -1) {
      start = searchStartPos + startInWindow;
      end = start + comment.selectedText.length;
    } else {
      start = tagPos;
      end = tagPos + tag.length;
    }

    const startPosition = editor.offsetToPos(start);
    const endPosition = editor.offsetToPos(end);

    const range: EditorRange = { from: startPosition, to: endPosition };
    editor.scrollIntoView(range, true);

    editor.setSelection(startPosition, endPosition);
    editor.focus();


    const selectionElements = (markdownView as MarkdownView).contentEl.querySelectorAll('.cm-selectionBackground');

    selectionElements.forEach((el) => {
      el.classList.add('flash-highlight');

      setTimeout(() => {
        el.classList.add('fade-out');
      }, 500);

      setTimeout(() => {
        el.classList.remove('flash-highlight', 'fade-out');
      }, 1500);
    });

    setTimeout(() => {
      editor.setCursor(endPosition);
    }, 1500);

  }


  /**
  *   Находит родительский комментарий в списке ответов
  *  и временно подсвечивает его
  */
  searchReply(comment: Comment, replyCom: Comment | undefined) {
    if (!replyCom && comment.replyTo) {
      new Notice("Комментарий не найден");
      return;
    }
    if (!replyCom) return;
    const container = document.querySelector('.comments');
    const comEl = container?.querySelector(`[id="${replyCom.id}"]`);

    if (!comEl) return;
    comEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    comEl?.classList.add("is-highlighted");
    setTimeout(() => {
      comEl?.classList.remove("is-highlighted");
    }, 4500);
  }


  /**
  *  Удаляет комментарий
  *   если ветка становится пустой — удаляет тег из файла
  */
  async deleteComment(comment: Comment) {
    const branch = this.commentsByText.get(comment.tagId) || [];
    const updateBranch = branch?.filter((c) => c.id !== comment.id && c.replyTo != comment.id);

    this.commentsByText.set(comment.tagId, updateBranch);

    await this.saveComments();

    if (updateBranch.length === 0) {
      this.commentsByText.delete(comment.tagId);
      this.removeTag(comment);
    }

  }
  getCommentBlock(comment: Comment) {

    const allComments = Array.from(this.commentsByText.values()).flat();

    // ищем корневой комментарий
    let root = comment;

    while (root.replyTo) {
      const parent = allComments.find(
        c => c.id === root.replyTo
      );

      if (!parent) break;

      root = parent;
    }

    const result: Comment[] = [root];

    const findReplies = (id: string) => {
      const replies = allComments.filter(c => c.replyTo === id)

      for (const r of replies) {
        result.push(r);
        findReplies(r.id);
      }

    }


    findReplies(root.id)
    const sorted = [...result].sort(
      (a, b) => Number(b.id) - Number(a.id),
    );
    return sorted;
  }

  async onunload() { }
}

