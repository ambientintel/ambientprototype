'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// ── Monaco CDN loader ─────────────────────────────────────────────────────────
const VS = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';

type RequireFn = ((modules: string[], cb: (...args: unknown[]) => void) => void) & {
  config(o: { paths: Record<string, string> }): void;
};
interface IEditor {
  getValue(): string;
  setValue(v: string): void;
  getModel(): object | null;
  onDidChangeModelContent(cb: () => void): { dispose(): void };
  dispose(): void;
}
declare global {
  interface Window {
    require: RequireFn;
    monaco: { editor: { create(el: HTMLElement, o: object): IEditor; setModelLanguage(m: object, l: string): void } };
    __monacoReady?: boolean;
    __monacoQueue?: (() => void)[];
  }
}

function ensureMonaco(cb: () => void) {
  if (typeof window === 'undefined') return;
  if (window.__monacoReady) { cb(); return; }
  if (window.__monacoQueue) { window.__monacoQueue.push(cb); return; }
  window.__monacoQueue = [cb];
  const s = document.createElement('script');
  s.src = `${VS}/loader.js`;
  s.onload = () => {
    window.require.config({ paths: { vs: VS } });
    window.require(['vs/editor/editor.main'], () => {
      window.__monacoReady = true;
      (window.__monacoQueue ?? []).forEach(f => f());
      window.__monacoQueue = [];
    });
  };
  document.head.appendChild(s);
}

function langFor(path: string) {
  if (path.endsWith('.py')) return 'python';
  if (path.endsWith('.tf') || path.endsWith('.hcl')) return 'hcl';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml';
  if (path.endsWith('.md')) return 'markdown';
  if (path.endsWith('.sh')) return 'shell';
  if (path.endsWith('.toml')) return 'toml';
  if (path.endsWith('.sql')) return 'sql';
  return 'plaintext';
}

// ── Monaco panel ──────────────────────────────────────────────────────────────
function Editor({ content, language, onChange }: { content: string; language: string; onChange: (v: string) => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<IEditor | null>(null);
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    ensureMonaco(() => {
      if (!divRef.current || editorRef.current) return;
      editorRef.current = window.monaco.editor.create(divRef.current, {
        value: content, language, theme: 'vs-dark',
        fontSize: 13, lineNumbers: 'on',
        minimap: { enabled: false }, scrollBeyondLastLine: false,
        wordWrap: 'on', tabSize: 4, automaticLayout: true,
      });
      editorRef.current.onDidChangeModelContent(() => {
        cbRef.current(editorRef.current?.getValue() ?? '');
      });
    });
    return () => { editorRef.current?.dispose(); editorRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ed = editorRef.current;
    if (ed && ed.getValue() !== content) ed.setValue(content);
  }, [content]);

  useEffect(() => {
    const ed = editorRef.current;
    if (ed && window.monaco) {
      const m = ed.getModel();
      if (m) window.monaco.editor.setModelLanguage(m, language);
    }
  }, [language]);

  return <div ref={divRef} style={{ width: '100%', height: '100%' }} />;
}

// ── Public interface ──────────────────────────────────────────────────────────
export interface ServiceDef {
  id: string;
  label: string;
  path: string;
  lambdaFn: string | null;
}

interface Props {
  service: ServiceDef;
  onClose: () => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading'; msg: string }
  | { kind: 'ok'; msg: string }
  | { kind: 'err'; msg: string };

export default function ServiceEditor({ service, onClose }: Props) {
  const serviceId = service.path.replace(/\/$/, '').split('/').pop() ?? service.id;

  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState('');
  const [sha, setSha] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    setStatus({ kind: 'loading', msg: 'Loading files…' });
    fetch(`/api/cloud/files?service=${serviceId}&list=true`)
      .then(r => r.json())
      .then((d: { files?: string[]; error?: string }) => {
        if (d.error) throw new Error(d.error);
        setFiles(d.files ?? []);
        setStatus({ kind: 'idle' });
      })
      .catch((e: Error) => setStatus({ kind: 'err', msg: e.message }));
  }, [serviceId]);

  const loadFile = useCallback(async (path: string) => {
    setSelected(path);
    setContent('');
    setSaved('');
    setSha('');
    setStatus({ kind: 'loading', msg: `Loading ${path}…` });
    try {
      const res = await fetch(`/api/cloud/files?service=${serviceId}&path=${encodeURIComponent(path)}`);
      const d = await res.json() as { content?: string; sha?: string; error?: string };
      if (d.error) throw new Error(d.error);
      setContent(d.content ?? '');
      setSaved(d.content ?? '');
      setSha(d.sha ?? '');
      setStatus({ kind: 'idle' });
    } catch (e) {
      setStatus({ kind: 'err', msg: String(e) });
    }
  }, [serviceId]);

  const handleCommit = async () => {
    if (!selected || !sha) return;
    setStatus({ kind: 'loading', msg: 'Committing…' });
    try {
      const res = await fetch('/api/cloud/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceId, path: selected, content, sha }),
      });
      const d = await res.json() as { sha?: string; error?: string };
      if (d.error) throw new Error(d.error);
      setSha(d.sha ?? sha);
      setSaved(content);
      setStatus({ kind: 'ok', msg: 'Committed to ambientcloud ✓' });
    } catch (e) {
      setStatus({ kind: 'err', msg: String(e) });
    }
  };

  const handleDeploy = async () => {
    if (!service.lambdaFn) return;
    setStatus({ kind: 'loading', msg: 'Triggering deployment…' });
    try {
      const res = await fetch('/api/cloud/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceId, lambdaFn: service.lambdaFn }),
      });
      const d = await res.json() as { ok?: boolean; message?: string; error?: string };
      if (d.error) throw new Error(d.error);
      setStatus({ kind: 'ok', msg: d.message ?? 'Deployment triggered ✓' });
    } catch (e) {
      setStatus({ kind: 'err', msg: String(e) });
    }
  };

  const dirty = Boolean(saved) && content !== saved;

  const tree = files.reduce<Record<string, string[]>>((acc, f) => {
    const parts = f.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
    (acc[dir] ??= []).push(f);
    return acc;
  }, {});
  const dirs = Object.keys(tree).sort();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'stretch' }}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.55)', cursor: 'pointer' }} onClick={onClose} />
      <div style={{ width: '82vw', maxWidth: 1400, background: 'var(--bg)', borderLeft: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-1)', flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{service.label}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>ambientintel/ambientcloud · {service.path}</span>
          {selected && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 8px' }}>
              {selected}{dirty ? ' ●' : ''}
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {status.kind === 'loading' && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>{status.msg}</span>}
            {status.kind === 'ok'      && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#3DCC91' }}>{status.msg}</span>}
            {status.kind === 'err'     && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#e05252', maxWidth: 280 }}>{status.msg}</span>}
            <button
              onClick={handleCommit}
              disabled={!dirty || status.kind === 'loading'}
              style={{
                fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 12px', borderRadius: 5,
                cursor: dirty ? 'pointer' : 'not-allowed',
                border: `1px solid ${dirty ? 'var(--accent)' : 'var(--line)'}`,
                color: dirty ? 'var(--accent)' : 'var(--text-4)',
                background: dirty ? 'rgba(45,114,210,0.1)' : 'transparent',
                opacity: status.kind === 'loading' ? 0.5 : 1,
              }}
            >Commit to Git</button>
            {service.lambdaFn && (
              <button
                onClick={handleDeploy}
                disabled={status.kind === 'loading'}
                style={{
                  fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 12px', borderRadius: 5,
                  cursor: 'pointer', border: '1px solid #3DCC91', color: '#3DCC91',
                  background: 'rgba(61,204,145,0.08)',
                  opacity: status.kind === 'loading' ? 0.5 : 1,
                }}
              >Deploy to AWS ↑</button>
            )}
            <button
              onClick={onClose}
              style={{ fontFamily: 'var(--mono)', fontSize: 13, padding: '4px 8px', borderRadius: 5, border: '1px solid var(--line)', color: 'var(--text-3)', background: 'transparent', cursor: 'pointer' }}
            >✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* File tree */}
          <div style={{ width: 210, borderRight: '1px solid var(--line)', overflowY: 'auto', background: 'var(--surface-1)', flexShrink: 0 }}>
            <div style={{ padding: '8px 0' }}>
              {dirs.map(dir => (
                <div key={dir}>
                  {dir && (
                    <div style={{ padding: '6px 12px 2px', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)' }}>
                      {dir}
                    </div>
                  )}
                  {tree[dir].map(f => {
                    const name = f.split('/').pop() ?? f;
                    const active = selected === f;
                    return (
                      <button
                        key={f}
                        onClick={() => loadFile(f)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: `3px ${dir ? '22px' : '12px'}`,
                          fontFamily: 'var(--mono)', fontSize: 11,
                          color: active ? 'var(--accent)' : 'var(--text-2)',
                          background: active ? 'rgba(45,114,210,0.12)' : 'transparent',
                          border: 'none', cursor: 'pointer',
                        }}
                      >{name}</button>
                    );
                  })}
                </div>
              ))}
              {files.length === 0 && status.kind !== 'loading' && (
                <div style={{ padding: '12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)' }}>No files found</div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {selected ? (
              <Editor content={content} language={langFor(selected)} onChange={setContent} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-4)' }}>
                ← Select a file to edit
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
