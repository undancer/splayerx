/* eslint-disable @typescript-eslint/no-explicit-any */
import { cloneDeep } from 'lodash';
import path from 'path';
import { remote, OpenDialogReturnValue } from 'electron';
import Vue from 'vue';
import { v4 as uuidv4 } from 'uuid';
import {
  ISubtitleControlListItem, Cue, ModifiedCues, Type, IMetadata, ModifiedSubtitle, TextCue,
} from '@renderer/interfaces/ISubtitle';
import { addBubble } from '@renderer/helpers/notificationControl';
import {
  MODIFIED_SUBTITLE_TYPE,
} from '@renderer/constants';
import {
  megreSameTime, generateTrack, storeModified,
} from '@renderer/services/subtitle/utils';
import { log } from '@renderer/libs/Log';
import { ModifiedGenerator, IModifiedOrigin } from '@renderer/services/subtitle/loaders/modified';
import { addSubtitleItemsToList, updateSubtitleList } from '@renderer/services/storage/subtitle';
import { LocalGenerator } from '@renderer/services/subtitle/loaders/local';
import {
  SUBTITLE_EDITOR_REFERENCE_LOAD_FAIL,
  SUBTITLE_EDITOR_REFERENCE_LOADING,
  SUBTITLE_EDITOR_SAVED,
} from '@renderer/helpers/notificationcodes';
import {
  Editor as editorMutations,
  newSubtitle as subMutations,
} from '../mutationTypes';
import {
  Editor as editorActions,
  newSubtitle as subActions,
  SubtitleManager as smActions,
} from '../actionTypes';

type SubtitleEditorState = {
  isEditable: boolean, // 字幕编辑模式
  isDragableInProfessional: boolean, // 在字幕高级模式下，是不是拖拽激活模式
  isSpaceDownInProfessional: boolean, // 在字幕高级模式下，是不是按了空格键
  isProfessional: boolean, // 字幕高级编辑模式
  isCreateSubtitleMode: boolean, // 是否是创建字幕模式
  storedBeforeProfessionalInfo: boolean, // 字幕高级模式下需要存储windowSize、windowMinimumSize、windowPosition
  subtitleEditMenuPrevEnable: boolean, // 监听字幕高级模式下菜单上一条是否可以使用
  subtitleEditMenuNextEnable: boolean, // 监听字幕高级模式下菜单下一条是否可以使用
  subtitleEditMenuEnterEnable: boolean, // 监听字幕高级模式下菜单enter是否可以使用
  chooseIndex: number, // 编辑模式下选中的字幕
  isClickFirstSub: boolean, // 快速编辑，是不是编辑第一字幕z
  autoFocus: boolean,
  currentEditedSubtitle?: ISubtitleControlListItem, // 当前编辑的字幕
  referenceSubtitle?: ISubtitleControlListItem, // 参考字幕
  loadingReference: boolean,
  professionalDialogues: [],
  referenceDialogues: [],
  referenceOriginDialogues: [],
  professionalMeta: IMetadata,
  history: ModifiedSubtitle[],
  currentIndex: number,
  didUseReference: boolean,
};

const state = {
  isEditable: false, // 字幕编辑模式
  isDragableInProfessional: false, // 在字幕高级模式下，是不是拖拽激活模式
  isSpaceDownInProfessional: false, // 在字幕高级模式下，是不是按了空格键
  isProfessional: false, // 字幕高级编辑模式
  isCreateSubtitleMode: false, // 是否是创建字幕模式
  storedBeforeProfessionalInfo: null, // 字幕高级模式下需要存储windowSize、windowMinimumSize、windowPosition
  subtitleEditMenuPrevEnable: false, // 监听字幕高级模式下菜单上一条是否可以使用
  subtitleEditMenuNextEnable: false, // 监听字幕高级模式下菜单下一条是否可以使用
  subtitleEditMenuEnterEnable: false, // 监听字幕高级模式下菜单enter是否可以使用
  currentEditedSubtitle: undefined, // 当前编辑的字幕ID
  referenceSubtitle: undefined, // 参考字幕的ID
  loadingReference: false,
  chooseIndex: -2, // 编辑模式下选中的字幕
  isClickFirstSub: true, // 快速编辑，是不是编辑第一字幕
  autoFocus: false,
  referenceDialogues: [],
  referenceOriginDialogues: [],
  professionalDialogues: [],
  professionalMeta: {},
  history: [],
  currentIndex: -1,
  didUseReference: false,
};

const getters = {
  isEditable: (state: SubtitleEditorState) => state.isEditable,
  isDragableInProfessional: (state: SubtitleEditorState) => state.isDragableInProfessional,
  isSpaceDownInProfessional: (state: SubtitleEditorState) => state.isSpaceDownInProfessional,
  isProfessional: (state: SubtitleEditorState) => state.isProfessional,
  isCreateSubtitleMode: (state: SubtitleEditorState) => state.isCreateSubtitleMode,
  storedBeforeProfessionalInfo: (state: SubtitleEditorState) => state.storedBeforeProfessionalInfo,
  subtitleEditMenuPrevEnable: (state: SubtitleEditorState) => state.subtitleEditMenuPrevEnable,
  subtitleEditMenuNextEnable: (state: SubtitleEditorState) => state.subtitleEditMenuNextEnable,
  subtitleEditMenuEnterEnable: (state: SubtitleEditorState) => state.subtitleEditMenuEnterEnable,
  currentEditedSubtitle: (state: SubtitleEditorState) => state.currentEditedSubtitle,
  referenceSubtitle: (state: SubtitleEditorState) => state.referenceSubtitle,
  chooseIndex: (state: SubtitleEditorState) => state.chooseIndex,
  isClickFirstSub: (state: SubtitleEditorState) => state.isClickFirstSub,
  autoFocus: (state: SubtitleEditorState) => state.autoFocus,
  professionalDialogues: (state: SubtitleEditorState) => state.professionalDialogues,
  professionalMeta: (state: SubtitleEditorState) => state.professionalMeta,
  referenceDialogues: (state: SubtitleEditorState) => state.referenceDialogues,
  referenceOriginDialogues: (state: SubtitleEditorState) => state.referenceOriginDialogues,
  editorHistory: (state: SubtitleEditorState) => state.history,
  editorCurrentIndex: (state: SubtitleEditorState) => state.currentIndex,
};

const mutations = {
  [editorMutations.TOGGLE_EDITABLE](state: SubtitleEditorState, payload: boolean) {
    state.isEditable = payload;
  },
  [editorMutations.TOGGLE_DRAGABLE_IN_PROFESSIONAL](state: SubtitleEditorState, payload: boolean) {
    state.isDragableInProfessional = payload;
  },
  [editorMutations.TOGGLE_SPACE_DOWN_IN_PROFESSIONAL](
    state: SubtitleEditorState,
    payload: boolean,
  ) {
    state.isSpaceDownInProfessional = payload;
  },
  [editorMutations.STORE_BEFORE_PROFESSIONAL](state: SubtitleEditorState, payload: any) {
    state.storedBeforeProfessionalInfo = payload;
  },
  [editorMutations.TOGGLE_PROFESSIONAL](state: SubtitleEditorState, payload: boolean) {
    // state.isEditable = payload;
    // 如果payload===true,就是准备进入高级编辑模式，这个时候，需要存储当前window信息
    // 保证退出高级编辑模式，可以恢复原来的window尺寸
    state.isProfessional = payload;
    state.isCreateSubtitleMode = !payload ? false : state.isCreateSubtitleMode;
    state.history = !payload ? [] : state.history;
    state.currentIndex = !payload ? -1 : state.currentIndex;
    Vue.prototype.$bus.$emit('delete-modified-cancel', true);
    Vue.prototype.$bus.$emit('delete-modified-confirm', false);
  },
  [editorMutations.SET_CREATE_MODE](state: SubtitleEditorState, payload: boolean) {
    state.isCreateSubtitleMode = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_MENU_PREV_ENABLE](
    state: SubtitleEditorState,
    payload: boolean,
  ) {
    state.subtitleEditMenuPrevEnable = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_MENU_NEXT_ENABLE](
    state: SubtitleEditorState,
    payload: boolean,
  ) {
    state.subtitleEditMenuNextEnable = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDIT_MENU_ENTER_ENABLE](
    state: SubtitleEditorState,
    payload: boolean,
  ) {
    state.subtitleEditMenuEnterEnable = payload;
  },
  [editorMutations.SWITCH_REFERENCE_SUBTITLE](
    state: SubtitleEditorState, payload?: ISubtitleControlListItem,
  ) {
    state.referenceSubtitle = payload;
  },
  [editorMutations.UPDATE_LOADING_REFERENCE_STATUS](
    state: SubtitleEditorState, payload: boolean,
  ) {
    state.loadingReference = payload;
  },
  [editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE](
    state: SubtitleEditorState, payload?: ISubtitleControlListItem,
  ) {
    state.currentEditedSubtitle = payload;
  },
  [editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX](state: SubtitleEditorState, payload: number) {
    state.chooseIndex = payload;
  },
  [editorMutations.UPDATE_IS_CLICK_FIRST_SUBTITLE](state: SubtitleEditorState, payload: boolean) {
    state.isClickFirstSub = payload;
  },
  [editorMutations.UPDATE_AUTO_FOCUS](state: SubtitleEditorState, payload: boolean) {
    state.autoFocus = payload;
  },
  [editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES](state: SubtitleEditorState, cues: []) {
    state.professionalDialogues = cues;
  },
  [editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES](state: SubtitleEditorState, cues: []) {
    state.referenceDialogues = cues;
  },
  [editorMutations.UPDATE_CURRENT_REFERENCE_ORIGIN_DIALOGUES](
    state: SubtitleEditorState, cues: [],
  ) {
    state.referenceOriginDialogues = cues;
  },
  [editorMutations.UPDATE_CURRENT_PROFESSIONAL_META](state: SubtitleEditorState, meta: IMetadata) {
    state.professionalMeta = meta;
  },
  [editorMutations.SUBTITLE_EDITOR_HISTORY](state: SubtitleEditorState, payload: ModifiedSubtitle) {
    if (state.currentIndex + 1 < state.history.length) {
      state.history.splice(state.currentIndex + 1);
    }
    state.history.push(payload);
    state.currentIndex += 1;
  },
  [editorMutations.SUBTITLE_EDITOR_HISTORY_INDEX](state: SubtitleEditorState, index: number) {
    state.currentIndex = index;
  },
  [editorMutations.SUBTITLE_EDITOR_HISTORY_RESET](state: SubtitleEditorState) {
    state.currentIndex = -1;
    state.history = [];
  },
  [editorMutations.DID_SWITCH_REFERENCE_SUBTITLE](state: SubtitleEditorState, payload: boolean) {
    state.didUseReference = payload;
  },
};

const actions = {
  [editorActions.SWITCH_REFERENCE_SUBTITLE]({
    state, commit, dispatch,
  }: any, item?: ISubtitleControlListItem) {
    if (!state.loadingReference && item) {
      commit(editorMutations.SWITCH_REFERENCE_SUBTITLE, item);
      commit(editorMutations.UPDATE_LOADING_REFERENCE_STATUS, true);
      setTimeout(() => {
        dispatch(editorActions.LOAD_REFERENCE_SUBTITLE, item.id);
      }, 150);
      commit(editorMutations.DID_SWITCH_REFERENCE_SUBTITLE, true);
      // close loading
    } else if (!state.loadingReference) {
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_ORIGIN_DIALOGUES, []);
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, []);
      commit(editorMutations.SWITCH_REFERENCE_SUBTITLE, undefined);
    }
  },
  async [editorActions.LOAD_REFERENCE_SUBTITLE]({
    commit, dispatch,
  }: any, id: string) {
    const bubbleId = uuidv4();
    let distance = 0;
    const startTime = Date.now();
    addBubble(SUBTITLE_EDITOR_REFERENCE_LOADING, { id: bubbleId });
    // send loading
    // const dialogues = cloneDeep(state.professionalDialogues);
    let cues = {
      dialogues: [],
    };
    try {
      cues = await dispatch(`${id}/${subActions.getDialogues}`, undefined);
      distance = Date.now() - startTime;
      if (distance > 2000) {
        dispatch('removeMessages', bubbleId);
      } else {
        setTimeout(() => {
          dispatch('removeMessages', bubbleId);
        }, 2000);
      }
    } catch (error) {
      // empty
      log.error('subtitleEditor/switch', error);
      addBubble(SUBTITLE_EDITOR_REFERENCE_LOAD_FAIL);
    }
    if (distance > 2000) {
      commit(editorMutations.UPDATE_LOADING_REFERENCE_STATUS, false);
    } else {
      setTimeout(() => {
        commit(editorMutations.UPDATE_LOADING_REFERENCE_STATUS, false);
      }, 2000);
    }
    commit(editorMutations.UPDATE_CURRENT_REFERENCE_ORIGIN_DIALOGUES, cues.dialogues);
    // const referenceDialogues = deleteCrossSubs(cues.dialogues, dialogues);
    // const generateDialogues = generateTrack(referenceDialogues);
    // commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, generateDialogues);
  },
  [editorActions.TOGGLE_PROFESSIONAL]({
    state, commit, dispatch,
  }: any, payload: boolean) {
    if (!payload) {
      const count = state.currentIndex + 1;
      // ga 本次修改数量
      this.$gtag.event('editingview-updated-subtitle',
        { event_category: 'app', value: count });
      // ga 进入高级模式使用了参考字幕
      this.$gtag.event('editingview-reference-used',
        { event_category: 'app', value: state.didUseReference });
      dispatch(editorActions.SUBTITLE_EDITOR_SAVE);
      commit(editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE, undefined);
      commit(editorMutations.SWITCH_REFERENCE_SUBTITLE, undefined);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, []);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_META, {});
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_ORIGIN_DIALOGUES, []);
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, []);
      commit(editorMutations.SUBTITLE_EDITOR_HISTORY_RESET);
      commit(editorMutations.DID_SWITCH_REFERENCE_SUBTITLE, false);
    }
    commit(editorMutations.TOGGLE_PROFESSIONAL, payload);
  },
  // eslint-disable-next-line complexity
  async [editorActions.TRY_ENTER_PROFESSIONAL]({
    commit, getters, rootState, dispatch,
  }: any, item: ISubtitleControlListItem) {
    const subtitle = rootState[item.id];
    if (subtitle && subtitle.displaySource.source.isImage) {
      // can not enter editor
      Vue.prototype.$bus.$emit('subtitle-can-not-editor', 'image');
      return;
    }
    if (!(!subtitle || subtitle.displaySource.source.isImage || !subtitle.fullyRead)) {
      // let referenceHash = item.hash;
      let referenceHash = '';
      const cues: ModifiedCues = {
        dialogues: [],
        meta: {},
        info: {
          hash: '',
          path: '',
        },
      };
      if (subtitle.displaySource.type === Type.Modified) {
        referenceHash = subtitle.displaySource.source.reference;
        const delay = subtitle.delay ? subtitle.delay : 0;
        commit(editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE, item);
        try {
          const loadCues = await dispatch(`${item.id}/${subActions.getDialogues}`, undefined);
          cues.dialogues = cloneDeep(loadCues.dialogues);
          cues.meta = loadCues.metadata;
          cues.dialogues.forEach((c: Cue) => {
            c.start += delay;
            c.end += delay;
          });
          dispatch(`${item.id}/${subActions.resetDelay}`);
        } catch (error) {
          // empty
        }
      } else {
        // load origin cues
        try {
          const delay = subtitle && subtitle.delay ? subtitle.delay : 0;
          const loadCues = await dispatch(`${item.id}/${subActions.getDialogues}`, undefined);
          cues.dialogues = cloneDeep(loadCues.dialogues);
          cues.meta = loadCues.metadata;
          cues.dialogues.forEach((e: Cue) => {
            e.start += delay;
            e.end += delay;
          });
        } catch (error) {
          // empty
        }
        cues.info.format = subtitle.format;
        cues.info.language = subtitle.language;
        try {
          // save json data to local
          const { hash, path } = await storeModified(cues.dialogues, cues.meta);
          if (hash && path) {
            cues.info.hash = hash;
            cues.info.path = path;
            // dispatch add subtitle
            const subtitleItem = await dispatch(smActions.addSubtitle, {
              generator: new ModifiedGenerator(cues), mediaHash: getters.mediaHash,
            });
            if (subtitleItem && subtitleItem.id) {
              // 保存本次字幕到数据库
              addSubtitleItemsToList([subtitleItem], getters.mediaHash);
              // 选中当前翻译的字幕
              dispatch(smActions.manualChangePrimarySubtitle, subtitleItem.id);
              commit(editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE, subtitleItem);
            }
          }
        } catch (error) {
          // empty
          log.error('storeModified', error);
        }
        // ga 进入高级编辑
        this.$gtag.event('subtitle-created-by-user',
          { event_category: 'app', event_label: 'professional-edit' });
      }
      // refresh cues
      const dialogues = megreSameTime(cues.dialogues);
      const generateDialogues = generateTrack(dialogues);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, generateDialogues);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_META, cues.meta);

      const referenceSub: ISubtitleControlListItem = getters.list
        .find((e: ISubtitleControlListItem) => e.hash === referenceHash);
      if (referenceSub) {
        commit(editorMutations.SWITCH_REFERENCE_SUBTITLE, referenceSub);
        try {
          const rSubtitle = rootState[referenceSub.id];
          const delay = rSubtitle && rSubtitle.delay ? rSubtitle.delay : 0;
          const rCues = await dispatch(`${referenceSub.id}/${subActions.getDialogues}`, undefined);
          const rDialogues = cloneDeep(rCues.dialogues);
          rDialogues.forEach((c: Cue) => {
            c.start += delay;
            c.end += delay;
          });
          commit(editorMutations.UPDATE_CURRENT_REFERENCE_ORIGIN_DIALOGUES, rDialogues);
          // const referenceDialogues = deleteCrossSubs(rDialogues, dialogues);
          // const generateDialogues = generateTrack(referenceDialogues);
          // commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, generateDialogues);
        } catch (error) {
          // empty
          log.error('subtitleEditor/enter', error);
        }
      }
      commit(editorMutations.TOGGLE_PROFESSIONAL, true);
      // save before enter
      commit(editorMutations.STORE_BEFORE_PROFESSIONAL, {
        size: getters.windowSize,
        minimumSize: getters.windowMinimumSize,
        position: getters.windowPosition,
      });
    } else {
      // can not enter editor
      Vue.prototype.$bus.$emit('subtitle-can-not-editor');
    }
  },
  // eslint-disable-next-line complexity
  async [editorActions.SUBTITLE_MODIFIED]({
    state, getters, dispatch, commit, rootState,
  }: any, payload: ModifiedSubtitle) {
    const subtitleId = state.currentEditedSubtitle ? state.currentEditedSubtitle.id : undefined;
    if (subtitleId) {
      if (payload.type === MODIFIED_SUBTITLE_TYPE.ADD_FROM_REFERENCE) {
        const dialogues = cloneDeep(state.professionalDialogues);
        const index = dialogues.findIndex((e: Cue) => e.start > payload.cue.start);
        const newCue = {
          start: payload.cue.start,
          end: payload.cue.end,
          text: payload.cue.text,
          tags: payload.cue.tags,
          format: payload.cue.format,
          track: payload.cue.track,
        };
        if (index > 0) {
          payload.index = index;
          commit(editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX, index);
          dialogues.splice(index, 0, newCue);
        } else {
          payload.index = dialogues.length;
          commit(editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX, dialogues.length);
          dialogues.push(newCue);
        }
        commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
        const rDialogues = cloneDeep(state.referenceDialogues);
        payload.delCue = rDialogues.splice(payload.cue.selfIndex, 1)[0];
        commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, rDialogues);
      } else if (payload.type === MODIFIED_SUBTITLE_TYPE.ADD) {
        const dialogues = cloneDeep(state.professionalDialogues);
        const index = dialogues.findIndex((e: Cue) => e.start > payload.cue.start);
        const newCue = {
          start: payload.cue.start,
          end: payload.cue.end,
          text: payload.cue.text,
          tags: payload.cue.tags,
          format: payload.cue.format,
          track: payload.cue.track,
        };
        if (index > 0) {
          dialogues.splice(index, 0, newCue);
          payload.index = index;
        } else {
          payload.index = dialogues.length;
          dialogues.push(newCue);
        }
        commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
      } else if (payload.type === MODIFIED_SUBTITLE_TYPE.DELETE_FROM_REFERENCE) {
        const dialogues = cloneDeep(state.referenceDialogues);
        payload.delCue = dialogues.splice(payload.cue.selfIndex, 1)[0];
        commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, dialogues);
      } else if (payload.type === MODIFIED_SUBTITLE_TYPE.DELETE) {
        const dialogues = cloneDeep(state.professionalDialogues);
        payload.delCue = dialogues.splice(payload.cue.selfIndex, 1)[0];
        commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
      } else if (payload.type === MODIFIED_SUBTITLE_TYPE.REPLACE) {
        const dialogues = cloneDeep(state.professionalDialogues);
        payload.delCue = cloneDeep(dialogues[payload.index]);
        dialogues[payload.index].start = payload.cue.start;
        dialogues[payload.index].end = payload.cue.end;
        dialogues[payload.index].text = payload.cue.text;
        commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
      }
      commit(editorMutations.SUBTITLE_EDITOR_HISTORY, payload);
      return;
    }
    const modified: ModifiedCues = {
      dialogues: [],
      meta: {
        PlayResX: '', PlayResY: '',
      },
      info: {
        hash: '',
        path: '',
      },
    };
    try {
      if (payload.type === MODIFIED_SUBTITLE_TYPE.ADD_FROM_REFERENCE
        || payload.type === MODIFIED_SUBTITLE_TYPE.ADD) {
        // save json data to local
        const { hash, path } = await storeModified(modified.dialogues, modified.meta);
        if (hash && path) {
          modified.info.hash = hash;
          modified.info.path = path;
          modified.info.text = payload.cue.text;
          modified.info.reference = state.referenceSubtitle;
          const rSubtitle = (state.referenceSubtitle && state.referenceSubtitle.id)
            && rootState[state.referenceSubtitle.id];
          if (rSubtitle && rSubtitle.format) {
            modified.info.format = rSubtitle.format;
          }
          // dispatch add subtitle
          const subtitle = await dispatch(smActions.addSubtitle, {
            generator: new ModifiedGenerator(modified), mediaHash: getters.mediaHash,
          });
          // 保存本次字幕到数据库
          addSubtitleItemsToList([subtitle], getters.mediaHash);
          if (subtitle && subtitle.id) {
            // 选中当前翻译的字幕
            dispatch(smActions.manualChangePrimarySubtitle, subtitle.id);
            commit(editorMutations.UPDATE_CURRENT_EDITED_SUBTITLE, subtitle);
          }
        }
        commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_META, modified.meta);
      }
    } catch (error) {
      log.error('storeModified', error);
    }
    if (payload.type === MODIFIED_SUBTITLE_TYPE.ADD_FROM_REFERENCE) {
      const dialogues = [];
      const newCue = {
        start: payload.cue.start,
        end: payload.cue.end,
        text: payload.cue.text,
        tags: payload.cue.tags,
        format: payload.cue.format,
        track: payload.cue.track,
      };
      payload.index = dialogues.length;
      commit(editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX, dialogues.length);
      dialogues.push(newCue);

      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
      const rDialogues = cloneDeep(state.referenceDialogues);
      payload.delCue = rDialogues.splice(payload.cue.selfIndex, 1)[0];
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, rDialogues);
    } else if (payload.type === MODIFIED_SUBTITLE_TYPE.ADD) {
      const dialogues = [];
      const newCue = {
        start: payload.cue.start,
        end: payload.cue.end,
        text: payload.cue.text,
        tags: payload.cue.tags,
        format: payload.cue.format,
        track: payload.cue.track,
      };
      payload.index = dialogues.length;
      commit(editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX, dialogues.length);
      dialogues.push(newCue);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
    } else if (payload.type === MODIFIED_SUBTITLE_TYPE.DELETE_FROM_REFERENCE) {
      const dialogues = cloneDeep(state.referenceDialogues);
      payload.delCue = dialogues.splice(payload.cue.selfIndex, 1)[0];
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, dialogues);
    }
    commit(editorMutations.SUBTITLE_EDITOR_HISTORY, payload);
  },
  // eslint-disable-next-line complexity
  async [editorActions.SUBTITLE_CONVERT_TO_MODIFIED]({
    rootState, getters, dispatch,
  }: any, payload: { cue: TextCue, text: string, isFirstSub: boolean }) {
    const modified: ModifiedCues = {
      dialogues: [],
      meta: {},
      info: {
        hash: '',
        path: '',
      },
    };
    let subtitleId = '';
    if (payload.isFirstSub) {
      subtitleId = getters.primarySubtitleId;
    } else {
      subtitleId = getters.secondarySubtitleId;
    }
    const sub: ISubtitleControlListItem = getters.list
      .find((e: ISubtitleControlListItem) => e.id === subtitleId);
    if (!sub && !subtitleId) return;
    if (sub.source.type !== Type.Modified) {
      const rSubtitle = rootState[subtitleId];
      if ((!rSubtitle || !rSubtitle.fullyRead)) {
        // can not quick edit
        Vue.prototype.$bus.$emit('subtitle-can-not-quick-edit');
        return;
      }
      // getAllCues
      try {
        const delay = rSubtitle && rSubtitle.delay ? rSubtitle.delay : 0;
        const loadCues = await dispatch(`${subtitleId}/${subActions.getDialogues}`, undefined);
        const tmpCues = cloneDeep(loadCues);
        if (payload.text !== '') {
          // replace cue with new text
          tmpCues.dialogues.forEach((e: TextCue) => {
            if (e.start === payload.cue.start && e.end === payload.cue.end) {
              e.text = payload.text;
            }
            e.start += delay;
            e.end += delay;
          });
        } else {
          const index = tmpCues.dialogues
            .findIndex((e: TextCue) => e.start === payload.cue.start && e.end === payload.cue.end);
          tmpCues.dialogues.splice(index, 1);
          tmpCues.dialogues.forEach((e: TextCue) => {
            e.start += delay;
            e.end += delay;
          });
        }
        modified.dialogues = tmpCues.dialogues;
        modified.meta = tmpCues.metadata;
      } catch (error) {
        // empty
      }
      try {
        // save json data to local
        const { hash, path } = await storeModified(modified.dialogues, modified.meta);
        if (hash && path) {
          modified.info.hash = hash;
          modified.info.path = path;
          // modified.info.reference = sub;
          const rSubtitle = rootState[subtitleId];
          if (rSubtitle) {
            modified.info.format = rSubtitle.format;
            modified.info.language = rSubtitle.language;
          }
          // dispatch add subtitle
          const subtitle = await dispatch(smActions.addSubtitle, {
            generator: new ModifiedGenerator(modified), mediaHash: getters.mediaHash,
          });
          // 保存本次字幕到数据库
          addSubtitleItemsToList([subtitle], getters.mediaHash);
          if (subtitle && subtitle.id && payload.isFirstSub) {
            // 选中当前翻译的字幕
            dispatch(smActions.manualChangePrimarySubtitle, subtitle.id);
          } else if (subtitle && subtitle.id) {
            dispatch(smActions.manualChangeSecondarySubtitle, subtitle.id);
          }
        }
      } catch (error) {
        // empty
        log.error('storeModified', error);
      }
      // ga 快捷方式编辑
      this.$gtag.event('subtitle-created-by-user',
        { event_category: 'app', event_label: 'quick-edit' });
    } else {
      try {
        const tmpCues = await dispatch(`${subtitleId}/${subActions.getDialogues}`, undefined);
        if (payload.text !== '') {
          // replace cue with new text
          tmpCues.dialogues.forEach((e: TextCue) => {
            if (e.start === payload.cue.start && e.end === payload.cue.end) {
              e.text = payload.text;
            }
          });
        } else {
          const index = tmpCues.dialogues
            .findIndex((e: TextCue) => e.start === payload.cue.start && e.end === payload.cue.end);
          tmpCues.dialogues.splice(index, 1);
        }
        dispatch(`${subtitleId}/${subActions.save}`, tmpCues.dialogues);
      } catch (error) {
        // empty
      }
    }
  },
  [editorActions.SUBTITLE_EDITOR_UNDO]({
    commit, state,
  }: any) {
    const pick: ModifiedSubtitle = state.history[state.currentIndex];
    if (!pick || !pick.type) return;
    if (pick.type === MODIFIED_SUBTITLE_TYPE.ADD) {
      const dialogues = cloneDeep(state.professionalDialogues);
      dialogues.splice(pick.index, 1);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
      if (state.chooseIndex === pick.index) {
        commit(editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX, -2);
      }
    } else if (pick.type === MODIFIED_SUBTITLE_TYPE.ADD_FROM_REFERENCE) {
      const dialogues = cloneDeep(state.professionalDialogues);
      dialogues.splice(pick.index, 1);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
      if (state.chooseIndex === pick.index) {
        commit(editorMutations.UPDATE_CHOOSE_SUBTITLE_INDEX, -2);
      }
      const rDialogues = cloneDeep(state.referenceDialogues);
      rDialogues.splice(pick.cue.selfIndex, 0, pick.delCue);
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, rDialogues);
    } else if (pick.type === MODIFIED_SUBTITLE_TYPE.DELETE) {
      const dialogues = cloneDeep(state.professionalDialogues);
      dialogues.splice(pick.cue.selfIndex, 0, pick.delCue);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
    } else if (pick.type === MODIFIED_SUBTITLE_TYPE.DELETE_FROM_REFERENCE) {
      const dialogues = cloneDeep(state.referenceDialogues);
      dialogues.splice(pick.cue.selfIndex, 0, pick.delCue);
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, dialogues);
    } else if (pick.type === MODIFIED_SUBTITLE_TYPE.REPLACE && pick.delCue) {
      const dialogues = cloneDeep(state.professionalDialogues);
      dialogues[pick.index].start = pick.delCue.start;
      dialogues[pick.index].end = pick.delCue.end;
      dialogues[pick.index].text = pick.delCue.text;
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
    }
    const index = state.currentIndex - 1;
    commit(editorMutations.SUBTITLE_EDITOR_HISTORY_INDEX, index);
  },
  [editorActions.SUBTITLE_EDITOR_REDO]({
    commit, state,
  }: any) {
    const index = state.currentIndex + 1;
    const pick: ModifiedSubtitle = state.history[index];
    if (!pick || !pick.type) return;
    if (pick.type === MODIFIED_SUBTITLE_TYPE.ADD) {
      const dialogues = cloneDeep(state.professionalDialogues);
      const newCue = {
        start: pick.cue.start,
        end: pick.cue.end,
        text: pick.cue.text,
        tags: pick.cue.tags,
        format: pick.cue.format,
        track: pick.cue.track,
      };
      dialogues.splice(pick.index, 0, newCue);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
    } else if (pick.type === MODIFIED_SUBTITLE_TYPE.ADD_FROM_REFERENCE) {
      const dialogues = cloneDeep(state.professionalDialogues);
      const newCue = {
        start: pick.cue.start,
        end: pick.cue.end,
        text: pick.cue.text,
        tags: pick.cue.tags,
        format: pick.cue.format,
        track: pick.cue.track,
      };
      dialogues.splice(pick.index, 0, newCue);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
      const rDialogues = cloneDeep(state.referenceDialogues);
      rDialogues.splice(pick.cue.selfIndex, 1);
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, rDialogues);
    } else if (pick.type === MODIFIED_SUBTITLE_TYPE.DELETE) {
      const dialogues = cloneDeep(state.professionalDialogues);
      dialogues.splice(pick.cue.selfIndex, 1);
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
    } else if (pick.type === MODIFIED_SUBTITLE_TYPE.DELETE_FROM_REFERENCE) {
      const dialogues = cloneDeep(state.referenceDialogues);
      dialogues.splice(pick.cue.selfIndex, 1);
      commit(editorMutations.UPDATE_CURRENT_REFERENCE_DIALOGUES, dialogues);
    } else if (pick.type === MODIFIED_SUBTITLE_TYPE.REPLACE && pick.delCue) {
      const dialogues = cloneDeep(state.professionalDialogues);
      dialogues[pick.index].start = pick.cue.start;
      dialogues[pick.index].end = pick.cue.end;
      dialogues[pick.index].text = pick.cue.text;
      commit(editorMutations.UPDATE_CURRENT_PROFESSIONAL_DIALOGUES, dialogues);
    }
    commit(editorMutations.SUBTITLE_EDITOR_HISTORY_INDEX, index);
  },
  [editorActions.SUBTITLE_EDITOR_SAVE]({
    state, getters, commit, dispatch,
  }: any) {
    const subtitleId = state.currentEditedSubtitle ? state.currentEditedSubtitle.id : undefined;
    if (subtitleId) {
      const dialogues = cloneDeep(state.professionalDialogues);
      const reference = state.referenceSubtitle ? state.referenceSubtitle.hash : '';
      dispatch(`${subtitleId}/${subActions.save}`, dialogues);
      // save reference subtitle hash
      let needUpdate = false;
      const list = getters.list.map(({ id, type }: ISubtitleControlListItem) => {
        const entity = cloneDeep(getters[`${id}/entity`]);
        if (id === subtitleId && type === Type.Modified) {
          needUpdate = (entity.displaySource as IModifiedOrigin).source.reference !== reference;
          (entity.displaySource as IModifiedOrigin).source.reference = reference;
          commit(`${subtitleId}/${subMutations.setDisplaySource}`, entity.displaySource);
        }
        return entity;
      });
      if (needUpdate) {
        updateSubtitleList(list, getters.mediaHash);
      }
      addBubble(SUBTITLE_EDITOR_SAVED);
    }
  },
  async [editorActions.SUBTITLE_EDITOR_LOAD_LOCAL_SUBTITLE]({
    getters, dispatch,
  }: any) {
    const browserWindow = remote.BrowserWindow;
    const focusWindow = browserWindow.getFocusedWindow();
    if (!state.loadingReference && focusWindow) {
      const VALID_EXTENSION = ['ass', 'srt', 'vtt'];
      remote.dialog.showOpenDialog(focusWindow, {
        title: 'Open Dialog',
        defaultPath: path.dirname(getters.originSrc),
        filters: [{
          name: 'Subtitle Files',
          extensions: VALID_EXTENSION,
        }],
        properties: ['openFile'],
      }).then(async (value: OpenDialogReturnValue) => {
        if (value.filePaths && value.filePaths.length > 0) {
          const g = new LocalGenerator(value.filePaths[0]);
          const localSub = await dispatch(smActions.addSubtitle, {
            generator: g, mediaHash: getters.mediaHash,
          });
          if (localSub) {
            addSubtitleItemsToList([localSub], getters.mediaHash);
            const reference = getters.list
              .find((e: ISubtitleControlListItem) => e.id === localSub.id);
            if (reference) {
              dispatch(editorActions.SWITCH_REFERENCE_SUBTITLE, reference);
            }
          }
        }
      }).catch((error: Error) => {
        log.error('SubtitleEditor/loadSubtitle', error);
      });
    }
  },
  async [editorActions.SUBTITLE_EDITOR_EXPORT]({
    state, dispatch,
  }: any) {
    dispatch(smActions.exportSubtitle, state.currentEditedSubtitle);
    // Menu导出字幕按钮
    this.$gtag.event('export-subtitle',
      { event_category: 'app', event_label: '' });
  },
};

export default {
  state,
  mutations,
  actions,
  getters,
};
