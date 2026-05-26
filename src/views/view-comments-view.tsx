import { DropdownComponent, EditorRange, ItemView, MarkdownView, Menu, Notice, SearchComponent, TFile, WorkspaceLeaf } from 'obsidian';
import AddCommentPlugin from '../main';
import { Comment } from '../types';
import CommentsPlugin from '../main';
import { getCommentAuthor } from '../utils';
import { createRoot, Root } from 'react-dom/client';
import {CommentApp} from '../ui/CommentApp'


export const VIEW_TYPE_VIEW_COMMENTS = 'view-comments-view';

export class ViewCommentsView extends ItemView {
   private root: Root | null = null;
   private filePath: string | null = null;


  constructor(leaf: WorkspaceLeaf, private plugin: CommentsPlugin) {
    super(leaf);
  }

  renderComments(comments: Comment[], filePath: string) {

    this.filePath = filePath;
     const container = this.contentEl;
    container.empty();
     this.root = createRoot(container);
    this.root.render(
			<CommentApp allComments={comments} filePath={filePath} plugin={this.plugin}></CommentApp>
		);



  }

  getViewType() { return VIEW_TYPE_VIEW_COMMENTS; }
  getDisplayText() { return 'Комментарии'; }
  async onOpen() {}
  async onClose() {
    this.root?.unmount();
   }

  
  }
