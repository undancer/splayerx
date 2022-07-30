import { LanguageCode } from '@renderer/libs/language';
import {
  Format, IRawVideoSegment, IOrigin,
} from './ISubtitle';

export interface IStoredSubtitle {
  hash: string,
  sources: IOrigin[],
  format: Format,
  language: LanguageCode,
}
export interface IStoredSubtitleItem {
  hash: string,
  source: IOrigin,
  videoSegments?: IRawVideoSegment[],
  delay: number,
}
export interface IPrimarySecondary<T> {
  primary?: T,
  secondary?: T,
}
export type SelectedSubtitle = { hash: string, source: IOrigin };
export interface ISubtitlePreference {
  mediaHash: string,
  list: IStoredSubtitleItem[],
  language: IPrimarySecondary<LanguageCode>,
  selected: IPrimarySecondary<SelectedSubtitle>,
}
