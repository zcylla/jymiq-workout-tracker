import colorsys
def hx(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
def hex_(t): return '#%02x%02x%02x' % tuple(max(0,min(255,int(round(v)))) for v in t)
def lum(h):
    def c(v):
        v/=255
        return v/12.92 if v<=0.03928 else ((v+0.055)/1.055)**2.4
    r,g,b=hx(h); return 0.2126*c(r)+0.7152*c(g)+0.0722*c(b)
def ratio(a,b):
    la,lb=lum(a),lum(b); la,lb=max(la,lb),min(la,lb)
    return (la+0.05)/(lb+0.05)
def lift(h, bg, target=4.5, step=0.012):
    """Raise HLS lightness until the colour clears `target` against bg. Hue and saturation held."""
    r,g,b = [v/255 for v in hx(h)]
    hh,ll,ss = colorsys.rgb_to_hls(r,g,b)
    for _ in range(120):
        cand = hex_([v*255 for v in colorsys.hls_to_rgb(hh, ll, ss)])
        if ratio(cand, bg) >= target: return cand, round(ratio(cand,bg),2)
        ll = min(0.97, ll+step)
    return hex_([v*255 for v in colorsys.hls_to_rgb(hh, ll, ss)]), round(ratio(hex_([v*255 for v in colorsys.hls_to_rgb(hh,ll,ss)]), bg),2)
