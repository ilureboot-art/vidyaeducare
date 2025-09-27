

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
  },
  {
    id: "SET-172242000000",
    name: "Elements Mock Test",
    board: "SSC",
    standard: "10th",
    subject: "Science",
    questions: [
        {
            id: "Q-172242000000-0",
            text: {
                en: "What happens when a substance undergoes a chemical change?",
                mr: "जेव्हा एखाद्या पदार्थात रासायनिक बदल होतो, तेव्हा काय होते?"
            },
            options: {
                en: ["Its physical properties change", "Its composition changes", "It changes state", "It dissolves"],
                mr: ["त्याचे भौतिक गुणधर्म बदलतात", "त्याची रचना बदलते", "त्याची अवस्था बदलते", "ते विरघळते"]
            },
            correctAnswer: {
                en: "Its composition changes",
                mr: "त्याची रचना बदलते"
            }
        },
        {
            id: "Q-172242000000-1",
            text: {
                en: "Which of the following is a physical change?",
                mr: "खालीलपैकी कोणता भौतिक बदल आहे?"
            },
            options: {
                en: ["Rusting of iron", "Burning of magnesium ribbon", "Melting of ice", "Ripening of fruit"],
                mr: ["लोखंडाचेगंजणे", "मॅग्नेशियम पट्टीचेज्वलन", "बर्फाचेवितळणे", "फळ पिकणे"]
            },
            correctAnswer: {
                en: "Melting of ice",
                mr: "बर्फाचेवितळणे"
            }
        },
        {
            id: "Q-172242000000-2",
            text: {
                en: "What is an element?",
                mr: "मूलद्रव्य म्हणजे काय?"
            },
            options: {
                en: ["A substance that can be broken down", "A pure substance with one type of atom", "A mixture of two substances", "A substance with variable composition"],
                mr: [" विघटन करतायेणारा पदार्थ", "एकाच प्रकारच्या अणूंचा शुद्ध पदार्थ", "दोन पदार्थांचे मिश्रण", "बदलत्या रचनेचा पदार्थ"]
            },
            correctAnswer: {
                en: "A pure substance with one type of atom",
                mr: "एकाच प्रकारच्या अणूंचा शुद्ध पदार्थ"
            }
        },
        {
            id: "Q-172242000000-3",
            text: {
                en: "Which of the following is a compound?",
                mr: "खालीलपैकी कोणते संयुग आहे?"
            },
            options: {
                en: ["Air", "Water", "Milk", "Lemonade"],
                mr: ["हवा", "पाणी", "दूध", "लिंबू सरबत"]
            },
            correctAnswer: {
                en: "Water",
                mr: "पाणी"
            }
        },
        {
            id: "Q-172242000000-4",
            text: {
                en: "What type of substance is lemonade?",
                mr: "लिंबू सरबत कोणत्या प्रकारचा पदार्थ आहे?"
            },
            options: {
                en: ["Element", "Compound", "Homogeneous mixture", "Heterogeneous mixture"],
                mr: ["मूलद्रव्य", "संयुग", "एकजीव मिश्रण", "विषमांगी मिश्रण"]
            },
            correctAnswer: {
                en: "Homogeneous mixture",
                mr: "एकजीव मिश्रण"
            }
        },
        {
            id: "Q-172242000000-5",
            text: {
                en: "How are elements classified?",
                mr: "मूलद्रव्यांचे वर्गीकरण कसे केले जाते?"
            },
            options: {
                en: ["Into acids, bases, salts", "Into metals, non-metals, metalloids", "Into solids, liquids, gases", "Into atoms and molecules"],
                mr: ["आम्ल, आम्लारी, क्षार", "धातू, अधातू, धातुसदृશ", "घन, द्रव, वायू", "अणू आणि रेणू"]
            },
            correctAnswer: {
                en: "Into metals, non-metals, metalloids",
                mr: "धातू, अधातू, धातुसदृશ"
            }
        },
        {
            id: "Q-172242000000-6",
            text: {
                en: "Which of the following is a metalloid?",
                mr: "खालीलपैकी कोणते धातुसदृश आहे?"
            },
            options: {
                en: ["Silicon", "Gold", "Carbon", "Oxygen"],
                mr: ["सिलिकॉन", "सोने", "कार्बन", "ऑक्सिजन"]
            },
            correctAnswer: {
                en: "Silicon",
                mr: "सिलिकॉन"
            }
        },
        {
            id: "Q-172242000000-7",
            text: {
                en: "What is the smallest unit of an element?",
                mr: "मूलद्रव्याचा सर्वात लहान एकक कोणता आहे?"
            },
            options: {
                en: ["Molecule", "Compound", "Atom", "Mixture"],
                mr: ["रेणू", "संयुग", "अणू", "मिश्रण"]
            },
            correctAnswer: {
                en: "Atom",
                mr: "अणू"
            }
        },
        {
            id: "Q-172242000000-8",
            text: {
                en: "How many types of elements are there based on scientific progress?",
                mr: "वैज्ञानिक प्रगतीनुसार मूलद्रव्यांचे किती प्रकार आहेत?"
            },
            options: {
                en: ["Two", "Three", "Four", "Five"],
                mr: ["दोन", "तीन", "चार", "पाच"]
            },
            correctAnswer: {
                en: "Three",
                mr: "तीन"
            }
        },
        {
            id: "Q-172242000000-9",
            text: {
                en: "What is the main difference between a compound and a mixture?",
                mr: "संयुग आणि मिश्रण यांच्यात मुख्य फरक काय आहे?"
            },
            options: {
                en: ["Color", "State", "Fixed composition by mass", "Smell"],
                mr: ["रंग", "अवस्था", "वस्तुमानानुसार निश्चित रचना", " वास"]
            },
            correctAnswer: {
                en: "Fixed composition by mass",
                mr: "वस्तुमानानुसार निश्चित रचना"
            }
        },
        {
            id: "Q-172242000000-10",
            text: {
                en: "Which of these is not a property of metals?",
                mr: "खालीलपैकी कोणता धातूंचा गुणधर्म नाही?"
            },
            options: {
                en: ["Lustrous", "Malleable", "Poor conductor of heat", "Ductile"],
                mr: ["चकाकी", "वर्धनीयता", "उष्णतेचे दुर्वाहक", "तन्यता"]
            },
            correctAnswer: {
                en: "Poor conductor of heat",
                mr: "उष्णतेचे दुर्वाहक"
            }
        },
        {
            id: "Q-172242000000-11",
            text: {
                en: "What is the symbol for the element Gold?",
                mr: "सोन्याच्या मूलद्रव्याचे चिन्ह काय आहे?"
            },
            options: {
                en: ["Go", "Ag", "Au", "Gd"],
                mr: ["Go", "Ag", "Au", "Gd"]
            },
            correctAnswer: {
                en: "Au",
                mr: "Au"
            }
        },
        {
            id: "Q-172242000000-12",
            text: {
                en: "Which non-metal is lustrous?",
                mr: "कोणता अधातू चकाकी असलेला आहे?"
            },
            options: {
                en: ["Sulphur", "Oxygen", "Nitrogen", "Iodine"],
                mr: ["गंधक", "ऑक्सिजन", "नायट्रोजन", "आयोडीन"]
            },
            correctAnswer: {
                en: "Iodine",
                mr: "आयोडीन"
            }
        },
        {
            id: "Q-172242000000-13",
            text: {
                en: "What is formed when two or more elements combine chemically?",
                mr: "दोन किंवा अधिक मूलद्रव्ये रासायनिकरित्या एकत्र आल्यावर काय तयार होते?"
            },
            options: {
                en: ["Mixture", "Compound", "Element", "Solution"],
                mr: ["मिश्रण", "संयुग", "मूलद्रव्य", "द्रावण"]
            },
            correctAnswer: {
                en: "Compound",
                mr: "संयुग"
            }
        },
        {
            id: "Q-172242000000-14",
            text: {
                en: "What is the process of separating components of a mixture called?",
                mr: "मिश्रणातील घटक वेगळे करण्याच्या प्रक्रियेला काय म्हणतात?"
            },
            options: {
                en: ["Reaction", "Combination", "Separation", "Decomposition"],
                mr: ["अभिक्रिया", "संयोग", "विभक्तीकरण", "विघटन"]
            },
            correctAnswer: {
                en: "Separation",
                mr: "विभक्तीकरण"
            }
        },
        {
            id: "Q-172242000000-15",
            text: {
                en: "Which scientist defined element as a basic form of matter?",
                mr: "कोणत्या शास्त्रज्ञाने मूलद्रव्याची व्याख्या पदार्थाचे मूलभूत स्वरूप म्हणून केली?"
            },
            options: {
                en: ["Newton", "Lavoisier", "Dalton", "Boyle"],
                mr: ["न्यूटन", "लॅव्हाझियर", "डाल्टन", "बॉयल"]
            },
            correctAnswer: {
                en: "Lavoisier",
                mr: "लॅव्हाझियर"
            }
        },
        {
            id: "Q-172242000000-16",
            text: {
                en: "Which of the following is a characteristic of a mixture?",
                mr: "खालीलपैकी कोणते मिश्रणाचे वैशिष्ट्य आहे?"
            },
            options: {
                en: ["Fixed boiling point", "Components retain their properties", "New substance is formed", "Energy is always released"],
                mr: ["निश्चित उत्कलनांक", "घटक त्यांचे गुणधर्म टिकवून ठेवतात", "नवीन पदार्थ तयार होतो", "ऊर्जा नेहमी बाहेर पडते"]
            },
            correctAnswer: {
                en: "Components retain their properties",
                mr: "घटक त्यांचे गुणधर्म टिकवून ठेवतात"
            }
        },
        {
            id: "Q-172242000000-17",
            text: {
                en: "How many elements are known at present?",
                mr: "सध्या किती मूलद्रव्ये ज्ञात आहेत?"
            },
            options: {
                en: ["92", "100", "118", "120"],
                mr: ["92", "100", "118", "120"]
            },
            correctAnswer: {
                en: "118",
                mr: "118"
            }
        },
        {
            id: "Q-172242000000-18",
            text: {
                en: "Which element is a liquid at room temperature?",
                mr: "कोणते मूलद्रव्य खोलीच्या तापमानावर द्रव असते?"
            },
            options: {
                en: ["Bromine", "Chlorine", "Iodine", "Fluorine"],
                mr: ["ब्रोमिन", "क्लोरिन", "आયોडीन", "फ्लोरिन"]
            },
            correctAnswer: {
                en: "Bromine",
                mr: "ब्रोमिन"
            }
        },
        {
            id: "Q-172242000000-19",
            text: {
                en: "What type of elements are Germanium and Arsenic?",
                mr: "जर्मेनियम आणि आर्सेनिक कोणत्या प्रकारचे मूलद्रव्य आहेत?"
            },
            options: {
                en: ["Metals", "Non-metals", "Metalloids", "Noble gases"],
                mr: ["धातू", "अधातू", "धातुसदृश", "उदात्त वायू"]
            },
            correctAnswer: {
                en: "Metalloids",
                mr: "धातुसदृश"
            }
        },
        {
            id: "Q-172242000000-20",
            text: {
                en: "What is a molecule?",
                mr: "रेणू म्हणजे काय?"
            },
            options: {
                en: ["The smallest particle of an element", "A group of atoms bonded together", "A mixture of atoms", "A single atom"],
                mr: ["मूलद्रव्याचा सर्वात लहान कण", "एकत्र बांधलेल्या अणूंचा समूह", "अणूंचे मिश्रण", "एकच अणू"]
            },
            correctAnswer: {
                en: "A group of atoms bonded together",
                mr: "एकत्र बांधलेल्या अणूंचा समूह"
            }
        },
        {
            id: "Q-172242000000-21",
            text: {
                en: "Which of these shows the properties of both metals and non-metals?",
                mr: "खालीलपैकी कोणते धातू आणि अधातू दोन्हींचे गुणधर्म दर्शवते?"
            },
            options: {
                en: ["Metals", "Non-metals", "Metalloids", "Compounds"],
                mr: ["धातू", "अधातू", "धातुसदृश", "संयुगे"]
            },
            correctAnswer: {
                en: "Metalloids",
                mr: "धातुसदृश"
            }
        },
        {
            id: "Q-172242000000-22",
            text: {
                en: "Which statement about compounds is false?",
                mr: "संयुगांबद्दल कोणते विधान चुकीचे आहे?"
            },
            options: {
                en: ["They have a fixed composition", "They can be separated by physical means", "Their properties are different from their elements", "Energy is involved in their formation"],
                mr: ["त्यांची रचना निश्चित असते", "त्यांना भौतिक मार्गांनी वेगळे केले जाऊ शकते", "त्यांचे गुणधर्म त्यांच्या मूलद्रव्यांपेक्षा वेगळे असतात", "त्यांच्या निर्मितीमध्ये ऊर्जा सामील असते"]
            },
            correctAnswer: {
                en: "They can be separated by physical means",
                mr: "त्यांना भौतिक मार्गांनी वेगळे केले जाऊ शकते"
            }
        },
        {
            id: "Q-172242000000-23",
            text: {
                en: "What is an example of a heterogeneous mixture?",
                mr: "विषमांगी मिश्रणाचे उदाहरण काय आहे?"
            },
            options: {
                en: ["Salt solution", "Air", "Sand and water", "Brass"],
                mr: ["मीठाचे द्रावण", "हवा", "वाळू आणि पाणी", "पितळ"]
            },
            correctAnswer: {
                en: "Sand and water",
                mr: "वाळू आणि पाणी"
            }
        },
        {
            id: "Q-172242000000-24",
            text: {
                en: "Which non-metal is a good conductor of electricity?",
                mr: "कोणता अधातू विजेचा चांगला वाहक आहे?"
            },
            options: {
                en: ["Graphite", "Sulphur", "Phosphorus", "Silicon"],
                mr: ["ग्रॅफाइट", "गंधक", "फॉस्फरस", "सिलिकॉन"]
            },
            correctAnswer: {
                en: "Graphite",
                mr: "ग्रॅफाइट"
            }
        },
        {
            id: "Q-172242000000-25",
            text: {
                en: "In a chemical reaction, what happens to the total mass?",
                mr: "रासायनिक अभिक्रियेमध्ये एकूण वस्तुमानाचे काय होते?"
            },
            options: {
                en: ["Increases", "Decreases", "Remains constant", "Becomes zero"],
                mr: ["वाढते", "कमी होते", "स्थिर राहते", "शून्य होते"]
            },
            correctAnswer: {
                en: "Remains constant",
                mr: "स्थिर राहते"
            }
        },
        {
            id: "Q-172242000000-26",
            text: {
                en: "What kind of change is the digestion of food?",
                mr: "अन्न पचन हा कोणत्या प्रकारचा बदल आहे?"
            },
            options: {
                en: ["Physical change", "Chemical change", "Reversible change", "No change"],
                mr: ["भौतिक बदल", "रासायनिक बदल", "उलटणारा बदल", "बदल नाही"]
            },
            correctAnswer: {
                en: "Chemical change",
                mr: "रासायनिक बदल"
            }
        },
        {
            id: "Q-172242000000-27",
            text: {
                en: "Which of the following is a pure substance?",
                mr: "खालीलपैकी कोणता शुद्ध पदार्थ आहे?"
            },
            options: {
                en: ["Soil", "Sugar solution", "Iron", "Sea water"],
                mr: ["माती", "साखरेचे द्रावण", "लोह", "समुद्राचे पाणी"]
            },
            correctAnswer: {
                en: "Iron",
                mr: "लोह"
            }
        },
        {
            id: "Q-172242000000-28",
            text: {
                en: "The components of a ______ can be separated by physical methods.",
                mr: "______ चे घटक भौतिक पद्धतींनी वेगळे केले जाऊ शकतात."
            },
            options: {
                en: ["Compound", "Element", "Mixture", "Molecule"],
                mr: ["संयुग", "मूलद्रव्य", "मिश्रण", "रेणू"]
            },
            correctAnswer: {
                en: "Mixture",
                mr: "मिश्रण"
            }
        },
        {
            id: "Q-172242000000-29",
            text: {
                en: "Which of the following is sonorous?",
                mr: "खालीलपैकी कोणता नादमय आहे?"
            },
            options: {
                en: ["Wood", "Plastic", "Iron", "Rubber"],
                mr: ["लाकूड", "प्लास्टिक", "लोह", "रबर"]
            },
            correctAnswer: {
                en: "Iron",
                mr: "लोह"
            }
        },
        {
            id: "Q-172242000000-30",
            text: {
                en: "What is the state of most non-metals at room temperature?",
                mr: "खोलीच्या तापमानावर बहुतेक अधातूंची अवस्था काय असते?"
            },
            options: {
                en: ["Solid or Gas", "Liquid only", "Solid only", "Gas only"],
                mr: ["घन किंवा वायू", "फक्त द्रव", "फक्त घन", "फक्त वायू"]
            },
            correctAnswer: {
                en: "Solid or Gas",
                mr: "घन किंवा वायू"
            }
        },
        {
            id: "Q-172242000000-31",
            text: {
                en: "What is the chemical formula for water?",
                mr: "पाण्याचे रासायनिक सूत्र काय आहे?"
            },
            options: {
                en: ["HO2", "H2O", "H2O2", "HO"],
                mr: ["HO2", "H2O", "H2O2", "HO"]
            },
            correctAnswer: {
                en: "H2O",
                mr: "H2O"
            }
        },
        {
            id: "Q-172242000000-32",
            text: {
                en: "Brass is a mixture of which two metals?",
                mr: "पितळ हे कोणत्या दोन धातूंचे मिश्रण आहे?"
            },
            options: {
                en: ["Copper and Zinc", "Copper and Tin", "Iron and Carbon", "Aluminum and Magnesium"],
                mr: ["तांबे आणि जस्त", "तांबे आणि कथील", "लोह आणि कार्बन", "ऍल्युमिनियम आणि मॅग्नेशियम"]
            },
            correctAnswer: {
                en: "Copper and Zinc",
                mr: "तांबे आणि जस्त"
            }
        },
        {
            id: "Q-172242000000-33",
            text: {
                en: "Which separation technique is used to separate salt from water?",
                mr: "पाण्यातून मीठ वेगळे करण्यासाठी कोणते विभक्तीकरण तंत्र वापरले जाते?"
            },
            options: {
                en: ["Filtration", "Evaporation", "Decantation", "Centrifugation"],
                mr: ["गाळणे", "बाष्पीभवन", "निवळणे", "अपकेंद्रोत्सारण"]
            },
            correctAnswer: {
                en: "Evaporation",
                mr: "बाष्पीभवन"
            }
        },
        {
            id: "Q-172242000000-34",
            text: {
                en: "How many naturally occurring elements are there?",
                mr: "नैसर्गिकरित्या आढळणारे किती मूलद्रव्ये आहेत?"
            },
            options: {
                en: ["About 92", "About 100", "About 118", "About 80"],
                mr: ["सुमारे 92", "सुमारे 100", "सुमारे 118", "सुमारे 80"]
            },
            correctAnswer: {
                en: "About 92",
                mr: "सुमारे 92"
            }
        },
        {
            id: "Q-172242000000-35",
            text: {
                en: "Which property allows metals to be drawn into thin wires?",
                mr: "कोणत्या गुणधर्मामुळे धातूंना पातळ तारांमध्ये खेचता येते?"
            },
            options: {
                en: ["Malleability", "Ductility", "Sonority", "Lustre"],
                mr: ["वर्धनीयता", "तन्यता", "नादमयता", "चकाकी"]
            },
            correctAnswer: {
                en: "Ductility",
                mr: "तन्यता"
            }
        },
        {
            id: "Q-172242000000-36",
            text: {
                en: "What is a substance made up of only one kind of particle called?",
                mr: "एकाच प्रकारच्या कणांपासून बनलेल्या पदार्थाला काय म्हणतात?"
            },
            options: {
                en: ["Mixture", "Compound", "Pure substance", "Solution"],
                mr: ["मिश्रण", "संयुग", "शुद्ध पदार्थ", "द्रावण"]
            },
            correctAnswer: {
                en: "Pure substance",
                mr: "शुद्ध पदार्थ"
            }
        },
        {
            id: "Q-172242000000-37",
            text: {
                en: "Which of the following does not show the Tyndall effect?",
                mr: "खालीलपैकी कोणते टिंडल परिणाम दर्शवत नाही?"
            },
            options: {
                en: ["Milk", "Starch solution", "Salt solution", "Smoke"],
                mr: ["दूध", "स्टार्चचे द्रावण", "मीठाचे द्रावण", "धूर"]
            },
            correctAnswer: {
                en: "Salt solution",
                mr: "मीठाचे द्रावण"
            }
        },
        {
            id: "Q-172242000000-38",
            text: {
                en: "What are the components of a solution?",
                mr: "द्रावणाचे घटक कोणते आहेत?"
            },
            options: {
                en: ["Solute and Solvent", "Acid and Base", "Metal and Non-metal", "Element and Compound"],
                mr: ["द्राव्य आणि द्रावक", "आम्ल आणि आम्लारी", "धातू आणि अधातू", "मूलद्रव्य आणि संयुग"]
            },
            correctAnswer: {
                en: "Solute and Solvent",
                mr: "द्राव्य आणि द्रावक"
            }
        },
        {
            id: "Q-172242000000-39",
            text: {
                en: "What is an alloy?",
                mr: "मिश्रधातू म्हणजे काय?"
            },
            options: {
                en: ["A compound of metals", "A heterogeneous mixture", "A homogeneous mixture of metals", "A non-metal"],
                mr: ["धातूंचे संयुग", "विषमांगी मिश्रण", "धातूंचे एकजीव मिश्रण", "अधातू"]
            },
            correctAnswer: {
                en: "A homogeneous mixture of metals",
                mr: "धातूंचे एकजीव मिश्रण"
            }
        },
        {
            id: "Q-172242000000-40",
            text: {
                en: "The particles of which of these are visible to the naked eye?",
                mr: "खालीलपैकी कशाचे कण उघड्या डोळ्यांनी दिसतात?"
            },
            options: {
                en: ["Solution", "Colloid", "Suspension", "Compound"],
                mr: ["द्रावण", "कलिल", "निलंबन", "संयुग"]
            },
            correctAnswer: {
                en: "Suspension",
                mr: "निलंबन"
            }
        },
        {
            id: "Q-172242000000-41",
            text: {
                en: "Burning of coal is what type of change?",
                mr: "कोळशाचे ज्वलन कोणत्या प्रकारचा बदल आहे?"
            },
            options: {
                en: ["Physical change", "Chemical change", "Both physical and chemical", "No change"],
                mr: ["भौतिक बदल", "रासायनिक बदल", "भौतिक आणि रासायनिक दोन्ही", "बदल नाही"]
            },
            correctAnswer: {
                en: "Chemical change",
                mr: "रासायनिक बदल"
            }
        },
        {
            id: "Q-172242000000-42",
            text: {
                en: "Which is the most abundant element in the universe?",
                mr: "विश्वातील सर्वात विपुल मूलद्रव्य कोणते आहे?"
            },
            options: {
                en: ["Oxygen", "Hydrogen", "Carbon", "Silicon"],
                mr: ["ऑक्सिजन", "हायड्रोजन", "कार्बन", "सिलिकॉन"]
            },
            correctAnswer: {
                en: "Hydrogen",
                mr: "हायड्रोजन"
            }
        },
        {
            id: "Q-172242000000-43",
            text: {
                en: "Which element has the symbol 'K'?",
                mr: "'K' हे चिन्ह कोणत्या मूलद्रव्याचे आहे?"
            },
            options: {
                en: ["Phosphorus", "Potassium", "Krypton", "Calcium"],
                mr: ["फॉस्फरस", "पोटॅशियम", "क्रिप्टॉन", "कॅल्शियम"]
            },
            correctAnswer: {
                en: "Potassium",
                mr: "पोटॅशियम"
            }
        },
        {
            id: "Q-172242000000-44",
            text: {
                en: "What is the result of a chemical change?",
                mr: "रासायनिक बदलाचा परिणाम काय असतो?"
            },
            options: {
                en: ["Change in appearance only", "Formation of one or more new substances", "Change in state only", "Change in temperature only"],
                mr: ["फक्त स्वरूपात बदल", "एक किंवा अधिक नवीन पदार्थांची निर्मिती", "फक्त अवस्थेत बदल", "फक्त तापमानात बदल"]
            },
            correctAnswer: {
                en: "Formation of one or more new substances",
                mr: "एक किंवा अधिक नवीन पदार्थांची निर्मिती"
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




