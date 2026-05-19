import { Question } from '../examData';

export const mathematicsQuestions: Question[] = [
  {
    id: 1,
    text: "Evaluate: (2/3) + (1/4)",
    options: ["3/7", "11/12", "5/12", "2/12"],
    correctAnswer: 1,
    explanation: "Find common denominator: 8/12 + 3/12 = 11/12."
  },
  {
    id: 2,
    text: "If 3x - 5 = 10, find x.",
    options: ["5", "3", "15", "x"],
    correctAnswer: 0,
    explanation: "3x = 15; x = 5."
  },
  {
    id: 3,
    text: "Find the root of x² - 4 = 0.",
    options: ["2 only", "-2 only", "±2", "0"],
    correctAnswer: 2,
    explanation: "x² = 4, so x = ±sqrt(4) = ±2."
  },
  {
    id: 4,
    text: "What is the area of a circle with radius 7? (π = 22/7)",
    options: ["44", "154", "49", "77"],
    correctAnswer: 1,
    explanation: "Area = πr² = (22/7) * 7 * 7 = 22 * 7 = 154."
  },
  {
    id: 5,
    text: "Solve for y: 2y + 4 = y + 10.",
    options: ["4", "6", "10", "14"],
    correctAnswer: 1,
    explanation: "2y - y = 10 - 4; y = 6."
  },
  {
    id: 6,
    text: "Expand (x + 2)(x - 2).",
    options: ["x² + 4", "x² - 4", "x² + 4x + 4", "x² - 4x + 4"],
    correctAnswer: 1,
    explanation: "This is a difference of squares: x² - 2² = x² - 4."
  },
  {
    id: 7,
    text: "Find the gradient of the line passing through (1, 2) and (3, 6).",
    options: ["1", "2", "3", "4"],
    correctAnswer: 1,
    explanation: "Slope (m) = (y2 - y1) / (x2 - x1) = (6 - 2) / (3 - 1) = 4 / 2 = 2."
  },
  {
    id: 8,
    text: "What is the value of log₁₀ 1000?",
    options: ["1", "2", "3", "4"],
    correctAnswer: 2,
    explanation: "10³ = 1000, so log₁₀ 1000 = 3."
  },
  {
    id: 9,
    text: "Find the mean of 2, 4, 6, 8, 10.",
    options: ["4", "5", "6", "8"],
    correctAnswer: 2,
    explanation: "Mean = (2+4+6+8+10)/5 = 30/5 = 6."
  },
  {
    id: 10,
    text: "What is the sum of interior angles of a pentagon?",
    options: ["360°", "540°", "720°", "180°"],
    correctAnswer: 1,
    explanation: "Sum = (n - 2) * 180 = (5 - 2) * 180 = 3 * 180 = 540°."
  },
  {
    id: 11,
    text: "The probability of getting a head in a single toss of a fair coin is:",
    options: ["0", "1/2", "1", "1/4"],
    correctAnswer: 1,
    explanation: "There is one favorable outcome out of two possible ones."
  },
  {
    id: 12,
    text: "Solve for x: sqrt(x + 5) = 3.",
    options: ["4", "2", "14", "9"],
    correctAnswer: 0,
    explanation: "Square both sides: x + 5 = 9; x = 4."
  },
  {
    id: 13,
    text: "Find the LCM of 12 and 15.",
    options: ["3", "30", "45", "60"],
    correctAnswer: 3,
    explanation: "12 = 2² * 3, 15 = 3 * 5. LCM = 2² * 3 * 5 = 60."
  },
  {
    id: 14,
    text: "Convert 0.375 to a fraction in its simplest form.",
    options: ["3/4", "3/8", "1/3", "2/5"],
    correctAnswer: 1,
    explanation: "0.375 = 375/1000 = 3/8."
  },
  {
    id: 15,
    text: "If y is directly proportional to x and y = 10 when x = 2, find y when x = 5.",
    options: ["20", "25", "15", "50"],
    correctAnswer: 1,
    explanation: "y = kx => 10 = k(2) => k = 5. So y = 5(5) = 25."
  },
  {
    id: 16,
    text: "Find the length of the diagonal of a square with side 5cm.",
    options: ["5√2 cm", "10 cm", "25 cm", "5 cm"],
    correctAnswer: 0,
    explanation: "Diagonal of square = s√2 = 5√2."
  },
  {
    id: 17,
    text: "Solve for x: log x (64) = 3.",
    options: ["2", "4", "8", "16"],
    correctAnswer: 1,
    explanation: "x³ = 64; x = 4."
  },
  {
    id: 18,
    text: "If y is inversely proportional to x and y=4 when x=3, find y when x=6.",
    options: ["2", "8", "6", "1.5"],
    correctAnswer: 0,
    explanation: "y = k/x => 4 = k/3 => k=12. When x=6, y = 12/6 = 2."
  },
  {
    id: 19,
    text: "Calculate the simple interest on #5000 for 3 years at 5% per annum.",
    options: ["#750", "#500", "#150", "#250"],
    correctAnswer: 0,
    explanation: "I = PRT/100 = (5000 * 5 * 3)/100 = 750."
  },
  {
    id: 20,
    text: "Find the sum of the interior angles of a pentagon.",
    options: ["360°", "540°", "720°", "900°"],
    correctAnswer: 1,
    explanation: "Sum = (n-2)*180 = (5-2)*180 = 3*180 = 540°."
  },
  {
    id: 21,
    text: "Rationalize: 1 / (√3 - √2)",
    options: ["√3 + √2", "√5", "1", "√3 - √2"],
    correctAnswer: 0,
    explanation: "Multiply numerator and denominator by (√3 + √2). Result is √3 + √2."
  },
  {
    id: 22,
    text: "Find the mean of the numbers: 2, 4, 6, 8, 10.",
    options: ["5", "6", "7", "8"],
    correctAnswer: 1,
    explanation: "Mean = (2+4+6+8+10)/5 = 30/5 = 6."
  },
  {
    id: 23,
    text: "Evaluate sin 30° + cos 60°.",
    options: ["0.5", "1", "√3", "2"],
    correctAnswer: 1,
    explanation: "sin 30 = 0.5, cos 60 = 0.5. 0.5 + 0.5 = 1."
  },
  {
    id: 24,
    text: "If the probability of success is 0.7, what is the probability of failure?",
    options: ["0.7", "0.3", "1", "0"],
    correctAnswer: 1,
    explanation: "P(failure) = 1 - P(success) = 1 - 0.7 = 0.3."
  },
  {
    id: 25,
    text: "Find the value of x in the equation: 2^(x+1) = 8.",
    options: ["1", "2", "3", "4"],
    correctAnswer: 1,
    explanation: "2^(x+1) = 2^3; x+1 = 3; x = 2."
  },
  {
    id: 26,
    text: "What is the mode of 1, 2, 2, 3, 3, 3, 4?",
    options: ["1", "2", "3", "4"],
    correctAnswer: 2,
    explanation: "Mode is the most frequent number, which is 3."
  },
  {
    id: 27,
    text: "Convert 0.375 to a fraction in its simplest form.",
    options: ["3/8", "3/7", "1/3", "2/5"],
    correctAnswer: 0,
    explanation: "0.375 = 375/1000 = 3/8."
  },
  {
    id: 28,
    text: "Solve the inequality: 3x - 2 > 7.",
    options: ["x > 3", "x < 3", "x > 5", "x < 5"],
    correctAnswer: 0,
    explanation: "3x > 9; x > 3."
  },
  {
    id: 29,
    text: "Find the distance between the points (2, 3) and (5, 7).",
    options: ["3", "4", "5", "7"],
    correctAnswer: 2,
    explanation: "d = sqrt((5-2)² + (7-3)²) = sqrt(3² + 4²) = sqrt(9 + 16) = 5."
  },
  {
    id: 30,
    text: "Evaluate: (0.125)^(1/3)",
    options: ["0.25", "0.5", "0.75", "1.25"],
    correctAnswer: 1,
    explanation: "0.5³ = 0.125."
  },
  {
    id: 31,
    text: "If set A = {1, 2, 3} and set B = {2, 3, 4}, find A ∩ B.",
    options: ["{1, 4}", "{2, 3}", "{1, 2, 3, 4}", "∅"],
    correctAnswer: 1,
    explanation: "Intersection is the common elements: {2, 3}."
  },
  {
    id: 32,
    text: "Find the 10th term of the arithmetic progression: 3, 7, 11, ...",
    options: ["36", "39", "40", "43"],
    correctAnswer: 1,
    explanation: "a=3, d=4. T10 = a + (10-1)d = 3 + 9*4 = 3 + 36 = 39."
  },
  {
    id: 33,
    text: "What is the derivative of x³ + 2x?",
    options: ["3x² + 2", "x² + 2", "3x + 2", "x³"],
    correctAnswer: 0,
    explanation: "d/dx(x³) + d/dx(2x) = 3x² + 2."
  },
  {
    id: 34,
    text: "Integrate: ∫ 2x dx",
    options: ["x² + C", "2x² + C", "x + C", "x²/2 + C"],
    correctAnswer: 0,
    explanation: "∫ 2x dx = x² + C."
  },
  {
    id: 35,
    text: "Find the value of tan 45°.",
    options: ["0", "0.5", "1", "√3"],
    correctAnswer: 2,
    explanation: "tan 45 = 1."
  },
  {
    id: 36,
    text: "Solve: x / 2 + x / 3 = 10.",
    options: ["10", "12", "15", "20"],
    correctAnswer: 1,
    explanation: "(3x + 2x)/6 = 10; 5x = 60; x = 12."
  },
  {
    id: 37,
    text: "What is the volume of a cylinder with radius 3 and height 7? (π = 22/7)",
    options: ["198", "66", "132", "154"],
    correctAnswer: 0,
    explanation: "V = πr²h = (22/7) * 3 * 3 * 7 = 22 * 9 = 198."
  },
  {
    id: 38,
    text: "Express 0.0000452 in standard form.",
    options: ["4.52 x 10⁻⁵", "4.52 x 10⁻⁴", "4.52 x 10⁶", "4.52 x 10⁵"],
    correctAnswer: 0,
    explanation: "Move decimal 5 places to the right."
  },
  {
    id: 39,
    text: "Find the LCM of 12 and 15.",
    options: ["30", "45", "60", "120"],
    correctAnswer: 2,
    explanation: "Multiples of 12: 12, 24, 36, 48, 60... Multiples of 15: 15, 30, 45, 60."
  },
  {
    id: 40,
    text: "If log 2 = 0.3010, find log 20.",
    options: ["1.3010", "2.3010", "0.6020", "1.6020"],
    correctAnswer: 0,
    explanation: "log 20 = log(10 * 2) = log 10 + log 2 = 1 + 0.3010 = 1.3010."
  },
  {
    id: 41,
    text: "Find the median of: 5, 2, 8, 1, 9.",
    options: ["1", "5", "8", "9"],
    correctAnswer: 1,
    explanation: "Order: 1, 2, 5, 8, 9. The middle number is 5."
  },
  {
    id: 42,
    text: "Simplify: (x²)³",
    options: ["x⁵", "x⁶", "x⁸", "x⁹"],
    correctAnswer: 1,
    explanation: "(x^a)^b = x^(a*b)."
  },
  {
    id: 43,
    text: "Solve: √(3x + 1) = 4.",
    options: ["5", "3", "4", "2"],
    correctAnswer: 0,
    explanation: "3x + 1 = 16; 3x = 15; x = 5."
  },
  {
    id: 44,
    text: "In a triangle, if two angles are 45° and 60°, find the third angle.",
    options: ["75°", "85°", "95°", "105°"],
    correctAnswer: 0,
    explanation: "180 - (45 + 60) = 180 - 105 = 75°."
  },
  {
    id: 45,
    text: "Find the perimeter of a rectangle with length 10 and width 4.",
    options: ["14", "20", "28", "40"],
    correctAnswer: 2,
    explanation: "P = 2(L + W) = 2(10 + 4) = 2(14) = 28."
  },
  {
    id: 46,
    text: "Calculate the value of 5! (5 factorial).",
    options: ["20", "60", "120", "240"],
    correctAnswer: 2,
    explanation: "5 * 4 * 3 * 2 * 1 = 120."
  },
  {
    id: 47,
    text: "If y = x² + 2, find y when x = -3.",
    options: ["-7", "5", "11", "9"],
    correctAnswer: 2,
    explanation: "y = (-3)² + 2 = 9 + 2 = 11."
  },
  {
    id: 48,
    text: "Find the HCF of 24 and 36.",
    options: ["6", "12", "18", "24"],
    correctAnswer: 1,
    explanation: "Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24. Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36."
  },
  {
    id: 49,
    text: "Evaluate: 1/2 ÷ 1/4",
    options: ["1/8", "1/2", "2", "4"],
    correctAnswer: 2,
    explanation: "1/2 * 4/1 = 2."
  },
  {
    id: 50,
    text: "Find the range of the numbers: 10, 2, 5, 8, 20.",
    options: ["10", "15", "18", "20"],
    correctAnswer: 2,
    explanation: "Range = Max - Min = 20 - 2 = 18."
  },
  {
    id: 51,
    text: "Solve for x: x/4 = 7.",
    options: ["3", "11", "28", "32"],
    correctAnswer: 2,
    explanation: "x = 7 * 4 = 28."
  },
  {
    id: 52,
    text: "What is the square root of 225?",
    options: ["13", "15", "25", "35"],
    correctAnswer: 1,
    explanation: "15 * 15 = 225."
  },
  {
    id: 53,
    text: "In a class of 40 students, 25 are boys. What is the percentage of girls?",
    options: ["15%", "37.5%", "62.5%", "25%"],
    correctAnswer: 1,
    explanation: "Girls = 15. % Girls = (15/40) * 100 = 37.5%."
  },
  {
    id: 54,
    text: "Simplify: 2a + 3b - a + b.",
    options: ["a + 4b", "3a + 4b", "a + 2b", "3a + 2b"],
    correctAnswer: 0,
    explanation: "Combine like terms: (2a - a) + (3b + b) = a + 4b."
  },
  {
    id: 55,
    text: "Calculate the area of a triangle with base 10 and height 5.",
    options: ["15", "25", "30", "50"],
    correctAnswer: 1,
    explanation: "Area = 1/2 * b * h = 1/2 * 10 * 5 = 25."
  },
  {
    id: 56,
    text: "Find the slope of a line parallel to y = 3x + 5.",
    options: ["-3", "1/3", "3", "5"],
    correctAnswer: 2,
    explanation: "Parallel lines have the same slope."
  },
  {
    id: 57,
    text: "Evaluate: |-5| + |3|",
    options: ["-2", "2", "8", "15"],
    correctAnswer: 2,
    explanation: "5 + 3 = 8."
  },
  {
    id: 58,
    text: "Solve: x² = 16.",
    options: ["2", "4", "±4", "8"],
    correctAnswer: 2,
    explanation: "x = ±√16 = ±4."
  },
  {
    id: 59,
    text: "What is the third term of the sequence defined by Un = 2n + 1?",
    options: ["3", "5", "7", "9"],
    correctAnswer: 2,
    explanation: "U3 = 2(3) + 1 = 6 + 1 = 7."
  },
  {
    id: 60,
    text: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 1,
    explanation: "A hexagon is a 6-sided polygon."
  },
  {
    id: 61,
    text: "Convert 25% to a decimal.",
    options: ["0.25", "2.5", "0.025", "25"],
    correctAnswer: 0,
    explanation: "25/100 = 0.25."
  },
  {
    id: 62,
    text: "Find the circumference of a circle with diameter 14. (π = 22/7)",
    options: ["22", "44", "88", "154"],
    correctAnswer: 1,
    explanation: "C = πd = (22/7) * 14 = 44."
  },
  {
    id: 63,
    text: "Solve for m: 4m - 2 = 10.",
    options: ["2", "3", "4", "12"],
    correctAnswer: 1,
    explanation: "4m = 12; m = 3."
  },
  {
    id: 64,
    text: "What is the probability of tossing a tail using a fair coin?",
    options: ["0", "0.5", "1", "0.25"],
    correctAnswer: 1,
    explanation: "Probability = 1/2 = 0.5."
  },
  {
    id: 65,
    text: "Find the value of x if 3x + 4 = 2x + 9.",
    options: ["5", "13", "4", "2"],
    correctAnswer: 0,
    explanation: "3x - 2x = 9 - 4; x = 5."
  },
  {
    id: 66,
    text: "What is the exterior angle of a regular hexagon?",
    options: ["60°", "120°", "90°", "45°"],
    correctAnswer: 0,
    explanation: "Exterior angle = 360/n = 360/6 = 60°."
  },
  {
    id: 67,
    text: "Evaluate: 2³ + 2²",
    options: ["10", "12", "14", "32"],
    correctAnswer: 1,
    explanation: "8 + 4 = 12."
  },
  {
    id: 68,
    text: "Simplify: (3x + 1) + (2x - 5).",
    options: ["5x - 4", "5x + 6", "x - 4", "x + 6"],
    correctAnswer: 0,
    explanation: "3x + 2x + 1 - 5 = 5x - 4."
  },
  {
    id: 69,
    text: "Find the slope of the line y = -2x + 7.",
    options: ["-2", "2", "7", "-7"],
    correctAnswer: 0,
    explanation: "The slope (m) is the coefficient of x."
  },
  {
    id: 70,
    text: "Solve: 5x = 20.",
    options: ["2", "4", "5", "10"],
    correctAnswer: 1,
    explanation: "x = 20/5 = 4."
  },
  {
    id: 71,
    text: "What is the perimeter of a square with area 64?",
    options: ["8", "16", "32", "64"],
    correctAnswer: 2,
    explanation: "Side = √64 = 8. Perimeter = 4 * 8 = 32."
  },
  {
    id: 72,
    text: "Calculate the interest on #1000 for 2 years at 10% per annum.",
    options: ["#100", "#200", "#300", "#1000"],
    correctAnswer: 1,
    explanation: "I = PRT/100 = (1000 * 10 * 2)/100 = 200."
  },
  {
    id: 73,
    text: "Convert 1/5 to a percentage.",
    options: ["10%", "20%", "25%", "50%"],
    correctAnswer: 1,
    explanation: "(1/5) * 100 = 20%."
  },
  {
    id: 74,
    text: "Find the root of x² - 9 = 0.",
    options: ["3 and -3", "3 only", "-3 only", "0"],
    correctAnswer: 0,
    explanation: "x² = 9; x = ±3."
  },
  {
    id: 75,
    text: "What is the value of pi (π) approximated to 2 decimal places?",
    options: ["3.12", "3.14", "3.16", "3.18"],
    correctAnswer: 1,
    explanation: "π ≈ 3.14159..."
  },
  {
    id: 76,
    text: "Solve for x: 3(x - 2) = 12.",
    options: ["2", "4", "6", "8"],
    correctAnswer: 2,
    explanation: "x - 2 = 4 => x = 6."
  },
  {
    id: 77,
    text: "The sum of the angles in a triangle is:",
    options: ["90°", "180°", "270°", "360°"],
    correctAnswer: 1,
    explanation: "A basic property of Euclidean geometry."
  },
  {
    id: 78,
    text: "What is the square root of 225?",
    options: ["13", "14", "15", "16"],
    correctAnswer: 2,
    explanation: "15 * 15 = 225."
  },
  {
    id: 79,
    text: "Calculate the simple interest on $500 at 5% per annum for 2 years.",
    options: ["$25", "$50", "$75", "$100"],
    correctAnswer: 1,
    explanation: "I = PRT/100 = 500 * 5 * 2 / 100 = 50."
  },
  {
    id: 80,
    text: "Find the median of the set: {3, 1, 4, 1, 5, 9, 2}.",
    options: ["1", "3", "4", "5"],
    correctAnswer: 1,
    explanation: "Sorted: 1, 1, 2, 3, 4, 5, 9. The middle value is 3."
  },
  {
    id: 81,
    text: "What is the value of 5! (5 factorial)?",
    options: ["20", "60", "120", "240"],
    correctAnswer: 2,
    explanation: "5 * 4 * 3 * 2 * 1 = 120."
  },
  {
    id: 82,
    text: "If a = 3 and b = 4, find √(a² + b²).",
    options: ["5", "7", "12", "25"],
    correctAnswer: 0,
    explanation: "√(9 + 16) = √25 = 5 (Pythagorean triple)."
  },
  {
    id: 83,
    text: "Find the slope of a line passing through (1, 2) and (3, 6).",
    options: ["1", "2", "3", "4"],
    correctAnswer: 1,
    explanation: "m = (6-2)/(3-1) = 4/2 = 2."
  },
  {
    id: 84,
    text: "What is the volume of a cube with side length 4cm?",
    options: ["12 cm³", "16 cm³", "64 cm³", "96 cm³"],
    correctAnswer: 2,
    explanation: "Volume = s³ = 4 * 4 * 4 = 64."
  },
  {
    id: 85,
    text: "Solve for y: 2y/3 = 10.",
    options: ["5", "10", "15", "30"],
    correctAnswer: 2,
    explanation: "2y = 30 => y = 15."
  },
  {
    id: 86,
    text: "What is 15% of 200?",
    options: ["15", "20", "30", "45"],
    correctAnswer: 2,
    explanation: "0.15 * 200 = 30."
  },
  {
    id: 87,
    text: "The perimeter of a square is 32cm. What is the length of one side?",
    options: ["4 cm", "8 cm", "16 cm", "64 cm"],
    correctAnswer: 1,
    explanation: "Side = 32 / 4 = 8."
  },
  {
    id: 88,
    text: "Which of these is a prime number?",
    options: ["9", "15", "21", "23"],
    correctAnswer: 3,
    explanation: "23 has only 1 and itself as factors."
  },
  {
    id: 89,
    text: "Work out: 2/5 + 1/4.",
    options: ["3/9", "3/20", "13/20", "8/10"],
    correctAnswer: 2,
    explanation: "(8 + 5) / 20 = 13/20."
  },
  {
    id: 90,
    text: "What is the value of (2³)²?",
    options: ["8", "16", "32", "64"],
    correctAnswer: 3,
    explanation: "2^(3*2) = 2^6 = 64."
  },
  {
    id: 91,
    text: "If 10 men can do a piece of work in 5 days, how many days will it take 2 men?",
    options: ["1 day", "10 days", "25 days", "50 days"],
    correctAnswer: 2,
    explanation: "Total man-days = 10 * 5 = 50. Days for 2 men = 50 / 2 = 25."
  },
  {
    id: 92,
    text: "The ratio of boys to girls in a class is 3:2. If there are 30 students, how many are boys?",
    options: ["12", "15", "18", "20"],
    correctAnswer: 2,
    explanation: "Total parts = 5. One part = 30/5 = 6. Boys = 3 * 6 = 18."
  },
  {
    id: 93,
    text: "A polygon with 8 sides is called an:",
    options: ["Hexagon", "Heptagon", "Octagon", "Nonagon"],
    correctAnswer: 2,
    explanation: "Octa- means eight."
  },
  {
    id: 94,
    text: "Solve the inequality: 2x - 5 > 7.",
    options: ["x > 1", "x > 6", "x < 6", "x > 12"],
    correctAnswer: 1,
    explanation: "2x > 12 => x > 6."
  },
  {
    id: 95,
    text: "The surface area of a sphere is given by:",
    options: ["πr²", "2πr", "4πr²", "4/3 πr³"],
    correctAnswer: 2,
    explanation: "4 times the area of its great circle."
  },
  {
    id: 96,
    text: "Convert 2/5 to a percentage.",
    options: ["20%", "25%", "40%", "50%"],
    correctAnswer: 2,
    explanation: "2/5 = 0.4 = 40%."
  },
  {
    id: 97,
    text: "Find the HCF of 24 and 36.",
    options: ["6", "12", "18", "72"],
    correctAnswer: 1,
    explanation: "12 is the largest number dividing both."
  },
  {
    id: 98,
    text: "What is the value of log₁₀ 1000?",
    options: ["1", "2", "3", "10"],
    correctAnswer: 2,
    explanation: "10³ = 1000."
  },
  {
    id: 99,
    text: "One angle of a right-angled triangle is 35°. What is the other NON-right angle?",
    options: ["35°", "45°", "55°", "65°"],
    correctAnswer: 2,
    explanation: "180 - 90 - 35 = 55."
  },
  {
    id: 100,
    text: "If a bag contains 3 red balls and 7 blue balls, what is the probability of picking a red ball?",
    options: ["0.3", "0.7", "3/7", "1/10"],
    correctAnswer: 0,
    explanation: "3 / (3+7) = 3/10 = 0.3."
  },
  {
    id: 101,
    text: "Evaluate: -8 + (-5) - (-10).",
    options: ["-23", "-3", "3", "7"],
    correctAnswer: 1,
    explanation: "-13 + 10 = -3."
  },
  {
    id: 102,
    text: "What is the external angle of a regular hexagon?",
    options: ["30°", "45°", "60°", "90°"],
    correctAnswer: 2,
    explanation: "360 / 6 = 60°."
  },
  {
    id: 103,
    text: "The distance around a circle is called its:",
    options: ["Area", "Diameter", "Radius", "Circumference"],
    correctAnswer: 3,
    explanation: "Formula is 2πr."
  },
  {
    id: 104,
    text: "What is the coefficient of x in the expression 2x² - 5x + 3?",
    options: ["2", "-5", "3", "0"],
    correctAnswer: 1,
    explanation: "The number multiplying x is -5."
  },
  {
    id: 105,
    text: "Express 0.00045 in standard form.",
    options: ["4.5 x 10^-3", "4.5 x 10^-4", "45 x 10^-5", "0.45 x 10^-3"],
    correctAnswer: 1,
    explanation: "Move the decimal point 4 places to the right."
  },
  {
    id: 106,
    text: "If 12 + x = 5, find x.",
    options: ["7", "17", "-7", "-17"],
    correctAnswer: 2,
    explanation: "x = 5 - 12 = -7."
  },
  {
    id: 107,
    text: "Which of the following describes a rhombus?",
    options: ["All angles are 90°", "Opposite sides are not parallel", "All four sides are equal length", "No lines of symmetry"],
    correctAnswer: 2,
    explanation: "A rhombus is a parallelogram with four equal sides."
  },
  {
    id: 108,
    text: "Find the value of x if 2^x = 1/8.",
    options: ["3", "-3", "4", "-4"],
    correctAnswer: 1,
    explanation: "1/8 = 1/2³ = 2^-3."
  },
  {
    id: 109,
    text: "The average of 10, 20, 30, x is 25. Find x.",
    options: ["30", "40", "50", "60"],
    correctAnswer: 1,
    explanation: "(60 + x)/4 = 25 => 60 + x = 100 => x = 40."
  },
  {
    id: 110,
    text: "In a pie chart, what angle represents 25%?",
    options: ["45°", "90°", "120°", "180°"],
    correctAnswer: 1,
    explanation: "0.25 * 360 = 90."
  },
  {
    id: 111,
    text: "What is the reciprocal of 0.25?",
    options: ["4", "0.4", "2.5", "1/4"],
    correctAnswer: 0,
    explanation: "1 / 0.25 = 4."
  },
  {
    id: 112,
    text: "Simplify: (x²)³ / x⁴.",
    options: ["x", "x²", "x³", "x⁵"],
    correctAnswer: 1,
    explanation: "x^6 / x^4 = x^(6-4) = x²."
  },
  {
    id: 113,
    text: "Find the length of a rectangle if its area is 48cm² and width is 6cm.",
    options: ["6 cm", "8 cm", "12 cm", "42 cm"],
    correctAnswer: 1,
    explanation: "L = Area / W = 48 / 6 = 8."
  },
  {
    id: 114,
    text: "Which number is both a square and a cube?",
    options: ["16", "27", "64", "81"],
    correctAnswer: 2,
    explanation: "64 = 8² and 64 = 4³."
  },
  {
    id: 115,
    text: "Calculate: 1.2 x 0.3.",
    options: ["0.36", "3.6", "0.036", "0.4"],
    correctAnswer: 0,
    explanation: "12 * 3 = 36, then adjust decimal places."
  },
  {
    id: 116,
    text: "If y is directly proportional to x and y=10 when x=2, find y when x=5.",
    options: ["15", "20", "25", "50"],
    correctAnswer: 2,
    explanation: "y = kx => 10 = 2k => k = 5. y = 5*5 = 25."
  },
  {
    id: 117,
    text: "What is the value of tan 45°?",
    options: ["0", "0.5", "1", "√3"],
    correctAnswer: 2,
    explanation: "In a right isosceles triangle, opposite/adjacent = 1."
  },
  {
    id: 118,
    text: "A car travels 150km in 3 hours. What is its average speed?",
    options: ["30 km/h", "45 km/h", "50 km/h", "60 km/h"],
    correctAnswer: 2,
    explanation: "Speed = Distance / Time = 150 / 3 = 50."
  },
  {
    id: 119,
    text: "What is the complement of an angle of 70°?",
    options: ["20°", "90°", "110°", "180°"],
    correctAnswer: 0,
    explanation: "Complimentary angles add up to 90°."
  },
  {
    id: 120,
    text: "Evaluate: √(0.09).",
    options: ["0.03", "0.3", "3", "0.003"],
    correctAnswer: 1,
    explanation: "0.3 * 0.3 = 0.09."
  },
  {
    id: 121,
    text: "The number of subsets in a set with 3 elements is:",
    options: ["3", "6", "8", "9"],
    correctAnswer: 2,
    explanation: "2ⁿ = 2³ = 8."
  },
  {
    id: 122,
    text: "Find the simple interest on $1000 at 10% for 6 months.",
    options: ["$50", "$100", "$500", "$600"],
    correctAnswer: 0,
    explanation: "I = 1000 * 0.1 * 0.5 = 50."
  },
  {
    id: 123,
    text: "What is the value of x if 3x + 4 = 2x - 1?",
    options: ["5", "-5", "3", "-3"],
    correctAnswer: 1,
    explanation: "3x - 2x = -1 - 4 => x = -5."
  },
  {
    id: 124,
    text: "The diameter of a circle is 14cm. What is its circumference (π=22/7)?",
    options: ["22 cm", "44 cm", "88 cm", "154 cm"],
    correctAnswer: 1,
    explanation: "C = πd = (22/7) * 14 = 44."
  },
  {
    id: 125,
    text: "Which of these is an irrational number?",
    options: ["0.5", "2/3", "√4", "√2"],
    correctAnswer: 3,
    explanation: "√2 cannot be expressed as a simple fraction."
  }
];
