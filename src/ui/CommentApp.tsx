
import { useEffect, useState } from "react";
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

	const [showBackButton, setShowBackButton] = useState<boolean>(false);

	// сортировка по времени
	useEffect(() => {
		const sorted = [...allComments].sort(
			(a, b) => Number(b.id) - Number(a.id),
		);
		setAllCommentsState(sorted);
		setComments(sorted);
	}, [allComments]);

	const handleBack = () => {
		plugin.activateView();
		setShowBackButton(false)
	}

	return (
		<div className="comments">
			<div>
				<h1 className="comment__header">Окно просмотра комментариев</h1>
			{ showBackButton  && <span className="comments__btn-all" onClick={handleBack}>Ко всем комментариям</span>}
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
					setShowBackButton = {setShowBackButton}
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
