import { CommentItem } from "./commentItem";
import { Comment } from '../../types';
import CommentsPlugin from "../../main";

type Props = {
    comments: Comment[], 
    plugin: CommentsPlugin,
    setComments: (comments: Comment[]) => void
    setReplyCom: (comment: Comment) => void
    filePath: string
    setAllCommentsState: (comments: Comment[]) => void
    setShowBackButton: (visible: boolean) => void
}


/**
 * Список комментариев файла.
 * Рендерит только корневые комментарии (без replyTo),
 */
export const CommentsList = ({comments, plugin, filePath, setComments, setReplyCom, setAllCommentsState, setShowBackButton}: Props) => {
    return <div className="comments__list">
 

        {comments.length === 0 && <p style={{textAlign:'center'}}>В данном файле пока нет комментариев</p>}
        {comments.filter(c => !c.replyTo).map(c => <CommentItem setReplyCom={setReplyCom} plugin={plugin} setComments={setComments}
                                        comment={c} comments={comments} filePath={filePath} setAllCommentsState={setAllCommentsState}  setShowBackButton={setShowBackButton}
                                        ></CommentItem>)}
        
    </div>
}