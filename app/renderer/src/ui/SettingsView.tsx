import React from 'react';

export default function SettingsView({ progress }: { progress: any[] }) {
  async function openData() {
    await window.api.openDataDir();
  }
  return (
    <div className="panel">
      <h2>Settings</h2>
      <div className="grid">
        <div>
          <h3>Privacy</h3>
          <p>No telemetry. Everything stays on device. (Opt-in telemetry toggle not implemented.)</p>
        </div>
        <div>
          <h3>Data Folder</h3>
          <button onClick={openData}>Open data folder</button>
          <p>Contains: <code>models/</code>, <code>knowledge/</code>, <code>index/</code>, <code>logs/</code></p>
        </div>
        <div>
          <h3>Model Downloads</h3>
          <ul className="progress">
            {progress.map((p,i)=>(
              <li key={i}>
                <code>{p.id}</code> — {p.phase} {p.percent? ` ${(p.percent*100).toFixed(1)}%` : '' }
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
