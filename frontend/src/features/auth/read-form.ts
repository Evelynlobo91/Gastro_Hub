/** Lê um <form> como objeto, descartando campos vazios. */
export function readForm(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    const s = String(v).trim();
    if (s) out[k] = s;
  });
  return out;
}

export function errorText(message: string | string[] | undefined, fallback: string): string {
  return ([] as string[]).concat(message ?? fallback).join(' · ');
}
