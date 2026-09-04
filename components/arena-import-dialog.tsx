'use client';

import { useEffect, useState } from 'react';
import { FileJson, ShieldCheck, Upload } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { type ArenaResult, parseArenaResult } from '@/lib/arena-result';

type ArenaImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (result: ArenaResult) => void;
  lang?: 'zh' | 'en';
};

export function ArenaImportDialog({
  open,
  onOpenChange,
  onImport,
  lang = 'zh',
}: ArenaImportDialogProps) {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');
  const english = lang === 'en';

  useEffect(() => {
    if (!open || raw.trim()) return;
    let active = true;
    fetch('/examples/doge-mcp-snapshot.json')
      .then((response) => {
        if (!response.ok) throw new Error('示例快照读取失败');
        return response.json();
      })
      .then((value) => {
        if (active) setRaw(JSON.stringify(value, null, 2));
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : '示例快照读取失败');
      });
    return () => {
      active = false;
    };
  }, [open, raw]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onOpenChange]);

  function importResult() {
    try {
      const parsed = parseArenaResult(raw);
      onImport(parsed);
      setError('');
      setRaw('');
      onOpenChange(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '导入失败');
    }
  }

  if (!open) return null;

  return (
    <div className="import-overlay">
      <dialog
        open
        aria-labelledby="arena-import-title"
        className="import-dialog"
      >
        <header className="import-header">
          <div className="import-kicker">
            <FileJson size={14} /> AGENT OS BRIDGE
          </div>
          <h2 id="arena-import-title">
            {english ? 'Import an Alpha Coliseum verdict' : '导入 Alpha Coliseum 裁决'}
          </h2>
          <p className="import-description">
            {english
              ? 'Paste the complete arena_result JSON from your Binance Agent OS workflow. It is validated locally and cannot place an order or modify your Binance account. A time-stamped MCP snapshot is preloaded for a quick demo.'
              : '从 Binance Agent OS 回复中复制完整的 arena_result JSON。系统会在本地校验结构，不会上传、下单或修改 Binance 账户。首次打开会预载一份带时间戳的已验证 MCP 快照。'}
          </p>
        </header>
        <label htmlFor="arena-result-json" className="import-label">
          ARENA_RESULT JSON
        </label>
        <Textarea
          id="arena-result-json"
          value={raw}
          onChange={(event) => {
            setRaw(event.target.value);
            setError('');
          }}
          placeholder={
            '{\n  "arena_result": {\n    "schema_version": "1.0",\n    ...\n  }\n}'
          }
          spellCheck={false}
          className="import-textarea"
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <p className="import-error" role="alert">
            {error}
          </p>
        ) : (
          <p className="import-safety">
            <ShieldCheck size={13} />
            {english
              ? 'Only trade_executed=false is accepted. Real-trade payloads are rejected.'
              : '仅接受 trade_executed=false，拒绝带真实交易状态的结果。'}
          </p>
        )}
        <footer className="import-footer">
          <button
            type="button"
            className="import-cancel"
            onClick={() => onOpenChange(false)}
          >
            {english ? 'Cancel' : '取消'}
          </button>
          <button
            type="button"
            onClick={importResult}
            disabled={raw.trim().length === 0}
            className="import-submit"
          >
            <Upload /> {english ? 'Validate & import' : '校验并导入'}
          </button>
        </footer>
      </dialog>
    </div>
  );
}
