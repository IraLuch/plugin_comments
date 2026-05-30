import { SearchComponent } from "obsidian";
import { useEffect, useRef, useState } from "react";
import { Comment } from "../types";
import { CommentsList } from "./components/commentsList";
import { Search } from "./components/search";
import CommentsPlugin from "../main";
import { CommentForm } from "./components/commentForm";

type Props = {
	allComments: Comment[];
	plugin: CommentsPlugin;
	filePath: string;
};

export const CommentApp = ({ allComments, plugin, filePath }: Props) => {
    
	// используется как источник данных для фильтрации
	const [allCommentsState, setAllCommentsState] =
		useState<Comment[]>(allComments);

	// отображаемый список комментариев
	const [comments, setComments] = useState<Comment[]>(allCommentsState);
	const [replyCom, setReplyCom] = useState<Comment | null>(null);

	/**
	 * + Сортировка по времени
	 */
	useEffect(() => {
		const sorted = [...allComments].sort(
			(a, b) => Number(b.id) - Number(a.id),
		);
		setAllCommentsState(sorted);
		setComments(sorted);
	}, [allComments]);

	return (
		<div className="comments">
			<div>
				<h1 className="comment__header">Окно просмотра комментариев</h1>
				<Search
					allComments={allCommentsState}
					setComments={setComments}
				></Search>
				<div className="commets__form-reply">
					{" "}
					{replyCom && (
						<CommentForm
							comment={replyCom}
							plugin={plugin}
						></CommentForm>
					)}
				</div>
				<CommentsList
					filePath={filePath}
					comments={comments}
					setReplyCom={setReplyCom}
					setAllCommentsState={setAllCommentsState}
					plugin={plugin}
					setComments={setComments}
				></CommentsList>
			</div>
		</div>
	);
};
