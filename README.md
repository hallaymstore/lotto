# Omad Studio

Jonli efir va YouTube Shorts uchun tasodifiy tanlov barabani.

## Ishga tushirish

`public/index.html` faylini oching yoki `python -m http.server 8080 --directory public` buyrug‘i bilan mahalliy server ishga tushiring. Brauzerda `http://localhost:8080` sahifasini oching.

## Efirga tayyorlash

- Har qatorga bittadan ism yoki variant kiriting. TXT va CSV importi ham bor. Noyob variantlardan dastlabki 200 tasi qatnashadi.
- Efir uchun 16:9 yoki Shorts uchun 9:16 kadrni tanlang. Kanal nomi, natija ostidagi chaqiriq, fon va baraban rangini sozlang.
- **OBS uchun sahna oynasi** tugmasini bosing. OBS’da o‘sha oynani **Window Capture** bilan oling. Tovush boshqaruv oynasidan chiqadi. Ikkala oynani bir xil brauzer profilida oching. Shaffof fon kompozitsiyasi uchun yashil fonni OBS Chroma Key bilan ishlating.
- Boshqaruv oynasida **Aylantirish** yoki **Space** tugmasini bosing. **G‘olibni chiqarish** tanlansa, g‘olib navbatdagi aylanishdan chiqariladi. Ro‘yxatni tiklash tugmasi chiqarilgan variantlarni qaytaradi.
- Ismlar, sozlamalar va g‘oliblar tarixi shu brauzer profilida saqlanadi. Tarixni CSV formatida yuklash mumkin.

## Render

Static Site, publish directory `public`. Ilova yig‘ish bosqichi va muhit o‘zgaruvchilarini talab qilmaydi.
