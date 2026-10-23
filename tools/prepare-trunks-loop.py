"""Convert user-supplied Trunks video into a shared looping texture atlas.
Usage: python tools/prepare-trunks-loop.py /path/to/trunks.mp4
"""
from pathlib import Path
from PIL import Image,ImageOps
from scipy.ndimage import gaussian_filter
import numpy as np, subprocess,tempfile,io,struct,zlib,hashlib,json,sys
root=Path(__file__).resolve().parents[1]
fps=8;tile=256;grid=16;size=tile*grid
with tempfile.TemporaryDirectory() as temp:
 subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-vf',f'fps={fps},scale=768:432','-an',str(Path(temp)/'%04d.png')],check=True)
 files=sorted(Path(temp).glob('*.png'));assert 1<len(files)<=grid*grid
 atlas=Image.new('RGBA',(size,size),(105,110,118,255));previews=[]
 for i,file in enumerate(files):
  im=Image.open(file).convert('RGB');rgb=np.asarray(im).astype(float);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
  # Uniform orange backdrop is removed; purple hair, skin and dark clothing
  # remain opaque. Brighter yellow/white energy fades naturally through alpha.
  warm=(r>180)&(g>105)&(b<95)&((r-b)>100)
  glow=np.clip((g-188)/53,0,1)*.92+np.clip((b-25)/100,0,1)*.25
  alpha=np.where(warm,np.clip(glow,0,1),1.0)
  yy,xx=np.indices(alpha.shape);spatial=np.clip(1-((xx-384)/245)**2,0,1)
  alpha*=spatial;alpha=gaussian_filter(alpha,.65)
  cut=im.convert('RGBA');cut.putalpha(Image.fromarray(np.uint8(np.clip(alpha*255,0,255))))
  cut=cut.crop((130,0,638,432));fitted=ImageOps.contain(cut,(224,224),Image.Resampling.LANCZOS)
  frame=Image.new('RGBA',(224,224));frame.alpha_composite(fitted,((224-fitted.width)//2,(224-fitted.height)//2));previews.append(frame)
  atlas.alpha_composite(frame,((i%grid)*tile+16,(i//grid)*tile+16))
 # Fixed opaque marker, outside the sampled inset. No material uniform required.
 for y in range(8):
  for x in range(8):atlas.putpixel((x,y),(255,0,255,255))
 previews[0].save(root/'app/assets/video-trunks.png')
 previews[0].save(root/'app/assets/video-trunks.webp',save_all=True,append_images=previews[1:],duration=125,loop=0,quality=78,method=4)
 levels=[];mip=atlas
 while True:
  out=io.BytesIO();mip.save(out,format='DDS',pixel_format='DXT5');levels.append(out.getvalue())
  if mip.width==1:break
  mip=mip.resize((mip.width//2,mip.height//2),Image.Resampling.LANCZOS)
 header=bytearray(levels[0][:128]);struct.pack_into('<I',header,8,struct.unpack_from('<I',header,8)[0]|0x20000);struct.pack_into('<I',header,28,len(levels));struct.pack_into('<I',header,108,0x401008);struct.pack_into('<I',header,20,len(levels[0])-128)
 dds=bytes(header)+b''.join(l[128:] for l in levels);(root/'app/data/video-trunks.dds.z').write_bytes(zlib.compress(dds,9))
 meta={'frames':len(files),'fps':fps,'grid':grid,'tile':tile,'inset':16,'content':224,'size':size,'seconds':len(files)/fps,'mips':len(levels),'bytes':len(dds),'sha256':hashlib.sha256(dds).hexdigest()}
 (root/'app/data/video-trunks.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta))
