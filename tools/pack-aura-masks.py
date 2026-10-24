"""Build silhouette-distance masks for the portrait-only animated aura shader."""
from pathlib import Path
from PIL import Image
from scipy.ndimage import distance_transform_edt
import numpy as np,json,zlib,hashlib
root=Path(__file__).resolve().parents[1];records={}
for name in ['dark','warm','smile','tate','kakashi','sharingan']:
 im=Image.open(root/f'app/assets/portrait-{name}.png').convert('RGBA');parts=[];offsets=[]
 while True:
  a=np.asarray(im.getchannel('A'));inside=a>8
  distance=distance_transform_edt(~inside);radius=max(1,im.width*32/512)
  glow=np.clip(1-distance/radius,0,1);glow=glow*glow*(3-2*glow)
  mask=np.where(inside,224+a.astype(float)*31/255,glow*96).astype('uint8')
  offsets.append({'width':im.width,'offset':sum(len(p) for p in parts)});parts.append(mask.tobytes())
  if im.width==1:break
  im=im.resize((im.width//2,im.height//2),Image.Resampling.LANCZOS)
 data=b''.join(parts);file=f'portrait-{name}.aura.z';(root/'app/data'/file).write_bytes(zlib.compress(data,9));records[f'portrait-{name}']={'file':file,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'levels':offsets}
(root/'app/data/aura-masks.json').write_text(json.dumps(records,indent=2)+'\n')
