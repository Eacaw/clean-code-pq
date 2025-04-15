"use client";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

interface CodeInputProps {
  initialCode: string;
  onChange: (value: string) => void;
  isDisabled: boolean;
  placeholder?: string;
}

export default function CodeInput({
  initialCode,
  onChange,
  isDisabled,
  placeholder,
}: CodeInputProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium mb-2">Code:</h3>
      <AceEditor
        placeholder={placeholder}
        mode="javascript"
        value={initialCode}
        theme="monokai"
        readOnly={isDisabled}
        onChange={onChange}
        fontSize={14}
        lineHeight={19}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
        }}
        style={{
          borderRadius: "1rem",
          border: "1px solid #888",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.8)",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          width: "100%",
          overflowY: "auto",
        }}
      ></AceEditor>
    </div>
  );
}
