import { stringifySync as stringify, NodeList } from 'subtitle';
import { TextCue } from '@renderer/interfaces/ISubtitle';
import { SagiTextSubtitlePayload } from '../parsers';

export function sagiSubtitleToWebVTT(subtitlePayload: SagiTextSubtitlePayload): string {
  const vttSubtitles = subtitlePayload
    .map(cue => ({
      start: cue.startTime * 1000,
      end: cue.endTime * 1000,
      text: cue.text
        .replace(/(\\h)/g, ' ')
        .replace(/(\\N)/g, '<br/>'),
    })).map(data => ({ type: 'cue', data }));
  // use stringifyVtt to turn sagi into string
  return stringify(vttSubtitles as NodeList, { format: 'WebVTT' });
}

export function sagiSubtitleToSRT(subtitlePayload: TextCue[]): string {
  const srtSubtitles = subtitlePayload
    .map(cue => ({
      start: cue.start * 1000,
      end: cue.end * 1000,
      text: cue.text
        .replace(/(\\h)/g, ' ')
        .replace(/(\\N)/g, '<br/>'),
    })).map(data => ({ type: 'cue', data }));
  // use stringifyVtt to turn sagi into string
  return stringify(srtSubtitles as NodeList, { format: 'SRT' });
}
