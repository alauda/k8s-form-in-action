declare module 'monaco-editor/esm/vs/editor/contrib/documentSymbols/documentSymbols' {
  import type { CancellationToken, editor, languages } from 'monaco-editor';

  export function getDocumentSymbols(
    document: editor.ITextModel,
    flat: boolean,
    token: CancellationToken,
  ): Promise<languages.DocumentSymbol[]>;
}

declare module 'monaco-editor/esm/vs/editor/contrib/hover/getHover' {
  // tslint:disable-next-line: ordered-imports
  import type {
    CancellationToken,
    Position,
    editor,
    languages,
  } from 'monaco-editor';

  export function getHoverPromise(
    model: editor.ITextModel,
    position: Position,
    token: CancellationToken,
  ): Promise<languages.Hover[]>;
}
