"""Keep original Goku pixels and feather the surrounding blue aura to transparency.
Usage: python tools/prepare-goku-aura.py /path/to/user/uploads
"""
from pathlib import Path
import sys
import numpy as np
from scipy.ndimage import distance_transform_edt, gaussian_filter
from PIL import Image, ImageDraw, ImageOps
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1])
items=[('701862.jpg','portrait-goku',.13,[(.195,0),(.78,0),(.81,.12),(.79,.20),(.73,.35),(.72,.44),(.69,.55),(.73,.61),(.82,.62),(.87,.68),(1,.82),(1,1),(.025,1),(.075,.88),(.10,.80),(.26,.69),(.32,.62),(.37,.55),(.34,.43),(.28,.38),(.24,.30),(.22,.19)]),('images.jpg','portrait-goku-ssj',.26,[(.44,0),(.71,0),(.73,.08),(.76,.10),(.72,.23),(.67,.32),(.66,.41),(.66,.49),(.80,.55),(.85,.75),(.88,1),(.30,1),(.31,.85),(.34,.70),(.34,.55),(.42,.49),(.43,.40),(.41,.32),(.39,.27),(.37,.15),(.39,.06)])]
for filename,name,reach,outline in items:
    im=Image.open(source/filename).convert('RGB');w,h=im.size
    # Polygon protects the entire character; no generated/repainted RGB pixels.
    mask=Image.new('L',(w,h));ImageDraw.Draw(mask).polygon([(round(x*w),round(y*h)) for x,y in outline],fill=255)
    subject=np.asarray(mask)>0
    distance=distance_transform_edt(~subject)
    t=np.clip(1-distance/(reach*w),0,1);aura=t*t*(3-2*t)
    rgb=np.asarray(im).astype(float);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
    blue=np.clip((b-r-10)/40,0,1)*np.clip((b-g+6)/24,0,1)
    # Preserve bright near-white energy around the protected silhouette as well.
    white=np.clip((np.minimum(np.minimum(r,g),b)-190)/50,0,1)*.65
    aura*=np.maximum(blue,white)
    yy,xx=np.indices((h,w));edge=np.minimum.reduce([xx,w-1-xx,yy,h-1-yy]);edge=np.clip(edge/(w*.045),0,1)
    aura*=edge*edge*(3-2*edge)
    alpha=np.where(subject,1,gaussian_filter(aura,1.2))
    rgba=im.convert('RGBA');rgba.putalpha(Image.fromarray(np.uint8(np.clip(alpha*255,0,255))))
    bounds=rgba.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
    fitted=ImageOps.contain(rgba.crop(bounds),(480,480),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(512,512));out.alpha_composite(fitted,((512-fitted.width)//2,(512-fitted.height)//2))
    out.save(root/'app/assets'/f'{name}.png')
    assert out.getchannel('A').getextrema()==(0,255)
    print(name, 'saved; original RGB retained, feathered aura alpha')
