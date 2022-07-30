import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { hookVue } from '@renderer/kerning';
import messages from '@renderer/locales';
// @ts-ignore
import OpenUrl from '@renderer/containers/OpenUrl.vue';
import '@renderer/css/style.scss';

Vue.use(VueI18n);

const i18n = new VueI18n({
  // @ts-ignore
  locale: window.displayLanguage, // set locale
  fallbackLocale: 'en',
  messages, // set locale messages
});

hookVue(Vue);

new Vue({
  i18n,
  components: { OpenUrl },
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
  template: '<OpenUrl/>',
}).$mount('#app');
