import numpy as np, subprocess, os, math, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageChops
FPS=30; W,H=1920,1080; SW,SH=1280,720; B=0.5
FONT='/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'
FONTX='/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'
FONTM='/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf'
cache={}
def src(shot,t):
    f=t*FPS; i0=int(math.floor(f)); fr=f-i0
    if fr<0.2 or fr>0.8: return srci(shot,int(round(f)))
    return Image.blend(srci(shot,i0),srci(shot,i0+1),fr)
def srci(shot,i):
    d=f'frames/{shot}'; n=len(os.listdir(d)); i=min(n-1,max(0,i))
    k=(shot,i)
    if k not in cache:
        if len(cache)>200: cache.clear()
        cache[k]=Image.open(f'{d}/{i:05d}.jpg').convert('RGB')
    return cache[k]
# clips: (start,end,shot,src_start,speed,opts)
C=[
 (0.0,2.0,'forest_chase',3.0,0.5,dict(dark=0.45,zoom=(1.15,1.05))),
 (2.0,4.0,'alps_chase',0.0,0.5,dict(dark=0.45,zoom=(1.15,1.05))),
 (4.0,6.0,'fantasy',0.0,0.5,dict(dark=0.6,zoom=(1.0,1.12))),
 (6.0,8.0,'neon',3.0,0.5,dict(dark=0.7,zoom=(1.0,1.2))),
 (8.0,10.0,'forest_chase',0.0,1.0,dict(pump=1)),
 (10.0,11.0,'neon',0.0,1.0,dict(pump=1)),
 (11.0,12.0,'neon',2.0,1.0,dict(pump=1)),
 (12.0,14.0,'alps_chase',1.0,1.0,dict(pump=1)),
 (14.0,15.0,'fantasy',1.5,1.0,dict(pump=1)),
 (15.0,16.0,'neon',1.0,1.0,dict(pump=1)),
 (16.0,18.0,'boss',0.0,1.0,dict(dark=0.55,zoom=(1.0,1.25))),
 (18.0,20.0,'boss',2.0,1.0,dict(pump=1.6,shake=1)),
 (20.0,21.0,'fantasy',2.5,1.0,dict(pump=1.6,shake=1)),
 (21.0,22.0,'forest_chase',4.0,1.0,dict(pump=1.6,shake=1)),
 (22.0,24.0,'mothership',0.5,1.0,dict(pump=1.6,shake=1)),
 (24.0,25.0,'nuke',0.5,1.0,dict(zoom=(1.0,1.15),dark=0.75)),
 (25.0,26.75,'nuke',1.5,1.0,dict(shake=3,zoom=(1.2,1.0))),
 (26.75,30.0,'mothership',3.0,1.0,dict(dark=0.35,blur=6,zoom=(1.08,1.0))),
]
TEXT=[ # (start,end,lines,size,style)
 (0.05,1.9,['TWO PILOTS.'],150,'slam'),
 (2.05,3.9,['ONE KEYBOARD.'],150,'slam'),
 (4.0,5.95,['TEN WORLDS'],130,'slam'),
 (6.0,7.95,['NO MERCY'],130,'slam'),
 (16.0,17.95,['BOSSES.'],190,'slam'),
 (24.0,24.98,['SELF-DESTRUCT'],150,'slam'),
]
IMPACTS=[0.0,2.0,8.0,18.0,25.0,26.75]
def font(sz,f=FONT): 
    k=('f',sz,f)
    if k not in cache: cache[k]=ImageFont.truetype(f,sz)
    return cache[k]
def spaced(draw,txt,f,track):
    w=sum(draw.textlength(c,font=f) for c in txt)+track*(len(txt)-1); return w
def draw_text(img,lines,size,age,f=FONT,track=None,color=(255,255,255),y0=None,glow=(255,90,110)):
    track=size*0.06 if track is None else track
    s=1.0+0.35*math.exp(-age*22)   # slam scale
    a=min(1,age*12)
    layer=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(layer)
    fs=max(8,int(size*s)); ft=font(fs,f); tr=track*s
    lh=fs*1.1; ytop=(H-lh*len(lines))/2 if y0 is None else y0
    for li,txt in enumerate(lines):
        w=spaced(d,txt,ft,tr); x=(W-w)/2; y=ytop+li*lh
        for c in txt:
            d.text((x,y),c,font=ft,fill=color+(int(255*a),)); x+=d.textlength(c,font=ft)+tr
    g=layer.filter(ImageFilter.GaussianBlur(18))
    gr=Image.new('RGBA',(W,H),glow+(0,)); gr.putalpha(g.getchannel('A').point(lambda v:int(v*0.9)))
    img=Image.alpha_composite(img.convert('RGBA'),gr)
    return Image.alpha_composite(img,layer).convert('RGB')
vig=None
def vignette():
    y,x=np.ogrid[:H,:W]; r=np.sqrt(((x-W/2)/(W/2))**2+((y-H/2)/(H/2))**2)
    return np.clip(1-0.55*np.maximum(0,r-0.55)**1.6,0,1)[...,None]
def frame(t):
    clip=next(c for c in C if c[0]<=t<c[1])
    s,e,shot,ss,sp,o=clip; lt=t-s; u=lt/(e-s)
    img=src(shot,ss+lt*sp)
    z=1.0
    if 'zoom' in o: z0,z1=o['zoom']; z=z0+(z1-z0)*(1-(1-u)**2)
    if o.get('pump'):
        bt=(t%B); z*=1+0.045*o['pump']*math.exp(-bt*9)
    dx=dy=0
    if o.get('shake'):
        amp=o['shake']*(6 if o['shake']<2 else 1)
        if o['shake']>=2: amp=40*math.exp(-lt*2.2)+3
        else: amp=amp*math.exp(-(t%B)*8)+1
        dx=amp*math.sin(t*93.1); dy=amp*math.cos(t*71.7)
    if o.get('shake'): z=max(z,1.07)
    cw,ch=SW/z,SH/z; cx=min(max(SW/2+dx,cw/2),SW-cw/2); cy=min(max(SH/2+dy,ch/2),SH-ch/2)
    box=(cx-cw/2,cy-ch/2,cx+cw/2,cy+ch/2)
    im=img.resize((W,H),Image.LANCZOS,box=box)
    if o.get('blur'): im=im.filter(ImageFilter.GaussianBlur(o['blur']))
    if 'dark' in o: im=ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(0.75)).enhance(o['dark'])
    im=ImageEnhance.Contrast(im).enhance(1.12); im=ImageEnhance.Color(im).enhance(1.2)
    # chromatic aberration + flash near impacts
    imp=min([t-i for i in IMPACTS if t>=i] or [9])
    if imp<0.35:
        k=int(14*(1-imp/0.35))+1
        r,g,b=im.split(); r=ImageChops.offset(r,k,0); b=ImageChops.offset(b,-k,0); im=Image.merge('RGB',(r,g,b))
    arr=np.asarray(im).astype(np.float32)
    arr*=vig
    if imp<0.15 and t>0.1: arr+= 230*(1-imp/0.15)**2
    if shot=='nuke' and s==25.0 and lt<0.6: arr+=255*(1-lt/0.6)
    im=Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
    for ts,te,lines,sz,st in TEXT:
        if ts<=t<te: im=draw_text(im,lines,sz,t-ts)
    if t>=26.75:
        a=t-26.75
        im=draw_text(im,['MACH MANIA'],230,a,f=FONTX,track=20,y0=H/2-200)
        if a>0.5: im=draw_text(im,['LOCAL CO-OP  ·  FREE-FOR-ALL  ·  10 WORLDS  ·  2 BOSSES'],38,a-0.5,f=FONTM,track=4,y0=H/2+70,color=(220,230,255),glow=(90,140,255))
        if a>1.0: im=draw_text(im,['PLAY FREE IN YOUR BROWSER'],52,a-1.0,f=FONT,track=8,y0=H/2+150,color=(255,215,90),glow=(255,150,40))
        if a>1.4: im=draw_text(im,['vibe-jam-2026.github.io/team-6'],34,a-1.4,f=FONTM,track=1,y0=H/2+230,color=(200,205,220),glow=(60,60,80))
    # letterbox
    d=ImageDraw.Draw(im); lb=int(H*0.085); d.rectangle((0,0,W,lb),fill=0); d.rectangle((0,H-lb,W,H),fill=0)
    if t<0.15: im=Image.eval(im,lambda v:int(v*t/0.15))
    if t>29.4: im=Image.eval(im,lambda v:int(v*max(0,(30-t)/0.6)))
    return im
vig=vignette()
if len(sys.argv)>1:
    for t in map(float,sys.argv[1:]): frame(t).save(f'prev_{t}.jpg',quality=85)
    sys.exit()
p=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i','music.wav',
  '-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','256k','-shortest','-movflags','+faststart','trailer.mp4'],stdin=subprocess.PIPE)
for i in range(30*FPS):
    p.stdin.write(frame(i/FPS).tobytes())
    if i%60==0: print(i,flush=True)
p.stdin.close(); p.wait(); print('done')
