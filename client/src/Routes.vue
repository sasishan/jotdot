<script>
import Home from './components/Home.vue'
import About from './components/About.vue'
import Notes from './components/Notes.vue'
import Jots from './components/Jots.vue'
import SignIn from './components/Login.vue'
// import Documents from './components/Documents.vue'

const routes = [
    { name: 'home', path: '/home', component: Home, meta: { requiresAuth: false }},
    { name: 'about', path: '/about', component: About, meta: { requiresAuth: true }},
    { name: 'jots', path: '/jots', component: Jots, meta: { requiresAuth: true }},
    { name: 'jotsById', path: '/jots/:jotId', component: Notes, meta: { requiresAuth: true }},
    { name: 'sectionsById', path: '/jots/:jotId/:sectionId', component: Notes, meta: { requiresAuth: true }},
    { name: 'notes', path: '/notes', component: Notes, meta: { requiresAuth: true }},
    { name: 'notesById', path: '/notes/:id', component: Notes, meta: { requiresAuth: true }, params: true},
    { name: 'notesbysearch', path: '/jots/:jotId/:sectionId?search=:query', component: Notes, meta: { requiresAuth: true }, params: true},
    { name: 'signin', path: '/signin', component: SignIn},
    // { path: '/documents', component: Documents, meta: { requiresAuth: true }},
];

export default routes

</script>