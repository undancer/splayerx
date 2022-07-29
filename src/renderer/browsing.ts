import Vue from 'vue';
// @ts-ignore
import BrowsingPip from '@renderer/components/BrowsingPip.vue';
import '@renderer/css/style.scss';

new Vue({
  components: { BrowsingPip },
  data: {},
  template: '<BrowsingPip/>',
}).$mount('#app');
