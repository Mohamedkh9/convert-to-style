export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

export type LineArtStyle = string;

export interface StyleOption {
  value: LineArtStyle;
  label: string;
}

export type EditType = 'background' | 'color' | 'design';

export type Resolution = 'Low' | 'Medium' | 'High';

export type ManualTool = 'draw' | 'erase' | null;
