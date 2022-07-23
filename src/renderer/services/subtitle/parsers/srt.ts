import { Cue, parseSync as parse, parseTimestamp } from 'subtitle';
import {
  Format, TextCue, IParser, IVideoSegments,
} from '@/interfaces/ISubtitle';
import { tagsGetter, getDialogues } from '../utils';
import { LocalTextLoader } from '../utils/loaders';

type ParsedSubtitle = {
  start: string,
  end: string,
  text: string,
}[];

export class SrtParser implements IParser {
  public get format() { return Format.SubRip; }

  public readonly loader: LocalTextLoader;

  public readonly videoSegments: IVideoSegments;

  public constructor(textLoader: LocalTextLoader, videoSegments: IVideoSegments) {
    this.loader = textLoader;
    this.videoSegments = videoSegments;
  }

  public async getMetadata() { return { PlayResX: '', PlayResY: '' }; }

  private dialogues: TextCue[] = [];

  private baseTags = { alignment: 2, pos: undefined };

  private normalizer(parsedSubtitle: ParsedSubtitle) {
    if (!parsedSubtitle.length) throw new Error('Unsupported Subtitle');
    const finalDialogues: TextCue[] = [];
    parsedSubtitle
      .filter(({ text }) => text)
      .forEach((subtitle) => {
        finalDialogues.push({
          start: parseTimestamp(subtitle.start) / 1000,
          end: parseTimestamp(subtitle.end) / 1000,
          tags: tagsGetter(subtitle.text, this.baseTags),
          text: subtitle.text.replace(/\{[^{}]*\}/g, '').replace(/[\\/][Nn]|\r?\n|\r/g, '\n'),
          format: this.format,
        });
      });
    this.dialogues = finalDialogues;
    this.dialogues.forEach(({ start, end }) => this.videoSegments.insert(start, end));
  }

  public async getDialogues(time?: number) {
    if (!this.loader.fullyRead) {
      const payload = await this.loader.getPayload() as string;
      if (this.loader.fullyRead) {
        this.normalizer(parse(payload)
          .filter(payload => payload.type === 'cue')
          .map(payload => payload.data as Cue)
          .map(({
            start, end, text,
          }) => ({
            start: `${start}`, end: `${end}`, text,
          })));
      }
    }
    return getDialogues(this.dialogues, time);
  }
}
