import { Editor, EditorPosition, TFile, Notice, Plugin, WorkspaceLeaf, MarkdownView, EditorRange } from 'obsidian';
import { commentTagPlugin } from './editing/editorTag-plugin';
import { AddCommentView, VIEW_TYPE_ADD_COMMENT } from './views/add-comments-view';
import { Comment } from './types';
import { VIEW_TYPE_VIEW_COMMENTS, ViewCommentsView } from './views/view-comments-view';
import { registerReadingMode } from './editing/registerReadingMode';
import { registerCommands } from './commands/commands';


export default class CommentsPlugin extends Plugin {
  // хранилище комментариев: Ключ — tagId, Значение — массив связанных объектов Comment
  commentsByText: Map<string, Comment[]> = new Map<string, Comment[]>();

  id: string | null = null;
  to: EditorPosition | null = null;
  from: EditorPosition | null = null;
  filePath: string | null = null;

  private sourceLeaf: WorkspaceLeaf | null = null;


  async onload() {

    registerReadingMode(this)

    this.registerEditorExtension(commentTagPlugin);

    await this.loadComments();

    registerCommands(this);

    this.registerView(
      VIEW_TYPE_ADD_COMMENT,
      (leaf) => new AddCommentView(leaf, this)
    );

    this.registerView(
      VIEW_TYPE_VIEW_COMMENTS,
      (leaf) => new ViewCommentsView(leaf, this)
    );



  };

  async loadComments() {
    const data = await super.loadData();
    if (!data || !data.commentsByText) return;
    this.commentsByText = new Map(Object.entries(data.commentsByText));
  }

  async saveComments() {
    const obj = {
      commentsByText: Object.fromEntries(this.commentsByText)
    };
    await this.saveData(obj);
  }

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

  async activateView(text: string | null = null, id: string | null = null) {

    //если передан текст - открываем окно для добавлния, иначе - просмотр
    const viewType = text ? VIEW_TYPE_ADD_COMMENT : VIEW_TYPE_VIEW_COMMENTS;

    const { workspace } = this.app;
    const leaf = await this.getLeaf(viewType);

    if (!leaf) return;
    const view = leaf.view;

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;

    if (view instanceof AddCommentView) {
      if (!text || !id || !this.filePath) return;
      view.render(text, this.filePath);
    }

    else if (view instanceof ViewCommentsView) {

      // открываем все комментарии файла
      if (!id) {
        const allComments = Array.from(this.commentsByText.values()).flat().filter(c => c.filePath === activeFile?.path);
        view.renderComments(allComments, activeFile.path);
      }

      // открываем комментарии по блоку текста
      else {
        const filterComments = this.commentsByText.get(id) || [];
        view.renderComments(filterComments, activeFile.path);
      }
    }
    workspace.revealLeaf(leaf);
  }

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

  async createComment(comment: Comment) {
    const branch = this.commentsByText.get(comment.tagId) || [];
    branch.push(comment);
    this.commentsByText.set(comment.tagId, branch);
    if (branch.length === 1) {

      this.insertTag(comment.tagId);
    }


    await this.saveComments();
    this.activateView(null, comment.tagId);
  }
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

    const tagMatch = textAfterSelection.match(/^\s*\[#comment:([0-9]+)\]/);

    if (tagMatch && tagMatch[1]) {
      this.id = tagMatch[1];
    } else {
      this.id = `${Date.now()}`;
    }
    await this.activateView(sel, this.id);
  }

  async insertTag(tagId: string) {

    if (!this.to) return;
    const view = this.sourceLeaf?.view;
    console.log(view)

    if (!(view instanceof MarkdownView)) return;


    const editor = view.editor;
    console.log(editor)

    const tagText = `[#comment:${tagId}]`;

    // вставляем тег после выделенного текста
    editor.replaceRange(` ${tagText} `, this.to);

    this.to = null;
    this.from = null;
    this.id = null;
  }
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

  openCommentInFile(comment: Comment) {
    let markdownView: MarkdownView | null = null;

    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView && leaf.view.file?.path === comment.filePath) {
        markdownView = leaf.view;
      }});

    if (!markdownView) {
      new Notice(`Файл ${comment.filePath} должен быть открыт на экране.`);
      return;
    }
    if (!markdownView) return;

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

  searchReply(comment: Comment, replyCom: Comment | undefined){
  if (!replyCom && comment.replyTo) 
			{
			new Notice("Комментарий не найден");
			return;
		}
		if(!replyCom) return;
		const container = document.querySelector('.comments');
		const comEl = container?.querySelector(`[id="${replyCom.id}"]`);
	
		if (!comEl) return;
		comEl?.scrollIntoView({ behavior: "smooth", block: "center" });
		comEl?.classList.add("is-highlighted");
		setTimeout(() => {
			comEl?.classList.remove("is-highlighted");
		}, 4500);
  }

   async deleteComment(comment: Comment){
    const branch = this.commentsByText.get(comment.tagId) || [];
		const updateBranch = branch?.filter((c) => c.id !== comment.id);
		this.commentsByText.set(comment.tagId, updateBranch);

		await this.saveComments();
	
		if (updateBranch.length === 0 || !comment.replyTo) {
			this.commentsByText.delete(comment.tagId);
			this.removeTag(comment);
		}
	
  }
  async onunload() { }
}