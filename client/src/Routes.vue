<script>
import Home from './components/Home.vue'
import About from './components/About.vue'
import Notes from './components/Notes.vue'
import Jots from './components/Jots.vue'
import SignIn from './components/Login.vue'
import Tags from './components/Notes_Tags.vue'
import Test from './components/Notes_Test.vue'
import AnonymousJots from './components/Anonymous_Jots.vue'
// import Documents from './components/Documents.vue'

const routes = [
    { name: 'anonymousJots', path: '/anonymous', component: AnonymousJots},
    { name: 'anonymousJotsById', path: '/anonymous/jots/:jotId', component: Notes, meta: { requiresAuth: false }},
    { name: 'anonymousSectionsById', path: '/anonymous/jots/:jotId/:sectionId', component: Notes, meta: { requiresAuth: false }},
    { name: 'home', path: '/home', component: Home, meta: { requiresAuth: false }},
    { name: 'about', path: '/about', component: About, meta: { requiresAuth: false }},
    { name: 'jots', path: '/jots', component: Jots, meta: { requiresAuth: true }},
    { name: 'jotsById', path: '/jots/:jotId', component: Notes, meta: { requiresAuth: true }},
    { name: 'sectionsById', path: '/jots/:jotId/:sectionId', component: Notes, meta: { requiresAuth: false }},
    { name: 'tags', path: '/tags', component: Tags, meta: { requiresAuth: true }},
    // { name: 'notes', path: '/notes', component: Notes, meta: { requiresAuth: true }},
    // { name: 'notesById', path: '/notes/:id', component: Notes, meta: { requiresAuth: true }, params: true},
    { name: 'notesbysearch', path: '/jots/:jotId/:sectionId?search=:query', component: Notes, meta: { requiresAuth: true }, params: true},
    { name: 'signin', path: '/signin', component: SignIn},
    { name: 'test', path: '/test', component: Test, meta: { requiresAuth: true }},
    
    // { name: 'anonymousJots', path: '/anonymous', component: AnonymousJots, meta: { requiresAuth: false }},
    // { path: '/documents', component: Documents, meta: { requiresAuth: true }},
];

export default routes

</script>