/**
 * Islamic Azkar & Quran Website - Final Version (Welcome Page + Surah Selection)
 */

const API_AZKAR = 'https://raw.githubusercontent.com/rn0x/Adhkar-json/master/adhkar.json';
const API_RECITERS = 'https://mp3quran.net/api/v3/reciters?language=ar';
const HERO_IMAGE_PATH = 'islamic_3d_hero_1770308420829.png';

const elements = {
    grid: document.getElementById('azkar-container'),
    title: document.getElementById('current-category-title'),
    navLinks: document.querySelectorAll('.nav-links a'),
    heroImg: document.getElementById('3d-hero-img'),
    themeToggle: document.getElementById('theme-toggle'),
    logoLink: document.getElementById('logo-link'),
    navContainer: document.querySelector('.nav-container'),
    menuToggle: document.getElementById('menu-toggle')
};

const SURAH_NAMES = [
    "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"
];

const FAMOUS_KEYWORDS = [
    'إسلام صبحي', 'أحمد خضر', 'أحمد العجمي', 'ياسر الدوسري', 
    'سعود الشريم', 'ناصر القطامي', 'المنشاوي', 'عبدالباسط', 
    'الحصري', 'العفاسي', 'البنا', 'الطبلاوي', 'ماهر المعيقلي', 
    'محمد رفعت', 'السديس', 'علي جابر', 'علي الحذيفي'
];

let rawData = [];
let recitersData = [];
let audioPlayer = new Audio();
let currentPlayingUrl = '';

const categoryMap = {
    'أذكار الصباح': ['أذكار الصباح والمساء'],
    'أذكار المساء': ['أذكار الصباح والمساء'],
    'أذكار الصلاة': [
        'أذكار بعد السلام من الصلاة', 'تسابيح', 'أذكار الآذان', 'أذكار المسجد', 'أذكار الوضوء'
    ]
};

async function init() {
    elements.heroImg.src = HERO_IMAGE_PATH;

    // Dark Mode Initialization
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    elements.themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // Persistent Player UI
    initPlayerUI();
    restoreAudioState();

    try {
        const [azkarRes, recitersRes] = await Promise.all([
            fetch(API_AZKAR),
            fetch(API_RECITERS)
        ]);
        rawData = await azkarRes.json();
        const recData = await recitersRes.json();
        recitersData = recData.reciters;
        
        // Persistence: Load last view
        const lastView = localStorage.getItem('lastView') || 'home';
        const lastCat = localStorage.getItem('lastCategory');
        
        initNavIndicator();
        
        if (lastView === 'quran') loadReciters();
        else if (lastView === 'category' && lastCat) loadCategory(lastCat);
        else showHome();
        
        elements.menuToggle.addEventListener('click', () => {
            const navLinks = document.querySelector('.nav-links');
            navLinks.classList.toggle('active');
            const icon = elements.menuToggle.querySelector('i');
            icon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const navLinks = document.querySelector('.nav-links');
            if (!elements.navContainer.contains(e.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                elements.menuToggle.querySelector('i').className = 'fas fa-bars';
            }
        });

        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                const cat = link.getAttribute('data-category');
                
                triggerAnimation(() => {
                    elements.navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    moveNavIndicator(link);
                    
                    // Close mobile menu
                    const navLinksParent = document.querySelector('.nav-links');
                    navLinksParent.classList.remove('active');
                    elements.menuToggle.querySelector('i').className = 'fas fa-bars';
                    
                    if (view === 'home') showHome();
                    else if (view === 'quran') loadReciters();
                    else loadCategory(cat);
                });
            });
        });

        elements.logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            triggerAnimation(() => {
                elements.navLinks.forEach(l => l.classList.remove('active'));
                const homeLink = Array.from(elements.navLinks).find(l => l.getAttribute('data-view') === 'home');
                if(homeLink) {
                    homeLink.classList.add('active');
                    moveNavIndicator(homeLink);
                }
                showHome();
            });
        });
        
        window.addEventListener('resize', () => {
            const activeLink = document.querySelector('.nav-links a.active');
            if(activeLink) moveNavIndicator(activeLink);
        });
        audioPlayer.onended = () => {
            playNextInQueue();
        };

    } catch (err) {
        console.error('Initialization error:', err);
    }
}

function initNavIndicator() {
    const navLinksList = document.querySelector('.nav-links');
    const indicator = document.createElement('div');
    indicator.className = 'nav-indicator';
    navLinksList.appendChild(indicator);
    
    // Set initial position after a small delay to ensure DOM is ready
    setTimeout(() => {
        const activeLink = document.querySelector('.nav-links a.active');
        if(activeLink) moveNavIndicator(activeLink);
    }, 100);
}

function moveNavIndicator(link) {
    const indicator = document.querySelector('.nav-indicator');
    if(!indicator || !link) return;
    
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.left = `${link.offsetLeft}px`;
}

function triggerAnimation(callback) {
    elements.grid.classList.remove('view-animate');
    void elements.grid.offsetWidth; // Force reflow
    callback();
    elements.grid.classList.add('view-animate');
}

function initPlayerUI() {
    const playerBar = document.createElement('div');
    playerBar.className = 'audio-player-bar';
    playerBar.id = 'sticky-player';
    playerBar.innerHTML = `
        <div class="player-info-wrapper">
            <div class="player-icon-pulse"></div>
            <div class="player-info" id="player-title">جارِ التشغيل...</div>
        </div>
        <div class="player-seek-group">
            <div class="player-times">
                <span class="player-time" id="current-time">0:00</span>
                <span class="player-time separator">/</span>
                <span class="player-time" id="total-time">0:00</span>
            </div>
            <input type="range" id="player-progress" value="0" min="0" step="1">
        </div>
        <div class="player-controls">
            <button id="toggle-play"><i class="fas fa-pause"></i></button>
            <button class="stop-btn" id="stop-audio"><i class="fas fa-times"></i></button>
        </div>
    `;
    document.body.appendChild(playerBar);

    const progress = document.getElementById('player-progress');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');

    audioPlayer.ontimeupdate = () => {
        if(!isNaN(audioPlayer.duration)) {
            progress.max = audioPlayer.duration;
            progress.value = audioPlayer.currentTime;
            currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
            totalTimeEl.textContent = formatTime(audioPlayer.duration);
            
            // Save state every 5 seconds or if it's new
            if (audioPlayer.currentTime > 0) {
                saveAudioState();
            }
        }
    };

    progress.addEventListener('input', () => {
        audioPlayer.currentTime = progress.value;
        saveAudioState();
    });

    document.getElementById('toggle-play').addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play();
            document.getElementById('toggle-play').innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            audioPlayer.pause();
            document.getElementById('toggle-play').innerHTML = '<i class="fas fa-play"></i>';
        }
        saveAudioState();
    });

    document.getElementById('stop-audio').addEventListener('click', () => {
        audioPlayer.pause();
        audioPlayer.src = '';
        currentPlayingUrl = '';
        localStorage.removeItem('audioState');
        playerBar.classList.remove('active');
    });
}

function saveAudioState() {
    const state = {
        url: currentPlayingUrl,
        title: document.getElementById('player-title').textContent,
        currentTime: audioPlayer.currentTime,
        paused: audioPlayer.paused
    };
    if (state.url) {
        localStorage.setItem('audioState', JSON.stringify(state));
    }
}

async function restoreAudioState() {
    const savedState = localStorage.getItem('audioState');
    if (savedState) {
        const state = JSON.parse(savedState);
        if (state.url) {
            currentPlayingUrl = state.url;
            audioPlayer.src = state.url;
            audioPlayer.currentTime = state.currentTime;
            
            const bar = document.getElementById('sticky-player');
            document.getElementById('player-title').textContent = state.title;
            bar.classList.add('active');
            
            // Wait for metadata to load to get duration
            audioPlayer.onloadedmetadata = () => {
                const totalTimeEl = document.getElementById('total-time');
                const progress = document.getElementById('player-progress');
                totalTimeEl.textContent = formatTime(audioPlayer.duration);
                progress.max = audioPlayer.duration;
                progress.value = state.currentTime;
            };

            if (!state.paused) {
                try {
                    await audioPlayer.play();
                    document.getElementById('toggle-play').innerHTML = '<i class="fas fa-pause"></i>';
                } catch (e) {
                    console.log("Auto-play blocked, ready to play");
                    document.getElementById('toggle-play').innerHTML = '<i class="fas fa-play"></i>';
                }
            } else {
                document.getElementById('toggle-play').innerHTML = '<i class="fas fa-play"></i>';
            }
        }
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

function showHome() {
    localStorage.setItem('lastView', 'home');
    elements.title.textContent = 'الرئيسية';
    elements.grid.className = 'welcome-section';
    elements.grid.innerHTML = `
        <div class="welcome-hero">
            <h1>مرحباً بكم في منصة صدقة</h1>
            <p>صدقة جارية عني وعن جميع المسلمين الأحياء والأموات.</p>
            <div class="cta-group">
                <button class="cta-btn" onclick="triggerAnimation(() => document.querySelector('[data-category=\\'أذكار الصباح\\']').click())">أذكار الصباح</button>
                <button class="cta-btn secondary" onclick="triggerAnimation(() => document.querySelector('[data-view=\\'quran\\']').click())">القرآن الكريم</button>
            </div>
        </div>
    `;
    updateActiveNav('home');
    window.scrollTo(0, 0);
}

function loadCategory(rawCat) {
    localStorage.setItem('lastView', 'category');
    localStorage.setItem('lastCategory', rawCat);

    elements.title.textContent = rawCat;
    elements.grid.className = 'azkar-grid';
    elements.grid.innerHTML = '';

    const targetCategories = categoryMap[rawCat] || [rawCat];
    let items = [];

    targetCategories.forEach(catName => {
        const categoryData = rawData.find(item => item.category.includes(catName));
        if (categoryData && categoryData.array) items.push(...categoryData.array);
    });

    if (rawCat === 'أذكار الصباح') items = items.filter(i => !i.text.includes('إذا أمسى'));
    else if (rawCat === 'أذكار المساء') items = items.filter(i => !i.text.includes('إذا أصبح'));

    // Intelligent Transformation Logic
    const transformedItems = transformAzkarForContext(items, rawCat);

    // Intelligent Splitting Logic
    const explodedItems = processAzkarItems(transformedItems);

    explodedItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'zekr-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.classList.add('animate-in');

        const total = parseInt(item.count) || 1;
        let left = total;
        card.innerHTML = `
            <div class="zekr-content">${item.text || item.content}</div>
            <div class="zekr-footer">
                <div class="count-badge">المتبقي: <span class="num">${left}</span></div>
                <div class="required-badge">المطلوب: ${total}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            if (left > 0) {
                left--;
                card.querySelector('.num').textContent = left;
                if (left === 0) card.classList.add('finished');
            }
        });
        elements.grid.appendChild(card);
    });
    updateActiveNav(null, rawCat);
    const activeLink = Array.from(elements.navLinks).find(l => l.getAttribute('data-category') === rawCat);
    if(activeLink) moveNavIndicator(activeLink);
}

function transformAzkarForContext(items, context) {
    return items.map(item => {
        let text = item.text || item.content || "";
        
        if (context === 'أذكار المساء') {
            // 1. Check for explicit evening variant in brackets
            const eveningMatch = text.match(/\[وإذَا\s*أَمْسَى\s*قَالَ:\s*(.*?)\]/) || 
                               text.match(/\[وإذا\s*أمسى\s*قال:\s*(.*?)\]/);
            
            // Only use the bracketed text if it's NOT a partial sentence (no ellipses)
            if (eveningMatch && eveningMatch[1] && !eveningMatch[1].includes('...')) {
                text = eveningMatch[1];
            } else {
                // 2. Perform robust Harakat-agnostic replacements
                // IMPORTANT: Order matters! Replace more specific words first.
                text = replaceArabicKeyword(text, 'أصبحت', 'أَمْسَيْتُ');
                text = replaceArabicKeyword(text, 'أصبحنا', 'أَمْسَيْنَا');
                text = replaceArabicKeyword(text, 'أصبح', 'أَمْسَى');
                text = replaceArabicKeyword(text, 'هذا اليوم', 'هذه الليلة');
                text = replaceArabicKeyword(text, 'النشور', 'المصير');
            }
            // Always strip any remaining bracket notes
            text = text.replace(/\[(?:وإذَا|وإذا)\s*(?:أَمْسَى|أمسى)\s*(?:قَالَ|قال):.*?\]/g, '');
        } else if (context === 'أذكار الصباح') {
            text = text.replace(/\[(?:وإذَا|وإذا)\s*(?:أَمْسَى|أمسى)\s*(?:قَالَ|قال):.*?\]/g, '');
        }
        return { ...item, text: text };
    });
}

/**
 * Replaces an Arabic keyword while ignoring Harakat in the source text.
 * Preserves Harakat on the replacement word if provided.
 */
function replaceArabicKeyword(source, keyword, replacement) {
    // Create a regex that allows optional Harakat between each character
    const harakat = '[\\u064B-\\u065F]*';
    const regexPattern = keyword.split('').map(char => char + harakat).join('');
    const regex = new RegExp(regexPattern, 'g');
    return source.replace(regex, replacement);
}

function processAzkarItems(items) {
    let exploded = [];
    
    try {
        items.forEach(item => {
            let text = item.text || item.content || "";
            if (!text) return;
            
            // 1. Split Surahs if combined (Check for "سورة" OR multiple "بسم الله")
            const basmalahReg = /بسم الله الرحمن الرحيم/g;
            const basmalahCount = (text.match(basmalahReg) || []).length;
            
            if (text.includes('سورة') || basmalahCount > 1) {
                // If splitting by Basmalah
                if (basmalahCount > 1) {
                    const parts = text.split(/(?=بسم الله الرحمن الرحيم)/);
                    parts.forEach(p => {
                        const pText = p.trim();
                        if (pText) {
                            let pCount = item.count;
                            // Inherit global count if specified in the text
                            if (text.includes('ثلاث') || text.includes('3')) pCount = 3;
                            exploded.push({ text: cleanText(pText), count: pCount });
                        }
                    });
                } else {
                    // Split by Surah name if Basmalah isn't the primary separator
                    const surahParts = text.split(/(?=سورة)/);
                    surahParts.forEach(s => {
                        const sText = s.trim();
                        if (sText) exploded.push({ text: cleanText(sText), count: item.count });
                    });
                }
                return;
            }

            // 2. Split by repetition markers safely
            let parts = [text];
            if (text.includes(']')) {
                parts = text.split(/\]\s*[،.,؛]\s*/);
                for(let i=0; i < parts.length - 1; i++) {
                    if (parts[i]) parts[i] += ']';
                }
            } else if (text.includes('))') && (text.match(/\)\)/g) || []).length > 1) {
                parts = text.split(/(?<=\)\))\s*[،.,؛\s]*\s*/);
            }
            
            if (parts.length > 1) {
                parts.forEach(p => {
                    let pText = p.trim();
                    if (!pText) return;
                    
                    let pCount = item.count;
                    if (pText.includes('ثلاثاً') || pText.includes('ثلاث مرات')) pCount = 3;
                    else if (pText.includes('مرة واحدة') || pText.includes('مرةً واحدة')) pCount = 1;
                    else if (pText.includes('عشر مرات') || pText.includes('10 مرات')) pCount = 10;
                    else if (pText.includes('سبع')) pCount = 7;
                    else if (pText.includes('أربع')) pCount = 4;
                    
                    const cleaned = cleanText(pText);
                    if (cleaned) exploded.push({ text: cleaned, count: pCount });
                });
            } else {
                const cleaned = cleanText(text);
                if (cleaned) exploded.push({ text: cleaned, count: item.count });
            }
        });
    } catch (e) {
        console.error("Splitting error:", e);
        return items;
    }

    return exploded.length > 0 ? exploded : items;
}

function cleanText(text) {
    if (!text) return "";
    return text
        .replace(/\[ثلاثاً\]/g, '')
        .replace(/\(ثلاثاً\)/g, '')
        .replace(/ثلاثاً/g, '')
        .replace(/ثلاث مرات/g, '')
        .replace(/\(ثلاثَ مرَّاتٍ\)/g, '')
        .replace(/\[مرة واحدة\]/g, '')
        .replace(/مرة واحدة/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/^\(\(/, '')
        .replace(/\)\)$/, '')
        // Clean up common trailing punctuation and spaces
        .replace(/[،.,؛\s]+$/g, '')
        .replace(/^[،.,؛\s]+/g, '')
        .trim();
}

function loadReciters() {
    localStorage.setItem('lastView', 'quran');
    elements.title.textContent = 'القرآن الكريم - كبار القراء';
    elements.grid.className = 'quran-grid';
    elements.grid.innerHTML = '';

    const seenNames = new Set();
    
    // Helper to clean Arabic text from Harakat and simplify
    const cleanForSearch = (txt) => {
        return txt.replace(/[\u064B-\u065F]/g, "").trim();
    };

    const filtered = recitersData.filter(r => {
        const rNameClean = cleanForSearch(r.name);
        
        const matchedKey = FAMOUS_KEYWORDS.find(key => {
            const keyParts = cleanForSearch(key).split(/\s+/);
            // Every part of the keyword must exist in the reciter's name
            return keyParts.every(part => rNameClean.includes(part));
        });
        
        if (matchedKey && !seenNames.has(matchedKey)) {
            // Priority check for Al-Huzaifi: Ensure we get "علي" to avoid "أحمد"
            if (matchedKey.includes('الحذيفي')) {
                if (!rNameClean.includes('علي')) return false;
            }
            seenNames.add(matchedKey);
            return true;
        }
        return false;
    });

    filtered.forEach((reciter, index) => {
        let selectedMoshaf = reciter.moshaf[0];
        
        if (reciter.name.includes('المنشاوي')) {
            const pureVersion = reciter.moshaf.find(m => m.name.includes('مرتل') || m.name.includes('مجود'));
            if (pureVersion) selectedMoshaf = pureVersion;
        } else if (reciter.name.includes('مشاري')) {
            const hafs = reciter.moshaf.find(m => m.name.includes('حفص'));
            if (hafs) selectedMoshaf = hafs;
        } else {
            const murattal = reciter.moshaf.find(m => m.name.includes('مرتل'));
            if (murattal) selectedMoshaf = murattal;
        }

        const card = document.createElement('div');
        card.className = 'radio-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.opacity = '0';
        card.style.animation = 'cardEntrance 0.5s forwards';
        card.innerHTML = `
            <i class="fas fa-user-tie"></i>
            <h3>${reciter.name}</h3>
            <p>${selectedMoshaf.name}</p>
        `;
        card.addEventListener('click', () => triggerAnimation(() => loadSurahs(reciter, selectedMoshaf)));
        elements.grid.appendChild(card);
    });
    updateActiveNav('quran');
    const quranLink = Array.from(elements.navLinks).find(l => l.getAttribute('data-view') === 'quran');
    if(quranLink) moveNavIndicator(quranLink);
}

function loadSurahs(reciter, moshaf) {
    elements.title.textContent = `سور القرآن الكريم بصوت ${reciter.name}`;
    elements.grid.className = 'surah-selection';
    elements.grid.innerHTML = `
        <button class="back-btn" onclick="triggerAnimation(() => loadReciters())"><i class="fas fa-arrow-right"></i> العودة للقراء</button>
        <div class="surah-grid"></div>
    `;
    
    const grid = elements.grid.querySelector('.surah-grid');
    const surahList = moshaf.surah_list.split(',');

    activeAudioQueue = surahList.map(id => {
        const num = parseInt(id);
        const sName = SURAH_NAMES[num - 1];
        return {
            url: `${moshaf.server}${id.padStart(3, '0')}.mp3`,
            title: `${reciter.name} - ${sName}`,
            surahName: sName
        };
    });

    surahList.forEach((id, index) => {
        const num = parseInt(id);
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.style.animationDelay = `${index * 0.02}s`;
        card.style.opacity = '0';
        card.style.animation = 'cardEntrance 0.4s forwards';
        
        const url = activeAudioQueue[index].url;
        const title = activeAudioQueue[index].title;
        if (currentPlayingUrl === url) card.style.borderColor = 'var(--primary)';

        card.innerHTML = `
            <div class="surah-num">${num}</div>
            <div class="surah-name">${SURAH_NAMES[num - 1]}</div>
        `;
        card.addEventListener('click', () => {
            currentQueueIndex = index;
            playAudio(url, title);
        });
        grid.appendChild(card);
    });
}

function playAudio(url, title) {
    if (currentPlayingUrl === url && !audioPlayer.paused) {
        audioPlayer.pause();
        return;
    }
    audioPlayer.src = url;
    audioPlayer.play();
    currentPlayingUrl = url;
    
    const bar = document.getElementById('sticky-player');
    document.getElementById('player-title').textContent = `مستمع لـ: ${title}`;
    bar.classList.add('active');
    document.getElementById('toggle-play').innerHTML = '<i class="fas fa-pause"></i>';
    saveAudioState();
}

function updateActiveNav(view, cat) {
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (view && link.getAttribute('data-view') === view) link.classList.add('active');
        else if (cat && link.getAttribute('data-category') === cat) link.classList.add('active');
    });
}

function updateThemeIcon(theme) {
    elements.themeToggle.querySelector('i').className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

document.addEventListener('DOMContentLoaded', init);
window.loadReciters = loadReciters;

