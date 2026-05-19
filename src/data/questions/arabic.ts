import { Question } from '../examData';

export const arabicQuestions: Question[] = [
  {
    id: 1,
    text: "What is the meaning of the word 'أهلا' (Ahlan)?",
    options: ["Goodbye", "Welcome", "Thank you", "Sorry"],
    correctAnswer: 1,
    explanation: "'Ahlan' is a common Arabic greeting for welcome."
  },
  {
    id: 2,
    text: "Which of the following is a definite article in Arabic?",
    options: [" ال (Al)", " في (Fi)", " من (Min)", " هل (Hal)"],
    correctAnswer: 0,
    explanation: "'Al-' is prefixed to nouns to make them definite."
  },
  {
    id: 3,
    text: "How do you say 'Book' in Arabic?",
    options: ["قلم (Qalam)", "كتاب (Kitab)", "مكتب (Maktab)", "كرسي (Kursi)"],
    correctAnswer: 1,
    explanation: "'Kitab' is the Arabic word for book."
  },
  {
    id: 4,
    text: "What is the feminine form of 'كبير' (Kabir - Big)?",
    options: ["كبيرة (Kabira)", "كبيرات (Kabirat)", "أكبر (Akbar)", "كبيرين (Kabirin)"],
    correctAnswer: 0,
    explanation: "Adding a 'ta marbuta' (ة) usually forms the feminine singular."
  },
  {
    id: 5,
    text: "Translate: 'أنا طالب' (Ana talib).",
    options: ["I am a teacher", "I am a student", "He is a student", "She is a student"],
    correctAnswer: 1,
    explanation: "'Ana' means I, and 'talib' means student (male)."
  },
  {
    id: 6,
    text: "Which of these is a plural of 'بيت' (Bayt - House)?",
    options: ["بيوت (Buyut)", "بيتان (Baytan)", "بيات (Bayat)", "بيتات (Baytat)"],
    correctAnswer: 0,
    explanation: "'Buyut' is the broken plural of 'Bayt'."
  },
  {
    id: 7,
    text: "What is the number 'خمسة' (Khamsa)?",
    options: ["3", "5", "7", "9"],
    correctAnswer: 1,
    explanation: "'Khamsa' is five."
  },
  {
    id: 8,
    text: "Which suffix indicates 'my' in Arabic (e.g., 'my book')?",
    options: [" ـك (ka)", " ـي (i)", " ـه (hu)", " ـنا (na)"],
    correctAnswer: 1,
    explanation: "Attaching 'ya' (ي) to a noun indicates first-person singular possession."
  },
  {
    id: 9,
    text: "Translate: 'أين المحطة؟' (Ayna al-mahatta?)",
    options: ["Where is the station?", "When is the station?", "What is the station?", "Why the station?"],
    correctAnswer: 0,
    explanation: "'Ayna' means where."
  },
  {
    id: 10,
    text: "What is the meaning of 'شكرًا' (Shukran)?",
    options: ["Please", "You're welcome", "Thank you", "Excuse me"],
    correctAnswer: 2,
    explanation: "'Shukran' is the standard way to say thank you."
  },
  {
    id: 11,
    text: "What is the meaning of 'صباح الخير' (Sabah al-khayr)?",
    options: ["Good evening", "Good night", "Good morning", "Goodbye"],
    correctAnswer: 2,
    explanation: "It literally means 'morning of goodness'."
  },
  {
    id: 12,
    text: "Which letter is used to indicate a question in Arabic?",
    options: [" و (Wa)", " ف (Fa)", " هـ (Ha)", " هل (Hal)"],
    correctAnswer: 3,
    explanation: "'Hal' is a particle used to start yes/no questions."
  },
  {
    id: 13,
    text: "How do you say 'Bread' in Arabic?",
    options: ["خبز (Khubz)", "لبن (Laban)", "لحم (Lahm)", "ماء (Ma')"],
    correctAnswer: 0,
    explanation: "'Khubz' is the Arabic word for bread."
  },
  {
    id: 14,
    text: "What does 'لا' (La) mean?",
    options: ["Yes", "Maybe", "No", "Always"],
    correctAnswer: 2,
    explanation: "'La' is the word for no."
  },
  {
    id: 15,
    text: "What is 'one' in Arabic?",
    options: ["واحد (Wahid)", "اثنان (Ithnan)", "ثلاثة (Thalatha)", "أربعة (Arba'a)"],
    correctAnswer: 0,
    explanation: "Wahid is number 1."
  },
  {
    id: 16,
    text: "Translate: 'كبير' (Kabir).",
    options: ["Small", "Long", "Big", "Short"],
    correctAnswer: 2,
    explanation: "Kabir means big or large."
  },
  {
    id: 17,
    text: "What is the Arabic word for 'Teacher' (male)?",
    options: ["طبيب (Tabib)", "مهندس (Muhandis)", "مدرس (Mudarris)", "طالب (Talib)"],
    correctAnswer: 2,
    explanation: "Mudarris or Mu'allim means teacher."
  },
  {
    id: 18,
    text: "Which of these is the plural of 'ولد' (Walad - Boy)?",
    options: ["ولدان (Waladan)", "أولاد (Awlad)", "ولدة (Walada)", "ولود (Walud)"],
    correctAnswer: 1,
    explanation: "Awlad is the broken plural for boys/children."
  },
  {
    id: 19,
    text: "What is the meaning of 'مساء النور' (Masa' al-nur)?",
    options: ["Good morning", "Good afternoon", "Good evening (response)", "Good night"],
    correctAnswer: 2,
    explanation: "This is the standard response to 'Masa' al-khayr'."
  },
  {
    id: 20,
    text: "Arabic is written from ____ to ____.",
    options: ["Left to Right", "Right to Left", "Top to Bottom", "Bottom to Top"],
    correctAnswer: 1,
    explanation: "Arabic script flows from right to left."
  },
  {
    id: 21,
    text: "What is the meaning of 'قلم' (Qalam)?",
    options: ["Paper", "Book", "Pen", "Eraser"],
    correctAnswer: 2,
    explanation: "Qalam refers to any writing instrument like a pen or pencil."
  },
  {
    id: 22,
    text: "How do you say 'Thank you very much'?",
    options: ["شكرًا جزيلًا (Shukran jazilan)", "عفوا (Afwan)", "أهلاً (Ahlan)", "تفضل (Tafaddal)"],
    correctAnswer: 0,
    explanation: "Jazilan adds the 'very much' emphasis."
  },
  {
    id: 23,
    text: "What is the Arabic word for 'Water'?",
    options: ["حليب (Halib)", "ماء (Ma')", "عصير (Asir)", "قهوة (Qahwa)"],
    correctAnswer: 1,
    explanation: "Ma' is basic water."
  },
  {
    id: 24,
    text: "What is 'ten' in Arabic?",
    options: ["خمسة (Khamsa)", "ستة (Sitta)", "عشرة (Ashara)", "تسعة (Tis'a)"],
    correctAnswer: 2,
    explanation: "Ashara is number 10."
  },
  {
    id: 25,
    text: "Translate: 'أنا من مصر' (Ana min Misr).",
    options: ["I am from Morocco", "I am from Egypt", "I am from Jordan", "I am from Saudi"],
    correctAnswer: 1,
    explanation: "'Misr' is the Arabic name for Egypt."
  },
  {
    id: 26,
    text: "What is the feminine counterpart of 'جميل' (Jamil - Beautiful)?",
    options: ["جميلة (Jamila)", "أجمل (Ajmal)", "جمال (Jamal)", "جميلات (Jamilat)"],
    correctAnswer: 0,
    explanation: "Jamila is the feminine form."
  },
  {
    id: 27,
    text: "What is the meaning of 'أين' (Ayna)?",
    options: ["Who", "What", "Where", "When"],
    correctAnswer: 2,
    explanation: "Ayna is used to ask about location."
  },
  {
    id: 28,
    text: "How do you say 'Goodbye'?",
    options: ["مرحباً (Marhaban)", "مع السلامة (Ma'a al-salama)", "أهلاً (Ahlan)", "كيف حالك (Kayfa halak)"],
    correctAnswer: 1,
    explanation: "'Ma'a al-salama' literally means 'with safety'."
  },
  {
    id: 29,
    text: "Which of these is 'Moon' in Arabic?",
    options: ["شمس (Shams)", "قمر (Qamar)", "نجم (Najm)", "سماء (Sama')"],
    correctAnswer: 1,
    explanation: "Qamar is the moon."
  },
  {
    id: 30,
    text: "What is 'Saturday' in Arabic?",
    options: ["الأحد (Al-ahad)", "الاثنين (Al-ithnayn)", "السبت (Al-sabt)", "الجمعة (Al-jumu'a)"],
    correctAnswer: 2,
    explanation: "Al-sabt is Saturday."
  },
  {
    id: 31,
    text: "What color is 'أبيض' (Abyad)?",
    options: ["Black", "White", "Red", "Green"],
    correctAnswer: 1,
    explanation: "Abyad is white."
  },
  {
    id: 32,
    text: "Translate 'New' (masculine):",
    options: ["قديم (Qadim)", "جديد (Jadid)", "صغير (Saghir)", "واسع (Wasi')"],
    correctAnswer: 1,
    explanation: "Jadid is new."
  },
  {
    id: 33,
    text: "How many letters are in the Arabic alphabet?",
    options: ["24", "26", "28", "30"],
    correctAnswer: 2,
    explanation: "There are 28 basic letters."
  },
  {
    id: 34,
    text: "What is the meaning of 'طبيب' (Tabib)?",
    options: ["Teacher", "Engineer", "Doctor", "Pilot"],
    correctAnswer: 2,
    explanation: "Tabib is a physician/doctor."
  },
  {
    id: 35,
    text: "Which of these means 'Family'?",
    options: ["صديق (Sadiq)", "عائلة (A'ila)", "جار (Jar)", "رجل (Rajul)"],
    correctAnswer: 1,
    explanation: "A'ila or Usra means family."
  },
  {
    id: 36,
    text: "What is 'Sun' in Arabic?",
    options: ["قمر (Qamar)", "شمس (Shams)", "كوكب (Kawkab)", "فضاء (Fada')"],
    correctAnswer: 1,
    explanation: "Shams is the sun."
  },
  {
    id: 37,
    text: "Translate: 'أكل' (Akala).",
    options: ["To drink", "To sleep", "To eat", "To run"],
    correctAnswer: 2,
    explanation: "Akala means he ate."
  },
  {
    id: 38,
    text: "What does 'نعم' (Na'am) mean?",
    options: ["No", "Yes", "Please", "Pardon"],
    correctAnswer: 1,
    explanation: "Na'am is yes."
  },
  {
    id: 39,
    text: "What is 'Milk' in Arabic?",
    options: ["قهوة (Qahwa)", "شاي (Shay)", "حليب (Halib)", "عصير (Asir)"],
    correctAnswer: 2,
    explanation: "Halib or Laban refers to milk."
  },
  {
    id: 40,
    text: "The Arabic word for 'Apple' is:",
    options: ["موز (Mawz)", "تفاح (Tuffah)", "عنب (Inab)", "برتقال (Burtuqal)"],
    correctAnswer: 1,
    explanation: "Tuffah is apple."
  },
  {
    id: 41,
    text: "What is 'Tuesday' in Arabic?",
    options: ["الاثنين (Al-ithnayn)", "الثلاثاء (Al-thulatha')", "الأربعاء (Al-arbi'a')", "الخميس (Al-khamis)"],
    correctAnswer: 1,
    explanation: "Al-thulatha' is Tuesday."
  },
  {
    id: 42,
    text: "Translate: 'بيت كبير' (Bayt kabir).",
    options: ["Small house", "Big house", "New house", "Old house"],
    correctAnswer: 1,
    explanation: "The adjective follows the noun in Arabic."
  },
  {
    id: 43,
    text: "What is the meaning of 'كيف' (Kayfa)?",
    options: ["When", "Where", "How", "Who"],
    correctAnswer: 2,
    explanation: "Kayfa is used to ask about condition or manner."
  },
  {
    id: 44,
    text: "What is 'Black' in Arabic?",
    options: ["أحمر (Ahmar)", "أسود (Aswad)", "أزرق (Azraq)", "أصفر (Asfar)"],
    correctAnswer: 1,
    explanation: "Aswad is black."
  },
  {
    id: 45,
    text: "Translate: 'ذهب' (Dhahaba).",
    options: ["To come", "To go", "To sit", "To stand"],
    correctAnswer: 1,
    explanation: "Dhahaba means he went."
  },
  {
    id: 46,
    text: "Which of these means 'Sea'?",
    options: ["نهر (Nahr)", "جبل (Jabal)", "بحر (Bahr)", "صحراء (Sahra')"],
    correctAnswer: 2,
    explanation: "Bahr is the sea."
  },
  {
    id: 47,
    text: "How do you say 'Please' to a male?",
    options: ["شكرًا (Shukran)", "من فضلك (Min fadlak)", "عفوا (Afwan)", "حسنا (Hasanan)"],
    correctAnswer: 1,
    explanation: "Min fadlak is please."
  },
  {
    id: 48,
    text: "What is the dual form of 'كتاب' (Kitab - Book)?",
    options: ["كتب (Kutub)", "كتابان (Kitaban)", "كتابات (Kitabat)", "كتابين (Kitabayn)"],
    correctAnswer: 1,
    explanation: "Adding 'ani' (ان) marks the nominative dual."
  },
  {
    id: 49,
    text: "Translate: 'الساعة الواحدة' (Al-sa'a al-wahida).",
    options: ["Twelve o'clock", "One o'clock", "Two o'clock", "Three o'clock"],
    correctAnswer: 1,
    explanation: "It means 'The hour is one'."
  },
  {
    id: 50,
    text: "Which of these correctly means 'Student' (female)?",
    options: ["طالب (Talib)", "طالبة (Taliba)", "طلاب (Tullab)", "طالبات (Talibat)"],
    correctAnswer: 1,
    explanation: "Adding 'ta marbuta' makes it feminine."
  },
  {
    id: 51,
    text: "What is the meaning of 'مدينة' (Madina)?",
    options: ["Village", "Country", "City", "Street"],
    correctAnswer: 2,
    explanation: "Madina is city."
  },
  {
    id: 52,
    text: "Translate 'Cold' (for weather):",
    options: ["حار (Harr)", "بارد (Barid)", "دافئ (Dafi')", "جميل (Jamil)"],
    correctAnswer: 1,
    explanation: "Barid is cold."
  },
  {
    id: 53,
    text: "What is the Arabic word for 'Dog'?",
    options: ["قطة (Qitta)", "كلب (Kalb)", "حمار (Himar)", "حصان (Hisan)"],
    correctAnswer: 1,
    explanation: "Kalb is dog."
  },
  {
    id: 54,
    text: "How do you say 'My name is...'?",
    options: ["أنا... (Ana...)", "اسمي... (Ismi...)", "أنت... (Anta...)", "هو... (Huwa...)"],
    correctAnswer: 1,
    explanation: "Ismi literally means 'My name'."
  },
  {
    id: 55,
    text: "What is the meaning of 'خبز' (Khubz)?",
    options: ["Meat", "Bread", "Rice", "Fish"],
    correctAnswer: 1,
    explanation: "Khubz is bread."
  },
  {
    id: 56,
    text: "Which of these is 'Mountain' in Arabic?",
    options: ["وادي (Wadi)", "غابة (Ghaba)", "جبل (Jabal)", "بحيرة (Buhayra)"],
    correctAnswer: 2,
    explanation: "Jabal is mountain."
  },
  {
    id: 57,
    text: "What is 'Red' in Arabic?",
    options: ["أخضر (Akhdar)", "أحمر (Ahmar)", "أزرق (Azraq)", "أبيض (Abyad)"],
    correctAnswer: 1,
    explanation: "Ahmar is red."
  },
  {
    id: 58,
    text: "Translate 'Small' (masculine):",
    options: ["كبير (Kabir)", "صغير (Saghir)", "قصير (Qasir)", "طويل (Tawil)"],
    correctAnswer: 1,
    explanation: "Saghir is small."
  },
  {
    id: 59,
    text: "What is 'Friday' in Arabic?",
    options: ["السبت (Al-sabt)", "الخميس (Al-khamis)", "الجمعة (Al-jumu'a)", "الأحد (Al-ahad)"],
    correctAnswer: 2,
    explanation: "Al-jumu'a is Friday."
  },
  {
    id: 60,
    text: "How do you say 'I like...' or 'I love...'?",
    options: ["أكره (Akrah)", "أحب (Uhibb)", "أريد (Urid)", "أفهم (Afham)"],
    correctAnswer: 1,
    explanation: "Uhibb is I like/love."
  },
  {
    id: 61,
    text: "What is 'Friend' (male) in Arabic?",
    options: ["عدو (Adou)", "صديق (Sadiq)", "زميل (Zamil)", "رفيق (Rafiq)"],
    correctAnswer: 1,
    explanation: "Sadiq is the general word for friend."
  },
  {
    id: 62,
    text: "Translate 'Meat':",
    options: ["دجاج (Dajaj)", "سمك (Samak)", "لحم (Lahm)", "بيض (Bayd)"],
    correctAnswer: 2,
    explanation: "Lahm is meat."
  },
  {
    id: 63,
    text: "What is 'Green' in Arabic?",
    options: ["أصفر (Asfar)", "أخضر (Akhdar)", "بني (Bunni)", "برتقالي (Burtuqali)"],
    correctAnswer: 1,
    explanation: "Akhdar is green."
  },
  {
    id: 64,
    text: "How do you say 'I want...'?",
    options: ["أذهب (Adhhab)", "أشرب (Ashrab)", "أريد (Urid)", "أكتب (Aktub)"],
    correctAnswer: 2,
    explanation: "Urid comes from the verb 'Arada'."
  },
  {
    id: 65,
    text: "Arabic is a ____ language.",
    options: ["Romance", "Germanic", "Semitic", "Slavic"],
    correctAnswer: 2,
    explanation: "It belongs to the Semitic branch of the Afroasiatic family."
  },
  {
    id: 66,
    text: "What is 'Night' in Arabic?",
    options: ["نهار (Nahar)", "يوم (Yawm)", "ليل (Layl)", "صباح (Sabah)"],
    correctAnswer: 2,
    explanation: "Layl is night."
  },
  {
    id: 67,
    text: "The Arabic word for 'Window' is:",
    options: ["باب (Bab)", "نافذة (Nafidha)", "جدار (Jidar)", "سقف (Saqf)"],
    correctAnswer: 1,
    explanation: "Nafidha or Shubbak means window."
  },
  {
    id: 68,
    text: "Translate 'Old' (for things, masculine):",
    options: ["جديد (Jadid)", "قديم (Qadim)", "شاب (Shabb)", "عجوز (Ajouz)"],
    correctAnswer: 1,
    explanation: "Qadim is old."
  },
  {
    id: 69,
    text: "What is 'Blue' in Arabic?",
    options: ["أرجواني (Urjuwani)", "أزرق (Azraq)", "رمادي (Ramadi)", "وردي (Wardi)"],
    correctAnswer: 1,
    explanation: "Azraq is blue."
  },
  {
    id: 70,
    text: "How do you say 'Door'?",
    options: ["غرفة (Ghurfa)", "مطبخ (Matbakh)", "باب (Bab)", "كرسي (Kursi)"],
    correctAnswer: 2,
    explanation: "Bab is door."
  },
  {
    id: 71,
    text: "What is 'Chicken' in Arabic?",
    options: ["دجاج (Dajaj)", "بط (Batt)", "أرنب (Arnab)", "خروف (Kharouf)"],
    correctAnswer: 0,
    explanation: "Dajaj is chicken."
  },
  {
    id: 72,
    text: "Translate 'Beautiful' (feminine):",
    options: ["قبيح (Qabih)", "جميل (Jamil)", "جميلة (Jamila)", "رائع (Ra'i')"],
    correctAnswer: 2,
    explanation: "Jamila is the feminine form."
  },
  {
    id: 73,
    text: "What is 'Sunday' in Arabic?",
    options: ["الأحد (Al-ahad)", "الاثنين (Al-ithnayn)", "الثلاثاء (Al-thulatha')", "الأربعاء (Al-arbi'a')"],
    correctAnswer: 0,
    explanation: "Al-ahad is literally 'the first' (referring to the first day of the week)."
  },
  {
    id: 74,
    text: "Which word means 'House'?",
    options: ["مدرسة (Madrasa)", "كلية (Kulliya)", "بيت (Bayt)", "مكتبة (Maktaba)"],
    correctAnswer: 2,
    explanation: "Bayt or Manzil means house."
  },
  {
    id: 75,
    text: "What is 'Chair' in Arabic?",
    options: ["طاولة (Tawila)", "كنبة (Kanaba)", "كرسي (Kursi)", "سرير (Sarir)"],
    correctAnswer: 2,
    explanation: "Kursi is chair."
  },
  {
    id: 76,
    text: "Translate 'Short' (masculine):",
    options: ["طويل (Tawil)", "قصير (Qasir)", "واسع (Wasi')", "ضيق (Dayyiq)"],
    correctAnswer: 1,
    explanation: "Qasir is short."
  },
  {
    id: 77,
    text: "What is 'Office' or 'Desk'?",
    options: ["سبورة (Sabboura)", "مكتب (Maktab)", "مختبر (Mukhtabar)", "ملعب (Mal'ab)"],
    correctAnswer: 1,
    explanation: "Maktab means both desk and office."
  },
  {
    id: 78,
    text: "How do you say 'I don't know'?",
    options: ["أعرف (A'rif)", "لا أعرف (La a'rif)", "فهمت (Fahimt)", "لا أفهم (La afham)"],
    correctAnswer: 1,
    explanation: "La + verb negates present tense."
  },
  {
    id: 79,
    text: "What is 'Yellow' in Arabic?",
    options: ["بني (Bunni)", "أصفر (Asfar)", "برتقالي (Burtuqali)", "بنفسجي (Banafsaji)"],
    correctAnswer: 1,
    explanation: "Asfar is yellow."
  },
  {
    id: 80,
    text: "Translate 'Tree':",
    options: ["وردة (Warda)", "زهرة (Zahra)", "شجرة (Shajara)", "عشب (Ushb)"],
    correctAnswer: 2,
    explanation: "Shajara is tree."
  },
  {
    id: 81,
    text: "What is 'Fish' in Arabic?",
    options: ["لحم (Lahm)", "بيض (Bayd)", "سمك (Samak)", "لبن (Laban)"],
    correctAnswer: 2,
    explanation: "Samak is fish."
  },
  {
    id: 82,
    text: "How do you say 'What is this?' (masculine object)?",
    options: ["ما هذه؟ (Ma hadhihi?)", "ما هذا؟ (Ma hadha?)", "من هذا؟ (Man hadha?)", "أين هذا؟ (Ayna hadha?)"],
    correctAnswer: 1,
    explanation: "Hadha is the masculine demonstrative."
  },
  {
    id: 83,
    text: "Translate 'Wide' (masculine):",
    options: ["ضيق (Dayyiq)", "واسع (Wasi')", "بعيد (Ba'id)", "قريب (Qarib)"],
    correctAnswer: 1,
    explanation: "Wasi' is wide or spacious."
  },
  {
    id: 84,
    text: "What is 'School' in Arabic?",
    options: ["جامعة (Jami'a)", "مدرسة (Madrasa)", "مستشفى (Mustashfa)", "فندق (Funduq)"],
    correctAnswer: 1,
    explanation: "Madrasa is school."
  },
  {
    id: 85,
    text: "Which of these means 'Boy'?",
    options: ["رجل (Rajul)", "ولد (Walad)", "بنت (Bint)", "امرأة (Imra'a)"],
    correctAnswer: 1,
    explanation: "Walad is boy."
  },
  {
    id: 86,
    text: "What is 'Hot' (weather) in Arabic?",
    options: ["بارد (Barid)", "حار (Harr)", "معتدل (Mu'tadil)", "غائم (Gha'im)"],
    correctAnswer: 1,
    explanation: "Harr is hot."
  },
  {
    id: 87,
    text: "Translate 'Happy' (masculine):",
    options: ["حزين (Hazin)", "سعيد (Sa'id)", "غاضب (Ghadib)", "تعبان (Ta'ban)"],
    correctAnswer: 1,
    explanation: "Sa'id is happy."
  },
  {
    id: 88,
    text: "What is 'Orange' (the fruit) in Arabic?",
    options: ["موز (Mawz)", "تفاح (Tuffah)", "برتقال (Burtuqal)", "ليمون (Laymoun)"],
    correctAnswer: 2,
    explanation: "Burtuqal is orange."
  },
  {
    id: 89,
    text: "How do you say 'Who is this?' (male person)?",
    options: ["من هذا؟ (Man hadha?)", "ما هذا؟ (Ma hadha?)", "أين هذا؟ (Ayna hadha?)", "كيف هذا؟ (Kayfa hadha?)"],
    correctAnswer: 0,
    explanation: "Man is used for people."
  },
  {
    id: 90,
    text: "What is 'Rice' in Arabic?",
    options: ["عدس (Adas)", "أرز (Arruzz)", "فول (Foul)", "حمص (Hummus)"],
    correctAnswer: 1,
    explanation: "Arruzz or Roz is rice."
  },
  {
    id: 91,
    text: "Translate 'Fast' (masculine):",
    options: ["بطيء (Bati')", "سريع (Sari')", "ثقيل (Thaqil)", "خفيف (Khafif)"],
    correctAnswer: 1,
    explanation: "Sari' is fast."
  },
  {
    id: 92,
    text: "What is 'Eye' in Arabic?",
    options: ["يد (Yad)", "رأس (Ra's)", "عين (Ayn)", "أذن (Udhun)"],
    correctAnswer: 2,
    explanation: "Ayn is eye."
  },
  {
    id: 93,
    text: "Translate 'Clean' (masculine):",
    options: ["متسخ (Mutasikh)", "نظيف (Nadhif)", "مرتب (Murattab)", "فوضوي (Fawdawi)"],
    correctAnswer: 1,
    explanation: "Nadhif is clean."
  },
  {
    id: 94,
    text: "What is 'Hand' in Arabic?",
    options: ["قدم (Qadam)", "يد (Yad)", "قلب (Qalb)", "صدر (Sadr)"],
    correctAnswer: 1,
    explanation: "Yad is hand."
  },
  {
    id: 95,
    text: "Translate 'Rich' (masculine):",
    options: ["فقير (Faqir)", "غني (Ghani)", "كريم (Karim)", "بخيل (Bakhil)"],
    correctAnswer: 1,
    explanation: "Ghani is rich."
  },
  {
    id: 96,
    text: "What is 'Heart' in Arabic?",
    options: ["رئة (Ri'a)", "كبد (Kabid)", "قلب (Qalb)", "معدة (Ma'ida)"],
    correctAnswer: 2,
    explanation: "Qalb is heart."
  },
  {
    id: 97,
    text: "Translate 'Tall' or 'Long' (masculine):",
    options: ["قصير (Qasir)", "طويل (Tawil)", "عريض (Arid)", "عميق (Amia)"],
    correctAnswer: 1,
    explanation: "Tawil is tall/long."
  },
  {
    id: 98,
    text: "What is 'Sea' or 'Ocean' in Arabic?",
    options: ["بحر (Bahr)", "محيط (Muhit)", "بحيرة (Buhayra)", "خليج (Khalij)"],
    correctAnswer: 0,
    explanation: "Bahr is sea, Muhit is ocean."
  },
  {
    id: 99,
    text: "Translate 'Easy' (masculine):",
    options: ["صعب (Sa'b)", "سهل (Sahl)", "ممكن (Mumkin)", "مستحيل (Mustahil)"],
    correctAnswer: 1,
    explanation: "Sahl is easy."
  },
  {
    id: 100,
    text: "What is the meaning of 'كتاب' (Kitab)?",
    options: ["Notebook", "Book", "Magazine", "Newspaper"],
    correctAnswer: 1,
    explanation: "Kitab is book."
  },
  {
    id: 101,
    text: "How do you say 'Pencil' in Arabic?",
    options: ["قلم (Qalam)", "ممحاة (Mimhah)", "مسطرة (Mistara)", "قلم رصاص (Qalam rasas)"],
    correctAnswer: 3,
    explanation: "Qalam rasas is specifically a pencil."
  },
  {
    id: 102,
    text: "Translate 'New' (masculine):",
    options: ["قديم (Qadim)", "جديد (Jadid)", "واسع (Wasi')", "ضيق (Dayyiq)"],
    correctAnswer: 1,
    explanation: "Jadid is new."
  },
  {
    id: 103,
    text: "What is 'Coffee' in Arabic?",
    options: ["شاي (Shay)", "قهوة (Qahwa)", "عصير (Asir)", "ماء (Ma')"],
    correctAnswer: 1,
    explanation: "Qahwa is coffee."
  },
  {
    id: 104,
    text: "Translate 'Big' or 'Great' (masculine):",
    options: ["صغير (Saghir)", "كبير (Kabir)", "طويل (Tawil)", "قصير (Qasir)"],
    correctAnswer: 1,
    explanation: "Kabir is big."
  },
  {
    id: 105,
    text: "What is 'Milk' in Arabic?",
    options: ["ماء (Ma')", "شاي (Shay)", "حليب (Halib)", "عصير (Asir)"],
    correctAnswer: 2,
    explanation: "Halib or Laban is milk."
  },
  {
    id: 106,
    text: "Translate 'Expensive' (masculine):",
    options: ["رخيص (Rakhis)", "غال (Ghal)", "جميل (Jamil)", "قبيح (Qabih)"],
    correctAnswer: 1,
    explanation: "Ghal means expensive."
  },
  {
    id: 107,
    text: "How do you say 'Open' (masculine adjective)?",
    options: ["مغلق (Mughlaq)", "مفتوح (Maftuh)", "قريب (Qarib)", "بعيد (Ba'id)"],
    correctAnswer: 1,
    explanation: "Maftuh is open."
  },
  {
    id: 108,
    text: "Translate 'Near' or 'Close' (masculine):",
    options: ["بعيد (Ba'id)", "قريب (Qarib)", "فوق (Fawqa)", "تحت (Tahta)"],
    correctAnswer: 1,
    explanation: "Qarib is near."
  },
  {
    id: 109,
    text: "What is 'Sugar' in Arabic?",
    options: ["ملح (Milh)", "سكر (Sukkar)", "فلفل (Filfil)", "زيت (Zayt)"],
    correctAnswer: 1,
    explanation: "Sukkar is sugar."
  },
  {
    id: 110,
    text: "Translate 'Small' (masculine):",
    options: ["كبير (Kabir)", "صغير (Saghir)", "واسع (Wasi')", "ضيق (Dayyiq)"],
    correctAnswer: 1,
    explanation: "Saghir is small."
  },
  {
    id: 111,
    text: "What is 'Salt' in Arabic?",
    options: ["سكر (Sukkar)", "ملح (Milh)", "طحين (Tahin)", "بهارات (Baharat)"],
    correctAnswer: 1,
    explanation: "Milh is salt."
  },
  {
    id: 112,
    text: "Translate 'Old' (masculine, for objects):",
    options: ["جديد (Jadid)", "قديم (Qadim)", "جميل (Jamil)", "قبيح (Qabih)"],
    correctAnswer: 1,
    explanation: "Qadim is old (for objects)."
  },
  {
    id: 113,
    text: "What is 'Door' in Arabic?",
    options: ["نافذة (Nafidha)", "باب (Bab)", "جدار (Jidar)", "أرض (Ard)"],
    correctAnswer: 1,
    explanation: "Bab is door."
  },
  {
    id: 114,
    text: "Translate 'Window' in Arabic:",
    options: ["باب (Bab)", "نافذة (Nafidha)", "سقف (Saqf)", "جدار (Jidar)"],
    correctAnswer: 1,
    explanation: "Nafidha or Shubbak means window."
  },
  {
    id: 115,
    text: "How do you say 'Where are you from?' (masculine)?",
    options: ["من أين أنت؟ (Min ayna anta?)", "ما اسمك؟ (Ma ismuka?)", "كيف حالك؟ (Kayfa haluka?)", "كم عمرك؟ (Kam 'umruka?)"],
    correctAnswer: 0,
    explanation: "Min ayna anta? is used for origins."
  },
  {
    id: 116,
    text: "Translate 'Student' (masculine):",
    options: ["معلم (Mu'allim)", "طالب (Talib)", "طبيب (Tabib)", "مهندس (Muhandis)"],
    correctAnswer: 1,
    explanation: "Talib is student."
  },
  {
    id: 117,
    text: "What is 'Bed' in Arabic?",
    options: ["خزانة (Khizana)", "سرير (Sarir)", "كرسي (Kursi)", "طاولة (Tawila)"],
    correctAnswer: 1,
    explanation: "Sarir is bed."
  },
  {
    id: 118,
    text: "Translate 'Eye':",
    options: ["أذن (Udhun)", "عين (Ayn)", "أنف (Anf)", "فم (Fam)"],
    correctAnswer: 1,
    explanation: "Ayn is eye."
  },
  {
    id: 119,
    text: "What is 'Nose' in Arabic?",
    options: ["عين (Ayn)", "أذن (Udhun)", "أنف (Anf)", "لسان (Lisan)"],
    correctAnswer: 2,
    explanation: "Anf is nose."
  },
  {
    id: 120,
    text: "Translate 'Ear':",
    options: ["عين (Ayn)", "أذن (Udhun)", "رأس (Ra's)", "شعر (Sha'r)"],
    correctAnswer: 1,
    explanation: "Udhun is ear."
  },
  {
    id: 121,
    text: "What is 'Head' in Arabic?",
    options: ["يد (Yad)", "رأس (Ra's)", "رجل (Rijl)", "بطن (Batn)"],
    correctAnswer: 1,
    explanation: "Ra's is head."
  },
  {
    id: 122,
    text: "Translate 'Mouth':",
    options: ["أنف (Anf)", "فم (Fam)", "أسنان (Asnan)", "لسان (Lisan)"],
    correctAnswer: 1,
    explanation: "Fam is mouth."
  },
  {
    id: 123,
    text: "What is 'Tooth' in Arabic?",
    options: ["لسان (Lisan)", "سن (Sinn)", "فم (Fam)", "شعر (Sha'r)"],
    correctAnswer: 1,
    explanation: "Sinn is tooth; plurality is Asnan."
  },
  {
    id: 124,
    text: "Translate 'Tongue':",
    options: ["فم (Fam)", "لسان (Lisan)", "عقل (Aql)", "روح (Ruh)"],
    correctAnswer: 1,
    explanation: "Lisan is tongue or language."
  },
  {
    id: 125,
    text: "What is 'Paper' in Arabic?",
    options: ["قلم (Qalam)", "ورقة (Waraqa)", "مكتب (Maktab)", "كرسي (Kursi)"],
    correctAnswer: 1,
    explanation: "Waraqa is paper or leaf."
  }
];
