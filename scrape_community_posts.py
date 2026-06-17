import gzip
import hashlib
import html
import json
import random
import re
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from xml.etree import ElementTree as ET

ROOT = Path('/home/user/KindnessMap/kindness-map')
OUT_DIR = ROOT / 'backend' / 'data'
OUT_DIR.mkdir(parents=True, exist_ok=True)
TARGET_TOTAL = 300
TARGETS = {'dantri': 120, 'baochinhphu': 100, 'redcross': 80}
USER_AGENT = 'KindnessMapDataSeeder/1.0 (+https://kindnessmap-vn.vercel.app; educational demo metadata seeding)'

FALLBACK_IMAGES = {
    'Cộng đồng': 'https://images.unsplash.com/photo-1593113598432-846f29edce7b?auto=format&fit=crop&w=800&q=80',
    'Tình nguyện': 'https://images.unsplash.com/photo-1593113598432-846f29edce7b?auto=format&fit=crop&w=800&q=80',
    'Giáo dục': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    'Hiến máu': 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80',
    'Trồng cây': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    'Môi trường': 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
    'Người cao tuổi': 'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80',
}

LOCATIONS = {
    'Hà Nội': (21.0285, 105.8542), 'TP. Hồ Chí Minh': (10.7769, 106.7009), 'Hồ Chí Minh': (10.7769, 106.7009),
    'Đà Nẵng': (16.0544, 108.2022), 'Hải Phòng': (20.8449, 106.6881), 'Cần Thơ': (10.0452, 105.7469),
    'An Giang': (10.5216, 105.1259), 'Bà Rịa': (10.5417, 107.2431), 'Vũng Tàu': (10.4114, 107.1362),
    'Bắc Giang': (21.2731, 106.1946), 'Bắc Kạn': (22.1470, 105.8348), 'Bạc Liêu': (9.2940, 105.7216),
    'Bắc Ninh': (21.1861, 106.0763), 'Bến Tre': (10.2415, 106.3759), 'Bình Định': (13.7820, 109.2197),
    'Bình Dương': (11.3254, 106.4770), 'Bình Phước': (11.7512, 106.7235), 'Bình Thuận': (10.9333, 108.1000),
    'Cà Mau': (9.1768, 105.1524), 'Cao Bằng': (22.6666, 106.2639), 'Đắk Lắk': (12.6667, 108.0500),
    'Đắk Nông': (12.2646, 107.6098), 'Điện Biên': (21.3860, 103.0230), 'Đồng Nai': (10.9574, 106.8427),
    'Đồng Tháp': (10.4938, 105.6882), 'Gia Lai': (13.9833, 108.0000), 'Hà Giang': (22.8233, 104.9836),
    'Hà Nam': (20.5835, 105.9227), 'Hà Tĩnh': (18.3428, 105.9057), 'Hải Dương': (20.9373, 106.3146),
    'Hậu Giang': (9.7845, 105.4701), 'Hòa Bình': (20.6861, 105.3131), 'Hưng Yên': (20.6464, 106.0511),
    'Khánh Hòa': (12.2388, 109.1967), 'Kiên Giang': (10.0125, 105.0809), 'Kon Tum': (14.3497, 108.0005),
    'Lai Châu': (22.3964, 103.4582), 'Lâm Đồng': (11.5753, 108.1429), 'Lạng Sơn': (21.8537, 106.7615),
    'Lào Cai': (22.4809, 103.9755), 'Long An': (10.6956, 106.2431), 'Nam Định': (20.4388, 106.1621),
    'Nghệ An': (19.2342, 104.9200), 'Ninh Bình': (20.2506, 105.9745), 'Ninh Thuận': (11.6739, 108.8629),
    'Phú Thọ': (21.2684, 105.2046), 'Phú Yên': (13.0882, 109.0929), 'Quảng Bình': (17.6103, 106.3487),
    'Quảng Nam': (15.5394, 108.0191), 'Quảng Ngãi': (15.1214, 108.8044), 'Quảng Ninh': (21.0064, 107.2925),
    'Quảng Trị': (16.7403, 107.1855), 'Sóc Trăng': (9.6037, 105.9739), 'Sơn La': (21.3270, 103.9141),
    'Tây Ninh': (11.3352, 106.1099), 'Thái Bình': (20.4463, 106.3366), 'Thái Nguyên': (21.5672, 105.8252),
    'Thanh Hóa': (19.8067, 105.7852), 'Thừa Thiên Huế': (16.4637, 107.5909), 'Huế': (16.4637, 107.5909),
    'Tiền Giang': (10.4493, 106.3420), 'Trà Vinh': (9.9347, 106.3453), 'Tuyên Quang': (21.8236, 105.2142),
    'Vĩnh Long': (10.2537, 105.9722), 'Vĩnh Phúc': (21.3609, 105.5474), 'Yên Bái': (21.7168, 104.8986),
}
LOCATION_ITEMS = sorted(LOCATIONS.items(), key=lambda x: -len(x[0]))

KEYWORDS_ALLOWED = re.compile(r'(nhân ái|thiện nguyện|tình nguyện|cộng đồng|hỗ trợ|ủng hộ|trao|tặng|quỹ|người nghèo|khó khăn|nhân đạo|chữ thập đỏ|hiến máu|hành trình đỏ|mái ấm|nhà nhân ái|trường|học sinh|trẻ em|người cao tuổi|liệt sĩ|người có công|môi trường|trồng|rừng|xanh|bão|lũ|thiên tai|hạn hán|sinh kế)', re.I)


def fetch(url, timeout=30):
    req = Request(url, headers={'User-Agent': USER_AGENT, 'Accept-Encoding': 'gzip, deflate'})
    with urlopen(req, timeout=timeout) as r:
        raw = r.read()
        enc = (r.headers.get('Content-Encoding') or '').lower()
        if enc == 'gzip': raw = gzip.decompress(raw)
        return raw.decode('utf-8', 'ignore')


def strip_tags(s):
    s = re.sub(r'<script[\s\S]*?</script>', ' ', s, flags=re.I)
    s = re.sub(r'<style[\s\S]*?</style>', ' ', s, flags=re.I)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = html.unescape(s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def clean_title(s):
    s = strip_tags(s or '')
    s = re.sub(r'^Mã số\s*\d+\s*:\s*', '', s, flags=re.I)
    s = re.sub(r'^HỒ SƠ MÃ SỐ\s*\d+\s*:\s*', '', s, flags=re.I)
    return s[:295]


def meta(html_text, key):
    patterns = [
        r'<meta[^>]+(?:property|name)=["\']' + re.escape(key) + r'["\'][^>]+content=["\']([^"\']+)',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + re.escape(key) + r'["\']',
    ]
    for p in patterns:
        m = re.search(p, html_text, flags=re.I)
        if m: return html.unescape(m.group(1).strip())
    return ''


def canonical(html_text, fallback):
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)', html_text, re.I)
    return html.unescape(m.group(1).strip()) if m else fallback


def infer_category(text):
    t = (text or '').lower()
    if any(k in t for k in ['hiến máu', 'máu', 'hành trình đỏ', 'giọt hồng']): return 'Hiến máu'
    if any(k in t for k in ['trồng cây', 'trồng rừng', 'rừng ngập mặn']): return 'Trồng cây'
    if any(k in t for k in ['môi trường', 'khí hậu', 'hạn hán', 'xâm nhập mặn', 'rác', 'xanh', 'hệ sinh thái', 'thiên tai']): return 'Môi trường'
    if any(k in t for k in ['học sinh', 'trường', 'điểm trường', 'lớp học', 'giáo dục', 'trẻ em']): return 'Giáo dục'
    if any(k in t for k in ['người cao tuổi', 'cụ già', 'người già']): return 'Người cao tuổi'
    if any(k in t for k in ['tình nguyện', 'thiện nguyện', 'chữ thập đỏ', 'nhân đạo', 'hỗ trợ', 'ủng hộ', 'trao tặng']): return 'Tình nguyện'
    return 'Cộng đồng'


def infer_location(text, url=''):
    hay = html.unescape((text or '') + ' ' + (url or ''))
    for name, (lat, lng) in LOCATION_ITEMS:
        if re.search(r'(?<![\wÀ-ỹ])' + re.escape(name) + r'(?![\wÀ-ỹ])', hay, flags=re.I):
            return name, lat, lng
    # deterministic fallback inside Vietnam
    names = list(LOCATIONS.keys())
    h = int(hashlib.sha1((text + url).encode('utf-8', 'ignore')).hexdigest(), 16)
    name = names[h % len(names)]
    lat, lng = LOCATIONS[name]
    # slight deterministic jitter
    rnd = random.Random(h)
    return name, round(lat + rnd.uniform(-0.035, 0.035), 6), round(lng + rnd.uniform(-0.035, 0.035), 6)


def make_record(source, source_name, url, title, excerpt, image, published_at=''):
    title = clean_title(title)
    excerpt = strip_tags(excerpt or '')
    excerpt = re.sub(r'^\([^)]*\)\s*-\s*', '', excerpt).strip()
    if not title or len(title) < 12: return None
    text = f'{title}. {excerpt}'
    if not KEYWORDS_ALLOWED.search(text) and source != 'dantri':
        return None
    category = infer_category(text)
    loc, lat, lng = infer_location(text, url)
    if not image:
        image = FALLBACK_IMAGES.get(category, FALLBACK_IMAGES['Cộng đồng'])
    # Short transformed summary with attribution, not full article copy.
    summary = excerpt[:420].rstrip()
    if summary and not summary.endswith(('.', '!', '?', '…')): summary += '...'
    description = f'{summary}\n\nNguồn: {source_name}. Xem bài gốc: {url}' if summary else f'Bài viết được tổng hợp từ nguồn {source_name}. Xem bài gốc: {url}'
    return {
        'title': title,
        'description': description,
        'imageUrl': image,
        'category': category,
        'latitude': round(float(lat), 6),
        'longitude': round(float(lng), 6),
        'locationName': loc,
        'sourceName': source_name,
        'sourceUrl': url,
        'publishedAt': published_at,
    }


def scrape_article_meta(url, source, source_name):
    try:
        txt = fetch(url)
        title = meta(txt, 'og:title') or re.search(r'<title[^>]*>([\s\S]*?)</title>', txt, re.I).group(1)
        desc = meta(txt, 'description') or meta(txt, 'og:description')
        image = meta(txt, 'og:image')
        can = canonical(txt, url)
        pub = meta(txt, 'article:published_time') or meta(txt, 'pubdate')
        return make_record(source, source_name, can, title, desc, image, pub)
    except Exception as e:
        print('  skip article', url, e)
        return None


def dantri_urls(limit):
    urls=[]
    index = fetch('https://dantri.com.vn/sitemaps/articles.xml')
    months = re.findall(r'https://dantri\.com\.vn/sitemaps/Article-\d{4}-\d{2}-01\.xml', index)
    seen=set()
    for sm in months[:36]:
        if len(urls) >= limit*2: break
        try:
            txt = fetch(sm)
        except Exception as e:
            print('dantri sitemap skip', sm, e); continue
        for u in re.findall(r'<loc>(https://dantri\.com\.vn/tam-long-nhan-ai/[^<]+)</loc>', txt):
            if u not in seen and not re.search(r'/trang-\d+', u):
                seen.add(u); urls.append(u)
                if len(urls) >= limit*2: break
        time.sleep(0.1)
    return urls


def collect_dantri(limit):
    out=[]
    urls=dantri_urls(limit)
    print('Dantri candidate urls', len(urls))
    for i,u in enumerate(urls):
        if len(out)>=limit: break
        rec=scrape_article_meta(u, 'dantri', 'Dân trí - Tấm lòng nhân ái')
        if rec: out.append(rec)
        print('  dantri', len(out), '/', limit)
        time.sleep(1.05)  # robots crawl-delay 1 for bots
    return out


def collect_baochinhphu(limit):
    page_urls=['https://baochinhphu.vn/xa-hoi/doi-song.htm'] + [f'https://baochinhphu.vn/xa-hoi/doi-song/trang-{i}.htm' for i in range(2, 40)]
    article_urls=[]; seen=set()
    for purl in page_urls:
        if len(article_urls)>=limit*3: break
        try:
            txt=fetch(purl)
        except Exception as e:
            print('bcp page skip', purl, e); continue
        # article URL pattern used by VGP
        for u in re.findall(r'https://baochinhphu\.vn/[^"\s<>]+-102\d+\.htm', txt):
            u=html.unescape(u)
            if u not in seen:
                seen.add(u); article_urls.append(u)
        time.sleep(0.1)
    print('BCP candidate urls', len(article_urls))
    out=[]
    for u in article_urls:
        if len(out)>=limit: break
        rec=scrape_article_meta(u, 'baochinhphu', 'Báo Chính phủ - Đời sống')
        if rec: out.append(rec)
        print('  bcp', len(out), '/', limit)
        time.sleep(0.12)
    return out


def collect_redcross(limit):
    out=[]
    # Use one/few WordPress REST responses instead of crawling many pages.
    for page in range(1, 4):
        if len(out)>=limit: break
        url=f'https://redcross.org.vn/wp-json/wp/v2/posts?per_page=100&page={page}&_embed=1'
        try:
            data=json.loads(fetch(url))
        except Exception as e:
            print('redcross api skip', e); break
        for item in data:
            if len(out)>=limit: break
            title=item.get('title',{}).get('rendered','')
            excerpt=item.get('excerpt',{}).get('rendered','')
            link=item.get('link','')
            media=''
            emb=item.get('_embedded',{})
            if emb.get('wp:featuredmedia'):
                media=emb['wp:featuredmedia'][0].get('source_url','')
            rec=make_record('redcross','Hội Chữ thập đỏ Việt Nam',link,title,excerpt,media,item.get('date',''))
            if rec: out.append(rec)
        time.sleep(1.0)  # keep it gentle; robots has high delay, API use kept minimal
    print('Redcross records', len(out))
    return out


def sql_quote(s):
    return "'" + str(s).replace('\\', '\\\\').replace("'", "''") + "'"


def generate_sql(records):
    lines=[]
    lines.append('-- KindnessMap community posts seed generated from public metadata/excerpts.')
    lines.append('-- Uses short summaries, image URLs and source attribution; no full article content is copied.')
    lines.append('-- Run after Users table has at least one admin/user. Duplicates are skipped by title.')
    lines.append('')
    for idx,r in enumerate(records):
        featured = 1 if idx < 12 else 0
        vals=[r['title'], r['description'], r['imageUrl'], r['category'], r['latitude'], r['longitude'], r['locationName'], 'Approved', featured, 1]
        sql = (
            'INSERT INTO Posts (title, description, imageUrl, category, latitude, longitude, locationName, status, isFeatured, pointsAwarded, userId)\n'
            'SELECT {title}, {desc}, {img}, {cat}, {lat}, {lng}, {loc}, {status}, {feat}, {points}, COALESCE((SELECT id FROM Users WHERE role = \'admin\' ORDER BY id LIMIT 1), (SELECT id FROM Users ORDER BY id LIMIT 1))\n'
            'WHERE NOT EXISTS (SELECT 1 FROM Posts WHERE title = {title});'
        ).format(
            title=sql_quote(vals[0]), desc=sql_quote(vals[1]), img=sql_quote(vals[2]), cat=sql_quote(vals[3]),
            lat=vals[4], lng=vals[5], loc=sql_quote(vals[6]), status=sql_quote(vals[7]), feat=featured, points=1
        )
        lines.append(sql)
    return '\n'.join(lines)+'\n'


def main():
    all_records=[]
    all_records += collect_dantri(TARGETS['dantri'])
    all_records += collect_baochinhphu(TARGETS['baochinhphu'])
    all_records += collect_redcross(TARGETS['redcross'])
    # de-dup by source URL/title
    dedup=[]; seen=set()
    for r in all_records:
        key=(r['sourceUrl'] or r['title']).lower()
        if key in seen: continue
        seen.add(key); dedup.append(r)
    # If less than 300, top up from additional Dân trí URLs gently disabled here unless needed.
    dedup=dedup[:TARGET_TOTAL]
    for i,r in enumerate(dedup,1): r['id']=i
    json_path=OUT_DIR/'community_posts_300.json'
    sql_path=OUT_DIR/'community_posts_300.sql'
    json_path.write_text(json.dumps(dedup, ensure_ascii=False, indent=2), encoding='utf-8')
    sql_path.write_text(generate_sql(dedup), encoding='utf-8')
    print('Wrote', len(dedup), 'records')
    print(json_path)
    print(sql_path)

if __name__ == '__main__':
    main()
