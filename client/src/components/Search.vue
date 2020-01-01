<template>
  <b-form-input
    id="search"
    v-model="search"
    :placeholder="placeHolderText()"
    type="search"
    class="mr-sm-2" >
  </b-form-input> 
</template>

<script>
import Common from '../Common.js';

export default 
{
  name: 'Search',
  props: {
  },
  computed: {
    search: {
      get () {
        return this.$store.state.searchText;
      },
      set (value) {
        this.$store.commit('setSearchText', value);
      }    
    }
  },  
  methods: 
  {
    placeHolderText()
    {
      return Common.SearchPlaceholder;
    },
    // keyMonitor(event)
    // {
    //   this.$store.commit('setSearchText', this.searchText);
    // }
  },
  data() { 
    return {
      searchText:""
    }
  }

}

</script>

