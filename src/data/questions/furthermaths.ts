import { Question } from '../examData';

export const furthermathsQuestions: Question[] = [
  {
    id: 1,
    text: "Evaluate the limit: lim (x→2) (x² - 4) / (x - 2)",
    options: ["0", "2", "4", "undefined"],
    correctAnswer: 2,
    explanation: "Factorize: (x-2)(x+2)/(x-2) = x+2. As x→2, x+2 = 4."
  },
  {
    id: 2,
    text: "Find the derivative of f(x) = sin(2x).",
    options: ["cos(2x)", "2cos(2x)", "-2cos(2x)", "cos(x)"],
    correctAnswer: 1,
    explanation: "Using chain rule: derivative of sin(u) is cos(u) * du/dx."
  },
  {
    id: 3,
    text: "Solve for x in the matrix equation: |[x, 2], [3, 4]| = 2",
    options: ["1", "2", "3", "4"],
    correctAnswer: 1,
    explanation: "Determinant = 4x - 6 = 2 => 4x = 8 => x = 2."
  },
  {
    id: 4,
    text: "Find the integral of e^x dx.",
    options: ["e^x", "e^x + C", "xe^x", "1/x"],
    correctAnswer: 1,
    explanation: "The exponential function is its own derivative and integral."
  },
  {
    id: 5,
    text: "What is the complex number i² equal to?",
    options: ["1", "-1", "0", "sqrt(-1)"],
    correctAnswer: 1,
    explanation: "By definition, i = sqrt(-1), so i² = -1."
  },
  {
    id: 6,
    text: "Find the sum to infinity of the GP: 1 + 1/2 + 1/4 + ...",
    options: ["1", "1.5", "2", "infinity"],
    correctAnswer: 2,
    explanation: "Sum = a / (1 - r) = 1 / (1 - 0.5) = 1 / 0.5 = 2."
  },
  {
    id: 7,
    text: "A vector v has components (3, 4). What is its magnitude?",
    options: ["5", "7", "12", "25"],
    correctAnswer: 0,
    explanation: "Magnitude = sqrt(3² + 4²) = sqrt(9 + 16) = 5."
  },
  {
    id: 8,
    text: "Find the value of x if log₂ (x + 1) = 3.",
    options: ["5", "7", "8", "9"],
    correctAnswer: 1,
    explanation: "x + 1 = 2³ = 8 => x = 7."
  },
  {
    id: 9,
    text: "The binary operation * is defined by a * b = a + b + ab. Find 2 * 3.",
    options: ["5", "6", "11", "12"],
    correctAnswer: 2,
    explanation: "2 + 3 + (2*3) = 5 + 6 = 11."
  },
  {
    id: 10,
    text: "Which of the following describes a function that is its own inverse?",
    options: ["f(x) = x²", "f(x) = 1/x", "f(x) = e^x", "f(x) = sin(x)"],
    correctAnswer: 1,
    explanation: "If y = 1/x, then x = 1/y. Swapping gives f⁻¹(x) = 1/x."
  },
  {
    id: 11,
    text: "Find the coordinates of the turning point of the curve y = x² - 4x + 5.",
    options: ["(2, 1)", "(-2, 1)", "(2, -1)", "(0, 5)"],
    correctAnswer: 0,
    explanation: "dy/dx = 2x - 4. Set to zero: 2x = 4 => x = 2. y = (2)² - 4(2) + 5 = 4 - 8 + 5 = 1."
  },
  {
    id: 12,
    text: "Evaluate the integral of (2x + 3) dx from 0 to 1.",
    options: ["1", "2", "4", "5"],
    correctAnswer: 2,
    explanation: "Integral = x² + 3x. Evaluate at 1: (1)² + 3(1) = 4. Evaluate at 0: 0. Difference = 4."
  },
  {
    id: 13,
    text: "Find the equation of the normal to the curve y = x² at the point (1, 1).",
    options: ["y = 2x - 1", "y = -1/2x + 3/2", "y = -2x + 3", "y = 1/2x + 1/2"],
    correctAnswer: 1,
    explanation: "dy/dx = 2x. At (1,1), gradient m = 2. Normal gradient = -1/m = -1/2. y - 1 = -1/2(x - 1) => y = -1/2x + 1/2 + 1."
  },
  {
    id: 14,
    text: "If A and B are independent events with P(A) = 0.4 and P(B) = 0.5, find P(A ∩ B).",
    options: ["0.1", "0.2", "0.9", "0.1"],
    correctAnswer: 1,
    explanation: "For independent events, P(A ∩ B) = P(A) * P(B) = 0.4 * 0.5 = 0.2."
  },
  {
    id: 15,
    text: "Find the mean of the numbers: 2, 4, 6, 8, 10.",
    options: ["4", "5", "6", "8"],
    correctAnswer: 2,
    explanation: "(2+4+6+8+10)/5 = 30/5 = 6."
  },
  {
    id: 16,
    text: "Solve the quadratic equation x² - 5x + 6 = 0.",
    options: ["x=2, 3", "x=-2, -3", "x=1, 6", "x=-1, -6"],
    correctAnswer: 0,
    explanation: "(x - 2)(x - 3) = 0 => x = 2 or x = 3."
  },
  {
    id: 17,
    text: "Evaluate (1 + i)², where i = sqrt(-1).",
    options: ["2", "2i", "-2 + 2i", "0"],
    correctAnswer: 1,
    explanation: "(1 + i)(1 + i) = 1 + 2i + i² = 1 + 2i - 1 = 2i."
  },
  {
    id: 18,
    text: "Find the value of k if the line y = kx is a tangent to the curve y = x² + 1.",
    options: ["0", "1", "2", "±2"],
    correctAnswer: 3,
    explanation: "kx = x² + 1 => x² - kx + 1 = 0. For tangent, Discriminant = 0 => k² - 4(1)(1) = 0 => k² = 4 => k = ±2."
  },
  {
    id: 19,
    text: "The position vector of point P is 2i - j and Q is i + 3j. Find the vector PQ.",
    options: ["i + 4j", "-i + 4j", "3i + 2j", "-i - 4j"],
    correctAnswer: 1,
    explanation: "PQ = OQ - OP = (i + 3j) - (2i - j) = -i + 4j."
  },
  {
    id: 20,
    text: "Find the number of ways to arrange the letters in the word 'MATHS'.",
    options: ["24", "60", "120", "720"],
    correctAnswer: 2,
    explanation: "5! = 5 * 4 * 3 * 2 * 1 = 120."
  },
  {
    id: 21,
    text: "Evaluate C(5, 2), the number of combinations of 5 items taken 2 at a time.",
    options: ["5", "10", "20", "60"],
    correctAnswer: 1,
    explanation: "5! / (2! * 3!) = (5 * 4) / (2 * 1) = 10."
  },
  {
    id: 22,
    text: "Find the coefficient of x² in the expansion of (1 + 2x)³.",
    options: ["3", "6", "12", "8"],
    correctAnswer: 2,
    explanation: "Expansion: 1³ + 3(1)²(2x) + 3(1)(2x)² + (2x)³ = 1 + 6x + 12x² + 8x³."
  },
  {
    id: 23,
    text: "Convert 2π/3 radians to degrees.",
    options: ["60°", "120°", "150°", "240°"],
    correctAnswer: 1,
    explanation: "(2π/3) * (180/π) = 2 * 60 = 120°."
  },
  {
    id: 24,
    text: "Find the derivative of f(x) = ln(x).",
    options: ["e^x", "1/x", "x", "1"],
    correctAnswer: 1,
    explanation: "The derivative of natural log x is 1/x."
  },
  {
    id: 25,
    text: "Evaluate the integral of cos(x) dx.",
    options: ["sin(x)", "sin(x) + C", "-sin(x)", "-sin(x) + C"],
    correctAnswer: 1,
    explanation: "The integral of cosine is sine."
  },
  {
    id: 26,
    text: "What is the identity matrix of order 2?",
    options: ["[[1, 0], [0, 1]]", "[[0, 1], [1, 0]]", "[[1, 1], [1, 1]]", "[[0, 0], [0, 0]]"],
    correctAnswer: 0,
    explanation: "The identity matrix has 1s on the main diagonal and 0s elsewhere."
  },
  {
    id: 27,
    text: "Solve for y: log₃ y = 2.",
    options: ["6", "8", "9", "27"],
    correctAnswer: 2,
    explanation: "y = 3² = 9."
  },
  {
    id: 28,
    text: "A fair coin is tossed twice. What is the probability of getting exactly one head?",
    options: ["1/4", "1/2", "3/4", "1"],
    correctAnswer: 1,
    explanation: "Outcomes: HH, HT, TH, TT. Exactly one head: HT, TH (2 out of 4)."
  },
  {
    id: 29,
    text: "Find the distance between the points (1, 2) and (4, 6).",
    options: ["3", "4", "5", "7"],
    correctAnswer: 2,
    explanation: "Distance = sqrt((4-1)² + (6-2)²) = sqrt(3² + 4²) = 5."
  },
  {
    id: 30,
    text: "Find the gradient of the line passing through (2, 3) and (5, 9).",
    options: ["2", "3", "6", "1/2"],
    correctAnswer: 0,
    explanation: "Gradient = (9 - 3) / (5 - 2) = 6 / 3 = 2."
  },
  {
    id: 31,
    text: "Evaluate the limit: lim (x→0) sin(x)/x",
    options: ["0", "1", "infinity", "undefined"],
    correctAnswer: 1,
    explanation: "This is a fundamental limit in calculus."
  },
  {
    id: 32,
    text: "Find the second derivative of f(x) = x³.",
    options: ["3x²", "6x", "6", "0"],
    correctAnswer: 1,
    explanation: "f'(x) = 3x², f''(x) = 6x."
  },
  {
    id: 33,
    text: "In a GP, if the first term is 3 and the common ratio is 2, find the 4th term.",
    options: ["6", "12", "24", "48"],
    correctAnswer: 2,
    explanation: "T₄ = ar³ = 3 * (2)³ = 3 * 8 = 24."
  },
  {
    id: 34,
    text: "Solve for x: 2^x = 16.",
    options: ["2", "3", "4", "8"],
    correctAnswer: 2,
    explanation: "2⁴ = 16."
  },
  {
    id: 35,
    text: "Find the remainder when x² + 2x + 3 is divided by (x - 1).",
    options: ["0", "3", "5", "6"],
    correctAnswer: 3,
    explanation: "Use Remainder Theorem: f(1) = (1)² + 2(1) + 3 = 1 + 2 + 3 = 6."
  },
  {
    id: 36,
    text: "Evaluate the integral of 1/x dx.",
    options: ["x", "ln(x)", "ln(x) + C", "undefined"],
    correctAnswer: 2,
    explanation: "The integral of reciprocal x is natural log x."
  },
  {
    id: 37,
    text: "What is the modulus of the complex number 3 + 4i?",
    options: ["3", "4", "5", "7"],
    correctAnswer: 2,
    explanation: "|z| = sqrt(3² + 4²) = 5."
  },
  {
    id: 38,
    text: "Two vectors are perpendicular if their dot product is:",
    options: ["0", "1", "-1", "Equal to their magnitudes"],
    correctAnswer: 0,
    explanation: "a · b = |a||b|cos(90°) = 0."
  },
  {
    id: 39,
    text: "Find the number of subsets of a set with 4 elements.",
    options: ["4", "8", "12", "16"],
    correctAnswer: 3,
    explanation: "Number of subsets = 2ⁿ = 2⁴ = 16."
  },
  {
    id: 40,
    text: "Solve for x in the equation tan(x) = 1 for 0° ≤ x ≤ 90°.",
    options: ["30°", "45°", "60°", "90°"],
    correctAnswer: 1,
    explanation: "tan(45°) = 1."
  },
  {
    id: 41,
    text: "Find the area under the curve y = x from x=0 to x=2.",
    options: ["1", "2", "4", "0"],
    correctAnswer: 1,
    explanation: "Integral of x is x²/2. From 0 to 2: (2)²/2 - 0 = 2."
  },
  {
    id: 42,
    text: "What is the value of P(n, r) if n=4 and r=2?",
    options: ["6", "12", "24", "2"],
    correctAnswer: 1,
    explanation: "4! / (4-2)! = 4! / 2! = 24 / 2 = 12."
  },
  {
    id: 43,
    text: "Find the derivative of f(x) = 1/x.",
    options: ["ln(x)", "-1/x²", "1/x²", "-1/x"],
    correctAnswer: 1,
    explanation: "f(x) = x⁻¹, f'(x) = -1x⁻² = -1/x²."
  },
  {
    id: 44,
    text: "The roots of the equation x² + 1 = 0 are:",
    options: ["1, -1", "i, -i", "0", "None"],
    correctAnswer: 1,
    explanation: "x² = -1 => x = ±sqrt(-1) = ±i."
  },
  {
    id: 45,
    text: "Find the midpoint of the line segment joining (2, 4) and (6, 10).",
    options: ["(4, 7)", "(3, 5)", "(8, 14)", "(4, 6)"],
    correctAnswer: 0,
    explanation: "Midpoint = ((2+6)/2, (4+10)/2) = (4, 7)."
  },
  {
    id: 46,
    text: "In an AP, if the 1st term is 5 and the common difference is 3, find the 10th term.",
    options: ["30", "32", "35", "38"],
    correctAnswer: 1,
    explanation: "T₁₀ = a + 9d = 5 + 9(3) = 5 + 27 = 32."
  },
  {
    id: 47,
    text: "Evaluate log₁₀ 1000.",
    options: ["1", "2", "3", "10"],
    correctAnswer: 2,
    explanation: "10³ = 1000."
  },
  {
    id: 48,
    text: "Find the value of x if 2x - 5 = 7.",
    options: ["1", "6", "12", "0"],
    correctAnswer: 1,
    explanation: "2x = 12 => x = 6."
  },
  {
    id: 49,
    text: "What is the conjugate of the complex number 2 - 3i?",
    options: ["-2 - 3i", "2 + 3i", "-2 + 3i", "3 - 2i"],
    correctAnswer: 1,
    explanation: "Reverse the sign of the imaginary part."
  },
  {
    id: 50,
    text: "If vectors a = (1, 2) and b = (3, 4), find a + b.",
    options: ["(4, 6)", "(2, 2)", "(3, 8)", "(1, 2)"],
    correctAnswer: 0,
    explanation: "(1+3, 2+4) = (4, 6)."
  },
  {
    id: 51,
    text: "Evaluate the limit: lim (x→∞) 1/x",
    options: ["0", "1", "infinity", "undefined"],
    correctAnswer: 0,
    explanation: "As x becomes very large, 1/x approaches zero."
  },
  {
    id: 52,
    text: "Find the derivative of f(x) = x * sin(x).",
    options: ["cos(x)", "sin(x) + x*cos(x)", "sin(x) - x*cos(x)", "x*cos(x)"],
    correctAnswer: 1,
    explanation: "Using product rule: uv' + vu' = x*cos(x) + sin(x)*1."
  },
  {
    id: 53,
    text: "Evaluate the integral of (3x² + 2x + 1) dx.",
    options: ["x³ + x² + x + C", "6x + 2 + C", "x³ + 2x² + x + C", "3x³ + 2x² + x + C"],
    correctAnswer: 0,
    explanation: "Integral rules: add 1 to power and divide."
  },
  {
    id: 54,
    text: "Convert 150° to radians.",
    options: ["π/2", "3π/4", "5π/6", "4π/3"],
    correctAnswer: 2,
    explanation: "150 * (π/180) = 5π/6."
  },
  {
    id: 55,
    text: "Find the dot product of vectors u = (2, -1) and v = (3, 4).",
    options: ["2", "5", "10", "11"],
    correctAnswer: 0,
    explanation: "(2*3) + (-1*4) = 6 - 4 = 2."
  },
  {
    id: 56,
    text: "The derivative of tan(x) is:",
    options: ["sec(x)", "sec²(x)", "cot(x)", "-sec²(x)"],
    correctAnswer: 1,
    explanation: "Standard trigonometric derivative."
  },
  {
    id: 57,
    text: "Find the sum of the first 10 terms of an AP where a=2 and d=4.",
    options: ["180", "190", "200", "210"],
    correctAnswer: 2,
    explanation: "S₁₀ = (10/2)[2(2) + (10-1)4] = 5[4 + 36] = 5[40] = 200."
  },
  {
    id: 58,
    text: "If z = 2 + i and w = 1 - 3i, find z * w.",
    options: ["5 - 5i", "1 - 5i", "5 + i", "2 - 3i"],
    correctAnswer: 0,
    explanation: "(2+i)(1-3i) = 2 - 6i + i - 3i² = 2 - 5i + 3 = 5 - 5i."
  },
  {
    id: 59,
    text: "Solve for x: e^(2x) = 1.",
    options: ["0", "1", "ln(2)", "-1"],
    correctAnswer: 0,
    explanation: "e⁰ = 1, so 2x = 0 => x = 0."
  },
  {
    id: 60,
    text: "What is the degree of the polynomial P(x) = 4x⁵ - 3x² + 7?",
    options: ["2", "4", "5", "7"],
    correctAnswer: 2,
    explanation: "The degree is the highest power of the variable."
  },
  {
    id: 61,
    text: "Evaluate the integral of sec²(x) dx.",
    options: ["tan(x)", "tan(x) + C", "sec(x) + C", "-tan(x) + C"],
    correctAnswer: 1,
    explanation: "Integral of sec²x is tan x."
  },
  {
    id: 62,
    text: "Find the inverse of the matrix [[1, 2], [3, 4]].",
    options: ["[[-2, 1], [1.5, -0.5]]", "[[4, -2], [-3, 1]]", "[[-2, 1.5], [1, -0.5]]", "None"],
    correctAnswer: 0,
    explanation: "Inverse = (1/det) * adj(A). Det = 4-6 = -2. Adj = [[4, -2], [-3, 1]]. Inv = [[-2, 1], [1.5, -0.5]]."
  },
  {
    id: 63,
    text: "Which of the following functions is even?",
    options: ["sin(x)", "cos(x)", "tan(x)", "x³"],
    correctAnswer: 1,
    explanation: "An even function satisfies f(-x) = f(x). cos(-x) = cos(x)."
  },
  {
    id: 64,
    text: "Evaluate C(6, 3).",
    options: ["10", "20", "30", "60"],
    correctAnswer: 1,
    explanation: "6! / (3! * 3!) = (6 * 5 * 4) / (3 * 2 * 1) = 20."
  },
  {
    id: 65,
    text: "Find the slope of the tangent to y = x³ at x = 2.",
    options: ["4", "8", "12", "16"],
    correctAnswer: 2,
    explanation: "dy/dx = 3x². At x=2, 3(2²) = 12."
  },
  {
    id: 66,
    text: "A cubic equation has how many roots (real or complex)?",
    options: ["1", "2", "3", "0"],
    correctAnswer: 2,
    explanation: "By the Fundamental Theorem of Algebra."
  },
  {
    id: 67,
    text: "Find the value of sin(120°).",
    options: ["1/2", "sqrt(3)/2", "-1/2", "-sqrt(3)/2"],
    correctAnswer: 1,
    explanation: "sin(120°) = sin(180-60) = sin(60°) = sqrt(3)/2."
  },
  {
    id: 68,
    text: "The derivative of e^(x²) is:",
    options: ["2x*e^(x²)", "e^(x²)", "2e^(x²)", "x²*e^(x²-1)"],
    correctAnswer: 0,
    explanation: "Using chain rule: derivative of e^u is e^u * du/dx."
  },
  {
    id: 69,
    text: "What is the cross product of u = (1, 0, 0) and v = (0, 1, 0)?",
    options: ["(0, 0, 0)", "(0, 0, 1)", "(1, 1, 0)", "(-1, 0, 0)"],
    correctAnswer: 1,
    explanation: "i × j = k."
  },
  {
    id: 70,
    text: "Solve for x: x⁴ - 16 = 0.",
    options: ["±2", "±2, ±2i", "2, -2", "None"],
    correctAnswer: 1,
    explanation: "(x² - 4)(x² + 4) = 0 => x² = 4 or x² = -4."
  },
  {
    id: 71,
    text: "In a GP, if a=5 and r=1/2, find the sum to infinity.",
    options: ["5", "10", "2.5", "infinity"],
    correctAnswer: 1,
    explanation: "Sum = 5 / (1 - 0.5) = 10."
  },
  {
    id: 72,
    text: "Find the mean deviation of 2, 4, 6.",
    options: ["0", "1.33", "2", "4"],
    correctAnswer: 1,
    explanation: "Mean = 4. Deviations: |-2|, |0|, |2| = 2, 0, 2. Mean deviation = 4/3 = 1.33."
  },
  {
    id: 73,
    text: "The binary operation * is defined as a * b = sqrt(a² + b²). Is it commutative?",
    options: ["Yes", "No", "Depends on a", "Depends on b"],
    correctAnswer: 0,
    explanation: "sqrt(a² + b²) = sqrt(b² + a²)."
  },
  {
    id: 74,
    text: "Evaluate the limit: lim (x→1) (x³ - 1) / (x - 1)",
    options: ["1", "2", "3", "undefined"],
    correctAnswer: 2,
    explanation: "Factorize: (x-1)(x²+x+1)/(x-1) = x²+x+1. At x=1, value is 1+1+1 = 3."
  },
  {
    id: 75,
    text: "Find the integral of sin(2x) dx.",
    options: ["cos(2x) + C", "-0.5cos(2x) + C", "2cos(2x) + C", "-cos(2x) + C"],
    correctAnswer: 1,
    explanation: "Integral of sin(ax) is -1/a * cos(ax)."
  },
  {
    id: 76,
    text: "If the discriminant of a quadratic is negative, the roots are:",
    options: ["Real and equal", "Real and distinct", "Complex", "None"],
    correctAnswer: 2,
    explanation: "Negative discriminant implies imaginary roots."
  },
  {
    id: 77,
    text: "Find the value of k if (x - 2) is a factor of x² + kx + 4.",
    options: ["-4", "4", "-2", "0"],
    correctAnswer: 0,
    explanation: "f(2) = (2)² + 2k + 4 = 0 => 4 + 2k + 4 = 0 => 2k = -8 => k = -4."
  },
  {
    id: 78,
    text: "Evaluate log₂ 0.25",
    options: ["-2", "2", "0.5", "-0.5"],
    correctAnswer: 0,
    explanation: "2⁻² = 1/4 = 0.25."
  },
  {
    id: 79,
    text: "Find the probability of drawing an Ace from a standard deck of 52 cards.",
    options: ["1/52", "1/13", "4/13", "1/4"],
    correctAnswer: 1,
    explanation: "4 Aces / 52 Cards = 1/13."
  },
  {
    id: 80,
    text: "What is the derivative of a constant?",
    options: ["1", "x", "0", "constant"],
    correctAnswer: 2,
    explanation: "Rate of change of a constant is zero."
  },
  {
    id: 81,
    text: "Solve for x: |x - 3| = 5.",
    options: ["8", "-2", "8, -2", "2"],
    correctAnswer: 2,
    explanation: "x - 3 = 5 or x - 3 = -5."
  },
  {
    id: 82,
    text: "Find the area of a circle with radius 7 (use π = 22/7).",
    options: ["44", "154", "616", "22"],
    correctAnswer: 1,
    explanation: "Area = πr² = (22/7) * 7 * 7 = 154."
  },
  {
    id: 83,
    text: "The derivative of ln(3x) is:",
    options: ["1/x", "3/x", "1/3x", "ln(3)/x"],
    correctAnswer: 0,
    explanation: "Using chain rule: (1/3x) * 3 = 1/x."
  },
  {
    id: 84,
    text: "Find the range of the function f(x) = sin(x).",
    options: ["[0, 1]", "[-1, 1]", "(-infinity, infinity)", "None"],
    correctAnswer: 1,
    explanation: "Sine values always fluctuate between -1 and 1."
  },
  {
    id: 85,
    text: "Evaluate the integral of 3e^(3x) dx.",
    options: ["e^(3x) + C", "9e^(3x) + C", "e^x + C", "3e^(3x) + C"],
    correctAnswer: 0,
    explanation: "Integral of ae^(ax) is e^(ax)."
  },
  {
    id: 86,
    text: "A vector of magnitude 1 is called a:",
    options: ["Zero vector", "Unit vector", "Scalar", "Direction"],
    correctAnswer: 1,
    explanation: "Used to define direction."
  },
  {
    id: 87,
    text: "Find the value of 0! (zero factorial).",
    options: ["0", "1", "-1", "undefined"],
    correctAnswer: 1,
    explanation: "By mathematical definition."
  },
  {
    id: 88,
    text: "Solve for x: x / (x + 1) = 2/3.",
    options: ["1", "2", "3", "0"],
    correctAnswer: 1,
    explanation: "3x = 2x + 2 => x = 2."
  },
  {
    id: 89,
    text: "Find the mode of the set: 1, 2, 2, 3, 4, 4, 4, 5.",
    options: ["2", "4", "3", "5"],
    correctAnswer: 1,
    explanation: "4 occurs most frequently."
  },
  {
    id: 90,
    text: "The sum of the angles in a triangle is:",
    options: ["90°", "180°", "270°", "360°"],
    correctAnswer: 1,
    explanation: "Fundamental property of Euclidean geometry."
  },
  {
    id: 91,
    text: "Find the derivative of cos(x²).",
    options: ["-sin(x²)", "-2x*sin(x²)", "2x*sin(x²)", "sin(2x)"],
    correctAnswer: 1,
    explanation: "Chain rule applied to cos(u)."
  },
  {
    id: 92,
    text: "Evaluate log₅ 1.",
    options: ["0", "1", "5", "undefined"],
    correctAnswer: 0,
    explanation: "Any non-zero base raised to power 0 is 1."
  },
  {
    id: 93,
    text: "What is the identity element for addition in the set of real numbers?",
    options: ["1", "0", "-1", "None"],
    correctAnswer: 1,
    explanation: "a + 0 = a."
  },
  {
    id: 94,
    text: "Find the variance of a set where SD = 4.",
    options: ["2", "4", "8", "16"],
    correctAnswer: 3,
    explanation: "Variance = (Standard Deviation)²."
  },
  {
    id: 95,
    text: "Evaluate the limit: lim (x→0) (1-cos(x))/x²",
    options: ["0", "1", "0.5", "infinity"],
    correctAnswer: 2,
    explanation: "Standard trigonometric limit."
  },
  {
    id: 96,
    text: "Find the length of the vector (6, 8, 0).",
    options: ["10", "14", "100", "7"],
    correctAnswer: 0,
    explanation: "sqrt(6² + 8² + 0²) = 10."
  },
  {
    id: 97,
    text: "Is the function f(x) = x³ - x odd?",
    options: ["Yes", "No", "Only for x>0", "None"],
    correctAnswer: 0,
    explanation: "f(-x) = (-x)³ - (-x) = -x³ + x = -f(x)."
  },
  {
    id: 98,
    text: "Convert 300° to radians.",
    options: ["3π/2", "5π/3", "4π/3", "2π"],
    correctAnswer: 1,
    explanation: "300 * (π/180) = 5π/3."
  },
  {
    id: 99,
    text: "Find the integral of (e^x + sin x) dx.",
    options: ["e^x - cos x + C", "e^x + cos x + C", "e^x - sin x + C", "xe^x - cos x + C"],
    correctAnswer: 0,
    explanation: "Sum of individual integrals."
  },
  {
    id: 100,
    text: "If a matrix has a determinant of zero, it is:",
    options: ["Identity", "Singular", "Invertible", "Skew"],
    correctAnswer: 1,
    explanation: "Singular matrices cannot be inverted."
  },
  {
    id: 101,
    text: "Find the 5th term of an AP if a=10 and d=-2.",
    options: ["2", "4", "6", "8"],
    correctAnswer: 0,
    explanation: "T₅ = a + 4d = 10 + 4(-2) = 2."
  },
  {
    id: 102,
    text: "Evaluate the sum of the first 10 natural numbers.",
    options: ["45", "55", "100", "110"],
    correctAnswer: 1,
    explanation: "Sum = n(n+1)/2 = 10(11)/2 = 55."
  },
  {
    id: 103,
    text: "Find the derivative of f(x) = (x² + 1)³.",
    options: ["3(x² + 1)²", "6x(x² + 1)²", "2x(x² + 1)²", "3x(x² + 1)²"],
    correctAnswer: 1,
    explanation: "Using chain rule: 3(x²+1)² * 2x = 6x(x²+1)²."
  },
  {
    id: 104,
    text: "Evaluate the integral of tan x dx.",
    options: ["sec² x + C", "ln|sec x| + C", "ln|cos x| + C", "-ln|sec x| + C"],
    correctAnswer: 1,
    explanation: "Standard integral: ln|sec x| or -ln|cos x|."
  },
  {
    id: 105,
    text: "Solve for x: log x + log 2 = log 10.",
    options: ["5", "8", "12", "2"],
    correctAnswer: 0,
    explanation: "log(2x) = log 10 => 2x = 10 => x = 5."
  },
  {
    id: 106,
    text: "Find the center of the circle x² + y² - 4x + 6y = 0.",
    options: ["(2, -3)", "(-2, 3)", "(4, -6)", "(0, 0)"],
    correctAnswer: 0,
    explanation: "Complete the square: (x-2)² + (y+3)² = radius². Center is (2, -3)."
  },
  {
    id: 107,
    text: "Evaluate C(7, 0).",
    options: ["0", "1", "7", "undefined"],
    correctAnswer: 1,
    explanation: "Number of ways to choose 0 items from 7 is 1."
  },
  {
    id: 108,
    text: "Find the derivative of 2^x.",
    options: ["2^x", "x*2^(x-1)", "2^x * ln 2", "2^x / ln 2"],
    correctAnswer: 2,
    explanation: "Derivative of a^x is a^x * ln a."
  },
  {
    id: 109,
    text: "What is the period of the function f(x) = sin(2x)?",
    options: ["π/2", "π", "2π", "4π"],
    correctAnswer: 1,
    explanation: "Period = 2π / |b| = 2π / 2 = π."
  },
  {
    id: 110,
    text: "Find the cross product j × k.",
    options: ["i", "-i", "k", "0"],
    correctAnswer: 0,
    explanation: "Right-hand rule for unit vectors."
  },
  {
    id: 111,
    text: "Evaluate the limit: lim (x→0) tan x / x",
    options: ["0", "1", "infinity", "undefined"],
    correctAnswer: 1,
    explanation: "Standard limit derived from sin x / x."
  },
  {
    id: 112,
    text: "If A = [[2, 1], [0, 3]], find det(2A).",
    options: ["6", "12", "24", "48"],
    correctAnswer: 2,
    explanation: "det(2A) = 2² * det(A) = 4 * 6 = 24 (since A is 2x2)."
  },
  {
    id: 113,
    text: "Find the sum of the roots of 3x² - 9x + 5 = 0.",
    options: ["3", "-3", "5/3", "-5/3"],
    correctAnswer: 0,
    explanation: "Sum = -b/a = -(-9)/3 = 3."
  },
  {
    id: 114,
    text: "Evaluate the integral of 1 / (1 + x²) dx.",
    options: ["ln|1+x²|", "tan⁻¹ x", "tan⁻¹ x + C", "sin⁻¹ x + C"],
    correctAnswer: 2,
    explanation: "Standard integral resulting in inverse tangent."
  },
  {
    id: 115,
    text: "Solve for x: sin x = cos x for 0 ≤ x ≤ π.",
    options: ["π/4", "3π/4", "π/2", "0"],
    correctAnswer: 0,
    explanation: "tan x = 1 => x = π/4."
  },
  {
    id: 116,
    text: "What is the polar form of the complex number i?",
    options: ["cos 0 + i sin 0", "cos(π/2) + i sin(π/2)", "cos π + i sin π", "None"],
    correctAnswer: 1,
    explanation: "|i|=1, Arg(i)=π/2."
  },
  {
    id: 117,
    text: "Find the derivative of x^x.",
    options: ["x*x^(x-1)", "x^x * (1 + ln x)", "x^x * ln x", "x^x"],
    correctAnswer: 1,
    explanation: "Use logarithmic differentiation."
  },
  {
    id: 118,
    text: "Find the 3rd term in the expansion of (x + y)⁴.",
    options: ["4x³y", "6x²y²", "4xy³", "x⁴"],
    correctAnswer: 1,
    explanation: "Using Binomial Theorem: C(4, 2)x²y² = 6x²y²."
  },
  {
    id: 119,
    text: "Evaluate the integral of ln x dx.",
    options: ["1/x + C", "x ln x - x + C", "x ln x + C", "ln x + x + C"],
    correctAnswer: 1,
    explanation: "Use integration by parts."
  },
  {
    id: 120,
    text: "What is the eccentricity of a circle?",
    options: ["0", "1", "Between 0 and 1", "Greater than 1"],
    correctAnswer: 0,
    explanation: "A circle is an ellipse with e = 0."
  },
  {
    id: 121,
    text: "Find the arithmetic mean of 1, 3, 5, 7, 9.",
    options: ["4", "5", "6", "25"],
    correctAnswer: 1,
    explanation: "Sum/5 = 25/5 = 5."
  },
  {
    id: 122,
    text: "Evaluate the limit: lim (x→2) (x² - x - 2) / (x - 2)",
    options: ["1", "2", "3", "0"],
    correctAnswer: 2,
    explanation: "Factorize: (x-2)(x+1)/(x-2) = x+1. At x=2, value is 2+1 = 3."
  },
  {
    id: 123,
    text: "Find the dot product i · j.",
    options: ["k", "1", "0", "-1"],
    correctAnswer: 2,
    explanation: "Unit vectors i and j are perpendicular."
  },
  {
    id: 124,
    text: "What is the slope of the line vertical to y = 4x + 5?",
    options: ["-4", "1/4", "-1/4", "4"],
    correctAnswer: 2,
    explanation: "Perpendicular gradient = -1/m."
  },
  {
    id: 125,
    text: "Solve for x: x² + x = 0.",
    options: ["0", "-1", "0, -1", "1"],
    correctAnswer: 2,
    explanation: "x(x + 1) = 0."
  },
  {
    id: 126,
    text: "Evaluate the integral of 1 / sqrt(1 - x²) dx.",
    options: ["sin⁻¹ x", "sin⁻¹ x + C", "cos⁻¹ x + C", "tan⁻¹ x + C"],
    correctAnswer: 1,
    explanation: "Standard inverse sine integral."
  },
  {
    id: 127,
    text: "Find the sum of an infinite GP with a=4 and r=0.75.",
    options: ["4", "8", "16", "1.33"],
    correctAnswer: 2,
    explanation: "Sum = 4 / (1 - 0.75) = 4 / 0.25 = 16."
  },
  {
    id: 128,
    text: "What is the value of i³?",
    options: ["1", "-1", "i", "-i"],
    correctAnswer: 3,
    explanation: "i³ = i² * i = -1 * i = -i."
  },
  {
    id: 129,
    text: "Find the derivative of arc tan x.",
    options: ["1 / (1 + x²)", "1 / (1 - x²)", "1 / sqrt(1 - x²)", "None"],
    correctAnswer: 0,
    explanation: "Standard derivative of inverse tangent."
  },
  {
    id: 130,
    text: "Which of the following is a vector quantity?",
    options: ["Mass", "Time", "Velocity", "Temperature"],
    correctAnswer: 2,
    explanation: "Velocity has both magnitude and direction."
  },
  {
    id: 131,
    text: "Evaluate the integral of 2x * e^(x²) dx.",
    options: ["e^(x²) + C", "2e^(x²) + C", "x²e^(x²) + C", "None"],
    correctAnswer: 0,
    explanation: "Using u-substitution where u = x²."
  },
  {
    id: 132,
    text: "What is the modulus of -5i?",
    options: ["5", "-5", "25", "0"],
    correctAnswer: 0,
    explanation: "Distance from origin is 5."
  },
  {
    id: 133,
    text: "Find the coordinates of the midpoint between (-2, -3) and (4, 5).",
    options: ["(1, 1)", "(2, 2)", "(3, 4)", "(6, 8)"],
    correctAnswer: 0,
    explanation: "((-2+4)/2, (-3+5)/2) = (1, 1)."
  },
  {
    id: 134,
    text: "Find the 1st derivative of f(x) = x * ln x.",
    options: ["1/x", "ln x", "1 + ln x", "x + ln x"],
    correctAnswer: 2,
    explanation: "Product rule: x(1/x) + ln x(1) = 1 + ln x."
  },
  {
    id: 135,
    text: "Evaluate the determinant of [[k, 1], [1, k]].",
    options: ["k² + 1", "k² - 1", "2k", "0"],
    correctAnswer: 1,
    explanation: "k*k - 1*1 = k² - 1."
  },
  {
    id: 136,
    text: "What is the value of C(n, n)?",
    options: ["n", "1", "0", "n!"],
    correctAnswer: 1,
    explanation: "Only one way to choose all n items."
  },
  {
    id: 137,
    text: "Find the integral of |x| from -1 to 1.",
    options: ["0", "1", "2", "0.5"],
    correctAnswer: 1,
    explanation: "Integral of x from 0 to 1 is 0.5. Symmetric part adds another 0.5."
  },
  {
    id: 138,
    text: "If r = 0, the correlation between two variables is:",
    options: ["Perfect", "Strong", "None", "Negative"],
    correctAnswer: 2,
    explanation: "r=0 implies no linear relationship."
  },
  {
    id: 139,
    text: "Find the derivative of cos x at x = π/2.",
    options: ["0", "1", "-1", "undefined"],
    correctAnswer: 2,
    explanation: "f'(x) = -sin x. At π/2, -sin(π/2) = -1."
  },
  {
    id: 140,
    text: "What is the product of the complex numbers (1 + i) and (1 - i)?",
    options: ["0", "2", "2i", "-2"],
    correctAnswer: 1,
    explanation: "1 - i² = 1 - (-1) = 2."
  },
  {
    id: 141,
    text: "Find the number of ways to arrange the letters in 'AAAB'.",
    options: ["4", "12", "24", "1"],
    correctAnswer: 0,
    explanation: "4! / 3! = 4."
  }
];
