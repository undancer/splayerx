<template>
  <div
    v-fade-in="showAllWidgets || progressTriggerStopped"
    class="cont"
  >
    <div
      @click="onTimeCodeClick"
      class="timing"
    >
      <span
        ref="timeContent"
        class="timeContent"
      />
      <transition name="fade-100">
        <span
          v-if="showFullTimeCode"
          class="timeDuration"
        >
          / {{ formatedDuration }}
        </span>
      </transition>
    </div>
    <Labels
      :rate="rate"
      :show-cycle-label="showCycleLabel"
      :show-speed-label="showSpeedLabel"
      :show-playlist-loop-label="showPlaylistLoopLabel"
      class="rate"
    />
  </div>
</template>
<script lang="ts">
import { INPUT_COMPONENT_TYPE } from '@renderer/plugins/input';
import Labels from './Labels.vue';

export default {
  name: 'TheTimeCodes',
  // @ts-ignore
  type: INPUT_COMPONENT_TYPE,
  components: {
    Labels,
  },
  props: {
    duration: {
      type: Number,
      default: 0,
    },
    rate: {
      type: Number,
      default: 1,
    },
    showFullTimeCode: Boolean,
    showCycleLabel: Boolean,
    showSpeedLabel: Boolean,
    showPlaylistLoopLabel: Boolean,
    showAllWidgets: Boolean,
    progressTriggerStopped: Boolean,
    onTimeCodeClick: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      isRemainTime: false,
      progressTriggerId: 0,
      progressDisappearDelay: 1000,
    };
  },
  computed: {
    hasDuration() {
      return !Number.isNaN(this.duration);
    },
    formatedDuration() {
      return this.timecodeFromSeconds(Math.floor(this.duration));
    },
  },
  methods: {
    updateTimeContent(time: number) {
      if (this.$refs.timeContent) {
        this.$refs.timeContent.textContent = this.timecodeFromSeconds(Math.floor(time));
      }
    },
  },
};
</script>

<style lang="scss">
@media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
  .cont {
    bottom: 18px;
    left: 20px;
  }
  .timing {
    height: 18px;
    .timeContent {
      font-size: 18px;
      line-height: 18px;
    }
    .timeDuration {
      font-size: 13px;
      line-height: 13px;
    }
  }
  .rate {
    margin-left: 7px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
  .cont {
    bottom: 24px;
    left: 28px;
  }
  .timing {
    height: 18px;
    .timeContent {
      font-size: 18px;
      line-height: 18px;
    }
    .timeDuration {
      font-size: 13px;
      line-height: 13px;
    }
  }
  .rate {
    margin-left: 9px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
  .cont {
    // bottom: 34px;
    // left: 33px;
    bottom: 17px;
    left: 0;
    padding: 12px 17px 12px 33px;
  }
  .timing {
    height: 23px;
    .timeContent {
      font-size: 23px;
      line-height: 23px;
    }
    .timeDuration {
      font-size: 17px;
      line-height: 17px;
    }
  }
  .rate {
    margin-left: 11px;
  }
}
@media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
  .cont {
    // bottom: 44px;
    // left: 51px;
    bottom: 22px;
    left: 0;
    padding: 22px 25px 22px 51px;
  }
  .timing {
    height: 35px;
    .timeContent {
      font-size: 35px;
      line-height: 35px;
    }
    .timeDuration {
      font-size: 25px;
      line-height: 25px;
    }
  }
  .rate {
    margin-left: 13px;
  }
}
.cont {
  position: absolute;
  width: auto;
  height: auto;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  z-index: 5;
}
.timing {
  position: relative;
  width: auto;
  .timeContent {
    display: inline-block;
    color: rgba(255, 255, 255, 1);
    text-shadow:  0 1px 0 rgba(0,0,0,.1),
                  1px 1px 0 rgba(0,0,0,.1);
    font-weight: 600;
    letter-spacing: 0.9px;
    user-select: none;
  }
  .timeDuration {
    display: inline-block;
    border: 0 solid rgba(0,0,0,0.10);
    color: rgba(255,255,255,0.50);
    letter-spacing: 0;
    font-weight: 600;
  }
}
.timing:hover {
  cursor: pointer;
}

.timing .timing--current {
  opacity: 1;
}
</style>
