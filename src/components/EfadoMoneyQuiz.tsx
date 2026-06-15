import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Timer, 
  Brain, 
  Wallet, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Coins,
  Play,
  History,
  ArrowLeft,
  Zap,
  ShieldCheck,
  Star,
  BookOpen,
  HelpCircle,
  RefreshCcw,
  CreditCard,
  ArrowUpRight,
  Smartphone,
  Building2,
  QrCode,
  Hash,
  Copy,
  Fingerprint,
  Globe,
  Bitcoin,
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, QuizQuestion, QuizSession, Transaction } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { PaymentPlatform } from './PaymentPlatform';
import { EasyPaymentPlatform } from './EasyPaymentPlatform';
import { CurrencySelector } from './CurrencySelector';

interface EfadoMoneyQuizProps {
  user: UserProfile;
  onUpdateBalance: (amount: number, type: 'deposit' | 'withdrawal' | 'game_bet' | 'game_win') => Promise<void>;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  onClose?: () => void;
}

const SUBJECTS = [
  'English', 'Christian Religion', 'Islamic Religion', 'Chemistry', 'Physics', 
  'Biology', 'Computer', 'Geography', 'Agric Science', 'Logistics', 
  'Sports', 'Medical', 'Road Traffic', 'Sea', 'Air Travel',
  'Cars and Airplanes', 'Jets', 'Organic Chemistry', 'Mathematics',
  'Money and Banks', 'Markets and Trading', 'Farming and Production',
  'Info Systems', 'Music', 'Video', 'Petroleum', 'Hotels and Travel',
  'Administration', 'Security', 'Cybersecurity', 'Safety', 'Politics',
  'Law Suit', 'General Current Affairs', 'Literature', 'Popular Novels',
  'Animal Kingdom', 'Space Travel', 'Internet', 'Quantum Physics'
];

const STAGES = [
  { name: 'Starter', stake: 10, prize: 20 },
  { name: 'Stage 1', stake: 20, prize: 40 },
  { name: 'Stage 2', stake: 40, prize: 80 },
  { name: 'Stage 3', stake: 80, prize: 160 },
  { name: 'Stage 4', stake: 160, prize: 320 },
  { name: 'Stage 5', stake: 320, prize: 640 },
  { name: 'Stage 6', stake: 640, prize: 1280 },
  { name: 'Stage 7', stake: 1280, prize: 2560 },
  { name: 'Stage 8', stake: 2560, prize: 5120 },
  { name: 'Stage 9', stake: 5120, prize: 10240 },
  { name: 'Stage 10', stake: 10240, prize: 20480 },
  { name: 'Stage 11', stake: 20480, prize: 40960 },
  { name: 'Stage 12', stake: 40960, prize: 81920 },
  { name: 'Stage 13', stake: 81920, prize: 163840 },
  { name: 'Stage 14', stake: 163840, prize: 327680 },
  { name: 'Stage 15', stake: 327680, prize: 655360 },
  { name: 'Stage 16', stake: 655360, prize: 1310720 },
  { name: 'Stage 17', stake: 1310720, prize: 2621440 },
  { name: 'Stage 18', stake: 2621440, prize: 5242880 },
  { name: 'Stage 19', stake: 5242880, prize: 10485760 },
  { name: 'Stage 20', stake: 10485760, prize: 20971520 },
];

const QUESTIONS: QuizQuestion[] = [
  // English
  { id: 'en1', subject: 'English', question: 'Which of these is a synonym for "Abundant"?', options: ['Scarce', 'Plentiful', 'Rare', 'Limited'], correctAnswer: 1 },
  { id: 'en2', subject: 'English', question: 'Identify the noun in: "The quick brown fox jumps over the lazy dog."', options: ['Quick', 'Jumps', 'Fox', 'Lazy'], correctAnswer: 2 },
  // Christian Religion
  { id: 'cr1', subject: 'Christian Religion', question: 'Who was the first king of Israel?', options: ['David', 'Solomon', 'Saul', 'Samuel'], correctAnswer: 2 },
  { id: 'cr2', subject: 'Christian Religion', question: 'How many disciples did Jesus have?', options: ['10', '12', '14', '7'], correctAnswer: 1 },
  // Islamic Religion
  { id: 'ir1', subject: 'Islamic Religion', question: 'What is the first month of the Islamic calendar?', options: ['Ramadan', 'Muharram', 'Shawwal', 'Dhul-Hijjah'], correctAnswer: 1 },
  { id: 'ir2', subject: 'Islamic Religion', question: 'How many times a day do Muslims pray?', options: ['3', '4', '5', '6'], correctAnswer: 2 },
  // Chemistry
  { id: 'ch1', subject: 'Chemistry', question: 'What is the chemical symbol for Gold?', options: ['Ag', 'Au', 'Fe', 'Pb'], correctAnswer: 1 },
  { id: 'ch2', subject: 'Chemistry', question: 'What is the pH of pure water?', options: ['5', '7', '9', '14'], correctAnswer: 1 },
  // Physics
  { id: 'ph1', subject: 'Physics', question: 'What is the unit of electrical resistance?', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], correctAnswer: 2 },
  { id: 'ph2', subject: 'Physics', question: 'Which law states that for every action there is an equal and opposite reaction?', options: ['Newton\'s First Law', 'Newton\'s Second Law', 'Newton\'s Third Law', 'Law of Gravity'], correctAnswer: 2 },
  // Biology
  { id: 'bi1', subject: 'Biology', question: 'What is the "powerhouse" of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Cytoplasm'], correctAnswer: 2 },
  { id: 'bi2', subject: 'Biology', question: 'Which organ is responsible for pumping blood?', options: ['Lungs', 'Liver', 'Heart', 'Kidney'], correctAnswer: 2 },
  // Computer
  { id: 'cp1', subject: 'Computer', question: 'What does RAM stand for?', options: ['Read Access Memory', 'Random Access Memory', 'Run Active Memory', 'Rapid Access Module'], correctAnswer: 1 },
  { id: 'cp2', subject: 'Computer', question: 'Which of these is an operating system?', options: ['Chrome', 'Windows', 'Python', 'Java'], correctAnswer: 1 },
  // Geography
  { id: 'ge1', subject: 'Geography', question: 'What is the largest continent by land area?', options: ['Africa', 'Asia', 'North America', 'Europe'], correctAnswer: 1 },
  { id: 'ge2', subject: 'Geography', question: 'Which river is the longest in the world?', options: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], correctAnswer: 1 },
  // Agric Science
  { id: 'ag1', subject: 'Agric Science', question: 'Which of these is a cash crop?', options: ['Maize', 'Cocoa', 'Yam', 'Cassava'], correctAnswer: 1 },
  { id: 'ag2', subject: 'Agric Science', question: 'What is the process of removing weeds called?', options: ['Pruning', 'Mulching', 'Weeding', 'Threshing'], correctAnswer: 2 },
  // Logistics
  { id: 'lo1', subject: 'Logistics', question: 'What does "ETA" stand for in logistics?', options: ['Estimated Time of Arrival', 'Estimated Travel Area', 'Emergency Transport Alert', 'Electronic Tracking Asset'], correctAnswer: 0 },
  { id: 'lo2', subject: 'Logistics', question: 'Which document is used as a contract for carriage of goods?', options: ['Invoice', 'Bill of Lading', 'Packing List', 'Manifest'], correctAnswer: 1 },
  // Sports
  { id: 'sp1', subject: 'Sports', question: 'How many players are on a standard soccer team on the pitch?', options: ['9', '10', '11', '12'], correctAnswer: 2 },
  { id: 'sp2', subject: 'Sports', question: 'In which sport is the term "Home Run" used?', options: ['Cricket', 'Baseball', 'Tennis', 'Golf'], correctAnswer: 1 },
  // Medical
  { id: 'me1', subject: 'Medical', question: 'What is the normal body temperature in Celsius?', options: ['35°C', '37°C', '39°C', '41°C'], correctAnswer: 1 },
  { id: 'me2', subject: 'Medical', question: 'Which vitamin is produced when skin is exposed to sunlight?', options: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'], correctAnswer: 3 },
  // Road Traffic
  { id: 'rt1', subject: 'Road Traffic', question: 'What does a red octagonal sign usually mean?', options: ['Yield', 'Stop', 'Go', 'Slow Down'], correctAnswer: 1 },
  { id: 'rt2', subject: 'Road Traffic', question: 'What is the meaning of a flashing yellow light?', options: ['Stop immediately', 'Proceed with caution', 'Speed up', 'Road closed'], correctAnswer: 1 },
  // Sea
  { id: 'se1', subject: 'Sea', question: 'What is the unit of speed used in maritime navigation?', options: ['Knot', 'Mile', 'Kilometer', 'League'], correctAnswer: 0 },
  { id: 'se2', subject: 'Sea', question: 'Which is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 3 },
  // Air Travel
  { id: 'at1', subject: 'Air Travel', question: 'What is the "Black Box" in an airplane actually colored?', options: ['Black', 'White', 'Orange', 'Blue'], correctAnswer: 2 },
  { id: 'at2', subject: 'Air Travel', question: 'Which part of the plane provides lift?', options: ['Engine', 'Tail', 'Wings', 'Fuselage'], correctAnswer: 2 },
  // Additional Medical
  { id: 'me3', subject: 'Medical', question: 'What is the largest organ in the human body?', options: ['Heart', 'Liver', 'Skin', 'Lungs'], correctAnswer: 2 },
  { id: 'me4', subject: 'Medical', question: 'What is the normal adult resting heart rate in beats per minute (bpm)?', options: ['40-60', '60-100', '100-120', '120-140'], correctAnswer: 1 },
  { id: 'me5', subject: 'Medical', question: 'Which blood cells are primarily responsible for oxygen transport?', options: ['White blood cells', 'Platelets', 'Red blood cells', 'Plasma'], correctAnswer: 2 },
  { id: 'me6', subject: 'Medical', question: 'What is the chemical symbol for water?', options: ['CO2', 'O2', 'H2O', 'NaCl'], correctAnswer: 2 },
  { id: 'me7', subject: 'Medical', question: 'Which organ filters waste from the blood?', options: ['Liver', 'Kidneys', 'Heart', 'Bladder'], correctAnswer: 1 },
  { id: 'me8', subject: 'Medical', question: 'What is the medical term for a heart attack?', options: ['Stroke', 'Myocardial infarction', 'Cardiac arrest', 'Hypertension'], correctAnswer: 1 },
  { id: 'me9', subject: 'Medical', question: 'Which nutrient is the main source of energy for the brain?', options: ['Protein', 'Fat', 'Glucose', 'Fiber'], correctAnswer: 2 },
  { id: 'me10', subject: 'Medical', question: 'What disease is characterized by high blood sugar levels?', options: ['Asthma', 'Diabetes mellitus', 'Arthritis', 'Anemia'], correctAnswer: 1 },
  { id: 'me11', subject: 'Medical', question: 'Which vaccination protects against diphtheria, tetanus, and pertussis?', options: ['MMR', 'BCG', 'DTP/DTaP', 'Polio'], correctAnswer: 2 },
  { id: 'me12', subject: 'Medical', question: 'What are the two main types of cholesterol?', options: ['ABC and XYZ', 'HDL and LDL', 'FAT and OIL', 'RED and WHITE'], correctAnswer: 1 },
  { id: 'me13', subject: 'Medical', question: 'Which mineral is essential for bone health and calcium absorption?', options: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin K'], correctAnswer: 2 },
  { id: 'me14', subject: 'Medical', question: 'Which organ is mainly responsible for insulin production?', options: ['Liver', 'Pancreas', 'Spleen', 'Gallbladder'], correctAnswer: 1 },
  { id: 'me15', subject: 'Medical', question: 'What is the medical term for low blood sugar?', options: ['Hyperglycemia', 'Hypoglycemia', 'Hypertension', 'Hypotension'], correctAnswer: 1 },
  { id: 'me16', subject: 'Medical', question: 'Which device is used to listen to heart and lungs?', options: ['Thermometer', 'Stethoscope', 'Sphygmomanometer', 'Otoscope'], correctAnswer: 1 },
  { id: 'me17', subject: 'Medical', question: 'What is the medical term for a stroke?', options: ['Heart attack', 'Cerebrovascular accident', 'Seizure', 'Fainting'], correctAnswer: 1 },
  { id: 'me18', subject: 'Medical', question: 'Which organ produces bile?', options: ['Stomach', 'Liver', 'Pancreas', 'Kidneys'], correctAnswer: 1 },
  { id: 'me19', subject: 'Medical', question: 'What is the primary function of red blood cells?', options: ['Fighting infection', 'Blood clotting', 'Oxygen transport', 'Waste removal'], correctAnswer: 2 },
  { id: 'me20', subject: 'Medical', question: 'What is the recommended daily water intake for an average adult?', options: ['0.5-1 liter', '1-2 liters', '2-3 liters', '4-5 liters'], correctAnswer: 2 },
  // Additional Road Traffic
  { id: 'rt3', subject: 'Road Traffic', question: 'Which side of the road is used for driving in the UK?', options: ['Right', 'Left', 'Middle', 'Both'], correctAnswer: 1 },
  { id: 'rt4', subject: 'Road Traffic', question: 'What does a red traffic light indicate?', options: ['Go', 'Slow Down', 'Stop', 'Yield'], correctAnswer: 2 },
  { id: 'rt5', subject: 'Road Traffic', question: 'What is the legal BAC limit in many countries?', options: ['0.01-0.02%', '0.05-0.08%', '0.10-0.15%', '0.20-0.25%'], correctAnswer: 1 },
  { id: 'rt6', subject: 'Road Traffic', question: 'What should you do at a four-way stop?', options: ['Speed up', 'Yield to the first vehicle', 'Ignore other cars', 'Honk and go'], correctAnswer: 1 },
  { id: 'rt7', subject: 'Road Traffic', question: 'Which sign indicates a pedestrian crossing?', options: ['Stop sign', 'Yield sign', 'Zebra crossing sign', 'No entry sign'], correctAnswer: 2 },
  { id: 'rt8', subject: 'Road Traffic', question: 'What is the meaning of a yellow/amber traffic light?', options: ['Go faster', 'Prepare to stop', 'Stop immediately', 'Turn left'], correctAnswer: 1 },
  { id: 'rt9', subject: 'Road Traffic', question: 'What is the typical minimum following distance in good conditions?', options: ['1 second', '2 seconds', '5 seconds', '10 seconds'], correctAnswer: 1 },
  { id: 'rt10', subject: 'Road Traffic', question: 'Which vehicle has right of way at a roundabout?', options: ['Vehicles entering', 'Vehicles inside', 'The fastest vehicle', 'Bicycles only'], correctAnswer: 1 },
  { id: 'rt11', subject: 'Road Traffic', question: 'What does a solid white line in the center of the road imply?', options: ['Overtaking allowed', 'No crossing or passing', 'Parking allowed', 'Pedestrian zone'], correctAnswer: 1 },
  { id: 'rt12', subject: 'Road Traffic', question: 'Which device helps enforce speed limits remotely?', options: ['Radar gun', 'Speed camera', 'Tachometer', 'GPS'], correctAnswer: 1 },
  { id: 'rt13', subject: 'Road Traffic', question: 'What is the purpose of a seatbelt?', options: ['Comfort', 'Restrain occupants', 'Decoration', 'Hold the door'], correctAnswer: 1 },
  { id: 'rt14', subject: 'Road Traffic', question: 'What should you do after a tire blowout?', options: ['Brake hard', 'Slowly brake and steer to safety', 'Accelerate', 'Jump out'], correctAnswer: 1 },
  { id: 'rt15', subject: 'Road Traffic', question: 'What is the meaning of a red "X" over a lane?', options: ['Lane open', 'Lane closed', 'Speed limit 10', 'Exit here'], correctAnswer: 1 },
  { id: 'rt16', subject: 'Road Traffic', question: 'What should you do in a school zone?', options: ['Speed up', 'Slow down and be vigilant', 'Turn off lights', 'Stop and wait'], correctAnswer: 1 },
  { id: 'rt17', subject: 'Road Traffic', question: 'What is ABS in a car?', options: ['Automatic Braking System', 'Anti-lock Braking System', 'Advanced Battery System', 'Air Balance System'], correctAnswer: 1 },
  { id: 'rt18', subject: 'Road Traffic', question: 'Which sign warns of a sharp left turn?', options: ['Chevron arrow', 'Stop sign', 'Yield sign', 'No parking'], correctAnswer: 0 },
  { id: 'rt19', subject: 'Road Traffic', question: 'What color are warning signs typically?', options: ['Red', 'Green', 'Yellow', 'Blue'], correctAnswer: 2 },
  { id: 'rt20', subject: 'Road Traffic', question: 'What is the correct use of turn signals?', options: ['Turn them on after turning', 'Indicate 100ft before turning', 'Don\'t use them', 'Use only at night'], correctAnswer: 1 },
  // Law Suit
  { id: 'ls1', subject: 'Law Suit', question: 'What is a formal written request to a court asking for relief?', options: ['Letter', 'Pleadings or petition', 'Email', 'Note'], correctAnswer: 1 },
  { id: 'ls2', subject: 'Law Suit', question: 'Which document initiates most civil lawsuits?', options: ['Verdict', 'Complaint', 'Warrant', 'Decree'], correctAnswer: 1 },
  { id: 'ls3', subject: 'Law Suit', question: 'What are the two main types of legal systems?', options: ['Good and Bad', 'Common law and civil law', 'Old and New', 'Local and Global'], correctAnswer: 1 },
  { id: 'ls4', subject: 'Law Suit', question: 'What is a subpoena?', options: ['A gift', 'A court order to appear', 'A type of lawyer', 'A legal fee'], correctAnswer: 1 },
  { id: 'ls5', subject: 'Law Suit', question: 'Who has the burden of proof in a criminal case?', options: ['The defense', 'The judge', 'The prosecution', 'The jury'], correctAnswer: 2 },
  { id: 'ls6', subject: 'Law Suit', question: 'What is double jeopardy?', options: ['Winning twice', 'Being tried twice for same offense', 'A game show', 'Losing a case'], correctAnswer: 1 },
  { id: 'ls7', subject: 'Law Suit', question: 'What is a settlement?', options: ['A new city', 'Agreement outside court', 'A legal battle', 'A court ruling'], correctAnswer: 1 },
  { id: 'ls8', subject: 'Law Suit', question: 'What does "prima facie" mean?', options: ['At first glance', 'The end', 'After the fact', 'Under oath'], correctAnswer: 0 },
  { id: 'ls9', subject: 'Law Suit', question: 'What is jurisdiction?', options: ['A type of law', 'Authority of a court', 'A legal document', 'A jury member'], correctAnswer: 1 },
  { id: 'ls10', subject: 'Law Suit', question: 'What is a summary judgment?', options: ['A quick trial', 'Ruling without a trial', 'A short verdict', 'A jury decision'], correctAnswer: 1 },
  { id: 'ls11', subject: 'Law Suit', question: 'Which document outlines charges in a criminal case?', options: ['Receipt', 'Indictment', 'Contract', 'Will'], correctAnswer: 1 },
  { id: 'ls12', subject: 'Law Suit', question: 'What is an amicus curiae?', options: ['A friend of the court', 'A secret witness', 'A legal error', 'A type of judge'], correctAnswer: 0 },
  { id: 'ls13', subject: 'Law Suit', question: 'What is "med mal"?', options: ['Medical malpractice', 'Media malfunction', 'Medium mall', 'Medical male'], correctAnswer: 0 },
  { id: 'ls14', subject: 'Law Suit', question: 'What is a tort?', options: ['A cake', 'A civil wrong', 'A criminal act', 'A legal right'], correctAnswer: 1 },
  { id: 'ls15', subject: 'Law Suit', question: 'What is a bench trial?', options: ['Trial in a park', 'Trial by judge only', 'Trial with no judge', 'Trial by jury'], correctAnswer: 1 },
  { id: 'ls16', subject: 'Law Suit', question: 'What is a subpoena duces tecum?', options: ['Order to testify', 'Order to produce documents', 'Order to arrest', 'Order to pay'], correctAnswer: 1 },
  { id: 'ls17', subject: 'Law Suit', question: 'What is "relief" in a civil case?', options: ['A break', 'Remedies like damages', 'A new judge', 'A dismissal'], correctAnswer: 1 },
  { id: 'ls18', subject: 'Law Suit', question: 'What is res judicata?', options: ['A new case', 'A matter already judged', 'A legal theory', 'A court delay'], correctAnswer: 1 },
  { id: 'ls19', subject: 'Law Suit', question: 'What is the standard of proof in criminal cases?', options: ['More likely than not', 'Beyond a reasonable doubt', 'Clear and convincing', 'Absolute certainty'], correctAnswer: 1 },
  { id: 'ls20', subject: 'Law Suit', question: 'What is a common contract breach remedy?', options: ['Apology', 'Damages', 'Nothing', 'A new contract'], correctAnswer: 1 },
  // Additional Christian Religion (Bible)
  { id: 'cr3', subject: 'Christian Religion', question: 'Who built the ark?', options: ['Moses', 'Noah', 'Abraham', 'David'], correctAnswer: 1 },
  { id: 'cr4', subject: 'Christian Religion', question: 'Which gospel begins with "In the beginning was the Word"?', options: ['Matthew', 'Mark', 'Luke', 'John'], correctAnswer: 3 },
  { id: 'cr5', subject: 'Christian Religion', question: 'What is the first book of the Bible?', options: ['Exodus', 'Genesis', 'Leviticus', 'Numbers'], correctAnswer: 1 },
  { id: 'cr6', subject: 'Christian Religion', question: 'Who led the Israelites out of Egypt?', options: ['Joshua', 'Moses', 'Aaron', 'Caleb'], correctAnswer: 1 },
  { id: 'cr7', subject: 'Christian Religion', question: 'Which apostle betrayed Jesus?', options: ['Peter', 'Judas Iscariot', 'Thomas', 'Andrew'], correctAnswer: 1 },
  { id: 'cr8', subject: 'Christian Religion', question: 'What is the longest chapter in the Bible?', options: ['Psalm 23', 'Psalm 119', 'Psalm 150', 'Psalm 1'], correctAnswer: 1 },
  { id: 'cr9', subject: 'Christian Religion', question: 'Which body of water did Jesus calm with his word?', options: ['Jordan River', 'Sea of Galilee', 'Dead Sea', 'Nile'], correctAnswer: 1 },
  { id: 'cr10', subject: 'Christian Religion', question: 'What is the symbolic number of completion used in Revelation?', options: ['Three', 'Seven', 'Twelve', 'Forty'], correctAnswer: 1 },
  { id: 'cr11', subject: 'Christian Religion', question: 'Who was swallowed by a big fish?', options: ['Job', 'Jonah', 'Jeremiah', 'Joel'], correctAnswer: 1 },
  { id: 'cr12', subject: 'Christian Religion', question: 'What is the first of the Ten Commandments?', options: ['Honor your father', 'You shall have no other gods', 'Do not kill', 'Do not steal'], correctAnswer: 1 },
  { id: 'cr13', subject: 'Christian Religion', question: 'Which book contains the Sermon on the Mount?', options: ['Matthew', 'Mark', 'Luke', 'John'], correctAnswer: 0 },
  { id: 'cr14', subject: 'Christian Religion', question: 'Who denied Jesus three times?', options: ['John', 'Peter', 'James', 'Jude'], correctAnswer: 1 },
  { id: 'cr15', subject: 'Christian Religion', question: 'What is the shortest verse in the Bible?', options: ['God is love', 'Jesus wept', 'Pray without ceasing', 'Rejoice always'], correctAnswer: 1 },
  { id: 'cr16', subject: 'Christian Religion', question: 'Which apostle is known as the "disciple whom Jesus loved"?', options: ['Peter', 'John', 'James', 'Philip'], correctAnswer: 1 },
  { id: 'cr17', subject: 'Christian Religion', question: 'What miracle did Jesus perform at Cana?', options: ['Healing the blind', 'Turning water into wine', 'Walking on water', 'Raising Lazarus'], correctAnswer: 1 },
  { id: 'cr18', subject: 'Christian Religion', question: 'Which Old Testament figure endured great trials of faith?', options: ['Joseph', 'Job', 'Jacob', 'Jonah'], correctAnswer: 1 },
  { id: 'cr19', subject: 'Christian Religion', question: 'What are the primary languages of most of the Bible?', options: ['Latin', 'Hebrew and Greek', 'English', 'Aramaic'], correctAnswer: 1 },
  { id: 'cr20', subject: 'Christian Religion', question: 'What is the last book of the Bible?', options: ['Jude', 'Revelation', 'Hebrews', 'Acts'], correctAnswer: 1 },
  // Additional Islamic Religion (Quran)
  { id: 'ir3', subject: 'Islamic Religion', question: 'What is the name of the Prophet in Islam?', options: ['Isa', 'Muhammad', 'Musa', 'Ibrahim'], correctAnswer: 1 },
  { id: 'ir4', subject: 'Islamic Religion', question: 'Which city is considered the holiest in Islam?', options: ['Medina', 'Mecca', 'Jerusalem', 'Cairo'], correctAnswer: 1 },
  { id: 'ir5', subject: 'Islamic Religion', question: 'What is the holy book of Islam?', options: ['Torah', 'Quran', 'Bible', 'Psalms'], correctAnswer: 1 },
  { id: 'ir6', subject: 'Islamic Religion', question: 'Which direction do Muslims face during prayer?', options: ['Mihrab', 'Qibla', 'Minbar', 'Kaaba'], correctAnswer: 1 },
  { id: 'ir7', subject: 'Islamic Religion', question: 'What is Ramadan?', options: ['Month of pilgrimage', 'Month of fasting', 'Month of charity', 'Month of prayer'], correctAnswer: 1 },
  { id: 'ir8', subject: 'Islamic Religion', question: 'Which angel delivered revelations to Muhammad?', options: ['Angel Michael', 'Angel Gabriel', 'Angel Raphael', 'Angel Azrael'], correctAnswer: 1 },
  { id: 'ir9', subject: 'Islamic Religion', question: 'How many chapters (surahs) does the Quran have?', options: ['100', '114', '120', '150'], correctAnswer: 1 },
  { id: 'ir10', subject: 'Islamic Religion', question: 'What is the first surah in the Quran?', options: ['Al-Baqarah', 'Al-Fatiha', 'Al-Ikhlas', 'Al-Nas'], correctAnswer: 1 },
  { id: 'ir11', subject: 'Islamic Religion', question: 'What is the term for mandatory charity in Islam?', options: ['Sadaqah', 'Zakat', 'Hajj', 'Salat'], correctAnswer: 1 },
  { id: 'ir12', subject: 'Islamic Religion', question: 'Which month is associated with fasting?', options: ['Shawwal', 'Ramadan', 'Muharram', 'Safar'], correctAnswer: 1 },
  { id: 'ir13', subject: 'Islamic Religion', question: 'What is the annual pilgrimage to Mecca called?', options: ['Umrah', 'Hajj', 'Ziyarat', 'Tawaf'], correctAnswer: 1 },
  { id: 'ir14', subject: 'Islamic Religion', question: 'What is the term for "lawful" in Islam?', options: ['Haram', 'Halal', 'Makruh', 'Mubah'], correctAnswer: 1 },
  { id: 'ir15', subject: 'Islamic Religion', question: 'What is the term for good deeds in Islam?', options: ['Sayyiat', 'Hasanat', 'Barakah', 'Iman'], correctAnswer: 1 },
  { id: 'ir16', subject: 'Islamic Religion', question: 'What is the night journey of Muhammad called?', options: ['Hijra', 'Isra and Mi\'raj', 'Fath Mecca', 'Uhud'], correctAnswer: 1 },
  { id: 'ir17', subject: 'Islamic Religion', question: 'What is the term for God in Arabic?', options: ['Rabb', 'Allah', 'Ilah', 'Malik'], correctAnswer: 1 },
  { id: 'ir18', subject: 'Islamic Religion', question: 'Which language is primarily used in the Quran?', options: ['Persian', 'Arabic', 'Turkish', 'Urdu'], correctAnswer: 1 },
  { id: 'ir19', subject: 'Islamic Religion', question: 'What is the Arabic word for prayer?', options: ['Sawm', 'Salat', 'Zakat', 'Hajj'], correctAnswer: 1 },
  { id: 'ir20', subject: 'Islamic Religion', question: 'What is the Day of Judgment called in Islam?', options: ['Yawm al-Jumu\'ah', 'Yawm al-Din', 'Yawm al-Eid', 'Yawm al-Arafah'], correctAnswer: 1 },
  // General Current Affairs
  { id: 'gca1', subject: 'General Current Affairs', question: 'Which year did the WHO declare COVID-19 a pandemic?', options: ['2019', '2020', '2021', '2022'], correctAnswer: 1 },
  { id: 'gca2', subject: 'General Current Affairs', question: 'Which international organization coordinates climate agreements?', options: ['NATO', 'United Nations', 'G7', 'OPEC'], correctAnswer: 1 },
  { id: 'gca3', subject: 'General Current Affairs', question: 'Which country hosted COP28 in 2023?', options: ['Egypt', 'United Arab Emirates', 'UK', 'France'], correctAnswer: 1 },
  { id: 'gca4', subject: 'General Current Affairs', question: 'What is the term for a sharp decrease in global temperature?', options: ['Global cooling', 'Climate anomaly', 'Ice age', 'El Nino'], correctAnswer: 1 },
  { id: 'gca5', subject: 'General Current Affairs', question: 'Which region is experiencing rapid population growth?', options: ['Europe', 'Sub-Saharan Africa', 'North America', 'East Asia'], correctAnswer: 1 },
  { id: 'gca6', subject: 'General Current Affairs', question: 'What is the primary purpose of the WTO?', options: ['Maintain peace', 'Regulate international trade', 'Provide loans', 'Protect environment'], correctAnswer: 1 },
  { id: 'gca7', subject: 'General Current Affairs', question: 'Which country is the largest emitter of CO2 as of 2023?', options: ['USA', 'China', 'India', 'Russia'], correctAnswer: 1 },
  { id: 'gca8', subject: 'General Current Affairs', question: 'What is the main goal of the Paris Agreement?', options: ['End poverty', 'Limit global warming', 'Stop wars', 'Protect oceans'], correctAnswer: 1 },
  { id: 'gca9', subject: 'General Current Affairs', question: 'Which organization monitors global economic trends?', options: ['WHO', 'IMF or World Bank', 'UNESCO', 'UNICEF'], correctAnswer: 1 },
  { id: 'gca10', subject: 'General Current Affairs', question: 'What is the term for a global health emergency?', options: ['PANDEMIC', 'PHEIC', 'EMERGENCY', 'ALERT'], correctAnswer: 1 },
  { id: 'gca11', subject: 'General Current Affairs', question: 'Which region has seen rapid urbanization in the last decade?', options: ['Europe', 'Asia and Africa', 'South America', 'Oceania'], correctAnswer: 1 },
  { id: 'gca12', subject: 'General Current Affairs', question: 'What is the primary function of the International Court of Justice?', options: ['Judging criminals', 'Settling disputes between states', 'Making laws', 'Policing borders'], correctAnswer: 1 },
  { id: 'gca13', subject: 'General Current Affairs', question: 'Which country leads in internet users per capita?', options: ['USA', 'Estonia', 'Japan', 'South Korea'], correctAnswer: 1 },
  { id: 'gca14', subject: 'General Current Affairs', question: 'What is the main purpose of economic sanctions?', options: ['Start wars', 'Pressure policy changes', 'Increase trade', 'Help poor'], correctAnswer: 1 },
  { id: 'gca15', subject: 'General Current Affairs', question: 'Which body sets global food safety standards?', options: ['ISO', 'Codex Alimentarius', 'FDA', 'WHO'], correctAnswer: 1 },
  { id: 'gca16', subject: 'General Current Affairs', question: 'What does "sustainability" mean in business?', options: ['Making profit', 'Meeting present needs without compromising future', 'Growing fast', 'Saving money'], correctAnswer: 1 },
  { id: 'gca17', subject: 'General Current Affairs', question: 'Which energy source is growing fastest globally?', options: ['Coal', 'Renewables', 'Oil', 'Nuclear'], correctAnswer: 1 },
  { id: 'gca18', subject: 'General Current Affairs', question: 'What is the term for a market that is falling?', options: ['Bull market', 'Bear market', 'Sideways market', 'Volatile market'], correctAnswer: 1 },
  { id: 'gca19', subject: 'General Current Affairs', question: 'What is the main goal of the United Nations?', options: ['Control oil', 'Maintain international peace', 'Rule the world', 'Fix economy'], correctAnswer: 1 },
  { id: 'gca20', subject: 'General Current Affairs', question: 'Which technology is transforming supply chains with real-time tracking?', options: ['AI', 'Blockchain and RFID', 'Cloud', '5G'], correctAnswer: 1 },
  // Literature (Figures of Speech)
  { id: 'lit1', subject: 'Literature', question: 'What is a simile?', options: ['Comparison using like or as', 'Describes one thing as another', 'Human traits to non-human', 'Repetition of sounds'], correctAnswer: 0 },
  { id: 'lit2', subject: 'Literature', question: 'What is a metaphor?', options: ['Comparison using like or as', 'Describes one thing as another', 'Human traits to non-human', 'Repetition of sounds'], correctAnswer: 1 },
  { id: 'lit3', subject: 'Literature', question: 'What is personification?', options: ['Comparison using like or as', 'Describes one thing as another', 'Human traits to non-human', 'Repetition of sounds'], correctAnswer: 2 },
  { id: 'lit4', subject: 'Literature', question: 'What is alliteration?', options: ['Repetition of initial consonant', 'Word that imitates sound', 'Exaggerated statement', 'Mild word'], correctAnswer: 0 },
  { id: 'lit5', subject: 'Literature', question: 'What is onomatopoeia?', options: ['Repetition of initial consonant', 'Word that imitates sound', 'Exaggerated statement', 'Mild word'], correctAnswer: 1 },
  { id: 'lit6', subject: 'Literature', question: 'What is hyperbole?', options: ['Repetition of initial consonant', 'Word that imitates sound', 'Exaggerated statement', 'Mild word'], correctAnswer: 2 },
  { id: 'lit7', subject: 'Literature', question: 'What is an oxymoron?', options: ['Opposite words combined', 'Mild word', 'Repetition of vowel', 'Contradictory statement'], correctAnswer: 0 },
  { id: 'lit8', subject: 'Literature', question: 'What is a euphemism?', options: ['Opposite words combined', 'Mild word', 'Repetition of vowel', 'Contradictory statement'], correctAnswer: 1 },
  { id: 'lit9', subject: 'Literature', question: 'What is assonance?', options: ['Opposite words combined', 'Mild word', 'Repetition of vowel', 'Contradictory statement'], correctAnswer: 2 },
  { id: 'lit10', subject: 'Literature', question: 'What is a paradox?', options: ['Opposite words combined', 'Mild word', 'Repetition of vowel', 'Contradictory statement'], correctAnswer: 3 },
  { id: 'lit11', subject: 'Literature', question: 'What is irony?', options: ['Contrast between expectation and reality', 'Out of time period', 'Reference to another work', 'Long simile'], correctAnswer: 0 },
  { id: 'lit12', subject: 'Literature', question: 'What is an anachronism?', options: ['Contrast between expectation and reality', 'Out of time period', 'Reference to another work', 'Long simile'], correctAnswer: 1 },
  { id: 'lit13', subject: 'Literature', question: 'What is allusion?', options: ['Contrast between expectation and reality', 'Out of time period', 'Reference to another work', 'Long simile'], correctAnswer: 2 },
  { id: 'lit14', subject: 'Literature', question: 'What is an epic simile?', options: ['Contrast between expectation and reality', 'Out of time period', 'Reference to another work', 'Long simile'], correctAnswer: 3 },
  { id: 'lit15', subject: 'Literature', question: 'What is a refrain?', options: ['Repeated line in poem', 'Harsh mixture of sounds', 'Pleasant sounds', 'Phrase with non-deducible meaning'], correctAnswer: 0 },
  { id: 'lit16', subject: 'Literature', question: 'What is cacophony?', options: ['Repeated line in poem', 'Harsh mixture of sounds', 'Pleasant sounds', 'Phrase with non-deducible meaning'], correctAnswer: 1 },
  { id: 'lit17', subject: 'Literature', question: 'What is euphony?', options: ['Repeated line in poem', 'Harsh mixture of sounds', 'Pleasant sounds', 'Phrase with non-deducible meaning'], correctAnswer: 2 },
  { id: 'lit18', subject: 'Literature', question: 'What is an idiom?', options: ['Repeated line in poem', 'Harsh mixture of sounds', 'Pleasant sounds', 'Phrase with non-deducible meaning'], correctAnswer: 3 },
  { id: 'lit19', subject: 'Literature', question: 'What is synecdoche?', options: ['Part represents whole', 'Related concept stands for something', 'Comparison using like or as', 'Human traits'], correctAnswer: 0 },
  { id: 'lit20', subject: 'Literature', question: 'What is metonymy?', options: ['Part represents whole', 'Related concept stands for something', 'Comparison using like or as', 'Human traits'], correctAnswer: 1 },
  // Popular Novels
  { id: 'nov1', subject: 'Popular Novels', question: 'Who wrote "To Kill a Mockingbird"?', options: ['Mark Twain', 'Harper Lee', 'Ernest Hemingway', 'John Steinbeck'], correctAnswer: 1 },
  { id: 'nov2', subject: 'Popular Novels', question: 'What is the title of George Orwell\'s dystopian novel about surveillance?', options: ['Brave New World', '1984', 'Fahrenheit 451', 'Animal Farm'], correctAnswer: 1 },
  { id: 'nov3', subject: 'Popular Novels', question: 'Who wrote "Pride and Prejudice"?', options: ['Charlotte Bronte', 'Jane Austen', 'Emily Bronte', 'Mary Shelley'], correctAnswer: 1 },
  { id: 'nov4', subject: 'Popular Novels', question: 'What is the fantasy series with a wizard named Harry Potter?', options: ['Lord of the Rings', 'Harry Potter', 'Narnia', 'Percy Jackson'], correctAnswer: 1 },
  { id: 'nov5', subject: 'Popular Novels', question: 'Who wrote "The Hobbit" and "The Lord of the Rings"?', options: ['C.S. Lewis', 'J.R.R. Tolkien', 'George R.R. Martin', 'J.K. Rowling'], correctAnswer: 1 },
  { id: 'nov6', subject: 'Popular Novels', question: 'Which novel starts with "Call me Ishmael."?', options: ['Old Man and the Sea', 'Moby-Dick', 'Treasure Island', 'Robinson Crusoe'], correctAnswer: 1 },
  { id: 'nov7', subject: 'Popular Novels', question: 'Who wrote "The Great Gatsby"?', options: ['Ernest Hemingway', 'F. Scott Fitzgerald', 'William Faulkner', 'T.S. Eliot'], correctAnswer: 1 },
  { id: 'nov8', subject: 'Popular Novels', question: 'What is the setting of "The Catcher in the Rye"?', options: ['London', 'New York City', 'Paris', 'Chicago'], correctAnswer: 1 },
  { id: 'nov9', subject: 'Popular Novels', question: 'Who wrote "Crime and Punishment"?', options: ['Leo Tolstoy', 'Fyodor Dostoevsky', 'Anton Chekhov', 'Ivan Turgenev'], correctAnswer: 1 },
  { id: 'nov10', subject: 'Popular Novels', question: 'What is the title of the first novel in George R.R. Martin\'s series?', options: ['A Clash of Kings', 'A Game of Thrones', 'A Storm of Swords', 'A Feast for Crows'], correctAnswer: 1 },
  { id: 'nov11', subject: 'Popular Novels', question: 'Who wrote "Don Quixote"?', options: ['Dante Alighieri', 'Miguel de Cervantes', 'Homer', 'Virgil'], correctAnswer: 1 },
  { id: 'nov12', subject: 'Popular Novels', question: 'What is the name of the dystopian novel by Aldous Huxley?', options: ['1984', 'Brave New World', 'The Island', 'We'], correctAnswer: 1 },
  { id: 'nov13', subject: 'Popular Novels', question: 'Who wrote "Mansfield Park"?', options: ['Jane Austen', 'George Eliot', 'Virginia Woolf', 'Edith Wharton'], correctAnswer: 0 },
  { id: 'nov14', subject: 'Popular Novels', question: 'Who wrote "The Odyssey"?', options: ['Virgil', 'Homer', 'Sophocles', 'Euripides'], correctAnswer: 1 },
  { id: 'nov15', subject: 'Popular Novels', question: 'What is the title of Margaret Atwood\'s novel about Gilead?', options: ['The Handmaid\'s Tale', 'Oryx and Crake', 'Alias Grace', 'The Blind Assassin'], correctAnswer: 0 },
  { id: 'nov16', subject: 'Popular Novels', question: 'What is the setting of "War and Peace"?', options: ['Victorian England', 'Napoleonic Russia', 'Revolutionary France', 'Civil War USA'], correctAnswer: 1 },
  { id: 'nov17', subject: 'Popular Novels', question: 'Who wrote "Frankenstein"?', options: ['Bram Stoker', 'Mary Shelley', 'Edgar Allan Poe', 'H.P. Lovecraft'], correctAnswer: 1 },
  { id: 'nov18', subject: 'Popular Novels', question: 'What is the magical school in "Harry Potter"?', options: ['Narnia', 'Hogwarts', 'Middle-earth', 'Neverland'], correctAnswer: 1 },
  // Animal Kingdom
  { id: 'ani1', subject: 'Animal Kingdom', question: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Leopard', 'Gazelle'], correctAnswer: 1 },
  { id: 'ani2', subject: 'Animal Kingdom', question: 'Which bird is national symbol of India?', options: ['Parrot', 'Peacock', 'Eagle', 'Owl'], correctAnswer: 1 },
  { id: 'ani3', subject: 'Animal Kingdom', question: 'What is the largest mammal?', options: ['Elephant', 'Blue whale', 'Shark', 'Giraffe'], correctAnswer: 1 },
  { id: 'ani4', subject: 'Animal Kingdom', question: 'Which animal is known as the king of the jungle?', options: ['Tiger', 'Lion', 'Bear', 'Wolf'], correctAnswer: 1 },
  { id: 'ani5', subject: 'Animal Kingdom', question: 'What is the smallest mammal?', options: ['Mouse', 'Bumblebee bat', 'Shrew', 'Hamster'], correctAnswer: 1 },
  { id: 'ani6', subject: 'Animal Kingdom', question: 'Which animal can fly backwards?', options: ['Sparrow', 'Hummingbird', 'Swallow', 'Swift'], correctAnswer: 1 },
  { id: 'ani7', subject: 'Animal Kingdom', question: 'What is the primary cause of coral reef bleaching?', options: ['Pollution', 'Rising sea temperatures', 'Overfishing', 'Tourism'], correctAnswer: 1 },
  { id: 'ani8', subject: 'Animal Kingdom', question: 'Which animal is known for its long neck?', options: ['Ostrich', 'Giraffe', 'Camel', 'Elephant'], correctAnswer: 1 },
  { id: 'ani9', subject: 'Animal Kingdom', question: 'What is the national animal of Australia?', options: ['Koala', 'Red kangaroo', 'Emu', 'Platypus'], correctAnswer: 1 },
  { id: 'ani10', subject: 'Animal Kingdom', question: 'Which animal is famous for its black-and-white stripes?', options: ['Tiger', 'Zebra', 'Panda', 'Skunk'], correctAnswer: 1 },
  { id: 'ani11', subject: 'Animal Kingdom', question: 'What is the largest land animal?', options: ['Rhino', 'African elephant', 'Hippo', 'Giraffe'], correctAnswer: 1 },
  { id: 'ani12', subject: 'Animal Kingdom', question: 'Which animal can survive without water for years?', options: ['Lizards', 'Camels', 'Snakes', 'Rats'], correctAnswer: 1 },
  { id: 'ani13', subject: 'Animal Kingdom', question: 'What is the only mammal capable of true flight?', options: ['Birds', 'Bats', 'Flying squirrels', 'Insects'], correctAnswer: 1 },
  { id: 'ani14', subject: 'Animal Kingdom', question: 'Which animal burrows and makes honeycombs?', options: ['Ants', 'Bees', 'Termites', 'Wasps'], correctAnswer: 1 },
  { id: 'ani15', subject: 'Animal Kingdom', question: 'Which marine mammal is known for intelligence and sonar?', options: ['Shark', 'Dolphin', 'Whale', 'Seal'], correctAnswer: 1 },
  { id: 'ani16', subject: 'Animal Kingdom', question: 'Which animal is known for changing color for camouflage?', options: ['Octopus', 'Chameleon', 'Squid', 'Cuttlefish'], correctAnswer: 1 },
  { id: 'ani17', subject: 'Animal Kingdom', question: 'What is the fastest marine animal?', options: ['Shark', 'Sailfish', 'Tuna', 'Marlin'], correctAnswer: 1 },
  { id: 'ani18', subject: 'Animal Kingdom', question: 'Which animal is a reptile and can glide between trees?', options: ['Snake', 'Flying dragon', 'Frog', 'Turtle'], correctAnswer: 1 },
  { id: 'ani19', subject: 'Animal Kingdom', question: 'Which animal is known as the "ship of the desert"?', options: ['Horse', 'Camel', 'Donkey', 'Mule'], correctAnswer: 1 },
  // Space Travel
  { id: 'spa1', subject: 'Space Travel', question: 'Who was the first human to travel into space?', options: ['Neil Armstrong', 'Yuri Gagarin', 'Buzz Aldrin', 'John Glenn'], correctAnswer: 1 },
  { id: 'spa2', subject: 'Space Travel', question: 'Which mission first landed humans on the Moon?', options: ['Apollo 1', 'Apollo 11', 'Apollo 13', 'Apollo 17'], correctAnswer: 1 },
  { id: 'spa3', subject: 'Space Travel', question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 1 },
  { id: 'spa4', subject: 'Space Travel', question: 'What is the name of the US space agency?', options: ['ESA', 'NASA', 'Roscosmos', 'ISRO'], correctAnswer: 1 },
  { id: 'spa5', subject: 'Space Travel', question: 'Which private company was founded by Elon Musk to reduce space transportation costs?', options: ['Blue Origin', 'SpaceX', 'Virgin Galactic', 'Boeing'], correctAnswer: 1 },
  { id: 'spa6', subject: 'Space Travel', question: 'What is the name of our galaxy?', options: ['Andromeda', 'Milky Way', 'Sombrero', 'Whirlpool'], correctAnswer: 1 },
  { id: 'spa7', subject: 'Space Travel', question: 'What is the center of our solar system?', options: ['Earth', 'Sun', 'Moon', 'Jupiter'], correctAnswer: 1 },
  { id: 'spa8', subject: 'Space Travel', question: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Pluto'], correctAnswer: 1 },
  { id: 'spa9', subject: 'Space Travel', question: 'What is the largest planet in our solar system?', options: ['Saturn', 'Jupiter', 'Uranus', 'Neptune'], correctAnswer: 1 },
  { id: 'spa10', subject: 'Space Travel', question: 'What is the name of the habitable artificial satellite in low Earth orbit?', options: ['Mir', 'ISS', 'Tiangong', 'Skylab'], correctAnswer: 1 },
  { id: 'spa11', subject: 'Space Travel', question: 'Who was the first person to walk on the Moon?', options: ['Yuri Gagarin', 'Neil Armstrong', 'Buzz Aldrin', 'Michael Collins'], correctAnswer: 1 },
  { id: 'spa12', subject: 'Space Travel', question: 'Which planet is famous for its prominent ring system?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctAnswer: 1 },
  { id: 'spa13', subject: 'Space Travel', question: 'Which planet is the hottest in our solar system?', options: ['Mercury', 'Venus', 'Mars', 'Jupiter'], correctAnswer: 1 },
  { id: 'spa14', subject: 'Space Travel', question: 'Which celestial body was reclassified as a dwarf planet in 2006?', options: ['Ceres', 'Pluto', 'Eris', 'Makemake'], correctAnswer: 1 },
  { id: 'spa15', subject: 'Space Travel', question: 'What is the unit of distance used to measure space between stars?', options: ['Kilometer', 'Light-year', 'Astronomical Unit', 'Parsec'], correctAnswer: 1 },
  { id: 'spa16', subject: 'Space Travel', question: 'What is the term for a powerful and luminous stellar explosion?', options: ['Black hole', 'Supernova', 'Nebula', 'Pulsar'], correctAnswer: 1 },
  { id: 'spa17', subject: 'Space Travel', question: 'What is a region of spacetime where gravity is so strong that nothing can escape?', options: ['White dwarf', 'Black hole', 'Neutron star', 'Quasar'], correctAnswer: 1 },
  { id: 'spa18', subject: 'Space Travel', question: 'What was the first artificial satellite launched into space?', options: ['Explorer 1', 'Sputnik 1', 'Vostok 1', 'Apollo 1'], correctAnswer: 1 },
  { id: 'spa19', subject: 'Space Travel', question: 'Which telescope has provided deep space images since 1990?', options: ['James Webb', 'Hubble Space Telescope', 'Kepler', 'Chandra'], correctAnswer: 1 },
  { id: 'spa20', subject: 'Space Travel', question: 'What force keeps planets in orbit around the Sun?', options: ['Magnetism', 'Gravity', 'Friction', 'Inertia'], correctAnswer: 1 },
  // Internet
  { id: 'int1', subject: 'Internet', question: 'Who is credited with inventing the World Wide Web?', options: ['Bill Gates', 'Tim Berners-Lee', 'Steve Jobs', 'Mark Zuckerberg'], correctAnswer: 1 },
  { id: 'int2', subject: 'Internet', question: 'What does every device connected to the internet need to have for identification?', options: ['URL', 'IP address', 'MAC address', 'DNS'], correctAnswer: 1 },
  { id: 'int3', subject: 'Internet', question: 'Which company is the most popular search engine provider?', options: ['Yahoo', 'Google', 'Bing', 'DuckDuckGo'], correctAnswer: 1 },
  { id: 'int4', subject: 'Internet', question: 'What is the standard markup language for creating web pages?', options: ['HTTP', 'HTML', 'URL', 'FTP'], correctAnswer: 1 },
  { id: 'int5', subject: 'Internet', question: 'What technology allows devices to connect to the internet wirelessly?', options: ['Bluetooth', 'Wi-Fi', 'Ethernet', '5G'], correctAnswer: 1 },
  { id: 'int6', subject: 'Internet', question: 'Which social media platform was founded by Mark Zuckerberg?', options: ['Twitter', 'Facebook', 'Instagram', 'LinkedIn'], correctAnswer: 1 },
  { id: 'int7', subject: 'Internet', question: 'Which company is the largest online retailer globally?', options: ['eBay', 'Amazon', 'Walmart', 'Alibaba'], correctAnswer: 1 },
  { id: 'int8', subject: 'Internet', question: 'What is the most popular video-sharing platform?', options: ['Vimeo', 'YouTube', 'Netflix', 'Hulu'], correctAnswer: 1 },
  { id: 'int9', subject: 'Internet', question: 'What protocol is used for transferring web pages over the internet?', options: ['HTML', 'HTTP', 'FTP', 'SMTP'], correctAnswer: 1 },
  { id: 'int10', subject: 'Internet', question: 'What is the term for storing and accessing data over the internet instead of a local hard drive?', options: ['Grid computing', 'Cloud computing', 'Edge computing', 'Fog computing'], correctAnswer: 1 },
  { id: 'int11', subject: 'Internet', question: 'Which device directs data packets between different networks?', options: ['Modem', 'Router', 'Switch', 'Hub'], correctAnswer: 1 },
  { id: 'int12', subject: 'Internet', question: 'What is a security system that monitors and controls incoming and outgoing network traffic?', options: ['Antivirus', 'Firewall', 'VPN', 'Proxy'], correctAnswer: 1 },
  { id: 'int13', subject: 'Internet', question: 'What is the address of a specific web page called?', options: ['URI', 'URL', 'URN', 'URC'], correctAnswer: 1 },
  { id: 'int14', subject: 'Internet', question: 'What are small files stored on a user\'s computer by a website to track activity?', options: ['Cache', 'Cookies', 'History', 'Bookmarks'], correctAnswer: 1 },
  { id: 'int15', subject: 'Internet', question: 'What is a software system designed to search for information on the World Wide Web?', options: ['Browser', 'Search engine', 'Website', 'Portal'], correctAnswer: 1 },
  { id: 'int16', subject: 'Internet', question: 'What is the human-readable name of a website (e.g., google.com)?', options: ['IP address', 'Domain name', 'Hostname', 'Subdomain'], correctAnswer: 1 },
  { id: 'int17', subject: 'Internet', question: 'What is the method of exchanging digital messages between people over a network?', options: ['Chat', 'E-mail', 'SMS', 'VoIP'], correctAnswer: 1 },
  { id: 'int18', subject: 'Internet', question: 'What are interactive technologies that allow the creation and sharing of information via virtual communities?', options: ['News', 'Social media', 'Blogs', 'Forums'], correctAnswer: 1 },
  { id: 'int19', subject: 'Internet', question: 'What is the practice of protecting systems, networks, and programs from digital attacks?', options: ['Networking', 'Cybersecurity', 'Programming', 'Database'], correctAnswer: 1 },
  { id: 'int20', subject: 'Internet', question: 'What is the buying and selling of goods or services using the internet?', options: ['E-business', 'E-commerce', 'E-trading', 'E-banking'], correctAnswer: 1 },
  // Money and Banks
  { id: 'mab1', subject: 'Money and Banks', question: 'Which institution manages a country\'s currency and monetary policy?', options: ['Commercial Bank', 'Central Bank', 'Investment Bank', 'Savings Bank'], correctAnswer: 1 },
  { id: 'mab2', subject: 'Money and Banks', question: 'What is the cost of borrowing money or the reward for saving it?', options: ['Profit rate', 'Interest rate', 'Tax rate', 'Discount rate'], correctAnswer: 1 },
  { id: 'mab3', subject: 'Money and Banks', question: 'What is the term for a general increase in prices and fall in the purchasing value of money?', options: ['Deflation', 'Inflation', 'Stagflation', 'Hyperinflation'], correctAnswer: 1 },
  { id: 'mab4', subject: 'Money and Banks', question: 'Which card allows you to borrow money from a bank up to a certain limit?', options: ['Debit card', 'Credit card', 'Gift card', 'Prepaid card'], correctAnswer: 1 },
  { id: 'mab5', subject: 'Money and Banks', question: 'What is a loan used to purchase a home or other real estate?', options: ['Personal loan', 'Mortgage', 'Car loan', 'Student loan'], correctAnswer: 1 },
  { id: 'mab6', subject: 'Money and Banks', question: 'Which type of bank account is intended for keeping money for a long period while earning interest?', options: ['Checking account', 'Savings account', 'Fixed deposit', 'Money market'], correctAnswer: 1 },
  { id: 'mab7', subject: 'Money and Banks', question: 'What is the machine that allows customers to perform basic banking transactions without a teller?', options: ['POS', 'ATM', 'CDM', 'Kiosk'], correctAnswer: 1 },
  { id: 'mab8', subject: 'Money and Banks', question: 'Where are shares of publicly held companies bought and sold?', options: ['Bond market', 'Stock market', 'Forex market', 'Commodity market'], correctAnswer: 1 },
  { id: 'mab9', subject: 'Money and Banks', question: 'What is a system of money in general use in a particular country?', options: ['Money', 'Currency', 'Legal tender', 'Coin'], correctAnswer: 1 },
  { id: 'mab10', subject: 'Money and Banks', question: 'What is a sum of money that is borrowed and expected to be paid back with interest?', options: ['Grant', 'Loan', 'Gift', 'Subsidy'], correctAnswer: 1 },
  { id: 'mab11', subject: 'Money and Banks', question: 'What is a printed record of the balance in a bank account and the amounts paid into it and withdrawn from it?', options: ['Invoice', 'Bank statement', 'Receipt', 'Bill'], correctAnswer: 1 },
  { id: 'mab12', subject: 'Money and Banks', question: 'What is a deficit in a bank account caused by drawing more money than the account holds?', options: ['Credit', 'Overdraft', 'Balance', 'Deposit'], correctAnswer: 1 },
  { id: 'mab13', subject: 'Money and Banks', question: 'What is the action or process of investing money for profit?', options: ['Spending', 'Investment', 'Saving', 'Budgeting'], correctAnswer: 1 },
  { id: 'mab14', subject: 'Money and Banks', question: 'What is the legal status of a person or other entity that cannot repay debts to creditors?', options: ['Insolvency', 'Bankruptcy', 'Liquidation', 'Debt'], correctAnswer: 1 },
  { id: 'mab15', subject: 'Money and Banks', question: 'What is a number assigned to a person that indicates to lenders their capacity to repay a loan?', options: ['Bank score', 'Credit score', 'Loan score', 'Financial score'], correctAnswer: 1 },
  { id: 'mab16', subject: 'Money and Banks', question: 'What is the value of one currency for the purpose of conversion to another?', options: ['Interest rate', 'Exchange rate', 'Tax rate', 'Inflation rate'], correctAnswer: 1 },
  { id: 'mab17', subject: 'Money and Banks', question: 'What is a sum of money paid regularly by a company to its shareholders out of its profits?', options: ['Interest', 'Dividends', 'Capital gains', 'Rents'], correctAnswer: 1 },
  { id: 'mab18', subject: 'Money and Banks', question: 'Which type of deposit offers a higher interest rate but requires the money to be locked for a specific term?', options: ['Savings', 'Fixed deposit', 'Current', 'Recurring'], correctAnswer: 1 },
  { id: 'mab19', subject: 'Money and Banks', question: 'What is the method of banking in which transactions are conducted electronically via the internet?', options: ['Mobile banking', 'Online banking', 'Phone banking', 'Branch banking'], correctAnswer: 1 },
  { id: 'mab20', subject: 'Money and Banks', question: 'What is a digital or virtual currency that is secured by cryptography?', options: ['Digital money', 'Cryptocurrency', 'Virtual currency', 'E-cash'], correctAnswer: 1 },
  // Markets and Trading
  { id: 'mat1', subject: 'Markets and Trading', question: 'What is the market where shares of publicly held companies are issued and traded?', options: ['Bond market', 'Stock market', 'Forex market', 'Commodity market'], correctAnswer: 1 },
  { id: 'mat2', subject: 'Markets and Trading', question: 'What is the term for a market in which prices are rising or are expected to rise?', options: ['Bear market', 'Bull market', 'Sideways market', 'Volatile market'], correctAnswer: 1 },
  { id: 'mat3', subject: 'Markets and Trading', question: 'What is the term for a market in which prices are falling or are expected to fall?', options: ['Bull market', 'Bear market', 'Sideways market', 'Volatile market'], correctAnswer: 1 },
  { id: 'mat4', subject: 'Markets and Trading', question: 'What is a distribution of a portion of a company\'s earnings to its shareholders?', options: ['Interest', 'Dividend', 'Capital gain', 'Rent'], correctAnswer: 1 },
  { id: 'mat5', subject: 'Markets and Trading', question: 'What is a range of investments held by a person or organization?', options: ['Wallet', 'Portfolio', 'Ledger', 'Account'], correctAnswer: 1 },
  { id: 'mat6', subject: 'Markets and Trading', question: 'Who is an individual or firm that charges a fee or commission for executing buy and sell orders submitted by an investor?', options: ['Trader', 'Broker', 'Dealer', 'Agent'], correctAnswer: 1 },
  { id: 'mat7', subject: 'Markets and Trading', question: 'What is the first time that the stock of a private company is offered to the public?', options: ['ICO', 'IPO', 'SEO', 'M&A'], correctAnswer: 1 },
  { id: 'mat8', subject: 'Markets and Trading', question: 'Which major US stock exchange is known for its heavy concentration of technology companies?', options: ['NYSE', 'Nasdaq', 'LSE', 'JPX'], correctAnswer: 1 },
  { id: 'mat9', subject: 'Markets and Trading', question: 'What are stocks of large, well-established, and financially sound companies that have operated for many years?', options: ['Penny stocks', 'Blue-chip stocks', 'Growth stocks', 'Value stocks'], correctAnswer: 1 },
  { id: 'mat10', subject: 'Markets and Trading', question: 'What is the practice of buying and selling a financial instrument within the same trading day?', options: ['Swing trading', 'Day trading', 'Position trading', 'Scalping'], correctAnswer: 1 },
  { id: 'mat11', subject: 'Markets and Trading', question: 'What is a limited partnership of investors that uses high-risk methods, such as investing with borrowed money, in hopes of realizing large capital gains?', options: ['Mutual fund', 'Hedge fund', 'Index fund', 'ETF'], correctAnswer: 1 },
  { id: 'mat12', subject: 'Markets and Trading', question: 'What is the sale of a security that is not owned by the seller or that the seller has borrowed?', options: ['Long buying', 'Short selling', 'Margin trading', 'Options trading'], correctAnswer: 1 },
  { id: 'mat13', subject: 'Markets and Trading', question: 'What is a basic good used in commerce that is interchangeable with other goods of the same type?', options: ['Stock', 'Commodity', 'Bond', 'Currency'], correctAnswer: 1 },
  { id: 'mat14', subject: 'Markets and Trading', question: 'What is the marketplace where currencies are traded?', options: ['Stock', 'Forex', 'Bond', 'Commodity'], correctAnswer: 1 },
  { id: 'mat15', subject: 'Markets and Trading', question: 'What is the use of borrowed capital for an investment, expecting the profits made to be greater than the interest payable?', options: ['Margin', 'Leverage', 'Equity', 'Debt'], correctAnswer: 1 },
  { id: 'mat16', subject: 'Markets and Trading', question: 'What is a statistical measure of the dispersion of returns for a given security or market index?', options: ['Stability', 'Volatility', 'Liquidity', 'Solvency'], correctAnswer: 1 },
  { id: 'mat17', subject: 'Markets and Trading', question: 'What is the efficiency or ease with which an asset or security can be converted into ready cash without affecting its market price?', options: ['Solvency', 'Liquidity', 'Profitability', 'Efficiency'], correctAnswer: 1 },
  { id: 'mat18', subject: 'Markets and Trading', question: 'What is an investment strategy that aims to balance risk and reward by apportioning a portfolio\'s assets according to an individual\'s goals, risk tolerance, and investment horizon?', options: ['Diversification', 'Asset allocation', 'Rebalancing', 'Hedging'], correctAnswer: 1 },
  { id: 'mat19', subject: 'Markets and Trading', question: 'What is the total dollar market value of a company\'s outstanding shares of stock?', options: ['Net worth', 'Market capitalization', 'Revenue', 'Profit'], correctAnswer: 1 },
  { id: 'mat20', subject: 'Markets and Trading', question: 'What is a trading discipline employed to evaluate investments and identify trading opportunities by analyzing statistical trends gathered from trading activity?', options: ['Fundamental analysis', 'Technical analysis', 'Sentiment analysis', 'Quantitative analysis'], correctAnswer: 1 },
  // Farming and Production
  { id: 'fap1', subject: 'Farming and Production', question: 'What is the science or practice of farming, including cultivation of the soil for the growing of crops and the rearing of animals to provide food, wool, and other products?', options: ['Industry', 'Agriculture', 'Services', 'Tourism'], correctAnswer: 1 },
  { id: 'fap2', subject: 'Farming and Production', question: 'What is the supply of water to land or crops to help growth, typically by means of channels?', options: ['Fertilization', 'Irrigation', 'Harvesting', 'Planting'], correctAnswer: 1 },
  { id: 'fap3', subject: 'Farming and Production', question: 'What is the practice of growing a series of dissimilar or unrelated types of crops in the same area in sequential seasons?', options: ['Monoculture', 'Crop rotation', 'Intercropping', 'Mixed farming'], correctAnswer: 1 },
  { id: 'fap4', subject: 'Farming and Production', question: 'What is a production system that sustains the health of soils, ecosystems, and people by relying on ecological processes, biodiversity, and cycles adapted to local conditions?', options: ['Industrial farming', 'Organic farming', 'Hydroponics', 'Aquaponics'], correctAnswer: 1 },
  { id: 'fap5', subject: 'Farming and Production', question: 'What are farm animals regarded as an asset?', options: ['Crops', 'Livestock', 'Poultry', 'Fish'], correctAnswer: 1 },
  { id: 'fap6', subject: 'Farming and Production', question: 'What is the process of gathering a ripe crop from the fields?', options: ['Planting', 'Harvesting', 'Sowing', 'Tilling'], correctAnswer: 1 },
  { id: 'fap7', subject: 'Farming and Production', question: 'What is a substance used for destroying insects or other organisms harmful to cultivated plants or to animals?', options: ['Fertilizer', 'Pesticide', 'Herbicide', 'Fungicide'], correctAnswer: 1 },
  { id: 'fap8', subject: 'Farming and Production', question: 'What is a chemical or natural substance added to soil or land to increase its fertility?', options: ['Pesticide', 'Fertilizer', 'Compost', 'Mulch'], correctAnswer: 1 },
  { id: 'fap9', subject: 'Farming and Production', question: 'What is a structure with walls and roof made chiefly of transparent material, such as glass, in which plants requiring regulated climatic conditions are grown?', options: ['Barn', 'Greenhouse', 'Silo', 'Shed'], correctAnswer: 1 },
  { id: 'fap10', subject: 'Farming and Production', question: 'What is farming based on ecological principles?', options: ['Intensive farming', 'Sustainable farming', 'Subsistence farming', 'Commercial farming'], correctAnswer: 1 },
  { id: 'fap11', subject: 'Farming and Production', question: 'What is the process of growing plants in sand, gravel, or liquid, with added nutrients but without soil?', options: ['Aquaponics', 'Hydroponics', 'Aeroponics', 'Geoponics'], correctAnswer: 1 },
  { id: 'fap12', subject: 'Farming and Production', question: 'What is the rearing of aquatic animals or the cultivation of aquatic plants for food?', options: ['Agriculture', 'Aquaculture', 'Horticulture', 'Floriculture'], correctAnswer: 1 },
  { id: 'fap13', subject: 'Farming and Production', question: 'What is a tower or pit on a farm used to store grain?', options: ['Barn', 'Silo', 'Warehouse', 'Granary'], correctAnswer: 1 },
  { id: 'fap14', subject: 'Farming and Production', question: 'What is a powerful motor vehicle with large rear wheels, used chiefly on farms for hauling equipment and trailers?', options: ['Plough', 'Tractor', 'Combine', 'Harvester'], correctAnswer: 1 },
  { id: 'fap15', subject: 'Farming and Production', question: 'What is the process of planting (seeds) by scattering as on the earth?', options: ['Reaping', 'Sowing', 'Threshing', 'Winnowing'], correctAnswer: 1 },
  { id: 'fap16', subject: 'Farming and Production', question: 'What is the displacement of the upper layer of soil?', options: ['Soil fertility', 'Soil erosion', 'Soil compaction', 'Soil salinity'], correctAnswer: 1 },
  { id: 'fap17', subject: 'Farming and Production', question: 'What are organisms whose genetic material has been altered using genetic engineering techniques?', options: ['Hybrids', 'GMOs', 'Mutants', 'Clones'], correctAnswer: 1 },
  { id: 'fap18', subject: 'Farming and Production', question: 'What is a form of farming in which nearly all of the crops or livestock raised are used to maintain the farmer and the farmer\'s family?', options: ['Commercial farming', 'Subsistence farming', 'Plantation farming', 'Ranching'], correctAnswer: 1 },
  { id: 'fap19', subject: 'Farming and Production', question: 'What is the art or practice of garden cultivation and management?', options: ['Agronomy', 'Horticulture', 'Forestry', 'Viticulture'], correctAnswer: 1 },
  { id: 'fap20', subject: 'Farming and Production', question: 'What is the sequence of processes involved in the production and distribution of a commodity?', options: ['Production line', 'Supply chain', 'Value chain', 'Distribution network'], correctAnswer: 1 },
  // Info Systems
  { id: 'is1', subject: 'Info Systems', question: 'What is an integrated set of components for collecting, storing, and processing data and for providing information, knowledge, and digital products?', options: ['Computer System', 'Information System', 'Network System', 'Database System'], correctAnswer: 1 },
  { id: 'is2', subject: 'Info Systems', question: 'What is a structured set of data held in a computer, especially one that is accessible in various ways?', options: ['File', 'Database', 'Folder', 'Drive'], correctAnswer: 1 },
  { id: 'is3', subject: 'Info Systems', question: 'What are the physical components of a computer system?', options: ['Software', 'Hardware', 'Firmware', 'Middleware'], correctAnswer: 1 },
  { id: 'is4', subject: 'Info Systems', question: 'What are the programs and other operating information used by a computer?', options: ['Hardware', 'Software', 'Data', 'People'], correctAnswer: 1 },
  { id: 'is5', subject: 'Info Systems', question: 'What is a group of two or more computer systems linked together?', options: ['Server', 'Network', 'Client', 'Node'], correctAnswer: 1 },
  { id: 'is6', subject: 'Info Systems', question: 'What are individual facts, statistics, or items of information?', options: ['Information', 'Data', 'Knowledge', 'Wisdom'], correctAnswer: 1 },
  { id: 'is7', subject: 'Info Systems', question: 'What is data that has been processed, organized, structured or presented in a given context so as to make it useful?', options: ['Data', 'Information', 'Knowledge', 'Wisdom'], correctAnswer: 1 },
  { id: 'is8', subject: 'Info Systems', question: 'Who is an IT professional who specializes in analyzing, designing and implementing information systems?', options: ['Programmer', 'System Analyst', 'Database Admin', 'Network Engineer'], correctAnswer: 1 },
  { id: 'is9', subject: 'Info Systems', question: 'What is a type of software that organizations use to manage day-to-day business activities such as accounting, procurement, project management, risk management and compliance, and supply chain operations?', options: ['CRM', 'ERP', 'SCM', 'HRM'], correctAnswer: 1 },
  { id: 'is10', subject: 'Info Systems', question: 'What is a technology for managing all your company\'s relationships and interactions with customers and potential customers?', options: ['ERP', 'CRM', 'SCM', 'HRM'], correctAnswer: 1 },
  { id: 'is11', subject: 'Info Systems', question: 'What is an information system that supports business or organizational decision-making activities?', options: ['TPS', 'DSS', 'MIS', 'ESS'], correctAnswer: 1 },
  { id: 'is12', subject: 'Info Systems', question: 'What is an information system used for decision-making, and for the coordination, control, analysis, and visualization of information in an organization?', options: ['TPS', 'MIS', 'DSS', 'ESS'], correctAnswer: 1 },
  { id: 'is13', subject: 'Info Systems', question: 'What is a type of information system that collects, stores, modifies and retrieves the data transactions of an enterprise?', options: ['MIS', 'TPS', 'DSS', 'ESS'], correctAnswer: 1 },
  { id: 'is14', subject: 'Info Systems', question: 'What is the on-demand availability of computer system resources, especially data storage and computing power, without direct active management by the user?', options: ['Virtualization', 'Cloud computing', 'Grid computing', 'Edge computing'], correctAnswer: 1 },
  { id: 'is15', subject: 'Info Systems', question: 'What is the term for extremely large data sets that may be analyzed computationally to reveal patterns, trends, and associations?', options: ['Small Data', 'Big Data', 'Meta Data', 'Master Data'], correctAnswer: 1 },
  { id: 'is16', subject: 'Info Systems', question: 'What is the simulation of human intelligence processes by machines, especially computer systems?', options: ['Machine Learning', 'AI', 'Deep Learning', 'Neural Networks'], correctAnswer: 1 },
  { id: 'is17', subject: 'Info Systems', question: 'What is the practice of protecting systems, networks, and programs from digital attacks?', options: ['Data Privacy', 'Cybersecurity', 'Network Security', 'Information Security'], correctAnswer: 1 },
  { id: 'is18', subject: 'Info Systems', question: 'What is the composite hardware, software, network resources and services required for the existence, operation and management of an enterprise IT environment?', options: ['IT Architecture', 'IT Infrastructure', 'IT Strategy', 'IT Governance'], correctAnswer: 1 },
  { id: 'is19', subject: 'Info Systems', question: 'What is a process for planning, creating, testing, and deploying an information system?', options: ['Agile', 'SDLC', 'Waterfall', 'Scrum'], correctAnswer: 1 },
  { id: 'is20', subject: 'Info Systems', question: 'What are the strategies and technologies used by enterprises for the data analysis of business information?', options: ['Data Analytics', 'BI', 'Data Mining', 'Data Science'], correctAnswer: 1 },
  // Politics
  { id: 'pol1', subject: 'Politics', question: 'What is a system of government by the whole population or all the eligible members of a state, typically through elected representatives?', options: ['Monarchy', 'Democracy', 'Dictatorship', 'Oligarchy'], correctAnswer: 1 },
  { id: 'pol2', subject: 'Politics', question: 'What is a form of government with a monarch at the head?', options: ['Republic', 'Monarchy', 'Theocracy', 'Anarchy'], correctAnswer: 1 },
  { id: 'pol3', subject: 'Politics', question: 'What is a government by a dictator?', options: ['Democracy', 'Dictatorship', 'Republic', 'Federation'], correctAnswer: 1 },
  { id: 'pol4', subject: 'Politics', question: 'What is a body of fundamental principles or established precedents according to which a state or other organization is acknowledged to be governed?', options: ['Law book', 'Constitution', 'Decree', 'Treaty'], correctAnswer: 1 },
  { id: 'pol5', subject: 'Politics', question: 'What is a formal and organized choice by vote of a person for a political office or other position?', options: ['Appointment', 'Election', 'Succession', 'Coup'], correctAnswer: 1 },
  { id: 'pol6', subject: 'Politics', question: 'What is the highest legislature, consisting of the Sovereign, the House of Lords, and the House of Commons?', options: ['Court', 'Parliament', 'Cabinet', 'Council'], correctAnswer: 1 },
  { id: 'pol7', subject: 'Politics', question: 'Who is the elected head of a republican state?', options: ['Prime Minister', 'President', 'King', 'Governor'], correctAnswer: 1 },
  { id: 'pol8', subject: 'Politics', question: 'Who is the head of an elected government; the principal minister of a sovereign or state?', options: ['President', 'Prime Minister', 'Chancellor', 'Speaker'], correctAnswer: 1 },
  { id: 'pol9', subject: 'Politics', question: 'What is an organized group of people with at least roughly similar political aims and opinions, that seeks to influence public policy by getting its candidates elected to public office?', options: ['Union', 'Political party', 'Club', 'Association'], correctAnswer: 1 },
  { id: 'pol10', subject: 'Politics', question: 'What is a system of ideas and ideals, especially one which forms the basis of economic or political theory and policy?', options: ['Policy', 'Ideology', 'Strategy', 'Tactic'], correctAnswer: 1 },
  { id: 'pol11', subject: 'Politics', question: 'What is the authority of a state to govern itself or another state?', options: ['Autonomy', 'Sovereignty', 'Independence', 'Liberty'], correctAnswer: 1 },
  { id: 'pol12', subject: 'Politics', question: 'What is the profession, activity, or skill of managing international relations, typically by a country\'s representatives abroad?', options: ['Warfare', 'Diplomacy', 'Trade', 'Espionage'], correctAnswer: 1 },
  { id: 'pol13', subject: 'Politics', question: 'What are moral principles or norms for certain standards of human behaviour and are regularly protected in municipal and international law?', options: ['Civil duties', 'Human rights', 'Legal rights', 'Social rights'], correctAnswer: 1 },
  { id: 'pol14', subject: 'Politics', question: 'What is an act of vesting the legislative, executive, and judicial powers of government in separate bodies?', options: ['Unity of command', 'Separation of powers', 'Centralization', 'Federalism'], correctAnswer: 1 },
  { id: 'pol15', subject: 'Politics', question: 'What is the mixed or compound mode of government, combining a general government with regional governments in a single political system?', options: ['Unitary state', 'Federalism', 'Confederation', 'Empire'], correctAnswer: 1 },
  { id: 'pol16', subject: 'Politics', question: 'What is the act of attempting to influence the actions, policies, or decisions of officials in their daily life, most often legislators or members of regulatory agencies?', options: ['Campaigning', 'Lobbying', 'Voting', 'Canvassing'], correctAnswer: 1 },
  { id: 'pol17', subject: 'Politics', question: 'What is the principled guide to action taken by the administrative executive branches of a state with regard to a class of issues, in a manner consistent with law and institutional customs?', options: ['Private law', 'Public policy', 'Social norm', 'Cultural value'], correctAnswer: 1 },
  { id: 'pol18', subject: 'Politics', question: 'What is the action or manner of governing a state, organization, etc.?', options: ['Management', 'Governance', 'Administration', 'Leadership'], correctAnswer: 1 },
  { id: 'pol19', subject: 'Politics', question: 'What is politics, especially international relations, as influenced by geographical factors?', options: ['Geography', 'Geopolitics', 'International relations', 'Political science'], correctAnswer: 1 },
  { id: 'pol20', subject: 'Politics', question: 'What is the "aggregate of non-governmental organizations and institutions that manifest interests and will of citizens"?', options: ['Government', 'Civil society', 'Private sector', 'Military'], correctAnswer: 1 },
  // Petroleum
  { id: 'pet1', subject: 'Petroleum', question: 'What is a naturally occurring, unrefined petroleum product composed of hydrocarbon deposits and other organic materials?', options: ['Gasoline', 'Crude oil', 'Diesel', 'Kerosene'], correctAnswer: 1 },
  { id: 'pet2', subject: 'Petroleum', question: 'What is a flammable gas, consisting largely of methane and other hydrocarbons, occurring naturally underground?', options: ['Coal', 'Natural gas', 'Propane', 'Butane'], correctAnswer: 1 },
  { id: 'pet3', subject: 'Petroleum', question: 'What is an industrial process plant where crude oil is transformed and refined into more useful products such as petroleum naphtha, gasoline, diesel fuel, asphalt base, heating oil, kerosene, liquefied petroleum gas, jet fuel and fuel oils?', options: ['Factory', 'Refinery', 'Plant', 'Mill'], correctAnswer: 1 },
  { id: 'pet4', subject: 'Petroleum', question: 'What is the process of boring a hole in the earth to bring oil or gas to the surface?', options: ['Mining', 'Drilling', 'Excavating', 'Pumping'], correctAnswer: 1 },
  { id: 'pet5', subject: 'Petroleum', question: 'What is a long pipe, typically underground, for conveying oil, gas, etc. over long distances?', options: ['Truck', 'Pipeline', 'Ship', 'Train'], correctAnswer: 1 },
  { id: 'pet6', subject: 'Petroleum', question: 'What is the intergovernmental organization of 13 countries that coordinate and unify the petroleum policies of its Member Countries?', options: ['UN', 'OPEC', 'NATO', 'WTO'], correctAnswer: 1 },
  { id: 'pet7', subject: 'Petroleum', question: 'What is a compound of hydrogen and carbon, such as those that are the chief components of petroleum and natural gas?', options: ['Carbohydrate', 'Hydrocarbon', 'Oxide', 'Sulfide'], correctAnswer: 1 },
  { id: 'pet8', subject: 'Petroleum', question: 'What is a mechanical process where a wellbore is drilled through the seabed?', options: ['Onshore drilling', 'Offshore drilling', 'Deep mining', 'Fracking'], correctAnswer: 1 },
  { id: 'pet9', subject: 'Petroleum', question: 'What is the process of injecting liquid at high pressure into subterranean rocks, boreholes, etc. so as to force open existing fissures and extract oil or gas?', options: ['Drilling', 'Fracking', 'Pumping', 'Refining'], correctAnswer: 1 },
  { id: 'pet10', subject: 'Petroleum', question: 'What is a unit of volume for crude oil and petroleum products, equal to 42 US gallons?', options: ['Gallon', 'Barrel', 'Liter', 'Ton'], correctAnswer: 1 },
  { id: 'pet11', subject: 'Petroleum', question: 'Which sector of the oil and gas industry involves exploration and production?', options: ['Downstream', 'Upstream', 'Midstream', 'Mainstream'], correctAnswer: 1 },
  { id: 'pet12', subject: 'Petroleum', question: 'Which sector of the oil and gas industry involves refining and marketing?', options: ['Upstream', 'Downstream', 'Midstream', 'Mainstream'], correctAnswer: 1 },
  { id: 'pet13', subject: 'Petroleum', question: 'Which sector of the oil and gas industry involves transportation and storage?', options: ['Upstream', 'Downstream', 'Midstream', 'Mainstream'], correctAnswer: 2 },
  { id: 'pet14', subject: 'Petroleum', question: 'What is a subsurface pool of hydrocarbons contained in porous or fractured rock formations?', options: ['Tank', 'Reservoir', 'Well', 'Pool'], correctAnswer: 1 },
  { id: 'pet15', subject: 'Petroleum', question: 'What is a method used to estimate the shape and properties of the Earth\'s subsurface by using reflected seismic waves?', options: ['Geological map', 'Seismic survey', 'Satellite image', 'Core sample'], correctAnswer: 1 },
  { id: 'pet16', subject: 'Petroleum', question: 'What are chemical products derived from petroleum?', options: ['Chemicals', 'Petrochemicals', 'Polymers', 'Plastics'], correctAnswer: 1 },
  { id: 'pet17', subject: 'Petroleum', question: 'What is a refined petroleum product used as fuel in internal combustion engines?', options: ['Petrol', 'Gasoline', 'Fuel', 'Energy'], correctAnswer: 1 },
  { id: 'pet18', subject: 'Petroleum', question: 'What is a type of liquid fuel used in diesel engines?', options: ['Gasoline', 'Diesel', 'Jet fuel', 'Heating oil'], correctAnswer: 1 },
  { id: 'pet19', subject: 'Petroleum', question: 'What is a light fuel oil obtained by distilling petroleum, used especially in jet engines and domestic heaters?', options: ['Gasoline', 'Kerosene', 'Diesel', 'Paraffin'], correctAnswer: 1 },
  { id: 'pet20', subject: 'Petroleum', question: 'What is the release of a liquid petroleum hydrocarbon into the environment, especially the marine ecosystem, due to human activity?', options: ['Leak', 'Oil spill', 'Pollution', 'Disaster'], correctAnswer: 1 },
  // Hotels and Travel
  { id: 'ht1', subject: 'Hotels and Travel', question: 'What is an establishment providing accommodation, meals, and other services for travelers and tourists?', options: ['House', 'Hotel', 'Hostel', 'Motel'], correctAnswer: 1 },
  { id: 'ht2', subject: 'Hotels and Travel', question: 'What is the commercial organization and operation of holidays and visits to places of interest?', options: ['Travel', 'Tourism', 'Leisure', 'Recreation'], correctAnswer: 1 },
  { id: 'ht3', subject: 'Hotels and Travel', question: 'What is the action of reserving something, such as a room or a seat?', options: ['Booking', 'Reservation', 'Appointment', 'Schedule'], correctAnswer: 1 },
  { id: 'ht4', subject: 'Hotels and Travel', question: 'What is the process of reporting one\'s arrival at a hotel or airport?', options: ['Arrival', 'Check-in', 'Registration', 'Entry'], correctAnswer: 1 },
  { id: 'ht5', subject: 'Hotels and Travel', question: 'What is the process of leaving a hotel after settling the bill?', options: ['Departure', 'Check-out', 'Settlement', 'Exit'], correctAnswer: 1 },
  { id: 'ht6', subject: 'Hotels and Travel', question: 'Who is a hotel staff member who assists guests with various tasks like making restaurant reservations or booking tours?', options: ['Receptionist', 'Concierge', 'Bellboy', 'Porter'], correctAnswer: 1 },
  { id: 'ht7', subject: 'Hotels and Travel', question: 'What is a hotel service enabling guests to choose menu items for delivery to their room?', options: ['Catering', 'Room service', 'Housekeeping', 'Laundry'], correctAnswer: 1 },
  { id: 'ht8', subject: 'Hotels and Travel', question: 'What is a set of rooms designated for one person\'s or family\'s use or for a particular purpose?', options: ['Room', 'Suite', 'Apartment', 'Penthouse'], correctAnswer: 1 },
  { id: 'ht9', subject: 'Hotels and Travel', question: 'What is a place that is a popular destination for vacations or recreation?', options: ['Hotel', 'Resort', 'Spa', 'Lodge'], correctAnswer: 1 },
  { id: 'ht10', subject: 'Hotels and Travel', question: 'What is a planned route or journey?', options: ['Map', 'Itinerary', 'Guide', 'Plan'], correctAnswer: 1 },
  { id: 'ht11', subject: 'Hotels and Travel', question: 'What is an official document issued by a government, certifying the holder\'s identity and citizenship and entitling them to travel under its protection to and from foreign countries?', options: ['Visa', 'Passport', 'ID card', 'License'], correctAnswer: 1 },
  { id: 'ht12', subject: 'Hotels and Travel', question: 'What is an endorsement on a passport indicating that the holder is allowed to enter, leave, or stay for a specified period of time in a country?', options: ['Passport', 'Visa', 'Permit', 'Authorization'], correctAnswer: 1 },
  { id: 'ht13', subject: 'Hotels and Travel', question: 'What is a document provided by an airline during check-in, giving a passenger permission to board the airplane for a particular flight?', options: ['Ticket', 'Boarding pass', 'Voucher', 'Receipt'], correctAnswer: 1 },
  { id: 'ht14', subject: 'Hotels and Travel', question: 'What is insurance that is intended to cover medical expenses, trip cancellation, lost luggage, flight accident and other losses incurred while traveling?', options: ['Health insurance', 'Travel insurance', 'Life insurance', 'Car insurance'], correctAnswer: 1 },
  { id: 'ht15', subject: 'Hotels and Travel', question: 'What is tourism directed toward exotic, often threatened, natural environments, intended to support conservation efforts and observe wildlife?', options: ['Mass tourism', 'Ecotourism', 'Adventure tourism', 'Cultural tourism'], correctAnswer: 1 },
  { id: 'ht16', subject: 'Hotels and Travel', question: 'What is the friendly and generous reception and entertainment of guests, visitors, or strangers?', options: ['Service', 'Hospitality', 'Welcoming', 'Greeting'], correctAnswer: 1 },
  { id: 'ht17', subject: 'Hotels and Travel', question: 'What is a small lodging establishment that offers overnight accommodation and breakfast?', options: ['Hotel', 'B&B', 'Inn', 'Guest house'], correctAnswer: 1 },
  { id: 'ht18', subject: 'Hotels and Travel', question: 'What is a marketing strategy used by businesses to encourage customers to continue to shop at or use the services of a business associated with each program?', options: ['Discount', 'Loyalty program', 'Reward', 'Membership'], correctAnswer: 1 },
  { id: 'ht19', subject: 'Hotels and Travel', question: 'What is the place to which someone or something is going or being sent?', options: ['Location', 'Destination', 'Spot', 'Place'], correctAnswer: 1 },
  { id: 'ht20', subject: 'Hotels and Travel', question: 'What is a private retailer or public service that provides travel and tourism-related services to the general public on behalf of accommodation or travel suppliers?', options: ['Tour operator', 'Travel agency', 'Booking site', 'Guide service'], correctAnswer: 1 },
  // Cars and Airplanes
  { id: 'caa1', subject: 'Cars and Airplanes', question: 'Who is widely credited with inventing the first modern automobile?', options: ['Henry Ford', 'Karl Benz', 'Gottlieb Daimler', 'Nicolaus Otto'], correctAnswer: 1 },
  { id: 'caa2', subject: 'Cars and Airplanes', question: 'Who achieved the first powered, controlled flight of a heavier-than-air aircraft?', options: ['Leonardo da Vinci', 'Wright brothers', 'Santos-Dumont', 'Glenn Curtiss'], correctAnswer: 1 },
  { id: 'caa3', subject: 'Cars and Airplanes', question: 'What type of engine is most commonly used in modern cars?', options: ['Steam engine', 'Internal combustion engine', 'Electric motor', 'Jet engine'], correctAnswer: 1 },
  { id: 'caa4', subject: 'Cars and Airplanes', question: 'What type of engine powers most commercial airliners?', options: ['Propeller', 'Jet engine', 'Rocket', 'Turbine'], correctAnswer: 1 },
  { id: 'caa5', subject: 'Cars and Airplanes', question: 'What is the main body of an airplane called?', options: ['Wing', 'Fuselage', 'Tail', 'Cockpit'], correctAnswer: 1 },
  { id: 'caa6', subject: 'Cars and Airplanes', question: 'Which part of an airplane wing controls roll?', options: ['Flaps', 'Ailerons', 'Rudder', 'Elevator'], correctAnswer: 1 },
  { id: 'caa7', subject: 'Cars and Airplanes', question: 'What part of a car transfers power from the engine to the wheels?', options: ['Engine', 'Transmission', 'Suspension', 'Brakes'], correctAnswer: 1 },
  { id: 'caa8', subject: 'Cars and Airplanes', question: 'What is the study of how air moves around objects?', options: ['Thermodynamics', 'Aerodynamics', 'Mechanics', 'Electronics'], correctAnswer: 1 },
  { id: 'caa9', subject: 'Cars and Airplanes', question: 'Which iconic airplane was known as the "Jumbo Jet"?', options: ['Airbus A380', 'Boeing 747', 'Concorde', 'DC-10'], correctAnswer: 1 },
  { id: 'caa10', subject: 'Cars and Airplanes', question: 'Which company is a leader in the production of electric vehicles?', options: ['Toyota', 'Tesla', 'Ford', 'GM'], correctAnswer: 1 },
  { id: 'caa11', subject: 'Cars and Airplanes', question: 'What force opposes the weight of an airplane and holds it in the air?', options: ['Thrust', 'Lift', 'Drag', 'Weight'], correctAnswer: 1 },
  { id: 'caa12', subject: 'Cars and Airplanes', question: 'What force moves an airplane forward through the air?', options: ['Lift', 'Thrust', 'Drag', 'Weight'], correctAnswer: 1 },
  { id: 'caa13', subject: 'Cars and Airplanes', question: 'What force opposes the forward motion of an airplane?', options: ['Lift', 'Thrust', 'Drag', 'Weight'], correctAnswer: 2 },
  { id: 'caa14', subject: 'Cars and Airplanes', question: 'What force pulls an airplane toward the Earth?', options: ['Lift', 'Thrust', 'Drag', 'Weight'], correctAnswer: 3 },
  { id: 'caa15', subject: 'Cars and Airplanes', question: 'Where does the pilot sit in an airplane?', options: ['Cabin', 'Cockpit', 'Galley', 'Lavatory'], correctAnswer: 1 },
  { id: 'caa16', subject: 'Cars and Airplanes', question: 'What is the structural frame of a car called?', options: ['Body', 'Chassis', 'Engine', 'Wheels'], correctAnswer: 1 },
  { id: 'caa17', subject: 'Cars and Airplanes', question: 'What system in a car absorbs shocks from the road?', options: ['Steering', 'Suspension', 'Brakes', 'Transmission'], correctAnswer: 1 },
  { id: 'caa18', subject: 'Cars and Airplanes', question: 'What type of car uses both an internal combustion engine and an electric motor?', options: ['Electric', 'Hybrid', 'Diesel', 'Petrol'], correctAnswer: 1 },
  { id: 'caa19', subject: 'Cars and Airplanes', question: 'What system allows an airplane to fly without constant pilot input?', options: ['Cruise control', 'Autopilot', 'GPS', 'Radar'], correctAnswer: 1 },
  { id: 'caa20', subject: 'Cars and Airplanes', question: 'What is the term for speeds faster than the speed of sound?', options: ['Subsonic', 'Supersonic', 'Hypersonic', 'Transonic'], correctAnswer: 1 },
  // Jets
  { id: 'jet1', subject: 'Jets', question: 'What type of engine uses a high-speed jet of gas to generate thrust?', options: ['Propeller', 'Jet engine', 'Rocket', 'Turbine'], correctAnswer: 1 },
  { id: 'jet2', subject: 'Jets', question: 'What is the primary force generated by a jet engine?', options: ['Lift', 'Thrust', 'Drag', 'Gravity'], correctAnswer: 1 },
  { id: 'jet3', subject: 'Jets', question: 'What was the first jet-powered aircraft to fly?', options: ['Me 262', 'Heinkel He 178', 'Gloster Meteor', 'Bell P-59'], correctAnswer: 1 },
  { id: 'jet4', subject: 'Jets', question: 'What unit is used to measure the speed of an aircraft relative to the speed of sound?', options: ['Knot', 'Mach number', 'MPH', 'KPH'], correctAnswer: 1 },
  { id: 'jet5', subject: 'Jets', question: 'What component increases thrust by injecting fuel into the exhaust stream?', options: ['Turbocharger', 'Afterburner', 'Supercharger', 'Intercooler'], correctAnswer: 1 },
  { id: 'jet6', subject: 'Jets', question: 'What is the most common type of jet engine used in modern commercial airliners?', options: ['Turbojet', 'Turbofan', 'Turboprop', 'Turboshaft'], correctAnswer: 1 },
  { id: 'jet7', subject: 'Jets', question: 'Which supersonic passenger jet was operated by British Airways and Air France?', options: ['Tu-144', 'Concorde', 'SR-71', 'XB-70'], correctAnswer: 1 },
  { id: 'jet8', subject: 'Jets', question: 'What is the fastest air-breathing manned aircraft ever built?', options: ['MiG-25', 'SR-71 Blackbird', 'F-22', 'F-15'], correctAnswer: 1 },
  { id: 'jet9', subject: 'Jets', question: 'What technology is used to make aircraft less visible to radar?', options: ['Invisible', 'Stealth', 'Camouflage', 'Radar-proof'], correctAnswer: 1 },
  { id: 'jet10', subject: 'Jets', question: 'What does VTOL stand for in aviation?', options: ['STOL', 'VTOL', 'CTOL', 'RTO'], correctAnswer: 1 },
  { id: 'jet11', subject: 'Jets', question: 'Which fifth-generation fighter jet is produced by Lockheed Martin?', options: ['F-35', 'F-22 Raptor', 'Su-57', 'J-20'], correctAnswer: 1 },
  { id: 'jet12', subject: 'Jets', question: 'What is the measure of acceleration experienced by pilots during high-speed maneuvers?', options: ['Weight', 'G-force', 'Pressure', 'Density'], correctAnswer: 1 },
  { id: 'jet13', subject: 'Jets', question: 'What safety device allows a pilot to escape an aircraft in an emergency?', options: ['Safety seat', 'Ejection seat', 'Parachute', 'Life vest'], correctAnswer: 1 },
  { id: 'jet14', subject: 'Jets', question: 'What is the loud noise caused by the shock wave of an aircraft traveling faster than sound?', options: ['Thunder', 'Sonic boom', 'Blast', 'Shockwave'], correctAnswer: 1 },
  { id: 'jet15', subject: 'Jets', question: 'What design feature helps reduce drag at high speeds?', options: ['Wing span', 'Wing sweep', 'Wing area', 'Wing loading'], correctAnswer: 1 },
  { id: 'jet16', subject: 'Jets', question: 'What are the electronic systems used on aircraft?', options: ['Electronics', 'Avionics', 'Mechanics', 'Hydraulics'], correctAnswer: 1 },
  { id: 'jet17', subject: 'Jets', question: 'What system replaces manual flight controls with an electronic interface?', options: ['Manual', 'Fly-by-wire', 'Hydraulic', 'Mechanical'], correctAnswer: 1 },
  { id: 'jet18', subject: 'Jets', question: 'What process allows a jet to receive fuel from another aircraft while in flight?', options: ['Ground refueling', 'Air-to-air refueling', 'Ship refueling', 'Self-refueling'], correctAnswer: 1 },
  { id: 'jet19', subject: 'Jets', question: 'What is a close-range aerial combat between fighter aircraft?', options: ['Air battle', 'Dogfight', 'Skirmish', 'Duel'], correctAnswer: 1 },
  { id: 'jet20', subject: 'Jets', question: 'What type of ship is designed to launch and recover jet aircraft?', options: ['Battleship', 'Aircraft carrier', 'Destroyer', 'Cruiser'], correctAnswer: 1 },
  // Organic Chemistry
  { id: 'oc1', subject: 'Organic Chemistry', question: 'Which element is the basis of all organic compounds?', options: ['Oxygen', 'Carbon', 'Nitrogen', 'Hydrogen'], correctAnswer: 1 },
  { id: 'oc2', subject: 'Organic Chemistry', question: 'What are compounds composed only of carbon and hydrogen?', options: ['Carbohydrates', 'Hydrocarbons', 'Lipids', 'Proteins'], correctAnswer: 1 },
  { id: 'oc3', subject: 'Organic Chemistry', question: 'What are saturated hydrocarbons with single bonds only?', options: ['Alkenes', 'Alkanes', 'Alkynes', 'Aromatics'], correctAnswer: 1 },
  { id: 'oc4', subject: 'Organic Chemistry', question: 'What are unsaturated hydrocarbons with at least one double bond?', options: ['Alkanes', 'Alkenes', 'Alkynes', 'Aromatics'], correctAnswer: 1 },
  { id: 'oc5', subject: 'Organic Chemistry', question: 'What are unsaturated hydrocarbons with at least one triple bond?', options: ['Alkanes', 'Alkenes', 'Alkynes', 'Aromatics'], correctAnswer: 2 },
  { id: 'oc6', subject: 'Organic Chemistry', question: 'What are molecules with the same molecular formula but different structures?', options: ['Isotopes', 'Isomers', 'Allotropes', 'Polymers'], correctAnswer: 1 },
  { id: 'oc7', subject: 'Organic Chemistry', question: 'What is a specific group of atoms within a molecule that is responsible for its characteristic chemical reactions?', options: ['Atom', 'Functional group', 'Molecule', 'Compound'], correctAnswer: 1 },
  { id: 'oc8', subject: 'Organic Chemistry', question: 'What class of organic compounds contains a hydroxyl (-OH) group?', options: ['Ethers', 'Alcohols', 'Esters', 'Ketones'], correctAnswer: 1 },
  { id: 'oc9', subject: 'Organic Chemistry', question: 'What class of organic compounds contains a carboxyl (-COOH) group?', options: ['Alcohols', 'Carboxylic acids', 'Aldehydes', 'Ketones'], correctAnswer: 1 },
  { id: 'oc10', subject: 'Organic Chemistry', question: 'What are large molecules composed of many repeated subunits?', options: ['Monomers', 'Polymers', 'Dimers', 'Trimers'], correctAnswer: 1 },
  { id: 'oc11', subject: 'Organic Chemistry', question: 'What is the simplest aromatic hydrocarbon?', options: ['Methane', 'Benzene', 'Ethane', 'Propane'], correctAnswer: 1 },
  { id: 'oc12', subject: 'Organic Chemistry', question: 'What is the reaction between an alcohol and a carboxylic acid to form an ester?', options: ['Oxidation', 'Esterification', 'Reduction', 'Hydrolysis'], correctAnswer: 1 },
  { id: 'oc13', subject: 'Organic Chemistry', question: 'What is the process of making soap from fats and oils?', options: ['Neutralization', 'Saponification', 'Combustion', 'Addition'], correctAnswer: 1 },
  { id: 'oc14', subject: 'Organic Chemistry', question: 'What property describes a molecule that is not superimposable on its mirror image?', options: ['Symmetry', 'Chirality', 'Polarity', 'Acidity'], correctAnswer: 1 },
  { id: 'oc15', subject: 'Organic Chemistry', question: 'What are the building blocks of proteins?', options: ['Nucleotides', 'Amino acids', 'Fatty acids', 'Sugars'], correctAnswer: 1 },
  { id: 'oc16', subject: 'Organic Chemistry', question: 'What class of organic compounds includes sugars, starches, and cellulose?', options: ['Lipids', 'Carbohydrates', 'Proteins', 'Nucleic acids'], correctAnswer: 1 },
  { id: 'oc17', subject: 'Organic Chemistry', question: 'What class of organic compounds includes fats, oils, and waxes?', options: ['Proteins', 'Lipids', 'Carbohydrates', 'Vitamins'], correctAnswer: 1 },
  { id: 'oc18', subject: 'Organic Chemistry', question: 'What molecule carries genetic information in all living organisms?', options: ['RNA', 'DNA', 'ATP', 'ADP'], correctAnswer: 1 },
  { id: 'oc19', subject: 'Organic Chemistry', question: 'What are biological catalysts that speed up chemical reactions in living things?', options: ['Hormones', 'Enzymes', 'Vitamins', 'Minerals'], correctAnswer: 1 },
  { id: 'oc20', subject: 'Organic Chemistry', question: 'What phenomenon occurs when a molecule can be represented by two or more valid Lewis structures?', options: ['Induction', 'Resonance', 'Sterics', 'Hyperconjugation'], correctAnswer: 1 },
  // Mathematics
  { id: 'math1', subject: 'Mathematics', question: 'Which branch of mathematics uses letters and symbols to represent numbers in formulas and equations?', options: ['Geometry', 'Algebra', 'Calculus', 'Statistics'], correctAnswer: 1 },
  { id: 'math2', subject: 'Mathematics', question: 'Which branch of mathematics deals with the properties and relations of points, lines, surfaces, and solids?', options: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus'], correctAnswer: 1 },
  { id: 'math3', subject: 'Mathematics', question: 'Which branch of mathematics deals with the study of continuous change?', options: ['Algebra', 'Geometry', 'Calculus', 'Statistics'], correctAnswer: 2 },
  { id: 'math4', subject: 'Mathematics', question: 'Which branch of mathematics deals with the relations of the sides and angles of triangles?', options: ['Geometry', 'Trigonometry', 'Algebra', 'Calculus'], correctAnswer: 1 },
  { id: 'math5', subject: 'Mathematics', question: 'Which branch of mathematics deals with the collection, analysis, interpretation, and presentation of masses of numerical data?', options: ['Probability', 'Statistics', 'Algebra', 'Geometry'], correctAnswer: 1 },
  { id: 'math6', subject: 'Mathematics', question: 'What is the measure of the likelihood that an event will occur?', options: ['Statistics', 'Probability', 'Algebra', 'Geometry'], correctAnswer: 1 },
  { id: 'math7', subject: 'Mathematics', question: 'What is a natural number greater than 1 that has no positive divisors other than 1 and itself?', options: ['Even number', 'Prime number', 'Odd number', 'Composite number'], correctAnswer: 1 },
  { id: 'math8', subject: 'Mathematics', question: 'What is the ratio of a circle\'s circumference to its diameter?', options: ['e', 'Pi (π)', 'i', 'phi'], correctAnswer: 1 },
  { id: 'math9', subject: 'Mathematics', question: 'What theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides?', options: ['Euler\'s theorem', 'Pythagorean theorem', 'Fermat\'s theorem', 'Newton\'s law'], correctAnswer: 1 },
  { id: 'math10', subject: 'Mathematics', question: 'What is the rate of change of a function with respect to a variable?', options: ['Integral', 'Derivative', 'Limit', 'Function'], correctAnswer: 1 },
  { id: 'math11', subject: 'Mathematics', question: 'What is the mathematical object that can be interpreted as an area under a curve?', options: ['Derivative', 'Integral', 'Limit', 'Function'], correctAnswer: 1 },
  { id: 'math12', subject: 'Mathematics', question: 'What is a rectangular array of numbers, symbols, or expressions, arranged in rows and columns?', options: ['Vector', 'Matrix', 'Scalar', 'Tensor'], correctAnswer: 1 },
  { id: 'math13', subject: 'Mathematics', question: 'What is a quantity having direction as well as magnitude?', options: ['Scalar', 'Vector', 'Matrix', 'Tensor'], correctAnswer: 1 },
  { id: 'math14', subject: 'Mathematics', question: 'What is the inverse function to exponentiation?', options: ['Exponent', 'Logarithm', 'Root', 'Power'], correctAnswer: 1 },
  { id: 'math15', subject: 'Mathematics', question: 'What is a complex geometric shape that looks the same at any level of magnification?', options: ['Shape', 'Fractal', 'Pattern', 'Symmetry'], correctAnswer: 1 },
  { id: 'math16', subject: 'Mathematics', question: 'What is a sequence of numbers where each number is the sum of the two preceding ones?', options: ['Arithmetic sequence', 'Fibonacci sequence', 'Geometric sequence', 'Harmonic sequence'], correctAnswer: 1 },
  { id: 'math17', subject: 'Mathematics', question: 'Which branch of mathematics deals with the study of sets?', options: ['Logic', 'Set theory', 'Number theory', 'Graph theory'], correctAnswer: 1 },
  { id: 'math18', subject: 'Mathematics', question: 'Which branch of mathematics deals with the study of graphs?', options: ['Set theory', 'Graph theory', 'Number theory', 'Game theory'], correctAnswer: 1 },
  { id: 'math19', subject: 'Mathematics', question: 'Which branch of mathematics deals with the study of mathematical models of strategic interaction among rational decision-makers?', options: ['Graph theory', 'Game theory', 'Set theory', 'Probability'], correctAnswer: 1 },
  { id: 'math20', subject: 'Mathematics', question: 'Which branch of mathematics deals with complex systems whose behavior is highly sensitive to slight changes in conditions?', options: ['Complexity theory', 'Chaos theory', 'Information theory', 'Control theory'], correctAnswer: 1 },
  // Music
  { id: 'mus1', subject: 'Music', question: 'What is a sequence of single notes that is musically satisfying?', options: ['Rhythm', 'Melody', 'Harmony', 'Tempo'], correctAnswer: 1 },
  { id: 'mus2', subject: 'Music', question: 'What is a strong, regular, repeated pattern of movement or sound?', options: ['Melody', 'Rhythm', 'Harmony', 'Tempo'], correctAnswer: 1 },
  { id: 'mus3', subject: 'Music', question: 'What is the combination of simultaneously sounded musical notes to produce chords and chord progressions having a pleasing effect?', options: ['Melody', 'Rhythm', 'Harmony', 'Tempo'], correctAnswer: 2 },
  { id: 'mus4', subject: 'Music', question: 'What is the speed or pace of a given piece or subsection of music?', options: ['Melody', 'Rhythm', 'Harmony', 'Tempo'], correctAnswer: 3 },
  { id: 'mus5', subject: 'Music', question: 'What is a category of artistic composition, as in music or literature, characterized by similarities in form, style, or subject matter?', options: ['Style', 'Genre', 'Category', 'Class'], correctAnswer: 1 },
  { id: 'mus6', subject: 'Music', question: 'What is a large instrumental ensemble typical of classical music, which combines instruments from different families?', options: ['Band', 'Orchestra', 'Choir', 'Ensemble'], correctAnswer: 1 },
  { id: 'mus7', subject: 'Music', question: 'Who is a person who writes music, especially as a professional occupation?', options: ['Conductor', 'Composer', 'Performer', 'Arranger'], correctAnswer: 1 },
  { id: 'mus8', subject: 'Music', question: 'Who is a person who directs the performance of an orchestra or choir?', options: ['Composer', 'Conductor', 'Performer', 'Arranger'], correctAnswer: 1 },
  { id: 'mus9', subject: 'Music', question: 'What is an object or device created or adapted to make musical sounds?', options: ['Tool', 'Instrument', 'Device', 'Apparatus'], correctAnswer: 1 },
  { id: 'mus10', subject: 'Music', question: 'What are the words of a song?', options: ['Poem', 'Lyrics', 'Script', 'Text'], correctAnswer: 1 },
  { id: 'mus11', subject: 'Music', question: 'What is a part of a song which is repeated after each verse?', options: ['Verse', 'Chorus', 'Bridge', 'Intro'], correctAnswer: 1 },
  { id: 'mus12', subject: 'Music', question: 'What is a writing which is arranged with a metrical rhythm, typically having a rhyme?', options: ['Chorus', 'Verse', 'Bridge', 'Outro'], correctAnswer: 1 },
  { id: 'mus13', subject: 'Music', question: 'What is a contrasting section that prepares for the return of the original material section?', options: ['Chorus', 'Verse', 'Bridge', 'Intro'], correctAnswer: 2 },
  { id: 'mus14', subject: 'Music', question: 'What is the quality of a sound governed by the rate of vibrations producing it; the highness or lowness of a tone?', options: ['Volume', 'Pitch', 'Tone', 'Timbre'], correctAnswer: 1 },
  { id: 'mus15', subject: 'Music', question: 'What is the varying levels of volume of sound in different parts of a musical performance?', options: ['Volume', 'Dynamic', 'Pitch', 'Tempo'], correctAnswer: 1 },
  { id: 'mus16', subject: 'Music', question: 'What is any set of musical notes ordered by fundamental frequency or pitch?', options: ['Chord', 'Scale', 'Key', 'Mode'], correctAnswer: 1 },
  { id: 'mus17', subject: 'Music', question: 'What is a group of (typically three or more) notes sounded together, as a basis of harmony?', options: ['Scale', 'Chord', 'Key', 'Mode'], correctAnswer: 1 },
  { id: 'mus18', subject: 'Music', question: 'What is the group of pitches, or scale, that forms the basis of a music composition?', options: ['Scale', 'Chord', 'Key', 'Mode'], correctAnswer: 2 },
  { id: 'mus19', subject: 'Music', question: 'What is any system used to visually represent aurally perceived music played with instruments or sung by the human voice through the use of written, printed, or otherwise-produced symbols?', options: ['Writing', 'Notation', 'Script', 'Score'], correctAnswer: 1 },
  { id: 'mus20', subject: 'Music', question: 'What is an act of staging or presenting a play, concert, or other form of entertainment?', options: ['Practice', 'Performance', 'Rehearsal', 'Gig'], correctAnswer: 1 },
  // Video
  { id: 'vid1', subject: 'Video', question: 'What is the frequency at which consecutive images called frames appear on a display?', options: ['Resolution', 'Frame rate', 'Bitrate', 'Aspect ratio'], correctAnswer: 1 },
  { id: 'vid2', subject: 'Video', question: 'What is the number of distinct pixels in each dimension that can be displayed?', options: ['Frame rate', 'Resolution', 'Bitrate', 'Aspect ratio'], correctAnswer: 1 },
  { id: 'vid3', subject: 'Video', question: 'What is the proportional relationship between its width and its height?', options: ['Resolution', 'Frame rate', 'Aspect ratio', 'Bitrate'], correctAnswer: 2 },
  { id: 'vid4', subject: 'Video', question: 'What is a device or computer program which encodes or decodes a digital data stream or signal?', options: ['Format', 'Codec', 'Container', 'Wrapper'], correctAnswer: 1 },
  { id: 'vid5', subject: 'Video', question: 'What is the process of encoding information using fewer bits than the original representation?', options: ['Expansion', 'Compression', 'Encoding', 'Decoding'], correctAnswer: 1 },
  { id: 'vid6', subject: 'Video', question: 'What is the number of bits that are conveyed or processed per unit of time?', options: ['Resolution', 'Frame rate', 'Bitrate', 'Aspect ratio'], correctAnswer: 2 },
  { id: 'vid7', subject: 'Video', question: 'What is the process of selecting and preparing written, photographic, video, or cinematic material used by a person or an entity to convey a message or information?', options: ['Filming', 'Editing', 'Directing', 'Producing'], correctAnswer: 1 },
  { id: 'vid8', subject: 'Video', question: 'What is a technique in film editing in which a series of short shots are edited into a sequence to condense space, time, and information?', options: ['Scene', 'Montage', 'Sequence', 'Shot'], correctAnswer: 1 },
  { id: 'vid9', subject: 'Video', question: 'What is a graphic organizer in the form of illustrations or images displayed in sequence for the purpose of pre-visualizing a motion picture, animation, motion graphic or interactive media sequence?', options: ['Script', 'Storyboard', 'Outline', 'Plan'], correctAnswer: 1 },
  { id: 'vid10', subject: 'Video', question: 'What is the art of motion-picture photography and filming?', options: ['Directing', 'Cinematography', 'Editing', 'Lighting'], correctAnswer: 1 },
  { id: 'vid11', subject: 'Video', question: 'What is the craft of using light to create a mood and tell a story?', options: ['Sound', 'Lighting', 'Camera', 'Action'], correctAnswer: 1 },
  { id: 'vid12', subject: 'Video', question: 'What is the process of specifying, acquiring, manipulating or generating audio elements in a variety of disciplines?', options: ['Music', 'Sound design', 'Foley', 'Mixing'], correctAnswer: 1 },
  { id: 'vid13', subject: 'Video', question: 'What are illusions or visual tricks used in the theatre, film, television, video game, and simulator industries to simulate the imagined events in a story or virtual world?', options: ['Visual effects', 'Special effects', 'CGI', 'Animation'], correctAnswer: 1 },
  { id: 'vid14', subject: 'Video', question: 'What is the process by which imagery is created or manipulated outside the context of a live action shot in filmmaking and video production?', options: ['Special effects', 'Visual effects', 'CGI', 'Animation'], correctAnswer: 1 },
  { id: 'vid15', subject: 'Video', question: 'What is the part of filmmaking, video production, and photography process that occurs after principal photography is complete?', options: ['Pre-production', 'Production', 'Post-production', 'Distribution'], correctAnswer: 2 },
  { id: 'vid16', subject: 'Video', question: 'What is the process of generating a photorealistic or non-photorealistic image from a 2D or 3D model by means of a computer program?', options: ['Exporting', 'Rendering', 'Encoding', 'Saving'], correctAnswer: 1 },
  { id: 'vid17', subject: 'Video', question: 'What is a method of transmitting or receiving data over a computer network as a steady, continuous flow?', options: ['Downloading', 'Streaming', 'Uploading', 'Sharing'], correctAnswer: 1 },
  { id: 'vid18', subject: 'Video', question: 'What is a simulated experience that can be similar to or completely different from the real world?', options: ['Augmented Reality', 'Virtual Reality', 'Mixed Reality', 'Extended Reality'], correctAnswer: 1 },
  { id: 'vid19', subject: 'Video', question: 'What is an interactive experience of a real-world environment where the objects that reside in the real world are enhanced by computer-generated perceptual information?', options: ['Virtual Reality', 'Augmented Reality', 'Mixed Reality', 'Extended Reality'], correctAnswer: 1 },
  { id: 'vid20', subject: 'Video', question: 'What is a generic term for display devices or content having horizontal resolution on the order of 4,000 pixels?', options: ['HD', 'Full HD', '4K', '8K'], correctAnswer: 2 },
  // Cybersecurity
  { id: 'cyb1', subject: 'Cybersecurity', question: 'What is the fraudulent practice of sending emails purporting to be from reputable companies in order to induce individuals to reveal personal information?', options: ['Spam', 'Phishing', 'Malware', 'Ransomware'], correctAnswer: 1 },
  { id: 'cyb2', subject: 'Cybersecurity', question: 'What is software that is specifically designed to disrupt, damage, or gain unauthorized access to a computer system?', options: ['Virus', 'Malware', 'Worm', 'Trojan'], correctAnswer: 1 },
  { id: 'cyb3', subject: 'Cybersecurity', question: 'What is a type of malicious software designed to block access to a computer system until a sum of money is paid?', options: ['Spyware', 'Ransomware', 'Adware', 'Bloatware'], correctAnswer: 1 },
  { id: 'cyb4', subject: 'Cybersecurity', question: 'What is a network security system that monitors and controls incoming and outgoing network traffic based on predetermined security rules?', options: ['Antivirus', 'Firewall', 'VPN', 'Proxy'], correctAnswer: 1 },
  { id: 'cyb5', subject: 'Cybersecurity', question: 'What is the process of converting information or data into a code, especially to prevent unauthorized access?', options: ['Decryption', 'Encryption', 'Hashing', 'Salting'], correctAnswer: 1 },
  { id: 'cyb6', subject: 'Cybersecurity', question: 'What is a security process in which users provide two different authentication factors to verify themselves?', options: ['Single-factor', 'Two-factor', 'Multi-factor', 'Biometric'], correctAnswer: 1 },
  { id: 'cyb7', subject: 'Cybersecurity', question: 'What is a computer program that allows users to store, generate, and manage their personal passwords for online services?', options: ['Browser', 'Password manager', 'Wallet', 'Vault'], correctAnswer: 1 },
  { id: 'cyb8', subject: 'Cybersecurity', question: 'What extends a private network across a public network and enables users to send and receive data across shared or public networks as if their computing devices were directly connected to the private network?', options: ['Proxy', 'VPN', 'Firewall', 'Router'], correctAnswer: 1 },
  { id: 'cyb9', subject: 'Cybersecurity', question: 'What is the use of deception to manipulate individuals into divulging confidential or personal information that may be used for fraudulent purposes?', options: ['Hacking', 'Social engineering', 'Phishing', 'Spoofing'], correctAnswer: 1 },
  { id: 'cyb10', subject: 'Cybersecurity', question: 'What is a computer-software vulnerability that is unknown to those who should be interested in mitigating the vulnerability?', options: ['Known exploit', 'Zero-day exploit', 'Patch', 'Update'], correctAnswer: 1 },
  { id: 'cyb11', subject: 'Cybersecurity', question: 'What is a malicious attempt to disrupt the normal traffic of a targeted server, service or network by overwhelming the target or its surrounding infrastructure with a flood of Internet traffic?', options: ['DoS attack', 'DDoS attack', 'Botnet', 'Zombie'], correctAnswer: 1 },
  { id: 'cyb12', subject: 'Cybersecurity', question: 'What is a code injection technique, used to attack data-driven applications, in which malicious SQL statements are inserted into an entry field for execution?', options: ['XSS', 'SQL injection', 'CSRF', 'RCE'], correctAnswer: 1 },
  { id: 'cyb13', subject: 'Cybersecurity', question: 'What is a type of security vulnerability typically found in web applications which enables attackers to inject client-side scripts into web pages viewed by other users?', options: ['SQL injection', 'XSS', 'CSRF', 'RCE'], correctAnswer: 1 },
  { id: 'cyb14', subject: 'Cybersecurity', question: 'What is a number of Internet-connected devices, each of which is running one or more bots?', options: ['Network', 'Botnet', 'Cluster', 'Grid'], correctAnswer: 1 },
  { id: 'cyb15', subject: 'Cybersecurity', question: 'What is the practice of testing a computer system, network or web application to find security vulnerabilities that an attacker could exploit?', options: ['Vulnerability scanning', 'Penetration testing', 'Security audit', 'Risk assessment'], correctAnswer: 1 },
  { id: 'cyb16', subject: 'Cybersecurity', question: 'What is an organized approach to addressing and managing the aftermath of a security breach or cyberattack?', options: ['Disaster recovery', 'Incident response', 'Business continuity', 'Risk management'], correctAnswer: 1 },
  { id: 'cyb17', subject: 'Cybersecurity', question: 'What is an incident in which sensitive, protected or confidential data has potentially been viewed, stolen or used by an individual unauthorized to do so?', options: ['Data leak', 'Data breach', 'Data loss', 'Data theft'], correctAnswer: 1 },
  { id: 'cyb18', subject: 'Cybersecurity', question: 'What is the fraudulent acquisition and use of a person\'s private identifying information, usually for financial gain?', options: ['Fraud', 'Identity theft', 'Impersonation', 'Forgery'], correctAnswer: 1 },
  { id: 'cyb19', subject: 'Cybersecurity', question: 'What are body measurements and calculations related to human characteristics?', options: ['Passwords', 'Biometrics', 'Tokens', 'Keys'], correctAnswer: 1 },
  { id: 'cyb20', subject: 'Cybersecurity', question: 'What is the process that involves identifying, acquiring, installing, and verifying patches for products and systems?', options: ['Update management', 'Patch management', 'Software management', 'System management'], correctAnswer: 1 },
  // Safety
  { id: 'saf1', subject: 'Safety', question: 'What is protective clothing, helmets, goggles, or other garments or equipment designed to protect the wearer\'s body from injury or infection?', options: ['Safety gear', 'PPE', 'Work clothes', 'Uniform'], correctAnswer: 1 },
  { id: 'saf2', subject: 'Safety', question: 'What is a potential source of harm or adverse health effect on a person or persons?', options: ['Risk', 'Hazard', 'Danger', 'Threat'], correctAnswer: 1 },
  { id: 'saf3', subject: 'Safety', question: 'What is a systematic process of evaluating the potential risks that may be involved in a projected activity or undertaking?', options: ['Safety audit', 'Risk assessment', 'Hazard identification', 'Safety check'], correctAnswer: 1 },
  { id: 'saf4', subject: 'Safety', question: 'What is help given to a sick or injured person until full medical treatment is available?', options: ['Medical care', 'First aid', 'Emergency response', 'Rescue'], correctAnswer: 1 },
  { id: 'saf5', subject: 'Safety', question: 'What is a portable device that discharges a jet of water, foam, gas, or other material to extinguish a fire?', options: ['Fire hose', 'Fire extinguisher', 'Fire blanket', 'Fire alarm'], correctAnswer: 1 },
  { id: 'saf6', subject: 'Safety', question: 'What is the action of evacuating a person or a place?', options: ['Exit', 'Evacuation', 'Escape', 'Withdrawal'], correctAnswer: 1 },
  { id: 'saf7', subject: 'Safety', question: 'What is a document that lists information relating to occupational safety and health for the use of various substances and products?', options: ['Product label', 'SDS', 'Manual', 'Guide'], correctAnswer: 1 },
  { id: 'saf8', subject: 'Safety', question: 'What is the study of people\'s efficiency in their working environment?', options: ['Comfort', 'Ergonomics', 'Efficiency', 'Design'], correctAnswer: 1 },
  { id: 'saf9', subject: 'Safety', question: 'What is a safety procedure used in industry and research settings to ensure that dangerous machines are properly shut off and not able to be started up again prior to the completion of maintenance or repair work?', options: ['Safety lock', 'LOTO', 'Power off', 'Tagging'], correctAnswer: 1 },
  { id: 'saf10', subject: 'Safety', question: 'What is the use of controls which are designed to protect personnel from falling or in the event they do fall, to stop them without causing severe injury?', options: ['Safety net', 'Fall protection', 'Harness', 'Railing'], correctAnswer: 1 },
  { id: 'saf11', subject: 'Safety', question: 'What is a multidisciplinary field concerned with the safety, health, and welfare of people at occupation?', options: ['Workplace safety', 'OHS', 'Industrial safety', 'Employee health'], correctAnswer: 1 },
  { id: 'saf12', subject: 'Safety', question: 'What is an unplanned event that did not result in injury, illness, or damage - but had the potential to do so?', options: ['Accident', 'Near miss', 'Incident', 'Close call'], correctAnswer: 1 },
  { id: 'saf13', subject: 'Safety', question: 'What is the collection of beliefs, perceptions and values that employees share in relation to risks within an organization?', options: ['Safety rules', 'Safety culture', 'Safety mindset', 'Safety awareness'], correctAnswer: 1 },
  { id: 'saf14', subject: 'Safety', question: 'What is a plan for dealing with an emergency?', options: ['Action plan', 'Emergency plan', 'Safety plan', 'Response plan'], correctAnswer: 1 },
  { id: 'saf15', subject: 'Safety', question: 'What is a formal, documented process to identify hazards in the workplace?', options: ['Safety walk', 'Workplace inspection', 'Safety audit', 'Compliance check'], correctAnswer: 1 },
  { id: 'saf16', subject: 'Safety', question: 'What is the process of learning the skills that you need for a particular job or activity?', options: ['Education', 'Training', 'Instruction', 'Coaching'], correctAnswer: 1 },
  { id: 'saf17', subject: 'Safety', question: 'What is the act of giving a spoken or written account of something that one has observed, heard, done, or investigated?', options: ['Logging', 'Reporting', 'Notifying', 'Documenting'], correctAnswer: 1 },
  { id: 'saf18', subject: 'Safety', question: 'What is the action or fact of complying with a wish or command?', options: ['Adherence', 'Compliance', 'Conformity', 'Obedience'], correctAnswer: 1 },
  { id: 'saf19', subject: 'Safety', question: 'What is a type of sign which indicates a specific hazard or hazardous condition that is not likely to be life-threatening?', options: ['Notice', 'Warning sign', 'Alert', 'Signal'], correctAnswer: 1 },
  { id: 'saf20', subject: 'Safety', question: 'Who is a person responsible for the safety of people in a workplace?', options: ['Safety manager', 'Safety officer', 'Safety inspector', 'Safety coordinator'], correctAnswer: 1 },
  // Administration
  { id: 'adm1', subject: 'Administration', question: 'What is the process of dealing with or controlling things or people?', options: ['Leadership', 'Management', 'Administration', 'Governance'], correctAnswer: 1 },
  { id: 'adm2', subject: 'Administration', question: 'What is the process of making plans for something?', options: ['Organizing', 'Planning', 'Leading', 'Controlling'], correctAnswer: 1 },
  { id: 'adm3', subject: 'Administration', question: 'What is the process of arranging several elements into a purposeful order or structure?', options: ['Planning', 'Organizing', 'Leading', 'Controlling'], correctAnswer: 1 },
  { id: 'adm4', subject: 'Administration', question: 'What is the action of leading a group of people or an organization?', options: ['Planning', 'Organizing', 'Leading', 'Controlling'], correctAnswer: 2 },
  { id: 'adm5', subject: 'Administration', question: 'What is the power to influence or direct people\'s behavior or the course of events?', options: ['Planning', 'Organizing', 'Leading', 'Controlling'], correctAnswer: 3 },
  { id: 'adm6', subject: 'Administration', question: 'What is a system of government in which most of the important decisions are taken by state officials rather than by elected representatives?', options: ['Hierarchy', 'Bureaucracy', 'Meritocracy', 'Autocracy'], correctAnswer: 1 },
  { id: 'adm7', subject: 'Administration', question: 'What is the implementation of government policy and also an academic discipline that studies this implementation and prepares civil servants for working in the public service?', options: ['Business administration', 'Public administration', 'Social administration', 'Political administration'], correctAnswer: 1 },
  { id: 'adm8', subject: 'Administration', question: 'What is the set of people who make up the workforce of an organization, business sector, industry, or economy?', options: ['Personnel', 'HR', 'Talent management', 'Workforce'], correctAnswer: 1 },
  { id: 'adm9', subject: 'Administration', question: 'What is an estimate of income and expenditure for a set period of time?', options: ['Accounting', 'Budgeting', 'Financing', 'Auditing'], correctAnswer: 1 },
  { id: 'adm10', subject: 'Administration', question: 'What is the process of formulating policies, especially in politics?', options: ['Decision making', 'Policy making', 'Strategy formulation', 'Planning'], correctAnswer: 1 },
  { id: 'adm11', subject: 'Administration', question: 'What is a diagram that shows the structure of an organization and the relationships and relative ranks of its parts and positions/jobs?', options: ['Flowchart', 'Organizational chart', 'Diagram', 'Map'], correctAnswer: 1 },
  { id: 'adm12', subject: 'Administration', question: 'What is the assignment of any authority to another person to carry out specific activities?', options: ['Assignment', 'Delegation', 'Empowerment', 'Supervision'], correctAnswer: 1 },
  { id: 'adm13', subject: 'Administration', question: 'What is the fact or condition of being accountable; responsibility?', options: ['Responsibility', 'Accountability', 'Liability', 'Answerability'], correctAnswer: 1 },
  { id: 'adm14', subject: 'Administration', question: 'What is the quality of being done in an open way without secrets?', options: ['Openness', 'Transparency', 'Clarity', 'Honesty'], correctAnswer: 1 },
  { id: 'adm15', subject: 'Administration', question: 'What are moral principles that govern a person\'s behavior or the conducting of an activity?', options: ['Morals', 'Ethics', 'Values', 'Principles'], correctAnswer: 1 },
  { id: 'adm16', subject: 'Administration', question: 'What is the continuous planning, monitoring, analysis and assessment of all that is necessary for an organization to meet its goals and objectives?', options: ['Operational management', 'Strategic management', 'Tactical management', 'Project management'], correctAnswer: 1 },
  { id: 'adm17', subject: 'Administration', question: 'What is a method by which the job performance of an employee is documented and evaluated?', options: ['Evaluation', 'Performance appraisal', 'Review', 'Assessment'], correctAnswer: 1 },
  { id: 'adm18', subject: 'Administration', question: 'What is the process by which two or more parties reach a peaceful solution to a dispute?', options: ['Mediation', 'Conflict resolution', 'Negotiation', 'Arbitration'], correctAnswer: 1 },
  { id: 'adm19', subject: 'Administration', question: 'What is a collective term for all approaches to prepare, support, and help individuals, teams, and organizations in making organizational change?', options: ['Innovation', 'Change management', 'Transformation', 'Adaptation'], correctAnswer: 1 },
  { id: 'adm20', subject: 'Administration', question: 'What is a leader\'s method of providing direction, implementing plans, and motivating people?', options: ['Management style', 'Leadership style', 'Working style', 'Communication style'], correctAnswer: 1 },
  // Biology (Advanced)
  { id: 'bi_adv1', subject: 'Biology', question: 'How can multilevel selection be empirically tested in natural populations without confounding individual and group covariance?', options: ['By using the Price Equation to decompose total covariance into individual and group components', 'By observing individual survival rates in isolation', 'By measuring total population growth without considering sub-groups', 'By ignore environmental variance'], correctAnswer: 0 },
  { id: 'bi_adv2', subject: 'Biology', question: 'What genomic signature most plausibly distinguishes between ecological opportunity and genetic constraints in adaptive radiations?', options: ['Rapid diversification of niche-specific functional genes compared to neutral regions', 'Uniform mutation rates across the entire genome', 'Conserved sequences in housekeeping genes', 'Reduction in total genome size'], correctAnswer: 0 },
  { id: 'bi_adv3', subject: 'Biology', question: 'To what extent does sign epistasis determine the accessibility of evolutionary trajectories?', options: ['It creates multi-modal fitness landscapes with isolated peaks', 'It ensures a smooth, linear progression of traits', 'It has no effect on the speed of selection', 'It only affects phenotypic plasticity'], correctAnswer: 0 },
  { id: 'bi_adv4', subject: 'Biology', question: 'Which mechanism is most central to the "neutral theory of molecular evolution"?', options: ['Genetic drift of selectively neutral mutations', 'Intense directional selection', 'High rate of beneficial mutations', 'Stabilizing selection on all alleles'], correctAnswer: 0 },
  { id: 'bi_adv5', subject: 'Biology', question: 'In phylogenomics, what is "incomplete lineage sorting" (ILS)?', options: ['A phenomenon where gene trees differ from species trees due to ancestral polymorphism', 'The failure of a species to reproduce', 'Errors in DNA sequencing algorithms', 'The loss of mitochondrial DNA in hybrids'], correctAnswer: 0 },
  { id: 'bi_adv6', subject: 'Biology', question: 'What is the primary cause of "Müller\'s Ratchet" in asexual populations?', options: ['Irreversible accumulation of deleterious mutations', 'Increased genetic recombination', 'Adaptation to changing environments', 'Rapid population expansion'], correctAnswer: 0 },
  { id: 'bi_adv7', subject: 'Biology', question: 'How does balancing selection maintain genetic polymorphism within a population?', options: ['By favoring heterozygotes or through frequency-dependent selection', 'By eliminating all rare alleles', 'By promoting high rates of inbreeding', 'By fixing a single dominant phenotype'], correctAnswer: 0 },
  { id: 'bi_adv8', subject: 'Biology', question: 'What describes the "Red Queen Hypothesis" in evolutionary biology?', options: ['Species must constantly evolve to survive against ever-evolving opposing organisms', 'Populations grow until they reach an environmental carrying capacity', 'Evolution always leads to more complex forms of life', 'The dominant species in an ecosystem is determined by sheer size'], correctAnswer: 0 },
  { id: 'bi_adv9', subject: 'Biology', question: 'In developmental biology, what defines "canalization"?', options: ['The robustness of a phenotype against genetic or environmental perturbations', 'The process of forming blood vessels', 'The ability of a cell to become any tissue type', 'The mutation of master regulator genes'], correctAnswer: 0 },
  { id: 'bi_adv10', subject: 'Biology', question: 'What is "genetic hitchhiking" (selective sweep)?', options: ['When a neutral allele increases in frequency because it is linked to a beneficial mutation', 'Movement of genes via horizontal gene transfer', 'The spread of parasites through a meta-population', 'Increased mutation rates in response to stress'], correctAnswer: 0 },
  { id: 'bi_adv11', subject: 'Biology', question: 'Which concept explains why highly cooperative behaviors exist despite the cost to individuals?', options: ['Inclusive fitness (Kin Selection)', 'Spiteful behavior', 'Pure altruism without benefit', 'Over-dominance'], correctAnswer: 0 },
  { id: 'bi_adv12', subject: 'Biology', question: 'What is the primary role of "Hox genes" in animal development?', options: ['Specifying the identity of body segments along the anterior-posterior axis', 'Regulating the rate of ATP production', 'Transcribing ribosomal RNA', 'Synthesizing collagen in connective tissues'], correctAnswer: 0 },
  { id: 'bi_adv13', subject: 'Biology', question: 'What is "pleiotropy" in genetics?', options: ['When a single gene influences multiple seemingly unrelated phenotypic traits', 'When multiple genes influence a single trait', 'The loss of a chromosome', 'Repetitive sequences of non-coding DNA'], correctAnswer: 0 },
  { id: 'bi_adv14', subject: 'Biology', question: 'Define "allopatric speciation".', options: ['Speciation occurring due to geographic isolation', 'Speciation within the same geographic area', 'Speciation via hybridization', 'Speciation driven by behavioral changes only'], correctAnswer: 0 },
  { id: 'bi_adv15', subject: 'Biology', question: 'What is the "C-value enigma"?', options: ['The lack of correlation between genome size and organismal complexity', 'The difficulty in measuring carbon isotopes', 'The variation in speed of the Calvin cycle', 'The rate of CO2 absorption in forests'], correctAnswer: 0 },
  { id: 'bi_adv16', subject: 'Biology', question: 'In epigenetics, what does DNA methylation typically achieve?', options: ['Gene silencing or reduced gene expression', 'Increased mutation rates', 'Amplification of ribosomal genes', 'Cleavage of the DNA backbone'], correctAnswer: 0 },
  { id: 'bi_adv17', subject: 'Biology', question: 'What is a "clinal variation"?', options: ['A gradual change in a trait or allele frequency across a geographic gradient', 'A sudden mutation in a small population', 'The extinction of a lineage', 'Random fluctuation in population size'], correctAnswer: 0 },
  { id: 'bi_adv18', subject: 'Biology', question: 'Define "horizontal gene transfer" (HGT).', options: ['Movement of genetic material between unicellular or multicellular organisms other than by parent-to-offspring inheritance', 'Inheritance from grandparents to grandchildren', 'The crossing over of chromosomes during meiosis', 'The mutation of somatic cells'], correctAnswer: 0 },
  { id: 'bi_adv19', subject: 'Biology', question: 'What does the "biological species concept" primarily rely on?', options: ['Reproductive isolation between groups', 'Morphological similarity', 'Niche specialization', 'Phylogenetic distance'], correctAnswer: 0 },
  { id: 'bi_adv20', subject: 'Biology', question: 'What is "convergent evolution"?', options: ['When distantly related organisms independently evolve similar traits', 'When one species splits into two', 'When two species merge into one', 'The gradual extinction of related species'], correctAnswer: 0 },

  // Quantum Physics
  { id: 'qp1', subject: 'Quantum Physics', question: 'What is the primary implication of a violation of Bell\'s inequalities?', options: ['Rejection of local realism in quantum mechanics', 'Validation of hidden variable theories', 'Confirmation that particles have definite paths', 'The speed of light is infinite'], correctAnswer: 0 },
  { id: 'qp2', subject: 'Quantum Physics', question: 'What is "Quantum Decoherence"?', options: ['The process by which a quantum system loses its coherence due to interaction with the environment', 'The fusion of two quantum particles', 'The creation of a vacuum state', 'The acceleration of electrons'], correctAnswer: 0 },
  { id: 'qp3', subject: 'Quantum Physics', question: 'What does the "Heisenberg Uncertainty Principle" fundamentally limit?', options: ['The simultaneous precision of conjugate variables like position and momentum', 'The total energy of a closed system', 'The speed at which a particle can move', 'The number of electrons in an atom'], correctAnswer: 0 },
  { id: 'qp4', subject: 'Quantum Physics', question: 'In the Context of "Wave-Particle Duality", which experiment first demonstrated the wave-like property of electrons?', options: ['Davisson-Germer experiment', 'Stern-Gerlach experiment', 'Michelson-Morley experiment', 'Rutherford gold foil experiment'], correctAnswer: 0 },
  { id: 'qp5', subject: 'Quantum Physics', question: 'What is "Quantum Tunneling"?', options: ['A phenomenon where a particle passes through a potential barrier that it classically could not surmount', 'The movement of particles through fiber optics', 'The collapse of a black hole', 'The teleportation of solid objects'], correctAnswer: 0 },
  { id: 'qp6', subject: 'Quantum Physics', question: 'What is the "Pauli Exclusion Principle"?', options: ['No two fermions can occupy the same quantum state simultaneously', 'All bosons must be in the same state', 'Gravity does not affect photons', 'Light cannot escape a black hole'], correctAnswer: 0 },
  { id: 'qp7', subject: 'Quantum Physics', question: 'What describes "Entanglement" in quantum systems?', options: ['State particles are linked such that the measurement of one instantly influences the other regardless of distance', 'The gravitational pull between two atoms', 'The bumping of particles in a gas', 'The overlap of two different wave frequencies'], correctAnswer: 0 },
  { id: 'qp8', subject: 'Quantum Physics', question: 'What is a "Qubit"?', options: ['The basic unit of quantum information', 'A type of subatomic particle', 'A measurement of quantum time', 'A cooling device for processors'], correctAnswer: 0 },
  { id: 'qp9', subject: 'Quantum Physics', question: 'What is the "Schrödinger Equation" used for?', options: ['Determining the evolution of a quantum state over time', 'Calculating the force of gravity', 'Finding the volume of a sphere', 'Measuring the heat of a reaction'], correctAnswer: 0 },
  { id: 'qp10', subject: 'Quantum Physics', question: 'Define "Superposition".', options: ['The ability of a quantum system to be in multiple states at the same time until measured', 'The stacking of heavy elements', 'A state of zero gravity', 'The alignment of planets'], correctAnswer: 0 },
  { id: 'qp11', subject: 'Quantum Physics', question: 'What is the "Compton Effect"?', options: ['The increase in wavelength of X-rays or gamma rays when scattered by electrons', 'The emission of light from heated objects', 'The bending of light around massive stars', 'The vibration of atoms in a crystal'], correctAnswer: 0 },
  { id: 'qp12', subject: 'Quantum Physics', question: 'What is "Planck\'s Constant" (h)?', options: ['A fundamental constant representing the scale of quantization', 'The speed of sound in a vacuum', 'The mass of a proton', 'The charge of an electron'], correctAnswer: 0 },
  { id: 'qp13', subject: 'Quantum Physics', question: 'What are "Virtual Particles"?', options: ['Fluctuations in a field that exist briefly without violating energy conservation', 'Particles in a computer simulation', 'Dead particles', 'Massless photons only'], correctAnswer: 0 },
  { id: 'qp14', subject: 'Quantum Physics', question: 'In the "Stern-Gerlach experiment", what property of the atom was demonstrated?', options: ['Space quantization of angular momentum (spin)', 'The mass of the nucleus', 'The existence of neutrons', 'The speed of valence electrons'], correctAnswer: 0 },
  { id: 'qp15', subject: 'Quantum Physics', question: 'What is the "Bose-Einstein Condensate"?', options: ['A state of matter where atoms are cooled to near absolute zero and occupy the same lowest quantum state', 'The center of a neutron star', 'A type of solar flare', 'Liquid nitrogen'], correctAnswer: 0 },
  { id: 'qp16', subject: 'Quantum Physics', question: 'What does "Bra-Ket notation" (Dirac notation) represent?', options: ['Quantum states as vectors in a Hilbert space', 'A way to write musical notes', 'Chemical bonds in organic molecules', 'The coordinates of a star'], correctAnswer: 0 },
  { id: 'qp17', subject: 'Quantum Physics', question: 'What is "Quantum Chromodynamics" (QCD)?', options: ['The theory of the strong interaction between quarks and gluons', 'The study of colored light', 'A method for coloring glass', 'The physics of rainbows'], correctAnswer: 0 },
  { id: 'qp18', subject: 'Quantum Physics', question: 'What is the "Casimir Effect"?', options: ['A physical force arising from quantum field fluctuations in a vacuum', 'The friction between two sliding surfaces', 'The cooling of a gas through expansion', 'The rotation of a galaxy'], correctAnswer: 0 },
  { id: 'qp19', subject: 'Quantum Physics', question: 'Define "Zero-Point Energy".', options: ['The lowest possible energy that a quantum mechanical system may have', 'No energy at all', 'Energy at room temperature', 'The energy of a stationary car'], correctAnswer: 0 },
  { id: 'qp20', subject: 'Quantum Physics', question: 'What is the "Many-Worlds Interpretation"?', options: ['A theory suggesting every quantum event branch into a new universe', 'The idea that space is infinite', 'A science fiction trope with no basis in physics', 'The belief that other planets have life'], correctAnswer: 0 },

  // Security
  { id: 'sec1', subject: 'Security', question: 'What is a useful or valuable thing, person, or quality?', options: ['Resource', 'Asset', 'Property', 'Value'], correctAnswer: 1 },
  { id: 'sec2', subject: 'Security', question: 'What is a statement of an intention to inflict pain, injury, damage, or other hostile action on someone in retribution for something done or not done?', options: ['Risk', 'Threat', 'Vulnerability', 'Impact'], correctAnswer: 1 },
  { id: 'sec3', subject: 'Security', question: 'What is the quality or state of being exposed to the possibility of being attacked or harmed, either physically or emotionally?', options: ['Weakness', 'Vulnerability', 'Flaw', 'Gap'], correctAnswer: 1 },
  { id: 'sec4', subject: 'Security', question: 'What is a situation involving exposure to danger?', options: ['Danger', 'Risk', 'Uncertainty', 'Hazard'], correctAnswer: 1 },
  { id: 'sec5', subject: 'Security', question: 'What is the selective restriction of access to a place or other resource?', options: ['Authentication', 'Access control', 'Authorization', 'Identification'], correctAnswer: 1 },
  { id: 'sec6', subject: 'Security', question: 'What is close observation, especially of a suspected spy or criminal?', options: ['Monitoring', 'Surveillance', 'Observation', 'Inspection'], correctAnswer: 1 },
  { id: 'sec7', subject: 'Security', question: 'What describes security measures that are designed to deny unauthorized access to facilities, equipment and resources and to protect personnel and property from damage or harm?', options: ['Cybersecurity', 'Physical security', 'Information security', 'Network security'], correctAnswer: 1 },
  { id: 'sec8', subject: 'Security', question: 'What are body measurements and calculations related to human characteristics?', options: ['Passwords', 'Biometrics', 'Tokens', 'Keys'], correctAnswer: 1 },
  { id: 'sec9', subject: 'Security', question: 'What is the first line of defense in a physical security system?', options: ['Internal security', 'Perimeter security', 'Boundary security', 'Edge security'], correctAnswer: 1 },
  { id: 'sec10', subject: 'Security', question: 'What is a system that signals the presence of a hazard requiring urgent attention, such as a fire or a burglary?', options: ['Alert system', 'Alarm system', 'Warning system', 'Notification system'], correctAnswer: 1 },
  { id: 'sec11', subject: 'Security', question: 'Who is a person employed by a public or private party to protect the employing party\'s assets from various hazards by enforcing preventative measures?', options: ['Officer', 'Security guard', 'Warden', 'Sentinel'], correctAnswer: 1 },
  { id: 'sec12', subject: 'Security', question: 'What is the use of video cameras to transmit a signal to a specific place, on a limited set of monitors?', options: ['Camera', 'CCTV', 'Video surveillance', 'IP camera'], correctAnswer: 1 },
  { id: 'sec13', subject: 'Security', question: 'What is the process of identifying, analyzing, and correcting hazards to prevent a future re-occurrence?', options: ['Crisis management', 'Incident management', 'Event management', 'Problem management'], correctAnswer: 1 },
  { id: 'sec14', subject: 'Security', question: 'What involves a set of policies, tools and procedures to enable the recovery or continuation of vital technology infrastructure and systems following a natural or human-induced disaster?', options: ['Business continuity', 'Disaster recovery', 'Backup', 'Restoration'], correctAnswer: 1 },
  { id: 'sec15', subject: 'Security', question: 'What is the psychological manipulation of people into performing actions or divulging confidential information?', options: ['Hacking', 'Social engineering', 'Manipulation', 'Deception'], correctAnswer: 1 },
  { id: 'sec16', subject: 'Security', question: 'What is the process of looking up and compiling criminal records, commercial records, and financial records of an individual or an organization?', options: ['Vetting', 'Background check', 'Screening', 'Investigation'], correctAnswer: 1 },
  { id: 'sec17', subject: 'Security', question: 'What is a document that outlines the rules, laws and regulations that a person must follow while using an organization\'s technology and information assets?', options: ['Safety policy', 'Security policy', 'Privacy policy', 'Usage policy'], correctAnswer: 1 },
  { id: 'sec18', subject: 'Security', question: 'What is the action or fact of complying with a wish or command?', options: ['Adherence', 'Compliance', 'Conformity', 'Regulation'], correctAnswer: 1 },
  { id: 'sec19', subject: 'Security', question: 'What is the process of converting information or data into a code, especially to prevent unauthorized access?', options: ['Coding', 'Encryption', 'Scrambling', 'Hiding'], correctAnswer: 1 },
  { id: 'sec20', subject: 'Security', question: 'What is a network security system that monitors and controls incoming and outgoing network traffic based on predetermined security rules?', options: ['Barrier', 'Firewall', 'Shield', 'Guard'], correctAnswer: 1 },
];

export const EfadoMoneyQuiz: React.FC<EfadoMoneyQuizProps> = ({ user, onUpdateBalance, onAddTransaction, onClose }) => {
  const { formatPrice, selectedCurrency } = useCurrency();
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'result'>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [totalTimeLeft, setTotalTimeLeft] = useState(60);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(10);
  const [currentGain, setCurrentGain] = useState(0);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWalletHub, setShowWalletHub] = useState<{ active: boolean; type: 'deposit' | 'withdraw' }>({ active: false, type: 'deposit' });
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const paymentCategories = [
    {
      id: 'mobile_money',
      title: 'Mobile Money',
      icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
      options: [
        { id: 'opay', name: 'OPay' },
        { id: 'palmpay', name: 'PalmPay' },
        { id: 'kuda', name: 'Kuda' }
      ]
    },
    {
      id: 'bank_transfer',
      title: 'Bank Transfer',
      icon: <Building2 className="w-5 h-5 text-blue-400" />,
      options: [
        { id: 'zenith', name: 'Zenith' },
        { id: 'gtbank', name: 'GTBank' },
        { id: 'access', name: 'Access' },
        { id: 'uba', name: 'UBA' }
      ]
    },
    {
      id: 'cards',
      title: 'Cards',
      icon: <CreditCard className="w-5 h-5 text-purple-400" />,
      options: [
        { id: 'visa', name: 'Visa' },
        { id: 'mastercard', name: 'Mastercard' },
        { id: 'verve', name: 'Verve' }
      ]
    },
    {
      id: 'ussd',
      title: 'USSD Code',
      icon: <Hash className="w-5 h-5 text-orange-400" />,
      options: [
        { id: 'efado_pay', name: '*EFADO*PAY#' },
        { id: 'ussd_894', name: '*894#' },
        { id: 'ussd_737', name: '*737#' }
      ]
    },
    {
      id: 'crypto',
      title: 'Crypto',
      icon: <Bitcoin className="w-5 h-5 text-yellow-500" />,
      options: [
        { id: 'btc', name: 'Bitcoin (BTC)' },
        { id: 'eth', name: 'Ethereum (ETH)' },
        { id: 'usdt', name: 'USDT (TRC20)' }
      ]
    }
  ];

  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'error' | 'info'}[]>([]);
  const [winType, setWinType] = useState<'none' | 'small' | 'big'>('none');
  const [animatedPrize, setAnimatedPrize] = useState(0);
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());

  const currentStage = STAGES[selectedStageIndex];
  const stakeAmount = currentStage.stake;
  const potentialWin = currentStage.prize;
  const gainPerQuestion = stakeAmount / 6;

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject) 
        : [...prev, subject]
    );
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const startGame = async () => {
    if (user.depositWallet < stakeAmount) {
      addNotification('Insufficient Funds / Balance', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      // Deduct stake
      await onUpdateBalance(stakeAmount, 'game_bet');
      await onAddTransaction({
        userId: user.uid,
        type: 'game_bet',
        amount: stakeAmount,
        currency: 'NGN',
        status: 'completed',
        description: 'EFADO Money Quiz Stake'
      });

      // Select 6 random questions from selected subjects
      let pool = QUESTIONS.filter(q => 
        selectedSubjects.includes(q.subject) && !usedQuestionIds.has(q.id)
      );

      // If we don't have enough unused questions, reset the used set for the selected subjects
      if (pool.length < 6) {
        pool = QUESTIONS.filter(q => selectedSubjects.includes(q.subject));
        // Clear used questions that belong to current selected subjects
        const nextUsed = new Set(usedQuestionIds);
        pool.forEach(q => nextUsed.delete(q.id));
        setUsedQuestionIds(nextUsed);
      }

      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const selected: QuizQuestion[] = shuffled.slice(0, 6);

      // Track these as used
      setUsedQuestionIds(prev => {
        const next = new Set(prev);
        selected.forEach(q => next.add(q.id));
        return next;
      });

      setSelectedQuestions(selected);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setCurrentGain(0);
      setTotalTimeLeft(60);
      setQuestionTimeLeft(10);
      setGameState('playing');
      addNotification('Game started! Good luck.', 'info');
      speak("Game started! You have sixty seconds to answer six questions. Good luck!");
    } catch (error) {
      console.error('Failed to start game', error);
      addNotification('Failed to start game. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newAnswers);
    
    const isCorrect = answerIndex === selectedQuestions[currentQuestionIndex].correctAnswer;

    if (isCorrect) {
      setCurrentGain(prev => prev + gainPerQuestion);
    }

    if (currentQuestionIndex < 5) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionTimeLeft(10);
    } else {
      // Finished all 6 questions
      endGame(newAnswers);
    }
  };

  const endGame = useCallback(async (finalAnswers: number[], isTimeout: boolean = false) => {
    setGameState('result');
    
    const correctCount = finalAnswers.filter((ans, idx) => ans === selectedQuestions[idx].correctAnswer).length;
    const isPerfect = correctCount === 6;
    
    let finalWin = 0;
    if (isPerfect) {
      finalWin = potentialWin;
      setWinType('big');
      speak(`Congratulations! You are a champion! You answered all questions correctly and won the jackpot of ${formatPrice(potentialWin)} ${selectedCurrency.name}!`);
    } else {
      finalWin = Number((correctCount * gainPerQuestion).toFixed(2));
      if (finalWin > 0) {
        setWinType('small');
        speak(`Well done! You won ${formatPrice(finalWin)} ${selectedCurrency.name}. You answered ${correctCount} questions correctly.`);
      } else {
        setWinType('none');
        speak("Game over. You didn't win anything this time. Better luck next time!");
      }
    }

    // Animate the prize amount
    let start = 0;
    const duration = 1500;
    const increment = finalWin / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= finalWin) {
        setAnimatedPrize(finalWin);
        clearInterval(timer);
      } else {
        setAnimatedPrize(start);
      }
    }, 16);

    if (finalWin > 0) {
      try {
        await onUpdateBalance(finalWin, 'game_win');
        await onAddTransaction({
          userId: user.uid,
          type: 'game_win',
          amount: finalWin,
          currency: 'NGN',
          status: 'completed',
          description: isPerfect ? 'EFADO Money Quiz Jackpot Win' : 'EFADO Money Quiz Partial Win'
        });
        addNotification(`Congratulations! You won ${formatPrice(finalWin)}!`, 'success');
      } catch (error) {
        console.error('Failed to credit winnings', error);
      }
    } else {
      addNotification('Game over. Better luck next time!', 'info');
    }
  }, [selectedQuestions, potentialWin, user.uid, onUpdateBalance, onAddTransaction, gainPerQuestion]);

  // Total Game Timer
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTotalTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            endGame(userAnswers, true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, userAnswers, endGame]);

  // Question Timer
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            // Time out for this question
            handleAnswer(-1); // -1 means no answer
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, currentQuestionIndex, userAnswers]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
                n.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                n.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                'bg-indigo-50 border-indigo-100 text-indigo-700'
              }`}
            >
              {n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
               n.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <Zap className="w-5 h-5" />}
              <span className="text-sm font-bold">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deposit Wallet</p>
            <h3 className="text-xl font-black text-slate-900">₦{user.depositWallet.toLocaleString()}</h3>
          </div>
          <button 
            onClick={() => {
              setWalletTab('deposit');
              setShowWalletHub({ active: true, type: 'deposit' });
            }}
            className="ml-auto p-2 bg-indigo-600 text-white rounded-xl hover:scale-110 transition-all"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Win Wallet</p>
            <h3 className="text-xl font-black text-slate-900">₦{user.playerWallet.toLocaleString()}</h3>
          </div>
          <button 
            onClick={() => {
              setWalletTab('withdraw');
              setShowWalletHub({ active: true, type: 'withdraw' });
            }}
            className="ml-auto p-2 bg-emerald-600 text-white rounded-xl hover:scale-110 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stake</p>
            <h3 className="text-xl font-black">₦{stakeAmount}</h3>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Potential Win</p>
            <h3 className="text-xl font-black text-emerald-400">₦{potentialWin}</h3>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-12 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <Zap className="w-3 h-3" /> New Game Mode
                    </div>
                    <div className="flex items-center gap-2">
                      <CurrencySelector />
                      {onClose && (
                        <button 
                          onClick={onClose}
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                          title="Exit Arena"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                    EFADO <span className="text-indigo-600">Money Quiz</span>
                  </h1>
                  <p className="text-slate-500 text-lg leading-relaxed">
                    Test your knowledge across 15 subjects and 20 challenging stages. Answer 6 questions correctly in 60 seconds to double your stake!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <Timer className="w-5 h-5 text-indigo-600 mb-2" />
                    <p className="text-xs font-black text-slate-900">60 Seconds</p>
                    <p className="text-[10px] text-slate-400">Total game time</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <HelpCircle className="w-5 h-5 text-indigo-600 mb-2" />
                    <p className="text-xs font-black text-slate-900">6 Questions</p>
                    <p className="text-[10px] text-slate-400">10s per question</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" /> Select Game Stage
                  </h3>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100">
                    {STAGES.map((stage, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedStageIndex(idx)}
                        className={`p-3 rounded-xl border transition-all text-center flex flex-col gap-1 ${
                          selectedStageIndex === idx
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-tighter">{stage.name}</span>
                        <span className="text-xs font-bold">₦{stage.stake.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-12 border-l border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" /> Select Subjects
                    </h3>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                      selectedSubjects.length >= 4 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {selectedSubjects.length}/4 Selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-[32rem] overflow-y-auto p-4 bg-white/50 rounded-2xl border border-slate-200">
                    {SUBJECTS.map(s => (
                      <button
                        key={s}
                        onClick={() => toggleSubject(s)}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                          selectedSubjects.includes(s)
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedSubjects.includes(s) ? 'bg-white' : 'bg-indigo-400'}`} />
                        <span className="text-xs font-bold">{s}</span>
                      </button>
                    ))}
                  </div>
                  {selectedSubjects.length < 4 && (
                    <p className="mt-4 text-[10px] text-amber-600 font-bold uppercase tracking-widest flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Select at least 4 subjects to start
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button 
                onClick={startGame}
                disabled={isProcessing || selectedSubjects.length < 4}
                className="w-full max-w-md py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-lg shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
              >
                {isProcessing ? (
                  <RefreshCcw className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current" />
                    Stake ₦{stakeAmount} & Start
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto space-y-8"
          >
            {/* Game HUD */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-xl flex flex-col items-center justify-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{currentStage.name}</span>
                  <span className="text-xs font-black text-indigo-600">₦{stakeAmount.toLocaleString()}</span>
                </div>
                <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 shadow-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-xl font-black text-slate-900">{totalTimeLeft}s</span>
                </div>
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Q</span>
                  <span className="text-xl font-black">{questionTimeLeft}s</span>
                </div>
              </div>

              <div className="flex gap-2">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 transition-all ${
                      i < currentQuestionIndex ? 'bg-emerald-500 border-emerald-500' :
                      i === currentQuestionIndex ? 'bg-indigo-500 border-indigo-500 animate-pulse' :
                      'bg-slate-100 border-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8">
              <div className="space-y-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {selectedQuestions[currentQuestionIndex].subject}
                </span>
                <h2 className="text-3xl font-black text-slate-900 leading-tight">
                  {selectedQuestions[currentQuestionIndex].question}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedQuestions[currentQuestionIndex].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="group flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-black text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-indigo-900">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center space-y-8 relative"
          >
            {/* Confetti-like particles for Big Win */}
            {winType === 'big' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      top: "50%", 
                      left: "50%", 
                      scale: 0,
                      rotate: 0 
                    }}
                    animate={{ 
                      top: `${Math.random() * 100}%`, 
                      left: `${Math.random() * 100}%`,
                      scale: [0, 1, 0],
                      rotate: 360,
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                    className={`absolute w-4 h-4 rounded-sm ${
                      ['bg-yellow-400', 'bg-indigo-400', 'bg-emerald-400', 'bg-pink-400'][i % 4]
                    }`}
                  />
                ))}
              </div>
            )}

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`w-40 h-40 mx-auto rounded-full flex items-center justify-center shadow-2xl relative ${
                winType === 'big' ? 'bg-yellow-100 text-yellow-600 ring-8 ring-yellow-50' :
                winType === 'small' ? 'bg-emerald-100 text-emerald-600' :
                'bg-slate-100 text-slate-400'
              }`}
            >
              {winType === 'big' ? (
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-20 h-20" />
                </motion.div>
              ) : winType === 'small' ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle2 className="w-20 h-20" />
                </motion.div>
              ) : (
                <Brain className="w-20 h-20" />
              )}

              {winType === 'big' && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-4 -right-4 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl"
                >
                  Champion!
                </motion.div>
              )}
            </motion.div>

            <div className="space-y-2">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-5xl font-black text-slate-900 tracking-tighter"
              >
                {winType === 'big' ? 'CHAMPION WIN!' : 
                 winType === 'small' ? 'GREAT JOB!' : 'GAME OVER'}
              </motion.h2>
              <p className="text-slate-500 font-medium">
                {currentStage.name} Result: You answered {userAnswers.filter((ans, idx) => ans === selectedQuestions[idx].correctAnswer).length} of 6 questions correctly.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stake</p>
                  <p className="text-xl font-black text-slate-900">₦{stakeAmount}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl text-left overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Winnings</p>
                  <motion.p 
                    key={animatedPrize}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`text-2xl font-black ${
                      winType !== 'none' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {winType !== 'none' ? `+${formatPrice(animatedPrize)}` : `-${formatPrice(stakeAmount)}`}
                  </motion.p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        userAnswers[idx] === q.correctAnswer ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {userAnswers[idx] === q.correctAnswer ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{q.subject}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {userAnswers[idx] === q.correctAnswer ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setGameState('lobby')}
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Back to Lobby
              </button>
              <button 
                onClick={startGame}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Efado Extended Wallet Hub */}
      <AnimatePresence>
        {showWalletHub.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden h-[750px] flex flex-col md:flex-row relative border border-white/20"
            >
              {/* Sidebar Navigation */}
              <div className="w-full md:w-80 bg-slate-950 p-10 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.03] pointer-events-none" />
                <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mt-32 -ml-32" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-black text-xl tracking-tighter italic uppercase text-white">Efado Wallet</h2>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-[10px] font-black text-slate-100 uppercase tracking-widest leading-none">Hub Connect</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: 'deposit', label: 'Fund Wallet', icon: Zap },
                      { id: 'withdraw', label: 'Cash Out', icon: ArrowUpRight },
                      { id: 'history', label: 'Transaction history', icon: History }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setWalletTab(tab.id as any);
                          setSelectedMethod(null);
                          setPaymentAmount('');
                        }}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                          walletTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 pt-10 border-t border-white/5">
                  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 italic">Active Protection</p>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tight leading-tight">Neural Fraud Prevention Level 3 Active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-10 overflow-y-auto no-scrollbar bg-slate-50">
                <button 
                  onClick={() => setShowWalletHub({ ...showWalletHub, active: false })}
                  className="absolute top-8 right-8 p-3 bg-white border border-slate-100 rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-lg active:scale-90 z-20"
                >
                  <X className="w-6 h-6" />
                </button>

                <AnimatePresence mode="wait">
                  {(walletTab === 'deposit' || walletTab === 'withdraw') && (
                    <motion.div
                      key={walletTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full max-w-[500px] mx-auto bg-white rounded-3xl overflow-hidden"
                    >
                      <EasyPaymentPlatform
                        user={user}
                        type={walletTab === 'deposit' ? 'deposit' : 'withdraw'}
                        onComplete={async (amount, method) => {
                          try {
                            await onUpdateBalance(
                              amount, 
                              walletTab === 'deposit' ? 'deposit' : 'withdrawal'
                            );
                            await onAddTransaction({
                              userId: user.uid,
                              type: walletTab === 'deposit' ? 'deposit' : 'withdrawal',
                              amount,
                              currency: 'NGN',
                              status: 'completed',
                              method: method || 'Easy Transfer',
                              description: walletTab === 'deposit' ? 'Efado Money Quiz Recharge' : 'Efado Money Quiz Extraction'
                            });
                            addNotification(`${walletTab === 'deposit' ? 'Deposit' : 'Withdrawal'} of ₦${amount.toLocaleString()} successful!`, 'success');
                            setPaymentAmount('');
                            setWalletTab('history');
                          } catch (e) {
                            addNotification('Transaction failed. Contact strategic support.', 'error');
                          }
                        }}
                        onClose={() => setShowWalletHub({ ...showWalletHub, active: false })}
                        hub="MONEY_QUIZ"
                        purpose={walletTab === 'deposit' ? "Efado Money Quiz Credit Top-up" : "Efado Money Quiz Dividend Cashout"}
                      />
                    </motion.div>
                  )}

                  {walletTab === 'history' && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center justify-between mb-10">
                        <h3 className="text-4xl font-black text-slate-950 tracking-tighter italic uppercase underline decoration-indigo-500 underline-offset-8 transition-all">Strategic Flow History</h3>
                        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                           <Search className="w-5 h-5 text-slate-400 ml-2" />
                           <input placeholder="Search Tactical ID..." className="bg-transparent border-none focus:outline-none text-xs font-black uppercase tracking-widest w-48" />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-12 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                          <History className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                          <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-xs italic">Syncing neural transaction nodes...</p>
                          <p className="text-[10px] text-slate-300 font-bold uppercase mt-2">Live updates from Efado Global Ledger enabled</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legacy Payment Platform Modal - Optional (but usually replaced by Hub) */}

    </div>
  );
};
