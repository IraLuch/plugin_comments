import { ItemView, WorkspaceLeaf } from 'obsidian';
import CommentPlugin from '../main';
import { createRoot, Root } from 'react-dom/client';
import {CommentForm} from '../ui/components/commentForm'


export const VIEW_TYPE_ADD_COMMENT = 'add-comment-view';

export class AddCommentView extends ItemView {
  private root: Root | null = null;


  constructor(leaf: WorkspaceLeaf, private plugin: CommentPlugin) {
    super(leaf);
  }

  render(text: string, filePath: string) {
    const container = this.contentEl;
    container.empty();
    this.root = createRoot(container);
    
    this.root.render(
			<CommentForm filePath={filePath} plugin={this.plugin} selectedText={text}></CommentForm>
		);
  }
  getViewType() { return VIEW_TYPE_ADD_COMMENT; }
  getDisplayText() { return 'Комментарии'; }
  async onOpen() {}
  async onClose() {
    this.root?.unmount();
  }
}


