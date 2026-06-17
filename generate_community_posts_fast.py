import gzip, hashlib, html, json, random, re, time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin

ROOT=Path('/home/user/KindnessMap/kindness-map')
OUT_DIR=ROOT/'backend'/'data'; OUT_DIR.mkdir(parents=True,exist_ok=True)
UA='KindnessMapDataSeeder/1.0 metadata-only (+https://kindnessmap-vn.vercel.app)'
TARGET=300

FALLBACK_IMAGES={
 'Cộng đồng':'https://images.unsplash.com/photo-1593113598432-846f29edce7b?auto=format&fit=crop&w=800&q=80',
 'Tình nguyện':'https://images.unsplash.com/photo-1593113598432-846f29edce7b?auto=format&fit=crop&w=800&q=80',
 'Giáo dục':'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
 'Hiến máu':'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80',
 'Trồng cây':'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
 'Môi trường':'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
 'Người cao tuổi':'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80'}
LOCATIONS={'Hà Nội':(21.0285,105.8542),'TP. Hồ Chí Minh':(10.7769,106.7009),'Hồ Chí Minh':(10.7769,106.7009),'Đà Nẵng':(16.0544,108.2022),'Hải Phòng':(20.8449,106.6881),'Cần Thơ':(10.0452,105.7469),'An Giang':(10.5216,105.1259),'Bình Dương':(11.3254,106.477),'Bình Phước':(11.7512,106.7235),'Bình Thuận':(10.9333,108.1),'Bình Định':(13.782,109.2197),'Bạc Liêu':(9.294,105.7216),'Bắc Giang':(21.2731,106.1946),'Bắc Kạn':(22.147,105.8348),'Bắc Ninh':(21.1861,106.0763),'Bến Tre':(10.2415,106.3759),'Cao Bằng':(22.6666,106.2639),'Cà Mau':(9.1768,105.1524),'Đắk Lắk':(12.6667,108.05),'Đắk Nông':(12.2646,107.6098),'Điện Biên':(21.386,103.023),'Đồng Nai':(10.9574,106.8427),'Đồng Tháp':(10.4938,105.6882),'Gia Lai':(13.9833,108),'Hà Giang':(22.8233,104.9836),'Hà Nam':(20.5835,105.9227),'Hà Tĩnh':(18.3428,105.9057),'Hải Dương':(20.9373,106.3146),'Hậu Giang':(9.7845,105.4701),'Hòa Bình':(20.6861,105.3131),'Hưng Yên':(20.6464,106.0511),'Khánh Hòa':(12.2388,109.1967),'Kiên Giang':(10.0125,105.0809),'Kon Tum':(14.3497,108.0005),'Lai Châu':(22.3964,103.4582),'Lâm Đồng':(11.5753,108.1429),'Lạng Sơn':(21.8537,106.7615),'Lào Cai':(22.4809,103.9755),'Long An':(10.6956,106.2431),'Nam Định':(20.4388,106.1621),'Nghệ An':(19.2342,104.92),'Ninh Bình':(20.2506,105.9745),'Ninh Thuận':(11.6739,108.8629),'Phú Thọ':(21.2684,105.2046),'Phú Yên':(13.0882,109.0929),'Quảng Bình':(17.6103,106.3487),'Quảng Nam':(15.5394,108.0191),'Quảng Ngãi':(15.1214,108.8044),'Quảng Ninh':(21.0064,107.2925),'Quảng Trị':(16.7403,107.1855),'Sóc Trăng':(9.6037,105.9739),'Sơn La':(21.327,103.9141),'Tây Ninh':(11.3352,106.1099),'Thái Bình':(20.4463,106.3366),'Thái Nguyên':(21.5672,105.8252),'Thanh Hóa':(19.8067,105.7852),'Thừa Thiên Huế':(16.4637,107.5909),'Huế':(16.4637,107.5909),'Tiền Giang':(10.4493,106.342),'Trà Vinh':(9.9347,106.3453),'Tuyên Quang':(21.8236,105.2142),'Vĩnh Long':(10.2537,105.9722),'Vĩnh Phúc':(21.3609,105.5474),'Yên Bái':(21.7168,104.8986)}
LOC_ITEMS=sorted(LOCATIONS.items(), key=lambda x:-len(x[0]))
ALLOW=re.compile(r'(nhân ái|thiện nguyện|tình nguyện|cộng đồng|hỗ trợ|ủng hộ|trao|tặng|quỹ|người nghèo|khó khăn|nhân đạo|chữ thập đỏ|hiến máu|hành trình đỏ|mái ấm|nhà nhân ái|trường|học sinh|trẻ em|người cao tuổi|liệt sĩ|người có công|môi trường|trồng|rừng|xanh|bão|lũ|thiên tai|hạn hán|sinh kế|đời sống|an sinh)',re.I)

def fetch(url):
 req=Request(url,headers={'User-Agent':UA,'Accept-Encoding':'gzip, deflate'})
 with urlopen(req,timeout=30) as r:
  raw=r.read(); enc=(r.headers.get('Content-Encoding') or '').lower()
  if enc=='gzip': raw=gzip.decompress(raw)
  return raw.decode('utf-8','ignore')

def strip(s):
 s=re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>',' ',s or '',flags=re.I)
 s=re.sub(r'<[^>]+>',' ',s); s=html.unescape(s); return re.sub(r'\s+',' ',s).strip()

def title_from_slug(url):
 slug=url.rsplit('/',1)[-1].replace('.htm','')
 slug=re.sub(r'-?20\d{10,}.*$','',slug); slug=re.sub(r'-\d{4,}$','',slug)
 return slug.replace('-',' ').strip().capitalize()

def cat(text):
 t=text.lower()
 if any(k in t for k in ['hiến máu','hành trình đỏ','giọt hồng','đơn vị máu']): return 'Hiến máu'
 if any(k in t for k in ['trồng cây','trồng rừng','rừng ngập mặn']): return 'Trồng cây'
 if any(k in t for k in ['môi trường','khí hậu','hạn hán','xâm nhập mặn','rác','xanh','hệ sinh thái','thiên tai','bão','lũ']): return 'Môi trường'
 if any(k in t for k in ['học sinh','điểm trường','trường','giáo dục','trẻ em','lớp học']): return 'Giáo dục'
 if any(k in t for k in ['người cao tuổi','cụ già','người già']): return 'Người cao tuổi'
 if any(k in t for k in ['tình nguyện','thiện nguyện','chữ thập đỏ','nhân đạo','hỗ trợ','ủng hộ','trao tặng','tặng quà']): return 'Tình nguyện'
 return 'Cộng đồng'

def loc(text,url=''):
 hay=html.unescape((text or '')+' '+(url or ''))
 for n,(la,lo) in LOC_ITEMS:
  if re.search(r'(?<![\wÀ-ỹ])'+re.escape(n)+r'(?![\wÀ-ỹ])',hay,re.I): return n,la,lo
 names=list(LOCATIONS); h=int(hashlib.sha1((text+url).encode()).hexdigest(),16); n=names[h%len(names)]; la,lo=LOCATIONS[n]; rnd=random.Random(h)
 return n, round(la+rnd.uniform(-.035,.035),6), round(lo+rnd.uniform(-.035,.035),6)

def rec(source, sourceName, url, title, excerpt='', image='', strict=True):
 title=strip(title); title=re.sub(r'^(Mã số|HỒ SƠ MÃ SỐ)\s*\d+\s*:\s*','',title,flags=re.I)[:295]
 excerpt=strip(excerpt)
 if not title or len(title)<10: return None
 text=title+'. '+excerpt
 if strict and not ALLOW.search(text): return None
 category=cat(text); location,la,lo=loc(text,url)
 if not image: image=FALLBACK_IMAGES[category]
 if image.startswith('//'): image='https:'+image
 if image.startswith('/'): image=urljoin(url,image)
 summary=excerpt[:420].rstrip()
 if not summary: summary=f'Thông tin hoạt động thiện nguyện, nhân ái vì cộng đồng được tổng hợp từ nguồn {sourceName}.'
 elif not summary.endswith(('.','!','?','…')): summary+='...'
 desc=f'{summary}\n\nNguồn: {sourceName}. Xem bài gốc: {url}'
 return {'title':title,'description':desc,'imageUrl':image,'category':category,'latitude':round(float(la),6),'longitude':round(float(lo),6),'locationName':location,'sourceName':sourceName,'sourceUrl':url}

def collect_dantri(limit=20):
    items = [
        ('https://dantri.com.vn/tam-long-nhan-ai/bong-dien-nghiem-trong-nguoi-bo-4-con-mat-doi-tay-kho-giu-chan-phai-20260604112159221.htm','Bỏng điện nghiêm trọng, người bố 4 con mất đôi tay, khó giữ chân phải','Bỏng điện nghiêm trọng khiến người bố 4 con cần được hỗ trợ chi phí điều trị và phục hồi.','https://cdnphoto.dantri.com.vn/ZhNyofPX6H6lnq8qbHuujjBOGMc=/thumb_w/1152/2026/06/04/hungyenbonghuonghong1s-edited-1780546284680.jpg'),
        ('https://dantri.com.vn/tam-long-nhan-ai/diem-truong-moi-thap-hy-vong-cho-tre-em-ban-bien-gioi-20260613060604061.htm','Điểm trường mới thắp hy vọng cho trẻ em bản biên giới','Điểm trường mới giúp học sinh vùng biên giới có thêm điều kiện học tập an toàn, ổn định.','https://cdnphoto.dantri.com.vn/GYYlw3Vd-v1MttgzgwzelJLXcmQ=/thumb_w/396/2026/06/13/cha-nga-my-ly-ky-son-nghe-an-edited-1781304999187.jpg'),
        ('https://dantri.com.vn/tam-long-nhan-ai/ban-het-nha-cua-van-khong-cuu-duoc-con-gia-dinh-ngheo-kiet-que-sau-bien-co-20260603134840260.htm','Bán hết nhà cửa vẫn không cứu được con, gia đình nghèo kiệt quệ sau biến cố','Gia đình khó khăn cần sự chung tay của cộng đồng sau biến cố bệnh tật, tai nạn.','https://cdnphoto.dantri.com.vn/cFdDRw9bjHBnLmrcW02CRYXz260=/thumb_w/396/2026/06/15/nhan-10-cropped-1781498800237.jpg'),
        ('https://dantri.com.vn/tam-long-nhan-ai/con-trai-da-chan-thuong-sau-tai-nan-me-don-than-ngheo-lam-canh-kiet-que-20260525115716257.htm','Con trai đa chấn thương sau tai nạn, mẹ đơn thân nghèo lâm cảnh kiệt quệ','Hoàn cảnh mẹ đơn thân nghèo chăm con đa chấn thương cần được hỗ trợ.','https://cdnphoto.dantri.com.vn/DxGc4rsPryz9yoEHnc71nh7Uab0=/thumb_w/396/2026/05/25/xaynhaphuthohuonghong1h-cropped-1779684447857.jpg'),
        ('https://dantri.com.vn/tam-long-nhan-ai/duoi-mai-nha-nhan-ai-nguoi-phu-nu-tam-than-da-dan-hoi-tinh-20260613082517452.htm','Dưới mái nhà Nhân ái, người phụ nữ tâm thần đã dần hồi tỉnh','Mái nhà nhân ái và sự hỗ trợ cộng đồng giúp một hoàn cảnh yếu thế dần ổn định cuộc sống.','https://cdnphoto.dantri.com.vn/JwZYyrC8SdTUwizCDI7YwPKkv5E=/thumb_w/396/2026/06/13/dsc5340-edited-1781367661573.jpg'),
        ('https://dantri.com.vn/tam-long-nhan-ai/nguoi-dan-ong-ngheo-tung-xin-ve-nha-cho-chet-duoc-ho-tro-hon-71-trieu-dong-20260614112258776.htm','Người đàn ông nghèo từng xin về nhà chờ chết được hỗ trợ hơn 71 triệu đồng','Bạn đọc và cộng đồng chung tay hỗ trợ người bệnh nghèo vượt qua giai đoạn khó khăn.','https://cdnphoto.dantri.com.vn/tREEcaqrnuMJqIa5CzKAgQmHh2Q=/thumb_w/264/2026/06/14/trao-tien-nhan-aia-nui-edited-1781411199398.jpg'),
        ('https://dantri.com.vn/tam-long-nhan-ai/con-trai-thieu-nang-nguy-co-phai-cat-chan-cha-gia-bat-khoc-cau-cuu-20260602193134660.htm','Con trai thiểu năng nguy cơ phải cắt chân, cha già bật khóc cầu cứu','Gia đình có người khuyết tật, bệnh nặng cần được cộng đồng tiếp sức điều trị.','https://cdnphoto.dantri.com.vn/5S1UKXKgL3z3Y3uzqwQ4LxjXq28=/thumb_w/264/2026/06/04/20260509102308-cropped-cropped-cropped-1780545840444.jpg'),
        ('https://dantri.com.vn/tam-long-nhan-ai/xay-cau-dan-tri-du-an-xay-cau-thien-nguyen-cua-bao-dan-tri-240600.htm','Xây cầu Dân trí - Dự án xây cầu thiện nguyện của báo Dân trí','Dự án cầu thiện nguyện góp phần mở lối giao thương, đi học an toàn cho người dân vùng khó khăn.','https://cdnphoto.dantri.com.vn/WQ5kD11a_DZhiTXp84O2LeAkw-0=/zoom/576_384/2026/01/07/khanh-thanh-cau-dan-tri-thon-trang-thanh-edited-1767765740891.jpg'),
        ('https://dantri.com.vn/tam-long-nhan-ai/chong-mat-vi-ung-thu-nguoi-me-xin-cuu-con-trai-bi-tai-nan-nam-liet-giuong-5984.htm','Chồng mất vì ung thư, người mẹ xin cứu con trai bị tai nạn nằm liệt giường','Hoàn cảnh gia đình mất trụ cột, con bệnh nặng cần hỗ trợ điều trị và sinh hoạt.','https://cdnphoto.dantri.com.vn/xyx1pEbR7Izh1lICL7VgJf75D1g=/zoom/576_384/2026/05/25/2-1779699276049.jpg'),
        ('https://dantri.com.vn/tam-long-nhan-ai/thong-bao-ket-chuyen-nhan-ai-tuan-1-thang-62026-20260615142917001.htm','Thông báo kết chuyển Nhân ái tuần 1 tháng 6/2026','Thông tin kết chuyển nguồn hỗ trợ nhân ái từ bạn đọc đến các hoàn cảnh khó khăn.','https://cdnphoto.dantri.com.vn/UtNFSw4Sjxtwga9e-yW5TDNrNAU=/thumb_w/264/2025/12/06/logo-nhan-ai-cropped-1765010293075.jpg')
    ]
    out=[]
    for href,title,ex,img in items[:limit]:
        r=rec('dantri','Dân trí - Tấm lòng nhân ái',href,title,ex,img,strict=False)
        if r: out.append(r)
    print('dantri',len(out)); return out

def collect_bcp(limit=180):
    out=[]; seen=set(); base='https://baochinhphu.vn'
    pages=['https://baochinhphu.vn/xa-hoi/doi-song.htm']+[f'https://baochinhphu.vn/xa-hoi/doi-song/trang-{i}.htm' for i in range(2,40)]
    for p in pages:
        if len(out)>=limit: break
        try: txt=fetch(p)
        except Exception as e: print('bcp page skip',e); continue
        chunks=re.split(r'<div class="box-category-item', txt)
        for ch in chunks[1:]:
            if len(out)>=limit: break
            m=re.search(r'href=["\']([^"\']+-102\d+\.htm)["\']', ch, re.I)
            if not m: continue
            href=urljoin(base, html.unescape(m.group(1)))
            if href in seen: continue
            tm=re.search(r'class="box-category-link-title"[^>]+title=["\']([^"\']+)["\']', ch, re.I) or re.search(r'title=["\']([^"\']+)["\']', ch, re.I)
            title=html.unescape(tm.group(1)) if tm else title_from_slug(href)
            im=re.search(r'<img[^>]+(?:src|data-src)=["\']([^"\']+)["\']', ch, re.I)
            img=html.unescape(im.group(1)) if im else ''
            sm=re.search(r'<p[^>]+class="box-category-sapo"[^>]*>([\s\S]{0,900}?)</p>', ch, re.I)
            ex=strip(sm.group(1)) if sm else ''
            r=rec('baochinhphu','Báo Chính phủ - Đời sống',href,title,ex,img,strict=True)
            if r: out.append(r); seen.add(href)
        time.sleep(.08)
    print('bcp',len(out)); return out

def collect_redcross(limit=100):
 out=[]; seen=set()
 for page in range(1,4):
  if len(out)>=limit: break
  try: data=json.loads(fetch(f'https://redcross.org.vn/wp-json/wp/v2/posts?per_page=100&page={page}&_embed=1'))
  except Exception as e: print('redcross skip',e); break
  for it in data:
   if len(out)>=limit: break
   href=it.get('link','');
   if href in seen: continue
   title=it.get('title',{}).get('rendered',''); ex=it.get('excerpt',{}).get('rendered','')
   img=''; emb=it.get('_embedded',{})
   if emb.get('wp:featuredmedia'): img=emb['wp:featuredmedia'][0].get('source_url','')
   r=rec('redcross','Hội Chữ thập đỏ Việt Nam',href,title,ex,img,strict=True)
   if r: out.append(r); seen.add(href)
  time.sleep(1)
 print('redcross',len(out)); return out

def sqlq(s): return "'"+str(s).replace('\\','\\\\').replace("'","''")+"'"
def make_sql(rs):
 lines=['-- KindnessMap community posts seed generated from public metadata/excerpts.','-- Short summaries + image URLs + source attribution only; no full article content is copied.','-- Run after Users table exists. Duplicate titles are skipped.','']
 for i,r in enumerate(rs):
  feat=1 if i<18 else 0
  lines.append("INSERT INTO Posts (title, description, imageUrl, category, latitude, longitude, locationName, status, isFeatured, pointsAwarded, userId)\nSELECT {t}, {d}, {img}, {cat}, {lat}, {lng}, {loc}, 'Approved', {feat}, 1, COALESCE((SELECT id FROM Users WHERE role = 'admin' ORDER BY id LIMIT 1), (SELECT id FROM Users ORDER BY id LIMIT 1))\nWHERE NOT EXISTS (SELECT 1 FROM Posts WHERE title = {t});".format(t=sqlq(r['title']),d=sqlq(r['description']),img=sqlq(r['imageUrl']),cat=sqlq(r['category']),lat=r['latitude'],lng=r['longitude'],loc=sqlq(r['locationName']),feat=feat))
 return '\n'.join(lines)+'\n'

def main():
 rs=[]; rs+=collect_dantri(20); rs+=collect_bcp(180); rs+=collect_redcross(200)
 ded=[]; seen=set()
 for r in rs:
  k=(r['sourceUrl'] or r['title']).lower()
  if k in seen: continue
  seen.add(k); r['id']=len(ded)+1; ded.append(r)
 ded=ded[:TARGET]
 (OUT_DIR/'community_posts_300.json').write_text(json.dumps(ded,ensure_ascii=False,indent=2),encoding='utf-8')
 (OUT_DIR/'community_posts_300.sql').write_text(make_sql(ded),encoding='utf-8')
 print('TOTAL',len(ded)); print(OUT_DIR/'community_posts_300.json')
main()
