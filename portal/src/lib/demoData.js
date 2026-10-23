// Demo data for the first stage. Every name, email and number here is made up.
// In stage 2 this file is replaced by real rows in Supabase.
// Dates are relative to "now" so the demo always looks current.

import { DAY, ymd } from './dates';

const at = (offsetDays, h = 17, m = 30) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return new Date(d.getTime() + offsetDays * DAY).toISOString();
};
const day = (offsetDays) => ymd(new Date(Date.now() + offsetDays * DAY));

export const DEMO_PASSWORD = 'osmic123';

export function createSeed() {
  const now = Date.now();

  const users = [
    { id: 'u0', name: 'OSMIC Admin', email: 'admin@osmic.club', roll: 'ADMIN', mobile: '9000000000', whatsapp: '9000000000', role: 'admin', leadId: null, active: true, joinedAt: at(-30) },
    { id: 'u1', name: 'Rahul Nair', email: 'rahul@am.students.amrita.edu', roll: 'AM.EN.U4AID24011', mobile: '9000000101', whatsapp: '9000000101', role: 'lead', leadId: null, active: true, joinedAt: at(-30) },
    { id: 'u2', name: 'Fathima Rasheed', email: 'fathima@am.students.amrita.edu', roll: 'AM.EN.U4AID24026', mobile: '9000000102', whatsapp: '9000000102', role: 'lead', leadId: null, active: true, joinedAt: at(-30) },
    { id: 'u3', name: 'Ananya Menon', email: 'ananya@am.students.amrita.edu', roll: 'AM.EN.U4AID24003', mobile: '9000000103', whatsapp: '9000000103', role: 'member', leadId: 'u1', active: true, joinedAt: at(-20) },
    { id: 'u4', name: 'Sneha Thomas', email: 'sneha@am.students.amrita.edu', roll: 'AM.EN.U4AID24017', mobile: '9000000104', whatsapp: '9000000104', role: 'member', leadId: 'u1', active: true, joinedAt: at(-20) },
    { id: 'u5', name: 'Arjun Pillai', email: 'arjun@am.students.amrita.edu', roll: 'AM.EN.U4AID24021', mobile: '9000000105', whatsapp: '9000000105', role: 'member', leadId: 'u1', active: true, joinedAt: at(-20) },
    { id: 'u6', name: 'Gokul Krishnan', email: 'gokul@am.students.amrita.edu', roll: 'AM.EN.U4AID24030', mobile: '9000000106', whatsapp: '9000000106', role: 'member', leadId: 'u2', active: true, joinedAt: at(-20) },
    { id: 'u7', name: 'Meera Joseph', email: 'meera@am.students.amrita.edu', roll: 'AM.EN.U4AID24034', mobile: '9000000107', whatsapp: '9000000107', role: 'member', leadId: 'u2', active: true, joinedAt: at(-20) },
    { id: 'u8', name: 'Vishnu Das', email: 'vishnu@am.students.amrita.edu', roll: 'AM.EN.U4AID24039', mobile: '9000000108', whatsapp: '9000000108', role: 'member', leadId: 'u2', active: true, joinedAt: at(-20) },
    { id: 'u9', name: 'Divya Mohan', email: 'divya@am.students.amrita.edu', roll: 'AM.EN.U4AID24042', mobile: '9000000109', whatsapp: '9000000109', role: 'member', leadId: null, active: true, joinedAt: at(-6) },
  ];

  const sessions = [
    { id: 's1', title: 'Club kick-off', startedAt: at(-11), code: 'A7K2PQ', closedAt: at(-11, 18, 0), expiresAt: at(-11, 17, 45) },
    { id: 's2', title: 'Linux basics', startedAt: at(-7), code: 'M3TR8A', closedAt: at(-7, 18, 0), expiresAt: at(-7, 17, 45) },
    { id: 's3', title: 'Python bootcamp', startedAt: at(-4), code: 'Z9QW4D', closedAt: at(-4, 18, 0), expiresAt: at(-4, 17, 45) },
    { id: 's4', title: 'Git & GitHub workshop', startedAt: new Date(now - 4 * 60000).toISOString(), code: 'K7P2QX', closedAt: null, expiresAt: new Date(now + 15 * 60000).toISOString() },
  ];

  // [sessionId, userId, status]
  const marks = [
    ['s1', 'u1', 'verified'], ['s1', 'u2', 'verified'], ['s1', 'u3', 'verified'], ['s1', 'u4', 'verified'], ['s1', 'u5', 'verified'], ['s1', 'u6', 'verified'], ['s1', 'u7', 'verified'], ['s1', 'u8', 'verified'],
    ['s2', 'u1', 'verified'], ['s2', 'u2', 'verified'], ['s2', 'u3', 'verified'], ['s2', 'u4', 'verified'], ['s2', 'u7', 'verified'], ['s2', 'u8', 'rejected'],
    ['s3', 'u1', 'verified'], ['s3', 'u2', 'verified'], ['s3', 'u3', 'verified'], ['s3', 'u5', 'verified'], ['s3', 'u7', 'verified'], ['s3', 'u8', 'verified'], ['s3', 'u9', 'verified'],
    ['s4', 'u7', 'verified'], ['s4', 'u5', 'pending'], ['s4', 'u4', 'verified'], ['s4', 'u6', 'pending'], ['s4', 'u8', 'pending'],
  ];
  const attendance = marks.map(([sessionId, userId, status], i) => {
    const s = sessions.find((x) => x.id === sessionId);
    return { id: `a${i}`, sessionId, userId, status, markedAt: new Date(new Date(s.startedAt).getTime() + (2 + i % 9) * 60000).toISOString() };
  });

  const everyone = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'];
  const tasks = [
    { id: 't1', title: 'Git basics worksheet', description: 'Answer the 10 questions on branching and merging. Upload a PDF.', deadline: day(-5), assignees: everyone, createdBy: 'u0', createdAt: at(-10) },
    { id: 't2', title: 'Build a REST API with Flask', description: 'Create three endpoints (list, add, delete) and push the code to GitHub. Share the repo link.', deadline: day(6), assignees: [...everyone, 'u9'], createdBy: 'u0', createdAt: at(-3) },
    { id: 't3', title: 'Design the hackathon poster', description: 'An A4 poster for the OSMIC hackathon using the club colours. Upload a PNG or PDF.', deadline: day(10), assignees: ['u3', 'u7', 'u2'], createdBy: 'u0', createdAt: at(-2) },
    { id: 't4', title: 'Linux command challenge', description: 'Solve the 15 terminal puzzles from the Linux session and paste your answers in a doc.', deadline: day(3), assignees: ['u3', 'u4', 'u5'], createdBy: 'u1', createdAt: at(-1) },
  ];

  // [taskId, userId, verdict, link-or-file, comment]
  const subRows = [
    ['t1', 'u1', 'pass', 'rahul_git.pdf', ''], ['t1', 'u2', 'pass', 'fathima_git.pdf', ''],
    ['t1', 'u3', 'pass', 'ananya_git_worksheet.pdf', 'Clear answers on merging. Well done.'],
    ['t1', 'u4', 'pass', 'sneha_git.pdf', ''], ['t1', 'u5', 'pass', 'arjun_git.pdf', ''],
    ['t1', 'u6', 'pending', 'gokul_git.pdf', ''], ['t1', 'u7', 'pass', 'meera_git.pdf', 'Neat and complete.'],
    ['t1', 'u8', 'fail', 'vishnu_git.pdf', 'Questions 6 to 10 are missing. Please redo them.'],
    ['t2', 'u5', 'pending', 'https://github.com/arjun-demo/flask-api', ''],
    ['t2', 'u7', 'pending', 'meera_flask_api.zip', ''],
    ['t4', 'u4', 'pending', 'https://docs.google.com/document/d/demo-sneha', ''],
  ];
  const submissions = subRows.map(([taskId, userId, verdict, work, comment], i) => {
    const isLink = work.startsWith('http');
    return {
      id: `sub${i}`, taskId, userId, verdict, comment,
      link: isLink ? work : '', fileName: isLink ? '' : work, note: '',
      submittedAt: at(taskId === 't1' ? -6 : -1, 14 + (i % 6), 10),
      reviewedBy: verdict === 'pending' ? null : 'u0',
    };
  });

  const leaves = [
    { id: 'l1', userId: 'u6', from: day(2), to: day(3), reason: 'Family function at home', status: 'pending', note: '', appliedAt: at(-1, 10) },
    { id: 'l2', userId: 'u4', from: day(7), to: day(7), reason: 'Hospital appointment', status: 'pending', note: '', appliedAt: at(0, 9) },
    { id: 'l3', userId: 'u5', from: day(-7), to: day(-7), reason: 'Internal exam', status: 'approved', note: 'All the best!', appliedAt: at(-9, 11) },
    { id: 'l4', userId: 'u3', from: day(-15), to: day(-15), reason: 'College fest volunteering', status: 'approved', note: '', appliedAt: at(-17, 12) },
  ];

  const announcements = [
    { id: 'n1', title: 'Git & GitHub workshop today', message: 'Lab 3 at 5:30 PM. Bring your laptop with Git installed. The attendance code will be shown on the screen.', postedAt: at(0, 9), by: 'u0', emailed: true },
    { id: 'n2', title: 'Hackathon team sign-ups are open', message: 'Form teams of 3 to 4 and register with your club lead before the end of the month.', postedAt: at(-2, 12), by: 'u0', emailed: true },
    { id: 'n3', title: 'Welcome to the OSMIC portal', message: 'Mark attendance, submit tasks and apply for leave here. Questions? Ask your club lead.', postedAt: at(-12, 10), by: 'u0', emailed: false },
  ];

  const applications = [
    { id: 'p1', name: 'Devika Suresh', roll: 'AM.EN.U4AID24045', email: 'devika@am.students.amrita.edu', mobile: '9000000201', whatsapp: '9000000201', photo: null, status: 'pending', leadId: '', appliedAt: at(-1, 20) },
    { id: 'p2', name: 'Adithya Raj', roll: 'AM.EN.U4CSE24112', email: 'adithya@am.students.amrita.edu', mobile: '9000000202', whatsapp: '9000000203', photo: null, status: 'pending', leadId: '', appliedAt: at(-1, 16) },
    { id: 'p3', name: 'Nikhil Varghese', roll: 'AM.EN.U4ECE24031', email: 'nikhil@am.students.amrita.edu', mobile: '9000000204', whatsapp: '9000000204', photo: null, status: 'pending', leadId: '', appliedAt: at(-2, 11) },
  ];

  const notifications = [
    { id: 'm1', userId: 'u3', text: 'New task from Rahul Nair: Linux command challenge', at: at(-1, 18), read: false, link: '/member/tasks' },
    { id: 'm2', userId: 'u3', text: 'New task: Design the hackathon poster', at: at(-2, 12), read: false, link: '/member/tasks' },
    { id: 'm3', userId: 'u3', text: 'Your Git basics worksheet was marked Pass', at: at(-5, 19), read: true, link: '/member/tasks' },
    { id: 'm4', userId: 'u3', text: 'Attendance verified for Python bootcamp', at: at(-4, 18), read: true, link: '/member/attendance' },
  ];

  return {
    version: 1,
    session: null,
    users, sessions, attendance, tasks, submissions, leaves, announcements, applications, notifications,
    outbox: [],
  };
}
