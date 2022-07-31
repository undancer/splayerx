import VuexStore from '@renderer/stores/vuex';

export function dispatch(type, payload) {
  return VuexStore.dispatch(type, payload);
}
