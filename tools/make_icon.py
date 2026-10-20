from PIL import Image,ImageDraw
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'app/assets';out.mkdir(parents=True,exist_ok=True)
im=Image.new('RGBA',(256,256));d=ImageDraw.Draw(im);d.rounded_rectangle((6,6,250,250),radius=56,fill='#111c24',outline='#527586',width=5)
for row in range(3):
 for col in range(3):
  x=46+col*56;y=47+row*56;d.rounded_rectangle((x,y,x+46,y+46),radius=17,fill='#325a6f',outline='#b1e2f8',width=3);d.arc((x+7,y+6,x+34,y+34),195,280,fill='#e4f7ff',width=3)
im.save(out/'app.png');im.save(out/'app.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
