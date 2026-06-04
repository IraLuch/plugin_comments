import CommentsPlugin from "../../main";
import { Comment } from "../../types";
import * as obsidian from "obsidian";
import { formatCommentDate } from "../../utils";
import React, { useState } from "react";

type Props = {
	plugin: CommentsPlugin;
	comment: Comment;
	comments: Comment[];
	setComments: (comments: Comment[]) => void;
	setReplyCom: (Comment: Comment) => void;
	filePath: string;
	setAllCommentsState: (comments: Comment[]) => void;
	setShowBackButton: (visible: boolean) => void;
};

export const CommentItem = ({
	comment,
	comments,
	plugin,
	setReplyCom,
	setComments,
	filePath,
	setAllCommentsState,
	setShowBackButton,
}: Props) => {
	const replyCom = comments?.find((c) => c.id == comment.replyTo);
	const [activeArrow, setActiveArrow] = useState(true);
	/**
	 * Контекстное меню комментария:
	 * - ответить
	 * - перейти к тексту
	 * - удалить
	 */
	const displayMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
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
	const searchReply = (e: React.MouseEvent, comment: Comment) => {
		e.preventDefault();
		e.stopPropagation();
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

	const handleToBlock = (comment: Comment) => {
		setShowBackButton(true);
		const comments = plugin.getCommentBlock(comment);
		setComments(comments);
	};

	const handleClose = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setActiveArrow((prev) => !prev);
	};

	return (
		<div className="comment__thread" onClick={() => handleToBlock(comment)}>
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
							onClick={(e) => searchReply(e, comment)}
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
				<div className="comment__item-body">
					<div className="comment__item-text">{comment.comment}</div>
					{replyes.length > 0 ? (
						<div
							className="comment__item-arrow"
							onClick={(e) => handleClose(e)}
						>
							{activeArrow ? "▶" : "▼"}
						</div>
					) : (
						""
					)}
				</div>
			</div>
			<div
				className={`comment__replies-wrapper ${
					activeArrow ? "open" : "closed"
				}`}
			>
				<div className="comment__replies-inner comment__replies-box ">
					{replyes.map((reply) => (
						<CommentItem
							setShowBackButton={setShowBackButton}
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
			</div>
		</div>
	);
};
