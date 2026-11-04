"""Valida a interface com Chromium local; APIs reais são encaminhadas via ponte Python.
A navegação direta localhost é bloqueada pelo ambiente, por isso a página é carregada
em about:blank e fetch usa as mesmas rotas HTTP do servidor local.
"""
import os, subprocess, tempfile, time, socket, urllib.request, urllib.error, http.cookiejar
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent

def free_port():
 with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]

def wait(port):
 for i in range(80):
  try:
   with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/health',timeout=1) as r:
    if r.status==200:return
  except Exception:time.sleep(.05)
 raise AssertionError('Servidor não iniciou')

with tempfile.TemporaryDirectory(prefix='dg13-bridge-') as dir:
 port=free_port()
 env={**os.environ,'PORT':str(port),'HOST':'127.0.0.1','DB_FILE':str(Path(dir)/'test.sqlite'),'DATA_FILE':str(Path(dir)/'legacy.json'),'TICK_MS':'300000','DG_LEGACY_GUEST':'0'}
 proc=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 try:
  wait(port)
  cj=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
  def bridge(url,options=None):
   options=options or {};url=url if url.startswith('/') else '/'
   if not url.startswith('/api/'):
    return {'status':404,'body':'{}'}
   headers=dict(options.get('headers') or {});headers['X-DG-Client']='1'
   content=options.get('body'); content=content.encode('utf-8') if isinstance(content,str) else None
   req=urllib.request.Request(f'http://127.0.0.1:{port}'+url,data=content,method=options.get('method','GET'),headers=headers)
   try:
    with opener.open(req,timeout=10) as r:return{'status':r.status,'body':r.read().decode('utf8')}
   except urllib.error.HTTPError as e:return{'status':e.code,'body':e.read().decode('utf8')}
  html=(ROOT/'public/index.html').read_text()
  html=html.replace('<link rel="stylesheet" href="/styles.css">','<style>'+ (ROOT/'public/styles.css').read_text()+'</style>')
  html=html.replace('<script type="module" src="/app.js"></script>','')
  js=(ROOT/'public/app.js').read_text()
  with sync_playwright() as p:
   from pathlib import Path as PathObj
   candidates=[os.environ.get('CHROMIUM_PATH'),p.chromium.executable_path,'/usr/bin/chromium','/usr/bin/google-chrome']
   executable=next((x for x in candidates if x and PathObj(x).exists()),None)
   browser=p.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox','--disable-gpu'])
   context=browser.new_context(viewport={'width':1400,'height':900},device_scale_factor=1,locale='pt-BR')
   page=context.new_page();page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.expose_function('bridge',bridge)
   page.add_init_script("""window.fetch=async(url,opts={})=>{const r=await window.bridge(url,opts);return new Response(r.body,{status:r.status,headers:{'content-type':'application/json'}})};
   window.EventSource=class{constructor(url){this.url=url;}addEventListener(){}close(){}};""")
   page.set_content(html,wait_until='domcontentloaded');page.evaluate("Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}})");page.evaluate("(()=>{window.fetch=async(url,opts={})=>{const r=await window.bridge(url,opts);return new Response(r.body,{status:r.status,headers:{'content-type':'application/json'}})};window.EventSource=class{constructor(url){this.url=url;}addEventListener(){}close(){}};return true})()");page.evaluate('(function(){'+js+'\n})()')
   print('auth modal checkpoint',flush=True);page.locator('#authModal').wait_for(state='visible')
   page.screenshot(path='/mnt/data/DG_v013_Login_PC.png',full_page=True)
   page.locator('[data-auth-mode="register"]').click()
   page.locator('#authUsername').fill('comandante_teste')
   page.locator('#authDisplayName').fill('Comandante Teste')
   page.locator('#authPassword').fill('senha-segura-01234')
   page.locator('#authSubmit').click()
   page.locator('#recoveryDialog').wait_for(state='visible')
   code=page.locator('#recoveryCodeValue').inner_text();assert len(code)>=24
   page.locator('#recoveryAcknowledged').click()
   page.locator('#joinModal').wait_for(state='visible')
   page.locator('#stateSearch').fill('São Paulo')
   page.locator('#factionPicker button.faction-choice:not([disabled])').first.click()
   page.locator('#joinButton').click()
   page.locator('#joinModal').wait_for(state='hidden')
   assert 'SÃO PAULO' in page.locator('#nationName').inner_text().upper(),page.locator('#nationName').inner_text()
   page.locator('[data-quick="recruit"]').first.click()
   page.locator('#gameDialog').wait_for(state='visible')
   page.screenshot(path='/mnt/data/DG_v013_Conta_Jogo_PC.png',full_page=True)
   page.get_by_role('button',name='CONFIRMAR RECRUTAMENTO').click()
   page.locator('#gameDialog').wait_for(state='hidden')
   result=page.evaluate("async()=>await (await fetch('/api/state?matchId=brasil-01')).json()")
   assert len(result['orders'])==1, result.get('orders')
   page.locator('#logoutButton').click()
   page.locator('#authModal').wait_for(state='visible')
   page.locator('[data-auth-mode="login"]').click()
   page.locator('#authUsername').fill('comandante_teste')
   page.locator('#authPassword').fill('senha-segura-01234')
   page.locator('#authSubmit').click()
   page.locator('#authModal').wait_for(state='hidden')
   assert 'SÃO PAULO' in page.locator('#nationName').inner_text().upper()
   # Trocar dimensão do navegador e validar a navegação mobile, mantendo a conta.
   page.set_viewport_size({'width':390,'height':844})
   page.screenshot(path='/mnt/data/DG_v013_Conta_Jogo_Mobile.png',full_page=True)
   page.locator('#moreButton').click()
   assert page.locator('#moreMenu').is_visible()
   assert not errors,errors
   browser.close()
  print('BROWSER BRIDGE OK: cadastro, recuperação, escolha do estado, modal militar, logout/login, menu mobile')
 finally:
  proc.terminate()
  try:proc.wait(timeout=5)
  except subprocess.TimeoutExpired:proc.kill()
