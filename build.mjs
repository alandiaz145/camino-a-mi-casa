import {mkdirSync,copyFileSync} from 'node:fs';
// Lista explícita: nunca servir código backend, .git, bases o secretos como assets.
for(const file of ['index.html','quien-soy.html','servicios.html','public.js','finance.js','content.js','admin/index.html','admin/app.js','admin/style.css']){
  const target=new URL('./dist/'+file,import.meta.url);mkdirSync(new URL('.',target),{recursive:true});copyFileSync(new URL('./'+file,import.meta.url),target);
}
