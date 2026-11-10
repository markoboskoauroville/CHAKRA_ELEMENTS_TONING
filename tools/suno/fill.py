# Fills Suno's Advanced create form in Marko's Firefox for one song of songs.json (firefoxctl eval, no mouse).
# python3 fill.py <key>   → prints what the form now holds; it does NOT press Create.
import json, subprocess, sys
s = {x["key"]: x for x in json.load(open("songs.json"))}[sys.argv[1]]
js = """(function(S){
 function setv(el,v){var p=Object.getPrototypeOf(el);var d=Object.getOwnPropertyDescriptor(p,'value');d.set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
 var ed=document.querySelector('[aria-label="Lyrics editor"]');
 // Suno's lyrics box is a Lexical editor: paste and execCommand do nothing from a script, so its state is set whole,
 // one paragraph per line (an empty line = an empty paragraph)
 var E=ed.__lexicalEditor;
 var kids=S.lyrics.split('\\n').map(function(t){return {children:t?[{detail:0,format:0,mode:'normal',style:'',text:t,type:'text',version:1}]:[],direction:null,format:'',indent:0,type:'paragraph',version:1,textFormat:0,textStyle:''};});
 E.setEditorState(E.parseEditorState(JSON.stringify({root:{children:kids,direction:null,format:'',indent:0,type:'root',version:1}})));
 setv(document.querySelector('textarea[aria-label="Styles"]'),S.style);
 setv(document.querySelector('input[placeholder="Exclude styles"]'),S.exclude);
 setv(document.querySelector('input[placeholder="Song Title (Optional)"]'),S.title);
 return 'lyrics '+ed.innerText.length+' | style '+document.querySelector('textarea[aria-label="Styles"]').value.length+' | title '+document.querySelector('input[placeholder="Song Title (Optional)"]').value;
})(%s)""" % json.dumps(s)
r=subprocess.run(["firefoxctl", "-t", "suno", "eval", js], capture_output=True, text=True); print(r.stdout.strip(), r.stderr.strip())
