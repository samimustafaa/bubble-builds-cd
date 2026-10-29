from pathlib import Path
from PIL import Image
import numpy as np,io,struct,zlib,hashlib,json
r=Path(__file__).resolve().parents[1];n=512
y,x=np.mgrid[0:n,0:n];u=(x+.5)/n;v=(y+.5)/n
# Two broad clipped-corner panels per row, seven rows per whole piece.
px=(u*2)%1;py=(v*7)%1
# Signed distances to the six edges of an elongated hexagonal panel.
edges=np.stack([py,1-py,px*.8+py*.6-.12,(1-px)*.8+py*.6-.12,px*.8+(1-py)*.6-.12,(1-px)*.8+(1-py)*.6-.12])
k=np.argmin(edges,axis=0);d=np.min(edges,axis=0);seam=.019;bevel=.14
inside=np.clip((d-seam)*100,0,1);t=np.clip((d-seam)/bevel,0,1)
# Broad steel center and light-catching top/left chamfers, dark lower chamfers.
face=.43+.12*(1-py)+.025*np.cos(px*np.pi)
lights=np.array([.91,.25,.86,.63,.37,.23]);rim=lights[k]
a=t*t*(3-2*t);shade=rim*(1-a)+face*a
# Small silver diamond connectors fill the intersections between panels.
corner=np.minimum(px,1-px)*.8+np.minimum(py,1-py)*.6
connector=np.clip((.102-corner)*100,0,1)
background=.045+connector*(.32+.24*(py>.5))
shade=background*(1-inside)+shade*inside
rgb=np.stack([shade*.94,shade*.97,shade*1.035],axis=-1)
img=Image.fromarray(np.uint8(np.clip(rgb,0,1)*255),'RGB').convert('RGBA');img.save(r/'app/assets/season3metal-sample.png')
levels=[];mip=img
while True:
 out=io.BytesIO();mip.save(out,format='DDS',pixel_format='DXT5');levels.append(out.getvalue())
 if mip.width==1:break
 mip=mip.resize((mip.width//2,mip.height//2),Image.Resampling.LANCZOS)
h=bytearray(levels[0][:128]);struct.pack_into('<I',h,8,struct.unpack_from('<I',h,8)[0]|0x20000);struct.pack_into('<I',h,28,len(levels));struct.pack_into('<I',h,108,0x401008);struct.pack_into('<I',h,20,len(levels[0])-128)
dds=bytearray(bytes(h)+b''.join(a[128:] for a in levels))
# Force opaque BC3 alpha even in padding texels of the smallest mips.
for o in range(128,len(dds),16):dds[o:o+8]=bytes([255,255,0,0,0,0,0,0])
dds=bytes(dds);(r/'app/data/season3metal.dds.z').write_bytes(zlib.compress(dds,9));(r/'app/data/metal-assets.json').write_text(json.dumps({'season3metal':{'sha256':hashlib.sha256(dds).hexdigest(),'bytes':len(dds)}},indent=2)+'\n')
