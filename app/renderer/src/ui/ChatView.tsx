import React, { useState } from 'react';

export default function ChatView() {
  const [messages, setMessages] = useState<{role:'user'|'assistant'; content:string}[]>([]);
  const [input, setInput] = useState('');
  const [useKnowledge, setUseKnowledge] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [searchCitations, setSearchCitations] = useState<any[]>([]);

  async function onSend() {
    if (!input.trim()) return;

    let knowledgeContext = '';
    if (useKnowledge) {
      const results = await window.api.ragSearch(input, 5);
      setSearchCitations(results);
      knowledgeContext = results.map((r: any, i: number) =>
        `{Source ${i+1}: ${r.sourcePath}, score=${r.score.toFixed(3)}}
${r.chunkText.slice(0, 1200)}`
      ).join('\n----\n');
    }

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    const resp = await window.api.chat({
      messages: newMessages,
      temperature,
      useKnowledge,
      knowledgeContext
    });

    const text = resp.choices?.[0]?.message?.content || '[No content]';
    setMessages([...newMessages, { role: 'assistant', content: text }]);
  }

  return (
    <div className="panel">
      <div className="toolbar">
        <label><input type="checkbox" checked={useKnowledge} onChange={e=>setUseKnowledge(e.target.checked)} /> Use Knowledge</label>
        <label>Temperature <input type="range" min={0} max={1} step={0.05} value={temperature} onChange={e=>setTemperature(parseFloat(e.target.value))} /></label>
      </div>
      <div className="chat">
        {messages.map((m, idx) => (
          <div key={idx} className={`bubble ${m.role}`}>{m.content}</div>
        ))}
      </div>
      {useKnowledge && searchCitations.length>0 && (
        <div className="citations">
          <h4>Citations</h4>
          <ol>
            {searchCitations.map((c:any, i:number)=>(
              <li key={i}><code>{c.sourcePath}</code> — score {c.score.toFixed(3)}</li>
            ))}
          </ol>
        </div>
      )}
      <div className="inputRow">
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Type your message..." onKeyDown={(e)=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }}} />
        <button onClick={onSend}>Send</button>
      </div>
    </div>
  );
}
