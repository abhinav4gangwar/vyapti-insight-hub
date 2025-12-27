import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Palette } from 'lucide-react';

interface RichTextEditorProps {
  onSubmit: (content: any) => void;
  placeholder?: string;
  isSubmitting?: boolean;
}

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

export function RichTextEditor({ onSubmit, placeholder = 'Write your research note...', isSubmitting }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder,
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2',
      },
    },
  });

  const handleSubmit = () => {
    if (!editor) return;
    const content = editor.getJSON();
    
    // Check if editor is empty
    if (!content.content || content.content.length === 0) return;
    
    const hasText = content.content.some((node: any) => {
      if (node.type === 'paragraph' && node.content) {
        return node.content.some((child: any) => child.text && child.text.trim());
      }
      if (node.type === 'bulletList' || node.type === 'orderedList') {
        return true;
      }
      return false;
    });
    
    if (!hasText) return;
    
    onSubmit(content);
    editor.commands.clearContent();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg bg-background">
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex items-center gap-1 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-muted' : ''}`}
          disabled={isSubmitting}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-muted' : ''}`}
          disabled={isSubmitting}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
          disabled={isSubmitting}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
          disabled={isSubmitting}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              disabled={isSubmitting}
              className="h-8 gap-1.5"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="grid grid-cols-3 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => editor.chain().focus().setColor(color.value).run()}
                  className="w-full h-10 rounded border-2 border-border hover:scale-105 transition-transform flex items-center justify-center"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {editor.isActive('textStyle', { color: color.value }) && (
                    <span className="text-white text-xl font-bold">✓</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => editor.chain().focus().unsetColor().run()}
                className="w-full h-10 rounded border-2 border-border hover:scale-105 transition-transform bg-white flex items-center justify-center"
                title="Remove color"
              >
                <span className="text-lg">×</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Editor Content */}
      <EditorContent editor={editor} />
      
      {/* Submit Button */}
      <div className="border-t p-3 flex justify-end">
        <Button 
          type="button"
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="financial-body"
        >
          {isSubmitting ? 'Posting...' : 'Post Note'}
        </Button>
      </div>
      
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror li {
          margin: 0.25rem 0;
        }
        .ProseMirror li p {
          margin: 0;
        }
      `}</style>
    </div>
  );
}