<template>
  <div class="col navbottom">
    <b-navbar type="dark" variant="light" :fixed="getPosition">
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item >
            <b-button variant="primary" size="sm" @mousedown="shiftLeft" >
              <font-awesome-icon size="lg" icon="arrow-left" />
            </b-button>
          </b-nav-item>
          <b-nav-item>
            <b-button variant="primary" size="sm" @mousedown="shiftRight" >
              <font-awesome-icon size="lg" icon="arrow-right" />
            </b-button>
          </b-nav-item>
          <b-nav-item > 
            <b-button variant="primary" size="sm" @mousedown="shiftUp" >
              <font-awesome-icon size="lg" icon="arrow-up" />
            </b-button>
          </b-nav-item>
          <b-nav-item >
            <b-button variant="primary" size="sm" @mousedown="shiftDown" >
              <font-awesome-icon size="lg" icon="arrow-down" />
            </b-button>
          </b-nav-item>      
          <b-nav-item >
            <b-button variant="outline-primary" size="sm" @mousedown="strikeThrough" >
              <s>S</s>
            </b-button>
          </b-nav-item>                         
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
import Common from '../Common.js';

export default 
{
  name: 'MobileMenu',
  props: {
    position:"",
  },
  components: 
  {
  },  
  computed: {
    getPosition()
    {
      return this.position;
    },
    getSticky()
    {
      return true;
    },   
  },  
  async mounted()
  {
  },
  methods: 
  {
    shiftLeft(event)
    {
      // Where you wanna call the child's method:
      // bus.$emit('shiftLeft', section.id);
      // this.$eventHub.$emit(Common.ShiftLeftEvent, section.id);
      this.$emit(Common.ShiftLeftEvent, event);
    },
    shiftRight(event)
    {
      // bus.$emit('shiftRight', section.id);
      // this.$eventHub.$emit(Common.ShiftRightEvent, section.id);
      this.$emit(Common.ShiftRightEvent, event);
    },  
    shiftUp(event)
    {
      // Where you wanna call the child's method:
      // bus.$emit('shiftLeft', section.id);
      // this.$eventHub.$emit(Common.ShiftLeftEvent, section.id);
      this.$emit(Common.ShiftUpEvent, event);
    },
    shiftDown(event)
    {
      // bus.$emit('shiftRight', section.id);
      // this.$eventHub.$emit(Common.ShiftRightEvent, section.id);
      this.$emit(Common.ShiftDownEvent, event);
    },     
    strikeThrough(event)
    {
      this.$emit(Common.StrikeThroughEvent, event);
    } ,
    focusLastSection(event)
    {
      console.log('hehere')
      this.$emit(Common.FocusLastSectionEvent);
    }
  },
  data() { 
    return {
    }
  }

}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.navbar-nav {
    float:none;
    margin:0 auto;
    display: block;
    text-align: center;
}


.navbar-nav > li {
    display: inline-block;
    float:none;
}

</style>
