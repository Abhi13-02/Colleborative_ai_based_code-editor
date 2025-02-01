"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import axios from "axios";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "@/constants";
import { Box, HStack } from "@chakra-ui/react";
import Output from "./Output";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function CodeEditor({ file }) {
  const [theme, setTheme] = useState("vs-dark");
  const [isLoading, setIsLoading] = useState(false);
  const [updatedCode, setUpdatedCode] = useState("");
  const [syntaxFix, setSyntaxFix] = useState("");
  const [isFixing, setIsFixing] = useState(false)
  const monaco = useMonaco();
  const timeoutRef = useRef(null);
  const [codeLanguage, setcodeLanguage] = useState('javascript')
  const editorRef = useRef();

  useEffect(() => {
    if (file) {
      fetchFileContent();
    }
  }, [file]);

  const fetchFileContent = async () => {
    if (!file?.id || !file?.workspaceId) return;

    try {
      const filePath = file.folderId
        ? `workspaces/${file.workspaceId}/folders/${file.folderId}/files`
        : `workspaces/${file.workspaceId}/files`;

      const fileRef = doc(db, filePath, file.id);
      const fileSnap = await getDoc(fileRef);

      if (fileSnap.exists()) {
        setUpdatedCode(fileSnap.data().content || "");
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  const handleEditorChange = (value) => {
    setUpdatedCode(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => autoSaveFile(value), 5000);
  };

  const autoSaveFile = async (content) => {
    if (!file?.id || !file?.workspaceId) return;

    try {
      const filePath = file.folderId
        ? `workspaces/${file.workspaceId}/folders/${file.folderId}/files`
        : `workspaces/${file.workspaceId}/files`;

      const fileRef = doc(db, filePath, file.id);
      await updateDoc(fileRef, { content });

      console.log("✅ Auto-saved file:", file.name);
    } catch (error) {
      console.error("Error auto-saving file:", error);
    }
  };
 

  const onSelect = (codeLanguage) => {
    setcodeLanguage(codeLanguage)
    setUpdatedCode(
      CODE_SNIPPETS[codeLanguage]
    )
  }

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };


  useEffect(() => {
    if (!monaco) return;

    console.log("✅ Monaco is ready! Registering auto-complete...");

    monaco.languages.registerCompletionItemProvider(codeLanguage || "javascript", {
      provideCompletionItems: async (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        console.log("🚀 Sending request to API with:", textUntilPosition);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        return new Promise((resolve) => {
          timeoutRef.current = setTimeout(async () => {
            try {
              const res = await axios.post("/api/auto-complete", { code: textUntilPosition });

              console.log("✅ API Response:", res.data);

              const suggestion = res.data.completedCode;

              if (!suggestion) return resolve({ suggestions: [] });

              resolve({
                suggestions: [
                  {
                    label: suggestion,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: suggestion,
                    documentation: "AI-generated auto-complete suggestion",
                    range: new monaco.Range(
                      position.lineNumber,
                      position.column,
                      position.lineNumber,
                      position.column
                    ),
                  },
                ],
              });
            } catch (error) {
              console.error("❌ Auto-complete error:", error);
              resolve({ suggestions: [] });
            }
          }, 300); // ✅ Debounce AI calls (wait 500ms)
        });
      },
    });

    monaco.editor.onDidCreateModel((model) => {
      console.log("📄 Editor Model Created:", model);
    });
  }, [monaco, codeLanguage]); // ✅ Runs only when `monaco` or `language` changes


  // Generate documentation and append as comments
  const generateDocs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/generate-documentation", { code: updatedCode });
      const documentation = res.data.documentation;

      // Append documentation as comments at the end of the file
      const commentedDocs = `\n\n${documentation}`;
      setUpdatedCode((prevCode) => prevCode + commentedDocs);
      onChange(updatedCode + commentedDocs); // Update parent state if necessary
    } catch (error) {
      console.error("Failed to generate documentation:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const fixSyntaxErrors = async () => {
    setIsFixing(true);
    try {
      const res = await axios.post("/api/get-errors", { code: updatedCode, codeLanguage });

      // If errors are found and AI fixes them
      if (res.data.fixedCode) {
        setSyntaxFix(res.data.fixedCode);
        setUpdatedCode(res.data.fixedCode); // Update the code with the fixed version
      } else if (res.data.errors) {
        setSyntaxFix("No syntax errors found.");
      }
    } catch (error) {
      console.error("Failed to fix syntax:", error);
      setSyntaxFix("Error fixing syntax.");
    } finally {
      setIsFixing(false);
    }
  };

  // const autoComplete = async () => {
  //   setIsAutoCompleting(true);
  //   try {
  //     const res = await axios.post("/api/auto-complete", { code: updatedCode});

  //     if (res.data.completedCode) {
  //       setUpdatedCode(res.data.completedCode); // Update the code with the fixed version
  //     } else if (res.data.errors) {
  //       setSyntaxFix("Invalid Input.");
  //     }
  //   } catch (error) {
  //     console.error("Failed to auto complete:", error);
  //   } finally {
  //     setIsAutoCompleting(false);
  //   }
  // };


  return (
    <>
      {/* Controls Section */}
      <div className="flex gap-4 mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
        >
          Toggle Theme
        </button>
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          onClick={generateDocs}
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate Docs"}
        </button>

        <button
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          onClick={fixSyntaxErrors}
          disabled={isFixing}
        >
          {isFixing ? "Fixing..." : "Fix Syntax"}
        </button>
      </div>


      {/* Code Editor */}
      <Box>
        <HStack spacing={4}>
          <Box w="50%">
            <LanguageSelector language={codeLanguage} onSelect={onSelect} />
            <Editor
              height="500px"
              theme={theme}
              language={codeLanguage}
              defaultValue={CODE_SNIPPETS[codeLanguage]}
              value={updatedCode}
              onMount={onMount}
              onChange={(value) => setUpdatedCode(value)}
              options={{
                wordWrap: "on",
                minimap: { enabled: false },
                bracketPairColorization: true,
                suggest: { preview: true },
              }}
            />
          </Box>
          <Output editorRef={editorRef} language={codeLanguage}/>
        </HStack>
      </Box>
    </>
  );
}
