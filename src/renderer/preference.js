import Vue from 'vue';
import Vuex, { mapActions, mapGetters } from 'vuex';
import VueRouter from 'vue-router';
import VueI18n from 'vue-i18n';
import electron, { ipcRenderer, remote } from 'electron';
import osLocale from 'os-locale';
import { hookVue } from '@renderer/kerning';
import messages from '@renderer/locales';
import store from '@renderer/stores/vuex';
import Preference from '@renderer/components/Preference.vue';
import {
  UserInfo as uActions,
} from '@renderer/stores/vuex/actionTypes';
import '@renderer/css/style.scss';
import {
  getUserInfo, getProductList, setToken, getGeoIP, getUserBalance,
} from '@renderer/libs/apis';
import drag from '@renderer/helpers/drag';
import pinia from '@renderer/stores/pinia';


Vue.use(VueI18n);
Vue.use(Vuex);
Vue.use(VueRouter);
Vue.directive('fade-in', {
  bind(el, binding) {
    if (!el) return;
    const { value } = binding;
    if (value) {
      el.classList.add('fade-in');
      el.classList.remove('fade-out');
    } else {
      el.classList.add('fade-out');
      el.classList.remove('fade-in');
    }
  },
  update(el, binding) {
    const { oldValue, value } = binding;
    if (oldValue !== value) {
      if (value) {
        el.classList.add('fade-in');
        el.classList.remove('fade-out');
      } else {
        el.classList.add('fade-out');
        el.classList.remove('fade-in');
      }
    }
  },
});

function getSystemLocale() {
  const { app } = electron.remote;
  const locale = process.platform === 'win32' ? app.getLocale() : osLocale.sync();
  if (locale === 'zh-TW' || locale === 'zh-HK' || locale === 'zh-Hant') {
    return 'zh-Hant';
  }
  if (locale.startsWith('zh')) {
    return 'zh-Hans';
  }
  return 'en';
}

const routeMap = {
  general: 'General',
  privacy: 'Privacy',
  translate: 'Translate',
  account: 'Account',
  premium: 'Premium',
  points: 'Points',
  video: 'Video',
};

const routes = [
  {
    path: '*',
    redirect: '/',
  },
  {
    path: '/',
    name: 'General',
    component: require('@renderer/components/Preferences/General.vue').default,
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: require('@renderer/components/Preferences/Privacy.vue').default,
  },
  {
    path: '/translate',
    name: 'Translate',
    component: require('@renderer/components/Preferences/Translate.vue').default,
  },
  {
    path: '/account',
    name: 'Account',
    component: require('@renderer/components/Preferences/Account.vue').default,
  },
  {
    path: '/premium',
    name: 'Premium',
    component: require('@renderer/components/Preferences/Premium.vue').default,
  },
  {
    path: '/points',
    name: 'Points',
    component: require('@renderer/components/Preferences/Points.vue').default,
  },
  {
    path: '/video',
    name: 'Video',
    component: require('@renderer/components/Preferences/Video.vue').default,
  },
  {
    path: '/whatsnew',
    name: 'Whatsnew',
    component: require('@renderer/components/Preferences/Whatsnew.vue').default,
  },
];

const router = new VueRouter({
  routes,
});

const i18n = new VueI18n({
  locale: getSystemLocale(), // set locale
  fallbackLocale: 'en',
  messages, // set locale messages
});

hookVue(Vue);

new Vue({
  i18n,
  router,
  components: { Preference },
  data: {
    didGetUserInfo: false,
    didGetUserBalance: false,
  },
  store,
  pinia,
  computed: {
    ...mapGetters([
      'signInCallback',
    ]),
  },
  async mounted() {
    drag(this.$el);
    this.$store.commit('getLocalPreference');
    ipcRenderer.on('clear-signIn-callback', () => {
      this.removeCallback(() => { });
    });
    // sign in success
    ipcRenderer.on('sign-in', (e, account) => {
      this.updateUserInfo(account);
      if (account) {
        setToken(account.token);
        this.updateToken(account.token);
        this.getUserInfo();
        this.getUserBalance();
        // sign in success, callback
        if (this.signInCallback) {
          this.signInCallback();
          this.removeCallback(() => { });
        }
      } else {
        setToken('');
        this.updateToken('');
        this.didGetUserInfo = false;
        this.didGetUserBalance = false;
      }
    });

    ipcRenderer.on('route-change', (e, route) => {
      route = route || 'account';
      const currentRoute = this.$router.currentRoute;
      if (currentRoute && currentRoute.name === routeMap[route]) return;
      if (routeMap[route]) {
        this.$router.push({ name: routeMap[route] });
      }
    });

    // load global data when sign in is opend
    const account = remote.getGlobal('account');
    this.updateUserInfo(account);
    if (account && account.token) {
      this.updateToken(account.token);
      setToken(account.token);
      this.getUserInfo();
      this.getUserBalance();
    }

    getGeoIP().then((res) => {
      this.$store.dispatch('updateGeo', res);
    }).catch(() => {
      // empty
    });
    // get products
    try {
      const productList = await getProductList();
      this.updatePremiumList(productList);
    } catch (error) {
      // empty
    }
  },
  methods: {
    ...mapActions({
      updateUserInfo: uActions.UPDATE_USER_INFO,
      updateToken: uActions.UPDATE_USER_TOKEN,
      updatePremiumList: uActions.UPDATE_PREMIUM,
      removeCallback: uActions.UPDATE_SIGN_IN_CALLBACK,
    }),
    async getUserInfo() {
      if (this.didGetUserInfo) return;
      this.didGetUserInfo = true;
      try {
        const res = await getUserInfo();
        this.updateUserInfo(res.me);
      } catch (error) {
        // empty
        this.didGetUserInfo = false;
      }
    },
    async getUserBalance() {
      if (this.didGetUserBalance) return;
      this.didGetUserBalance = true;
      try {
        const res = await getUserBalance();
        if (res.translation && res.translation.balance) {
          this.updateUserInfo({
            points: res.translation.balance,
          });
        }
      } catch (error) {
        // empty
        this.didGetUserBalance = false;
      }
    },
  },
  template: '<Preference/>',
}).$mount('#app');
