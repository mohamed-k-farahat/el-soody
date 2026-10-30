/* =========================================================
   بن السعودي, El Soody Coffee: site content (Arabic + English)
   Edit this file to change text, news, prices or shop details.
   ========================================================= */

/* ---- Shop details: fill these in and they appear automatically on the Shop page.
        Leave a field empty ('') to hide it. ---- */
const SHOP = {
  phone: '',          // e.g. '+20 100 000 0000'
  whatsapp: '',       // digits only with country code, e.g. '201000000000'
  instagram: '',      // full URL
  facebook: '',       // full URL
  tiktok: '',         // full URL
  mapsUrl: '',        // Google Maps link
  address: { ar: '', en: '' },
  hours:   { ar: '', en: '' },
};

/* ---- News ticker: one line per item, newest first ---- */
const NEWS = {
  ar: [
    'جديد على الموقع: كتاب حكايات البن، ١٢ حكاية من ١٢ نوع',
    'بنحمّص طازة كل يوم.. وريحة البن بتوصلك قبل ما توصل',
    'الطحن على ذوقك: ناعم للكنكة، وسط للفلتر، خشن للفرنش برس',
    'قهوة فرنساوي بسبع اختيارات من البندق للوتس',
    'زوّد التحويجة على أي بن: ١٠ أو ٢٠ أو ٣٠ جنيه',
    'الملوكي يبدأ من ٩٠ جنيه للتُمن',
    'المتجر الأونلاين قريبًا.. استنّونا',
  ],
  en: [
    'New on the site: the Bean Stories book, 12 tales from 12 coffees',
    'Roasted fresh every day. You’ll smell it before you see us',
    'Ground your way: fine for the kanaka, medium for filter, coarse for French press',
    'French coffee in seven choices, from hazelnut to Lotus',
    'Add our spice blend to any coffee for 10, 20 or 30 EGP',
    'Malaki starts at 90 EGP for an eighth',
    'Our online store is coming soon. Stay tuned',
  ],
};

/* ---- UI strings ---- */
const I18N = {
  ar: {
    'meta.title.home': 'بن السعودي | الأفضل .. الأنقى .. الأعلى جودة',
    'meta.title.stories': 'حكايات البن | بن السعودي',
    'meta.title.menu': 'المنيو | بن السعودي',
    'meta.title.shop': 'المحل | بن السعودي',
    'meta.desc': 'بن السعودي: حبوب مختارة من الحبشة والبرازيل وكولومبيا والهند، محمّصة طازة ومطحونة على ذوقك.',
    brand: 'بن السعودي',
    'nav.home': 'الرئيسية', 'nav.stories': 'حكايات البن', 'nav.menu': 'المنيو', 'nav.shop': 'المحل',
    'nav.label': 'القائمة',
    'lang.switch': 'Switch to English', 'lang.label': 'EN',
    'ticker.label': 'أخبار السعودي',

    'hero.title1': 'قهوة',
    'hero.title2': 'ليها حكاية',
    'hero.tagline': 'الأفضل .. الأنقى .. الأعلى جودة',
    'hero.lead': 'من هضاب الحبشة لجبال كولومبيا، بنختار كل حبة بإيدينا، ونحمّصها طازة، ونطحنها على ذوقك: فاتح أو وسط أو غامق، سادة أو محوّج.',
    'hero.cta1': 'افتح كتاب الحكايات',
    'hero.cta2': 'شوف المنيو',

    'story.eyebrow': 'حكايتنا',
    'story.title': 'بن طازة، على ذوقك',
    'story.p1': 'عندنا أكتر من ١٢ نوع بن، منهم الحبشي والبرازيلي والكولومبي والهندي، والملوكي والسعودي والاسبيشيال.',
    'story.p2': 'اختار البن سادة، أو محوّج بتحويجتنا، أو قهوة فرنساوي بسبع نكهات. وبنطحنهولك في المحل على حسب الكنكة أو الماكينة اللي عندك.',
    'story.stat1': 'نوع بن', 'story.stat2': 'درجات تحميص', 'story.stat3': 'اختيارات فرنساوي',

    'explore.eyebrow': 'اكتشف',
    'explore.title': 'كل ركن في السعودي ليه حكاية',
    'explore.stories.title': 'كتاب حكايات البن',
    'explore.stories.text': '١٢ حبة و١٢ حكاية. قلّب الصفحات واعرف كل بن جاي منين.',
    'explore.menu.title': 'المنيو',
    'explore.menu.text': 'كل الأنواع والأسعار: سادة، ومحوّج، وفرنساوي.',
    'explore.shop.title': 'المحل',
    'explore.shop.text': 'صور وفيديو من جوّه المحل، وإزاي توصلنا.',
    'explore.go': 'يلا بينا',

    'roast.light': 'فاتح', 'roast.medium': 'وسط', 'roast.dark': 'غامق',

    'stories.eyebrow': 'حكايات البن',
    'stories.title': 'كتاب حكايات البن',
    'stories.lead': 'قلّب الصفحات.. كل حبة عندنا جاية من بلد بعيد وشايلة معاها حكاية.',

    'book.coverTitle': 'حكايات البن',
    'book.coverSub': '١٢ حكاية من بن السعودي',
    'book.coverHint': 'اضغط عشان تفتح الكتاب',
    'book.introTitle': 'قبل ما تبدأ',
    'book.intro1': 'الكتاب ده مش كتالوج.. ده رحلة. كل حبة بن في المحل عندنا عدّت بحكاية طويلة قبل ما توصل لفنجانك.',
    'book.intro2': 'في كل فتحة هتلاقي الحبة ونكهتها ودرجات تحميصها، وجنبها حكايتها.',
    'book.intro3': 'اعمل لنفسك فنجان.. وابدأ.',
    'book.tocTitle': 'الفهرس',
    'book.notes': 'النكهة',
    'book.roast': 'التحميص',
    'book.noRoast': 'حسب النوع',
    'book.storyLabel': 'الحكاية',
    'book.tip': 'نصيحة السعودي',
    'book.endTitle': 'النهاية..',
    'book.endText': 'والبداية الحقيقية في فنجانك. تعالى دوق الحكايات دي بنفسك.',
    'book.endCta': 'شوف المنيو',
    'book.prev': 'الصفحة اللي فاتت',
    'book.next': 'الصفحة الجاية',
    'book.hint': 'اضغط على طرف الصفحة، أو اسحب، أو استخدم الأسهم',

    'menu.eyebrow': 'المنيو',
    'menu.title': 'اختار البن.. واحنا نطحنه',
    'menu.lead': 'الأسعار بالجنيه المصري للتُمن (١٢٥ جم) والربع (٢٥٠ جم) والكيلو.',
    'menu.fine': 'الأسعار قابلة للتغيير، اسأل في المحل على أحدث الأسعار.',
    'menu.tab.plain': 'البن السادة', 'menu.tab.spiced': 'البن المحوّج', 'menu.tab.french': 'قهوة فرنساوي',
    'menu.col.eighth': '1/8', 'menu.col.quarter': '1/4', 'menu.col.kilo': '1 ك',
    'menu.note.spice': 'إضافة تحويجة (10، 20، 30)',
    'menu.note.french': '( كراميل، توت، كلاسيك، شوكولاتة، لوتس )',

    'shop.eyebrow': 'جوّه المحل',
    'shop.title': 'خشب، نور دافي، وريحة بن',
    'shop.lead': 'تعالى اقعد في التراس، أو خد قهوتك معاك.. المكان معمول عشان تحب تيجي تاني.',
    'film.eyebrow': 'لفّة سريعة',
    'film.title': 'شوف المكان قبل ما تيجي',
    'film.lead': 'دقيقة ونص من جوّه بن السعودي، من الواجهة المنوّرة لحد الكاونتر.',

    'soon.eyebrow': 'قريبًا',
    'soon.title': 'المتجر الأونلاين جاي في الطريق',
    'soon.lead': 'قريب هتقدر تطلب بنّك المفضّل وتختار درجة التحميص والطحن، ويوصلك لحد باب البيت.',

    'player.play': 'تشغيل', 'player.pause': 'إيقاف مؤقت', 'player.mute': 'كتم الصوت', 'player.unmute': 'تشغيل الصوت',
    'player.full': 'ملء الشاشة', 'player.seek': 'التقديم في الفيديو',

    'visit.eyebrow': 'زورنا',
    'visit.title': 'الفنجان الجاي.. عندنا',
    'visit.lead': 'هتعرف المحل من بعيد: الواجهة الخشب، والنور الدافي، وريحة البن اللي بتسبقك.',
    'visit.address': 'العنوان', 'visit.hours': 'مواعيد العمل', 'visit.phone': 'تليفون', 'visit.map': 'افتح على الخريطة',

    'alt.dispensers': 'صفايح البن على حيطة المحل',
    'alt.sign': 'لوجو بن السعودي المنوّر',
    'alt.street': 'واجهة بن السعودي بالليل',
    'alt.terrace': 'تراس المحل بالكراسي والإضاءة',
    'alt.bags': 'أكياس البن المعبّأة',
    'alt.shelves': 'رفوف المحل المنوّرة',
    'alt.facade': 'واجهة المبنى بستاير النور',
    'alt.nameLights': 'اسم بن السعودي بين خيوط النور',
    'alt.interior': 'جوّه المحل وسقف حبوب البن',
    'alt.signLights': 'لوجو المحل المنوّر من بره',
    'alt.icons': 'لوحات أدوات القهوة المنوّرة',
  },

  en: {
    'meta.title.home': 'El Soody Coffee | The finest. The purest. The highest quality.',
    'meta.title.stories': 'Bean Stories | El Soody Coffee',
    'meta.title.menu': 'Menu | El Soody Coffee',
    'meta.title.shop': 'The Shop | El Soody Coffee',
    'meta.desc': 'El Soody Coffee: beans from Ethiopia, Brazil, Colombia and India, roasted fresh and ground to order.',
    brand: 'El Soody Coffee',
    'nav.home': 'Home', 'nav.stories': 'Bean Stories', 'nav.menu': 'Menu', 'nav.shop': 'The Shop',
    'nav.label': 'Menu',
    'lang.switch': 'التحويل للعربية', 'lang.label': 'ع',
    'ticker.label': 'Soody News',

    'hero.title1': 'Coffee with',
    'hero.title2': 'a story.',
    'hero.tagline': 'The finest. The purest. The highest quality.',
    'hero.lead': 'From the Ethiopian highlands to the Colombian Andes, we pick every bean by hand, roast it fresh and grind it your way: light, medium or dark, plain or spiced.',
    'hero.cta1': 'Open the story book',
    'hero.cta2': 'See the menu',

    'story.eyebrow': 'Our Story',
    'story.title': 'Fresh coffee, your way',
    'story.p1': 'We carry more than 12 coffees, including Ethiopian, Brazilian, Colombian and Indian, plus Malaki, Soody and Special.',
    'story.p2': 'Choose plain, spiced with our house blend, or French coffee in seven flavors. We grind it in the shop to suit your kanaka or machine.',
    'story.stat1': 'Coffees & blends', 'story.stat2': 'Roast levels', 'story.stat3': 'French coffee choices',

    'explore.eyebrow': 'Explore',
    'explore.title': 'Every corner of El Soody has a story',
    'explore.stories.title': 'The Bean Stories Book',
    'explore.stories.text': '12 beans, 12 tales. Turn the pages and find out where each coffee comes from.',
    'explore.menu.title': 'The Menu',
    'explore.menu.text': 'Every coffee and every price: plain, spiced and French.',
    'explore.shop.title': 'The Shop',
    'explore.shop.text': 'Photos and video from inside, and how to find us.',
    'explore.go': 'Let’s go',

    'roast.light': 'Light', 'roast.medium': 'Medium', 'roast.dark': 'Dark',

    'stories.eyebrow': 'Bean Stories',
    'stories.title': 'The Bean Stories Book',
    'stories.lead': 'Turn the pages. Every bean we sell comes from a faraway land and carries a story with it.',

    'book.coverTitle': 'Bean Stories',
    'book.coverSub': '12 tales from El Soody',
    'book.coverHint': 'Tap to open the book',
    'book.introTitle': 'Before you begin',
    'book.intro1': 'This isn’t a catalogue. It’s a journey. Every bean in our shop travelled a long road before it reached your cup.',
    'book.intro2': 'On each spread you’ll find the bean, its flavor and its roasts, and beside it, its story.',
    'book.intro3': 'Make yourself a cup, and begin.',
    'book.tocTitle': 'Contents',
    'book.notes': 'Flavor',
    'book.roast': 'Roast',
    'book.noRoast': 'Varies',
    'book.storyLabel': 'The story',
    'book.tip': 'El Soody tip',
    'book.endTitle': 'The end…',
    'book.endText': 'and the real beginning is in your cup. Come and taste these stories for yourself.',
    'book.endCta': 'See the menu',
    'book.prev': 'Previous page',
    'book.next': 'Next page',
    'book.hint': 'Tap a page edge, swipe, or use the arrow keys',

    'menu.eyebrow': 'Menu',
    'menu.title': 'Pick your beans. We’ll grind them.',
    'menu.lead': 'Prices in Egyptian pounds for an eighth (125 g), a quarter (250 g) and a full kilo.',
    'menu.fine': 'Prices may change. Ask in store for the latest.',
    'menu.tab.plain': 'Plain Coffee', 'menu.tab.spiced': 'Spiced Coffee', 'menu.tab.french': 'French Coffee',
    'menu.col.eighth': '1/8', 'menu.col.quarter': '1/4', 'menu.col.kilo': '1 kg',
    'menu.note.spice': 'Add spice blend (10, 20, 30)',
    'menu.note.french': '( Caramel, Berry, Classic, Chocolate, Lotus )',

    'shop.eyebrow': 'Inside the shop',
    'shop.title': 'Wood, warm light & the smell of coffee',
    'shop.lead': 'Take a seat on the terrace or grab your coffee to go. The place is made to make you come back.',
    'film.eyebrow': 'A quick tour',
    'film.title': 'See the place before you visit',
    'film.lead': 'Ninety seconds inside El Soody, from the glowing storefront to the counter.',

    'soon.eyebrow': 'Coming soon',
    'soon.title': 'Our online store is on its way',
    'soon.lead': 'Soon you’ll be able to order your favorite beans, choose your roast and grind, and have them delivered to your door.',

    'player.play': 'Play', 'player.pause': 'Pause', 'player.mute': 'Mute', 'player.unmute': 'Unmute',
    'player.full': 'Full screen', 'player.seek': 'Seek',

    'visit.eyebrow': 'Visit us',
    'visit.title': 'Your next cup is here',
    'visit.lead': 'You’ll spot us from down the street: the wooden façade, the warm light, and the smell of coffee that arrives before you do.',
    'visit.address': 'Address', 'visit.hours': 'Opening hours', 'visit.phone': 'Phone', 'visit.map': 'Open in Maps',

    'alt.dispensers': 'Coffee dispensers lining the shop wall',
    'alt.sign': 'The illuminated El Soody logo sign',
    'alt.street': 'El Soody storefront at night',
    'alt.terrace': 'The terrace seating under warm lights',
    'alt.bags': 'Packed bags of coffee',
    'alt.shelves': 'Backlit shelves inside the shop',
    'alt.facade': 'The building façade draped in string lights',
    'alt.nameLights': 'The El Soody name among strings of light',
    'alt.interior': 'Inside the shop under the coffee bean ceiling',
    'alt.signLights': 'The illuminated logo outside',
    'alt.icons': 'Backlit coffee tool signs',
  },
};

/* ---- The beans and their stories (shown in the book) ----
   roasts: which roast levels are available (light / medium / dark)
   color : roast color used for the bean illustration                     */
const BEANS = [
  {
    id: 'habashi', roasts: ['light', 'medium', 'dark'], color: '#9A5E2C',
    ar: {
      name: 'حبشي', origin: 'إثيوبيا، هضاب كافا',
      notes: 'ياسمين، توت بري، لمسة ليمون',
      story: [
        'يُحكى أنه منذ أكثر من ألف عام، في هضاب كافا بالحبشة، لاحظ راعٍ شاب اسمه كالدي أن ماعزه لم تنم ليلتها، وظلّت تقفز وترقص بعد أن أكلت ثمارًا حمراء من شجيرة غريبة.',
        'حمل كالدي الثمار إلى راهب الدير، فألقاها في النار مستنكرًا.. لكن الرائحة التي تصاعدت كانت أجمل من أن تُنسى. هكذا، كما تقول الأسطورة، وُلدت القهوة. وحبة الحبشي اللي في إيدك النهارده هي حفيدة الشجيرة دي بالظبط.',
      ],
      pair: 'جرّبه فاتح في الكنكة أو الـV60 عشان ريحة الياسمين تبان.',
    },
    en: {
      name: 'Ethiopian (Habashi)', origin: 'Ethiopia, Kaffa Highlands',
      notes: 'Jasmine, wild berry, a twist of lemon',
      story: [
        'Over a thousand years ago, in the Kaffa highlands of Ethiopia, a young goatherd named Kaldi noticed his goats wouldn’t sleep. They were leaping and dancing after nibbling red cherries from a strange shrub.',
        'He carried the cherries to a monk, who threw them into the fire in disapproval. But the aroma that rose was impossible to forget. That, the legend says, is how coffee was born. The Habashi bean in your hand is a direct descendant of that wild shrub.',
      ],
      pair: 'Try it as a light roast in a V60 or kanaka to let the jasmine sing.',
    },
  },
  {
    id: 'brazili', roasts: ['light', 'medium', 'dark'], color: '#6E4022',
    ar: {
      name: 'برازيلي', origin: 'البرازيل، ميناس جيرايس',
      notes: 'شوكولاتة، بندق، كراميل',
      story: [
        'في عام ١٧٢٧ أُرسل ضابط برتغالي اسمه فرانسيسكو دي ميلو باليتا إلى غويانا الفرنسية، حيث كان الفرنسيون يحرسون أشجار البن ويمنعون خروج بذرة واحدة منها.',
        'تقول الحكاية إن زوجة الحاكم أهدته في وداعه باقة ورد.. خبّأت بين أزهارها بذور البن. ومن تلك الباقة الصغيرة صارت البرازيل أكبر منتج للقهوة في العالم، وصار طعمها، شوكولاتة وبندق، أساس فنجان ملايين الناس كل صباح.',
      ],
      pair: 'حلو جدًا غامق ومحوّج، أو كأساس لأي خلطة.',
    },
    en: {
      name: 'Brazilian', origin: 'Brazil, Minas Gerais',
      notes: 'Chocolate, hazelnut, caramel',
      story: [
        'In 1727, a Portuguese officer named Francisco de Melo Palheta was sent to French Guiana, where coffee trees were guarded so closely that not a single seed could leave.',
        'Legend has it the governor’s wife handed him a farewell bouquet with coffee seeds hidden among the flowers. From that small bouquet, Brazil grew into the largest coffee producer on earth, and its chocolatey, nutty cup became the morning ritual of millions.',
      ],
      pair: 'Lovely dark and spiced, or as the backbone of any blend.',
    },
  },
  {
    id: 'colombi', roasts: ['medium', 'dark'], color: '#5F371B',
    ar: {
      name: 'كولومبي فاخر', origin: 'كولومبيا، جبال الأنديز',
      notes: 'كراميل، تفاح أحمر، حموضة لطيفة',
      story: [
        'في أوائل القرن التاسع عشر، كان الأب فرانسيسكو روميرو في قرية سالازار دي لاس بالماس يفرض على من يأتيه معترفًا كفّارة غريبة: بدل الصلوات.. ازرع شجيرات بن.',
        'انتشرت الشجيرات على منحدرات الأنديز الشاهقة، حيث ما زالت الثمار تُقطف باليد واحدة واحدة، وتنزل الجبل على ظهور البغال. ولقب «فاخر» (سوبريمو) يُعطى لأكبر الحبات حجمًا وأكثرها توازنًا في المحصول.',
      ],
      pair: 'يطلع أحلى في الإسبريسو والفرنش برس.',
    },
    en: {
      name: 'Colombian Supremo', origin: 'Colombia, the Andes',
      notes: 'Caramel, red apple, gentle brightness',
      story: [
        'In the early 1800s, Father Francisco Romero of Salazar de las Palmas gave his parishioners an unusual penance: instead of prayers, plant coffee trees.',
        'The trees spread across the steep slopes of the Andes, where cherries are still picked by hand one by one and carried down the mountain by mule. “Supremo” is the title given to the largest, most balanced beans of the harvest.',
      ],
      pair: 'Shines as espresso or in a French press.',
    },
  },
  {
    id: 'hindi', roasts: ['medium'], color: '#563019',
    ar: {
      name: 'هندي بلانتيشن فاخر', origin: 'الهند، تلال شيكماغالور',
      notes: 'توابل دافئة، شوكولاتة داكنة، قوام كامل',
      story: [
        'في القرن السابع عشر، كان إخراج حبة بن صالحة للزراعة من اليمن ممنوعًا منعًا باتًا. لكن حاجًّا صوفيًا اسمه بابا بودان عاد من مكة وقد ربط سبع حبات على صدره سرًّا.',
        'زرعها في تلال شيكماغالور جنوب الهند، تحت ظلال أشجار الفلفل والهيل. ومن هناك أخذت حبة «البلانتيشن» طابعها الدافئ المتبّل وقوامها الكامل.. وكأنها لسه فاكرة الرحلة.',
      ],
      pair: 'قهوة الصبح التقيلة، وبتستحمل اللبن بسهولة.',
    },
    en: {
      name: 'Indian Plantation AA', origin: 'India, Chikmagalur Hills',
      notes: 'Warm spice, dark chocolate, full body',
      story: [
        'In the 1600s, taking a fertile coffee bean out of Yemen was strictly forbidden. But a Sufi pilgrim named Baba Budan, returning from Mecca, strapped seven beans to his chest in secret.',
        'He planted them in the Chikmagalur hills of southern India, in the shade of pepper vines and cardamom. That’s where our Plantation bean gets its warm, spiced character and full body, as if it still remembers the journey.',
      ],
      pair: 'A bold morning cup that holds up beautifully with milk.',
    },
  },
  {
    id: 'arabi', roasts: ['light'], color: '#B98349',
    ar: {
      name: 'بن عربي بالهيل والزعفران', origin: 'اليمن والجزيرة العربية',
      notes: 'هيل، زعفران، لون ذهبي',
      story: [
        'من ميناء المخا في اليمن خرجت القهوة إلى العالم كله، ومن اسمه جاءت كلمة «موكا». وفي خيام البادية صارت الدلّة رمز الكرم: لا يُستقبل ضيف إلا بفنجان.',
        'والأصول تقول: الدلّة في اليسار والفنجان يُقدَّم باليمين، والضيف يهزّ فنجانه حين يكتفي. نحمّص هذه الحبة فاتحة جدًا ونضيف لها الهيل والزعفران.. فيطلع فنجان بلون الدهب وريحة البيت الكبير.',
      ],
      pair: 'اشربه في فناجين صغيرة مع تمر.',
    },
    en: {
      name: 'Arabic Coffee with Cardamom & Saffron', origin: 'Yemen & Arabia',
      notes: 'Cardamom, saffron, golden hue',
      story: [
        'Coffee reached the world through the Yemeni port of Mocha, and the word itself comes from its name. In desert tents, the dallah became the symbol of hospitality: no guest was welcomed without a cup.',
        'Tradition says the dallah stays in the left hand and the cup is served with the right, and a guest gently shakes the cup when they’ve had enough. We roast this bean very light and blend it with cardamom and saffron for a golden cup that smells like a grand family home.',
      ],
      pair: 'Serve in small finjans, with dates.',
    },
  },
  {
    id: 'saudi', roasts: ['light', 'medium', 'dark'], color: '#7A4C26',
    ar: {
      name: 'سعودي', origin: 'على اسم المحل',
      notes: 'متوازن، ومناسب لكل يوم',
      story: [
        'لما كان اليمن هو المصدر الأساسي للبن في العالم، كان البن بيوصل مصر عن طريق البحر الأحمر: من ميناء المخا لجدة، ومن جدة للسويس، وبعدين على الجمال للقاهرة.',
        'الطريق ده فضل شغال حوالي قرنين، ومنه عمل بعض تجار القاهرة ثروات كبيرة. والسعودي هو البن اللي شايل اسم محلنا، موجود فاتح أو وسط أو غامق، سادة أو محوّج.',
      ],
      pair: 'لو مش عارف تختار، ابدأ بيه.',
    },
    en: {
      name: 'Soody', origin: 'Named after the shop',
      notes: 'Balanced, an everyday coffee',
      story: [
        'When Yemen was the world’s main source of coffee, beans reached Egypt by the Red Sea: from the port of Mocha to Jeddah, then to Suez, and on to Cairo by camel.',
        'That route ran for about two centuries, and some of Cairo’s merchants made great fortunes from it. Soody is the coffee that carries our shop’s name. It comes light, medium or dark, plain or spiced.',
      ],
      pair: 'Not sure what to pick? Start with this one.',
    },
  },
  {
    id: 'malaki', roasts: ['light', 'medium', 'dark'], color: '#633A1E',
    ar: {
      name: 'ملوكي', origin: 'القهوة المصري',
      notes: 'طعم القهوة المصري الكلاسيكي',
      story: [
        'في أوائل القرن السادس عشر، كان طلاب يمنيين في الأزهر بيشربوا القهوة عشان يفضلوا صاحيين في صلاة وذكر الليل. ومن الأزهر انتشرت القهوة في شوارع القاهرة، وبدأت القهاوي تفتح.',
        'ومن ساعتها بقى للقهوة المصري طلبها المعروف: سادة، أو مظبوط، أو زيادة. والملوكي بن مناسب للطريقة دي، يتطحن ناعم ويتعمل في الكنكة. موجود فاتح أو وسط أو غامق، سادة أو محوّج.',
      ],
      pair: 'يتعمل في الكنكة على نار هادية.',
    },
    en: {
      name: 'Malaki', origin: 'Egyptian style coffee',
      notes: 'The classic Egyptian coffee taste',
      story: [
        'In the early 1500s, Yemeni students at Al Azhar drank coffee to stay awake through night prayers. From Al Azhar it spread into the streets of Cairo, and coffeehouses began to open.',
        'Since then, Egyptian coffee has been ordered the same way: plain, just right, or extra sweet. Malaki suits that style, ground fine and brewed in a kanaka. It comes light, medium or dark, plain or spiced.',
      ],
      pair: 'Brew it in a kanaka over a low flame.',
    },
  },
  {
    id: 'special', roasts: ['light', 'medium', 'dark'], color: '#452612',
    ar: {
      name: 'اسبيشيال', origin: 'الدرجة الأعلى بعد الملوكي والسعودي',
      notes: 'أتقل من الملوكي والسعودي',
      story: [
        'درجة التحميص بتغيّر طعم نفس الحبة. التحميص الفاتح بيحافظ أكتر على طعم البلد اللي الحبة جاية منها، وفيه حموضة أعلى. ومع كل دقيقة زيادة على النار، الحموضة بتقل والمرارة والقوام بيزيدوا.',
        'الاسبيشيال هو الأعلى في التلاتة: الملوكي، والسعودي، والاسبيشيال. وعشان كده يستاهل تجرّبه بالدرجتين، فاتح مرة وغامق مرة، وتشوف الفرق بنفسك.',
      ],
      pair: 'خد ربع فاتح وربع غامق وقارن بينهم.',
    },
    en: {
      name: 'Special', origin: 'A step up from Malaki and Soody',
      notes: 'Fuller than Malaki and Soody',
      story: [
        'Roasting changes the taste of the same bean. A light roast keeps more of the flavor of the place the bean came from, with more acidity. Every extra minute over the heat lowers the acidity and adds bitterness and body.',
        'Special is the top of our three everyday coffees: Malaki, Soody and Special. That makes it a good one to try both ways, light once and dark once, and taste the difference yourself.',
      ],
      pair: 'Get a quarter light and a quarter dark, and compare.',
    },
  },
  {
    id: 'arabica', roasts: ['medium'], color: '#7D4F28',
    ar: {
      name: 'بريميام أرابيكا', origin: 'مرتفعات استوائية',
      notes: 'حلاوة طبيعية، فواكه، نهاية نظيفة',
      story: [
        'سمّاها عالم النبات لينيوس «أرابيكا» لأنه ظنّ أنها وُلدت في جزيرة العرب.. فمن موانئها عرفتها أوروبا لأول مرة.',
        'الأرابيكا بتتزرع على ارتفاعات عالية، وبتنضج ببطء في الجو البارد، وده اللي بيديها حلاوتها وريحتها الغنية. اخترنا لها حبات بريميام بعناية، ومحمّصة وسط عشان كل نكهة تبان.',
      ],
      pair: 'تحفة في الإسبريسو والقهوة المقطّرة.',
    },
    en: {
      name: 'Premium Arabica', origin: 'Tropical highlands',
      notes: 'Natural sweetness, fruit, clean finish',
      story: [
        'The botanist Linnaeus named it Arabica, believing it was born in Arabia. After all, that’s where Europe first found it.',
        'Arabica grows high in the mountains and ripens slowly in the cool air, which gives it natural sweetness and a rich aroma. We select premium lots and roast them medium so every note comes through.',
      ],
      pair: 'Wonderful as espresso or filter coffee.',
    },
  },
  {
    id: 'espresso', roasts: ['dark'], color: '#33200F',
    ar: {
      name: 'إسبريسو إيطالي', origin: 'إيطاليا، تورينو',
      notes: 'قوي، كريما دهبي، كاكاو مُر',
      story: [
        'سنة ١٨٨٤ في تورينو، سجّل أنجيلو موريوندو براءة أول ماكينة بتعمل القهوة بالبخار والضغط. وبعدها الإيطاليين حوّلوها لطقس سريع: فنجان صغير، تشربه واقف على البار، وتكمّل يومك.',
        'كلمة «إسبريسو» معناها «مضغوط».. وده اللي بيحصل بالظبط: مية سخنة بتعدّي بضغط عالي في بن مطحون ناعم، فيطلع شوت مركّز بكريما دهبي. خلطتنا محمّصة غامق على الطريقة الإيطالية.',
      ],
      pair: 'للماكينة، أو الموكا بوت في البيت.',
    },
    en: {
      name: 'Espresso Italiano', origin: 'Italy, Turin',
      notes: 'Bold, golden crema, bittersweet cocoa',
      story: [
        'In 1884 in Turin, Angelo Moriondo patented the first machine to brew coffee with steam and pressure. Italians soon turned it into a quick ritual: a small cup, drunk standing at the bar, and on with your day.',
        '“Espresso” means “pressed out,” exactly what happens as hot water is forced through fine grounds into a concentrated shot with golden crema. Our blend is roasted dark the Italian way.',
      ],
      pair: 'For the machine, or a moka pot at home.',
    },
  },
  {
    id: 'green', roasts: [], color: '#8C9A62',
    ar: {
      name: 'بن أخضر', origin: 'حبوب غير محمّصة',
      notes: 'عشبي، خفيف، أقرب للشاي',
      story: [
        'قبل النار، كل حبة بن كانت خضرا. البن الأخضر هو الحبة في صورتها الأولى، من غير تحميص، بطعم عشبي خفيف أقرب للشاي منه للقهوة.',
        'ناس كتير بتحب تضيفه لروتينها اليومي. بيتغلي أو بيتنقع ويتشرب دافي، ومعاه شوية قرفة أو ليمون لو حبيت.',
      ],
      pair: 'انقعه في مية سخنة ١٠ دقايق قبل ما تشربه.',
    },
    en: {
      name: 'Green Coffee', origin: 'Unroasted beans',
      notes: 'Herbal, light, tea like',
      story: [
        'Before the fire, every coffee bean was green. Green coffee is the bean in its first form, unroasted, with a light herbal taste closer to tea than to coffee.',
        'Many people like adding it to their daily routine. Steep or simmer it and sip it warm, with a little cinnamon or lemon if you like.',
      ],
      pair: 'Steep in hot water for about 10 minutes before drinking.',
    },
  },
  {
    id: 'french', roasts: [], color: '#8E5A31',
    ar: {
      name: 'قهوة فرنساوي', origin: 'نكهات',
      notes: 'بندق، كراميل، توت، شوكولاتة، لوتس',
      story: [
        'في مصر «الفرنساوي» مش بلد.. ده مزاج. قهوة ناعمة وكريمي، بتتعمل باللبن، ومتحلّية بنكهة تخلّي الفنجان أقرب للحلويات.',
        'عندنا سبع اختيارات: بندق سادة، بندق بالقطع، كراميل، توت، كلاسيك، شوكولاتة، ولوتس. اختار واحدة.. وهترجع للباقيين واحدة واحدة.',
      ],
      pair: 'اعملها باللبن السخن، وزوّد كريمة لو مزاجك عالي.',
    },
    en: {
      name: 'French Coffee', origin: 'Flavored',
      notes: 'Hazelnut, caramel, berry, chocolate, Lotus',
      story: [
        'In Egypt, “French coffee” isn’t a place. It’s a mood: a smooth, creamy coffee made with milk and sweetened with flavor until the cup feels like dessert.',
        'We have seven: plain hazelnut, hazelnut with real pieces, caramel, berry, classic, chocolate and Lotus. Pick one. You’ll come back for the rest, one by one.',
      ],
      pair: 'Make it with hot milk, and add whipped cream if you’re feeling fancy.',
    },
  },
];

/* ---- Menu & prices (EGP): [1/8 kg, 1/4 kg, 1 kg]; null = not sold in that size.
        `bean` links an item to its story above; `name` is used when there is no bean. ---- */
const MENU = {
  plain: [
    { bean: 'malaki',   roasts: ['light', 'medium'], prices: [90, 180, 720] },
    { bean: 'malaki',   roasts: ['dark'],            prices: [95, 190, 760] },
    { bean: 'saudi',    roasts: ['light', 'medium'], prices: [100, 200, 800] },
    { bean: 'saudi',    roasts: ['dark'],            prices: [105, 210, 840] },
    { bean: 'special',  roasts: ['light', 'medium'], prices: [110, 220, 880] },
    { bean: 'special',  roasts: ['dark'],            prices: [120, 240, 960] },
    { bean: 'arabica',  roasts: ['medium'],          prices: [125, 250, 1000] },
    { bean: 'habashi',  roasts: ['light', 'medium', 'dark'], prices: [125, 250, 1000] },
    { bean: 'brazili',  roasts: ['light', 'medium', 'dark'], prices: [125, 250, 1000] },
    { bean: 'colombi',  roasts: ['medium', 'dark'],  prices: [140, 280, 1160] },
    { bean: 'hindi',    roasts: ['medium'],          prices: [130, 260, 1040] },
    { bean: 'arabi',    roasts: [],                  prices: [125, 250, 1000] },
    { bean: 'green',    roasts: [],                  prices: [95, 190, 760] },
    { name: { ar: 'نسكافيه بلاك', en: 'Nescafé Black' }, prices: [155, 310, 1240] },
    { name: { ar: 'نسكافيه جولد', en: 'Nescafé Gold' },  prices: [205, 410, 1640] },
    { bean: 'espresso', roasts: [],                  prices: [115, 230, 920] },
    { name: { ar: 'كوفي مكس', en: 'Coffee Mix' },        prices: [85, 170, 680] },
    { name: { ar: 'كوفي شوب سادة', en: 'Coffee Shop Blend, plain' }, prices: [null, null, 560] },
  ],
  spiced: [
    { bean: 'malaki',  roasts: ['light', 'medium'], prices: [100, 200, 800] },
    { bean: 'malaki',  roasts: ['dark'],            prices: [105, 210, 840] },
    { bean: 'saudi',   roasts: ['light', 'medium'], prices: [110, 220, 880] },
    { bean: 'saudi',   roasts: ['dark'],            prices: [115, 230, 925] },
    { bean: 'special', roasts: ['light', 'medium'], prices: [120, 240, 960] },
    { bean: 'special', roasts: ['dark'],            prices: [130, 260, 1040] },
    { bean: 'arabica', roasts: ['medium'],          prices: [135, 270, 1080] },
    { bean: 'habashi', roasts: ['light', 'medium', 'dark'], prices: [135, 270, 1080] },
    { bean: 'brazili', roasts: ['light', 'medium', 'dark'], prices: [135, 270, 1080] },
    { bean: 'colombi', roasts: ['medium', 'dark'],  prices: [150, 300, 1200] },
    { bean: 'hindi',   roasts: ['medium'],          prices: [140, 280, 1120] },
    { name: { ar: 'كوفي شوب محوّج', en: 'Coffee Shop Blend, spiced' }, prices: [null, null, 640] },
  ],
  french: [
    { name: { ar: 'قهوة فرنساوي بندق قطع', en: 'Hazelnut Pieces' }, prices: [80, 160, 640] },
    { name: { ar: 'قهوة فرنساوي بندق سادة', en: 'Plain Hazelnut' }, prices: [75, 150, 600] },
    { name: { ar: 'قهوة فرنساوي بالنكهات', en: 'Flavored' }, prices: [75, 150, 600] },
  ],
};
