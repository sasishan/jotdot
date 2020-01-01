<template>
  <div>
    <div v-html="template"></div>
  </div>
</template>

<script>
export default {
  data: () => ({
  }),
  props:
  {
  	template:"<a href='#'>AAA</a>"
  }
};
</script>