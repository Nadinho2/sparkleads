declare module 'json2csv' {
  interface Field {
    label: string;
    value: string;
  }

  interface Options {
    fields?: (string | Field)[];
    delimiter?: string;
    quote?: string;
    escapedQuote?: string;
    header?: boolean;
    eol?: string;
    withBOM?: boolean;
  }

  export function parse(data: Record<string, unknown>[], options?: Options): string;
}
