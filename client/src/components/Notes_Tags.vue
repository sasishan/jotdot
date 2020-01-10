<template>
  <b-container>
    <b-row>
      <b-col cols="2">
        <b-button-group vertical>
          <template v-for="(tag, index) in tagsList">
            <b-button variant="outline-primary text" size="sm" @click="getOneTag(tag)">{{tag}}</b-button>
          </template>
        </b-button-group>    
      </b-col>
      <b-col>
        <h3>{{sectionsList.tag}}</h3>
          <Notes_Section v-for="(section, index) in sectionsList.sections" 
            :key="index" 
            :allowEdit="allowEdit"
            :section="section" 
            class="list-item"
            :offset="0"
            :depth="0"
            :searchText="searchText"
            @section-selected="sectionSelected(section)"
            />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Common from '../Common.js';
import Comms from '../components/Comms.vue';
import Notes_Section from '../components/Notes_Section.vue';

export default 
{
  name: 'Notes_Tags',
  data() { 
    return {
      tagsList:[], 
      sectionsList:[],
      allowEdit: true,
      compareAttribute:'text', 
      searchText: ''
    }
  },
  async mounted()
  {
    await this.loadTags();
  },
  components:
  {
    Notes_Section
  },  
  props: {
  },
  computed: {
  },  
  methods: 
  {
    async loadTags()
    {
      var url = Common.URLS.GetTags;
      var tags = await Comms.get(url);
      this.tagsList=[];
      if (tags)
      {
        for (var i=0; i<tags.length; i++)
        {
          this.tagsList.push(tags[i]);  
        }
        this.tagsList.sort();
        return true;
      }
      return false;      
    },
    async getOneTag(tag)
    {
      this.sectionsList={
        tag: tag, 
        sections: []
      };
      tag = tag.replace(/#/g,'%23');
      var url = Common.URLS.GetTags+tag;
      var sections = await Comms.get(url);
      

      if (sections)
      {
        for (var i=0; i<sections.length; i++)
        {
          this.sectionsList.sections.push(sections[i]);  
        }

        // this.tagsList.sort();
        this.sectionsList.sections.sort(this.compare);
        return true;
      }
      return false;      
    },
    sectionSelected(section)
    {
      Common.GoToSection(section, this.$router);
    },
    compare(a,b) 
    {
      if (a[this.compareAttribute] < b[this.compareAttribute])
      {
         return 1;
      }

      if (a[this.compareAttribute] > b[this.compareAttribute])
      {
        return -1;
      }
        
      return 0;
    }      
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
.tag
{

}
</style>
