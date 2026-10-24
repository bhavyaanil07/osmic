/*
  ============================================================
  OSMIC WEBSITE CONTENT
  ------------------------------------------------------------
  Edit ONLY the text inside the quotes "like this".
  Keep every comma and bracket. Save, then refresh the browser.
  ============================================================
*/

window.OSMIC = {

  club: {
    name: "OSMIC",
    fullName: "",              // full form of OSMIC; leave "" to hide this line
    tagline: "From Ideas to Impact.",
    intro: "OSMIC is a student-driven innovation club born from the desire to create something meaningful for Amma’s birthday. Rooted in sustainability, engineering, and social responsibility, we bring ideas to life through practical, multidisciplinary projects that address real-world challenges.",
    founded: "2026",
    institution: "Amrita Vishwa Vidyapeetham, Amritapuri",
    portalUrl: "portal/",   // the OSMIC member portal, in the portal/ folder of this same site
    email: "osmic.club@example.com",
    instagram: "",
    linkedin: "",
    github: ""
  },

  // Background photos. Use your own by putting a photo in the images
  // folder and writing its name, for example: hero: "images/hero.jpg"
  photos: {
    hero: "https://unsplash.com/photos/Cu8UUstD-HA/download?w=2000",
    join: "https://unsplash.com/photos/astOH0KB9IM/download?w=2000"
  },

  // Words that scroll in the moving strip under the opening screen
  domains: ["Environmental Sustainability", "Robotics", "Smart Navigation", "Human–Robot Interaction", "Biometrics", "Election Security", "Embedded Systems"],

  story: {
    "headline": "OSMIC began with a purpose: to build something meaningful for Amma’s birthday.",
    "about": [
      "OSMIC is a student-driven innovation club born from the desire to create something meaningful for Amma’s birthday. Rooted in sustainability, engineering, and social responsibility, we bring ideas to life through practical, multidisciplinary projects that address real-world challenges.",
      "Our current initiatives span three key areas: Jalanetra, a floating robot for aquatic waste collection; WhereAmI, an indoor navigation and interactive information system for our college; and BIVS, a biometric voter-verification concept designed to help reduce duplicate voting.",
      "At OSMIC, we believe innovation is not just about what we build, but why we build it. We aim to create technology that serves people, protects the planet, and inspires others to turn their ideas into meaningful action."
    ],
    "beginning": [
      "When we received the opportunity to create something for Mata Amritanandamayi Devi (Amma), we came together as a team with a shared desire to make a difference. What began as an initiative to build something special soon grew into a larger vision of using technology, creativity, and teamwork to address real-world challenges.",
      "Our first project was born from a simple but powerful idea: what if waste could be transformed into something that helps protect our environment?",
      "Using upcycled waste materials, we began developing a robotic system designed to collect waste from rivers and other water bodies. This project introduced us to the possibilities of sustainable engineering and showed us that innovation doesn’t always require more resources; sometimes, it begins by reimagining what we already have.",
      "That first initiative laid the foundation for OSMIC.",
      "Today, OSMIC is growing into a multidisciplinary innovation club that brings together students passionate about building purposeful technology. From environmental conservation and intelligent navigation to election security, our projects explore how engineering can address challenges that affect people, communities, and the world around us.",
      "What started as one team coming together to build something meaningful is becoming a community driven by curiosity, collaboration, sustainability, and the belief that technology should serve a greater purpose."
    ],
    "vision": "To build a future where technology and innovation create meaningful, sustainable, and inclusive solutions for society and the planet.",
    "mission": [
      "To empower students to transform ideas into impactful solutions by combining engineering, creativity, and collaboration, with a strong commitment to sustainability, resourcefulness, and social responsibility.",
      "In simple terms, OSMIC’s mission is to bring people together, turn ideas into working innovations, and use engineering to make a difference."
    ],
    "different": [
      {
        "title": "Sustainability by design",
        "text": "We look for ways to reduce waste, reuse resources, and create solutions that respect the environment."
      },
      {
        "title": "Purpose-driven innovation",
        "text": "Every project begins with a real problem and a desire to make a meaningful difference."
      },
      {
        "title": "Collaborative creation",
        "text": "We bring together different skills, perspectives, and ideas to turn concepts into working systems."
      },
      {
        "title": "Learning by building",
        "text": "We experiment, prototype, fail, improve, and learn by creating solutions that go beyond the classroom."
      }
    ]
  },

  projectsIntro: "Three projects. Three different challenges. One shared purpose.",

  // PROJECTS
  // status must be exactly: "Idea", "In Progress" or "Completed"
  // PHOTOS: put them in images/projects/ named after the project, small letters:
  //   one photo:    jalanetra.jpg
  //   a slideshow:  jalanetra-1.jpg, jalanetra-2.jpg, jalanetra-3.jpg ... (up to 8)
  //   (whereami-1.jpg, bivs-1.jpg and so on for the others)
  //   They appear automatically. No photos = the automatic design.
  projects: [
    {
      "title": "Jalanetra",
      "focus": [
        "Environmental Sustainability",
        "Robotics"
      ],
      "description": [
        "Jalanetra is a floating robotic system designed to navigate water bodies and collect floating waste, helping address water pollution through sustainable engineering.",
        "A key part of the project is the use of upcycled waste materials, demonstrating how discarded resources can be repurposed to create practical environmental solutions."
      ],
      "coreIdea": "Technology that helps protect our water bodies.",
      "note": "",
      "status": "In Progress",
      "team": [],
      "github": "",
      "image": ""
    },
    {
      "title": "WhereAmI",
      "focus": [
        "Smart Navigation",
        "Human–Robot Interaction"
      ],
      "description": [
        "WhereAmI is an indoor navigation and information system designed to help people locate classrooms, laboratories, and other rooms within the college.",
        "Beyond navigation, the system aims to serve as an interactive platform that shares information about Amma’s life, teachings, and contributions."
      ],
      "coreIdea": "Making spaces easier to navigate and knowledge easier to access.",
      "note": "",
      "status": "In Progress",
      "team": [],
      "github": "",
      "image": ""
    },
    {
      "title": "BIVS",
      "focus": [
        "Biometrics",
        "Election Security",
        "Embedded Systems"
      ],
      "description": [
        "BIVS is a proposed biometric voter-verification system that uses fingerprint scanning to help prevent repeat voting. It also aims to automate the application of indelible ink after successful verification.",
        "By integrating verification and marking into one system, the project seeks to improve polling-booth efficiency, reduce manual workload, and strengthen safeguards against duplicate voting."
      ],
      "coreIdea": "Exploring technology for more secure and efficient elections.",
      "note": "BIVS is designed to help reduce duplicate voting; fingerprint verification alone does not guarantee election security. Any real-world deployment would require privacy protections, accessibility safeguards, and validation within India’s election procedures.",
      "status": "In Progress",
      "team": [],
      "github": "",
      "image": ""
    }
  ],

  // OUR CHANCELLOR (shown first in the Team section)
  // photo: put it in images/team/ named amma.jpg and it appears automatically
  chancellor: {
    title: "Our Chancellor",
    name: "Mata Amritanandamayi Devi (Amma)",
    message: "We reached here due to the blessing of Amma.",
    photo: ""
  },

  // SPECIAL THANKS (shown after Our Chancellor)
  // photo: the photo's name inside images/team/ (without .jpg), small letters
  thanks: {
    title: "Special thanks",
    message: "They helped us to reach here.",
    people: [
      { name: "Dr. Balakrishnan Shankar", role: "Dean, School of Engineering, Amritapuri", photo: "balakrishnan-shankar" },
      { name: "Dr. Remya", role: "Chairperson, Department of Electronics and Communication Engineering", photo: "remya" },
      { name: "Rages Swami", role: "", photo: "rages-swami" },
      { name: "Vishnu", role: "", photo: "vishnu" }
    ]
  },

  // TEAM
  // role must be exactly one of: "Founder", "Co-Founder", "Core", "Member"
  // position: the title on the person's badge, for example "Tech Head" ("" for none)
  // department / year: for example "AI & DS" and "1st year" ("" to hide)
  // PHOTOS: put the photo in images/team/ named after the person, all small
  //   letters with dashes, e.g. images/team/adhish-sudheesh.jpg
  //   (.jpg, .jpeg, .png or .webp all work). It shows up automatically.
  //   No photo? Their initials are shown instead.
  members: [
    { name: "Adhish Sudheesh", role: "Founder", position: "Founder", department: "", year: "", photo: "", linkedin: "", github: "" },

    { name: "Anathesh S", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Arjun Krishna U", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Anurag Vishwanathan", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Athul Samuel", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Hemant Manoj", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Cia N S", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Gopika Gopakumar", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Nirenjana S", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Niranjana Rajesh", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Ameena Husna P", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Advik P", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Gauthami M", role: "Co-Founder", position: "Co-Founder", department: "", year: "", photo: "", linkedin: "", github: "" },

    { name: "Neha Arun", role: "Core", position: "", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Neeraja B Nair", role: "Core", position: "", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Athulya T S", role: "Core", position: "", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Gayathri Sabarinath", role: "Core", position: "", department: "", year: "", photo: "", linkedin: "", github: "" },
    { name: "Sreenandha Santhosh", role: "Core", position: "", department: "", year: "", photo: "", linkedin: "", github: "" }
  ],

  // date must be written as YEAR-MONTH-DAY, for example "2026-11-05"
  events: [
    { title: "OSMIC launch meet", date: "2026-11-05", location: "Seminar Hall", description: "Meet the founders, hear the plan, and find out how to join." },
    { title: "Build your first web app", date: "2026-11-20", location: "Lab 2", description: "A hands-on workshop: make and publish a small web app in one evening." },
    { title: "Founders' brainstorm", date: "2026-10-15", location: "Library", description: "The first meeting where OSMIC took shape." }
  ]
};
