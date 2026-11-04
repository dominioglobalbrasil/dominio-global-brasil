"""Real server + Chromium smoke for drone reconnaissance, UI and privacy."""
from pathlib import Path
import subprocess, os, time, json, urllib.request, urllib.error, tempfile
from playwright.sync_api import sync_playwright
from browser_smoke import html
ROOT=Path(__file__).resolve().parent.parent
PORT=3255
BASE=f'http://127.0.0.1:{PORT}'
def backend(path,method='GET',body=None):
    req=urllib.request.Request(BASE+path,data=body.encode() if body else None,method=method,headers={'content-type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=4) as response:return {'status':response.status,'json':json.loads(response.read().decode())}
    except urllib.error.HTTPError as e:return {'status':e.code,'json':json.loads(e.read().decode())}
def main():
    with tempfile.TemporaryDirectory(prefix='dg07-recon-') as tmp:
        gamefile=Path(tmp)/'session.json'
        setup="import {createGame} from './src/engine.mjs';import {writeFileSync} from 'node:fs';const g=createGame();const p=g.provinces.find(p=>p.id==='sp');p.base=1;p.units.drones=4;p.troops=124;const enemy=g.provinces.find(p=>p.id==='mg');enemy.units.armor=9;enemy.troops=129;writeFileSync(process.argv[1],JSON.stringify(g))"
        subprocess.run(['node','--input-type=module','-e',setup,str(gamefile)],cwd=ROOT,check=True)
        env=os.environ.copy();env['DG_LEGACY_GUEST']='1';env.update(PORT=str(PORT),TICK_MS='1000',DATA_FILE=str(gamefile))
        server=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        try:
            time.sleep(.5)
            assert backend('/api/state')['status']==200
            enemy=backend('/api/join','POST',json.dumps({'name':'Comando MG','nationId':'mg'}))['json']
            with sync_playwright() as pw:
                browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
                try:
                    page=browser.new_page(viewport={'width':1280,'height':850},reduced_motion='reduce')
                    errors=[]
                    page.on('pageerror',lambda err:errors.append(str(err)))
                    page.expose_function('__backend',backend)
                    bridge='''<script>const _store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>_store[k]||null,setItem:(k,v)=>_store[k]=String(v),removeItem:k=>delete _store[k]}});window.fetch=async (path,options={})=>{const r=await window.__backend(path,options.method||'GET',options.body||null);return new Response(JSON.stringify(r.json),{status:r.status,headers:{'Content-Type':'application/json'}})};window.EventSource=class{addEventListener(){}close(){}};</script>'''
                    # The normal browser suite serves locally generated app HTML and CSS.
                    import re
                    injected=re.sub(r'<script>const \$ =',lambda m:bridge+m.group(0),html,count=1)
                    if injected==html:
                        # Fallback for inlined client scripts without the helper opener.
                        injected=html.replace('<script>const $',bridge+'<script>const $',1)
                    page.set_content(injected,wait_until='domcontentloaded')
                    page.locator('.faction-choice').first.wait_for(timeout=10000)
                    page.locator('#commanderName').fill('Comando SP')
                    page.locator('#stateSearch').fill('São Paulo')
                    page.locator('.faction-choice').first.click()
                    page.locator('#joinButton').click()
                    page.locator('#joinModal').wait_for(state='hidden')
                    token=page.evaluate('token')
                    page.locator('#quickState').select_option('sp')
                    page.locator('#gameDialog').get_by_role('button',name='Reconhecimento').click()
                    assert page.locator('#dialogTitle').text_content().strip()=='Reconhecimento de fronteira'
                    page.locator('#reconTarget').select_option('mg')
                    page.get_by_role('button',name='DESPACHAR DRONES').click()
                    page.locator('#gameDialog').wait_for(state='hidden')
                    assert any(o['type']=='recon' for o in backend('/api/state?token='+token)['json']['orders'])
                    page.locator('#primaryNav [data-page="intelligence"]').click()
                    page.get_by_role('tab',name='Missões em andamento').click()
                    assert page.get_by_text('Reconhecimento por drones').count()>0
                    time.sleep(2.5)
                    page.evaluate('fetchState()')
                    page.get_by_role('tab',name='Relatórios privados').click()
                    page.get_by_text('BLD: 9',exact=False).wait_for(timeout=6000)
                    assert backend('/api/state?token='+enemy['token'])['json']['intelligence']==[]
                    assert not errors,errors
                    page.screenshot(path='/mnt/data/Dominio_Global_Brasil_v0.7_inteligencia_desktop.png',full_page=True)
                    print('RECON UI: construção pré-configurada, ordem de drones, relatório privado e isolamento de dados OK')
                finally:browser.close()
        finally:
            server.terminate()
            try:server.wait(timeout=5)
            except subprocess.TimeoutExpired:server.kill()
if __name__=='__main__':main()
