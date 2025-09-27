

export type Question = {
  id: string;
  text: { en: string; mr: string };
  options: { en: string[]; mr: string[] };
  correctAnswer: { en: string; mr: string };
};

export type TestSet = {
  id: string;
  name: string;
  board: "CBSE" | "ICSE" | "SSC";
  standard: string;
  subject: string;
  questions: Question[];
};


export let allTestSets: TestSet[] = [
  {
    id: "SET-172234567890",
    name: "Gravitation Mock Test",
    board: "SSC",
    standard: "10th",
    subject: "Science",
    questions: [
      {
        id: "Q-172234567890-0",
        text: {
          en: "Why is it very difficult to detect gravitational waves?",
          mr: "गुरुत्वीय लहरी शोधणे खूप कठीण का आहे?"
        },
        options: {
          en: [
            "Because they are very fast",
            "Because they are very weak",
            "Because they are imaginary",
            "Because they do not travel to Earth"
          ],
          mr: [
            "कारण त्या खूप वेगवान असतात",
            "कारण त्या खूप क्षीण असतात",
            "कारण त्या काल्पनिक आहेत",
            "कारण त्या पृथ्वीपर्यंत पोहोचत नाहीत"
          ]
        },
        correctAnswer: {
          en: "Because they are very weak",
          mr: "कारण त्या खूप क्षीण असतात"
        }
      },
      {
        id: "Q-172234567890-1",
        text: {
          en: "Will your mass be different if you are on the surface of the Earth versus on a high mountain?",
          mr: "तुम्ही पृथ्वीच्या पृष्ठभागावर किंवा उंच पर्वतावर असाल तर तुमच्या वस्तुमानात फरक पडेल का?"
        },
        options: {
          en: [
            "Yes, it will be more on the mountain",
            "Yes, it will be less on the mountain",
            "No, mass remains constant",
            "Mass will become zero on the mountain"
          ],
          mr: [
            "हो, ते पर्वतावर जास्त असेल",
            "हो, ते पर्वतावर कमी असेल",
            "नाही, वस्तुमान स्थिर राहते",
            "पर्वतावर वस्तुमान शून्य होईल"
          ]
        },
        correctAnswer: {
          en: "No, mass remains constant",
          mr: "नाही, वस्तुमान स्थिर राहते"
        }
      },
      {
        id: "Q-172234567890-2",
        text: {
          en: "Which direction does gravitational force act on an apple on the tree?",
          mr: "झाडावर असलेल्या सफरचंदावर गुरुत्वाकर्षण बल कोणत्या दिशेने कार्य करते?"
        },
        options: {
          en: [
            "Horizontally",
            "Upward",
            "Towards the center of Earth",
            "Away from Earth"
          ],
          mr: [
            "आडव्या दिशेने",
            "वरच्या दिशेने",
            "पृथ्वीच्या केंद्राकडे",
            "पृथ्वीपासून दूर"
          ]
        },
        correctAnswer: {
          en: "Towards the center of Earth",
          mr: "पृथ्वीच्या केंद्राकडे"
        }
      },
      {
        id: "Q-172234567890-3",
        text: {
          en: "What is the nature of gravitational force?",
          mr: "गुरुत्वाकर्षण बलाचे स्वरूप कसे असते?"
        },
        options: {
          en: [
            "Repulsive",
            "Attractive",
            "Rotational",
            "Magnetic"
          ],
          mr: [
            "दूर लोटणारे",
            "आकर्षण करणारे",
            "फिरणारे",
            "चुंबकीय"
          ]
        },
        correctAnswer: {
          en: "Attractive",
          mr: "आकर्षण करणारे"
        }
      },
      {
        id: "Q-172234567890-4",
        text: {
          en: "Why do apples fall vertically downward?",
          mr: "सफरचंद सरळ खाली का पडते?"
        },
        options: {
          en: [
            "Due to wind",
            "Due to gravity towards Earth’s center",
            "Because of magnetic pull",
            "Earth’s rotation"
          ],
          mr: [
            "वाऱ्यामुळे",
            "पृथ्वीच्या केंद्राकडे गुरुत्वामुळे",
            "चुंबकीय आकर्षणामुळे",
            "पृथ्वीच्या फिरण्यामुळे"
          ]
        },
        correctAnswer: {
          en: "Due to gravity towards Earth’s center",
          mr: "पृथ्वीच्या केंद्राकडे गुरुत्वामुळे"
        }
      },
      {
        id: "Q-172234567890-5",
        text: {
          en: "Which force acts between Earth and Moon?",
          mr: "पृथ्वी आणि चंद्रामध्ये कोणते बल कार्य करते?"
        },
        options: {
          en: [
            "Magnetic force",
            "Electric force",
            "Gravitational force",
            "Frictional force"
          ],
          mr: [
            "चुंबकीय बल",
            "विद्युत बल",
            "गुरुत्वाकर्षण बल",
            "घर्षण बल"
          ]
        },
        correctAnswer: {
          en: "Gravitational force",
          mr: "गुरुत्वाकर्षण बल"
        }
      },
      {
        id: "Q-172234567890-6",
        text: {
          en: "What does the figure of apple falling show?",
          mr: "सफरचंद पडण्याचे चित्र काय दर्शवते?"
        },
        options: {
          en: [
            "Magnetic attraction",
            "Gravitational attraction",
            "Air resistance",
            "Motion in space"
          ],
          mr: [
            "चुंबकीय आकर्षण",
            "गुरुत्वाकर्षण",
            "वायुरोध",
            "अवकाशातील गती"
          ]
        },
        correctAnswer: {
          en: "Gravitational attraction",
          mr: "गुरुत्वाकर्षण"
        }
      },
      {
        id: "Q-172234567890-7",
        text: {
          en: "What type of force is gravitation?",
          mr: "गुरुत्वाकर्षण हा कोणत्या प्रकारचा बल आहे?"
        },
        options: {
          en: [
            "Scalar",
            "Vector",
            "Imaginary",
            "None"
          ],
          mr: [
            "स्कॅलर",
            "व्हेक्टर",
            "काल्पनिक",
            "वरीलपैकी नाही"
          ]
        },
        correctAnswer: {
          en: "Vector",
          mr: "व्हेक्टर"
        }
      },
      {
        id: "Q-172234567890-8",
        text: {
          en: "What is the direction of gravitational force on a body?",
          mr: "वस्तूवर कार्य करणाऱ्या गुरुत्वाकर्षण बलाची दिशा कोणती असते?"
        },
        options: {
          en: [
            "Horizontal",
            "Downward",
            "Toward Earth’s center",
            "Upward"
          ],
          mr: [
            "आडवी",
            "खाली",
            "पृथ्वीच्या केंद्राकडे",
            "वर"
          ]
        },
        correctAnswer: {
          en: "Toward Earth’s center",
          mr: "पृथ्वीच्या केंद्राकडे"
        }
      },
      {
        id: "Q-172234567890-9",
        text: {
          en: "What is needed to change the speed of an object?",
          mr: "वस्तूचा वेग बदलण्यासाठी काय आवश्यक आहे?"
        },
        options: {
          en: [
            "Friction",
            "Force",
            "Air pressure",
            "Heat"
          ],
          mr: [
            "घर्षण",
            "बल",
            "वायुदाब",
            "उष्णता"
          ]
        },
        correctAnswer: {
          en: "Force",
          mr: "बल"
        }
      },
      {
        id: "Q-172234567890-10",
        text: {
          en: "What did Newton conclude from the falling apple?",
          mr: "सफरचंद पडल्यावर न्यूटनने कोणता निष्कर्ष काढला?"
        },
        options: {
          en: [
            "Earth repels objects",
            "Objects move in air",
            "Earth attracts all objects",
            "Apples are heavy"
          ],
          mr: [
            "पृथ्वी वस्तूंना दूर लोटते",
            "वस्तू हवेत तरंगतात",
            "पृथ्वी सर्व वस्तूंना आकर्षित करते",
            "सफरचंद जड असतात"
          ]
        },
        correctAnswer: {
          en: "Earth attracts all objects",
          mr: "पृथ्वी सर्व वस्तूंना आकर्षित करते"
        }
      },
      {
        id: "Q-172234567890-11",
        text: {
          en: "Gravitation acts between which objects?",
          mr: "गुरुत्वाकर्षण कोणत्या वस्तूंमध्ये कार्य करते?"
        },
        options: {
          en: [
            "Only on Earth",
            "Only in space",
            "Any two masses",
            "Only magnetic materials"
          ],
          mr: [
            "फक्त पृथ्वीवर",
            "फक्त अवकाशात",
            "कोणत्याही दोन वस्तूंमध्ये",
            "फक्त चुंबकीय वस्तूंमध्ये"
          ]
        },
        correctAnswer: {
          en: "Any two masses",
          mr: "कोणत्याही दोन वस्तूंमध्ये"
        }
      },
      {
        id: "Q-172234567890-12",
        text: {
          en: "What causes the apple to fall directly downward?",
          mr: "सफरचंद सरळ खाली पडण्याचे कारण काय आहे?"
        },
        options: {
          en: [
            "Wind direction",
            "Gravitational force acting vertically",
            "Tree movement",
            "Fruit weight"
          ],
          mr: [
            "वाऱ्याची दिशा",
            "सरळ खाली कार्य करणारे गुरुत्व बल",
            "झाडाची हालचाल",
            "फळाचे वजन"
          ]
        },
        correctAnswer: {
          en: "Gravitational force acting vertically",
          mr: "सरळ खाली कार्य करणारे गुरुत्व बल"
        }
      },
      {
        id: "Q-172234567890-13",
        text: {
          en: "According to Newton, gravitational force acts on...",
          mr: "न्यूटननुसार गुरुत्वाकर्षण बल कोणावर कार्य करते?"
        },
        options: {
          en: [
            "Only planets",
            "Only fruits",
            "All objects with mass",
            "Only liquids"
          ],
          mr: [
            "फक्त ग्रहांवर",
            "फक्त फळांवर",
            "जडत्व असलेल्या सर्व वस्तूंवर",
            "फक्त द्रवांवर"
          ]
        },
        correctAnswer: {
          en: "All objects with mass",
          mr: "जडत्व असलेल्या सर्व वस्तूंवर"
        }
      },
      {
        id: "Q-172234567890-14",
        text: {
          en: "Which phenomenon made Newton think about gravity?",
          mr: "न्यूटनला गुरुत्वाकर्षणाचा विचार कोणत्या घटनेमुळे सुचला?"
        },
        options: {
          en: [
            "Falling tree",
            "Falling apple",
            "Rising balloon",
            "Moving train"
          ],
          mr: [
            "झाड पडल्यामुळे",
            "सफरचंद पडल्यामुळे",
            "फुगा वर जात असल्यामुळे",
            "गाडीच्या हालचालीमुळे"
          ]
        },
        correctAnswer: {
          en: "Falling apple",
          mr: "सफरचंद पडल्यामुळे"
        }
      },
      {
        id: "Q-172234567890-15",
        text: {
          en: "What is the effect of gravitational force on objects at different heights?",
          mr: "वेगवेगळ्या उंचीवरील वस्तूंवर गुरुत्व बलाचा काय परिणाम होतो?"
        },
        options: {
          en: [
            "Only bottom object is affected",
            "No effect",
            "All are affected",
            "Only high object is affected"
          ],
          mr: [
            "फक्त खालील वस्तूवर परिणाम होतो",
            "काही परिणाम नाही",
            "सर्व वस्तूंवर परिणाम होतो",
            "फक्त वरच्या वस्तूवर परिणाम होतो"
          ]
        },
        correctAnswer: {
          en: "All are affected",
          mr: "सर्व वस्तूंवर परिणाम होतो"
        }
      },
      {
        id: "Q-172234567890-16",
        text: {
          en: "Which force is necessary for an object to move in a circular path around the Earth?",
          mr: "पृथ्वीभोवती चक्राकार फिरणाऱ्या वस्तूला कोणता बल आवश्यक असतो?"
        },
        options: {
          en: [
            "Gravitational Force",
            "Centrifugal Force",
            "Centripetal Force",
            "Frictional Force"
          ],
          mr: [
            "गुरुत्वाकर्षण बल",
            "अपकेंद्रित बल",
            "अभिकेंद्रित बल",
            "घर्षण बल"
          ]
        },
        correctAnswer: {
          en: "Centripetal Force",
          mr: "अभिकेंद्रित बल"
        }
      },
      {
        id: "Q-172234567890-17",
        text: {
          en: "While rotating a stone tied to a string, in which direction does the force act on the stone?",
          mr: "एका दोरीच्या टोकाला दगड बांधून फिरवताना दगडाला कोणत्या दिशेने बल लागते?"
        },
        options: {
          en: [
            "Outward",
            "Upward",
            "Towards the center",
            "Downward"
          ],
          mr: [
            "बाहेरच्या दिशेने",
            "वरच्या दिशेने",
            "अभिकेंद्रित दिशेने",
            "खालीच्या दिशेने"
          ]
        },
        correctAnswer: {
          en: "Towards the center",
          mr: "अभिकेंद्रित दिशेने"
        }
      },
      {
        id: "Q-172234567890-18",
        text: {
          en: "Which book by Newton is based on the theory of gravitation?",
          mr: "न्यूटनचे कोणते ग्रंथ गुरुत्वाकर्षण सिद्धांतावर आधारित आहे?"
        },
        options: {
          en: [
            "Dynamics",
            "Principia",
            "Mechanics",
            "Law of Motion"
          ],
          mr: [
            "डायनॅमिक्स",
            "प्रिन्सिपिया",
            "मेकॅनिक्स",
            "लॉ ऑफ मोशन"
          ]
        },
        correctAnswer: {
          en: "Principia",
          mr: "प्रिन्सिपिया"
        }
      },
      {
        id: "Q-172234567890-19",
        text: {
          en: "In which type of motion does an object move along a fixed circular path?",
          mr: "कोणत्या प्रकारच्या गतीमध्ये वस्तू एका निश्चित वर्तुळाकार मार्गाने फिरते?"
        },
        options: {
          en: [
            "Linear Motion",
            "Vibratory Motion",
            "Circular Motion",
            "Projectile Motion"
          ],
          mr: [
            "रेखीय गती",
            "कंपन गती",
            "चक्राकार गती",
            "प्रक्षिप्त गती"
          ]
        },
        correctAnswer: {
          en: "Circular Motion",
          mr: "चक्राकार गती"
        }
      },
      {
        id: "Q-172234567890-20",
        text: {
          en: "In which direction does centripetal force act?",
          mr: "अभिकेंद्रित बल कोणत्या दिशेने कार्य करते?"
        },
        options: {
          en: [
            "Away from the orbit",
            "Towards the center",
            "Parallel",
            "Upward"
          ],
          mr: [
            "कक्षेच्या बाहेर",
            "केंद्राच्या दिशेने",
            "समांतर दिशेने",
            "उर्ध्व दिशेने"
          ]
        },
        correctAnswer: {
          en: "Towards the center",
          mr: "केंद्राच्या दिशेने"
        }
      },
      {
        id: "Q-172234567890-21",
        text: {
          en: "If an object is rotated with a string and the string is released, in which direction will it move?",
          mr: "एक वस्तू जर दोरीने फिरवली आणि दोरी सोडली तर ती वस्तू कोणत्या दिशेने जाईल?"
        },
        options: {
          en: [
            "Towards the center",
            "Tangent to the circular path",
            "Upward",
            "Downward"
          ],
          mr: [
            "चक्राच्या केंद्राकडे",
            "चक्राच्या परिघावर सरळ",
            "वरच्या दिशेने",
            "खालीच्या दिशेने"
          ]
        },
        correctAnswer: {
          en: "Tangent to the circular path",
          mr: "चक्राच्या परिघावर सरळ"
        }
      },
      {
        id: "Q-172234567890-22",
        text: {
          en: "Who among the following scientists wrote the book ‘Principia’?",
          mr: "‘प्रिन्सिपिया’ हे पुस्तक खालीलपैकी कोणत्या शास्त्रज्ञाने लिहिले?"
        },
        options: {
          en: [
            "Albert Einstein",
            "Newton",
            "Galileo",
            "Kepler"
          ],
          mr: [
            "अल्बर्ट आइन्स्टाईन",
            "न्यूटन",
            "गॅलिलिओ",
            "केप्लर"
          ]
        },
        correctAnswer: {
          en: "Newton",
          mr: "न्यूटन"
        }
      },
      {
        id: "Q-172234567890-23",
        text: {
          en: "If there were no centripetal force, along which path would the object move?",
          mr: "जर अभिकेंद्रित बल नसते तर वस्तू कोणत्या मार्गाने गेली असती?"
        },
        options: {
          en: [
            "Circular",
            "Towards the center",
            "Straight line",
            "Zigzag"
          ],
          mr: [
            "वर्तुळाकार",
            "केंद्राकडे",
            "सरळ रेषेत",
            "झिगझॅग"
          ]
        },
        correctAnswer: {
          en: "Straight line",
          mr: "सरळ रेषेत"
        }
      },
      {
        id: "Q-172234567890-24",
        text: {
          en: "Which of the following forces pulls an object towards the center?",
          mr: "खालीलपैकी कोणता बल वस्तूला केंद्राच्या दिशेने खेचतो?"
        },
        options: {
          en: [
            "Gravitational force",
            "Frictional force",
            "Centripetal force",
            "Magnetic force"
          ],
          mr: [
            "गुरुत्वबल",
            "घर्षण बल",
            "अभिकेंद्रित बल",
            "चुंबकीय बल"
          ]
        },
        correctAnswer: {
          en: "Centripetal force",
          mr: "अभिकेंद्रित बल"
        }
      },
      {
        id: "Q-172234567890-25",
        text: {
          en: "What is the necessary force for circular motion?",
          mr: "चक्राकार गतीसाठी आवश्यक बल म्हणजे काय?"
        },
        options: {
          en: [
            "Centripetal force",
            "Centrifugal force",
            "Electric force",
            "Impulsive force"
          ],
          mr: [
            "अभिकेंद्रित बल",
            "अपकेंद्रित बल",
            "वीज बल",
            "धक्का बल"
          ]
        },
        correctAnswer: {
          en: "Centripetal force",
          mr: "अभिकेंद्रित बल"
        }
      },
      {
        id: "Q-172234567890-26",
        text: {
          en: "According to Kepler's laws, planets revolve around the Sun in which type of orbit?",
          mr: "केप्लरच्या नियमांनुसार ग्रह कोणत्या प्रकारच्या कक्षेत सूर्याभोवती फिरतात?"
        },
        options: {
          en: [
            "Circular",
            "Elliptical",
            "Straight",
            "Zigzag"
          ],
          mr: [
            "वर्तुळाकार",
            "लांबटवर्तुळाकार",
            "सरळ",
            "झिगझॅग"
          ]
        },
        correctAnswer: {
          en: "Elliptical",
          mr: "लांबटवर्तुळाकार"
        }
      },
      {
        id: "Q-172234567890-27",
        text: {
          en: "What are the central points of an elliptical orbit called?",
          mr: "लांबटवर्तुळाकार कक्षेच्या केंद्रबिंदूंना काय म्हणतात?"
        },
        options: {
          en: [
            "Center",
            "Foci",
            "Radius",
            "Angles"
          ],
          mr: [
            "केंद्र",
            "फोकस",
            "अर्धव्यास",
            "अंश"
          ]
        },
        correctAnswer: {
          en: "Foci",
          mr: "फोकस"
        }
      },
      {
        id: "Q-172234567890-28",
        text: {
          en: "Which Kepler’s law relates the speed of the planet to the area covered in orbit?",
          mr: "कोणत्या नियमानुसार ग्रहांच्या वेगाचा संबंध त्यांच्या कक्षेतील क्षेत्रफळाशी आहे?"
        },
        options: {
          en: [
            "First Law",
            "Second Law",
            "Third Law",
            "Newton’s Law"
          ],
          mr: [
            "पहिला नियम",
            "दुसरा नियम",
            "तिसरा नियम",
            "न्यूटनचा नियम"
          ]
        },
        correctAnswer: {
          en: "Second Law",
          mr: "दुसरा नियम"
        }
      },
      {
        id: "Q-172234567890-29",
        text: {
          en: "What is the planet’s speed when it is closer to the Sun?",
          mr: "ग्रह जेव्हा सूर्याजवळ असतो तेव्हा त्याचा वेग कसा असतो?"
        },
        options: {
          en: [
            "Less",
            "More",
            "Equal",
            "Zero"
          ],
          mr: [
            "कमी",
            "जास्त",
            "समान",
            "शून्य"
          ]
        },
        correctAnswer: {
          en: "More",
          mr: "जास्त"
        }
      },
      {
        id: "Q-172234567890-30",
        text: {
          en: "In an ellipse, AB + BC = ?",
          mr: "लांबटवर्तुळामध्ये AB + BC = ?"
        },
        options: {
          en: [
            "Radius",
            "Constant sum",
            "Perimeter",
            "Area"
          ],
          mr: [
            "अर्धव्यास",
            "स्थिर अंतर",
            "परिघ",
            "क्षेत्रफळ"
          ]
        },
        correctAnswer: {
          en: "Constant sum",
          mr: "स्थिर अंतर"
        }
      },
      {
        id: "Q-172234567890-31",
        text: {
          en: "What is Kepler’s First Law?",
          mr: "केप्लरचा पहिला नियम कोणता आहे?"
        },
        options: {
          en: [
            "Orbit is circular",
            "elliptical orbit",
            "Planets are stationary",
            "Only gravitational force governs orbits"
          ],
          mr: [
            "ग्रहांची कक्षा वर्तुळाकार असते",
            "ग्रह लांबटवर्तुळाकार कक्षेत फिरतात आणि सूर्य फोकसमध्ये असतो",
            "ग्रह स्थिर असतात",
            "ग्रह फक्त गुरुत्वाकर्षणाने फिरतात"
          ]
        },
        correctAnswer: {
          en: "elliptical orbit",
          mr: "ग्रह लांबटवर्तुळाकार कक्षेत फिरतात आणि सूर्य फोकसमध्ये असतो"
        }
      },
      {
        id: "Q-172234567890-32",
        text: {
          en: "According to the second law, what does a planet cover in equal time intervals?",
          mr: "दुसऱ्या नियमानुसार ग्रह एका समान कालावधीत काय करते?"
        },
        options: {
          en: [
            "Equal distance",
            "Equal area",
            "Equal angle",
            "Equal curvature"
          ],
          mr: [
            "समान अंतर",
            "समान क्षेत्रफळ",
            "समान कोन",
            "समान वक्रता"
          ]
        },
        correctAnswer: {
          en: "Equal area",
          mr: "समान क्षेत्रफळ"
        }
      },
      {
        id: "Q-172234567890-33",
        text: {
          en: "Kepler’s third law is related to the ratio of which quantities?",
          mr: "केप्लरचा तिसरा नियम कोणत्या संज्ञेच्या गुणोत्तराशी संबंधित आहे?"
        },
        options: {
          en: [
            "Speed and time",
            "Radius and time",
            "Period² and Radius³",
            "Area and angle"
          ],
          mr: [
            "वेग आणि वेळ",
            "कक्षेचा त्रिज्या आणि वेळ",
            "कक्षेचा कालावधी² आणि त्रिज्या³",
            "क्षेत्रफळ आणि कोन"
          ]
        },
        correctAnswer: {
          en: "Period² and Radius³",
          mr: "कक्षेचा कालावधी² आणि त्रिज्या³"
        }
      },
      {
        id: "Q-172234567890-34",
        text: {
          en: "What is the speed of a planet when it is far from the Sun?",
          mr: "ग्रह जेव्हा सूर्यापासून लांब असतो तेव्हा त्याचा वेग कसा असतो?"
        },
        options: {
          en: [
            "More",
            "Equal",
            "Less",
            "Doesn’t change"
          ],
          mr: [
            "जास्त",
            "समान",
            "कमी",
            "बदलत नाही"
          ]
        },
        correctAnswer: {
          en: "Less",
          mr: "कमी"
        }
      },
      {
        id: "Q-172234567890-35",
        text: {
          en: "Which sum remains constant in an ellipse?",
          mr: "कोणत्या गोष्टीचा योग लांबटवर्तुळामध्ये नेहमी समान असतो?"
        },
        options: {
          en: [
            "Both radii",
            "Any two points",
            "Sum of distances from two foci",
            "Diameter"
          ],
          mr: [
            "दोन्ही अर्धव्यास",
            "कोणतेही दोन बिंदू",
            "दोन फोकसपासून अंतराचा योग",
            "व्यास"
          ]
        },
        correctAnswer: {
          en: "Sum of distances from two foci",
          mr: "दोन फोकसपासून अंतराचा योग"
        }
      },
      {
        id: "Q-172234567890-36",
        text: {
          en: "Which principle is explained due to the area law?",
          mr: "क्षेत्रफळ नियमामुळे कोणता नियम स्पष्ट होतो?"
        },
        options: {
          en: [
            "Law of uniform motion",
            "Change in speed",
            "Constant velocity",
            "Centripetal force"
          ],
          mr: [
            "स्थिर गतीचा नियम",
            "गतीमध्ये बदल होतो",
            "स्थिर गतीचा वेग",
            "केंद्राभिमुख बल"
          ]
        },
        correctAnswer: {
          en: "Change in speed",
          mr: "गतीमध्ये बदल होतो"
        }
      },
      {
        id: "Q-172234567890-37",
        text: {
          en: "If a planet has a longer period, its orbit is...?",
          mr: "जर ग्रहाचा कालावधी जास्त असेल, तर त्याची कक्षा...?"
        },
        options: {
          en: [
            "Shorter",
            "Circular",
            "Larger",
            "Fixed"
          ],
          mr: [
            "लहान",
            "गोलसर",
            "मोठी",
            "स्थिर"
          ]
        },
        correctAnswer: {
          en: "Larger",
          mr: "मोठी"
        }
      },
      {
        id: "Q-172234567890-38",
        text: {
          en: "Which position between the Sun and planet causes greater speed?",
          mr: "सूर्य आणि ग्रहाच्या दरम्यान कोणती स्थिती अधिक वेग निर्माण करते?"
        },
        options: {
          en: [
            "Solar Orbit",
            "Aphelion",
            "Perihelion",
            "Midpoint"
          ],
          mr: [
            "सौर कक्षा",
            "अपसौर बिंदू",
            "उपसौर बिंदू",
            "मधला बिंदू"
          ]
        },
        correctAnswer: {
          en: "Perihelion",
          mr: "उपसौर बिंदू"
        }
      },
      {
        id: "Q-172234567890-39",
        text: {
          en: "Planetary orbits follow a specific shape. What is it?",
          mr: "ग्रहांची कक्षा विशिष्ट आकृतीची असते, ती कोणती?"
        },
        options: {
          en: [
            "Circle",
            "Triangle",
            "Ellipse",
            "Parallelogram"
          ],
          mr: [
            "वर्तुळ",
            "त्रिकोण",
            "लांबट वर्तुळ",
            "समलंब चतुर्भुज"
          ]
        },
        correctAnswer: {
          en: "Ellipse",
          mr: "लांबट वर्तुळ"
        }
      },
      {
        id: "Q-172234567890-40",
        text: {
          en: "Which of the following is NOT a Kepler’s law?",
          mr: "खालीलपैकी केप्लरचा नियम कोणता नाही?"
        },
        options: {
          en: [
            "Planets move in elliptical orbits",
            "Equal areas in equal time",
            "Period² ∝ Radius³",
            "Motion not dependent on gravity"
          ],
          mr: [
            "ग्रह लांबटवर्तुळ कक्षेत फिरतात",
            "समान क्षेत्रफळ समान वेळेत झाकले जाते",
            "कक्षा वेळ² ∝ त्रिज्या³",
            "ग्रहांची गती गुरुत्वाकर्षणावर अवलंबून नाही"
          ]
        },
        correctAnswer: {
          en: "Motion not dependent on gravity",
          mr: "ग्रहांची गती गुरुत्वाकर्षणावर अवलंबून नाही"
        }
      },
      {
        id: "Q-172234567890-41",
        text: {
          en: "According to Newton's law of gravitation, the gravitational force depends on...?",
          mr: "न्यूटनच्या सार्वत्रिक गुरुत्वाकर्षण नियमानुसार गुरुत्वाकर्षण बल कोणावर अवलंबून असतो?"
        },
        options: {
          en: [
            "Shape of object",
            "Colour of object",
            "Masses of objects and distance between them",
            "Speed of objects"
          ],
          mr: [
            "वस्तूचा आकार",
            "वस्तूचा रंग",
            "वस्तूंच्या वस्तुमानावर आणि त्यांच्या दरम्यान अंतरावर",
            "वस्तूंची गती"
          ]
        },
        correctAnswer: {
          en: "Masses of objects and distance between them",
          mr: "वस्तूंच्या वस्तुमानावर आणि त्यांच्या दरम्यान अंतरावर"
        }
      },
      {
        id: "Q-172234567890-42",
        text: {
          en: "What is the formula for gravitational force?",
          mr: "गुरुत्वाकर्षण बलाचे सूत्र काय आहे?"
        },
        options: {
          en: [
            "F = m × g",
            "F = G × (m₁m₂)/d²",
            "F = m × a",
            "F = mv²/r"
          ],
          mr: [
            "F = m × g",
            "F = G × (m₁m₂)/d²",
            "F = m × a",
            "F = mv²/r"
          ]
        },
        correctAnswer: {
          en: "F = G × (m₁m₂)/d²",
          mr: "F = G × (m₁m₂)/d²"
        }
      },
      {
        id: "Q-172234567890-43",
        text: {
          en: "What does 'G' represent?",
          mr: "'G' म्हणजे काय?"
        },
        options: {
          en: [
            "Friction constant",
            "Gravitational constant",
            "Velocity constant",
            "Gas constant"
          ],
          mr: [
            "घर्षण स्थिरांक",
            "गुरुत्वाकर्षण स्थिरांक",
            "गती स्थिरांक",
            "गॅस स्थिरांक"
          ]
        },
        correctAnswer: {
          en: "Gravitational constant",
          mr: "गुरुत्वाकर्षण स्थिरांक"
        }
      }
    ]
  }
];

export function addTestSet(testSet: TestSet) {
    const existingIndex = allTestSets.findIndex(ts => ts.id === testSet.id);

    if (existingIndex > -1) {
        console.warn(`Test set with ID ${testSet.id} already exists. It will be overwritten.`);
        allTestSets[existingIndex] = testSet;
    } else {
        allTestSets.push(testSet);
    }
}

export function updateTestSet(updatedTestSet: TestSet) {
    const index = allTestSets.findIndex(ts => ts.id === updatedTestSet.id);
    if (index > -1) {
        allTestSets[index] = updatedTestSet;
    } else {
        // If it doesn't exist, add it. This can happen if an ID changes, though unlikely.
        addTestSet(updatedTestSet);
    }
}

export function deleteTestSet(testSetId: string) {
    const indexToDelete = allTestSets.findIndex(ts => ts.id === testSetId);
    if (indexToDelete > -1) {
        allTestSets.splice(indexToDelete, 1);
    }
}



