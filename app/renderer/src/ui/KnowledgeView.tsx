import React, { useState } from 'react';

export default function KnowledgeView() {
  const [ingesting, setIngesting] = useState(false);
  const [lastFiles, setLastFiles] = useState<string[]>([]);

  async function addFiles() {
    setIngesting(true);
    const res = await window.api.ingestDialog();
    setIngesting(false);
    if (res?.ok) setLastFiles(res.files || []);
  }

  return (
    <div className="panel">
      <h2>Knowledge</h2>
      <p>Drag & drop not shown here: click the button to add .txt, .md, or .pdf files. They will be chunked, embedded locally, and indexed.</p>
      <button disabled={ingesting} onClick={addFiles}>{ingesting ? 'Indexing…' : 'Add Documents'}</button>
      {lastFiles.length>0 && (
        <>
          <h4>Last indexed</h4>
          <ul>{lastFiles.map((f: string)=> <li key={f}><code>{f}</code></li>)}</ul>
        </>
      )}
    </div>
  );
}
