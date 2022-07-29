import { cloneDeep } from 'lodash';
import { LanguageCode } from '@renderer/libs/language';
import {
  IOrigin, IEntityGenerator, Type, Format, ModifiedCues,
} from '@renderer/interfaces/ISubtitle';
import { vttFragmentLanguageLoader } from '../utils/languageLoader';


export interface IModifiedOrigin extends IOrigin {
  type: Type.Modified,
  source: {
    reference: string,
    source: string,
  },
}
export class ModifiedGenerator implements IEntityGenerator {
  private origin: IModifiedOrigin;

  private language: LanguageCode;

  private format: Format;

  public constructor(modified: ModifiedCues) {
    this.origin = {
      type: Type.Modified,
      source: {
        reference: '',
        source: modified.info.hash,
      },
    };
    if (modified.info.reference) {
      this.language = modified.info.reference.language;
      this.origin.source.reference = modified.info.reference.hash;
    } else if (modified.info.language) {
      this.language = modified.info.language;
    } else if (modified.info.text) {
      this.language = vttFragmentLanguageLoader(modified.info.text)[0];
    }
    this.format = modified.info.format || Format.WebVTT;
  }

  public async getDisplaySource() { return cloneDeep(this.origin); }

  public async getRealSource() { return cloneDeep(this.origin); }

  public async getLanguage() {
    return this.language;
  }

  public async getDelay() { return 0; }

  public async getFormat() { return this.format; }

  public async getHash() { return this.origin.source.source; }
}
