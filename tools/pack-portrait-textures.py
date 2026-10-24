"""Pack the selected cutout PNGs as authored BC3/DXT5 textures, with alpha and mipmaps."""
from pathlib import Path
from PIL import Image
import io, struct, hashlib, json, zlib
root=Path(__file__).resolve().parents[1]
records={}
for name in ['portrait-dark','portrait-warm','portrait-smile','portrait-tate','portrait-kakashi','portrait-sharingan']:
    source=Image.open(root/'app/assets'/f'{name}.png').convert('RGBA')
    assert source.size==(512,512)
    alpha=source.getchannel('A');assert alpha.getextrema()==(0,255)
    levels=[];image=source
    while True:
        mip=image.copy()
        # Hidden RGB signature lets the shader identify our diffuse texture without a new uniform.
        # Its alpha is zero, so the signature never appears on the rendered surface.
        marker=max(1,(image.width*8+511)//512)
        for y in range(marker):
            for x in range(marker):mip.putpixel((x,y),(255,0,255,0))
        out=io.BytesIO();mip.save(out,format='DDS',pixel_format='DXT5');encoded=out.getvalue()
        levels.append(encoded)
        if image.width==1:break
        image=image.resize((max(1,image.width//2),max(1,image.height//2)),Image.Resampling.LANCZOS)
    header=bytearray(levels[0][:128]);struct.pack_into('<I',header,8,struct.unpack_from('<I',header,8)[0]|0x20000)
    struct.pack_into('<I',header,28,len(levels));struct.pack_into('<I',header,108,0x401008)
    # DDSD_LINEARSIZE describes the first BC3 mip, not a scanline pitch.
    struct.pack_into('<I',header,20,len(levels[0])-128)
    dds=bytes(header)+b''.join(level[128:] for level in levels)
    decoded=Image.open(io.BytesIO(dds)).convert('RGBA');r,g,b,a=decoded.getpixel((1,1));assert r>240 and g<15 and b>240 and a==0
    assert decoded.getchannel('A').getextrema()==(0,255)
    packed=zlib.compress(dds,9);(root/'app/data'/f'{name}.dds.z').write_bytes(packed)
    records[name]={'sha256':hashlib.sha256(dds).hexdigest(),'bytes':len(dds),'width':512,'height':512,'mips':len(levels),'compression':'DXT5'}
(root/'app/data/portrait-assets.json').write_text(json.dumps(records,indent=2)+'\n')
print(json.dumps(records,indent=2))
