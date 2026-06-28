LOU — Multi-page website

Files:
- index.html: lean homepage
- menu.html: full menu and category filters
- merch.html: full merch collection and filters
- style.css: one shared stylesheet for every page
- script.js: shared interactions, filters, cart demo and page transition
- assets/: existing LOU photos and product images

Keep every file and the assets folder together.
Open index.html in a browser to start.


Update: merch product photos and menu item images have been enhanced for better clarity and sharper display.

PHONE PERFORMANCE UPDATE
------------------------
- Responsive WebP images (320 / 640 / 960 px) replace heavy PNG/JPG assets.
- Images below the fold use loading="lazy" and decoding="async".
- Hero image keeps high fetch priority.
- Mobile disables cursor glow, parallax, continuous ticker animations and expensive blur effects.
- Navigation, filters, card expansion, cart counter, toast messages and page transitions are preserved.
- CSS content-visibility is used on supported mobile browsers to avoid rendering distant sections too early.
