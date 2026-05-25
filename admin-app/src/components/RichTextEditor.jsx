import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean'],
    ['code'], // Custom button for extra cleanup
  ],
};

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script', 'blockquote', 'code-block',
  'list', 'bullet', 'indent',
  'align', 'link', 'image', 'code'
];

const RichTextEditor = ({ value, onChange, placeholder, className = "" }) => {
  return (
    <div className={`rich-text-editor-container ${className}`}>
      <ReactQuill 
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style>{`
        .rich-text-editor-container .ql-toolbar.ql-snow {
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          border-color: #e2e8f0;
          background-color: #f8fafc;
          padding: 0.75rem;
        }
        .rich-text-editor-container .ql-container.ql-snow {
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          border-color: #e2e8f0;
          min-height: 150px;
          font-family: inherit;
        }
        .rich-text-editor-container .ql-editor {
          min-height: 150px;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .rich-text-editor-container .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .rich-text-editor-container .ql-snow.ql-toolbar button:hover,
        .rich-text-editor-container .ql-snow.ql-toolbar button.ql-active,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label:hover,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item:hover,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-active {
          color: #ef4444;
        }
        .rich-text-editor-container .ql-snow.ql-toolbar button:hover .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-active .ql-stroke {
          stroke: #ef4444;
        }
        .rich-text-editor-container .ql-snow.ql-toolbar button:hover .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item:hover .ql-fill,
        .rich-text-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-active .ql-fill {
          fill: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
