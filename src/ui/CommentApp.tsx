import { SearchComponent } from "obsidian";
import { useEffect, useRef, useState } from "react";
import { Comment } from "../types";
import { CommentsList } from "./components/commentsList";
import { Search } from "./components/search";
import CommentsPlugin from "../main";
import { CommentForm } from "./components/commentForm";

type Props ={
    allComments: Comment[],
    plugin: CommentsPlugin,
   filePath:string
    
}

export const CommentApp = ({allComments, plugin, filePath}: Props) => {



    
    const [comments, setComments] = useState<Comment[]>(allComments.sort((a, b) => Number(b.id) - Number(a.id)));
    const[replyCom, setReplyCom] = useState<Comment| null>(null)
 
    return <div className="comments">
   <div>
            <h1 className="comment__header">Окно просмотра комментариев</h1>
           <Search setComments={setComments} comments={comments}></Search>
           <div className="commets__form-reply"> {replyCom && <CommentForm comment={replyCom} plugin={plugin}></CommentForm>}</div>
           <CommentsList filePath={filePath} comments={comments} setReplyCom={setReplyCom}
            plugin={plugin} setComments={setComments}></CommentsList>
   </div >
    </div>
}

