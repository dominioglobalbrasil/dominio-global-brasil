"""UI v0.12: lobby multi-sala, cerco, bloqueio e socorro em Chromium contra Node local."""
from pathlib import Path
import os, subprocess, time, base64, json, urllib.request, urllib.error
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
PORT=3493
DATA=Path('/tmp/dg-v012-browser-urban.json')
BASE=f'http://127.0.0.1:{PORT}'
OUT=Path('/mnt/data')
def backend(path,method='GET',body=None):
 req=urllib.request.Request(BASE+path,method=method,data=body.encode() if body else None,headers={'content-type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=8) as r:return {'status':r.status,'json':json.loads(r.read())}
 except urllib.error.HTTPError as e:return {'status':e.code,'json':json.loads(e.read())}
def html_bridge():
 html=(ROOT/'public/index.html').read_text();css=(ROOT/'public/styles.css').read_text()
 for name in ['soldier.webp','base-bunker.webp']:
  data=base64.b64encode((ROOT/'public/assets'/name).read_bytes()).decode();css=css.replace(f"'/assets/{name}'",f"'data:image/webp;base64,{data}'")
 html=html.replace('<link rel="stylesheet" href="/styles.css">','<style>'+css+'</style>')
 data=base64.b64encode((ROOT/'public/assets/terrain-relief.webp').read_bytes()).decode()
 html=html.replace('/assets/terrain-relief.webp','data:image/webp;base64,'+data)
 js=(ROOT/'public/app.js').read_text()
 return html.replace('<script type="module" src="/app.js"></script>', '''<script>
 const _store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>_store[k]||null,setItem:(k,v)=>_store[k]=String(v),removeItem:k=>delete _store[k]}});
 window.fetch=async(path,options={})=>{const r=await window.__backend(path,options.method||'GET',options.body||null);return new Response(JSON.stringify(r.json),{status:r.status,headers:{'Content-Type':'application/json'}})};
 window.EventSource=class{addEventListener(){}close(){}};
 </script><script>'''+js+'</script>')

def run():
 DATA.unlink(missing_ok=True)
 env=os.environ.copy();env['DG_LEGACY_GUEST']='1';env.update(DATA_FILE=str(DATA),PORT=str(PORT),TICK_MS='300000')
 proc=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 try:
  for _ in range(50):
   try:
    if backend('/api/health')['status']==200:break
   except Exception:time.sleep(.12)
  else:raise RuntimeError('Node não iniciou')
  html=html_bridge()
  with sync_playwright() as pw:
   browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
   for name,viewport in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
    ctx=browser.new_context(viewport=viewport,reduced_motion='reduce');page=ctx.new_page();page.set_default_timeout(8000)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.expose_function('__backend',backend);page.set_content(html,wait_until='domcontentloaded')
    assert page.locator('#matchPicker option').count()==(1 if name=='desktop' else 2)
    page.locator('#newMatchName').fill('Operação '+name)
    page.locator('#createMatchButton').click()
    page.wait_for_function('document.querySelectorAll("#matchPicker option").length=='+str(2 if name=='desktop' else 3))
    page.locator('#commanderName').fill('General '+name)
    page.locator('#stateSearch').fill('São Paulo')
    page.locator('.faction-choice').first.click();page.locator('#joinButton').click()
    page.locator('#joinModal').wait_for(state='hidden')
    state=page.evaluate('state')
    assert state['matchId']!= 'brasil-01'
    if name=='desktop':page.locator('#primaryNav [data-page="centers"]').click()
    else:page.locator('#moreButton').click();page.locator('#moreMenu [data-page="centers"]').click()
    page.locator('#cityStateFilter').select_option('mg')
    row=page.locator('.data-row').filter(has_text='Belo Horizonte');assert row.count()==1
    row.get_by_role('button',name='Inspecionar').click()
    assert page.locator('#dialogTitle').text_content().strip()=='Belo Horizonte'
    page.get_by_role('button',name='BLOQUEAR ROTA').click()
    assert 'Bloquear rota' in page.locator('#dialogTitle').text_content()
    assert page.locator('#blockadeRoute option').count()>=1
    page.screenshot(path=str(OUT/f'DG_v012_Bloqueio_{name}.png'),full_page=False)
    page.get_by_role('button',name='INICIAR BLOQUEIO').click()
    page.locator('#gameDialog').wait_for(state='hidden')
    tok=page.evaluate('token')
    result=backend('/api/state?matchId='+state['matchId']+'&token='+tok)['json']
    assert any(o['type']=='sector_blockade' for o in result['orders'])
    assert result['me']['nationId']=='sp'
    row=page.locator('.data-row').filter(has_text='Belo Horizonte')
    row.get_by_role('button',name='Inspecionar').click()
    page.get_by_role('button',name='INICIAR CERCO').click()
    assert 'Cercar centro' in page.locator('#dialogTitle').text_content()
    page.screenshot(path=str(OUT/f'DG_v012_Cerco_{name}.png'),full_page=False)
    page.get_by_role('button',name='CONFIRMAR ORDEM').click()
    page.locator('#gameDialog').wait_for(state='hidden')
    newer=backend('/api/state?matchId='+state['matchId']+'&token='+tok)['json']
    assert any(o['type']=='sector_siege' for o in newer['orders'])
    assert not errors,errors
    if name=='mobile':assert page.evaluate('document.body.scrollWidth<=window.innerWidth+2')
    print(name.upper(),'OK — sala independente, cidade, modal de bloqueio e ordem confirmada')
    ctx.close()
   browser.close()
 finally:
  proc.terminate();proc.wait(timeout=8)
if __name__=='__main__':run()
