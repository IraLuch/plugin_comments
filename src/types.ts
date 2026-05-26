import { EditorPosition, NullValue } from 'obsidian';

export type Comment = {
  id: string;
  tagId: string,
  selectedText: string;
  comment: string;
  from: EditorPosition | null;
  to: EditorPosition | null;
  filePath: string;
  replyTo?: string | null,
  author: string | null
};


