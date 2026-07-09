'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, FileText, CheckCircle2, XCircle, Loader2, Boxes } from 'lucide-react';
import { toast } from 'sonner';
import {
  parseOrdersCsv,
  createOrdersBulk,
  CSV_TEMPLATE,
  type ParsedRow,
  type BulkSummary,
} from '@/lib/merchant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyPanel, FuturisticHero } from '@/components/dashboard/futuristic-primitives';

export function BulkUpload() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [summary, setSummary] = useState<BulkSummary | null>(null);

  const validRows = useMemo(() => rows.filter((r) => r.input), [rows]);
  const invalidCount = rows.length - validRows.length;

  const loadText = (text: string, name: string) => {
    setSummary(null);
    setFileName(name);
    try {
      setRows(parseOrdersCsv(text));
    } catch {
      toast.error('Could not parse that CSV file');
      setRows([]);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadText(String(reader.result ?? ''), file.name);
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guzo-bulk-shipments-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = useMutation({
    mutationFn: () => createOrdersBulk(validRows.map((r) => r.input!)),
    onSuccess: (res) => {
      setSummary(res);
      toast.success(`${res.created} shipment${res.created === 1 ? '' : 's'} created`);
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['overview', 'merchant'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = () => {
    setRows([]);
    setSummary(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <FuturisticHero
            eyebrow="Merchant scale ops"
            icon={Boxes}
            title="Bulk Upload"
            description="Import a CSV to create many shipments at once with validation preview before submission."
            stats={[
              { label: 'Format', value: 'CSV import' },
              { label: 'Preview', value: 'Row validation' },
              { label: 'Speed', value: 'Batch create' },
            ]}
          />
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> Download template
        </Button>
      </div>

      {!rows.length && !summary && (
        <Card>
          <CardContent className="p-0">
            <EmptyPanel
              icon={Boxes}
              title="Upload your shipments CSV"
              description="Columns: deliveryType, pickup*, dropoff*, weightKg, description"
              action={
                <>
                  <Button onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4" /> Choose CSV file
                  </Button>
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
                </>
              }
            />
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && !summary && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" /> {fileName}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="success">{validRows.length} valid</Badge>
                {invalidCount > 0 && <Badge variant="destructive">{invalidCount} invalid</Badge>}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-black/40 text-xs uppercase text-slate-400 backdrop-blur">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Pickup</th>
                      <th className="px-4 py-2 text-left">Dropoff</th>
                      <th className="px-4 py-2 text-left">Kg</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="dashboard-divide">
                    {rows.map((r, i) => (
                      <tr key={i} className={r.input ? '' : 'bg-destructive/5'}>
                        <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-4 py-2 text-slate-300">{r.raw.deliveryType || 'STANDARD'}</td>
                        <td className="px-4 py-2 text-slate-300">{r.raw.pickupCity} · {r.raw.pickupLine1}</td>
                        <td className="px-4 py-2 text-slate-300">{r.raw.dropoffCity} · {r.raw.dropoffLine1}</td>
                        <td className="px-4 py-2 text-slate-300">{r.raw.weightKg}</td>
                        <td className="px-4 py-2">
                          {r.input ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" /> Ready
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-destructive" title={r.errors.join(', ')}>
                              <XCircle className="h-4 w-4" /> {r.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
            <Button onClick={() => submit.mutate()} disabled={validRows.length === 0 || submit.isPending}>
              {submit.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Create {validRows.length} shipment{validRows.length === 1 ? '' : 's'}</>
              )}
            </Button>
          </div>
        </>
      )}

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Import complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Badge variant="success">{summary.created} created</Badge>
              {summary.failed > 0 && <Badge variant="destructive">{summary.failed} failed</Badge>}
            </div>
            <div className="max-h-72 space-y-1 overflow-auto">
              {summary.results.map((r) => (
                <div key={r.index} className="flex items-center gap-2 rounded border border-white/10 px-3 py-1.5 text-sm">
                  {r.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-slate-400">Row {r.index + 1}</span>
                  <span className="font-medium text-white">{r.success ? r.orderNumber : r.error}</span>
                </div>
              ))}
            </div>
            <Button onClick={reset}>Upload another file</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
