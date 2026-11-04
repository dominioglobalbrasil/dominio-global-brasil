"""UI end-to-end smoke: support missions and military buildings on desktop and mobile.
Chromium executes real app.js against real Node HTTP server with a test-only local bridge.
"""
from pathlib import Path
import os, subprocess, json, time, base64, urllib.request, urllib.error
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
PORT=3269
BASE=f'http://127.0.0.1:{PORT}'
DATA=Path('/tmp/dominio-v08-support-ui.json')

def backend(path, method='GET', body=None):
    req=urllib.request.Request(BASE+path, data=body.encode() if body else None,method=method,headers={'content-type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=6) as resp:
            return {'status':resp.status,'json':json.loads(resp.read().decode())}
    except urllib.error.HTTPError as e:
        return {'status':e.code,'json':json.loads(e.read().decode())}

def build_html():
    html=(ROOT/'public/index.html').read_text()
    css=(ROOT/'public/styles.css').read_text()
    for asset in ('soldier.webp','base-bunker.webp'):
        encoded=base64.b64encode((ROOT/'public/assets'/asset).read_bytes()).decode()
        css=css.replace(f"'/assets/{asset}'",f"'data:image/webp;base64,{encoded}'")
    html=html.replace('<link rel="stylesheet" href="/styles.css">','<style>'+css+'</style>')
    encoded=base64.b64encode((ROOT/'public/assets/terrain-relief.webp').read_bytes()).decode()
    html=html.replace('/assets/terrain-relief.webp','data:image/webp;base64,'+encoded)
    js=(ROOT/'public/app.js').read_text()
    html=html.replace('<script type="module" src="/app.js"></script>','''<script>
        const _store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>_store[k]||null,setItem:(k,v)=>_store[k]=String(v),removeItem:k=>delete _store[k]}});
        window.fetch=async function(path,options={}){const result=await window.__backend(path,options.method||'GET',options.body||null);return new Response(JSON.stringify(result.json),{status:result.status,headers:{'Content-Type':'application/json'}})};
        window.EventSource=class {addEventListener(){} close(){}};
      </script><script>'''+js+'</script>')
    return html

def run():
    DATA.unlink(missing_ok=True)
    # A controlled test game. Never modifies user campaigns.
    env=os.environ.copy();env['DG_LEGACY_GUEST']='1';env.update(DATA_FILE=str(DATA),PORT=str(PORT),TICK_MS='300000')
    starter=subprocess.run(['node','--input-type=module','-e', '''
import {createGame} from './src/engine.mjs';import {writeFileSync} from 'node:fs';
const g=createGame();for(const id of ['sp','ms']){const p=g.provinces.find(p=>p.id===id);p.airfield=1;p.battery=1;p.units.aircraft=8;p.units.artillery=16;p.troops=144;}
g.diplomacy.wars['mg:sp']=true;g.diplomacy.wars['ms:mt']=true;
writeFileSync(process.env.DATA_FILE,JSON.stringify(g));
'''], cwd=ROOT, env=env,capture_output=True,text=True)
    assert starter.returncode==0,starter.stderr
    server=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    try:
        for i in range(35):
            try:
                if backend('/api/health')['status']==200:break
            except Exception:time.sleep(.12)
        else:raise RuntimeError('server did not start')
        html=build_html()
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
            try:
                for platform,viewport,faction in [('desktop',{'width':1440,'height':900},'São Paulo'),('mobile',{'width':390,'height':844},'Mato Grosso do Sul')]:
                    context=browser.new_context(viewport=viewport,device_scale_factor=1,reduced_motion='reduce')
                    page=context.new_page()
                    page.set_default_timeout(7000)
                    errors=[]
                    page.on('pageerror',lambda e:errors.append(str(e)))
                    page.expose_function('__backend',backend)
                    page.set_content(html,wait_until='domcontentloaded')
                    page.locator('#commanderName').fill('Piloto '+platform)
                    page.locator('#stateSearch').fill(faction)
                    page.locator('.faction-choice').first.click()
                    page.locator('#joinButton').click()
                    page.locator('#joinModal').wait_for(state='hidden',timeout=10000)
                    nav='#primaryNav' if platform=='desktop' else '.mobile-nav'
                    page.locator(f'{nav} [data-page="military"]').click()
                    page.get_by_role('tab',name='Missões especiais').click()
                    assert page.get_by_text('Centro de operações de apoio').count()==1
                    page.get_by_role('button',name='Missão aérea').first.click()
                    assert page.locator('#dialogTitle').inner_text().lower()=='missão aérea'
                    assert page.locator('#supportTarget option').count()>0
                    page.locator('#supportCount').fill('4')
                    assert not page.get_by_role('button',name='AUTORIZAR MISSÃO AÉREA').is_disabled()
                    page.screenshot(path=f'/mnt/data/Dominio_Global_Brasil_v0.8_missao_{platform}.png',full_page=False)
                    page.get_by_role('button',name='AUTORIZAR MISSÃO AÉREA').click()
                    page.locator('#gameDialog').wait_for(state='hidden')
                    tok=page.evaluate('token')
                    assert any(o['type']=='airstrike' and o['unitCount']==4 for o in backend('/api/state?token='+tok)['json']['orders'])
                    page.get_by_role('button',name='Bombardeio').first.click()
                    assert page.locator('#dialogTitle').inner_text().lower()=='bombardeio de artilharia'
                    page.locator('#supportCount').fill('12')
                    assert not page.get_by_role('button',name='AUTORIZAR BOMBARDEIO').is_disabled()
                    page.get_by_role('button',name='AUTORIZAR BOMBARDEIO').click()
                    page.locator('#gameDialog').wait_for(state='hidden')
                    assert any(o['type']=='barrage' for o in backend('/api/state?token='+tok)['json']['orders'])
                    page.locator(f'{nav} [data-page="construction"]').click()
                    page.get_by_role('tab',name='Aeródromos').click()
                    assert page.get_by_text('Aeródromos militares').count()==1
                    page.locator('.row-list .mini-btn').first.click()
                    assert page.locator('#dialogTitle').inner_text().lower()=='instalar aeródromo militar'
                    page.screenshot(path=f'/mnt/data/Dominio_Global_Brasil_v0.8_construcao_{platform}.png',full_page=False)
                    page.locator('#dialogClose').click()
                    page.get_by_role('tab',name='Baterias').click()
                    assert page.get_by_text('Baterias de artilharia').count()==1
                    page.locator('.row-list .mini-btn').first.click()
                    assert page.locator('#dialogTitle').inner_text().lower()=='instalar bateria de artilharia'
                    page.locator('#dialogClose').click()
                    assert not errors, errors
                    print(f'{platform.upper()}: missões, custos, janelas, ordens persistidas e navegação OK')
                    context.close()
            finally:browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)

if __name__=='__main__':run()
