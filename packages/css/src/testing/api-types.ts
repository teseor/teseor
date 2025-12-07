export interface ComponentAPI {
  name: string;
  baseClass: string;
  element: string;
  description: string;
  modifiers: Record<
    string,
    {
      values?: string[];
      type?: string;
      default?: string | null;
      description: string;
    }
  >;
  states?: string[];
  combinations?: Array<{
    modifiers: string[];
    disabled?: boolean;
  }>;
}
