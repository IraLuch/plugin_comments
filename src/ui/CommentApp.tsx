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

	const [showBackButton, setShowBackButton] = useState<boolean>(
		plugin.isBlockMode,
	);

	// сортировка по времени
	useEffect(() => {
		const sorted = [...allComments].sort(
			(a, b) => Number(b.id) - Number(a.id),
		);
		setAllCommentsState(sorted);
		setComments(sorted);
	}, [allComments]);

	const handleBack = () => {
		if (plugin.openedFromTag && plugin.tagId) {
			plugin.activateView(null, plugin.tagId);
		} else {
			plugin.activateView();
		}
		plugin.isBlockMode = false;
	};

	return (
		<div className="comments">
			<span
				className="comments__btn-all"
				style={{ opacity: showBackButton ? "1" : "0" }}
				onClick={handleBack}
			>
				Назад
			</span>
			<div>
				<h1 className="comment__header">Окно просмотра комментариев</h1>
				<Search
					showBackButton={showBackButton}
					allComments={allCommentsState}
					setComments={setComments}
				></Search>
				<div className="commets__form-reply">
					{" "}
					{replyCom && (
						<CommentForm
							setShowBackButton={setShowBackButton}
							setReplyCom={setReplyCom}
							comment={replyCom}
							plugin={plugin}
						></CommentForm>
					)}
				</div>
				<CommentsList
					setShowBackButton={setShowBackButton}
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
