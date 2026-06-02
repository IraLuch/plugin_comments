import { useState } from "react";
import { Comment } from "../../types";

type Props = {
	setComments: (comments: Comment[]) => void;
	allComments: Comment[];
};

/**
 * Поиск комментариев по выделенному тексту блока,
 * выбор уникальных блоков комментариев
 */
export const Search = ({ setComments, allComments }: Props) => {
	const [value, setValue] = useState("");
	const [isVisible, setIsVisible] = useState(false);

	// убираем дубликаты комментариев по tagId
	const uniqueBlocks = Array.from(
		new Map(allComments.map((c) => [c.tagId, c])).values(),
	);

	/**
	 * Фильтрует комментарии по введённому тексту
	 */
	const handleChange = (value: string) => {
		setValue(value);

		if (value.trim().length === 0) {
			setComments(allComments);
			
		} else {
			const filtered = allComments.filter((c) =>
				c.selectedText.toLowerCase().includes(value.toLowerCase()),
			);
			setComments(filtered);
		}
	};

	/**
	 * Выбор блока комментариев из списка поиска
	 */
	const selectBlock = (e: React.MouseEvent, comment: Comment) => {
		e.preventDefault();
		e.stopPropagation();

		setValue(comment.selectedText);

		setComments(allComments.filter((c) => c.tagId === comment.tagId));

		setIsVisible(false);
	};

	return (
		<div className="search">
			<input
				placeholder="Введите текст для поиска блока..."
				className="search__input"
				type="text"
				value={value}
				onClick={() => setIsVisible(true)}
				onChange={(e) => handleChange(e.target.value)}
				onBlur={() => setIsVisible(false)}
			/>

			{isVisible && (
				<div className="search__items">
					{uniqueBlocks
						.filter((c) =>
							c.selectedText
								.toLowerCase()
								.includes(value.toLowerCase()),
						)
						.map((c) => (
							<div
								key={c.tagId}
								className="search__item"
								onMouseDown={(e) => selectBlock(e, c)}
							>
								{c.selectedText}
							</div>
						))}
				</div>
			)}
		</div>
	);
};
