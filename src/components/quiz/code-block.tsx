import React from "react";

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

interface CodeBlockProps {
  codeString: string | string[] | undefined;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ codeString }) => {
  return (
    <AceEditor
      mode="javascript"
      theme="monokai"
      value={
        typeof codeString === "string"
          ? codeString
          : (codeString || []).join("\n")
      }
      readOnly={true}
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
    />
  );
};

export default CodeBlock;
