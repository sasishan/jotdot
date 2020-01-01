<template>
  <div>
  <h3>Home</h3>
  </div>
</template>

<script>

export default 
{
  name: 'Home',
  props: {
    msg: String
  },
  computed: {
  },  
  methods: 
  {
  },
  data() { 
    return {
      username:"",
      password:""
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
</style>
