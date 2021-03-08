import { TextEncoder } from "util";
import * as vscode from "vscode";

export async function createNote() {
  const window = vscode.window;
  let currentFilePath = "";
  try {
    currentFilePath = getCurrentFilePath();
  } catch (e) {
    window.showErrorMessage(e.message);
  }

  const newNoteCaption = await askUserForCaption();
  if (newNoteCaption === undefined) {
    return;
  }

  const now = new Date();
  const filePrefix =
    now.toISOString().split("T")[0].replace(/-/g, "") +
    now.toTimeString().split(" ")[0].replace(/:/g, "");
  const newNoteFileName = `${filePrefix}-${newNoteCaption
    .split(" ")
    .join("-")
    .toLowerCase()}`;

  createNewNote(currentFilePath, newNoteFileName, newNoteCaption);
  linkNewNote(newNoteCaption, newNoteFileName);
}

function askUserForCaption(): Thenable<string | undefined> {
  return vscode.window.showInputBox({
    value: "New Note",
    placeHolder: "Please enter the caption of the new note",
    validateInput: (text) => {
      return text ? null : "No caption entered";
    },
  });
}

function getCurrentFilePath(): string {
  const document = vscode.window.activeTextEditor?.document;
  const currentFile = document?.fileName;

  if (!document || !currentFile) {
    throw new Error("You have to open a hub before you can create new note!");
  }

  const isMarkDownFile = document.languageId === "markdown";

  if (!isMarkDownFile) {
    throw new Error("The extension works only with markdown files");
  }

  return currentFile;
}

function createNewNote(
  currentFilePath: string,
  newNoteFileName: string,
  newNoteCaption: string
) {
  const lastIndexOfSlash = currentFilePath.lastIndexOf("/");
  const currentFileName = currentFilePath.substr(
    lastIndexOfSlash + 1,
    currentFilePath.length
  );
  const documentFolderPath = currentFilePath.substr(0, lastIndexOfSlash);

  const uri = vscode.Uri.file(`${documentFolderPath}/${newNoteFileName}.md`);
  const noteTemplate = `# ${newNoteCaption}
  
[&larr; back](${currentFileName})

&nbsp;

<!-- content  -->

`;

  vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(noteTemplate));

  vscode.window.showInformationMessage(`${newNoteFileName}.md created`);
}

function linkNewNote(newNoteCaption: string, newNoteFileName: string) {
  const editor = vscode.window.activeTextEditor;
  editor?.edit((selectedText) => {
    selectedText.replace(
      editor?.selection,
      `[${newNoteCaption}](${newNoteFileName}.md)`
    );
  });
}
