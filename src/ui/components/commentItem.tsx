import CommentsPlugin from "../../main";
import { Comment } from "../../types";
import * as obsidian from "obsidian";
import { formatCommentDate } from "../../utils";

type Props = {
	plugin: CommentsPlugin;
	comment: Comment;
	comments: Comment[];
	setComments: (comments: Comment[]) => void;
	setReplyCom: (Comment: Comment) => void;
	filePath: string;
	setAllCommentsState: (comments: Comment[]) => void;
	setSelectedTagId: (tagId: string) => void;
};

export const CommentItem = ({
	comment,
	comments,
	plugin,
	setReplyCom,
	setComments,
	filePath,
	setAllCommentsState,
	setSelectedTagId,
}: Props) => {
	const replyCom = comments?.find((c) => c.id == comment.replyTo);

	/**
	 * Контекстное меню комментария:
	 * - ответить
	 * - перейти к тексту
	 * - удалить
	 */
	const displayMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		const menu = new obsidian.Menu();

		menu.addItem((item) =>
			item
				.setTitle("Ответить на комментарий")
				.setIcon("reply")
				.onClick(() => {
					document.querySelector(".comment__header")?.scrollIntoView({
						behavior: "smooth",
						block: "start",
					});

					setReplyCom(comment);
				}),
		);

		menu.addItem((item) =>
			item
				.setTitle("Перейти к тексту в файле")
				.setIcon("document")
				.onClick(() => {
					handleJumpToFile(comment);
				}),
		);

		menu.addItem((item) =>
			item
				.setTitle("Удалить комментарий")
				.setIcon("trash")
				.onClick(() => handleDeleteComment(comment)),
		);

		menu.showAtMouseEvent(e.nativeEvent);
	};

	/**
	 * Выделяет в файле текст комментария
	 */
	const handleJumpToFile = (comment: Comment) => {
		plugin.openCommentInFile(comment);
	};

	/**
	 * Подсветка родительского комментария в списке
	 */
	const searchReply = (comment: Comment) => {
		plugin.searchReply(comment, replyCom);
	};

	/**
	 * Удаляет комментарий
	 */
	const handleDeleteComment = async (comment: Comment) => {
		await plugin.deleteComment(comment);

		const updated = comments.filter((c) => c.id !== comment.id);
		if (updated.length === 0 && plugin.app.workspace.rightSplit) {
			plugin.app.workspace.rightSplit.collapse();
		}
		setComments(updated);
		setAllCommentsState(updated);
	};

	// ищем ответы на текущий комментарий
	const replyes = comments.filter((c) => c.replyTo === comment.id);

	return (
		<div className="comment__thread">
			<div className="comment__item" id={comment.id}>
				<div className="comment__item-header">
					<div className="comment__info">
						<small>Автор: {comment.author}</small>
						<small>Дата: {formatCommentDate(comment.id)}</small>
						<blockquote
							className={
								comment.replyTo
									? "comment__item-blockquote-reply comment__blockquote"
									: "comment__blockquote"
							}
							onClick={() => searchReply(comment)}
						>
							{replyCom
								? "< " + replyCom.comment
								: comment.selectedText}
						</blockquote>
					</div>
					<div className="comment__item-menu" onClick={displayMenu}>
						⋮
					</div>
				</div>
				<div className="comment__item-body">{comment.comment}</div>
			</div>
			{replyes.length > 0 && (
				<div className="comment__replies-box">
					{replyes.map((reply) => (
						<CommentItem
							setSelectedTagId={setSelectedTagId}
							setAllCommentsState={setAllCommentsState}
							key={reply.id}
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
