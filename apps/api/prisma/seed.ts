import bcrypt from 'bcryptjs';
import { PrismaClient, CategoryType, Role, PostType, Priority } from '@prisma/client';
import '../src/config.js';

const prisma = new PrismaClient();

const categories = [
  ['Announcements', CategoryType.NOTICE],
  ['Hackathons', CategoryType.DEADLINE],
  ['Workshops', CategoryType.DEADLINE],
  ['Events', CategoryType.DEADLINE],
  ['Exam PDFs', CategoryType.NOTICE],
  ['Lab details', CategoryType.NOTICE],
  ['Exam fees', CategoryType.DEADLINE],
  ['Semester fees', CategoryType.DEADLINE],
  ['Other registrations', CategoryType.DEADLINE],
] as const;

async function main() {
  const categoryRecords: Record<string, string> = {};

  for (const [index, [name, type]] of categories.entries()) {
    let cat = await prisma.category.findFirst({ where: { name } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name, type, sortOrder: index } });
    }
    categoryRecords[name] = cat.id;
  }

  const rollNo = process.env.ADMIN_ROLL_NO ?? 'ADMIN001';
  const password = process.env.ADMIN_PASSWORD ?? 'change-me-to-a-long-password';
  const admin = await prisma.user.upsert({
    where: { rollNo },
    update: { role: Role.ADMIN, active: true },
    create: {
      rollNo,
      name: process.env.ADMIN_NAME ?? 'Campus Admin',
      email: process.env.ADMIN_EMAIL ?? 'admin@example.edu',
      passwordHash: await bcrypt.hash(password, 12),
      role: Role.ADMIN,
      firstLoginRequired: false,
    },
  });

  const now = new Date();
  const tonight = new Date(now.getTime() + 45 * 60 * 1000);
  const tomorrowNoon = new Date(now.getTime() + 13 * 3600 * 1000);
  const tomorrowEve = new Date(now.getTime() + 18 * 3600 * 1000);
  const twoDaysLater = new Date(now.getTime() + 42 * 3600 * 1000);
  const threeDaysLater = new Date(now.getTime() + 66 * 3600 * 1000);

  const realPosts = [
    {
      title: '🚀 Build to Ship Hackathon — Final Code & Link Submission',
      summary: 'Submit your Build to Ship Hackathon project before 11:59 PM sharp! Ensure your demo and GitHub repository links are publicly accessible.',
      categoryName: 'Hackathons',
      type: PostType.DEADLINE,
      source: 'Ankitha Mam Niat',
      link: 'https://challazo.nxtlab.tech/register',
      deadlineAt: tonight,
      pinned: true,
      priority: Priority.CRITICAL,
    },
    {
      title: '📝 University Common LMS Assessment — Problem-Solving Skills',
      summary: 'Mandatory Common Assessment for all B.Tech 2nd Year students scheduled for 7th October. Solve in any programming language of your choice. Contributes to performance leaderboard.',
      categoryName: 'Announcements',
      type: PostType.DEADLINE,
      source: 'Ankitha Mam Niat',
      deadlineAt: tomorrowEve,
      pinned: true,
      priority: Priority.CRITICAL,
    },
    {
      title: '📂 Backend Lab Records — Final Submission Deadline',
      summary: 'All students must submit their complete and properly written backend lab records by 7th October. Ensure all signatures and experiments are intact.',
      categoryName: 'Lab details',
      type: PostType.DEADLINE,
      source: 'Garima Agrawal',
      deadlineAt: tomorrowEve,
      pinned: false,
      priority: Priority.CRITICAL,
    },
    {
      title: '💬 Build to Ship Hackathon — Participant Feedback Form',
      summary: 'All hackathon participants are requested to fill out the official feedback form to share their experience and help improve upcoming events.',
      categoryName: 'Hackathons',
      type: PostType.DEADLINE,
      source: 'Ankitha Mam Niat',
      link: 'https://forms.ccbp.in/bts-hackathon-feedback-form-mrv',
      deadlineAt: tomorrowNoon,
      pinned: false,
      priority: Priority.NORMAL,
    },
    {
      title: '📢 Smart India Hackathon (SIH 2026) — Final 24 Teams Community',
      summary: 'There are 52 shortlisted SIH teams, of which 24 teams are from NIAT. Shortlisted teams and members must join the official WhatsApp community immediately.',
      categoryName: 'Hackathons',
      type: PostType.NOTICE,
      source: 'Ankitha Mam Niat',
      link: 'https://chat.whatsapp.com/LDOX58TIwN7Gx1p6t5uTzu',
      pinned: true,
      priority: Priority.CRITICAL,
    },
    {
      title: '🎯 GRIT Examination Registration — 10th October Slot Booking',
      summary: 'Register for your preferred slot (Slot 1: 9:20 AM, Slot 2: 10:50 AM, Slot 3: 1:00 PM, Slot 4: 2:30 PM). Safe Exam Browser (SEB) verification required beforehand.',
      categoryName: 'Other registrations',
      type: PostType.DEADLINE,
      source: 'Ankitha Mam Niat',
      deadlineAt: twoDaysLater,
      pinned: false,
      priority: Priority.CRITICAL,
    },
    {
      title: '📚 B.Tech II Year Mid-2 Examinations — Question Bank & Solutions',
      summary: 'Access the master Question Bank spreadsheet with complete solutions for DAA, Digital Electronics, Probability & Statistics, and LRAS.',
      categoryName: 'Exam PDFs',
      type: PostType.NOTICE,
      source: 'Success Coach',
      link: 'https://docs.google.com/spreadsheets/d/15v07En1OeI4tMxAO_SkVW5PIwNrdQPqTtArPOoGk9bs/edit?gid=0#gid=0',
      pinned: false,
      priority: Priority.NORMAL,
    },
    {
      title: '💡 Offline Competitive Programming (CP) Training Program',
      summary: 'Level up problem-solving skills for ICPC and top product companies. Fill the interest form for 1:1 mentor selection and offline onboarding.',
      categoryName: 'Workshops',
      type: PostType.DEADLINE,
      source: 'Ankitha Mam Niat',
      link: 'https://docs.google.com/forms/d/e/1FAIpQLSfWePxiURp2dK_NEqpmF0pOZZhTRCh547guB_ZIVIbgOS1VEQ/viewform',
      deadlineAt: threeDaysLater,
      pinned: false,
      priority: Priority.NORMAL,
    },
    {
      title: '🔑 MUDU Student Portal Login Credentials & Guidelines',
      summary: 'Login at https://mrtc.mudu.in/login. Use your Roll Number or registered Email ID as Login ID, and your Roll Number as password.',
      categoryName: 'Announcements',
      type: PostType.NOTICE,
      source: 'Ankitha Mam Niat',
      link: 'https://mrtc.mudu.in/login',
      pinned: false,
      priority: Priority.NORMAL,
    },
    {
      title: '📱 Mandatory QR Attendance via My NIAT App (v53)',
      summary: 'Update the My NIAT App to version 53 from the Play Store/App Store. Ensure your device UUID is linked before entering classrooms to avoid missed attendance.',
      categoryName: 'Announcements',
      type: PostType.NOTICE,
      source: 'Ankitha Mam Niat',
      pinned: false,
      priority: Priority.NORMAL,
    },
    {
      title: '📖 DAA Lab Record — Complete All 14 Experiments',
      summary: 'For the DAA Lab Record, students are required to write all 14 experiments completely and cleanly. Strictly submit on or before the deadline.',
      categoryName: 'Lab details',
      type: PostType.NOTICE,
      source: 'Success Coach',
      pinned: false,
      priority: Priority.NORMAL,
    },
    {
      title: '🌍 Hacktoberfest 2026 — Start Your Open Source Journey',
      summary: 'October is here! Explore beginner-friendly issues, create pull requests, participate in DEV challenges, and build your developer profile.',
      categoryName: 'Workshops',
      type: PostType.NOTICE,
      source: 'Success Coach',
      link: 'https://hacktoberfest.com/schedule/',
      pinned: false,
      priority: Priority.NORMAL,
    },
    {
      title: '🎮 CLUTCH 2026 Hyderabad Esports Tournament — Highlights & Media',
      summary: 'Event photos and tournament videos for Valorant, BGMI, and Free Fire are now available in the shared Google Drive folder.',
      categoryName: 'Events',
      type: PostType.NOTICE,
      source: 'Ankitha Mam Niat',
      link: 'https://drive.google.com/drive/folders/1rfL7wGWZly_Jh_fyo7jIIlDn9v0RSCpT',
      pinned: false,
      priority: Priority.NORMAL,
    },
    {
      title: '💼 Internship Verification — Upload Offer Letter / Certificate',
      summary: 'Students currently doing or who have completed internships must submit proof of completion or offer letter via the verification form.',
      categoryName: 'Other registrations',
      type: PostType.DEADLINE,
      source: 'Ankitha Mam Niat',
      link: 'https://docs.google.com/forms/d/e/1FAIpQLSfMC1nVAHkI3YgfmUKHq8E-qAqqRrQXh3z-NeYhXTa8Ms14Dw/viewform',
      deadlineAt: threeDaysLater,
      pinned: false,
      priority: Priority.NORMAL,
    },
  ];

  for (const post of realPosts) {
    const categoryId = categoryRecords[post.categoryName];
    if (!categoryId) continue;

    const existingPost = await prisma.post.findFirst({
      where: { title: post.title },
    });

    if (!existingPost) {
      await prisma.post.create({
        data: {
          title: post.title,
          summary: post.summary,
          categoryId,
          type: post.type,
          source: post.source,
          link: post.link,
          deadlineAt: post.deadlineAt,
          pinned: post.pinned,
          priority: post.priority,
          createdById: admin.id,
        },
      });
    }
  }

  console.info(`Seeded ${categories.length} categories, admin ${rollNo}, and ${realPosts.length} real campus posts.`);
}

main().finally(() => prisma.$disconnect());
