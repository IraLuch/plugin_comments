import { CommentItem } from "./commentItem";
import { Comment } from '../../types';
import CommentsPlugin from "../../main";

type Props = {
    comments: Comment[], 
    plugin: CommentsPlugin,
    setComments: (comments: Comment[]) => void
    setReplyCom: (comment: Comment) => void
    filePath: string
}



export const CommentsList = ({comments, plugin, filePath, setComments, setReplyCom}: Props) => {


    return <div className="comments__list">
        
        {comments.filter(c => !c.replyTo).map(c => <CommentItem setReplyCom={setReplyCom} plugin ={plugin} setComments={setComments}
                                        comment={c} comments={comments} filePath={filePath}
                                        ></CommentItem>)}
        
    </div>
}