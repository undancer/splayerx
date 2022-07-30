import VuexStore from '@renderer/store';

export function dispatch(type, payload) {
  return VuexStore.dispatch(type, payload);
}
