<script setup>
  import TabContentWrapper from "./common/TabContentWrapper.vue";
  import WsIcon from "./common/WsIcon.vue";
  // No special setup needed here, unless you have props or other composition logic.
</script>

<template>
  <tab-content-wrapper>
    <div class="tab-content">
      <ws-icon iconPath="assets/icons/buildings/nac_shop.png" size="xl" />
    </div>
  </tab-content-wrapper>
</template>
