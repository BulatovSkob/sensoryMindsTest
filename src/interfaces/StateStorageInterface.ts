export interface StateStorageInterface {
  get(website: string): Promise<string | null>;
  set(website: string, content: string): Promise<void>;
}
