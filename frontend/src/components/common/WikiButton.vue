<script setup>
import { getWikiUrl } from "@/utils/wiki";
import WsButton from "./WsButton.vue";

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
});

const wikiUrl = getWikiUrl(props.name);
const openWiki = () => {
  window.open(wikiUrl, "_blank");
};
</script>

<template>
  <ws-button text="Wiki" @click="openWiki" />
</template>
