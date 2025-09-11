import React, { useEffect, useState } from 'react';
import ChatView from './ChatView';
import KnowledgeView from './KnowledgeView';
import SettingsView from './SettingsView';

type Tab = 'chat' | 'knowledge' | 'settings' | 'licenses' | 'about';

export default function App() {
  const [tab, setTab] = useState<Tab>('chat');
  const [status, setStatus] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    window.api.getStatus().then(setStatus);
    window.api.onModelProgress((e: any) => setProgress((p: any[]) => [...p, e]));
    window.api.onRuntimeReady(setStatus);
    window.api.onOpenAbout(() => setTab('about'));
    window.api.onOpenLicenses(() => setTab('licenses'));
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Local Assistant</h1>
        <nav>
          <button className={tab==='chat'?'active':''} onClick={()=>setTab('chat')}>Chat</button>
          <button className={tab==='knowledge'?'active':''} onClick={()=>setTab('knowledge')}>Knowledge</button>
          <button className={tab==='settings'?'active':''} onClick={()=>setTab('settings')}>Settings</button>
          <button className={tab==='licenses'?'active':''} onClick={()=>setTab('licenses')}>Licenses</button>
          <button className={tab==='about'?'active':''} onClick={()=>setTab('about')}>About</button>
        </nav>
        <div className="status">
          <div>Chat: {status?.chat?.ready ? `ready :${status.chat.port}` : 'not ready'}</div>
          <div>Embeddings: {status?.embed?.ready ? `ready :${status.embed.port}` : 'not ready'}</div>
        </div>
      </aside>
      <main>
        {tab === 'chat' && <ChatView />}
        {tab === 'knowledge' && <KnowledgeView />}
        {tab === 'settings' && <SettingsView progress={progress} />}
        {tab === 'licenses' && <Licenses />}
        {tab === 'about' && <About />}
      </main>
    </div>
  );
}

function Licenses() {
  return (
    <div className="panel">
      <h2>Licenses</h2>
      <p>Third-party licenses are included in the app bundle under <code>LICENSES/</code>.</p>
      <ul>
        <li>llama.cpp (MIT)</li>
        <li>Apache-2.0 model licenses where applicable</li>
        <li>NPM dependencies (see THIRD_PARTY_NOTICE)</li>
      </ul>
    </div>
  );
}

function About() {
  return (
    <div className="panel">
      <h2>About</h2>
      <p>Local Assistant keeps everything offline on your machine. No telemetry. No network calls.</p>
    </div>
  );
}
