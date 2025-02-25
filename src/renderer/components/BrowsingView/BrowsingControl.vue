<template>
  <div
    :style="{
      width: isDarwin ? '114px' : '110px',
      borderRight: isDarwin ? isDarkMode ? '1px solid #4B4B50' : '1px solid #F2F1F4' : ''
    }"
    class="browsing-control"
  >
    <div
      @mouseup="handleSidebar"
      :class="isDarkMode ? 'button-hover-dark' : 'button-hover'"
      class="control-button sidebar-icon no-drag"
    >
      <Icon
        :type="isDarkMode ? 'sidebarDark' : 'sidebar'"
      />
    </div>
    <div
      @mouseup="handleUrlBack"
      :class="backType.toString() === 'back'
        ? isDarkMode ? 'button-hover-dark' : 'button-hover' : ''"
      class="control-button back-icon no-drag"
    >
      <Icon
        ref="back"
        :type="backType"
      />
    </div>
    <div
      @mouseup="handleUrlForward"
      :class="forwardType.toString() === 'forward'
        ? isDarkMode ? 'button-hover-dark' : 'button-hover' : ''"
      class="control-button forward-icon no-drag"
    >
      <Icon
        ref="forward"
        :type="forwardType"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Icon from '@renderer/components/BaseIconContainer.vue';

export default {
  name: 'BrowsingControl',
  components: {
    Icon,
  },
  props: {
    handleUrlBack: {
      type: Function,
      required: true,
    },
    handleUrlForward: {
      type: Function,
      required: true,
    },
    backType: {
      type: String,
      required: true,
    },
    forwardType: {
      type: String,
      required: true,
    },
    webInfo: {
      type: Object,
      required: true,
    },
    isDarkMode: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    isDarwin() {
      return process.platform === 'darwin';
    },
  },
  methods: {
    handleSidebar() {
      this.$event.emit('side-bar-mouseup');
    },
  },
};
</script>

<style scoped lang="scss">
.browsing-control {
  height: 100%;
  display: flex;
  align-items: center;
  z-index: 6;
  .control-button {
    width: 30px;
    height: 30px;
    border-radius: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 100ms linear;
  }
  .button-hover:hover {
    background-color: #ECEEF0;
  }
  .button-hover-dark:hover {
    background-color: #54545A;
  }
  .sidebar-icon {
    margin-left: 8px;
  }
  .back-icon {
    margin-left: 4px;
    margin-right: 4px;
  }
  .forward-icon {
    margin-right: 8px;
  }
}
</style>
