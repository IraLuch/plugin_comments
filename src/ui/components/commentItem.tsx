import CommentsPlugin from "../../main";
import { Comment } from "../../types";
import * as obsidian from "obsidian";
import { CommentForm } from "./commentForm";
import { formatCommentDate } from "../../utils";

type Props = {
	plugin: CommentsPlugin;
	comment: Comment;
	comments: Comment[];
	setComments: (comments: Comment[]) => void;
	setReplyCom: (Comment: Comment) => void
	filePath: string
};

export const CommentItem = ({
	comment,
	comments,
	plugin,
	setReplyCom,
	setComments,
	filePath
}: Props) => {
	const replyCom = comments?.find((c) => c.id == comment.replyTo);
	
	
	const displayMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		const menu = new obsidian.Menu();
		
		//Ответить
		menu.addItem((item) =>
			item
		.setTitle("Ответить на комментарий")
		.setIcon("reply")
				.onClick(() => {
					
					
					setReplyCom(comment)

				}),
		);

		// Перейти к тексту в файле
		menu.addItem((item) =>
			item
				.setTitle("Перейти к тексту в файле")
				.setIcon("document")
				.onClick(() => {
					handleJumpToFile(comment);
				}),
		);

		// ПУНКТ 3: Удалить комментарий
		menu.addItem((item) =>
			item
				.setTitle("Удалить комментарий")
				.setIcon("trash")
				.onClick(() => handleDeleteComment(comment)),
		);

		menu.showAtMouseEvent(e.nativeEvent);
	};

	const handleJumpToFile = (comment: Comment) => {
		let markdownView: obsidian.MarkdownView | null = null;


		
    plugin.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof obsidian.MarkdownView && leaf.view.file?.path === comment .filePath) {
        markdownView = leaf.view;
      }
    });

    if (!markdownView) {
      new obsidian.Notice(`Файл ${comment.filePath} должен быть открыт на экране.`);
      return;
    }

    const editor = (markdownView as obsidian.MarkdownView).editor;
  
    if (!markdownView) return;
    const fullText = editor.getValue();
   console.log(comment.tagId)
    const tag = `[#comment:${comment.tagId}]`;

    const tagPos = fullText.indexOf(tag);
    if (tagPos === -1) {
      new obsidian.Notice("Тег комментария не найден в тексте файла.");
      return;
    }
    const searchStartPos = Math.max(0, tagPos - comment.selectedText.length);

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

    const range: obsidian.EditorRange = { from: startPosition, to: endPosition };
    editor.scrollIntoView(range, true);

    plugin.app.workspace.setActiveLeaf((markdownView as obsidian.MarkdownView).leaf, { focus: true });
    editor.setSelection(startPosition, endPosition);
    editor.focus();

    const selectionElements = (markdownView as obsidian.MarkdownView).contentEl.querySelectorAll('.cm-selectionBackground');

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


	const searchReply = (comment: Comment) => {
		if (!replyCom && comment.replyTo) 
			{
			new obsidian.Notice("Комментарий не найден");
			return;
		}
		if(!replyCom) return;
		const container = document.querySelector('.comments');
		const comEl = container?.querySelector(`[id="${replyCom.id}"]`);
		console.log(comEl)
		if (!comEl) return;
		comEl?.scrollIntoView({ behavior: "smooth", block: "center" });
		comEl?.classList.add("is-highlighted");
		setTimeout(() => {
			comEl?.classList.remove("is-highlighted");
		}, 4500);
	};

	const handleDeleteComment = async (comment: Comment) => {
		const branch = plugin.commentsByText.get(comment.tagId) || [];
		const updateBranch = branch?.filter((c) => c.id !== comment.id);
		plugin.commentsByText.set(comment.tagId, updateBranch);
		const allComments = comments.filter(c => c.id !== comment.id);

		await plugin.saveComments();
		console.log(updateBranch)
		if (updateBranch.length === 0 || !comment.replyTo) {
			plugin.commentsByText.delete(comment.tagId);
			plugin.removeTag(comment);
		}
		if (allComments.length === 0 && plugin.app.workspace.rightSplit) {
			plugin.app.workspace.rightSplit.collapse();
		}
		setComments(allComments);
		
	};

	const replyes = comments.filter(c => c.replyTo === comment.id )

	return (
		<div className="comment__thread">
			<div className="comment__item" id={comment.id}>
				<div className="comment__item-header">
					<div className="comment__info">
						<small>Автор: {comment.author}</small>
						<small>Дата: {formatCommentDate(comment.id)}</small>
						<blockquote className="comment__item-blockquote comment__blockquote" onClick={() => searchReply(comment)}>
							{replyCom
								? "< " + replyCom.comment
								: comment.selectedText
								}
						</blockquote>
					</div>
					<div className="comment__item-menu" onClick={displayMenu}>⋮</div>
				</div>
				<div className="comment__item-body">{comment.comment}</div>
			</div>
			{replyes.length > 0 && (
            <div className="comment__replies-box"> {/* <-- Линия пойдет вдоль этого блока */}
                {replyes.map((reply) => (
                    <CommentItem
						filePath={filePath}
						setComments={setComments}
						setReplyCom={setReplyCom}
                        comment={reply}
                        comments={comments}
                        plugin={plugin}
                    />
                ))}
            </div>
        )}
		
		</div>
	);
};
