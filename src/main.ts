import { Editor, EditorPosition, TFile, MarkdownView, Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { commentTagPlugin } from './editorTag-plugin';
import { AddCommentView, VIEW_TYPE_ADD_COMMENT } from './views/add-comments-view';
import { Comment } from './types';
import { VIEW_TYPE_VIEW_COMMENTS, ViewCommentsView } from './views/view-comments-view';
import { threadId } from 'node:worker_threads';

export default class CommentsPlugin extends Plugin {
  commentsByText: Map<string, Comment[]> = new Map<string, Comment[]>();
  id: string | null = null;
  to: EditorPosition | null = null;
  from: EditorPosition | null = null;
  filePath: string | null = null;
  private activeEditor: Editor | null = null;

  async onload() {

    this.registerEditorExtension(commentTagPlugin);

    await this.loadComments();



    this.registerView(
      VIEW_TYPE_ADD_COMMENT,
      (leaf) => new AddCommentView(leaf, this)
    );

    this.registerView(
      VIEW_TYPE_VIEW_COMMENTS,
      (leaf) => new ViewCommentsView(leaf, this)
    );

    this.addRibbonIcon('message-circle-more', 'Открыть комментарии', async() => {
      await this.activateViewByFilePath();
    });

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        menu.addItem((item) => {
          item
            .setTitle('Добавить комментарий')
            .setIcon('message-circle-plus')
            .onClick(async () => {
              await this.addComment(editor)
            });
        });


      }))


    this.addCommand({
      id: 'add-comment',
      name: 'Добавить комментарий',
      editorCallback: async (editor: Editor) => {
        this.activeEditor = editor;
        await this.addComment(editor)
      },
    })

    this.addCommand({
      id: 'delete-comment',
      name: 'Удалить комментарий',
      editorCallback: async (editor: Editor) => {

        const sel = editor.getSelection();
        if (!sel || sel.trim().length === 0) return;


        const cursorPos = editor.getCursor();
        const line = editor.getLine(cursorPos.line)

        const tagMatch = sel.match(/^\s*\[#comment:([0-9]+)\]/);

        if (tagMatch && tagMatch[1]) {
          await this.deleteCommentByTagId(tagMatch[1])
          editor.replaceSelection("");

        }
        else {

          new Notice("Выделите тег комментария целиком, чтобы удалить его");
        }



      },
    })

  };



  async deleteCommentByTagId(tagId: string | null) {

    if(!tagId) return;
  
    this.commentsByText.delete(tagId)

    if (this.app.workspace.rightSplit) {
      this.app.workspace.rightSplit.collapse();
    }
    await this.saveComments();
    new Notice("Комментарий успешно удален");
  }

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



  async insertTag(tagId: string) {
 
  if (!this.activeEditor || !this.to) return;
  
  const activeFile = this.app.workspace.getActiveFile();
  if (!activeFile) return;

  const tagText = `[#comment:${tagId}]`;

  this.activeEditor.replaceRange(` ${tagText} `, this.to);

  this.to = null;
  this.from = null;
  this.id = null;
}
  async onunload() { }


   async activateViewByFilePath(filePath: string | null =null){
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_VIEW_COMMENTS);
    if (leaves.length > 0) {
      leaf = leaves[0]!;
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: VIEW_TYPE_VIEW_COMMENTS, active: true });
    }
    console.log(leaf)
    if (!leaf) return;
    const activeFile = this.app.workspace.getActiveFile();
     console.log(activeFile)
    if (!activeFile) return;

    const view = leaf.view;
    if (view instanceof ViewCommentsView) {
         const filterComments = Array.from(this.commentsByText.values()).flat().filter(c => c.filePath === (filePath || activeFile.path));
          view.renderComments(filterComments, filePath || activeFile.path);
        }
workspace.revealLeaf(leaf);
    
    if (workspace.rightSplit) {
        
        workspace.rightSplit.expand();
    }
  }

  async activateView(text: string | null = null, id: string | null = null) {
    const viewType = text ? VIEW_TYPE_ADD_COMMENT : VIEW_TYPE_VIEW_COMMENTS;
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(viewType);
    if (leaves.length > 0) {
      leaf = leaves[0]!;
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: viewType, active: true });
    }

    if (!leaf) return;

    const view = leaf.view;
    const activeFile = this.app.workspace.getActiveFile();
    if(!activeFile) return;
    if (view instanceof AddCommentView) {
      if (!text || !id || !this.filePath) return;
       view.render(text, this.filePath);
    }
    else if (view instanceof ViewCommentsView) {
      if (!id) {
        
        const allComments = Array.from(this.commentsByText.values()).flat().filter(c => c.filePath === activeFile?.path);
         view.renderComments(allComments, activeFile.path);
      }
      else {
        const filterComments = this.commentsByText.get(id) || [];

        view.renderComments(filterComments, activeFile.path);
      }
    }



    workspace.revealLeaf(leaf);
  }




  async addComment(editor: Editor) {
    const sel = editor.getSelection();
    if (!sel || sel.trim().length === 0) return;

    this.from = editor.getCursor("from");
    this.to = editor.getCursor("to");
    this.filePath = this.app.workspace.getActiveFile()?.path || null;;

    const nextLineExists = this.to.line + 1 < editor.lineCount();

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

   async removeTag(com: Comment) {
    const file = this.app.vault.getAbstractFileByPath(com.filePath);
    if (!file || !(file instanceof TFile)) return;

    let fileContent = await this.app.vault.read(file);

    const tagRegExp = new RegExp(`\\[#comment:${com.tagId}\\]`, 'g');

    if (tagRegExp.test(fileContent)) {

      fileContent = fileContent.replace(tagRegExp, '');

      await this.app.vault.modify(file, fileContent);
    }
}}