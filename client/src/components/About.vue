<template>
  <div>
  <h3>About</h3>
  <br>
  Jot Dot is a free note making tool based on the popular Workflowy tool. It is currently in beta.
  You can email the developer at sasi.shanmugarajah at gmail.com.
  <br>
  <small>version: beta_1.0.5</small>
  </div>
</template>

<script>
export default 
{
  name: 'About',
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
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
