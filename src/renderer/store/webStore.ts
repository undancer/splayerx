import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const modules = {
  // TODO:
  // eslint-disable-next-line import/extensions
  UserInfo: require('@renderer/store/modules/UserInfo.ts').default,
};

// @ts-ignore
if (!Vuex.Store.prototype.hasModule) {
  // Temporary check for subtitle module. Should find a better mechanism
  // @ts-ignore
  Vuex.Store.prototype.hasModule = function hasModule(moduleName: string) {
    return !!this._modules.root._children[moduleName]; // eslint-disable-line no-underscore-dangle
  };
}

export default new Vuex.Store({
  modules,
  strict: process.env.NODE_ENV !== 'production',
});
