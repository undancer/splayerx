import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import { hookVue } from '@renderer/kerning';
import messages from '@renderer/locales';
import store from '@renderer/stores/vuex';
import '@renderer/css/style.scss';
// @ts-ignore
import DownloadPage from '@renderer/components/DownloadPage.vue';
import pinia from '@renderer/stores/pinia';


Vue.use(VueI18n);
Vue.use(Vuex);
Vue.use(VueRouter);

const i18n = new VueI18n({
  // @ts-ignore
  locale: window.displayLanguage, // set locale
  fallbackLocale: 'en',
  messages, // set locale messages
});

hookVue(Vue);
new Vue({
  i18n,
  store,
  pinia,
  components: { DownloadPage },
  data: {},
  mounted() {
    // @ts-ignore
    window.ipcRenderer.on('setPreference', (event: Event, data: {
      displayLanguage: string,
    }) => {
      if (data && data.displayLanguage) {
        this.$i18n.locale = data.displayLanguage;
      }
    });
  },
  template: '<DownloadPage/>',
}).$mount('#app');
