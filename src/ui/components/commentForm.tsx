import { useState } from "react";
import { Comment } from "../../types";
import CommentsPlugin from "../../main";
import { getCommentAuthor } from "../../utils";
import { Notice } from "obsidian";

// если comment есть — это режим ответа (reply),
// иначе это создание нового комментария
type Props = {
	comment?: Comment
	plugin: CommentsPlugin
	selectedText?: string
	filePath?: string
	setShowBackButton?: (visible: boolean) => void
	setReplyCom?: (comment: Comment | null) => void;
	
};

/**
 * Форма добавления нового комментария или ответа на существующий
 * используется как в режиме создания, так и в режиме reply
 */
export const CommentForm = ({
	comment,
	plugin,
	selectedText,
	filePath,setReplyCom,
	setShowBackButton
}: Props) => {
	const [text, setText] = useState("");

	/**
	 * Создаёт новый комментарий и отправляет его в плагин
	 */
	const handleAdd = async (e: React.MouseEvent) => {
		e.preventDefault();

		if (text.trim().length === 0) return;

		if(comment && plugin.commentsByText.get(comment.tagId)?.filter(c => c.id === comment.id).length === 0){
			new Notice('Комментарий на который вы хотите ответить не найден')
			setReplyCom?.(null);
			return;
		}

		console.log(comment && plugin.commentsByText.get(comment.tagId)?.filter(c => c.id === comment.id))

		// Формируем объект комментария:
		// - либо новый комментарий
		// - либо ответ на существующий (replyTo)
		const newCom: Comment = {
			id: `${Date.now()}`,
			tagId: comment ? comment.tagId : plugin.tagId || `${Date.now()}`,
			selectedText: comment ? comment.selectedText : selectedText || "",
			comment: text,
			filePath: comment ? comment.filePath : filePath || "",
			to: null,
			from: null,
			author: getCommentAuthor(),
			replyTo: comment ? comment.id : null,
		};

		await plugin.createComment(newCom);
		
		
	};

	return (
		<div className="comments__form">
			{!comment && <h1>Добавление комментария</h1>}
			<blockquote className="comment__blockquote">
				{(comment && "<" + comment.comment) || selectedText}
			</blockquote>
			<textarea
				placeholder="Введите комментарий..."
				value={text}
				onChange={(e) => setText(e.target.value)}
			></textarea>
			<button onClick={handleAdd}>Отправить</button>
		</div>
	);
};
