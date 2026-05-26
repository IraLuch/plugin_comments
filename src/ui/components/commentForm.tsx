import { useState } from "react";
import { Comment } from "../../types";
import CommentsPlugin from "../../main";
import { getCommentAuthor } from "../../utils";

type Props  ={
    comment?: Comment
    plugin: CommentsPlugin
   selectedText?: string | null
   filePath?: string | null

}

export  const CommentForm = ({comment, plugin, selectedText, filePath}: Props) => {
    const [text, setText] = useState('');

    const handleAdd =  async (e: React.MouseEvent) => {
        e.preventDefault();

        if(text.trim().length === 0 ) return;

      

         const newCom: Comment = {
        id: `${Date.now()}`,
        tagId: comment? comment.tagId : plugin.id ||`${Date.now()}` ,
        selectedText: comment? comment.selectedText : selectedText || '',
        comment: text,
        filePath: comment? comment.filePath : filePath || '',
        to: null,
        from: null,
        author: getCommentAuthor(),
        replyTo: comment? comment.id : null
      };

      console.log(newCom)
      const branch = plugin.commentsByText.get(newCom.tagId) || [];
      branch.push(newCom);
        plugin.commentsByText.set(newCom.tagId, branch);
    
        await plugin.saveComments();

        if (branch.length === 1) {
           
            plugin.insertTag(newCom.tagId);}


  
        plugin.activateViewByFilePath(newCom.filePath);


    }

    return <div className="comments__form" >
        <blockquote className="comment__blockquote">{(comment && "<" + comment.comment) || selectedText}</blockquote>
        <textarea value={text} onChange={(e) => setText(e.target.value)}></textarea>
        <button onClick={handleAdd}>Отправить</button>
    </div>
}