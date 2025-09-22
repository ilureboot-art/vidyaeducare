

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
        id: "Q-172234567890-11",
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
        id: "Q-172234567890-12",
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
        id: "Q-172234567890-13",
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
        id: "Q-172234567890-14",
        text: {
          en: "What is the value of G?",
          mr: "G चे मूल्य किती आहे?"
        },
        options: {
          en: [
            "9.8 m/s²",
            "6.67 × 10⁻¹¹ Nm²/kg²",
            "3 × 10⁸ m/s",
            "1.6 × 10⁻¹⁹ C"
          ],
          mr: [
            "9.8 m/s²",
            "6.67 × 10⁻¹¹ Nm²/kg²",
            "3 × 10⁸ m/s",
            "1.6 × 10⁻¹⁹ C"
          ]
        },
        correctAnswer: {
          en: "6.67 × 10⁻¹¹ Nm²/kg²",
          mr: "6.67 × 10⁻¹¹ Nm²/kg²"
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

