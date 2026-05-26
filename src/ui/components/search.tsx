import { useEffect, useState } from "react";
import { Comment } from "../../types";

type Props = {
    comments: Comment[]
    setComments: (comments: Comment[]) => void
}

export const Search = ({ comments, setComments}: Props) => {
    const [value, setValue] = useState('')
    const [filterComments, setFilterComments] = useState<Comment[]>(comments)
    const [isVisible, setIsVisible] = useState<boolean>(false)

    const [allComments, setAllComments] = useState<Comment[]>([]);

    
    useEffect(() => {
        if (comments.length > allComments.length || allComments.length === 0) {
            setAllComments(comments);
        }
    }, [comments]);
    
    useEffect(() => {

        if (value.trim().length === 0){
            setValue('')
            setFilterComments(allComments.filter(c => !c.replyTo))
            return;
        }

       setFilterComments(allComments.filter(c => c.selectedText.toLowerCase().includes(value.toLowerCase()) && !c.replyTo))


    }, [value, comments, allComments])


    const displaySearshItems = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsVisible(true)
    }


    const selectBlock = (e: React.MouseEvent, comment: Comment) => {
        e.preventDefault()
        e.stopPropagation()
        setValue(comment.selectedText);
        setComments(allComments.filter(c => c.tagId == comment.tagId))
        setIsVisible(false)
    }

    return <div className="search">
        <input className="search__input" type="text" value={value}
        onClick={displaySearshItems}
        onChange={(e) => setValue(e.target.value)} 
        onBlur={() => setIsVisible(false)}/>
      { isVisible && <div className="search__items">
            {filterComments.map(c => 
                <div className="search__item" onMouseDown={(e) => selectBlock(e, c)}>{c.selectedText}</div>
            )}
        </div>}
    </div>

}