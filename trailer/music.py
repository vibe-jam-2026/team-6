import numpy as np, wave
SR=48000; BPM=120; B=60/BPM; DUR=30.0
N=int(SR*DUR); L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def t_(d): return np.arange(int(SR*d))/SR
def add(sig,at,pan=0.0,g=1.0):
    i=int(at*SR); 
    if i>=N: return
    s=sig[:N-i]*g; L[i:i+len(s)]+=s*np.sqrt(0.5*(1-pan)); R[i:i+len(s)]+=s*np.sqrt(0.5*(1+pan))
def lp(x,fc):
    fc=np.broadcast_to(np.asarray(fc,float),x.shape); a=1-np.exp(-2*np.pi*fc/SR); y=np.zeros_like(x); z=0.0
    for i in range(len(x)): z+=a[i]*(x[i]-z); y[i]=z
    return y
def hp(x,fc): return x-lp(x,fc)
def saw(f,t): ph=np.cumsum(np.broadcast_to(f,t.shape))/SR; return 2*(ph%1)-1
def kick(hard=1.0):
    t=t_(0.5); f=45+ (160*hard)*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*np.exp(-t*6.5); s+= 0.4*np.exp(-t*300)*rng.standard_normal(len(t))*0.3
    return np.tanh(s*2.2)*0.9
def snare():
    t=t_(0.35); n=hp(rng.standard_normal(len(t)),1500)*np.exp(-t*14)
    tone=np.sin(2*np.pi*190*t)*np.exp(-t*25); return (n*0.55+tone*0.5)
def clap():
    t=t_(0.3); n=hp(rng.standard_normal(len(t)),900); env=np.exp(-t*18)
    for o in (0.0,0.011,0.022): env+= (t>o)*np.exp(-np.maximum(t-o,0)*120)*0.6
    return n*env*0.35
def hat(open_=False):
    t=t_(0.25 if open_ else 0.06); n=hp(rng.standard_normal(len(t)),7000)
    return n*np.exp(-t*(12 if open_ else 70))*0.22
def impact(size=1.0, d=3.0):
    t=t_(d); f=30+90*np.exp(-t*4); sub=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*(1.3/size))
    n=lp(rng.standard_normal(len(t)), 300+5000*np.exp(-t*3))*np.exp(-t*(2.0/size))
    return np.tanh((sub*1.3+n*0.9)*1.5)*0.9
def riser(d):
    t=t_(d); x=t/d; n=rng.standard_normal(len(t)); s=lp(n,200+9000*x**2)*x**2
    s+= 0.25*saw(110*2**(3*x),t)*x**3
    return s*0.6
def whoosh(d=0.6):
    t=t_(d); x=t/d; env=np.sin(np.pi*x)**2; return lp(rng.standard_normal(len(t)),400+4000*env)*env*0.5
def note(m): return 440*2**((m-69)/12)
def bassnote(m,d,cut=900,g=0.35):
    t=t_(d); f=note(m); s=saw(f,t)+saw(f*1.007,t)+0.6*np.sin(2*np.pi*f/2*t)
    env=np.minimum(1,t*200)*np.exp(-t*3)
    return np.tanh(lp(s,cut*(0.3+env))*1.6)*env*g
def stab(ms,d=0.4,g=0.12):
    t=t_(d); s=sum(saw(note(m)*dt,t) for m in ms for dt in (1,1.005,0.995))
    env=np.exp(-t*5)*np.minimum(1,t*300); return lp(s,500+6000*np.exp(-t*8))*env*g
def drone(d):
    t=t_(d); s=saw(note(26),t)+saw(note(26)*1.003,t)+saw(note(33)*0.998,t)
    return lp(s,150+400*(t/d)**2)*0.25*np.minimum(1,t/1.5)

# Section timing (seconds)
# 0-4 intro, 4-8 build, 8-16 main A, 16-18 break/riser, 18-25 drop, 25 NUKE, 26.5-30 title
add(drone(8.0),0, g=1.0)
for at in (0.0, 2.0): add(impact(0.8,2.5),at,g=0.8)
add(riser(4.0),0.0,g=0.5)
# build: half-time kicks + clap on 3
for b in range(8):
    at=4+b*B
    if b%2==0: add(kick(0.8),at)
    if b%4==2: add(clap(),at)
    add(hat(),at+B/2,pan=0.3)
add(riser(2.0),6.0,g=0.7)
add(impact(1.0),8.0,g=0.9)
# bassline pattern (D minor): 16th-note pump
prog=[38,38,41,36]  # D, D, F, C (low)
def mainloop(start,bars,hard=1.0,stabs=True):
    for bar in range(bars):
        root=prog[bar%4]
        for beat in range(4):
            at=start+(bar*4+beat)*B
            add(kick(hard),at,g=1.0)
            if beat in (1,3): add(snare(),at,g=0.8); add(clap(),at,g=0.8)
            for s in range(4):
                if s!=0: add(bassnote(root+(12 if s==2 else 0),B/4*0.95,cut=700+500*hard),at+s*B/4,pan=0.0)
                add(hat(),at+s*B/4,pan=(0.4 if s%2 else -0.4),g=(1.0 if s%2 else 0.6))
            if beat==3: add(hat(True),at+B/2,pan=0.2)
        if stabs:
            ch=[root+24,root+27+(1 if root==41 else 0),root+31]
            add(stab(ch),start+bar*4*B,pan=-0.3); add(stab(ch,0.25,0.08),start+bar*4*B+1.5*B,pan=0.3)
mainloop(8.0,4,1.0)        # 8-16
# break 16-18: riser + snare roll
add(riser(2.0),16.0,g=0.9)
for i in range(16): add(snare(),16+i*B/4,g=0.2+0.6*i/16)
add(drone(2.0),16.0,g=0.8)
add(impact(1.3,3),18.0,g=1.0)
mainloop(18.0,3,1.35)      # 18-24
# 24-25: 2 beats of double-time kicks then silence for half beat
for i in range(6): add(kick(1.4),24+i*B/3*1.0,g=0.9)
add(whoosh(0.5),24.5,g=0.8)
# 25: NUKE
add(impact(2.2,5.0),25.0,g=1.3); add(impact(1.0,2.0),25.0,g=0.6)
# title hit at 26.75 + tail
add(stab([50,53,57,62],2.5,0.18),26.75); add(kick(1.2),26.75); add(impact(1.6,3.2),26.75,g=0.7)
mix=np.stack([L,R],1)
# glue: soft clip + fade
mix=np.tanh(mix*1.1)
fade=np.ones(N); fl=int(SR*0.6); fade[-fl:]=np.linspace(1,0,fl); mix*=fade[:,None]
mix/=np.max(np.abs(mix))*1.05
w=wave.open('music.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix*32767).astype('<i2').tobytes()); w.close()
print('ok')
