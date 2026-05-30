import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Comment } from '../types';
import CommentsPlugin from '../main';
import {CommentApp} from '../ui/CommentApp'
import { Root, createRoot } from 'react-dom/client';


export const VIEW_TYPE_VIEW_COMMENTS = 'view-comments-view';

export class ViewCommentsView extends ItemView {
   private root: Root | null = null;


  constructor(leaf: WorkspaceLeaf, private plugin: CommentsPlugin) {
    super(leaf);
  }

  renderComments(comments: Comment[], filePath: string) {

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
