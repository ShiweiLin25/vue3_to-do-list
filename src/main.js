import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/tailwind.css'
import { Parse } from 'parse/dist/parse.min.js';
Parse.initialize('YVSv1PeSEiQ1H0Dvfp8TCFhdXp6HvGUwD7LdO3WH', 'o6wREjJQMpDn6GHzmgStGXRhnYr8j8XEfPOTo9Mb');
Parse.serverURL = 'https://parseapi.back4app.com';

createApp(App).use(router).mount('#app')
